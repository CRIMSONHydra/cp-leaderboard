import { encodeBasicAuth } from '../utils/basicAuth.js';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

async function fetchJSON(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

function authenticatedFetch(url, { method = 'GET', body, username, password }) {
  if (!username || !password) {
    return Promise.reject(new Error('Authentication required'));
  }
  const headers = {
    'Authorization': `Basic ${encodeBasicAuth(username, password)}`
  };
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  return fetchJSON(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
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

  addUser: (userData, username, password) =>
    authenticatedFetch('/users', { method: 'POST', body: userData, username, password }),

  addAdminCredential: (credentialData, username, password) =>
    authenticatedFetch('/admin/credentials', { method: 'POST', body: credentialData, username, password }),

  verifyAuth: (username, password) =>
    authenticatedFetch('/admin/verify', { username, password })
};
