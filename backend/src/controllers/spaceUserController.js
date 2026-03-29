import Space from '../models/Space.js';
import User from '../models/User.js';
import { PLATFORMS, updateSingleUser } from '../services/ratingUpdater.js';
import { updateUserHandles } from './userController.js';

const addUserToSpace = async (req, res) => {
  try {
    const { userId } = req.body;
    const space = req.space;

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Atomic: only add if not already tracked
    const result = await Space.updateOne(
      { _id: space._id, trackedUsers: { $ne: userId } },
      { $addToSet: { trackedUsers: userId } }
    );

    if (result.modifiedCount === 0) {
      return res.status(409).json({ success: false, error: 'User already in this space' });
    }

    res.json({ success: true, data: { userId, name: user.name } });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, error: 'Invalid user ID format' });
    }
    console.error('Add user to space error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const removeUserFromSpace = async (req, res) => {
  try {
    const { userId } = req.params;
    const space = req.space;

    const result = await Space.updateOne(
      { _id: space._id, trackedUsers: userId },
      { $pull: { trackedUsers: userId } }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ success: false, error: 'User not in this space' });
    }

    res.json({ success: true, message: 'User removed from space' });
  } catch (error) {
    console.error('Remove user from space error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const getSpaceLeaderboard = async (req, res) => {
  try {
    const space = req.space;
    const { sortBy = 'aggregate', order = 'desc' } = req.query;

    const validSortOptions = ['aggregate', 'name', ...PLATFORMS];
    if (!validSortOptions.includes(sortBy)) {
      return res.status(400).json({
        success: false,
        error: `Invalid sortBy. Valid options: ${validSortOptions.join(', ')}`
      });
    }

    if (order !== 'asc' && order !== 'desc') {
      return res.status(400).json({ success: false, error: 'Invalid order. Valid options: asc, desc' });
    }

    if (space.trackedUsers.length === 0) {
      return res.json({ success: true, count: 0, data: [] });
    }

    const dir = order === 'desc' ? -1 : 1;
    const platformSortOptions = Object.fromEntries(
      PLATFORMS.map(p => [p, { [`ratings.${p}.rating`]: dir }])
    );
    const sortOptions = {
      aggregate: { aggregateScore: dir },
      name: { name: dir },
      ...platformSortOptions
    };

    const users = await User.find({
      _id: { $in: space.trackedUsers },
      isActive: true
    })
      .select('name handles ratings aggregateScore lastFullUpdate')
      .sort(sortOptions[sortBy] || sortOptions.aggregate)
      .lean();

    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    console.error('Space leaderboard error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, error: 'Search query must be at least 2 characters' });
    }

    // Escape regex special chars to prevent ReDoS
    const escaped = q.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    const users = await User.find({
      isActive: true,
      $or: [
        { name: regex },
        { 'handles.codeforces': regex },
        { 'handles.atcoder': regex },
        { 'handles.leetcode': regex },
        { 'handles.codechef': regex }
      ]
    })
      .select('name handles aggregateScore')
      .limit(20)
      .lean();

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

/**
 * Find an existing User whose handles match ALL provided non-null handles
 * on the same platforms (case-insensitive). Only returns a match if every
 * provided handle is present on the same user.
 */
async function findExactMatchByHandles(handles) {
  const conditions = [];
  for (const platform of PLATFORMS) {
    const handle = handles?.[platform]?.trim();
    if (handle) {
      const escaped = handle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      conditions.push({ [`handles.${platform}`]: new RegExp(`^${escaped}$`, 'i') });
    }
  }
  if (conditions.length === 0) return null;
  return User.findOne({ $and: conditions, isActive: true });
}

const createAndTrackUser = async (req, res) => {
  try {
    const { name, handles } = req.body;
    const space = req.space;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Name is required' });
    }

    const hasAnyHandle = PLATFORMS.some(p => handles?.[p]?.trim());
    if (!hasAnyHandle) {
      return res.status(400).json({ success: false, error: 'At least one platform handle is required' });
    }

    // Try to find existing user with matching handles
    let user = await findExactMatchByHandles(handles);
    let deduplicated = false;

    if (user) {
      deduplicated = true;
    } else {
      // Create new user
      const userData = {
        name: name.trim(),
        handles: Object.fromEntries(
          PLATFORMS.map(p => [p, handles?.[p]?.trim() || null])
        )
      };
      user = await User.create(userData);

      // Fetch ratings
      try {
        await updateSingleUser(user);
      } catch (err) {
        console.error(`Failed to fetch ratings for ${user.name}:`, err.message);
      }

      // Re-fetch with updated ratings
      user = await User.findById(user._id).lean();
    }

    // Add to space (atomic, skip if already tracked)
    const result = await Space.updateOne(
      { _id: space._id, trackedUsers: { $ne: user._id } },
      { $addToSet: { trackedUsers: user._id } }
    );

    if (result.modifiedCount === 0) {
      return res.status(409).json({
        success: false,
        error: 'User already tracked in this space',
        data: user
      });
    }

    res.status(201).json({
      success: true,
      data: user,
      deduplicated
    });
  } catch (error) {
    console.error('Create and track user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const updateTrackedUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { handles } = req.body;
    const space = req.space;

    if (!handles || typeof handles !== 'object' || Array.isArray(handles)) {
      return res.status(400).json({ success: false, error: 'Handles object is required' });
    }

    // Verify user is tracked in this space
    const isTracked = space.trackedUsers.some(id => id.toString() === userId);
    if (!isTracked) {
      return res.status(404).json({ success: false, error: 'User not tracked in this space' });
    }

    const { user, ratingErrors } = await updateUserHandles(userId, handles);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const response = { success: true, data: user };
    if (ratingErrors.length > 0) {
      response.ratingErrors = ratingErrors;
    }

    res.json(response);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ success: false, error: 'Invalid user ID format' });
    }
    console.error('Update tracked user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export { addUserToSpace, removeUserFromSpace, getSpaceLeaderboard, searchUsers, createAndTrackUser, updateTrackedUser };
