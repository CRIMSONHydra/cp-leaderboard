import axios from 'axios';

const GRAPHQL_URL = 'https://leetcode.com/graphql/';

/**
 * Get approximate rank tier from LeetCode rating
 * Based on community research of rating distributions
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
