/**
 * Master Fetchers - Common API fetch functions using HttpClient
 * Refactored to use API services from src/common/api/
 */

import { toast } from 'react-toastify'

// Import all necessary API services
import CountryService from '@/common/api/countries'
import StateService from '@/common/api/states'
import CityService from '@/common/api/cities'
import MarketsService from '@/common/api/markets'
import HotelTypeService from '@/common/api/hoteltype'
import KitchenCategoryService from '@/common/api/kitchencategory'
import KitchenMainGroupService from '@/common/api/kitchenmaingroup'
import KitchenSubCategoryService from '@/common/api/kitchensubcategory'
import ItemGroupService from '@/common/api/itemgroup'
import ItemMainGroupService from '@/common/api/itemmaingroup'
import MenuService from '@/common/api/menu'
import TableManagementService from '@/common/api/tablemanagement'
import TaxGroupService from '@/common/api/taxgroups'
import UnitMasterService from '@/common/api/unitmaster'
import WarehousesService from '@/common/api/warehouses'
import TableDepartmentService from '@/common/api/tabledepartment'
import OutletDesignationService from '@/common/api/outletdesignation'
import UserTypeService from '@/common/api/usertype'
import OutletService from '@/common/api/outlet'
import RestTaxMasterService from '@/common/api/resttaxmaster'
import CustomerService from '@/common/api/customers'
import OutletUserService from '@/common/api/outletUser'




import RoomService from '@/common/hotel/room'
import CheckInService from '@/common/hotel/checkIn'
import AdvanceTransactionService from '@/common/hotel/advanceTransaction'

// Add this interface after your imports and before any other code
export interface CheckinFullDetailsRow {
  // Checkin Master
  checkin_id: number
  guest_id: number
  guest_name: string
  mobile: string
  address: string
  company_name: string
  emailed: string
  booking: string
  plan_name: string
  reg_no: string
  checkin_datetime: string
  checkout_datetime: string
  hotelid: number
  checkout_id: number

  // Checkin Detail
  detail_id: number
  room_id: number
  room_number: string
  room_category_name: string
  converted_category_name: string
  room_tariff: number
  discount_percent: number
  cgst_percent: number
  sgst_percent: number
  igst_percent: number
  is_settle: number
  detail_checkin_datetime: string
  detail_checkout_datetime: string
  detail_adults: number
  detail_pax: number
  detail_ex_pax: number
  detail_child_unpaid: number
  detail_driver: number
  detail_ex_pax_charge: number
  detail_child_paid_amount: number
  detail_driver_charge: number
  detail_cess_percent: number
  detail_service_charge: number
  parent_detail_id: number

  // Guest Folio
  folio_id: number
  transaction_type: string
  payment_method: string
  debit_amount: number
  credit_amount: number
  reference_number: string
  description: string
  folio_description: string | null;
  
  // Guest Room Charges
  guest_room_charges_id: number
  charge_room_id: number
  category_id: number
  pax_count: number
  pax_price: number
  pax_tax: number
  ex_pax_count: number
  ex_pax_price: number
  ex_pax_tax: number
  ex_pax_tax_percent: number
  ex_pax_total: number
  child_count: number
  child_price: number
  child_tax: number
  child_tax_percent: number
  child_total: number
  driver_count: number
  driver_price: number
  driver_tax: number
  driver_tax_percent: number
  driver_total: number
  total_amount: number
  charge_checkin_datetime: string
  charge_checkout_datetime: string
  charge_created_at: string
  charge_updated_at: string
}

// Also extend the CheckIn interface if needed
export interface ExtendedCheckIn  {
  guest_type?: string
  booking_type?: string
  agent_name?: string
  status?: string
}



// Type Definitions
export interface CountryItem {
  countryid: number
  country_name: string
  country_code: string
  country_capital: string
  status: number
}

export interface StateItem {
  stateid: number
  state_name: string
  status: number | string
}

export interface CityItem {
  cityid: number
  city_name: string
  isCoastal: boolean | number
  stateid: number
  countryid: number
  status: number
}

export interface MarketItem {
  marketid: number
  market_name: string
}

export interface HotelTypeItem {
  id: number
  hotel_type: string
  hoteltypeid: number
  hotelid: string
  marketid: string
}

export interface KitchenCategoryItem {
  kitchencategoryid: number
  Kitchen_Category: string
  status: number | string
}

export interface KitchenMainGroupItem {
  kitchenmaingroupid: number
  Kitchen_main_Group: string
  status: number | string
}

export interface KitchenSubCategoryItem {
  kitchensubcategoryid: number
  Kitchen_sub_category: string
  status: number | string
}

export interface ItemGroupItem {
  item_groupid: number
  itemgroupname: string
  status: number
  code?: string
  kitchencategoryid?: number | null
}

export interface ItemMainGroupItem {
  item_maingroupid: number
  item_group_name: string
  status: number
}

export interface User {
  role_level?: string
  hotelid?: number
}

export interface Brand {
  hotelid: number
  hotel_name: string
}

export interface DesignationItem {
  Designation: string
  designationid: number
  status: number
}

export interface UserTypeItem {
  User_type: string
  usertypeid: number
  status: string
}

export interface TableItem {
  tablemanagementid: number
  table_name: string
  outlet_name: string
  status: number
  departmentid: number
}

export interface MenuItem {
  restitemid: number
  menuid: number
  item_no: string | null
  item_name: string
  print_name: string | null
  short_name: string | null
  item_group_id: number | null
  groupname: string | null
  price: number
  status: number
  department_details?: Array<{
    itemdetailsid?: number
    restitemid: number
    departmentid: number
    department_name?: string
    item_rate: number
    unitid?: number
    servingunitid?: number
    IsConversion?: number
    hotelid?: number
    variant_value_id?: number
    variant_value_name?: string
    value_name?: string
    taxgroupid?: number
  }>
}

export interface HotelMasterItem {
  hotelid: number
  hotel_name: string
  marketid?: number
  short_name?: string
  phone?: string
  email?: string
  fssai_no?: string
  trn_gstno?: string
  panno?: string
  website?: string
  address?: string
  stateid?: number
  hoteltypeid?: number
  Masteruserid?: number
  status?: number
  created_by_id?: number
  created_date?: string
  updated_by_id?: number
  updated_date?: string
  market_name?: string
}

export interface TaxGroup {
  taxgroupid: number
  taxgroup_name: string
  status: number
}

export interface ShiftTypeItem {
  id: number
  shift_type: string
}

export interface unitmasterItem {
  unitid: number
  unit_name: string
  status: number
}

export interface WarehouseItem {
  warehouseid: number
  warehouse_name: string
}

export interface TableDepartmentItem {
  departmentid: number
  department_name: string
  status: number
}

export interface UserItem {
  userid: number
  full_name: string
  username: string
  hotel_name: string
  outlet_name: string
  outletid: number
  designation_name: string
  user_type_name: string
  role_level: string
}

// Fetch Functions using Common API Services

export const fetchCountries = async (
  setCountryItems: (data: CountryItem[]) => void,
  setCountryId: (id: number) => void,
  currentCountryId?: number,
) => {
  try {
    const response = await CountryService.list()
    // HttpClient returns the unwrapped response due to interceptor
    const data = Array.isArray(response.data) ? response.data : (response as any).data || []
    setCountryItems(data)
    if (data.length > 0 && !currentCountryId) {
      setCountryId(data[0].countryid)
    }
  } catch (err: any) {
    toast.error(err?.message || 'Failed to fetch countries')
    // console.error('Fetch countries error:', err)
    setCountryItems([])
  }
}

export const fetchStates = async (
  setStates: (data: StateItem[]) => void,
  setstateid: (id: number) => void,
  currentStateId?: number,
) => {
  try {
    const response = await StateService.list()
    // HttpClient returns the unwrapped response due to interceptor
    const data = Array.isArray(response.data) ? response.data : (response as any).data || []
    setStates(data)
    if (data.length > 0 && !currentStateId) {
      setstateid(data[0].stateid)
    }
  } catch (err: any) {
    toast.error(err?.message || 'Failed to fetch states')
    // console.error('Fetch states error:', err)
  }
}

export const fetchCities = async (
  stateId: number,
  setCityItems: (data: CityItem[]) => void,
  setCityId: (id: number) => void,
  currentCityId?: number,
) => {
  try {
    const response = await CityService.list({ q: stateId.toString() })
    // HttpClient returns the unwrapped response due to interceptor
    const data: CityItem[] = Array.isArray(response.data) ? response.data : (response as any).data || []
    setCityItems(data)

    if (data.length > 0 && !currentCityId) {
      setCityId(data[0].cityid)
    }
  } catch (err: any) {
    toast.error(err?.message || 'Failed to fetch cities')
    // console.error('Fetch cities error:', err)
  }
}

export const fetchMarkets = async (
  setMarkets: (data: MarketItem[]) => void,
  setMarketId: (id: number) => void,
  currentMarketId?: number,
) => {
  try {
    const response = await MarketsService.list()
    // HttpClient returns the unwrapped response due to interceptor (response.data)
    const data: MarketItem[] = response?.data || []
    setMarkets(data)
    if (data.length > 0 && !currentMarketId) {
      setMarketId(data[0].marketid)
    }
  } catch (err: any) {
    toast.error(err?.message || 'Failed to fetch markets')
    // console.error('Fetch markets error:', err)
  }
}

export const fetchHotelType = async (
  setHoteltype: (data: HotelTypeItem[]) => void,
  setHoteltypeid: (id: number) => void,
  currentHoteltypeid?: number,
) => {
  try {
    const response = await HotelTypeService.list()
    // HttpClient returns the unwrapped response due to interceptor
    const data: HotelTypeItem[] = Array.isArray(response.data) ? response.data : (response as any).data || []
    // console.log('Fetched hotel types:', data)
    setHoteltype(data)

    if (data.length > 0) {
      if (currentHoteltypeid) {
        setHoteltypeid(currentHoteltypeid)
      } else {
        setHoteltypeid(data[0].hoteltypeid)
      }
    }
  } catch (err: any) {
    toast.error(err?.message || 'Failed to fetch hotel types')
    // console.error('Fetch hotel type error:', err)
  }
}

export const fetchKitchenCategory = async (
  setKitchen_Category: (data: KitchenCategoryItem[]) => void,
  setkitchencategoryid: (id: number) => void,
  currentkitchencategoryid?: number,
  hotelid?: number,
) => {
  try {
    const response = await KitchenCategoryService.list({ q: hotelid?.toString() })
    // HttpClient returns the unwrapped response due to interceptor
    const data: KitchenCategoryItem[] = Array.isArray(response.data) ? response.data : (response as any).data || []
    setKitchen_Category(data)
    if (data.length > 0) {
      if (currentkitchencategoryid) {
        setkitchencategoryid(currentkitchencategoryid)
      } else {
        setkitchencategoryid(data[0].kitchencategoryid)
      }
    }
  } catch (err: any) {
    toast.error(err?.message || 'Failed to fetch kitchen categories')
    // console.error('Fetch kitchen categories error:', err)
    setKitchen_Category([])
  }
}

export const fetchKitchenMainGroup = async (
  setKitchen_main_Group: (data: KitchenMainGroupItem[]) => void,
  setkitchenmaingroupid: (id: number) => void,
  currentkitchenmaingroupid?: string,
) => {
  try {
    const response = await KitchenMainGroupService.list()
    // HttpClient returns the unwrapped response due to interceptor
    const data: KitchenMainGroupItem[] = Array.isArray(response.data) ? response.data : (response as any).data || []
    setKitchen_main_Group(data)
    if (data.length > 0) {
      if (currentkitchenmaingroupid) {
        setkitchenmaingroupid(Number(currentkitchenmaingroupid))
      } else {
        setkitchenmaingroupid(data[0].kitchenmaingroupid)
      }
    }
  } catch (err: any) {
    toast.error(err?.message || 'Failed to fetch kitchen main groups')
    // console.error('Fetch kitchen main groups error:', err)
    setKitchen_main_Group([])
  }
}

export const fetchKitchenSubCategory = async (
  setKitchen_sub_Category: (data: KitchenSubCategoryItem[]) => void,
  setkitchensubcategoryid: (id: number) => void,
  currentkitchensubcategoryid?: string,
) => {
  try {
    const response = await KitchenSubCategoryService.list()
    // HttpClient returns the unwrapped response due to interceptor
    const data: KitchenSubCategoryItem[] = Array.isArray(response.data) ? response.data : (response as any).data || []
    setKitchen_sub_Category(data)
    if (data.length > 0 && !currentkitchensubcategoryid) {
      setkitchensubcategoryid(data[0].kitchensubcategoryid)
    }
  } catch (err: any) {
    toast.error(err?.message || 'Failed to fetch kitchen sub categories')
    // console.error('Fetch kitchen sub categories error:', err)
  }
}

export const fetchItemGroup = async (
  setItemGroup: (data: ItemGroupItem[]) => void,
  setitemgroupid: (id: number) => void,
  currentitemgroupid?: string,
  hotelid?: number,
) => {
  try {
    const response = await ItemGroupService.list({ hotelid: hotelid?.toString() })
    // HttpClient returns the unwrapped response due to interceptor
    const data: ItemGroupItem[] = Array.isArray(response.data) ? response.data : (response as any).data || []
    setItemGroup(data)
    if (data.length > 0 && !currentitemgroupid) {
      setitemgroupid(data[0].item_groupid)
    }
  } catch (err: any) {
    toast.error(err?.message || 'Failed to fetch item groups')
    // console.error('Fetch item groups error:', err)
    setItemGroup([])
  }
}

export const fetchItemMainGroup = async (
  setItemMainGroup: (data: ItemMainGroupItem[]) => void,
  setitemmaingroupid: (id: number) => void,
  currentitemmaingroupid?: string,
  hotelid?: number,
) => {
  try {
    const response = await ItemMainGroupService.list({ hotelid: hotelid?.toString() })
    // HttpClient returns the unwrapped response due to interceptor
    const data: ItemMainGroupItem[] = Array.isArray(response.data) ? response.data : (response as any).data || []
    setItemMainGroup(data)
    if (data.length > 0 && !currentitemmaingroupid) {
      setitemmaingroupid(data[0].item_maingroupid)
    }
  } catch (err: any) {
    toast.error(err?.message || 'Failed to fetch item main groups')
    // console.error('Fetch item main groups error:', err)
    setItemMainGroup([])
  }
}

export const fetchItemGroupsWithMenuItems = async (
  setItemGroup: (data: ItemGroupItem[]) => void,
  setitemgroupid: (id: number) => void,
  currentitemgroupid?: string,
) => {
  try {
    // Using ItemGroupService.list() - you may need to add a specific endpoint
    const response = await ItemGroupService.list()
    // HttpClient returns the unwrapped response due to interceptor
    const data: ItemGroupItem[] = Array.isArray(response.data) ? response.data : (response as any).data || []
    setItemGroup(data)
    if (data.length > 0 && !currentitemgroupid) {
      setitemgroupid(data[0].item_groupid)
    }
  } catch (err: any) {
    toast.error(err?.message || 'Failed to fetch item groups with menu items')
    // console.error('Fetch item groups with menu items error:', err)
    setItemGroup([])
  }
}

export const fetchDesignation = async (
  setDesignation: (data: DesignationItem[]) => void,
  setdesignationid: (id: number) => void,
  currentdesignationid?: string,
) => {
  try {
    const response = await OutletDesignationService.list()
    // HttpClient returns the unwrapped response due to interceptor
    const data: DesignationItem[] = Array.isArray(response.data) ? response.data : (response as any).data || []
    setDesignation(data)
    if (data.length > 0 && !currentdesignationid) {
      setdesignationid(data[0].designationid)
    }
  } catch (err: any) {
    toast.error(err?.message || 'Failed to fetch designations')
    // console.error('Fetch designations error:', err)
    setDesignation([])
  }
}

export const fetchUserType = async (
  setUserType: (data: UserTypeItem[]) => void,
  setusertypeid: (id: number) => void,
  currentusertypeid?: string,
) => {
  try {
    const response = await UserTypeService.list()
    // HttpClient returns the unwrapped response due to interceptor
    const data: UserTypeItem[] = Array.isArray(response.data) ? response.data : (response as any).data || []
    setUserType(data)
    if (data.length > 0 && !currentusertypeid) {
      setusertypeid(data[0].usertypeid)
    }
  } catch (err: any) {
    toast.error(err?.message || 'Failed to fetch user types')
    // console.error('Fetch user types error:', err)
    setUserType([])
  }
}

export const fetchMenu = async (
  setMenuCategory: (data: MenuItem[]) => void,
  setmenuid: (id: number) => void,
  currentmenucategoryid?: string,
  hotelid?: number,
) => {
  try {
    const response = await MenuService.list(hotelid ? { hotelid } : undefined)
    // HttpClient returns the unwrapped response due to interceptor
    const rawData = Array.isArray(response.data) ? response.data : (response as any).data || []
    const data: MenuItem[] = rawData.map((item: any) => ({
      menuid: item.restitemid || item.menuid,
      item_no: String(item.item_no),
      item_name: item.item_name,
      print_name: item.print_name || item.item_name,
      short_name: item.short_name || '',
      item_group_id: item.item_group_id ?? null,
      price: item.price || 0,
      status: item.status,
    }))
    setMenuCategory(data)
    if (data.length > 0 && !currentmenucategoryid) {
      setmenuid(data[0].restitemid)
    }
  } catch (err: any) {
    toast.error(err?.message || 'Failed to fetch menu categories')
    // console.error('Fetch menu categories error:', err)
    setMenuCategory([])
  }
}

export const fetchTableManagement = async (
  setTableManagement: (data: TableItem[]) => void,
  settablemanagementid: (id: number) => void,
  currenttablemanagementid?: string,
) => {
  try {
    // console.log('Fetching table management from API')
    const response = await TableManagementService.list()
    // console.log('Table management response:', response)
    // HttpClient returns the unwrapped response due to interceptor
    if (response.success) {
      const data: TableItem[] = Array.isArray(response.data) ? response.data : (response as any).data || []
      // console.log('Table management data:', data)
      setTableManagement(data)
      if (data.length > 0 && !currenttablemanagementid) {
        settablemanagementid(data[0].tablemanagementid)
      }
    } else {
      throw new Error(response.message || 'Failed to fetch table management')
    }
  } catch (err: any) {
    toast.error(err?.message || 'Failed to fetch table management')
    // console.error('Fetch table management error:', err)
    setTableManagement([])
  }
}

export const fetchData = async (
  setTaxGroup: (data: any[]) => void,
  settaxgroupid: (id: number) => void,
  currenttaxgroupid?: string,
) => {
  try {
    const response = await TaxGroupService.list()
    // HttpClient returns the unwrapped response due to interceptor
    const taxGroups = (response as any).data?.taxGroups || []
    setTaxGroup(taxGroups)

    if (taxGroups.length > 0 && !currenttaxgroupid) {
      settaxgroupid(taxGroups[0].taxgroupid)
    }
  } catch (err: any) {
    toast.error(err?.message || 'Failed to fetch tax groups')
    // console.error('Fetch tax groups error:', err)
    setTaxGroup([])
  }
}

export const fetchunitmaster = async (
  setStockUnits: (data: unitmasterItem[]) => void,
  setStockUnit: (id: number) => void,
  currentStockUnit?: string,
) => {
  try {
    const response = await UnitMasterService.list()
    // HttpClient returns the unwrapped response due to interceptor
    const data = Array.isArray(response.data) ? response.data : (response as any).data || []
    setStockUnits(data)

    if (data.length > 0 && !currentStockUnit) {
      setStockUnit(data[0].unit_name)
    }
  } catch (err: any) {
    toast.error(err?.message || 'Failed to fetch stock units')
    // console.error('Fetch stock units error:', err)
    setStockUnits([])
  }
}

export const fetchBrands = async (
  user: User,
  setBrands: (brands: Brand[]) => void,
): Promise<void> => {
  try {
    // console.log('Fetching brands for user:', user)
    const params: { role_level?: string; hotelid?: number } = {}

    if (user?.role_level) {
      params.role_level = user.role_level
    }
    if (user?.role_level === 'hotel_admin' && user?.hotelid) {
      params.hotelid = user.hotelid
    }

    // HttpClient interceptor unwraps the response, so we get data directly
    const data = await OutletService.getBrands(params)
    // console.log('Brands response:', data)

    if (Array.isArray(data)) {
      setBrands(data)
    } else if (data?.data && Array.isArray(data.data)) {
      setBrands(data.data)
    } else {
      // console.error('Invalid brands response format:', data)
      toast.error('Invalid response from server')
    }
  } catch (error: any) {
    // console.error('Error fetching brands:', error)
    toast.error(error?.message || 'Failed to fetch brands. Please check if the backend server is running.')
  }
}

export const fetchOutlets = async (
  user: any,
  setOutlets: (data: any[]) => void,
  setLoading: (value: boolean) => void,
) => {
  try {
    setLoading(true)
     console.log('Fetching outlets...')

    const params: any = {
      role_level: user?.role_level,
      hotelid: user?.hotelid,
      brand_id: user?.brand_id,
    }

    if (user?.role_level === 'outlet_user' && Array.isArray(user?.outletids)) {
      params.outletid = user.outletids.join(',')
    } else if (user?.outletid) {
      params.outletid = user.outletid
    }

    if (user?.role_level === 'hotel_admin' && user?.userid != null) {
      params.created_by_id = user.userid
    }

    console.log('Fetching outlets with params:', params)
    console.log('Current user details:', {
      userid: user?.userid,
      role_level: user?.role_level,
      brand_id: user?.brand_id,
      hotelid: user?.hotelid,
      outletid: params.outletid,
    })

    const response = await OutletService.getOutlets(params)
     console.log('Outlet response:', response)

    if (response && response.data) {
      const sortedOutlets = response.data.sort((a: any, b: any) => {
        return new Date(a.registered_at || '').getTime() - new Date(b.registered_at || '').getTime()
      })
      setOutlets(sortedOutlets)
    } else {
      // console.error('Invalid response format:', response)
      toast.error('Invalid response from server')
    }
  } catch (error: any) {
    // console.error('Error fetching outlets:', error)
    toast.error(error?.message || 'Failed to fetch outlets. Please check if the backend server is running.')
  } finally {
    setLoading(false)
  }
}

export const fetchOutletsForDropdown = async (
  user: any,
  setOutlets: (data: any[]) => void,
  setLoading: (value: boolean) => void,
) => {
  try {
    setLoading(true)
    // console.log('Fetching outlets for dropdown...')

    const params = {
      role_level: user?.role_level || 'outlet_user',
      hotelid: user?.hotelid,
      userid: user?.id,
      brandId: user?.brand_id || null,
    }

    // console.log('Fetching dropdown outlets with params:', params)
    // console.log('Current user details:', {
    //   userid: user?.id,
    //   role_level: user?.role_level,
    //   brand_id: user?.brand_id,
    //   hotelid: user?.hotelid,
    // })

    const response = await OutletService.getOutletsForDropdown(params)
    // console.log('Dropdown outlet response:', response)

    if (response && response.data) {
      const sortedOutlets = response.data.sort((a: any, b: any) => {
        return a.outlet_name.localeCompare(b.outlet_name)
      })
      setOutlets(sortedOutlets)
      // console.log('Sorted outlets set:', sortedOutlets)
    } else {
      // console.error('Invalid response format:', response)
      toast.error('No outlets found or invalid response from server')
      setOutlets([])
    }
  } catch (error: any) {
    // console.error('Error fetching dropdown outlets:', error)
    if (error.response?.status === 404) {
      toast.error('Outlets endpoint not found. Please check backend route configuration.')
    } else if (error.response?.status === 400) {
      toast.error('User ID is required or invalid. Please check user authentication.')
    } else {
      toast.error(error?.message || 'Failed to fetch outlets for dropdown.')
    }
    setOutlets([])
  } finally {
    setLoading(false)
  }
}

import OrdersService from '@/common/api/orders'

export const fetchShiftTypes = async (
  setShiftTypes: (data: ShiftTypeItem[]) => void,
  setSelectedShift: (shiftType: string) => void,
  currentShiftId?: number,
) => {
  try {
    const response = await OrdersService.listShiftTypes()
    const data = Array.isArray(response?.data) ? response.data : []

    // Fallback static shifts if empty/missing
    const fallbackShifts: ShiftTypeItem[] = [
      { id: 1, shift_type: 'Morning' },
      { id: 2, shift_type: 'Evening' },
      { id: 3, shift_type: 'Night' }
    ]

    const shiftsToUse = data.length > 0 ? data : fallbackShifts
    setShiftTypes(shiftsToUse)

    if (shiftsToUse.length > 0 && !currentShiftId) {
      setSelectedShift(shiftsToUse[0].shift_type)
    }
  } catch (err: any) {
    toast.error('Failed to fetch shift types, using defaults')
    console.error('Fetch shift types error:', err)

    // Use fallback
    const fallbackShifts: ShiftTypeItem[] = [
      { id: 1, shift_type: 'Morning' },
      { id: 2, shift_type: 'Evening' },
      { id: 3, shift_type: 'Night' }
    ]
    setShiftTypes(fallbackShifts)
    if (!currentShiftId) {
      setSelectedShift('Morning')
    }
  }
}



export const fetchWarehouses = async (
  setWarehouses: (data: WarehouseItem[]) => void,
  setLoading: (loading: boolean) => void,
) => {
  try {
    setLoading(true)
    const response = await WarehousesService.list()
    // HttpClient returns the unwrapped response due to interceptor
    const data: WarehouseItem[] = Array.isArray(response.data) ? response.data : (response as any).data || []
    setWarehouses(data)
  } catch (err: any) {
    toast.error(err?.message || 'Failed to fetch warehouses')
    // console.error('Fetch warehouses error:', err)
    setWarehouses([])
  } finally {
    setLoading(false)
  }
}

export const fetchTableDepartment = async (
  setTableDepartment: (data: TableDepartmentItem[]) => void,
  settabledepartmentid: (id: number) => void,
  currenttabledepartmentid?: string,
  hotelid?: number,
) => {
  try {
    const response = await TableDepartmentService.list({ hotelid })
    // console.log('Table departments response:', response)
    // HttpClient returns the unwrapped response due to interceptor
    if (response.success) {
      const data: TableDepartmentItem[] = Array.isArray(response.data) ? response.data : (response as any).data || []
      // console.log('Table departments data:', data)
      setTableDepartment(data)
      if (data.length > 0 && !currenttabledepartmentid) {
        settabledepartmentid(data[0].departmentid)
      }
    } else {
      throw new Error(response.message || 'Failed to fetch table departments')
    }
  } catch (err: any) {
    toast.error(err?.message || 'Failed to fetch table departments')
    // console.error('Fetch table departments error:', err)
    setTableDepartment([])
  }
}

export const fetchUsers = async (
  setUsers: (data: UserItem[]) => void,
  setuserid: (id: number) => void,
  user: any,
) => {
  try {
    const params = {
      currentUserId: user?.id,
      roleLevel: user?.role_level,
      hotelId: user?.hotelid,
      outletid: user?.outletid,
    }
    // console.log('Fetching users with params:', params)
    // console.log('User object:', user)

    const response = await OutletUserService.getOutletUsers(params)
    // console.log('Users data received:', response.data)
    // HttpClient returns the unwrapped response due to interceptor
    const data: UserItem[] = Array.isArray(response.data) ? response.data : (response as any).data || []
    setUsers(data)
    if (data.length > 0 && !user?.id) {
      setuserid(data[0].userid)
    }
  } catch (err: any) {
    toast.error(err?.message || 'Failed to fetch users')
    // console.error('Fetch users error:', err)
    setUsers([])
  }
}

export const fetchCustomerByMobile = async (
  value: string,
  setCustomerName: (name: string) => void,
  setCustomerId: (id: number | null) => void,
  setCustomerAddress: (address: string) => void,
) => {
  try {
    const response = await CustomerService.getByMobile(value)
    // console.log('Customer API response:', response)

    // HttpClient returns the unwrapped response due to interceptor
    if (response.success === true && response.data && (response.data as any).customerid) {
      const customer = response.data as any
      setCustomerName(customer.name)
      setCustomerId(customer.customerid)
      setCustomerAddress(`${customer.address1 || ''} ${customer.address2 || ''}`.trim())
      // console.log('Customer found:', customer.name)
    } else {
      setCustomerName('')
      setCustomerAddress('')
      // console.log('Customer not found')
      setCustomerId(null)
    }
  } catch (err: any) {
    // console.error('Customer fetch error:', err)
    // For 404, treat as customer not found
    if (err?.message?.includes('404') || err?.response?.status === 404) {
      setCustomerName('')
      setCustomerAddress('')
      // console.log('Customer not found (404)')
      setCustomerId(null)
    } else {
      setCustomerName('')
      setCustomerAddress('')
      setCustomerId(null)
    }
  }
}

export const getTaxesByOutletAndDepartment = async (params: { outletid?: number; departmentid?: number }) => {
  try {
    const response = await RestTaxMasterService.list({ 
      q: params.outletid ? `outletid=${params.outletid}` : undefined
    })
    // HttpClient returns the unwrapped response due to interceptor
    return (response as any).data || response
  } catch (err: any) {
    // console.error('Error fetching taxes:', err)
    return { success: false }
  }
}








// ADD THIS NEW FUNCTION AT THE END OF THE FILE
// Add this at the top of the file, outside the function
const originalCheckinCache = new Map<string, string>();

export const fetchOccupiedRooms = async (
  hotelId: number,
  getMinutesLeft: (checkoutDatetime: string) => number,
  setOccupiedRooms: (rooms: any[]) => void,
  setLoadingOccupied: (loading: boolean) => void,
  setErrorOccupied: (error: string | null) => void,
) => {
  if (!hotelId) {
    console.log('❌ No hotelId provided');
    return;
  }
  
  console.log('🟢 Fetching occupied rooms for hotelId:', hotelId);
  setLoadingOccupied(true);
  setErrorOccupied(null);
  
  try {
    // ✅ Get all rooms with their statuses and colors
    console.log('📡 Fetching all rooms...');
    const roomsRes = await RoomService.getRooms(hotelId);
    const allRooms = (roomsRes.data?.rooms || []) as any[];
    console.log(`✅ Total rooms found: ${allRooms.length}`);
    
    // ✅ Get room categories with tariff and tax data using the meta endpoint
    console.log('📡 Fetching room categories...');
    const metaRes = await RoomService.getHotelBookingMeta(hotelId);
    const categories = (metaRes.data?.categories || []) as any[];
    const categoryMap = new Map<number, any>();
    categories.forEach((cat: any) => {
      categoryMap.set(cat.room_category_id, cat);
    });
    console.log(`✅ Total categories found: ${categories.length}`);
    
    // ✅ Create a map of room_id to room details (including status_color)
    const roomMap = new Map<number, any>();
    allRooms.forEach((room: any) => {
      const categoryData = categoryMap.get(room.room_category_id) || {};
      roomMap.set(room.room_id, {
        ...room,
        status_color: room.status_color || '',
        room_tariff: room.room_tariff || categoryData.room_tariff || 0,
        cgst_percent: categoryData.cgst_percent || 0,
        sgst_percent: categoryData.sgst_percent || 0,
        igst_percent: categoryData.igst_percent || 0,
        cess_percent: categoryData.cess_percent || 0,
        service_charge: categoryData.service_charge || 0,
        ex_pax_charge: categoryData.ex_pax_charge || 0,
        child_charge: categoryData.child_charge || 0,
        driver_charge: categoryData.driver_charge || 0,
      });
    });
    
    // ✅ Filter rooms with status 'occupied' (2) or 'Bill' (7)
    const occupiedRoomIds = allRooms
      .filter((room: any) => {
        const statusId = room.room_status_id;
        return statusId === 2 || statusId === 7;
      })
      .map((room: any) => room.room_id);
    
    console.log(`✅ Found ${occupiedRoomIds.length} occupied/Bill rooms`);
    
    if (occupiedRoomIds.length === 0) {
      console.log('⚠️ No occupied rooms found');
      setOccupiedRooms([]);
      setLoadingOccupied(false);
      return;
    }

    // ✅ Get all check-ins with details
    console.log('📡 Fetching all check-ins with details...');
    let allCheckins: any[] = [];
    
    try {
      const checkinsRes = await CheckInService.list({ 
        hotelid: hotelId,
        status: 'all'
      });
      allCheckins = (checkinsRes.data || []) as any[];
    } catch (err) {
      console.log('⚠️ Failed with status=all, trying without status...');
      const checkinsRes = await CheckInService.list({ 
        hotelid: hotelId
      });
      allCheckins = (checkinsRes.data || []) as any[];
    }
    
    console.log(`✅ Total check-ins found: ${allCheckins.length}`);
    
    // ✅ Group check-ins by room_id, keeping the latest one
    const roomCheckinMap = new Map<number, any>();
    allCheckins.forEach((checkin: any) => {
      const roomId = checkin.room_id;
      if (!roomCheckinMap.has(roomId)) {
        roomCheckinMap.set(roomId, checkin);
      } else {
        const existing = roomCheckinMap.get(roomId);
        const existingDate = new Date(existing.detail_checkin_datetime || existing.checkin_datetime || 0);
        const newDate = new Date(checkin.detail_checkin_datetime || checkin.checkin_datetime || 0);
        if (newDate > existingDate) {
          roomCheckinMap.set(roomId, checkin);
        }
      }
    });

    // ✅ Build occupied items with tariff and tax data
    const occupiedItems: any[] = [];
    const advanceSummaryCache = new Map<number, number>();
    
    for (const roomId of occupiedRoomIds) {
      const room = roomMap.get(roomId);
      if (!room) continue;
      
      const checkin = roomCheckinMap.get(roomId);
      const roomStatusId = room.room_status_id;
      
      console.log(`🔍 Processing room ${room.room_no} (status_id: ${roomStatusId})...`);
      
      let guestName = 'Unknown Guest';
      let checkinDatetime = new Date().toISOString();
      let checkoutDatetime = new Date().toISOString();
      let totalAmount = 0;
      let adults = 0;
      let pax = 0;
      let exPax = 0;
      let childCount = 0;
      let driverCount = 0;
      let paymentMethod = 'Cash';
      let discountPercent = 0;
      let totalNights = 0;
      let regNo = '';
      let booking = '';
      let planName = '';
      let checkinId = 0;
      let detailId = null;
      let roomTariff = room.room_tariff || 0;
      let originalCheckinDatetime = '';
      let masterCheckinDatetime = '';
      
      if (checkin) {
        guestName = checkin.guest_name || checkin.name || 'Unknown Guest';
        
        // ✅ CRITICAL FIX: Use master checkin_datetime (never changes)
        // The master checkin_datetime is the original check-in date
        masterCheckinDatetime = checkin.checkin_datetime || new Date().toISOString();
        
        // ✅ Use detail checkout datetime (updated on extension)
        checkoutDatetime = checkin.detail_checkout_datetime || checkin.checkout_datetime || new Date().toISOString();
        
        // ✅ For display, ALWAYS use master checkin_datetime
        checkinDatetime = masterCheckinDatetime;
        originalCheckinDatetime = masterCheckinDatetime;
        
        totalAmount = checkin.total_amount || 0;
        adults = checkin.detail_adults || checkin.adults || 0;
        pax = checkin.detail_pax || checkin.pax || 0;
        exPax = checkin.detail_ex_pax || 0;
        childCount = checkin.detail_child_unpaid || 0;
        driverCount = Number(checkin.detail_driver) || 0;
        paymentMethod = checkin.payment_method || 'Cash';
        discountPercent = checkin.discount_percent || checkin.detail_discount_percent || 0;
        totalNights = checkin.total_nights || 0;
        regNo = checkin.reg_no || '';
        booking = checkin.booking || '';
        planName = checkin.plan_name || '';
        checkinId = checkin.checkin_id || 0;
        detailId = checkin.detail_id || null;
        
        // ✅ Use checkin's room_tariff if available, otherwise fallback to room's tariff
        roomTariff = checkin.room_tariff || room.room_tariff || 0;
        
        console.log(`📝 Room ${room.room_no}: Master IN=${masterCheckinDatetime}, Detail OUT=${checkoutDatetime}`);
        
      } else if (roomStatusId === 7) {
        guestName = `Bill - Room ${room.room_no}`;
        if (room.guest_name) {
          guestName = room.guest_name;
        }
        const pastDate = new Date();
        pastDate.setHours(pastDate.getHours() - 1);
        checkoutDatetime = pastDate.toISOString();
        checkinDatetime = pastDate.toISOString();
        originalCheckinDatetime = checkinDatetime;
      } else {
        console.log(`⚠️ No check-in for room ${room.room_no}`);
        continue;
      }
      
      const minutesLeft = getMinutesLeft(checkoutDatetime);
      const isExpired = minutesLeft <= 0;
      
      // ✅ Get tax data from room (which now has category data)
      const cgstPercent = room.cgst_percent || 0;
      const sgstPercent = room.sgst_percent || 0;
      const igstPercent = room.igst_percent || 0;
      const cessPercent = room.cess_percent || 0;
      const serviceCharge = room.service_charge || 0;
      const totalTaxPercent = cgstPercent + sgstPercent + igstPercent + cessPercent + serviceCharge;
      
      // ✅ Calculate charges with tax (ROOM-wise and CHECKIN-wise)
      // Bug source: previous logic used a set of guest_room_charges_id and a shared map,
      // which can cause charge totals to be effectively treated as checkin-level.
      // Fix: aggregate directly using room_id for left side and across all rooms for right side.

      console.log('CHECKIN_ID', checkinId);

      console.log(
        'ALL ROOMS OF CHECKIN',
        allCheckins.filter((x: any) => Number(x.checkin_id) === Number(checkinId)),
      );

      const checkinNetRows = allCheckins.filter((ci: any) => {
        return (
          Number(ci.checkin_id) === Number(checkinId) &&
          ci.is_settle === 0 
          
        )
      });

      console.log(
        'CHECKIN_NET_ROWS (after filter ci.is_settle===0 and guest_room_charges_id!=null)',
        checkinNetRows.map((r: any) => ({
          room_id: r.room_id,
          total_amount: r.total_amount,
          guest_room_charges_id: r.guest_room_charges_id,
          is_settle: r.is_settle,
        })),
      );

      const roomNetRows = checkinNetRows.filter((ci: any) => {
        return Number(ci.room_id) === Number(room.room_id);
      });

      let roomNet = 0;
      let checkinAllRoomsNet = 0;

      if (checkinNetRows.length > 0) {
        roomNet = roomNetRows.reduce((sum: number, ci: any) => sum + (Number(ci.total_amount) || 0), 0);
        checkinAllRoomsNet = checkinNetRows.reduce((sum: number, ci: any) => sum + (Number(ci.total_amount) || 0), 0);
      } else {
        // Fallbacks to keep existing behavior when charges table rows are missing
        roomNet = Number(totalAmount) || 0;
        checkinAllRoomsNet = Number(totalAmount) || 0;
      }


      // ✅ Advance subtraction
      let pendingAdvanceForRoom = 0;
      if (checkinId) {
        try {
          const advRoomRes = await AdvanceTransactionService.getSummaryForRoom(checkinId, Number(room.room_id));
          pendingAdvanceForRoom = Number(advRoomRes.data?.pending_advance) || 0;
        } catch {
          pendingAdvanceForRoom = 0;
        }
      }

      let pendingAdvanceForCheckin = 0;
      if (checkinId) {
        if (advanceSummaryCache.has(checkinId)) {
          pendingAdvanceForCheckin = advanceSummaryCache.get(checkinId) || 0;
        } else {
          try {
            const advRes = await AdvanceTransactionService.getSummary(checkinId);
            pendingAdvanceForCheckin = Number(advRes.data?.pending_advance) || 0;
          } catch {
            pendingAdvanceForCheckin = 0;
          }
          advanceSummaryCache.set(checkinId, pendingAdvanceForCheckin);
        }
      }

      // ✅ Create occupied item with ALL required fields for price calculation
      occupiedItems.push({
        // Basic info
        checkin_id: checkinId,
        guest_name: guestName,
        guest_type: booking || 'WALK-IN-GUEST',
        booking_type: booking || 'WALK-IN-GUEST',
        agent_name: checkin?.agent_name || '',
        checkin_datetime: checkinDatetime, // ✅ Master checkin date (never changes)
        checkout_datetime: checkoutDatetime, // ✅ Detail checkout date (updated on extension)
        original_checkin_datetime: originalCheckinDatetime, // ✅ Same as master
        master_checkin_datetime: masterCheckinDatetime, // ✅ Explicit master date
        
        // Pax counts
        adults: adults,
        pax: pax,
        ex_pax: exPax,
        child_count: childCount,
        driver_count: driverCount,
        original_pax: pax || adults,
        
        // Payment and discount
        payment_method: paymentMethod,
        discount_percent: discountPercent,
        
        // Room details
        detail_id: detailId,
        room_id: room.room_id,
        room_no: room.room_no,
        room_category_id: room.room_category_id || 0,
        room_category_name: room.room_category_name || '',
        converted_category_name: checkin?.converted_category_name || '',
        
        // ✅ CRITICAL: Room tariff for price calculation
        room_tariff: roomTariff,
        
        // ✅ CRITICAL: Tax percentages for price calculation
        cgst_percent: cgstPercent,
        sgst_percent: sgstPercent,
        igst_percent: igstPercent,
        cess_percent: cessPercent,
        service_charge: serviceCharge,
        total_tax_percent: totalTaxPercent,
        
        // Extra charges per person
        ex_pax_charge: room.ex_pax_charge || 0,
        child_charge: room.child_charge || 0,
        driver_charge: room.driver_charge || 0,
        
        // Financials
        net_room_amount: roomNet - pendingAdvanceForRoom,
        total_all_rooms_net: checkinAllRoomsNet - pendingAdvanceForCheckin,
        pending_advance_for_room: pendingAdvanceForRoom,
        total_allowances: 0,
        charges: [],
        
        // Checkin reference
        checkin: checkin,
        detail: checkin,
        
        // Status and dates
        latest_charge_checkout_datetime: checkoutDatetime,
        isExpired: isExpired,
        minutesLeft: minutesLeft,
        room_status_id: roomStatusId,
        status: roomStatusId === 2 ? 'Occupied' : 'Bill',
        total_nights: totalNights,
        total_amount: roomNet - pendingAdvanceForRoom,
        reg_no: regNo,
        booking: booking,
        plan_name: planName,
        
        // Colors
        status_color: room.status_color || '',
        status_name: room.status_name || '',
      });
      
      console.log(`✅ Added room ${room.room_no}: IN=${checkinDatetime}, OUT=${checkoutDatetime}`);
    }
    
    setOccupiedRooms(occupiedItems);
    
    // 📊 Final summary
    console.log('📊 Final occupied rooms summary:');
    occupiedItems.forEach(item => {
      console.log(`  Room ${item.room_no}: IN=${item.checkin_datetime}, OUT=${item.checkout_datetime}`);
    });
    
  } catch (err) {
    console.error('❌ Failed to fetch occupied rooms:', err);
    setErrorOccupied('Failed to load occupied rooms: ' + (err as Error).message);
  } finally {
    setLoadingOccupied(false);
  }
};