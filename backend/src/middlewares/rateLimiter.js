import rateLimit from 'express-rate-limit';
import { getRedisClient, isRedisEnabled } from '../config/redisStore.js';

/**
 * Provide a Redis-backed store for express-rate-limit when Redis is enabled and available.
 *
 * Returns a Redis-backed rate-limit store if Redis is enabled, a Redis client is available, and the Redis store module can be loaded; returns `undefined` otherwise to allow using the in-memory store.
 * @returns {object|undefined} A Redis-backed rate-limit store object when available, `undefined` if Redis is disabled, no client is present, or the Redis store cannot be initialized.
 */
async function createStore() {
  if (!isRedisEnabled()) {
    return undefined;
  }

  try {
    const { RedisStore } = await import('rate-limit-redis');
    const redisClient = getRedisClient();
    
    if (!redisClient) {
      return undefined;
    }

    return new RedisStore({
      sendCommand: (...args) => redisClient.call(...args)
    });
  } catch (error) {
    console.warn('Redis store not available for rate limiting:', error.message);
    return undefined;
  }
}

// Rate limiter instances (will be created after Redis initialization)
export let apiLimiter;
export let updateLimiter;

/**
 * Initialize the rate limit store and create the apiLimiter and updateLimiter middlewares.
 *
 * Must be called after Redis initialization so the limiter store can be configured.
 * Creates two express-rate-limit middlewares:
 * - `apiLimiter`: 15-minute window, 100 requests per IP.
 * - `updateLimiter`: 1-hour window, 10 updates per IP.
 * Logs whether a Redis-backed store or the in-memory store is used.
 */
export async function initRateLimitStore() {
  const rateLimitStore = await createStore();
  
  if (rateLimitStore) {
    console.log('Rate limiting using Redis store');
  } else {
    console.log('Rate limiting using in-memory store');
  }

  // Create rate limiters AFTER store is ready
  // This ensures they capture the correct store reference
  apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { success: false, error: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    store: rateLimitStore // Captured at creation time with correct value
  });

  updateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 manual updates per hour
    message: { success: false, error: 'Update rate limit exceeded, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    store: rateLimitStore // Captured at creation time with correct value
  });
}