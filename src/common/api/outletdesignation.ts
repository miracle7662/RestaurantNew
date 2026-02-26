/**
 * Outlet Designation Service - Clean API service for outlet designation management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Outlet Designation information */
export interface OutletDesignation {
  designationid: number
  designation_name: string
  outletid: number
  hotelid: number
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/** Outlet Designation payload for create/update */
export interface OutletDesignationPayload {
  designationid?: number
  designation_name: string
  outletid: number
  hotelid: number
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Outlet Designation Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const OutletDesignationService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all outlet designations with optional search
   */
  list: (params?: { q?: string }): Promise<ApiResponse<OutletDesignation[]>> =>
    HttpClient.get<ApiResponse<OutletDesignation[]>>('/outlet-designation', { params }),

  /**
   * Create a new outlet designation
   */
  create: (payload: OutletDesignationPayload): Promise<ApiResponse<OutletDesignation>> =>
    HttpClient.post<ApiResponse<OutletDesignation>>('/outlet-designation', payload),

  /**
   * Update an existing outlet designation
   */
  update: (id: number, payload: OutletDesignationPayload): Promise<ApiResponse<OutletDesignation>> =>
    HttpClient.put<ApiResponse<OutletDesignation>>(`/outlet-designation/${id}`, payload),

  /**
   * Delete an outlet designation
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/outlet-designation/${id}`)
}

export default OutletDesignationService
