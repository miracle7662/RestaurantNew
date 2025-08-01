const express = require('express');
const router = express.Router();
const controller = require('../controllers/KitchenSubCategoryController');

router.get('/', controller.getKitchenSubCategory);
router.post('/', controller.addKitchenSubCategory);
router.put('/:id', controller.updateKitchenSubCategory);
router.delete('/:id', controller.deleteKitchenSubCategory);

module.exports = router;
