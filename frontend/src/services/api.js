const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Unicode-safe Base64 encoding helper
 * Converts a JavaScript string to UTF-8 bytes and then to Base64
 * @param {string} str - String to encode
 * @returns {string} Base64 encoded string
 */
function safeBase64Encode(str) {
  // Modern browsers: Use TextEncoder to convert string to UTF-8 bytes
  if (typeof TextEncoder !== 'undefined') {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    // Convert Uint8Array to binary string for btoa
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  
  // Fallback for older environments: use encodeURIComponent polyfill
  // This converts Unicode characters to UTF-8 byte sequences
  return btoa(unescape(encodeURIComponent(str)));
}

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
    const authHeader = `Basic ${safeBase64Encode(`${username}:${password}`)}`;
    return fetchJSON('/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(userData)
    });
  },

  addAdminCredential: (credentialData, username, password) => {
    if (!username || !password) {
      return Promise.reject(new Error('Authentication required'));
    }
    const authHeader = `Basic ${safeBase64Encode(`${username}:${password}`)}`;
    return fetchJSON('/admin/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader
      },
      body: JSON.stringify(credentialData)
    });
  },

  verifyAuth: (username, password) => {
    if (!username || !password) {
      return Promise.reject(new Error('Username and password are required'));
    }
    const authHeader = `Basic ${safeBase64Encode(`${username}:${password}`)}`;
    return fetchJSON('/admin/verify', {
      method: 'GET',
      headers: {
        'Authorization': authHeader
      }
    });
  }
};
