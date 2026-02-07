import { HttpClient } from '../helpers'

type CityPayload = {
  cityid?: number
  city_name: string
  city_Code: string
  stateId?: number
  countryid?: string
  iscoastal: number
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}


function CityService() {
  return {
    list: (params?: { q?: string }) => {
      return HttpClient.get('/cities', { params })
    },
    create: (payload: CityPayload) => {
      return HttpClient.post('/cities', payload)
    },
    update: (id: number, payload: CityPayload) => {
      return HttpClient.put(`/cities/${id}`, payload)
    },
    remove: (id: number) => {
      return HttpClient.delete(`/cities/${id}`)
    },
    
  }
}

export default CityService()
