import { APICore } from './apiCore'

const api = new APICore()

// interface for outlet data
export interface OutletData {
  outletid?: number
  outlet_name: string
  hotelid?: number
  market_id?: string
  outlet_code?: string
  phone?: string
  email?: string
  website?: string
  address?: string
  city?: string
  zip_code?: string
  country?: string
  country_code?: string
  timezone?: string
  timezone_offset?: string
  start_day_time?: string
  close_day_time?: string
  next_reset_bill_date?: string
  next_reset_bill_days?: string
  next_reset_kot_date?: string
  next_reset_kot_days?: string
  contact_phone?: string
  notification_email?: string
  description?: string
  logo?: string
  gst_no?: string
  fssai_no?: string
  status?: number
  digital_order?: number
  registered_at?: string
  created_by_id?: number
  created_date?: string
  updated_by_id?: number
  updated_date?: string
  brand_name?: string
  billpreviewsetting_id?: number
  kot_printsetting_id?: number
  bill_printsetting_id?: number
  general_setting_id?: number
  online_ordersetting_id?: number
}

class OutletService {
  // Get brands/hotels for dropdown
  getBrands = (params?: { role_level?: string; hotelid?: number }) => {
    return api.get('/api/outlets/brands', params || {})
  }

  // Get all outlets
  getOutlets = (params?: { 
    brand_id?: number; 
    hotelid?: number; 
    role_level?: string;
    created_by_id?: number;
    outletid?: number;
  }) => {
    return api.get('/api/outlets', params || {})
  }

  // Get outlet by ID
  getOutletById = (id: number) => {
    return api.get(`/api/outlets/${id}`, {})
  }

  // Add new outlet
  addOutlet = (data: OutletData) => {
    return api.create('/api/outlets', data)
  }

  // Update outlet
  updateOutlet = (id: number, data: OutletData) => {
    return api.update(`/api/outlets/${id}`, data)
  }

  // Delete outlet
  deleteOutlet = (id: number) => {
    return api.delete(`/api/outlets/${id}`)
  }

  // Get outlets for dropdown
  getOutletsForDropdown = (params?: { role_level?: string; hotelid?: number; brandId?: number }) => {
    return api.get('/api/outlets', params || {})
  }
}

export default new OutletService() 