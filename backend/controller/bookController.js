const Book = require("../models/Book");
const mongoose = require("mongoose");
const Joi = require("joi");

// Request payload validation for creating a listing.
const createBookSchema = Joi.object({
    title: Joi.string().trim().required(),
    author: Joi.string().trim().required(),
    description: Joi.string().trim().required(),
    publishedDate: Joi.date().optional(),
    isbn: Joi.string().trim().optional(),
    condition: Joi.string().valid("new", "like new", "good", "fair").optional(),
    price: Joi.number().min(0).required(),
});

// Query validation for optional search filters.
const searchBooksSchema = Joi.object({
    title: Joi.string().trim().optional(),
    isbn: Joi.string().trim().optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    author: Joi.string().trim().optional(),
});


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
      condition,
      price
        } = value; // Use validated/sanitized request values.

    const newBook = await Book.create({ // Wait for the create operation to complete.
      title,
      author,
      description,
      publishedDate,
      isbn,
      condition,
      price,
            // Owner comes from authenticated user context.
      owner: req.user.id, 
            // Save uploaded image path when a file was attached.
      coverImage: req.file ? req.file.path : null
    });

        res.status(201).json(newBook); // 201 Created + created book payload.

  } catch (err) {
        res.status(500).json({ error: err.message }); // Unexpected server error.
  }
};

exports.deleteBook = async (req, res) => {
    try{
        // Reject malformed ids before querying MongoDB.
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid book id" });
        }

        const book = await Book.findById(req.params.id);
        if(!book){
            return res.status(404).json({ error: "Book not found" });
        }
        // Allow delete for owner or admin only.
        if(book.owner.toString() !== req.user.id && !req.user.admin){
            return res.status(403).json({ error: "Unauthorized" });
    }
        // Hard delete the selected book document.
        await Book.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Book deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

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

        const { title, isbn, minPrice, maxPrice, startDate, endDate, author } = value;

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
