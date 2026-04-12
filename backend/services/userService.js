const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { getBucket } = require('../config/gridfs');

// Repository layer for database interactions
const userRepository = require('../repositories/userRepository');

async function createUserService(userData, file) {
	const { firstName, lastName, email, location, username, password, isAdmin } = userData;

	// Check if user already exists (email or username)
	const existingUser = await userRepository.findUserByUsername(username);
	if (existingUser) {
		const err = new Error('User already exists');
		err.code = 409;
		throw err;
	}

	// Hash password
	const hashedPassword = await bcrypt.hash(password, 10);

	// Create user object
	let newUser = await userRepository.createUser({
		firstName,
		lastName,
		email,
		location,
		username,
		password: hashedPassword,
		admin: isAdmin
	});

	// If a profile image was uploaded, store it in GridFS and attach the path.
	if (file) {
		const fileId = new mongoose.Types.ObjectId();
		await new Promise((resolve, reject) => {
			const uploadStream = getBucket().openUploadStreamWithId(fileId, file.originalname, {
				metadata: { contentType: file.mimetype },
			});
			uploadStream.on('finish', resolve);
			uploadStream.on('error', reject);
			uploadStream.end(file.buffer);
		});
		newUser.profilePicture = `/users/image/${fileId}`;
		await newUser.save();
	}

	// Return user without password field
	const userResponse = newUser.toObject();
	delete userResponse.password;
	return userResponse;
}

module.exports = {
	createUserService,
};
