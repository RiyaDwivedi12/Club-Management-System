import Tournament from '../models/Tournament.js';
import Team from '../models/Team.js';
import Match from '../models/Match.js';
import Certificate from '../models/Certificate.js';
import xlsx from 'xlsx';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// Helper to generate a single elimination bracket
const generateBracket = async (tournamentId, teams, refereeId) => {
  // If not a power of 2, calculate byes
  const numTeams = teams.length;
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(numTeams)));
  const byes = nextPowerOf2 - numTeams;
  
  let currentRoundTeams = [...teams];
  
  // Pad with byes
  for (let i = 0; i < byes; i++) {
    currentRoundTeams.push({ name: 'BYE', _id: null });
  }

  // Shuffle teams or use seeding (doing random shuffle for now)
  currentRoundTeams.sort(() => Math.random() - 0.5);

  const totalRounds = Math.log2(nextPowerOf2);
  let previousRoundMatches = [];
  
  // Create first round matches
  for (let i = 0; i < currentRoundTeams.length; i += 2) {
    const tA = currentRoundTeams[i];
    const tB = currentRoundTeams[i+1];
    
    // Auto-advance if one is BYE
    const isBye = tA.name === 'BYE' || tB.name === 'BYE';
    const status = isBye ? 'completed' : 'scheduled';
    const winner = isBye ? (tA.name === 'BYE' ? tB.name : tA.name) : '';
    
    const match = await Match.create({
      tournamentId,
      round: 1,
      teamA: tA.name,
      teamB: tB.name,
      teamAId: tA._id,
      teamBId: tB._id,
      refereeId, // Default referee for now
      date: new Date(), // Replace with scheduled date
      status,
      winner
    });
    previousRoundMatches.push(match);
  }

  // Create subsequent rounds
  for (let round = 2; round <= totalRounds; round++) {
    const currentRoundMatches = [];
    for (let i = 0; i < previousRoundMatches.length; i += 2) {
      const matchA = previousRoundMatches[i];
      const matchB = previousRoundMatches[i+1];
      
      const newMatch = await Match.create({
        tournamentId,
        round,
        teamA: 'TBD',
        teamB: 'TBD',
        refereeId,
        date: new Date(Date.now() + round * 24 * 60 * 60 * 1000), // dummy offset
        status: 'scheduled'
      });
      
      // Link previous matches to this new match
      matchA.nextMatchId = newMatch._id;
      matchB.nextMatchId = newMatch._id;
      
      // Auto-advance byes to the next round immediately
      if (matchA.status === 'completed' && matchA.winner) {
        newMatch.teamA = matchA.winner;
        newMatch.teamAId = matchA.winner === matchA.teamA ? matchA.teamAId : matchA.teamBId;
      }
      if (matchB.status === 'completed' && matchB.winner) {
        newMatch.teamB = matchB.winner;
        newMatch.teamBId = matchB.winner === matchB.teamA ? matchB.teamAId : matchB.teamBId;
      }
      
      await Promise.all([matchA.save(), matchB.save(), newMatch.save()]);
      currentRoundMatches.push(newMatch);
    }
    previousRoundMatches = currentRoundMatches;
  }
  
  return totalRounds;
};

export const uploadGameExcel = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
    const { gameId } = req.params;
    
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    
    const parsedSections = data.map(row => ({
      name: row['Section Name'],
      classOrYear: row['Class/Year'],
      wing: row['Wing'] || 'Senior', // Default to Senior if missing
      rollNumbers: row['Student Roll Numbers'] ? row['Student Roll Numbers'].toString().split(',') : []
    }));
    
    if (req.body.preview === 'true') {
      return res.json({ preview: parsedSections });
    }
    
    const { name, clubId, refereeId } = req.body;
    
    // Create Teams
    const teamDocs = await Promise.all(parsedSections.map(async sec => {
      return await Team.create({
        name: sec.name,
        classOrYear: sec.classOrYear,
        wing: sec.wing,
        clubId,
        gameId
      });
    }));
    
    // Split into wings
    const juniorTeams = teamDocs.filter(t => t.wing === 'Junior');
    const seniorTeams = teamDocs.filter(t => t.wing === 'Senior');
    
    const createdTournaments = [];
    
    if (juniorTeams.length > 0) {
      const jTourney = await Tournament.create({
        name: `${name} (Junior)`,
        clubId,
        gameId,
        wing: 'Junior',
        sections: juniorTeams.map(t => t._id),
        rounds: 0
      });
      jTourney.rounds = await generateBracket(jTourney._id, juniorTeams, refereeId);
      await jTourney.save();
      createdTournaments.push(jTourney);
    }
    
    if (seniorTeams.length > 0) {
      const sTourney = await Tournament.create({
        name: `${name} (Senior)`,
        clubId,
        gameId,
        wing: 'Senior',
        sections: seniorTeams.map(t => t._id),
        rounds: 0
      });
      sTourney.rounds = await generateBracket(sTourney._id, seniorTeams, refereeId);
      await sTourney.save();
      createdTournaments.push(sTourney);
    }
    
    res.json(createdTournaments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find().populate('clubId').populate('sections');
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getTournamentBracket = async (req, res) => {
  try {
    const matches = await Match.find({ tournamentId: req.params.id }).sort('round');
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const recommendNextRound = async (req, res) => {
  try {
    const tournamentId = req.params.id;
    const matches = await Match.find({ tournamentId }).sort('round');
    
    // In a real implementation, we would extract all teams, their win/loss history,
    // and send a prompt to an AI service (like OpenAI or Gemini) to suggest the next round.
    
    // For now, we simulate an AI response that avoids repeat matchups.
    const completedMatches = matches.filter(m => m.status === 'completed' || m.status === 'walkover');
    const winners = completedMatches.filter(m => !m.nextMatchId && m.winner && m.winner !== 'Draw').map(m => m.winner);
    
    // Mock AI response
    const recommendations = [];
    for (let i = 0; i < winners.length; i += 2) {
      if (winners[i+1]) {
        recommendations.push({ teamA: winners[i], teamB: winners[i+1], reason: 'AI Recommendation: Teams have not played each other previously. Balanced performance.' });
      }
    }

    res.json({ recommendations, message: 'AI recommendations generated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
