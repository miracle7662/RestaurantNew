/**
 * Restaurant Tax Master Service - Clean API service for restaurant tax master management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Restaurant Tax Master information */
export interface RestTaxMaster {
  taxmasterid: number
  tax_name: string
  tax_percentage: number
  tax_type?: string
  hotelid: number
  outletid?: number
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/** Restaurant Tax Master payload for create/update */
export interface RestTaxMasterPayload {
  taxmasterid?: number
  tax_name: string
  tax_percentage: number
  tax_type?: string
  hotelid: number
  outletid?: number
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Restaurant Tax Master Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const RestTaxMasterService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all restaurant tax masters with optional search
   */
  list: (params?: { q?: string }): Promise<ApiResponse<RestTaxMaster[]>> =>
    HttpClient.get<ApiResponse<RestTaxMaster[]>>('/resttaxmaster', { params }),

  /**
   * Create a new restaurant tax master
   */
  create: (payload: RestTaxMasterPayload): Promise<ApiResponse<RestTaxMaster>> =>
    HttpClient.post<ApiResponse<RestTaxMaster>>('/resttaxmaster', payload),

  /**
   * Update an existing restaurant tax master
   */
  update: (id: number, payload: RestTaxMasterPayload): Promise<ApiResponse<RestTaxMaster>> =>
    HttpClient.put<ApiResponse<RestTaxMaster>>(`/resttaxmaster/${id}`, payload),

  /**
   * Delete a restaurant tax master
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/resttaxmaster/${id}`)
}

export default RestTaxMasterService
