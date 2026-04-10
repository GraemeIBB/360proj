const Message = require('../models/Message');
const User = require('../models/User');
const Book = require('../models/Book');
const mongoose = require('mongoose');
const Joi = require('joi');

const sendSchema = Joi.object({
  recipientId: Joi.string().required(),
  bookId: Joi.string().required(),
  body: Joi.string().trim().min(1).required(),
});

// POST /messages — send a message
exports.sendMessage = async (req, res) => {
  const senderId = req.headers['x-user-id'];
  if (!senderId) return res.status(401).json({ error: 'Not authenticated' });

  const { error, value } = sendSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) return res.status(400).json({ error: error.details.map(d => d.message).join(', ') });

  const { recipientId, bookId, body } = value;

  if (senderId === recipientId) return res.status(400).json({ error: 'Cannot message yourself' });

  if (!mongoose.Types.ObjectId.isValid(recipientId) || !mongoose.Types.ObjectId.isValid(bookId)) {
    return res.status(400).json({ error: 'Invalid recipientId or bookId' });
  }

  try {
    const [recipient, book] = await Promise.all([
      User.findById(recipientId).select('_id'),
      Book.findById(bookId).select('_id'),
    ]);
    if (!recipient) return res.status(404).json({ error: 'Recipient not found' });
    if (!book) return res.status(404).json({ error: 'Book not found' });

    const msg = await Message.create({ sender: senderId, recipient: recipientId, book: bookId, body });
    return res.status(201).json(msg);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET /messages/conversations — list of distinct conversations for the current user
// Each conversation = { otherUser, book, lastMessage, unreadCount }
exports.getConversations = async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  try {
    // Find all messages involving this user
    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }],
    })
      .sort({ createdAt: -1 })
      .populate('sender', 'username profilePicture')
      .populate('recipient', 'username profilePicture')
      .populate('book', 'title coverImage');

    // Group into conversations keyed by "otherId:bookId"
    const convMap = new Map();
    for (const msg of messages) {
      const otherUser = msg.sender._id.toString() === userId ? msg.recipient : msg.sender;
      const key = `${otherUser._id}:${msg.book._id}`;
      if (!convMap.has(key)) {
        convMap.set(key, {
          otherUser,
          book: msg.book,
          lastMessage: msg,
          unreadCount: 0,
        });
      }
      // Count unread messages sent to me in this conversation
      if (msg.recipient._id.toString() === userId && !msg.read) {
        convMap.get(key).unreadCount += 1;
      }
    }

    return res.json(Array.from(convMap.values()));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET /messages/thread/:otherId/:bookId — all messages in a thread (both directions)
exports.getThread = async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  const { otherId, bookId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(otherId) || !mongoose.Types.ObjectId.isValid(bookId)) {
    return res.status(400).json({ error: 'Invalid otherId or bookId' });
  }

  try {
    const messages = await Message.find({
      book: bookId,
      $or: [
        { sender: userId, recipient: otherId },
        { sender: otherId, recipient: userId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'username profilePicture')
      .populate('recipient', 'username profilePicture');

    return res.json(messages);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// PATCH /messages/thread/:otherId/:bookId/read — mark all incoming messages in a thread as read
exports.markThreadRead = async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  const { otherId, bookId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(otherId) || !mongoose.Types.ObjectId.isValid(bookId)) {
    return res.status(400).json({ error: 'Invalid otherId or bookId' });
  }

  try {
    await Message.updateMany(
      { sender: otherId, recipient: userId, book: bookId, read: false },
      { read: true }
    );
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET /notif — unread message count for the current user
exports.getUnreadCount = async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.json({ count: 0 });

  try {
    const count = await Message.countDocuments({ recipient: userId, read: false });
    return res.json({ count });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
