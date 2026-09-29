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
    
    // Emit a Socket.IO event to update connected clients in real-time
    const io = req.app.get('io');
    if (io) {
      io.emit('match_score_update', match);
    }

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
            match.winner = 'Draw'; // Auto-advance might break on draw, so referees should force a winner in tournaments
        }
    }

    await match.save();

    // Tournament auto-advance logic
    if (match.tournamentId && match.winner && match.winner !== 'Draw') {
      const winnerId = match.winner === match.teamA ? match.teamAId : match.teamBId;
      if (match.nextMatchId) {
        const nextMatch = await Match.findById(match.nextMatchId);
        if (nextMatch) {
          if (nextMatch.teamA === 'TBD') {
            nextMatch.teamA = match.winner;
            nextMatch.teamAId = winnerId;
          } else {
            nextMatch.teamB = match.winner;
            nextMatch.teamBId = winnerId;
          }
          await nextMatch.save();
        }
      } else {
        // This was the final match
        import('../models/Tournament.js').then(async ({ default: Tournament }) => {
          const tournament = await Tournament.findById(match.tournamentId);
          if (tournament) {
            tournament.status = 'completed';
            tournament.results.firstPlace = winnerId;
            tournament.results.secondPlace = match.winner === match.teamA ? match.teamBId : match.teamAId;
            await tournament.save();
          }
        });
      }
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('match_status_change', match);
    }

    res.json(match);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get leaderboard
// @route   GET /api/matches/leaderboard
// @access  Public
const getLeaderboard = async (req, res) => {
  try {
    const matches = await Match.find({ status: { $in: ['completed', 'walkover'] } });

    const stats = {};

    matches.forEach(match => {
      if (!stats[match.teamA]) {
        stats[match.teamA] = { team: match.teamA, played: 0, won: 0, drawn: 0, lost: 0, points: 0, goalsFor: 0, goalsAgainst: 0 };
      }
      if (!stats[match.teamB]) {
        stats[match.teamB] = { team: match.teamB, played: 0, won: 0, drawn: 0, lost: 0, points: 0, goalsFor: 0, goalsAgainst: 0 };
      }

      stats[match.teamA].played += 1;
      stats[match.teamB].played += 1;
      
      stats[match.teamA].goalsFor += match.scoreA;
      stats[match.teamA].goalsAgainst += match.scoreB;
      stats[match.teamB].goalsFor += match.scoreB;
      stats[match.teamB].goalsAgainst += match.scoreA;

      if (match.winner === match.teamA) {
        stats[match.teamA].won += 1;
        stats[match.teamA].points += 3;
        stats[match.teamB].lost += 1;
      } else if (match.winner === match.teamB) {
        stats[match.teamB].won += 1;
        stats[match.teamB].points += 3;
        stats[match.teamA].lost += 1;
      } else if (match.winner === 'Draw') {
        stats[match.teamA].drawn += 1;
        stats[match.teamA].points += 1;
        stats[match.teamB].drawn += 1;
        stats[match.teamB].points += 1;
      }
    });

    const leaderboard = Object.values(stats).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const gdA = a.goalsFor - a.goalsAgainst;
      const gdB = b.goalsFor - b.goalsAgainst;
      return gdB - gdA;
    });

    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { createMatch, getMatches, updateScore, endMatch, getLeaderboard };
