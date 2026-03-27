import express from 'express';
import {
  getLeaderboard,
  getPlatformLeaderboard,
  getUserDetails,
  getStats,
  getUserHistory
} from '../controllers/leaderboardController.js';

const router = express.Router();

router.get('/', getLeaderboard);
router.get('/stats', getStats);
router.get('/platform/:platform', getPlatformLeaderboard);
router.get('/user/:id', getUserDetails);
router.get('/user/:id/history', getUserHistory);

export default router;
