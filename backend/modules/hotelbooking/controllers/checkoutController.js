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
  let connection;
  try {
    connection = await db.getConnection();
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

    // ✅ Call the stored procedure
    const [results] = await connection.execute(
      `CALL sp_perform_checkout(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        checkin_id,
        checkout_reason || 'Regular checkout',
        payment_method || 'Cash',
        total_amount || 0,
        round_off_amount || 0,
        net_payable || 0,
        JSON.stringify(selected_rooms),
        invoiceNoFromBody || null,
        payment_id || null,
        payment_mode || payment_method || 'Cash',
        is_settle || 0,
        is_print || 1,
        userId
      ]
    );

    await connection.commit();

    // Parse the result
    let result = null;
    if (results && results.length > 0 && results[0] && results[0].length > 0) {
      const row = results[0][0];
      if (row && row.result) {
        result = typeof row.result === 'string' ? JSON.parse(row.result) : row.result;
      }
    }

    if (result && result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        checkout_id: result.checkout_id,
        ldg_bill_no: result.ldg_bill_no
      });
    } else {
      throw new Error(result?.message || 'Checkout failed');
    }

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Checkout error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Checkout failed'
    });
  } finally {
    if (connection) connection.release();
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

