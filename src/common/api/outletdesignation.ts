import { HttpClient } from '../helpers'

type OutletDesignationPayload = {
  designationid?: string
  Designation: string
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
  hotelid?: string
  marketid?: string
}

function OutletDesignationService() {
  return {
    list: (params?: { q?: string }) => {
      return HttpClient.get('/Designation', { params })
    },
    create: (payload: OutletDesignationPayload) => {
      return HttpClient.post('/Designation', payload)
    },
    update: (id: string, payload: OutletDesignationPayload) => {
      return HttpClient.put(`/Designation/${id}`, payload)
    },
    remove: (id: string) => {
      return HttpClient.delete(`/Designation/${id}`)
    },
  }
}

export default OutletDesignationService()
