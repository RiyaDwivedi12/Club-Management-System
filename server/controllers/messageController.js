import Message from '../models/Message.js';
import Club from '../models/Club.js';
import User from '../models/User.js';
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

    const userIdStr = req.user._id.toString();
    const isMember = (club.members || []).some(id => id.toString() === userIdStr);
    const isClubLeader = (club.presidentId && club.presidentId.toString() === userIdStr) ||
                         (club.vicePresidentId && club.vicePresidentId.toString() === userIdStr) ||
                         (club.facultyId && club.facultyId.toString() === userIdStr);
    const isGlobalAdmin = req.user.role === 'admin';

    if (!isMember && !isClubLeader && !isGlobalAdmin) {
      return res.status(403).json({ message: 'Please join this club and complete your membership dues to access chat.' });
    }

    const messages = await Message.find({ clubId: req.params.clubId })
      .populate('sender', 'name role profilePicture')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send a message (Text, Image, or Reply)
// @route   POST /api/messages/:clubId
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { text, image, replyTo } = req.body;
    
    if (!text && !image) {
      return res.status(400).json({ message: 'Message text or image is required' });
    }

    const club = await Club.findById(req.params.clubId);
    if (!club) {
      return res.status(404).json({ message: 'Club not found' });
    }

    const userIdStr = req.user._id.toString();
    const isPresident = club.presidentId && club.presidentId.toString() === userIdStr;
    const isVicePresident = club.vicePresidentId && club.vicePresidentId.toString() === userIdStr;
    const isFaculty = club.facultyId && club.facultyId.toString() === userIdStr;
    const isGlobalAdmin = req.user.role === 'admin';
    const isClubLeader = isPresident || isVicePresident || isFaculty || isGlobalAdmin;

    // Check membership and approved dues
    const isMember = (club.members || []).some(id => id.toString() === userIdStr);
    if (!isMember && !isClubLeader) {
      return res.status(403).json({ message: 'You must be an approved club member to send messages.' });
    }

    // Permission check: if President & VP lock chat, only leaders can post
    if (club.allowAllToChat === false && !isClubLeader) {
      return res.status(403).json({ 
        message: 'Chat is currently in Announcement Mode. Only Club President and Vice-President can send messages.' 
      });
    }

    const messageData = {
      sender: req.user._id,
      clubId: req.params.clubId,
      text: text || '',
      image: image || ''
    };

    if (replyTo && (replyTo.text || replyTo.image || replyTo.senderName)) {
      messageData.replyTo = {
        messageId: replyTo.messageId,
        senderName: replyTo.senderName || '',
        text: replyTo.text || '',
        image: replyTo.image || ''
      };
    }

    const message = await Message.create(messageData);
    const populatedMessage = await message.populate('sender', 'name role profilePicture');

    // Socket.io emit to room
    const io = req.app.get('io');
    if (io) {
      io.to(req.params.clubId).emit('newMessage', populatedMessage);
    }

    // Send notifications to members
    const senderName = req.user.name || 'Member';
    const previewContent = text || (image ? '📷 Sent a photo' : 'New message');
    notifyClubMembers(io, {
      club,
      senderId: req.user._id,
      message: `💬 ${senderName} in ${club.name}: "${previewContent.substring(0, 50)}"`,
      type: 'club_message',
      link: `/chat?clubId=${club._id}`
    }).catch(err => console.error('Notify error:', err.message));

    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('sendMessage error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Toggle emoji reaction (Instagram double-tap heart)
// @route   POST /api/messages/:id/react
// @access  Private
const reactToMessage = async (req, res) => {
  try {
    const { emoji = '❤️' } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    const userIdStr = req.user._id.toString();
    const existingIndex = message.reactions.findIndex(r => r.userId.toString() === userIdStr && r.emoji === emoji);

    if (existingIndex > -1) {
      // Remove reaction if already reacted
      message.reactions.splice(existingIndex, 1);
    } else {
      // Add reaction
      message.reactions.push({
        emoji,
        userId: req.user._id,
        userName: req.user.name
      });
    }

    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(message.clubId.toString()).emit('messageReaction', {
        messageId: message._id,
        reactions: message.reactions
      });
    }

    res.json({ messageId: message._id, reactions: message.reactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update Chat Permission (President / Vice President toggle)
// @route   PUT /api/messages/:clubId/permission
// @access  Private (President / VP / Faculty / Admin)
const updateChatPermission = async (req, res) => {
  try {
    const { allowAllToChat } = req.body;
    const club = await Club.findById(req.params.clubId);
    if (!club) return res.status(404).json({ message: 'Club not found' });

    const userIdStr = req.user._id.toString();
    const isPresident = club.presidentId && club.presidentId.toString() === userIdStr;
    const isVicePresident = club.vicePresidentId && club.vicePresidentId.toString() === userIdStr;
    const isFaculty = club.facultyId && club.facultyId.toString() === userIdStr;
    const isAdmin = req.user.role === 'admin';

    if (!isPresident && !isVicePresident && !isFaculty && !isAdmin) {
      return res.status(403).json({ message: 'Only Club President, Vice-President, or Faculty can change chat permissions.' });
    }

    club.allowAllToChat = Boolean(allowAllToChat);
    await club.save();

    const io = req.app.get('io');
    if (io) {
      io.to(req.params.clubId).emit('chatPermissionChanged', {
        clubId: req.params.clubId,
        allowAllToChat: club.allowAllToChat
      });
    }

    res.json({
      message: club.allowAllToChat ? 'Chat is now open for all club members to chat and share photos!' : 'Chat is now restricted to President and Vice-President announcements only.',
      allowAllToChat: club.allowAllToChat
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getMessages, sendMessage, reactToMessage, updateChatPermission };
