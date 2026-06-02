const express = require('express');
const router = express.Router();
const controller = require('../controllers/travelagentcontroller');

router.get('/', controller.getTravelAgents);
router.post('/', controller.addTravelAgent);
router.put('/:id', controller.updateTravelAgent);
router.delete('/:id', controller.deleteTravelAgent);

module.exports = router;
