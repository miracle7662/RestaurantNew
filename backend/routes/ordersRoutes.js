const express = require('express');
const router = express.Router();
const controller = require('../controllers/ordersController');

router.get('/taxes', controller.getTaxesByOutletAndDepartment);

module.exports = router;

