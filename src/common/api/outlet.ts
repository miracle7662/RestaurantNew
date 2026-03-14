/**
 * Outlet Service - Clean API service for outlet management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Outlet information */
export type OutletData = Outlet;

/** Outlet information */
export interface Outlet {
  outletid?: number
  outlet_name: string
  hotelid?: number
  market_id?: string
  outlet_code?: string
  phone?: string
  email?: string
  website?: string
  address?: string
  city?: string
  zip_code?: string
  country?: string
  country_code?: string
  timezone?: string
  timezone_offset?: string
  start_day_time?: string
  close_day_time?: string
  next_reset_bill_date?: string
  next_reset_bill_days?: string
  next_reset_kot_date?: string
  next_reset_kot_days?: string
  contact_phone?: string
  notification_email?: string
  description?: string
  logo?: string
  gst_no?: string
  fssai_no?: string
  status?: number
  digital_order?: number
  logout_pos?: number
  password_protection?: number
  send_payment_link?: number
  send_ebill_whatsapp?: number
  add_custom_qr?: number
  start_time: number
  end_time: number
  warehouseid: number
  reduce_inventory?: number
  registered_at?: string
  created_by_id?: number
  created_date?: string
  updated_by_id?: number
  updated_date?: string
  brand_name?: string
  billpreviewsetting_id?: number
  kot_printsetting_id?: number
  bill_printsetting_id?: number
  general_setting_id?: number
  online_ordersetting_id?: number
}

/** Outlet payload for create/update */
export interface OutletPayload {
  outletid?: number
  outlet_name: string
  hotelid?: number
  market_id?: string
  outlet_code?: string
  phone?: string
  email?: string
  website?: string
  address?: string
  city?: string
  zip_code?: string
  country?: string
  country_code?: string
  timezone?: string
  timezone_offset?: string
  start_day_time?: string
  close_day_time?: string
  next_reset_bill_date?: string
  next_reset_bill_days?: string
  next_reset_kot_date?: string
  next_reset_kot_days?: string
  contact_phone?: string
  notification_email?: string
  description?: string
  logo?: string
  gst_no?: string
  fssai_no?: string
  status?: number
  digital_order?: number
  logout_pos?: number
  password_protection?: number
  send_payment_link?: number
  send_ebill_whatsapp?: number
  add_custom_qr?: number
  start_time: number
  end_time: number
  warehouseid: number
  reduce_inventory?: number
  registered_at?: string
  created_by_id?: number
  created_date?: string
  updated_by_id?: number
  updated_date?: string
  brand_name?: string
  billpreviewsetting_id?: number
  kot_printsetting_id?: number
  bill_printsetting_id?: number
  general_setting_id?: number
  online_ordersetting_id?: number
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Bill Preview Settings Type Definition
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Bill Preview Settings interface - uses number (0/1) for boolean fields to match backend DB */
export interface BillPreviewSettings {
  billpreviewsetting_id?: number
  outletid?: number
  outlet_name: string
  email: string
  website: string
  upi_id: string
  bill_prefix: string
  secondary_bill_prefix: string
  bar_bill_prefix: string
  show_upi_qr: number
  enabled_bar_section: number
  show_phone_on_bill: string
  note: string
  footer_note: string
  field1: string
  field2: string
  field3: string
  field4: string
  fssai_no: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * KOT Print Settings Type Definition
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** KOT Print Settings interface - uses number (0/1) for boolean fields to match backend DB */
export interface KotPrintSettings {
  kot_printsetting_id?: number
  outletid?: number
  customer_on_kot_dine_in: number
  customer_on_kot_pickup: number
  customer_on_kot_delivery: number
  customer_on_kot_quick_bill: number
  customer_kot_display_option: string
  group_kot_items_by_category: number
  hide_table_name_quick_bill: number
  show_new_order_tag: number
  new_order_tag_label: string
  show_running_order_tag: number
  running_order_tag_label: string
  dine_in_kot_no: string
  pickup_kot_no: string
  delivery_kot_no: string
  quick_bill_kot_no: string
  modifier_default_option: number
  print_kot_both_languages: number
  show_alternative_item: number
  show_captain_username: number
  show_covers_as_guest: number
  show_item_price: number
  show_kot_no_quick_bill: number
  show_kot_note: number
  show_online_order_otp: number
  show_order_id_quick_bill: number
  show_order_id_online_order: number
  show_order_no_quick_bill_section: number
  show_order_type_symbol: number
  show_store_name: number
  show_terminal_username: number
  show_username: number
  show_waiter: number
  hide_item_Amt_column: number
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Bill Print Settings Type Definition
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Bill Print Settings interface - uses number (0/1) for boolean fields to match backend DB */
export interface BillPrintSettings {
  billprintsetting_id?: number
  outletid?: number
  bill_title_dine_in: number
  bill_title_pickup: number
  bill_title_delivery: number
  bill_title_quick_bill: number
  mask_order_id: number
  modifier_default_option_bill: number
  print_bill_both_languages: number
  show_alt_item_title_bill: number
  show_alt_name_bill: number
  show_bill_amount_words: number
  show_bill_no_bill: number
  show_bill_number_prefix_bill: number
  show_bill_print_count: number
  show_brand_name_bill: number
  show_captain_bill: number
  show_covers_bill: number
  show_custom_qr_codes_bill: number
  show_customer_gst_bill: number
  show_customer_bill: number
  show_customer_paid_amount: number
  show_date_bill: number
  show_default_payment: number
  show_discount_reason_bill: number
  show_due_amount_bill: number
  show_ebill_invoice_qrcode: number
  show_item_hsn_code_bill: number
  show_item_level_charges_separately: number
  show_item_note_bill: number
  show_items_sequence_bill: number
  show_kot_number_bill: number
  show_logo_bill: number
  show_order_id_bill: number
  show_order_no_bill: number
  show_order_note_bill: number
  order_type_dine_in: number
  order_type_pickup: number
  order_type_delivery: number
  order_type_quick_bill: number
  show_outlet_name_bill: number
  payment_mode_dine_in: number
  payment_mode_pickup: number
  payment_mode_delivery: number
  payment_mode_quick_bill: number
  table_name_dine_in: number
  table_name_pickup: number
  table_name_delivery: number
  table_name_quick_bill: number
  show_tax_charge_bill: number
  show_username_bill: number
  show_waiter_bill: number
  show_zatca_invoice_qr: number
  show_customer_address_pickup_bill: number
  show_order_placed_time: number
  hide_item_quantity_column: number
  hide_item_rate_column: number
  hide_item_total_column: number
  hide_total_without_tax: number
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * General Settings Type Definition
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** General Settings interface - uses number (0/1) for boolean fields to match backend DB */
export interface GeneralSettings {
  outletid?: number
  customize_url_links: string 
  allow_charges_after_bill_print: number
  allow_discount_after_bill_print: number
  allow_discount_before_save: number
  allow_pre_order_tahd: number
  ask_covers: string | {
  dine_in: number
  pickup: number
  delivery: number
  quick_bill: number
}
  ask_covers_captain: number
  ask_custom_order_id_quick_bill: number
  ask_custom_order_type_quick_bill: number
  ask_payment_mode_on_save_bill: number
  ask_waiter: string | { dine_in: number; pickup: number; delivery: number; quick_bill: number }
  ask_otp_change_order_status_order_window: number
  ask_otp_change_order_status_receipt_section: number
  auto_accept_remote_kot: number
  auto_out_of_stock: number
  auto_sync: number
  category_time_for_pos: string
  count_sales_after_midnight: number
  customer_display: string | { media?: string[] }
  customer_mandatory: string | { dine_in: number; pickup: number; delivery: number; quick_bill: number }
  default_ebill_check: number
  default_send_delivery_boy_check: number
  edit_customize_order_number: string
  enable_backup_notification_service: number
  enable_customer_display_access: number
  filter_items_by_order_type: number
  generate_reports_start_close_dates: number
  hide_clear_data_check_logout: number
  hide_item_price_options: number
  hide_load_menu_button: number
  make_cancel_delete_reason_compulsory: number
  make_discount_reason_mandatory: number
  make_free_cancel_bill_reason_mandatory: number
  make_payment_ref_number_mandatory: number
  mandatory_delivery_boy_selection: number
  mark_order_as_transfer_order: number
  online_payment_auto_settle: number 
  order_sync_settings: string | {
  auto_sync_interval: string
  sync_batch_packet_size: string
}
  separate_billing_by_section: number
  set_entered_amount_as_opening: number
  show_alternative_item_report_print: number
  show_clear_sales_report_logout: number
  show_order_no_label_pos: number
  show_payment_history_button: number
  show_remote_kot_option: number
  show_send_payment_link: number
  stock_availability_display: number
  todays_report: string | {
  sales_summary: number
  order_type_summary: number
  payment_type_summary: number
  discount_summary: number
  expense_summary: number
  bill_summary: number
  delivery_boy_summary: number
  waiter_summary: number
  kitchen_department_summary: number
  category_summary: number
  sold_items_summary: number
  cancel_items_summary: number
  wallet_summary: number
  due_payment_received_summary: number
  due_payment_receivable_summary: number
  payment_variance_summary: number
  currency_denominations_summary: number
}
  upi_payment_sound_notification: number
  use_separate_bill_numbers_online: number
  when_send_todays_report: string
  enable_currency_conversion: number
  enable_user_login_validation: number
  allow_closing_shift_despite_bills: number
  show_real_time_kot_bill_notifications: number
  created_by_id?: string
  updated_by_id?: string
  created_at?: string
  updated_at?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Online Orders Settings Type Definition
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Online Orders Settings interface - uses number (0/1) for boolean fields to match backend DB */
export interface OnlineOrdersSettings {
  online_ordersetting_id?: number
  outletid?: number
  show_in_preparation_kds: number
  auto_accept_online_order: number
  customize_order_preparation_time: number
  online_orders_time_delay: number | null
  pull_order_on_accept: number
  show_addons_separately: number
  show_complete_online_order_id: number
  show_online_order_preparation_time: number
  update_food_ready_status_kds: number
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Combined Outlet Billing Settings Type Definition
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Combined Outlet Billing Settings interface */
export interface OutletBillingSettings {
  outletid: number
  outlet_name: string
  outlet_code: string
  hotelid: number
  bill_print_settings: BillPrintSettings | null
  general_settings: GeneralSettings | null
  online_orders_settings: OnlineOrdersSettings | null
  bill_preview_settings: BillPreviewSettings | null
  kot_print_settings: KotPrintSettings | null
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Outlet Settings Type Definition
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Outlet settings interface */
export interface OutletSettings {
  outletid: number
  outlet_name: string
  outlet_code: string
  hotelid: number
  brand_name: string
  send_order_notification: string
  bill_number_length: number
  next_reset_order_number_date: string | null
  next_reset_order_number_days: string
  decimal_points: number
  bill_round_off: boolean
  bill_round_off_to: number
  enable_loyalty: boolean
  multiple_price_setting: boolean
  include_tax_in_invoice?: boolean
  service_charges?: number
  invoice_message?: string
  verify_pos_system_login: boolean
  table_reservation: boolean
  auto_update_pos: boolean
  send_report_email: boolean
  send_report_whatsapp: boolean
  allow_multiple_tax: boolean
  enable_call_center: boolean
  bharatpe_integration: boolean
  phonepe_integration: boolean
  reelo_integration: boolean
  tally_integration: boolean
  sunmi_integration: boolean
  zomato_pay_integration: boolean
  zomato_enabled: boolean
  swiggy_enabled: boolean
  rafeeq_enabled: boolean
  noon_food_enabled: boolean
  magicpin_enabled: boolean
  dotpe_enabled: boolean
  cultfit_enabled: boolean
  ubereats_enabled: boolean
  scooty_enabled: boolean
  dunzo_enabled: boolean
  foodpanda_enabled: boolean
  amazon_enabled: boolean
  talabat_enabled: boolean
  deliveroo_enabled: boolean
  careem_enabled: boolean
  jahez_enabled: boolean
  eazydiner_enabled: boolean
  radyes_enabled: boolean
  goshop_enabled: boolean
  chatfood_enabled: boolean
  jubeat_enabled: boolean
  thrive_enabled: boolean
  fidoo_enabled: boolean
  mrsool_enabled: boolean
  swiggystore_enabled: boolean
  zomatormarket_enabled: boolean
  hungerstation_enabled: boolean
  instashop_enabled: boolean
  eteasy_enabled: boolean
  smiles_enabled: boolean
  toyou_enabled: boolean
  dca_enabled: boolean
  ordable_enabled: boolean
  beanz_enabled: boolean
  cari_enabled: boolean
  the_chefz_enabled: boolean
  keeta_enabled: boolean
  notification_channel: string
  created_at: string
  updated_at: string
  updated_by_id?: string
  default_waiter_id: number | null
  pax: number
  ReverseQtyMode?: boolean
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Outlet Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const OutletService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * Brand Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get brands/hotels for dropdown
   */
  getBrands: (params?: { role_level?: string; hotelid?: number }): Promise<ApiResponse<any[]>> =>
    HttpClient.get<ApiResponse<any[]>>('/outlets/brands', { params }),

  /* ═══════════════════════════════════════════════════════════════════════════
   * Outlet Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all outlets with optional filters
   */
  getOutlets: (params?: {
    brand_id?: number
    hotelid?: number
    role_level?: string
    created_by_id?: number
    outletid?: number
  }): Promise<ApiResponse<Outlet[]>> =>
    HttpClient.get<ApiResponse<Outlet[]>>('/outlets', { params }),

  /**
   * Get outlet by ID
   */
  getOutletById: (id: number): Promise<ApiResponse<Outlet>> =>
    HttpClient.get<ApiResponse<Outlet>>(`/outlets/${id}`),

  /**
   * Add new outlet
   */
  addOutlet: (data: OutletPayload): Promise<ApiResponse<Outlet>> =>
    HttpClient.post<ApiResponse<Outlet>>('/outlets', data),

  /**
   * Update outlet
   */
  updateOutlet: (id: number, data: OutletPayload): Promise<ApiResponse<Outlet>> =>
    HttpClient.put<ApiResponse<Outlet>>(`/outlets/${id}`, data),

  /**
   * Delete outlet
   */
  deleteOutlet: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/outlets/${id}`),

  /**
   * Get outlets for dropdown
   */
  getOutletsForDropdown: (params?: {
    role_level?: string
    hotelid?: number
    brandId?: number
  }): Promise<ApiResponse<Outlet[]>> =>
    HttpClient.get<ApiResponse<Outlet[]>>('/outlets', { params }),

  /* ═══════════════════════════════════════════════════════════════════════════
   * Outlet Settings Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get outlet settings by outlet ID
   */
  getOutletSettings: (outletId: number): Promise<ApiResponse<OutletSettings>> =>
    HttpClient.get<ApiResponse<OutletSettings>>(`/outlets/outlet-settings/${outletId}`),

  /**
   * Update outlet settings
   */
  updateOutletSettings: (outletId: number, data: OutletSettings): Promise<ApiResponse<OutletSettings>> =>
    HttpClient.put<ApiResponse<OutletSettings>>(`/outlets/outlet-settings/${outletId}`, data),

  /* ═══════════════════════════════════════════════════════════════════════════════
   * Bill Preview Settings Operations
   * ═══════════════════════════════════════════════════════════════════════════════ */

  /**
   * Get bill preview settings by outlet ID
   */
  getBillPreviewSettings: (outletId: number): Promise<ApiResponse<BillPreviewSettings>> =>
    HttpClient.get<ApiResponse<BillPreviewSettings>>(`/outlets/bill-preview-settings/${outletId}`),

  /**
   * Update bill preview settings
   */
  updateBillPreviewSettings: (outletId: number, data: BillPreviewSettings): Promise<ApiResponse<BillPreviewSettings>> =>
    HttpClient.put<ApiResponse<BillPreviewSettings>>(`/outlets/bill-preview-settings/${outletId}`, data),

  /* ═══════════════════════════════════════════════════════════════════════════════
   * KOT Print Settings Operations
   * ═══════════════════════════════════════════════════════════════════════════════ */

  /**
   * Get KOT print settings by outlet ID
   */
  getKotPrintSettings: (outletId: number): Promise<ApiResponse<KotPrintSettings>> =>
    HttpClient.get<ApiResponse<KotPrintSettings>>(`/outlets/kot-print-settings/${outletId}`),

  /**
   * Update KOT print settings
   */
  updateKotPrintSettings: (outletId: number, data: KotPrintSettings): Promise<ApiResponse<KotPrintSettings>> =>
    HttpClient.put<ApiResponse<KotPrintSettings>>(`/outlets/kot-print-settings/${outletId}`, data),

  /* ═══════════════════════════════════════════════════════════════════════════════
   * Bill Print Settings Operations
   * ═══════════════════════════════════════════════════════════════════════════════ */

  /**
   * Get bill print settings by outlet ID
   */
  getBillPrintSettings: (outletId: number): Promise<ApiResponse<BillPrintSettings>> =>
    HttpClient.get<ApiResponse<BillPrintSettings>>(`/outlets/bill-print-settings/${outletId}`),

  /**
   * Update bill print settings
   */
  updateBillPrintSettings: (outletId: number, data: BillPrintSettings): Promise<ApiResponse<BillPrintSettings>> =>
    HttpClient.put<ApiResponse<BillPrintSettings>>(`/outlets/bill-print-settings/${outletId}`, data),

  /* ═══════════════════════════════════════════════════════════════════════════════
   * General Settings Operations
   * ═══════════════════════════════════════════════════════════════════════════════ */

  /**
   * Get general settings by outlet ID
   */
  getGeneralSettings: (outletId: number): Promise<ApiResponse<GeneralSettings>> =>
    HttpClient.get<ApiResponse<GeneralSettings>>(`/outlets/general-settings/${outletId}`),

  /**
   * Update general settings
   */
  updateGeneralSettings: (outletId: number, data: GeneralSettings): Promise<ApiResponse<GeneralSettings>> =>
    HttpClient.put<ApiResponse<GeneralSettings>>(`/outlets/general-settings/${outletId}`, data),

  /* ═══════════════════════════════════════════════════════════════════════════════
   * Online Orders Settings Operations
   * ═══════════════════════════════════════════════════════════════════════════════ */

  /**
   * Get online orders settings by outlet ID
   */
  getOnlineOrdersSettings: (outletId: number): Promise<ApiResponse<OnlineOrdersSettings>> =>
    HttpClient.get<ApiResponse<OnlineOrdersSettings>>(`/outlets/online-orders-settings/${outletId}`),

  /**
   * Update online orders settings
   */
  updateOnlineOrdersSettings: (outletId: number, data: OnlineOrdersSettings): Promise<ApiResponse<OnlineOrdersSettings>> =>
    HttpClient.put<ApiResponse<OnlineOrdersSettings>>(`/outlets/online-orders-settings/${outletId}`, data),

  /* ═══════════════════════════════════════════════════════════════════════════════
   * Get All Settings (Combined)
   * ═══════════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all settings for an outlet (combined)
   */
  getOutletBillingSettings: (outletId: number): Promise<ApiResponse<OutletBillingSettings>> =>
    HttpClient.get<ApiResponse<OutletBillingSettings>>(`/outlets/settings/${outletId}`)
}

export { OutletService }

export default OutletService
