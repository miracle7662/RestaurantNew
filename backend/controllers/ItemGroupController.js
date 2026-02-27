const db = require('../config/db');

// Get item groups that have at least one menu item
// exports.getItemGroupsWithMenuItems = (req, res) => {
//   try {
//     const query = `
//       SELECT DISTINCT ig.item_groupid, ig.itemgroupname, ig.status
//       FROM ItemGroup ig
//       INNER JOIN mstrestmenu m ON ig.item_groupid = m.item_group_id
//       WHERE m.status = 1 AND ig.status = 0
//       ORDER BY ig.itemgroupname
//     `;
//     const itemGroups = db.prepare(query).all();
//     res.json(itemGroups);
//   } catch (error) {
//     console.error('Error fetching item groups with menu items:', error);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// };



exports.getItemGroup = (req, res) => {
    const query = `
      SELECT ig.*, img.item_group_name AS item_maingroup_name
      FROM mst_Item_Group ig
      LEFT JOIN mst_Item_Main_Group img ON ig.kitchencategoryid = img.item_maingroupid
    `;
    const ItemGroup = db.prepare(query).all();
    res.status(200).json({
  success: true,
  message: "Item Groups fetched successfully",
  data: ItemGroup,
  error: null
});
};

exports.addItemGroup = (req, res) => {
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

    const stmt = db.prepare(`
      INSERT INTO mst_Item_Group
      (itemgroupname, code, kitchencategoryid, status, created_by_id, created_date, hotelid, marketid)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      itemgroupname,
      code,
      kitchencategoryid,
      status,
      created_by_id,
      created_date,
      hotelid,
      marketid
    );

    res.status(201).json({
      success: true,
      message: "Item Group created successfully",
      data: {
        item_groupid: result.lastInsertRowid,
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


exports.updateItemGroup = (req, res) => {
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

    const stmt = db.prepare(`
      UPDATE mst_Item_Group
      SET itemgroupname = ?,
          code = ?,
          kitchencategoryid = ?,
          status = ?,
          updated_by_id = ?,
          updated_date = ?
      WHERE item_groupid = ?
    `);

    const result = stmt.run(
      itemgroupname,
      code,
      kitchencategoryid,
      status,
      updated_by_id,
      updated_date,
      id
    );

    if (result.changes === 0) {
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



exports.deleteItemGroup = (req, res) => {
    const { id } = req.params;
    const stmt = db.prepare('DELETE FROM mst_Item_Group WHERE item_groupid = ?');
    stmt.run(id);
    res.json({ message: 'Deleted' });
};




