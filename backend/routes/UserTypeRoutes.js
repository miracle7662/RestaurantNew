const express = require('express');
const router = express.Router();
const controller = require('../controllers/UserTypeController');

router.get('/', controller.getUserType);
router.post('/', controller.addUserType);
router.put('/:id', controller.updateUserType);
router.delete('/:id', controller.deleteUserType);

module.exports = router;
