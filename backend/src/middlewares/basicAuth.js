import bcrypt from 'bcrypt';
import AdminCredential from '../models/AdminCredential.js';

// Pre-hashed dummy value to compare against when user doesn't exist,
// preventing timing attacks that reveal valid usernames
const DUMMY_HASH = bcrypt.hashSync('dummy-timing-pad', 10);

const basicAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      if (req.authRateLimiter) {
        await req.authRateLimiter.recordFailed();
      }
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Basic authentication required'
      });
    }

    // Extract base64 encoded credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const colonIndex = credentials.indexOf(':');
    const username = credentials.substring(0, colonIndex);
    const password = credentials.substring(colonIndex + 1);

    if (!username || !password) {
      if (req.authRateLimiter) {
        await req.authRateLimiter.recordFailed();
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials format'
      });
    }

    // Check credentials in MongoDB
    const adminCred = await AdminCredential.findOne({ username });

    // Always perform password comparison to prevent timing attacks
    // that could reveal whether a username exists
    const passwordMatch = adminCred
      ? await adminCred.comparePassword(password)
      : await bcrypt.compare(password, DUMMY_HASH).then(() => false);

    if (!passwordMatch) {
      if (req.authRateLimiter) {
        await req.authRateLimiter.recordFailed();
      }
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // Clear failed attempts on successful authentication
    if (req.authRateLimiter) {
      await req.authRateLimiter.clearFailed();
    }

    // Attach user info to request
    req.user = { username: adminCred.username };
    next();
  } catch (error) {
    if (req.authRateLimiter) {
      await req.authRateLimiter.recordFailed().catch(e =>
        console.error('Failed to record auth attempt:', e.message)
      );
    }
    console.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication error'
    });
  }
};

export default basicAuth;
