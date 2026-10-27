import mongoose from 'mongoose';

const offlinePaymentDocSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    default: 0
  },
  mimeType: {
    type: String,
    default: 'application/pdf'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadedByName: {
    type: String,
    default: 'Admin'
  },
  department: {
    type: String,
    default: 'All'
  },
  classId: {
    type: String,
    default: ''
  },
  notes: {
    type: String,
    default: ''
  },
  verifiedCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const OfflinePaymentDoc = mongoose.model('OfflinePaymentDoc', offlinePaymentDocSchema);

export default OfflinePaymentDoc;
