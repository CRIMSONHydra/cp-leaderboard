import { describe, it, expect } from 'vitest';
import { normalizeRating, calculateAggregateScore, NORMALIZATION_TIERS } from '../ratingUpdater.js';

describe('normalizeRating', () => {
  describe('codeforces', () => {
    it('returns 0 for minimum tier (800)', () => {
      expect(normalizeRating('codeforces', 800)).toBe(0);
    });

    it('returns 100 for maximum tier (3500)', () => {
      expect(normalizeRating('codeforces', 3500)).toBe(100);
    });

    it('returns 0 for below minimum', () => {
      expect(normalizeRating('codeforces', 500)).toBe(0);
    });

    it('returns 100 for above maximum', () => {
      expect(normalizeRating('codeforces', 4000)).toBe(100);
    });

    it('returns exact value at tier boundary (1200 -> 20)', () => {
      expect(normalizeRating('codeforces', 1200)).toBe(20);
    });

    it('interpolates mid-tier correctly (1000 between 800->0 and 1200->20)', () => {
      expect(normalizeRating('codeforces', 1000)).toBe(10);
    });

    it('interpolates between 1600->40 and 1900->50', () => {
      const result = normalizeRating('codeforces', 1750);
      expect(result).toBeCloseTo(45, 0);
    });
  });

  describe('atcoder', () => {
    it('returns 0 at minimum tier (400)', () => {
      expect(normalizeRating('atcoder', 400)).toBe(0);
    });

    it('returns 100 at maximum tier (4000)', () => {
      expect(normalizeRating('atcoder', 4000)).toBe(100);
    });

    it('returns 20 at 800', () => {
      expect(normalizeRating('atcoder', 800)).toBe(20);
    });
  });

  describe('leetcode', () => {
    it('returns 0 at minimum tier (1200)', () => {
      expect(normalizeRating('leetcode', 1200)).toBe(0);
    });

    it('returns 100 at maximum tier (3500)', () => {
      expect(normalizeRating('leetcode', 3500)).toBe(100);
    });
  });

  describe('codechef', () => {
    it('returns 0 at minimum tier (1000)', () => {
      expect(normalizeRating('codechef', 1000)).toBe(0);
    });

    it('returns 100 at maximum tier (3500)', () => {
      expect(normalizeRating('codechef', 3500)).toBe(100);
    });
  });

  describe('edge cases', () => {
    it('returns null for unknown platform', () => {
      expect(normalizeRating('unknown', 1500)).toBeNull();
    });

    it('returns null for null rating', () => {
      expect(normalizeRating('codeforces', null)).toBeNull();
    });

    it('returns null for undefined rating', () => {
      expect(normalizeRating('codeforces', undefined)).toBeNull();
    });
  });
});

describe('calculateAggregateScore', () => {
  it('returns star score for single platform', () => {
    const ratings = {
      codeforces: { rating: 1200, error: null }
    };
    // normalized: 20, star: 1 + (20/100)*9 = 2.8
    expect(calculateAggregateScore(ratings)).toBe(2.8);
  });

  it('averages scores for multiple platforms', () => {
    const ratings = {
      codeforces: { rating: 800, error: null },   // normalized: 0
      atcoder: { rating: 4000, error: null }       // normalized: 100
    };
    // avg: 50, star: 1 + (50/100)*9 = 5.5
    expect(calculateAggregateScore(ratings)).toBe(5.5);
  });

  it('excludes platforms with errors', () => {
    const ratings = {
      codeforces: { rating: 1200, error: null },
      atcoder: { rating: 800, error: 'API error' }
    };
    // Only codeforces counts (normalized: 20), star: 2.8
    expect(calculateAggregateScore(ratings)).toBe(2.8);
  });

  it('excludes platforms with null rating', () => {
    const ratings = {
      codeforces: { rating: null, error: null },
      atcoder: { rating: 800, error: null }
    };
    // Only atcoder counts (normalized: 20), star: 2.8
    expect(calculateAggregateScore(ratings)).toBe(2.8);
  });

  it('skips platforms with rating 0 due to truthiness check', () => {
    const ratings = {
      codeforces: { rating: 0, error: null },
      atcoder: { rating: 800, error: null }
    };
    // Only atcoder counts (normalized: 20), star: 2.8
    expect(calculateAggregateScore(ratings)).toBe(2.8);
  });

  it('returns 0 for empty ratings', () => {
    expect(calculateAggregateScore({})).toBe(0);
  });

  it('rounds to one decimal place', () => {
    // codeforces 1300 → normalized 25
    // atcoder 600 → normalized 10
    // avg: 17.5, star: 1 + (17.5/100)*9 = 2.575 → rounds to 2.6
    const ratings = {
      codeforces: { rating: 1300, error: null },
      atcoder: { rating: 600, error: null }
    };
    expect(calculateAggregateScore(ratings)).toBe(2.6);
  });

  it('returns minimum star score of 1.0 for lowest normalized ratings', () => {
    const ratings = {
      codeforces: { rating: 800, error: null }  // normalized: 0
    };
    // star: 1 + (0/100)*9 = 1.0
    expect(calculateAggregateScore(ratings)).toBe(1);
  });

  it('returns maximum star score of 10.0 for highest normalized ratings', () => {
    const ratings = {
      codeforces: { rating: 3500, error: null }  // normalized: 100
    };
    // star: 1 + (100/100)*9 = 10.0
    expect(calculateAggregateScore(ratings)).toBe(10);
  });
});

describe('NORMALIZATION_TIERS', () => {
  it('has tiers for all 4 platforms', () => {
    expect(NORMALIZATION_TIERS).toHaveProperty('codeforces');
    expect(NORMALIZATION_TIERS).toHaveProperty('atcoder');
    expect(NORMALIZATION_TIERS).toHaveProperty('leetcode');
    expect(NORMALIZATION_TIERS).toHaveProperty('codechef');
  });

  it('has tiers sorted ascending by rating for each platform', () => {
    for (const [platform, tiers] of Object.entries(NORMALIZATION_TIERS)) {
      for (let i = 1; i < tiers.length; i++) {
        expect(tiers[i].rating).toBeGreaterThan(tiers[i - 1].rating);
      }
    }
  });

  it('has normalized values sorted ascending for each platform', () => {
    for (const [platform, tiers] of Object.entries(NORMALIZATION_TIERS)) {
      for (let i = 1; i < tiers.length; i++) {
        expect(tiers[i].normalized).toBeGreaterThanOrEqual(tiers[i - 1].normalized);
      }
    }
  });
});
