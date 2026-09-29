import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game', required: true },
  wing: { type: String, enum: ['Junior', 'Senior'], required: true },
  sections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'ongoing' },
  rounds: { type: Number, required: true },
  results: {
    firstPlace: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    secondPlace: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    thirdPlace: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  }
}, { timestamps: true });

export default mongoose.model('Tournament', tournamentSchema);
