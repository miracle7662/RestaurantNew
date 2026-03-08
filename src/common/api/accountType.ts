/**
 * Account Type Service - Clean API service for account type management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Account Type information */
export interface AccountType {
  AccID: number
  AccName: string
  UnderID: number | null
  NatureOfC: number | null
  status: number
  hotelid: number
  countryid: number
  created_by_id: string
  created_date: string
  updated_by_id?: string
  updated_date?: string
}

/** Account Type payload for create/update */
export interface AccountTypePayload {
  AccName: string
  UnderID: number | null
  NatureOfC: number | null
  status: number
  hotelid: number
  countryid?: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Account Type Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const AccountTypeService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all account types
   */
  list: (): Promise<ApiResponse<AccountType[]>> =>
    HttpClient.get<ApiResponse<AccountType[]>>('/accounttype'),

  /**
   * Get account type by ID
   */
  getById: (id: number): Promise<ApiResponse<AccountType>> =>
    HttpClient.get<ApiResponse<AccountType>>(`/accounttype/${id}`),

  /**
   * Create a new account type
   */
  create: (payload: AccountTypePayload): Promise<ApiResponse<AccountType>> =>
    HttpClient.post<ApiResponse<AccountType>>('/accounttype', payload),

  /**
   * Update an existing account type
   */
  update: (id: number, payload: AccountTypePayload): Promise<ApiResponse<AccountType>> =>
    HttpClient.put<ApiResponse<AccountType>>(`/accounttype/${id}`, payload),

  /**
   * Delete an account type
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/accounttype/${id}`)
}

export default AccountTypeService

