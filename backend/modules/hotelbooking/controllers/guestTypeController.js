const db = require('../../../config/db');

const getCurrentUserId = (req) => req.user?.id || null;

// ---------- Get All Guest Types ----------
exports.getGuestTypes = async (req, res) => {
    try {
        let query = `
            SELECT * FROM guest_type_master
            WHERE 1=1
        `;
        const params = [];
        
        const { status } = req.query;
        if (status !== undefined) {
            query += ` AND status = ?`;
            params.push(status);
        }
        
        query += ` ORDER BY guest_type_name ASC`;
        
        const [guestTypes] = await db.execute(query, params);
        res.json({ success: true, data: guestTypes });
    } catch (error) {
        console.error('Error in getGuestTypes:', error);
        res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
};

// ---------- Get Single Guest Type ----------
exports.getGuestType = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [guestType] = await db.execute(
            'SELECT * FROM guest_type_master WHERE guest_type_id = ?',
            [id]
        );

        if (!guestType || guestType.length === 0) {
            return res.status(404).json({ success: false, message: 'Guest type not found' });
        }

        res.json({ success: true, data: guestType[0] });
    } catch (error) {
        console.error('Error in getGuestType:', error);
        res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
};

// ---------- Create Guest Type ----------
exports.addGuestType = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const { guest_type_name, description, status } = req.body;
        const userId = getCurrentUserId(req);
        const created_date = new Date().toISOString().slice(0, 19).replace('T', ' ');

        if (!guest_type_name) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Guest type name is required' });
        }

        // Check for duplicate
        const [existing] = await connection.execute(
            'SELECT guest_type_id FROM guest_type_master WHERE guest_type_name = ?',
            [guest_type_name]
        );
        
        if (existing && existing.length > 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Guest type already exists' });
        }

        const [result] = await connection.execute(`
            INSERT INTO guest_type_master (guest_type_name, description, status, created_by_id, created_date)
            VALUES (?, ?, ?, ?, ?)
        `, [
            guest_type_name,
            description || null,
            status !== undefined ? status : 1,
            userId,
            created_date
        ]);

        await connection.commit();

        const [newGuestType] = await connection.execute(
            'SELECT * FROM guest_type_master WHERE guest_type_id = ?',
            [result.insertId]
        );
        
        res.status(201).json({ success: true, data: newGuestType[0] });
    } catch (error) {
        await connection.rollback();
        console.error('Error adding guest type:', error);
        res.status(500).json({ success: false, message: 'Failed to add guest type', error: error.message });
    } finally {
        connection.release();
    }
};

// ---------- Update Guest Type ----------
exports.updateGuestType = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const { guest_type_name, description, status } = req.body;
        const userId = getCurrentUserId(req);
        const updated_date = new Date().toISOString().slice(0, 19).replace('T', ' ');

        const [existing] = await connection.execute(
            'SELECT * FROM guest_type_master WHERE guest_type_id = ?',
            [id]
        );
        
        if (!existing || existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Guest type not found' });
        }

        // Check for duplicate (excluding current record)
        const [duplicate] = await connection.execute(
            'SELECT guest_type_id FROM guest_type_master WHERE guest_type_name = ? AND guest_type_id != ?',
            [guest_type_name, id]
        );
        
        if (duplicate && duplicate.length > 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Guest type name already exists' });
        }

        const updates = [];
        const values = [];

        if (guest_type_name !== undefined) {
            updates.push('guest_type_name = ?');
            values.push(guest_type_name);
        }
        if (description !== undefined) {
            updates.push('description = ?');
            values.push(description || null);
        }
        if (status !== undefined) {
            updates.push('status = ?');
            values.push(status);
        }

        updates.push('updated_by_id = ?');
        values.push(userId);
        updates.push('updated_date = ?');
        values.push(updated_date);

        if (updates.length === 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        values.push(id);
        const updateSql = `UPDATE guest_type_master SET ${updates.join(', ')} WHERE guest_type_id = ?`;
        await connection.execute(updateSql, values);

        await connection.commit();

        const [updated] = await connection.execute(
            'SELECT * FROM guest_type_master WHERE guest_type_id = ?',
            [id]
        );
        
        res.json({ success: true, data: updated[0] });
    } catch (error) {
        await connection.rollback();
        console.error('Error updating guest type:', error);
        res.status(500).json({ success: false, message: 'Failed to update guest type', error: error.message });
    } finally {
        connection.release();
    }
};

// ---------- Delete Guest Type ----------
exports.deleteGuestType = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();

        const { id } = req.params;

        const [existing] = await connection.execute(
            'SELECT * FROM guest_type_master WHERE guest_type_id = ?',
            [id]
        );
        
        if (!existing || existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Guest type not found' });
        }

        // Check if this guest type is being used by any guest
        const [inUse] = await connection.execute(
            'SELECT guest_id FROM guest_master WHERE guest_type_id = ? LIMIT 1',
            [id]
        );
        
        if (inUse && inUse.length > 0) {
            await connection.rollback();
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete guest type as it is being used by existing guests' 
            });
        }

        await connection.execute('DELETE FROM guest_type_master WHERE guest_type_id = ?', [id]);
        
        await connection.commit();
        res.json({ success: true, message: 'Guest type deleted successfully', data: { guest_type_id: parseInt(id) } });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting guest type:', error);
        res.status(500).json({ success: false, message: 'Failed to delete guest type', error: error.message });
    } finally {
        connection.release();
    }
};