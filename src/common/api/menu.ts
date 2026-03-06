/**
 * Menu Service - Clean API service for menu/item management operations
 * Uses HttpClient with interceptors for authentication
 * Returns ApiResponse<T> for consistent response handling
 */

import HttpClient from '../helpers/httpClient'
import { ApiResponse } from '@/types/api'

/* ═══════════════════════════════════════════════════════════════════════════════
 * Type Definitions
 * ═══════════════════════════════════════════════════════════════════════════════ */

export interface MenuItem {
  restitemid: number
  menuid: number
  hotelid: number | null
  hotel_name: string | null
  item_no: string | null
  item_name: string
  print_name: string | null
  short_name: string | null
  kitchen_category_id: number | null
  kitchen_sub_category_id: number | null
  kitchen_main_group_id: number | null
  item_group_id: number | null
  itemgroupname: string | null
  groupname: string | null
  item_main_group_id: number | null
  stock_unit: string | null
  price: number
  taxgroupid: number | null
  is_runtime_rates: number
  is_common_to_all_departments: number
  item_description: string | null
  item_hsncode: string | null
  status: number
  created_by_id: number | null
  created_date: string | null
  updated_by_id: number | null
  updated_date: string | null
  itemdetailsid: number | null
  outletid: number | null
  outlet_name: string | null
  item_rate: number | null
  unitid: number | null
  servingunitid: number | null
  IsConversion: number | null
  department_details?: DepartmentDetail[]
}

export interface DepartmentDetail {
  departmentid: number
  department_name: string
  item_rate: number
  unitid: number | null
  servingunitid: number | null
  IsConversion: number
  taxgroupid: number | null
  variant_value_id?: number
  variant_value_name?: string
  variant_rates?: { [variant_value_id: number]: number }
  value_name?: string | null
}

export interface VariantValue {
  variant_value_id: number
  value_name: string
  sort_order: number
  active: number
}

export interface VariantType {
  variant_type_id: number
  variant_type_name: string
  hotelid: number | null
  outletid: number | null
  sort_order: number
  active: number
  values: VariantValue[]
}

export interface DepartmentRate {
  departmentid: number
  departmentName: string
  rate: number
  half_rate: number
  full_rate: number
  unitid: number | null
  servingunitid: number | null
  IsConversion: number
  variant_rates: { [variant_value_id: number]: number }
  taxgroupid: number | null
  value_name: string | null
}

/** Menu payload for create/update */
export interface MenuPayload {
  hotelid: number | null
  outletid: number | null
  item_no: string | null
  item_name: string
  print_name: string | null
  short_name: string | null
  kitchen_category_id: number | null
  kitchen_sub_category_id: number | null
  kitchen_main_group_id: number | null
  item_main_group_id: number | null
  item_group_id: number | null
  stock_unit: number | null
  price: number
  taxgroupid: number | null
  is_runtime_rates: number
  is_common_to_all_departments: number
  item_description: string | null
  item_hsncode: string | null
  status: number
  updated_by_id?: number
  created_by_id?: number
  variant_type_id: number | null
  variant_values: number[]
  department_details: DepartmentDetail[]
}

export interface MenuListParams {
  hotelid?: number | string
  outletid?: number | string
  q?: string
}

/* ═══════════════════════════════════════════════════════════════════════════════
 * Menu Service
 * ═══════════════════════════════════════════════════════════════════════════════ */

const MenuService = {

  /* ═══════════════════════════════════════════════════════════════════════════
   * CRUD Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all menu items with optional filters
   */
  list: (params?: MenuListParams): Promise<ApiResponse<MenuItem[]>> =>
    HttpClient.get<ApiResponse<MenuItem[]>>('/menu', { params }),

  /**
   * Get a single menu item by ID
   */
  getById: (id: number): Promise<ApiResponse<MenuItem>> =>
    HttpClient.get<ApiResponse<MenuItem>>(`/menu/${id}`),

  /**
   * Create a new menu item
   */
  create: (payload: MenuPayload): Promise<ApiResponse<MenuItem>> =>
    HttpClient.post<ApiResponse<MenuItem>>('/menu', payload),

  /**
   * Update an existing menu item
   */
  update: (id: number, payload: MenuPayload): Promise<ApiResponse<MenuItem>> =>
    HttpClient.put<ApiResponse<MenuItem>>(`/menu/${id}`, payload),

  /**
   * Delete a menu item
   */
  remove: (id: number): Promise<ApiResponse<null>> =>
    HttpClient.delete<ApiResponse<null>>(`/menu/${id}`),

  /**
   * Update menu item status only
   */
  updateStatus: (id: number, status: number, updated_by_id?: number): Promise<ApiResponse<MenuItem>> =>
    HttpClient.put<ApiResponse<MenuItem>>(`/menu/${id}`, { status, updated_by_id }),

  /* ═══════════════════════════════════════════════════════════════════════════
   * Special Operations
   * ═══════════════════════════════════════════════════════════════════════════ */

  /**
   * Get all variant types with their values
   */
  getVariantTypes: (): Promise<ApiResponse<VariantType[]>> =>
    HttpClient.get<ApiResponse<VariantType[]>>('/menu/variant-types-with-values'),

  /**
   * Get the next available item number
   */
  getMaxItemNo: (hotelid?: number): Promise<ApiResponse<{ nextItemNo: string }>> =>
    HttpClient.get<ApiResponse<{ nextItemNo: string }>>('/menu/max-item-no', {
      params: hotelid ? { hotelid } : undefined
    })
}

export default MenuService

