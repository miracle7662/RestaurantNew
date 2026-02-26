/**
 * Outlet Payment Mode Service - Clean API service for outlet payment mode management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Outlet Payment Mode information */
export interface OutletPaymentMode {
  id: number
  outletid: number
  paymentmodeid: number
  payment_mode_name?: string
  status: number
  is_default?: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/** Outlet Payment Mode payload for create/update */
export interface OutletPaymentModePayload {
  id?: number
  outletid: number
  paymentmodeid: number
  status: number
  is_default?: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Outlet Payment Mode Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const OutletPaymentModeService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all outlet payment modes with optional search
   */
  list: (params?: { q?: string }): Promise<ApiResponse<OutletPaymentMode[]>> =>
    HttpClient.get<ApiResponse<OutletPaymentMode[]>>('/outlet-payment-mode', { params }),

  /**
   * Create a new outlet payment mode
   */
  create: (payload: OutletPaymentModePayload): Promise<ApiResponse<OutletPaymentMode>> =>
    HttpClient.post<ApiResponse<OutletPaymentMode>>('/outlet-payment-mode', payload),

  /**
   * Update an existing outlet payment mode
   */
  update: (id: number, payload: OutletPaymentModePayload): Promise<ApiResponse<OutletPaymentMode>> =>
    HttpClient.put<ApiResponse<OutletPaymentMode>>(`/outlet-payment-mode/${id}`, payload),

  /**
   * Delete an outlet payment mode
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/outlet-payment-mode/${id}`)
}

export default OutletPaymentModeService
