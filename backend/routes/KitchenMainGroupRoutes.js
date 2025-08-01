const express = require('express');
const router = express.Router();
const controller = require('../controllers/KitchenMainGroupController');

router.get('/', controller.getKitchenMainGroup);
router.post('/', controller.addKitchenMainGroup);
router.put('/:id', controller.updateKitchenMainGroup);
router.delete('/:id', controller.deleteKitchenMainGroup);

module.exports = router;
