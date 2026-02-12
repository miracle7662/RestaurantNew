import { HttpClient } from '../helpers'
import { ApiResponse } from '@/types/api'

/* ─────────────── Entity Types ─────────────── */

export type Customer = {
  customerid: number
  name: string
  mobile: string
}

export type Bill = {
  TxnID: number
  TableID: number
  Amount: number
  status?: number
}

export type KOTItem = {
  kotNo: number
  itemId: number
  qty: number
  revQty: number
  TxnID: number
  orderNo: string
  TxnNo: string | null
  CustomerName ?: string
  MobileNo ?: string
  Address ?: string
  Landmark ?: string
  customerid ?: number
}

/* ─────────────── Payload Types ─────────────── */

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

export type UnbilledItemsResponse = {
  success: boolean
  message?: string
  data: {
    items: any[]
    reversedItems: any[]
    header: any
    kotNo?: number
  }
  header?: any
  error?: string
}

export type BillDetailsResponse = {
  success: boolean
  message?: string
  data: {
    details: any[]
    reversedItems: any[]
    header: any
  }
  error?: string
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

export type SettlementPayload = {
  PaymentTypeID?: number
  PaymentType: string
  Amount: number
  Batch?: string
  Name?: string
  OrderNo?: string
  HotelID?: number
}

/* ─────────────── Service ─────────────── */

function OrdernewService() {
  return {

    /* ================= BILL ================= */

    createBill: (payload: CreateBillPayload) =>
      HttpClient.post<ApiResponse<Bill>>('/TAxnTrnbill', payload),

    addItemToBill: (id: number, details: BillDetail[]) =>
      HttpClient.put<ApiResponse<Bill>>(`/TAxnTrnbill/${id}`, { details }),

    getBillById: (id: number) =>
      HttpClient.get<ApiResponse<Bill>>(`/TAxnTrnbill/${id}`),

    getAllBills: () =>
      HttpClient.get<ApiResponse<Bill[]>>('/TAxnTrnbill/all'),

    reverseBill: (txnId: number, payload: { userId: number }) =>
      HttpClient.post<ApiResponse<null>>(
        `/TAxnTrnbill/${txnId}/reverse`,
        payload
      ),

    markBillAsBilled: (
      txnId: number,
      payload: {
        outletId: number
        customerName?: string | null
        mobileNo?: string | null
        customerid?: number | null
      }
    ) =>
      HttpClient.put<ApiResponse<Bill>>(
        `/TAxnTrnbill/${txnId}/mark-billed`,
        payload
      ),

    /* ================= SETTLEMENT ================= */

    settleBill: (id: number, settlements: SettlementPayload[]) =>
      HttpClient.post<ApiResponse<Bill>>(
        `/TAxnTrnbill/${id}/settle`,
        { settlements }
      ),

    /* ================= KOT ================= */

    createKOT: (payload: any) =>
      HttpClient.post<ApiResponse<KOTItem>>('/TAxnTrnbill/kot', payload),

    createReverseKOT: (payload: {
      txnId: number
      tableId: number
      kotType: string
      isReverseKot: number
      reversedItems: any[]
      userId: number
      reversalReason: string
    }) =>
      HttpClient.post<ApiResponse<null>>(
        '/TAxnTrnbill/create-reverse-kot',
        payload
      ),

    getKOTList: (tableId: number) =>
      HttpClient.get<ApiResponse<KOTItem[]>>(
        '/TAxnTrnbill/kot/list',
        { params: { tableId } }
      ),

    /* ================= TABLE ================= */

    getUnbilledItemsByTable: (tableId: number) =>
      HttpClient.get<UnbilledItemsResponse>(
        `/TAxnTrnbill/unbilled-items/${tableId}`
      ),

    getBilledBillByTable: (tableId: number) =>
      HttpClient.get<BillDetailsResponse>(
        `/TAxnTrnbill/billed-bill/by-table/${tableId}`
      ),

    getBillDetails: (id: number) =>
      HttpClient.get<BillDetailsResponse>(`/TAxnTrnbill/${id}`),

    getBillStatus: (tableId: number) =>
      HttpClient.get<ApiResponse<{ status: number }>>(
        `/TAxnTrnbill/bill-status/${tableId}`
      ),

    updateTableStatus: (tableId: number, payload: { status: number }) =>
      HttpClient.put<ApiResponse<null>>(
        `/tablemanagement/${tableId}/status`,
        payload
      ),

    /* ================= CUSTOMER ================= */

    getCustomerByMobile: (mobile: string) =>
      HttpClient.get<ApiResponse<Customer>>(
        '/customer/by-mobile',
        { params: { mobile } }
      ),

    /* ================= DISCOUNT ================= */

    applyDiscount: (
      txnId: number,
      payload: {
        discount: number
        discPer: number
        discountType: number
        tableId: number
        items: any[]
      }
    ) =>
      HttpClient.post<ApiResponse<Bill>>(
        `/TAxnTrnbill/${txnId}/discount`,
        payload
      ),

    /* ================= MASTERS ================= */

    getTableManagement: () =>
      HttpClient.get<ApiResponse<any[]>>('/tablemanagement'),

    getPaymentModesByOutlet: (outletId: number) =>
      HttpClient.get<ApiResponse<any[]>>(
        '/payment-modes/by-outlet',
        { params: { outletid: outletId } }
      ),

    getMenu: (outletId: number) =>
      HttpClient.get<ApiResponse<any[]>>(
        '/menu',
        { params: { outletid: outletId } }
      ),

    verifyCreatorPassword: (password: string) =>
      HttpClient.post<ApiResponse<{ verified: boolean }>>(
        '/auth/verify-creator-password',
        { password }
      ),
  }
}

export default OrdernewService()
