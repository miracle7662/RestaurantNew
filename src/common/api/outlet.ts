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
    HttpClient.get<ApiResponse<any[]>>('/api/outlets/brands', { params }),

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
    HttpClient.get<ApiResponse<Outlet[]>>('/api/outlets', { params }),

  /**
   * Get outlet by ID
   */
  getOutletById: (id: number): Promise<ApiResponse<Outlet>> =>
    HttpClient.get<ApiResponse<Outlet>>(`/api/outlets/${id}`),

  /**
   * Add new outlet
   */
  addOutlet: (data: OutletPayload): Promise<ApiResponse<Outlet>> =>
    HttpClient.post<ApiResponse<Outlet>>('/api/outlets', data),

  /**
   * Update outlet
   */
  updateOutlet: (id: number, data: OutletPayload): Promise<ApiResponse<Outlet>> =>
    HttpClient.put<ApiResponse<Outlet>>(`/api/outlets/${id}`, data),

  /**
   * Delete outlet
   */
  deleteOutlet: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/api/outlets/${id}`),

  /**
   * Get outlets for dropdown
   */
  getOutletsForDropdown: (params?: {
    role_level?: string
    hotelid?: number
    brandId?: number
  }): Promise<ApiResponse<Outlet[]>> =>
    HttpClient.get<ApiResponse<Outlet[]>>('/api/outlets', { params })
}

export default OutletService
