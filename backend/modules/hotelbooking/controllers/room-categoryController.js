const db = require('../../../config/db');

// Helper to get current user ID (from auth middleware)
const getCurrentUserId = (req) => {
    return req.user?.id || null;
};

// Helper to get current user's hotel ID
const getCurrentUserHotelId = (req) => {
    return req.user?.hotel_id || null;
};

// Helper function to format date for MySQL DATE column (YYYY-MM-DD)
const formatDateOnly = (dateValue) => {
    if (!dateValue) return null;
    // If it's a Date object
    if (dateValue instanceof Date) {
        return dateValue.toISOString().split('T')[0];
    }
    // If it's a string
    const dateStr = String(dateValue);
    // If it already looks like YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return dateStr;
    }
    // Parse ISO string or other formats
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
};

// Helper function to format datetime for MySQL DATETIME column
const formatDateTime = (dateValue) => {
    if (!dateValue) return null;
    // If it's a Date object
    if (dateValue instanceof Date) {
        return dateValue.toISOString().slice(0, 19).replace('T', ' ');
    }
    const dateStr = String(dateValue);
    // If it's already in YYYY-MM-DD HH:MM:SS format
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)) {
        return dateStr;
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 19).replace('T', ' ');
};

// ----------------------------------------------------------------------
// GET /room-categories/modes – list all active charge modes
// ----------------------------------------------------------------------
exports.getChargeModes = async (req, res) => {
    try {
        const [modes] = await db.execute(`
            SELECT id, mode_name, description
            FROM room_charge_mode_master
            WHERE status = 1
            ORDER BY id
        `);
        res.json({ success: true, data: modes });
    } catch (error) {
        console.error('Error fetching charge modes:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

// ----------------------------------------------------------------------
// GET /room-categories – list categories (optionally filter by hotel)
// ----------------------------------------------------------------------
exports.getCategories = async (req, res) => {
    try {
        let hotelId = req.query.hotelid || req.query.mst_hotelid;
        if (!hotelId) {
            hotelId = getCurrentUserHotelId(req);
        }
        if (!hotelId && req.body?.hotelid) {
            hotelId = req.body.hotelid;
        }
        if (!hotelId) {
            return res.status(400).json({ success: false, message: 'Hotel ID not found' });
        }

        // Fetch categories with department names
        const [categories] = await db.execute(`
            SELECT rc.*, d.department_name
            FROM room_category rc
            LEFT JOIN departmentmaster d ON rc.department_id = d.department_id
            WHERE rc.hotelid = ?
            ORDER BY rc.room_category_id DESC
        `, [hotelId]);

        // For each category, fetch tariffs and mode charges
        const result = [];
        for (const cat of categories) {
            const [tariffs] = await db.execute(
                `SELECT * FROM room_category_tariff WHERE room_category_id = ?`,
                [cat.room_category_id]
            );
            
            const [modeCharges] = await db.execute(`
                SELECT mc.*, mm.mode_name
                FROM room_category_mode_charge mc
                JOIN room_charge_mode_master mm ON mc.mode_id = mm.id
                WHERE mc.room_category_id = ?
            `, [cat.room_category_id]);
            
            result.push({ ...cat, tariffs, mode_charges: modeCharges });
        }

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

// ----------------------------------------------------------------------
// GET /room-categories/:id – get single category with tariffs & mode charges
// ----------------------------------------------------------------------
exports.getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;

        const [categories] = await db.execute(`
            SELECT rc.*, d.department_name
            FROM room_category rc
            LEFT JOIN departmentmaster d ON rc.department_id = d.department_id
            WHERE rc.room_category_id = ?
        `, [id]);

        if (!categories || categories.length === 0) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        const category = categories[0];

        const [tariffs] = await db.execute(
            `SELECT * FROM room_category_tariff WHERE room_category_id = ?`,
            [id]
        );

        const [modeCharges] = await db.execute(`
            SELECT mc.*, mm.mode_name
            FROM room_category_mode_charge mc
            JOIN room_charge_mode_master mm ON mc.mode_id = mm.id
            WHERE mc.room_category_id = ?
        `, [id]);

        res.json({
            success: true,
            data: { ...category, tariffs, mode_charges: modeCharges }
        });
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ success: false, message: 'Database error' });
    }
};

// ----------------------------------------------------------------------
// POST /room-categories – create new category with tariffs & mode charges
// ----------------------------------------------------------------------
exports.addCategory = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const userId = getCurrentUserId(req);
        let hotelId = req.body.hotelid || getCurrentUserHotelId(req);

        if (!hotelId) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Hotel ID not found' });
        }

        const {
            category_no, category_name, department_id, print_name, display_seq,
            display_name, total_rooms, apply_date, max_limit, overbooking_no,
            status, tariffs = [], mode_charges = []
        } = req.body;

        const created_date = formatDateTime(new Date());
        const formattedApplyDate = formatDateOnly(apply_date);

        // Insert category
        const [categoryResult] = await connection.execute(`
            INSERT INTO room_category (
                category_no, category_name, department_id, print_name, display_seq,
                display_name, total_rooms, apply_date, max_limit, overbooking_no,
                hotelid, status, created_by_id, created_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            category_no, category_name, department_id || null,
            print_name || null, display_seq || null, display_name || null,
            total_rooms || null, formattedApplyDate, max_limit || null,
            overbooking_no || null, hotelId, status || 1,
            req.body.created_by_id || userId, created_date
        ]);

        const categoryId = categoryResult.insertId;

        // Insert tariffs
        for (const t of tariffs) {
            await connection.execute(`
                INSERT INTO room_category_tariff (
                    room_category_id, no_of_pax, room_tariff, department_id,
                    is_tax_applicable, tax_type, discount_after
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                categoryId, t.no_of_pax, t.room_tariff, t.department_id || null,
                t.is_tax_applicable || 0, t.tax_type || null, t.discount_after || 0
            ]);
        }

        // Insert mode charges
        for (const m of mode_charges) {
            await connection.execute(`
                INSERT INTO room_category_mode_charge (
                    room_category_id, mode_id, charges, department_id,
                    is_tax_applicable, tax_type, discount_after, is_discount_apply
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                categoryId, m.mode_id, m.charges || 0, m.department_id || null,
                m.is_tax_applicable || 0, m.tax_type || null,
                m.discount_after || 0, m.is_discount_apply || 0
            ]);
        }

        await connection.commit();

        // Fetch the newly created category with all relations
        const [newCategory] = await connection.execute(`
            SELECT rc.*, d.department_name
            FROM room_category rc
            LEFT JOIN departmentmaster d ON rc.department_id = d.department_id
            WHERE rc.room_category_id = ?
        `, [categoryId]);

        const [tariffsResult] = await connection.execute(
            `SELECT * FROM room_category_tariff WHERE room_category_id = ?`,
            [categoryId]
        );

        const [modeChargesResult] = await connection.execute(`
            SELECT mc.*, mm.mode_name
            FROM room_category_mode_charge mc
            JOIN room_charge_mode_master mm ON mc.mode_id = mm.id
            WHERE mc.room_category_id = ?
        `, [categoryId]);

        res.status(201).json({
            success: true,
            message: 'Room category added successfully',
            data: { ...newCategory[0], tariffs: tariffsResult, mode_charges: modeChargesResult }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error adding category:', error);
        res.status(500).json({ success: false, message: 'Failed to add category', error: error.message });
    } finally {
        connection.release();
    }
};

// ----------------------------------------------------------------------
// PUT /room-categories/:id – update category and its children
// ----------------------------------------------------------------------
exports.updateCategory = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const userId = getCurrentUserId(req);
        const { id } = req.params;
        let hotelId = req.body.hotelid || getCurrentUserHotelId(req);

        if (!hotelId) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Hotel ID not found' });
        }

        // Check if category exists and belongs to the hotel
        const [existing] = await connection.execute(
            `SELECT hotelid FROM room_category WHERE room_category_id = ?`,
            [id]
        );

        if (!existing || existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        if (existing[0].hotelid !== hotelId) {
            await connection.rollback();
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const {
            category_no, category_name, department_id, print_name, display_seq,
            display_name, total_rooms, apply_date, max_limit, overbooking_no,
            status, tariffs = [], mode_charges = []
        } = req.body;

        const updated_date = formatDateTime(new Date());
        const formattedApplyDate = formatDateOnly(apply_date);

        // Update category
        const [updateResult] = await connection.execute(`
            UPDATE room_category
            SET category_no = ?, category_name = ?, department_id = ?, print_name = ?,
                display_seq = ?, display_name = ?, total_rooms = ?, apply_date = ?,
                max_limit = ?, overbooking_no = ?, hotelid = ?, status = ?,
                updated_by_id = ?, updated_date = ?
            WHERE room_category_id = ?
        `, [
            category_no, category_name, department_id || null,
            print_name || null, display_seq || null, display_name || null,
            total_rooms || null, formattedApplyDate, max_limit || null,
            overbooking_no || null, hotelId, status || 1,
            req.body.updated_by_id || userId, updated_date, id
        ]);

        if (updateResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        // Replace tariffs
        await connection.execute(`DELETE FROM room_category_tariff WHERE room_category_id = ?`, [id]);
        for (const t of tariffs) {
            await connection.execute(`
                INSERT INTO room_category_tariff (
                    room_category_id, no_of_pax, room_tariff, department_id,
                    is_tax_applicable, tax_type, discount_after
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [
                id, t.no_of_pax, t.room_tariff, t.department_id || null,
                t.is_tax_applicable || 0, t.tax_type || null, t.discount_after || 0
            ]);
        }

        // Replace mode charges
        await connection.execute(`DELETE FROM room_category_mode_charge WHERE room_category_id = ?`, [id]);
        for (const m of mode_charges) {
            await connection.execute(`
                INSERT INTO room_category_mode_charge (
                    room_category_id, mode_id, charges, department_id,
                    is_tax_applicable, tax_type, discount_after, is_discount_apply
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                id, m.mode_id, m.charges || 0, m.department_id || null,
                m.is_tax_applicable || 0, m.tax_type || null,
                m.discount_after || 0, m.is_discount_apply || 0
            ]);
        }

        await connection.commit();

        // Fetch updated category
        const [updatedCategory] = await connection.execute(`
            SELECT rc.*, d.department_name
            FROM room_category rc
            LEFT JOIN departmentmaster d ON rc.department_id = d.department_id
            WHERE rc.room_category_id = ?
        `, [id]);

        const [tariffsResult] = await connection.execute(
            `SELECT * FROM room_category_tariff WHERE room_category_id = ?`,
            [id]
        );

        const [modeChargesResult] = await connection.execute(`
            SELECT mc.*, mm.mode_name
            FROM room_category_mode_charge mc
            JOIN room_charge_mode_master mm ON mc.mode_id = mm.id
            WHERE mc.room_category_id = ?
        `, [id]);

        res.json({
            success: true,
            message: 'Room category updated successfully',
            data: { ...updatedCategory[0], tariffs: tariffsResult, mode_charges: modeChargesResult }
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating category:', error);
        res.status(500).json({ success: false, message: 'Failed to update category', error: error.message });
    } finally {
        connection.release();
    }
};

// ----------------------------------------------------------------------
// DELETE /room-categories/:id – delete category and its children
// ----------------------------------------------------------------------
exports.deleteCategory = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

     const { id } = req.params;
     const hotelid = req.body?.hotelid;
     let hotelId = hotelid || getCurrentUserHotelId(req);

        // Verify ownership
        const [existing] = await connection.execute(
            `SELECT hotelid FROM room_category WHERE room_category_id = ?`,
            [id]
        );

        if (!existing || existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        if (!hotelId) {
            hotelId = existing[0].hotelid;
        }

        if (existing[0].hotelid !== hotelId) {
            await connection.rollback();
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Delete child records first (cascade should handle this, but explicit for safety)
        await connection.execute(`DELETE FROM room_category_tariff WHERE room_category_id = ?`, [id]);
        await connection.execute(`DELETE FROM room_category_mode_charge WHERE room_category_id = ?`, [id]);
        
        const [deleteResult] = await connection.execute(
            `DELETE FROM room_category WHERE room_category_id = ?`,
            [id]
        );

        if (deleteResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        await connection.commit();

        res.json({ 
            success: true, 
            message: 'Room category deleted successfully', 
            data: { room_category_id: parseInt(id) } 
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting category:', error);
        res.status(500).json({ success: false, message: 'Failed to delete category', error: error.message });
    } finally {
        connection.release();
    }
};