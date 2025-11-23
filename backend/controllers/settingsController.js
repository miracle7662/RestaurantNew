// controllers/printerControllers.js

const db = require('../config/db.js');

// Helper Functions ------------------------
const runQuery = (query, params = []) => {
  const stmt = db.prepare(query);
  const result = stmt.run(params);
  return { id: result.lastInsertRowid, changes: result.changes };
};

const getAll = (query, params = []) => {
  const stmt = db.prepare(query);
  return stmt.all(params);
};



// ------------------------------------------
// 2️⃣ KOT Printer Settings
// ------------------------------------------
exports.getKotPrinterSettings = async (req, res) => {
  try {
    const { id } = req.params; // <-- get route param
    const rows = await getAll(
      "SELECT * FROM kot_printer_settings WHERE outlet_id = ? LIMIT 1",
      [id]
    );

    if (!rows || rows.length === 0) {
      return res.json({ printer_name: null });
    }

    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/**
 * Get all KOT printer settings without id parameter
 */
exports.getAllKotPrinterSettings = async (req, res) => {
  try {
    const rows = await getAll("SELECT * FROM kot_printer_settings");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};





exports.createKotPrinterSetting = async (req, res) => {
  try {
    const { printer_name, source, order_type, size, copies, outlet_id } =
      req.body;

    await runQuery(
      `INSERT INTO kot_printer_settings 
      (printer_name, source, order_type, size, copies, outlet_id) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [printer_name, source, order_type, size, copies, outlet_id]
    );

    res.json({ msg: 'KOT Setting Added' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ------------------------------------------
// 3️⃣ Bill Printer Settings
// ------------------------------------------

exports.getBillPrinterSettings = async (req, res) => {
  try {
    const rows = getAll('SELECT * FROM bill_printer_settings');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createBillPrinterSetting = async (req, res) => {
  try {
    const { printer_name, source, order_type, size, copies, outlet_id } =
      req.body;

    await runQuery(
      `INSERT INTO bill_printer_settings 
      (printer_name, source, order_type, size, copies, outlet_id) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [printer_name, source, order_type, size, copies, outlet_id]
    );

    res.json({ msg: 'Bill Printer Setting Added' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ------------------------------------------
// 4️⃣ Table-wise KOT Printer
// ------------------------------------------

exports.getTableWiseKOT = async (req, res) => {
  try {
    const rows = getAll('SELECT * FROM table_wise_kot_printer');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createTableWiseKOT = async (req, res) => {
  try {
    const { table_no, printer_name, size, source, copies } = req.body;

    await runQuery(
      `INSERT INTO table_wise_kot_printer 
      (table_no, printer_name, size, source, copies) 
      VALUES (?, ?, ?, ?, ?)`,
      [table_no, printer_name, size, source, copies]
    );

    res.json({ msg: 'Table-wise KOT Added' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ------------------------------------------
// 5️⃣ Table-wise Bill Printer
// ------------------------------------------

exports.getTableWiseBill = async (req, res) => {
  try {
    const rows = getAll('SELECT * FROM table_wise_bill_printer');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createTableWiseBill = async (req, res) => {
  try {
    const { table_no, printer_name, size, source, copies } = req.body;

    await runQuery(
      `INSERT INTO table_wise_bill_printer 
      (table_no, printer_name, size, source, copies) 
      VALUES (?, ?, ?, ?, ?)`,
      [table_no, printer_name, size, source, copies]
    );

    res.json({ msg: 'Table-wise Bill Added' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ------------------------------------------
// 6️⃣ Category-wise Printer
// ------------------------------------------

exports.getCategoryWisePrinters = async (req, res) => {
  try {
    const rows = getAll('SELECT * FROM category_wise_printer');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createCategoryWisePrinter = async (req, res) => {
  try {
    const { category, printer_name, order_type, size, source, copies } =
      req.body;

    await runQuery(
      `INSERT INTO category_wise_printer 
      (category, printer_name, order_type, size, source, copies) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [category, printer_name, order_type, size, source, copies]
    );

    res.json({ msg: 'Category-wise Setting Added' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ------------------------------------------
// 7️⃣ Department-wise Printer
// ------------------------------------------

exports.getDepartmentWisePrinters = async (req, res) => {
  try {
    const rows = getAll('SELECT * FROM department_wise_printer');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createDepartmentWisePrinter = async (req, res) => {
  try {
    const { department, printer_name, order_type, size, source, copies } =
      req.body;

    await runQuery(
      `INSERT INTO department_wise_printer 
      (department, printer_name, order_type, size, source, copies) 
      VALUES (?, ?, ?, ?, ?, ?)`,
      [department, printer_name, order_type, size, source, copies]
    );

    res.json({ msg: 'Department-wise Setting Added' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ------------------------------------------
// 8️⃣ Label Printer Settings
// ------------------------------------------

exports.getLabelPrinterSettings = async (req, res) => {
  try {
    const rows = getAll('SELECT * FROM label_printer_settings');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createLabelPrinter = async (req, res) => {
  try {
    const { printer_name, paper_width, is_enabled } = req.body;

    await runQuery(
      `INSERT INTO label_printer_settings 
      (printer_name, paper_width, is_enabled) 
      VALUES (?, ?, ?)`,
      [printer_name, paper_width, is_enabled]
    );

    res.json({ msg: 'Label Printer Added' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ------------------------------------------
// 9️⃣ Report Printer Settings
// ------------------------------------------

exports.getReportPrinterSettings = async (req, res) => {
  try {
    const rows = getAll('SELECT * FROM report_printer_settings');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createReportPrinter = async (req, res) => {
  try {
    const { printer_name, paper_size, auto_print } = req.body;

    await runQuery(
      `INSERT INTO report_printer_settings 
      (printer_name, paper_size, auto_print) 
      VALUES (?, ?, ?)`,
      [printer_name, paper_size, auto_print]
    );

    res.json({ msg: 'Report Printer Added' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// ------------------------------------------
// 🔟 KDS Department User
// ------------------------------------------

exports.getKDSUsers = async (req, res) => {
  try {
    const rows = getAll('SELECT * FROM kds_department_user');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createKDSUser = async (req, res) => {
  try {
    const { department, user, is_active, updated_at } = req.body;

    await runQuery(
      `INSERT INTO kds_department_user 
      (department, user, is_active, updated_at) 
      VALUES (?, ?, ?, ?)`,
      [department, user, is_active, updated_at]
    );

    res.json({ msg: 'KDS User Added' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
