/**
 * User Type Service - Clean API service for user type management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** User Type information */
export interface UserType {
  usertypeid: number
  hotelid?: string
  User_type: string
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/** User Type payload for create/update */
export interface UserTypePayload {
  usertypeid?: number
  hotelid?: string
  User_type: string
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * User Type Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const UserTypeService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all user types with optional search
   */
  list: (params?: { q?: string }): Promise<ApiResponse<UserType[]>> =>
    HttpClient.get<ApiResponse<UserType[]>>('/usertype', { params }),

  /**
   * Create a new user type
   */
  create: (payload: UserTypePayload): Promise<ApiResponse<UserType>> =>
    HttpClient.post<ApiResponse<UserType>>('/usertype', payload),

  /**
   * Update an existing user type
   */
  update: (id: number, payload: UserTypePayload): Promise<ApiResponse<UserType>> =>
    HttpClient.put<ApiResponse<UserType>>(`/usertype/${id}`, payload),

  /**
   * Delete a user type
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/usertype/${id}`)
}

export default UserTypeService
