const express = require('express');
const router = express.Router();
const controller = require('../controllers/documentTypeController');

// Document Type routes
router.get('/', controller.getDocumentTypes);
router.get('/:id', controller.getDocumentType);
router.post('/', controller.addDocumentType);
router.put('/:id', controller.updateDocumentType);
router.delete('/:id', controller.deleteDocumentType);

module.exports = router;

