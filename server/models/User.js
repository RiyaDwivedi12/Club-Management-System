import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  username: {
    type: String,
    required: [true, 'Please add a username'],
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 4,
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'president', 'vice_president', 'faculty', 'referee', 'admin'],
    default: 'student'
  },
  profilePicture: {
    type: String,
    default: 'default.jpg' // In production, this will be a Cloudinary URL
  },
  isReferee: {
    type: Boolean,
    default: false
  },
  roll_no: {
    type: String,
    required: function() { return this.role === 'student' && !this.isReferee; }
  },
  course: {
    type: String, // e.g. B.Tech, BCA, MCA, M.Tech, MBA, B.Sc
    default: 'B.Tech'
  },
  section: {
    type: String, // e.g. A, B, C, D
    default: 'A'
  },
  department: {
    type: String,
    required: function() { return this.role === 'student' && !this.isReferee; }
  },
  year: {
    type: Number,
    required: function() { return this.role === 'student' && !this.isReferee; }
  },
  className: {
    type: String,
    trim: true
  },
  classId: {
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
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
