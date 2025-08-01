const express = require('express');
const router = express.Router();
const controller = require('../controllers/KitchenCategoryController');

router.get('/', controller.getKitchenCategory);
router.post('/', controller.addKitchenCategory);
router.put('/:id', controller.updateKitchenCategory);
router.delete('/:id', controller.deleteKitchenCategory);

module.exports = router;
