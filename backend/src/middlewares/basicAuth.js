import AdminCredential from '../models/AdminCredential.js';

const basicAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
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
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials format'
      });
    }

    // Check credentials in MongoDB
    const adminCred = await AdminCredential.findOne({ username });

    if (!adminCred || adminCred.password !== password) {
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // Attach user info to request
    req.user = { username: adminCred.username };
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Authentication error: ' + error.message
    });
  }
};

export default basicAuth;

