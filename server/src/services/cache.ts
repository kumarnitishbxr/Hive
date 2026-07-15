import redis from './redis';

const DEFAULT_TTL = 300; // 5 minutes cache TTL

export const getCache = async (key: string): Promise<any | null> => {
  try {
    const cachedData = await redis.get(key);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
  } catch (error) {
    console.error(`Cache read failure for key: ${key}`, error);
  }
  return null;
};

export const setCache = async (key: string, data: any, ttlSec: number = DEFAULT_TTL): Promise<void> => {
  try {
    const stringified = JSON.stringify(data);
    await redis.setex(key, ttlSec, stringified);
  } catch (error) {
    console.error(`Cache write failure for key: ${key}`, error);
  }
};

export const invalidateCache = async (keyPattern: string): Promise<void> => {
  try {
    const keys = await redis.keys(keyPattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`Cache cleared for patterns matching: ${keyPattern} (${keys.length} keys invalidated)`);
    }
  } catch (error) {
    console.error(`Cache invalidation failure for pattern: ${keyPattern}`, error);
  }
};
