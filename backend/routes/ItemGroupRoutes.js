const express = require('express');
const router = express.Router();
const controller = require('../controllers/ItemGroupController');

router.get('/', controller.getItemGroup);
router.post('/', controller.addItemGroup);
router.put('/:id', controller.updateItemGroup);
router.delete('/:id', controller.deleteItemGroup);


module.exports = router;