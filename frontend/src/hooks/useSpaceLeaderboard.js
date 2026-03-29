import { useCallback } from 'react';
import { spacesApi } from '../services/api';
import { useSortedTable } from './useSortedTable';

export function useSpaceLeaderboard(spaceId) {
  const fetchFn = useCallback(
    (sortBy, sortOrder) => {
      if (!spaceId) return Promise.resolve({ data: [] });
      return spacesApi.getSpaceLeaderboard(spaceId, sortBy, sortOrder);
    },
    [spaceId]
  );
  return useSortedTable(fetchFn, [spaceId]);
}
