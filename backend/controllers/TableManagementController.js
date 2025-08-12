const db = require('../config/db');

const TableManagementController = {
  // Create a new table management record
  createTableManagement: async (req, res) => {
    try {
      const {
        table_name,
        hotel_name,
        outletid,
        hotelid,
        marketid,
        status = 1,
        created_by_id
      } = req.body;

      // Validate required fields
      if (!table_name || !hotel_name) {
        return res.status(400).json({
          success: false,
          message: 'Table name and hotel name are required'
        });
      }

      const created_date = new Date().toISOString();
      
      const query = `
        INSERT INTO msttablemanagement (
          table_name, hotel_name, outletid, hotelid, marketid, 
          status, created_by_id, created_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        table_name, hotel_name, outletid, hotelid, marketid,
        status, created_by_id, created_date
      ];

      const [result] = await db.execute(query, values);
      
      res.status(201).json({
        success: true,
        message: 'Table management record created successfully',
        data: {
          tableid: result.insertId,
          ...req.body,
          created_date
        }
      });
    } catch (error) {
      console.error('Error creating table management record:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating table management record',
        error: error.message
      });
    }
  },

  // Get all table management records
  getAllTableManagements: async (req, res) => {
    try {
      const { page = 1, limit = 10, search = '', status } = req.query;
      const offset = (page - 1) * limit;

      let query = `
        SELECT 
          tm.*,
          hm.hotelname as hotel_details,
          mo.outletname as outlet_details,
          m.marketname as market_details
        FROM msttablemanagement tm
        LEFT JOIN msthotelmasters hm ON tm.hotelid = hm.hotelid
        LEFT JOIN mst_outlets mo ON tm.outletid = mo.outletid
        LEFT JOIN mstmarkets m ON tm.marketid = m.marketid
        WHERE 1=1
      `;
      
      const params = [];
      
      if (search) {
        query += ` AND (tm.table_name LIKE ? OR tm.hotel_name LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`);
      }
      
      if (status !== undefined) {
        query += ` AND tm.status = ?`;
        params.push(status);
      }
      
      query += ` ORDER BY tm.tableid DESC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));

      const [rows] = await db.execute(query, params);
      
      // Get total count for pagination
      let countQuery = `SELECT COUNT(*) as total FROM msttablemanagement WHERE 1=1`;
      const countParams = [];
      
      if (search) {
        countQuery += ` AND (table_name LIKE ? OR hotel_name LIKE ?)`;
        countParams.push(`%${search}%`, `%${search}%`);
      }
      
      if (status !== undefined) {
        countQuery += ` AND status = ?`;
        countParams.push(status);
      }
      
      const [countResult] = await db.execute(countQuery, countParams);
      const total = countResult[0].total;

      res.json({
        success: true,
        data: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching table management records:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching table management records',
        error: error.message
      });
    }
  },

  // Get single table management record by ID
  getTableManagementById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const query = `
        SELECT 
          tm.*,
          hm.hotelname as hotel_details,
          mo.outletname as outlet_details,
          m.marketname as market_details
        FROM msttablemanagement tm
        LEFT JOIN msthotelmasters hm ON tm.hotelid = hm.hotelid
        LEFT JOIN mst_outlets mo ON tm.outletid = mo.outletid
        LEFT JOIN mstmarkets m ON tm.marketid = m.marketid
        WHERE tm.tableid = ?
      `;
      
      const [rows] = await db.execute(query, [id]);
      
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Table management record not found'
        });
      }
      
      res.json({
        success: true,
        data: rows[0]
      });
    } catch (error) {
      console.error('Error fetching table management record:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching table management record',
        error: error.message
      });
    }
  },

  // Update table management record
  updateTableManagement: async (req, res) => {
    try {
      const { id } = req.params;
      const {
        table_name,
        hotel_name,
        outletid,
        hotelid,
        marketid,
        status,
        updated_by_id
      } = req.body;

      const updated_date = new Date().toISOString();
      
      // Build dynamic update query based on provided fields
      const fields = [];
      const values = [];
      
      if (table_name !== undefined) {
        fields.push('table_name = ?');
        values.push(table_name);
      }
      if (hotel_name !== undefined) {
        fields.push('hotel_name = ?');
        values.push(hotel_name);
      }
      if (outletid !== undefined) {
        fields.push('outletid = ?');
        values.push(outletid);
      }
      if (hotelid !== undefined) {
        fields.push('hotelid = ?');
        values.push(hotelid);
      }
      if (marketid !== undefined) {
        fields.push('marketid = ?');
        values.push(marketid);
      }
      if (status !== undefined) {
        fields.push('status = ?');
        values.push(status);
      }
      
      fields.push('updated_by_id = ?');
      fields.push('updated_date = ?');
      values.push(updated_by_id, updated_date);
      
      if (fields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No fields to update'
        });
      }
      
      values.push(id);
      
      const query = `
        UPDATE msttablemanagement 
        SET ${fields.join(', ')} 
        WHERE tableid = ?
      `;
      
      const [result] = await db.execute(query, values);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Table management record not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Table management record updated successfully'
      });
    } catch (error) {
      console.error('Error updating table management record:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating table management record',
        error: error.message
      });
    }
  },

  // Delete table management record (soft delete)
  deleteTableManagement: async (req, res) => {
    try {
      const { id } = req.params;
      
      const query = `
        UPDATE msttablemanagement 
        SET status = 0, updated_date = ? 
        WHERE tableid = ?
      `;
      
      const updated_date = new Date().toISOString();
      const [result] = await db.execute(query, [updated_date, id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Table management record not found'
        });
      }
      
      res.json({
        success: true,
        message: 'Table management record deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting table management record:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting table management record',
        error: error.message
      });
    }
  },

  // Get tables by hotel
  getTablesByHotel: async (req, res) => {
    try {
      const { hotelid } = req.params;
      const { status = 1 } = req.query;
      
      const query = `
        SELECT * FROM msttablemanagement 
        WHERE hotelid = ? AND status = ?
        ORDER BY table_name ASC
      `;
      
      const [rows] = await db.execute(query, [hotelid, status]);
      
      res.json({
        success: true,
        data: rows
      });
    } catch (error) {
      console.error('Error fetching tables by hotel:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching tables by hotel',
        error: error.message
      });
    }
  },

  // Get tables by outlet
  getTablesByOutlet: async (req, res) => {
    try {
      const { outletid } = req.params;
      const { status = 1 } = req.query;
      
      const query = `
        SELECT * FROM msttablemanagement 
        WHERE outletid = ? AND status = ?
        ORDER BY table_name ASC
      `;
      
      const [rows] = await db.execute(query, [outletid, status]);
      
      res.json({
        success: true,
        data: rows
      });
    } catch (error) {
      console.error('Error fetching tables by outlet:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching tables by outlet',
        error: error.message
      });
    }
  },

  // Bulk update table status
  updateTableStatus: async (req, res) => {
    try {
      const { ids, status, updated_by_id } = req.body;
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid table IDs provided'
        });
      }
      
      const updated_date = new Date().toISOString();
      const placeholders = ids.map(() => '?').join(',');
      
      const query = `
        UPDATE msttablemanagement 
        SET status = ?, updated_by_id = ?, updated_date = ?
        WHERE tableid IN (${placeholders})
      `;
      
      const [result] = await db.execute(query, [status, updated_by_id, updated_date, ...ids]);
      
      res.json({
        success: true,
        message: `${result.affectedRows} table(s) updated successfully`
      });
    } catch (error) {
      console.error('Error updating table status:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating table status',
        error: error.message
      });
    }
  }
};

module.exports = TableManagementController;
