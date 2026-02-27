/**
 * State Service - Clean API service for state management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** State information */
export interface State {
  stateid: number
  state_name: string
  state_capital: string
  state_code: string
  countryid: number
  status: number
  created_by_id: number
  created_date: string
  updated_by_id: number
  updated_date: string
}

/** State payload for create/update */
export interface StatePayload {
  stateid?: number
  state_name: string
  state_code: string
  state_capital: string
  countryid: number
  status: number
  created_by_id: number
  created_date: string
  updated_by_id: number
  updated_date: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * State Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const StateService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all states with optional search
   */
  list: (params?: { q?: string; countryid?: number }): Promise<ApiResponse<State[]>> =>
    HttpClient.get<ApiResponse<State[]>>('/states', { params }),

  /**
   * Create a new state
   */
  create: (payload: StatePayload): Promise<ApiResponse<State>> =>
    HttpClient.post<ApiResponse<State>>('/states', payload),

  /**
   * Update an existing state
   */
  update: (id: number, payload: StatePayload): Promise<ApiResponse<State>> =>
    HttpClient.put<ApiResponse<State>>(`/states/${id}`, payload),

  /**
   * Delete a state
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/states/${id}`)
}

export default StateService
