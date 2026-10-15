import mongoose from 'mongoose';

const budgetSchema = new mongoose.Schema({
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Event', 'Equipment', 'Travel', 'Refreshments', 'Marketing', 'Logistics', 'Workshops', 'Other'],
    default: 'Event'
  },
  amountRequested: {
    type: Number,
    required: true,
    min: 0
  },
  amountApproved: {
    type: Number,
    default: 0
  },
  fiscalYear: {
    type: String,
    default: '2025-2026'
  },
  description: {
    type: String,
    trim: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'Disbursed'],
    default: 'Pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String
  },
  receiptUrl: {
    type: String
  },
  spentAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Budget = mongoose.model('Budget', budgetSchema);

export default Budget;
