const express = require('express');
const router = express.Router();
const controller = require('../controllers/zoneController');

router.get('/', controller.getZones);
router.post('/', controller.addZone);
router.put('/:id', controller.updateZone);
router.delete('/:id', controller.deleteZone);

module.exports = router;