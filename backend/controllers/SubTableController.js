/**
 * SubTableController.js
 * 
 * Handles dynamic sub-table creation and management for restaurant billing system
 * 
 * Sub-tables (2A, 2B, 2C...2Z) are linked to parent tables and managed through this controller
 */

const db = require('../config/db');

// Utility function to generate sub-table names
function generateSubTableNames(parentTableName) {
  const subTables = [];
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  for (let i = 0; i < alphabet.length; i++) {
    subTables.push(`${parentTableName}${alphabet[i]}`);
  }
  
  return subTables;
}

// Utility to extract parent table name from sub-table name
function getParentTableName(subTableName) {
  // Remove trailing letters to get parent table name
  // e.g., "2A" -> "2", "Table10" -> "Table10" (no suffix)
  return subTableName.replace(/[A-Z]+$/, '');
}

// Utility to get next available sub-table letter
function getNextSubTableLetter(parentTableName, existingSubTables) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  
  // Get existing sub-table letters for this parent
  const existingLetters = existingSubTables.map(st => {
    const suffix = st.sub_table_name.replace(parentTableName, '');
    return suffix.charAt(0);
  });
  
  // Find first available letter
  for (let i = 0; i < alphabet.length; i++) {
    if (!existingLetters.includes(alphabet[i])) {
      return alphabet[i];
    }
  }
  
  return null; // All sub-tables are taken
}

/**
 * Get all sub-tables for a parent table
 * GET /api/sub-tables/:parentTableId
 */
exports.getSubTablesByParent = (req, res) => {
  try {
    const { parentTableId } = req.params;
    
    if (!parentTableId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Parent table ID is required' 
      });
    }

    const sql = `
      SELECT 
        s.*,
        t.table_name as parent_table_name,
        t.status as parent_table_status
      FROM mst_sub_tables s
      LEFT JOIN msttablemanagement t ON s.parent_table_id = t.tableid
      WHERE s.parent_table_id = ?
      ORDER BY s.sub_table_name ASC
    `;
    
    const subTables = db.prepare(sql).all(parentTableId);
    
    res.json({
      success: true,
      data: subTables
    });
    
  } catch (error) {
    console.error('Error fetching sub-tables:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch sub-tables', 
      error: error.message 
    });
  }
};

/**
 * Get available (not in use) sub-tables for a parent table
 * GET /api/sub-tables/available/:parentTableId
 */
exports.getAvailableSubTables = (req, res) => {
  try {
    const { parentTableId } = req.params;
    
    if (!parentTableId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Parent table ID is required' 
      });
    }

    // Get all available sub-tables (status = 0)
    const sql = `
      SELECT * FROM mst_sub_tables 
      WHERE parent_table_id = ? AND status = 0
      ORDER BY sub_table_name ASC
    `;
    
    const availableSubTables = db.prepare(sql).all(parentTableId);
    
    res.json({
      success: true,
      data: availableSubTables
    });
    
  } catch (error) {
    console.error('Error fetching available sub-tables:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch available sub-tables', 
      error: error.message 
    });
  }
};

/**
 * Get next available sub-table (for automatic allocation)
 * GET /api/sub-tables/next-available/:parentTableId
 */
exports.getNextAvailableSubTable = (req, res) => {
  try {
    const { parentTableId } = req.params;
    
    if (!parentTableId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Parent table ID is required' 
      });
    }

    // First, check if there's an existing unbilled sub-table
    const existingUnbilled = db.prepare(`
      SELECT * FROM mst_sub_tables 
      WHERE parent_table_id = ? AND status = 1
      ORDER BY sub_table_name ASC
      LIMIT 1
    `).get(parentTableId);

    if (existingUnbilled) {
      // There's already an unbilled sub-table, return it
      return res.json({
        success: true,
        data: existingUnbilled,
        message: 'Using existing unbilled sub-table'
      });
    }

    // Get all existing sub-tables for this parent
    const existingSubTables = db.prepare(`
      SELECT sub_table_name FROM mst_sub_tables 
      WHERE parent_table_id = ?
    `).all(parentTableId);

    // Get parent table info
    const parentTable = db.prepare(`
      SELECT table_name, outletid, hotelid, departmentid 
      FROM msttablemanagement 
      WHERE tableid = ?
    `).get(parentTableId);

    if (!parentTable) {
      return res.status(404).json({ 
        success: false, 
        message: 'Parent table not found' 
      });
    }

    // Find next available letter
    const nextLetter = getNextSubTableLetter(parentTable.table_name, existingSubTables);
    
    if (!nextLetter) {
      return res.status(400).json({ 
        success: false, 
        message: 'All sub-tables (A-Z) are currently in use for this table' 
      });
    }

    const newSubTableName = `${parentTable.table_name}${nextLetter}`;

    // Create the new sub-table
    const insertSql = `
      INSERT INTO mst_sub_tables (
        parent_table_id, 
        sub_table_name, 
        outletid, 
        hotelid, 
        departmentid, 
        status,
        created_date
      ) VALUES (?, ?, ?, ?, ?, 0, datetime('now'))
    `;

    const result = db.prepare(insertSql).run(
      parentTableId,
      newSubTableName,
      parentTable.outletid,
      parentTable.hotelid,
      parentTable.departmentid
    );

    const newSubTable = db.prepare(`
      SELECT * FROM mst_sub_tables WHERE sub_table_id = ?
    `).get(result.lastInsertRowid);

    res.json({
      success: true,
      data: newSubTable,
      message: `Created new sub-table: ${newSubTableName}`
    });

  } catch (error) {
    console.error('Error getting next available sub-table:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get next available sub-table', 
      error: error.message 
    });
  }
};

/**
 * Create a new sub-table (or return existing unbilled one)
 * POST /api/sub-tables
 */
exports.createSubTable = (req, res) => {
  try {
    const { parentTableId, subTableName } = req.body;

    if (!parentTableId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Parent table ID is required' 
      });
    }

    // Check if there's already an unbilled sub-table for this parent
    const existingUnbilled = db.prepare(`
      SELECT * FROM mst_sub_tables 
      WHERE parent_table_id = ? AND status IN (1, 2)
      ORDER BY sub_table_name ASC
    `).get(parentTableId);

    if (existingUnbilled) {
      // Return existing unbilled/billed sub-table
      return res.json({
        success: true,
        data: existingUnbilled,
        message: 'Using existing active sub-table',
        isExisting: true
      });
    }

    // Get parent table info
    const parentTable = db.prepare(`
      SELECT table_name, outletid, hotelid, departmentid 
      FROM msttablemanagement 
      WHERE tableid = ?
    `).get(parentTableId);

    if (!parentTable) {
      return res.status(404).json({ 
        success: false, 
        message: 'Parent table not found' 
      });
    }

    // Determine sub-table name
    let targetSubTableName;
    
    if (subTableName) {
      // Check if the requested sub-table is available
      const existing = db.prepare(`
        SELECT * FROM mst_sub_tables 
        WHERE parent_table_id = ? AND sub_table_name = ?
      `).get(parentTableId, subTableName);

      if (existing) {
        if (existing.status === 0) {
          // It's available, update status to running
          db.prepare(`
            UPDATE mst_sub_tables 
            SET status = 1, updated_date = datetime('now')
            WHERE sub_table_id = ?
          `).run(existing.sub_table_id);

          const updated = db.prepare(`
            SELECT * FROM mst_sub_tables WHERE sub_table_id = ?
          `).get(existing.sub_table_id);

          return res.json({
            success: true,
            data: updated,
            message: `Activated sub-table: ${subTableName}`
          });
        } else {
          // It's already in use
          return res.status(400).json({ 
            success: false, 
            message: `Sub-table ${subTableName} is already in use` 
          });
        }
      }
      targetSubTableName = subTableName;
    } else {
      // Auto-generate next available sub-table name
      const existingSubTables = db.prepare(`
        SELECT sub_table_name FROM mst_sub_tables 
        WHERE parent_table_id = ?
      `).all(parentTableId);

      const nextLetter = getNextSubTableLetter(parentTable.table_name, existingSubTables);
      
      if (!nextLetter) {
        return res.status(400).json({ 
          success: false, 
          message: 'All sub-tables (A-Z) are currently in use for this table' 
        });
      }

      targetSubTableName = `${parentTable.table_name}${nextLetter}`;
    }

    // Create new sub-table
    const insertSql = `
      INSERT INTO mst_sub_tables (
        parent_table_id, 
        sub_table_name, 
        outletid, 
        hotelid, 
        departmentid, 
        status,
        created_date
      ) VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
    `;

    const result = db.prepare(insertSql).run(
      parentTableId,
      targetSubTableName,
      parentTable.outletid,
      parentTable.hotelid,
      parentTable.departmentid
    );

    const newSubTable = db.prepare(`
      SELECT * FROM mst_sub_tables WHERE sub_table_id = ?
    `).get(result.lastInsertRowid);

    res.json({
      success: true,
      data: newSubTable,
      message: `Created new sub-table: ${targetSubTableName}`,
      isExisting: false
    });

  } catch (error) {
    console.error('Error creating sub-table:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create sub-table', 
      error: error.message 
    });
  }
};

/**
 * Update sub-table status
 * PUT /api/sub-tables/:id/status
 */
exports.updateSubTableStatus = (req, res) => {
  try {
    const { id } = req.params;
    const { status, kotId } = req.body;

    if (status === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status is required' 
      });
    }

    // Validate status value
    if (status < 0 || status > 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid status value. Must be 0-3' 
      });
    }

    const updateSql = `
      UPDATE mst_sub_tables 
      SET status = ?, kot_id = ?, updated_date = datetime('now')
      WHERE sub_table_id = ?
    `;

    const result = db.prepare(updateSql).run(status, kotId || null, id);

    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Sub-table not found' 
      });
    }

    const updatedSubTable = db.prepare(`
      SELECT * FROM mst_sub_tables WHERE sub_table_id = ?
    `).get(id);

    res.json({
      success: true,
      data: updatedSubTable,
      message: 'Sub-table status updated'
    });

  } catch (error) {
    console.error('Error updating sub-table status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update sub-table status', 
      error: error.message 
    });
  }
};

/**
 * Link KOT to sub-table
 * PUT /api/sub-tables/:id/kot
 */
exports.linkKOTToSubTable = (req, res) => {
  try {
    const { id } = req.params;
    const { kotId } = req.body;

    if (!kotId) {
      return res.status(400).json({ 
        success: false, 
        message: 'KOT ID is required' 
      });
    }

    // Use transaction for atomicity
    const trx = db.transaction(() => {
      // Update sub-table status to running and link KOT
      db.prepare(`
        UPDATE mst_sub_tables 
        SET status = 1, kot_id = ?, updated_date = datetime('now')
        WHERE sub_table_id = ?
      `).run(kotId, id);

      // Get parent table ID
      const subTable = db.prepare(`
        SELECT parent_table_id FROM mst_sub_tables WHERE sub_table_id = ?
      `).get(id);

      // Update parent table status to occupied (1) - but don't mark as running yet
      if (subTable) {
        db.prepare(`
          UPDATE msttablemanagement 
          SET status = 1 
          WHERE tableid = ? AND status = 0
        `).run(subTable.parent_table_id);
      }
    });

    trx();

    const updatedSubTable = db.prepare(`
      SELECT * FROM mst_sub_tables WHERE sub_table_id = ?
    `).get(id);

    res.json({
      success: true,
      data: updatedSubTable,
      message: 'KOT linked to sub-table successfully'
    });

  } catch (error) {
    console.error('Error linking KOT to sub-table:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to link KOT to sub-table', 
      error: error.message 
    });
  }
};

/**
 * Release/reset a sub-table (after settlement)
 * DELETE /api/sub-tables/:id/release
 */
exports.releaseSubTable = (req, res) => {
  try {
    const { id } = req.params;

    // Use transaction for atomicity
    const trx = db.transaction(() => {
      // Get sub-table info
      const subTable = db.prepare(`
        SELECT * FROM mst_sub_tables WHERE sub_table_id = ?
      `).get(id);

      if (!subTable) {
        throw new Error('Sub-table not found');
      }

      // Reset sub-table status to available (0)
      db.prepare(`
        UPDATE mst_sub_tables 
        SET status = 0, kot_id = NULL, updated_date = datetime('now')
        WHERE sub_table_id = ?
      `).run(id);

      // Check if there are any other active sub-tables for this parent
      const otherActiveSubTables = db.prepare(`
        SELECT COUNT(*) as count 
        FROM mst_sub_tables 
        WHERE parent_table_id = ? AND status > 0 AND sub_table_id != ?
      `).get(subTable.parent_table_id, id);

      // Only reset parent table if no other sub-tables are active
      if (otherActiveSubTables.count === 0) {
        db.prepare(`
          UPDATE msttablemanagement 
          SET status = 0 
          WHERE tableid = ?
        `).run(subTable.parent_table_id);
      }
    });

    trx();

    const releasedSubTable = db.prepare(`
      SELECT * FROM mst_sub_tables WHERE sub_table_id = ?
    `).get(id);

    res.json({
      success: true,
      data: releasedSubTable,
      message: 'Sub-table released successfully'
    });

  } catch (error) {
    console.error('Error releasing sub-table:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to release sub-table', 
      error: error.message 
    });
  }
};

/**
 * Get sub-table by ID
 * GET /api/sub-tables/by-id/:id
 */
exports.getSubTableById = (req, res) => {
  try {
    const { id } = req.params;

    const subTable = db.prepare(`
      SELECT 
        s.*,
        t.table_name as parent_table_name,
        t.status as parent_table_status
      FROM mst_sub_tables s
      LEFT JOIN msttablemanagement t ON s.parent_table_id = t.tableid
      WHERE s.sub_table_id = ?
    `).get(id);

    if (!subTable) {
      return res.status(404).json({ 
        success: false, 
        message: 'Sub-table not found' 
      });
    }

    res.json({
      success: true,
      data: subTable
    });

  } catch (error) {
    console.error('Error fetching sub-table:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch sub-table', 
      error: error.message 
    });
  }
};

/**
 * Check if sub-table exists by name
 * GET /api/sub-tables/by-name/:tableName
 */
exports.getSubTableByName = (req, res) => {
  try {
    const { tableName } = req.params;

    const subTable = db.prepare(`
      SELECT 
        s.*,
        t.table_name as parent_table_name,
        t.status as parent_table_status
      FROM mst_sub_tables s
      LEFT JOIN msttablemanagement t ON s.parent_table_id = t.tableid
      WHERE s.sub_table_name = ?
    `).get(tableName);

    if (!subTable) {
      return res.status(404).json({ 
        success: false, 
        message: 'Sub-table not found' 
      });
    }

    res.json({
      success: true,
      data: subTable
    });

  } catch (error) {
    console.error('Error fetching sub-table by name:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch sub-table', 
      error: error.message 
    });
  }
};

/**
 * Initialize all sub-tables for a parent table (bulk create)
 * POST /api/sub-tables/initialize/:parentTableId
 */
exports.initializeSubTables = (req, res) => {
  try {
    const { parentTableId } = req.params;

    // Get parent table info
    const parentTable = db.prepare(`
      SELECT table_name, outletid, hotelid, departmentid 
      FROM msttablemanagement 
      WHERE tableid = ?
    `).get(parentTableId);

    if (!parentTable) {
      return res.status(404).json({ 
        success: false, 
        message: 'Parent table not found' 
      });
    }

    // Generate all sub-table names
    const subTableNames = generateSubTableNames(parentTable.table_name);

    // Check which ones already exist
    const existingSubTables = db.prepare(`
      SELECT sub_table_name FROM mst_sub_tables 
      WHERE parent_table_id = ?
    `).all(parentTableId);

    const existingNames = existingSubTables.map(st => st.sub_table_name);

    // Create missing sub-tables
    const trx = db.transaction(() => {
      let created = 0;
      
      for (const subName of subTableNames) {
        if (!existingNames.includes(subName)) {
          db.prepare(`
            INSERT INTO mst_sub_tables (
              parent_table_id, 
              sub_table_name, 
              outletid, 
              hotelid, 
              departmentid, 
              status,
              created_date
            ) VALUES (?, ?, ?, ?, ?, 0, datetime('now'))
          `).run(
            parentTableId,
            subName,
            parentTable.outletid,
            parentTable.hotelid,
            parentTable.departmentid
          );
          created++;
        }
      }
      
      return created;
    });

    const newCount = trx();

    // Get all sub-tables for this parent
    const allSubTables = db.prepare(`
      SELECT * FROM mst_sub_tables 
      WHERE parent_table_id = ?
      ORDER BY sub_table_name ASC
    `).all(parentTableId);

    res.json({
      success: true,
      data: allSubTables,
      message: `Initialized ${newCount} new sub-tables for table ${parentTable.table_name}`
    });

  } catch (error) {
    console.error('Error initializing sub-tables:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to initialize sub-tables', 
      error: error.message 
    });
  }
};

/**
 * Delete a sub-table (admin function)
 * DELETE /api/sub-tables/:id
 */
exports.deleteSubTable = (req, res) => {
  try {
    const { id } = req.params;

    // Check if sub-table is active
    const subTable = db.prepare(`
      SELECT * FROM mst_sub_tables WHERE sub_table_id = ? AND status > 0
    `).get(id);

    if (subTable) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete an active sub-table. Please settle the bill first.' 
      });
    }

    const result = db.prepare(`
      DELETE FROM mst_sub_tables WHERE sub_table_id = ?
    `).run(id);

    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Sub-table not found' 
      });
    }

    res.json({
      success: true,
      message: 'Sub-table deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting sub-table:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete sub-table', 
      error: error.message 
    });
  }
};

module.exports = exports;
