const User = require('../models/User');
const Book = require('../models/Book');
const mongoose = require('mongoose');
const { getBucket } = require('../config/gridfs');

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

exports.getUsers = async (req, res) => {
    try {
        const q = (req.query.q || '').trim();
        const searchBy = (req.query.searchBy || 'all').trim().toLowerCase();

        if (!['all', 'name', 'email', 'post'].includes(searchBy)) {
            return res.status(400).json({ error: 'Invalid searchBy value' });
        }

        let query = {};
        if (q) {
            const regex = new RegExp(escapeRegex(q), 'i');
            const clauses = [];

            if (searchBy === 'all' || searchBy === 'name') {
                clauses.push(
                    { firstName: regex },
                    { lastName: regex },
                    { username: regex }
                );
            }

            if (searchBy === 'all' || searchBy === 'email') {
                clauses.push({ email: regex });
            }

            if (searchBy === 'all' || searchBy === 'post') {
                const ownerIds = await Book.find({
                    $or: [
                        { title: regex },
                        { author: regex },
                        { description: regex },
                        { isbn: regex },
                    ],
                }).distinct('owner');

                if (ownerIds.length > 0) {
                    clauses.push({ _id: { $in: ownerIds } });
                }
            }

            if (clauses.length === 0) {
                return res.status(200).json([]);
            }

            query = { $or: clauses };
        }

        const users = await User.find(query).select('-password -__v').sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.setUserDisabled = async (req, res) => {
    try {
        const { id } = req.params;
        const { isDisabled } = req.body;
        const actorId = req.headers['x-user-id'];

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid user id' });
        }

        if (typeof isDisabled !== 'boolean') {
            return res.status(400).json({ error: 'isDisabled must be a boolean' });
        }

        if (actorId && actorId.toString() === id.toString()) {
            return res.status(400).json({ error: 'You cannot disable your own account' });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { $set: { isDisabled } },
            { new: true, runValidators: true }
        ).select('-password -__v');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({
            message: isDisabled ? 'User disabled' : 'User enabled',
            user,
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
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
