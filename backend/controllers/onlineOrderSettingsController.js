const db = require("../config/db");

// CREATE
exports.createOnlineOrderSetting = (req, res) => {
  try {
    const data = req.body;

    // Validate required fields
    if (!data.outletid) {
      return res.status(400).json({ success: false, error: "outletid is required" });
    }

    const stmt = db.prepare(`
      INSERT INTO mstonline_orders_settings (
        outletid, show_in_preparation_kds, auto_accept_online_order, customize_order_preparation_time,
        online_orders_time_delay, pull_order_on_accept, show_addons_separately,
        show_complete_online_order_id, show_online_order_preparation_time, update_food_ready_status_kds
      ) VALUES (?,?,?,?,?,?,?,?,?,?)
    `);

    const result = stmt.run(
      data.outletid,
      data.show_in_preparation_kds ? 1 : 0,
      data.auto_accept_online_order ? 1 : 0,
      data.customize_order_preparation_time ? 1 : 0,
      data.online_orders_time_delay || null,
      data.pull_order_on_accept ? 1 : 0,
      data.show_addons_separately ? 1 : 0,
      data.show_complete_online_order_id ? 1 : 0,
      data.show_online_order_preparation_time ? 1 : 0,
      data.update_food_ready_status_kds ? 1 : 0
    );

    res.json({ success: true, message: "Online Order Setting Created", id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// READ ALL
exports.getAllOnlineOrderSettings = (req, res) => {
  try {
    // Check if the table exists
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='mstonline_orders_settings'").get();
    if (!tableCheck) {
      return res.status(500).json({ success: false, error: "Table mstonline_orders_settings does not exist" });
    }

    const stmt = db.prepare("SELECT * FROM mstonline_orders_settings");
    const rows = stmt.all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// READ ONE
exports.getOnlineOrderSettingById = (req, res) => {
  try {
    const row = db.prepare("SELECT * FROM mstonline_orders_settings WHERE online_ordersetting_id = ?").get(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, message: "Online Order Setting not found" });
    }
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// UPDATE
exports.updateOnlineOrderSetting = (req, res) => {
  try {
    const data = req.body;

    // Validate required fields
    if (!data.outletid) {
      return res.status(400).json({ success: false, error: "outletid is required" });
    }

    const stmt = db.prepare(`
      UPDATE mstonline_orders_settings
      SET outletid = ?, show_in_preparation_kds = ?, auto_accept_online_order = ?,
          customize_order_preparation_time = ?, online_orders_time_delay = ?, pull_order_on_accept = ?,
          show_addons_separately = ?, show_complete_online_order_id = ?, show_online_order_preparation_time = ?,
          update_food_ready_status_kds = ?
      WHERE online_ordersetting_id = ?
    `);

    const result = stmt.run(
      data.outletid,
      data.show_in_preparation_kds ? 1 : 0,
      data.auto_accept_online_order ? 1 : 0,
      data.customize_order_preparation_time ? 1 : 0,
      data.online_orders_time_delay || null,
      data.pull_order_on_accept ? 1 : 0,
      data.show_addons_separately ? 1 : 0,
      data.show_complete_online_order_id ? 1 : 0,
      data.show_online_order_preparation_time ? 1 : 0,
      data.update_food_ready_status_kds ? 1 : 0,
      req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: "Online Order Setting not found" });
    }
    res.json({ success: true, message: "Online Order Setting Updated", changes: result.changes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE
exports.deleteOnlineOrderSetting = (req, res) => {
  try {
    const stmt = db.prepare("DELETE FROM mstonline_orders_settings WHERE online_ordersetting_id = ?");
    const result = stmt.run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: "Online Order Setting not found" });
    }
    res.json({ success: true, message: "Online Order Setting Deleted", changes: result.changes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};