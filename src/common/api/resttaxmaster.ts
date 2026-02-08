import { HttpClient } from '../helpers'

type RestTaxMasterPayload = {
  resttaxid?: number
  hotelid: number
  outletid?: number | null
  isapplicablealloutlet: number
  resttax_name: string
  resttax_value: number
  restcgst: number
  restsgst: number
  restigst: number
  restcess: number
  taxgroupid: number
  status: number
  created_by_id?: number
  updated_by_id?: number
  created_date?: string
  updated_date?: string
}

function RestTaxMasterService() {
  return {
    list: (params?: { q?: string }) => {
      return HttpClient.get('/resttaxmaster', { params })
    },
    create: (payload: RestTaxMasterPayload) => {
      return HttpClient.post('/resttaxmaster', payload)
    },
    update: (id: number, payload: RestTaxMasterPayload) => {
      return HttpClient.put(`/resttaxmaster/${id}`, payload)
    },
    remove: (id: number) => {
      return HttpClient.delete(`/resttaxmaster/${id}`)
    },
  }
}

export default RestTaxMasterService()
