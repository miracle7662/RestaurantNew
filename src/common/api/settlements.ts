/**
 * Settlement Service - Clean API service for settlement management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Settlement information */
export interface Settlement {
  settlementid: number
  txnid: number
  billno?: string
  outletid: number
  hotelid: number
  settlement_amount: number
  settlement_date?: string
  payment_type?: string
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/** Settlement payload for create/update */
export interface SettlementPayload {
  settlementid?: number
  txnid: number
  billno?: string
  outletid: number
  hotelid: number
  settlement_amount: number
  settlement_date?: string
  payment_type?: string
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Settlement Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const SettlementService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all settlements with optional filters
   */
  list: (params?: { q?: string; outletid?: number; hotelid?: number }): Promise<ApiResponse<Settlement[]>> =>
    HttpClient.get<ApiResponse<Settlement[]>>('/settlement', { params }),

  /**
   * Get settlement by ID
   */
  getById: (id: number): Promise<ApiResponse<Settlement>> =>
    HttpClient.get<ApiResponse<Settlement>>(`/settlement/${id}`),

  /**
   * Create a new settlement
   */
  create: (payload: SettlementPayload): Promise<ApiResponse<Settlement>> =>
    HttpClient.post<ApiResponse<Settlement>>('/settlement', payload),

  /**
   * Update an existing settlement
   */
  update: (id: number, payload: SettlementPayload): Promise<ApiResponse<Settlement>> =>
    HttpClient.put<ApiResponse<Settlement>>(`/settlement/${id}`, payload),

  /**
   * Delete a settlement
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/settlement/${id}`)
}

export default SettlementService
