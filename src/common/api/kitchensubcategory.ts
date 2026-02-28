/**
 * Kitchen Sub Category Service - Clean API service for kitchen sub category management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Kitchen Sub Category information */
export interface KitchenSubCategory {
  kitchensubcategoryid: number
  Kitchen_sub_category: string
  kitchenmaingroupid: string
  kitchencategoryid: number
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/** Kitchen Sub Category payload for create/update */
export interface KitchenSubCategoryPayload {
  kitchensubcategoryid?: number
  Kitchen_sub_category: string
  kitchenmaingroupid: string
  kitchencategoryid: number
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Kitchen Sub Category Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const KitchenSubCategoryService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all kitchen sub categories with optional search
   */
  list: (params?: { q?: string }): Promise<ApiResponse<KitchenSubCategory[]>> =>
    HttpClient.get<ApiResponse<KitchenSubCategory[]>>('/kitchensubcategory', { params }),

  /**
   * Create a new kitchen sub category
   */
  create: (payload: KitchenSubCategoryPayload): Promise<ApiResponse<KitchenSubCategory>> =>
    HttpClient.post<ApiResponse<KitchenSubCategory>>('/kitchensubcategory', payload),

  /**
   * Update an existing kitchen sub category
   */
  update: (id: number, payload: KitchenSubCategoryPayload): Promise<ApiResponse<KitchenSubCategory>> =>
    HttpClient.put<ApiResponse<KitchenSubCategory>>(`/kitchensubcategory/${id}`, payload),

  /**
   * Delete a kitchen sub category
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/kitchensubcategory/${id}`)
}

export default KitchenSubCategoryService
