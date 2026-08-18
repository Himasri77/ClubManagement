const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/admin', authenticateToken, authorizeRole('admin'), dashboardController.getAdminStats);
router.get('/student', authenticateToken, authorizeRole('student'), dashboardController.getStudentStats);

module.exports = router;