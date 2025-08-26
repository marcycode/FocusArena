import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;
let redisAvailable = false;

export const initializeRedis = async () => {
  try {
    // Check if Redis URL is configured
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl || redisUrl === 'redis://localhost:6379') {
      console.log('⚠️  Redis not configured, skipping Redis initialization');
      console.log('💡 Supabase real-time features will be used instead');
      return null;
    }

    redisClient = createClient({
      url: redisUrl
    });

    // Set up event handlers
    redisClient.on('error', (err) => {
      console.error('❌ Redis Client Error:', err);
      redisAvailable = false;
    });

    redisClient.on('connect', () => {
      console.log('✅ Redis connection established');
      redisAvailable = true;
    });

    redisClient.on('ready', () => {
      console.log('✅ Redis client ready');
      redisAvailable = true;
    });

    redisClient.on('end', () => {
      console.log('🔌 Redis connection ended');
      redisAvailable = false;
    });

    // Connect to Redis
    await redisClient.connect();
    
    return redisClient;
  } catch (error) {
    console.error('❌ Failed to connect to Redis:', error);
    console.log('💡 Continuing without Redis - Supabase real-time features will be used');
    redisAvailable = false;
    return null;
  }
};

export const getRedis = () => {
  if (!redisClient || !redisAvailable) {
    throw new Error('Redis client not available. Redis may not be configured or connected.');
  }
  return redisClient;
};

export const isRedisAvailable = () => redisAvailable;

export const closeRedis = async () => {
  if (redisClient && redisAvailable) {
    await redisClient.quit();
    console.log('🔌 Redis connection closed');
    redisAvailable = false;
  }
};

// Cache management functions with fallback
export const setCache = async (key: string, value: any, ttl?: number) => {
  if (!redisAvailable) {
    console.log('⚠️  Redis not available, skipping cache operation');
    return false;
  }
  
  try {
    const redis = getRedis();
    const serializedValue = JSON.stringify(value);
    
    if (ttl) {
      await redis.setEx(key, ttl, serializedValue);
    } else {
      await redis.set(key, serializedValue);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to set cache:', error);
    return false;
  }
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  if (!redisAvailable) {
    console.log('⚠️  Redis not available, skipping cache operation');
    return null;
  }
  
  try {
    const redis = getRedis();
    const value = await redis.get(key);
    
    if (value) {
      return JSON.parse(value) as T;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to get cache:', error);
    return null;
  }
};

export const deleteCache = async (key: string): Promise<boolean> => {
  if (!redisAvailable) {
    console.log('⚠️  Redis not available, skipping cache operation');
    return false;
  }
  
  try {
    const redis = getRedis();
    await redis.del(key);
    return true;
  } catch (error) {
    console.error('Failed to delete cache:', error);
    return false;
  }
};

export const clearCache = async (pattern: string): Promise<boolean> => {
  if (!redisAvailable) {
    console.log('⚠️  Redis not available, skipping cache operation');
    return false;
  }
  
  try {
    const redis = getRedis();
    const keys = await redis.keys(pattern);
    
    if (keys.length > 0) {
      await redis.del(keys);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to clear cache:', error);
    return false;
  }
};

// Session management
export const setUserSession = async (userId: string, sessionData: any, ttl: number = 3600) => {
  const key = `session:${userId}`;
  return await setCache(key, sessionData, ttl);
};

export const getUserSession = async (userId: string) => {
  const key = `session:${userId}`;
  return await getCache(key);
};

export const deleteUserSession = async (userId: string) => {
  const key = `session:${userId}`;
  return await deleteCache(key);
};

// Real-time data caching
export const setCampusActivity = async (campusId: string, activityData: any, ttl: number = 300) => {
  const key = `campus:activity:${campusId}`;
  return await setCache(key, activityData, ttl);
};

export const getCampusActivity = async (campusId: string) => {
  const key = `campus:activity:${campusId}`;
  return await getCache(key);
};

export const setUserStats = async (userId: string, stats: any, ttl: number = 1800) => {
  const key = `user:stats:${userId}`;
  return await setCache(key, stats, ttl);
};

export const getUserStats = async (userId: string) => {
  const key = `user:stats:${userId}`;
  return await getCache(key);
};

// Rate limiting
export const incrementRateLimit = async (key: string, ttl: number = 60): Promise<number> => {
  if (!redisAvailable) {
    console.log('⚠️  Redis not available, skipping rate limit operation');
    return 0;
  }

  try {
    const redis = getRedis();
    const current = await redis.incr(key);
    
    if (current === 1) {
      await redis.expire(key, ttl);
    }
    
    return current;
  } catch (error) {
    console.error('Failed to increment rate limit:', error);
    return 0;
  }
};

export const getRateLimit = async (key: string): Promise<number> => {
  if (!redisAvailable) {
    console.log('⚠️  Redis not available, skipping rate limit operation');
    return 0;
  }

  try {
    const redis = getRedis();
    const current = await redis.get(key);
    return current ? parseInt(current) : 0;
  } catch (error) {
    console.error('Failed to get rate limit:', error);
    return 0;
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await closeRedis();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeRedis();
  process.exit(0);
});
