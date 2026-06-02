const db = require('../../../config/db');

const getCurrentUserId = (req) => {
  return req.user?.id || null;
};

// ✅ GET ALL TRAVEL AGENTS
exports.getTravelAgents = async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT 
        ta.agent_id,
        ta.agent_name,
        ta.agent_code,
        ta.contact_person,
        ta.mobile_no,
        ta.email,
        ta.address,
        ta.country_id,
        c.country_name,
        ta.state_id,
        s.state_name,
        ta.city_id,
        ct.city_name,
        ta.pincode,
        ta.gst_no,
        ta.pan_no,
        ta.commission_type,
        ta.commission_value,
        ta.service_fee,
        ta.cgst,
        ta.sgst,
        ta.igst,
        ta.cess,
        ta.tds,
        ta.tcs,
        ta.billing_type,
        ta.credit_days,
        ta.tax_id,
        ta.status,
        ta.created_by_id,
        ta.created_date,
        ta.updated_by_id,
        ta.updated_date
      FROM travel_agent ta
      LEFT JOIN mstcountrymaster c ON ta.country_id = c.countryid
      LEFT JOIN mststatemaster s ON ta.state_id = s.stateid
      LEFT JOIN mstcitymaster ct ON ta.city_id = ct.cityid
    `);

    res.json({
      success: true,
      message: "Data fetched successfully",
      data: rows
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Database error",
      error: error.message
    });
  }
};

// ✅ ADD TRAVEL AGENT
exports.addTravelAgent = async (req, res) => {
  try {
    const {
      agent_name,
      agent_code,
      contact_person,
      mobile_no,
      email,
      address,
      country_id,
      state_id,
      city_id,
      pincode,
      gst_no,
      pan_no,
      commission_type,
      commission_value,
      service_fee,
      cgst,
      sgst,
      igst,
      cess,
      tds,
      tcs,
      billing_type,
      credit_days,
      tax_id,
      status
    } = req.body;

    const created_by_id = getCurrentUserId(req);
    const created_date = new Date();

    const query = `
      INSERT INTO travel_agent (
        agent_name, agent_code, contact_person, mobile_no, email,
        address, country_id, state_id, city_id, pincode,
        gst_no, pan_no, commission_type, commission_value, service_fee,
        cgst, sgst, igst, cess, tds, tcs, billing_type, credit_days,
        tax_id, status, created_by_id, created_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.execute(query, [
      agent_name,
      agent_code,
      contact_person,
      mobile_no,
      email,
      address,
      country_id || null,
      state_id || null,
      city_id || null,
      pincode,
      gst_no,
      pan_no,
      commission_type || 'PERCENTAGE',
      commission_value || 0,
      service_fee || 0,
      cgst || 0,
      sgst || 0,
      igst || 0,
      cess || 0,
      tds || 0,
      tcs || 0,
      billing_type || 'PREPAID',
      credit_days || 0,
      tax_id || null,
      status !== undefined ? status : 1,
      created_by_id,
      created_date
    ]);

    const [newAgent] = await db.execute(`
      SELECT 
        ta.agent_id,
        ta.agent_name,
        ta.agent_code,
        ta.contact_person,
        ta.mobile_no,
        ta.email,
        ta.address,
        ta.country_id,
        c.country_name,
        ta.state_id,
        s.state_name,
        ta.city_id,
        ct.city_name,
        ta.pincode,
        ta.gst_no,
        ta.pan_no,
        ta.commission_type,
        ta.commission_value,
        ta.service_fee,
        ta.cgst,
        ta.sgst,
        ta.igst,
        ta.cess,
        ta.tds,
        ta.tcs,
        ta.billing_type,
        ta.credit_days,
        ta.tax_id,
        ta.status,
        ta.created_by_id,
        ta.created_date,
        ta.updated_by_id,
        ta.updated_date
      FROM travel_agent ta
      LEFT JOIN mstcountrymaster c ON ta.country_id = c.countryid
      LEFT JOIN mststatemaster s ON ta.state_id = s.stateid
      LEFT JOIN mstcitymaster ct ON ta.city_id = ct.cityid
      WHERE ta.agent_id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: "Travel agent added successfully",
      data: newAgent[0]
    });

  } catch (error) {
    console.error("Error adding travel agent:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add travel agent",
      error: error.message
    });
  }
};

// ✅ UPDATE TRAVEL AGENT
exports.updateTravelAgent = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      agent_name,
      agent_code,
      contact_person,
      mobile_no,
      email,
      address,
      country_id,
      state_id,
      city_id,
      pincode,
      gst_no,
      pan_no,
      commission_type,
      commission_value,
      service_fee,
      cgst,
      sgst,
      igst,
      cess,
      tds,
      tcs,
      billing_type,
      credit_days,
      tax_id,
      status
    } = req.body;

    const updated_by_id = getCurrentUserId(req);
    const updated_date = new Date();

    const query = `
      UPDATE travel_agent SET
        agent_name = ?, agent_code = ?, contact_person = ?, mobile_no = ?, email = ?,
        address = ?, country_id = ?, state_id = ?, city_id = ?, pincode = ?,
        gst_no = ?, pan_no = ?, commission_type = ?, commission_value = ?, service_fee = ?,
        cgst = ?, sgst = ?, igst = ?, cess = ?, tds = ?, tcs = ?,
        billing_type = ?, credit_days = ?, tax_id = ?, status = ?,
        updated_by_id = ?, updated_date = ?
      WHERE agent_id = ?
    `;

    const [result] = await db.execute(query, [
      agent_name,
      agent_code,
      contact_person,
      mobile_no,
      email,
      address,
      country_id || null,
      state_id || null,
      city_id || null,
      pincode,
      gst_no,
      pan_no,
      commission_type || 'PERCENTAGE',
      commission_value || 0,
      service_fee || 0,
      cgst || 0,
      sgst || 0,
      igst || 0,
      cess || 0,
      tds || 0,
      tcs || 0,
      billing_type || 'PREPAID',
      credit_days || 0,
      tax_id || null,
      status !== undefined ? status : 1,
      updated_by_id,
      updated_date,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Travel agent not found"
      });
    }

    const [updatedAgent] = await db.execute(`
      SELECT * FROM travel_agent WHERE agent_id = ?
    `, [id]);

    res.status(200).json({
      success: true,
      message: "Travel agent updated successfully",
      data: updatedAgent[0]
    });

  } catch (error) {
    console.error("Error updating travel agent:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update travel agent",
      error: error.message
    });
  }
};

// ✅ DELETE TRAVEL AGENT
exports.deleteTravelAgent = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.execute(
      'DELETE FROM travel_agent WHERE agent_id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Travel agent not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Travel agent deleted successfully",
      data: { agent_id: parseInt(id) }
    });

  } catch (error) {
    console.error("Error deleting travel agent:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete travel agent",
      error: error.message
    });
  }
};