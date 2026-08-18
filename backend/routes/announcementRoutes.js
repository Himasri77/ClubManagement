const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, announcementController.getAllAnnouncements);
router.get('/:id', authenticateToken, announcementController.getAnnouncementById);
router.post('/', authenticateToken, announcementController.createAnnouncement);
router.put('/:id', authenticateToken, announcementController.updateAnnouncement);
router.delete('/:id', authenticateToken, announcementController.deleteAnnouncement);

module.exports = router;
