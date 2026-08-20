import express from 'express';
import { createClub, getClubs, getClubById } from '../controllers/clubController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getClubs)
  .post(protect, createClub); // You might want to add an admin middleware here too

router.route('/:id')
  .get(getClubById);

export default router;
