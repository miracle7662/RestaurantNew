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
  list: (params?: { outletid?: number; hotelid?: number; q?: string }): Promise<OutletPaymentMode[]> =>
    HttpClient.get<OutletPaymentMode[]>('/payment-modes', { params }),

  /**
   * Create a new outlet payment mode
   */
  create: (payload: OutletPaymentModePayload): Promise<{ id: number }> =>
    HttpClient.post<{ id: number }>('/payment-modes', payload),

  /**
   * Update an existing outlet payment mode
   */
  update: (id: number, payload: OutletPaymentModePayload): Promise<{ message: string }> =>
    HttpClient.put<{ message: string }>(`/payment-modes/${id}`, payload),

  /**
   * Delete an outlet payment mode
   */
  remove: (id: number): Promise<{ message: string }> =>
    HttpClient.delete<{ message: string }>(`/payment-modes/${id}`),

  /**
   * Get all payment types (master list)
   * Note: This endpoint returns an array directly (not wrapped), so we handle it specially
   */
  types: (): Promise<{ paymenttypeid: number; mode_name: string }[]> =>
    HttpClient.get<{ paymenttypeid: number; mode_name: string }[]>('/payment-modes/types')
}

export default OutletPaymentModeService
