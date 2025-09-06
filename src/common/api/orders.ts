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
  // If you have a custom endpoint use it; otherwise relies on your existing list endpoint supporting isBilled filter
  const { data } = await API.get(`/TAxnTrnbill`, { params: { isBilled: 0, ...outletFilters } })
  return data
}

export type TaxesResponse = {
  success: boolean
  data: {
    outletid: number | null
    departmentid: number
    taxgroupid: number | null
    taxes: { cgst: number; sgst: number; igst: number; cess: number }
  }
}

export async function getTaxesByOutletAndDepartment(params: { outletid?: number | null; departmentid: number }) {
  const { data } = await API.get<TaxesResponse>(`/orders/taxes`, { params })
  return data
}