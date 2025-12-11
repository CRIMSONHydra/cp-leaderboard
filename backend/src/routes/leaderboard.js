const express = require('express');
const router = express.Router();
const {
  getLeaderboard,
  getPlatformLeaderboard,
  getUserDetails,
  getStats
} = require('../controllers/leaderboardController');

router.get('/', getLeaderboard);
router.get('/stats', getStats);
router.get('/platform/:platform', getPlatformLeaderboard);
router.get('/user/:id', getUserDetails);

module.exports = router;
