var express = require('express');
const User = require('../models/User');
var router = express.Router();
const bcrypt = require("bcrypt");

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate required credentials before touching the database.
    if (!username || !password) {
      return res.status(400).json({ message: 'username and password are required' });
    }

    // Lookup user by the username field.
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    // Compare plaintext password against stored bcrypt hash.
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    return res.status(200).json({
      message: 'Logged in!',
      username: user.username,
      userId: user._id,
      isAdmin: user.admin,
      profilePicture: user.profilePicture || '',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


module.exports = router;
