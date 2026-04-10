var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
require('./loadEnvironment');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var booksRouter = require("./routes/books");
var adminRouter = require("./routes/admin");
var messagesRouter = require("./routes/messages");
const messageController = require('./controller/messageController');
var app = express();

// database connection
const mongoose = require('mongoose');
const { initBucket } = require('./config/gridfs');

if (!process.env.ATLAS_URI) {
  console.error('Missing ATLAS_URI. Create backend/.env with ATLAS_URI=<your MongoDB connection string>.');
} else {
  mongoose.connect(process.env.ATLAS_URI)
  .then(() => {
    console.log("MongoDB Connected");
    initBucket();
  })
  .catch(err => console.log(err));
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Enable CORS globally and set headers before any routes.
app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, x-user-id');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use("/books", booksRouter);
app.use("/admin", adminRouter);
app.use("/messages", messagesRouter);
app.get("/notif", messageController.getUnreadCount);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;
