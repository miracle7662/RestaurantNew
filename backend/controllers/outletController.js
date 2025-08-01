const db = require('../config/db')

// Get brands/hotels based on user role
exports.getBrands = (req, res) => {
  try {
    const { role_level, hotelid } = req.query

    let query = 'SELECT hotelid, hotel_name FROM msthotelmasters' // status = 0 means status
    let params = []

    // If user is hotel_admin, only show their hotel
    if (role_level === 'hotel_admin' && hotelid) {
      query += ' WHERE hotelid = ?'
      params.push(hotelid)
    }
    // If user is superadmin, show all hotels (no additional WHERE clause)

    const brands = db.prepare(query).all(...params)
    res.json(brands)
  } catch (error) {
    console.error('Error fetching brands:', error)
    res.status(500).json({ error: 'Failed to fetch brands' })
  }
}

exports.getOutlets = (req, res) => {
  try {
    console.log('getOutlets req.query:', req.query)
    const { role_level, hotelid, brand_id, created_by_id, outletid } = req.query
    let query = `
            SELECT o.*, h.hotel_name as brand_name 
            FROM mst_outlets o 
            inner JOIN msthotelmasters h ON o.hotelid = h.hotelid


        `
    let whereConditions = []
    let params = []

    // Filter based on user role and permissions
    if (role_level === 'hotel_admin') {
      if (brand_id || hotelid) {
        whereConditions.push('o.hotelid = ?')
        params.push(brand_id || hotelid) // Prefer brand_id if provided
      }
      // Remove the created_by_id filter for hotel_admin so they can see all outlets for their hotel
      // if (created_by_id) {
      //   whereConditions.push('o.created_by_id = ?')
      //   params.push(created_by_id)
      // }
    } else if (role_level === 'brand_admin') {
      if (brand_id || hotelid) {
        whereConditions.push('o.hotelid = ?')
        params.push(brand_id || hotelid)
      }
    } else if (role_level === 'outlet_user') {
      // Outlet users can only see their assigned outlets (support multiple)
      if (outletid) {
        const outletIdsArray = outletid.split(',').map(id => id.trim()).filter(id => id.length > 0)
        if (outletIdsArray.length === 1) {
          whereConditions.push('o.outletid = ?')
          params.push(outletIdsArray[0])
        } else if (outletIdsArray.length > 1) {
          const placeholders = outletIdsArray.map(() => '?').join(',')
          whereConditions.push(`o.outletid IN (${placeholders})`)
          params.push(...outletIdsArray)
        }
      } else {
        // If no outletid provided, return empty array
        res.status(200).json([])
        return
      }
    } else if (role_level === 'superadmin') {
      // No filter for superadmin
    } else {
      if (created_by_id) {
        whereConditions.push('o.created_by_id = ?')
        params.push(created_by_id)
      }
    }

    // Add WHERE clause only if there are conditions
    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ')
    }

    query += ' ORDER BY o.created_date DESC'

    console.log('Final query:', query)
    console.log('Query params:', params)

    const outlets = db.prepare(query).all(...params)
    console.log('Found outlets:', outlets)
    res.status(200).json(outlets)
  } catch (error) {
    console.error('Error fetching outlets:', {
      message: error.message,
      stack: error.stack,
      query: req.query,
    })
    res.status(500).json({ error: 'Failed to fetch outlets', details: error.message })
  }
}
exports.addOutlet = (req, res) => {
  try {
    const {
      outlet_name,
      hotelid,
      market_id,
      outlet_code,
      phone,
      email,
      website,
      address,
      city,
      zip_code,
      country,
      timezone,
      start_day_time,
      close_day_time,
      next_reset_bill_date,
      next_reset_bill_days,
      next_reset_kot_date,
      next_reset_kot_days,
      contact_phone,
      notification_email,
      description,
      logo,
      gst_no,
      fssai_no,
      status,
      digital_order,
      created_by_id,
    } = req.body

    // Validate required fields
    if (!outlet_name) {
      return res.status(400).json({ error: 'Outlet name is required' })
    }

    const stmt = db.prepare(`
            INSERT INTO mst_outlets (
                outlet_name, hotelid, market_id, outlet_code, phone, email, website,
                address, city, zip_code, country, timezone, start_day_time, close_day_time,
                next_reset_bill_date, next_reset_bill_days, next_reset_kot_date, next_reset_kot_days,
                contact_phone, notification_email, description, logo, gst_no, fssai_no,
                status, digital_order, created_by_id, created_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)

    const result = stmt.run(
      outlet_name,
      hotelid,
      market_id,
      outlet_code,
      phone,
      email,
      website,
      address,
      city,
      zip_code,
      country,
      timezone,
      start_day_time,
      close_day_time,
      next_reset_bill_date,
      next_reset_bill_days,
      next_reset_kot_date,
      next_reset_kot_days,
      contact_phone,
      notification_email,
      description,
      logo,
      gst_no,
      fssai_no,
      status || 0,
      digital_order || 0,
      created_by_id,
      new Date().toISOString(),
    )

    res.json({
      id: result.lastInsertRowid,
      outlet_name,
      hotelid,
      market_id,
      outlet_code,
      phone,
      email,
      website,
      address,
      city,
      zip_code,
      country,
      timezone,
      start_day_time,
      close_day_time,
      next_reset_bill_date,
      next_reset_bill_days,
      next_reset_kot_date,
      next_reset_kot_days,
      contact_phone,
      notification_email,
      description,
      logo,
      gst_no,
      fssai_no,
      status: status || 0,
      digital_order: digital_order || 0,
      created_by_id,
      created_date: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error adding outlet:', error)
    res.status(500).json({ error: 'Failed to add outlet' })
  }
}

exports.updateOutlet = (req, res) => {
  try {
    const { id } = req.params
    const {
      outlet_name,
      hotelid,
      market_id,
      outlet_code,
      phone,
      email,
      website,
      address,
      city,
      zip_code,
      country,
      timezone,
      start_day_time,
      close_day_time,
      next_reset_bill_date,
      next_reset_bill_days,
      next_reset_kot_date,
      next_reset_kot_days,
      contact_phone,
      notification_email,
      description,
      logo,
      gst_no,
      fssai_no,
      status,
      digital_order,
      updated_by_id,
    } = req.body

    // Validate required fields
    if (!outlet_name) {
      return res.status(400).json({ error: 'Outlet name is required' })
    }

    const stmt = db.prepare(`
            UPDATE mst_outlets SET 
                outlet_name = ?, hotelid = ?, market_id = ?, outlet_code = ?, phone = ?, 
                email = ?, website = ?, address = ?, city = ?, zip_code = ?, country = ?, 
                timezone = ?, start_day_time = ?, close_day_time = ?, next_reset_bill_date = ?, 
                next_reset_bill_days = ?, next_reset_kot_date = ?, next_reset_kot_days = ?, 
                contact_phone = ?, notification_email = ?, description = ?, logo = ?, 
                gst_no = ?, fssai_no = ?, status = ?, digital_order = ?, updated_by_id = ?, 
                updated_date = ? 
            WHERE outletid = ?
        `)

    stmt.run(
      outlet_name,
      hotelid,
      market_id,
      outlet_code,
      phone,
      email,
      website,
      address,
      city,
      zip_code,
      country,
      timezone,
      start_day_time,
      close_day_time,
      next_reset_bill_date,
      next_reset_bill_days,
      next_reset_kot_date,
      next_reset_kot_days,
      contact_phone,
      notification_email,
      description,
      logo,
      gst_no,
      fssai_no,
      status,
      digital_order,
      updated_by_id,
      new Date().toISOString(),
      id,
    )

    res.json({
      id,
      outlet_name,
      hotelid,
      market_id,
      outlet_code,
      phone,
      email,
      website,
      address,
      city,
      zip_code,
      country,
      timezone,
      start_day_time,
      close_day_time,
      next_reset_bill_date,
      next_reset_bill_days,
      next_reset_kot_date,
      next_reset_kot_days,
      contact_phone,
      notification_email,
      description,
      logo,
      gst_no,
      fssai_no,
      status,
      digital_order,
      updated_by_id,
      updated_date: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error updating outlet:', error)
    res.status(500).json({ error: 'Failed to update outlet' })
  }
}

exports.deleteOutlet = (req, res) => {
  try {
    const { id } = req.params
    const stmt = db.prepare('DELETE FROM mst_outlets WHERE outletid = ?')
    stmt.run(id)
    res.json({ message: 'Outlet deleted successfully' })
  } catch (error) {
    console.error('Error deleting outlet:', error)
    res.status(500).json({ error: 'Failed to delete outlet' })
  }
}

exports.getOutletById = (req, res) => {
  try {
    const { id } = req.params
    const outlet = db
      .prepare(
        `
            SELECT o.*, h.hotel_name as brand_name 
            FROM mst_outlets o 
            LEFT JOIN msthotelmasters h ON o.hotelid = h.hotelid 
            WHERE o.outletid = ?
        `,
      )
      .get(id)

    if (!outlet) {
      return res.status(404).json({ error: 'Outlet not found' })
    }

    res.json(outlet)
  } catch (error) {
    console.error('Error fetching outlet:', error)
    res.status(500).json({ error: 'Failed to fetch outlet' })
  }
}

exports.getOutletuserById = (req, res) => {
  try {
    const { role_level, hotelid, brand_id, userid,created_by_id, outletid } = req.query;
    const user = req.user || {};
    const hotelId = Number(brand_id || hotelid || user.hotelid );
    const createdById = Number(user.userid || created_by_id );
    if (isNaN(hotelId)) {
      return res.status(400).json({ error: 'Invalid hotel ID' });
    }
    let query = `
     SELECT o.*,o.outlet_name, h.hotel_name as brand_name 
            FROM mst_outlets o              
            inner JOIN msthotelmasters h ON h.hotelid = o.hotelid
            inner join mst_users mu on mu.outletid =o.outletid
            where
    `;
    let params = [];
    if (role_level === 'hotel_admin') {
      query += ' WHERE o.hotelid = ?';
      params.push(hotelId);
    } else if (role_level === 'brand_admin') {
      query += ' WHERE o.hotelid = ?';
      params.push(hotelId);
    } else if (role_level === 'superadmin') {
      // No filter
    } else if (role_level === 'outlet_user' && userid && outletid) {
      query += ' WHERE mu.hotelid = ? AND mu.userid = 33 AND mu.outletid = ?';
      params.push(hotelId, created_by_id, outletid);
    } else if (created_by_id) {
      query += ' WHERE o.created_by_id = ?';
      params.push(createdById);
    }
    query += ' ORDER BY o.created_date DESC';
    console.log('Final query:', query);
    console.log('Query params:', params);
    const outlets = db.prepare(query).all(...params);
    if (!outlets || outlets.length === 0) {
      return res.status(404).json({ error: 'No outlets found' });
    }
    res.json(outlets);
  } catch (error) {
    console.error('Error fetching outlets:', {
      message: error.message,
      stack: error.stack,
      query: req.query,
    });
    res.status(500).json({ error: 'Failed to fetch outlets', details: error.message });
  }
};