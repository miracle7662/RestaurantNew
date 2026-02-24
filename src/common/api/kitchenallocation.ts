/**
 * Kitchen Allocation Service - Clean API service for kitchen allocation operations
 * Uses HttpClient with interceptors for authentication
 * Returns the API response data directly
 */

import HttpClient from '../helpers/httpClient'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

/** Kitchen allocation data item */
export interface KitchenAllocationData {
  item_no: string
  item_name: string
  TotalQty: number
  Amount: number
}

/** Item detail data */
export interface ItemDetailData {
  item_name: string
  Qty: number
  Amount: number
  KOTNo: number | null
  TxnDatetime: string
  table_name: string | null
  TableID: number | null
}

/** Filter option */
export interface FilterOption {
  [key: string]: any
}

/** Kitchen allocation response */
export interface KitchenAllocationResponse {
  success: boolean
  message: string
  data: KitchenAllocationData[]
}

/** Item details response */
export interface ItemDetailsResponse {
  success: boolean
  message: string
  data: ItemDetailData[]
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Kitchen Allocation Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const KitchenAllocationService = {
  /**
   * Get kitchen allocation data
   */
  getAllocationData: (params: {
    fromDate: string
    toDate: string
    hotelId: string
    outletId?: string
    filterType?: string
    filterId?: string
  }): Promise<KitchenAllocationResponse> =>
    HttpClient.get<KitchenAllocationResponse>('/kitchen-allocation', { params }),

  /**
   * Get item details by item number
   */
  getItemDetails: (
    itemNo: string,
    params: {
      fromDate: string
      toDate: string
      hotelId: string
      outletId?: string
    }
  ): Promise<ItemDetailsResponse> =>
    HttpClient.get<ItemDetailsResponse>(`/kitchen-allocation/item-details/${itemNo}`, {
      params
    })
}

export default KitchenAllocationService
