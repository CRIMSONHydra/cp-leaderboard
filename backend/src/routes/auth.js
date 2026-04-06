import express from 'express';
import jwtAuth from '../middlewares/jwtAuth.js';
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  getMe,
  updateProfile,
  linkHandles,
  getMySpaces
} from '../controllers/authController.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', jwtAuth, getMe);
router.put('/me', jwtAuth, updateProfile);
router.put('/me/handles', jwtAuth, linkHandles);
router.get('/me/spaces', jwtAuth, getMySpaces);

export default router;
