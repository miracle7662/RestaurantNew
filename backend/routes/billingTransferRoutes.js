const express = require("express");
const router = express.Router();

const {
  getDepartments,
  getBills,
  getBillDetails,
  updateBillQty
  
} = require("../controllers/billingTransferController");

router.get("/departments", getDepartments);
router.get("/bills", getBills);
router.get("/bill-details/:txnid", getBillDetails);
/* ───── UPDATE + RECALCULATE ───── */
router.post("/bill-details/update-qty", updateBillQty);

module.exports = router;