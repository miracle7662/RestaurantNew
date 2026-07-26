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

    GROUP_CONCAT(
        CONCAT('Room ', cd.room_id, ' (', cd.guest_name, ')')
        ORDER BY cd.room_id
        SEPARATOR ' | '
    ) AS room_details,

    GROUP_CONCAT(
        DISTINCT cd.guest_name
        ORDER BY cd.guest_name
        SEPARATOR ', '
    ) AS guest_name,

    COUNT(cd.room_id) AS total_rooms

FROM checkout_master cm
INNER JOIN checkout_detail cd
    ON cd.checkout_id = cm.checkout_id
    AND cd.is_settle = 0

WHERE cm.hotelid = ?
  AND cm.checkout_date = (
        SELECT MAX(c2.checkout_date)
        FROM checkout_master c2
        WHERE c2.ldg_bill_no = cm.ldg_bill_no
  )

GROUP BY cm.checkout_id

ORDER BY cm.ldg_bill_no;
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

        // 1. Determine checkoutId
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

        // 2. Get hotelId – from user context, query param, or fallback to checkout record
        let hotelId = req.user?.hotelId || req.query.hotel_id;

        if (!hotelId) {
            // Fetch hotelId from the checkout record
            const [hotelResult] = await db.execute(
                'SELECT hotelid FROM checkout_master WHERE checkout_id = ?',
                [checkoutId]
            );
            if (hotelResult.length > 0) {
                hotelId = hotelResult[0].hotelid;
            } else {
                return res.status(404).json({
                    success: false,
                    message: "Checkout record not found"
                });
            }
        }

        console.log('🔍 getBillPreview called with:', { checkout_id, ldg_bill_no, hotelId });

        // 3. Call stored procedure with both parameters
        const [results] = await db.execute('CALL sp_checkout_bill(?, ?)', [checkoutId, hotelId]);

        const headerData = results[0][0] || {};
        const transactionRows = results[1] || [];
        const footerSummary = results[2][0] || {};

        // ... rest of the mapping and response unchanged
        // (keep your existing mapping code)
        const typeMap = {
            'CHARGE': 'Post Charge',
            'ALLOWANCE': 'Allowance',
            'ADVANCE ADDITION': 'Advance',
            'ROOM CHARGES': 'Room Charge',
            'ROOM EXTENSION': 'Room Extension',
            'FOOD': 'Food'
        };

        const flatData = transactionRows.map(row => ({
            ...headerData,
            ...row,
            room_tariff: row.tariff || 0,
            ex_pax_total: row.ex_pax || 0,
            cgst_amount: row.cgst || 0,
            sgst_amount: row.sgst || 0,
            total_amount: row.total_amount || 0,
            room_total_amount: row.total_amount || 0,
            post_charges: row.post_charges || 0,
            allowance: row.allowance || 0,
            transaction_type: typeMap[row.transaction_type] || row.transaction_type || '',
            description: row.description || '',
            net_payable: footerSummary.net_payable || headerData.net_payable || 0,
            bill_amount: footerSummary.bill_amount || headerData.total_amount || 0,
            discount_amount_total: footerSummary.discount_amount || headerData.discount_amount || 0,
            advance_amount_total: footerSummary.advance_amount || headerData.advance_amt || 0,
            post_charges_total: footerSummary.post_charges || 0,
            allowance_total: footerSummary.allowance || 0,
            round_off_amount: footerSummary.round_off_amount || headerData.round_off_amount || 0,
        }));

        console.log(`✅ Mapped ${flatData.length} rows`);

        return res.status(200).json({
            success: true,
            message: "Bill Preview fetched successfully.",
            data: flatData,
            summary: footerSummary
        });

    } catch (error) {
        console.error("❌ Bill Preview Error:", error);
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


exports.performCheckout = async (req, res) => {
  let connection;
  try {
    console.log('🔵 ==========================================');
    console.log('🔵 [performCheckout] STARTING...');
    console.log('🔵 ==========================================');
    console.log('🔵 Request body:', JSON.stringify(req.body, null, 2));

    connection = await db.getConnection();
    console.log('🔵 Database connection acquired successfully');
    await connection.beginTransaction();
    console.log('🔵 Transaction started');

    const {
      checkin_id,
      checkout_reason,
      payment_method,
      total_amount,
      round_off_amount,
      net_payable,
      selected_rooms = [],
      payment_id,
      payment_mode,
      is_settle,
      is_print,
      checkout_datetime,
      is_undo = 0,
      undo_room_ids = null,
      total_nights = null,
      // ✅ NEW PARAMETERS FROM FRONTEND
      checkout_detail_rows = [],
      checkout_folio_rows = [],
      checkout_master_totals = {},
      // Guest & company details (sent from frontend or fallback)
      guest_id = 0,
      guest_name = '',
      address = '',
      mobile = '',
      company_id = 0,
      company_name = '',
    } = req.body;

    const userId = getCurrentUserId(req);
    console.log(`🔵 User ID: ${userId}`);
    console.log(`🔵 Checkin ID: ${checkin_id}`);
    console.log(`🔵 Selected Rooms: ${JSON.stringify(selected_rooms)}`);
    console.log(`🔵 Payment Method: ${payment_method || 'Cash'}`);
    console.log(`🔵 Checkout DateTime: ${checkout_datetime || 'Will use server time'}`);
    console.log(`🔵 Total Amount: ${total_amount}`);
    console.log(`🔵 Net Payable: ${net_payable}`);
   
    console.log(`🔵 Is Undo Mode: ${is_undo}`);
    console.log(`🔵 Undo Room IDs: ${JSON.stringify(undo_room_ids)}`);
    console.log(`🔵 Checkout Detail Rows: ${JSON.stringify(checkout_detail_rows)}`);
    console.log(`🔵 Checkout Folio Rows: ${JSON.stringify(checkout_folio_rows)}`);
    console.log(`🔵 Checkout Master Totals: ${JSON.stringify(checkout_master_totals)}`);

    // Check if checkin exists
    console.log('🔵 Checking if checkin exists...');
    const [checkinCheck] = await connection.execute(
      'SELECT checkin_id, status FROM CheckIn_Master WHERE checkin_id = ?',
      [checkin_id]
    );
    
    if (!checkinCheck || checkinCheck.length === 0) {
      console.error('🔴 Checkin not found!');
      await connection.rollback();
      return res.status(404).json({
        success: false,
        message: 'Check-in record not found'
      });
    }

    // --------------------------------------------------------------------------
    // EXTRACT ALL REQUIRED TOTALS FROM checkout_master_totals
    // --------------------------------------------------------------------------
    const {
      room_tariff_sum = 0,
      ex_pax_charge = 0,
      child_paid_amount = 0,
      driver_charge = 0,
      discount_amount = 0,
      cgst_amount = 0,
      sgst_amount = 0,
      igst_amount = 0,
      ex_cgst_amount = 0,
      ex_sgst_amount = 0,
      ex_igst_amount = 0,
      child_cgst_amount = 0,
      child_sgst_amount = 0,
      child_igst_amount = 0,
      driver_cgst_amount = 0,
      driver_sgst_amount = 0,
      driver_igst_amount = 0,
      cess_amount = 0,
      service_charge_amount = 0,
      advance_amt = 0,
    } = checkout_master_totals;

    // --------------------------------------------------------------------------
    // BUILD THE 44 PARAMETERS ARRAY (order must match procedure definition)
    // --------------------------------------------------------------------------
    const params = [
      checkin_id,                                           // 1  p_checkin_id
      checkout_reason || 'Regular checkout',                // 2  p_checkout_reason
      payment_method || 'Cash',                             // 3  p_payment_method
      total_amount || 0,                                   // 4  p_total_amount
      round_off_amount || 0,                               // 5  p_round_off_amount
      net_payable || 0,                                    // 6  p_net_payable
      JSON.stringify(selected_rooms),                       // 7  p_selected_rooms
       null,                           // 8  p_invoice_no
      payment_id || null,                                  // 9  p_payment_id
      payment_mode || payment_method || 'Cash',            // 10 p_payment_mode
      is_settle || 0,                                      // 11 p_is_settle
      is_print || 1,                                       // 12 p_is_print
      userId,                                              // 13 p_user_id
      formatDateTime(checkout_datetime),                   // 14 p_checkout_datetime
      is_undo,                                             // 15 p_is_undo
      undo_room_ids ? JSON.stringify(undo_room_ids) : null, // 16 p_undo_room_ids
      total_nights,                                        // 17 p_total_nights

      // 18–37: all individual totals
      room_tariff_sum,                                     // 18 p_room_tariff_sum
      ex_pax_charge,                                       // 19 p_ex_pax_charge
      child_paid_amount,                                   // 20 p_child_paid_amount
      driver_charge,                                       // 21 p_driver_charge
      discount_amount,                                     // 22 p_discount_amount
      cgst_amount,                                         // 23 p_cgst_amount
      sgst_amount,                                         // 24 p_sgst_amount
      igst_amount,                                         // 25 p_igst_amount
      ex_cgst_amount,                                      // 26 p_ex_cgst_amount
      ex_sgst_amount,                                      // 27 p_ex_sgst_amount
      ex_igst_amount,                                      // 28 p_ex_igst_amount
      child_cgst_amount,                                   // 29 p_child_cgst_amount
      child_sgst_amount,                                   // 30 p_child_sgst_amount
      child_igst_amount,                                   // 31 p_child_igst_amount
      driver_cgst_amount,                                  // 32 p_driver_cgst_amount
      driver_sgst_amount,                                  // 33 p_driver_sgst_amount
      driver_igst_amount,                                  // 34 p_driver_igst_amount
      cess_amount,                                         // 35 p_cess_amount
      service_charge_amount,                               // 36 p_service_charge_amount
      advance_amt,                                         // 37 p_advance_amt

      // 38–43: guest & company info
      guest_id || 0,                                       // 38 p_guest_id
      guest_name || null,                                  // 39 p_guest_name
      address || null,                                     // 40 p_address
      mobile || null,                                      // 41 p_mobile
      company_id || 0,                                     // 42 p_company_id
      company_name || null,                                // 43 p_company_name

      // 44: room_details JSON (use the detail rows from frontend)
      JSON.stringify(checkout_detail_rows),                // 44 p_room_details
    ];

    console.log('🔵 ==========================================');
    console.log('🔵 Calling sp_perform_checkout with 44 params:');
    console.log('🔵 ==========================================');
    params.forEach((param, index) => {
      console.log(`   [${index + 1}] ${param !== null ? param : 'NULL'} (${typeof param})`);
    });
    console.log('🔵 ==========================================');

    // --------------------------------------------------------------------------
    // EXECUTE STORED PROCEDURE – NOW WITH 44 PLACEHOLDERS
    // --------------------------------------------------------------------------
    const [results] = await connection.execute(
      `CALL sp_perform_checkout(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params
    );

    console.log('🔵 Stored procedure executed successfully');

    await connection.commit();
    console.log('🔵 Transaction committed successfully');

    // Process results (unchanged)
    let result = null;
    if (results && results.length > 0 && results[0] && results[0].length > 0) {
      const firstRow = results[0][0];
      console.log('🔵 First row from result set:', JSON.stringify(firstRow, null, 2));

      if (firstRow && firstRow.result) {
        try {
          result = typeof firstRow.result === 'string'
            ? JSON.parse(firstRow.result)
            : firstRow.result;
          console.log('🔵 Parsed result successfully:');
          console.log(JSON.stringify(result, null, 2));
        } catch (parseError) {
          console.error('🔴 Failed to parse result JSON:', parseError);
          throw new Error('Invalid JSON response from stored procedure');
        }
      } else {
        result = firstRow;
        console.log('🔵 Using raw row as result:', JSON.stringify(result, null, 2));
      }
    } else {
      throw new Error('No data returned from stored procedure');
    }

    // Check outcome (unchanged)
    if (result && result.success === true) {
      console.log('✅ Checkout SUCCESSFUL');
      console.log(`✅ Checkout ID: ${result.checkout_id}`);
      console.log(`✅ LDG Bill No: ${result.ldg_bill_no}`);
      console.log(`✅ Checkout Time: ${result.checkout_datetime || 'Set by database'}`);
      console.log(`✅ Case Type: ${result.case_type || 'Normal'}`);

      return res.status(200).json({
        success: true,
        message: result.message,
        checkout_id: result.checkout_id,
        checkin_id: result.checkin_id,
        ldg_bill_no: result.ldg_bill_no,
        is_partial: result.is_partial,
        payment_method: result.payment_method,
        checkout_datetime: result.checkout_datetime,
        checked_out_rooms: result.checked_out_rooms,
        checked_out_room_ids: result.checked_out_room_ids,
        rooms_updated_count: result.rooms_updated_count,
        case_type: result.case_type || 'Normal Checkout',
        rooms_undone: result.rooms_undone,
        rooms_remaining: result.rooms_remaining,
        data: result.data,
      });
    } else {
      const errorMsg = result?.message || 'Checkout failed';
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error('🔴 EXCEPTION CAUGHT:', error);
    if (connection) {
      try {
        await connection.rollback();
        console.log('🔵 Transaction rolled back');
      } catch (rollbackError) {
        console.error('🔴 Rollback failed:', rollbackError);
      }
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Checkout failed',
    });
  } finally {
    if (connection) {
      connection.release();
      console.log('🔵 Database connection released');
    }
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

