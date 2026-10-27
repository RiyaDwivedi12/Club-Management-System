import mongoose from 'mongoose';

const clubSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    default: 'Sports',
    trim: true
  },
  sportType: {
    type: String,
    default: 'General'
  },
  description: {
    type: String,
    required: true
  },
  logo: {
    type: String,
    default: ''
  },
  presidentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  vicePresidentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  facultyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  gallery: [{
    type: String
  }],
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  pendingRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isAcceptingMembers: {
    type: Boolean,
    default: false
  },
  joinFee: {
    type: Number,
    default: 500
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'suspended'],
    default: 'approved'
  }
}, {
  timestamps: true
});

const Club = mongoose.model('Club', clubSchema);

export default Club;
