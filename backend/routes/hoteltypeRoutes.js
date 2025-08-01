const express = require('express');
const router = express.Router();
const controller = require('../controllers/hoteltypeController');

router.get('/', controller.gethoteltype);
router.post('/', controller.addhoteltype);
router.put('/:id', controller.updatehoteltype);
router.delete('/:id', controller.deletehoteltype);

module.exports = router;
