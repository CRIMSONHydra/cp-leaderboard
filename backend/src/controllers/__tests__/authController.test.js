import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import crypto from 'crypto';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../../test/dbSetup.js';
import Account from '../../models/Account.js';
import PasswordResetToken from '../../models/PasswordResetToken.js';
import { register, login, logout, refreshToken, forgotPassword, resetPassword, getMe, updateProfile, linkHandles, getMySpaces } from '../authController.js';
import Space from '../../models/Space.js';

beforeAll(async () => {
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-12345';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-12345';
  process.env.CLIENT_URL = 'http://localhost:5173';
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

function createMockReqRes(body = {}, cookies = {}, params = {}) {
  return {
    req: { body, cookies, params, account: {} },
    res: {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      cookie: vi.fn(),
      clearCookie: vi.fn()
    }
  };
}

describe('authController', () => {
  describe('register', () => {
    it('creates a new account', async () => {
      const { req, res } = createMockReqRes({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data.username).toBe('testuser');
      expect(body.data.email).toBe('test@example.com');
      expect(res.cookie).toHaveBeenCalled(); // tokens set
    });

    it('rejects duplicate username', async () => {
      await Account.create({ username: 'testuser', email: 'a@b.com', password: 'password123' });
      const { req, res } = createMockReqRes({
        username: 'testuser',
        email: 'other@b.com',
        password: 'password123'
      });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('rejects duplicate email', async () => {
      await Account.create({ username: 'user1', email: 'test@b.com', password: 'password123' });
      const { req, res } = createMockReqRes({
        username: 'user2',
        email: 'test@b.com',
        password: 'password123'
      });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('rejects short password', async () => {
      const { req, res } = createMockReqRes({
        username: 'testuser',
        email: 'test@example.com',
        password: 'short'
      });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects missing email', async () => {
      const { req, res } = createMockReqRes({
        username: 'testuser',
        password: 'password123'
      });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('login', () => {
    it('logs in by username', async () => {
      await Account.create({ username: 'testuser', email: 'test@b.com', password: 'password123' });
      const { req, res } = createMockReqRes({ login: 'testuser', password: 'password123' });

      await login(req, res);

      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data.username).toBe('testuser');
    });

    it('logs in by email', async () => {
      await Account.create({ username: 'testuser', email: 'test@b.com', password: 'password123' });
      const { req, res } = createMockReqRes({ login: 'test@b.com', password: 'password123' });

      await login(req, res);

      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
    });

    it('rejects wrong password', async () => {
      await Account.create({ username: 'testuser', email: 'test@b.com', password: 'password123' });
      const { req, res } = createMockReqRes({ login: 'testuser', password: 'wrong' });

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('rejects nonexistent user', async () => {
      const { req, res } = createMockReqRes({ login: 'noone', password: 'password123' });

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('logout', () => {
    it('clears cookies', async () => {
      const { req, res } = createMockReqRes();

      await logout(req, res);

      expect(res.clearCookie).toHaveBeenCalled();
      expect(res.json.mock.calls[0][0].success).toBe(true);
    });
  });

  describe('refreshToken', () => {
    it('issues new tokens with valid refresh token', async () => {
      const account = await Account.create({ username: 'user', email: 'r@b.com', password: 'password123' });
      const { generateRefreshToken: genRefresh } = await import('../../services/tokenService.js');
      const token = genRefresh(account._id.toString(), account.refreshTokenVersion);

      const { req, res } = createMockReqRes({}, { refreshToken: token });
      await refreshToken(req, res);

      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data.username).toBe('user');
      expect(res.cookie).toHaveBeenCalled();
    });

    it('rejects missing refresh token', async () => {
      const { req, res } = createMockReqRes({}, {});
      await refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('rejects invalid refresh token', async () => {
      const { req, res } = createMockReqRes({}, { refreshToken: 'garbage' });
      await refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('rejects token with wrong version (revoked)', async () => {
      const account = await Account.create({ username: 'user', email: 'r@b.com', password: 'password123' });
      const { generateRefreshToken: genRefresh } = await import('../../services/tokenService.js');
      const token = genRefresh(account._id.toString(), 0);

      // Increment version to invalidate
      account.refreshTokenVersion = 1;
      await account.save();

      const { req, res } = createMockReqRes({}, { refreshToken: token });
      await refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('forgotPassword', () => {
    it('returns success even for nonexistent email', async () => {
      const { req, res } = createMockReqRes({ email: 'nobody@example.com' });

      await forgotPassword(req, res);

      expect(res.json.mock.calls[0][0].success).toBe(true);
    });

    it('creates a reset token for existing account', async () => {
      await Account.create({ username: 'user', email: 'test@b.com', password: 'password123' });
      const { req, res } = createMockReqRes({ email: 'test@b.com' });

      await forgotPassword(req, res);

      expect(res.json.mock.calls[0][0].success).toBe(true);
      const tokens = await PasswordResetToken.find({});
      expect(tokens).toHaveLength(1);
    });
  });

  describe('resetPassword', () => {
    it('resets password with valid token', async () => {
      const account = await Account.create({ username: 'user', email: 'test@b.com', password: 'oldpass123' });
      const rawToken = 'valid-token-123';
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      await PasswordResetToken.create({
        accountId: account._id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 3600000)
      });

      const { req, res } = createMockReqRes({ token: rawToken, password: 'newpass123' });

      await resetPassword(req, res);

      expect(res.json.mock.calls[0][0].success).toBe(true);

      // Verify password changed
      const updated = await Account.findById(account._id).select('+password');
      expect(await updated.comparePassword('newpass123')).toBe(true);
      expect(updated.refreshTokenVersion).toBe(1);
    });

    it('rejects expired token', async () => {
      const account = await Account.create({ username: 'user', email: 'test@b.com', password: 'oldpass123' });
      const rawToken = 'expired-token';
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      await PasswordResetToken.create({
        accountId: account._id,
        token: hashedToken,
        expiresAt: new Date(Date.now() - 1000) // expired
      });

      const { req, res } = createMockReqRes({ token: rawToken, password: 'newpass123' });

      await resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects used token', async () => {
      const account = await Account.create({ username: 'user', email: 'test@b.com', password: 'oldpass123' });
      const rawToken = 'used-token';
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
      await PasswordResetToken.create({
        accountId: account._id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 3600000),
        used: true
      });

      const { req, res } = createMockReqRes({ token: rawToken, password: 'newpass123' });

      await resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getMe', () => {
    it('returns account info', async () => {
      const account = await Account.create({ username: 'user', email: 'test@b.com', password: 'password123' });
      const { req, res } = createMockReqRes();
      req.account = { id: account._id.toString() };

      await getMe(req, res);

      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data.username).toBe('user');
    });

    it('returns 404 for nonexistent account', async () => {
      const { req, res } = createMockReqRes();
      req.account = { id: '507f1f77bcf86cd799439011' };

      await getMe(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('updateProfile', () => {
    it('updates username', async () => {
      const account = await Account.create({ username: 'old', email: 'u@b.com', password: 'password123' });
      const { req, res } = createMockReqRes({ username: 'newname' });
      req.account = { id: account._id.toString() };

      await updateProfile(req, res);

      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data.username).toBe('newname');
    });

    it('rejects duplicate username', async () => {
      await Account.create({ username: 'taken', email: 'a@b.com', password: 'password123' });
      const account = await Account.create({ username: 'mine', email: 'b@b.com', password: 'password123' });
      const { req, res } = createMockReqRes({ username: 'taken' });
      req.account = { id: account._id.toString() };

      await updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('changes password with correct current password', async () => {
      const account = await Account.create({ username: 'user', email: 'u@b.com', password: 'oldpass123' });
      const { req, res } = createMockReqRes({ currentPassword: 'oldpass123', newPassword: 'newpass123' });
      req.account = { id: account._id.toString() };

      await updateProfile(req, res);

      expect(res.json.mock.calls[0][0].success).toBe(true);
      const updated = await Account.findById(account._id).select('+password');
      expect(await updated.comparePassword('newpass123')).toBe(true);
      expect(updated.refreshTokenVersion).toBe(1);
    });

    it('rejects wrong current password', async () => {
      const account = await Account.create({ username: 'user', email: 'u@b.com', password: 'password123' });
      const { req, res } = createMockReqRes({ currentPassword: 'wrong', newPassword: 'newpass123' });
      req.account = { id: account._id.toString() };

      await updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('rejects non-string username', async () => {
      const account = await Account.create({ username: 'user', email: 'u@b.com', password: 'password123' });
      const { req, res } = createMockReqRes({ username: 123 });
      req.account = { id: account._id.toString() };

      await updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('linkHandles', () => {
    it('creates and links a new user', async () => {
      const account = await Account.create({ username: 'user', email: 'u@b.com', password: 'password123' });
      const { req, res } = createMockReqRes({ handles: { codeforces: 'tourist' } });
      req.account = { id: account._id.toString() };

      await linkHandles(req, res);

      const body = res.json.mock.calls[0][0];
      expect(body.success).toBe(true);
      expect(body.data.handles.codeforces).toBe('tourist');

      const updated = await Account.findById(account._id);
      expect(updated.linkedUser).toBeTruthy();
    });

    it('rejects non-string handle values', async () => {
      const account = await Account.create({ username: 'user', email: 'u@b.com', password: 'password123' });
      const { req, res } = createMockReqRes({ handles: { codeforces: 123 } });
      req.account = { id: account._id.toString() };

      await linkHandles(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects empty handles', async () => {
      const account = await Account.create({ username: 'user', email: 'u@b.com', password: 'password123' });
      const { req, res } = createMockReqRes({ handles: {} });
      req.account = { id: account._id.toString() };

      await linkHandles(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getMySpaces', () => {
    it('returns spaces where account is a member', async () => {
      const account = await Account.create({ username: 'user', email: 'u@b.com', password: 'password123' });

      await Space.create({
        name: 'My Space',
        owner: account._id,
        members: [{ account: account._id, role: 'admin' }],
        inviteCode: Space.generateInviteCode()
      });

      const { req, res } = createMockReqRes();
      req.account = { id: account._id.toString() };

      await getMySpaces(req, res);

      const body = res.json.mock.calls[0][0];
      expect(body.data).toHaveLength(1);
      expect(body.data[0].name).toBe('My Space');
      expect(body.data[0].myRole).toBe('admin');
    });

    it('returns empty array when no spaces', async () => {
      const account = await Account.create({ username: 'user', email: 'u@b.com', password: 'password123' });
      const { req, res } = createMockReqRes();
      req.account = { id: account._id.toString() };

      await getMySpaces(req, res);

      const body = res.json.mock.calls[0][0];
      expect(body.data).toHaveLength(0);
    });
  });
});
