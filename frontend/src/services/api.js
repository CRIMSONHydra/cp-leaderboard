import { leaderboardApi } from './api/leaderboard.js';
import { authApi } from './api/auth.js';
import { spacesApi } from './api/spaces.js';
import { adminApi } from './api/admin.js';

// Backward-compatible combined export
export const api = {
  ...leaderboardApi,
  ...adminApi,
  ...authApi,
  ...spacesApi
};

export { leaderboardApi, authApi, spacesApi, adminApi };
