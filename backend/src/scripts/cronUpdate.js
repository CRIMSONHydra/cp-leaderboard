/**
 * Standalone cron script for updating all user ratings.
 * Run this with a cron job scheduler (e.g., Render Cron Jobs).
 * Schedule: every 12 hours
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { updateAllUsers } from '../services/ratingUpdater.js';
import UpdateLog from '../models/UpdateLog.js';

// Fixed ID for the global update lock document
const LOCK_ID = 'GLOBAL_UPDATE_LOCK';

// Stale update timeout (30 minutes)
const STALE_UPDATE_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Generate a unique owner identifier for this process
 */
function generateOwnerId() {
  return `cron-${process.pid}-${Date.now()}`;
}

/**
 * Atomically acquire the global update lock using a fixed document ID.
 */
async function acquireUpdateLock() {
  const owner = generateOwnerId();
  const now = new Date();
  
  try {
    const lock = await UpdateLog.findOneAndUpdate(
      {
        _id: LOCK_ID,
        status: { $ne: 'running' }
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
        new: true,
        setDefaultsOnInsert: true
      }
    );
    
    if (lock) {
      return { success: true, lock };
    }
    
    const existingLock = await UpdateLog.findById(LOCK_ID);
    return { success: false, existingLock };
  } catch (error) {
    if (error.code === 11000) {
      const existingLock = await UpdateLog.findById(LOCK_ID);
      return { success: false, existingLock };
    }
    throw error;
  }
}

/**
 * Release the update lock
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
        owner: ''
      }
    }
  );
}

async function runUpdate() {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Starting scheduled rating update...`);

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not set in environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check for stale lock
    const existingLock = await UpdateLog.findById(LOCK_ID);
    if (existingLock && existingLock.status === 'running') {
      const runningForMs = Date.now() - new Date(existingLock.startedAt).getTime();
      
      if (runningForMs > STALE_UPDATE_TIMEOUT_MS) {
        console.log('Detected stale lock, releasing it');
        await releaseUpdateLock('failed', {
          errors: [{ error: 'Update timed out (marked as stale by cron)' }]
        });
      } else {
        console.log(`Another update is already running (${Math.round(runningForMs / 60000)} min). Skipping.`);
        await mongoose.disconnect();
        process.exit(0);
      }
    }

    // Acquire lock
    const lockResult = await acquireUpdateLock();
    if (!lockResult.success) {
      const runningForMs = Date.now() - new Date(lockResult.existingLock.startedAt).getTime();
      console.log(`Another update is already running (${Math.round(runningForMs / 60000)} min). Skipping.`);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Run update with lock
    const result = await updateAllUsers(lockResult.lock, releaseUpdateLock);

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n[${new Date().toISOString()}] Update completed in ${duration}s`);
    console.log(`Users updated: ${result.usersUpdated}`);
    console.log(`Errors: ${result.errors?.length || 0}`);

    if (result.errors?.length > 0) {
      console.log('\nErrors encountered:');
      result.errors.forEach(err => {
        console.log(`  - ${err.platform}: ${err.error}`);
      });
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error(`\n[${new Date().toISOString()}] Update failed:`, error.message);
    try {
      await mongoose.disconnect();
    } catch (e) {
      // Ignore disconnect errors
    }
    process.exit(1);
  }
}

runUpdate();
