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
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this name already exists'
      });
    }

    // Prepare user data
    const userData = {
      name: name.trim(),
      handles: {
        codeforces: handles?.codeforces?.trim() || null,
        atcoder: handles?.atcoder?.trim() || null,
        codechef: handles?.codechef?.trim() || null,
        leetcode: handles?.leetcode?.trim() || null
      }
    };

    // Create user
    const user = await User.create(userData);

    // Automatically fetch ratings from all platforms
    let ratingErrors = [];
    try {
      ratingErrors = await updateSingleUser(user);
      console.log(`Ratings fetched for user: ${user.name}, errors: ${ratingErrors.length}`);
    } catch (error) {
      // Log error but don't fail user creation
      console.error(`Failed to fetch ratings for user ${user.name}:`, error);
      ratingErrors.push({ platform: 'all', error: 'Failed to fetch ratings' });
    }

    // Fetch updated user with ratings
    const updatedUser = await User.findById(user._id).lean();

    // Prepare response
    const response = {
      success: true,
      data: updatedUser
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
