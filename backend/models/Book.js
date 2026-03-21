const mongoose = require('mongoose');
const User = require('./User');
const bookSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    author:{
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
        required: false ,
    },
    isbn: {
        type: String,
        required: false,
    },
    condition: { 
    type: String, 
    enum: ["new", "like new", "good", "fair"],
    default: "good"
  },
  price:{
    type: Number,
    required: true,
  },
  coverImage: {
    type: String, // store URL
    default: null
  }, User: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  timesatmp: true


});

module.exports = mongoose.model('Book', bookSchema);    