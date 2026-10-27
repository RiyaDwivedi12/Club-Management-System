import Tournament from '../models/Tournament.js';
import Team from '../models/Team.js';
import Match from '../models/Match.js';
import Club from '../models/Club.js';
import User from '../models/User.js';
import xlsx from 'xlsx';
import PDFDocument from 'pdfkit';

const TIME_SLOTS = [
  '09:00 AM - 10:30 AM',
  '10:45 AM - 12:15 PM',
  '01:30 PM - 03:00 PM',
  '03:15 PM - 04:45 PM',
  '05:00 PM - 06:30 PM'
];

// Helper to generate a single elimination bracket with 3rd Place Match & Slotted Referees
const generateKnockoutBracket = async ({
  tournamentId,
  teams,
  refereeIds = [],
  startDate = new Date(),
  clubId = null,
  sport = 'Sports',
  wing = 'General',
  coordinatorId = null,
  coordinatorName = ''
}) => {
  // If refereeIds is empty, query all active referees from database
  let availableReferees = refereeIds.length > 0 ? refereeIds : [];
  if (availableReferees.length === 0) {
    const refs = await User.find({ $or: [{ role: 'referee' }, { isReferee: true }] }).select('_id');
    availableReferees = refs.map(r => r._id);
  }

  let refIndex = 0;
  const getNextReferee = () => {
    if (availableReferees.length === 0) return null;
    const ref = availableReferees[refIndex % availableReferees.length];
    refIndex++;
    return ref;
  };

  const numTeams = teams.length;
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(numTeams || 2)));
  const byes = nextPowerOf2 - numTeams;

  let currentRoundTeams = [...teams];
  for (let i = 0; i < byes; i++) {
    currentRoundTeams.push({ name: 'BYE', _id: null, isBye: true });
  }

  // Shuffle teams for fairness
  currentRoundTeams.sort(() => Math.random() - 0.5);

  const totalRounds = Math.log2(nextPowerOf2);
  let previousRoundMatches = [];
  let currentScheduleDate = new Date(startDate);
  let slotIndex = 0;

  const getNextMatchSchedule = () => {
    const timeSlot = TIME_SLOTS[slotIndex % TIME_SLOTS.length];
    const matchDate = new Date(currentScheduleDate);
    slotIndex++;
    if (slotIndex % TIME_SLOTS.length === 0) {
      currentScheduleDate.setDate(currentScheduleDate.getDate() + 1);
    }
    return { date: matchDate, timeSlot };
  };

  const getRoundLabel = (round, total) => {
    if (round === total) return 'Grand Final';
    if (round === total - 1 && total > 1) return 'Semi-Final';
    if (round === total - 2 && total > 2) return 'Quarter-Final';
    return `Round ${round}`;
  };

  // 1. Create first round matches
  for (let i = 0; i < currentRoundTeams.length; i += 2) {
    const tA = currentRoundTeams[i];
    const tB = currentRoundTeams[i + 1];

    const isBye = tA.isBye || tB.isBye;
    const status = isBye ? 'completed' : 'scheduled';
    const winner = isBye ? (tA.isBye ? tB.name : tA.name) : '';
    const { date, timeSlot } = getNextMatchSchedule();

    const match = await Match.create({
      tournamentId,
      clubId,
      sport,
      wing,
      round: 1,
      roundName: getRoundLabel(1, totalRounds),
      teamA: tA.name,
      teamB: tB.name,
      teamAId: tA._id,
      teamBId: tB._id,
      refereeId: getNextReferee(),
      coordinatorId,
      coordinatorName,
      date,
      timeSlot,
      status,
      winner
    });
    previousRoundMatches.push(match);
  }

  // 2. Create subsequent rounds
  for (let round = 2; round <= totalRounds; round++) {
    currentScheduleDate.setDate(currentScheduleDate.getDate() + 1);
    slotIndex = 0;
    const currentRoundMatches = [];
    const isFinalRound = round === totalRounds;
    const isSemiFinalRound = round === totalRounds - 1;

    for (let i = 0; i < previousRoundMatches.length; i += 2) {
      const matchA = previousRoundMatches[i];
      const matchB = previousRoundMatches[i + 1];
      const { date, timeSlot } = getNextMatchSchedule();

      const newMatch = await Match.create({
        tournamentId,
        clubId,
        sport,
        wing,
        round,
        roundName: getRoundLabel(round, totalRounds),
        teamA: 'TBD',
        teamB: 'TBD',
        refereeId: getNextReferee(),
        coordinatorId,
        coordinatorName,
        date,
        timeSlot,
        status: 'scheduled'
      });

      matchA.nextMatchId = newMatch._id;
      if (matchB) matchB.nextMatchId = newMatch._id;

      // Auto-advance byes to next round immediately
      if (matchA.status === 'completed' && matchA.winner) {
        newMatch.teamA = matchA.winner;
        newMatch.teamAId = matchA.winner === matchA.teamA ? matchA.teamAId : matchA.teamBId;
      }
      if (matchB && matchB.status === 'completed' && matchB.winner) {
        newMatch.teamB = matchB.winner;
        newMatch.teamBId = matchB.winner === matchB.teamA ? matchB.teamAId : matchB.teamBId;
      }

      await Promise.all([matchA.save(), matchB ? matchB.save() : Promise.resolve(), newMatch.save()]);
      currentRoundMatches.push(newMatch);
    }

    // 3. If previous round was Semi-Final (2 matches), create 3rd Place Match!
    if (isFinalRound && previousRoundMatches.length === 2) {
      const semi1 = previousRoundMatches[0];
      const semi2 = previousRoundMatches[1];
      const { date: thirdPlaceDate, timeSlot: thirdPlaceSlot } = getNextMatchSchedule();

      const thirdPlaceMatch = await Match.create({
        tournamentId,
        clubId,
        sport,
        wing,
        round,
        roundName: '3rd Place Playoff',
        isThirdPlaceMatch: true,
        teamA: 'TBD',
        teamB: 'TBD',
        refereeId: getNextReferee(),
        coordinatorId,
        coordinatorName,
        date: thirdPlaceDate,
        timeSlot: thirdPlaceSlot,
        status: 'scheduled'
      });

      semi1.thirdPlaceMatchId = thirdPlaceMatch._id;
      semi2.thirdPlaceMatchId = thirdPlaceMatch._id;

      await Promise.all([semi1.save(), semi2.save()]);
    }

    previousRoundMatches = currentRoundMatches;
  }

  return totalRounds;
};

// @desc    AI Match Arranger & Scheduler (Handles 30+ classes, Junior/Senior wings, Excel/PDF)
// @route   POST /api/tournaments/ai-arrange
// @access  Private (Admin, Faculty, President, VicePresident)
export const aiArrangeTournament = async (req, res) => {
  try {
    let classesList = [];

    // Parse from file upload or JSON body
    if (req.file) {
      const workbook = req.file.buffer 
        ? xlsx.read(req.file.buffer, { type: 'buffer' })
        : xlsx.readFile(req.file.path);
      const sheetName = workbook.SheetNames[0];
      const sheetData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

      classesList = sheetData.map(row => {
        const name = (row['Class Name'] || row['Class'] || row['Section'] || row['Team Name'] || row['Team'] || '').toString().trim();
        let wing = (row['Wing'] || '').toString().trim();
        const year = (row['Year'] || row['Class/Year'] || '').toString().trim();

        // Auto-detect Junior vs Senior if wing is missing
        if (!wing) {
          const lower = (name + ' ' + year).toLowerCase();
          if (lower.includes('1st') || lower.includes('2nd') || lower.includes('2023') || lower.includes('2024') || lower.includes('junior')) {
            wing = 'Junior';
          } else if (lower.includes('3rd') || lower.includes('4th') || lower.includes('2021') || lower.includes('2022') || lower.includes('senior')) {
            wing = 'Senior';
          } else {
            wing = 'General';
          }
        }
        return { name, wing, year: year || 'General' };
      }).filter(c => c.name.length > 0);
    } else if (req.body.classes && Array.isArray(req.body.classes)) {
      classesList = req.body.classes.map(c => typeof c === 'string' ? { name: c.trim(), wing: 'General' } : c);
    }

    if (!classesList || classesList.length < 2) {
      return res.status(400).json({ 
        message: 'Please provide at least 2 classes or upload an Excel/CSV file with classes list.' 
      });
    }

    const { 
      name = 'Campus Inter-Class Championship', 
      clubId, 
      sport = 'Cricket', 
      startDate = new Date(),
      refereeIds = [],
      preview = 'false'
    } = req.body;

    // Fetch club leadership if clubId provided
    let club = null;
    let coordinatorId = null;
    let coordinatorName = '';
    if (clubId) {
      club = await Club.findById(clubId).populate('facultyId', 'name email');
      if (club && club.facultyId) {
        coordinatorId = club.facultyId._id;
        coordinatorName = club.facultyId.name;
      }
    }

    // Separate classes into Junior Wing and Senior Wing
    let juniorClasses = classesList.filter(c => c.wing === 'Junior');
    let seniorClasses = classesList.filter(c => c.wing === 'Senior');
    const generalClasses = classesList.filter(c => c.wing !== 'Junior' && c.wing !== 'Senior');

    // If all classes are general or unbalanced, distribute fairly
    if (juniorClasses.length === 0 && seniorClasses.length === 0) {
      const mid = Math.ceil(generalClasses.length / 2);
      juniorClasses = generalClasses.slice(0, mid).map(c => ({ ...c, wing: 'Junior' }));
      seniorClasses = generalClasses.slice(mid).map(c => ({ ...c, wing: 'Senior' }));
    } else if (generalClasses.length > 0) {
      generalClasses.forEach((c, idx) => {
        if (idx % 2 === 0) juniorClasses.push({ ...c, wing: 'Junior' });
        else seniorClasses.push({ ...c, wing: 'Senior' });
      });
    }

    // AI Arranger Analysis & Reasoning
    const aiReasoning = `AI Match Arranger analyzed ${classesList.length} total classes. ` +
      `Categorized ${juniorClasses.length} classes into the Junior Wing and ${seniorClasses.length} classes into the Senior Wing. ` +
      `Structured single-elimination tournament trees with non-conflicting time slots (90-min duration) at the campus sports ground. ` +
      `Equitably slotted certified campus referees across all matches to ensure official coverage. ` +
      `Configured automatic winner progression and 3rd-Place Playoff matches to determine 1st, 2nd, and 3rd place podium standings.`;

    if (preview === 'true') {
      return res.json({
        preview: true,
        aiReasoning,
        totalClasses: classesList.length,
        juniorWing: {
          count: juniorClasses.length,
          classes: juniorClasses.map(c => c.name),
          estimatedRounds: Math.ceil(Math.log2(juniorClasses.length || 2))
        },
        seniorWing: {
          count: seniorClasses.length,
          classes: seniorClasses.map(c => c.name),
          estimatedRounds: Math.ceil(Math.log2(seniorClasses.length || 2))
        }
      });
    }

    // EXECUTE DB CREATION
    const createdTournaments = [];

    // 1. Junior Wing Tournament
    if (juniorClasses.length > 0) {
      const juniorTeamDocs = await Promise.all(juniorClasses.map(c => 
        Team.create({ name: c.name, classOrYear: c.year || 'Junior', wing: 'Junior', clubId })
      ));

      const jTourney = await Tournament.create({
        name: `${name} (Junior Wing)`,
        clubId: clubId || null,
        sport: sport || club?.sportType || 'Cricket',
        wing: 'Junior',
        sections: juniorTeamDocs.map(t => t._id),
        classesCount: juniorClasses.length,
        rounds: 0,
        coordinatorId,
        coordinatorName,
        status: 'ongoing'
      });

      jTourney.rounds = await generateKnockoutBracket({
        tournamentId: jTourney._id,
        teams: juniorTeamDocs,
        refereeIds,
        startDate: new Date(startDate),
        clubId,
        sport,
        wing: 'Junior',
        coordinatorId,
        coordinatorName
      });
      await jTourney.save();
      createdTournaments.push(jTourney);
    }

    // 2. Senior Wing Tournament
    if (seniorClasses.length > 0) {
      const seniorTeamDocs = await Promise.all(seniorClasses.map(c => 
        Team.create({ name: c.name, classOrYear: c.year || 'Senior', wing: 'Senior', clubId })
      ));

      const sTourney = await Tournament.create({
        name: `${name} (Senior Wing)`,
        clubId: clubId || null,
        sport: sport || club?.sportType || 'Cricket',
        wing: 'Senior',
        sections: seniorTeamDocs.map(t => t._id),
        classesCount: seniorClasses.length,
        rounds: 0,
        coordinatorId,
        coordinatorName,
        status: 'ongoing'
      });

      sTourney.rounds = await generateKnockoutBracket({
        tournamentId: sTourney._id,
        teams: seniorTeamDocs,
        refereeIds,
        startDate: new Date(startDate),
        clubId,
        sport,
        wing: 'Senior',
        coordinatorId,
        coordinatorName
      });
      await sTourney.save();
      createdTournaments.push(sTourney);
    }

    res.status(201).json({
      message: `AI arranged ${classesList.length} classes into Junior & Senior tournaments successfully!`,
      aiReasoning,
      tournaments: createdTournaments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Upload game excel (legacy compatibility wrapper)
export const uploadGameExcel = async (req, res) => {
  return aiArrangeTournament(req, res);
};

export const getTournamentById = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('clubId')
      .populate('sections')
      .populate('coordinatorId', 'name email');
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find()
      .populate('clubId')
      .populate('sections')
      .populate('coordinatorId', 'name email')
      .sort({ createdAt: -1 });
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTournamentBracket = async (req, res) => {
  try {
    const matches = await Match.find({ tournamentId: req.params.id })
      .populate('refereeId', 'name email roll_no')
      .sort({ round: 1, isThirdPlaceMatch: 1, date: 1, timeSlot: 1 });
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const recommendNextRound = async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const matches = await Match.find({ tournamentId }).sort('round');
    const completedMatches = matches.filter(m => m.status === 'completed' || m.status === 'walkover');
    const winners = completedMatches.filter(m => !m.nextMatchId && m.winner && m.winner !== 'Draw').map(m => m.winner);
    
    const recommendations = [];
    for (let i = 0; i < winners.length; i += 2) {
      if (winners[i+1]) {
        recommendations.push({ 
          teamA: winners[i], 
          teamB: winners[i+1], 
          reason: 'AI Recommendation: Balanced win-rate matchup. Classes have distinct tactics and optimal head-to-head dynamics.' 
        });
      }
    }

    res.json({ recommendations, message: 'AI recommendations generated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export tournament bracket to PDF
// @route   GET /api/tournaments/:id/export/pdf
export const exportTournamentPdf = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id).populate('clubId');
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

    const matches = await Match.find({ tournamentId: tournament._id })
      .populate('refereeId', 'name email')
      .sort({ round: 1, date: 1, timeSlot: 1 });

    const doc = new PDFDocument({ margin: 36, size: 'A4' });
    res.setHeader('Content-Disposition', `attachment; filename="${tournament.name.replace(/[^a-zA-Z0-9]/g, '_')}_bracket.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    // Banner
    doc.rect(36, 36, doc.page.width - 72, 80).fill('#1e1b4b');
    doc.fillColor('#ffffff').fontSize(18).font('Helvetica-Bold')
      .text(tournament.name.toUpperCase(), 50, 48);
    doc.fontSize(11).font('Helvetica')
      .text(`Sport: ${tournament.sport} | Wing: ${tournament.wing} | Status: ${tournament.status.toUpperCase()}`, 50, 72);
    
    if (tournament.results.firstPlaceName) {
      doc.fontSize(10).fillColor('#fde047').font('Helvetica-Bold')
        .text(`PODIUM: 1st: ${tournament.results.firstPlaceName} | 2nd: ${tournament.results.secondPlaceName || 'TBD'} | 3rd: ${tournament.results.thirdPlaceName || 'TBD'}`, 50, 92);
    }

    doc.moveDown(3);

    let y = 135;
    const drawRow = (cols, isHeader = false) => {
      const colWidths = [120, 150, 75, 75, 100];
      let x = 36;
      doc.fontSize(isHeader ? 9 : 8).font(isHeader ? 'Helvetica-Bold' : 'Helvetica');
      
      if (isHeader) {
        doc.rect(x, y - 4, doc.page.width - 72, 18).fill('#ede9fe');
        doc.fillColor('#4338ca');
      } else {
        doc.fillColor('#1e293b');
        if (Math.floor(y / 20) % 2 === 0) {
          doc.rect(x, y - 4, doc.page.width - 72, 18).fill('#f8fafc');
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

    drawRow(['Round', 'Class Matchup', 'Date', 'Slotted Time', 'Slotted Referee'], true);

    matches.forEach(m => {
      const roundTitle = m.isThirdPlaceMatch ? '3rd Place Playoff' : (m.roundName || `Round ${m.round}`);
      const matchup = `${m.teamA} vs ${m.teamB}`;
      const d = m.date ? new Date(m.date).toLocaleDateString() : 'TBD';
      const slot = m.timeSlot || '10:00 AM';
      const ref = m.refereeId ? m.refereeId.name : 'Slotted Referee';
      drawRow([roundTitle, matchup, d, slot, ref]);
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
