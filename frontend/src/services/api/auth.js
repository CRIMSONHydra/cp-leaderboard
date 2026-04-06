import { fetchJSON } from './client.js';

export const authApi = {
  register: (username, email, password) =>
    fetchJSON('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    }),

  login: (login, password) =>
    fetchJSON('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password })
    }),

  logout: () =>
    fetchJSON('/auth/logout', { method: 'POST' }),

  getMe: () =>
    fetchJSON('/auth/me'),

  forgotPassword: (email) =>
    fetchJSON('/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    }),

  resetPassword: (token, password) =>
    fetchJSON('/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password })
    }),

  updateProfile: (data) =>
    fetchJSON('/auth/me', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }),

  linkHandles: (handles) =>
    fetchJSON('/auth/me/handles', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handles })
    }),

  getMySpaces: () =>
    fetchJSON('/auth/me/spaces')
};
