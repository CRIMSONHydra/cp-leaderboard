import { describe, it, expect } from 'vitest';
import { getStarsFromRating } from '../codechef.js';

describe('getStarsFromRating', () => {
  it('returns 7★ for rating >= 2500', () => {
    expect(getStarsFromRating(2500)).toBe('7★');
    expect(getStarsFromRating(3000)).toBe('7★');
  });

  it('returns 6★ for rating >= 2200', () => {
    expect(getStarsFromRating(2200)).toBe('6★');
    expect(getStarsFromRating(2499)).toBe('6★');
  });

  it('returns 5★ for rating >= 2000', () => {
    expect(getStarsFromRating(2000)).toBe('5★');
    expect(getStarsFromRating(2199)).toBe('5★');
  });

  it('returns 4★ for rating >= 1800', () => {
    expect(getStarsFromRating(1800)).toBe('4★');
    expect(getStarsFromRating(1999)).toBe('4★');
  });

  it('returns 3★ for rating >= 1600', () => {
    expect(getStarsFromRating(1600)).toBe('3★');
    expect(getStarsFromRating(1799)).toBe('3★');
  });

  it('returns 2★ for rating >= 1400', () => {
    expect(getStarsFromRating(1400)).toBe('2★');
    expect(getStarsFromRating(1599)).toBe('2★');
  });

  it('returns 1★ for rating < 1400', () => {
    expect(getStarsFromRating(1399)).toBe('1★');
    expect(getStarsFromRating(0)).toBe('1★');
    expect(getStarsFromRating(1000)).toBe('1★');
  });
});
