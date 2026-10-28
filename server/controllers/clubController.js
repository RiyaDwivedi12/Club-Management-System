import mongoose from 'mongoose';
import Club from '../models/Club.js';
import Membership from '../models/Membership.js';
import User from '../models/User.js';
import xlsx from 'xlsx';
import crypto from 'crypto';
import { createAndSendNotification, notifyClubMembers } from '../utils/notify.js';

// Helper to resolve faculty advisor by ObjectId, email, or name (auto-creating if freeform typed)
const resolveFacultyUser = async (val) => {
  if (!val || typeof val !== 'string') return null;
  const trimmed = val.trim();
  if (!trimmed) return null;

  // 1. If valid 24-char ObjectId
  if (mongoose.Types.ObjectId.isValid(trimmed)) {
    const existing = await User.findById(trimmed);
    if (existing) return existing;
  }

  // 2. Search by email or username or exact name (case-insensitive)
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let user = await User.findOne({
    $or: [
      { email: trimmed.toLowerCase() },
      { username: trimmed },
      { name: new RegExp('^' + escaped + '$', 'i') }
    ]
  });

  if (user) {
    if (user.role !== 'faculty' && user.role !== 'admin') {
      user.role = 'faculty';
      user.isVerified = true;
      await user.save();
    }
    return user;
  }

  // 3. Auto-create faculty account if typed freeform
  const isEmail = trimmed.includes('@');
  const facultyName = isEmail ? trimmed.split('@')[0].replace(/[._-]/g, ' ') : trimmed;
  const facultyEmail = isEmail ? trimmed.toLowerCase() : `faculty_${Date.now()}@campus.edu`;
  const facultyUsername = `faculty_${Date.now().toString(36)}`;

  user = await User.create({
    name: facultyName,
    username: facultyUsername,
    email: facultyEmail,
    password: 'admin123',
    role: 'faculty',
    isVerified: true,
    department: 'Faculty Advisor'
  });

  return user;
};

// @desc    Create a new club
// @route   POST /api/clubs
// @access  Private/Admin
const createClub = async (req, res) => {
  try {
    const { name, category, sportType, description, logo, presidentId, vicePresidentId, facultyId, gallery } = req.body;

    const clubExists = await Club.findOne({ name: name.trim() });
    if (clubExists) {
      return res.status(400).json({ message: 'Club with this name already exists' });
    }

    let finalFacultyId = null;
    if (facultyId) {
      const resolved = await resolveFacultyUser(facultyId);
      if (resolved) finalFacultyId = resolved._id;
    }

    const club = await Club.create({
      name: name.trim(),
      category: category || 'Sports',
      sportType: sportType || category || 'General',
      description,
      logo: logo || '',
      presidentId: presidentId || null,
      vicePresidentId: vicePresidentId || null,
      facultyId: finalFacultyId,
      gallery: gallery || [],
      members: [],
      pendingRequests: []
    });

    // Update user roles if necessary
    if (presidentId) {
      await User.findByIdAndUpdate(presidentId, { role: 'president', isVerified: true });
    }
    if (vicePresidentId) {
      await User.findByIdAndUpdate(vicePresidentId, { role: 'vice_president', isVerified: true });
    }

    const populatedClub = await Club.findById(club._id)
      .populate('presidentId', 'name email profilePicture')
      .populate('vicePresidentId', 'name email profilePicture')
      .populate('facultyId', 'name email profilePicture');

    res.status(201).json(populatedClub);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an existing club
// @route   PUT /api/clubs/:id
// @access  Private/Admin
const updateClub = async (req, res) => {
  try {
    const { name, category, sportType, description, logo, presidentId, vicePresidentId, facultyId } = req.body;
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    if (name) club.name = name.trim();
    if (category) club.category = category;
    if (sportType) club.sportType = sportType;
    if (description) club.description = description;
    if (logo !== undefined) club.logo = logo;
    if (presidentId !== undefined) club.presidentId = presidentId || null;
    if (vicePresidentId !== undefined) club.vicePresidentId = vicePresidentId || null;
    if (facultyId !== undefined) {
      if (facultyId) {
        const resolved = await resolveFacultyUser(facultyId);
        club.facultyId = resolved ? resolved._id : null;
      } else {
        club.facultyId = null;
      }
    }

    await club.save();

    if (presidentId) await User.findByIdAndUpdate(presidentId, { role: 'president', isVerified: true });
    if (vicePresidentId) await User.findByIdAndUpdate(vicePresidentId, { role: 'vice_president', isVerified: true });

    const updated = await Club.findById(club._id)
      .populate('presidentId', 'name email profilePicture')
      .populate('vicePresidentId', 'name email profilePicture')
      .populate('facultyId', 'name email profilePicture');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all clubs
// @route   GET /api/clubs
// @access  Public
const getClubs = async (req, res) => {
  try {
    const clubs = await Club.find({})
      .populate('presidentId', 'name email profilePicture')
      .populate('vicePresidentId', 'name email profilePicture')
      .populate('facultyId', 'name email profilePicture');
    res.json(clubs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get club by ID
// @route   GET /api/clubs/:id
// @access  Public
const getClubById = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate('presidentId', 'name email')
      .populate('facultyId', 'name email')
      .populate('members', 'name email profilePicture')
      .populate('pendingRequests', 'name email profilePicture');
      
    if (club) {
      res.json(club);
    } else {
      res.status(404).json({ message: 'Club not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Request to join a club
// @route   POST /api/clubs/:id/request-join
// @access  Private
const requestJoinClub = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    if (club.members.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already a member' });
    }

    if (club.pendingRequests.includes(req.user._id)) {
      return res.status(400).json({ message: 'Join request already pending' });
    }

    club.pendingRequests.push(req.user._id);
    await club.save();

    // Synchronize with Membership model
    await Membership.findOneAndUpdate(
      { studentId: req.user._id, clubId: club._id },
      { status: 'Pending' },
      { upsert: true, new: true }
    );

    // Notify club president about the join request
    const io = req.app.get('io');
    if (club.presidentId) {
      createAndSendNotification(io, {
        userId: club.presidentId,
        message: `📋 New join request for ${club.name} from ${req.user.name || 'a student'}.`,
        type: 'club_request',
        link: `/clubs/${club._id}`
      }).catch(console.error);
    }

    res.json({ message: 'Join request sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Leave a club
// @route   POST /api/clubs/:id/leave
// @access  Private
const leaveClub = async (req, res) => {
  try {
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    if (!club.members.includes(req.user._id)) {
      return res.status(400).json({ message: 'Not a member of this club' });
    }

    club.members = club.members.filter(
      (memberId) => memberId.toString() !== req.user._id.toString()
    );
    await club.save();

    // Also remove club from user's memberships
    const user = await req.user.model('User').findById(req.user._id);
    user.clubMemberships = user.clubMemberships.filter(
      (clubId) => clubId.toString() !== club._id.toString()
    );
    await user.save();

    // Synchronize with Membership model
    await Membership.findOneAndDelete({ studentId: req.user._id, clubId: club._id });

    res.json({ message: 'Successfully left the club' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Approve or reject a member request
// @route   PUT /api/clubs/:id/approve-member
// @access  Private (President/Faculty only)
const approveMember = async (req, res) => {
  try {
    const { userId, action } = req.body; // action: 'approve' or 'reject'
    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    // Check if user is authorized (President, Faculty, or Admin)
    if (
      club.presidentId.toString() !== req.user._id.toString() &&
      club.facultyId.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to manage members' });
    }

    if (!club.pendingRequests.includes(userId)) {
      return res.status(400).json({ message: 'User has not requested to join' });
    }

    // Remove from pending requests
    club.pendingRequests = club.pendingRequests.filter(
      (id) => id.toString() !== userId.toString()
    );

    if (action === 'approve') {
      club.members.push(userId);
      // Add to user's clubMemberships
      const userToApprove = await req.user.model('User').findById(userId);
      if (userToApprove && !userToApprove.clubMemberships.includes(club._id)) {
          userToApprove.clubMemberships.push(club._id);
          await userToApprove.save();
      }

      // Synchronize with Membership model
      await Membership.findOneAndUpdate(
        { studentId: userId, clubId: club._id },
        { status: 'Approved' },
        { upsert: true, new: true }
      );
    } else {
      // Synchronize rejection with Membership model
      await Membership.findOneAndUpdate(
        { studentId: userId, clubId: club._id },
        { status: 'Rejected' },
        { upsert: true, new: true }
      );
    }

    await club.save();

    // Notify the student about the decision
    const io = req.app.get('io');
    if (action === 'approve') {
      createAndSendNotification(io, {
        userId,
        message: `🎉 Great news! Your request to join ${club.name} has been approved. Welcome to the club!`,
        type: 'club_approval',
        link: `/clubs/${club._id}`
      }).catch(console.error);
    } else {
      createAndSendNotification(io, {
        userId,
        message: `ℹ️ Your membership request for ${club.name} was not accepted at this time.`,
        type: 'club_update',
        link: `/clubs`
      }).catch(console.error);
    }

    res.json({ message: `Request ${action}d successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get clubs for a president / vice president / admin
// @route   GET /api/clubs/president
// @access  Private/President/VicePresident/Admin
const getPresidentClubs = async (req, res) => {
  try {
    let query = { presidentId: req.user._id };
    if (req.user.role === 'admin') {
      query = {}; // Admin can inspect all clubs
    } else if (req.user.role === 'vice_president') {
      query = { $or: [{ vicePresidentId: req.user._id }, { presidentId: req.user._id }] };
    }
    const clubs = await Club.find(query)
      .populate('presidentId', 'name email profilePicture')
      .populate('vicePresidentId', 'name email profilePicture')
      .populate('facultyId', 'name email profilePicture')
      .populate('members', 'name email profilePicture roll_no department')
      .populate('pendingRequests', 'name email profilePicture roll_no department');
    res.json(clubs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get clubs for a faculty coordinator / admin
// @route   GET /api/clubs/coordinator
// @access  Private/Faculty/Admin
const getCoordinatorClubs = async (req, res) => {
  try {
    const query = req.user.role === 'admin' ? {} : { facultyId: req.user._id };
    const clubs = await Club.find(query)
      .populate('presidentId', 'name email profilePicture')
      .populate('vicePresidentId', 'name email profilePicture')
      .populate('facultyId', 'name email profilePicture')
      .populate('members', 'name email profilePicture roll_no department')
      .populate('pendingRequests', 'name email profilePicture roll_no department');
    res.json(clubs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update recruitment phase for clubs
// @route   PUT /api/clubs/recruitment
// @access  Private (Admin)
const updateRecruitmentPhase = async (req, res) => {
  try {
    const { clubIds, joinFee, isAcceptingMembers } = req.body;
    
    if (!clubIds || !Array.isArray(clubIds) || clubIds.length === 0) {
      return res.status(400).json({ message: 'Please select at least one club' });
    }

    await Club.updateMany(
      { _id: { $in: clubIds } },
      { $set: { isAcceptingMembers, joinFee: joinFee || 500 } }
    );
    
    res.json({ message: `Recruitment phase updated for ${clubIds.length} clubs` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a photo URL to club gallery
// @route   POST /api/clubs/:id/gallery
// @access  Private (President/Faculty/Admin)
const addGalleryPhoto = async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ message: 'Image URL is required' });
    }

    const club = await Club.findById(req.params.id);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    const userIdStr = req.user._id.toString();
    const isLeadership = (club.presidentId && club.presidentId.toString() === userIdStr) ||
                         (club.facultyId && club.facultyId.toString() === userIdStr) ||
                         req.user.role === 'admin';

    if (!isLeadership) {
      return res.status(403).json({ message: 'Not authorized to update gallery' });
    }

    club.gallery.push(imageUrl);
    await club.save();

    res.json({ message: 'Photo added to gallery successfully', gallery: club.gallery });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload clubs from Excel / CSV
// @route   POST /api/clubs/upload
// @access  Private (Admin)
const uploadClubsExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an Excel or CSV file' });
    }

    const workbook = req.file.buffer 
      ? xlsx.read(req.file.buffer, { type: 'buffer' })
      : xlsx.readFile(req.file.path);

    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    if (!data || data.length === 0) {
      return res.status(400).json({ message: 'The uploaded spreadsheet is empty' });
    }

    const helperFindOrCreate = async (name, email, role, defaultPwd) => {
      if (!email && !name) return null;
      const cleanEmail = email ? email.trim().toLowerCase() : `${name.trim().toLowerCase().replace(/\s+/g, '')}@campus.edu`;
      let user = await User.findOne({ email: cleanEmail });
      if (!user) {
        user = await User.create({
          name: name || (role === 'faculty' ? 'Teacher Coordinator' : role === 'president' ? 'Club President' : 'Vice President'),
          username: cleanEmail.split('@')[0] + '_' + Math.floor(100 + Math.random() * 900),
          email: cleanEmail,
          password: defaultPwd || 'admin123',
          role: role,
          isVerified: true
        });
      } else {
        user.role = role;
        user.isVerified = true;
        await user.save();
      }
      return user;
    };

    const processedClubs = [];

    for (const row of data) {
      const clubName = row['Club Name'] || row['Club'] || row['Name'];
      if (!clubName) continue;

      const category = row['Category'] || 'Sports';
      const sportType = row['Sport'] || row['Sport Type'] || category || 'General';
      const description = row['Description'] || `Official ${clubName} at campus organizing inter-class competitions and tournaments.`;

      // Coordinator
      const coordName = row['Teacher Coordinator'] || row['Coordinator Name'] || row['Faculty Advisor'] || row['Teacher'];
      const coordEmail = row['Teacher Coordinator Email'] || row['Coordinator Email'] || row['Faculty Email'];
      const coordinator = await helperFindOrCreate(coordName, coordEmail, 'faculty', 'faculty123');

      // President
      const presName = row['President Name'] || row['President'];
      const presEmail = row['President Email'];
      const president = await helperFindOrCreate(presName, presEmail, 'president', 'president123');

      // Vice President
      const vpName = row['Vice President Name'] || row['Vice President'] || row['VP Name'];
      const vpEmail = row['Vice President Email'] || row['VP Email'];
      const vicePresident = await helperFindOrCreate(vpName, vpEmail, 'vice_president', 'vp123');

      let club = await Club.findOne({ name: clubName.trim() });
      if (!club) {
        club = await Club.create({
          name: clubName.trim(),
          category,
          sportType,
          description,
          presidentId: president ? president._id : req.user._id,
          vicePresidentId: vicePresident ? vicePresident._id : null,
          facultyId: coordinator ? coordinator._id : req.user._id,
          members: [],
          pendingRequests: []
        });
      } else {
        club.category = category;
        club.sportType = sportType;
        club.description = description;
        if (president) club.presidentId = president._id;
        if (vicePresident) club.vicePresidentId = vicePresident._id;
        if (coordinator) club.facultyId = coordinator._id;
        await club.save();
      }

      processedClubs.push(club);
    }

    const allClubs = await Club.find({})
      .populate('presidentId', 'name email profilePicture')
      .populate('vicePresidentId', 'name email profilePicture')
      .populate('facultyId', 'name email profilePicture');

    res.status(200).json({
      message: `Successfully processed ${processedClubs.length} clubs from spreadsheet`,
      count: processedClubs.length,
      clubs: allClubs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Download clubs template Excel
// @route   GET /api/clubs/template
// @access  Public
const downloadClubTemplate = async (req, res) => {
  try {
    const templateData = [
      {
        'Club Name': 'Cricket Club',
        'Category': 'Sports',
        'Sport': 'Cricket',
        'Teacher Coordinator': 'Dr. Sharma',
        'Teacher Coordinator Email': 'sharma.cricket@campus.edu',
        'President Name': 'Rahul Verma',
        'President Email': 'rahul.cricket@campus.edu',
        'Vice President Name': 'Priya Singh',
        'Vice President Email': 'priya.cricket@campus.edu',
        'Description': 'Official Cricket Club organizing inter-class T20 & knockout tournaments.'
      },
      {
        'Club Name': 'Soccer Club',
        'Category': 'Sports',
        'Sport': 'Soccer',
        'Teacher Coordinator': 'Prof. Alex Miller',
        'Teacher Coordinator Email': 'alex.soccer@campus.edu',
        'President Name': 'Aryan Kumar',
        'President Email': 'aryan.soccer@campus.edu',
        'Vice President Name': 'Sneha Patel',
        'Vice President Email': 'sneha.soccer@campus.edu',
        'Description': 'Campus Football / Soccer Club managing league fixtures across college wings.'
      },
      {
        'Club Name': 'Basketball Club',
        'Category': 'Sports',
        'Sport': 'Basketball',
        'Teacher Coordinator': 'Dr. Mehta',
        'Teacher Coordinator Email': 'mehta.bb@campus.edu',
        'President Name': 'Rohit Das',
        'President Email': 'rohit.bb@campus.edu',
        'Vice President Name': 'Ananya Roy',
        'Vice President Email': 'ananya.bb@campus.edu',
        'Description': 'Basketball Club hosting full-court and 3x3 inter-class championships.'
      },
      {
        'Club Name': 'Volleyball Club',
        'Category': 'Sports',
        'Sport': 'Volleyball',
        'Teacher Coordinator': 'Dr. Vikram Joshi',
        'Teacher Coordinator Email': 'vikram.vb@campus.edu',
        'President Name': 'Aman Gupta',
        'President Email': 'aman.vb@campus.edu',
        'Vice President Name': 'Kavya Nair',
        'Vice President Email': 'kavya.vb@campus.edu',
        'Description': 'Volleyball Club organizing smash tournaments between department classes.'
      }
    ];

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(templateData);
    xlsx.utils.book_append_sheet(wb, ws, 'Clubs_Directory');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="clubs_import_template.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { 
  createClub, 
  updateClub,
  getClubs, 
  getClubById, 
  requestJoinClub, 
  leaveClub, 
  approveMember, 
  getPresidentClubs, 
  getCoordinatorClubs, 
  updateRecruitmentPhase,
  addGalleryPhoto,
  uploadClubsExcel,
  downloadClubTemplate
};
