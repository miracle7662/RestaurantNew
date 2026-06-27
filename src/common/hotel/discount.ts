// services/discount.ts
import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

// ========================================
// TYPES
// ========================================

export interface ApplyDiscountPayload {
  detail_id: number
  checkin_id: number
  hotelid?: number
  discount_percent: number
  backdated_apply: boolean
  user_id?: number
}

export interface DiscountDetail {
  detail_id: number
  room_number: string
  room_tariff: number
  no_of_days: number
  discount_percent: number
  discount_amount: number
  checkin_datetime: string
  checkout_datetime: string
  folio_id: number | null
  debit_amount: number
  credit_amount: number
  description: string | null
  base_amount: number
  per_day_discount: number
  total_discount: number
}

export interface ApplyDiscountData {
  affected_rows: number
  discount_percent: number
  backdated_apply: boolean
  details: DiscountDetail[]
  count: number
}

export interface RemoveDiscountData {
  detail_id: number
  affected_rows: number
  details: DiscountDetail[]
  count: number
}

export interface DiscountSummary {
  total_rooms: number
  total_discount: number
  avg_discount_percent: number
  min_discount_percent: number
  max_discount_percent: number
  rooms_with_discount: number
  rooms_without_discount: number
}

// ========================================
// DISCOUNT SERVICE
// ========================================

const DiscountService = {
  /**
   * Apply discount to a room
   * POST /api/discount/apply
   */
  apply: (payload: ApplyDiscountPayload): Promise<ApiResponse<ApplyDiscountData>> => {
    return HttpClient.post<ApiResponse<ApplyDiscountData>>('/discount/apply', payload)
  },

  

  /**
   * ✅ Get ALL days for a specific room
   * GET /api/discount/room/:roomId
   */
  getRoomDetails: (
    params: { room_id: number; checkin_id: number }
  ): Promise<ApiResponse<DiscountDetail[]>> => {
    const { room_id, checkin_id } = params
    return HttpClient.get<ApiResponse<DiscountDetail[]>>(`/discount/room/${room_id}`, { 
      params: { checkin_id } 
    })
  },

  /**
   * Get discount summary
   * GET /api/discount/summary
   */


  /**
   * Get discount by detail ID
   * GET /api/discount/:detailId
   */


  /**
   * Remove discount
   * DELETE /api/discount/:detailId
   */
  remove: (
    detailId: number,
    params: {
      checkin_id: number
      hotelid?: number
      backdated_apply?: boolean
    }
  ): Promise<ApiResponse<RemoveDiscountData>> => {
    return HttpClient.delete<ApiResponse<RemoveDiscountData>>(`/discount/${detailId}`, { params })
  },

  
}

export default DiscountService