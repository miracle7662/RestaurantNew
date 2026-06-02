import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Floor information */
export interface Floor {
  floor_id: number
  floor_name: string
  floor_number: number
  hotelid: number  // Changed from mst_hotelid to hotelid
  status: number
  created_by_id: number
  created_date: string
  updated_by_id: number
  updated_date: string
}

/** Floor payload for create/update */
export interface FloorPayload {
  floor_id?: number
  floor_name: string
  floor_number: number
  hotelid?: number  // Changed from mst_hotelid to hotelid
  status: number
  created_by_id?: number
  updated_by_id?: number
  created_date?: string
  updated_date?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Floor Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const FloorService = {
  /**
   * Get all floors – expects hotelid as a query parameter
   */
  list: (params?: { hotelid?: number; q?: string }): Promise<ApiResponse<Floor[]>> =>
    HttpClient.get<ApiResponse<Floor[]>>('/floors', { params }),

  /**
   * Create a new floor
   */
  create: (payload: FloorPayload): Promise<ApiResponse<Floor>> =>
    HttpClient.post<ApiResponse<Floor>>('/floors', payload),

  /**
   * Update an existing floor
   */
  update: (id: number, payload: FloorPayload): Promise<ApiResponse<Floor>> =>
    HttpClient.put<ApiResponse<Floor>>(`/floors/${id}`, payload),

  /**
   * Delete a floor
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/floors/${id}`)
}

export default FloorService