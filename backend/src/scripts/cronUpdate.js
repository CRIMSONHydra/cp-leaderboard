/**
 * Standalone cron script for updating all user ratings.
 * Run this with a cron job scheduler (e.g., Render Cron Jobs).
 * Schedule: every 12 hours
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { updateAllUsers } from '../services/ratingUpdater.js';
import UpdateLog from '../models/UpdateLog.js';
import {
  LOCK_ID,
  STALE_UPDATE_TIMEOUT_MS,
  generateOwnerId,
  acquireUpdateLock,
  releaseUpdateLock
} from '../services/updateLock.js';

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
    const owner = generateOwnerId('cron');
    const lockResult = await acquireUpdateLock(owner);
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
