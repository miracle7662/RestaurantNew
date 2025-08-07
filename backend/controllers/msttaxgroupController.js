const db = require('../config/db');

exports.getAllTaxGroups = (req, res) => {
  try {
    const { hotelid } = req.query;
    
    let sql = `
      SELECT tg.*, h.hotel_name, u.username AS created_by
      FROM msttaxgroup tg
      LEFT JOIN msthotelmasters h ON tg.hotelid = h.hotelid
      LEFT JOIN mst_users u ON tg.created_by_id = u.userid
    `;
    
    let params = [];
    
    if (hotelid) {
      sql += ' WHERE tg.hotelid = ?';
      params.push(hotelid);
    }
    
    sql += ' ORDER BY tg.taxgroupid DESC';
    
    const taxGroups = db.prepare(sql).all(params);
    
    res.status(200).json({
      success: true,
      data: taxGroups,
      count: taxGroups.length
    });
  } catch (error) {
    console.error('Error fetching tax groups:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tax groups',
      error: error.message
    });
  }
};

exports.getTaxGroupById = (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT tg.*, h.hotel_name, u.username AS created_by
      FROM msttaxgroup tg
      LEFT JOIN msthotelmasters h ON tg.hotelid = h.hotelid
      LEFT JOIN mst_users u ON tg.created_by_id = u.userid
      WHERE tg.taxgroupid = ?
    `;
    
    const taxGroup = db.prepare(sql).get(id);
    
    if (!taxGroup) {
      return res.status(404).json({
        success: false,
        message: 'Tax group not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: taxGroup
    });
  } catch (error) {
    console.error('Error fetching tax group:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching tax group',
      error: error.message
    });
  }
};

exports.createTaxGroup = (req, res) => {
  try {
    const { taxgroup_name, hotelid, status, created_by_id } = req.body;
    
    if (!taxgroup_name ) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: '
      });
    }
    
    const sql = `
      INSERT INTO msttaxgroup (taxgroup_name, hotelid, status, created_by_id, created_date)
      VALUES (?, ?, ?, ?, datetime('now'))
    `;
    const params = [
      taxgroup_name,
      hotelid,
      status,
      created_by_id,
    ];
    
    const result = db.prepare(sql).run(params);
    
    res.status(201).json({
      success: true,
      message: 'Tax group created successfully',
      data: { taxgroupid: result.lastInsertRowid }
    });
  } catch (error) {
    console.error('Error creating tax group:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating tax group',
      error: error.message
    });
  }
};

exports.updateTaxGroup = (req, res) => {
  try {
    console.log('updateTaxGroup req.body:', req.body);
    const { id } = req.params;
    console.log('updateTaxGroup id:', id);
    const { taxgroup_name, hotelid, status, updated_by_id } = req.body;
    console.log('updateTaxGroup params:', { taxgroup_name, hotelid, status, updated_by_id });

    // Helper function to check if status is valid (allow 0 or '0')
   const isValidStatus = (val) => val === 0 || val === 1 || val === '0' || val === '1';

    if (
      taxgroup_name === undefined || taxgroup_name === null ||
      hotelid === undefined || hotelid === null ||
      !isValidStatus(status) ||
      updated_by_id === undefined || updated_by_id === null
    ) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: taxgroup_name, hotelid, status, updated_by_id'
      });
    }

    const sql = `
      UPDATE msttaxgroup
      SET taxgroup_name = ?, hotelid = ?, status = ?, updated_by_id = ?, updated_date = datetime('now')
      WHERE taxgroupid = ?
    `;
    const params = [
      taxgroup_name,
      hotelid,
      parseInt(status),
      updated_by_id,
      parseInt(id),
    ];

    console.log('updateTaxGroup SQL params:', params);

    const result = db.prepare(sql).run(params);

    console.log('updateTaxGroup result:', result);

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tax group not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Tax group updated successfully'
    });
  } catch (error) {
    console.error('Error updating tax group:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating tax group',
      error: error.message
    });
  }
};

exports.deleteTaxGroup = (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `DELETE FROM msttaxgroup WHERE taxgroupid = ?`;
    const result = db.prepare(sql).run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: 'Tax group not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Tax group deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tax group:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting tax group',
      error: error.message
    });
  }
};
