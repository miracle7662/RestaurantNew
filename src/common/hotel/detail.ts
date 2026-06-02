// detail.ts
import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

export interface Detail {
  detail_id: number
  checkin_id: number
  hotelid: number
  room_id: number
  room_number: string
  room_category_id: number
  room_category_name: string
  converted_category_id: number
  converted_category_name: string
  checkin_datetime: string
  checkout_datetime: string
  no_of_days: number
  adults: number
  pax: number
  ex_pax: number
  child_unpaid: number
  driver: number
  room_tariff: number
  ex_pax_charge: number
  child_paid_amount: number
  driver_charge: number
  discount_percent: number
  discount_amount: number
  cgst_percent: number
  cgst_amount: number
  sgst_percent: number
  sgst_amount: number
  igst_percent: number
  igst_amount: number
  cess_percent: number
  cess_amount: number
  service_charge: number
  service_charge_amount: number
  parent_detail_id: number
  is_checkout: number
  merged: number
  tax: number
  created_date: string
  updated_date: string
  created_by_id: number
  updated_by_id: number
}

export interface DetailPayload {
  checkin_id?: number
  hotelid?: number
  room_id?: number
  room_number?: string
  room_category_id?: number
  room_category_name?: string
  converted_category_id?: number
  converted_category_name?: string
  checkin_datetime?: string
  checkout_datetime?: string
  no_of_days?: number
  adults?: number
  pax?: number
  ex_pax?: number
  child_unpaid?: number
  driver?: number
  room_tariff?: number
  ex_pax_charge?: number
  child_paid_amount?: number
  driver_charge?: number
  discount_percent?: number
  discount_amount?: number
  cgst_percent?: number
  cgst_amount?: number
  sgst_percent?: number
  sgst_amount?: number
  igst_percent?: number
  igst_amount?: number
  cess_percent?: number
  cess_amount?: number
  service_charge?: number
  service_charge_amount?: number
  parent_detail_id?: number
  is_checkout?: number
  merged?: number
  tax?: number
}

export interface BulkDetailPayload {
  details: DetailPayload[]
}

const DetailService = {
  list: (params?: { checkin_id?: number; hotelid?: number }): Promise<ApiResponse<Detail[]>> =>
    HttpClient.get<ApiResponse<Detail[]>>('/details', { params }),

  get: (id: number): Promise<ApiResponse<Detail>> =>
    HttpClient.get<ApiResponse<Detail>>(`/details/${id}`),

  create: (payload: DetailPayload): Promise<ApiResponse<Detail>> =>
    HttpClient.post<ApiResponse<Detail>>('/details', payload),

  createBulk: (payload: BulkDetailPayload): Promise<ApiResponse<Detail[]>> =>
    HttpClient.post<ApiResponse<Detail[]>>('/details/bulk', payload),

  update: (id: number, payload: DetailPayload): Promise<ApiResponse<Detail>> =>
    HttpClient.put<ApiResponse<Detail>>(`/details/${id}`, payload),

  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/details/${id}`)
}

export default DetailService