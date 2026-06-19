// controllers/roomController.js
const db = require('../../../config/db');

// Helper to get current user ID (from auth middleware)
const getCurrentUserId = (req) => req.user?.id || null;

// Helper to get current user's hotel ID
const getCurrentUserHotelId = (req) => req.user?.hotelid || null;

// Helper to format MySQL datetime
const formatDate = (date) => date ? new Date(date).toISOString() : null;

// Helper to check if value exists
const getValueOrNull = (value) => value !== undefined && value !== null && value !== '' ? value : null;

// ----------------------------------------------------------------------
// GET /rooms – list rooms (filter by hotel, optional search)
// ----------------------------------------------------------------------

exports.getCheckinFullDetails = async (req, res) => {
  try {
    const { hotelid, checkin_id } = req.query;

    if (!hotelid || !checkin_id) {
      return res.status(400).json({
        success: false,
        message: "hotelid and checkin_id are required",
      });
    }

    const sql = `
      SELECT
    -- Checkin Master
    cm.checkin_id,
    cm.booking,
    cm.plan_name,
    cm.reg_no,
    cm.checkin_datetime,
    cm.checkout_datetime,
    cm.hotelid,
    cm.checkout_id,

    -- Room Details
    cdm.detail_id,
    cdm.guest_id ,
    cdm.room_id,
    cdm.room_number,
    cdm.room_category_name,
    cdm.converted_category_name,
    cdm.room_tariff,
    cdm.discount_percent,
    cdm.cgst_percent,
    cdm.sgst_percent,
    cdm.igst_percent,
    cdm.is_settle,
    cdm.checkin_datetime AS detail_checkin_datetime,
    cdm.checkout_datetime AS detail_checkout_datetime,
    cdm.adults,
    cdm.pax,
    cdm.ex_pax,
    cdm.child_unpaid,
    cdm.driver,
    cdm.ex_pax_charge,
    cdm.child_paid_amount,
    cdm.driver_charge,
    cdm.cess_percent,
    cdm.service_charge,
    cdm.parent_detail_id,

    -- Room-wise Guest
    gm.name AS guest_name,
    gm.mobile,
    gm.address,
    gm.email,

    -- Guest Folio
    cgfm.folio_id,
    cgfm.transaction_type,
    cgfm.payment_method,
    cgfm.debit_amount,
    cgfm.credit_amount,
    cgfm.reference_number,

    -- Room Charges
    cgrc.guest_room_charges_id,
    cgrc.category_id,
    cgrc.pax_count,
    cgrc.pax_price,
    cgrc.pax_tax,
    cgrc.ex_pax_count,
    cgrc.ex_pax_price,
    cgrc.ex_pax_tax,
    cgrc.ex_pax_tax_percent,
    cgrc.ex_pax_total,
    cgrc.child_count,
    cgrc.child_price,
    cgrc.child_tax,
    cgrc.child_tax_percent,
    cgrc.child_total,
    cgrc.driver_count,
    cgrc.driver_price,
    cgrc.driver_tax,
    cgrc.driver_tax_percent,
    cgrc.driver_total,
    cgrc.total_amount,
    cgrc.checkin_datetime AS charge_checkin_datetime,
    cgrc.checkout_datetime AS charge_checkout_datetime

FROM checkin_master cm

LEFT JOIN checkin_detail_master cdm
       ON cm.checkin_id = cdm.checkin_id
      AND cdm.is_settle = 0

LEFT JOIN guest_master gm
       ON gm.guest_id = cdm.guest_id

LEFT JOIN checkin_guest_folio_master cgfm
       ON cgfm.checkin_id = cdm.checkin_id
      AND cgfm.room_id = cdm.room_id

LEFT JOIN checkin_guest_room_charges cgrc
       ON cgrc.checkin_id = cdm.checkin_id
      AND cgrc.room_id = cdm.room_id

WHERE cm.hotelid = ?
  AND cm.checkin_id = ?
  AND cdm.is_settle = 0

ORDER BY cdm.room_number,
         cgrc.checkin_datetime;
    `;

    const [rows] = await db.query(sql, [hotelid, checkin_id]);

    return res.status(200).json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("getCheckinFullDetails Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

// exports.getRooms = async (req, res) => {
//     try {
//         const { hotelid } = req.params; // ya req.user.hotelid

//         const query = `
//             SELECT 
//                 rm.room_id,
//                 rm.room_no,
//                 rm.room_name,
//                 rm.display_name,
//                 rm.room_category_id,
//                 rm.floor_id,
//                 rm.room_status_id,
//                 rm.hotelid,
//                 rm.created_date,
//                 rm.updated_date,
//                 rc.category_name,
//                 rc.print_name,
//                 rc.display_name AS category_display_name,
//                 fm.floor_name,
//                 fm.floor_number,
//                 rs.status_name,
//                 rs.status_color,
//                 rm.room_status_id
//             FROM room_master rm
//             LEFT JOIN room_category rc 
//                 ON rm.room_category_id = rc.room_category_id 
//                 AND rc.hotelid = rm.hotelid
//             LEFT JOIN floormaster fm 
//                 ON rm.floor_id = fm.floor_id 
//                 AND fm.hotelid = rm.hotelid
//             LEFT JOIN room_status rs 
//                 ON rm.room_status_id = rs.room_status_id
//             WHERE rm.hotelid = ?
//             ORDER BY fm.floor_number, rm.room_no
//         `;

//         const [rooms] = await db.query(query, [hotelid]);

//         res.status(200).json({
//             success: true,
//             count: rooms.length,
//             data: rooms
//         });

//     } catch (error) {
//         console.error('Get Rooms Error:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Failed to fetch rooms',
//             error: error.message
//         });
//     }
// };





// exports.getRooms = async (req, res) => {
//     try {
//         let hotelId = req.query.hotelid || req.query.mst_hotelid;

//         if (!hotelId) hotelId = getCurrentUserHotelId(req);
//         if (!hotelId && req.body?.hotelid) hotelId = req.body.hotelid;
//         if (!hotelId) {
//             return res.status(400).json({ success: false, message: 'Hotel ID not found' });
//         }

//         const { q } = req.query;

//         let sql = `
//             SELECT
//                 rm.room_id,
//                 rm.room_no,
//                 rm.room_name,
//                 rm.display_name,
//                 rm.room_category_id,
//                 rc.category_name,
//                 rm.room_ext_no,
//                 rm.room_status_id,
//                 rs.status_name AS room_status,
//                 rs.status_color,
//                 rm.department_id,
//                 dm.department_name,
//                 rm.block_id,
//                 bm.block_name,
//                 rm.floor_id,
//                 fm.floor_name,
//                 rm.hotelid,
//                 rm.created_date,
//                 rm.updated_date,
//                 rm.created_by_id,
//                 rm.updated_by_id
//             FROM room_master rm
//             LEFT JOIN room_category rc ON rm.room_category_id = rc.room_category_id
//             LEFT JOIN room_status rs ON rm.room_status_id = rs.room_status_id
//             LEFT JOIN departmentmaster dm ON rm.department_id = dm.department_id
//             LEFT JOIN blockmaster bm ON rm.block_id = bm.block_id
//             LEFT JOIN floormaster fm ON rm.floor_id = fm.floor_id
//             WHERE rm.hotelid = ?
//         `;

//         const params = [hotelId];

//         if (q) {
//             sql += ` AND (
//                 rm.room_no LIKE ? OR 
//                 rm.room_name LIKE ? OR 
//                 rm.display_name LIKE ? OR
//                 rc.category_name LIKE ? OR 
//                 rs.status_name LIKE ? OR
//                 dm.department_name LIKE ? OR
//                 bm.block_name LIKE ? OR 
//                 fm.floor_name LIKE ?
//             )`;
//             const like = `%${q}%`;
//             params.push(like, like, like, like, like, like, like, like);
//         }

//         sql += ' ORDER BY rm.room_no ASC';

//         const [rooms] = await db.execute(sql, params);

//         // Format dates
//         const formattedRooms = rooms.map(room => ({
//             ...room,
//             created_date: formatDate(room.created_date),
//             updated_date: formatDate(room.updated_date)
//         }));

//         res.json({
//             success: true,
//             message: 'Data fetched successfully',
//             data: formattedRooms,
//         });
//     } catch (error) {
//         console.error('Error fetching rooms:', error);
//         res.status(500).json({ success: false, message: 'Database error', error: error.message });
//     }
// };




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
            room_status_id,
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
                room_status_id, department_id, block_id, floor_id, hotelid,
                created_by_id, created_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            room_no,
            room_name,
            getValueOrNull(display_name),
            room_category_id,
            getValueOrNull(room_ext_no),
            room_status_id || 1, // Default to 'Available' status
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
                rm.room_status_id,
                rs.status_name AS room_status,
                rs.status_color,
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
            LEFT JOIN room_status rs ON rm.room_status_id = rs.room_status_id
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
            room_status_id,
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
            SELECT room_no, room_name, hotelid, room_category_id, room_status_id
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
                room_status_id = ?,
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
            room_status_id || existingRoom.room_status_id || 1,
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
                rm.room_status_id,
                rs.status_name AS room_status,
                rs.status_color,
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
            LEFT JOIN room_status rs ON rm.room_status_id = rs.room_status_id
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
                rm.room_status_id,
                rs.status_name AS room_status,
                rs.status_color,
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
            LEFT JOIN room_status rs ON rm.room_status_id = rs.room_status_id
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
exports.getHotelBookingMeta = async (req, res) => {
    try {
        let hotelId = req.query.hotelid || req.query.mst_hotelid;
        if (!hotelId) hotelId = getCurrentUserHotelId(req);
        if (!hotelId && req.body?.hotelid) hotelId = req.body.hotelid;
        if (!hotelId) {
            return res.status(400).json({ success: false, message: 'Hotel ID not found' });
        }

        // ✅ पहले room_status से सारे status और उनके colors fetch करें
        const statusSql = `
            SELECT 
                room_status_id,
                status_name,
                status_color
            FROM room_status 
            WHERE is_active = 1
        `;
        const [statuses] = await db.execute(statusSql, []);

        // ✅ Status का map बनाएं room_status_id के अनुसार
        const statusMap = {};
        statuses.forEach(status => {
            statusMap[status.room_status_id] = {
                status_name: status.status_name,
                status_color: status.status_color || '#ffffff'
            };
        });

        // ✅ Rooms fetch करें जिसमें room_status_id भी आएगा
        const roomsSql = `
            SELECT
                rm.room_id,
                rm.room_no,
                rm.room_name,
                rm.display_name,
                rm.room_category_id,
                rc.category_name,
                rm.room_ext_no,
                rm.room_status_id,  -- ✅ यह important है
                rm.department_id,
                dm.department_name,
                rm.block_id,
                bm.block_name,
                rm.floor_id,
                fm.floor_name,
                fm.floor_number,
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
            ORDER BY rm.floor_id ASC, rm.room_no ASC
        `;

        const floorsSql = `
            SELECT
                floor_id,
                floor_name,
                floor_number,
                hotelid,
                status,
                created_by_id,
                created_date,
                updated_by_id,
                updated_date
            FROM floormaster
            WHERE hotelid = ?
            ORDER BY floor_number ASC, floor_id ASC
        `;

        const categoriesSql = `
            SELECT
                rc.room_category_id,
                rc.category_no,
                rc.category_name,
                rc.department_id,
                dm.department_name,
                rc.print_name,
                rc.display_seq,
                rc.display_name,
                rc.total_rooms,
                rc.apply_date,
                rc.max_limit,
                rc.overbooking_no,
                rc.hotelid,
                rc.status,
                rc.created_by_id,
                rc.created_date,
                rc.updated_by_id,
                rc.updated_date
            FROM room_category rc            
            LEFT JOIN departmentmaster dm ON rc.department_id = dm.department_id
            WHERE rc.hotelid = ?
            ORDER BY rc.display_seq ASC, rc.room_category_id ASC
        `;

        const [rooms] = await db.execute(roomsSql, [hotelId]);
        const [floors] = await db.execute(floorsSql, [hotelId]);
        const [categories] = await db.execute(categoriesSql, [hotelId]);

        // ✅ Rooms को format करें और उनमें status_color add करें
        const formattedRooms = (rooms || []).map((room) => {
            // room_status_id के अनुसार color लें
            const statusInfo = statusMap[room.room_status_id] || {
                status_name: 'Unknown',
                status_color: '#ffffff'
            };
            
            return {
                ...room,
                status_color: statusInfo.status_color,  // ✅ Database से color
                status_name: statusInfo.status_name,    // ✅ Database से name
                created_date: formatDate(room.created_date),
                updated_date: formatDate(room.updated_date),
            };
        });

        const formattedFloors = (floors || []).map((f) => ({
            ...f,
            created_date: formatDate(f.created_date),
            updated_date: formatDate(f.updated_date),
        }));

        const formattedCategories = (categories || []).map((c) => ({
            ...c,
            created_date: formatDate(c.created_date),
            updated_date: formatDate(c.updated_date),
        }));

        res.json({
            success: true,
            message: 'Hotel booking meta fetched successfully',
            data: {
                floors: formattedFloors,
                categories: formattedCategories,
                rooms: formattedRooms,
                statuses: statuses, // ✅ Frontend को statuses भी भेजें
            },
        });
    } catch (error) {
        console.error('getHotelBookingMeta Error:', error);
        res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
};

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