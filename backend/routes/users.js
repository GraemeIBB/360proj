const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const upload = require('../upload/upload');

// GET /users/image/:id
router.get('/image/:id', userController.getUserImage);

// GET /users
router.get('/', userController.getAllUsers);

// GET /users/by-username/:id
router.get('/by-username/:id', userController.getUserById);

// GET /users/:id
router.get('/:id', userController.getUserById);

// POST /users/:id/profile-picture
router.post('/:id/profile-picture', upload.single('profilePicture'), userController.uploadProfilePicture);


// PATCH /users/:id
router.patch('/:id', userController.updateUser);

// POST /users
router.post('/', userController.createUser);

module.exports = router;
