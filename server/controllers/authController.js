import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, username, email, role, roll_no, department, year, secretCode } = req.body;

  // Validate secret code for privileged roles
  const trimmedSecret = secretCode ? secretCode.trim() : '';
  if (role === 'admin' && trimmedSecret !== (process.env.ADMIN_SECRET || 'admin123')) {
    return res.status(400).json({ message: 'Invalid Admin Secret Code' });
  }
  if (role === 'faculty' && trimmedSecret !== (process.env.FACULTY_SECRET || 'faculty123')) {
    return res.status(400).json({ message: 'Invalid Faculty Secret Code' });
  }
  if (role === 'president' && trimmedSecret !== (process.env.PRESIDENT_SECRET || 'president123')) {
    return res.status(400).json({ message: 'Invalid President Secret Code' });
  }

  try {
    const userExists = await User.findOne({ $or: [{ email }, { username }] });

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
      username,
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
      res.status(400).json({ message: 'Invalid user data. Please check all required fields.' });
    }
  } catch (error) {
    console.error('Registration Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
  const { email, identifier, roll_no, password, secretCode, role } = req.body;
  const loginInput = (roll_no || identifier || email || '').trim();

  try {
    const user = await User.findOne({ 
      $or: [
        { email: new RegExp('^' + loginInput + '$', 'i') }, 
        { username: new RegExp('^' + loginInput + '$', 'i') },
        { roll_no: loginInput },
        { roll_no: new RegExp('^' + loginInput + '$', 'i') }
      ] 
    }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials. Please check your Roll Number, Email, or Password.' });
    }

    // Determine authentication based on role
    let isAuthenticated = false;
    
    if (['admin', 'faculty', 'president'].includes(role)) {
      // Use Secret Code for privileged roles
      const trimmedSecret = secretCode ? secretCode.trim() : '';
      console.log('Login attempt for role:', role, '| Secret Code entered:', trimmedSecret);
      
      if (role === 'admin' && trimmedSecret === (process.env.ADMIN_SECRET || 'admin123')) {
        isAuthenticated = true;
      } else if (role === 'faculty' && trimmedSecret === (process.env.FACULTY_SECRET || 'faculty123')) {
        isAuthenticated = true;
      } else if (role === 'president' && trimmedSecret === (process.env.PRESIDENT_SECRET || 'president123')) {
        isAuthenticated = true;
      } else {
        return res.status(401).json({ message: `Invalid ${role} Secret Code` });
      }
    } else {
      // Use normal password for students/others
      isAuthenticated = await user.matchPassword(password);
    }

    if (isAuthenticated) {
      // Validate role if provided by the frontend
      if (role && user.role !== role) {
        return res.status(401).json({ message: `Account found, but you are not registered as a ${role}. Please select the correct tab.` });
      }

      // Check if user is blocked
      if (user.isBlocked) {
        return res.status(403).json({ message: 'Account blocked by administrator' });
      }

      // Check if email is verified (skip for privileged roles using secret code)
      if (!user.isVerified && !['admin', 'faculty', 'president'].includes(role)) {
        return res.status(401).json({ message: 'Please verify your email before logging in' });
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
      let stats = {};
      if (user.role === 'student') {
        const Membership = (await import('../models/Membership.js')).default;
        const Team = (await import('../models/Team.js')).default;
        
        const clubsJoined = await Membership.countDocuments({ studentId: user._id, status: 'Approved' });
        const gamesPlayed = await Team.countDocuments({ students: user._id });
        
        stats = {
          clubsJoined,
          gamesPlayed,
          department: user.department,
          year: user.year,
          roll_no: user.roll_no
        };
      } else if (user.role === 'admin') {
        const Club = (await import('../models/Club.js')).default;
        const UserMod = (await import('../models/User.js')).default;
        const Event = (await import('../models/Event.js')).default;
        
        const totalClubs = await Club.countDocuments({});
        const totalUsers = await UserMod.countDocuments({});
        const totalEvents = await Event.countDocuments({});
        const pendingEvents = await Event.countDocuments({ approvalStatus: 'pending' });

        stats = {
          totalClubs,
          totalUsers,
          totalEvents,
          pendingEvents
        };
      } else if (user.role === 'faculty') {
        const Club = (await import('../models/Club.js')).default;
        const Event = (await import('../models/Event.js')).default;

        const advisedClubs = await Club.countDocuments({ facultyId: user._id });
        const pendingEvents = await Event.countDocuments({ approvalStatus: 'pending' });

        stats = {
          advisedClubs,
          pendingEvents
        };
      } else if (user.role === 'president') {
        const Club = (await import('../models/Club.js')).default;
        const Event = (await import('../models/Event.js')).default;

        const ledClubs = await Club.countDocuments({ presidentId: user._id });
        const userClubIds = await Club.find({ presidentId: user._id }).distinct('_id');
        const eventsCreated = await Event.countDocuments({ clubId: { $in: userClubIds } });

        stats = {
          ledClubs,
          eventsCreated
        };
      }

      res.json({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        ...stats
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
      $or: [{ email }, { username: email }],
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
      $or: [{ email }, { username: email }],
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

    generateToken(res, user._id);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture
    });
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
    const user = await User.findOne({ $or: [{ email }, { username: email }] });
    
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

// @desc    Forgot Password - send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ 
      $or: [
        { email: new RegExp('^' + normalizedEmail + '$', 'i') }, 
        { username: new RegExp('^' + normalizedEmail + '$', 'i') }
      ] 
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationToken = otp;
    user.verificationTokenExpire = Date.now() + 15 * 60 * 1000;
    await user.save();

    const message = `Hello ${user.name},\n\nYou have requested to reset your password. Please use the following One-Time Password (OTP) to reset it:\n\n${otp}\n\nThis OTP will expire in 15 minutes.`;

    await sendEmail({
      email: user.email,
      subject: 'Password Reset OTP - Club Management System',
      message,
    });

    res.json({ message: 'Password reset OTP sent to email' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset Password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({
      $or: [
        { email: new RegExp('^' + normalizedEmail + '$', 'i') }, 
        { username: new RegExp('^' + normalizedEmail + '$', 'i') }
      ],
      verificationToken: otp.trim(),
      verificationTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.password = password;
    user.verificationToken = undefined;
    user.verificationTokenExpire = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully. You can now log in.' });
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

// @desc    Upload profile picture
// @route   POST /api/auth/profile-pic
// @access  Private
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Set the profile picture URL to the relative path of the uploaded file
    const profilePicPath = `/uploads/${req.file.filename}`;
    user.profilePicture = profilePicPath;
    await user.save();

    res.json({
      message: 'Profile picture updated successfully',
      profilePicture: profilePicPath
    });
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
  forgotPassword,
  resetPassword,
  getAllUsers,
  uploadProfilePicture
};
