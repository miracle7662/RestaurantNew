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
    return HttpClient.get<KotPrinterPayload[]>('/settings/kot-printer-settings', { params })
  },
  createKotPrinter: (payload: KotPrinterPayload) => {
    return HttpClient.post<KotPrinterPayload>('/settings/kot-printer-settings', payload)
  },
  updateKotPrinter: (id: number, payload: KotPrinterPayload) => {
    return HttpClient.put<KotPrinterPayload>(`/settings/kot-printer-settings/${id}`, payload)
  },
  deleteKotPrinter: (id: number) => {
    return HttpClient.delete<void>(`/settings/kot-printer-settings/${id}`)
  },

  // Bill Printers
  listBillPrinters: (params?: { q?: string }) => {
    return HttpClient.get<BillPrinterPayload[]>('/settings/bill-printer-settings', { params })
  },
  createBillPrinter: (payload: BillPrinterPayload) => {
    return HttpClient.post<BillPrinterPayload>('/settings/bill-printer-settings', payload)
  },
  updateBillPrinter: (id: number, payload: BillPrinterPayload) => {
    return HttpClient.put<BillPrinterPayload>(`/settings/bill-printer-settings/${id}`, payload)
  },
  deleteBillPrinter: (id: number) => {
    return HttpClient.delete<void>(`/settings/bill-printer-settings/${id}`)
  },

  // Label Printers
  listLabelPrinters: (params?: { q?: string }) => {
    return HttpClient.get<LabelPrinterPayload[]>('/settings/label-printer', { params })
  },
  createLabelPrinter: (payload: LabelPrinterPayload) => {
    return HttpClient.post<LabelPrinterPayload>('/settings/label-printer', payload)
  },
  updateLabelPrinter: (id: number, payload: LabelPrinterPayload) => {
    return HttpClient.put<LabelPrinterPayload>(`/settings/label-printer/${id}`, payload)
  },
  deleteLabelPrinter: (id: number) => {
    return HttpClient.delete<void>(`/settings/label-printer/${id}`)
  },

  // Report Printers
  listReportPrinters: (params?: { q?: string }) => {
    return HttpClient.get<ReportPrinterPayload[]>('/settings/report-printer', { params })
  },
  getReportPrinterById: (id: number) => {
    return HttpClient.get<ReportPrinterPayload[]>(`/settings/report-printer/${id}`)
  },
  createReportPrinter: (payload: ReportPrinterPayload) => {
    return HttpClient.post<ReportPrinterPayload>('/settings/report-printer', payload)
  },
  updateReportPrinter: (id: number, payload: ReportPrinterPayload) => {
    return HttpClient.put<ReportPrinterPayload>(`/settings/report-printer/${id}`, payload)
  },
  deleteReportPrinter: (id: number) => {
    return HttpClient.delete<void>(`/settings/report-printer/${id}`)
  },

  // Department Printers
  listDepartmentPrinters: (params?: { q?: string }) => {
    return HttpClient.get<DepartmentPrinterPayload[]>('/settings/department-wise-printer', { params })
  },
  createDepartmentPrinter: (payload: DepartmentPrinterPayload) => {
    return HttpClient.post<DepartmentPrinterPayload>('/settings/department-wise-printer', payload)
  },
  updateDepartmentPrinter: (id: number, payload: DepartmentPrinterPayload) => {
    return HttpClient.put<DepartmentPrinterPayload>(`/settings/department-wise-printer/${id}`, payload)
  },
  deleteDepartmentPrinter: (id: number) => {
    return HttpClient.delete<void>(`/settings/department-wise-printer/${id}`)
  },

  // Table Wise KOT
  listTableWiseKot: (params?: { q?: string }) => {
    return HttpClient.get<TableWiseKotPayload[]>('/settings/table-wise-kot', { params })
  },

  // Table Wise Bill
  listTableWiseBill: (params?: { q?: string }) => {
    return HttpClient.get<TableWiseBillPayload[]>('/settings/table-wise-bill', { params })
  },

  // Category Printers
  listCategoryPrinters: (params?: { q?: string }) => {
    return HttpClient.get<CategoryPrinterPayload[]>('/settings/category-wise-printer', { params })
  },

  // KDS Users
  listKdsUsers: (params?: { q?: string }) => {
    return HttpClient.get<KDSUserPayload[]>('/settings/kds-users', { params })
  },
}

export default SettingsService
