const express = require('express');
const router = express.Router();
const controller = require('../controllers/companyController');

router.get('/', controller.getCompanies);
router.get('/:id', controller.getCompany);
router.post('/', controller.addCompany);
router.put('/:id', controller.updateCompany);
router.delete('/:id', controller.deleteCompany);

module.exports = router;