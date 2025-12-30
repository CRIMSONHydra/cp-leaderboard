import { updateAllUsers, updateSingleUser } from '../services/ratingUpdater.js';
import User from '../models/User.js';
import UpdateLog from '../models/UpdateLog.js';

// Fixed ID for the global update lock document
const LOCK_ID = 'GLOBAL_UPDATE_LOCK';

// Stale update timeout (30 minutes)
const STALE_UPDATE_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Generate a unique owner identifier for this process
 */
function generateOwnerId() {
  return `${process.pid}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Atomically acquire the global update lock using a fixed document ID.
 * Uses findOneAndUpdate with upsert to ensure only one process can hold the lock.
 * 
 * @returns {Promise<object>} { success: boolean, lock?: UpdateLog, existingLock?: UpdateLog }
 */
async function acquireUpdateLock() {
  const owner = generateOwnerId();
  const now = new Date();
  
  try {
    // Atomically try to acquire the lock by updating a document with fixed ID
    // Only succeeds if the document doesn't exist OR status is not 'running'
    const lock = await UpdateLog.findOneAndUpdate(
      {
        _id: LOCK_ID,
        status: { $ne: 'running' } // Only acquire if not already running
      },
      {
        $set: {
          _id: LOCK_ID,
          startedAt: now,
          status: 'running',
          owner: owner,
          usersUpdated: 0,
          completedAt: null,
          errors: []
        }
      },
      {
        upsert: true,
        new: true, // Return the updated document
        setDefaultsOnInsert: true
      }
    );
    
    if (lock) {
      // Successfully acquired lock
      return { success: true, lock };
    }
    
    // Failed to acquire - lock is held by another process
    const existingLock = await UpdateLog.findById(LOCK_ID);
    return { success: false, existingLock };
  } catch (error) {
    // If error is duplicate key (E11000), another process acquired the lock
    if (error.code === 11000) {
      const existingLock = await UpdateLog.findById(LOCK_ID);
      return { success: false, existingLock };
    }
    throw error;
  }
}

/**
 * Release the update lock by updating the status
 * @param {string} status - 'completed' or 'failed'
 * @param {object} updates - Additional fields to update
 */
async function releaseUpdateLock(status, updates = {}) {
  await UpdateLog.findByIdAndUpdate(
    LOCK_ID,
    {
      $set: {
        status,
        completedAt: new Date(),
        ...updates
      },
      $unset: {
        owner: '' // Clear owner on release
      }
    }
  );
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
    const lockResult = await acquireUpdateLock();
    
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
    res.status(500).json({ success: false, error: error.message });
  }
};

export { triggerUpdate, updateUser, getUpdateStatus };
