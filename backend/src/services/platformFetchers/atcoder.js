const axios = require('axios');

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
        lastUpdated: new Date(),
        error: null
      };
    }
    // User exists but hasn't participated in rated contests
    return {
      rating: null,
      maxRating: null,
      rank: 'Unrated',
      lastUpdated: new Date(),
      error: null
    };
  } catch (error) {
    if (error.response?.status === 404) {
      return {
        rating: null,
        maxRating: null,
        rank: null,
        lastUpdated: new Date(),
        error: 'User not found'
      };
    }
    return {
      rating: null,
      maxRating: null,
      rank: null,
      lastUpdated: new Date(),
      error: error.message || 'Failed to fetch'
    };
  }
}

module.exports = { fetchAtCoderRating };
