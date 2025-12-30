import rateLimit from 'express-rate-limit';
import { getRedisClient, isRedisEnabled } from '../config/redisStore.js';

/**
 * Create a Redis store for rate limiting if Redis is available
 * @returns {object|undefined} Store configuration or undefined for in-memory
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

// Store instance (will be set after Redis initialization)
let rateLimitStore = undefined;

/**
 * Initialize rate limit store (call after Redis initialization)
 */
export async function initRateLimitStore() {
  rateLimitStore = await createStore();
  if (rateLimitStore) {
    console.log('Rate limiting using Redis store');
  } else {
    console.log('Rate limiting using in-memory store');
  }
}

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { success: false, error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  // Store will be set dynamically; falls back to in-memory if undefined
  store: rateLimitStore
});

// Stricter limiter for manual user updates
export const updateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 manual updates per hour
  message: { success: false, error: 'Update rate limit exceeded, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  // Store will be set dynamically; falls back to in-memory if undefined
  store: rateLimitStore
});
