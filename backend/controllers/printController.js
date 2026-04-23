const ThermalPrinter = require("node-thermal-printer").printer;
const Types = require("node-thermal-printer").types;

// Printer configuration - modify these settings for your thermal printer
const PRINTER_CONFIG = {
  type: Types.EPSON,        // Printer type: EPSON, STAR, ESCPOS
  interface: "tcp://192.168.1.16:9100", // Windows printer name
  // For network TCP/IP: "tcp://192.168.1.100:9100"
  // For USB: "usb://PATH/TO/PRINTER"
  width: 48,                // Character width (typical for 80mm paper)
  characterSet: "PC437_USA",   // ✅ FIX // Character set
  timeout: 15000,          // Connection timeout in ms (increased for Windows)
};

// Alternative: Use system default printer (for Windows/Mac)
// const PRINTER_CONFIG = {
//   type: Types.EPSON,
//   interface: "file:///dev/usb/lp0",  // Linux USB
//   // or Windows: "file://\\\\.\\COM1"
//   width: 48,
//   characterSet: "SLOVENIA",
// };

// Alternative: Try this interface format if first doesn't work:
// interface: "file://EPSON TM-T203dpi Receipt6"

/**
 * Print KOT (Kitchen Order Ticket)
 * @param {Object} kotData - KOT data object
 * @param {string|number} kotData.tableNo - Table number
 * @param {string} kotData.waiterName - Waiter name (optional)
 * @param {Array} kotData.items - Array of items [{name, quantity, notes}]
 * @param {string} kotData.orderId - Order ID (optional)
 * @param {Date} kotData.dateTime - Order datetime (optional)
 */
const printKOT = async (outletid, kotData) => {
  let printerConfig = { ...PRINTER_CONFIG }; // Global fallback
  let printer;

  try {
    // Optional: Load outlet-specific config (if DB columns exist)
    if (outletid) {
      try {
        const db = require('../config/db');
        const [settings] = await db.query(
          'SELECT interface, width, characterSet, type FROM mstkot_print_settings WHERE outletid = ?',
          [outletid]
        );
        if (settings.length > 0 && settings[0].interface) {
          printerConfig.interface = settings[0].interface;
          printerConfig.width = parseInt(settings[0].width) || 48;
          printerConfig.characterSet = settings[0].characterSet || 'PC437_USA';
          printerConfig.type = Types[settings[0].type || 'EPSON'];
          console.log(`✅ Loaded outlet ${outletid} printer:`, printerConfig.interface);
        } else {
          console.log(`ℹ️ No printer config for outlet ${outletid}, using global`);
        }
      } catch (dbError) {
        console.warn(`DB config load failed for outlet ${outletid}:`, dbError.message);
      }
    }

    const ThermalPrinter = require("node-thermal-printer").printer;
    const Types = require("node-thermal-printer").types;
    printer = new ThermalPrinter(printerConfig);


 

    // Execute print
    const result = await printer.execute();
    console.log("KOT printed successfully:", result);

    return {
      success: true,
      message: "KOT printed successfully",
      printedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error("Print Error:", error);
    return {
      success: false,
      message: "Failed to print KOT",
      error: error.message
    };
  } finally {
    // Clean up printer connection
    if (printer) {
      try {
        printer.clear();
      } catch (e) {
        // Ignore cleanup errors
      }
    }
  }
};

/**
 * Print multiple KOT copies
 * @param {Object} kotData - KOT data object
 * @param {number} copies - Number of copies to print
 */
const printKOTMultiple = async (outletid, kotData, copies = 1) => {
  const results = [];

  for (let i = 0; i < copies; i++) {
    const result = await printKOT(outletid, kotData);
    results.push(result);


    // Small delay between copies
    if (i < copies - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return {
    success: results.every(r => r.success),
    copies: copies,
    results: results
  };
};

/**
 * Get printer status
 */
const getPrinterStatus = async () => {
  let printer;

  try {
    printer = new ThermalPrinter(PRINTER_CONFIG);
    const connected = await printer.isPrinterConnected();

    return {
      connected: connected,
      config: {
        type: PRINTER_CONFIG.type,
        interface: PRINTER_CONFIG.interface,
        width: PRINTER_CONFIG.width
      }
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
};

/**
 * Update printer configuration
 */
const updatePrinterConfig = (newConfig) => {
  Object.assign(PRINTER_CONFIG, newConfig);
  console.log("Printer config updated:", PRINTER_CONFIG);
};

module.exports = {
  printKOT,
  printKOTMultiple,
  getPrinterStatus,
  updatePrinterConfig,
  PRINTER_CONFIG
};

