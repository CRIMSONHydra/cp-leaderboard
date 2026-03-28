import { describe, it, expect } from 'vitest';
import { PLATFORMS, PLATFORM_NAMES, PLATFORM_URLS, PLATFORM_CHART_COLORS } from '../../constants/platforms';

describe('shared constants', () => {
  it('PLATFORMS has all 4 platforms', () => {
    expect(PLATFORMS).toEqual(['codeforces', 'atcoder', 'leetcode', 'codechef']);
  });

  it('PLATFORM_NAMES covers all PLATFORMS', () => {
    for (const p of PLATFORMS) {
      expect(PLATFORM_NAMES[p]).toBeDefined();
      expect(typeof PLATFORM_NAMES[p]).toBe('string');
    }
  });

  it('PLATFORM_URLS covers all PLATFORMS', () => {
    for (const p of PLATFORMS) {
      expect(PLATFORM_URLS[p]).toBeDefined();
      expect(PLATFORM_URLS[p]).toMatch(/^https:\/\//);
    }
  });

  it('PLATFORM_CHART_COLORS covers all PLATFORMS', () => {
    for (const p of PLATFORMS) {
      expect(PLATFORM_CHART_COLORS[p]).toBeDefined();
      expect(PLATFORM_CHART_COLORS[p]).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
