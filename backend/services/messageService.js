const messageRepository = require('../repositories/messageRepository');
const User = require('../models/User');
const Book = require('../models/Book');
const mongoose = require('mongoose');

async function sendMessageService(senderId, recipientId, bookId, body) {
    if (senderId === recipientId) {
        const err = new Error('Cannot message yourself');
        err.code = 400;
        throw err;
    }
    if (!mongoose.Types.ObjectId.isValid(recipientId) || !mongoose.Types.ObjectId.isValid(bookId)) {
        const err = new Error('Invalid recipientId or bookId');
        err.code = 400;
        throw err;
    }
    const [recipient, book] = await Promise.all([
        User.findById(recipientId).select('_id'),
        Book.findById(bookId).select('_id'),
    ]);
    if (!recipient) {
        const err = new Error('Recipient not found');
        err.code = 404;
        throw err;
    }
    if (!book) {
        const err = new Error('Book not found');
        err.code = 404;
        throw err;
    }
    return messageRepository.createMessage({ sender: senderId, recipient: recipientId, book: bookId, body });
}

async function getConversationsService(userId) {
    // Find all messages involving this user
    const messages = await messageRepository.findMessagesWithPopulate(
        { $or: [{ sender: userId }, { recipient: userId }] },
        { createdAt: -1 },
        [
            { path: 'sender', select: 'username profilePicture' },
            { path: 'recipient', select: 'username profilePicture' },
            { path: 'book', select: 'title coverImage' },
        ]
    );
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
    return Array.from(convMap.values());
}

async function getThreadService(userId, otherId, bookId) {
    if (!mongoose.Types.ObjectId.isValid(otherId) || !mongoose.Types.ObjectId.isValid(bookId)) {
        const err = new Error('Invalid otherId or bookId');
        err.code = 400;
        throw err;
    }
    return messageRepository.findMessagesWithPopulate(
        {
            book: bookId,
            $or: [
                { sender: userId, recipient: otherId },
                { sender: otherId, recipient: userId },
            ],
        },
        { createdAt: 1 },
        [
            { path: 'sender', select: 'username profilePicture' },
            { path: 'recipient', select: 'username profilePicture' },
        ]
    );
}

async function markThreadReadService(userId, otherId, bookId) {
    if (!mongoose.Types.ObjectId.isValid(otherId) || !mongoose.Types.ObjectId.isValid(bookId)) {
        const err = new Error('Invalid otherId or bookId');
        err.code = 400;
        throw err;
    }
    await messageRepository.updateManyMessages(
        { sender: otherId, recipient: userId, book: bookId, read: false },
        { read: true }
    );
    return { ok: true };
}

async function getUnreadCountService(userId) {
    return { count: await messageRepository.countUnreadMessages(userId) };
}

module.exports = {
    sendMessageService,
    getConversationsService,
    getThreadService,
    markThreadReadService,
    getUnreadCountService,
};
