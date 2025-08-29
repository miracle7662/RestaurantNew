const db = require("../config/db"); // SQLite connection

// Get all table records with search and pagination
exports.getAllTables = (req, res) => {
  try {
    const search = req.query.search ? req.query.search.toString().toLowerCase() : '';
    const page = req.query.page ? parseInt(req.query.page.toString()) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit.toString()) : 10;
    const offset = (page - 1) * limit;

    let baseSql = 
      " FROM msttablemanagement tm " +
      " LEFT JOIN msthotelmasters h ON tm.hotelid = h.hotelid " +
      " LEFT JOIN mst_outlets o ON tm.outletid = o.outletid ";

    let whereClause = '';
    const params = {};

    if (search) {
      whereClause = 
        " WHERE LOWER(tm.table_name) LIKE @search " +
        " OR LOWER(h.hotel_name) LIKE @search " +
        " OR LOWER(o.outlet_name) LIKE @search ";
      params['search'] = '%' + search + '%';
    }

    // Get total count for pagination
    const countSql = "SELECT COUNT(*) as total " + baseSql + whereClause;
    const totalRow = db.prepare(countSql).get(params);
    const total = totalRow ? totalRow.total : 0;

    // Get paginated data
    const dataSql = 
      "SELECT tm.*, h.hotel_name, o.outlet_name " +
      baseSql +
      whereClause +
      " LIMIT @limit OFFSET @offset ";
    params['limit'] = limit;
    params['offset'] = offset;

    const rows = db.prepare(dataSql).all(params);

    res.json({
      success: true,
      data: rows,
      pagination: {
        total,
        page,
        limit,
      },
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
      status ?? 1,
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
      status ?? 1,
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
