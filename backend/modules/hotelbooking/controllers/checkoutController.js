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
        cd.guest_name
        ORDER BY cd.room_id
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
      invoiceNoFromBody,
      payment_id,
      payment_mode,
      is_settle,
      is_print,
      checkout_datetime,  // ✅ ADD THIS - extract from request body
    } = req.body;

    const userId = getCurrentUserId(req);
    console.log(`🔵 User ID: ${userId}`);
    console.log(`🔵 Checkin ID: ${checkin_id}`);
    console.log(`🔵 Selected Rooms: ${JSON.stringify(selected_rooms)}`);
    console.log(`🔵 Payment Method: ${payment_method || 'Cash'}`);
    console.log(`🔵 Checkout DateTime: ${checkout_datetime || 'Will use server time'}`);
    console.log(`🔵 Total Amount: ${total_amount}`);
    console.log(`🔵 Net Payable: ${net_payable}`);
    console.log(`🔵 Invoice No: ${invoiceNoFromBody || 'Auto generate'}`);

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

    // Check folio transactions
    console.log('🔵 Checking folio transactions...');
    const [folioCheck] = await connection.execute(
      `SELECT COUNT(*) as folio_count, 
              SUM(CASE WHEN transaction_type IN ('Booking Receipt','Advance Addition') THEN credit_amount ELSE 0 END) as total_advance,
              SUM(CASE WHEN transaction_type = 'CHARGE' THEN debit_amount ELSE 0 END) as total_charges,
              SUM(CASE WHEN transaction_type = 'ALLOWANCE' THEN credit_amount ELSE 0 END) as total_allowance
       FROM checkin_guest_folio_master 
       WHERE checkin_id = ?`,
      [checkin_id]
    );

    // Check room charges
    console.log('🔵 Checking room charges...');
    const [roomChargesCheck] = await connection.execute(
      `SELECT COUNT(*) as charge_count, 
              SUM(total_amount) as total_charges
       FROM checkin_guest_room_charges 
       WHERE checkin_id = ?`,
      [checkin_id]
    );

    // Check active rooms
    console.log('🔵 Checking active rooms...');
    const [activeRooms] = await connection.execute(
      `SELECT room_id, room_number, is_checkout 
       FROM checkin_detail_master 
       WHERE checkin_id = ?`,
      [checkin_id]
    );

    // ✅ UPDATE PARAMETERS - NOW 14 PARAMETERS
    const params = [
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
      userId,
      checkout_datetime || null,  // ✅ ADD THIS - 14th parameter
    ];

    console.log('🔵 ==========================================');
    console.log('🔵 Calling sp_perform_checkout with params:');
    console.log('🔵 ==========================================');
    console.log(`   [1] checkin_id: ${params[0]} (${typeof params[0]})`);
    console.log(`   [2] checkout_reason: ${params[1]} (${typeof params[1]})`);
    console.log(`   [3] payment_method: ${params[2]} (${typeof params[2]})`);
    console.log(`   [4] total_amount: ${params[3]} (${typeof params[3]})`);
    console.log(`   [5] round_off_amount: ${params[4]} (${typeof params[4]})`);
    console.log(`   [6] net_payable: ${params[5]} (${typeof params[5]})`);
    console.log(`   [7] selected_rooms: ${params[6]} (${typeof params[6]})`);
    console.log(`   [8] invoiceNo: ${params[7]} (${typeof params[7]})`);
    console.log(`   [9] payment_id: ${params[8]} (${typeof params[8]})`);
    console.log(`   [10] payment_mode: ${params[9]} (${typeof params[9]})`);
    console.log(`   [11] is_settle: ${params[10]} (${typeof params[10]})`);
    console.log(`   [12] is_print: ${params[11]} (${typeof params[11]})`);
    console.log(`   [13] userId: ${params[12]} (${typeof params[12]})`);
    console.log(`   [14] checkout_datetime: ${params[13] || 'NULL'} (${typeof params[13]})`); // ✅ ADD THIS
    console.log('🔵 ==========================================');

    // Execute stored procedure - NOW WITH 14 PARAMETERS
    console.log('🔵 Executing stored procedure...');
    const [results] = await connection.execute(
      `CALL sp_perform_checkout(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, // ✅ 14 placeholders
      params
    );
    console.log('🔵 Stored procedure executed successfully');

    await connection.commit();
    console.log('🔵 Transaction committed successfully');

    // Process results
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

    // Check outcome
    if (result && result.success === true) {
      console.log('✅ Checkout SUCCESSFUL');
      console.log(`✅ Checkout ID: ${result.checkout_id}`);
      console.log(`✅ LDG Bill No: ${result.ldg_bill_no}`);
      console.log(`✅ Checkout Time: ${result.checkout_datetime || 'Set by database'}`);

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

