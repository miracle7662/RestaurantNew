const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentmethodcontroller');
// Route to get payment methods for India
router.get('/', paymentController.getPaymentMethods);

module.exports = router;