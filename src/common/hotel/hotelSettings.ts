// services/hotelSettings.ts
import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

export interface HotelUiSettings {
  hotelid: number
  show_left_category: boolean
  show_room_text: boolean
  room_box_size: number
  // Background colors
  color_vacant: string
  color_occupied: string
  color_cleaning: string
  color_reserved: string
  color_maintenance: string
  color_reservation: string
  // Text colors
  text_color_vacant: string
  text_color_occupied: string
  text_color_cleaning: string
  text_color_reserved: string
  text_color_maintenance: string
  text_color_reservation: string
  // Border colors
  border_color_vacant: string
  border_color_occupied: string
  border_color_cleaning: string
  border_color_reserved: string
  border_color_maintenance: string
  border_color_reservation: string
  // Occupied warning colors
  occupied_warning_bg: string
  occupied_warning_text: string
  occupied_expired_bg: string
  occupied_expired_text: string
  dark_mode: boolean
}

export interface HotelSettingsPayload {
  hotelid: number
  show_left_category?: boolean
  show_room_text?: boolean
  room_box_size?: number
  color_vacant?: string
  color_occupied?: string
  color_cleaning?: string
  color_reserved?: string
  color_maintenance?: string
  color_reservation?: string
  text_color_vacant?: string
  text_color_occupied?: string
  text_color_cleaning?: string
  text_color_reserved?: string
  text_color_maintenance?: string
  text_color_reservation?: string
  border_color_vacant?: string
  border_color_occupied?: string
  border_color_cleaning?: string
  border_color_reserved?: string
  border_color_maintenance?: string
  border_color_reservation?: string
  occupied_warning_bg?: string
  occupied_warning_text?: string
  occupied_expired_bg?: string
  occupied_expired_text?: string
  dark_mode?: boolean
  updated_by_id?: number

  /**
   * UI-mode field is what backend `/settings/ui-mode` expects.
   * Your existing UI currently doesn’t send it, but we include it here
   * so the mapping can be correct if/when available.
   */
  ui_mode?: string
  outletid?: number
}

const HotelSettingsService = {
  // Backend routes for these UI options live under `settingsRoutes.js`.
  // The old endpoint `/hotel-settings` does not exist and returns 400.

  // GET /settings/ui-mode/:outletid
  get: (hotelId: number): Promise<ApiResponse<any>> =>
    HttpClient.get<ApiResponse<any>>(`/settings/ui-mode/${hotelId}`),

  // PUT /settings/ui-mode
  update: (payload: HotelSettingsPayload): Promise<ApiResponse<any>> => {
    // Map current payload to backend ui-mode format.
    // Backend expects: ui_mode, outletid, created_by_id (and optional hotelid)
    return HttpClient.put<ApiResponse<any>>('/settings/ui-mode', {
      ui_mode: payload.ui_mode || 'Orders',
      outletid: payload.outletid ?? payload.hotelid,
      created_by_id: payload.updated_by_id ?? 1,
      hotelid: payload.hotelid,
    } as any)
  },

  reset: (hotelId: number): Promise<ApiResponse<any>> =>
    HttpClient.put<ApiResponse<any>>('/settings/ui-mode', {
      ui_mode: 'Orders',
      outletid: hotelId,
      created_by_id: 1,
      hotelid: hotelId,
    } as any),
}

export default HotelSettingsService
