const express = require('express');
const router = express.Router();
const userController = require('../controller/userController');
const upload = require('../upload/upload');

// GET /users
router.get('/', userController.getAllUsers);

// GET /users/by-username/:id
router.get('/by-username/:id', userController.getUserById);

// GET /users/:id
router.get('/:id', userController.getUserById);


// PATCH /users/:id
router.patch('/:id', userController.updateUser);


// Serve user profile image from GridFS
const mongoose = require('mongoose');
const { getBucket } = require('../config/gridfs');
router.get('/image/:id', async (req, res) => {
	try {
		const fileId = req.params.id;
		if (!mongoose.Types.ObjectId.isValid(fileId)) {
			return res.status(400).json({ error: 'Invalid image id' });
		}
		const bucket = getBucket();
		const files = await bucket.find({ _id: new mongoose.Types.ObjectId(fileId) }).toArray();
		if (!files || files.length === 0) {
			return res.status(404).json({ error: 'Image not found' });
		}
		res.set('Content-Type', files[0].metadata?.contentType || 'image/jpeg');
		bucket.openDownloadStream(new mongoose.Types.ObjectId(fileId)).pipe(res);
	} catch (err) {
		res.status(500).json({ error: err.message });
	}
});

// POST /users (with profile image upload)
router.post('/', upload.single('profileImage'), userController.createUser);

module.exports = router;
