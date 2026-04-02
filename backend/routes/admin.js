const express = require('express');
const router = express.Router();
const requireAdmin = require('../middleware/requireAdmin');
const adminController = require('../controller/adminController');

router.use(requireAdmin);

router.get('/users', adminController.getUsers);
router.get('/stats', adminController.getStats);
router.get('/storage', adminController.getStorage);

module.exports = router;
