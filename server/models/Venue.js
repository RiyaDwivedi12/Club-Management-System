import mongoose from 'mongoose';

const venueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['Auditorium', 'Classroom', 'Lab', 'Sports Ground', 'Conference Hall', 'Equipment'],
    default: 'Auditorium'
  },
  capacity: {
    type: Number,
    default: 50
  },
  location: {
    type: String,
    required: true
  },
  isRestricted: {
    type: Boolean,
    default: false // if true, requires admin/faculty approval
  },
  features: [{
    type: String
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const Venue = mongoose.model('Venue', venueSchema);

export default Venue;
