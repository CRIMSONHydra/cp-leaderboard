import { useState, useEffect, useCallback } from 'react';
import { spacesApi } from '../services/api/spaces';

export function useSpace(spaceId) {
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSpace = useCallback(async () => {
    if (!spaceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await spacesApi.getSpace(spaceId);
      setSpace(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    fetchSpace();
  }, [fetchSpace]);

  return { space, loading, error, setSpace, refetch: fetchSpace };
}
