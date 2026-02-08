import { HttpClient } from '../helpers'

type TaxGroupPayload = {
  taxgroupid?: number
  taxgroup_name: string
  hotelid: number
  status: number
  created_by_id?: number
  updated_by_id?: number
  created_date?: string
  updated_date?: string
}

function TaxGroupService() {
  return {
    list: (params?: { q?: string }) => {
      return HttpClient.get('/taxgroup', { params })
    },
    create: (payload: TaxGroupPayload) => {
      return HttpClient.post('/taxgroup', payload)
    },
    update: (id: number, payload: TaxGroupPayload) => {
      return HttpClient.put(`/taxgroup/${id}`, payload)
    },
    remove: (id: number) => {
      return HttpClient.delete(`/taxgroup/${id}`)
    },
  }
}

export default TaxGroupService()
