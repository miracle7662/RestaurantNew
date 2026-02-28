 /**
 * Kitchen Main Group Service - Clean API service for kitchen main group management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Kitchen Main Group information */
export interface KitchenMainGroup {
  kitchenmaingroupid: number
  Kitchen_main_Group: string
  code: string
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/** Kitchen Main Group payload for create/update */
export interface KitchenMainGroupPayload {
  kitchenmaingroupid?: number
  Kitchen_main_Group: string
  code: string
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Kitchen Main Group Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const KitchenMainGroupService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all kitchen main groups with optional search
   */
  list: (params?: { q?: string }): Promise<ApiResponse<KitchenMainGroup[]>> =>
    HttpClient.get<ApiResponse<KitchenMainGroup[]>>('/kitchenmaingroup', { params }),

  /**
   * Create a new kitchen main group
   */
  create: (payload: KitchenMainGroupPayload): Promise<ApiResponse<KitchenMainGroup>> =>
    HttpClient.post<ApiResponse<KitchenMainGroup>>('/kitchenmaingroup', payload),

  /**
   * Update an existing kitchen main group
   */
  update: (id: number, payload: KitchenMainGroupPayload): Promise<ApiResponse<KitchenMainGroup>> =>
    HttpClient.put<ApiResponse<KitchenMainGroup>>(`/kitchenmaingroup/${id}`, payload),

  /**
   * Delete a kitchen main group
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/kitchenmaingroup/${id}`)
}

export default KitchenMainGroupService
