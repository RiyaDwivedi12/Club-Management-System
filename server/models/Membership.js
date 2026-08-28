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
