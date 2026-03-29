const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');

// GET /users
router.get('/', userController.getAllUsers);

// GET /users/by-username/:id
router.get('/by-username/:id', userController.getUserById);

// GET /users/:id
router.get('/:id', userController.getUserById);


// PATCH /users/:id
router.patch('/:id', userController.updateUser);

// POST /users
router.post('/', userController.createUser);

module.exports = router;
