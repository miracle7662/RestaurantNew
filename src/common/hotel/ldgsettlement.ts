import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

export interface LdgSettlement {
  SettlementID: number
  checkout_id: number
  checkinid: number
  ldg_bill_no: string | null
  guest_id: number | null
  guest_name: string
  room_id: number | null
  room_name: string
  room_no: string
  reg_no: string | null
  registration_no: string | null
  bill_no: string | null
  mobile: string
  hotelid: number
  outletid: number
  outletname: string
  PaymentTypeID: number | null
  PaymentType: string
  Amount: number
  TipAmount: number
  Receive: number
  Refund: number
  total_amount: number
  discount_amount: number
  advance_amt: number
  is_settle: number
  isSettled: number
  checkin_datetime: string | null
  checkout_datetime: string | null
  checkout_date: string | null
  total_nights: number
  userid: number | null
  created_by_id: number | null
  updated_by_id: number | null
  InsertDate: string
  UpdateDate: string
  checked_out_rooms: string
  
  // Grouped/display fields (from API)
  display_bill_no?: string
  display_guest_name?: string
  display_room?: string
  SettlementIDs?: number[]
  PaymentTypes?: string[]
  paymentBreakdown?: Record<string, number>
  rooms?: string[]
}

export interface LdgSettlementPayload {
  userid?: number
  PaymentTypeID?: number | null
  PaymentType: string
  Amount: number
  TipAmount?: number
  Receive?: number
  Refund?: number
  HotelID: number
  outletid: number
  outletname?: string
  
  // LDG specific fields
  checkout_id: number
  checkinid: number
  ldg_bill_no?: string | null
  guest_id?: number | null
  guest_name?: string
  room_id?: number | null
  room_name?: string
  room_no?: string
  reg_no?: string | null
  registration_no?: string | null
  bill_no?: string | null
  mobile?: string
  
  total_amount: number
  discount_amount?: number
  advance_amt?: number
  
  checkin_datetime?: string | null
  checkout_datetime?: string | null
  checkout_date?: string | null
  total_nights?: number
  
  created_by_id?: number | null
  updated_by_id?: number | null
}

export interface ReplaceSettlementPayload {
  checkoutId: number
  checkinId: number
  newSettlements: Array<{
    PaymentTypeID?: number | null
    PaymentType: string
    Amount: number
    TipAmount?: number
    Receive?: number
    Refund?: number
    guest_id?: number | null
    guest_name?: string
    room_id?: number | null
    room_name?: string
    room_no?: string
    reg_no?: string | null
    registration_no?: string | null
    bill_no?: string | null
    mobile?: string
    outletid?: number
    outletname?: string
    total_amount?: number
    discount_amount?: number
    advance_amt?: number
    total_nights?: number
    userid?: number
    created_by_id?: number
  }>
  HotelID: number
  outletId?: number
  updated_by_id?: number | null
  checkout_date?: string | null
  ldg_bill_no?: string | null
  total_nights: number,   // ✅ use this
}

export interface SettlementSummary {
  total_settled: number
  total_tip: number
  total_receive: number
  total_refund: number
  payment_count: number
  payment_types: string
}

export interface UpdateStatusPayload {
  checkoutId: number
  checkinId: number
  roomIds?: number[]
  isSettled?: number
}

const LdgSettlementService = {
  // Get settlements with filters
  list: (params?: {
    hotelId?: number
    outletId?: number
    checkinId?: number
    checkoutId?: number
    guestName?: string
    roomNo?: string
    ldgBillNo?: string
    billNo?: string
    fromDate?: string
    toDate?: string
    paymentType?: string
    isSettled?: number | string
    limit?: number
    offset?: number
  }): Promise<ApiResponse<LdgSettlement[]>> =>
    HttpClient.get<ApiResponse<LdgSettlement[]>>('/ldg-settlement', { params }),

  // Get settlement by ID
  getById: (id: number): Promise<ApiResponse<LdgSettlement>> =>
    HttpClient.get<ApiResponse<LdgSettlement>>(`/ldg-settlement/${id}`),

  // Create new settlement
  create: (payload: LdgSettlementPayload): Promise<ApiResponse<LdgSettlement>> =>
    HttpClient.post<ApiResponse<LdgSettlement>>('/ldg-settlement', payload),

  // Update settlement
  update: (id: number, payload: Partial<LdgSettlementPayload>): Promise<ApiResponse<LdgSettlement>> =>
    HttpClient.put<ApiResponse<LdgSettlement>>(`/ldg-settlement/${id}`, payload),

  // Replace settlements (for editing)
  replace: (payload: ReplaceSettlementPayload): Promise<ApiResponse<null>> =>
    HttpClient.put<ApiResponse<null>>('/ldg-settlement/replace', payload),

  // Delete/Reverse settlement
  remove: (id: number, data?: { updated_by_id?: number; reason?: string }): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/ldg-settlement/${id}`, { data }),

  // Bulk update settlement status

  
  
}

export default LdgSettlementService