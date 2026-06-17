// controllers/roomTransferController.js
const db = require('../../../config/db');

// Helper to get current user ID (from auth middleware)
const getCurrentUserId = (req) => req.user?.id || null;

// Helper to get current user's hotel ID
const getCurrentUserHotelId = (req) => req.user?.hotelid || null;

exports.transferRoomAndUpdateStayRecords = async (req, res) => {
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
      new_room_type_id,
      updated_by_id,
    } = req.body || {};

    const userId = updated_by_id || getCurrentUserId(req) || null;
    const finalHotelId = hotelid || getCurrentUserHotelId(req);

    if (!finalHotelId || !checkin_id || !old_room_no || !old_room_id || !new_room_no || !new_room_id) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'hotelid (or user hotel), checkin_id, old_room_no, old_room_id, new_room_no, new_room_id are required',
      });
    }

    console.log('Transfer Start');
    console.log('Old Room:', { room_no: old_room_no, room_id: old_room_id });
    console.log('New Room:', { room_no: new_room_no, room_id: new_room_id });

    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10); // YYYY-MM-DD

    // 1) Update checkin_master
    const [masterResult] = await connection.execute(
      `UPDATE checkin_master
         SET room_no = ?,
             room_id = ?,
             updated_by_id = ?,
             updated_date = NOW()
       WHERE checkin_id = ? AND hotelid = ?`,
      [new_room_no, new_room_id, userId, checkin_id, finalHotelId],
    );

    // 2) Update active stay details
    // checkout_datetime NULL => treat as current date
    // is_checkout = 0 => active
    const detailSql = `
      UPDATE checkin_detail_master
         SET room_number = ?,
             room_id = ?,
             room_type_id = COALESCE(?, room_type_id),
             updated_by_id = ?,
             updated_date = NOW()
       WHERE checkin_id = ?
         AND room_id = ?
         AND is_checkout = 0
         AND (
            checkout_datetime >= CONCAT(?, ' 00:00:00')
            OR checkout_datetime IS NULL
         )
    `;

    const [detailResult] = await connection.execute(detailSql, [
      new_room_no,
      new_room_id,
      new_room_type_id ?? null,
      userId,
      checkin_id,
      old_room_id,
      todayStr,
    ]);

    // 3) Update active stay charges
    const chargesSql = `
      UPDATE checkin_guest_room_charges
         SET room_id = ?,
             updated_at = NOW()
       WHERE checkin_id = ?
         AND room_id = ?
         AND (
            checkout_datetime >= CONCAT(?, ' 00:00:00')
            OR checkout_datetime IS NULL
         )
    `;

    const [chargesResult] = await connection.execute(chargesSql, [
      new_room_id,
      checkin_id,
      old_room_id,
      todayStr,
    ]);

    const detailsCount = detailResult.affectedRows || 0;
    const chargesCount = chargesResult.affectedRows || 0;

    console.log('Details Updated:', detailsCount);
    console.log('Charges Updated:', chargesCount);

    await connection.commit();

    return res.json({
      success: true,
      message: 'Room transferred successfully',
      data: {
        master_affectedRows: masterResult.affectedRows || 0,
        details_updated: detailsCount,
        charges_updated: chargesCount,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error('transferRoomAndUpdateStayRecords error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to transfer room',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

