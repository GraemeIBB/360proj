const mongoose = require('mongoose');
const bookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    publishedDate: {
      type: Date,
      required: false,
    },
    isbn: {
      type: String,
      required: false,
    },
    genre: {
      type: String,
      enum: ["fiction", "non-fiction", "mystery", "romance", "sci-fi", "fantasy", "other"],
      required: false,
    },
    condition: {
      type: String,
      enum: ["new", "like new", "good", "fair"],
      default: "good",
    },
    price: {
      type: Number,
      required: true,
    },
    coverImage: {
      type: String,
      default: null,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isAvailable: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Book', bookSchema);    