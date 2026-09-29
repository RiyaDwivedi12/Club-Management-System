import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['team-based', 'individual'], required: true },
  description: { type: String },
}, { timestamps: true });

export default mongoose.model('Game', gameSchema);
