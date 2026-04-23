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
const printKOT = async (kotData) => {
  let printer;

  try {
    // Initialize printer
    printer = new ThermalPrinter(PRINTER_CONFIG);

    // Connect to printer
    await printer.isPrinterConnected();
    console.log("Printer connected successfully");

    // ============ KOT PRINT FORMAT ============

    // Header
    printer.alignCenter();
    printer.bold(true);
    printer.setTextSize(1, 1);
    printer.println("═══════════════════════════════════════");
    printer.println("        KITCHEN ORDER TICKET (KOT)      ");
    printer.println("═══════════════════════════════════════");
    printer.bold(false);
    printer.setTextSize(0, 0);
    printer.newLine();

    // Order Info
    printer.alignLeft();
    printer.println(`Table No. : ${kotData.tableNo || 'N/A'}`);

    if (kotData.waiterName) {
      printer.println(`Waiter    : ${kotData.waiterName}`);
    }

    if (kotData.orderId) {
      printer.println(`Order ID  : ${kotData.orderId}`);
    }

    const dateTime = kotData.dateTime || new Date();
    const formattedDate = typeof dateTime === 'string' ? dateTime :
      `${dateTime.toLocaleDateString()} ${dateTime.toLocaleTimeString()}`;
    printer.println(`Date/Time : ${formattedDate}`);

    printer.println("───────────────────────────────────────");

    // Items Header
    printer.bold(true);
    printer.println("ITEMS                    QTY");
    printer.bold(false);
    printer.println("───────────────────────────────────────");

    // Items List
    if (kotData.items && kotData.items.length > 0) {
      for (const item of kotData.items) {
        const itemName = item.name || 'Unknown Item';
        const quantity = item.quantity || 0;
        const notes = item.notes || '';

        // Format: Item name padded to width, quantity on right
        const namePart = itemName.length > 24 ? itemName.substring(0, 24) : itemName;
        const qtyPart = String(quantity).padStart(3, ' ');

        printer.println(`${namePart}${qtyPart}`);

        // Print notes if any
        if (notes) {
          printer.setTextSize(0, 0);
          printer.println(`  → ${notes}`);
        }
      }
    } else {
      printer.println("No items to print");
    }

    printer.println("───────────────────────────────────────");

    // Footer
    printer.alignCenter();
    printer.println("*** KOT PRINTED ***");
    printer.println(" ");
    printer.cut();  // Cut paper

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
const printKOTMultiple = async (kotData, copies = 1) => {
  const results = [];

  for (let i = 0; i < copies; i++) {
    const result = await printKOT(kotData);
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