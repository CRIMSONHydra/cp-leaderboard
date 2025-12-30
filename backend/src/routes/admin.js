import express from 'express';
import basicAuth from '../middlewares/basicAuth.js';
import { authRateLimiter } from '../middlewares/authRateLimiter.js';
import { createCredential, verifyAuth } from '../controllers/adminController.js';

const router = express.Router();

// GET /api/admin/verify - Verify authentication (protected)
router.get('/verify', authRateLimiter, basicAuth, verifyAuth);

// POST /api/admin/credentials - Add new admin credentials (protected)
router.post('/credentials', authRateLimiter, basicAuth, createCredential);

export default router;

