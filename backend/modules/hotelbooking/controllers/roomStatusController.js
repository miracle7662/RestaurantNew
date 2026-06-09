// controllers/roomStatusController.js
const db = require('../../../config/db');

// Helper to format MySQL datetime
const formatDate = (date) => date ? new Date(date).toISOString() : null;

// Helper to check if value exists
const getValueOrNull = (value) => value !== undefined && value !== null && value !== '' ? value : null;

// ----------------------------------------------------------------------
// GET /room-status – list all room statuses
// ----------------------------------------------------------------------
exports.getRoomStatuses = async (req, res) => {
    try {
        const { is_active } = req.query;
        
        let sql = `SELECT 
            room_status_id,
            status_name,
            status_color,
            is_active,
            created_date,
            updated_date
        FROM room_status`;
        
        const params = [];
        
        if (is_active !== undefined) {
            sql += ` WHERE is_active = ?`;
            params.push(is_active);
        }
        
        sql += ` ORDER BY status_name ASC`;
        
        const [statuses] = await db.execute(sql, params);
        
        const formattedStatuses = statuses.map(status => ({
            ...status,
            created_date: formatDate(status.created_date),
            updated_date: formatDate(status.updated_date)
        }));
        
        res.json({
            success: true,
            message: 'Room statuses fetched successfully',
            data: formattedStatuses,
        });
    } catch (error) {
        console.error('Error fetching room statuses:', error);
        res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
};

// ----------------------------------------------------------------------
// GET /room-status/:id – get single room status by ID
// ----------------------------------------------------------------------
exports.getRoomStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const statusId = parseInt(id);
        
        if (isNaN(statusId)) {
            return res.status(400).json({ success: false, message: 'Invalid status ID' });
        }
        
        const [statuses] = await db.execute(
            `SELECT 
                room_status_id,
                status_name,
                status_color,
                is_active,
                created_date,
                updated_date
            FROM room_status 
            WHERE room_status_id = ?`,
            [statusId]
        );
        
        if (statuses.length === 0) {
            return res.status(404).json({ success: false, message: 'Room status not found' });
        }
        
        const formattedStatus = {
            ...statuses[0],
            created_date: formatDate(statuses[0].created_date),
            updated_date: formatDate(statuses[0].updated_date)
        };
        
        res.json({
            success: true,
            message: 'Room status fetched successfully',
            data: formattedStatus,
        });
    } catch (error) {
        console.error('Error fetching room status:', error);
        res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
};

// ----------------------------------------------------------------------
// POST /room-status – create a new room status
// ----------------------------------------------------------------------
exports.addRoomStatus = async (req, res) => {
    try {
        const {
            status_name,
            status_color,
            is_active,
        } = req.body;
        
        const created_date = new Date();
        
        if (!status_name) {
            return res.status(400).json({ 
                success: false, 
                message: 'Status name is required' 
            });
        }
        
        // Check for duplicate status name
        const [existing] = await db.execute(
            'SELECT room_status_id FROM room_status WHERE status_name = ?',
            [status_name]
        );
        
        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Room status with this name already exists',
            });
        }
        
        const [result] = await db.execute(`
            INSERT INTO room_status (
                status_name,
                status_color,
                is_active,
                created_date
            ) VALUES (?, ?, ?, ?)
        `, [
            status_name,
            status_color || 'secondary',
            is_active !== undefined ? is_active : 1,
            created_date
        ]);
        
        // Fetch the newly created status
        const [newStatus] = await db.execute(
            `SELECT 
                room_status_id,
                status_name,
                status_color,
                is_active,
                created_date,
                updated_date
            FROM room_status 
            WHERE room_status_id = ?`,
            [result.insertId]
        );
        
        const formattedStatus = {
            ...newStatus[0],
            created_date: formatDate(newStatus[0].created_date),
            updated_date: formatDate(newStatus[0].updated_date)
        };
        
        res.status(201).json({
            success: true,
            message: 'Room status added successfully',
            data: formattedStatus,
        });
    } catch (error) {
        console.error('Error adding room status:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to add room status', 
            error: error.message 
        });
    }
};

// ----------------------------------------------------------------------
// PUT /room-status/:id – update an existing room status
// ----------------------------------------------------------------------
exports.updateRoomStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            status_name,
            status_color,
            is_active,
        } = req.body;
        
        const updated_date = new Date();
        const statusId = parseInt(id);
        
        if (isNaN(statusId)) {
            return res.status(400).json({ success: false, message: 'Invalid status ID' });
        }
        
        // Fetch existing status
        const [existingStatuses] = await db.execute(
            'SELECT status_name FROM room_status WHERE room_status_id = ?',
            [statusId]
        );
        
        if (existingStatuses.length === 0) {
            return res.status(404).json({ success: false, message: 'Room status not found' });
        }
        
        // Check for duplicate status name (exclude current)
        if (status_name && status_name !== existingStatuses[0].status_name) {
            const [duplicate] = await db.execute(
                'SELECT room_status_id FROM room_status WHERE status_name = ? AND room_status_id != ?',
                [status_name, statusId]
            );
            
            if (duplicate.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'Room status with this name already exists',
                });
            }
        }
        
        const [result] = await db.execute(`
            UPDATE room_status
            SET
                status_name = COALESCE(?, status_name),
                status_color = COALESCE(?, status_color),
                is_active = COALESCE(?, is_active),
                updated_date = ?
            WHERE room_status_id = ?
        `, [
            status_name || null,
            status_color || null,
            is_active !== undefined ? is_active : null,
            updated_date,
            statusId
        ]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Room status not found' });
        }
        
        // Fetch updated status
        const [updatedStatus] = await db.execute(
            `SELECT 
                room_status_id,
                status_name,
                status_color,
                is_active,
                created_date,
                updated_date
            FROM room_status 
            WHERE room_status_id = ?`,
            [statusId]
        );
        
        const formattedStatus = {
            ...updatedStatus[0],
            created_date: formatDate(updatedStatus[0].created_date),
            updated_date: formatDate(updatedStatus[0].updated_date)
        };
        
        res.json({
            success: true,
            message: 'Room status updated successfully',
            data: formattedStatus,
        });
    } catch (error) {
        console.error('Error updating room status:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update room status', 
            error: error.message 
        });
    }
};

// ----------------------------------------------------------------------
// DELETE /room-status/:id – delete a room status
// ----------------------------------------------------------------------
exports.deleteRoomStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const statusId = parseInt(id);
        
        if (isNaN(statusId)) {
            return res.status(400).json({ success: false, message: 'Invalid status ID' });
        }
        
        // Check if status is being used by any room
        const [roomsUsing] = await db.execute(
            'SELECT room_id FROM room_master WHERE room_status_id = ? LIMIT 1',
            [statusId]
        );
        
        if (roomsUsing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Cannot delete room status as it is being used by one or more rooms'
            });
        }
        
        const [result] = await db.execute(
            'DELETE FROM room_status WHERE room_status_id = ?',
            [statusId]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Room status not found' });
        }
        
        res.json({
            success: true,
            message: 'Room status deleted successfully',
            data: { room_status_id: statusId },
        });
    } catch (error) {
        console.error('Error deleting room status:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete room status', 
            error: error.message 
        });
    }
};