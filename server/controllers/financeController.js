import Payment from '../models/Payment.js';
import Budget from '../models/Budget.js';
import Club from '../models/Club.js';
import User from '../models/User.js';
import Membership from '../models/Membership.js';
import AuditLog from '../models/AuditLog.js';
import XLSX from 'xlsx';

// @desc    Get all payment transactions with filters and pagination
// @route   GET /api/finance/transactions
// @access  Private (Admin / Faculty)
export const getAllTransactions = async (req, res) => {
  try {
    const { status, paymentType, clubId, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = status;
    }
    if (paymentType && paymentType !== 'all') {
      query.paymentType = paymentType;
    }
    if (clubId && clubId !== 'all') {
      query.clubId = clubId;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    // Search by student name, roll_no, receiptNumber
    let userFilter = null;
    if (search) {
      const s = search.trim();
      const users = await User.find({
        $or: [
          { name: new RegExp(s, 'i') },
          { roll_no: new RegExp(s, 'i') },
          { email: new RegExp(s, 'i') }
        ]
      }).select('_id');
      const userIds = users.map(u => u._id);

      query.$or = [
        { userId: { $in: userIds } },
        { receiptNumber: new RegExp(s, 'i') },
        { razorpayPaymentId: new RegExp(s, 'i') },
        { razorpayOrderId: new RegExp(s, 'i') }
      ];
    }

    const [transactions, total] = await Promise.all([
      Payment.find(query)
        .populate('userId', 'name email roll_no department')
        .populate('clubId', 'name category')
        .populate('feeWaiverApprovedBy', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Payment.countDocuments(query)
    ]);

    res.json({
      transactions,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get receipt details for a single transaction
// @route   GET /api/finance/transactions/:id/receipt
// @access  Private
export const getTransactionReceipt = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('userId', 'name email roll_no department year')
      .populate('clubId', 'name category email')
      .populate('feeWaiverApprovedBy', 'name role');

    if (!payment) {
      return res.status(404).json({ message: 'Transaction record not found' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Process refund / reconcile payment
// @route   POST /api/finance/transactions/:id/refund
// @access  Private (Admin only)
export const processRefund = async (req, res) => {
  try {
    const { refundReason, refundAmount } = req.body;
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (payment.status === 'refunded') {
      return res.status(400).json({ message: 'This transaction has already been refunded' });
    }

    payment.status = 'refunded';
    payment.refundStatus = 'refunded';
    payment.refundReason = refundReason || 'Administrative refund processed';
    payment.refundAmount = refundAmount || payment.amount;
    await payment.save();

    await AuditLog.create({
      action: 'PAYMENT_REFUNDED',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      targetType: 'Payment',
      targetId: payment._id,
      details: {
        receiptNumber: payment.receiptNumber,
        amount: payment.amount,
        refundAmount: payment.refundAmount,
        reason: payment.refundReason
      },
      status: 'SUCCESS'
    });

    res.json({ message: 'Refund registered and transaction marked as refunded successfully', payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Grant Fee Waiver / Discount
// @route   POST /api/finance/fee-waiver
// @access  Private (Admin / Faculty)
export const grantFeeWaiver = async (req, res) => {
  try {
    const { studentId, clubId, reason, discountPercent = 100 } = req.body;

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    const waiverPayment = await Payment.create({
      userId: student._id,
      clubId: club._id,
      paymentType: 'membership_fee',
      razorpayOrderId: `WAIVER_${Date.now()}`,
      razorpayPaymentId: `WAIVER_AUTH_${req.user._id.toString().slice(-6)}`,
      amount: discountPercent === 100 ? 0 : Math.round(club.joinFee * (1 - discountPercent / 100)),
      paymentMethod: 'Fee Waiver / Scholarship',
      status: 'success',
      feeWaiverApprovedBy: req.user._id,
      feeWaiverReason: reason || 'Merit / Need based fee waiver'
    });

    // Add student to club
    if (!club.members.includes(student._id)) {
      club.members.push(student._id);
      club.pendingRequests = club.pendingRequests.filter(id => id.toString() !== student._id.toString());
      await club.save();
    }

    await User.findByIdAndUpdate(student._id, {
      $addToSet: { clubMemberships: club._id }
    });

    await Membership.findOneAndUpdate(
      { studentId: student._id, clubId: club._id },
      { status: 'Approved' },
      { upsert: true, new: true }
    );

    await AuditLog.create({
      action: 'FEE_WAIVER_GRANTED',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      targetType: 'Payment',
      targetId: waiverPayment._id,
      details: {
        student: student.name,
        roll_no: student.roll_no,
        club: club.name,
        discountPercent,
        reason
      },
      status: 'SUCCESS'
    });

    res.json({ message: 'Fee waiver granted and student enrolled successfully', waiverPayment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Financial Dashboard & Revenue Analytics
// @route   GET /api/finance/analytics
// @access  Private (Admin / Faculty)
export const getFinancialSummary = async (req, res) => {
  try {
    const totalTransactions = await Payment.countDocuments();
    const successfulPayments = await Payment.find({ status: { $in: ['success', 'Paid'] } });
    
    const totalRevenue = successfulPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const totalRefunded = await Payment.countDocuments({ status: 'refunded' });
    const totalFailed = await Payment.countDocuments({ status: 'failed' });

    // Revenue by Club
    const revenueByClub = await Payment.aggregate([
      { $match: { status: { $in: ['success', 'Paid'] } } },
      { $group: { _id: '$clubId', totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $lookup: { from: 'clubs', localField: '_id', foreignField: '_id', as: 'club' } },
      { $unwind: { path: '$club', preserveNullAndEmptyArrays: true } },
      { $project: { clubName: { $ifNull: ['$club.name', 'General Campus'] }, totalAmount: 1, count: 1 } },
      { $sort: { totalAmount: -1 } }
    ]);

    // Revenue by Type
    const revenueByType = await Payment.aggregate([
      { $match: { status: { $in: ['success', 'Paid'] } } },
      { $group: { _id: '$paymentType', totalAmount: { $sum: '$amount' }, count: { $sum: 1 } } }
    ]);

    // Budget statistics
    const totalBudgets = await Budget.countDocuments();
    const approvedBudgets = await Budget.find({ status: { $in: ['Approved', 'Disbursed'] } });
    const totalBudgetApproved = approvedBudgets.reduce((acc, b) => acc + (b.amountApproved || 0), 0);

    res.json({
      totalRevenue,
      totalTransactions,
      successfulCount: successfulPayments.length,
      refundedCount: totalRefunded,
      failedCount: totalFailed,
      totalBudgetApproved,
      revenueByClub,
      revenueByType
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Submit a Club Budget Request
// @route   POST /api/finance/budgets
// @access  Private (Admin, Faculty, Club Lead)
export const createBudgetProposal = async (req, res) => {
  try {
    const { clubId, title, category, amountRequested, fiscalYear, description, receiptUrl } = req.body;

    if (!clubId || !title || !amountRequested) {
      return res.status(400).json({ message: 'Club, title, and requested amount are required' });
    }

    const budget = await Budget.create({
      clubId,
      title,
      category: category || 'Event',
      amountRequested,
      fiscalYear: fiscalYear || '2025-2026',
      description,
      receiptUrl,
      submittedBy: req.user._id
    });

    await AuditLog.create({
      action: 'BUDGET_PROPOSED',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      targetType: 'Budget',
      targetId: budget._id,
      details: { title, amountRequested, clubId },
      status: 'SUCCESS'
    });

    res.status(201).json({ message: 'Budget proposal submitted for administrative review', budget });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all budget proposals
// @route   GET /api/finance/budgets
// @access  Private
export const getAllBudgets = async (req, res) => {
  try {
    const { clubId, status, fiscalYear } = req.query;
    const query = {};

    if (clubId && clubId !== 'all') query.clubId = clubId;
    if (status && status !== 'all') query.status = status;
    if (fiscalYear && fiscalYear !== 'all') query.fiscalYear = fiscalYear;

    const budgets = await Budget.find(query)
      .populate('clubId', 'name category')
      .populate('submittedBy', 'name email role')
      .populate('reviewedBy', 'name role')
      .sort({ createdAt: -1 });

    res.json(budgets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Review/Approve/Reject budget proposal
// @route   PUT /api/finance/budgets/:id/review
// @access  Private (Admin / Faculty)
export const reviewBudget = async (req, res) => {
  try {
    const { status, amountApproved, reviewNotes } = req.body;
    const budget = await Budget.findById(req.params.id);

    if (!budget) {
      return res.status(404).json({ message: 'Budget proposal not found' });
    }

    budget.status = status;
    budget.amountApproved = status === 'Approved' || status === 'Disbursed' ? (amountApproved !== undefined ? amountApproved : budget.amountRequested) : 0;
    budget.reviewNotes = reviewNotes || '';
    budget.reviewedBy = req.user._id;
    budget.reviewedAt = new Date();
    await budget.save();

    await AuditLog.create({
      action: `BUDGET_${status.toUpperCase()}`,
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      targetType: 'Budget',
      targetId: budget._id,
      details: {
        title: budget.title,
        status,
        amountApproved: budget.amountApproved,
        reviewNotes
      },
      status: 'SUCCESS'
    });

    res.json({ message: `Budget request ${status} successfully`, budget });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export financial ledger to Excel
// @route   GET /api/finance/export
// @access  Private (Admin / Faculty)
export const exportTransactionsExcel = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('userId', 'name roll_no email department')
      .populate('clubId', 'name')
      .sort({ createdAt: -1 });

    const exportRows = payments.map((p, idx) => ({
      'S.No': idx + 1,
      'Receipt No': p.receiptNumber || 'N/A',
      'Student Name': p.userId?.name || 'N/A',
      'Roll Number': p.userId?.roll_no || 'N/A',
      'Department': p.userId?.department || 'GENERAL',
      'Club / Scope': p.clubId?.name || 'Campus Wide',
      'Fee Type': p.paymentType || 'membership_fee',
      'Amount (INR)': p.amount,
      'Payment Status': p.status.toUpperCase(),
      'Payment Method': p.paymentMethod || 'Razorpay',
      'Transaction Ref ID': p.razorpayPaymentId || p.razorpayOrderId || 'N/A',
      'Date': p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Ledger');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="CampusHub-Finance-Ledger-${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
