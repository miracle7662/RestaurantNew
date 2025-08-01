const express = require('express');
const router = express.Router();
const controller = require('../controllers/messagemasterController');

router.get('/', controller.getMessageMaster);
router.post('/', controller.addMessageMaster);
router.put('/:id', controller.updateMessageMaster);
router.delete('/:id', controller.deleteMessageMaster);

module.exports = router; 