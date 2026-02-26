/**
 * City Service - Clean API service for city management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** City information */
export interface City {
  cityid: number
  city_name: string
  city_Code: string
  stateId?: number
  countryid?: string
  iscoastal: number
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/** City payload for create/update */
export interface CityPayload {
  cityid?: number
  city_name: string
  city_Code: string
  stateId?: number
  countryid?: string
  iscoastal: number
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * City Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const CityService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all cities with optional search
   */
  list: (params?: { q?: string }): Promise<ApiResponse<City[]>> =>
    HttpClient.get<ApiResponse<City[]>>('/cities', { params }),

  /**
   * Create a new city
   */
  create: (payload: CityPayload): Promise<ApiResponse<City>> =>
    HttpClient.post<ApiResponse<City>>('/cities', payload),

  /**
   * Update an existing city
   */
  update: (id: number, payload: CityPayload): Promise<ApiResponse<City>> =>
    HttpClient.put<ApiResponse<City>>(`/cities/${id}`, payload),

  /**
   * Delete a city
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/cities/${id}`)
}

export default CityService
