import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: Number(process.env.PORT),
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/startupops',
  jwtSecret: process.env.JWT_SECRET || 'startupops_super_secret_jwt_key_99',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'startupops_super_refresh_jwt_key_99',
  jwtExpiry: process.env.JWT_EXPIRY || '24h',
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
  cloudinaryUrl: process.env.CLOUDINARY_URL || 'cloudinary://mock-key'
};

export default config;
