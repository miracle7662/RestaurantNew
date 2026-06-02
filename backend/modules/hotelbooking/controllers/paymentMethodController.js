// paymentMethodController.js - MySQL Version
const db = require('../../../config/db');

// Get all payment methods (optionally filter by status)
exports.getPaymentMethods = async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM payment_method_master';
    const params = [];

    if (status !== undefined) {
      query += ' WHERE status = ?';
      params.push(status);
    }

    query += ' ORDER BY payment_method_name ASC';

    const [methods] = await db.query(query, params);
    res.json({ success: true, data: methods });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

// Get a single payment method by ID
exports.getPaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const [methods] = await db.query('SELECT * FROM payment_method_master WHERE id = ?', [id]);
    const method = methods[0];

    if (!method) {
      return res.status(404).json({ success: false, message: 'Payment method not found' });
    }

    res.json({ success: true, data: method });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
};

// Create a new payment method
exports.addPaymentMethod = async (req, res) => {
  try {
    const { payment_method_name, status } = req.body;

    if (!payment_method_name) {
      return res.status(400).json({ success: false, message: 'Payment method name is required' });
    }

    // Check for duplicate
    const [existing] = await db.query(
      'SELECT id FROM payment_method_master WHERE payment_method_name = ?',
      [payment_method_name]
    );
    
    if (existing[0]) {
      return res.status(400).json({ success: false, message: 'Payment method already exists' });
    }

    const [result] = await db.query(`
      INSERT INTO payment_method_master (payment_method_name, status)
      VALUES (?, ?)
    `, [payment_method_name, status !== undefined ? status : 1]);

    const [newMethod] = await db.query('SELECT * FROM payment_method_master WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, data: newMethod[0] });
  } catch (error) {
    console.error('Error adding payment method:', error);
    res.status(500).json({ success: false, message: 'Failed to add payment method', error: error.message });
  }
};

// Update an existing payment method
exports.updatePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method_name, status } = req.body;

    const [existing] = await db.query('SELECT * FROM payment_method_master WHERE id = ?', [id]);
    if (!existing[0]) {
      return res.status(404).json({ success: false, message: 'Payment method not found' });
    }

    // Check for duplicate (excluding current record)
    if (payment_method_name && payment_method_name !== existing[0].payment_method_name) {
      const [duplicate] = await db.query(
        'SELECT id FROM payment_method_master WHERE payment_method_name = ? AND id != ?',
        [payment_method_name, id]
      );
      if (duplicate[0]) {
        return res.status(400).json({ success: false, message: 'Payment method name already exists' });
      }
    }

    const updates = [];
    const values = [];

    if (payment_method_name !== undefined) {
      updates.push('payment_method_name = ?');
      values.push(payment_method_name);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }

    updates.push('updated_date = CURRENT_TIMESTAMP');

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update' });
    }

    values.push(id);
    const updateSql = `UPDATE payment_method_master SET ${updates.join(', ')} WHERE id = ?`;
    await db.query(updateSql, values);

    const [updated] = await db.query('SELECT * FROM payment_method_master WHERE id = ?', [id]);
    res.json({ success: true, data: updated[0] });
  } catch (error) {
    console.error('Error updating payment method:', error);
    res.status(500).json({ success: false, message: 'Failed to update payment method', error: error.message });
  }
};

// Delete a payment method
exports.deletePaymentMethod = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await db.query('SELECT * FROM payment_method_master WHERE id = ?', [id]);
    if (!existing[0]) {
      return res.status(404).json({ success: false, message: 'Payment method not found' });
    }

    await db.query('DELETE FROM payment_method_master WHERE id = ?', [id]);
    res.json({ success: true, message: 'Payment method deleted', data: { id: parseInt(id) } });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ success: false, message: 'Failed to delete payment method', error: error.message });
  }
};