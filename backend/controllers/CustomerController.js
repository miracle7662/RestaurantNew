const db = require('../config/db');
const { formatMySQLDate } = require('../utils/dateUtils');

// GET all customers - filtered by hotelid from authenticated user
exports.getCustomer = async (req, res) => {
  try {
    // Get hotelid from authenticated user or from query params
    const hotelId = req.user?.hotelid || req.query.hotelId;
    
    // If no hotelId, return error
    if (!hotelId) {
      return res.status(400).json({
        success: false,
        message: "Hotel ID is required",
        data: []
      });
    }
    
    const query = `
      SELECT
        C.customerid,
        C.name,
        C.countryCode,
        C.mobile,
        C.mail,
        C.cityid,
        M.city_name,
        C.address1,
        C.address2,
        C.stateid,
        S.state_name,
        C.pincode,
        C.gstNo,
        C.fssai,
        C.panNo,
        C.aadharNo,
        C.birthday,
        C.anniversary,
        C.customerType,
        C.status,
        C.createWallet,
        C.created_by_id,
        C.created_date,
        C.updated_by_id,
        C.updated_date,
        C.hotelid
      FROM mstcustomer C
      LEFT JOIN mstcitymaster M ON C.cityid = M.cityid
      LEFT JOIN mststatemaster S ON C.stateid = S.stateid
      WHERE C.hotelid = ?
    `;
    
    const [customers] = await db.query(query, [hotelId]);

    res.json({
      success: true,
      message: "Customers fetched successfully",
      data: customers
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
      data: null,
      error: err.message
    });
  }
};
// Search customer by name - filtered by hotelid
exports.searchCustomerByName = async (req, res) => {
  try {
    const { name } = req.query;
    // Get hotelid from authenticated user
    const hotelId = req.user?.hotelid;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Name parameter is required"
      });
    }

    // Search for customers with name containing the search string (case-insensitive)
    let query = `
      SELECT
        C.customerid,
        C.name,
        C.countryCode,
        C.mobile,
        C.mail,
        C.cityid,
        M.city_name,
        C.address1,
        C.address2,
        C.stateid,
        S.state_name,
        C.pincode,
        C.gstNo,
        C.fssai,
        C.panNo,
        C.aadharNo,
        C.birthday,
        C.anniversary,
        C.customerType,
        C.status,
        C.createWallet,
        C.created_by_id,
        C.created_date,
        C.updated_by_id,
        C.updated_date,
        C.hotelid  -- Added hotelid in select
      FROM mstcustomer C
      LEFT JOIN mstcitymaster M ON C.cityid = M.cityid
      LEFT JOIN mststatemaster S ON C.stateid = S.stateid
      WHERE LOWER(C.name) LIKE LOWER(?)
    `;
    
    const params = [`%${name.trim()}%`];
    
    // Add hotel filter if user has hotelid
    if (hotelId) {
      query += ` AND C.hotelid = ?`;
      params.push(hotelId);
    }
    
    query += ` ORDER BY C.name ASC LIMIT 20`;
    
    const [customers] = await db.query(query, params);

    if (customers && customers.length > 0) {
      res.json({
        success: true,
        data: customers,
        message: `Found ${customers.length} customer(s)`
      });
    } else {
      res.json({
        success: true,
        data: [],
        message: "No customers found"
      });
    }

  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      message: "Failed to search customers",
      error: err.message
    });
  }
};

// Add new customer - includes hotelid from authenticated user
exports.addCustomer = async (req, res) => {
  try {
    const { ...body } = req.body;
    // Get hotelid from authenticated user or from request body
    const hotelId = req.user?.hotelid || body.hotelid;

    const stmt = `
      INSERT INTO mstcustomer (
        name, countryCode, mobile, mail, cityid,
        address1, address2, stateid, pincode,
        gstNo, fssai, panNo, aadharNo,
        birthday, anniversary, customerType,
        status, createWallet, created_by_id, created_date,
        hotelid  -- Added hotelid column
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.query(stmt, [
      body.name,
      body.countryCode,
      body.mobile,
      body.mail,
      body.cityid,
      body.address1,
      body.address2,
      body.stateid,
      body.pincode,
      body.gstNo,
      body.fssai,
      body.panNo,
      body.aadharNo,
      body.birthday,
      body.anniversary,
      body.customerType,
      body.status,
      body.createWallet ? 1 : 0,
      body.created_by_id,
      formatMySQLDate(body.created_date),
      hotelId  // Added hotelid parameter
    ]);

    const newCustomer = {
      customerid: result.insertId,
      ...body,
      hotelid: hotelId  // Include hotelid in response
    };

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: newCustomer
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to create customer",
      data: null,
      error: err.message
    });
  }
};

// Update customer - with hotelid authorization check
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { ...body } = req.body;
    // Get hotelid from authenticated user
    const hotelId = req.user?.hotelid;

    // Check if customer belongs to this hotel (authorization)
    if (hotelId) {
      const [check] = await db.query(
        'SELECT customerid FROM mstcustomer WHERE customerid = ? AND hotelid = ?',
        [id, hotelId]
      );
      if (check.length === 0) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to update this customer",
          data: null
        });
      }
    }

    const stmt = `
      UPDATE mstcustomer SET
        name=?, countryCode=?, mobile=?, mail=?, cityid=?,
        address1=?, address2=?, stateid=?, pincode=?,
        gstNo=?, fssai=?, panNo=?, aadharNo=?,
        birthday=?, anniversary=?, customerType=?,
        status=?, createWallet=?, updated_by_id=?, updated_date=?
      WHERE customerid=?
    `;

    await db.query(stmt, [
      body.name,
      body.countryCode,
      body.mobile,
      body.mail,
      body.cityid,
      body.address1,
      body.address2,
      body.stateid,
      body.pincode,
      body.gstNo,
      body.fssai,
      body.panNo,
      body.aadharNo,
      body.birthday,
      body.anniversary,
      body.customerType,
      body.status,
      body.createWallet ? 1 : 0,
      body.updated_by_id,
      formatMySQLDate(body.updated_date),
      id
    ]);

    res.json({
      success: true,
      message: "Customer updated successfully",
      data: { customerid: Number(id), ...body, hotelid: hotelId }
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to update customer",
      data: null,
      error: err.message
    });
  }
};

// Delete customer - with hotelid authorization check
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    // Get hotelid from authenticated user
    const hotelId = req.user?.hotelid;

    // Check if customer belongs to this hotel (authorization)
    if (hotelId) {
      const [check] = await db.query(
        'SELECT customerid FROM mstcustomer WHERE customerid = ? AND hotelid = ?',
        [id, hotelId]
      );
      if (check.length === 0) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to delete this customer",
          data: null
        });
      }
    }

    await db.query('DELETE FROM mstcustomer WHERE customerid = ?', [id]);

    res.json({
      success: true,
      message: "Customer deleted successfully",
      data: null
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Failed to delete customer",
      data: null,
      error: err.message
    });
  }
};

// Get customer by mobile number - FULL DATA with hotel filter
exports.getCustomerByMobile = async (req, res) => {
  try {
    const { mobile } = req.query;
    // Get hotelid from authenticated user
    const hotelId = req.user?.hotelid;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        data: null,
        message: "Mobile number is required"
      });
    }

    let query = `
      SELECT
        C.customerid,
        C.name,
        C.countryCode,
        C.mobile,
        C.mail,
        C.cityid,
        M.city_name,
        C.address1,
        C.address2,
        C.stateid,
        S.state_name,
        C.pincode,
        C.gstNo,
        C.fssai,
        C.panNo,
        C.aadharNo,
        C.birthday,
        C.anniversary,
        C.customerType,
        C.status,
        C.createWallet,
        C.created_by_id,
        C.created_date,
        C.updated_by_id,
        C.updated_date,
        C.hotelid  -- Added hotelid in select
      FROM mstcustomer C
      LEFT JOIN mstcitymaster M ON C.cityid = M.cityid
      LEFT JOIN mststatemaster S ON C.stateid = S.stateid
      WHERE TRIM(C.mobile) = TRIM(?)
    `;
    
    const params = [mobile];
    
    // Add hotel filter if user has hotelid
    if (hotelId) {
      query += ` AND C.hotelid = ?`;
      params.push(hotelId);
    }
    
    query += ` LIMIT 1`;
    
    const [rows] = await db.query(query, params);

    const customer = rows[0];

    if (customer) {
      res.json({
        success: true,
        data: customer,
        message: "Customer found"
      });
    } else {
      res.json({
        success: false,
        data: null,
        message: "Customer not found"
      });
    }
  } catch (err) {
    res.status(500).json({
      success: false,
      data: null,
      message: "Internal server error",
      error: err.message
    });
  }
};