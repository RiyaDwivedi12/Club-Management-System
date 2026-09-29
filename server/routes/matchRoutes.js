import express from 'express';
import { createMatch, getMatches, updateScore, endMatch, getLeaderboard } from '../controllers/matchController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/leaderboard')
  .get(getLeaderboard);

router.route('/')
  .get(getMatches)
  .post(protect, authorize('admin', 'faculty', 'president'), createMatch);

router.route('/:id/score')
  .put(protect, authorize('admin', 'referee'), updateScore);

router.route('/:id/end')
  .put(protect, authorize('admin', 'referee'), endMatch);

export default router;
