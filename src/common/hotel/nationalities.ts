/**
 * Nationality Service - Clean API service for nationality management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Nationality information */
export interface Nationality {
  nationality_id: number
  nationality: string
  nationality_code: string
  status: string          // 'Active' or 'Inactive'
  created_by_id?: number
  created_date: string
  updated_by_id?: number
  updated_date: string
}

/** Nationality payload for create/update */
export interface NationalityPayload {
  nationality: string
  nationality_code: string
  status: string          // 'Active' or 'Inactive'
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Nationality Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const NationalityService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all nationalities with optional search
   */
  list: (params?: { q?: string }): Promise<ApiResponse<Nationality[]>> =>
    HttpClient.get<ApiResponse<Nationality[]>>('/nationalities', { params }),

  /**
   * Create a new nationality
   */
  create: (payload: NationalityPayload): Promise<ApiResponse<Nationality>> =>
    HttpClient.post<ApiResponse<Nationality>>('/nationalities', payload),

  /**
   * Update an existing nationality
   */
  update: (id: number, payload: NationalityPayload): Promise<ApiResponse<Nationality>> =>
    HttpClient.put<ApiResponse<Nationality>>(`/nationalities/${id}`, payload),

  /**
   * Delete a nationality
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/nationalities/${id}`)
}

export default NationalityService