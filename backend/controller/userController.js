const User = require('../models/User');
const mongoose = require('mongoose');
const Joi = require('joi');
const bcrypt = require('bcrypt');

// Request payload validation for creating a user.
const createUserSchema = Joi.object({
    firstName: Joi.string().trim().required(),
    lastName: Joi.string().trim().required(),
    email: Joi.string().trim().required(),
    username: Joi.string().trim().required(),
    password: Joi.string().trim().required(),
    isAdmin: Joi.boolean().optional().default(false),
});

const searchUserSchema = Joi.object({
    q: Joi.string().trim().optional(),
    firstName: Joi.string().trim().optional(),
    lastName: Joi.string().trim().optional(),
    email: Joi.string().trim().optional(),
    username: Joi.string().trim().optional(),
    isAdmin: Joi.boolean().optional(),
});

exports.getAllUsers = async (req, res) => {
    try {
        // .select() is a field projection; prefixing with '-' excludes fields from output.
        const users = await User.find().select('-password -__v');
        return res.status(200).json({ users });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

exports.createUser = async (req, res) => {
    // Validate payload before touching DB.
        // .validate() checks req.body against createUserSchema and returns { error, value }.
        const { error, value } = createUserSchema.validate(req.body, {
            // false = collect all validation issues instead of stopping at the first one.
            abortEarly: false,
            // true = remove fields not defined in the schema.
            stripUnknown: true,
                        // No convert option here, so createUser keeps strict type checking.
        });

        if (error) {
            return res.status(400).json({
                error: "Invalid createUser payload",
                details: error.details.map((d) => d.message),//takes detailed error objects
                                                            //->readable messages
            });
        }

    try {
        const { firstName, lastName, email, username, password, isAdmin } = value;

        // Check if user already exists (email or username)
        const existingUser = await User.findOne({
            $or: [{ email }, { username }] //check if eitheremail or username
        });

        if (existingUser) {
            return res.status(409).json({ //request could not be completed 
                error: "User already exists",
                details: ["Email or username already in use"]
            });
        }

        // Hash password with 10 salt rounds (bcrypt standard)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save new user with hashed password
        const newUser = await User.create({
            firstName,
            lastName,
            email,
            username,
            password: hashedPassword,  // Store hashed, not plaintext
            admin: isAdmin
        });

        // Return user without password field
        const userResponse = newUser.toObject();
        delete userResponse.password;

        res.status(201).json({
            message: "User created successfully",
            user: userResponse
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }

}
exports.deleteUser = async (req, res) => {
    try {
        // Delete authorization depends on auth middleware attaching req.user.
        if (!req.user) {
            return res.status(401).json({ error: "Authentication required" });
        }

        // Prevent invalid ObjectId values from reaching MongoDB queries.
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: "Invalid user id" });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Only the account owner or an admin can delete this user.
        if (user._id.toString() !== req.user.id && !req.user.admin) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        await User.findByIdAndDelete(req.params.id);
        return res.status(200).json({ message: "User deleted successfully" });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

exports.searchUser = async (req, res) => {
    try{
         // Validate search filters before constructing query.
        // .validate() checks req.query against searchBooksSchema and returns { error, value }.
        const {error, value} = searchUserSchema.validate(req.query, {
            // false = return all query validation issues in one response.
            abortEarly: false,
              // true = coerce compatible values (for example, "10" -> 10, date strings -> Date).
            convert: true, 
             // true = drop query params that are not in searchBooksSchema.
            stripUnknown: true,
        });

        if (error) {
            return res.status(400).json({
                error: "Invalid searchUser query",
                details: error.details.map((d) => d.message),
            });
        }

        const { q, firstName, lastName, email, username, isAdmin} = value;

        const query = {};

        if (firstName) {
            // Case-insensitive partial match using MongoDB regex.
            query.firstName = { $regex: firstName, $options: 'i' };
        }
        if (lastName) {
            query.lastName = { $regex: lastName, $options: 'i' };
        }
        if (email) {
            query.email = { $regex: email, $options: 'i' };
        }
        if (username) {
            query.username = { $regex: username, $options: 'i' };
        }
        if (isAdmin !== undefined) {
            query.admin = isAdmin;
        }

        if (q) {
            const searchRegex = { $regex: q, $options: 'i' };
            // $or matches when any one of these fields contains the search term.
            query.$or = [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { email: searchRegex },
                { username: searchRegex },
            ];
        }

        // Exclude sensitive/internal fields from API output.
        const users = await User.find(query).select('-password -__v');
        res.status(200).json(users);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

exports.getUserById = async (req, res) => {
    try {
        const key = (req.params.id || '').trim();

        // Support both canonical ObjectId lookups and username fallback in one endpoint.
        // This helps when frontend stores username and/or when stale ids are encountered.
        const query = mongoose.Types.ObjectId.isValid(key)
            ? { _id: key }
            : { username: key };

        const user = await User.findOne(query).select('-password -__v');
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};



