// controllers/checkoutController.js - Complete fixed version with proper decimal summing
const db = require('../../../config/db');

const getCurrentUserId = (req) => req.user?.id || null;
const getCurrentUserHotelId = (req) => req.user?.hotelid || null;

// Helper function to safely parse decimal values
const safeDecimal = (value) => {
  if (value === null || value === undefined) return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

// GET all checkouts
exports.getCheckouts = async (req, res) => {
  try {
    let hotelId = req.query.hotelid || getCurrentUserHotelId(req);
    if (!hotelId) return res.status(400).json({ success: false, message: "Hotel ID not found" });

    const [checkouts] = await db.query(`
      SELECT * FROM Checkout_Master WHERE hotelid = ? ORDER BY checkout_datetime DESC
    `, [hotelId]);

    res.json({ success: true, message: "Data fetched successfully", data: checkouts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

// GET checkout by ID
exports.getCheckoutById = async (req, res) => {
  try {
    const { id } = req.params;
    const [checkouts] = await db.query(`SELECT * FROM Checkout_Master WHERE checkout_id = ?`, [id]);
    
    const checkout = checkouts[0];
    if (!checkout) {
      return res.status(404).json({ success: false, message: "Checkout not found" });
    }

    res.json({ success: true, message: "Data fetched successfully", data: checkout });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

// GET checkout by checkin_id
exports.getCheckoutByCheckinId = async (req, res) => {
  try {
    const { checkin_id } = req.params;
    const [checkouts] = await db.query(`SELECT * FROM Checkout_Master WHERE checkin_id = ?`, [checkin_id]);
    
    res.json({ success: true, message: "Data fetched successfully", data: checkouts[0] || null });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

// PERFORM CHECKOUT - Fixed version with proper decimal summing
exports.performCheckout = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    console.log("Checkout Payload:", req.body);
    await connection.beginTransaction();
    
    const { 
      checkin_id, 
      checkout_reason,
      payment_method,
      total_amount,
      round_off_amount,
      net_payable,
      selected_rooms = [],
      // ── Billing amount fields from frontend ──
      discount          = 0,
      discount_percent  = 0,
      service_charge    = 0,
      taxable_amt       = 0,
      sgst_amt          = 0,
      cgst_amt          = 0,
      round_off         = 0,
      bill_amt          = 0,
      other_charges     = 0,
      bill_plus_other   = 0,
      received_amt      = 0,
      credit_transfer   = 0,
      sett_disc         = 0,
      balance_amt       = 0,
      total_amt         = 0,
    } = req.body;
    
    const userId = getCurrentUserId(req);
    const checkout_date = new Date();
    const nowStr = checkout_date.toISOString().slice(0, 19).replace('T', ' ');
    
    if (!checkin_id) {
      return res.status(400).json({ success: false, message: "Checkin ID is required" });
    }
    
    // Step 1: Get CheckIn_Master data
    const [checkinRows] = await connection.query(
      'SELECT * FROM CheckIn_Master WHERE checkin_id = ?',
      [checkin_id]
    );
    
    if (checkinRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Check-in record not found" });
    }
    
    const checkinData = checkinRows[0];
    
    // Get all active details for this checkin (is_checkout = 0)
    const [detailRows] = await connection.query(
      'SELECT * FROM detail_master WHERE checkin_id = ? AND is_checkout = 0',
      [checkin_id]
    );
    
    if (detailRows.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "No active rooms found for this check-in" });
    }
    
    // Determine which rooms to checkout (normalize to avoid formatting/type mismatches)
    let roomsToCheckout = [];

    const normalizeRoom = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v).trim();
      // If room looks like "Room 101" take digits; otherwise keep full string
      const digitMatch = s.match(/\d+/);
      return digitMatch ? digitMatch[0] : s;
    };

    const selectedRoomSet = Array.isArray(selected_rooms)
      ? new Set(selected_rooms.map(normalizeRoom).filter(Boolean))
      : new Set();

    if (selectedRoomSet.size > 0) {
      roomsToCheckout = detailRows.filter(d => selectedRoomSet.has(normalizeRoom(d.room_number)));
    } else {
      roomsToCheckout = detailRows;
    }

    if (roomsToCheckout.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "No valid rooms selected for checkout",
        selected_rooms_received: selected_rooms,
        detail_room_numbers_sample: detailRows.slice(0, 5).map(d => d.room_number)
      });
    }
    
    const isFullCheckout = roomsToCheckout.length === detailRows.length;
    const checkedOutRoomNumbers = roomsToCheckout.map(r => r.room_number);
    
    // ============================================================
    // CALCULATE SUMS FOR CHECKED OUT ROOMS (using safeDecimal)
    // ============================================================
    let checkedOutTotalAmount = 0;
    let checkedOutAdults = 0;
    let checkedOutPax = 0;
    let checkedOutExPax = 0;
    let checkedOutExPaxCharge = 0;
    let checkedOutChildPaid = 0;
    let checkedOutChildUnpaid = 0;
    let checkedOutChildCharge = 0;
    let checkedOutDriver = 0;
    let checkedOutDriverCharge = 0;
    let checkedOutPaxCharges = 0;
    
    for (const detail of roomsToCheckout) {
      checkedOutTotalAmount += safeDecimal(detail.room_tariff);
      checkedOutAdults += safeDecimal(detail.adults);
      checkedOutPax += safeDecimal(detail.pax);
      checkedOutExPax += safeDecimal(detail.ex_pax);
      checkedOutExPaxCharge += safeDecimal(detail.ex_pax_charge);
      checkedOutChildPaid += safeDecimal(detail.child_paid_amount);
      checkedOutChildUnpaid += safeDecimal(detail.child_unpaid);
      checkedOutChildCharge += safeDecimal(detail.child_paid_amount);
      checkedOutDriver += safeDecimal(detail.driver);
      checkedOutDriverCharge += safeDecimal(detail.driver_charge);
      checkedOutPaxCharges += safeDecimal(detail.room_tariff);
    }
    
    // ============================================================
    // STEP A: CREATE BACKUP OF ORIGINAL DATA
    // ============================================================
    
    if (isFullCheckout) {
      await connection.query(`
        INSERT INTO backup_checkin_master (
          original_checkin_id, guest_id, reg_no, guest_name, address, mobile, 
          company_name, emailed, booking, plan_name, checkin_datetime, 
          checkout_datetime, room_no, category_id, converted_category, adults, 
          pax, pax_charges, ex_pax, ex_pax_charge, child_paid, child_unpaid, 
          child_charge, driver, driver_charge, total_nights, hotelid, total_amount, 
          id_type, id_number, department_id, department_name, special_instruction, 
          message, created_by_id, created_date, updated_by_id, updated_date, status,
          backed_up_by_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        checkinData.checkin_id, checkinData.guest_id, checkinData.reg_no, checkinData.guest_name,
        checkinData.address, checkinData.mobile, checkinData.company_name, checkinData.emailed,
        checkinData.booking, checkinData.plan_name, checkinData.checkin_datetime,
        checkinData.checkout_datetime, checkinData.room_no, checkinData.category_id,
        checkinData.converted_category, checkinData.adults, checkinData.pax, checkinData.pax_charges,
        checkinData.ex_pax, checkinData.ex_pax_charge, checkinData.child_paid, checkinData.child_unpaid,
        checkinData.child_charge, checkinData.driver, checkinData.driver_charge, checkinData.total_nights,
        checkinData.hotelid, checkinData.total_amount, checkinData.id_type, checkinData.id_number,
        checkinData.department_id, checkinData.department_name, checkinData.special_instruction,
        checkinData.message, checkinData.created_by_id, checkinData.created_date,
        checkinData.updated_by_id, checkinData.updated_date, checkinData.status,
        userId
      ]);
    }
    
    // Backup detail_master for rooms being checked out
    for (const detail of roomsToCheckout) {
      await connection.query(`
        INSERT INTO backup_detail_master (
          original_detail_id, checkin_id, hotelid, room_id, room_number, room_category_id,
          room_category_name, converted_category_id, converted_category_name, checkin_datetime,
          checkout_datetime, no_of_days, adults, pax, ex_pax, child_unpaid, driver, room_tariff,
          ex_pax_charge, child_paid_amount, driver_charge, discount_percent, discount_amount,
          cgst_percent, cgst_amount, sgst_percent, sgst_amount, igst_percent, igst_amount,
          cess_percent, cess_amount, service_charge, service_charge_amount, parent_detail_id,
          is_checkout, merged, tax, created_date, updated_date, created_by_id, updated_by_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        detail.detail_id, detail.checkin_id, detail.hotelid, detail.room_id, detail.room_number,
        detail.room_category_id, detail.room_category_name, detail.converted_category_id,
        detail.converted_category_name, detail.checkin_datetime, detail.checkout_datetime,
        detail.no_of_days, detail.adults, detail.pax, detail.ex_pax, detail.child_unpaid,
        detail.driver, detail.room_tariff, detail.ex_pax_charge, detail.child_paid_amount,
        detail.driver_charge, detail.discount_percent, detail.discount_amount, detail.cgst_percent,
        detail.cgst_amount, detail.sgst_percent, detail.sgst_amount, detail.igst_percent,
        detail.igst_amount, detail.cess_percent, detail.cess_amount, detail.service_charge,
        detail.service_charge_amount, detail.parent_detail_id, 1, detail.merged, detail.tax,
        detail.created_date, detail.updated_date, detail.created_by_id, detail.updated_by_id
      ]);
    }
    
    // Get and backup guest_folio_master
    const [folioRows] = await connection.query(
      'SELECT * FROM guest_folio_master WHERE checkin_id = ?',
      [checkin_id]
    );
    
    for (const folio of folioRows) {
      const isRelatedToCheckedOutRoom = !folio.detail_id || 
        roomsToCheckout.some(d => d.detail_id === folio.detail_id);
      
      if (isRelatedToCheckedOutRoom || isFullCheckout) {
        await connection.query(`
          INSERT INTO backup_guest_folio_master (
            original_folio_id, checkin_id, hotel_id, detail_id, transaction_type, transaction_datetime,
            description, debit_amount, credit_amount, reference_number, payment_method,
            created_by_id, created_date, updated_by_id, updated_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          folio.folio_id, folio.checkin_id, folio.hotel_id, folio.detail_id, folio.transaction_type,
          folio.transaction_datetime, folio.description, folio.debit_amount, folio.credit_amount,
          folio.reference_number, folio.payment_method, folio.created_by_id, folio.created_date,
          folio.updated_by_id, folio.updated_date
        ]);
      }
    }
    
    // Get and backup guest_room_charges
    const [chargeRows] = await connection.query(
      'SELECT * FROM guest_room_charges WHERE checkin_id = ?',
      [checkin_id]
    );
    
    for (const charge of chargeRows) {
      const isRelatedToCheckedOutRoom = roomsToCheckout.some(d => d.room_id === charge.room_id);
      
      if (isRelatedToCheckedOutRoom || isFullCheckout) {
        await connection.query(`
          INSERT INTO backup_guest_room_charges (
            original_charge_id, checkin_id, guest_id, room_id, category_id, pax_count, pax_price,
            pax_tax, ex_pax_count, ex_pax_price, ex_pax_tax, ex_pax_tax_percent, ex_pax_total,
            child_count, child_price, child_tax, child_tax_percent, child_total, driver_count,
            driver_price, driver_tax, driver_tax_percent, driver_total, total_amount,
            checkin_datetime, checkout_datetime, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          charge.guest_room_charges_id, charge.checkin_id, charge.guest_id, charge.room_id,
          charge.category_id, charge.pax_count, charge.pax_price, charge.pax_tax,
          charge.ex_pax_count, charge.ex_pax_price, charge.ex_pax_tax, charge.ex_pax_tax_percent,
          charge.ex_pax_total, charge.child_count, charge.child_price, charge.child_tax,
          charge.child_tax_percent, charge.child_total, charge.driver_count, charge.driver_price,
          charge.driver_tax, charge.driver_tax_percent, charge.driver_total, charge.total_amount,
          charge.checkin_datetime, charge.checkout_datetime, charge.created_at, charge.updated_at
        ]);
      }
    }
    
    // ============================================================
    // STEP B: INSERT INTO CHECKOUT TABLES
    // ============================================================
    
    // Insert into Checkout_Master - using calculated sums + billing fields from frontend
    const [checkoutResult] = await connection.query(`
      INSERT INTO Checkout_Master (
        checkin_id, guest_id, guest_name, address, mobile, company_name, emailed, booking,
        plan_name, reg_no, special_instruction, message, checkin_datetime, checkout_datetime,
        room_no, category_id, converted_category, adults, pax, pax_charges, ex_pax,
        ex_pax_charge, child_paid, child_unpaid, child_charge, driver, driver_charge,
        hotelid, id_type, id_number, department_id, department_name, created_by_id,
        created_date, updated_by_id, updated_date, status, total_nights, total_amount,
        checkout_date, checkout_by_id, checkout_reason, is_partial_checkout, checked_out_rooms,
        discount, discount_percent, service_charge, taxable_amt, sgst_amt, cgst_amt,
        round_off, bill_amt, other_charges, bill_plus_other, received_amt,
        credit_transfer, sett_disc, balance_amt, total_amt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      checkinData.checkin_id, 
      checkinData.guest_id, 
      checkinData.guest_name, 
      checkinData.address,
      checkinData.mobile, 
      checkinData.company_name, 
      checkinData.emailed, 
      checkinData.booking,
      checkinData.plan_name, 
      checkinData.reg_no, 
      checkinData.special_instruction, 
      checkinData.message,
      checkinData.checkin_datetime, 
      checkinData.checkout_datetime,   // ✅ Keep original planned checkout_datetime
      (checkedOutRoomNumbers[0] || ''),

      checkinData.category_id, 
      checkinData.converted_category,
      checkedOutAdults, 
      checkedOutPax, 
      checkedOutPaxCharges,
      checkedOutExPax, 
      checkedOutExPaxCharge,
      checkedOutChildPaid, 
      checkedOutChildUnpaid, 
      checkedOutChildCharge,
      checkedOutDriver, 
      checkedOutDriverCharge,
      checkinData.hotelid, 
      checkinData.id_type, 
      checkinData.id_number,
      checkinData.department_id, 
      checkinData.department_name,
      checkinData.created_by_id, 
      checkinData.created_date,
      userId, 
      nowStr, 
      'checked_out',
      roomsToCheckout[0]?.no_of_days || 1,
      total_amount || checkedOutTotalAmount,
      nowStr, 
      userId, 
      checkout_reason || 'Regular checkout',
      !isFullCheckout ? 1 : 0,
      JSON.stringify(checkedOutRoomNumbers),
      // ── Billing fields ──
      safeDecimal(discount),
      safeDecimal(discount_percent),
      safeDecimal(service_charge),
      safeDecimal(taxable_amt),
      safeDecimal(sgst_amt),
      safeDecimal(cgst_amt),
      safeDecimal(round_off),
      safeDecimal(bill_amt),
      safeDecimal(other_charges),
      safeDecimal(bill_plus_other),
      safeDecimal(received_amt),
      safeDecimal(credit_transfer),
      safeDecimal(sett_disc),
      safeDecimal(balance_amt),
      safeDecimal(total_amt),
    ]);
    
    const checkoutId = checkoutResult.insertId;
    
    // Insert into Checkout_Detail for each checked out room
    for (const detail of roomsToCheckout) {
      await connection.query(`
        INSERT INTO Checkout_Detail (
          checkin_id, checkout_id, hotelid, room_id, room_number, room_category_id,
          room_category_name, converted_category_id, converted_category_name, checkin_datetime,
          checkout_datetime, no_of_days, adults, pax, ex_pax, child_unpaid, driver, room_tariff,
          ex_pax_charge, child_paid_amount, driver_charge, discount_percent, discount_amount,
          cgst_percent, cgst_amount, sgst_percent, sgst_amount, igst_percent, igst_amount,
          cess_percent, cess_amount, service_charge, service_charge_amount, parent_detail_id,
          is_checkout, merged, tax, created_date, updated_date, created_by_id, updated_by_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        detail.checkin_id, checkoutId, detail.hotelid, detail.room_id, detail.room_number,
        detail.room_category_id, detail.room_category_name, detail.converted_category_id,
        detail.converted_category_name, detail.checkin_datetime, detail.checkout_datetime,   // ✅ Keep original checkout_datetime
        detail.no_of_days, detail.adults, detail.pax, detail.ex_pax, detail.child_unpaid,
        detail.driver, detail.room_tariff, detail.ex_pax_charge, detail.child_paid_amount,
        detail.driver_charge, detail.discount_percent, detail.discount_amount, detail.cgst_percent,
        detail.cgst_amount, detail.sgst_percent, detail.sgst_amount, detail.igst_percent,
        detail.igst_amount, detail.cess_percent, detail.cess_amount, detail.service_charge,
        detail.service_charge_amount, detail.parent_detail_id, 1, detail.merged, detail.tax,
        detail.created_date, nowStr, detail.created_by_id, userId   // nowStr = audit timestamp for updated_date
      ]);
    }
    
    // Insert related folios to checkout tables
    for (const folio of folioRows) {
      const isRelatedToCheckedOutRoom = !folio.detail_id || 
        roomsToCheckout.some(d => d.detail_id === folio.detail_id);
      
      if (isRelatedToCheckedOutRoom || isFullCheckout) {
        await connection.query(`
          INSERT INTO Checkout_Folio_Master (
            checkin_id, checkout_id, hotel_id, detail_id, transaction_type, transaction_datetime,
            description, debit_amount, credit_amount, reference_number, payment_method,
            created_by_id, created_date, updated_by_id, updated_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          folio.checkin_id, checkoutId, folio.hotel_id, folio.detail_id, folio.transaction_type,
          folio.transaction_datetime, folio.description, folio.debit_amount, folio.credit_amount,
          folio.reference_number, folio.payment_method, folio.created_by_id, folio.created_date,
          userId, nowStr
        ]);
      }
    }
    
    // Insert related charges to checkout tables
    for (const charge of chargeRows) {
      const isRelatedToCheckedOutRoom = roomsToCheckout.some(d => d.room_id === charge.room_id);
      
      if (isRelatedToCheckedOutRoom || isFullCheckout) {
        await connection.query(`
          INSERT INTO Checkout_Room_Charges (
            checkin_id, checkout_id, guest_id, room_id, category_id, pax_count, pax_price,
            pax_tax, ex_pax_count, ex_pax_price, ex_pax_tax, ex_pax_tax_percent, ex_pax_total,
            child_count, child_price, child_tax, child_tax_percent, child_total, driver_count,
            driver_price, driver_tax, driver_tax_percent, driver_total, total_amount,
            checkin_datetime, checkout_datetime, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          charge.checkin_id, checkoutId, charge.guest_id, charge.room_id, charge.category_id,
          charge.pax_count, charge.pax_price, charge.pax_tax, charge.ex_pax_count, charge.ex_pax_price,
          charge.ex_pax_tax, charge.ex_pax_tax_percent, charge.ex_pax_total, charge.child_count,
          charge.child_price, charge.child_tax, charge.child_tax_percent, charge.child_total,
          charge.driver_count, charge.driver_price, charge.driver_tax, charge.driver_tax_percent,
          charge.driver_total, charge.total_amount, charge.checkin_datetime, charge.checkout_datetime,   // ✅ Keep original checkout_datetime
          charge.created_at, nowStr   // nowStr = audit timestamp for updated_at
        ]);
      }
    }
    
    // Insert into Checkout_Payment_Master
    const finalTotalAmount = total_amount || checkedOutTotalAmount;
    const finalPaymentMethod = payment_method || 'Cash';
    const finalNetPayable = net_payable || finalTotalAmount;
    const finalRoundOffAmount = round_off_amount || 0;
    
    await connection.query(`
      INSERT INTO Checkout_Payment_Master (
        checkout_id, checkin_id, total_amount, payment_method,
        round_off_amount, net_payable,
        transaction_datetime, created_by_id, created_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      checkoutId, checkin_id, finalTotalAmount, finalPaymentMethod,
      finalRoundOffAmount, finalNetPayable,
      nowStr, userId, nowStr
    ]);
    
    // ============================================================
    // STEP C: DELETE ORIGINAL DATA (only for checked out rooms)
    // ============================================================
    
    if (isFullCheckout) {
      await connection.query('DELETE FROM guest_room_charges WHERE checkin_id = ?', [checkin_id]);
      await connection.query('DELETE FROM guest_folio_master WHERE checkin_id = ?', [checkin_id]);
      await connection.query('DELETE FROM detail_master WHERE checkin_id = ?', [checkin_id]);
      await connection.query('DELETE FROM CheckIn_Master WHERE checkin_id = ?', [checkin_id]);
    } else {
      const checkedOutRoomIds = roomsToCheckout.map(r => r.room_id);
      if (checkedOutRoomIds.length > 0) {
        const placeholders = checkedOutRoomIds.map(() => '?').join(',');
        
        await connection.query(
          `DELETE FROM guest_room_charges WHERE checkin_id = ? AND room_id IN (${placeholders})`,
          [checkin_id, ...checkedOutRoomIds]
        );
        
        await connection.query(
          `DELETE FROM detail_master WHERE checkin_id = ? AND room_id IN (${placeholders})`,
          [checkin_id, ...checkedOutRoomIds]
        );
        
        const detailIdsToDelete = roomsToCheckout.map(d => d.detail_id).filter(id => id);
        if (detailIdsToDelete.length > 0) {
          const detailPlaceholders = detailIdsToDelete.map(() => '?').join(',');
          await connection.query(
            `DELETE FROM guest_folio_master WHERE checkin_id = ? AND detail_id IN (${detailPlaceholders})`,
            [checkin_id, ...detailIdsToDelete]
          );
        }
      }
      
      // Update CheckIn_Master with reduced totals for remaining rooms
      const remainingRooms = detailRows.filter(d => !checkedOutRoomNumbers.includes(d.room_number));
      
      let newTotalAmount = 0;
      let newAdults = 0;
      let newPax = 0;
      let newExPax = 0;
      let newExPaxCharge = 0;
      let newChildPaid = 0;
      let newChildUnpaid = 0;
      let newChildCharge = 0;
      let newDriver = 0;
      let newDriverCharge = 0;
      let newPaxCharges = 0;
      let newTotalNights = 1;
      
      for (const room of remainingRooms) {
        newTotalAmount += safeDecimal(room.room_tariff);
        newAdults += safeDecimal(room.adults);
        newPax += safeDecimal(room.pax);
        newExPax += safeDecimal(room.ex_pax);
        newExPaxCharge += safeDecimal(room.ex_pax_charge);
        newChildPaid += safeDecimal(room.child_paid_amount);
        newChildUnpaid += safeDecimal(room.child_unpaid);
        newChildCharge += safeDecimal(room.child_paid_amount);
        newDriver += safeDecimal(room.driver);
        newDriverCharge += safeDecimal(room.driver_charge);
        newPaxCharges += safeDecimal(room.room_tariff);
      }
      
      if (remainingRooms.length > 0) {
        newTotalNights = remainingRooms[0]?.no_of_days || 1;
      }
      
      await connection.query(`
        UPDATE CheckIn_Master 
        SET total_nights = ?, 
            total_amount = ?,
            adults = ?,
            pax = ?,
            pax_charges = ?,
            ex_pax = ?,
            ex_pax_charge = ?,
            child_paid = ?,
            child_unpaid = ?,
            child_charge = ?,
            driver = ?,
            driver_charge = ?,
            updated_by_id = ?,
            updated_date = ?
        WHERE checkin_id = ?
      `, [
        newTotalNights, newTotalAmount, newAdults, newPax, newPaxCharges,
        newExPax, newExPaxCharge, newChildPaid, newChildUnpaid, newChildCharge,
        newDriver, newDriverCharge, userId, nowStr, checkin_id
      ]);
    }
    
    // ============================================================
    // STEP D: UPDATE ROOM STATUS
    // ============================================================
    
    for (const detail of roomsToCheckout) {
      await connection.query(
        `UPDATE room_master 
         SET room_status = 'bill', updated_by_id = ?, updated_date = ? 
         WHERE room_id = ?`,
        [userId, nowStr, detail.room_id]
      );
    }
    
    await connection.commit();
    
    const remainingRoomNumbers = detailRows
      .filter(d => !checkedOutRoomNumbers.includes(d.room_number))
      .map(d => d.room_number);
    
    res.status(200).json({
      success: true,
      message: isFullCheckout 
        ? `Checkout completed successfully. All ${roomsToCheckout.length} room(s) checked out.`
        : `${roomsToCheckout.length} room(s) checked out successfully. Remaining rooms: ${remainingRoomNumbers.length > 0 ? remainingRoomNumbers.join(', ') : 'None'}`,
      data: { 
        checkout_id: checkoutId, 
        checkin_id: parseInt(checkin_id),
        is_partial: !isFullCheckout,
        checked_out_rooms: checkedOutRoomNumbers,
        remaining_rooms: remainingRoomNumbers
      }
    });
    
  } catch (error) {
    await connection.rollback();
    console.error("Error performing checkout:", error);
    res.status(500).json({ success: false, message: "Failed to process checkout", error: error.message });
  } finally {
    connection.release();
  }
};

// DELETE checkout record
exports.deleteCheckout = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [existing] = await db.query('SELECT checkout_id FROM Checkout_Master WHERE checkout_id = ?', [id]);
    if (!existing[0]) {
      return res.status(404).json({ success: false, message: "Checkout not found" });
    }
    
    await db.query('DELETE FROM Checkout_Detail WHERE checkout_id = ?', [id]);
    await db.query('DELETE FROM Checkout_Folio_Master WHERE checkout_id = ?', [id]);
    await db.query('DELETE FROM Checkout_Room_Charges WHERE checkout_id = ?', [id]);
    await db.query('DELETE FROM Checkout_Payment_Master WHERE checkout_id = ?', [id]);
    await db.query('DELETE FROM Checkout_Master WHERE checkout_id = ?', [id]);
    
    res.status(200).json({ success: true, message: "Checkout deleted successfully", data: { checkout_id: parseInt(id) } });
  } catch (error) {
    console.error("Error deleting checkout:", error);
    res.status(500).json({ success: false, message: "Failed to delete checkout", error: error.message });
  }
};

// GET backup checkins
exports.getBackupCheckins = async (req, res) => {
  try {
    let hotelId = req.query.hotelid || getCurrentUserHotelId(req);
    if (!hotelId) return res.status(400).json({ success: false, message: "Hotel ID not found" });

    const [backups] = await db.query(`
      SELECT * FROM backup_checkin_master 
      WHERE hotelid = ? 
      ORDER BY backed_up_at DESC
    `, [hotelId]);

    res.json({ success: true, data: backups });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};