import express from 'express';
import {
  triggerUpdate,
  updateUser,
  getUpdateStatus
} from '../controllers/updateController.js';
import { updateLimiter } from '../middlewares/rateLimiter.js';
import basicAuth from '../middlewares/basicAuth.js';
import { authRateLimiter } from '../middlewares/authRateLimiter.js';

const router = express.Router();

router.post('/trigger', triggerUpdate);
// Single user update requires authentication to prevent abuse
// Wrap updateLimiter in a function to reference it at request time, not import time
router.post('/user/:id', authRateLimiter, basicAuth, (req, res, next) => updateLimiter(req, res, next), updateUser);
router.get('/status', getUpdateStatus);

export default router;
