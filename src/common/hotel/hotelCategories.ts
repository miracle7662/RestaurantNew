/**
 * Hotel Category Service - Clean API service for hotel category management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Hotel Category information */
export interface HotelCategory {
  hotelcategoryid: number
  category_type: string
  status: number
  created_by_id: number
  created_date: string
  updated_by_id: number
  updated_date: string
}

/** Hotel Category payload for create/update */
export interface HotelCategoryPayload {
  hotelcategoryid?: number
  category_type: string
  status: number
  created_by_id?: number
  created_date?: string
  updated_by_id?: number
  updated_date?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Hotel Category Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const HotelCategoryService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all hotel categories with optional search
   */
  list: (params?: { q?: string }): Promise<ApiResponse<HotelCategory[]>> =>
    HttpClient.get<ApiResponse<HotelCategory[]>>('/hotel-categories', { params }),

  /**
   * Create a new hotel category
   */
  create: (payload: HotelCategoryPayload): Promise<ApiResponse<HotelCategory>> =>
    HttpClient.post<ApiResponse<HotelCategory>>('/hotel-categories', payload),

  /**
   * Update an existing hotel category
   */
  update: (id: number, payload: HotelCategoryPayload): Promise<ApiResponse<HotelCategory>> =>
    HttpClient.put<ApiResponse<HotelCategory>>(`/hotel-categories/${id}`, payload),

  /**
   * Delete a hotel category
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/hotel-categories/${id}`)
}

export default HotelCategoryService