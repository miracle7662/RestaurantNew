const express = require("express");
const router = express.Router();
const Controller = require("../controllers/paymentModeController");

// Payment modes CRUD
router.post("/", Controller.createPaymentMode);
router.get("/", Controller.getAllPaymentModes);
router.get("/:id", Controller.getPaymentModeById);
router.put("/:id", Controller.updatePaymentMode);
router.delete("/:id", Controller.deletePaymentMode);

// Outlets for dropdown
router.get("/dropdown/outlets", Controller.getOutlets);

module.exports = router;
