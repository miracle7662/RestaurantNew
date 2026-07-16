// components/CheckoutBillModal.tsx
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { Modal, Button, Spinner } from 'react-bootstrap'
import BillPrintSettingService, { BillPrintSetting } from '@/common/hotel/billPrintSettingService'
import CheckoutService from '@/common/hotel/checkout'
import BrandService from '@/common/api/brand';


// ==================== INTERFACES ====================

interface DisplayDetailRow {
  id: string
  room_number: string
  bill_date: string
  bill_date_formatted: string
  tariff: number
  ex_pax: number
  child_paid_amount: number
  driver_charge: number
  cgst: number
  sgst: number
  igst: number
  food: number
  post_charges: number
  allowance: number
  discount_amount: number
  total_amount: number  // dtotal_amount from SP

  room_id: number
  room_category_name: string
  converted_category_name: string
  checkin_datetime: string
  checkout_datetime: string
  no_of_days: number
  adults: number
  pax: number
  ex_pax_total: number
  child_paid: number
  child_unpaid: number
  driver: number
  discount_percent: number
  cgst_percent: number
  sgst_percent: number
  igst_percent: number
  cess_percent: number
  service_charge: number
  tax: number
  charge_id: number
  guest_name: string
  payment_mode: string
  description: string
  transaction_type: string
  isPostCharge: boolean
}

interface CheckoutBillModalProps {
  show: boolean
  onHide: () => void
  checkoutId: number
  ldgBillNo?: string
  hotelId?: number
  billNumber?: string
  paymentTransactionId?: string
  paymentDate?: string
  paymentBank?: string
  selectedRooms?: string[]
}

interface TableRowWithIndex {
  id: string
  displayIndex: number
  roomNumber: string
  date: string
  tariff: number
  ex_pax: number
  child_paid_amount: number
  driver_charge: number
  discount_amount: number
  cgst: number
  sgst: number
  food: number
  post_charges: number
  allowance: number
  total: number
  isFirstRow?: boolean
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

const formatDateTime = (isoString: string): string => {
  if (!isoString) return '-'
  const d = new Date(isoString)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  let hours = d.getHours()
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12 // Convert to 12-hour format (0 becomes 12)
  const hoursStr = hours.toString().padStart(2, '0')
  return `${day}/${month}/${year} ${hoursStr}:${minutes} ${ampm}`
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

const formatBillDate = (dateString: string): string => {
  if (!dateString) return '-'
  const d = new Date(dateString)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear().toString().slice(-2)
  return `${day}-${month}-${year}`
}


// ==================== NUMBER TO WORDS (INDIAN) ====================

const numberToWords = (num: number): string => {
  if (isNaN(num) || num < 0) return 'Zero'

  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  const convertBelowHundred = (n: number): string => {
    if (n < 20) return ones[n]
    const ten = Math.floor(n / 10)
    const unit = n % 10
    return tens[ten] + (unit ? ' ' + ones[unit] : '')
  }

  const convertBelowThousand = (n: number): string => {
    if (n < 100) return convertBelowHundred(n)
    const hundred = Math.floor(n / 100)
    const rest = n % 100
    return ones[hundred] + ' Hundred' + (rest ? ' ' + convertBelowHundred(rest) : '')
  }

  if (num < 1000) return convertBelowThousand(num)

  // Indian numbering: lakh (100,000) and crore (10,000,000)
  const crore = Math.floor(num / 10000000)
  const lakh = Math.floor((num % 10000000) / 100000)
  const thousand = Math.floor((num % 100000) / 1000)
  const remainder = Math.floor(num % 1000)

  let words = ''
  if (crore) words += convertBelowThousand(crore) + ' Crore '
  if (lakh) words += convertBelowThousand(lakh) + ' Lakh '
  if (thousand) words += convertBelowThousand(thousand) + ' Thousand '
  if (remainder) words += convertBelowThousand(remainder)

  return words.trim()
}

const amountInWords = (amount: number): string => {
  const rounded = roundToTwo(amount)
  const rupees = Math.floor(rounded)
  const paise = Math.round((rounded - rupees) * 100)
  let words = numberToWords(rupees) + ' Rupees'
  if (paise > 0) words += ' and ' + numberToWords(paise) + ' Paise'
  return words + ' Only'
}



// ==================== BILL COMPONENT ====================

const CheckoutBillModal: React.FC<CheckoutBillModalProps> = ({
  show,
  onHide,
  checkoutId,
  ldgBillNo,
  hotelId,
  billNumber: propBillNumber,
  paymentTransactionId: propPaymentTransactionId,
  paymentDate: propPaymentDate,
  paymentBank: propPaymentBank,
  selectedRooms = [],
}) => {
  const printRef = useRef<HTMLDivElement>(null)
  const fetchCalledRef = useRef(false)

  const [printSettings, setPrintSettings] = useState<BillPrintSetting | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [billData, setBillData] = useState<any[]>([])
  const [billLoading, setBillLoading] = useState(false)
  const [billError, setBillError] = useState<string | null>(null)
  const [footerSummary, setFooterSummary] = useState<any>(null)

  const [hotelData, setHotelData] = useState<any>(null);
  const [hotelDataLoading, setHotelDataLoading] = useState(false);


  useEffect(() => {
    const fetchHotelData = async () => {
      if (!hotelId || !show) {
        setHotelData(null);
        return;
      }
      setHotelDataLoading(true);
      try {
        const response = await BrandService.getBrandById(String(hotelId));
        // 🔥 Extract the actual hotel data
        const hotel = response?.data || response;
        setHotelData(hotel);
      } catch (error) {
        console.error('Failed to fetch hotel data:', error);
      } finally {
        setHotelDataLoading(false);
      }
    };
    fetchHotelData();
  }, [hotelId, show]);

  // ========== FETCH PRINT SETTINGS ==========
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

  // ========== FETCH BILL PREVIEW DATA ==========
  useEffect(() => {
    const fetchBillPreview = async () => {
      if (!show) return

      if (!checkoutId && !ldgBillNo) {
        setBillError('No checkout ID or bill number provided')
        return
      }

      if (fetchCalledRef.current && billData.length > 0) {
        return
      }

      fetchCalledRef.current = true
      setBillLoading(true)
      setBillError(null)

      try {
        const response = await CheckoutService.getBillPreview(
          checkoutId || undefined,
          ldgBillNo || undefined
        )

        if (response.success && response.data) {
          let filteredData = response.data
          if (selectedRooms && selectedRooms.length > 0) {
            filteredData = response.data.filter((row: any) => {
              const roomNumber = row.room_number || `Room-${row.room_id}`
              return selectedRooms.includes(roomNumber)
            })
          }
          setBillData(filteredData)

          // 🔥 Store the footer summary (Result Set 3)
          if (response.summary) {
            setFooterSummary(response.summary)
            console.log('📊 Footer Summary:', response.summary)
            console.log('💰 balance_amount from SP:', response.summary.balance_amount)
          }
        } else {
          setBillError(response.message || 'Failed to fetch bill data')
        }
      } catch (error: any) {
        console.error('Failed to fetch bill preview:', error)
        setBillError(error?.message || 'Failed to fetch bill data')
      } finally {
        setBillLoading(false)
      }
    }

    if (show) {
      fetchBillPreview()
    }

    return () => {
      if (!show) {
        fetchCalledRef.current = false
      }
    }
  }, [show, checkoutId, ldgBillNo, selectedRooms])

  // ========== BUILD DISPLAY ROWS - DIRECT FROM SP ==========
  const displayRows = useMemo(() => {
    if (!billData.length) return []

    return billData.map((row, index) => {
      const roomNumber = row.room_number || `Room-${row.room_id}`
      const transactionType = (row.transaction_type || '').toUpperCase().trim()

      const isPostCharge = ['CHARGE', 'POST CHARGE', 'POST_CHARGE', 'ALLOWANCE', 'ADVANCE ADDITION', 'FOOD']
        .includes(transactionType)

      const billDateFormatted = row.bill_date
        ? formatBillDate(row.bill_date)
        : formatBillDate(row.checkin_datetime)

      return {
        id: `row-${row.room_number || index}-${index}`,
        room_number: roomNumber,
        bill_date: row.bill_date || row.checkin_datetime,
        bill_date_formatted: billDateFormatted,
        // DIRECT VALUES FROM STORED PROCEDURE
        tariff: toNumber(row.tariff || 0),
        ex_pax: toNumber(row.ex_pax || 0),
        child_paid_amount: toNumber(row.child_paid_amount || 0),
        driver_charge: toNumber(row.driver_charge || 0),
        cgst: toNumber(row.cgst || 0),
        sgst: toNumber(row.sgst || 0),
        igst: toNumber(row.igst || 0),
        food: toNumber(row.food || 0),
        post_charges: toNumber(row.post_charges || 0),
        allowance: toNumber(row.allowance || 0),
        discount_amount: toNumber(row.discount_amount || 0),
        total_amount: toNumber(row.dtotal_amount || row.total_amount || 0),
        room_id: row.room_id || 0,
        room_category_name: row.room_category_name || '-',
        converted_category_name: row.converted_category_name || '-',
        checkin_datetime: row.checkin_datetimecmcm,
        checkout_datetime: row.checkout_datetimecm,
        no_of_days: row.no_of_days || 1,
        adults: row.adults || 0,
        pax: row.pax || 0,
        ex_pax_total: row.ex_pax_total || 0,
        child_paid: row.child_paid || 0,
        child_unpaid: row.child_unpaid || 0,
        driver: row.driver || 0,
        discount_percent: row.discount_percent || 0,
        cgst_percent: row.cgst_percent || 0,
        sgst_percent: row.sgst_percent || 0,
        igst_percent: row.igst_percent || 0,
        cess_percent: row.cess_percent || 0,
        service_charge: row.service_charge || 0,
        tax: row.tax || 18,
        charge_id: row.charge_id || row.folio_id || index,
        guest_name: row.guest_name,
        payment_mode: row.payment_mode || 'Cash',
        description: row.description || 'Room Charges',
        transaction_type: transactionType,
        isPostCharge: isPostCharge,
      }
    })
  }, [billData])

  // ========== BUILD SUMMARY - DIRECT FROM HEADER ROW ==========
  const summary = useMemo(() => {
    if (!billData.length || !displayRows.length) return null

    const firstRow = billData[0]

    // ---- NEW: collect unique guest names from all rows ----
    const guestNames = [
      ...new Set(
        displayRows
          .map((row) => row.guest_name)
          .filter((name) => name && name.trim() !== '')
      ),
    ]
    const guestNameDisplay = guestNames.length ? guestNames.join(', ') : 'Guest'
    // -------------------------------------------------------

    // Aggregate room-level data (same as before)
    const roomMap = new Map<
      string,
      { adults: number; child_paid: number; driver: number; category: string }
    >()
    displayRows.forEach((row) => {
      const roomNum = row.room_number
      if (!roomMap.has(roomNum)) {
        roomMap.set(roomNum, {
          adults: toNumber(row.adults || 0),
          child_paid: toNumber(row.child_paid || 0),
          driver: toNumber(row.driver || 0),
          category: row.converted_category_name || row.room_category_name || '-',
        })
      }
    })

    let totalAdults = 0,
      totalChildPaid = 0,
      totalDriver = 0
    const categoriesSet = new Set<string>()
    roomMap.forEach((value) => {
      totalAdults += value.adults
      totalChildPaid += value.child_paid
      totalDriver += value.driver
      if (value.category) categoriesSet.add(value.category)
    })

    const roomCategoriesStr = Array.from(categoriesSet).join(', ') || '-'

    const guestsDisplayParts = []
    if (totalAdults > 0) guestsDisplayParts.push(`${totalAdults} Adults`)
    if (totalChildPaid > 0) guestsDisplayParts.push(`${totalChildPaid} Child`)
    if (totalDriver > 0) guestsDisplayParts.push(`${totalDriver} Driver`)
    const guestsDisplay = guestsDisplayParts.join(', ') || '-'

    const roomNumbers = Array.from(roomMap.keys()).filter(Boolean)
    const roomNumbersStr = roomNumbers.join(', ') || '-'

    return {
      checkin_id: firstRow.checkin_id,
      guest_id: firstRow.guest_id,
      // ---- Use the combined name here ----
      guest_name: guestNameDisplay,
      // ------------------------------------
      guest_mobile: firstRow.guest_mobile || firstRow.mobile || '-',
      guest_email: firstRow.guest_email || firstRow.emailed || '-',
      guest_address: firstRow.guest_address || firstRow.address || '-',
      room_numbers_str: roomNumbersStr,
      room_categories_str: roomCategoriesStr,
      total_days: firstRow.total_nights || 0,
      total_adults: totalAdults,
      total_child_paid: totalChildPaid,
      total_driver: totalDriver,
      reg_no: firstRow.reg_no,
      plan_name: firstRow.plan_name,
      company_name: firstRow.company_name || '-',
      gst_no: firstRow.gst_no || '-',
      guests_display: guestsDisplay,
      total_amount: toNumber(firstRow.total_amount || 0),
      discount_amount: toNumber(firstRow.discount_amount || 0),
      advance_amt: toNumber(firstRow.advance_amt || 0),
      net_payable: toNumber(firstRow.net_payable || 0),
      cgst_amt: toNumber(firstRow.cgst_amt || 0),
      sgst_amt: toNumber(firstRow.sgst_amt || 0),
      igst_amt: toNumber(firstRow.igst_amt || 0),
      payment_mode: firstRow.payment_mode || 'Cash',
      original_checkin_datetime: firstRow.checkin_datetimecm,
      final_checkout_datetime: firstRow.checkout_datetimecm,
      checked_out_rooms: firstRow.checked_out_rooms
        ? firstRow.checked_out_rooms.split(',')
        : [],
    }
  }, [displayRows, billData])
  // ========== GENERATE TABLE ROWS - GROUP BY ROOM & DATE ==========
  // ========== GENERATE TABLE ROWS - GROUP BY ROOM & DATE ==========
  const tableRows = useMemo(() => {
    if (!displayRows.length) return []

    // Group by room and date
    const grouped = new Map<string, Map<string, DisplayDetailRow[]>>()

    displayRows.forEach((charge) => {
      const room = charge.room_number || 'COMMON'
      const date = charge.bill_date_formatted || formatDate(charge.bill_date)

      if (!grouped.has(room)) {
        grouped.set(room, new Map())
      }
      const roomMap = grouped.get(room)!
      if (!roomMap.has(date)) {
        roomMap.set(date, [])
      }
      roomMap.get(date)!.push(charge)
    })

    const rows: TableRowWithIndex[] = []
    let index = 1

    const sortedRooms = Array.from(grouped.keys()).sort((a, b) => {
      if (a === 'COMMON') return 1
      if (b === 'COMMON') return -1
      const numA = parseInt(a)
      const numB = parseInt(b)
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB
      return a.localeCompare(b)
    })

    for (const room of sortedRooms) {
      const dateMap = grouped.get(room)!
      const sortedDates = Array.from(dateMap.keys()).sort((a, b) => {
        const dateA = a.split('/').reverse().join('-')
        const dateB = b.split('/').reverse().join('-')
        return new Date(dateA).getTime() - new Date(dateB).getTime()
      })

      let isFirstRow = true
      for (const date of sortedDates) {
        const charges = dateMap.get(date) || []

        // SUM values from SP - NO MANUAL CALCULATION
        const tariff = charges.reduce((sum, c) => sum + c.tariff, 0)
        const ex_pax = charges.reduce((sum, c) => sum + c.ex_pax, 0)
        const child_paid_amount = charges.reduce((sum, c) => sum + c.child_paid_amount, 0)
        const driver_charge = charges.reduce((sum, c) => sum + c.driver_charge, 0)
        const discount_amount = charges.reduce((sum, c) => sum + c.discount_amount, 0)
        const cgst = charges.reduce((sum, c) => sum + c.cgst, 0)
        const sgst = charges.reduce((sum, c) => sum + c.sgst, 0)
        const food = charges.reduce((sum, c) => sum + c.food, 0)

        // 🔥 ONLY sum allowance where transaction_type is 'ALLOWANCE'
        const allowance = charges
          .filter(c => c.transaction_type === 'ALLOWANCE')
          .reduce((sum, c) => sum + c.allowance, 0)

        // 🔥 ONLY sum post_charges where transaction_type is 'CHARGE' or 'POST CHARGE'
        const post_charges = charges
          .filter(c => c.transaction_type === 'CHARGE' || c.transaction_type === 'POST CHARGE')
          .reduce((sum, c) => sum + c.post_charges, 0)

        // TOTAL DIRECT FROM SP - dtotal_amount is already calculated by SP
        const total = charges.reduce((sum, c) => sum + c.total_amount, 0)

        rows.push({
          id: `row-${room}-${date}`,
          displayIndex: index++,
          roomNumber: room,
          date: date,
          tariff,
          ex_pax,
          child_paid_amount,
          driver_charge,
          discount_amount,
          cgst,
          sgst,
          food,
          post_charges,
          allowance,  // 🔥 Now only ₹200.00
          total,
          isFirstRow,
        })
        isFirstRow = false
      }
    }

    return rows
  }, [displayRows])

  const totals = useMemo(() => {
    const firstRow = billData[0] || {}

    // 🔥 Use footerSummary for balance_amount and other footer values
    return {
      totalAmount: toNumber(footerSummary?.bill_amount || firstRow.bill_amount || firstRow.total_amount || 0),
      discountAmount: toNumber(footerSummary?.discount_amount || firstRow.discount_amount_total || 0),
      advanceAmount: toNumber(footerSummary?.advance_amount || firstRow.advance_amount_total || firstRow.advance_amt || 0),
      netPayable: toNumber(footerSummary?.net_payable || firstRow.net_payable || 0),
      // 🔥 balance_amount DIRECTLY from footerSummary (Result Set 3) - NO MANUAL CALCULATION
      balanceAmount: toNumber(footerSummary?.balance_amount || 0),
      cgst: toNumber(footerSummary?.cgst || firstRow.cgst || firstRow.cgst_amt || 0),
      sgst: toNumber(footerSummary?.sgst || firstRow.sgst || firstRow.sgst_amt || 0),
      igst: toNumber(footerSummary?.igst || firstRow.igst || firstRow.igst_amt || 0),
      postCharges: toNumber(footerSummary?.post_charges || 0),
      allowance: toNumber(footerSummary?.allowance || 0),
    }
  }, [billData, footerSummary])

  // ========== DISPLAY VALUES ==========
  const displayCheckedOutRooms = summary?.checked_out_rooms || summary?.room_numbers_str?.split(',') || []
  const checkedOutRoomsStr = displayCheckedOutRooms.join(', ') || summary?.room_numbers_str || ''
  const checkinDateDisplay = summary?.original_checkin_datetime
    ? formatDateLong(summary.original_checkin_datetime)
    : '-'
  const checkoutDateDisplay = summary?.final_checkout_datetime
    ? formatDateLong(summary.final_checkout_datetime)
    : '-'

  const invoiceDate = formatDateTime(new Date().toISOString())
  const generatedBillNo = propBillNumber ||
    billData[0]?.ldg_bill_no ||
    `INV/${new Date().getFullYear()}/${String(summary?.checkin_id || '0').padStart(4, '0')}`
  const paymentMode = summary?.payment_mode || 'Credit Card'

  const headerBg = printSettings?.table_header_bg_color || '#1a2744'
  const headerText = printSettings?.table_header_text_color || '#ffffff'

  const showTopHeaderSection = printSettings?.show_top_header_section !== 0
  const topMarginWhenHeaderHidden = printSettings?.top_margin_when_header_hidden || 30

  const getFontSize = useCallback(() => {
    switch (printSettings?.table_font_size) {
      case 'small': return '7pt'
      case 'large': return '9pt'
      default: return '8pt'
    }
  }, [printSettings?.table_font_size])

  // ========== STYLES ==========
  const getBillStyles = useCallback(() => {
    const fontSize = getFontSize()
    return `
    .bill-wrap * { box-sizing: border-box; }
    .bill-wrap {
      font-family: 'Segoe UI', 'Calibri', Arial, sans-serif;
      font-size: ${fontSize};
      color: #1a1a1a;
      line-height: 1.3;
      height: 100%;
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .bill-layout-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      height: 100%;
      flex: 1;
    }
    .bill-layout-top {
      flex: 1 0 auto;
    }
    .bill-layout-bottom {
      flex-shrink: 0;
      margin-top: auto;
      padding-top: 6px;
      border-top: 2px solid ${headerBg};
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .bill-spacer {
      flex: 1 1 auto;
      min-height: 15px;
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
      height: 100%;
    }
    .bill-wrap .bill-info-box-header {
      background: ${headerBg};
      color: ${headerText};
      text-align: center;
      font-weight: 700;
      font-size: 9pt;
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
      font-size: 9pt;
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
    .bill-wrap .bill-charges-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 0;
      font-size: ${fontSize};
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
      font-size: 9pt;
    }
    .bill-wrap .bill-charges-table tbody tr:nth-child(even) td {
      background: #f9f9f9;
    }
    .bill-wrap .bill-charges-table tfoot tr td {
      border: 1px solid #d4d4d4;
      padding: 5px 6px;
      font-size: 9pt;
    }
    .bill-wrap .bct-right { text-align: right; }
    .bill-wrap .bct-center { text-align: center; }
    .bill-wrap .bct-left { text-align: left; }
    .bill-wrap .col-srno { width: 30px; }
    .bill-wrap .col-room { width: 45px; }
    .bill-wrap .col-date { width: 70px; }
    .bill-wrap .col-amount { width: 65px; }
    .bill-wrap .col-small { width: 55px; }
    .bill-wrap .bill-amount-words {
      border: 1px solid #d4d4d4;
      border-top: none;
      padding: 6px 10px;
      font-size: 9pt;
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
      max-height: 100px;
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
      font-size: 9pt;
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
   @media print {
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
    .bill-layout-container {
        height: auto !important;
        min-height: var(--page-content-height, 100vh) !important;
        display: flex !important;
        flex-direction: column !important;
      }
      .bill-wrap {
        height: auto !important;
        min-height: var(--page-content-height, 100vh) !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      .bill-layout-top {
        flex: 1 1 auto !important;
      }
      .bill-spacer {
        flex: 1 1 auto !important;
        min-height: 0 !important;
      }
      .bill-layout-bottom {
        flex: 0 0 auto !important;
        margin-top: 0 !important;
        padding-top: 6px !important;
        border-top: 2px solid ${headerBg} !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
    }
  `
  }, [headerBg, headerText, getFontSize])

  // ========== HANDLE PRINT ==========
  const handlePrint = useCallback(() => {
    const printContents = printRef.current?.innerHTML || ''
    const printWindow = window.open('', '_blank', 'width=800,height=700')
    if (!printWindow) return

    const effectiveTopMargin = !showTopHeaderSection ? 0 : printSettings?.margin_top_mm || 8
    const pageBottomMargin = printSettings?.margin_bottom_mm || 8
    const isA4Print = (printSettings?.default_print_size || 'A4') === 'A4'
    const pageHeightMm = isA4Print ? 297 : null
    const pageContentHeightCss = pageHeightMm
      ? `${pageHeightMm - effectiveTopMargin - pageBottomMargin}mm`
      : '100vh'

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
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              color-adjust: exact;
            }
            @page {
              size: ${printSettings?.default_print_size === 'A4' ? 'A4' : 'auto'};
              margin: ${effectiveTopMargin}mm ${printSettings?.margin_right_mm || 10}mm ${printSettings?.margin_bottom_mm || 8}mm ${printSettings?.margin_left_mm || 10}mm;
            }
           body { 
              background: white; 
              margin: 0; 
              padding: 0;
              --page-content-height: ${pageContentHeightCss};
            }
           .print-container {
              width: 100%;
              max-width: 950px;
              margin: 0 auto;
              padding: 15px 25px 25px 25px;
            }
            ${getBillStyles()}
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              .print-container {
                max-width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container bill-wrap">
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
  }, [summary, printSettings, showTopHeaderSection, getBillStyles])

  // Inside the component (before the useEffect)
  const getServerBaseUrl = () => {
    try {
      const saved = localStorage.getItem('posServerConfig');
      if (saved) {
        const cfg = JSON.parse(saved);
        return `http://${cfg.serverIP || 'localhost'}:${cfg.port || 3001}`;
      }
    } catch { }
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
    }
    if (window.location.protocol === 'file:') return 'http://localhost:3001';
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  };

  const normalizeLogoUrl = (logo: any): string | null => {
    if (!logo) return null;
    if (typeof logo === 'string') {
      if (logo.startsWith('http://') || logo.startsWith('https://') || logo.startsWith('data:')) {
        return logo;
      }
      const base = getServerBaseUrl();
      const clean = logo.startsWith('/') ? logo.slice(1) : logo;
      return `${base}/${clean}`;
    }
    // handle Uint8Array (rare)
    if (logo instanceof Uint8Array) {
      try {
        const base64 = btoa(String.fromCharCode(...logo));
        return `data:image/png;base64,${base64}`;
      } catch { return null; }
    }
    return null;
  };

  // ========== HANDLE DOWNLOAD PDF ==========
  const handleDownloadPDF = useCallback(async () => {
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
  }, [printSettings, showTopHeaderSection, summary, generatedBillNo])

  // ========== RENDER FUNCTIONS ==========

  const renderHotelHeader = useCallback(() => {
    if (!showTopHeaderSection) {
      const spacerPx = Math.round((topMarginWhenHeaderHidden || 20) * 3.7795);
      return (
        <div
          style={{ height: `${spacerPx}px`, width: '100%' }}
          aria-hidden="true"
          data-role="header-spacer"
        />
      );
    }

    const firstRow = billData[0];

    // Text alignments (still configurable)
    const nameAlign = printSettings?.hotel_name_position || 'center';
    const addressAlign = printSettings?.hotel_address_position || 'left';
    const contactAlign = printSettings?.hotel_contact_position || 'left';

    // Logo: forced to the right (as you requested)
    const logoPosition = 'right';

    const rawLogo = hotelData?.Logo || hotelData?.logo || firstRow?.Logo;
    const logoUrl = normalizeLogoUrl(rawLogo);

    const logoEl =
      printSettings?.show_hotel_logo === 1 && logoUrl ? (
        <img src={logoUrl} alt="Hotel Logo" className="bill-hotel-logo" />
      ) : null;

    return (
      <div className="mb-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Left side: all text content */}
        <div style={{ flex: 1 }}>
          {/* Hotel Name */}
          {printSettings?.show_hotel_name === 1 && (
            <div
              className={`text-${nameAlign}`}
              style={{ fontSize: '21pt', fontWeight: 'bold' }}
            >
              {firstRow?.hotel_name || 'Nilay Inn'}
            </div>
          )}

          {/* Hotel Address */}
          {printSettings?.show_hotel_address === 1 && (
            <div
              className={`text-${addressAlign} mt-1`}
              style={{ fontSize: '10pt', fontWeight: 'bold' }}
            >
              📍 {firstRow?.hotel_address || 'Nilay Inn, Near kannya prashala, Station Road.'}
            </div>
          )}

          {/* Contact (Phone, Email, Website) */}
          {printSettings?.show_hotel_contact === 1 && (
            <div
              className={`text-${contactAlign} mt-1`}
              style={{ fontSize: '10pt', fontWeight: 'bold', color: '#060000' }}
            >
              📞 {firstRow?.phone || '9270271704'} &nbsp;|&nbsp; ✉ {firstRow?.email || 'Nilayinn17@gmail.com'} &nbsp;|&nbsp; 🌐 {firstRow?.website || 'www.grandviewhotel.com'}
            </div>
          )}

          {/* GST / TRN */}
          {printSettings?.show_hotel_contact === 1 && (
            <div
              className={`text-${contactAlign} mt-1`}
              style={{ fontSize: '10pt', fontWeight: 'bold', color: '#060000' }}
            >
              📍 {firstRow?.trn_gstno || 'ljkhjghfgdsa76543'}
            </div>
          )}
        </div>

        {/* Right side: Logo (separate div) */}
        {logoEl && (
          <div style={{ marginLeft: '20px', flexShrink: 0 }}>
            {logoEl}
          </div>
        )}
      </div>
    );
  }, [billData, printSettings, showTopHeaderSection, topMarginWhenHeaderHidden, hotelData]);

  const renderBillTitle = useCallback(() => {
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
          INVOICE
        </h3>
      </div>
    )
  }, [printSettings, headerBg])

  // ========== RENDER GUEST DETAILS ==========
  const renderGuestDetails = useCallback(() => {
    if (printSettings?.show_guest_details !== 1) return null

    return (
      <div className="bill-info-box" style={{ height: '100%' }}>
        <div className="bill-info-box-header">GUEST DETAILS</div>
        <div className="bill-info-box-body" style={{ padding: '6px 10px' }}>
          <table className="bill-detail-table" style={{ width: '100%' }}>
            <tbody>
              {printSettings?.show_guest_name === 1 && (
                <tr>
                  <td className="bdt-label" style={{ fontWeight: 'bold', width: '60px', fontSize: '10pt' }}>Name</td>
                  <td className="bdt-colon" style={{ width: '6px', fontSize: '10pt' }}>:</td>
                  <td
                    className="bdt-value"
                    style={{
                      fontWeight: 'bold',
                      fontSize: '10pt',
                      color: headerBg,
                      wordBreak: 'break-word',   // ✅ breaks long words
                      whiteSpace: 'normal',      // ✅ allows wrapping
                    }}
                  >
                    {summary?.guest_name ? (
                      summary.guest_name.split(', ').map((name, idx) => (
                        <div key={idx}>{name}</div>
                      ))
                    ) : '-'}
                  </td>
                </tr>
              )}
              {printSettings?.show_guest_address === 1 && (
                <tr>
                  <td className="bdt-label" style={{ fontWeight: 'bold', width: '60px', fontSize: '10pt' }}>Address</td>
                  <td className="bdt-colon" style={{ width: '6px', fontSize: '10pt' }}>:</td>
                  <td
                    className="bdt-value"
                    style={{
                      fontWeight: 'bold',
                      fontSize: '10pt',
                      wordBreak: 'break-word',   // forces break on long words
                      whiteSpace: 'normal',      // allows normal wrapping
                    }}
                  >
                    {summary?.guest_address || '-'}
                  </td>
                </tr>
              )}
              {printSettings?.show_guest_mobile === 1 && (
                <tr>
                  <td className="bdt-label" style={{ fontWeight: 'bold', width: '60px', fontSize: '10pt' }}>Phone</td>
                  <td className="bdt-colon" style={{ width: '6px', fontSize: '10pt' }}>:</td>
                  <td className="bdt-value" style={{ fontWeight: 'bold', fontSize: '10pt' }}>{summary?.guest_mobile || '-'}</td>
                </tr>
              )}
              {printSettings?.show_guest_email === 1 && (
                <tr>
                  <td className="bdt-label" style={{ fontWeight: 'bold', width: '60px', fontSize: '10pt' }}>Company</td>
                  <td className="bdt-colon" style={{ width: '6px', fontSize: '10pt' }}>:</td>
                  <td className="bdt-value" style={{ wordBreak: 'break-all', fontSize: '10pt', fontWeight: 'bold' }}>{summary?.company_name || '-'}</td>
                </tr>
              )}
              {printSettings?.show_guest_id_proof === 1 && (
                <tr>
                  <td className="bdt-label" style={{ fontWeight: 'bold', width: '60px', fontSize: '10pt' }}>GSTIN</td>
                  <td className="bdt-colon" style={{ width: '6px', fontSize: '10pt' }}>:</td>
                  <td className="bdt-value" style={{ fontSize: '10pt', fontWeight: 'bold' }}>{summary?.gst_no || '-'}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }, [printSettings, summary, headerBg])

  // ========== RENDER BOOKING & INVOICE DETAILS ==========
  const renderBookingDetails = useCallback(() => {
    if (printSettings?.show_booking_details !== 1) return null

    const invoiceNo = propBillNumber || billData[0]?.ldg_bill_no || generatedBillNo
    const invoiceDateDisplay = propPaymentDate || invoiceDate
    const bookingIdDisplay = summary?.reg_no || `BKD${summary?.checkin_id || '0000'}`
    const roomTypeDisplay = summary?.room_categories_str || '-'
    const roomNumbersDisplay = checkedOutRoomsStr || summary?.room_numbers_str || '-'
    const nightsDisplay = summary?.total_days || 0
    const tariffPlanDisplay = summary?.plan_name || 'Room Only'
    const guestsDisplay = summary?.guests_display || `${summary?.total_adults || 0} Adults`

    const firstRow = billData[0] || {}

    // const formatDateTimeFull = (datetime: string) => {
    //   if (!datetime) return '-'
    //   const d = new Date(datetime)
    //   const day = d.getDate().toString().padStart(2, '0')
    //   const month = d.toLocaleString('default', { month: 'long' })
    //   const year = d.getFullYear()
    //   const hours = d.getHours().toString().padStart(2, '0')
    //   const minutes = d.getMinutes().toString().padStart(2, '0')
    //   return `${day} ${month} ${year} ${hours}:${minutes}`
    // }

    const checkinDateTime = firstRow?.checkin_datetimecm || null
    const checkoutDateTime = firstRow?.checkout_datetimecm || null

    const checkinDisplay = checkinDateTime ? formatDateTime(checkinDateTime) : '-'
    const checkoutDisplay = checkoutDateTime ? formatDateTime(checkoutDateTime) : '-'

    return (
      <div className="bill-info-box" style={{ height: '100%' }}>
        <div className="bill-info-box-header">BOOKING & INVOICE DETAILS</div>
        <div className="bill-info-box-body" style={{ padding: '8px 12px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '2px 30px',
            fontSize: '9pt'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'auto auto 1fr',
              gap: '3px 5px',
              alignItems: 'baseline'
            }}>
              <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Invoice No.</span>
              <span style={{ fontWeight: 'bold' }}>:</span>
              <span style={{ fontWeight: 'bold', color: headerBg }}>{invoiceNo}</span>

              <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Register No</span>
              <span style={{ fontWeight: 'bold' }}>:</span>
              <span style={{ fontWeight: 'bold' }}>{bookingIdDisplay}</span>

              <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Arrival Date</span>
              <span style={{ fontWeight: 'bold' }}>:</span>
              <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>{checkinDisplay}</span>   {/* nowrap added */}

              <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Departure Date</span>
              <span style={{ fontWeight: 'bold' }}>:</span>
              <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>{checkoutDisplay}</span>  {/* nowrap added */}

              <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap', alignSelf: 'start' }}>Room No(s).</span>
              <span style={{ fontWeight: 'bold', alignSelf: 'start' }}>:</span>
              <span style={{ fontWeight: 'bold', wordBreak: 'break-word' }}>{roomNumbersDisplay}</span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'auto auto 1fr',
              gap: '3px 4px',
              alignItems: 'baseline'
            }}>
              <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Invoice Date</span>
              <span style={{ fontWeight: 'bold' }}>:</span>
              <span style={{ fontWeight: 'bold', color: headerBg }}>{invoiceDateDisplay}</span>

              <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Guests / Plan</span>
              <span style={{ fontWeight: 'bold' }}>:</span>
              <span style={{ fontWeight: 'bold' }}>{guestsDisplay} {tariffPlanDisplay ? `(${tariffPlanDisplay})` : ''}</span>

              <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>No.of Nights</span>
              <span style={{ fontWeight: 'bold' }}>:</span>
              <span style={{ fontWeight: 'bold' }}>{nightsDisplay}</span>

              <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap', alignSelf: 'start' }}>Room Type</span>
              <span style={{ fontWeight: 'bold', alignSelf: 'start' }}>:</span>
              <span style={{ fontWeight: 'bold', wordBreak: 'break-word' }}>{roomTypeDisplay}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }, [printSettings, propBillNumber, billData, generatedBillNo, propPaymentDate, invoiceDate, summary, checkinDateDisplay, checkoutDateDisplay, checkedOutRoomsStr, headerBg])

  // ========== RENDER CHARGES TABLE ==========
  const renderChargesTable = useCallback(() => {
    if (tableRows.length === 0) {
      return (
        <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
          No charges to display.
        </div>
      )
    }

    const showRowNums = printSettings?.show_row_numbers === 1

    // Check if columns have values
    const hasPostValues = tableRows.some(row => row.post_charges > 0)
    const hasAllowanceValues = tableRows.some(row => row.allowance > 0)
    const hasChildValues = tableRows.some(row => row.child_paid_amount > 0)
    const hasDriverValues = tableRows.some(row => row.driver_charge > 0)
    const hasDiscountValues = tableRows.some(row => row.discount_amount > 0)

    // TOTALS - SUM directly from SP values (no manual calculation)
    const totalTariff = tableRows.reduce((sum, row) => sum + row.tariff, 0)
    const totalExPax = tableRows.reduce((sum, row) => sum + row.ex_pax, 0)
    const totalChild = tableRows.reduce((sum, row) => sum + row.child_paid_amount, 0)
    const totalDriver = tableRows.reduce((sum, row) => sum + row.driver_charge, 0)
    const totalDiscount = tableRows.reduce((sum, row) => sum + row.discount_amount, 0)
    const totalCgst = tableRows.reduce((sum, row) => sum + row.cgst, 0)
    const totalSgst = tableRows.reduce((sum, row) => sum + row.sgst, 0)
    const totalFood = tableRows.reduce((sum, row) => sum + row.food, 0)
    const totalPost = tableRows.reduce((sum, row) => sum + row.post_charges, 0)
    const totalAllowance = tableRows.reduce((sum, row) => sum + row.allowance, 0)
    const totalAmount = tableRows.reduce((sum, row) => sum + row.total, 0)

    const headers: React.ReactElement[] = []
    if (showRowNums) headers.push(<th key="srno" className="col-srno bct-center">#</th>)
    headers.push(<th key="room" className="col-room bct-left">ROOM</th>)
    headers.push(<th key="date" className="col-date bct-left">DATE</th>)
    headers.push(<th key="tariff" className="col-amount bct-right">TARIFF</th>)
    headers.push(<th key="expax" className="col-amount bct-right">EX.PAX</th>)
    if (hasChildValues) headers.push(<th key="child" className="col-amount bct-right">CHILD</th>)
    if (hasDriverValues) headers.push(<th key="driver" className="col-amount bct-right">DRIVER</th>)
    if (hasDiscountValues) headers.push(<th key="discount" className="col-amount bct-right">DISCOUNT</th>)
    headers.push(<th key="cgst" className="col-amount bct-right">CGST</th>)
    headers.push(<th key="sgst" className="col-amount bct-right">SGST</th>)
    headers.push(<th key="food" className="col-amount bct-right">FOOD</th>)
    if (hasPostValues) headers.push(<th key="post" className="col-amount bct-right">POST</th>)
    if (hasAllowanceValues) headers.push(<th key="allowance" className="col-amount bct-right">ALLOWANCE</th>)
    headers.push(<th key="total" className="col-amount bct-right">TOTAL</th>)

    const bodyRows: React.ReactElement[] = []
    let runningIndex = 1

    tableRows.forEach((row) => {
      const cells: React.ReactElement[] = []
      if (showRowNums) cells.push(<td key="srno" className="bct-center" style={{ fontWeight: 'bold' }}>{runningIndex++}</td>)
      cells.push(<td key="room" className="bct-left" style={{ fontWeight: 'bold' }}>{row.roomNumber}</td>)
      cells.push(<td key="date" className="bct-left" style={{ fontWeight: 'bold' }}>{row.date}</td>)
      cells.push(<td key="tariff" className="bct-right" style={{ fontWeight: 'bold' }}>{formatAmtDisplay(row.tariff)}</td>)
      cells.push(<td key="expax" className="bct-right" style={{ fontWeight: 'bold' }}>{formatAmtDisplay(row.ex_pax)}</td>)
      if (hasChildValues) cells.push(<td key="child" className="bct-right" style={{ fontWeight: 'bold' }}>{row.child_paid_amount > 0 ? formatAmtDisplay(row.child_paid_amount) : '-'}</td>)
      if (hasDriverValues) cells.push(<td key="driver" className="bct-right" style={{ fontWeight: 'bold' }}>{row.driver_charge > 0 ? formatAmtDisplay(row.driver_charge) : '-'}</td>)
      if (hasDiscountValues) cells.push(<td key="discount" className="bct-right" style={{ fontWeight: 'bold', color: '#c0392b' }}>{row.discount_amount > 0 ? formatAmtDisplay(row.discount_amount) : '-'}</td>)
      cells.push(<td key="cgst" className="bct-right" style={{ fontWeight: 'bold' }}>{formatAmtDisplay(row.cgst)}</td>)
      cells.push(<td key="sgst" className="bct-right" style={{ fontWeight: 'bold' }}>{formatAmtDisplay(row.sgst)}</td>)
      cells.push(<td key="food" className="bct-right" style={{ fontWeight: 'bold' }}>{row.food > 0 ? formatAmtDisplay(row.food) : '-'}</td>)
      if (hasPostValues) cells.push(<td key="post" className="bct-right" style={{ fontWeight: 'bold' }}>{row.post_charges > 0 ? formatAmtDisplay(row.post_charges) : '-'}</td>)
      if (hasAllowanceValues) cells.push(<td key="allowance" className="bct-right" style={{ fontWeight: 'bold' }}>{row.allowance > 0 ? formatAmtDisplay(row.allowance) : '-'}</td>)
      cells.push(<td key="total" className="bct-right" style={{ fontWeight: 'bold' }}>{formatAmtDisplay(row.total)}</td>)
      bodyRows.push(<tr key={row.id}>{cells}</tr>)
    })

    // FOOTER
    const footerCells: React.ReactElement[] = []
    let labelColSpan = 0
    if (showRowNums) labelColSpan += 1
    labelColSpan += 1 // ROOM
    labelColSpan += 1 // DATE

    footerCells.push(
      <td key="total_label" colSpan={labelColSpan} className="bct-right" style={{ fontWeight: 800, background: '#f0f0f0' }}>
        Total
      </td>
    )
    footerCells.push(<td key="total_tariff" className="bct-right" style={{ fontWeight: 800, background: '#f0f0f0' }}>{formatAmtDisplay(totalTariff)}</td>)
    footerCells.push(<td key="total_expax" className="bct-right" style={{ fontWeight: 800, background: '#f0f0f0' }}>{formatAmtDisplay(totalExPax)}</td>)
    if (hasChildValues) footerCells.push(<td key="total_child" className="bct-right" style={{ fontWeight: 800, background: '#f0f0f0' }}>{totalChild > 0 ? formatAmtDisplay(totalChild) : '-'}</td>)
    if (hasDriverValues) footerCells.push(<td key="total_driver" className="bct-right" style={{ fontWeight: 800, background: '#f0f0f0' }}>{totalDriver > 0 ? formatAmtDisplay(totalDriver) : '-'}</td>)
    if (hasDiscountValues) footerCells.push(<td key="total_discount" className="bct-right" style={{ fontWeight: 800, background: '#f0f0f0', color: '#c0392b' }}>{totalDiscount > 0 ? formatAmtDisplay(totalDiscount) : '-'}</td>)
    footerCells.push(<td key="total_cgst" className="bct-right" style={{ fontWeight: 800, background: '#f0f0f0' }}>{formatAmtDisplay(totalCgst)}</td>)
    footerCells.push(<td key="total_sgst" className="bct-right" style={{ fontWeight: 800, background: '#f0f0f0' }}>{formatAmtDisplay(totalSgst)}</td>)
    footerCells.push(<td key="total_food" className="bct-right" style={{ fontWeight: 800, background: '#f0f0f0' }}>{totalFood > 0 ? formatAmtDisplay(totalFood) : '-'}</td>)
    if (hasPostValues) footerCells.push(<td key="total_post" className="bct-right" style={{ fontWeight: 800, background: '#f0f0f0' }}>{totalPost > 0 ? formatAmtDisplay(totalPost) : '-'}</td>)
    if (hasAllowanceValues) footerCells.push(<td key="total_allowance" className="bct-right" style={{ fontWeight: 800, background: '#f0f0f0' }}>{totalAllowance > 0 ? formatAmtDisplay(totalAllowance) : '-'}</td>)
    footerCells.push(<td key="total_amount" className="bct-right" style={{ fontWeight: 800, background: '#f0f0f0' }}>{formatAmtDisplay(totalAmount)}</td>)

    return (
      <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
        <table className="bill-charges-table">
          <thead><tr>{headers}</tr></thead>
          <tbody>{bodyRows}</tbody>
          <tfoot><tr>{footerCells}</tr></tfoot>
        </table>
      </div>
    )
  }, [tableRows, printSettings])

  // ========== RENDER PAYMENT DETAILS ==========
  const renderPaymentDetails = useCallback(() => {
    const paymentBankDisplay = propPaymentBank || paymentMode
    const totalForWords = totals.netPayable

    return (
      <div className="bill-info-box" style={{ height: '100%' }}>
        <div className="bill-info-box-header">PAYMENT DETAILS</div>
        <div className="bill-info-box-body" style={{ padding: '8px 10px' }}>
          <table className="bill-detail-table" style={{ width: '100%' }}>
            <tbody>
              <tr>
                <td className="bdt-label" style={{ width: '80px', fontSize: '9pt', fontWeight: 'bold' }}>
                  Total (in words)
                </td>
                <td className="bdt-colon" style={{ width: '8px', fontSize: '9pt' }}>:</td>
                <td className="bdt-value" style={{ fontSize: '9pt', fontWeight: 'bold', textTransform: 'capitalize' }}>
                  {amountInWords(totalForWords)}
                </td>
              </tr>
              <tr>
                <td className="bdt-label" style={{ width: '80px', fontSize: '9pt', fontWeight: 'bold' }}>
                  Payment Mode
                </td>
                <td className="bdt-colon" style={{ width: '8px', fontSize: '9pt' }}>:</td>
                <td className="bdt-value" style={{ fontSize: '9pt', fontWeight: 'bold' }}>
                  {paymentBankDisplay}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }, [propPaymentDate, invoiceDate, propPaymentBank, paymentMode, totals.netPayable])
  // ========== RENDER BILL SUMMARY ==========
  const renderSummaryBox = useCallback(() => {
    const grossTotal = totals.totalAmount
    const discountAmount = totals.discountAmount
    const advanceTotal = totals.advanceAmount
    const netTotal = totals.netPayable
    const finalAmount = totals.balanceAmount

    return (
      <div className="bill-info-box" style={{ height: '100%' }}>
        <div className="bill-info-box-header">BILL SUMMARY</div>
        <div className="bill-info-box-body" style={{ padding: '8px 10px' }}>
          <table className="bill-detail-table" style={{ width: '100%' }}>
            <tbody>
              <tr>
                <td className="bdt-label" style={{ width: '100px', fontSize: '9pt', fontWeight: 'bold' }}>TOTAL AMOUNT</td>
                <td className="bdt-colon" style={{ width: '8px', fontSize: '9pt' }}>:</td>
                <td className="bdt-value" style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '9pt', paddingRight: '4px' }}>
                  ₹{formatAmt(grossTotal)}
                </td>
              </tr>
              {discountAmount > 0 && (
                <tr>
                  <td className="bdt-label" style={{ width: '100px', fontSize: '9pt', fontWeight: 600, color: '#c0392b' }}>Discount</td>
                  <td className="bdt-colon" style={{ width: '8px', fontSize: '9pt', color: '#c0392b' }}>:</td>
                  <td className="bdt-value" style={{ textAlign: 'right', color: '#c0392b', fontWeight: 600, fontSize: '9pt', paddingRight: '4px' }}>
                    -₹{formatAmt(discountAmount)}
                  </td>
                </tr>
              )}
              <tr>
                <td className="bdt-label" style={{ width: '100px', fontSize: '9pt', fontWeight: 700, borderTop: '1px solid #e0e0e0', paddingTop: '4px' }}>NET TOTAL</td>
                <td className="bdt-colon" style={{ width: '8px', fontSize: '9pt', borderTop: '1px solid #e0e0e0', paddingTop: '4px' }}>:</td>
                <td className="bdt-value" style={{ textAlign: 'right', fontWeight: 700, fontSize: '9pt', borderTop: '1px solid #e0e0e0', paddingTop: '4px', paddingRight: '4px' }}>
                  ₹{formatAmt(netTotal)}
                </td>
              </tr>
              {advanceTotal > 0 && (
                <>
                  <tr>
                    <td className="bdt-label" style={{ width: '100px', fontSize: '9pt', fontWeight: 600, color: '#e67e22' }}>Advance</td>
                    <td className="bdt-colon" style={{ width: '8px', fontSize: '9pt', color: '#e67e22' }}>:</td>
                    <td className="bdt-value" style={{ textAlign: 'right', color: '#e67e22', fontWeight: 600, fontSize: '9pt', paddingRight: '4px' }}>
                      -₹{formatAmt(advanceTotal)}
                    </td>
                  </tr>
                  <tr>
                    <td className="bdt-label" style={{ width: '100px', fontSize: '8pt', fontWeight: 800, color: headerBg, borderTop: '2px solid #e0e0e0', paddingTop: '4px' }}>BALANCE AMOUNT</td>
                    <td className="bdt-colon" style={{ width: '8px', fontSize: '8pt', borderTop: '2px solid #e0e0e0', paddingTop: '4px' }}>:</td>
                    <td className="bdt-value" style={{ textAlign: 'right', fontWeight: 800, fontSize: '8pt', color: headerBg, borderTop: '2px solid #e0e0e0', paddingTop: '4px', paddingRight: '4px' }}>
                      ₹{formatAmt(finalAmount)}
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }, [totals, headerBg])


  const renderSignatureSection = useCallback(() => {
    const hotelName = billData[0]?.hotel_name || 'Hotel Ashwarya';
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '15px',
        paddingTop: '10px',
        borderTop: '1px solid #ccc'
      }}>
        {/* Left: Guest Signature */}
        <div style={{ flex: 1 }}>

          <div style={{
            borderBottom: '1px solid #000',
            width: '80%',
            marginTop: '19px',
            height: '20px'
          }} />
          {/* 👇 New: Authentication & Reception under the line */}
          <div style={{ fontWeight: 'bold', fontSize: '10pt' }}>
            Signature of Guest
          </div>
        </div>

        {/* Right: Hotel Signature */}
        <div style={{ flex: 1, textAlign: 'right' }}>
          <div style={{ fontWeight: 'bold', fontSize: '10pt' }}>
            For {hotelName}
          </div>
          <div style={{
            borderBottom: '1px solid #000',
            width: '80%',
            marginTop: '5px',
            height: '20px',
            marginLeft: 'auto'
          }} />
          {/* Keep existing text under right line */}
          <div style={{ fontSize: '9pt', marginTop: '2px' }}>
            Authentication & Reception
          </div>
        </div>
      </div>
    );
  }, [billData]);

  const renderLayout = useCallback(() => {
    return (
      <div className="bill-layout-container">
        <div className="bill-layout-top">
          {renderHotelHeader()}
          {renderBillTitle()}

          {/* 🔽 Guest & Booking details side by side */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', alignItems: 'stretch' }}>
            <div style={{ flex: '0 0 auto', width: '250px' }}>
              {renderGuestDetails()}
            </div>
            <div style={{ flex: '1 1 0%', minWidth: 0 }}>
              {renderBookingDetails()}
            </div>
          </div>

          {renderChargesTable()}
          <div className="bill-spacer" />
        </div>

        <div className="bill-layout-bottom" style={{ pageBreakInside: 'avoid', breakInside: 'avoid', paddingTop: '4px', marginTop: 'auto' }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: 0 }}>
            <div style={{ flex: '1 1 0%', minWidth: 0 }}>
              {renderPaymentDetails()}
            </div>
            <div style={{ flex: '1 1 0%', minWidth: 0 }}>
              {renderSummaryBox()}
            </div>
          </div>
          {/* 🔽 Signature section */}
          {renderSignatureSection()}
        </div>
      </div>
    );
  }, [
    renderHotelHeader,
    renderBillTitle,
    renderGuestDetails,    // ✅ now actually used
    renderBookingDetails,  // ✅ now actually used
    renderChargesTable,
    renderPaymentDetails,
    renderSummaryBox,
    renderSignatureSection, // add this to deps
    printSettings,
  ]);

  // ========== LOADING/ERROR STATES ==========
  if (settingsLoading || billLoading) {
    return (
      <Modal show={show} onHide={onHide} dialogClassName="bill-modal-dialog" backdrop="static" centered>
        <Modal.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">{billLoading ? 'Loading bill data...' : 'Loading settings...'}</p>
        </Modal.Body>
      </Modal>
    )
  }

  if (billError) {
    return (
      <Modal show={show} onHide={onHide} dialogClassName="bill-modal-dialog" backdrop="static" centered>
        <Modal.Body className="text-center py-5">
          <i className="fi fi-rr-exclamation text-danger fs-1"></i>
          <p className="mt-2 text-danger">{billError}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>Retry</Button>
        </Modal.Body>
      </Modal>
    )
  }

  if (!billData.length) {
    return (
      <Modal show={show} onHide={onHide} dialogClassName="bill-modal-dialog" backdrop="static" centered>
        <Modal.Body className="text-center py-5">
          <i className="fi fi-rr-info text-muted fs-1"></i>
          <p className="mt-2">No bill data found</p>
        </Modal.Body>
      </Modal>
    )
  }

  // ========== RENDER ==========
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

      <Modal show={show} onHide={onHide} dialogClassName="bill-modal-dialog" backdrop="static" centered>
        <Modal.Header closeButton className="py-2" style={{ background: headerBg, borderBottom: 'none' }}>
          <Modal.Title className="text-white fw-bold" style={{ fontSize: '0.85rem' }}>
            🧾 Hotel Booking Bill — {summary?.guest_name || 'Guest'}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="bill-modal-body p-0">
          <div className="bill-modal-action-bar no-print">
            <Button className="btn-bill-print" onClick={handlePrint}>🖨️ Print Bill</Button>
            <Button className="btn-bill-pdf" onClick={handleDownloadPDF} disabled={pdfLoading}>
              {pdfLoading ? (
                <><Spinner animation="border" size="sm" className="me-1" /> Generating PDF...</>
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