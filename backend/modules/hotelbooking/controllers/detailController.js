// detailController.js - Fixed version

const db = require('../../../config/db');

const getCurrentUserId = (req) => req.user?.id || null;
const getCurrentUserHotelId = (req) => req.user?.hotelid || null;

// Converts any datetime value to MySQL DATETIME format 'YYYY-MM-DD HH:MM:SS'
// Handles ISO strings (with T / Z), Date objects, and already-formatted strings.
const formatDateTime = (dateValue) => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) {
    return dateValue.toISOString().slice(0, 19).replace('T', ' ');
  }
  const s = String(dateValue);
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return `${s} 00:00:00`;
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 19).replace('T', ' ');
  return null;
};

// GET all details
exports.getDetails = async (req, res) => {
  try {
    const { checkin_id } = req.query;
    let hotelId = req.query.hotelid || getCurrentUserHotelId(req);

    if (!hotelId && !checkin_id) {
      return res.status(400).json({ success: false, message: "Hotel ID or checkin_id required" });
    }

    let query = `SELECT * FROM checkin_detail_master`;
    const params = [];

    if (checkin_id) {
      query += ` WHERE checkin_id = ?`;
      params.push(checkin_id);
    } else if (hotelId) {
      query += ` WHERE hotelid = ?`;
      params.push(hotelId);
    }

    query += ` ORDER BY detail_id DESC`;

    const [details] = await db.query(query, params);
    res.json({ success: true, message: "Data fetched successfully", data: details });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

// GET detail by ID
exports.getDetailById = async (req, res) => {
  try {
    const { id } = req.params;
    const [details] = await db.query('SELECT * FROM checkin_detail_master WHERE detail_id = ?', [id]);
    const detail = details[0];
    
    if (!detail) {
      return res.status(404).json({ success: false, message: "Detail not found" });
    }
    res.json({ success: true, message: "Data fetched successfully", data: detail });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

// ADD detail
exports.addDetail = async (req, res) => {
  try {
    const {
      checkin_id, hotelid, room_id, room_number, room_category_id, room_category_name,
      converted_category_id, converted_category_name, checkin_datetime, checkout_datetime,
      no_of_days, adults, pax, ex_pax, child_unpaid, driver, room_tariff, ex_pax_charge,
      child_paid_amount, driver_charge, discount_percent, discount_amount,
      cgst_percent, cgst_amount, sgst_percent, sgst_amount, igst_percent, igst_amount,
      cess_percent, cess_amount, service_charge, service_charge_amount, parent_detail_id,
      is_checkout = 0, merged = 0, tax
    } = req.body;

    const userId = getCurrentUserId(req);
    let finalHotelId = hotelid || getCurrentUserHotelId(req);
    const created_date = new Date();

    if (!finalHotelId) {
      return res.status(400).json({ success: false, message: "Hotel ID not found" });
    }

    // Format datetime values
    const formattedCheckinDatetime = formatDateTime(checkin_datetime);
    const formattedCheckoutDatetime = formatDateTime(checkout_datetime);

    const [result] = await db.query(`
      INSERT INTO checkin_detail_master (
        checkin_id, hotelid, room_id, room_number, room_category_id, room_category_name,
        converted_category_id, converted_category_name, checkin_datetime, checkout_datetime,
        no_of_days, adults, pax, ex_pax, child_unpaid, driver, room_tariff, ex_pax_charge,
        child_paid_amount, driver_charge, discount_percent, discount_amount,
        cgst_percent, cgst_amount, sgst_percent, sgst_amount, igst_percent, igst_amount,
        cess_percent, cess_amount, service_charge, service_charge_amount, parent_detail_id,
        is_checkout, merged, tax, created_date, updated_date, created_by_id, updated_by_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      checkin_id, finalHotelId, room_id, room_number, room_category_id, room_category_name,
      converted_category_id, converted_category_name, formattedCheckinDatetime, formattedCheckoutDatetime,
      no_of_days, adults, pax, ex_pax, child_unpaid, driver, room_tariff, ex_pax_charge,
      child_paid_amount, driver_charge, discount_percent, discount_amount || 0,
      cgst_percent, cgst_amount, sgst_percent, sgst_amount, igst_percent, igst_amount,
      cess_percent, cess_amount, service_charge, service_charge_amount, parent_detail_id,
      is_checkout, merged, tax, created_date, created_date, userId, userId
    ]);

    res.status(200).json({
      success: true,
      message: "Detail added successfully",
      data: { detail_id: result.insertId, ...req.body, hotelid: finalHotelId }
    });
  } catch (error) {
    console.error("Error adding detail:", error);
    res.status(500).json({ success: false, message: "Failed to add detail", error: error.message });
  }
};

// ADD DETAIL BULK - For multiple days
exports.addDetailBulk = async (req, res) => {
  try {
    const { details } = req.body;
    
    if (!details || !Array.isArray(details) || details.length === 0) {
      return res.status(400).json({ success: false, message: "No details to insert" });
    }

    const insertedDetails = [];
    
    for (const detail of details) {
      const {
        checkin_id, hotelid, room_id, room_number, room_category_id, room_category_name,
        converted_category_id, converted_category_name, checkin_datetime, checkout_datetime,
        no_of_days, adults, pax, ex_pax, child_unpaid, driver, room_tariff, ex_pax_charge,
        child_paid_amount, driver_charge, discount_percent, discount_amount,
        cgst_percent, cgst_amount, sgst_percent, sgst_amount, igst_percent, igst_amount,
        cess_percent, cess_amount, service_charge, service_charge_amount, parent_detail_id,
        is_checkout = 0, merged = 0, tax, created_by_id
      } = detail;

      const userId = created_by_id || 1;
      const created_date = new Date();

      // Format datetime values
      const formattedCheckinDatetime = formatDateTime(checkin_datetime);
      const formattedCheckoutDatetime = formatDateTime(checkout_datetime);

      const [result] = await db.query(`
        INSERT INTO checkin_detail_master (
          checkin_id, hotelid, room_id, room_number, room_category_id, room_category_name,
          converted_category_id, converted_category_name, checkin_datetime, checkout_datetime,
          no_of_days, adults, pax, ex_pax, child_unpaid, driver, room_tariff, ex_pax_charge,
          child_paid_amount, driver_charge, discount_percent, discount_amount,
          cgst_percent, cgst_amount, sgst_percent, sgst_amount, igst_percent, igst_amount,
          cess_percent, cess_amount, service_charge, service_charge_amount, parent_detail_id,
          is_checkout, merged, tax, created_date, updated_date, created_by_id, updated_by_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        checkin_id, hotelid, room_id, room_number, room_category_id, room_category_name,
        converted_category_id, converted_category_name, formattedCheckinDatetime, formattedCheckoutDatetime,
        no_of_days, adults, pax, ex_pax, child_unpaid, driver, room_tariff, ex_pax_charge,
        child_paid_amount, driver_charge, discount_percent, discount_amount || 0,
        cgst_percent, cgst_amount, sgst_percent, sgst_amount, igst_percent, igst_amount,
        cess_percent, cess_amount, service_charge, service_charge_amount, parent_detail_id,
        is_checkout, merged, tax, created_date, created_date, userId, userId
      ]);

      insertedDetails.push({ detail_id: result.insertId, ...detail });
    }

    res.status(200).json({
      success: true,
      message: "Details added successfully",
      data: insertedDetails
    });
  } catch (error) {
    console.error("Error adding bulk details:", error);
    res.status(500).json({ success: false, message: "Failed to add details", error: error.message });
  }
};

// ADD EXTENSION DETAIL - For day extension (single day or multiple days)
exports.addExtensionDetail = async (req, res) => {
  try {
    const {
      checkin_id, hotelid, room_id, room_number, room_category_id, room_category_name,
      converted_category_id, converted_category_name, checkin_datetime, checkout_datetime,
      no_of_days, adults, pax, ex_pax, child_unpaid, driver, room_tariff, ex_pax_charge,
      child_paid_amount, driver_charge, discount_percent, discount_amount,
      cgst_percent, cgst_amount, sgst_percent, sgst_amount, igst_percent, igst_amount,
      cess_percent, cess_amount, service_charge, service_charge_amount, parent_detail_id,
      tax
    } = req.body;

    const userId = getCurrentUserId(req);
    let finalHotelId = hotelid || getCurrentUserHotelId(req);
    const created_date = new Date();

    if (!finalHotelId) {
      return res.status(400).json({ success: false, message: "Hotel ID not found" });
    }

    // Format datetime values
    const formattedCheckinDatetime = formatDateTime(checkin_datetime);
    const formattedCheckoutDatetime = formatDateTime(checkout_datetime);

    const [result] = await db.query(`
      INSERT INTO checkin_detail_master (
        checkin_id, hotelid, room_id, room_number, room_category_id, room_category_name,
        converted_category_id, converted_category_name, checkin_datetime, checkout_datetime,
        no_of_days, adults, pax, ex_pax, child_unpaid, driver, room_tariff, ex_pax_charge,
        child_paid_amount, driver_charge, discount_percent, discount_amount,
        cgst_percent, cgst_amount, sgst_percent, sgst_amount, igst_percent, igst_amount,
        cess_percent, cess_amount, service_charge, service_charge_amount, parent_detail_id,
        is_checkout, merged, tax, created_date, updated_date, created_by_id, updated_by_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?)
    `, [
      checkin_id, finalHotelId, room_id, room_number, room_category_id, room_category_name,
      converted_category_id, converted_category_name, formattedCheckinDatetime, formattedCheckoutDatetime,
      no_of_days, adults, pax, ex_pax, child_unpaid, driver, room_tariff, ex_pax_charge,
      child_paid_amount, driver_charge, discount_percent, discount_amount,
      cgst_percent, cgst_amount, sgst_percent, sgst_amount, igst_percent, igst_amount,
      cess_percent, cess_amount, service_charge, service_charge_amount, parent_detail_id,
      tax, created_date, created_date, userId, userId
    ]);

    res.status(200).json({
      success: true,
      message: "Extension detail added successfully",
      data: { detail_id: result.insertId, ...req.body, hotelid: finalHotelId }
    });
  } catch (error) {
    console.error("Error adding extension detail:", error);
    res.status(500).json({ success: false, message: "Failed to add extension detail", error: error.message });
  }
};

// UPDATE detail
exports.updateDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = getCurrentUserId(req);
    const updated_date = new Date();

    const [existing] = await db.query('SELECT detail_id FROM checkin_detail_master WHERE detail_id = ?', [id]);
    if (!existing[0]) {
      return res.status(404).json({ success: false, message: "Detail not found" });
    }

    const allowedFields = [
      'checkin_id', 'hotelid', 'room_id', 'room_number', 'room_category_id', 'room_category_name',
      'converted_category_id', 'converted_category_name', 'checkin_datetime', 'checkout_datetime',
      'no_of_days', 'adults', 'pax', 'ex_pax', 'child_unpaid', 'driver', 'room_tariff', 'ex_pax_charge',
      'child_paid_amount', 'driver_charge', 'discount_percent', 'discount_amount',
      'cgst_percent', 'cgst_amount', 'sgst_percent', 'sgst_amount', 'igst_percent', 'igst_amount',
      'cess_percent', 'cess_amount', 'service_charge', 'service_charge_amount', 'parent_detail_id',
      'is_checkout', 'merged', 'tax'
    ];

    const updates = [];
    const values = [];
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updates.push(`${field} = ?`);
        // Format datetime fields if they are being updated
        if (field === 'checkin_datetime' || field === 'checkout_datetime') {
          values.push(formatDateTime(updateData[field]));
        } else {
          values.push(updateData[field]);
        }
      }
    });

    updates.push('updated_by_id = ?', 'updated_date = ?');
    values.push(userId, updated_date, id);

    const query = `UPDATE checkin_detail_master SET ${updates.join(', ')} WHERE detail_id = ?`;
    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Detail not found or no changes" });
    }

    res.status(200).json({
      success: true,
      message: "Detail updated successfully",
      data: { detail_id: parseInt(id), ...updateData }
    });
  } catch (error) {
    console.error("Error updating detail:", error);
    res.status(500).json({ success: false, message: "Failed to update detail", error: error.message });
  }
};

// DELETE detail
exports.deleteDetail = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [existing] = await db.query('SELECT detail_id FROM checkin_detail_master WHERE detail_id = ?', [id]);
    if (!existing[0]) {
      return res.status(404).json({ success: false, message: "Detail not found" });
    }

    const [result] = await db.query('DELETE FROM checkin_detail_master WHERE detail_id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Detail not found" });
    }

    res.status(200).json({ success: true, message: "Detail deleted successfully", data: { detail_id: parseInt(id) } });
  } catch (error) {
    console.error("Error deleting detail:", error);
    res.status(500).json({ success: false, message: "Failed to delete detail", error: error.message });
  }
};