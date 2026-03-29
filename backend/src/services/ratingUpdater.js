import User from '../models/User.js';
import UpdateLog from '../models/UpdateLog.js';
import fetchers from './platformFetchers/index.js';
import { getRankFromRating as getLeetCodeRank } from './platformFetchers/leetcode.js';
import { PLATFORMS } from '../../../shared/constants.js';

// Delay between platform API requests for the same user (ms)
const PLATFORM_REQUEST_DELAY_MS = 100;
// Delay between users during batch update (ms)
const USER_UPDATE_DELAY_MS = 500;

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
 * Normalize a rating to 0-100 scale using piecewise linear interpolation
 * @param {string} platform - The platform name
 * @param {number} rating - The raw rating
 * @returns {number} Normalized rating (0-100)
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
 * Calculate aggregate score as average of normalized ratings, mapped to a 1-10 star scale
 * @param {object} ratings - Platform ratings object
 * @returns {number} Star rating (1.0-10.0), or 0 if no valid ratings
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

  if (platformCount === 0) return 0;
  const avg = totalNormalized / platformCount;
  const starScore = 1 + (avg / 100) * 9;
  return Math.round(starScore * 10) / 10;
}

async function updateSingleUser(user) {
  const updates = {};
  const errors = [];
  const currentRatings = user.ratings?.toObject?.() || user.ratings || {};

  const activePlatforms = PLATFORMS.filter(p => user.handles?.[p] && fetchers[p]);
  for (let i = 0; i < activePlatforms.length; i++) {
    const platform = activePlatforms[i];
    try {
      const result = await fetchers[platform](user.handles[platform]);

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
        maxRating: currentRatings[platform]?.maxRating || null,
        rank: null,
        maxRank: null,
        lastUpdated: new Date(),
        error: errorMsg
      };
      errors.push({ userId: user._id, platform, error: errorMsg });
    }
    if (i < activePlatforms.length - 1) {
      await new Promise(r => setTimeout(r, PLATFORM_REQUEST_DELAY_MS));
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
 * Run the update using a pre-created lock document
 * @param {object} lock - The lock document (UpdateLog with LOCK_ID)
 * @param {function} releaseLock - Function to release the lock (status, updates)
 */
async function updateAllUsers(lock, releaseLock) {
  const allErrors = [];
  let updated = 0;

  try {
    const users = await User.find({ isActive: true });
    console.log(`Starting update for ${users.length} users...`);

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
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

      if (i < users.length - 1) {
        await new Promise(r => setTimeout(r, USER_UPDATE_DELAY_MS));
      }
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
