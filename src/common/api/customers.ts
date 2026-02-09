import { HttpClient } from '../helpers'

type CustomerPayload = {
  customerid?: number
  name: string
  countryCode: string
  mobile: string
  mail?: string
  cityid: string
  city_name: string
  address1: string
  address2?: string
  stateid: string
  state_name: string
  pincode?: string
  gstNo?: string
  fssai?: string
  panNo?: string
  aadharNo?: string
  birthday?: string
  anniversary?: string
  customerType: string
  status: number
  created_by_id?: number
  created_date?: string
  updated_by_id?: number
  updated_date?: string
}

function CustomerService() {
  return {
    list: (params?: { q?: string }) => {
      return HttpClient.get('/customer', { params })
    },
    create: (payload: CustomerPayload) => {
      return HttpClient.post('/customer', payload)
    },
    update: (id: number, payload: CustomerPayload) => {
      return HttpClient.put(`/customer/${id}`, payload)
    },
    remove: (id: number) => {
      return HttpClient.delete(`/customer/${id}`)
    },
  }
}

export default CustomerService()
