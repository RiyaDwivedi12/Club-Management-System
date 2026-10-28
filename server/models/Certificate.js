import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: false },
  title: { type: String },
  recipientName: { type: String },
  roll_no: { type: String, index: true },
  game: { type: String }, // e.g. "Badminton", "Cricket", "Football", "Chess"
  matchDetails: { type: String }, // e.g. "Final Match Won (21-18, 21-19)"
  achievement: { type: String, default: 'Winner' }, // e.g. "Winner", "Runner-Up", "Champion"
  teamName: { type: String },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  department: { type: String },
  year: { type: Number },
  type: { type: String, enum: ['winner', 'runner-up', 'third-place', 'participation'], default: 'winner' },
  issueDate: { type: Date, default: Date.now },
  pdfUrl: { type: String },
  verificationHash: { type: String, unique: true, required: true },
  status: { type: String, enum: ['pending', 'approved', 'issued'], default: 'approved' },
  issuedByRole: { type: String, default: 'admin' },
  issuedByName: { type: String, default: 'Authority' }
}, { timestamps: true });

export default mongoose.model('Certificate', certificateSchema);
