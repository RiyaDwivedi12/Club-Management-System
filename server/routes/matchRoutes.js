import express from 'express';
import { createMatch, getMatches, updateScore, endMatch, getLeaderboard, uploadMatches } from '../controllers/matchController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/leaderboard')
  .get(getLeaderboard);

import multer from 'multer';

// Setup multer for excel upload
const upload = multer({ dest: 'uploads/' });

router.route('/')
  .get(getMatches)
  .post(protect, authorize('admin', 'faculty', 'president'), createMatch);

router.route('/upload')
  .post(protect, authorize('admin', 'faculty', 'president'), upload.single('file'), uploadMatches);

router.route('/:id/score')
  .put(protect, authorize('admin', 'referee'), updateScore);

router.route('/:id/end')
  .put(protect, authorize('admin', 'referee'), endMatch);

export default router;
