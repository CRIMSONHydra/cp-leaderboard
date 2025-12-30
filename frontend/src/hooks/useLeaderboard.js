import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

/**
 * Provide leaderboard data, loading/error state, and client-side sorting controls.
 * @returns {{data: Array, loading: boolean, error: string|null, sortBy: string, sortOrder: string, handleSort: function, refetch: function}}
 *   An object with:
 *   - data: the leaderboard items array (empty array when none).
 *   - loading: `true` while a fetch is in progress, `false` otherwise.
 *   - error: an error message string when the last fetch failed, or `null`.
 *   - sortBy: the current column used for sorting.
 *   - sortOrder: the current sort direction, either `'asc'` or `'desc'`.
 *   - handleSort: function(column) — update sorting; toggles `sortOrder` when `column` equals `sortBy`, otherwise sets `sortBy` to `column` and `sortOrder` to `'desc'`.
 *   - refetch: function — manually trigger a data refresh.
 */
export function useLeaderboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('aggregate');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getLeaderboard(sortBy, sortOrder);
      setData(result.data || []);
    } catch (err) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortOrder]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return {
    data,
    loading,
    error,
    sortBy,
    sortOrder,
    handleSort,
    refetch: fetchData
  };
}

/**
 * Provides the application's update status and a loading indicator.
 *
 * Fetches the update status on mount; sets `status` to the API result's `data` or to `null` on error.
 * @returns {{status: any|null, loading: boolean}} An object containing `status` (the fetched status or `null` if unavailable) and `loading` (`true` while the initial fetch is in progress, `false` otherwise).
 */
export function useUpdateStatus() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getUpdateStatus()
      .then(result => setStatus(result.data))
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, []);

  return { status, loading };
}

/**
 * Fetches statistics from the API on mount and exposes the result with a loading flag.
 *
 * @returns {{stats: any|null, loading: boolean}} An object with `stats` containing the API response data or `null` if the request failed, and `loading` set to `true` while the request is in progress and `false` afterwards.
 */
export function useStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats()
      .then(result => setStats(result.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  return { stats, loading };
}