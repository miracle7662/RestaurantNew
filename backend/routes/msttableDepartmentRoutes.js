const express = require('express');
const router = express.Router();
const msttableDepartmentController = require('../controllers/msttableDepartmentController');

// Get all departments
router.get('/', msttableDepartmentController.getAllDepartments);

// Get a single department by ID
router.get('/:id', msttableDepartmentController.getDepartmentById);

// Create a new department
router.post('/', msttableDepartmentController.createDepartment);

// Update a department
router.put('/:id', msttableDepartmentController.updateDepartment);

// Delete a department
router.delete('/:id',  msttableDepartmentController.deleteDepartment);

module.exports = router;