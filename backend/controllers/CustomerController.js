const db = require('../config/db');



exports.getCustomer = (req, res) => {
  try {
    const customers = db.prepare(`
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
        C.updated_date
      FROM mstcustomer C
      LEFT JOIN mstcitymaster M ON C.cityid = M.cityid
      LEFT JOIN mststatemaster S ON C.stateid = S.stateid
    `).all();

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

exports.addCustomer = (req, res) => {
  try {
    const { ...body } = req.body;

    const stmt = db.prepare(`
      INSERT INTO mstcustomer (
        name, countryCode, mobile, mail, cityid,
        address1, address2, stateid, pincode,
        gstNo, fssai, panNo, aadharNo,
        birthday, anniversary, customerType,
        status, createWallet, created_by_id, created_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
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
      body.created_date
    );

    const newCustomer = {
      customerid: result.lastInsertRowid,
      ...body
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

exports.updateCustomer = (req, res) => {
  try {
    const { id } = req.params;
    const { ...body } = req.body;

    const stmt = db.prepare(`
      UPDATE mstcustomer SET
        name=?, countryCode=?, mobile=?, mail=?, cityid=?,
        address1=?, address2=?, stateid=?, pincode=?,
        gstNo=?, fssai=?, panNo=?, aadharNo=?,
        birthday=?, anniversary=?, customerType=?,
        status=?, createWallet=?, updated_by_id=?, updated_date=?
      WHERE customerid=?
    `);

    stmt.run(
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
      body.updated_date,
      id
    );

    res.json({
      success: true,
      message: "Customer updated successfully",
      data: { customerid: Number(id), ...body }
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

exports.deleteCustomer = (req, res) => {
  try {
    const { id } = req.params;

    db.prepare('DELETE FROM mstcustomer WHERE customerid = ?').run(id);

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

// Get customer by mobile number
exports.getCustomerByMobile = (req, res) => {
  try {
    const { mobile } = req.query;

    if (!mobile) {
      return res.status(400).json({ 
        success: false, 
        data: null, 
        message: "Mobile number is required" 
      });
    }

    const stmt = db.prepare(`
      SELECT customerid, name, mobile, address1, address2
      FROM mstcustomer
      WHERE TRIM(mobile) = TRIM(?)
      LIMIT 1
    `);
    const customer = stmt.get(mobile);

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
    console.error("Error fetching customer:", err);
    res.status(500).json({ 
      success: false, 
      data: null, 
      message: "Internal server error", 
      error: err.message 
    });
  }
};

