import User from '../models/User.js';
import { updateSingleUser } from '../services/ratingUpdater.js';
import { PLATFORMS } from '../../../shared/constants.js';

/**
 * Shared helper: update a user's handles and re-fetch ratings for changed handles.
 * @param {string} userId
 * @param {object} handles - { codeforces?, atcoder?, leetcode?, codechef? }
 *   - string value: set handle
 *   - null: clear handle
 *   - undefined/missing: leave unchanged
 * @returns {{ user, ratingErrors }}
 */
async function updateUserHandles(userId, handles) {
  const user = await User.findById(userId);
  if (!user) return { user: null, ratingErrors: [] };

  let changed = false;
  for (const platform of PLATFORMS) {
    if (handles[platform] !== undefined) {
      const newHandle = handles[platform]?.trim() || null;
      if (user.handles[platform] !== newHandle) {
        user.handles[platform] = newHandle;
        changed = true;
      }
    }
  }

  if (!changed) {
    return { user: user.toObject(), ratingErrors: [] };
  }

  await user.save();

  // Re-fetch ratings for the user
  let ratingErrors = [];
  try {
    ratingErrors = await updateSingleUser(user);
  } catch (error) {
    console.error(`Failed to fetch ratings for ${user.name}:`, error);
    ratingErrors.push({ platform: 'all', error: 'Failed to fetch ratings' });
  }

  const updatedUser = await User.findById(userId).lean();
  return { user: updatedUser, ratingErrors };
}

const createUser = async (req, res) => {
  try {
    const { name, handles } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Name is required'
      });
    }

    // Check if user with same name already exists
    const existingUser = await User.findOne({
      name: { $regex: new RegExp(`^${name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
    });

    let user;
    let ratingErrors = [];

    if (existingUser) {
      // User exists (possibly from space tracking) — promote to global and update handles
      existingUser.isGlobal = true;
      for (const platform of PLATFORMS) {
        const newHandle = handles?.[platform]?.trim() || null;
        if (newHandle) existingUser.handles[platform] = newHandle;
      }
      await existingUser.save();

      try {
        ratingErrors = await updateSingleUser(existingUser);
      } catch (error) {
        console.error(`Failed to fetch ratings for ${existingUser.name}:`, error);
        ratingErrors.push({ platform: 'all', error: 'Failed to fetch ratings' });
      }

      user = await User.findById(existingUser._id).lean();
    } else {
      // Create new user — global admin-created users are visible on global leaderboard
      const userData = {
        name: name.trim(),
        isGlobal: true,
        handles: {
          codeforces: handles?.codeforces?.trim() || null,
          atcoder: handles?.atcoder?.trim() || null,
          codechef: handles?.codechef?.trim() || null,
          leetcode: handles?.leetcode?.trim() || null
        }
      };

      const newUser = await User.create(userData);

      try {
        ratingErrors = await updateSingleUser(newUser);
        console.log(`Ratings fetched for user: ${newUser.name}, errors: ${ratingErrors.length}`);
      } catch (error) {
        console.error(`Failed to fetch ratings for user ${newUser.name}:`, error);
        ratingErrors.push({ platform: 'all', error: 'Failed to fetch ratings' });
      }

      user = await User.findById(newUser._id).lean();
    }

    // Prepare response
    const response = {
      success: true,
      data: user
    };

    // Include rating errors if any occurred
    if (ratingErrors.length > 0) {
      response.ratingErrors = ratingErrors;
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { handles } = req.body;

    if (!handles || typeof handles !== 'object' || Array.isArray(handles)) {
      return res.status(400).json({ success: false, error: 'Handles object is required' });
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
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export { createUser, updateUser, updateUserHandles };
