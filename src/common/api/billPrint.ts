/**
 * Bill Print Service - API service for bill printing operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Bill printer settings response */
export interface BillPrinterSettings {
  printer_name: string | null
  [key: string]: any
}

/** Outlet details response */
export interface OutletDetails {
  brand_name?: string
  hotel_name?: string
  outlet_name?: string
  outlet_address?: string
  outlet_phone?: string
  email?: string
  website?: string
  fssai_no?: string
  hsn?: string
  [key: string]: any
}

/** Bill preview settings */
export interface BillPreviewSettings {
  enabled_bill_section?: boolean
  show_logo_bill?: boolean
  show_brand_name_bill?: boolean
  show_outlet_name_bill?: boolean
  show_phone_on_bill?: boolean
  show_item_hsn_code_bill?: boolean
  show_bill_no_bill?: boolean
  show_bill_number_prefix_bill?: boolean
  show_kot_number_bill?: boolean
  show_order_id_bill?: boolean
  mask_order_id?: boolean
  show_date_bill?: boolean
  show_order_placed_time?: boolean
  show_waiter_bill?: boolean
  show_captain_bill?: boolean
  show_covers_bill?: boolean
  show_bill_print_count?: boolean
  show_customer_bill?: boolean
  show_customer_gst_bill?: boolean
  show_customer_address_pickup_bill?: boolean
  order_type_dine_in?: boolean
  order_type_pickup?: boolean
  order_type_delivery?: boolean
  order_type_quick_bill?: boolean
  bill_title_dine_in?: boolean
  bill_title_pickup?: boolean
  bill_title_delivery?: boolean
  bill_title_quick_bill?: boolean
  table_name_dine_in?: boolean
  table_name_pickup?: boolean
  table_name_delivery?: boolean
  table_name_quick_bill?: boolean
  print_bill_both_languages?: boolean
  show_alt_item_title_bill?: boolean
  show_alt_name_bill?: boolean
  hide_item_quantity_column?: boolean
  hide_item_rate_column?: boolean
  hide_item_total_column?: boolean
  show_items_sequence_bill?: boolean
  show_item_note_bill?: boolean
  modifier_default_option_bill?: boolean
  hide_total_without_tax?: boolean
  show_tax_charge_bill?: boolean
  show_discount_reason_bill?: boolean
  show_order_note_bill?: boolean
  payment_mode_dine_in?: boolean
  payment_mode_pickup?: boolean
  payment_mode_delivery?: boolean
  payment_mode_quick_bill?: boolean
  show_default_payment?: boolean
  show_custom_qr_codes_bill?: boolean
  show_ebill_invoice_qrcode?: boolean
  show_zatca_invoice_qr?: boolean
  show_bill_amount_words?: boolean
  show_customer_paid_amount?: boolean
  show_due_amount_bill?: boolean
  dine_in_kot_no?: string
  field1?: string
  field2?: string
  field3?: string
  field4?: string
  footer_note?: string
  note?: string
  email?: string
  website?: string
  fssai_no?: string
  hsn?: string
  [key: string]: any
}

/** Bill print settings */
export interface BillPrintSettings {
  [key: string]: any
}

/** Bill settings combined response */
export interface BillSettingsResponse {
  billPreviewSettings: BillPreviewSettings
  billPrintSettings: BillPrintSettings
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Bill Print Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const BillPrintService = {
  /* ═══════════════════════════════════════════════════════════════════════════
   * Printer Settings
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get bill printer settings for an outlet
   */
  getBillPrinterSettings: (outletId: number): Promise<ApiResponse<BillPrinterSettings>> =>
    HttpClient.get<ApiResponse<BillPrinterSettings>>(`/settings/bill-printer-settings/${outletId}`),

  /* ═══════════════════════════════════════════════════════════════════════════
   * Outlet Details
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get outlet details by ID
   */
  getOutletDetails: (outletId: number): Promise<ApiResponse<OutletDetails>> =>
    HttpClient.get<ApiResponse<OutletDetails>>(`/outlets/${outletId}`),

  /* ═══════════════════════════════════════════════════════════════════════════
   * Bill Settings
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get bill preview settings for an outlet
   */
  getBillPreviewSettings: (outletId: number): Promise<ApiResponse<BillPreviewSettings>> =>
    HttpClient.get<ApiResponse<BillPreviewSettings>>(`/outlets/bill-preview-settings/${outletId}`),

  /**
   * Get bill print settings for an outlet
   */
  getBillPrintSettings: (outletId: number): Promise<ApiResponse<BillPrintSettings>> =>
    HttpClient.get<ApiResponse<BillPrintSettings>>(`/outlets/bill-print-settings/${outletId}`),

  /**
   * Get all bill settings (preview + print) for an outlet
   */
  getBillSettings: (outletId: number): Promise<ApiResponse<BillSettingsResponse>> =>
    HttpClient.get<ApiResponse<BillSettingsResponse>>(`/outlets/bill-settings/${outletId}`)
}

export default BillPrintService
