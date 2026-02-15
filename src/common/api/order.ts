/**
 * Order Service - Clean API service for restaurant billing operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */


import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Customer information */
export interface Customer {
  customerid: number
  name: string
  mobile: string
  address?: string
  landmark?: string
}

/** Bill detail item */
export interface BillDetail {
  ItemID: number
  Qty: number
  RuntimeRate: number
  AutoKOT?: boolean
  ManualKOT?: boolean
  SpecialInst?: string
  DeptID?: number
  HotelID?: number
}

/** Bill item with additional details */
export interface BillItem {
  ItemID: number
  Name: string
  item_no?: number
  Qty: number
  RuntimeRate: number
  Amount: number
  AutoKOT?: boolean
  ManualKOT?: boolean
  SpecialInst?: string | null
  DeptID?: number
  HotelID?: number
  isReversed?: boolean
  kotNo?: number
  CustomerName?: string
  MobileNo?: string
  Address?: string
  Landmark?: string
  TxnNo?: string
  isBilled?: number
  isNCKOT?: boolean
  NCName?: string
  NCPurpose?: string
  RevQty?: number
  txnDetailId?: number
  TXnDetailID?: number
  originalQty?: number
  revQty?: number
  netQty?: number
  price?: number
  itemId?: number
  reversalLogId?: number
  txnId?: number
 
  
}

/** Bill header information */
export interface BillHeader {
  TxnID: number
  TxnNo: string
  TableID: number
  Steward?: string
  PAX?: number
  pax?: number
  waiter?: string
  table_name?: string
  CustomerName?: string
  MobileNo?: string
  Address?: string
  Landmark?: string
  customerid?: number
  Order_Type?: string
  outletid?: number
  GrossAmt?: number
  Discount?: number
  DiscPer?: number
  DiscountType?: number
  RevKOT?: number
  RevKOTNo?: string
  KOTNo?: number
  CGST?: number
  SGST?: number
  IGST?: number
  CESS?: number
  RoundOFF?: number
  Amount?: number
  grandTotal?: number
  Status?: number
  BilledDate?: string
  hotel_name?: string
  outlet_name?: string
  orderNo?: string
}

/** Create bill payload */
export interface CreateBillPayload {
  TxnNo?: string
  TableID: number
  Steward?: string
  PAX?: number
  isHomeDelivery?: boolean
  isPickup?: boolean
  orderNo?: string
  HotelID?: number
  CustomerName?: string
  MobileNo?: string
  Address?: string
  Landmark?: string
  GrossAmt?: number
  Discount?: number
  CGST?: number
  SGST?: number
  CESS?: number
  RoundOFF?: number
  Amount?: number
  details: BillDetail[]
}

/** Settlement payload */
export interface SettlementPayload {
  PaymentTypeID?: number
  PaymentType: string
  Amount: number
  ReferenceNo?: string
  OutletID?: number
  userId?: number
  Batch?: string
  Name?: string
  OrderNo?: string
  HotelID?: number
}

/** Settle bill request */
export interface SettleBillRequest {
  bill_amount: number
  total_received: number
  total_refund: number
  settlements: SettlementPayload[]
}

/** KOT item */
export interface KOTItem {
  KOTNo: number
  itemId: number
  qty: number
  revQty: number
  TxnID: number
  orderNo: string
  TxnNo: string | null
  CustomerName?: string
  MobileNo?: string
  Address?: string
  Landmark?: string
  customerid?: number
  txnDetailId?: number
  item_no?: string
  itemName?: string
  name?: string
  price?: number
}

/** Create KOT payload */
export interface CreateKOTPayload {
  txnId?: number
  tableId: number | null
  table_name?: string | null
  items: BillItem[]
  outletid: number | null
  userId: number | null
  hotelId: number | null
  NCName?: string | null
  NCPurpose?: string | null
  DiscPer?: number
  Discount?: number
  DiscountType?: number
  CustomerName?: string | undefined
  MobileNo?: string | undefined
  Order_Type?: string
  TxnDatetime?: string
  order_tag?: string
  customerid?: number | null
  Steward?: string
  PAX?: number | null
  DeptID?: number | null
  
}

/** Reverse KOT item */
export interface ReverseKOTItem {
  txnDetailId: number
  item_no: string
  name: string
  qty: number
  price: number
  itemId?: number
  itemName?: string
  revkotNo?: number
}

/** Tax rates */
export interface TaxRates {
  cgst: number
  sgst: number
  igst: number
  cess: number
}

/** Outlet settings */
export interface OutletSettings {
  ReverseQtyMode?: number
  bill_round_off?: number
  bill_round_off_to?: number
  include_tax_in_invoice?: number
  default_waiter_id?: number
  pax?: number
  [key: string]: any
}

/** Payment mode */
export interface PaymentMode {
  id?: number
  paymenttypeid?: number
  mode_name?: string
  payment_mode_name?: string
}

/** Waiter user */
export interface WaiterUser {
  userId: number
  username?: string
  employee_name?: string
  name?: string
  mobile?: string
}

/** Bill response */
export interface Bill {
  success: boolean
  message: string
  TxnID?: number
  TxnNo?: string
  data: {
    TxnID: number
    TableID: number
    Amount: number
    status?: number
    TxnNo?: string
    KOTNo?: number
    kotNo?: number
    orderNo?: string
  }
  error?: string
}

/** Bill details response */
export interface BillDetailsResponse {
  details: BillItem[]
  reversedItems: BillItem[]
  header: BillHeader
}

/** Unbilled items response */
export interface UnbilledItemsResponse {
  items: BillItem[]
  reversedItems: BillItem[]
  header: BillHeader
  kotNo?: number
}

/** Bill status response */
export interface BillStatusResponse {
  isBilled?: number
  isSetteled?: number
  TxnID?: number
  TxnNo?: string
  Amount?: number
  BilledDate?: string
  status?: number
}

/** Tax response */
export interface TaxResponse {
  outletid: number | null
  departmentid: number
  taxgroupid: number | null
  taxes: TaxRates
}

/** Pending order */
export interface PendingOrder {
  id: number
  TxnID?: number
  TxnNo?: string
  orderNo?: string
  order_no?: string
  KOTNo?: number
  kotNo?: number
  kot_no?: number
  type?: 'pickup' | 'delivery'
  customer: {
    name: string
    mobile: string
  }
  customerid?: number
  outletid?: number
  items: any[]
  total?: number
  [key: string]: any
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Order Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const OrderService = {
  /* ═══════════════════════════════════════════════════════════════════════════
   * Bill Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all bills
   */
  getAllBills: (): Promise<ApiResponse<any[]>> =>
    HttpClient.get<ApiResponse<any[]>>('/TAxnTrnbill/all'),

  /**
   * Get bill by ID
   */
  getBillById: (id: number): Promise<ApiResponse<BillDetailsResponse>> =>
    HttpClient.get<ApiResponse<BillDetailsResponse>>(`/TAxnTrnbill/${id}`),

  /**
   * Get billed bill by table ID
   */
  getBilledBillByTable: (tableId: number): Promise<ApiResponse<BillDetailsResponse>> =>
    HttpClient.get<ApiResponse<BillDetailsResponse>>(`/TAxnTrnbill/billed-bill/by-table/${tableId}`),

  /**
   * Get unbilled items by table ID
   */
  getUnbilledItemsByTable: (tableId: number): Promise<ApiResponse<UnbilledItemsResponse>> =>
    HttpClient.get<ApiResponse<UnbilledItemsResponse>>(`/TAxnTrnbill/unbilled-items/${tableId}`),

  /**
   * Create a new bill
   */
  createBill: (payload: CreateBillPayload): Promise<ApiResponse<Bill>> =>
    HttpClient.post<ApiResponse<Bill>>('/TAxnTrnbill', payload),

  /**
   * Add items to existing bill
   */
  addItemToBill: (id: number, details: BillDetail[]): Promise<ApiResponse<Bill>> =>
    HttpClient.put<ApiResponse<Bill>>(`/TAxnTrnbill/${id}`, { details }),

  /**
   * Settle a bill
   */
  settleBill: (id: number, payload: SettleBillRequest): Promise<ApiResponse<Bill>> =>
    HttpClient.post<ApiResponse<Bill>>(`/TAxnTrnbill/${id}/settle`, payload),

  /**
   * Reverse a bill
   */
  reverseBill: (txnId: number, payload: { userId: number }): Promise<ApiResponse<null>> =>
    HttpClient.post<ApiResponse<null>>(`/TAxnTrnbill/${txnId}/reverse`, payload),

  /**
   * Mark bill as billed
   */
  markBillAsBilled: (
    txnId: number,
    payload: {
      outletId: number
      customerName?: string | null
      mobileNo?: string | null
      customerid?: number | null
    }
  ): Promise<ApiResponse<Bill>> =>
    HttpClient.put<ApiResponse<Bill>>(`/TAxnTrnbill/${txnId}/mark-billed`, payload),

  /**
   * Apply discount to bill
   */
  applyDiscount: (
    txnId: number,
    payload: {
      discount: number
      discPer: number
      discountType: number
      tableId: number
      items: BillItem[]
    }
  ): Promise<ApiResponse<Bill>> =>
    HttpClient.post<ApiResponse<Bill>>(`/TAxnTrnbill/${txnId}/discount`, payload),

  /* ═══════════════════════════════════════════════════════════════════════════
   * KOT Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Create a new KOT
   */
  createKOT: (payload: CreateKOTPayload): Promise<ApiResponse<KOTItem>> =>
    HttpClient.post<ApiResponse<KOTItem>>('/TAxnTrnbill/kot', payload),

  /**
   * Create reverse KOT
   */
  createReverseKOT: (payload: {
    txnId: number
    tableId: number
    kotType: string
    isReverseKot: number
    reversedItems: ReverseKOTItem[]
    userId: number
    reversalReason: string
  }): Promise<ApiResponse<ReverseKOTItem>> =>
    HttpClient.post<ApiResponse<ReverseKOTItem>>('/TAxnTrnbill/create-reverse-kot', payload),

  /**
   * Get KOT list by table
   */
  getKOTList: (tableId: number): Promise<ApiResponse<KOTItem[]>> =>
    HttpClient.get<ApiResponse<KOTItem[]>>('/TAxnTrnbill/kot/list', { params: { tableId } }),

  /**
   * Get saved KOTs
   */
  getSavedKOTs: (filters?: { isBilled?: number; tableId?: number }): Promise<ApiResponse<any[]>> =>
    HttpClient.get<ApiResponse<any[]>>('/TAxnTrnbill/kots/saved', { params: { isBilled: 0, ...filters } }),

  /* ═══════════════════════════════════════════════════════════════════════════
   * Table Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get bill status by table
   */
  getBillStatus: (tableId: number): Promise<ApiResponse<BillStatusResponse>> =>
    HttpClient.get<ApiResponse<BillStatusResponse>>(`/TAxnTrnbill/bill-status/${tableId}`),

  /**
   * Update table status
   */
  updateTableStatus: (tableId: number, payload: { status: number }): Promise<ApiResponse<null>> =>
    HttpClient.put<ApiResponse<null>>(`/tablemanagement/${tableId}/status`, payload),

  /* ═══════════════════════════════════════════════════════════════════════════
   * Customer Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get customer by mobile number
   */
  getCustomerByMobile: (mobile: string): Promise<ApiResponse<Customer>> =>
    HttpClient.get<ApiResponse<Customer>>('/customer/by-mobile', { params: { mobile } }),

  /* ═══════════════════════════════════════════════════════════════════════════
   * Tax Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get taxes by outlet and department
   */
  getTaxesByOutletAndDepartment: (params: {
    outletid?: number | null
    departmentid: number
  }): Promise<ApiResponse<TaxResponse>> =>
    HttpClient.get<ApiResponse<TaxResponse>>('/orders/taxes', { params }),

  /**
   * Get tax details
   */
  getTaxDetails: (outletId: number): Promise<ApiResponse<{
    cgst_rate: number
    sgst_rate: number
    igst_rate: number
    cess_rate: number
    include_tax_in_invoice: boolean
  }>> =>
    HttpClient.get<ApiResponse<any>>('/tax-details', { params: { outletid: outletId } }),

  /* ═══════════════════════════════════════════════════════════════════════════
   * Outlet Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get outlet settings
   */
  getOutletSettings: (outletId: number): Promise<ApiResponse<OutletSettings>> =>
    HttpClient.get<ApiResponse<OutletSettings>>(`/outlets/outlet-settings/${outletId}`),

  /**
   * Get payment modes by outlet
   */
  getPaymentModesByOutlet: (outletId: number): Promise<ApiResponse<PaymentMode[]>> =>
    HttpClient.get<ApiResponse<PaymentMode[]>>('/payment-modes/by-outlet', { params: { outletid: outletId } }),

  /**
   * Get outlets by hotel
   */
  getOutletsByHotel: (hotelId: number): Promise<ApiResponse<any[]>> =>
    HttpClient.get<ApiResponse<any[]>>('/outlets/by-hotel', { params: { hotelid: hotelId } }),

  /**
   * Get outlet by ID
   */
  getOutletById: (outletId: number): Promise<ApiResponse<any>> =>
    HttpClient.get<ApiResponse<any>>(`/outlets/${outletId}`),

  /* ═══════════════════════════════════════════════════════════════════════════
   * Authentication Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Verify creator password
   */
  verifyCreatorPassword: (password: string): Promise<ApiResponse<{ verified: boolean }>> =>
    HttpClient.post<ApiResponse<{ verified: boolean }>>('/auth/verify-creator-password', { password }),

  /**
   * Verify bill creator password
   */
  verifyBillCreatorPassword: (
    password: string,
    txnId: string
  ): Promise<ApiResponse<{ verified: boolean }>> =>
    HttpClient.post<ApiResponse<{ verified: boolean }>>('/auth/verify-bill-creator-password', {
      password,
      txnId
    }),

  /* ═══════════════════════════════════════════════════════════════════════════
   * Additional Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Print KOT
   */
  printKOT: (kotNo: number, payload?: { CustomerName?: string; MobileNo?: string }): Promise<ApiResponse<any>> =>
    HttpClient.post<ApiResponse<any>>('/kot/print', { kotNo, ...payload }),

  /**
   * Apply NCKOT
   */
  applyNCKOT: (
    txnId: number,
    payload: { NCName: string; NCPurpose: string; userId: number }
  ): Promise<ApiResponse<any>> =>
    HttpClient.put<ApiResponse<any>>(`/TAxnTrnbill/${txnId}/apply-nckot`, payload),

  /**
   * Get waiter users by outlet
   */
  getWaiterUsers: (outletId: number): Promise<ApiResponse<WaiterUser[]>> =>
    HttpClient.get<ApiResponse<WaiterUser[]>>('/users/waiters', { params: { outletid: outletId } }),

  /**
   * Get pending orders by type
   */
  getPendingOrders: (type: 'pickup' | 'delivery'): Promise<ApiResponse<PendingOrder[]>> =>
    HttpClient.get<ApiResponse<PendingOrder[]>>('/TAxnTrnbill/pending-orders', { params: { type } }),

  /**
   * Get quick bills
   */
  getQuickBills: (): Promise<ApiResponse<any[]>> =>
    HttpClient.get<ApiResponse<any[]>>('/TAxnTrnbill/by-type/Quick Bill'),

  /**
   * Get global KOT number
   */
  getGlobalKOTNumber: (outletId: number): Promise<ApiResponse<{ nextKOT: number }>> =>
    HttpClient.get<ApiResponse<{ nextKOT: number }>>('/TAxnTrnbill/global-kot-number', {
      params: { outletid: outletId }
    })
}

export default OrderService
