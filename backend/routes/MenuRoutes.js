const express = require('express');
const router = express.Router();
const controller = require('../controllers/MenuController');

router.get('/', controller.getMenu);
router.post('/', controller.addMenu);
router.put('/:id', controller.updateMenu);
router.delete('/:id', controller.deleteMenu);

module.exports = router;
