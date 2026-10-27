import Message from '../models/Message.js';
import Club from '../models/Club.js';
import { notifyClubMembers } from '../utils/notify.js';

// @desc    Get all messages for a club
// @route   GET /api/messages/:clubId
// @access  Private
const getMessages = async (req, res) => {
  try {
    const club = await Club.findById(req.params.clubId);
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    // Check if user is a member, club leader, or system admin
    const userIdStr = req.user._id.toString();
    const isMember = club.members.some(id => id.toString() === userIdStr);
    const isClubLeader = (club.presidentId && club.presidentId.toString() === userIdStr) ||
                         (club.facultyId && club.facultyId.toString() === userIdStr);
    const isGlobalAdmin = req.user.role === 'admin';

    if (!isMember && !isClubLeader && !isGlobalAdmin) {
      return res.status(403).json({ message: 'Not authorized to view messages for this club' });
    }

    const messages = await Message.find({ clubId: req.params.clubId })
      .populate('sender', 'name')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send a message to a club
// @route   POST /api/messages/:clubId
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const club = await Club.findById(req.params.clubId);
    
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    // Check if user is a member, club leader, or system admin
    const userIdStr = req.user._id.toString();
    const isMember = club.members.some(id => id.toString() === userIdStr);
    const isClubLeader = (club.presidentId && club.presidentId.toString() === userIdStr) ||
                         (club.facultyId && club.facultyId.toString() === userIdStr);
    const isGlobalAdmin = req.user.role === 'admin';

    if (!isMember && !isClubLeader && !isGlobalAdmin) {
      return res.status(403).json({ message: 'Not authorized to send messages to this club' });
    }

    const message = await Message.create({
      sender: req.user._id,
      clubId: req.params.clubId,
      text
    });

    const populatedMessage = await message.populate('sender', 'name');

    // Socket.io emit to active chat room
    const io = req.app.get('io');
    if (io) {
      io.to(req.params.clubId).emit('newMessage', populatedMessage);
    }

    // Send notifications to club members
    const senderName = req.user.name || 'A member';
    const previewText = text.length > 55 ? text.substring(0, 52) + '...' : text;
    notifyClubMembers(io, {
      club,
      senderId: req.user._id,
      message: `💬 ${senderName} in ${club.name}: "${previewText}"`,
      type: 'club_message',
      link: `/chat`
    }).catch((err) => console.error('Notification dispatch error:', err));

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getMessages, sendMessage };
