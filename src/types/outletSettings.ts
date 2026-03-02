/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * Outlet Settings Type System
 * 
 * This file provides a clean separation between:
 * - DB Types: What comes from SQLite (0/1 for booleans, JSON strings for nested objects)
 * - Frontend Types: Clean TypeScript interfaces with proper booleans
 * - Mapper Functions: Convert DB → Frontend
 * - Transformer Functions: Convert Frontend → DB
 * 
 * Best Practices:
 * - Use boolean in frontend
 * - Use number (0/1) for booleans in DB
 * - Use proper type guards for safety
 * - No `any`, No `Record<string, any>`
 * ═══════════════════════════════════════════════════════════════════════════════
 */

/* ═══════════════════════════════════════════════════════════════════════════════
 * Utility Functions for Type Conversion
 * ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * Convert number (0/1) to boolean
 */
export const numberToBoolean = (
  value: number | null | undefined
): boolean => {
  return value === 1;
};
/**
 * Convert boolean to number (0/1)
 */
export const booleanToNumber = (value: boolean | null | undefined): number => {
  return value ? 1 : 0;
};

/**
 * Safely parse JSON string to object
 */
export const parseJsonSafely = <T>(jsonString: string | null | undefined, defaultValue: T): T => {
  if (!jsonString) return defaultValue;
  try {
    const parsed = JSON.parse(jsonString);
    return parsed as T;
  } catch {
    return defaultValue;
  }
};

/**
 * Stringify object to JSON safely
 */
export const stringifyJsonSafely = <T>(obj: T | null | undefined): string => {
  if (obj === null || obj === undefined) return '';
  try {
    return JSON.stringify(obj);
  } catch {
    return '';
  }
};

/* ═══════════════════════════════════════════════════════════════════════════════
 * Nested Object Interfaces (Shared)
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Order types for settings */
export interface OrderTypes {
  dine_in: boolean;
  pickup: boolean;
  delivery: boolean;
  quick_bill: boolean;
}

/** Order sync settings */
export interface OrderSyncSettings {
  auto_sync_interval: string;
  sync_batch_packet_size: string;
}

/** Customer display settings */
export interface CustomerDisplaySettings {
  media: string[];
}

/** Today's report settings */
export interface TodaysReportSettings {
  sales_summary: boolean;
  order_type_summary: boolean;
  payment_type_summary: boolean;
  discount_summary: boolean;
  expense_summary: boolean;
  bill_summary: boolean;
  delivery_boy_summary: boolean;
  waiter_summary: boolean;
  kitchen_department_summary: boolean;
  category_summary: boolean;
  sold_items_summary: boolean;
  cancel_items_summary: boolean;
  wallet_summary: boolean;
  due_payment_received_summary: boolean;
  due_payment_receivable_summary: boolean;
  payment_variance_summary: boolean;
  currency_denominations_summary: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Database Response Types (What comes from SQLite)
 * - Uses number (0/1) for booleans
 * - Uses string for JSON nested objects
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Bill Preview Settings - Database Response */
export interface BillPreviewSettingsDB {
  billpreviewsetting_id?: number;
  outletid?: number;
  outlet_name: string;
  email: string;
  website: string;
  upi_id: string;
  bill_prefix: string;
  secondary_bill_prefix: string;
  bar_bill_prefix: string;
  show_upi_qr: number;
  enabled_bar_section: number;
  show_phone_on_bill: string;
  note: string;
  footer_note: string;
  field1: string;
  field2: string;
  field3: string;
  field4: string;
  fssai_no: string;
}

/** KOT Print Settings - Database Response */
export interface KotPrintSettingsDB {
  kot_printsetting_id?: number;
  outletid?: number;
  customer_on_kot_dine_in: number;
  customer_on_kot_pickup: number;
  customer_on_kot_delivery: number;
  customer_on_kot_quick_bill: number;
  customer_kot_display_option: string;
  group_kot_items_by_category: number;
  hide_table_name_quick_bill: number;
  show_new_order_tag: number;
  new_order_tag_label: string;
  show_running_order_tag: number;
  running_order_tag_label: string;
  dine_in_kot_no: string;
  pickup_kot_no: string;
  delivery_kot_no: string;
  quick_bill_kot_no: string;
  modifier_default_option: number;
  print_kot_both_languages: number;
  show_alternative_item: number;
  show_captain_username: number;
  show_covers_as_guest: number;
  show_item_price: number;
  show_kot_no_quick_bill: number;
  show_kot_note: number;
  show_online_order_otp: number;
  show_order_id_quick_bill: number;
  show_order_id_online_order: number;
  show_order_no_quick_bill_section: number;
  show_order_type_symbol: number;
  show_store_name: number;
  show_terminal_username: number;
  show_username: number;
  show_waiter: number;
  hide_item_Amt_column: number;
}

/** Bill Print Settings - Database Response */
export interface BillPrintSettingsDB {
  billprintsetting_id?: number;
  outletid?: number;
  bill_title_dine_in: number;
  bill_title_pickup: number;
  bill_title_delivery: number;
  bill_title_quick_bill: number;
  mask_order_id: number;
  modifier_default_option_bill: number;
  print_bill_both_languages: number;
  show_alt_item_title_bill: number;
  show_alt_name_bill: number;
  show_bill_amount_words: number;
  show_bill_no_bill: number;
  show_bill_number_prefix_bill: number;
  show_bill_print_count: number;
  show_brand_name_bill: number;
  show_captain_bill: number;
  show_covers_bill: number;
  show_custom_qr_codes_bill: number;
  show_customer_gst_bill: number;
  show_customer_bill: number;
  show_customer_paid_amount: number;
  show_date_bill: number;
  show_default_payment: number;
  show_discount_reason_bill: number;
  show_due_amount_bill: number;
  show_ebill_invoice_qrcode: number;
  show_item_hsn_code_bill: number;
  show_item_level_charges_separately: number;
  show_item_note_bill: number;
  show_items_sequence_bill: number;
  show_kot_number_bill: number;
  show_logo_bill: number;
  show_order_id_bill: number;
  show_order_no_bill: number;
  show_order_note_bill: number;
  order_type_dine_in: number;
  order_type_pickup: number;
  order_type_delivery: number;
  order_type_quick_bill: number;
  show_outlet_name_bill: number;
  payment_mode_dine_in: number;
  payment_mode_pickup: number;
  payment_mode_delivery: number;
  payment_mode_quick_bill: number;
  table_name_dine_in: number;
  table_name_pickup: number;
  table_name_delivery: number;
  table_name_quick_bill: number;
  show_tax_charge_bill: number;
  show_username_bill: number;
  show_waiter_bill: number;
  show_zatca_invoice_qr: number;
  show_customer_address_pickup_bill: number;
  show_order_placed_time: number;
  hide_item_quantity_column: number;
  hide_item_rate_column: number;
  hide_item_total_column: number;
  hide_total_without_tax: number;
}

/** General Settings - Database Response */
export interface GeneralSettingsDB {
  outletid?: number;
  customize_url_links: string;
  allow_charges_after_bill_print: number;
  allow_discount_after_bill_print: number;
  allow_discount_before_save: number;
  allow_pre_order_tahd: number;
  ask_covers: string;
  ask_covers_captain: number;
  ask_custom_order_id_quick_bill: number;
  ask_custom_order_type_quick_bill: number;
  ask_payment_mode_on_save_bill: number;
  ask_waiter: string;
  ask_otp_change_order_status_order_window: number;
  ask_otp_change_order_status_receipt_section: number;
  auto_accept_remote_kot: number;
  auto_out_of_stock: number;
  auto_sync: number;
  category_time_for_pos: string;
  count_sales_after_midnight: number;
  customer_display: string;
  customer_mandatory: string;
  default_ebill_check: number;
  default_send_delivery_boy_check: number;
  edit_customize_order_number: string;
  enable_backup_notification_service: number;
  enable_customer_display_access: number;
  filter_items_by_order_type: number;
  generate_reports_start_close_dates: number;
  hide_clear_data_check_logout: number;
  hide_item_price_options: number;
  hide_load_menu_button: number;
  make_cancel_delete_reason_compulsory: number;
  make_discount_reason_mandatory: number;
  make_free_cancel_bill_reason_mandatory: number;
  make_payment_ref_number_mandatory: number;
  mandatory_delivery_boy_selection: number;
  mark_order_as_transfer_order: number;
  online_payment_auto_settle: number;
  order_sync_settings: string;
  separate_billing_by_section: number;
  set_entered_amount_as_opening: number;
  show_alternative_item_report_print: number;
  show_clear_sales_report_logout: number;
  show_order_no_label_pos: number;
  show_payment_history_button: number;
  show_remote_kot_option: number;
  show_send_payment_link: number;
  stock_availability_display: number;
  todays_report: string;
  upi_payment_sound_notification: number;
  use_separate_bill_numbers_online: number;
  when_send_todays_report: string;
  enable_currency_conversion: number;
  enable_user_login_validation: number;
  allow_closing_shift_despite_bills: number;
  show_real_time_kot_bill_notifications: number;
  created_at?: string;
  updated_at?: string;
}

/** Online Orders Settings - Database Response */
export interface OnlineOrdersSettingsDB {
  online_ordersetting_id?: number;
  outletid?: number;
  show_in_preparation_kds: number;
  auto_accept_online_order: number;
  customize_order_preparation_time: number;
  online_orders_time_delay: number | null;
  pull_order_on_accept: number;
  show_addons_separately: number;
  show_complete_online_order_id: number;
  show_online_order_preparation_time: number;
  update_food_ready_status_kds: number;
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Frontend Types (Clean TypeScript interfaces)
 * - Uses boolean for all boolean fields
 * - Uses proper object types for nested settings
 * - No string | object | undefined unions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Bill Preview Settings - Frontend */
export interface BillPreviewSettings {
  billpreviewsetting_id?: number;
  outletid?: number;
  outlet_name: string;
  email: string;
  website: string;
  upi_id: string;
  bill_prefix: string;
  secondary_bill_prefix: string;
  bar_bill_prefix: string;
  show_upi_qr: boolean;
  enabled_bar_section: boolean;
  show_phone_on_bill: string;
  note: string;
  footer_note: string;
  field1: string;
  field2: string;
  field3: string;
  field4: string;
  fssai_no: string;
}

/** KOT Print Settings - Frontend */
export interface KotPrintSettings {
  kot_printsetting_id?: number;
  outletid?: number;
  customer_on_kot_dine_in: boolean;
  customer_on_kot_pickup: boolean;
  customer_on_kot_delivery: boolean;
  customer_on_kot_quick_bill: boolean;
  customer_kot_display_option: string;
  group_kot_items_by_category: boolean;
  hide_table_name_quick_bill: boolean;
  show_new_order_tag: boolean;
  new_order_tag_label: string;
  show_running_order_tag: boolean;
  running_order_tag_label: string;
  dine_in_kot_no: string;
  pickup_kot_no: string;
  delivery_kot_no: string;
  quick_bill_kot_no: string;
  modifier_default_option: boolean;
  print_kot_both_languages: boolean;
  show_alternative_item: boolean;
  show_captain_username: boolean;
  show_covers_as_guest: boolean;
  show_item_price: boolean;
  show_kot_no_quick_bill: boolean;
  show_kot_note: boolean;
  show_online_order_otp: boolean;
  show_order_id_quick_bill: boolean;
  show_order_id_online_order: boolean;
  show_order_no_quick_bill_section: boolean;
  show_order_type_symbol: boolean;
  show_store_name: boolean;
  show_terminal_username: boolean;
  show_username: boolean;
  show_waiter: boolean;
  hide_item_Amt_column: boolean;
}

/** Bill Print Settings - Frontend */
export interface BillPrintSettings {
  billprintsetting_id?: number;
  outletid?: number;
  bill_title_dine_in: boolean;
  bill_title_pickup: boolean;
  bill_title_delivery: boolean;
  bill_title_quick_bill: boolean;
  mask_order_id: boolean;
  modifier_default_option_bill: boolean;
  print_bill_both_languages: boolean;
  show_alt_item_title_bill: boolean;
  show_alt_name_bill: boolean;
  show_bill_amount_words: boolean;
  show_bill_no_bill: boolean;
  show_bill_number_prefix_bill: boolean;
  show_bill_print_count: boolean;
  show_brand_name_bill: boolean;
  show_captain_bill: boolean;
  show_covers_bill: boolean;
  show_custom_qr_codes_bill: boolean;
  show_customer_gst_bill: boolean;
  show_customer_bill: boolean;
  show_customer_paid_amount: boolean;
  show_date_bill: boolean;
  show_default_payment: boolean;
  show_discount_reason_bill: boolean;
  show_due_amount_bill: boolean;
  show_ebill_invoice_qrcode: boolean;
  show_item_hsn_code_bill: boolean;
  show_item_level_charges_separately: boolean;
  show_item_note_bill: boolean;
  show_items_sequence_bill: boolean;
  show_kot_number_bill: boolean;
  show_logo_bill: boolean;
  show_order_id_bill: boolean;
  show_order_no_bill: boolean;
  show_order_note_bill: boolean;
  order_type_dine_in: boolean;
  order_type_pickup: boolean;
  order_type_delivery: boolean;
  order_type_quick_bill: boolean;
  show_outlet_name_bill: boolean;
  payment_mode_dine_in: boolean;
  payment_mode_pickup: boolean;
  payment_mode_delivery: boolean;
  payment_mode_quick_bill: boolean;
  table_name_dine_in: boolean;
  table_name_pickup: boolean;
  table_name_delivery: boolean;
  table_name_quick_bill: boolean;
  show_tax_charge_bill: boolean;
  show_username_bill: boolean;
  show_waiter_bill: boolean;
  show_zatca_invoice_qr: boolean;
  show_customer_address_pickup_bill: boolean;
  show_order_placed_time: boolean;
  hide_item_quantity_column: boolean;
  hide_item_rate_column: boolean;
  hide_item_total_column: boolean;
  hide_total_without_tax: boolean;
}

/** General Settings - Frontend */
export interface GeneralSettings {
  outletid?: number;
  customize_url_links: string;
  allow_charges_after_bill_print: boolean;
  allow_discount_after_bill_print: boolean;
  allow_discount_before_save: boolean;
  allow_pre_order_tahd: boolean;
  ask_covers: OrderTypes;
  ask_covers_captain: boolean;
  ask_custom_order_id_quick_bill: boolean;
  ask_custom_order_type_quick_bill: boolean;
  ask_payment_mode_on_save_bill: boolean;
  ask_waiter: OrderTypes;
  ask_otp_change_order_status_order_window: boolean;
  ask_otp_change_order_status_receipt_section: boolean;
  auto_accept_remote_kot: boolean;
  auto_out_of_stock: boolean;
  auto_sync: boolean;
  category_time_for_pos: string;
  count_sales_after_midnight: boolean;
  customer_display: CustomerDisplaySettings;
  customer_mandatory: OrderTypes;
  default_ebill_check: boolean;
  default_send_delivery_boy_check: boolean;
  edit_customize_order_number: string;
  enable_backup_notification_service: boolean;
  enable_customer_display_access: boolean;
  filter_items_by_order_type: boolean;
  generate_reports_start_close_dates: boolean;
  hide_clear_data_check_logout: boolean;
  hide_item_price_options: boolean;
  hide_load_menu_button: boolean;
  make_cancel_delete_reason_compulsory: boolean;
  make_discount_reason_mandatory: boolean;
  make_free_cancel_bill_reason_mandatory: boolean;
  make_payment_ref_number_mandatory: boolean;
  mandatory_delivery_boy_selection: boolean;
  mark_order_as_transfer_order: boolean;
  online_payment_auto_settle: boolean;
  order_sync_settings: OrderSyncSettings;
  separate_billing_by_section: boolean;
  set_entered_amount_as_opening: boolean;
  show_alternative_item_report_print: boolean;
  show_clear_sales_report_logout: boolean;
  show_order_no_label_pos: boolean;
  show_payment_history_button: boolean;
  show_remote_kot_option: boolean;
  show_send_payment_link: boolean;
  stock_availability_display: boolean;
  todays_report: TodaysReportSettings;
  upi_payment_sound_notification: boolean;
  use_separate_bill_numbers_online: boolean;
  when_send_todays_report: string;
  enable_currency_conversion: boolean;
  enable_user_login_validation: boolean;
  allow_closing_shift_despite_bills: boolean;
  show_real_time_kot_bill_notifications: boolean;
  created_at?: string;
  updated_at?: string;
}

/** Online Orders Settings - Frontend */
export interface OnlineOrdersSettings {
  online_ordersetting_id?: number;
  outletid?: number;
  show_in_preparation_kds: boolean;
  auto_accept_online_order: boolean;
  customize_order_preparation_time: boolean;
  online_orders_time_delay: number | null;
  pull_order_on_accept: boolean;
  show_addons_separately: boolean;
  show_complete_online_order_id: boolean;
  show_online_order_preparation_time: boolean;
  update_food_ready_status_kds: boolean;
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Combined Outlet Settings
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Complete Outlet Billing Settings */
export interface OutletBillingSettings {
  outletid: number;
  outlet_name: string;
  outlet_code: string;
  hotelid: number;
  bill_preview_settings: BillPreviewSettings | null;
  kot_print_settings: KotPrintSettings | null;
  bill_print_settings: BillPrintSettings | null;
  general_settings: GeneralSettings | null;
  online_orders_settings: OnlineOrdersSettings | null;
}

/** Default values for General Settings */
export const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  customize_url_links: '',
  allow_charges_after_bill_print: false,
  allow_discount_after_bill_print: false,
  allow_discount_before_save: false,
  allow_pre_order_tahd: false,
  ask_covers: { dine_in: false, pickup: false, delivery: false, quick_bill: false },
  ask_covers_captain: false,
  ask_custom_order_id_quick_bill: false,
  ask_custom_order_type_quick_bill: false,
  ask_payment_mode_on_save_bill: false,
  ask_waiter: { dine_in: false, pickup: false, delivery: false, quick_bill: false },
  ask_otp_change_order_status_order_window: false,
  ask_otp_change_order_status_receipt_section: false,
  auto_accept_remote_kot: false,
  auto_out_of_stock: false,
  auto_sync: false,
  category_time_for_pos: '',
  count_sales_after_midnight: false,
  customer_display: { media: [] },
  customer_mandatory: { dine_in: false, pickup: false, delivery: false, quick_bill: false },
  default_ebill_check: false,
  default_send_delivery_boy_check: false,
  edit_customize_order_number: '',
  enable_backup_notification_service: false,
  enable_customer_display_access: false,
  filter_items_by_order_type: false,
  generate_reports_start_close_dates: false,
  hide_clear_data_check_logout: false,
  hide_item_price_options: false,
  hide_load_menu_button: false,
  make_cancel_delete_reason_compulsory: false,
  make_discount_reason_mandatory: false,
  make_free_cancel_bill_reason_mandatory: false,
  make_payment_ref_number_mandatory: false,
  mandatory_delivery_boy_selection: false,
  mark_order_as_transfer_order: false,
  online_payment_auto_settle: false,
  order_sync_settings: { auto_sync_interval: '5', sync_batch_packet_size: '10' },
  separate_billing_by_section: false,
  set_entered_amount_as_opening: false,
  show_alternative_item_report_print: false,
  show_clear_sales_report_logout: false,
  show_order_no_label_pos: false,
  show_payment_history_button: false,
  show_remote_kot_option: false,
  show_send_payment_link: false,
  stock_availability_display: false,
  todays_report: {
    sales_summary: false,
    order_type_summary: false,
    payment_type_summary: false,
    discount_summary: false,
    expense_summary: false,
    bill_summary: false,
    delivery_boy_summary: false,
    waiter_summary: false,
    kitchen_department_summary: false,
    category_summary: false,
    sold_items_summary: false,
    cancel_items_summary: false,
    wallet_summary: false,
    due_payment_received_summary: false,
    due_payment_receivable_summary: false,
    payment_variance_summary: false,
    currency_denominations_summary: false,
  },
  upi_payment_sound_notification: false,
  use_separate_bill_numbers_online: false,
  when_send_todays_report: '',
  enable_currency_conversion: false,
  enable_user_login_validation: false,
  allow_closing_shift_despite_bills: false,
  show_real_time_kot_bill_notifications: false,
};

/* ═══════════════════════════════════════════════════════════════════════════════
 * Mapper Functions: DB → Frontend
 * ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * Map BillPreviewSettings from DB to Frontend
 */
export const mapBillPreviewSettings = (db: BillPreviewSettingsDB | null): BillPreviewSettings | null => {
  if (!db) return null;
  
  return {
    billpreviewsetting_id: db.billpreviewsetting_id,
    outletid: db.outletid,
    outlet_name: db.outlet_name,
    email: db.email,
    website: db.website,
    upi_id: db.upi_id,
    bill_prefix: db.bill_prefix,
    secondary_bill_prefix: db.secondary_bill_prefix,
    bar_bill_prefix: db.bar_bill_prefix,
    show_upi_qr: numberToBoolean(db.show_upi_qr),
    enabled_bar_section: numberToBoolean(db.enabled_bar_section),
    show_phone_on_bill: db.show_phone_on_bill,
    note: db.note,
    footer_note: db.footer_note,
    field1: db.field1,
    field2: db.field2,
    field3: db.field3,
    field4: db.field4,
    fssai_no: db.fssai_no,
  };
};

/**
 * Map KotPrintSettings from DB to Frontend
 */
export const mapKotPrintSettings = (db: KotPrintSettingsDB | null): KotPrintSettings | null => {
  if (!db) return null;
  
  return {
    kot_printsetting_id: db.kot_printsetting_id,
    outletid: db.outletid,
    customer_on_kot_dine_in: numberToBoolean(db.customer_on_kot_dine_in),
    customer_on_kot_pickup: numberToBoolean(db.customer_on_kot_pickup),
    customer_on_kot_delivery: numberToBoolean(db.customer_on_kot_delivery),
    customer_on_kot_quick_bill: numberToBoolean(db.customer_on_kot_quick_bill),
    customer_kot_display_option: db.customer_kot_display_option,
    group_kot_items_by_category: numberToBoolean(db.group_kot_items_by_category),
    hide_table_name_quick_bill: numberToBoolean(db.hide_table_name_quick_bill),
    show_new_order_tag: numberToBoolean(db.show_new_order_tag),
    new_order_tag_label: db.new_order_tag_label,
    show_running_order_tag: numberToBoolean(db.show_running_order_tag),
    running_order_tag_label: db.running_order_tag_label,
    dine_in_kot_no: db.dine_in_kot_no,
    pickup_kot_no: db.pickup_kot_no,
    delivery_kot_no: db.delivery_kot_no,
    quick_bill_kot_no: db.quick_bill_kot_no,
    modifier_default_option: numberToBoolean(db.modifier_default_option),
    print_kot_both_languages: numberToBoolean(db.print_kot_both_languages),
    show_alternative_item: numberToBoolean(db.show_alternative_item),
    show_captain_username: numberToBoolean(db.show_captain_username),
    show_covers_as_guest: numberToBoolean(db.show_covers_as_guest),
    show_item_price: numberToBoolean(db.show_item_price),
    show_kot_no_quick_bill: numberToBoolean(db.show_kot_no_quick_bill),
    show_kot_note: numberToBoolean(db.show_kot_note),
    show_online_order_otp: numberToBoolean(db.show_online_order_otp),
    show_order_id_quick_bill: numberToBoolean(db.show_order_id_quick_bill),
    show_order_id_online_order: numberToBoolean(db.show_order_id_online_order),
    show_order_no_quick_bill_section: numberToBoolean(db.show_order_no_quick_bill_section),
    show_order_type_symbol: numberToBoolean(db.show_order_type_symbol),
    show_store_name: numberToBoolean(db.show_store_name),
    show_terminal_username: numberToBoolean(db.show_terminal_username),
    show_username: numberToBoolean(db.show_username),
    show_waiter: numberToBoolean(db.show_waiter),
    hide_item_Amt_column: numberToBoolean(db.hide_item_Amt_column),
  };
};

/**
 * Map BillPrintSettings from DB to Frontend
 */
export const mapBillPrintSettings = (db: BillPrintSettingsDB | null): BillPrintSettings | null => {
  if (!db) return null;
  
  return {
    billprintsetting_id: db.billprintsetting_id,
    outletid: db.outletid,
    bill_title_dine_in: numberToBoolean(db.bill_title_dine_in),
    bill_title_pickup: numberToBoolean(db.bill_title_pickup),
    bill_title_delivery: numberToBoolean(db.bill_title_delivery),
    bill_title_quick_bill: numberToBoolean(db.bill_title_quick_bill),
    mask_order_id: numberToBoolean(db.mask_order_id),
    modifier_default_option_bill: numberToBoolean(db.modifier_default_option_bill),
    print_bill_both_languages: numberToBoolean(db.print_bill_both_languages),
    show_alt_item_title_bill: numberToBoolean(db.show_alt_item_title_bill),
    show_alt_name_bill: numberToBoolean(db.show_alt_name_bill),
    show_bill_amount_words: numberToBoolean(db.show_bill_amount_words),
    show_bill_no_bill: numberToBoolean(db.show_bill_no_bill),
    show_bill_number_prefix_bill: numberToBoolean(db.show_bill_number_prefix_bill),
    show_bill_print_count: numberToBoolean(db.show_bill_print_count),
    show_brand_name_bill: numberToBoolean(db.show_brand_name_bill),
    show_captain_bill: numberToBoolean(db.show_captain_bill),
    show_covers_bill: numberToBoolean(db.show_covers_bill),
    show_custom_qr_codes_bill: numberToBoolean(db.show_custom_qr_codes_bill),
    show_customer_gst_bill: numberToBoolean(db.show_customer_gst_bill),
    show_customer_bill: numberToBoolean(db.show_customer_bill),
    show_customer_paid_amount: numberToBoolean(db.show_customer_paid_amount),
    show_date_bill: numberToBoolean(db.show_date_bill),
    show_default_payment: numberToBoolean(db.show_default_payment),
    show_discount_reason_bill: numberToBoolean(db.show_discount_reason_bill),
    show_due_amount_bill: numberToBoolean(db.show_due_amount_bill),
    show_ebill_invoice_qrcode: numberToBoolean(db.show_ebill_invoice_qrcode),
    show_item_hsn_code_bill: numberToBoolean(db.show_item_hsn_code_bill),
    show_item_level_charges_separately: numberToBoolean(db.show_item_level_charges_separately),
    show_item_note_bill: numberToBoolean(db.show_item_note_bill),
    show_items_sequence_bill: numberToBoolean(db.show_items_sequence_bill),
    show_kot_number_bill: numberToBoolean(db.show_kot_number_bill),
    show_logo_bill: numberToBoolean(db.show_logo_bill),
    show_order_id_bill: numberToBoolean(db.show_order_id_bill),
    show_order_no_bill: numberToBoolean(db.show_order_no_bill),
    show_order_note_bill: numberToBoolean(db.show_order_note_bill),
    order_type_dine_in: numberToBoolean(db.order_type_dine_in),
    order_type_pickup: numberToBoolean(db.order_type_pickup),
    order_type_delivery: numberToBoolean(db.order_type_delivery),
    order_type_quick_bill: numberToBoolean(db.order_type_quick_bill),
    show_outlet_name_bill: numberToBoolean(db.show_outlet_name_bill),
    payment_mode_dine_in: numberToBoolean(db.payment_mode_dine_in),
    payment_mode_pickup: numberToBoolean(db.payment_mode_pickup),
    payment_mode_delivery: numberToBoolean(db.payment_mode_delivery),
    payment_mode_quick_bill: numberToBoolean(db.payment_mode_quick_bill),
    table_name_dine_in: numberToBoolean(db.table_name_dine_in),
    table_name_pickup: numberToBoolean(db.table_name_pickup),
    table_name_delivery: numberToBoolean(db.table_name_delivery),
    table_name_quick_bill: numberToBoolean(db.table_name_quick_bill),
    show_tax_charge_bill: numberToBoolean(db.show_tax_charge_bill),
    show_username_bill: numberToBoolean(db.show_username_bill),
    show_waiter_bill: numberToBoolean(db.show_waiter_bill),
    show_zatca_invoice_qr: numberToBoolean(db.show_zatca_invoice_qr),
    show_customer_address_pickup_bill: numberToBoolean(db.show_customer_address_pickup_bill),
    show_order_placed_time: numberToBoolean(db.show_order_placed_time),
    hide_item_quantity_column: numberToBoolean(db.hide_item_quantity_column),
    hide_item_rate_column: numberToBoolean(db.hide_item_rate_column),
    hide_item_total_column: numberToBoolean(db.hide_item_total_column),
    hide_total_without_tax: numberToBoolean(db.hide_total_without_tax),
  };
};

/**
 * Map GeneralSettings from DB to Frontend
 */
export const mapGeneralSettings = (db: GeneralSettingsDB | null): GeneralSettings | null => {
  if (!db) return null;
  
  const defaultOrderTypes: OrderTypes = {
    dine_in: false,
    pickup: false,
    delivery: false,
    quick_bill: false,
  };
  
  const defaultOrderSyncSettings: OrderSyncSettings = {
    auto_sync_interval: '5',
    sync_batch_packet_size: '10',
  };
  
  const defaultCustomerDisplay: CustomerDisplaySettings = {
    media: [],
  };
  
  const defaultTodaysReport: TodaysReportSettings = {
    sales_summary: false,
    order_type_summary: false,
    payment_type_summary: false,
    discount_summary: false,
    expense_summary: false,
    bill_summary: false,
    delivery_boy_summary: false,
    waiter_summary: false,
    kitchen_department_summary: false,
    category_summary: false,
    sold_items_summary: false,
    cancel_items_summary: false,
    wallet_summary: false,
    due_payment_received_summary: false,
    due_payment_receivable_summary: false,
    payment_variance_summary: false,
    currency_denominations_summary: false,
  };
  
  return {
    outletid: db.outletid,
    customize_url_links: db.customize_url_links || '',
    allow_charges_after_bill_print: numberToBoolean(db.allow_charges_after_bill_print),
    allow_discount_after_bill_print: numberToBoolean(db.allow_discount_after_bill_print),
    allow_discount_before_save: numberToBoolean(db.allow_discount_before_save),
    allow_pre_order_tahd: numberToBoolean(db.allow_pre_order_tahd),
    ask_covers: parseJsonSafely(db.ask_covers, defaultOrderTypes),
    ask_covers_captain: numberToBoolean(db.ask_covers_captain),
    ask_custom_order_id_quick_bill: numberToBoolean(db.ask_custom_order_id_quick_bill),
    ask_custom_order_type_quick_bill: numberToBoolean(db.ask_custom_order_type_quick_bill),
    ask_payment_mode_on_save_bill: numberToBoolean(db.ask_payment_mode_on_save_bill),
    ask_waiter: parseJsonSafely(db.ask_waiter, defaultOrderTypes),
    ask_otp_change_order_status_order_window: numberToBoolean(db.ask_otp_change_order_status_order_window),
    ask_otp_change_order_status_receipt_section: numberToBoolean(db.ask_otp_change_order_status_receipt_section),
    auto_accept_remote_kot: numberToBoolean(db.auto_accept_remote_kot),
    auto_out_of_stock: numberToBoolean(db.auto_out_of_stock),
    auto_sync: numberToBoolean(db.auto_sync),
    category_time_for_pos: db.category_time_for_pos || '',
    count_sales_after_midnight: numberToBoolean(db.count_sales_after_midnight),
    customer_display: parseJsonSafely(db.customer_display, defaultCustomerDisplay),
    customer_mandatory: parseJsonSafely(db.customer_mandatory, defaultOrderTypes),
    default_ebill_check: numberToBoolean(db.default_ebill_check),
    default_send_delivery_boy_check: numberToBoolean(db.default_send_delivery_boy_check),
    edit_customize_order_number: db.edit_customize_order_number || '',
    enable_backup_notification_service: numberToBoolean(db.enable_backup_notification_service),
    enable_customer_display_access: numberToBoolean(db.enable_customer_display_access),
    filter_items_by_order_type: numberToBoolean(db.filter_items_by_order_type),
    generate_reports_start_close_dates: numberToBoolean(db.generate_reports_start_close_dates),
    hide_clear_data_check_logout: numberToBoolean(db.hide_clear_data_check_logout),
    hide_item_price_options: numberToBoolean(db.hide_item_price_options),
    hide_load_menu_button: numberToBoolean(db.hide_load_menu_button),
    make_cancel_delete_reason_compulsory: numberToBoolean(db.make_cancel_delete_reason_compulsory),
    make_discount_reason_mandatory: numberToBoolean(db.make_discount_reason_mandatory),
    make_free_cancel_bill_reason_mandatory: numberToBoolean(db.make_free_cancel_bill_reason_mandatory),
    make_payment_ref_number_mandatory: numberToBoolean(db.make_payment_ref_number_mandatory),
    mandatory_delivery_boy_selection: numberToBoolean(db.mandatory_delivery_boy_selection),
    mark_order_as_transfer_order: numberToBoolean(db.mark_order_as_transfer_order),
    online_payment_auto_settle: numberToBoolean(db.online_payment_auto_settle),
    order_sync_settings: parseJsonSafely(db.order_sync_settings, defaultOrderSyncSettings),
    separate_billing_by_section: numberToBoolean(db.separate_billing_by_section),
    set_entered_amount_as_opening: numberToBoolean(db.set_entered_amount_as_opening),
    show_alternative_item_report_print: numberToBoolean(db.show_alternative_item_report_print),
    show_clear_sales_report_logout: numberToBoolean(db.show_clear_sales_report_logout),
    show_order_no_label_pos: numberToBoolean(db.show_order_no_label_pos),
    show_payment_history_button: numberToBoolean(db.show_payment_history_button),
    show_remote_kot_option: numberToBoolean(db.show_remote_kot_option),
    show_send_payment_link: numberToBoolean(db.show_send_payment_link),
    stock_availability_display: numberToBoolean(db.stock_availability_display),
    todays_report: parseJsonSafely(db.todays_report, defaultTodaysReport),
    upi_payment_sound_notification: numberToBoolean(db.upi_payment_sound_notification),
    use_separate_bill_numbers_online: numberToBoolean(db.use_separate_bill_numbers_online),
    when_send_todays_report: db.when_send_todays_report || '',
    enable_currency_conversion: numberToBoolean(db.enable_currency_conversion),
    enable_user_login_validation: numberToBoolean(db.enable_user_login_validation),
    allow_closing_shift_despite_bills: numberToBoolean(db.allow_closing_shift_despite_bills),
    show_real_time_kot_bill_notifications: numberToBoolean(db.show_real_time_kot_bill_notifications),
    created_at: db.created_at,
    updated_at: db.updated_at,
  };
};

/**
 * Map OnlineOrdersSettings from DB to Frontend
 */
export const mapOnlineOrdersSettings = (db: OnlineOrdersSettingsDB | null): OnlineOrdersSettings | null => {
  if (!db) return null;
  
  return {
    online_ordersetting_id: db.online_ordersetting_id,
    outletid: db.outletid,
    show_in_preparation_kds: numberToBoolean(db.show_in_preparation_kds),
    auto_accept_online_order: numberToBoolean(db.auto_accept_online_order),
    customize_order_preparation_time: numberToBoolean(db.customize_order_preparation_time),
    online_orders_time_delay: db.online_orders_time_delay,
    pull_order_on_accept: numberToBoolean(db.pull_order_on_accept),
    show_addons_separately: numberToBoolean(db.show_addons_separately),
    show_complete_online_order_id: numberToBoolean(db.show_complete_online_order_id),
    show_online_order_preparation_time: numberToBoolean(db.show_online_order_preparation_time),
    update_food_ready_status_kds: numberToBoolean(db.update_food_ready_status_kds),
  };
};

/* ═══════════════════════════════════════════════════════════════════════════════
 * Transformer Functions: Frontend → DB
 * ═══════════════════════════════════════════════════════════════════════════════ */

/**
 * Transform BillPreviewSettings from Frontend to DB
 */
export const transformBillPreviewSettingsToDB = (frontend: BillPreviewSettings): BillPreviewSettingsDB => {
  return {
    billpreviewsetting_id: frontend.billpreviewsetting_id,
    outletid: frontend.outletid,
    outlet_name: frontend.outlet_name,
    email: frontend.email,
    website: frontend.website,
    upi_id: frontend.upi_id,
    bill_prefix: frontend.bill_prefix,
    secondary_bill_prefix: frontend.secondary_bill_prefix,
    bar_bill_prefix: frontend.bar_bill_prefix,
    show_upi_qr: booleanToNumber(frontend.show_upi_qr),
    enabled_bar_section: booleanToNumber(frontend.enabled_bar_section),
    show_phone_on_bill: frontend.show_phone_on_bill,
    note: frontend.note,
    footer_note: frontend.footer_note,
    field1: frontend.field1,
    field2: frontend.field2,
    field3: frontend.field3,
    field4: frontend.field4,
    fssai_no: frontend.fssai_no,
  };
};

/**
 * Transform KotPrintSettings from Frontend to DB
 */
export const transformKotPrintSettingsToDB = (frontend: KotPrintSettings): KotPrintSettingsDB => {
  return {
    kot_printsetting_id: frontend.kot_printsetting_id,
    outletid: frontend.outletid,
    customer_on_kot_dine_in: booleanToNumber(frontend.customer_on_kot_dine_in),
    customer_on_kot_pickup: booleanToNumber(frontend.customer_on_kot_pickup),
    customer_on_kot_delivery: booleanToNumber(frontend.customer_on_kot_delivery),
    customer_on_kot_quick_bill: booleanToNumber(frontend.customer_on_kot_quick_bill),
    customer_kot_display_option: frontend.customer_kot_display_option,
    group_kot_items_by_category: booleanToNumber(frontend.group_kot_items_by_category),
    hide_table_name_quick_bill: booleanToNumber(frontend.hide_table_name_quick_bill),
    show_new_order_tag: booleanToNumber(frontend.show_new_order_tag),
    new_order_tag_label: frontend.new_order_tag_label,
    show_running_order_tag: booleanToNumber(frontend.show_running_order_tag),
    running_order_tag_label: frontend.running_order_tag_label,
    dine_in_kot_no: frontend.dine_in_kot_no,
    pickup_kot_no: frontend.pickup_kot_no,
    delivery_kot_no: frontend.delivery_kot_no,
    quick_bill_kot_no: frontend.quick_bill_kot_no,
    modifier_default_option: booleanToNumber(frontend.modifier_default_option),
    print_kot_both_languages: booleanToNumber(frontend.print_kot_both_languages),
    show_alternative_item: booleanToNumber(frontend.show_alternative_item),
    show_captain_username: booleanToNumber(frontend.show_captain_username),
    show_covers_as_guest: booleanToNumber(frontend.show_covers_as_guest),
    show_item_price: booleanToNumber(frontend.show_item_price),
    show_kot_no_quick_bill: booleanToNumber(frontend.show_kot_no_quick_bill),
    show_kot_note: booleanToNumber(frontend.show_kot_note),
    show_online_order_otp: booleanToNumber(frontend.show_online_order_otp),
    show_order_id_quick_bill: booleanToNumber(frontend.show_order_id_quick_bill),
    show_order_id_online_order: booleanToNumber(frontend.show_order_id_online_order),
    show_order_no_quick_bill_section: booleanToNumber(frontend.show_order_no_quick_bill_section),
    show_order_type_symbol: booleanToNumber(frontend.show_order_type_symbol),
    show_store_name: booleanToNumber(frontend.show_store_name),
    show_terminal_username: booleanToNumber(frontend.show_terminal_username),
    show_username: booleanToNumber(frontend.show_username),
    show_waiter: booleanToNumber(frontend.show_waiter),
    hide_item_Amt_column: booleanToNumber(frontend.hide_item_Amt_column),
  };
};

/**
 * Transform BillPrintSettings from Frontend to DB
 */
export const transformBillPrintSettingsToDB = (frontend: BillPrintSettings): BillPrintSettingsDB => {
  return {
    billprintsetting_id: frontend.billprintsetting_id,
    outletid: frontend.outletid,
    bill_title_dine_in: booleanToNumber(frontend.bill_title_dine_in),
    bill_title_pickup: booleanToNumber(frontend.bill_title_pickup),
    bill_title_delivery: booleanToNumber(frontend.bill_title_delivery),
    bill_title_quick_bill: booleanToNumber(frontend.bill_title_quick_bill),
    mask_order_id: booleanToNumber(frontend.mask_order_id),
    modifier_default_option_bill: booleanToNumber(frontend.modifier_default_option_bill),
    print_bill_both_languages: booleanToNumber(frontend.print_bill_both_languages),
    show_alt_item_title_bill: booleanToNumber(frontend.show_alt_item_title_bill),
    show_alt_name_bill: booleanToNumber(frontend.show_alt_name_bill),
    show_bill_amount_words: booleanToNumber(frontend.show_bill_amount_words),
    show_bill_no_bill: booleanToNumber(frontend.show_bill_no_bill),
    show_bill_number_prefix_bill: booleanToNumber(frontend.show_bill_number_prefix_bill),
    show_bill_print_count: booleanToNumber(frontend.show_bill_print_count),
    show_brand_name_bill: booleanToNumber(frontend.show_brand_name_bill),
    show_captain_bill: booleanToNumber(frontend.show_captain_bill),
    show_covers_bill: booleanToNumber(frontend.show_covers_bill),
    show_custom_qr_codes_bill: booleanToNumber(frontend.show_custom_qr_codes_bill),
    show_customer_gst_bill: booleanToNumber(frontend.show_customer_gst_bill),
    show_customer_bill: booleanToNumber(frontend.show_customer_bill),
    show_customer_paid_amount: booleanToNumber(frontend.show_customer_paid_amount),
    show_date_bill: booleanToNumber(frontend.show_date_bill),
    show_default_payment: booleanToNumber(frontend.show_default_payment),
    show_discount_reason_bill: booleanToNumber(frontend.show_discount_reason_bill),
    show_due_amount_bill: booleanToNumber(frontend.show_due_amount_bill),
    show_ebill_invoice_qrcode: booleanToNumber(frontend.show_ebill_invoice_qrcode),
    show_item_hsn_code_bill: booleanToNumber(frontend.show_item_hsn_code_bill),
    show_item_level_charges_separately: booleanToNumber(frontend.show_item_level_charges_separately),
    show_item_note_bill: booleanToNumber(frontend.show_item_note_bill),
    show_items_sequence_bill: booleanToNumber(frontend.show_items_sequence_bill),
    show_kot_number_bill: booleanToNumber(frontend.show_kot_number_bill),
    show_logo_bill: booleanToNumber(frontend.show_logo_bill),
    show_order_id_bill: booleanToNumber(frontend.show_order_id_bill),
    show_order_no_bill: booleanToNumber(frontend.show_order_no_bill),
    show_order_note_bill: booleanToNumber(frontend.show_order_note_bill),
    order_type_dine_in: booleanToNumber(frontend.order_type_dine_in),
    order_type_pickup: booleanToNumber(frontend.order_type_pickup),
    order_type_delivery: booleanToNumber(frontend.order_type_delivery),
    order_type_quick_bill: booleanToNumber(frontend.order_type_quick_bill),
    show_outlet_name_bill: booleanToNumber(frontend.show_outlet_name_bill),
    payment_mode_dine_in: booleanToNumber(frontend.payment_mode_dine_in),
    payment_mode_pickup: booleanToNumber(frontend.payment_mode_pickup),
    payment_mode_delivery: booleanToNumber(frontend.payment_mode_delivery),
    payment_mode_quick_bill: booleanToNumber(frontend.payment_mode_quick_bill),
    table_name_dine_in: booleanToNumber(frontend.table_name_dine_in),
    table_name_pickup: booleanToNumber(frontend.table_name_pickup),
    table_name_delivery: booleanToNumber(frontend.table_name_delivery),
    table_name_quick_bill: booleanToNumber(frontend.table_name_quick_bill),
    show_tax_charge_bill: booleanToNumber(frontend.show_tax_charge_bill),
    show_username_bill: booleanToNumber(frontend.show_username_bill),
    show_waiter_bill: booleanToNumber(frontend.show_waiter_bill),
    show_zatca_invoice_qr: booleanToNumber(frontend.show_zatca_invoice_qr),
    show_customer_address_pickup_bill: booleanToNumber(frontend.show_customer_address_pickup_bill),
    show_order_placed_time: booleanToNumber(frontend.show_order_placed_time),
    hide_item_quantity_column: booleanToNumber(frontend.hide_item_quantity_column),
    hide_item_rate_column: booleanToNumber(frontend.hide_item_rate_column),
    hide_item_total_column: booleanToNumber(frontend.hide_item_total_column),
    hide_total_without_tax: booleanToNumber(frontend.hide_total_without_tax),
  };
};

/**
 * Transform GeneralSettings from Frontend to DB (for API payload)
 * Note: Nested objects are stringified to JSON
 */
export const transformGeneralSettingsToDB = (frontend: GeneralSettings): GeneralSettingsDB => {
  return {
    outletid: frontend.outletid,
    customize_url_links: frontend.customize_url_links,
    allow_charges_after_bill_print: booleanToNumber(frontend.allow_charges_after_bill_print),
    allow_discount_after_bill_print: booleanToNumber(frontend.allow_discount_after_bill_print),
    allow_discount_before_save: booleanToNumber(frontend.allow_discount_before_save),
    allow_pre_order_tahd: booleanToNumber(frontend.allow_pre_order_tahd),
    ask_covers: stringifyJsonSafely(frontend.ask_covers),
    ask_covers_captain: booleanToNumber(frontend.ask_covers_captain),
    ask_custom_order_id_quick_bill: booleanToNumber(frontend.ask_custom_order_id_quick_bill),
    ask_custom_order_type_quick_bill: booleanToNumber(frontend.ask_custom_order_type_quick_bill),
    ask_payment_mode_on_save_bill: booleanToNumber(frontend.ask_payment_mode_on_save_bill),
    ask_waiter: stringifyJsonSafely(frontend.ask_waiter),
    ask_otp_change_order_status_order_window: booleanToNumber(frontend.ask_otp_change_order_status_order_window),
    ask_otp_change_order_status_receipt_section: booleanToNumber(frontend.ask_otp_change_order_status_receipt_section),
    auto_accept_remote_kot: booleanToNumber(frontend.auto_accept_remote_kot),
    auto_out_of_stock: booleanToNumber(frontend.auto_out_of_stock),
    auto_sync: booleanToNumber(frontend.auto_sync),
    category_time_for_pos: frontend.category_time_for_pos,
    count_sales_after_midnight: booleanToNumber(frontend.count_sales_after_midnight),
    customer_display: stringifyJsonSafely(frontend.customer_display),
    customer_mandatory: stringifyJsonSafely(frontend.customer_mandatory),
    default_ebill_check: booleanToNumber(frontend.default_ebill_check),
    default_send_delivery_boy_check: booleanToNumber(frontend.default_send_delivery_boy_check),
    edit_customize_order_number: frontend.edit_customize_order_number,
    enable_backup_notification_service: booleanToNumber(frontend.enable_backup_notification_service),
    enable_customer_display_access: booleanToNumber(frontend.enable_customer_display_access),
    filter_items_by_order_type: booleanToNumber(frontend.filter_items_by_order_type),
    generate_reports_start_close_dates: booleanToNumber(frontend.generate_reports_start_close_dates),
    hide_clear_data_check_logout: booleanToNumber(frontend.hide_clear_data_check_logout),
    hide_item_price_options: booleanToNumber(frontend.hide_item_price_options),
    hide_load_menu_button: booleanToNumber(frontend.hide_load_menu_button),
    make_cancel_delete_reason_compulsory: booleanToNumber(frontend.make_cancel_delete_reason_compulsory),
    make_discount_reason_mandatory: booleanToNumber(frontend.make_discount_reason_mandatory),
    make_free_cancel_bill_reason_mandatory: booleanToNumber(frontend.make_free_cancel_bill_reason_mandatory),
    make_payment_ref_number_mandatory: booleanToNumber(frontend.make_payment_ref_number_mandatory),
    mandatory_delivery_boy_selection: booleanToNumber(frontend.mandatory_delivery_boy_selection),
    mark_order_as_transfer_order: booleanToNumber(frontend.mark_order_as_transfer_order),
    online_payment_auto_settle: booleanToNumber(frontend.online_payment_auto_settle),
    order_sync_settings: stringifyJsonSafely(frontend.order_sync_settings),
    separate_billing_by_section: booleanToNumber(frontend.separate_billing_by_section),
    set_entered_amount_as_opening: booleanToNumber(frontend.set_entered_amount_as_opening),
    show_alternative_item_report_print: booleanToNumber(frontend.show_alternative_item_report_print),
    show_clear_sales_report_logout: booleanToNumber(frontend.show_clear_sales_report_logout),
    show_order_no_label_pos: booleanToNumber(frontend.show_order_no_label_pos),
    show_payment_history_button: booleanToNumber(frontend.show_payment_history_button),
    show_remote_kot_option: booleanToNumber(frontend.show_remote_kot_option),
    show_send_payment_link: booleanToNumber(frontend.show_send_payment_link),
    stock_availability_display: booleanToNumber(frontend.stock_availability_display),
    todays_report: stringifyJsonSafely(frontend.todays_report),
    upi_payment_sound_notification: booleanToNumber(frontend.upi_payment_sound_notification),
    use_separate_bill_numbers_online: booleanToNumber(frontend.use_separate_bill_numbers_online),
    when_send_todays_report: frontend.when_send_todays_report,
    enable_currency_conversion: booleanToNumber(frontend.enable_currency_conversion),
    enable_user_login_validation: booleanToNumber(frontend.enable_user_login_validation),
    allow_closing_shift_despite_bills: booleanToNumber(frontend.allow_closing_shift_despite_bills),
    show_real_time_kot_bill_notifications: booleanToNumber(frontend.show_real_time_kot_bill_notifications),
  };
};

/**
 * Transform OnlineOrdersSettings from Frontend to DB
 */
export const transformOnlineOrdersSettingsToDB = (frontend: OnlineOrdersSettings): OnlineOrdersSettingsDB => {
  return {
    online_ordersetting_id: frontend.online_ordersetting_id,
    outletid: frontend.outletid,
    show_in_preparation_kds: booleanToNumber(frontend.show_in_preparation_kds),
    auto_accept_online_order: booleanToNumber(frontend.auto_accept_online_order),
    customize_order_preparation_time: booleanToNumber(frontend.customize_order_preparation_time),
    online_orders_time_delay: frontend.online_orders_time_delay ?? null,
    pull_order_on_accept: booleanToNumber(frontend.pull_order_on_accept),
    show_addons_separately: booleanToNumber(frontend.show_addons_separately),
    show_complete_online_order_id: booleanToNumber(frontend.show_complete_online_order_id),
    show_online_order_preparation_time: booleanToNumber(frontend.show_online_order_preparation_time),
    update_food_ready_status_kds: booleanToNumber(frontend.update_food_ready_status_kds),
  };
};

/* ═══════════════════════════════════════════════════════════════════════════════
 * Raw Backend Response Type
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Raw backend response type (what comes from the API) */
export interface RawOutletBillingSettingsResponse {
  outletid: number;
  outlet_name: string;
  outlet_code: string;
  hotelid: number;
  bill_print_settings: BillPrintSettingsDB | null;
  general_settings: GeneralSettingsDB | null;
  online_orders_settings: OnlineOrdersSettingsDB | null;
  bill_preview_settings: BillPreviewSettingsDB | null;
  kot_print_settings: KotPrintSettingsDB | null;
}

/**
 * Map complete Outlet Billing Settings from DB response to Frontend
 */
export const mapOutletBillingSettings = (raw: RawOutletBillingSettingsResponse): OutletBillingSettings => {
  return {
    outletid: raw.outletid,
    outlet_name: raw.outlet_name,
    outlet_code: raw.outlet_code,
    hotelid: raw.hotelid,
    bill_preview_settings: mapBillPreviewSettings(raw.bill_preview_settings),
    kot_print_settings: mapKotPrintSettings(raw.kot_print_settings),
    bill_print_settings: mapBillPrintSettings(raw.bill_print_settings),
    general_settings: mapGeneralSettings(raw.general_settings),
    online_orders_settings: mapOnlineOrdersSettings(raw.online_orders_settings),
  };
};
