// HotelReport.tsx - Complete updated code with Occupancy Report as default & Fixed Daily Sell Report

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Dropdown, Form } from 'react-bootstrap'
import { toast } from 'react-hot-toast'
import TitleHelmet from '@/components/Common/TitleHelmet'
import { useAuthContext } from '@/common/context/useAuthContext'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import RoomService from '@/common/hotel/room'
import RoomCategoryService from '@/common/hotel/roomCategoryService'
import FloorService from '@/common/hotel/floors'
import CheckInService, { CheckIn } from '@/common/hotel/checkIn'
import CheckoutPaymentService from '@/common/hotel/checkoutPayment'
import CheckoutService from '@/common/hotel/checkout'
import CheckoutDetailService from '@/common/hotel/checkoutDetail'
import AgentRoomCheckinService from '@/common/hotel/agentRoomCheckin'
import GuestFolioService, { GuestFolio } from '@/common/hotel/guestFolio'
import GuestRoomChargesService, { GuestRoomCharge } from '@/common/hotel/guestRoomCharges'
import BrandService from '@/common/hotel/brand'
import DetailService from '@/common/hotel/detail'
import PostChargesService from '@/common/hotel/postCharges'
import AdvanceTransactionService from '@/common/hotel/advanceTransaction'

// ==================== TYPE DEFINITIONS ====================
type ReportType = 'occupancy' | 'collection' | 'paymentMode' | 'pendingPayment' | 'agentBooking'

interface OccupancyReportRow {
  srNo: number
  floorNo: string
  roomNo: string
  roomCategory: string
  convertedCategory: string
  guestName: string
  totalDays: number
  totalAmt: number
  discountPercent: number
  payType: string
  planName: string
  checkinDatetime: string
  checkoutDatetime: string
  adults: number
  pax: number
  exPax: number
  child: number
  driver: number
}

interface CollectionReportRow {
  srNo: number
  transactionDate: string
  invoiceNo: string
  roomNo: string
  guestName: string
  paymentMethod: string
  amount: number
  regNo: string
}

interface PaymentModeReportRow {
  srNo: number
  paymentMethod: string
  transactionCount: number
  totalAmount: number
  percentage: number
}

interface PendingPaymentReportRow {
  srNo: number
  roomNo: string
  guestName: string
  checkinDatetime: string
  checkoutDatetime: string
  totalCharges: number
  totalPaid: number
  pendingAmount: number
  regNo: string
}

interface AgentBookingReportRow {
  srNo: number
  agentName: string
  bookingDate: string
  roomNo: string
  guestName: string
  checkinDatetime: string
  checkoutDatetime: string
  commissionAmount: number
  totalRoomCharges: number
  payToHotel: number
  status: string
  regNo: string
  bookingId: string
}

interface ApiRoom {
  room_id: number
  room_no: string
  room_name: string
  room_category_id: number
  room_status: string
  floor_id: number
  hotelid: number
}

interface ApiCategory {
  room_category_id: number
  category_name: string
  room_tariff?: number
  ex_pax_charge?: number
  child_charge?: number
  driver_charge?: number
}

interface ApiFloor {
  floor_id: number
  floor_name: string
  floor_number: number
}

// Extended CheckIn type
interface ExtendedCheckIn extends Omit<CheckIn, 'booking'> {
  agent_id?: number | null
  agent_name?: string | null
  booking?: string
  reg_no?: string
  checkout_id?: number
}

// ==================== HELPER FUNCTIONS ====================
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

const formatDate = (isoString: string): string => {
  if (!isoString) return 'N/A'
  const d = new Date(isoString)
  const day = d.getDate().toString().padStart(2, '0')
  const month = d.toLocaleString('default', { month: 'short' }).replace('.', '')
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

const formatAmount = (amt: number): string => {
  const n = Number(amt)
  if (!isFinite(n)) return '₹0.00'
  const sign = n < 0 ? '-' : ''
  return `₹${sign}${Math.abs(n).toFixed(2)}`
}

const reportDisplayNames = {
  occupancy: 'Occupancy Report',
  collection: 'Daily Sales Report',
  paymentMode: 'Payment Mode Report',
  pendingPayment: 'Pending Payment Report',
  agentBooking: 'Agent Booking Report',
}

// Helper function to check if a date is within range (including same day)
const isDateInRange = (dateStr: string, startDate: Date, endDate: Date): boolean => {
  if (!dateStr) return false
  const date = new Date(dateStr)
  date.setHours(0, 0, 0, 0)
  return date >= startDate && date <= endDate
}

// ==================== MAIN COMPONENT ====================
const HotelReport = () => {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const hotelId = user?.hotelid
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // State
  const [selectedReport, setSelectedReport] = useState<ReportType>('occupancy')
  const [fromDate, setFromDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [toDate, setToDate] = useState<string>(() => new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)
  const [hotelName, setHotelName] = useState<string>('')

  // Report Data States
  const [occupancyData, setOccupancyData] = useState<OccupancyReportRow[]>([])
  const [collectionData, setCollectionData] = useState<CollectionReportRow[]>([])
  const [paymentModeData, setPaymentModeData] = useState<PaymentModeReportRow[]>([])
  const [pendingPaymentData, setPendingPaymentData] = useState<PendingPaymentReportRow[]>([])
  const [agentBookingData, setAgentBookingData] = useState<AgentBookingReportRow[]>([])

  // Helper data
  const [rooms, setRooms] = useState<ApiRoom[]>([])
  const [categories, setCategories] = useState<ApiCategory[]>([])
  const [floors, setFloors] = useState<ApiFloor[]>([])
  const [activeCheckins, setActiveCheckins] = useState<ExtendedCheckIn[]>([])
  const [allCheckins, setAllCheckins] = useState<ExtendedCheckIn[]>([])
  const [baseDataLoaded, setBaseDataLoaded] = useState(false)

  // ==================== ESC KEY HANDLER ====================
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        navigate(-1)
      }
    }
    document.addEventListener('keydown', handleEscKey)
    return () => {
      document.removeEventListener('keydown', handleEscKey)
    }
  }, [navigate])

  // Fetch hotel name
  useEffect(() => {
    if (!hotelId) return
    const fetchHotelName = async () => {
      try {
        if (user?.hotel_name) setHotelName(user.hotel_name)
        else {
          const response = await BrandService.getBrandById(String(hotelId))
          const hotelData = response?.data || response
          setHotelName(hotelData?.hotel_name || 'Hotel')
        }
      } catch {
        setHotelName('Hotel')
      }
    }
    fetchHotelName()
  }, [hotelId, user])

  // Fetch base data FIRST
  useEffect(() => {
    if (!hotelId) return
    const fetchBaseData = async () => {
      try {
        const [roomsRes, catsRes, floorsRes, checkinsRes] = await Promise.all([
          RoomService.list({ hotelid: hotelId }),
          RoomCategoryService.list({ hotelid: Number(hotelId) }),
          FloorService.list({ hotelid: hotelId }),
          CheckInService.list({ hotelid: hotelId }),
        ])
        const roomsData = (roomsRes.data || []) as ApiRoom[]
        const catsData = (catsRes.data || []) as ApiCategory[]
        const floorsData = (floorsRes.data || []) as ApiFloor[]
        const allCheckinsData = (checkinsRes.data || []) as ExtendedCheckIn[]
        const activeCheckinsData = allCheckinsData.filter((c: ExtendedCheckIn) => c.status === 'active')

        setRooms(roomsData)
        setCategories(catsData)
        setFloors(floorsData)
        setAllCheckins(allCheckinsData)
        setActiveCheckins(activeCheckinsData)
        setBaseDataLoaded(true)
      } catch (err) {
        console.error('Failed to fetch base data:', err)
        toast.error('Failed to load base data')
      }
    }
    fetchBaseData()
  }, [hotelId])

  useEffect(() => {
    if (!hotelId || !baseDataLoaded) return
    fetchReportData()
  }, [selectedReport, fromDate, toDate, baseDataLoaded])

  const fetchReportData = async () => {
    if (!hotelId) return
    setLoading(true)
    
    try {
      if (selectedReport === 'occupancy') {
        await fetchOccupancyReport()
      } else if (selectedReport === 'collection') {
        await fetchCollectionReport()
      } else if (selectedReport === 'paymentMode') {
        await fetchPaymentModeReport()
      } else if (selectedReport === 'pendingPayment') {
        await fetchPendingPaymentReport()
      } else if (selectedReport === 'agentBooking') {
        await fetchAgentBookingReport()
      }
    } catch (err) {
      console.error(`Failed to fetch ${selectedReport} report:`, err)
      toast.error('Failed to load report data')
    } finally {
      setLoading(false)
    }
  }

  // Function to calculate overlapping days between two date ranges
  const getOverlappingDays = (
    checkinStart: Date,
    checkinEnd: Date,
    reportStart: Date,
    reportEnd: Date
  ): number => {
    const overlapStart = checkinStart < reportStart ? reportStart : checkinStart
    const overlapEnd = checkinEnd > reportEnd ? reportEnd : checkinEnd
    if (overlapEnd <= overlapStart) return 0
    return Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 3600 * 24))
  }

  // 1. OCCUPANCY REPORT
  const buildOccupancyReport = async (
    roomsData: ApiRoom[],
    catsData: ApiCategory[],
    floorsData: ApiFloor[],
    activeCheckinsData: ExtendedCheckIn[],
    allCheckinsData: ExtendedCheckIn[],
  ) => {
    const categoryMap = new Map(catsData.map(c => [c.room_category_id, c.category_name]))
    const floorMap = new Map(floorsData.map(f => [f.floor_id, f.floor_name]))

    const startDateFilter = new Date(fromDate)
    startDateFilter.setHours(0, 0, 0, 0)
    const endDateFilter = new Date(toDate)
    endDateFilter.setHours(23, 59, 59, 999)

    const rows: OccupancyReportRow[] = []
    let srNo = 1

    const filteredCheckins = activeCheckinsData.filter(checkin => {
      const checkinDate = new Date(checkin.checkin_datetime)
      const checkoutDate = new Date(checkin.checkout_datetime)
      return (checkinDate <= endDateFilter && checkoutDate >= startDateFilter)
    })

    for (const checkin of filteredCheckins) {
      try {
        const detailsRes = await DetailService.list({ checkin_id: checkin.checkin_id })
        const activeDetails = (detailsRes.data || []).filter((d: any) => d.is_checkout === 0)
        
        const chargesRes = await GuestRoomChargesService.list({ checkin_id: checkin.checkin_id })
        const charges = chargesRes.data || []
        
        const foliosRes = await GuestFolioService.list({ checkin_id: checkin.checkin_id })
        const folios = foliosRes.data || []
        
        let payType = 'Cash'
        if (folios.length > 0) {
          payType = folios[0].payment_method || 'Cash'
        }
        
        const roomCategory = categoryMap.get(checkin.category_id ?? 0) || checkin.converted_category || '-'
        const roomData = roomsData.find(r => r.room_no === checkin.room_no)
        const floorName = floorMap.get(roomData?.floor_id || 0) || '-'
        
        const checkinDate = new Date(checkin.checkin_datetime)
        const checkoutDate = new Date(checkin.checkout_datetime)
        const originalTotalDays = Math.max(1, Math.ceil((checkoutDate.getTime() - checkinDate.getTime()) / (1000 * 3600 * 24)))
        
        const overlappingDays = getOverlappingDays(checkinDate, checkoutDate, startDateFilter, endDateFilter)
        const totalDays = Math.max(1, overlappingDays)
        
        let totalAmt = 0
        for (const charge of charges) {
          totalAmt += Number(charge.total_amount) || 0
        }
        if (totalAmt === 0 && checkin.total_amount) {
          totalAmt = checkin.total_amount
        }
        
        const proratedAmt = (totalAmt / originalTotalDays) * totalDays
        
        let discountPercent = 0
        if (activeDetails.length > 0) {
          discountPercent = activeDetails[0].discount_percent || 0
        }
        
        if (activeDetails.length > 0) {
          for (const detail of activeDetails) {
            let roomTotalAmt = 0
            const roomCharges = charges.filter((c: any) => c.room_id === detail.room_id)
            for (const charge of roomCharges) {
              roomTotalAmt += Number(charge.total_amount) || 0
            }
            
            try {
              const postChargesRes = await PostChargesService.list({ checkin_id: checkin.checkin_id, hotelid: hotelId })
              const postCharges = postChargesRes.data || []
              const roomPostCharges = postCharges.filter((c: any) => c.room_id === detail.room_id)
              let postChargesTotal = 0
              for (const pc of roomPostCharges) {
                if (pc.transaction_type === 'CHARGE') {
                  postChargesTotal += Number(pc.total_amount) || 0
                } else if (pc.transaction_type === 'ALLOWANCE') {
                  postChargesTotal -= Number(pc.total_amount) || 0
                }
              }
              roomTotalAmt += postChargesTotal
            } catch (err) {
              console.warn('Failed to fetch post charges', err)
            }
            
            let pendingAdvance = 0
            try {
              const advRes = await AdvanceTransactionService.list({ checkin_id: checkin.checkin_id })
              if (advRes.success && advRes.data) {
                const roomCredits = new Map<number, number>()
                const roomDebits = new Map<number, number>()
                let globalCredits = 0
                let globalDebits = 0
                
                for (const t of advRes.data) {
                  const rid = t.room_id
                  const isCredit = t.transaction_type === 'Booking Receipt' || t.transaction_type === 'Advance Addition'
                  const isDebit = t.transaction_type === 'Advance Posting' || t.transaction_type === 'Advance Refund'
                  if (t.status !== 'active') continue
                  if (!rid) {
                    if (isCredit) globalCredits += Number(t.credit_amount) || 0
                    if (isDebit) globalDebits += Number(t.debit_amount) || 0
                  } else {
                    if (isCredit) roomCredits.set(rid, (roomCredits.get(rid) || 0) + (Number(t.credit_amount) || 0))
                    if (isDebit) roomDebits.set(rid, (roomDebits.get(rid) || 0) + (Number(t.debit_amount) || 0))
                  }
                }
                
                const hasRoomSpecific = roomCredits.size > 0
                if (hasRoomSpecific) {
                  pendingAdvance = (roomCredits.get(detail.room_id) || 0) - (roomDebits.get(detail.room_id) || 0)
                } else {
                  pendingAdvance = globalCredits - globalDebits
                }
              }
            } catch (err) {
              console.warn('Failed to fetch advance', err)
            }
            
            const netRoomAmount = Math.max(0, (roomTotalAmt / originalTotalDays) * totalDays - pendingAdvance)
            
            rows.push({
              srNo: srNo++,
              floorNo: floorName,
              roomNo: detail.room_number || checkin.room_no,
              roomCategory: roomCategory,
              convertedCategory: detail.converted_category_name || checkin.converted_category || '-',
              guestName: checkin.guest_name,
              totalDays: totalDays,
              totalAmt: netRoomAmount,
              discountPercent: discountPercent,
              payType: payType,
              planName: checkin.plan_name || '-',
              checkinDatetime: formatDateTime(detail.checkin_datetime || checkin.checkin_datetime),
              checkoutDatetime: formatDateTime(detail.checkout_datetime || checkin.checkout_datetime),
              adults: detail.adults || checkin.adults || 0,
              pax: detail.pax || checkin.pax || 0,
              exPax: detail.ex_pax || checkin.ex_pax || 0,
              child: (checkin.child_paid || 0) + (checkin.child_unpaid || 0),
              driver: detail.driver || Number(checkin.driver) || 0,
            })
          }
        } else {
          rows.push({
            srNo: srNo++,
            floorNo: floorName,
            roomNo: checkin.room_no,
            roomCategory: roomCategory,
            convertedCategory: checkin.converted_category || '-',
            guestName: checkin.guest_name,
            totalDays: totalDays,
            totalAmt: proratedAmt,
            discountPercent: 0,
            payType: payType,
            planName: checkin.plan_name || '-',
            checkinDatetime: formatDateTime(checkin.checkin_datetime),
            checkoutDatetime: formatDateTime(checkin.checkout_datetime),
            adults: checkin.adults || 0,
            pax: checkin.pax || 0,
            exPax: checkin.ex_pax || 0,
            child: (checkin.child_paid || 0) + (checkin.child_unpaid || 0),
            driver: Number(checkin.driver) || 0,
          })
        }
      } catch (err) {
        console.warn(`Failed to fetch details for checkin ${checkin.checkin_id}`, err)
        const roomData = roomsData.find(r => r.room_no === checkin.room_no)
        const floorName = floorMap.get(roomData?.floor_id || 0) || '-'
        const roomCategory = categoryMap.get(checkin.category_id ?? 0) || checkin.converted_category || '-';
        
        const checkinDate = new Date(checkin.checkin_datetime)
        const checkoutDate = new Date(checkin.checkout_datetime)
        const originalTotalDays = Math.max(1, Math.ceil((checkoutDate.getTime() - checkinDate.getTime()) / (1000 * 3600 * 24)))
        
        const overlappingDays = getOverlappingDays(checkinDate, checkoutDate, startDateFilter, endDateFilter)
        const totalDays = Math.max(1, overlappingDays)
        const proratedAmt = ((checkin.total_amount || 0) / originalTotalDays) * totalDays
        
        rows.push({
          srNo: srNo++,
          floorNo: floorName,
          roomNo: checkin.room_no,
          roomCategory: roomCategory,
          convertedCategory: checkin.converted_category || '-',
          guestName: checkin.guest_name,
          totalDays: totalDays,
          totalAmt: proratedAmt,
          discountPercent: 0,
          payType: 'Cash',
          planName: checkin.plan_name || '-',
          checkinDatetime: formatDateTime(checkin.checkin_datetime),
          checkoutDatetime: formatDateTime(checkin.checkout_datetime),
          adults: checkin.adults || 0,
          pax: checkin.pax || 0,
          exPax: checkin.ex_pax || 0,
          child: (checkin.child_paid || 0) + (checkin.child_unpaid || 0),
          driver: Number(checkin.driver) || 0,
        })
      }
    }

    rows.sort((a, b) => {
      if (a.floorNo !== b.floorNo) return a.floorNo.localeCompare(b.floorNo)
      return a.roomNo.localeCompare(b.roomNo, undefined, { numeric: true })
    })
    
    rows.forEach((row, idx) => { row.srNo = idx + 1 })
    setOccupancyData(rows)
  }

  const fetchOccupancyReport = async () => {
    if (!hotelId) return
    await buildOccupancyReport(rooms, categories, floors, activeCheckins, allCheckins)
  }

  // 2. COLLECTION REPORT (DAILY SELL REPORT) - Fetches from all 5 checkout tables
  const fetchCollectionReport = async () => {
    if (!hotelId) return
    
    try {
      const startDate = new Date(fromDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(toDate)
      endDate.setHours(23, 59, 59, 999)

      // Fetch data from all checkout-related tables
      const [paymentsRes, checkoutsRes, detailsRes] = await Promise.all([
        CheckoutPaymentService.list({}),
        CheckoutService.list({ hotelid: hotelId }),
        CheckoutDetailService.list({ hotelid: hotelId })
      ])
      
      const payments = paymentsRes.data || []
      const checkouts = checkoutsRes.data || []
      const checkoutDetails = detailsRes.data || []
      
      // Create maps for quick lookups
      const checkoutMap = new Map<number, any>()
      for (const co of checkouts) {
        checkoutMap.set(co.checkout_id, co)
      }
      
      const checkoutDetailMap = new Map<number, any[]>()
      for (const cd of checkoutDetails) {
        if (!checkoutDetailMap.has(cd.checkout_id)) {
          checkoutDetailMap.set(cd.checkout_id, [])
        }
        checkoutDetailMap.get(cd.checkout_id)!.push(cd)
      }
      
      // Filter payments by date range
      const filteredPayments = payments.filter((payment: any) => {
        const transDate = new Date(payment.transaction_datetime || payment.created_date)
        return transDate >= startDate && transDate <= endDate
      })
      
      const allTransactions: CollectionReportRow[] = []
      
      // Process payments
      for (const payment of filteredPayments) {
        const checkoutInfo = checkoutMap.get(payment.checkout_id)
        const details = checkoutDetailMap.get(payment.checkout_id) || []
        
        // Get room numbers (for multiple rooms in partial checkout)
        let roomNumbers = '-'
        if (details.length > 0) {
          roomNumbers = details.map(d => d.room_number).join(', ')
        } else if (checkoutInfo?.checked_out_rooms) {
          try {
            const parsedRooms = JSON.parse(checkoutInfo.checked_out_rooms)
            roomNumbers = Array.isArray(parsedRooms) ? parsedRooms.join(', ') : checkoutInfo.room_no || '-'
          } catch {
            roomNumbers = checkoutInfo?.room_no || '-'
          }
        } else if (checkoutInfo?.room_no) {
          roomNumbers = checkoutInfo.room_no
        }
        
        allTransactions.push({
          srNo: 0,
          transactionDate: formatDateTime(payment.transaction_datetime || payment.created_date),
          invoiceNo: payment.invoice_no || '-',
          roomNo: roomNumbers,
          guestName: checkoutInfo?.guest_name || '-',
          paymentMethod: payment.payment_method || 'Cash',
          amount: payment.net_payable || payment.total_amount || 0,
          regNo: checkoutInfo?.reg_no || '-',
        })
      }
      
      // Also include checkouts that were completed without a payment record (fallback)
      const checkoutsWithPayment = new Set(filteredPayments.map(p => p.checkout_id))
      const checkoutsWithoutPayments = checkouts.filter(co => {
        const checkoutDate = new Date(co.checkout_date || co.created_date)
        return !checkoutsWithPayment.has(co.checkout_id) && 
               checkoutDate >= startDate && 
               checkoutDate <= endDate
      })
      
      for (const co of checkoutsWithoutPayments) {
        const details = checkoutDetailMap.get(co.checkout_id) || []
        
        let roomNumbers = '-'
        if (details.length > 0) {
          roomNumbers = details.map(d => d.room_number).join(', ')
        } else if (co.checked_out_rooms) {
          try {
            const parsedRooms = JSON.parse(co.checked_out_rooms)
            roomNumbers = Array.isArray(parsedRooms) ? parsedRooms.join(', ') : co.room_no || '-'
          } catch {
            roomNumbers = co.room_no || '-'
          }
        } else if (co.room_no) {
          roomNumbers = co.room_no
        }
        
        allTransactions.push({
          srNo: 0,
          transactionDate: formatDateTime(co.checkout_date || co.created_date),
          invoiceNo: '-',
          roomNo: roomNumbers,
          guestName: co.guest_name || '-',
          paymentMethod: 'Cash',
          amount: co.total_amount || 0,
          regNo: co.reg_no || '-',
        })
      }
      
      // Sort by transaction date
      allTransactions.sort((a, b) => 
        new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
      )
      allTransactions.forEach((row, idx) => { row.srNo = idx + 1 })
      
      setCollectionData(allTransactions)
      
    } catch (err) {
      console.error('Failed to fetch collection report:', err)
      toast.error('Failed to load collection report data')
      setCollectionData([])
    }
  }

  // 3. PAYMENT MODE REPORT
  const fetchPaymentModeReport = async () => {
    if (!hotelId) return
    
    try {
      const startDate = new Date(fromDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(toDate)
      endDate.setHours(23, 59, 59, 999)

      const paymentsRes = await CheckoutPaymentService.list({})
      const payments = paymentsRes.data || []
      
      const filteredPayments = payments.filter((payment: any) => {
        const transDate = new Date(payment.transaction_datetime || payment.created_date)
        return transDate >= startDate && transDate <= endDate
      })
      
      const paymentMethodMap = new Map<string, { count: number; total: number }>()

      for (const payment of filteredPayments) {
        const amount = payment.net_payable || payment.total_amount || 0
        const key = payment.payment_method || 'Cash'
        const existing = paymentMethodMap.get(key) || { count: 0, total: 0 }
        paymentMethodMap.set(key, {
          count: existing.count + 1,
          total: existing.total + amount,
        })
      }

      const totalAmount = Array.from(paymentMethodMap.values()).reduce((sum, v) => sum + v.total, 0)
      
      const rows: PaymentModeReportRow[] = Array.from(paymentMethodMap.entries())
        .map(([method, data], index) => ({
          srNo: index + 1,
          paymentMethod: method,
          transactionCount: data.count,
          totalAmount: data.total,
          percentage: totalAmount > 0 ? (data.total / totalAmount) * 100 : 0,
        }))
        .sort((a, b) => b.totalAmount - a.totalAmount)

      setPaymentModeData(rows)
    } catch (err) {
      console.error('Failed to fetch payment mode report:', err)
      setPaymentModeData([])
    }
  }

  // 4. PENDING PAYMENT REPORT
  const fetchPendingPaymentReport = async () => {
    if (!hotelId) return
    
    try {
      const endDate = new Date(toDate)
      endDate.setHours(23, 59, 59, 999)

      const filteredCheckins = activeCheckins.filter(checkin => {
        const checkinDate = new Date(checkin.checkin_datetime)
        return checkinDate <= endDate
      })
      
      const rows: PendingPaymentReportRow[] = []
      
      for (const checkin of filteredCheckins) {
        const chargesRes = await GuestRoomChargesService.list({ checkin_id: checkin.checkin_id })
        const charges = chargesRes.data || []
        
        const foliosRes = await GuestFolioService.list({ checkin_id: checkin.checkin_id })
        const folios = foliosRes.data || []
        
        const totalCharges = charges.reduce((sum, c: GuestRoomCharge) => sum + (Number(c.total_amount) || 0), 0)
        const totalPaid = folios.reduce((sum, f: GuestFolio) => sum + (Number(f.debit_amount) || 0), 0)
        const pendingAmount = totalCharges - totalPaid
        
        if (pendingAmount > 0) {
          rows.push({
            srNo: 0,
            roomNo: checkin.room_no,
            guestName: checkin.guest_name,
            checkinDatetime: formatDateTime(checkin.checkin_datetime),
            checkoutDatetime: formatDateTime(checkin.checkout_datetime),
            totalCharges,
            totalPaid,
            pendingAmount,
            regNo: checkin.reg_no || '-',
          })
        }
      }
      
      rows.sort((a, b) => b.pendingAmount - a.pendingAmount)
      rows.forEach((row, idx) => { row.srNo = idx + 1 })
      
      setPendingPaymentData(rows)
    } catch (err) {
      console.error('Failed to fetch pending payment report:', err)
      setPendingPaymentData([])
    }
  }

  // 5. AGENT BOOKING REPORT
  const fetchAgentBookingReport = async () => {
    if (!hotelId) return
    
    try {
      const startDate = new Date(fromDate)
      startDate.setHours(0, 0, 0, 0)
      const endDate = new Date(toDate)
      endDate.setHours(23, 59, 59, 999)
      
      const rows: AgentBookingReportRow[] = []

      for (const checkin of allCheckins) {
        try {
          const agentRes = await AgentRoomCheckinService.getByCheckinId(checkin.checkin_id)
          const agentRecords = agentRes.data || []
          
          if (agentRecords.length > 0) {
            for (const agentRecord of agentRecords) {
              const bookingDateStr = (agentRecord as any).booking_date || checkin.checkin_datetime
              
              const isBookingDateInRange = isDateInRange(bookingDateStr, startDate, endDate)
              const isCheckinDateInRange = isDateInRange(checkin.checkin_datetime, startDate, endDate)
              
              if (isBookingDateInRange || isCheckinDateInRange) {
                const guestName = (agentRecord as any).guest_name || checkin.guest_name || '-'
                const roomNo = agentRecord.room_number || (agentRecord as any).room_no || checkin.room_no || '-'
                const regNo = (agentRecord as any).reg_no || checkin.reg_no || '-'
                const bookingId = (agentRecord as any).booking_id || '-'
                const agentName = agentRecord.agent_name || 'Unknown Agent'
                const checkinDt = formatDateTime((agentRecord as any).checkin_datetime || checkin.checkin_datetime)
                const checkoutDt = formatDateTime((agentRecord as any).checkout_datetime || checkin.checkout_datetime)
                const status = (agentRecord as any).status || checkin.status || 'active'
                const commissionAmount = Number(agentRecord.commission_amount) || 
                                         Number((agentRecord as any).agent_total_commission) || 0
                const totalRoomCharges = Number((agentRecord as any).total_room_charges) || 0
                const payToHotel = Number((agentRecord as any).agent_pay_to_hotel) || 0
                
                rows.push({
                  srNo: 0,
                  agentName,
                  bookingDate: formatDate(bookingDateStr),
                  roomNo,
                  guestName,
                  checkinDatetime: checkinDt,
                  checkoutDatetime: checkoutDt,
                  commissionAmount,
                  totalRoomCharges,
                  payToHotel,
                  status,
                  regNo,
                  bookingId,
                })
              }
            }
          }
        } catch (err) {
          console.debug(`No agent record for checkin ${checkin.checkin_id}`)
        }
      }
      
      const uniqueRows = rows.filter((row, index, self) => 
        index === self.findIndex((r) => r.regNo === row.regNo && r.bookingId === row.bookingId)
      )
      
      uniqueRows.sort((a, b) => new Date(b.bookingDate).getTime() - new Date(a.bookingDate).getTime())
      uniqueRows.forEach((row, idx) => { row.srNo = idx + 1 })
      
      setAgentBookingData(uniqueRows)
      
    } catch (err) {
      console.error('Failed to fetch agent booking report:', err)
      toast.error('Failed to load agent booking report data')
      setAgentBookingData([])
    }
  }

  // EXPORT FUNCTIONS
  const exportToExcel = () => {
    let data: any[] = []
    let filename = ''
    
    if (selectedReport === 'occupancy') {
      data = occupancyData.map(row => ({
        'Sr. No': row.srNo,
        'Floor No': row.floorNo,
        'Room No': row.roomNo,
        'Room Category': row.roomCategory,
        'Converted Category': row.convertedCategory,
        'Guest': row.guestName,
        'Total Days': row.totalDays,
        'Total Amt': row.totalAmt,
        'Discount %': row.discountPercent,
        'Pay Type': row.payType,
        'Plan Name': row.planName,
        'Check-in Date & Time': row.checkinDatetime,
        'Check-out Date & Time': row.checkoutDatetime,
        'Adults': row.adults,
        'Pax': row.pax,
        'Ex-Pax': row.exPax,
        'Child': row.child,
        'Driver': row.driver,
      }))
      filename = `occupancy_report_${fromDate}_to_${toDate}`
    } else if (selectedReport === 'collection') {
      data = collectionData.map(row => ({
        'Sr. No': row.srNo,
        'Transaction Date': row.transactionDate,
        'Invoice No': row.invoiceNo,
        'Room No': row.roomNo,
        'Guest Name': row.guestName,
        'Payment Method': row.paymentMethod,
        'Amount': row.amount,
        'Reg No': row.regNo,
      }))
      filename = `collection_report_${fromDate}_to_${toDate}`
    } else if (selectedReport === 'paymentMode') {
      data = paymentModeData.map(row => ({
        'Sr. No': row.srNo,
        'Payment Method': row.paymentMethod,
        'Transaction Count': row.transactionCount,
        'Total Amount': row.totalAmount,
        'Percentage (%)': row.percentage.toFixed(2),
      }))
      filename = `payment_mode_report_${fromDate}_to_${toDate}`
    } else if (selectedReport === 'pendingPayment') {
      data = pendingPaymentData.map(row => ({
        'Sr. No': row.srNo,
        'Room No': row.roomNo,
        'Guest Name': row.guestName,
        'Check-in Date & Time': row.checkinDatetime,
        'Check-out Date & Time': row.checkoutDatetime,
        'Total Charges': row.totalCharges,
        'Total Paid': row.totalPaid,
        'Pending Amount': row.pendingAmount,
        'Reg No': row.regNo,
      }))
      filename = `pending_payment_report_${fromDate}_to_${toDate}`
    } else if (selectedReport === 'agentBooking') {
      data = agentBookingData.map(row => ({
        'Sr. No': row.srNo,
        'Agent Name': row.agentName,
        'Booking Date': row.bookingDate,
        'Room No': row.roomNo,
        'Guest Name': row.guestName,
        'Check-in Date & Time': row.checkinDatetime,
        'Check-out Date & Time': row.checkoutDatetime,
        'Commission Amount': row.commissionAmount,
        'Total Room Charges': row.totalRoomCharges,
        'Pay to Hotel': row.payToHotel,
        'Status': row.status,
        'Reg No': row.regNo,
        'Booking ID': row.bookingId,
      }))
      filename = `agent_booking_report_${fromDate}_to_${toDate}`
    }
    
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Report')
    XLSX.writeFile(wb, `${filename}.xlsx`)
    toast.success('Report exported to Excel')
  }

  const exportToPDF = async () => {
    try {
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 10
      const usableWidth = pageWidth - margin * 2

      pdf.setFontSize(14)
      pdf.setFont('helvetica', 'bold')
      pdf.text(hotelName, margin, margin + 6)

      pdf.setFontSize(11)
      pdf.setFont('helvetica', 'normal')
      pdf.text(reportDisplayNames[selectedReport], margin, margin + 13)

      pdf.setFontSize(8)
      pdf.setTextColor(100)
      pdf.text(
        `Period: ${formatDate(fromDate)} to ${formatDate(toDate)}   |   Generated: ${formatDateTime(new Date().toISOString())}`,
        margin,
        margin + 19,
      )
      pdf.setTextColor(0)

      let startY = margin + 25

      const drawTable = (
        headers: string[],
        rows: string[][],
        colWidths: number[],
        footerRows?: string[][],
      ) => {
        const rowH = 7
        const headerH = 8
        const cellPad = 2

        const drawRow = (
          cols: string[],
          y: number,
          isBold: boolean,
          bgColor?: [number, number, number],
        ) => {
          let x = margin
          if (bgColor) {
            pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2])
            pdf.rect(x, y, usableWidth, rowH, 'F')
          }
          pdf.setDrawColor(200)
          pdf.setFont('helvetica', isBold ? 'bold' : 'normal')
          pdf.setFontSize(7)
          for (let i = 0; i < cols.length; i++) {
            const col = cols[i] || ''
            pdf.rect(x, y, colWidths[i], rowH)
            const cleanCol = String(col).replace(/&nbsp;/g, ' ').replace(/₹/g, 'Rs.')
            pdf.text(cleanCol, x + cellPad, y + rowH - cellPad - 0.5)
            x += colWidths[i]
          }
        }

        drawRow(headers, startY, true, [220, 220, 220])
        startY += headerH

        for (const row of rows) {
          if (startY + rowH > pageHeight - margin - (footerRows ? footerRows.length * rowH + 4 : 0)) {
            pdf.addPage()
            startY = margin
            drawRow(headers, startY, true, [220, 220, 220])
            startY += headerH
          }
          drawRow(row, startY, false)
          startY += rowH
        }

        if (footerRows && footerRows.length > 0) {
          startY += 2
          for (const fRow of footerRows) {
            drawRow(fRow, startY, true, [240, 240, 240])
            startY += rowH
          }
        }
      }

      if (selectedReport === 'occupancy') {
        const headers = ['#', 'Floor No', 'Room No', 'Category', 'Converted', 'Guest', 'Days', 'Total Amt', 'Disc%', 'Pay Type', 'Adults', 'Pax', 'Ex-Pax', 'Child', 'Driver']
        const colW = [5, 12, 12, 15, 15, 22, 8, 18, 8, 12, 8, 8, 8, 8, 8]
        const totalWidth = colW.reduce((a, b) => a + b, 0)
        const adjustedColW = colW.map(w => (w / totalWidth) * usableWidth)
        
        const rows = occupancyData.map(r => [
          String(r.srNo), r.floorNo, r.roomNo, r.roomCategory, r.convertedCategory,
          r.guestName, String(r.totalDays), formatAmount(r.totalAmt).replace('₹', 'Rs.'),
          `${r.discountPercent}%`, r.payType,
          String(r.adults), String(r.pax), String(r.exPax), String(r.child), String(r.driver),
        ])
        
        const totalRooms = occupancyData.length
        const totalAmount = occupancyData.reduce((sum, r) => sum + r.totalAmt, 0)
        const footerRows = [['', '', '', '', '', `Total Rooms: ${totalRooms}`, '', formatAmount(totalAmount).replace('₹', 'Rs.'), '', '', '', '', '', '', '']]
        drawTable(headers, rows, adjustedColW, footerRows)

      } else if (selectedReport === 'collection') {
        const headers = ['#', 'Transaction Date', 'Invoice No', 'Room No', 'Guest Name', 'Payment Method', 'Amount', 'Reg No']
        const colW = [8, 36, 28, 18, 35, 30, 25, 35]
        const totalWidth = colW.reduce((a, b) => a + b, 0)
        const adjustedColW = colW.map(w => (w / totalWidth) * usableWidth)
        const rows = collectionData.map(r => [
          String(r.srNo), r.transactionDate, r.invoiceNo, r.roomNo,
          r.guestName, r.paymentMethod, formatAmount(r.amount).replace('₹', 'Rs.'), r.regNo,
        ])
        const totalCollection = collectionData.reduce((sum, r) => sum + r.amount, 0)
        const footerRows = [['', '', '', '', '', 'Total Collection:', formatAmount(totalCollection).replace('₹', 'Rs.'), '']]
        drawTable(headers, rows, adjustedColW, footerRows)

      } else if (selectedReport === 'paymentMode') {
        const headers = ['#', 'Payment Method', 'Transaction Count', 'Total Amount', 'Percentage']
        const colW = [15, 60, 45, 45, 40]
        const totalWidth = colW.reduce((a, b) => a + b, 0)
        const adjustedColW = colW.map(w => (w / totalWidth) * usableWidth)
        const rows = paymentModeData.map(r => [
          String(r.srNo), r.paymentMethod,
          String(r.transactionCount), formatAmount(r.totalAmount).replace('₹', 'Rs.'),
          `${r.percentage.toFixed(2)}%`,
        ])
        const grandTotal = paymentModeData.reduce((sum, r) => sum + r.totalAmount, 0)
        const footerRows = [['', 'Grand Total', '', formatAmount(grandTotal).replace('₹', 'Rs.'), '100%']]
        drawTable(headers, rows, adjustedColW, footerRows)

      } else if (selectedReport === 'pendingPayment') {
        const headers = ['#', 'Room No', 'Guest Name', 'Check-in', 'Check-out', 'Total Charges', 'Total Paid', 'Pending Amt', 'Reg No']
        const colW = [8, 16, 30, 36, 36, 25, 22, 25, 30]
        const totalWidth = colW.reduce((a, b) => a + b, 0)
        const adjustedColW = colW.map(w => (w / totalWidth) * usableWidth)
        const rows = pendingPaymentData.map(r => [
          String(r.srNo), r.roomNo, r.guestName, r.checkinDatetime, r.checkoutDatetime,
          formatAmount(r.totalCharges).replace('₹', 'Rs.'), formatAmount(r.totalPaid).replace('₹', 'Rs.'), 
          formatAmount(r.pendingAmount).replace('₹', 'Rs.'), r.regNo,
        ])
        const totalPending = pendingPaymentData.reduce((sum, r) => sum + r.pendingAmount, 0)
        const footerRows = [['', '', '', '', '', '', 'Total Pending:', formatAmount(totalPending).replace('₹', 'Rs.'), '']]
        drawTable(headers, rows, adjustedColW, footerRows)

      } else if (selectedReport === 'agentBooking') {
        const headers = ['#', 'Agent Name', 'Booking Date', 'Room No', 'Reg No', 'Booking ID', 'Guest Name', 'Check-in', 'Check-out', 'Commission', 'Room Charges', 'Pay to Hotel', 'Status']
        const colW = [6, 22, 18, 12, 18, 18, 25, 18, 18, 18, 10, 18, 15]
        const totalWidth = colW.reduce((a, b) => a + b, 0)
        const adjustedColW = colW.map(w => (w / totalWidth) * usableWidth)
        const rows = agentBookingData.map(r => [
          String(r.srNo), r.agentName, r.bookingDate, r.roomNo, r.regNo, r.bookingId, r.guestName,
          r.checkinDatetime, r.checkoutDatetime,
          formatAmount(r.commissionAmount).replace('₹', 'Rs.'), 
          formatAmount(r.totalRoomCharges).replace('₹', 'Rs.'),
          formatAmount(r.payToHotel).replace('₹', 'Rs.'), r.status
        ])
        const totalCommission = agentBookingData.reduce((sum, r) => sum + r.commissionAmount, 0)
        const totalRoomCharges = agentBookingData.reduce((sum, r) => sum + r.totalRoomCharges, 0)
        const totalPayToHotel = agentBookingData.reduce((sum, r) => sum + r.payToHotel, 0)
        const footerRows = [['', '', '', '', '', '', 'Totals:', 
          formatAmount(totalCommission).replace('₹', 'Rs.'), 
          formatAmount(totalRoomCharges).replace('₹', 'Rs.'), 
          formatAmount(totalPayToHotel).replace('₹', 'Rs.'), '', '', '']]
        drawTable(headers, rows, adjustedColW, footerRows)
      }

      pdf.save(`${reportDisplayNames[selectedReport].toLowerCase().replace(/ /g, '_')}_${fromDate}_to_${toDate}.pdf`)
      toast.success('Report exported to PDF')
    } catch (err) {
      console.error(err)
      toast.error('PDF generation failed')
    }
  }

  const getReportTitle = () => {
    return reportDisplayNames[selectedReport]
  }

  const getReportTotals = () => {
    if (selectedReport === 'occupancy') {
      const totalRooms = occupancyData.length
      const totalAmount = occupancyData.reduce((sum, r) => sum + r.totalAmt, 0)
      return { totalRooms, totalAmount }
    } else if (selectedReport === 'collection') {
      const total = collectionData.reduce((sum, r) => sum + r.amount, 0)
      return { total, count: collectionData.length }
    } else if (selectedReport === 'paymentMode') {
      const total = paymentModeData.reduce((sum, r) => sum + r.totalAmount, 0)
      return { total, count: paymentModeData.length }
    } else if (selectedReport === 'pendingPayment') {
      const total = pendingPaymentData.reduce((sum, r) => sum + r.pendingAmount, 0)
      return { total, count: pendingPaymentData.length }
    } else if (selectedReport === 'agentBooking') {
      const totalCommission = agentBookingData.reduce((sum, r) => sum + r.commissionAmount, 0)
      const totalRoomCharges = agentBookingData.reduce((sum, r) => sum + r.totalRoomCharges, 0)
      const totalPayToHotel = agentBookingData.reduce((sum, r) => sum + r.payToHotel, 0)
      return { totalCommission, totalRoomCharges, totalPayToHotel, count: agentBookingData.length }
    }
    return {}
  }

  const totals = getReportTotals()

  const renderOccupancyFooter = () => {
    if (selectedReport !== 'occupancy') return null
    const t = totals as { totalRooms: number; totalAmount: number }
    return (
      <tfoot className="sticky-footer">
        <tr>
          {/* Columns 1-6: label */}
          <td colSpan={6} className="text-end fw-bold">Total Rooms: {t.totalRooms}</td>
          {/* Column 7: Total Days — blank */}
          <td></td>
          {/* Column 8: Total Amt — amount value aligned under Total Amt header */}
          <td className="fw-bold">{formatAmount(t.totalAmount)}</td>
          {/* Columns 9-15: blank */}
          <td colSpan={7}></td>
        </tr>
      </tfoot>
    )
  }

  const renderCollectionFooter = () => {
    if (selectedReport !== 'collection') return null
    const t = totals as { total: number; count: number }
    return (
      <tfoot className="sticky-footer">
        <tr>
          {/* Columns 1-6: label */}
          <td colSpan={6} className="text-end fw-bold">Total Collection:</td>
          {/* Column 7: Amount — aligned under Amount header */}
          <td className="fw-bold">{formatAmount(t.total)}</td>
          {/* Column 8: Reg No — blank */}
          <td></td>
        </tr>
        <tr>
          <td colSpan={6} className="text-end text-muted">Total Transactions:</td>
          <td className="fw-semibold">{t.count}</td>
          <td></td>
        </tr>
      </tfoot>
    )
  }

  const renderPaymentModeFooter = () => {
    if (selectedReport !== 'paymentMode') return null
    const t = totals as { total: number; count: number }
    return (
      <tfoot className="sticky-footer">
        <tr>
          <td colSpan={3} className="text-end fw-bold">Grand Total:</td>
          <td className="fw-bold">{formatAmount(t.total)}</td>
          <td>100%</td>
        </tr>
      </tfoot>
    )
  }

  const renderPendingPaymentFooter = () => {
    if (selectedReport !== 'pendingPayment') return null
    const t = totals as { total: number; count: number }
    const totalChargesSum = pendingPaymentData.reduce((sum, r) => sum + r.totalCharges, 0)
    const totalPaidSum = pendingPaymentData.reduce((sum, r) => sum + r.totalPaid, 0)
    return (
      <tfoot className="sticky-footer">
        <tr>
          {/* Cols 1-5: label */}
          <td colSpan={5} className="text-end fw-bold">Totals:</td>
          {/* Col 6: Total Charges */}
          <td className="fw-bold">{formatAmount(totalChargesSum)}</td>
          {/* Col 7: Total Paid */}
          <td className="fw-bold">{formatAmount(totalPaidSum)}</td>
          {/* Col 8: Pending Amount */}
          <td className="fw-bold text-danger">{formatAmount(t.total)}</td>
          {/* Col 9: Reg No */}
          <td></td>
        </tr>
        <tr>
          <td colSpan={5} className="text-end text-muted">Pending Invoices Count:</td>
          <td colSpan={4} className="fw-semibold">{t.count}</td>
        </tr>
      </tfoot>
    )
  }

  const renderAgentBookingFooter = () => {
    if (selectedReport !== 'agentBooking') return null
    const t = totals as { totalCommission: number; totalRoomCharges: number; totalPayToHotel: number; count: number }
    return (
      <tfoot className="sticky-footer">
        <tr>
          {/* Cols 1-9: label */}
          <td colSpan={9} className="text-end fw-bold">Totals:</td>
          {/* Col 10: Commission */}
          <td className="fw-bold">{formatAmount(t.totalCommission)}</td>
          {/* Col 11: Room Charges */}
          <td className="fw-bold">{formatAmount(t.totalRoomCharges)}</td>
          {/* Col 12: Pay to Hotel */}
          <td className="fw-bold">{formatAmount(t.totalPayToHotel)}</td>
          {/* Col 13: Status */}
          <td></td>
        </tr>
        <tr>
          <td colSpan={9} className="text-end text-muted">Total Agent Bookings:</td>
          <td colSpan={4} className="fw-semibold">{t.count}</td>
        </tr>
      </tfoot>
    )
  }

  return (
    <>
      <TitleHelmet title="Hotel Reports" />
      
      <style>{`
        .report-page {
          display: flex;
          flex-direction: column;
          height: 100vh;
          background-color: #fff;
          overflow: hidden;
        }
        .report-header-row {
          flex-shrink: 0;
          padding: 0.75rem 1rem;
          background-color: #fff;
          border-bottom: 1px solid #dee2e6;
          z-index: 20;
        }
        .report-table-wrapper {
          flex: 1;
          overflow: auto;
          position: relative;
        }
        .report-table-container {
          min-width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .report-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.75rem;
        }
        .report-table th,
        .report-table td {
          border: 1px solid #dee2e6;
          padding: 0.5rem 0.6rem;
          text-align: left;
          vertical-align: middle;
          white-space: nowrap;
        }
        .report-table th {
          background-color: #f8f9fa;
          font-weight: 600;
          position: sticky;
          top: 0;
          z-index: 10;
          white-space: nowrap;
        }
        .report-table tfoot td {
          background-color: #f8f9fa;
          font-weight: 600;
          border-top: 2px solid #dee2e6;
          position: sticky;
          bottom: 0;
          z-index: 10;
        }
        body.dark-mode .report-table th {
          background-color: #2c2c2c;
          color: #eee;
        }
        body.dark-mode .report-table td {
          border-color: #444;
        }
        body.dark-mode .report-table tfoot td {
          background-color: #2a2a2a;
        }
        .badge-status {
          display: inline-block;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.7rem;
          font-weight: 600;
          color: #fff;
        }
        .payment-progress {
          display: inline-block;
          height: 6px;
          background-color: #0d6efd;
          border-radius: 3px;
        }
        @media (max-width: 1400px) {
          .report-table th,
          .report-table td {
            padding: 0.35rem 0.4rem;
            font-size: 0.65rem;
          }
        }
      `}</style>

      <div className="report-page">
        <div className="report-header-row">
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <h5 className="mb-0 fw-bold">{hotelName}</h5>

              <Dropdown>
                <Dropdown.Toggle
                  variant="primary"
                  size="sm"
                  className="fw-semibold px-3">
                  <i className="fi fi-rr-chart-line me-1"></i>
                  {getReportTitle()}
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Header>Select Report</Dropdown.Header>
                  <Dropdown.Item
                    active={selectedReport === 'occupancy'}
                    onClick={() => setSelectedReport('occupancy')}>
                    Occupancy Report
                  </Dropdown.Item>
                  <Dropdown.Item
                    active={selectedReport === 'collection'}
                    onClick={() => setSelectedReport('collection')}>
                    Daily Sell Report
                  </Dropdown.Item>
                  <Dropdown.Item
                    active={selectedReport === 'paymentMode'}
                    onClick={() => setSelectedReport('paymentMode')}>
                    Payment Mode Report
                  </Dropdown.Item>
                  <Dropdown.Item
                    active={selectedReport === 'pendingPayment'}
                    onClick={() => setSelectedReport('pendingPayment')}>
                    Pending Payment Report
                  </Dropdown.Item>
                  <Dropdown.Item
                    active={selectedReport === 'agentBooking'}
                    onClick={() => setSelectedReport('agentBooking')}>
                    Agent Booking Report
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>

              <Form.Control
                type="date"
                size="sm"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{ width: '140px' }}
              />

              <Form.Control
                type="date"
                size="sm"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{ width: '140px' }}
              />
            </div>

            <div className="d-flex align-items-center gap-2">
              <Dropdown>
                <Dropdown.Toggle
                  variant="success"
                  size="sm"
                  className="fw-semibold px-3">
                  <i className="fi fi-rr-download me-1"></i>
                  Export
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item onClick={exportToExcel}>
                    Excel
                  </Dropdown.Item>
                  <Dropdown.Item onClick={exportToPDF}>
                    PDF
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>

              <Button
                variant="outline-primary"
                size="sm"
                onClick={fetchReportData}
                className="d-flex align-items-center justify-content-center"
                style={{ width: '35px', height: '32px' }}>
                <i className="fi fi-rr-refresh"></i>
              </Button>

              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => navigate(-1)}
                className="d-flex align-items-center justify-content-center"
                style={{ width: '35px', height: '32px' }}>
                <i className="fi fi-rr-cross"></i>
              </Button>
            </div>
          </div>
        </div>

        <div className="report-table-wrapper" ref={tableContainerRef}>
          {loading ? (
            <div className="d-flex justify-content-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="report-table-container">
              {/* OCCUPANCY REPORT TABLE */}
              {selectedReport === 'occupancy' && (
                <table className="report-table">
                  <thead>
                    <tr>
                      <th style={{ width: '3%' }}>#</th>
                      <th style={{ width: '6%' }}>Floor No</th>
                      <th style={{ width: '6%' }}>Room No</th>
                      <th style={{ width: '10%' }}>Room Category</th>
                      <th style={{ width: '10%' }}>Converted Category</th>
                      <th style={{ width: '12%' }}>Guest</th>
                      <th style={{ width: '5%' }}>Total Days</th>
                      <th style={{ width: '8%' }}>Total Amt</th>
                      <th style={{ width: '5%' }}>Discount %</th>
                      <th style={{ width: '7%' }}>Pay Type</th>
                      <th style={{ width: '4%' }}>Adults</th>
                      <th style={{ width: '4%' }}>Pax</th>
                      <th style={{ width: '5%' }}>Ex-Pax</th>
                      <th style={{ width: '4%' }}>Child</th>
                      <th style={{ width: '4%' }}>Driver</th>
                    </tr>
                  </thead>
                  <tbody>
                    {occupancyData.length === 0 ? (
                      <tr>
                        <td colSpan={15} className="text-center text-muted py-4">
                          No occupied rooms found for selected date range
                        </td>
                      </tr>
                    ) : (
                      occupancyData.map((row) => (
                        <tr key={row.srNo}>
                          <td>{row.srNo}</td>
                          <td>{row.floorNo}</td>
                          <td className="fw-semibold">{row.roomNo}</td>
                          <td>{row.roomCategory}</td>
                          <td>{row.convertedCategory}</td>
                          <td className="fw-semibold">{row.guestName}</td>
                          <td className="text-center">{row.totalDays}</td>
                          <td className="fw-semibold">{formatAmount(row.totalAmt)}</td>
                          <td className="text-center">{row.discountPercent}%</td>
                          <td>{row.payType}</td>
                          <td className="text-center">{row.adults}</td>
                          <td className="text-center">{row.pax}</td>
                          <td className="text-center">{row.exPax}</td>
                          <td className="text-center">{row.child}</td>
                          <td className="text-center">{row.driver}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {renderOccupancyFooter()}
                </table>
              )}

              {/* COLLECTION REPORT TABLE (DAILY SELL REPORT) */}
              {selectedReport === 'collection' && (
                <table className="report-table">
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}>#</th>
                      <th style={{ width: '15%' }}>Transaction Date</th>
                      <th style={{ width: '12%' }}>Invoice No</th>
                      <th style={{ width: '12%' }}>Room No</th>
                      <th style={{ width: '18%' }}>Guest Name</th>
                      <th style={{ width: '12%' }}>Payment Method</th>
                      <th style={{ width: '10%' }}>Amount</th>
                      <th style={{ width: '16%' }}>Reg No</th>
                    </tr>
                  </thead>
                  <tbody>
                    {collectionData.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center text-muted py-4">
                          No collection data available for selected period
                        </td>
                      </tr>
                    ) : (
                      collectionData.map((row) => (
                        <tr key={row.srNo}>
                          <td>{row.srNo}</td>
                          <td>{row.transactionDate}</td>
                          <td className="fw-semibold">{row.invoiceNo}</td>
                          <td className={row.roomNo !== '-' ? 'fw-semibold' : ''}>{row.roomNo}</td>
                          <td className={row.guestName !== '-' ? 'fw-semibold' : ''}>{row.guestName}</td>
                          <td>{row.paymentMethod}</td>
                          <td className="fw-semibold">{formatAmount(row.amount)}</td>
                          <td className={row.regNo !== '-' ? 'fw-semibold' : ''}>{row.regNo}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {renderCollectionFooter()}
                </table>
              )}

              {/* PAYMENT MODE REPORT TABLE */}
              {selectedReport === 'paymentMode' && (
                <table className="report-table">
                  <thead>
                    <tr>
                      <th style={{ width: '10%' }}>#</th>
                      <th style={{ width: '30%' }}>Payment Method</th>
                      <th style={{ width: '20%' }}>Transaction Count</th>
                      <th style={{ width: '20%' }}>Total Amount</th>
                      <th style={{ width: '20%' }}>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentModeData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center text-muted py-4">
                          No payment data available for selected period
                        </td>
                      </tr>
                    ) : (
                      paymentModeData.map((row) => (
                        <tr key={row.srNo}>
                          <td>{row.srNo}</td>
                          <td className="fw-semibold">{row.paymentMethod}</td>
                          <td className="text-center">{row.transactionCount}</td>
                          <td className="fw-semibold">{formatAmount(row.totalAmount)}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div
                                className="payment-progress"
                                style={{ width: `${Math.min(row.percentage, 100)}%`, maxWidth: '100px' }}>
                              </div>
                              <span>{row.percentage.toFixed(2)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {renderPaymentModeFooter()}
                </table>
              )}

              {/* PENDING PAYMENT REPORT TABLE */}
              {selectedReport === 'pendingPayment' && (
                <table className="report-table">
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}>#</th>
                      <th style={{ width: '8%' }}>Room No</th>
                      <th style={{ width: '12%' }}>Guest Name</th>
                      <th style={{ width: '15%' }}>Check-in Date & Time</th>
                      <th style={{ width: '15%' }}>Check-out Date & Time</th>
                      <th style={{ width: '10%' }}>Total Charges</th>
                      <th style={{ width: '10%' }}>Total Paid</th>
                      <th style={{ width: '12%' }}>Pending Amount</th>
                      <th style={{ width: '13%' }}>Reg No</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPaymentData.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="text-center text-muted py-4">
                          No pending payments found for selected period
                        </td>
                      </tr>
                    ) : (
                      pendingPaymentData.map((row) => (
                        <tr key={row.srNo} className={row.pendingAmount > 0 ? 'table-warning' : ''}>
                          <td>{row.srNo}</td>
                          <td>{row.roomNo}</td>
                          <td>{row.guestName}</td>
                          <td>{row.checkinDatetime}</td>
                          <td>{row.checkoutDatetime}</td>
                          <td>{formatAmount(row.totalCharges)}</td>
                          <td>{formatAmount(row.totalPaid)}</td>
                          <td className="fw-bold text-danger">{formatAmount(row.pendingAmount)}</td>
                          <td>{row.regNo}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {renderPendingPaymentFooter()}
                </table>
              )}

              {/* AGENT BOOKING REPORT TABLE */}
              {selectedReport === 'agentBooking' && (
                <table className="report-table">
                  <thead>
                    <tr>
                      <th style={{ width: '4%' }}>#</th>
                      <th style={{ width: '12%' }}>Agent Name</th>
                      <th style={{ width: '8%' }}>Booking Date</th>
                      <th style={{ width: '6%' }}>Room No</th>
                      <th style={{ width: '8%' }}>Reg No</th>
                      <th style={{ width: '8%' }}>Booking ID</th>
                      <th style={{ width: '10%' }}>Guest Name</th>
                      <th style={{ width: '12%' }}>Check-in Date & Time</th>
                      <th style={{ width: '12%' }}>Check-out Date & Time</th>
                      <th style={{ width: '8%' }}>Commission</th>
                      <th style={{ width: '8%' }}>Room Charges</th>
                      <th style={{ width: '8%' }}>Pay to Hotel</th>
                      <th style={{ width: '6%' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentBookingData.length === 0 ? (
                      <tr>
                        <td colSpan={13} className="text-center text-muted py-4">
                          No agent bookings found for selected period
                        </td>
                      </tr>
                    ) : (
                      agentBookingData.map((row) => (
                        <tr key={row.srNo}>
                          <td>{row.srNo}</td>
                          <td className="fw-semibold">{row.agentName}</td>
                          <td>{row.bookingDate}</td>
                          <td>{row.roomNo}</td>
                          <td>{row.regNo}</td>
                          <td>{row.bookingId}</td>
                          <td>{row.guestName}</td>
                          <td>{row.checkinDatetime}</td>
                          <td>{row.checkoutDatetime}</td>
                          <td>{formatAmount(row.commissionAmount)}</td>
                          <td>{formatAmount(row.totalRoomCharges)}</td>
                          <td className="fw-semibold">{formatAmount(row.payToHotel)}</td>
                          <td>
                            <span
                              className={`badge bg-${
                                row.status === 'active'
                                  ? 'success'
                                  : row.status === 'checkout' || row.status === 'checked_out'
                                  ? 'info'
                                  : 'secondary'
                              }`}>
                              {row.status === 'checked_out' ? 'checkout' : row.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {renderAgentBookingFooter()}
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default HotelReport