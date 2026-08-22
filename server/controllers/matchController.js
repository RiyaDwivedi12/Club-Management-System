import Match from '../models/Match.js';
import User from '../models/User.js';
import crypto from 'crypto';

// @desc    Create a new match
// @route   POST /api/matches
// @access  Private (Faculty/Admin)
const createMatch = async (req, res) => {
  try {
    const { tournamentId, teamA, teamB, date, refereeEmail } = req.body;

    // Find referee by email or create a temporary one if it doesn't exist
    let referee = await User.findOne({ email: refereeEmail });
    
    if (!referee) {
      // Create a temporary referee account
      const tempPassword = crypto.randomBytes(8).toString('hex');
      referee = await User.create({
        name: `Referee for ${teamA} vs ${teamB}`,
        email: refereeEmail,
        password: tempPassword,
        role: 'referee',
        isVerified: true
      });
      // In a real app, email the tempPassword to the referee
      console.log(`Temporary Referee Password for ${refereeEmail}: ${tempPassword}`);
    } else if (referee.role !== 'referee') {
      return res.status(400).json({ message: 'User with this email is not a referee.' });
    }

    const match = await Match.create({
      tournamentId,
      teamA,
      teamB,
      refereeId: referee._id,
      date
    });

    res.status(201).json(match);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all matches
// @route   GET /api/matches
// @access  Public
const getMatches = async (req, res) => {
  try {
    const matches = await Match.find({}).populate('refereeId', 'name email');
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update match score
// @route   PUT /api/matches/:id/score
// @access  Private (Referee only)
const updateScore = async (req, res) => {
  try {
    const { scoreA, scoreB } = req.body;
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Ensure only the assigned referee can update the score
    if (match.refereeId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this match' });
    }

    if (match.status === 'scheduled') {
      match.status = 'live';
    }

    if (match.status === 'completed' || match.status === 'cancelled') {
        return res.status(400).json({ message: 'Cannot update score of completed or cancelled match' });
    }

    if (scoreA !== undefined) match.scoreA = scoreA;
    if (scoreB !== undefined) match.scoreB = scoreB;

    await match.save();
    
    // In a real app, we would emit a Socket.IO event here to update connected clients in real-time
    // io.emit('scoreUpdate', match);

    res.json(match);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    End match
// @route   PUT /api/matches/:id/end
// @access  Private (Referee only)
const endMatch = async (req, res) => {
  try {
    const { winner, walkover } = req.body;
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Ensure only the assigned referee can end the match
    if (match.refereeId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to end this match' });
    }

    if (walkover) {
        match.status = 'walkover';
        match.winner = winner;
    } else {
        match.status = 'completed';
        if (winner) {
             match.winner = winner;
        } else if (match.scoreA > match.scoreB) {
            match.winner = match.teamA;
        } else if (match.scoreB > match.scoreA) {
            match.winner = match.teamB;
        } else {
            match.winner = 'Draw';
        }
    }

    await match.save();
    res.json(match);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { createMatch, getMatches, updateScore, endMatch };
