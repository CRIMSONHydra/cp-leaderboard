/**
 * Standalone cron script for updating all user ratings.
 * Run this with a cron job scheduler (e.g., Render Cron Jobs).
 * Schedule: every 12 hours
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import { updateAllUsers } from '../services/ratingUpdater.js';

async function runUpdate() {
  const startTime = Date.now();
  console.log(`[${new Date().toISOString()}] Starting scheduled rating update...`);

  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not set in environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const result = await updateAllUsers();

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
