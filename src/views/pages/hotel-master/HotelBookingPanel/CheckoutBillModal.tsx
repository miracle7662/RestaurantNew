// components/CheckoutBillModal.tsx
import React, { useRef, useEffect, useState } from 'react'
import { Modal, Button, Spinner } from 'react-bootstrap'
import BillPrintSettingService, { BillPrintSetting } from '@/common/hotel/billPrintSettingService'

// ==================== INTERFACES ====================

interface DisplayDetailRow {
  id: string
  guest_room_charges_id: number
  checkin_id: number
  guest_id: number
  detail_id?: number
  room_id: number
  room_number: string
  room_category_name: string
  converted_category_name: string
  bill_date: string
  bill_date_formatted: string
  checkin_datetime: string
  checkout_datetime: string
  no_of_days: number
  day_number: number
  original_day_number: number
  room_tariff_per_day: number
  total_room_tariff: number
  ex_pax_count: number
  ex_pax_price: number
  ex_pax_tax: number
  ex_pax_tax_percent: number
  ex_pax_total: number
  child_count: number
  child_unpaid: number
  child_price: number
  child_tax: number
  child_tax_percent: number
  child_total: number
  driver_count: number
  driver_price: number
  driver_tax: number
  driver_tax_percent: number
  driver_total: number
  cgst_amount: number
  sgst_amount: number
  igst_amount: number
  cess_amount: number
  service_charge_amount: number
  adults: number
  pax: number
  ex_pax: number
  child_paid: number
  driver: number
  discount_percent: number
  discount_amount: number
  tax_percent: number
  tax_amount: number
  total_amount: number
  is_extension: boolean
  isPostCharge?: boolean
  parent_detail_id?: number | null
  selected: boolean
  cumulative_total: number
  guest_name: string
  payment_method: string
  created_at: string
  has_checkout_datetime: boolean
  checkout_time_formatted: string
  description?: string
  particulars?: string
  department_name?: string
  cgst_percent?: number
  sgst_percent?: number
  igst_percent?: number
  cess_percent?: number
  service_charge_percent?: number
}

interface CombinedGuestSummary {
  checkin_id: number
  guest_id: number
  guest_name: string
  room_numbers: string[]
  room_categories: string[]
  converted_categories: string[]
  room_numbers_str: string
  room_categories_str: string
  converted_categories_str: string
  total_room_tariff: number
  total_ex_pax_charge: number
  total_child_paid_amount: number
  total_driver_charge: number
  total_tax_amount: number
  total_amount: number
  total_days: number
  total_adults: number
  total_pax: number
  total_ex_pax: number
  total_child_paid: number
  total_child_unpaid: number
  total_driver: number
  avg_discount_percent: number
  avg_tax_percent: number
  has_extensions: boolean
  extension_count: number
  extension_days: number
  payment_methods: string[]
  payment_method: string
  charges_ids: number[]
  selected: boolean
  original_checkin_datetime: string
  final_checkout_datetime: string
  guest_mobile?: string
  guest_address?: string
  guest_email?: string
  guest_id_proof?: string
  reg_no?: string
  booking_ref?: string
  plan_name?: string
  checked_out_rooms?: string[]
}

interface CheckoutBillModalProps {
  show: boolean
  onHide: () => void
  combinedSummary: CombinedGuestSummary | null
  displayRows: DisplayDetailRow[]
  grandTotal: number
  hotelName?: string
  hotelAddress?: string
  hotelPhone?: string
  hotelEmail?: string
  hotelWebsite?: string
  hotelGSTIN?: string
  hotelFSSAI?: string
  hotelPAN?: string
  hotelLogo?: string
  billNumber?: string
  paymentTransactionId?: string
  paymentDate?: string
  paymentBank?: string
  hotelId?: number
  checkedOutRooms?: string[]
}

interface TableRowWithIndex extends DisplayDetailRow {
  displayIndex: number
}

// ==================== HELPERS ====================

const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0
  const num = Number(value)
  return isNaN(num) ? 0 : num
}

const roundToTwo = (num: number): number => {
  if (isNaN(num) || num === null || num === undefined) return 0
  return Math.round((num + Number.EPSILON) * 100) / 100
}

const formatAmt = (amt: number): string => {
  const rounded = roundToTwo(toNumber(amt))
  if (rounded === 0) return '0.00'
  return Math.abs(rounded).toFixed(2)
}

const formatAmtDisplay = (amt: number): string => {
  const rounded = roundToTwo(toNumber(amt))
  return `₹${rounded.toFixed(2)}`
}

const formatDate = (isoString: string): string => {
  if (!isoString) return '-'
  const d = new Date(isoString)
  const day = d.getDate().toString().padStart(2, '0')
  const month = d.toLocaleString('default', { month: 'short' })
  const year = d.getFullYear()
  return `${day} ${month} ${year}`
}

const formatDateLong = (isoString: string): string => {
  if (!isoString) return '-'
  const d = new Date(isoString)
  const day = d.getDate().toString().padStart(2, '0')
  const month = d.toLocaleString('default', { month: 'long' })
  const year = d.getFullYear()
  return `${day} ${month} ${year}`
}

const numberToWords = (num: number): string => {
  const ones = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ]
  const tens = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ]

  const convertHundreds = (n: number): string => {
    if (n >= 100) {
      return ones[Math.floor(n / 100)] + ' Hundred ' + convertHundreds(n % 100)
    } else if (n >= 20) {
      return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '')
    } else {
      return ones[n]
    }
  }

  if (num === 0) return 'Zero Rupees Only'

  const intPart = Math.floor(num)
  const decPart = Math.round((num - intPart) * 100)

  let result = ''
  if (intPart >= 10000000) {
    result += convertHundreds(Math.floor(intPart / 10000000)) + ' Crore '
    const remainder = intPart % 10000000
    if (remainder > 0) result += convertHundreds(remainder)
  } else if (intPart >= 100000) {
    result += convertHundreds(Math.floor(intPart / 100000) % 100) + ' Lakh '
    result += convertHundreds(intPart % 100000)
  } else if (intPart >= 1000) {
    result += convertHundreds(Math.floor(intPart / 1000) % 100) + ' Thousand '
    result += convertHundreds(intPart % 1000)
  } else {
    result += convertHundreds(intPart % 1000)
  }

  result = result.trim() + ' Rupees'
  if (decPart > 0) result += ' and ' + convertHundreds(decPart) + ' Paise'
  return result + ' Only'
}

// ==================== BILL COMPONENT ====================

const CheckoutBillModal: React.FC<CheckoutBillModalProps> = ({
  show,
  onHide,
  combinedSummary,
  displayRows,
  grandTotal,
  hotelName = 'GRAND VIEW HOTEL',
  hotelAddress = '123, Park Avenue, City Center, New Delhi - 110001, India',
  hotelPhone = '+91 11 4567 8900',
  hotelEmail = 'info@grandviewhotel.com',
  hotelWebsite = 'www.grandviewhotel.com',
  hotelGSTIN = '07AABCG1234F1Z5',
  hotelFSSAI = '12345678901234',
  hotelPAN = 'AABCG1234F',
  hotelLogo = '',
  billNumber,
  paymentTransactionId,
  paymentDate,
  paymentBank,
  hotelId,
  checkedOutRooms,
}) => {
  const printRef = useRef<HTMLDivElement>(null)
  const [printSettings, setPrintSettings] = useState<BillPrintSetting | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    const fetchSettings = async () => {
      if (hotelId && show) {
        setSettingsLoading(true)
        try {
          const response = await BillPrintSettingService.getByHotelId(hotelId)
          if (response.success && response.data) {
            setPrintSettings(response.data)
          }
        } catch (error) {
          console.error('Failed to fetch print settings:', error)
        } finally {
          setSettingsLoading(false)
        }
      } else {
        setSettingsLoading(false)
      }
    }
    if (show) fetchSettings()
  }, [hotelId, show])

  const selectedRows = displayRows.filter((r) => r.selected)

  const roomCharges = selectedRows.filter((r) => !r.isPostCharge)
  const postCharges = selectedRows.filter((r) => r.isPostCharge && r.total_amount > 0)
  const allowances = selectedRows.filter((r) => r.isPostCharge && r.total_amount < 0)

  const totalRoomTariff = roundToTwo(
    roomCharges.reduce((s, r) => s + (r.room_tariff_per_day || 0), 0),
  )
  const totalExPax = roundToTwo(roomCharges.reduce((s, r) => s + (r.ex_pax_total || 0), 0))
  const totalChild = roundToTwo(roomCharges.reduce((s, r) => s + (r.child_total || 0), 0))
  const totalDriver = roundToTwo(roomCharges.reduce((s, r) => s + (r.driver_total || 0), 0))
  const totalTax = roundToTwo(selectedRows.reduce((s, r) => s + (r.tax_amount || 0), 0))
  const totalCGST = roundToTwo(selectedRows.reduce((s, r) => s + (r.cgst_amount || 0), 0))
  const totalSGST = roundToTwo(selectedRows.reduce((s, r) => s + (r.sgst_amount || 0), 0))
  const totalIGST = roundToTwo(selectedRows.reduce((s, r) => s + (r.igst_amount || 0), 0))
  const totalCess = roundToTwo(selectedRows.reduce((s, r) => s + (r.cess_amount || 0), 0))
  const totalServiceCharge = roundToTwo(
    selectedRows.reduce((s, r) => s + (r.service_charge_amount || 0), 0),
  )
  const discountAmount = roundToTwo(roomCharges.reduce((s, r) => s + (r.discount_amount || 0), 0))

  const totalPostCharges = roundToTwo(postCharges.reduce((s, r) => s + Math.abs(r.total_amount), 0))
  const totalAllowances = roundToTwo(allowances.reduce((s, r) => s + Math.abs(r.total_amount), 0))

  const grossTotal =
    totalRoomTariff + totalExPax + totalChild + totalDriver + totalPostCharges - totalAllowances
  const taxableAmount = roundToTwo(grossTotal - discountAmount)

  let cgstPercent = 0
  let sgstPercent = 0
  let igstPercent = 0
  let cessPercent = 0
  let serviceChargePercent = 0

  if (taxableAmount > 0) {
    if (totalIGST > 0) {
      igstPercent = roundToTwo((totalIGST / taxableAmount) * 100)
    } else if (totalCGST > 0 && totalSGST > 0) {
      cgstPercent = roundToTwo((totalCGST / taxableAmount) * 100)
      sgstPercent = roundToTwo((totalSGST / taxableAmount) * 100)
    }

    if (totalCess > 0) {
      cessPercent = roundToTwo((totalCess / taxableAmount) * 100)
    }

    if (totalServiceCharge > 0) {
      serviceChargePercent = roundToTwo((totalServiceCharge / taxableAmount) * 100)
    }
  }

  const avgTaxPercent =
    roomCharges.length > 0
      ? roundToTwo(roomCharges.reduce((s, r) => s + (r.tax_percent || 0), 0) / roomCharges.length)
      : taxableAmount > 0
        ? roundToTwo((totalTax / taxableAmount) * 100)
        : 0

  const netTotal = grandTotal

  const displayCheckedOutRooms =
    checkedOutRooms && checkedOutRooms.length > 0
      ? checkedOutRooms
      : combinedSummary?.checked_out_rooms || combinedSummary?.room_numbers || []

  const checkedOutRoomsStr =
    displayCheckedOutRooms.join(', ') || combinedSummary?.room_numbers_str || ''

  const checkinDateDisplay = combinedSummary?.original_checkin_datetime
    ? formatDateLong(combinedSummary.original_checkin_datetime)
    : '-'
  const checkoutDateDisplay = combinedSummary?.final_checkout_datetime
    ? formatDateLong(combinedSummary.final_checkout_datetime)
    : '-'
  const checkinTimeDisplay = combinedSummary?.original_checkin_datetime
    ? new Date(combinedSummary.original_checkin_datetime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '14:00'
  const checkoutTimeDisplay = '11:00'
  const invoiceDate = formatDate(new Date().toISOString())
  const generatedBillNo =
    billNumber ||
    `INV/${new Date().getFullYear()}/${String(combinedSummary?.checkin_id || '0').padStart(4, '0')}`
  const bookingId = combinedSummary?.reg_no || `BKD${combinedSummary?.checkin_id || '0000'}`
  const paymentStatus = 'Paid'
  const paymentMode = combinedSummary?.payment_method || 'Credit Card'

  const headerBg = printSettings?.table_header_bg_color || '#1a2744'
  const headerText = printSettings?.table_header_text_color || '#ffffff'

  const showTopHeaderSection = printSettings?.show_top_header_section !== 0
  const topMarginWhenHeaderHidden = printSettings?.top_margin_when_header_hidden || 30

  const getFontSize = () => {
    switch (printSettings?.table_font_size) {
      case 'small':
        return '8pt'
      case 'large':
        return '11pt'
      default:
        return '9.5pt'
    }
  }

  // ==================== ALL STYLES ====================
  const getBillStyles = () => `
    .bill-wrap * { box-sizing: border-box; }
    .bill-wrap {
      font-family: 'Segoe UI', 'Calibri', Arial, sans-serif;
      font-size: ${getFontSize()};
      color: #1a1a1a;
      line-height: 1.4;
    }
    .bill-wrap .text-left { text-align: left; }
    .bill-wrap .text-center { text-align: center; }
    .bill-wrap .text-right { text-align: right; }
    .bill-wrap .mt-1 { margin-top: 5px; }
    .bill-wrap .mt-2 { margin-top: 10px; }
    .bill-wrap .mt-3 { margin-top: 15px; }
    .bill-wrap .mb-1 { margin-bottom: 5px; }
    .bill-wrap .mb-2 { margin-bottom: 10px; }
    .bill-wrap .mb-3 { margin-bottom: 15px; }

    .bill-wrap .bill-divider {
      border: none;
      border-top: 1.5px solid #d0d0d0;
      margin: 12px 0;
    }

    .bill-wrap .bill-info-box {
      border: 1px solid #c8c8c8;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 15px;
    }
    .bill-wrap .bill-info-box-header {
      background: ${headerBg};
      color: ${headerText};
      text-align: center;
      font-weight: 700;
      font-size: 8.5pt;
      letter-spacing: 1px;
      padding: 6px 10px;
    }
    .bill-wrap .bill-info-box-body {
      padding: 10px 12px;
    }

    .bill-wrap .bill-detail-table {
      width: 100%;
      border-collapse: collapse;
    }
    .bill-wrap .bill-detail-table td {
      padding: 3px 2px;
      font-size: 8.5pt;
      vertical-align: top;
    }
    .bill-wrap .bdt-label {
      font-weight: 600;
      color: #333;
      white-space: nowrap;
      width: 110px;
    }
    .bill-wrap .bdt-colon {
      padding: 3px 6px;
      color: #555;
      width: 12px;
    }
    .bill-wrap .bdt-value {
      color: #222;
    }

    .bill-wrap .two-column-layout {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      align-items: stretch;
    }
    .bill-wrap .two-column-layout > div {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
    }
    .bill-wrap .two-column-layout > div > .bill-info-box {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .bill-wrap .two-column-layout > div > .bill-info-box > .bill-info-box-body {
      flex: 1;
    }

    .bill-wrap .bill-charges-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 0;
      font-size: ${getFontSize()};
    }
    .bill-wrap .bill-charges-table thead tr th {
      background: ${headerBg};
      color: ${headerText};
      font-weight: 700;
      padding: 7px 8px;
      border: 1px solid ${headerBg};
      white-space: nowrap;
    }
    .bill-wrap .bill-charges-table tbody tr td {
      border: 1px solid #d4d4d4;
      padding: 6px 8px;
      vertical-align: middle;
    }
    .bill-wrap .bill-charges-table tbody tr:nth-child(even) td {
      background: #f9f9f9;
    }
    .bill-wrap .bill-charges-table tfoot td {
      border: 1px solid #d4d4d4;
      padding: 6px 8px;
    }
    .bill-wrap .bct-right { text-align: right; }
    .bill-wrap .bct-center { text-align: center; }

    .bill-wrap .bct-total-row .bct-total-label {
      font-weight: 600;
      text-align: right;
      background: #f4f4f4;
    }
    .bill-wrap .bct-total-row .bct-total-value {
      text-align: right;
      font-weight: 600;
      background: #f4f4f4;
    }
    .bill-wrap .bct-postcharge-row .bct-postcharge-label {
      font-weight: 600;
      text-align: right;
      background: #e3f2fd;
      color: #0066cc;
    }
    .bill-wrap .bct-postcharge-row .bct-postcharge-value {
      text-align: right;
      font-weight: 600;
      background: #e3f2fd;
      color: #0066cc;
    }
    .bill-wrap .bct-allowance-row .bct-allowance-label {
      font-weight: 600;
      text-align: right;
      background: #fce4ec;
      color: #cc0000;
    }
    .bill-wrap .bct-allowance-row .bct-allowance-value {
      text-align: right;
      font-weight: 600;
      background: #fce4ec;
      color: #cc0000;
    }
    .bill-wrap .bct-grand-total-row .bct-grand-label {
      font-weight: 800;
      font-size: 10pt;
      text-align: right;
      background: #f0f0f0;
    }
    .bill-wrap .bct-grand-total-row .bct-grand-value {
      font-weight: 800;
      font-size: 10pt;
      text-align: right;
      background: #f0f0f0;
    }
    .bill-wrap .bct-paid-row .bct-paid-label {
      font-weight: 800;
      font-size: 10pt;
      color: ${headerBg};
      text-align: right;
      background: #eef2fa;
    }
    .bill-wrap .bct-paid-row .bct-paid-value {
      font-weight: 800;
      font-size: 10pt;
      color: ${headerBg};
      text-align: right;
      background: #eef2fa;
    }

    .bill-wrap .bill-amount-words {
      border: 1px solid #d4d4d4;
      border-top: none;
      padding: 6px 10px;
      font-size: 8.5pt;
      margin-bottom: 16px;
    }
    .bill-wrap .baw-label { font-style: italic; color: #555; margin-right: 4px; }
    .bill-wrap .baw-text { font-style: italic; color: #222; }

    .bill-wrap .bill-thankyou {
      font-family: 'Dancing Script', 'Brush Script MT', cursive;
      font-size: 24pt;
      color: ${headerBg};
      line-height: 1.2;
    }

    .bill-wrap .bill-hotel-logo {
      max-height: 70px;
      max-width: 180px;
      object-fit: contain;
    }

    .bill-wrap .bill-info-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      padding: 8px 12px;
      background: #f8f9fa;
      border: 1px solid #dde2ea;
      border-radius: 4px;
      margin-bottom: 15px;
      font-size: 8.5pt;
    }
    .bill-wrap .bill-info-row > div {
      flex: 1;
      min-width: 160px;
    }
    .bill-wrap .bill-info-row strong {
      color: #333;
    }
    .bill-wrap .status-paid {
      color: #1a7a3a;
      font-weight: 700;
    }
    .bill-wrap .checked-out-rooms {
      background: #e8f5e9;
      padding: 6px 10px;
      border-radius: 4px;
      margin-bottom: 12px;
      font-size: 8.5pt;
      border-left: 3px solid #4caf50;
    }
    .charge-type-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 7pt;
      font-weight: 600;
      margin-left: 6px;
    }
    .room-badge {
      background: #e3f2fd;
      color: #0066cc;
    }
    .postcharge-badge {
      background: #e3f2fd;
      color: #0066cc;
    }
    .allowance-badge {
      background: #fce4ec;
      color: #cc0000;
    }
  `



  const handlePrint = () => {
    const printContents = printRef.current?.innerHTML || ''
    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) return

    // When header is hidden, spacer div in printContents handles the top gap,
    // so @page top margin should be 0.
    const effectiveTopMargin = !showTopHeaderSection ? 0 : printSettings?.margin_top_mm || 12

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hotel Bill - ${combinedSummary?.guest_name || 'Guest'}</title>
          <style>
            * { 
              box-sizing: border-box; 
              margin: 0; 
              padding: 0; 
            }
            @page {
              size: ${printSettings?.default_print_size === 'A4' ? 'A4' : 'auto'};
              margin: ${effectiveTopMargin}mm ${printSettings?.margin_right_mm || 10}mm ${printSettings?.margin_bottom_mm || 12}mm ${printSettings?.margin_left_mm || 10}mm;
            }
            body { 
              background: white; 
              margin: 0; 
              padding: 0;
            }
            .print-container {
              width: 100%;
              margin: 0;
              padding: 0;
            }
            ${getBillStyles()}
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .print-container {
                margin: 0;
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${printContents}
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }

  const handleDownloadPDF = async () => {
    const billEl = printRef.current
    if (!billEl) return

    setPdfLoading(true)
    try {
      // Dynamically load html2canvas and jsPDF from CDN if not already loaded
      const loadScript = (src: string): Promise<void> =>
        new Promise((resolve, reject) => {
          if (document.querySelector(`script[src="${src}"]`)) {
            resolve()
            return
          }
          const scriptEl = document.createElement('script')
          scriptEl.src = src
          scriptEl.onload = () => resolve()
          scriptEl.onerror = () => reject(new Error(`Failed to load ${src}`))
          document.head.appendChild(scriptEl)
        })

      await loadScript(
        'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
      )
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')

      const html2canvas = (window as any).html2canvas
      const { jsPDF } = (window as any).jspdf

      const printSize = printSettings?.default_print_size || 'A4'
      const isA4 = printSize !== 'thermal_80mm' && printSize !== 'thermal_58mm'
      const pdfW = isA4 ? 210 : printSize === 'thermal_80mm' ? 80 : 58 // mm
          

      const canvas = await html2canvas(billEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: billEl.scrollWidth,
        height: billEl.scrollHeight, // ← FIXED: capture full bill height, not the PDF page mm value
        windowWidth: billEl.scrollWidth,
        windowHeight: billEl.scrollHeight,
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.92)
      const imgW =
        pdfW - (printSettings?.margin_left_mm || 10) - (printSettings?.margin_right_mm || 10)
      const imgH = (canvas.height / canvas.width) * imgW

      const topMargin = !showTopHeaderSection
        ? printSettings?.top_margin_when_header_hidden || 30
        : printSettings?.margin_top_mm || 12
      const bottomMargin = printSettings?.margin_bottom_mm || 12
      const leftMargin = printSettings?.margin_left_mm || 10

      // For long bills that exceed one A4 page, split across pages
      const pageContentH = (isA4 ? 297 : 999) - topMargin - bottomMargin
      const orientation = imgH <= pageContentH ? 'portrait' : 'portrait'

      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: isA4 ? 'a4' : [pdfW, imgH + topMargin + bottomMargin],
      })
      if (imgH <= pageContentH) {
        // Single page
        pdf.addImage(imgData, 'JPEG', leftMargin, topMargin, imgW, imgH)
      } else {
        // Multi-page: slice the canvas into page-height chunks
        const pageHeightPx = (pageContentH / imgW) * canvas.width
        let yOffset = 0
        let page = 0
        while (yOffset < canvas.height) {
          if (page > 0) pdf.addPage()
          const sliceH = Math.min(pageHeightPx, canvas.height - yOffset)
          const sliceCanvas = document.createElement('canvas')
          sliceCanvas.width = canvas.width
          sliceCanvas.height = sliceH
          const ctx = sliceCanvas.getContext('2d')!
          ctx.drawImage(canvas, 0, yOffset, canvas.width, sliceH, 0, 0, canvas.width, sliceH)
          const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.92)
          const sliceImgH = (sliceH / canvas.width) * imgW
          const yPos = page === 0 ? topMargin : bottomMargin
          pdf.addImage(sliceData, 'JPEG', leftMargin, yPos, imgW, sliceImgH)
          yOffset += sliceH
          page++
        }
      }

      const guestName = combinedSummary?.guest_name?.replace(/[^a-zA-Z0-9 ]/g, '') || 'Guest'
      pdf.save(`Bill_${guestName}_${generatedBillNo.replace(/\//g, '-')}.pdf`)
    } catch (err) {
      console.error('PDF generation failed:', err)
      alert('PDF generation failed. Please try Print instead.')
    } finally {
      setPdfLoading(false)
    }
  }

  // ==================== RENDER SECTIONS ====================

  const renderHotelHeader = () => {
    if (!showTopHeaderSection) {
      // When header is hidden (pre-printed paper), show a transparent spacer
      // whose height equals the configured top margin so content starts below
      // the pre-printed area. 1mm ≈ 3.7795px at 96dpi screen resolution.
      const spacerPx = Math.round((topMarginWhenHeaderHidden || 30) * 3.7795)
      return (
        <div
          style={{ height: `${spacerPx}px`, width: '100%' }}
          aria-hidden="true"
          data-role="header-spacer"
        />
      )
    }

    const nameAlign = printSettings?.hotel_name_position || 'center'
    const addressAlign = printSettings?.hotel_address_position || 'left'
    const contactAlign = printSettings?.hotel_contact_position || 'left'
    const logoPosition = printSettings?.hotel_logo_position || 'left'

    const logoEl =
      printSettings?.show_hotel_logo === 1 && hotelLogo ? (
        <img src={hotelLogo} alt="Hotel Logo" className="bill-hotel-logo" />
      ) : null

    return (
      <div className="mb-3">
        {logoEl && <div className={`text-${logoPosition} mb-2`}>{logoEl}</div>}
        {printSettings?.show_hotel_name === 1 && (
          <div
            className={`text-${nameAlign}`}
            style={{ fontSize: '18pt', fontWeight: 800, color: headerBg }}>
            {hotelName}
          </div>
        )}
        {printSettings?.show_hotel_address === 1 && (
          <div className={`text-${addressAlign} mt-1`} style={{ fontSize: '8.5pt', color: '#666' }}>
            📍 {hotelAddress}
          </div>
        )}
        {printSettings?.show_hotel_contact === 1 && (
          <div className={`text-${contactAlign} mt-1`} style={{ fontSize: '8pt', color: '#666' }}>
            📞 {hotelPhone} &nbsp;|&nbsp; ✉ {hotelEmail} &nbsp;|&nbsp; 🌐 {hotelWebsite}
          </div>
        )}
        <hr className="bill-divider" />
      </div>
    )
  }

  const renderBillTitle = () => {
    if (printSettings?.show_bill_title !== 1) return null
    const titleAlign = printSettings?.bill_title_position || 'center'
    return (
      <div className={`text-${titleAlign} mb-3`}>
        <h3 style={{ margin: 0, fontWeight: 800, letterSpacing: '1px', color: headerBg }}>
          HOTEL BOOKING BILL
        </h3>
      </div>
    )
  }

  const renderBillInfo = () => {
    return (
      <div className="bill-info-row">
        <div>
          {printSettings?.show_invoice_no === 1 && (
            <div>
              <strong>Invoice No.&nbsp;:&nbsp;</strong>
              {generatedBillNo}
            </div>
          )}
          {printSettings?.show_invoice_date === 1 && (
            <div>
              <strong>Invoice Date&nbsp;:&nbsp;</strong>
              {invoiceDate}
            </div>
          )}
          {printSettings?.show_booking_id === 1 && (
            <div>
              <strong>Booking ID&nbsp;:&nbsp;</strong>
              {bookingId}
            </div>
          )}
        </div>
        <div>
          {printSettings?.show_payment_status === 1 && (
            <div>
              <strong>Payment Status&nbsp;:&nbsp;</strong>
              <span className="status-paid">{paymentStatus}</span>
            </div>
          )}
          {printSettings?.show_payment_mode === 1 && (
            <div>
              <strong>Payment Mode&nbsp;:&nbsp;</strong>
              {paymentMode}
            </div>
          )}
          <div>
            <strong>Guest Name&nbsp;:&nbsp;</strong>
            {combinedSummary?.guest_name || '-'}
          </div>
        </div>
      </div>
    )
  }

  const renderGuestDetails = () => {
    if (printSettings?.show_guest_details !== 1) return null
    return (
      <div className="bill-info-box">
        <div className="bill-info-box-header">GUEST DETAILS</div>
        <div className="bill-info-box-body">
          <table className="bill-detail-table">
            <tbody>
              {printSettings?.show_guest_name === 1 && (
                <tr>
                  <td className="bdt-label">Name</td>
                  <td className="bdt-colon">:</td>
                  <td className="bdt-value">{combinedSummary?.guest_name || '-'}</td>
                </tr>
              )}
              {printSettings?.show_guest_mobile === 1 && (
                <tr>
                  <td className="bdt-label">Phone</td>
                  <td className="bdt-colon">:</td>
                  <td className="bdt-value">{combinedSummary?.guest_mobile || '-'}</td>
                </tr>
              )}
              {printSettings?.show_guest_email === 1 && (
                <tr>
                  <td className="bdt-label">Email</td>
                  <td className="bdt-colon">:</td>
                  <td className="bdt-value">{combinedSummary?.guest_email || '-'}</td>
                </tr>
              )}
              {printSettings?.show_guest_address === 1 && (
                <tr>
                  <td className="bdt-label">Address</td>
                  <td className="bdt-colon">:</td>
                  <td className="bdt-value">{combinedSummary?.guest_address || '-'}</td>
                </tr>
              )}
              {printSettings?.show_guest_id_proof === 1 && (
                <tr>
                  <td className="bdt-label">ID Proof</td>
                  <td className="bdt-colon">:</td>
                  <td className="bdt-value">{combinedSummary?.guest_id_proof || '-'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderBookingDetails = () => {
    if (printSettings?.show_booking_details !== 1) return null
    return (
      <div className="bill-info-box">
        <div className="bill-info-box-header">BOOKING DETAILS</div>
        <div className="bill-info-box-body">
          <table className="bill-detail-table">
            <tbody>
              {printSettings?.show_checkin_date === 1 && (
                <tr>
                  <td className="bdt-label">Check-in Date</td>
                  <td className="bdt-colon">:</td>
                  <td className="bdt-value">{checkinDateDisplay}</td>
                </tr>
              )}
              {printSettings?.show_checkout_date === 1 && (
                <tr>
                  <td className="bdt-label">Check-out Date</td>
                  <td className="bdt-colon">:</td>
                  <td className="bdt-value">{checkoutDateDisplay}</td>
                </tr>
              )}
              {printSettings?.show_nights === 1 && (
                <tr>
                  <td className="bdt-label">No. of Days</td>
                  <td className="bdt-colon">:</td>
                  <td className="bdt-value">{combinedSummary?.total_days || 0}</td>
                </tr>
              )}
              {printSettings?.show_room_type === 1 && (
                <tr>
                  <td className="bdt-label">Room Type</td>
                  <td className="bdt-colon">:</td>
                  <td className="bdt-value">{combinedSummary?.room_categories_str || '-'}</td>
                </tr>
              )}
              {printSettings?.show_room_numbers === 1 && (
                <tr>
                  <td className="bdt-label">Room No(s).</td>
                  <td className="bdt-colon">:</td>
                  <td className="bdt-value">
                    {checkedOutRoomsStr || combinedSummary?.room_numbers_str || '-'}
                  </td>
                </tr>
              )}
              {printSettings?.show_guests_count === 1 && (
                <tr>
                  <td className="bdt-label">Guests</td>
                  <td className="bdt-colon">:</td>
                  <td className="bdt-value">
                    {combinedSummary?.total_adults || 0} Adults
                    {(combinedSummary?.total_child_paid || 0) > 0 &&
                      `, ${combinedSummary?.total_child_paid} Child`}
                    {(combinedSummary?.total_driver || 0) > 0 &&
                      `, ${combinedSummary?.total_driver} Driver`}
                  </td>
                </tr>
              )}
              {printSettings?.show_tariff_plan === 1 && (
                <tr>
                  <td className="bdt-label">Tariff Plan</td>
                  <td className="bdt-colon">:</td>
                  <td className="bdt-value">{combinedSummary?.plan_name || 'Room Only'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderChargesTable = () => {
    const tableRows: TableRowWithIndex[] = []
    const groupedRows: { [key: string]: DisplayDetailRow[] } = {}

    roomCharges.forEach((row) => {
      const key = row.room_number
      if (!groupedRows[key]) groupedRows[key] = []
      groupedRows[key].push(row)
    })

    let rowCounter = 1
    Object.keys(groupedRows)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .forEach((roomNumber) => {
        groupedRows[roomNumber].forEach((row) => {
          tableRows.push({ ...row, displayIndex: rowCounter++ })
        })
      })

    postCharges.forEach((charge) => {
      tableRows.push({
        ...charge,
        displayIndex: rowCounter++,
        description: charge.description || 'Post Charge',
        room_category_name: charge.room_category_name || 'Post Charge',
      })
    })

    allowances.forEach((allowance) => {
      tableRows.push({
        ...allowance,
        displayIndex: rowCounter++,
        description: allowance.description || 'Allowance',
        room_category_name: allowance.room_category_name || 'Allowance',
      })
    })

    const showRowNums = printSettings?.show_row_numbers === 1
    const colCount = showRowNums ? 4 : 3

    return (
      <table className="bill-charges-table">
        <thead>
          <tr>
            {showRowNums && <th style={{ width: '40px' }}>#</th>}
            <th>DESCRIPTION</th>
            <th>DATE</th>
            <th className="bct-right">AMOUNT (INR)</th>
          </tr>
        </thead>
        <tbody>
          {tableRows.map((row) => {
            let descriptionText = ''

            if (row.isPostCharge) {
              if (row.total_amount < 0) {
                descriptionText = `Allowance - ${row.description || row.room_category_name}`
              } else {
                descriptionText = `Post Charge - ${row.description || row.room_category_name}`
              }
            } else {
              descriptionText = `${row.room_number} – ${row.is_extension ? 'Day Extension' : 'Room Charges'}`
            }

            return (
              <tr key={row.id}>
                {showRowNums && <td className="bct-center">{row.displayIndex}</td>}
                <td>{descriptionText}</td>
                <td>{row.bill_date_formatted}</td>
                <td
                  className="bct-right"
                  style={{
                    color: row.isPostCharge && row.total_amount < 0 ? '#cc0000' : 'inherit',
                  }}>
                  {row.isPostCharge && row.total_amount < 0 ? '-' : ''}
                  {formatAmtDisplay(Math.abs(row.total_amount))}
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          {roomCharges.length > 0 && (
            <tr className="bct-total-row">
              <td colSpan={colCount - 1} className="bct-total-label">
                ROOM CHARGES SUBTOTAL
              </td>
              <td className="bct-total-value bct-right">
                {formatAmtDisplay(totalRoomTariff + totalExPax + totalChild + totalDriver)}
              </td>
            </tr>
          )}
          {discountAmount > 0 && (
            <tr className="bct-total-row">
              <td colSpan={colCount - 1} className="bct-total-label" style={{ color: '#cc0000' }}>
                DISCOUNT (
                {combinedSummary?.avg_discount_percent
                  ? `${combinedSummary.avg_discount_percent.toFixed(2)}%`
                  : ''}
                )
              </td>
              <td className="bct-total-value bct-right" style={{ color: '#cc0000' }}>
                -{formatAmtDisplay(discountAmount)}
              </td>
            </tr>
          )}
          {postCharges.length > 0 && (
            <tr className="bct-postcharge-row">
              <td colSpan={colCount - 1} className="bct-postcharge-label">
                POST CHARGES TOTAL
              </td>
              <td className="bct-postcharge-value bct-right">
                {formatAmtDisplay(totalPostCharges)}
              </td>
            </tr>
          )}
          {allowances.length > 0 && (
            <tr className="bct-allowance-row">
              <td colSpan={colCount - 1} className="bct-allowance-label">
                ALLOWANCES TOTAL
              </td>
              <td className="bct-allowance-value bct-right">
                -{formatAmtDisplay(totalAllowances)}
              </td>
            </tr>
          )}
          <tr className="bct-total-row">
            <td colSpan={colCount - 1} className="bct-total-label">
              TAXABLE AMOUNT
            </td>
            <td className="bct-total-value bct-right">{formatAmtDisplay(taxableAmount)}</td>
          </tr>

          {printSettings?.show_cgst_sgst_breakdown === 1 && totalCGST > 0 && totalSGST > 0 && (
            <>
              <tr className="bct-total-row">
                <td colSpan={colCount - 1} className="bct-total-label">
                  CGST ({cgstPercent.toFixed(2)}%)
                </td>
                <td className="bct-total-value bct-right">{formatAmtDisplay(totalCGST)}</td>
              </tr>
              <tr className="bct-total-row">
                <td colSpan={colCount - 1} className="bct-total-label">
                  SGST ({sgstPercent.toFixed(2)}%)
                </td>
                <td className="bct-total-value bct-right">{formatAmtDisplay(totalSGST)}</td>
              </tr>
            </>
          )}

          {printSettings?.show_cgst_sgst_breakdown === 1 && totalIGST > 0 && (
            <tr className="bct-total-row">
              <td colSpan={colCount - 1} className="bct-total-label">
                IGST ({igstPercent.toFixed(2)}%)
              </td>
              <td className="bct-total-value bct-right">{formatAmtDisplay(totalIGST)}</td>
            </tr>
          )}

          {printSettings?.show_cgst_sgst_breakdown === 1 && totalCess > 0 && (
            <tr className="bct-total-row">
              <td colSpan={colCount - 1} className="bct-total-label">
                CESS ({cessPercent.toFixed(2)}%)
              </td>
              <td className="bct-total-value bct-right">{formatAmtDisplay(totalCess)}</td>
            </tr>
          )}

          {printSettings?.show_cgst_sgst_breakdown === 1 && totalServiceCharge > 0 && (
            <tr className="bct-total-row">
              <td colSpan={colCount - 1} className="bct-total-label">
                Service Charge ({serviceChargePercent.toFixed(2)}%)
              </td>
              <td className="bct-total-value bct-right">{formatAmtDisplay(totalServiceCharge)}</td>
            </tr>
          )}

          {printSettings?.show_cgst_sgst_breakdown !== 1 && totalTax > 0 && (
            <tr className="bct-total-row">
              <td colSpan={colCount - 1} className="bct-total-label">
                TAX ({avgTaxPercent.toFixed(2)}%)
              </td>
              <td className="bct-total-value bct-right">{formatAmtDisplay(totalTax)}</td>
            </tr>
          )}

          <tr className="bct-grand-total-row">
            <td colSpan={colCount - 1} className="bct-grand-label">
              GRAND TOTAL
            </td>
            <td className="bct-grand-value bct-right">{formatAmtDisplay(netTotal)}</td>
          </tr>
          <tr className="bct-paid-row">
            <td colSpan={colCount - 1} className="bct-paid-label">
              TOTAL PAID (INR)
            </td>
            <td className="bct-paid-value bct-right">{formatAmtDisplay(netTotal)}</td>
          </tr>
        </tfoot>
      </table>
    )
  }

  const renderAmountInWords = () => {
    return (
      <div className="bill-amount-words">
        <span className="baw-label">Amount in Words: </span>
        <span className="baw-text">{numberToWords(netTotal)}</span>
      </div>
    )
  }

  const renderPaymentDetails = () => {
    return (
      <div className="bill-info-box">
        <div className="bill-info-box-header">PAYMENT DETAILS</div>
        <div className="bill-info-box-body">
          <table className="bill-detail-table">
            <tbody>
              <tr>
                <td className="bdt-label">Paid Amount</td>
                <td className="bdt-colon">:</td>
                <td className="bdt-value">INR {formatAmt(netTotal)}</td>
              </tr>
              <tr>
                <td className="bdt-label">Transaction ID</td>
                <td className="bdt-colon">:</td>
                <td className="bdt-value">
                  {paymentTransactionId || `TXN${Date.now().toString().slice(-12)}`}
                </td>
              </tr>
              <tr>
                <td className="bdt-label">Payment Date</td>
                <td className="bdt-colon">:</td>
                <td className="bdt-value">{paymentDate || invoiceDate}</td>
              </tr>
              <tr>
                <td className="bdt-label">Bank / Card</td>
                <td className="bdt-colon">:</td>
                <td className="bdt-value">{paymentBank || paymentMode}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderNoteBox = () => (
    <div className="bill-info-box">
      <div className="bill-info-box-header">NOTE</div>
      <div className="bill-info-box-body">
        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '8pt' }}>
          <li>Check-in time: {checkinTimeDisplay}</li>
          <li>Check-out time: {checkoutTimeDisplay}</li>
          <li>
            Early check-in or late check-out is subject to availability and may incur additional
            charges.
          </li>
          <li>This is a computer generated invoice. No signature required.</li>
        </ul>
      </div>
    </div>
  )

  const renderFooter = () => {
    return (
      <div className="text-center mt-3">
        {printSettings?.show_thankyou_message === 1 && (
          <div className="bill-thankyou">
            {printSettings?.thankyou_message_text || 'Thank You!'}
          </div>
        )}
        {printSettings?.show_footer_note === 1 && (
          <div className="mt-2" style={{ fontSize: '9pt', color: '#555' }}>
            {printSettings?.footer_note_text || 'We look forward to welcoming you again.'}
          </div>
        )}
        <div className="mt-2" style={{ fontSize: '8pt', color: '#999' }}>
          {printSettings?.show_gst_details === 1 && <div>GSTIN: {hotelGSTIN}</div>}
          {printSettings?.show_company_pan === 1 && <div>PAN: {hotelPAN}</div>}
          {printSettings?.show_fssai === 1 && <div>FSSAI: {hotelFSSAI}</div>}
        </div>
        {printSettings?.custom_footer_text && (
          <div className="mt-2" style={{ fontSize: '8pt', color: '#999' }}>
            {printSettings.custom_footer_text}
          </div>
        )}
      </div>
    )
  }

  const renderLayout = () => {
    const guestPosition = printSettings?.guest_details_position || 'left'
    const bookingPosition = printSettings?.booking_details_position || 'right'

    const topBottom =
      guestPosition === 'top' ||
      bookingPosition === 'top' ||
      guestPosition === 'bottom' ||
      bookingPosition === 'bottom'

    return (
      <div>
        {renderHotelHeader()}
        {renderBillTitle()}
        {printSettings?.custom_header_text && (
          <div className="text-center mb-3" style={{ fontSize: '9pt', color: '#666' }}>
            {printSettings.custom_header_text}
          </div>
        )}

        {topBottom ? (
          <>
            {guestPosition === 'top' &&
              printSettings?.show_guest_details === 1 &&
              renderGuestDetails()}
            {bookingPosition === 'top' &&
              printSettings?.show_booking_details === 1 &&
              renderBookingDetails()}
            {renderBillInfo()}
            {renderChargesTable()}
            {renderAmountInWords()}
            <div className="two-column-layout">
              {renderPaymentDetails()}
              {renderNoteBox()}
            </div>
            {guestPosition === 'bottom' &&
              printSettings?.show_guest_details === 1 &&
              renderGuestDetails()}
            {bookingPosition === 'bottom' &&
              printSettings?.show_booking_details === 1 &&
              renderBookingDetails()}
          </>
        ) : (
          <>
            <div className="two-column-layout">
              <div>
                {guestPosition === 'left' &&
                  printSettings?.show_guest_details === 1 &&
                  renderGuestDetails()}
                {bookingPosition === 'left' &&
                  printSettings?.show_booking_details === 1 &&
                  renderBookingDetails()}
              </div>
              <div>
                {guestPosition === 'right' &&
                  printSettings?.show_guest_details === 1 &&
                  renderGuestDetails()}
                {bookingPosition === 'right' &&
                  printSettings?.show_booking_details === 1 &&
                  renderBookingDetails()}
              </div>
            </div>
            {renderBillInfo()}
            {renderChargesTable()}
            {renderAmountInWords()}
            <div className="two-column-layout">
              {renderPaymentDetails()}
              {renderNoteBox()}
            </div>
          </>
        )}
        {renderFooter()}
      </div>
    )
  }

  if (settingsLoading) {
    return (
      <Modal
        show={show}
        onHide={onHide}
        dialogClassName="bill-modal-dialog"
        backdrop="static"
        centered>
        <Modal.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Loading bill settings...</p>
        </Modal.Body>
      </Modal>
    )
  }

  return (
    <>
      <style>{`
        .bill-modal-dialog { max-width: 950px !important; }
        .bill-modal-body {
          background: #e8eaed;
          padding: 0;
          max-height: 88vh;
          overflow-y: auto;
        }
        .bill-modal-action-bar {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 10px 20px;
          background: white;
          border-bottom: 1px solid #dee2e6;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .btn-bill-print {
          background: ${headerBg};
          color: white;
          border: none;
          padding: 7px 22px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
        }
        .btn-bill-print:hover { opacity: 0.88; color: white; }
        .btn-bill-pdf {
          background: #c0392b;
          color: white;
          border: none;
          padding: 7px 22px;
          border-radius: 4px;
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
          position: relative;
        }
        .btn-bill-pdf:hover { opacity: 0.88; color: white; }

        .bill-a4-paper {
          background: white;
          width: ${printSettings?.default_print_size === 'thermal_80mm' ? '80mm' : printSettings?.default_print_size === 'thermal_58mm' ? '58mm' : '820px'};
          margin: 0 auto;
          padding: 0 32px 28px 32px;
          box-shadow: 0 6px 24px rgba(0,0,0,0.13);
          border-radius: 3px;
        }
        @media print {
          .bill-a4-paper { 
            box-shadow: none; 
            width: 100% !important; 
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print { display: none !important; }
          body { 
            margin: 0 !important; 
            padding: 0 !important;
            background: white !important;
          }
        }
        ${getBillStyles()}
      `}</style>

      <Modal
        show={show}
        onHide={onHide}
        dialogClassName="bill-modal-dialog"
        backdrop="static"
        centered>
        <Modal.Header
          closeButton
          className="py-2"
          style={{ background: headerBg, borderBottom: 'none' }}>
          <Modal.Title className="text-white fw-bold" style={{ fontSize: '0.9rem' }}>
            🧾 Hotel Booking Bill — {combinedSummary?.guest_name || 'Guest'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="bill-modal-body p-0">
          <div className="bill-modal-action-bar no-print">
            <Button className="btn-bill-print" onClick={handlePrint}>
              🖨️ Print Bill
            </Button>
            <Button className="btn-bill-pdf" onClick={handleDownloadPDF} disabled={pdfLoading}>
              {pdfLoading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-1" /> Generating PDF...
                </>
              ) : (
                <>📄 Download PDF</>
              )}
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={onHide}>
              Close
            </Button>
          </div>
          <div style={{ padding: '20px', background: '#e8eaed' }}>
            <div className="bill-a4-paper bill-wrap" ref={printRef}>
              {renderLayout()}
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  )
}

export default CheckoutBillModal