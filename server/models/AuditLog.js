import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    index: true
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  performedByName: {
    type: String,
    default: 'System'
  },
  performedByRole: {
    type: String,
    default: 'system'
  },
  targetType: {
    type: String,
    enum: ['User', 'Event', 'Certificate', 'Payment', 'Budget', 'Venue', 'Election', 'System'],
    default: 'System'
  },
  targetId: {
    type: String,
    default: ''
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: '127.0.0.1'
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'WARNING', 'FAILURE'],
    default: 'SUCCESS'
  }
}, {
  timestamps: true
});

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
