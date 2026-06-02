// controllers/stockController.js - COMPLETE FIXED VERSION
const db = require('../../../config/db');

const getCurrentUserId = (req) => {
  // Check multiple possible locations for user ID
  return req.user?.id || req.user?.userid || req.body?.user_id || req.query?.user_id || null;
};

const getCurrentUserHotelId = (req) => {
  return req.user?.hotelid || req.user?.hotel_id || req.body?.hotelid || req.query?.hotelid || null;
};

// Helper to ensure date is properly formatted
const formatDateForDB = (date) => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 19).replace('T', ' ');
};

// ==================== STOCK ITEMS MANAGEMENT ====================

// Get all stock items
exports.getStockItems = async (req, res) => {
  try {
    let hotelId = req.query.hotelid || getCurrentUserHotelId(req);
    if (!hotelId) {
      return res.status(400).json({ success: false, message: "Hotel ID not found" });
    }

    const [items] = await db.query(`
      SELECT s.*, 
             a.quantity_per_guest, a.is_auto_assign, a.is_returnable
      FROM stock_items s
      LEFT JOIN amenity_rules a ON s.item_id = a.item_id AND a.hotelid = s.hotelid
      WHERE s.hotelid = ? AND s.status = 1
      ORDER BY s.category, s.item_name
    `, [hotelId]);

    res.json({ success: true, data: items });
  } catch (error) {
    console.error('Error fetching stock items:', error);
    res.status(500).json({ success: false, message: "Database error", error: error.message });
  }
};

// Get stock item by ID
exports.getStockItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const [items] = await db.query(`
      SELECT s.*, a.quantity_per_guest, a.is_auto_assign, a.is_returnable
      FROM stock_items s
      LEFT JOIN amenity_rules a ON s.item_id = a.item_id
      WHERE s.item_id = ?
    `, [id]);
    
    if (items.length === 0) {
      return res.status(404).json({ success: false, message: "Item not found" });
    }
    res.json({ success: true, data: items[0] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

// Create stock item
exports.createStockItem = async (req, res) => {
  try {
    const {
      item_name, item_code, category, sub_category, unit,
      current_stock, minimum_stock, price, gst_percent,
      quantity_per_guest, is_auto_assign, is_returnable
    } = req.body;

    const hotelId = getCurrentUserHotelId(req) || req.body?.hotelid;
    const userId = getCurrentUserId(req);

    if (!hotelId) {
      return res.status(400).json({ success: false, message: "Hotel ID not found" });
    }

    if (!userId) {
      console.warn('No user ID found for createStockItem');
    }

    const [result] = await db.query(`
      INSERT INTO stock_items (
        item_name, item_code, category, sub_category, unit,
        current_stock, minimum_stock, price, gst_percent,
        created_by_id, hotelid, created_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [item_name, item_code, category, sub_category, unit,
        current_stock || 0, minimum_stock || 0, price || 0, gst_percent || 0,
        userId, hotelId]);

    const itemId = result.insertId;

    if (quantity_per_guest !== undefined) {
      await db.query(`
        INSERT INTO amenity_rules (item_id, quantity_per_guest, is_auto_assign, is_returnable, hotelid, created_by_id, created_date)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
      `, [itemId, quantity_per_guest || 1, is_auto_assign || 1, is_returnable || 0, hotelId, userId]);
    }

    res.json({ success: true, message: "Item created successfully", data: { item_id: itemId } });
  } catch (error) {
    console.error('Error creating stock item:', error);
    res.status(500).json({ success: false, message: "Failed to create item", error: error.message });
  }
};

// Update stock item
exports.updateStockItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = getCurrentUserId(req);

    const fields = [];
    const values = [];

    const allowedFields = ['item_name', 'item_code', 'category', 'sub_category', 'unit',
                           'current_stock', 'minimum_stock', 'price', 'gst_percent', 'status'];

    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(updateData[field]);
      }
    });

    fields.push('updated_by_id = ?', 'updated_date = NOW()');
    values.push(userId, id);

    await db.query(`UPDATE stock_items SET ${fields.join(', ')} WHERE item_id = ?`, values);

    // Ensure amenity_rules is updated by (item_id, hotelid) even if DB does NOT have ON DUPLICATE KEY constraints.
    if (updateData.quantity_per_guest !== undefined) {
      const hotelidForAmenity = updateData.hotelid || getCurrentUserHotelId(req);
      if (!hotelidForAmenity) {
        // If hotelid still missing, skip amenity_rules update to avoid corrupt rows.
        console.warn('No hotelid found for amenity_rules upsert');
      } else {
        // 1) Try update first
        const [amenityUpdateResult] = await db.query(
          `UPDATE amenity_rules
           SET quantity_per_guest = ?,
               is_auto_assign = ?,
               is_returnable = ?,
               updated_by_id = ?,
               updated_date = NOW()
           WHERE item_id = ? AND hotelid = ?`,
          [
            updateData.quantity_per_guest,
            updateData.is_auto_assign || 1,
            updateData.is_returnable || 0,
            userId,
            id,
            hotelidForAmenity,
          ]
        );

        // 2) If nothing updated, insert
        const affectedRows = amenityUpdateResult?.affectedRows ?? 0;
        if (affectedRows === 0) {
          await db.query(
            `INSERT INTO amenity_rules
              (item_id, quantity_per_guest, is_auto_assign, is_returnable, hotelid, created_by_id, created_date)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [
              id,
              updateData.quantity_per_guest,
              updateData.is_auto_assign || 1,
              updateData.is_returnable || 0,
              hotelidForAmenity,
              userId,
            ]
          );
        }
      }
    }

    res.json({ success: true, message: "Item updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to update item" });
  }
};

// Delete stock item
exports.deleteStockItem = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getCurrentUserId(req);
    await db.query('UPDATE stock_items SET status = 0, updated_by_id = ?, updated_date = NOW() WHERE item_id = ?', [userId, id]);
    res.json({ success: true, message: "Item deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to delete item" });
  }
};

// ==================== PURCHASE MANAGEMENT ====================

// Create purchase entry - FIXED VERSION
exports.createPurchase = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { vendor_name, invoice_number, purchase_date, items, hotelid } = req.body;

    const hotelId = hotelid || getCurrentUserHotelId(req);
    const userId = getCurrentUserId(req);

    console.log('Purchase creation - hotelId:', hotelId, 'userId:', userId);

    if (!hotelId) {
      return res.status(400).json({ success: false, message: "Hotel ID not found" });
    }

    if (!items || !items.length) {
      return res.status(400).json({ success: false, message: "No items in purchase" });
    }

    await connection.beginTransaction();

    let totalAmount = 0;
    items.forEach(item => {
      totalAmount += (item.quantity * item.price) + (item.gst_amount || 0);
    });

    const purchaseDateFormatted = purchase_date ? formatDateForDB(purchase_date) : new Date();

    const [purchaseResult] = await connection.query(`
      INSERT INTO purchase_entries (vendor_name, invoice_number, purchase_date, total_amount, created_by_id, hotelid, created_date)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [vendor_name, invoice_number, purchaseDateFormatted, totalAmount, userId, hotelId]);

    const purchaseId = purchaseResult.insertId;

    for (const item of items) {
      const gstAmount = (item.price * item.quantity * (item.gst_percent || 0)) / 100;
      const itemTotal = (item.price * item.quantity) + gstAmount;

      await connection.query(`
        INSERT INTO purchase_items (purchase_id, item_id, quantity, price, gst_percent, gst_amount, total_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [purchaseId, item.item_id, item.quantity, item.price, item.gst_percent || 0, gstAmount, itemTotal]);

      await connection.query(`
        UPDATE stock_items SET current_stock = current_stock + ?, updated_by_id = ?, updated_date = NOW() WHERE item_id = ?
      `, [item.quantity, userId, item.item_id]);

      await connection.query(`
        INSERT INTO stock_transactions (
          item_id, transaction_type, reference_type, reference_id, quantity, 
          reason, created_by_id, hotelid, transaction_date, checkin_id, room_id
        ) VALUES (?, 'IN', 'purchase', ?, ?, 'Purchase from vendor', ?, ?, NOW(), NULL, NULL)
      `, [item.item_id, purchaseId, item.quantity, userId, hotelId]);
    }

    await connection.commit();
    res.json({ success: true, message: "Purchase recorded successfully", data: { purchase_id: purchaseId } });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating purchase:', error);
    res.status(500).json({ success: false, message: "Failed to record purchase", error: error.message });
  } finally {
    connection.release();
  }
};

// Get purchase entries
exports.getPurchases = async (req, res) => {
  try {
    let hotelId = req.query.hotelid || getCurrentUserHotelId(req);
    if (!hotelId) {
      return res.status(400).json({ success: false, message: "Hotel ID not found" });
    }

    const [purchases] = await db.query(`
      SELECT p.*, u.full_name as created_by_name
      FROM purchase_entries p
      LEFT JOIN mst_users u ON p.created_by_id = u.userid
      WHERE p.hotelid = ?
      ORDER BY p.purchase_date DESC
    `, [hotelId]);

    for (const purchase of purchases) {
      const [items] = await db.query(`
        SELECT pi.*, s.item_name, s.item_code, s.category
        FROM purchase_items pi
        JOIN stock_items s ON pi.item_id = s.item_id
        WHERE pi.purchase_id = ?
      `, [purchase.purchase_id]);
      purchase.items = items;
    }

    res.json({ success: true, data: purchases });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

// ==================== STOCK TRANSACTIONS ====================

// Get stock transactions history
exports.getStockTransactions = async (req, res) => {
  try {
    let hotelId = req.query.hotelid || getCurrentUserHotelId(req);
    const { item_id, start_date, end_date, transaction_type } = req.query;

    if (!hotelId) {
      return res.status(400).json({ success: false, message: "Hotel ID not found" });
    }

    let query = `
      SELECT t.*, s.item_name, s.item_code, s.category, u.full_name as created_by_name
      FROM stock_transactions t
      JOIN stock_items s ON t.item_id = s.item_id
      LEFT JOIN mst_users u ON t.created_by_id = u.userid
      WHERE t.hotelid = ?
    `;
    const params = [hotelId];

    if (item_id) {
      query += ` AND t.item_id = ?`;
      params.push(item_id);
    }
    if (transaction_type) {
      query += ` AND t.transaction_type = ?`;
      params.push(transaction_type);
    }
    if (start_date) {
      query += ` AND DATE(t.transaction_date) >= ?`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND DATE(t.transaction_date) <= ?`;
      params.push(end_date);
    }

    query += ` ORDER BY t.transaction_date DESC LIMIT 500`;

    const [transactions] = await db.query(query, params);
    res.json({ success: true, data: transactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

// Get low stock alerts
exports.getLowStockAlerts = async (req, res) => {
  try {
    let hotelId = req.query.hotelid || getCurrentUserHotelId(req);
    if (!hotelId) {
      return res.status(400).json({ success: false, message: "Hotel ID not found" });
    }

    const [items] = await db.query(`
      SELECT item_id, item_name, item_code, category, current_stock, minimum_stock
      FROM stock_items
      WHERE hotelid = ? AND status = 1 AND current_stock <= minimum_stock AND minimum_stock > 0
      ORDER BY (current_stock / minimum_stock) ASC
    `, [hotelId]);

    res.json({ success: true, data: items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

// ==================== AUTO ASSIGN AMENITIES ON CHECKIN ====================

// Auto-assign amenities on check-in - FIXED with room_id
exports.autoAssignAmenities = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { checkin_id, room_id, guest_count, hotelid, user_id } = req.body;
    const finalHotelId = hotelid || getCurrentUserHotelId(req);
    const userId = user_id || getCurrentUserId(req);

    console.log('Auto assign - checkin_id:', checkin_id, 'room_id:', room_id, 'hotelId:', finalHotelId, 'userId:', userId);

    if (!finalHotelId) {
      return res.status(400).json({ success: false, message: "Hotel ID not found" });
    }

    if (!checkin_id || !room_id) {
      return res.status(400).json({ success: false, message: "Checkin ID and Room ID are required" });
    }

    await connection.beginTransaction();

    const [items] = await connection.query(`
      SELECT s.item_id, s.item_name, s.category, s.current_stock, a.quantity_per_guest
      FROM stock_items s
      JOIN amenity_rules a ON s.item_id = a.item_id
      WHERE s.hotelid = ? AND s.status = 1 AND a.is_auto_assign = 1
    `, [finalHotelId]);

    const assignedItems = [];

    for (const item of items) {
      const quantityToAssign = item.quantity_per_guest * guest_count;
      
      if (item.category === 'complimentary') {
        const [stockCheck] = await connection.query(`SELECT current_stock FROM stock_items WHERE item_id = ?`, [item.item_id]);
        if (stockCheck[0].current_stock >= quantityToAssign) {
          await connection.query(`UPDATE stock_items SET current_stock = current_stock - ?, updated_by_id = ?, updated_date = NOW() WHERE item_id = ?`, 
            [quantityToAssign, userId, item.item_id]);
          
          // FIXED: Added room_id to transaction
          await connection.query(`
            INSERT INTO stock_transactions (
              item_id, transaction_type, reference_type, reference_id, quantity, 
              reason, created_by_id, hotelid, transaction_date, checkin_id, room_id
            ) VALUES (?, 'OUT', 'checkin', ?, ?, 'Auto assigned to room on check-in', ?, ?, NOW(), ?, ?)
          `, [item.item_id, checkin_id, quantityToAssign, userId, finalHotelId, checkin_id, room_id]);

          await connection.query(`
            INSERT INTO checkin_amenities (checkin_id, room_id, item_id, quantity, status, issued_date)
            VALUES (?, ?, ?, ?, 'issued', NOW())
          `, [checkin_id, room_id, item.item_id, quantityToAssign]);

          assignedItems.push({ item_name: item.item_name, quantity: quantityToAssign });
        }
      } else if (item.category === 'returnable') {
        await connection.query(`
          INSERT INTO checkin_amenities (checkin_id, room_id, item_id, quantity, status, issued_date)
          VALUES (?, ?, ?, ?, 'issued', NOW())
        `, [checkin_id, room_id, item.item_id, quantityToAssign]);

        // FIXED: Added room_id to transaction
        await connection.query(`
          INSERT INTO stock_transactions (
            item_id, transaction_type, reference_type, reference_id, quantity, 
            reason, created_by_id, hotelid, transaction_date, checkin_id, room_id
          ) VALUES (?, 'OUT', 'checkin', ?, ?, 'Returnable item issued to room', ?, ?, NOW(), ?, ?)
        `, [item.item_id, checkin_id, quantityToAssign, userId, finalHotelId, checkin_id, room_id]);

        assignedItems.push({ item_name: item.item_name, quantity: quantityToAssign });
      }
    }

    await connection.commit();
    res.json({ success: true, message: "Amenities assigned successfully", data: { assignedItems } });
  } catch (error) {
    await connection.rollback();
    console.error('Error auto-assigning amenities:', error);
    res.status(500).json({ success: false, message: "Failed to assign amenities", error: error.message });
  } finally {
    connection.release();
  }
};

// Process return of items on checkout - FIXED with returned_date
exports.processReturnItemsAPI = async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { checkin_id, room_id, items, hotelid, user_id } = req.body;
    const finalHotelId = hotelid || getCurrentUserHotelId(req);
    const userId = user_id || getCurrentUserId(req);

    console.log('Process return - checkin_id:', checkin_id, 'room_id:', room_id, 'userId:', userId);

    if (!finalHotelId) {
      return res.status(400).json({ success: false, message: "Hotel ID not found" });
    }

    await connection.beginTransaction();
    let totalDamageCharge = 0;

    for (const item of items) {
      const [amenity] = await connection.query(`
        SELECT checkin_amenity_id, quantity 
        FROM checkin_amenities 
        WHERE checkin_id = ? AND room_id = ? AND item_id = ? AND status = 'issued'
      `, [checkin_id, room_id, item.item_id]);

      if (amenity.length > 0) {
        const quantityReturned = item.quantity_returned || 0;
        const quantityDamaged = item.quantity_damaged || 0;
        const damageCharge = item.damage_charge || 0;

        totalDamageCharge += damageCharge;

        // FIXED: Added returned_date with NOW()
        await connection.query(`
          UPDATE checkin_amenities 
          SET quantity_returned = ?, quantity_damaged = ?, damage_charge = ?, 
              status = ?, returned_date = NOW()
          WHERE checkin_amenity_id = ?
        `, [quantityReturned, quantityDamaged, damageCharge, 
            (quantityReturned + quantityDamaged) >= amenity[0].quantity ? 'returned' : 'pending',
            amenity[0].checkin_amenity_id]);

        if (quantityReturned > 0) {
          await connection.query(`
            UPDATE stock_items SET current_stock = current_stock + ?, updated_by_id = ?, updated_date = NOW() WHERE item_id = ?
          `, [quantityReturned, userId, item.item_id]);

          // FIXED: Added room_id to transaction
          await connection.query(`
            INSERT INTO stock_transactions (
              item_id, transaction_type, reference_type, reference_id, quantity, 
              reason, created_by_id, hotelid, transaction_date, checkin_id, room_id
            ) VALUES (?, 'RETURNED', 'checkout', ?, ?, 'Returned on checkout', ?, ?, NOW(), ?, ?)
          `, [item.item_id, checkin_id, quantityReturned, userId, finalHotelId, checkin_id, room_id]);
        }

        if (quantityDamaged > 0) {
          // FIXED: Added room_id to transaction
          await connection.query(`
            INSERT INTO stock_transactions (
              item_id, transaction_type, reference_type, reference_id, quantity, 
              reason, created_by_id, hotelid, transaction_date, checkin_id, room_id
            ) VALUES (?, 'DAMAGED', 'checkout', ?, ?, 'Damaged item - charge applied', ?, ?, NOW(), ?, ?)
          `, [item.item_id, checkin_id, quantityDamaged, userId, finalHotelId, checkin_id, room_id]);
        }
      }
    }

    await connection.commit();
    res.json({ success: true, message: "Items returned successfully", data: { total_damage_charge: totalDamageCharge } });
  } catch (error) {
    await connection.rollback();
    console.error('Error processing returned items:', error);
    res.status(500).json({ success: false, message: "Failed to process returns", error: error.message });
  } finally {
    connection.release();
  }
};

// Get items issued to a room
exports.getRoomIssuedItems = async (req, res) => {
  try {
    const { checkin_id, room_id } = req.query;
    let hotelId = req.query.hotelid || getCurrentUserHotelId(req);

    if (!hotelId) {
      return res.status(400).json({ success: false, message: "Hotel ID not found" });
    }

    const [items] = await db.query(`
      SELECT ca.*, s.item_name, s.item_code, s.category, s.price, a.is_returnable
      FROM checkin_amenities ca
      JOIN stock_items s ON ca.item_id = s.item_id
      LEFT JOIN amenity_rules a ON s.item_id = a.item_id
      WHERE ca.checkin_id = ? AND ca.room_id = ? AND ca.status = 'issued'
    `, [checkin_id, room_id]);

    res.json({ success: true, data: items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

// ==================== REPORTS ====================

// Daily consumption report
exports.getDailyConsumptionReport = async (req, res) => {
  try {
    let hotelId = req.query.hotelid || getCurrentUserHotelId(req);
    const { date } = req.query;
    const reportDate = date || new Date().toISOString().split('T')[0];

    if (!hotelId) {
      return res.status(400).json({ success: false, message: "Hotel ID not found" });
    }

    const [consumption] = await db.query(`
      SELECT s.item_id, s.item_name, s.category, 
             SUM(CASE WHEN t.transaction_type = 'OUT' THEN t.quantity ELSE 0 END) as total_issued,
             SUM(CASE WHEN t.transaction_type = 'RETURNED' THEN t.quantity ELSE 0 END) as total_returned,
             SUM(CASE WHEN t.transaction_type = 'DAMAGED' THEN t.quantity ELSE 0 END) as total_damaged,
             (SUM(CASE WHEN t.transaction_type = 'OUT' THEN t.quantity ELSE 0 END) - 
              SUM(CASE WHEN t.transaction_type = 'RETURNED' THEN t.quantity ELSE 0 END)) as net_consumption
      FROM stock_transactions t
      JOIN stock_items s ON t.item_id = s.item_id
      WHERE t.hotelid = ? AND DATE(t.transaction_date) = ?
      GROUP BY s.item_id, s.item_name, s.category
      ORDER BY net_consumption DESC
    `, [hotelId, reportDate]);

    res.json({ success: true, data: consumption, report_date: reportDate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

// Stock report
exports.getStockReport = async (req, res) => {
  try {
    let hotelId = req.query.hotelid || getCurrentUserHotelId(req);
    if (!hotelId) {
      return res.status(400).json({ success: false, message: "Hotel ID not found" });
    }

    const [stock] = await db.query(`
      SELECT s.*, 
             (s.current_stock * s.price) as total_value,
             a.quantity_per_guest, a.is_returnable
      FROM stock_items s
      LEFT JOIN amenity_rules a ON s.item_id = a.item_id
      WHERE s.hotelid = ? AND s.status = 1
      ORDER BY s.category, s.item_name
    `, [hotelId]);

    const totalStockValue = stock.reduce((sum, item) => sum + (item.current_stock * item.price), 0);

    res.json({ success: true, data: stock, total_value: totalStockValue });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

// Damage report
exports.getDamageReport = async (req, res) => {
  try {
    let hotelId = req.query.hotelid || getCurrentUserHotelId(req);
    const { start_date, end_date } = req.query;

    if (!hotelId) {
      return res.status(400).json({ success: false, message: "Hotel ID not found" });
    }

    let query = `
      SELECT t.*, s.item_name, s.item_code, s.price, 
             (t.quantity * s.price) as damage_value,
             u.full_name as created_by_name,
             cm.guest_name, cm.room_no
      FROM stock_transactions t
      JOIN stock_items s ON t.item_id = s.item_id
      LEFT JOIN mst_users u ON t.created_by_id = u.userid
      LEFT JOIN CheckIn_Master cm ON t.checkin_id = cm.checkin_id
      WHERE t.hotelid = ? AND t.transaction_type = 'DAMAGED'
    `;
    const params = [hotelId];

    if (start_date) {
      query += ` AND DATE(t.transaction_date) >= ?`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND DATE(t.transaction_date) <= ?`;
      params.push(end_date);
    }

    query += ` ORDER BY t.transaction_date DESC`;

    const [damages] = await db.query(query, params);
    const totalDamageValue = damages.reduce((sum, d) => sum + (d.damage_value || 0), 0);

    res.json({ success: true, data: damages, total_damage_value: totalDamageValue });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Database error" });
  }
};

// Export all methods
module.exports = exports;