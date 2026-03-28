/**
 * Shared constants for CP Leaderboard
 * Used by both frontend and backend to ensure consistency
 *
 * IMPORTANT: This is the single source of truth for platform configuration.
 * Do not duplicate these constants in other files.
 *
 * To add a new platform:
 * 1. Add its key to PLATFORMS
 * 2. Add display name to PLATFORM_NAMES
 * 3. Add profile URL prefix to PLATFORM_URLS
 * 4. Add chart color to PLATFORM_CHART_COLORS
 * 5. Create a fetcher in backend/src/services/platformFetchers/
 * 6. Add normalization tiers in backend/src/services/ratingUpdater.js
 * 7. Add color function in frontend/src/utils/ratingUtils.js
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

/**
 * Platform chart colors (used for graphs and visual identification)
 * @type {Object.<string, string>}
 */
export const PLATFORM_CHART_COLORS = {
  codeforces: '#1890ff',
  atcoder: '#52c41a',
  leetcode: '#faad14',
  codechef: '#722ed1'
};

