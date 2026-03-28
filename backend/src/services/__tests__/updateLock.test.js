import { describe, it, expect } from 'vitest';
import { LOCK_ID, STALE_UPDATE_TIMEOUT_MS, generateOwnerId } from '../updateLock.js';

describe('LOCK_ID', () => {
  it('equals GLOBAL_UPDATE_LOCK', () => {
    expect(LOCK_ID).toBe('GLOBAL_UPDATE_LOCK');
  });
});

describe('STALE_UPDATE_TIMEOUT_MS', () => {
  it('equals 30 minutes in milliseconds', () => {
    expect(STALE_UPDATE_TIMEOUT_MS).toBe(30 * 60 * 1000);
  });
});

describe('generateOwnerId', () => {
  it('returns a string without prefix', () => {
    const id = generateOwnerId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  it('includes prefix when provided', () => {
    const id = generateOwnerId('cron');
    expect(id.startsWith('cron-')).toBe(true);
  });

  it('has process pid as first segment', () => {
    const id = generateOwnerId();
    const parts = id.split('-');
    expect(parts[0]).toBe(String(process.pid));
  });

  it('generates unique values on each call', () => {
    const id1 = generateOwnerId();
    const id2 = generateOwnerId();
    expect(id1).not.toBe(id2);
  });

  it('has correct format: pid-timestamp-random', () => {
    const id = generateOwnerId();
    const parts = id.split('-');
    expect(parts.length).toBeGreaterThanOrEqual(3);
  });

  it('has correct format with prefix: prefix-pid-timestamp-random', () => {
    const id = generateOwnerId('api');
    expect(id.startsWith('api-')).toBe(true);
    const parts = id.split('-');
    expect(parts.length).toBeGreaterThanOrEqual(4);
    expect(parts[0]).toBe('api');
  });
});
