import express from 'express';
import {
  generateEventPass,
  scanQrCheckIn,
  getEventAttendance,
  issueCertificatesToAttendees,
  getMyPasses
} from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/pass', generateEventPass);
router.get('/my-passes', getMyPasses);
router.post('/check-in', authorize('admin', 'faculty', 'president', 'coordinator'), scanQrCheckIn);
router.get('/event/:eventId', authorize('admin', 'faculty', 'president', 'coordinator'), getEventAttendance);
router.post('/event/:eventId/issue-certificates', authorize('admin', 'faculty', 'president'), issueCertificatesToAttendees);

export default router;
