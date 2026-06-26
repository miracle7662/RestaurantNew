// controllers/roomTransferController.js
const db = require('../../../config/db');

// Helper to get current user ID (from auth middleware)
const getCurrentUserId = (req) => req.user?.id || null;

// Helper to get current user's hotel ID
const getCurrentUserHotelId = (req) => req.user?.hotelid || null;

/**
 * SINGLE API: Transfer Room Only
 * 
 * This API handles:
 * 1. checkin_master - room_no, room_id
 * 2. checkin_detail_master - room_number, room_id (active/future records)
 * 3. checkin_guest_room_charges - room_id (active/future records)
 * 4. Room status update (old room → available, new room → occupied)
 */
exports.transferRoom = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      hotelid,
      checkin_id,
      old_room_no,
      old_room_id,
      new_room_no,
      new_room_id,
      updated_by_id,
    } = req.body || {};

    // Parse IDs to numbers
    const parsedCheckinId = Number(checkin_id);
    const parsedOldRoomId = Number(old_room_id);
    const parsedNewRoomId = Number(new_room_id);
    const parsedHotelId = hotelid !== undefined ? Number(hotelid) : undefined;

    // Validation
    if (Number.isNaN(parsedCheckinId) || Number.isNaN(parsedOldRoomId) || Number.isNaN(parsedNewRoomId)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid room transfer IDs. checkin_id, old_room_id and new_room_id must be numbers',
        received: { checkin_id, old_room_id, new_room_id },
      });
    }

    const userId = updated_by_id || getCurrentUserId(req) || null;
    const finalHotelId = parsedHotelId || getCurrentUserHotelId(req);

    if (!finalHotelId || !parsedCheckinId || !old_room_no || !parsedOldRoomId || !new_room_no || !parsedNewRoomId) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'hotelid, checkin_id, old_room_no, old_room_id, new_room_no, new_room_id are required',
      });
    }

    // ================================================================
    // 1. UPDATE checkin_master
    // ================================================================
    const [masterResult] = await connection.execute(
      `UPDATE checkin_master
       SET room_no = ?,
           room_id = ?,
           updated_by_id = ?,
           updated_date = NOW()
       WHERE checkin_id = ? AND hotelid = ?`,
      [new_room_no, parsedNewRoomId, userId, parsedCheckinId, finalHotelId]
    );

    if (masterResult.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Checkin not found',
      });
    }

    // ================================================================
    // 2. UPDATE checkin_detail_master (active/future records)
    // ================================================================
    const todayStr = new Date().toISOString().slice(0, 10);

    const [detailResult] = await connection.execute(
      `UPDATE checkin_detail_master
       SET room_number = ?,
           room_id = ?,
           updated_by_id = ?,
           updated_date = NOW()
       WHERE checkin_id = ?
         AND room_id = ?
         AND is_checkout = 0
         AND (checkout_datetime IS NULL OR DATE(checkout_datetime) >= ?)`,
      [new_room_no, parsedNewRoomId, userId, parsedCheckinId, parsedOldRoomId, todayStr]
    );

    // ================================================================
    // 3. UPDATE checkin_guest_room_charges (active/future records)
    // ================================================================
    const [chargesResult] = await connection.execute(
      `UPDATE checkin_guest_room_charges
       SET room_id = ?,
           updated_at = NOW()
       WHERE checkin_id = ?
         AND room_id = ?
         AND (checkout_datetime IS NULL OR DATE(checkout_datetime) >= ?)`,
      [parsedNewRoomId, parsedCheckinId, parsedOldRoomId, todayStr]
    );
// ================================================================
// 4. UPDATE checkin_guest_folio_master
// ================================================================
const [folioResult] = await connection.execute(
  `UPDATE checkin_guest_folio_master
   SET room_id = ?,
       updated_date = NOW()
   WHERE checkin_id = ?
     AND room_id = ?`,
  [
    parsedNewRoomId,
    parsedCheckinId,
    parsedOldRoomId
  ]
);
    // ================================================================
    // 4. UPDATE ROOM STATUS
    // ================================================================
    
    // 4a. Check if old room has any other active stays
    const [otherActiveInOldRoom] = await connection.execute(
      `SELECT cd.detail_id 
       FROM checkin_detail_master cd
       JOIN checkin_master cm ON cd.checkin_id = cm.checkin_id
       WHERE cd.room_id = ?
         AND cd.is_checkout = 0
         AND cd.checkin_id != ?
         AND cm.hotelid = ?`,
      [parsedOldRoomId, parsedCheckinId, finalHotelId]
    );

    // If no other active stays, mark old room as available
    if (otherActiveInOldRoom.length === 0) {
      await connection.execute(
        `UPDATE room_master 
         SET room_status_id = 1, -- 1 = Available
             updated_by_id = ?,
             updated_date = NOW()
         WHERE room_id = ? AND hotelid = ?`,
        [userId, parsedOldRoomId, finalHotelId]
      );
    }

    // 4b. Mark new room as occupied
    await connection.execute(
      `UPDATE room_master 
       SET room_status_id = 2, -- 2 = Occupied
           updated_by_id = ?,
           updated_date = NOW()
       WHERE room_id = ? AND hotelid = ?`,
      [userId, parsedNewRoomId, finalHotelId]
    );

    // ================================================================
    // COMMIT TRANSACTION
    // ================================================================
    await connection.commit();

    return res.status(200).json({
      success: true,
      message: `Room transferred from ${old_room_no} to ${new_room_no} successfully`,
      data: {
        checkin_id: parsedCheckinId,
        old_room: {
          room_id: parsedOldRoomId,
          room_no: old_room_no,
        },
        new_room: {
          room_id: parsedNewRoomId,
          room_no: new_room_no,
        },
        updates: {
          master_updated: masterResult.affectedRows || 0,
          details_updated: detailResult.affectedRows || 0,
          charges_updated: chargesResult.affectedRows || 0,
        },
      },
    });

  } catch (error) {
    await connection.rollback();
    console.error('transferRoom Error:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to transfer room',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};