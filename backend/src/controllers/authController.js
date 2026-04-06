import crypto from 'crypto';
import Account from '../models/Account.js';
import Space from '../models/Space.js';
import User from '../models/User.js';
import PasswordResetToken from '../models/PasswordResetToken.js';
import { updateSingleUser, PLATFORMS } from '../services/ratingUpdater.js';
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

    const account = await Account.findOne(query).select('+password');

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

      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      await PasswordResetToken.create({
        accountId: account._id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      });

      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
      const resetUrl = `${clientUrl}/reset-password?token=${rawToken}`;
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

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const resetToken = await PasswordResetToken.findOne({
      token: hashedToken,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!resetToken) {
      return res.status(400).json({ success: false, error: 'Invalid or expired reset token' });
    }

    const account = await Account.findById(resetToken.accountId).select('+password');
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
    const account = await Account.findById(req.account.id)
      .select('-password')
      .populate('linkedUser')
      .lean();
    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }

    res.json({
      success: true,
      data: {
        id: account._id,
        username: account.username,
        email: account.email,
        createdAt: account.createdAt,
        linkedUser: account.linkedUser || null
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { username, email, currentPassword, newPassword } = req.body;
    const account = await Account.findById(req.account.id).select('+password');

    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }

    if (username !== undefined && username.trim() !== account.username) {
      const trimmed = username.trim();
      if (trimmed.length < 3) return res.status(400).json({ success: false, error: 'Username must be at least 3 characters' });
      if (trimmed.length > 30) return res.status(400).json({ success: false, error: 'Username must be at most 30 characters' });
      const existing = await Account.findOne({ username: trimmed, _id: { $ne: account._id } });
      if (existing) return res.status(409).json({ success: false, error: 'Username already taken' });
      account.username = trimmed;
    }

    if (email !== undefined && email.trim().toLowerCase() !== account.email) {
      const trimmed = email.trim().toLowerCase();
      if (!EMAIL_REGEX.test(trimmed)) return res.status(400).json({ success: false, error: 'Invalid email format' });
      const existing = await Account.findOne({ email: trimmed, _id: { $ne: account._id } });
      if (existing) return res.status(409).json({ success: false, error: 'Email already registered' });
      account.email = trimmed;
    }

    if (newPassword) {
      if (!currentPassword) return res.status(400).json({ success: false, error: 'Current password is required' });
      const isMatch = await account.comparePassword(currentPassword);
      if (!isMatch) return res.status(401).json({ success: false, error: 'Current password is incorrect' });
      if (newPassword.length < 8) return res.status(400).json({ success: false, error: 'New password must be at least 8 characters' });
      account.password = newPassword;
      account.refreshTokenVersion += 1;
    }

    await account.save();
    issueTokens(res, account);

    res.json({
      success: true,
      data: { id: account._id, username: account.username, email: account.email }
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({ success: false, error: `${field === 'email' ? 'Email' : 'Username'} already exists` });
    }
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const linkHandles = async (req, res) => {
  try {
    const { handles } = req.body;
    const account = await Account.findById(req.account.id);

    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }

    if (!handles || typeof handles !== 'object' || Array.isArray(handles)) {
      return res.status(400).json({ success: false, error: 'Handles object is required' });
    }

    const hasAnyHandle = PLATFORMS.some(p => handles[p]?.trim());
    if (!hasAnyHandle) {
      return res.status(400).json({ success: false, error: 'At least one platform handle is required' });
    }

    // Try to find existing User with matching handles (deduplication)
    const { findExactMatchByHandles } = await import('./spaceUserController.js');
    let user = await findExactMatchByHandles(handles);

    if (user) {
      // Link to existing user
      account.linkedUser = user._id;
      await account.save();
    } else {
      // Create new user and fetch ratings
      const userData = {
        name: account.username,
        handles: Object.fromEntries(
          PLATFORMS.map(p => [p, handles[p]?.trim() || null])
        )
      };
      user = await User.create(userData);

      try {
        await updateSingleUser(user);
      } catch (err) {
        console.error(`Failed to fetch ratings for ${user.name}:`, err);
      }

      user = await User.findById(user._id).lean();
      account.linkedUser = user._id;
      await account.save();
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Link handles error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const getMySpaces = async (req, res) => {
  try {
    const spaces = await Space.find({
      'members.account': req.account.id,
      isActive: true
    })
      .select('name description owner members createdAt')
      .populate('owner', 'username')
      .lean();

    const spacesWithRole = spaces.map(space => {
      const membership = space.members.find(
        m => (m.account._id || m.account).toString() === req.account.id
      );
      return {
        _id: space._id,
        name: space.name,
        description: space.description,
        myRole: membership?.role || 'viewer',
        memberCount: space.members.length,
        createdAt: space.createdAt
      };
    });

    res.json({ success: true, data: spacesWithRole });
  } catch (error) {
    console.error('Get my spaces error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

export {
  register, login, logout, refreshToken, forgotPassword, resetPassword,
  getMe, updateProfile, linkHandles, getMySpaces
};
