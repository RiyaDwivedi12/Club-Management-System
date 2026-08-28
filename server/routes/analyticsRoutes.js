import express from 'express';
import { getAnalytics } from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, authorize('admin', 'faculty', 'president'), getAnalytics);

export default router;
