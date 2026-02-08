import { HttpClient } from '../helpers'

type ItemMainGroupPayload = {
  item_maingroupid?: string
  item_group_name: string
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
  hotelid?: string
  marketid?: string
}

function ItemMainGroupService() {
  return {
    list: (params?: { q?: string }) => {
      return HttpClient.get('/ItemMainGroup', { params })
    },
    create: (payload: ItemMainGroupPayload) => {
      return HttpClient.post('/ItemMainGroup', payload)
    },
    update: (id: string, payload: ItemMainGroupPayload) => {
      return HttpClient.put(`/ItemMainGroup/${id}`, payload)
    },
    remove: (id: string) => {
      return HttpClient.delete(`/ItemMainGroup/${id}`)
    },
  }
}

export default ItemMainGroupService()
