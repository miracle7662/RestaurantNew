/**
 * Menu Service - Clean API service for menu management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Menu information */
export interface Menu {
  menuid: number
  menu_name: string
  menu_code: string
  hotelid: number
  outletid?: number
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/** Menu payload for create/update */
export interface MenuPayload {
  menuid?: number
  menu_name: string
  menu_code: string
  hotelid: number
  outletid?: number
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Menu Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const MenuService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all menus with optional search
   */
  list: (params?: { q?: string }): Promise<ApiResponse<Menu[]>> =>
    HttpClient.get<ApiResponse<Menu[]>>('/mstrestmenu', { params }),

  /**
   * Create a new menu
   */
  create: (payload: MenuPayload): Promise<ApiResponse<Menu>> =>
    HttpClient.post<ApiResponse<Menu>>('/mstrestmenu', payload),

  /**
   * Update an existing menu
   */
  update: (id: number, payload: MenuPayload): Promise<ApiResponse<Menu>> =>
    HttpClient.put<ApiResponse<Menu>>(`/mstrestmenu/${id}`, payload),

  /**
   * Delete a menu
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/mstrestmenu/${id}`)
}

export default MenuService
