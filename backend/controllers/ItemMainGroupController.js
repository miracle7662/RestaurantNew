const db = require('../config/db');

/* ═══════════════════════════════════════
   GET ALL
═══════════════════════════════════════ */
exports.getItemMainGroup = async (req, res) => {
  try {
    const { hotelid } = req.query;

    if (!hotelid || hotelid === 'undefined' || hotelid === '' || hotelid === 'null') {
      return res.status(200).json({
        success: true,
        message: "Item Main Groups fetched successfully",
        data: [],
        error: null
      });
    }

    let query = `
      SELECT * FROM mst_Item_Main_Group
      WHERE (hotelid = ? OR hotelid = ?)
      ORDER BY item_group_name
    `;

    const [rows] = await db.query(query, [String(hotelid), Number(hotelid)]);

    res.status(200).json({
      success: true,
      message: "Item Main Groups fetched successfully",
      data: rows,
      error: null
    });

  } catch (error) {
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
exports.addItemMainGroup = async (req, res) => {
  try {
    const {
      item_group_name,
      status,
      created_by_id,
      created_date,
      hotelid,
      marketid
    } = req.body;

    const [result] = await db.query(`
      INSERT INTO mst_Item_Main_Group
      (item_group_name, status, created_by_id, created_date, hotelid, marketid)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      item_group_name,
      status,
      created_by_id,
      created_date,
      hotelid,
      marketid
    ]);

    res.status(201).json({
      success: true,
      message: "Item Main Group created successfully",
      data: {
        item_maingroupid: result.insertId,
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
exports.updateItemMainGroup = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      item_group_name,
      status,
      updated_by_id,
      updated_date
    } = req.body;

    const [result] = await db.query(`
      UPDATE mst_Item_Main_Group
      SET item_group_name = ?,
          status = ?,
          updated_by_id = ?,
          updated_date = ?
      WHERE item_maingroupid = ?
    `, [
      item_group_name,
      status,
      updated_by_id,
      updated_date,
      id
    ]);

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
exports.deleteItemMainGroup = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `DELETE FROM mst_Item_Main_Group WHERE item_maingroupid = ?`,
      [id]
    );

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