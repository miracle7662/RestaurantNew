// components/CheckoutBillModal.tsx
import React, { useRef, useEffect, useState, useMemo } from 'react'
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

interface TableRowWithIndex {
  id: string
  displayIndex: number
  date: string
  roomTariff: number
  exPax: number
  cgst: number
  sgst: number
  food: number
  total: number
  advanceTotal: number
  postTotal: number
  allowanceTotal: number
  postAllowNet: number
  postCharges: Array<{ description: string; amount: number; id: string }>
  allowances: Array<{ description: string; amount: number; id: string }>
  advances: Array<{ description: string; amount: number; id: string }>
  foodCharges: Array<{ description: string; amount: number; id: string }>
  sacCode?: string
}

interface GroupedChargeItem {
  date: string
  roomChargeAmount: number
  exPaxAmount: number
  postCharges: Array<{ description: string; amount: number; id: string }>
  allowances: Array<{ description: string; amount: number; id: string }>
  advances: Array<{ description: string; amount: number; id: string }>
  foodCharges: Array<{ description: string; amount: number; id: string }>
  cgstAmount: number
  sgstAmount: number
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
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear().toString().slice(-2)
  return `${day}/${month}/${year}`
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

  // ========== FILTER: Only use selected rows ==========
  const selectedRows = displayRows.filter((r) => r.selected)

  // ========== FILTER: Create filtered combined summary for selected rooms only ==========
  const summary = useMemo(() => {
    if (!combinedSummary) return null

    // Get unique room numbers from selected rows
    const selectedRoomNumbers = new Set(selectedRows.map((r) => r.room_number))

    // Filter room numbers
    const filteredRoomNumbers = combinedSummary.room_numbers.filter((r) =>
      selectedRoomNumbers.has(r)
    )

    // Filter room categories based on selected rows
    const filteredRoomCategories = Array.from(
      new Set(
        selectedRows
          .filter((r) => !r.isPostCharge && r.room_category_name && r.room_category_name !== '-')
          .map((r) => r.room_category_name)
      )
    )

    // Filter converted categories
    const filteredConvertedCategories = Array.from(
      new Set(
        selectedRows
          .filter(
            (r) => !r.isPostCharge && r.converted_category_name && r.converted_category_name !== '-'
          )
          .map((r) => r.converted_category_name)
      )
    )

    // Get first selected room charge for dates
    const firstSelectedRoom = selectedRows.find((r) => !r.isPostCharge)

    return {
      ...combinedSummary,
      room_numbers: filteredRoomNumbers,
      room_numbers_str: filteredRoomNumbers.join(', ') || '-',
      room_categories: filteredRoomCategories,
      room_categories_str: filteredRoomCategories.join(', ') || '-',
      converted_categories: filteredConvertedCategories,
      converted_categories_str: filteredConvertedCategories.join(', ') || '-',
      // Override dates with selected room dates
      original_checkin_datetime:
        firstSelectedRoom?.checkin_datetime || combinedSummary.original_checkin_datetime,
      final_checkout_datetime:
        firstSelectedRoom?.checkout_datetime || combinedSummary.final_checkout_datetime,
      // Override totals with selected rows only
      total_room_tariff: selectedRows.reduce((s, r) => s + r.total_room_tariff, 0),
      total_ex_pax_charge: selectedRows.reduce((s, r) => s + r.ex_pax_total, 0),
      total_child_paid_amount: selectedRows.reduce((s, r) => s + r.child_total, 0),
      total_driver_charge: selectedRows.reduce((s, r) => s + r.driver_total, 0),
      total_tax_amount: selectedRows.reduce((s, r) => s + r.tax_amount, 0),
      total_amount: selectedRows.reduce((s, r) => s + r.total_amount, 0),
      total_adults: selectedRows.reduce(
        (s, r) => s + (r.isPostCharge ? 0 : r.adults || 0),
        0
      ),
      total_pax: selectedRows.reduce(
        (s, r) => s + (r.isPostCharge ? 0 : r.pax || 0),
        0
      ),
      total_ex_pax: selectedRows.reduce(
        (s, r) => s + (r.isPostCharge ? 0 : r.ex_pax_count || 0),
        0
      ),
      total_child_paid: selectedRows.reduce(
        (s, r) => s + (r.isPostCharge ? 0 : r.child_count || 0),
        0
      ),
      total_driver: selectedRows.reduce(
        (s, r) => s + (r.isPostCharge ? 0 : r.driver_count || 0),
        0
      ),
    }
  }, [combinedSummary, selectedRows])

  // ========== SEPARATE CHARGES ==========
  const roomCharges = selectedRows.filter((r) => !r.isPostCharge)
  const postCharges = selectedRows.filter((r) => r.isPostCharge && r.total_amount > 0)
  const allowances = selectedRows.filter((r) => r.isPostCharge && r.total_amount < 0)

  // Food charges from post charges
  const foodCharges = postCharges.filter((r) => {
    const desc = (r.description || r.particulars || '').toLowerCase()
    return (
      desc.includes('food') ||
      desc.includes('restaurant') ||
      desc.includes('meal') ||
      desc.includes('breakfast') ||
      desc.includes('lunch') ||
      desc.includes('dinner') ||
      desc.includes('coffee') ||
      desc.includes('bar') ||
      desc.includes('snack') ||
      desc.includes('restro')
    )
  })

  const nonFoodPostCharges = postCharges.filter((r) => {
    const desc = (r.description || r.particulars || '').toLowerCase()
    return !(
      desc.includes('food') ||
      desc.includes('restaurant') ||
      desc.includes('meal') ||
      desc.includes('breakfast') ||
      desc.includes('lunch') ||
      desc.includes('dinner') ||
      desc.includes('coffee') ||
      desc.includes('bar') ||
      desc.includes('snack') ||
      desc.includes('restro')
    )
  })

  // Advances (negative amounts that are allowances)
  const advances = allowances.filter((r) => {
    const desc = (r.description || r.particulars || '').toLowerCase()
    return desc.includes('advance') || desc.includes('deposit') || desc.includes('prepaid')
  })

  const otherAllowances = allowances.filter((r) => {
    const desc = (r.description || r.particulars || '').toLowerCase()
    return !(desc.includes('advance') || desc.includes('deposit') || desc.includes('prepaid'))
  })

  // Calculate discount amount
  const discountAmount = roundToTwo(
    roomCharges.reduce((s, r) => s + (r.discount_amount || 0), 0)
  )

  // ========== DISPLAY VALUES ==========
  const displayCheckedOutRooms =
    checkedOutRooms && checkedOutRooms.length > 0
      ? checkedOutRooms
      : summary?.checked_out_rooms || summary?.room_numbers || []

  const checkedOutRoomsStr =
    displayCheckedOutRooms.join(', ') || summary?.room_numbers_str || ''

  const checkinDateDisplay = summary?.original_checkin_datetime
    ? formatDateLong(summary.original_checkin_datetime)
    : '-'
  const checkoutDateDisplay = summary?.final_checkout_datetime
    ? formatDateLong(summary.final_checkout_datetime)
    : '-'
  const checkinTimeDisplay = summary?.original_checkin_datetime
    ? new Date(summary.original_checkin_datetime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '14:00'
  const checkoutTimeDisplay = '11:00'
  const invoiceDate = formatDate(new Date().toISOString())
  const generatedBillNo =
    billNumber ||
    `INV/${new Date().getFullYear()}/${String(summary?.checkin_id || '0').padStart(4, '0')}`
  const bookingId = summary?.reg_no || `BKD${summary?.checkin_id || '0000'}`
  const paymentStatus = 'Paid'
  const paymentMode = summary?.payment_method || 'Credit Card'

  const headerBg = printSettings?.table_header_bg_color || '#1a2744'
  const headerText = printSettings?.table_header_text_color || '#ffffff'

  const showTopHeaderSection = printSettings?.show_top_header_section !== 0
  const topMarginWhenHeaderHidden = printSettings?.top_margin_when_header_hidden || 30

  const getFontSize = () => {
    switch (printSettings?.table_font_size) {
      case 'small':
        return '7pt'
      case 'large':
        return '9pt'
      default:
        return '8pt'
    }
  }

  // ========== GROUP CHARGES BY DATE ==========
  const groupChargesByDate = (): Map<string, GroupedChargeItem> => {
    const grouped = new Map<string, GroupedChargeItem>()

    // Process room charges by date
    roomCharges.forEach((charge) => {
      const dateKey = charge.bill_date_formatted || formatDate(charge.bill_date)

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, {
          date: dateKey,
          roomChargeAmount: 0,
          exPaxAmount: 0,
          postCharges: [],
          allowances: [],
          advances: [],
          foodCharges: [],
          cgstAmount: 0,
          sgstAmount: 0,
        })
      }

      const item = grouped.get(dateKey)!
      item.roomChargeAmount += charge.room_tariff_per_day || 0
      item.exPaxAmount +=
        (charge.ex_pax_total || 0) + (charge.child_total || 0) + (charge.driver_total || 0)
      item.cgstAmount += charge.cgst_amount || 0
      item.sgstAmount += charge.sgst_amount || 0
    })

    // Process food charges by date
    foodCharges.forEach((charge) => {
      const dateKey = charge.bill_date_formatted || formatDate(charge.bill_date)
      const amount = Math.abs(charge.total_amount)

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, {
          date: dateKey,
          roomChargeAmount: 0,
          exPaxAmount: 0,
          postCharges: [],
          allowances: [],
          advances: [],
          foodCharges: [],
          cgstAmount: 0,
          sgstAmount: 0,
        })
      }

      const item = grouped.get(dateKey)!
      item.foodCharges.push({
        description: charge.description || charge.particulars || 'Food',
        amount,
        id: charge.id,
      })
      item.cgstAmount += charge.cgst_amount || 0
      item.sgstAmount += charge.sgst_amount || 0
    })

    // Process other post charges by date
    nonFoodPostCharges.forEach((charge) => {
      const dateKey = charge.bill_date_formatted || formatDate(charge.bill_date)
      const amount = Math.abs(charge.total_amount)

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, {
          date: dateKey,
          roomChargeAmount: 0,
          exPaxAmount: 0,
          postCharges: [],
          allowances: [],
          advances: [],
          foodCharges: [],
          cgstAmount: 0,
          sgstAmount: 0,
        })
      }

      const item = grouped.get(dateKey)!
      item.postCharges.push({
        description: charge.description || charge.particulars || 'Post Charge',
        amount,
        id: charge.id,
      })
      item.cgstAmount += charge.cgst_amount || 0
      item.sgstAmount += charge.sgst_amount || 0
    })

    // Process advances by date
    advances.forEach((charge) => {
      const dateKey = charge.bill_date_formatted || formatDate(charge.bill_date)
      const amount = Math.abs(charge.total_amount)

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, {
          date: dateKey,
          roomChargeAmount: 0,
          exPaxAmount: 0,
          postCharges: [],
          allowances: [],
          advances: [],
          foodCharges: [],
          cgstAmount: 0,
          sgstAmount: 0,
        })
      }

      const item = grouped.get(dateKey)!
      item.advances.push({
        description: charge.description || charge.particulars || 'Advance',
        amount,
        id: charge.id,
      })
    })

    // Process other allowances by date
    otherAllowances.forEach((charge) => {
      const dateKey = charge.bill_date_formatted || formatDate(charge.bill_date)
      const amount = Math.abs(charge.total_amount)

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, {
          date: dateKey,
          roomChargeAmount: 0,
          exPaxAmount: 0,
          postCharges: [],
          allowances: [],
          advances: [],
          foodCharges: [],
          cgstAmount: 0,
          sgstAmount: 0,
        })
      }

      const item = grouped.get(dateKey)!
      item.allowances.push({
        description: charge.description || charge.particulars || 'Allowance',
        amount,
        id: charge.id,
      })
    })

    return grouped
  }

  // ========== GENERATE TABLE ROWS ==========
  const generateTableRows = (): TableRowWithIndex[] => {
    const rows: TableRowWithIndex[] = []
    const grouped = groupChargesByDate()
    let index = 1

    const sortedDates = Array.from(grouped.keys()).sort((a, b) => {
      const dateA = a.split('/').reverse().join('-')
      const dateB = b.split('/').reverse().join('-')
      return new Date(dateA).getTime() - new Date(dateB).getTime()
    })

    for (const date of sortedDates) {
      const item = grouped.get(date)!

      // Calculate totals for the day
      const postTotal = item.postCharges.reduce((sum, p) => sum + p.amount, 0)
      const foodTotal = item.foodCharges.reduce((sum, f) => sum + f.amount, 0)
      const allowanceTotal = item.allowances.reduce((sum, a) => sum + a.amount, 0)
      const advanceTotal = item.advances.reduce((sum, a) => sum + a.amount, 0)

      // POST/ALLOW = postCharges minus allowances (positive means net charge, negative means net allowance)
      const postAllowNet = postTotal - allowanceTotal

      // Total for the day = Room + EX.PAX + POST/ALLOW + FOOD + CGST + SGST - ADVANCE
      const total =
        item.roomChargeAmount +
        item.exPaxAmount +
        postAllowNet +
        foodTotal +
        item.cgstAmount +
        item.sgstAmount -
        advanceTotal

      rows.push({
        id: `row-${date}`,
        displayIndex: index++,
        date: date,
        roomTariff: item.roomChargeAmount,
        exPax: item.exPaxAmount,
        cgst: item.cgstAmount,
        sgst: item.sgstAmount,
        food: foodTotal,
        total: total,
        advanceTotal: advanceTotal,
        postTotal: postTotal,
        allowanceTotal: allowanceTotal,
        postAllowNet: postAllowNet,
        postCharges: item.postCharges,
        allowances: item.allowances,
        advances: item.advances,
        foodCharges: item.foodCharges,
        sacCode: '996311',
      })
    }

    return rows
  }

  const tableRows = generateTableRows()

  // ========== CALCULATE TOTALS ==========
  const totalRoomTariffAmount = roundToTwo(
    tableRows.reduce((sum, row) => sum + row.roomTariff, 0)
  )
  const totalExPaxAmount = roundToTwo(tableRows.reduce((sum, row) => sum + row.exPax, 0))
  const totalCGSTAmount = roundToTwo(tableRows.reduce((sum, row) => sum + row.cgst, 0))
  const totalSGSTAmount = roundToTwo(tableRows.reduce((sum, row) => sum + row.sgst, 0))
  const totalFoodAmount = roundToTwo(tableRows.reduce((sum, row) => sum + row.food, 0))
  const totalAdvanceAmount = roundToTwo(
    tableRows.reduce((sum, row) => sum + row.advanceTotal, 0)
  )

  const totalAmount = roundToTwo(tableRows.reduce((sum, row) => sum + row.total, 0))
  const netTotal = grandTotal

  // Check if we have extra data
  const hasCGSTData = totalCGSTAmount > 0 || totalSGSTAmount > 0
  const hasAdvanceData = totalAdvanceAmount > 0

  // ========== STYLES ==========
  const getBillStyles = () => `
    .bill-wrap * { box-sizing: border-box; }
    .bill-wrap {
      font-family: 'Segoe UI', 'Calibri', Arial, sans-serif;
      font-size: ${getFontSize()};
      color: #1a1a1a;
      line-height: 1.3;
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
      border-top: 1px solid #d0d0d0;
      margin: 10px 0;
    }

    .bill-wrap .bill-info-box {
      border: 1px solid #c8c8c8;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 12px;
    }
    .bill-wrap .bill-info-box-header {
      background: ${headerBg};
      color: ${headerText};
      text-align: center;
      font-weight: 700;
      font-size: 7.5pt;
      letter-spacing: 0.5px;
      padding: 4px 8px;
    }
    .bill-wrap .bill-info-box-body {
      padding: 8px 10px;
    }

    .bill-wrap .bill-detail-table {
      width: 100%;
      border-collapse: collapse;
    }
    .bill-wrap .bill-detail-table td {
      padding: 2px 4px;
      font-size: 7.5pt;
      vertical-align: top;
    }
    .bill-wrap .bdt-label {
      font-weight: 600;
      color: #333;
      white-space: nowrap;
      width: 90px;
    }
    .bill-wrap .bdt-colon {
      padding: 2px 4px;
      color: #555;
      width: 10px;
    }
    .bill-wrap .bdt-value {
      color: #222;
    }

    .bill-wrap .two-column-layout {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
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
      table-layout: auto;
    }
    .bill-wrap .bill-charges-table thead tr th {
      background: ${headerBg};
      color: ${headerText};
      font-weight: 700;
      padding: 5px 6px;
      border: 1px solid ${headerBg};
      white-space: nowrap;
      font-size: 7pt;
    }
    .bill-wrap .bill-charges-table tbody tr td {
      border: 1px solid #d4d4d4;
      padding: 5px 6px;
      vertical-align: middle;
      font-size: 7.5pt;
    }
    .bill-wrap .bill-charges-table tbody tr:nth-child(even) td {
      background: #f9f9f9;
    }
    .bill-wrap .bill-charges-table tfoot tr td {
      border: 1px solid #d4d4d4;
      padding: 5px 6px;
      font-size: 7.5pt;
    }
    .bill-wrap .bct-right { text-align: right; }
    .bill-wrap .bct-center { text-align: center; }
    .bill-wrap .bct-left { text-align: left; }

    .bill-wrap .col-srno { width: 35px; }
    .bill-wrap .col-date { width: 65px; }
    .bill-wrap .col-amount { width: 80px; }
    .bill-wrap .col-small { width: 65px; }

    .bill-wrap .subcharge-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
      margin-bottom: 2px;
      font-size: 6.5pt;
    }
    .bill-wrap .subcharge-table td {
      padding: 1px 3px;
      border: none;
    }
    .bill-wrap .subcharge-label {
      color: #666;
      font-style: italic;
      padding-left: 12px;
    }
    .bill-wrap .subcharge-amount {
      text-align: right;
      color: #555;
    }

    .bill-wrap .sac-code-row td {
      background: #f5f5f5 !important;
      font-size: 6.5pt;
      color: #666;
      padding: 3px 6px !important;
    }

    .bill-wrap .bill-amount-words {
      border: 1px solid #d4d4d4;
      border-top: none;
      padding: 6px 10px;
      font-size: 7.5pt;
      margin-bottom: 12px;
      margin-top: 0;
    }
    .bill-wrap .baw-label { font-style: italic; color: #555; margin-right: 3px; }
    .bill-wrap .baw-text { font-style: italic; color: #222; }

    .bill-wrap .bill-thankyou {
      font-family: 'Dancing Script', 'Brush Script MT', cursive;
      font-size: 20pt;
      color: ${headerBg};
      line-height: 1.2;
    }

    .bill-wrap .bill-hotel-logo {
      max-height: 55px;
      max-width: 140px;
      object-fit: contain;
    }

    .bill-wrap .bill-info-row {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      flex-wrap: wrap;
      padding: 6px 10px;
      background: #f8f9fa;
      border: 1px solid #dde2ea;
      border-radius: 3px;
      margin-bottom: 12px;
      font-size: 7.5pt;
    }
    .bill-wrap .bill-info-row > div {
      flex: 1;
      min-width: 140px;
    }
    .bill-wrap .bill-info-row strong {
      color: #333;
    }
    .bill-wrap .status-paid {
      color: #1a7a3a;
      font-weight: 700;
    }

    .bill-horizontal-summary {
      width: 260px;
      margin-left: auto;
      border-collapse: collapse;
      margin-top: 10px;
      margin-bottom: 10px;
      font-size: ${getFontSize()};
    }
    .bill-horizontal-summary td {
      padding: 5px 10px;
      border: 1px solid #d4d4d4;
    }
    .bill-horizontal-summary .summary-label {
      font-weight: 600;
      background: #f5f5f5;
      text-align: left;
      width: 130px;
    }
    .bill-horizontal-summary .summary-amount {
      text-align: right;
      font-weight: 600;
      width: 130px;
    }
    .bill-horizontal-summary .discount-row .summary-label,
    .bill-horizontal-summary .discount-row .summary-amount {
      color: #cc0000;
    }
    .bill-horizontal-summary .total-row td {
      background: #e8f0fe;
      font-weight: 800;
    }
    .bill-horizontal-summary .grand-total-row td {
      background: ${headerBg};
      color: ${headerText};
      font-weight: 800;
      font-size: 9pt;
    }
  `

  const handlePrint = () => {
    const printContents = printRef.current?.innerHTML || ''
    const printWindow = window.open('', '_blank', 'width=800,height=700')
    if (!printWindow) return

    const effectiveTopMargin = !showTopHeaderSection ? 0 : printSettings?.margin_top_mm || 8

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Hotel Bill - ${summary?.guest_name || 'Guest'}</title>
          <style>
            * { 
              box-sizing: border-box; 
              margin: 0; 
              padding: 0; 
            }
            @page {
              size: ${printSettings?.default_print_size === 'A4' ? 'A4' : 'auto'};
              margin: ${effectiveTopMargin}mm ${printSettings?.margin_right_mm || 8}mm ${printSettings?.margin_bottom_mm || 8}mm ${printSettings?.margin_left_mm || 8}mm;
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
    }, 300)
  }

  const handleDownloadPDF = async () => {
    const billEl = printRef.current
    if (!billEl) return

    setPdfLoading(true)
    try {
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
        'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js'
      )
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')

      const html2canvas = (window as any).html2canvas
      const { jsPDF } = (window as any).jspdf

      const printSize = printSettings?.default_print_size || 'A4'
      const isA4 = printSize !== 'thermal_80mm' && printSize !== 'thermal_58mm'
      const pdfW = isA4 ? 210 : printSize === 'thermal_80mm' ? 80 : 58

      const canvas = await html2canvas(billEl, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.92)
      const imgW =
        pdfW - (printSettings?.margin_left_mm || 8) - (printSettings?.margin_right_mm || 8)
      const imgH = (canvas.height / canvas.width) * imgW

      const topMargin = !showTopHeaderSection
        ? printSettings?.top_margin_when_header_hidden || 20
        : printSettings?.margin_top_mm || 8
      const bottomMargin = printSettings?.margin_bottom_mm || 8
      const leftMargin = printSettings?.margin_left_mm || 8

      const pageContentH = (isA4 ? 297 : 999) - topMargin - bottomMargin
      const orientation = imgH <= pageContentH ? 'portrait' : 'portrait'

      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: isA4 ? 'a4' : [pdfW, imgH + topMargin + bottomMargin],
      })

      if (imgH <= pageContentH) {
        pdf.addImage(imgData, 'JPEG', leftMargin, topMargin, imgW, imgH)
      } else {
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

      const guestName = summary?.guest_name?.replace(/[^a-zA-Z0-9 ]/g, '') || 'Guest'
      pdf.save(`Bill_${guestName}_${generatedBillNo.replace(/\//g, '-')}.pdf`)
    } catch (err) {
      console.error('PDF generation failed:', err)
      alert('PDF generation failed. Please try Print instead.')
    } finally {
      setPdfLoading(false)
    }
  }

  // ========== RENDER FUNCTIONS ==========

  const renderHotelHeader = () => {
    if (!showTopHeaderSection) {
      const spacerPx = Math.round((topMarginWhenHeaderHidden || 20) * 3.7795)
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
      <div className="mb-2">
        {logoEl && <div className={`text-${logoPosition} mb-1`}>{logoEl}</div>}
        {printSettings?.show_hotel_name === 1 && (
          <div
            className={`text-${nameAlign}`}
            style={{ fontSize: '16pt', fontWeight: 800, color: headerBg }}
          >
            {hotelName}
          </div>
        )}
        {printSettings?.show_hotel_address === 1 && (
          <div className={`text-${addressAlign} mt-1`} style={{ fontSize: '7.5pt', color: '#666' }}>
            📍 {hotelAddress}
          </div>
        )}
        {printSettings?.show_hotel_contact === 1 && (
          <div className={`text-${contactAlign} mt-1`} style={{ fontSize: '7pt', color: '#666' }}>
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
      <div className={`text-${titleAlign} mb-2`}>
        <h3
          style={{
            margin: 0,
            fontWeight: 800,
            letterSpacing: '0.5px',
            color: headerBg,
            fontSize: '12pt',
          }}
        >
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
              <strong>Invoice No.</strong> : {generatedBillNo}
            </div>
          )}
          {printSettings?.show_invoice_date === 1 && (
            <div>
              <strong>Invoice Date</strong> : {invoiceDate}
            </div>
          )}
          {printSettings?.show_booking_id === 1 && (
            <div>
              <strong>Booking ID</strong> : {bookingId}
            </div>
          )}
        </div>
        <div>
          {printSettings?.show_payment_status === 1 && (
            <div>
              <strong>Payment Status</strong> : <span className="status-paid">{paymentStatus}</span>
            </div>
          )}
          {printSettings?.show_payment_mode === 1 && (
            <div>
              <strong>Payment Mode</strong> : {paymentMode}
            </div>
          )}
          <div>
            <strong>Guest Name</strong> : {summary?.guest_name || '-'}
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
                  <td className="bdt-value">{summary?.guest_name || '-'}</td>
                </tr>
              )}
              {printSettings?.show_guest_mobile === 1 && (
                <tr>
                  <td className="bdt-label">Phone</td>
                  <td className="bdt-colon">:</td>
                  <td className="bdt-value">{summary?.guest_mobile || '-'}</td>
                </tr>
              )}
              {printSettings?.show_guest_email === 1 && (
                <tr>
                  <td className="bdt-label">Email</td>
                  <td className="bdt-colon">:</td>
                  <td className="bdt-value">{summary?.guest_email || '-'}</td>
                </tr>
              )}
              {printSettings?.show_guest_address === 1 && (
                <tr>
                  <td className="bdt-label">Address</td>
                  <td className="bdt-colon">:</td>
                  <td className="bdt-value">{summary?.guest_address || '-'}</td>
                </tr>
              )}
              {printSettings?.show_guest_id_proof === 1 && (
                <tr>
                  <td className="bdt-label">ID Proof</td>
                  <td className="bdt-colon">:</td>
                  <td className="bdt-value">{summary?.guest_id_proof || '-'}</td>
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
                  <td className="bdt-label">No. of Nights</td>
                  <td className="bdt-colon">:</td>
                  <td className="bdt-value">{summary?.total_days || 0}</td>
                </tr>
              )}
              {printSettings?.show_room_type === 1 && (
                <tr>
                  <td className="bdt-label">Room Type</td>
                  <td className="bdt-colon">:</td>
                  <td className="bdt-value">{summary?.room_categories_str || '-'}</td>
                </tr>
              )}
              {printSettings?.show_room_numbers === 1 && (
                <tr>
                  <td className="bdt-label">Room No(s).</td>
                  <td className="bdt-colon">:</td>
                  <td className="bdt-value">
                    {checkedOutRoomsStr || summary?.room_numbers_str || '-'}
                  </td>
                </tr>
              )}
              {printSettings?.show_guests_count === 1 && (
                <tr>
                  <td className="bdt-label">Guests</td>
                  <td className="bdt-colon">:</td>
                  <td className="bdt-value">
                    {summary?.total_adults || 0} Adults
                    {(summary?.total_child_paid || 0) > 0 &&
                      `, ${summary?.total_child_paid} Child`}
                    {(summary?.total_driver || 0) > 0 && `, ${summary?.total_driver} Driver`}
                  </td>
                </tr>
              )}
              {printSettings?.show_tariff_plan === 1 && (
                <tr>
                  <td className="bdt-label">Tariff Plan</td>
                  <td className="bdt-colon">:</td>
                  <td className="bdt-value">{summary?.plan_name || 'Room Only'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderChargesTable = () => {
    const showRowNums = printSettings?.show_row_numbers === 1

    // Build column headers
    const headers: React.ReactElement[] = []
    if (showRowNums) headers.push(<th key="srno" className="col-srno bct-center">#</th>)
    headers.push(<th key="date" className="col-date bct-left">DATE</th>)
    headers.push(<th key="tariff" className="col-amount bct-right">TARIFF</th>)
    headers.push(<th key="expax" className="col-amount bct-right">EX.PAX</th>)
    if (hasCGSTData) {
      headers.push(<th key="cgst" className="col-small bct-right">CGST</th>)
      headers.push(<th key="sgst" className="col-small bct-right">SGST</th>)
    }
    headers.push(<th key="post" className="col-amount bct-right">POST</th>)
    headers.push(<th key="allow" className="col-amount bct-right">ALLOW</th>)
    if (hasAdvanceData) {
      headers.push(<th key="advance" className="col-amount bct-right">ADVANCE</th>)
    }
    headers.push(<th key="food" className="col-amount bct-right">FOOD</th>)
    headers.push(<th key="total" className="col-amount bct-right">TOTAL</th>)

    const totalCols = headers.length

    // Build table body rows
    const bodyRows: React.ReactElement[] = []
    let runningIndex = 1

    tableRows.forEach((row) => {
      const mainIndex = runningIndex++

      const postDisplay = row.postTotal > 0 ? formatAmtDisplay(row.postTotal) : '-'
      const allowDisplay = row.allowanceTotal > 0 ? formatAmtDisplay(row.allowanceTotal) : '-'
      const advanceDisplay = row.advanceTotal > 0 ? formatAmtDisplay(row.advanceTotal) : '-'
      const foodDisplay = row.food > 0 ? formatAmtDisplay(row.food) : '-'

      const cells: React.ReactElement[] = []
      if (showRowNums) cells.push(<td key="srno" className="bct-center">{mainIndex}</td>)
      cells.push(<td key="date" className="bct-left">{row.date}</td>)
      cells.push(<td key="tariff" className="bct-right">{formatAmtDisplay(row.roomTariff)}</td>)
      cells.push(<td key="expax" className="bct-right">{formatAmtDisplay(row.exPax)}</td>)
      if (hasCGSTData) {
        cells.push(<td key="cgst" className="bct-right">{formatAmtDisplay(row.cgst)}</td>)
        cells.push(<td key="sgst" className="bct-right">{formatAmtDisplay(row.sgst)}</td>)
      }
      cells.push(
        <td key="post" className="bct-right" style={{ color: '#1a7a3a', fontWeight: 500 }}>
          {postDisplay}
        </td>
      )
      cells.push(
        <td key="allow" className="bct-right" style={{ color: '#cc0000', fontWeight: 500 }}>
          {allowDisplay}
        </td>
      )
      if (hasAdvanceData) {
        cells.push(
          <td key="advance" className="bct-right" style={{ color: '#cc0000', fontWeight: 500 }}>
            {advanceDisplay}
          </td>
        )
      }
      cells.push(<td key="food" className="bct-right">{foodDisplay}</td>)
      cells.push(
        <td key="total" className="bct-right" style={{ fontWeight: 600 }}>
          {formatAmtDisplay(row.total)}
        </td>
      )
      bodyRows.push(<tr key={row.id}>{cells}</tr>)
    })

    // Calculate totals
    const totalPostAmount = roundToTwo(
      tableRows.reduce((sum, row) => sum + row.postTotal, 0)
    )
    const totalAllowanceAmount = roundToTwo(
      tableRows.reduce((sum, row) => sum + row.allowanceTotal, 0)
    )

    const labelColSpan = showRowNums ? 2 : 1

    const footerCells: React.ReactElement[] = []
    footerCells.push(
      <td key="total_label" colSpan={labelColSpan} className="bct-right" style={{ fontWeight: 700 }}>
        Total
      </td>
    )
    footerCells.push(
      <td key="total_tariff" className="bct-right" style={{ fontWeight: 700 }}>
        {formatAmtDisplay(totalRoomTariffAmount)}
      </td>
    )
    footerCells.push(
      <td key="total_expax" className="bct-right" style={{ fontWeight: 700 }}>
        {formatAmtDisplay(totalExPaxAmount)}
      </td>
    )
    if (hasCGSTData) {
      footerCells.push(
        <td key="total_cgst" className="bct-right" style={{ fontWeight: 700 }}>
          {formatAmtDisplay(totalCGSTAmount)}
        </td>
      )
      footerCells.push(
        <td key="total_sgst" className="bct-right" style={{ fontWeight: 700 }}>
          {formatAmtDisplay(totalSGSTAmount)}
        </td>
      )
    }
    footerCells.push(
      <td key="total_post" className="bct-right" style={{ fontWeight: 700, color: '#1a7a3a' }}>
        {formatAmtDisplay(totalPostAmount)}
      </td>
    )
    footerCells.push(
      <td key="total_allow" className="bct-right" style={{ fontWeight: 700, color: '#cc0000' }}>
        {formatAmtDisplay(totalAllowanceAmount)}
      </td>
    )
    if (hasAdvanceData) {
      footerCells.push(
        <td key="total_advance" className="bct-right" style={{ fontWeight: 700, color: '#cc0000' }}>
          {formatAmtDisplay(totalAdvanceAmount)}
        </td>
      )
    }
    footerCells.push(
      <td key="total_food" className="bct-right" style={{ fontWeight: 700 }}>
        {totalFoodAmount > 0 ? formatAmtDisplay(totalFoodAmount) : '-'}
      </td>
    )
    footerCells.push(
      <td key="total_amount" className="bct-right" style={{ fontWeight: 800, background: '#f0f0f0' }}>
        {formatAmtDisplay(totalAmount)}
      </td>
    )

    // Summary rows
    const afterDiscountTotal = totalAmount - discountAmount

    const summaryRows: React.ReactElement[] = []

    if (discountAmount > 0) {
      summaryRows.push(
        <tr key="summary_discount">
          <td
            colSpan={totalCols - 1}
            className="bct-right"
            style={{ fontWeight: 600, color: '#cc0000', borderTop: '2px solid #d4d4d4' }}
          >
            Discount (
            {summary?.avg_discount_percent
              ? `${summary.avg_discount_percent.toFixed(2)}%`
              : ''}
            )
          </td>
          <td
            className="bct-right"
            style={{ fontWeight: 600, color: '#cc0000', borderTop: '2px solid #d4d4d4' }}
          >
            ₹{formatAmt(discountAmount)}
          </td>
        </tr>
      )
    }

    summaryRows.push(
      <tr key="summary_total" style={{ background: '#e8f0fe' }}>
        <td colSpan={totalCols - 1} className="bct-right" style={{ fontWeight: 800 }}>
          Sub Total
        </td>
        <td className="bct-right" style={{ fontWeight: 800 }}>
          ₹{formatAmt(afterDiscountTotal)}
        </td>
      </tr>
    )

    summaryRows.push(
      <tr key="summary_grand_total" style={{ background: headerBg, color: headerText }}>
        <td colSpan={totalCols - 1} className="bct-right" style={{ fontWeight: 800, fontSize: '9pt' }}>
          TOTAL PAID (INR)
        </td>
        <td className="bct-right" style={{ fontWeight: 800, fontSize: '9pt' }}>
          ₹{formatAmt(netTotal)}
        </td>
      </tr>
    )

    return (
      <div style={{ overflowX: 'auto' }}>
        <table className="bill-charges-table">
          <thead>
            <tr>{headers}</tr>
          </thead>
          <tbody>{bodyRows}</tbody>
          <tfoot>
            <tr key="footer1">{footerCells}</tr>
            {summaryRows}
          </tfoot>
        </table>
      </div>
    )
  }

  const renderHorizontalSummary = () => null

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
        <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '7pt' }}>
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
      <div className="text-center mt-2">
        {printSettings?.show_thankyou_message === 1 && (
          <div className="bill-thankyou">
            {printSettings?.thankyou_message_text || 'Thank You!'}
          </div>
        )}
        {printSettings?.show_footer_note === 1 && (
          <div className="mt-1" style={{ fontSize: '8pt', color: '#555' }}>
            {printSettings?.footer_note_text || 'We look forward to welcoming you again.'}
          </div>
        )}
        <div className="mt-1" style={{ fontSize: '7pt', color: '#999' }}>
          {printSettings?.show_gst_details === 1 && <div>GSTIN: {hotelGSTIN}</div>}
          {printSettings?.show_company_pan === 1 && <div>PAN: {hotelPAN}</div>}
          {printSettings?.show_fssai === 1 && <div>FSSAI: {hotelFSSAI}</div>}
        </div>
        {printSettings?.custom_footer_text && (
          <div className="mt-1" style={{ fontSize: '7pt', color: '#999' }}>
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
          <div className="text-center mb-2" style={{ fontSize: '8pt', color: '#666' }}>
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
            {renderHorizontalSummary()}
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
            {renderHorizontalSummary()}
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
        centered
      >
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
        .bill-modal-dialog { max-width: 1050px !important; width: 95% !important; }
        .bill-modal-body {
          background: #e8eaed;
          padding: 0;
          max-height: 90vh;
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
          padding: 6px 20px;
          border-radius: 4px;
          font-size: 12px;
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
          padding: 6px 20px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 7px;
          cursor: pointer;
        }
        .btn-bill-pdf:hover { opacity: 0.88; color: white; }

        .bill-a4-paper {
          background: white;
          width: 100%;
          max-width: 950px;
          margin: 0 auto;
          padding: 15px 25px 25px 25px;
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
        centered
      >
        <Modal.Header
          closeButton
          className="py-2"
          style={{ background: headerBg, borderBottom: 'none' }}
        >
          <Modal.Title className="text-white fw-bold" style={{ fontSize: '0.85rem' }}>
            🧾 Hotel Booking Bill — {summary?.guest_name || 'Guest'}
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
          </div>
          <div style={{ padding: '15px', background: '#e8eaed' }}>
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