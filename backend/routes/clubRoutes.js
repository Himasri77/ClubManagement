const express = require('express');
const router = express.Router();
const clubController = require('../controllers/clubController');
const membershipController = require('../controllers/membershipController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/', authenticateToken, clubController.getAllClubs);
router.get('/:id', authenticateToken, clubController.getClubById);
router.get('/:id/members', authenticateToken, clubController.getClubMembers);
router.post('/', authenticateToken, clubController.createClub);
router.put('/:id', authenticateToken, clubController.updateClub);
router.patch('/:id/status', authenticateToken, authorizeRole('admin'), clubController.reviewClubStatus);

// Membership requests scoped to a club
router.post('/:id/join', authenticateToken, authorizeRole('student'), membershipController.requestToJoin);
router.get('/:id/my-request', authenticateToken, membershipController.getMyRequestStatus);
router.get('/:id/requests', authenticateToken, membershipController.getClubRequests);

module.exports = router;