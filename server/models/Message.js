import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clubId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Club',
    required: true
  },
  text: {
    type: String,
    default: ''
  },
  image: {
    type: String, // Image URL or Base64 data
    default: ''
  },
  replyTo: {
    messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
    senderName: { type: String, default: '' },
    text: { type: String, default: '' },
    image: { type: String, default: '' }
  },
  reactions: [{
    emoji: { type: String, default: '❤️' },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: { type: String, default: '' }
  }]
}, {
  timestamps: true
});

const Message = mongoose.model('Message', messageSchema);

export default Message;
