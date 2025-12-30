/**
 * Authentication Rate Limiter
 * Tracks failed authentication attempts by IP and username
 * 
 * Uses in-memory store for development. For production with multiple instances,
 * consider migrating to Redis for shared state:
 * 
 * ```javascript
 * import Redis from 'ioredis';
 * const redis = new Redis(process.env.REDIS_URL);
 * 
 * // Replace Map operations with Redis commands:
 * // failedAttemptsStore.get(key) -> redis.get(key)
 * // failedAttemptsStore.set(key, value) -> redis.setex(key, ttl, JSON.stringify(value))
 * // failedAttemptsStore.delete(key) -> redis.del(key)
 * ```
 */

// In-memory store for failed attempts
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

// Start cleanup interval
setInterval(cleanupExpiredEntries, CLEANUP_INTERVAL_MS);

/**
 * Check if authentication attempt should be blocked
 * @param {string} ip - Client IP
 * @param {string} username - Username
 * @returns {object} { blocked: boolean, reason?: string, retryAfter?: number }
 */
function checkAuthLimit(ip, username) {
  const key = generateKey(ip, username);
  const now = Date.now();
  const entry = failedAttemptsStore.get(key);

  if (!entry) {
    return { blocked: false };
  }

  // Check if account is locked
  if (entry.lockedUntil && entry.lockedUntil > now) {
    const retryAfter = Math.ceil((entry.lockedUntil - now) / 1000); // seconds
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
    // Apply lockout
    const lockedUntil = now + LOCKOUT_DURATION_MS;
    entry.lockedUntil = lockedUntil;
    failedAttemptsStore.set(key, entry);
    
    const retryAfter = Math.ceil(LOCKOUT_DURATION_MS / 1000);
    return {
      blocked: true,
      reason: 'Too many failed authentication attempts. Account temporarily locked.',
      retryAfter
    };
  }

  return { blocked: false };
}

/**
 * Record a failed authentication attempt
 * @param {string} ip - Client IP
 * @param {string} username - Username
 */
function recordFailedAttempt(ip, username) {
  const key = generateKey(ip, username);
  const now = Date.now();
  const entry = failedAttemptsStore.get(key);

  if (entry && entry.resetAt > now) {
    // Increment existing counter
    entry.count += 1;
  } else {
    // Create new entry
    failedAttemptsStore.set(key, {
      count: 1,
      resetAt: now + WINDOW_MS,
      lockedUntil: null
    });
  }
}

/**
 * Clear failed attempts for successful authentication
 * @param {string} ip - Client IP
 * @param {string} username - Username
 */
function clearFailedAttempts(ip, username) {
  const key = generateKey(ip, username);
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
  const limitCheck = checkAuthLimit(ip, username);
  
  if (limitCheck.blocked) {
    return res.status(429).json({
      success: false,
      error: limitCheck.reason,
      retryAfter: limitCheck.retryAfter
    });
  }

  // Attach rate limiter functions to request for use in auth middleware
  req.authRateLimiter = {
    recordFailed: () => recordFailedAttempt(ip, username),
    clearFailed: () => clearFailedAttempts(ip, username),
    getClientIP: () => ip
  };

  next();
};

/**
 * Get current failed attempts count (for monitoring/debugging)
 * @param {string} ip - Client IP
 * @param {string} username - Username
 * @returns {number} Current failed attempts count
 */
export function getFailedAttemptsCount(ip, username) {
  const key = generateKey(ip, username);
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

