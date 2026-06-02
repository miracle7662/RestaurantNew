// controllers/roomStatusLogController.js
const db = require('../../../config/db');

const getCurrentUserId = (req) => req.user?.id || null;
const getCurrentUserHotelId = (req) => req.user?.hotel_id || null;

// Helper to format MySQL datetime
const formatDate = (date) => date ? new Date(date).toISOString() : null;

// GET /room-status-logs - List room status logs
// GET /room-status-logs - List room status logs
exports.getRoomStatusLogs = async (req, res) => {
    try {
        let hotelId = req.query.hotelid || getCurrentUserHotelId(req);
        const { room_id, status_type } = req.query;

        // Safe limit
        const rawLimit = req.query.limit;
        const limit = Number.isFinite(Number.parseInt(rawLimit, 10))
            ? Number.parseInt(rawLimit, 10)
            : 100;

        if (!hotelId) {
            return res.status(400).json({
                success: false,
                message: 'Hotel ID not found'
            });
        }

        // Validate hotelId
        const coercedHotelId = Number.parseInt(hotelId, 10);

        if (!Number.isFinite(coercedHotelId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid hotelid'
            });
        }

        let sql = `
            SELECT 
                rsl.log_id,
                rsl.room_id,
                rsl.room_no,
                rsl.previous_status,
                rsl.new_status,
                rsl.status_type,
                rsl.blocked_by,
                rsl.in_house_guest_name,
                rsl.reason,
                rsl.expected_hours,
                rsl.reservation_guest_id,
                rsl.reservation_datetime,
                rsl.hotelid,
                rsl.created_by_id,
                rsl.created_date,
                u.full_name AS created_by_name
            FROM room_status_logs rsl
            LEFT JOIN mst_users u 
                ON rsl.created_by_id = u.userid
            WHERE rsl.hotelid = ?
        `;

        const params = [coercedHotelId];

        // Room filter
        if (room_id) {
            const coercedRoomId = Number.parseInt(room_id, 10);

            if (Number.isFinite(coercedRoomId)) {
                sql += ` AND rsl.room_id = ?`;
                params.push(coercedRoomId);
            }
        }

        // Status type filter
        if (status_type) {
            sql += ` AND rsl.status_type = ?`;
            params.push(status_type);
        }

        // IMPORTANT FIX
        // DO NOT USE LIMIT ?
        sql += ` ORDER BY rsl.created_date DESC LIMIT ${limit}`;

        // Execute
        const [logs] = await db.execute(sql, params);

        // Format response
        const formattedLogs = logs.map(log => ({
            ...log,
            created_date: formatDate(log.created_date),
            reservation_datetime: formatDate(log.reservation_datetime)
        }));

        return res.json({
            success: true,
            message: 'Room status logs fetched successfully',
            data: formattedLogs,
        });

    } catch (error) {
        console.error('Error fetching room status logs:', error);

        return res.status(500).json({
            success: false,
            message: 'Database error',
            error: error.message
        });
    }
};

// POST /room-status-logs - Create room status log
exports.createRoomStatusLog = async (req, res) => {
    try {
        const {
            room_id,
            room_no,
            previous_status,
            new_status,
            status_type,
            blocked_by,
            in_house_guest_name,
            reason,
            expected_hours,
            reservation_guest_id,
            reservation_datetime,
            hotelid,
            created_by_id,
        } = req.body;

        const userId = getCurrentUserId(req);
        const hotelId = hotelid || getCurrentUserHotelId(req);

        if (!hotelId) {
            return res.status(400).json({ success: false, message: 'Hotel ID not found' });
        }

        if (!room_id || !room_no || !new_status || !status_type) {
            return res.status(400).json({
                success: false,
                message: 'room_id, room_no, new_status, and status_type are required'
            });
        }

        const [result] = await db.execute(`
            INSERT INTO room_status_logs (
                room_id, room_no, previous_status, new_status, status_type,
                blocked_by, in_house_guest_name, reason, expected_hours,
                reservation_guest_id, reservation_datetime, hotelid, created_by_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            room_id,
            room_no,
            previous_status || null,
            new_status,
            status_type,
            blocked_by || null,
            in_house_guest_name || null,
            reason || null,
            expected_hours || 1,
            reservation_guest_id || null,
            reservation_datetime || null,
            hotelId,
            created_by_id || userId
        ]);

        const [newLog] = await db.execute(`
            SELECT 
                rsl.log_id,
                rsl.room_id,
                rsl.room_no,
                rsl.previous_status,
                rsl.new_status,
                rsl.status_type,
                rsl.blocked_by,
                rsl.in_house_guest_name,
                rsl.reason,
                rsl.expected_hours,
                rsl.reservation_guest_id,
                rsl.reservation_datetime,
                rsl.hotelid,
                rsl.created_by_id,
                rsl.created_date
            FROM room_status_logs rsl
            WHERE rsl.log_id = ?
        `, [result.insertId]);

        const formattedLog = {
            ...newLog[0],
            created_date: formatDate(newLog[0].created_date),
            reservation_datetime: formatDate(newLog[0].reservation_datetime)
        };

        res.status(201).json({
            success: true,
            message: 'Room status log created successfully',
            data: formattedLog,
        });
    } catch (error) {
        console.error('Error creating room status log:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create room status log',
            error: error.message
        });
    }
};

// GET /room-status-logs/room/:roomId - Get logs for specific room
exports.getRoomStatusLogsByRoom = async (req, res) => {
    try {
        const { roomId } = req.params;
        let hotelId = req.query.hotelid || getCurrentUserHotelId(req);

        if (!hotelId) {
            return res.status(400).json({ success: false, message: 'Hotel ID not found' });
        }

        const [logs] = await db.execute(`
            SELECT 
                rsl.log_id,
                rsl.room_id,
                rsl.room_no,
                rsl.previous_status,
                rsl.new_status,
                rsl.status_type,
                rsl.blocked_by,
                rsl.in_house_guest_name,
                rsl.reason,
                rsl.expected_hours,
                rsl.reservation_guest_id,
                rsl.reservation_datetime,
                rsl.hotelid,
                rsl.created_by_id,
                rsl.created_date,
                u.full_name as created_by_name,
                g.name as guest_name
            FROM room_status_logs rsl
            LEFT JOIN mst_users u ON rsl.created_by_id = u.userid
            LEFT JOIN guest_master g ON rsl.reservation_guest_id = g.guest_id
            WHERE rsl.room_id = ? AND rsl.hotelid = ?
            ORDER BY rsl.created_date DESC
        `, [roomId, hotelId]);

        const formattedLogs = logs.map(log => ({
            ...log,
            created_date: formatDate(log.created_date),
            reservation_datetime: formatDate(log.reservation_datetime)
        }));

        res.json({
            success: true,
            message: 'Room status logs fetched successfully',
            data: formattedLogs,
        });
    } catch (error) {
        console.error('Error fetching room status logs:', error);
        res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
};