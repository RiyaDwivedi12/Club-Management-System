import mongoose from 'mongoose';

const electionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true
  },
  position: {
    type: String,
    required: true,
    trim: true,
    default: 'President',
    enum: ['President', 'Vice President', 'Treasurer', 'Secretary']
  },
  banner: {
    type: String,
    default: ''
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  candidates: [{
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      default: ''
    },
    photo: {
      type: String,
      default: ''
    },
    manifesto: {
      type: String,
      required: true
    },
    votes: {
      type: Number,
      default: 0
    }
  }],
  votedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  winner: {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    votes: Number
  },
  isConcluded: {
    type: Boolean,
    default: false
  },
  concludedAt: {
    type: Date
  }
}, {
  timestamps: true
});

const Election = mongoose.model('Election', electionSchema);

export default Election;
