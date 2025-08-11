const express = require('express');
const router = express.Router();
const itemGroupController = require('../controllers/itemGroupController');

// Get item groups that have menu items
router.get('/withmenuitems', itemGroupController.getItemGroupsWithMenuItems);

module.exports = router;
