const express = require('express');
const router = express.Router();
const controller = require('../controllers/DesignationController');

router.get('/', controller.getDesignation);
router.post('/', controller.addDesignation);
router.put('/:id', controller.updateDesignation);
router.delete('/:id', controller.deleteDesignation);

module.exports = router;
