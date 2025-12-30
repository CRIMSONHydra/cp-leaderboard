/**
 * Shared update lock management
 * Provides atomic locking mechanism for rating updates
 */

import UpdateLog from '../models/UpdateLog.js';

// Fixed ID for the global update lock document
export const LOCK_ID = 'GLOBAL_UPDATE_LOCK';

// Stale update timeout (30 minutes)
export const STALE_UPDATE_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Generate a unique owner identifier for this process
 * @param {string} prefix - Optional prefix for the owner ID (e.g., 'cron', 'api')
 * @returns {string} Unique owner identifier
 */
export function generateOwnerId(prefix = '') {
  const pid = process.pid;
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  
  return prefix 
    ? `${prefix}-${pid}-${timestamp}-${random}`
    : `${pid}-${timestamp}-${random}`;
}

/**
 * Atomically acquire the global update lock using a fixed document ID.
 * Uses findOneAndUpdate with upsert to ensure only one process can hold the lock.
 * 
 * @param {string} owner - Owner identifier for the lock
 * @returns {Promise<object>} { success: boolean, lock?: UpdateLog, existingLock?: UpdateLog }
 */
export async function acquireUpdateLock(owner) {
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
 * @returns {Promise<void>}
 */
export async function releaseUpdateLock(status, updates = {}) {
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

