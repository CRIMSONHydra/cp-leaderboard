import User from '../models/User.js';
import UpdateLog from '../models/UpdateLog.js';
import fetchers from './platformFetchers/index.js';
import { getRankFromRating as getLeetCodeRank } from './platformFetchers/leetcode.js';
import { PLATFORMS } from '../../../shared/constants.js';

// Normalization tiers for each platform
// Maps platform ratings to a common 0-100 scale based on skill levels
const NORMALIZATION_TIERS = {
  codeforces: [
    { rating: 800, normalized: 0 },    // Newbie
    { rating: 1200, normalized: 20 },  // Pupil
    { rating: 1400, normalized: 30 },  // Specialist
    { rating: 1600, normalized: 40 },  // Expert
    { rating: 1900, normalized: 50 },  // Candidate Master
    { rating: 2100, normalized: 65 },  // Master
    { rating: 2400, normalized: 80 },  // Grandmaster
    { rating: 3000, normalized: 95 },  // Legendary GM
    { rating: 3500, normalized: 100 }  // Top
  ],
  atcoder: [
    { rating: 400, normalized: 0 },    // Gray
    { rating: 800, normalized: 20 },   // Brown
    { rating: 1200, normalized: 30 },  // Green
    { rating: 1400, normalized: 40 },  // Cyan
    { rating: 2000, normalized: 50 },  // Blue
    { rating: 2400, normalized: 65 },  // Yellow
    { rating: 2800, normalized: 80 },  // Orange
    { rating: 3200, normalized: 95 },  // Red
    { rating: 4000, normalized: 100 }  // Top
  ],
  leetcode: [
    { rating: 1200, normalized: 0 },   // Beginner
    { rating: 1500, normalized: 20 },  // Below average
    { rating: 1700, normalized: 30 },  // Knight level
    { rating: 1900, normalized: 40 },  // Advanced
    { rating: 2100, normalized: 50 },  // Guardian level
    { rating: 2400, normalized: 65 },  // Expert
    { rating: 2700, normalized: 80 },  // Master
    { rating: 3000, normalized: 95 },  // Top
    { rating: 3500, normalized: 100 }  // Peak
  ],
  codechef: [
    { rating: 1000, normalized: 0 },   // 1★
    { rating: 1400, normalized: 20 },  // 2★
    { rating: 1600, normalized: 30 },  // 3★
    { rating: 1800, normalized: 40 },  // 4★
    { rating: 2000, normalized: 50 },  // 5★
    { rating: 2200, normalized: 65 },  // 6★
    { rating: 2500, normalized: 80 },  // 7★
    { rating: 3000, normalized: 95 },  // Top 7★
    { rating: 3500, normalized: 100 }  // Peak
  ]
};

/**
 * Convert a platform-specific numeric rating into a 0–100 normalized score using defined tiers.
 * @param {string} platform - Platform key corresponding to entries in NORMALIZATION_TIERS.
 * @param {number} rating - The raw numeric rating for the platform.
 * @returns {number|null} Normalized rating between 0 and 100. Returns `null` if the platform is unknown or `rating` is null/undefined.
 */
function normalizeRating(platform, rating) {
  const tiers = NORMALIZATION_TIERS[platform];
  if (!tiers || rating == null) return null;

  // Handle below minimum
  if (rating <= tiers[0].rating) {
    return tiers[0].normalized;
  }

  // Handle above maximum
  if (rating >= tiers[tiers.length - 1].rating) {
    return tiers[tiers.length - 1].normalized;
  }

  // Find the two tiers to interpolate between
  for (let i = 0; i < tiers.length - 1; i++) {
    const lower = tiers[i];
    const upper = tiers[i + 1];

    if (rating >= lower.rating && rating < upper.rating) {
      // Linear interpolation
      const ratingRange = upper.rating - lower.rating;
      const normalizedRange = upper.normalized - lower.normalized;
      const ratingOffset = rating - lower.rating;
      
      return lower.normalized + (ratingOffset / ratingRange) * normalizedRange;
    }
  }

  return 0;
}

/**
 * Compute an overall score by averaging available per-platform normalized ratings.
 * Ignores platforms that have no rating or whose rating is marked with an error.
 * @param {object} ratings - Map of platform keys to rating objects (each may contain `rating`, `maxRating`, `maxRank`, `error`, etc.).
 * @returns {number} Rounded average score on a 0–100 scale, or `0` if no valid platform ratings are present.
 */
function calculateAggregateScore(ratings) {
  let totalNormalized = 0;
  let platformCount = 0;

  for (const platform of PLATFORMS) {
    const data = ratings[platform];
    if (data?.rating && !data.error) {
      const normalized = normalizeRating(platform, data.rating);
      if (normalized !== null) {
        totalNormalized += normalized;
        platformCount++;
      }
    }
  }

  return platformCount > 0 ? Math.round(totalNormalized / platformCount) : 0;
}

/**
 * Update a single user's platform ratings, preserve per-platform max values, compute an aggregate score, and persist the changes.
 *
 * Updates the user's per-platform rating entries (including preserving or deriving `maxRating`/`maxRank` where appropriate),
 * recalculates `aggregateScore`, sets `lastFullUpdate`, and saves all changes to the database.
 *
 * @param {Object} user - A user document containing at minimum `_id`, `handles` (per-platform handles), and optional `ratings`.
 * @returns {Array<Object>} An array of error records encountered during the update; each record contains `{ userId, platform, error }`.
 */
async function updateSingleUser(user) {
  const updates = {};
  const errors = [];
  const currentRatings = user.ratings?.toObject?.() || user.ratings || {};

  for (const platform of PLATFORMS) {
    const handle = user.handles?.[platform];
    if (handle && fetchers[platform]) {
      try {
        const result = await fetchers[platform](handle);
        
        // Preserve maxRating if current stored value is higher
        const storedMaxRating = currentRatings[platform]?.maxRating;
        const newRating = result.rating;
        const fetchedMaxRating = result.maxRating;
        
        // Determine the actual maxRating
        let actualMaxRating = fetchedMaxRating;
        if (storedMaxRating && (!fetchedMaxRating || storedMaxRating > fetchedMaxRating)) {
          actualMaxRating = storedMaxRating;
        }
        if (newRating && (!actualMaxRating || newRating > actualMaxRating)) {
          actualMaxRating = newRating;
        }
        
        // Update maxRating in result
        result.maxRating = actualMaxRating;
        
        // Derive maxRank from maxRating for LeetCode (it doesn't provide maxRank)
        if (platform === 'leetcode' && actualMaxRating && !result.maxRank) {
          result.maxRank = getLeetCodeRank(actualMaxRating);
        }
        
        updates[`ratings.${platform}`] = result;
        if (result.error) {
          errors.push({ userId: user._id, platform, error: result.error });
        }
      } catch (error) {
        const errorMsg = error.message || 'Unknown error';
        updates[`ratings.${platform}`] = {
          rating: null,
          maxRating: currentRatings[platform]?.maxRating || null, // Preserve stored maxRating on error
          rank: null,
          maxRank: null,
          lastUpdated: new Date(),
          error: errorMsg
        };
        errors.push({ userId: user._id, platform, error: errorMsg });
      }
      // Small delay between platform requests for the same user
      await new Promise(r => setTimeout(r, 100));
    }
  }

  // Calculate new aggregate score
  const mergedRatings = { ...currentRatings };
  for (const [key, value] of Object.entries(updates)) {
    const platform = key.replace('ratings.', '');
    mergedRatings[platform] = value;
  }
  updates.aggregateScore = calculateAggregateScore(mergedRatings);
  updates.lastFullUpdate = new Date();

  await User.findByIdAndUpdate(user._id, { $set: updates });
  return errors;
}

/**
 * Perform a full ratings update for all active users while tracking progress via a pre-created lock.
 *
 * Iterates all active users, runs per-user updates, accumulates per-user errors, periodically persists progress
 * to the provided lock document, and releases the lock with a final status on completion or failure.
 * @param {object} lock - The pre-created UpdateLog document used as a lock (must contain _id and LOCK_ID).
 * @param {function(string, object): Promise<void>} releaseLock - Function to release the lock; called with a status
 *   of 'completed' or 'failed' and an updates object describing usersUpdated and errors.
 * @returns {{success: true, usersUpdated: number, errors: Array<object>}} An object summarizing the run:
 *   the number of users updated and a list of collected error entries.
 * @throws {Error} Re-throws any unexpected error that aborts the overall update after ensuring the lock is released with
 *   a 'failed' status and error details.
 */
async function updateAllUsers(lock, releaseLock) {
  const allErrors = [];
  let updated = 0;

  try {
    const users = await User.find({ isActive: true });
    console.log(`Starting update for ${users.length} users...`);

    for (const user of users) {
      try {
        console.log(`Updating user: ${user.name}`);
        const errors = await updateSingleUser(user);
        allErrors.push(...errors);
        updated++;
        
        // Update progress periodically (every 5 users)
        if (updated % 5 === 0) {
          await UpdateLog.findByIdAndUpdate(lock._id, {
            $set: { usersUpdated: updated }
          });
        }
      } catch (error) {
        console.error(`Failed to update user ${user.name}:`, error.message);
        allErrors.push({ userId: user._id, platform: 'all', error: error.message });
      }

      // Delay between users to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));
    }

    // Release lock with success status
    await releaseLock('completed', {
      usersUpdated: updated,
      errors: allErrors
    });

    console.log(`Update completed. ${updated} users updated, ${allErrors.length} errors.`);
    return { success: true, usersUpdated: updated, errors: allErrors };
  } catch (error) {
    console.error('Update failed:', error);
    
    // Release lock with failed status
    await releaseLock('failed', {
      usersUpdated: updated,
      errors: [...allErrors, { platform: 'system', error: error.message }]
    });
    
    throw error;
  }
}

export { 
  updateAllUsers, 
  updateSingleUser, 
  calculateAggregateScore, 
  normalizeRating, 
  PLATFORMS, 
  NORMALIZATION_TIERS 
};