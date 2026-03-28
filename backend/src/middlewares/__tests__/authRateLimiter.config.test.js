import { describe, it, expect } from 'vitest';
import { config } from '../authRateLimiter.js';

describe('authRateLimiter config', () => {
  it('MAX_FAILED_ATTEMPTS is 5', () => {
    expect(config.MAX_FAILED_ATTEMPTS).toBe(5);
  });

  it('LOCKOUT_DURATION_MS is 15 minutes', () => {
    expect(config.LOCKOUT_DURATION_MS).toBe(15 * 60 * 1000);
  });

  it('WINDOW_MS is 15 minutes', () => {
    expect(config.WINDOW_MS).toBe(15 * 60 * 1000);
  });
});
