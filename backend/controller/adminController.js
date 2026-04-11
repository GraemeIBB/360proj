const User = require('../models/User');
const Book = require('../models/Book');
const mongoose = require('mongoose');
const { getBucket } = require('../config/gridfs');

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildUsageDateFilter(query) {
    const range = (query.range || 'all').toLowerCase();
    const now = new Date();

    if (!['all', '7d', '30d', '90d', 'custom'].includes(range)) {
        throw new Error('Invalid range value');
    }

    if (range === 'all') {
        return { createdAt: null, label: 'All time' };
    }

    if (range === 'custom') {
        const startDate = query.startDate ? new Date(query.startDate) : null;
        const endDate = query.endDate ? new Date(query.endDate) : null;

        if (startDate && Number.isNaN(startDate.getTime())) {
            throw new Error('Invalid startDate value');
        }
        if (endDate && Number.isNaN(endDate.getTime())) {
            throw new Error('Invalid endDate value');
        }
        if (startDate && endDate && startDate > endDate) {
            throw new Error('startDate cannot be later than endDate');
        }

        const createdAt = {};
        if (startDate) createdAt.$gte = startDate;
        if (endDate) {
            const inclusiveEnd = new Date(endDate);
            inclusiveEnd.setHours(23, 59, 59, 999);
            createdAt.$lte = inclusiveEnd;
        }

        return {
            createdAt: Object.keys(createdAt).length ? createdAt : null,
            label: 'Custom range',
        };
    }

    const days = Number(range.replace('d', ''));
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - days);

    return {
        createdAt: { $gte: startDate, $lte: now },
        label: `Last ${days} days`,
    };
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
        const usageFilter = buildUsageDateFilter(req.query);
        const createdAtMatch = usageFilter.createdAt ? { createdAt: usageFilter.createdAt } : {};

        const [totalUsers, totalBooks, genreBreakdown, conditionBreakdown, availableCount] = await Promise.all([
            User.countDocuments(createdAtMatch),
            Book.countDocuments(createdAtMatch),
            Book.aggregate([
                ...(usageFilter.createdAt ? [{ $match: { createdAt: usageFilter.createdAt } }] : []),
                { $group: { _id: '$genre', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            Book.aggregate([
                ...(usageFilter.createdAt ? [{ $match: { createdAt: usageFilter.createdAt } }] : []),
                { $group: { _id: '$condition', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            Book.countDocuments({ isAvailable: true, ...createdAtMatch }),
        ]);

        res.status(200).json({
            totalUsers,
            totalBooks,
            availableBooks: availableCount,
            unavailableBooks: totalBooks - availableCount,
            genreBreakdown,
            conditionBreakdown,
            filterLabel: usageFilter.label,
        });
    } catch (err) {
        if (err.message.includes('Invalid') || err.message.includes('cannot be later')) {
            return res.status(400).json({ error: err.message });
        }
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
