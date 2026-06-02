const express = require('express');
const router = express.Router();
const controller = require('../controllers/guestController');
const { uploadGuestDocuments } = require('../../../middleware/upload');
const path = require('path');

// Guest routes
router.get('/', controller.getGuests);
router.get('/:id', controller.getGuest);
router.post('/', controller.addGuest);
router.put('/:id', controller.updateGuest);
router.delete('/:id', controller.deleteGuest);

// Document routes with file upload middleware
router.get('/:guestId/documents', controller.getDocuments);
router.get('/:guestId/documents/:id', controller.getDocument);
router.post('/:guestId/documents', uploadGuestDocuments, controller.addDocument);
router.put('/:guestId/documents/:id', uploadGuestDocuments, controller.updateDocument);
router.delete('/:guestId/documents/:id', controller.deleteDocument);

module.exports = router;