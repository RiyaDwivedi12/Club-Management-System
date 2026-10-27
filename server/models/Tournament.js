import mongoose from 'mongoose';

const tournamentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  clubId: { type: mongoose.Schema.Types.ObjectId, ref: 'Club' },
  gameId: { type: mongoose.Schema.Types.ObjectId, ref: 'Game' },
  sport: { type: String, default: 'Sports' },
  wing: { type: String, enum: ['Junior', 'Senior', 'General'], default: 'General' },
  sections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  classesCount: { type: Number, default: 0 },
  status: { type: String, enum: ['upcoming', 'ongoing', 'completed'], default: 'ongoing' },
  rounds: { type: Number, required: true },
  coordinatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  coordinatorName: { type: String, default: '' },
  results: {
    firstPlace: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    secondPlace: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    thirdPlace: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    firstPlaceName: { type: String, default: '' },
    secondPlaceName: { type: String, default: '' },
    thirdPlaceName: { type: String, default: '' },
  }
}, { timestamps: true });

export default mongoose.model('Tournament', tournamentSchema);
