import express from 'express';
import {
  createOrder,
  verifyPayment,
  getRazorpayKey,
  getClubsFeeStatus,
  getMyPayments,
  getPaymentReceipt,
  getAllAdminPayments
} from '../controllers/paymentController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public key retrieval (requires auth)
router.get('/key', protect, getRazorpayKey);

// Student club fee status & options
router.get('/clubs-status', protect, getClubsFeeStatus);

// Order creation and Razorpay HMAC signature verification
router.post('/order', protect, createOrder);
router.post('/verify', protect, verifyPayment);

// Student payment history & receipt
router.get('/my-payments', protect, getMyPayments);
router.get('/receipt/:id', protect, getPaymentReceipt);

// Admin / Faculty transaction oversight & verification
router.get('/admin/all', protect, authorize('admin', 'faculty'), getAllAdminPayments);

export default router;
