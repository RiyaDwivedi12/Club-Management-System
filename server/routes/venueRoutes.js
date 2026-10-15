import express from 'express';
import {
  getAllVenues,
  createVenue,
  checkAvailability,
  createBooking,
  getAllBookings,
  updateBookingStatus,
  cancelBooking,
  markEquipmentReturned
} from '../controllers/venueController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getAllVenues);
router.post('/', authorize('admin'), createVenue);
router.post('/check-availability', checkAvailability);

router.get('/bookings', getAllBookings);
router.post('/bookings', createBooking);
router.put('/bookings/:id/status', authorize('admin', 'faculty'), updateBookingStatus);
router.put('/bookings/:id/cancel', cancelBooking);
router.put('/bookings/:id/equipment-return', authorize('admin', 'coordinator', 'faculty'), markEquipmentReturned);

export default router;
