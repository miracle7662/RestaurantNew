// ReservationSummaryPage.tsx
import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Modal } from 'react-bootstrap'
import TitleHelmet from '@/components/Common/TitleHelmet'
import { useAuthContext } from '@/common/context/useAuthContext'
import ReservationService from '@/common/hotel/reservation'
import ReservationRoomService from '@/common/hotel/reservationRooms'
import RoomCategoryService from '@/common/hotel/roomCategoryService'
import RoomService from '@/common/hotel/room'
import { FiRefreshCw, FiClock, FiUser, FiHome, FiCalendar, FiCheckCircle, FiXCircle } from 'react-icons/fi'

// Shape returned per category by GET /rooms/live-room-availability
interface LiveCategoryAvailability {
  room_category_id: number
  category_name: string
  total_rooms: number
  available_rooms: number
  occupied_rooms: number
  bill_pending_rooms?: number
  reserved_rooms: number
  blocked_rooms?: number
  available_from: string | null // ISO datetime; null = already has availability / unknown
}

// Individual room status
interface RoomStatus {
  room_id: number
  room_number: string
  room_category_id: number
  category_name: string
  status: 'available' | 'occupied' | 'reserved' | 'blocked' | 'maintenance'
  guest_name?: string
  checkout_time?: string
  arrival_date?: string
  departure_date?: string
  reservation_id?: number
  reservation_no?: string
  available_from?: string
}

// How often to refresh the live availability strip while this page is open.
const LIVE_REFRESH_INTERVAL_MS = 20000
const ROOM_STATUS_REFRESH_INTERVAL_MS = 60000

const formatDateTimeShort = (iso: string | null) => {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const formatTime = (iso: string | null) => {
  if (!iso) return null
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}

const ReservationSummaryPage = () => {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const hotelId = user?.hotelid

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rawReservations, setRawReservations] = useState<any[]>([])
  const [rawReservationRooms, setRawReservationRooms] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])

  // Calendar states
  const [calendarDate, setCalendarDate] = useState(new Date())
  const [selectedArrivalDate, setSelectedArrivalDate] = useState<string | null>(null)
  const [showReservationDetailModal, setShowReservationDetailModal] = useState(false)

  // Live room-availability states (right now, refreshed on an interval)
  const [liveAvailability, setLiveAvailability] = useState<LiveCategoryAvailability[]>([])
  const [liveLoading, setLiveLoading] = useState(true)
  const [liveError, setLiveError] = useState<string | null>(null)
  const [liveUpdatedAt, setLiveUpdatedAt] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Room status states
  const [roomStatuses, setRoomStatuses] = useState<RoomStatus[]>([])
  const [roomStatusLoading, setRoomStatusLoading] = useState(true)
  const [roomStatusError, setRoomStatusError] = useState<string | null>(null)
  const [roomStatusUpdatedAt, setRoomStatusUpdatedAt] = useState<Date | null>(null)

  // Fetch categories and hotel name
  useEffect(() => {
    if (!hotelId) return
    const fetchCategories = async () => {
      try {
        const res = await RoomCategoryService.list({ hotelid: Number(hotelId) })
        setCategories(res.data || [])
      } catch (err) {
        console.error('Failed to fetch categories:', err)
      }
    }
    fetchCategories()
  }, [hotelId])

  // Fetch reservation data
  const fetchReservationSummary = async () => {
    if (!hotelId) return
    setLoading(true)
    setError(null)
    try {
      const res = await ReservationService.list({ hotelid: hotelId })
      const reservations = res.data || []
      const reservationRoomsPromises = reservations.map((r: any) =>
        ReservationRoomService.list({ reservation_id: r.reservation_id }),
      )
      const reservationRoomsResults = await Promise.all(reservationRoomsPromises)
      const allReservationRooms = reservationRoomsResults.flatMap((r) => r.data || [])
      setRawReservations(reservations)
      setRawReservationRooms(allReservationRooms)
    } catch (err) {
      console.error('Failed to fetch reservation summary:', err)
      setError('Could not load reservation summary. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReservationSummary()
  }, [hotelId])

  // Fetch LIVE, right-now room availability
  const fetchLiveAvailability = useCallback(async () => {
    if (!hotelId) return
    try {
      const res = await RoomService.getLiveRoomAvailability(hotelId)
      const payload: any = res?.data
      setLiveAvailability(payload?.categories || payload?.data?.categories || [])
      setLiveUpdatedAt(new Date())
      setLiveError(null)
    } catch (err) {
      console.error('Failed to fetch live room availability:', err)
      setLiveError('Live availability could not be loaded.')
    } finally {
      setLiveLoading(false)
      setIsRefreshing(false)
    }
  }, [hotelId])

  // Fetch room statuses with detailed information
  const fetchRoomStatuses = useCallback(async () => {
    if (!hotelId) return
    setRoomStatusLoading(true)
    try {
      // This would be a new API endpoint or enhanced version of getLiveRoomAvailability
      // For now, we'll simulate it with the existing data
      const res = await RoomService.getLiveRoomAvailability(hotelId)
      const payload: any = res?.data
      const categories = payload?.categories || payload?.data?.categories || []
      
      // Transform the data into room status format
      // In a real implementation, you'd have a dedicated endpoint that returns individual room statuses
      const rooms: RoomStatus[] = []
      
      // For demonstration, we'll create room statuses from the category data
      // In production, you'd get this from a proper room status endpoint
      categories.forEach((cat: any) => {
        // Generate individual room entries based on category data
        const totalRooms = cat.total_rooms || 0
        const occupiedRooms = cat.occupied_rooms || 0
        const reservedRooms = cat.reserved_rooms || 0
        
        // Simulate individual rooms
        for (let i = 1; i <= totalRooms; i++) {
          let status: RoomStatus['status'] = 'available'
          let guestName = undefined
          let checkoutTime = undefined
          let availableFrom = undefined
          
          if (i <= occupiedRooms) {
            status = 'occupied'
            guestName = `Guest ${i}` // In real implementation, this would come from reservation data
            checkoutTime = new Date(Date.now() + 11 * 60 * 60 * 1000).toISOString() // 11 AM checkout
          } else if (i <= occupiedRooms + reservedRooms) {
            status = 'reserved'
            guestName = `Guest ${i}` // In real implementation, this would come from reservation data
          } else if (i <= totalRooms - cat.available_rooms) {
            status = 'blocked'
          } else {
            status = 'available'
          }
          
          rooms.push({
            room_id: i,
            room_number: `${cat.category_name.substring(0, 2)}-${String(i).padStart(2, '0')}`,
            room_category_id: cat.room_category_id,
            category_name: cat.category_name,
            status,
            guest_name: guestName,
            checkout_time: checkoutTime,
            available_from: status === 'occupied' ? cat.available_from : undefined,
          })
        }
      })
      
      setRoomStatuses(rooms)
      setRoomStatusUpdatedAt(new Date())
      setRoomStatusError(null)
    } catch (err) {
      console.error('Failed to fetch room statuses:', err)
      setRoomStatusError('Room status could not be loaded.')
    } finally {
      setRoomStatusLoading(false)
    }
  }, [hotelId])

  useEffect(() => {
    fetchLiveAvailability()
    const intervalId = setInterval(fetchLiveAvailability, LIVE_REFRESH_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [fetchLiveAvailability])

  // Fetch room statuses when modal opens
  useEffect(() => {
    if (showReservationDetailModal) {
      fetchRoomStatuses()
      const intervalId = setInterval(fetchRoomStatuses, ROOM_STATUS_REFRESH_INTERVAL_MS)
      return () => clearInterval(intervalId)
    }
  }, [showReservationDetailModal, fetchRoomStatuses])

  // Data processing for calendar
  const arrivalsByDate = useMemo(() => {
    if (!rawReservations.length) return new Map<string, any[]>()

    const resRoomsMap = new Map<number, any[]>()
    rawReservationRooms.forEach((room: any) => {
      if (!resRoomsMap.has(room.reservation_id)) {
        resRoomsMap.set(room.reservation_id, [])
      }
      resRoomsMap.get(room.reservation_id)!.push(room)
    })

    const map = new Map<string, any[]>()
    rawReservations.forEach((res: any) => {
      const arrival = res.arrival_date
      if (!arrival) return
      const roomsForRes = resRoomsMap.get(res.reservation_id) || []
      const totalRooms = roomsForRes.reduce((sum: number, room: any) => sum + (room.total_rooms || 1), 0)
      const catIds = [...new Set(roomsForRes.map((r: any) => r.room_category_id))]
      const catNames =
        catIds
          .map((id: number) => {
            const cat = categories.find((c: any) => c.room_category_id === id)
            return cat ? cat.category_name : 'Unknown'
          })
          .join(', ') || 'N/A'

      const nights = res.nights || 1

      const item = {
        reservation_id: res.reservation_id,
        reservation_no: res.reservation_no,
        guest_name: res.reservation_name || 'Guest',
        arrival_date: arrival,
        departure_date: res.departure_date || arrival,
        total_rooms: totalRooms,
        categories: catNames,
        nights: nights,
      }

      if (!map.has(arrival)) map.set(arrival, [])
      map.get(arrival)!.push(item)
    })
    return map
  }, [rawReservations, rawReservationRooms, categories])

  const calendarDaysData = useMemo(() => {
    const year = calendarDate.getFullYear()
    const month = calendarDate.getMonth()
    const firstOfMonth = new Date(year, month, 1)
    const firstWeekday = firstOfMonth.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const daysList: any[] = []
    for (let i = 0; i < firstWeekday; i++) {
      daysList.push({ padding: true })
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const thisDate = new Date(year, month, d)
      const isPast = thisDate < today
      const arrivals = arrivalsByDate.get(dateStr) || []
      const count = arrivals.length
      const hasRes = count > 0
      daysList.push({
        day: d,
        dateStr,
        isPast,
        hasRes,
        count,
      })
    }
    while (daysList.length % 7 !== 0) {
      daysList.push({ padding: true })
    }
    return daysList
  }, [calendarDate, arrivalsByDate])

  // Category-wise availability summary for the currently SELECTED date
  const categoryAvailabilityForSelectedDate = useMemo(() => {
    if (!selectedArrivalDate) return []

    const resById = new Map<number, any>()
    rawReservations.forEach((r: any) => resById.set(r.reservation_id, r))

    const catMap = new Map<number, { occupiedRooms: number; reservedRooms: number; departures: string[] }>()

    rawReservationRooms.forEach((room: any) => {
      const res = resById.get(room.reservation_id)
      if (!res) return

      const arrival = res.arrival_date
      const departure = res.departure_date || arrival
      if (!arrival) return

      const isOccupiedOnDate = arrival <= selectedArrivalDate && selectedArrivalDate < departure
      const isArrivingOnDate = arrival === selectedArrivalDate

      if (!isOccupiedOnDate && !isArrivingOnDate) return

      const catId = room.room_category_id
      const roomsCount = room.total_rooms || 1

      if (!catMap.has(catId)) {
        catMap.set(catId, { occupiedRooms: 0, reservedRooms: 0, departures: [] })
      }
      const entry = catMap.get(catId)!

      if (isOccupiedOnDate) {
        entry.occupiedRooms += roomsCount
        entry.departures.push(departure)
      }
      if (isArrivingOnDate) {
        entry.reservedRooms += roomsCount
      }
    })

    return categories.map((cat: any) => {
      const catId = cat.room_category_id
      const totalRooms = cat.total_rooms ?? cat.no_of_rooms ?? 0
      const entry = catMap.get(catId) || { occupiedRooms: 0, reservedRooms: 0, departures: [] }
      const availableRooms = Math.max(totalRooms - entry.occupiedRooms, 0)

      let nextAvailableDate: string | null = null
      if (availableRooms <= 0 && entry.departures.length) {
        nextAvailableDate = [...entry.departures].sort()[0]
      }

      return {
        category_id: catId,
        category_name: cat.category_name,
        totalRooms,
        occupiedRooms: entry.occupiedRooms,
        reservedRooms: entry.reservedRooms,
        availableRooms,
        nextAvailableDate,
      }
    })
  }, [selectedArrivalDate, rawReservations, rawReservationRooms, categories])

  // Navigation handlers
  const handlePrevMonth = () => {
    setCalendarDate((prev) => {
      const newD = new Date(prev)
      newD.setMonth(newD.getMonth() - 1)
      return newD
    })
  }

  const handleNextMonth = () => {
    setCalendarDate((prev) => {
      const newD = new Date(prev)
      newD.setMonth(newD.getMonth() + 1)
      return newD
    })
  }

  const handleCurrentMonth = () => {
    setCalendarDate(new Date())
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchLiveAvailability()
    if (showReservationDetailModal) {
      fetchRoomStatuses()
    }
  }

  // Get status badge color
  const getStatusBadge = (status: RoomStatus['status']) => {
    switch (status) {
      case 'available':
        return { bg: 'bg-success', text: 'Available', icon: <FiCheckCircle className="me-1" /> }
      case 'occupied':
        return { bg: 'bg-warning', text: 'Occupied', icon: <FiUser className="me-1" /> }
      case 'reserved':
        return { bg: 'bg-info', text: 'Reserved', icon: <FiCalendar className="me-1" /> }
      case 'blocked':
        return { bg: 'bg-danger', text: 'Blocked', icon: <FiXCircle className="me-1" /> }
      case 'maintenance':
        return { bg: 'bg-secondary', text: 'Maintenance', icon: <FiClock className="me-1" /> }
      default:
        return { bg: 'bg-secondary', text: 'Unknown', icon: null }
    }
  }

  return (
    <>
      <TitleHelmet title="Reservation Summary" />
      <style>{`
        /* Styles copied from original */
        .res-summary-container {
          padding: 1rem;
          overflow-x: auto;
          height: 100%;
          background-color: #fff;
        }
        body.dark-mode .res-summary-container {
          background-color: #121212;
        }
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .total-res-badge {
          background-color: #e9ecef;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
        }
        body.dark-mode .total-res-badge {
          background-color: #2c2c2c;
          color: #eee;
        }
        .calendar-month-nav {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        .calendar-container {
          background: #fff;
          border-radius: 8px;
          padding: 0.5rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          height: 543px;
          overflow-y: auto;
        }
        body.dark-mode .calendar-container {
          background: #2a2a2a;
        }
        .calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 4px;
          margin-bottom: 4px;
        }
        .calendar-weekdays div {
          text-align: center;
          font-weight: 600;
          font-size: 0.7rem;
          color: #666;
          padding: 4px 0;
        }
        body.dark-mode .calendar-weekdays div { color: #ccc; }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
          height: calc(100% - 40px);
        }
        .calendar-day {
          border: 1px solid #ddd;
          border-radius: 0px;
          padding: 6px 4px;
          text-align: center;
          min-height: 78px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: all 0.1s ease;
          font-size: 0.7rem;
          cursor: pointer;
          background-color: #ffffff;
        }
        body.dark-mode .calendar-day { border-color: #555; background-color: #1e1e1e; color: #ddd; }
        .calendar-day.reserved-day {
          background-color: #cacaca !important;
          color: #000000 !important;
          font-weight: 600;
        }
        .calendar-day.past-day {
          background-color: #e9ecef !important;
          color: #adb5bd !important;
          cursor: not-allowed;
          opacity: 0.7;
        }
        body.dark-mode .calendar-day.past-day {
          background-color: #3a3a3a !important;
          color: #777 !important;
        }
        .calendar-day.today {
          border: 2px solid #ffffff !important;
        }
        .calendar-day.empty {
          background: transparent;
          border: none;
          min-height: 60px;
        }
        .day-number {
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 2px;
        }
        .reservation-count {
          font-size: 0.7rem;
          background-color: rgb(194, 194, 194);
          color: inherit;
          padding: 2px 6px;
          border-radius: 16px;
          font-weight: 500;
        }
        .reservation-detail-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.75rem;
        }
        .reservation-detail-table th,
        .reservation-detail-table td {
          border: 1px solid #dee2e6;
          padding: 0.5rem;
          text-align: left;
        }
        .reservation-detail-table th {
          background-color: #cacaca;
          font-weight: 600;
        }
        body.dark-mode .reservation-detail-table th {
          background-color: #2c2c2c;
          color: #eee;
        }
        body.dark-mode .reservation-detail-table td {
          border-color: #444;
        }

        /* ===================== Live availability panel (modern) ===================== */
        .live-panel {
          border: 1px solid #eceff2;
          border-radius: 14px;
          background: linear-gradient(180deg, #fbfcfe 0%, #f6f8fa 100%);
          padding: 14px 16px 16px;
          margin-bottom: 1.1rem;
          box-shadow: 0 1px 2px rgba(16, 24, 40, 0.04);
        }
        body.dark-mode .live-panel {
          background: linear-gradient(180deg, #1c1c1e 0%, #191919 100%);
          border-color: #333;
        }
        .live-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 6px;
        }
        .live-panel-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          letter-spacing: 0.01em;
          color: #1f2937;
        }
        body.dark-mode .live-panel-title { color: #eee; }
        .live-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: #e9fbf1;
          color: #0f9d58;
          font-size: 0.62rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          padding: 3px 8px 3px 6px;
          border-radius: 999px;
          text-transform: uppercase;
        }
        body.dark-mode .live-badge { background: rgba(15,157,88,0.15); }
        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: #0f9d58;
          display: inline-block;
          animation: live-pulse 1.6s infinite;
        }
        @keyframes live-pulse {
          0% { box-shadow: 0 0 0 0 rgba(15,157,88,0.5); }
          70% { box-shadow: 0 0 0 5px rgba(15,157,88,0); }
          100% { box-shadow: 0 0 0 0 rgba(15,157,88,0); }
        }
        .live-updated-at {
          font-size: 0.68rem;
          color: #9aa1ab;
        }

        .live-availability-strip {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
          gap: 10px;
        }

        .live-availability-card {
          position: relative;
          border: 1px solid #edf0f3;
          border-radius: 12px;
          padding: 12px 14px 13px;
          background-color: #ffffff;
          font-size: 0.75rem;
          box-shadow: 0 1px 3px rgba(16, 24, 40, 0.05);
          overflow: hidden;
          transition: box-shadow 0.15s ease, transform 0.15s ease;
        }
        .live-availability-card:hover {
          box-shadow: 0 4px 14px rgba(16, 24, 40, 0.09);
          transform: translateY(-1px);
        }
        body.dark-mode .live-availability-card {
          background-color: #232326;
          border-color: #3a3a3d;
        }
        .live-availability-card.state-full {
          border-color: #fbd0d0;
        }
        .live-availability-card .accent-bar {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 3px;
          background: #0f9d58;
        }
        .live-availability-card.state-full .accent-bar { background: #e34d4d; }

        .live-availability-card .cat-name {
          font-weight: 700;
          font-size: 0.82rem;
          color: #1f2937;
          margin: 3px 0 10px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        body.dark-mode .live-availability-card .cat-name { color: #f1f1f1; }

        .live-availability-card .available-headline {
          display: flex;
          align-items: baseline;
          gap: 5px;
          margin-bottom: 10px;
        }
        .live-availability-card .available-number {
          font-size: 1.55rem;
          font-weight: 800;
          line-height: 1;
          color: #0f9d58;
        }
        .live-availability-card.state-full .available-number { color: #e34d4d; }
        .live-availability-card .available-label {
          font-size: 0.66rem;
          color: #8b93a1;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .occ-bar-track {
          width: 100%;
          height: 6px;
          border-radius: 999px;
          background: #eef0f3;
          overflow: hidden;
          margin-bottom: 8px;
        }
        body.dark-mode .occ-bar-track { background: #38383b; }
        .occ-bar-fill {
          height: 100%;
          border-radius: 999px;
          background: linear-gradient(90deg, #ffb547, #ff7a45);
          transition: width 0.3s ease;
        }
        .occ-bar-fill.is-full { background: linear-gradient(90deg, #ff7a45, #e34d4d); }

        .live-availability-card .meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.68rem;
          color: #6b7280;
          margin-bottom: 3px;
        }
        body.dark-mode .live-availability-card .meta-row { color: #a2a2a5; }
        .live-availability-card .meta-row strong {
          color: #374151;
          font-weight: 700;
        }
        body.dark-mode .live-availability-card .meta-row strong { color: #e5e5e5; }

        .next-free-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          margin-top: 8px;
          padding: 4px 8px;
          border-radius: 8px;
          background: #fff4e8;
          color: #b5680b;
          font-size: 0.66rem;
          font-weight: 600;
          width: 100%;
          box-sizing: border-box;
        }
        body.dark-mode .next-free-chip { background: rgba(181,104,11,0.15); color: #f0a94e; }

        /* Category-wise availability summary (shown in modal header) */
        .category-availability-summary {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-top: 0.75rem;
        }
        .category-availability-card {
          border: 1px solid #dee2e6;
          border-radius: 8px;
          padding: 6px 10px;
          background-color: #f8f9fa;
          min-width: 160px;
          font-size: 0.72rem;
        }
        body.dark-mode .category-availability-card {
          background-color: #2c2c2c;
          border-color: #444;
        }
        .category-availability-card .cat-name {
          font-weight: 700;
          font-size: 0.78rem;
          margin-bottom: 4px;
        }
        .category-availability-card .cat-stats {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .category-availability-card .stat {
          display: block;
        }
        .category-availability-card .stat.available.text-success {
          color: #198754;
          font-weight: 600;
        }
        .category-availability-card .stat.available.text-danger {
          color: #dc3545;
          font-weight: 600;
        }
        .category-availability-card .stat.next-available {
          color: #fd7e14;
          font-style: italic;
        }

        /* Room Status Cards Styles */
        .room-status-section {
          margin-top: 1rem;
          border-top: 1px solid #dee2e6;
          padding-top: 1rem;
        }
        body.dark-mode .room-status-section {
          border-top-color: #444;
        }
        .room-status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 12px;
          margin-top: 12px;
          max-height: 500px;
          overflow-y: auto;
          padding-right: 4px;
        }
        .room-status-grid::-webkit-scrollbar {
          width: 6px;
        }
        .room-status-grid::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        .room-status-grid::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }
        body.dark-mode .room-status-grid::-webkit-scrollbar-track {
          background: #2a2a2a;
        }
        body.dark-mode .room-status-grid::-webkit-scrollbar-thumb {
          background: #555;
        }
        .room-status-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 14px 16px;
          background-color: #ffffff;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          transition: all 0.2s ease;
        }
        .room-status-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          transform: translateY(-2px);
        }
        body.dark-mode .room-status-card {
          background-color: #1e1e1e;
          border-color: #3a3a3d;
        }
        .room-status-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .room-status-header .room-number {
          font-weight: 700;
          font-size: 0.95rem;
          color: #1f2937;
        }
        body.dark-mode .room-status-header .room-number {
          color: #f1f1f1;
        }
        .room-status-header .category-name {
          font-size: 0.7rem;
          color: #6b7280;
          background: #f3f4f6;
          padding: 2px 8px;
          border-radius: 12px;
        }
        body.dark-mode .room-status-header .category-name {
          background: #2c2c2c;
          color: #a0a0a0;
        }
        .room-status-badge {
          display: inline-flex;
          align-items: center;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 3px 10px;
          border-radius: 20px;
          margin-bottom: 8px;
        }
        .room-status-badge.bg-success {
          background-color: #d1fae5 !important;
          color: #065f46 !important;
        }
        .room-status-badge.bg-warning {
          background-color: #fef3c7 !important;
          color: #92400e !important;
        }
        .room-status-badge.bg-info {
          background-color: #dbeafe !important;
          color: #1e40af !important;
        }
        .room-status-badge.bg-danger {
          background-color: #fecaca !important;
          color: #991b1b !important;
        }
        .room-status-badge.bg-secondary {
          background-color: #e5e7eb !important;
          color: #4b5563 !important;
        }
        body.dark-mode .room-status-badge.bg-success {
          background-color: #064e3b !important;
          color: #6ee7b7 !important;
        }
        body.dark-mode .room-status-badge.bg-warning {
          background-color: #78350f !important;
          color: #fcd34d !important;
        }
        body.dark-mode .room-status-badge.bg-info {
          background-color: #1e3a5f !important;
          color: #93c5fd !important;
        }
        body.dark-mode .room-status-badge.bg-danger {
          background-color: #7f1d1d !important;
          color: #fca5a5 !important;
        }
        body.dark-mode .room-status-badge.bg-secondary {
          background-color: #374151 !important;
          color: #9ca3af !important;
        }
        .room-status-details {
          font-size: 0.75rem;
          color: #4b5563;
          margin-top: 6px;
        }
        body.dark-mode .room-status-details {
          color: #9ca3af;
        }
        .room-status-details .detail-item {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }
        .room-status-details .detail-item svg {
          flex-shrink: 0;
          opacity: 0.7;
        }
        .room-status-details .detail-item .label {
          font-weight: 500;
          min-width: 60px;
        }
        .refresh-btn {
          background: none;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 0.75rem;
          color: #6b7280;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .refresh-btn:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }
        .refresh-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        body.dark-mode .refresh-btn {
          border-color: #3a3a3d;
          color: #9ca3af;
        }
        body.dark-mode .refresh-btn:hover {
          background: #2a2a2a;
        }
        .refresh-btn svg {
          transition: transform 0.3s ease;
        }
        .refresh-btn.refreshing svg {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div className="res-summary-container bg-light" style={{ minHeight: '100vh' }}>
        {/* Header */}
        <div className="calendar-header d-flex justify-content-between align-items-center">
          <h5 className="fw-bold">Reservation Summary</h5>

          <div className="d-flex align-items-center gap-3">
            <div className="fw-semibold">
              {calendarDate.toLocaleString('default', { month: 'long' })}{' '}
              {calendarDate.getFullYear()}
            </div>

            <div className="d-flex gap-2">
              <Button variant="outline-secondary" size="sm" onClick={handlePrevMonth}>
                ←
              </Button>
              <Button variant="outline-secondary" size="sm" onClick={handleNextMonth}>
                →
              </Button>
              <Button variant="outline-secondary" size="sm" onClick={handleCurrentMonth}>
                Today
              </Button>
              <Button variant="outline-danger" size="sm" onClick={() => navigate(-1)}>
                <i className="fi fi-rr-cross"></i>
              </Button>
            </div>
          </div>
        </div>

        {/* LIVE room availability panel — refreshes every 20s */}
        {!liveLoading && liveAvailability.length > 0 && (
          <div className="live-panel">
            <div className="live-panel-head">
              <div className="live-panel-title">
                Room Availability
                <span className="live-badge">
                  <span className="live-dot" /> Live
                </span>
                <button
                  className={`refresh-btn ${isRefreshing ? 'refreshing' : ''}`}
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <FiRefreshCw size={14} />
                  Refresh
                </button>
              </div>
              {liveUpdatedAt && (
                <div className="live-updated-at">
                  Updated {liveUpdatedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </div>
              )}
            </div>

            <div className="live-availability-strip">
              {liveAvailability.map((cat) => {
                const occupiedTotal = cat.occupied_rooms + (cat.bill_pending_rooms || 0)
                const occPercent =
                  cat.total_rooms > 0 ? Math.min(100, Math.round((occupiedTotal / cat.total_rooms) * 100)) : 0
                const isFull = cat.available_rooms === 0

                return (
                  <div
                    key={cat.room_category_id}
                    className={`live-availability-card ${isFull ? 'state-full' : ''}`}>
                    <span className="accent-bar" />

                    <div className="cat-name">{cat.category_name}</div>

                    <div className="available-headline">
                      <span className="available-number">{cat.available_rooms}</span>
                      <span className="available-label">available now</span>
                    </div>

                    <div className="occ-bar-track">
                      <div
                        className={`occ-bar-fill ${isFull ? 'is-full' : ''}`}
                        style={{ width: `${occPercent}%` }}
                      />
                    </div>

                    <div className="meta-row">
                      <span>Total Rooms</span>
                      <strong>{cat.total_rooms}</strong>
                    </div>
                    <div className="meta-row">
                      <span>Occupied</span>
                      <strong>{occupiedTotal}</strong>
                    </div>
                    <div className="meta-row">
                      <span>Reserved (unarrived)</span>
                      <strong>{cat.reserved_rooms}</strong>
                    </div>
                    {cat.blocked_rooms !== undefined && (
                      <div className="meta-row">
                        <span>Blocked</span>
                        <strong>{cat.blocked_rooms}</strong>
                      </div>
                    )}

                    {isFull && cat.available_from && (
                      <div className="next-free-chip">
                        <FiClock size={12} />
                        Free from {formatDateTimeShort(cat.available_from)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
        {liveError && <div className="text-danger small mb-2">{liveError}</div>}

        {/* Calendar Grid */}
        {loading ? (
          <div className="d-flex justify-content-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-5">
            <i className="fi fi-rr-exclamation text-danger fs-4 mb-3 d-block"></i>
            <p className="text-danger">{error}</p>
            <Button variant="outline-primary" onClick={fetchReservationSummary}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="calendar-container">
            <div className="calendar-weekdays">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(
                (day) => (
                  <div key={day}>{day}</div>
                ),
              )}
            </div>
            <div className="calendar-grid">
              {calendarDaysData.map((dayItem, idx) =>
                dayItem.padding ? (
                  <div key={idx} className="calendar-day empty"></div>
                ) : (
                  <div
                    key={idx}
                    className={`calendar-day ${dayItem.isPast ? 'past-day' : ''} ${
                      dayItem.hasRes ? 'reserved-day' : ''
                    } ${dayItem.dateStr === new Date().toISOString().slice(0, 10) ? 'today' : ''}`}
                    onClick={() => {
                      if (!dayItem.isPast && dayItem.hasRes) {
                        setSelectedArrivalDate(dayItem.dateStr)
                        setShowReservationDetailModal(true)
                      }
                    }}
                    style={{
                      cursor: dayItem.isPast || !dayItem.hasRes ? 'default' : 'pointer',
                    }}>
                    <div className="day-number">{dayItem.day}</div>
                    {dayItem.hasRes && <div className="reservation-count">{dayItem.count} res</div>}
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        {/* Reservation Detail Modal with Room Status */}
        <Modal
          show={showReservationDetailModal}
          onHide={() => {
            setShowReservationDetailModal(false)
            setSelectedArrivalDate(null)
          }}
          centered
          size="xl"
          className="reservation-detail-modal">
          <Modal.Header closeButton>
            <div className="w-100">
              <Modal.Title>
                Reservations on{' '}
                {selectedArrivalDate
                  ? new Date(selectedArrivalDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : ''}
              </Modal.Title>

              {/* Category-wise room availability summary for the selected date */}
              {categoryAvailabilityForSelectedDate.length > 0 && (
                <div className="category-availability-summary">
                  {categoryAvailabilityForSelectedDate.map((cat) => (
                    <div key={cat.category_id} className="category-availability-card">
                      <div className="cat-name">{cat.category_name}</div>
                      <div className="cat-stats">
                        <span className="stat total">Total: {cat.totalRooms}</span>
                        <span className="stat reserved">Arriving this day: {cat.reservedRooms}</span>
                        <span className="stat occupied">
                          Occupied: {cat.occupiedRooms}/{cat.totalRooms}
                        </span>
                        <span
                          className={`stat available ${
                            cat.availableRooms === 0 ? 'text-danger' : 'text-success'
                          }`}>
                          Available: {cat.availableRooms}
                        </span>
                        {cat.availableRooms === 0 && cat.nextAvailableDate && (
                          <span className="stat next-available">
                            Available from:{' '}
                            {new Date(cat.nextAvailableDate).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Modal.Header>
          <Modal.Body>
            {/* Reservations Table */}
            {selectedArrivalDate && arrivalsByDate.get(selectedArrivalDate)?.length ? (
              <div className="table-responsive">
                <table className="reservation-detail-table">
                  <thead className="reservation-detail-table-header bg-light">
                    <tr>
                      <th>Reservation No</th>
                      <th>Guest Name</th>
                      <th>Arrival</th>
                      <th>Departure</th>
                      <th>Days</th>
                      <th>Total Rooms</th>
                      <th>Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arrivalsByDate.get(selectedArrivalDate)!.map((res: any, i: number) => (
                      <tr key={i}>
                        <td>{res.reservation_no || 'N/A'}</td>
                        <td>{res.guest_name}</td>
                        <td>{res.arrival_date}</td>
                        <td>{res.departure_date}</td>
                        <td>{res.nights} (days)</td>
                        <td>{res.total_rooms}</td>
                        <td>{res.categories}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-muted">
                No reservation details available for this date.
              </div>
            )}

            {/* Room Status Section */}
            <div className="room-status-section">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="fw-bold mb-0">
                  <FiHome className="me-2" />
                  Room Status
                  {roomStatusUpdatedAt && (
                    <span className="text-muted ms-2" style={{ fontSize: '0.7rem' }}>
                      Updated {roomStatusUpdatedAt.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                    </span>
                  )}
                </h6>
                <button
                  className={`refresh-btn ${roomStatusLoading ? 'refreshing' : ''}`}
                  onClick={fetchRoomStatuses}
                  disabled={roomStatusLoading}
                >
                  <FiRefreshCw size={14} />
                  Refresh
                </button>
              </div>

              {roomStatusLoading && roomStatuses.length === 0 ? (
                <div className="text-center py-4">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading room status...</span>
                  </div>
                  <p className="text-muted mt-2 small">Loading room status...</p>
                </div>
              ) : roomStatusError ? (
                <div className="text-center py-3">
                  <p className="text-danger small">{roomStatusError}</p>
                  <Button variant="outline-secondary" size="sm" onClick={fetchRoomStatuses}>
                    Try Again
                  </Button>
                </div>
              ) : (
                <div className="room-status-grid">
                  {roomStatuses.map((room) => {
                    const badge = getStatusBadge(room.status)
                    return (
                      <div key={room.room_id} className="room-status-card">
                        <div className="room-status-header">
                          <span className="room-number">{room.room_number}</span>
                          <span className="category-name">{room.category_name}</span>
                        </div>
                        <div className={`room-status-badge ${badge.bg}`}>
                          {badge.icon}
                          {badge.text}
                        </div>
                        <div className="room-status-details">
                          {room.guest_name && (
                            <div className="detail-item">
                              <FiUser size={14} />
                              <span><span className="label">Guest:</span> {room.guest_name}</span>
                            </div>
                          )}
                          {room.checkout_time && (
                            <div className="detail-item">
                              <FiClock size={14} />
                              <span><span className="label">Checkout:</span> {formatTime(room.checkout_time)}</span>
                            </div>
                          )}
                          {room.available_from && room.status === 'occupied' && (
                            <div className="detail-item">
                              <FiCalendar size={14} />
                              <span><span className="label">Available From:</span> {formatDateTimeShort(room.available_from)}</span>
                            </div>
                          )}
                          {room.arrival_date && room.status === 'reserved' && (
                            <div className="detail-item">
                              <FiCalendar size={14} />
                              <span><span className="label">Arrival:</span> {new Date(room.arrival_date).toLocaleDateString()}</span>
                            </div>
                          )}
                          {room.departure_date && room.status === 'reserved' && (
                            <div className="detail-item">
                              <FiCalendar size={14} />
                              <span><span className="label">Departure:</span> {new Date(room.departure_date).toLocaleDateString()}</span>
                            </div>
                          )}
                          {room.reservation_no && (
                            <div className="detail-item">
                              <span><span className="label">Reservation:</span> #{room.reservation_no}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {roomStatuses.length === 0 && !roomStatusLoading && !roomStatusError && (
                <div className="text-center py-4 text-muted">
                  No rooms available for this date.
                </div>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setShowReservationDetailModal(false)
                setSelectedArrivalDate(null)
              }}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </>
  )
}

export default ReservationSummaryPage