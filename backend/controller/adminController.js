const User = require('../models/User');
const Book = require('../models/Book');
const mongoose = require('mongoose');
const { getBucket } = require('../config/gridfs');

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password -__v').sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getStats = async (req, res) => {
    try {
        const [totalUsers, totalBooks, genreBreakdown, conditionBreakdown, availableCount] = await Promise.all([
            User.countDocuments(),
            Book.countDocuments(),
            Book.aggregate([
                { $group: { _id: '$genre', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            Book.aggregate([
                { $group: { _id: '$condition', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            Book.countDocuments({ isAvailable: true }),
        ]);

        res.status(200).json({
            totalUsers,
            totalBooks,
            availableBooks: availableCount,
            unavailableBooks: totalBooks - availableCount,
            genreBreakdown,
            conditionBreakdown,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getStorage = async (req, res) => {
    try {
        // GridFS storage: sum of all stored image file sizes
        const files = await getBucket().find({}).toArray();
        const gridfsBytes = files.reduce((sum, f) => sum + (f.length || 0), 0);

        // MongoDB database stats (dataSize = uncompressed logical size)
        const dbStats = await mongoose.connection.db.command({ dbStats: 1, scale: 1 });

        res.status(200).json({
            gridfsFiles: files.length,
            gridfsBytes,
            dbDataSize: dbStats.dataSize,
            dbStorageSize: dbStats.storageSize,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
