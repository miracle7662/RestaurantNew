// src/common/api/dashboard.ts

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

export interface DashboardData {
  recentOrders: any[]
  bestSellers: any[]
  categorySales: any[]
  paymentDistribution: any[]
  hourlySales: any[]
  tableStatus: any[]
  summary: {
    total_orders: number
    total_revenue: number
    billed_not_settled: number
    settled_orders: number
    pending_orders: number
    settled_revenue: number
    pending_settlement_amount: number
  }
}

const DashboardService = {
  /**
   * Get complete dashboard data
   * Single API call that returns all dashboard data
   */
  getDashboardData: (params: {
    outletid: number
    hotelid: number
    limit?: number
    curr_date?: string
  }): Promise<ApiResponse<DashboardData>> =>
    HttpClient.get<ApiResponse<DashboardData>>('/TAxnTrnbill/recent-orders', { params }),
}

export default DashboardService