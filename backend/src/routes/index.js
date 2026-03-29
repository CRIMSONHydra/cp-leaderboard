import express from 'express';
import leaderboardRouter from './leaderboard.js';
import updateRouter from './update.js';
import usersRouter from './users.js';
import adminRouter from './admin.js';
import authRouter from './auth.js';
import spacesRouter from './spaces.js';

const router = express.Router();

router.use('/leaderboard', leaderboardRouter);
router.use('/update', updateRouter);
router.use('/users', usersRouter);
router.use('/admin', adminRouter);
router.use('/auth', authRouter);
router.use('/spaces', spacesRouter);

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
});

export default router;
