/**
 * Order Service - Pure API calls for restaurant billing operations
 * This is a SEPARATE service layer that ONLY handles API calls
 * No React imports, no state management - just HTTP operations
 * 
 * Uses the existing HttpClient from common/helpers/httpClient
 * Returns raw API responses for the hook to process
 */

import HttpClient from '@/common/helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions (DTOs for this service layer)
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Response from billed bill endpoint */
export interface BilledBillResponse {
  details: BilledBillItem[]
  reversedItems: BilledBillItem[]
  header: BillHeader
}

/** Bill detail item from billed bill */
export interface BilledBillItem {
  ItemID: number
  ItemName?: string
  item_no?: string
  Qty: number
  RevQty?: number
  RuntimeRate: number
  isBilled: number
  isNCKOT?: number
  NCName?: string
  NCPurpose?: string
  KOTNo?: number
  TXnDetailID?: number
  itemName?: string
  reversalLogId?: number
  ReversalLogID?: number
  [key: string]: any
}

/** Bill header */
export interface BillHeader {
  TxnID: number
  TxnNo?: string
  KOTNo?: number
  kotNo?: number
  Amount?: number
  Discount?: number
  DiscPer?: number
  DiscountType?: number
  CustomerName?: string
  MobileNo?: string
  customerid?: number
  BilledDate?: string
  Order_Type?: string
  [key: string]: any
}

/** Response from unbilled items endpoint */
export interface UnbilledItemsResponse {
  items: UnbilledItem[]
  reversedItems: ReversedItem[]
  header?: BillHeader
  kotNo?: number
}

/** Unbilled item */
export interface UnbilledItem {
  itemId: number
  txnDetailId?: number
  item_no?: string
  itemName: string
  price: number
  qty: number
  netQty?: number
  revQty?: number
  kotNo?: number
  txnId?: number
  TxnNo?: string
  [key: string]: any
}

/** Reversed item */
export interface ReversedItem {
  ItemID?: number
  itemId?: number
  ItemName?: string
  itemName?: string
  price?: number
  reversedQty?: number
  qty?: number
  kotNo?: number
  reversalLogId?: number
  [key: string]: any
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Order Service - Pure API Functions
 * ═══════════════════════════════════════════════════════════════════════════════ */

const OrderService = {
  /* ═══════════════════════════════════════════════════════════════════════════
   * Bill Operations - These are the core functions needed for refreshItemsForTable
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get billed (but not settled) bill by table ID
   * Returns the bill details if found, or null/404 if no billed bill exists
   * 
   * @param tableId - The table ID to search for
   * @returns Promise with the API response containing billed bill details
   */
  getBilledBillByTable: (tableId: number): Promise<ApiResponse<BilledBillResponse>> =>
    HttpClient.get<ApiResponse<BilledBillResponse>>(`/TAxnTrnbill/billed-bill/by-table/${tableId}`),

  /**
   * Get unbilled items by table ID
   * Returns all KOT items that haven't been billed yet
   * 
   * @param tableId - The table ID to search for
   * @returns Promise with the API response containing unbilled items
   */
  getUnbilledItemsByTable: (tableId: number): Promise<ApiResponse<UnbilledItemsResponse>> =>
    HttpClient.get<ApiResponse<UnbilledItemsResponse>>(`/TAxnTrnbill/unbilled-items/${tableId}`),

  /* ═══════════════════════════════════════════════════════════════════════════
   * Additional Utility Functions (if needed)
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get bill status by table
   * Returns basic status info without full details
   * 
   * @param tableId - The table ID to check
   * @returns Promise with bill status
   */
  getBillStatusByTable: (tableId: number): Promise<ApiResponse<{
    isBilled: number
    isSetteled: number
    TxnNo?: string
    Amount?: number
    BilledDate?: string
  }>> =>
    HttpClient.get<ApiResponse<any>>(`/TAxnTrnbill/bill-status/${tableId}`),

  /**
   * Mark a transaction as billed
   * 
   * @param txnId - Transaction ID
   * @param payload - Bill details
   * @returns Promise with updated bill
   */
  markBillAsBilled: (
    txnId: number,
    payload: {
      outletId: number
      customerName?: string | null
      mobileNo?: string | null
      customerid?: number | null
    }
  ): Promise<ApiResponse<any>> =>
    HttpClient.put<ApiResponse<any>>(`/TAxnTrnbill/${txnId}/mark-billed`, payload),

  /**
   * Apply discount to bill
   * 
   * @param txnId - Transaction ID
   * @param payload - Discount details
   * @returns Promise with result
   */
  applyDiscount: (
    txnId: number,
    payload: {
      discount: number
      discPer: number
      discountType: number
      tableId: number
      items: any[]
    }
  ): Promise<ApiResponse<any>> =>
    HttpClient.post<ApiResponse<any>>(`/TAxnTrnbill/${txnId}/discount`, payload),

  /**
   * Settle a bill
   * 
   * @param txnId - Transaction ID
   * @param payload - Settlement details
   * @returns Promise with settlement result
   */
  settleBill: (
    txnId: number,
    payload: {
      settlements: Array<{
        PaymentType: string
        Amount: number
        PaymentTypeID?: number
        Name?: string
        OrderNo?: string
        HotelID?: number
      }>
    }
  ): Promise<ApiResponse<any>> =>
    HttpClient.post<ApiResponse<any>>(`/TAxnTrnbill/${txnId}/settle`, payload),

  /**
   * Reverse a bill
   * 
   * @param txnId - Transaction ID
   * @param userId - User performing the reversal
   * @returns Promise with reversal result
   */
  reverseBill: (txnId: number, userId: number): Promise<ApiResponse<any>> =>
    HttpClient.post<ApiResponse<any>>(`/TAxnTrnbill/${txnId}/reverse`, { userId }),

  /**
   * Create reverse KOT
   * 
   * @param payload - Reverse KOT details
   * @returns Promise with result
   */
  createReverseKOT: (payload: {
    txnId: number
    tableId: number
    reversedItems: Array<{
      item_no?: string
      itemName?: string
      qty: number
      price?: number
    }>
    userId: number
    reversalReason: string
  }): Promise<ApiResponse<any>> =>
    HttpClient.post<ApiResponse<any>>('/TAxnTrnbill/create-reverse-kot', payload)
}

export default OrderService
