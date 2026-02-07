import { HttpClient } from '../helpers'

type CountryPayload = {
countryid?: number
country_name: string
country_code: string
country_capital: string
status: number
created_by_id: number
created_date: string
updated_by_id: number
updated_date: string
}

function CountryService() {
  return {
    list: (params?: { q?: string }) => {
      return HttpClient.get('/countries', { params })
    },
    create: (payload: CountryPayload) => {
      return HttpClient.post('/countries', payload)
    },
    update: (id: number, payload: CountryPayload) => {
      return HttpClient.put(`/countries/${id}`, payload)
    },
    remove: (id: number) => {
      return HttpClient.delete(`/countries/${id}`)
    },
  }
}

export default CountryService()
