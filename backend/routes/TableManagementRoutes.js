// backend/routes/TableManagementRoutes.js
const express = require("express");
const router = express.Router();

const TableManagementController = require("../controllers/TableManagementController");

// CRUD Routes
router.get("/", TableManagementController.getAllTables);           // Get all tables
router.post("/", TableManagementController.createTable);           // Create new table
router.put("/:tableid", TableManagementController.updateTable);    // Update table
router.put("/:tableid/status", TableManagementController.updateTableStatus); // Update table status
router.delete("/:tableid", TableManagementController.deleteTable); // Delete table

// Get all tables with their associated outlet names
router.get("/with-outlets", TableManagementController.getAllTablesWithOutlets);

// Create sub-table (e.g. 2A, 2B)
router.post("/sub-table", TableManagementController.createSubTable);


module.exports = router;
