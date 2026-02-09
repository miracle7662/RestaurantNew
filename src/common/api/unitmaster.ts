import { HttpClient } from '../helpers'

type UnitmasterPayload = {
  unitid?: number
  unit_name: string
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
  hotelid?: string
  client_code?: string
  marketid?: string
}

function UnitmasterService() {
  return {
    list: (params?: { q?: string }) => {
      return HttpClient.get('/unitmaster', { params })
    },
    create: (payload: UnitmasterPayload) => {
      return HttpClient.post('/unitmaster', payload)
    },
    update: (id: number, payload: UnitmasterPayload) => {
      return HttpClient.put(`/unitmaster/${id}`, payload)
    },
    remove: (id: number) => {
      return HttpClient.delete(`/unitmaster/${id}`)
    },
  }
}

export default UnitmasterService()
