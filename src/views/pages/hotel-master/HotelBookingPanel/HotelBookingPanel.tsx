import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {  Button, Dropdown } from 'react-bootstrap'
import { toast } from 'react-hot-toast'
import TitleHelmet from '@/components/Common/TitleHelmet'
import { useAuthContext } from '@/common/context/useAuthContext'
import RoomService from '@/common/hotel/room'
import hotelSettingsApi, { HotelUiSettings } from '@/common/hotel/hotelSettings'
import CheckInService, { CheckIn } from '@/common/hotel/checkIn'
import GuestRoomChargesService, { GuestRoomCharge } from '@/common/hotel/guestRoomCharges'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import BrandService from '@/common/hotel/brand'
import ReservationService from '@/common/hotel/reservation'
import AdvanceTransactionService from '@/common/hotel/advanceTransaction'
import PostChargesModal from './PostChargesModal'
import ReceiptAgainstBillsModal from './ReceiptAgainstBillsModal'
import Advance from './Advance'
import RoomStatusModal from './RoomStatusModal'
import DisplaySettings from './DisplaySettings'
import DayExtendModal from './DayExtendModal'
import { OccupiedRoomItem } from '@/types/room'
import { fetchOccupiedRooms } from '@/utils/commonfunction'
import SettlementPage from './SettlementPage'
import ArrivalsPage from './Arrivals'
import AtGlancePage from './AtGlancePage'
import ReservationFormPage from './HotelReservation'
import ReservationSummaryPage from './ReservationSummary'
import ReservationPage from './ReservationPage'  // ✅ Add this import

// ==================== CONSTANTS ====================

const DEFAULT_UI: Omit<HotelUiSettings, 'hotelid'> = {
  show_left_category: true,
  show_room_text: true,
  room_box_size: 2,
  color_vacant: '#ffffff',
  color_occupied: '#DFF5E1',
  color_cleaning: '#FFF4CC',
  color_bill: '#f59999',
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
}

// ==================== TYPES ====================

type RoomStatus =
  | 'available'
  | 'occupied'
  | 'cleaning'
  | 'Bill'
  | 'reserved'
  | 'maintenance'
  | 'reservation'

type ViewMode = 'floor' | 'category'
type ActiveSection = 'checkout' | null
type HousekeepingTab = 'all' | 'dirty' | 'block' | 'maint' | null

// Status IDs for filtering
const STATUS_IDS = {
  VACANT: [1],
  OCCUPIED: [2, 7],
  CLEANING: [4],
  RESERVED: [6],
  MAINTENANCE: [3, 5],
  BLOCK: [3, 4, 5, 6],
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
  status_name?: string
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

interface Room {
  id: number
  number: string
  category: string
  status: RoomStatus
  floor: string
  floor_id: number
  room_category_id: number
  rawData: ApiRoom
  backgroundColor: string
  textColor: string
  borderColor: string
  statusName: string
}

interface FloorGroup {
  id: number
  name: string
  rooms: Room[]
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

interface ContextMenuOption {
  label: string
  icon?: string
}

// ==================== HELPERS ====================

const isVacant = (room: Room): boolean => {
  const statusId = room.rawData?.room_status_id || 1
  return STATUS_IDS.VACANT.includes(statusId)
}

const isOccupied = (room: Room): boolean => {
  const statusId = room.rawData?.room_status_id || 1
  return STATUS_IDS.OCCUPIED.includes(statusId)
}

const isCleaning = (room: Room): boolean => {
  const statusId = room.rawData?.room_status_id || 1
  return STATUS_IDS.CLEANING.includes(statusId)
}

const isReserved = (room: Room): boolean => {
  const statusId = room.rawData?.room_status_id || 1
  return STATUS_IDS.RESERVED.includes(statusId)
}

const isMaintenance = (room: Room): boolean => {
  const statusId = room.rawData?.room_status_id || 1
  return STATUS_IDS.MAINTENANCE.includes(statusId)
}

const getContrastColor = (hexColor: string): string => {
  if (!hexColor) return '#000000'
  const hex = hexColor.replace('#', '')
  if (hex.length !== 6) return '#000000'
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const brightness = (r * 299 + g * 587 + b * 114) / 1000
  return brightness > 128 ? '#000000' : '#ffffff'
}

const toRoom = (
  apiRoom: ApiRoom,
  floorMap: Map<number, string>,
  categoryMap: Map<number, string>,
): Room => {
  const statusId = apiRoom.room_status_id || 1
  
  let status: RoomStatus
  switch (statusId) {
    case 1: status = 'available'; break
    case 2: status = 'occupied'; break
    case 3: status = 'maintenance'; break
    case 4: status = 'cleaning'; break
    case 5: status = 'maintenance'; break
    case 6: status = 'reserved'; break
    case 7: status = 'Bill'; break
    default: status = 'available'
  }
  
  const bgColor = apiRoom.status_color || '#ffffff'
  
  return {
    id: apiRoom.room_id,
    number: apiRoom.room_no,
    category: categoryMap.get(apiRoom.room_category_id) || 'Uncategorized',
    status: status,
    floor: floorMap.get(apiRoom.floor_id) || `Floor ${apiRoom.floor_id}`,
    floor_id: apiRoom.floor_id,
    room_category_id: apiRoom.room_category_id,
    rawData: apiRoom,
    backgroundColor: bgColor,
    textColor: getContrastColor(bgColor),
    borderColor: bgColor,
    statusName: apiRoom.status_name || 'Unknown',
  }
}

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

const getLocalYMD = (d: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const getMinutesLeft = (checkoutDatetime: string): number => {
  if (!checkoutDatetime) return 999
  const diffMs = new Date(checkoutDatetime).getTime() - Date.now()
  return Math.floor(diffMs / 60000)
}

const formatAmount = (amt: number): string => {
  const n = Number(amt)
  if (!isFinite(n)) return 'Rs.0.00/-'
  const sign = n < 0 ? '-' : ''
  return `Rs.${sign}${Math.abs(n).toFixed(2)}/-`
}

const CONTEXT_MENU_OPTIONS: ContextMenuOption[] = [
  { label: 'Amendments', icon: 'fi fi-rr-document' },
  { label: 'Advance', icon: 'fi fi-rr-receipt' },
  { label: 'Post Charges', icon: 'fi fi-rr-credit-card' },
  { label: 'Allowances', icon: 'fi fi-rr-gift' },
  { label: 'Receipt Against Posted Bills', icon: 'fi fi-rr-document' },
]

// ==================== COMPONENT ====================

const HotelBookingPanel = () => {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const hotelId = user?.hotelid

  // --- Data ---
  const [rawRooms, setRawRooms] = useState<ApiRoom[]>([])
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [floors, setFloors] = useState<{ floor_id: number; floor_name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hotelName, setHotelName] = useState('')

  // --- UI state ---
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<RoomStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [floorFilter, setFloorFilter] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('floor')
  const [selectedRoomIds, setSelectedRoomIds] = useState<number[]>([])
  const [, setShowRoomDetails] = useState(false)
  const [, setSelectedRoom] = useState<Room | null>(null)
  const [activeSection, setActiveSection] = useState<ActiveSection>(null)
  const [showSettlementPage, setShowSettlementPage] = useState(false)
  const [showArrivals, setShowArrivals] = useState(false)
  const [showAtGlance, setShowAtGlance] = useState(false)
  const [showReservationForm, setShowReservationForm] = useState(false)
  const [showReservationSummary, setShowReservationSummary] = useState(false)
  const [showReservationPage, setShowReservationPage] = useState(false)  // ✅ Add this state


  const [activeHousekeepingTab, setActiveHousekeepingTab] = useState<HousekeepingTab>(null)
  const [selectedHousekeepingRoomIds, setSelectedHousekeepingRoomIds] = useState<number[]>([])
  const [todayReservationCount, setTodayReservationCount] = useState(0)

  // --- Settings ---
  const [uiSettings, setUiSettings] = useState<HotelUiSettings>({
    hotelid: hotelId || 0,
    ...DEFAULT_UI,
  })
  const [showSettings, setShowSettings] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)

  // --- Occupied rooms ---
  const [occupiedRooms, setOccupiedRooms] = useState<OccupiedRoomItem[]>([])
  const [loadingOccupied, setLoadingOccupied] = useState(false)
  const [errorOccupied, setErrorOccupied] = useState<string | null>(null)

  // --- Checkout alert ---
  const [checkoutAlertData, setCheckoutAlertData] = useState<CheckoutAlertItem[]>([])
  const [loadingCheckoutAlert, setLoadingCheckoutAlert] = useState(false)
  const [errorCheckoutAlert, setErrorCheckoutAlert] = useState<string | null>(null)

  // --- Context menu ---
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })
  const [contextMenuItem, setContextMenuItem] = useState<OccupiedRoomItem | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const tileClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // --- Day extend ---
  const [extendDayModal, setExtendDayModal] = useState<{
    show: boolean
    occupiedItem: OccupiedRoomItem | null
    siblingRooms: OccupiedRoomItem[]
    room: { id: number; number: string } | null
    checkin: any | null
    loading?: boolean
  }>({ 
    show: false, 
    occupiedItem: null, 
    siblingRooms: [],
    room: null,
    checkin: null,
    loading: false
  })

  // --- Modal states ---
  const [showPostChargesModal, setShowPostChargesModal] = useState(false)
  const [postChargesMode, setPostChargesMode] = useState<'charge' | 'allowance'>('charge')
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [showAdvanceModal, setShowAdvanceModal] = useState(false)
  const [selectedOccupiedItem, setSelectedOccupiedItem] = useState<OccupiedRoomItem | null>(null)
  const [showRoomStatusModal, setShowRoomStatusModal] = useState(false)
  const [selectedRoomForStatus, setSelectedRoomForStatus] = useState<{
    id: number
    number: string
    category: string
    floor: string
    status: RoomStatus
  } | null>(null)
  const [showMultiRoomStatusModal, setShowMultiRoomStatusModal] = useState(false)

  // Refs for housekeeping scroll
  const dirtyScrollRef = useRef<HTMLDivElement | null>(null)
  const blockScrollRef = useRef<HTMLDivElement | null>(null)
  const maintScrollRef = useRef<HTMLDivElement | null>(null)

  // ==================== DERIVED STATE ====================

  const floorMap = useMemo(
    () => new Map(floors.map((f) => [f.floor_id, f.floor_name])),
    [floors],
  )

  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.room_category_id, c.category_name])),
    [categories],
  )

  const rooms: Room[] = useMemo(
    () => rawRooms.map((r) => toRoom(r, floorMap, categoryMap)),
    [rawRooms, floorMap, categoryMap],
  )

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesSearch =
        searchQuery === '' ||
        room.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.category.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = typeFilter === 'all' || room.category === typeFilter
      const matchesFloor = floorFilter === 'all' || room.floor === floorFilter
      
      let matchesStatus = true
      if (statusFilter === 'available') {
        matchesStatus = isVacant(room)
      } else if (statusFilter === 'occupied') {
        matchesStatus = isOccupied(room) || room.status === 'Bill'
      } else if (statusFilter === 'cleaning') {
        matchesStatus = isCleaning(room)
      } else if (statusFilter === 'reserved') {
        matchesStatus = isReserved(room)
      } else if (statusFilter === 'maintenance') {
        matchesStatus = isMaintenance(room)
      } else if (statusFilter === 'reservation' || statusFilter === 'Bill') {
        matchesStatus = room.status === statusFilter
      } else if (statusFilter === 'all') {
        matchesStatus = true
      }
      
      return matchesSearch && matchesType && matchesFloor && matchesStatus
    })
  }, [rooms, searchQuery, typeFilter, floorFilter, statusFilter])

  const stats = useMemo(() => {
    const base = rooms.filter((room) => {
      const matchesSearch =
        searchQuery === '' ||
        room.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        room.category.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = typeFilter === 'all' || room.category === typeFilter
      const matchesFloor = floorFilter === 'all' || room.floor === floorFilter
      return matchesSearch && matchesType && matchesFloor
    })
    return {
      total: base.length,
      available: base.filter((r) => isVacant(r)).length,
      occupied: base.filter((r) => isOccupied(r) || r.status === 'Bill').length,
      cleaning: base.filter((r) => isCleaning(r)).length,
      bill: base.filter((r) => r.status === 'Bill').length,
      reserved: base.filter((r) => isReserved(r)).length,
      maintenance: base.filter((r) => isMaintenance(r)).length,
      reservation: base.filter((r) => r.status === 'reservation').length,
    }
  }, [rooms, searchQuery, typeFilter, floorFilter])

  const groupedByFloor: FloorGroup[] = useMemo(() => {
    const map = new Map<number, Room[]>()
    filteredRooms.forEach((room) => {
      if (!map.has(room.floor_id)) map.set(room.floor_id, [])
      map.get(room.floor_id)!.push(room)
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([id, rs]) => ({
        id,
        name: floorMap.get(id) || '',
        rooms: rs.sort((a, b) => a.number.localeCompare(b.number)),
      }))
  }, [filteredRooms, floorMap])

  const groupedByCategory: FloorGroup[] = useMemo(() => {
    const map = new Map<number, Room[]>()
    filteredRooms.forEach((room) => {
      if (!map.has(room.room_category_id)) map.set(room.room_category_id, [])
      map.get(room.room_category_id)!.push(room)
    })
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([id, rs]) => ({
        id,
        name: categoryMap.get(id) || 'Uncategorized',
        rooms: rs.sort((a, b) => a.number.localeCompare(b.number)),
      }))
  }, [filteredRooms, categoryMap])

  const activeGroups = viewMode === 'floor' ? groupedByFloor : groupedByCategory

  const housekeepingRoomsForTab = useMemo(() => {
    if (!activeHousekeepingTab) return []
    
    if (activeHousekeepingTab === 'all') {
      return rooms.filter((r) => {
        const statusId = r.rawData?.room_status_id || 1
        return [3, 4, 5, 6].includes(statusId)
      })
    }
    
    if (activeHousekeepingTab === 'dirty') {
      return rooms.filter((r) => {
        const statusId = r.rawData?.room_status_id || 1
        return statusId === 4
      })
    }
    
    if (activeHousekeepingTab === 'block') {
      return rooms.filter((r) => {
        const statusId = r.rawData?.room_status_id || 1
        return statusId === 6
      })
    }
    
    if (activeHousekeepingTab === 'maint') {
      return rooms.filter((r) => {
        const statusId = r.rawData?.room_status_id || 1
        return statusId === 3 || statusId === 5
      })
    }
    
    return []
  }, [activeHousekeepingTab, rooms])

  const boxSizeClass = useMemo(() => `size${uiSettings.room_box_size}`, [uiSettings.room_box_size])
  const showSubtext = useMemo(
    () => uiSettings.room_box_size > 1 && uiSettings.show_room_text,
    [uiSettings.room_box_size, uiSettings.show_room_text],
  )

  const showCheckoutAlertTable = activeSection === 'checkout'

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (!hotelId) return
    const run = async () => {
      try {
        if (user?.hotel_name) {
          setHotelName(user.hotel_name)
        } else {
          const res = await BrandService.getBrandById(String(hotelId))
          setHotelName((res?.data || res)?.hotel_name || 'Hotel')
        }
      } catch {
        setHotelName('Hotel')
      }
    }
    run()
  }, [hotelId, user])

  useEffect(() => {
    if (!hotelId) return
    const run = async () => {
      try {
        const res = await hotelSettingsApi.get(hotelId)
        if (res.success && res.data) setUiSettings((prev) => ({ ...prev, ...res.data }))
      } catch {
        console.error('Failed to load UI settings')
      }
    }
    run()
  }, [hotelId])

  useEffect(() => {
    document.body.classList.toggle('dark-mode', uiSettings.dark_mode)
  }, [uiSettings.dark_mode])

  const fetchHotelBookingMetaData = useCallback(async () => {
    if (!hotelId) {
      setError('No hotel selected')
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const response = await RoomService.getHotelBookingMeta(hotelId)
      const meta = response?.data || {}
      
      setRawRooms(meta?.rooms || [])
      setCategories(meta?.categories || [])
      setFloors(meta?.floors || [])
    } catch (error) {
      console.error('Failed to load room data:', error)
      setError('Failed to load room data')
    } finally {
      setLoading(false)
    }
  }, [hotelId])

  useEffect(() => {
    fetchHotelBookingMetaData()
  }, [fetchHotelBookingMetaData])

  useEffect(() => {
    if (showCheckoutAlertTable && hotelId) fetchTodayCheckouts()
  }, [showCheckoutAlertTable, hotelId])

  useEffect(() => {
    if (!hotelId) return
    const run = async () => {
      try {
        const res = await ReservationService.list({ hotelid: hotelId })
        const todayStr = new Date().toISOString().slice(0, 10)
        setTodayReservationCount(
          (res.data || []).filter(
            (r: any) => String(r.arrival_date || '').slice(0, 10) === todayStr,
          ).length,
        )
      } catch {
        console.error('Failed to fetch reservation count')
      }
    }
    run()
  }, [hotelId])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F9') { e.preventDefault(); handleCheckInClick() }
      if (e.key === 'Escape') { e.preventDefault(); navigate(-1) }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedRoomIds])

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

  // ==================== DATA FETCHING ====================

  const fetchTodayCheckouts = async () => {
    if (!hotelId) return
    setLoadingCheckoutAlert(true)
    try {
      const checkinsRes = await CheckInService.list({ hotelid: hotelId })
      const activeCheckins = (checkinsRes.data || []).filter((c: CheckIn) => c.status === 'active')
      const todayStr = getLocalYMD(new Date())
      const allItems: CheckoutAlertItem[] = []

      for (const checkin of activeCheckins) {
        try {
          const charges = (await GuestRoomChargesService.list({ checkin_id: checkin.checkin_id })).data || []
          const advRoomMap = new Map<number, number>()

          try {
            const txns = (await AdvanceTransactionService.list({ checkin_id: checkin.checkin_id })).data || []
            const roomCredits = new Map<number, number>()
            const roomDebits = new Map<number, number>()
            let globalCredits = 0, globalDebits = 0

            txns.forEach((t: any) => {
              if (t.status !== 'active') return
              const rid = t.room_id
              const isCredit = t.transaction_type === 'Booking Receipt' || t.transaction_type === 'Advance Addition'
              const isDebit = t.transaction_type === 'Advance Posting' || t.transaction_type === 'Advance Refund'
              if (!rid) {
                if (isCredit) globalCredits += Number(t.credit_amount) || 0
                if (isDebit) globalDebits += Number(t.debit_amount) || 0
              } else {
                if (isCredit) roomCredits.set(rid, (roomCredits.get(rid) || 0) + (Number(t.credit_amount) || 0))
                if (isDebit) roomDebits.set(rid, (roomDebits.get(rid) || 0) + (Number(t.debit_amount) || 0))
              }
            })

            for (const [rid, credit] of roomCredits) {
              advRoomMap.set(rid, credit - (roomDebits.get(rid) || 0))
            }
            if (advRoomMap.size === 0 && (globalCredits > 0 || globalDebits > 0)) {
              advRoomMap.set(0, globalCredits - globalDebits)
            }
          } catch { /* ignore */ }

          const chargesByRoom = new Map<number, GuestRoomCharge[]>()
          charges.forEach((c: GuestRoomCharge) => {
            if (c.room_id) {
              if (!chargesByRoom.has(c.room_id)) chargesByRoom.set(c.room_id, [])
              chargesByRoom.get(c.room_id)!.push(c)
            }
          })

          for (const [roomId, roomCharges] of chargesByRoom) {
            const regular = roomCharges.filter((c) => c.category_id != null)
            const latest = [...regular].sort(
              (a, b) => new Date(b.checkout_datetime || 0).getTime() - new Date(a.checkout_datetime || 0).getTime(),
            )[0]

            if (latest?.checkout_datetime && getLocalYMD(new Date(latest.checkout_datetime)) === todayStr) {
              const room = rawRooms.find((r) => r.room_id === roomId)
              const totalCharges = roomCharges.reduce((s, c) => s + (Number(c.total_amount) || 0), 0)
              const hasRoomSpecific = [...advRoomMap.keys()].some((k) => k !== 0)
              const advance = hasRoomSpecific ? advRoomMap.get(roomId) || 0 : advRoomMap.get(0) || 0

              allItems.push({
                srNo: 0,
                roomNo: room?.room_no || `Room ${roomId}`,
                guestName: checkin.guest_name,
                category: checkin.converted_category || '',
                pax: checkin.pax || 0,
                adults: checkin.adults || 0,
                exPax: checkin.ex_pax || 0,
                child: (checkin.child_paid || 0) + (checkin.child_unpaid || 0),
                driver: Number(checkin.driver) || 0,
                checkinDatetime: checkin.checkin_datetime,
                checkoutDatetime: latest.checkout_datetime,
                totalPrice: latest.total_amount || 0,
                minutesLeft: getMinutesLeft(latest.checkout_datetime),
                totalNights: checkin.total_nights,
                totalAmount: totalCharges - advance,
                regNo: checkin.reg_no,
                booking: checkin.booking,
                planName: checkin.plan_name,
                status: checkin.status,
              })
            }
          }
        } catch (err) {
          console.warn(`Failed to fetch charges for checkin ${checkin.checkin_id}`, err)
        }
      }

      const now = Date.now()
      allItems.sort((a, b) => {
        const aTime = new Date(a.checkoutDatetime).getTime()
        const bTime = new Date(b.checkoutDatetime).getTime()
        const aExp = aTime < now, bExp = bTime < now
        if (aExp && !bExp) return -1
        if (!aExp && bExp) return 1
        return aTime - bTime
      })
      allItems.forEach((item, i) => { item.srNo = i + 1 })
      setCheckoutAlertData(allItems)
    } catch (err) {
      console.error("Failed to fetch today's checkouts:", err)
      setErrorCheckoutAlert("Could not load today's checkouts")
    } finally {
      setLoadingCheckoutAlert(false)
    }
  }

  const fetchOccupiedRoomsData = useCallback(() => {
    if (hotelId) {
      fetchOccupiedRooms(
        Number(hotelId),
        getMinutesLeft,
        setOccupiedRooms,
        setLoadingOccupied,
        setErrorOccupied
      )
    }
  }, [hotelId])

  useEffect(() => {
    if (statusFilter === 'occupied' && hotelId) {
      fetchOccupiedRoomsData()
    }
  }, [statusFilter, hotelId, fetchOccupiedRoomsData])

  // ==================== EXTEND ROOM ====================

  const handleExtendDay = async () => {
    if (!extendDayModal.room || !extendDayModal.checkin) return

    const { room, checkin } = extendDayModal

    setExtendDayModal((prev) => ({ ...prev, loading: true }))

    try {
      const checkinId = checkin.checkin_id
      const clickedRoomId = room.id

      if (!checkinId || !clickedRoomId) {
        toast.error('Missing checkin or room information')
        return
      }

      const allRoomIdsForCheckin = Array.from(
        new Set(
          occupiedRooms
            .filter((c: any) => String(c.checkin_id) === String(checkinId))
            .map((c: any) => c.room_id ?? c.charge_room_id)
            .filter(Boolean)
            .map(Number)
        )
      )

      const roomIdsToExtend =
        allRoomIdsForCheckin.length > 0 ? allRoomIdsForCheckin : [clickedRoomId]

      if (!roomIdsToExtend.includes(clickedRoomId)) {
        roomIdsToExtend.push(clickedRoomId)
      }

      let anySuccess = false
      for (const roomId of roomIdsToExtend) {
        const response = await CheckInService.extendDay(checkinId, {
          roomId: roomId,
          extensionDays: 1,
        })
        if (response.success) {
          anySuccess = true
        } else {
          console.warn(`Failed to extend room ${roomId}:`, response.message)
        }
      }

      if (anySuccess) {
        const roomCount = roomIdsToExtend.length
        toast.success(
          roomCount > 1
            ? `All ${roomCount} rooms extended by 1 day successfully`
            : `Room ${room.number} extended by 1 day successfully`
        )

        await fetchHotelBookingMetaData()
        await fetchOccupiedRoomsData()

        setExtendDayModal({
          show: false,
          occupiedItem: null,
          siblingRooms: [],
          room: null,
          checkin: null,
          loading: false,
        })
      } else {
        toast.error('Failed to extend stay')
      }
    } catch (error) {
      console.error('Error extending day:', error)
      toast.error('Failed to extend stay. Please try again.')
    } finally {
      setExtendDayModal((prev) => ({ ...prev, loading: false }))
    }
  }

  // ==================== EVENT HANDLERS ====================

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
        const { width, height } = contextMenuRef.current.getBoundingClientRect()
        const vw = window.innerWidth, vh = window.innerHeight
        const left = Math.max(0, Math.min(e.clientX, vw - width))
        const top = Math.max(0, Math.min(e.clientY, vh - height))
        setContextMenuPos({ x: left, y: top })
      }
    }, 0)
  }

  const handleOccupiedRoomClick = (item: OccupiedRoomItem) => {
    if (item.isExpired) {
      const siblings = occupiedRooms.filter(
        (r) => r.checkin_id === item.checkin_id && r.detail_id !== item.detail_id,
      )
      setExtendDayModal({ 
        show: true, 
        occupiedItem: item, 
        siblingRooms: siblings,
        room: item.room_id && item.room_no ? { id: item.room_id, number: item.room_no } : null,
        checkin: item.checkin || null,
        loading: false
      })
      return
    }
    navigate('/hotel/room-detail', { state: { occupiedItem: item } })
  }

  const handleRoomTileClick = (room: Room) => {
    if (tileClickTimerRef.current) return
    tileClickTimerRef.current = setTimeout(() => {
      tileClickTimerRef.current = null
      if (isOccupied(room)) {
        const occupiedItem = occupiedRooms.find((item) => item.room_no === room.number)
        if (occupiedItem) handleOccupiedRoomClick(occupiedItem)
        else { setSelectedRoom(room); setShowRoomDetails(true) }
      }
    }, 250)
  }

  const handleRoomStatusChangeRequest = (room: Room) => {
    setSelectedRoomForStatus({ id: room.id, number: room.number, category: room.category, floor: room.floor, status: room.status })
    setShowRoomStatusModal(true)
  }

  const handleCheckInClick = () => {
    if (selectedRoomIds.length === 0) {
      toast.error('Please select at least one room to check in.')
      return
    }
    const selectedRoomsList = rooms
      .filter((r) => selectedRoomIds.includes(r.id))
      .map((r) => ({ roomId: r.id, roomNumber: r.number, roomCategoryName: r.category }))
    navigate('/hotel/checkin', { state: { rooms: selectedRoomsList, hotelId } })
  }

  const toggleRoomSelection = (roomId: number) => {
    const room = rooms.find((r) => r.id === roomId)
    if (room && !isVacant(room)) {
      toast.error('Only vacant rooms can be selected for check-in.')
      return
    }
    setSelectedRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId],
    )
  }

  const isRoomSelected = (roomId: number) => selectedRoomIds.includes(roomId)

  const resetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setTypeFilter('all')
    setFloorFilter('all')
  }

  const handleStatusFilterClick = (filter: RoomStatus | 'all') => {
    setStatusFilter(filter)
    setActiveSection(null)
    
    setShowSettlementPage(false)
    setShowArrivals(false)
    setShowAtGlance(false)
    setShowReservationForm(false)
    setShowReservationSummary(false)
    setShowReservationPage(false)  // ✅ Add this line
    
    if (!['cleaning', 'reserved', 'maintenance'].includes(filter)) {
      setActiveHousekeepingTab(null)
      setSelectedHousekeepingRoomIds([])
    }
  }

  const handleHousekeepingTabClick = (tab: HousekeepingTab) => {
    if (tab === null || activeHousekeepingTab === tab) {
      setActiveHousekeepingTab(null)
      setSelectedHousekeepingRoomIds([])
    } else {
      setActiveHousekeepingTab(tab)
      setSelectedHousekeepingRoomIds([])
    }
  }

  const handleSaveSettings = async () => {
    if (!hotelId) return
    setSavingSettings(true)
    try {
      const res = await hotelSettingsApi.update({ ...uiSettings, hotelid: hotelId, updated_by_id: user?.id })
      if (res.success) { toast.success('Settings saved'); setShowSettings(false) }
      else toast.error(res.message || 'Failed to save settings')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSavingSettings(false)
    }
  }

  const toggleHousekeepingRoomSelection = (roomId: number) => {
    setSelectedHousekeepingRoomIds((prev) =>
      prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [...prev, roomId],
    )
  }

  const handleSelectAllHousekeepingForSection = (roomIds: number[]) => {
    setSelectedHousekeepingRoomIds((prev) => [...new Set([...prev, ...roomIds])])
  }

  const handleRemoveSelectionForSection = async (roomIds: number[]) => {
    const toVacate = roomIds.filter((id) => selectedHousekeepingRoomIds.includes(id))
    if (toVacate.length === 0) {
      toast.error('No rooms selected. Please select rooms first.')
      return
    }
    try {
      for (const roomId of toVacate) {
        const room = rooms.find((r) => r.id === roomId)
        if (room) {
          await RoomService.update(roomId, { 
            ...room.rawData, 
            room_status_id: 1, 
            room_status: 'available', 
            updated_by_id: user?.id 
          })
        }
      }
      setRawRooms((prev) =>
        prev.map((r) => toVacate.includes(r.room_id) ? { ...r, room_status_id: 1, room_status: 'available' } : r),
      )
      setSelectedHousekeepingRoomIds((prev) => prev.filter((id) => !toVacate.includes(id)))
      toast.success(`${toVacate.length} room(s) marked as Vacant.`)
    } catch (err) {
      console.error('Failed to make rooms vacant:', err)
      toast.error('Failed to update room status.')
    }
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
        'Total Days': item.totalNights ?? '-',
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

  const exportTableToPdf = async (selector: string, title: string, filename: string) => {
    const table = document.querySelector(selector)
    if (!table) { toast.error('No table found'); return }
    try {
      const hotel = hotelName || 'Hotel'
      const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      const wrapper = document.createElement('div')
      wrapper.style.cssText = 'background:#fff;padding:20px;width:1400px;margin:auto;font-family:Arial,sans-serif;'
      const style = document.createElement('style')
      style.textContent = `table{width:100%;border-collapse:collapse;font-size:0.7rem;}th,td{border:1px solid #ccc;padding:4px 6px;text-align:left;}thead tr{background-color:#dfdfdf;font-weight:600;}tfoot tr{background-color:#f8f9fa;font-weight:600;}.report-header{margin-bottom:16px;}.hotel-name-row{font-size:18px;font-weight:bold;margin-bottom:6px;}.report-subheader{font-size:13px;color:#555;}`
      wrapper.appendChild(style)
      const headerDiv = document.createElement('div')
      headerDiv.className = 'report-header'
      headerDiv.innerHTML = `<div class="hotel-name-row">Hotel name: ${hotel}</div><div class="report-subheader">${title} — ${dateStr}</div>`
      wrapper.appendChild(headerDiv)
      wrapper.appendChild(table.cloneNode(true) as HTMLElement)
      document.body.appendChild(wrapper)
      const canvas = await html2canvas(wrapper, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      document.body.removeChild(wrapper)
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const imgWidth = 280
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, imgWidth, (canvas.height * imgWidth) / canvas.width)
      pdf.save(filename)
    } catch (err) {
      console.error(err)
      toast.error('PDF generation failed')
    }
  }

  const handlePrintTable = (selector: string, title: string) => {
    const tableElement = document.querySelector(selector)
    if (!tableElement) { toast.error('No table to print'); return }
    const printWindow = window.open('', '_blank')
    if (!printWindow) { toast.error('Please allow pop-ups to print'); return }
    const hotel = hotelName || 'Hotel'
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    printWindow.document.write(`<html><head><title>${hotel} - ${title}</title><style>body{font-family:Arial,sans-serif;margin:20px;}.hotel-name-row{font-size:18px;font-weight:bold;margin-bottom:6px;}.report-subheader{font-size:13px;color:#555;margin-bottom:16px;}table{width:100%;border-collapse:collapse;font-size:0.75rem;}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;}th{background-color:#f2f2f2;font-weight:600;}</style></head><body><div class="hotel-name-row">Hotel name: ${hotel}</div><div class="report-subheader">${title} — ${dateStr}</div>${tableElement.outerHTML}</body></html>`)
    printWindow.document.close()
    printWindow.print()
  }

  // ==================== LOADING / ERROR STATES ====================

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
        <Button variant="outline-primary" onClick={() => window.location.reload()}>Retry</Button>
        <Button variant="outline-secondary" className="mt-2" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    )
  }

  // ==================== RENDER ====================

  return (
    <>
      <TitleHelmet title="Room Management" />
      <style>{`
        .room-tile {
          position: relative; cursor: pointer; display: flex; flex-direction: column;
          align-items: stretch; justify-content: flex-start; padding: 0;
          transition: transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out; overflow: hidden;
        }
        .room-tile:hover { transform: scale(1.02); box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 5; }
        .room-tile-size1 { width: 60px !important; min-height: 40px !important; font-size: 0.7rem; }
        .room-tile-size1 .small { display: none !important; }
        .room-tile-size2 { width: 75px !important; min-height: 50px !important; font-size: 0.75rem; }
        .room-tile-size3 { width: 90px !important; min-height: 60px !important; font-size: 0.8rem; }
        .room-tile-size4 { width: 105px !important; min-height: 70px !important; font-size: 0.85rem; }
        .room-tile-size5 { width: 120px !important; min-height: 80px !important; font-size: 0.9rem; }
        .room-tile-size6 { width: 135px !important; min-height: 90px !important; font-size: 0.95rem; }
        .room-checkbox {
          position: absolute; top: 4px; left: 4px; width: 16px; height: 16px;
          cursor: pointer; z-index: 2;
        }
        .room-checkbox:disabled { cursor: not-allowed; opacity: 0.5; }

        .occupied-tile {
          height: auto !important; min-height: 110px; font-size: 0.72rem; line-height: 1.3;
          display: flex; flex-direction: column; padding: 0;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1); transition: all 0.2s ease-in-out; cursor: pointer;
        }
        .occupied-tile:hover { transform: scale(1.02); box-shadow: 0 4px 12px rgba(0,0,0,0.2); z-index: 10; }
        @keyframes pulseWarning {
          0%   { background-color: #b96eff; box-shadow: 0 0 0 0 rgba(185,110,255,0.7); }
          30%  { background-color: #b96eff; box-shadow: 0 0 0 6px rgba(185,110,255,0); }
          70%  { background-color: #a04bff; box-shadow: 0 0 0 6px rgba(185,110,255,0); }
          100% { background-color: #b96eff; box-shadow: 0 0 0 0 rgba(185,110,255,0); }
        }
        .occupied-tile-checkout-near { animation: pulseWarning 2s infinite; }
        .occupied-header { background: #000; color: #fff; font-weight: 600; padding: 2px 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .occupied-body { padding: 4px 6px; flex: 1; }
        .occupied-body div { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .occupied-body .charges-line {
          border-top: 1px dotted #888; padding-top: 2px; margin-top: 2px;
          display: flex; justify-content: space-between; align-items: center; gap: 4px;
          white-space: nowrap; overflow: hidden;
        }
        .occupied-body .charges-line span { font-size: 0.68rem; }
        .occupied-body .charges-line span:last-child { font-weight: 700; }

        .checkout-table { width: 100%; border-collapse: collapse; font-size: 0.70rem; }
        .checkout-table th { position: sticky; top: 0; background-color: #dfdfdf; font-weight: 550; z-index: 10; padding: 0.35rem; }
        .checkout-table td { border: 1px solid #dee2e6; padding: 0.35rem; text-align: left; }
        body.dark-mode th { background-color: #2c2c2c; color: #eee; }
        body.dark-mode .checkout-table td { border-color: #444; }
        .text-red { color: red !important; font-weight: bold; }

        .housekeeping-section { border: 1px solid #e0e0e0; margin-bottom: 0.3rem; background-color: #fff; }
        .housekeeping-section-header {
          background-color: #f8f9fa; padding: 0.3rem 0.5rem; font-weight: 500;
          font-size: 0.78rem; border-bottom: 1px solid #e0e0e0;
          display: flex; align-items: center; justify-content: space-between;
        }
        .housekeeping-section-header-left { display: flex; align-items: center; gap: 0.5rem; }
        
        .hk-rooms-body {
          padding: 0.4rem 0.5rem; 
          height: 130px; 
          min-height: 130px; 
          max-height: 130px;
          display: flex; 
          flex-wrap: wrap; 
          gap: 0.3rem; 
          overflow-x: hidden; 
          overflow-y: auto;
          align-content: flex-start; 
          scrollbar-width: thin; 
          scrollbar-color: #c8c8c8 #f1f1f1;
        }
        .hk-rooms-body::-webkit-scrollbar { 
          width: 5px; 
          display: block !important; 
        }
        .hk-rooms-body::-webkit-scrollbar-track { 
          background: #f1f1f1; 
          border-radius: 4px; 
        }
        .hk-rooms-body::-webkit-scrollbar-thumb { 
          background: #c8c8c8; 
          border-radius: 4px; 
        }
        .hk-rooms-grid-col { display: contents; }

        .hk-room-card {
          width: 83px; 
          height: 50px; 
          cursor: pointer; 
          display: flex; 
          flex-direction: column; 
          align-items: center;
          justify-content: center; 
          gap: 2px; 
          padding: 4px 6px; 
          transition: all 0.15s ease; 
          position: relative;
        }
        .hk-room-card .hk-checkbox { 
          position: absolute; 
          top: 5px; 
          left: 6px; 
          width: 13px; 
          height: 13px; 
          cursor: pointer; 
        }
        .hk-room-card .room-number { 
          font-weight: 700; 
          font-size: 0.9rem; 
          line-height: 1.1; 
          text-align: center; 
          margin-top: 4px; 
        }
        .hk-room-card .room-category { 
          font-size: 0.65rem; 
          font-weight: 500; 
          text-align: center; 
          white-space: nowrap; 
          overflow: hidden; 
          text-overflow: ellipsis; 
          max-width: 80px; 
        }

        .dirty-room-card {
          border: 1.5px solid #FACC15; 
          background: #FFF4CC;
        }
        .dirty-room-card:hover { border-color: #D4A017; box-shadow: 0 2px 8px rgba(212,160,23,0.3); }
        .dirty-room-card.selected { border-color: #D4A017; background: #FEF08A; box-shadow: 0 0 0 2px #FACC1555; }
        .dirty-room-card .hk-checkbox { accent-color: #D4A017; }
        .dirty-room-card .room-number { color: #92610A; }
        .dirty-room-card .room-category { color: #92610A; }

        .block-room-card {
          border: 1.5px solid #38BDF8; 
          background: #D9F1FF;
        }
        .block-room-card:hover { border-color: #0284C7; box-shadow: 0 2px 8px rgba(2,132,199,0.3); }
        .block-room-card.selected { border-color: #0284C7; background: #BAE6FD; box-shadow: 0 0 0 2px #38BDF855; }
        .block-room-card .hk-checkbox { accent-color: #0284C7; }
        .block-room-card .room-number { color: #0369A1; }
        .block-room-card .room-category { color: #0369A1; }

        .maint-room-card {
          border: 1.5px solid #F87171; 
          background: #FFE0E0;
        }
        .maint-room-card:hover { border-color: #DC2626; box-shadow: 0 2px 8px rgba(220,38,38,0.3); }
        .maint-room-card.selected { border-color: #DC2626; background: #FECACA; box-shadow: 0 0 0 2px #F8717155; }
        .maint-room-card .hk-checkbox { accent-color: #DC2626; }
        .maint-room-card .room-number { color: #991B1B; }
        .maint-room-card .room-category { color: #991B1B; }

        .group-box {
          width: 90px; background-color: #E5E7EB !important; border: 1px solid #5e5e5e !important;
          color: #606060 !important; display: flex; justify-content: center; align-items: center;
          text-align: center; padding: 5px; word-break: break-word; white-space: normal;
        }
        .same-btn { min-width: 40px; text-align: center; }
        .status-footer { position: sticky; bottom: 0; background-color: #f8f9fa; border-top: 2px solid #dee2e6; font-weight: bold; }
        body.dark-mode .status-footer { background-color: #2a2a2a; border-top-color: #444; }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        ::-webkit-scrollbar-thumb { background: #c8c8c8; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
        * { scrollbar-width: thin; scrollbar-color: #c8c8c8 #f1f1f1; }
      `}</style>

      <div className="d-flex flex-column vh-100">

        {/* ===== HEADER ===== */}
        <div className="flex-shrink-0 p-2 pb-0 bg-white">
          <div className="border-bottom pb-2 mb-2">

            {/* Top row — status filters + actions */}
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
              <div className="d-flex flex-wrap gap-2">
                <Button size="sm" variant={statusFilter === 'all' ? 'dark' : 'outline-dark'} className="fw-semibold px-3 same-btn"
                  onClick={() => handleStatusFilterClick('all')}>
                  <i className="fi fi-rr-apps me-1"></i>All [{stats.total}]
                </Button>
                <Button size="sm" variant={statusFilter === 'available' ? 'success' : 'outline-success'} className="fw-semibold px-3 same-btn"
                  onClick={() => handleStatusFilterClick('available')}>
                  <i className="fi fi-rr-bed-empty me-1"></i>Vacant [{stats.available}]
                </Button>
                <Button size="sm" variant={statusFilter === 'occupied' ? 'primary' : 'outline-primary'} className="fw-semibold px-3 same-btn"
                  onClick={() => handleStatusFilterClick('occupied')}>
                  <i className="fi fi-rr-user me-1"></i>Occupied [{stats.occupied}]
                </Button>
                <Button size="sm" variant={activeHousekeepingTab ? 'warning' : 'outline-warning'} className="fw-semibold px-3 same-btn"
                  onClick={() => {
                    setShowSettlementPage(false)
                    setShowArrivals(false)
                    setShowAtGlance(false)
                    setShowReservationForm(false)
                    setShowReservationSummary(false)
                    
                    if (activeHousekeepingTab) {
                      handleHousekeepingTabClick(null)
                      handleStatusFilterClick('all')
                    } else {
                      handleStatusFilterClick('cleaning')
                      handleHousekeepingTabClick('all')
                    }
                  }}>
                  <i className="fi fi-rr-lock me-1"></i>Block [{stats.cleaning + stats.reserved + stats.maintenance}]
                </Button>
               <Button 
  size="sm" 
  variant={showReservationPage ? 'secondary' : 'outline-secondary'} 
  className="fw-semibold px-3 same-btn"
  onClick={() => {
    setActiveHousekeepingTab(null)
    setSelectedHousekeepingRoomIds([])
    
    // Close all other pages
    setShowSettlementPage(false)
    setShowArrivals(false)
    setShowAtGlance(false)
    setShowReservationForm(false)
    setShowReservationSummary(false)
    setActiveSection(null)
    
    // ✅ Simply toggle reservation page without changing status filter
    setShowReservationPage(!showReservationPage)
  }}
>
  <i className="fi fi-rr-calendar me-1"></i>Reservation [{stats.reservation}]
</Button>
                <Button 
                  size="sm" 
                  variant="outline-info" 
                  className="fw-semibold px-3 same-btn text-nowrap"
                  onClick={() => {
                    setActiveHousekeepingTab(null)
                    setSelectedHousekeepingRoomIds([])
                    
                    setShowArrivals(true)
                    setShowSettlementPage(false)
                    setShowAtGlance(false)
                    setShowReservationForm(false)
                    setShowReservationSummary(false)
                    setActiveSection(null)
                    setStatusFilter('all')
                  }}
                >
                  <i className="fi fi-rr-plane-arrival me-1"></i>Arrivals
                </Button>
                <Button
                  size="sm"
                  variant="outline-success"
                  className="fw-semibold px-3 same-btn"
                  onClick={() => {
                    setActiveHousekeepingTab(null)
                    setSelectedHousekeepingRoomIds([])
                    
                    setShowSettlementPage(true)
                    setShowArrivals(false)
                    setShowAtGlance(false)
                    setShowReservationForm(false)
                    setShowReservationSummary(false)
                    setActiveSection(null)
                    setStatusFilter('all')
                  }}
                >
                  <i className="fi fi-rr-money-check me-1"></i>Settlement
                </Button>
                
              </div>

              <div className="d-flex flex-wrap gap-2">
                <Button 
                  size="sm" 
                  variant="outline-primary" 
                  className="fw-semibold text-nowrap px-3"
                  onClick={() => {
                    setActiveHousekeepingTab(null)
                    setSelectedHousekeepingRoomIds([])
                    
                    setShowAtGlance(true)
                    setShowSettlementPage(false)
                    setShowArrivals(false)
                    setShowReservationForm(false)
                    setShowReservationSummary(false)
                    setActiveSection(null)
                    setStatusFilter('all')
                  }}
                >
                  At Glance
                </Button>
                <Button size="sm" variant="outline-success" className="d-flex align-items-center justify-content-center same-btn"
                  onClick={() => setShowSettings(true)} title="Settings">
                  <i className="fi fi-rr-settings"></i>
                </Button>
                <Button size="sm" variant="outline-danger" className="d-flex align-items-center justify-content-center same-btn"
                  onClick={() => navigate(-1)} title="Close">
                  <i className="fi fi-rr-cross"></i>
                </Button>
              </div>
            </div>

            {/* Second row — view controls */}
            <div className="d-flex gap-2 flex-wrap align-items-center">
              <Button size="sm" variant={viewMode === 'floor' ? 'danger' : 'primary'} className="same-btn d-flex align-items-center justify-content-center"
                title={viewMode === 'floor' ? 'Switch to Category View' : 'Switch to Floor View'}
                onClick={() => setViewMode(viewMode === 'floor' ? 'category' : 'floor')}>
                <i className={viewMode === 'floor' ? 'fi fi-rr-building' : 'fi fi-rr-apps'}></i>
              </Button>
              <Button size="sm" variant="outline-success" className="fw-semibold px-3 same-btn" onClick={handleCheckInClick}>
                <i className="fi fi-rr-check me-1"></i>Check In F9
              </Button>
              {selectedRoomIds.length > 0 && (
                <Button size="sm" variant="outline-warning" className="fw-semibold px-3 same-btn"
                  onClick={() => setShowMultiRoomStatusModal(true)}
                  title="Apply Dirty / Block / Maintenance to all selected rooms">
                  <i className="fi fi-rr-lock me-1"></i>Block ({selectedRoomIds.length})
                </Button>
              )}
              <Button size="sm" variant="outline-danger" className="fw-semibold px-4">Free Rooms</Button>
            </div>
          </div>

          {/* ===== HOUSEKEEPING PANEL ===== */}
          {activeHousekeepingTab && (
            <div className="border-top pt-0 pb-0 px-0">
              {activeHousekeepingTab === 'all' && (
                <>
                  <div className="housekeeping-section">
                    <div className="housekeeping-section-header">
                      <div className="housekeeping-section-header-left">
                        <i className="fi fi-rr-broom" style={{ color: '#D4A017' }}></i>Dirty Rooms
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        <Button size="sm" variant="outline-primary" className="fw-semibold px-2 py-1" style={{ fontSize: '0.7rem' }}
                          onClick={() => handleSelectAllHousekeepingForSection(housekeepingRoomsForTab.filter((r) => isCleaning(r)).map((r) => r.id))}>
                          Select All
                        </Button>
                        <Button size="sm" variant="outline-danger" className="fw-semibold px-2 py-1" style={{ fontSize: '0.7rem' }}
                          onClick={() => handleRemoveSelectionForSection(housekeepingRoomsForTab.filter((r) => isCleaning(r)).map((r) => r.id))}>
                          Vacant
                        </Button>
                      </div>
                    </div>
                    <div className="hk-rooms-body" ref={dirtyScrollRef}>
                      {(() => {
                        const dirtyRooms = housekeepingRoomsForTab.filter((r) => isCleaning(r))
                        if (dirtyRooms.length === 0)
                          return <div className="text-muted py-1 px-1" style={{ fontSize: '0.75rem' }}>No dirty rooms</div>

                        const columns = []
                        for (let i = 0; i < dirtyRooms.length; i += 2) columns.push(dirtyRooms.slice(i, i + 2))

                        return columns.map((col, colIdx) => (
                          <div key={`dirty-col-${colIdx}`} className="hk-rooms-grid-col">
                            {col.map((room) => {
                              const isSelected = selectedHousekeepingRoomIds.includes(room.id)
                              return (
                                <div key={`dirty-${room.id}`} className={`hk-room-card dirty-room-card${isSelected ? ' selected' : ''}`}
                                  onClick={() => toggleHousekeepingRoomSelection(room.id)}>
                                  <input type="checkbox" className="hk-checkbox" checked={isSelected}
                                    onChange={() => toggleHousekeepingRoomSelection(room.id)}
                                    onClick={(e) => e.stopPropagation()} />
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

                  <div className="housekeeping-section">
                    <div className="housekeeping-section-header">
                      <div className="housekeeping-section-header-left">
                        <i className="fi fi-rr-lock" style={{ color: '#0284C7' }}></i>Blocked Rooms
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        <Button size="sm" variant="outline-primary" className="fw-semibold px-2 py-1" style={{ fontSize: '0.7rem' }}
                          onClick={() => handleSelectAllHousekeepingForSection(housekeepingRoomsForTab.filter((r) => isReserved(r)).map((r) => r.id))}>
                          Select All
                        </Button>
                        <Button size="sm" variant="outline-danger" className="fw-semibold px-2 py-1" style={{ fontSize: '0.7rem' }}
                          onClick={() => handleRemoveSelectionForSection(housekeepingRoomsForTab.filter((r) => isReserved(r)).map((r) => r.id))}>
                          Vacant
                        </Button>
                      </div>
                    </div>
                    <div className="hk-rooms-body" ref={blockScrollRef}>
                      {(() => {
                        const blockedRooms = housekeepingRoomsForTab.filter((r) => isReserved(r))
                        if (blockedRooms.length === 0)
                          return <div className="text-muted py-1 px-1" style={{ fontSize: '0.75rem' }}>No blocked rooms</div>

                        const columns = []
                        for (let i = 0; i < blockedRooms.length; i += 2) columns.push(blockedRooms.slice(i, i + 2))

                        return columns.map((col, colIdx) => (
                          <div key={`block-col-${colIdx}`} className="hk-rooms-grid-col">
                            {col.map((room) => {
                              const isSelected = selectedHousekeepingRoomIds.includes(room.id)
                              return (
                                <div key={`block-${room.id}`} className={`hk-room-card block-room-card${isSelected ? ' selected' : ''}`}
                                  onClick={() => toggleHousekeepingRoomSelection(room.id)}>
                                  <input type="checkbox" className="hk-checkbox" checked={isSelected}
                                    onChange={() => toggleHousekeepingRoomSelection(room.id)}
                                    onClick={(e) => e.stopPropagation()} />
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

                  <div className="housekeeping-section">
                    <div className="housekeeping-section-header">
                      <div className="housekeeping-section-header-left">
                        <i className="fi fi-rr-tools" style={{ color: '#DC2626' }}></i>Maintenance Rooms
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        <Button size="sm" variant="outline-primary" className="fw-semibold px-2 py-1" style={{ fontSize: '0.7rem' }}
                          onClick={() => handleSelectAllHousekeepingForSection(housekeepingRoomsForTab.filter((r) => isMaintenance(r)).map((r) => r.id))}>
                          Select All
                        </Button>
                        <Button size="sm" variant="outline-danger" className="fw-semibold px-2 py-1" style={{ fontSize: '0.7rem' }}
                          onClick={() => handleRemoveSelectionForSection(housekeepingRoomsForTab.filter((r) => isMaintenance(r)).map((r) => r.id))}>
                          Vacant
                        </Button>
                      </div>
                    </div>
                    <div className="hk-rooms-body" ref={maintScrollRef}>
                      {(() => {
                        const maintRooms = housekeepingRoomsForTab.filter((r) => isMaintenance(r))
                        if (maintRooms.length === 0)
                          return <div className="text-muted py-1 px-1" style={{ fontSize: '0.75rem' }}>No maintenance rooms</div>

                        const columns = []
                        for (let i = 0; i < maintRooms.length; i += 2) columns.push(maintRooms.slice(i, i + 2))

                        return columns.map((col, colIdx) => (
                          <div key={`maint-col-${colIdx}`} className="hk-rooms-grid-col">
                            {col.map((room) => {
                              const isSelected = selectedHousekeepingRoomIds.includes(room.id)
                              return (
                                <div key={`maint-${room.id}`} className={`hk-room-card maint-room-card${isSelected ? ' selected' : ''}`}
                                  onClick={() => toggleHousekeepingRoomSelection(room.id)}>
                                  <input type="checkbox" className="hk-checkbox" checked={isSelected}
                                    onChange={() => toggleHousekeepingRoomSelection(room.id)}
                                    onClick={(e) => e.stopPropagation()} />
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
                </>
              )}
            </div>
          )}
        </div>

        {/* ===== MAIN CONTENT AREA ===== */}
        <div className={`${activeHousekeepingTab ? '' : 'flex-grow-1 overflow-auto'} bg-white`} style={{ width: '100%' }}>

          {activeHousekeepingTab ? null
            : showSettlementPage ? (
              <div style={{ height: '100%' }}>
                <SettlementPage />
              </div>
            ) : showArrivals ? (
              <div style={{ height: '100%', padding: '16px' }}>
                <ArrivalsPage />
              </div>
            ) : showAtGlance ? (
              <div style={{ height: '100%', padding: '16px' }}>
                <AtGlancePage />
              </div>

               ) : showReservationPage ? (  
      <div style={{ height: '100%', padding: '16px' }}>
        <ReservationPage />
      </div>
            ) : showReservationForm ? (
              <div style={{ height: '100%', padding: '16px' }}>
                <ReservationFormPage />
              </div>
            ) : showReservationSummary ? (
              <div style={{ height: '100%', padding: '16px' }}>
                <ReservationSummaryPage />
              </div>
            ) : showCheckoutAlertTable ? (
              <div className="checkout-table-container d-flex flex-column" style={{ width: '100%' }}>
                <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                  <h6 className="mb-0 fw-bold">
                    <i className="fi fi-rr-calendar-check me-2 text-warning"></i>
                    Today's Checkouts —{' '}
                    {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </h6>
                  <div className="d-flex align-items-center gap-2">
                    <Button variant="success" size="sm" className="fw-normal px-3"
                      onClick={() => handlePrintTable('.checkout-table', "Today's Checkouts")}>
                      <i className="fi fi-rr-print me-1"></i>Print
                    </Button>
                    <Dropdown>
                      <Dropdown.Toggle variant="primary" size="sm" className="fw-normal px-2">
                        <i className="fi fi-rr-download me-1"></i>Export
                      </Dropdown.Toggle>
                      <Dropdown.Menu>
                        <Dropdown.Item onClick={() => exportTableToPdf('.checkout-table', "Today's Checkouts", 'todays-checkouts.pdf')}>
                          <i className="fi fi-rr-file-pdf me-2"></i>PDF
                        </Dropdown.Item>
                        <Dropdown.Item onClick={() => exportCheckoutToExcel(checkoutAlertData, 'todays_checkouts.xlsx')}>
                          <i className="fi fi-rr-file-excel me-2"></i>Excel
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>

                {loadingCheckoutAlert ? (
                  <div className="d-flex justify-content-center py-5">
                    <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                  </div>
                ) : errorCheckoutAlert ? (
                  <div className="text-center py-5">
                    <i className="fi fi-rr-exclamation text-danger fs-4 mb-3 d-block"></i>
                    <p className="text-danger">{errorCheckoutAlert}</p>
                    <Button variant="outline-primary" onClick={fetchTodayCheckouts}>Retry</Button>
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
                          <th>Sr. No.</th><th>Room No</th><th>Guest Name</th><th>Category</th>
                          <th>Adults</th><th>Pax</th><th>Ex-Pax</th><th>Child</th><th>Driver</th>
                          <th>Total Days</th><th>Total Amount</th><th>Reg No</th>
                          <th>Booking Ref</th><th>Plan Name</th>
                          <th>Check-out Date & Time</th><th>Check-in Date & Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {checkoutAlertData.map((item) => {
                          const minutesLeft = item.minutesLeft ?? getMinutesLeft(item.checkoutDatetime)
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
                              <td className={cellClass}>{item.totalNights ?? '-'}</td>
                              <td className={cellClass}>{formatAmount(item.totalAmount || item.totalPrice)}</td>
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
                <div className="d-flex justify-content-center align-items-center py-5">
                  <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
                </div>
              ) : errorOccupied ? (
                <div className="text-center py-5">
                  <i className="fi fi-rr-exclamation text-danger fs-4 mb-3 d-block"></i>
                  <p className="text-danger">{errorOccupied}</p>
                  <Button variant="outline-primary" size="sm" onClick={() => fetchOccupiedRoomsData()}>Retry</Button>
                </div>
              ) : occupiedRooms.length === 0 ? (
                <div className="text-center py-5">
                  <i className="fi fi-rr-bed-empty text-muted fs-4 mb-4 d-block"></i>
                  <p className="text-muted mb-0">No occupied rooms found.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '6px', alignContent: 'start', padding: '0 8px', width: '100%' }}>
                  {occupiedRooms.map((item) => {
                    const checkoutTime = item.checkout_datetime || item.latest_charge_checkout_datetime || new Date().toISOString();
                    const minutesLeft = getMinutesLeft(checkoutTime);
                    
                    const isBillRoom = item.room_status_id === 7;
                    const isExpired = !isBillRoom && minutesLeft <= 0;
                    const isNear = !isBillRoom && minutesLeft <= 60 && minutesLeft > 0;
                    
                    let backgroundColor, borderColor, textColor, headerColor;
                    
                    if (isBillRoom) {
                      backgroundColor = item.status_color || uiSettings.color_bill || '#f59999';
                      borderColor = backgroundColor;
                      textColor = getContrastColor(backgroundColor);
                      headerColor = '#8B0000';
                    } else if (isExpired) {
                      backgroundColor = uiSettings.occupied_expired_bg || '#E03F4F';
                      borderColor = uiSettings.occupied_expired_bg || '#E03F4F';
                      textColor = uiSettings.occupied_expired_text || '#ffffff';
                      headerColor = '#4a0000';
                    } else if (isNear) {
                      const opacity = 0.2 + ((60 - minutesLeft) / 60) * 0.5;
                      backgroundColor = `rgba(255, 0, 0, ${opacity})`;
                      borderColor = '#ff4444';
                      textColor = '#000000';
                      headerColor = '#8B0000';
                    } else {
                      backgroundColor = uiSettings.color_occupied || '#DFF5E1';
                      borderColor = '#4ADE80';
                      textColor = uiSettings.text_color_occupied || '#16A34A';
                      headerColor = '#000000';
                    }
                    
                    const netRoomAmount = item.net_room_amount ?? 0;
                    const netAllRoomsAmount = item.total_all_rooms_net ?? 0;
                    const pendingAdvance = item.pending_advance_for_room || 0;
                    const bookingType = item.booking_type || 'WALK-IN-GUEST';
                    const totalAllowances = item.total_allowances || 0;
                    const leftIsNegative = netRoomAmount < 0;

                    return (
                      <div
                        key={`${item.checkin_id}-${item.room_no}`}
                        className={`occupied-tile ${isNear ? 'occupied-tile-checkout-near' : ''} ${isExpired ? 'occupied-tile-expired' : ''}`}
                        onClick={() => handleOccupiedRoomClick(item)}
                        onContextMenu={(e) => handleContextMenu(e, item)}
                        style={{ 
                          border: `2px solid ${borderColor}`,
                          backgroundColor: backgroundColor,
                        }}>
                        <div className="occupied-header" style={{ 
                          backgroundColor: headerColor,
                          color: '#ffffff',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <span>{item.room_no} {item.guest_name || 'Unknown Guest'}</span>
                          {isBillRoom && (
                            <span className="badge" style={{ 
                              backgroundColor: '#ff6b00', 
                              color: '#fff',
                              fontSize: '0.6rem',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>BILL</span>
                          )}
                          {isExpired && !isBillRoom && (
                            <span className="badge" style={{ 
                              backgroundColor: '#ff0000', 
                              color: '#fff',
                              fontSize: '0.6rem',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>EXPIRED</span>
                          )}
                          {isNear && !isExpired && !isBillRoom && (
                            <span className="badge" style={{ 
                              backgroundColor: '#ff6600', 
                              color: '#fff',
                              fontSize: '0.6rem',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>{minutesLeft}m</span>
                          )}
                        </div>
                        <div className="occupied-body" style={{ 
                          backgroundColor: backgroundColor, 
                          color: textColor 
                        }}>
                          <div>IN : {formatDateTime(item.checkin_datetime || '')}</div>
                          <div>OUT : {formatDateTime(item.checkout_datetime || item.latest_charge_checkout_datetime || '')}</div>
                          <div>{bookingType === 'AGENT' && item.agent_name ? item.agent_name : (item.guest_type || 'WALK-IN-GUEST')}</div>
                          <div className="charges-line">
                            <span style={{ 
                              color: isExpired ? '#ffffff' : (isBillRoom ? getContrastColor(backgroundColor) : '#000'), 
                              fontWeight: leftIsNegative || pendingAdvance > 0 ? 600 : 'normal' 
                            }}>
                              {formatAmount(netRoomAmount)}
                            </span>
                            <span style={{ color: isExpired ? '#ffffff' : (isBillRoom ? getContrastColor(backgroundColor) : '#000') }}>
                              {formatAmount(netAllRoomsAmount)}
                            </span>
                          </div>
                          {totalAllowances > 0 && (
                            <div style={{ 
                              fontSize: '0.6rem', 
                              color: isExpired ? '#ffcccc' : (isBillRoom ? getContrastColor(backgroundColor) : '#c0392b'), 
                              fontWeight: 600, 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              marginTop: '1px' 
                            }}>
                              <span>Alw: -{formatAmount(totalAllowances)}</span>
                              <span>Net: {formatAmount(netRoomAmount)}</span>
                            </div>
                          )}
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            fontSize: '0.65rem',
                            color: isExpired ? '#ffcccc' : (isBillRoom ? getContrastColor(backgroundColor) : 'inherit')
                          }}>
                            <span>
                              {(item.original_pax ?? item.adults) || 0}
                              <span style={{ opacity: 0.5 }}>:</span>{item.ex_pax || 0}
                              <span style={{ opacity: 0.5 }}>:</span>{item.child_count || 0}
                              <span style={{ opacity: 0.5 }}>:</span>{item.driver_count || 0}
                            </span>
                            <span>| {item.payment_method || 'Cash'}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : filteredRooms.length === 0 ? (
              <div className="text-center py-5">
                <i className="fi fi-rr-search text-muted fs-4 mb-4 d-block"></i>
                <p className="text-muted mb-0">No rooms found</p>
                <Button variant="outline-primary" size="sm" onClick={resetFilters} className="mt-2">Reset Filters</Button>
              </div>
            ) : (
              <div className="d-flex flex-column">
                {activeGroups.map((group) => (
                  <div key={group.id} className="d-flex align-items-stretch gap-1 p-1 bg-white" style={{ border: '1px solid lightgray' }}>
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
                        const occupiedItem = isOccupied(room)
                          ? occupiedRooms.find((occ) => occ.room_no === room.number)
                          : null
                        const isExpiredTile = occupiedItem?.isExpired ?? false
                        
                        const tileBg = room.backgroundColor
                        const tileColor = room.textColor
                        const tileBorder = room.borderColor
                        const isSelectable = isVacant(room) && !isExpiredTile

                        return (
                          <div
                            key={room.id}
                            className={`d-flex flex-column align-items-center justify-content-center p-1 shadow-sm room-tile room-tile-${boxSizeClass}`}
                            style={{
                              cursor: isExpiredTile ? 'not-allowed' : 'pointer',
                              backgroundColor: tileBg,
                              color: tileColor,
                              border: `1px solid ${tileBorder}`,
                              opacity: isExpiredTile ? 0.85 : 1,
                            }}
                            title={isExpiredTile ? 'Checkout time has expired' : room.statusName}
                            onClick={isExpiredTile ? undefined : () => handleRoomTileClick(room)}
                            onContextMenu={isExpiredTile ? undefined : (e) => {
                              if (isOccupied(room)) {
                                if (occupiedItem) { e.preventDefault(); handleContextMenu(e, occupiedItem) }
                              } else {
                                e.preventDefault()
                                handleRoomStatusChangeRequest(room)
                              }
                            }}>
                            <input
                              type="checkbox"
                              className="room-checkbox"
                              checked={isRoomSelected(room.id)}
                              disabled={!isSelectable}
                              title={
                                isExpiredTile ? 'Checkout time has expired'
                                : !isVacant(room) ? 'Only vacant rooms can be selected for check-in'
                                : 'Select for check-in'
                              }
                              onChange={(e) => { e.stopPropagation(); toggleRoomSelection(room.id) }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="fw-bold">{room.number}</div>
                            {showSubtext && (
                              <div className="small">{viewMode === 'category' ? room.floor : room.category}</div>
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

        {/* ===== FOOTER ===== */}
        <div className="flex-shrink-0 bg-white border-top p-2">
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <Button size="sm" variant="danger" className="fw-semibold px-4">Summary</Button>
            <Button size="sm" variant="secondary" className="fw-semibold px-4" onClick={() => navigate('/hotel/report')}>
              <i className="fi fi-rr-chart-line me-1"></i>Report
            </Button>
            <Button size="sm" variant="danger" className="fw-semibold px-4">Cash In</Button>
            <Button size="sm" variant="danger" className="fw-semibold px-4">Cash Out</Button>
            <Button size="sm" variant="danger" className="fw-semibold px-4">MIS Report</Button>
            <Button
              size="sm"
              variant={showSettlementPage ? 'secondary' : 'success'}
              className="fw-semibold px-4"
              onClick={() => {
                if (showSettlementPage) {
                  setShowSettlementPage(false)
                  return
                }
                if (showCheckoutAlertTable) setActiveSection(null)
                else { setActiveSection('checkout'); fetchTodayCheckouts() }
              }}
            >
              {showSettlementPage ? 'Back to Rooms' : showCheckoutAlertTable ? 'Back to Rooms' : 'Today Check Out'}
            </Button>

            <Button size="sm" variant="primary" className="fw-semibold px-4 position-relative"
              onClick={() => navigate('/hotel/reservation-summary')}>
              Reservation Summary
              {todayReservationCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem', minWidth: '1.4rem' }}>
                  {todayReservationCount}
                  <span className="visually-hidden">today's reservations</span>
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ===== MODALS ===== */}

      <DayExtendModal
        show={extendDayModal.show}
        occupiedItem={extendDayModal.occupiedItem}
        siblingRooms={extendDayModal.siblingRooms}
        extending={extendDayModal.loading || false}
        onHide={() => setExtendDayModal({ 
          show: false, 
          occupiedItem: null, 
          siblingRooms: [],
          room: null,
          checkin: null,
          loading: false 
        })}
        onExtend={handleExtendDay}
      />

      <DisplaySettings
        show={showSettings}
        onHide={() => setShowSettings(false)}
        uiSettings={uiSettings}
        onUiSettingsChange={setUiSettings}
        onSave={handleSaveSettings}
        savingSettings={savingSettings}
      />

      {showContextMenu && contextMenuItem && (
        <div id="custom-context-menu" ref={contextMenuRef}
          style={{ position: 'fixed', top: contextMenuPos.y, left: contextMenuPos.x, backgroundColor: '#eeeeee', border: '1px solid #ccc', boxShadow: '0 2px 10px rgba(0,0,0,0.2)', zIndex: 1050, minWidth: 200, padding: '4px 0', borderRadius: 4 }}
          onClick={(e) => e.stopPropagation()}>
          {CONTEXT_MENU_OPTIONS.map((option) => (
            <div key={option.label}
              style={{ padding: '6px 12px', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              onClick={() => {
                if (option.label === 'Amendments') navigate('/hotel/amendments', { state: { occupiedItem: contextMenuItem } })
                else if (option.label === 'Advance') { setSelectedOccupiedItem(contextMenuItem); setShowAdvanceModal(true) }
                else if (option.label === 'Post Charges') { setSelectedOccupiedItem(contextMenuItem); setPostChargesMode('charge'); setShowPostChargesModal(true) }
                else if (option.label === 'Allowances') { setSelectedOccupiedItem(contextMenuItem); setPostChargesMode('allowance'); setShowPostChargesModal(true) }
                else if (option.label === 'Receipt Against Posted Bills') { setSelectedOccupiedItem(contextMenuItem); setShowReceiptModal(true) }
                closeContextMenu()
              }}>
              <i className={option.icon} style={{ fontSize: '0.85rem' }}></i>
              <span>{option.label}</span>
            </div>
          ))}
        </div>
      )}

      {selectedOccupiedItem && (
        <PostChargesModal
          show={showPostChargesModal}
          onHide={() => { setShowPostChargesModal(false); setSelectedOccupiedItem(null) }}
          roomNo={selectedOccupiedItem.room_no}
          guestName={selectedOccupiedItem.guest_name}
          checkinId={selectedOccupiedItem.checkin_id}
          detailId={selectedOccupiedItem.detail_id}
          roomId={selectedOccupiedItem.room_id}
          guestId={selectedOccupiedItem.checkin?.guest_id}
          hotelId={hotelId || 0}
          userId={user?.id}
          mode={postChargesMode}
          onSuccess={() => {}}
          existingCharges={[]}
          onChargesUpdated={() => {}}
        />
      )}

      {selectedOccupiedItem && (
        <ReceiptAgainstBillsModal
          show={showReceiptModal}
          onHide={() => { setShowReceiptModal(false); setSelectedOccupiedItem(null) }}
          roomNo={selectedOccupiedItem.room_no}
          guestName={selectedOccupiedItem.guest_name}
          checkinId={selectedOccupiedItem.checkin_id}
          detailId={selectedOccupiedItem.detail_id}
          hotelId={hotelId || 0}
          userId={user?.id}
          onSuccess={() => {}}
        />
      )}

      {selectedOccupiedItem && (
        <Advance
          show={showAdvanceModal}
          onHide={() => { setShowAdvanceModal(false); setSelectedOccupiedItem(null) }}
          roomNo={selectedOccupiedItem.room_no}
          guestName={selectedOccupiedItem.guest_name}
          checkinId={selectedOccupiedItem.checkin_id}
          detailId={selectedOccupiedItem.detail_id}
          hotelId={hotelId || 0}
          userId={user?.id}
          roomId={selectedOccupiedItem.room_id}
          onSuccess={() => {}}
        />
      )}

      <RoomStatusModal
        show={showMultiRoomStatusModal}
        onHide={() => setShowMultiRoomStatusModal(false)}
        room={null}
        rooms={rooms.filter((r) => selectedRoomIds.includes(r.id))}
        hotelId={hotelId || 0}
        userId={user?.id}
        onSuccess={async () => setShowMultiRoomStatusModal(false)}
      />
    </>
  )
}

export default HotelBookingPanel