import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

// Sample users - replace with your actual users
const sampleUsers = [
  {
    name: 'Tourist',
    handles: {
      codeforces: 'tourist',
      atcoder: 'tourist',
      leetcode: null,
      codechef: null
    }
  },
  {
    name: 'Petr',
    handles: {
      codeforces: 'Petr',
      atcoder: 'petr',
      leetcode: null,
      codechef: null
    }
  },
  {
    name: 'Benq',
    handles: {
      codeforces: 'Benq',
      atcoder: 'Benq',
      leetcode: null,
      codechef: null
    }
  }
  // Add more users as needed
];

async function seed() {
  try {
    if (!process.env.MONGODB_URI) {
      console.error('Error: MONGODB_URI not set in environment variables');
      console.log('Create a .env file in the backend folder with:');
      console.log('MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/cp-leaderboard');
      process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    let created = 0;
    let skipped = 0;

    for (const userData of sampleUsers) {
      const existing = await User.findOne({ name: userData.name });
      if (!existing) {
        await User.create(userData);
        console.log(`Created user: ${userData.name}`);
        created++;
      } else {
        console.log(`User already exists: ${userData.name}`);
        skipped++;
      }
    }

    console.log(`\nSeeding complete: ${created} created, ${skipped} skipped`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  }
}

seed();
