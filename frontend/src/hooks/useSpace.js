import { useState, useEffect, useCallback, useRef } from 'react';
import { spacesApi } from '../services/api';

export function useSpace(spaceId) {
  const [space, setSpace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);

  const fetchSpace = useCallback(async () => {
    if (!spaceId) {
      setSpace(null);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const res = await spacesApi.getSpace(spaceId);
      if (requestId === requestIdRef.current) {
        setSpace(res.data);
      }
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setError(err.message);
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [spaceId]);

  useEffect(() => {
    fetchSpace();
  }, [fetchSpace]);

  return { space, loading, error, setSpace, refetch: fetchSpace };
}
