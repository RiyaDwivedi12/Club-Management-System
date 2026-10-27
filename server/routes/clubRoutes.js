import express from 'express';
import multer from 'multer';
import { 
  createClub, 
  updateClub,
  getClubs, 
  getClubById, 
  requestJoinClub, 
  leaveClub, 
  approveMember, 
  getPresidentClubs, 
  getCoordinatorClubs, 
  updateRecruitmentPhase,
  addGalleryPhoto,
  uploadClubsExcel,
  downloadClubTemplate
} from '../controllers/clubController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.route('/')
  .get(getClubs)
  .post(protect, authorize('admin', 'faculty'), createClub);

router.route('/upload')
  .post(protect, authorize('admin', 'faculty'), upload.single('file'), uploadClubsExcel);

router.route('/template')
  .get(downloadClubTemplate);

router.route('/president').get(protect, authorize('president', 'vice_president', 'admin'), getPresidentClubs);
router.route('/coordinator').get(protect, authorize('faculty', 'admin'), getCoordinatorClubs);

router.route('/recruitment').put(protect, authorize('admin'), updateRecruitmentPhase);

router.route('/:id')
  .get(getClubById)
  .put(protect, authorize('admin', 'faculty', 'president'), updateClub);

router.route('/:id/request-join').post(protect, requestJoinClub);
router.route('/:id/leave').post(protect, leaveClub);
router.route('/:id/approve-member').put(protect, approveMember);
router.route('/:id/gallery').post(protect, addGalleryPhoto);

export default router;
