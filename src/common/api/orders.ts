// src/common/api/orders.ts
import axios from 'axios'
const API = axios.create({ baseURL: (import.meta as any)?.env?.VITE_API_URL || 'http://localhost:3001/api' })

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

export async function createBill(payload: {
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
}) {
  const { data } = await API.post('/TAxnTrnbill', payload)
  return data
}

export async function addItemToBill(id: number, details: BillDetail[]) {
  const { data } = await API.put(`/TAxnTrnbill/${id}`, { details })
  return data
}

export async function getBillById(id: number) {
  const { data } = await API.get(`/TAxnTrnbill/${id}`)
  return data
}

export async function settleBill(id: number, settlements: Array<{
  PaymentTypeID?: number
  PaymentType: string
  Amount: number
  Batch?: string
  Name?: string
  OrderNo?: string
  HotelID?: number
}>) {
  const { data } = await API.post(`/TAxnTrnbill/${id}/settle`, { settlements })
  return data
}

export async function getCustomerByMobile(mobile: string) {
  const { data } = await API.get(`/customer/by-mobile`, { params: { mobile } })
  return data
}

export async function getSavedKOTs(outletFilters?: { isBilled?: 0 | 1; tableId?: number }) {
  // Corrected endpoint to call the backend route for saved KOTs
  const { data } = await API.get(`/TAxnTrnbill/kots/saved`, { params: { isBilled: 0, ...outletFilters } })
  return data
}

<<<<<<< HEAD
export type TaxesResponse = {
  success: boolean
  data: {
    outletid: number | null
    departmentid: number
    taxgroupid: number | null
    taxes: { cgst: number; sgst: number; igst: number; cess: number }
=======
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

    getTableDepartments: (params?: any) => {
      return HttpClient.get('/table-department', { params })
    },

    getOutletSettings: (outletId: number) => {
      return HttpClient.get(`/outlets/outlet-settings/${outletId}`)
    },

    getPaymentModesByOutlet: (outletId: number) => {
      return HttpClient.get('/payment-modes/by-outlet', {
        params: { outletid: outletId },
      })
    },
>>>>>>> b044b2faf94dbb83c649281983b72ec824986f47
  }
}

export async function getTaxesByOutletAndDepartment(params: { outletid?: number | null; departmentid: number }) {
  const { data } = await API.get<TaxesResponse>(`/orders/taxes`, { params })
  return data
}

// KOT Management API functions
export async function createKOT(payload: {
  txnId: number;
  table_name?: string | null;
  tableId: number | null;
  items: Array<{
    ItemID: number;
    Qty: number;
    RuntimeRate: number;
    outletid?: number | null;
    ManualKOT?: boolean;
    SpecialInst?: string;
    isSetteled?: boolean;
    isNCKOT?: number;
    isCancelled?: boolean;
    DeptID?: number;
    HotelID?: number | null;
    isBilled?: number;
    CGST?: number;
    CGST_AMOUNT?: number;
    SGST?: number;
    SGST_AMOUNT?: number;
    IGST?: number;
    IGST_AMOUNT?: number;
    CESS?: number;
    CESS_AMOUNT?: number;
  }>;
  outletid: number | null;
  userId: number | null;
  hotelId: number | null;
  NCName?: string | null;
  NCPurpose?: string | null;
  DiscPer?: number;
  Discount?: number;
  DiscountType?: number;
  CustomerName?: string;
  MobileNo?: string;
  Order_Type?: string;
  TxnDatetime?: string;
  order_tag?: string;
  customerid?: number | null;
  Steward?: string;
  PAX?: number | null;

}) {
  const backendPayload = {
    txnId: payload.txnId,
    tableId: payload.tableId,
    table_name: payload.table_name,
    items: payload.items,
    outletid: payload.outletid,
    userId: payload.userId,
    hotelId: payload.hotelId,
    // Pass NCName and NCPurpose to the backend
    NCName: payload.NCName,
    NCPurpose: payload.NCPurpose,
    DiscPer: payload.DiscPer,
    Discount: payload.Discount,
    DiscountType: payload.DiscountType,
    CustomerName: payload.CustomerName,
    MobileNo: payload.MobileNo,
    Order_Type: payload.Order_Type,
    TxnDatetime: payload.TxnDatetime,
    customerid: payload.customerid,
    Steward: payload.Steward,
    PAX: payload.PAX,
  };
  const { data } = await API.post('/TAxnTrnbill/kot', backendPayload);
  return data;
}

export async function reverseKOT(payload: {
  txnId: number
  tableId: number
  itemId: number
  qtyToReverse?: number
}) {
  const { data } = await API.post('/TAxnTrnbill/kot/reverse', payload)
  return data
}

export async function getKOTList(tableId: number) {
  const { data } = await API.get('/TAxnTrnbill/kot/list', { params: { tableId } })
  return data
}

export async function getLatestKOTForTable(params: { tableId: string }) {
  const { data } = await API.get('/TAxnTrnbill/latest-kot', { params })
  return data
}

export async function getUnbilledItemsByTable(tableId: number) {
  const { data } = await API.get(`/TAxnTrnbill/unbilled-items/${tableId}`)
  return data
}

export async function getPendingOrders(type: 'pickup' | 'delivery') {
  const { data } = await API.get('/TAxnTrnbill/pending-orders', { params: { type } });
  return data;
}

export async function updatePendingOrder(id: number, data: { notes: string; items: any[]; linkedItems?: any[] }) {
  const { data: response } = await API.put(`/TAxnTrnbill/${id}/update`, data);
  return response;
}

export async function getLinkedPendingItems(orderId: number) {
  const { data } = await API.get(`/TAxnTrnbill/linked-pending-items/${orderId}`);
  return data;
}
