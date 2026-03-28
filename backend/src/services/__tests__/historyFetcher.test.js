import { describe, it, expect } from 'vitest';
import { cleanAtCoderContestName } from '../historyFetcher.js';

describe('cleanAtCoderContestName', () => {
  it('returns "Contest" for null', () => {
    expect(cleanAtCoderContestName(null)).toBe('Contest');
  });

  it('returns "Contest" for undefined', () => {
    expect(cleanAtCoderContestName(undefined)).toBe('Contest');
  });

  it('returns "Contest" for empty string', () => {
    expect(cleanAtCoderContestName('')).toBe('Contest');
  });

  it('picks English part when " / " separator exists', () => {
    expect(cleanAtCoderContestName('日本語名 / English Name')).toBe('English Name');
  });

  it('picks left side when it has more ASCII chars', () => {
    expect(cleanAtCoderContestName('ABC 300 / 日本語')).toBe('ABC 300');
  });

  it('returns pure ASCII name unchanged', () => {
    expect(cleanAtCoderContestName('AtCoder Beginner Contest 300')).toBe('AtCoder Beginner Contest 300');
  });

  it('strips non-ASCII characters when no separator found', () => {
    const result = cleanAtCoderContestName('ABC300テスト');
    expect(result).toBe('ABC300');
  });

  it('returns original if cleaning removes everything', () => {
    const japaneseOnly = 'テスト';
    expect(cleanAtCoderContestName(japaneseOnly)).toBe(japaneseOnly);
  });
});
