const express = require('express');
const router = express.Router();
const taxGroupController = require('../controllers/msttaxgroupController');

// ✅ Use the correct controller function:
router.get('/', taxGroupController.getAllTaxGroups);
router.get('/:id', taxGroupController.getTaxGroupById);
router.post('/', taxGroupController.createTaxGroup);
router.put('/:id', taxGroupController.updateTaxGroup);
router.delete('/:id', taxGroupController.deleteTaxGroup);

module.exports = router;
