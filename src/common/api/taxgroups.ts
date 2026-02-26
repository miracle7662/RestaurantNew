/**
 * Tax Group Service - Clean API service for tax group management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Tax Group information */
export interface TaxGroup {
  taxgroupid: number
  taxgroup_name: string
  cgst_rate: number
  sgst_rate: number
  igst_rate: number
  cess_rate: number
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/** Tax Group payload for create/update */
export interface TaxGroupPayload {
  taxgroupid?: number
  taxgroup_name: string
  cgst_rate: number
  sgst_rate: number
  igst_rate: number
  cess_rate: number
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Tax Group Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const TaxGroupService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all tax groups with optional search
   */
  list: (params?: { q?: string }): Promise<ApiResponse<TaxGroup[]>> =>
    HttpClient.get<ApiResponse<TaxGroup[]>>('/taxgroup', { params }),

  /**
   * Create a new tax group
   */
  create: (payload: TaxGroupPayload): Promise<ApiResponse<TaxGroup>> =>
    HttpClient.post<ApiResponse<TaxGroup>>('/taxgroup', payload),

  /**
   * Update an existing tax group
   */
  update: (id: number, payload: TaxGroupPayload): Promise<ApiResponse<TaxGroup>> =>
    HttpClient.put<ApiResponse<TaxGroup>>(`/taxgroup/${id}`, payload),

  /**
   * Delete a tax group
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/taxgroup/${id}`)
}

export default TaxGroupService
