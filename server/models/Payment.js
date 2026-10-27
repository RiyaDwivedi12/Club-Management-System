import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: false
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: false
  },
  paymentType: {
    type: String,
    enum: ['membership_fee', 'event_registration', 'fine', 'other'],
    default: 'membership_fee'
  },
  receiptNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  razorpayOrderId: {
    type: String,
    required: false
  },
  razorpayPaymentId: {
    type: String
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    default: 'Razorpay'
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'pending', 'Paid', 'Pending', 'refunded'],
    default: 'pending'
  },
  offlineDocId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OfflinePaymentDoc'
  },
  offlineReceiptDoc: {
    type: String
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  offlineNotes: {
    type: String
  },
  refundStatus: {
    type: String,
    enum: ['none', 'requested', 'refunded', 'rejected'],
    default: 'none'
  },
  refundReason: {
    type: String
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  feeWaiverApprovedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  feeWaiverReason: {
    type: String
  },
  reconciled: {
    type: Boolean,
    default: true
  },
  academicYear: {
    type: String,
    default: '2025-2026'
  },
  date: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Auto-generate receipt number before save if not present
paymentSchema.pre('save', function(next) {
  if (!this.receiptNumber) {
    const randomHex = Math.floor(100000 + Math.random() * 900000);
    this.receiptNumber = `RCP-${new Date().getFullYear()}-${randomHex}`;
  }
  next();
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
