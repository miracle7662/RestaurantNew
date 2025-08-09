const express = require("express");
const router = express.Router();
const menuController = require("../controllers/mstrestmenuController");

// Get all + Get by ID
router.get("/", menuController.getAllMenuItems);
router.get("/:id", menuController.getMenuItemById);

// Create & Update with details
router.post("/", menuController.createMenuItemWithDetails);
router.put("/:id", menuController.updateMenuItemWithDetails);

// Delete
router.delete("/:id", menuController.deleteMenuItem);

module.exports = router;