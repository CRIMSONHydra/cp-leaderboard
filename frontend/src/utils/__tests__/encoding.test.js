import { describe, it, expect } from 'vitest';
import { safeBase64Encode, safeBase64Decode } from '../encoding';

describe('safeBase64Encode', () => {
  it('encodes ASCII string correctly', () => {
    expect(safeBase64Encode('hello')).toBe('aGVsbG8=');
  });

  it('encodes empty string without error', () => {
    const result = safeBase64Encode('');
    expect(typeof result).toBe('string');
  });

  it('encodes user:pass format correctly', () => {
    expect(safeBase64Encode('user:pass')).toBe('dXNlcjpwYXNz');
  });
});

describe('safeBase64Decode', () => {
  it('decodes ASCII base64 correctly', () => {
    expect(safeBase64Decode('aGVsbG8=')).toBe('hello');
  });

  it('decodes user:pass format correctly', () => {
    expect(safeBase64Decode('dXNlcjpwYXNz')).toBe('user:pass');
  });
});

describe('roundtrip', () => {
  it('roundtrips ASCII strings', () => {
    const str = 'hello world 123!@#';
    expect(safeBase64Decode(safeBase64Encode(str))).toBe(str);
  });

  it('roundtrips Unicode strings', () => {
    const str = 'user:пароль';
    expect(safeBase64Decode(safeBase64Encode(str))).toBe(str);
  });

  it('roundtrips Chinese characters', () => {
    const str = '用户:密码';
    expect(safeBase64Decode(safeBase64Encode(str))).toBe(str);
  });

  it('roundtrips emoji', () => {
    const str = 'hello 🌍';
    expect(safeBase64Decode(safeBase64Encode(str))).toBe(str);
  });
});
