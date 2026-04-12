const User = require('../models/User');
const mongoose = require('mongoose');
const Joi = require('joi');
const bcrypt = require('bcrypt');
const path = require('path');
const { getBucket } = require('../config/gridfs');

// Service layer for business logic
const userService = require('../services/userService');

const MIME_MAP = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' };
const mimeFromFilename = (filename) => MIME_MAP[path.extname(filename).toLowerCase()] || 'application/octet-stream';

// Request payload validation for creating a user.
const createUserSchema = Joi.object({
    firstName: Joi.string().trim().required(),
    lastName: Joi.string().trim().required(),
    email: Joi.string().trim().required(),
    location: Joi.string().trim().required(),
    username: Joi.string().trim().required(),
    password: Joi.string().trim().required(),
    isAdmin: Joi.boolean().optional().default(false),
});

const searchUserSchema = Joi.object({
    q: Joi.string().trim().optional(),
    firstName: Joi.string().trim().optional(),
    lastName: Joi.string().trim().optional(),
    location: Joi.string().trim().optional(),
    email: Joi.string().trim().optional(),
    username: Joi.string().trim().optional(),
    isAdmin: Joi.boolean().optional(),
});

const updateUserSchema = Joi.object({
    username: Joi.string().trim(),
    email: Joi.string().trim().email(),
    password: Joi.string().trim(),
    location: Joi.string().trim(),
}).min(1); // At least one field required

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
    const { error, value } = createUserSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });
    if (error) {
        return res.status(400).json({
            error: "Invalid createUser payload",
            details: error.details.map((d) => d.message),
        });
    }
    try {
        const userResponse = await userService.createUserService(value, req.file);
        res.status(201).json({
            message: "User created successfully",
            user: userResponse
        });
    } catch (err) {
        if (err.code === 409) {
            return res.status(409).json({
                error: "User already exists",
                details: ["Email or username already in use"]
            });
        }
        res.status(500).json({ error: err.message });
    }
};
exports.deleteUser = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Authentication required" });
        }
        const response = await userService.deleteUserService(req.params.id, req.user);
        return res.status(200).json(response);
    } catch (err) {
        if (err.code === 403) {
            return res.status(403).json({ error: err.message });
        }
        if (err.code === 404) {
            return res.status(404).json({ error: err.message });
        }
        if (err.code === 400) {
            return res.status(400).json({ error: err.message });
        }
        return res.status(500).json({ error: err.message });
    }
};

exports.searchUser = async (req, res) => {
    try {
        const { error, value } = searchUserSchema.validate(req.query, {
            abortEarly: false,
            convert: true,
            stripUnknown: true,
        });
        if (error) {
            return res.status(400).json({
                error: "Invalid searchUser query",
                details: error.details.map((d) => d.message),
            });
        }
        const users = await userService.searchUserService(value);
        res.status(200).json(users);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};

exports.updateUser = async (req, res) => {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: 'Invalid user id' });
    }
    const { error, value } = updateUserSchema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });
    if (error) {
        return res.status(400).json({
            error: 'Invalid update payload',
            details: error.details.map((d) => d.message),
        });
    }
    try {
        const updatedUser = await userService.updateUserService(id, value);
        res.status(200).json({ message: 'User updated', user: updatedUser });
    } catch (err) {
        if (err.code === 404) {
            return res.status(404).json({ error: err.message });
        }
        if (err.code === 11000) {
            return res.status(409).json({ error: 'Duplicate value' });
        }
        res.status(500).json({ error: err.message });
    }
};

exports.getUserById = async (req, res) => {
    try {
        const key = (req.params.id || '').trim();
        const user = await userService.getUserByIdService(key);
        res.status(200).json(user);
    } catch (err) {
        if (err.code === 404) {
            return res.status(404).json({ error: err.message });
        }
        res.status(500).json({ error: err.message });
    }
};

exports.uploadProfilePicture = async (req, res) => {
    try {
        const { id } = req.params;
        const actorId = req.headers['x-user-id'];
        const result = await userService.uploadProfilePictureService(id, actorId, req.file);
        return res.status(200).json(result);
    } catch (err) {
        if (err.code === 400) {
            return res.status(400).json({ error: err.message });
        }
        if (err.code === 401) {
            return res.status(401).json({ error: err.message });
        }
        if (err.code === 403) {
            return res.status(403).json({ error: err.message });
        }
        if (err.code === 404) {
            return res.status(404).json({ error: err.message });
        }
        return res.status(500).json({ error: err.message });
    }
};

exports.getUserImage = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid image id' });
        }

        const fileId = new mongoose.Types.ObjectId(req.params.id);
        const files = await getBucket().find({ _id: fileId }).toArray();
        if (!files.length) {
            return res.status(404).json({ error: 'Image not found' });
        }

        const contentType = files[0].metadata?.contentType || mimeFromFilename(files[0].filename);
        res.setHeader('Content-Type', contentType);
        getBucket().openDownloadStream(fileId).pipe(res);
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
};



