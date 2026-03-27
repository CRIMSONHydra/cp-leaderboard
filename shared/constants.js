/**
 * Shared constants for CP Leaderboard
 * Used by both frontend and backend to ensure consistency
 * 
 * IMPORTANT: This is the single source of truth for platform configuration.
 * Do not duplicate these constants in other files.
 */

/**
 * List of supported competitive programming platforms
 * @type {string[]}
 */
export const PLATFORMS = ['codeforces', 'atcoder', 'leetcode', 'codechef'];

/**
 * Platform display names
 * @type {Object.<string, string>}
 */
export const PLATFORM_NAMES = {
  codeforces: 'Codeforces',
  atcoder: 'AtCoder',
  leetcode: 'LeetCode',
  codechef: 'CodeChef'
};

/**
 * Platform URLs
 * @type {Object.<string, string>}
 */
export const PLATFORM_URLS = {
  codeforces: 'https://codeforces.com/profile/',
  atcoder: 'https://atcoder.jp/users/',
  leetcode: 'https://leetcode.com/u/',
  codechef: 'https://www.codechef.com/users/'
};

