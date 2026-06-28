// controllers/discountController.js
const db = require('../../../config/db')

// ========================================
// HELPER FUNCTIONS
// ========================================

const getCurrentUserId = (req) => {
  return req.user?.id || 1
}

// ========================================
// 1. APPLY DISCOUNT
// POST /api/discount/apply
// ========================================

exports.applyDiscount = async (req, res) => {
  try {
    const {
      detail_id,
      checkin_id,
      hotelid,
      discount_percent,
      backdated_apply = false
    } = req.body

    const userId = getCurrentUserId(req)

    // Validate required fields
    if (!detail_id || !checkin_id) {
      return res.status(400).json({
        success: false,
        message: 'detail_id and checkin_id are required'
      })
    }

    if (discount_percent === undefined || discount_percent === null) {
      return res.status(400).json({
        success: false,
        message: 'discount_percent is required'
      })
    }

    if (discount_percent < 0 || discount_percent > 100) {
      return res.status(400).json({
        success: false,
        message: 'discount_percent must be between 0 and 100'
      })
    }

    // ✅ Convert backdated_apply to proper flag
    const backdatedFlag = backdated_apply === true || backdated_apply === 1 || backdated_apply === 'true' ? 1 : 0;

    // Call stored procedure
    await db.query(
      `CALL sp_apply_discount(?, ?, ?, ?, ?, ?, @status_code, @status_message, @affected_rows)`,
      [detail_id, checkin_id, hotelid, discount_percent, backdatedFlag, userId]
    )

    // Get output parameters
    const [output] = await db.query(
      `SELECT @status_code AS status_code, @status_message AS status_message, @affected_rows AS affected_rows`
    )

    const result = output[0]

    if (result.status_code !== 200) {
      return res.status(result.status_code || 500).json({
        success: false,
        message: result.status_message
      })
    }

    // ========================================
    // ✅ FETCH ALL ROWS FOR THIS ROOM (ALWAYS)
    // ========================================
    
    // Get the room_id for this detail
    const [roomInfo] = await db.query(
      `SELECT room_id FROM checkin_detail_master WHERE detail_id = ? AND checkin_id = ?`,
      [Number(detail_id), Number(checkin_id)]
    );
    
    const roomId = roomInfo[0]?.room_id;

    // ✅ ALWAYS fetch ALL details for this room
    const query = `
      SELECT 
        d.detail_id,
        d.room_number,
        d.room_tariff,
        d.no_of_days,
        d.discount_percent,
        d.discount_amount,
        d.checkin_datetime,
        d.checkout_datetime,
        f.folio_id,
        f.debit_amount,
        f.credit_amount,
        f.description as folio_description,
        (d.room_tariff * d.no_of_days) as base_amount,
        ((d.room_tariff * d.discount_percent) / 100) as per_day_discount,
        (((d.room_tariff * d.discount_percent) / 100) * d.no_of_days) as total_discount
      FROM checkin_detail_master d
      LEFT JOIN checkin_guest_folio_master f 
        ON f.detail_id = d.detail_id 
        AND f.transaction_type IN ('Room Charge', 'Room Charges')
      WHERE d.checkin_id = ?
        AND d.room_id = ?
      ORDER BY d.checkin_datetime
    `

    const [updatedDetails] = await db.query(query, [Number(checkin_id), roomId])

    return res.status(200).json({
      success: true,
      message: result.status_message,
      data: {
        affected_rows: result.affected_rows,
        discount_percent: discount_percent,
        backdated_apply: backdatedFlag === 1,
        details: updatedDetails,
        count: updatedDetails.length
      }
    })

  } catch (error) {
    console.error('Error in applyDiscount:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to apply discount',
      error: error.message
    })
  }
}




