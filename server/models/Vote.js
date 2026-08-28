import mongoose from 'mongoose';

const voteSchema = new mongoose.Schema({
  electionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Election',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  votedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Strictly prevent duplicate voting by a student in the same election
voteSchema.index({ electionId: 1, studentId: 1 }, { unique: true });

const Vote = mongoose.model('Vote', voteSchema);

export default Vote;
