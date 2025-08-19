const db = require("../config/db");

// CREATE
exports.createBillPrintSetting = (req, res) => {
  try {
    const data = req.body;

    // Validate required fields
    if (!data.outletid) {
      return res.status(400).json({ success: false, error: "outletid is required" });
    }

    const stmt = db.prepare(`
      INSERT INTO mstbill_print_settings (
        outletid, bill_title_dine_in, bill_title_pickup, bill_title_delivery, bill_title_quick_bill,
        mask_order_id, modifier_default_option_bill, print_bill_both_languages, show_alt_item_title_bill,
        show_alt_name_bill, show_bill_amount_words, show_bill_no_bill, show_bill_number_prefix_bill,
        show_bill_print_count, show_brand_name_bill, show_captain_bill, show_covers_bill,
        show_custom_qr_codes_bill, show_customer_gst_bill, show_customer_bill, show_customer_paid_amount,
        show_date_bill, show_default_payment, show_discount_reason_bill, show_due_amount_bill,
        show_ebill_invoice_qrcode, show_item_hsn_code_bill, show_item_level_charges_separately,
        show_item_note_bill, show_items_sequence_bill, show_kot_number_bill, show_logo_bill,
        show_order_id_bill, show_order_no_bill, show_order_note_bill, order_type_dine_in,
        order_type_pickup, order_type_delivery, order_type_quick_bill, show_outlet_name_bill,
        payment_mode_dine_in, payment_mode_pickup, payment_mode_delivery, payment_mode_quick_bill,
        table_name_dine_in, table_name_pickup, table_name_delivery, table_name_quick_bill,
        show_tax_charge_bill, show_username_bill, show_waiter_bill, show_zatca_invoice_qr,
        show_customer_address_pickup_bill, show_order_placed_time, hide_item_quantity_column,
        hide_item_rate_column, hide_item_total_column, hide_total_without_tax
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);

    const result = stmt.run(
      data.outletid,
      data.bill_title_dine_in ? 1 : 0,
      data.bill_title_pickup ? 1 : 0,
      data.bill_title_delivery ? 1 : 0,
      data.bill_title_quick_bill ? 1 : 0,
      data.mask_order_id ? 1 : 0,
      data.modifier_default_option_bill ? 1 : 0,
      data.print_bill_both_languages ? 1 : 0,
      data.show_alt_item_title_bill ? 1 : 0,
      data.show_alt_name_bill ? 1 : 0,
      data.show_bill_amount_words ? 1 : 0,
      data.show_bill_no_bill ? 1 : 0,
      data.show_bill_number_prefix_bill ? 1 : 0,
      data.show_bill_print_count ? 1 : 0,
      data.show_brand_name_bill ? 1 : 0,
      data.show_captain_bill ? 1 : 0,
      data.show_covers_bill ? 1 : 0,
      data.show_custom_qr_codes_bill ? 1 : 0,
      data.show_customer_gst_bill ? 1 : 0,
      data.show_customer_bill ? 1 : 0,
      data.show_customer_paid_amount ? 1 : 0,
      data.show_date_bill ? 1 : 0,
      data.show_default_payment ? 1 : 0,
      data.show_discount_reason_bill ? 1 : 0,
      data.show_due_amount_bill ? 1 : 0,
      data.show_ebill_invoice_qrcode ? 1 : 0,
      data.show_item_hsn_code_bill ? 1 : 0,
      data.show_item_level_charges_separately ? 1 : 0,
      data.show_item_note_bill ? 1 : 0,
      data.show_items_sequence_bill ? 1 : 0,
      data.show_kot_number_bill ? 1 : 0,
      data.show_logo_bill ? 1 : 0,
      data.show_order_id_bill ? 1 : 0,
      data.show_order_no_bill ? 1 : 0,
      data.show_order_note_bill ? 1 : 0,
      data.order_type_dine_in ? 1 : 0,
      data.order_type_pickup ? 1 : 0,
      data.order_type_delivery ? 1 : 0,
      data.order_type_quick_bill ? 1 : 0,
      data.show_outlet_name_bill ? 1 : 0,
      data.payment_mode_dine_in ? 1 : 0,
      data.payment_mode_pickup ? 1 : 0,
      data.payment_mode_delivery ? 1 : 0,
      data.payment_mode_quick_bill ? 1 : 0,
      data.table_name_dine_in ? 1 : 0,
      data.table_name_pickup ? 1 : 0,
      data.table_name_delivery ? 1 : 0,
      data.table_name_quick_bill ? 1 : 0,
      data.show_tax_charge_bill ? 1 : 0,
      data.show_username_bill ? 1 : 0,
      data.show_waiter_bill ? 1 : 0,
      data.show_zatca_invoice_qr ? 1 : 0,
      data.show_customer_address_pickup_bill ? 1 : 0,
      data.show_order_placed_time ? 1 : 0,
      data.hide_item_quantity_column ? 1 : 0,
      data.hide_item_rate_column ? 1 : 0,
      data.hide_item_total_column ? 1 : 0,
      data.hide_total_without_tax ? 1 : 0
    );

    res.json({ success: true, message: "Bill Print Setting Created", id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// READ ALL
exports.getAllBillPrintSettings = (req, res) => {
  try {
    // Check if the table exists
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='mstbill_print_settings'").get();
    if (!tableCheck) {
      return res.status(500).json({ success: false, error: "Table mstbill_print_settings does not exist" });
    }

    const stmt = db.prepare("SELECT * FROM mstbill_print_settings");
    const rows = stmt.all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// READ ONE
exports.getBillPrintSettingById = (req, res) => {
  try {
    const row = db.prepare("SELECT * FROM mstbill_print_settings WHERE bill_printsetting_id = ?").get(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, message: "Bill Print Setting not found" });
    }
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// UPDATE
exports.updateBillPrintSetting = (req, res) => {
  try {
    const data = req.body;

    // Validate required fields
    if (!data.outletid) {
      return res.status(400).json({ success: false, error: "outletid is required" });
    }

    const stmt = db.prepare(`
      UPDATE mstbill_print_settings
      SET outletid = ?, bill_title_dine_in = ?, bill_title_pickup = ?, bill_title_delivery = ?,
          bill_title_quick_bill = ?, mask_order_id = ?, modifier_default_option_bill = ?,
          print_bill_both_languages = ?, show_alt_item_title_bill = ?, show_alt_name_bill = ?,
          show_bill_amount_words = ?, show_bill_no_bill = ?, show_bill_number_prefix_bill = ?,
          show_bill_print_count = ?, show_brand_name_bill = ?, show_captain_bill = ?,
          show_covers_bill = ?, show_custom_qr_codes_bill = ?, show_customer_gst_bill = ?,
          show_customer_bill = ?, show_customer_paid_amount = ?, show_date_bill = ?,
          show_default_payment = ?, show_discount_reason_bill = ?, show_due_amount_bill = ?,
          show_ebill_invoice_qrcode = ?, show_item_hsn_code_bill = ?, show_item_level_charges_separately = ?,
          show_item_note_bill = ?, show_items_sequence_bill = ?, show_kot_number_bill = ?,
          show_logo_bill = ?, show_order_id_bill = ?, show_order_no_bill = ?, show_order_note_bill = ?,
          order_type_dine_in = ?, order_type_pickup = ?, order_type_delivery = ?, order_type_quick_bill = ?,
          show_outlet_name_bill = ?, payment_mode_dine_in = ?, payment_mode_pickup = ?, payment_mode_delivery = ?,
          payment_mode_quick_bill = ?, table_name_dine_in = ?, table_name_pickup = ?, table_name_delivery = ?,
          table_name_quick_bill = ?, show_tax_charge_bill = ?, show_username_bill = ?, show_waiter_bill = ?,
          show_zatca_invoice_qr = ?, show_customer_address_pickup_bill = ?, show_order_placed_time = ?,
          hide_item_quantity_column = ?, hide_item_rate_column = ?, hide_item_total_column = ?,
          hide_total_without_tax = ?
      WHERE bill_printsetting_id = ?
    `);

    const result = stmt.run(
      data.outletid,
      data.bill_title_dine_in ? 1 : 0,
      data.bill_title_pickup ? 1 : 0,
      data.bill_title_delivery ? 1 : 0,
      data.bill_title_quick_bill ? 1 : 0,
      data.mask_order_id ? 1 : 0,
      data.modifier_default_option_bill ? 1 : 0,
      data.print_bill_both_languages ? 1 : 0,
      data.show_alt_item_title_bill ? 1 : 0,
      data.show_alt_name_bill ? 1 : 0,
      data.show_bill_amount_words ? 1 : 0,
      data.show_bill_no_bill ? 1 : 0,
      data.show_bill_number_prefix_bill ? 1 : 0,
      data.show_bill_print_count ? 1 : 0,
      data.show_brand_name_bill ? 1 : 0,
      data.show_captain_bill ? 1 : 0,
      data.show_covers_bill ? 1 : 0,
      data.show_custom_qr_codes_bill ? 1 : 0,
      data.show_customer_gst_bill ? 1 : 0,
      data.show_customer_bill ? 1 : 0,
      data.show_customer_paid_amount ? 1 : 0,
      data.show_date_bill ? 1 : 0,
      data.show_default_payment ? 1 : 0,
      data.show_discount_reason_bill ? 1 : 0,
      data.show_due_amount_bill ? 1 : 0,
      data.show_ebill_invoice_qrcode ? 1 : 0,
      data.show_item_hsn_code_bill ? 1 : 0,
      data.show_item_level_charges_separately ? 1 : 0,
      data.show_item_note_bill ? 1 : 0,
      data.show_items_sequence_bill ? 1 : 0,
      data.show_kot_number_bill ? 1 : 0,
      data.show_logo_bill ? 1 : 0,
      data.show_order_id_bill ? 1 : 0,
      data.show_order_no_bill ? 1 : 0,
      data.show_order_note_bill ? 1 : 0,
      data.order_type_dine_in ? 1 : 0,
      data.order_type_pickup ? 1 : 0,
      data.order_type_delivery ? 1 : 0,
      data.order_type_quick_bill ? 1 : 0,
      data.show_outlet_name_bill ? 1 : 0,
      data.payment_mode_dine_in ? 1 : 0,
      data.payment_mode_pickup ? 1 : 0,
      data.payment_mode_delivery ? 1 : 0,
      data.payment_mode_quick_bill ? 1 : 0,
      data.table_name_dine_in ? 1 : 0,
      data.table_name_pickup ? 1 : 0,
      data.table_name_delivery ? 1 : 0,
      data.table_name_quick_bill ? 1 : 0,
      data.show_tax_charge_bill ? 1 : 0,
      data.show_username_bill ? 1 : 0,
      data.show_waiter_bill ? 1 : 0,
      data.show_zatca_invoice_qr ? 1 : 0,
      data.show_customer_address_pickup_bill ? 1 : 0,
      data.show_order_placed_time ? 1 : 0,
      data.hide_item_quantity_column ? 1 : 0,
      data.hide_item_rate_column ? 1 : 0,
      data.hide_item_total_column ? 1 : 0,
      data.hide_total_without_tax ? 1 : 0,
      req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: "Bill Print Setting not found" });
    }
    res.json({ success: true, message: "Bill Print Setting Updated", changes: result.changes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE
exports.deleteBillPrintSetting = (req, res) => {
  try {
    const stmt = db.prepare("DELETE FROM mstbill_print_settings WHERE bill_printsetting_id = ?");
    const result = stmt.run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: "Bill Print Setting not found" });
    }
    res.json({ success: true, message: "Bill Print Setting Deleted", changes: result.changes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};