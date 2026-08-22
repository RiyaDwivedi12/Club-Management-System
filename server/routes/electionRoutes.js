import express from 'express';
import { createElection, addCandidate, getElections, vote } from '../controllers/electionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getElections)
  .post(protect, authorize('admin', 'faculty'), createElection);

router.route('/:id/candidates')
  .post(protect, authorize('admin', 'faculty'), addCandidate);

router.route('/:id/vote')
  .post(protect, vote);

export default router;
