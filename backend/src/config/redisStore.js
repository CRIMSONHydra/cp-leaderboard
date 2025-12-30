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
 * Initialize and test a Redis connection when REDIS_URL is configured.
 *
 * If REDIS_URL is not set or connection fails, the function leaves the system
 * configured to use the in-memory rate limiter and returns `false`.
 * @returns {Promise<boolean>} `true` if Redis is available for use after initialization, `false` otherwise.
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
 * Get the active Redis client when Redis is enabled.
 * @returns {object|null} The Redis client if available, or null otherwise.
 */
export function getRedisClient() {
  return isRedisAvailable ? redisClient : null;
}

/**
 * Determine whether Redis is currently available for use.
 * @returns {boolean} `true` if Redis is available, `false` otherwise.
 */
export function isRedisEnabled() {
  return isRedisAvailable;
}

/**
 * Shut down the active Redis connection and clear internal Redis state.
 *
 * Marks Redis as unavailable and, if a client exists, attempts to quit the connection
 * and clears the internal client reference. If no Redis client is present, the function
 * is a no-op.
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
 * Create a rate-limit store backed by Redis when a connected Redis client is available.
 *
 * Returns `undefined` to signal using the default in-memory store when Redis is not available or store creation fails.
 * @returns {object|undefined} A `rate-limit-redis` compatible store instance, or `undefined` if Redis is unavailable or the store could not be created.
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
