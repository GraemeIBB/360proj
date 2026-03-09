const express = require("express");
const router = express.Router();
const booksData = require("../data/books.json");

// GET search endpoint
router.get("/search", (req, res) => {
    const {
        q,
        title,
        author,
        genre,
        minRating,
        minPrice,
        maxPrice,
        year
    } = req.query;

    const hasAnyFilter = [q, title, author, genre, minRating, minPrice, maxPrice, year]
        .some(value => value !== undefined && String(value).trim() !== "");

    if (!hasAnyFilter) {
        return res.json([]);
    }

    let results = booksData.books;

    if (q) {
        const searchTerm = q.toLowerCase();
        results = results.filter(book =>
            book.title.toLowerCase().includes(searchTerm) ||
            book.writer.toLowerCase().includes(searchTerm) ||
            book.genre.toLowerCase().includes(searchTerm)
        );
    }

    if (title) {
        const titleTerm = title.toLowerCase();
        results = results.filter(book => book.title.toLowerCase().includes(titleTerm));
    }

    if (author) {
        const authorTerm = author.toLowerCase();
        results = results.filter(book => book.writer.toLowerCase().includes(authorTerm));
    }

    if (genre) {
        const genreTerm = genre.toLowerCase();
        results = results.filter(book => book.genre.toLowerCase().includes(genreTerm));
    }

    if (year) {
        const yearNum = Number(year);
        if (!Number.isNaN(yearNum)) {
            results = results.filter(book => Number(book.year) === yearNum);
        }
    }

    // Rating/price filters are optional; they only apply to books that have these fields.
    if (minRating) {
        const ratingNum = Number(minRating);
        if (!Number.isNaN(ratingNum)) {
            results = results.filter(book => Number(book.rating ?? 0) >= ratingNum);
        }
    }

    if (minPrice) {
        const minPriceNum = Number(minPrice);
        if (!Number.isNaN(minPriceNum)) {
            results = results.filter(book => Number(book.price ?? 0) >= minPriceNum);
        }
    }

    if (maxPrice) {
        const maxPriceNum = Number(maxPrice);
        if (!Number.isNaN(maxPriceNum)) {
            results = results.filter(book => Number(book.price ?? Number.POSITIVE_INFINITY) <= maxPriceNum);
        }
    }
    if (results.length === 0) {
        return res.status(404).json({ message: 'no results found' });
    }
    res.status(200).json({ results: results })
});

module.exports = router;
