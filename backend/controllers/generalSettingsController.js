const db = require("../config/db");

// CREATE
exports.createGeneralSetting = (req, res) => {
  try {
    const data = req.body;

    // Validate required fields
    if (!data.outletid) {
      return res.status(400).json({ success: false, error: "outletid is required" });
    }

    const stmt = db.prepare(`
      INSERT INTO mstgeneral_settings (
        outletid, allow_charges_after_bill_print, allow_discount_after_bill_print, allow_discount_before_save,
        allow_pre_order_tahd, ask_covers_dine_in, ask_covers_pickup, ask_covers_delivery, ask_covers_quick_bill,
        ask_covers_captain, ask_custom_order_id_quick_bill, ask_custom_order_type_quick_bill,
        ask_payment_mode_on_save_bill, ask_waiter_dine_in, ask_waiter_pickup, ask_waiter_delivery,
        ask_waiter_quick_bill, ask_otp_change_order_status_order_window, ask_otp_change_order_status_receipt_section,
        auto_accept_remote_kot, auto_out_of_stock, auto_sync, category_time_for_pos, count_sales_after_midnight,
        customer_mandatory_dine_in, customer_mandatory_pickup, customer_mandatory_delivery, customer_mandatory_quick_bill,
        default_ebill_check, default_send_delivery_boy_check, edit_customize_order_number, enable_backup_notification_service,
        enable_customer_display_access, filter_items_by_order_type, generate_reports_start_close_dates,
        hide_clear_data_check_logout, hide_item_price_options, hide_load_menu_button, make_cancel_delete_reason_compulsory,
        make_discount_reason_mandatory, make_free_cancel_bill_reason_mandatory, make_payment_ref_number_mandatory,
        mandatory_delivery_boy_selection, mark_order_as_transfer_order, online_payment_auto_settle,
        order_sync_settings_auto_sync_interval, order_sync_settings_sync_batch_packet_size, separate_billing_by_section,
        set_entered_amount_as_opening, show_alternative_item_report_print, show_clear_sales_report_logout,
        show_order_no_label_pos, show_payment_history_button, show_remote_kot_option, show_send_payment_link,
        stock_availability_display, todays_report_sales_summary, todays_report_order_type_summary,
        todays_report_payment_type_summary, todays_report_discount_summary, todays_report_expense_summary,
        todays_report_bill_summary, todays_report_delivery_boy_summary, todays_report_waiter_summary,
        todays_report_kitchen_department_summary, todays_report_category_summary, todays_report_sold_items_summary,
        todays_report_cancel_items_summary, todays_report_wallet_summary, todays_report_due_payment_received_summary,
        todays_report_due_payment_receivable_summary, todays_report_payment_variance_summary,
        todays_report_currency_denominations_summary, when_send_todays_report, enable_currency_conversion,
        enable_user_login_validation, allow_closing_shift_despite_bills, show_real_time_kot_bill_notifications,
        use_separate_bill_numbers_online
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `);

    const result = stmt.run(
      data.outletid,
      data.allow_charges_after_bill_print ? 1 : 0,
      data.allow_discount_after_bill_print ? 1 : 0,
      data.allow_discount_before_save ? 1 : 0,
      data.allow_pre_order_tahd ? 1 : 0,
      data.ask_covers_dine_in ? 1 : 0,
      data.ask_covers_pickup ? 1 : 0,
      data.ask_covers_delivery ? 1 : 0,
      data.ask_covers_quick_bill ? 1 : 0,
      data.ask_covers_captain ? 1 : 0,
      data.ask_custom_order_id_quick_bill ? 1 : 0,
      data.ask_custom_order_type_quick_bill ? 1 : 0,
      data.ask_payment_mode_on_save_bill ? 1 : 0,
      data.ask_waiter_dine_in ? 1 : 0,
      data.ask_waiter_pickup ? 1 : 0,
      data.ask_waiter_delivery ? 1 : 0,
      data.ask_waiter_quick_bill ? 1 : 0,
      data.ask_otp_change_order_status_order_window ? 1 : 0,
      data.ask_otp_change_order_status_receipt_section ? 1 : 0,
      data.auto_accept_remote_kot ? 1 : 0,
      data.auto_out_of_stock ? 1 : 0,
      data.auto_sync ? 1 : 0,
      data.category_time_for_pos || null,
      data.count_sales_after_midnight ? 1 : 0,
      data.customer_mandatory_dine_in ? 1 : 0,
      data.customer_mandatory_pickup ? 1 : 0,
      data.customer_mandatory_delivery ? 1 : 0,
      data.customer_mandatory_quick_bill ? 1 : 0,
      data.default_ebill_check ? 1 : 0,
      data.default_send_delivery_boy_check ? 1 : 0,
      data.edit_customize_order_number || null,
      data.enable_backup_notification_service ? 1 : 0,
      data.enable_customer_display_access ? 1 : 0,
      data.filter_items_by_order_type ? 1 : 0,
      data.generate_reports_start_close_dates ? 1 : 0,
      data.hide_clear_data_check_logout ? 1 : 0,
      data.hide_item_price_options ? 1 : 0,
      data.hide_load_menu_button ? 1 : 0,
      data.make_cancel_delete_reason_compulsory ? 1 : 0,
      data.make_discount_reason_mandatory ? 1 : 0,
      data.make_free_cancel_bill_reason_mandatory ? 1 : 0,
      data.make_payment_ref_number_mandatory ? 1 : 0,
      data.mandatory_delivery_boy_selection ? 1 : 0,
      data.mark_order_as_transfer_order ? 1 : 0,
      data.online_payment_auto_settle ? 1 : 0,
      data.order_sync_settings_auto_sync_interval || null,
      data.order_sync_settings_sync_batch_packet_size || null,
      data.separate_billing_by_section ? 1 : 0,
      data.set_entered_amount_as_opening ? 1 : 0,
      data.show_alternative_item_report_print ? 1 : 0,
      data.show_clear_sales_report_logout ? 1 : 0,
      data.show_order_no_label_pos ? 1 : 0,
      data.show_payment_history_button ? 1 : 0,
      data.show_remote_kot_option ? 1 : 0,
      data.show_send_payment_link ? 1 : 0,
      data.stock_availability_display ? 1 : 0,
      data.todays_report_sales_summary ? 1 : 0,
      data.todays_report_order_type_summary ? 1 : 0,
      data.todays_report_payment_type_summary ? 1 : 0,
      data.todays_report_discount_summary ? 1 : 0,
      data.todays_report_expense_summary ? 1 : 0,
      data.todays_report_bill_summary ? 1 : 0,
      data.todays_report_delivery_boy_summary ? 1 : 0,
      data.todays_report_waiter_summary ? 1 : 0,
      data.todays_report_kitchen_department_summary ? 1 : 0,
      data.todays_report_category_summary ? 1 : 0,
      data.todays_report_sold_items_summary ? 1 : 0,
      data.todays_report_cancel_items_summary ? 1 : 0,
      data.todays_report_wallet_summary ? 1 : 0,
      data.todays_report_due_payment_received_summary ? 1 : 0,
      data.todays_report_due_payment_receivable_summary ? 1 : 0,
      data.todays_report_payment_variance_summary ? 1 : 0,
      data.todays_report_currency_denominations_summary ? 1 : 0,
      data.when_send_todays_report || null,
      data.enable_currency_conversion ? 1 : 0,
      data.enable_user_login_validation ? 1 : 0,
      data.allow_closing_shift_despite_bills ? 1 : 0,
      data.show_real_time_kot_bill_notifications ? 1 : 0,
      data.use_separate_bill_numbers_online ? 1 : 0
    );

    res.json({ success: true, message: "General Setting Created", id: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// READ ALL
exports.getAllGeneralSettings = (req, res) => {
  try {
    // Check if the table exists
    const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='mstgeneral_settings'").get();
    if (!tableCheck) {
      return res.status(500).json({ success: false, error: "Table mstgeneral_settings does not exist" });
    }

    const stmt = db.prepare("SELECT * FROM mstgeneral_settings");
    const rows = stmt.all();
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// READ ONE
exports.getGeneralSettingById = (req, res) => {
  try {
    const row = db.prepare("SELECT * FROM mstgeneral_settings WHERE general_setting_id = ?").get(req.params.id);
    if (!row) {
      return res.status(404).json({ success: false, message: "General Setting not found" });
    }
    res.json({ success: true, data: row });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// UPDATE
exports.updateGeneralSetting = (req, res) => {
  try {
    const data = req.body;

    // Validate required fields
    if (!data.outletid) {
      return res.status(400).json({ success: false, error: "outletid is required" });
    }

    const stmt = db.prepare(`
      UPDATE mstgeneral_settings
      SET outletid = ?, allow_charges_after_bill_print = ?, allow_discount_after_bill_print = ?,
          allow_discount_before_save = ?, allow_pre_order_tahd = ?, ask_covers_dine_in = ?,
          ask_covers_pickup = ?, ask_covers_delivery = ?, ask_covers_quick_bill = ?,
          ask_covers_captain = ?, ask_custom_order_id_quick_bill = ?, ask_custom_order_type_quick_bill = ?,
          ask_payment_mode_on_save_bill = ?, ask_waiter_dine_in = ?, ask_waiter_pickup = ?,
          ask_waiter_delivery = ?, ask_waiter_quick_bill = ?, ask_otp_change_order_status_order_window = ?,
          ask_otp_change_order_status_receipt_section = ?, auto_accept_remote_kot = ?, auto_out_of_stock = ?,
          auto_sync = ?, category_time_for_pos = ?, count_sales_after_midnight = ?,
          customer_mandatory_dine_in = ?, customer_mandatory_pickup = ?, customer_mandatory_delivery = ?,
          customer_mandatory_quick_bill = ?, default_ebill_check = ?, default_send_delivery_boy_check = ?,
          edit_customize_order_number = ?, enable_backup_notification_service = ?, enable_customer_display_access = ?,
          filter_items_by_order_type = ?, generate_reports_start_close_dates = ?, hide_clear_data_check_logout = ?,
          hide_item_price_options = ?, hide_load_menu_button = ?, make_cancel_delete_reason_compulsory = ?,
          make_discount_reason_mandatory = ?, make_free_cancel_bill_reason_mandatory = ?,
          make_payment_ref_number_mandatory = ?, mandatory_delivery_boy_selection = ?,
          mark_order_as_transfer_order = ?, online_payment_auto_settle = ?, order_sync_settings_auto_sync_interval = ?,
          order_sync_settings_sync_batch_packet_size = ?, separate_billing_by_section = ?,
          set_entered_amount_as_opening = ?, show_alternative_item_report_print = ?, show_clear_sales_report_logout = ?,
          show_order_no_label_pos = ?, show_payment_history_button = ?, show_remote_kot_option = ?,
          show_send_payment_link = ?, stock_availability_display = ?, todays_report_sales_summary = ?,
          todays_report_order_type_summary = ?, todays_report_payment_type_summary = ?,
          todays_report_discount_summary = ?, todays_report_expense_summary = ?, todays_report_bill_summary = ?,
          todays_report_delivery_boy_summary = ?, todays_report_waiter_summary = ?,
          todays_report_kitchen_department_summary = ?, todays_report_category_summary = ?,
          todays_report_sold_items_summary = ?, todays_report_cancel_items_summary = ?,
          todays_report_wallet_summary = ?, todays_report_due_payment_received_summary = ?,
          todays_report_due_payment_receivable_summary = ?, todays_report_payment_variance_summary = ?,
          todays_report_currency_denominations_summary = ?, when_send_todays_report = ?,
          enable_currency_conversion = ?, enable_user_login_validation = ?, allow_closing_shift_despite_bills = ?,
          show_real_time_kot_bill_notifications = ?, use_separate_bill_numbers_online = ?
      WHERE general_setting_id = ?
    `);

    const result = stmt.run(
      data.outletid,
      data.allow_charges_after_bill_print ? 1 : 0,
      data.allow_discount_after_bill_print ? 1 : 0,
      data.allow_discount_before_save ? 1 : 0,
      data.allow_pre_order_tahd ? 1 : 0,
      data.ask_covers_dine_in ? 1 : 0,
      data.ask_covers_pickup ? 1 : 0,
      data.ask_covers_delivery ? 1 : 0,
      data.ask_covers_quick_bill ? 1 : 0,
      data.ask_covers_captain ? 1 : 0,
      data.ask_custom_order_id_quick_bill ? 1 : 0,
      data.ask_custom_order_type_quick_bill ? 1 : 0,
      data.ask_payment_mode_on_save_bill ? 1 : 0,
      data.ask_waiter_dine_in ? 1 : 0,
      data.ask_waiter_pickup ? 1 : 0,
      data.ask_waiter_delivery ? 1 : 0,
      data.ask_waiter_quick_bill ? 1 : 0,
      data.ask_otp_change_order_status_order_window ? 1 : 0,
      data.ask_otp_change_order_status_receipt_section ? 1 : 0,
      data.auto_accept_remote_kot ? 1 : 0,
      data.auto_out_of_stock ? 1 : 0,
      data.auto_sync ? 1 : 0,
      data.category_time_for_pos || null,
      data.count_sales_after_midnight ? 1 : 0,
      data.customer_mandatory_dine_in ? 1 : 0,
      data.customer_mandatory_pickup ? 1 : 0,
      data.customer_mandatory_delivery ? 1 : 0,
      data.customer_mandatory_quick_bill ? 1 : 0,
      data.default_ebill_check ? 1 : 0,
      data.default_send_delivery_boy_check ? 1 : 0,
      data.edit_customize_order_number || null,
      data.enable_backup_notification_service ? 1 : 0,
      data.enable_customer_display_access ? 1 : 0,
      data.filter_items_by_order_type ? 1 : 0,
      data.generate_reports_start_close_dates ? 1 : 0,
      data.hide_clear_data_check_logout ? 1 : 0,
      data.hide_item_price_options ? 1 : 0,
      data.hide_load_menu_button ? 1 : 0,
      data.make_cancel_delete_reason_compulsory ? 1 : 0,
      data.make_discount_reason_mandatory ? 1 : 0,
      data.make_free_cancel_bill_reason_mandatory ? 1 : 0,
      data.make_payment_ref_number_mandatory ? 1 : 0,
      data.mandatory_delivery_boy_selection ? 1 : 0,
      data.mark_order_as_transfer_order ? 1 : 0,
      data.online_payment_auto_settle ? 1 : 0,
      data.order_sync_settings_auto_sync_interval || null,
      data.order_sync_settings_sync_batch_packet_size || null,
      data.separate_billing_by_section ? 1 : 0,
      data.set_entered_amount_as_opening ? 1 : 0,
      data.show_alternative_item_report_print ? 1 : 0,
      data.show_clear_sales_report_logout ? 1 : 0,
      data.show_order_no_label_pos ? 1 : 0,
      data.show_payment_history_button ? 1 : 0,
      data.show_remote_kot_option ? 1 : 0,
      data.show_send_payment_link ? 1 : 0,
      data.stock_availability_display ? 1 : 0,
      data.todays_report_sales_summary ? 1 : 0,
      data.todays_report_order_type_summary ? 1 : 0,
      data.todays_report_payment_type_summary ? 1 : 0,
      data.todays_report_discount_summary ? 1 : 0,
      data.todays_report_expense_summary ? 1 : 0,
      data.todays_report_bill_summary ? 1 : 0,
      data.todays_report_delivery_boy_summary ? 1 : 0,
      data.todays_report_waiter_summary ? 1 : 0,
      data.todays_report_kitchen_department_summary ? 1 : 0,
      data.todays_report_category_summary ? 1 : 0,
      data.todays_report_sold_items_summary ? 1 : 0,
      data.todays_report_cancel_items_summary ? 1 : 0,
      data.todays_report_wallet_summary ? 1 : 0,
      data.todays_report_due_payment_received_summary ? 1 : 0,
      data.todays_report_due_payment_receivable_summary ? 1 : 0,
      data.todays_report_payment_variance_summary ? 1 : 0,
      data.todays_report_currency_denominations_summary ? 1 : 0,
      data.when_send_todays_report || null,
      data.enable_currency_conversion ? 1 : 0,
      data.enable_user_login_validation ? 1 : 0,
      data.allow_closing_shift_despite_bills ? 1 : 0,
      data.show_real_time_kot_bill_notifications ? 1 : 0,
      data.use_separate_bill_numbers_online ? 1 : 0,
      req.params.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: "General Setting not found" });
    }
    res.json({ success: true, message: "General Setting Updated", changes: result.changes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// DELETE
exports.deleteGeneralSetting = (req, res) => {
  try {
    const stmt = db.prepare("DELETE FROM mstgeneral_settings WHERE general_setting_id = ?");
    const result = stmt.run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, message: "General Setting not found" });
    }
    res.json({ success: true, message: "General Setting Deleted", changes: result.changes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};