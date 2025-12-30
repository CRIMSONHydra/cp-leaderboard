import { updateAllUsers, updateSingleUser } from '../services/ratingUpdater.js';
import User from '../models/User.js';
import UpdateLog from '../models/UpdateLog.js';

// Stale update timeout (30 minutes)
const STALE_UPDATE_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Atomically try to acquire an update lock by creating a running UpdateLog
 * and checking if we're the only one running.
 * 
 * This prevents the race condition where:
 * 1. Request A checks for running updates (none found)
 * 2. Request B checks for running updates (none found)
 * 3. Both create their own UpdateLogs and start running
 * 
 * @returns {object} { success: boolean, log?: UpdateLog, existingLog?: UpdateLog }
 */
async function acquireUpdateLock() {
  // First, create our log immediately (optimistic approach)
  const ourLog = await UpdateLog.create({ startedAt: new Date(), status: 'running' });
  
  // Now check if there are any OTHER running logs that were created before ours
  // (using createdAt timestamp as the tie-breaker)
  const earlierRunningLog = await UpdateLog.findOne({
    status: 'running',
    _id: { $ne: ourLog._id },
    createdAt: { $lte: ourLog.createdAt }
  }).sort({ createdAt: 1 });
  
  if (earlierRunningLog) {
    // Another request beat us - delete our log and fail
    await UpdateLog.findByIdAndDelete(ourLog._id);
    return { success: false, existingLog: earlierRunningLog };
  }
  
  // We won the race
  return { success: true, log: ourLog };
}

// POST /api/update/trigger - Manually trigger update (for cron endpoint)
const triggerUpdate = async (req, res) => {
  try {
    // Verify cron secret for security
    // Accept secret from header (preferred) or request body (only for POST over TLS)
    let cronSecret = req.headers['x-cron-secret'];
    
    // For POST requests over TLS, also allow secret in request body
    // Check if request is secure (HTTPS or behind proxy with x-forwarded-proto)
    const isSecure = req.secure || 
                     req.protocol === 'https' || 
                     req.headers['x-forwarded-proto'] === 'https';
    
    if (!cronSecret && isSecure && req.method === 'POST' && req.body?.secret) {
      cronSecret = req.body.secret;
    }
    
    // Validate secret exists and matches
    if (!cronSecret || cronSecret !== process.env.CRON_SECRET) {
      return res.status(401).json({ 
        success: false, 
        error: 'Unauthorized - Invalid or missing cron secret' 
      });
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

    // Force flag: mark any running updates as failed before starting new one
    if (forceUpdate) {
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

    // Atomically acquire the update lock
    const lockResult = await acquireUpdateLock();
    
    if (!lockResult.success) {
      const existingLog = lockResult.existingLog;
      const runningForMs = Date.now() - new Date(existingLog.startedAt).getTime();
      const runningForMins = Math.round(runningForMs / 60000);
      return res.status(409).json({
        success: false,
        error: `An update is already in progress (running for ${runningForMins} min)`,
        startedAt: existingLog.startedAt,
        hint: 'Add ?force=true to override if the update is stuck'
      });
    }

    // Start update with our acquired log
    const result = await updateAllUsers(lockResult.log);
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
