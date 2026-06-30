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

        console.log('🔍 getBillPreview called with:', { checkout_id, ldg_bill_no });

        let checkoutId = checkout_id;
        
        if (!checkoutId && ldg_bill_no) {
            console.log('📋 Fetching checkout_id from ldg_bill_no:', ldg_bill_no);
            const [result] = await db.execute(
                'SELECT checkout_id FROM checkout_master WHERE ldg_bill_no = ?',
                [ldg_bill_no]
            );
            
            if (result.length === 0) {
                console.log('❌ No bill found with ldg_bill_no:', ldg_bill_no);
                return res.status(404).json({
                    success: false,
                    message: "No bill found with this ldg_bill_no"
                });
            }
            checkoutId = result[0].checkout_id;
            console.log('✅ Found checkout_id:', checkoutId);
        }

        if (!checkoutId) {
            console.log('❌ No checkout_id provided');
            return res.status(400).json({
                success: false,
                message: "checkout_id or ldg_bill_no is required"
            });
        }

        console.log('🔄 Calling stored procedure sp_checkout_bill with checkout_id:', checkoutId);
        const [results] = await db.execute('CALL sp_checkout_bill(?)', [checkoutId]);

        console.log('📊 Results received:');
        console.log('  - Result Set 1 (Header):', results[0] ? results[0].length : 0, 'rows');
        console.log('  - Result Set 2 (Transactions):', results[1] ? results[1].length : 0, 'rows');
        console.log('  - Result Set 3 (Footer):', results[2] ? results[2].length : 0, 'rows');

        const headerData = results[0][0] || {};
        const transactionRows = results[1] || [];
        const footerSummary = results[2][0] || {};

        console.log('📋 Header Data:', {
            hotel_name: headerData.hotel_name,
            checkout_id: headerData.checkout_id,
            guest_name: headerData.guest_name,
            total_amount: headerData.total_amount,
            net_payable: headerData.net_payable,
            post_changes_amt: headerData.post_changes_amt,
            allowances_amt: headerData.allowances_amt,
            advance_amt: headerData.advance_amt
        });

        console.log('📋 Footer Summary:', footerSummary);

        // 🔍 DEBUG: Log raw transaction rows before mapping
        console.log('🔍 RAW Transaction Rows (first 5):');
        transactionRows.slice(0, 5).forEach((row, index) => {
            console.log(`  Row ${index + 1}:`, {
                room_number: row.room_number,
                bill_date: row.bill_date,
                transaction_type: row.transaction_type,
                description: row.description,
                tariff: row.tariff,
                ex_pax: row.ex_pax,
                cgst: row.cgst,
                sgst: row.sgst,
                food: row.food,
                post_charges: row.post_charges,
                allowance: row.allowance,
                total_amount: row.total_amount
            });
        });

        // 🔍 DEBUG: Log all transaction types present
        const transactionTypes = [...new Set(transactionRows.map(r => r.transaction_type))];
        console.log('📊 Transaction Types found:', transactionTypes);

        // 🔍 DEBUG: Log post charges specifically
        const postChargeRows = transactionRows.filter(r => r.transaction_type === 'Post Charge');
        console.log(`📊 Post Charge rows: ${postChargeRows.length}`);
        postChargeRows.forEach((row, index) => {
            console.log(`  Post Charge ${index + 1}:`, {
                room_number: row.room_number,
                description: row.description,
                post_charges: row.post_charges,
                total_amount: row.total_amount
            });
        });

        // 🔍 DEBUG: Log allowance/advance rows specifically
        const allowanceRows = transactionRows.filter(r => 
            r.transaction_type === 'Allowance' || r.transaction_type === 'Advance'
        );
        console.log(`📊 Allowance/Advance rows: ${allowanceRows.length}`);
        allowanceRows.forEach((row, index) => {
            console.log(`  Allowance/Advance ${index + 1}:`, {
                room_number: row.room_number,
                transaction_type: row.transaction_type,
                description: row.description,
                allowance: row.allowance,
                total_amount: row.total_amount
            });
        });

        // 🔍 DEBUG: Log food rows specifically
        const foodRows = transactionRows.filter(r => r.transaction_type === 'Food');
        console.log(`📊 Food rows: ${foodRows.length}`);
        foodRows.forEach((row, index) => {
            console.log(`  Food ${index + 1}:`, {
                room_number: row.room_number,
                description: row.description,
                food: row.food,
                total_amount: row.total_amount
            });
        });

        // 🔴 FIX: Put headerData first, then row so row data takes precedence
        const flatData = transactionRows.map(row => ({
            ...headerData,  // First add header data
            ...row,         // Then add row data (this will OVERWRITE header data if same keys exist)
            // Map fields for frontend compatibility
            room_tariff: row.tariff || 0,
            ex_pax_total: row.ex_pax || 0,
            cgst_amount: row.cgst || 0,
            sgst_amount: row.sgst || 0,
            total_amount: row.total_amount || 0,
            room_total_amount: row.total_amount || 0,
            // CRITICAL: Keep these fields from the transaction rows
            post_charges: row.post_charges || 0,
            allowance: row.allowance || 0,
            transaction_type: row.transaction_type || '',
            description: row.description || '',
            // Footer summary fields
            net_payable: footerSummary.net_payable || headerData.net_payable || 0,
            bill_amount: footerSummary.bill_amount || headerData.total_amount || 0,
            discount_amount_total: footerSummary.discount_amount || headerData.discount_amount || 0,
            advance_amount_total: footerSummary.advance_amount || headerData.advance_amt || 0,
            post_charges_total: footerSummary.post_charges || 0,
            allowance_total: footerSummary.allowance || 0,
            round_off_amount: footerSummary.round_off_amount || headerData.round_off_amount || 0,
        }));

        // 🔍 DEBUG: Log first 5 rows after mapping
        console.log('🔍 Mapped Data (first 5 rows):');
        flatData.slice(0, 5).forEach((row, index) => {
            console.log(`  Mapped Row ${index + 1}:`, {
                room_number: row.room_number,
                bill_date: row.bill_date,
                transaction_type: row.transaction_type,
                description: row.description,
                post_charges: row.post_charges,
                allowance: row.allowance,
                food: row.food,
                total_amount: row.total_amount
            });
        });

        // 🔍 DEBUG: Log summary of all transaction types in mapped data
        const mappedTypes = [...new Set(flatData.map(r => r.transaction_type))];
        console.log('📊 Mapped Transaction Types:', mappedTypes);

        // 🔍 DEBUG: Count rows by transaction type
        const typeCounts = {};
        flatData.forEach(r => {
            const type = r.transaction_type || 'Unknown';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        console.log('📊 Row counts by transaction type:', typeCounts);

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

// PERFORM CHECKOUT - UPDATED: NO DELETION, only status update and data preservation
exports.performCheckout = async (req, res) => {
  let connection;
  try {
    console.log('🚀 ========== STARTING CHECKOUT PROCESS ==========');
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    
    connection = await db.getConnection();
    console.log('✅ Database connection established');
    
    await connection.beginTransaction();
    console.log('🔄 Transaction started');

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
    console.log(`👤 User ID: ${userId}`);
    console.log(`🏨 Checkin ID: ${checkin_id}`);
    console.log(`🛏️ Selected Rooms:`, selected_rooms);
    console.log(`📋 Selected Rooms (JSON string):`, JSON.stringify(selected_rooms));
    console.log(`💰 Total Amount: ${total_amount}`);
    console.log(`💳 Payment Method: ${payment_method || 'Cash'}`);
    console.log(`🧾 Invoice No: ${invoiceNoFromBody || 'Auto-generate'}`);

    // ✅ Call the stored procedure
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
      userId
    ];

    console.log('📤 Calling stored procedure with params:');
    console.log(`  - p_checkin_id: ${params[0]}`);
    console.log(`  - p_checkout_reason: ${params[1]}`);
    console.log(`  - p_payment_method: ${params[2]}`);
    console.log(`  - p_total_amount: ${params[3]}`);
    console.log(`  - p_round_off_amount: ${params[4]}`);
    console.log(`  - p_net_payable: ${params[5]}`);
    console.log(`  - p_selected_rooms: ${params[6]}`);
    console.log(`  - p_invoice_no: ${params[7]}`);
    console.log(`  - p_payment_id: ${params[8]}`);
    console.log(`  - p_payment_mode: ${params[9]}`);
    console.log(`  - p_is_settle: ${params[10]}`);
    console.log(`  - p_is_print: ${params[11]}`);
    console.log(`  - p_user_id: ${params[12]}`);

    console.log('⏳ Executing stored procedure...');
    const startTime = Date.now();
    
    const [results] = await connection.execute(
      `CALL sp_perform_checkout(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      params
    );
    
    const endTime = Date.now();
    console.log(`✅ Stored procedure executed in ${endTime - startTime}ms`);

    console.log('📊 Raw results from stored procedure:');
    console.log(`  - Results length: ${results?.length || 0}`);
    if (results && results.length > 0) {
      console.log(`  - First result set length: ${results[0]?.length || 0}`);
      if (results[0] && results[0].length > 0) {
        console.log(`  - First row:`, JSON.stringify(results[0][0], null, 2));
      }
    }

    await connection.commit();
    console.log('✅ Transaction committed');

    // Parse the result
    let result = null;
    if (results && results.length > 0 && results[0] && results[0].length > 0) {
      const row = results[0][0];
      console.log('📦 Row data:', JSON.stringify(row, null, 2));
      
      if (row && row.result) {
        console.log('🔍 Parsing result from row.result');
        try {
          result = typeof row.result === 'string' ? JSON.parse(row.result) : row.result;
          console.log('✅ Result parsed successfully');
          console.log('📊 Parsed result:', JSON.stringify(result, null, 2));
        } catch (parseError) {
          console.error('❌ Failed to parse result:', parseError);
          console.log('Raw result:', row.result);
          throw new Error('Failed to parse checkout result');
        }
      } else {
        console.warn('⚠️ No "result" field found in row:', Object.keys(row));
        // Try to use the row directly if it has success field
        if (row.success !== undefined) {
          result = row;
          console.log('📊 Using row directly as result');
        }
      }
    } else {
      console.warn('⚠️ No results returned from stored procedure');
    }

    if (result && result.success) {
      console.log('✅ Checkout successful!');
      console.log(`  - Checkout ID: ${result.checkout_id}`);
      console.log(`  - LDG Bill No: ${result.ldg_bill_no}`);
      console.log(`  - Is Partial: ${result.is_partial || false}`);
      console.log(`  - Room IDs Updated: ${result.room_ids_updated || 'N/A'}`);
      console.log(`  - Debug Info: ${result.debug_info || 'N/A'}`);
      
      if (result.data) {
        console.log('  - Data:', JSON.stringify(result.data, null, 2));
      }
      
      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data,
        checkout_id: result.checkout_id,
        ldg_bill_no: result.ldg_bill_no,
        debug_info: result.debug_info
      });
    } else {
      console.error('❌ Checkout failed:', result?.message || 'Unknown error');
      throw new Error(result?.message || 'Checkout failed');
    }

  } catch (error) {
    console.error('❌ ========== CHECKOUT ERROR ==========');
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
    
    if (connection) {
      console.log('🔄 Rolling back transaction...');
      await connection.rollback();
      console.log('✅ Transaction rolled back');
    }
    
    console.error('Checkout error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Checkout failed',
      error: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        code: error.code,
        sqlMessage: error.sqlMessage
      } : undefined
    });
  } finally {
    if (connection) {
      console.log('🔓 Releasing database connection...');
      connection.release();
      console.log('✅ Connection released');
    }
    console.log('🏁 ========== CHECKOUT PROCESS ENDED ==========');
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

