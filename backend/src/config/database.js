import mongoose from 'mongoose';

/**
 * Connect to MongoDB database
 * @throws {Error} If connection fails
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const conn = await mongoose.connect(process.env.MONGODB_URI, {
    maxPoolSize: 10
  });
  
  console.log(`MongoDB Connected: ${conn.connection.host}`);
};

export default connectDB;
