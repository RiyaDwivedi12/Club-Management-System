import Event from '../models/Event.js';
import Club from '../models/Club.js';

// @desc    Create a new event
// @route   POST /api/events
// @access  Private (President/Admin)
const createEvent = async (req, res) => {
  try {
    const { title, description, clubId, date, category, maxParticipants, poster } = req.body;

    // Verify club exists
    const club = await Club.findById(clubId);
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    const event = await Event.create({
      title,
      description,
      clubId,
      date,
      category,
      maxParticipants,
      poster: poster || '',
      participants: []
    });

    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all events
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
  try {
    const events = await Event.find({}).populate('clubId', 'name logo');
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get event by ID
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('clubId', 'name logo')
      .populate('participants', 'name email profilePicture');
      
    if (event) {
      res.json(event);
    } else {
      res.status(404).json({ message: 'Event not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Join an event
// @route   POST /api/events/:id/join
// @access  Private
const joinEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is already participating
    if (event.participants.includes(req.user._id)) {
      return res.status(400).json({ message: 'Already joined this event' });
    }

    // Check capacity
    if (event.maxParticipants > 0 && event.participants.length >= event.maxParticipants) {
      return res.status(400).json({ message: 'Event is full' });
    }

    event.participants.push(req.user._id);
    await event.save();

    res.status(200).json({ message: 'Successfully joined the event' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { createEvent, getEvents, getEventById, joinEvent };
