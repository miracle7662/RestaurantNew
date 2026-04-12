// controllers/settingsController.js (Printer Settings) - MySQL Converted
const db = require('../config/db');


// Helper Functions ------------------------
const runQuery = async (query, params = []) => {
  const [result] = await db.execute(query, params);
  return { insertId: result.insertId, affectedRows: result.affectedRows };
};

const getAll = async (query, params = []) => {
  const [rows] = await db.execute(query, params);
  return rows;
};

// ------------------------------------------
// 2️⃣ KOT Printer Settings
// ------------------------------------------
exports.getKotPrinterSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await getAll(
      "SELECT * FROM kot_printer_settings WHERE outletid = ? LIMIT 1",
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
    const {
      printer_name,
      hotelid,
      order_type,
      size, 
      copies = 1,
      outletid,
      enableKotPrint = 1
    } = req.body;

    if (!printer_name || !order_type || !size || !outletid) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await runQuery(
      `INSERT INTO kot_printer_settings
      (printer_name, hotelid, order_type, size, copies, outletid, enableKotPrint)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        printer_name,
        hotelid,
        order_type,
        size,
        copies,
        outletid,
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

    if (result.affectedRows === 0) {
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
       WHERE outletid = ?
       LIMIT 1`,
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
      hotelid,
      order_type,
      size,
      copies = 1,
      outletid,
      enableBillPrint = 1
    } = req.body;

    if (!printer_name || !order_type || !size || !outletid) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await runQuery(
      `INSERT INTO bill_printer_settings
      (printer_name, hotelid, order_type, size, copies, outletid, enableBillPrint)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        printer_name,
        hotelid,
        order_type,
        size,
        copies,
        outletid,
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

    if (result.affectedRows === 0) {
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
    const rows = await getAll('SELECT * FROM table_wise_kot_printer WHERE outletid = ?', [req.outletid]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createTableWiseKOT = async (req, res) => {
  try {
    const { table_no, printer_name, size, source, copies, outletid } = req.body;

    if (!outletid) {
      return res.status(400).json({ error: 'outletid is required' });
    }

    await runQuery(
      `INSERT INTO table_wise_kot_printer
      (table_no, printer_name, size, source, copies, outletid)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [table_no, printer_name, size, source, copies, outletid]
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
    const rows = await getAll('SELECT * FROM table_wise_bill_printer WHERE outletid = ?', [req.outletid]);
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
      (table_no, printer_name, size, source, copies, outletid)
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
    const rows = await getAll('SELECT * FROM category_wise_printer WHERE outletid = ?', [req.outletid]);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createCategoryWisePrinter = async (req, res) => {
  try {
    const { category, printer_name, order_type, size, source, copies, outletid } = req.body;

    if (!outletid) {
      return res.status(400).json({ error: 'outletid is required' });
    }

    await runQuery(
      `INSERT INTO category_wise_printer
      (category, printer_name, order_type, size, source, copies, outletid)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [category, printer_name, order_type, size, source, copies, outletid]
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
    const rows = await getAll('SELECT * FROM department_wise_printer');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createDepartmentWisePrinter = async (req, res) => {
  try {
    const { department, printer_name, order_type, size, hotelid, copies, outletid } = req.body;

    if (!outletid) {
      return res.status(400).json({ error: 'outletid is required' });
    }

    await runQuery(
      `INSERT INTO department_wise_printer
      (department, printer_name, order_type, size, hotelid, copies, outletid)
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [department, printer_name, order_type, size, hotelid, copies, outletid]
    );

    res.json({ msg: 'Department-wise Setting Added' });
  } catch (e) {
    console.error('Error in createDepartmentWisePrinter:', e);
    res.status(500).json({ error: e.message });
  }
};

// ------------------------------------------
// 8️⃣ Label Printer Settings
// ------------------------------------------

exports.getLabelPrinterSettings = async (req, res) => {
  try {
    const rows = await getAll('SELECT * FROM label_printer_settings');
    res.json(rows);
  } catch (e) {
    console.error('Error fetching label printer settings:', e.message);
    res.status(500).json({ error: e.message });
  }
};

exports.createLabelPrinter = async (req, res) => {
  try {
    const { printer_name, paper_width, is_enabled, hotelid, outletid } = req.body;

    if (!outletid) {
      return res.status(400).json({ error: 'outletid is required' });
    }

    await runQuery(
      `INSERT INTO label_printer_settings
      (printer_name, paper_width, is_enabled, hotelid, outletid)
      VALUES (?, ?, ?, ?, ?)`,
      [printer_name, paper_width, is_enabled ? 1 : 0, hotelid, outletid]
    );

    res.json({ msg: 'Label Printer Added' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.updateLabelPrinter = async (req, res) => {
  try {
    const { id } = req.params;
    const { printer_name, paper_width, is_enabled } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }

    const result = await runQuery(
      `UPDATE label_printer_settings
      SET printer_name = ?, paper_width = ?, is_enabled = ?
      WHERE id = ?`,
      [printer_name, paper_width, is_enabled ? 1 : 0, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Label printer setting not found' });
    }

    res.json({ msg: 'Label Printer Updated' });
  } catch (e) {
    console.error('Error updating label printer:', e.message);
    res.status(500).json({ error: e.message });
  }
};

// ------------------------------------------
// 9️⃣ Report Printer Settings
// ------------------------------------------

exports.getReportPrinterSettings = async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await getAll(
      "SELECT * FROM report_printer_settings WHERE outletid = ? OR hotelid = ?",
      [id, id]
    );

    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.createReportPrinter = async (req, res) => {
  try {
    const { printer_name, paper_size, auto_print, hotelid, outletid } = req.body;

    if (!outletid) {
      return res.status(400).json({ error: 'outletid is required' });
    }

    await runQuery(
      `INSERT INTO report_printer_settings
      (printer_name, paper_size, auto_print, hotelid, outletid)
      VALUES (?, ?, ?, ?, ?)`,
      [printer_name, paper_size, auto_print ? 1 : 0, hotelid, outletid]
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

    const result = await runQuery(
      `UPDATE report_printer_settings
      SET printer_name = ?, paper_size = ?, auto_print = ?
      WHERE id = ?`,
      [printer_name, paper_size, auto_print ? 1 : 0, id]
    );

    res.json({ msg: 'Report Printer Updated' });
  } catch (e) {
    console.error('Error updating report printer:', e.message);
    res.status(500).json({ error: e.message });
  }
};

/**
 * Get all report printer settings without id parameter
 */
exports.getAllReportPrinterSettings = async (req, res) => {
  try {
    const rows = await getAll("SELECT * FROM report_printer_settings");
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.deleteReportPrinter = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: 'ID is required' });
    }

    const result = await runQuery(
      'DELETE FROM report_printer_settings WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Report printer setting not found' });
    }

    res.json({ success: true, msg: 'Report printer setting deleted successfully' });
  } catch (e) {
    console.error('REPORT PRINTER DELETE ERROR:', e.message);
    res.status(500).json({ error: e.message });
  }
};

// ------------------------------------------
// 🔟 KDS Department User
// ------------------------------------------

exports.getKDSUsers = async (req, res) => {
  try {
    const rows = await getAll('SELECT * FROM kds_department_user');
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

// ------------------------------------------
// 🚀 Takeaway Settings (NEW)
// ------------------------------------------

/**
 * Get mst_setting departmentid by outletid for tax selection
 */
exports.getMstSettingByOutlet = async (req, res) => {
  try {
    const { outletid } = req.params;

    const rows = await getAll(
      "SELECT departmentid FROM mst_setting WHERE outletid = ? LIMIT 1",
      [outletid]
    );

    if (!rows || rows.length === 0) {
      await runQuery(
        `INSERT INTO mst_setting (hotelid, outletid, departmentid, created_by_id)
         VALUES (?, ?, 1, 1)`,
        [req.user?.hotelid || 1, outletid]
      );
      return res.json({ success: true, data: { departmentid: 1 } });
    }

    res.json({ success: true, data: { departmentid: rows[0].departmentid } });
  } catch (e) {
    console.error('mst_setting GET ERROR:', e.message);
    res.status(500).json({ success: false, error: e.message });
  }
};

/**
 * Get Takeaway Setting by outletid
 * Matches pattern of other printer settings
 */
exports.getTakeawaySetting = async (req, res) => {
  try {
    const { id } = req.params;

    let rows = await getAll(
      "SELECT * FROM mst_setting WHERE outletid = ? LIMIT 1",
      [id]
    );

    if (!rows || rows.length === 0) {
      await runQuery(
        `INSERT INTO mst_setting (hotelid, outletid, departmentid, created_by_id)
         VALUES (?, ?, 1, 1)`,
        [req.user?.hotelid || 1, id]
      );
      rows = await getAll(
        "SELECT * FROM mst_setting WHERE outletid = ? LIMIT 1",
        [id]
      );
    }

    res.json(rows[0]);
  } catch (e) {
    console.error('Takeaway GET ERROR:', e.message);
    res.status(500).json({ error: e.message });
  }
};

exports.updateTakeawaySetting = async (req, res) => {
  try {
    const {
      settingid,
      hotelid,
      outletid,
      departmentid,
      created_by_id
    } = req.body;

    if (!settingid || !hotelid || !outletid || !created_by_id) {
      return res.status(400).json({ error: 'settingid, hotelid, outletid, and created_by_id are required' });
    }

    const result = await runQuery(
      `UPDATE mst_setting
       SET hotelid = ?,
           outletid = ?,
           departmentid = ?,
           created_by_id = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE settingid = ?`,
      [hotelid, outletid, departmentid, created_by_id, settingid]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Takeaway setting not found' });
    }

    res.json({ success: true, msg: 'Takeaway setting updated successfully' });
  } catch (e) {
    console.error('Takeaway UPDATE ERROR:', e.message);
    res.status(500).json({ error: e.message });
  }
};

// ------------------------------------------
// 🚀 UI Mode Settings (NEW)
// ------------------------------------------

/**
 * Get UI Mode setting by outletid
 */
exports.getUIMode = async (req, res) => {
  try {
    const { outletid } = req.params;

    const rows = await getAll(
      "SELECT ui_mode FROM mst_setting WHERE outletid = ? LIMIT 1",
      [outletid]
    );

    if (!rows || rows.length === 0) {
      return res.json({ ui_mode: 'Orders' });
    }

    res.json(rows[0]);
  } catch (e) {
    console.error('UI Mode GET ERROR:', e.message);
    res.status(500).json({ error: e.message });
  }
};

/**
 * Save/Update UI Mode setting by outletid (UPSERT pattern)
 */
exports.saveUIMode = async (req, res) => {
  try {
    const {
      ui_mode,
      hotelid,
      outletid,
      created_by_id
    } = req.body;

    if (!ui_mode || !outletid || !created_by_id) {
      return res.status(400).json({ error: 'ui_mode, outletid, and created_by_id are required' });
    }

    // First try UPDATE
    const result = await runQuery(
      `UPDATE mst_setting 
       SET ui_mode = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE outletid = ?`,
      [ui_mode, outletid]
    );

    if (result.affectedRows === 0) {
      // INSERT if no existing record
      await runQuery(
        `INSERT INTO mst_setting (hotelid, outletid, ui_mode, departmentid, created_by_id)
         VALUES (?, ?, ?, 1, ?)`,
        [hotelid || 1, outletid, ui_mode, created_by_id]
      );
    }

    res.json({ success: true, msg: 'UI Mode setting saved successfully', ui_mode });
  } catch (e) {
    console.error('UI Mode SAVE ERROR:', e.message);
    res.status(500).json({ error: e.message });
  }
};

