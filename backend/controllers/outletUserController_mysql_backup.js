const db = require('../config/db')
const bcrypt = require('bcrypt')

// Get outlet users based on current user's role and hierarchy
exports.getOutletUsers = async (req, res) => {
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
      LEFT JOIN mstdesignation d ON u.designationid = d.designationid
      LEFT JOIN mstuserType ut ON u.usertypeid = ut.usertypeid
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
        return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }

    query += " ORDER BY CASE WHEN u.role_level = 'hotel_admin' THEN 0 ELSE 1 END, u.created_date DESC";

    const [users] = await db.query(query, params);
    res.json({ success: true, data: users });
  } catch (error) {
    // console.error('Error fetching outlet users:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ... (rest of the original file content exactly as read previously)

