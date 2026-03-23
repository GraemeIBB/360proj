const express = require('express');
const router = express.Router();
const User = require('../models/User');

// GET /users
router.get('/', async (req, res, next) => {
  try {
    const users = await User.find().select('-__v');
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

// POST /users
router.post('/', async (req, res, next) => {
  try {
    const { firstName, lastName, email, userName, password } = req.body;

    if (!firstName || !lastName || !email || !userName || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existing_email = await User.findOne({ email });
    if (existing_email) {
      return res.status(409).json({ message: 'A user with that email already exists' });
    }

    const existing_username = await User.findOne({ userName });
    if (existing_username) {
      return res.status(409).json({ message: 'A user with that username already exists' });
    }

    const user = new User({ firstName, lastName, email, userName, password });
    console.log("Saving user:", user);
    await user.save();
    console.log("User saved successfully:", user);

    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
