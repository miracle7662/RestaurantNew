const express = require('express');
const router = express.Router();
const controller = require('../controllers/stateController');

router.get('/', controller.getStates);
router.post('/', controller.addState);
router.put('/:id', controller.updateState);
router.delete('/:id', controller.deleteState);

module.exports = router; 