const Book = require("../models/Book");
const User = require("../models/User");
const mongoose = require("mongoose");
const Joi = require("joi");
const { getBucket } = require("../config/gridfs");
const path = require("path");

const MIME_MAP = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' };
const mimeFromFilename = (filename) => MIME_MAP[path.extname(filename).toLowerCase()] || 'application/octet-stream';

// Request payload validation for creating a listing.
const createBookSchema = Joi.object({
    title: Joi.string().trim().required(),
    author: Joi.string().trim().required(),
    description: Joi.string().trim().required(),
    publishedDate: Joi.date().optional(),
    isbn: Joi.string().trim().optional(),
    genre: Joi.string().trim().valid("fiction", "non-fiction", "mystery", "romance", "sci-fi", "fantasy", "other").optional(),
    condition: Joi.string().valid("new", "like new", "good", "fair").optional(),
    price: Joi.number().min(0).required(),
});

// Query validation for optional search filters.
const searchBooksSchema = Joi.object({
    title: Joi.string().trim().optional(),
    isbn: Joi.string().trim().optional(),
    genre: Joi.string().trim().valid("fiction", "non-fiction", "mystery", "romance", "sci-fi", "fantasy", "other").optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    author: Joi.string().trim().optional(),
    owner: Joi.string().trim().optional(),
});

// Validation schema for updating a book (at least one field required)
const updateBookSchema = Joi.object({
    title: Joi.string().trim(),
    author: Joi.string().trim(),
    description: Joi.string().trim(),
    publishedDate: Joi.date(),
    isbn: Joi.string().trim(),
    genre: Joi.string().trim().valid("fiction", "non-fiction", "mystery", "romance", "sci-fi", "fantasy", "other"),
    condition: Joi.string().valid("new", "like new", "good", "fair"),
    price: Joi.number().min(0),
    coverImage: Joi.string().trim(),
    isAvailable: Joi.boolean(),
}).min(1); // At least one field required


const bookService = require('../services/bookService');

// CREATE BOOK
exports.createBook = async (req, res) => {
    // Validate payload before touching DB.
    const { error, value } = createBookSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });
    if (error) {
        return res.status(400).json({
            error: "Invalid createBook payload",
            details: error.details.map((d) => d.message),
        });
    }
    const ownerId = req.user?.id || req.body.owner || req.body.userId;
    if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
        return res.status(400).json({ error: "Missing or invalid owner id" });
    }
    try {
        const newBook = await bookService.createBookService(value, req.file, ownerId);
        res.status(201).json(newBook);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteBook = async (req, res) => {
    const actorId = req.user?.id || req.headers['x-user-id'];
    if (!actorId || !mongoose.Types.ObjectId.isValid(actorId)) {
        return res.status(401).json({ error: "Authentication required" });
    }
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({ error: "Invalid book id" });
    }
    try {
        const result = await bookService.deleteBookService(req.params.id, actorId);
        res.status(200).json(result);
    } catch (err) {
        if (err.code === 401) {
            return res.status(401).json({ error: err.message });
        }
        if (err.code === 403) {
            return res.status(403).json({ error: err.message });
        }
        if (err.code === 404) {
            return res.status(404).json({ error: err.message });
        }
        res.status(500).json({ error: err.message });
    }
};

// PATCH /books/:id - Update book fields
exports.updateBook = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid book id' });
    }
    const { error, value } = updateBookSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });
    if (error) {
        return res.status(400).json({
            error: 'Invalid update payload',
            details: error.details.map((d) => d.message),
        });
    }
    const actorId = req.headers['x-user-id'];
    if (!actorId || !mongoose.Types.ObjectId.isValid(actorId)) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    try {
        const updatedBook = await bookService.updateBookService(id, value, actorId);
        res.status(200).json({ message: 'Book updated', book: updatedBook });
    } catch (err) {
        if (err.code === 401) {
            return res.status(401).json({ error: err.message });
        }
        if (err.code === 403) {
            return res.status(403).json({ error: err.message });
        }
        if (err.code === 404) {
            return res.status(404).json({ error: err.message });
        }
        res.status(500).json({ error: err.message });
    }
};

exports.getAllBooks = async (req, res) => {
    try {
        const books = await bookService.getAllBooksService();
        res.status(200).json(books);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.getBookById = async (req, res) => {
    try {
        const book = await bookService.getBookByIdService(req.params.id);
        res.status(200).json(book);
    } catch (err) {
        if (err.code === 400) {
            return res.status(400).json({ error: err.message });
        }
        if (err.code === 404) {
            return res.status(404).json({ error: err.message });
        }
        res.status(500).json({ error: err.message });
    }
};
exports.searchBooks = async (req, res) => {
    const { error, value } = searchBooksSchema.validate(req.query, {
        abortEarly: false,
        convert: true,
        stripUnknown: true,
    });
    if (error) {
        return res.status(400).json({
            error: "Invalid searchBooks query",
            details: error.details.map((d) => d.message),
        });
    }
    try {
        const books = await bookService.searchBooksService(value);
        res.status(200).json(books);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// GET /books/image/:id — stream a cover image from GridFS
exports.getBookImage = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid image id' });
        }
        const fileId = new mongoose.Types.ObjectId(req.params.id);
        const files = await getBucket().find({ _id: fileId }).toArray();
        if (!files.length) {
            return res.status(404).json({ error: 'Image not found' });
        }
        const contentType = files[0].metadata?.contentType || mimeFromFilename(files[0].filename);
        res.setHeader('Content-Type', contentType);
        getBucket().openDownloadStream(fileId).pipe(res);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
