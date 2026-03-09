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
        res.status(201).json({ message: 'logged in!', username })
    }
});
const example = [
    {},
    {},
    {},
];
// GET /search?bookname=harrypotter&price=10...
//router.get('/search', function(req, res, next) {
//    const { bookname, genre, price, rating, year } = req.body
//    result = example;
//
//    if (bookname) {
//        result = result.filter(u => u.bookname.includes(bookname));
//    }
//    if (genre) {
//        result = result.filter(u => u.genre.includes(genre));
//    }
//    if (price) {
//        result = result.filter(u => u.bookname <= Number(price));
//    }
//    if (rating) {
//        result = result.filter(u => u.bookname >= Number(rating));
//    }
//    if (year) {
//        result = result.filter(u => u.bookname === Number(year));
//    }
//    if (result.length === 0) {
//        return res.status(404).json({ message: 'no results found' });
//    }
//    res.status(200).json({ results: result })
//})

module.exports = router;
