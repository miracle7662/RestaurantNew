/**
 * Account Nature Service - Clean API service for account nature management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Account Nature information */
export interface AccountNature {
  nature_id: number
  accountnature: string
  status: number
  hotelid: number
  countryid: number
  created_by_id: string
  created_date: string
  updated_by_id?: string
  updated_date?: string
}

/** Account Nature payload for create/update */
export interface AccountNaturePayload {
  accountnature: string
  status: number
  hotelid?: number
  countryid?: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Account Nature Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const AccountNatureService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all account natures
   */
  list: (): Promise<ApiResponse<AccountNature[]>> =>
    HttpClient.get<ApiResponse<AccountNature[]>>('/accountnature'),

  /**
   * Get account nature by ID
   */
  getById: (id: number): Promise<ApiResponse<AccountNature>> =>
    HttpClient.get<ApiResponse<AccountNature>>(`/accountnature/${id}`),

  /**
   * Create a new account nature
   */
  create: (payload: AccountNaturePayload): Promise<ApiResponse<AccountNature>> =>
    HttpClient.post<ApiResponse<AccountNature>>('/accountnature', payload),

  /**
   * Update an existing account nature
   */
  update: (id: number, payload: AccountNaturePayload): Promise<ApiResponse<AccountNature>> =>
    HttpClient.put<ApiResponse<AccountNature>>(`/accountnature/${id}`, payload),

  /**
   * Delete an account nature
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/accountnature/${id}`)
}

export default AccountNatureService

