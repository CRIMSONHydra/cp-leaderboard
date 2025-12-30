import AdminCredential from '../models/AdminCredential.js';

const basicAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      // Record failed attempt if rate limiter is attached
      if (req.authRateLimiter) {
        req.authRateLimiter.recordFailed();
      }
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Basic authentication required'
      });
    }

    // Extract base64 encoded credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    if (!username || !password) {
      // Record failed attempt if rate limiter is attached
      if (req.authRateLimiter) {
        req.authRateLimiter.recordFailed();
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials format'
      });
    }

    // Check credentials in MongoDB
    const adminCred = await AdminCredential.findOne({ username });

    if (!adminCred || adminCred.password !== password) {
      // Record failed attempt if rate limiter is attached
      if (req.authRateLimiter) {
        req.authRateLimiter.recordFailed();
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // Clear failed attempts on successful authentication
    if (req.authRateLimiter) {
      req.authRateLimiter.clearFailed();
    }

    // Attach user info to request
    req.user = { username: adminCred.username };
    next();
  } catch (error) {
    // Record failed attempt on error
    if (req.authRateLimiter) {
      req.authRateLimiter.recordFailed();
    }
    res.status(500).json({
      success: false,
      error: 'Authentication error: ' + error.message
    });
  }
};

export default basicAuth;
