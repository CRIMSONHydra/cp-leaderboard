import express from 'express';
import basicAuth from '../middlewares/basicAuth.js';
import { createUser } from '../controllers/userController.js';

const router = express.Router();

// POST /api/users - Add new user (protected)
router.post('/', basicAuth, createUser);

export default router;

