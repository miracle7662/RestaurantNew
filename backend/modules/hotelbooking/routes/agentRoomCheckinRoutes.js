// agentRoomCheckinRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/agentRoomCheckinController');

// CREATE agent room checkin (only when travel agent selected)
router.post('/', controller.createAgentRoomCheckin);

// GET by checkin_id
router.get('/checkin/:checkin_id', controller.getAgentRoomCheckinByCheckinId);

// GET by guest_id
router.get('/guest/:guest_id', controller.getAgentRoomCheckinByGuestId);

// UPDATE
router.put('/:id', controller.updateAgentRoomCheckin);

// DELETE
router.delete('/:id', controller.deleteAgentRoomCheckin);

module.exports = router;