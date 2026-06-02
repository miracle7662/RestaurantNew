const express = require('express');
const router = express.Router();
const controller = require('../controllers/nationalityController');

router.get('/', controller.getNationalities);
router.post('/', controller.addNationality);
router.put('/:id', controller.updateNationality);
router.delete('/:id', controller.deleteNationality);

module.exports = router;