/**
 * Redis Store for Rate Limiting
 * 
 * Provides a distributed store for rate limiting in production deployments
 * with multiple server instances. Falls back to in-memory store if Redis
 * is not available.
 * 
 * Usage:
 *   - Set REDIS_URL environment variable to enable Redis store
 *   - If REDIS_URL is not set, uses in-memory store (development mode)
 */

let redisClient = null;
let isRedisAvailable = false;

/**
 * Initialize Redis connection if REDIS_URL is configured
 * @returns {Promise<boolean>} Whether Redis is available
 */
export async function initRedis() {
  if (!process.env.REDIS_URL) {
    console.log('REDIS_URL not configured, using in-memory store for rate limiting');
    return false;
  }

  try {
    // Dynamic import to avoid requiring ioredis when not needed
    const { default: Redis } = await import('ioredis');
    
    redisClient = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      lazyConnect: true
    });

    await redisClient.connect();
    
    // Test connection
    await redisClient.ping();
    
    isRedisAvailable = true;
    console.log('Redis connected for rate limiting');

    // Handle connection errors
    redisClient.on('error', (err) => {
      console.error('Redis error:', err.message);
      isRedisAvailable = false;
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis reconnecting...');
    });

    redisClient.on('ready', () => {
      isRedisAvailable = true;
      console.log('Redis ready');
    });

    return true;
  } catch (error) {
    console.error('Failed to connect to Redis:', error.message);
    console.log('Falling back to in-memory store for rate limiting');
    isRedisAvailable = false;
    return false;
  }
}

/**
 * Get Redis client instance
 * @returns {object|null} Redis client or null if not available
 */
export function getRedisClient() {
  return isRedisAvailable ? redisClient : null;
}

/**
 * Check if Redis is available
 * @returns {boolean}
 */
export function isRedisEnabled() {
  return isRedisAvailable;
}

/**
 * Close Redis connection gracefully
 */
export async function closeRedis() {
  if (redisClient) {
    try {
      await redisClient.quit();
      console.log('Redis connection closed');
    } catch (error) {
      console.error('Error closing Redis connection:', error.message);
    }
  }
}

/**
 * Create a rate-limit-redis compatible store
 * Requires @express-rate-limit/redis package
 * @returns {object|undefined} Redis store or undefined for default in-memory
 */
export async function createRateLimitStore() {
  if (!isRedisAvailable || !redisClient) {
    return undefined; // Use default in-memory store
  }

  try {
    const { RedisStore } = await import('rate-limit-redis');
    return new RedisStore({
      sendCommand: (...args) => redisClient.call(...args)
    });
  } catch (error) {
    console.error('Failed to create Redis store for rate limiting:', error.message);
    console.log('Using in-memory store instead');
    return undefined;
  }
}

export default {
  initRedis,
  getRedisClient,
  isRedisEnabled,
  closeRedis,
  createRateLimitStore
};

