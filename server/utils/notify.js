import Notification from '../models/Notification.js';

/**
 * Creates a notification in MongoDB and immediately emits it via socket.io to the user's personal room.
 */
export const createAndSendNotification = async (io, { userId, message, type = 'general', link = '' }) => {
  if (!userId || !message) return null;
  try {
    const notification = await Notification.create({
      user: userId,
      message,
      type,
      link,
      isRead: false
    });

    if (io) {
      io.to(userId.toString()).emit('notification', notification);
    }
    return notification;
  } catch (err) {
    console.error('Error creating notification for user', userId, err);
    return null;
  }
};

/**
 * Sends a notification to all members, president, and faculty of a club (excluding the sender).
 */
export const notifyClubMembers = async (io, { club, senderId, message, type = 'club_message', link = '' }) => {
  if (!club || !message) return [];
  try {
    const recipientIds = new Set();

    // Club members
    if (Array.isArray(club.members)) {
      club.members.forEach((m) => {
        const id = m._id ? m._id.toString() : m.toString();
        recipientIds.add(id);
      });
    }

    // President
    if (club.presidentId) {
      const pId = club.presidentId._id ? club.presidentId._id.toString() : club.presidentId.toString();
      recipientIds.add(pId);
    }

    // Faculty coordinator
    if (club.facultyId) {
      const fId = club.facultyId._id ? club.facultyId._id.toString() : club.facultyId.toString();
      recipientIds.add(fId);
    }

    // Exclude sender
    if (senderId) {
      const sId = senderId._id ? senderId._id.toString() : senderId.toString();
      recipientIds.delete(sId);
    }

    if (recipientIds.size === 0) return [];

    const promises = Array.from(recipientIds).map(async (uid) => {
      try {
        const notif = await Notification.create({
          user: uid,
          message,
          type,
          link,
          isRead: false
        });

        if (io) {
          io.to(uid).emit('notification', notif);
        }
        return notif;
      } catch (e) {
        console.error('Failed to notify club member:', uid, e);
        return null;
      }
    });

    const results = await Promise.all(promises);
    return results.filter(Boolean);
  } catch (err) {
    console.error('Error notifying club members:', err);
    return [];
  }
};
