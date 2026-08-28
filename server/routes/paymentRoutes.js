import express from 'express';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/order')
  .post(protect, createOrder);

router.route('/verify')
  .post(protect, verifyPayment);

export default router;
