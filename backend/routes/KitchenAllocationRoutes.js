const express = require('express');
const router = express.Router();
const { getKitchenAllocation } = require('../controllers/KitchenAllocationController');

// Route to get kitchen allocation data
router.get('/', getKitchenAllocation);

module.exports = router;
