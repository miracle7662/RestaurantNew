const express = require('express');
const router = express.Router();
const controller = require('../controllers/TableManagementController');

router.get('/', controller.getTableManagement);
router.post('/', controller.addTableManagement);
router.put('/:id', controller.updateTableManagement);
router.delete('/:id', controller.deleteTableManagement);

module.exports = router;