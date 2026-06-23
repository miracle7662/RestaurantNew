const db = require('../../../config/db');

// GET all departments
exports.getDepartments = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        department_id as hotel_departmentid, 
        department_name as hotel_department_name,
        status
      FROM departmentmaster 
      ORDER BY department_name ASC`
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

// GET single department
exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT * FROM departmentmaster WHERE department_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};