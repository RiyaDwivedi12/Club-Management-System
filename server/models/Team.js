import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  classOrYear: { type: String, required: true },
  wing: { type: String, enum: ['Junior', 'Senior'], required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
}, { timestamps: true });

export default mongoose.model('Team', teamSchema);
