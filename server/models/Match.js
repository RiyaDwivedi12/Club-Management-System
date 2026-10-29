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
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club'
  },
  sport: {
    type: String,
    default: 'Sports'
  },
  timeSlot: {
    type: String,
    default: '10:00 AM - 11:30 AM'
  },
  duration: {
    type: Number,
    default: 90
  },
  wing: {
    type: String,
    enum: ['Junior', 'Senior', 'General'],
    default: 'General'
  },
  refereeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  refereeName: {
    type: String,
    default: ''
  },
  refereeUsername: {
    type: String,
    default: ''
  },
  coordinatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  coordinatorName: {
    type: String,
    default: ''
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled', 'walkover', 'disqualified'],
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
  roundName: {
    type: String,
    default: 'Match'
  },
  isThirdPlaceMatch: {
    type: Boolean,
    default: false
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
  },
  thirdPlaceMatchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match'
  }
}, {
  timestamps: true
});

const Match = mongoose.model('Match', matchSchema);

export default Match;
