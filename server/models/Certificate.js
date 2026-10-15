import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: false },
  title: { type: String },
  teamName: { type: String },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  roll_no: { type: String },
  department: { type: String },
  year: { type: Number },
  type: { type: String, enum: ['winner', 'runner-up', 'third-place', 'participation'], required: true },
  issueDate: { type: Date, default: Date.now },
  pdfUrl: { type: String },
  verificationHash: { type: String, unique: true, required: true },
  issuedByRole: { type: String, default: 'admin' },
  issuedByName: { type: String, default: 'Authority' }
}, { timestamps: true });

export default mongoose.model('Certificate', certificateSchema);
