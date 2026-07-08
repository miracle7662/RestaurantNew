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

  // ========== BUILD DISPLAY ROWS ==========
  const displayRows = useMemo(() => {
    if (!billData.length) {
      return []
    }

    const rows: DisplayDetailRow[] = []
    const cumulativeMap = new Map<string, number>()

    billData.forEach((row, index) => {
      const roomNumber = row.room_number || `Room-${row.room_id}`
      const transactionType = (row.transaction_type || '').toUpperCase().trim()
      
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
        tax_amount: cgstAmount + sgstAmount + igstAmount,
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
        post_charges: toNumber(row.post_charges || 0),
        allowance: toNumber(row.allowance || 0),
        food: toNumber(row.food || 0)
      })
    })

    return rows
  }, [billData])
// ========== BUILD SUMMARY ==========
const summary = useMemo(() => {
  if (!billData.length || !displayRows.length) return null

  // Get unique room numbers and categories from ALL rows
  const roomNumbers = Array.from(new Set(displayRows.map(r => r.room_number).filter(Boolean)))
  const roomCategories = Array.from(
    new Set(displayRows.map(r => r.room_category_name).filter(Boolean))
  )

  // Aggregate totals across ALL rows
  const totalRoomTariff = displayRows.reduce((sum, row) => sum + (row.room_tariff_per_day || 0), 0)
  const totalExPax = displayRows.reduce((sum, row) => sum + (row.ex_pax_total || 0), 0)
  const totalAmount = displayRows.reduce((sum, row) => sum + (row.total_amount || 0), 0)
  const totalDiscount = displayRows.reduce((sum, row) => sum + (row.discount_amount || 0), 0)
  const totalCgst = displayRows.reduce((sum, row) => sum + (row.cgst_amount || 0), 0)
  const totalSgst = displayRows.reduce((sum, row) => sum + (row.sgst_amount || 0), 0)
  
  // Aggregate guest counts across ALL rows
  // Use ex_pax for adults count (since this is the main adult count in your data)
  const totalExPaxCount = displayRows.reduce((sum, row) => sum + (row.ex_pax || 0), 0)
  const totalAdults = displayRows.reduce((sum, row) => sum + (row.adults || 0), 0)
  const totalPax = displayRows.reduce((sum, row) => sum + (row.pax || 0), 0)
  
  // CHILD counts - use child_unpaid or child_count
  const totalChildUnpaid = displayRows.reduce((sum, row) => sum + (row.child_unpaid || 0), 0)
  const totalChildCount = displayRows.reduce((sum, row) => sum + (row.child_count || 0), 0)
  const totalChildPaid = displayRows.reduce((sum, row) => sum + (row.child_paid || 0), 0)
  
  // DRIVER counts
  const totalDriver = displayRows.reduce((sum, row) => sum + (row.driver || 0), 0)
  const totalDriverCount = displayRows.reduce((sum, row) => sum + (row.driver_count || 0), 0)

  // Get first row for shared data (guest name, checkin, checkout, etc.)
  const firstRow = billData[0]

  // Determine which child count to use (prefer child_unpaid as it's shown in your data)
  const totalChild = totalChildUnpaid > 0 ? totalChildUnpaid : totalChildCount

  // Use ex_pax for adults as it's the main adult count in your data
  // If ex_pax is 0, fallback to adults or pax
  let totalAdultCount = totalExPaxCount > 0 ? totalExPaxCount : totalAdults
  if (totalAdultCount === 0) totalAdultCount = totalPax

  // Build guest display string with totals from ALL rooms
  const guestsDisplayParts = []
  if (totalAdultCount > 0) guestsDisplayParts.push(`${totalAdultCount} Adults`)
  if (totalChild > 0) guestsDisplayParts.push(`${totalChild} Child`)
  if (totalDriver > 0 || totalDriverCount > 0) {
    const driverTotal = totalDriver > 0 ? totalDriver : totalDriverCount
    guestsDisplayParts.push(`${driverTotal} Driver`)
  }
  const guestsDisplay = guestsDisplayParts.join(', ') || '-'

  // Build room numbers string from ALL rooms
  const roomNumbersStr = roomNumbers.join(', ') || '-'

  return {
    checkin_id: firstRow.checkin_id,
    guest_id: firstRow.guest_id,
    guest_name: firstRow.guest_name || firstRow.guestName || 'Guest',
    guest_mobile: firstRow.guest_mobile || firstRow.mobile || '-',
    guest_email: firstRow.guest_email || firstRow.emailed || '-',
    guest_address: firstRow.guest_address || firstRow.address || '-',
    room_numbers: roomNumbers,
    room_categories: roomCategories,
    converted_categories: [],
    room_numbers_str: roomNumbersStr,
    room_categories_str: roomCategories.join(', ') || '-',
    converted_categories_str: '-',
    total_room_tariff: totalRoomTariff,
    total_ex_pax_charge: totalExPax,
    total_child_paid_amount: totalChildPaid,
    total_child_unpaid_amount: totalChildUnpaid,
    total_driver_charge: 0,
    total_tax_amount: totalCgst + totalSgst,
    total_amount: totalAmount,
    total_days: firstRow.total_nights || 0,
    total_adults: totalAdultCount,
    total_pax: totalPax,
    total_ex_pax: totalExPaxCount,
    total_child_paid: totalChildPaid,
    total_child_unpaid: totalChildUnpaid,
    total_child: totalChild,
    total_driver: totalDriver > 0 ? totalDriver : totalDriverCount,
    avg_discount_percent: displayRows.reduce((sum, row) => sum + (row.discount_percent || 0), 0) / (displayRows.length || 1),
    avg_tax_percent: firstRow.tax || 18,
    has_extensions: false,
    extension_count: 0,
    extension_days: 0,
    payment_methods: Array.from(new Set(displayRows.map(r => r.payment_method).filter(Boolean))),
    payment_method: displayRows.find(r => r.payment_method)?.payment_method || 'Cash',
    charges_ids: [],
    selected: true,
    original_checkin_datetime: firstRow.checkin_datetime,
    final_checkout_datetime: firstRow.checkout_datetime,
    guest_id_proof: '-',
    reg_no: firstRow.reg_no,
    booking_ref: firstRow.booking,
    plan_name: firstRow.plan_name,
    checked_out_rooms: firstRow.checked_out_rooms ? firstRow.checked_out_rooms.split(',') : [],
    company_name: firstRow.company_name || '-',
    gst_no: firstRow.gst_no || '-',
    guests_display: guestsDisplay,
  }
}, [displayRows, billData])

  // ========== GENERATE TABLE ROWS ==========
  const tableRows = useMemo(() => {
    if (!displayRows.length) return []

    const roomGroups = new Map<string, Map<string, GroupedChargeItem>>()
    
    displayRows.forEach((charge) => {
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

    return rows
  }, [displayRows])

  // ========== CALCULATE TOTALS ==========
  const totals = useMemo(() => {
    const firstRow = billData[0] || {}
    
    return {
      totalRoomTariffAmount: roundToTwo(
        tableRows.reduce((sum, row) => sum + row.roomTariff, 0)
      ),
      totalExPaxAmount: roundToTwo(
        tableRows.reduce((sum, row) => sum + row.exPax, 0)
      ),
      totalCgstAmount: roundToTwo(
        firstRow.cgst_amt ||
        tableRows.reduce((sum, row) => sum + row.cgst, 0)
      ),
      totalSgstAmount: roundToTwo(
        firstRow.sgst_amt ||
        tableRows.reduce((sum, row) => sum + row.sgst, 0)
      ),
      totalFoodAmount: roundToTwo(
        firstRow.food_total ||
        tableRows.reduce((sum, row) => sum + row.food, 0)
      ),
      totalAdvanceAmount: roundToTwo(
        firstRow.advance_amt ||
        firstRow.advance_amount_total ||
        tableRows.reduce((sum, row) => sum + row.advanceTotal, 0)
      ),
      totalPostAmount: roundToTwo(
        firstRow.post_changes_amt ||
        firstRow.post_charges_total ||
        tableRows.reduce((sum, row) => sum + row.postTotal, 0)
      ),
      totalAllowanceAmount: roundToTwo(
        firstRow.allowances_amt ||
        firstRow.allowance_total ||
        tableRows.reduce((sum, row) => sum + row.allowanceTotal, 0)
      ),
      totalAmount: roundToTwo(
        firstRow.total_amount ||
        tableRows.reduce((sum, row) => sum + row.total, 0)
      ),
      netTotal: roundToTwo(
        firstRow.net_payable ||
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
            style={{ fontSize: '19pt', fontWeight: 'bold', }}
          >
            {firstRow?.hotel_name || 'GRAND VIEW HOTEL'}
          </div>
        )}
        {printSettings?.show_hotel_address === 1 && (
          <div className={`text-${addressAlign} mt-1`} style={{ fontSize: '10pt',  fontWeight: 'bold' }}>
            📍 {firstRow?.hotel_address || '123, Park Avenue, City Center, New Delhi - 110001'}
          </div>
        )}
        {printSettings?.show_hotel_contact === 1 && (
          <div className={`text-${contactAlign} mt-1`} style={{ fontSize: '10pt',  fontWeight: 'bold', color: '#060000' }}>
            📞 {firstRow?.hotel_phone || '+91 11 4567 8900'} &nbsp;|&nbsp; ✉ {firstRow?.hotel_email || 'info@grandviewhotel.com'} &nbsp;|&nbsp; 🌐 {firstRow?.website || 'www.grandviewhotel.com'}
            
          </div>
        )}
        {printSettings?.show_hotel_contact === 1 && (
          <div className={`text-${contactAlign} mt-1`} style={{ fontSize: '10pt',  fontWeight: 'bold', color: '#060000' }}>
             📍 {firstRow?.trn_gstno || 'GST'} 
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
          INVOICE 
        </h3>
      </div>
    )
  }, [printSettings, headerBg])

  // ========== RENDER GUEST DETAILS (Left Column) ==========
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
                <td className="bdt-label" style={{  fontWeight: 'bold', width: '60px', minWidth: '60px', maxWidth: '60px', fontSize: '10pt' }}>Name</td>
                <td className="bdt-colon" style={{ width: '6px', minWidth: '6px', fontSize: '10pt' }}>:</td>
                <td className="bdt-value" style={{ fontWeight: 'bold', fontSize: '10pt',  color: headerBg }}>{summary?.guest_name || '-'}</td>
              </tr>
            )}

            {printSettings?.show_guest_address === 1 && (
              <tr>
                <td className="bdt-label" style={{  fontWeight: 'bold', width: '60px', minWidth: '60px', maxWidth: '60px', fontSize: '10pt' }}>Address</td>
                <td className="bdt-colon" style={{ width: '6px', minWidth: '6px', fontSize: '10pt' }}>:</td>
                <td className="bdt-value" style={{ fontWeight: 'bold',fontSize: '10pt' }}>{summary?.guest_address || '-'}</td>
              </tr>
            )}
            {printSettings?.show_guest_mobile === 1 && (
              <tr>
                <td className="bdt-label" style={{  fontWeight: 'bold',  width: '60px', minWidth: '60px', maxWidth: '60px', fontSize: '10pt' }}>Phone</td>
                <td className="bdt-colon" style={{ width: '6px', minWidth: '6px', fontSize: '10pt' }}>:</td>
                <td className="bdt-value" style={{ fontWeight: 'bold', fontSize: '10pt' }}>{summary?.guest_mobile || '-'}</td>
              </tr>
            )}
            {printSettings?.show_guest_email === 1 && (
              <tr>
                <td className="bdt-label" style={{  fontWeight: 'bold', width: '60px', minWidth: '60px', maxWidth: '60px', fontSize: '10pt' }}>Company</td>
                <td className="bdt-colon" style={{ width: '6px', minWidth: '6px', fontSize: '10pt' }}>:</td>
                <td className="bdt-value" style={{ wordBreak: 'break-all', fontSize: '10pt', fontWeight: 'bold' }}>{summary?.company_name || '-'}</td>
              </tr>
            )}
            
            {printSettings?.show_guest_id_proof === 1 && (
              <tr>
                <td className="bdt-label" style={{  fontWeight: 'bold', width: '60px', minWidth: '60px', maxWidth: '60px', fontSize: '10pt' }}>GSTIN</td>
                <td className="bdt-colon" style={{ width: '6px', minWidth: '6px', fontSize: '10pt' }}>:</td>
                <td className="bdt-value" style={{ fontSize: '10pt', fontWeight: 'bold' }}>{summary?.gst_no || '-'}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}, [printSettings, summary])

// ========== RENDER BOOKING & INVOICE DETAILS (Right Column) ==========
// ========== RENDER BOOKING & INVOICE DETAILS (Right Column) ==========
const renderBookingDetails = useCallback(() => {
  if (printSettings?.show_booking_details !== 1) return null
  
  const invoiceNo = propBillNumber || billData[0]?.ldg_bill_no || generatedBillNo
  const invoiceDateDisplay = propPaymentDate || invoiceDate
  const bookingIdDisplay = summary?.reg_no || `BKD${summary?.checkin_id || '0000'}`
  const roomTypeDisplay = summary?.room_categories_str || '-'
  const roomNumbersDisplay = checkedOutRoomsStr || summary?.room_numbers_str || '-'
  const nightsDisplay = summary?.total_days || 0
  const tariffPlanDisplay = summary?.plan_name || 'Room Only'
  
  // Use the aggregated guests display from summary
  const guestsDisplay = summary?.guests_display || `${summary?.total_adults || 0} Adults${(summary?.total_child_paid || 0) > 0 ? `, ${summary?.total_child_paid} Child` : ''}${(summary?.total_driver || 0) > 0 ? `, ${summary?.total_driver} Driver` : ''}`

  // Get first row from billData for checkin/checkout datetime with time
  const firstRow = billData[0] || {}
  
  // Format datetime with time
  const formatDateTimeFull = (datetime: string) => {
    if (!datetime) return '-'
    const d = new Date(datetime)
    const day = d.getDate().toString().padStart(2, '0')
    const month = d.toLocaleString('default', { month: 'long' })
    const year = d.getFullYear()
    const hours = d.getHours().toString().padStart(2, '0')
    const minutes = d.getMinutes().toString().padStart(2, '0')
    return `${day} ${month} ${year} ${hours}:${minutes}`
  }

  // Get checkin and checkout datetime with time from first row
  const checkinDateTime = firstRow?.checkin_datetime || summary?.original_checkin_datetime
  const checkoutDateTime = firstRow?.checkout_datetime || summary?.final_checkout_datetime
  
  const checkinDisplay = checkinDateTime ? formatDateTimeFull(checkinDateTime) : checkinDateDisplay
  const checkoutDisplay = checkoutDateTime ? formatDateTimeFull(checkoutDateTime) : checkoutDateDisplay

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
          {/* LEFT COLUMN */}
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
            <span style={{ fontWeight: 'bold' }}>{checkinDisplay}</span>

            <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>Departure Date</span>
            <span style={{ fontWeight: 'bold' }}>:</span>
            <span style={{ fontWeight: 'bold' }}>{checkoutDisplay}</span>

            <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap', alignSelf: 'start' }}>Room No(s).</span>
            <span style={{ fontWeight: 'bold', alignSelf: 'start' }}>:</span>
            <span style={{ fontWeight: 'bold', wordBreak: 'break-word' }}>{roomNumbersDisplay}</span>
          </div>

          {/* RIGHT COLUMN */}
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

            <span style={{ fontWeight: 'bold', whiteSpace: 'nowrap' }}>No. of Nights</span>
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

  // Check if POST, ALLOWANCE, CHILD, DRIVER, UNPAID have any values
  const hasPostValues = tableRows.some(row => row.postTotal > 0)
  const hasAllowanceValues = tableRows.some(row => row.allowanceTotal > 0)
  
  // Check if CHILD, DRIVER, UNPAID have amount values from stored procedure
  const hasChildValues = displayRows.some(row => (row.child_total || 0) > 0 || (row.child_paid || 0) > 0 || (row.child_unpaid || 0) > 0)
  const hasDriverValues = displayRows.some(row => (row.driver_total || 0) > 0)
  const hasUnpaidValues = displayRows.some(row => (row.child_unpaid || 0) > 0)

  // Calculate aggregated amounts for footer
  const totalChildAmount = displayRows.reduce((sum, row) => sum + (row.child_total || row.child_paid || 0), 0)
  const totalChildPaid = displayRows.reduce((sum, row) => sum + (row.child_paid || 0), 0)
  const totalChildUnpaid = displayRows.reduce((sum, row) => sum + (row.child_unpaid || 0), 0)
  const totalDriverAmount = displayRows.reduce((sum, row) => sum + (row.driver_total || 0), 0)

  const headers: React.ReactElement[] = []
  if (showRowNums) headers.push(<th key="srno" className="col-srno bct-center">#</th>)
  headers.push(<th key="room" className="col-room bct-left">ROOM</th>)
  headers.push(<th key="date" className="col-date bct-left">DATE</th>)
  headers.push(<th key="tariff" className="col-amount bct-right">TARIFF</th>)
  headers.push(<th key="expax" className="col-amount bct-right">EX.PAX</th>)
  
  // Add CHILD column if there are values (shows amount)
  if (hasChildValues) {
    headers.push(<th key="child" className="col-amount bct-right">CHILD</th>)
  }
  
  // Add DRIVER column if there are values (shows amount)
  if (hasDriverValues) {
    headers.push(<th key="driver" className="col-amount bct-right">DRIVER</th>)
  }
  
  // Add UNPAID column if there are values (shows child_unpaid amount)
  if (hasUnpaidValues) {
    headers.push(<th key="unpaid" className="col-amount bct-right">UNPAID</th>)
  }
  
  headers.push(<th key="cgst" className="col-amount bct-right">CGST</th>)
  headers.push(<th key="sgst" className="col-amount bct-right">SGST</th>)
  headers.push(<th key="food" className="col-amount bct-right">FOOD</th>)
  
  // Only add POST header if there are values
  if (hasPostValues) {
    headers.push(<th key="post" className="col-amount bct-right">POST</th>)
  }
  // Only add ALLOWANCE header if there are values
  if (hasAllowanceValues) {
    headers.push(<th key="allowance" className="col-amount bct-right">ALLOWANCE</th>)
  }
  headers.push(<th key="total" className="col-amount bct-right">TOTAL</th>)

  const bodyRows: React.ReactElement[] = []
  let runningIndex = 1

  tableRows.forEach((row) => {
    const mainIndex = runningIndex++
    
    // Find child and driver data for this room/date combination from displayRows
    const roomRows = displayRows.filter(r => 
      r.room_number === row.roomNumber && 
      r.bill_date_formatted === row.date
    )
    
    // Get AMOUNT values directly from the stored procedure data
    const childAmount = roomRows.reduce((sum, r) => sum + (r.child_total || r.child_paid || 0), 0)
    const childUnpaidAmount = roomRows.reduce((sum, r) => sum + (r.child_unpaid || 0), 0)
    const driverAmount = roomRows.reduce((sum, r) => sum + (r.driver_total || 0), 0)
    
    const cells: React.ReactElement[] = []
    if (showRowNums) cells.push(<td key="srno" className="bct-center" style={{ fontWeight: 'bold' }}>{mainIndex}</td>)
    cells.push(
      <td key="room" className="bct-left" style={{ fontWeight: row.isFirstRow ? 'bold' : 'bold' }}>
        {row.roomNumber || 'N/A'}
      </td>
    )
    cells.push(<td key="date" className="bct-left" style={{ fontWeight: 'bold' }}>{row.date || 'N/A'}</td>)
    cells.push(<td key="tariff" className="bct-right" style={{ fontWeight: 'bold' }}>{formatAmtDisplay(row.roomTariff || 0)}</td>)
    cells.push(<td key="expax" className="bct-right" style={{ fontWeight: 'bold' }}>{formatAmtDisplay(row.exPax || 0)}</td>)
    
    // Add CHILD column if there are values (show amount)
    if (hasChildValues) {
      cells.push(
        <td key="child" className="bct-right" style={{ fontWeight: 'bold' }}>
          {childAmount > 0 ? formatAmtDisplay(childAmount) : '-'}
        </td>
      )
    }
    
    // Add DRIVER column if there are values (show amount)
    if (hasDriverValues) {
      cells.push(
        <td key="driver" className="bct-right" style={{ fontWeight: 'bold' }}>
          {driverAmount > 0 ? formatAmtDisplay(driverAmount) : '-'}
        </td>
      )
    }
    
    // Add UNPAID column if there are values (show child_unpaid amount)
    if (hasUnpaidValues) {
      cells.push(
        <td key="unpaid" className="bct-right" style={{ fontWeight: 'bold' }}>
          {childUnpaidAmount > 0 ? formatAmtDisplay(childUnpaidAmount) : '-'}
        </td>
      )
    }
    
    cells.push(<td key="cgst" className="bct-right" style={{ fontWeight: 'bold' }}>{formatAmtDisplay(row.cgst || 0)}</td>)
    cells.push(<td key="sgst" className="bct-right" style={{ fontWeight: 'bold' }}>{formatAmtDisplay(row.sgst || 0)}</td>)
    cells.push(<td key="food" className="bct-right" style={{ fontWeight: 'bold' }}>{row.food > 0 ? formatAmtDisplay(row.food) : '-'}</td>)
    
    // Only add POST column if there are values
    if (hasPostValues) {
      cells.push(
        <td key="post" className="bct-right" style={{ fontWeight: 'bold' }}>
          {row.postTotal > 0 ? formatAmtDisplay(row.postTotal) : '-'}
        </td>
      )
    }
    // Only add ALLOWANCE column if there are values
    if (hasAllowanceValues) {
      cells.push(
        <td key="allowance" className="bct-right" style={{ fontWeight: 'bold' }}>
          {row.allowanceTotal > 0 ? formatAmtDisplay(row.allowanceTotal) : '-'}
        </td>
      )
    }
    cells.push(
      <td key="total" className="bct-right" style={{ fontWeight: 'bold' }}>
        {formatAmtDisplay(row.total || 0)}
      </td>
    )
    bodyRows.push(<tr key={row.id}>{cells}</tr>)
  })

  // Calculate totals from tableRows
  const totalTariff = tableRows.reduce((sum, row) => sum + row.roomTariff, 0)
  const totalExPax = tableRows.reduce((sum, row) => sum + row.exPax, 0)
  const totalCgst = tableRows.reduce((sum, row) => sum + row.cgst, 0)
  const totalSgst = tableRows.reduce((sum, row) => sum + row.sgst, 0)
  const totalFood = tableRows.reduce((sum, row) => sum + row.food, 0)
  const totalPost = tableRows.reduce((sum, row) => sum + row.postTotal, 0)
  const totalAllowance = tableRows.reduce((sum, row) => sum + row.allowanceTotal, 0)
  const totalAmount = tableRows.reduce((sum, row) => sum + row.total, 0)

  const footerCells: React.ReactElement[] = []
  
  // Calculate colSpan for the label
  let labelColSpan = 0;
  if (showRowNums) labelColSpan += 1; // # column
  labelColSpan += 1; // ROOM column
  labelColSpan += 1; // DATE column
  // CHILD, DRIVER, UNPAID are value columns, so they should NOT be included in labelColSpan

  footerCells.push(
    <td key="total_label" colSpan={labelColSpan} className="bct-right" style={{ 
      fontWeight: 800,
      background: '#f0f0f0'
    }}>
      Total
    </td>
  )
  
  // Value columns - these will always be in same order
  footerCells.push(
    <td key="total_tariff" className="bct-right" style={{ 
      fontWeight: 800,
      background: '#f0f0f0'
    }}>
      {formatAmtDisplay(totalTariff)}
    </td>
  )
  footerCells.push(
    <td key="total_expax" className="bct-right" style={{ 
      fontWeight: 800,
      background: '#f0f0f0'
    }}>
      {formatAmtDisplay(totalExPax)}
    </td>
  )
  
  // Add CHILD footer if there are values (show amount)
  if (hasChildValues) {
    footerCells.push(
      <td key="total_child" className="bct-right" style={{ 
        fontWeight: 800,
        background: '#f0f0f0'
      }}>
        {totalChildAmount > 0 ? formatAmtDisplay(totalChildAmount) : '-'}
      </td>
    )
  }
  
  // Add DRIVER footer if there are values (show amount)
  if (hasDriverValues) {
    footerCells.push(
      <td key="total_driver" className="bct-right" style={{ 
        fontWeight: 800,
        background: '#f0f0f0'
      }}>
        {totalDriverAmount > 0 ? formatAmtDisplay(totalDriverAmount) : '-'}
      </td>
    )
  }
  
  // Add UNPAID footer if there are values (show child_unpaid amount)
  if (hasUnpaidValues) {
    footerCells.push(
      <td key="total_unpaid" className="bct-right" style={{ 
        fontWeight: 800,
        background: '#f0f0f0'
      }}>
        {totalChildUnpaid > 0 ? formatAmtDisplay(totalChildUnpaid) : '-'}
      </td>
    )
  }
  
  footerCells.push(
    <td key="total_cgst" className="bct-right" style={{ 
      fontWeight: 800,
      background: '#f0f0f0'
    }}>
      {formatAmtDisplay(totalCgst)}
    </td>
  )
  footerCells.push(
    <td key="total_sgst" className="bct-right" style={{ 
      fontWeight: 800,
      background: '#f0f0f0'
    }}>
      {formatAmtDisplay(totalSgst)}
    </td>
  )
  footerCells.push(
    <td key="total_food" className="bct-right" style={{ 
      fontWeight: 800,
      background: '#f0f0f0'
    }}>
      {totalFood > 0 ? formatAmtDisplay(totalFood) : '-'}
    </td>
  )
  
  // Only add POST footer if there are values
  if (hasPostValues) {
    footerCells.push(
      <td key="total_post" className="bct-right" style={{ 
        fontWeight: 800,
        background: '#f0f0f0'
      }}>
        {totalPost > 0 ? formatAmtDisplay(totalPost) : '-'}
      </td>
    )
  }
  
  // Only add ALLOWANCE footer if there are values
  if (hasAllowanceValues) {
    footerCells.push(
      <td key="total_allowance" className="bct-right" style={{ 
        fontWeight: 800,
        background: '#f0f0f0'
      }}>
        {totalAllowance > 0 ? formatAmtDisplay(totalAllowance) : '-'}
      </td>
    )
  }
  
  // TOTAL footer with dark highlight
  footerCells.push(
    <td key="total_amount" className="bct-right" style={{ 
      fontWeight: 800, 
      background: '#f0f0f0'
    }}>
      {formatAmtDisplay(totalAmount)}
    </td>
  )

  return (
    <div style={{ overflowX: 'auto', marginBottom: '12px' }}>
      <table className="bill-charges-table">
        <thead>
          <tr>{headers}</tr>
        </thead>
        <tbody>{bodyRows}</tbody>
        <tfoot>
          <tr key="footer1">{footerCells}</tr>
        </tfoot>
      </table>
    </div>
  )
}, [printSettings, tableRows, displayRows, headerBg, headerText])
 
// ========== RENDER PAYMENT DETAILS (Left Bottom) ==========
const renderPaymentDetails = useCallback(() => {
   
    billData[0]?.reference_number || 
    `TXN${Date.now().toString().slice(-12)}`

  const paymentDateDisplay = propPaymentDate || invoiceDate
  const paymentBankDisplay = propPaymentBank || paymentMode

  return (
    <div className="bill-info-box" style={{ height: '100%' }}>
      <div className="bill-info-box-header">PAYMENT DETAILS</div>
      <div className="bill-info-box-body" style={{ padding: '8px 10px' }}>
        <table className="bill-detail-table" style={{ width: '100%' }}>
          <tbody>
           
            <tr>
              <td className="bdt-label" style={{  width: '80px', minWidth: '80px', fontSize: '9pt', fontWeight: 'bold' }}>Payment Date</td>
              <td className="bdt-colon" style={{ width: '8px', fontSize: '9pt' }}>:</td>
              <td className="bdt-value" style={{  fontWeight: 'bold',fontSize: '9pt' }}>{paymentDateDisplay}</td>
            </tr>
            <tr>
              <td className="bdt-label" style={{ width: '80px', minWidth: '80px', fontSize: '9pt', fontWeight: 'bold' }}>Payment Mode</td>
              <td className="bdt-colon" style={{ width: '8px', fontSize: '9pt' }}>:</td>
              <td className="bdt-value" style={{ fontSize: '9pt', fontWeight: 'bold' }}>{paymentBankDisplay}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}, [propPaymentTransactionId, billData, propPaymentDate, invoiceDate, propPaymentBank, paymentMode, totals.netTotal])

// ========== RENDER BILL SUMMARY (Right Bottom) ==========
const renderSummaryBox = useCallback(() => {
  // Aggregate across ALL rows
  const grossTotal = displayRows.reduce((sum, row) => sum + (row.total_amount || 0), 0)
  const discountAmount = displayRows.reduce((sum, row) => sum + (row.discount_amount || 0), 0)
  const advanceTotal = displayRows.reduce((sum, row) => sum + (row.post_charges || 0), 0)
  const netTotal = roundToTwo(grossTotal - discountAmount)
  const finalAmount = roundToTwo(netTotal - advanceTotal)

  return (
    <div className="bill-info-box" style={{ height: '100%' }}>
      <div className="bill-info-box-header">BILL SUMMARY</div>
      <div className="bill-info-box-body" style={{ padding: '8px 10px' }}>
        <table className="bill-detail-table" style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td className="bdt-label" style={{ width: '100px', minWidth: '100px', fontSize: '9pt', fontWeight: 'bold' }}>TOTAL AMOUNT</td>
              <td className="bdt-colon" style={{ width: '8px', fontSize: '9pt' }}>:</td>
              <td className="bdt-value" style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '9pt', paddingRight: '4px' }}>
                ₹{formatAmt(grossTotal)}
              </td>
            </tr>
            {discountAmount > 0 && (
              <tr>
                <td className="bdt-label" style={{ width: '100px', minWidth: '100px', fontSize: '9pt', fontWeight: 600, color: '#c0392b' }}>Discount</td>
                <td className="bdt-colon" style={{ width: '8px', fontSize: '9pt', color: '#c0392b' }}>:</td>
                <td className="bdt-value" style={{ textAlign: 'right', color: '#c0392b', fontWeight: 600, fontSize: '9pt', paddingRight: '4px' }}>
                  -₹{formatAmt(discountAmount)}
                </td>
              </tr>
            )}
            <tr>
              <td className="bdt-label" style={{ width: '100px', minWidth: '100px', fontSize: '9pt', fontWeight: 700, borderTop: '1px solid #e0e0e0', paddingTop: '4px' }}>NET TOTAL</td>
              <td className="bdt-colon" style={{ width: '8px', fontSize: '9pt', borderTop: '1px solid #e0e0e0', paddingTop: '4px' }}>:</td>
              <td className="bdt-value" style={{ textAlign: 'right', fontWeight: 700, fontSize: '9pt', borderTop: '1px solid #e0e0e0', paddingTop: '4px', paddingRight: '4px' }}>
                ₹{formatAmt(netTotal)}
              </td>
            </tr>
            {advanceTotal > 0 && (
              <tr>
                <td className="bdt-label" style={{ width: '100px', minWidth: '100px', fontSize: '9pt', fontWeight: 600, color: '#e67e22' }}>Advance</td>
                <td className="bdt-colon" style={{ width: '8px', fontSize: '9pt', color: '#e67e22' }}>:</td>
                <td className="bdt-value" style={{ textAlign: 'right', color: '#e67e22', fontWeight: 600, fontSize: '9pt', paddingRight: '4px' }}>
                  -₹{formatAmt(advanceTotal)}
                </td>
              </tr>
            )}
            {advanceTotal > 0 && (
              <tr>
                <td className="bdt-label" style={{ width: '100px', minWidth: '100px', fontSize: '8pt', fontWeight: 800, color: headerBg, borderTop: '2px solid #e0e0e0', paddingTop: '4px' }}>BALANCE AMOUNT</td>
                <td className="bdt-colon" style={{ width: '8px', fontSize: '8pt', borderTop: '2px solid #e0e0e0', paddingTop: '4px' }}>:</td>
                <td className="bdt-value" style={{ textAlign: 'right', fontWeight: 800, fontSize: '8pt', color: headerBg, borderTop: '2px solid #e0e0e0', paddingTop: '4px', paddingRight: '4px' }}>
                  ₹{formatAmt(finalAmount)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}, [displayRows, headerBg])
  // ========== RENDER FOOTER (REMOVED - not shown in image) ==========
  // Footer is removed as per the image requirement

  // ========== RENDER LAYOUT ==========
  // ========== RENDER LAYOUT ==========
const renderLayout = useCallback(() => {
  return (
    <div className="bill-layout-container">
      {/* TOP SECTION: Header + Two Column (Guest Details | Booking & Invoice Details) */}
      <div className="bill-layout-top">
        {renderHotelHeader()}
        {renderBillTitle()}
        
        {/* Two Column: Guest Details (Left) | Booking & Invoice Details (Right) with flex */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginBottom: '12px',
          alignItems: 'stretch'
        }}>
          {/* Guest Details - Fixed width */}
          <div style={{ flex: '0 0 auto', width: '250px' }}>
            {printSettings?.show_guest_details === 1 && renderGuestDetails()}
          </div>
          
          {/* Booking & Invoice Details - Takes remaining space */}
          <div style={{ flex: '1 1 0%', minWidth: 0 }}>
            {printSettings?.show_booking_details === 1 && renderBookingDetails()}
          </div>
        </div>
        
        {/* Room Charges Table */}
        {renderChargesTable()}
        
        <div className="bill-spacer" />
      </div>
      
      {/* BOTTOM SECTION: Payment Details | Bill Summary (Always at bottom) */}
      {/* BOTTOM SECTION: Payment Details | Bill Summary (Always at bottom) */}
<div className="bill-layout-bottom" style={{ 
  pageBreakInside: 'avoid', 
  breakInside: 'avoid',
  paddingTop: '4px',
  marginTop: 'auto'
}}>
  <div style={{ 
    display: 'flex', 
    gap: '10px',
    marginBottom: 0,
  }}>
    <div style={{ flex: '1 1 0%', minWidth: 0 }}>
      {renderPaymentDetails()}
    </div>
    <div style={{ flex: '1 1 0%', minWidth: 0 }}>
      {renderSummaryBox()}
    </div>
  </div>
</div>
    </div>
  )
}, [
  renderHotelHeader,
  renderBillTitle,
  renderGuestDetails,
  renderBookingDetails,
  renderChargesTable,
  renderPaymentDetails,
  renderSummaryBox,
  printSettings,
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