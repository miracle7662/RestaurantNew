/**
 * Report Service - API service for report-related operations
 * Uses HttpClient with interceptors for authentication
 * Returns data with proper error handling
 */

import HttpClient from '../helpers/httpClient'

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

/** Report API response (detailed orders) */
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

/* ─── Daily Summary Types ─── */

/** A single daily summary row (grouped by date) */
export interface DailySummaryRow {
  BillDate: string
  BillNoRange: string
  TotalBills: number
  TotalAmount: number
  GrossAmount: number
  Discount: number
  TaxableValue: number
  CGST: number
  SGST: number
  RoundOFF: number
  RevAmt: number
  Water: number
  TotalItems: number
  TipAmount: number
  SettlementAmount: number
  // Dynamic payment type columns (e.g., Cash, Card, etc.)
  [paymentType: string]: string | number
}

/** Grand totals for the daily summary */
export interface DailySummaryGrandTotals {
  TotalBills: number
  TotalAmount: number
  GrossAmount: number
  Discount: number
  TaxableValue: number
  CGST: number
  SGST: number
  RoundOFF: number
  RevAmt: number
  Water: number
  TotalItems: number
  TipAmount: number
  SettlementAmount: number
  // Dynamic payment type totals
  [paymentType: string]: number
}

/** Response from the daily summary endpoint */
export interface DailySummaryResponse {
  success: boolean
  data?: {
    summaryType: 'dailySummary'
    rows: DailySummaryRow[]
    grandTotals: DailySummaryGrandTotals
    paymentTypes: string[]
  }
  message?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Report Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const ReportService = {

  /**
   * Get daily sales report data (detailed orders)
   * @param params - Query parameters (start date, end date, outletid, caseType)
   */
  getDailySalesReport: async (params: ReportParams & { caseType?: string }): Promise<ReportApiResponse> => {
    try {
      const queryParams = new URLSearchParams()
      if (params.start) queryParams.append('start', params.start)
      if (params.end) queryParams.append('end', params.end)
      if (params.caseType) queryParams.append('caseType', params.caseType)
      
      const response = await HttpClient.get<ReportApiResponse>(
        `/reports?${queryParams.toString()}`
      )
      return response
    } catch (error) {
      // console.error('Error fetching daily sales report:', error)
      throw error
    }
  },

  /**
   * Get daily summary report (grouped by date, aggregated totals)
   * @param params - start/end dates (optional, defaults to today)
   */
getDailySummary: async (params: { start?: string; end?: string; outletid?: number }): Promise<DailySummaryResponse> => {
  try {
    const queryParams = new URLSearchParams()
    if (params.start) queryParams.append('start', params.start)
    if (params.end) queryParams.append('end', params.end)
    if (params.outletid) queryParams.append('outletid', String(params.outletid)) // ✅ add this line

    const response = await HttpClient.get<DailySummaryResponse>(
      `/reports/daily-summary?${queryParams.toString()}`
    )
    return response
  } catch (error) {
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
      // console.error('Error fetching payment modes:', error)
      throw error
    }
  }
}

export { ReportService }

export default ReportService