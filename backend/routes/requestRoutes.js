const express = require('express');
const router = express.Router();
const membershipController = require('../controllers/membershipController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

// Global pending-requests queue — admin only. Club leads use
// GET /api/clubs/:id/requests instead (see clubRoutes.js).
router.get('/', authenticateToken, authorizeRole('admin'), membershipController.getAllRequests);

// Approve/reject — permission (admin or that club's lead) is checked
// inside the controller since it needs to look up the request's club first.
router.patch('/:id', authenticateToken, membershipController.reviewRequest);

module.exports = router;