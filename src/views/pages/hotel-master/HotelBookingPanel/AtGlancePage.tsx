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

  // Prefer backend-provided color (status_color)
  const bg = statusColor?.trim() || undefined
  if (bg) {
    return {
      backgroundColor: bg,
      color: getContrastColor(bg),
    }
  }

  // Fallback colors by status name
  // (These can be adjusted if your exact status names differ)
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

const AtGlance = () => {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const hotelId = user?.hotelid

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
        // keep existing color (prefer first non-empty)
        if (!existing.statusColor && (item as any).status_color) {
          existing.statusColor = (item as any).status_color
        }
      } else {
       map.set(status, {
  status,
  count: 1,
  statusColor: (item as any).status_color,
})
      }
    }


    return Array.from(map.values()).sort((a, b) => a.status.localeCompare(b.status))
  }, [atGlanceData])

  const fetchAtGlanceData = async () => {
    if (!hotelId) return
    setLoading(true)
    setError(null)
    try {
      const atGlanceRes = await CheckInService.getAtGlance({ hotelid: hotelId })
      console.log('getAtGlance raw response (atGlanceRes.data):', atGlanceRes.data)
      const checkins = atGlanceRes.data || []
      console.log('API Count', checkins.length)
      console.log('atGlanceRes.data.slice(0,5):', checkins.slice(0, 5))

      const items: AtGlanceItem[] = checkins.map((c: CheckIn) => {
        // Normalize possible backend color keys so status wise blocks show correctly
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
          // backend: fm.floor_name as floorNo
          floorNo: (c as any).floorNo || (c as any).floor_name || '',
          floorId: (c as any).floor_id || (c as any).floorId || 0,

          // backend: rm.room_no (available rooms) and cdm.room_number AS occupied_room_number (occupied rooms)
          roomNo:
            (c as any).room_no ||
            (c as any).occupied_room_number ||
            (c as any).roomNumber ||
            (c as any).roomNo ||
            '',


          guest: (c as any).guest_name || '',

          // backend: rs.status_name AS status
          status: (c as any).status || (c as any).room_status || '',

          // backend: total_room_amount as totalAmt (controller maps totalAmt)
          totalAmt:
            Number(
              (c as any).totalAmt ??
                (c as any).total_room_amount ??
                (c as any).total_amount ??
                (c as any).total_amount ??
                0,
            ) || 0,

          groupAmt: 0,

          // backend: discountPercent
          discountPercent: (c as any).discountPercent ?? (c as any).discount_percent ?? 0,

          payType: (c as any).payment_method ? String((c as any).payment_method) : 'Cash',

          checkinDatetime,
          checkoutDatetime,

          pax: Number((c as any).pax || 0) || 0,
          adults: Number((c as any).adults || 0) || 0,
          exPax: Number((c as any).ex_pax ?? (c as any).exPax ?? 0) || 0,
          child: Number((c as any).child ?? (c as any).child_paid_amount ?? 0) || 0,
          driver: Number((c as any).driver || 0) || 0,

          // backend: cdm.room_category_name AS roomCategory
          roomCategory:
            (c as any).roomCategory ??
            (c as any).room_category_name ??
            (c as any).room_category ??
            (c as any).roomCategoryName ??
            '',

          roomId: (c as any).room_id || (c as any).roomId || 0,

          // backend: cdm.converted_category_name AS convertedCategory
          convertedCategory:
            (c as any).convertedCategory ??
            (c as any).converted_category_name ??
            (c as any).converted_category ??
            (c as any).convertedCategoryName ??
            '',

          planName: (c as any).plan_name || '',
          totalDays: computedTotalDays,
        }
      })

      console.log('UI Count', items.length)
      items.sort((a, b) => a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true }))
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

        {/* Ensure this table never looks like DataTable (width/design reset) */}

        <style>{`
          .at-glance-table {
            width: 100% !important;
            table-layout: auto;
            font-size: 0.75rem;
          }
          .at-glance-table thead th {
            background: #f2f2f2 !important;
            font-weight: 600;
            color: inherit;
          }
          .at-glance-table td {
            vertical-align: top;
          }
          /* If any DataTables CSS is present globally, neutralize the most common parts */
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
        `}</style>

        <div className="table-responsive">
          <table className="at-glance-table table table-bordered table-sm">
            <thead className="table-light">
              <tr>
                <th>FLOOR</th>
                <th>ROOM</th>
                 <th>GUEST NAME</th>
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
                <th>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {atGlanceData
                .filter((item) => selectedStatus === 'All' || (item.status || '') === selectedStatus)
                .map((item, idx) => {
                  const rowStyle = getStatusStyle(item.status || '', (item as any).status_color)
                  return (
                    <tr key={`${item.roomNo || 'room'}-${idx}`} style={rowStyle}>

                      <td>{item.floorNo}</td>
                      <td>{item.roomNo}</td>
                      <td>{item.guest}</td>
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

