// controllers/checkInController.js
const db = require('../../../config/db');

// Helper to get current user ID
const getCurrentUserId = (req) => req.user?.id || null;

// Helper to get current user's hotel ID
const getCurrentUserHotelId = (req) => req.user?.hotel_id || null;

// Helper to format MySQL datetime
const formatDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return null;
    
    // Agar already MySQL format mein hai toh wahi return karo
    if (typeof dateTimeStr === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateTimeStr)) {
        return dateTimeStr;
    }
    
    // Agar ISO format mein hai (YYYY-MM-DDTHH:mm:ss)
    if (typeof dateTimeStr === 'string') {
        const match = dateTimeStr.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
        if (match) {
            return `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}:${match[6]}`;
        }
    }
    
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
    
    // Agar already MySQL format mein hai toh wahi return karo
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)) {
        return date.split(' ')[0];
    }
    
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



exports.getCheckins = async (req, res) => {
    try {
        // Hotel ID
        let hotelId = req.query.hotelid || req.query.mst_hotelid;

        if (!hotelId) {
            hotelId = getCurrentUserHotelId(req);
        }

        if (!hotelId) {
            return res.status(400).json({
                success: false,
                message: "Hotel ID not found"
            });
        }

        const checkinId = req.query.checkin_id || 0;

        // SP Call
        const [result] = await db.execute(
            "CALL sp_get_checkins(?, ?)",
            [hotelId, checkinId]
        );

        const checkins = result[0] || [];

        // ✅ सही मैपिंग - सिर्फ वही फील्ड्स जो SP में मौजूद हैं
       const formattedCheckins = checkins.map(checkin => ({
    ...checkin,
    detail_checkin_datetime: formatDateTime(checkin.detail_checkin_datetime),   // ✅ formatDate → formatDateTime
    detail_checkout_datetime: formatDateTime(checkin.detail_checkout_datetime), // ✅ formatDate → formatDateTime
}));

        return res.status(200).json({
            success: true,
            message: "Checkins fetched successfully",
            data: formattedCheckins
        });

    } catch (error) {
        console.error("Error fetching checkins:", error);
        return res.status(500).json({
            success: false,
            message: "Database error",
            error: error.message
        });
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

        // Select only columns that exist in checkin_master
        let sql = `
            SELECT 
                cm.checkin_id,
                cm.guest_id,
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
                cm.room_id,
                cm.is_settle,
                cm.checkout_id
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

        // Format dates – only for columns that exist
        const formatDateSafe = (dateVal) => {
            if (!dateVal) return null;
            return formatDate(dateVal);
        };

        const formattedCheckin = {
            ...checkins[0],
            checkin_datetime: formatDateSafe(checkins[0].checkin_datetime),
            created_date: formatDateSafe(checkins[0].created_date),
            updated_date: formatDateSafe(checkins[0].updated_date)
            // checkout_datetime is NOT in this table, so we don't format it
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

    const body = req.body;
    const userId = body.created_by_id || 1;

    console.log('📥 ===== ADD CHECKIN REQUEST =====');
    console.log('📥 Full body:', JSON.stringify(body, null, 2));

    // ----- Helpers -----
    const formatDateTime = (val) => {
      if (!val) return null;
      if (val instanceof Date) return val;
      if (typeof val === 'string') {
        // Agar already MySQL format mein hai toh wahi return karo
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(val)) {
          return val;
        }
        
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          // Local time components use karo, UTC nahi
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const hours = String(d.getHours()).padStart(2, '0');
          const minutes = String(d.getMinutes()).padStart(2, '0');
          const seconds = String(d.getSeconds()).padStart(2, '0');
          return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        }
        return val;
      }
      return val;
    };

    const toStr = (val) => (val !== undefined && val !== null && val !== '') ? String(val) : null;
    const toNum = (val) => (val !== undefined && val !== null) ? Number(val) : 0;

    // ----- Ensure room_id as comma string -----
    let roomIdsString = '0';
    if (body.room_id && typeof body.room_id === 'string' && body.room_id.length > 0) {
      roomIdsString = body.room_id;
    } else if (body.room_ids && Array.isArray(body.room_ids)) {
      roomIdsString = body.room_ids.join(',');
    } else if (body.details && Array.isArray(body.details)) {
      const ids = body.details.map(d => d.room_id).filter(id => id);
      if (ids.length) roomIdsString = ids.join(',');
    }

    console.log('📊 Room IDs string:', roomIdsString);

    // ----- Prepare details JSON -----
    let detailsJson = null;
    if (body.details && Array.isArray(body.details) && body.details.length > 0) {
      const cleaned = body.details.map(d => ({
        guest_id: toNum(d.guest_id),
        guest_name: toStr(d.guest_name) || '',
        address: toStr(d.address) || '',
        mobile: toStr(d.mobile) || '',
        company_id: d.company_id ? Number(d.company_id) : 0,
        company_name: toStr(d.company_name) || '',
        emailed: toStr(d.emailed) || '',
        room_id: toNum(d.room_id),
        room_number: toStr(d.room_number) || '',
        room_category_id: toNum(d.room_category_id),
        room_category_name: toStr(d.room_category_name) || '',
        converted_category_id: toNum(d.converted_category_id),
        converted_category_name: toStr(d.converted_category_name) || '',
        checkin_datetime: formatDateTime(d.checkin_datetime) || formatDateTime(body.checkin_datetime),
        checkout_datetime: formatDateTime(d.checkout_datetime) || formatDateTime(body.checkout_datetime),
        no_of_days: toNum(d.no_of_days) || 1,
        adults: toNum(d.adults),
        pax: toNum(d.pax),
        ex_pax: toNum(d.ex_pax),
        child_paid: toNum(d.child_paid),
        child_unpaid: toNum(d.child_unpaid),
        driver: toNum(d.driver),
        room_tariff: toNum(d.room_tariff),
        ex_pax_charge: toNum(d.ex_pax_charge),
        child_paid_amount: toNum(d.child_paid_amount),
        driver_charge: toNum(d.driver_charge),
        discount_percent: toNum(d.discount_percent),
        discount_amount: toNum(d.discount_amount),
        tax_percen_room: toNum(d.tax_percen_room),
        cgst_percent: toNum(d.cgst_percent),
        cgst_amount: toNum(d.cgst_amount),
        sgst_percent: toNum(d.sgst_percent),
        sgst_amount: toNum(d.sgst_amount),
        igst_percent: toNum(d.igst_percent),
        igst_amount: toNum(d.igst_amount),
        tax_percen_ex: toNum(d.tax_percen_ex),
        ex_cgst_percent: toNum(d.ex_cgst_percent),
        ex_cgst_amount: toNum(d.ex_cgst_amount),
        ex_sgst_percent: toNum(d.ex_sgst_percent),
        ex_sgst_amount: toNum(d.ex_sgst_amount),
        ex_igst_percent: toNum(d.ex_igst_percent),
        ex_igst_amount: toNum(d.ex_igst_amount),
        tax_percen_child: toNum(d.tax_percen_child),
        child_cgst_percent: toNum(d.child_cgst_percent),
        child_cgst_amount: toNum(d.child_cgst_amount),
        child_sgst_percent: toNum(d.child_sgst_percent),
        child_sgst_amount: toNum(d.child_sgst_amount),
        child_igst_percent: toNum(d.child_igst_percent),
        child_igst_amount: toNum(d.child_igst_amount),
        tax_percen_driver: toNum(d.tax_percen_driver),
        driver_cgst_percent: toNum(d.driver_cgst_percent),
        driver_cgst_amount: toNum(d.driver_cgst_amount),
        driver_sgst_percent: toNum(d.driver_sgst_percent),
        driver_sgst_amount: toNum(d.driver_sgst_amount),
        driver_igst_percent: toNum(d.driver_igst_percent),
        driver_igst_amount: toNum(d.driver_igst_amount),
        service_charge: toNum(d.service_charge),
        service_charge_amount: toNum(d.service_charge_amount),
        cess_percent: toNum(d.cess_percent),
        cess_amount: toNum(d.cess_amount),
        tax: toNum(d.tax),
        parent_detail_id: 0,
        is_checkout: 0,
        merged: 0,
        is_settle: 0
      }));
      detailsJson = JSON.stringify(cleaned);
    }

    // ============================================================
    // 🔥 FIX: Automatically generate room_charges from details
    //    if they are missing or all zeros.
    // ============================================================
    let roomChargesJson = null;
    if (body.room_charges && Array.isArray(body.room_charges) && body.room_charges.length > 0) {
      // Check if all numeric amounts are zero – if so, rebuild from details
      const hasNonZero = body.room_charges.some(c =>
        toNum(c.pax_price) > 0 ||
        toNum(c.ex_pax_price) > 0 ||
        toNum(c.child_price) > 0 ||
        toNum(c.driver_price) > 0 ||
        toNum(c.total_amount) > 0
      );

      if (hasNonZero) {
        // Use provided charges as-is
        const cleaned = body.room_charges.map(c => ({
          guest_id: toNum(c.guest_id),
          room_id: toNum(c.room_id),
          category_id: toNum(c.category_id),
          pax_count: toNum(c.pax_count),
          pax_price: toNum(c.pax_price),
          pax_tax: toNum(c.pax_tax),
          ex_pax_count: toNum(c.ex_pax_count),
          ex_pax_price: toNum(c.ex_pax_price),
          ex_pax_tax: toNum(c.ex_pax_tax),
          ex_pax_tax_percent: toNum(c.ex_pax_tax_percent),
          ex_pax_total: toNum(c.ex_pax_total),
          child_count: toNum(c.child_count),
          child_price: toNum(c.child_price),
          child_tax: toNum(c.child_tax),
          child_tax_percent: toNum(c.child_tax_percent),
          child_total: toNum(c.child_total),
          driver_count: toNum(c.driver_count),
          driver_price: toNum(c.driver_price),
          driver_tax: toNum(c.driver_tax),
          driver_tax_percent: toNum(c.driver_tax_percent),
          driver_total: toNum(c.driver_total),
          total_amount: toNum(c.total_amount),
          checkin_datetime: formatDateTime(c.checkin_datetime) || formatDateTime(body.checkin_datetime),
          checkout_datetime: formatDateTime(c.checkout_datetime) || formatDateTime(body.checkout_datetime)
        }));
        roomChargesJson = JSON.stringify(cleaned);
        console.log('📥 Using provided room_charges (non-zero)');
      } else {
        console.log('⚠️ Provided room_charges are all zeros – rebuilding from details');
        roomChargesJson = null; // will rebuild below
      }
    }

    // If roomChargesJson is still null, build from details (first detail per room)
    if (!roomChargesJson && body.details && Array.isArray(body.details)) {
      const charges = body.details.map(d => {
        // Compute totals based on detail values
        const baseRoom = toNum(d.room_tariff) - toNum(d.discount_amount);
        const paxTax = toNum(d.cgst_amount) + toNum(d.sgst_amount) + toNum(d.igst_amount) +
                       toNum(d.cess_amount) + toNum(d.service_charge_amount);
        const totalRoom = baseRoom + paxTax;

        const exPaxTotal = toNum(d.ex_pax_charge) + toNum(d.ex_cgst_amount) + toNum(d.ex_sgst_amount) + toNum(d.ex_igst_amount);
        const childTotal = toNum(d.child_paid_amount) + toNum(d.child_cgst_amount) + toNum(d.child_sgst_amount) + toNum(d.child_igst_amount);
        const driverTotal = toNum(d.driver_charge) + toNum(d.driver_cgst_amount) + toNum(d.driver_sgst_amount) + toNum(d.driver_igst_amount);
        const totalAmount = totalRoom + exPaxTotal + childTotal + driverTotal;

        return {
          guest_id: toNum(d.guest_id),
          room_id: toNum(d.room_id),
          category_id: toNum(d.room_category_id),
          pax_count: toNum(d.pax),
          pax_price: baseRoom,
          pax_tax: paxTax,
          ex_pax_count: toNum(d.ex_pax),
          ex_pax_price: toNum(d.ex_pax_charge),
          ex_pax_tax: toNum(d.ex_cgst_amount) + toNum(d.ex_sgst_amount) + toNum(d.ex_igst_amount),
          ex_pax_tax_percent: toNum(d.tax_percen_ex),
          ex_pax_total: exPaxTotal,
          child_count: toNum(d.child_paid),
          child_price: toNum(d.child_paid_amount),
          child_tax: toNum(d.child_cgst_amount) + toNum(d.child_sgst_amount) + toNum(d.child_igst_amount),
          child_tax_percent: toNum(d.tax_percen_child),
          child_total: childTotal,
          driver_count: toNum(d.driver),
          driver_price: toNum(d.driver_charge),
          driver_tax: toNum(d.driver_cgst_amount) + toNum(d.driver_sgst_amount) + toNum(d.driver_igst_amount),
          driver_tax_percent: toNum(d.tax_percen_driver),
          driver_total: driverTotal,
          total_amount: totalAmount,
          checkin_datetime: formatDateTime(d.checkin_datetime) || formatDateTime(body.checkin_datetime),
          checkout_datetime: formatDateTime(d.checkout_datetime) || formatDateTime(body.checkout_datetime)
        };
      });
      roomChargesJson = JSON.stringify(charges);
      console.log('📥 Generated room_charges from details');
    }

    // ----- Prepare folio JSON -----
    let folioEntriesJson = null;
    if (body.folio_entries && Array.isArray(body.folio_entries) && body.folio_entries.length > 0) {
      const cleaned = body.folio_entries.map(f => ({
        hotel_id: toNum(f.hotel_id) || toNum(body.hotelid),
        room_id: toNum(f.room_id) || 0,
        transaction_type: toStr(f.transaction_type) || '',
        transaction_datetime: formatDateTime(f.transaction_datetime) || new Date().toISOString().slice(0,19).replace('T',' '),
        description: toStr(f.description) || '',
        debit_amount: toNum(f.debit_amount),
        credit_amount: toNum(f.credit_amount),
        reference_number: toStr(f.reference_number),
        payment_method: toStr(f.payment_method) || ''
      }));
      folioEntriesJson = JSON.stringify(cleaned);
    }

    // ============================================================
    // 🔥 GET PAYMENT METHOD from body
    // ============================================================
    const paymentMethod = toStr(body.payment_method) || toStr(body.paymentMethod) || 'Cash'; // Default to Cash if not provided

    console.log('💳 Payment Method:', paymentMethod);

    // ----- Build parameters (43 total - added payment_method) -----
    const params = [
      body.guest_id ? Number(body.guest_id) : null,
      toStr(body.booking),
      toStr(body.plan_name),
      formatDateTime(body.checkin_datetime),
      formatDateTime(body.checkout_datetime),
      toStr(body.room_no),
      roomIdsString,
      toNum(body.tot_room_tariff),
      toNum(body.tot_ex_pax_charge),
      toNum(body.tot_child_paid_amount),
      toNum(body.tot_driver_charge),
      toNum(body.tot_discount_amount),
      toNum(body.tot_cgst_amount),
      toNum(body.tot_sgst_amount),
      toNum(body.tot_igst_amount),
      toNum(body.tot_ex_cgst_amount),
      toNum(body.tot_ex_sgst_amount),
      toNum(body.tot_ex_igst_amount),
      toNum(body.tot_child_cgst_amount),
      toNum(body.tot_child_sgst_amount),
      toNum(body.tot_child_igst_amount),
      toNum(body.tot_driver_cgst_amount),
      toNum(body.tot_driver_sgst_amount),
      toNum(body.tot_driver_igst_amount),
      toNum(body.tot_service_charge_amount),
      toNum(body.tot_cess_amount),
      toNum(body.tot_advance),
      toNum(body.hotelid),
      toNum(body.outletid) || 1,
      toStr(body.id_type),
      toStr(body.id_number),
      body.department_id ? Number(body.department_id) : null,
      toStr(body.department_name),
      toStr(body.special_instruction),
      toStr(body.message),
      toNum(body.total_nights),
      toNum(body.total_amount),
      toStr(body.status) || 'active',
      Number(userId),
      paymentMethod, // <-- NEW PARAMETER: payment_method
      detailsJson,
      roomChargesJson,
      folioEntriesJson
    ];

    // Validate that roomChargesJson is not null – procedure requires it
    if (!roomChargesJson) {
      throw new Error('Could not build room_charges – please provide valid room charge data.');
    }

    console.log(`📊 Parameter count: ${params.length}`);
    console.log(`📊 Room charges sample: ${roomChargesJson.substring(0, 200)}...`);

    const placeholders = params.map(() => '?').join(',');
    const [results] = await connection.execute(
      `CALL sp_add_checkin(${placeholders})`,
      params
    );

    await connection.commit();

    let result = null;
    if (results && results.length > 0 && results[0] && results[0].length > 0) {
      result = results[0][0];
    }

    if (result && result.result) {
      let parsedResult;
      try {
        parsedResult = typeof result.result === 'string' ? JSON.parse(result.result) : result.result;
      } catch (e) {
        parsedResult = { success: false, message: 'Invalid result format' };
      }

      if (parsedResult.success) {
        const [masterRow] = await connection.execute(
          'SELECT * FROM checkin_master WHERE checkin_id = ?',
          [parsedResult.checkin_id]
        );

        return res.status(201).json({
          success: true,
          message: parsedResult.message || 'Check-in created successfully',
          data: masterRow[0],
          checkin_id: parsedResult.checkin_id,
          reg_no: parsedResult.reg_no,
          payment_method: paymentMethod, // <-- Return payment method in response
          room_ids: roomIdsString,
          debug: parsedResult.debug
        });
      } else {
        throw new Error(parsedResult.message || 'Unknown error from stored procedure');
      }
    } else {
      throw new Error('No result from stored procedure');
    }

  } catch (err) {
    if (connection) await connection.rollback();
    console.error('❌ addCheckin error:', err.message);
    res.status(500).json({
      success: false,
      message: err.message || 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
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

        // Call the stored procedure
        const [rows] = await db.execute('CALL GetAtGlance(?)', [hotelId]);

        // Note: mysql2/promise returns an array of result sets.
        // The first element is the actual rows.
        const resultSet = rows[0] || [];

        const formatted = resultSet.map((r) => ({
            ...r,
            checkin_datetime: formatDateTime(r.checkin_datetime),
            checkout_datetime: formatDateTime(r.checkout_datetime),
            totalAmt: Number(r.total_room_amount ?? 0) || 0,
            child: (Number(r.child_unpaid ?? 0) + Number(r.child_paid_amount ?? 0)) || 0
        }));

        res.json({ success: true, data: formatted });
    } catch (error) {
        console.error('Error fetching at-glance:', error);
        res.status(500).json({ success: false, message: 'Database error', error: error.message });
    }
};


exports.getDailySalesSummary = async (req, res) => {
    try {
        const { hotelid, start_date, end_date } = req.query;

        if (!hotelid || !start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'hotelid, start_date and end_date are required.'
            });
        }

        const [result] = await db.query(
            'CALL hotelbooking_db.sp_daily_sales_summary(?, ?, ?)',
            [Number(hotelid), start_date, end_date]
        );

        let rows = result[0] || [];
        console.log(rows[0]);   // <-- Add this

        // 🔥 Do NOT parse payment_breakdown – send the raw string as is.
        // The frontend will parse it safely.
        // If it's null or undefined, we leave it as is; the frontend will handle it.
        // No need to manipulate rows.

        res.status(200).json({
            success: true,
            count: rows.length,
            data: rows
        });

    } catch (error) {
        console.error('getDailySalesSummary error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch daily sales summary.',
            error: error.message
        });
    }
};



exports.getDailySalesSummaryReport = async (req, res) => {
    try {
        const hotelId =
            req.query.hotelid ||
            (req.body && req.body.hotelid) ||
            getCurrentUserHotelId(req);

        const { start_date, end_date } = req.query;

        if (!hotelId || !start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: "hotelid, start_date and end_date are required"
            });
        }

        const [results] = await db.query(
            "CALL sp_daily_sales_summary_report(?, ?, ?)",
            [hotelId, start_date, end_date]
        );

        const dailySummary = results[0] || [];
        const monthlySummary = results[1] || [];

        // ✅ CHANGE HERE: Wrap in 'data' key
        return res.status(200).json({
            success: true,
            data: {
                dailySummary,
                monthlySummary
            }
        });

    } catch (error) {
        console.error("getDailySalesSummaryReport error:", error);
        return res.status(500).json({
            success: false,
            message: error.sqlMessage || error.message
        });
    }
};


// exports.getGuestSummary = async (req, res) => {
//     try {
//         const {
//             hotelid,
//             start_date,
//             end_date,
//             limit = 100
//         } = req.query;

//         if (!hotelid || !start_date || !end_date) {
//             return res.status(400).json({
//                 success: false,
//                 message: "hotelid, start_date and end_date are required."
//             });
//         }

//         const [result] = await db.query(
//             `CALL hotelbooking_db.sp_daily_sales_summary(?, ?, ?, ?)`,
//             [
//                 Number(hotelid),
//                 start_date,
//                 end_date,
//                 Number(limit)
//             ]
//         );

//         res.status(200).json({
//             success: true,
//             count: result[0].length,
//             data: result[0]
//         });

//     } catch (error) {
//         console.error("getDailySalesSummary error:", error);
//         res.status(500).json({
//             success: false,
//             message: "Failed to fetch daily sales summary.",
//             error: error.message
//         });
//     }
// };


exports.getPaymentModeSummary = async (req, res) => {
    try {
        const { hotelid, start_date, end_date } = req.query;

        const [rows] = await db.query(
            `CALL sp_payment_mode_summary(?, ?, ?)`,
            [
                hotelid,
                start_date,
                end_date
            ]
        );

        res.status(200).json({
            success: true,
            data: rows[0] // Stored Procedure ka first result set
        });

    } catch (error) {
        console.error("getPaymentModeSummary error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
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

        // ========== CALL THE STORED PROCEDURE ==========
        const [results] = await connection.execute(
            `CALL sp_extend_room_stay(
                ?, ?, ?, ?,
                @p_new_checkout_datetime,
                @p_new_total_amount,
                @p_new_total_nights,
                @p_extension_amount,
                @p_daily_rate,
                @p_new_detail_id,
                @p_new_folio_id,
                @p_message,
                @p_success
            )`,
            [id, roomId, extensionDays, userId]
        );

        // ========== GET THE OUTPUT PARAMETERS ==========
        const [outputRows] = await connection.execute(
            `SELECT 
                @p_new_checkout_datetime AS new_checkout_datetime,
                @p_new_total_amount AS new_total_amount,
                @p_new_total_nights AS new_total_nights,
                @p_extension_amount AS extension_amount,
                @p_daily_rate AS daily_rate,
                @p_new_detail_id AS new_detail_id,
                @p_new_folio_id AS new_folio_id,
                @p_message AS message,
                @p_success AS success
            `
        );

        const output = outputRows[0];

        if (!output.success) {
            await connection.rollback();
            return res.status(400).json({
                success: false,
                message: output.message || 'Failed to extend stay'
            });
        }

        // ========== COMMIT TRANSACTION ==========
        await connection.commit();

        // ========== FETCH UPDATED CHECKIN DATA ==========
        // ✅ CORRECTED: Join with checkin_detail_master for guest details
        const [updatedCheckin] = await connection.execute(
            `SELECT 
                cm.checkin_id,
                cm.guest_id,
                cm.reg_no,
                cm.booking,
                cm.plan_name,
                cm.checkin_datetime,
                cm.room_no,
                cm.hotelid,
                cm.total_amount,
                cm.total_nights,
                cm.id_type,
                cm.id_number,
                cm.department_id,
                cm.department_name,
                cm.special_instruction,
                cm.message,
                cm.status,
                cm.created_by_id,
                cm.created_date,
                cm.updated_by_id,
                cm.updated_date,
                cm.room_id,
                cm.is_settle,
                cm.checkout_id,
                -- Guest details from detail table
                MAX(cdm.guest_name) AS guest_name,
                MAX(cdm.address) AS address,
                MAX(cdm.mobile) AS mobile,
                MAX(cdm.company_name) AS company_name,
                MAX(cdm.emailed) AS emailed
            FROM checkin_master cm
            LEFT JOIN checkin_detail_master cdm ON cdm.checkin_id = cm.checkin_id
            WHERE cm.checkin_id = ?
            GROUP BY cm.checkin_id`,
            [id]
        );

        console.log(`[EXTEND-DAY] Checkin ${id} extended by ${extensionDays} day(s).`);
        console.log(`[EXTEND-DAY] Extension amount: ${output.extension_amount}`);
        console.log(`[EXTEND-DAY] Daily rate: ${output.daily_rate}`);
        console.log(`[EXTEND-DAY] New total_amount: ${output.new_total_amount}`);
        console.log(`[EXTEND-DAY] New total_nights: ${output.new_total_nights}`);
        console.log(`[EXTEND-DAY] New detail_id: ${output.new_detail_id}`);
        console.log(`[EXTEND-DAY] New folio_id: ${output.new_folio_id}`);

        const formattedCheckin = updatedCheckin.length > 0 ? {
            ...updatedCheckin[0],
            checkin_datetime: formatDate(updatedCheckin[0].checkin_datetime),
            created_date: formatDate(updatedCheckin[0].created_date),
            updated_date: formatDate(updatedCheckin[0].updated_date)
        } : null;

        res.json({
            success: true,
            message: output.message,
            data: {
                checkin_id: id,
                new_checkout_datetime: output.new_checkout_datetime,
                new_total_amount: output.new_total_amount,
                new_total_nights: output.new_total_nights,
                extension_amount: output.extension_amount,
                daily_rate: output.daily_rate,
                new_detail_id: output.new_detail_id,
                new_folio_id: output.new_folio_id,
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