const express = require('express');
const router = express.Router();
const controller = require('../controllers/fragmentController');

router.get('/', controller.getFragments);
router.post('/', controller.addFragment);
router.put('/:id', controller.updateFragment);
router.delete('/:id', controller.deleteFragment);

module.exports = router;