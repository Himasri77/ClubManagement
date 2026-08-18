const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, eventController.getAllEvents);
router.get('/:id', authenticateToken, eventController.getEventById);
router.post('/', authenticateToken, eventController.createEvent);
router.put('/:id', authenticateToken, eventController.updateEvent);
router.post('/:id/register', authenticateToken, eventController.registerForEvent);
router.post('/:id/cancel', authenticateToken, eventController.cancelRegistration);
router.get('/:id/registrations', authenticateToken, eventController.getEventRegistrations);

module.exports = router;
