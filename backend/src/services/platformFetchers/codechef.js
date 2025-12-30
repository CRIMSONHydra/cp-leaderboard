import axios from 'axios';
import * as cheerio from 'cheerio';

// Third-party API (primary method)
const CODECHEF_API = 'https://codechef-api.vercel.app/handle';

// CodeChef profile URL for web scraping (fallback)
const CODECHEF_PROFILE_URL = 'https://www.codechef.com/users';

/**
 * Fetches CodeChef rating data for a user via the configured third-party API.
 *
 * Attempts to obtain the user's current rating, highest rating, and star-based rank,
 * and returns a normalized result indicating success or an error message.
 *
 * @param {string} handle - CodeChef username to query.
 * @returns {Object} Result object.
 * @returns {boolean} returns.success - `true` if rating data was obtained, `false` otherwise.
 * @returns {(number|null)} [returns.rating] - Current numeric rating, or `null` if unavailable.
 * @returns {(number|null)} [returns.maxRating] - Highest numeric rating, or `null` if unavailable.
 * @returns {(string|null)} [returns.rank] - Star-based rank (e.g., `"3★"`), or `null` if unavailable.
 * @returns {(string|undefined)} [returns.error] - Error message when `success` is `false`.
 */
async function tryApiMethod(handle) {
  try {
    const response = await axios.get(
      `${CODECHEF_API}/${encodeURIComponent(handle)}`,
      { timeout: 15000 }
    );

    const data = response.data;

    if (data.success === false || data.error) {
      return {
        success: false,
        error: data.error || 'User not found'
      };
    }

    if (data.currentRating !== undefined) {
      return {
        success: true,
        rating: parseInt(data.currentRating) || null,
        maxRating: parseInt(data.highestRating) || null,
        rank: data.stars || null
      };
    }

    return {
      success: false,
      error: 'No rating data available'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || 'API request failed'
    };
  }
}

/**
 * Scrapes a CodeChef user's profile page to extract the current rating, highest rating, and star rank.
 *
 * @param {string} handle - CodeChef username to fetch data for.
 * @returns {{success: boolean, rating: number|null, maxRating: number|null, rank: string|null, error?: string}} An object with the scrape result: when `success` is true, `rating`, `maxRating`, and `rank` reflect the parsed values (null if unavailable); when `success` is false, `error` contains a descriptive message.
 */
async function scrapeCodeChefProfile(handle) {
  try {
    const response = await axios.get(
      `${CODECHEF_PROFILE_URL}/${encodeURIComponent(handle)}`,
      {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      }
    );

    const $ = cheerio.load(response.data);

    // Check if user profile exists - must have user-details-container or rating-number
    // Note: generic pages also have "rating" class (app store ratings), so we must be specific
    const hasUserDetails = $('.user-details-container').length > 0;
    const hasRatingNumber = $('.rating-number').length > 0;
    const hasRatingHeader = $('div.rating-header').length > 0;
    
    const profileExists = hasUserDetails || hasRatingNumber || hasRatingHeader;

    if (!profileExists) {
      // User doesn't exist - CodeChef shows a generic page
      return {
        success: false,
        error: 'User not found'
      };
    }

    // Try multiple selectors for rating (CodeChef changes their HTML structure)
    let rating = null;
    let maxRating = null;
    let stars = null;

    // Try to find current rating - multiple possible selectors
    const ratingSelectors = [
      '.rating-number',
      '.rating',
      '[class*="rating-number"]',
      '.user-details-container .rating',
      '.rating-star + small',
      'div.rating-header div.rating-number'
    ];

    for (const selector of ratingSelectors) {
      const ratingText = $(selector).first().text().trim();
      const parsedRating = parseInt(ratingText.replace(/[^\d]/g, ''));
      if (parsedRating && parsedRating > 0 && parsedRating < 10000) {
        rating = parsedRating;
        break;
      }
    }

    // Try to find highest rating
    const highestRatingSelectors = [
      '.rating-header small',
      '[class*="highest"]',
      '.rating-ranks .highest',
      'small:contains("Highest")'
    ];

    for (const selector of highestRatingSelectors) {
      const text = $(selector).text();
      const match = text.match(/(\d{3,4})/);
      if (match) {
        maxRating = parseInt(match[1]);
        break;
      }
    }

    // If we still don't have maxRating, try searching in the page text
    if (!maxRating) {
      const pageText = $('body').text();
      const highestMatch = pageText.match(/highest[:\s]+rating[:\s]*(\d{3,4})/i);
      if (highestMatch) {
        maxRating = parseInt(highestMatch[1]);
      }
    }

    // Try to find stars
    const starSelectors = [
      '.rating-star',
      '[class*="star"]',
      '.rating-ranks .stars',
      'span.rating'
    ];

    for (const selector of starSelectors) {
      const starText = $(selector).text().trim();
      const starMatch = starText.match(/(\d)\s*★|(\d)\s*star/i);
      if (starMatch) {
        stars = `${starMatch[1] || starMatch[2]}★`;
        break;
      }
    }

    // Alternative: count star symbols
    if (!stars) {
      const starSymbols = $('body').text().match(/★+/);
      if (starSymbols && starSymbols[0]) {
        stars = `${starSymbols[0].length}★`;
      }
    }

    // If we found at least rating, return success
    if (rating) {
      console.log(`CodeChef scrape success for ${handle}: rating=${rating}, maxRating=${maxRating}, stars=${stars}`);
      return {
        success: true,
        rating,
        maxRating,
        rank: stars
      };
    }

    // Check if user has no rating yet (valid user but unrated)
    const unratedIndicators = ['unrated', 'no rating', '0 contests'];
    const pageText = $('body').text().toLowerCase();
    for (const indicator of unratedIndicators) {
      if (pageText.includes(indicator)) {
        return {
          success: true,
          rating: null,
          maxRating: null,
          rank: 'Unrated'
        };
      }
    }

    return {
      success: false,
      error: 'Could not parse rating from profile page'
    };
  } catch (error) {
    if (error.response?.status === 404) {
      return {
        success: false,
        error: 'User not found'
      };
    }
    return {
      success: false,
      error: `Scraping failed: ${error.message}`
    };
  }
}

/**
 * Map a numeric CodeChef rating to its star-based rank.
 * @param {number} rating - CodeChef rating value.
 * @returns {string} Star rank string corresponding to the rating (e.g., '1★' through '7★').
 */
function getStarsFromRating(rating) {
  if (rating >= 2500) return '7★';
  if (rating >= 2200) return '6★';
  if (rating >= 2000) return '5★';
  if (rating >= 1800) return '4★';
  if (rating >= 1600) return '3★';
  if (rating >= 1400) return '2★';
  return '1★';
}

/**
 * Fetch CodeChef rating for a user using a third-party API and fall back to scraping the profile page if the API fails.
 * @param {string} handle - CodeChef username.
 * @returns {{rating: number|null, maxRating: number|null, rank: string|null, maxRank: string|null, lastUpdated: Date, error: string|null}} An object containing:
 *  - `rating`: current numeric rating, or `null` if unavailable,
 *  - `maxRating`: highest numeric rating, or `null` if unavailable,
 *  - `rank`: star-based rank string (e.g., `'3★'`) or `'Unrated'`, or `null` if unknown,
 *  - `maxRank`: star-based rank corresponding to `maxRating`, or `null` if `maxRating` is unavailable,
 *  - `lastUpdated`: timestamp when the result was produced,
 *  - `error`: error message when both methods fail, otherwise `null`.
 */
async function fetchCodeChefRating(handle) {
  // Try third-party API first
  const apiResult = await tryApiMethod(handle);
  
  if (apiResult.success) {
    const maxRank = apiResult.maxRating ? getStarsFromRating(apiResult.maxRating) : null;
    return {
      rating: apiResult.rating,
      maxRating: apiResult.maxRating,
      rank: apiResult.rank,
      maxRank: maxRank,
      lastUpdated: new Date(),
      error: null
    };
  }

  // API failed, try web scraping as fallback
  console.log(`CodeChef API failed for ${handle} (${apiResult.error}), trying web scrape...`);
  
  const scrapeResult = await scrapeCodeChefProfile(handle);
  
  if (scrapeResult.success) {
    const maxRank = scrapeResult.maxRating ? getStarsFromRating(scrapeResult.maxRating) : null;
    return {
      rating: scrapeResult.rating,
      maxRating: scrapeResult.maxRating,
      rank: scrapeResult.rank,
      maxRank: maxRank,
      lastUpdated: new Date(),
      error: null
    };
  }

  // Both methods failed
  console.error(`CodeChef: Both API and scraping failed for ${handle}`);
  return {
    rating: null,
    maxRating: null,
    rank: null,
    maxRank: null,
    lastUpdated: new Date(),
    error: scrapeResult.error || apiResult.error || 'Failed to fetch rating'
  };
}

export { fetchCodeChefRating };