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

export interface DepartmentSalesItem {
  departmentid: number
  department_name: string
  kot_sale: number
  billed_sale: number
  total_sale: number
}

// Define the full response structure from your backend
export interface DepartmentSalesResponse {
  success: boolean
  data: DepartmentSalesItem[]
  totals: {
    kot_sale: number
    billed_sale: number
    total_sale: number
  }
  message?: string
  error?: string
}

const OrdersService = {
  /**
   * List shift types
   * GET /api/orders/shift-types
   */
  listShiftTypes: (): Promise<ApiResponse<ShiftTypeItem[]>> =>
    HttpClient.get<ApiResponse<ShiftTypeItem[]>>('/orders/shift-types'),

  /**
   * Department Wise Sales
   * GET /api/orders/department-sales
   */
  getDepartmentSales: (
    curr_Date: string,
    hotelId: number,
    outletId: number
  ): Promise<DepartmentSalesResponse> =>
    HttpClient.get<DepartmentSalesResponse>(
      `/orders/department-sales?curr_Date=${curr_Date}&hotelId=${hotelId}&outletId=${outletId}`
    )
}

export default OrdersService