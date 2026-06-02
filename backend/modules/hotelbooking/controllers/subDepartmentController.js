const db = require('../../../config/db');

// Helper to get current user ID (from auth middleware)
const getCurrentUserId = (req) => {
    return req.user?.id || null;
};

// Helper to get current user's hotel ID
const getCurrentUserHotelId = (req) => {
    return req.user?.hotel_id || null;
};

// Helper function to format datetime for MySQL DATETIME column
const formatDateTime = (dateValue) => {
    if (!dateValue) return null;
    if (dateValue instanceof Date) {
        return dateValue.toISOString().slice(0, 19).replace('T', ' ');
    }
    const dateStr = String(dateValue);
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)) {
        return dateStr;
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 19).replace('T', ' ');
};

// ----------------------------------------------------------------------
// GET /sub-departments - list all sub-departments with filters
// ----------------------------------------------------------------------
exports.getSubDepartments = async (req, res) => {
    try {
        let hotelId = req.query.hotelid || getCurrentUserHotelId(req);
        const departmentId = req.query.department_id;
        const status = req.query.status;
        const search = req.query.q;

        let query = `
            SELECT sd.*, d.department_name as parent_department_name
            FROM sub_departments sd
            LEFT JOIN departmentmaster d ON sd.department_id = d.department_id
            WHERE 1=1
        `;
        const params = [];

        if (hotelId) {
            query += ` AND sd.hotelid = ?`;
            params.push(hotelId);
        }

        if (departmentId) {
            query += ` AND sd.department_id = ?`;
            params.push(departmentId);
        }

        if (status !== undefined && status !== '') {
            query += ` AND sd.status = ?`;
            params.push(parseInt(status));
        }

        if (search) {
            query += ` AND (sd.sub_department_name LIKE ? OR sd.description LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ` ORDER BY sd.sub_department_name ASC`;

        const [rows] = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching sub-departments:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

// ----------------------------------------------------------------------
// GET /sub-departments/department/:departmentId - get sub-departments by department
// ----------------------------------------------------------------------
exports.getSubDepartmentsByDepartment = async (req, res) => {
    try {
        const { departmentId } = req.params;
        let hotelId = req.query.hotelid || getCurrentUserHotelId(req);

        let query = `
            SELECT sd.*, d.department_name as parent_department_name
            FROM sub_departments sd
            LEFT JOIN departmentmaster d ON sd.department_id = d.department_id
            WHERE sd.department_id = ? AND sd.status = 1
        `;
        const params = [departmentId];

        if (hotelId) {
            query += ` AND sd.hotelid = ?`;
            params.push(hotelId);
        }

        query += ` ORDER BY sd.sub_department_name ASC`;

        const [rows] = await db.query(query, params);
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching sub-departments by department:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

// ----------------------------------------------------------------------
// GET /sub-departments/:id - get single sub-department
// ----------------------------------------------------------------------
exports.getSubDepartmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const [rows] = await db.query(`
            SELECT sd.*, d.department_name as parent_department_name
            FROM sub_departments sd
            LEFT JOIN departmentmaster d ON sd.department_id = d.department_id
            WHERE sd.sub_department_id = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sub-department not found'
            });
        }

        res.json({ success: true, data: rows[0] });
    } catch (error) {
        console.error('Error fetching sub-department:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

// ----------------------------------------------------------------------
// POST /sub-departments - create new sub-department
// ----------------------------------------------------------------------
exports.createSubDepartment = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const userId = getCurrentUserId(req);
        let hotelId = req.body.hotelid || getCurrentUserHotelId(req);

        const {
            department_id,
            department_name,
            sub_department_name,
            description,
            status
        } = req.body;

        // Validate required fields
        if (!department_id) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Department ID is required' });
        }

        if (!sub_department_name) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Sub-department name is required' });
        }

        // Check if department exists
        const [department] = await connection.execute(
            `SELECT department_id, department_name FROM departmentmaster WHERE department_id = ?`,
            [department_id]
        );

        if (!department || department.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Parent department not found' });
        }

        const parentDepartmentName = department[0].department_name;

        const created_date = formatDateTime(new Date());

        // Insert sub-department
        const [result] = await connection.execute(`
            INSERT INTO sub_departments (
                department_id, department_name, sub_department_name, description,
                hotelid, status, created_by_id, created_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            department_id,
            parentDepartmentName,
            sub_department_name,
            description || null,
            hotelId || null,
            status !== undefined ? status : 1,
            req.body.created_by_id || userId,
            created_date
        ]);

        await connection.commit();

        // Fetch the newly created sub-department
        const [newSubDepartment] = await connection.execute(`
            SELECT sd.*, d.department_name as parent_department_name
            FROM sub_departments sd
            LEFT JOIN departmentmaster d ON sd.department_id = d.department_id
            WHERE sd.sub_department_id = ?
        `, [result.insertId]);

        res.status(201).json({
            success: true,
            message: 'Sub-department created successfully',
            data: newSubDepartment[0]
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating sub-department:', error);
        res.status(500).json({ success: false, message: 'Failed to create sub-department', error: error.message });
    } finally {
        connection.release();
    }
};

// ----------------------------------------------------------------------
// PUT /sub-departments/:id - update sub-department
// ----------------------------------------------------------------------
exports.updateSubDepartment = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const userId = getCurrentUserId(req);
        const { id } = req.params;

        const {
            department_id,
            sub_department_name,
            description,
            hotelid,
            status
        } = req.body;

        // Check if sub-department exists
        const [existing] = await connection.execute(
            `SELECT * FROM sub_departments WHERE sub_department_id = ?`,
            [id]
        );

        if (!existing || existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Sub-department not found' });
        }

        let parentDepartmentName = existing[0].department_name;
        
        // If department_id changed, get new parent department name
        if (department_id && department_id !== existing[0].department_id) {
            const [department] = await connection.execute(
                `SELECT department_name FROM departmentmaster WHERE department_id = ?`,
                [department_id]
            );
            if (department && department.length > 0) {
                parentDepartmentName = department[0].department_name;
            }
        }

        const updated_date = formatDateTime(new Date());

        // Update sub-department
        const [updateResult] = await connection.execute(`
            UPDATE sub_departments
            SET department_id = ?,
                department_name = ?,
                sub_department_name = ?,
                description = ?,
                hotelid = ?,
                status = ?,
                updated_by_id = ?,
                updated_date = ?
            WHERE sub_department_id = ?
        `, [
            department_id || existing[0].department_id,
            parentDepartmentName,
            sub_department_name || existing[0].sub_department_name,
            description !== undefined ? description : existing[0].description,
            hotelid !== undefined ? hotelid : existing[0].hotelid,
            status !== undefined ? status : existing[0].status,
            req.body.updated_by_id || userId,
            updated_date,
            id
        ]);

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Sub-department not found' });
        }

        await connection.commit();

        // Fetch updated sub-department
        const [updatedSubDepartment] = await connection.execute(`
            SELECT sd.*, d.department_name as parent_department_name
            FROM sub_departments sd
            LEFT JOIN departmentmaster d ON sd.department_id = d.department_id
            WHERE sd.sub_department_id = ?
        `, [id]);

        res.json({
            success: true,
            message: 'Sub-department updated successfully',
            data: updatedSubDepartment[0]
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating sub-department:', error);
        res.status(500).json({ success: false, message: 'Failed to update sub-department', error: error.message });
    } finally {
        connection.release();
    }
};

// ----------------------------------------------------------------------
// DELETE /sub-departments/:id - delete sub-department
// ----------------------------------------------------------------------
exports.deleteSubDepartment = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const { id } = req.params;

        // Check if sub-department exists
        const [existing] = await connection.execute(
            `SELECT * FROM sub_departments WHERE sub_department_id = ?`,
            [id]
        );

        if (!existing || existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Sub-department not found' });
        }

        const [deleteResult] = await connection.execute(
            `DELETE FROM sub_departments WHERE sub_department_id = ?`,
            [id]
        );

        if (deleteResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Sub-department not found' });
        }

        await connection.commit();

        res.json({
            success: true,
            message: 'Sub-department deleted successfully',
            data: { sub_department_id: parseInt(id) }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting sub-department:', error);
        res.status(500).json({ success: false, message: 'Failed to delete sub-department', error: error.message });
    } finally {
        connection.release();
    }
};