import express from 'express';
import {
  getAllTransactions,
  getTransactionReceipt,
  processRefund,
  grantFeeWaiver,
  getFinancialSummary,
  createBudgetProposal,
  getAllBudgets,
  reviewBudget,
  exportTransactionsExcel,
  getFeeCampaign,
  saveFeeCampaign,
  getClassWiseFinance,
  recordStudentPayment
} from '../controllers/financeController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Fee Campaign & Class-wise Breakdown
router.get('/campaign', getFeeCampaign);
router.post('/campaign', authorize('admin'), saveFeeCampaign);
router.get('/class-breakdown', authorize('admin', 'faculty'), getClassWiseFinance);
router.post('/pay-membership', recordStudentPayment);

// Financial reports & ledger
router.get('/analytics', authorize('admin', 'faculty'), getFinancialSummary);
router.get('/transactions', authorize('admin', 'faculty'), getAllTransactions);
router.get('/transactions/:id/receipt', getTransactionReceipt);
router.get('/export', authorize('admin', 'faculty'), exportTransactionsExcel);

// Refund & Fee waiver actions
router.post('/transactions/:id/refund', authorize('admin'), processRefund);
router.post('/fee-waiver', authorize('admin', 'faculty'), grantFeeWaiver);

// Budget Proposals & Reviews
router.post('/budgets', createBudgetProposal);
router.get('/budgets', getAllBudgets);
router.put('/budgets/:id/review', authorize('admin', 'faculty'), reviewBudget);

export default router;

