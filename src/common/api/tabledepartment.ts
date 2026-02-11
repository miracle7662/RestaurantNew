import { HttpClient } from '../helpers'

type TableDepartmentPayload = {
  departmentid?: number
  department_name: string
  outletid: string
  taxgroupid: string
  status: number
  created_by_id?: string
  created_date?: string
  updated_by_id?: string
  updated_date?: string
}

function TableDepartmentService() {
  return {
    list: (params?: { q?: string; hotelid?: number; outletid?: number }) => {
      return HttpClient.get('/table-department', { params })
    },
    create: (payload: TableDepartmentPayload) => {
      return HttpClient.post('/table-department', payload)
    },
    update: (id: number, payload: TableDepartmentPayload) => {
      return HttpClient.put(`/table-department/${id}`, payload)
    },
    remove: (id: number) => {
      return HttpClient.delete(`/table-department/${id}`)
    },
  }
}

export default TableDepartmentService()
