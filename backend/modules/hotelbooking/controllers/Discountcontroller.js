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

    // ✅ Call stored procedure only
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

    // ✅ Return simple success response
    // Frontend will fetch fresh data using getCheckinFullDetails
    return res.status(200).json({
      success: true,
      message: result.status_message,
      data: {
        affected_rows: result.affected_rows,
        discount_percent: discount_percent,
        backdated_apply: backdatedFlag === 1,
        // ✅ No need to return details here
        // Frontend will call getCheckinFullDetails to get updated data
        note: 'Please refresh data using getCheckinFullDetails API'
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




