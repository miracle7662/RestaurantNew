const express = require('express');
const router = express.Router();
const { getKitchenAllocation, getItemDetails } = require('../controllers/KitchenAllocationController');

// Route to get kitchen allocation data
router.get('/', getKitchenAllocation);

// Route to get item details
router.get('/item-details/:item_no', getItemDetails);

module.exports = router;
