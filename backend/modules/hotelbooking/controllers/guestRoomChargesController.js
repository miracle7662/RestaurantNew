// guestRoomChargesController.js - MySQL Version with datetime fields
const db = require('../../../config/db');

const getCurrentUserId = (req) => req.user?.id || null;

// Converts any datetime value to MySQL DATETIME format 'YYYY-MM-DD HH:MM:SS'
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

// GET all charges
exports.getCharges = async (req, res) => {
  try {
    const { guest_id, room_id, checkin_id } = req.query;
    let query = `SELECT * FROM checkin_guest_room_charges`;
    const params = [];
    const conditions = [];

    if (guest_id) {
      conditions.push(`guest_id = ?`);
      params.push(guest_id);
    }
    if (room_id) {
      conditions.push(`room_id = ?`);
      params.push(room_id);
    }
    if (checkin_id) {
      conditions.push(`checkin_id = ?`);
      params.push(checkin_id);
    }
    if (conditions.length) {
      query += ` WHERE ` + conditions.join(' AND ');
    }
    query += ` ORDER BY guest_room_charges_id DESC`;

    const [charges] = await db.query(query, params);
    res.json({ success: true, data: charges });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

// GET charge by ID
exports.getChargeById = async (req, res) => {
  try {
    const { id } = req.params;
    const [charges] = await db.query('SELECT * FROM checkin_guest_room_charges WHERE guest_room_charges_id = ?', [id]);
    const charge = charges[0];
    
    if (!charge) {
      return res.status(404).json({ success: false, message: 'Charge not found' });
    }
    res.json({ success: true, data: charge });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

// ADD charge - UPDATED with checkin_datetime and checkout_datetime
exports.addCharge = async (req, res) => {
  try {
    const {
      guest_id, room_id, category_id, checkin_id,
      pax_count, pax_price, pax_tax,
      ex_pax_count, ex_pax_price, ex_pax_tax, ex_pax_tax_percent, ex_pax_total,
      child_count, child_price, child_tax, child_tax_percent, child_total,
      driver_count, driver_price, driver_tax, driver_tax_percent, driver_total,
      total_amount,
      // NEW FIELDS
      checkin_datetime,
      checkout_datetime
    } = req.body;

    const created_date = new Date();

    const [result] = await db.query(`
      INSERT INTO checkin_guest_room_charges (
        guest_id, room_id, category_id, checkin_id,
        pax_count, pax_price, pax_tax,
        ex_pax_count, ex_pax_price, ex_pax_tax, ex_pax_tax_percent, ex_pax_total,
        child_count, child_price, child_tax, child_tax_percent, child_total,
        driver_count, driver_price, driver_tax, driver_tax_percent, driver_total,
        total_amount,
        checkin_datetime, checkout_datetime,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      guest_id, room_id, category_id, checkin_id,
      pax_count || null, pax_price || null, pax_tax || null,
      ex_pax_count || null, ex_pax_price || null, ex_pax_tax || null, ex_pax_tax_percent || null, ex_pax_total || null,
      child_count || null, child_price || null, child_tax || null, child_tax_percent || null, child_total || null,
      driver_count || null, driver_price || null, driver_tax || null, driver_tax_percent || null, driver_total || null,
      total_amount || null,
      formatDateTime(checkin_datetime) || null,
      formatDateTime(checkout_datetime) || null,
      created_date, created_date
    ]);

    res.status(201).json({
      success: true,
      message: 'Charge record added successfully',
      data: { guest_room_charges_id: result.insertId, ...req.body }
    });
  } catch (error) {
    console.error('Error adding charge:', error);
    res.status(500).json({ success: false, message: 'Failed to add charge record', error: error.message });
  }
};

// UPDATE charge - UPDATED with datetime fields
exports.updateCharge = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const updated_date = new Date();

    const [existing] = await db.query('SELECT guest_room_charges_id FROM checkin_guest_room_charges WHERE guest_room_charges_id = ?', [id]);
    if (!existing[0]) {
      return res.status(404).json({ success: false, message: 'Charge not found' });
    }

    const allowedFields = [
      'guest_id', 'room_id', 'category_id', 'checkin_id',
      'pax_count', 'pax_price', 'pax_tax',
      'ex_pax_count', 'ex_pax_price', 'ex_pax_tax', 'ex_pax_tax_percent', 'ex_pax_total',
      'child_count', 'child_price', 'child_tax', 'child_tax_percent', 'child_total',
      'driver_count', 'driver_price', 'driver_tax', 'driver_tax_percent', 'driver_total',
      'total_amount',
      'checkin_datetime', 'checkout_datetime'
    ];

    const updates = [];
    const values = [];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(updateData[field]);
      }
    });

    updates.push('updated_at = ?');
    values.push(updated_date, id);

    const query = `UPDATE checkin_guest_room_charges SET ${updates.join(', ')} WHERE guest_room_charges_id = ?`;
    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Charge not found or no changes' });
    }

    res.json({ success: true, message: 'Charge updated successfully', data: { guest_room_charges_id: parseInt(id), ...updateData } });
  } catch (error) {
    console.error('Error updating charge:', error);
    res.status(500).json({ success: false, message: 'Failed to update charge record', error: error.message });
  }
};

// DELETE charge
exports.deleteCharge = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [existing] = await db.query('SELECT guest_room_charges_id FROM checkin_guest_room_charges WHERE guest_room_charges_id = ?', [id]);
    if (!existing[0]) {
      return res.status(404).json({ success: false, message: 'Charge not found' });
    }

    const [result] = await db.query('DELETE FROM checkin_guest_room_charges WHERE guest_room_charges_id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Charge not found' });
    }

    res.json({ success: true, message: 'Charge deleted successfully', data: { guest_room_charges_id: parseInt(id) } });
  } catch (error) {
    console.error('Error deleting charge:', error);
    res.status(500).json({ success: false, message: 'Failed to delete charge record', error: error.message });
  }
};

// ADD BULK charges - UPDATED with checkin_datetime and checkout_datetime
exports.addChargeBulk = async (req, res) => {
  try {
    const { charges } = req.body;
    
    if (!charges || !Array.isArray(charges) || charges.length === 0) {
      return res.status(400).json({ success: false, message: "No charges to insert" });
    }

    const insertedCharges = [];
    
    for (const charge of charges) {
      const {
        guest_id, room_id, category_id, checkin_id,
        pax_count, pax_price, pax_tax,
        ex_pax_count, ex_pax_price, ex_pax_tax, ex_pax_tax_percent, ex_pax_total,
        child_count, child_price, child_tax, child_tax_percent, child_total,
        driver_count, driver_price, driver_tax, driver_tax_percent, driver_total,
        total_amount,
        checkin_datetime,
        checkout_datetime
      } = charge;

      const created_date = new Date();

      const [result] = await db.query(`
        INSERT INTO checkin_guest_room_charges (
          guest_id, room_id, category_id, checkin_id,
          pax_count, pax_price, pax_tax,
          ex_pax_count, ex_pax_price, ex_pax_tax, ex_pax_tax_percent, ex_pax_total,
          child_count, child_price, child_tax, child_tax_percent, child_total,
          driver_count, driver_price, driver_tax, driver_tax_percent, driver_total,
          total_amount,
          checkin_datetime, checkout_datetime,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        guest_id, room_id, category_id, checkin_id,
        pax_count || null, pax_price || null, pax_tax || null,
        ex_pax_count || null, ex_pax_price || null, ex_pax_tax || null, ex_pax_tax_percent || null, ex_pax_total || null,
        child_count || null, child_price || null, child_tax || null, child_tax_percent || null, child_total || null,
        driver_count || null, driver_price || null, driver_tax || null, driver_tax_percent || null, driver_total || null,
        total_amount || null,
        formatDateTime(checkin_datetime) || null,
        formatDateTime(checkout_datetime) || null,
        created_date, created_date
      ]);

      insertedCharges.push({ guest_room_charges_id: result.insertId, ...charge });
    }

    res.status(201).json({
      success: true,
      message: "Charge records added successfully",
      data: insertedCharges
    });
  } catch (error) {
    console.error("Error adding bulk charges:", error);
    res.status(500).json({ success: false, message: "Failed to add charge records", error: error.message });
  }
};

module.exports = exports;