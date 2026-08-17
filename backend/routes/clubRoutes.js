const express = require('express');
const router = express.Router();
const clubController = require('../controllers/clubController');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

router.get('/', authenticateToken, clubController.getAllClubs);
router.get('/:id', authenticateToken, clubController.getClubById);
router.post('/', authenticateToken, clubController.createClub);
router.put('/:id', authenticateToken, clubController.updateClub);
router.patch('/:id/status', authenticateToken, authorizeRole('admin'), clubController.reviewClubStatus);

module.exports = router;