const mongoose = require('mongoose');
const { getBucket } = require('../config/gridfs');
const bookRepository = require('../repositories/bookRepository');
const User = require('../models/User');

async function createBookService(bookData, file, ownerId) {
    // Upload image to GridFS if a file was included, otherwise use Book.png as default.
    let coverImage = null;
    if (file) {
        const fileId = new mongoose.Types.ObjectId();
        await new Promise((resolve, reject) => {
            const uploadStream = getBucket().openUploadStreamWithId(fileId, file.originalname, {
                metadata: { contentType: file.mimetype },
            });
            uploadStream.on('finish', resolve);
            uploadStream.on('error', reject);
            uploadStream.end(file.buffer);
        });
        coverImage = `/books/image/${fileId}`;
    } else {
        coverImage = null; // Or set a default image path if needed
    }
    const newBook = await bookRepository.createBook({
        ...bookData,
        owner: ownerId,
        coverImage,
    });
    return newBook;
}

async function deleteBookService(bookId, actorId) {
    const actor = await User.findById(actorId).select('admin');
    if (!actor) {
        const err = new Error('Authentication required');
        err.code = 401;
        throw err;
    }
    const book = await bookRepository.findBookById(bookId);
    if (!book) {
        const err = new Error('Book not found');
        err.code = 404;
        throw err;
    }
    if (book.owner.toString() !== actorId.toString() && !actor.admin) {
        const err = new Error('Unauthorized');
        err.code = 403;
        throw err;
    }
    await bookRepository.deleteBookById(bookId);
    return { message: 'Book deleted successfully' };
}

async function updateBookService(id, updateObj, actorId) {
    const [book, actor] = await Promise.all([
        bookRepository.findBookById(id),
        User.findById(actorId).select('admin'),
    ]);
    if (!book) {
        const err = new Error('Book not found');
        err.code = 404;
        throw err;
    }
    if (book.owner.toString() !== actorId && !actor?.admin) {
        const err = new Error('Unauthorized');
        err.code = 403;
        throw err;
    }
    const allowedFields = [
        'title', 'author', 'description', 'publishedDate', 'isbn', 'genre', 'condition', 'price', 'coverImage', 'isAvailable'
    ];
    const update = {};
    for (const key of allowedFields) {
        if (updateObj[key] !== undefined) update[key] = updateObj[key];
    }
    const updatedBook = await bookRepository.updateBookById(id, update);
    if (!updatedBook) {
        const err = new Error('Book not found');
        err.code = 404;
        throw err;
    }
    return updatedBook;
}

async function getAllBooksService() {
    return bookRepository.searchBooks({ isAvailable: true });
}

async function getBookByIdService(id) {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        const err = new Error('Invalid book id');
        err.code = 400;
        throw err;
    }
    const book = await bookRepository.findBookById(id);
    if (!book) {
        const err = new Error('Book not found');
        err.code = 404;
        throw err;
    }
    return book;
}

async function searchBooksService(filters) {
    let query = { isAvailable: true };
    if (filters.title) query.title = { $regex: filters.title, $options: 'i' };
    if (filters.isbn) query.isbn = { $regex: filters.isbn, $options: 'i' };
    if (filters.genre) query.genre = filters.genre;
    if (filters.minPrice || filters.maxPrice) {
        query.price = {};
        if (filters.minPrice) query.price.$gte = filters.minPrice;
        if (filters.maxPrice) query.price.$lte = filters.maxPrice;
    }
    if (filters.startDate || filters.endDate) {
        query.publishedDate = {};
        if (filters.startDate) query.publishedDate.$gte = filters.startDate;
        if (filters.endDate) query.publishedDate.$lte = filters.endDate;
    }
    if (filters.author) query.author = { $regex: filters.author, $options: 'i' };
    if (filters.owner && mongoose.Types.ObjectId.isValid(filters.owner)) query.owner = filters.owner;
    return bookRepository.searchBooks(query);
}

module.exports = {
    createBookService,
    deleteBookService,
    updateBookService,
    getAllBooksService,
    getBookByIdService,
    searchBooksService,
};
