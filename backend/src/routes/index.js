const express = require('express');
const router = express.Router();

router.use('/leaderboard', require('./leaderboard'));
router.use('/update', require('./update'));

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
