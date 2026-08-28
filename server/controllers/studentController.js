import Club from '../models/Club.js';
import Membership from '../models/Membership.js';
import Payment from '../models/Payment.js';
import Election from '../models/Election.js';
import Vote from '../models/Vote.js';
import mongoose from 'mongoose';

// @desc    Get all clubs
// @route   GET /api/student/clubs
// @access  Private (Student)
export const getAllClubs = async (req, res) => {
  try {
    const clubs = await Club.find({}).select('name category description logo');
    res.json(clubs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Apply to join a club
// @route   POST /api/student/clubs/:clubId/join
// @access  Private (Student)
export const joinClub = async (req, res) => {
  try {
    const { clubId } = req.params;
    const studentId = req.user._id;

    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    // 1. Check if already applied or joined this specific club
    const existingMembership = await Membership.findOne({ studentId, clubId });
    if (existingMembership) {
      return res.status(400).json({ message: `You have already applied to this club. Status: ${existingMembership.status}` });
    }

    // 2. Fetch all current active/pending memberships for this student
    const activeMemberships = await Membership.find({ 
      studentId, 
      status: { $in: ['Pending', 'Approved'] } 
    }).populate('clubId', 'category name');

    // 3. Validation Rules
    // Rule a: Max 2 total club memberships
    if (activeMemberships.length >= 2) {
      return res.status(400).json({ message: 'You can only join a maximum of 2 clubs.' });
    }

    // Rule b: Check for category duplication
    const hasCategory = activeMemberships.some(m => m.clubId.category === club.category);
    if (hasCategory) {
      return res.status(400).json({ message: `You have already joined a ${club.category} club. You cannot join another one.` });
    }

    // Create the membership request
    const membership = await Membership.create({
      studentId,
      clubId,
      status: 'Pending'
    });

    res.status(201).json({ message: 'Successfully applied to join the club', membership });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get my memberships
// @route   GET /api/student/memberships
// @access  Private (Student)
export const getMyMemberships = async (req, res) => {
  try {
    // Find clubs where the user is either a member or has a pending request
    const clubs = await Club.find({
      $or: [
        { members: req.user._id },
        { pendingRequests: req.user._id }
      ]
    }).select('name category description logo members pendingRequests');
    
    // Map to a consistent format for the frontend
    const memberships = clubs.map(club => {
      let status = 'Unknown';
      if (club.members.includes(req.user._id)) {
        status = 'Approved';
      } else if (club.pendingRequests.includes(req.user._id)) {
        status = 'Pending';
      }
      return {
        _id: club._id,
        clubId: club,
        status
      };
    });
    
    res.json(memberships);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Pay membership fee
// @route   POST /api/student/clubs/:clubId/pay-fee
// @access  Private (Student)
export const payFee = async (req, res) => {
  try {
    const { clubId } = req.params;
    const { amount, razorpayOrderId, razorpayPaymentId } = req.body;
    const studentId = req.user._id;

    // Check if user is an approved member
    const membership = await Membership.findOne({ studentId, clubId, status: 'Approved' });
    if (!membership) {
      return res.status(400).json({ message: 'You must be an approved member to pay fees for this club.' });
    }

    // In a real scenario, you'd verify the Razorpay signature here.
    const payment = await Payment.create({
      userId: studentId,
      clubId,
      razorpayOrderId,
      razorpayPaymentId,
      amount,
      status: 'Paid'
    });

    res.status(201).json({ message: 'Payment successful', payment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get payment history
// @route   GET /api/student/payments
// @access  Private (Student)
export const getMyPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .populate('clubId', 'name category');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get active elections for a club
// @route   GET /api/student/elections/:clubId
// @access  Private (Student)
export const getElections = async (req, res) => {
  try {
    const { clubId } = req.params;
    const currentDate = new Date();

    const elections = await Election.find({
      clubId,
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    }).populate('candidates.candidateId', 'name department year');

    res.json(elections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cast a vote
// @route   POST /api/student/elections/:electionId/vote
// @access  Private (Student)
export const vote = async (req, res) => {
  try {
    const { electionId } = req.params;
    const { candidateId } = req.body;
    const studentId = req.user._id;

    const election = await Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    // Check if the election is active
    const currentDate = new Date();
    if (currentDate < election.startDate || currentDate > election.endDate) {
      return res.status(400).json({ message: 'This election is not currently active.' });
    }

    // Check if the student is an approved member of this club
    const membership = await Membership.findOne({ 
      studentId, 
      clubId: election.clubId, 
      status: 'Approved' 
    });
    
    if (!membership) {
      return res.status(403).json({ message: 'You must be an approved member of this club to vote.' });
    }

    // Attempt to cast vote
    try {
      await Vote.create({
        electionId,
        studentId,
        candidateId
      });

      // Increment vote count on the Election document
      await Election.updateOne(
        { _id: electionId, 'candidates.candidateId': candidateId },
        { $inc: { 'candidates.$.votes': 1 } }
      );

      res.status(201).json({ message: 'Vote cast successfully!' });
    } catch (err) {
      // MongoDB duplicate key error code is 11000
      if (err.code === 11000) {
        return res.status(400).json({ message: 'You have already voted in this election.' });
      }
      throw err;
    }

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get election results
// @route   GET /api/student/elections/:electionId/results
// @access  Private (Student)
export const getElectionResults = async (req, res) => {
  try {
    const { electionId } = req.params;
    
    const election = await Election.findById(electionId)
      .populate('candidates.candidateId', 'name department year')
      .populate('clubId', 'name');
      
    if (!election) {
      return res.status(404).json({ message: 'Election not found' });
    }

    const currentDate = new Date();
    if (currentDate <= election.endDate) {
      return res.status(400).json({ message: 'Results are not available until the election has ended.' });
    }

    res.json(election);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
