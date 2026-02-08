import { HttpClient } from '../helpers'

type TableManagementPayload = {
  tableid?: number
  table_name: string
  outletid: string
  hotelid: string
  departmentid: string
  marketid: string
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

function TableManagementService() {
  return {
    list: (params?: { q?: string, search?: string }) => {
      return HttpClient.get('/tablemanagement', { params })
    },
    create: (payload: TableManagementPayload) => {
      return HttpClient.post('/tablemanagement', payload)
    },
    update: (id: number, payload: TableManagementPayload) => {
      return HttpClient.put(`/tablemanagement/${id}`, payload)
    },
    remove: (id: number) => {
      return HttpClient.delete(`/tablemanagement/${id}`)
    },
  }
}

export default TableManagementService()
