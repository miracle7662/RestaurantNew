const db = require('../config/db');

/* ═══════════════════════════════════════
   GET ALL
═══════════════════════════════════════ */
exports.getItemMainGroup = (req, res) => {
  try {
    const { hotelid } = req.query;
    console.log('ItemMainGroup - Received hotelid:', hotelid);
    
    // If no hotelid provided, return empty array - must have hotelid to view items
    if (!hotelid || hotelid === 'undefined' || hotelid === '' || hotelid === 'null') {
      console.log('ItemMainGroup - No valid hotelid provided, returning empty array');
      return res.status(200).json({
        success: true,
        message: "Item Main Groups fetched successfully",
        data: [],
        error: null
      });
    }
    
    let query = `SELECT * FROM mst_Item_Main_Group`;
    const params = [];
    
    // Strict filtering: only show items for the specified hotel
    // Handle both string and numeric hotelid values
    query += ' WHERE (hotelid = ? OR hotelid = ?)';
    params.push(String(hotelid));  // As string
    params.push(Number(hotelid));  // As number
    
    query += ' ORDER BY item_group_name';
    
    console.log('ItemMainGroup - SQL Query:', query);
    console.log('ItemMainGroup - SQL Params:', params);
    
    const rows = db.prepare(query).all(...params);
    console.log('ItemMainGroup - Fetched count:', rows.length);
    if (rows.length > 0) {
      console.log('ItemMainGroup - First item hotelid:', rows[0].hotelid);
      console.log('ItemMainGroup - Last item hotelid:', rows[rows.length - 1].hotelid);
    }

    res.status(200).json({
      success: true,
      message: "Item Main Groups fetched successfully",
      data: rows,
      error: null
    });

  } catch (error) {
    console.error('Error fetching Item Main Groups:', error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch Item Main Groups",
      data: null,
      error: error.message
    });
  }
};


/* ═══════════════════════════════════════
   CREATE
═══════════════════════════════════════ */
exports.addItemMainGroup = (req, res) => {
  try {
    const {
      item_group_name,
      status,
      created_by_id,
      created_date,
      hotelid,
      marketid
    } = req.body;

    const stmt = db.prepare(`
      INSERT INTO mst_Item_Main_Group
      (item_group_name, status, created_by_id, created_date, hotelid, marketid)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      item_group_name,
      status,
      created_by_id,
      created_date,
      hotelid,
      marketid
    );

    res.status(201).json({
      success: true,
      message: "Item Main Group created successfully",
      data: {
        item_maingroupid: result.lastInsertRowid,
        item_group_name,
        status,
        created_by_id,
        created_date,
        hotelid,
        marketid
      },
      error: null
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create Item Main Group",
      data: null,
      error: error.message
    });
  }
};


/* ═══════════════════════════════════════
   UPDATE
═══════════════════════════════════════ */
exports.updateItemMainGroup = (req, res) => {
  try {
    const { id } = req.params;
    const {
      item_group_name,
      status,
      updated_by_id,
      updated_date
    } = req.body;

    const stmt = db.prepare(`
      UPDATE mst_Item_Main_Group
      SET item_group_name = ?,
          status = ?,
          updated_by_id = ?,
          updated_date = ?
      WHERE item_maingroupid = ?
    `);

    stmt.run(
      item_group_name,
      status,
      updated_by_id,
      updated_date,
      id
    );

    res.status(200).json({
      success: true,
      message: "Item Main Group updated successfully",
      data: {
        item_maingroupid: Number(id),
        item_group_name,
        status,
        updated_by_id,
        updated_date
      },
      error: null
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update Item Main Group",
      data: null,
      error: error.message
    });
  }
};


/* ═══════════════════════════════════════
   DELETE
═══════════════════════════════════════ */
exports.deleteItemMainGroup = (req, res) => {
  try {
    const { id } = req.params;

    db.prepare(`
      DELETE FROM mst_Item_Main_Group
      WHERE item_maingroupid = ?
    `).run(id);

    res.status(200).json({
      success: true,
      message: "Item Main Group deleted successfully",
      data: null,
      error: null
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete Item Main Group",
      data: null,
      error: error.message
    });
  }
};