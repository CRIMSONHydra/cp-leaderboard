import crypto from 'crypto';
import Account from '../models/Account.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  setTokenCookies,
  clearTokenCookies
} from '../services/tokenService.js';
import { sendPasswordResetEmail } from '../services/emailService.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegistration(username, email, password) {
  if (!username || !username.trim()) return 'Username is required';
  if (username.trim().length < 3) return 'Username must be at least 3 characters';
  if (username.trim().length > 30) return 'Username must be at most 30 characters';
  if (!email || !email.trim()) return 'Email is required';
  if (!EMAIL_REGEX.test(email.trim())) return 'Invalid email format';
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return null;
}

function issueTokens(res, account) {
  const accessToken = generateAccessToken(account._id.toString());
  const refreshToken = generateRefreshToken(account._id.toString(), account.refreshTokenVersion);
  setTokenCookies(res, accessToken, refreshToken);
}

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const validationError = validateRegistration(username, email, password);
    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
    }

    const existingUsername = await Account.findOne({ username: username.trim() });
    if (existingUsername) {
      return res.status(409).json({ success: false, error: 'Username already taken' });
    }

    const existingEmail = await Account.findOne({ email: email.trim().toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ success: false, error: 'Email already registered' });
    }

    const account = await Account.create({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password
    });

    issueTokens(res, account);

    res.status(201).json({
      success: true,
      data: {
        id: account._id,
        username: account.username,
        email: account.email
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        error: `${field === 'email' ? 'Email' : 'Username'} already exists`
      });
    }
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { login: loginId, password } = req.body;

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username/email and password are required'
      });
    }

    // Find by username or email
    const isEmail = EMAIL_REGEX.test(loginId);
    const query = isEmail
      ? { email: loginId.trim().toLowerCase() }
      : { username: loginId.trim() };

    const account = await Account.findOne(query);

    if (!account || !(await account.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    issueTokens(res, account);

    res.json({
      success: true,
      data: {
        id: account._id,
        username: account.username,
        email: account.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const logout = async (req, res) => {
  clearTokenCookies(res);
  res.json({ success: true, message: 'Logged out' });
};

const refreshToken = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ success: false, error: 'No refresh token' });
    }

    const decoded = verifyRefreshToken(token);
    const account = await Account.findById(decoded.sub);

    if (!account || account.refreshTokenVersion !== decoded.v) {
      clearTokenCookies(res);
      return res.status(401).json({ success: false, error: 'Invalid refresh token' });
    }

    issueTokens(res, account);

    res.json({
      success: true,
      data: {
        id: account._id,
        username: account.username,
        email: account.email
      }
    });
  } catch (error) {
    clearTokenCookies(res);
    return res.status(401).json({ success: false, error: 'Invalid refresh token' });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    // Always return success to prevent email enumeration
    const account = await Account.findOne({ email: email.trim().toLowerCase() });

    if (account) {
      // Invalidate existing tokens for this account
      await PasswordResetToken.updateMany(
        { accountId: account._id, used: false },
        { used: true }
      );

      const token = crypto.randomBytes(32).toString('hex');
      await PasswordResetToken.create({
        accountId: account._id,
        token,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      });

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const resetUrl = `${clientUrl}/reset-password?token=${token}`;
      await sendPasswordResetEmail(account.email, resetUrl);
    }

    res.json({ success: true, message: 'If an account with that email exists, a reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, error: 'Token and new password are required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, error: 'Password must be at least 8 characters' });
    }

    const resetToken = await PasswordResetToken.findOne({
      token,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetToken) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
    }

    const account = await Account.findById(resetToken.accountId);
    if (!account) {
      return res.status(400).json({ success: false, error: 'Account not found' });
    }

    account.password = password;
    account.refreshTokenVersion += 1; // Invalidate all existing sessions
    await account.save();

    resetToken.used = true;
    await resetToken.save();

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const getMe = async (req, res) => {
  try {
    const account = await Account.findById(req.account.id).select('-password');
    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }

    res.json({
      success: true,
      data: {
        id: account._id,
        username: account.username,
        email: account.email
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export { register, login, logout, refreshToken, forgotPassword, resetPassword, getMe };
