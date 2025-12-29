import { updateAllUsers, updateSingleUser } from '../services/ratingUpdater.js';
import User from '../models/User.js';
import UpdateLog from '../models/UpdateLog.js';

// POST /api/update/trigger - Manually trigger update (for cron endpoint)
const triggerUpdate = async (req, res) => {
  try {
    // Verify cron secret for security
    const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
    if (cronSecret !== process.env.CRON_SECRET) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Check if an update is already running
    const runningUpdate = await UpdateLog.findOne({ status: 'running' });
    if (runningUpdate) {
      return res.status(409).json({
        success: false,
        error: 'An update is already in progress',
        startedAt: runningUpdate.startedAt
      });
    }

    // Start update
    const result = await updateAllUsers();
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/update/user/:id - Update single user
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const errors = await updateSingleUser(user);
    const updatedUser = await User.findById(req.params.id).lean();

    res.json({
      success: true,
      data: updatedUser,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/update/status - Get last update status
const getUpdateStatus = async (req, res) => {
  try {
    const lastUpdate = await UpdateLog.findOne()
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: lastUpdate || null
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export { triggerUpdate, updateUser, getUpdateStatus };
