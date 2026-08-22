import express from 'express';
import { createClub, getClubs, getClubById, requestJoinClub, leaveClub, approveMember } from '../controllers/clubController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getClubs)
  .post(protect, authorize('admin', 'faculty'), createClub);

router.route('/:id')
  .get(getClubById);

router.route('/:id/request-join').post(protect, requestJoinClub);
router.route('/:id/leave').post(protect, leaveClub);
router.route('/:id/approve-member').put(protect, approveMember);

export default router;
