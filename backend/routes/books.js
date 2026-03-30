const express = require('express');
const router = express.Router();

const bookController = require('../controller/bookController');

// CREATE BOOK
router.post('/', bookController.createBook);

// GET ALL BOOKS
router.get('/', bookController.getAllBooks);

// SEARCH BOOKS
router.get('/search', bookController.searchBooks);

//get book by id
router.get('/:id', bookController.getBookById);

// PATCH BOOK (update book data)
router.patch('/:id', bookController.updateBook);

// DELETE BOOK
router.delete('/:id', bookController.deleteBook);


module.exports = router;