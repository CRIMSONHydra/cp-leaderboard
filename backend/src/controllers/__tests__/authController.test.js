import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { connectTestDB, disconnectTestDB, clearTestDB } from '../../test/dbSetup.js';
import Account from '../../models/Account.js';
import PasswordResetToken from '../../models/PasswordResetToken.js';
import { register, login, logout, refreshToken, forgotPassword, resetPassword, getMe } from '../authController.js';

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
      const resetToken = await PasswordResetToken.create({
        accountId: account._id,
        token: 'valid-token-123',
        expiresAt: new Date(Date.now() + 3600000)
      });

      const { req, res } = createMockReqRes({ token: 'valid-token-123', password: 'newpass123' });

      await resetPassword(req, res);

      expect(res.json.mock.calls[0][0].success).toBe(true);

      // Verify password changed
      const updated = await Account.findById(account._id);
      expect(await updated.comparePassword('newpass123')).toBe(true);
      expect(updated.refreshTokenVersion).toBe(1);
    });

    it('rejects expired token', async () => {
      const account = await Account.create({ username: 'user', email: 'test@b.com', password: 'oldpass123' });
      await PasswordResetToken.create({
        accountId: account._id,
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1000) // expired
      });

      const { req, res } = createMockReqRes({ token: 'expired-token', password: 'newpass123' });

      await resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('rejects used token', async () => {
      const account = await Account.create({ username: 'user', email: 'test@b.com', password: 'oldpass123' });
      await PasswordResetToken.create({
        accountId: account._id,
        token: 'used-token',
        expiresAt: new Date(Date.now() + 3600000),
        used: true
      });

      const { req, res } = createMockReqRes({ token: 'used-token', password: 'newpass123' });

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
});
