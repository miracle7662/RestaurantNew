const { ThermalPrinter, PrinterTypes } = require('node-thermal-printer');

async function testPrint() {
  try {
    let printer = new ThermalPrinter({
      type: PrinterTypes.EPSON,
      interface: "tcp://192.168.1.16:9100",   // ✅ Tumhara printer IP
      characterSet: "PC437_USA",               // ✅ Encoding fix
      removeSpecialCharacters: false,
      lineCharacter: "-",
      timeout: 5000,
    });

    console.log("Connecting to printer...");

    // ===== PRINT CONTENT =====
    printer.alignCenter();
    printer.bold(true);
    printer.println("🔥 TEST KOT 🔥");
    printer.bold(false);

    printer.drawLine();

    printer.alignLeft();
    printer.println("Table: 5");
    printer.println("Tea x 2");
    printer.println("Coffee x 1");

    printer.drawLine();

    printer.alignCenter();
    printer.println("Thank You!");

    printer.cut();

    // ===== EXECUTE PRINT =====
    await printer.execute();

    console.log("✅ Print sent successfully");

  } catch (error) {
    console.error("❌ Print failed:", error);
  }
}

testPrint();