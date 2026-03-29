import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { useSortedTable } from './useSortedTable';

export function useLeaderboard() {
  const fetchFn = useCallback(
    (sortBy, sortOrder) => api.getLeaderboard(sortBy, sortOrder),
    []
  );
  return useSortedTable(fetchFn);
}

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
