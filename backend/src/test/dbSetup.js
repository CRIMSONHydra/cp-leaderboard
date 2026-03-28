import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

export async function connectTestDB() {
  mongoServer = await MongoMemoryServer.create();
  try {
    await mongoose.connect(mongoServer.getUri());
  } catch (error) {
    await mongoServer.stop();
    throw error;
  }
}

export async function disconnectTestDB() {
  try {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  } finally {
    if (mongoServer) await mongoServer.stop();
  }
}

export async function clearTestDB() {
  for (const collection of Object.values(mongoose.connection.collections)) {
    await collection.deleteMany({});
  }
}
