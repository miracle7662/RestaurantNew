const express = require('express');
const router = express.Router();
const controller = require('../controllers/bookedByContactsController');

router.get('/', controller.getBookedByContacts);
router.get('/:id', controller.getBookedByContactById);
router.post('/', controller.addBookedByContact);
router.put('/:id', controller.updateBookedByContact);
router.delete('/:id', controller.deleteBookedByContact);

module.exports = router;