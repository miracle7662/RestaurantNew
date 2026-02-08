import { HttpClient } from '../helpers'

type KitchenMainGroupPayload = {
  kitchenmaingroupid?: number
  Kitchen_main_Group: string
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
  hotelid: string
  marketid: string
}

function KitchenMainGroupService() {
  return {
    list: (params?: { q?: string }) => {
      return HttpClient.get('/KitchenMainGroup', { params })
    },
    create: (payload: KitchenMainGroupPayload) => {
      return HttpClient.post('/KitchenMainGroup', payload)
    },
    update: (id: number, payload: KitchenMainGroupPayload) => {
      return HttpClient.put(`/KitchenMainGroup/${id}`, payload)
    },
    remove: (id: number) => {
      return HttpClient.delete(`/KitchenMainGroup/${id}`)
    },
  }
}

export default KitchenMainGroupService()
