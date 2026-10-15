import Election from '../models/Election.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

// Helper to create and emit a notification
const createNotification = async (userId, message, type, link) => {
  await Notification.create({ user: userId, message, type, link });
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

    await AuditLog.create({
      action: 'ELECTION_CREATED',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      targetType: 'Election',
      targetId: election._id,
      details: { title, clubId, startDate, endDate },
      status: 'SUCCESS'
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

    const user = await User.findById(candidateId);
    if (!user) {
      return res.status(404).json({ message: 'Candidate user not found' });
    }

    if (election.candidates.some(c => c.candidateId.toString() === candidateId)) {
      return res.status(400).json({ message: 'User is already a candidate in this election' });
    }

    election.candidates.push({ candidateId, manifesto, votes: 0 });
    await election.save();

    await createNotification(candidateId, `You have been added as a candidate for: ${election.title}`, 'election', '/elections');

    res.json(election);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all elections (masks interim results for secret ballot privacy while active)
// @route   GET /api/elections
// @access  Public
const getElections = async (req, res) => {
  try {
    const elections = await Election.find({})
      .populate('clubId', 'name logo')
      .populate('candidates.candidateId', 'name profilePicture department');

    const now = new Date();
    const sanitizedElections = elections.map(e => {
      const isConcluded = now > new Date(e.endDate);
      const electionObj = e.toObject();

      // If election is currently ongoing, hide individual candidate vote counts to keep ballots secret!
      if (!isConcluded) {
        electionObj.isSecretPhase = true;
        electionObj.candidates = electionObj.candidates.map(c => ({
          ...c,
          votes: null // Hidden during active voting
        }));
      } else {
        electionObj.isSecretPhase = false;
      }
      return electionObj;
    });

    res.json(sanitizedElections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Vote in an election (secret ballot enforced)
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
      return res.status(400).json({ message: 'Election has ended. Ballots are closed.' });
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

    // Broadcast only overall turnout update to preserve secret ballot
    const io = req.app.get('io');
    if (io) {
      io.emit('electionTurnoutUpdate', { 
        electionId: election._id, 
        totalTurnout: election.votedUsers.length 
      });
    }

    // Audit log (keeps the voter's choice confidential)
    await AuditLog.create({
      action: 'BALLOT_CAST',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      targetType: 'Election',
      targetId: election._id,
      details: { electionTitle: election.title, ballotTimestamp: new Date() },
      status: 'SUCCESS'
    });

    res.json({ message: 'Secret ballot recorded successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { createElection, addCandidate, getElections, vote };

