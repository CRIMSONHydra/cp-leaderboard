// Codeforces rating colors
export const getCodeforcesColor = (rating) => {
  if (!rating) return '#808080';
  if (rating >= 3000) return '#AA0000'; // Legendary Grandmaster
  if (rating >= 2600) return '#FF0000'; // International Grandmaster
  if (rating >= 2400) return '#FF0000'; // Grandmaster
  if (rating >= 2300) return '#FF8C00'; // International Master
  if (rating >= 2100) return '#FF8C00'; // Master
  if (rating >= 1900) return '#AA00AA'; // Candidate Master
  if (rating >= 1600) return '#0000FF'; // Expert
  if (rating >= 1400) return '#03A89E'; // Specialist
  if (rating >= 1200) return '#008000'; // Pupil
  return '#808080'; // Newbie
};

// AtCoder rating colors
export const getAtCoderColor = (rating) => {
  if (!rating) return '#808080';
  if (rating >= 2800) return '#FF0000'; // Red
  if (rating >= 2400) return '#FF8000'; // Orange
  if (rating >= 2000) return '#C0C000'; // Yellow
  if (rating >= 1600) return '#0000FF'; // Blue
  if (rating >= 1200) return '#00C0C0'; // Cyan
  if (rating >= 800) return '#008000'; // Green
  if (rating >= 400) return '#804000'; // Brown
  return '#808080'; // Gray
};

// LeetCode rating colors (approximate)
export const getLeetCodeColor = (rating) => {
  if (!rating) return '#808080';
  if (rating >= 2800) return '#FF0000';
  if (rating >= 2400) return '#FF8000';
  if (rating >= 2000) return '#FFCC00';
  if (rating >= 1600) return '#0088CC';
  return '#00AA00';
};

// CodeChef star colors
export const getCodeChefColor = (stars) => {
  const starMap = {
    '7★': '#FF0000',
    '6★': '#FF0000',
    '5★': '#FF8000',
    '4★': '#AA00AA',
    '3★': '#0000FF',
    '2★': '#00AA00',
    '1★': '#808080'
  };
  return starMap[stars] || '#808080';
};

// CodeChef rating-based color (fallback)
export const getCodeChefRatingColor = (rating) => {
  if (!rating) return '#808080';
  if (rating >= 2500) return '#FF0000';
  if (rating >= 2200) return '#FF8000';
  if (rating >= 2000) return '#AA00AA';
  if (rating >= 1800) return '#0000FF';
  if (rating >= 1600) return '#00AA00';
  return '#808080';
};

export const getPlatformColor = (platform, rating, rank) => {
  switch (platform) {
    case 'codeforces':
      return getCodeforcesColor(rating);
    case 'atcoder':
      return getAtCoderColor(rating);
    case 'leetcode':
      return getLeetCodeColor(rating);
    case 'codechef':
      return rank ? getCodeChefColor(rank) : getCodeChefRatingColor(rating);
    default:
      return '#808080';
  }
};

export const getPlatformUrl = (platform, handle) => {
  const urls = {
    codeforces: `https://codeforces.com/profile/${handle}`,
    atcoder: `https://atcoder.jp/users/${handle}`,
    leetcode: `https://leetcode.com/u/${handle}`,
    codechef: `https://www.codechef.com/users/${handle}`
  };
  return urls[platform] || '#';
};

export const formatDate = (dateString) => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleString();
};
