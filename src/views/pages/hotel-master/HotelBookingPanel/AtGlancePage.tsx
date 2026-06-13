import { useState, useEffect, useMemo } from 'react'
import { Button, Dropdown, Form } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import TitleHelmet from '@/components/Common/TitleHelmet'
import { useAuthContext } from '@/common/context/useAuthContext'
import RoomService from '@/common/hotel/room'
import RoomCategoryService from '@/common/hotel/roomCategoryService'
import FloorService from '@/common/hotel/floors'
import CheckInService, { CheckIn } from '@/common/hotel/checkIn'
import DetailService, { Detail } from '@/common/hotel/detail'
import GuestFolioService, { GuestFolio } from '@/common/hotel/guestFolio'
import GuestRoomChargesService from '@/common/hotel/guestRoomCharges'
import AdvanceTransactionService from '@/common/hotel/advanceTransaction'

type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'reserved' | 'maintenance'

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

const formatAmount = (amt: number): string => {
  const n = Number(amt)
  if (!isFinite(n)) return 'Rs.0.00/-'
  const sign = n < 0 ? '-' : ''
  return `Rs.${sign}${Math.abs(n).toFixed(2)}/-`
}

const AtGlance = () => {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const hotelId = user?.hotelid

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [atGlanceData, setAtGlanceData] = useState<AtGlanceItem[]>([])
  const [atGlanceFilter, setAtGlanceFilter] = useState<
    'all' | 'available' | 'occupied' | 'cleaning' | 'reserved' | 'maintenance'
  >('all')

  const getStatusBgColor = (status: RoomStatus): string => {
    switch (status) {
      case 'available':
        return '#ffffff'
      case 'occupied':
        return '#DFF5E1'
      case 'cleaning':
        return '#FFF4CC'
      case 'reserved':
        return '#D9F1FF'
      case 'maintenance':
        return '#FFE0E0'
      default:
        return '#ffffff'
    }
  }

  const getStatusTextColor = (status: RoomStatus): string => {
    switch (status) {
      case 'available':
        return '#4B5563'
      case 'occupied':
        return '#16A34A'
      case 'cleaning':
        return '#D4A017'
      case 'reserved':
        return '#0284C7'
      case 'maintenance':
        return '#DC2626'
      default:
        return '#4B5563'
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

  const filteredAtGlanceData = useMemo(() => {
    if (atGlanceFilter === 'all') return atGlanceData
    return atGlanceData.filter((item) => item.status === atGlanceFilter)
  }, [atGlanceData, atGlanceFilter])

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
    setLoading(true)
    setError(null)
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
      setError('Could not load at a glance data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAtGlanceData()
  }, [hotelId])

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
    const now = new Date()
    const dateTimeStr = formatDateTime(now.toISOString())
    const filterText = getFilterDisplayText()
    const hotel = user?.hotel_name || 'Hotel'
    const title = `${hotel} - At a Glance Report`
    printWindow.document.write(`
      <html>
        <head><title>${title}</title>
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
      const hotel = user?.hotel_name || 'Hotel'
      headerDiv.innerHTML = `
        <div class="hotel-name-row">Hotel name: ${hotel}</div>
        <div class="report-subheader"><div>At a Glance Report</div><div>Filter: ${filterText} | Date & Time: ${dateTimeStr}</div></div>
      `
      wrapper.appendChild(headerDiv)
      const tableClone = table.cloneNode(true) as HTMLElement
      tableClone.querySelectorAll('thead tr, tfoot tr').forEach((el) => {
        (el as HTMLElement).style.position = 'static'
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
    const hotel = user?.hotel_name || 'Hotel'
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

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center vh-100">
        <i className="fi fi-rr-exclamation text-danger fs-1 mb-3"></i>
        <p className="text-danger">{error}</p>
        <Button variant="outline-primary" onClick={fetchAtGlanceData}>
          Retry
        </Button>
      </div>
    )
  }

  return (
    <>
      <TitleHelmet title="At a Glance - Room Status" />
      <div className="container-fluid p-3">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <h4 className="mb-0">
            <i className="fi fi-rr-eye me-2"></i> At a Glance
          </h4>
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted">Filter: {getFilterDisplayText()}</span>
            <span className="text-muted">|</span>
            <span className="text-muted">{formatDateTime(new Date().toISOString())}</span>
            <Dropdown>
              <Dropdown.Toggle variant="secondary" size="sm" className="fw-normal px-2">
                {getFilterDisplayText()}
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={() => setAtGlanceFilter('all')}>All</Dropdown.Item>
                <Dropdown.Item onClick={() => setAtGlanceFilter('available')}>Vacant</Dropdown.Item>
                <Dropdown.Item onClick={() => setAtGlanceFilter('occupied')}>Occupied</Dropdown.Item>
                <Dropdown.Item onClick={() => setAtGlanceFilter('cleaning')}>Dirty</Dropdown.Item>
                <Dropdown.Item onClick={() => setAtGlanceFilter('reserved')}>Block</Dropdown.Item>
                <Dropdown.Item onClick={() => setAtGlanceFilter('maintenance')}>Maint</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <Button variant="success" size="sm" onClick={handlePrint}>
              <i className="fi fi-rr-print me-1"></i> Print
            </Button>
            <Dropdown>
              <Dropdown.Toggle variant="primary" size="sm">
                <i className="fi fi-rr-download me-1"></i> Export
              </Dropdown.Toggle>
              <Dropdown.Menu>
                <Dropdown.Item onClick={handlePDF}>PDF</Dropdown.Item>
                <Dropdown.Item onClick={handleExcel}>Excel</Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
            <Button variant="outline-secondary" size="sm" onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="at-glance-table table table-bordered table-sm">
            <thead className="table-light">
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
                  <td>{item.status === 'occupied' && item.totalDays != null ? item.totalDays : '-'}</td>
                  <td>{formatAmount(item.totalAmt)}</td>
                  <td>{item.discountPercent}%</td>
                  <td>{item.payType}</td>
                  <td>{item.planName || '-'}</td>
                  <td>{item.checkinDatetime ? formatDateTime(item.checkinDatetime) : '-'}</td>
                  <td>{item.checkoutDatetime ? formatDateTime(item.checkoutDatetime) : '-'}</td>
                  <td>{item.adults}</td>
                  <td>{item.pax}</td>
                  <td>{item.exPax}</td>
                  <td>{item.child}</td>
                  <td>{item.driver}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ backgroundColor: '#f8f9fa', fontWeight: 'bold' }}>
                <td colSpan={4}>Totals:</td>
                <td colSpan={13}>
                  <div className="d-flex gap-3 flex-wrap">
                    <span style={{ backgroundColor: getStatusBgColor('available'), padding: '2px 8px' }}>
                      Vacant: {statusCounts.available}
                    </span>
                    <span style={{ backgroundColor: getStatusBgColor('occupied'), padding: '2px 8px' }}>
                      Occupied: {statusCounts.occupied}
                    </span>
                    <span style={{ backgroundColor: getStatusBgColor('cleaning'), padding: '2px 8px' }}>
                      Dirty: {statusCounts.cleaning}
                    </span>
                    <span style={{ backgroundColor: getStatusBgColor('maintenance'), padding: '2px 8px' }}>
                      Main: {statusCounts.maintenance}
                    </span>
                    <span style={{ backgroundColor: getStatusBgColor('reserved'), padding: '2px 8px' }}>
                      Block: {statusCounts.reserved}
                    </span>
                    <span>Total: {filteredAtGlanceData.length}</span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  )
}

export default AtGlance