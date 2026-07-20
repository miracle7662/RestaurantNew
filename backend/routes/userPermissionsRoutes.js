// routes/userPermissions.js
const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/userPermissionsController');

router.get( '/hotel-type/:hotel_type', ctrl.getModulesByHotelType);  // modules
router.get( '/user/:userid',           ctrl.getUserPermissions);
router.post('/user/:userid/save',      ctrl.saveUserPermissions);

module.exports = router;