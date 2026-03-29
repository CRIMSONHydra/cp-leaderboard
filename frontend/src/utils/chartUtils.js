/**
 * Combines multiple platform histories into a single timeline with forward-filled values.
 * @param {object} history - Platform-keyed history object { codeforces: { success, data }, ... }
 * @param {string[]} platforms - Array of platform keys to include
 * @returns {object[]} Sorted array of { date, [platform]: rating, ... } with gaps filled
 */
export function buildCombinedChartData(history, platforms) {
  const dateMap = new Map();

  for (const platform of platforms) {
    const platformHistory = history[platform];
    if (!platformHistory?.success || !platformHistory.data?.length) continue;

    for (const entry of platformHistory.data) {
      const dateKey = entry.date.split('T')[0];
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { date: entry.date });
      }
      dateMap.get(dateKey)[platform] = entry.rating;
    }
  }

  const sortedData = Array.from(dateMap.values()).sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  const filled = [];
  const lastValues = {};

  for (const point of sortedData) {
    const newPoint = { ...point };
    for (const platform of platforms) {
      if (point[platform] !== undefined) {
        lastValues[platform] = point[platform];
      } else if (lastValues[platform] !== undefined) {
        newPoint[platform] = lastValues[platform];
      }
    }
    filled.push(newPoint);
  }

  return filled;
}

/**
 * Transforms a single platform's history into chart-ready data.
 * @param {object} history - { success, data: [{ date, rating, contestName, change, rank }] }
 * @returns {object[]} Array of chart data points
 */
export function buildSinglePlatformData(history) {
  if (!history?.success || !history.data?.length) return [];
  return history.data.map(entry => ({
    date: entry.date,
    rating: entry.rating,
    contestName: entry.contestName,
    change: entry.change,
    rank: entry.rank
  }));
}
