// checkInController.js - Updated with proper checkout_datetime update on extension

const db = require('../../../config/db');

const getCurrentUserId = (req) => req.user?.id || null;
const getCurrentUserHotelId = (req) => req.user?.hotelid || null;

// Helper function to parse and validate decimal values
const parseDecimal = (value, defaultValue = 0) => {
  if (value === null || value === undefined) return defaultValue;
  const parsed = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  return isNaN(parsed) ? defaultValue : parsed;
};

// Helper function to format datetime for MySQL
const formatDateTime = (dateValue) => {
  if (!dateValue) return null;
  
  // If it's already a Date object
  if (dateValue instanceof Date) {
    return dateValue.toISOString().slice(0, 19).replace('T', ' ');
  }
  
  // If it's a string in ISO format
  if (typeof dateValue === 'string' && dateValue.includes('T')) {
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toISOString().slice(0, 19).replace('T', ' ');
    }
  }
  
  // If it's already in correct MySQL format
  if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  
  return dateValue;
};

// Get next registration number
exports.getNextRegNumber = async (req, res) => {
  try {
    let hotelId = req.query.hotelid;
    if (!hotelId) hotelId = getCurrentUserHotelId(req);
    if (!hotelId) return res.status(400).json({ success: false, message: "Hotel ID not found" });

    const [rows] = await db.query(
      `SELECT MAX(CAST(reg_no AS UNSIGNED)) as max_num FROM CheckIn_Master WHERE hotelid = ?`,
      [hotelId]
    );
    const nextNumber = (rows[0]?.max_num || 0) + 1;
    const nextRegNo = nextNumber.toString().padStart(4, '0');

    res.json({ success: true, data: { reg_no: nextRegNo } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

// GET all check-ins
exports.getCheckins = async (req, res) => {
  try {
    let hotelId = req.query.hotelid;
    if (!hotelId) hotelId = getCurrentUserHotelId(req);
    if (!hotelId) return res.status(400).json({ success: false, message: "Hotel ID not found" });

    const [checkins] = await db.query(`
      SELECT checkin_id, guest_id, guest_name, address, mobile, company_name,
             emailed, booking, plan_name,
             reg_no, special_instruction, message,
             checkin_datetime, checkout_datetime, room_no,
             category_id, converted_category, adults, pax, pax_charges,
             ex_pax, ex_pax_charge, child_paid, child_unpaid, child_charge,
             driver, driver_charge, hotelid, id_type, id_number, department_id,
             department_name, created_by_id, created_date, updated_by_id,
             updated_date, status, total_nights, total_amount
      FROM CheckIn_Master
      WHERE hotelid = ?
      ORDER BY checkin_datetime DESC
    `, [hotelId]);

    res.json({ success: true, message: "Data fetched successfully", data: checkins });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

// GET today's checkouts
exports.getTodayCheckouts = async (req, res) => {
  try {
    let hotelId = req.query.hotelid;
    if (!hotelId) hotelId = getCurrentUserHotelId(req);
    if (!hotelId) return res.status(400).json({ success: false, message: "Hotel ID not found" });

    const [checkouts] = await db.query(`
      SELECT 
        c.checkin_id,
        c.guest_name,
        c.reg_no,
        c.room_no,
        c.booking,
        c.plan_name,
        c.adults,
        c.pax,
        c.ex_pax,
        c.child_paid,
        c.child_unpaid,
        c.driver,
        c.checkin_datetime,
        c.checkout_datetime,
        c.total_nights,
        c.total_amount,
        c.status,
        c.converted_category,
        rc.category_name as room_category_name
      FROM CheckIn_Master c
      LEFT JOIN room_category rc ON c.category_id = rc.room_category_id
      WHERE c.hotelid = ?
        AND c.status = 'active'
        AND DATE(c.checkout_datetime) = CURDATE()
      ORDER BY c.checkout_datetime ASC
    `, [hotelId]);

    const processedCheckouts = [];
    for (const checkout of checkouts) {
      const [folioResult] = await db.query(`
        SELECT SUM(debit_amount) as total_debit, SUM(credit_amount) as total_credit
        FROM guest_folio_master
        WHERE checkin_id = ?
      `, [checkout.checkin_id]);
      
      const totalDebit = Number(folioResult[0]?.total_debit) || 0;
      const totalCredit = Number(folioResult[0]?.total_credit) || 0;
      const folioTotal = totalDebit - totalCredit;
      
      const totalChildCount = (checkout.child_paid || 0) + (checkout.child_unpaid || 0);
      
      processedCheckouts.push({
        ...checkout,
        child_count: totalChildCount,
        folio_total: folioTotal,
        room_category: checkout.room_category_name || checkout.converted_category || 'N/A'
      });
    }

    res.json({ success: true, message: "Data fetched successfully", data: processedCheckouts });
  } catch (error) {
    console.error("Error fetching today's checkouts:", error);
    res.status(500).json({ success: false, message: "Database error", error: error.message });
  }
};

// GET single check-in by ID
exports.getCheckinById = async (req, res) => {
  try {
    const { id } = req.params;
    const [checkins] = await db.query(`
      SELECT * FROM CheckIn_Master WHERE checkin_id = ?
    `, [id]);
    
    const checkin = checkins[0];
    if (!checkin) {
      return res.status(404).json({ success: false, message: "Check-in not found" });
    }

    res.json({ success: true, message: "Data fetched successfully", data: checkin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

// CREATE check-in
exports.addCheckin = async (req, res) => {
  try {
    let {
      guest_id, guest_name, address, mobile, company_name, emailed, booking,
      plan_name, reg_no, special_instruction, message,
      checkin_datetime, checkout_datetime, room_no, category_id, converted_category,
      adults, pax, pax_charges, ex_pax, ex_pax_charge, child_paid, child_unpaid, child_charge,
      driver, driver_charge, hotelid, id_type, id_number, department_id,
      department_name, status = 'active', created_by_id, room_ids, total_nights,
      total_amount
    } = req.body;

    pax_charges = parseDecimal(pax_charges);
    ex_pax_charge = parseDecimal(ex_pax_charge);
    child_charge = parseDecimal(child_charge);
    driver_charge = parseDecimal(driver_charge);
    total_amount = parseDecimal(total_amount);

    const authUserId = getCurrentUserId(req);
    const userId = created_by_id || authUserId;
    let finalHotelId = hotelid || getCurrentUserHotelId(req);
    const created_date = new Date();

    if (!finalHotelId) {
      return res.status(400).json({ success: false, message: "Hotel ID not found" });
    }

    let finalRegNo = reg_no;
    if (!finalRegNo) {
      const [rows] = await db.query(
        `SELECT MAX(CAST(reg_no AS UNSIGNED)) as max_num FROM CheckIn_Master WHERE hotelid = ?`,
        [finalHotelId]
      );
      const nextNumber = (rows[0]?.max_num || 0) + 1;
      finalRegNo = nextNumber.toString().padStart(4, '0');
    }

    const finalTotalAmount = total_amount || (pax_charges + ex_pax_charge + child_charge + driver_charge);
    const finalTotalNights = total_nights || 1;

    const [result] = await db.query(`
      INSERT INTO CheckIn_Master (
        guest_id, guest_name, address, mobile, company_name, emailed, booking,
        total_amount,
        plan_name, reg_no, special_instruction, message,
        checkin_datetime, checkout_datetime, room_no, category_id, converted_category,
        adults, pax, pax_charges, ex_pax, ex_pax_charge, child_paid, child_unpaid, child_charge,
        driver, driver_charge, hotelid, id_type, id_number, department_id,
        department_name, created_by_id, created_date, status, total_nights
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      guest_id, guest_name, address, mobile, company_name, emailed, booking,
      finalTotalAmount,
      plan_name, finalRegNo, special_instruction, message,
      formatDateTime(checkin_datetime), formatDateTime(checkout_datetime), room_no, category_id, converted_category,
      adults, pax, pax_charges, ex_pax, ex_pax_charge, child_paid, child_unpaid, child_charge,
      driver, driver_charge, finalHotelId, id_type, id_number, department_id,
      department_name, userId, created_date, status, finalTotalNights
    ]);

    const checkinId = result.insertId;

    if (room_ids && Array.isArray(room_ids) && room_ids.length > 0) {
      const updated_date = new Date();
      for (const roomId of room_ids) {
        await db.query(
          `UPDATE room_master 
           SET room_status = 'occupied', updated_by_id = ?, updated_date = ? 
           WHERE room_id = ? AND hotelid = ?`,
          [userId, updated_date, roomId, finalHotelId]
        );
      }
    }

    res.status(200).json({
      success: true,
      message: "Check-in added successfully",
      data: { checkin_id: checkinId, reg_no: finalRegNo, total_amount: finalTotalAmount, ...req.body, hotelid: finalHotelId, created_by_id: userId }
    });
  } catch (error) {
    console.error("Error adding check-in:", error);
    res.status(500).json({ success: false, message: "Failed to add check-in", error: error.message });
  }
};

// UPDATE check-in (full update)
exports.updateCheckin = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = getCurrentUserId(req);
    const updated_date = new Date();

    const [existing] = await db.query('SELECT hotelid FROM CheckIn_Master WHERE checkin_id = ?', [id]);
    if (!existing[0]) {
      return res.status(404).json({ success: false, message: "Check-in not found" });
    }

    const allowedFields = [
      'guest_id', 'guest_name', 'address', 'mobile', 'company_name', 'emailed',
      'booking', 'plan_name', 'reg_no', 'special_instruction', 'message',
      'checkin_datetime', 'checkout_datetime', 'room_no', 'category_id',
      'converted_category', 'adults', 'pax', 'pax_charges', 'ex_pax', 'ex_pax_charge',
      'child_paid', 'child_unpaid', 'child_charge', 'driver', 'driver_charge', 
      'id_type', 'id_number', 'department_id', 'department_name', 'status', 'total_nights',
      'total_amount'
    ];

    const updates = [];
    const values = [];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        let value = updateData[field];
        
        if (['pax_charges', 'ex_pax_charge', 'child_charge', 'driver_charge', 'total_amount'].includes(field)) {
          value = parseDecimal(value);
        }
        
        if (field === 'checkin_datetime' || field === 'checkout_datetime') {
          value = formatDateTime(value);
        }
        
        updates.push(`${field} = ?`);
        values.push(value);
      }
    });

    updates.push('updated_by_id = ?', 'updated_date = ?');
    values.push(userId, updated_date, id);

    const query = `UPDATE CheckIn_Master SET ${updates.join(', ')} WHERE checkin_id = ?`;
    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Check-in not found or no changes" });
    }

    res.status(200).json({
      success: true,
      message: "Check-in updated successfully",
      data: { checkin_id: parseInt(id), ...updateData }
    });
  } catch (error) {
    console.error("Error updating check-in:", error);
    res.status(500).json({ success: false, message: "Failed to update check-in", error: error.message });
  }
};

// PARTIAL UPDATE - Only updates checkout_datetime and total_amount for day extension
exports.updateCheckinPartial = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = getCurrentUserId(req);
    const updated_date = new Date();

    const [existing] = await db.query('SELECT checkin_id, total_amount, checkout_datetime FROM CheckIn_Master WHERE checkin_id = ?', [id]);
    if (!existing[0]) {
      return res.status(404).json({ success: false, message: "Check-in not found" });
    }

    const allowedFields = ['total_amount', 'total_nights', 'checkout_datetime', 'status'];
    
    const updates = [];
    const values = [];
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        let value = updateData[field];
        
        if (field === 'total_amount') {
          const parsedValue = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
          if (isNaN(parsedValue)) {
            return res.status(400).json({ 
              success: false, 
              message: `Invalid value for ${field}: ${value} is not a valid number` 
            });
          }
          value = Math.round(parsedValue * 100) / 100;
        }
        
        if (field === 'total_nights') {
          value = parseInt(value);
          if (isNaN(value)) value = 1;
        }
        
        if (field === 'checkout_datetime') {
          value = formatDateTime(value);
        }
        
        updates.push(`${field} = ?`);
        values.push(value);
      }
    });

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: "No valid fields to update" });
    }

    updates.push('updated_by_id = ?', 'updated_date = ?');
    values.push(userId, updated_date, id);

    const query = `UPDATE CheckIn_Master SET ${updates.join(', ')} WHERE checkin_id = ?`;
    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Check-in not found or no changes" });
    }

    const [updated] = await db.query('SELECT * FROM CheckIn_Master WHERE checkin_id = ?', [id]);

    res.status(200).json({
      success: true,
      message: "Check-in updated partially successfully",
      data: updated[0]
    });
  } catch (error) {
    console.error("Error in partial update:", error);
    res.status(500).json({ success: false, message: "Failed to update check-in", error: error.message });
  }
};

// EXTEND check-in stay - UPDATED to update checkout_datetime in CheckIn_Master
exports.extendCheckinStay = async (req, res) => {
  try {
    const { id } = req.params;
    let { 
      additionalDays, 
      newCheckoutDatetime, 
      additionalAmount, 
      newTotalNights, 
      newTotalAmount,
      roomId,
      detailId,
      extensionDetails 
    } = req.body;
    
    const userId = getCurrentUserId(req);
    const updated_date = new Date();

    additionalDays = parseInt(additionalDays) || 0;
    additionalAmount = parseDecimal(additionalAmount);
    newTotalNights = newTotalNights ? parseInt(newTotalNights) : null;
    newTotalAmount = newTotalAmount ? parseDecimal(newTotalAmount) : null;

    const [existing] = await db.query(
      'SELECT total_nights, total_amount, checkout_datetime, checkin_datetime FROM CheckIn_Master WHERE checkin_id = ?', 
      [id]
    );
    
    if (!existing[0]) {
      return res.status(404).json({ success: false, message: "Check-in not found" });
    }

    const currentTotalNights = parseFloat(existing[0].total_nights) || 1;
    const currentTotalAmount = parseDecimal(existing[0].total_amount);
    let currentCheckout = existing[0].checkout_datetime;

    let updatedTotalNights = newTotalNights || (currentTotalNights + additionalDays);
    let updatedTotalAmount = newTotalAmount || (currentTotalAmount + additionalAmount);
    updatedTotalAmount = Math.round(updatedTotalAmount * 100) / 100;

    let finalNewCheckoutDatetime = newCheckoutDatetime;
    if (!finalNewCheckoutDatetime && additionalDays > 0) {
      const currentCheckoutDate = new Date(currentCheckout);
      const newDate = new Date(currentCheckoutDate);
      newDate.setDate(currentCheckoutDate.getDate() + additionalDays);
      finalNewCheckoutDatetime = formatDateTime(newDate);
    }

    const query = `
      UPDATE CheckIn_Master 
      SET total_nights = ?, 
          total_amount = ?, 
          checkout_datetime = ?,
          updated_by_id = ?, 
          updated_date = ? 
      WHERE checkin_id = ?
    `;
    
    const [result] = await db.query(query, [
      updatedTotalNights, 
      updatedTotalAmount, 
      finalNewCheckoutDatetime || currentCheckout, 
      userId, 
      updated_date, 
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Check-in not found" });
    }

    if (detailId) {
      await db.query(`
        UPDATE detail_master 
        SET is_checkout = 1, merged = 1, updated_date = ?
        WHERE detail_id = ?
      `, [updated_date, detailId]);
    }

    res.status(200).json({
      success: true,
      message: `Stay extended by ${additionalDays} day(s) successfully`,
      data: { 
        checkin_id: parseInt(id), 
        total_nights: updatedTotalNights, 
        total_amount: updatedTotalAmount,
        checkout_datetime: finalNewCheckoutDatetime || currentCheckout
      }
    });
  } catch (error) {
    console.error("Error extending check-in stay:", error);
    res.status(500).json({ success: false, message: "Failed to extend stay", error: error.message });
  }
};

// DELETE check-in
exports.deleteCheckin = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query('SELECT hotelid FROM CheckIn_Master WHERE checkin_id = ?', [id]);
    if (!existing[0]) {
      return res.status(404).json({ success: false, message: "Check-in not found" });
    }

    const [result] = await db.query('DELETE FROM CheckIn_Master WHERE checkin_id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Check-in not found" });
    }

    res.status(200).json({ success: true, message: "Check-in deleted successfully", data: { checkin_id: parseInt(id) } });
  } catch (error) {
    console.error("Error deleting check-in:", error);
    res.status(500).json({ success: false, message: "Failed to delete check-in", error: error.message });
  }
};

// GET check-in by ID for extension
exports.getCheckinByIdForExtension = async (req, res) => {
  try {
    const { id } = req.params;
    const [checkins] = await db.query(`
      SELECT * FROM CheckIn_Master WHERE checkin_id = ?
    `, [id]);
    
    const checkin = checkins[0];
    if (!checkin) {
      return res.status(404).json({ success: false, message: "Check-in not found" });
    }

    res.json({ success: true, message: "Data fetched successfully", data: checkin });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

// GET details by checkin_id
exports.getDetailsByCheckinId = async (req, res) => {
  try {
    const { checkin_id } = req.params;
    const [details] = await db.query(`
      SELECT * FROM detail_master 
      WHERE checkin_id = ? AND is_checkout = 0
      ORDER BY detail_id DESC
    `, [checkin_id]);
    
    res.json({ success: true, message: "Data fetched successfully", data: details });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};