import Payment from '../models/Payment.js';
import Budget from '../models/Budget.js';
import Club from '../models/Club.js';
import User from '../models/User.js';
import Membership from '../models/Membership.js';
import AuditLog from '../models/AuditLog.js';
import FeeCampaign from '../models/FeeCampaign.js';
import Notification from '../models/Notification.js';
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

// Seed realistic multi-class students and payments if database has very few
const seedRealisticStudentsAndPayments = async (feeAmount = 500) => {
  try {
    const demoStudents = [
      { name: 'Aarav Sharma', roll_no: '2329401', email: 'aarav.sharma@campus.edu', department: 'CSE', year: 4, section: 'A', course: 'B.Tech' },
      { name: 'Priya Verma', roll_no: '2329402', email: 'priya.verma@campus.edu', department: 'CSE', year: 4, section: 'A', course: 'B.Tech' },
      { name: 'Rohan Gupta', roll_no: '2329403', email: 'rohan.gupta@campus.edu', department: 'CSE', year: 4, section: 'A', course: 'B.Tech' },
      { name: 'Ananya Mishra', roll_no: '2329404', email: 'ananya.mishra@campus.edu', department: 'CSE', year: 4, section: 'A', course: 'B.Tech' },

      { name: 'Vikram Patel', roll_no: '2429101', email: 'vikram.patel@campus.edu', department: 'CSE', year: 3, section: 'B', course: 'B.Tech' },
      { name: 'Neha Reddy', roll_no: '2429102', email: 'neha.reddy@campus.edu', department: 'CSE', year: 3, section: 'B', course: 'B.Tech' },
      { name: 'Siddharth Nair', roll_no: '2429103', email: 'siddharth.nair@campus.edu', department: 'CSE', year: 3, section: 'B', course: 'B.Tech' },
      { name: 'Kavita Joshi', roll_no: '2429104', email: 'kavita.joshi@campus.edu', department: 'CSE', year: 3, section: 'B', course: 'B.Tech' },

      { name: 'Aditya Singh', roll_no: '2428201', email: 'aditya.singh@campus.edu', department: 'IT', year: 3, section: 'A', course: 'B.Tech' },
      { name: 'Tanvi Saxena', roll_no: '2428202', email: 'tanvi.saxena@campus.edu', department: 'IT', year: 3, section: 'A', course: 'B.Tech' },
      { name: 'Mohit Rawat', roll_no: '2428203', email: 'mohit.rawat@campus.edu', department: 'IT', year: 3, section: 'A', course: 'B.Tech' },

      { name: 'Ishaan Roy', roll_no: '2527301', email: 'ishaan.roy@campus.edu', department: 'ECE', year: 2, section: 'A', course: 'B.Tech' },
      { name: 'Simran Kaur', roll_no: '2527302', email: 'simran.kaur@campus.edu', department: 'ECE', year: 2, section: 'A', course: 'B.Tech' },
      { name: 'Harsh Vardhan', roll_no: '2527303', email: 'harsh.vardhan@campus.edu', department: 'ECE', year: 2, section: 'A', course: 'B.Tech' },

      { name: 'Ayush Mehra', roll_no: '2626401', email: 'ayush.mehra@campus.edu', department: 'MECH', year: 1, section: 'B', course: 'B.Tech' },
      { name: 'Deepika Sen', roll_no: '2626402', email: 'deepika.sen@campus.edu', department: 'MECH', year: 1, section: 'B', course: 'B.Tech' },
      { name: 'Varun Rao', roll_no: '2626403', email: 'varun.rao@campus.edu', department: 'MECH', year: 1, section: 'B', course: 'B.Tech' },

      { name: 'Megha Agarwal', roll_no: '2650101', email: 'megha.agarwal@campus.edu', department: 'MBA', year: 1, section: 'A', course: 'MBA' },
      { name: 'Kunal Kapoor', roll_no: '2650102', email: 'kunal.kapoor@campus.edu', department: 'MBA', year: 1, section: 'A', course: 'MBA' }
    ];

    const club = await Club.findOne();
    const clubId = club ? club._id : null;

    let idx = 0;
    for (const d of demoStudents) {
      idx++;
      let student = await User.findOne({ email: d.email });
      if (!student) {
        student = await User.create({
          name: d.name,
          username: d.roll_no.toLowerCase(),
          email: d.email,
          password: 'student123',
          role: 'student',
          roll_no: d.roll_no,
          department: d.department,
          year: d.year,
          section: d.section,
          course: d.course,
          isVerified: true
        });
      }

      // Mark roughly 65% as paid to have realistic Paid vs Pending breakdown
      if (idx % 3 !== 0) {
        const existingPmt = await Payment.findOne({ userId: student._id });
        if (!existingPmt) {
          await Payment.create({
            userId: student._id,
            clubId,
            paymentType: 'membership_fee',
            receiptNumber: `REC-2026-${1000 + idx}`,
            razorpayOrderId: `order_${Date.now()}_${idx}`,
            razorpayPaymentId: `pay_${Date.now()}_${idx}`,
            amount: feeAmount,
            paymentMethod: idx % 2 === 0 ? 'UPI / GPay' : 'Netbanking / Card',
            status: 'success'
          });
        }
      }
    }
  } catch (err) {
    console.error('Error seeding demo students:', err);
  }
};

// @desc    Get active Fee Campaign / Drive config
// @route   GET /api/finance/campaign
// @access  Public / Authenticated
export const getFeeCampaign = async (req, res) => {
  try {
    let campaign = await FeeCampaign.findOne({ isActive: true }).sort({ createdAt: -1 });
    if (!campaign) {
      const now = new Date();
      const inTwoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
      campaign = await FeeCampaign.create({
        title: 'Spring 2026 Club Membership Fee Drive',
        feeAmount: 500, // ₹500
        minMandatoryClubs: 2,
        startDate: now,
        endDate: inTwoWeeks,
        message: 'Annual Club Membership Fee of ₹500 is due. Students must join at least 2 clubs to activate memberships.',
        isActive: true
      });
    }
    res.json(campaign);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create/Update Fee Campaign & Float notifications
// @route   POST /api/finance/campaign
// @access  Private (Admin only)
export const saveFeeCampaign = async (req, res) => {
  try {
    const { 
      title, 
      feeAmount, 
      minMandatoryClubs, 
      startDate, 
      endDate, 
      message, 
      isActive = true, 
      floatNotification = true 
    } = req.body;

    const campaign = await FeeCampaign.create({
      title: title || 'Annual Club Membership Fee Campaign',
      feeAmount: Number(feeAmount) || 500,
      minMandatoryClubs: Number(minMandatoryClubs) || 1,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      message: message || `Membership fee of ₹${feeAmount} is due. Join at least ${minMandatoryClubs} clubs.`,
      isActive: isActive !== false,
      createdBy: req.user._id
    });

    // Float notifications to all students
    if (floatNotification) {
      const students = await User.find({ role: 'student' }).select('_id');
      const formattedStart = new Date(campaign.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      const formattedEnd = new Date(campaign.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const notifMessage = `📢 Mandatory Membership Fee: Pay ₹${campaign.feeAmount} between ${formattedStart} and ${formattedEnd}. Students must participate in at least ${campaign.minMandatoryClubs} club(s) to activate membership.`;

      const io = req.app.get('io');
      const notifications = students.map(s => ({
        user: s._id,
        message: notifMessage,
        type: 'payment',
        link: '/profile',
        isRead: false
      }));

      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
      if (io) {
        io.emit('notification_broadcast', { message: notifMessage, type: 'payment', link: '/profile' });
      }
    }

    res.status(201).json({ message: 'Fee campaign configured and notifications floated to all students successfully!', campaign });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get Class-wise Fee Collection Breakdown (Cards + Drill-down)
// @route   GET /api/finance/class-breakdown
// @access  Private (Admin / Faculty)
export const getClassWiseFinance = async (req, res) => {
  try {
    let campaign = await FeeCampaign.findOne({ isActive: true }).sort({ createdAt: -1 });
    const standardFee = campaign ? campaign.feeAmount : 500;

    let students = await User.find({ role: 'student' })
      .select('name roll_no email department year section course createdAt');

    if (students.length < 8) {
      await seedRealisticStudentsAndPayments(standardFee);
      students = await User.find({ role: 'student' })
        .select('name roll_no email department year section course createdAt');
    }

    const payments = await Payment.find({ status: { $in: ['success', 'Paid'] } })
      .select('userId amount paymentMethod receiptNumber createdAt');

    const paymentMap = new Map();
    payments.forEach(p => {
      if (p.userId) {
        paymentMap.set(p.userId.toString(), p);
      }
    });

    const classGroups = {};

    students.forEach(student => {
      const dept = (student.department || 'CSE').toUpperCase().trim();
      const yr = student.year || 1;
      const sec = (student.section || 'A').toUpperCase().trim();
      const course = student.course || 'B.Tech';

      const classId = `${dept}_Y${yr}_${sec}`;
      const className = `${dept} - Year ${yr} (Sec ${sec})`;

      if (!classGroups[classId]) {
        classGroups[classId] = {
          classId,
          className,
          department: dept,
          year: yr,
          section: sec,
          course,
          totalStudents: 0,
          paidCount: 0,
          pendingCount: 0,
          totalCollected: 0,
          expectedTotal: 0,
          students: []
        };
      }

      const pmt = paymentMap.get(student._id.toString());
      const isPaid = !!pmt;
      const paidAmount = isPaid ? pmt.amount : 0;

      classGroups[classId].totalStudents += 1;
      classGroups[classId].expectedTotal += standardFee;

      if (isPaid) {
        classGroups[classId].paidCount += 1;
        classGroups[classId].totalCollected += paidAmount;
      } else {
        classGroups[classId].pendingCount += 1;
      }

      classGroups[classId].students.push({
        _id: student._id,
        name: student.name,
        roll_no: student.roll_no || 'N/A',
        email: student.email,
        department: dept,
        year: yr,
        section: sec,
        paymentStatus: isPaid ? 'Paid' : 'Pending',
        amount: isPaid ? paidAmount : standardFee,
        paidAt: isPaid ? pmt.createdAt : null,
        receiptNumber: isPaid ? pmt.receiptNumber : null,
        paymentMethod: isPaid ? (pmt.paymentMethod || 'UPI / Razorpay') : null
      });
    });

    const classCards = Object.values(classGroups).map(c => ({
      ...c,
      collectionPercentage: c.totalStudents > 0 ? Math.round((c.paidCount / c.totalStudents) * 100) : 0,
      totalPendingAmount: c.pendingCount * standardFee
    })).sort((a, b) => b.totalCollected - a.totalCollected);

    const overallStats = {
      totalClasses: classCards.length,
      totalStudents: students.length,
      totalCollected: classCards.reduce((acc, c) => acc + c.totalCollected, 0),
      totalPending: classCards.reduce((acc, c) => acc + c.totalPendingAmount, 0),
      standardFee,
      currency: '₹'
    };

    res.json({
      overallStats,
      classes: classCards,
      campaign
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Record or simulate student fee payment in ₹
// @route   POST /api/finance/pay-membership
// @access  Private (Student or Admin)
export const recordStudentPayment = async (req, res) => {
  try {
    const studentId = req.body.studentId || req.user._id;
    const { amount = 500, paymentMethod = 'UPI / GPay' } = req.body;

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const club = await Club.findOne();
    const clubId = club ? club._id : null;

    const receiptNumber = `REC-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const payment = await Payment.create({
      userId: student._id,
      clubId,
      paymentType: 'membership_fee',
      receiptNumber,
      razorpayOrderId: `ord_${Date.now()}`,
      razorpayPaymentId: `pay_upi_${Date.now()}`,
      amount: Number(amount) || 500,
      paymentMethod,
      status: 'success'
    });

    // Notify student
    await Notification.create({
      user: student._id,
      message: `✅ Membership Fee of ₹${payment.amount} received successfully! Receipt #${receiptNumber}. Your club memberships are now active.`,
      type: 'payment',
      link: '/profile'
    });

    res.status(201).json({
      message: `Payment of ₹${payment.amount} recorded successfully`,
      payment,
      receiptNumber
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

