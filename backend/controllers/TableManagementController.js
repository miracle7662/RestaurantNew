const db = require("../config/db"); // SQLite connection

// Get all table records with search and pagination
exports.getAllTables = (req, res) => {
  try {
    const sql = `
      SELECT
        t.*,
        d.department_name,
        o.outlet_name,
        (SELECT PAX FROM TAxnTrnbill WHERE TableID = t.tableid AND isBilled = 0 ORDER BY TxnID DESC LIMIT 1) as pax
      FROM msttablemanagement t
      LEFT JOIN msttable_department d ON t.departmentid = d.departmentid
      LEFT JOIN mst_outlets o ON t.outletid = o.outletid
    `;
    const rows = db.prepare(sql).all();

    res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching tables:", error);
    res.status(500).json({ success: false, message: "Failed to fetch tables", error: error.message });
  }
};


// Create a new table record (✅ departmentid added)
// Create a new table record
exports.createTable = (req, res) => {
  try {
    const { table_name, hotelid, outletid, marketid, departmentid, department_name, status, created_by_id } = req.body;

    const insertSql = 
      "INSERT INTO msttablemanagement (" +
      "table_name, hotelid, outletid, marketid, departmentid, department_name, status, created_by_id, created_date" +
      ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))";

    const stmt = db.prepare(insertSql);
    const result = stmt.run(
      table_name,
      hotelid || null,
      outletid || null,
      marketid || null,
      departmentid || null,
      department_name || null,
      status ?? 0,
      created_by_id || null
    );

    res.json({ success: true, message: "Table created successfully", id: result.lastInsertRowid });
  } catch (error) {
    console.error("Error creating table:", error);
    res.status(500).json({ success: false, message: "Failed to create table", error: error.message });
  }
};

// Update table record (✅ departmentid added)
// Update table record
exports.updateTable = (req, res) => {
  try {
    const { tableid } = req.params;
    const { table_name, hotelid, outletid, marketid, departmentid, department_name, status, updated_by_id } = req.body;

    const updateSql = 
      "UPDATE msttablemanagement " +
      "SET table_name = ?, hotelid = ?, outletid = ?, marketid = ?, " +
      "departmentid = ?, department_name = ?, status = ?, " +
      "updated_by_id = ?, updated_date = datetime('now') " +
      "WHERE tableid = ?";

    const stmt = db.prepare(updateSql);
    const result = stmt.run(
      table_name,
      hotelid || null,
      outletid || null,
      marketid || null,
      departmentid || null,
      department_name || null,
      status ?? 0,
      updated_by_id || null,
      tableid
    );

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: "Table not found" });
    }

    res.json({ success: true, message: "Table updated successfully" });
  } catch (error) {
    console.error("Error updating table:", error);
    res.status(500).json({ success: false, message: "Failed to update table", error: error.message });
  }
};

// Delete table record
exports.deleteTable = (req, res) => {
  try {
    const { tableid } = req.params;

    const deleteSql = "DELETE FROM msttablemanagement WHERE tableid = ?";
    const stmt = db.prepare(deleteSql);
    const result = stmt.run(tableid);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: "Table not found" });
    }

    res.json({ success: true, message: "Table deleted successfully" });
  } catch (error) {
    console.error("Error deleting table:", error);
    res.status(500).json({ success: false, message: "Failed to delete table", error: error.message });
  }
};

// Update table status
exports.updateTableStatus = (req, res) => {
  try {
    const { tableid } = req.params;
    const { status } = req.body;

    const updateSql = "UPDATE msttablemanagement SET status = ? WHERE tableid = ?";
    const stmt = db.prepare(updateSql);
    const result = stmt.run(status, tableid);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: "Table not found" });
    }

    res.json({ success: true, message: "Table status updated successfully" });
  } catch (error) {
    console.error("Error updating table status:", error);
    res.status(500).json({ success: false, message: "Failed to update table status", error: error.message });
  }
};

// Get all tables with their associated outlet names and department, filtered by hotelid
exports.getAllTablesWithOutlets = (req, res) => {
  try {
    const { hotelid } = req.query;
    if (!hotelid) {
      return res.status(400).json({ error: 'Hotel ID is required' });
    }

    const query = `
      SELECT
        t.tableid,
        t.table_name,
        CASE t.status
          WHEN 1 THEN 'running'
          WHEN 2 THEN 'printed'
          WHEN 3 THEN 'paid'
          WHEN 4 THEN 'running-kot'
          ELSE 'available'
        END as status,
        t.outletid,
        o.outlet_name,
        t.departmentid,
        t.department_name
      FROM msttablemanagement t
      LEFT JOIN mst_outlets o ON t.outletid = o.outletid
      WHERE t.hotelid = ?
    `;
    const tables = db.prepare(query).all(hotelid);
    res.json(tables);
  } catch (error) {
    console.error('Error fetching tables with outlets:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
};
