/**
 * Authentication Rate Limiter
 * Tracks failed authentication attempts by IP and username
 * 
 * Uses Redis for distributed deployments (when REDIS_URL is set),
 * otherwise falls back to in-memory store for development.
 */

import { getRedisClient, isRedisEnabled } from '../config/redisStore.js';

// In-memory store for failed attempts (fallback when Redis is not available)
// Structure: { key: { count: number, resetAt: Date, lockedUntil: Date } }
const failedAttemptsStore = new Map();

// Configuration
const MAX_FAILED_ATTEMPTS = 5; // Maximum failed attempts before lockout
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window for counting attempts
const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // Cleanup expired entries every hour

/**
 * Generate a key for tracking failed attempts
 * @param {string} ip - Client IP address
 * @param {string} username - Username attempting authentication
 * @returns {string} Combined key
 */
function generateKey(ip, username) {
  // Track by both IP and username for better security
  return `auth:${ip}:${username}`;
}

/**
 * Get client IP address from request
 * @param {object} req - Express request object
 * @returns {string} IP address
 */
function getClientIP(req) {
  return req.ip || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress ||
         (req.headers['x-forwarded-for']?.split(',')[0]?.trim()) ||
         'unknown';
}

/**
 * Clean up expired entries from the store
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, data] of failedAttemptsStore.entries()) {
    // Remove if both resetAt and lockedUntil have passed
    if (data.resetAt < now && (!data.lockedUntil || data.lockedUntil < now)) {
      failedAttemptsStore.delete(key);
    }
  }
}

// Start cleanup interval and store the interval ID for graceful shutdown
let cleanupInterval = setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL_MS);

/**
 * Stop the cleanup interval (for graceful shutdown)
 */
export function stopCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('Auth rate limiter cleanup interval stopped');
  }
}

/**
 * Check if authentication attempt should be blocked (in-memory version)
 */
function checkAuthLimitInMemory(key) {
  const now = Date.now();
  const entry = failedAttemptsStore.get(key);

  if (!entry) {
    return { blocked: false };
  }

  // Check if account is locked
  if (entry.lockedUntil && entry.lockedUntil > now) {
    const retryAfter = Math.ceil((entry.lockedUntil - now) / 1000);
    return {
      blocked: true,
      reason: 'Too many failed authentication attempts. Account temporarily locked.',
      retryAfter
    };
  }

  // Check if window has expired
  if (entry.resetAt < now) {
    failedAttemptsStore.delete(key);
    return { blocked: false };
  }

  // Check if threshold exceeded
  if (entry.count >= MAX_FAILED_ATTEMPTS) {
    const lockedUntil = now + LOCKOUT_DURATION_MS;
    entry.lockedUntil = lockedUntil;
    failedAttemptsStore.set(key, entry);
    
    return {
      blocked: true,
      reason: 'Too many failed authentication attempts. Account temporarily locked.',
      retryAfter: Math.ceil(LOCKOUT_DURATION_MS / 1000)
    };
  }

  return { blocked: false };
}

/**
 * Check if authentication attempt should be blocked (Redis version)
 */
async function checkAuthLimitRedis(key, redis) {
  const now = Date.now();
  const data = await redis.get(key);

  if (!data) {
    return { blocked: false };
  }

  const entry = JSON.parse(data);

  // Check if account is locked
  if (entry.lockedUntil && entry.lockedUntil > now) {
    const retryAfter = Math.ceil((entry.lockedUntil - now) / 1000);
    return {
      blocked: true,
      reason: 'Too many failed authentication attempts. Account temporarily locked.',
      retryAfter
    };
  }

  // Check if window has expired
  if (entry.resetAt < now) {
    await redis.del(key);
    return { blocked: false };
  }

  // Check if threshold exceeded
  if (entry.count >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS;
    const ttl = Math.ceil(LOCKOUT_DURATION_MS / 1000);
    await redis.setex(key, ttl, JSON.stringify(entry));
    
    return {
      blocked: true,
      reason: 'Too many failed authentication attempts. Account temporarily locked.',
      retryAfter: ttl
    };
  }

  return { blocked: false };
}

/**
 * Check if authentication attempt should be blocked
 * @param {string} ip - Client IP
 * @param {string} username - Username
 * @returns {Promise<object>} { blocked: boolean, reason?: string, retryAfter?: number }
 */
async function checkAuthLimit(ip, username) {
  const key = generateKey(ip, username);
  const redis = getRedisClient();

  if (redis && isRedisEnabled()) {
    try {
      return await checkAuthLimitRedis(key, redis);
    } catch (error) {
      console.error('Redis error in checkAuthLimit, falling back to in-memory:', error.message);
    }
  }

  return checkAuthLimitInMemory(key);
}

/**
 * Record a failed authentication attempt (in-memory version)
 */
function recordFailedAttemptInMemory(key) {
  const now = Date.now();
  const entry = failedAttemptsStore.get(key);

  if (entry && entry.resetAt > now) {
    entry.count += 1;
  } else {
    failedAttemptsStore.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS,
      lockedUntil: null
    });
  }
}

/**
 * Record a failed authentication attempt (Redis version)
 */
async function recordFailedAttemptRedis(key, redis) {
  const now = Date.now();
  const data = await redis.get(key);

  let entry;
  if (data) {
    entry = JSON.parse(data);
    if (entry.resetAt > now) {
      entry.count += 1;
    } else {
      entry = { count: 1, resetAt: now + WINDOW_MS, lockedUntil: null };
    }
  } else {
    entry = { count: 1, resetAt: now + WINDOW_MS, lockedUntil: null };
  }

  // Use the maximum of resetAt and lockedUntil to preserve lockout state
  const expiresAt = entry.lockedUntil && entry.lockedUntil > entry.resetAt 
    ? entry.lockedUntil 
    : entry.resetAt;
  const ttl = Math.ceil((expiresAt - now) / 1000);
  await redis.setex(key, ttl, JSON.stringify(entry));
}

/**
 * Record a failed authentication attempt
 * @param {string} ip - Client IP
 * @param {string} username - Username
 */
async function recordFailedAttempt(ip, username) {
  const key = generateKey(ip, username);
  const redis = getRedisClient();

  if (redis && isRedisEnabled()) {
    try {
      await recordFailedAttemptRedis(key, redis);
      return;
    } catch (error) {
      console.error('Redis error in recordFailedAttempt, falling back to in-memory:', error.message);
    }
  }

  recordFailedAttemptInMemory(key);
}

/**
 * Clear failed attempts for successful authentication
 * @param {string} ip - Client IP
 * @param {string} username - Username
 */
async function clearFailedAttempts(ip, username) {
  const key = generateKey(ip, username);
  const redis = getRedisClient();

  if (redis && isRedisEnabled()) {
    try {
      await redis.del(key);
      return;
    } catch (error) {
      console.error('Redis error in clearFailedAttempts, falling back to in-memory:', error.message);
    }
  }

  failedAttemptsStore.delete(key);
}

/**
 * Express middleware for authentication rate limiting
 */
export const authRateLimiter = async (req, res, next) => {
  const ip = getClientIP(req);
  
  // Extract username from auth header if present
  let username = 'unknown';
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Basic ')) {
      const base64Credentials = authHeader.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
      const [extractedUsername] = credentials.split(':');
      if (extractedUsername) {
        username = extractedUsername;
      }
    }
  } catch (error) {
    // If we can't extract username, continue with 'unknown'
  }

  // Check if authentication should be blocked
  try {
    const limitCheck = await checkAuthLimit(ip, username);
    
    if (limitCheck.blocked) {
      return res.status(429).json({
        success: false,
        error: limitCheck.reason,
        retryAfter: limitCheck.retryAfter
      });
    }
  } catch (error) {
    console.error('Error in auth rate limiter:', error.message);
    // Continue without rate limiting on error
  }

  // Attach rate limiter functions to request for use in auth middleware
  req.authRateLimiter = {
    recordFailed: async () => await recordFailedAttempt(ip, username),
    clearFailed: async () => await clearFailedAttempts(ip, username),
    getClientIP: () => ip
  };

  next();
};

/**
 * Get current failed attempts count (for monitoring/debugging)
 * @param {string} ip - Client IP
 * @param {string} username - Username
 * @returns {Promise<number>} Current failed attempts count
 */
export async function getFailedAttemptsCount(ip, username) {
  const key = generateKey(ip, username);
  const redis = getRedisClient();

  // Try Redis first if enabled
  if (redis && isRedisEnabled()) {
    try {
      const data = await redis.get(key);
      if (data) {
        const entry = JSON.parse(data);
        return entry.count || 0;
      }
      return 0;
    } catch (error) {
      console.error('Redis error in getFailedAttemptsCount, falling back to in-memory:', error.message);
      // Fall through to in-memory fallback
    }
  }

  // Fallback to in-memory store
  const entry = failedAttemptsStore.get(key);
  return entry ? entry.count : 0;
}

/**
 * Clear all failed attempts (for admin/testing)
 */
export function clearAllFailedAttempts() {
  failedAttemptsStore.clear();
}

// Export configuration for potential Redis migration
export const config = {
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MS,
  WINDOW_MS
};

