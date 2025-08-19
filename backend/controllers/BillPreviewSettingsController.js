const db = require("../config/db");

// Debug: Check if db is initialized
console.log('Database object:', db);

// CREATE
exports.createSetting = (req, res) => {
  try {
    const data = req.body;
    const stmt = db.prepare(`
      INSERT INTO mstbill_preview_settings
      (outletid, outlet_name, email, website, upi_id, bill_prefix, secondary_bill_prefix, bar_bill_prefix,
       show_upi_qr, enabled_bar_section, show_phone_on_bill, note, footer_note, field1, field2, field3, field4, fssai_no)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);

    const result = stmt.run(
      data.outletid, data.outlet_name, data.email, data.website, data.upi_id,
      data.bill_prefix, data.secondary_bill_prefix, data.bar_bill_prefix,
      data.show_upi_qr, data.enabled_bar_section, data.show_phone_on_bill,
      data.note, data.footer_note, data.field1, data.field2, data.field3, data.field4, data.fssai_no
    );

    res.json({ success: true, message: "Bill Preview Setting Created", id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// READ ALL
exports.getAllSettings = (req, res) => {
  try {
    // Debug: Check if table exists
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='mstbill_preview_settings'").get();
    if (!tableCheck) {
      return res.status(500).json({ success: false, error: "Table mstbill_preview_settings does not exist" });
    }

    const stmt = db.prepare("SELECT * FROM mstbill_preview_settings");
    const rows = stmt.all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// READ ONE
exports.getSettingById = (req, res) => {
  try {
    const row = db.prepare("SELECT * FROM mstbill_preview_settings WHERE billpreviewsetting_id = ?").get(req.params.id);
    if (!row) return res.status(404).json({ success: false, message: "Setting not found" });
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// UPDATE
exports.updateSetting = (req, res) => {
  try {
    const data = req.body;
    const stmt = db.prepare(`
      UPDATE mstbill_preview_settings
      SET outletid=?, outlet_name=?, email=?, website=?, upi_id=?, bill_prefix=?, secondary_bill_prefix=?, bar_bill_prefix=?,
          show_upi_qr=?, enabled_bar_section=?, show_phone_on_bill=?, note=?, footer_note=?, field1=?, field2=?, field3=?, field4=?, fssai_no=?
      WHERE billpreviewsetting_id=?
    `);

    const result = stmt.run(
      data.outletid, data.outlet_name, data.email, data.website, data.upi_id,
      data.bill_prefix, data.secondary_bill_prefix, data.bar_bill_prefix,
      data.show_upi_qr, data.enabled_bar_section, data.show_phone_on_bill,
      data.note, data.footer_note, data.field1, data.field2, data.field3, data.field4, data.fssai_no, req.params.id
    );

    res.json({ success: true, message: "Bill Preview Setting Updated", changes: result.changes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE
exports.deleteSetting = (req, res) => {
  try {
    const stmt = db.prepare("DELETE FROM mstbill_preview_settings WHERE billpreviewsetting_id = ?");
    const result = stmt.run(req.params.id);
    res.json({ success: true, message: "Bill Preview Setting Deleted", changes: result.changes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};