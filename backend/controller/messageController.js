const mongoose = require('mongoose');
const Joi = require('joi');
const messageService = require('../services/messageService');

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
  try {
    const msg = await messageService.sendMessageService(senderId, recipientId, bookId, body);
    return res.status(201).json(msg);
  } catch (err) {
    if (err.code === 400) return res.status(400).json({ error: err.message });
    if (err.code === 404) return res.status(404).json({ error: err.message });
    return res.status(500).json({ error: err.message });
  }
};

// GET /messages/conversations — list of distinct conversations for the current user
exports.getConversations = async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const conversations = await messageService.getConversationsService(userId);
    return res.json(conversations);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// GET /messages/thread/:otherId/:bookId — all messages in a thread (both directions)
exports.getThread = async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const { otherId, bookId } = req.params;
  try {
    const messages = await messageService.getThreadService(userId, otherId, bookId);
    return res.json(messages);
  } catch (err) {
    if (err.code === 400) return res.status(400).json({ error: err.message });
    return res.status(500).json({ error: err.message });
  }
};

// PATCH /messages/thread/:otherId/:bookId/read — mark all incoming messages in a thread as read
exports.markThreadRead = async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });
  const { otherId, bookId } = req.params;
  try {
    const result = await messageService.markThreadReadService(userId, otherId, bookId);
    return res.json(result);
  } catch (err) {
    if (err.code === 400) return res.status(400).json({ error: err.message });
    return res.status(500).json({ error: err.message });
  }
};

// GET /notif — unread message count for the current user
exports.getUnreadCount = async (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.json({ count: 0 });
  try {
    const result = await messageService.getUnreadCountService(userId);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
