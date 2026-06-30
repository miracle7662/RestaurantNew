// components/CheckoutBillModal.tsx
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react'
import { Modal, Button, Spinner } from 'react-bootstrap'
import BillPrintSettingService, { BillPrintSetting } from '@/common/hotel/billPrintSettingService'
import CheckoutService from '@/common/hotel/checkout'

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
  room_group?: string
  transaction_type?: string
  // Backend calculated values
  post_charges?: number
  allowance?: number
  food?: number
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
  isFirstRow?: boolean
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
  roomNumbers?: Set<string>
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

const formatBillDate = (dateString: string): string => {
  if (!dateString) return '-'
  const d = new Date(dateString)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear().toString().slice(-2)
  return `${day}-${month}-${year}`
}

const formatDateTime = (isoString: string): string => {
  if (!isoString) return '-'
  const d = new Date(isoString)
  const day = d.getDate().toString().padStart(2, '0')
  const month = d.toLocaleString('default', { month: 'short' }).replace('.', '')
  const year = d.getFullYear()
  const hours = d.getHours().toString().padStart(2, '0')
  const minutes = d.getMinutes().toString().padStart(2, '0')
  return `${day}-${month}-${year} ${hours}:${minutes}`
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

  console.log('🔄 CheckoutBillModal Props:', {
    show,
    checkoutId,
    ldgBillNo,
    hotelId,
    selectedRooms,
    billDataLength: billData.length
  })

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

          console.log('📦 Raw Bill Data from API:', filteredData.map((r: any) => ({
            transaction_type: r.transaction_type,
            post_charges: r.post_charges,
            allowance: r.allowance,
            description: r.description,
            total_amount: r.total_amount,
            tariff: r.tariff,
            cgst: r.cgst,
            sgst: r.sgst,
            food: r.food
          })))
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

  // ========== BUILD DISPLAY ROWS - USING BACKEND CALCULATED VALUES ==========
  const displayRows = useMemo(() => {
    console.log('🏗️ Building displayRows from billData:', billData.length)
    
    if (!billData.length) {
      console.log('❌ No billData available')
      return []
    }

    const rows: DisplayDetailRow[] = []
    const cumulativeMap = new Map<string, number>()

    billData.forEach((row, index) => {
      const roomNumber = row.room_number || `Room-${row.room_id}`
      const transactionType = (row.transaction_type || '').toUpperCase().trim()
      
      // Use backend calculated values directly - NO MANUAL CALCULATIONS
      const roomTariff = toNumber(row.tariff || row.room_tariff_per_day || 0)
      const exPaxTotal = toNumber(row.ex_pax || row.ex_pax_total || 0)
      const cgstAmount = toNumber(row.cgst || row.cgst_amount || 0)
      const sgstAmount = toNumber(row.sgst || row.sgst_amount || 0)
      const igstAmount = toNumber(row.igst || row.igst_amount || 0)
      const cessAmount = toNumber(row.cess || row.cess_amount || 0)
      const serviceChargeAmount = toNumber(row.service_charge_amount || 0)
      const totalAmount = toNumber(row.total_amount || 0)
      const discountAmount = toNumber(row.discount_amount || 0)
      const discountPercent = toNumber(row.discount_percent || 0)
      
      // Determine if post charge from transaction_type (using backend classification)
      const isPostCharge = ['CHARGE', 'POST CHARGE', 'POST_CHARGE', 'ALLOWANCE', 'ADVANCE ADDITION', 'FOOD']
        .includes(transactionType)

      const prevCumulative = cumulativeMap.get(roomNumber) || 0
      const cumulativeTotal = roundToTwo(prevCumulative + totalAmount)
      cumulativeMap.set(roomNumber, cumulativeTotal)

      const billDateFormatted = row.bill_date 
        ? formatBillDate(row.bill_date) 
        : formatBillDate(row.checkin_datetime)

      rows.push({
        id: `row-${row.room_number || index}-${index}`,
        guest_room_charges_id: row.charge_id || row.folio_id || index,
        checkin_id: row.checkin_id || 0,
        guest_id: row.guest_id || 0,
        detail_id: row.detail_id,
        room_id: row.room_id || 0,
        room_number: roomNumber,
        room_category_name: row.room_category_name || '-',
        converted_category_name: row.converted_category_name || '-',
        bill_date: row.bill_date || row.checkin_datetime,
        bill_date_formatted: billDateFormatted,
        checkin_datetime: row.checkin_datetime,
        checkout_datetime: row.checkout_datetime,
        no_of_days: row.no_of_days || 1,
        day_number: 1,
        original_day_number: 1,
        room_tariff_per_day: roomTariff,
        total_room_tariff: roomTariff,
        ex_pax_count: 0,
        ex_pax_price: 0,
        ex_pax_tax: 0,
        ex_pax_tax_percent: 0,
        ex_pax_total: exPaxTotal,
        child_count: 0,
        child_unpaid: row.child_unpaid || 0,
        child_price: 0,
        child_tax: 0,
        child_tax_percent: 0,
        child_total: 0,
        driver_count: 0,
        driver_price: 0,
        driver_tax: 0,
        driver_tax_percent: 0,
        driver_total: 0,
        cgst_amount: cgstAmount,
        sgst_amount: sgstAmount,
        igst_amount: igstAmount,
        cess_amount: cessAmount,
        service_charge_amount: serviceChargeAmount,
        adults: row.adults || 0,
        pax: row.pax || 0,
        ex_pax: row.ex_pax || 0,
        child_paid: 0,
        driver: row.driver || 0,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        tax_percent: row.tax || 18,
        tax_amount: cgstAmount + sgstAmount + igstAmount, // Use backend calculated taxes
        total_amount: totalAmount,
        is_extension: transactionType === 'ROOM EXTENSION',
        isPostCharge: isPostCharge,
        parent_detail_id: null,
        selected: true,
        cumulative_total: cumulativeTotal,
        guest_name: row.guest_name,
        payment_method: row.payment_method || row.payment_mode || 'Cash',
        created_at: row.bill_date || row.checkin_datetime,
        has_checkout_datetime: !!row.checkout_datetime,
        checkout_time_formatted: row.checkout_datetime ? formatDateTime(row.checkout_datetime) : '-',
        description: row.description || 'Room Charges',
        particulars: row.particulars || '',
        department_name: transactionType,
        cgst_percent: row.cgst_percent,
        sgst_percent: row.sgst_percent,
        igst_percent: row.igst_percent,
        cess_percent: row.cess_percent,
        service_charge_percent: row.service_charge,
        room_group: roomNumber,
        transaction_type: transactionType,
        // Store backend calculated values
        post_charges: toNumber(row.post_charges || 0),
        allowance: toNumber(row.allowance || 0),
        food: toNumber(row.food || 0)
      })
    })

    console.log(`✅ Generated ${rows.length} display rows`)
    return rows
  }, [billData])

  

  // ========== BUILD SUMMARY - USING BACKEND VALUES ==========
  const summary = useMemo(() => {
    if (!billData.length || !displayRows.length) return null

    const firstRow = billData[0]
    const roomNumbers = Array.from(new Set(displayRows.map(r => r.room_number).filter(Boolean)))
    const roomCategories = Array.from(
      new Set(displayRows.map(r => r.room_category_name).filter(Boolean))
    )

    return {
      checkin_id: firstRow.checkin_id,
      guest_id: firstRow.guest_id,
      guest_name: firstRow.guest_name,
      room_numbers: roomNumbers,
      room_categories: roomCategories,
      converted_categories: [],
      room_numbers_str: roomNumbers.join(', ') || '-',
      room_categories_str: roomCategories.join(', ') || '-',
      converted_categories_str: '-',
      total_room_tariff: toNumber(firstRow.total_amount || 0),
      total_ex_pax_charge: toNumber(firstRow.ex_pax || 0),
      total_child_paid_amount: 0,
      total_driver_charge: 0,
      total_tax_amount: toNumber(firstRow.cgst_amt || 0) + toNumber(firstRow.sgst_amt || 0),
      total_amount: toNumber(firstRow.total_amount || 0),
      total_days: firstRow.total_nights || 0,
      total_adults: firstRow.adults || 0,
      total_pax: firstRow.pax || 0,
      total_ex_pax: firstRow.ex_pax || 0,
      total_child_paid: 0,
      total_child_unpaid: firstRow.child_unpaid || 0,
      total_driver: firstRow.driver || 0,
      avg_discount_percent: firstRow.discount_percent || 0,
      avg_tax_percent: firstRow.tax || 18,
      has_extensions: false,
      extension_count: 0,
      extension_days: 0,
      payment_methods: [firstRow.payment_mode || 'Cash'],
      payment_method: firstRow.payment_mode || 'Cash',
      charges_ids: [],
      selected: true,
      original_checkin_datetime: firstRow.checkin_datetime,
      final_checkout_datetime: firstRow.checkout_datetime,
      guest_mobile: firstRow.mobile,
      guest_address: firstRow.guest_address,
      guest_email: firstRow.emailed,
      guest_id_proof: '-',
      reg_no: firstRow.reg_no,
      booking_ref: firstRow.booking,
      plan_name: firstRow.plan_name,
      checked_out_rooms: firstRow.checked_out_rooms ? firstRow.checked_out_rooms.split(',') : [],
    }
  }, [displayRows, billData])

 // ========== GENERATE TABLE ROWS - USING BACKEND CALCULATED VALUES ==========
const tableRows = useMemo(() => {
  console.log('🔨 Building tableRows...')
  if (!displayRows.length) return []

  // Group by room first, then by date
  const roomGroups = new Map<string, Map<string, GroupedChargeItem>>()
  const seen = new Set<string | number>()   // ⬅️ DEDUPLICATION SET

  displayRows.forEach((charge) => {
    // ---------------------- DEDUPLICATION CHECK ----------------------
    const uniqueKey = charge.guest_room_charges_id ||
                      `${charge.room_number}|${charge.bill_date_formatted}|${charge.transaction_type}|${charge.total_amount}`
    if (seen.has(uniqueKey)) {
      console.warn('⚠️ Duplicate charge skipped:', uniqueKey, charge)
      return
    }
    seen.add(uniqueKey)
    // ---------------------- END OF DEDUPLICATION ----------------------

    const roomNum = charge.room_number || 'COMMON'
    const dateKey = charge.bill_date_formatted || formatDate(charge.bill_date)
    
    if (!roomGroups.has(roomNum)) {
      roomGroups.set(roomNum, new Map())
    }
    
    const dateMap = roomGroups.get(roomNum)!
    if (!dateMap.has(dateKey)) {
      dateMap.set(dateKey, {
        date: dateKey,
        roomChargeAmount: 0,
        exPaxAmount: 0,
        postCharges: [],
        allowances: [],
        advances: [],
        foodCharges: [],
        cgstAmount: 0,
        sgstAmount: 0,
        roomNumbers: new Set([roomNum]),
      })
    }
    
    const item = dateMap.get(dateKey)!
    const type = charge.transaction_type
    
    if (!charge.isPostCharge) {
      // Room charges - use backend values
      item.roomChargeAmount += charge.room_tariff_per_day || 0
      item.exPaxAmount += charge.ex_pax_total || 0
      item.cgstAmount += charge.cgst_amount || 0
      item.sgstAmount += charge.sgst_amount || 0
    } else if (type === 'FOOD') {
      const amount = Math.abs(charge.total_amount || 0)
      item.foodCharges.push({
        description: charge.description || 'Food',
        amount,
        id: charge.id,
      })
    } else if (type === 'ADVANCE ADDITION') {
      const amount = Math.abs(charge.total_amount || 0)
      item.advances.push({
        description: charge.description || 'Advance',
        amount,
        id: charge.id,
      })
    } else if (type === 'ALLOWANCE') {
      const amount = Math.abs(charge.total_amount || 0)
      item.allowances.push({
        description: charge.description || 'Allowance',
        amount,
        id: charge.id,
      })
    } else if (type === 'CHARGE' || type === 'POST CHARGE' || type === 'POST_CHARGE') {
      const amount = Math.abs(charge.total_amount || 0)
      item.postCharges.push({
        description: charge.description || 'Post Charge',
        amount,
        id: charge.id,
      })
    }
  })

  // Build rows
  const rows: TableRowWithIndex[] = []
  let index = 1
  
  const sortedRooms = Array.from(roomGroups.keys()).sort((a, b) => {
    if (a === 'COMMON') return 1
    if (b === 'COMMON') return -1
    const numA = parseInt(a)
    const numB = parseInt(b)
    if (!isNaN(numA) && !isNaN(numB)) {
      return numA - numB
    }
    return a.localeCompare(b)
  })
  
  for (const room of sortedRooms) {
    const dateMap = roomGroups.get(room)!
    const sortedDates = Array.from(dateMap.keys()).sort((a, b) => {
      const dateA = a.split('/').reverse().join('-')
      const dateB = b.split('/').reverse().join('-')
      return new Date(dateA).getTime() - new Date(dateB).getTime()
    })
    
    let isFirstRow = true
    for (const date of sortedDates) {
      const item = dateMap.get(date)!
      
      const postTotal = item.postCharges.reduce((sum, p) => sum + p.amount, 0)
      const foodTotal = item.foodCharges.reduce((sum, f) => sum + f.amount, 0)
      const allowanceTotal = item.allowances.reduce((sum, a) => sum + a.amount, 0)
      const advanceTotal = item.advances.reduce((sum, a) => sum + a.amount, 0)
      
      const total = item.roomChargeAmount + item.exPaxAmount + foodTotal + postTotal - allowanceTotal - advanceTotal
      
      rows.push({
        id: `row-${room}-${date}`,
        displayIndex: index++,
        roomNumber: room,
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
        postAllowNet: postTotal - allowanceTotal - advanceTotal,
        postCharges: item.postCharges,
        allowances: item.allowances,
        advances: item.advances,
        foodCharges: item.foodCharges,
        sacCode: '996311',
        isFirstRow: isFirstRow,
      })
      isFirstRow = false
    }
  }

  console.log(`✅ Generated ${rows.length} table rows`)
  return rows
}, [displayRows])

  // ========== CALCULATE TOTALS - USING BACKEND VALUES ==========
  const totals = useMemo(() => {
    const firstRow = billData[0] || {}
    const footerSummary = billData[0] || {}
    
    // Use backend calculated values from footer summary
    return {
      totalRoomTariffAmount: roundToTwo(
        tableRows.reduce((sum, row) => sum + row.roomTariff, 0)
      ),
      totalExPaxAmount: roundToTwo(
        tableRows.reduce((sum, row) => sum + row.exPax, 0)
      ),
      totalCgstAmount: roundToTwo(
        firstRow.cgst_amt || // Use backend CGST
        tableRows.reduce((sum, row) => sum + row.cgst, 0)
      ),
      totalSgstAmount: roundToTwo(
        firstRow.sgst_amt || // Use backend SGST
        tableRows.reduce((sum, row) => sum + row.sgst, 0)
      ),
      totalFoodAmount: roundToTwo(
        firstRow.food_total || // Use backend food total
        tableRows.reduce((sum, row) => sum + row.food, 0)
      ),
      totalAdvanceAmount: roundToTwo(
        firstRow.advance_amt || // Use backend advance amount
        firstRow.advance_amount_total ||
        tableRows.reduce((sum, row) => sum + row.advanceTotal, 0)
      ),
      totalPostAmount: roundToTwo(
        firstRow.post_changes_amt || // Use backend post charges
        firstRow.post_charges_total ||
        tableRows.reduce((sum, row) => sum + row.postTotal, 0)
      ),
      totalAllowanceAmount: roundToTwo(
        firstRow.allowances_amt || // Use backend allowances
        firstRow.allowance_total ||
        tableRows.reduce((sum, row) => sum + row.allowanceTotal, 0)
      ),
      totalAmount: roundToTwo(
        firstRow.total_amount || // Use backend total amount
        tableRows.reduce((sum, row) => sum + row.total, 0)
      ),
      netTotal: roundToTwo(
        firstRow.net_payable || // Use backend net payable
        firstRow.bill_amount ||
        0
      ),
    }
  }, [tableRows, billData])

  // ========== DISPLAY VALUES ==========
  const displayCheckedOutRooms = summary?.checked_out_rooms || summary?.room_numbers || []
  const checkedOutRoomsStr = displayCheckedOutRooms.join(', ') || summary?.room_numbers_str || ''
  const checkinDateDisplay = summary?.original_checkin_datetime
    ? formatDateLong(summary.original_checkin_datetime)
    : '-'
  const checkoutDateDisplay = summary?.final_checkout_datetime
    ? formatDateLong(summary.final_checkout_datetime)
    : '-'
 
  const invoiceDate = formatDate(new Date().toISOString())
  const generatedBillNo = propBillNumber ||
    billData[0]?.ldg_bill_no ||
    `INV/${new Date().getFullYear()}/${String(summary?.checkin_id || '0').padStart(4, '0')}`
  const bookingId = summary?.reg_no || `BKD${summary?.checkin_id || '0000'}`
  const paymentMode = summary?.payment_method || 'Credit Card'

  const headerBg = printSettings?.table_header_bg_color || '#1a2744'
  const headerText = printSettings?.table_header_text_color || '#ffffff'

  const showTopHeaderSection = printSettings?.show_top_header_section !== 0
  const topMarginWhenHeaderHidden = printSettings?.top_margin_when_header_hidden || 30

  const getFontSize = useCallback(() => {
    switch (printSettings?.table_font_size) {
      case 'small':
        return '7pt'
      case 'large':
        return '9pt'
      default:
        return '8pt'
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
    .bill-wrap .col-srno { width: 30px; }
    .bill-wrap .col-room { width: 45px; }
    .bill-wrap .col-date { width: 70px; }
    .bill-wrap .col-amount { width: 65px; }
    .bill-wrap .col-small { width: 55px; }
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
      font-size: ${fontSize};
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
  }, [headerBg, headerText, getFontSize])

  // ========== HANDLE PRINT ==========
  const handlePrint = useCallback(() => {
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
  }, [summary, printSettings, showTopHeaderSection, getBillStyles])

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
      const spacerPx = Math.round((topMarginWhenHeaderHidden || 20) * 3.7795)
      return (
        <div
          style={{ height: `${spacerPx}px`, width: '100%' }}
          aria-hidden="true"
          data-role="header-spacer"
        />
      )
    }

    const firstRow = billData[0]
    const nameAlign = printSettings?.hotel_name_position || 'center'
    const addressAlign = printSettings?.hotel_address_position || 'left'
    const contactAlign = printSettings?.hotel_contact_position || 'left'
    const logoPosition = printSettings?.hotel_logo_position || 'left'

    const logoEl =
      printSettings?.show_hotel_logo === 1 && firstRow?.Logo ? (
        <img src={firstRow.Logo} alt="Hotel Logo" className="bill-hotel-logo" />
      ) : null

    return (
      <div className="mb-2">
        {logoEl && <div className={`text-${logoPosition} mb-1`}>{logoEl}</div>}
        {printSettings?.show_hotel_name === 1 && (
          <div
            className={`text-${nameAlign}`}
            style={{ fontSize: '16pt', fontWeight: 800, color: headerBg }}
          >
            {firstRow?.hotel_name || 'GRAND VIEW HOTEL'}
          </div>
        )}
        {printSettings?.show_hotel_address === 1 && (
          <div className={`text-${addressAlign} mt-1`} style={{ fontSize: '7.5pt', color: '#666' }}>
            📍 {firstRow?.hotel_address || '123, Park Avenue, City Center, New Delhi - 110001'}
          </div>
        )}
        {printSettings?.show_hotel_contact === 1 && (
          <div className={`text-${contactAlign} mt-1`} style={{ fontSize: '7pt', color: '#666' }}>
            📞 {firstRow?.hotel_phone || '+91 11 4567 8900'} &nbsp;|&nbsp; ✉ {firstRow?.hotel_email || 'info@grandviewhotel.com'} &nbsp;|&nbsp; 🌐 {firstRow?.website || 'www.grandviewhotel.com'}
          </div>
        )}
        <hr className="bill-divider" />
      </div>
    )
  }, [billData, printSettings, showTopHeaderSection, topMarginWhenHeaderHidden, headerBg])

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
          HOTEL BOOKING BILL
        </h3>
      </div>
    )
  }, [printSettings, headerBg])

  const renderGuestDetails = useCallback(() => {
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
  }, [printSettings, summary])

  const renderBookingDetails = useCallback(() => {
    if (printSettings?.show_booking_details !== 1) return null
    
    const invoiceNo = propBillNumber || billData[0]?.ldg_bill_no || generatedBillNo
    const invoiceDateDisplay = propPaymentDate || invoiceDate
    const bookingIdDisplay = summary?.reg_no || `BKD${summary?.checkin_id || '0000'}`
    const roomTypeDisplay = summary?.room_categories_str || '-'
    const roomNumbersDisplay = checkedOutRoomsStr || summary?.room_numbers_str || '-'
    const nightsDisplay = summary?.total_days || 0
    const tariffPlanDisplay = summary?.plan_name || 'Room Only'
    const guestsDisplay = `${summary?.total_adults || 0} Adults${(summary?.total_child_paid || 0) > 0 ? `, ${summary?.total_child_paid} Child` : ''}${(summary?.total_driver || 0) > 0 ? `, ${summary?.total_driver} Driver` : ''}`

    return (
      <div className="bill-info-box">
        <div className="bill-info-box-header">BOOKING & INVOICE DETAILS</div>
        <div className="bill-info-box-body">
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '4px 20px',
            fontSize: '7.5pt'
          }}>
            <div>
              <div style={{ display: 'flex', padding: '3px 0' }}>
                <span style={{ fontWeight: 600, minWidth: '85px' }}>Invoice No.</span>
                <span style={{ margin: '0 4px' }}>:</span>
                <span style={{ fontWeight: 700, color: headerBg }}>{invoiceNo}</span>
              </div>
              <div style={{ display: 'flex', padding: '3px 0' }}>
                <span style={{ fontWeight: 600, minWidth: '85px' }}>Booking ID</span>
                <span style={{ margin: '0 4px' }}>:</span>
                <span style={{ fontWeight: 600 }}>{bookingIdDisplay}</span>
              </div>
              <div style={{ display: 'flex', padding: '3px 0' }}>
                <span style={{ fontWeight: 600, minWidth: '85px' }}>Arrival Date</span>
                <span style={{ margin: '0 4px' }}>:</span>
                <span>{checkinDateDisplay}</span>
              </div>
              <div style={{ display: 'flex', padding: '3px 0' }}>
                <span style={{ fontWeight: 600, minWidth: '85px' }}>Check-out Date</span>
                <span style={{ margin: '0 4px' }}>:</span>
                <span>{checkoutDateDisplay}</span>
              </div>
              <div style={{ display: 'flex', padding: '3px 0' }}>
                <span style={{ fontWeight: 600, minWidth: '85px' }}>Room No(s).</span>
                <span style={{ margin: '0 4px' }}>:</span>
                <span>{roomNumbersDisplay}</span>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', padding: '3px 0' }}>
                <span style={{ fontWeight: 600, minWidth: '85px' }}>Invoice Date</span>
                <span style={{ margin: '0 4px' }}>:</span>
                <span>{invoiceDateDisplay}</span>
              </div>
              <div style={{ display: 'flex', padding: '3px 0' }}>
                <span style={{ fontWeight: 600, minWidth: '85px' }}>Room Type</span>
                <span style={{ margin: '0 4px' }}>:</span>
                <span style={{ fontWeight: 600 }}>{roomTypeDisplay}</span>
              </div>
              <div style={{ display: 'flex', padding: '3px 0' }}>
                <span style={{ fontWeight: 600, minWidth: '85px' }}>No. of Nights</span>
                <span style={{ margin: '0 4px' }}>:</span>
                <span>{nightsDisplay}</span>
              </div>
              <div style={{ display: 'flex', padding: '3px 0' }}>
                <span style={{ fontWeight: 600, minWidth: '85px' }}>Guests / Plan</span>
                <span style={{ margin: '0 4px' }}>:</span>
                <span>{guestsDisplay} {tariffPlanDisplay ? `(${tariffPlanDisplay})` : ''}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }, [printSettings, checkinDateDisplay, checkoutDateDisplay, checkedOutRoomsStr, summary, headerBg, propBillNumber, billData, generatedBillNo, propPaymentDate, invoiceDate])

 const renderChargesTable = useCallback(() => {
  console.log('🎯 Rendering Charges Table, tableRows:', tableRows.length)
  
  if (tableRows.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
        No charges to display.
      </div>
    )
  }

  const showRowNums = printSettings?.show_row_numbers === 1

  const headers: React.ReactElement[] = []
  if (showRowNums) headers.push(<th key="srno" className="col-srno bct-center">#</th>)
  headers.push(<th key="room" className="col-room bct-left">ROOM</th>)
  headers.push(<th key="date" className="col-date bct-left">DATE</th>)
  headers.push(<th key="tariff" className="col-amount bct-right">TARIFF</th>)
  headers.push(<th key="expax" className="col-amount bct-right">EX.PAX</th>)
  headers.push(<th key="cgst" className="col-amount bct-right">CGST</th>)
  headers.push(<th key="sgst" className="col-amount bct-right">SGST</th>)
  headers.push(<th key="food" className="col-amount bct-right">FOOD</th>)
  headers.push(<th key="post" className="col-amount bct-right">POST</th>)
  headers.push(<th key="advance" className="col-amount bct-right">ADVANCE</th>)
  headers.push(<th key="allowance" className="col-amount bct-right">ALLOWANCE</th>)
  headers.push(<th key="total" className="col-amount bct-right">TOTAL</th>)

  const totalCols = headers.length

  const bodyRows: React.ReactElement[] = []
  let runningIndex = 1

  tableRows.forEach((row) => {
    const mainIndex = runningIndex++
    
    const cells: React.ReactElement[] = []
    if (showRowNums) cells.push(<td key="srno" className="bct-center">{mainIndex}</td>)
    cells.push(
      <td key="room" className="bct-left" style={{ fontWeight: row.isFirstRow ? 'bold' : 'normal' }}>
        {row.roomNumber || 'N/A'}
      </td>
    )
    cells.push(<td key="date" className="bct-left">{row.date || 'N/A'}</td>)
    cells.push(<td key="tariff" className="bct-right">{formatAmtDisplay(row.roomTariff || 0)}</td>)
    cells.push(<td key="expax" className="bct-right">{formatAmtDisplay(row.exPax || 0)}</td>)
    cells.push(<td key="cgst" className="bct-right">{formatAmtDisplay(row.cgst || 0)}</td>)
    cells.push(<td key="sgst" className="bct-right">{formatAmtDisplay(row.sgst || 0)}</td>)
    cells.push(<td key="food" className="bct-right">{row.food > 0 ? formatAmtDisplay(row.food) : '-'}</td>)
    cells.push(<td key="post" className="bct-right">{row.postTotal > 0 ? formatAmtDisplay(row.postTotal) : '-'}</td>)
    cells.push(<td key="advance" className="bct-right" style={{ color: row.advanceTotal > 0 ? '#c0392b' : 'inherit' }}>
      {row.advanceTotal > 0 ? formatAmtDisplay(row.advanceTotal) : '-'}
    </td>)
    cells.push(<td key="allowance" className="bct-right" style={{ color: row.allowanceTotal > 0 ? '#c0392b' : 'inherit' }}>
      {row.allowanceTotal > 0 ? formatAmtDisplay(row.allowanceTotal) : '-'}
    </td>)
    cells.push(
      <td key="total" className="bct-right" style={{ fontWeight: 600 }}>
        {formatAmtDisplay(row.total || 0)}
      </td>
    )
    bodyRows.push(<tr key={row.id}>{cells}</tr>)
  })

  // FIX: Calculate totals from tableRows instead of using totals object
  const totalTariff = tableRows.reduce((sum, row) => sum + row.roomTariff, 0)
  const totalExPax = tableRows.reduce((sum, row) => sum + row.exPax, 0)
  const totalCgst = tableRows.reduce((sum, row) => sum + row.cgst, 0)
  const totalSgst = tableRows.reduce((sum, row) => sum + row.sgst, 0)
  const totalFood = tableRows.reduce((sum, row) => sum + row.food, 0)
  const totalPost = tableRows.reduce((sum, row) => sum + row.postTotal, 0)
  const totalAdvance = tableRows.reduce((sum, row) => sum + row.advanceTotal, 0)
  const totalAllowance = tableRows.reduce((sum, row) => sum + row.allowanceTotal, 0)
  const totalAmount = tableRows.reduce((sum, row) => sum + row.total, 0)

  // Footer row - using calculated values
  const footerCells: React.ReactElement[] = []
  const labelColSpan = showRowNums ? 3 : 2
  
  footerCells.push(
    <td key="total_label" colSpan={labelColSpan} className="bct-right" style={{ fontWeight: 700 }}>
      Total
    </td>
  )
  footerCells.push(
    <td key="total_tariff" className="bct-right" style={{ fontWeight: 700 }}>
      {formatAmtDisplay(totalTariff)}
    </td>
  )
  footerCells.push(
    <td key="total_expax" className="bct-right" style={{ fontWeight: 700 }}>
      {formatAmtDisplay(totalExPax)}
    </td>
  )
  footerCells.push(
    <td key="total_cgst" className="bct-right" style={{ fontWeight: 700 }}>
      {formatAmtDisplay(totalCgst)}
    </td>
  )
  footerCells.push(
    <td key="total_sgst" className="bct-right" style={{ fontWeight: 700 }}>
      {formatAmtDisplay(totalSgst)}
    </td>
  )
  footerCells.push(
    <td key="total_food" className="bct-right" style={{ fontWeight: 700 }}>
      {totalFood > 0 ? formatAmtDisplay(totalFood) : '-'}
    </td>
  )
  footerCells.push(
    <td key="total_post" className="bct-right" style={{ fontWeight: 700 }}>
      {totalPost > 0 ? formatAmtDisplay(totalPost) : '-'}
    </td>
  )
  footerCells.push(
    <td key="total_advance" className="bct-right" style={{ fontWeight: 700, color: '#c0392b' }}>
      {totalAdvance > 0 ? formatAmtDisplay(totalAdvance) : '-'}
    </td>
  )
  footerCells.push(
    <td key="total_allowance" className="bct-right" style={{ fontWeight: 700, color: '#c0392b' }}>
      {totalAllowance > 0 ? formatAmtDisplay(totalAllowance) : '-'}
    </td>
  )
  footerCells.push(
    <td key="total_amount" className="bct-right" style={{ fontWeight: 800, background: '#f0f0f0' }}>
      {formatAmtDisplay(totalAmount)}
    </td>
  )

  // Grand Total row - using calculated totalAmount
  const summaryRows: React.ReactElement[] = []

  summaryRows.push(
    <tr key="summary_grand_total" style={{ background: headerBg, color: headerText }}>
      <td colSpan={totalCols - 1} className="bct-right" style={{ fontWeight: 800, fontSize: '9pt' }}>
        TOTAL PAID (INR)
      </td>
      <td className="bct-right" style={{ fontWeight: 800, fontSize: '9pt' }}>
        ₹{formatAmt(totalAmount)}
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
}, [printSettings, tableRows, headerBg, headerText])

  const renderHorizontalSummary = useCallback(() => null, [])

  const renderAmountInWords = useCallback(() => {
    return (
      <div className="bill-amount-words">
        <span className="baw-label">Amount in Words: </span>
        <span className="baw-text">{numberToWords(totals.netTotal)}</span>
      </div>
    )
  }, [totals.netTotal])

  const renderPaymentDetails = useCallback(() => {
    const paymentTxnId = propPaymentTransactionId || 
      billData[0]?.reference_number || 
      `TXN${Date.now().toString().slice(-12)}`
    
    const paymentDateDisplay = propPaymentDate || invoiceDate
    const paymentBankDisplay = propPaymentBank || paymentMode

    return (
      <div className="bill-info-box">
        <div className="bill-info-box-header">PAYMENT DETAILS</div>
        <div className="bill-info-box-body">
          <table className="bill-detail-table">
            <tbody>
              <tr>
                <td className="bdt-label">Paid Amount</td>
                <td className="bdt-colon">:</td>
                <td className="bdt-value">INR {formatAmt(totals.netTotal)}</td>
              </tr>
              <tr>
                <td className="bdt-label">Transaction ID</td>
                <td className="bdt-colon">:</td>
                <td className="bdt-value">{paymentTxnId}</td>
              </tr>
              <tr>
                <td className="bdt-label">Payment Date</td>
                <td className="bdt-colon">:</td>
                <td className="bdt-value">{paymentDateDisplay}</td>
              </tr>
              <tr>
                <td className="bdt-label">Bank / Card</td>
                <td className="bdt-colon">:</td>
                <td className="bdt-value">{paymentBankDisplay}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }, [propPaymentTransactionId, billData, propPaymentDate, invoiceDate, propPaymentBank, paymentMode, totals.netTotal])

 const renderSummaryBox = useCallback(() => {
  const firstRow = billData[0] || {}
  const discountAmount = toNumber(firstRow.discount_amount || 0)
  const grossTotal = toNumber(firstRow.total_amount || 0)
  const netTotal = roundToTwo(grossTotal - discountAmount) // Total after discount
  const advanceTotal = toNumber(firstRow.advance_amt || 0)
  const finalAmount = roundToTwo(netTotal - advanceTotal) // Net - Advance

  return (
    <div className="bill-info-box">
      <div className="bill-info-box-header">BILL SUMMARY</div>
      <div className="bill-info-box-body">
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse',
          fontSize: '8pt'
        }}>
          <tbody>
            <tr>
              <td style={{ 
                padding: '4px 8px', 
                fontWeight: 700,
                borderBottom: '1px solid #e0e0e0'
              }}>
                TOTAL AMOUNT
              </td>
              <td style={{ 
                padding: '4px 8px', 
                textAlign: 'right',
                fontWeight: 700,
                borderBottom: '1px solid #e0e0e0'
              }}>
                ₹{formatAmt(grossTotal)}
              </td>
            </tr>
            {discountAmount > 0 && (
              <tr>
                <td style={{ 
                  padding: '4px 8px', 
                  color: '#c0392b',
                  fontWeight: 600,
                  borderBottom: '1px solid #e0e0e0'
                }}>
                  Discount
                </td>
                <td style={{ 
                  padding: '4px 8px', 
                  textAlign: 'right',
                  color: '#c0392b',
                  fontWeight: 600,
                  borderBottom: '1px solid #e0e0e0'
                }}>
                  -₹{formatAmt(discountAmount)}
                </td>
              </tr>
            )}
            <tr>
              <td style={{ 
                padding: '4px 8px', 
                fontWeight: 700,
                borderBottom: '1px solid #e0e0e0'
              }}>
                NET TOTAL
              </td>
              <td style={{ 
                padding: '4px 8px', 
                textAlign: 'right',
                fontWeight: 700,
                borderBottom: '1px solid #e0e0e0'
              }}>
                ₹{formatAmt(netTotal)}
              </td>
            </tr>
            {advanceTotal > 0 && (
              <tr>
                <td style={{ 
                  padding: '4px 8px', 
                  color: '#e67e22',
                  fontWeight: 600,
                  borderBottom: '1px solid #e0e0e0'
                }}>
                  Advance
                </td>
                <td style={{ 
                  padding: '4px 8px', 
                  textAlign: 'right',
                  color: '#e67e22',
                  fontWeight: 600,
                  borderBottom: '1px solid #e0e0e0'
                }}>
                  -₹{formatAmt(advanceTotal)}
                </td>
              </tr>
            )}
            {advanceTotal > 0 && (
              <tr>
                <td style={{ 
                  padding: '4px 8px', 
                  fontWeight: 800,
                  fontSize: '9pt',
                  color: headerBg
                }}>
                  BALANCE AMOUNT
                </td>
                <td style={{ 
                  padding: '4px 8px', 
                  textAlign: 'right',
                  fontWeight: 800,
                  fontSize: '9pt',
                  color: headerBg
                }}>
                  ₹{formatAmt(finalAmount)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}, [billData, headerBg])

  const renderFooter = useCallback(() => {
    const firstRow = billData[0]
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
          {printSettings?.show_gst_details === 1 && <div>GSTIN: {firstRow?.trn_gstno || '07AABCG1234F1Z5'}</div>}
          {printSettings?.show_company_pan === 1 && <div>PAN: {firstRow?.panno || 'AABCG1234F'}</div>}
          {printSettings?.show_fssai === 1 && <div>FSSAI: {firstRow?.fssai_no || '12345678901234'}</div>}
        </div>
        {printSettings?.custom_footer_text && (
          <div className="mt-1" style={{ fontSize: '7pt', color: '#999' }}>
            {printSettings.custom_footer_text}
          </div>
        )}
      </div>
    )
  }, [billData, printSettings])

  const renderLayout = useCallback(() => {
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
            {renderChargesTable()}
            {renderHorizontalSummary()}
            <div className="two-column-layout">
              {renderPaymentDetails()}
              {renderSummaryBox()}
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
            {renderChargesTable()}
            {renderHorizontalSummary()}
            <div className="two-column-layout">
              {renderPaymentDetails()}
              {renderSummaryBox()}
            </div>
          </>
        )}
        {renderFooter()}
      </div>
    )
  }, [
    printSettings,
    renderHotelHeader,
    renderBillTitle,
    renderGuestDetails,
    renderBookingDetails,
    renderChargesTable,
    renderHorizontalSummary,
    renderPaymentDetails,
    renderSummaryBox,
    renderFooter,
  ])

  // ========== LOADING/ERROR STATES ==========
  if (settingsLoading || billLoading) {
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
          <p className="mt-2">{billLoading ? 'Loading bill data...' : 'Loading settings...'}</p>
        </Modal.Body>
      </Modal>
    )
  }

  if (billError) {
    return (
      <Modal
        show={show}
        onHide={onHide}
        dialogClassName="bill-modal-dialog"
        backdrop="static"
        centered
      >
        <Modal.Body className="text-center py-5">
          <i className="fi fi-rr-exclamation text-danger fs-1"></i>
          <p className="mt-2 text-danger">{billError}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </Modal.Body>
      </Modal>
    )
  }

  if (!billData.length) {
    return (
      <Modal
        show={show}
        onHide={onHide}
        dialogClassName="bill-modal-dialog"
        backdrop="static"
        centered
      >
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