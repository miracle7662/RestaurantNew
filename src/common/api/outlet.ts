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

/** Bill Preview Settings interface */
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
  show_upi_qr: boolean
  enabled_bar_section: boolean
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

/** KOT Print Settings interface */
export interface KotPrintSettings {
  kot_printsetting_id?: number
  outletid?: number
  customer_on_kot_dine_in: boolean
  customer_on_kot_pickup: boolean
  customer_on_kot_delivery: boolean
  customer_on_kot_quick_bill: boolean
  customer_kot_display_option: string
  group_kot_items_by_category: boolean
  hide_table_name_quick_bill: boolean
  show_new_order_tag: boolean
  new_order_tag_label: string
  show_running_order_tag: boolean
  running_order_tag_label: string
  dine_in_kot_no: string
  pickup_kot_no: string
  delivery_kot_no: string
  quick_bill_kot_no: string
  modifier_default_option: boolean
  print_kot_both_languages: boolean
  show_alternative_item: boolean
  show_captain_username: boolean
  show_covers_as_guest: boolean
  show_item_price: boolean
  show_kot_no_quick_bill: boolean
  show_kot_note: boolean
  show_online_order_otp: boolean
  show_order_id_quick_bill: boolean
  show_order_id_online_order: boolean
  show_order_no_quick_bill_section: boolean
  show_order_type_symbol: boolean
  show_store_name: boolean
  show_terminal_username: boolean
  show_username: boolean
  show_waiter: boolean
  hide_item_Amt_column: boolean
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Bill Print Settings Type Definition
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Bill Print Settings interface */
export interface BillPrintSettings {
  billprintsetting_id?: number
  outletid?: number
  bill_title_dine_in: boolean
  bill_title_pickup: boolean
  bill_title_delivery: boolean
  bill_title_quick_bill: boolean
  mask_order_id: boolean
  modifier_default_option_bill: boolean
  print_bill_both_languages: boolean
  show_alt_item_title_bill: boolean
  show_alt_name_bill: boolean
  show_bill_amount_words: boolean
  show_bill_no_bill: boolean
  show_bill_number_prefix_bill: boolean
  show_bill_print_count: boolean
  show_brand_name_bill: boolean
  show_captain_bill: boolean
  show_covers_bill: boolean
  show_custom_qr_codes_bill: boolean
  show_customer_gst_bill: boolean
  show_customer_bill: boolean
  show_customer_paid_amount: boolean
  show_date_bill: boolean
  show_default_payment: boolean
  show_discount_reason_bill: boolean
  show_due_amount_bill: boolean
  show_ebill_invoice_qrcode: boolean
  show_item_hsn_code_bill: boolean
  show_item_level_charges_separately: boolean
  show_item_note_bill: boolean
  show_items_sequence_bill: boolean
  show_kot_number_bill: boolean
  show_logo_bill: boolean
  show_order_id_bill: boolean
  show_order_no_bill: boolean
  show_order_note_bill: boolean
  order_type_dine_in: boolean
  order_type_pickup: boolean
  order_type_delivery: boolean
  order_type_quick_bill: boolean
  show_outlet_name_bill: boolean
  payment_mode_dine_in: boolean
  payment_mode_pickup: boolean
  payment_mode_delivery: boolean
  payment_mode_quick_bill: boolean
  table_name_dine_in: boolean
  table_name_pickup: boolean
  table_name_delivery: boolean
  table_name_quick_bill: boolean
  show_tax_charge_bill: boolean
  show_username_bill: boolean
  show_waiter_bill: boolean
  show_zatca_invoice_qr: boolean
  show_customer_address_pickup_bill: boolean
  show_order_placed_time: boolean
  hide_item_quantity_column: boolean
  hide_item_rate_column: boolean
  hide_item_total_column: boolean
  hide_total_without_tax: boolean
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * General Settings Type Definition
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** General Settings interface */
export interface GeneralSettings {
  outletid?: number
  customize_url_links: string 
  allow_charges_after_bill_print: boolean
  allow_discount_after_bill_print: boolean
  allow_discount_before_save: boolean
  allow_pre_order_tahd: boolean
  ask_covers: string | { dineIn?: boolean; pickup?: boolean; delivery?: boolean; quickBill?: boolean }
  ask_covers_captain: boolean
  ask_custom_order_id_quick_bill: boolean
  ask_custom_order_type_quick_bill: boolean
  ask_payment_mode_on_save_bill: boolean
  ask_waiter: string | { dineIn?: boolean; pickup?: boolean; delivery?: boolean; quickBill?: boolean }
  ask_otp_change_order_status_order_window: boolean
  ask_otp_change_order_status_receipt_section: boolean
  auto_accept_remote_kot: boolean
  auto_out_of_stock: boolean
  auto_sync: boolean
  category_time_for_pos: string
  count_sales_after_midnight: boolean
  customer_display: string | { media?: string[] }
  customer_mandatory: string | { dineIn?: boolean; pickup?: boolean; delivery?: boolean; quickBill?: boolean }
  default_ebill_check: boolean
  default_send_delivery_boy_check: boolean
  edit_customize_order_number: string
  enable_backup_notification_service: boolean
  enable_customer_display_access: boolean
  filter_items_by_order_type: boolean
  generate_reports_start_close_dates: boolean
  hide_clear_data_check_logout: boolean
  hide_item_price_options: boolean
  hide_load_menu_button: boolean
  make_cancel_delete_reason_compulsory: boolean
  make_discount_reason_mandatory: boolean
  make_free_cancel_bill_reason_mandatory: boolean
  make_payment_ref_number_mandatory: boolean
  mandatory_delivery_boy_selection: boolean
  mark_order_as_transfer_order: boolean
  online_payment_auto_settle: boolean 
  order_sync_settings: string | { autoSyncInterval?: string; syncBatchPacketSize?: string }
  separate_billing_by_section: boolean
  set_entered_amount_as_opening: boolean
  show_alternative_item_report_print: boolean
  show_clear_sales_report_logout: boolean
  show_order_no_label_pos: boolean
  show_payment_history_button: boolean
  show_remote_kot_option: boolean
  show_send_payment_link: boolean
  stock_availability_display: boolean
  todays_report: string | {
    salesSummary?: boolean
    orderTypeSummary?: boolean
    paymentTypeSummary?: boolean
    discountSummary?: boolean
    expenseSummary?: boolean
    billSummary?: boolean
    deliveryBoySummary?: boolean
    waiterSummary?: boolean
    kitchenDepartmentSummary?: boolean
    categorySummary?: boolean
    soldItemsSummary?: boolean
    cancelItemsSummary?: boolean
    walletSummary?: boolean
    duePaymentReceivedSummary?: boolean
    duePaymentReceivableSummary?: boolean
    paymentVarianceSummary?: boolean
    currencyDenominationsSummary?: boolean
  }
  upi_payment_sound_notification: boolean
  use_separate_bill_numbers_online: boolean
  when_send_todays_report: string
  enable_currency_conversion: boolean
  enable_user_login_validation: boolean
  allow_closing_shift_despite_bills: boolean
  show_real_time_kot_bill_notifications: boolean
  created_at?: string
  updated_at?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Online Orders Settings Type Definition
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Online Orders Settings interface */
export interface OnlineOrdersSettings {
  online_ordersetting_id?: number
  outletid?: number
  show_in_preparation_kds: boolean
  auto_accept_online_order: boolean
  customize_order_preparation_time: boolean
  online_orders_time_delay: number | null
  pull_order_on_accept: boolean
  show_addons_separately: boolean
  show_complete_online_order_id: boolean
  show_online_order_preparation_time: boolean
  update_food_ready_status_kds: boolean
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



export default OutletService
