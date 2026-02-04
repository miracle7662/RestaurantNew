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
    const rows = await getAll("SELECT * FROM kot_printer_settings ");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};





exports.createKotPrinterSetting = async (req, res) => {
  try {
    const {
      printer_name,
      source,
      order_type,
      size,
      copies = 1,
      outlet_id,
      enableKotPrint = 1
    } = req.body;

    if (!printer_name || !source || !order_type || !size || !outlet_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await runQuery(
      `INSERT INTO kot_printer_settings
      (printer_name, source, order_type, size, copies, outlet_id, enableKotPrint)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        printer_name,
        source,
        order_type,
        size,
        copies,
        outlet_id,
        enableKotPrint ? 1 : 0
      ]
    );

    res.json({ success: true, msg: 'KOT Setting Added' });
  } catch (e) {
    console.error('KOT INSERT ERROR:', e.message);
    res.status(500).json({ error: e.message });
  }
};

exports.deleteKotPrinterSetting = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }

    const result = await runQuery(
      'DELETE FROM kot_printer_settings WHERE id = ?',
      [id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'KOT printer setting not found' });
    }

    res.json({ success: true, msg: 'KOT printer setting deleted successfully' });
  } catch (e) {
    console.error('KOT DELETE ERROR:', e.message);
    res.status(500).json({ error: e.message });
  }
};

// ------------------------------------------
// 3️⃣ Bill Printer Settings
// ------------------------------------------

exports.getBillPrinterSettings = async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await getAll(
      `SELECT * FROM bill_printer_settings 
       WHERE outlet_id = ? 
       LIMIT 1`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return res.json({ printer_name: null });
    }

    res.json(rows[0]); // ✅ SINGLE OBJECT
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};


/**
 * Get all bill printer settings without id parameter
 */
exports.getAllBillPrinterSettings = async (req, res) => {
  try {
    const rows = await getAll("SELECT * FROM bill_printer_settings");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};


exports.createBillPrinterSetting = async (req, res) => {
  try {
    const {
      printer_name,
      source,
      order_type,
      size,
      copies = 1,
      outlet_id,
      enableBillPrint = 1
    } = req.body;

    if (!printer_name || !source || !order_type || !size || !outlet_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await runQuery(
      `INSERT INTO bill_printer_settings
      (printer_name, source, order_type, size, copies, outlet_id, enableBillPrint)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        printer_name,
        source,
        order_type,
        size,
        copies,
        outlet_id,
        enableBillPrint ? 1 : 0
      ]
    );

    res.json({ success: true, msg: 'Bill Printer Setting Added' });
  } catch (e) {
    console.error('BILL INSERT ERROR:', e.message);
    res.status(500).json({ error: e.message });
  }
};

exports.deleteBillPrinterSetting = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }

    const result = await runQuery(
      'DELETE FROM bill_printer_settings WHERE id = ?',
      [id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Bill printer setting not found' });
    }

    res.json({ success: true, msg: 'Bill printer setting deleted successfully' });
  } catch (e) {
    console.error('BILL DELETE ERROR:', e.message);
    res.status(500).json({ error: e.message });
  }
};


// ------------------------------------------
// 4️⃣ Table-wise KOT Printer
// ------------------------------------------

exports.getTableWiseKOT = async (req, res) => {
  try {
    const rows = getAll('SELECT * FROM table_wise_kot_printer WHERE outlet_id = ?', [req.outletid]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createTableWiseKOT = async (req, res) => {
  try {
    const { table_no, printer_name, size, source, copies, outlet_id } = req.body;

    if (!outlet_id) {
      return res.status(400).json({ error: 'outlet_id is required' });
    }

    await runQuery(
      `INSERT INTO table_wise_kot_printer
      (table_no, printer_name, size, source, copies, outlet_id)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [table_no, printer_name, size, source, copies, outlet_id]
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
    const rows = getAll('SELECT * FROM table_wise_bill_printer WHERE outlet_id = ?', [req.outletid]);
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
      (table_no, printer_name, size, source, copies, outlet_id)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [table_no, printer_name, size, source, copies, req.outletid]
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
    const rows = getAll('SELECT * FROM category_wise_printer WHERE outlet_id = ?', [req.outletid]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createCategoryWisePrinter = async (req, res) => {
  try {
    const { category, printer_name, order_type, size, source, copies, outlet_id } =
      req.body;

    if (!outlet_id) {
      return res.status(400).json({ error: 'outlet_id is required' });
    }

    await runQuery(
      `INSERT INTO category_wise_printer
      (category, printer_name, order_type, size, source, copies, outlet_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [category, printer_name, order_type, size, source, copies, outlet_id]
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
    const rows = getAll('SELECT * FROM department_wise_printer WHERE outlet_id = ?', [req.outletid]);
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
      (department, printer_name, order_type, size, source, copies, outlet_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [department, printer_name, order_type, size, source, copies, req.outletid]
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
    const rows = getAll('SELECT * FROM label_printer_settings WHERE outlet_id = ?', [req.outletid]);
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
    const rows = getAll('SELECT * FROM report_printer_settings WHERE outlet_id = ?', [req.outletid]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createReportPrinter = async (req, res) => {
  try {
    const { printer_name, paper_size, auto_print, outlet_id } = req.body;

    if (!outlet_id) {
      return res.status(400).json({ error: 'outlet_id is required' });
    }

    await runQuery(
      `INSERT INTO report_printer_settings
      (printer_name, paper_size, auto_print, outlet_id)
      VALUES (?, ?, ?, ?)`,
      [printer_name, paper_size, auto_print, outlet_id]
    );

    res.json({ msg: 'Report Printer Added' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.updateReportPrinter = async (req, res) => {
  try {
    const { id } = req.params;
    const { printer_name, paper_size, auto_print } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }

    await runQuery(
      `UPDATE report_printer_settings
      SET printer_name = ?, paper_size = ?, auto_print = ?
      WHERE id = ?`,
      [printer_name, paper_size, auto_print, id]
    );

    res.json({ msg: 'Report Printer Updated' });
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
