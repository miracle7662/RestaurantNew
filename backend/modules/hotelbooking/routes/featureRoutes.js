const express = require('express');
const router = express.Router();
const controller = require('../controllers/featureController');

router.get('/', controller.getFeatures);
router.post('/', controller.addFeature);
router.put('/:id', controller.updateFeature);
router.delete('/:id', controller.deleteFeature);

module.exports = router;