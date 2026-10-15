import Venue from '../models/Venue.js';
import Booking from '../models/Booking.js';
import AuditLog from '../models/AuditLog.js';

// Pre-seed some default campus venues if database is fresh
const defaultVenues = [
  { name: 'APJ Abdul Kalam Grand Auditorium', type: 'Auditorium', capacity: 600, location: 'Admin Block, Ground Floor', isRestricted: true, features: ['Dual 4K Projectors', 'Surround Sound', 'Central AC', 'Stage Lighting'] },
  { name: 'Vikram Sarabhai Seminar Hall', type: 'Conference Hall', capacity: 150, location: 'Academic Block A, 2nd Floor', isRestricted: false, features: ['Smart Podium', 'Projector', 'Wi-Fi 6', 'AC'] },
  { name: 'Aryabhata Computing Lab 3', type: 'Lab', capacity: 80, location: 'CS Department, 1st Floor', isRestricted: true, features: ['80 High-End Workstations', 'LAN', 'UPS Backup'] },
  { name: 'Main Campus Cricket & Football Ground', type: 'Sports Ground', capacity: 1200, location: 'West Campus Sports Complex', isRestricted: false, features: ['Floodlights', 'Commentary Box', 'Dressing Rooms'] },
  { name: 'Indoor Badminton & Table Tennis Court', type: 'Sports Ground', capacity: 200, location: 'Student Activity Center', isRestricted: false, features: ['Synthetic Mat', 'Scoreboard'] },
  { name: 'Pro Audio-Visual PA Rig & Mics Kit', type: 'Equipment', capacity: 1, location: 'Media Room 12', isRestricted: true, features: ['Wireless Mics', 'Yamaha Mixer', 'Active Speakers'] }
];

// @desc    Get all venues & resources (auto-seeds defaults if empty)
// @route   GET /api/venues
// @access  Private
export const getAllVenues = async (req, res) => {
  try {
    let venues = await Venue.find().sort({ type: 1, name: 1 });
    if (venues.length === 0) {
      venues = await Venue.insertMany(defaultVenues);
    }
    res.json(venues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new venue or campus resource
// @route   POST /api/venues
// @access  Private (Admin only)
export const createVenue = async (req, res) => {
  try {
    const { name, type, capacity, location, isRestricted, features } = req.body;
    const existing = await Venue.findOne({ name });
    if (existing) {
      return res.status(400).json({ message: 'Venue with this name already exists' });
    }

    const venue = await Venue.create({
      name,
      type,
      capacity,
      location,
      isRestricted: Boolean(isRestricted),
      features: Array.isArray(features) ? features : (features ? features.split(',').map(s => s.trim()) : [])
    });

    await AuditLog.create({
      action: 'VENUE_CREATED',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      targetType: 'Venue',
      targetId: venue._id,
      details: { name, type, location },
      status: 'SUCCESS'
    });

    res.status(201).json(venue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Check availability for a venue in a time window
// @route   POST /api/venues/check-availability
// @access  Private
export const checkAvailability = async (req, res) => {
  try {
    const { venueId, startTime, endTime } = req.body;

    if (!venueId || !startTime || !endTime) {
      return res.status(400).json({ message: 'Venue ID, start time, and end time are required' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Overlapping condition: start < booking.endTime AND end > booking.startTime
    const conflicts = await Booking.find({
      venueId,
      status: { $in: ['Pending', 'Approved'] },
      startTime: { $lt: end },
      endTime: { $gt: start }
    }).populate('bookedBy', 'name email').populate('clubId', 'name');

    res.json({
      available: conflicts.length === 0,
      conflictCount: conflicts.length,
      conflicts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new venue booking request
// @route   POST /api/venues/bookings
// @access  Private
export const createBooking = async (req, res) => {
  try {
    const { venueId, clubId, title, startTime, endTime, purpose, equipmentRequested } = req.body;

    const venue = await Venue.findById(venueId);
    if (!venue) {
      return res.status(404).json({ message: 'Venue not found' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ message: 'End time must be after start time' });
    }

    // Overlap conflict check
    const existingConflict = await Booking.findOne({
      venueId,
      status: { $in: ['Pending', 'Approved'] },
      startTime: { $lt: end },
      endTime: { $gt: start }
    }).populate('bookedBy', 'name');

    if (existingConflict) {
      return res.status(409).json({
        message: `Conflict detected! "${venue.name}" is already reserved for "${existingConflict.title}" from ${new Date(existingConflict.startTime).toLocaleTimeString()} to ${new Date(existingConflict.endTime).toLocaleTimeString()}.`,
        conflict: existingConflict
      });
    }

    // Determine initial status: restricted venues require approval, others auto-approve
    const initialStatus = venue.isRestricted ? 'Pending' : 'Approved';

    const booking = await Booking.create({
      venueId,
      clubId,
      bookedBy: req.user._id,
      title,
      startTime: start,
      endTime: end,
      purpose,
      equipmentRequested: Array.isArray(equipmentRequested) ? equipmentRequested : [],
      status: initialStatus,
      equipmentReturned: venue.type !== 'Equipment'
    });

    await AuditLog.create({
      action: 'BOOKING_REQUESTED',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      targetType: 'Booking',
      targetId: booking._id,
      details: { title, venue: venue.name, status: initialStatus },
      status: 'SUCCESS'
    });

    res.status(201).json({
      message: initialStatus === 'Approved' ? 'Venue reserved successfully!' : 'Reservation submitted and pending administrative approval.',
      booking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all bookings
// @route   GET /api/venues/bookings
// @access  Private
export const getAllBookings = async (req, res) => {
  try {
    const { venueId, status } = req.query;
    const query = {};

    if (venueId && venueId !== 'all') query.venueId = venueId;
    if (status && status !== 'all') query.status = status;

    const bookings = await Booking.find(query)
      .populate('venueId', 'name type location isRestricted')
      .populate('clubId', 'name')
      .populate('bookedBy', 'name email role')
      .populate('approvedBy', 'name role')
      .sort({ startTime: -1 });

    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update booking approval status
// @route   PUT /api/venues/bookings/:id/status
// @access  Private (Admin / Faculty)
export const updateBookingStatus = async (req, res) => {
  try {
    const { status, approvalNotes } = req.body;
    const booking = await Booking.findById(req.params.id).populate('venueId', 'name');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    booking.status = status;
    booking.approvalNotes = approvalNotes || '';
    booking.approvedBy = req.user._id;
    await booking.save();

    await AuditLog.create({
      action: `BOOKING_${status.toUpperCase()}`,
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      targetType: 'Booking',
      targetId: booking._id,
      details: { title: booking.title, venue: booking.venueId?.name, status },
      status: 'SUCCESS'
    });

    res.json({ message: `Booking has been ${status}`, booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Cancel booking
// @route   PUT /api/venues/bookings/:id/cancel
// @access  Private
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.bookedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    booking.status = 'Cancelled';
    await booking.save();

    res.json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Mark equipment returned
// @route   PUT /api/venues/bookings/:id/equipment-return
// @access  Private (Admin / Coordinator)
export const markEquipmentReturned = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.equipmentReturned = true;
    await booking.save();

    res.json({ message: 'Equipment recorded as safely returned', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
