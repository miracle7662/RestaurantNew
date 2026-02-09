import { HttpClient } from '../helpers'

type MarketPayload = {
  marketid?: number
  market_name: string
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

function MarketService() {
  return {
    list: (params?: { q?: string }) => {
      return HttpClient.get('/markets', { params })
    },
    create: (payload: MarketPayload) => {
      return HttpClient.post('/markets', payload)
    },
    update: (id: number, payload: MarketPayload) => {
      return HttpClient.put(`/markets/${id}`, payload)
    },
    remove: (id: number) => {
      return HttpClient.delete(`/markets/${id}`)
    },
  }
}

export default MarketService()
