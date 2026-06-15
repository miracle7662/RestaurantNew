import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Modal } from 'react-bootstrap'
import { toast } from 'react-hot-toast'
import TitleHelmet from '@/components/Common/TitleHelmet'
import { useAuthContext } from '@/common/context/useAuthContext'
import RoomService from '@/common/hotel/room'

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
import PostChargesModal from './PostChargesModal'
import ReceiptAgainstBillsModal from './ReceiptAgainstBillsModal'
import Advance from './Advance'
import RoomStatusModal from './RoomStatusModal'
import RoomStatusLogService, { RoomStatusLog } from '@/common/hotel/roomStatusLog'
import DisplaySettings from './DisplaySettings'

// ==================== TYPE DEFINITIONS ====================

const normalizeRoomStatus = (raw: any): RoomStatus => {
  if (!raw) return 'available'
  const s = raw.trim().toLowerCase()
  if (s === 'occupied') return 'occupied'
  if (s === 'cleaning' || s === 'dirty' || s === 'clean') return 'cleaning'
  if (s === 'reserved' || s === 'blocked' || s === 'block') return 'reserved'
  if (s === 'maintenance' || s === 'under maintenance') return 'maintenance'
  if (s === 'reservation') return 'reservation'
  return 'available'
}

interface ApiRoom {
  room_id: number
  room_no: string
  room_name: string
  display_name?: string
  room_category_id: number
  room_status: string
  room_status_id?: number
  status_color?: string
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

 const [uiSettings, setUiSettings] = useState<HotelUiSettings>({
  hotelid: hotelId || 0,
  show_left_category: true,
  show_room_text: true,
  room_box_size: 2,
  color_vacant: '#ffffff',
  color_occupied: '#DFF5E1',
  color_cleaning: '#FFF4CC',
  color_reserved: '#D9F1FF',
  color_maintenance: '#FFE0E0',
  color_reservation: '#D9F1FF',
  text_color_vacant: '#4B5563',
  text_color_occupied: '#16A34A',
  text_color_cleaning: '#D4A017',
  text_color_reserved: '#0284C7',
  text_color_maintenance: '#DC2626',
  text_color_reservation: '#0284C7',
  border_color_vacant: '#9CA3AF',
  border_color_occupied: '#4ADE80',
  border_color_cleaning: '#FACC15',
  border_color_reserved: '#38BDF8',
  border_color_maintenance: '#F87171',
  border_color_reservation: '#38BDF8',
  occupied_warning_bg: '#b96eff',
  occupied_warning_text: '#ffffff',
  occupied_expired_bg: '#E03F4F',
  occupied_expired_text: '#ffffff',
  dark_mode: false,
})
  const [showSettings, setShowSettings] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  const [occupiedRooms, setOccupiedRooms] = useState<OccupiedRoomItem[]>([])


  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })
  const [contextMenuItem, setContextMenuItem] = useState<OccupiedRoomItem | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
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

  // ==================== SETTLEMENT / RESERV / CHECKOUT SECTION STATES ====================
  type ActiveSection = 'settlement' | 'reserv' | 'checkout' | null
  const [activeSection, setActiveSection] = useState<ActiveSection>(null)

  const showReservSection = activeSection === 'reserv'
  const showCheckoutAlertTable = activeSection === 'checkout'

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

  // ==================== DIRTY / BLOCK / MAINT SUB-PANEL STATE ====================
  type HousekeepingTab = 'all' | 'dirty' | 'block' | 'maint' | null
  const [activeHousekeepingTab, setActiveHousekeepingTab] = useState<HousekeepingTab>(null)
  const [selectedHousekeepingRoomIds, setSelectedHousekeepingRoomIds] = useState<number[]>([])

  const dirtyScrollRef = useRef<HTMLDivElement | null>(null)
  const blockScrollRef = useRef<HTMLDivElement | null>(null)
  const maintScrollRef = useRef<HTMLDivElement | null>(null)

  const contextMenuOptions: ContextMenuOption[] = [
    { label: 'Amendments', icon: 'fi fi-rr-document' },
    { label: 'Advance', icon: 'fi fi-rr-receipt' },
    { label: 'Post Charges', icon: 'fi fi-rr-credit-card' },
    { label: 'Allowances', icon: 'fi fi-rr-gift' },
    { label: 'Receipt Against Posted Bills', icon: 'fi fi-rr-document' },
  ]

  // ==================== DYNAMIC COLOR HELPERS ====================
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
        return uiSettings.color_maintenance
      case 'reservation':
        return uiSettings.color_reservation
      default:
        return '#ffffff'
    }
  }

  const getStatusTextColor = (status: RoomStatus): string => {
    switch (status) {
      case 'available':
        return uiSettings.text_color_vacant
      case 'occupied':
        return uiSettings.text_color_occupied
      case 'cleaning':
        return uiSettings.text_color_cleaning
      case 'reserved':
        return uiSettings.text_color_reserved
      case 'maintenance':
        return uiSettings.text_color_maintenance
      case 'reservation':
        return uiSettings.text_color_reservation
      default:
        return '#4B5563'
    }
  }

  const getStatusBorderColor = (status: RoomStatus): string => {
    switch (status) {
      case 'available':
        return uiSettings.border_color_vacant
      case 'occupied':
        return uiSettings.border_color_occupied
      case 'cleaning':
        return uiSettings.border_color_cleaning
      case 'reserved':
        return uiSettings.border_color_reserved
      case 'maintenance':
        return uiSettings.border_color_maintenance
      case 'reservation':
        return uiSettings.border_color_reservation
      default:
        return '#9CA3AF'
    }
  }

  // ==================== SIDE EFFECTS ====================
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now)
    }, 60000)
    return () => clearInterval(timer)
  }, [])

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
        const metaRes = await RoomService.getHotelBookingMeta(hotelId)
        const meta = (metaRes as any)?.data || metaRes
        setRooms(meta.rooms || [])
        setCategories(meta.categories || [])
        setFloors(meta.floors || [])
      } catch (err) {
        setError('Failed to load room data')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    fetchRoomStatusLogs()
    fetchOccupiedRooms()
  }, [hotelId])

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

  const fetchOccupiedRooms = async () => {
    if (!hotelId) return
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
    }
  }

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

    await CheckInService.updatePartial(item.checkin_id, {
      checkout_datetime: formatDateTimeForMySQL(newCheckoutDate),
      additional_amount: totalPrice,
      additional_nights: extensionDays,
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

      await fetchOccupiedRooms()
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
  const enrichedRooms: Room[] = useMemo(() => {
    const floorMap = new Map(floors.map((f) => [f.floor_id, f.floor_name]))
    const categoryMap = new Map(categories.map((c) => [c.room_category_id, c.category_name]))
    return rooms.map((apiRoom) => ({
      id: apiRoom.room_id,
      number: apiRoom.room_no,
      category: categoryMap.get(apiRoom.room_category_id) || 'Uncategorized',
      status: normalizeRoomStatus(apiRoom.room_status),
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

  const handleRoomStatusChangeSuccess = async () => {
    try {
      const roomsRes = await RoomService.list({ hotelid: hotelId })
      setRooms(roomsRes.data || [])
      await fetchRoomStatusLogs()
      if (statusFilter === 'occupied') {
        await fetchOccupiedRooms()
      }
    } catch (err) {
      console.error('Failed to refresh room data:', err)
    }
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

  const handleClose = () => {
    navigate(-1)
  }

  const handleStatusFilterClick = (
    filter: RoomStatus | 'all' | 'maintenance' | 'reservation' | 'arrivals',
  ) => {
    setStatusFilter(filter)
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
    }
  }

  const handleAtGlanceClick = () => {
    navigate('/hotel/at-glance')
  }

  const handleArrivalSectionClick = () => {
    navigate('/hotel/arrivals')
  }

  const handleReservSectionClick = () => {
    if (showReservSection) {
      setActiveSection(null)
    } else {
      setActiveSection('reserv')
    }
  }

  const handleSettlementClick = () => {
    navigate('/hotel/SettlementPage')
  }

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
      const newIds = [...prev]
      for (const id of roomIds) {
        if (!newIds.includes(id)) {
          newIds.push(id)
        }
      }
      return newIds
    })
  }

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

  return (
    <>
      <TitleHelmet title="Room Management" />
      <style>{`
        /* CSS remains unchanged from original */
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

        .room-checkbox { position: absolute; top: 4px; left: 4px; width: 16px; height: 16px; cursor: pointer; z-index: 2; }
        .room-checkbox:disabled { cursor: not-allowed; opacity: 0.5; }

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

        @keyframes pulseBadge {
          0%   { opacity: 1; transform: scale(1); }
          50%  { opacity: 0.7; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        .checkout-soon-badge { display: inline-block; background-color: #ff0000; color: #fff; font-weight: bold; font-size: 0.65rem; text-align: center; border-radius: 2px; padding: 1px 4px; margin-top: 4px; animation: pulseBadge 1s infinite; }
        .occupied-tile-settled { cursor: default !important; }

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

        .housekeeping-section { border: 1px solid #e0e0e0; margin-bottom: 0.3rem; background-color: #fff; }
        .housekeeping-section-header { background-color: #f8f9fa; padding: 0.3rem 0.5rem; font-weight: 500; font-size: 0.78rem; border-bottom: 1px solid #e0e0e0; display: flex; align-items: center; justify-content: space-between; }
        .housekeeping-section-header-left { display: flex; align-items: center; gap: 0.5rem; }
        .housekeeping-section-body { padding: 0.4rem 0.5rem; display: flex; flex-wrap: nowrap; gap: 0.5rem; overflow-x: auto; overflow-y: hidden; scrollbar-width: none; -ms-overflow-style: none; }
        .housekeeping-section-body::-webkit-scrollbar { display: none; }
        .housekeeping-section-body > div { flex-shrink: 0; }
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
                    <i className="fi fi-rr-apps me-1"></i>All [{stats.total}]
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleStatusFilterClick('available')}
                    className={`fw-semibold px-3 same-btn ${statusFilter === 'available' ? 'btn-status-available' : 'btn-outline-status-available'}`}>
                    <i className="fi fi-rr-bed-empty me-1"></i>Vacant [{stats.available}]
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleStatusFilterClick('occupied')}
                    className={`fw-semibold px-3 same-btn ${statusFilter === 'occupied' ? 'btn-status-occupied' : 'btn-outline-status-occupied'}`}>
                    <i className="fi fi-rr-user me-1"></i>Occupied [{stats.occupied}]
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      if (activeHousekeepingTab) {
                        handleHousekeepingTabClick(null)
                        handleStatusFilterClick('all')
                      } else {
                        handleStatusFilterClick('cleaning')
                        handleHousekeepingTabClick('all')
                      }
                    }}
                    className={`fw-semibold px-3 same-btn ${activeHousekeepingTab ? 'btn-status-cleaning' : 'btn-outline-status-cleaning'}`}>
                    <i className="fi fi-rr-lock me-1"></i>Block
                  </Button>
                  <Button
                    size="sm"
                    variant={showReservSection ? 'secondary' : 'outline-secondary'}
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
                    <i className="fi fi-rr-calendar me-1"></i> Reservation
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-info"
                    onClick={handleArrivalSectionClick}
                    className="fw-semibold px-3 same-btn text-nowrap">
                    <i className="fi fi-rr-plane-arrival me-1"></i>Arrivals
                  </Button>
                  <Button
                    size="sm"
                    variant="outline-success"
                    className="fw-semibold px-3 same-btn"
                    onClick={handleSettlementClick}>
                    <i className="fi fi-rr-money-check me-1"></i>Settlement
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
                  variant={viewMode === 'floor' ? 'danger' : 'primary'}
                  onClick={() => setViewMode(viewMode === 'floor' ? 'category' : 'floor')}
                  title={viewMode === 'floor' ? 'Switch to Category View' : 'Switch to Floor View'}
                  className="same-btn d-flex align-items-center justify-content-center">
                  <i className={viewMode === 'floor' ? 'fi fi-rr-building' : 'fi fi-rr-apps'}></i>
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

            {/* HOUSEKEEPING SUB-PANEL */}
            {activeHousekeepingTab && (
              <div className="border-top pt-0 pb-0 px-0">
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

          {/* Footer */}
          <div className="flex-shrink-0 bg-white border-top p-2">
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <Button size="sm" variant="danger" className="fw-semibold px-4">Summary</Button>
              <Button size="sm" variant="secondary" className="fw-semibold px-4" onClick={() => navigate('/hotel/report')}><i className="fi fi-rr-chart-line me-1"></i>Report</Button>
              <Button size="sm" variant="danger" className="fw-semibold px-4">Cash In</Button>
              <Button size="sm" variant="danger" className="fw-semibold px-4">Cash Out</Button>
              <Button size="sm" variant="danger" className="fw-semibold px-4">MIS Report</Button>
              <Button size="sm" variant="success" className="fw-semibold px-4" onClick={handleCheckoutAlertClick}>{showCheckoutAlertTable ? 'Back to Rooms' : 'Today Check Out'}</Button>
              <Button size="sm" variant="primary" className="fw-semibold px-4 position-relative" onClick={() => navigate('/hotel/reservation-summary')}>
                Reservation Summary
                {todayReservationCount > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem', minWidth: '1.4rem' }}>{todayReservationCount}<span className="visually-hidden">today's reservations</span></span>}
              </Button>
            </div>
          </div>
        </div>

        {/* Day Extend Modal */}
        <Modal show={dayExtendModal.show} onHide={() => { setDayExtendModal({ show: false, occupiedItem: null, editableExPax: 0, editableChild: 0, editableDriver: 0, extensionDays: 1, autoExtendSiblings: true }); setSiblingRooms([]) }} centered backdrop="static" size="sm" className="extend-day-modal">
          <Modal.Header closeButton className="border-0 pb-0"><Modal.Title className="text-center w-100 fw-bold">Extend Stay</Modal.Title></Modal.Header>
          <Modal.Body className="px-4 py-4">
            <div className="text-center mb-3"><i className="fi fi-rr-alarm-clock" style={{ fontSize: '48px', color: '#E03F4F' }}></i></div>
            <h6 className="fw-semibold text-center text-danger mb-2">{dayExtendModal.occupiedItem?.isExpired ? '⚠️ Checkout Time Has Passed! ⚠️' : 'Extend Guest Stay'}</h6>
            <p className="text-muted text-center mb-1">Room <strong>{dayExtendModal.occupiedItem?.room_no}</strong> - <strong>{dayExtendModal.occupiedItem?.guest_name}</strong></p>
            <p className="text-muted text-center mb-4">Checkout: <strong className="text-danger">{dayExtendModal.occupiedItem?.checkout_datetime ? formatDateTime(dayExtendModal.occupiedItem.checkout_datetime) : 'N/A'}</strong></p>
            {calculatedDayPrice && (
              <div className="charge-breakdown mb-3">
                <p><span>Room Tariff (per day):</span><span>₹{calculatedDayPrice.perDayBasePrice.toFixed(2)}</span></p>
                {(calculatedDayPrice.discountAmount || 0) > 0 && <p className="discount-text"><span>Discount:</span><span>-₹{calculatedDayPrice.discountAmount.toFixed(2)}</span></p>}
                {(calculatedDayPrice.exPaxCharge || 0) > 0 && <p><span>Ex-Pax Charge{dayExtendModal.editableExPax > 0 ? ` (×${dayExtendModal.editableExPax})` : ''}:</span><span>₹{calculatedDayPrice.exPaxCharge.toFixed(2)}</span></p>}
                {(calculatedDayPrice.childCharge || 0) > 0 && <p><span>Child Charge{dayExtendModal.editableChild > 0 ? ` (×${dayExtendModal.editableChild})` : ''}:</span><span>₹{calculatedDayPrice.childCharge.toFixed(2)}</span></p>}
                {(calculatedDayPrice.driverCharge || 0) > 0 && <p><span>Driver Charge{dayExtendModal.editableDriver > 0 ? ` (×${dayExtendModal.editableDriver})` : ''}:</span><span>₹{calculatedDayPrice.driverCharge.toFixed(2)}</span></p>}
                {(calculatedDayPrice.taxAmount || 0) > 0 && <p className="tax-text"><span>Tax{calculatedDayPrice.totalTaxPercent > 0 ? ` (${calculatedDayPrice.totalTaxPercent}%)` : ''}:</span><span>+₹{calculatedDayPrice.taxAmount.toFixed(2)}</span></p>}
                <p className="total-line"><span>Day Extension Total:</span><span>₹{calculatedDayPrice.totalPrice.toFixed(2)}</span></p>
                <p style={{ fontSize: '0.72rem', color: '#6c757d', marginTop: 4 }}><i className="fi fi-rr-info me-1" />Day extension uses room tariff only. Post charges & allowances are not included.</p>
              </div>
            )}
            <div className="d-flex gap-3 justify-content-center mt-4">
              <Button variant="danger" onClick={handleDayExtend} disabled={extendingDay} className="px-4 rounded">{extendingDay ? <><span className="spinner-border spinner-border-sm me-2"></span>Extending...</> : <><i className="fi fi-rr-check me-2"></i>Extend</>}</Button>
              <Button variant="secondary" onClick={() => { const occupiedItemSnapshot = dayExtendModal.occupiedItem; setDayExtendModal({ show: false, occupiedItem: null, editableExPax: 0, editableChild: 0, editableDriver: 0, extensionDays: 1, autoExtendSiblings: true }); setSiblingRooms([]); if (occupiedItemSnapshot) navigate('/hotel/room-detail', { state: { occupiedItem: occupiedItemSnapshot } }) }} disabled={extendingDay} className="px-4 rounded"><i className="fi fi-rr-cross me-2"></i>Cancel</Button>
            </div>
          </Modal.Body>
        </Modal>

        {/* Room Details Modal */}
        <Modal show={showRoomDetails} onHide={() => setShowRoomDetails(false)} centered size="sm" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          <Modal.Header closeButton className="border-0 pb-0"><Modal.Title>Room Details</Modal.Title></Modal.Header>
          <Modal.Body onClick={(e: React.MouseEvent) => e.stopPropagation()}>
            {selectedRoom && (
              <div>
                <div className="text-center mb-3"><div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: '60px', height: '60px' }}><i className="fi fi-rr-bed fs-4 text-primary"></i></div><h5 className="mb-1">{selectedRoom.number}</h5><span className="badge px-3 py-1" style={{ backgroundColor: getStatusBgColor(selectedRoom.status), color: getStatusTextColor(selectedRoom.status), border: `1px solid ${getStatusBorderColor(selectedRoom.status)}` }}>{getStatusText(selectedRoom.status)}</span></div>
                <div className="mb-3 small"><div className="d-flex justify-content-between mb-1"><span className="text-muted">Category:</span><span className="fw-semibold">{selectedRoom.category}</span></div><div className="d-flex justify-content-between mb-1"><span className="text-muted">Floor:</span><span className="fw-semibold">{selectedRoom.floor}</span></div></div>
                <div className="d-grid gap-2">
                  {selectedRoom.status === 'available' && <Button variant="success" disabled={updating} onClick={() => handleRoomStatusChange(selectedRoom.id, 'occupied')}><i className="fi fi-rr-check me-1"></i> Book Now</Button>}
                  {selectedRoom.status === 'occupied' && <Button variant="outline-danger" disabled={updating} onClick={() => handleRoomStatusChange(selectedRoom.id, 'cleaning')}><i className="fi fi-rr-door-open me-1"></i> Check Out</Button>}
                  {selectedRoom.status === 'cleaning' && <Button variant="warning" disabled={updating} onClick={() => handleRoomStatusChange(selectedRoom.id, 'available')}><i className="fi fi-rr-cleaning-bucket me-1"></i> Mark Clean</Button>}
                  {selectedRoom.status === 'reserved' && <Button variant="primary" disabled={updating} onClick={() => handleRoomStatusChange(selectedRoom.id, 'occupied')}><i className="fi fi-rr-user me-1"></i> Check In</Button>}
                  <Button variant="outline-secondary" onClick={() => setShowRoomDetails(false)}>Close</Button>
                </div>
              </div>
            )}
          </Modal.Body>
        </Modal>
        <DisplaySettings
          show={showSettings}
          onHide={() => setShowSettings(false)}
          uiSettings={uiSettings}
          onUiSettingsChange={setUiSettings}
          onSave={handleSaveSettings}
          savingSettings={savingSettings}
        />

        {/* Custom Context Menu */}
        {showContextMenu && contextMenuItem && (
          <div id="custom-context-menu" ref={contextMenuRef} style={{ position: 'fixed', top: contextMenuPos.y, left: contextMenuPos.x, backgroundColor: '#eeeeee', border: '1px solid #ccc', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', zIndex: 1050, minWidth: '200px', width: 'auto', padding: '4px 0', borderRadius: '4px' }} onClick={(e) => e.stopPropagation()}>
            {contextMenuOptions.map((option) => (
              <div key={option.label} style={{ padding: '6px 12px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'background-color 0.2s', whiteSpace: 'nowrap' }} onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')} onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')} onClick={() => {
                if (option.label === 'Amendments') navigate('/hotel/amendments', { state: { occupiedItem: contextMenuItem } })
                else if (option.label === 'Advance') { setSelectedOccupiedItem(contextMenuItem); setShowAdvanceModal(true) }
                else if (option.label === 'Post Charges') { setSelectedOccupiedItem(contextMenuItem); setPostChargesMode('charge'); setShowPostChargesModal(true) }
                else if (option.label === 'Allowances') { setSelectedOccupiedItem(contextMenuItem); setPostChargesMode('allowance'); setShowPostChargesModal(true) }
                else if (option.label === 'Receipt Against Posted Bills') { setSelectedOccupiedItem(contextMenuItem); setShowReceiptModal(true) }
                closeContextMenu()
              }}><i className={option.icon} style={{ fontSize: '0.85rem' }}></i><span>{option.label}</span></div>
            ))}
          </div>
        )}

        {/* Post Charges Modal */}
        {selectedOccupiedItem && <PostChargesModal show={showPostChargesModal} onHide={() => { setShowPostChargesModal(false); setSelectedOccupiedItem(null) }} roomNo={selectedOccupiedItem.room_no} guestName={selectedOccupiedItem.guest_name} checkinId={selectedOccupiedItem.checkin_id} detailId={selectedOccupiedItem.detail_id} roomId={selectedOccupiedItem.room_id} guestId={selectedOccupiedItem.checkin?.guest_id} hotelId={hotelId || 0} userId={user?.id} mode={postChargesMode} onSuccess={() => { fetchOccupiedRooms() }} existingCharges={[]} onChargesUpdated={() => { fetchOccupiedRooms() }} />}
        {/* Receipt Against Bills Modal */}
        {selectedOccupiedItem && <ReceiptAgainstBillsModal show={showReceiptModal} onHide={() => { setShowReceiptModal(false); setSelectedOccupiedItem(null) }} roomNo={selectedOccupiedItem.room_no} guestName={selectedOccupiedItem.guest_name} checkinId={selectedOccupiedItem.checkin_id} detailId={selectedOccupiedItem.detail_id} hotelId={hotelId || 0} userId={user?.id} onSuccess={() => { fetchOccupiedRooms() }} />}
        {/* Advance Modal */}
        {selectedOccupiedItem && <Advance show={showAdvanceModal} onHide={() => { setShowAdvanceModal(false); setSelectedOccupiedItem(null) }} roomNo={selectedOccupiedItem.room_no} guestName={selectedOccupiedItem.guest_name} checkinId={selectedOccupiedItem.checkin_id} detailId={selectedOccupiedItem.detail_id} hotelId={hotelId || 0} userId={user?.id} roomId={selectedOccupiedItem.room_id} onSuccess={() => { fetchOccupiedRooms() }} />}
        {/* Room Status Modal - Single Room */}
        <RoomStatusModal show={showRoomStatusModal} onHide={() => { setShowRoomStatusModal(false); setSelectedRoomForStatus(null) }} room={selectedRoomForStatus} hotelId={hotelId || 0} userId={user?.id} onSuccess={handleRoomStatusChangeSuccess} />
        {/* Room Status Modal - Multiple Rooms (bulk) */}
        <RoomStatusModal show={showMultiRoomStatusModal} onHide={() => setShowMultiRoomStatusModal(false)} room={null} rooms={enrichedRooms.filter((r) => selectedRoomIds.includes(r.id))} hotelId={hotelId || 0} userId={user?.id} onSuccess={async () => { setSelectedRoomIds([]); await handleRoomStatusChangeSuccess() }} />
        
      </div>
    </>
  )
}

export default HotelBookingPanel