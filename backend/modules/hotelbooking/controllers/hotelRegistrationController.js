// backend/controllers/hotelRegistrationController.js
const db = require('../../../config/db');
const bcrypt = require('bcryptjs');

const getCurrentUserId = (req) => {
  return req.user?.id || null;
};

// ✅ GET ALL
exports.getRegistrations = async (req, res) => {
  try {
    const { q } = req.query;
    let sql = `SELECT * FROM hotel_registration`;
    let params = [];

    if (q) {
      sql += ` WHERE hotel_name LIKE ? OR email LIKE ? OR mobile LIKE ?`;
      const like = `%${q}%`;
      params = [like, like, like];
    }

    sql += ` ORDER BY mst_hotelid DESC`;

    const [rows] = await db.query(sql, params);

    res.json({
      success: true,
      message: 'Data fetched successfully',
      data: rows,
    });
  } catch (error) {
    console.error('Error fetching hotels:', error);
    res.status(500).json({
      success: false,
      message: 'Database error',
    });
  }
};

// ✅ GET BY ID
exports.getRegistrationById = async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      'SELECT * FROM hotel_registration WHERE mst_hotelid = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found',
      });
    }

    res.json({
      success: true,
      message: 'Data fetched successfully',
      data: rows[0],
    });
  } catch (error) {
    console.error('Error fetching hotel:', error);
    res.status(500).json({
      success: false,
      message: 'Database error',
    });
  }
};

// ✅ ADD
exports.addRegistration = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const data = req.body;
    const userId = getCurrentUserId(req);

    if (!data.hotel_name || !data.email || !data.password) {
      return res.status(400).json({
        success: false,
        message: 'Hotel name, email, and password are required',
      });
    }

    const hashedPassword = bcrypt.hashSync(data.password, 10);

    await connection.beginTransaction();

    const [hotelResult] = await connection.query(
      `INSERT INTO hotel_registration (
        hotel_name, brand_name, email, mobile, whatsappno, address,
        cityid, stateid, countryid, latitude, longitude, description,
        username, password, self_online_booking_allow, partner_booking_allow,
        hotel_type, hotel_owner_name, hotel_owner_mobile, hotel_contact_person,
        hotel_contact_mobile, check_in_time, check_out_time, rating,
        status, hotel_gstno, hotel_pan_no, shop_act_no, fssai_no,
        hsn_code, sac_code, website, istaxable, istaxinclude,
        subscription_id, subscription_validity, created_by_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.hotel_name,
        data.brand_name || null,
        data.email,
        data.mobile || null,
        data.whatsappno || null,
        data.address || null,
        data.cityid || null,
        data.stateid || null,
        data.countryid || null,
        data.latitude || null,
        data.longitude || null,
        data.description || null,
        data.username || data.email,
        hashedPassword,
        data.self_online_booking_allow ?? 0,
        data.partner_booking_allow ?? 0,
        data.hotel_type || null,
        data.hotel_owner_name || null,
        data.hotel_owner_mobile || null,
        data.hotel_contact_person || null,
        data.hotel_contact_mobile || null,
        data.check_in_time || '00:00:00',
        data.check_out_time || '09:30:00',
        data.rating || null,
        data.status ?? 1,
        data.hotel_gstno || null,
        data.hotel_pan_no || null,
        data.shop_act_no || null,
        data.fssai_no || null,
        data.hsn_code || null,
        data.sac_code || null,
        data.website || null,
        data.istaxable ?? 1,
        data.istaxinclude ?? 0,
        data.subscription_id || null,
        data.subscription_validity || null,
        userId,
      ]
    );

    const hotelId = hotelResult.insertId;

    await connection.query(
      `INSERT INTO mst_users (full_name, email, password, role_level, hotelid, status, created_date)
       VALUES (?, ?, ?, ?, ?, 1, NOW())`,
      [
        data.hotel_name + ' Admin',
        data.email,
        hashedPassword,
        'hotel_admin',
        hotelId,
      ]
    );

    await connection.commit();

    const [rows] = await connection.query(
      'SELECT * FROM hotel_registration WHERE mst_hotelid = ?',
      [hotelId]
    );

    res.json({
      success: true,
      message: 'Hotel added successfully',
      data: rows[0],
    });
  } catch (error) {
    await connection.rollback();
    console.error('Error adding hotel:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to add hotel',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

// ✅ UPDATE
exports.updateRegistration = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const userId = getCurrentUserId(req);

    const fields = [];
    const values = [];

    const addField = (field, value) => {
      if (value !== undefined) {
        fields.push(`${field} = ?`);
        values.push(value);
      }
    };

    addField('hotel_name', data.hotel_name);
    addField('brand_name', data.brand_name);
    addField('email', data.email);
    addField('mobile', data.mobile);
    addField('whatsappno', data.whatsappno);
    addField('address', data.address);

    if (data.password) {
      const hashed = bcrypt.hashSync(data.password, 10);
      addField('password', hashed);
    }

    addField('updated_by_id', userId);

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
    }

    const sql = `UPDATE hotel_registration SET ${fields.join(', ')} WHERE mst_hotelid = ?`;
    values.push(id);

    const [result] = await db.query(sql, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found',
      });
    }

    const [rows] = await db.query(
      'SELECT * FROM hotel_registration WHERE mst_hotelid = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Hotel updated successfully',
      data: rows[0],
    });
  } catch (error) {
    console.error('Error updating hotel:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update hotel',
      error: error.message,
    });
  }
};

// ✅ DELETE
exports.deleteRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete user mappings first
    await db.query('DELETE FROM user_outlet_mapping WHERE userid IN (SELECT userid FROM mst_users WHERE hotelid = ?)', [id]);
    
    // Delete users
    await db.query('DELETE FROM mst_users WHERE hotelid = ?', [id]);

    const [result] = await db.query(
      'DELETE FROM hotel_registration WHERE mst_hotelid = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found',
      });
    }

    res.json({
      success: true,
      message: 'Hotel deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting hotel:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete hotel',
      error: error.message,
    });
  }
};