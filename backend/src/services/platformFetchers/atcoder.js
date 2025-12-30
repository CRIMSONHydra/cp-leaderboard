import axios from 'axios';

/**
 * Map a numeric rating to its color-based rank.
 *
 * @returns {string} The rank corresponding to the rating: 'Red' (>= 2800), 'Orange' (>= 2400), 'Yellow' (>= 2000), 'Blue' (>= 1600), 'Cyan' (>= 1200), 'Green' (>= 800), 'Brown' (>= 400), or 'Gray' otherwise.
 */
function getRankFromRating(rating) {
  if (rating >= 2800) return 'Red';
  if (rating >= 2400) return 'Orange';
  if (rating >= 2000) return 'Yellow';
  if (rating >= 1600) return 'Blue';
  if (rating >= 1200) return 'Cyan';
  if (rating >= 800) return 'Green';
  if (rating >= 400) return 'Brown';
  return 'Gray';
}

/**
 * Fetches an AtCoder user's rating history and derives the current rating, maximum rating, and corresponding color ranks.
 * @param {string} handle - AtCoder username (handle) to query.
 * @returns {{rating: number|null, maxRating: number|null, rank: string|null, maxRank: string|null, lastUpdated: Date, error: string|null}} An object containing:
 *  - `rating`: the user's latest `NewRating`, or `null` if unavailable;
 *  - `maxRating`: the highest `NewRating` seen in history, or `null` if unavailable;
 *  - `rank`: the color-based rank for the latest rating, `'Unrated'` if the user has no rated contests, or `null` if the user was not found or an error occurred;
 *  - `maxRank`: the color-based rank for `maxRating`, or `null` if unavailable;
 *  - `lastUpdated`: the timestamp when the result was produced;
 *  - `error`: `null` on success, `'User not found'` if the handle does not exist, or an error message for other failures.
 */
async function fetchAtCoderRating(handle) {
  try {
    const response = await axios.get(
      `https://atcoder.jp/users/${encodeURIComponent(handle)}/history/json`,
      { timeout: 10000 }
    );

    const history = response.data;
    if (history && history.length > 0) {
      const latest = history[history.length - 1];
      const maxRating = Math.max(...history.map(h => h.NewRating));
      return {
        rating: latest.NewRating,
        maxRating: maxRating,
        rank: getRankFromRating(latest.NewRating),
        maxRank: getRankFromRating(maxRating),
        lastUpdated: new Date(),
        error: null
      };
    }
    // User exists but hasn't participated in rated contests
    return {
      rating: null,
      maxRating: null,
      rank: 'Unrated',
      maxRank: null,
      lastUpdated: new Date(),
      error: null
    };
  } catch (error) {
    if (error.response?.status === 404) {
      return {
        rating: null,
        maxRating: null,
        rank: null,
        maxRank: null,
        lastUpdated: new Date(),
        error: 'User not found'
      };
    }
    return {
      rating: null,
      maxRating: null,
      rank: null,
      maxRank: null,
      lastUpdated: new Date(),
      error: error.message || 'Failed to fetch'
    };
  }
}

export { fetchAtCoderRating };