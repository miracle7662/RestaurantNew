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

// Interface for outlet settings
export interface OutletSettings {
  outletid: number;
  outlet_name: string;
  outlet_code: string;
  hotelid: number;
  brand_name: string;
  send_order_notification: string;
  bill_number_length: number;
  next_reset_order_number_date: string | null;
  next_reset_order_number_days: string;
  decimal_points: number;
  bill_round_off: boolean;
  enable_loyalty: boolean;
  multiple_price_setting: boolean;
  verify_pos_system_login: boolean;
  table_reservation: boolean;
  auto_update_pos: boolean;
  send_report_email: boolean;
  send_report_whatsapp: boolean;
  allow_multiple_tax: boolean;
  enable_call_center: boolean;
  bharatpe_integration: boolean;
  phonepe_integration: boolean;
  reelo_integration: boolean;
  tally_integration: boolean;
  sunmi_integration: boolean;
  zomato_pay_integration: boolean;
  zomato_enabled: boolean;
  swiggy_enabled: boolean;
  rafeeq_enabled: boolean;
  noon_food_enabled: boolean;
  magicpin_enabled: boolean;
  dotpe_enabled: boolean;
  cultfit_enabled: boolean;
  ubereats_enabled: boolean;
  scooty_enabled: boolean;
  dunzo_enabled: boolean;
  foodpanda_enabled: boolean;
  amazon_enabled: boolean;
  talabat_enabled: boolean;
  deliveroo_enabled: boolean;
  careem_enabled: boolean;
  jahez_enabled: boolean;
  eazydiner_enabled: boolean;
  radyes_enabled: boolean;
  goshop_enabled: boolean;
  chatfood_enabled: boolean;
  cutfit_enabled: boolean;
  jubeat_enabled: boolean;
  thrive_enabled: boolean;
  fidoo_enabled: boolean;
  mrsool_enabled: boolean;
  swiggystore_enabled: boolean;
  zomatormarket_enabled: boolean;
  hungerstation_enabled: boolean;
  instashop_enabled: boolean;
  eteasy_enabled: boolean;
  smiles_enabled: boolean;
  toyou_enabled: boolean;
  dca_enabled: boolean;
  ordable_enabled: boolean;
  beanz_enabled: boolean;
  cari_enabled: boolean;
  the_chefz_enabled: boolean;
  keeta_enabled: boolean;
  notification_channel: string;
  created_at: string;
  updated_at: string;
  [key: string]: any;
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

   getOutletSettings = (id: number) => {
    return api.get(`/api/outlets/settings/${id}`, {});
  };

  updateOutletSettings = (id: number, data: Partial<OutletSettings>) => {
    return api.update(`/api/outlets/settings/${id}`, data);
  };
}

export default new OutletService() 