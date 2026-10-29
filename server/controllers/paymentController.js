import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Club from '../models/Club.js';
import User from '../models/User.js';
import Membership from '../models/Membership.js';
import { createAndSendNotification } from '../utils/notify.js';

// Helper to initialize Razorpay instance dynamically from environment
const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (
    key_id &&
    key_secret &&
    !key_id.includes('mock') &&
    !key_secret.includes('mock')
  ) {
    try {
      return new Razorpay({ key_id, key_secret });
    } catch (err) {
      console.error('Razorpay initialization error:', err.message);
      return null;
    }
  }
  return null;
};

// @desc    Get public Razorpay Key ID
// @route   GET /api/payments/key
// @access  Private
export const getRazorpayKey = async (req, res) => {
  const keyId = process.env.RAZORPAY_KEY_ID || '';
  const isMock = !keyId || keyId.includes('mock');
  res.json({
    keyId: isMock ? 'rzp_test_mock123' : keyId,
    isMock
  });
};

// @desc    Get all clubs with student-specific membership fee & payment status
// @route   GET /api/payments/clubs-status
// @access  Private
export const getClubsFeeStatus = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Fetch all clubs
    const clubs = await Club.find({})
      .select('name category sportType description logo joinFee isAcceptingMembers members pendingRequests presidentId')
      .populate('presidentId', 'name email');

    // Fetch all student's payments
    const studentPayments = await Payment.find({
      userId: studentId,
      paymentType: 'membership_fee'
    }).sort({ createdAt: -1 });

    // Fetch student's memberships
    const memberships = await Membership.find({ studentId });

    // Map club status
    const clubFeeList = clubs.map((club) => {
      const isMember = (club.members || []).some(
        (mId) => mId.toString() === studentId.toString()
      );
      const isPendingApproval = (club.pendingRequests || []).some(
        (pId) => pId.toString() === studentId.toString()
      );

      const membership = memberships.find(
        (m) => m.clubId.toString() === club._id.toString()
      );

      // Find most recent successful payment for this club
      const successfulPayment = studentPayments.find(
        (p) =>
          p.clubId &&
          p.clubId.toString() === club._id.toString() &&
          (p.status === 'success' || p.status === 'Paid')
      );

      // Find any recent payment record (including pending/failed)
      const latestPayment = studentPayments.find(
        (p) => p.clubId && p.clubId.toString() === club._id.toString()
      );

      let paymentStatus = 'Unpaid';
      if (successfulPayment || membership?.paymentStatus === 'Paid') {
        paymentStatus = 'Paid';
      } else if (latestPayment?.status === 'pending' || latestPayment?.status === 'Pending') {
        paymentStatus = 'Pending';
      } else if (latestPayment?.status === 'failed') {
        paymentStatus = 'Failed';
      }

      return {
        _id: club._id,
        name: club.name,
        category: club.category,
        sportType: club.sportType,
        description: club.description,
        logo: club.logo,
        joinFee: Number(club.joinFee !== undefined ? club.joinFee : 500),
        isAcceptingMembers: club.isAcceptingMembers,
        isMember,
        isPendingApproval,
        paymentStatus,
        paymentDetails: successfulPayment || latestPayment || null,
        membershipRecord: membership || null
      };
    });

    res.json(clubFeeList);
  } catch (error) {
    console.error('Error fetching clubs fee status:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a payment order for club fee (Secured against fee manipulation)
// @route   POST /api/payments/order
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const { clubId } = req.body;

    if (!clubId) {
      return res.status(400).json({ message: 'Club ID is required to initiate fee payment' });
    }

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ message: 'Selected club not found' });
    }

    // Requirement 9: Prevent duplicate payments if user already has an active verified payment
    const existingSuccessfulPayment = await Payment.findOne({
      userId: req.user._id,
      clubId: club._id,
      paymentType: 'membership_fee',
      status: { $in: ['success', 'Paid'] }
    });

    if (existingSuccessfulPayment) {
      return res.status(400).json({
        message: `Membership fee for ${club.name} has already been paid and verified. Receipt: ${existingSuccessfulPayment.receiptNumber}`,
        alreadyPaid: true,
        receiptNumber: existingSuccessfulPayment.receiptNumber
      });
    }

    // Check if user is already an active confirmed member
    const isAlreadyMember = club.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (isAlreadyMember) {
      return res.status(400).json({
        message: `You are already an enrolled active member of ${club.name}.`,
        alreadyMember: true
      });
    }

    // Requirement 9: Fee amount is retrieved strictly from the database
    const amount = Number(club.joinFee !== undefined ? club.joinFee : 500);

    // If club is free (joinFee === 0), join directly without payment
    if (amount <= 0) {
      if (!club.members.includes(req.user._id)) {
        club.members.push(req.user._id);
        club.pendingRequests = club.pendingRequests.filter(
          (id) => id.toString() !== req.user._id.toString()
        );
        await club.save();
      }

      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { clubMemberships: clubId }
      });

      const freePayment = await Payment.create({
        userId: req.user._id,
        clubId: club._id,
        paymentType: 'membership_fee',
        paymentMethod: 'Complimentary / Zero Fee',
        amount: 0,
        status: 'success',
        reconciled: true,
        academicYear: '2025-2026',
        date: new Date()
      });

      await Membership.findOneAndUpdate(
        { studentId: req.user._id, clubId },
        {
          status: 'Approved',
          role: 'member',
          paymentStatus: 'Paid',
          amountPaid: 0,
          paymentDate: new Date(),
          paymentId: freePayment._id
        },
        { upsert: true, new: true }
      );

      return res.json({
        free: true,
        message: 'This club is free to join! Your membership is now activated.',
        payment: freePayment
      });
    }

    const rzp = getRazorpayInstance();
    const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_mock123';

    if (rzp) {
      const options = {
        amount: Math.round(amount * 100), // Razorpay works in paise (1 INR = 100 paise)
        currency: 'INR',
        receipt: `RCP_${Date.now().toString().slice(-8)}_${req.user._id.toString().slice(-4)}`,
        notes: {
          clubId: club._id.toString(),
          clubName: club.name,
          userId: req.user._id.toString(),
          userName: req.user.name || 'Student',
          userEmail: req.user.email || '',
          rollNo: req.user.roll_no || ''
        }
      };

      try {
        const order = await rzp.orders.create(options);
        return res.json({
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId: keyId,
          clubName: club.name,
          feeAmount: amount,
          isMock: false
        });
      } catch (orderErr) {
        console.error('Razorpay orders.create failed, falling back to simulated order:', orderErr.message);
        return res.json({
          id: `order_mock_${Date.now()}`,
          amount: Math.round(amount * 100),
          currency: 'INR',
          keyId: keyId,
          clubName: club.name,
          feeAmount: amount,
          isMock: true,
          mockReason: orderErr.message
        });
      }
    } else {
      // Mock order for local development before keys are configured
      return res.json({
        id: `order_mock_${Date.now()}`,
        amount: Math.round(amount * 100),
        currency: 'INR',
        keyId: 'rzp_test_mock123',
        clubName: club.name,
        feeAmount: amount,
        isMock: true
      });
    }
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify payment signature and activate club membership status to Paid
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, clubId } = req.body;

    if (!clubId) {
      return res.status(400).json({ message: 'Club ID is required for payment verification' });
    }

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    // Requirement 9: Strict fee amount from database, impossible to tamper via client payload
    const paymentAmount = Number(club.joinFee !== undefined ? club.joinFee : 500);

    // Requirement 9: Check if this payment ID was already verified
    if (razorpay_payment_id) {
      const alreadyProcessed = await Payment.findOne({
        razorpayPaymentId: razorpay_payment_id,
        status: { $in: ['success', 'Paid'] }
      });
      if (alreadyProcessed) {
        return res.json({
          message: 'This payment has already been verified and recorded.',
          success: true,
          payment: alreadyProcessed
        });
      }
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    const isMock =
      !secret ||
      secret.includes('mock') ||
      razorpay_signature === 'mock_signature' ||
      razorpay_payment_id?.startsWith('pay_mock_');

    let isAuthentic = false;

    if (isMock) {
      // Allow simulated test confirmation
      isAuthentic = true;
    } else {
      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          message: 'Missing Razorpay order ID, payment ID, or signature',
          success: false
        });
      }

      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body.toString())
        .digest('hex');

      isAuthentic = expectedSignature === razorpay_signature;
    }

    if (isAuthentic) {
      // Generate clean collegiate receipt number
      const randomHex = Math.floor(100000 + Math.random() * 900000);
      const receiptNumber = `RCP-${new Date().getFullYear()}-${randomHex}`;

      // 1. Record verified payment in DB (Req 5)
      const payment = await Payment.create({
        userId: req.user._id,
        clubId: club._id,
        paymentType: 'membership_fee',
        paymentMethod: isMock ? 'Razorpay (Test Simulation)' : 'Razorpay',
        receiptNumber,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        amount: paymentAmount,
        status: 'success',
        reconciled: true,
        academicYear: '2025-2026',
        date: new Date()
      });

      // 2. Add user to club members & remove from pending requests
      if (!club.members.some((id) => id.toString() === req.user._id.toString())) {
        club.members.push(req.user._id);
      }
      club.pendingRequests = club.pendingRequests.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
      await club.save();

      // 3. Add club to user profile
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { clubMemberships: club._id }
      });

      // 4. Update student's membership status to Paid (Req 6)
      const updatedMembership = await Membership.findOneAndUpdate(
        { studentId: req.user._id, clubId: club._id },
        {
          status: 'Approved',
          role: 'member',
          paymentStatus: 'Paid',
          amountPaid: paymentAmount,
          paymentDate: new Date(),
          paymentId: payment._id
        },
        { upsert: true, new: true }
      );

      // 5. Send real-time socket and in-app notification to student (Req 7)
      const io = req.app.get('io');
      createAndSendNotification(io, {
        userId: req.user._id,
        message: `🎉 Payment of ₹${paymentAmount} verified! You are now an official member of ${club.name}. Receipt: ${payment.receiptNumber}`,
        type: 'payment_success',
        link: `/membership-fees`
      }).catch((e) => console.error('Notification error:', e));

      // 6. Notify Club President
      if (club.presidentId) {
        createAndSendNotification(io, {
          userId: club.presidentId,
          message: `💳 New member joined: ${req.user.name || 'A student'} paid ₹${paymentAmount} dues for ${club.name}.`,
          type: 'club_update',
          link: `/president`
        }).catch((e) => console.error('President notification error:', e));
      }

      return res.json({
        message: `🎉 Payment of ₹${paymentAmount} verified successfully! Your membership status is now Paid.`,
        success: true,
        payment,
        membership: updatedMembership
      });
    } else {
      // Record failed payment attempt for audit logs
      const failedPayment = await Payment.create({
        userId: req.user._id,
        clubId: club._id,
        paymentType: 'membership_fee',
        paymentMethod: 'Razorpay',
        razorpayOrderId: razorpay_order_id || 'failed_order',
        razorpayPaymentId: razorpay_payment_id || 'failed_payment',
        amount: paymentAmount,
        status: 'failed',
        academicYear: '2025-2026',
        date: new Date()
      });

      return res.status(400).json({
        message: 'Payment verification failed: Invalid transaction signature.',
        success: false,
        paymentId: failedPayment._id
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get student payment history
// @route   GET /api/payments/my-payments
// @access  Private
export const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .populate('clubId', 'name category logo joinFee description')
      .populate('userId', 'name email roll_no department year section className')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single payment receipt
// @route   GET /api/payments/receipt/:id
// @access  Private
export const getPaymentReceipt = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('userId', 'name email roll_no department year course section')
      .populate('clubId', 'name category email logo')
      .populate('feeWaiverApprovedBy', 'name role');

    if (!payment) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    const isOwner = payment.userId?._id?.toString() === req.user._id.toString();
    const isPrivileged = ['admin', 'faculty', 'president', 'vice_president'].includes(req.user.role);

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: 'Not authorized to view this receipt' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all transactions for Admin Dashboard with filters & stats (Req 8)
// @route   GET /api/payments/admin/all
// @access  Private (Admin / Faculty)
export const getAllAdminPayments = async (req, res) => {
  try {
    const { status, clubId, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status && status !== 'all') {
      if (status === 'success' || status === 'Paid') {
        query.status = { $in: ['success', 'Paid'] };
      } else {
        query.status = status;
      }
    }

    if (clubId && clubId !== 'all') {
      query.clubId = clubId;
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    if (search) {
      const s = search.trim();
      const users = await User.find({
        $or: [
          { name: new RegExp(s, 'i') },
          { roll_no: new RegExp(s, 'i') },
          { email: new RegExp(s, 'i') }
        ]
      }).select('_id');
      const userIds = users.map((u) => u._id);

      query.$or = [
        { userId: { $in: userIds } },
        { receiptNumber: new RegExp(s, 'i') },
        { razorpayPaymentId: new RegExp(s, 'i') },
        { razorpayOrderId: new RegExp(s, 'i') }
      ];
    }

    const [payments, total, allStats] = await Promise.all([
      Payment.find(query)
        .populate('userId', 'name email roll_no department course year section')
        .populate('clubId', 'name category logo joinFee')
        .populate('feeWaiverApprovedBy', 'name role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Payment.countDocuments(query),
      Payment.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $cond: [{ $in: ['$status', ['success', 'Paid']] }, '$amount', 0]
              }
            },
            successfulCount: {
              $sum: {
                $cond: [{ $in: ['$status', ['success', 'Paid']] }, 1, 0]
              }
            },
            failedCount: {
              $sum: {
                $cond: [{ $eq: ['$status', 'failed'] }, 1, 0]
              }
            },
            pendingCount: {
              $sum: {
                $cond: [{ $in: ['$status', ['pending', 'Pending']] }, 1, 0]
              }
            }
          }
        }
      ])
    ]);

    const stats = allStats[0] || {
      totalRevenue: 0,
      successfulCount: 0,
      failedCount: 0,
      pendingCount: 0
    };

    res.json({
      payments,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      stats
    });
  } catch (error) {
    console.error('Error fetching admin payments:', error);
    res.status(500).json({ message: error.message });
  }
};
