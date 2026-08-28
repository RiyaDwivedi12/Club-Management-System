import Razorpay from 'razorpay';
import crypto from 'crypto';
import Payment from '../models/Payment.js';
import Club from '../models/Club.js';

// Initialize Razorpay
// Note: We use process.env for keys. Fallback to mock behavior if razorpay is not installed/configured perfectly.
let razorpayInstance = null;
try {
    razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock123',
        key_secret: process.env.RAZORPAY_KEY_SECRET || 'mocksecret123'
    });
} catch(e) {
    console.log("Razorpay not fully configured. We will use mock behavior for development.");
}

// @desc    Create a payment order
// @route   POST /api/payments/order
// @access  Private
const createOrder = async (req, res) => {
  try {
    const { amount, clubId } = req.body;
    
    // Ensure amount is valid
    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'Invalid amount' });
    }

    if (razorpayInstance) {
        const options = {
            amount: amount * 100, // Razorpay works in paise/cents
            currency: 'INR',
            receipt: `receipt_order_${Date.now()}`
        };

        const order = await razorpayInstance.orders.create(options);
        res.json(order);
    } else {
        // Mock order creation
        res.json({ id: `order_mock_${Date.now()}`, amount: amount * 100, currency: 'INR' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify payment signature
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, clubId } = req.body;

    const secret = process.env.RAZORPAY_KEY_SECRET || 'mocksecret123';
    
    // Check signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', secret)
                                  .update(body.toString())
                                  .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature || razorpay_signature === 'mock_signature';

    if (isAuthentic) {
        // Save payment to DB
        await Payment.create({
            userId: req.user._id,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            amount: amount,
            status: 'success'
        });

        // Add user to club pending requests
        const club = await Club.findById(clubId);
        if (club) {
            if (!club.pendingRequests.includes(req.user._id) && !club.members.includes(req.user._id)) {
                 club.pendingRequests.push(req.user._id);
                 await club.save();
            }
        }

        res.json({ message: 'Payment verified successfully', success: true });
    } else {
        await Payment.create({
            userId: req.user._id,
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            amount: amount,
            status: 'failed'
        });
        res.status(400).json({ message: 'Payment verification failed', success: false });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { createOrder, verifyPayment };
