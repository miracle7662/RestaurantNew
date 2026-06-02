// controllers/guestHistoryController.js
const db = require('../../../config/db');

const getCurrentUserHotelId = (req) => req.user?.hotelid || null;

// GET guest checkout history from Checkout_Master only
exports.getGuestHistory = async (req, res) => {
  try {
    const { guestId } = req.params;
    let hotelId = req.query.hotelid || getCurrentUserHotelId(req);

    if (!guestId) {
      return res.status(400).json({ success: false, message: "Guest ID is required" });
    }

    if (!hotelId) {
      return res.status(400).json({ success: false, message: "Hotel ID is required" });
    }

    const [checkouts] = await db.query(`
      SELECT 
        checkout_id,
        checkin_id,
        guest_id,
        reg_no,
        guest_name,
        room_no,
        checkin_datetime,
        checkout_datetime,
        pax,
        ex_pax,
        child_paid,
        driver,
        total_amount,
        status,
        hotelid,
        checkout_date,
        checkout_reason,
        is_partial_checkout,
        checked_out_rooms
      FROM Checkout_Master 
      WHERE guest_id = ? AND hotelid = ?
      ORDER BY checkout_datetime DESC
    `, [guestId, hotelId]);

    res.json({ 
      success: true, 
      message: "Guest history fetched successfully", 
      data: checkouts 
    });
  } catch (error) {
    console.error("Error fetching guest history:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

// GET full checkout details for a specific checkout
exports.getFullCheckoutDetails = async (req, res) => {
  try {
    const { checkoutId } = req.params;

    // Get checkout details from Checkout_Detail
    const [details] = await db.query(`
      SELECT 
        detail_id,
        checkout_id,
        room_number,
        room_category_name,
        checkin_datetime,
        checkout_datetime,
        no_of_days,
        room_tariff,
        discount_percent,
        discount_amount,
        cgst_percent,
        cgst_amount,
        sgst_percent,
        sgst_amount,
        igst_percent,
        igst_amount,
        cess_percent,
        cess_amount,
        tax,
        ex_pax,
        ex_pax_charge,
        child_paid_amount,
        driver_charge,
        adults,
        pax
      FROM Checkout_Detail 
      WHERE checkout_id = ?
      ORDER BY detail_id ASC
    `, [checkoutId]);

    // Get folio transactions from Checkout_Folio_Master
    const [folios] = await db.query(`
      SELECT 
        folio_id,
        checkout_id,
        transaction_type,
        transaction_datetime,
        description,
        debit_amount,
        credit_amount,
        payment_method
      FROM Checkout_Folio_Master 
      WHERE checkout_id = ?
      ORDER BY transaction_datetime ASC
    `, [checkoutId]);

    // Get payment info from Checkout_Payment_Master
    const [payments] = await db.query(`
      SELECT 
        payment_id,
        checkout_id,
        total_amount,
        payment_method,
        round_off_amount,
        net_payable,
        transaction_datetime
      FROM Checkout_Payment_Master 
      WHERE checkout_id = ?
      LIMIT 1
    `, [checkoutId]);

    // Get room charges from Checkout_Room_Charges
    const [roomCharges] = await db.query(`
      SELECT 
        charge_id,
        checkout_id,
        room_id,
        pax_count,
        pax_price,
        ex_pax_count,
        ex_pax_total,
        child_count,
        child_total,
        driver_count,
        driver_total,
        total_amount
      FROM Checkout_Room_Charges 
      WHERE checkout_id = ?
      ORDER BY charge_id ASC
    `, [checkoutId]);

    res.json({
      success: true,
      message: "Checkout details fetched successfully",
      data: {
        details,
        folios,
        payment: payments[0] || null,
        roomCharges
      }
    });
  } catch (error) {
    console.error("Error fetching checkout details:", error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

module.exports = exports;