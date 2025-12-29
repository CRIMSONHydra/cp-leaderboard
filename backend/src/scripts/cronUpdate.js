/**
 * Standalone cron script for updating all user ratings.
 * Run this with a cron job scheduler (e.g., Render Cron Jobs).
 * Schedule: every 12 hours
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { updateAllUsers } from '../services/ratingUpdater.js';
import UpdateLog from '../models/UpdateLog.js';

// Stale update timeout (30 minutes)
const STALE_UPDATE_TIMEOUT_MS = 30 * 60 * 1000;

/**
 * Atomically try to acquire an update lock by creating a running UpdateLog
 * and checking if we're the only one running.
 */
async function acquireUpdateLock() {
  const ourLog = await UpdateLog.create({ startedAt: new Date(), status: 'running' });
  
  const earlierRunningLog = await UpdateLog.findOne({
    status: 'running',
    _id: { $ne: ourLog._id },
    createdAt: { $lte: ourLog.createdAt }
  }).sort({ createdAt: 1 });
  
  if (earlierRunningLog) {
    await UpdateLog.findByIdAndDelete(ourLog._id);
    return { success: false, existingLog: earlierRunningLog };
  }
  
  return { success: true, log: ourLog };
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

    // Mark stale updates as failed
    const staleThreshold = new Date(Date.now() - STALE_UPDATE_TIMEOUT_MS);
    const staleUpdates = await UpdateLog.updateMany(
      { status: 'running', startedAt: { $lt: staleThreshold } },
      { $set: { status: 'failed', completedAt: new Date(), errors: [{ error: 'Update timed out (marked as stale)' }] } }
    );
    if (staleUpdates.modifiedCount > 0) {
      console.log(`Marked ${staleUpdates.modifiedCount} stale update(s) as failed`);
    }

    // Acquire lock
    const lockResult = await acquireUpdateLock();
    if (!lockResult.success) {
      const runningForMs = Date.now() - new Date(lockResult.existingLog.startedAt).getTime();
      console.log(`Another update is already running (${Math.round(runningForMs / 60000)} min). Skipping.`);
      await mongoose.disconnect();
      process.exit(0);
    }

    const result = await updateAllUsers(lockResult.log);

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
