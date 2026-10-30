import Election from '../models/Election.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';
import Club from '../models/Club.js';
import Vote from '../models/Vote.js';
import AuditLog from '../models/AuditLog.js';
import Membership from '../models/Membership.js';
import { cloudinary } from '../config/cloudinary.js';

// Helper to check if a user is an eligible voting member of a club
const checkUserClubMembership = async (userId, clubId, userRole = null) => {
  if (userRole === 'admin') return true;

  const club = await Club.findById(clubId);
  if (!club) return false;

  const userIdStr = userId.toString();
  const clubIdStr = clubId.toString();

  // 1. Is user in club.members?
  if (Array.isArray(club.members) && club.members.some(m => (m?._id || m).toString() === userIdStr)) {
    return true;
  }

  // 2. Is user the president or vice president of the club?
  if (club.presidentId && (club.presidentId._id || club.presidentId).toString() === userIdStr) {
    return true;
  }
  if (club.vicePresidentId && (club.vicePresidentId._id || club.vicePresidentId).toString() === userIdStr) {
    return true;
  }

  // 3. Is club in user.clubMemberships?
  const user = await User.findById(userId);
  if (user && Array.isArray(user.clubMemberships) && user.clubMemberships.some(c => (c?._id || c).toString() === clubIdStr)) {
    return true;
  }

  // 4. Does user have an approved Membership record?
  const approvedRecord = await Membership.findOne({
    studentId: userId,
    clubId: clubId,
    status: 'Approved'
  });
  if (approvedRecord) {
    // Synchronize to user.clubMemberships and club.members
    if (user && !user.clubMemberships.some(c => (c?._id || c).toString() === clubIdStr)) {
      user.clubMemberships.push(clubId);
      await user.save();
    }
    if (!club.members.some(m => (m?._id || m).toString() === userIdStr)) {
      club.members.push(userId);
      await club.save();
    }
    return true;
  }

  return false;
};

// Helper to create and emit a notification
const createNotification = async (userId, message, type, link) => {
  try {
    await Notification.create({ user: userId, message, type, link });
  } catch (err) {
    console.error('Notification create error:', err.message);
  }
};

// Helper: Conclude an election, pick the candidate with highest votes, and elevate role
const finalizeElectionWinner = async (election, req = null) => {
  if (election.isConcluded) return election;

  let winningCandidate = null;
  let maxVotes = -1;

  for (const c of election.candidates) {
    const candidateVotes = c.votes || 0;
    if (candidateVotes > maxVotes) {
      maxVotes = candidateVotes;
      winningCandidate = c;
    }
  }

  // If there's a candidate, designate as winner and elevate their account
  if (winningCandidate && winningCandidate.candidateId) {
    const winningUserId = winningCandidate.candidateId._id || winningCandidate.candidateId;
    const winningUser = await User.findById(winningUserId);

    if (winningUser) {
      const targetRole = election.position === 'Vice President' ? 'vice_president' : 'president';
      winningUser.role = targetRole;
      winningUser.isVerified = true;
      await winningUser.save();

      // Update the club's leadership
      if (election.clubId) {
        const clubTargetId = election.clubId._id || election.clubId;
        const club = await Club.findById(clubTargetId);
        if (club) {
          if (targetRole === 'vice_president') {
            club.vicePresidentId = winningUser._id;
          } else {
            club.presidentId = winningUser._id;
          }
          await club.save();
        }
      }

      election.winner = {
        candidateId: winningUser._id,
        name: winningUser.name,
        votes: winningCandidate.votes || 0
      };

      await createNotification(
        winningUser._id,
        `🎉 Congratulations! You have won the election for ${election.position} of ${election.clubId?.name || 'the club'}. Your account now has full leadership access!`,
        'election',
        targetRole === 'vice_president' ? '/vice-president' : '/president'
      );
    }
  }

  election.isConcluded = true;
  election.concludedAt = new Date();
  await election.save();

  if (req) {
    const io = req.app.get('io');
    if (io) {
      io.emit('election_concluded', {
        electionId: election._id,
        winner: election.winner,
        position: election.position
      });
    }
  }

  return election;
};

// @desc    Create an election
// @route   POST /api/elections
// @access  Private (Admin/Faculty/President)
const createElection = async (req, res) => {
  try {
    const { title, clubId, position, banner, startDate, endDate, candidates } = req.body;

    if (!title || !clubId || !startDate || !endDate) {
      return res.status(400).json({ message: 'Title, Club, Start Date, and End Date are required.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ message: 'Invalid start date or end date format.' });
    }
    if (end <= start) {
      return res.status(400).json({ message: 'Voting End Date must be after the Start Date.' });
    }

    if (!Array.isArray(candidates) || candidates.length < 2) {
      return res.status(400).json({ message: 'At least two candidate profiles (Candidate 1 vs Candidate 2) are required to launch a matchup election.' });
    }

    const processedCandidates = [];
    for (let idx = 0; idx < candidates.length; idx++) {
      const cand = candidates[idx];
      let u = null;

      if (cand.candidateId) {
        u = await User.findById(cand.candidateId);
      }
      if (!u && cand.roll_no) {
        const cleanRoll = cand.roll_no.trim();
        u = await User.findOne({ 
          $or: [
            { roll_no: new RegExp('^' + cleanRoll + '$', 'i') },
            { username: new RegExp('^' + cleanRoll + '$', 'i') }
          ]
        });
      }
      if (!u && (cand.studentName || cand.name)) {
        const searchName = (cand.studentName || cand.name).trim();
        u = await User.findOne({ name: new RegExp('^' + searchName + '$', 'i') });
      }

      if (!u) {
        const candidateLabel = cand.name || cand.studentName || cand.roll_no || `Profile #${idx + 1}`;
        return res.status(400).json({
          message: `Candidate "${candidateLabel}" was not found in registered students. Please select a registered student or ensure their account exists.`
        });
      }

      const candidateId = u._id;
      const candidateName = cand.name || cand.studentName || u.name;
      let candidatePhoto = cand.photo || u.profilePicture || '';

      // Upload base64 photos to Cloudinary to keep MongoDB small and fast
      if (candidatePhoto && candidatePhoto.startsWith('data:image')) {
        try {
          const uploadRes = await cloudinary.uploader.upload(candidatePhoto, {
            folder: 'club-management/elections',
            transformation: [{ width: 500, height: 500, crop: 'limit' }]
          });
          candidatePhoto = uploadRes.secure_url;
        } catch (uploadErr) {
          console.error('[createElection] Cloudinary candidate photo upload notice:', uploadErr.message);
        }
      }

      processedCandidates.push({
        candidateId,
        name: candidateName,
        photo: candidatePhoto,
        manifesto: cand.manifesto?.trim() || 'Dedicated to student empowerment and excellence.',
        votes: 0
      });
    }

    // Ensure Candidate 1 and Candidate 2 are different students
    const candidateIdStrings = processedCandidates.map(c => c.candidateId.toString());
    if (new Set(candidateIdStrings).size !== candidateIdStrings.length) {
      return res.status(400).json({ message: 'Candidate 1 and Candidate 2 must be different students.' });
    }

    const election = await Election.create({
      title: title.trim(),
      clubId,
      position: position || 'President',
      banner: banner || '',
      startDate: start,
      endDate: end,
      candidates: processedCandidates,
      votedUsers: []
    });

    await AuditLog.create({
      action: 'ELECTION_CREATED',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      targetType: 'Election',
      targetId: election._id,
      details: { title, clubId, position, startDate, endDate },
      status: 'SUCCESS'
    });

    const populated = await Election.findById(election._id)
      .populate('clubId', 'name logo category')
      .populate('candidates.candidateId', 'name profilePicture department year roll_no');

    const io = req.app.get('io');
    if (io) {
      io.emit('new_election_created', populated);
    }

    // Notify all students about the upcoming election
    try {
      const students = await User.find({ role: 'student' }).select('_id');
      const clubName = populated.clubId?.name || 'Club';
      const electionMsg = `🗳️ New Election Announced: ${title} (${position || 'President'}) for ${clubName}! Review candidates and cast your vote.`;
      
      const notifDocs = students.map(st => ({
        user: st._id,
        message: electionMsg,
        type: 'election',
        link: '/elections'
      }));

      if (notifDocs.length > 0) {
        await Notification.insertMany(notifDocs);
      }

      if (io) {
        io.emit('new_notification', {
          message: electionMsg,
          type: 'election',
          link: '/elections'
        });
      }
    } catch (notifErr) {
      console.error('Election notification error:', notifErr.message);
    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a candidate to an election
// @route   POST /api/elections/:id/candidates
// @access  Private (Admin/Faculty/President)
const addCandidate = async (req, res) => {
  try {
    const { candidateId, manifesto, name, photo } = req.body;
    const election = await Election.findById(req.params.id);

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    if (election.isConcluded) {
      return res.status(400).json({ message: 'Cannot add candidates to a concluded election.' });
    }

    const user = await User.findById(candidateId);
    if (!user) {
      return res.status(404).json({ message: 'Candidate user not found' });
    }

    if (election.candidates.some(c => c.candidateId.toString() === candidateId)) {
      return res.status(400).json({ message: 'User is already a candidate in this election' });
    }

    election.candidates.push({
      candidateId,
      name: name || user.name,
      photo: photo || user.profilePicture || '',
      manifesto: manifesto || 'Serving the campus community with passion and leadership.',
      votes: 0
    });

    await election.save();

    await createNotification(
      candidateId,
      `You have been designated as a candidate for "${election.title}" (${election.position})!`,
      'election',
      '/elections'
    );

    const populated = await Election.findById(election._id)
      .populate('clubId', 'name logo category')
      .populate('candidates.candidateId', 'name profilePicture department year');

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Nominate self for election
// @route   POST /api/elections/:id/nominate
// @access  Private (Logged-in students)
const nominateCandidate = async (req, res) => {
  try {
    const { manifesto, photo } = req.body;
    const election = await Election.findById(req.params.id);

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const now = new Date();
    if (now > new Date(election.endDate) || election.isConcluded) {
      return res.status(400).json({ message: 'Nominations are closed for this election.' });
    }

    // Verify membership: only members of this club can stand for election
    const isMember = await checkUserClubMembership(req.user._id, election.clubId, req.user.role);
    if (!isMember) {
      const club = await Club.findById(election.clubId);
      const clubName = club ? club.name : 'this club';
      return res.status(403).json({
        message: `Nomination Restricted: You must be an official registered member of "${clubName}" to stand for election.`
      });
    }

    const candidateId = req.user._id.toString();
    if (election.candidates.some(c => c.candidateId.toString() === candidateId)) {
      return res.status(400).json({ message: 'You have already nominated yourself for this election.' });
    }

    election.candidates.push({
      candidateId: req.user._id,
      name: req.user.name,
      photo: photo || req.user.profilePicture || '',
      manifesto: manifesto || 'Vote for progressive student leadership and active club activities.',
      votes: 0
    });

    await election.save();

    const populated = await Election.findById(election._id)
      .populate('clubId', 'name logo category')
      .populate('candidates.candidateId', 'name profilePicture department year');

    const io = req.app.get('io');
    if (io) {
      io.emit('election_updated', populated);
    }

    res.json(populated);
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
      .populate('clubId', 'name logo category presidentId vicePresidentId members joinFee')
      .populate('candidates.candidateId', 'name profilePicture department year email roll_no')
      .populate('winner.candidateId', 'name profilePicture department email')
      .sort({ createdAt: -1 });

    const now = new Date();
    const result = [];

    for (let el of elections) {
      // Auto-conclude if end date passed and not yet marked concluded
      if (!el.isConcluded && now > new Date(el.endDate) && el.candidates.length > 0) {
        await finalizeElectionWinner(el, req);
      }

      const isLive = now >= new Date(el.startDate) && now <= new Date(el.endDate) && !el.isConcluded;
      const isCompleted = el.isConcluded || now > new Date(el.endDate);
      const isUpcoming = now < new Date(el.startDate);

      const elObj = el.toObject();
      elObj.isLive = isLive;
      elObj.isCompleted = isCompleted;
      elObj.isUpcoming = isUpcoming;
      elObj.totalVotes = Array.isArray(el.votedUsers) ? el.votedUsers.length : 0;

      result.push(elObj);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Vote in an election
// @route   POST /api/elections/:id/vote
// @access  Private (Logged-in Students)
const vote = async (req, res) => {
  try {
    const { candidateId } = req.body;
    const election = await Election.findById(req.params.id);

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const now = new Date();
    const startDate = new Date(election.startDate);
    const endDate = new Date(election.endDate);

    if (now < startDate) {
      return res.status(400).json({
        message: `Election has not opened yet. Voting begins at ${startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`
      });
    }

    if (now > endDate || election.isConcluded) {
      return res.status(400).json({ message: 'Voting window is closed. Ballots have ended.' });
    }

    // Check if user already voted
    const userIdStr = req.user._id.toString();
    const hasAlreadyVoted = election.votedUsers.some(v => v.toString() === userIdStr);
    if (hasAlreadyVoted) {
      return res.status(400).json({ message: 'You have already voted in this election. Each student is allowed only 1 vote.' });
    }

    // Verify Club Membership Eligibility:
    // Only registered and paid members of this specific club can vote
    const isMember = await checkUserClubMembership(req.user._id, election.clubId, req.user.role);
    if (!isMember) {
      const club = await Club.findById(election.clubId);
      const clubName = club ? club.name : 'this club';
      return res.status(403).json({
        message: `Voting Restricted: You must be an official registered member of "${clubName}" to vote. Please join or pay the membership fee for ${clubName} to participate in its elections.`,
        requiresMembership: true,
        clubId: election.clubId,
        clubName
      });
    }

    // Find candidate and increment vote
    const candidate = election.candidates.find(c => {
      const cid = (c.candidateId?._id || c.candidateId)?.toString();
      const subId = c._id?.toString();
      const targetId = candidateId?.toString();
      return cid === targetId || subId === targetId;
    });
    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found in this election matchup.' });
    }

    candidate.votes = (candidate.votes || 0) + 1;
    election.votedUsers.push(req.user._id);

    await election.save();

    // Create Vote audit record
    try {
      await Vote.create({
        electionId: election._id,
        studentId: req.user._id,
        candidateId: candidate.candidateId
      });
    } catch (voteErr) {
      // Index unique ensures 1 vote per student
    }

    // Broadcast live vote update via Socket.IO
    const io = req.app.get('io');
    if (io) {
      io.emit('voteUpdate', {
        electionId: election._id,
        candidateId: candidate.candidateId,
        newVotes: candidate.votes,
        totalVotes: election.votedUsers.length
      });
    }

    await AuditLog.create({
      action: 'BALLOT_CAST',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      targetType: 'Election',
      targetId: election._id,
      details: { electionTitle: election.title, candidateVoted: candidate.name },
      status: 'SUCCESS'
    });

    const populated = await Election.findById(election._id)
      .populate('clubId', 'name logo category')
      .populate('candidates.candidateId', 'name profilePicture department year')
      .populate('winner.candidateId', 'name profilePicture department');

    res.json({
      message: `Vote successfully cast for ${candidate.name || 'Candidate'}!`,
      election: populated
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Conclude election early and determine winner
// @route   POST /api/elections/:id/conclude
// @access  Private (Admin / Faculty)
const concludeElection = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id)
      .populate('clubId')
      .populate('candidates.candidateId');

    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    await finalizeElectionWinner(election, req);

    const populated = await Election.findById(election._id)
      .populate('clubId', 'name logo category presidentId vicePresidentId')
      .populate('candidates.candidateId', 'name profilePicture department year')
      .populate('winner.candidateId', 'name profilePicture department email');

    res.json({
      message: `Election concluded! ${election.winner?.name ? `${election.winner.name} is elected as ${election.position}!` : 'No winner determined.'}`,
      election: populated
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete election
// @route   DELETE /api/elections/:id
// @access  Private (Admin only)
const deleteElection = async (req, res) => {
  try {
    const election = await Election.findById(req.params.id);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    await Election.findByIdAndDelete(req.params.id);
    await Vote.deleteMany({ electionId: req.params.id });

    const io = req.app.get('io');
    if (io) {
      io.emit('election_deleted', { electionId: req.params.id });
    }

    res.json({ message: 'Election deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  createElection,
  addCandidate,
  nominateCandidate,
  getElections,
  vote,
  concludeElection,
  deleteElection
};
