import express from 'express';
import basicAuth from '../middlewares/basicAuth.js';
import { authRateLimiter } from '../middlewares/authRateLimiter.js';
import { createUser, updateUser } from '../controllers/userController.js';

const router = express.Router();

// POST /api/users - Add new user (protected)
router.post('/', authRateLimiter, basicAuth, createUser);

// PUT /api/users/:userId - Update user handles (protected)
router.put('/:userId', authRateLimiter, basicAuth, updateUser);

export default router;
