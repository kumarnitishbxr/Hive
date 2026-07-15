import mongoose from 'mongoose';
import config from './config';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Successfully connected to MongoDB Atlas database.');
  } catch (error) {
    console.error('Error connecting to MongoDB database:', error);
    process.exit(1);
  }
};

