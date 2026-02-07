import { HttpClient } from '../helpers'

type StatePayload = {
  stateid?: number
  state_name: string
  state_code: string
  state_capital?: string | null
  countryid?: string
  status: number
  created_by_id: number
  created_date: string
  updated_by_id: number
  updated_date: string
}


function StateService() {
  return {
    list: (params?: { q?: string }) => {
      return HttpClient.get('/states', { params })
    },
    create: (payload: StatePayload) => {
      return HttpClient.post('/states', payload)
    },
    update: (id: number, payload: StatePayload) => {
      return HttpClient.put(`/states/${id}`, payload)
    },
    remove: (id: number) => {
      return HttpClient.delete(`/states/${id}`)
    },
  }
}

export default StateService()
