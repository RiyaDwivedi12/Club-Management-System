import Club from '../models/Club.js';

// @desc    Create a new club
// @route   POST /api/clubs
// @access  Private/Admin
const createClub = async (req, res) => {
  try {
    const { name, description, logo, presidentId, facultyId, gallery } = req.body;

    const clubExists = await Club.findOne({ name });
    if (clubExists) {
      return res.status(400).json({ message: 'Club with this name already exists' });
    }

    const club = await Club.create({
      name,
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
      .populate('members', 'name email profilePicture');
      
    if (club) {
      res.json(club);
    } else {
      res.status(404).json({ message: 'Club not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { createClub, getClubs, getClubById };
