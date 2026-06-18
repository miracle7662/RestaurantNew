// checkoutController.js - Updated with data preservation (NO DELETION)

const db = require('../../../config/db');

const getCurrentUserId = (req) => req.user?.id || null;
const getCurrentUserHotelId = (req) => req.user?.hotelid || null;

// Helper function to safely parse decimal values
const safeDecimal = (value) => {
  if (value === null || value === undefined) return 0;
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

// Helper to get default room status ID for 'cleaning'
const getCleaningStatusId = async (connection) => {
  const [statuses] = await connection.query(
    "SELECT room_status_id FROM room_status WHERE  room_status_id=4 LIMIT 1"
  );
  if (statuses.length > 0) return statuses[0].room_status_id;
  
  const [altStatuses] = await connection.query(
    "SELECT room_status_id FROM room_status WHERE room_status_id  IN(4, 5, 6) LIMIT 1"
  );
  return altStatuses.length > 0 ? altStatuses[0].room_status_id : 2;
};

// Helper to get default room status ID for 'available'
const getAvailableStatusId = async (connection) => {
  const [statuses] = await connection.query(
    "SELECT room_status_id FROM room_status WHERE room_status_id = 1 LIMIT 1"
  );
  if (statuses.length > 0) return statuses[0].room_status_id;
  
  const [altStatuses] = await connection.query(
    "SELECT room_status_id FROM room_status WHERE room_status_id = 1 LIMIT 1"
  );
  return altStatuses.length > 0 ? altStatuses[0].room_status_id : 1;
};

const updateRoomsToAvailable = async (connection, roomIds, userId) => {
  const placeholders = roomIds.map(() => '?').join(',');
  const query = `
    UPDATE room_master 
    SET room_status_id = ?, updated_by_id = ?, updated_date = NOW()
    WHERE room_id IN (${placeholders})
  `;
  const params = [1, userId, ...roomIds];
  const [result] = await connection.query(query, params);
  return result;
};

// Helper to get occupied status ID
const getOccupiedStatusId = async (connection) => {
  const [statuses] = await connection.query(
    "SELECT room_status_id FROM room_status WHERE LOWER(status_name) = 'occupied' LIMIT 1"
  );
  if (statuses.length > 0) return statuses[0].room_status_id;
  
  const [altStatuses] = await connection.query(
    "SELECT room_status_id FROM room_status WHERE LOWER(status_name) IN ('occupied', 'booked', 'in_house') LIMIT 1"
  );
  return altStatuses.length > 0 ? altStatuses[0].room_status_id : 2;
};

// Helper to get room status ID for 'settlement'
const getSettlementStatusId = async (connection) => {
  const [statuses] = await connection.query(
    "SELECT room_status_id FROM room_status WHERE room_status_id = 7 LIMIT 1"
  );
  if (statuses.length > 0) return statuses[0].room_status_id;
  
  const [altStatuses] = await connection.query(
    "SELECT room_status_id FROM room_status WHERE LOWER(status_name) IN ('settlement', 'checkout', 'bill') LIMIT 1"
  );
  return altStatuses.length > 0 ? altStatuses[0].room_status_id : null;
};

// Helper: Generate next sequential invoice number
const generateNextInvoiceNo = async (connection) => {
  const [rows] = await connection.query(`
    SELECT MAX(CAST(ldg_bill_no AS UNSIGNED)) AS max_no
    FROM Checkout_Master
    WHERE ldg_bill_no IS NOT NULL
      AND ldg_bill_no REGEXP '^[0-9]+$'
  `);
  const maxNo = rows[0]?.max_no || 0;
  const nextNo = maxNo + 1;
  return String(nextNo).padStart(4, '0');
};

const safeValue = (value) => {
  if (value === null || value === undefined) return null;
  return value;
};

const safeNumber = (value) => {
  if (value === null || value === undefined) return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
};

const formatDateTime = (dateValue) => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) {
    return dateValue.toISOString().slice(0, 19).replace('T', ' ');
  }
  if (typeof dateValue === 'string' && dateValue.includes('T')) {
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(0, 19).replace('T', ' ');
    }
  }
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  return dateValue;
};

// GET all checkouts
exports.getCheckouts = async (req, res) => {
  try {
    let hotelId = req.query.hotelid || getCurrentUserHotelId(req);
    if (!hotelId) return res.status(400).json({ success: false, message: "Hotel ID not found" });

    const [checkouts] = await db.query(`
  SELECT
    cm.*,
    rm.room_status_id
FROM Checkout_Master cm
LEFT JOIN room_master rm
    ON rm.room_id = cm.room_id
WHERE
    cm.hotelid = ?   
    AND cm.is_settle = 0
    AND cm.checkout_datetime = (
        SELECT MAX(c2.checkout_datetime)
        FROM Checkout_Master c2
        WHERE c2.ldg_bill_no = cm.ldg_bill_no
    )
ORDER BY
    cm.ldg_bill_no;
    `, [hotelId]);

    res.json({ success: true, message: "Data fetched successfully", data: checkouts });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

exports.getBillPreview = async (req, res) => {
    try {
        const { checkout_id, ldg_bill_no } = req.query;

        if (!checkout_id && !ldg_bill_no) {
            return res.status(400).json({
                success: false,
                message: "checkout_id or ldg_bill_no is required"
            });
        }

        const query = `
        SELECT

        /* ================= HOTEL ================= */

        hm.hotelid,
        hm.hotel_name,
        hm.short_name,
        hm.phone AS hotel_phone,
        hm.email AS hotel_email,
        hm.website,
        hm.address AS hotel_address,
        hm.trn_gstno,
        hm.panno,
        hm.fssai_no,
        hm.Logo,

        /* ================= CHECKOUT ================= */

        cm.checkout_id,
        cm.checkin_id,
        cm.guest_id,
        cm.reg_no,
        cm.ldg_bill_no,
        cm.guest_name,
        cm.address AS guest_address,
        cm.mobile,
        cm.company_name,
        cm.emailed,
        cm.booking,
        cm.plan_name,
        cm.checkin_datetime,
        cm.checkout_datetime,
        cm.room_no,
        cm.room_id,
        cm.category_id,
        cm.converted_category,
        cm.adults,
        cm.pax,
        cm.pax_charges,
        cm.ex_pax,
        cm.ex_pax_charge,
        cm.child_paid,
        cm.child_unpaid,
        cm.child_charge,
        cm.driver,
        cm.driver_charge,
        cm.payment_id,
        cm.payment_mode,
        cm.discount_amount,
        cm.post_changes_amt,
        cm.allowances_amt,
        cm.advance_amt,
        cm.cgst_amt,
        cm.sgst_amt,
        cm.igst_amt,
        cm.cess_amt,
        cm.service_charge_amt,
        cm.round_off_amount,
        cm.total_amount,
        cm.net_payable,
        cm.total_nights,
        cm.checked_out_rooms,
        cm.status,

        /* ================= CHECKOUT DETAIL ================= */

        cd.detail_id,
        cd.room_id AS detail_room_id,
        cd.room_number,
        cd.room_category_id,
        cd.room_category_name,
        cd.converted_category_id,
        cd.converted_category_name,
        cd.room_tariff,
        cd.no_of_days,
        cd.adults AS room_adults,
        cd.pax AS room_pax,
        cd.ex_pax,
        cd.ex_pax_charge,
        cd.child_unpaid,
        cd.child_paid_amount,
        cd.driver,
        cd.driver_charge,
        cd.discount_percent,
        cd.discount_amount AS room_discount,
        cd.cgst_percent,
        cd.cgst_amount,
        cd.sgst_percent,
        cd.sgst_amount,
        cd.igst_percent,
        cd.igst_amount,
        cd.cess_percent,
        cd.cess_amount,
        cd.service_charge,
        cd.service_charge_amount,
        cd.tax,

        /* ================= ROOM CHARGES ================= */

        rc.charge_id,
        rc.category_id,
        rc.pax_count,
        rc.pax_price,
        rc.pax_tax,
        rc.ex_pax_count,
        rc.ex_pax_price,
        rc.ex_pax_tax,
        rc.ex_pax_tax_percent,
        rc.ex_pax_total,
        rc.child_count,
        rc.child_price,
        rc.child_tax,
        rc.child_tax_percent,
        rc.child_total,
        rc.driver_count,
        rc.driver_price,
        rc.driver_tax,
        rc.driver_tax_percent,
        rc.driver_total,
        rc.total_amount AS room_total,

        /* ================= FOLIO ================= */

        fm.folio_id,
        fm.transaction_type,
        fm.transaction_datetime,
        fm.description,
        fm.debit_amount,
        fm.credit_amount,
        fm.reference_number,
        fm.payment_method

        FROM checkout_master cm

        LEFT JOIN msthotelmasters hm
            ON hm.hotelid = cm.hotelid

        LEFT JOIN checkout_detail cd
            ON cd.checkout_id = cm.checkout_id

        LEFT JOIN checkout_room_charges rc
            ON rc.checkout_id = cm.checkout_id
            AND rc.room_id = cd.room_id

        LEFT JOIN checkout_folio_master fm
            ON fm.checkout_id = cm.checkout_id
            AND fm.detail_id = cd.detail_id

        WHERE
            (
                ? IS NOT NULL
                AND cm.checkout_id = ?
            )
            OR
            (
                ? IS NOT NULL
                AND cm.ldg_bill_no = ?
            )

        ORDER BY
            cd.room_number,
            fm.transaction_datetime,
            rc.charge_id;
        `;

        const [rows] = await db.execute(query, [

            checkout_id || null,
            checkout_id || null,
            ldg_bill_no || null,
            ldg_bill_no || null
        ]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No bill preview found."
            });
        }

        return res.status(200).json({
            success: true,
            message: "Bill Preview fetched successfully.",
            data: rows
        });

    } catch (error) {
        console.error("Bill Preview Error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
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

// GET next invoice number
exports.getNextInvoiceNo = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT MAX(CAST(ldg_bill_no AS UNSIGNED)) AS max_no
      FROM Checkout_Master
      WHERE ldg_bill_no IS NOT NULL
        AND ldg_bill_no REGEXP '^[0-9]+$'
    `);
    const maxNo = rows[0]?.max_no || 0;
    const nextNo = maxNo + 1;
    const invoiceNo = String(nextNo).padStart(4, '0');
    
    console.log('Generated invoice number:', invoiceNo);
    
    res.json({ success: true, data: { ldg_bill_no: invoiceNo } });
  } catch (error) {
    console.error('Error generating invoice number:', error);
    res.status(500).json({ success: false, message: 'Failed to generate invoice number' });
  }
};

// PERFORM CHECKOUT - UPDATED: NO DELETION, only status update and data preservation
exports.performCheckout = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { 
      checkin_id, 
      checkout_reason,
      payment_method,
      total_amount,
      round_off_amount,
      net_payable,
      selected_rooms = [],
      invoiceNoFromBody,
      payment_id,
      payment_mode,
      is_settle,
      is_print,
    } = req.body;

    const userId = getCurrentUserId(req);
    const checkout_date = new Date();
    const nowStr = formatDateTime(checkout_date);

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
    
    // Get ALL details for this checkin
    const [allDetailRows] = await connection.query(
      `SELECT * FROM checkin_detail_master WHERE checkin_id = ?`,
      [checkin_id]
    );
    
    // Get active details (not checked out yet)
    const [activeDetailRows] = await connection.query(
      'SELECT * FROM checkin_detail_master WHERE checkin_id = ? AND is_checkout = 0',
      [checkin_id]
    );
    
    if (activeDetailRows.length === 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "No active rooms found for this check-in" });
    }
    
    // Determine which rooms to checkout
    let roomsToCheckout = [];

    const normalizeRoom = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v).trim();
      const digitMatch = s.match(/\d+/);
      return digitMatch ? digitMatch[0] : s;
    };

    const selectedRoomSet = Array.isArray(selected_rooms)
      ? new Set(selected_rooms.map(normalizeRoom).filter(Boolean))
      : new Set();

    if (selectedRoomSet.size > 0) {
      roomsToCheckout = activeDetailRows.filter(d => selectedRoomSet.has(normalizeRoom(d.room_number)));
    } else {
      roomsToCheckout = activeDetailRows;
    }

    if (roomsToCheckout.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "No valid rooms selected for checkout",
        selected_rooms_received: selected_rooms,
        detail_room_numbers_sample: activeDetailRows.slice(0, 5).map(d => d.room_number)
      });
    }
    
    const isFullCheckout = roomsToCheckout.length === activeDetailRows.length;
    const checkedOutRoomNumbers = roomsToCheckout.map(r => r.room_number);
    const checkedOutRoomIds = roomsToCheckout.map(d => d.room_id);
    const checkedOutDetailIds = roomsToCheckout.map(d => d.detail_id);
    
    // ============================================================
    // STEP 1: AGGREGATE FROM checkin_detail_master (ALL DAYS)
    // ============================================================
    let totalDetailAggregation = {
      total_amount: 0,
      adults: 0,
      pax: 0,
      ex_pax: 0,
      ex_pax_charge: 0,
      child_paid: 0,
      child_unpaid: 0,
      child_charge: 0,
      driver: 0,
      driver_charge: 0,
      pax_charges: 0,
      discount_amount: 0,
      cgst_amount: 0,
      sgst_amount: 0,
      igst_amount: 0,
      cess_amount: 0,
      service_charge_amount: 0,
      total_nights: 0
    };

    for (const detail of allDetailRows) {
      totalDetailAggregation.total_amount += safeDecimal(detail.room_tariff);
      totalDetailAggregation.adults += safeDecimal(detail.adults);
      totalDetailAggregation.pax += safeDecimal(detail.pax);
      totalDetailAggregation.ex_pax += safeDecimal(detail.ex_pax);
      totalDetailAggregation.ex_pax_charge += safeDecimal(detail.ex_pax_charge);
      totalDetailAggregation.child_unpaid += safeDecimal(detail.child_unpaid);
      totalDetailAggregation.child_charge += safeDecimal(detail.child_paid_amount);
      totalDetailAggregation.driver += safeDecimal(detail.driver);
      totalDetailAggregation.driver_charge += safeDecimal(detail.driver_charge);
      totalDetailAggregation.pax_charges += safeDecimal(detail.room_tariff);
      totalDetailAggregation.discount_amount += safeDecimal(detail.discount_amount);
      totalDetailAggregation.cgst_amount += safeDecimal(detail.cgst_amount);
      totalDetailAggregation.sgst_amount += safeDecimal(detail.sgst_amount);
      totalDetailAggregation.igst_amount += safeDecimal(detail.igst_amount);
      totalDetailAggregation.cess_amount += safeDecimal(detail.cess_amount);
      totalDetailAggregation.service_charge_amount += safeDecimal(detail.service_charge_amount);
      
      if (detail.no_of_days) {
        totalDetailAggregation.total_nights = Math.max(totalDetailAggregation.total_nights, detail.no_of_days);
      }
    }

    // Get child paid counts
    if (allDetailRows.length > 0) {
      const allRoomIds = [...new Set(allDetailRows.map(d => d.room_id).filter(Boolean))];
      if (allRoomIds.length > 0) {
        const placeholders = allRoomIds.map(() => '?').join(',');
        const [childCountRows] = await connection.query(
          `SELECT room_id, SUM(COALESCE(child_count,0)) AS child_head_count 
           FROM checkin_guest_room_charges 
           WHERE checkin_id = ? AND room_id IN (${placeholders}) 
           GROUP BY room_id`,
          [checkin_id, ...allRoomIds]
        );
        
        let totalChildPaid = 0;
        for (const cr of childCountRows) {
          totalChildPaid += safeDecimal(cr.child_head_count);
        }
        totalDetailAggregation.child_paid = totalChildPaid;
      }
    }

    // ============================================================
    // STEP 2: AGGREGATE FROM checkin_guest_folio_master
    // ============================================================
    let folioAggregation = {
      advance_amt: 0,
      post_changes_amt: 0,
      allowances_amt: 0
    };

    let folioQuery = `
      SELECT transaction_type, debit_amount, credit_amount, detail_id,
             folio_id, checkin_id, hotel_id, description, reference_number, 
             payment_method, created_by_id, created_date, updated_by_id, updated_date
      FROM checkin_guest_folio_master 
      WHERE checkin_id = ?
    `;
    
    const folioParams = [checkin_id];
    
    if (!isFullCheckout && checkedOutDetailIds.length > 0) {
      const detailPlaceholders = checkedOutDetailIds.map(() => '?').join(',');
      folioQuery += ` AND (detail_id IS NULL OR detail_id IN (${detailPlaceholders}))`;
      folioParams.push(...checkedOutDetailIds);
    }
    
    const [folioRows] = await connection.query(folioQuery, folioParams);
    
    for (const folio of folioRows) {
      const transactionType = (folio.transaction_type || '').trim();
      
      if (transactionType === 'Booking Receipt' || transactionType === 'Advance Addition') {
        folioAggregation.advance_amt += safeDecimal(folio.credit_amount);
      } else if (transactionType === 'CHARGE') {
        folioAggregation.post_changes_amt += safeDecimal(folio.debit_amount);
      } else if (transactionType === 'ALLOWANCE') {
        folioAggregation.allowances_amt += safeDecimal(folio.credit_amount);
      }
    }

    // ============================================================
    // STEP A: CREATE BACKUP OF ORIGINAL DATA (for audit trail)
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
        checkinData.booking, checkinData.plan_name, formatDateTime(checkinData.checkin_datetime),
        formatDateTime(checkinData.checkout_datetime), checkinData.room_no, checkinData.category_id,
        checkinData.converted_category, totalDetailAggregation.adults, totalDetailAggregation.pax, totalDetailAggregation.pax_charges,
        totalDetailAggregation.ex_pax, totalDetailAggregation.ex_pax_charge, totalDetailAggregation.child_paid, totalDetailAggregation.child_unpaid,
        totalDetailAggregation.child_charge, totalDetailAggregation.driver, totalDetailAggregation.driver_charge, totalDetailAggregation.total_nights,
        checkinData.hotelid, totalDetailAggregation.total_amount, checkinData.id_type, checkinData.id_number,
        checkinData.department_id, checkinData.department_name, checkinData.special_instruction,
        checkinData.message, checkinData.created_by_id, checkinData.created_date,
        checkinData.updated_by_id, checkinData.updated_date, checkinData.status,
        userId
      ]);
    }
    
    // Backup checkin_detail_master
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
        detail.converted_category_name, formatDateTime(detail.checkin_datetime), formatDateTime(detail.checkout_datetime),
        detail.no_of_days, detail.adults, detail.pax, detail.ex_pax, detail.child_unpaid,
        detail.driver, detail.room_tariff, detail.ex_pax_charge, detail.child_paid_amount,
        detail.driver_charge, detail.discount_percent, detail.discount_amount, detail.cgst_percent,
        detail.cgst_amount, detail.sgst_percent, detail.sgst_amount, detail.igst_percent,
        detail.igst_amount, detail.cess_percent, detail.cess_amount, detail.service_charge,
        detail.service_charge_amount, detail.parent_detail_id, 1, detail.merged, detail.tax,
        detail.created_date, nowStr, detail.created_by_id, userId
      ]);
    }
    
    // Backup folio entries
    for (const folio of folioRows) {
      await connection.query(`
        INSERT INTO backup_guest_folio_master (
          original_folio_id, checkin_id, hotel_id, detail_id, transaction_type, transaction_datetime,
          description, debit_amount, credit_amount, reference_number, payment_method,
          created_by_id, created_date, updated_by_id, updated_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        safeValue(folio.folio_id),
        safeValue(folio.checkin_id || checkin_id),
        safeValue(folio.hotel_id || checkinData.hotelid),
        safeValue(folio.detail_id),
        safeValue(folio.transaction_type),
        safeValue(folio.transaction_datetime),
        safeValue(folio.description),
        safeNumber(folio.debit_amount) || 0,
        safeNumber(folio.credit_amount) || 0,
        safeValue(folio.reference_number),
        safeValue(folio.payment_method),
        safeValue(folio.created_by_id || userId),
        safeValue(folio.created_date || nowStr),
        safeValue(folio.updated_by_id || userId),
        safeValue(folio.updated_date || nowStr)
      ]);
    }
    
    // Backup checkin_guest_room_charges
    if (checkedOutRoomIds.length > 0) {
      const placeholders = checkedOutRoomIds.map(() => '?').join(',');
      const [chargeRows] = await connection.query(
        `SELECT * FROM checkin_guest_room_charges WHERE checkin_id = ? AND room_id IN (${placeholders})`,
        [checkin_id, ...checkedOutRoomIds]
      );
      
      for (const charge of chargeRows) {
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
    // STEP B: CALCULATE FINAL VALUES
    // ============================================================
    const finalTotalAmount = total_amount || totalDetailAggregation.total_amount;
    const finalNetPayable = net_payable || finalTotalAmount;
    const finalRoundOffAmount = round_off_amount || 0;

    const resolvedPaymentMode = payment_mode || payment_method || 'Cash';
    const finalPaymentMethod = resolvedPaymentMode;

    const finalAdvanceAmt = folioAggregation.advance_amt;
    const finalPostChangesAmt = folioAggregation.post_changes_amt;
    const finalAllowancesAmt = folioAggregation.allowances_amt;
    const finalDiscountAmount = totalDetailAggregation.discount_amount;
    
    const finalCgstAmt = totalDetailAggregation.cgst_amount;
    const finalSgstAmt = totalDetailAggregation.sgst_amount;
    const finalIgstAmt = totalDetailAggregation.igst_amount;
    const finalCessAmt = totalDetailAggregation.cess_amount;
    const finalServiceChargeAmt = totalDetailAggregation.service_charge_amount;
    
    let ldg_bill_no = invoiceNoFromBody || null;
    if (!ldg_bill_no) {
      ldg_bill_no = await generateNextInvoiceNo(connection);
    }

    let finalPaymentId;
    if (payment_id !== undefined && payment_id !== null && String(payment_id).trim() !== '') {
      finalPaymentId = Number(payment_id);
    } else {
      const [defaultModeRows] = await connection.query(
        `SELECT pm.id FROM payment_modes pm
         WHERE pm.hotelid = ? AND pm.is_active = 1
         ORDER BY pm.sequence ASC, pm.id ASC
         LIMIT 1`,
        [checkinData.hotelid]
      );
      finalPaymentId = defaultModeRows.length > 0 ? defaultModeRows[0].id : null;
    }
    
    // ============================================================
    // STEP C: INSERT INTO Checkout_Master
    // ============================================================
    
    const [checkoutResult] = await connection.query(`
      INSERT INTO Checkout_Master (
        checkin_id, guest_id, guest_name, address, mobile, company_name, emailed, booking,
        plan_name, reg_no, special_instruction, message, checkin_datetime, checkout_datetime,
        room_no, room_id, category_id, converted_category, adults, pax, pax_charges, ex_pax,
        ex_pax_charge, child_paid, child_unpaid, child_charge, driver, driver_charge,
        hotelid, id_type, id_number, department_id, department_name, created_by_id,
        created_date, updated_by_id, updated_date, status, total_nights, total_amount,
        checkout_date, checkout_by_id, checkout_reason, is_partial_checkout, checked_out_rooms,
        ldg_bill_no, payment_id, payment_mode, is_settle, is_print,
        discount_amount, post_changes_amt, allowances_amt, advance_amt,
        cgst_amt, sgst_amt, igst_amt, cess_amt, service_charge_amt,
        net_payable, round_off_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      formatDateTime(checkinData.checkin_datetime), 
      formatDateTime(checkinData.checkout_datetime),
      JSON.stringify(checkedOutRoomNumbers),
      JSON.stringify(checkedOutRoomIds),
      checkinData.category_id,
      checkinData.converted_category,
      totalDetailAggregation.adults, 
      totalDetailAggregation.pax, 
      totalDetailAggregation.pax_charges,
      totalDetailAggregation.ex_pax, 
      totalDetailAggregation.ex_pax_charge,
      totalDetailAggregation.child_paid, 
      totalDetailAggregation.child_unpaid, 
      totalDetailAggregation.child_charge,
      totalDetailAggregation.driver, 
      totalDetailAggregation.driver_charge,
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
      totalDetailAggregation.total_nights,
      finalTotalAmount,
      nowStr, 
      userId, 
      checkout_reason || 'Regular checkout',
      !isFullCheckout ? 1 : 0,
      JSON.stringify(checkedOutRoomNumbers),
      ldg_bill_no,
      finalPaymentId,
      resolvedPaymentMode,
      is_settle !== undefined ? is_settle : 0,
      is_print !== undefined ? is_print : 1,
      finalDiscountAmount,
      finalPostChangesAmt,
      finalAllowancesAmt,
      finalAdvanceAmt,
      finalCgstAmt,
      finalSgstAmt,
      finalIgstAmt,
      finalCessAmt,
      finalServiceChargeAmt,
      finalNetPayable,
      finalRoundOffAmount
    ]);
    
    const checkoutId = checkoutResult.insertId;
    
    // ============================================================
    // STEP D: INSERT INTO OTHER CHECKOUT TABLES
    // ============================================================
    
    // Insert into Checkout_Detail
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
        detail.converted_category_name, formatDateTime(detail.checkin_datetime), formatDateTime(detail.checkout_datetime),
        detail.no_of_days, detail.adults, detail.pax, detail.ex_pax, detail.child_unpaid,
        detail.driver, detail.room_tariff, detail.ex_pax_charge, detail.child_paid_amount,
        detail.driver_charge, detail.discount_percent, detail.discount_amount, detail.cgst_percent,
        detail.cgst_amount, detail.sgst_percent, detail.sgst_amount, detail.igst_percent,
        detail.igst_amount, detail.cess_percent, detail.cess_amount, detail.service_charge,
        detail.service_charge_amount, detail.parent_detail_id, 1, detail.merged, detail.tax,
        detail.created_date, nowStr, detail.created_by_id, userId
      ]);
    }
    
    // Insert folios to checkout tables
    for (const folio of folioRows) {
      await connection.query(`
        INSERT INTO Checkout_Folio_Master (
          checkin_id, checkout_id, hotel_id, detail_id, transaction_type, transaction_datetime,
          description, debit_amount, credit_amount, reference_number, payment_method,
          created_by_id, created_date, updated_by_id, updated_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        folio.checkin_id || checkin_id,
        checkoutId,
        folio.hotel_id || checkinData.hotelid,
        safeValue(folio.detail_id),
        safeValue(folio.transaction_type),
        safeValue(folio.transaction_datetime),
        safeValue(folio.description),
        safeNumber(folio.debit_amount) || 0,
        safeNumber(folio.credit_amount) || 0,
        safeValue(folio.reference_number),
        safeValue(folio.payment_method),
        safeValue(folio.created_by_id || userId),
        safeValue(folio.created_date || nowStr),
        userId,
        nowStr
      ]);
    }
    
    // Insert charges to checkout tables
    if (checkedOutRoomIds.length > 0) {
      const placeholders = checkedOutRoomIds.map(() => '?').join(',');
      const [chargeRows] = await connection.query(
        `SELECT * FROM checkin_guest_room_charges WHERE checkin_id = ? AND room_id IN (${placeholders})`,
        [checkin_id, ...checkedOutRoomIds]
      );
      
      for (const charge of chargeRows) {
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
          charge.driver_total, charge.total_amount, charge.checkin_datetime, charge.checkout_datetime,
          charge.created_at, nowStr
        ]);
      }
    }
    
    // ============================================================
    // STEP E: UPDATE STATUS IN ORIGINAL TABLES (NO DELETION!)
    // ============================================================
    
    if (isFullCheckout) {
      // ✅ Update status to 'checked_out' instead of deleting
      await connection.query(`
        UPDATE CheckIn_Master 
        SET status = 'checked_out', 
            updated_by_id = ?, 
            updated_date = ?
        WHERE checkin_id = ?
      `, [userId, nowStr, checkin_id]);
      
      // Mark all details as checked out
      await connection.query(`
        UPDATE checkin_detail_master 
        SET is_checkout = 1, 
            updated_by_id = ?, 
            updated_date = ?
        WHERE checkin_id = ?
      `, [userId, nowStr, checkin_id]);
      
      // ✅ DO NOT DELETE folio and charges - keep for historical reference
      // ✅ DO NOT DELETE checkin_master - status updated only
      
      console.log(`Full checkout ${checkin_id} completed - data preserved in original tables with status='checked_out'`);
      
    } else {
      // Partial checkout - only update checked out rooms
      if (checkedOutRoomIds.length > 0) {
        const placeholders = checkedOutRoomIds.map(() => '?').join(',');
        
        // Update checkin_detail_master for checked out rooms
        await connection.query(`
          UPDATE checkin_detail_master 
          SET is_checkout = 1, 
              updated_by_id = ?, 
              updated_date = ?
          WHERE checkin_id = ? AND room_id IN (${placeholders})
        `, [userId, nowStr, checkin_id, ...checkedOutRoomIds]);
        
        // Keep charges and folio data (no deletion)
        // CheckIn_Master status remains 'active' since some rooms still active
      }
      
      // Update CheckIn_Master with reduced totals (you already have this code)
      const remainingRooms = activeDetailRows.filter(d => !checkedOutRoomNumbers.includes(d.room_number));
      
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
      
      const remainingRoomIds = remainingRooms.map(r => r.room_id);
      let remainingChildCountByRoom = {};
      
      if (remainingRoomIds.length > 0) {
        const rPlaceholders = remainingRoomIds.map(() => '?').join(',');
        const [remainingChargeRows] = await connection.query(
          `SELECT room_id, SUM(COALESCE(child_count,0)) AS child_head_count 
           FROM checkin_guest_room_charges 
           WHERE checkin_id = ? AND room_id IN (${rPlaceholders}) 
           GROUP BY room_id`,
          [checkin_id, ...remainingRoomIds]
        );
        for (const cr of remainingChargeRows) {
          remainingChildCountByRoom[cr.room_id] = safeDecimal(cr.child_head_count);
        }
      }
      
      for (const room of remainingRooms) {
        newTotalAmount += safeDecimal(room.room_tariff);
        newAdults += safeDecimal(room.adults);
        newPax += safeDecimal(room.pax);
        newExPax += safeDecimal(room.ex_pax);
        newExPaxCharge += safeDecimal(room.ex_pax_charge);
        newChildPaid += safeDecimal(remainingChildCountByRoom[room.room_id] || 0);
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
    // STEP F: UPDATE ROOM STATUS TO 'SETTLEMENT' (LIGHT BLUE)
    // ============================================================
    
    const settlementStatusId = await getSettlementStatusId(connection);
    
    if (settlementStatusId) {
      for (const detail of roomsToCheckout) {
        await connection.query(
          `UPDATE room_master 
           SET room_status_id = ?, updated_by_id = ?, updated_date = ? 
           WHERE room_id = ?`,
          [settlementStatusId, userId, nowStr, detail.room_id]
        );
      }
    } else {
      const occupiedStatusId = await getOccupiedStatusId(connection);
      for (const detail of roomsToCheckout) {
        await connection.query(
          `UPDATE room_master 
           SET room_status_id = ?, updated_by_id = ?, updated_date = ? 
           WHERE room_id = ?`,
          [occupiedStatusId, userId, nowStr, detail.room_id]
        );
      }
      console.log(`Room ${detail.room_number} checked out - ready for settlement`);
    }
    
    await connection.commit();
    
    const remainingRoomNumbers = activeDetailRows
      .filter(d => !checkedOutRoomNumbers.includes(d.room_number))
      .map(d => d.room_number);
    
   res.status(200).json({
  success: true,
  message: isFullCheckout 
    ? `Checkout completed successfully. Data preserved in original tables with status='checked_out'.`
    : `${roomsToCheckout.length} room(s) checked out successfully. Remaining rooms: ${remainingRoomNumbers.length > 0 ? remainingRoomNumbers.join(', ') : 'None'}`,
  data: { 
    checkout_id: checkoutId, 
    checkin_id: parseInt(checkin_id),
    is_partial: !isFullCheckout,
    checked_out_rooms: checkedOutRoomNumbers,           // room numbers (array)
    checked_out_room_ids: checkedOutRoomIds,            // room IDs (array)   <-- add
    checked_out_room_ids_comma: checkedOutRoomIds.join(', '), // comma string <-- add
    remaining_rooms: remainingRoomNumbers,
    ldg_bill_no: ldg_bill_no,
    aggregated_values: {
      advance_amt: finalAdvanceAmt,
      post_changes_amt: finalPostChangesAmt,
      allowances_amt: finalAllowancesAmt,
      discount_amount: finalDiscountAmount,
      cgst_amt: finalCgstAmt,
      sgst_amt: finalSgstAmt,
      igst_amt: finalIgstAmt,
      cess_amt: finalCessAmt,
      service_charge_amt: finalServiceChargeAmt,
      total_amount: finalTotalAmount,
      net_payable: finalNetPayable
    }
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

// DELETE checkout record (soft delete - update status only)
exports.deleteCheckout = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [existing] = await db.query('SELECT checkout_id FROM Checkout_Master WHERE checkout_id = ?', [id]);
    if (!existing[0]) {
      return res.status(404).json({ success: false, message: "Checkout not found" });
    }
    
    // Soft delete - update status instead of actual delete
    await db.query('UPDATE Checkout_Master SET status = "deleted", updated_date = NOW() WHERE checkout_id = ?', [id]);
    
    res.status(200).json({ success: true, message: "Checkout marked as deleted successfully", data: { checkout_id: parseInt(id) } });
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

// यह function HTTP request handle करेगा
exports.makeRoomsVacant = async (req, res) => {
  const { roomIds } = req.body;
  const userId = getCurrentUserId(req);
  
  if (!roomIds || !Array.isArray(roomIds) || roomIds.length === 0) {
    return res.status(400).json({ success: false, message: "roomIds array is required" });
  }

  const connection = await db.getConnection();
  try {
    const result = await updateRoomsToAvailable(connection, roomIds, userId);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

