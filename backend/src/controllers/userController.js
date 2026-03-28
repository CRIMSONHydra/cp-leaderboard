import User from '../models/User.js';
import { updateSingleUser } from '../services/ratingUpdater.js';

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
      console.error(`Failed to fetch ratings for user ${user.name}:`, error.message);
      ratingErrors.push({ platform: 'all', error: error.message });
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

export { createUser };

