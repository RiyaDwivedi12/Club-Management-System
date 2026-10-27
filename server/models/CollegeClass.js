import mongoose from 'mongoose';

const collegeClassSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a class name'],
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Please specify the department'],
    trim: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  course: {
    type: String,
    required: true,
    default: 'B.Tech',
    trim: true
  },
  year: {
    type: Number,
    required: true,
    default: 1
  },
  section: {
    type: String,
    required: true,
    default: 'A',
    trim: true,
    uppercase: true
  },
  standardFee: {
    type: Number,
    required: true,
    default: 500
  },
  academicYear: {
    type: String,
    default: '2025-2026',
    trim: true
  },
  batchYear: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Index to prevent duplicate class definition within same department
collegeClassSchema.index({ department: 1, name: 1 }, { unique: true });

const CollegeClass = mongoose.model('CollegeClass', collegeClassSchema);

export default CollegeClass;
