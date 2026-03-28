import User from '../models/User.js';
import { PLATFORMS } from '../services/ratingUpdater.js';
import { fetchAllHistory } from '../services/historyFetcher.js';

// GET /api/leaderboard - Get full leaderboard sorted by aggregate score
const getLeaderboard = async (req, res) => {
  try {
    const { sortBy = 'aggregate', order = 'desc' } = req.query;

    const dir = order === 'desc' ? -1 : 1;
    const platformSortOptions = Object.fromEntries(
      PLATFORMS.map(p => [p, { [`ratings.${p}.rating`]: dir }])
    );
    const sortOptions = {
      aggregate: { aggregateScore: dir },
      name: { name: dir },
      ...platformSortOptions
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
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, error: 'Invalid user ID format' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/leaderboard/stats - Get leaderboard statistics
const getStats = async (req, res) => {
  try {
    // Build platform user counts dynamically from PLATFORMS
    const platformUserCounts = Object.fromEntries(
      PLATFORMS.map(p => [
        `${p}Users`,
        { $sum: { $cond: [{ $and: [{ $ne: [`$ratings.${p}.rating`, null] }, { $gt: [`$ratings.${p}.rating`, 0] }] }, 1, 0] } }
      ])
    );

    const stats = await User.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          avgAggregate: { $avg: '$aggregateScore' },
          maxAggregate: { $max: '$aggregateScore' },
          ...platformUserCounts
        }
      }
    ]);

    const defaultStats = {
      totalUsers: 0,
      avgAggregate: 0,
      maxAggregate: 0,
      ...Object.fromEntries(PLATFORMS.map(p => [`${p}Users`, 0]))
    };

    res.json({
      success: true,
      data: stats[0] || defaultStats
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/leaderboard/user/:id/history - Get user's rating history from all platforms
const getUserHistory = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Fetch history from all platforms in parallel
    const history = await fetchAllHistory(user.handles || {});

    res.json({
      success: true,
      data: {
        user: {
          _id: user._id,
          name: user.name,
          handles: user.handles,
          ratings: user.ratings,
          aggregateScore: user.aggregateScore
        },
        history
      }
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, error: 'Invalid user ID format' });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

export { getLeaderboard, getPlatformLeaderboard, getUserDetails, getStats, getUserHistory };
