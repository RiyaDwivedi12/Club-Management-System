import express from 'express';
import { 
  createMatch, 
  getMatches, 
  updateScore, 
  endMatch, 
  getLeaderboard, 
  uploadMatches,
  exportMatchesPdf,
  exportMatchesExcel
} from '../controllers/matchController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.route('/leaderboard')
  .get(getLeaderboard);

router.route('/export/pdf')
  .get(exportMatchesPdf);

router.route('/export/excel')
  .get(exportMatchesExcel);

router.route('/')
  .get(getMatches)
  .post(protect, authorize('admin', 'faculty', 'president', 'vice_president'), createMatch);

router.route('/upload')
  .post(protect, authorize('admin', 'faculty', 'president', 'vice_president'), upload.single('file'), uploadMatches);

router.route('/:id/score')
  .put(protect, authorize('admin', 'referee'), updateScore);

router.route('/:id/end')
  .put(protect, authorize('admin', 'referee'), endMatch);

export default router;
