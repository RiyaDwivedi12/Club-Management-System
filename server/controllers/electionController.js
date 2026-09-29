import Election from '../models/Election.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

// Helper to create and emit a notification (if io was passed to req, but for now we'll just save to DB)
const createNotification = async (userId, message, type, link) => {
  await Notification.create({ user: userId, message, type, link });
  // In a full implementation, we would also: req.app.get('io').to(userId.toString()).emit('notification', newNotification);
};

// @desc    Create an election
// @route   POST /api/elections
// @access  Private (Admin/Faculty)
const createElection = async (req, res) => {
  try {
    const { title, clubId, startDate, endDate } = req.body;

    const election = await Election.create({
      title,
      clubId,
      startDate,
      endDate,
      candidates: []
    });

    res.status(201).json(election);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a candidate to an election
// @route   POST /api/elections/:id/candidates
// @access  Private (Admin/Faculty)
const addCandidate = async (req, res) => {
  try {
    const { candidateId, manifesto } = req.body;
    const election = await Election.findById(req.params.id);

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Check if user exists
    const user = await User.findById(candidateId);
    if (!user) {
        return res.status(404).json({ message: 'Candidate user not found' });
    }

    // Check if already a candidate
    if (election.candidates.some(c => c.candidateId.toString() === candidateId)) {
        return res.status(400).json({ message: 'User is already a candidate in this election' });
    }

    election.candidates.push({ candidateId, manifesto, votes: 0 });
    await election.save();

    // Notify the candidate
    await createNotification(candidateId, `You have been added as a candidate for: ${election.title}`, 'election', '/elections');

    res.json(election);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all elections
// @route   GET /api/elections
// @access  Public
const getElections = async (req, res) => {
  try {
    const elections = await Election.find({})
        .populate('clubId', 'name logo')
        .populate('candidates.candidateId', 'name profilePicture');
    res.json(elections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Vote in an election
// @route   POST /api/elections/:id/vote
// @access  Private
const vote = async (req, res) => {
  try {
    const { candidateId } = req.body;
    const election = await Election.findById(req.params.id);

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const now = new Date();
    if (now < new Date(election.startDate)) {
        return res.status(400).json({ message: 'Election has not started yet' });
    }
    if (now > new Date(election.endDate)) {
        return res.status(400).json({ message: 'Election has ended' });
    }

    // Check if user already voted
    if (election.votedUsers.includes(req.user._id)) {
        return res.status(400).json({ message: 'You have already voted in this election' });
    }

    // Find candidate and increment vote
    const candidate = election.candidates.find(c => c.candidateId.toString() === candidateId);
    if (!candidate) {
        return res.status(404).json({ message: 'Candidate not found in this election' });
    }

    candidate.votes += 1;
    election.votedUsers.push(req.user._id);

    await election.save();

    const io = req.app.get('io');
    if (io) {
      io.emit('voteUpdate', { electionId: election._id, candidateId, newVotes: candidate.votes });
    }

    res.json({ message: 'Vote cast successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { createElection, addCandidate, getElections, vote };
