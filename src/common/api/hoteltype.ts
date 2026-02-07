import { HttpClient } from '../helpers'

type HoteltypePayload = {
  hoteltypeid?: number
  hotelid?: string
  hotel_type: string
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

function HotelTypeService() {
  return {
    list: (params?: { q?: string }) => {
      return HttpClient.get('/hoteltype', { params })
    },
    create: (payload: HoteltypePayload) => {
      return HttpClient.post('/hoteltype', payload)
    },
    update: (id: number, payload: HoteltypePayload) => {
      return HttpClient.put(`/hoteltype/${id}`, payload)
    },
    remove: (id: number) => {
      return HttpClient.delete(`/hoteltype/${id}`)
    },
  }
}

export default HotelTypeService()
