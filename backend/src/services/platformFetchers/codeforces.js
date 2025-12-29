import axios from 'axios';

const BASE_URL = 'https://codeforces.com/api';
const RATE_LIMIT_DELAY = 250; // 4 req/sec to be safe (limit is 5/sec)

let lastRequestTime = 0;

async function fetchCodeforcesRating(handle) {
  // Rate limiting
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
    await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY - timeSinceLastRequest));
  }
  lastRequestTime = Date.now();

  try {
    const response = await axios.get(`${BASE_URL}/user.info`, {
      params: { handles: handle },
      timeout: 10000
    });

    if (response.data.status === 'OK' && response.data.result.length > 0) {
      const user = response.data.result[0];
      return {
        rating: user.rating || null,
        maxRating: user.maxRating || null,
        rank: user.rank || null,
        maxRank: user.maxRank || null,
        lastUpdated: new Date(),
        error: null
      };
    }
    return {
      rating: null,
      maxRating: null,
      rank: null,
      maxRank: null,
      lastUpdated: new Date(),
      error: 'User not found'
    };
  } catch (error) {
    const errorMsg = error.response?.data?.comment || error.message || 'Failed to fetch';
    return {
      rating: null,
      maxRating: null,
      rank: null,
      maxRank: null,
      lastUpdated: new Date(),
      error: errorMsg
    };
  }
}

export { fetchCodeforcesRating };
