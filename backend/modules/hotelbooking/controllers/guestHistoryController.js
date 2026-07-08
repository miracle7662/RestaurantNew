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
          cm.checkout_id,
        cm.checkin_id,
        cm.guest_id,
        gm.name,
        cm.ldg_bill_no,
        cm.reg_no,
        cm.booking,
        cm.plan_name,
        cm.checkin_datetime,
        cm.room_no,
        cm.tot_room_tariff,
        cm.tot_ex_pax_charge,
        cm.tot_child_paid_amount,
        cm.tot_driver_charge,
        cm.tot_discount_amount,
        cm.tot_cgst_amount,
        cm.tot_sgst_amount,
        cm.tot_igst_amount,
        cm.tot_ex_cgst_amount,
        cm.tot_ex_sgst_amount,
        cm.tot_ex_igst_amount,
        cm.tot_child_cgst_amount,
        cm.tot_child_sgst_amount,
        cm.tot_child_igst_amount,
        cm.tot_driver_cgst_amount,
        cm.tot_driver_sgst_amount,
        cm.tot_driver_igst_amount,
        cm.tot_service_charge_amount,
        cm.tot_cess_amount,
        cm.tot_advance,
        cm.hotelid,
        cm.total_amount,
        cm.total_nights,
        cm.id_type,
        cm.id_number,
        cm.department_id,
        cm.department_name,
        cm.special_instruction,
        cm.message,
        cm.created_by_id,
        cm.created_date,
        cm.updated_by_id,
        cm.updated_date,
        cm.status,
        cm.checkout_date,
        cm.checkout_by_id,
        cm.checkout_reason,
        cm.is_partial_checkout,
        cm.checked_out_rooms,
        cm.room_id
      FROM Checkout_Master cm
      LEFT JOIN guest_master gm ON cm.guest_id = gm.guest_id AND cm.hotelid = gm.hotelid
      WHERE cm.guest_id = ? AND cm.hotelid = ?
      ORDER BY cm.checkout_date DESC, cm.checkout_id DESC
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