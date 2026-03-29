import { describe, it, expect, beforeEach, vi } from 'vitest';
import jwtAuth from '../jwtAuth.js';
import { generateAccessToken } from '../../services/tokenService.js';

beforeEach(() => {
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-12345';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-12345';
});

function createMockReqRes(cookies = {}) {
  const req = { cookies };
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn()
  };
  const next = vi.fn();
  return { req, res, next };
}

describe('jwtAuth middleware', () => {
  it('passes with a valid access token', async () => {
    const token = generateAccessToken('507f1f77bcf86cd799439011');
    const { req, res, next } = createMockReqRes({ accessToken: token });

    await jwtAuth(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.account.id).toBe('507f1f77bcf86cd799439011');
  });

  it('returns 401 when no cookie is present', async () => {
    const { req, res, next } = createMockReqRes();

    await jwtAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 for an invalid token', async () => {
    const { req, res, next } = createMockReqRes({ accessToken: 'garbage' });

    await jwtAuth(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
