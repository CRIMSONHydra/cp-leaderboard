import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
} from '../tokenService.js';

beforeEach(() => {
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-12345';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-12345';
});

describe('tokenService', () => {
  const accountId = '507f1f77bcf86cd799439011';

  it('generates and verifies an access token', () => {
    const token = generateAccessToken(accountId);
    const decoded = verifyAccessToken(token);

    expect(decoded.sub).toBe(accountId);
    expect(decoded.exp).toBeDefined();
  });

  it('generates and verifies a refresh token', () => {
    const token = generateRefreshToken(accountId, 0);
    const decoded = verifyRefreshToken(token);

    expect(decoded.sub).toBe(accountId);
    expect(decoded.v).toBe(0);
  });

  it('rejects an invalid access token', () => {
    expect(() => verifyAccessToken('invalid-token')).toThrow();
  });

  it('rejects an invalid refresh token', () => {
    expect(() => verifyRefreshToken('invalid-token')).toThrow();
  });

  it('rejects access token verified with refresh secret', () => {
    const token = generateAccessToken(accountId);
    expect(() => verifyRefreshToken(token)).toThrow();
  });

  it('throws if JWT_ACCESS_SECRET is not set', () => {
    delete process.env.JWT_ACCESS_SECRET;
    expect(() => generateAccessToken(accountId)).toThrow('JWT_ACCESS_SECRET');
  });

  it('throws if JWT_REFRESH_SECRET is not set', () => {
    delete process.env.JWT_REFRESH_SECRET;
    expect(() => generateRefreshToken(accountId, 0)).toThrow('JWT_REFRESH_SECRET');
  });
});
