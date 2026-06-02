// checkoutRoomChargesRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/checkoutRoomChargesController');

router.get('/', controller.getCheckoutRoomCharges);
router.get('/:id', controller.getCheckoutRoomChargeById);
router.get('/by-checkout/:checkout_id', controller.getCheckoutRoomChargesByCheckoutId);
router.delete('/:id', controller.deleteCheckoutRoomCharge);

module.exports = router;