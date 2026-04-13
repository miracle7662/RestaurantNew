-- Fix missing settings for outletid=7
-- Run these SQL commands in your MySQL database

-- ===============================================
-- STEP 1: CHECK CURRENT STATUS (Run first)
-- ===============================================
SELECT 'bill_print_settings' as table_name, COUNT(*) as records FROM mstbills_print_settings WHERE outletid=7
UNION ALL SELECT 'general_settings', COUNT(*) FROM mstgeneral_settings WHERE outletid=7
UNION ALL SELECT 'online_orders_settings', COUNT(*) FROM mstonline_orders_settings WHERE outletid=7
UNION ALL SELECT 'bill_preview_settings', COUNT(*) FROM mstbill_preview_settings WHERE outletid=7
UNION ALL SELECT 'kot_print_settings', COUNT(*) FROM mstkot_print_settings WHERE outletid=7;

-- ===============================================
-- STEP 2: INSERT MISSING RECORDS (Run only if records=0 above)
-- ===============================================

-- 1. Bill Print Settings (mstbills_print_settings)
INSERT IGNORE INTO mstbills_print_settings (
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
  hide_item_rate_column, hide_item_total_column, hide_total_without_tax, trn_gstno
) VALUES (
  7, 1,1,1,1, 0,0,0,0, 0,1,1,1, 0,1,0,1, 0,0,1,1, 1,1,0,1, 0,0,0, 1,1,0,1, 0,1,1, 1,1,1,1, 1,1,1,1, 1,0,0,0, 1,0,1,0, 0,1, 0,0,0,0,0, ''
);

-- 2. Bill Preview Settings (mstbill_preview_settings)
INSERT IGNORE INTO mstbill_preview_settings (
  outletid, outlet_name, email, website, upi_id, bill_prefix,
  secondary_bill_prefix, bar_bill_prefix, show_upi_qr, enabled_bar_section,
  show_phone_on_bill, note, footer_note, field1, field2, field3, field4, fssai_no
) VALUES (
  7, (SELECT outlet_name FROM mst_outlets WHERE outletid=7), '', '', '',
  'BILL-', 'SEC-', 'BAR-', 0, 0, '', '', '', '', '', '', '', ''
);

-- 3. KOT Print Settings (mstkot_print_settings)
INSERT IGNORE INTO mstkot_print_settings (
  outletid, customer_on_kot_dine_in, customer_on_kot_pickup, customer_on_kot_delivery,
  customer_on_kot_quick_bill, customer_kot_display_option, group_kot_items_by_category,
  hide_table_name_quick_bill, show_new_order_tag, new_order_tag_label, show_running_order_tag,
  running_order_tag_label, dine_in_kot_no, pickup_kot_no, delivery_kot_no, quick_bill_kot_no,
  modifier_default_option, print_kot_both_languages, show_alternative_item, show_captain_username,
  show_covers_as_guest, show_item_price, show_kot_no_quick_bill, show_kot_note, show_online_order_otp,
  show_order_id_quick_bill, show_order_id_online_order, show_order_no_quick_bill_section,
  show_order_type_symbol, show_store_name, show_terminal_username, show_username, show_waiter,
  hide_item_Amt_column
) VALUES (
  7, 0,0,0,0, 'NAME_ONLY', 0, 0, 1, 'New', 1, 'Running',
  'DIN-', 'PUP-', 'DEL-', 'QBL-', 0, 0, 0, 0, 0, 1, 0, 1, 0,
  0, 0, 0, 1, 1, 0, 0, 1, 0
);

-- 4. General Settings (mstgeneral_settings)
INSERT IGNORE INTO mstgeneral_settings (
  outletid, customize_url_links, allow_charges_after_bill_print, allow_discount_after_bill_print,
  allow_discount_before_save, allow_pre_order_tahd, ask_covers, ask_covers_captain,
  ask_custom_order_id_quick_bill, ask_custom_order_type_quick_bill, ask_payment_mode_on_save_bill,
  ask_waiter, ask_otp_change_order_status_order_window, ask_otp_change_order_status_receipt_section,
  auto_accept_remote_kot, auto_out_of_stock, auto_sync, category_time_for_pos, count_sales_after_midnight,
  customer_display, customer_mandatory, default_ebill_check, default_send_delivery_boy_check,
  edit_customize_order_number, enable_backup_notification_service, enable_customer_display_access,
  filter_items_by_order_type, generate_reports_start_close_dates, hide_clear_data_check_logout,
  hide_item_price_options, hide_load_menu_button, make_cancel_delete_reason_compulsory,
  make_discount_reason_mandatory, make_free_cancel_bill_reason_mandatory, make_payment_ref_number_mandatory,
  mandatory_delivery_boy_selection, mark_order_as_transfer_order, online_payment_auto_settle,
  order_sync_settings, separate_billing_by_section, set_entered_amount_as_opening,
  show_alternative_item_report_print, show_clear_sales_report_logout, show_order_no_label_pos,
  show_payment_history_button, show_remote_kot_option, show_send_payment_link, stock_availability_display,
  todays_report, upi_payment_sound_notification, use_separate_bill_numbers_online,
  when_send_todays_report, enable_currency_conversion, enable_user_login_validation,
  allow_closing_shift_despite_bills, show_real_time_kot_bill_notifications
) VALUES (
  7, '[]', 0,0,1,0, '{\"dine_in\":true,\"pickup\":false,\"delivery\":false,\"quick_bill\":false}', 0,
  0,0,0, '{\"dine_in\":true,\"pickup\":false,\"delivery\":false,\"quick_bill\":false}', 0,0,
  0,0,0,'',0, '{\"media\":[]}', '{\"dine_in\":true,\"pickup\":true,\"delivery\":true,\"quick_bill\":false}',
  1,0,'',0,0,0,0,0,1,1,1,0,0,0,0, '{\"auto_sync_interval\":\"300\",\"sync_batch_packet_size\":\"100\"}', 0,0,
  0,0,1,1,0,0,1, '{\"sales_summary\":true,\"order_type_summary\":true,\"payment_type_summary\":true,\"discount_summary\":true,\"expense_summary\":true,\"bill_summary\":true,\"delivery_boy_summary\":true,\"waiter_summary\":true,\"kitchen_department_summary\":true,\"category_summary\":true,\"sold_items_summary\":true,\"cancel_items_summary\":true,\"wallet_summary\":true,\"due_payment_received_summary\":true,\"due_payment_receivable_summary\":true,\"payment_variance_summary\":true,\"currency_denominations_summary\":true}', 0,0,
  'END_OF_DAY',0,1,0,1
);

-- 5. Online Orders Settings (mstonline_orders_settings)
INSERT IGNORE INTO mstonline_orders_settings (
  outletid, show_in_preparation_kds, auto_accept_online_order, customize_order_preparation_time,
  online_orders_time_delay, pull_order_on_accept, show_addons_separately, show_complete_online_order_id,
  show_online_order_preparation_time, update_food_ready_status_kds
) VALUES (7, 1,0,0, 0,0,0,1,1,1);

-- ===============================================
-- STEP 3: VERIFY FIX (Run after inserts)
-- ===============================================
SELECT outletid FROM mst_outlets WHERE outletid=7;
-- Test endpoint should now return data:
-- curl http://localhost:3001/api/outlets/settings/7

-- ===============================================
-- STEP 6: CRITICAL - mstoutlet_settings (Main settings table)
-- ===============================================
INSERT IGNORE INTO mstoutlet_settings (
  outletid,
  send_order_notification,
  bill_number_length,
  decimal_points,
  notification_channel
) VALUES (
  7,
  'ALL',
  2,
  2,
  'SMS'
);

-- ===============================================
-- 🎉 SUCCESS! Frontend will now load settings properly
-- ===============================================
