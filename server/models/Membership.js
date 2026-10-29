import mongoose from 'mongoose';

const membershipSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Pending', 'Paid'],
    default: 'Unpaid'
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  paymentDate: {
    type: Date
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment'
  },
  joinDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ensure a student can only apply to a club once
membershipSchema.index({ studentId: 1, clubId: 1 }, { unique: true });

const Membership = mongoose.model('Membership', membershipSchema);

export default Membership;
