const db = require('../config/db');
const { formatMySQLDate } = require('../utils/dateUtils');

/* ═══════════════════════════════════════
   GET ALL
═══════════════════════════════════════ */
exports.getItemGroup = async (req, res) => {
  try {
    const { hotelid } = req.query;

    if (!hotelid || hotelid === 'undefined' || hotelid === '' || hotelid === 'null') {
      return res.status(200).json({
        success: true,
        message: "Item Groups fetched successfully",
        data: [],
        error: null
      });
    }

    let query = `
      SELECT ig.*, img.item_group_name AS item_maingroup_name
      FROM mst_Item_Group ig
      LEFT JOIN mst_Item_Main_Group img 
      ON ig.kitchencategoryid = img.item_maingroupid
      WHERE (ig.hotelid = ? OR ig.hotelid = ?)
      ORDER BY ig.itemgroupname
    `;

    const [rows] = await db.query(query, [String(hotelid), Number(hotelid)]);

    res.status(200).json({
      success: true,
      message: "Item Groups fetched successfully",
      data: rows,
      error: null
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch Item Groups",
      data: null,
      error: error.message
    });
  }
};


/* ═══════════════════════════════════════
   CREATE
═══════════════════════════════════════ */
exports.addItemGroup = async (req, res) => {
  try {
    const {
      itemgroupname,
      code,
      kitchencategoryid,
      status,
      created_by_id,
      created_date,
      hotelid,
      marketid
    } = req.body;

    const [result] = await db.query(`
      INSERT INTO mst_Item_Group
      (itemgroupname, code, kitchencategoryid, status, created_by_id, created_date, hotelid, marketid)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      itemgroupname,
      code,
      kitchencategoryid,
      status,
      created_by_id,
      formatMySQLDate(created_date),
      hotelid,
      marketid
    ]);

    res.status(201).json({
      success: true,
      message: "Item Group created successfully",
      data: {
        item_groupid: result.insertId,
        itemgroupname,
        code,
        kitchencategoryid,
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
      message: "Failed to create Item Group",
      data: null,
      error: error.message
    });
  }
};


/* ═══════════════════════════════════════
   UPDATE
═══════════════════════════════════════ */
exports.updateItemGroup = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      itemgroupname,
      code,
      kitchencategoryid,
      status,
      updated_by_id,
      updated_date
    } = req.body;

    const [result] = await db.query(`
      UPDATE mst_Item_Group
      SET itemgroupname = ?,
          code = ?,
          kitchencategoryid = ?,
          status = ?,
          updated_by_id = ?,
          updated_date = ?
      WHERE item_groupid = ?
    `, [
      itemgroupname,
      code,
      kitchencategoryid,
      status,
      updated_by_id,
      formatMySQLDate(updated_date),
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Item Group not found",
        data: null,
        error: "No record updated"
      });
    }

    res.status(200).json({
      success: true,
      message: "Item Group updated successfully",
      data: {
        item_groupid: Number(id),
        itemgroupname,
        code,
        kitchencategoryid,
        status,
        updated_by_id,
        updated_date
      },
      error: null
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update Item Group",
      data: null,
      error: error.message
    });
  }
};


/* ═══════════════════════════════════════
   DELETE
═══════════════════════════════════════ */
exports.deleteItemGroup = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await db.query(
      'DELETE FROM mst_Item_Group WHERE item_groupid = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Item Group not found"
      });
    }

    res.json({
      success: true,
      message: "Item Group deleted successfully"
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete Item Group",
      error: error.message
    });
  }
};