import { describe, it, expect, vi, beforeEach } from 'vitest';
import bcrypt from 'bcrypt';

// Mock AdminCredential before importing basicAuth
vi.mock('../../models/AdminCredential.js', () => ({
  default: {
    findOne: vi.fn()
  }
}));

const { default: AdminCredential } = await import('../../models/AdminCredential.js');
const { default: basicAuth } = await import('../basicAuth.js');

function createReq(authHeader = null) {
  return {
    headers: {
      authorization: authHeader
    },
    authRateLimiter: {
      recordFailed: vi.fn().mockResolvedValue(undefined),
      clearFailed: vi.fn().mockResolvedValue(undefined)
    }
  };
}

function createRes() {
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(data) {
      res.body = data;
      return res;
    }
  };
  return res;
}

describe('basicAuth middleware', () => {
  const next = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 when no Authorization header', async () => {
    const req = createReq(null);
    const res = createRes();
    await basicAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toContain('Basic authentication required');
    expect(req.authRateLimiter.recordFailed).toHaveBeenCalled();
  });

  it('returns 401 when header does not start with "Basic "', async () => {
    const req = createReq('Bearer token123');
    const res = createRes();
    await basicAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(req.authRateLimiter.recordFailed).toHaveBeenCalled();
  });

  it('returns 401 for empty username or password', async () => {
    // Base64 of ":password" (empty username)
    const req = createReq(`Basic ${Buffer.from(':password').toString('base64')}`);
    const res = createRes();
    await basicAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Invalid credentials format');
  });

  it('returns 401 when user not found in DB', async () => {
    AdminCredential.findOne.mockResolvedValue(null);

    const req = createReq(`Basic ${Buffer.from('admin:pass').toString('base64')}`);
    const res = createRes();
    await basicAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Invalid username or password');
    expect(req.authRateLimiter.recordFailed).toHaveBeenCalled();
  });

  it('returns 401 when password does not match', async () => {
    AdminCredential.findOne.mockResolvedValue({
      username: 'admin',
      comparePassword: vi.fn().mockResolvedValue(false)
    });

    const req = createReq(`Basic ${Buffer.from('admin:wrong').toString('base64')}`);
    const res = createRes();
    await basicAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Invalid username or password');
    expect(req.authRateLimiter.recordFailed).toHaveBeenCalled();
  });

  it('calls next() and sets req.user on valid credentials', async () => {
    AdminCredential.findOne.mockResolvedValue({
      username: 'admin',
      comparePassword: vi.fn().mockResolvedValue(true)
    });

    const req = createReq(`Basic ${Buffer.from('admin:correct').toString('base64')}`);
    const res = createRes();
    await basicAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toEqual({ username: 'admin' });
    expect(req.authRateLimiter.clearFailed).toHaveBeenCalled();
  });

  it('performs bcrypt compare even when user not found (timing attack resistance)', async () => {
    const compareSpy = vi.spyOn(bcrypt, 'compare');
    AdminCredential.findOne.mockResolvedValue(null);

    const req = createReq(`Basic ${Buffer.from('nouser:pass').toString('base64')}`);
    const res = createRes();
    await basicAuth(req, res, next);

    expect(res.statusCode).toBe(401);
    expect(compareSpy).toHaveBeenCalled();
    compareSpy.mockRestore();
  });

  it('handles DB error with 500', async () => {
    AdminCredential.findOne.mockRejectedValue(new Error('DB connection lost'));

    const req = createReq(`Basic ${Buffer.from('admin:pass').toString('base64')}`);
    const res = createRes();
    await basicAuth(req, res, next);

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Authentication error');
  });
});
