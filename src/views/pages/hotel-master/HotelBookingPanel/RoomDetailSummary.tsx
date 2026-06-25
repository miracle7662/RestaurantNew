// pages/RoomDetailSummary.tsx - Refactored with Stored Procedure
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Row, Col, Button, Card, Tabs, Tab, Form, Nav, Modal } from 'react-bootstrap'
import TitleHelmet from '@/components/Common/TitleHelmet'
import toast from 'react-hot-toast'
import { useAuthContext } from '@/common/context/useAuthContext'

// Bill Modal
import CheckoutBillModal from './CheckoutBillModal'

// API Services
import CheckoutService from '@/common/hotel/checkout'
import RoomService from '@/common/hotel/room'


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
  isPostCharge: boolean
  parent_detail_id?: number | null
  selected: boolean
  cumulative_total: number
  guest_name: string
  payment_method: string
  created_at: string
  has_checkout_datetime: boolean
  checkout_time_formatted: string
  description: string
  particulars: string
  department_name: string
  charge_type: 'room' | 'extension' | 'postcharge' | 'allowance' | 'advance'
  transaction_type?: string
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
  pending_advance?: number
}

// ==================== HELPER FUNCTIONS ====================

const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0
  const num = Number(value)
  return isNaN(num) ? 0 : num
}

const roundToTwo = (num: number): number => {
  if (isNaN(num) || num === null || num === undefined) return 0
  return Math.round((num + Number.EPSILON) * 100) / 100
}

const formatAmountClean = (amt: number): string => {
  const rounded = roundToTwo(toNumber(amt))
  const sign = rounded < 0 ? '-' : ''
  if (rounded === Math.floor(rounded)) {
    return `₹${sign}${Math.abs(rounded)}/-`
  }
  return `₹${sign}${Math.abs(rounded).toFixed(2)}/-`
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

const formatBillDate = (dateString: string): string => {
  if (!dateString) return '-'
  const d = new Date(dateString)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear().toString().slice(-2)
  return `${day}-${month}-${year}`
}

const parseBillDateToDate = (billDateFormatted: string): Date => {
  if (!billDateFormatted) return new Date(0)
  const parts = billDateFormatted.split('-')
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const year = 2000 + parseInt(parts[2], 10)
    return new Date(year, month, day)
  }
  return new Date(0)
}

// ==================== MAIN COMPONENT ====================

const RoomDetailSummary = () => {
  console.log('🚀 RoomDetailSummary component mounted')
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthContext()
  const hotelId = user?.hotelid
  console.log('🏨 hotelId:', hotelId)

  // State
  const [displayRows, setDisplayRows] = useState<DisplayDetailRow[]>([])
  const [combinedSummary, setCombinedSummary] = useState<CombinedGuestSummary | null>(null)
  const [pendingAdvanceAmount, setPendingAdvanceAmount] = useState<number>(0)
  const [activeTab, setActiveTab] = useState('bill')
  const [currentDateTime, setCurrentDateTime] = useState(new Date())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Sub-tabs and checkboxes
  const [activeSubTab, setActiveSubTab] = useState<'billForDay' | 'gracePeriod'>('billForDay')
  const [billForDaysChecked, setBillForDaysChecked] = useState(false)
  const [graceCheckboxes, setGraceCheckboxes] = useState({
    applyGracePeriod: false,
    exPax: false,
    child: false,
    driver: false,
    discountAllow: false,
    serviceCharge: false,
    gst: false,
  })
  const [dateWiseChecked, setDateWiseChecked] = useState(false)
  const [billWiseChecked, setBillWiseChecked] = useState(false)
  const [viewType, setViewType] = useState<'datawise' | 'billtype'>('datawise')

  // Checkout state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [checkoutReason, setCheckoutReason] = useState('')
  const [checkoutProcessing, setCheckoutProcessing] = useState(false)
  const [checkoutDone, setCheckoutDone] = useState(false)
  const [showBillModal, setShowBillModal] = useState(false)
  const [generatedBillNumber, setGeneratedBillNumber] = useState<string>('')
  const [paymentTransactionId, setPaymentTransactionId] = useState<string>('')
  const [paymentDate, setPaymentDate] = useState<string>('')
  const [paymentBank, setPaymentBank] = useState<string>('')
  const [checkoutId, setCheckoutId] = useState<number | null>(null)

  const [selectedPaymentModeId] = useState<number | null>(null)
  const [selectedPaymentModeName] = useState<string>('Cash')
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set())

  const { occupiedItem } = (location.state as any) || {}
  const checkinIdFromState = occupiedItem?.checkin_id
  console.log('🔑 checkinIdFromState:', checkinIdFromState)

  // ==================== EFFECTS ====================

  useEffect(() => {
    if (!checkinIdFromState) {
      console.log('❌ No checkinId, redirecting to panel')
      navigate('/hotel-master/HotelBookingPanel', { replace: true })
    }
  }, [checkinIdFromState, navigate])

  useEffect(() => {
    if (hotelId && checkinIdFromState) {
      console.log('🔥 Calling fetchData...')
      fetchData()
    }
  }, [hotelId, checkinIdFromState])

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate(-1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  // ==================== FETCH DATA ====================

  const fetchData = async () => {
    if (!hotelId) {
      setError('Hotel ID not found')
      setLoading(false)
      return
    }

    if (!checkinIdFromState) {
      navigate('/hotel-master/HotelBookingPanel', { replace: true })
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Call the stored procedure
      const response = await RoomService.getCheckinFullDetails(hotelId, checkinIdFromState)
      const rows = response.data || []

      console.log('📊 Data from stored procedure:', rows.length, 'rows')

      if (!rows.length) {
        console.warn('No data returned from stored procedure')
        navigate('/hotel-master/HotelBookingPanel', { replace: true })
        return
      }

      // Process the data
      const { displayRows: processedRows, summary, advanceAmount } = processStoredProcedureData(rows, checkinIdFromState)
      
      setDisplayRows(processedRows)
      setCombinedSummary(summary)
      setPendingAdvanceAmount(advanceAmount)

      // Set selected rooms
      const allRooms = Array.from(new Set(processedRows.map(r => r.room_number)))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      setSelectedRooms(new Set(allRooms))

      // Generate payment info
      setGeneratedBillNumber('')
      setPaymentTransactionId(`TXN${Date.now().toString().slice(-12)}`)
      setPaymentDate(formatBillDate(new Date().toISOString()))
      setPaymentBank('Cash')

      console.log('✅ Data loaded successfully')

    } catch (err) {
      console.error('fetchData error:', err)
      setError('Failed to load data. Please try again.')
      toast.error('Failed to load room details')
    } finally {
      setLoading(false)
    }
  }

  // ==================== DATA PROCESSING ====================

  const processStoredProcedureData = (rows: any[], checkinId: number) => {
  
  const roomCumulativeMap = new Map<string, number>()
  const checkinData = rows[0] || {}
  let totalAdvance = 0

  // First pass: Identify and process all transactions
  const processedItems: any[] = []

  for (const row of rows) {
    // Determine transaction type and amount
    let amount = toNumber(row.total_amount)
    let chargeType: 'room' | 'extension' | 'postcharge' | 'allowance' | 'advance' = 'room'
    let isPostCharge = false
    let isExtension = false
    let isAdvance = false
    let isAllowance = false
    let dayNumber = 0
    let originalDayNumber = 0
    let description = row.description || ''
    let departmentName = ''
    let roomTariffPerDay = 0
    let taxAmount = 0

    // Check if it's a folio transaction
    if (row.folio_id) {
      const transactionType = row.transaction_type || ''
      
      if (transactionType === 'Advance Addition') {
        isAdvance = true
        chargeType = 'advance'
        amount = -toNumber(row.credit_amount)  // Negative amount for advance
        totalAdvance += Math.abs(amount)
        description = 'Advance Payment'
        departmentName = 'Advance'
        isPostCharge = true
        roomTariffPerDay = amount  // Set to the actual advance amount
        // Don't set taxAmount for advance
      } else if (transactionType === 'Allowance') {
        isAllowance = true
        chargeType = 'allowance'
        amount = -toNumber(row.credit_amount)
        description = row.description || 'Allowance/Discount'
        departmentName = 'Allowance'
        isPostCharge = true
        roomTariffPerDay = amount
      } else if (transactionType === 'Post Charges') {
        isPostCharge = true
        chargeType = 'postcharge'
        amount = toNumber(row.debit_amount)
        description = row.description || 'Post Charge'
        departmentName = 'Post Charge'
        roomTariffPerDay = amount
        taxAmount = toNumber(row.tax_amount) || 0
      } else {
        // Other folio transactions
        isPostCharge = true
        chargeType = 'postcharge'
        amount = toNumber(row.debit_amount) - toNumber(row.credit_amount)
        description = row.description || transactionType
        departmentName = transactionType
        roomTariffPerDay = amount
        taxAmount = toNumber(row.tax_amount) || 0
      }
    } else {
      // It's a room charge
      roomTariffPerDay = toNumber(row.pax_price) || 0
      taxAmount = toNumber(row.pax_tax) || 0
      
      // Determine if it's an extension
      const checkinDate = new Date(checkinData.checkin_datetime)
      const chargeDate = new Date(row.charge_checkin_datetime || row.checkin_datetime)
      const diffDays = Math.floor((chargeDate.getTime() - checkinDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (diffDays > 0) {
        isExtension = true
        chargeType = 'extension'
      }
      
      dayNumber = diffDays + 1
      originalDayNumber = dayNumber
    }

    // Get room number
    const roomNumber = row.room_number || `Room-${row.room_id || 0}`

    // Calculate cumulative total
    const prevCumulative = roomCumulativeMap.get(roomNumber) || 0
    const cumulativeTotal = roundToTwo(prevCumulative + amount)
    roomCumulativeMap.set(roomNumber, cumulativeTotal)

    // Build display row
    const displayRow: DisplayDetailRow = {
      id: `${row.folio_id || row.guest_room_charges_id || 'row'}-${Date.now()}-${Math.random()}`,
      guest_room_charges_id: row.guest_room_charges_id || 0,
      checkin_id: row.checkin_id || checkinId,
      guest_id: row.guest_id || 0,
      detail_id: row.detail_id,
      room_id: row.room_id || 0,
      room_number: roomNumber,
      room_category_name: isAdvance ? 'Advance' : 
                          isPostCharge ? (isAllowance ? 'Allowance' : departmentName || 'Post Charge') :
                          row.room_category_name || '-',
      converted_category_name: row.converted_category_name || '-',
      bill_date: row.charge_checkin_datetime || row.checkin_datetime || row.transaction_datetime || new Date().toISOString(),
      bill_date_formatted: formatBillDate(row.charge_checkin_datetime || row.checkin_datetime || row.transaction_datetime || new Date().toISOString()),
      checkin_datetime: row.charge_checkin_datetime || row.checkin_datetime || row.transaction_datetime || '',
      checkout_datetime: row.charge_checkout_datetime || row.checkout_datetime || '',
      no_of_days: isExtension ? 1 : 0,
      day_number: dayNumber,
      original_day_number: originalDayNumber,
      room_tariff_per_day: roomTariffPerDay,  // This will show the actual amount in the Amount column
      total_room_tariff: isAdvance ? amount : isPostCharge ? (isAllowance ? amount : amount) : roomTariffPerDay,
      ex_pax_count: isAdvance ? 0 : (toNumber(row.ex_pax_count) || 0),
      ex_pax_price: isAdvance ? 0 : (toNumber(row.ex_pax_price) || 0),
      ex_pax_tax: isAdvance ? 0 : (toNumber(row.ex_pax_tax) || 0),
      ex_pax_tax_percent: isAdvance ? 0 : (toNumber(row.ex_pax_tax_percent) || 0),
      ex_pax_total: isAdvance ? 0 : (toNumber(row.ex_pax_total) || 0),
      child_count: isAdvance ? 0 : (toNumber(row.child_count) || 0),
      child_unpaid: isAdvance ? 0 : (toNumber(row.child_unpaid) || 0),
      child_price: isAdvance ? 0 : (toNumber(row.child_price) || 0),
      child_tax: isAdvance ? 0 : (toNumber(row.child_tax) || 0),
      child_tax_percent: isAdvance ? 0 : (toNumber(row.child_tax_percent) || 0),
      child_total: isAdvance ? 0 : (toNumber(row.child_total) || 0),
      driver_count: isAdvance ? 0 : (toNumber(row.driver_count) || 0),
      driver_price: isAdvance ? 0 : (toNumber(row.driver_price) || 0),
      driver_tax: isAdvance ? 0 : (toNumber(row.driver_tax) || 0),
      driver_tax_percent: isAdvance ? 0 : (toNumber(row.driver_tax_percent) || 0),
      driver_total: isAdvance ? 0 : (toNumber(row.driver_total) || 0),
      cgst_amount: isAdvance ? 0 : (toNumber(row.cgst_amount) || 0),
      sgst_amount: isAdvance ? 0 : (toNumber(row.sgst_amount) || 0),
      igst_amount: isAdvance ? 0 : (toNumber(row.igst_amount) || 0),
      cess_amount: isAdvance ? 0 : (toNumber(row.cess_amount) || 0),
      service_charge_amount: isAdvance ? 0 : (toNumber(row.service_charge_amount) || 0),
      adults: isAdvance ? 0 : (toNumber(row.adults) || 0),
      pax: isAdvance ? 0 : (toNumber(row.pax) || toNumber(row.adults) || 0),
      ex_pax: isAdvance ? 0 : (toNumber(row.ex_pax) || 0),
      child_paid: isAdvance ? 0 : (toNumber(row.child_paid) || 0),
      driver: isAdvance ? 0 : (toNumber(row.driver) || 0),
      discount_percent: isAdvance ? 0 : (toNumber(row.discount_percent) || 0),
      discount_amount: 0,
      tax_percent: isAdvance ? 0 : (toNumber(row.tax_percent) || 0),
      tax_amount: isAdvance ? 0 : taxAmount,
      total_amount: amount,
      is_extension: isExtension,
      isPostCharge: isPostCharge,
      parent_detail_id: row.parent_detail_id || null,
      selected: true,
      cumulative_total: cumulativeTotal,
      guest_name: row.guest_name || checkinData.guest_name || 'Guest',
      payment_method: row.payment_method || 'Cash',
      created_at: row.created_at || row.checkin_datetime || new Date().toISOString(),
      has_checkout_datetime: !!row.checkout_datetime,
      checkout_time_formatted: row.checkout_datetime ? formatDateTime(row.checkout_datetime) : '-',
      description: description,
      particulars: row.particulars || row.narration || '',
      department_name: departmentName || (isAdvance ? 'Advance' : ''),
      charge_type: chargeType,
      transaction_type: row.transaction_type,
    }

    processedItems.push(displayRow)
  }

  // Sort the processed items
  const sortedRows = sortDisplayRows(processedItems)

  // Recalculate cumulative totals after sorting
  const sortedWithCumulative = calculateCumulativeTotals(sortedRows)

  // Build summary
  const summary = buildCombinedSummary(sortedWithCumulative, checkinData)

  return {
    displayRows: sortedWithCumulative,
    summary,
    advanceAmount: totalAdvance,
  }
}

  const sortDisplayRows = (rows: DisplayDetailRow[]): DisplayDetailRow[] => {
    return [...rows].sort((a, b) => {
      // First by date
      const dateA = a.bill_date_formatted ? parseBillDateToDate(a.bill_date_formatted) : new Date(0)
      const dateB = b.bill_date_formatted ? parseBillDateToDate(b.bill_date_formatted) : new Date(0)
      const dateCompare = dateA.getTime() - dateB.getTime()
      if (dateCompare !== 0) return dateCompare

      // Then by priority
      const getPriority = (row: DisplayDetailRow): number => {
        if (row.charge_type === 'advance') return 4
        if (row.charge_type === 'allowance') return 3
        if (row.charge_type === 'postcharge') return 2
        if (row.charge_type === 'extension') return 1
        return 0
      }
      const priorityDiff = getPriority(a) - getPriority(b)
      if (priorityDiff !== 0) return priorityDiff

      // Then by room number
      const roomCompare = a.room_number.localeCompare(b.room_number, undefined, { numeric: true })
      if (roomCompare !== 0) return roomCompare

      // Finally by day number
      return (a.day_number || 0) - (b.day_number || 0)
    })
  }

  const calculateCumulativeTotals = (rows: DisplayDetailRow[]): DisplayDetailRow[] => {
    const roomCumulativeMap = new Map<string, number>()
    
    return rows.map((row) => {
      const prevCumulative = roomCumulativeMap.get(row.room_number) || 0
      const newCumulative = roundToTwo(prevCumulative + row.total_amount)
      roomCumulativeMap.set(row.room_number, newCumulative)
      return { ...row, cumulative_total: newCumulative }
    })
  }

  const buildCombinedSummary = (rows: DisplayDetailRow[], checkinData: any): CombinedGuestSummary => {
    const roomNumbers = Array.from(new Set(rows.map(r => r.room_number)))
    const guestNames = Array.from(new Set(rows.map(r => r.guest_name).filter(name => name && name !== 'Guest')))
    const guestIds = Array.from(new Set(rows.map(r => r.guest_id).filter(id => id > 0)))
    
    // Calculate totals
    let totalRoomTariff = 0
    let totalExPax = 0
    let totalChildPaid = 0
    let totalDriver = 0
    let totalTax = 0
    let totalAmount = 0
    let totalAdults = 0
    let totalPax = 0
    let totalExPaxCount = 0
    let totalChildPaidCount = 0
    let totalDriverCount = 0
    let hasExtensions = false
    let extensionCount = 0

    for (const row of rows) {
      if (row.charge_type !== 'advance' && row.charge_type !== 'allowance') {
        totalRoomTariff += row.total_room_tariff
        totalExPax += row.ex_pax_total
        totalChildPaid += row.child_total
        totalDriver += row.driver_total
        totalTax += row.tax_amount
        totalAmount += row.total_amount
        
        if (!row.isPostCharge) {
          totalAdults += row.adults
          totalPax += row.pax
          totalExPaxCount += row.ex_pax_count
          totalChildPaidCount += row.child_count
          totalDriverCount += row.driver_count
        }
        
        if (row.is_extension) {
          hasExtensions = true
          extensionCount++
        }
      }
    }

    return {
      checkin_id: checkinData.checkin_id || 0,
      guest_id: guestIds.length > 0 ? guestIds[0] : 0,
      guest_name: guestNames.length > 0 ? guestNames.join(', ') : checkinData.guest_name || 'Guest',
      room_numbers: roomNumbers,
      room_categories: [],
      converted_categories: [],
      room_numbers_str: roomNumbers.join(', '),
      room_categories_str: '',
      converted_categories_str: '',
      total_room_tariff: roundToTwo(totalRoomTariff),
      total_ex_pax_charge: roundToTwo(totalExPax),
      total_child_paid_amount: roundToTwo(totalChildPaid),
      total_driver_charge: roundToTwo(totalDriver),
      total_tax_amount: roundToTwo(totalTax),
      total_amount: roundToTwo(totalAmount),
      total_days: 1,
      total_adults: totalAdults,
      total_pax: totalPax,
      total_ex_pax: totalExPaxCount,
      total_child_paid: totalChildPaidCount,
      total_child_unpaid: 0,
      total_driver: totalDriverCount,
      avg_discount_percent: 0,
      avg_tax_percent: 0,
      has_extensions: hasExtensions,
      extension_count: extensionCount,
      extension_days: extensionCount,
      payment_methods: ['Cash'],
      payment_method: 'Cash',
      charges_ids: [],
      selected: true,
      original_checkin_datetime: checkinData.checkin_datetime || '',
      final_checkout_datetime: checkinData.checkout_datetime || '',
      guest_mobile: checkinData.mobile,
      guest_address: checkinData.address,
      guest_email: checkinData.email,
      guest_id_proof: '-',
      reg_no: checkinData.reg_no,
      booking_ref: checkinData.booking,
      plan_name: checkinData.plan_name,
      pending_advance: 0,
    }
  }

  // ==================== HANDLER FUNCTIONS ====================

  const handleGuestSummarySelect = (isChecked: boolean) => {
    if (combinedSummary) {
      setCombinedSummary({ ...combinedSummary, selected: isChecked })
      setDisplayRows((prev) => prev.map((row) => ({ ...row, selected: isChecked })))
    }
  }

  const handleRoomSelectionToggle = (roomNumber: string) => {
    if (uniqueRooms.length === 1) {
      toast.error('At least one room must be selected for checkout')
      return
    }

    setSelectedRooms((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(roomNumber)) {
        if (newSet.size === 1) {
          toast.error('At least one room must be selected for checkout')
          return prev
        }
        newSet.delete(roomNumber)
      } else {
        newSet.add(roomNumber)
      }
      return newSet
    })
  }

  const getFilteredRowsBySelectedRooms = (): DisplayDetailRow[] => {
    if (selectedRooms.size === 0) return []

    return displayRows
      .filter((row) => selectedRooms.has(row.room_number))
      .sort((a, b) => {
        const dateA = a.bill_date_formatted ? parseBillDateToDate(a.bill_date_formatted) : new Date(0)
        const dateB = b.bill_date_formatted ? parseBillDateToDate(b.bill_date_formatted) : new Date(0)
        const dateCompare = dateA.getTime() - dateB.getTime()
        if (dateCompare !== 0) return dateCompare

        const getPriority = (row: DisplayDetailRow): number => {
          if (row.charge_type === 'advance') return 4
          if (row.charge_type === 'allowance') return 3
          if (row.charge_type === 'postcharge') return 2
          if (row.charge_type === 'extension') return 1
          return 0
        }
        const priorityDiff = getPriority(a) - getPriority(b)
        if (priorityDiff !== 0) return priorityDiff

        const roomCompare = a.room_number.localeCompare(b.room_number, undefined, { numeric: true })
        if (roomCompare !== 0) return roomCompare

        return (a.day_number || 0) - (b.day_number || 0)
      })
  }

  const filteredRowsByRoom = getFilteredRowsBySelectedRooms()
  const selectedRowsForCheckout = filteredRowsByRoom.filter((row) => row.selected)
  const grandTotal = roundToTwo(
    selectedRowsForCheckout.reduce((sum, row) => sum + row.total_amount, 0),
  )

  const getRowClass = (row: DisplayDetailRow): string => {
    switch (row.charge_type) {
      case 'advance': return 'advance-row'
      case 'allowance': return 'allowance-row'
      case 'postcharge': return 'postcharge-row'
      case 'extension': return 'extension-row'
      default: return 'original-row'
    }
  }

  const selectedRoomSummary = (() => {
    if (!combinedSummary) return null

    const seenRooms = new Set<string>()
    const roomCats = new Set<string>()
    const convCats = new Set<string>()
    const uniqueGuestNames = new Set<string>()
    const uniqueGuestIds = new Set<number>()

    let adults = 0, pax = 0, exPax = 0, childPaid = 0, childUnpaid = 0, driver = 0
    let roomTariff = 0, exPaxCharge = 0, childCharge = 0, driverCharge = 0
    let taxAmt = 0, taxPctSum = 0, roomChargeCount = 0
    let minCI = '', maxCO = ''

    for (const row of filteredRowsByRoom) {
      if (row.guest_name && row.guest_name !== 'Guest') {
        uniqueGuestNames.add(row.guest_name)
      }
      if (row.guest_id > 0) {
        uniqueGuestIds.add(row.guest_id)
      }

      if (row.charge_type !== 'advance' && row.charge_type !== 'allowance' && row.charge_type !== 'postcharge') {
        if (row.room_category_name && row.room_category_name !== '-')
          roomCats.add(row.room_category_name)
        if (row.converted_category_name && row.converted_category_name !== '-')
          convCats.add(row.converted_category_name)
      }

      if (row.charge_type !== 'advance' && row.charge_type !== 'allowance' && row.charge_type !== 'postcharge') {
        roomTariff += row.total_room_tariff
        exPaxCharge += row.ex_pax_total
        childCharge += row.child_total
        driverCharge += row.driver_total
        taxAmt += row.tax_amount
        taxPctSum += row.tax_percent
        roomChargeCount++
        
        if (!minCI || row.checkin_datetime < minCI) minCI = row.checkin_datetime
        if (!maxCO || row.checkout_datetime > maxCO) maxCO = row.checkout_datetime

        if (!seenRooms.has(row.room_number)) {
          seenRooms.add(row.room_number)
          adults += row.adults
          pax += row.pax
          exPax += row.ex_pax_count
          childPaid += row.child_count
          childUnpaid += !row.is_extension ? row.child_unpaid : 0
          driver += row.driver_count
        }
      }
    }

    let stayDays = 0
    if (minCI && maxCO) {
      stayDays = Math.ceil(
        Math.abs(new Date(maxCO).getTime() - new Date(minCI).getTime()) / (1000 * 60 * 60 * 24),
      )
      stayDays = stayDays > 0 ? stayDays : 1
    }

    const guestNamesDisplay = uniqueGuestNames.size > 0 
      ? Array.from(uniqueGuestNames).join(', ') 
      : combinedSummary.guest_name

    const guestIdsDisplay = uniqueGuestIds.size > 0
      ? Array.from(uniqueGuestIds).join(', ')
      : String(combinedSummary.guest_id || '')

    return {
      guest_name: guestNamesDisplay,
      guest_id: guestIdsDisplay,
      payment_method: combinedSummary.payment_method,
      room_categories_str: Array.from(roomCats).join(', '),
      converted_categories_str: Array.from(convCats).join(', ') || '-',
      total_days: stayDays,
      total_adults: adults,
      total_pax: pax,
      total_ex_pax: exPax,
      total_child_paid: childPaid,
      total_child_unpaid: 0,
      total_driver: driver,
      total_room_tariff: roundToTwo(roomTariff),
      total_ex_pax_charge: roundToTwo(exPaxCharge),
      total_child_paid_amount: roundToTwo(childCharge),
      total_driver_charge: roundToTwo(driverCharge),
      total_tax_amount: roundToTwo(taxAmt),
      avg_tax_percent: roomChargeCount > 0 ? roundToTwo(taxPctSum / roomChargeCount) : 0,
      selected: combinedSummary.selected,
    }
  })()

  const handleCheckoutClick = () => {
    if (!combinedSummary) {
      toast.error('No check-in data found')
      return
    }
    if (selectedRooms.size === 0) {
      toast.error('Please select at least one room for checkout')
      return
    }
    setShowCheckoutModal(true)
  }

  const handleConfirmCheckout = async () => {
    if (!combinedSummary) return
    setCheckoutProcessing(true)

    try {
      const finalTotalAmount = grandTotal || combinedSummary.total_amount

      let invoiceNo = ''
      try {
        const invoiceRes = await CheckoutService.getNextInvoiceNo()
        if (invoiceRes.success && invoiceRes.data?.ldg_bill_no) {
          invoiceNo = invoiceRes.data.ldg_bill_no
        }
      } catch (invoiceErr) {
        console.warn('Could not fetch invoice number', invoiceErr)
      }

      const selectedRoomIds = Array.from(selectedRooms)
        .map(roomNo => {
          const row = displayRows.find(r => r.room_number === roomNo)
          return row?.room_id
        })
        .filter((id): id is number => id !== null && id !== undefined)

      const roomIdsCommaString = selectedRoomIds.join(',')

      const response = await CheckoutService.performCheckout({
        checkin_id: combinedSummary.checkin_id,
        checkout_reason: checkoutReason || 'Regular checkout',
        payment_id: selectedPaymentModeId ?? undefined,
        payment_mode: selectedPaymentModeName,
        payment_method: selectedPaymentModeName,
        total_amount: finalTotalAmount,
        room_id: roomIdsCommaString,
        round_off_amount: 0,
        net_payable: finalTotalAmount,
        selected_rooms: Array.from(selectedRooms),
        invoiceNoFromBody: invoiceNo,
        is_settle: 0,
        is_print: 1,
      })

      if (response.success) {
        if (response.data?.checkout_id) {
          setCheckoutId(response.data.checkout_id)
        }

        if (response.data?.ldg_bill_no) {
          setGeneratedBillNumber(response.data.ldg_bill_no)
        } else if (invoiceNo) {
          setGeneratedBillNumber(invoiceNo)
        }

        toast.success(`Checkout completed for ${selectedRooms.size} room(s)`)
        setShowCheckoutModal(false)
        setCheckoutReason('')
        setCheckoutDone(true)
        setShowBillModal(true)
      } else {
        toast.error(response.message || 'Checkout failed')
      }
    } catch (error: any) {
      console.error('Checkout failed:', error)
      toast.error(error.response?.data?.message || 'Failed to process checkout')
    } finally {
      setCheckoutProcessing(false)
    }
  }

  const handleCancelCheckout = () => {
    setShowCheckoutModal(false)
    setCheckoutReason('')
  }

  const uniqueRooms = Array.from(new Set(displayRows.map((row) => row.room_number)))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))

  // ==================== RENDER ====================

  if (loading) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center vh-100">
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted">Loading room details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center vh-100">
        <i className="fi fi-rr-exclamation text-danger fs-1 mb-3"></i>
        <p className="text-danger">{error}</p>
        <Button variant="outline-primary" onClick={fetchData}>
          Retry
        </Button>
        <Button variant="outline-secondary" className="mt-2" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <>
      <TitleHelmet title="Front Office Bill" />

      <style>{`
        .fs-small { font-size: 0.9rem; }
        .table-fo th, .table-fo td {
          padding: 0.3rem 0.3rem;
          font-size: 0.9rem;
          white-space: nowrap;
          border: 1px solid #dee2e6;
        }
        .table-fo {
          border-collapse: collapse;
          width: 100%;
          background: white;
        }
        .bg-fo-header {
          background-color: #bfcdf0 !important;
        }
        .info-box {
          border: 1px solid #dee2e6;
          border-radius: 4px;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          height: 120px;
          overflow: hidden;
        }
        .info-box-label {
          font-weight: 600;
          background: #dbdbdb;
          padding: 4px 6px;
          border-bottom: 1px solid #ccc;
          border-top-left-radius: 3px;
          border-top-right-radius: 3px;
          width: 100%;
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }
        .info-box-content {
          padding: 6px;
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-height: 0;
        }
        .info-box-value { font-size: 0.9rem; font-weight: 600; }
        .checkbox-label { font-size: 0.85rem; display: flex; align-items: center; gap: 4px; white-space: nowrap; margin-bottom: 2px; }
        .nav-tabs .nav-link { font-size: 0.95rem; padding: 0.3rem 1rem; }
        .scrollable-table { overflow-x: auto; overflow-y: auto; border: 1px solid #dee2e6; background: white; height: auto; max-height: 150px; }
        .scrollable-table table { min-width: 50px; margin-bottom: 0; }
        .first-table-container { height: 240px; max-height: 500px; overflow: auto; border: 1px solid #dee2e6; background: white; }
        .first-table-container thead th { position: sticky; top: 0; background-color: #3d5eac; z-index: 10; color: white; }
        .bill-date-table-container { max-height: 200px; overflow: auto; border: 1px solid #dee2e6; background: white; }
        .bill-date-table-container thead th { position: sticky; top: 0; background-color: #3d5eac; z-index: 10; color: white; }
        .content-with-fixed-footer { padding-bottom: 60px; }
        .fixed-footer { position: fixed; bottom: 0; left: 0; right: 0; background: white; border-top: 1px solid #dee2e6; padding: 8px 16px; z-index: 1000; }
        .checkbox-grid { display: flex; flex-wrap: wrap; gap: 8px 12px; }
        .mini-table { width: 100%; font-size: 0.9rem; border-collapse: collapse; }
        .mini-table th, .mini-table td { padding: 2px 4px; text-align: left; border: none; }
        .mini-table th { font-weight: 600; background: #f9f9f9; }
        .radio-group { display: flex; align-items: center; gap: 16px; }
        .radio-label { font-size: 0.9rem; display: flex; align-items: center; gap: 4px; }
        .refresh-btn { height: 32px; font-size: 0.8rem; padding: 2px 12px; }
        .guest-company-row { background: #dbdbdb; padding: 6px 12px; border-bottom: 1px solid #dee2e6; }
        .room-list { font-size: 0.7rem; word-break: break-word; white-space: normal; overflow-y: auto; padding: 6px; }
        .original-row { background-color: #ffffff !important; }
        .extension-row { background-color: #fff8e1 !important; border-left: 3px solid #f9a825 !important; }
        .postcharge-row { background-color: #e8eaf6 !important; border-left: 3px solid #3949ab !important; }
        .allowance-row { background-color: #fce4ec !important; border-left: 3px solid #e91e63 !important; }
        .advance-row { background-color: #e0f2f1 !important; border-left: 3px solid #00897b !important; }
        .combined-row-summary { background-color: #f0f8ff !important; font-weight: 500; }
        .room-no-scroll-container { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 0 8px 8px 8px; min-height: 0; }
        .room-count-badge { background-color: #17a2b8; color: white; font-size: 0.6rem; padding: 2px 6px; border-radius: 10px; margin-left: 8px; }
        .room-numbers-cell { min-width: 100px; }
        .text-wrap-cell { white-space: normal !important; word-break: break-word; }
        .bill-date-highlight { font-weight: bold; color: #0066cc; }
        .text-danger-bold { color: #dc3545; font-weight: bold; }
        .room-checkbox-item { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; cursor: pointer; padding: 2px 4px; border-radius: 4px; }
        .room-checkbox-item:hover { background-color: #f0f0f0; }
        .room-checkbox-label { font-weight: bold; margin-left: 4px; cursor: pointer; }
        .select-all-room { border-bottom: 1px solid #eee; padding-bottom: 6px; margin-bottom: 6px; }
        .scrollable-table::-webkit-scrollbar,
        .first-table-container::-webkit-scrollbar,
        .bill-date-table-container::-webkit-scrollbar,
        .room-no-scroll-container::-webkit-scrollbar,
        .date-wise-scroll::-webkit-scrollbar,
        .info-box-content::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .scrollable-table::-webkit-scrollbar-track,
        .first-table-container::-webkit-scrollbar-track,
        .bill-date-table-container::-webkit-scrollbar-track,
        .room-no-scroll-container::-webkit-scrollbar-track,
        .date-wise-scroll::-webkit-scrollbar-track,
        .info-box-content::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .scrollable-table::-webkit-scrollbar-thumb,
        .first-table-container::-webkit-scrollbar-thumb,
        .bill-date-table-container::-webkit-scrollbar-thumb,
        .room-no-scroll-container::-webkit-scrollbar-thumb,
        .date-wise-scroll::-webkit-scrollbar-thumb,
        .info-box-content::-webkit-scrollbar-thumb {
          background: #c8c8c8;
          border-radius: 4px;
        }
        .scrollable-table::-webkit-scrollbar-thumb:hover,
        .first-table-container::-webkit-scrollbar-thumb:hover,
        .bill-date-table-container::-webkit-scrollbar-thumb:hover,
        .room-no-scroll-container::-webkit-scrollbar-thumb:hover,
        .date-wise-scroll::-webkit-scrollbar-thumb:hover,
        .info-box-content::-webkit-scrollbar-thumb:hover {
          background: #aaaaaa;
        }
        .scrollable-table,
        .first-table-container,
        .bill-date-table-container,
        .room-no-scroll-container,
        .date-wise-scroll,
        .info-box-content {
          scrollbar-width: thin;
          scrollbar-color: #c8c8c8 #f1f1f1;
        }
      `}</style>

      <div className="vh-100 d-flex flex-column overflow-hidden bg-white">
        {/* Header Tabs */}
        <div className="d-flex justify-content-between align-items-center bg-white border-bottom px-3">
          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'bill')} className="mb-0">
            <Tab eventKey="bill" title="Front Office Bill" />
            <Tab eventKey="summary" title="Room Detail Summary" />
          </Tabs>
          <div className="text-muted small">
            {currentDateTime.toLocaleDateString()} {currentDateTime.toLocaleTimeString()}
          </div>
        </div>

        {activeTab === 'bill' ? (
          <>
            {/* Control Panel */}
            <div className="px-3 py-2 bg-white border-bottom">
              <Row className="g-2">
                <Col md={2}>
                  <div className="info-box">
                    <div className="info-box-label">
                      <span>Room No.</span>
                      <span className="room-count-badge">{uniqueRooms.length} Rooms</span>
                    </div>
                    <div className="info-box-content p-0">
                      <div className="room-no-scroll-container">
                        {uniqueRooms.map((roomNumber) => (
                          <div
                            key={`room-check-${roomNumber}`}
                            className="room-checkbox-item"
                            onClick={() => handleRoomSelectionToggle(roomNumber)}
                            title={uniqueRooms.length === 1 ? 'Cannot deselect the only room' : undefined}>
                            <Form.Check
                              type="checkbox"
                              checked={selectedRooms.has(roomNumber)}
                              onChange={() => handleRoomSelectionToggle(roomNumber)}
                              onClick={(e) => e.stopPropagation()}
                              disabled={
                                uniqueRooms.length === 1 ||
                                (selectedRooms.has(roomNumber) && selectedRooms.size === 1)
                              }
                            />
                            <span className="info-box-value room-checkbox-label">{roomNumber}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Col>
                <Col md={4}>
                  <div className="info-box">
                    <div className="info-box-label p-0">
                      <Nav
                        variant="tabs"
                        activeKey={activeSubTab}
                        onSelect={(k) => setActiveSubTab(k as any)}
                        className="w-100">
                        <Nav.Item>
                          <Nav.Link eventKey="billForDay">Bill For Day (F3)</Nav.Link>
                        </Nav.Item>
                        <Nav.Item>
                          <Nav.Link eventKey="gracePeriod">Grace Period (F4)</Nav.Link>
                        </Nav.Item>
                      </Nav>
                    </div>
                    <div className="info-box-content" style={{ position: 'relative' }}>
                      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', minHeight: 0 }}>
                        {activeSubTab === 'billForDay' && (
                          <div className="checkbox-grid p-2">
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={billForDaysChecked}
                                onChange={(e) => setBillForDaysChecked(e.target.checked)}
                              />
                              Bill For Days
                            </label>
                          </div>
                        )}
                        {activeSubTab === 'gracePeriod' && (
                          <div className="checkbox-grid p-2">
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={graceCheckboxes.applyGracePeriod}
                                onChange={(e) =>
                                  setGraceCheckboxes({
                                    ...graceCheckboxes,
                                    applyGracePeriod: e.target.checked,
                                  })
                                }
                              />
                              Apply Grace Period
                            </label>
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={graceCheckboxes.exPax}
                                onChange={(e) =>
                                  setGraceCheckboxes({ ...graceCheckboxes, exPax: e.target.checked })
                                }
                              />
                              ExPax
                            </label>
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={graceCheckboxes.child}
                                onChange={(e) =>
                                  setGraceCheckboxes({ ...graceCheckboxes, child: e.target.checked })
                                }
                              />
                              Child
                            </label>
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={graceCheckboxes.driver}
                                onChange={(e) =>
                                  setGraceCheckboxes({ ...graceCheckboxes, driver: e.target.checked })
                                }
                              />
                              Driver
                            </label>
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={graceCheckboxes.discountAllow}
                                onChange={(e) =>
                                  setGraceCheckboxes({
                                    ...graceCheckboxes,
                                    discountAllow: e.target.checked,
                                  })
                                }
                              />
                              Discount Allowance
                            </label>
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={graceCheckboxes.serviceCharge}
                                onChange={(e) =>
                                  setGraceCheckboxes({
                                    ...graceCheckboxes,
                                    serviceCharge: e.target.checked,
                                  })
                                }
                              />
                              Service Charge
                            </label>
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={graceCheckboxes.gst}
                                onChange={(e) =>
                                  setGraceCheckboxes({ ...graceCheckboxes, gst: e.target.checked })
                                }
                              />
                              GST
                            </label>
                          </div>
                        )}
                      </div>
                      <div style={{ position: 'absolute', bottom: '4px', right: '8px' }}>
                        <Button
                          size="sm"
                          variant="primary"
                          style={{ width: '50px', height: '26px', fontSize: '12px', padding: '0' }}
                          onClick={() => toast.success('Settings applied')}>
                          OK
                        </Button>
                      </div>
                    </div>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="info-box">
                    <div className="info-box-label">
                      <Form.Check
                        type="checkbox"
                        checked={dateWiseChecked}
                        onChange={(e) => setDateWiseChecked(e.target.checked)}
                        label="Date Wise (F5)"
                      />
                    </div>
                    <div className="info-box-content p-0">
                      {selectedRowsForCheckout.length > 0 ? (
                        <div className="date-wise-scroll" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                          <table className="mini-table">
                            <thead>
                              <tr>
                                <th>Room/Period</th>
                                <th>Bill No</th>
                                <th>Bill Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedRowsForCheckout.map((row, idx) => (
                                <tr key={`datewise-${row.guest_room_charges_id}`}>
                                  <td>
                                    {row.room_number}
                                    {row.isPostCharge
                                      ? ` (${row.description})`
                                      : row.is_extension
                                        ? ` (Ext. Day ${row.day_number})`
                                        : ` (Day ${row.day_number})`}
                                  </td>
                                  <td>{idx + 1}</td>
                                  <td>
                                    <span className="bill-date-highlight">{row.bill_date_formatted}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="info-box-value p-2 text-center" style={{ fontSize: '12px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          No item selected
                        </div>
                      )}
                    </div>
                  </div>
                </Col>
                <Col md={2}>
                  <div className="info-box">
                    <div className="info-box-label">
                      <Form.Check
                        type="checkbox"
                        checked={billWiseChecked}
                        onChange={(e) => setBillWiseChecked(e.target.checked)}
                        label="Bill Wise (F6)"
                      />
                    </div>
                    <div className="info-box-content p-0">
                      {selectedRowsForCheckout.length > 0 ? (
                        <div className="date-wise-scroll" style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                          <table className="mini-table">
                            <tbody>
                              {selectedRowsForCheckout.map((r, idx) => (
                                <tr key={`billwise-${r.guest_room_charges_id}-${idx}`}>
                                  <td>
                                    {r.room_number}
                                    {r.isPostCharge
                                      ? ` (${r.description})`
                                      : r.is_extension
                                        ? ` (Ext Day ${r.day_number})`
                                        : ` (Day ${r.day_number})`}{' '}
                                    - <span className="bill-date-highlight">{r.bill_date_formatted}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="info-box-value p-2 text-center" style={{ fontSize: '12px', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          No item selected
                        </div>
                      )}
                    </div>
                  </div>
                </Col>
                <Col md={1}>
                  <div className="info-box">
                    <button
                      className="btn btn-outline-secondary w-100 h-100 d-flex align-items-center justify-content-center"
                      onClick={fetchData}
                      style={{ fontSize: '11px', padding: '4px 2px' }}>
                      <i className="fi fi-rr-refresh me-1"></i> Refresh
                    </button>
                  </div>
                </Col>
              </Row>
            </div>

            {/* Main Content */}
            <div className="px-3 py-2 flex-grow-1 overflow-auto content-with-fixed-footer">
              <Row className="mb-2 g-0">
                <Col md={12} className="pe-0">
                  <Card className="shadow-sm h-100">
                    <Card.Header className="bg-fo-header text-black py-1">
                      <span className="fw-bold">Room Details</span>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <div className="first-table-container">
                        <table className="table-fo mb-0 w-100">
                          <thead className="bg-fo-header">
                            <tr>
                              <th>#</th>
                              <th>Bill Date</th>
                              <th>Guest</th>
                              <th>GuestID</th>
                              <th>Room No.</th>
                              <th>Room Category</th>
                              <th>Conv. Category</th>
                              <th>Description</th>
                              <th>Adults</th>
                              <th>Pax</th>
                              <th>Amount</th>
                              <th>Discount%</th>
                              <th>Tax%</th>
                              <th>Tax Amt</th>
                              <th>Ex_Pax</th>
                              <th>Ex_Pax Price</th>
                              <th>Ex_Pax Tax%</th>
                              <th>Ex_Pax Total</th>
                              <th>Child</th>
                              <th>Child Price</th>
                              <th>Child Tax%</th>
                              <th>Child Total</th>
                              <th>Driver</th>
                              <th>Driver Price</th>
                              <th>Driver Tax%</th>
                              <th>Driver Total</th>
                              <th>Total</th>
                              <th>Cumulative</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredRowsByRoom.map((row, idx) => {
                              const rowClass = getRowClass(row)
                              return (
                                <tr key={row.id} className={rowClass}>
                                  <td className="text-center">{idx + 1}</td>
                                  <td className="bill-date-highlight text-center">{row.bill_date_formatted}</td>
                                  <td>{row.guest_name}</td>
                                  <td className="text-center">{row.guest_id}</td>
                                  <td className="fw-bold text-center">{row.room_number}</td>
                                  <td>{row.room_category_name}</td>
                                  <td>{row.converted_category_name !== '-' ? row.converted_category_name : '-'}</td>
                                  <td>
                                    {row.isPostCharge ? (
                                      <span className={
                                        row.charge_type === 'advance' ? 'text-warning fw-bold' :
                                        row.charge_type === 'allowance' ? 'text-danger-bold' :
                                        'text-primary'
                                      }>
                                        {row.description}
                                      </span>
                                    ) : (
                                      row.description
                                    )}
                                  </td>
                                  <td className="text-center">{row.isPostCharge ? '-' : row.adults}</td>
                                  <td className="text-center">{row.isPostCharge ? '-' : row.pax}</td>
                                  <td className="text-end">{formatAmountClean(row.room_tariff_per_day)}</td>
                                  <td className="text-center">{row.isPostCharge ? '-' : `${row.discount_percent}%`}</td>
                                  <td className="text-center">{row.isPostCharge ? '-' : `${row.tax_percent.toFixed(2)}%`}</td>
                                  <td className="text-end">{row.isPostCharge ? '-' : formatAmountClean(row.tax_amount)}</td>
                                  <td className="text-center">{row.isPostCharge ? '-' : row.ex_pax_count}</td>
                                  <td className="text-end">{row.isPostCharge ? '-' : formatAmountClean(row.ex_pax_price)}</td>
                                  <td className="text-center">{row.isPostCharge ? '-' : `${row.ex_pax_tax_percent}%`}</td>
                                  <td className="text-end">{row.isPostCharge ? '-' : formatAmountClean(row.ex_pax_total)}</td>
                                  <td className="text-center">{row.isPostCharge ? '-' : row.child_count}</td>
                                  <td className="text-end">{row.isPostCharge ? '-' : formatAmountClean(row.child_price)}</td>
                                  <td className="text-center">{row.isPostCharge ? '-' : `${row.child_tax_percent}%`}</td>
                                  <td className="text-end">{row.isPostCharge ? '-' : formatAmountClean(row.child_total)}</td>
                                  <td className="text-center">{row.isPostCharge ? '-' : row.driver_count}</td>
                                  <td className="text-end">{row.isPostCharge ? '-' : formatAmountClean(row.driver_price)}</td>
                                  <td className="text-center">{row.isPostCharge ? '-' : `${row.driver_tax_percent}%`}</td>
                                  <td className="text-end">{row.isPostCharge ? '-' : formatAmountClean(row.driver_total)}</td>
                                  <td className="fw-bold text-end">
                                    <span className={row.total_amount < 0 ? 'text-danger' : 'text-primary'}>
                                      {formatAmountClean(row.total_amount)}
                                    </span>
                                  </td>
                                  <td className="text-success fw-bold text-end">
                                    {formatAmountClean(row.cumulative_total)}
                                  </td>
                                </tr>
                              )
                            })}
                            {filteredRowsByRoom.length === 0 && (
                              <tr>
                                <td colSpan={28} className="text-center py-4 text-muted">
                                  No rooms selected. Please select at least one room from the Room No. panel.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {/* Summary Card */}
              <Card className="shadow-sm mb-3">
                <Card.Header className="bg-fo-header text-black py-1">
                  <span className="fw-bold">Room Summary - Total Charges</span>
                </Card.Header>
                <Card.Body className="p-0">
                  <div className="scrollable-table" style={{ maxHeight: '150px', overflow: 'auto' }}>
                    <table className="table-fo mb-0">
                      <thead className="bg-fo-header text-black">
                        <tr>
                          <th>Select</th>
                          <th>Guest</th>
                          <th>Guest ID</th>
                          <th>Pay Method</th>
                          <th>Room No(s)</th>
                          <th>Room Category</th>
                          <th>Conv. Category</th>
                          <th>Total Days</th>
                          <th>Adults</th>
                          <th>Pax</th>
                          <th>Amount</th>
                          <th>Ex_Pax</th>
                          <th>Ex_Pax Total</th>
                          <th>Child</th>
                          <th>Child Total</th>
                          <th>Driver</th>
                          <th>Driver Total</th>
                          <th>Avg Tax%</th>
                          <th>Tax Amt</th>
                          <th>Total Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRoomSummary && (
                          <tr className="combined-row-summary">
                            <td>
                              <Form.Check
                                type="checkbox"
                                checked={selectedRoomSummary.selected}
                                onChange={(e) => handleGuestSummarySelect(e.target.checked)}
                              />
                            </td>
                            <td>{selectedRoomSummary.guest_name}</td>
                            <td>{selectedRoomSummary.guest_id}</td>
                            <td>{selectedRoomSummary.payment_method}</td>
                            <td className="room-numbers-cell fw-bold">
                              {Array.from(selectedRooms)
                                .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
                                .join(', ') || '-'}
                            </td>
                            <td className="text-wrap-cell">{selectedRoomSummary.room_categories_str}</td>
                            <td className="text-wrap-cell">{selectedRoomSummary.converted_categories_str}</td>
                            <td>{selectedRoomSummary.total_days}</td>
                            <td>{selectedRoomSummary.total_adults}</td>
                            <td>{selectedRoomSummary.total_pax}</td>
                            <td>{formatAmountClean(selectedRoomSummary.total_room_tariff)}</td>
                            <td>{selectedRoomSummary.total_ex_pax}</td>
                            <td>{formatAmountClean(selectedRoomSummary.total_ex_pax_charge)}</td>
                            <td>{selectedRoomSummary.total_child_paid}</td>
                            <td>{formatAmountClean(selectedRoomSummary.total_child_paid_amount)}</td>
                            <td>{selectedRoomSummary.total_driver}</td>
                            <td>{formatAmountClean(selectedRoomSummary.total_driver_charge)}</td>
                            <td>{selectedRoomSummary.avg_tax_percent.toFixed(2)}%</td>
                            <td>{formatAmountClean(selectedRoomSummary.total_tax_amount)}</td>
                            <td className="fw-bold text-primary">{formatAmountClean(grandTotal)}</td>
                          </tr>
                        )}
                        {!selectedRoomSummary || selectedRooms.size === 0 ? (
                          <tr>
                            <td colSpan={21} className="text-center text-muted py-2">
                              No rooms selected
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </>
        ) : (
          // Summary Tab
          <>
            <div className="guest-company-row d-flex flex-wrap gap-4 align-items-center">
              <div><strong>Guest:</strong> {combinedSummary?.guest_name || 'N/A'}</div>
              <div><strong>Guest ID:</strong> {combinedSummary?.guest_id || 'N/A'}</div>
              <div><strong>Selected Rooms:</strong> {Array.from(selectedRooms).join(', ') || 'None'}</div>
              <div><strong>Room Numbers:</strong> {combinedSummary?.room_numbers_str || '-'}</div>
              <div><strong>From:</strong> {displayRows.length ? displayRows[0].bill_date_formatted : '-'}</div>
              <div><strong>To:</strong> {displayRows.length ? displayRows[displayRows.length - 1].bill_date_formatted : '-'}</div>
              <div className="radio-group ms-auto">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="viewType"
                    value="datawise"
                    checked={viewType === 'datawise'}
                    onChange={() => setViewType('datawise')}
                  /> Datewise
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="viewType"
                    value="billtype"
                    checked={viewType === 'billtype'}
                    onChange={() => setViewType('billtype')}
                  /> Bill Type Wise
                </label>
              </div>
              <Button variant="outline-secondary" size="sm" className="refresh-btn" onClick={fetchData}>
                <i className="fi fi-rr-refresh me-1"></i> Refresh
              </Button>
            </div>

            <div className="px-3 py-2 overflow-auto" style={{ paddingBottom: '60px' }}>
              <Row className="mb-2 g-0">
                <Col md={12} className="pe-0">
                  <Card className="shadow-sm h-100">
                    <Card.Header className="bg-fo-header text-black py-1">
                      <span className="fw-bold">Bill Date Summary</span>
                    </Card.Header>
                    <Card.Body className="p-0">
                      <div className="bill-date-table-container">
                        <table className="table-fo mb-0 w-100">
                          <thead className="bg-fo-header text-white">
                            <tr>
                              <th>Bill Date</th>
                              <th>Room No</th>
                              <th>Bill No</th>
                              <th>Day</th>
                              <th>Description</th>
                              <th>Amount</th>
                              <th>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredRowsByRoom.map((item, idx) => {
                              const rowClass = getRowClass(item)
                              return (
                                <tr key={`bill-summary-${idx}`} className={rowClass}>
                                  <td className="bill-date-highlight">{item.bill_date_formatted}</td>
                                  <td className="fw-bold">{item.room_number}</td>
                                  <td>{idx + 1}</td>
                                  <td>{item.isPostCharge ? '-' : item.day_number}</td>
                                  <td>
                                    {item.isPostCharge ? (
                                      <span className={item.total_amount < 0 ? 'text-danger-bold' : 'text-primary'}>
                                        {item.description}
                                      </span>
                                    ) : (
                                      item.description
                                    )}
                                  </td>
                                  <td className="text-end">{formatAmountClean(item.room_tariff_per_day)}</td>
                                  <td className="fw-bold text-end">
                                    <span className={item.total_amount < 0 ? 'text-danger' : 'text-primary'}>
                                      {formatAmountClean(item.total_amount)}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
                            {filteredRowsByRoom.length === 0 && (
                              <tr>
                                <td colSpan={7} className="text-center">No rooms selected</td>
                              </tr>
                            )}
                            <tfoot>
                              <tr className="bg-light fw-bold">
                                <td colSpan={6} className="text-end">Total:</td>
                                <td className="text-danger text-end">{formatAmountClean(grandTotal)}</td>
                              </tr>
                            </tfoot>
                          </tbody>
                        </table>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              <Card className="shadow-sm mb-3">
                <Card.Header className="bg-fo-header text-black py-1">
                  <strong>Room Details - Selected Rooms</strong>
                </Card.Header>
                <Card.Body className="p-0">
                  <div className="scrollable-table" style={{ maxHeight: '240px' }}>
                    <table className="table-fo mb-0">
                      <thead className="bg-fo-header text-black">
                        <tr>
                          <th>#</th>
                          <th>Bill Date</th>
                          <th>Room No.</th>
                          <th>Pay Method</th>
                          <th>Room Category</th>
                          <th>Day</th>
                          <th>Adults</th>
                          <th>Ex Pax</th>
                          <th>Ex Pax Amt</th>
                          <th>Ex Pax Total</th>
                          <th>Child</th>
                          <th>Child Amt</th>
                          <th>Child Total</th>
                          <th>Driver</th>
                          <th>Driver Amt</th>
                          <th>Driver Total</th>
                          <th>Amount</th>
                          <th>Tax%</th>
                          <th>Tax Amt</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRowsByRoom.map((row, idx) => {
                          const rowClass = getRowClass(row)
                          return (
                            <tr key={`summary-${row.id}`} className={rowClass}>
                              <td className="text-center">{idx + 1}</td>
                              <td className="bill-date-highlight text-center">{row.bill_date_formatted}</td>
                              <td className="fw-bold text-center">{row.room_number}</td>
                              <td>{row.payment_method || 'Cash'}</td>
                              <td>{row.room_category_name}</td>
                              <td className="text-center">{row.isPostCharge ? '-' : row.day_number}</td>
                              <td className="text-center">{row.isPostCharge ? '-' : row.adults}</td>
                              <td className="text-center">{row.isPostCharge ? '-' : row.ex_pax_count}</td>
                              <td className="text-end">{row.isPostCharge ? '-' : formatAmountClean(row.ex_pax_price)}</td>
                              <td className="text-end">{row.isPostCharge ? '-' : formatAmountClean(row.ex_pax_total)}</td>
                              <td className="text-center">{row.isPostCharge ? '-' : row.child_count}</td>
                              <td className="text-end">{row.isPostCharge ? '-' : formatAmountClean(row.child_price)}</td>
                              <td className="text-end">{row.isPostCharge ? '-' : formatAmountClean(row.child_total)}</td>
                              <td className="text-center">{row.isPostCharge ? '-' : row.driver_count}</td>
                              <td className="text-end">{row.isPostCharge ? '-' : formatAmountClean(row.driver_price)}</td>
                              <td className="text-end">{row.isPostCharge ? '-' : formatAmountClean(row.driver_total)}</td>
                              <td className="text-end">{formatAmountClean(row.room_tariff_per_day)}</td>
                              <td className="text-center">{row.isPostCharge ? '-' : `${row.tax_percent.toFixed(2)}%`}</td>
                              <td className="text-end">{row.isPostCharge ? '-' : formatAmountClean(row.tax_amount)}</td>
                              <td className="fw-bold text-end">
                                <span className={row.total_amount < 0 ? 'text-danger' : 'text-primary'}>
                                  {formatAmountClean(row.total_amount)}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                        {filteredRowsByRoom.length === 0 && (
                          <tr>
                            <td colSpan={20} className="text-center py-4 text-muted">
                              No rooms selected. Please select at least one room from the Room No. panel.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-light fw-bold">
                          <td colSpan={19} className="text-end">Grand Total:</td>
                          <td className="text-danger text-end">{formatAmountClean(grandTotal)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </>
        )}

        {/* Fixed Footer */}
        <div className="fixed-footer d-flex justify-content-between align-items-center">
          <div>
            {pendingAdvanceAmount > 0 ? (
              <>
                <div className="small text-muted" style={{ lineHeight: 1.3 }}>
                  Gross Total:{' '}
                  <span className="fw-semibold">
                    {formatAmountClean(grandTotal + pendingAdvanceAmount)}
                  </span>
                  &nbsp;&mdash;&nbsp; Advance Paid:{' '}
                  <span style={{ color: '#00897b', fontWeight: 600 }}>
                    -{formatAmountClean(pendingAdvanceAmount)}
                  </span>
                </div>
                <div className="fw-bold fs-5" style={{ color: grandTotal < 0 ? '#00897b' : '#dc3545' }}>
                  {grandTotal < 0
                    ? `Credit Balance: ${formatAmountClean(Math.abs(grandTotal))}`
                    : `Net Payable: ${formatAmountClean(grandTotal)}`}
                </div>
              </>
            ) : (
              <div className="fw-bold fs-5 text-danger">
                Total Amount: {formatAmountClean(grandTotal)}
              </div>
            )}
          </div>
          <div>
            <Button
              variant="success"
              size="sm"
              className="me-2"
              onClick={handleCheckoutClick}
              disabled={checkoutProcessing || selectedRooms.size === 0}>
              {checkoutProcessing
                ? 'Processing...'
                : `Check Out (${selectedRooms.size} Room${selectedRooms.size !== 1 ? 's' : ''})`}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
              Cancel (Esc)
            </Button>
          </div>
        </div>
      </div>

      {/* Checkout Modal */}
      <Modal show={showCheckoutModal} onHide={handleCancelCheckout} centered size="sm">
        <Modal.Header closeButton className="py-3 bg-primary text-white">
          <Modal.Title className="fs-5 fw-bold text-white">Confirm Checkout</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <div className="text-center mb-3">
            <i className="fi fi-rr-door-open fs-1 text-primary"></i>
          </div>
          <p className="mb-2 text-center fw-semibold fs-6">
            Are you sure you want to checkout <strong>{combinedSummary?.guest_name}</strong>?
          </p>
          <p className="text-muted small text-center mb-1">
            Selected Rooms: <strong>{Array.from(selectedRooms).join(', ')}</strong>
            <br />
            {pendingAdvanceAmount > 0 ? (
              <>
                Gross: <strong>{formatAmountClean(grandTotal + pendingAdvanceAmount)}</strong>
                <br />
                Advance: <strong style={{ color: '#00897b' }}>-{formatAmountClean(pendingAdvanceAmount)}</strong>
                <br />
                Net Payable: <strong style={{ color: grandTotal < 0 ? '#00897b' : '#dc3545' }}>
                  {grandTotal < 0 ? `Credit: ${formatAmountClean(Math.abs(grandTotal))}` : formatAmountClean(grandTotal)}
                </strong>
              </>
            ) : (
              <>
                Total Amount: <strong className="text-danger">{formatAmountClean(grandTotal)}</strong>
              </>
            )}
          </p>
        </Modal.Body>
        <Modal.Footer className="justify-content-center border-0 pb-3 pt-0 gap-1">
          <Button variant="success" onClick={handleConfirmCheckout} disabled={checkoutProcessing} style={{ minWidth: '100px' }}>
            <i className="fi fi-rr-sign-out-alt me-1"></i>
            {checkoutProcessing ? 'Processing...' : 'Checkout'}
          </Button>
          <Button variant="secondary" onClick={handleCancelCheckout} disabled={checkoutProcessing} style={{ minWidth: '50px' }}>
            <i className="fi fi-rr-cross me-1"></i>Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Checkout Success Modal */}
      <Modal
        show={checkoutDone && !showBillModal}
        onHide={() => {
          setCheckoutDone(false)
          navigate('/hotel-master/HotelBookingPanel', {
            state: {
              checkoutSuccess: true,
              checkedOutRooms: Array.from(selectedRooms),
              checkin_id: combinedSummary?.checkin_id,
            }
          })
        }}
        centered
        size="sm">
        <Modal.Header closeButton className="py-2 bg-success text-white">
          <Modal.Title className="fs-6 fw-bold text-white">✅ Checkout Successful</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-3 text-center">
          <p className="mb-1 fw-semibold">
            Guest <strong>{combinedSummary?.guest_name}</strong> has been checked out.
          </p>
          <p className="text-muted small mb-0">
            Checked out Rooms: {Array.from(selectedRooms).join(', ')}
          </p>
          <p className="mt-2 mb-0">
            Amount Collected: <strong className="text-danger">{formatAmountClean(grandTotal)}</strong>
          </p>
        </Modal.Body>
        <Modal.Footer className="justify-content-center border-0 pb-3 pt-0 gap-2">
          <Button variant="primary" onClick={() => setShowBillModal(true)} style={{ minWidth: '120px' }}>
            🧾 Show Bill
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => {
              setCheckoutDone(false)
              navigate('/hotel-master/HotelBookingPanel', {
                state: {
                  checkoutSuccess: true,
                  checkedOutRooms: Array.from(selectedRooms),
                  checkin_id: combinedSummary?.checkin_id,
                }
              })
            }}>
            Skip
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Bill Modal */}
      <CheckoutBillModal
        show={showBillModal}
        onHide={() => {
          setShowBillModal(false)
          setCheckoutDone(false)
          navigate('/hotel-master/HotelBookingPanel', {
            state: {
              checkoutSuccess: true,
              checkedOutRooms: Array.from(selectedRooms),
              checkin_id: combinedSummary?.checkin_id,
            }
          })
        }}
        checkoutId={checkoutId || 0}
        ldgBillNo={generatedBillNumber}
        hotelId={hotelId}
        billNumber={generatedBillNumber}
        paymentTransactionId={paymentTransactionId}
        paymentDate={paymentDate}
        paymentBank={paymentBank}
        selectedRooms={Array.from(selectedRooms)}
      />
    </>
  )
}

export default RoomDetailSummary