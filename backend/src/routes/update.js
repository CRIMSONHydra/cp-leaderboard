import express from 'express';
import {
  triggerUpdate,
  updateUser,
  getUpdateStatus
} from '../controllers/updateController.js';
import { updateLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/trigger', triggerUpdate);
// Wrap updateLimiter in a function to reference it at request time, not import time
router.post('/user/:id', (req, res, next) => updateLimiter(req, res, next), updateUser);
router.get('/status', getUpdateStatus);

export default router;
