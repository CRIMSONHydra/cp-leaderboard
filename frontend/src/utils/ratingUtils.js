import { PLATFORM_URLS } from '../constants/platforms';

// Codeforces rating colors (official)
export const getCodeforcesColor = (rating) => {
  if (!rating) return '#808080';
  if (rating >= 3000) return '#aa0000'; // Legendary Grandmaster (first letter black, rest red)
  if (rating >= 2600) return '#ff0000'; // International Grandmaster
  if (rating >= 2400) return '#ff0000'; // Grandmaster
  if (rating >= 2300) return '#ff8c00'; // International Master
  if (rating >= 2100) return '#ff8c00'; // Master
  if (rating >= 1900) return '#aa00aa'; // Candidate Master
  if (rating >= 1600) return '#0000ff'; // Expert
  if (rating >= 1400) return '#03a89e'; // Specialist (cyan)
  if (rating >= 1200) return '#008000'; // Pupil (green)
  return '#808080'; // Newbie (gray)
};

// AtCoder rating colors (official)
export const getAtCoderColor = (rating) => {
  if (!rating) return '#808080';
  if (rating >= 2800) return '#ff0000'; // Red
  if (rating >= 2400) return '#ff8000'; // Orange
  if (rating >= 2000) return '#c0c000'; // Yellow
  if (rating >= 1600) return '#0000ff'; // Blue
  if (rating >= 1200) return '#00c0c0'; // Cyan
  if (rating >= 800) return '#008000'; // Green
  if (rating >= 400) return '#804000'; // Brown
  return '#808080'; // Gray
};

// LeetCode rating colors (based on community data)
export const getLeetCodeColor = (rating) => {
  if (!rating) return '#808080';
  if (rating >= 2400) return '#ff375f'; // Guardian (red/gold)
  if (rating >= 2100) return '#ff9800'; // Orange
  if (rating >= 1900) return '#9d4dc5'; // Violet
  if (rating >= 1600) return '#007bff'; // Blue
  if (rating >= 1400) return '#00af9b'; // Green
  return '#808080'; // Gray
};

// CodeChef star colors (official)
export const getCodeChefColor = (stars) => {
  const starMap = {
    '7★': '#d0011b', // Red
    '6★': '#ff7f00', // Orange
    '5★': '#ffbf00', // Yellow
    '4★': '#684273', // Violet
    '3★': '#3366cc', // Blue
    '2★': '#1e7d22', // Green
    '1★': '#666666'  // Gray
  };
  return starMap[stars] || '#666666';
};

// CodeChef rating-based color (fallback when stars not available)
export const getCodeChefRatingColor = (rating) => {
  if (!rating) return '#666666';
  if (rating >= 2500) return '#d0011b'; // 7★ Red
  if (rating >= 2200) return '#ff7f00'; // 6★ Orange
  if (rating >= 2000) return '#ffbf00'; // 5★ Yellow
  if (rating >= 1800) return '#684273'; // 4★ Violet
  if (rating >= 1600) return '#3366cc'; // 3★ Blue
  if (rating >= 1400) return '#1e7d22'; // 2★ Green
  return '#666666'; // 1★ Gray
};

// Platform color resolver registry — open for extension via the map
const platformColorResolvers = {
  codeforces: (rating) => getCodeforcesColor(rating),
  atcoder: (rating) => getAtCoderColor(rating),
  leetcode: (rating) => getLeetCodeColor(rating),
  codechef: (rating, rank) => rank ? getCodeChefColor(rank) : getCodeChefRatingColor(rating)
};

export const getPlatformColor = (platform, rating, rank) => {
  const resolver = platformColorResolvers[platform];
  return resolver ? resolver(rating, rank) : '#808080';
};

export const getPlatformUrl = (platform, handle) => {
  const prefix = PLATFORM_URLS[platform];
  return prefix ? `${prefix}${handle}` : '#';
};

export const formatDate = (dateString) => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleString();
};
