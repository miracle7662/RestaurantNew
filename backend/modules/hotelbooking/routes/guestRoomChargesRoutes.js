const express = require('express');
const router = express.Router();
const controller = require('../controllers/guestRoomChargesController');

router.get('/', controller.getCharges);
router.get('/:id', controller.getChargeById);
router.post('/', controller.addCharge);
router.post('/bulk', controller.addChargeBulk);
router.put('/:id', controller.updateCharge);
router.delete('/:id', controller.deleteCharge);

module.exports = router;