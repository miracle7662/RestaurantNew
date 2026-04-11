const db = require("../config/db");

// Get all departments
exports.getAllDepartments = async (req, res) => {
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

    // console.log("Final Query:", query);
    // console.log("Params:", params);

    const [rows] = await db.query(query, params);

    res.status(200).json({
      success: true,
      count: rows.length,
      data: rows
    });

  } catch (error) {
    // console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch departments",
      error: error.message
    });
  }
};  


// Get a single department by ID
exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query(`
      SELECT *
      FROM msttable_department
      WHERE departmentid = ? AND status IS NOT NULL
    `, [id]);

    const row = rows[0];

    if (!row) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    res.status(200).json({ success: true, data: row });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch department", error: error.message });
  }
};

// Create a new department
exports.createDepartment = async (req, res) => {
  try {
    const { department_name, outletid, taxgroupid, status, created_by_id } = req.body;

    if (!department_name || !outletid || !created_by_id) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const [result] = await db.query(`
      INSERT INTO msttable_department (department_name, outletid, taxgroupid, status, created_by_id)
      VALUES (?, ?, ?, ?, ?)
    `, [department_name, outletid, taxgroupid ?? null, status ?? 1, created_by_id]);

    const [rows] = await db.query(`
      SELECT departmentid, department_name, outletid, taxgroupid, status, created_by_id, created_date, updated_by_id, updated_date
      FROM msttable_department
      WHERE departmentid = ?
    `, [result.insertId]);

    res.status(201).json({ success: true, message: "Department added successfully", data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create department", error: error.message });
  }
};


// Update a department
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { department_name, outletid, taxgroupid, status, updated_by_id } = req.body;

    if (!department_name || !outletid) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const [result] = await db.query(`
      UPDATE msttable_department
      SET department_name = ?, outletid = ?, taxgroupid = ?, status = ?, updated_by_id = ?, updated_date = CURRENT_TIMESTAMP
      WHERE departmentid = ?
    `, [department_name, outletid, taxgroupid ?? null, status, updated_by_id, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    const [rows] = await db.query(`
      SELECT departmentid, department_name, outletid, taxgroupid, status, created_by_id, created_date, updated_by_id, updated_date
      FROM msttable_department
      WHERE departmentid = ?
    `, [id]);

    res.status(200).json({ success: true, message: "Department updated successfully", data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update department", error: error.message });
  }
};

// Delete a department
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(`DELETE FROM msttable_department WHERE departmentid = ?`, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    res.status(200).json({ success: true, message: "Department deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete department", error: error.message });
  }
};