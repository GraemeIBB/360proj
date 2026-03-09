var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});
router.post('/login', function(req, res, next) {
    const { username, password } = req.body;
    console.log(username, password);

    if (password != "password") {
        res.status(401).json({ message: 'wrong password', username });
    } else {
        res.status(200).json({ message: 'logged in!', username })
    }
})

module.exports = router;
