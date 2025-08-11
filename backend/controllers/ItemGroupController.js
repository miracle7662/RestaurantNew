const db = require('../config/db');

// Get item groups that have at least one menu item
exports.getItemGroupsWithMenuItems = (req, res) => {
  try {
    const query = `
      SELECT DISTINCT ig.item_groupid, ig.itemgroupname, ig.status
      FROM ItemGroup ig
      INNER JOIN mstrestmenu m ON ig.item_groupid = m.item_group_id
      WHERE m.status = 1 AND ig.status = 0
      ORDER BY ig.itemgroupname
    `;
    const itemGroups = db.prepare(query).all();
    res.json(itemGroups);
  } catch (error) {
    console.error('Error fetching item groups with menu items:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
