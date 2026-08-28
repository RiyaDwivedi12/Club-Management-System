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
    default: 'President'
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
  }]
}, {
  timestamps: true
});

const Election = mongoose.model('Election', electionSchema);

export default Election;
