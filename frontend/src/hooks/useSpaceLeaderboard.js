import { useState, useEffect, useCallback } from 'react';
import { spacesApi } from '../services/api/spaces';

export function useSpaceLeaderboard(spaceId) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('aggregate');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchLeaderboard = useCallback(async () => {
    if (!spaceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await spacesApi.getSpaceLeaderboard(spaceId, sortBy, sortOrder);
      setData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [spaceId, sortBy, sortOrder]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleSort = useCallback((column) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  }, [sortBy]);

  return { data, loading, error, sortBy, sortOrder, handleSort, refetch: fetchLeaderboard };
}
