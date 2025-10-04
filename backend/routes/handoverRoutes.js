const express = require('express');
const router = express.Router();
const handoverController = require('../controllers/handoverController');

router.get('/data', handoverController.getHandoverData);

module.exports = router;
