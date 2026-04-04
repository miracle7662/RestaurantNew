const express = require("express");
const router = express.Router();
const menuController = require("../controllers/mstrestmenuController");
const menuExportController = require('../controllers/menuExportController');

const multer = require("multer");

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Get all + Get by ID
router.get("/", menuController.getAllMenuItems);

// Get max item number for auto-generation - MUST be before /:id route
router.get("/max-item-no", menuController.getMaxItemNo);

// Variant Types and Values - MUST be before /:id route
router.get("/variant-types-with-values", menuController.getAllVariantTypesWithValues);

// Export menu items to Excel
router.get("/export", menuExportController.exportMenuItems);

// Download sample template for import
router.get("/sample-template", menuExportController.downloadSampleTemplate);

// Import menu items from Excel
router.post("/import", upload.single("file"), menuExportController.importMenuItems);

router.get("/:id", menuController.getMenuItemById);

// Create & Update with details
router.post("/", menuController.createMenuItemWithDetails);
router.put("/:id", menuController.updateMenuItemWithDetails);

// Delete
router.delete("/:id", menuController.deleteMenuItem);

module.exports = router;

