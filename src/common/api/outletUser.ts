/**
 * Outlet User Service - Clean API service for outlet user management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Outlet User information */
export interface OutletUser {
  userid?: number
  username: string
  email: string
  password?: string
  full_name: string
  phone?: string
  role_level: string
  outletid?: number
  Designation?: string
  designationid?: number
  user_type?: string
  usertypeid?: number
  shift_time?: string
  mac_address?: string
  assign_warehouse?: string
  language_preference?: string
  address?: string
  city?: string
  sub_locality?: string
  web_access?: boolean
  self_order?: boolean
  captain_app?: boolean
  kds_app?: boolean
  captain_old_kot_access?: string
  verify_mac_ip?: boolean
  brand_id?: number
  hotelid?: number
  parent_user_id?: number
  status?: number
  created_by_id?: number
  created_date?: string
  updated_by_id?: number
  updated_date?: string
  brand_name?: string
  hotel_name?: string
  outlet_name?: string
  designation_name?: string
  user_type_name?: string
}

/** Outlet User payload for create/update */
export interface OutletUserPayload {
  userid?: number
  username: string
  email: string
  password?: string
  full_name: string
  phone?: string
  role_level: string
  outletid?: number
  Designation?: string
  designationid?: number
  user_type?: string
  usertypeid?: number
  shift_time?: string
  mac_address?: string
  assign_warehouse?: string
  language_preference?: string
  address?: string
  city?: string
  sub_locality?: string
  web_access?: boolean
  self_order?: boolean
  captain_app?: boolean
  kds_app?: boolean
  captain_old_kot_access?: string
  verify_mac_ip?: boolean
  brand_id?: number
  hotelid?: number
  parent_user_id?: number
  status?: number
  created_by_id?: number
  created_date?: string
  updated_by_id?: number
  updated_date?: string
}

/** Hotel Admin information */
export interface HotelAdmin {
  userid?: number
  username?: string
  email?: string
  full_name: string
  phone?: string
  role_level?: string
  brand_id?: number
  hotel_id?: number
  brand_name?: string
  hotel_name?: string
  status?: number
  created_date?: string
  last_login?: string
}

/** Hotel Admin payload for update */
export interface HotelAdminPayload {
  userid?: number
  username?: string
  email?: string
  full_name: string
  phone?: string
  role_level?: string
  brand_id?: number
  hotel_id?: number
  status?: number
}

/** Dropdown option */
export interface DropdownOption {
  id: number
  name: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Outlet User Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const OutletUserService =  {

  /* ═══════════════════════════════════════════════════════════════════════════
   * User Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get outlet users (filtered by role)
   */
  getOutletUsers: (params?: {
    currentUserId?: number
    roleLevel?: string
    brandId?: number
    hotelId?: number
    outletid?: number
    created_by_id?: number
  }): Promise<ApiResponse<OutletUser[]>> =>
    HttpClient.get<ApiResponse<OutletUser[]>>('/outlet-users', { params }),

  /**
   * Get hotel admins specifically
   */
  getHotelAdmins: (params?: {
    currentUserId?: number
    roleLevel?: string
    brandId?: number
    hotelid?: number
  }): Promise<ApiResponse<HotelAdmin[]>> =>
    HttpClient.get<ApiResponse<HotelAdmin[]>>('/outlet-users/hotel-admins', { params }),

  /**
   * Get outlets for dropdown (filtered by role)
   */
  getOutletsForDropdown: (params?: {
    roleLevel?: string
    brandId?: number
    hotelid?: number
  }): Promise<ApiResponse<any[]>> =>
    HttpClient.get<ApiResponse<any[]>>('/outlet-users/outlets', { params }),

  /**
   * Get designations for dropdown
   */
  getDesignations: (): Promise<ApiResponse<DropdownOption[]>> =>
    HttpClient.get<ApiResponse<DropdownOption[]>>('/outlet-users/designations'),

  /**
   * Get user types for dropdown
   */
  getUserTypes: (): Promise<ApiResponse<DropdownOption[]>> =>
    HttpClient.get<ApiResponse<DropdownOption[]>>('/outlet-users/user-types'),

  /**
   * Get outlet user by ID
   */
  getOutletUserById: (id: number): Promise<ApiResponse<OutletUser>> =>
    HttpClient.get<ApiResponse<OutletUser>>(`/outlet-users/${id}`),

  /**
   * Get hotel admin by ID
   */
  getHotelAdminById: (id: number): Promise<ApiResponse<HotelAdmin>> =>
    HttpClient.get<ApiResponse<HotelAdmin>>(`/outlet-users/hotel-admin/${id}`),

  /**
   * Create new outlet user
   */
  createOutletUser: (data: OutletUserPayload): Promise<ApiResponse<OutletUser>> =>
    HttpClient.post<ApiResponse<OutletUser>>('/outlet-users', data),

  /**
   * Update outlet user
   */
  updateOutletUser: (id: number, data: OutletUserPayload): Promise<ApiResponse<OutletUser>> =>
    HttpClient.put<ApiResponse<OutletUser>>(`/outlet-users/${id}`, data),

  /**
   * Update hotel admin
   */
  updateHotelAdmin: (id: number, data: HotelAdminPayload): Promise<ApiResponse<HotelAdmin>> =>
    HttpClient.put<ApiResponse<HotelAdmin>>(`/outlet-users/hotel-admin/${id}`, data),

  /**
   * Delete outlet user (soft delete)
   */
  deleteOutletUser: (id: number, data: { updated_by_id: number }): Promise<ApiResponse<null>> =>
    HttpClient.put<ApiResponse<null>>(`/outlet-users/${id}`, { is_active: 0, ...data })
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Aliases for backward compatibility
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** @deprecated Use OutletUser instead */
export type OutletUserData = OutletUser

/** @deprecated Use HotelAdmin instead */
export type HotelAdminData = HotelAdmin

export default OutletUserService
