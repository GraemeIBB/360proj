const User = require('../models/User');



async function createUser(userObj) {
	return User.create(userObj);
}

async function findUserById(id) {
	return User.findById(id);
}

async function deleteUserById(id) {
	return User.findByIdAndDelete(id);
}

async function updateUserById(id, update) {
	return User.findByIdAndUpdate(
		id,
		{ $set: update },
		{ new: true, runValidators: true, context: 'query' }
	);
}

async function searchUsers(query) {
	return User.find(query).select('-password -__v');
}

async function findUserByEmailOrUsername(email, username) {
	return User.findOne({
		$or: [{ email }, { username }]
	});
}

async function findUserByQuery(query) {
	return User.findOne(query).select('-password -__v');
}

module.exports = {
	createUser,
	findUserById,
	deleteUserById,
	updateUserById,
	searchUsers,
	findUserByEmailOrUsername,
	findUserByQuery,
};
