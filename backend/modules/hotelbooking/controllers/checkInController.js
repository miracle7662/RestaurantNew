// controllers/checkInController.js
const db = require('../../../config/db');

// Helper to get current user ID
const getCurrentUserId = (req) => req.user?.id || null;

// Helper to get current user's hotel ID
const getCurrentUserHotelId = (req) => req.user?.hotel_id || null;

// Helper to format MySQL datetime
const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return null;
    const d = new Date(dateTimeStr);
    if (isNaN(d.getTime())) return null;
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// Helper to format date for MySQL (KEEPS LOCAL DATE)
const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
};


// Helper to get value or null
const getValueOrNull = (value) => value !== undefined && value !== null && value !== '' ? value : null;

// Helper to get default room status ID for 'occupied'
// const getOccupiedStatusId = async () => {
//     const [statuses] = await db.execute(
//         "SELECT room_status_id FROM room_status WHERE LOWER(status_name) = 'occupied' LIMIT 1"
//     );
//     if (statuses.length > 0) return statuses[0].room_status_id;
    
//     const [altStatuses] = await db.execute(
//         "SELECT room_status_id FROM room_status WHERE LOWER(status_name) IN ('occupied', 'booked', 'in_house') LIMIT 1"
//     );
//     return altStatuses.length > 0 ? altStatuses[0].room_status_id : 2;
// };

// Helper to get default room status ID for 'available'
const getAvailableStatusId = async () => {
    const [statuses] = await db.execute(
        "SELECT room_status_id FROM room_status WHERE LOWER(status_name) = 'available' LIMIT 1"
    );
    if (statuses.length > 0) return statuses[0].room_status_id;
    
    const [altStatuses] = await db.execute(
        "SELECT room_status_id FROM room_status WHERE LOWER(status_name) IN ('available', 'vacant', 'free') LIMIT 1"
    );
    return altStatuses.length > 0 ? altStatuses[0].room_status_id : 1;
};

// ----------------------------------------------------------------------
// GET /checkins – list checkins
// ----------------------------------------------------------------------
exports.getCheckins = async (req, res) => {
    try {
        let hotelId = req.query.hotelid || req.query.mst_hotelid;
        if (!hotelId) hotelId = getCurrentUserHotelId(req);
        if (!hotelId) {
            return res.status(400).json({ success: false, message: 'Hotel ID not found' });
        }

        const { q, status } = req.query;

        let sql = `
      SELECT
    -- Checkin Master
    cm.checkin_id,
    cm.reg_no,
    cm.booking,
    cm.plan_name,
    cm.checkin_datetime,
    cm.checkout_datetime,
    cm.hotelid,
    cm.checkout_id,

    -- Room Details
    cdm.detail_id,
    cdm.guest_id,
    cdm.room_id,
    cdm.room_number,
    cdm.room_category_name,
    cdm.converted_category_name,
    cdm.room_tariff,
    cdm.discount_percent,
    cdm.cgst_percent,
    cdm.sgst_percent,
    cdm.igst_percent,
    cdm.cess_percent AS detail_cess_percent,
    cdm.service_charge AS detail_service_charge,
    cdm.is_settle,
    cdm.parent_detail_id,

    cdm.checkin_datetime AS detail_checkin_datetime,
    cdm.checkout_datetime AS detail_checkout_datetime,

    cdm.adults AS detail_adults,
    cdm.pax AS detail_pax,
    cdm.ex_pax AS detail_ex_pax,
    cdm.child_unpaid AS detail_child_unpaid,
    cdm.driver AS detail_driver,

    cdm.ex_pax_charge AS detail_ex_pax_charge,
    cdm.child_paid_amount AS detail_child_paid_amount,
    cdm.driver_charge AS detail_driver_charge,

    -- Guest
    gm.name AS guest_name,
    gm.mobile,
    gm.address,
    gm.email,
    comp.company_name,

    -- Folio Summary
    COALESCE(cgfm.total_debit,0)  AS total_debit,
    COALESCE(cgfm.total_credit,0) AS total_credit,

    -- Room Charges Summary
    COALESCE(cgrc.total_amount,0) AS total_amount,
    COALESCE(cgrc.pax_count,0) AS pax_count,
    COALESCE(cgrc.pax_price,0) AS pax_price,
    COALESCE(cgrc.pax_tax,0) AS pax_tax,

    COALESCE(cgrc.ex_pax_count,0) AS ex_pax_count,
    COALESCE(cgrc.ex_pax_price,0) AS ex_pax_price,
    COALESCE(cgrc.ex_pax_tax,0) AS ex_pax_tax,

    COALESCE(cgrc.child_count,0) AS child_count,
    COALESCE(cgrc.child_price,0) AS child_price,
    COALESCE(cgrc.child_tax,0) AS child_tax,

    COALESCE(cgrc.driver_count,0) AS driver_count,
    COALESCE(cgrc.driver_price,0) AS driver_price,
    COALESCE(cgrc.driver_tax,0) AS driver_tax

FROM checkin_master cm

LEFT JOIN checkin_detail_master cdm
    ON cm.checkin_id = cdm.checkin_id
   AND cdm.is_settle = 0

LEFT JOIN guest_master gm
    ON gm.guest_id = cdm.guest_id

LEFT JOIN company_master comp
    ON comp.company_id = gm.company_id

-- Folio Aggregate
LEFT JOIN (
    SELECT
        checkin_id,
        room_id,
        SUM(debit_amount)  AS total_debit,
        SUM(credit_amount) AS total_credit
    FROM checkin_guest_folio_master
    GROUP BY checkin_id, room_id
) cgfm
ON cgfm.checkin_id = cdm.checkin_id
AND cgfm.room_id = cdm.room_id

-- Room Charges Aggregate
LEFT JOIN (
    SELECT
        checkin_id,
        room_id,

        SUM(total_amount) AS total_amount,

        SUM(pax_count) AS pax_count,
        SUM(pax_price) AS pax_price,
        SUM(pax_tax) AS pax_tax,

        SUM(ex_pax_count) AS ex_pax_count,
        SUM(ex_pax_price) AS ex_pax_price,
        SUM(ex_pax_tax) AS ex_pax_tax,

        SUM(child_count) AS child_count,
        SUM(child_price) AS child_price,
        SUM(child_tax) AS child_tax,

        SUM(driver_count) AS driver_count,
        SUM(driver_price) AS driver_price,
        SUM(driver_tax) AS driver_tax

    FROM checkin_guest_room_charges
    GROUP BY checkin_id, room_id
) cgrc
ON cgrc.checkin_id = cdm.checkin_id
AND cgrc.room_id = cdm.room_id

WHERE cm.hotelid = ?`;

        const params = [hotelId];

        // Build WHERE conditions
        let whereConditions = [];

        if (!status) {
            whereConditions.push(`cm.status = 'active'`);
        } else if (status === 'checked_out') {
            whereConditions.push(`cm.status = 'checked_out'`);
        } else if (status === 'all') {
            // Show all checkins including checked_out - no status filter needed
        } else {
            whereConditions.push(`cm.status = ?`);
            params.push(status);
        }

        if (q) {
            whereConditions.push(`(cm.guest_name LIKE ? OR cm.reg_no LIKE ? OR cm.mobile LIKE ?)`);
            const like = `%${q}%`;
            params.push(like, like, like);
        }

        // Add WHERE conditions if any
        if (whereConditions.length > 0) {
            sql += ` AND ${whereConditions.join(' AND ')}`;
        }

        // Add ORDER BY at the end
        sql += ` ORDER BY cm.checkin_id DESC, cdm.room_number`;

        const [checkins] = await db.execute(sql, params);

        const formattedCheckins = checkins.map(checkin => ({
            ...checkin,
            checkin_datetime: formatDate(checkin.checkin_datetime),
            checkout_datetime: formatDate(checkin.checkout_datetime),
            created_date: formatDate(checkin.created_date),
            updated_date: formatDate(checkin.updated_date)
        }));

        res.json({
            success: true,
            message: 'Checkins fetched successfully',
            data: formattedCheckins,
        });
    } catch (error) {
        console.error('Error fetching checkins:', error);
        res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
};

// ----------------------------------------------------------------------
// GET /checkins/:id – get single checkin by ID
// ----------------------------------------------------------------------
exports.getCheckin = async (req, res) => {
    try {
        const { id } = req.params;
        const checkinId = parseInt(id);

        if (isNaN(checkinId)) {
            return res.status(400).json({ success: false, message: 'Invalid checkin ID' });
        }

        let hotelId = req.query.hotelid || getCurrentUserHotelId(req);

        let sql = `
            SELECT 
                cm.checkin_id,
                cm.guest_id,
                cm.guest_name,
                cm.address,
                cm.mobile,
                cm.company_name,
                cm.emailed,
                cm.booking,
                cm.plan_name,
                cm.reg_no,
                cm.special_instruction,
                cm.message,
                cm.checkin_datetime,
                cm.checkout_datetime,
                cm.room_no,
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
                cm.hotelid,
                cm.id_type,
                cm.id_number,
                cm.department_id,
                cm.department_name,
                cm.status,
                cm.total_nights,
                cm.total_amount,
                cm.created_by_id,
                cm.created_date,
                cm.updated_by_id,
                cm.updated_date,
                cm.room_id,          -- ✅ new field added
                cm.is_settle,        -- ✅ new field added
                cm.checkout_id       -- ✅ new field added
            FROM checkin_master cm
            WHERE cm.checkin_id = ?
        `;

        const params = [checkinId];

        if (hotelId) {
            sql += ` AND cm.hotelid = ?`;
            params.push(hotelId);
        }

        const [checkins] = await db.execute(sql, params);

        if (checkins.length === 0) {
            return res.status(404).json({ success: false, message: 'Checkin not found' });
        }

        const formattedCheckin = {
            ...checkins[0],
            checkin_datetime: formatDate(checkins[0].checkin_datetime),
            checkout_datetime: formatDate(checkins[0].checkout_datetime),
            created_date: formatDate(checkins[0].created_date),
            updated_date: formatDate(checkins[0].updated_date)
        };

        res.json({
            success: true,
            message: 'Checkin fetched successfully',
            data: formattedCheckin,
        });
    } catch (error) {
        console.error('Error fetching checkin:', error);
        res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
};

// ----------------------------------------------------------------------
// GET /checkins/next-reg-number – get next registration number
// ----------------------------------------------------------------------
exports.getNextRegNumber = async (req, res) => {
    try {
        let hotelId = req.query.hotelid || getCurrentUserHotelId(req);
        if (!hotelId) {
            return res.status(400).json({ success: false, message: 'Hotel ID not found' });
        }

        // Fetch current reg_no from ldg_bill_settings using only hotelid
        // If multiple outlets exist for same hotel, we take the first row (or you can use MAX(reg_no) depending on business rule)
        const [rows] = await db.execute(
            `SELECT reg_no FROM ldg_bill_settings WHERE hotelid = ? LIMIT 1`,
            [hotelId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: `No ldg_bill_settings record found for hotelid=${hotelId}` 
            });
        }

        const currentRegNo = Number(rows[0].reg_no) || 0;
        const nextRegNo = currentRegNo + 1;
        const formattedRegNo = `REG${String(nextRegNo).padStart(4, '0')}`;

        res.json({
            success: true,
            data: { reg_no: formattedRegNo },
        });
    } catch (error) {
        console.error('Error generating preview reg number:', error);
        res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
};

// ----------------------------------------------------------------------
// GET /checkins/details/:checkinId – get details by checkin ID
// ----------------------------------------------------------------------
exports.getDetailsByCheckinId = async (req, res) => {
    try {
        const { checkinId } = req.params;
        const id = parseInt(checkinId);

        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: 'Invalid checkin ID' });
        }

        const [details] = await db.execute(`
            SELECT 
                detail_id,
                checkin_id,
                guest_id,
                room_id,
                room_number,
                room_category_id,
                room_category_name,
                converted_category_id,
                converted_category_name,
                checkin_datetime,
                checkout_datetime,
                no_of_days,
                adults,
                pax,
                ex_pax,
                child_unpaid,
                driver,
                room_tariff,
                ex_pax_charge,
                child_paid_amount,
                driver_charge,
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
                service_charge,
                service_charge_amount,
                parent_detail_id,
                is_checkout,
                merged,
                tax
            FROM checkin_detail_master
            WHERE checkin_id = ?
            ORDER BY detail_id ASC
        `, [id]);

        const formattedDetails = details.map(detail => ({
            ...detail,
            checkin_datetime: formatDate(detail.checkin_datetime),
            checkout_datetime: formatDate(detail.checkout_datetime)
        }));

        res.json({
            success: true,
            message: 'Details fetched successfully',
            data: formattedDetails,
        });
    } catch (error) {
        console.error('Error fetching details:', error);
        res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
};

// ----------------------------------------------------------------------
// GET /checkins/today-checkouts – get today's checkouts
// ----------------------------------------------------------------------
exports.getTodayCheckouts = async (req, res) => {
    try {
        let hotelId = req.query.hotelid || getCurrentUserHotelId(req);
        if (!hotelId) {
            return res.status(400).json({ success: false, message: 'Hotel ID not found' });
        }

        const today = new Date().toISOString().slice(0, 10);

        const [checkouts] = await db.execute(`
            SELECT 
                cm.checkin_id,
                cm.guest_name,
                cm.reg_no,
                cm.room_no,
                cm.booking,
                cm.plan_name,
                cm.adults,
                cm.pax,
                cm.ex_pax,
                cm.child_paid,
                cm.child_unpaid,
                (cm.child_paid + cm.child_unpaid) as child_count,
                cm.driver,
                cm.checkin_datetime,
                cm.checkout_datetime,
                cm.total_nights,
                cm.total_amount,
                cm.folio_total,
                cm.status,
                cm.converted_category,
                rc.category_name as room_category
            FROM checkin_master cm
            LEFT JOIN room_category rc ON cm.category_id = rc.room_category_id
            WHERE cm.hotelid = ? 
                AND DATE(cm.checkout_datetime) = ?
                AND cm.status = 'active'
            ORDER BY cm.checkout_datetime ASC
        `, [hotelId, today]);

        res.json({
            success: true,
            message: 'Today\'s checkouts fetched successfully',
            data: checkouts,
        });
    } catch (error) {
        console.error('Error fetching today\'s checkouts:', error);
        res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
};

// ----------------------------------------------------------------------
// POST /checkins – create a new checkin
// ----------------------------------------------------------------------



exports.addCheckin = async (req, res) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const now = new Date();
    const body = req.body;
    const userId = body.created_by_id || 1;

    // ✅ ADD DEBUG LOGGING
    console.log('📥 ===== ADD CHECKIN REQUEST =====');
    console.log('📥 Body keys:', Object.keys(body));
    console.log('📥 checkin_datetime:', body.checkin_datetime);
    console.log('📥 checkout_datetime:', body.checkout_datetime);
    console.log('📥 Details count:', body.details?.length || 0);
    console.log('📥 First detail:', body.details?.[0] ? JSON.stringify(body.details[0], null, 2) : 'No details');
    console.log('📥 ================================');

    const { hotelid } = body;
    if (!hotelid) {
      throw new Error("hotelid is required");
    }

    // ========== FETCH & UPDATE REG_NO FROM LDG_BILL_SETTINGS ==========
    const [settingsRows] = await connection.execute(
      `SELECT ldgsettingid, reg_no
       FROM ldg_bill_settings
       WHERE hotelid = ? 
       FOR UPDATE`,
      [hotelid]
    );

    if (settingsRows.length === 0) {
      throw new Error(`No ldg_bill_settings record found for hotelid=${hotelid}`);
    }

    const currentRegNo = Number(settingsRows[0].reg_no) || 0;
    const nextRegNo = currentRegNo + 1;
    const formattedRegNo = `REG${String(nextRegNo).padStart(4, "0")}`;
    body.reg_no = formattedRegNo;

    // ========== 1. CHECKIN MASTER ==========
    const masterAllowed = [
      'guest_id', 'guest_name', 'address', 'mobile', 'company_name', 'emailed',
      'booking', 'plan_name', 'reg_no', 'special_instruction', 'message',
      'checkin_datetime', 'checkout_datetime', 'room_no', 'room_id',
      'category_id', 'converted_category',
      'adults', 'pax', 'pax_charges', 'ex_pax', 'ex_pax_charge',
      'child_paid', 'child_unpaid', 'child_charge', 'driver', 'driver_charge',
      'hotelid', 'outletid', 'userid', 'id_type', 'id_number',
      'department_id', 'department_name', 'total_nights', 'total_amount'
    ];
    const masterCols = [], masterVals = [];
    masterAllowed.forEach(f => {
      if (body[f] !== undefined) {
        masterCols.push(f);
        let val = body[f];
        if (f === 'driver' && typeof val === 'number') val = String(val);
        if (['checkin_datetime', 'checkout_datetime'].includes(f)) {
          val = formatDateTime(val);
        }
        masterVals.push(val);
      }
    });
    masterCols.push('status', 'created_by_id', 'created_date', 'updated_by_id', 'updated_date');
    masterVals.push(body.status || 'active', userId, now, userId, now);

    const masterPlaceholders = masterCols.map(() => '?').join(',');
    const [masterRes] = await connection.execute(
      `INSERT INTO checkin_master (${masterCols.join(',')}) VALUES (${masterPlaceholders})`,
      masterVals
    );
    const checkinId = masterRes.insertId;

    // ========== UPDATE LDG_BILL_SETTINGS WITH NUMERIC VALUE ==========
    await connection.execute(
      `UPDATE ldg_bill_settings
       SET reg_no = ?
       WHERE hotelid = ?`,
      [nextRegNo, hotelid]
    );

  // ========== 2. CHECKIN DETAIL MASTER + UPDATE ROOM STATUS ==========
let firstDetailId = null;
if (body.details && body.details.length) {
  // Get master datetime values
  const masterCheckin = body.checkin_datetime || now;
  const masterCheckout = body.checkout_datetime || null;
  
  for (const d of body.details) {
    const detailAllowed = [
      'guest_id',
      'room_id', 'room_number', 'room_category_id', 'room_category_name',
      'converted_category_id', 'converted_category_name', 'no_of_days',
      'adults', 'pax', 'ex_pax', 'child_unpaid', 'driver', 'room_tariff',
      'ex_pax_charge', 'child_paid_amount', 'driver_charge', 'discount_percent',
      'discount_amount', 'cgst_percent', 'cgst_amount', 'sgst_percent',
      'sgst_amount', 'igst_percent', 'igst_amount', 'cess_percent',
      'cess_amount', 'service_charge', 'service_charge_amount', 'tax'
    ];
    
    // ✅ Add checkin_datetime and checkout_datetime to columns
    const detailCols = [
      'checkin_id', 'hotelid', 'created_date', 'updated_date',
      'created_by_id', 'updated_by_id', 'is_settle',
      'checkin_datetime', 'checkout_datetime'  // ✅ ADD THESE
    ];
    
    // ensure guest_id is inserted into checkin_detail_master
    if (body.guest_id !== undefined && d.guest_id === undefined) {
      d.guest_id = body.guest_id;
    }

    // ✅ Use master datetimes for all detail records
    const detailVals = [
      checkinId, 
      body.hotelid, 
      now, 
      now, 
      userId, 
      userId, 
      0,
      formatDateTime(masterCheckin),   // ✅ checkin_datetime
      formatDateTime(masterCheckout)   // ✅ checkout_datetime
    ];
    
    detailAllowed.forEach(f => {
      if (d[f] !== undefined) {
        detailCols.push(f);
        detailVals.push(d[f]);
      }
    });
    
    const [detailRes] = await connection.execute(
      `INSERT INTO checkin_detail_master (${detailCols.join(',')}) VALUES (${detailCols.map(()=>'?').join(',')})`,
      detailVals
    );
    if (firstDetailId === null) firstDetailId = detailRes.insertId;

    // UPDATE ROOM STATUS TO OCCUPIED
    if (d.room_id) {
      await connection.execute(
        `UPDATE room_master 
         SET room_status_id = 2
         WHERE room_id = ?`,
        [d.room_id]
      );
    }
  }
}

    // ========== 3. GUEST ROOM CHARGES ==========
    if (body.room_charges && body.room_charges.length) {
      for (const rc of body.room_charges) {
        const chargesAllowed = [
          'guest_id', 'room_id', 'category_id', 'pax_count', 'pax_price',
          'pax_tax', 'ex_pax_count', 'ex_pax_price', 'ex_pax_tax', 'ex_pax_tax_percent',
          'ex_pax_total', 'child_count', 'child_price', 'child_tax', 'child_tax_percent',
          'child_total', 'driver_count', 'driver_price', 'driver_tax', 'driver_tax_percent',
          'driver_total', 'total_amount', 'checkin_datetime', 'checkout_datetime'
        ];
        const chargesCols = ['checkin_id', 'created_at', 'updated_at'];
        const chargesVals = [checkinId, now, now];
        chargesAllowed.forEach(f => {
          if (rc[f] !== undefined) {
            chargesCols.push(f);
            let val = rc[f];
            if (['checkin_datetime', 'checkout_datetime'].includes(f)) {
              val = formatDateTime(val);
            }
            chargesVals.push(val);
          }
        });
        await connection.execute(
          `INSERT INTO checkin_guest_room_charges (${chargesCols.join(',')}) VALUES (${chargesCols.map(()=>'?').join(',')})`,
          chargesVals
        );
      }
    }

    // ========== 4. FOLIO ENTRIES ==========
   if (body.folio_entries && body.folio_entries.length) {
  for (const fe of body.folio_entries) {
    const folioCols = [
      'checkin_id',
      'hotel_id',
      'detail_id',
      'room_id',               // Added
      'transaction_type',
      'transaction_datetime',
      'description',
      'debit_amount',
      'credit_amount',
      'reference_number',
      'payment_method',
      'created_by_id',
      'created_date'
    ];

    const folioVals = [
      checkinId,
      body.hotelid,
      firstDetailId,
      fe.room_id || body.room_id || null,   // Added
      fe.transaction_type || 'Room Charges',
      formatDateTime(fe.transaction_datetime) || now,
      fe.description || '',
      fe.debit_amount || 0,
      fe.credit_amount || 0,
      fe.reference_number || `CHK-${checkinId}`,
      fe.payment_method || null,
      userId,
      now
    ];

    await connection.execute(
      `INSERT INTO checkin_guest_folio_master (${folioCols.join(',')})
       VALUES (${folioCols.map(() => '?').join(',')})`,
      folioVals
    );
  }
}

    await connection.commit();

    const [masterRow] = await connection.execute(
      'SELECT * FROM checkin_master WHERE checkin_id = ?',
      [checkinId]
    );
    res.status(201).json({
      success: true,
      message: 'Check-in created',
      data: masterRow[0]
    });

  } catch (err) {
    if (connection) await connection.rollback();
    console.error('addCheckin error:', err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    if (connection) connection.release();
  }
};
// ----------------------------------------------------------------------
// PUT /checkins/:id – update checkin
// ----------------------------------------------------------------------
exports.updateCheckin = async (req, res) => {
    try {
        const { id } = req.params;
        const checkinId = parseInt(id);
        const userId = getCurrentUserId(req);
        const now = new Date();

        if (isNaN(checkinId)) {
            return res.status(400).json({ success: false, message: 'Invalid checkin ID' });
        }

        const {
            guest_name,
            address,
            mobile,
            company_name,
            emailed,
            booking,
            plan_name,
            special_instruction,
            message,
            checkin_datetime,
            checkout_datetime,
            room_no,
            category_id,
            converted_category,
            adults,
            pax,
            pax_charges,
            ex_pax,
            ex_pax_charge,
            child_paid,
            child_unpaid,
            child_charge,
            driver,
            driver_charge,
            id_type,
            id_number,
            department_id,
            department_name,
            status,
            total_nights,
            total_amount,
            room_id,          // ✅ new field added
            is_settle,        // ✅ new field added
            checkout_id       // ✅ new field added
        } = req.body;

        let hotelId = req.body.hotelid || getCurrentUserHotelId(req);

        const updates = [];
        const params = [];

        if (guest_name !== undefined) { updates.push('guest_name = ?'); params.push(guest_name); }
        if (address !== undefined) { updates.push('address = ?'); params.push(address); }
        if (mobile !== undefined) { updates.push('mobile = ?'); params.push(mobile); }
        if (company_name !== undefined) { updates.push('company_name = ?'); params.push(company_name); }
        if (emailed !== undefined) { updates.push('emailed = ?'); params.push(emailed); }
        if (booking !== undefined) { updates.push('booking = ?'); params.push(booking); }
        if (plan_name !== undefined) { updates.push('plan_name = ?'); params.push(plan_name); }
        if (special_instruction !== undefined) { updates.push('special_instruction = ?'); params.push(special_instruction); }
        if (message !== undefined) { updates.push('message = ?'); params.push(message); }
        if (checkin_datetime !== undefined) { updates.push('checkin_datetime = ?'); params.push(formatDateTime(checkin_datetime)); }
        if (checkout_datetime !== undefined) { updates.push('checkout_datetime = ?'); params.push(formatDateTime(checkout_datetime)); }
        if (room_no !== undefined) { updates.push('room_no = ?'); params.push(room_no); }
        if (category_id !== undefined) { updates.push('category_id = ?'); params.push(category_id); }
        if (converted_category !== undefined) { updates.push('converted_category = ?'); params.push(converted_category); }
        if (adults !== undefined) { updates.push('adults = ?'); params.push(adults); }
        if (pax !== undefined) { updates.push('pax = ?'); params.push(pax); }
        if (pax_charges !== undefined) { updates.push('pax_charges = ?'); params.push(pax_charges); }
        if (ex_pax !== undefined) { updates.push('ex_pax = ?'); params.push(ex_pax); }
        if (ex_pax_charge !== undefined) { updates.push('ex_pax_charge = ?'); params.push(ex_pax_charge); }
        if (child_paid !== undefined) { updates.push('child_paid = ?'); params.push(child_paid); }
        if (child_unpaid !== undefined) { updates.push('child_unpaid = ?'); params.push(child_unpaid); }
        if (child_charge !== undefined) { updates.push('child_charge = ?'); params.push(child_charge); }
        if (driver !== undefined) { updates.push('driver = ?'); params.push(driver); }
        if (driver_charge !== undefined) { updates.push('driver_charge = ?'); params.push(driver_charge); }
        if (id_type !== undefined) { updates.push('id_type = ?'); params.push(id_type); }
        if (id_number !== undefined) { updates.push('id_number = ?'); params.push(id_number); }
        if (department_id !== undefined) { updates.push('department_id = ?'); params.push(department_id); }
        if (department_name !== undefined) { updates.push('department_name = ?'); params.push(department_name); }
        if (status !== undefined) { updates.push('status = ?'); params.push(status); }
        if (total_nights !== undefined) { updates.push('total_nights = ?'); params.push(total_nights); }
        if (total_amount !== undefined) { updates.push('total_amount = ?'); params.push(total_amount); }
        if (room_id !== undefined) { updates.push('room_id = ?'); params.push(room_id); }
        if (is_settle !== undefined) { updates.push('is_settle = ?'); params.push(is_settle); }
        if (checkout_id !== undefined) { updates.push('checkout_id = ?'); params.push(checkout_id); }

        updates.push('updated_by_id = ?');
        params.push(userId);
        updates.push('updated_date = ?');
        params.push(now);
        params.push(checkinId);

        if (hotelId) {
            params.push(hotelId);
            await db.execute(
                `UPDATE checkin_master SET ${updates.join(', ')} WHERE checkin_id = ? AND hotelid = ?`,
                params
            );
        } else {
            await db.execute(
                `UPDATE checkin_master SET ${updates.join(', ')} WHERE checkin_id = ?`,
                params
            );
        }

        const [updatedCheckin] = await db.execute(`
            SELECT 
                checkin_id, guest_id, guest_name, address, mobile, company_name, 
                emailed, booking, plan_name, reg_no, special_instruction, message,
                checkin_datetime, checkout_datetime, room_no, category_id, 
                converted_category, adults, pax, pax_charges, ex_pax, ex_pax_charge,
                child_paid, child_unpaid, child_charge, driver, driver_charge,
                hotelid, id_type, id_number, department_id, department_name,
                status, total_nights, total_amount, created_by_id, created_date,
                updated_by_id, updated_date,
                room_id, is_settle, checkout_id
            FROM checkin_master 
            WHERE checkin_id = ?
        `, [checkinId]);

        if (updatedCheckin.length === 0) {
            return res.status(404).json({ success: false, message: 'Checkin not found' });
        }

        const formattedCheckin = {
            ...updatedCheckin[0],
            checkin_datetime: formatDate(updatedCheckin[0].checkin_datetime),
            checkout_datetime: formatDate(updatedCheckin[0].checkout_datetime),
            created_date: formatDate(updatedCheckin[0].created_date),
            updated_date: formatDate(updatedCheckin[0].updated_date)
        };

        res.json({
            success: true,
            message: 'Checkin updated successfully',
            data: formattedCheckin,
        });
    } catch (error) {
        console.error('Error updating checkin:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update checkin', 
            error: error.message 
        });
    }
};

// ----------------------------------------------------------------------
// PATCH /checkins/:id/partial – PARTIAL UPDATE FOR DAY EXTENSIONS
// CRITICAL: This method accumulates total_amount for day extensions
// ----------------------------------------------------------------------
exports.updatePartialCheckin = async (req, res) => {
    try {
        const { id } = req.params;
        const checkinId = parseInt(id);
        const userId = getCurrentUserId(req);
        const now = new Date();

        if (isNaN(checkinId)) {
            return res.status(400).json({ success: false, message: 'Invalid checkin ID' });
        }

        const { total_amount, checkout_datetime, total_nights, status, additional_amount } = req.body;

        // IMPORTANT: Always fetch current values when using additional_amount
        let currentStoredAmount = 0;
        let currentStoredNights = 0;
        
        // Fetch current values if we need to accumulate or if no total_amount provided
        if (additional_amount !== undefined || total_amount === undefined) {
            const [rows] = await db.execute(
                'SELECT total_amount, total_nights FROM checkin_master WHERE checkin_id = ?',
                [checkinId]
            );
            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Checkin not found' });
            }
            currentStoredAmount = Number(rows[0].total_amount) || 0;
            currentStoredNights = Number(rows[0].total_nights) || 0;
            
            console.log(`[DEBUG] Current checkin ${checkinId}: total_amount=${currentStoredAmount}, total_nights=${currentStoredNights}`);
        }

        const updates = [];
        const params = [];

        // CRITICAL FIX: Handle day extension correctly by accumulating
        if (total_amount !== undefined) {
            updates.push('total_amount = ?');
            params.push(Number(total_amount));
            console.log(`[DEBUG] Setting total_amount directly to ${total_amount}`);
        } else if (additional_amount !== undefined) {
            const newTotal = currentStoredAmount + Number(additional_amount);
            updates.push('total_amount = ?');
            params.push(newTotal);
            console.log(`[DEBUG] DAY EXTENSION: Old total=${currentStoredAmount}, Added=${additional_amount}, NEW CUMULATIVE TOTAL=${newTotal}`);
        }
        
        if (checkout_datetime !== undefined) {
            updates.push('checkout_datetime = ?');
            params.push(formatDateTime(checkout_datetime));
            console.log(`[DEBUG] Updating checkout_datetime to ${checkout_datetime}`);
        }
        
        if (total_nights !== undefined) {
            updates.push('total_nights = ?');
            params.push(total_nights);
            console.log(`[DEBUG] Setting total_nights to ${total_nights}`);
        } else if (additional_amount !== undefined && total_nights === undefined) {
            updates.push('total_nights = ?');
            params.push(currentStoredNights + 1);
            console.log(`[DEBUG] Auto-incrementing total_nights from ${currentStoredNights} to ${currentStoredNights + 1}`);
        }
        
        if (status !== undefined) {
            updates.push('status = ?');
            params.push(status);
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        updates.push('updated_by_id = ?');
        params.push(userId);
        updates.push('updated_date = ?');
        params.push(now);
        params.push(checkinId);

        const [updateResult] = await db.execute(
            `UPDATE checkin_master SET ${updates.join(', ')} WHERE checkin_id = ?`,
            params
        );

        console.log(`[DEBUG] Update affected rows: ${updateResult.affectedRows}`);

        const [updatedCheckin] = await db.execute(`
            SELECT 
                checkin_id, guest_id, guest_name, address, mobile, company_name, 
                emailed, booking, plan_name, reg_no, special_instruction, message,
                checkin_datetime, checkout_datetime, room_no, category_id, 
                converted_category, adults, pax, pax_charges, ex_pax, ex_pax_charge,
                child_paid, child_unpaid, child_charge, driver, driver_charge,
                hotelid, id_type, id_number, department_id, department_name,
                status, total_nights, total_amount, created_by_id, created_date,
                updated_by_id, updated_date,
                room_id, is_settle, checkout_id
            FROM checkin_master 
            WHERE checkin_id = ?
        `, [checkinId]);

        if (updatedCheckin.length === 0) {
            return res.status(404).json({ success: false, message: 'Checkin not found' });
        }

        console.log(`[DEBUG] FINAL VALUES: total_amount=${updatedCheckin[0].total_amount}, total_nights=${updatedCheckin[0].total_nights}`);

        const formattedCheckin = {
            ...updatedCheckin[0],
            checkin_datetime: formatDate(updatedCheckin[0].checkin_datetime),
            checkout_datetime: formatDate(updatedCheckin[0].checkout_datetime),
            created_date: formatDate(updatedCheckin[0].created_date),
            updated_date: formatDate(updatedCheckin[0].updated_date)
        };

        res.json({
            success: true,
            message: 'Checkin updated successfully',
            data: formattedCheckin,
        });
    } catch (error) {
        console.error('Error updating checkin:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to update checkin', 
            error: error.message 
        });
    }
};

// ----------------------------------------------------------------------
// POST /checkins/:id/extend – EXTEND STAY (Alternative method)
// ----------------------------------------------------------------------
exports.extendStay = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const checkinId = parseInt(id);
        const userId = getCurrentUserId(req);
        const now = new Date();

        if (isNaN(checkinId)) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Invalid checkin ID' });
        }

        const {
            additionalDays,
            newCheckoutDatetime,
            additionalAmount,
            newTotalNights,
            newTotalAmount,
            roomId,
            detailId
        } = req.body;

        if (!additionalDays || !newCheckoutDatetime) {
            await connection.rollback();
            return res.status(400).json({ 
                success: false, 
                message: 'Additional days and new checkout datetime are required' 
            });
        }

        const [checkins] = await connection.execute(
            'SELECT * FROM checkin_master WHERE checkin_id = ?',
            [checkinId]
        );

        if (checkins.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Checkin not found' });
        }

        const currentCheckin = checkins[0];
        console.log(`[EXTEND] Current checkin ${checkinId}: total_amount=${currentCheckin.total_amount}, total_nights=${currentCheckin.total_nights}`);

        if (detailId) {
            await connection.execute(`
                UPDATE checkin_detail_master 
                SET is_checkout = 0, merged = 1, updated_by_id = ?, updated_date = ?
                WHERE detail_id = ? AND checkin_id = ?
            `, [userId, now, detailId, checkinId]);
            console.log(`[EXTEND] Marked detail ${detailId} as checked out`);
        }

        const finalTotalNights = newTotalNights ?? (currentCheckin.total_nights + additionalDays);
        const currentStoredTotal = Number(currentCheckin.total_amount) || 0;
        
        let finalTotalAmount;
        if (newTotalAmount !== undefined && newTotalAmount !== null) {
            finalTotalAmount = Number(newTotalAmount);
            console.log(`[EXTEND] Using provided cumulative total: ${finalTotalAmount}`);
        } else {
            finalTotalAmount = currentStoredTotal + Number(additionalAmount || 0);
            console.log(`[EXTEND] Accumulating: ${currentStoredTotal} + ${additionalAmount} = ${finalTotalAmount}`);
        }

        await connection.execute(`
            UPDATE checkin_master 
            SET checkout_datetime = ?, 
                total_nights = ?, 
                total_amount = ?,
                updated_by_id = ?, 
                updated_date = ?
            WHERE checkin_id = ?
        `, [
            formatDateTime(newCheckoutDatetime),
            finalTotalNights,
            finalTotalAmount,
            userId,
            now,
            checkinId
        ]);

        if (roomId) {
            const occupiedStatusId = await getOccupiedStatusId();
            await connection.execute(`
                UPDATE room_master 
                SET room_status_id = ?, updated_by_id = ?, updated_date = ?
                WHERE room_id = ? AND hotelid = ?
            `, [occupiedStatusId, userId, now, roomId, currentCheckin.hotelid]);
            console.log(`[EXTEND] Updated room ${roomId} status to occupied`);
        }

        await connection.commit();

        const [updatedCheckin] = await connection.execute(`
            SELECT 
                checkin_id, guest_id, guest_name, address, mobile, company_name, 
                emailed, booking, plan_name, reg_no, special_instruction, message,
                checkin_datetime, checkout_datetime, room_no, category_id, 
                converted_category, adults, pax, pax_charges, ex_pax, ex_pax_charge,
                child_paid, child_unpaid, child_charge, driver, driver_charge,
                hotelid, id_type, id_number, department_id, department_name,
                status, total_nights, total_amount, created_by_id, created_date,
                updated_by_id, updated_date,
                room_id, is_settle, checkout_id
            FROM checkin_master 
            WHERE checkin_id = ?
        `, [checkinId]);

        console.log(`[EXTEND] FINAL: total_amount=${updatedCheckin[0].total_amount}, total_nights=${updatedCheckin[0].total_nights}`);

        const formattedCheckin = {
            ...updatedCheckin[0],
            checkin_datetime: formatDate(updatedCheckin[0].checkin_datetime),
            checkout_datetime: formatDate(updatedCheckin[0].checkout_datetime),
            created_date: formatDate(updatedCheckin[0].created_date),
            updated_date: formatDate(updatedCheckin[0].updated_date)
        };

        res.json({
            success: true,
            message: 'Stay extended successfully',
            data: formattedCheckin,
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error extending stay:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to extend stay', 
            error: error.message 
        });
    } finally {
        connection.release();
    }
};

// ----------------------------------------------------------------------
// GET /checkins/at-glance – room-wise at a glance data
// ----------------------------------------------------------------------
exports.getAtGlance = async (req, res) => {
    try {
        let hotelId = req.query.hotelid || getCurrentUserHotelId(req);
        if (!hotelId) {
            return res.status(400).json({ success: false, message: 'Hotel ID not found' });
        }

        const sql = `
         SELECT
    -- Room Master
    rm.room_id,
    rm.room_no,
    rs.status_name AS status,
        rs.status_color,

    fm.floor_name as floorNo,
    rm.room_status_id,

    -- Checkin Master
    cm.checkin_id,
    cm.reg_no,
    cm.booking,
    cm.plan_name,
    cm.checkin_datetime,
    cm.checkout_datetime,
    cm.checkout_id,

    -- Checkin Detail
    cdm.detail_id,
    cdm.guest_id,
    cdm.room_number,
    cdm.room_category_name AS roomCategory,
    cdm.converted_category_name AS convertedCategory,
    cdm.room_number AS occupied_room_number,


    cdm.room_tariff AS totalAmt,
    cdm.room_tariff AS total_amount,
    cdm.adults,
    cdm.ex_pax AS ex_pax,
    cdm.child_unpaid AS child_unpaid,
    cdm.child_paid_amount AS child_paid,
    cdm.driver AS driver,
    cdm.pax AS pax,



    cdm.ex_pax_charge,
    cdm.child_paid_amount,
    cdm.driver_charge,

    cdm.discount_percent as discountPercent,
    cdm.cgst_percent,
    cdm.sgst_percent,
    cdm.igst_percent,
    cdm.service_charge,

    -- Total Room Amount
    (
        IFNULL(cdm.room_tariff, 0)
        + IFNULL(cdm.ex_pax_charge, 0)
        + IFNULL(cdm.child_paid_amount, 0)
        + IFNULL(cdm.driver_charge, 0)
    ) AS total_room_amount,

    -- Guest Details
    gm.name AS guest_name,
    gm.mobile,
    gm.address,
    gm.email,

    -- Company
    comp.company_name

FROM room_master rm

LEFT JOIN checkin_detail_master cdm
       ON rm.room_id = cdm.room_id
      AND cdm.is_settle = 0

LEFT JOIN checkin_master cm
       ON cm.checkin_id = cdm.checkin_id
      AND cm.hotelid = rm.hotelid

LEFT JOIN guest_master gm
       ON gm.guest_id = cdm.guest_id

LEFT JOIN company_master comp
       ON comp.company_id = gm.company_id
       left join room_status rs on rs.room_status_id =rm.room_status_id
       left join floormaster fm on fm.floor_id = rm.floor_id

WHERE rm.hotelid = ?

ORDER BY CAST(rm.room_no AS UNSIGNED), rm.room_no;
        `;

        const [rows] = await db.execute(sql, [hotelId]);

        const formatted = rows.map((r) => ({
            ...r,
            checkin_datetime: formatDate(r.checkin_datetime),
            checkout_datetime: formatDate(r.checkout_datetime),
            totalAmt: Number(r.total_room_amount ?? 0) || 0,
            // For UI convenience
            child: (Number(r.child_unpaid ?? 0) + Number(r.child_paid_amount ?? 0)) || 0
        }));

        res.json({ success: true, data: formatted });
    } catch (error) {
        console.error('Error fetching at-glance:', error);
        res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
};


// ----------------------------------------------------------------------
// POST /checkins/:checkinId/extend-day – EXTEND DAY SINGLE API
// FIXED: Proper cumulative calculation for day extensions
// ----------------------------------------------------------------------
exports.extendDay = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { checkinId } = req.params;
        const id = parseInt(checkinId);
        const userId = getCurrentUserId(req);
        const now = new Date();

        if (isNaN(id)) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Invalid checkin ID' });
        }

        const { roomId, extensionDays } = req.body;

        if (!roomId || !extensionDays || extensionDays < 1) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: 'Room ID and extension days (>= 1) are required'
            });
        }

        // ========== 1. FETCH CURRENT CHECKIN DATA ==========
        const [checkinRows] = await connection.execute(
            `SELECT 
                cm.checkin_id,
                cm.guest_id,
                cm.guest_name,
                cm.checkin_datetime,
                cm.checkout_datetime,
                cm.total_nights,
                cm.total_amount,
                cm.hotelid,
                cm.reg_no,
                cm.booking,
                cm.plan_name,
                cm.adults,
                cm.pax,
                cm.ex_pax,
                cm.child_paid,
                cm.child_unpaid,
                cm.driver,
                cm.pax_charges,
                cm.ex_pax_charge,
                cm.child_charge,
                cm.driver_charge,
                cm.converted_category
            FROM checkin_master cm
            WHERE cm.checkin_id = ? AND cm.status = 'active'
            FOR UPDATE`,
            [id]
        );

        if (checkinRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Active checkin not found' });
        }

        const checkin = checkinRows[0];

        // ========== 2. FETCH CURRENT DETAIL FOR THE ROOM ==========
        const [detailRows] = await connection.execute(
            `SELECT 
                cdm.detail_id,
                cdm.room_id,
                cdm.room_number,
                cdm.room_category_id,
                cdm.room_category_name,
                cdm.converted_category_id,
                cdm.converted_category_name,
                cdm.room_tariff,
                cdm.discount_percent,
                cdm.discount_amount,
                cdm.cgst_percent,
                cdm.cgst_amount,
                cdm.sgst_percent,
                cdm.sgst_amount,
                cdm.igst_percent,
                cdm.igst_amount,
                cdm.cess_percent,
                cdm.cess_amount,
                cdm.service_charge,
                cdm.service_charge_amount,
                cdm.ex_pax_charge AS detail_ex_pax_charge,
                cdm.child_paid_amount AS detail_child_paid_amount,
                cdm.driver_charge AS detail_driver_charge,
                cdm.adults AS detail_adults,
                cdm.pax AS detail_pax,
                cdm.ex_pax AS detail_ex_pax,
                cdm.child_unpaid AS detail_child_unpaid,
                cdm.driver AS detail_driver,
                cdm.tax AS detail_tax,
                cdm.checkin_datetime AS detail_checkin_datetime,
                cdm.checkout_datetime AS detail_checkout_datetime,
                cdm.is_checkout,
                cdm.parent_detail_id,
                cdm.no_of_days AS detail_no_of_days
            FROM checkin_detail_master cdm
            WHERE cdm.checkin_id = ? AND cdm.room_id = ? AND cdm.is_checkout = 0
            ORDER BY cdm.detail_id DESC
            LIMIT 1
            FOR UPDATE`,
            [id, roomId]
        );

        if (detailRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                message: 'Active detail record not found for this room'
            });
        }

        const detail = detailRows[0];

        // ========== 3. FETCH LATEST FOLIO ROW FOR THE CHECKIN ==========
        // We only read this to carry forward payment_method / reference_number
        // onto the NEW folio row we insert in step 11. We do not update this row.
        const [folioRows] = await connection.execute(
            `SELECT
                cgfm.folio_id,
                cgfm.payment_method,
                cgfm.reference_number
            FROM checkin_guest_folio_master cgfm
            WHERE cgfm.checkin_id = ?
            ORDER BY cgfm.folio_id DESC
            LIMIT 1
            FOR UPDATE`,
            [id]
        );

        const latestFolioPaymentMethod = folioRows.length > 0 ? folioRows[0].payment_method : null;
        const latestFolioReferenceNumber = folioRows.length > 0 ? folioRows[0].reference_number : `CHK-${id}`;

        // ========== 4. CALCULATE SINGLE DAY CHARGE ==========
        // IMPORTANT: Calculate what ONE DAY costs for this room
        // This should be the room tariff + taxes + extras for ONE day
        
        const roomTariff = Number(detail.room_tariff) || 0;
        const discountPercent = Number(detail.discount_percent) || 0;
        const discountAmount = (roomTariff * discountPercent) / 100;
        const roomPriceAfterDiscount = roomTariff - discountAmount;

        const cgstPercent = Number(detail.cgst_percent) || 0;
        const sgstPercent = Number(detail.sgst_percent) || 0;
        const igstPercent = Number(detail.igst_percent) || 0;
        const cessPercent = Number(detail.cess_percent) || 0;
        const serviceChargePercent = Number(detail.service_charge) || 0;

        const totalTaxPercent = igstPercent > 0 ? igstPercent : cgstPercent + sgstPercent;

        let cgstAmount = 0, sgstAmount = 0, igstAmount = 0;
        if (igstPercent > 0) {
            igstAmount = (roomPriceAfterDiscount * igstPercent) / 100;
        } else {
            cgstAmount = (roomPriceAfterDiscount * cgstPercent) / 100;
            sgstAmount = (roomPriceAfterDiscount * sgstPercent) / 100;
        }
        const gstAmount = igstAmount + cgstAmount + sgstAmount;
        const cessAmount = (roomPriceAfterDiscount * cessPercent) / 100;
        const serviceChargeAmount = (roomPriceAfterDiscount * serviceChargePercent) / 100;
        const taxAmount = gstAmount + cessAmount + serviceChargeAmount;

        // Get extra person counts
        const exPaxCount = Number(detail.detail_ex_pax) || 0;
        const childCount = Number(detail.detail_child_unpaid) || 0;
        const driverCount = Number(detail.detail_driver) || 0;

        // Calculate per-day extra charges from the current detail
        const currentNoOfDays = Number(detail.detail_no_of_days) || 1;
        const currentExPaxTotal = Number(detail.detail_ex_pax_charge) || 0;
        const currentChildTotal = Number(detail.detail_child_paid_amount) || 0;
        const currentDriverTotal = Number(detail.detail_driver_charge) || 0;

        // Per-day extra charges
        let exPaxChargePerDay = 0;
        let childChargePerDay = 0;
        let driverChargePerDay = 0;

        if (currentNoOfDays > 0) {
            if (exPaxCount > 0) {
                exPaxChargePerDay = currentExPaxTotal / currentNoOfDays;
            }
            if (childCount > 0) {
                childChargePerDay = currentChildTotal / currentNoOfDays;
            }
            if (driverCount > 0) {
                driverChargePerDay = currentDriverTotal / currentNoOfDays;
            }
        }

        // DAILY RATE = room + tax + extras for ONE day
        const dailyRoomTotal = roomPriceAfterDiscount + taxAmount;
        const dailyExPaxTotal = exPaxChargePerDay;
        const dailyChildTotal = childChargePerDay;
        const dailyDriverTotal = driverChargePerDay;
        
        // Total daily rate (this is what should be added for each extension day)
        const dailyRate = dailyRoomTotal + dailyExPaxTotal + dailyChildTotal + dailyDriverTotal;

        console.log(`[EXTEND-DAY] Daily rate calculation:`);
        console.log(`[EXTEND-DAY] Room daily: ${dailyRoomTotal}, ExPax daily: ${dailyExPaxTotal}, Child daily: ${dailyChildTotal}, Driver daily: ${dailyDriverTotal}`);
        console.log(`[EXTEND-DAY] TOTAL DAILY RATE: ${dailyRate}`);

        // ========== 5. CALCULATE EXTENSION AMOUNT ==========
        const extensionAmount = dailyRate * extensionDays;

        // ========== 6. CALCULATE NEW CHECKOUT DATETIME ==========
        const currentCheckoutDate = new Date(detail.detail_checkout_datetime || checkin.checkout_datetime);
        const newCheckoutDate = new Date(currentCheckoutDate);
        newCheckoutDate.setDate(currentCheckoutDate.getDate() + extensionDays);

        // ========== 7. MARK CURRENT DETAIL AS CHECKED OUT ==========
        await connection.execute(
            `UPDATE checkin_detail_master 
             SET is_checkout = 0, 
                 merged = 1, 
                 updated_by_id = ?, 
                 updated_date = ?
             WHERE detail_id = ? AND checkin_id = ?`,
            [userId, now, detail.detail_id, id]
        );

        // ========== 8. INSERT NEW DETAIL RECORD ==========
        const newNoOfDays =  extensionDays;

        const newExPaxTotal =  (dailyExPaxTotal * extensionDays);
        const newChildTotal =  (dailyChildTotal * extensionDays);
        const newDriverTotal =  (dailyDriverTotal * extensionDays);

        const detailInsertCols = [
            'checkin_id', 'hotelid', 'guest_id', 'room_id', 'room_number',
            'room_category_id', 'room_category_name', 'converted_category_id',
            'converted_category_name', 'checkin_datetime', 'checkout_datetime',
            'no_of_days', 'adults', 'pax', 'ex_pax', 'child_unpaid', 'driver',
            'room_tariff', 'discount_percent', 'discount_amount',
            'ex_pax_charge', 'child_paid_amount', 'driver_charge',
            'cgst_percent', 'cgst_amount', 'sgst_percent', 'sgst_amount',
            'igst_percent', 'igst_amount', 'cess_percent', 'cess_amount',
            'service_charge', 'service_charge_amount', 'tax',
            'parent_detail_id', 'is_checkout', 'is_settle',
            'created_by_id', 'created_date', 'updated_by_id', 'updated_date'
        ];

        const detailInsertVals = [
            id, checkin.hotelid, checkin.guest_id, roomId, detail.room_number,
            detail.room_category_id, detail.room_category_name, detail.converted_category_id,
            detail.converted_category_name,
            formatDateTime(currentCheckoutDate),   // <-- checkin_datetime: was the OLD checkout date
            formatDateTime(newCheckoutDate),      
            newNoOfDays,
            detail.detail_adults || checkin.adults,
            detail.detail_pax || checkin.pax,
            exPaxCount,
            childCount,
            driverCount,
            roomTariff,
            discountPercent,
            discountAmount * newNoOfDays,
            newExPaxTotal,
            newChildTotal,
            newDriverTotal,
            cgstPercent,
            cgstAmount * newNoOfDays,
            sgstPercent,
            sgstAmount * newNoOfDays,
            igstPercent,
            igstAmount * newNoOfDays,
            cessPercent,
            cessAmount * newNoOfDays,
            serviceChargePercent,
            serviceChargeAmount * newNoOfDays,
            taxAmount * newNoOfDays,
            detail.detail_id,
            0,
            0,
            userId, now, userId, now
        ];

        const [detailInsertResult] = await connection.execute(
            `INSERT INTO checkin_detail_master (${detailInsertCols.join(',')}) 
             VALUES (${detailInsertCols.map(() => '?').join(',')})`,
            detailInsertVals
        );

        const newDetailId = detailInsertResult.insertId;

        // ========== 9. INSERT GUEST ROOM CHARGES (ONE ROW PER EXTENSION DAY) ==========
        const chargesCols = [
            'guest_id', 'room_id', 'category_id', 'checkin_id',
            'pax_count', 'pax_price', 'pax_tax',
            'ex_pax_count', 'ex_pax_price', 'ex_pax_tax', 'ex_pax_tax_percent', 'ex_pax_total',
            'child_count', 'child_price', 'child_tax', 'child_tax_percent', 'child_total',
            'driver_count', 'driver_price', 'driver_tax', 'driver_tax_percent', 'driver_total',
            'total_amount', 'checkin_datetime', 'checkout_datetime',
            'created_at', 'updated_at'
        ];

        for (let dayIndex = 0; dayIndex < extensionDays; dayIndex++) {
            const chargeCheckinDate = new Date(currentCheckoutDate);
            chargeCheckinDate.setDate(currentCheckoutDate.getDate() + dayIndex);
            const chargeCheckoutDate = new Date(currentCheckoutDate);
            chargeCheckoutDate.setDate(currentCheckoutDate.getDate() + dayIndex + 1);

            const chargesVals = [
                checkin.guest_id,
                roomId,
                detail.room_category_id,
                id,
                detail.detail_pax || checkin.pax || 0,
                roomTariff,
                taxAmount,
                exPaxCount,
                exPaxChargePerDay * exPaxCount,
                0,
                totalTaxPercent,
                dailyExPaxTotal,
                childCount,
                childChargePerDay * childCount,
                0,
                totalTaxPercent,
                dailyChildTotal,
                driverCount,
                driverChargePerDay * driverCount,
                0,
                totalTaxPercent,
                dailyDriverTotal,
                dailyRate,
                formatDateTime(chargeCheckinDate),
                formatDateTime(chargeCheckoutDate),
                now,
                now
            ];

            await connection.execute(
                `INSERT INTO checkin_guest_room_charges (${chargesCols.join(',')}) 
                 VALUES (${chargesCols.map(() => '?').join(',')})`,
                chargesVals
            );
        }

        // ========== 10. UPDATE CHECKIN MASTER ==========
        const oldTotalNights = Number(checkin.total_nights) || 0;
        const oldTotalAmount = Number(checkin.total_amount) || 0;

        const newTotalNights = oldTotalNights + extensionDays;
        const newTotalAmount = oldTotalAmount + extensionAmount;

        await connection.execute(
            `UPDATE checkin_master 
             SET checkout_datetime = ?,
                 total_nights = ?,
                 total_amount = ?,
                 updated_by_id = ?,
                 updated_date = ?
             WHERE checkin_id = ?`,
            [
                formatDateTime(newCheckoutDate),
                newTotalNights,
                newTotalAmount,
                userId,
                now,
                id
            ]
        );

        // ========== 11. INSERT NEW CHECKIN GUEST FOLIO MASTER ROW ==========
        // Each extension creates its own folio ledger entry (debit) for the
        // extension amount, rather than mutating a prior row's debit_amount.
        // This keeps the folio history auditable: one row per charge event,
        // mirroring how checkin_detail_master and checkin_guest_room_charges
        // already get a new row per extension.
        const folioInsertCols = [
            'checkin_id', 'hotel_id', 'detail_id',  'room_id', 'transaction_type',
            'transaction_datetime', 'description', 'debit_amount', 'credit_amount',
            'reference_number', 'payment_method', 'created_by_id', 'created_date'
        ];
        const folioInsertVals = [
            id,
            checkin.hotelid,
            newDetailId,
            detail.room_id,
            'Room Extension',
            formatDateTime(now),
            `Extended ${extensionDays} day(s) - Room ${detail.room_number}`,
            extensionAmount,
            0,
            latestFolioReferenceNumber,
            latestFolioPaymentMethod,
            userId,
            now
        ];

        const [folioInsertResult] = await connection.execute(
            `INSERT INTO checkin_guest_folio_master (${folioInsertCols.join(',')})
             VALUES (${folioInsertCols.map(() => '?').join(',')})`,
            folioInsertVals
        );

        const newFolioId = folioInsertResult.insertId;

        // ========== 12. UPDATE ROOM STATUS TO OCCUPIED ==========
        await connection.execute(
            `UPDATE room_master 
             SET room_status_id = 2,
                 updated_by_id = ?,
                 updated_date = ?
             WHERE room_id = ? AND hotelid = ?`,
            [userId, now, roomId, checkin.hotelid]
        );

        // ========== 13. COMMIT TRANSACTION ==========
        await connection.commit();

        // ========== 14. FETCH UPDATED DATA ==========
        const [updatedCheckin] = await connection.execute(
            `SELECT 
                checkin_id, guest_id, guest_name, address, mobile, company_name,
                emailed, booking, plan_name, reg_no, special_instruction, message,
                checkin_datetime, checkout_datetime, room_no, category_id,
                converted_category, adults, pax, pax_charges, ex_pax, ex_pax_charge,
                child_paid, child_unpaid, child_charge, driver, driver_charge,
                hotelid, id_type, id_number, department_id, department_name,
                status, total_nights, total_amount, created_by_id, created_date,
                updated_by_id, updated_date, room_id, is_settle, checkout_id
            FROM checkin_master 
            WHERE checkin_id = ?`,
            [id]
        );

        console.log(`[EXTEND-DAY] Checkin ${id} extended by ${extensionDays} day(s).`);
        console.log(`[EXTEND-DAY] Old total_amount: ${oldTotalAmount}, Daily rate: ${dailyRate}, Extension amount: ${extensionAmount}, New total_amount: ${newTotalAmount}`);
        console.log(`[EXTEND-DAY] Old total_nights: ${oldTotalNights}, New total_nights: ${newTotalNights}`);
        console.log(`[EXTEND-DAY] New detail_id: ${newDetailId}, New folio_id: ${newFolioId}`);

        const formattedCheckin = updatedCheckin.length > 0 ? {
            ...updatedCheckin[0],
            checkin_datetime: formatDate(updatedCheckin[0].checkin_datetime),
            checkout_datetime: formatDate(updatedCheckin[0].checkout_datetime),
            created_date: formatDate(updatedCheckin[0].created_date),
            updated_date: formatDate(updatedCheckin[0].updated_date)
        } : null;

        res.json({
            success: true,
            message: `Stay extended by ${extensionDays} day(s) successfully`,
            data: {
                checkin_id: id,
                new_checkout_datetime: formatDateTime(newCheckoutDate),
                new_total_amount: newTotalAmount,
                new_total_nights: newTotalNights,
                extension_amount: extensionAmount,
                daily_rate: dailyRate,
                new_detail_id: newDetailId,
                new_folio_id: newFolioId,
                checkin: formattedCheckin
            }
        });

    } catch (error) {
        await connection.rollback();
        console.error('Error extending day:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to extend stay',
            error: error.message
        });
    } finally {
        connection.release();
    }
};
// ----------------------------------------------------------------------
// DELETE /checkins/:id – delete checkin
// ----------------------------------------------------------------------
exports.deleteCheckin = async (req, res) => {
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        const { id } = req.params;
        const checkinId = parseInt(id);

        if (isNaN(checkinId)) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Invalid checkin ID' });
        }

        const [checkins] = await connection.execute(
            'SELECT hotelid, room_no FROM checkin_master WHERE checkin_id = ?',
            [checkinId]
        );

        if (checkins.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Checkin not found' });
        }

        const checkin = checkins[0];

        await connection.execute('DELETE FROM checkin_guest_folio_master WHERE checkin_id = ?', [checkinId]);
        await connection.execute('DELETE FROM checkin_guest_room_charges WHERE checkin_id = ?', [checkinId]);
        await connection.execute('DELETE FROM post_charges WHERE checkin_id = ?', [checkinId]);
        await connection.execute('DELETE FROM advance_transactions WHERE checkin_id = ?', [checkinId]);
        await connection.execute('DELETE FROM checkin_detail_master WHERE checkin_id = ?', [checkinId]);

        const [result] = await connection.execute(
            'DELETE FROM checkin_master WHERE checkin_id = ?',
            [checkinId]
        );

        if (result.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Checkin not found' });
        }

        if (checkin.room_no) {
            const [rooms] = await connection.execute(
                'SELECT room_id FROM room_master WHERE room_no = ? AND hotelid = ?',
                [checkin.room_no, checkin.hotelid]
            );
            if (rooms.length > 0) {
                const availableStatusId = await getAvailableStatusId();
                await connection.execute(`
                    UPDATE room_master 
                    SET room_status_id = ?, updated_date = ?
                    WHERE room_id = ?
                `, [availableStatusId, new Date(), rooms[0].room_id]);
            }
        }

        await connection.commit();

        res.json({
            success: true,
            message: 'Checkin deleted successfully',
            data: { checkin_id: checkinId },
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error deleting checkin:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to delete checkin', 
            error: error.message 
        });
    } finally {
        connection.release();
    }
};