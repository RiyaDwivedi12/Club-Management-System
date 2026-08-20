import express from 'express';
import { createEvent, getEvents, getEventById, joinEvent } from '../controllers/eventController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getEvents)
  .post(protect, createEvent); 

router.route('/:id')
  .get(getEventById);

router.route('/:id/join')
  .post(protect, joinEvent);

export default router;
