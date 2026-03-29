const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

let isRefreshing = false;
let refreshPromise = null;

async function attemptRefresh() {
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    credentials: 'include'
  });
  if (!response.ok) throw new Error('Refresh failed');
  return response.json();
}

export async function fetchJSON(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    credentials: 'include'
  });

  if (response.status === 401 && !options._retried) {
    // Attempt token refresh once
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = attemptRefresh().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    try {
      await refreshPromise;
      // Retry original request
      return fetchJSON(url, { ...options, _retried: true });
    } catch {
      // Refresh failed — throw without reading the original response again
      throw new Error('Authentication required');
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}
