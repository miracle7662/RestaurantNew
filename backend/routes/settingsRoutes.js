const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");

// -------------------------
// MST PRINTERS
// -------------------------
router.get("/mst-printers", settingsController.getMstPrinters);
router.post("/mst-printers", settingsController.createMstPrinter);

// -------------------------
// KOT PRINTER SETTINGS
// -------------------------
router.get("/kot-printer-settings/:id", settingsController.getKotPrinterSettings);
router.post("/kot-printer-settings", settingsController.createKotPrinterSetting);

// -------------------------
// BILL PRINTER SETTINGS
// -------------------------
router.get("/bill-printer-settings", settingsController.getBillPrinterSettings);
router.post("/bill-printer-settings", settingsController.createBillPrinterSetting);

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

// -------------------------
// REPORT PRINTER SETTINGS
// -------------------------
router.get("/report-printer", settingsController.getReportPrinterSettings);
router.post("/report-printer", settingsController.createReportPrinter);

// -------------------------
// KDS USERS
// -------------------------
router.get("/kds-users", settingsController.getKDSUsers);
router.post("/kds-users", settingsController.createKDSUser);

module.exports = router;
