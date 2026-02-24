/**
 * Dayend Service - Clean API service for dayend operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Dayend transaction data */
export interface DayendTransaction {
  TxnID: number
  TxnNo: string
  TableID: number
  outletid: number
  HotelID: number
  TotalAmount: number
  Discount: number
  GrossAmount: number
  CGST: number
  SGST: number
  RoundOFF: number
  RevKOT: number
  RevAmt: number
  TxnDatetime: string
  Steward: string
  Captain: string
  UserId: string
  UserName: string
  Water: number
  KOTNo: string
  RevKOTNo: string
  NCKOT: string
  NCPurpose: string
  NCName: string
  Settlements: string
  PaymentType: string
  isSetteled: number
  isBilled: number
  isreversebill: number
  isCancelled: number
  isDayEnd: number
  DayEndEmpID: string
  TotalItems: number
  status: string
  type: string
  amount: number
  discount: number
  cgst: number
  sgst: number
  orderNo: string
  table: number
  waiter: string
  time: string
  items: number
  kotNo: string
  revKotNo: string
  ncKot: string
  ncPurpose: string
  paymentType: string
  cash: number
  card: number
  gpay: number
  phonepe: number
  qrcode: number
  credit: number
  grossAmount: number
  roundOff: number
  reverseBill: number
  date: string
}

/** Dayend summary data */
export interface DayendSummary {
  totalOrders: number
  totalKOTs: number
  totalSales: number
  cash: number
  card: number
  gpay: number
  phonepe: number
  qrcode: number
  pending: number
  completed: number
  cancelled: number
  averageOrderValue: number
}

/** Payment method breakdown */
export interface PaymentMethod {
  type: string
  amount: number
  percentage: string
}

/** Dayend data response */
export interface DayendData {
  orders: DayendTransaction[]
  summary: DayendSummary
  paymentMethods: PaymentMethod[]
  totalDiscount: number
  totalCGST: number
  totalSGST: number
}

/** Cash denomination payload */
export interface CashDenominationPayload {
  denominations: {
    '2000': number
    '500': number
    '200': number
    '100': number
    '50': number
    '20': number
    '10': number
    '5': number
    '2': number
    '1': number
  }
  total: number
  userId: number
  reason?: string
}

/** Dayend save payload */
export interface DayendSavePayload {
  dayend_total_amt: number
  outlet_id: number
  hotel_id: number
  created_by_id: number
}

export interface DayendSaveResponse {
  id?: number
  dayend_date?: string
  curr_date?: string
  pendingTables?: number[]
}


/** Report generation payload */
export interface DayendReportPayload {
  DayEndEmpID: number
  businessDate: string
  selectedReports: string[]
}

/** Closing balance response */
export interface ClosingBalanceData {
  closing_balance: number
  dayend_date: string | null
  curr_date: string | null
}

/** Latest current date response */
export interface LatestCurrDateData {
  curr_date: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Dayend Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const DayendService = {
  /* ═══════════════════════════════════════════════════════════════════════════════
   * Query Operations
   * ═══════════════════════════════════════════════════════════════════════════════ */

  /**
   * Get dayend data (transactions and summary)
   */
  getDayendData: (params?: { outletid?: number; hotelid?: number }): Promise<ApiResponse<DayendData>> =>
    HttpClient.get<ApiResponse<DayendData>>('/dayend/data', { params }),

  /**
   * Get latest current date for the business
   */
  getLatestCurrDate: (params?: { brandId?: number; hotelid?: number }): Promise<ApiResponse<LatestCurrDateData>> =>
    HttpClient.get<ApiResponse<LatestCurrDateData>>('/dayend/latest-currdate', { params }),

  /**
   * Get closing balance from last dayend (to be used as opening balance)
   */
  getClosingBalance: (params: { outlet_id?: number; hotel_id: number }): Promise<ApiResponse<ClosingBalanceData>> =>
    HttpClient.get<ApiResponse<ClosingBalanceData>>('/dayend/closing-balance', { params }),

  /* ═══════════════════════════════════════════════════════════════════════════════
   * Mutation Operations
   * ═══════════════════════════════════════════════════════════════════════════════ */

  /**
   * Save dayend cash denomination
   */
  saveDayEndCashDenomination: (payload: CashDenominationPayload): Promise<ApiResponse<{ id: number }>> =>
    HttpClient.post<ApiResponse<{ id: number }>>('/dayend/dayend-cash-denomination', payload),

  /**
   * Save dayend (complete dayend process)
   */
  saveDayEnd: (
  payload: DayendSavePayload
): Promise<ApiResponse<DayendSaveResponse>> =>
  HttpClient.post<ApiResponse<DayendSaveResponse>>(
    '/dayend/save-dayend',
    payload
  ),

  /**
   * Generate dayend report HTML
   * Backend returns { success: true, html: string } directly (not wrapped in data)
   */
  generateReportHTML: (payload: DayendReportPayload): Promise<{ success: boolean; html: string; message?: string }> =>
    HttpClient.post<{ success: boolean; html: string; message?: string }>('/dayend/generate-report-html', payload),

  /**
   * Save opening balance for the day
   */
  saveOpeningBalance: (payload: { opening_balance: number; outlet_id?: number; hotel_id: number; user_id: number }): Promise<ApiResponse<{ id: number; opening_balance: number; dayend_date: string; curr_date: string }>> =>
    HttpClient.post<ApiResponse<{ id: number; opening_balance: number; dayend_date: string; curr_date: string }>>('/dayend/save-opening-balance', payload)
}

export default DayendService
