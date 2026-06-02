const express = require('express');
const router = express.Router();
const controller = require('../controllers/subDepartmentController');

// CRUD routes
router.get('/', controller.getSubDepartments);
router.get('/department/:departmentId', controller.getSubDepartmentsByDepartment);
router.get('/:id', controller.getSubDepartmentById);
router.post('/', controller.createSubDepartment);
router.put('/:id', controller.updateSubDepartment);
router.delete('/:id', controller.deleteSubDepartment);

module.exports = router;