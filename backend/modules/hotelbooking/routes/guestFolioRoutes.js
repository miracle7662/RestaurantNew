const express = require('express');
const router = express.Router();
const controller = require('../controllers/guestFolioController');

router.get('/', controller.getFolioEntries);
router.get('/:id', controller.getFolioEntryById);
router.post('/', controller.addFolioEntry);
router.post('/bulk', controller.addFolioEntryBulk);
router.put('/:id', controller.updateFolioEntry);
router.delete('/:id', controller.deleteFolioEntry);

module.exports = router;