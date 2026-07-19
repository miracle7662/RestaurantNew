// controllers/userPermissionsController.js
const db = require('../config/db');

// ─── GET: hotel_type ke according modules ─────────────────────────────────
exports.getModulesByHotelType = async (req, res) => {
  try {
    const { hotel_type } = req.params;
    const type = hotel_type?.toLowerCase().trim();

    let typeFilter;
   if (type === 'lodging') {
  typeFilter = `menu_type IN ('lodging', 'both', 'common')`;
    } else if (type === 'both') {
      typeFilter = `menu_type IN ('restaurant', 'lodging', 'both', 'common')`;
    } else {
      // restaurant, reataurant, ya kuch bhi
      typeFilter = `menu_type IN ('restaurant', 'both', 'common')`;
    }

    const [rows] = await db.query(`
      SELECT
        moduleid,
        module_key,
        module_name,
        route,
        icon,
        parent_moduleid,
        menu_type,
        is_title,
        display_order
      FROM mst_modules
      WHERE is_active = 1
        AND is_menu   = 1
        AND ${typeFilter}
      ORDER BY display_order ASC
    `);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('getModulesByHotelType Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── GET: user permissions ────────────────────────────────────────────────
exports.getUserPermissions = async (req, res) => {
  try {
    const { userid } = req.params;

    const [rows] = await db.query(`
      SELECT
        up.permissionid,
        up.userid,
        up.moduleid,
        up.can_view,
        up.can_create,
        up.can_edit,
        up.can_delete,
        up.created_by_id,
        up.created_date,
        m.module_key,
        m.module_name,
        m.menu_type,
        m.display_order
      FROM mst_user_permissions up
      INNER JOIN mst_modules m ON m.moduleid = up.moduleid
      WHERE up.userid = ?
        AND m.is_active = 1
      ORDER BY m.display_order ASC
    `, [userid]);

    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('getUserPermissions Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// ─── POST: save user permissions ──────────────────────────────────────────
exports.saveUserPermissions = async (req, res) => {
  try {
    const { userid } = req.params;
    const { permissions, created_by_id } = req.body;
    // permissions = [{ moduleid, can_view, can_create, can_edit, can_delete }]

    await db.query(`DELETE FROM mst_user_permissions WHERE userid = ?`, [userid]);

    if (permissions && permissions.length > 0) {
      const values = permissions.map(p => [
        userid,
        p.moduleid,           // ← moduleid (INT)
        p.can_view   ? 1 : 0,
        p.can_create ? 1 : 0,
        p.can_edit   ? 1 : 0,
        p.can_delete ? 1 : 0,
        created_by_id,
        new Date(),
      ]);

      await db.query(`
        INSERT INTO mst_user_permissions
          (userid, moduleid, can_view, can_create, can_edit, can_delete, created_by_id, created_date)
        VALUES ?
      `, [values]);
    }

    res.json({ success: true, message: 'Permissions saved successfully' });
  } catch (error) {
    console.error('saveUserPermissions Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// controllers/userPermissionsController.js mein add karo

// Default ON module_keys (restaurant)
const DEFAULT_RESTAURANT_MODULES = [
  'POS',
  'Settlement', 
  'KitchenAllocation',
  'Handover',
  'DayEnd',
  'Customers',
  'Menu',
  'DailySalesReport',
  'Settings',
  'BackdatedDayend',
  'Logout',
]

exports.insertDefaultPermissions = async (userid, hotelType, createdById, connection) => {
  try {
    const type = hotelType?.toLowerCase().trim();

    let typeFilter;
    if (type === 'lodging') {
      typeFilter = `menu_type IN ('lodging', 'common')`;
    } else if (type === 'both') {
      typeFilter = `menu_type IN ('restaurant', 'lodging', 'both', 'common')`;
    } else {
      typeFilter = `menu_type IN ('restaurant', 'both', 'common')`;
    }

    // Saare active modules fetch karo
    const [modules] = await connection.query(`
      SELECT moduleid, module_key, menu_type
      FROM mst_modules
      WHERE is_active = 1
        AND is_menu   = 1
        AND is_title  = 0
        AND ${typeFilter}
      ORDER BY display_order ASC
    `);

    if (!modules.length) return;

    // Default ON keys ka Set
    const defaultOnKeys = new Set(DEFAULT_RESTAURANT_MODULES);

    const values = modules.map(m => [
      userid,
      m.moduleid,
      defaultOnKeys.has(m.module_key) ? 1 : 0,  // can_view
      0,                                          // can_create
      0,                                          // can_edit
      0,                                          // can_delete
      createdById,
      new Date(),
    ]);

    await connection.query(`
      INSERT INTO mst_user_permissions
        (userid, moduleid, can_view, can_create, can_edit, can_delete, created_by_id, created_date)
      VALUES ?
    `, [values]);

    console.log(`✅ Default permissions inserted for userid: ${userid}`);
  } catch (error) {
    console.error('insertDefaultPermissions Error:', error);
    throw error;
  }
};