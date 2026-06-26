import { useState, useEffect, useMemo } from 'react'
import { Button } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'

import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import TitleHelmet from '@/components/Common/TitleHelmet'
import { useAuthContext } from '@/common/context/useAuthContext'
import CheckInService, { CheckIn } from '@/common/hotel/checkIn'

interface AtGlanceItem {
  floorNo: string
  floorId: number
  roomNo: string
  guest: string
  status: string
  status_color?: string
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
  roomId: number
  convertedCategory: string
  planName?: string
  totalDays?: number
  // ---- Occupancy Register fields ----
  checkinId?: number
  regNo?: string
  companyName?: string
  mealPlan?: string
  roomTariff?: number
  dueAmount?: number
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

// Matches the printed "Room Occupancy Register" style: 18/06/2026  11:00 am
const formatRegisterDateTime = (isoString?: string): string => {
  if (!isoString) return '-'
  const d = new Date(isoString)
  if (isNaN(d.getTime())) return '-'
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  let hours = d.getHours()
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'pm' : 'am'
  hours = hours % 12
  if (hours === 0) hours = 12
  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`
}

const formatRegisterDate = (d: Date): string => {
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
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

const getStatusStyle = (status: string, statusColor?: string): React.CSSProperties => {
  const normalizedStatus = (status || '').trim().toLowerCase()

  const bg = statusColor?.trim() || undefined
  if (bg) {
    return {
      backgroundColor: bg,
      color: getContrastColor(bg),
    }
  }

  switch (normalizedStatus) {
    case 'available':
    case 'vacant':
    case 'free':
    case 'vacant room':
      return { backgroundColor: '#ffffff', color: '#111827' }
    case 'occupied':
    case 'in_house':
      return { backgroundColor: '#DFF5E1', color: '#16A34A' }
    case 'cleaning':
    case 'dirty':
      return { backgroundColor: '#FFF4CC', color: '#92400E' }
    case 'reserved':
    case 'block':
      return { backgroundColor: '#D9F1FF', color: '#0284C7' }
    case 'maintenance':
    case 'out of service':
    case 'maint':
      return { backgroundColor: '#FFE0E0', color: '#DC2626' }
    case 'bill':
      return { backgroundColor: '#f59999', color: '#8B0000' }
    default:
      return {}
  }
}

// Splits a tall captured canvas across as many A4 pages as needed. Used for
// PDF exports of long tables (e.g. the Occupancy Register, which can have
// many occupied rows) so content is never cut off or squeezed onto one page.
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
      ctx.drawImage(canvas, 0, renderedPx, canvas.width, sliceHeightPx, 0, 0, canvas.width, sliceHeightPx)
    }

    const pageImgData = pageCanvas.toDataURL('image/png')
    const pageImgHeightMM = sliceHeightPx * ratio

    if (!isFirstPage) pdf.addPage()
    pdf.addImage(pageImgData, 'PNG', marginMM, marginMM, usableWidth, pageImgHeightMM)

    renderedPx += sliceHeightPx
    isFirstPage = false
  }
}

const AtGlance = () => {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const hotelId = user?.hotelid || user?.hotel_id

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [atGlanceData, setAtGlanceData] = useState<AtGlanceItem[]>([])
  const [selectedStatus, setSelectedStatus] = useState<string>('All')

  const statusCounts = useMemo(() => {
    const map = new Map<
      string,
      { status: string; count: number; statusColor?: string }
    >()

    for (const item of atGlanceData) {
      const status = (item.status || '').trim()
      if (!status) continue

      const existing = map.get(status)
      if (existing) {
        existing.count += 1
        if (!existing.statusColor && item.status_color) {
          existing.statusColor = item.status_color
        }
      } else {
        map.set(status, {
          status,
          count: 1,
          statusColor: item.status_color,
        })
      }
    }

    return Array.from(map.values()).sort((a, b) => a.status.localeCompare(b.status))
  }, [atGlanceData])

  const fetchAtGlanceData = async () => {
    if (!hotelId) {
      setError('Hotel ID not found')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('Fetching at-glance data for hotelId:', hotelId)
      
      const atGlanceRes = await CheckInService.getAtGlance({ hotelid: hotelId })
      console.log('At-glance API response:', atGlanceRes)

      if (!atGlanceRes || !atGlanceRes.data) {
        console.warn('No data received from at-glance API')
        setAtGlanceData([])
        setLoading(false)
        return
      }

      const checkins = atGlanceRes.data || []
      console.log('API Count:', checkins.length)

      if (checkins.length === 0) {
        console.log('No check-in data found')
        setAtGlanceData([])
        setLoading(false)
        return
      }

      const items: AtGlanceItem[] = checkins.map((c: any) => {
        const statusColor =
          (c as any).status_color ??
          (c as any).statusColor ??
          (c as any).color ??
          (c as any).statusColorHex

        const checkinDatetime = (c as any).checkin_datetime || ''
        const checkoutDatetime = (c as any).checkout_datetime || ''

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

        return {
          floorNo: (c as any).floorNo || (c as any).floor_name || '',
          floorId: (c as any).floor_id || (c as any).floorId || 0,
          roomNo:
            (c as any).room_no ||
            (c as any).occupied_room_number ||
            (c as any).roomNumber ||
            (c as any).roomNo ||
            '',
          guest: (c as any).guest_name || '',
          status: (c as any).status || (c as any).room_status || '',
          status_color: statusColor,
          totalAmt:
            Number(
              (c as any).totalAmt ??
                (c as any).total_room_amount ??
                (c as any).total_amount ??
                0,
            ) || 0,
          groupAmt: 0,
          discountPercent: (c as any).discountPercent ?? (c as any).discount_percent ?? 0,
          payType: (c as any).payment_method ? String((c as any).payment_method) : 'Cash',
          checkinDatetime,
          checkoutDatetime,
          pax: Number((c as any).pax || 0) || 0,
          adults: Number((c as any).adults || 0) || 0,
          exPax: Number((c as any).ex_pax ?? (c as any).exPax ?? 0) || 0,
          child: Number((c as any).child ?? (c as any).child_unpaid ?? 0) || 0,
          driver: Number((c as any).driver || 0) || 0,
          roomCategory:
            (c as any).roomCategory ??
            (c as any).room_category_name ??
            (c as any).room_category ??
            (c as any).roomCategoryName ??
            '',
          roomId: (c as any).room_id || (c as any).roomId || 0,
          convertedCategory:
            (c as any).convertedCategory ??
            (c as any).converted_category_name ??
            (c as any).converted_category ??
            (c as any).convertedCategoryName ??
            '',
          planName: (c as any).plan_name || '',
          totalDays: computedTotalDays,
          checkinId: (c as any).checkin_id || undefined,
          regNo: (c as any).reg_no || '',
          companyName: (c as any).company_name || '',
          mealPlan: (c as any).booking || '',
          roomTariff: Number((c as any).room_tariff ?? 0) || 0,
          dueAmount: Number((c as any).due_amount ?? 0) || 0,
        }
      })

      console.log('UI Count:', items.length)
      items.sort((a, b) => a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true }))
      setAtGlanceData(items)
    } catch (err: any) {
      console.error('Failed to fetch at a glance data:', err)
      setError(err?.message || 'Could not load at a glance data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAtGlanceData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            <div class="report-subheader"><div>At a Glance Report</div><div>Filter: ${selectedStatus || 'All'} | Date & Time: ${dateTimeStr}</div></div>
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
      const hotel = user?.hotel_name || 'Hotel'

      headerDiv.innerHTML = `
        <div class="hotel-name-row">Hotel name: ${hotel}</div>
        <div class="report-subheader"><div>At a Glance Report</div><div>Filter: ${selectedStatus || 'All'} | Date & Time: ${dateTimeStr}</div></div>
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

  // ==================== OCCUPANCY REGISTER (shared data + markup) ====================
  // Builds the "Room Occupancy Register" data — only occupied rooms, laid out to
  // match the hotel's existing paper register (Room / Reg No / Company Name /
  // Customer Name / Arrival & Departure Date / Pax / Tariff / Discount / Due
  // Amount), plus the occupancy summary footer. Shared by both the Print button
  // and the PDF download button so the two outputs always stay identical.
  const getOccupancyRegisterData = () => {
    // A room counts as "occupied" when it has a live checkin attached to it
    // (checkinId comes from cdm.detail_id via cm.checkin_id on the backend),
    // not just by matching a status label, since status text/colors are
    // configurable per hotel.
    const occupiedRows = atGlanceData
      .filter((item) => !!item.checkinId)
      .slice()
      .sort((a, b) => a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true }))

    const now = new Date()
    const hotel = user?.hotel_name || 'Hotel'
    const forDateStr = formatRegisterDate(now)

    // ---- Footer summary stats ----
    // Occupied / Total Pax come straight from the live-checkin rows above
    // (authoritative). Free/Dirty/Out-of-Order are derived from the room
    // status text on every NON-occupied room, since that's the only place
    // housekeeping state currently lives in this data model.
    const nonOccupied = atGlanceData.filter((item) => !item.checkinId)
    let freeClean = 0
    let freeDirty = 0
    let outOfOrder = 0
    let reserved = 0

    nonOccupied.forEach((item) => {
      const s = (item.status || '').trim().toLowerCase()
      if (['maintenance', 'out of service', 'maint'].includes(s)) {
        outOfOrder++
      } else if (['reserved', 'block'].includes(s)) {
        reserved++
      } else if (['cleaning', 'dirty'].includes(s)) {
        freeDirty++
      } else {
        freeClean++
      }
    })

    const totalRooms = atGlanceData.length
    const occupied = occupiedRows.length
    const occupiedClean = occupied // no separate "occupied & dirty" housekeeping status tracked yet
    const occupiedDirty = 0
    const totalFree = freeClean + freeDirty
    const totalPax = occupiedRows.reduce((sum, item) => sum + (Number(item.adults) || 0), 0)

    // ---- Extra right-hand summary fields (Credit Limit / Room Message /
    // Reserved Walkins / Reserved Online) ----
    // No backend field currently feeds these, so they default to 0 until a
    // real data source is wired up. Kept as named variables (rather than
    // hard-coded inline) so swapping in the real values later is a one-line change.
    const creditLimit = 0
    const roomMessage = 0
    const reservedWalkins = 0
    const reservedOnline = 0

    // TERIFF and DUE AMOUNT are populated by the backend from checkin_master
    // (pax_charges and total_amount respectively) — see getAtGlance in
    // checkInController.js. roomTariff/dueAmount fall back to 0 only when a
    // room genuinely has no live checkin.
    const rowsHtml = occupiedRows
      .map((item) => {
        const roomType = item.convertedCategory || item.roomCategory || ''
        const meal = item.mealPlan || item.planName || ''
        const tariff = Number(item.roomTariff ?? 0)
        const discount = Number(item.discountPercent ?? 0)
        const due = Number(item.dueAmount ?? 0)

        return `
          <tr>
            <td>
              <div>${item.roomNo || ''}</div>
              ${roomType ? `<div class="subtext">${roomType.toUpperCase()}</div>` : ''}
            </td>
            <td>${item.regNo || ''}</td>
            <td>
              <div>${item.companyName || ''}</div>
              ${meal ? `<div class="subtext">${meal.toUpperCase()}</div>` : ''}
            </td>
            <td>${item.guest || ''}</td>
            <td>
              <div>${formatRegisterDateTime(item.checkinDatetime)}</div>
              <div>${formatRegisterDateTime(item.checkoutDatetime)}</div>
            </td>
            <td class="num">${item.adults ?? 0}</td>
            <td class="num">${item.totalAmt.toFixed(2)}</td>
            <td class="num">${discount.toFixed(2)}</td>
            <td class="num">${due.toFixed(2)}</td>
          </tr>
        `
      })
      .join('')

    const styleCss = `
      .register-title { text-align: center; background: #dcdcdc; padding: 6px; font-weight: bold; font-size: 15px; letter-spacing: 0.5px; }
      .register-subheader { display: flex; justify-content: space-between; font-size: 13px; margin: 6px 2px 14px 2px; }
      table.occ-table { width: 100%; border-collapse: collapse; font-size: 12px; }
      table.occ-table th, table.occ-table td { border: 1px solid #999; padding: 6px 8px; text-align: left; vertical-align: top; }
      table.occ-table th { background: #ececec; font-weight: 700; text-align: left; }
      table.occ-table td.num, table.occ-table th.num { text-align: right; }
      table.occ-table .subtext { font-size: 10.5px; color: #444; margin-top: 2px; }
      .occ-summary-table { width: 100%; border-collapse: collapse; margin-top: 22px; font-family: Arial, sans-serif; }
      .occ-summary-table td { padding: 12px 16px 12px 0; vertical-align: middle; }
      .occ-summary-table .hdr-label { font-weight: 700; font-size: 16px; color: #111; border-bottom: 1.5px solid #333; }
      .occ-summary-table .hdr-value { font-weight: 700; font-size: 16px; color: #111; text-align: left; border-bottom: 1.5px solid #333; }
      .occ-summary-table .row-label { font-size: 14px; color: #333; border-bottom: 1px solid #e3e3e3; }
      .occ-summary-table .row-value { font-size: 14px; font-weight: 700; color: #111; text-align: left; border-bottom: 1px solid #e3e3e3; }
      .occ-summary-table .row-blank { border-bottom: none; }
      .occ-summary-table .divider { width: 36px; padding: 0; border-left: 1px solid #e3e3e3; }
      .occ-summary-table .divider.hdr-divider { border-bottom: 1.5px solid #333; }
      .occ-summary-table .divider.no-line { border-left: none; }
      .register-print-meta { display: flex; justify-content: space-between; font-size: 12px; color: #666; margin-top: 16px; }`

    const bodyHtml = `
      <div class="register-title">ROOM OCCUPANCY REGISTER</div>
      <div class="register-subheader">
        <div>Hotel: ${hotel}</div>
        <div>For Date&nbsp;&nbsp;${forDateStr}</div>
      </div>

      <table class="occ-table">
        <thead>
          <tr>
            <th>ROOM</th>
            <th>REG NO</th>
            <th>COMPANY NAME</th>
            <th>CUSTOMER NAME</th>
            <th>ARRIVAL &amp;<br/>DEPARTURE DATE</th>
            <th class="num">PAX</th>
            <th class="num">TERIFF</th>
            <th class="num">DISCOUNT</th>
            <th class="num">DUE AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <table class="occ-summary-table">
        <tr>
          <td class="hdr-label">TOTAL OCCUPIED ROOMS</td>
          <td class="hdr-value">${occupied}</td>
          <td class="divider hdr-divider"></td>
          <td class="hdr-label">TOTAL PAX</td>
          <td class="hdr-value">${totalPax}</td>
          <td class="divider hdr-divider"></td>
          <td class="hdr-label"></td>
          <td class="hdr-value"></td>
        </tr>
        <tr>
          <td class="row-label">Free &amp; Clean</td>
          <td class="row-value">${freeClean}</td>
          <td class="divider"></td>
          <td class="row-label">Occupied Clean</td>
          <td class="row-value">${occupiedClean}</td>
          <td class="divider"></td>
          <td class="row-label">Credit Limit</td>
          <td class="row-value">${creditLimit}</td>
        </tr>
        <tr>
          <td class="row-label">Free &amp; Dirty</td>
          <td class="row-value">${freeDirty}</td>
          <td class="divider"></td>
          <td class="row-label">Occupied Dirty</td>
          <td class="row-value">${occupiedDirty}</td>
          <td class="divider"></td>
          <td class="row-label">Room Message</td>
          <td class="row-value">${roomMessage}</td>
        </tr>
        <tr>
          <td class="row-label">Total Rooms</td>
          <td class="row-value">${totalRooms}</td>
          <td class="divider"></td>
          <td class="row-label">Occupied</td>
          <td class="row-value">${occupied}</td>
          <td class="divider"></td>
          <td class="row-label">Reserved Walkins</td>
          <td class="row-value">${reservedWalkins}</td>
        </tr>
        <tr>
          <td class="row-label">Total Free</td>
          <td class="row-value">${totalFree}</td>
          <td class="divider"></td>
          <td class="row-label">Out Of Order</td>
          <td class="row-value">${outOfOrder}</td>
          <td class="divider"></td>
          <td class="row-label">Reserved Online</td>
          <td class="row-value">${reservedOnline}</td>
        </tr>
      </table>

      <div class="register-print-meta">
        <div>PRINT DATE&nbsp;&nbsp;${forDateStr}</div>
        <div>${formatRegisterDateTime(now.toISOString())}</div>
      </div>
    `

    return { occupiedCount: occupied, bodyHtml, styleCss }
  }

  // Single "Occupancy Chart" action: downloads the Room Occupancy Register
  // straight as a PDF file (no print dialog, no separate preview page).
  // Render the markup off-screen, capture it with html2canvas, then drop it
  // into a jsPDF document and save it — same technique as the main At a
  // Glance table's PDF export.
  const handleOccupancyChartPDF = async () => {
    const { occupiedCount, bodyHtml, styleCss } = getOccupancyRegisterData()

    if (occupiedCount === 0) {
      toast.error('No occupied rooms to export')
      return
    }

    const wrapper = document.createElement('div')
    // Positioned fully off-screen (fixed + pushed far outside the viewport)
    // rather than relying on normal document flow. This guarantees it never
    // becomes visible — not even briefly while html2canvas captures it —
    // and it can't get left sitting at the bottom of the page if capture
    // fails part-way through.
    wrapper.style.position = 'fixed'
    wrapper.style.top = '0'
    wrapper.style.left = '-10000px'
    wrapper.style.zIndex = '-1'
    wrapper.style.background = '#fff'
    wrapper.style.padding = '20px'
    wrapper.style.width = '1200px'
    wrapper.style.fontFamily = 'Arial, sans-serif'
    wrapper.style.color = '#111'

    const style = document.createElement('style')
    style.textContent = styleCss
    wrapper.appendChild(style)

    const content = document.createElement('div')
    content.innerHTML = bodyHtml
    wrapper.appendChild(content)

    document.body.appendChild(wrapper)

    try {
      const canvas = await html2canvas(wrapper, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      })

      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      addCanvasToPdf(pdf, canvas, 10)
      pdf.save('room-occupancy-register.pdf')
    } catch (err) {
      console.error(err)
      toast.error('PDF generation failed')
    } finally {
      // Always clean up the off-screen render node — success or failure —
      // so it can never get left behind in the page.
      if (wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper)
      }
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

  if (!loading && atGlanceData.length === 0) {
    return (
      <>
        <TitleHelmet title="At a Glance - Room Status" />
        <div className="container-fluid p-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h4 className="mb-0">
              <i className="fi fi-rr-eye me-2"></i> At a Glance
            </h4>
            <Button variant="outline-secondary" size="sm" onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>
          <div className="text-center py-5">
            <i className="fi fi-rr-info text-muted fs-1 mb-3 d-block"></i>
            <p className="text-muted">No room data available at the moment.</p>
            <Button variant="outline-primary" onClick={fetchAtGlanceData}>
              Refresh
            </Button>
          </div>
        </div>
      </>
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

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div className="d-flex align-items-center gap-2">
              <label className="fw-semibold mb-0" style={{ fontSize: '0.9rem' }}>
                Filter by Status:
              </label>
              <select
                className="form-select form-select-sm"
                style={{ width: 200 }}
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <option value="All">All</option>
                {Array.from(new Set(atGlanceData.map((x) => (x.status || '').trim()).filter(Boolean)))
                  .sort((a, b) => a.localeCompare(b))
                  .map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
              </select>
            </div>

            <Button variant="success" size="sm" onClick={handlePrint}>
              <i className="fi fi-rr-print me-1"></i> Print
            </Button>
            <Button variant="primary" size="sm" onClick={handlePDF}>
              <i className="fi fi-rr-file-pdf me-1"></i> PDF
            </Button>
            <Button variant="warning" size="sm" onClick={handleOccupancyChartPDF}>
              <i className="fi fi-rr-chart-histogram me-1"></i> Occupancy Chart
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={() => navigate(-1)}>
              Back
            </Button>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: 8 }}>
          <div className="text-muted" style={{ fontSize: '0.85rem' }}>
            Showing {
              atGlanceData.filter(
                (x) => selectedStatus === 'All' || (x.status || '') === selectedStatus
              ).length
            } rows
          </div>

          <div className="d-flex align-items-center gap-4">
            {statusCounts.map((sc) => (
              <div
                key={sc.status}
                className="d-flex align-items-center gap-2"
                style={{ fontSize: '0.9rem', fontWeight: 600 }}
              >
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    background: sc.statusColor || '#ddd',
                    border: '1px solid rgba(0,0,0,0.15)',
                    display: 'inline-block',
                  }}
                />
                <span>{sc.status}</span>
                <span>{sc.count}</span>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          .table-scroll-wrapper {
            position: relative;
            height: calc(100vh - 225px);
            overflow: auto;
          }
          
          .at-glance-table {
            width: 100% !important;
            table-layout: auto;
            font-size: 0.75rem;
            border-collapse: collapse;
          }
          
          .at-glance-table thead {
            position: sticky;
            top: 0;
            z-index: 10;
          }
          
          .at-glance-table thead th {
            background: #f2f2f2 !important;
            font-weight: 600;
            color: inherit;
            border-bottom: 2px solid #dee2e6;
            position: sticky;
            top: 0;
            z-index: 10;
          }
          
          .at-glance-table td {
            vertical-align: top;
          }
          
          .at-glance-table tbody tr {
            transition: background-color 0.15s ease;
          }
          
          .at-glance-table tbody tr:hover {
            background-color: rgba(0, 0, 0, 0.05) !important;
          }

          /* Remove all DataTable styles */
          table.dataTable,
          .dataTables_wrapper,
          .dataTables_scroll,
          .dataTables_paginate,
          .dataTables_info,
          .dataTables_length {
            all: unset !important;
          }
          
          table.dataTable td,
          table.dataTable th {
            all: revert !important;
          }

          /* Custom scrollbar styling */
          .table-scroll-wrapper::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          .table-scroll-wrapper::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 4px;
          }
          
          .table-scroll-wrapper::-webkit-scrollbar-thumb {
            background: #c1c7cd;
            border-radius: 4px;
          }
          
          .table-scroll-wrapper::-webkit-scrollbar-thumb:hover {
            background: #a0a7ad;
          }
        `}</style>

        <div className="table-scroll-wrapper">
          <table className="at-glance-table table table-bordered table-sm">
            <thead>
              <tr>
                <th>FLOOR</th>
                <th>ROOM</th>
                <th>GUEST NAME</th>
                <th>COMPANY</th>
                <th>DAYS</th>
                <th>ARRIVAL/DEPAR DATE</th>
                <th>TERIFF</th>
                <th>DISCOUNT</th>
                <th>ROOM CATEGORY</th>
                <th>CONV. CATEGORY</th>
                <th>PAYMENT</th>
                <th>PLAN</th>
                <th>ADULTS</th>
                <th>PAX</th>
                <th>EX-PAX</th>
                <th>CHILD</th>
                <th>DRIVER</th>
                 <th>DUE AMOUNT</th>
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {atGlanceData
                .filter((item) => selectedStatus === 'All' || (item.status || '') === selectedStatus)
                .map((item, idx) => {
                  const rowStyle = getStatusStyle(item.status || '', item.status_color)
                  return (
                    <tr key={`${item.roomNo || 'room'}-${idx}`} style={rowStyle}>
                      <td>{item.floorNo}</td>
                      <td>{item.roomNo}</td>
                      <td>{item.guest}</td>
                       <td>{item.companyName}</td>
                      <td>{item.totalDays ?? '-'}</td>
                      <td>
                        <div>{item.checkinDatetime ? formatDateTime(item.checkinDatetime) : '-'}</div>
                        <div>{item.checkoutDatetime ? formatDateTime(item.checkoutDatetime) : '-'}</div>
                      </td>
                      <td>{formatAmount(item.totalAmt)}</td>
                      <td>{item.discountPercent}%</td>
                      <td>{item.roomCategory}</td>
                      <td>{item.convertedCategory || '-'}</td>
                      <td>{item.payType}</td>
                      <td>{item.planName || '-'}</td>
                      <td>{item.adults}</td>
                      <td>{item.pax}</td>
                      <td>{item.exPax}</td>
                      <td>{item.child}</td>
                      <td>{item.driver}</td>
                        <td>{item.dueAmount}</td>
                      <td>{item.status || '-'}</td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export default AtGlance