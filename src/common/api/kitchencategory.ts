/**
 * Kitchen Category Service - Clean API service for kitchen category management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Kitchen Category information */
export interface KitchenCategory {
  kitchencategoryid: number
  category_name: string
  category_code: string
  kitchen_maingroupid: number
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/** Kitchen Category payload for create/update */
export interface KitchenCategoryPayload {
  kitchencategoryid?: number
  category_name: string
  category_code: string
  kitchen_maingroupid: number
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Kitchen Category Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const KitchenCategoryService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all kitchen categories with optional search
   */
  list: (params?: { q?: string }): Promise<ApiResponse<KitchenCategory[]>> =>
    HttpClient.get<ApiResponse<KitchenCategory[]>>('/kitchencategory', { params }),

  /**
   * Create a new kitchen category
   */
  create: (payload: KitchenCategoryPayload): Promise<ApiResponse<KitchenCategory>> =>
    HttpClient.post<ApiResponse<KitchenCategory>>('/kitchencategory', payload),

  /**
   * Update an existing kitchen category
   */
  update: (id: number, payload: KitchenCategoryPayload): Promise<ApiResponse<KitchenCategory>> =>
    HttpClient.put<ApiResponse<KitchenCategory>>(`/kitchencategory/${id}`, payload),

  /**
   * Delete a kitchen category
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/kitchencategory/${id}`)
}

export default KitchenCategoryService
