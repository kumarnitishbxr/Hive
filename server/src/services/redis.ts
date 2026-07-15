import Redis from 'ioredis';
import config from '../config';

// Configure Redis Client with retry policy
export const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null, // Required for compatibility with BullMQ
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
});

redis.on('connect', () => {
  console.log('Successfully connected to Redis instance.');
});

redis.on('error', (err) => {
  console.error('Redis connection error details:', err);
});
export default redis;
