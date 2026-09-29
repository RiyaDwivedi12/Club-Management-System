import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  type: { type: String, enum: ['winner', 'runner-up', 'third-place', 'participation'], required: true },
  issueDate: { type: Date, default: Date.now },
  pdfUrl: { type: String },
  verificationHash: { type: String, unique: true, required: true }
}, { timestamps: true });

export default mongoose.model('Certificate', certificateSchema);
