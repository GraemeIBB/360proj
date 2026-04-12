const Message = require('../models/Message');

async function createMessage(msgObj) {
    return Message.create(msgObj);
}

async function findMessages(query, sort = { createdAt: -1 }) {
    return Message.find(query).sort(sort);
}

async function findMessagesWithPopulate(query, sort = { createdAt: -1 }, populateFields = []) {
    let q = Message.find(query).sort(sort);
    for (const field of populateFields) {
        q = q.populate(field.path, field.select);
    }
    return q;
}

async function updateManyMessages(filter, update) {
    return Message.updateMany(filter, update);
}

async function countUnreadMessages(recipientId) {
    return Message.countDocuments({ recipient: recipientId, read: false });
}

module.exports = {
    createMessage,
    findMessages,
    findMessagesWithPopulate,
    updateManyMessages,
    countUnreadMessages,
};
