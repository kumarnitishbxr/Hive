import Redis, { RedisOptions } from 'ioredis';
import config from '../config';

// Configure Redis Client with retry policy
const redisOptions: RedisOptions = {
  maxRetriesPerRequest: null, // Required for compatibility with BullMQ
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  }
};

// Enable TLS validation override if using secure Redis URL
if (config.redis.url && config.redis.url.startsWith('rediss://')) {
  redisOptions.tls = {
    rejectUnauthorized: false
  };
}

// Configure Redis Client
export const redis = config.redis.url
  ? new Redis(config.redis.url, redisOptions)
  : new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      ...redisOptions
    });

redis.on('connect', () => {
  console.log('Successfully connected to Redis instance.');
});

redis.on('error', (err) => {
  console.error('Redis connection error details:', err);
});
export default redis;
