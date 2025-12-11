import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

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
