/**
 * Outlet Menu Service - Clean API service matching unitmaster.ts pattern
 * Uses HttpClient for consistent API calls across masters
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions (matching backend controller: id, menuName, etc.)
 * ═══════════════════════════════════════════════════════════════════════════════ */

interface OutletMenu {
  id: number
  menuName: string
  shortName: string
  outletName: string  // Display name (JOIN from mst_outlets)
  outletId: number    // NEW: actual outletid FK
  isPosDefaultMenu: number  // 0/1
  defaultDigitalMenu: number  // 0/1  
  isDigitalMenu: number  // 0/1
  publishedAt: string
  status: number  // 0 active, 1 inactive (soft delete)
  hotelid: number
  created_by_id?: number
  created_date?: string
  updated_by_id?: number
  updated_date?: string
}

export interface OutletMenuPayload {
  menuName: string
  shortName?: string
  outletId: number  // NEW: outletid from mst_outlets
  isPosDefaultMenu: number
  defaultDigitalMenu: number
  isDigitalMenu: number
  hotelid: number
  status?: number
  created_by_id?: number
  created_date?: string
  updated_by_id?: number
  updated_date?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Outlet Menu Service (exact unitmaster.ts pattern)
 * ═══════════════════════════════════════════════════════════════════════════════ */

const OutletMenuService = {

  /**
   * Get outlet menus filtered by hotelid (GET /outletMenu/)
   */
  list: (params?: { hotelid?: number }): Promise<ApiResponse<OutletMenu[]>> =>
    HttpClient.get<ApiResponse<OutletMenu[]>>('/outletMenu/', { params }),

  /**
   * Create new outlet menu (POST /outletMenu/)
   */
  create: (payload: OutletMenuPayload): Promise<ApiResponse<OutletMenu>> =>
    HttpClient.post<ApiResponse<OutletMenu>>('/outletMenu/', payload),

  /**
   * Update outlet menu (PUT /outletMenu/:id)
   */
  update: (id: number, payload: Partial<OutletMenuPayload>): Promise<ApiResponse<OutletMenu>> =>
    HttpClient.put<ApiResponse<OutletMenu>>(`/outletMenu/${id}`, payload),

  /**
   * Soft delete outlet menu (DELETE /outletMenu/:id → status=1)
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/outletMenu/${id}`)
}

export default OutletMenuService

