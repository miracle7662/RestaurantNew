import { HttpClient } from '../helpers'

/* ─────────────── Types ─────────────── */

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

function OrderService() {
  return {
    /* Bills */
    createBill: (payload: CreateBillPayload) => {
      return HttpClient.post('/TAxnTrnbill', payload)
    },

    addItemToBill: (id: number, details: BillDetail[]) => {
      return HttpClient.put(`/TAxnTrnbill/${id}`, { details })
    },

    getBillById: (id: number) => {
      return HttpClient.get(`/TAxnTrnbill/${id}`)
    },

    getAllBills: () => {
      return HttpClient.get('/TAxnTrnbill/all')
    },

    getBillsByType: (type: string) => {
      return HttpClient.get(`/TAxnTrnbill/by-type/${type}`)
    },

    /* Settlement */
    settleBill: (id: number, settlements: SettlementPayload[]) => {
      return HttpClient.post(`/TAxnTrnbill/${id}/settle`, { settlements })
    },

    reverseBill: (txnId: number, payload: { userId: number }) => {
      return HttpClient.post(`/TAxnTrnbill/${txnId}/reverse`, payload)
    },

    markBillAsBilled: (
      txnId: number,
      payload: {
        outletId: number
        customerName?: string
        mobileNo?: string
        customerid?: number
      }
    ) => {
      return HttpClient.put(`/TAxnTrnbill/${txnId}/mark-billed`, payload)
    },

    /* KOT */
    createKOT: (payload: any) => {
      return HttpClient.post('/TAxnTrnbill/kot', payload)
    },

    reverseKOT: (payload: {
      txnId: number
      tableId: number
      itemId: number
      qtyToReverse?: number
    }) => {
      return HttpClient.post('/TAxnTrnbill/kot/reverse', payload)
    },

    createReverseKOT: (payload: {
      txnId: number
      tableId: number
      reversedItems: any[]
      userId: number
      reversalReason: string
    }) => {
      return HttpClient.post('/TAxnTrnbill/create-reverse-kot', payload)
    },

    getKOTList: (tableId: number) => {
      return HttpClient.get('/TAxnTrnbill/kot/list', { params: { tableId } })
    },

    getLatestKOTForTable: (params: { tableId: string }) => {
      return HttpClient.get('/TAxnTrnbill/latest-kot', { params })
    },

    getSavedKOTs: (params?: { isBilled?: 0 | 1; tableId?: number }) => {
      return HttpClient.get('/TAxnTrnbill/kots/saved', {
        params: { isBilled: 0, ...params },
      })
    },

    /* Table / Orders */
    getUnbilledItemsByTable: (tableId: number) => {
      return HttpClient.get(`/TAxnTrnbill/unbilled-items/${tableId}`)
    },

    getBilledBillByTable: (tableId: number) => {
      return HttpClient.get(`/TAxnTrnbill/billed-bill/by-table/${tableId}`)
    },

    getBillStatus: (tableId: number) => {
      return HttpClient.get(`/TAxnTrnbill/bill-status/${tableId}`)
    },

    updateTableStatus: (tableId: number, payload: { status: number }) => {
      return HttpClient.put(`/tablemanagement/${tableId}/status`, payload)
    },

    /* Customer */
    getCustomerByMobile: (mobile: string) => {
      return HttpClient.get('/customer/by-mobile', { params: { mobile } })
    },

    /* Discounts */
    applyDiscount: (
      txnId: number,
      payload: {
        discount: number
        discPer: number
        discountType: number
        tableId: number
        items: any[]
      }
    ) => {
      return HttpClient.post(`/TAxnTrnbill/${txnId}/discount`, payload)
    },

    applyNCKOT: (txnId: number, payload: { NCName: string; NCPurpose: string }) => {
      return HttpClient.put(`/TAxnTrnbill/${txnId}/apply-nckot`, payload)
    },

    /* Pending Orders */
    getPendingOrders: (type: 'pickup' | 'delivery') => {
      return HttpClient.get('/TAxnTrnbill/pending-orders', { params: { type } })
    },

    updatePendingOrder: (
      id: number,
      payload: { notes: string; items: any[]; linkedItems?: any[] }
    ) => {
      return HttpClient.put(`/TAxnTrnbill/${id}/update`, payload)
    },

    getLinkedPendingItems: (orderId: number) => {
      return HttpClient.get(`/TAxnTrnbill/linked-pending-items/${orderId}`)
    },

    /* Masters */
    getTableManagement: () => {
      return HttpClient.get('/tablemanagement')
    },

    getTableDepartments: () => {
      return HttpClient.get('/table-department')
    },

    getOutletSettings: (outletId: number) => {
      return HttpClient.get(`/outlets/outlet-settings/${outletId}`)
    },

    getPaymentModesByOutlet: (outletId: number) => {
      return HttpClient.get('/payment-modes/by-outlet', {
        params: { outletid: outletId },
      })
    },
  }
}

export default OrderService()  