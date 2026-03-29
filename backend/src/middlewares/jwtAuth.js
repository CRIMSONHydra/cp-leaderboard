import { verifyAccessToken } from '../services/tokenService.js';

const jwtAuth = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const decoded = verifyAccessToken(token);
    req.account = { id: decoded.sub };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

export default jwtAuth;
