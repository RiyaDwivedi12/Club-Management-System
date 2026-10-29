import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: false },
  title: { type: String, default: 'Inter-College Sports Championship' },
  recipientName: { type: String, required: true },
  roll_no: { type: String, index: true },
  className: { type: String, default: '' }, // e.g. "B.Tech CSE 3rd Year", "BCA 2nd Year - Sec A"
  game: { type: String, default: 'General Sports' }, // e.g. "Badminton", "Cricket", "Football", "Chess"
  position: { type: String, default: '1st Position' }, // "1st Position", "2nd Position", "3rd Position", "Participation"
  rank: { type: Number, default: 1 }, // 1, 2, 3
  matchDetails: { type: String }, // e.g. "Final Match Won (21-18, 21-19)"
  achievement: { type: String, default: '1st Position Winner' }, // e.g. "1st Position — Gold Trophy", "2nd Position — Runner-Up"
  teamName: { type: String },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  department: { type: String },
  year: { type: Number },
  type: { type: String, enum: ['winner', 'runner-up', 'third-place', 'participation'], default: 'winner' },
  issueDate: { type: Date, default: Date.now },
  pdfUrl: { type: String },
  verificationHash: { type: String, unique: true, required: true },
  status: { type: String, enum: ['pending', 'approved', 'issued'], default: 'issued' },
  issuedByRole: { type: String, default: 'admin' },
  issuedByName: { type: String, default: 'Authority' }
}, { timestamps: true });

export default mongoose.model('Certificate', certificateSchema);
