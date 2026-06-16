 import { useState, useMemo, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Button, Modal, Dropdown } from 'react-bootstrap'
import { toast } from 'react-hot-toast'
import TitleHelmet from '@/components/Common/TitleHelmet'
import { useAuthContext } from '@/common/context/useAuthContext'
import RoomService from '@/common/hotel/room'
import hotelSettingsApi, { HotelUiSettings } from '@/common/hotel/hotelSettings'
import CheckInService, { CheckIn } from '@/common/hotel/checkIn'
import DetailService from '@/common/hotel/detail'
import GuestFolioService from '@/common/hotel/guestFolio'
import GuestRoomChargesService, { GuestRoomCharge } from '@/common/hotel/guestRoomCharges'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import BrandService from '@/common/hotel/brand'
import ReservationService from '@/common/hotel/reservation'
import ReservationRoomService from '@/common/hotel/reservationRooms'
import AdvanceTransactionService from '@/common/hotel/advanceTransaction'
import PostChargesModal from './PostChargesModal'
import ReceiptAgainstBillsModal from './ReceiptAgainstBillsModal'
import Advance from './Advance'
import RoomStatusModal from './RoomStatusModal'
import DisplaySettings from './DisplaySettings'
import DayExtendModal from './DayExtendModal'
import { OccupiedRoomItem } from '@/types/room'
import { calculateDayExtensionPrice } from '@/utils/dayExtension'

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
type ActiveSection = 'reserv' | 'checkout' | null
type HousekeepingTab = 'all' | 'dirty' | 'block' | 'maint' | null

// Map room_status_id to RoomStatus
const STATUS_ID_MAP: Record<number, RoomStatus> = {
  1: 'available',      // Available
  2: 'occupied',       // Occupied
  3: 'maintenance',    // Maintenance
  4: 'cleaning',       // Cleaning ← THIS IS DIRTY ROOMS
  5: 'maintenance',    // Out of Service → Maintenance
  6: 'reserved',       // Reserved ← THIS IS BLOCKED ROOMS
  7: 'Bill',           // Bill
}

// Status IDs for filtering
const STATUS_IDS = {
  VACANT: [1],
  OCCUPIED: [2, 7],
  CLEANING: [4],        // ← Cleaning = status_id 4
  RESERVED: [6],        // ← Reserved = status_id 6
  MAINTENANCE: [3, 5],  // ← Maintenance + Out of Service
  BLOCK: [3, 4, 5, 6],  // Maintenance + Cleaning + Out of Service + Reserved
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

interface ContextMenuOption {
  label: string
  icon?: string
}

// ==================== HELPERS ====================

const normalizeRoomStatus = (raw: unknown): RoomStatus => {
  if (!raw) return 'available'
  const s = String(raw).trim().toLowerCase()
  if (s === 'occupied') return 'occupied'
  if (s === 'cleaning' || s === 'dirty' || s === 'clean') return 'cleaning'
  if (s === 'bill') return 'Bill'
  if (s === 'reserved' || s === 'blocked' || s === 'block') return 'reserved'
  if (s === 'maintenance' || s === 'under maintenance') return 'maintenance'
  if (s === 'reservation') return 'reservation'
  return 'available'
}

const normalizeRoomStatusFromApi = (apiRoom: ApiRoom): RoomStatus => {
  if (apiRoom.room_status_id !== undefined && apiRoom.room_status_id !== null) {
    return STATUS_ID_MAP[apiRoom.room_status_id] || 'available'
  }
  if (Number(apiRoom?.room_status_id) === 7) return 'Bill'
  return normalizeRoomStatus(apiRoom?.room_status)
}

// ==================== HELPERS ====================

// Helper functions for filtering by status IDs
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
  return STATUS_IDS.CLEANING.includes(statusId)  // status_id = 4
}

const isReserved = (room: Room): boolean => {
  const statusId = room.rawData?.room_status_id || 1
  return STATUS_IDS.RESERVED.includes(statusId)  // status_id = 6
}

const isMaintenance = (room: Room): boolean => {
  const statusId = room.rawData?.room_status_id || 1
  return STATUS_IDS.MAINTENANCE.includes(statusId)  // status_id = 3 or 5
}

const isBlocked = (room: Room): boolean => {
  const statusId = room.rawData?.room_status_id || 1
  return STATUS_IDS.BLOCK.includes(statusId)
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

const formatDateTimeForMySQL = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
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
  const [updating, setUpdating] = useState(false)
  const [showRoomDetails, setShowRoomDetails] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [activeSection, setActiveSection] = useState<ActiveSection>(null)
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

  // --- Reservation table ---
  const [reservTableData, setReservTableData] = useState<ReservTableRow[]>([])
  const [loadingReservTable, setLoadingReservTable] = useState(false)
  const [reservDate, setReservDate] = useState(new Date().toISOString().slice(0, 10))

  // --- Context menu ---
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 })
  const [contextMenuItem, setContextMenuItem] = useState<OccupiedRoomItem | null>(null)
  const contextMenuRef = useRef<HTMLDivElement>(null)
  const tileClickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // --- Day extend ---
  const [extendingDay, setExtendingDay] = useState(false)
  const [extendModal, setExtendModal] = useState<{
    show: boolean
    occupiedItem: OccupiedRoomItem | null
    siblingRooms: OccupiedRoomItem[]
  }>({ show: false, occupiedItem: null, siblingRooms: [] })

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
        matchesStatus = isOccupied(room)
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
    occupied: base.filter((r) => isOccupied(r)).length,
    cleaning: base.filter((r) => isCleaning(r)).length,  // status_id = 4
    bill: base.filter((r) => r.status === 'Bill').length,
    reserved: base.filter((r) => isReserved(r)).length,  // status_id = 6
    maintenance: base.filter((r) => isMaintenance(r)).length,  // status_id = 3 or 5
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
      return [3, 4, 5, 6].includes(statusId) // Maintenance, Cleaning, Out of Service, Reserved
    })
  }
  
  if (activeHousekeepingTab === 'dirty') {
    // ✅ ONLY status_id = 4 (Cleaning)
    return rooms.filter((r) => {
      const statusId = r.rawData?.room_status_id || 1
      return statusId === 4
    })
  }
  
  if (activeHousekeepingTab === 'block') {
    // ✅ ONLY status_id = 6 (Reserved)
    return rooms.filter((r) => {
      const statusId = r.rawData?.room_status_id || 1
      return statusId === 6
    })
  }
  
  if (activeHousekeepingTab === 'maint') {
    // ✅ status_id = 3 (Maintenance) or 5 (Out of Service)
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

  const showReservSection = activeSection === 'reserv'
  const showCheckoutAlertTable = activeSection === 'checkout'

  // ==================== EFFECTS ====================

  useEffect(() => {
    const timer = setInterval(() => {
      const todayStr = new Date().toISOString().slice(0, 10)
      setReservDate((prev) => {
        if (prev !== todayStr && activeSection === 'reserv') fetchReservTableData(todayStr)
        return prev
      })
    }, 60000)
    return () => clearInterval(timer)
  }, [activeSection])

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

  useEffect(() => {
    if (!hotelId) {
      setError('No hotel selected')
      setLoading(false)
      return
    }
    const run = async () => {
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
    }
    run()
  }, [hotelId])

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

  const fetchReservTableData = async (filterDate?: string) => {
    if (!hotelId) return
    setLoadingReservTable(true)
    try {
      const todayStr = filterDate || new Date().toISOString().slice(0, 10)
      const reservations: any[] = (await ReservationService.list({ hotelid: hotelId })).data || []

      const todayReservs = reservations.filter((r: any) => {
        const arrival = String(r.arrival_date || '').slice(0, 10)
        const status = String(r.status || '').toLowerCase()
        return (
          arrival === todayStr &&
          !['checkin', 'checkout', 'checked_in', 'checked_out'].includes(status)
        )
      })

      const rows: ReservTableRow[] = []

      for (const r of todayReservs) {
        try {
          const roomRows: any[] = (await ReservationRoomService.list({ reservation_id: r.reservation_id })).data || []

          const baseRow = {
            reservation_id: r.reservation_id,
            reservation_no: r.reservation_no || '-',
            guest_name: r.reservation_name || r.guest_name || '-',
            phone1: r.phone1 || '-',
            arrival_date: r.arrival_date || '',
            arrival_time: r.arrival_time || '',
            departure_date: r.departure_date || '',
            departure_time: r.departure_time || '',
            nights: r.nights || 0,
          }

          if (roomRows.length === 0) {
            rows.push({ ...baseRow, room_category_name: '-', converted_category_name: '-', total_rooms: 0, pax_price: 0, pax_count: 0, ex_pax_count: 0, child_count: 0, driver_count: 0, total_amount: 0 })
          } else {
            for (const rm of roomRows) {
              rows.push({
                ...baseRow,
                room_category_name: rm.room_category_name || '-',
                converted_category_name: rm.converted_category_name || '-',
                total_rooms: rm.total_rooms || 1,
                pax_price: rm.pax_price || 0,
                pax_count: rm.pax_count || 0,
                ex_pax_count: rm.ex_pax_count || 0,
                child_count: rm.child_count || 0,
                driver_count: rm.driver_count || 0,
                total_amount: rm.total_amount || 0,
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

  // ==================== EXTEND ROOM ====================

  const extendSingleRoom = async (
    item: OccupiedRoomItem,
    extensionDays: number,
    price: ReturnType<typeof calculateDayExtensionPrice>,
    exPaxCount: number,
    childCount: number,
    driverCount: number,
    hotelIdVal: number,
    userId: number | undefined,
  ) => {
    const {
      totalPrice, exPaxCharge, childCharge, driverCharge, discountAmount,
      perDayBasePrice, roomPriceAfterDiscount, roomTaxAmount, totalTaxPercent,
      exPaxBaseAmount, childBaseAmount, driverBaseAmount, exPaxTaxAmount, childTaxAmount,
      driverTaxAmount, exPaxRatePerPerson, childRatePerPerson, driverRatePerPerson,
      cgstPercent, sgstPercent, igstPercent, cessPercent, serviceChargePercent,
      roomCgstAmount, roomSgstAmount, roomIgstAmount, paxCount,
    } = price

    const currentCheckoutDate = new Date(item.latest_charge_checkout_datetime || item.checkout_datetime)
    const newCheckoutDate = new Date(currentCheckoutDate)
    newCheckoutDate.setDate(currentCheckoutDate.getDate() + extensionDays)

    if (item.detail_id) await DetailService.update(item.detail_id, { is_checkout: 1, merged: 1 })

    const detailRes = await DetailService.create({
      checkin_id: item.checkin_id,
      hotelid: hotelIdVal,
      room_id: item.room_id,
      room_number: item.room_no,
      room_category_id: item.room_category_id,
      room_category_name: item.detail?.room_category_name || '',
      converted_category_id: item.detail?.converted_category_id ?? undefined,
      converted_category_name: item.detail?.converted_category_name || '',
      checkin_datetime: formatDateTimeForMySQL(new Date(item.checkin_datetime)),
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
      service_charge_amount: ((roomPriceAfterDiscount * serviceChargePercent) / 100) * extensionDays,
      parent_detail_id: item.detail_id,
      tax: roomTaxAmount,
    })

    const newDetailId = detailRes.data?.detail_id
    if (!newDetailId) throw new Error(`Failed to create extension detail for room ${item.room_no}`)

    const perDay = {
      exPaxBase: exPaxBaseAmount / extensionDays,
      childBase: childBaseAmount / extensionDays,
      driverBase: driverBaseAmount / extensionDays,
      exPax: exPaxCharge / extensionDays,
      child: childCharge / extensionDays,
      driver: driverCharge / extensionDays,
      exPaxTax: exPaxTaxAmount / extensionDays,
      childTax: childTaxAmount / extensionDays,
      driverTax: driverTaxAmount / extensionDays,
      total: totalPrice / extensionDays,
    }

    const chargeRows = Array.from({ length: extensionDays }, (_, i) => {
      const dayIn = new Date(currentCheckoutDate)
      dayIn.setDate(currentCheckoutDate.getDate() + i)
      const dayOut = new Date(currentCheckoutDate)
      dayOut.setDate(currentCheckoutDate.getDate() + i + 1)
      return {
        guest_id: Number(item.checkin?.guest_id) || 0,
        room_id: Number(item.room_id) || 0,
        category_id: item.room_category_id ? Number(item.room_category_id) : null,
        checkin_id: Number(item.checkin_id) || 0,
        pax_count: paxCount,
        pax_price: perDayBasePrice,
        pax_tax: roomTaxAmount / extensionDays,
        ex_pax_count: item.ex_pax,
        ex_pax_price: perDay.exPaxBase,
        ex_pax_total: perDay.exPax,
        ex_pax_tax: perDay.exPaxTax,
        ex_pax_tax_percent: totalTaxPercent,
        child_count: item.child_count,
        child_price: perDay.childBase,
        child_total: perDay.child,
        child_tax: perDay.childTax,
        child_tax_percent: totalTaxPercent,
        driver_count: item.driver_count,
        driver_price: perDay.driverBase,
        driver_total: perDay.driver,
        driver_tax: perDay.driverTax,
        driver_tax_percent: totalTaxPercent,
        total_amount: perDay.total,
        checkin_datetime: formatDateTimeForMySQL(dayIn),
        checkout_datetime: formatDateTimeForMySQL(dayOut),
      }
    })

    await GuestRoomChargesService.createBulk({ charges: chargeRows })

    const fmt = (v: number) => (isNaN(Number(v)) ? '0.00' : Number(v).toFixed(2))
    const descParts = [`Day extension +${extensionDays} day(s) Room ${item.room_no}`]
    descParts.push(`Room: ₹${fmt(perDayBasePrice * extensionDays)}`)
    if ((item.discount_percent || 0) > 0) descParts.push(`-${item.discount_percent}% disc`)
    descParts.push(`+Tax ₹${fmt(roomTaxAmount)}`)
    if (exPaxCount > 0 && exPaxRatePerPerson > 0) descParts.push(`|ExPax(${exPaxCount}):₹${fmt(exPaxCharge)}`)
    if (childCount > 0 && childRatePerPerson > 0) descParts.push(`|Child(${childCount}):₹${fmt(childCharge)}`)
    if (driverCount > 0 && driverRatePerPerson > 0) descParts.push(`|Driver(${driverCount}):₹${fmt(driverCharge)}`)

    await GuestFolioService.create({
      checkin_id: item.checkin_id,
      hotelid: hotelIdVal,
      detail_id: newDetailId,
      transaction_type: 'Room Charge',
      transaction_datetime: formatDateTimeForMySQL(new Date()),
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

  const handleDayExtend = async (params: {
    extensionDays: number
    exPaxCount: number
    childCount: number
    driverCount: number
    autoExtendSiblings: boolean
  }) => {
    const { extensionDays, exPaxCount, childCount, driverCount, autoExtendSiblings } = params
    const item = extendModal.occupiedItem
    if (!item || !hotelId) return
    if (!item.detail_id || !item.room_id) {
      toast.error('Missing room detail information')
      return
    }

    const price = calculateDayExtensionPrice(item, exPaxCount, childCount, driverCount, extensionDays, item.original_pax ?? item.adults)
    setExtendingDay(true)

    try {
      const { totalPrice: primaryTotal, newCheckoutDate: primaryNewCheckoutDate } =
        await extendSingleRoom(item, extensionDays, price, exPaxCount, childCount, driverCount, hotelId, user?.id)

      let siblingTotal = 0
      const extendedRoomNos = new Set<string>([item.room_no])

      if (autoExtendSiblings && extendModal.siblingRooms.length > 0) {
        for (const sibling of extendModal.siblingRooms) {
          const siblingPrice = calculateDayExtensionPrice(sibling, sibling.ex_pax, sibling.child_count, sibling.driver_count, extensionDays, sibling.original_pax ?? sibling.adults)
          const { totalPrice: sTot } = await extendSingleRoom(sibling, extensionDays, siblingPrice, sibling.ex_pax, sibling.child_count, sibling.driver_count, hotelId, user?.id)
          siblingTotal += sTot
          extendedRoomNos.add(sibling.room_no)

          if (sibling.room_id) {
            const current = rawRooms.find((r) => r.room_id === sibling.room_id)
            if (current && current.room_status !== 'occupied') {
              await RoomService.update(sibling.room_id, { ...current, room_status: 'occupied', updated_by_id: user?.id })
              setRawRooms((prev) => prev.map((r) => r.room_id === sibling.room_id ? { ...r, room_status: 'occupied' } : r))
            }
          }
        }
      }

      if (item.room_id) {
        const current = rawRooms.find((r) => r.room_id === item.room_id)
        if (current && current.room_status !== 'occupied') {
          await RoomService.update(item.room_id, { ...current, room_status: 'occupied', updated_by_id: user?.id })
          setRawRooms((prev) => prev.map((r) => r.room_id === item.room_id ? { ...r, room_status: 'occupied' } : r))
        }
      }

      const siblingMsg = extendModal.siblingRooms.length > 0 && autoExtendSiblings
        ? ` + ${extendModal.siblingRooms.length} sibling room(s) auto-extended.`
        : ''
      toast.success(`Room ${item.room_no} extended by ${extensionDays} day(s). Charges: ${formatAmount(primaryTotal + siblingTotal)}${siblingMsg}`)
      setExtendModal({ show: false, occupiedItem: null, siblingRooms: [] })

      const todayStr = new Date().toISOString().split('T')[0]
      const newCheckoutStr = primaryNewCheckoutDate.toISOString().split('T')[0]
      if (newCheckoutStr !== todayStr) {
        setCheckoutAlertData((prev) => prev.filter((row) => !extendedRoomNos.has(row.roomNo)))
      }
      if (showCheckoutAlertTable) await fetchTodayCheckouts()
    } catch (err) {
      console.error('Failed to extend day:', err)
      toast.error((err as Error).message || 'Failed to extend day')
    } finally {
      setExtendingDay(false)
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
      setExtendModal({ show: true, occupiedItem: item, siblingRooms: siblings })
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

  const handleRoomStatusChange = async (roomId: number, newStatus: RoomStatus) => {
    if (!selectedRoom) return
    setUpdating(true)
    try {
      await RoomService.update(roomId, { ...selectedRoom.rawData, room_status: newStatus, updated_by_id: user?.id })
      setRawRooms((prev) => prev.map((r) => r.room_id === roomId ? { ...r, room_status: newStatus } : r))
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

  // Housekeeping helpers
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

  // Export helpers
  const exportReservTableToExcel = (data: ReservTableRow[], filename: string) => {
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

  const getStatusLabel = (status: RoomStatus): string => {
    const labels: Record<RoomStatus, string> = {
      available: 'Vacant',
      occupied: 'Occupied',
      cleaning: 'Cleaning',
      Bill: 'Bill',
      reserved: 'Reserved',
      maintenance: 'Maintenance',
      reservation: 'Reservation',
    }
    return labels[status] ?? 'Unknown'
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
        /* ---- Room tiles ---- */
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

        /* ---- Occupied tiles ---- */
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

        /* ---- Tables ---- */
        .checkout-table, .reserv-section-table { width: 100%; border-collapse: collapse; font-size: 0.70rem; }
        .checkout-table th { position: sticky; top: 0; background-color: #dfdfdf; font-weight: 550; z-index: 10; padding: 0.35rem; }
        .checkout-table td { border: 1px solid #dee2e6; padding: 0.35rem; text-align: left; }
        .reserv-section-table th, .reserv-section-table td { border: 1px solid #dee2e6; padding: 4px 7px; white-space: nowrap; }
        .reserv-section-table thead tr { background: #f1f5fb; font-weight: 600; position: sticky; top: 0; z-index: 1; }
        .reserv-section-table tbody tr:hover { background: #f8f9fa; }
        .reserv-section-table tfoot tr td { background: #f1f5fb; }
        body.dark-mode th { background-color: #2c2c2c; color: #eee; }
        body.dark-mode .checkout-table td { border-color: #444; }
        .text-red { color: red !important; font-weight: bold; }

        /* ---- Housekeeping ---- */
        .housekeeping-section { border: 1px solid #e0e0e0; margin-bottom: 0.3rem; background-color: #fff; }
        .housekeeping-section-header {
          background-color: #f8f9fa; padding: 0.3rem 0.5rem; font-weight: 500;
          font-size: 0.78rem; border-bottom: 1px solid #e0e0e0;
          display: flex; align-items: center; justify-content: space-between;
        }
        .housekeeping-section-header-left { display: flex; align-items: center; gap: 0.5rem; }
        
        /* Housekeeping body containers */
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

        /* Base HK Room Card */
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

        /* Dirty Room Cards - Yellow Theme */
        .dirty-room-card {
          border: 1.5px solid #FACC15; 
          background: #FFF4CC;
        }
        .dirty-room-card:hover { border-color: #D4A017; box-shadow: 0 2px 8px rgba(212,160,23,0.3); }
        .dirty-room-card.selected { border-color: #D4A017; background: #FEF08A; box-shadow: 0 0 0 2px #FACC1555; }
        .dirty-room-card .hk-checkbox { accent-color: #D4A017; }
        .dirty-room-card .room-number { color: #92610A; }
        .dirty-room-card .room-category { color: #92610A; }

        /* Blocked Room Cards - Blue Theme */
        .block-room-card {
          border: 1.5px solid #38BDF8; 
          background: #D9F1FF;
        }
        .block-room-card:hover { border-color: #0284C7; box-shadow: 0 2px 8px rgba(2,132,199,0.3); }
        .block-room-card.selected { border-color: #0284C7; background: #BAE6FD; box-shadow: 0 0 0 2px #38BDF855; }
        .block-room-card .hk-checkbox { accent-color: #0284C7; }
        .block-room-card .room-number { color: #0369A1; }
        .block-room-card .room-category { color: #0369A1; }

        /* Maintenance Room Cards - Red Theme */
        .maint-room-card {
          border: 1.5px solid #F87171; 
          background: #FFE0E0;
        }
        .maint-room-card:hover { border-color: #DC2626; box-shadow: 0 2px 8px rgba(220,38,38,0.3); }
        .maint-room-card.selected { border-color: #DC2626; background: #FECACA; box-shadow: 0 0 0 2px #F8717155; }
        .maint-room-card .hk-checkbox { accent-color: #DC2626; }
        .maint-room-card .room-number { color: #991B1B; }
        .maint-room-card .room-category { color: #991B1B; }

        /* ---- Misc ---- */
        .group-box {
          width: 90px; background-color: #E5E7EB !important; border: 1px solid #5e5e5e !important;
          color: #606060 !important; display: flex; justify-content: center; align-items: center;
          text-align: center; padding: 5px; word-break: break-word; white-space: normal;
        }
        .same-btn { min-width: 40px; text-align: center; }
        .status-footer { position: sticky; bottom: 0; background-color: #f8f9fa; border-top: 2px solid #dee2e6; font-weight: bold; }
        body.dark-mode .status-footer { background-color: #2a2a2a; border-top-color: #444; }

        /* ---- Scrollbar ---- */
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
                <Button size="sm" variant={showReservSection ? 'secondary' : 'outline-secondary'} className="fw-semibold px-3 same-btn"
                  onClick={() => {
                    if (showReservSection) setActiveSection(null)
                    else { setActiveSection('reserv'); fetchReservTableData(reservDate) }
                  }}>
                  <i className="fi fi-rr-calendar me-1"></i>Reservation [{stats.reservation}]
                </Button>
                <Button size="sm" variant="outline-info" className="fw-semibold px-3 same-btn text-nowrap"
                  onClick={() => navigate('/hotel/arrivals')}>
                  <i className="fi fi-rr-plane-arrival me-1"></i>Arrivals
                </Button>
                <Button size="sm" variant="outline-success" className="fw-semibold px-3 same-btn"
                  onClick={() => navigate('/hotel/settlement')}>
                  <i className="fi fi-rr-money-check me-1"></i>Settlement
                </Button>
                <Button size="sm" variant="outline-secondary" className="fw-semibold px-3 same-btn"
                  onClick={() => navigate('/hotel/reservation')}>
                  Reservation Form
                </Button>
              </div>

              <div className="d-flex flex-wrap gap-2">
                <Button size="sm" variant="outline-primary" className="fw-semibold text-nowrap px-3"
                  onClick={() => navigate('/hotel/at-glance')}>
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
                  {/* Dirty Rooms */}
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

                  {/* Blocked Rooms */}
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

                  {/* Maintenance Rooms */}
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
            : showReservSection ? (
            /* Reservations Table */
            <div className="checkout-table-container d-flex flex-column" style={{ width: '100%' }}>
              <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                <h6 className="mb-0 fw-bold">
                  <i className="fi fi-rr-calendar me-2 text-primary"></i>
                  Today's Reservations —{' '}
                  {new Date(reservDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </h6>
                <div className="d-flex align-items-center gap-2">
                  <Form.Control type="date" size="sm" value={reservDate} style={{ width: 'auto' }}
                    onChange={(e) => { setReservDate(e.target.value); fetchReservTableData(e.target.value) }} />
                  <Button variant="success" size="sm" className="fw-normal px-3"
                    onClick={() => handlePrintTable('.reserv-section-table', "Today's Reservations")}>
                    <i className="fi fi-rr-print me-1"></i>Print
                  </Button>
                  <Dropdown>
                    <Dropdown.Toggle variant="primary" size="sm" className="fw-normal px-2">
                      <i className="fi fi-rr-download me-1"></i>Export
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={() => exportTableToPdf('.reserv-section-table', "Today's Reservations", 'todays-reservations.pdf')}>
                        <i className="fi fi-rr-file-pdf me-2"></i>PDF
                      </Dropdown.Item>
                      <Dropdown.Item onClick={() => exportReservTableToExcel(reservTableData, 'reservations.xlsx')}>
                        <i className="fi fi-rr-file-excel me-2"></i>Excel
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              </div>

              {loadingReservTable ? (
                <div className="d-flex justify-content-center py-5">
                  <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading…</span></div>
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
                        <th>#</th><th>Res. No</th><th>Guest Name</th><th>Mobile No</th>
                        <th>Room Category</th><th>Convert Category</th><th>Total Days</th>
                        <th>Arrival Date & Time</th><th>Departure Date & Time</th>
                        <th>Rooms</th><th>Room Tariff</th><th>Pax</th><th>Ex-Pax</th>
                        <th>Child</th><th>Driver</th><th>Total Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reservTableData.map((r, idx) => (
                        <tr key={`${r.reservation_id}-${idx}`}>
                          <td className="text-center">{idx + 1}</td>
                          <td>{r.reservation_no}</td>
                          <td>{r.guest_name}</td>
                          <td>{r.phone1}</td>
                          <td>{r.room_category_name}</td>
                          <td>{r.converted_category_name}</td>
                          <td className="text-center">{r.nights || '-'}</td>
                          <td>{r.arrival_date} {r.arrival_time}</td>
                          <td>{r.departure_date} {r.departure_time}</td>
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
            /* Checkout Table */
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
            /* Occupied Rooms Grid */
            loadingOccupied && occupiedRooms.length === 0 ? (
              <div className="d-flex justify-content-center align-items-center py-5">
                <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
              </div>
            ) : errorOccupied ? (
              <div className="text-center py-5">
                <i className="fi fi-rr-exclamation text-danger fs-4 mb-3 d-block"></i>
                <p className="text-danger">{errorOccupied}</p>
                <Button variant="outline-primary" size="sm" onClick={() => setStatusFilter('occupied')}>Retry</Button>
              </div>
            ) : occupiedRooms.length === 0 ? (
              <div className="text-center py-5">
                <i className="fi fi-rr-bed-empty text-muted fs-4 mb-4 d-block"></i>
                <p className="text-muted mb-0">No occupied rooms found.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '6px', alignContent: 'start', padding: '0 8px', width: '100%' }}>
                {occupiedRooms.map((item) => {
                  const minutesLeft = getMinutesLeft(item.checkout_datetime)
                  const isNear = minutesLeft <= 30 && minutesLeft > 0
                  const isExpired = minutesLeft <= 0
                  
                  const tileStyle = isExpired
                    ? {
                        backgroundColor: uiSettings.occupied_expired_bg || '#E03F4F',
                        color: uiSettings.occupied_expired_text || '#ffffff',
                      }
                    : isNear
                    ? {
                        backgroundColor: uiSettings.occupied_warning_bg || '#b96eff',
                        color: uiSettings.occupied_warning_text || '#ffffff',
                      }
                    : {
                        backgroundColor: uiSettings.color_occupied,
                        color: uiSettings.text_color_occupied || DEFAULT_UI.text_color_occupied!,
                      }
                  
                  const netRoomAmount = item.net_room_amount ?? 0
                  const netAllRoomsAmount = item.total_all_rooms_net ?? 0
                  const pendingAdvance = item.pending_advance_for_room || 0
                  const bookingType = item.booking_type || 'WALK-IN-GUEST'
                  const totalAllowances = item.total_allowances || 0
                  const leftIsNegative = netRoomAmount < 0

                  return (
                    <div
                      key={`${item.checkin_id}-${item.room_no}`}
                      className={`occupied-tile ${isNear ? 'occupied-tile-checkout-near' : ''}`}
                      onClick={() => handleOccupiedRoomClick(item)}
                      onContextMenu={(e) => handleContextMenu(e, item)}
                      style={{ 
                        border: `2px solid ${
                          isExpired 
                            ? uiSettings.occupied_expired_bg || '#E03F4F'
                            : isNear 
                            ? uiSettings.occupied_warning_bg || '#b96eff'
                            : '#4ADE80'
                        }` 
                      }}>
                      <div className="occupied-header">{item.room_no} {item.guest_name}</div>
                      <div className="occupied-body" style={{ backgroundColor: tileStyle.backgroundColor, color: tileStyle.color }}>
                        <div>IN : {formatDateTime(item.checkin_datetime)}</div>
                        <div>OUT : {formatDateTime(item.checkout_datetime)}</div>
                        <div>{bookingType === 'AGENT' && item.agent_name ? item.agent_name : item.guest_type}</div>
                        <div className="charges-line">
                          <span style={{ color: '#000', fontWeight: leftIsNegative || pendingAdvance > 0 ? 600 : 'normal' }}>
                            {formatAmount(netRoomAmount)}
                          </span>
                          <span style={{ color: '#000' }}>{formatAmount(netAllRoomsAmount)}</span>
                        </div>
                        {totalAllowances > 0 && (
                          <div style={{ fontSize: '0.6rem', color: '#c0392b', fontWeight: 600, display: 'flex', justifyContent: 'space-between', marginTop: '1px' }}>
                            <span>Alw: -{formatAmount(totalAllowances)}</span>
                            <span>Net: {formatAmount(netRoomAmount)}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.65rem' }}>
                          <span>
                            {item.original_pax ?? item.adults}
                            <span style={{ opacity: 0.5 }}>:</span>{item.ex_pax}
                            <span style={{ opacity: 0.5 }}>:</span>{item.child_count}
                            <span style={{ opacity: 0.5 }}>:</span>{item.driver_count}
                          </span>
                          <span>| {item.payment_method}</span>
                        </div>
                      </div>
                    </div>
                  )
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
            /* Room tiles grid */
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
            <Button size="sm" variant="success" className="fw-semibold px-4"
              onClick={() => {
                if (showCheckoutAlertTable) setActiveSection(null)
                else { setActiveSection('checkout'); fetchTodayCheckouts() }
              }}>
              {showCheckoutAlertTable ? 'Back to Rooms' : 'Today Check Out'}
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
        show={extendModal.show}
        occupiedItem={extendModal.occupiedItem}
        siblingRooms={extendModal.siblingRooms}
        extending={extendingDay}
        onHide={() => setExtendModal({ show: false, occupiedItem: null, siblingRooms: [] })}
        onExtend={handleDayExtend}
      />

      <Modal show={showRoomDetails} onHide={() => setShowRoomDetails(false)} centered size="sm"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <Modal.Header closeButton className="border-0 pb-0"><Modal.Title>Room Details</Modal.Title></Modal.Header>
        <Modal.Body onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          {selectedRoom && (
            <div>
              <div className="text-center mb-3">
                <div className="bg-light rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style={{ width: 60, height: 60 }}>
                  <i className="fi fi-rr-bed fs-4 text-primary"></i>
                </div>
                <h5 className="mb-1">{selectedRoom.number}</h5>
                <span className="badge px-3 py-1" style={{
                  backgroundColor: selectedRoom.backgroundColor,
                  color: selectedRoom.textColor,
                  border: `1px solid ${selectedRoom.borderColor}`,
                }}>
                  {getStatusLabel(selectedRoom.status)}
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
                {isVacant(selectedRoom) && (
                  <Button variant="success" disabled={updating} onClick={() => handleRoomStatusChange(selectedRoom.id, 'occupied')}>
                    <i className="fi fi-rr-check me-1"></i>Book Now
                  </Button>
                )}
                {isOccupied(selectedRoom) && (
                  <Button variant="outline-danger" disabled={updating} onClick={() => handleRoomStatusChange(selectedRoom.id, 'cleaning')}>
                    <i className="fi fi-rr-door-open me-1"></i>Check Out
                  </Button>
                )}
                {isCleaning(selectedRoom) && (
                  <Button variant="warning" disabled={updating} onClick={() => handleRoomStatusChange(selectedRoom.id, 'available')}>
                    <i className="fi fi-rr-cleaning-bucket me-1"></i>Mark Clean
                  </Button>
                )}
                {isReserved(selectedRoom) && (
                  <Button variant="primary" disabled={updating} onClick={() => handleRoomStatusChange(selectedRoom.id, 'occupied')}>
                    <i className="fi fi-rr-user me-1"></i>Check In
                  </Button>
                )}
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

      {/* Context Menu */}
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
        show={showRoomStatusModal}
        onHide={() => { setShowRoomStatusModal(false); setSelectedRoomForStatus(null) }}
        room={selectedRoomForStatus}
        hotelId={hotelId || 0}
        userId={user?.id}
        onSuccess={async () => { setShowRoomStatusModal(false); setSelectedRoomForStatus(null) }}
      />

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