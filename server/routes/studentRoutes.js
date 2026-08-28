import express from 'express';
import {
  getAllClubs,
  joinClub,
  getMyMemberships,
  payFee,
  getMyPayments,
  getElections,
  vote,
  getElectionResults
} from '../controllers/studentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.createElement ? undefined : express.Router(); // fallback

const studentRouter = express.Router();

// All routes here require the user to be logged in and be a 'student'
studentRouter.use(protect);
studentRouter.use(authorize('student'));

studentRouter.get('/clubs', getAllClubs);
studentRouter.post('/clubs/:clubId/join', joinClub);
studentRouter.post('/clubs/:clubId/pay-fee', payFee);

studentRouter.get('/memberships', getMyMemberships);
studentRouter.get('/payments', getMyPayments);

studentRouter.get('/elections/:clubId', getElections);
studentRouter.post('/elections/:electionId/vote', vote);
studentRouter.get('/elections/:electionId/results', getElectionResults);

export default studentRouter;
