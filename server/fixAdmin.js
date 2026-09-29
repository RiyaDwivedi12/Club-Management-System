import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

// Define User Schema inline for the script to avoid import issues
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'student' },
  isVerified: { type: Boolean, default: false }
}, { strict: false });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);

const fixAdmin = async () => {
  try {
    dotenv.config();
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/club-management');
    console.log('Connected to DB');

    const email = 'dwivediriya185@gmail.com';
    let user = await User.findOne({ email });

    if (!user) {
      console.log('User not found, creating a new admin...');
      user = new User({
        name: 'Admin Riya',
        username: 'riya_admin',
        email: email,
        role: 'admin',
        isVerified: true
      });
    } else {
      console.log('User found, updating to admin...');
      user.role = 'admin';
      user.isVerified = true;
      if (!user.username) {
        user.username = 'riya_admin_' + Math.floor(Math.random() * 1000);
      }
    }

    user.password = 'admin123';
    await user.save();
    
    console.log('Success! Admin account is ready.');
    console.log('Email:', email);
    console.log('Username:', user.username);
    console.log('Password (for student tab): admin123');
    console.log('Secret Code (for admin tab): admin123');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing admin:', error);
    process.exit(1);
  }
};

fixAdmin();
