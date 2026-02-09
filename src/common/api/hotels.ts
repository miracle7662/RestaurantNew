import { HttpClient } from '../helpers'

type HotelPayload = {
  hotelid?: number
  hotel_name: string
  short_name: string
  marketid: number
  phone: string
  email: string
  fssai_no: string
  trn_gstno: string
  panno: string
  website: string
  address: string
  stateid: number
  cityid: number
  hoteltypeid: number
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

function HotelService() {
  return {
    list: (params?: { role_level?: string; hotelid?: string; q?: string }) => {
      return HttpClient.get('/HotelMasters', { params })
    },
    create: (payload: HotelPayload) => {
      return HttpClient.post('/HotelMasters', payload)
    },
    update: (id: number, payload: HotelPayload) => {
      return HttpClient.put(`/HotelMasters/${id}`, payload)
    },
    remove: (id: number) => {
      return HttpClient.delete(`/HotelMasters/${id}`)
    },
    get: (id: number) => {
      return HttpClient.get(`/HotelMasters/${id}`)
    },
  }
}

export default HotelService()
