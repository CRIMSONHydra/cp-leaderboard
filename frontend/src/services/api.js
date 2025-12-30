import { encodeBasicAuth } from '../utils/basicAuth.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

async function fetchJSON(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, options);
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

  getUserHistory: (id) =>
    fetchJSON(`/leaderboard/user/${id}/history`),

  getStats: () =>
    fetchJSON('/leaderboard/stats'),

  getUpdateStatus: () =>
    fetchJSON('/update/status'),

  getHealth: () =>
    fetchJSON('/health'),

  addUser: (userData, username, password) => {
    if (!username || !password) {
      return Promise.reject(new Error('Authentication required'));
    }
    try {
      const authHeader = `Basic ${encodeBasicAuth(username, password)}`;
      return fetchJSON('/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify(userData)
      });
    } catch (error) {
      return Promise.reject(error);
    }
  },

  addAdminCredential: (credentialData, username, password) => {
    if (!username || !password) {
      return Promise.reject(new Error('Authentication required'));
    }
    try {
      const authHeader = `Basic ${encodeBasicAuth(username, password)}`;
      return fetchJSON('/admin/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify(credentialData)
      });
    } catch (error) {
      return Promise.reject(error);
    }
  },

  verifyAuth: (username, password) => {
    if (!username || !password) {
      return Promise.reject(new Error('Username and password are required'));
    }
    try {
      const authHeader = `Basic ${encodeBasicAuth(username, password)}`;
      return fetchJSON('/admin/verify', {
        method: 'GET',
        headers: {
          'Authorization': authHeader
        }
      });
    } catch (error) {
      return Promise.reject(error);
    }
  }
};
