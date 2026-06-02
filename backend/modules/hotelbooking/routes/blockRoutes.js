// routes/blockRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/blockController');

router.get('/', controller.getBlocks);
router.post('/', controller.addBlock);
router.put('/:id', controller.updateBlock);
router.delete('/:id', controller.deleteBlock);

module.exports = router;