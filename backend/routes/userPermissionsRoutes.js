const express = require('express');
const router = express.Router();

const {
    getUserPermissions
} = require('../controllers/userPermissionsController');

router.get('/user/:userid', getUserPermissions);

module.exports = router;