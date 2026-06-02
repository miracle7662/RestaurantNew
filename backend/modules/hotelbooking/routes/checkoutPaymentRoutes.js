// checkoutPaymentRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/checkoutPaymentController');

router.get('/', controller.getCheckoutPayments);
router.get('/:id', controller.getCheckoutPaymentById);
router.get('/by-checkout/:checkout_id', controller.getCheckoutPaymentsByCheckoutId);
router.post('/', controller.addCheckoutPayment);
router.delete('/:id', controller.deleteCheckoutPayment);

module.exports = router;