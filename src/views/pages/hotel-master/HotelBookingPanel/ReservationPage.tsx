// Reservation.tsx
import { useRef, useState, useEffect, useCallback } from 'react'
import { Button, Form } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { useAuthContext } from '@/common/context/useAuthContext'
import RoomService from '@/common/hotel/room'
import ReservationService from '@/common/hotel/reservation'

interface ReservationGuest {
  id: number
  res_no: string
  guest_name: string
  mobile_no: string
  room_category: string
  convert_category: string
  total_days: number
  arrival_datetime: string
  departure_datetime: string
  rooms: number
  room_tariff: number
  pax: number
  ex_pax: number
  child: number
  driver: number
  total_price: number
}

const formatDateTime = (isoString?: string): string => {
  if (!isoString) return '-'
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return isoString
  const year = d.getFullYear()
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:00`
}

const getTodayLabel = () => {
  const d = new Date()
  const day = d.getDate().toString().padStart(2, '0')
  const month = d.toLocaleString('default', { month: 'long' })
  const year = d.getFullYear()
  return `${day} ${month} ${year}`
}

// Local YYYY-MM-DD for "today" without any timezone shift.
const getTodayDateStr = () => {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Maps a raw Reservation (+ its rooms, fetched from the single-API
// GET /reservations/:id response) into the row shape expected by the table.
const mapReservationToRow = (
  res: any,
  rooms: any[],
  categoryMap: Map<number, string>,
): ReservationGuest => {
  const safeRooms = rooms || []
  const totalRooms = safeRooms.reduce((sum: number, r: any) => sum + (Number(r.total_rooms) || 1), 0)

  const categoryIds = Array.from(new Set(safeRooms.map((r: any) => r.room_category_id).filter(Boolean)))
  const roomCategory =
    categoryIds.map((id: any) => categoryMap.get(Number(id)) || 'Unknown').join(', ') || '-'

  const convertedIds = Array.from(
    new Set(safeRooms.map((r: any) => r.converted_category_id).filter(Boolean)),
  )
  const convertCategory =
    convertedIds.map((id: any) => categoryMap.get(Number(id)) || 'Unknown').join(', ') || '-'

  const pax = safeRooms.reduce((sum: number, r: any) => sum + (Number(r.pax_count) || 0), 0)
  const exPax = safeRooms.reduce((sum: number, r: any) => sum + (Number(r.ex_pax_count) || 0), 0)
  const child = safeRooms.reduce((sum: number, r: any) => sum + (Number(r.child_count) || 0), 0)
  const driver = safeRooms.reduce((sum: number, r: any) => sum + (Number(r.driver_count) || 0), 0)
  const roomTariff = safeRooms.reduce(
    (sum: number, r: any) => sum + (Number(r.pax_price) || 0) * (Number(r.total_rooms) || 1),
    0,
  )
  const totalPrice = safeRooms.reduce((sum: number, r: any) => sum + (Number(r.total_amount) || 0), 0)

  return {
    id: res.reservation_id,
    res_no: res.reservation_no || '-',
    guest_name: res.reservation_name || '-',
    mobile_no: res.phone1 || '-',
    room_category: roomCategory,
    convert_category: convertCategory,
    total_days: res.nights || 0,
    arrival_datetime: res.arrival_date ? `${res.arrival_date}T${res.arrival_time || '00:00'}` : '',
    departure_datetime: res.departure_date
      ? `${res.departure_date}T${res.departure_time || '00:00'}`
      : '',
    rooms: totalRooms || safeRooms.length,
    room_tariff: roomTariff,
    pax,
    ex_pax: exPax,
    child,
    driver,
    total_price: totalPrice,
  }
}

// Splits a tall captured canvas across as many A4 pages as needed, so long
// reservation lists are never cut off or squeezed onto a single page.
const addCanvasToPdf = (pdf: jsPDF, canvas: HTMLCanvasElement, marginMM = 10) => {
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const usableWidth = pageWidth - marginMM * 2
  const usableHeight = pageHeight - marginMM * 2

  const ratio = usableWidth / canvas.width // mm per source px
  const pageHeightPx = usableHeight / ratio

  let renderedPx = 0
  let isFirstPage = true

  while (renderedPx < canvas.height) {
    const sliceHeightPx = Math.min(pageHeightPx, canvas.height - renderedPx)

    const pageCanvas = document.createElement('canvas')
    pageCanvas.width = canvas.width
    pageCanvas.height = sliceHeightPx
    const ctx = pageCanvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, sliceHeightPx)
      ctx.drawImage(
        canvas,
        0,
        renderedPx,
        canvas.width,
        sliceHeightPx,
        0,
        0,
        canvas.width,
        sliceHeightPx,
      )
    }

    const pageImgData = pageCanvas.toDataURL('image/png')
    const pageImgHeightMM = sliceHeightPx * ratio

    if (!isFirstPage) pdf.addPage()
    pdf.addImage(pageImgData, 'PNG', marginMM, marginMM, usableWidth, pageImgHeightMM)

    renderedPx += sliceHeightPx
    isFirstPage = false
  }
}

const ReservationPage = () => {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const hotelId = (user as any)?.hotelid || (user as any)?.hotel_id
  const printRef = useRef<HTMLDivElement>(null)
  const label = getTodayLabel()
  const hotel = user?.hotel_name || 'Hotel'

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reservations, setReservations] = useState<ReservationGuest[]>([])

  // Date range filter state
  const [startDate, setStartDate] = useState<string>(getTodayDateStr())
  const [endDate, setEndDate] = useState<string>(getTodayDateStr())

  const fetchReservationData = useCallback(async () => {
    if (!hotelId) {
      setError('Hotel ID not found')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // 1) Fetch category mapping
      const metaRes = await RoomService.getHotelBookingMeta(hotelId)
      const categoryMap = new Map<number, string>()
      ;(metaRes?.data?.categories || []).forEach((c: any) =>
        categoryMap.set(Number(c.room_category_id), c.category_name),
      )

      // 2) Fetch all reservations (no date filter yet)
      const listRes = await ReservationService.list({ hotelid: Number(hotelId) })
      const all = listRes?.data || []

      // 3) Apply date range filter (arrival_date)
      const filteredByDate = all.filter((r: any) => {
        const arrival = r.arrival_date // e.g., "2026-08-10"
        if (!arrival) return false
        if (startDate && endDate) {
          return arrival >= startDate && arrival <= endDate
        } else if (startDate) {
          return arrival >= startDate
        } else if (endDate) {
          return arrival <= endDate
        }
        return true
      })

      // 4) Sort ascending by reservation_no (so 1,2,3...)
      const byReservationNoAsc = (a: any, b: any) => {
        const numA = Number(a.reservation_no)
        const numB = Number(b.reservation_no)
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB
        return String(a.reservation_no || '').localeCompare(String(b.reservation_no || ''))
      }
      filteredByDate.sort(byReservationNoAsc)

      // 5) Fetch room details only for the filtered reservations
      const neededIds = Array.from(new Set(filteredByDate.map((r: any) => r.reservation_id)))
      const detailResults = await Promise.all(
        neededIds.map((id: number) => ReservationService.get(id).catch(() => null)),
      )

      const roomsByResId = new Map<number, any[]>()
      detailResults.forEach((detail: any) => {
        if (detail?.data) roomsByResId.set(detail.data.reservation_id, detail.data.rooms || [])
      })

      // 6) Map to table rows
      setReservations(
        filteredByDate.map((r: any) =>
          mapReservationToRow(r, roomsByResId.get(r.reservation_id) || [], categoryMap),
        ),
      )
    } catch (err: any) {
      console.error('Error fetching reservations:', err)
      setError(err?.message || 'Could not load reservations. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [hotelId, startDate, endDate])

  // Initial load and whenever filter changes (via button)
  useEffect(() => {
    fetchReservationData()
  }, [fetchReservationData])

  // Display-level safeguard: always show Res. No in ascending sequence
  const sortedReservations = [...reservations].sort((a, b) => {
    const numA = Number(a.res_no)
    const numB = Number(b.res_no)
    if (!isNaN(numA) && !isNaN(numB)) return numA - numB
    return String(a.res_no || '').localeCompare(String(b.res_no || ''))
  })

  // Filter handlers
  const handleApplyFilter = () => {
    fetchReservationData()
  }

  const handleResetFilter = () => {
    setStartDate(getTodayDateStr())
    setEndDate(getTodayDateStr())
    // After state update, useEffect will trigger fetchReservationData
  }

  // PRINT FUNCTION
  const handlePrint = () => {
    const tableElement = printRef.current?.querySelector('.res-table')
    if (!tableElement) {
      toast.error('No table to print')
      return
    }

    const win = window.open('', '_blank', 'width=1200,height=700')
    if (!win) {
      toast.error('Please allow pop-ups to print')
      return
    }

    const styles = `
      body { font-family: Arial, sans-serif; font-size: 10px; margin: 8px; padding: 0; }
      .report-header { margin-bottom: 12px; }
      .hotel-name-row { font-size: 16px; font-weight: bold; margin-bottom: 6px; }
      .report-subheader { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #555; }
      table { width: 100%; border-collapse: collapse; font-size: 9px; }
      th {
        background: #dfdfdf !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
        font-weight: 600;
        padding: 4px 5px;
        border: 1px solid #ccc;
        white-space: nowrap;
        text-align: left;
      }
      td {
        border: 1px solid #ccc;
        padding: 3px 5px;
        white-space: nowrap;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      @media print {
        @page { size: landscape; margin: 8mm; }
        body { margin: 0; }
        th { background: #dfdfdf !important; }
      }
    `

    win.document.write(`
      <html>
        <head>
          <title>Today's Reservations</title>
          <style>${styles}</style>
        </head>
        <body>
          <div class="report-header">
            <div class="hotel-name-row">Hotel name: ${hotel}</div>
            <div class="report-subheader"><div>Today's Reservations</div><div>${label}</div></div>
          </div>
          ${tableElement.outerHTML}
        </body>
      </html>
    `)
    win.document.close()
    win.focus()

    win.onload = function () {
      setTimeout(() => {
        win.print()
        win.close()
      }, 500)
    }
  }

  // PDF DOWNLOAD FUNCTION
  const handleDownloadPDF = async () => {
    const table = printRef.current?.querySelector('.res-table')
    if (!table) {
      toast.error('No table found')
      return
    }

    try {
      const wrapper = document.createElement('div')
      wrapper.style.position = 'fixed'
      wrapper.style.top = '0'
      wrapper.style.left = '-10000px'
      wrapper.style.zIndex = '-1'
      wrapper.style.background = '#fff'
      wrapper.style.padding = '20px'
      wrapper.style.width = '1300px'
      wrapper.style.fontFamily = 'Arial, sans-serif'

      const style = document.createElement('style')
      style.textContent = `
        .res-table { width: 100%; border-collapse: collapse; font-size: 0.7rem; }
        .res-table th, .res-table td { border: 1px solid #ccc; padding: 4px; text-align: left; white-space: nowrap; }
        .res-table thead tr { background-color: #dfdfdf; }
        .report-header { margin-bottom: 16px; }
        .hotel-name-row { font-size: 18px; font-weight: bold; margin-bottom: 8px; }
        .report-subheader { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 14px; color: #555; }
      `
      wrapper.appendChild(style)

      const headerDiv = document.createElement('div')
      headerDiv.className = 'report-header'
      headerDiv.innerHTML = `
        <div class="hotel-name-row">Hotel name: ${hotel}</div>
        <div class="report-subheader"><div>Today's Reservations</div><div>${label}</div></div>
      `
      wrapper.appendChild(headerDiv)

      const tableClone = table.cloneNode(true) as HTMLElement
      tableClone.querySelectorAll('th').forEach((el) => {
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

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      addCanvasToPdf(pdf, canvas, 10)

      const dateStr = new Date().toISOString().split('T')[0]
      pdf.save(`Today_Reservations_${dateStr}.pdf`)
    } catch (err) {
      console.error(err)
      toast.error('PDF generation failed')
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="d-flex flex-column align-items-center justify-content-center"
        style={{ height: '60vh' }}>
        <i className="fi fi-rr-exclamation text-danger fs-1 mb-3"></i>
        <p className="text-danger">{error}</p>
        <Button variant="outline-primary" onClick={fetchReservationData}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <>
      <style>{`
        .res-table { width: 100%; border-collapse: collapse; font-size: 0.70rem; }
        .res-table th { position: sticky; top: 0; background-color: #dfdfdf; font-weight: 600; z-index: 10; padding: 0.4rem 0.5rem; border: 1px solid #dee2e6; white-space: nowrap; }
        .res-table td { border: 1px solid #dee2e6; padding: 0.35rem 0.5rem; white-space: nowrap; }
        .res-table tbody tr:hover { background-color: #f5f5f5; }
        .filter-controls .form-control { height: 30px; font-size: 0.8rem; }
        .filter-controls .btn { height: 30px; font-size: 0.8rem; }
      `}</style>

      <div className="d-flex flex-column h-100">
        {/* Title row — Print & PDF on right; Reservation Form button */}
        <div className="d-flex align-items-center justify-content-between px-3 pt-3 pb-2 flex-wrap gap-2">
          <h6 className="fw-semibold mb-0" style={{ fontSize: '0.9rem' }}>
            📅 Today's Reservations — {label}
          </h6>
          <div className="d-flex gap-2">
            <Button
              size="sm"
              variant="success"
              className="fw-semibold px-3 d-flex align-items-center gap-1"
              onClick={handlePrint}>
              <i className="fi fi-rr-print"></i> Print
            </Button>
            <Button
              size="sm"
              variant="primary"
              className="fw-semibold px-2 d-flex align-items-center gap-1"
              onClick={handleDownloadPDF}>
               <i className="fi fi-rr-file-pdf me-1"></i> PDF
            </Button>
            <Button
              size="sm"
              variant="secondary"
              className="fw-semibold px-3"
              onClick={() => navigate('/hotel/reservation')}>
              Reservation Form
            </Button>
          </div>
        </div>

        {/* Date Range Filter Controls */}
        <div className="d-flex align-items-center gap-3 px-3 pb-2 filter-controls flex-wrap">
          <Form.Label className="mb-0 fw-semibold" style={{ fontSize: '0.8rem' }}>
            From:
          </Form.Label>
          <Form.Control
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ width: '150px' }}
          />
          <Form.Label className="mb-0 fw-semibold" style={{ fontSize: '0.8rem' }}>
            To:
          </Form.Label>
          <Form.Control
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ width: '150px' }}
          />
          <Button variant="outline-primary" size="sm" onClick={handleApplyFilter}>
            Apply Filter
          </Button>
          <Button variant="outline-secondary" size="sm" onClick={handleResetFilter}>
            Reset to Today
          </Button>
        </div>

        {/* Table */}
        <div className="flex-grow-1 overflow-auto px-2">
          <div ref={printRef}>
            <table className="res-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Res. No</th>
                  <th>Guest Name</th>
                  <th>Mobile No</th>
                  <th>Room Category</th>
                  <th>Convert Category</th>
                  <th>Total Days</th>
                  <th>Arrival Date &amp; Time</th>
                  <th>Departure Date &amp; Time</th>
                  <th>Rooms</th>
                  <th>Room Tariff</th>
                  <th>Pax</th>
                  <th>Ex-Pax</th>
                  <th>Child</th>
                  <th>Driver</th>
                  <th>Total Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sortedReservations.length === 0 ? (
                  <tr>
                    <td colSpan={17} className="text-center py-4 text-muted">
                      No Reservations Found
                    </td>
                  </tr>
                ) : (
                  sortedReservations.map((r, idx) => (
                    <tr key={r.id}>
                      <td>{idx + 1}</td>
                      <td>{r.res_no}</td>
                      <td>{r.guest_name}</td>
                      <td>{r.mobile_no}</td>
                      <td>{r.room_category}</td>
                      <td>{r.convert_category}</td>
                      <td>{r.total_days}</td>
                      <td>{formatDateTime(r.arrival_datetime)}</td>
                      <td>{formatDateTime(r.departure_datetime)}</td>
                      <td>{r.rooms}</td>
                      <td>Rs.{r.room_tariff?.toFixed(2)}/-</td>
                      <td>{r.pax}</td>
                      <td>{r.ex_pax}</td>
                      <td>{r.child}</td>
                      <td>{r.driver}</td>
                      <td>Rs.{r.total_price?.toFixed(2)}/-</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() =>
                            navigate('/hotel/reservation', {
                              state: { reservationId: r.id },
                            })
                          }
                        >
                          Edit
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}

export default ReservationPage