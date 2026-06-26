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

        let checkoutId = checkout_id;
        
        if (!checkoutId && ldg_bill_no) {
            const [result] = await db.execute(
                'SELECT checkout_id FROM checkout_master WHERE ldg_bill_no = ?',
                [ldg_bill_no]
            );
            
            if (result.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "No bill found with this ldg_bill_no"
                });
            }
            checkoutId = result[0].checkout_id;
        }

        if (!checkoutId) {
            return res.status(400).json({
                success: false,
                message: "checkout_id or ldg_bill_no is required"
            });
        }

        const [results] = await db.execute('CALL sp_checkout_bill(?)', [checkoutId]);

        const headerData = results[0][0] || {};
        const roomDetails = results[1] || [];
        const footerSummary = results[2][0] || {};

        // Transform room details to match frontend's DisplayDetailRow interface
        const flatData = roomDetails.map(room => ({
            // Hotel fields
            hotel_name: headerData.hotel_name,
            hotel_address: headerData.hotel_address,
            phone: headerData.phone,
            trn_gstno: headerData.trn_gstno,

            // Checkout fields
            checkout_id: headerData.checkout_id,
            checkin_id: headerData.checkin_id,
            reg_no: headerData.reg_no,
            ldg_bill_no: headerData.ldg_bill_no,
            guest_name: headerData.guest_name,
            guest_address: headerData.guest_address,
            mobile: headerData.mobile,
            company_name: headerData.company_name,
            booking: headerData.booking,
            plan_name: headerData.plan_name,
            checkin_datetime: headerData.checkin_datetime,
            checkout_datetime: headerData.checkout_datetime,
            payment_mode: headerData.payment_mode,
            adults: headerData.adults,
            pax: headerData.pax,
            ex_pax: headerData.ex_pax,
            total_nights: headerData.total_nights,

            // Room details (matching frontend expectations)
            room_number: room.room_number,
            room_category_name: room.room_category_name || '-',
            converted_category_name: room.converted_category_name || '-',
            bill_date: room.bill_date,
            bill_date_formatted: formatBillDate(room.bill_date),
            checkin_datetime: headerData.checkin_datetime,
            checkout_datetime: headerData.checkout_datetime,
            no_of_days: room.no_of_days || 1,
            day_number: 1,
            original_day_number: 1,
            room_tariff_per_day: room.room_tariff_per_day || 0,
            total_room_tariff: room.room_tariff_per_day || 0,
            ex_pax_count: room.ex_pax_count || 0,
            ex_pax_price: room.ex_pax_price || 0,
            ex_pax_tax: room.ex_pax_tax || 0,
            ex_pax_tax_percent: room.ex_pax_tax_percent || 0,
            ex_pax_total: room.ex_pax_total || 0,
            child_count: room.child_count || 0,
            child_unpaid: 0,
            child_price: room.child_price || 0,
            child_tax: room.child_tax || 0,
            child_tax_percent: room.child_tax_percent || 0,
            child_total: room.child_total || 0,
            driver_count: room.driver_count || 0,
            driver_price: room.driver_price || 0,
            driver_tax: room.driver_tax || 0,
            driver_tax_percent: room.driver_tax_percent || 0,
            driver_total: room.driver_total || 0,
            cgst_amount: room.cgst_amount || 0,
            sgst_amount: room.sgst_amount || 0,
            igst_amount: room.igst_amount || 0,
            cess_amount: room.cess_amount || 0,
            service_charge_amount: room.service_charge_amount || 0,
            adults: room.adults || 0,
            pax: room.pax || 0,
            ex_pax: room.ex_pax || 0,
            child_paid: room.child_paid || 0,
            driver: room.driver || 0,
            discount_percent: room.discount_percent || 0,
            discount_amount: room.discount_amount || 0,
            tax_percent: room.tax_percent || 18,
            tax_amount: room.tax_amount || 0,
            total_amount: room.total_amount || 0,
            is_extension: false,
            isPostCharge: room.transaction_type !== 'Room Charge',
            parent_detail_id: null,
            selected: true,
            cumulative_total: 0,
            payment_method: headerData.payment_mode || 'Cash',
            created_at: room.bill_date,
            has_checkout_datetime: !!headerData.checkout_datetime,
            checkout_time_formatted: headerData.checkout_datetime ? formatDateTime(headerData.checkout_datetime) : '-',
            description: room.description || room.transaction_type || 'Room Charges',
            particulars: room.particulars || '',
            department_name: room.transaction_type || '',
            room_group: room.room_number,
        }));

        // Calculate cumulative totals for each room
        const cumulativeMap = new Map();
        flatData.forEach(row => {
            const roomNum = row.room_number;
            const prev = cumulativeMap.get(roomNum) || 0;
            const total = Number(row.total_amount) || 0;
            cumulativeMap.set(roomNum, prev + total);
            row.cumulative_total = cumulativeMap.get(roomNum);
        });

        return res.status(200).json({
            success: true,
            message: "Bill Preview fetched successfully.",
            data: flatData
        });

    } catch (error) {
        console.error("Bill Preview Error:", error);
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Helper functions for formatting
function formatBillDate(dateString) {
    if (!dateString) return '-';
    const d = new Date(dateString);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear().toString().slice(-2);
    return `${day}-${month}-${year}`;
}



// Helper functions for formatting


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

