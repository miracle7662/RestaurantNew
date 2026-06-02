const express = require('express');
const router = express.Router();
const controller = require('../controllers/room-categoryController');

// Public route for charge modes (used in dropdowns)
router.get('/modes', controller.getChargeModes);

// CRUD routes
router.get('/', controller.getCategories);
router.get('/:id', controller.getCategoryById);
router.post('/', controller.addCategory);
router.put('/:id', controller.updateCategory);
router.delete('/:id', controller.deleteCategory);

module.exports = router;