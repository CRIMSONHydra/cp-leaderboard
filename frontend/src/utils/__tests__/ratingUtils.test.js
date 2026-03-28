import { describe, it, expect } from 'vitest';
import {
  getCodeforcesColor,
  getAtCoderColor,
  getLeetCodeColor,
  getCodeChefColor,
  getCodeChefRatingColor,
  getPlatformColor,
  getPlatformUrl,
  formatDate
} from '../ratingUtils';

describe('getCodeforcesColor', () => {
  it('returns gray for null/undefined/0', () => {
    expect(getCodeforcesColor(null)).toBe('#808080');
    expect(getCodeforcesColor(undefined)).toBe('#808080');
    expect(getCodeforcesColor(0)).toBe('#808080');
  });

  it('returns correct colors for each tier', () => {
    expect(getCodeforcesColor(3000)).toBe('#aa0000');  // LGM
    expect(getCodeforcesColor(2600)).toBe('#ff0000');  // IGM
    expect(getCodeforcesColor(2400)).toBe('#ff0000');  // GM
    expect(getCodeforcesColor(2300)).toBe('#ff8c00');  // IM
    expect(getCodeforcesColor(2100)).toBe('#ff8c00');  // Master
    expect(getCodeforcesColor(1900)).toBe('#aa00aa');  // CM
    expect(getCodeforcesColor(1600)).toBe('#0000ff');  // Expert
    expect(getCodeforcesColor(1400)).toBe('#03a89e');  // Specialist
    expect(getCodeforcesColor(1200)).toBe('#008000');  // Pupil
    expect(getCodeforcesColor(1199)).toBe('#808080');  // Newbie
  });
});

describe('getAtCoderColor', () => {
  it('returns gray for null', () => {
    expect(getAtCoderColor(null)).toBe('#808080');
  });

  it('returns correct colors for each tier', () => {
    expect(getAtCoderColor(2800)).toBe('#ff0000');  // Red
    expect(getAtCoderColor(2400)).toBe('#ff8000');  // Orange
    expect(getAtCoderColor(2000)).toBe('#c0c000');  // Yellow
    expect(getAtCoderColor(1600)).toBe('#0000ff');  // Blue
    expect(getAtCoderColor(1200)).toBe('#00c0c0');  // Cyan
    expect(getAtCoderColor(800)).toBe('#008000');   // Green
    expect(getAtCoderColor(400)).toBe('#804000');   // Brown
    expect(getAtCoderColor(399)).toBe('#808080');   // Gray
  });
});

describe('getLeetCodeColor', () => {
  it('returns gray for null', () => {
    expect(getLeetCodeColor(null)).toBe('#808080');
  });

  it('returns correct colors for each tier', () => {
    expect(getLeetCodeColor(2400)).toBe('#ff375f');  // Guardian
    expect(getLeetCodeColor(2100)).toBe('#ff9800');  // Orange
    expect(getLeetCodeColor(1900)).toBe('#9d4dc5');  // Violet
    expect(getLeetCodeColor(1600)).toBe('#007bff');  // Blue
    expect(getLeetCodeColor(1400)).toBe('#00af9b');  // Green
    expect(getLeetCodeColor(1399)).toBe('#808080');  // Gray
  });
});

describe('getCodeChefColor', () => {
  it('returns correct color for each star level', () => {
    expect(getCodeChefColor('7★')).toBe('#d0011b');
    expect(getCodeChefColor('6★')).toBe('#ff7f00');
    expect(getCodeChefColor('5★')).toBe('#ffbf00');
    expect(getCodeChefColor('4★')).toBe('#684273');
    expect(getCodeChefColor('3★')).toBe('#3366cc');
    expect(getCodeChefColor('2★')).toBe('#1e7d22');
    expect(getCodeChefColor('1★')).toBe('#666666');
  });

  it('returns default for unknown string', () => {
    expect(getCodeChefColor('unknown')).toBe('#666666');
  });
});

describe('getCodeChefRatingColor', () => {
  it('returns default for null', () => {
    expect(getCodeChefRatingColor(null)).toBe('#666666');
  });

  it('returns correct colors for each tier', () => {
    expect(getCodeChefRatingColor(2500)).toBe('#d0011b');  // 7★
    expect(getCodeChefRatingColor(2200)).toBe('#ff7f00');  // 6★
    expect(getCodeChefRatingColor(2000)).toBe('#ffbf00');  // 5★
    expect(getCodeChefRatingColor(1800)).toBe('#684273');  // 4★
    expect(getCodeChefRatingColor(1600)).toBe('#3366cc');  // 3★
    expect(getCodeChefRatingColor(1400)).toBe('#1e7d22');  // 2★
    expect(getCodeChefRatingColor(1399)).toBe('#666666');  // 1★
  });
});

describe('getPlatformColor', () => {
  it('dispatches to codeforces', () => {
    expect(getPlatformColor('codeforces', 1900, null)).toBe('#aa00aa');
  });

  it('dispatches to atcoder', () => {
    expect(getPlatformColor('atcoder', 2800, null)).toBe('#ff0000');
  });

  it('dispatches to leetcode', () => {
    expect(getPlatformColor('leetcode', 2400, null)).toBe('#ff375f');
  });

  it('uses getCodeChefColor when rank is provided', () => {
    expect(getPlatformColor('codechef', 2500, '7★')).toBe('#d0011b');
  });

  it('uses getCodeChefRatingColor when rank is absent', () => {
    expect(getPlatformColor('codechef', 2500, null)).toBe('#d0011b');
  });

  it('returns default for unknown platform', () => {
    expect(getPlatformColor('unknown', 1500, null)).toBe('#808080');
  });
});

describe('getPlatformUrl', () => {
  it('returns correct URL for each platform', () => {
    expect(getPlatformUrl('codeforces', 'user1')).toBe('https://codeforces.com/profile/user1');
    expect(getPlatformUrl('atcoder', 'user1')).toBe('https://atcoder.jp/users/user1');
    expect(getPlatformUrl('leetcode', 'user1')).toBe('https://leetcode.com/u/user1');
    expect(getPlatformUrl('codechef', 'user1')).toBe('https://www.codechef.com/users/user1');
  });

  it('returns # for unknown platform', () => {
    expect(getPlatformUrl('unknown', 'user1')).toBe('#');
  });
});

describe('formatDate', () => {
  it('returns Never for null/undefined', () => {
    expect(formatDate(null)).toBe('Never');
    expect(formatDate(undefined)).toBe('Never');
  });

  it('returns a non-empty string for valid date', () => {
    const result = formatDate('2024-01-15T12:00:00Z');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
    expect(result).not.toBe('Never');
  });
});
