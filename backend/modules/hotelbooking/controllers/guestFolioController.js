// guestFolioController.js - MySQL Version (Complete with date formatting)
const db = require('../../../config/db');

const getCurrentUserId = (req) => req.user?.id || null;
const getCurrentUserHotelId = (req) => req.user?.hotel_id || null;

// Helper function to format datetime for MySQL DATETIME column
const formatDateTime = (dateValue) => {
    if (!dateValue) return null;
    // If it's a Date object
    if (dateValue instanceof Date) {
        return dateValue.toISOString().slice(0, 19).replace('T', ' ');
    }
    const dateStr = String(dateValue);
    // If it's already in YYYY-MM-DD HH:MM:SS format
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(dateStr)) {
        return dateStr;
    }
    // If it's YYYY-MM-DD format (without time)
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return `${dateStr} 00:00:00`;
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().slice(0, 19).replace('T', ' ');
};

// GET all folio entries
exports.getFolioEntries = async (req, res) => {
  try {
    const { checkin_id } = req.query;
    let hotelId = req.query.hotelid || getCurrentUserHotelId(req);

    if (!hotelId && !checkin_id) {
      return res.status(400).json({ success: false, message: "Hotel ID or checkin_id required" });
    }

    let query = `SELECT * FROM guest_folio_master`;
    const params = [];

    if (checkin_id) {
      query += ` WHERE checkin_id = ?`;
      params.push(checkin_id);
    } else if (hotelId) {
      query += ` WHERE hotel_id = ?`;
      params.push(hotelId);
    }

    query += ` ORDER BY transaction_datetime DESC`;

    const [entries] = await db.query(query, params);
    res.json({ success: true, message: "Data fetched successfully", data: entries });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

// GET folio entry by ID
exports.getFolioEntryById = async (req, res) => {
  try {
    const { id } = req.params;
    const [entries] = await db.query('SELECT * FROM guest_folio_master WHERE folio_id = ?', [id]);
    const entry = entries[0];
    
    if (!entry) {
      return res.status(404).json({ success: false, message: "Folio entry not found" });
    }
    res.json({ success: true, message: "Data fetched successfully", data: entry });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

// ADD folio entry
exports.addFolioEntry = async (req, res) => {
  try {
    const {
      checkin_id, hotel_id, detail_id, transaction_type, transaction_datetime,
      description, debit_amount = 0, credit_amount = 0, reference_number, payment_method
    } = req.body;

    let currentPaymentMethod = payment_method || '';
    if (currentPaymentMethod && !isNaN(currentPaymentMethod) && currentPaymentMethod.trim() !== '') {
      const methodId = parseInt(currentPaymentMethod);
      const [methods] = await db.query(
        'SELECT payment_method_name FROM payment_method_master WHERE id = ? AND status = 1',
        [methodId]
      );
      const method = methods[0];
      currentPaymentMethod = method ? method.payment_method_name : currentPaymentMethod;
    }

    const userId = getCurrentUserId(req);
    let finalHotelId = hotel_id || req.body.hotelid || getCurrentUserHotelId(req);
    
    // Format dates properly
    const formattedTransactionDatetime = formatDateTime(transaction_datetime);
    const now = formatDateTime(new Date());

    if (!finalHotelId) {
      return res.status(400).json({ success: false, message: "Hotel ID not found" });
    }

    const [result] = await db.query(`
      INSERT INTO guest_folio_master (
        checkin_id, hotel_id, detail_id, transaction_type, transaction_datetime,
        description, debit_amount, credit_amount, reference_number, payment_method,
        created_by_id, created_date, updated_by_id, updated_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      checkin_id, finalHotelId, detail_id || null, transaction_type, 
      formattedTransactionDatetime || now,
      description, debit_amount, credit_amount, reference_number || null, currentPaymentMethod,
      userId, now, userId, now
    ]);

    res.status(200).json({
      success: true,
      message: "Folio entry added successfully",
      data: { folio_id: result.insertId, ...req.body, hotel_id: finalHotelId }
    });
  } catch (error) {
    console.error("Error adding folio entry:", error);
    res.status(500).json({ success: false, message: "Failed to add folio entry", error: error.message });
  }
};

// UPDATE folio entry
exports.updateFolioEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = getCurrentUserId(req);
    const now = formatDateTime(new Date());

    const [existing] = await db.query('SELECT folio_id FROM guest_folio_master WHERE folio_id = ?', [id]);
    if (!existing[0]) {
      return res.status(404).json({ success: false, message: "Folio entry not found" });
    }

    const allowedFields = [
      'checkin_id', 'hotel_id', 'detail_id', 'transaction_type', 'transaction_datetime',
      'description', 'debit_amount', 'credit_amount', 'reference_number', 'payment_method'
    ];

    const updates = [];
    const values = [];
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        updates.push(`${field} = ?`);
        // Format datetime fields
        if (field === 'transaction_datetime') {
          values.push(formatDateTime(updateData[field]));
        } else {
          values.push(updateData[field]);
        }
      }
    });

    updates.push('updated_by_id = ?', 'updated_date = ?');
    values.push(userId, now, id);

    const query = `UPDATE guest_folio_master SET ${updates.join(', ')} WHERE folio_id = ?`;
    const [result] = await db.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Folio entry not found or no changes" });
    }

    res.status(200).json({
      success: true,
      message: "Folio entry updated successfully",
      data: { folio_id: parseInt(id), ...updateData }
    });
  } catch (error) {
    console.error("Error updating folio entry:", error);
    res.status(500).json({ success: false, message: "Failed to update folio entry", error: error.message });
  }
};

// DELETE folio entry
exports.deleteFolioEntry = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [existing] = await db.query('SELECT folio_id FROM guest_folio_master WHERE folio_id = ?', [id]);
    if (!existing[0]) {
      return res.status(404).json({ success: false, message: "Folio entry not found" });
    }

    const [result] = await db.query('DELETE FROM guest_folio_master WHERE folio_id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Folio entry not found" });
    }

    res.status(200).json({ success: true, message: "Folio entry deleted successfully", data: { folio_id: parseInt(id) } });
  } catch (error) {
    console.error("Error deleting folio entry:", error);
    res.status(500).json({ success: false, message: "Failed to delete folio entry", error: error.message });
  }
};

// ADD BULK folio entries
exports.addFolioEntryBulk = async (req, res) => {
  try {
    const { folios } = req.body;
    
    if (!folios || !Array.isArray(folios) || folios.length === 0) {
      return res.status(400).json({ success: false, message: "No folios to insert" });
    }

    const insertedFolios = [];
    const now = formatDateTime(new Date());
    
    for (const folio of folios) {
      const {
        checkin_id, hotel_id, detail_id, transaction_type, transaction_datetime,
        description, debit_amount, credit_amount, reference_number, payment_method,
        created_by_id
      } = folio;

      const userId = created_by_id || 1;
      const formattedTransactionDatetime = formatDateTime(transaction_datetime) || now;

      const [result] = await db.query(`
        INSERT INTO guest_folio_master (
          checkin_id, hotel_id, detail_id, transaction_type, transaction_datetime,
          description, debit_amount, credit_amount, reference_number, payment_method,
          created_by_id, created_date, updated_by_id, updated_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        checkin_id, hotel_id, detail_id || null, transaction_type, formattedTransactionDatetime,
        description, debit_amount || 0, credit_amount || 0, reference_number || null, payment_method || null,
        userId, now, userId, now
      ]);

      insertedFolios.push({ folio_id: result.insertId, ...folio });
    }

    res.status(200).json({
      success: true,
      message: "Folio entries added successfully",
      data: insertedFolios
    });
  } catch (error) {
    console.error("Error adding bulk folio entries:", error);
    res.status(500).json({ success: false, message: "Failed to add folio entries", error: error.message });
  }
};