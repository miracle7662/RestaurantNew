const db = require("../config/db"); // SQLite connection

// Migration: Add parentTableId and isTemporary columns if they don't exist
const runMigrations = () => {
  try {
    // Check if parentTableId column exists
    const tableInfo = db.prepare("PRAGMA table_info(msttablemanagement)").all();
    const columns = tableInfo.map(col => col.name);
    
    if (!columns.includes('parentTableId')) {
      db.prepare("ALTER TABLE msttablemanagement ADD COLUMN parentTableId INTEGER").run();
      console.log("Added parentTableId column to msttablemanagement");
    }
    
    if (!columns.includes('isTemporary')) {
      db.prepare("ALTER TABLE msttablemanagement ADD COLUMN isTemporary INTEGER DEFAULT 0").run();
      console.log("Added isTemporary column to msttablemanagement");
    }
  } catch (error) {
    console.error("Migration error:", error.message);
  }
};

// Run migrations on module load
runMigrations();

// Get all table records with search and pagination
exports.getAllTables = (req, res) => {
  try {
    const { search } = req.query;
    let sql = `
      SELECT
        t.*,
        d.department_name,
        o.outlet_name,
        h.hotel_name,
        (SELECT PAX FROM TAxnTrnbill WHERE TableID = t.tableid AND isBilled = 0 ORDER BY TxnID DESC LIMIT 1) as pax
      FROM msttablemanagement t
      LEFT JOIN msttable_department d ON t.departmentid = d.departmentid
      LEFT JOIN mst_outlets o ON t.outletid = o.outletid
      LEFT JOIN msthotelmasters h ON t.hotelid = h.hotelid
    `;
    let params = [];
    if (search) {
      sql += ` WHERE (t.table_name LIKE ? OR o.outlet_name LIKE ? OR h.hotel_name LIKE ?)`;
      const searchParam = `%${search}%`;
      params = [searchParam, searchParam, searchParam];
    }
    const rows = db.prepare(sql).all(...params);

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

// =====================================================
// SPLIT TABLE FUNCTIONALITY
// =====================================================

// Create a new split table (sub-table) for a parent table
exports.createSplitTable = (req, res) => {
  try {
    const { 
      parentTableId, 
      table_name, 
      hotelid, 
      outletid, 
      marketid, 
      departmentid, 
      department_name 
    } = req.body;

    if (!parentTableId) {
      return res.status(400).json({ success: false, message: "Parent table ID is required" });
    }

    if (!table_name) {
      return res.status(400).json({ success: false, message: "Table name is required" });
    }

    // Check if parent table exists
    const parentTable = db.prepare("SELECT * FROM msttablemanagement WHERE tableid = ?").get(parentTableId);
    if (!parentTable) {
      return res.status(404).json({ success: false, message: "Parent table not found" });
    }

    // Check if split table with same name already exists
    const existingTable = db.prepare(
      "SELECT * FROM msttablemanagement WHERE table_name = ? AND parentTableId = ?"
    ).get(table_name, parentTableId);

    if (existingTable) {
      return res.json({ 
        success: true, 
        message: "Split table already exists", 
        data: existingTable 
      });
    }

    // Create the split table
    const insertSql = `
      INSERT INTO msttablemanagement (
        table_name, hotelid, outletid, marketid, departmentid, department_name, 
        status, parentTableId, isTemporary, created_by_id, created_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, datetime('now'))
    `;

    const stmt = db.prepare(insertSql);
    const result = stmt.run(
      table_name,
      hotelid || parentTable.hotelid,
      outletid || parentTable.outletid,
      marketid || parentTable.marketid,
      departmentid || parentTable.departmentid,
      department_name || parentTable.department_name,
      1, // Status = running (occupied)
      parentTableId,
      null
    );

    // Update parent table status to indicate it has sub-tables
    db.prepare("UPDATE msttablemanagement SET status = 1 WHERE tableid = ?").run(parentTableId);

    const newTable = db.prepare("SELECT * FROM msttablemanagement WHERE tableid = ?").get(result.lastInsertRowid);

    res.json({ 
      success: true, 
      message: "Split table created successfully", 
      data: newTable 
    });
  } catch (error) {
    console.error("Error creating split table:", error);
    res.status(500).json({ success: false, message: "Failed to create split table", error: error.message });
  }
};

// Get all sub-tables for a parent table
exports.getSubTables = (req, res) => {
  try {
    const { parentTableId } = req.params;

    if (!parentTableId) {
      return res.status(400).json({ success: false, message: "Parent table ID is required" });
    }

    const subTables = db.prepare(`
      SELECT 
        t.*,
        d.department_name,
        o.outlet_name,
        h.hotel_name,
        (SELECT PAX FROM TAxnTrnbill WHERE TableID = t.tableid AND isBilled = 0 ORDER BY TxnID DESC LIMIT 1) as pax
      FROM msttablemanagement t
      LEFT JOIN msttable_department d ON t.departmentid = d.departmentid
      LEFT JOIN mst_outlets o ON t.outletid = o.outletid
      LEFT JOIN msthotelmasters h ON t.hotelid = h.hotelid
      WHERE t.parentTableId = ?
      ORDER BY t.table_name
    `).all(parentTableId);

    res.json({ success: true, data: subTables });
  } catch (error) {
    console.error("Error fetching sub-tables:", error);
    res.status(500).json({ success: false, message: "Failed to fetch sub-tables", error: error.message });
  }
};

// Check if all sub-tables are settled and cleanup
exports.checkAndCleanupSubTables = (req, res) => {
  try {
    const { parentTableId } = req.params;

    if (!parentTableId) {
      return res.status(400).json({ success: false, message: "Parent table ID is required" });
    }

    // Get all sub-tables for this parent
    const subTables = db.prepare(
      "SELECT tableid, table_name, status FROM msttablemanagement WHERE parentTableId = ? AND isTemporary = 1"
    ).all(parentTableId);

    if (subTables.length === 0) {
      return res.json({ 
        success: true, 
        message: "No sub-tables found",
        allSettled: true,
        parentTableStatus: 0
      });
    }

    // Check if all sub-tables are settled (status = 0 or isSetteled in bills)
    let allSettled = true;
    const subTableStatuses = [];

    for (const subTable of subTables) {
      // Check if there are any unsettled bills for this sub-table
      const unsettledBill = db.prepare(`
        SELECT COUNT(*) as count FROM TAxnTrnbill 
        WHERE TableID = ? AND isSetteled = 0 AND isCancelled = 0
      `).get(subTable.tableid);

      const hasUnsettledBill = unsettledBill.count > 0;
      
      subTableStatuses.push({
        tableid: subTable.tableid,
        table_name: subTable.table_name,
        status: subTable.status,
        hasUnsettledBill: hasUnsettledBill
      });

      if (hasUnsettledBill || subTable.status !== 0) {
        allSettled = false;
      }
    }

    // If all sub-tables are settled, clean up and update parent table
    if (allSettled) {
      // Delete all temporary sub-tables
      const deleteResult = db.prepare(
        "DELETE FROM msttablemanagement WHERE parentTableId = ? AND isTemporary = 1"
      ).run(parentTableId);

      // Update parent table to available
      db.prepare("UPDATE msttablemanagement SET status = 0 WHERE tableid = ?").run(parentTableId);

      return res.json({ 
        success: true, 
        message: "All sub-tables settled and cleaned up",
        allSettled: true,
        parentTableStatus: 0,
        deletedCount: deleteResult.changes,
        subTableStatuses: subTableStatuses
      });
    }

    // Return current status
    res.json({ 
      success: true, 
      message: "Sub-tables status retrieved",
      allSettled: false,
      subTableStatuses: subTableStatuses
    });
  } catch (error) {
    console.error("Error checking sub-tables:", error);
    res.status(500).json({ success: false, message: "Failed to check sub-tables", error: error.message });
  }
};

// Delete a specific split table
exports.deleteSplitTable = (req, res) => {
  try {
    const { tableid } = req.params;
    const { parentTableId } = req.query;

    if (!tableid) {
      return res.status(400).json({ success: false, message: "Table ID is required" });
    }

    // Check if the table exists and is a temporary split table
    const splitTable = db.prepare(
      "SELECT * FROM msttablemanagement WHERE tableid = ? AND isTemporary = 1"
    ).get(tableid);

    if (!splitTable) {
      return res.status(404).json({ success: false, message: "Split table not found or not a temporary table" });
    }

    // Check if there are any unsettled bills for this split table
    const unsettledBill = db.prepare(`
      SELECT COUNT(*) as count FROM TAxnTrnbill 
      WHERE TableID = ? AND isSetteled = 0 AND isCancelled = 0
    `).get(tableid);

    if (unsettledBill.count > 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Cannot delete split table with unsettled bills" 
      });
    }

    // Delete the split table
    const deleteResult = db.prepare("DELETE FROM msttablemanagement WHERE tableid = ?").run(tableid);

    // Check if there are any remaining sub-tables for this parent
    if (parentTableId) {
      const remainingSubTables = db.prepare(
        "SELECT COUNT(*) as count FROM msttablemanagement WHERE parentTableId = ? AND isTemporary = 1"
      ).get(parentTableId);

      // If no remaining sub-tables, update parent table to available
      if (remainingSubTables.count === 0) {
        db.prepare("UPDATE msttablemanagement SET status = 0 WHERE tableid = ?").run(parentTableId);
      }
    }

    res.json({ 
      success: true, 
      message: "Split table deleted successfully",
      deletedCount: deleteResult.changes
    });
  } catch (error) {
    console.error("Error deleting split table:", error);
    res.status(500).json({ success: false, message: "Failed to delete split table", error: error.message });
  }
};

// Get the next available split table name (e.g., 2A, 2B, 2C)
exports.getNextSplitTableName = (req, res) => {
  try {
    const { parentTableId } = req.params;

    if (!parentTableId) {
      return res.status(400).json({ success: false, message: "Parent table ID is required" });
    }

    // Get parent table info
    const parentTable = db.prepare("SELECT * FROM msttablemanagement WHERE tableid = ?").get(parentTableId);
    if (!parentTable) {
      return res.status(404).json({ success: false, message: "Parent table not found" });
    }

    const parentTableName = parentTable.table_name;

    // Get all existing sub-tables for this parent
    const existingSubTables = db.prepare(`
      SELECT table_name FROM msttablemanagement 
      WHERE parentTableId = ? AND isTemporary = 1
    `).all(parentTableId);

    // Extract the letters used (e.g., if we have 2A, 2B, get A, B)
    const usedLetters = new Set();
    for (const table of existingSubTables) {
      const letter = table.table_name.replace(parentTableName, '');
      if (letter && /^[A-Z]$/.test(letter)) {
        usedLetters.add(letter);
      }
    }

    // Find the next available letter
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let nextLetter = '';
    
    for (const letter of alphabet) {
      if (!usedLetters.has(letter)) {
        nextLetter = letter;
        break;
      }
    }

    if (!nextLetter) {
      return res.status(400).json({ 
        success: false, 
        message: "Maximum number of split tables reached (26)" 
      });
    }

    const nextTableName = `${parentTableName}${nextLetter}`;

    res.json({ 
      success: true, 
      data: { 
        parentTableName: parentTableName,
        nextTableName: nextTableName,
        nextLetter: nextLetter
      } 
    });
  } catch (error) {
    console.error("Error getting next split table name:", error);
    res.status(500).json({ success: false, message: "Failed to get next split table name", error: error.message });
  }
};
