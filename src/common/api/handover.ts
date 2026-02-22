/**
 * Handover Service - Clean API service for handover operations
 * Uses HttpClient with interceptors for authentication
 * Returns wrapped response with success/data/message structure
 */

import HttpClient from '../helpers/httpClient'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** API response wrapper */
export interface HandoverApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

/** Handover transaction data */
export interface HandoverTransaction {
  orderNo: string
  table: string
  waiter: string
  amount: number
  type: string
  status: string
  time: string
  items: number
  kotNo: string
  revKotNo: string
  discount: number
  ncKot: string
  ncName: string
  cgst: number
  sgst: number
  grossAmount: number
  roundOff: number
  revAmt: number
  reverseBill: number | string
  water: number
  captain: string
  user: string
  date: string
  paymentMode?: string
  cash?: number
  credit?: number
  card?: number
  gpay?: number
  phonepe?: number
  qrcode?: number
}

/** Handover user data */
export interface HandoverUser {
  userid: number
  full_name: string
  username: string
  role_level: string
  status: number
  outletid?: number
}

/** Handover summary data */
export interface HandoverSummary {
  totalOrders: number
  totalKOTs: number
  totalSales: number
  cash: number
  card: number
  upi: number
  pending: number
  completed: number
  cancelled: number
  averageOrderValue: number
  totalDiscount: number
  totalCGST: number
  totalSGST: number
  totalGrossAmount: number
  totalRoundOff: number
  totalRevAmt: number
  totalWater: number
  totalItems: number
  totalCredit: number
  totalGpay: number
  totalPhonepe: number
  totalQrcode: number
}

/** Payment method breakdown */
export interface PaymentMethod {
  type: string
  amount: number
  percentage: string
}

/** Handover data response */
export interface HandoverData {
  orders: HandoverTransaction[]
  summary: HandoverSummary
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
  expected: number
  difference: number
  reason?: string
  handoverTo: number | string
  handoverBy: string
  userId: number
}

/** Handover save payload */
export interface HandoverSavePayload {
  handoverToUserId: number
  handoverByUserId?: number
}

/** Password verification payload */
export interface PasswordVerifyPayload {
  password: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Handover Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const HandoverService = {
  /* ═══════════════════════════════════════════════════════════════════════════════
   * Query Operations
   * ═══════════════════════════════════════════════════════════════════════════════ */

  /**
   * Get handover data (transactions and summary)
   */
  getHandoverData: (): Promise<HandoverApiResponse<HandoverData>> =>
    HttpClient.get<HandoverApiResponse<HandoverData>>('/handover/data'),

  /**
   * Get handover users (outlet users for handover)
   */
  getHandoverUsers: (params?: { currentUserId?: number; roleLevel?: string; hotelid?: number }): Promise<HandoverApiResponse<HandoverUser[]>> =>
    HttpClient.get<HandoverApiResponse<HandoverUser[]>>('/outlet-users', { params }),

  /* ═══════════════════════════════════════════════════════════════════════════════
   * Mutation Operations
   * ═══════════════════════════════════════════════════════════════════════════════ */

  /**
   * Save handover (complete handover process)
   */
  saveHandover: (payload: HandoverSavePayload): Promise<HandoverApiResponse<{ success: boolean; message?: string }>> =>
    HttpClient.post<HandoverApiResponse<{ success: boolean; message?: string }>>('/handover/save', payload),

  /**
   * Save cash denomination
   */
  saveCashDenomination: (payload: CashDenominationPayload): Promise<HandoverApiResponse<{ success: boolean; message?: string }>> =>
    HttpClient.post<HandoverApiResponse<{ success: boolean; message?: string }>>('/handover/cash-denomination', payload),

  /**
   * Verify password for handover
   */
  verifyPassword: (payload: PasswordVerifyPayload): Promise<HandoverApiResponse<{ success: boolean }>> =>
    HttpClient.post<HandoverApiResponse<{ success: boolean }>>('/auth/verify-password', payload)
}

export default HandoverService
