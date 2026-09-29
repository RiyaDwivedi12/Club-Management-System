import express from 'express';
import { getTournaments, getTournamentBracket, recommendNextRound } from '../controllers/tournamentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getTournaments);

router.route('/:id/bracket')
  .get(getTournamentBracket);

router.route('/:id/recommend-next-round')
  .post(protect, authorize('admin', 'faculty'), recommendNextRound);

export default router;
