const express = require('express');
const router = express.Router();
const OutletMenuController = require('../controllers/OutletMenuController');

// GET all outlet menus (filtered by hotelid)
router.get('/', OutletMenuController.getOutletMenus);

// Create new outlet menu
router.post('/', OutletMenuController.addOutletMenu);

// Update outlet menu
router.put('/:id', OutletMenuController.updateOutletMenu);

// Delete outlet menu
router.delete('/:id', OutletMenuController.deleteOutletMenu);

module.exports = router;

