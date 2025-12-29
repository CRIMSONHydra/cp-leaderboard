import express from 'express';
import {
  triggerUpdate,
  updateUser,
  getUpdateStatus
} from '../controllers/updateController.js';
import { updateLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

router.post('/trigger', triggerUpdate);
router.post('/user/:id', updateLimiter, updateUser);
router.get('/status', getUpdateStatus);

export default router;
