import express from 'express';
import multer from 'multer';
const memUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

import {
  bulkOnboardRole,
  downloadRoleTemplate,
  getRolesSummary,
  registerUser,
  authUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  createAdmin,
  updateUserRole,
  verifyOTP,
  setupPassword,
  resendVerification,
  forgotPassword,
  resetPassword,
  getAllUsers,
  uploadProfilePicture,
  assignReferee,
  getReferees,
  revokeReferee,
  approveElectionWinner
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
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);
router.route('/users').get(protect, authorize('admin', 'faculty', 'president'), getAllUsers);
router.post('/profile-pic', protect, upload.single('profilePic'), uploadProfilePicture);

// Role & Administrator Management
router.post('/create-admin', protect, authorize('admin'), createAdmin);
router.post('/update-role', protect, authorize('admin'), updateUserRole);

// Referee Management
router.post('/assign-referee', protect, authorize('admin', 'faculty', 'president', 'vice_president'), assignReferee);
router.get('/referees', getReferees);
router.post('/revoke-referee', protect, authorize('admin'), revokeReferee);

// Bulk Role Onboarding & Credentials System
router.post('/bulk-onboard', protect, authorize('admin'), memUpload.single('file'), bulkOnboardRole);
router.get('/template/role/:role', downloadRoleTemplate);
router.get('/roles-summary', protect, authorize('admin'), getRolesSummary);

// Post-Election Elevation & Credentials Approval
router.post('/approve-election-winner', protect, authorize('admin'), approveElectionWinner);

export default router;
