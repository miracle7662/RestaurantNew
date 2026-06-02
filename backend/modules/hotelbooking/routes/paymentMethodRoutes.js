const express = require('express');
const router = express.Router();
const controller = require('../controllers/paymentMethodController');

router.get('/', controller.getPaymentMethods);
router.get('/:id', controller.getPaymentMethod);
router.post('/', controller.addPaymentMethod);
router.put('/:id', controller.updatePaymentMethod);
router.delete('/:id', controller.deletePaymentMethod);

module.exports = router;