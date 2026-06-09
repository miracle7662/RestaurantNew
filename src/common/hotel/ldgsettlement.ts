import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

export interface LdgSettlement {
  SettlementID: number
  TxnID: number | null
  TxnNo: string | null
  OrderNo: string | null
  userid: number
  PaymentTypeID: number
  PaymentType: string
  Amount: number
  TipAmount: number
  Batch: string
  Name: string
  HotelID: number
  InsertDate: string
  isSettled: number
  RefferedBy: string
  customerid: number | null
  CustomerName: string
  MobileNo: string
  Address: string
  Refund: number
  Receive: number
  Name2: string
  Name3: string
  table_name: string
  outletid: number
  outletname: string
  guest_id: number | null
  guest_name: string
  discount: number
  total_advance: number
  total_amount: number
  bill_no: string | null
  registration_no: string | null
  room_name: string
  checkinid: number
  created_by_id: number | null
  updated_by_id: number | null
  checkout_date: string | null
}

export interface LdgSettlementPayload {
  SettlementID?: number
  TxnID?: number | null
  TxnNo?: string | null
  OrderNo?: string | null
  userid: number
  PaymentTypeID: number
  PaymentType: string
  Amount: number
  TipAmount?: number
  Batch?: string
  Name?: string
  HotelID: number
  InsertDate?: string
  isSettled?: number
  RefferedBy?: string
  customerid?: number | null
  CustomerName?: string
  MobileNo?: string
  Address?: string
  Refund?: number
  Receive?: number
  Name2?: string
  Name3?: string
  table_name?: string
  outletid: number
  outletname?: string
  guest_id?: number | null
  guest_name?: string
  discount?: number
  total_advance?: number
  total_amount: number
  bill_no?: string | null
  registration_no?: string | null
  room_name?: string
  checkinid: number
  created_by_id?: number | null
  updated_by_id?: number | null
  checkout_date?: string | null
}

export interface ReplaceSettlementPayload {
  OrderNo?: string
  TxnNo?: string
  newSettlements: Array<{
    PaymentTypeID: number
    PaymentType: string
    Amount: number
    TipAmount?: number
    Refund?: number
    Receive?: number
    customerid?: number | null
    CustomerName?: string
    MobileNo?: string
    Address?: string
    Name?: string
    table_name?: string
    outletid?: number
    outletname?: string
    guest_id?: number | null
    guest_name?: string
    discount?: number
    total_advance?: number
    total_amount?: number
    bill_no?: string | null
    registration_no?: string | null
    room_name?: string
    checkinid?: number
    userid?: number
  }>
  HotelID: number
  updated_by_id?: number
  checkout_date?: string | null
}

const LdgSettlementService = {
  list: (params?: {
    orderNo?: string
    txnNo?: string
    hotelId?: number
    outletId?: number
    checkinId?: number
    roomName?: string
    guestName?: string
    fromDate?: string
    toDate?: string
    paymentType?: string
    isSettled?: number
  }): Promise<ApiResponse<LdgSettlement[]>> =>
    HttpClient.get<ApiResponse<LdgSettlement[]>>('/ldg-settlement', { params }),

  getById: (id: number): Promise<ApiResponse<LdgSettlement>> =>
    HttpClient.get<ApiResponse<LdgSettlement>>(`/ldg-settlement/${id}`),

  create: (payload: LdgSettlementPayload): Promise<ApiResponse<LdgSettlement>> =>
    HttpClient.post<ApiResponse<LdgSettlement>>('/ldg-settlement', payload),

  update: (id: number, payload: Partial<LdgSettlementPayload>): Promise<ApiResponse<LdgSettlement>> =>
    HttpClient.put<ApiResponse<LdgSettlement>>(`/ldg-settlement/${id}`, payload),

  remove: (id: number, data?: { updated_by_id?: number; reason?: string }): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/ldg-settlement/${id}`, { data }),

  replace: (payload: ReplaceSettlementPayload): Promise<ApiResponse<null>> =>
    HttpClient.post<ApiResponse<null>>('/ldg-settlement/replace', payload)
}

export default LdgSettlementService