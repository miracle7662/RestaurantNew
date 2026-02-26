/**
 * Unit Master Service - Clean API service for unit master management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Unit Master information */
export interface UnitMaster {
  unitid: number
  unit_name: string
  unit_code: string
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/** Unit Master payload for create/update */
export interface UnitMasterPayload {
  unitid?: number
  unit_name: string
  unit_code: string
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Unit Master Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const UnitmasterService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all unit masters with optional search
   */
  list: (params?: { q?: string }): Promise<ApiResponse<UnitMaster[]>> =>
    HttpClient.get<ApiResponse<UnitMaster[]>>('/unitmaster', { params }),

  /**
   * Create a new unit master
   */
  create: (payload: UnitMasterPayload): Promise<ApiResponse<UnitMaster>> =>
    HttpClient.post<ApiResponse<UnitMaster>>('/unitmaster', payload),

  /**
   * Update an existing unit master
   */
  update: (id: number, payload: UnitMasterPayload): Promise<ApiResponse<UnitMaster>> =>
    HttpClient.put<ApiResponse<UnitMaster>>(`/unitmaster/${id}`, payload),

  /**
   * Delete a unit master
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/unitmaster/${id}`)
}

export default UnitmasterService
