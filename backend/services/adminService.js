const adminRepository = require('../repositories/adminRepository');
const mongoose = require('mongoose');

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function getUsersService(q, searchBy) {
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
            const ownerIds = await adminRepository.findBookOwnerIdsByBookFields(regex);
            if (ownerIds.length > 0) {
                clauses.push({ _id: { $in: ownerIds } });
            }
        }
        if (clauses.length === 0) {
            return [];
        }
        query = { $or: clauses };
    }
    return adminRepository.findUsers(query);
}

async function setUserDisabledService(id, isDisabled, actorId) {
    if (actorId && actorId.toString() === id.toString()) {
        const err = new Error('You cannot disable your own account');
        err.code = 400;
        throw err;
    }
    const user = await adminRepository.updateUserDisabledStatus(id, isDisabled);
    if (!user) {
        const err = new Error('User not found');
        err.code = 404;
        throw err;
    }
    return {
        message: isDisabled ? 'User disabled' : 'User enabled',
        user,
    };
}

async function getStatsService(usageFilter) {
    const createdAtMatch = usageFilter.createdAt ? { createdAt: usageFilter.createdAt } : {};
    const [totalUsers, totalBooks, genreBreakdown, conditionBreakdown, availableCount] = await Promise.all([
        adminRepository.countUsers(createdAtMatch),
        adminRepository.countBooks(createdAtMatch),
        adminRepository.aggregateBooks([
            ...(usageFilter.createdAt ? [{ $match: { createdAt: usageFilter.createdAt } }] : []),
            { $group: { _id: '$genre', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),
        adminRepository.aggregateBooks([
            ...(usageFilter.createdAt ? [{ $match: { createdAt: usageFilter.createdAt } }] : []),
            { $group: { _id: '$condition', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]),
        adminRepository.countBooks({ isAvailable: true, ...createdAtMatch }),
    ]);
    return {
        totalUsers,
        totalBooks,
        availableBooks: availableCount,
        unavailableBooks: totalBooks - availableCount,
        genreBreakdown,
        conditionBreakdown,
        filterLabel: usageFilter.label,
    };
}

module.exports = {
    getUsersService,
    setUserDisabledService,
    getStatsService,
};
