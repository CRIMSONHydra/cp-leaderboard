import { useState, useEffect, useCallback } from 'react';
import { spacesApi } from '../services/api';

export function usePendingInvitations() {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvitations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await spacesApi.getMyInvitations();
      setInvitations(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  return { invitations, loading, error, refetch: fetchInvitations };
}

export function useSpaceInvitations(spaceId) {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchInvitations = useCallback(async () => {
    if (!spaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await spacesApi.getSpaceInvitations(spaceId);
      setInvitations(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  return { invitations, loading, error, refetch: fetchInvitations };
}
