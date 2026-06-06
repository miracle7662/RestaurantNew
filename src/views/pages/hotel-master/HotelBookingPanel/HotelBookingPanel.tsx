import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Form, Button, Modal, Offcanvas, Dropdown, Tab, Tabs } from 'react-bootstrap'
import { toast } from 'react-hot-toast'
import TitleHelmet from '@/components/Common/TitleHelmet'
import { useAuthContext } from '@/common/context/useAuthContext'
import RoomService from '@/common/hotel/room'
import RoomCategoryService from '@/common/hotel/roomCategoryService'
import FloorService from '@/common/hotel/floors'
import hotelSettingsApi, { HotelUiSettings } from '@/common/hotel/hotelSettings'
import CheckInService, { CheckIn } from '@/common/hotel/checkIn'
import DetailService, { Detail } from '@/common/hotel/detail'
import GuestFolioService, { GuestFolio } from '@/common/hotel/guestFolio'
import GuestRoomChargesService, { GuestRoomCharge } from '@/common/hotel/guestRoomCharges'
import PostChargesService, { PostCharge } from '@/common/hotel/postCharges'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import BrandService from '@/common/hotel/brand'
import ReservationService from '@/common/hotel/reservation'
import ReservationRoomService from '@/common/hotel/reservationRooms'
import AgentRoomCheckinService, { AgentRoomCheckin } from '@/common/hotel/agentRoomCheckin'
import AdvanceTransactionService from '@/common/hotel/advanceTransaction'
import CheckoutService, { CheckoutMaster } from '@/common/hotel/checkout'
import CheckoutPaymentService from '@/common/hotel/checkoutPayment'
import PostChargesModal from './PostChargesModal'
import ReceiptAgainstBillsModal from './ReceiptAgainstBillsModal'
import Advance from './Advance'
import RoomStatusModal from './RoomStatusModal'
import RoomStatusLogService, { RoomStatusLog } from '@/common/hotel/roomStatusLog'
import SettlementModal from './SettelmentModel';
import useauthcontext from '@/common/context/useAuthContext'
import PaymentModeService from '@/common/api/outletpaymentmode'
// ya jo bhi aapka payment modes service path hai



// Extend HotelUiSettings to include all color fields
// Extend HotelUiSettings to include all color fields
type ExtendedHotelSettings = HotelUiSettings & {
  color_maintenance?: string
  color_reservation?: string
  text_color_vacant?: string
  text_color_occupied?: string
  text_color_cleaning?: string
  text_color_reserved?: string
  text_color_maintenance?: string
  text_color_reservation?: string
  border_color_vacant?: string
  border_color_occupied?: string
  border_color_cleaning?: string
  border_color_reserved?: string
  border_color_maintenance?: string
  border_color_reservation?: string
  occupied_warning_bg?: string
  occupied_warning_text?: string
  occupied_expired_bg?: string
  occupied_expired_text?: string
}

// Default colors (fallback if settings not loaded)
const DEFAULT_STATUS_BG = {
  available: '#ffffff',
  occupied: '#DFF5E1',
  cleaning: '#FFF4CC',
  reserved: '#D9F1FF',
  maintenance: '#FFE0E0',
  reservation: '#D9F1FF',
}

const DEFAULT_STATUS_TEXT = {
  available: '#4B5563',
  occupied: '#16A34A',
  cleaning: '#D4A017',
  reserved: '#0284C7',
  maintenance: '#DC2626',
  reservation: '#0284C7',
}

const DEFAULT_STATUS_BORDER = {
  available: '#9CA3AF',
  occupied: '#4ADE80',
  cleaning: '#FACC15',
  reserved: '#38BDF8',
  maintenance: '#F87171',
  reservation: '#38BDF8',
}

// ==================== TYPE DEFINITIONS ====================
interface ApiRoom {
  room_id: number
  room_no: string
  room_name: string
  display_name?: string
  room_category_id: number
  room_status: 'available' | 'occupied' | 'cleaning' | 'reserved' | 'maintenance' | 'reservation'
  floor_id: number
  block_id?: number
  hotelid: number
  created_by_id?: number
  updated_by_id?: number
  created_date?: string
  updated_date?: string
}

interface ApiCategory {
  room_category_id: number
  category_name: string
  room_tariff?: number
  ex_pax_charge?: number
  child_charge?: number
  driver_charge?: number
  cgst_percent?: number
  sgst_percent?: number
  igst_percent?: number
  cess_percent?: number
  service_charge?: number
}

type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'reserved' | 'maintenance' | 'reservation'
type ViewMode = 'floor' | 'category'

interface Room {
  id: number
  number: string
  category: string
  status: RoomStatus
  floor: string
  floor_id: number
  room_category_id: number
  rawData: ApiRoom
}

interface FloorGroup {
  id: number
  name: string
  rooms: Room[]
}

interface GuestRoomChargeExtended extends GuestRoomCharge {
  per_day_total?: number
}

interface OccupiedRoomItem {
  room_no: string
  guest_name: string
  checkin_datetime: string
  checkout_datetime: string
  guest_type: string
  original_charge: number
  folio_total: number
  total_charge: number
  adults: number
  child_count: number
  driver_count: number
  ex_pax: number
  payment_method: string
  checkin?: CheckIn
  detail?: Detail
  checkin_id: number
  detail_id?: number
  room_id?: number
  room_category_id?: number
  isCheckoutNear: boolean
  minutesLeft: number
  isExpired: boolean
  ex_pax_charge?: number
  child_paid_amount?: number
  driver_charge?: number
  cgst_percent?: number
  sgst_percent?: number
  igst_percent?: number
  cess_percent?: number
  service_charge?: number
  tax?: number
  discount_percent?: number
  previous_folio_total?: number
  total_days?: number
  per_day_base_price?: number
  guest_room_charges_total?: number
  checkin_total_amount?: number
  guest_room_charges_per_day?: GuestRoomChargeExtended[]
  room_tariff_from_category?: number
  room_category_name?: string
  converted_category_name?: string
  original_pax?: number
  is_multi_room_checkin?: boolean
  agent_name?: string
  booking_type?: string
  is_agent_checkin?: boolean
  post_charges_by_date?: Record<string, number>
  today_combined_total?: number
  current_active_day_key?: string
  individual_room_charges_total?: number
  latest_charge_checkout_datetime?: string
  pending_advance?: number
  pending_advance_for_room?: number
  net_room_amount?: number
  total_all_rooms_net?: number
  total_allowances?: number
}

interface CheckoutAlertItem {
  srNo: number
  roomNo: string
  guestName: string
  category: string
  pax: number
  adults: number
  exPax: number
  child: number
  driver: number
  checkinDatetime: string
  checkoutDatetime: string
  totalPrice: number
  minutesLeft?: number
  totalNights?: number
  totalAmount?: number
  regNo?: string
  booking?: string
  planName?: string
  status?: string
}

interface AtGlanceItem {
  floorNo: string
  floorId: number
  roomNo: string
  guest: string
  totalAmt: number
  groupAmt: number
  discountPercent: number
  payType: string
  checkinDatetime: string
  checkoutDatetime: string
  pax: number
  adults: number
  exPax: number
  child: number
  driver: number
  roomCategory: string
  status: RoomStatus
  roomId: number
  convertedCategory: string
  planName?: string
  totalDays?: number
}

interface DayExtendModalData {
  show: boolean
  occupiedItem: OccupiedRoomItem | null
  editableExPax: number
  editableChild: number
  editableDriver: number
  extensionDays: number
  autoExtendSiblings: boolean
}

interface ContextMenuOption {
  label: string
  icon?: string
}

// ==================== HELPER FUNCTIONS ====================
const formatDateTime = (isoString: string): string => {
  if (!isoString) return 'N/A'
  const d = new Date(isoString)
  const day = d.getDate().toString().padStart(2, '0')
  const month = d.toLocaleString('default', { month: 'short' }).replace('.', '')
  const year = d.getFullYear()
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  return `${day}-${month}-${year} ${hours}:${minutes}`
}

const formatDateTimeForMySQL = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

const getLocalYMD = (d: Date): string => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getMinutesLeft = (checkoutDatetime: string): number => {
  if (!checkoutDatetime) return 999
  const now = new Date()
  const checkoutTime = new Date(checkoutDatetime)
  const diffMs = checkoutTime.getTime() - now.getTime()
  return Math.floor(diffMs / (1000 * 60))
}

const formatAmount = (amt: number): string => {
  const n = Number(amt)
  if (!isFinite(n)) return 'Rs.0.00/-'
  const sign = n < 0 ? '-' : ''
  return `Rs.${sign}${Math.abs(n).toFixed(2)}/-`
}

// ==================== DAY EXTENSION PRICE CALCULATION ====================
const calculateDayExtensionPriceForItem = (
  item: OccupiedRoomItem,
  exPaxCount: number,
  childCount: number,
  driverCount: number,
  extensionDays: number = 1,
  originalPax: number = item.original_pax ?? item.adults,
) => {
  const perDayBasePrice = Number(item.detail?.room_tariff) || Number(item.original_charge) || 0
  const discountPercent = Number(item.discount_percent) || 0
  const cgstPercent = Number(item.cgst_percent) || 0
  const sgstPercent = Number(item.sgst_percent) || 0
  const igstPercent = Number(item.igst_percent) || 0
  const cessPercent = Number(item.cess_percent) || 0
  const serviceChargePercent = Number(item.service_charge) || 0
  const totalTaxPercent = igstPercent > 0 ? igstPercent : cgstPercent + sgstPercent

  const discountAmount = (perDayBasePrice * discountPercent) / 100
  const roomPriceAfterDiscount = perDayBasePrice - discountAmount

  let roomCgstAmount = 0,
    roomSgstAmount = 0,
    roomIgstAmount = 0
  if (igstPercent > 0) {
    roomIgstAmount = (roomPriceAfterDiscount * igstPercent) / 100
  } else {
    roomCgstAmount = (roomPriceAfterDiscount * cgstPercent) / 100
    roomSgstAmount = (roomPriceAfterDiscount * sgstPercent) / 100
  }
  const roomGstAmount = roomIgstAmount + roomCgstAmount + roomSgstAmount
  const roomCessAmount = (roomPriceAfterDiscount * cessPercent) / 100
  const roomServiceChargeAmount = (roomPriceAfterDiscount * serviceChargePercent) / 100
  const roomTaxAmount = roomGstAmount + roomCessAmount + roomServiceChargeAmount
  const roomTotal = roomPriceAfterDiscount + roomTaxAmount

  let exPaxRatePerPerson = 0,
    childRatePerPerson = 0,
    driverRatePerPerson = 0
  if (item.ex_pax > 0) exPaxRatePerPerson = (Number(item.ex_pax_charge) || 0) / item.ex_pax
  if (item.child_count > 0)
    childRatePerPerson = (Number(item.child_paid_amount) || 0) / item.child_count
  if (item.driver_count > 0)
    driverRatePerPerson = (Number(item.driver_charge) || 0) / item.driver_count

  const exPaxBaseAmount = exPaxCount * exPaxRatePerPerson
  const childBaseAmount = childCount * childRatePerPerson
  const driverBaseAmount = driverCount * driverRatePerPerson

  const exPaxTaxAmount = (exPaxBaseAmount * totalTaxPercent) / 100
  const childTaxAmount = (childBaseAmount * totalTaxPercent) / 100
  const driverTaxAmount = (driverBaseAmount * totalTaxPercent) / 100

  const exPaxTotal = exPaxBaseAmount + exPaxTaxAmount
  const childTotal = childBaseAmount + childTaxAmount
  const driverTotal = driverBaseAmount + driverTaxAmount

  const subTotal = roomPriceAfterDiscount + exPaxBaseAmount + childBaseAmount + driverBaseAmount
  const totalTax = roomTaxAmount + exPaxTaxAmount + childTaxAmount + driverTaxAmount
  const totalPrice = roomTotal + exPaxTotal + childTotal + driverTotal

 

  return {
    roomCharge: Number((roomTotal * extensionDays).toFixed(2)),
    exPaxCharge: Number((exPaxTotal * extensionDays).toFixed(2)),
    childCharge: Number((childTotal * extensionDays).toFixed(2)),
    driverCharge: Number((driverTotal * extensionDays).toFixed(2)),
    subTotal: Number((subTotal * extensionDays).toFixed(2)),
    taxAmount: Number((totalTax * extensionDays).toFixed(2)),
    totalPrice: Number((totalPrice * extensionDays).toFixed(2)),
    discountAmount: Number((discountAmount * extensionDays).toFixed(2)),
    totalTaxPercent,
    exPaxBaseAmount: Number((exPaxBaseAmount * extensionDays).toFixed(2)),
    childBaseAmount: Number((childBaseAmount * extensionDays).toFixed(2)),
    driverBaseAmount: Number((driverBaseAmount * extensionDays).toFixed(2)),
    exPaxTaxAmount: Number((exPaxTaxAmount * extensionDays).toFixed(2)),
    childTaxAmount: Number((childTaxAmount * extensionDays).toFixed(2)),
    driverTaxAmount: Number((driverTaxAmount * extensionDays).toFixed(2)),
    perDayBasePrice: Number(perDayBasePrice.toFixed(2)),
    roomPriceAfterDiscount: Number(roomPriceAfterDiscount.toFixed(2)),
    roomTaxAmount: Number((roomTaxAmount * extensionDays).toFixed(2)),
    exPaxRatePerPerson: Number(exPaxRatePerPerson.toFixed(2)),
    childRatePerPerson: Number(childRatePerPerson.toFixed(2)),
    driverRatePerPerson: Number(driverRatePerPerson.toFixed(2)),
    cgstPercent,
    sgstPercent,
    igstPercent,
    cessPercent,
    serviceChargePercent,
    roomCgstAmount: Number((roomCgstAmount * extensionDays).toFixed(2)),
    roomSgstAmount: Number((roomSgstAmount * extensionDays).toFixed(2)),
    roomIgstAmount: Number((roomIgstAmount * extensionDays).toFixed(2)),
    paxCount: originalPax,
  }
}

// ==================== MAIN COMPONENT ====================
const HotelBookingPanel = () => {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const hotelId = user?.hotelid

  const [rooms, setRooms] = useState<any[]>([])
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [floors, setFloors] = useState<any[]>([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<
    RoomStatus | 'all' | 'maintenance' | 'reservation' | 'arrivals'
  >('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [floorFilter, setFloorFilter] = useState<string>('all')
  const [showRoomDetails, setShowRoomDetails] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [updating, setUpdating] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('floor')
  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([])

  const [uiSettings, setUiSettings] = useState<ExtendedHotelSettings>({
    hotelid: hotelId || 0,
    show_left_category: true,
    show_room_text: true,
    room_box_size: 2,
    color_vacant: DEFAULT_STATUS_BG.available,
    color_occupied: DEFAULT_STATUS_BG.occupied,
    color_cleaning: DEFAULT_STATUS_BG.cleaning,
    color_reserved: DEFAULT_STATUS_BG.reserved,
    color_maintenance: DEFAULT_STATUS_BG.maintenance,
    color_reservation: DEFAULT_STATUS_BG.reservation,
    text_color_vacant: DEFAULT_STATUS_TEXT.available,
    text_color_occupied: DEFAULT_STATUS_TEXT.occupied,
    text_color_cleaning: DEFAULT_STATUS_TEXT.cleaning,
    text_color_reserved: DEFAULT_STATUS_TEXT.reserved,
    text_color_maintenance: DEFAULT_STATUS_TEXT.maintenance,
    text_color_reservation: DEFAULT_STATUS_TEXT.reservation,
    border_color_vacant: DEFAULT_STATUS_BORDER.available,
    border_color_occupied: DEFAULT_STATUS_BORDER.occupied,
    border_color_cleaning: DEFAULT_STATUS_BORDER.cleaning,
    border_color_reserved: DEFAULT_STATUS_BORDER.reserved,
    border_color_maintenance: DEFAULT_STATUS_BORDER.maintenance,
    border_color_reservation: DEFAULT_STATUS_BORDER.reservation,
    occupied_warning_bg: '#b96eff',
    occupied_warning_text: '#ffffff',
    occupied_expired_bg: '#E03F4F',
    occupied_expired_text: '#ffffff',
    dark_mode: false,
  })
  const [showSettings, setShowSettings] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  const [occupiedRooms, setOccupiedRooms] = useState<OccupiedRoomItem[]>([])
  const [loadingOccupied, setLoadingOccupied] = useState(false)
  const [errorOccupied, setErrorOccupied] = useState<string | null>(null)

  const [checkoutAlertData, setCheckoutAlertData] = useState<CheckoutAlertItem[]>([])
  const [loadingCheckoutAlert, setLoadingCheckoutAlert] = useState(false)
  const [errorCheckoutAlert, setErrorCheckoutAlert] = useState<string | null>(null)

  const [checkoutData, setCheckoutData] = useState<CheckoutMaster[]>([])
  const [loadingCheckoutData, setLoadingCheckoutData] = useState(false)
  const [checkoutPaymentMap, setCheckoutPaymentMap] = useState<Map<number, string>>(new Map())

  const [atGlanceData, setAtGlanceData] = useState<AtGlanceItem[]>([])
  const [loadingAtGlance, setLoadingAtGlance] = useState(false)
  const [errorAtGlance, setErrorAtGlance] = useState<string | null>(null)
  const [atGlanceFilter, setAtGlanceFilter] = useState<
    'all' | 'available' | 'occupied' | 'cleaning' | 'reserved' | 'maintenance'
  >('all')

  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })
  const [contextMenuItem, setContextMenuItem] = useState<OccupiedRoomItem | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  // Prevents double-fire: stores a pending single-click timer so a second
  // rapid click (or a bubbled click from a child element) cancels the action.
  const tileClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [_currentTime, setCurrentTime] = useState(new Date())
  const [hotelName, setHotelName] = useState<string>('')

  const [dayExtendModal, setDayExtendModal] = useState<DayExtendModalData>({
    show: false,
    occupiedItem: null,
    editableExPax: 0,
    editableChild: 0,
    editableDriver: 0,
    extensionDays: 1,
    autoExtendSiblings: true,
  })
  const [siblingRooms, setSiblingRooms] = useState<OccupiedRoomItem[]>([])
  const [extendingDay, setExtendingDay] = useState(false)
  const [calculatedDayPrice, setCalculatedDayPrice] = useState<any>(null)
  const [todayReservationCount, setTodayReservationCount] = useState<number>(0)

  // ==================== SETTLEMENT / RESERV / ARRIVAL SECTION STATES ====================
  type ActiveSection = 'settlement' | 'reserv' | 'arrival' | 'atglance' | 'checkout' | null
  const [activeSection, setActiveSection] = useState<ActiveSection>(null)

  // Derived booleans for backward-compat with all existing render code
  const showSettlementSection = activeSection === 'settlement'
  const showReservSection = activeSection === 'reserv'
  const showArrivalSection = activeSection === 'arrival'
  const showCheckoutAlertTable = activeSection === 'checkout'
  const showAtGlanceTable = activeSection === 'atglance'

  interface ReservTableRow {
    reservation_id: number
    reservation_no: string
    guest_name: string
    phone1: string
    room_category_name: string
    converted_category_name: string
    arrival_date: string
    arrival_time: string
    departure_date: string
    departure_time: string
    total_rooms: number
    pax_price: number
    pax_count: number
    ex_pax_count: number
    child_count: number
    driver_count: number
    total_amount: number
    nights: number
  }
  const [reservTableData, setReservTableData] = useState<ReservTableRow[]>([])
  const [loadingReservTable, setLoadingReservTable] = useState(false)
  const [arrivalTableData, setArrivalTableData] = useState<ReservTableRow[]>([])
  const [loadingArrivalTable, setLoadingArrivalTable] = useState(false)
  const [reservDate, setReservDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [arrivalDate, setArrivalDate] = useState<string>(new Date().toISOString().slice(0, 10))

  // ==================== MODAL STATES ====================
  const [showPostChargesModal, setShowPostChargesModal] = useState(false)
  const [postChargesMode, setPostChargesMode] = useState<'charge' | 'allowance'>('charge')
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [showAdvanceModal, setShowAdvanceModal] = useState(false)
  const [selectedOccupiedItem, setSelectedOccupiedItem] = useState<OccupiedRoomItem | null>(null)

  // ==================== ROOM STATUS MODAL STATE ====================
  const [showRoomStatusModal, setShowRoomStatusModal] = useState(false)
  const [selectedRoomForStatus, setSelectedRoomForStatus] = useState<{
    id: number
    number: string
    category: string
    floor: string
    status: 'available' | 'occupied' | 'cleaning' | 'reserved' | 'maintenance' | 'reservation'
  } | null>(null)

  // ==================== MULTI-ROOM STATUS MODAL STATE ====================
  const [showMultiRoomStatusModal, setShowMultiRoomStatusModal] = useState(false)

  // ==================== ROOM STATUS LOGS STATE ====================
  const [roomStatusLogs, setRoomStatusLogs] = useState<RoomStatusLog[]>([])

  // ==================== SETTLEMENT MODAL STATE ====================
const [selectedCheckout, setSelectedCheckout] = useState<any>(null)
const [showSettlementModal, setShowSettlementModal] = useState(false)
const [outletPaymentModes, setOutletPaymentModes] = useState<Array<{id: number; mode_name: string; outletid: number}>>([])
  // ==================== DIRTY / BLOCK / MAINT SUB-PANEL STATE ====================
  type HousekeepingTab = 'all' | 'dirty' | 'block' | 'maint' | null
  const [activeHousekeepingTab, setActiveHousekeepingTab] = useState<HousekeepingTab>(null)
  const [selectedHousekeepingRoomIds, setSelectedHousekeepingRoomIds] = useState<number[]>([])

  // Scroll refs for each housekeeping section row - using HTMLDivElement | null type
  const dirtyScrollRef = useRef<HTMLDivElement | null>(null)
  const blockScrollRef = useRef<HTMLDivElement | null>(null)
  const maintScrollRef = useRef<HTMLDivElement | null>(null)

  // Context menu options
  const contextMenuOptions: ContextMenuOption[] = [
    { label: 'AMENDMENTS', icon: 'fi fi-rr-document' },
    { label: 'ADVANCE', icon: 'fi fi-rr-receipt' },
    { label: 'POST CHARGES', icon: 'fi fi-rr-credit-card' },
    { label: 'ALLOWANCCES', icon: 'fi fi-rr-gift' },
    { label: 'RECEIPT AGAINST POSTED BILLS', icon: 'fi fi-rr-document' },
  ]

  // ==================== DYNAMIC COLOR HELPER FUNCTIONS ====================
  const getStatusBgColor = (status: RoomStatus): string => {
    switch (status) {
      case 'available':
        return uiSettings.color_vacant
      case 'occupied':
        return uiSettings.color_occupied
      case 'cleaning':
        return uiSettings.color_cleaning
      case 'reserved':
        return uiSettings.color_reserved
      case 'maintenance':
        return uiSettings.color_maintenance || DEFAULT_STATUS_BG.maintenance
      case 'reservation':
        return uiSettings.color_reservation || DEFAULT_STATUS_BG.reservation
      default:
        return '#ffffff'
    }
  }

  const getStatusTextColor = (status: RoomStatus): string => {
    switch (status) {
      case 'available':
        return uiSettings.text_color_vacant || DEFAULT_STATUS_TEXT.available
      case 'occupied':
        return uiSettings.text_color_occupied || DEFAULT_STATUS_TEXT.occupied
      case 'cleaning':
        return uiSettings.text_color_cleaning || DEFAULT_STATUS_TEXT.cleaning
      case 'reserved':
        return uiSettings.text_color_reserved || DEFAULT_STATUS_TEXT.reserved
      case 'maintenance':
        return uiSettings.text_color_maintenance || DEFAULT_STATUS_TEXT.maintenance
      case 'reservation':
        return uiSettings.text_color_reservation || DEFAULT_STATUS_TEXT.reservation
      default:
        return '#4B5563'
    }
  }

  const getStatusBorderColor = (status: RoomStatus): string => {
    switch (status) {
      case 'available':
        return uiSettings.border_color_vacant || DEFAULT_STATUS_BORDER.available
      case 'occupied':
        return uiSettings.border_color_occupied || DEFAULT_STATUS_BORDER.occupied
      case 'cleaning':
        return uiSettings.border_color_cleaning || DEFAULT_STATUS_BORDER.cleaning
      case 'reserved':
        return uiSettings.border_color_reserved || DEFAULT_STATUS_BORDER.reserved
      case 'maintenance':
        return uiSettings.border_color_maintenance || DEFAULT_STATUS_BORDER.maintenance
      case 'reservation':
        return uiSettings.border_color_reservation || DEFAULT_STATUS_BORDER.reservation
      default:
        return '#9CA3AF'
    }
  }

  const getOccupiedTileStyle = (minutesLeft: number, isExpired: boolean) => {
    if (isExpired) {
      return {
        backgroundColor: uiSettings.occupied_expired_bg || '#E03F4F',
        color: uiSettings.occupied_expired_text || '#ffffff',
      }
    }
    if (minutesLeft <= 30 && minutesLeft > 0) {
      return {
        backgroundColor: uiSettings.occupied_warning_bg || '#b96eff',
        color: uiSettings.occupied_warning_text || '#ffffff',
      }
    }
    return {
      backgroundColor: uiSettings.color_occupied,
      color: uiSettings.text_color_occupied || DEFAULT_STATUS_TEXT.occupied,
    }
  }

  // ==================== SIDE EFFECTS ====================
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now)

      // Auto-update date pickers when the calendar date rolls over (e.g. at midnight)
      const todayStr = now.toISOString().slice(0, 10)

      setReservDate((prev) => {
        if (prev !== todayStr) {
          // Date has changed — refresh reservation data if the section is open
          if (activeSection === 'reserv') {
            fetchReservTableData(todayStr)
          }
          return todayStr
        }
        return prev
      })

      setArrivalDate((prev) => {
        if (prev !== todayStr) {
          // Date has changed — refresh arrival data if the section is open
          if (activeSection === 'arrival') {
            fetchArrivalTableData(todayStr)
          }
          return todayStr
        }
        return prev
      })
    }, 60000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSection])

  useEffect(() => {
    if (!hotelId) return
    const fetchHotelName = async () => {
      try {
        if (user?.hotel_name) setHotelName(user.hotel_name)
        else {
          const response = await BrandService.getBrandById(String(hotelId))
          const hotelData = response?.data || response
          setHotelName(hotelData?.hotel_name || 'Hotel')
        }
      } catch {
        setHotelName('Hotel')
      }
    }
    fetchHotelName()
  }, [hotelId, user])

  useEffect(() => {
    if (!hotelId) return
    const fetchSettings = async () => {
      try {
        const res = await hotelSettingsApi.get(hotelId)
        if (res.success && res.data) {
          setUiSettings((prev) => ({ ...prev, ...res.data }))
        }
      } catch {
        console.error('Failed to load UI settings')
      }
    }
    fetchSettings()
  }, [hotelId])

  useEffect(() => {
    document.body.classList.toggle('dark-mode', uiSettings.dark_mode)
  }, [uiSettings.dark_mode])

  useEffect(() => {
    if (!hotelId) {
      setError('No hotel selected')
      setLoading(false)
      return
    }
    const fetchData = async () => {
      setLoading(true)
      try {
        const [roomsRes, catsRes, floorsRes] = await Promise.all([
          RoomService.list({ hotelid: hotelId }),
          RoomCategoryService.list({ hotelid: Number(hotelId) }),
          FloorService.list({ hotelid: hotelId }),
        ])
        setRooms(roomsRes.data || [])
        setCategories(catsRes.data || [])
        setFloors(floorsRes.data || [])
      } catch (err) {
        setError('Failed to load room data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    fetchRoomStatusLogs()
    // Pre-load occupied rooms so tile clicks work without switching filters
    fetchOccupiedRooms()
  }, [hotelId])

  useEffect(() => {
  if (!user?.outletid) return
  const fetchPaymentModes = async () => {
    try {
      const res = await PaymentModeService.list({ outletid: user.outletid })
      setOutletPaymentModes(res.data || [])
    } catch (err) {
      console.error('Failed to fetch payment modes', err)
    }
  }
  fetchPaymentModes()
}, [user?.outletid])

  const fetchRoomStatusLogs = async () => {
    if (!hotelId) return
    try {
      const res = await RoomStatusLogService.list({ hotelid: hotelId })
      if (res.success && res.data) {
        setRoomStatusLogs(res.data)
      }
    } catch (err) {
      console.warn('Failed to fetch room status logs', err)
    }
  }

  const fetchAgentRoomCheckin = async (checkinId: number): Promise<AgentRoomCheckin | null> => {
    try {
      const response = await AgentRoomCheckinService.getByCheckinId(checkinId)
      if (response.success && response.data && response.data.length > 0) {
        return response.data[0]
      }
      return null
    } catch (err) {
      console.warn(`Failed to fetch agent data for checkin ${checkinId}`, err)
      return null
    }
  }

  // UPDATED: Fetch occupied rooms with per-room advance deduction for multi-room check-ins
  const fetchOccupiedRooms = async () => {
    if (!hotelId) return
    setLoadingOccupied(true)
    setErrorOccupied(null)
    try {
      const checkinsRes = await CheckInService.list({ hotelid: hotelId })
      const checkins = (checkinsRes.data || []).filter((c: CheckIn) => c.status === 'active')
      const checkinMap = new Map(checkins.map((c) => [c.checkin_id, c]))

      const detailsRes = await DetailService.list({ hotelid: hotelId })
      const activeDetails = (detailsRes.data || []).filter(
        (d: Detail) => checkinMap.has(d.checkin_id) && d.is_checkout === 0,
      )

      const foliosRes = await GuestFolioService.list({ hotelid: hotelId })
      const folios = foliosRes.data || []

      const detailDebitMap = new Map<number, number>()
      folios.forEach((folio: GuestFolio) => {
        if (folio.debit_amount && folio.detail_id) {
          detailDebitMap.set(
            folio.detail_id,
            (detailDebitMap.get(folio.detail_id) || 0) + folio.debit_amount,
          )
        }
      })
      const paymentMethodMap = new Map<number, string>()
      folios.forEach((folio: GuestFolio) => {
        if (folio.checkin_id && !paymentMethodMap.has(folio.checkin_id))
          paymentMethodMap.set(folio.checkin_id, folio.payment_method || 'Cash')
      })

      const activeCheckinIds = [...new Set(activeDetails.map((d) => d.checkin_id))]
      const chargesMap = new Map<number, GuestRoomChargeExtended[]>()
      for (const cid of activeCheckinIds) {
        try {
          const res = await GuestRoomChargesService.list({ checkin_id: cid })
          if (res.success && res.data) {
            chargesMap.set(cid, res.data as GuestRoomChargeExtended[])
          }
        } catch (err) {
          console.warn(`Failed to fetch charges for checkin ${cid}`, err)
        }
      }

      const postChargesMap = new Map<number, PostCharge[]>()
      for (const cid of activeCheckinIds) {
        try {
          const res = await PostChargesService.list({ checkin_id: cid, hotelid: hotelId })
          if (res.success && res.data) {
            postChargesMap.set(cid, res.data)
          }
        } catch (err) {
          console.warn(`Failed to fetch post charges for checkin ${cid}`, err)
        }
      }

      const advancePerRoomMap = new Map<number, Map<number, number>>()
      for (const cid of activeCheckinIds) {
        const roomAdvanceMap = new Map<number, number>()
        try {
          const advRes = await AdvanceTransactionService.list({ checkin_id: cid })
          if (advRes.success && advRes.data) {
            const roomCredits = new Map<number, number>()
            const roomDebits = new Map<number, number>()
            let globalCredits = 0
            let globalDebits = 0

            advRes.data.forEach((t: any) => {
              const roomId = t.room_id
              if (!roomId) {
                if (
                  t.transaction_type === 'Booking Receipt' ||
                  t.transaction_type === 'Advance Addition'
                ) {
                  if (t.status === 'active') globalCredits += Number(t.credit_amount) || 0
                } else if (
                  t.transaction_type === 'Advance Posting' ||
                  t.transaction_type === 'Advance Refund'
                ) {
                  if (t.status === 'active') globalDebits += Number(t.debit_amount) || 0
                }
                return
              }

              if (
                t.transaction_type === 'Booking Receipt' ||
                t.transaction_type === 'Advance Addition'
              ) {
                if (t.status === 'active') {
                  roomCredits.set(
                    roomId,
                    (roomCredits.get(roomId) || 0) + (Number(t.credit_amount) || 0),
                  )
                }
              } else if (
                t.transaction_type === 'Advance Posting' ||
                t.transaction_type === 'Advance Refund'
              ) {
                if (t.status === 'active') {
                  roomDebits.set(
                    roomId,
                    (roomDebits.get(roomId) || 0) + (Number(t.debit_amount) || 0),
                  )
                }
              }
            })

            for (const [roomId, credit] of roomCredits) {
              const debit = roomDebits.get(roomId) || 0
              roomAdvanceMap.set(roomId, credit - debit)
            }

            if (roomAdvanceMap.size === 0 && (globalCredits > 0 || globalDebits > 0)) {
              const netGlobal = globalCredits - globalDebits
              roomAdvanceMap.set(0, netGlobal)
            }
          }
        } catch (err) {
          console.warn(`Failed to fetch advance transactions for checkin ${cid}`, err)
        }
        advancePerRoomMap.set(cid, roomAdvanceMap)
      }

      const agentMap = new Map<number, AgentRoomCheckin>()
      for (const cid of activeCheckinIds) {
        const agentData = await fetchAgentRoomCheckin(cid)
        if (agentData) {
          agentMap.set(cid, agentData)
        }
      }

      const roomGroupMap = new Map<string, Detail[]>()
      activeDetails.forEach((detail: Detail) => {
        const key = `${detail.checkin_id}__${detail.room_id}`
        const group = roomGroupMap.get(key) || []
        group.push(detail)
        roomGroupMap.set(key, group)
      })

      const consolidatedDetails: Array<{
        detail: Detail
        originalCheckinDatetime: string
        finalCheckoutDatetime: string
      }> = []
      roomGroupMap.forEach((group) => {
        const sorted = [...group].sort(
          (a, b) =>
            new Date(b.checkout_datetime || 0).getTime() -
            new Date(a.checkout_datetime || 0).getTime(),
        )
        const latestDetail = sorted[0]
        const earliestCheckin = group.reduce((earliest, d) => {
          const t = new Date(d.checkin_datetime || 0).getTime()
          return t < new Date(earliest || 0).getTime() ? d.checkin_datetime : earliest
        }, latestDetail.checkin_datetime)
        const latestCheckout = group.reduce((latest, d) => {
          const t = new Date(d.checkout_datetime || 0).getTime()
          return t > new Date(latest || 0).getTime() ? d.checkout_datetime : latest
        }, latestDetail.checkout_datetime)
        consolidatedDetails.push({
          detail: latestDetail,
          originalCheckinDatetime: earliestCheckin,
          finalCheckoutDatetime: latestCheckout,
        })
      })

      const items: OccupiedRoomItem[] = await Promise.all(
        consolidatedDetails.map(
          async ({ detail, originalCheckinDatetime, finalCheckoutDatetime }) => {
            const checkin = checkinMap.get(detail.checkin_id)!

            const allChargesForCheckin = chargesMap.get(detail.checkin_id) || []
            const roomCharges = allChargesForCheckin.filter((c) => c.room_id === detail.room_id)
            const sortedCharges = [...roomCharges].sort(
              (a, b) =>
                new Date(b.checkout_datetime || 0).getTime() -
                new Date(a.checkout_datetime || 0).getTime(),
            )
            const latestCharge = sortedCharges[0]
            const latestChargeCheckoutDatetime =
              latestCharge?.checkout_datetime || finalCheckoutDatetime

            const minutesLeft = getMinutesLeft(latestChargeCheckoutDatetime)
            const isNear = minutesLeft <= 30 && minutesLeft > 0
            const isExpired = minutesLeft <= 0
            const masterTotal = checkin.total_amount || 0
            const originalPax = detail.pax || detail.adults

            const bookingType = checkin.booking || 'WALK-IN-GUEST'

            let agentName: string | undefined
            let isAgentCheckin = false
            const agentData = agentMap.get(detail.checkin_id)
            if (agentData && (bookingType === 'AGENT' || agentData.agent_name)) {
              isAgentCheckin = true
              agentName = agentData.agent_name || undefined
            }

            let perDayPriceFromCharges = detail.room_tariff || 0
            const regularRoomCharges = roomCharges.filter(
              (c) => c.category_id !== null && c.category_id !== undefined,
            )

            const guestRoomChargesTotal = regularRoomCharges.reduce(
              (sum, c) => sum + (Number(c.total_amount) || 0),
              0,
            )
            if (regularRoomCharges.length > 0) {
              const sorted = [...regularRoomCharges].sort(
                (a, b) =>
                  new Date(b.checkin_datetime || 0).getTime() -
                  new Date(a.checkin_datetime || 0).getTime(),
              )
              const latest = sorted[0]
              if (latest.total_amount) perDayPriceFromCharges = Number(latest.total_amount)
            }

            const postChargesByDate: Record<string, number> = {}
            const allPostChargesForCheckin = postChargesMap.get(detail.checkin_id) || []
            const roomPostCharges = allPostChargesForCheckin.filter(
              (c: PostCharge) => c.room_id === detail.room_id,
            )
            roomPostCharges.forEach((c: PostCharge) => {
              const rawDate = c.post_datetime ?? ''
              const dateKey =
                rawDate.length >= 10
                  ? rawDate.substring(0, 10)
                  : new Date().toISOString().split('T')[0]
              const amt = Number(c.total_amount) || 0
              const signedAmt = c.transaction_type === 'ALLOWANCE' ? amt : amt
              postChargesByDate[dateKey] = (postChargesByDate[dateKey] || 0) + signedAmt
            })

            const allRoomPostChargesNetTotal = roomPostCharges.reduce((sum, c) => {
              const amt = Number(c.total_amount) || 0
              return sum + (c.transaction_type === 'ALLOWANCE' ? amt : amt)
            }, 0)

            const totalAllowancesForRoom = roomPostCharges.reduce((sum, c) => {
              const amt = Number(c.total_amount) || 0
              return sum + (c.transaction_type === 'ALLOWANCE' ? amt : 0)
            }, 0)

            const currentActiveDayKey = detail.checkin_datetime
              ? String(detail.checkin_datetime).substring(0, 10)
              : new Date().toISOString().split('T')[0]

            const systemTodayKey = new Date().toISOString().split('T')[0]
            const activePostChargesForDay =
              postChargesByDate[currentActiveDayKey] ?? postChargesByDate[systemTodayKey] ?? 0
            const todayCombinedTotal = perDayPriceFromCharges + activePostChargesForDay

            const perRoomAdvanceMap = advancePerRoomMap.get(detail.checkin_id) || new Map()
            const pendingAdvanceForRoom =
              perRoomAdvanceMap.get(detail.room_id) ?? perRoomAdvanceMap.get(0) ?? 0

            const individualRoomChargesTotal = guestRoomChargesTotal + allRoomPostChargesNetTotal

            const netRoomAmount = individualRoomChargesTotal - pendingAdvanceForRoom

            let totalAllRoomsCharges = 0
            let totalAllRoomsAdvance = 0
            const checkinRooms = consolidatedDetails.filter(
              (d) => d.detail.checkin_id === detail.checkin_id,
            )
            for (const roomDetail of checkinRooms) {
              const roomAdvance = perRoomAdvanceMap.get(roomDetail.detail.room_id) ?? 0
              totalAllRoomsAdvance += roomAdvance

              const roomChargesList = allChargesForCheckin.filter(
                (c) =>
                  c.room_id === roomDetail.detail.room_id &&
                  c.category_id !== null &&
                  c.category_id !== undefined,
              )
              const roomPostChargesList = (postChargesMap.get(detail.checkin_id) || []).filter(
                (c: PostCharge) => c.room_id === roomDetail.detail.room_id,
              )
              const roomGuestChargesTotal = roomChargesList.reduce(
                (sum, c) => sum + (Number(c.total_amount) || 0),
                0,
              )
              const roomPostChargesTotal = roomPostChargesList.reduce((sum, c) => {
                const amt = Number(c.total_amount) || 0
                return sum + (c.transaction_type === 'ALLOWANCE' ? amt : amt)
              }, 0)
              totalAllRoomsCharges += roomGuestChargesTotal + roomPostChargesTotal
            }
            const globalAdvance = perRoomAdvanceMap.get(0) ?? 0
            const hasRoomSpecificAdvances = [...perRoomAdvanceMap.keys()].some((k) => k !== 0)
            const effectiveTotalAdvance = hasRoomSpecificAdvances
              ? totalAllRoomsAdvance
              : globalAdvance
            const totalAllRoomsNet = totalAllRoomsCharges - effectiveTotalAdvance

            return {
              room_no: detail.room_number,
              guest_name: checkin.guest_name,
              checkin_datetime: originalCheckinDatetime || checkin.checkin_datetime,
              checkout_datetime: latestChargeCheckoutDatetime,
              guest_type: bookingType,
              original_charge: detail.room_tariff,
              folio_total: masterTotal,
              total_charge: masterTotal,
              adults: detail.adults,
              child_count: (() => {
                const roomChargesSorted = (chargesMap.get(detail.checkin_id) || [])
                  .filter((c) => c.room_id === detail.room_id)
                  .sort(
                    (a, b) =>
                      new Date(b.checkin_datetime || 0).getTime() -
                      new Date(a.checkin_datetime || 0).getTime(),
                  )
                const latestChargeForCount = roomChargesSorted[0]
                return latestChargeForCount != null
                  ? Number(latestChargeForCount.child_count) || 0
                  : Number(detail.child_unpaid) || 0
              })(),
              driver_count: detail.driver,
              ex_pax: detail.ex_pax,
              payment_method: paymentMethodMap.get(detail.checkin_id) || 'Cash',
              checkin,
              detail,
              checkin_id: detail.checkin_id,
              detail_id: detail.detail_id,
              room_id: detail.room_id,
              room_category_id: detail.room_category_id,
              isCheckoutNear: isNear,
              minutesLeft,
              isExpired,
              ex_pax_charge: detail.ex_pax_charge,
              child_paid_amount: detail.child_paid_amount,
              driver_charge: detail.driver_charge,
              cgst_percent: detail.cgst_percent,
              sgst_percent: detail.sgst_percent,
              igst_percent: detail.igst_percent,
              cess_percent: detail.cess_percent,
              service_charge: detail.service_charge,
              tax: detail.tax,
              discount_percent: detail.discount_percent,
              total_days: Math.max(
                1,
                Math.ceil(
                  (new Date(latestChargeCheckoutDatetime).getTime() -
                    new Date(originalCheckinDatetime || detail.checkin_datetime).getTime()) /
                    (1000 * 3600 * 24),
                ),
              ),
              per_day_base_price: perDayPriceFromCharges,
              individual_room_charges_total: individualRoomChargesTotal,
              net_room_amount: netRoomAmount,
              total_all_rooms_net: totalAllRoomsNet,
              pending_advance_for_room: pendingAdvanceForRoom,
              guest_room_charges_total: guestRoomChargesTotal + allRoomPostChargesNetTotal,
              checkin_total_amount: masterTotal,
              room_category_name: detail.room_category_name,
              converted_category_name: detail.converted_category_name,
              original_pax: originalPax,
              booking_type: bookingType,
              agent_name: agentName,
              is_agent_checkin: isAgentCheckin,
              post_charges_by_date: postChargesByDate,
              today_combined_total: todayCombinedTotal,
              current_active_day_key: currentActiveDayKey,
              latest_charge_checkout_datetime: latestChargeCheckoutDatetime,
              pending_advance: totalAllRoomsAdvance,
              total_allowances: totalAllowancesForRoom,
            }
          },
        ),
      )

      const checkinTotalsMap = new Map<
        number,
        { combinedPerDay: number; combinedCumulative: number }
      >()
      items.forEach((item) => {
        const cid = item.checkin_id
        const existing = checkinTotalsMap.get(cid) || { combinedPerDay: 0, combinedCumulative: 0 }
        checkinTotalsMap.set(cid, {
          combinedPerDay: existing.combinedPerDay + (item.per_day_base_price || 0),
          combinedCumulative: existing.combinedCumulative + (item.guest_room_charges_total || 0),
        })
      })

      const itemsWithCombined = items.map((item) => {
        const combined = checkinTotalsMap.get(item.checkin_id)
        const roomCount = items.filter((i) => i.checkin_id === item.checkin_id).length
        const activeDayKey = item.current_active_day_key || new Date().toISOString().split('T')[0]
        const systemTodayKey = new Date().toISOString().split('T')[0]
        const postByDate = item.post_charges_by_date || {}
        const todayPostCharges = postByDate[activeDayKey] ?? postByDate[systemTodayKey] ?? 0
        const perDay = item.per_day_base_price || 0
        const isMulti = roomCount > 1
        return {
          ...item,
          per_day_base_price: perDay,
          individual_room_charges_total:
            item.individual_room_charges_total ?? item.guest_room_charges_total,
          guest_room_charges_total: isMulti
            ? (combined?.combinedCumulative ?? item.guest_room_charges_total)
            : item.guest_room_charges_total,
          is_multi_room_checkin: isMulti,
          today_combined_total: perDay + todayPostCharges,
        }
      })

      itemsWithCombined.sort((a, b) =>
        a.room_no.localeCompare(b.room_no, undefined, { numeric: true }),
      )
      setOccupiedRooms(itemsWithCombined)
    } catch (err) {
      console.error('Failed to fetch occupied rooms:', err)
      setErrorOccupied('Could not load occupied rooms')
    } finally {
      setLoadingOccupied(false)
    }
  }

  useEffect(() => {
    if (statusFilter === 'occupied' && hotelId) fetchOccupiedRooms()
  }, [statusFilter, hotelId])

  // Fetch today's checkouts
  const fetchTodayCheckouts = async () => {
    if (!hotelId) return

    setLoadingCheckoutAlert(true)
    try {
      const checkinsRes = await CheckInService.list({ hotelid: hotelId })
      const activeCheckins = (checkinsRes.data || []).filter((c: CheckIn) => c.status === 'active')

      const allCheckoutItems: CheckoutAlertItem[] = []
      const todayStr = getLocalYMD(new Date())

      for (const checkin of activeCheckins) {
        try {
          const chargesRes = await GuestRoomChargesService.list({ checkin_id: checkin.checkin_id })
          const charges = chargesRes.data || []

          const advRoomMap = new Map<number, number>()
          try {
            const advRes = await AdvanceTransactionService.list({ checkin_id: checkin.checkin_id })
            const roomCredits = new Map<number, number>()
            const roomDebits = new Map<number, number>()
            let globalCredits = 0,
              globalDebits = 0
            ;(advRes.data || []).forEach((t: any) => {
              const rid = t.room_id
              const isCredit =
                t.transaction_type === 'Booking Receipt' ||
                t.transaction_type === 'Advance Addition'
              const isDebit =
                t.transaction_type === 'Advance Posting' || t.transaction_type === 'Advance Refund'
              if (t.status !== 'active') return
              if (!rid) {
                if (isCredit) globalCredits += Number(t.credit_amount) || 0
                if (isDebit) globalDebits += Number(t.debit_amount) || 0
              } else {
                if (isCredit)
                  roomCredits.set(rid, (roomCredits.get(rid) || 0) + (Number(t.credit_amount) || 0))
                if (isDebit)
                  roomDebits.set(rid, (roomDebits.get(rid) || 0) + (Number(t.debit_amount) || 0))
              }
            })
            for (const [rid, credit] of roomCredits) {
              advRoomMap.set(rid, credit - (roomDebits.get(rid) || 0))
            }
            const hasRoomSpecificAdv = advRoomMap.size > 0
            if (!hasRoomSpecificAdv && (globalCredits > 0 || globalDebits > 0)) {
              advRoomMap.set(0, globalCredits - globalDebits)
            }
          } catch {
            // advance fetch failed — show charges total without advance deduction
          }

          const chargesByRoom = new Map<number, GuestRoomCharge[]>()
          charges.forEach((charge: GuestRoomCharge) => {
            if (charge.room_id) {
              if (!chargesByRoom.has(charge.room_id)) {
                chargesByRoom.set(charge.room_id, [])
              }
              chargesByRoom.get(charge.room_id)!.push(charge)
            }
          })

          for (const [roomId, roomCharges] of chargesByRoom) {
            const regularCharges = roomCharges.filter(
              (c) => c.category_id !== null && c.category_id !== undefined,
            )
            const sortedCharges = [...regularCharges].sort(
              (a, b) =>
                new Date(b.checkout_datetime || 0).getTime() -
                new Date(a.checkout_datetime || 0).getTime(),
            )
            const latestCharge = sortedCharges[0]

            if (latestCharge?.checkout_datetime) {
              const checkoutDateStr = getLocalYMD(new Date(latestCharge.checkout_datetime))

              if (checkoutDateStr === todayStr) {
                const room = rooms.find((r) => r.room_id === roomId)
                const roomNumber = room?.room_no || `Room ${roomId}`

                const allRoomChargesTotal = roomCharges.reduce(
                  (sum, c) => sum + (Number(c.total_amount) || 0),
                  0,
                )
                const hasRoomSpecific = [...advRoomMap.keys()].some((k) => k !== 0)
                const roomAdvance = hasRoomSpecific
                  ? advRoomMap.get(roomId) || 0
                  : advRoomMap.get(0) || 0
                const netTotal = allRoomChargesTotal - roomAdvance

                allCheckoutItems.push({
                  srNo: 0,
                  roomNo: roomNumber,
                  guestName: checkin.guest_name,
                  category: checkin.converted_category || '',
                  pax: checkin.pax || 0,
                  adults: checkin.adults || 0,
                  exPax: checkin.ex_pax || 0,
                  child: (checkin.child_paid || 0) + (checkin.child_unpaid || 0),
                  driver: Number(checkin.driver) || 0,
                  checkinDatetime: checkin.checkin_datetime,
                  checkoutDatetime: latestCharge.checkout_datetime,
                  totalPrice: latestCharge.total_amount || 0,
                  minutesLeft: getMinutesLeft(latestCharge.checkout_datetime),
                  totalNights: checkin.total_nights,
                  totalAmount: netTotal,
                  regNo: checkin.reg_no,
                  booking: checkin.booking,
                  planName: checkin.plan_name,
                  status: checkin.status,
                })
              }
            }
          }
        } catch (err) {
          console.warn(`Failed to fetch charges for checkin ${checkin.checkin_id}`, err)
        }
      }

      allCheckoutItems.sort((a, b) => {
        const now = Date.now()
        const aTime = new Date(a.checkoutDatetime).getTime()
        const bTime = new Date(b.checkoutDatetime).getTime()
        const aExpired = aTime < now
        const bExpired = bTime < now
        if (aExpired && !bExpired) return -1
        if (!aExpired && bExpired) return 1
        return aTime - bTime
      })

      allCheckoutItems.forEach((item, idx) => {
        item.srNo = idx + 1
      })
      setCheckoutAlertData(allCheckoutItems)
    } catch (err) {
      console.error("Failed to fetch today's checkouts:", err)
      setErrorCheckoutAlert("Could not load today's checkouts")
    } finally {
      setLoadingCheckoutAlert(false)
    }
  }

  useEffect(() => {
    if (showCheckoutAlertTable && hotelId) fetchTodayCheckouts()
  }, [showCheckoutAlertTable, hotelId])

  // ==================== EXTEND SINGLE ROOM FUNCTION ====================
  const extendSingleRoom = async (
    item: OccupiedRoomItem,
    extensionDays: number,
    price: ReturnType<typeof calculateDayExtensionPriceForItem>,
    exPaxCount: number,
    childCount: number,
    driverCount: number,
    hotelIdVal: number,
    userId: number | undefined,
  ) => {
    const {
      totalPrice,
      exPaxCharge,
      childCharge,
      driverCharge,
      discountAmount,
      perDayBasePrice,
      roomPriceAfterDiscount,
      roomTaxAmount,
      totalTaxPercent,
      exPaxBaseAmount,
      childBaseAmount,
      driverBaseAmount,
      exPaxTaxAmount,
      childTaxAmount,
      driverTaxAmount,
      exPaxRatePerPerson,
      childRatePerPerson,
      driverRatePerPerson,
      cgstPercent,
      sgstPercent,
      igstPercent,
      cessPercent,
      serviceChargePercent,
      roomCgstAmount,
      roomSgstAmount,
      roomIgstAmount,
      paxCount,
    } = price

    const currentCheckoutDate = new Date(
      item.latest_charge_checkout_datetime || item.checkout_datetime,
    )
    const newCheckoutDate = new Date(currentCheckoutDate)
    newCheckoutDate.setDate(currentCheckoutDate.getDate() + extensionDays)

    if (item.detail_id) {
      await DetailService.update(item.detail_id, { is_checkout: 1, merged: 1 })
    }

    const originalCheckinDate = new Date(item.checkin_datetime)

    const detailPayload = {
      checkin_id: item.checkin_id,
      hotelid: hotelIdVal,
      room_id: item.room_id,
      room_number: item.room_no,
      room_category_id: item.room_category_id,
      room_category_name: item.detail?.room_category_name || '',
      converted_category_id: item.detail?.converted_category_id ?? undefined,
      converted_category_name: item.detail?.converted_category_name || '',
      checkin_datetime: formatDateTimeForMySQL(originalCheckinDate),
      checkout_datetime: formatDateTimeForMySQL(newCheckoutDate),
      no_of_days: extensionDays,
      adults: item.adults,
      pax: paxCount,
      ex_pax: exPaxCount,
      child_unpaid: item.child_count,
      driver: driverCount,
      room_tariff: perDayBasePrice,
      discount_percent: item.discount_percent || 0,
      discount_amount: discountAmount,
      ex_pax_charge: Number((exPaxBaseAmount / extensionDays).toFixed(2)),
      child_paid_amount: Number((childBaseAmount / extensionDays).toFixed(2)),
      driver_charge: Number((driverBaseAmount / extensionDays).toFixed(2)),
      cgst_percent: cgstPercent,
      cgst_amount: roomCgstAmount,
      sgst_percent: sgstPercent,
      sgst_amount: roomSgstAmount,
      igst_percent: igstPercent,
      igst_amount: roomIgstAmount,
      cess_percent: cessPercent,
      cess_amount: ((roomPriceAfterDiscount * cessPercent) / 100) * extensionDays,
      service_charge: serviceChargePercent,
      service_charge_amount:
        ((roomPriceAfterDiscount * serviceChargePercent) / 100) * extensionDays,
      parent_detail_id: item.detail_id,
      tax: roomTaxAmount,
    }

    const detailRes = await DetailService.create(detailPayload)
    const newDetailId = detailRes.data?.detail_id
    if (!newDetailId) throw new Error(`Failed to create extension detail for room ${item.room_no}`)

    const perDayExPaxBaseCharge = exPaxBaseAmount / extensionDays
    const perDayChildBaseCharge = childBaseAmount / extensionDays
    const perDayDriverBaseCharge = driverBaseAmount / extensionDays
    const perDayExPaxCharge = exPaxCharge / extensionDays
    const perDayChildCharge = childCharge / extensionDays
    const perDayDriverCharge = driverCharge / extensionDays
    const perDayExPaxTax = exPaxTaxAmount / extensionDays
    const perDayChildTax = childTaxAmount / extensionDays
    const perDayDriverTax = driverTaxAmount / extensionDays
    const perDayTotalPrice = totalPrice / extensionDays

    const chargeRowsPayload = []
    for (let dayIndex = 0; dayIndex < extensionDays; dayIndex++) {
      const dayCheckinDate = new Date(currentCheckoutDate)
      dayCheckinDate.setDate(currentCheckoutDate.getDate() + dayIndex)
      const dayCheckoutDate = new Date(currentCheckoutDate)
      dayCheckoutDate.setDate(currentCheckoutDate.getDate() + dayIndex + 1)

      chargeRowsPayload.push({
        guest_id: Number(item.checkin?.guest_id) || 0,
        room_id: Number(item.room_id) || 0,
        category_id: item.room_category_id ? Number(item.room_category_id) : null,
        checkin_id: Number(item.checkin_id) || 0,
        pax_count: paxCount,
        pax_price: perDayBasePrice,
        pax_tax: roomTaxAmount / extensionDays,
        ex_pax_count: item.ex_pax,
        ex_pax_price: perDayExPaxBaseCharge,
        ex_pax_total: perDayExPaxCharge,
        ex_pax_tax: perDayExPaxTax,
        ex_pax_tax_percent: totalTaxPercent,
        child_count: item.child_count,
        child_price: perDayChildBaseCharge,
        child_total: perDayChildCharge,
        child_tax: perDayChildTax,
        child_tax_percent: totalTaxPercent,
        driver_count: item.driver_count,
        driver_price: perDayDriverBaseCharge,
        driver_total: perDayDriverCharge,
        driver_tax: perDayDriverTax,
        driver_tax_percent: totalTaxPercent,
        total_amount: perDayTotalPrice,
        checkin_datetime: formatDateTimeForMySQL(dayCheckinDate),
        checkout_datetime: formatDateTimeForMySQL(dayCheckoutDate),
      })
    }
    await GuestRoomChargesService.createBulk({ charges: chargeRowsPayload })

    const nowStr = formatDateTimeForMySQL(new Date())
    const formatAmountNum = (v: number) => (isNaN(Number(v)) ? '0.00' : Number(v).toFixed(2))
    const descParts = [`Day extension +${extensionDays} day(s) Room ${item.room_no}`]
    descParts.push(`Room: ₹${formatAmountNum(perDayBasePrice * extensionDays)}`)
    if ((item.discount_percent || 0) > 0) descParts.push(`-${item.discount_percent}% disc`)
    descParts.push(`+Tax ₹${formatAmountNum(roomTaxAmount)}`)
    if (exPaxCount > 0 && exPaxRatePerPerson > 0)
      descParts.push(`|ExPax(${exPaxCount}):₹${formatAmountNum(exPaxCharge)}`)
    if (childCount > 0 && childRatePerPerson > 0)
      descParts.push(`|Child(${childCount}):₹${formatAmountNum(childCharge)}`)
    if (driverCount > 0 && driverRatePerPerson > 0)
      descParts.push(`|Driver(${driverCount}):₹${formatAmountNum(driverCharge)}`)

    await GuestFolioService.create({
      checkin_id: item.checkin_id,
      hotelid: hotelIdVal,
      detail_id: newDetailId,
      transaction_type: 'Room Charge',
      transaction_datetime: nowStr,
      description: descParts.join(' '),
      debit_amount: totalPrice,
      credit_amount: 0,
      reference_number: `EXT-${item.checkin_id}-${item.room_id}-${Date.now()}`,
      payment_method: item.payment_method,
    })

    const currentCheckin = await CheckInService.get(item.checkin_id)
    const currentTotal = currentCheckin.data?.total_amount || 0
    const newTotalAmount = currentTotal + totalPrice
    const currentTotalNights = currentCheckin.data?.total_nights || 1
    const newTotalNights = currentTotalNights + extensionDays

    await CheckInService.updatePartial(item.checkin_id, {
      checkout_datetime: formatDateTimeForMySQL(newCheckoutDate),
      total_amount: newTotalAmount,
      total_nights: newTotalNights,
    })

    return { newDetailId, totalPrice, newCheckoutDate }
  }

  // ==================== HANDLE DAY EXTEND ====================
  const handleDayExtend = async () => {
    if (!dayExtendModal.occupiedItem || !hotelId) return
    const item = dayExtendModal.occupiedItem
    const extensionDays = dayExtendModal.extensionDays
    if (!item.detail_id || !item.room_id) {
      toast.error('Missing room detail information')
      return
    }
    if (!calculatedDayPrice) {
      toast.error('Unable to calculate price')
      return
    }

    setExtendingDay(true)
    try {
      const exPaxCount = dayExtendModal.editableExPax
      const childCount = dayExtendModal.editableChild
      const driverCount = dayExtendModal.editableDriver

      const { totalPrice: primaryTotal, newCheckoutDate: primaryNewCheckoutDate } =
        await extendSingleRoom(
          item,
          extensionDays,
          calculatedDayPrice,
          exPaxCount,
          childCount,
          driverCount,
          hotelId,
          user?.id,
        )

      let siblingTotal = 0
      const extendedRoomNos = new Set<string>([item.room_no])

      if (dayExtendModal.autoExtendSiblings && siblingRooms.length > 0) {
        for (const sibling of siblingRooms) {
          const siblingPrice = calculateDayExtensionPriceForItem(
            sibling,
            sibling.ex_pax,
            sibling.child_count,
            sibling.driver_count,
            extensionDays,
            sibling.original_pax ?? sibling.adults,
          )
          const { totalPrice: sTot } = await extendSingleRoom(
            sibling,
            extensionDays,
            siblingPrice,
            sibling.ex_pax,
            sibling.child_count,
            sibling.driver_count,
            hotelId,
            user?.id,
          )
          siblingTotal += sTot
          extendedRoomNos.add(sibling.room_no)

          if (sibling.room_id) {
            const currentRoom = rooms.find((r) => r.room_id === sibling.room_id)
            if (currentRoom && currentRoom.room_status !== 'occupied') {
              await RoomService.update(sibling.room_id, {
                ...currentRoom,
                room_status: 'occupied' as RoomStatus,
                updated_by_id: user?.id,
              })
              setRooms((prev) =>
                prev.map((r) =>
                  r.room_id === sibling.room_id ? { ...r, room_status: 'occupied' } : r,
                ),
              )
            }
          }
        }
      }

      if (item.room_id) {
        const currentRoom = rooms.find((r) => r.room_id === item.room_id)
        if (currentRoom && currentRoom.room_status !== 'occupied') {
          await RoomService.update(item.room_id, {
            ...currentRoom,
            room_status: 'occupied' as RoomStatus,
            updated_by_id: user?.id,
          })
          setRooms((prev) =>
            prev.map((r) => (r.room_id === item.room_id ? { ...r, room_status: 'occupied' } : r)),
          )
        }
      }

      const siblingMsg =
        siblingRooms.length > 0 && dayExtendModal.autoExtendSiblings
          ? ` + ${siblingRooms.length} sibling room(s) auto-extended.`
          : ''
      toast.success(
        `Room ${item.room_no} extended by ${extensionDays} day(s). Charges: ${formatAmount(primaryTotal + siblingTotal)}${siblingMsg}`,
      )

      setDayExtendModal({
        show: false,
        occupiedItem: null,
        editableExPax: 0,
        editableChild: 0,
        editableDriver: 0,
        extensionDays: 1,
        autoExtendSiblings: true,
      })
      setSiblingRooms([])

      const todayStr = new Date().toISOString().split('T')[0]
      const newCheckoutDateStr = primaryNewCheckoutDate.toISOString().split('T')[0]

      if (newCheckoutDateStr !== todayStr) {
        setCheckoutAlertData((prev) => prev.filter((row) => !extendedRoomNos.has(row.roomNo)))
      }

      await fetchOccupiedRooms()

      if (showCheckoutAlertTable) {
        await fetchTodayCheckouts()
      }
      if (showAtGlanceTable) {
        fetchAtGlanceData()
      }
    } catch (err) {
      console.error('Failed to extend day:', err)
      toast.error((err as Error).message || 'Failed to extend day')
    } finally {
      setExtendingDay(false)
    }
  }

  useEffect(() => {
    if (dayExtendModal.show && dayExtendModal.occupiedItem) {
      const calculation = calculateDayExtensionPriceForItem(
        dayExtendModal.occupiedItem,
        dayExtendModal.editableExPax,
        dayExtendModal.editableChild,
        dayExtendModal.editableDriver,
        dayExtendModal.extensionDays,
        dayExtendModal.occupiedItem.original_pax ?? dayExtendModal.occupiedItem.adults,
      )
      setCalculatedDayPrice(calculation)
    }
  }, [
    dayExtendModal.show,
    dayExtendModal.editableExPax,
    dayExtendModal.editableChild,
    dayExtendModal.editableDriver,
    dayExtendModal.extensionDays,
    dayExtendModal.occupiedItem,
  ])

  // ==================== UI HELPER FUNCTIONS ====================
  const boxSizeClass = useMemo(() => `size${uiSettings.room_box_size}`, [uiSettings.room_box_size])
  const showSubtext = useMemo(
    () => uiSettings.room_box_size > 1 && uiSettings.show_room_text,
    [uiSettings.room_box_size, uiSettings.show_room_text],
  )

  const enrichedRooms: Room[] = useMemo(() => {
    const floorMap = new Map(floors.map((f) => [f.floor_id, f.floor_name]))
    const categoryMap = new Map(categories.map((c) => [c.room_category_id, c.category_name]))
    return rooms.map((apiRoom) => ({
      id: apiRoom.room_id,
      number: apiRoom.room_no,
      category: categoryMap.get(apiRoom.room_category_id) || 'Uncategorized',
      status: apiRoom.room_status,
      floor: floorMap.get(apiRoom.floor_id) || `Floor ${apiRoom.floor_id}`,
      floor_id: apiRoom.floor_id,
      room_category_id: apiRoom.room_category_id,
      rawData: apiRoom,
    }))
  }, [rooms, floors, categories])

  const latestLogByRoomId = useMemo(() => {
    const map = new Map<number, RoomStatusLog>()
    roomStatusLogs.forEach((log) => {
      if (!map.has(log.room_id)) {
        map.set(log.room_id, log)
      }
    })
    return map
  }, [roomStatusLogs])

  const roomsAfterBasicFilters = useMemo(() => {
    return enrichedRooms.filter((room) => {
      const matchesSearch =
        searchQuery === '' ||
        room.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.category.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = typeFilter === 'all' || room.category === typeFilter
      const matchesFloor = floorFilter === 'all' || room.floor === floorFilter
      return matchesSearch && matchesType && matchesFloor
    })
  }, [enrichedRooms, searchQuery, typeFilter, floorFilter])

  const stats = useMemo(() => {
    const all = roomsAfterBasicFilters
    return {
      total: all.length,
      available: all.filter((r) => r.status === 'available').length,
      occupied: all.filter((r) => r.status === 'occupied').length,
      cleaning: all.filter((r) => r.status === 'cleaning').length,
      reserved: all.filter((r) => r.status === 'reserved').length,
      maintenance: all.filter((r) => r.status === 'maintenance').length,
      reservation: all.filter((r) => r.status === 'reservation').length,
    }
  }, [roomsAfterBasicFilters])

  const roomsAfterStatus = useMemo(() => {
    if (statusFilter === 'all' || statusFilter === 'arrivals') return roomsAfterBasicFilters
    return roomsAfterBasicFilters.filter((room) => room.status === statusFilter)
  }, [roomsAfterBasicFilters, statusFilter])

  const groupedFloors: FloorGroup[] = useMemo(() => {
    const grouped = new Map<number, Room[]>()
    roomsAfterStatus.forEach((room) => {
      if (!grouped.has(room.floor_id)) grouped.set(room.floor_id, [])
      grouped.get(room.floor_id)!.push(room)
    })
    return Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([id, rooms]) => ({
        id,
        name: floors.find((f) => f.floor_id === id)?.floor_name || '',
        rooms: rooms.sort((a, b) => a.number.localeCompare(b.number)),
      }))
  }, [roomsAfterStatus, floors])

  const groupedCategoriesView: FloorGroup[] = useMemo(() => {
    const grouped = new Map<number, Room[]>()
    roomsAfterStatus.forEach((room) => {
      const catId = room.room_category_id
      if (!grouped.has(catId)) grouped.set(catId, [])
      grouped.get(catId)!.push(room)
    })
    return Array.from(grouped.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([id, rooms]) => ({
        id,
        name: categories.find((c) => c.room_category_id === id)?.category_name || 'Uncategorized',
        rooms: rooms.sort((a, b) => a.number.localeCompare(b.number)),
      }))
  }, [roomsAfterStatus, categories])

  const getStatusText = (status: RoomStatus): string => {
    switch (status) {
      case 'available':
        return 'Vacant'
      case 'occupied':
        return 'Occupied'
      case 'cleaning':
        return 'Cleaning'
      case 'reserved':
        return 'Reserved'
      case 'maintenance':
        return 'Maintenance'
      case 'reservation':
        return 'Reservation'
      default:
        return 'Unknown'
    }
  }

  const toggleRoomSelection = (roomId: number) => {
    const room = enrichedRooms.find((r) => r.id === roomId)
    if (room && room.status !== 'available') {
      toast.error('Only vacant rooms can be selected for check-in.')
      return
    }
    setSelectedRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId],
    )
  }

  const isRoomSelected = (roomId: number) => selectedRoomIds.includes(roomId)

  const handleCheckInClick = () => {
    if (selectedRoomIds.length === 0) {
      toast.error('Please select at least one room to check in.')
      return
    }
    const selectedRoomsList = enrichedRooms
      .filter((room) => selectedRoomIds.includes(room.id))
      .map((room) => ({
        roomId: room.id,
        roomNumber: room.number,
        roomCategoryName: room.category,
      }))
    navigate('/hotel/checkin', {
      state: { rooms: selectedRoomsList, hotelId },
    })
  }

  const handleRoomStatusChangeRequest = (room: Room) => {
    setSelectedRoomForStatus({
      id: room.id,
      number: room.number,
      category: room.category,
      floor: room.floor,
      status: room.status,
    })
    setShowRoomStatusModal(true)
  }

  const handleRoomStatusChangeSuccess = async () => {
    try {
      const roomsRes = await RoomService.list({ hotelid: hotelId })
      setRooms(roomsRes.data || [])

      await fetchRoomStatusLogs()

      if (statusFilter === 'occupied') {
        await fetchOccupiedRooms()
      }

      if (showAtGlanceTable) {
        await fetchAtGlanceData()
      }
    } catch (err) {
      console.error('Failed to refresh room data:', err)
    }
  }

  const handleRoomTileClick = (room: Room) => {
    // Debounce: ignore if a click is already pending within 250ms.
    // This prevents the modal's Close button click from bubbling up to the
    // tile div and re-triggering navigation immediately after closing.
    if (tileClickTimerRef.current) return
    tileClickTimerRef.current = setTimeout(() => {
      tileClickTimerRef.current = null
      if (room.status === 'occupied') {
        const occupiedItem = occupiedRooms.find((item) => item.room_no === room.number)
        if (occupiedItem) {
          handleOccupiedRoomClick(occupiedItem)
        } else {
          setSelectedRoom(room)
          setShowRoomDetails(true)
        }
      }
    }, 250)
  }

  const handleOccupiedRoomClick = (item: OccupiedRoomItem) => {
    if (item.isExpired) {
      const siblings = occupiedRooms.filter(
        (r) => r.checkin_id === item.checkin_id && r.detail_id !== item.detail_id,
      )
      setSiblingRooms(siblings)
      setDayExtendModal({
        show: true,
        occupiedItem: item,
        editableExPax: item.ex_pax,
        editableChild: item.child_count,
        editableDriver: item.driver_count,
        extensionDays: 1,
        autoExtendSiblings: siblings.length > 0,
      })
      return
    }
    navigate('/hotel/room-detail', { state: { occupiedItem: item } })
  }

  const closeContextMenu = () => {
    setShowContextMenu(false)
    setContextMenuItem(null)
  }

  const handleContextMenu = (e: React.MouseEvent, item: OccupiedRoomItem) => {
    e.preventDefault()
    closeContextMenu()
    setContextMenuItem(item)
    setShowContextMenu(true)
    setTimeout(() => {
      if (contextMenuRef.current) {
        const menuRect = contextMenuRef.current.getBoundingClientRect()
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        let left = e.clientX
        let top = e.clientY
        if (left + menuRect.width > viewportWidth) left = e.clientX - menuRect.width
        if (top + menuRect.height > viewportHeight) top = e.clientY - menuRect.height
        left = Math.max(0, Math.min(left, viewportWidth - menuRect.width))
        top = Math.max(0, Math.min(top, viewportHeight - menuRect.height))
        setContextMenuPos({ x: left, y: top })
      }
    }, 0)
  }

  const handleRoomStatusChange = async (roomId: number, newStatus: RoomStatus) => {
    if (!selectedRoom) return
    setUpdating(true)
    try {
      const payload = {
        ...selectedRoom.rawData,
        room_status: newStatus,
        updated_by_id: user?.id,
      }
      await RoomService.update(roomId, payload)
      setRooms((prev) =>
        prev.map((r) => (r.room_id === roomId ? { ...r, room_status: newStatus } : r)),
      )
      if (newStatus === 'cleaning') {
        setActiveHousekeepingTab('dirty')
        setStatusFilter('cleaning')
        toast.success(`Room ${selectedRoom.number} checked out and marked as Dirty.`)
      }
    } catch (err) {
      console.error('Failed to update room status:', err)
    } finally {
      setUpdating(false)
      setShowRoomDetails(false)
    }
  }

  const handleSaveSettings = async () => {
    if (!hotelId) return
    setSavingSettings(true)
    try {
      const payload = {
        hotelid: hotelId,
        show_left_category: uiSettings.show_left_category,
        show_room_text: uiSettings.show_room_text,
        room_box_size: uiSettings.room_box_size,
        color_vacant: uiSettings.color_vacant,
        color_occupied: uiSettings.color_occupied,
        color_cleaning: uiSettings.color_cleaning,
        color_reserved: uiSettings.color_reserved,
        color_maintenance: uiSettings.color_maintenance,
        color_reservation: uiSettings.color_reservation,
        text_color_vacant: uiSettings.text_color_vacant,
        text_color_occupied: uiSettings.text_color_occupied,
        text_color_cleaning: uiSettings.text_color_cleaning,
        text_color_reserved: uiSettings.text_color_reserved,
        text_color_maintenance: uiSettings.text_color_maintenance,
        text_color_reservation: uiSettings.text_color_reservation,
        border_color_vacant: uiSettings.border_color_vacant,
        border_color_occupied: uiSettings.border_color_occupied,
        border_color_cleaning: uiSettings.border_color_cleaning,
        border_color_reserved: uiSettings.border_color_reserved,
        border_color_maintenance: uiSettings.border_color_maintenance,
        border_color_reservation: uiSettings.border_color_reservation,
        occupied_warning_bg: uiSettings.occupied_warning_bg,
        occupied_warning_text: uiSettings.occupied_warning_text,
        occupied_expired_bg: uiSettings.occupied_expired_bg,
        occupied_expired_text: uiSettings.occupied_expired_text,
        dark_mode: uiSettings.dark_mode,
        updated_by_id: user?.id,
      }
      const res = await hotelSettingsApi.update(payload)
      if (res.success) {
        toast.success('Settings saved')
        setShowSettings(false)
      } else {
        toast.error(res.message || 'Failed to save settings')
      }
    } catch (err) {
      toast.error('Failed to save settings')
    } finally {
      setSavingSettings(false)
    }
  }

  const resetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setTypeFilter('all')
    setFloorFilter('all')
  }

  const handleClose = () => {
    navigate(-1)
  }

  const handleStatusFilterClick = (
    filter: RoomStatus | 'all' | 'maintenance' | 'reservation' | 'arrivals',
  ) => {
    setStatusFilter(filter)
    // Close ALL overlay sections so the rooms grid is visible
    setActiveSection(null)
    if (filter !== 'cleaning' && filter !== 'reserved' && filter !== 'maintenance') {
      setActiveHousekeepingTab(null)
      setSelectedHousekeepingRoomIds([])
    }
  }

  const handleCheckoutAlertClick = () => {
    if (showCheckoutAlertTable) {
      setActiveSection(null)
    } else {
      setActiveSection('checkout')
      fetchTodayCheckouts()
    }
  }

  const handleAtGlanceClick = () => {
    if (showAtGlanceTable) {
      setActiveSection(null)
    } else {
      setActiveSection('atglance')
      setAtGlanceFilter('all')
      fetchAtGlanceData()
    }
  }

  const handleArrivalSectionClick = () => {
    if (showArrivalSection) {
      setActiveSection(null)
    } else {
      setActiveSection('arrival')
      setAtGlanceFilter('all')
      fetchArrivalTableData(arrivalDate)
    }
  }

  // ---- helpers to close all panel sections ----

  const fetchReservTableData = async (filterDate?: string) => {
    if (!hotelId) return
    setLoadingReservTable(true)
    try {
      const res = await ReservationService.list({ hotelid: hotelId })
      const reservations: any[] = res.data || []
      const todayStr = filterDate || new Date().toISOString().slice(0, 10)

      // Show all reservations with today's arrival date that are NOT checked-in/checked-out
      const todayReservs = reservations.filter((r: any) => {
        const arrival = r.arrival_date ? String(r.arrival_date).slice(0, 10) : ''
        const status = (r.status || '').toLowerCase()
        return (
          arrival === todayStr &&
          status !== 'checkin' &&
          status !== 'checkout' &&
          status !== 'checked_in' &&
          status !== 'checked_out'
        )
      })

      const rows: any[] = []

      for (const r of todayReservs) {
        try {
          const roomRes = await ReservationRoomService.list({ reservation_id: r.reservation_id })
          const roomRows: any[] = roomRes?.data || []

          if (roomRows.length === 0) {
            // Reservation exists but no room rows yet — still show the reservation row
            rows.push({
              reservation_id: r.reservation_id,
              reservation_no: r.reservation_no || '-',
              guest_name: r.reservation_name || r.guest_name || '-',
              phone1: r.phone1 || '-',
              room_category_name: '-',
              converted_category_name: '-',
              arrival_date: r.arrival_date || '',
              arrival_time: r.arrival_time || '',
              departure_date: r.departure_date || '',
              departure_time: r.departure_time || '',
              total_rooms: 0,
              pax_price: 0,
              pax_count: 0,
              ex_pax_count: 0,
              child_count: 0,
              driver_count: 0,
              total_amount: 0,
              nights: r.nights || 0,
            })
          } else {
            for (const rm of roomRows) {
              rows.push({
                reservation_id: r.reservation_id,
                reservation_no: r.reservation_no || '-',
                guest_name: r.reservation_name || r.guest_name || '-',
                phone1: r.phone1 || '-',
                room_category_name: (rm as any).room_category_name || '-',
                converted_category_name: (rm as any).converted_category_name || '-',
                arrival_date: r.arrival_date || '',
                arrival_time: r.arrival_time || '',
                departure_date: r.departure_date || '',
                departure_time: r.departure_time || '',
                total_rooms: rm.total_rooms || 1,
                pax_price: rm.pax_price || 0,
                pax_count: rm.pax_count || 0,
                ex_pax_count: rm.ex_pax_count || 0,
                child_count: rm.child_count || 0,
                driver_count: rm.driver_count || 0,
                total_amount: rm.total_amount || 0,
                nights: r.nights || 0,
              })
            }
          }
        } catch {
          rows.push({
            reservation_id: r.reservation_id,
            reservation_no: r.reservation_no || '-',
            guest_name: r.reservation_name || r.guest_name || '-',
            phone1: r.phone1 || '-',
            room_category_name: '-',
            converted_category_name: '-',
            arrival_date: r.arrival_date || '',
            arrival_time: r.arrival_time || '',
            departure_date: r.departure_date || '',
            departure_time: r.departure_time || '',
            total_rooms: 0,
            pax_price: 0,
            pax_count: 0,
            ex_pax_count: 0,
            child_count: 0,
            driver_count: 0,
            total_amount: 0,
            nights: r.nights || 0,
          })
        }
      }

      setReservTableData(rows)
    } catch (err) {
      console.error('Failed to fetch reserv data', err)
    } finally {
      setLoadingReservTable(false)
    }
  }

  const fetchArrivalTableData = async (filterDate?: string) => {
    if (!hotelId) return
    setLoadingArrivalTable(true)
    try {
      const res = await ReservationService.list({ hotelid: hotelId })
      const reservations: any[] = res.data || []
      const todayStr = filterDate || new Date().toISOString().slice(0, 10)

      // Arrivals = ALL reservations with today's arrival date regardless of status
      const todayArrivals = reservations.filter((r: any) => {
        const arrival = r.arrival_date ? String(r.arrival_date).slice(0, 10) : ''
        return arrival === todayStr
      })

      const rows: any[] = []

      for (const r of todayArrivals) {
        try {
          const roomRes = await ReservationRoomService.list({ reservation_id: r.reservation_id })
          const roomRows: any[] = roomRes?.data || []

          if (roomRows.length === 0) {
            rows.push({
              reservation_id: r.reservation_id,
              reservation_no: r.reservation_no || '-',
              guest_name: r.reservation_name || r.guest_name || '-',
              phone1: r.phone1 || '-',
              room_category_name: '-',
              converted_category_name: '-',
              arrival_date: r.arrival_date || '',
              arrival_time: r.arrival_time || '',
              departure_date: r.departure_date || '',
              departure_time: r.departure_time || '',
              total_rooms: 0,
              pax_price: 0,
              pax_count: 0,
              ex_pax_count: 0,
              child_count: 0,
              driver_count: 0,
              total_amount: 0,
              nights: r.nights || 0,
            })
          } else {
            for (const rm of roomRows) {
              rows.push({
                reservation_id: r.reservation_id,
                reservation_no: r.reservation_no || '-',
                guest_name: r.reservation_name || r.guest_name || '-',
                phone1: r.phone1 || '-',
                room_category_name: (rm as any).room_category_name || '-',
                converted_category_name: (rm as any).converted_category_name || '-',
                arrival_date: r.arrival_date || '',
                arrival_time: r.arrival_time || '',
                departure_date: r.departure_date || '',
                departure_time: r.departure_time || '',
                total_rooms: rm.total_rooms || 1,
                pax_price: rm.pax_price || 0,
                pax_count: rm.pax_count || 0,
                ex_pax_count: rm.ex_pax_count || 0,
                child_count: rm.child_count || 0,
                driver_count: rm.driver_count || 0,
                total_amount: rm.total_amount || 0,
                nights: r.nights || 0,
              })
            }
          }
        } catch {
          rows.push({
            reservation_id: r.reservation_id,
            reservation_no: r.reservation_no || '-',
            guest_name: r.reservation_name || r.guest_name || '-',
            phone1: r.phone1 || '-',
            room_category_name: '-',
            converted_category_name: '-',
            arrival_date: r.arrival_date || '',
            arrival_time: r.arrival_time || '',
            departure_date: r.departure_date || '',
            departure_time: r.departure_time || '',
            total_rooms: 0,
            pax_price: 0,
            pax_count: 0,
            ex_pax_count: 0,
            child_count: 0,
            driver_count: 0,
            total_amount: 0,
            nights: r.nights || 0,
          })
        }
      }

      setArrivalTableData(rows)
    } catch (err) {
      console.error('Failed to fetch arrival data', err)
    } finally {
      setLoadingArrivalTable(false)
    }
  }

  const handleReservSectionClick = () => {
    if (showReservSection) {
      setActiveSection(null)
    } else {
      setActiveSection('reserv')
      fetchReservTableData(reservDate)
    }
  }

  const handleSettlementClick = () => {
    if (showSettlementSection) {
      setActiveSection(null)
    } else {
      setActiveSection('settlement')
      setActiveHousekeepingTab(null)
      setSelectedHousekeepingRoomIds([])
      // Fetch occupied rooms for pay type cross-reference
      if (occupiedRooms.length === 0) fetchOccupiedRooms()
      // Always fetch fresh checkout data
      fetchCheckoutData()
    }
  }


const handleViewChange = () => {
  setViewMode((prev) =>
    prev === 'floor' ? 'category' : 'floor'
  );
};

  // ==================== UPDATED fetchCheckoutData FUNCTION - SORT BY INVOICE NUMBER ASCENDING ====================
  const fetchCheckoutData = async () => {
    if (!hotelId) return
    setLoadingCheckoutData(true)
    try {
      const res = await CheckoutService.list({ hotelid: hotelId })
      const data: CheckoutMaster[] = res.data || []

      // First fetch payment data to get invoice numbers
      const payMap = new Map<number, string>() // store "payment_method|invoice_no"
      const invoiceMap = new Map<number, string>() // store invoice_no for sorting

      await Promise.all(
        data.map(async (co) => {
          try {
            const payRes = await CheckoutPaymentService.getByCheckoutId(co.checkout_id)
            const payments = payRes.data || []
            if (Array.isArray(payments) && payments.length > 0) {
              const payment = payments[0]
              const paymentMethod = payment.payment_method || 'Cash'
              const invoiceNo = payment.invoice_no || '-'
              payMap.set(co.checkout_id, `${paymentMethod}|${invoiceNo}`)
              invoiceMap.set(co.checkout_id, invoiceNo)
            } else if (payments && !Array.isArray(payments)) {
              const payment = payments as any
              const paymentMethod = payment.payment_method || 'Cash'
              const invoiceNo = payment.invoice_no || '-'
              payMap.set(co.checkout_id, `${paymentMethod}|${invoiceNo}`)
              invoiceMap.set(co.checkout_id, invoiceNo)
            }
          } catch {
            // payment fetch failed for this checkout — leave as undefined
            invoiceMap.set(co.checkout_id, `INV-${co.checkout_id}`)
          }
        }),
      )

      // Sort by invoice number ascending (0001, 0002, 0003)
      data.sort((a, b) => {
        const invA = invoiceMap.get(a.checkout_id) || ''
        const invB = invoiceMap.get(b.checkout_id) || ''
        // Extract numeric part for proper numeric sorting
        const numA = parseInt(invA.replace(/\D/g, '')) || 0
        const numB = parseInt(invB.replace(/\D/g, '')) || 0
        return numA - numB
      })

      setCheckoutData(data)
      setCheckoutPaymentMap(new Map(payMap))
    } catch (err) {
      console.error('Failed to fetch checkout data', err)
    } finally {
      setLoadingCheckoutData(false)
    }
  }

  const exportReservTableToExcel = (data: any[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(
      data.map((r, i) => ({
        'Sr.No': i + 1,
        'Reservation No': r.reservation_no,
        'Guest Name': r.guest_name,
        'Mobile No': r.phone1,
        'Room Category': r.room_category_name,
        'Convert Category': r.converted_category_name,
        'Arrival Date': r.arrival_date,
        'Arrival Time': r.arrival_time,
        'Departure Date': r.departure_date,
        'Departure Time': r.departure_time,
        'Total Rooms': r.total_rooms,
        'Room Price': r.pax_price,
        'Pax Count': r.pax_count,
        'Ex-Pax Count': r.ex_pax_count,
        'Child Count': r.child_count,
        'Driver Count': r.driver_count,
        'Total Price': r.total_amount,
        'Total Days': r.nights,
      })),
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    XLSX.writeFile(wb, filename)
  }

  const exportCheckoutToExcel = (data: CheckoutAlertItem[], filename: string) => {
    const ws = XLSX.utils.json_to_sheet(
      data.map((item) => ({
        'Sr.No': item.srNo,
        'Room No': item.roomNo,
        'Guest Name': item.guestName,
        Category: item.category,
        Adults: item.adults,
        Pax: item.pax,
        'Ex-Pax': item.exPax,
        Child: item.child,
        Driver: item.driver,
        'Total Days': item.totalNights != null ? item.totalNights : '-',
        'Total Amount': item.totalAmount || item.totalPrice,
        'Reg No': item.regNo || '-',
        'Booking Ref': item.booking || '-',
        'Plan Name': item.planName || '-',
        'Check-out Date & Time': formatDateTime(item.checkoutDatetime),
        'Check-in Date & Time': formatDateTime(item.checkinDatetime),
      })),
    )
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
    XLSX.writeFile(wb, filename)
  }

  const handlePrintCheckout = () => {
    const tableElement = document.querySelector('.checkout-table')
    if (!tableElement) {
      toast.error('No table to print')
      return
    }
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Please allow pop-ups to print')
      return
    }
    const hotel = hotelName || 'Hotel'
    const dateStr = new Date().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    printWindow.document.write(`
      <html>
        <head><title>${hotel} - Today's Checkouts</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .report-header { margin-bottom: 16px; }
          .hotel-name-row { font-size: 18px; font-weight: bold; margin-bottom: 6px; }
          .report-subheader { font-size: 13px; color: #555; }
          table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
          th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: 600; }
        </style>
        </head>
        <body>
          <div class="report-header">
            <div class="hotel-name-row">Hotel name: ${hotel}</div>
            <div class="report-subheader">Today's Checkouts — ${dateStr}</div>
          </div>
          ${tableElement.outerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  // ---- PDF: Today's Checkouts ----
  const handlePdfCheckout = async () => {
    const table = document.querySelector('.checkout-table')
    if (!table) {
      toast.error('No table found')
      return
    }
    try {
      const hotel = hotelName || 'Hotel'
      const dateStr = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      const wrapper = document.createElement('div')
      wrapper.style.cssText =
        'background:#fff;padding:20px;width:1400px;margin:auto;font-family:Arial,sans-serif;'
      const style = document.createElement('style')
      style.textContent = `table{width:100%;border-collapse:collapse;font-size:0.7rem;}th,td{border:1px solid #ccc;padding:4px 6px;text-align:left;}thead tr{background-color:#dfdfdf;font-weight:600;}.report-header{margin-bottom:16px;}.hotel-name-row{font-size:18px;font-weight:bold;margin-bottom:6px;}.report-subheader{font-size:13px;color:#555;}`
      wrapper.appendChild(style)
      const headerDiv = document.createElement('div')
      headerDiv.className = 'report-header'
      headerDiv.innerHTML = `<div class="hotel-name-row">Hotel name: ${hotel}</div><div class="report-subheader">Today's Checkouts — ${dateStr}</div>`
      wrapper.appendChild(headerDiv)
      wrapper.appendChild(table.cloneNode(true) as HTMLElement)
      document.body.appendChild(wrapper)
      const canvas = await html2canvas(wrapper, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      document.body.removeChild(wrapper)
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const imgWidth = 280
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
      pdf.save('todays-checkouts.pdf')
    } catch (err) {
      console.error(err)
      toast.error('PDF generation failed')
    }
  }

  // ---- PDF: Reservations ----
  const handlePdfReserv = async () => {
    const table = document.querySelector('.reserv-section-table:not(.settlement-section-table)')
    if (!table) {
      toast.error('No table found')
      return
    }
    try {
      const hotel = hotelName || 'Hotel'
      const dateStr = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      const wrapper = document.createElement('div')
      wrapper.style.cssText =
        'background:#fff;padding:20px;width:1400px;margin:auto;font-family:Arial,sans-serif;'
      const style = document.createElement('style')
      style.textContent = `table{width:100%;border-collapse:collapse;font-size:0.7rem;}th,td{border:1px solid #ccc;padding:4px 6px;text-align:left;}thead tr{background-color:#dfdfdf;font-weight:600;}tfoot tr{background-color:#f8f9fa;font-weight:600;}.report-header{margin-bottom:16px;}.hotel-name-row{font-size:18px;font-weight:bold;margin-bottom:6px;}.report-subheader{font-size:13px;color:#555;}`
      wrapper.appendChild(style)
      const headerDiv = document.createElement('div')
      headerDiv.className = 'report-header'
      headerDiv.innerHTML = `<div class="hotel-name-row">Hotel name: ${hotel}</div><div class="report-subheader">Today's Reservations — ${dateStr}</div>`
      wrapper.appendChild(headerDiv)
      wrapper.appendChild(table.cloneNode(true) as HTMLElement)
      document.body.appendChild(wrapper)
      const canvas = await html2canvas(wrapper, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      document.body.removeChild(wrapper)
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const imgWidth = 280
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
      pdf.save('todays-reservations.pdf')
    } catch (err) {
      console.error(err)
      toast.error('PDF generation failed')
    }
  }

  // ---- PDF: Arrivals ----
  const handlePdfArrival = async () => {
    const tables = document.querySelectorAll('.reserv-section-table:not(.settlement-section-table)')
    const table = tables[tables.length - 1]
    if (!table) {
      toast.error('No table found')
      return
    }
    try {
      const hotel = hotelName || 'Hotel'
      const dateStr = new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      const wrapper = document.createElement('div')
      wrapper.style.cssText =
        'background:#fff;padding:20px;width:1400px;margin:auto;font-family:Arial,sans-serif;'
      const style = document.createElement('style')
      style.textContent = `table{width:100%;border-collapse:collapse;font-size:0.7rem;}th,td{border:1px solid #ccc;padding:4px 6px;text-align:left;}thead tr{background-color:#dfdfdf;font-weight:600;}tfoot tr{background-color:#f8f9fa;font-weight:600;}.report-header{margin-bottom:16px;}.hotel-name-row{font-size:18px;font-weight:bold;margin-bottom:6px;}.report-subheader{font-size:13px;color:#555;}`
      wrapper.appendChild(style)
      const headerDiv = document.createElement('div')
      headerDiv.className = 'report-header'
      headerDiv.innerHTML = `<div class="hotel-name-row">Hotel name: ${hotel}</div><div class="report-subheader">Today's Arrivals — ${dateStr}</div>`
      wrapper.appendChild(headerDiv)
      wrapper.appendChild(table.cloneNode(true) as HTMLElement)
      document.body.appendChild(wrapper)
      const canvas = await html2canvas(wrapper, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      document.body.removeChild(wrapper)
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const imgWidth = 280
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
      pdf.save('todays-arrivals.pdf')
    } catch (err) {
      console.error(err)
      toast.error('PDF generation failed')
    }
  }

  const getFilterDisplayText = () => {
    switch (atGlanceFilter) {
      case 'all':
        return 'All'
      case 'available':
        return 'Vacant'
      case 'occupied':
        return 'Occupied'
      case 'cleaning':
        return 'Dirty'
      case 'reserved':
        return 'Block'
      case 'maintenance':
        return 'Maint'
      default:
        return 'All'
    }
  }

  const handlePrint = () => {
    const tableElement = document.querySelector('.at-glance-table')
    if (!tableElement) {
      toast.error('No table to print')
      return
    }
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Please allow pop-ups to print')
      return
    }
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map((style) => style.outerHTML)
      .join('')
    const now = new Date()
    const dateTimeStr = formatDateTime(now.toISOString())
    const filterText = getFilterDisplayText()
    const hotel = hotelName || 'Hotel'
    const title = `${hotel} - At a Glance Report`
    printWindow.document.write(`
      <html>
        <head><title>${title}</title>${styles}
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .report-header { margin-bottom: 20px; }
          .hotel-name-row { font-size: 18px; font-weight: bold; margin-bottom: 8px; }
          .report-subheader { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 14px; color: #555; }
          .at-glance-table { width: 100%; border-collapse: collapse; font-size: 0.7rem; }
          .at-glance-table th, .at-glance-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .at-glance-table th { background-color: #f2f2f2; }
        </style>
        </head>
        <body>
          <div class="report-header">
            <div class="hotel-name-row">Hotel name: ${hotel}</div>
            <div class="report-subheader"><div>At a Glance Report</div><div>Filter: ${filterText} | Date & Time: ${dateTimeStr}</div></div>
          </div>
          ${tableElement.outerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const handlePDF = async () => {
    const table = document.querySelector('.at-glance-table')
    if (!table) {
      toast.error('No table found')
      return
    }
    try {
      const wrapper = document.createElement('div')
      wrapper.style.background = '#fff'
      wrapper.style.padding = '20px'
      wrapper.style.width = '1300px'
      wrapper.style.margin = 'auto'
      const style = document.createElement('style')
      style.textContent = `
        :root { 
          --color-vacant: ${getStatusBgColor('available')}; 
          --color-occupied: ${getStatusBgColor('occupied')}; 
          --color-cleaning: ${getStatusBgColor('cleaning')}; 
          --color-reserved: ${getStatusBgColor('reserved')};
          --color-maintenance: ${getStatusBgColor('maintenance')};
        }
        .at-glance-table { width: 100%; border-collapse: collapse; font-size: 0.7rem; }
        .at-glance-table th, .at-glance-table td { border: 1px solid #ccc; padding: 4px; text-align: left; }
        .at-glance-table thead tr { background-color: #dfdfdf; }
        .at-glance-table tfoot tr { background-color: #f8f9fa; }
        .report-header { margin-bottom: 20px; }
        .hotel-name-row { font-size: 18px; font-weight: bold; margin-bottom: 8px; }
        .report-subheader { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 14px; color: #555; }
      `
      wrapper.appendChild(style)
      const headerDiv = document.createElement('div')
      headerDiv.className = 'report-header'
      const now = new Date()
      const dateTimeStr = formatDateTime(now.toISOString())
      const filterText = getFilterDisplayText()
      const hotel = hotelName || 'Hotel'
      headerDiv.innerHTML = `
        <div class="hotel-name-row">Hotel name: ${hotel}</div>
        <div class="report-subheader"><div>At a Glance Report</div><div>Filter: ${filterText} | Date & Time: ${dateTimeStr}</div></div>
      `
      wrapper.appendChild(headerDiv)
      const tableClone = table.cloneNode(true) as HTMLElement
      tableClone.querySelectorAll('thead tr, tfoot tr').forEach((el) => {
        ;(el as HTMLElement).style.position = 'static'
      })
      wrapper.appendChild(tableClone)
      document.body.appendChild(wrapper)
      const canvas = await html2canvas(wrapper, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })
      document.body.removeChild(wrapper)
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const imgWidth = 280
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
      pdf.save('at-a-glance.pdf')
    } catch (err) {
      console.error(err)
      toast.error('PDF generation failed')
    }
  }

  const handleExcel = () => {
    if (filteredAtGlanceData.length === 0) {
      toast.error('No data to export')
      return
    }
    const excelData = filteredAtGlanceData.map((item) => ({
      'Floor No': item.floorNo,
      'Room No': item.roomNo,
      'Original Category': item.roomCategory,
      Guest: item.guest,
      'Total Amt': item.totalAmt,
      'Discount %': item.discountPercent,
      'Pay Type': item.payType,
      'Plan Name': item.planName || '',
      'Check-in Date & Time': item.checkinDatetime ? formatDateTime(item.checkinDatetime) : '-',
      'Check-out Date & Time': item.checkoutDatetime ? formatDateTime(item.checkoutDatetime) : '-',
      Pax: item.pax,
      'Ex-Pax': item.exPax,
      Child: item.child,
      Driver: item.driver,
      'Converted Category': item.convertedCategory,
    }))
    const ws = XLSX.utils.json_to_sheet(excelData)
    const now = new Date()
    const dateTimeStr = formatDateTime(now.toISOString())
    const filterText = getFilterDisplayText()
    const hotel = hotelName || 'Hotel'
    const headerRows = [
      [`Hotel name: ${hotel}`],
      ['At a Glance Report', `Filter: ${filterText} | Date & Time: ${dateTimeStr}`],
      [],
    ]
    XLSX.utils.sheet_add_aoa(ws, headerRows, { origin: 'A1' })
    if (ws['!cols']) {
      ws['!cols'] = ws['!cols'] || []
      ws['!cols'][0] = { wch: 20 }
    }
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'At a Glance')
    XLSX.writeFile(wb, `at-a-glance-${atGlanceFilter}.xlsx`)
  }

  const filteredAtGlanceData = useMemo(() => {
    if (!showAtGlanceTable) return []
    if (atGlanceFilter === 'all') return atGlanceData
    return atGlanceData.filter((item) => item.status === atGlanceFilter)
  }, [atGlanceData, atGlanceFilter, showAtGlanceTable])

  const statusCounts = useMemo(() => {
    const counts = { available: 0, occupied: 0, cleaning: 0, reserved: 0, maintenance: 0 }
    filteredAtGlanceData.forEach((item) => {
      if (item.status === 'available') counts.available++
      else if (item.status === 'occupied') counts.occupied++
      else if (item.status === 'cleaning') counts.cleaning++
      else if (item.status === 'reserved') counts.reserved++
      else if (item.status === 'maintenance') counts.maintenance++
    })
    return counts
  }, [filteredAtGlanceData])

  const fetchAtGlanceData = async () => {
    if (!hotelId) return
    setLoadingAtGlance(true)
    setErrorAtGlance(null)
    try {
      const [roomsRes, catsRes, floorsRes, checkinsRes, detailsRes, foliosRes] = await Promise.all([
        RoomService.list({ hotelid: hotelId }),
        RoomCategoryService.list({ hotelid: Number(hotelId) }),
        FloorService.list({ hotelid: hotelId }),
        CheckInService.list({ hotelid: hotelId }),
        DetailService.list({ hotelid: hotelId }),
        GuestFolioService.list({ hotelid: hotelId }),
      ])
      const allRooms = roomsRes.data || []
      const categoriesData = catsRes.data || []
      const floorsData = floorsRes.data || []
      const checkins = checkinsRes.data || []
      const details = detailsRes.data || []
      const folios = foliosRes.data || []

      const roomCategoryMap = new Map<number, string>()
      categoriesData.forEach((cat) => roomCategoryMap.set(cat.room_category_id, cat.category_name))

      const floorMap = new Map<number, { name: string; number: number }>()
      floorsData.forEach((floor) =>
        floorMap.set(floor.floor_id, { name: floor.floor_name, number: floor.floor_number }),
      )

      const checkinMap = new Map<number, CheckIn>()
      checkins.forEach((c) => checkinMap.set(c.checkin_id, c))

      const activeDetailMap = new Map<number, Detail[]>()
      details.forEach((d) => {
        if (d.is_checkout === 0) {
          if (!activeDetailMap.has(d.room_id)) activeDetailMap.set(d.room_id, [])
          activeDetailMap.get(d.room_id)!.push(d)
        }
      })

      const paymentMethodMap = new Map<number, string>()
      folios.forEach((folio: GuestFolio) => {
        if (folio.checkin_id && !paymentMethodMap.has(folio.checkin_id)) {
          paymentMethodMap.set(folio.checkin_id, folio.payment_method || 'Cash')
        }
      })

      const activeCheckinIds = [
        ...new Set(
          details.filter((d: Detail) => d.is_checkout === 0).map((d: Detail) => d.checkin_id),
        ),
      ]

      const checkinRoomChargesMap = new Map<number, Map<number, number>>()
      const checkinRoomPostChargesMap = new Map<number, Map<number, number>>()
      const checkinAdvanceMap = new Map<number, Map<number, number>>()

      for (const cid of activeCheckinIds) {
        try {
          const chargesRes = await GuestRoomChargesService.list({ checkin_id: cid })
          const allCharges = chargesRes.data || []
          const roomChargesMap = new Map<number, number>()
          const roomPostMap = new Map<number, number>()
          allCharges.forEach((c: any) => {
            if (!c.room_id) return
            const amt = Number(c.total_amount) || 0
            if (c.category_id === null || c.category_id === undefined) {
              roomPostMap.set(c.room_id, (roomPostMap.get(c.room_id) || 0) + amt)
            } else {
              roomChargesMap.set(c.room_id, (roomChargesMap.get(c.room_id) || 0) + amt)
            }
          })
          checkinRoomChargesMap.set(cid, roomChargesMap)
          checkinRoomPostChargesMap.set(cid, roomPostMap)
        } catch {
          checkinRoomChargesMap.set(cid, new Map())
          checkinRoomPostChargesMap.set(cid, new Map())
        }

        try {
          const advRes = await AdvanceTransactionService.list({ checkin_id: cid })
          const roomAdvMap = new Map<number, number>()
          const globalCredits = { v: 0 }
          const globalDebits = { v: 0 }
          const roomCredits = new Map<number, number>()
          const roomDebits = new Map<number, number>()
          ;(advRes.data || []).forEach((t: any) => {
            const rid = t.room_id
            const isCredit =
              t.transaction_type === 'Booking Receipt' || t.transaction_type === 'Advance Addition'
            const isDebit =
              t.transaction_type === 'Advance Posting' ||
              t.transaction_type === 'Advance Refund' ||
              t.transaction_type === 'Advance Cancel'
            if (t.status !== 'active') return
            if (!rid) {
              if (isCredit) globalCredits.v += t.credit_amount || 0
              if (isDebit) globalDebits.v += t.debit_amount || 0
            } else {
              if (isCredit)
                roomCredits.set(rid, (roomCredits.get(rid) || 0) + (t.credit_amount || 0))
              if (isDebit) roomDebits.set(rid, (roomDebits.get(rid) || 0) + (t.debit_amount || 0))
            }
          })
          for (const [rid, credit] of roomCredits) {
            roomAdvMap.set(rid, credit - (roomDebits.get(rid) || 0))
          }
          const hasRoomSpecific = roomAdvMap.size > 0
          if (!hasRoomSpecific && (globalCredits.v > 0 || globalDebits.v > 0)) {
            roomAdvMap.set(0, globalCredits.v - globalDebits.v)
          }
          checkinAdvanceMap.set(cid, roomAdvMap)
        } catch {
          checkinAdvanceMap.set(cid, new Map())
        }
      }

      const items: AtGlanceItem[] = []
      for (const room of allRooms) {
        const roomDetails = activeDetailMap.get(room.room_id) || []
        const latestDetail = roomDetails[roomDetails.length - 1]

        let guest = '',
          totalAmt = 0,
          groupAmt = 0,
          discountPercent = 0,
          payType = '',
          checkinDatetime = '',
          checkoutDatetime = '',
          pax = 0,
          adults = 0,
          exPax = 0,
          child = 0,
          driver = 0,
          convertedCategory = '',
          planName = ''

        if (latestDetail) {
          const checkin = checkinMap.get(latestDetail.checkin_id)
          if (checkin) {
            guest = checkin.guest_name || ''
            discountPercent = latestDetail.discount_percent || 0
            payType = paymentMethodMap.get(latestDetail.checkin_id) || 'Cash'
            checkinDatetime = latestDetail.checkin_datetime || checkin.checkin_datetime
            checkoutDatetime = latestDetail.checkout_datetime || checkin.checkout_datetime
            pax = latestDetail.pax || 0
            adults = latestDetail.adults || 0
            exPax = latestDetail.ex_pax || 0
            child = checkin.child_paid || 0
            driver = latestDetail.driver || 0
            convertedCategory = latestDetail.converted_category_name || ''
            planName = checkin.plan_name || ''

            const cid = latestDetail.checkin_id
            const rid = room.room_id
            const roomCharges = checkinRoomChargesMap.get(cid)?.get(rid) || 0
            const roomPostCharges = checkinRoomPostChargesMap.get(cid)?.get(rid) || 0
            const advMap = checkinAdvanceMap.get(cid) || new Map()
            const hasRoomSpecific = [...advMap.keys()].some((k) => k !== 0)
            const pendingAdv = hasRoomSpecific ? advMap.get(rid) || 0 : advMap.get(0) || 0
            totalAmt = roomCharges + roomPostCharges - pendingAdv
            groupAmt = 0
          }
        }
        const computedTotalDays =
          checkinDatetime && checkoutDatetime
            ? Math.max(
                1,
                Math.ceil(
                  (new Date(checkoutDatetime).getTime() - new Date(checkinDatetime).getTime()) /
                    (1000 * 3600 * 24),
                ),
              )
            : undefined
        const originalCategory = roomCategoryMap.get(room.room_category_id) || 'Uncategorized'
        const floorInfo = floorMap.get(room.floor_id ?? 0) || {
          name: `Floor ${room.floor_id}`,
          number: room.floor_id,
        }
        items.push({
          floorNo: floorInfo.name,
          floorId: Number((floorInfo as any).number ?? room.floor_id),
          roomNo: room.room_no,
          guest,
          totalAmt,
          groupAmt,
          discountPercent,
          payType,
          checkinDatetime,
          checkoutDatetime,
          pax,
          adults,
          exPax,
          child,
          driver,
          roomCategory: originalCategory,
          status: room.room_status as RoomStatus,
          roomId: room.room_id,
          convertedCategory,
          planName,
          totalDays: computedTotalDays,
        })
      }
      items.sort((a, b) => {
        if (a.floorId !== b.floorId) return a.floorId - b.floorId
        return a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true })
      })
      setAtGlanceData(items)
    } catch (err) {
      console.error('Failed to fetch at a glance data:', err)
      setErrorAtGlance('Could not load at a glance data. Please try again.')
    } finally {
      setLoadingAtGlance(false)
    }
  }

  useEffect(() => {
    if (showAtGlanceTable) fetchAtGlanceData()
  }, [showAtGlanceTable, hotelId])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault()
        handleCheckInClick()
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        navigate(-1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedRoomIds])

  useEffect(() => {
    if (!hotelId) return
    const fetchTodayReservationCount = async () => {
      try {
        const res = await ReservationService.list({ hotelid: hotelId })
        const reservations = res.data || []
        const todayStr = new Date().toISOString().slice(0, 10)
        const count = reservations.filter((r: any) => {
          const arrival = r.arrival_date ? String(r.arrival_date).slice(0, 10) : ''
          return arrival === todayStr
        }).length
        setTodayReservationCount(count)
      } catch (err) {
        console.error('Failed to fetch reservation count', err)
      }
    }
    fetchTodayReservationCount()
  }, [hotelId])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showContextMenu) {
        const menu = document.getElementById('custom-context-menu')
        if (menu && !menu.contains(e.target as Node)) closeContextMenu()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showContextMenu])

  // ==================== HOUSEKEEPING TAB HANDLERS ====================
  const handleHousekeepingTabClick = (tab: HousekeepingTab) => {
    if (tab === null) {
      setActiveHousekeepingTab(null)
      setSelectedHousekeepingRoomIds([])
      return
    }
    if (activeHousekeepingTab === tab) {
      // Re-clicking the same tab (including 'all') closes the panel
      setActiveHousekeepingTab(null)
      setSelectedHousekeepingRoomIds([])
    } else {
      setActiveHousekeepingTab(tab)
      setSelectedHousekeepingRoomIds([])
    }
  }

  const housekeepingRoomsForTab = useMemo(() => {
    if (!activeHousekeepingTab) return []
    if (activeHousekeepingTab === 'all') {
      return enrichedRooms.filter(
        (r) => r.status === 'cleaning' || r.status === 'reserved' || r.status === 'maintenance',
      )
    }
    if (activeHousekeepingTab === 'dirty') {
      return enrichedRooms.filter((r) => r.status === 'cleaning')
    }
    if (activeHousekeepingTab === 'block') {
      return enrichedRooms.filter((r) => r.status === 'reserved')
    }
    if (activeHousekeepingTab === 'maint') {
      return enrichedRooms.filter((r) => r.status === 'maintenance')
    }
    return []
  }, [activeHousekeepingTab, enrichedRooms])

  const toggleHousekeepingRoomSelection = (roomId: number) => {
    setSelectedHousekeepingRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId],
    )
  }

  const handleSelectAllHousekeepingForSection = (roomIds: number[]) => {
    setSelectedHousekeepingRoomIds((prev) => {
      // Add only those not already selected
      const newIds = [...prev]
      for (const id of roomIds) {
        if (!newIds.includes(id)) {
          newIds.push(id)
        }
      }
      return newIds
    })
  }

  const handleRemoveSelectionForSection = async (roomIds: number[]) => {
    // Only act on rooms that are currently selected
    const toMakeAvailable = roomIds.filter((id) => selectedHousekeepingRoomIds.includes(id))
    if (toMakeAvailable.length === 0) {
      toast.error(
        'No rooms selected. Please select rooms first using "Select All" or by clicking individual room cards.',
      )
      return
    }
    try {
      await Promise.all(
        toMakeAvailable.map((id) => {
          const room = enrichedRooms.find((r) => r.id === id)
          if (!room) return Promise.resolve()
          return RoomService.update(id, {
            ...room.rawData,
            room_status: 'available' as RoomStatus,
            updated_by_id: user?.id,
          })
        }),
      )
      // Deselect those rooms
      setSelectedHousekeepingRoomIds((prev) => prev.filter((id) => !toMakeAvailable.includes(id)))
      // Refresh room data
      await handleRoomStatusChangeSuccess()
      toast.success(`${toMakeAvailable.length} room(s) marked as Vacant.`)
    } catch (err) {
      console.error('Failed to make rooms vacant:', err)
      toast.error('Failed to update room status. Please try again.')
    }
  }

  // Note: handleMakeRoomsAvailable function was removed as it was unused

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading rooms...</span>
        </div>
        <p className="mt-2 text-muted">Loading room data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center vh-100">
        <i className="fi fi-rr-exclamation text-danger fs-1 mb-3"></i>
        <p className="text-danger">{error}</p>
        <Button variant="outline-primary" onClick={() => window.location.reload()}>
          Retry
        </Button>
        <Button variant="outline-secondary" className="mt-2" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    )
  }

  const groups = viewMode === 'floor' ? groupedFloors : groupedCategoriesView

  return (
    <>
      <TitleHelmet title="Room Management" />
      <style>{`
        /* === ROOM TILES === */
        .room-tile {
          position: relative;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: stretch;
          justify-content: flex-start;
          padding: 0;
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out;
          overflow: hidden;
        }
        .room-tile:hover { transform: scale(1.02); box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 5; }
        .room-tile-size1 { width: 60px !important; min-height: 40px !important; font-size: 0.7rem; }
        .room-tile-size1 .small { display: none !important; }
        .room-tile-size2 { width: 75px !important; min-height: 50px !important; font-size: 0.75rem; }
        .room-tile-size3 { width: 90px !important; min-height: 60px !important; font-size: 0.8rem; }
        .room-tile-size4 { width: 105px !important; min-height: 70px !important; font-size: 0.85rem; }
        .room-tile-size5 { width: 120px !important; min-height: 80px !important; font-size: 0.9rem; }
        .room-tile-size6 { width: 135px !important; min-height: 90px !important; font-size: 0.95rem; }

        /* === ROOM CHECKBOX === */
        .room-checkbox { position: absolute; top: 4px; left: 4px; width: 16px; height: 16px; cursor: pointer; z-index: 2; }
        .room-checkbox:disabled { cursor: not-allowed; opacity: 0.5; }

        /* === OCCUPIED TILES === */
        .occupied-tile {
          height: auto !important;
          min-height: 110px;
          font-size: 0.72rem;
          line-height: 1.3;
          display: flex;
          flex-direction: column;
          padding: 0;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          transition: all 0.2s ease-in-out;
          cursor: pointer;
        }
        .occupied-tile:hover { transform: scale(1.02); box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 10; }
        @keyframes pulseWarning {
          0%   { background-color: #b96eff; box-shadow: 0 0 0 0 rgba(185,110,255,0.7); }
          30%  { background-color: #b96eff; box-shadow: 0 0 0 6px rgba(185,110,255,0); }
          70%  { background-color: #a04bff; box-shadow: 0 0 0 6px rgba(185,110,255,0); }
          100% { background-color: #b96eff; box-shadow: 0 0 0 0 rgba(185,110,255,0); }
        }
        .occupied-tile-checkout-near { animation: pulseWarning 2s infinite; animation-delay: calc(-1 * (var(--pulse-offset, 0) * 1ms)); }
        .occupied-tile-expired { background-color: #E03F4F !important; border: 2px solid #E03F4F !important; }
        .occupied-header { background: #000; color: #fff; font-weight: 600; padding: 2px 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .occupied-body { padding: 4px 6px; flex: 1; }
        .occupied-body div { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .occupied-body .charges-line { border-top: 1px dotted #888; padding-top: 2px; margin-top: 2px; display: flex; justify-content: space-between; align-items: center; gap: 4px; white-space: nowrap; overflow: hidden; }
        .occupied-body .charges-line span:first-child { color: #333; font-size: 0.68rem; }
        .occupied-body .charges-line span:last-child { font-weight: 700; color: #1a1a1a; font-size: 0.68rem; }

        /* === ANIMATIONS === */
        @keyframes pulseBadge {
          0%   { opacity: 1; transform: scale(1); }
          50%  { opacity: 0.7; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        .checkout-soon-badge { display: inline-block; background-color: #ff0000; color: #fff; font-weight: bold; font-size: 0.65rem; text-align: center; border-radius: 2px; padding: 1px 4px; margin-top: 4px; animation: pulseBadge 1s infinite; }

        /* === TABLES === */
        .checkout-table, .at-glance-table, .reserv-section-table { width: 100%; border-collapse: collapse; font-size: 0.70rem; }
        .checkout-table th, .at-glance-table th { position: sticky; top: 0; background-color: #dfdfdf; font-weight: 550; z-index: 10; padding: 0.35rem; }
        .checkout-table td, .at-glance-table td { border: 1px solid #dee2e6; padding: 0.35rem; text-align: left; }
        .at-glance-table thead tr { position: sticky; top: 0; background-color: #dfdfdf; z-index: 20; }
        .at-glance-table tfoot tr { position: sticky; bottom: 0; background-color: #f8f9fa; z-index: 20; }
        .at-glance-table tfoot td { background-color: inherit; border-top: 2px solid #dee2e6; }
        .reserv-section-table th, .reserv-section-table td { border: 1px solid #dee2e6; padding: 4px 7px; white-space: nowrap; }
        .reserv-section-table thead tr { background: #f1f5fb; font-weight: 600; position: sticky; top: 0; z-index: 1; }
        .reserv-section-table tbody tr:hover { background: #f8f9fa; }
        .reserv-section-table tfoot tr td { background: #f1f5fb; }
        body.dark-mode th, body.dark-mode .at-glance-table th { background-color: #2c2c2c; color: #eee; }
        body.dark-mode .checkout-table td, body.dark-mode .at-glance-table td { border-color: #444; }
        body.dark-mode .at-glance-table thead tr { background-color: #2c2c2c; color: #eee; }
        body.dark-mode .at-glance-table tfoot tr { background-color: #2a2a2a; border-top-color: #444; }

        /* === STATUS-COLORED BUTTONS (dynamic — must stay inline) === */
        .btn-status-available { background-color: ${getStatusBgColor('available')} !important; color: ${getStatusTextColor('available')} !important; border: 1px solid ${getStatusBorderColor('available')} !important; }
        .btn-outline-status-available { background-color: transparent !important; color: ${getStatusTextColor('available')} !important; border: 1px solid ${getStatusBorderColor('available')} !important; }
        .btn-status-occupied { background-color: ${getStatusBgColor('occupied')} !important; color: ${getStatusTextColor('occupied')} !important; border: 1px solid ${getStatusBorderColor('occupied')} !important; }
        .btn-outline-status-occupied { background-color: transparent !important; color: ${getStatusTextColor('occupied')} !important; border: 1px solid ${getStatusBorderColor('occupied')} !important; }
        .btn-status-cleaning { background-color: ${getStatusBgColor('cleaning')} !important; color: ${getStatusTextColor('cleaning')} !important; border: 1px solid ${getStatusBorderColor('cleaning')} !important; }
        .btn-outline-status-cleaning { background-color: transparent !important; color: ${getStatusTextColor('cleaning')} !important; border: 1px solid ${getStatusBorderColor('cleaning')} !important; }
        .btn-status-reserved { background-color: ${getStatusBgColor('reserved')} !important; color: ${getStatusTextColor('reserved')} !important; border: 1px solid ${getStatusBorderColor('reserved')} !important; }
        .btn-outline-status-reserved { background-color: transparent !important; color: ${getStatusTextColor('reserved')} !important; border: 1px solid ${getStatusBorderColor('reserved')} !important; }
        .btn-status-maintenance { background-color: ${getStatusBgColor('maintenance')} !important; color: ${getStatusTextColor('maintenance')} !important; border: 1px solid ${getStatusBorderColor('maintenance')} !important; }
        .btn-outline-status-maintenance { background-color: transparent !important; color: ${getStatusTextColor('maintenance')} !important; border: 1px solid ${getStatusBorderColor('maintenance')} !important; }

        /* === MISC UTILITIES === */
        .text-red { color: red !important; font-weight: bold; }
        .status-footer-badge { display: inline-block; padding: 6px 10px; font-size: 0.7rem; font-weight: 600; margin-right: 2px; }
        .status-footer { position: sticky; bottom: 0; background-color: #f8f9fa; border-top: 2px solid #dee2e6; font-weight: bold; }
        body.dark-mode .status-footer { background-color: #2a2a2a; border-top-color: #444; }
        .group-box { width: 90px; background-color: #E5E7EB !important; border: 1px solid #5e5e5e !important; color: #606060 !important; display: flex; justify-content: center; align-items: center; text-align: center; padding: 5px; word-break: break-word; white-space: normal; }
        .same-btn { min-width: 40px; text-align: center; }
        .charge-breakdown { background: #f8f9fa; padding: 12px; border-radius: 8px; margin: 12px 0; font-size: 0.85rem; }
        .charge-breakdown p { margin: 4px 0; display: flex; justify-content: space-between; }
        .charge-breakdown .total-line { border-top: 1px solid #dee2e6; margin-top: 8px; padding-top: 8px; font-weight: bold; }
        .discount-text { color: #28a745; font-size: 0.75rem; }
        .tax-text { color: #856404; font-size: 0.75rem; }
        .booking-type-badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 0.6rem; font-weight: 600; margin-left: 4px; }
        .booking-type-agent { background-color: #ff6b6b; color: #fff; }
        .booking-type-walkin { background-color: #4ecdc4; color: #fff; }
        .booking-type-online { background-color: #45b7d1; color: #fff; }
        .agent-name-text { font-size: 0.65rem; color: #000; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* === HOUSEKEEPING === */
        .housekeeping-section { border: 1px solid #e0e0e0; margin-bottom: 0.3rem; background-color: #fff; }
        .housekeeping-section-header { background-color: #f8f9fa; padding: 0.3rem 0.5rem; font-weight: 500; font-size: 0.78rem; border-bottom: 1px solid #e0e0e0; display: flex; align-items: center; justify-content: space-between; }
        .housekeeping-section-header-left { display: flex; align-items: center; gap: 0.5rem; }
        .housekeeping-section-body { padding: 0.4rem 0.5rem; display: flex; flex-wrap: nowrap; gap: 0.5rem; overflow-x: auto; overflow-y: hidden; scrollbar-width: none; -ms-overflow-style: none; }
        .housekeeping-section-body::-webkit-scrollbar { display: none; }
        .housekeeping-section-body > div { flex-shrink: 0; }
        /* Dirty rooms vertical scroll grid layout */
        .dirty-rooms-body { padding: 0.4rem 0.5rem; height:130px; min-height: 130px; max-height: 130px; display: flex; flex-wrap: wrap; gap: 0.3rem; overflow-x: hidden; overflow-y: auto; align-content: flex-start; scrollbar-width: thin; scrollbar-color: #c8c8c8 #f1f1f1; }
        .dirty-rooms-body::-webkit-scrollbar { width: 5px; display: block !important; }
        .dirty-rooms-body::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        .dirty-rooms-body::-webkit-scrollbar-thumb { background: #c8c8c8; border-radius: 4px; }
        .dirty-rooms-grid-col { display: contents; }
        .dirty-room-card { width: 83px; height: 50px; border: 1.5px solid #FACC15; border-radius: 0px; background: #FFF4CC; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: 4px 6px; transition: all 0.15s ease; position: relative; }
        .dirty-room-card:hover { border-color: #D4A017; box-shadow: 0 2px 8px rgba(212,160,23,0.3); }
        .dirty-room-card.selected { border-color: #D4A017; background: #FEF08A; box-shadow: 0 0 0 2px #FACC1555, 0 2px 8px rgba(0,0,0,0.15); }
        .dirty-room-card .hk-checkbox { position: absolute; top: 5px; left: 6px; width: 13px; height: 13px; cursor: pointer; accent-color: #D4A017; }
        .dirty-room-card .room-number { font-weight: 700; font-size: 0.9rem; color: #92610A; line-height: 1.1; text-align: center; margin-top: 4px; }
        .dirty-room-card .room-category { font-size: 0.65rem; font-weight: 500; color: #92610A; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80px; }
        .hk-arrow-btn { display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; border: 1px solid #ced4da; border-radius: 3px; background: #fff; cursor: pointer; font-size: 0.85rem; font-weight: 700; color: #495057; flex-shrink: 0; user-select: none; line-height: 1; transition: background 0.12s, border-color 0.12s; }
        .hk-arrow-btn:hover { background: #e9ecef; border-color: #adb5bd; }

        /* === SCROLLBARS === */
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: #c8c8c8; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
        ::-webkit-scrollbar-corner { background: #f1f1f1; }
        * { scrollbar-width: thin; scrollbar-color: #c8c8c8 #f1f1f1; }
        .housekeeping-section-body { scrollbar-width: none !important; -ms-overflow-style: none !important; }
        .housekeeping-section-body::-webkit-scrollbar { display: none !important; }
        .dirty-rooms-body { scrollbar-width: thin !important; }
        .dirty-rooms-body::-webkit-scrollbar { display: block !important; width: 5px !important; height: auto !important; }
      `}</style>

      <div
        style={
          {
            '--color-vacant': getStatusBgColor('available'),
            '--color-occupied': getStatusBgColor('occupied'),
            '--color-cleaning': getStatusBgColor('cleaning'),
            '--color-reserved': getStatusBgColor('reserved'),
            '--color-main': getStatusBgColor('maintenance'),
          } as React.CSSProperties
        }>
        <div className="d-flex flex-column vh-100">
          {/* Header */}
          <div className="flex-shrink-0 p-2 pb-0 bg-white">
            <div className="border-bottom pb-2 mb-2">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
                <div className="d-flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={statusFilter === 'all' ? 'dark' : 'outline-dark'}
                    onClick={() => handleStatusFilterClick('all')}
                    className="fw-semibold px-3 same-btn">
                    <i className="fi fi-rr-apps me-1"></i>ALL [{stats.total}]
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleStatusFilterClick('available')}
                    className={`fw-semibold px-3 same-btn ${statusFilter === 'available' ? 'btn-status-available' : 'btn-outline-status-available'}`}>
                    <i className="fi fi-rr-bed-empty me-1"></i>VACCOUNT[{stats.available}]
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleStatusFilterClick('occupied')}
                    className={`fw-semibold px-3 same-btn ${statusFilter === 'occupied' ? 'btn-status-occupied' : 'btn-outline-status-occupied'}`}>
                    <i className="fi fi-rr-user me-1"></i>OCCUPIED [{stats.occupied}]
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (activeHousekeepingTab) {
                        // Panel is open — close it and go back to 'all' rooms view
                        handleHousekeepingTabClick(null)
                        handleStatusFilterClick('all')
                      } else {
                        // Panel is closed — open it
                        handleStatusFilterClick('cleaning')
                        handleHousekeepingTabClick('all')
                      }
                    }}
                    className={`fw-semibold px-3 same-btn ${activeHousekeepingTab ? 'btn-status-cleaning' : 'btn-outline-status-cleaning'}`}>
                    <i className="fi fi-rr-lock me-1"></i>BLOCK
                  </Button>
                  <Button
                    size="sm"
                    variant={showArrivalSection ? 'secondary' : 'outline-secondary'}
                    style={
                      statusFilter === 'reservation'
                        ? {
                            backgroundColor: getStatusBgColor('reservation'),
                            borderColor: getStatusBorderColor('reservation'),
                            color: getStatusTextColor('reservation'),
                          }
                        : {
                            backgroundColor: 'transparent',
                            borderColor: getStatusBorderColor('reservation'),
                            color: getStatusTextColor('reservation'),
                          }
                    }
                    onClick={handleReservSectionClick}
                    className="fw-semibold px-3 same-btn">
                    <i className="fi fi-rr-calendar me-1"></i>RESERVATION
                  </Button>
                  <Button
                    size="sm"
                    variant={showArrivalSection ? 'info' : 'outline-info'}
                    onClick={handleArrivalSectionClick}
                    className="fw-semibold px-3 same-btn text-nowrap">
                    <i className="fi fi-rr-plane-arrival me-1"></i>ARRIVALS
                  </Button>
                  <Button
                    size="sm"
                    variant={showSettlementSection ? 'success' : 'outline-success'}
                    className="fw-semibold px-3 same-btn"
                    onClick={handleSettlementClick}>
                    <i className="fi fi-rr-money-check me-1"></i>SETTLEMENT
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    className="fw-semibold px-3 same-btn"
                    onClick={() => navigate('/hotel/reservation')}>
                    Reservation Form
                  </Button>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline-primary"
                    className="fw-semibold text-nowrap px-3"
                    onClick={handleAtGlanceClick}>
                    At Glance
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-success"
                    className="d-flex align-items-center justify-content-center same-btn"
                    onClick={() => setShowSettings(true)}
                    title="Settings">
                    <i className="fi fi-rr-settings"></i>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-danger"
                    className="d-flex align-items-center justify-content-center same-btn"
                    onClick={handleClose}
                    title="Close">
                    <i className="fi fi-rr-cross"></i>
                  </Button>
                </div>
              </div>
              <div className="d-flex gap-2 flex-wrap align-items-center">
               
                    <Button
      size="sm"
      variant="primary"
      className="same-btn"
      onClick={handleViewChange}
    >
      <i className="fi fi-rr-apps me-1"></i>
      {viewMode === 'floor' ? ' ' : ''}
    </Button>
    
                <Button
                  size="sm"
                  variant="outline-success"
                  className="fw-semibold px-3 same-btn"
                  onClick={handleCheckInClick}>
                  <i className="fi fi-rr-check me-1"></i>Check In F9
                </Button>

                {selectedRoomIds.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline-warning"
                    className="fw-semibold px-3 same-btn"
                    onClick={() => setShowMultiRoomStatusModal(true)}
                    title="Apply Dirty / Block / Maintenance to all selected rooms">
                    <i className="fi fi-rr-lock me-1"></i>Block ({selectedRoomIds.length})
                  </Button>
                )}

                <Button size="sm" variant="outline-danger" className="fw-semibold px-4">
                  Free Rooms
                </Button>
              </div>
            </div>

            {/* ====== HOUSEKEEPING SUB-PANEL (shown when Dirty / Block / Maint is active) - UPDATED with section buttons ====== */}
            {activeHousekeepingTab && (
              <div className="border-top pt-0 pb-0 px-0">
                {/* Row-by-row sections for All/Dirty/Block/Maint */}
                {activeHousekeepingTab === 'all' && (
                  <>
                    {/* Dirty Rooms Section */}
                    <div className="housekeeping-section">
                      <div className="housekeeping-section-header">
                        <div className="housekeeping-section-header-left">
                          <i className="fi fi-rr-broom" style={{ color: '#D4A017' }}></i>
                          Dirty Rooms
                        </div>
                        <div className="d-flex align-items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            className="fw-semibold px-2 py-1"
                            style={{ fontSize: '0.7rem' }}
                            onClick={() =>
                              handleSelectAllHousekeepingForSection(
                                housekeepingRoomsForTab
                                  .filter((r) => r.status === 'cleaning')
                                  .map((r) => r.id),
                              )
                            }>
                            Select All
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            className="fw-semibold px-2 py-1"
                            style={{ fontSize: '0.7rem' }}
                            onClick={() =>
                              handleRemoveSelectionForSection(
                                housekeepingRoomsForTab
                                  .filter((r) => r.status === 'cleaning')
                                  .map((r) => r.id),
                              )
                            }>
                            Vacant
                          </Button>
                        </div>
                      </div>
                      <div className="dirty-rooms-body" ref={dirtyScrollRef}>
                        {(() => {
                          const dirtyRooms = housekeepingRoomsForTab.filter(
                            (r) => r.status === 'cleaning',
                          )
                          if (dirtyRooms.length === 0) {
                            return (
                              <div className="text-muted py-1 px-1" style={{ fontSize: '0.75rem' }}>
                                No dirty rooms
                              </div>
                            )
                          }
                          // Split into columns of 2 rows each
                          const columns: (typeof dirtyRooms)[] = []
                          for (let i = 0; i < dirtyRooms.length; i += 2) {
                            columns.push(dirtyRooms.slice(i, i + 2))
                          }
                          return columns.map((col, colIdx) => (
                            <div key={`col-${colIdx}`} className="dirty-rooms-grid-col">
                              {col.map((room) => {
                                const isSelected = selectedHousekeepingRoomIds.includes(room.id)
                                return (
                                  <div
                                    key={`dirty-${room.id}`}
                                    className={`dirty-room-card${isSelected ? ' selected' : ''}`}
                                    onClick={() => toggleHousekeepingRoomSelection(room.id)}>
                                    <input
                                      type="checkbox"
                                      className="hk-checkbox"
                                      checked={isSelected}
                                      onChange={() => toggleHousekeepingRoomSelection(room.id)}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    <span className="room-number">{room.number}</span>
                                    <span className="room-category">{room.category}</span>
                                  </div>
                                )
                              })}
                            </div>
                          ))
                        })()}
                      </div>
                    </div>

                    {/* Blocked Rooms Section */}
                    <div className="housekeeping-section">
                      <div className="housekeeping-section-header">
                        <div className="housekeeping-section-header-left">
                          <i className="fi fi-rr-lock" style={{ color: '#0284C7' }}></i>
                          Blocked Rooms
                        </div>
                        <div className="d-flex align-items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            className="fw-semibold px-2 py-1"
                            style={{ fontSize: '0.7rem' }}
                            onClick={() =>
                              handleSelectAllHousekeepingForSection(
                                housekeepingRoomsForTab
                                  .filter((r) => r.status === 'reserved')
                                  .map((r) => r.id),
                              )
                            }>
                            Select All
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            className="fw-semibold px-2 py-1"
                            style={{ fontSize: '0.7rem' }}
                            onClick={() =>
                              handleRemoveSelectionForSection(
                                housekeepingRoomsForTab
                                  .filter((r) => r.status === 'reserved')
                                  .map((r) => r.id),
                              )
                            }>
                            Vacant
                          </Button>
                        </div>
                      </div>
                      <div
                        className="housekeeping-section-body"
                        ref={blockScrollRef}
                        style={{ minHeight: 110, height: 110, maxHeight: 110 }}>
                        {housekeepingRoomsForTab
                          .filter((r) => r.status === 'reserved')
                          .map((room) => {
                            const isSelected = selectedHousekeepingRoomIds.includes(room.id)
                            const headerBg = getStatusBgColor(room.status)
                            const bodyTextColor = getStatusTextColor(room.status)
                            const selectedBorderColor = getStatusBorderColor(room.status)
                            return (
                              <div
                                key={`block-${room.id}`}
                                onClick={() => toggleHousekeepingRoomSelection(room.id)}
                                style={{
                                  width: 140,
                                  height: 'auto',
                                  minHeight: 70,
                                  border: `2px solid ${isSelected ? selectedBorderColor : headerBg}`,
                                  borderRadius: 0,
                                  backgroundColor: isSelected ? `${headerBg}30` : '#ffffff',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  overflow: 'hidden',
                                  boxShadow: isSelected
                                    ? `0 0 0 3px ${headerBg}55, 0 2px 8px rgba(0,0,0,0.15)`
                                    : '0 1px 4px rgba(0,0,0,0.12)',
                                  transition: 'all 0.15s ease',
                                }}>
                                <div
                                  style={{
                                    backgroundColor: headerBg,
                                    padding: '4px 8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 6,
                                    minHeight: 28,
                                    color: bodyTextColor,
                                  }}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleHousekeepingRoomSelection(room.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      cursor: 'pointer',
                                      accentColor: '#fff',
                                      flexShrink: 0,
                                      width: 13,
                                      height: 13,
                                    }}
                                  />
                                  <span
                                    style={{
                                      fontWeight: 700,
                                      fontSize: '0.85rem',
                                      flex: 1,
                                      textAlign: 'left',
                                    }}>
                                    Room {room.number}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    padding: '5px 8px 6px',
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2,
                                  }}>
                                  {(() => {
                                    const log = latestLogByRoomId.get(room.id)
                                    return (
                                      <>
                                        {log?.blocked_by ? (
                                          <div
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 3,
                                            }}>
                                            <span
                                              style={{
                                                fontSize: '0.68rem',
                                                fontWeight: 600,
                                                color: bodyTextColor,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                              }}
                                              title={log.blocked_by}>
                                              {log.blocked_by}
                                            </span>
                                          </div>
                                        ) : (
                                          <div
                                            style={{
                                              fontSize: '0.63rem',
                                              color: '#aaa',
                                              fontStyle: 'italic',
                                            }}></div>
                                        )}
                                        {log?.in_house_guest_name && (
                                          <div
                                            style={{
                                              fontSize: '0.63rem',
                                              color: '#444',
                                              whiteSpace: 'nowrap',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                            }}
                                            title={log.in_house_guest_name}>
                                            {log.in_house_guest_name}
                                          </div>
                                        )}
                                        {log?.reason ? (
                                          <div
                                            style={{
                                              fontSize: '0.62rem',
                                              color: '#555',
                                              overflow: 'hidden',
                                              display: '-webkit-box',
                                              WebkitLineClamp: 2,
                                              WebkitBoxOrient: 'vertical',
                                              lineHeight: 1.3,
                                            }}
                                            title={log.reason}>
                                            {log.reason}
                                          </div>
                                        ) : (
                                          <div
                                            style={{
                                              fontSize: '0.6rem',
                                              color: '#bbb',
                                              fontStyle: 'italic',
                                            }}>
                                            No notes
                                          </div>
                                        )}
                                        {log?.created_date && (
                                          <div
                                            style={{
                                              fontSize: '0.58rem',
                                              color: '#999',
                                              marginTop: 'auto',
                                              paddingTop: 3,
                                              borderTop: '1px dashed #e0e0e0',
                                            }}>
                                            {new Date(log.created_date).toLocaleDateString(
                                              'en-GB',
                                              {
                                                day: '2-digit',
                                                month: 'short',
                                              },
                                            )}{' '}
                                            {new Date(log.created_date).toLocaleTimeString(
                                              'en-GB',
                                              {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                              },
                                            )}
                                          </div>
                                        )}
                                      </>
                                    )
                                  })()}
                                </div>
                              </div>
                            )
                          })}
                        {housekeepingRoomsForTab.filter((r) => r.status === 'reserved').length ===
                          0 && (
                          <div className="text-muted py-1 px-1" style={{ fontSize: '0.75rem' }}>
                            No blocked rooms
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Maintenance Rooms Section */}
                    <div className="housekeeping-section">
                      <div className="housekeeping-section-header">
                        <div className="housekeeping-section-header-left">
                          <i className="fi fi-rr-tools" style={{ color: '#DC2626' }}></i>
                          Maintenance Rooms
                        </div>
                        <div className="d-flex align-items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline-primary"
                            className="fw-semibold px-2 py-1"
                            style={{ fontSize: '0.7rem' }}
                            onClick={() =>
                              handleSelectAllHousekeepingForSection(
                                housekeepingRoomsForTab
                                  .filter((r) => r.status === 'maintenance')
                                  .map((r) => r.id),
                              )
                            }>
                            Select All
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-danger"
                            className="fw-semibold px-2 py-1"
                            style={{ fontSize: '0.7rem' }}
                            onClick={() =>
                              handleRemoveSelectionForSection(
                                housekeepingRoomsForTab
                                  .filter((r) => r.status === 'maintenance')
                                  .map((r) => r.id),
                              )
                            }>
                            Vacant
                          </Button>
                        </div>
                      </div>
                      <div
                        className="housekeeping-section-body"
                        ref={maintScrollRef}
                        style={{ minHeight: 110, height: 110, maxHeight: 110 }}>
                        {housekeepingRoomsForTab
                          .filter((r) => r.status === 'maintenance')
                          .map((room) => {
                            const isSelected = selectedHousekeepingRoomIds.includes(room.id)
                            const headerBg = getStatusBgColor(room.status)
                            const bodyTextColor = getStatusTextColor(room.status)
                            const selectedBorderColor = getStatusBorderColor(room.status)
                            return (
                              <div
                                key={`maint-${room.id}`}
                                onClick={() => toggleHousekeepingRoomSelection(room.id)}
                                style={{
                                  width: 140,
                                  height: 'auto',
                                  minHeight: 90,
                                  border: `2px solid ${isSelected ? selectedBorderColor : headerBg}`,
                                  borderRadius: 0,
                                  backgroundColor: isSelected ? `${headerBg}30` : '#ffffff',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  overflow: 'hidden',
                                  boxShadow: isSelected
                                    ? `0 0 0 3px ${headerBg}55, 0 2px 8px rgba(0,0,0,0.15)`
                                    : '0 1px 4px rgba(0,0,0,0.12)',
                                  transition: 'all 0.15s ease',
                                }}>
                                <div
                                  style={{
                                    backgroundColor: headerBg,
                                    padding: '4px 8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 6,
                                    minHeight: 28,
                                    color: bodyTextColor,
                                  }}>
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => toggleHousekeepingRoomSelection(room.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                      cursor: 'pointer',
                                      accentColor: '#fff',
                                      flexShrink: 0,
                                      width: 13,
                                      height: 13,
                                    }}
                                  />
                                  <span
                                    style={{
                                      fontWeight: 700,
                                      fontSize: '0.85rem',
                                      flex: 1,
                                      textAlign: 'left',
                                    }}>
                                    Room {room.number}
                                  </span>
                                </div>
                                <div
                                  style={{
                                    padding: '5px 8px 6px',
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2,
                                  }}>
                                  {(() => {
                                    const log = latestLogByRoomId.get(room.id)
                                    return (
                                      <>
                                        {log?.blocked_by ? (
                                          <div
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: 3,
                                            }}>
                                            <span
                                              style={{
                                                fontSize: '0.68rem',
                                                fontWeight: 600,
                                                color: bodyTextColor,
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                              }}
                                              title={log.blocked_by}>
                                              {log.blocked_by}
                                            </span>
                                          </div>
                                        ) : (
                                          <div
                                            style={{
                                              fontSize: '0.63rem',
                                              color: '#aaa',
                                              fontStyle: 'italic',
                                            }}></div>
                                        )}
                                        {log?.in_house_guest_name && (
                                          <div
                                            style={{
                                              fontSize: '0.63rem',
                                              color: '#444',
                                              whiteSpace: 'nowrap',
                                              overflow: 'hidden',
                                              textOverflow: 'ellipsis',
                                            }}
                                            title={log.in_house_guest_name}>
                                            {log.in_house_guest_name}
                                          </div>
                                        )}
                                        {log?.reason ? (
                                          <div
                                            style={{
                                              fontSize: '0.62rem',
                                              color: '#555',
                                              overflow: 'hidden',
                                              display: '-webkit-box',
                                              WebkitLineClamp: 2,
                                              WebkitBoxOrient: 'vertical',
                                              lineHeight: 1.3,
                                            }}
                                            title={log.reason}>
                                            {log.reason}
                                          </div>
                                        ) : (
                                          <div
                                            style={{
                                              fontSize: '0.6rem',
                                              color: '#bbb',
                                              fontStyle: 'italic',
                                            }}>
                                            No notes
                                          </div>
                                        )}
                                        {log?.created_date && (
                                          <div
                                            style={{
                                              fontSize: '0.58rem',
                                              color: '#999',
                                              marginTop: 'auto',
                                              paddingTop: 3,
                                              borderTop: '1px dashed #e0e0e0',
                                            }}>
                                            {new Date(log.created_date).toLocaleDateString(
                                              'en-GB',
                                              {
                                                day: '2-digit',
                                                month: 'short',
                                              },
                                            )}{' '}
                                            {new Date(log.created_date).toLocaleTimeString(
                                              'en-GB',
                                              {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                              },
                                            )}
                                          </div>
                                        )}
                                      </>
                                    )
                                  })()}
                                </div>
                              </div>
                            )
                          })}
                        {housekeepingRoomsForTab.filter((r) => r.status === 'maintenance')
                          .length === 0 && (
                          <div className="text-muted py-1 px-1" style={{ fontSize: '0.75rem' }}>
                            No maintenance rooms
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Scrollable Content Area */}
          <div
            className={`${activeHousekeepingTab ? '' : 'flex-grow-1 overflow-auto'} bg-white`}
            style={{ width: '100%' }}>
            {activeHousekeepingTab ? // Housekeeping panel is in the header — content area is intentionally empty
            null : showAtGlanceTable ? (
              <div className="at-glance-container d-flex flex-column h-100">
                <div className="mb-3">
                  <div className="d-flex justify-content-end align-items-center flex-wrap">
                    <div className="d-flex align-items-center gap-2">
                      <span className="text-muted">Filter: {getFilterDisplayText()}</span>
                      <span className="text-muted">|</span>
                      <span className="text-muted">{formatDateTime(new Date().toISOString())}</span>
                      <Dropdown>
                        <Dropdown.Toggle variant="secondary" size="sm" className="fw-normal px-1">
                          {atGlanceFilter === 'all'
                            ? 'All'
                            : atGlanceFilter === 'available'
                              ? 'Vacant'
                              : atGlanceFilter === 'occupied'
                                ? 'Occupied'
                                : atGlanceFilter === 'cleaning'
                                  ? 'Dirty'
                                  : atGlanceFilter === 'reserved'
                                    ? 'Block'
                                    : 'Maint'}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => setAtGlanceFilter('all')}>
                            All
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => setAtGlanceFilter('available')}>
                            Vacant
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => setAtGlanceFilter('occupied')}>
                            Occupied
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => setAtGlanceFilter('cleaning')}>
                            Dirty
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => setAtGlanceFilter('reserved')}>
                            Block
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => setAtGlanceFilter('maintenance')}>
                            Maint
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                      <button
                        className="btn btn-success btn-sm fw-normal px-3"
                        onClick={handlePrint}>
                        <i className="fi fi-rr-print me-1"></i> Print
                      </button>
                      <Dropdown>
                        <Dropdown.Toggle variant="primary" size="sm" className="fw-normal px-2">
                          <i className="fi fi-rr-download me-1"></i> Export
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={handlePDF}>
                            <i className="fi fi-rr-file-pdf me-2"></i> PDF
                          </Dropdown.Item>
                          <Dropdown.Item onClick={handleExcel}>
                            <i className="fi fi-rr-file-excel me-2"></i> Excel
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </div>
                </div>
                <div className="flex-grow-1 overflow-auto">
                  {loadingAtGlance ? (
                    <div className="d-flex justify-content-center py-5">
                      <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : errorAtGlance ? (
                    <div className="text-center py-5">
                      <i className="fi fi-rr-exclamation text-danger fs-4 mb-3 d-block"></i>
                      <p className="text-danger">{errorAtGlance}</p>
                      <Button variant="outline-primary" onClick={fetchAtGlanceData}>
                        Retry
                      </Button>
                    </div>
                  ) : filteredAtGlanceData.length === 0 ? (
                    <div className="text-center py-5">
                      <i className="fi fi-rr-bed-empty text-muted fs-4 mb-3 d-block"></i>
                      <p className="text-muted mb-0">No rooms found for this filter.</p>
                    </div>
                  ) : (
                    <table className="at-glance-table sticky-table">
                      <thead>
                        <tr>
                          <th>Floor No</th>
                          <th>Room No</th>
                          <th>Room Category</th>
                          <th>Converted Category</th>
                          <th>Guest</th>
                          <th>Total Days</th>
                          <th>Total Amt</th>
                          <th>Discount %</th>
                          <th>Pay Type</th>
                          <th>Plan Name</th>
                          <th>Check-in Date & Time</th>
                          <th>Check-out Date & Time</th>
                          <th>Adults</th>
                          <th>Pax</th>
                          <th>Ex-Pax</th>
                          <th>Child</th>
                          <th>Driver</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAtGlanceData.map((item) => (
                          <tr
                            key={item.roomId}
                            style={{
                              backgroundColor: getStatusBgColor(item.status),
                              color: getStatusTextColor(item.status),
                            }}>
                            <td>{item.floorNo}</td>
                            <td>{item.roomNo}</td>
                            <td>{item.roomCategory}</td>
                            <td>{item.convertedCategory || '-'}</td>
                            <td>{item.guest}</td>
                            <td>
                              {item.status === 'occupied' && item.totalDays != null
                                ? item.totalDays
                                : '-'}
                            </td>
                            <td>{formatAmount(item.totalAmt)}</td>
                            <td>{item.discountPercent}%</td>
                            <td>{item.payType}</td>
                            <td>{item.planName || '-'}</td>
                            <td>
                              {item.checkinDatetime ? formatDateTime(item.checkinDatetime) : '-'}
                            </td>
                            <td>
                              {item.checkoutDatetime ? formatDateTime(item.checkoutDatetime) : '-'}
                            </td>
                            <td>{item.adults}</td>
                            <td>{item.pax}</td>
                            <td>{item.exPax}</td>
                            <td>{item.child}</td>
                            <td>{item.driver}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="flex-shrink-0 mt-2 pt-2 border-top">
                  <div className="d-flex justify-content-left gap-2 flex-wrap">
                    <span
                      className="status-footer-badge"
                      style={{
                        backgroundColor: getStatusBgColor('available'),
                        color: getStatusTextColor('available'),
                        border: `1px solid ${getStatusBorderColor('available')}`,
                      }}>
                      Vacant: {statusCounts.available}
                    </span>
                    <span
                      className="status-footer-badge"
                      style={{
                        backgroundColor: getStatusBgColor('occupied'),
                        color: getStatusTextColor('occupied'),
                        border: `1px solid ${getStatusBorderColor('occupied')}`,
                      }}>
                      Occupied: {statusCounts.occupied}
                    </span>
                    <span
                      className="status-footer-badge"
                      style={{
                        backgroundColor: getStatusBgColor('cleaning'),
                        color: getStatusTextColor('cleaning'),
                        border: `1px solid ${getStatusBorderColor('cleaning')}`,
                      }}>
                      Dirty: {statusCounts.cleaning}
                    </span>
                    <span
                      className="status-footer-badge"
                      style={{
                        backgroundColor: getStatusBgColor('maintenance'),
                        color: getStatusTextColor('maintenance'),
                        border: `1px solid ${getStatusBorderColor('maintenance')}`,
                      }}>
                      Main: {statusCounts.maintenance}
                    </span>
                    <span
                      className="status-footer-badge"
                      style={{
                        backgroundColor: getStatusBgColor('reserved'),
                        color: getStatusTextColor('reserved'),
                        border: `1px solid ${getStatusBorderColor('reserved')}`,
                      }}>
                      Block: {statusCounts.reserved}
                    </span>
                    <span
                      className="status-footer-badge"
                      style={{ backgroundColor: '#f5c6cb', color: '#000' }}>
                      Total: {filteredAtGlanceData.length}
                    </span>
                  </div>
                </div>
              </div>
            ) : showSettlementSection ? (
             /* ==================== SETTLEMENT SECTION — CHECKED OUT CARDS ONLY ==================== */
<div
  key="settlement-section"
  className="d-flex flex-column h-100"
  style={{ padding: '0px 8px', width: '100%' }}>

  {/* ---- CHECKED OUT CARDS ---- */}
  <>
    {loadingCheckoutData ? (
      <div className="d-flex justify-content-center py-5">
        <div className="spinner-border text-success" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    ) : checkoutData.length === 0 ? (
      <div className="text-center py-5">
        <i className="fi fi-rr-sign-out-alt text-muted fs-4 mb-3 d-block"></i>
        <p className="text-muted mb-0">No checkout records found.</p>
      </div>
    ) : (
      <div
        className="flex-grow-1"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '6px',
          alignContent: 'start',
          overflowY: 'auto',
        }}>

        {checkoutData.map((co) => {
          const totalAmt = Number(co.total_amount) || 0
          const checkoutDateDisplay = co.checkout_datetime
            ? formatDateTime(co.checkout_datetime)
            : co.checkout_date
              ? formatDateTime(co.checkout_date)
              : '-'
          const headerBg = '#198754'
          const isPartial = co.is_partial_checkout === 1

          const paymentData = checkoutPaymentMap.get(co.checkout_id) || 'Cash|-'
          const payType = paymentData.split('|')[0] || 'Cash'
          const invoiceNo = paymentData.split('|')[1] || '-'

          return (
            <div
              key={co.checkout_id}
              style={{
                borderRadius: 0,
                overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(0,0,0,0.10)',
                border: `1.5px solid ${headerBg}30`,
                background: '#fff',
                cursor: 'default',
                transition: 'box-shadow 0.18s, transform 0.12s',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 6px 22px rgba(0,0,0,0.16)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.boxShadow = '0 2px 10px rgba(0,0,0,0.10)'
                ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
              }}>

              {/* ── Card Header ── */}
              <div
                style={{
                  background: headerBg,
                  padding: '4px 8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <span
                  style={{
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    letterSpacing: 0.5,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                  Invoice: {invoiceNo}
                  {isPartial && (
                    <span style={{ fontSize: '0.6rem', marginLeft: 4, opacity: 0.85 }}>
                      (Partial)
                    </span>
                  )}
                </span>
              </div>

              {/* ── Card Body ── */}
              <div
                style={{
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 5,
                  flexGrow: 1,
                }}>

                {/* Guest Name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span
                    style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: `${headerBg}18`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                    <i className="fi fi-rr-user" style={{ fontSize: '0.6rem', color: headerBg }} />
                  </span>
                  <div
                    style={{
                      fontWeight: 600, fontSize: '0.68rem', color: '#222',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      minWidth: 0,
                    }}>
                    {co.guest_name || '-'}
                  </div>
                </div>

                <div style={{ height: 1, background: '#f0f0f0' }} />

                {/* Checkout Date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span
                    style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: '#f3f4f6',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                    <i className="fi fi-rr-sign-out-alt" style={{ fontSize: '0.6rem', color: '#555' }} />
                  </span>
                  <div style={{ fontWeight: 500, fontSize: '0.65rem', color: '#333', minWidth: 0 }}>
                    {checkoutDateDisplay}
                  </div>
                </div>

                {/* Pay Type + Total Amount */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 8, borderTop: '1px solid #f0f0f0', paddingTop: 4,
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                    <span
                      style={{
                        width: 18, height: 18, borderRadius: '50%',
                        background: '#f3f4f6',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                      <i className="fi fi-rr-credit-card" style={{ fontSize: '0.6rem', color: '#555' }} />
                    </span>
                    <div
                      style={{
                        fontWeight: 500, fontSize: '0.68rem', color: '#333',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                      {payType}
                    </div>
                  </div>
                  <span
                    style={{
                      fontWeight: 700, fontSize: '0.72rem',
                      color: '#198754', letterSpacing: 0.2, flexShrink: 0,
                    }}>
                    {formatAmount(totalAmt)}
                  </span>
                </div>
              </div>

              {/* ── Card Footer — Print & Settle ── */}
              <div
                style={{
                  display: 'flex',
                  borderTop: `1px solid ${headerBg}25`,
                }}>
                {/* Print Button */}
                <button
                  onClick={() => handlePrint()}
                  style={{
                    flex: 1,
                    padding: '5px 0',
                    border: 'none',
                    borderRight: `1px solid ${headerBg}25`,
                    background: '#f8f9fa',
                    color: '#555',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 3,
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#e9ecef')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#f8f9fa')}>
                  <i className="fi fi-rr-print" style={{ fontSize: '0.6rem' }} />
                 
                </button>

                {/* Settle Button */}
                <button
  onClick={() => {
    setSelectedCheckout(co)
    setShowSettlementModal(true)
  }}
  style={{
    flex: 1,
    padding: '5px 0',
    border: 'none',
    background: headerBg,
    color: '#fff',
    fontSize: '0.65rem',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  }}>
  <i className="fi fi-rr-wallet" style={{ fontSize: '0.7rem' }} />
  
</button>
              </div>

            </div>
          )
        })}
      </div>
    )}
  </>

  {/* ── Settlement Modal ── */}
{selectedCheckout && (
  <SettlementModal
  show={showSettlementModal}
  onHide={() => {
    setShowSettlementModal(false)
    setSelectedCheckout(null)
  }}
  onSettle={async (settlements, tip) => {
    console.log('Settling:', selectedCheckout.checkout_id, settlements, tip)
    setShowSettlementModal(false)
    setSelectedCheckout(null)
  }}
  grandTotal={Number(selectedCheckout.total_amount) || 0}
  subtotal={Number(selectedCheckout.total_amount) || 0}
  loading={false}
  outletPaymentModes={outletPaymentModes}
  selectedOutletId={user?.outletid}  
  table_name={selectedCheckout.room_no || selectedCheckout.table_name || ''}
  initialCustomerName={selectedCheckout.guest_name || ''}
  initialMobile={selectedCheckout.mobile || ''}
  initialCustomerId={selectedCheckout.customer_id || null}
/>
)}

</div>
            ) : showReservSection ? (
              /* ==================== RESERV SECTION ==================== */
              <div
                key="reserv-section"
                className="checkout-table-container d-flex flex-column h-100"
                style={{ width: '100%' }}>
                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                  <h6 className="mb-0 fw-bold">
                    <i className="fi fi-rr-calendar me-2 text-primary"></i>
                    Today's Reservations —{' '}
                    {new Date(reservDate + 'T00:00:00').toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </h6>
                  <div className="d-flex align-items-center gap-2">
                    <Form.Control
                      type="date"
                      size="sm"
                      value={reservDate}
                      onChange={(e) => {
                        const d = e.target.value
                        setReservDate(d)
                        fetchReservTableData(d)
                      }}
                      style={{ width: 'auto' }}
                    />
                    <button className="btn btn-success btn-sm fw-normal px-3" onClick={handlePrint}>
                      <i className="fi fi-rr-print me-1"></i> Print
                    </button>
                    <Dropdown>
                      <Dropdown.Toggle variant="primary" size="sm" className="fw-normal px-2">
                        <i className="fi fi-rr-download me-1"></i> Export
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={handlePdfReserv}>
                          <i className="fi fi-rr-file-pdf me-2"></i> PDF
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() =>
                            exportReservTableToExcel(reservTableData, 'reservations.xlsx')
                          }>
                          <i className="fi fi-rr-file-excel me-2"></i> Excel
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>
                {loadingReservTable ? (
                  <div className="d-flex justify-content-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading…</span>
                    </div>
                  </div>
                ) : reservTableData.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fi fi-rr-calendar text-muted fs-4 mb-3 d-block"></i>
                    <p className="text-muted mb-0">No reservations for today.</p>
                  </div>
                ) : (
                  <div className="flex-grow-1 overflow-auto">
                    <table className="reserv-section-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Res. No</th>
                          <th>Guest Name</th>
                          <th>Mobile No</th>
                          <th>Room Category</th>
                          <th>Convert Category</th>
                          <th>Total Days</th>
                          <th>Arrival Date & Time</th>
                          <th>Departure Date & Time</th>
                          <th>Rooms</th>
                          <th>Room Tariff</th>
                          <th>Pax</th>
                          <th>Ex-Pax</th>
                          <th>Child</th>
                          <th>Driver</th>
                          <th>Total Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reservTableData.map((r, idx) => (
                          <tr key={`${r.reservation_id}-${idx}`}>
                            <td>{idx + 1}</td>
                            <td>{r.reservation_no}</td>
                            <td>{r.guest_name}</td>
                            <td>{r.phone1}</td>
                            <td>{r.room_category_name}</td>
                            <td>{r.converted_category_name}</td>
                            <td className="text-center">{r.nights || '-'}</td>
                            <td>
                              {r.arrival_date} {r.arrival_time}
                            </td>
                            <td>
                              {r.departure_date} {r.departure_time}
                            </td>
                            <td className="text-center">{r.total_rooms}</td>
                            <td className="text-end">{formatAmount(r.pax_price)}</td>
                            <td className="text-center">{r.pax_count}</td>
                            <td className="text-center">{r.ex_pax_count}</td>
                            <td className="text-center">{r.child_count}</td>
                            <td className="text-center">{r.driver_count}</td>
                            <td className="text-end fw-semibold">{formatAmount(r.total_amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : showArrivalSection ? (
              /* ==================== ARRIVAL SECTION ==================== */
              <div
                key="arrival-section"
                className="checkout-table-container d-flex flex-column h-100"
                style={{ width: '100%' }}>
                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                  <h6 className="mb-0 fw-bold">
                    <i className="fi fi-rr-plane-arrival me-2 text-info"></i>
                    Today's Arrivals —{' '}
                    {new Date(arrivalDate + 'T00:00:00').toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </h6>
                  <div className="d-flex align-items-center gap-2">
                    <Form.Control
                      type="date"
                      size="sm"
                      value={arrivalDate}
                      onChange={(e) => {
                        const d = e.target.value
                        setArrivalDate(d)
                        fetchArrivalTableData(d)
                      }}
                      style={{ width: 'auto' }}
                    />
                    <button className="btn btn-success btn-sm fw-normal px-3" onClick={handlePrint}>
                      <i className="fi fi-rr-print me-1"></i> Print
                    </button>
                    <Dropdown>
                      <Dropdown.Toggle variant="primary" size="sm" className="fw-normal px-2">
                        <i className="fi fi-rr-download me-1"></i> Export
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={handlePdfArrival}>
                          <i className="fi fi-rr-file-pdf me-2"></i> PDF
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() =>
                            exportReservTableToExcel(arrivalTableData, 'arrivals.xlsx')
                          }>
                          <i className="fi fi-rr-file-excel me-2"></i> Excel
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>
                {loadingArrivalTable ? (
                  <div className="d-flex justify-content-center py-5">
                    <div className="spinner-border text-info" role="status">
                      <span className="visually-hidden">Loading…</span>
                    </div>
                  </div>
                ) : arrivalTableData.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fi fi-rr-plane-arrival text-muted fs-4 mb-3 d-block"></i>
                    <p className="text-muted mb-0">No arrivals for today.</p>
                  </div>
                ) : (
                  <div className="flex-grow-1 overflow-auto">
                    <table className="reserv-section-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Res. No</th>
                          <th>Guest Name</th>
                          <th>Mobile No</th>
                          <th>Room Category</th>
                          <th>Convert Category</th>
                          <th>Total Days</th>
                          <th>Arrival Date & Time</th>
                          <th>Departure Date & Time</th>
                          <th>Rooms</th>
                          <th>Room Tariff</th>
                          <th>Pax</th>
                          <th>Ex-Pax</th>
                          <th>Child</th>
                          <th>Driver</th>
                          <th>Total Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {arrivalTableData.map((r, idx) => (
                          <tr key={`${r.reservation_id}-${idx}`}>
                            <td>{idx + 1}</td>
                            <td>{r.reservation_no}</td>
                            <td>{r.guest_name}</td>
                            <td>{r.phone1}</td>
                            <td>{r.room_category_name}</td>
                            <td>{r.converted_category_name}</td>
                            <td className="text-center">{r.nights || '-'}</td>
                            <td>
                              {r.arrival_date} {r.arrival_time}
                            </td>
                            <td>
                              {r.departure_date} {r.departure_time}
                            </td>
                            <td className="text-center">{r.total_rooms}</td>
                            <td className="text-end">{formatAmount(r.pax_price)}</td>
                            <td className="text-center">{r.pax_count}</td>
                            <td className="text-center">{r.ex_pax_count}</td>
                            <td className="text-center">{r.child_count}</td>
                            <td className="text-center">{r.driver_count}</td>
                            <td className="text-end fw-semibold">{formatAmount(r.total_amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : showCheckoutAlertTable ? (
              <div
                key="checkout-section"
                className="checkout-table-container d-flex flex-column h-100"
                style={{ width: '100%' }}>
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <h6 className="mb-0 fw-bold">
                    <i className="fi fi-rr-calendar-check me-2 text-warning"></i>
                    Today's Checkouts —{' '}
                    {new Date().toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </h6>
                  <div className="d-flex align-items-center gap-2">
                    <button
                      className="btn btn-success btn-sm fw-normal px-3"
                      onClick={handlePrintCheckout}>
                      <i className="fi fi-rr-print me-1"></i> Print
                    </button>
                    <Dropdown>
                      <Dropdown.Toggle variant="primary" size="sm" className="fw-normal px-2">
                        <i className="fi fi-rr-download me-1"></i> Export
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={handlePdfCheckout}>
                          <i className="fi fi-rr-file-pdf me-2"></i> PDF
                        </Dropdown.Item>
                        <Dropdown.Item
                          onClick={() =>
                            exportCheckoutToExcel(checkoutAlertData, 'todays_checkouts.xlsx')
                          }>
                          <i className="fi fi-rr-file-excel me-2"></i> Excel
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>
                {loadingCheckoutAlert ? (
                  <div className="d-flex justify-content-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading checkout data...</span>
                    </div>
                  </div>
                ) : errorCheckoutAlert ? (
                  <div className="text-center py-5">
                    <i className="fi fi-rr-exclamation text-danger fs-4 mb-3 d-block"></i>
                    <p className="text-danger">{errorCheckoutAlert}</p>
                    <Button variant="outline-primary" onClick={fetchTodayCheckouts}>
                      Retry
                    </Button>
                  </div>
                ) : checkoutAlertData.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="fi fi-rr-calendar text-muted fs-4 mb-3 d-block"></i>
                    <p className="text-muted mb-0">No checkouts scheduled for today.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="checkout-table">
                      <thead>
                        <tr>
                          <th>Sr. No.</th>
                          <th>Room No</th>
                          <th>Guest Name</th>
                          <th>Category</th>
                          <th>Adults</th>
                          <th>Pax</th>
                          <th>Ex-Pax</th>
                          <th>Child</th>
                          <th>Driver</th>
                          <th>Total Days</th>
                          <th>Total Amount</th>
                          <th>Reg No</th>
                          <th>Booking Ref</th>
                          <th>Plan Name</th>
                          <th>Check-out Date & Time</th>
                          <th>Check-in Date & Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {checkoutAlertData.map((item) => {
                          const minutesLeft =
                            item.minutesLeft || getMinutesLeft(item.checkoutDatetime)
                          const isNear = minutesLeft <= 30 && minutesLeft > 0
                          const isExpired = minutesLeft <= 0
                          const cellClass = isExpired ? '' : isNear ? 'text-red' : ''
                          return (
                            <tr key={item.srNo}>
                              <td className={cellClass}>{item.srNo}</td>
                              <td className={cellClass}>{item.roomNo}</td>
                              <td className={cellClass}>{item.guestName}</td>
                              <td className={cellClass}>{item.category}</td>
                              <td className={cellClass}>{item.adults}</td>
                              <td className={cellClass}>{item.pax}</td>
                              <td className={cellClass}>{item.exPax}</td>
                              <td className={cellClass}>{item.child}</td>
                              <td className={cellClass}>{item.driver}</td>
                              <td className={cellClass}>
                                {item.totalNights != null ? item.totalNights : '-'}
                              </td>
                              <td className={cellClass}>
                                {item.totalAmount
                                  ? formatAmount(item.totalAmount)
                                  : formatAmount(item.totalPrice)}
                              </td>
                              <td className={cellClass}>{item.regNo || '-'}</td>
                              <td className={cellClass}>{item.booking || '-'}</td>
                              <td className={cellClass}>{item.planName || '-'}</td>
                              <td className={cellClass}>
                                {formatDateTime(item.checkoutDatetime)}
                                {isExpired && ' ⚠️ Expired'}
                                {isNear && !isExpired && ` (${minutesLeft} min left)`}
                              </td>
                              <td className={cellClass}>{formatDateTime(item.checkinDatetime)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : statusFilter === 'occupied' ? (
              loadingOccupied && occupiedRooms.length === 0 ? (
                <div className="d-flex justify-content-center align-items-center h-100">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading occupied rooms...</span>
                  </div>
                </div>
              ) : errorOccupied ? (
                <div className="text-center py-5">
                  <i className="fi fi-rr-exclamation text-danger fs-4 mb-3 d-block"></i>
                  <p className="text-danger">{errorOccupied}</p>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => setStatusFilter('occupied')}>
                    Retry
                  </Button>
                </div>
              ) : occupiedRooms.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fi fi-rr-bed-empty text-muted fs-4 mb-4 d-block"></i>
                  <p className="text-muted mb-0">No occupied rooms found.</p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: '6px',
                    alignContent: 'start',
                    padding: '0px 8px',
                    width: '100%',
                  }}>
                  {occupiedRooms.map((item, idx) => {
                    const minutesLeft = getMinutesLeft(item.checkout_datetime)
                    const isNear = minutesLeft <= 30 && minutesLeft > 0
                    const isExpired = minutesLeft <= 0
                    const tileStyle = getOccupiedTileStyle(minutesLeft, isExpired)
                    const perDayPrice = item.per_day_base_price || 0
                    const roomChargesTotal = item.guest_room_charges_total || 0
                    const isMultiRoom = item.is_multi_room_checkin === true

                    const netRoomAmount = item.net_room_amount ?? roomChargesTotal
                    const netAllRoomsAmount = item.total_all_rooms_net ?? roomChargesTotal
                    const pendingAdvanceForRoom = item.pending_advance_for_room || 0

                    const activeDayKey =
                      item.current_active_day_key || new Date().toISOString().split('T')[0]
                    const systemTodayKey = new Date().toISOString().split('T')[0]
                    const postByDate = item.post_charges_by_date || {}
                    const todayPostChargesAmt =
                      postByDate[activeDayKey] ?? postByDate[systemTodayKey] ?? 0
                    const todayCombined = perDayPrice + todayPostChargesAmt
                    const hasTodayPostCharges = todayPostChargesAmt !== 0

                    const bookingType = item.booking_type || 'WALK-IN-GUEST'
                    const hasAdvance = pendingAdvanceForRoom > 0
                    const leftIsNegative = netRoomAmount < 0
                    const rightIsNegative = netAllRoomsAmount < 0
                    const totalAllowances = item.total_allowances || 0
                    const hasAllowances = totalAllowances > 0

                    return (
                      <div
                        key={`${item.checkin_id}-${item.room_no}`}
                        className={`occupied-tile ${isNear ? 'occupied-tile-checkout-near' : ''} ${isExpired ? 'occupied-tile-expired' : ''}`}
                        onClick={() => handleOccupiedRoomClick(item)}
                        onContextMenu={(e) => handleContextMenu(e, item)}
                        style={{
                          border: `2px solid ${isExpired ? uiSettings.occupied_expired_bg : isNear ? uiSettings.occupied_warning_bg : getStatusBorderColor('occupied')}`,
                        }}
                        title={(() => {
                          const advMsg = hasAdvance
                            ? `Advance applied: -₹${pendingAdvanceForRoom.toFixed(2)}\n`
                            : ''
                          const alwMsg = hasAllowances
                            ? `Allowances applied: -₹${totalAllowances.toFixed(2)}\n`
                            : ''
                          return `${item.guest_name}\nBooking Type: ${bookingType}${item.agent_name ? `\nAgent: ${item.agent_name}` : ''}\n${advMsg}${alwMsg}IN: ${formatDateTime(item.checkin_datetime)}\nOUT: ${formatDateTime(item.checkout_datetime)}\n${isMultiRoom ? `[Multi-Room] Left: ${item.room_no} own total | Right: all rooms combined\n` : ''}Per Day: ${formatAmount(perDayPrice)}${hasTodayPostCharges ? `\nToday Post Charges: ${formatAmount(todayPostChargesAmt)}\nToday Combined: ${formatAmount(todayCombined)}` : ''}\nLeft (${item.room_no}): ${formatAmount(netRoomAmount)}${hasAdvance ? ` (₹${pendingAdvanceForRoom.toFixed(2)} advance deducted)` : ''}${hasAllowances ? ` (₹${totalAllowances.toFixed(2)} allowance deducted)` : ''}\nRight (${isMultiRoom ? 'All rooms combined' : 'Total'}): ${formatAmount(netAllRoomsAmount)}${hasAdvance ? ` (total advance: ₹${pendingAdvanceForRoom.toFixed(2)})` : ''}\n${isExpired ? '⚠️ Checkout time has passed! Click to extend day. ⚠️' : isNear ? '⚠️ Checkout in less than 30 minutes! ⚠️' : ''}`
                        })()}>
                        <div
                          className="occupied-header"
                          style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                          {item.room_no} {item.guest_name}
                        </div>
                        <div
                          className="occupied-body"
                          style={{
                            backgroundColor: tileStyle.backgroundColor,
                            color: tileStyle.color,
                          }}>
                          <div>IN : {formatDateTime(item.checkin_datetime)}</div>
                          <div>OUT : {formatDateTime(item.checkout_datetime)}</div>
                          <div>
                            {bookingType === 'AGENT' && item.agent_name
                              ? item.agent_name
                              : item.guest_type}
                          </div>

                          <div className="charges-line">
                            <span
                              title={`${isMultiRoom ? `This room (${item.room_no}) cumulative: all days room charges + all post charges & allowances` : 'Cumulative Total: all days room charges + all post charges & allowances'}${hasAllowances ? `\nAllowances Deducted: -₹${totalAllowances.toFixed(2)}` : ''}${hasAdvance ? `\nAdvance Deducted: -₹${pendingAdvanceForRoom.toFixed(2)}` : ''}${leftIsNegative ? '\n⚠️ Excess advance — refund due to guest' : ''}`}
                              style={{
                                color: '#000000',
                                fontWeight: leftIsNegative || hasAdvance ? 600 : 'normal',
                              }}>
                              {formatAmount(netRoomAmount)}
                              {leftIsNegative && (
                                <span style={{ fontSize: '0.55rem', marginLeft: '2px' }}></span>
                              )}
                              {!leftIsNegative && hasAdvance && (
                                <span style={{ fontSize: '0.55rem', marginLeft: '2px' }}></span>
                              )}
                            </span>
                            <span
                              className="fw-bold"
                              title={`${isMultiRoom ? 'Combined Total (all rooms × all days) + all post charges & allowances' : 'Cumulative Total: all days room charges + all post charges & allowances'}${hasAllowances ? `\nAllowances Deducted: -₹${totalAllowances.toFixed(2)}` : ''}${hasAdvance ? `\nTotal Advance Deducted: -₹${pendingAdvanceForRoom.toFixed(2)}` : ''}${rightIsNegative ? '\n⚠️ Excess advance — refund due to guest' : ''}`}
                              style={{ color: '#000000' }}>
                              {formatAmount(netAllRoomsAmount)}
                              {rightIsNegative && (
                                <span style={{ fontSize: '0.55rem', marginLeft: '2px' }}></span>
                              )}
                              {!rightIsNegative && hasAdvance && (
                                <span style={{ fontSize: '0.55rem', marginLeft: '2px' }}></span>
                              )}
                            </span>
                          </div>
                          {hasAllowances && (
                            <div
                              style={{
                                fontSize: '0.6rem',
                                color: '#c0392b',
                                fontWeight: 600,
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginTop: '1px',
                              }}
                              title={`Allowance of ₹${totalAllowances.toFixed(2)} deducted from room total`}>
                              <span>Alw: -{formatAmount(totalAllowances)}</span>
                              <span>Net: {formatAmount(netRoomAmount)}</span>
                            </div>
                          )}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '0.65rem',
                            }}>
                            <span title="Adult : Pax : Ex-Pax : Child">
                              <span title="Pax (total guests)">
                                {item.original_pax ?? item.adults}
                              </span>
                              <span style={{ opacity: 0.5 }}>:</span>
                              <span title="Extra Pax">{item.ex_pax}</span>
                              <span style={{ opacity: 0.5 }}>:</span>
                              <span title="Child">{item.child_count}</span>
                              <span style={{ opacity: 0.5 }}>:</span>
                              <span title="Driver">{item.driver_count}</span>
                            </span>
                            <span>| {item.payment_method}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            ) : roomsAfterStatus.length === 0 ? (
              <div className="text-center py-5">
                <i className="fi fi-rr-search text-muted fs-4 mb-4 d-block"></i>
                <p className="text-muted mb-0">No rooms found</p>
                <Button variant="outline-primary" size="sm" onClick={resetFilters} className="mt-2">
                  Reset Filters
                </Button>
              </div>
            ) : (
              <div className="d-flex flex-column">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="d-flex align-items-stretch gap-1 p-1 bg-white"
                    style={{ border: '1px solid lightgray' }}>
                    {uiSettings.show_left_category && (
                      <div className="group-box me-1" style={{ minWidth: '100px' }}>
                        <div>
                          <span className="fw-bold">{group.name}</span>
                          <br />
                          <span>{group.rooms.length}</span>
                        </div>
                      </div>
                    )}
                    <div className="d-flex flex-wrap gap-1 flex-grow-1">
                      {group.rooms.map((room) => {
                        const occupiedItemForTile =
                          room.status === 'occupied'
                            ? occupiedRooms.find((occ) => occ.room_no === room.number)
                            : null
                        const isExpiredTile = occupiedItemForTile
                          ? occupiedItemForTile.isExpired
                          : false
                        // Expired rooms show as normal occupied color (not red) in the All tab grid
                        const tileBg = getStatusBgColor(room.status)
                        const tileColor = getStatusTextColor(room.status)
                        const tileBorder = getStatusBorderColor(room.status)

                        return (
                          <div
                            key={room.id}
                            onClick={isExpiredTile ? undefined : () => handleRoomTileClick(room)}
                            onContextMenu={
                              isExpiredTile
                                ? undefined
                                : (e) => {
                                    if (room.status === 'occupied') {
                                      if (occupiedItemForTile) {
                                        e.preventDefault()
                                        handleContextMenu(e, occupiedItemForTile)
                                      }
                                    } else {
                                      e.preventDefault()
                                      handleRoomStatusChangeRequest(room)
                                    }
                                  }
                            }
                            className={`d-flex flex-column align-items-center justify-content-center p-1 shadow-sm room-tile room-tile-${boxSizeClass}${isExpiredTile ? '' : ' cursor-pointer'}`}
                            style={{
                              cursor: isExpiredTile ? 'not-allowed' : 'pointer',
                              backgroundColor: tileBg,
                              color: tileColor,
                              border: `1px solid ${tileBorder}`,
                              opacity: isExpiredTile ? 0.85 : 1,
                            }}
                            title={isExpiredTile ? 'Checkout time has expired' : undefined}>
                            <input
                              type="checkbox"
                              className="room-checkbox"
                              checked={isRoomSelected(room.id)}
                              onChange={(e) => {
                                e.stopPropagation()
                                toggleRoomSelection(room.id)
                              }}
                              onClick={(e) => e.stopPropagation()}
                              disabled={room.status !== 'available' || isExpiredTile}
                              title={
                                isExpiredTile
                                  ? 'Checkout time has expired'
                                  : room.status !== 'available'
                                    ? 'Only vacant rooms can be selected for check-in'
                                    : 'Select for check-in'
                              }
                            />
                            <div className="fw-bold">{room.number}</div>
                            {showSubtext && (
                              <div className="small">
                                {viewMode === 'category' ? room.floor : room.category}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 bg-white border-top p-2">
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <Button size="sm" variant="danger" className="fw-semibold px-4">
                Summary
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="fw-semibold px-4"
                onClick={() => navigate('/hotel/report')}>
                <i className="fi fi-rr-chart-line me-1"></i>
                Report
              </Button>
              <Button size="sm" variant="danger" className="fw-semibold px-4">
                Cash In
              </Button>
              <Button size="sm" variant="danger" className="fw-semibold px-4">
                Cash Out
              </Button>
              <Button size="sm" variant="danger" className="fw-semibold px-4">
                MIS Report
              </Button>
              <Button
                size="sm"
                variant="success"
                className="fw-semibold px-4"
                onClick={handleCheckoutAlertClick}>
                {showCheckoutAlertTable ? 'Back to Rooms' : 'Today Check Out'}
              </Button>
              <Button
                size="sm"
                variant="primary"
                className="fw-semibold px-4 position-relative"
                onClick={() => navigate('/hotel/reservation-summary')}>
                Reservation Summary
                {todayReservationCount > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                    style={{ fontSize: '0.65rem', minWidth: '1.4rem' }}>
                    {todayReservationCount}
                    <span className="visually-hidden">today's reservations</span>
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Day Extend Modal */}
        <Modal
          show={dayExtendModal.show}
          onHide={() => {
            setDayExtendModal({
              show: false,
              occupiedItem: null,
              editableExPax: 0,
              editableChild: 0,
              editableDriver: 0,
              extensionDays: 1,
              autoExtendSiblings: true,
            })
            setSiblingRooms([])
          }}
          centered
          backdrop="static"
          size="sm"
          className="extend-day-modal">
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title className="text-center w-100 fw-bold">Extend Stay</Modal.Title>
          </Modal.Header>

          <Modal.Body className="px-4 py-4">
            <div className="text-center mb-3">
              <i
                className="fi fi-rr-alarm-clock"
                style={{ fontSize: '48px', color: '#E03F4F' }}></i>
            </div>

            <h6 className="fw-semibold text-center text-danger mb-2">
              {dayExtendModal.occupiedItem?.isExpired
                ? '⚠️ Checkout Time Has Passed! ⚠️'
                : 'Extend Guest Stay'}
            </h6>

            <p className="text-muted text-center mb-1">
              Room <strong>{dayExtendModal.occupiedItem?.room_no}</strong> -{' '}
              <strong>{dayExtendModal.occupiedItem?.guest_name}</strong>
            </p>

            <p className="text-muted text-center mb-4">
              Checkout:{' '}
              <strong className="text-danger">
                {dayExtendModal.occupiedItem?.checkout_datetime
                  ? formatDateTime(dayExtendModal.occupiedItem.checkout_datetime)
                  : 'N/A'}
              </strong>
            </p>

            {calculatedDayPrice && (
              <div className="charge-breakdown mb-3">
                <p>
                  <span>Room Tariff (per day):</span>
                  <span>₹{calculatedDayPrice.perDayBasePrice.toFixed(2)}</span>
                </p>
                {(calculatedDayPrice.discountAmount || 0) > 0 && (
                  <p className="discount-text">
                    <span>Discount:</span>
                    <span>-₹{calculatedDayPrice.discountAmount.toFixed(2)}</span>
                  </p>
                )}
                {(calculatedDayPrice.exPaxCharge || 0) > 0 && (
                  <p>
                    <span>
                      Ex-Pax Charge
                      {dayExtendModal.editableExPax > 0
                        ? ` (×${dayExtendModal.editableExPax})`
                        : ''}
                      :
                    </span>
                    <span>₹{calculatedDayPrice.exPaxCharge.toFixed(2)}</span>
                  </p>
                )}
                {(calculatedDayPrice.childCharge || 0) > 0 && (
                  <p>
                    <span>
                      Child Charge
                      {dayExtendModal.editableChild > 0
                        ? ` (×${dayExtendModal.editableChild})`
                        : ''}
                      :
                    </span>
                    <span>₹{calculatedDayPrice.childCharge.toFixed(2)}</span>
                  </p>
                )}
                {(calculatedDayPrice.driverCharge || 0) > 0 && (
                  <p>
                    <span>
                      Driver Charge
                      {dayExtendModal.editableDriver > 0
                        ? ` (×${dayExtendModal.editableDriver})`
                        : ''}
                      :
                    </span>
                    <span>₹{calculatedDayPrice.driverCharge.toFixed(2)}</span>
                  </p>
                )}
                {(calculatedDayPrice.taxAmount || 0) > 0 && (
                  <p className="tax-text">
                    <span>
                      Tax
                      {calculatedDayPrice.totalTaxPercent > 0
                        ? ` (${calculatedDayPrice.totalTaxPercent}%)`
                        : ''}
                      :
                    </span>
                    <span>+₹{calculatedDayPrice.taxAmount.toFixed(2)}</span>
                  </p>
                )}
                <p className="total-line">
                  <span>Day Extension Total:</span>
                  <span>₹{calculatedDayPrice.totalPrice.toFixed(2)}</span>
                </p>
                <p style={{ fontSize: '0.72rem', color: '#6c757d', marginTop: 4 }}>
                  <i className="fi fi-rr-info me-1" />
                  Day extension uses room tariff only. Post charges &amp; allowances are not
                  included.
                </p>
              </div>
            )}

            <div className="d-flex gap-3 justify-content-center mt-4">
              <Button
                variant="danger"
                onClick={handleDayExtend}
                disabled={extendingDay}
                className="px-4 rounded">
                {extendingDay ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Extending...
                  </>
                ) : (
                  <>
                    <i className="fi fi-rr-check me-2"></i>
                    Extend
                  </>
                )}
              </Button>

              <Button
                variant="secondary"
                onClick={() => {
                  const occupiedItemSnapshot = dayExtendModal.occupiedItem
                  setDayExtendModal({
                    show: false,
                    occupiedItem: null,
                    editableExPax: 0,
                    editableChild: 0,
                    editableDriver: 0,
                    extensionDays: 1,
                    autoExtendSiblings: true,
                  })
                  setSiblingRooms([])
                  if (occupiedItemSnapshot) {
                    navigate('/hotel/room-detail', {
                      state: { occupiedItem: occupiedItemSnapshot },
                    })
                  }
                }}
                disabled={extendingDay}
                className="px-4 rounded">
                <i className="fi fi-rr-cross me-2"></i>
                Cancel
              </Button>
            </div>
          </Modal.Body>
        </Modal>

        {/* Room Details Modal */}
        <Modal
          show={showRoomDetails}
          onHide={() => setShowRoomDetails(false)}
          centered
          size="sm"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <Modal.Header closeButton className="border-0 pb-0">
            <Modal.Title>Room Details</Modal.Title>
          </Modal.Header>
          <Modal.Body onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            {selectedRoom && (
              <div>
                <div className="text-center mb-3">
                  <div
                    className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
                    style={{ width: '60px', height: '60px' }}>
                    <i className="fi fi-rr-bed fs-4 text-primary"></i>
                  </div>
                  <h5 className="mb-1">{selectedRoom.number}</h5>
                  <span
                    className={`badge px-3 py-1`}
                    style={{
                      backgroundColor: getStatusBgColor(selectedRoom.status),
                      color: getStatusTextColor(selectedRoom.status),
                      border: `1px solid ${getStatusBorderColor(selectedRoom.status)}`,
                    }}>
                    {getStatusText(selectedRoom.status)}
                  </span>
                </div>
                <div className="mb-3 small">
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Category:</span>
                    <span className="fw-semibold">{selectedRoom.category}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-1">
                    <span className="text-muted">Floor:</span>
                    <span className="fw-semibold">{selectedRoom.floor}</span>
                  </div>
                </div>
                <div className="d-grid gap-2">
                  {selectedRoom.status === 'available' && (
                    <Button
                      variant="success"
                      disabled={updating}
                      onClick={() => handleRoomStatusChange(selectedRoom.id, 'occupied')}>
                      <i className="fi fi-rr-check me-1"></i> Book Now
                    </Button>
                  )}
                  {selectedRoom.status === 'occupied' && (
                    <Button
                      variant="outline-danger"
                      disabled={updating}
                      onClick={() => handleRoomStatusChange(selectedRoom.id, 'cleaning')}>
                      <i className="fi fi-rr-door-open me-1"></i> Check Out
                    </Button>
                  )}
                  {selectedRoom.status === 'cleaning' && (
                    <Button
                      variant="warning"
                      disabled={updating}
                      onClick={() => handleRoomStatusChange(selectedRoom.id, 'available')}>
                      <i className="fi fi-rr-cleaning-bucket me-1"></i> Mark Clean
                    </Button>
                  )}
                  {selectedRoom.status === 'reserved' && (
                    <Button
                      variant="primary"
                      disabled={updating}
                      onClick={() => handleRoomStatusChange(selectedRoom.id, 'occupied')}>
                      <i className="fi fi-rr-user me-1"></i> Check In
                    </Button>
                  )}
                  <Button variant="outline-secondary" onClick={() => setShowRoomDetails(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </Modal.Body>
        </Modal>

        {/* Settings Offcanvas */}
        <Offcanvas
          show={showSettings}
          onHide={() => setShowSettings(false)}
          placement="end"
          style={{ width: '525px', backgroundColor: '#ffffff' }}>
          <Offcanvas.Header closeButton>
            <Offcanvas.Title>Display Settings</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body>
            <Form>
              <Form.Check
                type="checkbox"
                id="showRoomText"
                label="Show room subtext (floor/category)"
                checked={uiSettings.show_room_text}
                onChange={(e) => setUiSettings({ ...uiSettings, show_room_text: e.target.checked })}
              />
              <Form.Check
                type="checkbox"
                id="showLeftCategory"
                label="Show left group box (floor/category name)"
                checked={uiSettings.show_left_category}
                onChange={(e) =>
                  setUiSettings({ ...uiSettings, show_left_category: e.target.checked })
                }
                className="mt-3"
              />

              <Form.Label className="mt-3 fw-bold">
                Room box size: {uiSettings.room_box_size}
              </Form.Label>

              <div style={{ width: '100%', padding: '0 10px' }}>
                <Form.Range
                  min={1}
                  max={6}
                  step={1}
                  value={uiSettings.room_box_size}
                  onChange={(e) =>
                    setUiSettings((prev) => ({
                      ...prev,
                      room_box_size: parseInt(e.target.value),
                    }))
                  }
                  style={{
                    width: '100%',
                    cursor: 'pointer',
                    accentColor: '#000000',
                    backgroundColor: '#000000',
                  }}
                />
              </div>

              <hr className="my-4" />
              <h6>Status Colors</h6>

              <Tabs defaultActiveKey="background" className="mb-3">
                <Tab eventKey="background" title="Background">
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Vacant</Form.Label>
                        <Form.Control
                          type="color"
                          value={uiSettings.color_vacant}
                          onChange={(e) =>
                            setUiSettings({ ...uiSettings, color_vacant: e.target.value })
                          }
                          style={{ height: 40 }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Occupied</Form.Label>
                        <Form.Control
                          type="color"
                          value={uiSettings.color_occupied}
                          onChange={(e) =>
                            setUiSettings({ ...uiSettings, color_occupied: e.target.value })
                          }
                          style={{ height: 40 }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Cleaning (Dirty)</Form.Label>
                        <Form.Control
                          type="color"
                          value={uiSettings.color_cleaning}
                          onChange={(e) =>
                            setUiSettings({ ...uiSettings, color_cleaning: e.target.value })
                          }
                          style={{ height: 40 }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Reserved (Block)</Form.Label>
                        <Form.Control
                          type="color"
                          value={uiSettings.color_reserved}
                          onChange={(e) =>
                            setUiSettings({ ...uiSettings, color_reserved: e.target.value })
                          }
                          style={{ height: 40 }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Maintenance</Form.Label>
                        <Form.Control
                          type="color"
                          value={uiSettings.color_maintenance || DEFAULT_STATUS_BG.maintenance}
                          onChange={(e) =>
                            setUiSettings({ ...uiSettings, color_maintenance: e.target.value })
                          }
                          style={{ height: 40 }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Reservation</Form.Label>
                        <Form.Control
                          type="color"
                          value={uiSettings.color_reservation || DEFAULT_STATUS_BG.reservation}
                          onChange={(e) =>
                            setUiSettings({ ...uiSettings, color_reservation: e.target.value })
                          }
                          style={{ height: 40 }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Tab>

                <Tab eventKey="text" title="Text Color">
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Vacant Text</Form.Label>
                        <Form.Control
                          type="color"
                          value={uiSettings.text_color_vacant || DEFAULT_STATUS_TEXT.available}
                          onChange={(e) =>
                            setUiSettings({ ...uiSettings, text_color_vacant: e.target.value })
                          }
                          style={{ height: 40 }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Occupied Text</Form.Label>
                        <Form.Control
                          type="color"
                          value={uiSettings.text_color_occupied || DEFAULT_STATUS_TEXT.occupied}
                          onChange={(e) =>
                            setUiSettings({ ...uiSettings, text_color_occupied: e.target.value })
                          }
                          style={{ height: 40 }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Cleaning Text</Form.Label>
                        <Form.Control
                          type="color"
                          value={uiSettings.text_color_cleaning || DEFAULT_STATUS_TEXT.cleaning}
                          onChange={(e) =>
                            setUiSettings({ ...uiSettings, text_color_cleaning: e.target.value })
                          }
                          style={{ height: 40 }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Reserved Text</Form.Label>
                        <Form.Control
                          type="color"
                          value={uiSettings.text_color_reserved || DEFAULT_STATUS_TEXT.reserved}
                          onChange={(e) =>
                            setUiSettings({ ...uiSettings, text_color_reserved: e.target.value })
                          }
                          style={{ height: 40 }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Maintenance Text</Form.Label>
                        <Form.Control
                          type="color"
                          value={
                            uiSettings.text_color_maintenance || DEFAULT_STATUS_TEXT.maintenance
                          }
                          onChange={(e) =>
                            setUiSettings({ ...uiSettings, text_color_maintenance: e.target.value })
                          }
                          style={{ height: 40 }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Reservation Text</Form.Label>
                        <Form.Control
                          type="color"
                          value={
                            uiSettings.text_color_reservation || DEFAULT_STATUS_TEXT.reservation
                          }
                          onChange={(e) =>
                            setUiSettings({ ...uiSettings, text_color_reservation: e.target.value })
                          }
                          style={{ height: 40 }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Tab>

                <Tab eventKey="border" title="Border Color">
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Vacant Border</Form.Label>
                        <Form.Control
                          type="color"
                          value={uiSettings.border_color_vacant || DEFAULT_STATUS_BORDER.available}
                          onChange={(e) =>
                            setUiSettings({ ...uiSettings, border_color_vacant: e.target.value })
                          }
                          style={{ height: 40 }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Occupied Border</Form.Label>
                        <Form.Control
                          type="color"
                          value={uiSettings.border_color_occupied || DEFAULT_STATUS_BORDER.occupied}
                          onChange={(e) =>
                            setUiSettings({ ...uiSettings, border_color_occupied: e.target.value })
                          }
                          style={{ height: 40 }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Cleaning Border</Form.Label>
                        <Form.Control
                          type="color"
                          value={uiSettings.border_color_cleaning || DEFAULT_STATUS_BORDER.cleaning}
                          onChange={(e) =>
                            setUiSettings({ ...uiSettings, border_color_cleaning: e.target.value })
                          }
                          style={{ height: 40 }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Reserved Border</Form.Label>
                        <Form.Control
                          type="color"
                          value={uiSettings.border_color_reserved || DEFAULT_STATUS_BORDER.reserved}
                          onChange={(e) =>
                            setUiSettings({ ...uiSettings, border_color_reserved: e.target.value })
                          }
                          style={{ height: 40 }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Maintenance Border</Form.Label>
                        <Form.Control
                          type="color"
                          value={
                            uiSettings.border_color_maintenance || DEFAULT_STATUS_BORDER.maintenance
                          }
                          onChange={(e) =>
                            setUiSettings({
                              ...uiSettings,
                              border_color_maintenance: e.target.value,
                            })
                          }
                          style={{ height: 40 }}
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Reservation Border</Form.Label>
                        <Form.Control
                          type="color"
                          value={
                            uiSettings.border_color_reservation || DEFAULT_STATUS_BORDER.reservation
                          }
                          onChange={(e) =>
                            setUiSettings({
                              ...uiSettings,
                              border_color_reservation: e.target.value,
                            })
                          }
                          style={{ height: 40 }}
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Tab>

                <Tab eventKey="warning" title="Warning Colors">
                  <Form.Group className="mb-3">
                    <Form.Label>Checkout Warning (30 min or less) - Background</Form.Label>
                    <Form.Control
                      type="color"
                      value={uiSettings.occupied_warning_bg || '#b96eff'}
                      onChange={(e) =>
                        setUiSettings({ ...uiSettings, occupied_warning_bg: e.target.value })
                      }
                      style={{ height: 40 }}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Checkout Warning (30 min or less) - Text</Form.Label>
                    <Form.Control
                      type="color"
                      value={uiSettings.occupied_warning_text || '#ffffff'}
                      onChange={(e) =>
                        setUiSettings({ ...uiSettings, occupied_warning_text: e.target.value })
                      }
                      style={{ height: 40 }}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Checkout Expired - Background</Form.Label>
                    <Form.Control
                      type="color"
                      value={uiSettings.occupied_expired_bg || '#E03F4F'}
                      onChange={(e) =>
                        setUiSettings({ ...uiSettings, occupied_expired_bg: e.target.value })
                      }
                      style={{ height: 40 }}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Checkout Expired - Text</Form.Label>
                    <Form.Control
                      type="color"
                      value={uiSettings.occupied_expired_text || '#ffffff'}
                      onChange={(e) =>
                        setUiSettings({ ...uiSettings, occupied_expired_text: e.target.value })
                      }
                      style={{ height: 40 }}
                    />
                  </Form.Group>
                </Tab>
              </Tabs>

              <div className="d-grid mt-4">
                <Button variant="primary" onClick={handleSaveSettings} disabled={savingSettings}>
                  {savingSettings ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
              <p className="text-muted small mt-3">
                Settings are saved per hotel and will persist across sessions.
              </p>
            </Form>
          </Offcanvas.Body>
        </Offcanvas>

        {/* Custom Context Menu */}
        {showContextMenu && contextMenuItem && (
          <div
            id="custom-context-menu"
            ref={contextMenuRef}
            style={{
              position: 'fixed',
              top: contextMenuPos.y,
              left: contextMenuPos.x,
              backgroundColor: '#eeeeee',
              border: '1px solid #ccc',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              zIndex: 1050,
              minWidth: '200px',
              width: 'auto',
              padding: '4px 0',
              borderRadius: '4px',
            }}
            onClick={(e) => e.stopPropagation()}>
            {contextMenuOptions.map((option) => (
              <div
                key={option.label}
                style={{
                  padding: '6px 12px',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                onClick={() => {
                  if (option.label === 'AMENDMENTS')
                    navigate('/hotel/amendments', { state: { occupiedItem: contextMenuItem } })
                  else if (option.label === 'Advance') {
                    setSelectedOccupiedItem(contextMenuItem)
                    setShowAdvanceModal(true)
                  } else if (option.label === 'POST CHARGES') {
                    setSelectedOccupiedItem(contextMenuItem)
                    setPostChargesMode('charge')
                    setShowPostChargesModal(true)
                  } else if (option.label === 'ALLOWANCES') {
                    setSelectedOccupiedItem(contextMenuItem)
                    setPostChargesMode('allowance')
                    setShowPostChargesModal(true)
                  } else if (option.label === 'RECEPIT AGAINST POSTED BILLS') {
                    setSelectedOccupiedItem(contextMenuItem)
                    setShowReceiptModal(true)
                  }
                  closeContextMenu()
                }}>
                <i className={option.icon} style={{ fontSize: '0.85rem' }}></i>
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Post Charges Modal */}
        {selectedOccupiedItem && (
          <PostChargesModal
            show={showPostChargesModal}
            onHide={() => {
              setShowPostChargesModal(false)
              setSelectedOccupiedItem(null)
            }}
            roomNo={selectedOccupiedItem.room_no}
            guestName={selectedOccupiedItem.guest_name}
            checkinId={selectedOccupiedItem.checkin_id}
            detailId={selectedOccupiedItem.detail_id}
            roomId={selectedOccupiedItem.room_id}
            guestId={selectedOccupiedItem.checkin?.guest_id}
            hotelId={hotelId || 0}
            userId={user?.id}
            mode={postChargesMode}
            onSuccess={() => {
              fetchOccupiedRooms()
              if (showAtGlanceTable) fetchAtGlanceData()
            }}
            existingCharges={[]}
            onChargesUpdated={() => {
              fetchOccupiedRooms()
              if (showAtGlanceTable) fetchAtGlanceData()
            }}
          />
        )}

        {/* Receipt Against Bills Modal */}
        {selectedOccupiedItem && (
          <ReceiptAgainstBillsModal
            show={showReceiptModal}
            onHide={() => {
              setShowReceiptModal(false)
              setSelectedOccupiedItem(null)
            }}
            roomNo={selectedOccupiedItem.room_no}
            guestName={selectedOccupiedItem.guest_name}
            checkinId={selectedOccupiedItem.checkin_id}
            detailId={selectedOccupiedItem.detail_id}
            hotelId={hotelId || 0}
            userId={user?.id}
            onSuccess={() => {
              fetchOccupiedRooms()
              if (showAtGlanceTable) fetchAtGlanceData()
            }}
          />
        )}

        {/* Advance Modal */}
        {selectedOccupiedItem && (
          <Advance
            show={showAdvanceModal}
            onHide={() => {
              setShowAdvanceModal(false)
              setSelectedOccupiedItem(null)
            }}
            roomNo={selectedOccupiedItem.room_no}
            guestName={selectedOccupiedItem.guest_name}
            checkinId={selectedOccupiedItem.checkin_id}
            detailId={selectedOccupiedItem.detail_id}
            hotelId={hotelId || 0}
            userId={user?.id}
            roomId={selectedOccupiedItem.room_id}
            onSuccess={() => {
              fetchOccupiedRooms()
              if (showAtGlanceTable) fetchAtGlanceData()
            }}
          />
        )}

        {/* Room Status Modal - Single Room */}
        <RoomStatusModal
          show={showRoomStatusModal}
          onHide={() => {
            setShowRoomStatusModal(false)
            setSelectedRoomForStatus(null)
          }}
          room={selectedRoomForStatus}
          hotelId={hotelId || 0}
          userId={user?.id}
          onSuccess={handleRoomStatusChangeSuccess}
        />

        {/* Room Status Modal - Multiple Rooms (bulk) */}
        <RoomStatusModal
          show={showMultiRoomStatusModal}
          onHide={() => setShowMultiRoomStatusModal(false)}
          room={null}
          rooms={enrichedRooms.filter((r) => selectedRoomIds.includes(r.id))}
          hotelId={hotelId || 0}
          userId={user?.id}
          onSuccess={async () => {
            setSelectedRoomIds([])
            await handleRoomStatusChangeSuccess()
          }}
        />
      </div>
    </>
  )
}

export default HotelBookingPanel