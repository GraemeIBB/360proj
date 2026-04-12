const User = require('../models/User');
const Book = require('../models/Book');

async function findUsers(query) {
    return User.find(query).select('-password -__v').sort({ createdAt: -1 });
}

async function findBooksBySearchClauses(clauses) {
    return Book.find({ $or: clauses });
}

async function findBookOwnerIdsByBookFields(regex) {
    return Book.find({
        $or: [
            { title: regex },
            { author: regex },
            { description: regex },
            { isbn: regex },
        ],
    }).distinct('owner');
}

async function updateUserDisabledStatus(id, isDisabled) {
    return User.findByIdAndUpdate(
        id,
        { $set: { isDisabled } },
        { new: true, runValidators: true }
    ).select('-password -__v');
}

async function countUsers(match) {
    return User.countDocuments(match);
}

async function countBooks(match) {
    return Book.countDocuments(match);
}

async function aggregateBooks(pipeline) {
    return Book.aggregate(pipeline);
}

module.exports = {
    findUsers,
    findBooksBySearchClauses,
    findBookOwnerIdsByBookFields,
    updateUserDisabledStatus,
    countUsers,
    countBooks,
    aggregateBooks,
};
