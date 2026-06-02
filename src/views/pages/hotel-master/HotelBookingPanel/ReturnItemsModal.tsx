// ReservationSummaryPage.tsx
import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Modal } from 'react-bootstrap'
import TitleHelmet  from '@/components/Common/TitleHelmet'
import { useAuthContext } from '@/common/context/useAuthContext'
import ReservationService from '@/common/hotel/reservation'
import ReservationRoomService from '@/common/hotel/reservationRooms'
import RoomCategoryService from '@/common/hotel/roomCategoryService'


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

  height: 543px;          /* ✅ fixed height */
  overflow-y: auto;       /* ✅ scroll if content more */
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
          height: calc(100% - 40px); /* subtract weekday row */
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
      `}</style>

      <div className="res-summary-container bg-light" style={{ minHeight: '100vh' }}>
        {/* Header */}
        <div className="calendar-header d-flex justify-content-between align-items-center">
          {/* LEFT SIDE */}
          <h5 className="fw-bold">Reservation Summary</h5>

          {/* RIGHT SIDE */}
          <div className="d-flex align-items-center gap-3">
            {/* Month */}
            <div className="fw-semibold">
              {calendarDate.toLocaleString('default', { month: 'long' })}{' '}
              {calendarDate.getFullYear()}
            </div>

            {/* Buttons */}
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

        {/* Reservation Detail Modal */}
        <Modal
          show={showReservationDetailModal}
          onHide={() => {
            setShowReservationDetailModal(false)
            setSelectedArrivalDate(null)
          }}
          centered
          size="lg"
          className="reservation-detail-modal">
          <Modal.Header closeButton>
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
          </Modal.Header>
          <Modal.Body>
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