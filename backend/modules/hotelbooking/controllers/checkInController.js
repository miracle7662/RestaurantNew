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
    return d.toISOString().slice(0, 19).replace('T', ' ');
};

// Helper to format date for MySQL
const formatDate = (date) => date ? new Date(date).toISOString() : null;

// Helper to get value or null
const getValueOrNull = (value) => value !== undefined && value !== null && value !== '' ? value : null;

// Helper to get default room status ID for 'occupied'
const getOccupiedStatusId = async () => {
    const [statuses] = await db.execute(
        "SELECT room_status_id FROM room_status WHERE LOWER(status_name) = 'occupied' LIMIT 1"
    );
    if (statuses.length > 0) return statuses[0].room_status_id;
    
    const [altStatuses] = await db.execute(
        "SELECT room_status_id FROM room_status WHERE LOWER(status_name) IN ('occupied', 'booked', 'in_house') LIMIT 1"
    );
    return altStatuses.length > 0 ? altStatuses[0].room_status_id : 2;
};

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
            WHERE cm.hotelid = ?
        `;

        const params = [hotelId];

        if (!status) {
            sql += ` AND cm.status = 'active'`;
        } else if (status === 'checked_out') {
            sql += ` AND cm.status = 'checked_out'`;
        } else if (status === 'all') {
            // Show all checkins including checked_out
        } else {
            sql += ` AND cm.status = ?`;
            params.push(status);
        }

        if (q) {
            sql += ` AND (cm.guest_name LIKE ? OR cm.reg_no LIKE ? OR cm.mobile LIKE ?)`;
            const like = `%${q}%`;
            params.push(like, like, like);
        }

        sql += ` ORDER BY cm.checkin_id DESC`;

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

        const [result] = await db.execute(
            `SELECT COUNT(*) as count FROM checkin_master WHERE hotelid = ? AND reg_no IS NOT NULL`,
            [hotelId]
        );

        const count = result[0].count + 1;
        const regNo = `REG${String(count).padStart(4, '0')}`;

        res.json({
            success: true,
            data: { reg_no: regNo },
        });
    } catch (error) {
        console.error('Error generating reg number:', error);
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
    const userId = body.created_by_id || 1; // fallback, should come from auth

   const { hotelid } = body;

if (!hotelid) {
  throw new Error("hotelid is required");
}
   

    // ========== FETCH & UPDATE REG_NO FROM LDG_BILL_SETTINGS ==========
    // Lock the row for update to prevent race conditions
    const [settingsRows] = await connection.execute(
      `SELECT ldgsettingid, reg_no
       FROM ldg_bill_settings
       WHERE hotelid = ? 
       FOR UPDATE`,
      [hotelid ]
    );

    if (settingsRows.length === 0) {
      throw new Error(`No ldg_bill_settings record found for hotelid=${hotelid}`);
    }

    // Convert currentRegNo to number (handles null/undefined)
    const currentRegNo = Number(settingsRows[0].reg_no) || 0;
    const nextRegNo = currentRegNo + 1;
    body.reg_no = nextRegNo; // Override any incoming reg_no with generated value

    // Display formatted value
const displayRegNo = `REG${String(nextRegNo).padStart(4, "0")}`;

console.log(displayRegNo); // REG0012

    // ========== 1. CHECKIN MASTER ==========
    // Allowed fields that exist in checkin_master table
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

    // ========== UPDATE LDG_BILL_SETTINGS WITH NEW REG_NO ==========
    await connection.execute(
      `UPDATE ldg_bill_settings
       SET reg_no = ?
       WHERE hotelid = ?`,
      [nextRegNo, hotelid]
    );

    // ========== 2. CHECKIN DETAIL MASTER ==========
    let firstDetailId = null;
    if (body.details && body.details.length) {
      for (const d of body.details) {
        const detailAllowed = [
          'room_id', 'room_number', 'room_category_id', 'room_category_name',
          'converted_category_id', 'converted_category_name', 'no_of_days',
          'adults', 'pax', 'ex_pax', 'child_unpaid', 'driver', 'room_tariff',
          'ex_pax_charge', 'child_paid_amount', 'driver_charge', 'discount_percent',
          'discount_amount', 'cgst_percent', 'cgst_amount', 'sgst_percent',
          'sgst_amount', 'igst_percent', 'igst_amount', 'cess_percent',
          'cess_amount', 'service_charge', 'service_charge_amount', 'tax'
        ];
        const detailCols = [
          'checkin_id', 'hotelid', 'created_date', 'updated_date',
          'created_by_id', 'updated_by_id', 'is_settel'
        ];
        const detailVals = [checkinId, body.hotelid, now, now, userId, userId, 0];
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
          'checkin_id', 'hotel_id', 'detail_id', 'transaction_type',
          'transaction_datetime', 'description', 'debit_amount', 'credit_amount',
          'reference_number', 'payment_method', 'created_by_id', 'created_date'
        ];
        const folioVals = [
          checkinId,
          body.hotelid,
          firstDetailId,
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
          `INSERT INTO checkin_guest_folio_master (${folioCols.join(',')}) VALUES (${folioCols.map(()=>'?').join(',')})`,
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
                SET is_checkout = 1, merged = 1, updated_by_id = ?, updated_date = ?
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