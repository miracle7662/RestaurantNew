// common/api/frontdeskSettings.ts

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

export interface FrontdeskSetting {
  frontdesk_setting_id: number
  hotelid: number
  outletid: number
  checkout_time_setting: '12_NOON' | '24_HOURS'
  fixed_checkout_time: string | null
  created_by_id: number | null
  created_date: string
  updated_by_id: number | null
  updated_date: string
}

export interface FrontdeskSettingPayload {
  hotelid?: number
  outletid?: number
  checkout_time_setting?: '12_NOON' | '24_HOURS'
  fixed_checkout_time?: string | null
  created_by_id?: number | null
  updated_by_id?: number | null
}

export interface FrontdeskSettingFilters {
  hotelid?: number
  outletid?: number
}

const FrontdeskSettingAPI = {
  /**
   * Get all settings
   */
  list: (params?: FrontdeskSettingFilters): Promise<ApiResponse<FrontdeskSetting[]>> =>
    HttpClient.get<ApiResponse<FrontdeskSetting[]>>('/frontdesk-settings', {
      params,
    }),

    getByOutlet: (
  outletid: number
): Promise<ApiResponse<FrontdeskSetting>> =>
  HttpClient.get<ApiResponse<FrontdeskSetting>>(
    `/frontdesk-settings/outlet/${outletid}`
  ),

  /**
   * Create Setting
   */
  create: (
    payload: FrontdeskSettingPayload
  ): Promise<ApiResponse<FrontdeskSetting>> =>
    HttpClient.post<ApiResponse<FrontdeskSetting>>(
      '/frontdesk-settings',
      payload
    ),

  /**
   * Update Setting
   */
  update: (
    id: number,
    payload: FrontdeskSettingPayload
  ): Promise<ApiResponse<FrontdeskSetting>> =>
    HttpClient.put<ApiResponse<FrontdeskSetting>>(
      `/frontdesk-settings/${id}`,
      payload
    ),

  /**
   * Delete Setting
   */
  remove: (id: number): Promise<ApiResponse<FrontdeskSetting>> =>
    HttpClient.delete<ApiResponse<FrontdeskSetting>>(
      `/frontdesk-settings/${id}`
    ),
}

export default FrontdeskSettingAPI