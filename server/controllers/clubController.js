import Club from '../models/Club.js';
import Membership from '../models/Membership.js';

// @desc    Create a new club
// @route   POST /api/clubs
// @access  Private/Admin
const createClub = async (req, res) => {
  try {
    const { name, category, description, logo, presidentId, facultyId, gallery } = req.body;

    const clubExists = await Club.findOne({ name });
    if (clubExists) {
      return res.status(400).json({ message: 'Club with this name already exists' });
    }

    const club = await Club.create({
      name,
      category,
      description,
      logo,
      presidentId,
      facultyId,
      gallery: gallery || [],
      members: [],
      pendingRequests: []
    });

    res.status(201).json(club);
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
      .populate('presidentId', 'name email')
      .populate('facultyId', 'name email');
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
    res.json({ message: `Request ${action}d successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get clubs for a president
// @route   GET /api/clubs/president
// @access  Private/President
const getPresidentClubs = async (req, res) => {
  try {
    const clubs = await Club.find({ presidentId: req.user._id })
      .populate('members', 'name email profilePicture roll_no department')
      .populate('pendingRequests', 'name email profilePicture roll_no department');
    res.json(clubs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get clubs for a faculty coordinator
// @route   GET /api/clubs/coordinator
// @access  Private/Faculty
const getCoordinatorClubs = async (req, res) => {
  try {
    const clubs = await Club.find({ facultyId: req.user._id })
      .populate('presidentId', 'name email')
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

export { 
  createClub, 
  getClubs, 
  getClubById, 
  requestJoinClub, 
  leaveClub, 
  approveMember, 
  getPresidentClubs, 
  getCoordinatorClubs, 
  updateRecruitmentPhase,
  addGalleryPhoto 
};
