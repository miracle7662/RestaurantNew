const express = require('express');
const router = express.Router();
const controller = require('../controllers/marketsController');

router.get('/', controller.getmarkets);
router.post('/', controller.addmarkets);
router.put('/:id', controller.updatemarkets);
router.delete('/:id', controller.deletemarkets);

module.exports = router;
