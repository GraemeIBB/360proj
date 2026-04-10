const express = require('express');
const router = express.Router();
const messageController = require('../controller/messageController');

// GET /messages/conversations — list of conversations for current user
router.get('/conversations', messageController.getConversations);

// GET /messages/thread/:otherId/:bookId — full thread between two users for a book
router.get('/thread/:otherId/:bookId', messageController.getThread);

// PATCH /messages/thread/:otherId/:bookId/read — mark thread as read
router.patch('/thread/:otherId/:bookId/read', messageController.markThreadRead);

// POST /messages — send a message
router.post('/', messageController.sendMessage);

module.exports = router;
