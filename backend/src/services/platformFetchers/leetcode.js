import axios from 'axios';

const GRAPHQL_URL = 'https://leetcode.com/graphql/';

/**
 * Map a LeetCode numeric rating to an approximate textual rank tier.
 * @param {number} rating - LeetCode contest rating.
 * @returns {'Guardian' | 'Knight' | 'Top 5%' | 'Top 10%' | 'Top 20%' | 'Top 30%' | 'Beginner'} The rank tier corresponding to the given rating.
 */
function getRankFromRating(rating) {
  if (rating >= 3000) return 'Guardian';
  if (rating >= 2600) return 'Knight';
  if (rating >= 2200) return 'Top 5%';
  if (rating >= 1900) return 'Top 10%';
  if (rating >= 1700) return 'Top 20%';
  if (rating >= 1500) return 'Top 30%';
  return 'Beginner';
}

/**
 * Fetches contest rating and rank information for a LeetCode user.
 *
 * @param {string} handle - LeetCode username to query.
 * @returns {{rating: number|null, maxRating: number|null, rank: string|null, maxRank: number|null, lastUpdated: Date, error: string|null}}
 * An object containing:
 * - `rating`: rounded current contest rating, or `null` if unavailable.
 * - `maxRating`: `null` (not provided by LeetCode).
 * - `rank`: badge name (e.g., "Guardian") or a string like `"Top X%"`, `"Unrated"`, or `null` if user not found.
 * - `maxRank`: `null` (not provided by LeetCode).
 * - `lastUpdated`: timestamp when the data was fetched.
 * - `error`: error message if the fetch failed or user was not found, otherwise `null`.
 */
async function fetchLeetCodeRating(handle) {
  const query = `
    query userContestRankingInfo($username: String!) {
      userContestRanking(username: $username) {
        rating
        globalRanking
        topPercentage
        badge {
          name
        }
      }
      matchedUser(username: $username) {
        username
      }
    }
  `;

  try {
    const response = await axios.post(GRAPHQL_URL, {
      query,
      variables: { username: handle }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com'
      },
      timeout: 10000
    });

    const data = response.data?.data;

    // Check if user exists
    if (!data?.matchedUser) {
      return {
        rating: null,
        maxRating: null,
        rank: null,
        maxRank: null,
        lastUpdated: new Date(),
        error: 'User not found'
      };
    }

    const ranking = data.userContestRanking;
    if (ranking && ranking.rating) {
      const rankStr = ranking.badge?.name ||
        (ranking.topPercentage ? `Top ${ranking.topPercentage.toFixed(1)}%` : null);
      return {
        rating: Math.round(ranking.rating),
        maxRating: null, // LeetCode doesn't easily expose max rating
        rank: rankStr,
        maxRank: null, // LeetCode doesn't track max rank
        lastUpdated: new Date(),
        error: null
      };
    }

    // User exists but hasn't participated in contests
    return {
      rating: null,
      maxRating: null,
      rank: 'Unrated',
      maxRank: null,
      lastUpdated: new Date(),
      error: null
    };
  } catch (error) {
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

export { fetchLeetCodeRating, getRankFromRating };