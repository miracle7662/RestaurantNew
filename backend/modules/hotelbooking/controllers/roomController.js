// controllers/roomController.js
const db = require('../../../config/db');

// Helper to get current user ID (from auth middleware)
const getCurrentUserId = (req) => req.user?.id || null;

// Helper to get current user's hotel ID
const getCurrentUserHotelId = (req) => req.user?.hotel_id || null;

// Helper to format MySQL datetime
const formatDate = (date) => date ? new Date(date).toISOString() : null;

// Helper to check if value exists
const getValueOrNull = (value) => value !== undefined && value !== null && value !== '' ? value : null;

// ----------------------------------------------------------------------
// GET /rooms – list rooms (filter by hotel, optional search)
// ----------------------------------------------------------------------
exports.getRooms = async (req, res) => {
    try {
        let hotelId = req.query.hotelid || req.query.mst_hotelid;
        if (!hotelId) hotelId = getCurrentUserHotelId(req);
        if (!hotelId && req.body?.hotelid) hotelId = req.body.hotelid;
        if (!hotelId) {
            return res.status(400).json({ success: false, message: 'Hotel ID not found' });
        }

        const { q } = req.query;

        let sql = `
            SELECT
                rm.room_id,
                rm.room_no,
                rm.room_name,
                rm.display_name,
                rm.room_category_id,
                rc.category_name,
                rm.room_ext_no,
                rm.room_status,
                rm.department_id,
                dm.department_name,
                rm.block_id,
                bm.block_name,
                rm.floor_id,
                fm.floor_name,
                rm.hotelid,
                rm.created_date,
                rm.updated_date,
                rm.created_by_id,
                rm.updated_by_id
            FROM room_master rm
            LEFT JOIN room_category rc ON rm.room_category_id = rc.room_category_id
            LEFT JOIN departmentmaster dm ON rm.department_id = dm.department_id
            LEFT JOIN blockmaster bm ON rm.block_id = bm.block_id
            LEFT JOIN floormaster fm ON rm.floor_id = fm.floor_id
            WHERE rm.hotelid = ?
        `;

        const params = [hotelId];

        if (q) {
            sql += ` AND (
                rm.room_no LIKE ? OR 
                rm.room_name LIKE ? OR 
                rm.display_name LIKE ? OR
                rc.category_name LIKE ? OR 
                dm.department_name LIKE ? OR
                bm.block_name LIKE ? OR 
                fm.floor_name LIKE ?
            )`;
            const like = `%${q}%`;
            params.push(like, like, like, like, like, like, like);
        }

        sql += ' ORDER BY rm.room_no ASC';

        const [rooms] = await db.execute(sql, params);

        // Format dates
        const formattedRooms = rooms.map(room => ({
            ...room,
            created_date: formatDate(room.created_date),
            updated_date: formatDate(room.updated_date)
        }));

        res.json({
            success: true,
            message: 'Data fetched successfully',
            data: formattedRooms,
        });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
};

// ----------------------------------------------------------------------
// POST /rooms – create a new room
// ----------------------------------------------------------------------
exports.addRoom = async (req, res) => {
    try {
        const {
            room_no,
            room_name,
            display_name,
            room_category_id,
            room_ext_no,
            room_status,
            department_id,
            block_id,
            floor_id,
            hotelid,
            created_by_id,
        } = req.body;

        const userId = getCurrentUserId(req);
        let hotelId = hotelid || getCurrentUserHotelId(req);
        const created_date = new Date();

        if (!hotelId) {
            return res.status(400).json({ success: false, message: 'Hotel ID not found' });
        }

        if (!room_no || !room_name || !room_category_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Room number, name, and category are required' 
            });
        }

        // Check for duplicate room number in same hotel
        const [existing] = await db.execute(
            'SELECT room_id FROM room_master WHERE room_no = ? AND hotelid = ?',
            [room_no, hotelId]
        );
        
        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Room with this number already exists in this hotel',
            });
        }

        const [result] = await db.execute(`
            INSERT INTO room_master (
                room_no, room_name, display_name, room_category_id, room_ext_no,
                room_status, department_id, block_id, floor_id, hotelid,
                created_by_id, created_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            room_no,
            room_name,
            getValueOrNull(display_name),
            room_category_id,
            getValueOrNull(room_ext_no),
            room_status || 'available',
            getValueOrNull(department_id),
            getValueOrNull(block_id),
            getValueOrNull(floor_id),
            hotelId,
            created_by_id || userId,
            created_date
        ]);

        // Fetch the newly created room with joined names
        const [newRoom] = await db.execute(`
            SELECT
                rm.room_id,
                rm.room_no,
                rm.room_name,
                rm.display_name,
                rm.room_category_id,
                rc.category_name,
                rm.room_ext_no,
                rm.room_status,
                rm.department_id,
                dm.department_name,
                rm.block_id,
                bm.block_name,
                rm.floor_id,
                fm.floor_name,
                rm.hotelid,
                rm.created_date,
                rm.updated_date,
                rm.created_by_id,
                rm.updated_by_id
            FROM room_master rm
            LEFT JOIN room_category rc ON rm.room_category_id = rc.room_category_id
            LEFT JOIN departmentmaster dm ON rm.department_id = dm.department_id
            LEFT JOIN blockmaster bm ON rm.block_id = bm.block_id
            LEFT JOIN floormaster fm ON rm.floor_id = fm.floor_id
            WHERE rm.room_id = ?
        `, [result.insertId]);

        const formattedRoom = {
            ...newRoom[0],
            created_date: formatDate(newRoom[0].created_date),
            updated_date: formatDate(newRoom[0].updated_date)
        };

        res.status(201).json({
            success: true,
            message: 'Room added successfully',
            data: formattedRoom,
        });
    } catch (error) {
        console.error('Error adding room:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to add room', 
            error: error.message 
        });
    }
};

// ----------------------------------------------------------------------
// PUT /rooms/:id – update an existing room
// ----------------------------------------------------------------------
exports.updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            room_no,
            room_name,
            display_name,
            room_category_id,
            room_ext_no,
            room_status,
            department_id,
            block_id,
            floor_id,
            hotelid,
            updated_by_id,
        } = req.body;

        const userId = getCurrentUserId(req);
        const updated_date = new Date();

        // Fetch existing room
        const [existingRooms] = await db.execute(`
            SELECT room_no, room_name, hotelid, room_category_id 
            FROM room_master 
            WHERE room_id = ?
        `, [id]);

        if (existingRooms.length === 0) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        const existingRoom = existingRooms[0];
        
        // Use existing values if not provided
        const finalRoomNo = room_no || existingRoom.room_no;
        const finalRoomName = room_name !== undefined ? room_name : existingRoom.room_name;
        const finalHotelId = hotelid || existingRoom.hotelid;
        const hotelId = finalHotelId;

        if (!finalRoomNo) {
            return res.status(400).json({ success: false, message: 'room_no is required' });
        }

        // Check hotel ownership change
        if (existingRoom.hotelid !== finalHotelId) {
            return res.status(403).json({ 
                success: false, 
                message: 'Cannot change hotel ownership' 
            });
        }

        // Check duplicate room number (exclude current)
        const [duplicate] = await db.execute(
            'SELECT room_id FROM room_master WHERE room_no = ? AND hotelid = ? AND room_id != ?',
            [finalRoomNo, hotelId, id]
        );
        
        if (duplicate.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Room with this number already exists in this hotel',
            });
        }

        const [result] = await db.execute(`
            UPDATE room_master
            SET
                room_no = ?,
                room_name = ?,
                display_name = ?,
                room_category_id = ?,
                room_ext_no = ?,
                room_status = ?,
                department_id = ?,
                block_id = ?,
                floor_id = ?,
                hotelid = ?,
                updated_by_id = ?,
                updated_date = ?
            WHERE room_id = ?
        `, [
            finalRoomNo,
            finalRoomName,
            getValueOrNull(display_name),
            room_category_id || existingRoom.room_category_id,
            getValueOrNull(room_ext_no),
            room_status || 'available',
            getValueOrNull(department_id),
            getValueOrNull(block_id),
            getValueOrNull(floor_id),
            hotelId,
            updated_by_id || userId,
            updated_date,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        // Fetch updated room with joins
        const [updatedRoom] = await db.execute(`
            SELECT
                rm.room_id,
                rm.room_no,
                rm.room_name,
                rm.display_name,
                rm.room_category_id,
                rc.category_name,
                rm.room_ext_no,
                rm.room_status,
                rm.department_id,
                dm.department_name,
                rm.block_id,
                bm.block_name,
                rm.floor_id,
                fm.floor_name,
                rm.hotelid,
                rm.created_date,
                rm.updated_date,
                rm.created_by_id,
                rm.updated_by_id
            FROM room_master rm
            LEFT JOIN room_category rc ON rm.room_category_id = rc.room_category_id
            LEFT JOIN departmentmaster dm ON rm.department_id = dm.department_id
            LEFT JOIN blockmaster bm ON rm.block_id = bm.block_id
            LEFT JOIN floormaster fm ON rm.floor_id = fm.floor_id
            WHERE rm.room_id = ?
        `, [id]);

        const formattedRoom = {
            ...updatedRoom[0],
            created_date: formatDate(updatedRoom[0].created_date),
            updated_date: formatDate(updatedRoom[0].updated_date)
        };

        res.json({
            success: true,
            message: 'Room updated successfully',
            data: formattedRoom,
        });
    } catch (error) {
        console.error('Error updating room:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update room', 
            error: error.message 
        });
    }
};

// ----------------------------------------------------------------------
// GET /rooms/:id – get single room by ID
// ----------------------------------------------------------------------
exports.getRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const roomId = parseInt(id);

        if (isNaN(roomId)) {
            return res.status(400).json({ success: false, message: 'Invalid room ID' });
        }

        let hotelId = req.query.hotelid || req.query.mst_hotelid || getCurrentUserHotelId(req);

        let sql = `
            SELECT
                rm.room_id,
                rm.room_no,
                rm.room_name,
                rm.display_name,
                rm.room_category_id,
                rc.category_name,
                rm.room_ext_no,
                rm.room_status,
                rm.department_id,
                dm.department_name,
                rm.block_id,
                bm.block_name,
                rm.floor_id,
                fm.floor_name,
                rm.hotelid,
                rm.created_date,
                rm.updated_date,
                rm.created_by_id,
                rm.updated_by_id
            FROM room_master rm
            LEFT JOIN room_category rc ON rm.room_category_id = rc.room_category_id
            LEFT JOIN departmentmaster dm ON rm.department_id = dm.department_id
            LEFT JOIN blockmaster bm ON rm.block_id = bm.block_id
            LEFT JOIN floormaster fm ON rm.floor_id = fm.floor_id
            WHERE rm.room_id = ?
        `;

        const params = [roomId];

        if (hotelId) {
            sql += ' AND rm.hotelid = ?';
            params.push(hotelId);
        }

        const [rooms] = await db.execute(sql, params);

        if (rooms.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Room not found' 
            });
        }

        const formattedRoom = {
            ...rooms[0],
            created_date: formatDate(rooms[0].created_date),
            updated_date: formatDate(rooms[0].updated_date)
        };

        res.json({
            success: true,
            message: 'Room fetched successfully',
            data: formattedRoom,
        });
    } catch (error) {
        console.error('Error fetching room:', error);
        res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
};

// ----------------------------------------------------------------------
// DELETE /rooms/:id – delete a room
// ----------------------------------------------------------------------
exports.deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const { hotelid } = req.body;
        let hotelId = hotelid || getCurrentUserHotelId(req);

        const [existing] = await db.execute(
            'SELECT hotelid FROM room_master WHERE room_id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        if (!hotelId) hotelId = existing[0].hotelid;
        if (existing[0].hotelid !== hotelId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const [result] = await db.execute(
            'DELETE FROM room_master WHERE room_id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        res.json({
            success: true,
            message: 'Room deleted successfully',
            data: { room_id: parseInt(id) },
        });
    } catch (error) {
        console.error('Error deleting room:', error);
        
        // Check for foreign key constraint error
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({
                success: false,
                message: 'Cannot delete room as it is referenced in other records'
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete room', 
            error: error.message 
        });
    }
};