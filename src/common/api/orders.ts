/**
 * Orders / Shift Types API service
 * Uses HttpClient with interceptors for authentication
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

export interface ShiftTypeItem {
  id: number
  shift_type: string
}

const OrdersService = {
  /**
   * List shift types
   * GET /api/orders/shift-types
   */
  listShiftTypes: (): Promise<ApiResponse<ShiftTypeItem[]>> =>
    HttpClient.get<ApiResponse<ShiftTypeItem[]>>('/orders/shift-types')
}

export default OrdersService

