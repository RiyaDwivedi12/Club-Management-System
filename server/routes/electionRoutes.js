import express from 'express';
import { 
  createElection, 
  addCandidate, 
  nominateCandidate, 
  getElections, 
  vote, 
  concludeElection, 
  deleteElection 
} from '../controllers/electionController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getElections)
  .post(protect, authorize('admin', 'faculty', 'president'), createElection);

router.route('/:id')
  .delete(protect, authorize('admin'), deleteElection);

router.route('/:id/candidates')
  .post(protect, authorize('admin', 'faculty', 'president'), addCandidate);

router.route('/:id/nominate')
  .post(protect, nominateCandidate);

router.route('/:id/vote')
  .post(protect, vote);

router.route('/:id/conclude')
  .post(protect, authorize('admin', 'faculty', 'president'), concludeElection);

export default router;
