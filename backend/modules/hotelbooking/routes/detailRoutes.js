const express = require('express');
const router = express.Router();
const controller = require('../controllers/detailController');

router.get('/', controller.getDetails);
router.get('/:id', controller.getDetailById);
router.post('/', controller.addDetail);
router.post('/bulk', controller.addDetailBulk);
router.post('/extension', controller.addExtensionDetail);  // NEW: For day extension
router.put('/:id', controller.updateDetail);
router.delete('/:id', controller.deleteDetail);

module.exports = router;