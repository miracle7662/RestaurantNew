// backend/routes/TableManagementRoutes.js
const express = require("express");
const router = express.Router();

const TableManagementController = require("../controllers/TableManagementController");

// CRUD Routes
router.get("/", TableManagementController.getAllTables);           // Get all tables
router.post("/", TableManagementController.createTable);           // Create new table
router.put("/:tableid", TableManagementController.updateTable);    // Update table
router.delete("/:tableid", TableManagementController.deleteTable); // Delete table

module.exports = router;
