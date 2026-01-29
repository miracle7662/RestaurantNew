const express = require('express');
const router = express.Router();
const { getKitchenAllocationData, getFilterOptions } = require('../controllers/KitchenAllocationController');

// Route to get kitchen allocation data
router.get('/data', getKitchenAllocationData);

// Route to get filter options
router.get('/filters', getFilterOptions);

module.exports = router;
