import { HttpClient } from '../helpers'

type KitchenCategoryPayload = {
  kitchencategoryid?: number
  Kitchen_Category: string
  Description: string
  alternative_category_Description: string
  alternative_category_name: string
  digital_order_image: string | null
  categorycolor: string
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
  hotelid?: string
  marketid?: string
  kitchenmaingroupid?: number
}

function KitchenCategoryService() {
  return {
    list: (params?: { q?: string }) => {
      return HttpClient.get('/KitchenCategory', { params })
    },
    create: (payload: KitchenCategoryPayload) => {
      return HttpClient.post('/KitchenCategory', payload)
    },
    update: (id: number, payload: KitchenCategoryPayload) => {
      return HttpClient.put(`/KitchenCategory/${id}`, payload)
    },
    remove: (id: number) => {
      return HttpClient.delete(`/KitchenCategory/${id}`)
    },
  }
}

export default KitchenCategoryService()
