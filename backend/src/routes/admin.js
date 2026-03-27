import express from 'express';
import basicAuth from '../middlewares/basicAuth.js';
import { authRateLimiter } from '../middlewares/authRateLimiter.js';
import { bootstrapCredential, createCredential, verifyAuth } from '../controllers/adminController.js';

const router = express.Router();

// POST /api/admin/bootstrap - Create first admin (only works when no admins exist)
router.post('/bootstrap', bootstrapCredential);

// GET /api/admin/verify - Verify authentication (protected)
router.get('/verify', authRateLimiter, basicAuth, verifyAuth);

// POST /api/admin/credentials - Add new admin credentials (protected)
router.post('/credentials', authRateLimiter, basicAuth, createCredential);

export default router;

