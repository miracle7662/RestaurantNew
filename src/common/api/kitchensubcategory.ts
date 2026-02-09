import { HttpClient } from '../helpers'

type KitchenSubCategoryPayload = {
  Kitchen_sub_category: string
  kitchencategoryid: number
  kitchenmaingroupid: number
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
  hotelid?: string
  marketid?: string
}

function KitchenSubCategoryService() {
  return {
    list: (params?: { q?: string }) => {
      return HttpClient.get('/KitchenSubCategory', { params })
    },
    create: (payload: KitchenSubCategoryPayload) => {
      return HttpClient.post('/KitchenSubCategory', payload)
    },
    update: (id: string, payload: Partial<KitchenSubCategoryPayload>) => {
      return HttpClient.put(`/KitchenSubCategory/${id}`, payload)
    },
    remove: (id: string) => {
      return HttpClient.delete(`/KitchenSubCategory/${id}`)
    },
  }
}

export default KitchenSubCategoryService()
