import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';

export function useUserProfile(id) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [history, setHistory] = useState(null);
  const requestIdRef = useRef(0);

  const fetchUserData = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);

    try {
      const response = await api.getUserHistory(id);
      if (requestId !== requestIdRef.current) return;
      if (response.success) {
        setUserData(response.data.user);
        setHistory(response.data.history);
      } else {
        setError(response.error || 'Failed to load user data');
      }
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err.message || 'Failed to load user data');
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return { loading, error, userData, history, refetch: fetchUserData };
}
