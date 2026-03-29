import { encodeBasicAuth } from '../../utils/basicAuth.js';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

async function authenticatedFetch(url, { method = 'GET', body, username, password }) {
  if (!username || !password) {
    return Promise.reject(new Error('Authentication required'));
  }
  const headers = {
    'Authorization': `Basic ${encodeBasicAuth(username, password)}`
  };
  if (body) {
    headers['Content-Type'] = 'application/json';
  }
  const response = await fetch(`${API_BASE}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const adminApi = {
  addUser: (userData, username, password) =>
    authenticatedFetch('/users', { method: 'POST', body: userData, username, password }),

  addAdminCredential: (credentialData, username, password) =>
    authenticatedFetch('/admin/credentials', { method: 'POST', body: credentialData, username, password }),

  verifyAuth: (username, password) =>
    authenticatedFetch('/admin/verify', { username, password })
};
