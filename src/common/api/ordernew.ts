// src/common/api/orders.ts
import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ─────────────── Entity Types ─────────────── */

export type Customer = {
  customerid: number
  name: string
  mobile: string
}

export type Bill = {
   success: boolean
  message: string
  data: {
  TxnID: number
  TableID: number
  Amount: number
  status?: number
 }
  error?: string
}

export type KOTItem = {
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
}

/* ─────────────── Bill Payload Types ─────────────── */

export type BillDetail = {
  ItemID: number
  Qty: number
  RuntimeRate: number
  AutoKOT?: boolean
  ManualKOT?: boolean
  SpecialInst?: string
  DeptID?: number
  HotelID?: number
}

export type CreateBillPayload = {
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

export type SettleBillRequest = {
  bill_amount: number
  total_received: number
  total_refund: number
  settlements: SettlementPayload[]
}

export type SettlementPayload = {
  PaymentTypeID?: number
  PaymentType: string
  Amount: number
  ReferenceNo?: string
  OutletID?: number
  userId?: number
}

/* ─────────────── Bill Response Types ─────────────── */

export type BillItem = {
  ItemID: number
  Name: string
  Qty: number
  RuntimeRate: number
  Amount: number
  AutoKOT?: boolean
  ManualKOT?: boolean
  SpecialInst?: string
  DeptID?: number
  HotelID?: number
  isReversed?: boolean
  kotNo?: number
  CustomerName?: string
  MobileNo?: string
  Address?: string
  Landmark?: string
  TxnNo?: string

}

export type BillHeader = {
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
  CGST?: number
  SGST?: number
  IGST?: number
  CESS?: number
  RoundOFF?: number
  Amount?: number
  grandTotal?: number
  Status?: number
}

export interface ReverseKOTItem {
  txnDetailId: number;
  item_no: string;
  name: string;
  qty: number;
  price: number;
}


// Since HttpClient interceptor returns response.data directly, 
// these types should NOT have ApiResponse wrapper
export type BillDetailsResponse = {
  details: BillItem[]
  reversedItems: BillItem[]
  header: BillHeader
}

export type UnbilledItemsResponse = {
  items: BillItem[]
  reversedItems: BillItem[]
  header: BillHeader
  kotNo?: number
}

/* ─────────────── KOT Payload ─────────────── */

export type CreateKOTPayload = {
   TxnID: number

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
}

export interface WaiterUser {
  id: number;
  name: string;
  mobile?: string;
}


/* ─────────────── Service ─────────────── */

const OrdernewService = {
  /* ================= BILL ================= */
  createBill: (payload: CreateBillPayload) =>
    HttpClient.post<ApiResponse<Bill>>('/TAxnTrnbill', payload),

  addItemToBill: (id: number, details: BillDetail[]) =>
    HttpClient.put<ApiResponse<Bill>>(`/TAxnTrnbill/${id}`, { details }),

  getBillById: (id: number) =>
    HttpClient.get<BillDetailsResponse>(`/TAxnTrnbill/${id}`),

  getAllBills: () =>
    HttpClient.get<ApiResponse<Bill[]>>('/TAxnTrnbill/all'),

  reverseBill: (txnId: number, payload: { userId: number }) =>
    HttpClient.post<ApiResponse<null>>(`/TAxnTrnbill/${txnId}/reverse`, payload),

  markBillAsBilled: (txnId: number, payload: { outletId: number; customerName?: string | null; mobileNo?: string | null; customerid?: number | null }) =>
    HttpClient.put<ApiResponse<Bill>>(`/TAxnTrnbill/${txnId}/mark-billed`, payload),

  /* ================= SETTLEMENT ================= */
  /* ================= SETTLEMENT ================= */
settleBill: (id: number, payload: SettleBillRequest) =>
  HttpClient.post<ApiResponse<Bill>>(
    `/TAxnTrnbill/${id}/settle`,
    payload
  ),


  /* ================= KOT ================= */
  createKOT: (payload: CreateKOTPayload) =>
    HttpClient.post<ApiResponse<KOTItem>>('/TAxnTrnbill/kot', payload),

 createReverseKOT: (payload: {
  txnId: number;
  tableId: number;
  kotType: string;
  isReverseKot: number;
  reversedItems: ReverseKOTItem[];
  userId: number;
  reversalReason: string;
}) =>
  HttpClient.post<ApiResponse<ReverseKOTItem>>(
    '/TAxnTrnbill/create-reverse-kot',
    payload
  ),




  getKOTList: (tableId: number) =>
    HttpClient.get<ApiResponse<KOTItem[]>>('/TAxnTrnbill/kot/list', { params: { tableId } }),

  /* ================= TABLE ================= */
  getUnbilledItemsByTable: (tableId: number) =>
    HttpClient.get<UnbilledItemsResponse>(`/TAxnTrnbill/unbilled-items/${tableId}`),

  getBilledBillByTable: (tableId: number) =>
    HttpClient.get<BillDetailsResponse>(`/TAxnTrnbill/billed-bill/by-table/${tableId}`),

  getBillStatus: (tableId: number) =>
    HttpClient.get<ApiResponse<{ status: number }>>(`/TAxnTrnbill/bill-status/${tableId}`),

  updateTableStatus: (tableId: number, payload: { status: number }) =>
    HttpClient.put<ApiResponse<null>>(`/tablemanagement/${tableId}/status`, payload),

  /* ================= CUSTOMER ================= */
  getCustomerByMobile: (mobile: string) =>
    HttpClient.get<ApiResponse<Customer>>('/customer/by-mobile', { params: { mobile } }),

  /* ================= DISCOUNT ================= */
  applyDiscount: (txnId: number, payload: { discount: number; discPer: number; discountType: number; tableId: number; items: BillItem[] }) =>
    HttpClient.post<ApiResponse<Bill>>(`/TAxnTrnbill/${txnId}/discount`, payload),

  /* ================= MASTERS ================= */
  getTableManagement: () =>
    HttpClient.get<ApiResponse<any[]>>('/tablemanagement'),

  getPaymentModesByOutlet: (outletId: number) =>
    HttpClient.get<ApiResponse<any[]>>('/payment-modes/by-outlet', { params: { outletid: outletId } }),

  getMenu: (outletId: number) =>
    HttpClient.get<ApiResponse<any[]>>('/menu', { params: { outletid: outletId } }),

  verifyCreatorPassword: (password: string) =>
    HttpClient.post<ApiResponse<{ verified: boolean }>>('/auth/verify-creator-password', { password }),

  /* ================= ADDITIONAL ================= */
  getBillDetails: (id: number) =>
    HttpClient.get<BillDetailsResponse>(`/TAxnTrnbill/${id}`),

  getGlobalKOTNumber: (outletId: number) =>
    HttpClient.get<ApiResponse<{ nextKOT: number }>>('/TAxnTrnbill/global-kot-number', { params: { outletid: outletId } }),

  getTaxDetails: (outletId: number) =>
    HttpClient.get<ApiResponse<{ cgst_rate: number; sgst_rate: number; igst_rate: number; cess_rate: number; include_tax_in_invoice: boolean }>>('/tax-details', { params: { outletid: outletId } }),

  getOutletSettings: (outletId: number) =>
    HttpClient.get<ApiResponse<any>>('/outlets/outlet-settings', { params: { outletid: outletId } }),

  getOutletsByHotel: (hotelId: number) =>
    HttpClient.get<ApiResponse<any[]>>('/outlets/by-hotel', { params: { hotelid: hotelId } }),

  getOutletById: (outletId: number) =>
    HttpClient.get<ApiResponse<any>>(`/outlets/${outletId}`),

  printKOT: (kotNo: number, payload: { CustomerName?: string; MobileNo?: string }) =>
    HttpClient.post<ApiResponse<any>>('/kot/print', { kotNo, ...payload }),

  applyNCKOT: (txnId: number, payload: { NCName: string; NCPurpose: string; userId: number }) =>
    HttpClient.put<ApiResponse<any>>(`/TAxnTrnbill/${txnId}/apply-nckot`, payload),

  getTableManagementById: (tableId: number) =>
    HttpClient.get<ApiResponse<any>>(`/tables/${tableId}`),

  // In ordernew.ts – add this if not present yet
getWaiterUsers: (outletId: number) =>
 HttpClient.get<ApiResponse<WaiterUser[]>>(
  '/users/waiters',
  {
    params: { outletid: outletId }
  }
)

}

export default OrdernewService
