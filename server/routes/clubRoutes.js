import express from 'express';
import { 
  createClub, 
  getClubs, 
  getClubById, 
  requestJoinClub, 
  leaveClub, 
  approveMember, 
  getPresidentClubs, 
  getCoordinatorClubs, 
  updateRecruitmentPhase,
  addGalleryPhoto 
} from '../controllers/clubController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getClubs)
  .post(protect, authorize('admin', 'faculty'), createClub);

router.route('/president').get(protect, authorize('president'), getPresidentClubs);
router.route('/coordinator').get(protect, authorize('faculty', 'admin'), getCoordinatorClubs);

router.route('/recruitment').put(protect, authorize('admin'), updateRecruitmentPhase);

router.route('/:id')
  .get(getClubById);

router.route('/:id/request-join').post(protect, requestJoinClub);
router.route('/:id/leave').post(protect, leaveClub);
router.route('/:id/approve-member').put(protect, approveMember);
router.route('/:id/gallery').post(protect, addGalleryPhoto);

export default router;
