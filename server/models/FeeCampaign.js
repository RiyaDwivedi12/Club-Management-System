import mongoose from 'mongoose';

const feeCampaignSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    default: 'Annual Club Membership Fee Campaign'
  },
  feeAmount: {
    type: Number,
    required: true,
    default: 500 // In Rupees (₹)
  },
  minMandatoryClubs: {
    type: Number,
    required: true,
    default: 1 // Minimum clubs student must join
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  message: {
    type: String,
    default: 'Membership fee payment window is now active. Please complete payment before deadline to activate club memberships.'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

export default mongoose.model('FeeCampaign', feeCampaignSchema);
