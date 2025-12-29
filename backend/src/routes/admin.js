import express from 'express';
import basicAuth from '../middlewares/basicAuth.js';
import { createCredential, verifyAuth } from '../controllers/adminController.js';

const router = express.Router();

// GET /api/admin/verify - Verify authentication (protected)
router.get('/verify', basicAuth, verifyAuth);

// POST /api/admin/credentials - Add new admin credentials (protected)
router.post('/credentials', basicAuth, createCredential);

export default router;

