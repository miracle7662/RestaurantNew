// backend/controllers/postChargesController.js
const db = require('../../../config/db');

// Helper function to convert ISO datetime to MySQL datetime format
const toMySQLDateTime = (datetime) => {
  if (!datetime) return null;
  if (typeof datetime === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(datetime)) {
    return datetime;
  }
  const date = new Date(datetime);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace('T', ' ');
};

// Helper function to convert date to MySQL date format (YYYY-MM-DD)
const toMySQLDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
};

const getCurrentUserId = (req) => req.user?.id || null;
const getCurrentUserHotelId = (req) => req.user?.hotelid || null;

// ===============================
// GET all post charges
// ===============================
exports.getPostCharges = async (req, res) => {
  try {
    const { checkin_id, guest_id, room_id, hotelid, transaction_type } = req.query;
    let query = `
      SELECT pc.*, 
             gm.name as guest_name,
             rm.room_no,
             cm.reg_no
      FROM post_charges pc
      LEFT JOIN guest_master gm ON pc.guest_id = gm.guest_id
      LEFT JOIN room_master rm ON pc.room_id = rm.room_id
      LEFT JOIN CheckIn_Master cm ON pc.checkin_id = cm.checkin_id
      WHERE 1=1
    `;
    const params = [];

    if (checkin_id) {
      query += ` AND pc.checkin_id = ?`;
      params.push(checkin_id);
    }
    if (guest_id) {
      query += ` AND pc.guest_id = ?`;
      params.push(guest_id);
    }
    if (room_id) {
      query += ` AND pc.room_id = ?`;
      params.push(room_id);
    }
    if (hotelid) {
      query += ` AND pc.hotelid = ?`;
      params.push(hotelid);
    }
    if (transaction_type) {
      query += ` AND pc.transaction_type = ?`;
      params.push(transaction_type);
    }

    query += ` ORDER BY pc.post_datetime DESC, pc.post_charge_id DESC`;

    const [charges] = await db.query(query, params);
    res.json({ success: true, data: charges });
  } catch (error) {
    console.error('Error fetching post charges:', error);
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// ===============================
// GET post charge by ID
// ===============================
exports.getPostChargeById = async (req, res) => {
  try {
    const { id } = req.params;
    const [charges] = await db.query(`
      SELECT pc.*, 
             gm.name as guest_name,
             rm.room_no,
             cm.reg_no,
             cm.guest_name as checkin_guest_name
      FROM post_charges pc
      LEFT JOIN guest_master gm ON pc.guest_id = gm.guest_id
      LEFT JOIN room_master rm ON pc.room_id = rm.room_id
      LEFT JOIN CheckIn_Master cm ON pc.checkin_id = cm.checkin_id
      WHERE pc.post_charge_id = ?
    `, [id]);
    
    const charge = charges[0];
    if (!charge) {
      return res.status(404).json({ success: false, message: 'Post charge not found' });
    }
    res.json({ success: true, data: charge });
  } catch (error) {
    console.error('Error fetching post charge:', error);
    res.status(500).json({ success: false, message: 'Database error', error: error.message });
  }
};

// ===============================
// ADD SINGLE POST CHARGE/ALLOWANCE
// ===============================
exports.addPostCharge = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    console.log('Received request body:', req.body);

    const {
      checkin_id,
      detail_id,
      room_id,
      guest_id,
      transaction_type,
      post_datetime,
      bill_no,
      doc_no,
      outlet_name,
      outlet_option_id,
      outlet_option,
      description,
      particulars,
      amount,
      discount,
      hotelid,
      created_by_id,
      bill_date
    } = req.body;

    const userId = created_by_id || getCurrentUserId(req);
    const currentHotelId = hotelid || getCurrentUserHotelId(req);

    // Validate required fields
    if (!checkin_id) {
      throw new Error('checkin_id is required');
    }
    if (!guest_id) {
      throw new Error('guest_id is required');
    }
    if (!room_id) {
      throw new Error('room_id is required');
    }

    const mysqlDateTime = toMySQLDateTime(post_datetime) || toMySQLDateTime(new Date());
    const selectedBillDate = toMySQLDate(bill_date);
    const now = toMySQLDateTime(new Date());

    // Get checkin data to get original checkin_datetime
    const [checkinData] = await connection.query(`
      SELECT checkin_datetime, total_amount 
      FROM CheckIn_Master 
      WHERE checkin_id = ?
    `, [checkin_id]);
    
    const originalCheckinDateTime = checkinData[0]?.checkin_datetime || mysqlDateTime;
    const currentCheckinTotal = Number(checkinData[0]?.total_amount) || 0;

    // ---- Derive detail_id if not provided ----
let finalDetailId = detail_id || null;
if (!finalDetailId && checkin_id && guest_id && room_id) {
  const [detailRows] = await connection.query(
    `SELECT detail_id FROM checkin_detail_master 
     WHERE checkin_id = ? AND guest_id = ? AND room_id = ? 
     LIMIT 1`,
    [checkin_id, guest_id, room_id]
  );
  if (detailRows.length > 0) {
    finalDetailId = detailRows[0].detail_id;
  }
}

    // ===============================
    // GET TAX SETTINGS
    // ===============================
    const [taxSettings] = await connection.query(
      `SELECT * FROM hoteltaxmaster WHERE status = 1 LIMIT 1`,
      [currentHotelId]
    );

    let cgstPercent = 0;
    let sgstPercent = 0;
    let igstPercent = 0;
    let cessPercent = 0;
    let serviceChargePercent = 0;

    if (taxSettings.length > 0) {
      const tax = taxSettings[0];
      cgstPercent = Number(tax.cgst_percent) || 0;
      sgstPercent = Number(tax.sgst_percent) || 0;
      igstPercent = Number(tax.igst_percent) || 0;
      cessPercent = Number(tax.cess_percent) || 0;
      serviceChargePercent = Number(tax.service_charge_percent) || 0;
    }

    // ===============================
    // TAX CALCULATION
    // ===============================
    const baseAmount = Number(amount) || 0;
    const discountAmount = Number(discount) || 0;
    const taxableAmount = baseAmount - discountAmount;

    let taxAmount = 0;
    if (igstPercent > 0) {
      taxAmount = (taxableAmount * igstPercent) / 100;
    } else {
      taxAmount = ((taxableAmount * cgstPercent) / 100) + ((taxableAmount * sgstPercent) / 100);
    }

    const cessAmountCalc = (taxableAmount * cessPercent) / 100;
    const serviceChargeAmountCalc = (taxableAmount * serviceChargePercent) / 100;
    const totalTax = taxAmount + cessAmountCalc + serviceChargeAmountCalc;

    const finalTotalAmount = transaction_type === 'ALLOWANCE'
      ? -(taxableAmount + totalTax)
      : (taxableAmount + totalTax);

    // ===============================
    // INSERT INTO post_charges TABLE
    // ===============================
    const [result] = await connection.query(`
      INSERT INTO post_charges (
        checkin_id, guest_id, room_id, detail_id, transaction_type,
        post_datetime, bill_no, doc_no, outlet_name, outlet_option_id,
        outlet_option, description, particulars, amount, discount,
        tax_amount, total_amount, hotelid, created_by_id, updated_by_id,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      checkin_id, guest_id, room_id, finalDetailId , transaction_type,
      mysqlDateTime, bill_no, doc_no || null, outlet_name || null,
      outlet_option_id || null, outlet_option || null, description || null,
      particulars || null, baseAmount, discountAmount,
      totalTax, finalTotalAmount, currentHotelId, userId, userId,
      now, now
    ]);

    const newPostChargeId = result.insertId;

    // Update post_datetime with selected bill date if provided
    let updatedPostDateTime = mysqlDateTime;
    if (selectedBillDate) {
      const timePart = mysqlDateTime.split(' ')[1] || '00:00:00';
      updatedPostDateTime = `${selectedBillDate} ${timePart}`;
      await connection.query(`
        UPDATE post_charges 
        SET post_datetime = ? 
        WHERE post_charge_id = ?
      `, [updatedPostDateTime, newPostChargeId]);
    }

    // ===============================
    // INSERT INTO checkin_guest_room_charges TABLE WITH SELECTED BILL DATE
    // ===============================
    let chargeCheckinDateTime = selectedBillDate ? `${selectedBillDate} 00:00:00` : originalCheckinDateTime;
    let chargeCheckoutDateTime = selectedBillDate ? `${selectedBillDate} 23:59:59` : originalCheckoutDateTime;

    await connection.query(`
      INSERT INTO checkin_guest_room_charges (
        checkin_id, guest_id, room_id, category_id, pax_count, pax_price, pax_tax,
        ex_pax_count, ex_pax_price, ex_pax_tax, ex_pax_tax_percent, ex_pax_total,
        child_count, child_price, child_tax, child_tax_percent, child_total,
        driver_count, driver_price, driver_tax, driver_tax_percent, driver_total,
        total_amount, checkin_datetime, checkout_datetime, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      checkin_id, guest_id, room_id, null, 1, baseAmount, totalTax,
      0, 0, 0, 0, 0,
      0, 0, 0, 0, 0,
      0, 0, 0, 0, 0,
      finalTotalAmount,
      chargeCheckinDateTime,
      chargeCheckoutDateTime,
      now, now
    ]);

    // ===============================
    // INSERT INTO checkin_guest_folio_master
    // ===============================
    await connection.query(`
      INSERT INTO checkin_guest_folio_master (
        checkin_id, hotel_id, detail_id,room_id,  transaction_type,
        transaction_datetime, description, debit_amount, credit_amount,
        reference_number, payment_method, created_by_id, created_date,
        updated_by_id, updated_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      checkin_id, currentHotelId, finalDetailId, room_id, transaction_type,
      updatedPostDateTime, description || particulars || (transaction_type === 'CHARGE' ? 'Charge' : 'Allowance'),
      transaction_type === 'CHARGE' ? Math.abs(finalTotalAmount) : 0,
      transaction_type === 'ALLOWANCE' ? Math.abs(finalTotalAmount) : 0,
      bill_no, 'Cash', userId, now, userId, now
    ]);

    // ===============================
    // UPDATE CHECKIN MASTER TOTAL
    // ===============================
    const newCheckinTotal = currentCheckinTotal + finalTotalAmount;

    await connection.query(`
      UPDATE CheckIn_Master
      SET total_amount = ?, updated_by_id = ?, updated_date = ?
      WHERE checkin_id = ?
    `, [newCheckinTotal, userId, now, checkin_id]);

    await connection.commit();

    res.status(201).json({
      success: true,
      message: transaction_type === 'CHARGE' ? 'Charge posted successfully' : 'Allowance posted successfully',
      data: { post_charge_id: newPostChargeId, total_amount: finalTotalAmount }
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error posting charge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post charge',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
};

// ===============================
// UPDATE POST CHARGE/ALLOWANCE
// ===============================
exports.updatePostCharge = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const {
      checkin_id,
      detail_id,
      room_id,
      guest_id,
      transaction_type,
      post_datetime,
      bill_no,
      doc_no,
      outlet_name,
      outlet_option_id,
      outlet_option,
      description,
      particulars,
      amount,
      discount,
      hotelid,
      updated_by_id,
      bill_date
    } = req.body;

    const userId = updated_by_id || getCurrentUserId(req);
    const currentHotelId = hotelid || getCurrentUserHotelId(req);
    const now = toMySQLDateTime(new Date());
    const selectedBillDate = toMySQLDate(bill_date);

    // Get existing post charge to calculate difference
    const [existingCharges] = await connection.query(
      `SELECT * FROM post_charges WHERE post_charge_id = ?`,
      [id]
    );
    
    if (existingCharges.length === 0) {
      throw new Error('Post charge not found');
    }
    
    const existingCharge = existingCharges[0];
    const oldTotalAmount = Number(existingCharge.total_amount);

    // Calculate new totals
    const baseAmount = Number(amount) || 0;
    const discountAmount = Number(discount) || 0;
    const taxableAmount = baseAmount - discountAmount;

    // Get tax settings
    const [taxSettings] = await connection.query(
      `SELECT * FROM hoteltaxmaster WHERE status = 1 LIMIT 1`,
      [currentHotelId]
    );

    let cgstPercent = 0, sgstPercent = 0, igstPercent = 0, cessPercent = 0, serviceChargePercent = 0;
    if (taxSettings.length > 0) {
      const tax = taxSettings[0];
      cgstPercent = Number(tax.cgst_percent) || 0;
      sgstPercent = Number(tax.sgst_percent) || 0;
      igstPercent = Number(tax.igst_percent) || 0;
      cessPercent = Number(tax.cess_percent) || 0;
      serviceChargePercent = Number(tax.service_charge_percent) || 0;
    }

    let taxAmount = 0;
    if (igstPercent > 0) {
      taxAmount = (taxableAmount * igstPercent) / 100;
    } else {
      taxAmount = ((taxableAmount * cgstPercent) / 100) + ((taxableAmount * sgstPercent) / 100);
    }

    const cessAmountCalc = (taxableAmount * cessPercent) / 100;
    const serviceChargeAmountCalc = (taxableAmount * serviceChargePercent) / 100;
    const totalTax = taxAmount + cessAmountCalc + serviceChargeAmountCalc;

    const newTotalAmount = transaction_type === 'ALLOWANCE'
      ? -(taxableAmount + totalTax)
      : (taxableAmount + totalTax);

    const mysqlDateTime = toMySQLDateTime(post_datetime) || toMySQLDateTime(new Date());

    // Update post_datetime with selected bill date if provided
    let updatedPostDateTime = mysqlDateTime;
    if (selectedBillDate) {
      const timePart = mysqlDateTime.split(' ')[1] || '00:00:00';
      updatedPostDateTime = `${selectedBillDate} ${timePart}`;
    }

    // Update post_charges table
    await connection.query(`
      UPDATE post_charges SET
        checkin_id = ?, guest_id = ?, room_id = ?, detail_id = ?,
        transaction_type = ?, post_datetime = ?, bill_no = ?, doc_no = ?,
        outlet_name = ?, outlet_option_id = ?, outlet_option = ?,
        description = ?, particulars = ?, amount = ?, discount = ?,
        tax_amount = ?, total_amount = ?, updated_by_id = ?, updated_at = ?
      WHERE post_charge_id = ?
    `, [
      checkin_id, guest_id, room_id, detail_id || null,
      transaction_type, updatedPostDateTime, bill_no, doc_no || null,
      outlet_name || null, outlet_option_id || null, outlet_option || null,
      description || null, particulars || null, baseAmount, discountAmount,
      totalTax, newTotalAmount, userId, now, id
    ]);

    // Update checkin_guest_room_charges table with selected bill date
    let chargeCheckinDateTime = selectedBillDate ? `${selectedBillDate} 00:00:00` : existingCharge.post_datetime;
    let chargeCheckoutDateTime = selectedBillDate ? `${selectedBillDate} 23:59:59` : existingCharge.post_datetime;

    // Find the corresponding checkin_guest_room_charges record
    const [guestCharges] = await connection.query(`
      SELECT guest_room_charges_id FROM checkin_guest_room_charges 
      WHERE checkin_id = ? AND room_id = ? AND pax_price = ? AND total_amount = ?
      ORDER BY guest_room_charges_id DESC LIMIT 1
    `, [checkin_id, room_id, existingCharge.amount, existingCharge.total_amount]);

    if (guestCharges.length > 0) {
      await connection.query(`
        UPDATE checkin_guest_room_charges SET
          pax_price = ?, total_amount = ?, checkin_datetime = ?, checkout_datetime = ?,
          updated_at = ?
        WHERE guest_room_charges_id = ?
      `, [
        baseAmount, newTotalAmount, chargeCheckinDateTime, chargeCheckoutDateTime,
        now, guestCharges[0].guest_room_charges_id
      ]);
    }

    // Update checkin_guest_folio_master
    await connection.query(`
      UPDATE checkin_guest_folio_master SET
        transaction_type = ?, transaction_datetime = ?, description = ?,
        debit_amount = ?, credit_amount = ?, reference_number = ?,
        updated_by_id = ?, updated_date = ?
      WHERE checkin_id = ? AND reference_number = ? AND transaction_datetime = ?
    `, [
      transaction_type, updatedPostDateTime, description || particulars || (transaction_type === 'CHARGE' ? 'Charge' : 'Allowance'),
      transaction_type === 'CHARGE' ? Math.abs(newTotalAmount) : 0,
      transaction_type === 'ALLOWANCE' ? Math.abs(newTotalAmount) : 0,
      bill_no, userId, now, checkin_id, bill_no, existingCharge.post_datetime
    ]);

    // Update checkin master total
    const amountDifference = newTotalAmount - oldTotalAmount;
    const [checkinResult] = await connection.query(
      `SELECT total_amount FROM CheckIn_Master WHERE checkin_id = ?`,
      [checkin_id]
    );
    const currentTotal = Number(checkinResult[0]?.total_amount) || 0;
    const newCheckinTotal = currentTotal + amountDifference;

    await connection.query(`
      UPDATE CheckIn_Master
      SET total_amount = ?, updated_by_id = ?, updated_date = ?
      WHERE checkin_id = ?
    `, [newCheckinTotal, userId, now, checkin_id]);

    await connection.commit();

    res.json({
      success: true,
      message: (transaction_type === 'CHARGE' ? 'Charge' : 'Allowance') + ' updated successfully',
      data: { post_charge_id: parseInt(id), total_amount: newTotalAmount }
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error updating post charge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update post charge',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
};

// ===============================
// DELETE POST CHARGE/ALLOWANCE
// ===============================
exports.deletePostCharge = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { id } = req.params;

    const [charges] = await connection.query(
      `SELECT * FROM post_charges WHERE post_charge_id = ?`,
      [id]
    );

    if (charges.length === 0) {
      throw new Error('Post charge not found');
    }

    const charge = charges[0];
    const totalAmountToRemove = Number(charge.total_amount);

    await connection.query(`DELETE FROM post_charges WHERE post_charge_id = ?`, [id]);

    // Delete from checkin_guest_room_charges - use more precise matching
    const [guestCharges] = await connection.query(`
      SELECT guest_room_charges_id FROM checkin_guest_room_charges 
      WHERE checkin_id = ? AND room_id = ? AND pax_price = ? AND total_amount = ?
      ORDER BY guest_room_charges_id DESC LIMIT 1
    `, [charge.checkin_id, charge.room_id, charge.amount, charge.total_amount]);

    if (guestCharges.length > 0) {
      await connection.query(`DELETE FROM checkin_guest_room_charges WHERE guest_room_charges_id = ?`, 
        [guestCharges[0].guest_room_charges_id]);
    }

    // Delete from checkin_guest_folio_master
    await connection.query(`
      DELETE FROM checkin_guest_folio_master 
      WHERE checkin_id = ? AND reference_number = ? AND transaction_datetime = ?
    `, [charge.checkin_id, charge.bill_no, charge.post_datetime]);

    // Update checkin master total
    const [checkinResult] = await connection.query(
      `SELECT total_amount FROM CheckIn_Master WHERE checkin_id = ?`,
      [charge.checkin_id]
    );
    const currentTotal = Number(checkinResult[0]?.total_amount) || 0;
    const newTotal = currentTotal - totalAmountToRemove;

    await connection.query(`
      UPDATE CheckIn_Master
      SET total_amount = ?, updated_date = ?
      WHERE checkin_id = ?
    `, [newTotal, toMySQLDateTime(new Date()), charge.checkin_id]);

    await connection.commit();

    res.json({
      success: true,
      message: (charge.transaction_type === 'CHARGE' ? 'Charge' : 'Allowance') + ' deleted successfully',
      data: { deleted_id: parseInt(id), updated_checkin_total: newTotal }
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error deleting post charge:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post charge',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
};

// ===============================
// ADD BULK POST CHARGES
// ===============================
exports.addPostChargeBulk = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { charges } = req.body;

    if (!charges || !Array.isArray(charges) || charges.length === 0) {
      return res.status(400).json({ success: false, message: 'No charges found' });
    }

    const insertedIds = [];
    const now = toMySQLDateTime(new Date());

    for (const charge of charges) {
      const {
        checkin_id, detail_id, room_id, guest_id, transaction_type,
        post_datetime, bill_no, doc_no, outlet_name, outlet_option_id,
        outlet_option, description, particulars, amount, discount,
        hotelid, created_by_id, bill_date
      } = charge;

      if (!checkin_id || !guest_id || !room_id) {
        console.error('Missing required fields:', { checkin_id, guest_id, room_id });
        continue;
      }

      const userId = created_by_id || getCurrentUserId(req);
      const currentHotelId = hotelid || getCurrentUserHotelId(req);
      const mysqlDateTime = toMySQLDateTime(post_datetime) || now;
      const selectedBillDate = toMySQLDate(bill_date);

      const [taxSettings] = await connection.query(
        `SELECT * FROM hoteltaxmaster WHERE hotelid = ? AND status = 1 LIMIT 1`,
        [currentHotelId]
      );

      let cgstPercent = 0, sgstPercent = 0, igstPercent = 0, cessPercent = 0, serviceChargePercent = 0;
      if (taxSettings.length > 0) {
        const tax = taxSettings[0];
        cgstPercent = Number(tax.cgst_percent) || 0;
        sgstPercent = Number(tax.sgst_percent) || 0;
        igstPercent = Number(tax.igst_percent) || 0;
        cessPercent = Number(tax.cess_percent) || 0;
        serviceChargePercent = Number(tax.service_charge_percent) || 0;
      }

      const baseAmount = Number(amount) || 0;
      const discountAmount = Number(discount) || 0;
      const taxableAmount = baseAmount - discountAmount;

      let taxAmount = 0;
      if (igstPercent > 0) {
        taxAmount = (taxableAmount * igstPercent) / 100;
      } else {
        taxAmount = ((taxableAmount * cgstPercent) / 100) + ((taxableAmount * sgstPercent) / 100);
      }

      const cessAmountCalc = (taxableAmount * cessPercent) / 100;
      const serviceChargeAmountCalc = (taxableAmount * serviceChargePercent) / 100;
      const totalTax = taxAmount + cessAmountCalc + serviceChargeAmountCalc;

      const finalTotalAmount = transaction_type === 'ALLOWANCE'
        ? -(taxableAmount + totalTax)
        : (taxableAmount + totalTax);

      // Update post_datetime with selected bill date if provided
      let updatedPostDateTime = mysqlDateTime;
      if (selectedBillDate) {
        const timePart = mysqlDateTime.split(' ')[1] || '00:00:00';
        updatedPostDateTime = `${selectedBillDate} ${timePart}`;
      }

      const [result] = await connection.query(`
        INSERT INTO post_charges (
          checkin_id, guest_id, room_id, detail_id, transaction_type,
          post_datetime, bill_no, doc_no, outlet_name, outlet_option_id,
          outlet_option, description, particulars, amount, discount,
          tax_amount, total_amount, hotelid, created_by_id, updated_by_id,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        checkin_id, guest_id, room_id, detail_id || null, transaction_type,
        updatedPostDateTime, bill_no, doc_no || null, outlet_name || null,
        outlet_option_id || null, outlet_option || null, description || null,
        particulars || null, baseAmount, discountAmount,
        totalTax, finalTotalAmount, currentHotelId, userId, userId,
        now, now
      ]);

      insertedIds.push(result.insertId);

      const [checkinData] = await connection.query(`
        SELECT checkin_datetime, checkout_datetime FROM CheckIn_Master WHERE checkin_id = ?
      `, [checkin_id]);
      
      let chargeCheckinDateTime = selectedBillDate ? `${selectedBillDate} 00:00:00` : (checkinData[0]?.checkin_datetime || updatedPostDateTime);
      let chargeCheckoutDateTime = selectedBillDate ? `${selectedBillDate} 23:59:59` : (checkinData[0]?.checkout_datetime || updatedPostDateTime);

      await connection.query(`
        INSERT INTO checkin_guest_room_charges (
          checkin_id, guest_id, room_id, category_id, pax_count, pax_price, pax_tax,
          ex_pax_count, ex_pax_price, ex_pax_tax, ex_pax_tax_percent, ex_pax_total,
          child_count, child_price, child_tax, child_tax_percent, child_total,
          driver_count, driver_price, driver_tax, driver_tax_percent, driver_total,
          total_amount, checkin_datetime, checkout_datetime, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        checkin_id, guest_id, room_id, null, 1, baseAmount, totalTax,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        0, 0, 0, 0, 0,
        finalTotalAmount, chargeCheckinDateTime, chargeCheckoutDateTime,
        now, now
      ]);

      const [checkinResult] = await connection.query(
        `SELECT total_amount FROM CheckIn_Master WHERE checkin_id = ?`,
        [checkin_id]
      );
      const currentTotal = Number(checkinResult[0]?.total_amount) || 0;
      const newTotal = currentTotal + finalTotalAmount;

      await connection.query(`
        UPDATE CheckIn_Master
        SET total_amount = ?, updated_date = ?
        WHERE checkin_id = ?
      `, [newTotal, now, checkin_id]);
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: `${insertedIds.length} charge(s) posted successfully`,
      data: insertedIds.map(id => ({ post_charge_id: id }))
    });

  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Error posting bulk charges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to post charges',
      error: error.message
    });
  } finally {
    if (connection) connection.release();
  }
};

// ===============================
// TRANSFER POST CHARGES TO NEW ROOM (called during Room Transfer in Amendments)
// Updates room_id for all post charges of checkin + old room → new room
// Also updates linked checkin_guest_room_charges rows
// ===============================
exports.transferPostChargesToRoom = async (req, res) => {
  try {
    const { checkin_id, old_room_id, new_room_id } = req.body;

    if (!checkin_id || !old_room_id || !new_room_id) {
      return res.status(400).json({
        success: false,
        message: 'checkin_id, old_room_id, new_room_id are required'
      });
    }

    // Count how many records will be affected
    const [existing] = await db.query(
      `SELECT post_charge_id FROM post_charges WHERE checkin_id = ? AND room_id = ?`,
      [checkin_id, old_room_id]
    );

    if (!existing || existing.length === 0) {
      return res.json({
        success: true,
        message: 'No post charges to transfer',
        transferred: 0
      });
    }

    // Bulk update room_id for all charges (CHARGE + ALLOWANCE) of this checkin + old room
    const [result] = await db.query(
      `UPDATE post_charges SET room_id = ?, updated_at = NOW() WHERE checkin_id = ? AND room_id = ?`,
      [new_room_id, checkin_id, old_room_id]
    );

    // Also update linked checkin_guest_room_charges rows for the same checkin + old room
    await db.query(
      `UPDATE checkin_guest_room_charges SET room_id = ?, updated_at = NOW() WHERE checkin_id = ? AND room_id = ?`,
      [new_room_id, checkin_id, old_room_id]
    );

    res.json({
      success: true,
      message: `${result.affectedRows} post charge(s) transferred to new room`,
      transferred: result.affectedRows
    });
  } catch (error) {
    console.error('Error transferring post charges to room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to transfer post charges',
      error: error.message
    });
  }
};

// ===============================
// SWAP POST CHARGES BETWEEN TWO ROOMS (called during Swap Room in Amendments)
// Each guest's post charges (CHARGE + ALLOWANCE) follow their guest to their NEW room.
// Uses a sentinel room_id to prevent constraint collisions during the two-step update.
// ===============================
exports.swapPostChargesBetweenRooms = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const {
      room_a_checkin_id,   // Guest A's checkin_id (currently in Room A)
      room_a_room_id,      // Room A's room_id
      room_b_checkin_id,   // Guest B's checkin_id (currently in Room B)
      room_b_room_id,      // Room B's room_id
    } = req.body;

    console.log('=== swapPostChargesBetweenRooms ===');
    console.log('Input:', { room_a_checkin_id, room_a_room_id, room_b_checkin_id, room_b_room_id });

    if (!room_a_checkin_id || !room_a_room_id || !room_b_checkin_id || !room_b_room_id) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'room_a_checkin_id, room_a_room_id, room_b_checkin_id, room_b_room_id are all required',
      });
    }

    if (Number(room_a_room_id) === Number(room_b_room_id)) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'Cannot swap: both rooms have the same room_id',
      });
    }

    // Fetch post charge IDs for Guest A (their current room A)
    const [rowsA] = await connection.query(
      `SELECT post_charge_id FROM post_charges WHERE checkin_id = ? AND room_id = ?`,
      [room_a_checkin_id, room_a_room_id]
    );

    // Fetch post charge IDs for Guest B (their current room B)
    const [rowsB] = await connection.query(
      `SELECT post_charge_id FROM post_charges WHERE checkin_id = ? AND room_id = ?`,
      [room_b_checkin_id, room_b_room_id]
    );

    const idsA = rowsA.map(r => r.post_charge_id);
    const idsB = rowsB.map(r => r.post_charge_id);

    // Also fetch mirrored checkin_guest_room_charges rows inserted by post charges controller
    const [grcRowsA] = await connection.query(
      `SELECT guest_room_charges_id FROM checkin_guest_room_charges WHERE checkin_id = ? AND room_id = ?`,
      [room_a_checkin_id, room_a_room_id]
    );
    const [grcRowsB] = await connection.query(
      `SELECT guest_room_charges_id FROM checkin_guest_room_charges WHERE checkin_id = ? AND room_id = ?`,
      [room_b_checkin_id, room_b_room_id]
    );
    const grcIdsA = grcRowsA.map(r => r.guest_room_charges_id);
    const grcIdsB = grcRowsB.map(r => r.guest_room_charges_id);

    console.log(`Guest A post charges (${idsA.length}):`, idsA);
    console.log(`Guest B post charges (${idsB.length}):`, idsB);

    if (idsA.length === 0 && idsB.length === 0) {
      await connection.commit();
      return res.json({
        success: true,
        message: 'No post charges found in either room — nothing to swap',
        data: { swapped_a: 0, swapped_b: 0 },
      });
    }

    const SENTINEL_ROOM_ID = -998; // Temporary parking room_id (impossible real value)

    // STEP 1: Park Guest A's post charges at the sentinel to avoid constraint collisions
    if (idsA.length > 0) {
      const ph = idsA.map(() => '?').join(',');
      await connection.query(
        `UPDATE post_charges SET room_id = ?, updated_at = NOW() WHERE post_charge_id IN (${ph})`,
        [SENTINEL_ROOM_ID, ...idsA]
      );
    }
    if (grcIdsA.length > 0) {
      const ph = grcIdsA.map(() => '?').join(',');
      await connection.query(
        `UPDATE checkin_guest_room_charges SET room_id = ?, updated_at = NOW() WHERE guest_room_charges_id IN (${ph})`,
        [SENTINEL_ROOM_ID, ...grcIdsA]
      );
    }
    console.log(`Step 1: Parked ${idsA.length} post charges for Guest A at sentinel`);

    // STEP 2: Move Guest B's post charges → to Room A (their new physical room)
    if (idsB.length > 0) {
      const ph = idsB.map(() => '?').join(',');
      await connection.query(
        `UPDATE post_charges SET room_id = ?, updated_at = NOW() WHERE post_charge_id IN (${ph})`,
        [room_a_room_id, ...idsB]
      );
    }
    if (grcIdsB.length > 0) {
      const ph = grcIdsB.map(() => '?').join(',');
      await connection.query(
        `UPDATE checkin_guest_room_charges SET room_id = ?, updated_at = NOW() WHERE guest_room_charges_id IN (${ph})`,
        [room_a_room_id, ...grcIdsB]
      );
    }
    console.log(`Step 2: Moved ${idsB.length} post charges for Guest B to Room A (room_id ${room_a_room_id})`);

    // STEP 3: Unpark Guest A's post charges → to Room B (their new physical room)
    // Only update rows that are currently at the sentinel for Guest A's checkin
    if (idsA.length > 0) {
      const ph = idsA.map(() => '?').join(',');
      await connection.query(
        `UPDATE post_charges SET room_id = ?, updated_at = NOW() WHERE post_charge_id IN (${ph})`,
        [room_b_room_id, ...idsA]
      );
    }
    if (grcIdsA.length > 0) {
      const ph = grcIdsA.map(() => '?').join(',');
      await connection.query(
        `UPDATE checkin_guest_room_charges SET room_id = ?, updated_at = NOW() WHERE guest_room_charges_id IN (${ph})`,
        [room_b_room_id, ...grcIdsA]
      );
    }
    console.log(`Step 3: Moved ${idsA.length} post charges for Guest A to Room B (room_id ${room_b_room_id})`);

    await connection.commit();
    console.log('=== Post charges swap committed successfully ===');

    res.json({
      success: true,
      message: `Swapped ${idsA.length} post charge(s) from Room A and ${idsB.length} post charge(s) from Room B`,
      data: { swapped_a: idsA.length, swapped_b: idsB.length },
    });

  } catch (error) {
    await connection.rollback();
    console.error('Error in swapPostChargesBetweenRooms:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to swap post charges. All changes have been rolled back.',
      error: error.message,
    });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = exports;