const db = require('../config/db')
const bcrypt = require('bcrypt')

// Get outlet users based on current user's role and hierarchy
exports.getOutletUsers = (req, res) => {
  try {
    const { currentUserId, roleLevel, hotelid, outletid } = req.query;

    let query = `
      SELECT u.*, 
             h.hotel_name as hotel_name,
             o.outlet_name as outlet_name,
             o.outletid as outletid,
             d.Designation as designation_name,
             ut.User_type as user_type_name
      FROM mst_users u
      LEFT JOIN msthotelmasters h ON u.hotelid = h.hotelid
      LEFT JOIN mst_outlets o ON u.outletid = o.outletid
      LEFT JOIN mstdesignation d ON u.designation = d.designationid
      LEFT JOIN mstuserType ut ON u.user_type = ut.usertypeid
      WHERE (u.role_level = 'outlet_user' OR u.role_level = 'hotel_admin')
    `;

    const params = [];

    switch (roleLevel) {
      case 'superadmin':
        break;
      case 'hotel_admin':
      case 'outlet_user':
        query += ' AND u.hotelid = ?';
        params.push(hotelid);
        break;
      default:
        return res.status(403).json({ message: 'Insufficient permissions' });
    }

    query += " ORDER BY CASE WHEN u.role_level = 'hotel_admin' THEN 0 ELSE 1 END, u.created_date DESC";

    const users = db.prepare(query).all(...params);
    res.json(users);
  } catch (error) {
    console.error('Error fetching outlet users:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get outlets for dropdown (filtered by user role)
exports.getOutletsForDropdown = (req, res) => {
  try {
    const { roleLevel, brandId, hotelid } = req.query

    let query = `
            SELECT o.outletid, o.outlet_name, o.outlet_code, 
                   b.hotel_name as brand_name
            FROM mst_outlets o
            LEFT JOIN msthotelmasters b ON o.hotelid = b.hotelid
            WHERE o.hotelid = ?
        `

    const params = [hotelid]

    switch (roleLevel) {
      case 'superadmin':
        break
      case 'brand_admin':
        query += ' AND o.brand_id = ?'
        params.push(brandId)
        break
      case 'hotel_admin':
        query += ' AND o.brand_id = ?'
        params.push(brandId)
        break
      default:
        return res.status(403).json({ message: 'Insufficient permissions' })
    }

    query += ' ORDER BY o.outlet_name'

    const outlets = db.prepare(query).all(...params)
    res.json(outlets)
  } catch (error) {
    console.error('Error fetching outlets for dropdown:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// Create new outlet user
exports.createOutletUser = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      full_name,
      phone,
      outletid, // Changed from outletid to outletid (single outlet)
      Designation,
      designationid,
      user_type,
      usertypeid,
      shift_time,
      mac_address,
      assign_warehouse,
      language_preference,
      address,
      city,
      sub_locality,
      web_access,
      self_order,
      captain_app,
      kds_app,
      captain_old_kot_access,
      verify_mac_ip,
      role_level,
      brand_id,
      hotelid,
      parent_user_id,
      status,
      last_login,
      created_by_id,
      created_date,
    } = req.body

    // Validate required fields
    if (
      !username ||
      !email ||
      !password ||
      !full_name ||
      !outletid
    ) {
      return res
        .status(400)
        .json({
          message: 'Required fields missing',
          missing: { username, email, password, full_name, outletid },
        })
    }

    // Check if username or email already exists
    const existingUser = db
      .prepare('SELECT userid FROM mst_users WHERE username = ? OR email = ?')
      .get(username, email)
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Validate parent user
    const parentUser = db
      .prepare('SELECT role_level, hotelid FROM mst_users WHERE userid = ?')
      .get(parent_user_id)
    if (!parentUser) {
      return res.status(400).json({ message: 'Invalid parent user', parent_user_id })
    }

    // Validate outlet ID
    const outletId = parseInt(outletid)
    if (isNaN(outletId)) {
      return res.status(400).json({ message: 'Invalid outlet ID provided', outletid })
    }

    // Validate outlet exists and is active
    const outlet = db
      .prepare(
        'SELECT outletid, hotelid FROM mst_outlets WHERE outletid = ? AND status = 0',
      )
      .get(outletId)
    if (!outlet) {
      return res
        .status(400)
        .json({ message: 'Outlet ID is invalid or inactive', outletid })
    }

    const finalHotelId = hotelid || parentUser.hotelid

    // Verify outlet belongs to the provided or parent hotel
    if (outlet.hotelid !== finalHotelId) {
      return res
        .status(400)
        .json({
          message: 'Selected outlet does not belong to the specified hotel',
          finalHotelId,
          outletHotelId: outlet.hotelid,
        })
    }

    // Insert user into mst_users
    const stmt = db.prepare(`
    INSERT INTO mst_users (
    username,
    email,
    password,
    full_name,
    phone,
    role_level,
    parent_user_id,
    brand_id,
    hotelid,
    outletid,
    Designation,
    designationid,
    user_type,
    usertypeid,
    shift_time,
    mac_address,
    assign_warehouse,
    language_preference,
    address,
    city,
    sub_locality,
    web_access,
    self_order,
    captain_app,
    kds_app,
    captain_old_kot_access,
    verify_mac_ip,
    status,
    last_login,
    created_by_id,
    created_date
) VALUES (
    ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
`)

    const result = stmt.run(
      username, 
      email, 
      hashedPassword, 
      full_name,
      phone,
      role_level,
      parent_user_id,
      brand_id,
      finalHotelId,
      outletId,
      Designation,
      designationid,
      user_type,
      usertypeid,
      shift_time,
      mac_address,
      assign_warehouse,
      language_preference || 'English',
      address,
      city,
      sub_locality,
      web_access ? 1 : 0,
      self_order ? 1 : 0,
      captain_app ? 1 : 0,
      kds_app ? 1 : 0,
      captain_old_kot_access || 'Enabled',
      verify_mac_ip ? 1 : 0,
      status || 0,
      last_login || null,
      created_by_id,
      created_date || new Date().toISOString(),
    )

    const userid = result.lastInsertRowid

    res.json({
      userid,
      username,
      email,
      full_name,
      role_level: 'outlet_user',
      outletid: outletId,
      hotelid: finalHotelId,
    })
  } catch (error) {
    console.error('Error creating outlet user:', error)
    res.status(500).json({ message: 'Internal server error', error: error.message })
  }
}

// Update outlet user
exports.updateOutletUser = async (req, res) => {
  try {
    const { id: userid } = req.params;
    const {
      username,
      email,
      password,
      full_name,
      phone,
      role_level,
      parent_user_id,
      brand_id,
      hotelid,
      outletid,
      Designation,
      designationid,
      user_type,
      usertypeid,
      shift_time,
      mac_address,
      assign_warehouse,
      language_preference,
      address,
      city,
      sub_locality,
      web_access,
      self_order,
      captain_app,
      kds_app,
      captain_old_kot_access,
      verify_mac_ip,
      status,
      last_login,
      updated_by_id
    } = req.body;

    console.log('Update outlet user request:', { userid, body: req.body });

    // Check if user exists and is an outlet user
    const existingUser = db.prepare('SELECT role_level, hotelid FROM mst_users WHERE userid = ?').get(userid);
    if (!existingUser || existingUser.role_level !== 'outlet_user') {
      return res.status(404).json({ message: 'Outlet user not found' });
    }

    // Prepare fields and parameters for the update query
    const updateFields = [];
    const params = [];

    // Helper function to add valid fields to the query
    const addField = (field, value, type) => {
      if (value !== undefined && value !== null) {
        if (type === 'INTEGER') {
          // Handle boolean values for INTEGER fields
          if (typeof value === 'boolean') {
            updateFields.push(`${field} = ?`);
            params.push(value ? 1 : 0);
          } else {
            const numValue = parseInt(value);
            if (isNaN(numValue)) {
              throw new Error(`Invalid integer value for ${field}: ${value} (type: ${typeof value})`);
            }
            updateFields.push(`${field} = ?`);
            params.push(numValue);
          }
        } else {
          updateFields.push(`${field} = ?`);
          params.push(value);
        }
      }
    };

    // Add fields to update query with type validation
    addField('username', username, 'TEXT');
    addField('email', email, 'TEXT');
    addField('password', password, 'TEXT');
    addField('full_name', full_name, 'TEXT');
    addField('phone', phone, 'TEXT');
    addField('role_level', role_level, 'TEXT');
    addField('parent_user_id', parent_user_id, 'INTEGER');
    addField('brand_id', brand_id, 'INTEGER');
    addField('hotelid', hotelid, 'INTEGER');
    addField('outletid', outletid, 'INTEGER');
    addField('Designation', Designation, 'TEXT');
    addField('designationid', designationid, 'INTEGER');
    addField('user_type', user_type, 'TEXT');
    addField('usertypeid', usertypeid, 'INTEGER');
    addField('shift_time', shift_time, 'TEXT');
    addField('mac_address', mac_address, 'TEXT');
    addField('assign_warehouse', assign_warehouse, 'TEXT');
    addField('language_preference', language_preference, 'TEXT');
    addField('address', address, 'TEXT');
    addField('city', city, 'TEXT');
    addField('sub_locality', sub_locality, 'TEXT');
    addField('web_access', web_access, 'INTEGER');
    addField('self_order', self_order, 'INTEGER');
    addField('captain_app', captain_app, 'INTEGER');
    addField('kds_app', kds_app, 'INTEGER');
    addField('captain_old_kot_access', captain_old_kot_access, 'TEXT');
    addField('verify_mac_ip', verify_mac_ip, 'INTEGER');
    addField('status', status, 'INTEGER');
    addField('last_login', last_login, 'DATETIME');

    // Handle updated_by_id (ensure it's an integer or null)
    const finalUpdatedById = updated_by_id !== undefined ? parseInt(updated_by_id) : null;
    if (updated_by_id !== undefined && isNaN(finalUpdatedById)) {
      throw new Error(`Invalid integer value for updated_by_id: ${updated_by_id} (type: ${typeof updated_by_id})`);
    }
    updateFields.push('updated_by_id = ?');
    updateFields.push("updated_date = datetime('now')");
    params.push(finalUpdatedById, userid);

    // Execute update query if there are fields to update
    if (updateFields.length > 2) {
      console.log('Update query:', `UPDATE mst_users SET ${updateFields.join(', ')} WHERE userid = ?`);
      console.log('Update params:', params);
      params.forEach((param, index) => {
        console.log(`Param ${index}: ${param} (type: ${typeof param})`);
      });
      const stmt = db.prepare(`UPDATE mst_users SET ${updateFields.join(', ')} WHERE userid = ?`);
      stmt.run(...params);
    }

    // Validate outlet ID if provided
    if (outletid) {
      const outletId = parseInt(outletid);
      if (isNaN(outletId)) {
        return res.status(400).json({ message: 'Invalid outlet ID provided' });
      }

      const outlet = db
        .prepare(
          'SELECT outletid, hotelid FROM mst_outlets WHERE outletid = ? AND status = 0',
        )
        .get(outletId);
      if (!outlet) {
        return res
          .status(400)
          .json({ message: 'Outlet ID is invalid or inactive', outletid });
      }

      const finalHotelId = existingUser.hotelid;
      if (outlet.hotelid !== finalHotelId) {
        return res
          .status(400)
          .json({
            message: "Selected outlet does not belong to the user's hotel",
            finalHotelId,
            outletHotelId: outlet.hotelid,
          });
      }
    }

    res.json({ message: 'Outlet user updated successfully' });
  } catch (error) {
    console.error('Error updating outlet user:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Delete outlet user (soft delete)
exports.deleteOutletUser = (req, res) => {
  try {
    const { userid } = req.params
    const { updated_by_id } = req.body

    const stmt = db.prepare(
      "UPDATE mst_users SET status = 0, updated_by_id = ?, updated_date = datetime('now') WHERE userid = ?",
    )
    stmt.run(updated_by_id, userid)

    res.json({ message: 'Outlet user deleted successfully' })
  } catch (error) {
    console.error('Error deleting outlet user:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// Get outlet user by ID
exports.getOutletUserById = (req, res) => {
  try {
    const { id } = req.params
    const user = db
      .prepare(
        `
            SELECT u.*, 
                   b.hotel_name as brand_name,
                   h.hotel_name as hotel_name,
                   o.outlet_name as outlet_name,
                   u.outletid as outletid
            FROM mst_users u
            LEFT JOIN msthotelmasters b ON u.brand_id = b.hotelid
            LEFT JOIN msthotelmasters h ON u.hotelid = h.hotelid
            LEFT JOIN mst_outlets o ON u.outletid = o.outletid
            WHERE u.userid = ? AND u.role_level = 'outlet_user'
        `,
      )
      .get(id)

    if (!user) {
      return res.status(404).json({ error: 'Outlet user not found' })
    }

    // Convert outletid to array for consistency
    user.outletid = user.outletid ? [user.outletid] : []
    res.json(user)
  } catch (error) {
    console.error('Error fetching outlet user:', error)
    res.status(500).json({ error: 'Failed to fetch outlet user' })
  }
}

// Get designations for dropdown
exports.getDesignations = (req, res) => {
  try {
    const designations = db
      .prepare(
        'SELECT designationid, Designation FROM mstdesignation WHERE status = 0 ORDER BY Designation',
      )
      .all()
    res.json(designations)
  } catch (error) {
    console.error('Error fetching designations:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// Get user types for dropdown
exports.getUserTypes = (req, res) => {
  try {
    const userTypes = db
      .prepare('SELECT usertypeid, User_type FROM mstuserType WHERE status = 0 ORDER BY User_type')
      .all()
    res.json(userTypes)
  } catch (error) {
    console.error('Error fetching user types:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// Get hotel admins specifically
exports.getHotelAdmins = (req, res) => {
  try {
    const { currentUserId, roleLevel, brandId, hotelId } = req.query

    let query = `
            SELECT u.*, 
                   b.hotel_name as brand_name,
                   h.hotel_name as hotel_name
            FROM mst_users u
            LEFT JOIN msthotelmasters b ON u.brand_id = b.hotelid
            LEFT JOIN msthotelmasters h ON u.hotelid = h.hotelid
            WHERE u.status = 0 AND u.role_level = 'hotel_admin'
        `

    const params = []

    switch (roleLevel) {
      case 'superadmin':
        break
      case 'brand_admin':
        query += ' AND u.brand_id = ?'
        params.push(brandId)
        break
      case 'hotel_admin':
        query += ' AND u.hotelid = ?'
        params.push(hotelId)
        break
      default:
        return res.status(403).json({ message: 'Insufficient permissions' })
    }

    query += ' ORDER BY u.created_date DESC'

    const hotelAdmins = db.prepare(query).all(...params)
    res.json(hotelAdmins)
  } catch (error) {
    console.error('Error fetching hotel admins:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}

// Get hotel admin by ID
exports.getHotelAdminById = (req, res) => {
  try {
    const { id } = req.params
    const hotelAdmin = db
      .prepare(
        `
            SELECT u.*, 
                   b.hotel_name as brand_name,
                   h.hotel_name as hotel_name
            FROM mst_users u
            LEFT JOIN msthotelmasters b ON u.brand_id = b.hotelid
            LEFT JOIN msthotelmasters h ON u.hotelid = h.hotelid
            WHERE u.userid = ? AND u.role_level = 'hotel_admin' AND u.status = 0
        `,
      )
      .get(id)

    if (!hotelAdmin) {
      return res.status(404).json({ error: 'Hotel admin not found' })
    }

    res.json(hotelAdmin)
  } catch (error) {
    console.error('Error fetching hotel admin:', error)
    res.status(500).json({ error: 'Failed to fetch hotel admin' })
  }
}

// Update hotel admin
exports.updateHotelAdmin = async (req, res) => {
  try {
    const { id } = req.params
    const { full_name, phone, status, updated_by_id } = req.body

    const existingUser = db.prepare('SELECT role_level FROM mst_users WHERE userid = ?').get(id)
    if (!existingUser || existingUser.role_level !== 'hotel_admin') {
      return res.status(404).json({ message: 'Hotel admin not found' })
    }

    const updateFields = []
    const params = []

    if (full_name) {
      updateFields.push('full_name = ?')
      params.push(full_name)
    }
    if (phone !== undefined) {
      updateFields.push('phone = ?')
      params.push(phone)
    }
    if (status !== undefined) {
      updateFields.push('status = ?')
      params.push(status)
    }

    updateFields.push('updated_by_id = ?')
    updateFields.push("updated_date = datetime('now')")
    params.push(updated_by_id, id)

    const stmt = db.prepare(`UPDATE mst_users SET ${updateFields.join(', ')} WHERE userid = ?`)
    stmt.run(...params)

    res.json({ message: 'Hotel admin updated successfully' })
  } catch (error) {
    console.error('Error updating hotel admin:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
}