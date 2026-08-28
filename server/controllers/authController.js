import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, role, roll_no, department, year } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationTokenExpire = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Generate a secure dummy password for pending state
    const dummyPassword = crypto.randomBytes(16).toString('hex');

    const user = await User.create({
      name,
      email,
      password: dummyPassword,
      role: role || 'student',
      roll_no,
      department,
      year,
      verificationToken: otp,
      verificationTokenExpire,
    });

    if (user) {
      // Send email with the OTP
      const message = `Hello ${name},\n\nYour account for the Club Management System has been created.\n\nPlease verify your email by using the following One-Time Password (OTP):\n\n${otp}\n\nThis OTP will expire in 15 minutes.`;
      
      try {
        await sendEmail({
          email: user.email,
          subject: 'Your Club Management System Account Credentials',
          message,
        });
      } catch (err) {
        console.error('Email failed to send, but user was created.');
      }

      // We do not send a token here because we want them to verify their email first
      res.status(201).json({
        message: 'Registration successful. Check your email to verify your account.',
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      // Check if user is blocked
      if (user.isBlocked) {
        return res.status(403).json({ message: 'Account blocked by administrator' });
      }

      // Check if user is verified
      if (!user.isVerified) {
        return res.status(401).json({ message: 'Please verify your email address to log in' });
      }

      generateToken(res, user._id);
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Public
const logoutUser = (req, res) => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    const user = await User.findOne({
      email,
      verificationToken: otp,
      verificationTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.json({ valid: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Set password after verification
// @route   POST /api/auth/setup-password
// @access  Public
const setupPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    
    const user = await User.findOne({
      email,
      verificationToken: otp,
      verificationTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.password = password;
    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    res.json({ message: 'Password set successfully. You can now log in.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.isVerified) {
      return res.status(400).json({ message: 'User is already verified' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationToken = otp;
    user.verificationTokenExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    const message = `Hello ${user.name},\n\nPlease verify your email by using the following One-Time Password (OTP):\n\n${otp}\n\nThis OTP will expire in 15 minutes.`;

    await sendEmail({
      email: user.email,
      subject: 'Verify your Club Management System Account',
      message,
    });

    res.json({ message: 'Verification email sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  registerUser,
  authUser,
  logoutUser,
  getUserProfile,
  verifyOTP,
  setupPassword,
  resendVerification,
  getAllUsers
};
