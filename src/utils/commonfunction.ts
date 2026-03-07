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
    console.error('Fetch countries error:', err)
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
    console.error('Fetch states error:', err)
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
    console.error('Fetch cities error:', err)
  }
}

export const fetchMarkets = async (
  setMarkets: (data: MarketItem[]) => void,
  setMarketId: (id: number) => void,
  currentMarketId?: number,
) => {
  try {
    const response = await MarketsService.list()
    // HttpClient returns the unwrapped response due to interceptor
    // response is already the array directly, not wrapped in an object
    const data: MarketItem[] = Array.isArray(response) ? response : []
    setMarkets(data)
    if (data.length > 0 && !currentMarketId) {
      setMarketId(data[0].marketid)
    }
  } catch (err: any) {
    toast.error(err?.message || 'Failed to fetch markets')
    console.error('Fetch markets error:', err)
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
    console.log('Fetched hotel types:', data)
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
    console.error('Fetch hotel type error:', err)
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
    console.error('Fetch kitchen categories error:', err)
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
    console.error('Fetch kitchen main groups error:', err)
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
    console.error('Fetch kitchen sub categories error:', err)
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
    console.error('Fetch item groups error:', err)
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
    console.error('Fetch item main groups error:', err)
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
    console.error('Fetch item groups with menu items error:', err)
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
    console.error('Fetch designations error:', err)
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
    console.error('Fetch user types error:', err)
    setUserType([])
  }
}

export const fetchMenu = async (
  setMenuCategory: (data: MenuItem[]) => void,
  setmenuid: (id: number) => void,
  currentmenucategoryid?: string,
) => {
  try {
    const response = await MenuService.list()
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
    console.error('Fetch menu categories error:', err)
    setMenuCategory([])
  }
}

export const fetchTableManagement = async (
  setTableManagement: (data: TableItem[]) => void,
  settablemanagementid: (id: number) => void,
  currenttablemanagementid?: string,
) => {
  try {
    console.log('Fetching table management from API')
    const response = await TableManagementService.list()
    console.log('Table management response:', response)
    // HttpClient returns the unwrapped response due to interceptor
    if (response.success) {
      const data: TableItem[] = Array.isArray(response.data) ? response.data : (response as any).data || []
      console.log('Table management data:', data)
      setTableManagement(data)
      if (data.length > 0 && !currenttablemanagementid) {
        settablemanagementid(data[0].tablemanagementid)
      }
    } else {
      throw new Error(response.message || 'Failed to fetch table management')
    }
  } catch (err: any) {
    toast.error(err?.message || 'Failed to fetch table management')
    console.error('Fetch table management error:', err)
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
    console.error('Fetch tax groups error:', err)
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
    console.error('Fetch stock units error:', err)
    setStockUnits([])
  }
}

export const fetchBrands = async (
  user: User,
  setBrands: (brands: Brand[]) => void,
): Promise<void> => {
  try {
    console.log('Fetching brands for user:', user)
    const params: { role_level?: string; hotelid?: number } = {}

    if (user?.role_level) {
      params.role_level = user.role_level
    }
    if (user?.role_level === 'hotel_admin' && user?.hotelid) {
      params.hotelid = user.hotelid
    }

    // HttpClient interceptor unwraps the response, so we get data directly
    const data = await OutletService.getBrands(params)
    console.log('Brands response:', data)

    if (Array.isArray(data)) {
      setBrands(data)
    } else if (data?.data && Array.isArray(data.data)) {
      setBrands(data.data)
    } else {
      console.error('Invalid brands response format:', data)
      toast.error('Invalid response from server')
    }
  } catch (error: any) {
    console.error('Error fetching brands:', error)
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
      console.error('Invalid response format:', response)
      toast.error('Invalid response from server')
    }
  } catch (error: any) {
    console.error('Error fetching outlets:', error)
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
    console.log('Fetching outlets for dropdown...')

    const params = {
      role_level: user?.role_level || 'outlet_user',
      hotelid: user?.hotelid,
      userid: user?.id,
      brandId: user?.brand_id || null,
    }

    console.log('Fetching dropdown outlets with params:', params)
    console.log('Current user details:', {
      userid: user?.id,
      role_level: user?.role_level,
      brand_id: user?.brand_id,
      hotelid: user?.hotelid,
    })

    const response = await OutletService.getOutletsForDropdown(params)
    console.log('Dropdown outlet response:', response)

    if (response && response.data) {
      const sortedOutlets = response.data.sort((a: any, b: any) => {
        return a.outlet_name.localeCompare(b.outlet_name)
      })
      setOutlets(sortedOutlets)
      console.log('Sorted outlets set:', sortedOutlets)
    } else {
      console.error('Invalid response format:', response)
      toast.error('No outlets found or invalid response from server')
      setOutlets([])
    }
  } catch (error: any) {
    console.error('Error fetching dropdown outlets:', error)
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

export const fetchShiftTypes = async (
  setShiftTypes: (data: ShiftTypeItem[]) => void,
  setSelectedShift: (shiftType: string) => void,
  currentShiftId?: number,
) => {
  try {
    // Note: ShiftTypes might need a dedicated service
    // Using direct fetch as fallback
    const res = await fetch('/api/orders/shift-types')
    const data: ShiftTypeItem[] = await res.json()
    setShiftTypes(data)
    if (data.length > 0 && !currentShiftId) {
      setSelectedShift(data[0].shift_type)
    }
  } catch (err: any) {
    toast.error(err?.message || 'Failed to fetch shift types')
    console.error('Fetch shift types error:', err)
    setShiftTypes([])
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
    console.error('Fetch warehouses error:', err)
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
    console.log('Table departments response:', response)
    // HttpClient returns the unwrapped response due to interceptor
    if (response.success) {
      const data: TableDepartmentItem[] = Array.isArray(response.data) ? response.data : (response as any).data || []
      console.log('Table departments data:', data)
      setTableDepartment(data)
      if (data.length > 0 && !currenttabledepartmentid) {
        settabledepartmentid(data[0].departmentid)
      }
    } else {
      throw new Error(response.message || 'Failed to fetch table departments')
    }
  } catch (err: any) {
    toast.error(err?.message || 'Failed to fetch table departments')
    console.error('Fetch table departments error:', err)
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
    console.log('Fetching users with params:', params)
    console.log('User object:', user)

    const response = await OutletUserService.getOutletUsers(params)
    console.log('Users data received:', response.data)
    // HttpClient returns the unwrapped response due to interceptor
    const data: UserItem[] = Array.isArray(response.data) ? response.data : (response as any).data || []
    setUsers(data)
    if (data.length > 0 && !user?.id) {
      setuserid(data[0].userid)
    }
  } catch (err: any) {
    toast.error(err?.message || 'Failed to fetch users')
    console.error('Fetch users error:', err)
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
    console.log('Customer API response:', response)

    // HttpClient returns the unwrapped response due to interceptor
    if (response.success === true && response.data && (response.data as any).customerid) {
      const customer = response.data as any
      setCustomerName(customer.name)
      setCustomerId(customer.customerid)
      setCustomerAddress(`${customer.address1 || ''} ${customer.address2 || ''}`.trim())
      console.log('Customer found:', customer.name)
    } else {
      setCustomerName('')
      setCustomerAddress('')
      console.log('Customer not found')
      setCustomerId(null)
    }
  } catch (err: any) {
    console.error('Customer fetch error:', err)
    // For 404, treat as customer not found
    if (err?.message?.includes('404') || err?.response?.status === 404) {
      setCustomerName('')
      setCustomerAddress('')
      console.log('Customer not found (404)')
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
    console.error('Error fetching taxes:', err)
    return { success: false }
  }
}
