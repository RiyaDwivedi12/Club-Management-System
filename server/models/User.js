import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'president', 'vice_president', 'faculty', 'referee', 'admin'],
    default: 'student'
  },
  isReferee: {
    type: Boolean,
    default: false
  },
  refereeSport: {
    type: String,
    default: 'General'
  },
  refereeExpiresAt: {
    type: Date,
    default: null
  },
  roll_no: {
    type: String,
    sparse: true
  },
  department: {
    type: String
  },
  year: {
    type: Number,
    default: 1
  },
  course: {
    type: String,
    default: 'B.Tech'
  },
  section: {
    type: String,
    default: 'A'
  },
  profilePicture: {
    type: String,
    default: ''
  },
  collegeClass: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CollegeClass'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  clubMemberships: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club'
  }],
  paymentStatus: {
    type: Boolean,
    default: false
  },
  refreshToken: String,
  verificationToken: String,
  verificationTokenExpire: Date
}, {
  timestamps: true
});

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  if (this.password === enteredPassword) return true;
  try {
    return await bcrypt.compare(enteredPassword, this.password);
  } catch (err) {
    return false;
  }
};

const User = mongoose.model('User', userSchema);

export default User;
