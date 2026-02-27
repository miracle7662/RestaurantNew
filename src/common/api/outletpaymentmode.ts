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

/** Payment Mode data from database (with mode_name from join) */
export interface PaymentModeData {
  id: number
  outletid: number
  hotelid: number
  paymenttypeid: number
  sequence?: number
  is_active: number | null
  created_at?: string
  updated_at?: string
  mode_name: string
}

/** Payment Type information */
export interface PaymentTypeInfo {
  paymenttypeid: number
  mode_name: string
}

/** List params for payment modes */
export interface PaymentModeListParams {
  q?: string
  outletid?: string
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
  list: (params?: PaymentModeListParams): Promise<ApiResponse<PaymentModeData[]>> =>
    HttpClient.get<ApiResponse<PaymentModeData[]>>('/payment-modes', { params }),

  /**
   * Create a new outlet payment mode
   */
  create: (payload: any): Promise<ApiResponse<PaymentModeData>> =>
    HttpClient.post<ApiResponse<PaymentModeData>>('/payment-modes', payload),

  /**
   * Update an existing outlet payment mode
   */
  update: (id: number, payload: any): Promise<ApiResponse<PaymentModeData>> =>
    HttpClient.put<ApiResponse<PaymentModeData>>(`/payment-modes/${id}`, payload),

  /**
   * Delete an outlet payment mode
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/payment-modes/${id}`),

  /**
   * Get all payment types (master list)
   * Now returns ApiResponse with data array
   */
  types: (): Promise<ApiResponse<PaymentTypeInfo[]>> =>
    HttpClient.get<ApiResponse<PaymentTypeInfo[]>>('/payment-modes/types')
}

export default OutletPaymentModeService
