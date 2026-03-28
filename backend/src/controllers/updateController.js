import { updateAllUsers, updateSingleUser } from '../services/ratingUpdater.js';
import User from '../models/User.js';
import UpdateLog from '../models/UpdateLog.js';
import {
  LOCK_ID,
  STALE_UPDATE_TIMEOUT_MS,
  generateOwnerId,
  acquireUpdateLock,
  releaseUpdateLock
} from '../services/updateLock.js';

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

    // Check for stale lock (running for more than 30 minutes)
    const existingLock = await UpdateLog.findById(LOCK_ID);
    if (existingLock && existingLock.status === 'running') {
      const runningForMs = Date.now() - new Date(existingLock.startedAt).getTime();
      
      if (runningForMs > STALE_UPDATE_TIMEOUT_MS) {
        console.log('Detected stale lock, marking as failed');
        await releaseUpdateLock('failed', {
          errors: [{ error: 'Update timed out (marked as stale)' }]
        });
      } else if (!forceUpdate) {
        // Lock is active and not stale
        const runningForMins = Math.round(runningForMs / 60000);
        return res.status(409).json({
          success: false,
          error: `An update is already in progress (running for ${runningForMins} min)`,
          startedAt: existingLock.startedAt,
          owner: existingLock.owner,
          hint: 'Add ?force=true to override if the update is stuck'
        });
      }
    }

    // Force flag: forcefully release any running lock
    if (forceUpdate && existingLock && existingLock.status === 'running') {
      console.log('Force flag set, releasing existing lock');
      await releaseUpdateLock('failed', {
        errors: [{ error: 'Forcefully terminated by new update request' }]
      });
    }

    // Atomically acquire the update lock
    const owner = generateOwnerId('api');
    const lockResult = await acquireUpdateLock(owner);
    
    if (!lockResult.success) {
      const existingLockData = lockResult.existingLock;
      const runningForMs = Date.now() - new Date(existingLockData.startedAt).getTime();
      const runningForMins = Math.round(runningForMs / 60000);
      return res.status(409).json({
        success: false,
        error: `An update is already in progress (running for ${runningForMins} min)`,
        startedAt: existingLockData.startedAt,
        owner: existingLockData.owner,
        hint: 'Add ?force=true to override if the update is stuck'
      });
    }

    // Start update with our acquired lock
    try {
      const result = await updateAllUsers(lockResult.lock, releaseUpdateLock);
      res.json({ success: true, ...result });
    } catch (error) {
      // Ensure lock is released on error
      await releaseUpdateLock('failed', {
        errors: [{ error: `Update failed: ${error.message}` }]
      });
      throw error;
    }
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
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
    console.error('Update error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

// GET /api/update/status - Get current lock status
const getUpdateStatus = async (req, res) => {
  try {
    // Get the global lock document to check current status
    const currentLock = await UpdateLog.findById(LOCK_ID).lean();

    res.json({
      success: true,
      data: currentLock || null
    });
  } catch (error) {
    console.error('Update error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export { triggerUpdate, updateUser, getUpdateStatus };
