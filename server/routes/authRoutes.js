import express from 'express';
import {
  registerUser,
  authUser,
  logoutUser,
  getUserProfile,
  verifyOTP,
  setupPassword,
  resendVerification,
  forgotPassword,
  resetPassword,
  getAllUsers,
  uploadProfilePicture
} from '../controllers/authController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

import upload from '../middleware/uploadMiddleware.js';

router.post('/register', registerUser);
router.post('/login', authUser);
router.post('/logout', logoutUser);
router.post('/verify-otp', verifyOTP);
router.post('/setup-password', setupPassword);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.route('/profile').get(protect, getUserProfile);
router.route('/users').get(protect, authorize('admin', 'faculty', 'president'), getAllUsers);
router.post('/profile-pic', protect, upload.single('profilePic'), uploadProfilePicture);

export default router;
