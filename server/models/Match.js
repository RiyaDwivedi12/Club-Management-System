import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament'
  },
  teamA: {
    type: String,
    required: true
  },
  teamB: {
    type: String,
    required: true
  },
  refereeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled', 'walkover'],
    default: 'scheduled'
  },
  scoreA: {
    type: Number,
    default: 0
  },
  scoreB: {
    type: Number,
    default: 0
  },
  winner: {
    type: String,
    default: ''
  },
  timer: {
    type: Number,
    default: 0
  },
  round: {
    type: Number,
    default: 1
  },
  teamAId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  teamBId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team'
  },
  nextMatchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match'
  }
}, {
  timestamps: true
});

const Match = mongoose.model('Match', matchSchema);

export default Match;
