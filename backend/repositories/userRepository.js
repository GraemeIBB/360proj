const User = require('../models/User');

async function findUserByUsername(username) {
	return User.findOne({ username });
}

async function createUser(userObj) {
	return User.create(userObj);
}

module.exports = {
	findUserByUsername,
	createUser,
};
