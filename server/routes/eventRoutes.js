import express from 'express';
import { createEvent, getEvents, getEventById, joinEvent, updateEvent, deleteEvent, getEventsByClub, approveEvent, rejectEvent, overrideEvent } from '../controllers/eventController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getEvents)
  .post(protect, authorize('admin', 'president', 'vice_president', 'faculty'), createEvent); 

router.route('/club/:clubId').get(getEventsByClub);

router.route('/:id')
  .get(getEventById)
  .put(protect, authorize('admin', 'president', 'vice_president', 'faculty'), updateEvent)
  .delete(protect, authorize('admin', 'president', 'vice_president', 'faculty'), deleteEvent);

router.route('/:id/join')
  .post(protect, joinEvent);

router.route('/:id/approve')
  .put(protect, authorize('admin', 'faculty'), approveEvent);

router.route('/:id/reject')
  .put(protect, authorize('admin', 'faculty'), rejectEvent);

router.route('/:id/override')
  .put(protect, authorize('admin', 'faculty'), overrideEvent);

export default router;
