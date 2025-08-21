const db = require('../config/db');

// Get Bill Preview Settings


// Update Bill Preview Settings
exports.updateBillPreviewSettings = (req, res) => {
  try {
    const { outletid } = req.params;
    const {
      outlet_name, email, website, upi_id, bill_prefix, secondary_bill_prefix, bar_bill_prefix,
      show_upi_qr, enabled_bar_section, show_phone_on_bill, note, footer_note,
      field1, field2, field3, field4, fssai_no
    } = req.body;

    const existingSettings = db.prepare('SELECT * FROM mstbill_preview_settings WHERE outletid = ?').get(outletid) || {};

    console.log('Received data:', { outletid, ...req.body }); // Debug log

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO mstbill_preview_settings (
        outletid, outlet_name, email, website, upi_id, bill_prefix, secondary_bill_prefix, bar_bill_prefix,
        show_upi_qr, enabled_bar_section, show_phone_on_bill, note, footer_note, field1, field2, field3, field4, fssai_no
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const params = [
      outletid,
      (outlet_name ?? existingSettings.outlet_name ?? '').toString(), // Ensure string
      (email ?? existingSettings.email ?? '').toString(),
      (website ?? existingSettings.website ?? '').toString(),
      (upi_id ?? existingSettings.upi_id ?? '').toString(),
      (bill_prefix ?? existingSettings.bill_prefix ?? 'BILL-').toString(),
      (secondary_bill_prefix ?? existingSettings.secondary_bill_prefix ?? 'SEC-').toString(),
      (bar_bill_prefix ?? existingSettings.bar_bill_prefix ?? 'BAR-').toString(),
      show_upi_qr !== undefined ? Number(show_upi_qr) : (existingSettings.show_upi_qr ?? 0), // Convert to number
      enabled_bar_section !== undefined ? Number(enabled_bar_section) : (existingSettings.enabled_bar_section ?? 0),
      (show_phone_on_bill ?? existingSettings.show_phone_on_bill ?? '').toString(),
      (note ?? existingSettings.note ?? '').toString(),
      (footer_note ?? existingSettings.footer_note ?? '').toString(),
      (field1 ?? existingSettings.field1 ?? '').toString(),
      (field2 ?? existingSettings.field2 ?? '').toString(),
      (field3 ?? existingSettings.field3 ?? '').toString(),
      (field4 ?? existingSettings.field4 ?? '').toString(),
      (fssai_no ?? existingSettings.fssai_no ?? '').toString(),
    ];

    console.log('Bound parameters:', params); // Debug log

    stmt.run(...params);
    res.json({ message: 'Bill preview settings updated successfully' });
  } catch (error) {
    console.error('Error updating bill preview settings:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to update bill preview settings' });
  }
};


// Update KOT Print Settings
exports.updateKOTPrintSettings = (req, res) => {
  try {
    const { outletid } = req.params;
    const {
      customer_on_kot_dine_in, customer_on_kot_pickup, customer_on_kot_delivery, customer_on_kot_quick_bill,
      customer_kot_display_option, group_kot_items_by_category, hide_table_name_quick_bill, show_new_order_tag,
      new_order_tag_label, show_running_order_tag, running_order_tag_label, dine_in_kot_no, pickup_kot_no,
      delivery_kot_no, quick_bill_kot_no, modifier_default_option, print_kot_both_languages, show_alternative_item,
      show_captain_username, show_covers_as_guest, show_item_price, show_kot_no_quick_bill, show_kot_note,
      show_online_order_otp, show_order_id_quick_bill, show_order_id_online_order, show_order_no_quick_bill_section,
      show_order_type_symbol, show_store_name, show_terminal_username, show_username, show_waiter
    } = req.body;

    const existingSettings = db.prepare('SELECT * FROM mstkot_print_settings WHERE outletid = ?').get(outletid) || {};

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO mstkot_print_settings (
        outletid, customer_on_kot_dine_in, customer_on_kot_pickup, customer_on_kot_delivery, customer_on_kot_quick_bill,
        customer_kot_display_option, group_kot_items_by_category, hide_table_name_quick_bill, show_new_order_tag,
        new_order_tag_label, show_running_order_tag, running_order_tag_label, dine_in_kot_no, pickup_kot_no,
        delivery_kot_no, quick_bill_kot_no, modifier_default_option, print_kot_both_languages, show_alternative_item,
        show_captain_username, show_covers_as_guest, show_item_price, show_kot_no_quick_bill, show_kot_note,
        show_online_order_otp, show_order_id_quick_bill, show_order_id_online_order, show_order_no_quick_bill_section,
        show_order_type_symbol, show_store_name, show_terminal_username, show_username, show_waiter
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      outletid,
      customer_on_kot_dine_in ?? existingSettings.customer_on_kot_dine_in ?? 0,
      customer_on_kot_pickup ?? existingSettings.customer_on_kot_pickup ?? 0,
      customer_on_kot_delivery ?? existingSettings.customer_on_kot_delivery ?? 0,
      customer_on_kot_quick_bill ?? existingSettings.customer_on_kot_quick_bill ?? 0,
      customer_kot_display_option ?? existingSettings.customer_kot_display_option ?? 'NAME_ONLY',
      group_kot_items_by_category ?? existingSettings.group_kot_items_by_category ?? 0,
      hide_table_name_quick_bill ?? existingSettings.hide_table_name_quick_bill ?? 0,
      show_new_order_tag ?? existingSettings.show_new_order_tag ?? 1,
      new_order_tag_label ?? existingSettings.new_order_tag_label ?? 'New',
      show_running_order_tag ?? existingSettings.show_running_order_tag ?? 1,
      running_order_tag_label ?? existingSettings.running_order_tag_label ?? 'Running',
      dine_in_kot_no ?? existingSettings.dine_in_kot_no ?? 'DIN-',
      pickup_kot_no ?? existingSettings.pickup_kot_no ?? 'PUP-',
      delivery_kot_no ?? existingSettings.delivery_kot_no ?? 'DEL-',
      quick_bill_kot_no ?? existingSettings.quick_bill_kot_no ?? 'QBL-',
      modifier_default_option ?? existingSettings.modifier_default_option ?? 0,
      print_kot_both_languages ?? existingSettings.print_kot_both_languages ?? 0,
      show_alternative_item ?? existingSettings.show_alternative_item ?? 0,
      show_captain_username ?? existingSettings.show_captain_username ?? 0,
      show_covers_as_guest ?? existingSettings.show_covers_as_guest ?? 0,
      show_item_price ?? existingSettings.show_item_price ?? 1,
      show_kot_no_quick_bill ?? existingSettings.show_kot_no_quick_bill ?? 0,
      show_kot_note ?? existingSettings.show_kot_note ?? 1,
      show_online_order_otp ?? existingSettings.show_online_order_otp ?? 0,
      show_order_id_quick_bill ?? existingSettings.show_order_id_quick_bill ?? 0,
      show_order_id_online_order ?? existingSettings.show_order_id_online_order ?? 0,
      show_order_no_quick_bill_section ?? existingSettings.show_order_no_quick_bill_section ?? 0,
      show_order_type_symbol ?? existingSettings.show_order_type_symbol ?? 1,
      show_store_name ?? existingSettings.show_store_name ?? 1,
      show_terminal_username ?? existingSettings.show_terminal_username ?? 0,
      show_username ?? existingSettings.show_username ?? 0,
      show_waiter ?? existingSettings.show_waiter ?? 1
    );

    res.json({ message: 'KOT print settings updated successfully' });
  } catch (error) {
    console.error('Error updating KOT print settings:', error);
    res.status(500).json({ error: 'Failed to update KOT print settings' });
  }
};



// Update Bill Print Settings
exports.updateBillPrintSettings = (req, res) => {
  try {
    const { outletid } = req.params;
    const settings = req.body;

    if (!outletid || !settings) {
      return res.status(400).json({ error: 'Outlet ID and settings are required' });
    }

    const query = `
      INSERT INTO mstbills_print_settings (outletid, bill_title_dine_in, bill_title_pickup, bill_title_delivery, bill_title_quick_bill, mask_order_id, modifier_default_option_bill, print_bill_both_languages, show_alt_item_title_bill, show_alt_name_bill, show_bill_amount_words, show_bill_no_bill, show_bill_number_prefix_bill, show_bill_print_count, show_brand_name_bill, show_captain_bill, show_covers_bill, show_custom_qr_codes_bill, show_customer_gst_bill, show_customer_bill, show_customer_paid_amount, show_date_bill, show_default_payment, show_discount_reason_bill, show_due_amount_bill, show_ebill_invoice_qrcode, show_item_hsn_code_bill, show_item_level_charges_separately, show_item_note_bill, show_items_sequence_bill, show_kot_number_bill, show_logo_bill, show_order_id_bill, show_order_no_bill, show_order_note_bill, order_type_dine_in, order_type_pickup, order_type_delivery, order_type_quick_bill, show_outlet_name_bill, payment_mode_dine_in, payment_mode_pickup, payment_mode_delivery, payment_mode_quick_bill, table_name_dine_in, table_name_pickup, table_name_delivery, table_name_quick_bill, show_tax_charge_bill, show_username_bill, show_waiter_bill, show_zatca_invoice_qr, show_customer_address_pickup_bill, show_order_placed_time, hide_item_quantity_column, hide_item_rate_column, hide_item_total_column, hide_total_without_tax)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(outletid) DO UPDATE SET
        bill_title_dine_in = excluded.bill_title_dine_in,
        bill_title_pickup = excluded.bill_title_pickup,
        bill_title_delivery = excluded.bill_title_delivery,
        bill_title_quick_bill = excluded.bill_title_quick_bill,
        mask_order_id = excluded.mask_order_id,
        modifier_default_option_bill = excluded.modifier_default_option_bill,
        print_bill_both_languages = excluded.print_bill_both_languages,
        show_alt_item_title_bill = excluded.show_alt_item_title_bill,
        show_alt_name_bill = excluded.show_alt_name_bill,
        show_bill_amount_words = excluded.show_bill_amount_words,
        show_bill_no_bill = excluded.show_bill_no_bill,
        show_bill_number_prefix_bill = excluded.show_bill_number_prefix_bill,
        show_bill_print_count = excluded.show_bill_print_count,
        show_brand_name_bill = excluded.show_brand_name_bill,
        show_captain_bill = excluded.show_captain_bill,
        show_covers_bill = excluded.show_covers_bill,
        show_custom_qr_codes_bill = excluded.show_custom_qr_codes_bill,
        show_customer_gst_bill = excluded.show_customer_gst_bill,
        show_customer_bill = excluded.show_customer_bill,
        show_customer_paid_amount = excluded.show_customer_paid_amount,
        show_date_bill = excluded.show_date_bill,
        show_default_payment = excluded.show_default_payment,
        show_discount_reason_bill = excluded.show_discount_reason_bill,
        show_due_amount_bill = excluded.show_due_amount_bill,
        show_ebill_invoice_qrcode = excluded.show_ebill_invoice_qrcode,
        show_item_hsn_code_bill = excluded.show_item_hsn_code_bill,
        show_item_level_charges_separately = excluded.show_item_level_charges_separately,
        show_item_note_bill = excluded.show_item_note_bill,
        show_items_sequence_bill = excluded.show_items_sequence_bill,
        show_kot_number_bill = excluded.show_kot_number_bill,
        show_logo_bill = excluded.show_logo_bill,
        show_order_id_bill = excluded.show_order_id_bill,
        show_order_no_bill = excluded.show_order_no_bill,
        show_order_note_bill = excluded.show_order_note_bill,
        order_type_dine_in = excluded.order_type_dine_in,
        order_type_pickup = excluded.order_type_pickup,
        order_type_delivery = excluded.order_type_delivery,
        order_type_quick_bill = excluded.order_type_quick_bill,
        show_outlet_name_bill = excluded.show_outlet_name_bill,
        payment_mode_dine_in = excluded.payment_mode_dine_in,
        payment_mode_pickup = excluded.payment_mode_pickup,
        payment_mode_delivery = excluded.payment_mode_delivery,
        payment_mode_quick_bill = excluded.payment_mode_quick_bill,
        table_name_dine_in = excluded.table_name_dine_in,
        table_name_pickup = excluded.table_name_pickup,
        table_name_delivery = excluded.table_name_delivery,
        table_name_quick_bill = excluded.table_name_quick_bill,
        show_tax_charge_bill = excluded.show_tax_charge_bill,
        show_username_bill = excluded.show_username_bill,
        show_waiter_bill = excluded.show_waiter_bill,
        show_zatca_invoice_qr = excluded.show_zatca_invoice_qr,
        show_customer_address_pickup_bill = excluded.show_customer_address_pickup_bill,
        show_order_placed_time = excluded.show_order_placed_time,
        hide_item_quantity_column = excluded.hide_item_quantity_column,
        hide_item_rate_column = excluded.hide_item_rate_column,
        hide_item_total_column = excluded.hide_item_total_column,
        hide_total_without_tax = excluded.hide_total_without_tax
    `;

    const params = [
      outletid,
      settings.bill_title_dine_in ?? 1,
      settings.bill_title_pickup ?? 1,
      settings.bill_title_delivery ?? 1,
      settings.bill_title_quick_bill ?? 1,
      settings.mask_order_id ?? 0,
      settings.modifier_default_option_bill ?? 0,
      settings.print_bill_both_languages ?? 0,
      settings.show_alt_item_title_bill ?? 0,
      settings.show_alt_name_bill ?? 0,
      settings.show_bill_amount_words ?? 0,
      settings.show_bill_no_bill ?? 1,
      settings.show_bill_number_prefix_bill ?? 1,
      settings.show_bill_print_count ?? 0,
      settings.show_brand_name_bill ?? 1,
      settings.show_captain_bill ?? 0,
      settings.show_covers_bill ?? 1,
      settings.show_custom_qr_codes_bill ?? 0,
      settings.show_customer_gst_bill ?? 0,
      settings.show_customer_bill ?? 1,
      settings.show_customer_paid_amount ?? 1,
      settings.show_date_bill ?? 1,
      settings.show_default_payment ?? 1,
      settings.show_discount_reason_bill ?? 0,
      settings.show_due_amount_bill ?? 1,
      settings.show_ebill_invoice_qrcode ?? 0,
      settings.show_item_hsn_code_bill ?? 0,
      settings.show_item_level_charges_separately ?? 0,
      settings.show_item_note_bill ?? 1,
      settings.show_items_sequence_bill ?? 1,
      settings.show_kot_number_bill ?? 0,
      settings.show_logo_bill ?? 1,
      settings.show_order_id_bill ?? 0,
      settings.show_order_no_bill ?? 1,
      settings.show_order_note_bill ?? 1,
      settings.order_type_dine_in ?? 1,
      settings.order_type_pickup ?? 1,
      settings.order_type_delivery ?? 1,
      settings.order_type_quick_bill ?? 1,
      settings.show_outlet_name_bill ?? 1,
      settings.payment_mode_dine_in ?? 1,
      settings.payment_mode_pickup ?? 1,
      settings.payment_mode_delivery ?? 1,
      settings.payment_mode_quick_bill ?? 1,
      settings.table_name_dine_in ?? 1,
      settings.table_name_pickup ?? 0,
      settings.table_name_delivery ?? 0,
      settings.table_name_quick_bill ?? 0,
      settings.show_tax_charge_bill ?? 1,
      settings.show_username_bill ?? 0,
      settings.show_waiter_bill ?? 1,
      settings.show_zatca_invoice_qr ?? 0,
      settings.show_customer_address_pickup_bill ?? 0,
      settings.show_order_placed_time ?? 1,
      settings.hide_item_quantity_column ?? 0,
      settings.hide_item_rate_column ?? 0,
      settings.hide_item_total_column ?? 0,
      settings.hide_total_without_tax ?? 0,
    ];

    db.prepare(query).run(...params);
    res.status(200).json({ message: 'Bill print settings updated successfully' });
  } catch (error) {
    console.error('Error updating bill print settings:', error.message, error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
};


// Update General Settings
exports.updateGeneralSettings = (req, res) => {
  try {
    const { outletid } = req.params;
    const {
      allow_charges_after_bill_print, allow_discount_after_bill_print, allow_discount_before_save,
      allow_pre_order_tahd, ask_covers_dine_in, ask_covers_pickup, ask_covers_delivery,
      ask_covers_quick_bill, ask_covers_captain, ask_custom_order_id_quick_bill,
      ask_custom_order_type_quick_bill, ask_payment_mode_on_save_bill, ask_waiter_dine_in,
      ask_waiter_pickup, ask_waiter_delivery, ask_waiter_quick_bill, ask_otp_change_order_status_order_window,
      ask_otp_change_order_status_receipt_section, auto_accept_remote_kot, auto_out_of_stock,
      auto_sync, category_time_for_pos, count_sales_after_midnight, customer_mandatory_dine_in,
      customer_mandatory_pickup, customer_mandatory_delivery, customer_mandatory_quick_bill,
      default_ebill_check, default_send_delivery_boy_check, edit_customize_order_number,
      enable_backup_notification_service, enable_customer_display_access, filter_items_by_order_type,
      generate_reports_start_close_dates, hide_clear_data_check_logout, hide_item_price_options,
      hide_load_menu_button, make_cancel_delete_reason_compulsory, make_discount_reason_mandatory,
      make_free_cancel_bill_reason_mandatory, make_payment_ref_number_mandatory,
      mandatory_delivery_boy_selection, mark_order_as_transfer_order, online_payment_auto_settle,
      order_sync_settings_auto_sync_interval, order_sync_settings_sync_batch_packet_size,
      separate_billing_by_section, set_entered_amount_as_opening, show_alternative_item_report_print,
      show_clear_sales_report_logout, show_order_no_label_pos, show_payment_history_button,
      show_remote_kot_option, show_send_payment_link, stock_availability_display,
      todays_report_sales_summary, todays_report_order_type_summary, todays_report_payment_type_summary,
      todays_report_discount_summary, todays_report_expense_summary, todays_report_bill_summary,
      todays_report_delivery_boy_summary, todays_report_waiter_summary,
      todays_report_kitchen_department_summary, todays_report_category_summary,
      todays_report_sold_items_summary, todays_report_cancel_items_summary,
      todays_report_wallet_summary, todays_report_due_payment_received_summary,
      todays_report_due_payment_receivable_summary, todays_report_payment_variance_summary,
      todays_report_currency_denominations_summary, when_send_todays_report,
      enable_currency_conversion, enable_user_login_validation, allow_closing_shift_despite_bills,
      show_real_time_kot_bill_notifications, use_separate_bill_numbers_online
    } = req.body;

    const existingSettings = db.prepare('SELECT * FROM mstgeneral_settings WHERE outletid = ?').get(outletid) || {};

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO mstgeneral_settings (
        outletid, allow_charges_after_bill_print, allow_discount_after_bill_print, allow_discount_before_save,
        allow_pre_order_tahd, ask_covers_dine_in, ask_covers_pickup, ask_covers_delivery,
        ask_covers_quick_bill, ask_covers_captain, ask_custom_order_id_quick_bill,
        ask_custom_order_type_quick_bill, ask_payment_mode_on_save_bill, ask_waiter_dine_in,
        ask_waiter_pickup, ask_waiter_delivery, ask_waiter_quick_bill, ask_otp_change_order_status_order_window,
        ask_otp_change_order_status_receipt_section, auto_accept_remote_kot, auto_out_of_stock,
        auto_sync, category_time_for_pos, count_sales_after_midnight, customer_mandatory_dine_in,
        customer_mandatory_pickup, customer_mandatory_delivery, customer_mandatory_quick_bill,
        default_ebill_check, default_send_delivery_boy_check, edit_customize_order_number,
        enable_backup_notification_service, enable_customer_display_access, filter_items_by_order_type,
        generate_reports_start_close_dates, hide_clear_data_check_logout, hide_item_price_options,
        hide_load_menu_button, make_cancel_delete_reason_compulsory, make_discount_reason_mandatory,
        make_free_cancel_bill_reason_mandatory, make_payment_ref_number_mandatory,
        mandatory_delivery_boy_selection, mark_order_as_transfer_order, online_payment_auto_settle,
        order_sync_settings_auto_sync_interval, order_sync_settings_sync_batch_packet_size,
        separate_billing_by_section, set_entered_amount_as_opening, show_alternative_item_report_print,
        show_clear_sales_report_logout, show_order_no_label_pos, show_payment_history_button,
        show_remote_kot_option, show_send_payment_link, stock_availability_display,
        todays_report_sales_summary, todays_report_order_type_summary, todays_report_payment_type_summary,
        todays_report_discount_summary, todays_report_expense_summary, todays_report_bill_summary,
        todays_report_delivery_boy_summary, todays_report_waiter_summary,
        todays_report_kitchen_department_summary, todays_report_category_summary,
        todays_report_sold_items_summary, todays_report_cancel_items_summary,
        todays_report_wallet_summary, todays_report_due_payment_received_summary,
        todays_report_due_payment_receivable_summary, todays_report_payment_variance_summary,
        todays_report_currency_denominations_summary, when_send_todays_report,
        enable_currency_conversion, enable_user_login_validation, allow_closing_shift_despite_bills,
        show_real_time_kot_bill_notifications, use_separate_bill_numbers_online
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      outletid,
      allow_charges_after_bill_print ?? existingSettings.allow_charges_after_bill_print ?? 0,
      allow_discount_after_bill_print ?? existingSettings.allow_discount_after_bill_print ?? 0,
      allow_discount_before_save ?? existingSettings.allow_discount_before_save ?? 1,
      allow_pre_order_tahd ?? existingSettings.allow_pre_order_tahd ?? 0,
      ask_covers_dine_in ?? existingSettings.ask_covers_dine_in ?? 1,
      ask_covers_pickup ?? existingSettings.ask_covers_pickup ?? 0,
      ask_covers_delivery ?? existingSettings.ask_covers_delivery ?? 0,
      ask_covers_quick_bill ?? existingSettings.ask_covers_quick_bill ?? 0,
      ask_covers_captain ?? existingSettings.ask_covers_captain ?? 0,
      ask_custom_order_id_quick_bill ?? existingSettings.ask_custom_order_id_quick_bill ?? 0,
      ask_custom_order_type_quick_bill ?? existingSettings.ask_custom_order_type_quick_bill ?? 0,
      ask_payment_mode_on_save_bill ?? existingSettings.ask_payment_mode_on_save_bill ?? 1,
      ask_waiter_dine_in ?? existingSettings.ask_waiter_dine_in ?? 1,
      ask_waiter_pickup ?? existingSettings.ask_waiter_pickup ?? 0,
      ask_waiter_delivery ?? existingSettings.ask_waiter_delivery ?? 0,
      ask_waiter_quick_bill ?? existingSettings.ask_waiter_quick_bill ?? 0,
      ask_otp_change_order_status_order_window ?? existingSettings.ask_otp_change_order_status_order_window ?? 0,
      ask_otp_change_order_status_receipt_section ?? existingSettings.ask_otp_change_order_status_receipt_section ?? 0,
      auto_accept_remote_kot ?? existingSettings.auto_accept_remote_kot ?? 0,
      auto_out_of_stock ?? existingSettings.auto_out_of_stock ?? 0,
      auto_sync ?? existingSettings.auto_sync ?? 1,
      category_time_for_pos ?? existingSettings.category_time_for_pos ?? '',
      count_sales_after_midnight ?? existingSettings.count_sales_after_midnight ?? 0,
      customer_mandatory_dine_in ?? existingSettings.customer_mandatory_dine_in ?? 1,
      customer_mandatory_pickup ?? existingSettings.customer_mandatory_pickup ?? 1,
      customer_mandatory_delivery ?? existingSettings.customer_mandatory_delivery ?? 1,
      customer_mandatory_quick_bill ?? existingSettings.customer_mandatory_quick_bill ?? 0,
      default_ebill_check ?? existingSettings.default_ebill_check ?? 1,
      default_send_delivery_boy_check ?? existingSettings.default_send_delivery_boy_check ?? 0,
      edit_customize_order_number ?? existingSettings.edit_customize_order_number ?? '',
      enable_backup_notification_service ?? existingSettings.enable_backup_notification_service ?? 0,
      enable_customer_display_access ?? existingSettings.enable_customer_display_access ?? 0,
      filter_items_by_order_type ?? existingSettings.filter_items_by_order_type ?? 0,
      generate_reports_start_close_dates ?? existingSettings.generate_reports_start_close_dates ?? 0,
      hide_clear_data_check_logout ?? existingSettings.hide_clear_data_check_logout ?? 0,
      hide_item_price_options ?? existingSettings.hide_item_price_options ?? 0,
      hide_load_menu_button ?? existingSettings.hide_load_menu_button ?? 0,
      make_cancel_delete_reason_compulsory ?? existingSettings.make_cancel_delete_reason_compulsory ?? 1,
      make_discount_reason_mandatory ?? existingSettings.make_discount_reason_mandatory ?? 1,
      make_free_cancel_bill_reason_mandatory ?? existingSettings.make_free_cancel_bill_reason_mandatory ?? 1,
      make_payment_ref_number_mandatory ?? existingSettings.make_payment_ref_number_mandatory ?? 0,
      mandatory_delivery_boy_selection ?? existingSettings.mandatory_delivery_boy_selection ?? 0,
      mark_order_as_transfer_order ?? existingSettings.mark_order_as_transfer_order ?? 0,
      online_payment_auto_settle ?? existingSettings.online_payment_auto_settle ?? 0,
      order_sync_settings_auto_sync_interval ?? existingSettings.order_sync_settings_auto_sync_interval ?? '300',
      order_sync_settings_sync_batch_packet_size ?? existingSettings.order_sync_settings_sync_batch_packet_size ?? 100,
      separate_billing_by_section ?? existingSettings.separate_billing_by_section ?? 0,
      set_entered_amount_as_opening ?? existingSettings.set_entered_amount_as_opening ?? 0,
      show_alternative_item_report_print ?? existingSettings.show_alternative_item_report_print ?? 0,
      show_clear_sales_report_logout ?? existingSettings.show_clear_sales_report_logout ?? 0,
      show_order_no_label_pos ?? existingSettings.show_order_no_label_pos ?? 1,
      show_payment_history_button ?? existingSettings.show_payment_history_button ?? 1,
      show_remote_kot_option ?? existingSettings.show_remote_kot_option ?? 0,
      show_send_payment_link ?? existingSettings.show_send_payment_link ?? 0,
      stock_availability_display ?? existingSettings.stock_availability_display ?? 1,
      todays_report_sales_summary ?? existingSettings.todays_report_sales_summary ?? 1,
      todays_report_order_type_summary ?? existingSettings.todays_report_order_type_summary ?? 1,
      todays_report_payment_type_summary ?? existingSettings.todays_report_payment_type_summary ?? 1,
      todays_report_discount_summary ?? existingSettings.todays_report_discount_summary ?? 1,
      todays_report_expense_summary ?? existingSettings.todays_report_expense_summary ?? 1,
      todays_report_bill_summary ?? existingSettings.todays_report_bill_summary ?? 1,
      todays_report_delivery_boy_summary ?? existingSettings.todays_report_delivery_boy_summary ?? 1,
      todays_report_waiter_summary ?? existingSettings.todays_report_waiter_summary ?? 1,
      todays_report_kitchen_department_summary ?? existingSettings.todays_report_kitchen_department_summary ?? 1,
      todays_report_category_summary ?? existingSettings.todays_report_category_summary ?? 1,
      todays_report_sold_items_summary ?? existingSettings.todays_report_sold_items_summary ?? 1,
      todays_report_cancel_items_summary ?? existingSettings.todays_report_cancel_items_summary ?? 1,
      todays_report_wallet_summary ?? existingSettings.todays_report_wallet_summary ?? 1,
      todays_report_due_payment_received_summary ?? existingSettings.todays_report_due_payment_received_summary ?? 1,
      todays_report_due_payment_receivable_summary ?? existingSettings.todays_report_due_payment_receivable_summary ?? 1,
      todays_report_payment_variance_summary ?? existingSettings.todays_report_payment_variance_summary ?? 1,
      todays_report_currency_denominations_summary ?? existingSettings.todays_report_currency_denominations_summary ?? 1,
      when_send_todays_report ?? existingSettings.when_send_todays_report ?? 'END_OF_DAY',
      enable_currency_conversion ?? existingSettings.enable_currency_conversion ?? 0,
      enable_user_login_validation ?? existingSettings.enable_user_login_validation ?? 1,
      allow_closing_shift_despite_bills ?? existingSettings.allow_closing_shift_despite_bills ?? 0,
      show_real_time_kot_bill_notifications ?? existingSettings.show_real_time_kot_bill_notifications ?? 1,
      use_separate_bill_numbers_online ?? existingSettings.use_separate_bill_numbers_online ?? 0
    );

    res.json({ message: 'General settings updated successfully' });
  } catch (error) {
    console.error('Error updating general settings:', error);
    res.status(500).json({ error: 'Failed to update general settings' });
  }
};


exports.updateOnlineOrderSettings = (req, res) => {
  try {
    const { outletid } = req.params;
    const {
      show_in_preparation_kds, auto_accept_online_order, customize_order_preparation_time,
      online_orders_time_delay, pull_order_on_accept, show_addons_separately,
      show_complete_online_order_id, show_online_order_preparation_time, update_food_ready_status_kds
    } = req.body;

    const existingSettings = db.prepare('SELECT * FROM mstonline_orders_settings WHERE outletid = ?').get(outletid) || {};

    console.log('Received data:', { outletid, ...req.body }); // Debug log

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO mstonline_orders_settings (
        outletid, show_in_preparation_kds, auto_accept_online_order, customize_order_preparation_time,
        online_orders_time_delay, pull_order_on_accept, show_addons_separately,
        show_complete_online_order_id, show_online_order_preparation_time, update_food_ready_status_kds
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const params = [
      outletid,
      show_in_preparation_kds !== undefined ? Number(show_in_preparation_kds) : (existingSettings.show_in_preparation_kds ?? 1),
      auto_accept_online_order !== undefined ? Number(auto_accept_online_order) : (existingSettings.auto_accept_online_order ?? 0),
      customize_order_preparation_time !== undefined ? Number(customize_order_preparation_time) : (existingSettings.customize_order_preparation_time ?? 0),
      online_orders_time_delay !== undefined ? Number(online_orders_time_delay) : (existingSettings.online_orders_time_delay ?? 0),
      pull_order_on_accept !== undefined ? Number(pull_order_on_accept) : (existingSettings.pull_order_on_accept ?? 0),
      show_addons_separately !== undefined ? Number(show_addons_separately) : (existingSettings.show_addons_separately ?? 0),
      show_complete_online_order_id !== undefined ? Number(show_complete_online_order_id) : (existingSettings.show_complete_online_order_id ?? 1),
      show_online_order_preparation_time !== undefined ? Number(show_online_order_preparation_time) : (existingSettings.show_online_order_preparation_time ?? 1),
      update_food_ready_status_kds !== undefined ? Number(update_food_ready_status_kds) : (existingSettings.update_food_ready_status_kds ?? 1)
    ];

    console.log('Bound parameters:', params); // Debug log

    stmt.run(...params);
    res.json({ message: 'Online order settings updated successfully' });
  } catch (error) {
    console.error('Error updating online order settings:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to update online order settings' });
  }
};



// Update Outlet Settings
exports.updateOutletSettings = (req, res) => {
  try {
    const { outletid } = req.params;
    const {
      auto_kot, enable_ebill, enable_kds, enable_payment, enable_covers, enable_waiter,
      enable_customer, enable_takeaway, enable_delivery, enable_dine_in, enable_quick_bill,
      enable_online_order, enable_category_time, enable_item_note, enable_discount,
      enable_charges, enable_kot_note, enable_bill_note, enable_kot_print, enable_bill_print
    } = req.body;

    const existingSettings = db.prepare('SELECT * FROM mstoutlet_settings WHERE outletid = ?').get(outletid) || {};

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO mstoutlet_settings (
        outletid, auto_kot, enable_ebill, enable_kds, enable_payment, enable_covers, enable_waiter,
        enable_customer, enable_takeaway, enable_delivery, enable_dine_in, enable_quick_bill,
        enable_online_order, enable_category_time, enable_item_note, enable_discount,
        enable_charges, enable_kot_note, enable_bill_note, enable_kot_print, enable_bill_print
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      outletid,
      auto_kot ?? existingSettings.auto_kot ?? 0,
      enable_ebill ?? existingSettings.enable_ebill ?? 1,
      enable_kds ?? existingSettings.enable_kds ?? 0,
      enable_payment ?? existingSettings.enable_payment ?? 1,
      enable_covers ?? existingSettings.enable_covers ?? 1,
      enable_waiter ?? existingSettings.enable_waiter ?? 1,
      enable_customer ?? existingSettings.enable_customer ?? 1,
      enable_takeaway ?? existingSettings.enable_takeaway ?? 1,
      enable_delivery ?? existingSettings.enable_delivery ?? 1,
      enable_dine_in ?? existingSettings.enable_dine_in ?? 1,
      enable_quick_bill ?? existingSettings.enable_quick_bill ?? 1,
      enable_online_order ?? existingSettings.enable_online_order ?? 0,
      enable_category_time ?? existingSettings.enable_category_time ?? 0,
      enable_item_note ?? existingSettings.enable_item_note ?? 1,
      enable_discount ?? existingSettings.enable_discount ?? 1,
      enable_charges ?? existingSettings.enable_charges ?? 1,
      enable_kot_note ?? existingSettings.enable_kot_note ?? 1,
      enable_bill_note ?? existingSettings.enable_bill_note ?? 1,
      enable_kot_print ?? existingSettings.enable_kot_print ?? 1,
      enable_bill_print ?? existingSettings.enable_bill_print ?? 1
    );

    res.json({ message: 'Outlet settings updated successfully' });
  } catch (error) {
    console.error('Error updating outlet settings:', error);
    res.status(500).json({ error: 'Failed to update outlet settings' });
  }
};