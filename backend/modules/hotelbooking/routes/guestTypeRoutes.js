const express = require('express');
const router = express.Router();
const controller = require('../controllers/guestTypeController');

// Guest Type routes
router.get('/', controller.getGuestTypes);
router.get('/:id', controller.getGuestType);
router.post('/', controller.addGuestType);
router.put('/:id', controller.updateGuestType);
router.delete('/:id', controller.deleteGuestType);

module.exports = router;