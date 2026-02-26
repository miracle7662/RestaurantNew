/**
 * Profile Service - Clean API service for user profile management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** User Profile information */
export interface Profile {
  userid: number
  username: string
  email: string
  mobile: string
  firstname?: string
  lastname?: string
  usertypeid?: number
  hotelid?: number
  outletid?: number
  status?: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/** Profile payload for update */
export interface ProfilePayload {
  userid?: number
  username: string
  email: string
  mobile: string
  firstname?: string
  lastname?: string
  usertypeid?: number
  hotelid?: number
  outletid?: number
  status?: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Profile Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const ProfileService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * Profile Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get current user profile
   */
  get: (): Promise<ApiResponse<Profile>> =>
    HttpClient.get<ApiResponse<Profile>>('/profile'),

  /**
   * Update user profile
   */
  update: (payload: ProfilePayload): Promise<ApiResponse<Profile>> =>
    HttpClient.put<ApiResponse<Profile>>('/profile', payload),

  /**
   * Change password
   */
  changePassword: (payload: { currentPassword: string; newPassword: string }): Promise<ApiResponse<{ success: boolean }>> =>
    HttpClient.post<ApiResponse<{ success: boolean }>>('/profile/change-password', payload)
}

export default ProfileService
