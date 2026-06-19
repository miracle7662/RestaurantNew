import { useState, useEffect } from 'react'
import { Form, Button, Dropdown } from 'react-bootstrap'
import { toast } from 'react-hot-toast'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import ReservationService from '@/common/hotel/reservation'
import ReservationRoomService from '@/common/hotel/reservationRooms'
import { useAuthContext } from '@/common/context/useAuthContext'
import TitleHelmet from '@/components/Common/TitleHelmet'
import ReservationFormPage from './HotelReservation'   // ✅ Add this import

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

const formatAmount = (amt: number): string => {
  const n = Number(amt)
  if (!isFinite(n)) return 'Rs.0.00/-'
  const sign = n < 0 ? '-' : ''
  return `Rs.${sign}${Math.abs(n).toFixed(2)}/-`
}

const ReservationPage = () => {
  const { user } = useAuthContext()
  const hotelId = user?.hotelid

  const [reservTableData, setReservTableData] = useState<ReservTableRow[]>([])
  const [loadingReservTable, setLoadingReservTable] = useState(false)
  const [reservDate, setReservDate] = useState(new Date().toISOString().slice(0, 10))
  const [hotelName, ] = useState('')
  const [showReservationForm, setShowReservationForm] = useState(false)   // ✅ Add this state

  useEffect(() => {
    if (hotelId) {
      fetchReservTableData(reservDate)
    }
  }, [hotelId, reservDate])

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
      toast.error('Failed to load reservations')
    } finally {
      setLoadingReservTable(false)
    }
  }

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

  return (
    <>
      <TitleHelmet title="Today's Reservations" />
      <style>{`
        .reserv-section-table { width: 100%; border-collapse: collapse; font-size: 0.70rem; }
        .reserv-section-table th, .reserv-section-table td { border: 1px solid #dee2e6; padding: 4px 7px; white-space: nowrap; }
        .reserv-section-table thead tr { background: #f1f5fb; font-weight: 600; position: sticky; top: 0; z-index: 1; }
        .reserv-section-table tbody tr:hover { background: #f8f9fa; }
        .reserv-section-table tfoot tr td { background: #f1f5fb; }
        body.dark-mode th { background-color: #2c2c2c; color: #eee; }
        body.dark-mode .reserv-section-table td { border-color: #444; }
      `}</style>

      <div className="d-flex flex-column vh-100">
        <div className="flex-shrink-0 p-3 bg-white border-bottom">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <h5 className="mb-0 fw-bold">
              <i className="fi fi-rr-calendar me-2 text-primary"></i>
              {showReservationForm
                ? 'New Reservation'
                : (
                  <>
                    Today's Reservations —{' '}
                    {new Date(reservDate + 'T00:00:00').toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </>
                )}
            </h5>
            <div className="d-flex align-items-center gap-2">
              {!showReservationForm && (
                <Form.Control 
                  type="date" 
                  size="sm" 
                  value={reservDate} 
                  style={{ width: 'auto' }}
                  onChange={(e) => { 
                    setReservDate(e.target.value)
                    fetchReservTableData(e.target.value) 
                  }} 
                />
              )}

              {/* ✅ Reservation Form toggle button — placed before Print */}
              <Button
                variant={showReservationForm ? 'secondary' : 'outline-secondary'}
                size="sm"
                className="fw-normal px-3"
                onClick={() => setShowReservationForm((prev) => !prev)}
              >
                <i className="fi fi-rr-document-signed me-1"></i>
                {showReservationForm ? 'Back to List' : 'Reservation Form'}
              </Button>

              {!showReservationForm && (
                <>
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
                </>
              )}

              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={() => {
                  if (showReservationForm) setShowReservationForm(false)
                  else window.history.back()
                }}
              >
                <i className="fi fi-rr-arrow-left me-1"></i>Back
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-grow-1 overflow-auto p-3">
          {showReservationForm ? (
            // ✅ Reservation form replaces the table in the same page area
            <ReservationFormPage />
          ) : loadingReservTable ? (
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
            <div className="table-responsive" style={{ height: '100%' }}>
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
      </div>
    </>
  )
}

export default ReservationPage