import { HttpClient } from '../helpers'

type MenuPayload = {
  hotelid: number
  outletid: number
  item_no?: string
  item_name: string
  print_name?: string
  short_name?: string
  kitchen_category_id?: number
  kitchen_sub_category_id?: number
  kitchen_main_group_id?: number
  item_main_group_id?: number
  item_group_id?: number
  stock_unit?: number
  price: number
  taxgroupid?: number
  is_runtime_rates: number
  is_common_to_all_departments: number
  item_description?: string
  item_hsncode?: string
  status: number
  created_by_id?: number
  updated_by_id?: number
  department_details?: Array<{
    departmentid: number
    department_name: string
    item_rate: number
    unitid?: number
    servingunitid?: number
    IsConversion: number
  }>
}

function MenuService() {
  return {
    list: (params?: { hotelid?: number; outletid?: number; q?: string }) => {
      return HttpClient.get('/menu', { params })
    },
    create: (payload: MenuPayload) => {
      return HttpClient.post('/menu', payload)
    },
    update: (id: number, payload: Partial<MenuPayload>) => {
      return HttpClient.put(`/menu/${id}`, payload)
    },
    remove: (id: number) => {
      return HttpClient.delete(`/menu/${id}`)
    },
    details: (id: number) => {
      return HttpClient.get(`/menu/${id}/details`)
    },
  }
}

export default MenuService()
