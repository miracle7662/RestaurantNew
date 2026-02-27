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

/** Hotel Type information */
export interface HotelType {
  hoteltypeid: number
  hotelid: number
  hotel_type: string
  status: number
  created_by_id: number
  created_date: string
  updated_by_id: number
  updated_date: string
}

/** Hotel Type payload for create/update */
export interface HotelTypePayload {
  hoteltypeid?: number;           // optional for create
  hotelid: number;
  hotel_type: string;
  status: number;
  created_by_id?: number;         // optional
  created_date?: string;          // optional
  updated_by_id?: number;         // optional
  updated_date?: string;          // optional
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
    HttpClient.get<ApiResponse<HotelType[]>>('/hoteltype', { params }),

  /**
   * Create a new hotel type
   */
  create: (payload: HotelTypePayload): Promise<ApiResponse<HotelType>> =>
    HttpClient.post<ApiResponse<HotelType>>('/hoteltype', payload),

  /**
   * Update an existing hotel type
   */
  update: (id: number, payload: HotelTypePayload): Promise<ApiResponse<HotelType>> =>
    HttpClient.put<ApiResponse<HotelType>>(`/hoteltype/${id}`, payload),

  /**
   * Delete a hotel type
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/hoteltype/${id}`)
}

export default HotelTypeService
