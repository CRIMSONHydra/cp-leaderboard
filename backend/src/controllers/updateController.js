import { updateAllUsers, updateSingleUser } from '../services/ratingUpdater.js';
import User from '../models/User.js';
import UpdateLog from '../models/UpdateLog.js';

// Stale update timeout (30 minutes)
const STALE_UPDATE_TIMEOUT_MS = 30 * 60 * 1000;

// POST /api/update/trigger - Manually trigger update (for cron endpoint)
const triggerUpdate = async (req, res) => {
  try {
    // Verify cron secret for security
    const cronSecret = req.headers['x-cron-secret'] || req.query.secret;
    if (cronSecret !== process.env.CRON_SECRET) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    // Check for force flag to skip running check
    const forceUpdate = req.query.force === 'true';

    // Mark stale updates as failed (running for more than 30 minutes)
    const staleThreshold = new Date(Date.now() - STALE_UPDATE_TIMEOUT_MS);
    const staleUpdates = await UpdateLog.updateMany(
      { 
        status: 'running', 
        startedAt: { $lt: staleThreshold } 
      },
      { 
        $set: { 
          status: 'failed', 
          completedAt: new Date(),
          errors: [{ error: 'Update timed out (marked as stale)' }]
        } 
      }
    );
    
    if (staleUpdates.modifiedCount > 0) {
      console.log(`Marked ${staleUpdates.modifiedCount} stale update(s) as failed`);
    }

    // Check if an update is already running (unless force flag is set)
    if (!forceUpdate) {
      const runningUpdate = await UpdateLog.findOne({ status: 'running' });
      if (runningUpdate) {
        const runningForMs = Date.now() - new Date(runningUpdate.startedAt).getTime();
        const runningForMins = Math.round(runningForMs / 60000);
        return res.status(409).json({
          success: false,
          error: `An update is already in progress (running for ${runningForMins} min)`,
          startedAt: runningUpdate.startedAt,
          hint: 'Add ?force=true to override if the update is stuck'
        });
      }
    } else {
      // Force flag: mark any running updates as failed before starting new one
      await UpdateLog.updateMany(
        { status: 'running' },
        { 
          $set: { 
            status: 'failed', 
            completedAt: new Date(),
            errors: [{ error: 'Forcefully terminated by new update request' }]
          } 
        }
      );
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
