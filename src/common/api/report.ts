/**
 * Report Service - API service for report-related operations
 * Uses HttpClient with interceptors for authentication
 * Returns data with proper error handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Bill/Order item from report */
export interface BillItem {
  orderNo: string
  billNo: string
  billDate: string
  kotNo: string
  revKotNo?: string
  revKot: boolean
  grossAmount: number
  discount: number
  amount: number
  cgst: number
  sgst: number
  igst: number
  cess: number
  roundOff?: number
  revAmt?: number
  serviceCharge: number
  serviceCharge_Amount: number
  discountType?: number
  discPer?: number
  ncPurpose?: string
  totalAmount: number
  paymentMode: string
  customerName: string
  address: string
  mobile: string
  orderType: string
  waiter?: string
  captain?: string
  pax?: number
  user?: string
  itemsCount: number
  tax: number
  reverseBill?: number | string
  date: string
  ncKot?: string
  ncName?: string
  cash?: number
  isHomeDelivery?: boolean
  isPickup?: boolean
  isCancelled?: boolean
  billedDate?: string
  handOverEmpID?: number
  dayEndEmpID?: number
  landmark?: string
  credit?: number
  card?: number
  gpay?: number
  phonepe?: number
  qrcode?: number
  outlet?: string
  outletid?: number
  outlet_name?: string
  table_name?: string
  department_name?: string
}

/** Payment mode from API */
export interface PaymentMode {
  id: number
  mode_name: string
}

/** Report API response */
export interface ReportApiResponse {
  success: boolean
  data?: {
    orders: BillItem[]
  }
  message?: string
}

/** Report query parameters */
export interface ReportParams {
  start?: string
  end?: string
  outletid?: string | number
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Report Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const ReportService = {

  /**
   * Get daily sales report data
   * @param params - Query parameters (start date, end date, outletid)
   */
  getDailySalesReport: async (params: ReportParams): Promise<ReportApiResponse> => {
    try {
      // Build query string
      const queryParams = new URLSearchParams()
      if (params.start) queryParams.append('start', params.start)
      if (params.end) queryParams.append('end', params.end)
      
      const response = await HttpClient.get<ReportApiResponse>(
        `/reports?${queryParams.toString()}`
      )
      return response
    } catch (error) {
      console.error('Error fetching daily sales report:', error)
      throw error
    }
  },

  /**
   * Get payment modes by outlet
   * @param outletId - Outlet ID (optional, returns all if not provided)
   */
  getPaymentModesByOutlet: async (outletId?: string | number): Promise<PaymentMode[]> => {
    try {
      const queryParams = outletId ? `?outletid=${outletId}` : ''
      const response = await HttpClient.get<PaymentMode[]>(
        `/payment-modes/by-outlet${queryParams}`
      )
      return response
    } catch (error) {
      console.error('Error fetching payment modes:', error)
      throw error
    }
  }
}

export { ReportService }

export default ReportService

