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

// @desc    Create a payment order for club fee
// @route   POST /api/payments/order
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const { clubId } = req.body;

    if (!clubId) {
      return res.status(400).json({ message: 'Club ID is required' });
    }

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    if (!club.isAcceptingMembers) {
      return res.status(400).json({ message: 'This club is not currently accepting members' });
    }

    // Check if user is already an active member
    const isAlreadyMember = club.members.some(
      (m) => m.toString() === req.user._id.toString()
    );
    if (isAlreadyMember) {
      return res.status(400).json({ message: 'You are already an active member of this club' });
    }

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

      await Membership.findOneAndUpdate(
        { studentId: req.user._id, clubId },
        { status: 'Approved', role: 'member' },
        { upsert: true, new: true }
      );

      return res.json({
        free: true,
        message: 'This club is free to join! Membership activated successfully.'
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
          userEmail: req.user.email || ''
        }
      };

      try {
        const order = await rzp.orders.create(options);
        return res.json({
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          keyId: keyId,
          isMock: false
        });
      } catch (orderErr) {
        console.error('Razorpay orders.create failed, falling back to development mock:', orderErr.message);
        return res.json({
          id: `order_mock_${Date.now()}`,
          amount: Math.round(amount * 100),
          currency: 'INR',
          keyId: keyId,
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
        isMock: true
      });
    }
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify payment signature and activate club membership
// @route   POST /api/payments/verify
// @access  Private
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, clubId } = req.body;

    if (!clubId) {
      return res.status(400).json({ message: 'Club ID is required for verification' });
    }

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
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
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body.toString())
        .digest('hex');

      isAuthentic = expectedSignature === razorpay_signature;
    }

    const paymentAmount = Number(amount) || club.joinFee || 500;

    if (isAuthentic) {
      // Record verified payment in DB
      const payment = await Payment.create({
        userId: req.user._id,
        clubId: club._id,
        paymentType: 'membership_fee',
        paymentMethod: isMock ? 'Razorpay (Test Simulation)' : 'Razorpay',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        amount: paymentAmount,
        status: 'success',
        reconciled: true,
        academicYear: '2025-2026',
        date: new Date()
      });

      // Add user to club members
      if (!club.members.some((id) => id.toString() === req.user._id.toString())) {
        club.members.push(req.user._id);
      }
      // Clean up from pending requests
      club.pendingRequests = club.pendingRequests.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
      await club.save();

      // Add club to user profile
      await User.findByIdAndUpdate(req.user._id, {
        $addToSet: { clubMemberships: club._id }
      });

      // Synchronize with Membership model
      await Membership.findOneAndUpdate(
        { studentId: req.user._id, clubId: club._id },
        { status: 'Approved', role: 'member' },
        { upsert: true, new: true }
      );

      // Send real-time socket and notification to student
      const io = req.app.get('io');
      createAndSendNotification(io, {
        userId: req.user._id,
        message: `🎉 Payment of ₹${paymentAmount} verified! You are now an official member of ${club.name}. Receipt: ${payment.receiptNumber}`,
        type: 'payment_success',
        link: `/clubs/${club._id}`
      }).catch((e) => console.error('Notification error:', e));

      // Notify Club President
      if (club.presidentId) {
        createAndSendNotification(io, {
          userId: club.presidentId,
          message: `💳 New member joined: ${req.user.name || 'A student'} paid ₹${paymentAmount} dues for ${club.name}.`,
          type: 'club_update',
          link: `/president`
        }).catch((e) => console.error('President notification error:', e));
      }

      return res.json({
        message: 'Payment verified successfully! Welcome to the club.',
        success: true,
        payment
      });
    } else {
      // Record failed payment
      await Payment.create({
        userId: req.user._id,
        clubId: club._id,
        paymentType: 'membership_fee',
        paymentMethod: 'Razorpay',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        amount: paymentAmount,
        status: 'failed',
        academicYear: '2025-2026',
        date: new Date()
      });

      return res.status(400).json({
        message: 'Payment verification failed: invalid signature.',
        success: false
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
      .populate('userId', 'name email roll_no department year')
      .populate('clubId', 'name category email')
      .populate('feeWaiverApprovedBy', 'name role');

    if (!payment) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    const isOwner = payment.userId?._id?.toString() === req.user._id.toString();
    const isPrivileged = ['admin', 'faculty'].includes(req.user.role);

    if (!isOwner && !isPrivileged) {
      return res.status(403).json({ message: 'Not authorized to view this receipt' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

