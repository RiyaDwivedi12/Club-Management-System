import Attendance from '../models/Attendance.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import Certificate from '../models/Certificate.js';
import AuditLog from '../models/AuditLog.js';
import crypto from 'crypto';

// @desc    Generate or retrieve unique QR pass for user event registration
// @route   POST /api/attendance/pass
// @access  Private
export const generateEventPass = async (req, res) => {
  try {
    const { eventId, type = 'event' } = req.body;
    const userId = req.user._id;

    const event = await Event.findById(eventId).populate('clubId', 'name');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    let pass = await Attendance.findOne({ eventId, userId });
    if (!pass) {
      const code = `QR-${eventId.toString().slice(-4).toUpperCase()}-${userId.toString().slice(-4).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
      pass = await Attendance.create({
        type,
        eventId,
        userId,
        roll_no: req.user.roll_no || 'N/A',
        ticketCode: code,
        status: 'Registered'
      });

      // Ensure user is in event participants
      if (!event.participants.includes(userId)) {
        event.participants.push(userId);
        await event.save();
      }
    }

    res.json({
      pass,
      event: {
        id: event._id,
        title: event.title,
        date: event.date,
        clubName: event.clubId?.name || 'College Club',
        category: event.category
      },
      user: {
        name: req.user.name,
        roll_no: req.user.roll_no,
        department: req.user.department
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Scan QR Code or ticketCode to check in attendee
// @route   POST /api/attendance/check-in
// @access  Private (Coordinator, President, Faculty, Admin)
export const scanQrCheckIn = async (req, res) => {
  try {
    const { ticketCode, eventId } = req.body;

    if (!ticketCode) {
      return res.status(400).json({ message: 'Ticket code or QR scan data required' });
    }

    const query = { ticketCode: ticketCode.trim().toUpperCase() };
    if (eventId) {
      query.eventId = eventId;
    }

    const attendance = await Attendance.findOne(query)
      .populate('userId', 'name roll_no email department')
      .populate('eventId', 'title date clubId');

    if (!attendance) {
      return res.status(404).json({ 
        success: false,
        message: 'Invalid or unrecognized QR Pass. No matching registration found.' 
      });
    }

    // Check if already checked in
    if (attendance.status === 'Attended') {
      return res.status(400).json({
        success: false,
        alreadyCheckedIn: true,
        message: `Already checked in on ${new Date(attendance.checkedInAt).toLocaleTimeString()}`,
        student: attendance.userId,
        checkedInAt: attendance.checkedInAt
      });
    }

    attendance.status = 'Attended';
    attendance.checkedInAt = new Date();
    attendance.checkedInBy = req.user._id;
    await attendance.save();

    await AuditLog.create({
      action: 'QR_CHECKIN_SUCCESS',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      targetType: 'Attendance',
      targetId: attendance._id,
      details: {
        student: attendance.userId?.name,
        roll_no: attendance.userId?.roll_no,
        event: attendance.eventId?.title,
        ticketCode: attendance.ticketCode
      },
      status: 'SUCCESS'
    });

    res.json({
      success: true,
      message: `Verified! Check-in successful for ${attendance.userId?.name} (${attendance.userId?.roll_no || 'No Roll No'})`,
      attendance,
      student: attendance.userId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get attendance records for an event
// @route   GET /api/attendance/event/:eventId
// @access  Private
export const getEventAttendance = async (req, res) => {
  try {
    const { eventId } = req.params;
    const records = await Attendance.find({ eventId })
      .populate('userId', 'name roll_no email department year')
      .populate('checkedInBy', 'name role')
      .sort({ status: 1, checkedInAt: -1 });

    const totalRegistered = records.length;
    const totalAttended = records.filter(r => r.status === 'Attended').length;
    const totalAbsent = totalRegistered - totalAttended;

    res.json({
      records,
      stats: {
        totalRegistered,
        totalAttended,
        totalAbsent,
        attendanceRate: totalRegistered > 0 ? Math.round((totalAttended / totalRegistered) * 100) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Bulk issue certificates to all verified attendees of an event
// @route   POST /api/attendance/event/:eventId/issue-certificates
// @access  Private (Admin, Faculty, President)
export const issueCertificatesToAttendees = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { certificateTitle = 'Certificate of Participation' } = req.body;

    const event = await Event.findById(eventId).populate('clubId', 'name');
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Find all attended records without certificates
    const eligibleAttendees = await Attendance.find({
      eventId,
      status: 'Attended',
      certificateIssued: { $ne: true }
    }).populate('userId');

    if (eligibleAttendees.length === 0) {
      return res.status(400).json({ message: 'No uncertified attendees found for this event.' });
    }

    let issuedCount = 0;
    for (const record of eligibleAttendees) {
      if (!record.userId) continue;

      const cert = await Certificate.create({
        student: record.userId._id,
        studentName: record.userId.name,
        roll_no: record.userId.roll_no || 'N/A',
        course: record.userId.department || 'GENERAL',
        academicYear: record.userId.year ? `Year ${record.userId.year}` : 'Year 1',
        title: `${certificateTitle} - ${event.title}`,
        club: event.clubId?._id,
        clubName: event.clubId?.name || 'CampusHub',
        eventName: event.title,
        issueDate: new Date(),
        issuedBy: req.user._id,
        issuerName: req.user.name,
        status: 'Issued'
      });

      record.certificateIssued = true;
      record.certificateId = cert._id;
      await record.save();
      issuedCount++;
    }

    await AuditLog.create({
      action: 'BULK_CERTIFICATES_ISSUED_ATTENDANCE',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      targetType: 'Event',
      targetId: eventId,
      details: { event: event.title, issuedCount },
      status: 'SUCCESS'
    });

    res.json({
      message: `Successfully issued ${issuedCount} certificates based on QR verified attendance!`,
      issuedCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user's passes
// @route   GET /api/attendance/my-passes
// @access  Private
export const getMyPasses = async (req, res) => {
  try {
    const passes = await Attendance.find({ userId: req.user._id })
      .populate({
        path: 'eventId',
        populate: { path: 'clubId', select: 'name logo' }
      })
      .sort({ createdAt: -1 });

    res.json(passes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
