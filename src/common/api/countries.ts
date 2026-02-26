/**
 * Country Service - Clean API service for country management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Country information */
export interface Country {
  countryid: number
  country_name: string
  country_code: string
  phone_code?: string
  currency?: string
  currency_symbol?: string
  status?: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/** Country payload for create/update */
export interface CountryPayload {
  countryid?: number
  country_name: string
  country_code: string
  phone_code?: string
  currency?: string
  currency_symbol?: string
  status?: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Country Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const CountryService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all countries with optional search
   */
  list: (params?: { q?: string }): Promise<ApiResponse<Country[]>> =>
    HttpClient.get<ApiResponse<Country[]>>('/countries', { params }),

  /**
   * Create a new country
   */
  create: (payload: CountryPayload): Promise<ApiResponse<Country>> =>
    HttpClient.post<ApiResponse<Country>>('/countries', payload),

  /**
   * Update an existing country
   */
  update: (id: number, payload: CountryPayload): Promise<ApiResponse<Country>> =>
    HttpClient.put<ApiResponse<Country>>(`/countries/${id}`, payload),

  /**
   * Delete a country
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/countries/${id}`)
}

export default CountryService
