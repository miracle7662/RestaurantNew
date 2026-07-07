// pages/RoomDetailSummary.tsx - Complete with corrections
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
import OutletPaymentModeService from '@/common/api/outletpaymentmode'

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
  detail_checkin_datetime: string
  bill_date_formatted: string
  checkin_datetime: string
  checkout_datetime: string
  no_of_days: number
  day_number: number
  original_day_number: number
  room_tariff: number
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
  sortKey?: string
   credit_amount?: number
  debit_amount?: number
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
  total_discount_amount?: number
    total_credit_amount?: number    // Total credit from folio
  total_debit_amount?: number     // Total debit from folio
}

interface BillDateSummaryItem {
  billDate: string
  billDateFormatted: string
  roomNumber: string
  roomCategory: string
  convertedCategory: string
  billNo: number
  dayNumber: number
  description: string
  amount: number
  total: number
  isExtension: boolean
  isPostCharge: boolean
  originalDayNumber: number
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

  const [displayRows, setDisplayRows] = useState<DisplayDetailRow[]>([])
  const [combinedSummary, setCombinedSummary] = useState<CombinedGuestSummary | null>(null)
  const [, setBillDateSummary] = useState<BillDateSummaryItem[]>([])

  const [activeTab, setActiveTab] = useState('bill')
  const [pendingAdvanceAmount] = useState<number>(0)

  const [currentDateTime, setCurrentDateTime] = useState(new Date())
  const [, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
  const [selectedRoomFilter] = useState<string>('all')
  const [viewType, setViewType] = useState<'datawise' | 'billtype'>('datawise')

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

  // Payment mode states
  const [outletPaymentModes, setOutletPaymentModes] = useState<any[]>([])
  const [selectedPaymentModeId, setSelectedPaymentModeId] = useState<number | null>(null)
  const [selectedPaymentModeName, setSelectedPaymentModeName] = useState<string>('')
  const [isPaymentModeChanging, setIsPaymentModeChanging] = useState<boolean>(false)

  const [, setRoomNumberMap] = useState<Map<number, string>>(new Map())
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set())

  

  const { occupiedItem } = (location.state as any) || {}
  const checkinIdFromState = occupiedItem?.checkin_id

  
  console.log('🔑 checkinIdFromState:', checkinIdFromState)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelId, checkinIdFromState])

  // Auto-refresh time
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Escape key → go back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate(-1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  // Fetch room numbers map
  const fetchRoomNumbers = async () => {
    if (!hotelId) return new Map<number, string>()
    try {
      const res = await RoomService.list({ hotelid: hotelId })
      const rooms = res.data || []
      const map = new Map<number, string>()
      rooms.forEach((room: any) => {
        if (room.room_id && room.room_no) {
          map.set(room.room_id, String(room.room_no))
        }
      })
      return map
    } catch (err) {
      console.error('Failed to fetch room numbers:', err)
      return new Map<number, string>()
    }
  }

  // Fetch payment modes for dropdown
useEffect(() => {
  if (!hotelId) return

  const fetchPaymentModes = async () => {
    try {
      const outletId = user?.outletid || hotelId
      const res = await OutletPaymentModeService.list({ outletid: outletId })
      if (res.success && res.data) {
        setOutletPaymentModes(res.data)
      }
    } catch (error) {
      console.error('Failed to fetch payment modes:', error)
    }
  }
  fetchPaymentModes()
}, [hotelId, user])


// Sync selected payment mode with combined summary
// ==================== SYNC PAYMENT MODE WITH SUMMARY ====================
useEffect(() => {
  // Don't run if no payment modes or no summary
  if (outletPaymentModes.length === 0 || !combinedSummary) return

  // Don't override user selection
  if (selectedPaymentModeId) return

  const paymentMethod = combinedSummary.payment_method || 'Cash'

  const matchedMode = outletPaymentModes.find(
    (m) => m.mode_name?.toLowerCase() === paymentMethod.toLowerCase()
  )

  if (matchedMode) {
    setSelectedPaymentModeId(matchedMode.id)
    setSelectedPaymentModeName(matchedMode.mode_name)
  }
}, [combinedSummary, outletPaymentModes, selectedPaymentModeId])



const handlePaymentModeChange = (modeId: number) => {
  const selectedMode = outletPaymentModes.find((m) => m.id === modeId)
  if (!selectedMode) return

  console.log('💳 Payment mode changed to:', selectedMode.mode_name)
  
  setSelectedPaymentModeId(modeId)
  setSelectedPaymentModeName(selectedMode.mode_name || 'Cash')
  setIsPaymentModeChanging(true)

  // Update the combined summary with new payment method
  if (combinedSummary) {
    setCombinedSummary({
      ...combinedSummary,
      payment_method: selectedMode.mode_name || 'Cash',
      payment_methods: [selectedMode.mode_name || 'Cash'],
    })
  }

  setIsPaymentModeChanging(false)
}
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
      // 1. Room number map
      const roomMap = await fetchRoomNumbers()
      setRoomNumberMap(roomMap)

      // 2. API call that returns both details AND summary
      const roomIdsCommaString = Array.from(selectedRooms)
        .map((roomNo) => displayRows.find((r) => r.room_number === roomNo)?.room_id)
        .filter((id): id is number => id !== null && id !== undefined)
        .join(',')

      const fullDetailsRes = await RoomService.getCheckinFullDetails(
        hotelId,
        checkinIdFromState,
        roomIdsCommaString || undefined,
      )

      console.log('📦 Full API Response:', fullDetailsRes)

      let details: any[] = []
      let summary: any[] = []

      if (fullDetailsRes.data) {
        if (Array.isArray(fullDetailsRes.data)) {
          details = fullDetailsRes.data || []
          summary = []
          console.log('📦 Using old format (array)')
        } else if (fullDetailsRes.data.details !== undefined) {
          details = fullDetailsRes.data.details || []
          summary = fullDetailsRes.data.summary || []
          console.log(`📦 New format: ${details.length} details, ${summary.length} summary`)
        } else {
          details = fullDetailsRes.data as any || []
          summary = []
        }
      }

      if (!details.length) {
        navigate('/hotel-master/HotelBookingPanel', { replace: true })
        return
      }

      // 3. Build display rows from the DETAILS result set
      const roomCumulativeMap = new Map<string, number>()
      const displayRowsResult: DisplayDetailRow[] = details.map((row: any, idx: number) => {
        const isPostCharge = !!row.is_post_charge
        const roomNumber = row.room_number ? String(row.room_number) : `Room-${row.room_id}`
        const totalAmount = roundToTwo(toNumber(row.total_amount))

        const prevCumulative = roomCumulativeMap.get(roomNumber) || 0
        const cumulativeTotal = roundToTwo(prevCumulative + totalAmount)
        roomCumulativeMap.set(roomNumber, cumulativeTotal)

        return {
          id: `${isPostCharge ? 'post' : 'room'}-${row.guest_room_charges_id}-${idx}`,
          guest_room_charges_id: row.guest_room_charges_id,
          checkin_id: row.checkin_id ?? 0,
          guest_id: row.guest_id,
          detail_id: row.detail_id ?? undefined,
          room_id: row.room_id,
          room_number: roomNumber,
          room_category_name: isPostCharge
            ? row.department_name || '-'
            : row.room_category_name || '-',
          converted_category_name: isPostCharge
            ? '-'
            : row.converted_category_name || '-',
          bill_date: row.checkin_datetime || '',
          detail_checkin_datetime: row.detail_checkin_datetime || row.checkin_datetime || '',
          bill_date_formatted: formatBillDate(row.detail_checkin_datetime || row.checkin_datetime || ''),
          checkin_datetime: row.checkin_datetime || '',
          checkout_datetime: row.checkout_datetime || '',
          no_of_days: isPostCharge ? 0 : 1,
          day_number: isPostCharge ? 0 : toNumber(row.day_number) || 1,
          original_day_number: isPostCharge ? 0 : toNumber(row.original_day_number) || toNumber(row.day_number) || 1,
          room_tariff: isPostCharge ? totalAmount : toNumber(row.room_tariff),
          total_room_tariff: isPostCharge ? totalAmount : toNumber(row.room_tariff),
          ex_pax_count: toNumber(row.ex_pax_count),
          ex_pax_price: toNumber(row.ex_pax_price),
          ex_pax_tax: toNumber(row.ex_pax_tax),
          ex_pax_tax_percent: toNumber(row.ex_pax_tax_percent),
          ex_pax_total: toNumber(row.ex_pax_total),
          child_count: toNumber(row.child_count),
          child_unpaid: toNumber(row.detail_child_unpaid),
          child_price: toNumber(row.child_price),
          child_tax: toNumber(row.child_tax),
          child_tax_percent: toNumber(row.child_tax_percent),
          child_total: toNumber(row.child_total),
          driver_count: toNumber(row.driver_count),
          driver_price: toNumber(row.driver_price),
          driver_tax: toNumber(row.driver_tax),
          driver_tax_percent: toNumber(row.driver_tax_percent),
          driver_total: toNumber(row.driver_total),
          cgst_amount: toNumber(row.cgst_amount),
          sgst_amount: toNumber(row.sgst_amount),
          igst_amount: toNumber(row.igst_amount),
          cess_amount: toNumber(row.cess_amount),
          service_charge_amount: toNumber(row.service_charge_amount),
          adults: toNumber(row.adults),
          pax: toNumber(row.pax),
          ex_pax: toNumber(row.ex_pax),
          child_paid: toNumber(row.child_count),
          driver: toNumber(row.driver),
          discount_percent: isPostCharge ? 0 : toNumber(row.discount_percent),
          discount_amount: isPostCharge
            ? 0
            : roundToTwo((toNumber(row.room_tariff) * toNumber(row.discount_percent)) / 100),
          tax_percent: isPostCharge ? 0 : toNumber(row.tax_percent),
          tax_amount: isPostCharge ? 0 : toNumber(row.pax_tax),
          total_amount: totalAmount,
          is_extension: !!row.is_extension_day,
          isPostCharge,
          parent_detail_id: row.parent_detail_id ?? null,
          selected: true,
          cumulative_total: cumulativeTotal,
          guest_name: row.guest_name || 'Guest',
          payment_method: row.payment_method || 'Cash',
          created_at: row.charge_created_at || row.checkin_datetime,
          has_checkout_datetime: !!row.checkout_datetime,
          checkout_time_formatted: row.checkout_datetime ? formatDateTime(row.checkout_datetime) : '-',
          description: row.description || '',
          particulars: row.particulars || '',
          department_name: row.department_name || '',
           // ✅ ADD THESE LINES - Capture credit and debit from API
    credit_amount: toNumber(row.credit_amount) || 0,
    debit_amount: toNumber(row.debit_amount) || 0,
        }
      })

      setDisplayRows(displayRowsResult)

      // Bill date summary
      const billSummaryItems: BillDateSummaryItem[] = displayRowsResult.map((row, idx) => ({
        billDate: row.bill_date,
        billDateFormatted: row.bill_date_formatted,
        roomNumber: row.room_number,
        roomCategory: row.room_category_name,
        convertedCategory: row.converted_category_name,
        billNo: idx + 1,
        dayNumber: row.day_number,
        description: row.description,
        amount: row.room_tariff,
        total: row.total_amount,
        isExtension: row.is_extension,
        isPostCharge: row.isPostCharge,
        originalDayNumber: row.original_day_number,
      }))
      setBillDateSummary(billSummaryItems)

      // 4. USE THE SUMMARY FROM THE STORED PROCEDURE
      if (summary && summary.length > 0) {
        const summaryRow = summary[0]

        const roomNumbersArray = summaryRow.room_numbers_str
          ? summaryRow.room_numbers_str.split(', ').filter(Boolean)
          : []

        const combinedSummaryData: CombinedGuestSummary = {
          checkin_id: summaryRow.checkin_id || checkinIdFromState,
          guest_id: summaryRow.guest_id || 0,
          guest_name: summaryRow.guest_name || 'Guest',
          room_numbers: roomNumbersArray,
          room_categories: summaryRow.room_categories_str ? summaryRow.room_categories_str.split(', ').filter(Boolean) : [],
          converted_categories: summaryRow.converted_categories_str ? summaryRow.converted_categories_str.split(', ').filter(Boolean) : [],
          room_numbers_str: summaryRow.room_numbers_str || '',
          room_categories_str: summaryRow.room_categories_str || '',
          converted_categories_str: summaryRow.converted_categories_str || '',
          total_room_tariff: toNumber(summaryRow.total_room_tariff),
          total_ex_pax_charge: toNumber(summaryRow.total_ex_pax_charge),
          total_child_paid_amount: toNumber(summaryRow.total_child_paid_amount),
          total_driver_charge: toNumber(summaryRow.total_driver_charge),
          total_tax_amount: toNumber(summaryRow.total_tax_amount),
          total_amount: toNumber(summaryRow.total_amount),
          total_days: toNumber(summaryRow.total_days),
          total_adults: toNumber(summaryRow.total_adults),
          total_pax: toNumber(summaryRow.total_pax),
          total_ex_pax: toNumber(summaryRow.total_ex_pax),
          total_child_paid: toNumber(summaryRow.total_child_paid),
          total_child_unpaid: toNumber(summaryRow.total_child_unpaid),
          total_driver: toNumber(summaryRow.total_driver),
          avg_discount_percent: toNumber(summaryRow.avg_discount_percent),
          avg_tax_percent: toNumber(summaryRow.avg_tax_percent),
          has_extensions: Boolean(summaryRow.has_extensions),
          extension_count: toNumber(summaryRow.extension_count),
          extension_days: toNumber(summaryRow.extension_days),
          payment_methods: summaryRow.payment_method ? [summaryRow.payment_method] : ['Cash'],
          payment_method: summaryRow.payment_method || 'Cash',
          charges_ids: [],
          selected: true,
          original_checkin_datetime: summaryRow.original_checkin_datetime || '',
          final_checkout_datetime: summaryRow.final_checkout_datetime || '',
          guest_mobile: summaryRow.guest_mobile || '',
          guest_address: summaryRow.guest_address || '',
          guest_email: summaryRow.guest_email || '',
          guest_id_proof: '-',
          reg_no: summaryRow.reg_no || '',
          booking_ref: summaryRow.booking_ref || '',
          plan_name: summaryRow.plan_name || '',
           // ✅ ADD NEW FIELDS
    total_credit_amount: toNumber(summaryRow.total_credit_amount) || 0,
    total_debit_amount: toNumber(summaryRow.total_debit_amount) || 0,
        }

        setCombinedSummary(combinedSummaryData)

        setGeneratedBillNumber('')
        setPaymentTransactionId(`TXN${Date.now().toString().slice(-12)}`)
        setPaymentDate(formatBillDate(new Date().toISOString()))
        setPaymentBank(
          combinedSummaryData.payment_method === 'Credit Card' ? 'HDFC Bank Credit Card' : 'Cash',
        )

        const allRooms = Array.from(new Set(displayRowsResult.map(r => r.room_number)))
          .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
        setSelectedRooms(new Set(allRooms))

      } else {
        console.warn('⚠️ No summary from stored procedure, using basic data')
        
        const firstRow = details[0]
        const roomNumbersSet = new Set(displayRowsResult.map((r) => r.room_number))

        const guestNames = new Set<string>()
        displayRowsResult.forEach((r) => {
          if (r.guest_name && r.guest_name !== 'Guest') guestNames.add(r.guest_name)
        })
        const displayGuestName = guestNames.size > 0
          ? Array.from(guestNames).join(', ')
          : firstRow.guest_name || 'Guest'

        const fallbackSummary: CombinedGuestSummary = {
          checkin_id: checkinIdFromState,
          guest_id: firstRow.guest_id || 0,
          guest_name: displayGuestName,
          room_numbers: Array.from(roomNumbersSet),
          room_categories: [],
          converted_categories: [],
          room_numbers_str: Array.from(roomNumbersSet).join(', '),
          room_categories_str: '',
          converted_categories_str: '',
          total_room_tariff: 0,
          total_ex_pax_charge: 0,
          total_child_paid_amount: 0,
          total_driver_charge: 0,
          total_tax_amount: 0,
          total_amount: 0,
          total_days: 1,
          total_adults: 0,
          total_pax: 0,
          total_ex_pax: 0,
          total_child_paid: 0,
          total_child_unpaid: 0,
          total_driver: 0,
          avg_discount_percent: 0,
          avg_tax_percent: 0,
          has_extensions: false,
          extension_count: 0,
          extension_days: 0,
          payment_methods: firstRow.payment_method ? [firstRow.payment_method] : ['Cash'],
          payment_method: firstRow.payment_method || 'Cash',
          charges_ids: [],
          selected: true,
          original_checkin_datetime: '',
          final_checkout_datetime: '',
          guest_mobile: firstRow.mobile,
          guest_address: firstRow.address,
          guest_email: firstRow.emailed,
          guest_id_proof: '-',
          reg_no: firstRow.reg_no,
          booking_ref: firstRow.booking,
          plan_name: firstRow.plan_name,
        }
        setCombinedSummary(fallbackSummary)

        const allRooms = Array.from(roomNumbersSet).sort((a, b) =>
          a.localeCompare(b, undefined, { numeric: true }),
        )
        setSelectedRooms(new Set(allRooms))
      }

    } catch (err) {
      console.error('fetchData error:', err)
      setError('Failed to load data. Please try again.')
      toast.error('Failed to load room details')
    } finally {
      setLoading(false)
    }
  }

  // ==================== HELPER: Get filtered summary for selected rooms only ====================

 const getFilteredSummaryForSelectedRooms = (): CombinedGuestSummary | null => {
  if (!combinedSummary) return null

  // Get rows filtered by selected rooms
  const selectedRows = displayRows.filter((row) => selectedRooms.has(row.room_number))

  if (selectedRows.length === 0) return null

  // Calculate totals from selected rows
  const totalRoomTariff = selectedRows.reduce((sum, row) => sum + row.room_tariff, 0)
  const totalExPaxCharge = selectedRows.reduce((sum, row) => sum + row.ex_pax_total, 0)
  const totalChildPaidAmount = selectedRows.reduce((sum, row) => sum + row.child_total, 0)
  const totalDriverCharge = selectedRows.reduce((sum, row) => sum + row.driver_total, 0)
  const totalTaxAmount = selectedRows.reduce((sum, row) => sum + row.tax_amount, 0)
  const totalAmount = selectedRows.reduce((sum, row) => sum + row.total_amount, 0)
  const totalDiscountAmount = selectedRows.reduce((sum, row) => sum + row.discount_amount, 0)

  // ✅ CORRECTED: Calculate unique days, adults, and pax
  // 1. Total Days = number of unique bill dates (for room charges only, not post charges)
  const billDates = new Set(
    selectedRows
      .filter(r => !r.isPostCharge)
      .map(r => r.bill_date_formatted)
  )
  const totalDays = billDates.size || 1 // At least 1 day

  // 2. Adults and Pax: Take max per room (since adults/pax should be consistent across days)
  const roomAdultsMap = new Map<string, number>()
  const roomPaxMap = new Map<string, number>()
  const roomExPaxMap = new Map<string, number>()
  const roomChildMap = new Map<string, number>()
  const roomDriverMap = new Map<string, number>()

  selectedRows.forEach(row => {
    if (!row.isPostCharge) {
      const room = row.room_number
      
      // Take max adults per room (should be same across days, but just in case)
      if (!roomAdultsMap.has(room) || row.adults > roomAdultsMap.get(room)!) {
        roomAdultsMap.set(room, row.adults)
      }
      if (!roomPaxMap.has(room) || row.pax > roomPaxMap.get(room)!) {
        roomPaxMap.set(room, row.pax)
      }
      if (!roomExPaxMap.has(room) || row.ex_pax_count > roomExPaxMap.get(room)!) {
        roomExPaxMap.set(room, row.ex_pax_count)
      }
      if (!roomChildMap.has(room) || row.child_count > roomChildMap.get(room)!) {
        roomChildMap.set(room, row.child_count)
      }
      if (!roomDriverMap.has(room) || row.driver_count > roomDriverMap.get(room)!) {
        roomDriverMap.set(room, row.driver_count)
      }
    }
  })

  const totalAdults = Array.from(roomAdultsMap.values()).reduce((sum, val) => sum + val, 0)
  const totalPax = Array.from(roomPaxMap.values()).reduce((sum, val) => sum + val, 0)
  const totalExPax = Array.from(roomExPaxMap.values()).reduce((sum, val) => sum + val, 0)
  const totalChildPaid = Array.from(roomChildMap.values()).reduce((sum, val) => sum + val, 0)
  const totalChildUnpaid = selectedRows.reduce((sum, row) => sum + (row.isPostCharge ? 0 : row.child_unpaid), 0)
  const totalDriver = Array.from(roomDriverMap.values()).reduce((sum, val) => sum + val, 0)

  // Get unique values from selected rows
  const uniqueRoomNumbers = Array.from(new Set(selectedRows.map((r) => r.room_number)))
  const uniqueRoomCategories = Array.from(
    new Set(selectedRows.map((r) => r.room_category_name).filter((c) => c !== '-'))
  )
  const uniqueConvertedCategories = Array.from(
    new Set(selectedRows.map((r) => r.converted_category_name).filter((c) => c !== '-'))
  )

  // Extension info
  const hasExtensions = selectedRows.some((row) => row.is_extension)
  const extensionCount = selectedRows.filter((row) => row.is_extension).length
  const extensionDays = selectedRows.filter((row) => row.is_extension).length

  // Average tax percent
  const avgTaxPercent = selectedRows.length > 0
    ? selectedRows.reduce((sum, row) => sum + row.tax_percent, 0) / selectedRows.length
    : 0

  // Credit and debit totals
  const total_credit_amount = selectedRows.reduce((sum, row) => sum + (row.credit_amount || 0), 0)
  const total_debit_amount = selectedRows.reduce((sum, row) => sum + (row.debit_amount || 0), 0)

  return {
    ...combinedSummary,
    room_numbers: uniqueRoomNumbers,
    room_numbers_str: uniqueRoomNumbers.join(', '),
    room_categories: uniqueRoomCategories,
    room_categories_str: uniqueRoomCategories.join(', '),
    converted_categories: uniqueConvertedCategories,
    converted_categories_str: uniqueConvertedCategories.join(', '),
    total_room_tariff: totalRoomTariff,
    total_ex_pax_charge: totalExPaxCharge,
    total_child_paid_amount: totalChildPaidAmount,
    total_driver_charge: totalDriverCharge,
    total_tax_amount: totalTaxAmount,
    total_amount: totalAmount,
    total_days: totalDays, // ✅ Now correctly shows unique days
    total_adults: totalAdults, // ✅ Now correctly shows total adults across rooms
    total_pax: totalPax, // ✅ Now correctly shows total pax across rooms
    total_ex_pax: totalExPax,
    total_child_paid: totalChildPaid,
    total_child_unpaid: totalChildUnpaid,
    total_driver: totalDriver,
    avg_tax_percent: avgTaxPercent,
    has_extensions: hasExtensions,
    extension_count: extensionCount,
    extension_days: extensionDays,
    total_discount_amount: totalDiscountAmount,
    total_credit_amount: total_credit_amount,
    total_debit_amount: total_debit_amount,
    payment_method: combinedSummary.payment_method || 'Cash',
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
          if ((row.department_name || '').toLowerCase().includes('advance')) return 4
          if (row.isPostCharge) return row.total_amount < 0 ? 3 : 2
          if (row.is_extension) return 1
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

  // ✅ grandTotal calculated from filtered rows (selected rooms only)
  const grandTotal = roundToTwo(
    selectedRowsForCheckout.reduce((sum, row) => sum + row.total_amount, 0),
  )

  const [editablePax, setEditablePax] = useState<number>(0)




  // ✅ filteredSummary for the Room Summary table (selected rooms only)
  const filteredSummary = getFilteredSummaryForSelectedRooms()

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

    // Generate invoice number
    let invoiceNo = ''
    try {
      const invoiceRes = await CheckoutService.getNextInvoiceNo()
      if (invoiceRes.success && invoiceRes.data?.ldg_bill_no) {
        invoiceNo = invoiceRes.data.ldg_bill_no
        console.log('📄 Fetched invoice number:', invoiceNo)
      }
    } catch (invoiceErr) {
      console.warn('⚠️ Could not fetch invoice number; server will auto-assign one', invoiceErr)
    }

    // Get selected room IDs
    const selectedRoomIds = Array.from(selectedRooms)
      .map(roomNo => {
        const row = displayRows.find(r => r.room_number === roomNo)
        return row?.room_id
      })
      .filter((id): id is number => id !== null && id !== undefined)

    const roomIdsCommaString = selectedRoomIds.join(',')

    // ✅ CRITICAL FIX: Get payment method with proper fallback
    const paymentMethod = selectedPaymentModeName || 
                         combinedSummary.payment_method || 
                         'Cash'
    
    console.log('💳 ===== CHECKOUT PAYMENT DETAILS =====')
    console.log('💳 selectedPaymentModeName:', selectedPaymentModeName)
    console.log('💳 combinedSummary.payment_method:', combinedSummary.payment_method)
    console.log('💳 Final paymentMethod:', paymentMethod)
    console.log('💳 selectedPaymentModeId:', selectedPaymentModeId)

    // Prepare checkout payload
    const checkoutPayload = {
      checkin_id: combinedSummary.checkin_id,
      checkout_reason: checkoutReason || 'Regular checkout',
      payment_id: selectedPaymentModeId ?? undefined,
      payment_mode: paymentMethod,
      payment_method: paymentMethod, // ✅ Explicitly set both
      total_amount: finalTotalAmount,
      room_id: roomIdsCommaString,
      round_off_amount: 0,
      net_payable: finalTotalAmount,
      selected_rooms: Array.from(selectedRooms),
      invoiceNoFromBody: invoiceNo,
      is_settle: 0,
      is_print: 1,
    }

    console.log('📤 Sending checkout payload:', JSON.stringify(checkoutPayload, null, 2))

    // Perform checkout
    const response = await CheckoutService.performCheckout(checkoutPayload)

    if (response.success) {
      // Set checkout ID
      if (response.data?.checkout_id) {
        setCheckoutId(response.data.checkout_id)
      }

      // Set bill number
      if (response.data?.ldg_bill_no) {
        setGeneratedBillNumber(response.data.ldg_bill_no)
      } else if (invoiceNo) {
        setGeneratedBillNumber(invoiceNo)
      }

      // Get checked out rooms
      const roomIdsCommaFromResponse = response.data?.checked_out_room_ids_comma ||
        (response.data?.checked_out_room_ids || []).join(', ')

      toast.success(`✅ Checkout completed for room ID(s): ${roomIdsCommaFromResponse}`)

      // Reset and show bill
      setShowCheckoutModal(false)
      setCheckoutReason('')
      setCheckoutDone(true)
      setShowBillModal(true)
    } else {
      toast.error(response.message || '❌ Checkout failed')
    }
  } catch (error: any) {
    console.error('❌ Checkout failed:', error)
    toast.error(error.response?.data?.message || 'Failed to process checkout')
  } finally {
    setCheckoutProcessing(false)
  }
}

  const handleCancelCheckout = () => {
    setShowCheckoutModal(false)
    setCheckoutReason('')
  }

  const uniqueRooms = Array.from(new Set(displayRows.map((row) => row.room_number))).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true }),
  )

  const filteredDisplayRowsForTable =
    selectedRoomFilter === 'all'
      ? filteredRowsByRoom
      : filteredRowsByRoom.filter((row) => row.room_number === selectedRoomFilter)

  const getRowClass = (row: DisplayDetailRow): string => {
    const dept = (row.department_name || '').toLowerCase()
    if (dept.includes('advance')) return 'advance-row'
    if (row.isPostCharge) return row.total_amount < 0 ? 'allowance-row' : 'postcharge-row'
    if (row.is_extension) return 'extension-row'
    return 'original-row'
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

  // ==================== RENDER ====================

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
          color: white;
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
        .first-table-container thead th { position: sticky; top: 0; background-color: #3d5eac; z-index: 10; }
        .bill-date-table-container { max-height: 200px; overflow: auto; border: 1px solid #dee2e6; background: white; }
        .bill-date-table-container thead th { position: sticky; top: 0; background-color: #3d5eac; z-index: 10; }
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
        .color-legend { display: flex; flex-wrap: wrap; gap: 10px; padding: 6px 12px; background: #f8f9fa; border-bottom: 1px solid #dee2e6; font-size: 0.7rem; align-items: center; }
        .legend-item { display: flex; align-items: center; gap: 5px; font-weight: 500; }
        .legend-dot { width: 14px; height: 14px; border-radius: 3px; flex-shrink: 0; border: 1px solid rgba(0,0,0,0.1); }
        .legend-dot-original { background-color: #ffffff; border: 1px solid #dee2e6; }
        .legend-dot-extension { background-color: #fff8e1; border-left: 3px solid #f9a825; }
        .legend-dot-postcharge { background-color: #e8eaf6; border-left: 3px solid #3949ab; }
        .legend-dot-allowance { background-color: #fce4ec; border-left: 3px solid #e91e63; }
        .legend-dot-advance { background-color: #e0f2f1; border-left: 3px solid #00897b; }
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
                      <div
                        style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', minHeight: 0 }}>
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
                                  setGraceCheckboxes({
                                    ...graceCheckboxes,
                                    exPax: e.target.checked,
                                  })
                                }
                              />
                              ExPax
                            </label>
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={graceCheckboxes.child}
                                onChange={(e) =>
                                  setGraceCheckboxes({
                                    ...graceCheckboxes,
                                    child: e.target.checked,
                                  })
                                }
                              />
                              Child
                            </label>
                            <label className="checkbox-label">
                              <input
                                type="checkbox"
                                checked={graceCheckboxes.driver}
                                onChange={(e) =>
                                  setGraceCheckboxes({
                                    ...graceCheckboxes,
                                    driver: e.target.checked,
                                  })
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
                        <div
                          className="date-wise-scroll"
                          style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
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
                                    <span className="bill-date-highlight">
                                      {row.bill_date_formatted}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div
                          className="info-box-value p-2 text-center"
                          style={{
                            fontSize: '12px',
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
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
                        <div
                          className="date-wise-scroll"
                          style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
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
                                    -{' '}
                                    <span className="bill-date-highlight">
                                      {r.bill_date_formatted}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div
                          className="info-box-value p-2 text-center"
                          style={{
                            fontSize: '12px',
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
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
                              <th>Discount Amt</th>
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
                            {filteredDisplayRowsForTable.map((row, idx) => {
                              const rowClass = getRowClass(row)
                              return (
                                <tr key={row.id} className={rowClass}>
                                  <td className="text-center">{idx + 1}</td>
                                  <td className="bill-date-highlight text-center">
                                    {row.bill_date_formatted}
                                  </td>
                                  <td>{row.guest_name}</td>
                                  <td className="text-center">{row.guest_id}</td>
                                  <td className="fw-bold text-center">{row.room_number}</td>
                                  <td>{row.room_category_name}</td>
                                  <td>
                                    {row.converted_category_name !== '-'
                                      ? row.converted_category_name
                                      : '-'}
                                  </td>
                                  <td>
                                    {row.isPostCharge ? (
                                      <span
                                        className={
                                          row.department_name === 'Advance'
                                            ? 'text-warning fw-bold'
                                            : row.total_amount < 0
                                              ? 'text-danger-bold'
                                              : 'text-primary'
                                        }>
                                        {row.description}
                                      </span>
                                    ) : (
                                      row.description
                                    )}
                                  </td>
                                  <td className="text-center">
                                    {row.isPostCharge ? '-' : row.adults}
                                  </td>
                                  <td className="text-center">
                                    {row.isPostCharge ? '-' : row.pax}
                                  </td>
                                  <td className="text-end">
                                    {formatAmountClean(row.room_tariff)}
                                  </td>
                                  <td className="text-center">
                                    {row.isPostCharge ? '-' : `${row.discount_percent}%`}
                                  </td>
                                  <td className="text-center">
                                    {row.isPostCharge ? '-' : `${row.discount_amount.toFixed(2)}`}
                                  </td>
                                  <td className="text-center">
                                    {row.isPostCharge ? '-' : `${row.tax_percent.toFixed(2)}%`}
                                  </td>
                                  <td className="text-end">
                                    {row.isPostCharge ? '-' : formatAmountClean(row.tax_amount)}
                                  </td>
                                  <td className="text-center">
                                    {row.isPostCharge ? '-' : row.ex_pax_count}
                                  </td>
                                  <td className="text-end">
                                    {row.isPostCharge ? '-' : formatAmountClean(row.ex_pax_price)}
                                  </td>
                                  <td className="text-center">
                                    {row.isPostCharge ? '-' : `${row.ex_pax_tax_percent}%`}
                                  </td>
                                  <td className="text-end">
                                    {row.isPostCharge ? '-' : formatAmountClean(row.ex_pax_total)}
                                  </td>
                                  <td className="text-center">
                                    {row.isPostCharge ? '-' : row.child_count}
                                  </td>
                                  <td className="text-end">
                                    {row.isPostCharge ? '-' : formatAmountClean(row.child_price)}
                                  </td>
                                  <td className="text-center">
                                    {row.isPostCharge ? '-' : `${row.child_tax_percent}%`}
                                  </td>
                                  <td className="text-end">
                                    {row.isPostCharge ? '-' : formatAmountClean(row.child_total)}
                                  </td>
                                  <td className="text-center">
                                    {row.isPostCharge ? '-' : row.driver_count}
                                  </td>
                                  <td className="text-end">
                                    {row.isPostCharge ? '-' : formatAmountClean(row.driver_price)}
                                  </td>
                                  <td className="text-center">
                                    {row.isPostCharge ? '-' : `${row.driver_tax_percent}%`}
                                  </td>
                                  <td className="text-end">
                                    {row.isPostCharge ? '-' : formatAmountClean(row.driver_total)}
                                  </td>
                                  <td className="fw-bold text-end">
                                    <span
                                      className={
                                        row.total_amount < 0 ? 'text-danger' : 'text-primary'
                                      }>
                                      {formatAmountClean(row.total_amount)}
                                    </span>
                                  </td>
                                  <td className="text-success fw-bold text-end">
                                    {formatAmountClean(row.cumulative_total)}
                                  </td>
                                </tr>
                              )
                            })}
                            {filteredDisplayRowsForTable.length === 0 && (
                              <tr>
                                <td colSpan={29} className="text-center py-4 text-muted">
                                  No rooms selected. Please select at least one room from the Room
                                  No. panel.
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

              {/* ==================== ROOM SUMMARY - TOTAL CHARGES ==================== */}
              <Card className="shadow-sm mb-3">
                <Card.Header className="bg-fo-header text-black py-1">
                  <span className="fw-bold">Room Summary - Total Charges</span>
                </Card.Header>
                <Card.Body className="p-0">
                  <div
                    className="scrollable-table"
                    style={{ maxHeight: '150px', overflow: 'auto' }}>
                    <table className="table-fo mb-0">
                      <thead className="bg-fo-header text-black">
                        <tr>
                          <th>Select</th>
                          <th style={{ minWidth: '150px', maxWidth: '200px' }}>Guest</th>
                          <th>Guest ID</th>
                          <th>Pay Method</th>
                          <th>Room No(s)</th>
                          <th>Room Category</th>
                          <th>Conv. Category</th>
                          <th>Total Days</th>
                          <th>Adults</th>
                          <th>Pax</th>
                          <th>Amount</th>
                          <th>Discount</th>
                          <th>Ex_Pax</th>
                          <th>Ex_Pax Total</th>
                          <th>Child</th>
                          <th>Child Total</th>
                          <th>Driver</th>
                          <th>Driver Total</th>
                          <th>Avg Tax%</th>
                          <th>Tax Amt</th>
                          <th>Total Amount</th>
                          <th>Debit Amount</th>
                          <th>Credit Amount</th>
                           
                        <th>Dummy PAX</th>

                        </tr>
                      </thead>
                      <tbody>
                        {/* ✅ USE FILTERED SUMMARY - ONLY SELECTED ROOMS */}
                        {filteredSummary && selectedRooms.size > 0 ? (
                          <tr className="combined-row-summary">
                            <td>
                              <Form.Check
                                type="checkbox"
                                checked={filteredSummary.selected}
                                onChange={(e) => handleGuestSummarySelect(e.target.checked)}
                              />
                            </td>
                            <td>{filteredSummary.guest_name}</td>
                            <td>{filteredSummary.guest_id}</td>
                        <td>
  {outletPaymentModes.length > 0 ? (
    <Form.Select
      size="sm"
      value={selectedPaymentModeId || ''}
      onChange={(e) => handlePaymentModeChange(Number(e.target.value))}
      disabled={isPaymentModeChanging || outletPaymentModes.length === 0}
      style={{
        minWidth: '100px',
        fontSize: '0.75rem',
        padding: '2px 6px',
        height: '28px',
        border: '1px solid #ced4da',
        borderRadius: '4px',
        backgroundColor: isPaymentModeChanging ? '#f8f9fa' : '#fff',
      }}
    >
      <option value="">Select Mode</option>
      {outletPaymentModes.map((mode) => (
        <option key={mode.id} value={mode.id}>
          {mode.mode_name || 'Unknown'}
        </option>
      ))}
    </Form.Select>
  ) : (
    <span className="text-muted" style={{ fontSize: '0.75rem' }}>
      {combinedSummary?.payment_method || 'Cash'}
    </span>
  )}
</td>
                            <td className="room-numbers-cell fw-bold">
                              {filteredSummary.room_numbers_str || '-'}
                            </td>
                            <td className="text-wrap-cell">
                              {filteredSummary.room_categories_str || '-'}
                            </td>
                            <td className="text-wrap-cell">
                              {filteredSummary.converted_categories_str || '-'}
                            </td>
                            <td>{filteredSummary.total_days}</td>
                            <td>{filteredSummary.total_adults}</td>
                            <td>{filteredSummary.total_pax}</td>
                            <td>{formatAmountClean(filteredSummary.total_room_tariff)}</td>
                            <td>{formatAmountClean(filteredSummary.total_discount_amount || 0)}</td>
                            <td>{filteredSummary.total_ex_pax}</td>
                            <td>{formatAmountClean(filteredSummary.total_ex_pax_charge)}</td>
                            <td>{filteredSummary.total_child_paid}</td>
                            <td>{formatAmountClean(filteredSummary.total_child_paid_amount)}</td>
                            <td>{filteredSummary.total_driver}</td>
                            <td>{formatAmountClean(filteredSummary.total_driver_charge)}</td>
                            <td>{filteredSummary.avg_tax_percent.toFixed(2)}%</td>
                            <td>{formatAmountClean(filteredSummary.total_tax_amount)}</td>
                            <td className="fw-bold text-primary">
                              {formatAmountClean(filteredSummary.total_amount)}
                            </td>
                            <td className="fw-bold text-success">
                {formatAmountClean(filteredSummary.total_credit_amount || 0)}
              </td>
              <td className="fw-bold text-danger">
                {formatAmountClean(filteredSummary.total_debit_amount || 0)}
              </td>
              <td>
                <Form.Control
                  type="number"
                  size="sm"
                  value={editablePax}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0
                    setEditablePax(val)
                  }}
                  onBlur={() => {
                    // Update the filteredSummary when user finishes editing
                    if (filteredSummary && editablePax !== filteredSummary.total_pax) {
                      // You can optionally call an API to update the pax count
                      console.log(`Pax updated from ${filteredSummary.total_pax} to ${editablePax}`)
                      // Update the summary data
                      setCombinedSummary(prev => prev ? {
                        ...prev,
                        total_pax: editablePax
                      } : null)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      (e.target as HTMLInputElement).blur()
                    }
                  }}
                  style={{
                    width: '60px',
                    display: 'inline-block',
                    padding: '2px 4px',
                    fontSize: '0.85rem'
                  }}
                />
              </td>
              
                          </tr>
                        ) : (
                          <tr>
                            <td colSpan={21} className="text-center text-muted py-2">
                              {selectedRooms.size === 0 ? 'No rooms selected' : 'No data available'}
                            </td>
                          </tr>
                        )}
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
              <div>
                <strong>Guest:</strong> {combinedSummary?.guest_name || 'N/A'}
              </div>
              <div>
                <strong>Guest ID:</strong> {combinedSummary?.guest_id || 'N/A'}
              </div>
              <div>
                <strong>Selected Rooms:</strong> {Array.from(selectedRooms).join(', ') || 'None'}
              </div>
              <div>
                <strong>Room Numbers:</strong> {combinedSummary?.room_numbers_str || '-'}
              </div>
              <div>
                <strong>From:</strong>{' '}
                {displayRows.length ? displayRows[0].bill_date_formatted : '-'}
              </div>
              <div>
                <strong>To:</strong>{' '}
                {displayRows.length ? displayRows[displayRows.length - 1].bill_date_formatted : '-'}
              </div>
              <div className="radio-group ms-auto">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="viewType"
                    value="datawise"
                    checked={viewType === 'datawise'}
                    onChange={() => setViewType('datawise')}
                  />{' '}
                  Datewise
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="viewType"
                    value="billtype"
                    checked={viewType === 'billtype'}
                    onChange={() => setViewType('billtype')}
                  />{' '}
                  Bill Type Wise
                </label>
              </div>
              <Button
                variant="outline-secondary"
                size="sm"
                className="refresh-btn"
                onClick={fetchData}>
                <i className="fi fi-rr-refresh me-1"></i> Refresh
              </Button>
            </div>
            <div className="px-3 py-2 overflow-auto" style={{ paddingBottom: '60px' }}>
              <Row className="mb-2 g-0">
                <Col md={12} className="pe-0">
                  <Card className="shadow-sm h-100">
                    <Card.Header className="bg-fo-header text-white py-1">
                      <span className="fw-bold text-black">Bill Date Summary</span>
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
                                  <td className="bill-date-highlight">
                                    {item.bill_date_formatted}
                                  </td>
                                  <td className="fw-bold">{item.room_number}</td>
                                  <td>{idx + 1}</td>
                                  <td>{item.isPostCharge ? '-' : item.day_number}</td>
                                  <td>
                                    {item.isPostCharge ? (
                                      <span
                                        className={
                                          item.total_amount < 0
                                            ? 'text-danger-bold'
                                            : 'text-primary'
                                        }>
                                        {item.description}
                                      </span>
                                    ) : (
                                      item.description
                                    )}
                                  </td>
                                  <td className="text-end">
                                    {formatAmountClean(item.room_tariff)}
                                  </td>
                                  <td className="fw-bold text-end">
                                    <span
                                      className={
                                        item.total_amount < 0 ? 'text-danger' : 'text-primary'
                                      }>
                                      {formatAmountClean(item.total_amount)}
                                    </span>
                                  </td>
                                </tr>
                              )
                            })}
                            {filteredRowsByRoom.length === 0 && (
                              <tr>
                                <td colSpan={7} className="text-center">
                                  No rooms selected
                                </td>
                              </tr>
                            )}
                            <tfoot>
                              <tr className="bg-light fw-bold">
                                <td colSpan={6} className="text-end">
                                  Total:
                                </td>
                                <td className="text-danger text-end">
                                  {formatAmountClean(grandTotal)}
                                </td>
                              </tr>
                            </tfoot>
                          </tbody>
                        </table>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </div>

            <div className="px-3 py-2 overflow-auto" style={{ paddingBottom: '60px' }}>
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
                              <td className="bill-date-highlight text-center">
                                {row.bill_date_formatted}
                              </td>
                              <td className="fw-bold text-center">{row.room_number}</td>
                              <td>{row.payment_method || 'Cash'}</td>
                              <td>{row.room_category_name}</td>
                              <td className="text-center">
                                {row.isPostCharge ? '-' : row.day_number}
                              </td>
                              <td className="text-center">{row.isPostCharge ? '-' : row.adults}</td>
                              <td className="text-center">
                                {row.isPostCharge ? '-' : row.ex_pax_count}
                              </td>
                              <td className="text-end">
                                {row.isPostCharge ? '-' : formatAmountClean(row.ex_pax_price)}
                              </td>
                              <td className="text-end">
                                {row.isPostCharge ? '-' : formatAmountClean(row.ex_pax_total)}
                              </td>
                              <td className="text-center">
                                {row.isPostCharge ? '-' : row.child_count}
                              </td>
                              <td className="text-end">
                                {row.isPostCharge ? '-' : formatAmountClean(row.child_price)}
                              </td>
                              <td className="text-end">
                                {row.isPostCharge ? '-' : formatAmountClean(row.child_total)}
                              </td>
                              <td className="text-center">
                                {row.isPostCharge ? '-' : row.driver_count}
                              </td>
                              <td className="text-end">
                                {row.isPostCharge ? '-' : formatAmountClean(row.driver_price)}
                              </td>
                              <td className="text-end">
                                {row.isPostCharge ? '-' : formatAmountClean(row.driver_total)}
                              </td>
                              <td className="text-end">
                                {formatAmountClean(row.room_tariff)}
                              </td>
                              <td className="text-center">
                                {row.isPostCharge ? '-' : `${row.tax_percent.toFixed(2)}%`}
                              </td>
                              <td className="text-end">
                                {row.isPostCharge ? '-' : formatAmountClean(row.tax_amount)}
                              </td>
                              <td className="fw-bold text-end">
                                <span
                                  className={row.total_amount < 0 ? 'text-danger' : 'text-primary'}>
                                  {formatAmountClean(row.total_amount)}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                        {filteredRowsByRoom.length === 0 && (
                          <tr>
                            <td colSpan={20} className="text-center py-4 text-muted">
                              No rooms selected. Please select at least one room from the Room No.
                              panel.
                            </td>
                          </tr>
                        )}
                      </tbody>
                      <tfoot>
                        <tr className="bg-light fw-bold">
                          <td colSpan={19} className="text-end">
                            Grand Total:
                          </td>
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
                <div
                  className="fw-bold fs-5"
                  style={{ color: grandTotal < 0 ? '#00897b' : '#dc3545' }}>
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
                Advance:{' '}
                <strong style={{ color: '#00897b' }}>
                  -{formatAmountClean(pendingAdvanceAmount)}
                </strong>
                <br />
                Net Payable:{' '}
                <strong style={{ color: grandTotal < 0 ? '#00897b' : '#dc3545' }}>
                  {grandTotal < 0
                    ? `Credit: ${formatAmountClean(Math.abs(grandTotal))}`
                    : formatAmountClean(grandTotal)}
                </strong>
              </>
            ) : (
              <>
                Total Amount:{' '}
                <strong className="text-danger">{formatAmountClean(grandTotal)}</strong>
              </>
            )}
          </p>
        </Modal.Body>
        <Modal.Footer className="justify-content-center border-0 pb-3 pt-0 gap-1">
          <Button
            variant="success"
            onClick={handleConfirmCheckout}
            disabled={checkoutProcessing}
            style={{ minWidth: '100px' }}>
            <i className="fi fi-rr-sign-out-alt me-1"></i>
            {checkoutProcessing ? 'Processing...' : 'Checkout'}
          </Button>
          <Button
            variant="secondary"
            onClick={handleCancelCheckout}
            disabled={checkoutProcessing}
            style={{ minWidth: '50px' }}>
            <i className="fi fi-rr-cross me-1"></i>Cancel
          </Button>
        </Modal.Footer>
      </Modal>

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
            Amount Collected:{' '}
            <strong className="text-danger">{formatAmountClean(grandTotal)}</strong>
          </p>
        </Modal.Body>
        <Modal.Footer className="justify-content-center border-0 pb-3 pt-0 gap-2">
          <Button
            variant="primary"
            onClick={() => setShowBillModal(true)}
            style={{ minWidth: '120px' }}>
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