import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Fetch rating history from Codeforces API
 * @param {string} handle - Codeforces handle
 * @returns {Promise<Array>} Array of rating history entries
 */
async function fetchCodeforcesHistory(handle) {
  try {
    const response = await axios.get(
      `https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`,
      { timeout: 15000 }
    );

    if (response.data.status !== 'OK') {
      return { success: false, error: response.data.comment || 'API error' };
    }

    const history = response.data.result.map(entry => ({
      date: new Date(entry.ratingUpdateTimeSeconds * 1000).toISOString(),
      rating: entry.newRating,
      contestName: entry.contestName,
      rank: entry.rank,
      change: entry.newRating - entry.oldRating
    }));

    return { success: true, data: history };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Fetch rating history from AtCoder API
 * @param {string} handle - AtCoder handle
 * @returns {Promise<Array>} Array of rating history entries
 */
async function fetchAtCoderHistory(handle) {
  try {
    const response = await axios.get(
      `https://atcoder.jp/users/${encodeURIComponent(handle)}/history/json`,
      { timeout: 15000 }
    );

    const history = response.data.map(entry => ({
      date: new Date(entry.EndTime).toISOString(),
      rating: entry.NewRating,
      contestName: entry.ContestName,
      rank: entry.Place,
      change: entry.NewRating - entry.OldRating,
      performance: entry.Performance
    }));

    return { success: true, data: history };
  } catch (error) {
    if (error.response?.status === 404) {
      return { success: false, error: 'User not found' };
    }
    return { success: false, error: error.message };
  }
}

/**
 * Fetch rating history from LeetCode GraphQL API
 * @param {string} handle - LeetCode username
 * @returns {Promise<Array>} Array of rating history entries
 */
async function fetchLeetCodeHistory(handle) {
  try {
    const query = `
      query userContestRankingHistory($username: String!) {
        userContestRankingHistory(username: $username) {
          attended
          rating
          ranking
          trendDirection
          problemsSolved
          totalProblems
          finishTimeInSeconds
          contest {
            title
            startTime
          }
        }
      }
    `;

    const response = await axios.post(
      'https://leetcode.com/graphql',
      {
        query,
        variables: { username: handle }
      },
      {
        timeout: 15000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      }
    );

    const historyData = response.data?.data?.userContestRankingHistory;
    
    if (!historyData) {
      return { success: false, error: 'No contest history found' };
    }

    // Filter only attended contests and map to our format
    let prevRating = 1500; // Default starting rating
    const history = historyData
      .filter(entry => entry.attended)
      .map(entry => {
        const change = Math.round(entry.rating - prevRating);
        const result = {
          date: new Date(entry.contest.startTime * 1000).toISOString(),
          rating: Math.round(entry.rating),
          contestName: entry.contest.title,
          rank: entry.ranking,
          change: change
        };
        prevRating = entry.rating;
        return result;
      });

    return { success: true, data: history };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Fetch rating history from CodeChef by scraping profile page
 * @param {string} handle - CodeChef handle
 * @returns {Promise<Array>} Array of rating history entries
 */
async function fetchCodeChefHistory(handle) {
  try {
    // CodeChef doesn't have a public API for contest history
    // We'll try to scrape basic info from the profile page
    const response = await axios.get(
      `https://www.codechef.com/users/${encodeURIComponent(handle)}`,
      {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html'
        }
      }
    );

    const $ = cheerio.load(response.data);
    
    // Check if user exists
    const hasUserDetails = $('.user-details-container').length > 0;
    if (!hasUserDetails) {
      return { success: false, error: 'User not found' };
    }

    // Try to extract rating graph data from script tags
    // CodeChef embeds rating history in JavaScript
    const scriptTags = $('script').toArray();
    let ratingData = [];

    for (const script of scriptTags) {
      const content = $(script).html() || '';
      
      // Look for rating data in various formats CodeChef uses
      const dateRatingMatch = content.match(/all_rating\s*=\s*(\[[\s\S]*?\]);/);
      if (dateRatingMatch) {
        try {
          const data = JSON.parse(dateRatingMatch[1]);
          ratingData = data.map(entry => ({
            date: entry.end_date || entry.gettime || new Date().toISOString(),
            rating: parseInt(entry.rating) || 0,
            contestName: entry.name || entry.code || 'Contest',
            rank: entry.rank || null,
            change: 0
          }));
          break;
        } catch (e) {
          // Continue searching
        }
      }

      // Alternative format
      const ratingMatch = content.match(/rating_data\s*:\s*(\[[\s\S]*?\])/);
      if (ratingMatch) {
        try {
          const data = JSON.parse(ratingMatch[1]);
          ratingData = data.map(entry => ({
            date: new Date(entry[0]).toISOString(),
            rating: parseInt(entry[1]) || 0,
            contestName: entry[2] || 'Contest',
            rank: null,
            change: 0
          }));
          break;
        } catch (e) {
          // Continue searching
        }
      }
    }

    // Calculate changes
    for (let i = 1; i < ratingData.length; i++) {
      ratingData[i].change = ratingData[i].rating - ratingData[i - 1].rating;
    }

    if (ratingData.length === 0) {
      return { success: true, data: [] }; // User exists but no contest history
    }

    return { success: true, data: ratingData };
  } catch (error) {
    if (error.response?.status === 404) {
      return { success: false, error: 'User not found' };
    }
    return { success: false, error: error.message };
  }
}

/**
 * Fetch rating history for all platforms for a user
 * @param {object} handles - Object with platform handles
 * @returns {Promise<object>} Object with history for each platform
 */
async function fetchAllHistory(handles) {
  const results = {};
  const promises = [];

  if (handles.codeforces) {
    promises.push(
      fetchCodeforcesHistory(handles.codeforces).then(r => {
        results.codeforces = r;
      })
    );
  }

  if (handles.atcoder) {
    promises.push(
      fetchAtCoderHistory(handles.atcoder).then(r => {
        results.atcoder = r;
      })
    );
  }

  if (handles.leetcode) {
    promises.push(
      fetchLeetCodeHistory(handles.leetcode).then(r => {
        results.leetcode = r;
      })
    );
  }

  if (handles.codechef) {
    promises.push(
      fetchCodeChefHistory(handles.codechef).then(r => {
        results.codechef = r;
      })
    );
  }

  // Fetch all in parallel
  await Promise.all(promises);

  return results;
}

export {
  fetchCodeforcesHistory,
  fetchAtCoderHistory,
  fetchLeetCodeHistory,
  fetchCodeChefHistory,
  fetchAllHistory
};

