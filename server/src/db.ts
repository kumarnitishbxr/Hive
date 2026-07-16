import mongoose from 'mongoose';
import config from './config';

let reconnectTimer: NodeJS.Timeout | null = null;

const scheduleReconnect = () => {
  if (config.isProduction || reconnectTimer) {
    return;
  }

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    void connectDB();
  }, 5000);
};

export const connectDB = async (): Promise<boolean> => {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('Successfully connected to MongoDB Atlas database.');
    return true;
  } catch (error) {
    console.error('Error connecting to MongoDB database:', error);
    scheduleReconnect();
    return false;
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB connection lost.');
  scheduleReconnect();
});
