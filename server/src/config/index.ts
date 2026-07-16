import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const requiredInProduction = (value: string | undefined, envKey: string, fallback?: string) => {
  if (value) {
    return value;
  }

  if (isProduction) {
    throw new Error(`Missing required environment variable: ${envKey}`);
  }

  return fallback || '';
};

const parseCorsOrigins = () => {
  const rawOrigins = process.env.CORS_ORIGINS || process.env.CLIENT_URL || '';

  if (!rawOrigins.trim()) {
    return isProduction ? [] : ['http://localhost:5173', 'http://127.0.0.1:5173'];
  }

  return rawOrigins
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);
};

export const config = {
  env: process.env.NODE_ENV || 'development',
  isProduction,
  port: Number(process.env.PORT) || 5100,
  mongodbUri: requiredInProduction(process.env.MONGODB_URI || process.env.MONGO_URI, 'MONGODB_URI', 'mongodb://localhost:27017/startupops'),
  jwtSecret: requiredInProduction(process.env.JWT_SECRET, 'JWT_SECRET', 'startupops_super_secret_jwt_key_99'),
  jwtRefreshSecret: requiredInProduction(process.env.JWT_REFRESH_SECRET, 'JWT_REFRESH_SECRET', 'startupops_super_refresh_jwt_key_99'),
  jwtExpiry: process.env.JWT_EXPIRY || '24h',
  corsOrigins: parseCorsOrigins(),
  redis: {
    url: process.env.REDIS_URL || process.env.REDIS_TLS_URL || undefined,
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },
  cloudinaryUrl: process.env.CLOUDINARY_URL || undefined
};

export default config;
