import { HttpClient } from '../helpers'

type UsertypePayload = {
  usertypeid?: number
  hotelid?: string
  User_type: string
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

function UserTypeService() {
  return {
    list: (params?: { q?: string }) => {
      return HttpClient.get('/usertype', { params })
    },
    create: (payload: UsertypePayload) => {
      return HttpClient.post('/usertype', payload)
    },
    update: (id: number, payload: UsertypePayload) => {
      return HttpClient.put(`/usertype/${id}`, payload)
    },
    remove: (id: number) => {
      return HttpClient.delete(`/usertype/${id}`)
    },
  }
}

export default UserTypeService()
