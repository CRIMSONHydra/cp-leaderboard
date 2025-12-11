const User = require('../models/User');
const { PLATFORMS } = require('../services/ratingUpdater');

// GET /api/leaderboard - Get full leaderboard sorted by aggregate score
const getLeaderboard = async (req, res) => {
  try {
    const { sortBy = 'aggregate', order = 'desc' } = req.query;

    const sortOptions = {
      aggregate: { aggregateScore: order === 'desc' ? -1 : 1 },
      codeforces: { 'ratings.codeforces.rating': order === 'desc' ? -1 : 1 },
      atcoder: { 'ratings.atcoder.rating': order === 'desc' ? -1 : 1 },
      leetcode: { 'ratings.leetcode.rating': order === 'desc' ? -1 : 1 },
      codechef: { 'ratings.codechef.rating': order === 'desc' ? -1 : 1 },
      name: { name: order === 'desc' ? -1 : 1 }
    };

    const users = await User.find({ isActive: true })
      .select('name handles ratings aggregateScore lastFullUpdate')
      .sort(sortOptions[sortBy] || sortOptions.aggregate)
      .lean();

    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/leaderboard/platform/:platform - Get platform-specific leaderboard
const getPlatformLeaderboard = async (req, res) => {
  try {
    const { platform } = req.params;

    if (!PLATFORMS.includes(platform)) {
      return res.status(400).json({
        success: false,
        error: `Invalid platform. Valid options: ${PLATFORMS.join(', ')}`
      });
    }

    const users = await User.find({
      isActive: true,
      [`handles.${platform}`]: { $ne: null, $exists: true },
      [`ratings.${platform}.rating`]: { $ne: null }
    })
      .select(`name handles.${platform} ratings.${platform}`)
      .sort({ [`ratings.${platform}.rating`]: -1 })
      .lean();

    res.json({
      success: true,
      platform,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/leaderboard/user/:id - Get single user details
const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/leaderboard/stats - Get leaderboard statistics
const getStats = async (req, res) => {
  try {
    const stats = await User.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          avgAggregate: { $avg: '$aggregateScore' },
          maxAggregate: { $max: '$aggregateScore' },
          cfUsers: {
            $sum: { $cond: [{ $and: [{ $ne: ['$ratings.codeforces.rating', null] }, { $gt: ['$ratings.codeforces.rating', 0] }] }, 1, 0] }
          },
          acUsers: {
            $sum: { $cond: [{ $and: [{ $ne: ['$ratings.atcoder.rating', null] }, { $gt: ['$ratings.atcoder.rating', 0] }] }, 1, 0] }
          },
          lcUsers: {
            $sum: { $cond: [{ $and: [{ $ne: ['$ratings.leetcode.rating', null] }, { $gt: ['$ratings.leetcode.rating', 0] }] }, 1, 0] }
          },
          ccUsers: {
            $sum: { $cond: [{ $and: [{ $ne: ['$ratings.codechef.rating', null] }, { $gt: ['$ratings.codechef.rating', 0] }] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        totalUsers: 0,
        avgAggregate: 0,
        maxAggregate: 0,
        cfUsers: 0,
        acUsers: 0,
        lcUsers: 0,
        ccUsers: 0
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getLeaderboard,
  getPlatformLeaderboard,
  getUserDetails,
  getStats
};
