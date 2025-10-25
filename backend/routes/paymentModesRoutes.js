const express = require("express");
const router = express.Router();
const Controller = require("../controllers/paymentModeController");

// Payment modes CRUD
router.post("/", Controller.createPaymentMode);
router.get("/", Controller.getAllPaymentModes);
router.get("/by-outlet", Controller.getPaymentModesByOutlet);
router.put("/:id", Controller.updatePaymentMode);
router.put("/sequence", Controller.updatePaymentModeSequence); // New route for sequence update
router.delete("/:id", Controller.deletePaymentMode);



// Payment types list
router.get("/types", Controller.getPaymentTypes);

module.exports = router;
