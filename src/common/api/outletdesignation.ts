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
  Designation: string
  marketid: number
  hotelid: number
  status: number
  created_by_id: number
  created_date: string
  updated_by_id: number
  updated_date: string
}

/** Outlet Designation payload for create/update */
export interface OutletDesignationPayload {
  designationid?: number
  Designation: string
  marketid?: number
  hotelid?: number
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
    HttpClient.get<ApiResponse<OutletDesignation[]>>('/Designation', { params }),

  /**
   * Create a new outlet designation
   */
  create: (payload: OutletDesignationPayload): Promise<ApiResponse<OutletDesignation>> =>
    HttpClient.post<ApiResponse<OutletDesignation>>('/Designation', payload),

  /**
   * Update an existing outlet designation
   */
  update: (id: number, payload: OutletDesignationPayload): Promise<ApiResponse<OutletDesignation>> =>
    HttpClient.put<ApiResponse<OutletDesignation>>(`/Designation/${id}`, payload),

  /**
   * Delete an outlet designation
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/Designation/${id}`)
}

export default OutletDesignationService
