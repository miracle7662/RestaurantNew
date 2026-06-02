const express = require('express');
const router = express.Router();
const controller = require('../controllers/arrivedController');

router.get('/', controller.getArrived);
router.post('/', controller.addArrived);

module.exports = router;