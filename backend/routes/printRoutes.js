const express = require("express");
const router = express.Router();
const { printKOT, printKOTMultiple, getPrinterStatus, updatePrinterConfig } = require("../controllers/printController");

/**
 * POST /print-kot
 * Print Kitchen Order Ticket directly to configured thermal printer
 *
 * Request Body:
 * {
 *   "tableNo": "T01",
 *   "items": [
 *     { "name": "Burger", "quantity": 2, "notes": "No onions" },
 *     { "name": "Fries", "quantity": 1, "notes": "" }
 *   ],
 *   "waiterName": "John",
 *   "orderId": "ORD-001",
 *   "copies": 1
 * }
 */
router.post("/print-kot", async (req, res) => {
   console.log("🔥 API HIT FROM MOBILE");
  console.log(req.body)
  console.log(req.body);
  try {
    const { tableNo, items, waiterName, orderId, copies } = req.body;

    if (!tableNo) {
      return res.status(400).json({
        success: false,
        message: "tableNo is required"
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "items array is required and cannot be empty"
      });
    }

    const kotData = {
      tableNo,
      items,
      waiterName: waiterName || null,
      orderId: orderId || null,
      dateTime: new Date()
    };

    let result;
    if (copies && copies > 1) {
      result = await printKOTMultiple(kotData, copies);
    } else {
      result = await printKOT(kotData);
    }

    if (result.success) {
      res.json({
        success: true,
        message: "KOT printed successfully",
        ...result
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Failed to print KOT",
        error: result.error
      });
    }
  } catch (error) {
    console.error("Print KOT Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
});

/**
 * GET /print-kot/status - Check printer connection status
 */
router.get("/print-kot/status", async (req, res) => {
  try {
    const status = await getPrinterStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get printer status",
      error: error.message
    });
  }
});

/**
 * PUT /print-kot/config - Update printer configuration
 */
router.put("/print-kot/config", (req, res) => {
  try {
    const { type, interface: printerInterface, width, characterSet } = req.body;
    const updates = {};
    if (type) updates.type = type;
    if (printerInterface) updates.interface = printerInterface;
    if (width) updates.width = width;
    if (characterSet) updates.characterSet = characterSet;
    updatePrinterConfig(updates);
    res.json({ success: true, message: "Printer configuration updated" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update printer config",
      error: error.message
    });
  }
});

module.exports = router;
