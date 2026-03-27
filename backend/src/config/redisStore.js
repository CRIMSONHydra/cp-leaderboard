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

    // Register event handlers BEFORE connecting to catch events during connection
    redisClient.on('error', (err) => {
      console.error('Redis error:', err.message);
      // Don't set isRedisAvailable = false here to avoid mid-operation flips
    });

    redisClient.on('reconnecting', () => {
      console.log('Redis reconnecting...');
      isRedisAvailable = false; // Not ready during reconnect
    });

    redisClient.on('ready', () => {
      isRedisAvailable = true; // Only set to true when ready
      console.log('Redis ready');
    });

    redisClient.on('close', () => {
      console.log('Redis connection closed');
      isRedisAvailable = false; // Explicit disconnect
    });

    redisClient.on('end', () => {
      console.log('Redis connection ended');
      isRedisAvailable = false; // Explicit disconnect
    });

    // Connect to Redis
    await redisClient.connect();
    
    // Test connection after ready
    await redisClient.ping();
    
    console.log('Redis connected for rate limiting');

    // Return the actual availability status (should be true after ready event)
    return isRedisAvailable;
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
      isRedisAvailable = false; // Mark as unavailable before closing
      await redisClient.quit();
      console.log('Redis connection closed');
    } catch (error) {
      console.error('Error closing Redis connection:', error.message);
    } finally {
      redisClient = null;
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

