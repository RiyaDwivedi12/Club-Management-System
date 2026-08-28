import express from 'express';
import { createEvent, getEvents, getEventById, joinEvent, updateEvent, deleteEvent, getEventsByClub } from '../controllers/eventController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getEvents)
  .post(protect, authorize('admin', 'president', 'faculty'), createEvent); 

router.route('/club/:clubId').get(getEventsByClub);

router.route('/:id')
  .get(getEventById)
  .put(protect, authorize('admin', 'president', 'faculty'), updateEvent)
  .delete(protect, authorize('admin', 'president', 'faculty'), deleteEvent);

router.route('/:id/join')
  .post(protect, joinEvent);

export default router;
