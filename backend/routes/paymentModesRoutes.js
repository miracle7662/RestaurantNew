const express = require("express");
const router = express.Router();
const Controller = require("../controllers/paymentModeController");

// Payment modes CRUD
router.post("/", Controller.createPaymentMode);
router.get("/", Controller.getAllPaymentModes);

router.put("/:id", Controller.updatePaymentMode);
router.delete("/:id", Controller.deletePaymentMode);



// Payment types list
router.get("/types", Controller.getPaymentTypes);

module.exports = router;
