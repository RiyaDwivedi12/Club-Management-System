import Match from '../models/Match.js';
import User from '../models/User.js';
import Club from '../models/Club.js';
import Tournament from '../models/Tournament.js';
import Notification from '../models/Notification.js';
import crypto from 'crypto';
import xlsx from 'xlsx';
import PDFDocument from 'pdfkit';
import fs from 'fs';

// @desc    Create a new inter-class match inside a club
// @route   POST /api/matches
// @access  Private (Faculty/Admin/President/VicePresident)
const createMatch = async (req, res) => {
  try {
    const { 
      tournamentId, 
      clubId, 
      sport, 
      teamA, 
      teamB, 
      date, 
      timeSlot, 
      duration, 
      wing, 
      refereeEmail, 
      refereeId,
      refereeUsername,
      coordinatorId,
      coordinatorName,
      round,
      roundName
    } = req.body;

    let referee = null;
    if (refereeId) {
      referee = await User.findById(refereeId);
    } else if (refereeUsername && refereeUsername.trim()) {
      const cleanRef = refereeUsername.trim();
      referee = await User.findOne({
        $or: [
          { username: new RegExp('^' + cleanRef + '$', 'i') },
          { name: new RegExp('^' + cleanRef + '$', 'i') },
          { email: new RegExp('^' + cleanRef + '$', 'i') },
          { roll_no: new RegExp('^' + cleanRef + '$', 'i') }
        ]
      });

      if (!referee) {
        // Auto-create referee account with that username/name so they can log in
        const cleanUsername = cleanRef.replace(/\s+/g, '_').toLowerCase();
        const genEmail = cleanRef.includes('@') ? cleanRef.toLowerCase() : (cleanUsername + '@campus.edu');
        referee = await User.create({
          name: cleanRef,
          username: cleanUsername,
          email: genEmail,
          password: 'referee123',
          role: 'referee',
          isReferee: true,
          roll_no: 'REF' + Math.floor(1000 + Math.random() * 9000),
          department: 'Sports Board',
          year: 3,
          course: 'B.Tech',
          section: 'A'
        });
      }
    } else if (refereeEmail) {
      referee = await User.findOne({ email: refereeEmail.trim().toLowerCase() });
    }
    
    if (!referee && refereeEmail) {
      // Create a designated referee account
      const tempPassword = 'referee123';
      referee = await User.create({
        name: `Referee (${refereeEmail.split('@')[0]})`,
        username: 'ref_' + refereeEmail.split('@')[0] + '_' + Math.floor(100 + Math.random() * 900),
        email: refereeEmail.trim().toLowerCase(),
        password: tempPassword,
        role: 'referee',
        isReferee: true,
        roll_no: 'REF' + Math.floor(1000 + Math.random() * 9000),
        department: 'Sports Board',
        year: 3,
        course: 'B.Tech',
        section: 'A',
        isVerified: true
      });
    } else if (!referee) {
      referee = req.user;
    }

    // Enforcement: Teacher / Faculty Coordinator, President, and Vice President can ONLY create matches for their assigned club(s)
    let finalClubId = clubId;
    if (req.user && req.user.role !== 'admin') {
      const allowedQuery = [];
      if (req.user.role === 'faculty') {
        allowedQuery.push({ facultyId: req.user._id });
      } else if (req.user.role === 'president') {
        allowedQuery.push({ presidentId: req.user._id });
      } else if (req.user.role === 'vice_president') {
        allowedQuery.push({ vicePresidentId: req.user._id }, { presidentId: req.user._id });
      } else {
        allowedQuery.push({ facultyId: req.user._id }, { presidentId: req.user._id }, { vicePresidentId: req.user._id });
      }

      const assignedClubs = await Club.find({ $or: allowedQuery });
      if (!assignedClubs || assignedClubs.length === 0) {
        return res.status(403).json({
          message: 'Access denied. You have not been assigned as a Coordinator or Leader of any club by the Admin yet.'
        });
      }

      const assignedClubIds = assignedClubs.map(c => c._id.toString());
      if (!finalClubId && assignedClubs.length === 1) {
        finalClubId = assignedClubs[0]._id;
      }

      if (!finalClubId || !assignedClubIds.includes(finalClubId.toString())) {
        const clubNames = assignedClubs.map(c => c.name).join(', ');
        return res.status(403).json({
          message: `Access restricted. As a ${req.user.role.replace('_', ' ')}, you are only authorized to schedule matches for your assigned club: ${clubNames}.`
        });
      }
    }

    // Lookup coordinator from club if not explicitly provided
    let finalCoordId = coordinatorId || null;
    let finalCoordName = coordinatorName || '';
    let finalSport = sport || 'Sports';

    if (finalClubId) {
      const club = await Club.findById(finalClubId).populate('facultyId', 'name email');
      if (club) {
        if (!finalCoordId && club.facultyId) {
          finalCoordId = club.facultyId._id;
          finalCoordName = club.facultyId.name;
        }
        if (!sport || sport === 'Sports') {
          finalSport = club.sportType || club.category || 'Sports';
        }
      }
    }

    const match = await Match.create({
      tournamentId: (tournamentId && tournamentId !== '') ? tournamentId : undefined,
      clubId: (finalClubId && finalClubId !== '') ? finalClubId : undefined,
      sport: finalSport,
      teamA: (teamA || '').trim(),
      teamB: (teamB || '').trim(),
      refereeId: referee ? referee._id : null,
      coordinatorId: finalCoordId,
      coordinatorName: finalCoordName,
      date: date ? new Date(date) : new Date(),
      timeSlot: timeSlot || '10:00 AM - 11:30 AM',
      duration: duration || 90,
      wing: wing || 'General',
      round: round || 1,
      roundName: roundName || 'Scheduled Match',
      status: 'scheduled'
    });

    const populatedMatch = await Match.findById(match._id)
      .populate('refereeId', 'name email roll_no department')
      .populate('clubId', 'name category sportType facultyId')
      .populate('coordinatorId', 'name email');

    // Notify all students and club members about the upcoming clash match
    try {
      const students = await User.find({ role: 'student' }).select('_id');
      const clubName = populatedMatch.clubId?.name || 'Club';
      const formattedDate = new Date(date || Date.now()).toLocaleDateString();
      const matchMessage = `⚔️ New Match Scheduled: ${teamA} vs ${teamB} (${finalSport} - ${clubName}) on ${formattedDate} at ${timeSlot || '10:00 AM'}!`;
      
      const notifDocs = students.map(st => ({
        user: st._id,
        message: matchMessage,
        type: 'match',
        link: '/matches'
      }));

      if (referee && referee._id) {
        notifDocs.push({
          user: referee._id,
          message: `🏆 Match Assignment: You have been designated as Official Referee for ${teamA} vs ${teamB} (${finalSport} - ${clubName})!`,
          type: 'referee',
          link: '/referee'
        });
      }

      if (notifDocs.length > 0) {
        await Notification.insertMany(notifDocs);
      }

      const io = req.app.get('io');
      if (io) {
        io.emit('new_match_created', populatedMatch);
        io.emit('new_notification', {
          message: matchMessage,
          type: 'match',
          link: '/matches'
        });
      }
    } catch (notifErr) {
      console.error('Match notification error:', notifErr.message);
    }

    res.status(201).json(populatedMatch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all matches
// @route   GET /api/matches
// @access  Public
const getMatches = async (req, res) => {
  try {
    const matches = await Match.find({})
      .populate('refereeId', 'name email roll_no department')
      .populate('clubId', 'name category sportType facultyId')
      .populate('coordinatorId', 'name email')
      .sort({ date: 1, createdAt: 1 });
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update match score
// @route   PUT /api/matches/:id/score
// @access  Private (Referee only / Admin)
const updateScore = async (req, res) => {
  try {
    const { scoreA, scoreB, timer } = req.body;
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    // Ensure authorized: assigned referee, referee user, or admin
    const isAssignedRef = match.refereeId && match.refereeId.toString() === req.user._id.toString();
    const isRefOrAdmin = req.user.role === 'referee' || req.user.isReferee || req.user.role === 'admin';

    if (!isAssignedRef && !isRefOrAdmin) {
      return res.status(403).json({ message: 'Not authorized to update this match score' });
    }

    if (match.status === 'scheduled') {
      match.status = 'live';
    }

    if (match.status === 'completed' || match.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot update score of completed or cancelled match' });
    }

    if (scoreA !== undefined) match.scoreA = Math.max(0, scoreA);
    if (scoreB !== undefined) match.scoreB = Math.max(0, scoreB);
    if (timer !== undefined) match.timer = timer;

    await match.save();

    const populatedMatch = await Match.findById(match._id)
      .populate('refereeId', 'name email roll_no department')
      .populate('clubId', 'name category sportType facultyId')
      .populate('coordinatorId', 'name email');
    
    // Emit a Socket.IO event to update connected clients in real-time
    const io = req.app.get('io');
    if (io) {
      io.emit('match_score_update', populatedMatch);
    }

    res.json(populatedMatch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    End match & advance tournament (determines 1st, 2nd, 3rd Place)
// @route   PUT /api/matches/:id/end
// @access  Private (Referee only / Admin)
const endMatch = async (req, res) => {
  try {
    const { winner, walkover } = req.body;
    const match = await Match.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    const isAssignedRef = match.refereeId && match.refereeId.toString() === req.user._id.toString();
    const isRefOrAdmin = req.user.role === 'referee' || req.user.isReferee || req.user.role === 'admin';

    if (!isAssignedRef && !isRefOrAdmin) {
      return res.status(403).json({ message: 'Not authorized to conclude this match' });
    }

    if (walkover) {
      match.status = 'walkover';
      match.winner = winner || match.teamA;
    } else {
      match.status = 'completed';
      if (winner) {
        match.winner = winner;
      } else if (match.scoreA > match.scoreB) {
        match.winner = match.teamA;
      } else if (match.scoreB > match.scoreA) {
        match.winner = match.teamB;
      } else {
        match.winner = match.teamA; // Tiebreaker default to Team A in elimination
      }
    }

    const winnerClass = match.winner;
    const loserClass = winnerClass === match.teamA ? match.teamB : match.teamA;
    const winnerId = winnerClass === match.teamA ? match.teamAId : match.teamBId;
    const loserId = winnerClass === match.teamA ? match.teamBId : match.teamAId;

    await match.save();

    // TOURNAMENT KNOCKOUT & PODIUM ADVANCEMENT
    if (match.tournamentId && match.winner) {
      const tournament = await Tournament.findById(match.tournamentId);

      // 1. Advance winner to Next Match in bracket tree
      if (match.nextMatchId) {
        const nextMatch = await Match.findById(match.nextMatchId);
        if (nextMatch) {
          if (!nextMatch.teamA || nextMatch.teamA === 'TBD') {
            nextMatch.teamA = winnerClass;
            nextMatch.teamAId = winnerId;
          } else {
            nextMatch.teamB = winnerClass;
            nextMatch.teamBId = winnerId;
          }
          await nextMatch.save();
        }
      }

      // 2. If this was a Semi-Final, send loser to 3rd Place Match!
      if (match.thirdPlaceMatchId) {
        const thirdPlaceMatch = await Match.findById(match.thirdPlaceMatchId);
        if (thirdPlaceMatch) {
          if (!thirdPlaceMatch.teamA || thirdPlaceMatch.teamA === 'TBD') {
            thirdPlaceMatch.teamA = loserClass;
            thirdPlaceMatch.teamAId = loserId;
          } else {
            thirdPlaceMatch.teamB = loserClass;
            thirdPlaceMatch.teamBId = loserId;
          }
          await thirdPlaceMatch.save();
        }
      }

      // 3. If this match is the 3rd Place Match:
      if (match.isThirdPlaceMatch || match.roundName?.includes('3rd Place')) {
        if (tournament) {
          tournament.results.thirdPlace = winnerId;
          tournament.results.thirdPlaceName = winnerClass;
          await tournament.save();
        }
      }

      // 4. If this match is the Grand Final:
      const isGrandFinal = (!match.nextMatchId && !match.isThirdPlaceMatch) || match.roundName?.includes('Final') && !match.roundName?.includes('Semi');
      if (isGrandFinal && tournament) {
        tournament.results.firstPlace = winnerId;
        tournament.results.firstPlaceName = winnerClass;
        tournament.results.secondPlace = loserId;
        tournament.results.secondPlaceName = loserClass;

        // Check if there's any uncompleted 3rd place match
        const pendingThird = await Match.findOne({
          tournamentId: tournament._id,
          isThirdPlaceMatch: true,
          status: { $ne: 'completed' }
        });
        if (!pendingThird) {
          tournament.status = 'completed';
        }
        await tournament.save();
      }
    }

    const populatedMatch = await Match.findById(match._id)
      .populate('refereeId', 'name email roll_no department')
      .populate('clubId', 'name category sportType facultyId')
      .populate('coordinatorId', 'name email');

    const io = req.app.get('io');
    if (io) {
      io.emit('match_status_change', populatedMatch);
      if (match.tournamentId) {
        io.emit('tournament_bracket_updated', { tournamentId: match.tournamentId });
      }
    }

    res.json(populatedMatch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export matches schedule as styled PDF
// @route   GET /api/matches/export/pdf
// @access  Public / Private
const exportMatchesPdf = async (req, res) => {
  try {
    const query = {};
    if (req.query.clubId) query.clubId = req.query.clubId;
    if (req.query.wing) query.wing = req.query.wing;

    const matches = await Match.find(query)
      .populate('refereeId', 'name email roll_no')
      .populate('clubId', 'name sportType')
      .populate('coordinatorId', 'name email')
      .sort({ date: 1, timeSlot: 1 });

    const doc = new PDFDocument({ margin: 36, size: 'A4' });

    res.setHeader('Content-Disposition', 'attachment; filename="inter_class_match_fixtures.pdf"');
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    // Header styling
    doc.rect(36, 36, doc.page.width - 72, 70).fill('#0f766e');
    doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold')
      .text('COLLEGE CAMPUS SPORTS BOARD', 50, 48);
    doc.fontSize(12).font('Helvetica')
      .text('Official Inter-Class Tournament & Match Schedule Fixtures', 50, 72);
    doc.fontSize(9).fillColor('#ccfbf1')
      .text(`Generated: ${new Date().toLocaleString()} | Total Scheduled Matches: ${matches.length}`, 50, 88);

    doc.moveDown(3);
    doc.fillColor('#1f2937');

    let y = 125;
    const drawRow = (cols, isHeader = false) => {
      const colWidths = [150, 80, 55, 65, 80, 85];
      let x = 36;
      doc.fontSize(isHeader ? 9 : 8).font(isHeader ? 'Helvetica-Bold' : 'Helvetica');
      
      if (isHeader) {
        doc.rect(x, y - 4, doc.page.width - 72, 18).fill('#f1f5f9');
        doc.fillColor('#334155');
      } else {
        doc.fillColor('#1e293b');
        if (Math.floor(y / 20) % 2 === 0) {
          doc.rect(x, y - 4, doc.page.width - 72, 18).fill('#fafafa');
          doc.fillColor('#1e293b');
        }
      }

      cols.forEach((col, i) => {
        doc.text(col || '-', x + 4, y, { width: colWidths[i] - 8, lineBreak: false });
        x += colWidths[i];
      });

      y += 18;
      if (y > doc.page.height - 50) {
        doc.addPage();
        y = 40;
      }
    };

    // Table Header
    drawRow(['Class Matchup', 'Sport / Club', 'Wing', 'Date', 'Slotted Time', 'Assigned Referee'], true);

    matches.forEach(m => {
      const matchup = `${m.teamA} vs ${m.teamB}`;
      const sport = m.sport || m.clubId?.name || 'General';
      const wing = m.wing || 'General';
      const matchDate = m.date ? new Date(m.date).toLocaleDateString() : 'TBD';
      const time = m.timeSlot || '10:00 AM';
      const ref = m.refereeId ? m.refereeId.name : 'Slotted Official';
      drawRow([matchup, sport, wing, matchDate, time, ref]);
    });

    // Footer
    doc.fontSize(8).fillColor('#64748b').text('Note: All referees must report 15 minutes prior to their allotted time slot at the College Sports Ground.', 36, doc.page.height - 30);

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export matches schedule as Excel
// @route   GET /api/matches/export/excel
// @access  Public / Private
const exportMatchesExcel = async (req, res) => {
  try {
    const query = {};
    if (req.query.clubId) query.clubId = req.query.clubId;
    if (req.query.wing) query.wing = req.query.wing;

    const matches = await Match.find(query)
      .populate('refereeId', 'name email roll_no')
      .populate('clubId', 'name sportType')
      .populate('coordinatorId', 'name email')
      .sort({ date: 1, timeSlot: 1 });

    const rows = matches.map(m => ({
      'Match ID': m._id.toString().slice(-6),
      'Class / Team A': m.teamA,
      'Class / Team B': m.teamB,
      'Sport': m.sport || m.clubId?.name || 'Sports',
      'Wing': m.wing || 'General',
      'Scheduled Date': m.date ? new Date(m.date).toLocaleDateString() : '',
      'Slotted Time Window': m.timeSlot || '10:00 AM - 11:30 AM',
      'Duration (Mins)': m.duration || 90,
      'Assigned Referee': m.refereeId ? m.refereeId.name : 'Unassigned',
      'Referee Email': m.refereeId ? m.refereeId.email : '',
      'Teacher Coordinator': m.coordinatorName || m.coordinatorId?.name || 'Assigned Coordinator',
      'Status': m.status.toUpperCase(),
      'Score': `${m.scoreA} - ${m.scoreB}`,
      'Winner': m.winner || '-'
    }));

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(rows);
    xlsx.utils.book_append_sheet(wb, ws, 'Match_Schedule');

    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="campus_match_fixtures.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
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

// @desc    Upload matches from Excel
// @route   POST /api/matches/upload
// @access  Private (Admin/Faculty/President)
const uploadMatches = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an Excel file' });
    }

    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

    // Expected format: TeamA | TeamB | Date | RefereeEmail | Status
    // We can also have an optional Winner column
    const matches = [];

    for (const row of data) {
      if (row.TeamA && row.TeamB) {
        let refereeId;
        
        if (row.RefereeEmail) {
          const cleanEmail = row.RefereeEmail.trim().toLowerCase();
          let referee = await User.findOne({ email: cleanEmail });
          if (!referee) {
            const tempPassword = crypto.randomBytes(8).toString('hex');
            const cleanPrefix = cleanEmail.split('@')[0];
            referee = await User.create({
              name: `Referee for ${row.TeamA} vs ${row.TeamB}`,
              username: 'ref_' + cleanPrefix + '_' + Math.floor(100 + Math.random() * 900),
              email: cleanEmail,
              password: tempPassword,
              role: 'referee',
              isReferee: true,
              roll_no: 'REF' + Math.floor(1000 + Math.random() * 9000),
              department: 'Sports Board',
              year: 3,
              course: 'B.Tech',
              section: 'A',
              isVerified: true
            });
          }
          refereeId = referee._id;
        } else {
          // Fallback to the current user (admin)
          refereeId = req.user._id;
        }

        const match = await Match.create({
          teamA: String(row.TeamA).trim(),
          teamB: String(row.TeamB).trim(),
          date: row.Date ? new Date(row.Date) : new Date(),
          refereeId,
          status: row.Status || 'scheduled',
          winner: row.Winner || ''
        });
        matches.push(match);
      }
    }

    if (req.file?.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore cleanup error */ }
    }
    
    res.status(201).json({ message: `${matches.length} matches uploaded successfully`, matches });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch (e) { /* ignore cleanup error */ }
    }
    res.status(500).json({ message: error.message });
  }
};

export { 
  createMatch, 
  getMatches, 
  updateScore, 
  endMatch, 
  getLeaderboard, 
  uploadMatches,
  exportMatchesPdf,
  exportMatchesExcel
};

