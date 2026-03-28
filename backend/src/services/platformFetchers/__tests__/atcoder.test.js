import { describe, it, expect } from 'vitest';
import { getRankFromRating } from '../atcoder.js';

describe('getRankFromRating', () => {
  it('returns Red for rating >= 2800', () => {
    expect(getRankFromRating(2800)).toBe('Red');
    expect(getRankFromRating(4000)).toBe('Red');
  });

  it('returns Orange for rating >= 2400', () => {
    expect(getRankFromRating(2400)).toBe('Orange');
    expect(getRankFromRating(2799)).toBe('Orange');
  });

  it('returns Yellow for rating >= 2000', () => {
    expect(getRankFromRating(2000)).toBe('Yellow');
    expect(getRankFromRating(2399)).toBe('Yellow');
  });

  it('returns Blue for rating >= 1600', () => {
    expect(getRankFromRating(1600)).toBe('Blue');
    expect(getRankFromRating(1999)).toBe('Blue');
  });

  it('returns Cyan for rating >= 1200', () => {
    expect(getRankFromRating(1200)).toBe('Cyan');
    expect(getRankFromRating(1599)).toBe('Cyan');
  });

  it('returns Green for rating >= 800', () => {
    expect(getRankFromRating(800)).toBe('Green');
    expect(getRankFromRating(1199)).toBe('Green');
  });

  it('returns Brown for rating >= 400', () => {
    expect(getRankFromRating(400)).toBe('Brown');
    expect(getRankFromRating(799)).toBe('Brown');
  });

  it('returns Gray for rating < 400', () => {
    expect(getRankFromRating(399)).toBe('Gray');
    expect(getRankFromRating(0)).toBe('Gray');
  });
});
