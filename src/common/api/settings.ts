import { HttpClient } from '../helpers'

type KotPrinterPayload = {
  id?: number
  printer_name: string
  order_type: string
  size: string
  copies: number
  outletid: number
  enableKotPrint: boolean
  hotelid: string
}

type BillPrinterPayload = {
  id?: number
  printer_name: string
  order_type: string
  size: string
  copies: number
  outletid: number
  enableBillPrint: boolean
  hotelid: string
}

type LabelPrinterPayload = {
  id?: number
  printer_name: string
  paper_width: number
  is_enabled: boolean
  outletid: number
  hotelid: string
}

type ReportPrinterPayload = {
  id?: number
  printer_name: string
  paper_size: string
  auto_print: boolean
  outletid: number
  hotelid: string
}

type DepartmentPrinterPayload = {
  id?: number
  department: string
  printer_name: string
  order_type: string
  size: string
  copies: number
  outletid: number
  hotelid: string
}

type TableWiseKotPayload = {
  id?: number
  table_no: string
  printer_name: string
  size: string
  copies: number
}

type TableWiseBillPayload = {
  id?: number
  table_no: string
  printer_name: string
  size: string
  copies: number
}

type CategoryPrinterPayload = {
  id?: number
  category: string
  printer_name: string
  order_type: string
  size: string
  copies: number
}

type KDSUserPayload = {
  id?: number
  department: string
  user: string
  is_active: boolean
  updated_at: string
}

const SettingsService = {
  // KOT Printers
  listKotPrinters: (params?: { q?: string }) => {
    return HttpClient.get('/settings/kot-printer-settings', { params })
  },
  createKotPrinter: (payload: KotPrinterPayload) => {
    return HttpClient.post('/settings/kot-printer-settings', payload)
  },
  updateKotPrinter: (id: number, payload: KotPrinterPayload) => {
    return HttpClient.put(`/settings/kot-printer-settings/${id}`, payload)
  },
  deleteKotPrinter: (id: number) => {
    return HttpClient.delete(`/settings/kot-printer-settings/${id}`)
  },

  // Bill Printers
  listBillPrinters: (params?: { q?: string }) => {
    return HttpClient.get('/settings/bill-printer-settings', { params })
  },
  createBillPrinter: (payload: BillPrinterPayload) => {
    return HttpClient.post('/settings/bill-printer-settings', payload)
  },
  updateBillPrinter: (id: number, payload: BillPrinterPayload) => {
    return HttpClient.put(`/settings/bill-printer-settings/${id}`, payload)
  },
  deleteBillPrinter: (id: number) => {
    return HttpClient.delete(`/settings/bill-printer-settings/${id}`)
  },

  // Label Printers
  listLabelPrinters: (params?: { q?: string }) => {
    return HttpClient.get('/settings/label-printer', { params })
  },
  createLabelPrinter: (payload: LabelPrinterPayload) => {
    return HttpClient.post('/settings/label-printer', payload)
  },
  updateLabelPrinter: (id: number, payload: LabelPrinterPayload) => {
    return HttpClient.put(`/settings/label-printer/${id}`, payload)
  },
  deleteLabelPrinter: (id: number) => {
    return HttpClient.delete(`/settings/label-printer/${id}`)
  },

  // Report Printers
  listReportPrinters: (params?: { q?: string }) => {
    return HttpClient.get('/settings/report-printer', { params })
  },
  createReportPrinter: (payload: ReportPrinterPayload) => {
    return HttpClient.post('/settings/report-printer', payload)
  },
  updateReportPrinter: (id: number, payload: ReportPrinterPayload) => {
    return HttpClient.put(`/settings/report-printer/${id}`, payload)
  },
  deleteReportPrinter: (id: number) => {
    return HttpClient.delete(`/settings/report-printer/${id}`)
  },

  // Department Printers
  listDepartmentPrinters: (params?: { q?: string }) => {
    return HttpClient.get('/settings/department-wise-printer', { params })
  },
  createDepartmentPrinter: (payload: DepartmentPrinterPayload) => {
    return HttpClient.post('/settings/department-wise-printer', payload)
  },
  updateDepartmentPrinter: (id: number, payload: DepartmentPrinterPayload) => {
    return HttpClient.put(`/settings/department-wise-printer/${id}`, payload)
  },
  deleteDepartmentPrinter: (id: number) => {
    return HttpClient.delete(`/settings/department-wise-printer/${id}`)
  },

  // Table Wise KOT
  listTableWiseKot: (params?: { q?: string }) => {
    return HttpClient.get('/settings/table-wise-kot', { params })
  },

  // Table Wise Bill
  listTableWiseBill: (params?: { q?: string }) => {
    return HttpClient.get('/settings/table-wise-bill', { params })
  },

  // Category Printers
  listCategoryPrinters: (params?: { q?: string }) => {
    return HttpClient.get('/settings/category-wise-printer', { params })
  },

  // KDS Users
  listKdsUsers: (params?: { q?: string }) => {
    return HttpClient.get('/settings/kds-users', { params })
  },
}

export default SettingsService
