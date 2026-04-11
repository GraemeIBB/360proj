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


// CREATE BOOK
exports.createBook = async (req, res) => { 
  try {
        // Validate payload before touching DB.
        // .validate() checks req.body against createBookSchema and returns { error, value }.
        const { error, value } = createBookSchema.validate(req.body, {
            // false = collect all validation issues instead of stopping at the first one.
            abortEarly: false,
            // true = remove fields not defined in the schema.
            stripUnknown: true,
                        // No convert option here, so createBook keeps strict type checking.
        });

        if (error) {
            return res.status(400).json({
                error: "Invalid createBook payload",
                details: error.details.map((d) => d.message),//takes detailed error objects
                                                            //->readable messages
            });
        }

        const {
      title,
      author,
      description,
      publishedDate,
      isbn,
            genre,
      condition,
      price
        } = value; // Use validated/sanitized request values.

        // Prefer authenticated identity when available, otherwise allow explicit owner id from request payload.
        const ownerId = req.user?.id || req.body.owner || req.body.userId;
        if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
            return res.status(400).json({ error: "Missing or invalid owner id" });
        }


        // Upload image to GridFS if a file was included, otherwise use Book.png as default.
        let coverImage = null;
        if (req.file) {
            const fileId = new mongoose.Types.ObjectId();
            await new Promise((resolve, reject) => {
                const uploadStream = getBucket().openUploadStreamWithId(fileId, req.file.originalname, {
                    metadata: { contentType: req.file.mimetype },
                });
                uploadStream.on('finish', resolve);
                uploadStream.on('error', reject);
                uploadStream.end(req.file.buffer);
            });
            coverImage = `/books/image/${fileId}`;
        } else {
            // Use static Book.png in public/images as default
            coverImage = '/images/Book.png';
        }

        const newBook = await Book.create({
            title,
            author,
            description,
            publishedDate,
            isbn,
            genre,
            condition,
            price,
            owner: ownerId,
            coverImage,
        });

        res.status(201).json(newBook); // 201 Created + created book payload.

  } catch (err) {
        res.status(500).json({ error: err.message }); // Unexpected server error.
  }
};

exports.deleteBook = async (req, res) => {
    try{
        const actorId = req.user?.id || req.headers['x-user-id'];
        if (!actorId || !mongoose.Types.ObjectId.isValid(actorId)) {
            return res.status(401).json({ error: "Authentication required" });
        }

        const actor = await User.findById(actorId).select('admin');
        if (!actor) {
            return res.status(401).json({ error: "Authentication required" });
        }

        // Reject malformed ids before querying MongoDB.
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid book id" });
        }

        const book = await Book.findById(req.params.id);
        if(!book){
            return res.status(404).json({ error: "Book not found" });
        }
        // Allow delete for owner or admin only.
        if(book.owner.toString() !== actorId.toString() && !actor.admin){
            return res.status(403).json({ error: "Unauthorized" });
    }
        // Hard delete the selected book document.
        await Book.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Book deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// PATCH /books/:id - Update book fields
exports.updateBook = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid book id' });
    }

    // Validate input
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
        const [book, actor] = await Promise.all([
            Book.findById(id),
            User.findById(actorId).select('admin'),
        ]);
        if (!book) {
            return res.status(404).json({ error: 'Book not found' });
        }
        if (book.owner.toString() !== actorId && !actor?.admin) {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        // Only allow updating allowed fields
        const allowedFields = [
            'title', 'author', 'description', 'publishedDate', 'isbn', 'genre', 'condition', 'price', 'coverImage', 'isAvailable'
        ];
        const update = {};
        for (const key of allowedFields) {
            if (value[key] !== undefined) update[key] = value[key];
        }

        const updatedBook = await Book.findByIdAndUpdate(
            id,
            { $set: update },
            { new: true, runValidators: true, context: 'query' }
        );

        if (!updatedBook) {
            return res.status(404).json({ error: 'Book not found after update' });
        }
        res.status(200).json({ message: 'Book updated', book: updatedBook });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAllBooks = async (req, res) => {
    try{
        // Return only currently available books.
        const books = await Book.find({ isAvailable: true }).populate('owner', 'username');
        // Populate owner with username for easier frontend rendering.
        res.status(200).json(books); // Send available books as JSON.
    }catch (err) {
        res.status(500).json({ error: err.message });
    }
}
exports.getBookById = async (req, res) => {
    try{
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid book id" });
        }
        const book = await Book.findById(req.params.id).populate('owner', 'username email');
        if(!book){
            return res.status(404).json({ error: "Book not found" });
        }
        
        res.status(200).json(book);
    }catch (err) {
        res.status(500).json({ error: err.message });
    }
}
exports.searchBooks = async (req, res) => {
    try{
        // Validate search filters before constructing query.
        // .validate() checks req.query against searchBooksSchema and returns { error, value }.
        const { error, value } = searchBooksSchema.validate(req.query, {
            // false = return all query validation issues in one response.
            abortEarly: false,
            // true = coerce compatible values (for example, "10" -> 10, date strings -> Date).
            convert: true,
            // true = drop query params that are not in searchBooksSchema.
            stripUnknown: true,
        });

        if (error) {
            return res.status(400).json({
                error: "Invalid searchBooks query",
                details: error.details.map((d) => d.message),
            });
        }

        const { title, isbn, genre, minPrice, maxPrice, startDate, endDate, author } = value;

        if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
            return res.status(400).json({
                error: "Invalid price range",
                details: ["minPrice cannot be greater than maxPrice"],
            });
        }

        if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
            return res.status(400).json({
                error: "Invalid date range",
                details: ["startDate cannot be later than endDate"],
            });
        }

            // Start with availability and add optional filters below.
            let query = { isAvailable: true }; //only shows available books
            if (title) {
                query.title = { $regex: title, $options: 'i' }; //case-insensitive regex search for title
            }
            if (isbn) {
                query.isbn = isbn; //exact match for isbn
            }
            if (genre) {
                query.genre = genre; //exact match for normalized genre values
            }
            // Price range filter.
            if(minPrice || maxPrice){
                query.price = {};
                if(minPrice !== undefined && !Number.isNaN(Number(minPrice))) 
                    query.price.$gte = Number(minPrice); // Greater than or equal to minPrice.
                if(maxPrice !== undefined && !Number.isNaN(Number(maxPrice))) 
                    query.price.$lte = Number(maxPrice); // Less than or equal to maxPrice.
                if (Object.keys(query.price).length === 0) 
                    delete query.price;
            }
            // Published date range filter.
            if(startDate || endDate){
                query.publishedDate = {};
                if(startDate) query.publishedDate.$gte = new Date(startDate); // Greater than or equal to startDate.
                if(endDate) query.publishedDate.$lte = new Date(endDate);   // Less than or equal to endDate.
            }
            if(author){
                query.author = { $regex: author, $options: 'i' }; // Case-insensitive regex search for author.
            }
            // Include owner username for frontend display.
            const books = await Book.find(query).populate('owner', 'username'); // Include owner's username in results.
            res.status(200).json(books);    
        
}catch (err) {
        res.status(500).json({ error: err.message });
      }
}

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
