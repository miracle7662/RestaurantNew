const db = require("../config/db");

// CREATE
exports.createKotPrintSetting = (req, res) => {
  try {
    const data = req.body;

    // Validate required fields
    if (!data.outletid) {
      return res.status(400).json({ success: false, error: "outletid is required" });
    }

    const stmt = db.prepare(`
      INSERT INTO mstkot_print_settings (
        outletid, customer_on_kot_dine_in, customer_on_kot_pickup, customer_on_kot_delivery, customer_on_kot_quick_bill,
        customer_kot_display_option, group_kot_items_by_category, hide_table_name_quick_bill, show_new_order_tag,
        new_order_tag_label, show_running_order_tag, running_order_tag_label, dine_in_kot_no, pickup_kot_no,
        delivery_kot_no, quick_bill_kot_no, modifier_default_option, print_kot_both_languages, show_alternative_item,
        show_captain_username, show_covers_as_guest, show_item_price, show_kot_no_quick_bill, show_kot_note,
        show_online_order_otp, show_order_id_quick_bill, show_order_id_online_order, show_order_no_quick_bill_section,
        show_order_type_symbol, show_store_name, show_terminal_username, show_username, show_waiter
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);

    const result = stmt.run(
      data.outletid, 
      data.customer_on_kot_dine_in ? 1 : 0, 
      data.customer_on_kot_pickup ? 1 : 0, 
      data.customer_on_kot_delivery ? 1 : 0, 
      data.customer_on_kot_quick_bill ? 1 : 0,
      data.customer_kot_display_option || null,
      data.group_kot_items_by_category ? 1 : 0,
      data.hide_table_name_quick_bill ? 1 : 0,
      data.show_new_order_tag ? 1 : 0,
      data.new_order_tag_label || null,
      data.show_running_order_tag ? 1 : 0,
      data.running_order_tag_label || null,
      data.dine_in_kot_no || null,
      data.pickup_kot_no || null,
      data.delivery_kot_no || null,
      data.quick_bill_kot_no || null,
      data.modifier_default_option ? 1 : 0,
      data.print_kot_both_languages ? 1 : 0,
      data.show_alternative_item ? 1 : 0,
      data.show_captain_username ? 1 : 0,
      data.show_covers_as_guest ? 1 : 0,
      data.show_item_price ? 1 : 0,
      data.show_kot_no_quick_bill ? 1 : 0,
      data.show_kot_note ? 1 : 0,
      data.show_online_order_otp ? 1 : 0,
      data.show_order_id_quick_bill ? 1 : 0,
      data.show_order_id_online_order ? 1 : 0,
      data.show_order_no_quick_bill_section ? 1 : 0,
      data.show_order_type_symbol ? 1 : 0,
      data.show_store_name ? 1 : 0,
      data.show_terminal_username ? 1 : 0,
      data.show_username ? 1 : 0,
      data.show_waiter ? 1 : 0
    );

    res.json({ success: true, message: "KOT Print Setting Created", id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// READ ALL
exports.getAllKotPrintSettings = (req, res) => {
  try {
    // Check if the table exists
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='mstkot_print_settings'").get();
    if (!tableCheck) {
      return res.status(500).json({ success: false, error: "Table mstkot_print_settings does not exist" });
    }

    const stmt = db.prepare("SELECT * FROM mstkot_print_settings");
    const rows = stmt.all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// READ ONE
exports.getKotPrintSettingById = (req, res) => {
  try {
    const row = db.prepare("SELECT * FROM mstkot_print_settings WHERE kot_printsetting_id = ?").get(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, message: "KOT Print Setting not found" });
    }
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// UPDATE
exports.updateKotPrintSetting = (req, res) => {
  try {
    const data = req.body;

    // Validate required fields
    if (!data.outletid) {
      return res.status(400).json({ success: false, error: "outletid is required" });
    }

    const stmt = db.prepare(`
      UPDATE mstkot_print_settings
      SET outletid = ?, customer_on_kot_dine_in = ?, customer_on_kot_pickup = ?, customer_on_kot_delivery = ?,
          customer_on_kot_quick_bill = ?, customer_kot_display_option = ?, group_kot_items_by_category = ?,
          hide_table_name_quick_bill = ?, show_new_order_tag = ?, new_order_tag_label = ?, show_running_order_tag = ?,
          running_order_tag_label = ?, dine_in_kot_no = ?, pickup_kot_no = ?, delivery_kot_no = ?,
          quick_bill_kot_no = ?, modifier_default_option = ?, print_kot_both_languages = ?, show_alternative_item = ?,
          show_captain_username = ?, show_covers_as_guest = ?, show_item_price = ?, show_kot_no_quick_bill = ?,
          show_kot_note = ?, show_online_order_otp = ?, show_order_id_quick_bill = ?, show_order_id_online_order = ?,
          show_order_no_quick_bill_section = ?, show_order_type_symbol = ?, show_store_name = ?,
          show_terminal_username = ?, show_username = ?, show_waiter = ?
      WHERE kot_printsetting_id = ?
    `);

    const result = stmt.run(
      data.outletid, 
      data.customer_on_kot_dine_in ? 1 : 0, 
      data.customer_on_kot_pickup ? 1 : 0, 
      data.customer_on_kot_delivery ? 1 : 0, 
      data.customer_on_kot_quick_bill ? 1 : 0,
      data.customer_kot_display_option || null,
      data.group_kot_items_by_category ? 1 : 0,
      data.hide_table_name_quick_bill ? 1 : 0,
      data.show_new_order_tag ? 1 : 0,
      data.new_order_tag_label || null,
      data.show_running_order_tag ? 1 : 0,
      data.running_order_tag_label || null,
      data.dine_in_kot_no || null,
      data.pickup_kot_no || null,
      data.delivery_kot_no || null,
      data.quick_bill_kot_no || null,
      data.modifier_default_option ? 1 : 0,
      data.print_kot_both_languages ? 1 : 0,
      data.show_alternative_item ? 1 : 0,
      data.show_captain_username ? 1 : 0,
      data.show_covers_as_guest ? 1 : 0,
      data.show_item_price ? 1 : 0,
      data.show_kot_no_quick_bill ? 1 : 0,
      data.show_kot_note ? 1 : 0,
      data.show_online_order_otp ? 1 : 0,
      data.show_order_id_quick_bill ? 1 : 0,
      data.show_order_id_online_order ? 1 : 0,
      data.show_order_no_quick_bill_section ? 1 : 0,
      data.show_order_type_symbol ? 1 : 0,
      data.show_store_name ? 1 : 0,
      data.show_terminal_username ? 1 : 0,
      data.show_username ? 1 : 0,
      data.show_waiter ? 1 : 0,
      req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: "KOT Print Setting not found" });
    }
    res.json({ success: true, message: "KOT Print Setting Updated", changes: result.changes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE
exports.deleteKotPrintSetting = (req, res) => {
  try {
    const stmt = db.prepare("DELETE FROM mstkot_print_settings WHERE kot_printsetting_id = ?");
    const result = stmt.run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: "KOT Print Setting not found" });
    }
    res.json({ success: true, message: "KOT Print Setting Deleted", changes: result.changes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};