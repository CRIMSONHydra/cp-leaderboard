import { describe, it, expect } from 'vitest';
import { encodeBasicAuth, createAuthHeader } from '../basicAuth';
import { safeBase64Decode } from '../encoding';

describe('encodeBasicAuth', () => {
  it('encodes valid credentials to base64', () => {
    const encoded = encodeBasicAuth('user', 'pass');
    expect(safeBase64Decode(encoded)).toBe('user:pass');
  });

  it('throws for empty username', () => {
    expect(() => encodeBasicAuth('', 'pass')).toThrow('Username must be a non-empty string');
  });

  it('throws for whitespace-only username', () => {
    expect(() => encodeBasicAuth('   ', 'pass')).toThrow('Username must be a non-empty string');
  });

  it('throws for empty password', () => {
    expect(() => encodeBasicAuth('user', '')).toThrow('Password must be a non-empty string');
  });

  it('throws for whitespace-only password', () => {
    expect(() => encodeBasicAuth('user', '   ')).toThrow('Password must be a non-empty string');
  });

  it('throws for non-string username', () => {
    expect(() => encodeBasicAuth(123, 'pass')).toThrow('Username must be a non-empty string');
  });

  it('throws for non-string password', () => {
    expect(() => encodeBasicAuth('user', null)).toThrow('Password must be a non-empty string');
  });

  it('throws for username with colon', () => {
    expect(() => encodeBasicAuth('us:er', 'pass')).toThrow("Username must not contain ':'");
  });

  it('throws for password with colon', () => {
    expect(() => encodeBasicAuth('user', 'pa:ss')).toThrow("Password must not contain ':'");
  });
});

describe('createAuthHeader', () => {
  it('returns string starting with "Basic "', () => {
    const header = createAuthHeader('user', 'pass');
    expect(header.startsWith('Basic ')).toBe(true);
  });

  it('contains valid base64 after prefix', () => {
    const header = createAuthHeader('user', 'pass');
    const base64Part = header.slice(6);
    expect(safeBase64Decode(base64Part)).toBe('user:pass');
  });
});
