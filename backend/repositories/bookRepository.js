const Book = require('../models/Book');

async function createBook(bookObj) {
    return Book.create(bookObj);
}

async function findBookById(id) {
    return Book.findById(id);
}

async function deleteBookById(id) {
    return Book.findByIdAndDelete(id);
}

async function updateBookById(id, update) {
    return Book.findByIdAndUpdate(
        id,
        { $set: update },
        { new: true, runValidators: true, context: 'query' }
    );
}

async function searchBooks(query) {
    return Book.find(query).populate('owner', 'username');
}

module.exports = {
    createBook,
    findBookById,
    deleteBookById,
    updateBookById,
    searchBooks,
};
