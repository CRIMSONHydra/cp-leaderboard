const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function fetchJSON(url) {
  const response = await fetch(`${API_BASE}${url}`);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const api = {
  getLeaderboard: (sortBy = 'aggregate', order = 'desc') =>
    fetchJSON(`/leaderboard?sortBy=${sortBy}&order=${order}`),

  getPlatformLeaderboard: (platform) =>
    fetchJSON(`/leaderboard/platform/${platform}`),

  getUserDetails: (id) =>
    fetchJSON(`/leaderboard/user/${id}`),

  getStats: () =>
    fetchJSON('/leaderboard/stats'),

  getUpdateStatus: () =>
    fetchJSON('/update/status'),

  getHealth: () =>
    fetchJSON('/health')
};
