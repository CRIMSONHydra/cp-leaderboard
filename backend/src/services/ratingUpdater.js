import User from '../models/User.js';
import UpdateLog from '../models/UpdateLog.js';
import fetchers from './platformFetchers/index.js';

// Aggregate score calculation weights
// Platforms have similar scales (~800-3500), slight adjustments for typical ranges
const WEIGHTS = {
  codeforces: 1.0,
  atcoder: 1.0,
  leetcode: 1.2,  // LeetCode contest ratings tend to be slightly lower
  codechef: 0.9   // CodeChef ratings can go higher
};

const PLATFORMS = ['codeforces', 'atcoder', 'leetcode', 'codechef'];

function calculateAggregateScore(ratings) {
  let totalScore = 0;
  let platformCount = 0;

  for (const platform of PLATFORMS) {
    const data = ratings[platform];
    if (data?.rating && !data.error) {
      totalScore += data.rating * (WEIGHTS[platform] || 1);
      platformCount++;
    }
  }

  return platformCount > 0 ? Math.round(totalScore / platformCount) : 0;
}

async function updateSingleUser(user) {
  const updates = {};
  const errors = [];

  for (const platform of PLATFORMS) {
    const handle = user.handles?.[platform];
    if (handle && fetchers[platform]) {
      try {
        const result = await fetchers[platform](handle);
        updates[`ratings.${platform}`] = result;
        if (result.error) {
          errors.push({ userId: user._id, platform, error: result.error });
        }
      } catch (error) {
        const errorMsg = error.message || 'Unknown error';
        updates[`ratings.${platform}`] = {
          rating: null,
          maxRating: null,
          rank: null,
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
  const currentRatings = user.ratings?.toObject?.() || user.ratings || {};
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

async function updateAllUsers() {
  const log = await UpdateLog.create({ startedAt: new Date() });
  const allErrors = [];

  try {
    const users = await User.find({ isActive: true });
    let updated = 0;

    console.log(`Starting update for ${users.length} users...`);

    for (const user of users) {
      try {
        console.log(`Updating user: ${user.name}`);
        const errors = await updateSingleUser(user);
        allErrors.push(...errors);
        updated++;
      } catch (error) {
        console.error(`Failed to update user ${user.name}:`, error.message);
        allErrors.push({ userId: user._id, platform: 'all', error: error.message });
      }

      // Delay between users to avoid rate limiting
      await new Promise(r => setTimeout(r, 500));
    }

    await UpdateLog.findByIdAndUpdate(log._id, {
      completedAt: new Date(),
      status: 'completed',
      usersUpdated: updated,
      errors: allErrors
    });

    console.log(`Update completed. ${updated} users updated, ${allErrors.length} errors.`);
    return { success: true, usersUpdated: updated, errors: allErrors };
  } catch (error) {
    console.error('Update failed:', error);
    await UpdateLog.findByIdAndUpdate(log._id, {
      completedAt: new Date(),
      status: 'failed',
      errors: [{ error: error.message }]
    });
    throw error;
  }
}

export { updateAllUsers, updateSingleUser, calculateAggregateScore, PLATFORMS, WEIGHTS };
