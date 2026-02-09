import { HttpClient } from '../helpers'

type WarehousePayload = {
  warehouseid?: string
  warehouse_name: string
  location: string
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
  hotelid?: string
  marketid?: string
  client_code?: string
  total_items?: number
}

function WarehouseService() {
  return {
    list: (params?: { q?: string }) => {
      return HttpClient.get('/warehouse', { params })
    },
    create: (payload: WarehousePayload) => {
      return HttpClient.post('/warehouse', payload)
    },
    update: (id: string, payload: WarehousePayload) => {
      return HttpClient.put(`/warehouse/${id}`, payload)
    },
    remove: (id: string) => {
      return HttpClient.delete(`/warehouse/${id}`)
    },
  }
}

export default WarehouseService()
