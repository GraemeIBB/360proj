const bcrypt = require('bcrypt');
const mongoose = require('mongoose');
const { getBucket } = require('../config/gridfs');

// Repository layer for database interactions
const userRepository = require('../repositories/userRepository');

async function createUserService(userData, file) {
	const { firstName, lastName, email, location, username, password, isAdmin } = userData;

	// Check if user already exists (email or username)
	const existingUser = await userRepository.findUserByEmailOrUsername(email, username);
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


async function deleteUserService(userId, actor) {
	// Only the account owner or an admin can delete this user.
	const user = await userRepository.findUserById(userId);
	if (!user) {
		const err = new Error('User not found');
		err.code = 404;
		throw err;
	}
	if (!actor || (user._id.toString() !== actor.id && !actor.admin)) {
		const err = new Error('Unauthorized');
		err.code = 403;
		throw err;
	}
	await userRepository.deleteUserById(userId);
	return { message: 'User deleted successfully' };
}

async function searchUserService(filters) {
	// Build query for search
	const query = {};
	if (filters.firstName) query.firstName = { $regex: filters.firstName, $options: 'i' };
	if (filters.lastName) query.lastName = { $regex: filters.lastName, $options: 'i' };
	if (filters.email) query.email = { $regex: filters.email, $options: 'i' };
	if (filters.username) query.username = { $regex: filters.username, $options: 'i' };
	if (filters.location) query.location = { $regex: filters.location, $options: 'i' };
	if (filters.isAdmin !== undefined) query.admin = filters.isAdmin;
	if (filters.q) {
		const searchRegex = { $regex: filters.q, $options: 'i' };
		query.$or = [
			{ firstName: searchRegex },
			{ lastName: searchRegex },
			{ email: searchRegex },
			{ username: searchRegex },
			{ location: searchRegex },
		];
	}
	return userRepository.searchUsers(query);
}

async function updateUserService(id, updateObj) {
	// If password is being updated, hash it
	if (updateObj.password) {
		updateObj.password = await bcrypt.hash(updateObj.password, 10);
	}
	const allowedFields = ['username', 'email', 'password', 'location'];
	const update = {};
	for (const key of allowedFields) {
		if (updateObj[key] !== undefined) update[key] = updateObj[key];
	}
	const updatedUser = await userRepository.updateUserById(id, update);
	if (!updatedUser) {
		const err = new Error('User not found');
		err.code = 404;
		throw err;
	}
	return updatedUser;
}

async function getUserByIdService(key) {
	// Support both ObjectId and username for finding user
	const query = mongoose.Types.ObjectId.isValid(key)
		? { _id: key }
		: { username: key };
	const user = await userRepository.findUserByQuery(query);
	if (!user) {
		const err = new Error('User not found');
		err.code = 404;
		throw err;
	}
	return user;
}

async function uploadProfilePictureService(id, actorId, file) {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		const err = new Error('Invalid user id');
		err.code = 400;
		throw err;
	}
	if (!actorId || !mongoose.Types.ObjectId.isValid(actorId)) {
		const err = new Error('Authentication required');
		err.code = 401;
		throw err;
	}
	if (!file) {
		const err = new Error('No image file uploaded');
		err.code = 400;
		throw err;
	}
	// Only self or admin
	const actor = await userRepository.findUserById(actorId);
	if (!actor) {
		const err = new Error('Authentication required');
		err.code = 401;
		throw err;
	}
	if (actorId.toString() !== id.toString() && !actor.admin) {
		const err = new Error('Unauthorized');
		err.code = 403;
		throw err;
	}
	const fileId = new mongoose.Types.ObjectId();
	await new Promise((resolve, reject) => {
		const uploadStream = getBucket().openUploadStreamWithId(fileId, file.originalname, {
			metadata: { contentType: file.mimetype },
		});
		uploadStream.on('finish', resolve);
		uploadStream.on('error', reject);
		uploadStream.end(file.buffer);
	});
	const profilePicturePath = `/users/image/${fileId}`;
	const user = await userRepository.updateUserById(id, { profilePicture: profilePicturePath });
	if (!user) {
		const err = new Error('User not found');
		err.code = 404;
		throw err;
	}
	return {
		message: 'Profile picture updated',
		profilePicture: user.profilePicture,
		user,
	};
}

module.exports = {
	createUserService,
	deleteUserService,
	searchUserService,
	updateUserService,
	getUserByIdService,
	uploadProfilePictureService,
};
