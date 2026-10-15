import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['event', 'match', 'volunteering', 'meeting'],
    default: 'event'
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  },
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  roll_no: {
    type: String
  },
  ticketCode: {
    type: String,
    unique: true,
    required: true
  },
  status: {
    type: String,
    enum: ['Registered', 'Attended', 'Absent'],
    default: 'Registered'
  },
  checkedInAt: {
    type: Date
  },
  checkedInBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  certificateIssued: {
    type: Boolean,
    default: false
  },
  certificateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate'
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

attendanceSchema.index({ eventId: 1, userId: 1 }, { unique: true, partialFilterExpression: { eventId: { $exists: true } } });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
