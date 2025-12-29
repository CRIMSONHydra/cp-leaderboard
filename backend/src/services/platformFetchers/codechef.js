import axios from 'axios';

// Using third-party API since CodeChef has no official public API
const CODECHEF_API = 'https://codechef-api.vercel.app/handle';

async function fetchCodeChefRating(handle) {
  try {
    const response = await axios.get(
      `${CODECHEF_API}/${encodeURIComponent(handle)}`,
      { timeout: 15000 }
    );

    const data = response.data;

    if (data.success === false || data.error) {
      return {
        rating: null,
        maxRating: null,
        rank: null,
        lastUpdated: new Date(),
        error: data.error || 'User not found'
      };
    }

    if (data.currentRating !== undefined) {
      return {
        rating: parseInt(data.currentRating) || null,
        maxRating: parseInt(data.highestRating) || null,
        rank: data.stars || null,
        lastUpdated: new Date(),
        error: null
      };
    }

    return {
      rating: null,
      maxRating: null,
      rank: null,
      lastUpdated: new Date(),
      error: 'No rating data available'
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

export { fetchCodeChefRating };
