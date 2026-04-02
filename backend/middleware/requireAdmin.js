const User = require('../models/User');
const mongoose = require('mongoose');

module.exports = async (req, res, next) => {
    const userId = req.headers['x-user-id'];
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    const user = await User.findById(userId).select('admin');
    if (!user || !user.admin) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    req.adminUser = user;
    next();
};
