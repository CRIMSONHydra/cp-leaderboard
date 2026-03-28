import { describe, it, expect } from 'vitest';
import { getRankFromRating } from '../leetcode.js';

describe('getRankFromRating', () => {
  it('returns Guardian for rating >= 3000', () => {
    expect(getRankFromRating(3000)).toBe('Guardian');
    expect(getRankFromRating(3500)).toBe('Guardian');
  });

  it('returns Knight for rating >= 2600', () => {
    expect(getRankFromRating(2600)).toBe('Knight');
    expect(getRankFromRating(2999)).toBe('Knight');
  });

  it('returns Top 5% for rating >= 2200', () => {
    expect(getRankFromRating(2200)).toBe('Top 5%');
    expect(getRankFromRating(2599)).toBe('Top 5%');
  });

  it('returns Top 10% for rating >= 1900', () => {
    expect(getRankFromRating(1900)).toBe('Top 10%');
    expect(getRankFromRating(2199)).toBe('Top 10%');
  });

  it('returns Top 20% for rating >= 1700', () => {
    expect(getRankFromRating(1700)).toBe('Top 20%');
    expect(getRankFromRating(1899)).toBe('Top 20%');
  });

  it('returns Top 30% for rating >= 1500', () => {
    expect(getRankFromRating(1500)).toBe('Top 30%');
    expect(getRankFromRating(1699)).toBe('Top 30%');
  });

  it('returns Beginner for rating < 1500', () => {
    expect(getRankFromRating(1499)).toBe('Beginner');
    expect(getRankFromRating(0)).toBe('Beginner');
    expect(getRankFromRating(1000)).toBe('Beginner');
  });
});
