/**
 * Hotel Service - Clean API service for hotel management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Hotel information */
export interface Hotel {
  hotelid: number
  hotel_name: string
  short_name: string
  marketid: number
  phone: string
  email: string
  fssai_no: string
  trn_gstno: string
  panno: string
  website: string
  address: string
  stateid: number
  cityid: number
  hoteltypeid: number
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/** Hotel payload for create/update */
export interface HotelPayload {
  hotelid?: number
  hotel_name: string
  short_name: string
  marketid: number
  phone: string
  email: string
  fssai_no: string
  trn_gstno: string
  panno: string
  website: string
  address: string
  stateid: number
  cityid: number
  hoteltypeid: number
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Hotel Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const HotelService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all hotels with optional filters
   */
  list: (params?: { role_level?: string; hotelid?: string; q?: string }): Promise<ApiResponse<Hotel[]>> =>
    HttpClient.get<ApiResponse<Hotel[]>>('/HotelMasters', { params }),

  /**
   * Get hotel by ID
   */
  get: (id: number): Promise<ApiResponse<Hotel>> =>
    HttpClient.get<ApiResponse<Hotel>>(`/HotelMasters/${id}`),

  /**
   * Create a new hotel
   */
  create: (payload: HotelPayload): Promise<ApiResponse<Hotel>> =>
    HttpClient.post<ApiResponse<Hotel>>('/HotelMasters', payload),

  /**
   * Update an existing hotel
   */
  update: (id: number, payload: HotelPayload): Promise<ApiResponse<Hotel>> =>
    HttpClient.put<ApiResponse<Hotel>>(`/HotelMasters/${id}`, payload),

  /**
   * Delete a hotel
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/HotelMasters/${id}`)
}

export default HotelService
