import { useState, useEffect, useCallback } from 'react';

/**
 * Generic hook for fetching and sorting tabular data.
 * @param {function} fetchFn - Async function (sortBy, sortOrder) => { data: [...] }
 * @param {Array} deps - Additional dependencies that trigger a refetch
 */
export function useSortedTable(fetchFn, deps = []) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('aggregate');
  const [sortOrder, setSortOrder] = useState('desc');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn(sortBy, sortOrder);
      setData(result.data || []);
    } catch (err) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, sortOrder, ...deps]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSort = useCallback((column) => {
    if (sortBy === column) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  }, [sortBy]);

  return { data, loading, error, sortBy, sortOrder, handleSort, refetch: fetchData };
}
