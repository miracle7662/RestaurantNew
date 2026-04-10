const db = require('../config/db');

const OutletMenuController = {
  // Get outlet menus filtered by hotelid/role
  getOutletMenus: (req, res) => {
    try {
      const { role_level, hotelid } = req.query;

      if (!hotelid || hotelid === 'undefined' || hotelid === '') {
        return res.status(200).json({
          success: true,
          message: "Outlet Menus fetched successfully",
          data: [],
          error: null
        });
      }

      let query = `
        SELECT 
          m.id, m.menuName, m.shortName, COALESCE(o.outlet_name, m.outletName) as outletName, 
          m.outletid, m.isPosDefaultMenu, m.defaultDigitalMenu, m.isDigitalMenu, m.publishedAt,
          m.hotelid, m.status
        FROM mst_outlet_menu m
        LEFT JOIN mst_outlets o ON m.outletid = o.outletid
        WHERE m.status = 0
      `;
      const params = [];

      // Role-based filtering
      query += ' AND (hotelid = ? OR hotelid = ?)';
      params.push(String(hotelid), Number(hotelid));

      query += ' ORDER BY menuName';

      const menus = db.prepare(query).all(...params);

      // Format publishedAt for frontend
      const formattedMenus = menus.map(menu => ({
        ...menu,
        publishedAt: menu.publishedAt ? new Date(menu.publishedAt).toLocaleString('en-US', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }) : ''
      }));

      res.status(200).json({
        success: true,
        message: "Outlet Menus fetched successfully",
        data: formattedMenus,
        error: null
      });
    } catch (error) {
      console.error('Error fetching outlet menus:', error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch outlet menus",
        data: null,
        error: error.message
      });
    }
  },

  // Create new outlet menu
  addOutletMenu: (req, res) => {
    try {
      const {
        menuName, shortName, outletName, 
        isPosDefaultMenu, defaultDigitalMenu, isDigitalMenu,
        hotelid, created_by_id
      } = req.body;

      // Validate required fields
      if (!menuName) {
        return res.status(400).json({
          success: false,
          message: "Menu name is required",
          data: null,
          error: "Menu name is required"
        });
      }
      if (!outletId) {
        return res.status(400).json({
          success: false,
          message: "Outlet ID is required",
          data: null,
          error: "Outlet ID is required"
        });
      }
      // Validate outlet exists
      const outlet = db.prepare('SELECT outletid FROM mst_outlets WHERE outletid = ?').get(outletId);
      if (!outlet) {
        return res.status(400).json({
          success: false,
          message: "Invalid outlet ID",
          data: null,
          error: "Outlet not found"
        });
      }
      if (!hotelid) {
        return res.status(400).json({
          success: false,
          message: "Hotel ID is required",
          data: null,
          error: "Hotel ID is required"
        });
      }

      const stmt = db.prepare(`
        INSERT INTO mst_outlet_menu 
        (menuName, shortName, outletid, isPosDefaultMenu, 
         defaultDigitalMenu, isDigitalMenu, publishedAt, 
         hotelid, status, created_by_id, created_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
      `);

      const publishedAt = new Date().toISOString();
      const created_date = new Date().toISOString();

      const result = stmt.run(
        menuName, shortName || '', outletId,
        isPosDefaultMenu ? 1 : 0,
        defaultDigitalMenu ? 1 : 0,
        isDigitalMenu ? 1 : 0,
        publishedAt,
        hotelid,
        created_by_id,
        created_date
      );

      res.status(201).json({
        success: true,
        message: "Outlet Menu created successfully",
        data: {
          id: result.lastInsertRowid,
          menuName,
          shortName: shortName || '',
          outletName,
          isPosDefaultMenu: !!isPosDefaultMenu,
          defaultDigitalMenu: !!defaultDigitalMenu,
          isDigitalMenu: !!isDigitalMenu,
          publishedAt: new Date(publishedAt).toLocaleString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          }),
          hotelid
        },
        error: null
      });
    } catch (error) {
      console.error('Error creating outlet menu:', error);
      res.status(500).json({
        success: false,
        message: "Failed to create outlet menu",
        data: null,
        error: error.message
      });
    }
  },

  // Update outlet menu
  updateOutletMenu: (req, res) => {
    try {
      const { id } = req.params;
        const {
        menuName, shortName, outletId,
        isPosDefaultMenu, defaultDigitalMenu, isDigitalMenu,
        updated_by_id
      } = req.body;

      // Validate outlet exists for update
      if (outletId) {
        const outlet = db.prepare('SELECT outletid FROM mst_outlets WHERE outletid = ?').get(outletId);
        if (!outlet) {
          return res.status(400).json({
            success: false,
            message: "Invalid outlet ID",
            data: null,
            error: "Outlet not found"
          });
        }
      }

      if (!menuName) {
        return res.status(400).json({
          success: false,
          message: "Menu name is required",
          data: null
        });
      }

      const stmt = db.prepare(`
        UPDATE mst_outlet_menu 
        SET menuName = ?, shortName = ?, outletid = ?,
            isPosDefaultMenu = ?, defaultDigitalMenu = ?, isDigitalMenu = ?,
            publishedAt = ?, updated_by_id = ?, updated_date = ?
        WHERE id = ? AND status = 0
      `);

      const publishedAt = new Date().toISOString();
      const updated_date = new Date().toISOString();

      const result = stmt.run(
        menuName, shortName || '', outletId || null,
        isPosDefaultMenu ? 1 : 0,
        defaultDigitalMenu ? 1 : 0,
        isDigitalMenu ? 1 : 0,
        publishedAt,
        updated_by_id,
        updated_date,
        id
      );

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          message: "Outlet Menu not found or already deleted",
          data: null
        });
      }

      res.status(200).json({
        success: true,
        message: "Outlet Menu updated successfully",
        data: {
          id: Number(id),
          menuName,
          shortName: shortName || '',
          outletName,
          isPosDefaultMenu: !!isPosDefaultMenu,
          defaultDigitalMenu: !!defaultDigitalMenu,
          isDigitalMenu: !!isDigitalMenu,
          publishedAt: new Date(publishedAt).toLocaleString('en-US', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        }
      });
    } catch (error) {
      console.error('Error updating outlet menu:', error);
      res.status(500).json({
        success: false,
        message: "Failed to update outlet menu",
        data: null,
        error: error.message
      });
    }
  },

  // Delete outlet menu (soft delete)
  deleteOutletMenu: (req, res) => {
    try {
      const { id } = req.params;

      const stmt = db.prepare(`
        UPDATE mst_outlet_menu 
        SET status = 1, updated_date = ? 
        WHERE id = ? AND status = 0
      `);

      const updated_date = new Date().toISOString();
      const result = stmt.run(updated_date, id);

      if (result.changes === 0) {
        return res.status(404).json({
          success: false,
          message: "Outlet Menu not found or already deleted",
          data: null
        });
      }

      res.status(200).json({
        success: true,
        message: "Outlet Menu deleted successfully",
        data: { id: Number(id) }
      });
    } catch (error) {
      console.error('Error deleting outlet menu:', error);
      res.status(500).json({
        success: false,
        message: "Failed to delete outlet menu",
        data: null,
        error: error.message
      });
    }
  }
};

module.exports = OutletMenuController;

