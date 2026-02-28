const db = require("../config/db");

// Get all departments
exports.getAllDepartments = (req, res) => {
  try {
    const { hotelid, outletid } = req.query;

    let query = `
      SELECT 
        d.*, 
        o.outlet_name, 
        o.hotelid AS outlet_hotelid,
        h.hotel_name
      FROM msttable_department d
      LEFT JOIN mst_outlets o ON d.outletid = o.outletid
      LEFT JOIN msthotelmasters h ON o.hotelid = h.hotelid
      WHERE d.status in (1,0)
    `;

    const params = [];

    // ✅ Hotel wise filtering
    if (hotelid) {
      query += ` AND h.hotelid = ?`;
      params.push(Number(hotelid));
    }

    // ✅ Outlet wise filtering
    if (outletid) {
      query += ` AND d.outletid = ?`;
      params.push(Number(outletid));
    }

    query += ` ORDER BY d.department_name ASC`;

    console.log("Final Query:", query);
    console.log("Params:", params);

    const rows = db.prepare(query).all(...params);

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });

  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch departments",
      error: error.message
    });
  }
};  


// Get a single department by ID
exports.getDepartmentById = (req, res) => {
  try {
    const { id } = req.params;
    const row = db.prepare(`
      SELECT *
      FROM msttable_department
      WHERE departmentid = ? AND status IS NOT NULL
    `).get(id);

    if (!row) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    res.status(200).json({ success: true, data: row });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch department", error: error.message });
  }
};

// Create a new department
// Create a new department
exports.createDepartment = (req, res) => {
  try {
    const { department_name, outletid, taxgroupid, status, created_by_id } = req.body;

    if (!department_name || !outletid || !created_by_id) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const stmt = db.prepare(`
      INSERT INTO msttable_department (department_name, outletid, taxgroupid, status, created_by_id)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(department_name, outletid, taxgroupid ?? null, status ?? 1, created_by_id);

    const newDepartment = db.prepare(`
      SELECT departmentid, department_name, outletid, taxgroupid, status, created_by_id, created_date, updated_by_id, updated_date
      FROM msttable_department
      WHERE departmentid = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ success: true, message: "Department added successfully", data: newDepartment });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create department", error: error.message });
  }
};


// Update a department
exports.updateDepartment = (req, res) => {
  try {
    const { id } = req.params;
    const { department_name, outletid, taxgroupid, status, updated_by_id } = req.body;

    if (!department_name || !outletid) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const stmt = db.prepare(`
      UPDATE msttable_department
      SET department_name = ?, outletid = ?, taxgroupid = ?, status = ?, updated_by_id = ?, updated_date = CURRENT_TIMESTAMP
      WHERE departmentid = ?
    `);
    const result = stmt.run(department_name, outletid, taxgroupid ?? null, status, updated_by_id, id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    const updatedDepartment = db.prepare(`
      SELECT departmentid, department_name, outletid, taxgroupid, status, created_by_id, created_date, updated_by_id, updated_date
      FROM msttable_department
      WHERE departmentid = ?
    `).get(id);

    res.status(200).json({ success: true, message: "Department updated successfully", data: updatedDepartment });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update department", error: error.message });
  }
};

// Delete a department
exports.deleteDepartment = (req, res) => {
  try {
    const { id } = req.params;

    const stmt = db.prepare(`DELETE FROM msttable_department WHERE departmentid = ?`);
    const result = stmt.run(id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    res.status(200).json({ success: true, message: "Department deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete department", error: error.message });
  }
};