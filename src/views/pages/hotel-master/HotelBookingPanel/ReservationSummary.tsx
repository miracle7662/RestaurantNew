import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Modal } from 'react-bootstrap'
import TitleHelmet from '@/components/Common/TitleHelmet'
import { useAuthContext } from '@/common/context/useAuthContext'
import ReservationService from '@/common/hotel/reservation'
import ReservationRoomService from '@/common/hotel/reservationRooms'
import RoomCategoryService from '@/common/hotel/roomCategoryService'
import RoomService from '@/common/hotel/room'
import {  FiPrinter } from 'react-icons/fi'

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
  available_from: string | null
  next_available_from: string | null
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

const LIVE_REFRESH_INTERVAL_MS = 20000
const ROOM_STATUS_REFRESH_INTERVAL_MS = 60000

// const formatDateTimeShort = (iso: string | null) => {
//   if (!iso) return null
//   const d = new Date(iso)
//   if (isNaN(d.getTime())) return iso
//   return d.toLocaleString('en-US', {
//     month: 'short',
//     day: 'numeric',
//     hour: 'numeric',
//     minute: '2-digit',
//   })
// }

const ReservationSummaryPage = () => {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const hotelId = user?.hotelid
  // Get hotel name from auth context
  const hotelName = user?.hotel_name || 'Hotel'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rawReservations, setRawReservations] = useState<any[]>([])
  const [rawReservationRooms, setRawReservationRooms] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])

  const [calendarDate, setCalendarDate] = useState(new Date())
  const [selectedArrivalDate, setSelectedArrivalDate] = useState<string | null>(null)
  const [showReservationDetailModal, setShowReservationDetailModal] = useState(false)

  const [liveAvailability, setLiveAvailability] = useState<LiveCategoryAvailability[]>([])
  const [, setLiveLoading] = useState(true)
  const [, setLiveError] = useState<string | null>(null)
  const [, setLiveUpdatedAt] = useState<Date | null>(null)
  const [, setIsRefreshing] = useState(false)

  const [roomStatuses, setRoomStatuses] = useState<RoomStatus[]>([])
  const [roomStatusLoading, setRoomStatusLoading] = useState(true)
  const [roomStatusError, setRoomStatusError] = useState<string | null>(null)
  const [roomStatusUpdatedAt, setRoomStatusUpdatedAt] = useState<Date | null>(null)

  // Fetch categories
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

  // Fetch live availability
  const fetchLiveAvailability = useCallback(async () => {
    if (!hotelId) return
    try {
      const res = await RoomService.getLiveRoomAvailability(hotelId)
      const payload: any = res
      const categories = payload?.categories || payload?.data?.categories || []
      setLiveAvailability(categories)
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

  // Fetch room statuses
  const fetchRoomStatuses = useCallback(async () => {
    if (!hotelId) return
    setRoomStatusLoading(true)
    try {
      const res = await RoomService.getLiveRoomAvailability(hotelId)
      const payload: any = res
      const categories = payload?.categories || payload?.data?.categories || []

      const catMap = new Map<number, any>()
      categories.forEach((cat: any) => {
        catMap.set(cat.room_category_id, {
          total: cat.total_rooms || 0,
          occupied: cat.occupied_rooms || 0,
          reserved: cat.reserved_rooms || 0,
          nextAvailable: cat.next_available_from || null,
        })
      })

      const rooms: RoomStatus[] = []

      categories.forEach((cat: any) => {
        const catId = cat.room_category_id
        const info = catMap.get(catId)!
        const totalRooms = info.total
        const occupiedRooms = info.occupied
        const reservedRooms = info.reserved
        const nextAvail = info.nextAvailable

        for (let i = 1; i <= totalRooms; i++) {
          let status: RoomStatus['status'] = 'available'
          let guestName = undefined
          let checkoutTime = undefined

          if (i <= occupiedRooms) {
            status = 'occupied'
            guestName = `Guest ${i}`
            checkoutTime = nextAvail
          } else if (i <= occupiedRooms + reservedRooms) {
            status = 'reserved'
            guestName = `Guest ${i}`
          } else {
            status = 'available'
          }

          rooms.push({
            room_id: i,
            room_number: `${cat.category_name.substring(0, 2)}-${String(i).padStart(2, '0')}`,
            room_category_id: catId,
            category_name: cat.category_name,
            status,
            guest_name: guestName,
            checkout_time: checkoutTime,
            available_from: status === 'occupied' ? nextAvail : undefined,
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

    const normalizedSelectedDate = selectedArrivalDate ? String(selectedArrivalDate).slice(0, 10) : ''
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const isToday = normalizedSelectedDate === todayStr

    const result = categories.map((cat: any) => {
      const catId = Number(cat.room_category_id)
      const totalRooms = Number(cat.total_rooms ?? cat.no_of_rooms ?? 0)
      const entry = catMap.get(catId) || { occupiedRooms: 0, reservedRooms: 0, departures: [] }

      let occupiedRooms = Number(entry.occupiedRooms || 0)
      let availableRooms = Math.max(totalRooms - occupiedRooms, 0)

      if (isToday) {
        const liveCat = liveAvailability.find((lc) => Number(lc.room_category_id) === catId)
        if (liveCat) {
          occupiedRooms = Number(liveCat.occupied_rooms || 0)
          availableRooms = Number(liveCat.available_rooms || 0)
        }
      }

      let nextAvailableDate: string | null = null
      if (availableRooms <= 0 && entry.departures.length) {
        nextAvailableDate = [...entry.departures].sort()[0]
      }

      return {
        category_id: catId,
        category_name: cat.category_name,
        totalRooms,
        occupiedRooms,
        reservedRooms: Number(entry.reservedRooms || 0),
        availableRooms,
        nextAvailableDate,
      }
    })

    return result
  }, [selectedArrivalDate, rawReservations, rawReservationRooms, categories, liveAvailability])

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

  // const handleRefresh = () => {
  //   setIsRefreshing(true)
  //   fetchLiveAvailability()
  //   if (showReservationDetailModal) {
  //     fetchRoomStatuses()
  //   }
  // }

  return (
    <>
      <TitleHelmet title="Reservation Summary" />
      <style>{`
        /* All existing styles remain unchanged */
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

        /* ===== Room status table ===== */
        .room-status-table-container {
          margin-top: 1.5rem;
          border-top: 1px solid #dee2e6;
          padding-top: 1rem;
        }
        .room-status-table-container h6 {
          font-weight: 600;
          margin-bottom: 0.75rem;
        }

        /* ===== Live availability panel ===== */
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

        /* Refresh button */
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

        /* ===== Print styles ===== */
        @media print {
          /* Hide everything outside the modal */
          body * {
            visibility: hidden;
          }
          .modal,
          .modal * {
            visibility: visible;
          }
          /* Force modal to display as a full page */
          .modal {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            height: auto !important;
            display: block !important;
            background: white !important;
            overflow: visible !important;
          }
          .modal-dialog {
            max-width: 100% !important;
            margin: 0 !important;
            transform: none !important;
          }
          .modal-content {
            border: none !important;
            box-shadow: none !important;
          }
          /* Hide the modal backdrop and all page elements except the modal body */
          .modal-backdrop,
          .modal-header .close,
          .modal-footer .btn,
          .calendar-container,
          .res-summary-container,
          .calendar-header,
          .live-panel,
          .refresh-btn,
          .btn,
          .close {
            display: none !important;
          }
          /* Keep the modal header visible with the title */
          .modal-header {
            display: flex !important;
            border-bottom: 1px solid #ddd !important;
            padding: 0.5rem 1rem !important;
          }
          .modal-header .modal-title {
            font-size: 1.2rem !important;
          }
          .modal-body {
            padding: 1rem !important;
          }
          /* Ensure tables print with borders */
          .reservation-detail-table,
          .reservation-detail-table th,
          .reservation-detail-table td {
            border: 1px solid #333 !important;
          }
          .reservation-detail-table th {
            background-color: #eee !important;
          }
          .room-status-table-container {
            margin-top: 1.5rem !important;
            border-top: 1px solid #ddd !important;
            padding-top: 1rem !important;
          }
          /* Hide "Last updated" timestamp if needed */
          .mt-2.text-muted.small {
            display: none !important;
          }
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

        {/* Reservation Detail Modal with Room Status Table */}
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
                {/* ✅ Hotel name added here */}
                {hotelName} - Reservations on{' '}
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
            {/* === Reservation Details Table === */}
            {selectedArrivalDate && arrivalsByDate.get(selectedArrivalDate)?.length ? (
              <div className="table-responsive">
                <table className="reservation-detail-table">
                  <thead>
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

            {/* === Room‑wise Availability Table === */}
            <div className="room-status-table-container">
              <h6>Room‑wise Availability (Occupied Rooms)</h6>
              {roomStatusLoading ? (
                <div className="text-center py-3">
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                  <span className="ms-2">Loading room statuses...</span>
                </div>
              ) : roomStatusError ? (
                <div className="text-danger text-center py-2">{roomStatusError}</div>
              ) : (
                <div className="table-responsive">
                  <table className="reservation-detail-table">
                    <thead>
                      <tr>
                        <th>Room No</th>
                        <th>Category</th>
                        <th>Status</th>
                        <th>Available From</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roomStatuses
                        .filter((room) => room.status === 'occupied')
                        .map((room) => (
                          <tr key={room.room_id}>
                            <td>{room.room_number}</td>
                            <td>{room.category_name}</td>
                            <td>
                              <span className="badge bg-danger">Occupied</span>
                            </td>
                            <td>
                              {room.checkout_time
                                ? new Date(room.checkout_time).toLocaleString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : '—'}
                            </td>
                          </tr>
                        ))}
                      {roomStatuses.filter((r) => r.status === 'occupied').length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-center text-muted">
                            No occupied rooms on this date.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              {roomStatusUpdatedAt && (
                <div className="mt-2 text-muted small">
                  Last updated: {roomStatusUpdatedAt.toLocaleTimeString()}
                </div>
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={() => window.print()}>
              <FiPrinter className="me-1" /> Print
            </Button>
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