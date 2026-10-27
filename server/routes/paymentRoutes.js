import express from 'express';
import {
  createOrder,
  verifyPayment,
  getRazorpayKey,
  getMyPayments,
  getPaymentReceipt
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/key', protect, getRazorpayKey);
router.post('/order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/my-payments', protect, getMyPayments);
router.get('/receipt/:id', protect, getPaymentReceipt);

export default router;

