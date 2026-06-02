/**
 * Hotel Type Service - Clean API service for hotel type management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Hotel type information */
export interface HotelType {
  hoteltypeid: number
  hotel_type: string
  status: number
  created_by_id: number
  created_date: string
  updated_by_id: number
  updated_date: string
}

/** Hotel type payload for create/update */
export interface HotelTypePayload {
  hoteltypeid?: number
  hotel_type: string
  status: number
  created_by_id?: number
  created_date?: string
  updated_by_id?: number
  updated_date?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Hotel Type Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const HotelTypeService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all hotel types with optional search
   */
  list: (params?: { q?: string }): Promise<ApiResponse<HotelType[]>> =>
    HttpClient.get<ApiResponse<HotelType[]>>('/hoteltypes', { params }),

  /**
   * Create a new hotel type
   */
  create: (payload: HotelTypePayload): Promise<ApiResponse<HotelType>> =>
    HttpClient.post<ApiResponse<HotelType>>('/hoteltypes', payload),

  /**
   * Update an existing hotel type
   */
  update: (id: number, payload: HotelTypePayload): Promise<ApiResponse<HotelType>> =>
    HttpClient.put<ApiResponse<HotelType>>(`/hoteltypes/${id}`, payload),

  /**
   * Delete a hotel type
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/hoteltypes/${id}`)
}

export default HotelTypeService