import { HttpClient } from '../helpers'

type ItemGroupPayload = {
  itemgroupname: string
  code: string
  kitchencategoryid: string
  status: number
  item_groupid?: string
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
  hotelid: string
  marketid: string
}

function ItemGroupService() {
  return {
    list: (params?: { q?: string }) => {
      return HttpClient.get('/ItemGroup', { params })
    },
    create: (payload: ItemGroupPayload) => {
      return HttpClient.post('/ItemGroup', payload)
    },
    update: (id: string, payload: ItemGroupPayload) => {
      return HttpClient.put(`/ItemGroup/${id}`, payload)
    },
    remove: (id: string) => {
      return HttpClient.delete(`/ItemGroup/${id}`)
    },
  }
}

export default ItemGroupService()
