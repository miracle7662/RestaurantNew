const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");



 // -------------------------
// KOT PRINTER SETTINGS
 // -------------------------
 router.get("/kot-printer-settings/:id", settingsController.getKotPrinterSettings);
 router.get("/kot-printer-settings", settingsController.getAllKotPrinterSettings);
 router.post("/kot-printer-settings", settingsController.createKotPrinterSetting);
 router.delete("/kot-printer-settings/:id", settingsController.deleteKotPrinterSetting);

// -------------------------
// BILL PRINTER SETTINGS
// -------------------------
router.get("/bill-printer-settings", settingsController.getAllBillPrinterSettings);
router.get("/bill-printer-settings/:id", settingsController.getBillPrinterSettings);
router.post("/bill-printer-settings", settingsController.createBillPrinterSetting);
router.delete("/bill-printer-settings/:id", settingsController.deleteBillPrinterSetting);

// -------------------------
// TABLE-WISE KOT PRINTER
// -------------------------
router.get("/table-wise-kot", settingsController.getTableWiseKOT);
router.post("/table-wise-kot", settingsController.createTableWiseKOT);

// -------------------------
// TABLE-WISE BILL PRINTER
// -------------------------
router.get("/table-wise-bill", settingsController.getTableWiseBill);
router.post("/table-wise-bill", settingsController.createTableWiseBill);

// -------------------------
// CATEGORY-WISE PRINTER
// -------------------------
router.get("/category-wise-printer", settingsController.getCategoryWisePrinters);
router.post("/category-wise-printer", settingsController.createCategoryWisePrinter);

// -------------------------
// DEPARTMENT-WISE PRINTER
// -------------------------
router.get("/department-wise-printer", settingsController.getDepartmentWisePrinters);
router.post("/department-wise-printer", settingsController.createDepartmentWisePrinter);

// -------------------------
// LABEL PRINTER SETTINGS
// -------------------------
router.get("/label-printer", settingsController.getLabelPrinterSettings);
router.post("/label-printer", settingsController.createLabelPrinter);
router.put("/label-printer/:id", settingsController.updateLabelPrinter);

// -------------------------
// REPORT PRINTER SETTINGS
// -------------------------
router.get("/report-printer", settingsController.getReportPrinterSettings);
router.post("/report-printer", settingsController.createReportPrinter);
router.put("/report-printer/:id", settingsController.updateReportPrinter);

// -------------------------
// KDS USERS
// -------------------------
router.get("/kds-users", settingsController.getKDSUsers);
router.post("/kds-users", settingsController.createKDSUser);

module.exports = router;
