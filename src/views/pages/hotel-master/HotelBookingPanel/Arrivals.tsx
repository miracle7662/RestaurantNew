import { useState, useEffect } from 'react'
import { Button, Dropdown, Form } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import TitleHelmet from '@/components/Common/TitleHelmet'
import { useAuthContext } from '@/common/context/useAuthContext'
import ReservationService from '@/common/hotel/reservation'
import ReservationRoomService from '@/common/hotel/reservationRooms'

interface ArrivalTableRow {
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

const Arrivals = () => {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const hotelId = user?.hotelid

  const [arrivalDate, setArrivalDate] = useState<string>(new Date().toISOString().slice(0, 10))
  const [arrivalTableData, setArrivalTableData] = useState<ArrivalTableRow[]>([])
  const [loading, setLoading] = useState(false)

  const fetchArrivalTableData = async (filterDate?: string) => {
    if (!hotelId) return
    setLoading(true)
    try {
      const res = await ReservationService.list({ hotelid: hotelId })
      const reservations: any[] = res.data || []
      const todayStr = filterDate || new Date().toISOString().slice(0, 10)

      // Arrivals = ALL reservations with arrival date = today (regardless of status)
      const todayArrivals = reservations.filter((r: any) => {
        const arrival = r.arrival_date ? String(r.arrival_date).slice(0, 10) : ''
        return arrival === todayStr
      })

      const rows: ArrivalTableRow[] = []

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
      toast.error('Failed to load arrivals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArrivalTableData(arrivalDate)
  }, [arrivalDate, hotelId])

  const exportToExcel = (data: ArrivalTableRow[], filename: string) => {
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
    XLSX.utils.book_append_sheet(wb, ws, 'Arrivals')
    XLSX.writeFile(wb, filename)
  }

  const handlePrint = () => {
    const tableElement = document.querySelector('.arrivals-table')
    if (!tableElement) {
      toast.error('No table to print')
      return
    }
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Please allow pop-ups to print')
      return
    }
    const hotel = user?.hotel_name || 'Hotel'
    const dateStr = new Date(arrivalDate).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
    printWindow.document.write(`
      <html>
        <head><title>${hotel} - Arrivals</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .report-header { margin-bottom: 16px; }
          .hotel-name-row { font-size: 18px; font-weight: bold; margin-bottom: 6px; }
          .report-subheader { font-size: 13px; color: #555; }
          table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
          th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
          th { background-color: #f2f2f2; }
        </style>
        </head>
        <body>
          <div class="report-header">
            <div class="hotel-name-row">Hotel name: ${hotel}</div>
            <div class="report-subheader">Arrivals — ${dateStr}</div>
          </div>
          ${tableElement.outerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const handlePdf = async () => {
    const table = document.querySelector('.arrivals-table')
    if (!table) {
      toast.error('No table found')
      return
    }
    try {
      const hotel = user?.hotel_name || 'Hotel'
      const dateStr = new Date(arrivalDate).toLocaleDateString('en-IN', {
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
      headerDiv.innerHTML = `<div class="hotel-name-row">Hotel name: ${hotel}</div><div class="report-subheader">Arrivals — ${dateStr}</div>`
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
      pdf.save('arrivals.pdf')
    } catch (err) {
      console.error(err)
      toast.error('PDF generation failed')
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <TitleHelmet title="Arrivals" />
      <div className="container-fluid p-3">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h4 className="mb-0">
            <i className="fi fi-rr-plane-arrival me-2"></i> Today's Arrivals
          </h4>
          <div className="d-flex align-items-center gap-2">
            <Form.Control
              type="date"
              size="sm"
              value={arrivalDate}
              onChange={(e) => setArrivalDate(e.target.value)}
              style={{ width: 'auto' }}
            />
            <Button variant="success" size="sm" onClick={handlePrint}>
              <i className="fi fi-rr-print me-1"></i> Print
            </Button>
            <Dropdown>
              <Dropdown.Toggle variant="primary" size="sm">
                <i className="fi fi-rr-download me-1"></i> Export
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={handlePdf}>PDF</Dropdown.Item>
                <Dropdown.Item onClick={() => exportToExcel(arrivalTableData, 'arrivals.xlsx')}>
                  Excel
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <Button variant="outline-secondary" size="sm" onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>
        </div>

        {arrivalTableData.length === 0 ? (
          <div className="text-center py-5">
            <i className="fi fi-rr-calendar text-muted fs-4 mb-3 d-block"></i>
            <p className="text-muted mb-0">No arrivals for this date.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="arrivals-table table table-bordered table-sm">
              <thead className="table-light">
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
    </>
  )
}

export default Arrivals