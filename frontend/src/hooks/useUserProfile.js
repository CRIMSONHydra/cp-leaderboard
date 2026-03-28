import { useState, useEffect } from 'react';
import { api } from '../services/api';

export function useUserProfile(id) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [history, setHistory] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchUserData() {
      setLoading(true);
      setError(null);

      try {
        const response = await api.getUserHistory(id);
        if (cancelled) return;
        if (response.success) {
          setUserData(response.data.user);
          setHistory(response.data.history);
        } else {
          setError(response.error || 'Failed to load user data');
        }
      } catch (err) {
        if (cancelled) return;
        setError(err.message || 'Failed to load user data');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchUserData();
    return () => { cancelled = true; };
  }, [id]);

  return { loading, error, userData, history };
}
