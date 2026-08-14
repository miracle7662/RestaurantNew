// CheckInForm.tsx (Fixed Version)
// FIXES:
// 1. Guest selection required before adding rooms
// 2. All selected rooms must be added before check-in

import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Row, Col, Form as BootstrapForm, Button, Card } from 'react-bootstrap'
import { FormikProvider, useFormik } from 'formik'
import * as Yup from 'yup'
import Select from 'react-select'
import FormikTextInput from '@/components/Common/FormikTextInput'
import FormSelect from '@/components/Common/FormikSelect'
import FormModal from '@/components/Common/models/FormModal'
import toast from 'react-hot-toast'
import useUser from '@/hooks/useUser'

// API Services
import CountryService from '@/common/api/countries'
import StateService from '@/common/api/states'
import CityService from '@/common/api/cities'
import CompanyService from '@/common/hotel/company'
import GuestService from '@/common/hotel/guest'
import RoomService from '@/common/hotel/room'
import RoomCategoryService from '@/common/hotel/roomCategoryService'
import taxApi from '@/common/hotel/taxes'
import FragmentService from '@/common/hotel/fragments'
import DocumentTypeService from '@/common/hotel/documentType'
import CheckInService from '@/common/hotel/checkIn'
import FrontdeskSettingAPI from '@/common/hotel/frontdeskSettings'

import PaymentModeService from '@/common/api/outletpaymentmode'
import travelAgentApi from '@/common/hotel/travelagent'
import { useAuthContext } from '@/common/context/useAuthContext'

import GuestForm from '../Guest/GuestForm'
import CompanyForm from '../Company/CompanyForm'

import GuestHistoryModal from './GuestHistoryModal'
import DocumentScannerModal from './DocumentScannerModal'
import GuestDocumentsModal from './GuestDocumentsModal'
import ReservationService from '@/common/hotel/reservation'   

const round2 = (num: number): number => Math.round((num + Number.EPSILON) * 100) / 100

const safeNumber = (value: any): number => {
  if (value === null || value === undefined) return 0
  const num = Number(value)
  return isNaN(num) ? 0 : num
}

interface CheckInFormData {
  guestId?: number
  fragment_id?: number | null
  title: string
  firstName: string
  lastName: string
  phone1: string
  phone2: string
  email: string
  address: string
  countryId: number | null
  stateId: number | null
  cityId: number | null
  idType: string | null
  totalRoomTariff: number
  idNumber: string
  otherInfo: string
  companyId: number | string | null
  gst: string
  groupName?: string

  arrivalDate: string
  arrivalTime: string
  departureDate: string
  departureTime: string
  adults: number
  pax: number
  exPax: number
  child_charge: number
  childrenPaid: number
  childrenUnpaid: number
  driver: number
  nights: number
  bookingType: string
  planName?: string
  travelAgent?: string
  travelAgentId?: number | null
  bookingId?: string
  bookingDate?: string
  bookingTime?: string
  bookingDuration?: string
  bookingStatus?: string

  rate: number
  ratePerHour: string
  discount: number
  roomService: number
  taxableAmt: number
  sgst: number
  cgst: number
  roundOff: number
  billAmount: number
  otherCharges: number
  receivedAmount: number
  creditTransfer: number
  settDisc: number
  balanceAmount: number
  totalPayToHotel: number
  totalAmt: number

  paymentMethod: string

  agentAmount?: number
  agentAmountPer?: number
  agentIgst?: number
  agentIgstPer?: number
  agentCgst?: number
  agentCgstPer?: number
  agentSgst?: number
  agentSgstPer?: number
  agentTds?: number
  agentTdsPer?: number
  agentTcs?: number
  agentTcsPer?: number
  agentCess?: number
  agentCessPer?: number
  agentServiceFee?: number
  agentTotal?: number
  agentPayToHotel?: number

  billAPlusOtherC?: number

  hotelid?: number
  created_by_id?: number
  roomNo: number | null
  roomType: number | null
  convertedCategoryId: number | null
  roomCharges: number

  regNo: string
  specialInstruction: string
  message: string
  reservationId?: number | null   // ✅ नया
  reservationNo?: string | null   // ✅ नया
}

interface Option {
  label: string
  value: string | number
}

interface RoomRow {
  id: string
  roomId: number
  roomNumber: string
  guestId: number | null
  guestName: string
  roomCategoryId: number
  type: string
  convertedCategoryId?: number | null
  convertedCategoryName?: string
  driver: number
  childUnpaid: number
  childPaid: number
  arrivalDate: string
  arrivalTime: string
  departureDate: string
  departureTime: string
  nights: number
  rate: number
  discount: number
  discountAmt: number
  taxPercent: number
  taxAmount: number
  pax: number
  exPax: number
  adults: number
  taxTypeId?: number
  cgstPercent?: number
  sgstPercent?: number
  igstPercent?: number
  cessPercent?: number
  exPaxPrice?: number
  exPaxTax?: number
  exPaxTaxPercent?: number
  exPaxTotal?: number
  childPrice?: number
  childTax?: number
  childTaxPercent?: number
  childTotal?: number
  driverPrice?: number
  driverTax?: number
  driverTaxPercent?: number
  driverTotal?: number
  totalAmount?: number
  cgstAmount?: number
  sgstAmount?: number
  cessAmount?: number
  totalTax?: number
  igstAmount?: number

}

interface GuestDocument {
  document_id: number
  document_type: string
  document_no: string
  front_side: string | null
  back_side: string | null
  front_side_url?: string | null
  back_side_url?: string | null
  guest_photo?: string | null
  guest_photo_url?: string | null
}

interface FrontDeskSettings {
  hotelid: number
  outletid: number
  checkout_time_setting: '12_NOON' | '24_HOURS'
  fixed_checkout_time: string | null
}

const defaultCompanyForm = {
  company_name: '',
  gst_no: '',
  address: '',
  city_id: null,
  state_id: null,
  country_id: null,
  contact_no: '',
  email: '',
  mst_hotelid: null,
  created_by_id: null,
}

const CheckInForm = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [loggedInUser] = useUser()
  const { user } = useAuthContext()
  console.log("Current User:", user);

  const state = location.state as {
    rooms?: Array<{ roomId: number; roomNumber: string; roomCategoryName: string }>
    hotelId?: number
  } | null

  const hotelId = state?.hotelId || loggedInUser?.hotelid

  const [frontDeskSettings, setFrontDeskSettings] = useState<FrontDeskSettings | null>(null)

  const fetchFrontDeskSettings = async () => {
    if (!hotelId) return
    try {
      const outletId = user?.outletid || 1
      const response = await FrontdeskSettingAPI.getByOutlet(outletId)
      if (response && response.success && response.data) {
        setFrontDeskSettings(response.data)
      } else {
        setFrontDeskSettings(null)
      }
    } catch (error: any) {
      if (error?.response?.status === 404) {
        setFrontDeskSettings(null)
      } else {
        console.error('Failed to fetch front desk settings:', error)
        setFrontDeskSettings(null)
      }
    }
  }

  // ==================== RESPONSIVE LAYOUT STAGE (zoom-aware) ====================
  // Mobile: 320-767 | Tablet: 768-1023 | Laptop: 1024-1439 | Desktop: 1440-1919 | XL: 1920+
  type LayoutStage = 'desktop' | 'laptop' | 'tablet' | 'mobile' | 'xl'
  const [layoutStage, setLayoutStage] = useState<LayoutStage>('desktop')

  // ==================== MOBILE/TABLET TAB NAVIGATION ====================
  // Mobile AND Tablet: same 3 tabs (Guest Info, Stay Info, Agent)
  // Special Instruction textarea is merged into the Agent tab (bottom)
  // Message textarea is merged into the Guest Info tab (bottom)
  type MobileTab = 'guest' | 'stay' | 'agent'
  const [activeMobileTab, setActiveMobileTab] = useState<MobileTab>('guest')
  const mobileTabs: { key: MobileTab; label: string; icon: string }[] = [
    { key: 'guest', label: 'Guest Info', icon: 'fi fi-rr-user' },
    { key: 'stay', label: 'Stay Info', icon: 'fi fi-rr-bed-alt' },
    { key: 'agent', label: 'Agent', icon: 'fi fi-rr-briefcase' },
  ]
  const mobileTabIndex = mobileTabs.findIndex((t) => t.key === activeMobileTab)
  const mobileTabProgress = Math.round(((mobileTabIndex + 1) / mobileTabs.length) * 100)

  useEffect(() => {
    const stageRank: Record<LayoutStage, number> = {
      xl: 0,
      desktop: 1,
      laptop: 2,
      tablet: 3,
      mobile: 4,
    }

    const computeStage = () => {
      const innerW = window.innerWidth

      let widthStage: LayoutStage = 'xl'
      if (innerW < 768) widthStage = 'mobile'
      else if (innerW < 1024) widthStage = 'tablet'
      else if (innerW < 1440) widthStage = 'laptop'
      else if (innerW < 1920) widthStage = 'desktop'
      else widthStage = 'xl'

      let zoomStage: LayoutStage = 'xl'
      if (window.outerWidth && innerW) {
        const zoomPct = Math.round(((window.outerWidth - 10) / innerW) * 100)
        if (zoomPct > 0 && zoomPct <= 55) zoomStage = 'mobile'
        else if (zoomPct > 0 && zoomPct <= 70) zoomStage = 'tablet'
        else if (zoomPct > 0 && zoomPct <= 85) zoomStage = 'laptop'
      }

      // Pick the "smaller" (more constrained) stage
      const nextStage = stageRank[widthStage] <= stageRank[zoomStage] ? zoomStage : widthStage
      setLayoutStage((prev) => (prev === nextStage ? prev : nextStage))
    }

    computeStage()
    window.addEventListener('resize', computeStage)
    return () => window.removeEventListener('resize', computeStage)
  }, [])

  // XL/Desktop (≥1440px):  3 columns side by side  (4 | 5 | 3)
  // Laptop  (1024-1439):   3 columns side by side  (4 | 5 | 3)
  // Tablet  (768-1023):    2 top + 1 full bottom   (6 | 6 | 12) → shows all 3 sections clearly
  // Mobile  (<768px):      1 column stacked         (12 | 12 | 12)
  const isDesktopLike =
    layoutStage === 'xl' || layoutStage === 'desktop' || layoutStage === 'laptop'
  const leftColSpan = isDesktopLike ? 4 : layoutStage === 'tablet' ? 6 : 12
  const midColSpan = isDesktopLike ? 5 : layoutStage === 'tablet' ? 6 : 12
  const rightColSpan = isDesktopLike ? 3 : 12
  const colBreakpoint = isDesktopLike ? 'lg' : 'md'

  // Escape key → go back; Enter key → move to next focusable field
  useEffect(() => {
    const focusableSelectors = [
      'input:not([disabled]):not([readonly]):not([type="hidden"])',
      'select:not([disabled])',
      'textarea:not([disabled]):not([readonly])',
      '[tabindex]:not([tabindex="-1"]):not([disabled])',
    ].join(', ')

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTempGuestPhoto(null)
        navigate(-1)
        return
      }

      if (e.key === 'Enter') {
        const target = e.target as HTMLElement
        const tag = target.tagName.toLowerCase()
        if (tag === 'textarea' || tag === 'button') return
        if (target.getAttribute('type') === 'submit') return

        e.preventDefault()

        const allFocusable = Array.from(
          document.querySelectorAll<HTMLElement>(focusableSelectors),
        ).filter((el) => {
          const style = window.getComputedStyle(el)
          return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null
        })

        const currentIndex = allFocusable.indexOf(target)
        if (currentIndex !== -1 && currentIndex < allFocusable.length - 1) {
          allFocusable[currentIndex + 1].focus()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])

  const [loadingRooms, setLoadingRooms] = useState(false)
  const [initialSelectedRooms, setInitialSelectedRooms] = useState<
    Array<{ roomId: number; roomNumber: string; roomCategoryName: string }>
  >([])
  const [roomCategoryMap, setRoomCategoryMap] = useState<Map<number, string>>(new Map())
  const [roomDepartmentMap, setRoomDepartmentMap] = useState<
    Map<number, { department_id: number; department_name: string }>
  >(new Map())
  const [roomRows, setRoomRows] = useState<RoomRow[]>([])
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [roomCategories, setRoomCategories] = useState<
    Array<{ room_category_id: number; category_name: string; pax?: number }>
  >([])
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [categoryDetailsMap, setCategoryDetailsMap] = useState<Map<number, any>>(new Map())
  const [categoryModeChargesMap, setCategoryModeChargesMap] = useState<Map<number, any[]>>(
    new Map(),
  )
  const [roomChargeEditable, setRoomChargeEditable] = useState(false)
  const [taxList, setTaxList] = useState<
    Array<{
      hotel_taxid: number
      hotel_tax_value?: number
      hotel_cgst?: number
      hotel_sgst?: number
      hotel_igst?: number
      hotel_cess?: number
    }>
  >([])
  const taxDetailsMap = useMemo(() => {
    const map = new Map<number, any>()
    taxList.forEach((tax) => {
      map.set(tax.hotel_taxid, tax)
    })
    return map
  }, [taxList])
  const [paymentMethods, setPaymentMethods] = useState<
    Array<{ id: number; name: string; payment_method_name: string }>
  >([])
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false)
  const [, setCountries] = useState<Array<{ id: number; name: string }>>([])
  const [, setStates] = useState<Array<{ id: number; name: string }>>([])
  const [, setCities] = useState<Array<{ id: number; name: string }>>([])
  const [companies, setCompanies] = useState<Array<{ company_id: number; company_name: string }>>(
    [],
  )

  const [categoryStandardPaxMap, setCategoryStandardPaxMap] = useState<Map<number, number>>(
    new Map(),
  )
  const [, setSelectedRoomCategoryPax] = useState(0)
  const [, setSelectedCategoryName] = useState('')
  const [selectedRoomTariff, setSelectedRoomTariff] = useState(0)
  const [documentTypes, setDocumentTypes] = useState<Array<{ id: string; name: string }>>([])
  const [loadingDocTypes, setLoadingDocTypes] = useState(false)
  const [guests, setGuests] = useState<Array<{ guest_id: number; name: string; mobile: string }>>(
    [],
  )
  const [fragments, setFragments] = useState<Array<{ fragment_id: number; name: string }>>([])
  const [, setLoadingCountries] = useState(false)
  const [, setLoadingStates] = useState(false)
  const [, setLoadingCities] = useState(false)
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [searchingGuests, setSearchingGuests] = useState(false)
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const [showGuestModal, setShowGuestModal] = useState(false)
  const [savingGuest, setSavingGuest] = useState(false)
  const [showCompanyModal, setShowCompanyModal] = useState(false)
  const [savingCompany, setSavingCompany] = useState(false)
  const [regNo, setRegNo] = useState('')
  const [guestDocuments, setGuestDocuments] = useState<GuestDocument[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [travelAgents, setTravelAgents] = useState<
    Array<{
      agent_id: number
      agent_name: string
      commission_type?: string
      commission_value?: number
      igst?: number
      cgst?: number
      sgst?: number
      tds?: number
      tcs?: number
      cess?: number
      service_fee?: number
      agent_code?: string
    }>
  >([])
  const [loadingTravelAgents, setLoadingTravelAgents] = useState(false)

  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showDocScanModal, setShowDocScanModal] = useState(false)
  const [showGuestDocsModal, setShowGuestDocsModal] = useState(false)
  const [pendingGuestLoad, setPendingGuestLoad] = useState<number | null>(null)

  const [tempGuestPhoto, setTempGuestPhoto] = useState<string | null>(null)

  const [checkInType, setCheckInType] = useState<'walkin' | 'reservation'>('walkin')
const [todayReservations, setTodayReservations] = useState<any[]>([])
const [, setSelectedReservation] = useState<any | null>(null)


  const getTodayLocal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch front desk settings
  useEffect(() => {
    if (hotelId) {
      fetchFrontDeskSettings()
    }
  }, [hotelId])

  const defaultGuestForm = {
    fragment_id: null,
    name: '',
    organisation: '',
    address: '',
    city_id: null,
    state_id: null,
    country_id: null,
    occupation: '',
    post_held: '',
    phone: '',
    mobile: '',
    email: '',
    website: '',
    purpose: '',
    arrived_from: '',
    departure_to: '',
    credit_card: '',
    credit_card_expiry: '',
    birthday: '',
    anniversary: '',
    gender: 'Male',
    nationality_id: null,
    guest_type: 'REGULAR',
    credit_allowed: 0,
    company_id: null,
    mst_hotelid: hotelId,
    created_by_id: user?.id,
    documents: [],
  }

  useEffect(() => {
    const fetchRegNumber = async () => {
      if (!hotelId) return
      try {
        const res = await CheckInService.getNextRegNumber({ hotelid: hotelId })
        if (res.success && res.data) {
          const nextReg = res.data.reg_no
          setRegNo(nextReg)
        } else {
          console.error('Failed to fetch next registration number:', res)
          toast.error('Could not generate registration number')
        }
      } catch (error) {
        console.error('Failed to fetch next registration number:', error)
        toast.error('Could not generate registration number')
      }
    }
    fetchRegNumber()
  }, [hotelId])

  useEffect(() => {
    if (!hotelId) return
    const fetchRooms = async () => {
      setLoadingRooms(true)
      try {
        const res = await RoomService.list({ hotelid: hotelId })
        const roomsData = res.data || []
        const deptMap = new Map<number, { department_id: number; department_name: string }>()
        roomsData.forEach((room: any) => {
          if (room.room_id && room.department_id) {
            deptMap.set(room.room_id, {
              department_id: room.department_id,
              department_name: room.department_name || '',
            })
          }
        })
        setRoomDepartmentMap(deptMap)
      } catch (error) {
        console.error('Failed to load rooms', error)
        toast.error('Could not load room list')
      } finally {
        setLoadingRooms(false)
      }
    }
    fetchRooms()
  }, [hotelId])

  const fetchTodayReservations = async () => {
  if (!hotelId) return
  try {
    const response = await ReservationService.getTodayGuests({ hotelid: hotelId })
    const data = response.data || []
    setTodayReservations(data)
  } catch (error) {
    console.error('Failed to fetch today reservations:', error)
    toast.error('Could not load reservations')
  }
}

useEffect(() => {
  if (checkInType === 'reservation') {
    fetchTodayReservations()
  } else {
    // Walk‑in पर सारे reservation state रीसेट करें
    setTodayReservations([])
    setSelectedReservation(null)
    formik.setFieldValue('reservationId', null)
    formik.setFieldValue('reservationNo', null)
  }
}, [checkInType, hotelId])

  useEffect(() => {
    if (state?.rooms && state.rooms.length > 0) {
      setInitialSelectedRooms(state.rooms)
      const map = new Map<number, string>()
      state.rooms.forEach((r) => map.set(r.roomId, r.roomCategoryName))
      setRoomCategoryMap(map)
    }
  }, [state?.rooms])

  useEffect(() => {
    if (pendingGuestLoad !== null) {
      const loadDocumentsForNewGuest = async () => {
        console.log('Loading documents for newly created guest:', pendingGuestLoad)
        await new Promise((resolve) => setTimeout(resolve, 800))
        await loadGuestDocuments(pendingGuestLoad, true)
        setPendingGuestLoad(null)
      }
      loadDocumentsForNewGuest()
    }
  }, [pendingGuestLoad])

  useEffect(() => {
    const fetchMasterData = async () => {
      setLoadingCountries(true)
      setLoadingStates(true)
      setLoadingCities(true)
      setLoadingCompanies(true)
      setLoadingDocTypes(true)
      setLoadingCategories(true)
      setLoadingPaymentMethods(true)

      try {
        const [
          countriesRes,
          statesRes,
          citiesRes,
          companiesRes,
          docTypesRes,
          categoriesRes,
          taxRes,
          fragmentsRes,
          paymentMethodsRes,
        ] = await Promise.all([
          CountryService.list(),
          StateService.list(),
          CityService.list(),
          CompanyService.list({ hotelid: hotelId }),
          DocumentTypeService.list({ status: 1 }),
          RoomCategoryService.list({ hotelid: hotelId }),
          taxApi.list(),
          FragmentService.list(),
          PaymentModeService.list({ outletid: user?.outletid ? String(user.outletid) : undefined }),
        ])

        const countriesData = Array.isArray(countriesRes) ? countriesRes : countriesRes?.data || []
        setCountries(
          countriesData
            .map((c: any) => ({ id: c.id || c.countryid, name: String(c.name || c.country_name) }))
            .filter((c: any) => c.id && c.name),
        )

        const statesData = Array.isArray(statesRes) ? statesRes : statesRes?.data || []
        setStates(
          statesData
            .map((s: any) => ({ id: s.id || s.stateid, name: String(s.name || s.state_name) }))
            .filter((s: any) => s.id && s.name),
        )

        const citiesData = Array.isArray(citiesRes) ? citiesRes : citiesRes?.data || []
        setCities(
          citiesData
            .map((c: any) => ({ id: c.id || c.cityid, name: String(c.name || c.city_name) }))
            .filter((c: any) => c.id && c.name),
        )

        const companiesData = Array.isArray(companiesRes) ? companiesRes : companiesRes?.data || []
        setCompanies(
          companiesData
            .map((c: any) => ({
              company_id: c.company_id || c.id,
              company_name: String(c.company_name || c.name),
            }))
            .filter((c: any) => c.company_id && c.company_name),
        )

        if (docTypesRes.success && docTypesRes.data) {
          setDocumentTypes(
            docTypesRes.data.map((dt: any) => ({
              id: String(dt.id),
              name: dt.document_type_name,
            })),
          )
        }

        const categoriesData = Array.isArray(categoriesRes)
          ? categoriesRes
          : categoriesRes?.data || []
        setRoomCategories(
          categoriesData.map((c: any) => ({
            room_category_id: Number(c.room_category_id || c.id),
            category_name: String(c.category_name || c.name),
            pax: c.max_limit || c.pax || 0,
          })),
        )

        const taxData = Array.isArray(taxRes) ? taxRes : taxRes?.data || []
        setTaxList(taxData)

        const fragmentsData = Array.isArray(fragmentsRes) ? fragmentsRes : fragmentsRes?.data || []
        setFragments(
          fragmentsData
            .map((f: any) => ({
              fragment_id: f.fragment_id || f.id,
              name: String(f.name),
            }))
            .filter((f: any) => f.fragment_id && f.name),
        )

        const paymentMethodsData = Array.isArray(paymentMethodsRes)
          ? paymentMethodsRes
          : paymentMethodsRes?.data || []
        const mappedPaymentMethods = paymentMethodsData
          .map((pm: any) => {
            const modeName = pm.mode_name || ''
            const safeName = modeName.trim()
            if (!safeName) return null
            return {
              id: pm.id ?? pm.paymenttypeid,
              name: safeName,
              payment_method_name: safeName,
            }
          })
          .filter((item): item is { id: number; name: string; payment_method_name: string } => item !== null)
        setPaymentMethods(mappedPaymentMethods)
        const cashMethod = mappedPaymentMethods.find(
          (pm: any) => pm.payment_method_name?.toLowerCase() === 'cash'
        )
        if (cashMethod) {
          formik.setFieldValue('paymentMethod', cashMethod.payment_method_name)
        } else if (mappedPaymentMethods.length > 0) {
          formik.setFieldValue('paymentMethod', mappedPaymentMethods[0].payment_method_name)
        }
      } catch (error) {
        console.error('Failed to load master data:', error)
        toast.error('Could not load required data')
      } finally {
        setLoadingCountries(false)
        setLoadingStates(false)
        setLoadingCities(false)
        setLoadingCompanies(false)
        setLoadingDocTypes(false)
        setLoadingCategories(false)
        setLoadingPaymentMethods(false)
      }
    }

    if (hotelId) {
      fetchMasterData()
    }
  }, [hotelId])

  const SELF_AGENT_VALUE = '__SELF__'

  const travelAgentOptions = useMemo(() => {
    const selfOption = { label: `Self`, value: SELF_AGENT_VALUE }
    const agentOpts = travelAgents.map((a) => ({
      label: a.agent_name,
      value: String(a.agent_id),
    }))
    return [selfOption, ...agentOpts]
  }, [travelAgents, loggedInUser, user])

  const loadTravelAgents = async (searchTerm?: string) => {
    setLoadingTravelAgents(true)
    try {
      const params: any = { mst_hotelid: hotelId }
      if (searchTerm) params.q = searchTerm
      const response = await travelAgentApi.list(params)
      const agentsData = response?.data || []
      setTravelAgents(
        agentsData.map((a: any) => ({
          agent_id: a.agent_id,
          agent_name: a.agent_name,
          agent_code: a.agent_code,
          commission_type: a.commission_type,
          commission_value: a.commission_value,
          igst: a.igst || 0,
          cgst: a.cgst || 0,
          sgst: a.sgst || 0,
          tds: a.tds || 0,
          tcs: a.tcs || 0,
          cess: a.cess || 0,
          service_fee: a.service_fee || 0,
        })),
      )
    } catch (error) {
      console.error('Failed to load travel agents', error)
    } finally {
      setLoadingTravelAgents(false)
    }
  }

  useEffect(() => {
    if (hotelId) {
      loadTravelAgents()
    }
  }, [hotelId])

  const getFragmentName = (fragmentId: number | null | undefined): string => {
    if (!fragmentId) return ''
    const fragment = fragments.find((f) => f.fragment_id === fragmentId)
    return fragment ? fragment.name : ''
  }

  const handleAgentSelect = async (agentId: number | null) => {
    if (!agentId) {
      setFieldValue('agentIgst', 0)
      setFieldValue('agentIgstPer', 0)
      setFieldValue('agentCgst', 0)
      setFieldValue('agentCgstPer', 0)
      setFieldValue('agentSgst', 0)
      setFieldValue('agentSgstPer', 0)
      setFieldValue('agentTds', 0)
      setFieldValue('agentTdsPer', 0)
      setFieldValue('agentTcs', 0)
      setFieldValue('agentTcsPer', 0)
      setFieldValue('agentCess', 0)
      setFieldValue('agentCessPer', 0)
      setFieldValue('agentServiceFee', 0)
      setFieldValue('travelAgentId', null)
      setFieldValue('travelAgent', '')
      setFieldValue('agentAmount', 0)
      setFieldValue('agentAmountPer', 0)
      setFieldValue('bookingId', '')
      setFieldValue('bookingDate', '')
      return
    }

    try {
      const response = await travelAgentApi.list({ q: '' })
      const agentsData = response?.data || []
      const selectedAgent = agentsData.find((a: any) => a.agent_id === agentId)

      if (selectedAgent) {
        setFieldValue('agentIgst', 0)
        setFieldValue('agentIgstPer', selectedAgent.igst || 0)
        setFieldValue('agentCgst', 0)
        setFieldValue('agentCgstPer', selectedAgent.cgst || 0)
        setFieldValue('agentSgst', 0)
        setFieldValue('agentSgstPer', selectedAgent.sgst || 0)
        setFieldValue('agentTds', 0)
        setFieldValue('agentTdsPer', selectedAgent.tds || 0)
        setFieldValue('agentTcs', 0)
        setFieldValue('agentTcsPer', selectedAgent.tcs || 0)
        setFieldValue('agentCess', 0)
        setFieldValue('agentCessPer', selectedAgent.cess || 0)
        setFieldValue('agentServiceFee', selectedAgent.service_fee || 0)
        setFieldValue('travelAgentId', agentId)
        setFieldValue('travelAgent', selectedAgent.agent_name)

        const commissionValue = selectedAgent.commission_value || 0
        setFieldValue('agentAmountPer', commissionValue)

        const todayStr = new Date().toISOString().split('T')[0]
        setFieldValue('bookingDate', todayStr)
      }
    } catch (error) {
      console.error('Failed to load agent details', error)
    }
  }

  const guestOptions: Option[] = guests.map((g) => ({
    label: `${g.name}`,
    value: g.guest_id,
  }))
  const loadingGuests = searchingGuests

  const companyOptions: Option[] = useMemo(() => {
    const walkInOption = { label: 'WALK-IN-GUEST', value: 'WALK-N-GUESTI' }
    const companyOpts = companies.map((c) => ({
      label: String(c.company_name),
      value: c.company_id,
    }))
    return [walkInOption, ...companyOpts]
  }, [companies])

  const paymentMethodOptions: Option[] = useMemo(
    () => paymentMethods.map((pm) => ({
      label: pm.name,
      value: pm.payment_method_name,
    })),
    [paymentMethods],
  )

   const reservationGuestOptions = useMemo(() => {
    return todayReservations.map(res => ({
      label: res.guest_name || res.reservation_name || 'Guest',
      value: res.guest_id,
    }))
  }, [todayReservations])



  const loadAllGuests = async () => {
    if (!hotelId) return
    setSearchingGuests(true)
    try {
      const response = await GuestService.list({ hotelid: hotelId })
      const guestsData = response?.data || []
      setGuests(
        guestsData
          .map((g: any) => ({
            guest_id: Number(g.id || g.guest_id),
            name: String(g.name),
            mobile: String(g.mobile),
          }))
          .filter((g: any) => !isNaN(g.guest_id) && g.name),
      )
    } catch (error) {
      console.error('Failed to load guests:', error)
      setGuests([])
    } finally {
      setSearchingGuests(false)
    }
  }

  const loadAllCompanies = async () => {
    if (!hotelId) return
    setLoadingCompanies(true)
    try {
      const response = await CompanyService.list({ hotelid: hotelId })
      const companiesData = response?.data || []
      setCompanies(
        companiesData
          .map((c: any) => ({
            company_id: Number(c.company_id || c.id),
            company_name: String(c.company_name || c.name),
          }))
          .filter((c: any) => !isNaN(c.company_id) && c.company_name),
      )
    } catch (error) {
      console.error('Failed to load companies:', error)
      setCompanies([])
    } finally {
      setLoadingCompanies(false)
    }
  }

  const handleGuestSearch = async (inputValue: string) => {
    if (!inputValue || !hotelId) {
      loadAllGuests()
      return
    }
    if (inputValue.length < 2) {
      return
    }
    setSearchingGuests(true)
    try {
      const response = await GuestService.list({ q: inputValue, hotelid: hotelId })
      const guestsData = response?.data || []
      setGuests(
        guestsData
          .map((g: any) => ({
            guest_id: Number(g.id || g.guest_id),
            name: String(g.name),
            mobile: String(g.mobile),
          }))
          .filter((g: any) => !isNaN(g.guest_id) && g.name),
      )
    } catch (error) {
      console.error('Guest search failed:', error)
      setGuests([])
    } finally {
      setSearchingGuests(false)
    }
  }

  const handleCompanySearch = async (inputValue: string) => {
    if (!inputValue || !hotelId) {
      loadAllCompanies()
      return
    }
    if (inputValue.length < 2) {
      return
    }
    setLoadingCompanies(true)
    try {
      const response = await CompanyService.list({ q: inputValue, hotelid: hotelId })
      const companiesData = response?.data || []
      setCompanies(
        companiesData
          .map((c: any) => ({
            company_id: Number(c.company_id || c.id),
            company_name: String(c.company_name || c.name),
          }))
          .filter((c: any) => !isNaN(c.company_id) && c.company_name),
      )
    } catch (error) {
      console.error('Company search failed:', error)
      setCompanies([])
    } finally {
      setLoadingCompanies(false)
    }
  }

  const handleCompanySelect = async (companyId: string | number | null) => {
    // Update the form's companyId
    setFieldValue('companyId', companyId);

    // If no company or "WALK-IN-GUEST", clear GST
    if (!companyId || companyId === 'WALK-N-GUESTI') {
      setFieldValue('gst', '');
      return;
    }

    try {
      const response = await CompanyService.get(Number(companyId));
      const company = response.data || response;
      // Set the GST number from the fetched company
      setFieldValue('gst', company.gst_no || '');
    } catch (error) {
      console.error('Failed to fetch company GST:', error);
      setFieldValue('gst', '');
    }
  };

  const loadGuestDetails = async (guestId: number) => {
    if (typeof guestId !== 'number' || isNaN(guestId)) {
      console.error('loadGuestDetails received invalid guestId:', guestId)
      toast.error('Invalid guest selection')
      return
    }

    try {
      const response = await GuestService.get(guestId)
      const guest = response.data || response

      if (guest) {
        const fullName = guest.name ? String(guest.name).trim() : ''
        const spaceIndex = fullName.indexOf(' ')
        const firstName = spaceIndex === -1 ? fullName : fullName.substring(0, spaceIndex)
        const lastName = spaceIndex === -1 ? '' : fullName.substring(spaceIndex + 1).trim()

        const fragmentName = getFragmentName(guest.fragment_id)
        formik.setFieldValue('title', fragmentName || 'MR')

        formik.setFieldValue('guestId', guest.id || guest.guest_id)
        formik.setFieldValue('fragment_id', guest.fragment_id || null)
        formik.setFieldValue('firstName', firstName)
        formik.setFieldValue('lastName', lastName)
        formik.setFieldValue('phone1', guest.phone ? String(guest.phone) : '')
        formik.setFieldValue('phone2', guest.mobile ? String(guest.mobile) : '')
        formik.setFieldValue('email', guest.email ? String(guest.email) : '')
        formik.setFieldValue('address', guest.address ? String(guest.address) : '')
        formik.setFieldValue(
          'countryId',
          guest.country_id != null ? Number(guest.country_id) : null,
        )
        formik.setFieldValue('stateId', guest.state_id != null ? Number(guest.state_id) : null)
        formik.setFieldValue('cityId', guest.city_id != null ? Number(guest.city_id) : null)

        formik.setFieldValue('discount', guest.discount_percent ?? 0)

        formik.setFieldValue('idType', '')
        formik.setFieldValue('idNumber', '')
        formik.setFieldValue('otherInfo', guest.organisation ? String(guest.organisation) : '')

        if (guest.company_id) {
          formik.setFieldValue('companyId', Number(guest.company_id))
          try {
            const companyResponse = await CompanyService.get(guest.company_id)
            const company = companyResponse.data || companyResponse
            if (company && company.gst_no) {
              formik.setFieldValue('gst', String(company.gst_no))
            }
          } catch (companyError) {
            console.error('Failed to load company GST:', companyError)
          }
        } else {
          formik.setFieldValue('companyId', 'WALK-N-GUESTI')
          formik.setFieldValue('gst', '')
        }

        await loadGuestDocuments(guestId, true)
      }
    } catch (error) {
      console.error('Failed to load guest details:', error)
      toast.error('Could not load guest details')
    }
  }

  const loadGuestDocuments = async (guestId: number, showToast: boolean = false) => {
    if (!guestId) return false

    try {
      console.log(`Loading documents for guest ${guestId}...`)
      const response = await GuestService.listDocuments(guestId)
      console.log('Documents response:', response)

      if (response.success && response.data) {
        const docs = response.data
        console.log(`Found ${docs.length} documents for guest ${guestId}`)

        setGuestDocuments(docs)

        const idProofDoc = docs.find((doc: GuestDocument) => doc.document_type !== 'Guest Photo')
        if (idProofDoc) {
          formik.setFieldValue('idType', idProofDoc.document_type)
          formik.setFieldValue('idNumber', idProofDoc.document_no)
        } else {
          formik.setFieldValue('idType', '')
          formik.setFieldValue('idNumber', '')
        }

        if (showToast && docs.length === 0) {
          toast('No documents found for this guest')
        }

        return true
      } else {
        console.log('No documents found or API error')
        setGuestDocuments([])
        formik.setFieldValue('idType', '')
        formik.setFieldValue('idNumber', '')
        if (showToast) toast('No documents found')
        return false
      }
    } catch (error) {
      console.error('Failed to load guest documents:', error)
      setGuestDocuments([])
      formik.setFieldValue('idType', '')
      formik.setFieldValue('idNumber', '')
      if (showToast) toast.error('Could not load documents')
      return false
    }
  }

  const handleGuestPhotoCapture = (imageDataUrl: string) => {
    if (!values.guestId) {
      toast.error('No guest selected')
      return
    }
    setTempGuestPhoto(imageDataUrl)
    toast.success('Photo captured — will be saved after Check-In (F9)')
    setShowDocScanModal(false)
  }

  const handleGuestSave = async (guestData: any) => {
    setSavingGuest(true)
    try {
      if (!hotelId) {
        throw new Error('Hotel ID not found - cannot create guest');
      }

      const { documents, ...guestInfo } = guestData

      const payload = {
        ...guestInfo,
        hotelid: hotelId,
        created_by_id: user?.id,
      }

      console.log('Creating guest with payload:', payload)
      const response = await GuestService.create(payload)
      console.log('Guest creation response:', response)

      const newGuest: any = response.data || response
      const newGuestId = newGuest.id || newGuest.guest_id || newGuest.guestId

      if (documents && documents.length > 0 && newGuestId) {
        console.log('Saving documents for new guest:', newGuestId, documents)
        for (const doc of documents) {
          if (doc.document_type && doc.document_number) {
            try {
              await GuestService.createDocument(newGuestId, {
                document_type: doc.document_type,
                document_no: doc.document_number,
                front_side: (doc as any)._temp_front instanceof File ? (doc as any)._temp_front : null,
                back_side: (doc as any)._temp_back instanceof File ? (doc as any)._temp_back : null,
              })
              console.log('Document saved:', doc.document_type)
            } catch (docError) {
              console.error('Failed to save document:', docError)
            }
          }
        }
      }

      toast.success('Guest saved successfully')
      setShowGuestModal(false)

      await loadAllGuests()

      if (newGuestId) {
        console.log('New guest created with ID:', newGuestId)

        formik.setFieldValue('guestId', newGuestId)
        await loadGuestDetails(newGuestId)
        setPendingGuestLoad(newGuestId)

        setTimeout(async () => {
          console.log('Manual document reload for guest:', newGuestId)
          await loadGuestDocuments(newGuestId, true)
        }, 1500)
      }
    } catch (error) {
      console.error('Failed to save guest:', error)
      toast.error('Failed to save guest')
    } finally {
      setSavingGuest(false)
    }
  }

  const handleCompanySave = async (companyData: any) => {
    setSavingCompany(true);
    try {
      const payload = {
        ...companyData,
        hotelid: hotelId,
        created_by_id: user?.id,
      };

      const response = await CompanyService.create(payload);
      const newCompany: any = response.data || response;
      const newCompanyId = newCompany.company_id || newCompany.id;

      toast.success('Company saved successfully');
      setShowCompanyModal(false);

      await loadAllCompanies(); // refresh dropdown

      if (newCompanyId) {
        setFieldValue('companyId', newCompanyId);

        // Fetch full company details to get GST
        try {
          const detailsResponse = await CompanyService.get(newCompanyId);
          const company = detailsResponse.data || detailsResponse;
          setFieldValue('gst', company.gst_no || '');
        } catch (fetchError) {
          console.error('Failed to fetch company details:', fetchError);
          // fallback to response data
          if (newCompany.gst_no) {
            setFieldValue('gst', String(newCompany.gst_no));
          }
        }
      }
    } catch (error) {
      console.error('Failed to save company:', error);
      toast.error('Failed to save company');
    } finally {
      setSavingCompany(false);
    }
  };

  const getTariffForPax = (
    tariffs: Array<{ no_of_pax: number; room_tariff: number }>,
    adultCount: number,
  ): { pax: number; exPax: number; tariff: number } => {
    if (!tariffs || tariffs.length === 0) return { pax: 0, exPax: 0, tariff: 0 }

    const sorted = [...tariffs]
      .map((t) => ({ no_of_pax: Number(t.no_of_pax), room_tariff: Number(t.room_tariff) }))
      .filter((t) => t.no_of_pax > 0)
      .sort((a, b) => a.no_of_pax - b.no_of_pax)

    if (sorted.length === 0) return { pax: 0, exPax: 0, tariff: 0 }

    const exact = sorted.find((t) => t.no_of_pax === adultCount)
    if (exact) {
      return { pax: exact.no_of_pax, exPax: 0, tariff: exact.room_tariff }
    }

    if (adultCount <= sorted[0].no_of_pax) {
      return { pax: sorted[0].no_of_pax, exPax: 0, tariff: sorted[0].room_tariff }
    }

    const maxTariff = sorted[sorted.length - 1]
    if (adultCount > maxTariff.no_of_pax) {
      return {
        pax: maxTariff.no_of_pax,
        exPax: adultCount - maxTariff.no_of_pax,
        tariff: maxTariff.room_tariff,
      }
    }

    let best = sorted[0]
    for (const t of sorted) {
      if (t.no_of_pax <= adultCount) best = t
    }
    return {
      pax: best.no_of_pax,
      exPax: adultCount - best.no_of_pax,
      tariff: best.room_tariff,
    }
  }

  const updatePaxFromCategory = (
    standardPax: number,
    adultCount: number,
    categoryId?: number,
  ) => {
    const activeCategoryId =
      categoryId ??
      (formik.values.convertedCategoryId || formik.values.roomType || null)
    const details = activeCategoryId ? categoryDetailsMap.get(activeCategoryId) : null
    const tariffs: Array<{ no_of_pax: number; room_tariff: number }> =
      details?.tariffs || []

    if (tariffs.length > 0 && adultCount > 0) {
      const { pax, exPax, tariff } = getTariffForPax(tariffs, adultCount)
      if (formik.values.pax !== pax) setFieldValue('pax', pax)
      if (formik.values.exPax !== exPax) setFieldValue('exPax', exPax)
      if (!roomChargeEditable) {
        setSelectedRoomTariff(tariff)
        setFieldValue('roomCharges', tariff)
      }
    } else {
      const newPax = standardPax
      const newExPax = Math.max(0, adultCount - standardPax)
      if (formik.values.pax !== newPax) setFieldValue('pax', newPax)
      if (formik.values.exPax !== newExPax) setFieldValue('exPax', newExPax)
    }
  }

  const fetchCategoryDetails = async (categoryId: number) => {
    if (!categoryId) return null

    if (categoryDetailsMap.has(categoryId)) {
      return categoryDetailsMap.get(categoryId)
    }

    try {
      const response = await RoomCategoryService.get(categoryId)
      const details = response.data
      setCategoryDetailsMap((prev) => new Map(prev).set(categoryId, details))

      let standardPax = 0
      if (details.tariffs && details.tariffs.length > 0) {
        const paxValues = details.tariffs
          .map((t: any) => Number(t.no_of_pax))
          .filter((v: number) => v > 0)
        if (paxValues.length) standardPax = Math.min(...paxValues)
      }
      setCategoryStandardPaxMap((prev) => new Map(prev).set(categoryId, standardPax))

      const modeCharges = details.mode_charges || []
      setCategoryModeChargesMap((prev) => new Map(prev).set(categoryId, modeCharges))

      return details
    } catch (error) {
      console.error('Failed to fetch category details', error)
      toast.error('Could not load category details')
      return null
    }
  }

  const handleRoomNoChange = async (roomId: number | null) => {
    setFieldValue('roomNo', roomId)

    if (roomId) {
      const selectedRoom = initialSelectedRooms.find((r) => r.roomId === roomId)
      if (selectedRoom) {
        const categoryName = roomCategoryMap.get(roomId) || ''
        setSelectedCategoryName(categoryName)

        const category = roomCategories.find((c) => c.category_name === categoryName)
        if (category) {
          const catId = category.room_category_id
          setFieldValue('roomType', catId)
          setFieldValue('convertedCategoryId', catId)

          const categoryDetails = await fetchCategoryDetails(catId)
          if (categoryDetails) {
            const standardPax = categoryStandardPaxMap.get(catId) || 0
            setSelectedRoomCategoryPax(standardPax)

            const currentAdults = values.adults || 0
            const tariffs: Array<{ no_of_pax: number; room_tariff: number }> =
              categoryDetails.tariffs || []

            let resolvedAdults = currentAdults
            let roomTariff = 0

            if (tariffs.length > 0) {
              if (currentAdults === 0) {
                const minPax = Math.min(...tariffs.map((t: any) => Number(t.no_of_pax)).filter((v: number) => v > 0))
                resolvedAdults = minPax > 0 ? minPax : 1
                setFieldValue('adults', resolvedAdults)
              }
              const { pax, exPax, tariff } = getTariffForPax(tariffs, resolvedAdults)
              roomTariff = tariff
              setFieldValue('pax', pax)
              setFieldValue('exPax', exPax)
            } else if (standardPax > 0) {
              if (currentAdults === 0) {
                resolvedAdults = standardPax
                setFieldValue('adults', standardPax)
              }
              setFieldValue('pax', standardPax)
              setFieldValue('exPax', Math.max(0, resolvedAdults - standardPax))
              if (categoryDetails.tariffs && categoryDetails.tariffs.length > 0) {
                roomTariff = Number(categoryDetails.tariffs[0].room_tariff) || 0
              }
            } else {
              if (categoryDetails.tariffs && categoryDetails.tariffs.length > 0) {
                roomTariff = Number(categoryDetails.tariffs[0].room_tariff) || 0
              }
            }

            setSelectedRoomTariff(roomTariff)
            setFieldValue('roomCharges', roomTariff)
          }
        } else {
          setSelectedCategoryName('')
          setSelectedRoomCategoryPax(0)
          setSelectedRoomTariff(0)
          setFieldValue('roomType', null)
          setFieldValue('convertedCategoryId', null)
          setFieldValue('roomCharges', 0)
        }
      }
      setRoomChargeEditable(false)
    } else {
      setSelectedCategoryName('')
      setSelectedRoomCategoryPax(0)
      setSelectedRoomTariff(0)
      setFieldValue('roomType', null)
      setFieldValue('convertedCategoryId', null)
      setFieldValue('roomCharges', 0)
    }
  }

  const handleConvertedCategoryChange = async (categoryId: number | null) => {
    setFieldValue('convertedCategoryId', categoryId)

    if (categoryId) {
      const category = roomCategories.find((c) => c.room_category_id === categoryId)
      if (category) {
        const categoryDetails = await fetchCategoryDetails(categoryId)
        if (categoryDetails) {
          const standardPax = categoryStandardPaxMap.get(categoryId) || 0
          setSelectedRoomCategoryPax(standardPax)
          setSelectedCategoryName(category.category_name)

          const currentAdults = values.adults || 0
          const tariffs: Array<{ no_of_pax: number; room_tariff: number }> =
            categoryDetails.tariffs || []

          if (tariffs.length > 0 && currentAdults > 0) {
            const { pax, exPax, tariff } = getTariffForPax(tariffs, currentAdults)
            if (!roomChargeEditable) {
              setSelectedRoomTariff(tariff)
              setFieldValue('roomCharges', tariff)
            }
            setFieldValue('pax', pax)
            setFieldValue('exPax', exPax)
          } else {
            const convertedTariff = tariffs.length > 0 ? Number(tariffs[0].room_tariff) || 0 : 0
            setSelectedRoomTariff(convertedTariff)
            if (!roomChargeEditable) {
              setFieldValue('roomCharges', convertedTariff)
            }
            updatePaxFromCategory(standardPax, currentAdults, categoryId)
          }
        }
      }
    } else {
      const originalCategoryId = values.roomType
      if (originalCategoryId) {
        const originalDetails = await fetchCategoryDetails(originalCategoryId)
        if (originalDetails) {
          const standardPax = categoryStandardPaxMap.get(originalCategoryId) || 0
          setSelectedRoomCategoryPax(standardPax)
          const originalCategory = roomCategories.find(
            (c) => c.room_category_id === originalCategoryId,
          )
          setSelectedCategoryName(originalCategory?.category_name || '')

          const currentAdults = values.adults || 0
          const tariffs: Array<{ no_of_pax: number; room_tariff: number }> =
            originalDetails.tariffs || []

          if (tariffs.length > 0 && currentAdults > 0) {
            const { pax, exPax, tariff } = getTariffForPax(tariffs, currentAdults)
            setSelectedRoomTariff(tariff)
            if (!roomChargeEditable) {
              setFieldValue('roomCharges', tariff)
            }
            setFieldValue('pax', pax)
            setFieldValue('exPax', exPax)
          } else {
            const originalTariff = tariffs.length > 0 ? Number(tariffs[0].room_tariff) || 0 : 0
            setSelectedRoomTariff(originalTariff)
            if (!roomChargeEditable) {
              setFieldValue('roomCharges', originalTariff)
            }
            updatePaxFromCategory(standardPax, currentAdults, originalCategoryId)
          }
        }
      } else {
        // No original category
      }
    }
  }

  const handleRoomTypeChange = async (categoryId: number | null) => {
    if (!categoryId) {
      setFieldValue('roomCharges', 0)
      setSelectedRoomCategoryPax(0)
      setSelectedCategoryName('')
      setSelectedRoomTariff(0)
      return
    }

    const details = await fetchCategoryDetails(categoryId)
    if (details) {
      const standardPax = categoryStandardPaxMap.get(categoryId) || 0
      setSelectedRoomCategoryPax(standardPax)
      setSelectedCategoryName(
        roomCategories.find((c) => c.room_category_id === categoryId)?.category_name || '',
      )

      const currentAdults = values.adults || 0
      const tariffs: Array<{ no_of_pax: number; room_tariff: number }> = details.tariffs || []

      if (tariffs.length > 0 && currentAdults > 0) {
        const { pax, exPax, tariff } = getTariffForPax(tariffs, currentAdults)
        setSelectedRoomTariff(tariff)
        if (!roomChargeEditable) {
          setFieldValue('roomCharges', tariff)
        }
        setFieldValue('pax', pax)
        setFieldValue('exPax', exPax)
      } else {
        const tariff = tariffs.length > 0 ? Number(tariffs[0].room_tariff) || 0 : 0
        setSelectedRoomTariff(tariff)
        if (!roomChargeEditable) {
          setFieldValue('roomCharges', tariff)
        }
        updatePaxFromCategory(standardPax, currentAdults, categoryId)
      }
    }
  }

  const taxMap = useMemo(() => {
    const map = new Map<number, number>()
    taxList.forEach((tax) => {
      const percent =
        tax.hotel_tax_value ??
        (tax.hotel_cgst && tax.hotel_sgst ? tax.hotel_cgst + tax.hotel_sgst : 0)
      map.set(tax.hotel_taxid, percent)
    })
    return map
  }, [taxList])

  const totalDiscount = useMemo(() => {
    return roomRows.reduce((sum, row) => {
      return sum + (row.discountAmt || 0)
    }, 0)
  }, [roomRows])

  const computeExtraCharges = (
    categoryId: number | null,
    counts: { exPax: number; childPaid: number; driver: number },
    nights: number,
  ) => {
    if (!categoryId || nights <= 0) {
      return {
        exPaxPrice: 0,
        exPaxTax: 0,
        exPaxTaxPercent: 0,
        exPaxTotal: 0,
        childPrice: 0,
        childTax: 0,
        childTaxPercent: 0,
        childTotal: 0,
        driverPrice: 0,
        driverTax: 0,
        driverTaxPercent: 0,
        driverTotal: 0,
      }
    }

    const modeCharges = categoryModeChargesMap.get(categoryId) || []
    const taxMapLocal = taxMap

    const extraPaxMode = modeCharges.find((m: any) => m.mode_name === 'EXTRA_PAX')
    const childMode = modeCharges.find((m: any) => m.mode_name === 'CHILD')
    const driverMode = modeCharges.find((m: any) => m.mode_name === 'DRIVER')

    const compute = (mode: any, count: number) => {
      if (!mode || count <= 0) return { price: 0, tax: 0, taxPercent: 0, total: 0 }

      // Get the per-person charge from the database
      const perPersonCharge = Number(mode.charges) || 0;

      // Calculate total for all persons
      const perNightPrice = perPersonCharge * count;

      let taxPercent = 0;
      if (mode.is_tax_applicable && mode.tax_type) {
        taxPercent = taxMapLocal.get(Number(mode.tax_type)) || 0;
      }

      const perNightTax = (perNightPrice * taxPercent) / 100;
      const perNightTotal = perNightPrice + perNightTax;

      return {
        price: round2(perPersonCharge),  // Return per-person price
        tax: round2(perNightTax),        // Total tax for all persons
        taxPercent,
        total: round2(perNightTotal),    // Total for all persons
      };
    }
    const exPaxCalc = compute(extraPaxMode, counts.exPax)
    const childCalc = compute(childMode, counts.childPaid)
    const driverCalc = compute(driverMode, counts.driver)

    return {
      exPaxPrice: exPaxCalc.price,
      exPaxTax: exPaxCalc.tax,
      exPaxTaxPercent: exPaxCalc.taxPercent,
      exPaxTotal: exPaxCalc.total,
      childPrice: childCalc.price,
      childTax: childCalc.tax,
      childTaxPercent: childCalc.taxPercent,
      childTotal: childCalc.total,
      driverPrice: driverCalc.price,
      driverTax: driverCalc.tax,
      driverTaxPercent: driverCalc.taxPercent,
      driverTotal: driverCalc.total,
    }
  }

  const handleHistoryClick = () => {
    if (!values.guestId) {
      toast.error('Please select a guest first')
      return
    }
    setShowHistoryModal(true)
  }

  const handleShowDocuments = async () => {
    if (!values.guestId) {
      toast.error('Please select a guest first')
      return
    }
    const toastId = toast.loading('Loading documents...')
    await loadGuestDocuments(values.guestId, false)
    toast.dismiss(toastId)
    setShowGuestDocsModal(true)
  }

  const handleOpenDocScan = () => {
    if (!values.guestId) {
      toast.error('Please select a guest first')
      return
    }
    setShowDocScanModal(true)
  }

  // ========== FIX 1: Guest validation before adding room ==========
  const validateGuestBeforeAdd = () => {
    if (!values.guestId) {
      toast.error('Please select or add a guest first before adding a room')
      return false
    }
    return true
  }

  // ========== FIX 2: Check if all selected rooms are added ==========
  const areAllRoomsAdded = (): boolean => {
    if (initialSelectedRooms.length === 0) return false
    const addedRoomIds = new Set(roomRows.map(row => row.roomId))
    return initialSelectedRooms.every(room => addedRoomIds.has(room.roomId))
  }

  const formik = useFormik<CheckInFormData>({

    validateOnChange: false,
    validateOnBlur: false,
    initialValues: {
      guestId: undefined,
      fragment_id: null,
      title: 'MR',
      firstName: '',
      lastName: '',
      phone1: '',
      phone2: '',
      email: '',
      address: '',
      countryId: null,
      stateId: null,
      cityId: null,
      idType: '',
      idNumber: '',
      otherInfo: '',
      companyId: null,
      gst: '',

      arrivalDate: new Date().toISOString().split('T')[0],
      arrivalTime: new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      departureDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      departureTime: '10:00',
      adults: 1,
      pax: 0,
      exPax: 0,
      childrenPaid: 0,
      childrenUnpaid: 0,
      child_charge: 0,
      driver: 0,
      nights: 1,
      bookingType: 'WALK-IN-GUEST',
      planName: 'EP',
      travelAgent: '',
      travelAgentId: null,
      bookingId: '',
      bookingDate: '',
      bookingTime: '',
      bookingDuration: '',
      bookingStatus: '',

      rate: 0,
      ratePerHour: 'EP',
      discount: 0,
      roomService: 0,
      taxableAmt: 0,
      sgst: 0,
      cgst: 0,
      roundOff: 0,
      billAmount: 0,
      otherCharges: 0,
      receivedAmount: 0,
      creditTransfer: 0,
      settDisc: 0,
      balanceAmount: 0,
      totalPayToHotel: 0,

      paymentMethod: 'Cash',

      agentAmount: 0,
      agentAmountPer: 0,
      agentIgst: 0,
      agentIgstPer: 0,
      agentCgst: 0,
      agentCgstPer: 0,
      agentSgst: 0,
      agentSgstPer: 0,
      agentTds: 0,
      agentTdsPer: 0,
      agentTcs: 0,
      agentTcsPer: 0,
      agentCess: 0,
      agentCessPer: 0,
      agentServiceFee: 0,
      agentTotal: 0,
      agentPayToHotel: 0,

      billAPlusOtherC: 0,

      totalAmt: 0,
      totalRoomTariff: 0,

      hotelid: hotelId,
      created_by_id: user?.id,
      roomNo: null,
      roomType: null,
      convertedCategoryId: null,
      roomCharges: 0,

      regNo: '',
      specialInstruction: '',
      message: '',
    },
    validationSchema: Yup.object({
      firstName: Yup.string().required('Guest name required'),
      lastName: Yup.string().optional(),
      phone1: Yup.string().required('Phone required'),
      email: Yup.string().email('Invalid email'),
      arrivalDate: Yup.date().required(),
      departureDate: Yup.date()
        .min(Yup.ref('arrivalDate'), 'Departure must be after arrival')
        .required(),
    }),

    onSubmit: async (values) => {
      // ========== FIX 2: Validate all rooms are added before check-in ==========
      if (roomRows.length === 0) {
        toast.error('Please add at least one room')
        return
      }

      if (!areAllRoomsAdded()) {
        const missingRooms = initialSelectedRooms
          .filter(room => !roomRows.some(row => row.roomId === room.roomId))
          .map(room => room.roomNumber)
          .join(', ')
        toast.error(`Please add all selected rooms before check-in. Missing: ${missingRooms}`)
        return
      }

      setSubmitting(true)

      try {
        const firstRow = roomRows[0]
        const totalNights = firstRow.nights
        // const guestName = firstRow.guestName
        const guestId = firstRow.guestId!

        const checkinDateTime = `${firstRow.arrivalDate} ${firstRow.arrivalTime}:00`
        const checkoutDateTime = `${firstRow.departureDate} ${firstRow.departureTime}:00`

        // ---- Compute totals for master payload ----
        let totRoomTariff = 0
        let totExPaxCharge = 0
        let totChildPaid = 0
        let totDriverCharge = 0
        let totDiscountAmt = 0

        let totCgst = 0, totSgst = 0, totIgst = 0, totCess = 0
        let totExCgst = 0, totExSgst = 0, totExIgst = 0
        let totChildCgst = 0, totChildSgst = 0, totChildIgst = 0
        let totDriverCgst = 0, totDriverSgst = 0, totDriverIgst = 0
        const totServiceCharge = 0
        const totAdvance = safeNumber(values.receivedAmount) || 0

        let totalAmountAllNights = 0

        roomRows.forEach((row) => {
          const nights = row.nights || 1
          const rate = safeNumber(row.rate)
          const discAmt = safeNumber(row.discountAmt)
          const exPaxPrice = safeNumber(row.exPaxPrice)
          const childPrice = safeNumber(row.childPrice)
          const driverPrice = safeNumber(row.driverPrice)
          const cgst = safeNumber(row.cgstAmount)
          const sgst = safeNumber(row.sgstAmount)
          const igst = safeNumber(row.igstAmount)
          const cess = safeNumber(row.cessAmount)
          const exPaxTax = safeNumber(row.exPaxTax)
          const childTax = safeNumber(row.childTax)
          const driverTax = safeNumber(row.driverTax)

          totRoomTariff += rate * nights
          totExPaxCharge += exPaxPrice * nights
          totChildPaid += childPrice * nights
          totDriverCharge += driverPrice * nights
          totDiscountAmt += discAmt
          totCgst += cgst
          totSgst += sgst
          totIgst += igst
          totCess += cess

          // Split extra taxes using same CGST/SGST/IGST ratio as room tax
          const totalTaxP = safeNumber(row.taxPercent) || 1
          const cgstRatio = safeNumber(row.cgstPercent) / totalTaxP
          const sgstRatio = safeNumber(row.sgstPercent) / totalTaxP
          const igstRatio = safeNumber(row.igstPercent) / totalTaxP

          totExCgst += exPaxTax * cgstRatio
          totExSgst += exPaxTax * sgstRatio
          totExIgst += exPaxTax * igstRatio

          totChildCgst += childTax * cgstRatio
          totChildSgst += childTax * sgstRatio
          totChildIgst += childTax * igstRatio

          totDriverCgst += driverTax * cgstRatio
          totDriverSgst += driverTax * sgstRatio
          totDriverIgst += driverTax * igstRatio

          totalAmountAllNights += safeNumber(row.totalAmount)
        })

        const companyName =
          values.companyId === 'WALK-N-GUESTI' || !values.companyId
            ? 'WALK-IN-GUEST'
            : companies.find((c) => c.company_id === values.companyId)?.company_name || 'WALK-IN-GUEST'

        const firstRoomDeptInfo = roomDepartmentMap.get(firstRow.roomId)
        const departmentId = firstRoomDeptInfo?.department_id
        const departmentName = firstRoomDeptInfo?.department_name || ''

        const roomIdsString = roomRows.map((r) => r.roomId).join(',')
        const roomNoString = roomRows.map((r) => r.roomNumber).join(',')   // <-- ye line add karo

        const selectedAgent = values.travelAgentId
          ? travelAgents.find(a => a.agent_id === values.travelAgentId)
          : null;


        // ---- 1. Master Payload (only fields expected by sp_add_checkin) ----
        const masterPayload = {
          guest_id: guestId,
          booking: values.bookingType,
          plan_name: values.planName,
          checkin_datetime: checkinDateTime,
          checkout_datetime: checkoutDateTime,
          room_no: roomNoString,
          room_id: roomIdsString,
          tot_room_tariff: round2(totRoomTariff),
          tot_ex_pax_charge: round2(totExPaxCharge),
          tot_child_paid_amount: round2(totChildPaid),
          tot_driver_charge: round2(totDriverCharge),
          tot_discount_amount: round2(totDiscountAmt),
          tot_cgst_amount: round2(totCgst),
          tot_sgst_amount: round2(totSgst),
          tot_igst_amount: round2(totIgst),
          tot_ex_cgst_amount: round2(totExCgst),
          tot_ex_sgst_amount: round2(totExSgst),
          tot_ex_igst_amount: round2(totExIgst),
          tot_child_cgst_amount: round2(totChildCgst),
          tot_child_sgst_amount: round2(totChildSgst),
          tot_child_igst_amount: round2(totChildIgst),
          tot_driver_cgst_amount: round2(totDriverCgst),
          tot_driver_sgst_amount: round2(totDriverSgst),
          tot_driver_igst_amount: round2(totDriverIgst),
          tot_service_charge_amount: round2(totServiceCharge),
          tot_cess_amount: round2(totCess),
          tot_advance: round2(totAdvance),
          hotelid: hotelId,
          outletid: user?.outletid || 1,
          id_type: values.idType || '',
          id_number: values.idNumber || '',
          department_id: departmentId,
          department_name: departmentName,
          special_instruction: values.specialInstruction || '',
          message: values.message || '',
          total_nights: totalNights,
          total_amount: round2(totalAmountAllNights),
          status: 'active',
          created_by_id: user?.id,
          payment_method: values.paymentMethod || 'Cash', // <-- ADD THIS LINE
           reservation_id: values.reservationId || null,
  reservation_no: values.reservationNo || null,
  checkin_type: checkInType,    // 'walkin' या 'reservation'

          // ----- Agent fields -----
          travel_agent_id: values.travelAgentId || null,
          travel_agent_name: values.travelAgent || null,
          agent_code: selectedAgent?.agent_code || null,
          commission_type: selectedAgent?.commission_type || 'PERCENTAGE',
          commission_value: values.agentAmountPer || 0,
          agent_commission_amount: values.agentAmount || 0,
          agent_cgst_percent: values.agentCgstPer || 0,
          agent_cgst_amount: values.agentCgst || 0,
          agent_sgst_percent: values.agentSgstPer || 0,
          agent_sgst_amount: values.agentSgst || 0,
          agent_igst_percent: values.agentIgstPer || 0,
          agent_igst_amount: values.agentIgst || 0,
          agent_cess_percent: values.agentCessPer || 0,
          agent_cess_amount: values.agentCess || 0,
          agent_tds_percent: values.agentTdsPer || 0,
          agent_tds_amount: values.agentTds || 0,
          agent_tcs_percent: values.agentTcsPer || 0,
          agent_tcs_amount: values.agentTcs || 0,
          agent_service_fee: values.agentServiceFee || 0,
          agent_total_commission: values.agentTotal || 0,
          agent_pay_to_hotel: values.agentPayToHotel || 0,
          booking_id: values.bookingId || null,
          booking_date: values.bookingDate || null,

        }

        // ---- 2. Details Payload (full details per room) ----
        const detailsPayload = roomRows.map((row) => {
          const catId = roomCategories.find((c) => c.category_name === row.type)?.room_category_id || 0
          const nightlyRate = safeNumber(row.rate)
          const discPercent = safeNumber(row.discount)
          const discAmt = (nightlyRate * discPercent) / 100
          const nightlyAfterDisc = nightlyRate - discAmt
          const cgstP = safeNumber(row.cgstPercent)
          const sgstP = safeNumber(row.sgstPercent)
          const igstP = safeNumber(row.igstPercent)
          const cessP = safeNumber(row.cessPercent)
          const totalTaxP = cgstP + sgstP + igstP + cessP
          const taxAmount = (nightlyAfterDisc * totalTaxP) / 100
          const cgstAmt = (nightlyAfterDisc * cgstP) / 100
          const sgstAmt = (nightlyAfterDisc * sgstP) / 100
          const igstAmt = (nightlyAfterDisc * igstP) / 100
          const cessAmt = (nightlyAfterDisc * cessP) / 100

          const exPaxPrice = safeNumber(row.exPaxPrice)
          const childPrice = safeNumber(row.childPrice)
          const driverPrice = safeNumber(row.driverPrice)
          const exPaxTax = safeNumber(row.exPaxTax)
          const childTax = safeNumber(row.childTax)
          const driverTax = safeNumber(row.driverTax)

          const totalTaxPRatio = totalTaxP || 1
          const cgstRatio = cgstP / totalTaxPRatio
          const sgstRatio = sgstP / totalTaxPRatio
          const igstRatio = igstP / totalTaxPRatio

          return {
            guest_id: row.guestId || 0,
            guest_name: row.guestName || '',
            address: values.address || '',
            mobile: values.phone1 || '',
            company_id: values.companyId === 'WALK-N-GUESTI' ? null : values.companyId,
            company_name: companyName,
            emailed: values.email || '',
            room_id: row.roomId || 0,
            room_number: row.roomNumber || '',
            room_category_id: catId || 0,
            room_category_name: row.type || '',
            converted_category_id: row.convertedCategoryId || 0,
            converted_category_name: row.convertedCategoryName || '',
            checkin_datetime: checkinDateTime,
            checkout_datetime: checkoutDateTime,
            no_of_days: totalNights,
            adults: row.adults || 0,
            pax: row.pax || 0,
            ex_pax: row.exPax || 0,
            child_paid: row.childPaid || 0,
            child_unpaid: row.childUnpaid || 0,
            driver: row.driver || 0,
            room_tariff: nightlyRate,
            ex_pax_charge: exPaxPrice,
            child_paid_amount: childPrice,
            driver_charge: driverPrice,
            discount_percent: discPercent,
            discount_amount: discAmt,
            tax_percen_room: totalTaxP,
            cgst_percent: cgstP,
            cgst_amount: cgstAmt,
            sgst_percent: sgstP,
            sgst_amount: sgstAmt,
            igst_percent: igstP,
            igst_amount: igstAmt,
            tax_percen_ex: row.exPaxTaxPercent || 0,
            ex_cgst_percent: cgstP,
            ex_cgst_amount: exPaxTax * cgstRatio,
            ex_sgst_percent: sgstP,
            ex_sgst_amount: exPaxTax * sgstRatio,
            ex_igst_percent: igstP,
            ex_igst_amount: exPaxTax * igstRatio,
            tax_percen_child: row.childTaxPercent || 0,
            child_cgst_percent: cgstP,
            child_cgst_amount: childTax * cgstRatio,
            child_sgst_percent: sgstP,
            child_sgst_amount: childTax * sgstRatio,
            child_igst_percent: igstP,
            child_igst_amount: childTax * igstRatio,
            tax_percen_driver: row.driverTaxPercent || 0,
            driver_cgst_percent: cgstP,
            driver_cgst_amount: driverTax * cgstRatio,
            driver_sgst_percent: sgstP,
            driver_sgst_amount: driverTax * sgstRatio,
            driver_igst_percent: igstP,
            driver_igst_amount: driverTax * igstRatio,
            service_charge: 0,
            service_charge_amount: 0,
            cess_percent: cessP,
            cess_amount: cessAmt,
            tax: taxAmount + exPaxTax + childTax + driverTax,
          }
        })

        // ---- 3. Room Charges Payload ----
        const roomChargesPayload = roomRows.map((row) => {
          const catId = roomCategories.find((c) => c.category_name === row.type)?.room_category_id
          // const perDayTotalAmount = (row.totalAmount || 0) / totalNights

          return {
            guest_id: row.guestId || 0,
            guest_name: row.guestName || '',
            address: values.address || '',
            mobile: values.phone1 || '',
            // ⚠️ Change: company_id = 0 instead of null for walk‑in
            company_id: values.companyId === 'WALK-N-GUESTI' ? 0 : Number(values.companyId) || 0,
            company_name: companyName || '',
            emailed: values.email || '',
            room_id: row.roomId || 0,
            room_number: row.roomNumber || '',
            room_category_id: catId || 0,
            room_category_name: row.type || '',
            converted_category_id: row.convertedCategoryId || 0,
            converted_category_name: row.convertedCategoryName || '',
            checkin_datetime: checkinDateTime,
            checkout_datetime: checkoutDateTime,
            no_of_days: totalNights,
            adults: row.adults || 0,
            pax: row.pax || 0,
            ex_pax: row.exPax || 0,
            child_paid: row.childPaid || 0,
            child_unpaid: row.childUnpaid || 0,
            driver: row.driver || 0,
            room_tariff: row.rate || 0,
            ex_pax_charge: row.exPaxPrice || 0,
            child_paid_amount: row.childPrice || 0,
            driver_charge: row.driverPrice || 0,
            discount_percent: row.discount || 0,
            discount_amount: (row.rate * (row.discount || 0)) / 100 || 0,
            tax_percen_room: row.taxPercent || 0,
            cgst_percent: row.cgstPercent || 0,
            cgst_amount: row.cgstAmount || 0,
            sgst_percent: row.sgstPercent || 0,
            sgst_amount: row.sgstAmount || 0,
            igst_percent: row.igstPercent || 0,
            tax_percen_ex: row.exPaxTaxPercent || 0,
            ex_cgst_percent: row.cgstPercent || 0,
            ex_cgst_amount: (row.exPaxTax || 0) * ((row.cgstPercent || 0) / 100) || 0,
            ex_sgst_percent: row.sgstPercent || 0,
            ex_sgst_amount: (row.exPaxTax || 0) * ((row.sgstPercent || 0) / 100) || 0,
            ex_igst_percent: row.igstPercent || 0,
            ex_igst_amount: (row.exPaxTax || 0) * ((row.igstPercent || 0) / 100) || 0,
            tax_percen_child: row.childTaxPercent || 0,
            child_cgst_percent: row.cgstPercent || 0,
            child_cgst_amount: (row.childTax || 0) * ((row.cgstPercent || 0) / 100) || 0,
            child_sgst_percent: row.sgstPercent || 0,
            child_sgst_amount: (row.childTax || 0) * ((row.sgstPercent || 0) / 100) || 0,
            child_igst_percent: row.igstPercent || 0,
            child_igst_amount: (row.childTax || 0) * ((row.igstPercent || 0) / 100) || 0,
            tax_percen_driver: row.driverTaxPercent || 0,
            driver_cgst_percent: row.cgstPercent || 0,
            driver_cgst_amount: (row.driverTax || 0) * ((row.cgstPercent || 0) / 100) || 0,
            driver_sgst_percent: row.sgstPercent || 0,
            driver_sgst_amount: (row.driverTax || 0) * ((row.sgstPercent || 0) / 100) || 0,
            driver_igst_percent: row.igstPercent || 0,
            driver_igst_amount: (row.driverTax || 0) * ((row.igstPercent || 0) / 100) || 0,
            service_charge: 0,
            service_charge_amount: 0,
            cess_percent: row.cessPercent || 0,
            cess_amount: row.cessAmount || 0,
            tax: row.totalTax || 0,
          };
        });

        // ---- 4. Folio Entries ----
        const folioEntries: any[] = []

        roomRows.forEach((row) => {
          folioEntries.push({
            hotel_id: hotelId,
            room_id: row.roomId || 0,
            transaction_type: 'Room Charges',
            transaction_datetime: new Date().toISOString().slice(0, 19).replace('T', ' '),
            description: `Check-in Day `,
            debit_amount: (row.totalAmount || 0) / totalNights,
            credit_amount: 0,
            reference_number: null,
            payment_method: values.paymentMethod,
          })
        })

        if (values.receivedAmount && Number(values.receivedAmount) > 0) {
          folioEntries.push({
            hotel_id: hotelId,
            room_id: roomRows[0]?.roomId || 0,
            transaction_type: 'Payment',
            transaction_datetime: new Date().toISOString().slice(0, 19).replace('T', ' '),
            description: 'Payment received at check-in',
            debit_amount: 0,
            credit_amount: Number(values.receivedAmount),
            reference_number: '',
            payment_method: values.paymentMethod,
          })
        }

        // ---- 5. Final Payload ----
        const finalPayload: any = {
          ...masterPayload,
          details: detailsPayload,
          room_charges: roomChargesPayload,
          folio_entries: folioEntries,
        }

        // ---- 6. API Call ----
        const response = await CheckInService.create(finalPayload)

        if (!response.success) {
          throw new Error(response.message || 'Check-in failed')
        }

        // ---- 7. Upload Guest Photo if any ----
        if (tempGuestPhoto && guestId) {
          try {
            await GuestService.uploadGuestPhoto(guestId, tempGuestPhoto)
            setTempGuestPhoto(null)
          } catch (photoErr) {
            console.error('Guest photo upload failed after check-in:', photoErr)
            toast.error('Check-in saved, but guest photo could not be uploaded.')
          }
        }

        toast.success(`Checked in ${roomRows.length} room(s) for ${totalNights} day(s) successfully`)
        navigate(-1)

      } catch (error: any) {
        console.error('Check-in submission failed:', error)
        toast.error(error.response?.data?.message || error.message || 'Check-in failed')
      } finally {
        setSubmitting(false)
      }
    },
  })

  const { handleSubmit, setFieldValue, values } = formik

  useEffect(() => {
    if (hotelId) {
      fetchFrontDeskSettings()
    }
  }, [hotelId, user?.outletid])

  useEffect(() => {
    if (!frontDeskSettings) return

    const { arrivalDate, arrivalTime, nights } = values

    let departureDateStr = ''
    if (arrivalDate && nights && nights > 0) {
      const arrival = new Date(arrivalDate)
      const departure = new Date(arrival)
      departure.setDate(departure.getDate() + Number(nights))
      departureDateStr = departure.toISOString().split('T')[0]
    } else {
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      departureDateStr = tomorrow.toISOString().split('T')[0]
    }

    let departureTimeStr = '12:00'

    if (frontDeskSettings.checkout_time_setting === '12_NOON') {
      departureTimeStr = frontDeskSettings.fixed_checkout_time || '12:00'
    } else if (frontDeskSettings.checkout_time_setting === '24_HOURS') {
      departureTimeStr = arrivalTime || '12:00'
    }

    if (values.departureDate !== departureDateStr) {
      setFieldValue('departureDate', departureDateStr)
    }
    if (values.departureTime !== departureTimeStr) {
      setFieldValue('departureTime', departureTimeStr)
    }

  }, [frontDeskSettings, values.arrivalDate, values.arrivalTime, values.nights, values.departureDate, values.departureTime, setFieldValue])

  useEffect(() => {
    formik.setFieldValue('settDisc', totalDiscount)
  }, [totalDiscount])

  useEffect(() => {
    const effectiveCategoryId = values.convertedCategoryId ?? values.roomType
    if (!effectiveCategoryId) return
    const adultCount = values.adults || 0
    const standardPax = categoryStandardPaxMap.get(effectiveCategoryId) || 0
    const details = categoryDetailsMap.get(effectiveCategoryId)
    const tariffs: Array<{ no_of_pax: number; room_tariff: number }> = details?.tariffs || []

    if (tariffs.length > 0 && adultCount > 0) {
      const { pax, exPax, tariff } = getTariffForPax(tariffs, adultCount)
      if (values.pax !== pax) setFieldValue('pax', pax)
      if (values.exPax !== exPax) setFieldValue('exPax', exPax)
      if (!roomChargeEditable) {
        setSelectedRoomTariff(tariff)
        setFieldValue('roomCharges', tariff)
      }
    } else if (standardPax > 0) {
      const newPax = standardPax
      const newExPax = Math.max(0, adultCount - standardPax)
      if (values.pax !== newPax) setFieldValue('pax', newPax)
      if (values.exPax !== newExPax) setFieldValue('exPax', newExPax)
    }
  }, [
    values.adults,
    values.convertedCategoryId,
    values.roomType,
    values.nights,
    categoryStandardPaxMap,
    categoryDetailsMap,
    roomChargeEditable,
    setFieldValue,
  ])

  useEffect(() => {
    const totalDiscountSum = roomRows.reduce((sum, row) => sum + (row.discountAmt || 0), 0)
    if (Math.abs((values.settDisc || 0) - totalDiscountSum) > 0.01) {
      setFieldValue('settDisc', round2(totalDiscountSum))
    }
  }, [roomRows, values.settDisc, setFieldValue])

  useEffect(() => {
    if (roomRows.length === 0) {
      setFieldValue('billAmount', 0)
      setFieldValue('otherCharges', 0)
      setFieldValue('billAPlusOtherC', 0)
      setFieldValue('taxableAmt', 0)
      setFieldValue('sgst', 0)
      setFieldValue('cgst', 0)
      setFieldValue('discount', 0)
      setFieldValue('roomService', 0)
      setFieldValue('roundOff', 0)
      setFieldValue('totalAmt', 0)
      return
    }

    let totalRate = 0
    let totalTax = 0
    let totalExtra = 0
    let totalBaseExtra = 0
    let totalSGST = 0
    let totalCGST = 0
    let totalAmt = 0

    roomRows.forEach((row) => {
      const baseAmount = safeNumber(row.rate) * safeNumber(row.nights)
      const discountAmt = safeNumber(row.discountAmt)
      const afterDiscount = round2(baseAmount - discountAmt)

      totalRate += afterDiscount
      totalTax += safeNumber(row.taxAmount)
      totalExtra += (safeNumber(row.exPaxTotal) * safeNumber(row.nights)) +
        (safeNumber(row.childTotal) * safeNumber(row.nights)) +
        (safeNumber(row.driverTotal) * safeNumber(row.nights))
      totalBaseExtra += (safeNumber(row.exPaxPrice) * safeNumber(row.nights)) +
        (safeNumber(row.childPrice) * safeNumber(row.nights)) +
        (safeNumber(row.driverPrice) * safeNumber(row.nights))

      totalSGST += safeNumber(row.sgstAmount)
      totalCGST += safeNumber(row.cgstAmount)

      const extraTax = (safeNumber(row.exPaxTax) * safeNumber(row.nights)) +
        (safeNumber(row.childTax) * safeNumber(row.nights)) +
        (safeNumber(row.driverTax) * safeNumber(row.nights))
      const halfExtraTax = extraTax / 2
      totalSGST += halfExtraTax
      totalCGST += halfExtraTax

      totalAmt += safeNumber(row.totalAmount)
    })

    const billAmount = round2(totalRate + totalTax)
    const otherCharges = round2(totalExtra)
    const billAPlusOtherC = round2(billAmount + otherCharges)
    const taxableAmt = round2(totalRate + totalBaseExtra)

    if (Math.abs((values.billAmount || 0) - billAmount) > 0.01) {
      setFieldValue('billAmount', round2(billAmount))
    }
    if (Math.abs((values.otherCharges || 0) - otherCharges) > 0.01) {
      setFieldValue('otherCharges', round2(otherCharges))
    }
    if (Math.abs((values.billAPlusOtherC || 0) - billAPlusOtherC) > 0.01) {
      setFieldValue('billAPlusOtherC', round2(billAPlusOtherC))
    }
    if (Math.abs((values.taxableAmt || 0) - taxableAmt) > 0.01) {
      setFieldValue('taxableAmt', round2(taxableAmt))
    }
    if (Math.abs((values.sgst || 0) - totalSGST) > 0.01) {
      setFieldValue('sgst', round2(totalSGST))
    }
    if (Math.abs((values.cgst || 0) - totalCGST) > 0.01) {
      setFieldValue('cgst', round2(totalCGST))
    }
    if (Math.abs((values.totalAmt || 0) - totalAmt) > 0.01) {
      setFieldValue('totalAmt', round2(totalAmt))
    }
  }, [
    roomRows,
    setFieldValue,
    values.billAmount,
    values.otherCharges,
    values.billAPlusOtherC,
    values.taxableAmt,
    values.sgst,
    values.cgst,
    values.totalAmt,
  ])

  useEffect(() => {
    const roomTariff = values.totalRoomTariff || 0
    const commissionPercent = values.agentAmountPer || 0
    const commissionAmount = round2((roomTariff * commissionPercent) / 100)
    if (Math.abs((values.agentAmount || 0) - commissionAmount) > 0.01) {
      setFieldValue('agentAmount', commissionAmount)
    }
  }, [values.totalRoomTariff, values.agentAmountPer, values.agentAmount, setFieldValue])

  useEffect(() => {
    const tariff = roomRows.reduce((sum, row) => sum + row.rate * row.nights, 0)
    setFieldValue('totalRoomTariff', round2(tariff))
  }, [roomRows, setFieldValue])

  useEffect(() => {
    const commission = values.agentAmount || 0
    const roomTariff = values.totalRoomTariff || 0

    const computeOnCommission = (percent: number | undefined) =>
      round2((commission * (percent || 0)) / 100)
    const computeOnTariff = (percent: number | undefined) =>
      round2((roomTariff * (percent || 0)) / 100)

    const newIgst = computeOnCommission(values.agentIgstPer)
    const newCgst = computeOnCommission(values.agentCgstPer)
    const newSgst = computeOnCommission(values.agentSgstPer)
    const newCess = computeOnCommission(values.agentCessPer)
    const newTds = computeOnTariff(values.agentTdsPer)
    const newTcs = computeOnTariff(values.agentTcsPer)

    if (Math.abs((values.agentIgst || 0) - newIgst) > 0.01) setFieldValue('agentIgst', newIgst)
    if (Math.abs((values.agentCgst || 0) - newCgst) > 0.01) setFieldValue('agentCgst', newCgst)
    if (Math.abs((values.agentSgst || 0) - newSgst) > 0.01) setFieldValue('agentSgst', newSgst)
    if (Math.abs((values.agentCess || 0) - newCess) > 0.01) setFieldValue('agentCess', newCess)
    if (Math.abs((values.agentTds || 0) - newTds) > 0.01) setFieldValue('agentTds', newTds)
    if (Math.abs((values.agentTcs || 0) - newTcs) > 0.01) setFieldValue('agentTcs', newTcs)
  }, [
    values.agentAmount,
    values.totalRoomTariff,
    values.agentIgstPer,
    values.agentCgstPer,
    values.agentSgstPer,
    values.agentCessPer,
    values.agentTdsPer,
    values.agentTcsPer,
    values.agentIgst,
    values.agentCgst,
    values.agentSgst,
    values.agentCess,
    values.agentTds,
    values.agentTcs,
    setFieldValue,
  ])

  useEffect(() => {
    const commission = safeNumber(values.agentAmount)
    const igst = safeNumber(values.agentIgst)
    const cgst = safeNumber(values.agentCgst)
    const sgst = safeNumber(values.agentSgst)
    const cess = safeNumber(values.agentCess)
    const tds = safeNumber(values.agentTds)
    const tcs = safeNumber(values.agentTcs)
    const serviceFee = safeNumber(values.agentServiceFee)
    const totalAmt = safeNumber(values.totalAmt)

    const agentTotal = round2(commission + igst + cgst + sgst + cess + serviceFee)
    const agentPayToHotel = round2(totalAmt - agentTotal - tds - tcs)

    if (Math.abs(safeNumber(values.agentTotal) - agentTotal) > 0.01) {
      setFieldValue('agentTotal', agentTotal)
    }
    if (Math.abs(safeNumber(values.agentPayToHotel) - agentPayToHotel) > 0.01) {
      setFieldValue('agentPayToHotel', agentPayToHotel)
    }
  }, [
    values.agentAmount,
    values.agentIgst,
    values.agentCgst,
    values.agentSgst,
    values.agentCess,
    values.agentTds,
    values.agentTcs,
    values.agentServiceFee,
    values.totalAmt,
    setFieldValue
  ])

 
  const idTypeOptions: Option[] = documentTypes.map((dt) => ({
    label: dt.name,
    value: dt.id,
  }))
  const categoryOptions: Option[] = roomCategories.map((c) => ({
    label: String(c.category_name),
    value: c.room_category_id,
  }))

  const roomOptions = useMemo(() => {
    const options = initialSelectedRooms
      .filter((room) => !roomRows.some((row) => row.roomId === room.roomId))
      .map((r) => ({
        label: r.roomNumber,
        value: r.roomId,
      }))

    if (editingRowId) {
      const editingRoom = roomRows.find((row) => row.id === editingRowId)
      if (editingRoom) {
        const alreadyExists = options.some((opt) => opt.value === editingRoom.roomId)
        if (!alreadyExists) {
          options.push({
            label: editingRoom.roomNumber,
            value: editingRoom.roomId,
          })
        }
      }
    }

    return options
  }, [initialSelectedRooms, roomRows, editingRowId])

  useEffect(() => {
    if (editingRowId || values.roomNo) return
    const nextRoom = initialSelectedRooms.find(
      (r) => !roomRows.some((row) => row.roomId === r.roomId),
    )
    if (nextRoom && roomCategories.length > 0) {
      handleRoomNoChange(nextRoom.roomId)
    }
  }, [initialSelectedRooms, roomRows, editingRowId, roomCategories])

  useEffect(() => {
    if (!values.guestId || editingRowId || values.roomNo) return
    const nextRoom = initialSelectedRooms.find(
      (r) => !roomRows.some((row) => row.roomId === r.roomId),
    )
    if (nextRoom && roomCategories.length > 0) {
      handleRoomNoChange(nextRoom.roomId)
    }
  }, [values.guestId])

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      minHeight: '28px',
      fontSize: '0.7rem',
      padding: '0',
    }),
    valueContainer: (base: any) => ({
      ...base,
      padding: '0 4px',
    }),
    input: (base: any) => ({
      ...base,
      margin: '0',
      padding: '0',
    }),
    indicatorsContainer: (base: any) => ({
      ...base,
      height: '28px',
    }),
    dropdownIndicator: (base: any) => ({
      ...base,
      padding: '0 4px',
    }),
    clearIndicator: (base: any) => ({
      ...base,
      padding: '0 4px',
    }),
    menu: (base: any) => ({
      ...base,
      fontSize: '0.7rem',
    }),
    option: (base: any) => ({
      ...base,
      padding: '2px 8px',
    }),
  }

  // ========== FIX 1: Add guest validation in handleAddOrUpdateRow ==========
  const handleAddOrUpdateRow = () => {
    // Check if guest is selected
    if (!validateGuestBeforeAdd()) {
      return
    }

    const selectedRoomId = values.roomNo
    if (!selectedRoomId) {
      toast.error('Please select a room')
      return
    }
    const selectedRoom = initialSelectedRooms.find((r) => r.roomId === selectedRoomId)
    if (!selectedRoom) return

    const selectedCategoryId = values.roomType
    if (!selectedCategoryId) {
      toast.error('Please select a room type')
      return
    }

    const selectedCategory = roomCategories.find((c) => c.room_category_id === selectedCategoryId)
    if (!selectedCategory) {
      toast.error('Invalid room type')
      return
    }
    const selectedCategoryName = selectedCategory.category_name

    const convertedCategoryId = values.convertedCategoryId
    const convertedCategory = convertedCategoryId
      ? roomCategories.find((c) => c.room_category_id === convertedCategoryId)
      : null

    let taxTypeId = null
    const effectiveCategoryId = convertedCategoryId ?? selectedCategoryId
    const categoryDetails = categoryDetailsMap.get(effectiveCategoryId)

    if (categoryDetails && categoryDetails.tariffs && categoryDetails.tariffs.length > 0) {
      taxTypeId = categoryDetails.tariffs[0].tax_type
    }

    const taxDetails = taxTypeId ? taxDetailsMap.get(Number(taxTypeId)) : null
    const cgstPercent = safeNumber(taxDetails?.hotel_cgst)
    const sgstPercent = safeNumber(taxDetails?.hotel_sgst)
    const igstPercent = safeNumber(taxDetails?.hotel_igst)
    const cessPercent = safeNumber(taxDetails?.hotel_cess)

    const rate = safeNumber(values.roomCharges) || safeNumber(selectedRoomTariff)
    const nights = safeNumber(values.nights) || 1
    const baseAmount = round2(rate * nights)

    const discountPercent = safeNumber(values.discount)
    const discountAmt = round2((baseAmount * discountPercent) / 100)
    const afterDiscount = round2(baseAmount - discountAmt)

    const taxPercent = cgstPercent + sgstPercent + igstPercent + cessPercent
    const taxAmount = round2((afterDiscount * taxPercent) / 100)

    const cgstAmount = round2((afterDiscount * cgstPercent) / 100)
    const sgstAmount = round2((afterDiscount * sgstPercent) / 100)

    const extraDaily = computeExtraCharges(
      effectiveCategoryId,
      {
        exPax: safeNumber(values.exPax),
        childPaid: safeNumber(values.childrenPaid),
        driver: safeNumber(values.driver),
      },
      nights,
    )

    const extraChargesTotal = round2(
      (extraDaily.exPaxTotal * nights) + (extraDaily.childTotal * nights) + (extraDaily.driverTotal * nights),
    )

    const totalAmount = round2(afterDiscount + taxAmount + extraChargesTotal)

    const guestName = [values.firstName, values.lastName].filter(Boolean).join(' ').trim() || values.firstName || ''

    const rowFields = {
      guestId: values.guestId || null,
      guestName,
      roomCategoryId: selectedCategoryId,
      type: selectedCategoryName,
      convertedCategoryId: convertedCategoryId || null,
      convertedCategoryName: convertedCategory?.category_name || '',
      driver: safeNumber(values.driver),
      childUnpaid: safeNumber(values.childrenUnpaid),
      childPaid: safeNumber(values.childrenPaid),
      arrivalDate: values.arrivalDate,
      arrivalTime: values.arrivalTime,
      departureDate: values.departureDate,
      departureTime: values.departureTime,
      nights,
      rate,
      discount: discountPercent,
      discountAmt,
      taxPercent,
      taxAmount,
      pax: safeNumber(values.pax),
      exPax: safeNumber(values.exPax),
      adults: safeNumber(values.adults),
      taxTypeId: taxTypeId ? Number(taxTypeId) : undefined,
      cgstPercent,
      sgstPercent,
      igstPercent,
      cessPercent,
      exPaxPrice: extraDaily.exPaxPrice,
      exPaxTax: extraDaily.exPaxTax,
      exPaxTaxPercent: extraDaily.exPaxTaxPercent,
      exPaxTotal: extraDaily.exPaxTotal,
      childPrice: extraDaily.childPrice,
      childTax: extraDaily.childTax,
      childTaxPercent: extraDaily.childTaxPercent,
      childTotal: extraDaily.childTotal,
      driverPrice: extraDaily.driverPrice,
      driverTax: extraDaily.driverTax,
      driverTaxPercent: extraDaily.driverTaxPercent,
      driverTotal: extraDaily.driverTotal,
      totalAmount,
      cgstAmount,
      sgstAmount,
    }

    if (editingRowId) {
      if (!roomRows.find((row) => row.id === editingRowId)) return

      const updatedRows = roomRows.map((row) =>
        row.id === editingRowId ? { ...row, ...rowFields } : row,
      )
      setRoomRows(updatedRows)
      setEditingRowId(null)
      setSelectedRowId(null)
      setRoomChargeEditable(false)
      toast.success('Room updated')
    } else {
      if (roomRows.some((row) => row.roomId === selectedRoomId)) {
        toast.error('Room already added')
        return
      }

      const newRow: RoomRow = {
        id: `${selectedRoomId}-${Date.now()}`,
        roomId: selectedRoomId,
        roomNumber: selectedRoom.roomNumber,
        ...rowFields,
      }
      setRoomRows([...roomRows, newRow])
      setSelectedRowId(null)
      setRoomChargeEditable(false)

      // ========== FIX 2: Show progress toast ==========
      const addedCount = roomRows.length + 1
      const totalCount = initialSelectedRooms.length
      if (addedCount < totalCount) {
        toast.success(`Room added (${addedCount}/${totalCount} rooms added)`)
      } else if (addedCount === totalCount) {
        toast.success(`All ${totalCount} rooms added! Ready for check-in.`)
      } else {
        toast.success('Room added')
      }
    }

    setFieldValue('roomNo', null)
    setFieldValue('roomType', null)
    setFieldValue('convertedCategoryId', null)
    setFieldValue('driver', 0)
    setFieldValue('roomCharges', 0)
    setFieldValue('childrenPaid', 0)
    setFieldValue('childrenUnpaid', 0)
    setSelectedRoomTariff(0)
    setSelectedCategoryName('')
    setSelectedRoomCategoryPax(0)
  }

  const handleEditRow = (row: RoomRow) => {
    setEditingRowId(row.id)
    setFieldValue('guestId', row.guestId)
    setFieldValue('roomNo', row.roomId)
    setFieldValue('roomType', row.roomCategoryId)
    setFieldValue('convertedCategoryId', row.convertedCategoryId)
    setFieldValue('roomCharges', row.rate)
    setFieldValue('arrivalDate', row.arrivalDate)
    setFieldValue('arrivalTime', row.arrivalTime)
    setFieldValue('departureDate', row.departureDate)
    setFieldValue('departureTime', row.departureTime)
    setFieldValue('nights', row.nights)
    setFieldValue('discount', row.discount)
    setFieldValue('driver', row.driver)
    setFieldValue('pax', row.pax)
    setFieldValue('exPax', row.exPax)
    setFieldValue('childrenPaid', row.childPaid)
    setFieldValue('childrenUnpaid', row.childUnpaid)
    setSelectedRoomTariff(row.rate)
    setSelectedCategoryName(row.type)
    setRoomChargeEditable(true)
  }

  const handleDeleteRow = (rowId: string) => {
    setRoomRows(roomRows.filter((row) => row.id !== rowId))
    if (editingRowId === rowId) {
      setEditingRowId(null)
    }
    if (selectedRowId === rowId) {
      setSelectedRowId(null)
    }
    toast.success('Room removed')
  }

  const getGuestName = () => {
    const firstName = values.firstName || ''
    const lastName = values.lastName || ''
    return `${firstName} ${lastName}`.trim() || 'Guest'
  }

  const formatCellValue = (value: any, digits: number = 2): string => {
    if (value === null || value === undefined) return '0'
    const num = Number(value)
    if (isNaN(num)) return '0'
    return num.toFixed(digits)
  }

  // ========== FIX 2: Check if check-in button should be disabled ==========
  const isCheckInDisabled = () => {
    if (submitting) return true
    if (roomRows.length === 0) return true
    return !areAllRoomsAdded()
  }

  // ========== FIX 2: Get missing rooms message for tooltip ==========
  const getMissingRoomsMessage = () => {
    if (roomRows.length === 0) return 'Please add at least one room'
    if (!areAllRoomsAdded()) {
      const missing = initialSelectedRooms
        .filter(room => !roomRows.some(row => row.roomId === room.roomId))
        .map(room => room.roomNumber)
        .join(', ')
      return `Please add all rooms: ${missing}`
    }
    return ''
  }

  return (
    <FormikProvider value={formik}>
      <style>{`
        /* ===== ROOT VARIABLES & SCALING ===== */
        :root {
          --page-scale: clamp(0.75, 1.2vw + 0.5, 1);
          --font-scale: clamp(10px, 0.9vw + 8px, 14px);
          --input-scale: clamp(24px, 2.5vh + 12px, 34px);
          --button-scale: clamp(26px, 2vh + 16px, 34px);
          --table-row-scale: clamp(28px, 3vh, 36px);
          --header-bg: #a6b8e6;
          --label-w: 110px;
        }

        /* ===== XL (1920+) ===== */
        @media (min-width: 1920px) {
          :root {
            --font-scale: 15px;
            --input-scale: 36px;
            --label-w: 100px;
          }
        }

        /* ===== LAPTOP (1024-1439) ===== */
        @media (min-width: 1024px) and (max-width: 1439.98px) {
          :root {
            --font-scale: 12px;
            --input-scale: 28px;
            --label-w: 80px;
          }
        }

        /* ===== TABLET (768-1023) ===== */
        @media (min-width: 768px) and (max-width: 1023.98px) {
          :root {
            --font-scale: 11px;
            --input-scale: 26px;
            --label-w: 90px;
          }
        }

        /* ===== MOBILE (320-767) ===== */
        @media (max-width: 767.98px) {
          :root {
            --font-scale: 11px;
            --input-scale: 28px;
            --label-w: 90px;
          }
        }

        /* ===== MAIN CONTAINER ===== */
        .checkin-responsive-container {
          max-width: 1920px;
          margin: 0 auto;
          width: 100%;
          height: 100vh;
          max-height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          background: #f8f9fa;
        }

        /* Mobile: sticky top (regno + tabs), scroll middle, sticky bottom */
        @media (max-width: 767.98px) {
          .checkin-responsive-container {
            height: 100dvh;
            overflow: hidden;
          }
          .regno-header-bar { position: sticky; top: 0; z-index: 100; flex-shrink: 0; }
          .mobile-tab-nav-wrapper { position: sticky; top: 0; z-index: 99; flex-shrink: 0; }
          .checkin-scroll-body {
            flex: 1 1 0;
            overflow-y: auto;
            overflow-x: hidden;
            -webkit-overflow-scrolling: touch;
          }
          .fixed-bottom-bar { position: sticky; bottom: 0; z-index: 100; flex-shrink: 0; }
        }

        .checkin-responsive-container .card {
          min-height: 0;
          overflow: hidden;
          border-radius: 0;
          box-shadow: none;
        }

        .checkin-responsive-container form {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        /* On mobile the card body should just be normal flow (scrolling handled by checkin-scroll-body) */
        @media (max-width: 767.98px) {
          .checkin-responsive-container .card { overflow: visible; flex-shrink: 0; }
          .checkin-responsive-container .card-body { overflow: visible !important; }
          .checkin-responsive-container form { overflow: visible; }
        }

        /* ===== SCALED TEXT & INPUTS ===== */
        body, input, select, textarea, button, .fs-small, .form-label, .badge, .btn {
          font-size: var(--font-scale) !important;
        }

        input.form-control-sm, select.form-select-sm, .form-control-sm {
          height: var(--input-scale) !important;
          min-height: var(--input-scale) !important;
          padding: 0 6px !important;
        }

        .btn-sm {
          height: var(--button-scale) !important;
          padding: 0 10px !important;
          font-size: var(--font-scale) !important;
        }

        /* ===== TABLE ===== */
        .table-sm-compact tbody tr {
          height: var(--table-row-scale) !important;
        }
        .table-sm-compact th, .table-sm-compact td {
          padding: 0px 7px !important;
          font-size: 11px;
        }

        /* ===== REACT SELECT ===== */
        .react-select__control {
          min-height: var(--input-scale) !important;
          font-size: var(--font-scale) !important;
        }
        .react-select__valueContainer {
          padding: 0 4px !important;
        }
        .react-select__indicators {
          height: var(--input-scale) !important;
        }

        /* ===== SCROLLABLE TABLE ===== */
        .scrollable-table {
          max-height: 155px;
          overflow-x: auto;
          overflow-y: auto;
          border: 1px solid #dee2e6;
          position: relative;
        }
        .scrollable-table table {
          border-collapse: collapse !important;
          border-spacing: 0;
          border: 1px solid #b5b5b5 !important;
          font-size: 11px !important;
        }
        .scrollable-table thead th {
          position: sticky;
          top: 0;
          z-index: 2;
          background-color: #d9d9d9 !important;
        }
        .scrollable-table th {
          font-size: 10px !important;
          font-weight: 600;
          border: 1px solid #b5b5b5 !important;
          padding: 4px 6px !important;
          white-space: nowrap;
        }
        .scrollable-table td {
          font-size: 10px !important;
          border: 1px solid #d0d0d0 !important;
          padding: 0px 6px !important;
          vertical-align: middle;
        }
        .scrollable-table tbody tr { height: 32px; }
        /* ===== LIGHT GRAY SCROLLBAR — Card.Body & checkin-scroll-body ===== */
        .card-body::-webkit-scrollbar,
        .checkin-scroll-body::-webkit-scrollbar { width: 5px; height: 5px; }
        .card-body::-webkit-scrollbar-track,
        .checkin-scroll-body::-webkit-scrollbar-track { background: #f5f5f5; }
        .card-body::-webkit-scrollbar-thumb,
        .checkin-scroll-body::-webkit-scrollbar-thumb { background: #d0d0d0; border-radius: 4px; }
        .card-body::-webkit-scrollbar-thumb:hover,
        .checkin-scroll-body::-webkit-scrollbar-thumb:hover { background: #b8b8b8; }

        .scrollable-table::-webkit-scrollbar { width: 5px; height: 5px; }
        .scrollable-table::-webkit-scrollbar-track { background: #f1f1f1; }
        .scrollable-table::-webkit-scrollbar-thumb { background: #c8c8c8; border-radius: 3px; }
        .scrollable-table::-webkit-scrollbar-thumb:hover { background: #aaa; }

        /* ===== SECTION HEADERS ===== */
        .section-header {
          background-color: var(--header-bg);
          color: #333;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2px 10px;
          margin-bottom: 4px;
          font-weight: 600;
          font-size: var(--font-scale);
          min-height: 24px;
        }
        .section-header .fw-bold { font-size: var(--font-scale); }

        /* ===== BORDERED CONTAINERS ===== */
        .bordered-section {
          border: 1px solid #adb5bd;
          padding: 4px 8px;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        /* ===== LABEL + INPUT INLINE LAYOUT ===== */
        /* Default (desktop/laptop/xl): label on left, input fills rest */
        .form-row-inline {
          display: flex;
          align-items: center;
          margin-bottom: 4px;
        }
        .form-row-inline .field-label {
          flex: 0 0 var(--label-w);
          width: var(--label-w);
          min-width: var(--label-w);
          font-size: var(--font-scale);
          line-height: var(--input-scale);
          text-align: left;
          padding-right: 4px;
          color: #444;
          white-space: nowrap;
        }
        .form-row-inline .field-input {
          flex: 1;
          min-width: 0;
        }

        /* Mobile (<768px): label INLINE (left) beside input — override the column layout */
        @media (max-width: 767.98px) {
          .form-row-inline {
            flex-direction: row !important;
            align-items: center !important;
            gap: 6px !important;
          }
          .form-row-inline .field-label {
            flex: 0 0 70px !important;
            width: 35px !important;
            min-width: 35px !important;
            text-align: left !important;
            line-height: var(--input-scale) !important;
            white-space: nowrap !important;
          }
          .form-row-inline .field-input { width: auto !important; flex: 1 !important; }
        }
        /* Tablet (768-1023): label on top, input full-width */
        @media (min-width: 768px) and (max-width: 1023.98px) {
          .form-row-inline {
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
          }
          .form-row-inline .field-label {
            text-align: left;
            width: auto;
            min-width: unset;
            flex: none;
            line-height: 1.4;
          }
          .form-row-inline .field-input { width: 100%; }
        }

        /* ===== AGENT SECTION - 2-col grid (label | input) all views ===== */
        .agent-field-row {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 4px;
        }
        .agent-field-row .agent-label {
          flex: 0 0 90px;
          width: 90px;
          font-size: var(--font-scale);
          white-space: nowrap;
          color: #444;
        }
        .agent-field-row .agent-input {
          flex: 1;
          min-width: 0;
        }
        /* Agent: percent + value side by side */
        .agent-pct-val {
          display: flex;
          align-items: center;
          gap: 3px;
          flex: 1;
          min-width: 0;
        }
        .agent-pct-val .pct-box { flex: 0 0 60px; max-width: 60px; }
        .agent-pct-val .sep { font-size: var(--font-scale); font-weight: bold; flex-shrink: 0; }
        .agent-pct-val .val-box { flex: 1; min-width: 0; }

        /* ===== ROOM CHARGE CHECKBOX ===== */
        .room-charge-container { position: relative; width: 100%; }
        .room-charge-checkbox {
          position: absolute; right: 5px; top: 50%; transform: translateY(-50%);
          z-index: 10; display: flex; align-items: center;
          background: white; padding-left: 5px; border-left: 1px solid #ced4da; height: 20px;
        }
        .room-charge-checkbox input { width: 14px; height: 14px; cursor: pointer; margin: 0; }
        .room-charge-input { padding-right: 30px !important; }

        /* ===== COUNTER INPUTS ===== */
        .counter-group {
          display: flex; align-items: center;
          border: 1px solid #0d6efd; border-radius: 4px;
          overflow: hidden; height: 28px; width: 100%;
        }
        .counter-btn {
          border: 0; display: flex; align-items: center; justify-content: center;
          width: 26px; height: 28px; background: #e7f3ff;
          color: #0d6efd; font-weight: bold; font-size: 16px; cursor: pointer;
        }
        .counter-btn:hover { background: #d0e4ff; }
        .counter-input {
          border: 0; text-align: center; font-weight: bold;
          font-size: var(--font-scale); width: 45px; height: 28px;
          background: #f8f9fa; outline: none; -moz-appearance: textfield;
        }
        .counter-input::-webkit-outer-spin-button,
        .counter-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        .counter-input:focus { background: #fff; }

        .pax-display {
          display: flex; align-items: center; justify-content: center;
          border: 1px solid #28a745; border-radius: 4px; height: 28px; background: #f0fff4;
        }
        .pax-display span { font-weight: bold; font-size: var(--font-scale); color: #28a745; }

        .ex-pax-display {
          display: flex; align-items: center; justify-content: center;
          border: 1px solid #fd7e14; border-radius: 4px; height: 28px; background: #fff3e0;
        }
        .ex-pax-display span { font-weight: bold; font-size: var(--font-scale); color: #dc6500; }

        /* ===== Tablet/Desktop pax row: force all 6 fields to the exact same height ===== */
        .pax-counter-row .counter-group,
        .pax-counter-row .pax-display,
        .pax-counter-row .ex-pax-display,
        .pax-counter-row .form-control,
        .pax-counter-row input {
          height: 28px !important;
          min-height: 28px !important;
          max-height: 28px !important;
          box-sizing: border-box;
        }

        /* ===== RATE INFO SECTION ===== */
        .rate-info-section {
          border: 1px solid #adb5bd; border-radius: 4px;
          padding: 4px 8px; margin-top: 4px;
        }

        /* ===== FIXED BOTTOM BAR ===== */
        .fixed-bottom-bar {
          padding: 4px 10px;
          background: #fff;
          border-top: 1px solid #dee2e6;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 4px;
        }
        /* Mobile: left-side buttons show icon only */
        @media (max-width: 767.98px) {
          .btn-label-text { display: none; }
          .btn-icon-only { padding: 0 8px !important; }
        }
        /* Guaranteed-render glyph for Cancel button (doesn't depend on icon font) */
        .cancel-icon-glyph {
          font-size: 16px;
          font-weight: 700;
          line-height: 1;
          display: inline-block;
        }

        /* ===== MOBILE/TABLET TAB NAV WRAPPER ===== */
        .mobile-tab-nav-wrapper {
          display: none;
          flex-shrink: 0;
        }
        .checkin-stage-mobile .mobile-tab-nav-wrapper,
        .checkin-stage-tablet .mobile-tab-nav-wrapper {
          display: block;
        }
        .checkin-stage-desktop .mobile-tab-nav-wrapper,
        .checkin-stage-laptop .mobile-tab-nav-wrapper,
        .checkin-stage-xl .mobile-tab-nav-wrapper {
          display: none !important;
        }

        /* ===== MOBILE/TABLET TAB NAV ===== */
        .mobile-tab-nav {
          display: none;
        }
        .checkin-stage-mobile .mobile-tab-nav,
        .checkin-stage-tablet .mobile-tab-nav {
          display: flex;
          background: #fff;
          border-bottom: 2px solid #dee2e6;
          overflow-x: auto;
          flex-shrink: 0;
        }
        .mobile-tab-nav .mtab-btn {
          flex: 1;
          min-width: 60px;
          padding: 6px 4px;
          border: none;
          background: transparent;
          border-bottom: 3px solid transparent;
          font-size: 10px !important;
          color: #666;
          text-align: center;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.15s;
        }
        .mobile-tab-nav .mtab-btn.active {
          color: #0d6efd;
          border-bottom-color: #0d6efd;
          font-weight: 600;
          background: #f0f6ff;
        }
        /* Show icon on both mobile and tablet tab buttons */
        .mobile-tab-nav .mtab-btn i {
          display: block;
          font-size: 14px !important;
          margin-bottom: 2px;
        }

        /* Progress bar for mobile/tablet */
        .mobile-tab-progress {
          display: none;
        }
        .checkin-stage-mobile .mobile-tab-progress,
        .checkin-stage-tablet .mobile-tab-progress {
          display: block;
          height: 4px;
          background: #e9ecef;
          flex-shrink: 0;
        }
        .mobile-tab-progress .progress-fill {
          height: 100%;
          background: #0d6efd;
          transition: width 0.3s ease;
        }

        /* Hide/show sections based on active tab (mobile/tablet only) */
        .checkin-stage-mobile .tab-section,
        .checkin-stage-tablet .tab-section {
          display: none !important;
        }
        .checkin-stage-mobile .tab-section.tab-active,
        .checkin-stage-tablet .tab-section.tab-active {
          display: flex !important;
        }
        /* Desktop/Laptop/XL: always show all sections normally */
        .checkin-stage-desktop .tab-section,
        .checkin-stage-laptop .tab-section,
        .checkin-stage-xl .tab-section {
          display: flex !important;
        }
        /* Desktop/Laptop/XL: hide tab nav */
        .checkin-stage-desktop .mobile-tab-nav,
        .checkin-stage-desktop .mobile-tab-progress,
        .checkin-stage-laptop .mobile-tab-nav,
        .checkin-stage-laptop .mobile-tab-progress,
        .checkin-stage-xl .mobile-tab-nav,
        .checkin-stage-xl .mobile-tab-progress {
          display: none !important;
        }

        /* ===== REG NO HEADER BAR - always shown, always at top ===== */
        .regno-header-bar {
          border-bottom: 1px solid #dee2e6;
          flex-shrink: 0;
        }

        /* ===== RESPONSIVE GRID ===== */
        .row.g-2 { --bs-gutter-x: 0.4rem; --bs-gutter-y: 0.2rem; }
        .g-1 { --bs-gutter-x: 0.35rem !important; --bs-gutter-y: 0.25rem !important; }
        .mb-1 { margin-bottom: 0.5rem !important; }

        /* ===== LABELS ===== */
        .form-label-sm { font-size: var(--font-scale); margin-bottom: 2px; display: block; }

        /* ===== TEXTAREA ===== */
        .instruction-textarea {
          resize: none; border-radius: 0; min-height: 100px;
          font-size: var(--font-scale); border: none; flex: 1;
        }
        .instruction-textarea:focus { box-shadow: none; border-color: #86b7fe; }

        /* ===== CLICKABLE ROW ===== */
        .clickable-row { cursor: pointer; }
        .clickable-row:hover { background-color: #f0f8ff; }

        /* ===== BADGE STYLES ===== */
        .badge-info-custom {
          background-color: #17a2b8; color: #fff;
          font-size: calc(var(--font-scale) - 1px); padding: 2px 6px;
        }

        /* ===== XL ENHANCEMENTS ===== */
        @media (min-width: 1920px) {
          .checkin-responsive-container { max-width: 2400px; }
          .scrollable-table { max-height: 160px; }
          .agent-field-row .agent-label { flex: 0 0 110px; width: 110px; }
        }

        /* ===== CANCEL BUTTON in reg-no header bar (all screen sizes) ===== */
        .header-cancel-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-left: auto;
          background: #dc3545;
          color: #fff;
          border: none;
          height: 28px;
          padding: 0 10px;
          font-size: 14px;
          font-weight: 600;
          line-height: 1;
          cursor: pointer;
          border-radius: 4px;
          flex-shrink: 0;
          white-space: nowrap;
        }
        .header-cancel-btn:hover { background: #b02a37; }
        /* Mobile: show icon only, no label */
        @media (max-width: 767.98px) {
          .header-cancel-btn {
            width: 30px;
            height: 30px;
            padding: 0;
            border-radius: 3px;
            font-size: 18px;
          }
          .header-cancel-label { display: none; }
        }

        /* ===== MOBILE: PAX/COUNTER ROW — all 6 fields in ONE row ===== */
        @media (max-width: 767.98px) {
          .mobile-pax-grid {
            display: grid;
            grid-template-columns: repeat(6, minmax(0, 1fr));
            gap: 3px;
            align-items: end;
          }
          .mobile-pax-grid > div {
            display: flex;
            flex-direction: column;
            margin-bottom: 0 !important;
          }
          .mobile-pax-grid .form-label-sm {
            font-size: 8.5px !important;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 1px !important;
          }
          /* Force every one of the 6 field controls to the exact same height */
          .mobile-pax-grid .counter-group,
          .mobile-pax-grid .pax-display,
          .mobile-pax-grid .ex-pax-display,
          .mobile-pax-grid .form-control,
          .mobile-pax-grid input {
            height: 26px !important;
            min-height: 26px !important;
            max-height: 26px !important;
            box-sizing: border-box;
          }
          .mobile-pax-grid .counter-btn { width: 100%; min-width: 14px; font-size: 12px; }
          .mobile-pax-grid .counter-input { width: 100%; min-width: 0; font-size: 10px; padding: 0; }
          .mobile-pax-grid .pax-display span,
          .mobile-pax-grid .ex-pax-display span { font-size: 11px; }
          .mobile-pax-grid .form-control {
            font-size: 10px;
            padding: 2px 3px;
          }
          .mobile-pax-add-row {
            display: flex;
            justify-content: stretch;
            margin-top: 4px;
          }
          .mobile-pax-add-row .btn { width: 100%; }
        }

        /* ===== MOBILE: RATE INFO — label inline left of input ===== */
        @media (max-width: 767.98px) {
          .rate-info-section .align-items-center > [class*="col-"] {
            /* pairs: label col + input col side by side */
          }
          .rate-row-mobile {
            display: flex;
            align-items: center;
            gap: 6px;
            margin-bottom: 4px;
          }
          .rate-row-mobile .rate-label {
            flex: 0 0 80px;
            width: 80px;
            font-size: var(--font-scale);
            text-align: left;
            padding-right: 4px;
            white-space: nowrap;
            color: #444;
          }
          .rate-row-mobile .rate-input { flex: 1; min-width: 0; }
        }

        /* ===== RATE INFO: 2-column grid for mobile & tablet ===== */
        .rate-grid-2col { width: 100%; }
        .rate-grid-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4px 8px;
          margin-bottom: 4px;
        }
        .rate-grid-cell {
          display: flex;
          align-items: center;
          gap: 4px;
          min-width: 0;
        }
        .rate-grid-cell .rate-label {
          flex: 0 0 70px;
          width: 70px;
          font-size: var(--font-scale, 11px);
          text-align: left;
          white-space: nowrap;
          color: #444;
          padding-right: 2px;
        }
        .rate-grid-cell .rate-input { flex: 1; min-width: 0; }

        /* ===== MOBILE ONLY: Stay Info — force Room No/Type on line 1, ===== */
        /* ===== Converted Category/Room Charges/Plan together on line 2  ===== */
        .mobile-stay-row-break {
          display: none;
        }

        /* ===== MOBILE ONLY: Stay Info — Room Charges & Plan compact widths ===== */
        @media (max-width: 767.98px) {
          .mobile-stay-row-break {
            display: block;
            flex: 0 0 100% !important;
            width: 100% !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .mobile-converted-category-col {
            flex: 1 1 100px !important;
            min-width: 90px !important;
          }
          .mobile-room-charges-col {
            flex: 0 0 80px !important;
            min-width: 100px !important;
            max-width: 120px !important;
          }
          .mobile-plan-col {
            flex: 0 0 54px !important;
            min-width: 54px !important;
            max-width: 70px !important;
          }
          .mobile-room-charges-col .room-charge-container { min-width: 0; }
          .mobile-room-charges-col .form-control { font-size: 13px !important; padding-right: 24px !important; }
          .mobile-room-charges-col .room-charge-checkbox { right: 2px; }
          .mobile-plan-col .form-select,
          .mobile-plan-col select { font-size: 10px !important; padding: 1px 2px !important; }

          /* ===== MOBILE: Scrollable data table — 3 rows visible, scroll for more ===== */
          .scrollable-table {
            max-height: calc(3 * 32px + 32px + 2px) !important; /* 3 data rows + 1 header row + border */
            overflow-y: auto !important;
            overflow-x: auto !important;
          }
          /* Empty state message when no rows */
          .mobile-table-empty {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 10px 0;
            font-size: 11px;
            color: #888;
            font-style: italic;
            border: 1px dashed #ccc;
            border-top: none;
            background: #fafafa;
          }
        }

        /* ===== MOBILE/TABLET: SPECIAL INSTRUCTION merged into Agent tab,
               MESSAGE merged into Guest Info tab (both tabs, same behaviour) ===== */
        .mobile-special-merged,
        .guest-message-merged {
          display: none;
        }
        .checkin-stage-mobile .mobile-special-merged,
        .checkin-stage-mobile .guest-message-merged,
        .checkin-stage-tablet .mobile-special-merged,
        .checkin-stage-tablet .guest-message-merged {
          display: block;
          margin-top: 8px;
        }
        /* Hide the separate bottom Special/Message row on mobile & tablet (desktop/laptop/xl only) */
        .checkin-stage-mobile .special-tab-section,
        .checkin-stage-tablet .special-tab-section {
          display: none !important;
        }

        /* ===== Guest Info / Agent "+" add buttons — match textbox height exactly ===== */
        .add-icon-btn {
          height: 31px !important;
          width: 31px !important;
          padding: 0 !important;
          font-size: 16px !important;
          line-height: 1 !important;
          flex-shrink: 0;
        }
      `}</style>

      <div className={`checkin-responsive-container checkin-stage-${layoutStage}`}>
        {/* ===== REG NO HEADER - Always at top (above tabs on mobile/tablet) ===== */}
        <div
          className="regno-header-bar d-flex align-items-center flex-wrap gap-2 px-2 py-1 bg-white"
          style={{ borderBottom: '1px solid #dee2e6' }}>
          <span className="d-flex align-items-center">
            <span className="fw-semibold me-1" style={{ fontSize: 'var(--font-scale)' }}>
              Reg No:
            </span>
            <span className="badge bg-warning" style={{ fontSize: 'var(--font-scale)' }}>
              {regNo}
            </span>
          </span>
          <span className="d-flex align-items-center flex-wrap gap-1">
            <span className="fw-semibold me-1" style={{ fontSize: 'var(--font-scale)' }}>
              Rooms:
            </span>
            {initialSelectedRooms.length > 0 && (
              <>
                <span className="badge bg-primary" style={{ fontSize: 'var(--font-scale)' }}>
                  {initialSelectedRooms.map((r) => r.roomNumber).join(', ')}
                </span>
              </>
            )}
          </span>
          {frontDeskSettings && (
            <span className="d-flex align-items-center">
              <span className="fw-semibold me-1" style={{ fontSize: 'var(--font-scale)' }}>
                Checkout:
              </span>
              <span className="badge bg-secondary" style={{ fontSize: 'var(--font-scale)' }}>
                {frontDeskSettings.checkout_time_setting === '12_NOON'
                  ? `Fixed (${frontDeskSettings.fixed_checkout_time || '12:00'})`
                  : '24 Hours'}
              </span>
            </span>
          )}
          {/* Cancel button — top-right corner, all screen sizes */}
          <button
            type="button"
            className="header-cancel-btn ms-auto"
            onClick={() => {
              setTempGuestPhoto(null)
              navigate(-1)
            }}
            title="Cancel">
            <i className="fi fi-rr-cross fs-6"></i>
            <span className="header-cancel-label"></span>
          </button>
        </div>

        {/* ===== MOBILE/TABLET TAB NAVIGATION (wrapped for sticky positioning) ===== */}
        <div className="mobile-tab-nav-wrapper">
          <div className="mobile-tab-nav">
            {mobileTabs.map((tab) => (
              <button
                key={tab.key}
                className={`mtab-btn${activeMobileTab === tab.key ? ' active' : ''}`}
                onClick={() => setActiveMobileTab(tab.key)}
                type="button">
                <i className={tab.icon}></i>
                {tab.label}
              </button>
            ))}
          </div>
          {/* Progress bar */}
          <div className="mobile-tab-progress">
            <div className="progress-fill" style={{ width: `${mobileTabProgress}%` }} />
          </div>
        </div>

        {/* ===== SCROLLABLE CENTER BODY (mobile only; desktop uses card overflow) ===== */}
        <div
          className="checkin-scroll-body flex-grow-1 d-flex flex-column"
          style={{ minHeight: 0 }}>
          {/* ===== MAIN CARD ===== */}
          <Card className="flex-grow-1 border-0">
            <Card.Body className="p-2 overflow-y-auto overflow-x-hidden">
              <form id="checkin-form" onSubmit={handleSubmit}>
                <Row className="g-2 align-items-stretch flex-shrink-0">
                  {/* ===== COLUMN 1: Guest Information ===== */}
                  <Col
                    {...{ [colBreakpoint]: leftColSpan }}
                    xs={12}
                    className={`d-flex flex-column tab-section${activeMobileTab === 'guest' ? ' tab-active' : ''}`}>
                    <div className="bordered-section">
                      <div className="section-header">
                        <span className="fw-bold">Guest Information</span>
                      </div>

                      {/* ===== NAME ROW ===== */}

                    <div className="form-row-inline mb-1">
    <span className="field-label">Check-In Type</span>
    <div className="field-input">
      <div className="d-flex gap-3">
        <BootstrapForm.Check
          type="radio"
          label="Walk-in"
          name="checkInType"
          value="walkin"
          checked={checkInType === 'walkin'}
          onChange={() => setCheckInType('walkin')}
          inline
        />
        <BootstrapForm.Check
          type="radio"
          label="Reservation"
          name="checkInType"
          value="reservation"
          checked={checkInType === 'reservation'}
          onChange={() => setCheckInType('reservation')}
          inline
        />
      </div>
    </div>
  </div>

                        <div className="form-row-inline mb-1">
    <span className="field-label">Name</span>
    <div className="field-input">
      <div className="d-flex align-items-center gap-1">
        <div style={{ flex: '0 0 40px', minWidth: '40px', maxWidth: '40px' }}>
          <FormikTextInput name="title" placeholder="MR" size="sm" className="w-100 fs-small" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Select
            options={checkInType === 'reservation' ? reservationGuestOptions : guestOptions}
            isLoading={loadingGuests}
            className="w-100 fs-small"
            styles={selectStyles}
            value={
              checkInType === 'reservation'
                ? reservationGuestOptions.find((o) => o.value === values.guestId) || null
                : guestOptions.find((o) => o.value === values.guestId) || null
            }
            onChange={(opt) => {
              if (opt?.value) {
                const guestId = Number(opt.value)
                setFieldValue('guestId', guestId)
                loadGuestDetails(guestId)

                // Agar reservation mode hai to reservation details bhi set karein
                if (checkInType === 'reservation') {
                  const matchedRes = todayReservations.find(r => r.guest_id === guestId)
                  if (matchedRes) {
                    setSelectedReservation(matchedRes)
                    setFieldValue('reservationId', matchedRes.reservation_id)
                    setFieldValue('reservationNo', matchedRes.reservation_no)
                  }
                }
              } else {
                // Clear guest and reservation data
                setFieldValue('guestId', null)
                setFieldValue('fragment_id', null)
                setFieldValue('title', 'MR')
                setFieldValue('firstName', '')
                setFieldValue('lastName', '')
                setFieldValue('phone1', '')
                setFieldValue('phone2', '')
                setFieldValue('email', '')
                setFieldValue('address', '')
                setFieldValue('countryId', '')
                setFieldValue('stateId', '')
                setFieldValue('cityId', '')
                setFieldValue('idType', '')
                setFieldValue('idNumber', '')
                setFieldValue('otherInfo', '')
                setFieldValue('companyId', null)
                setFieldValue('gst', '')
                setGuestDocuments([])
                setTempGuestPhoto(null)
                if (checkInType === 'reservation') {
                  setSelectedReservation(null)
                  setFieldValue('reservationId', null)
                  setFieldValue('reservationNo', null)
                }
              }
            }}
            onInputChange={(inputValue, { action }) => {
              if (action === 'input-change' && checkInType === 'walkin') {
                handleGuestSearch(inputValue)
              }
              // Reservation mode mein search disabled – kyunki options fixed hain
            }}
            onMenuOpen={() => {
              if (checkInType === 'walkin' && !guestOptions.length) {
                loadAllGuests()
              }
            }}
            placeholder={checkInType === 'reservation' ? "Select Reservation Guest" : "Search Guest Name"}
            isClearable
            menuPortalTarget={document.body}
            menuPosition="fixed"
          />
        </div>
        <button
          type="button"
          className="btn btn-success btn-sm d-flex align-items-center justify-content-center add-icon-btn"
          onClick={() => setShowGuestModal(true)}
          disabled={checkInType === 'reservation'} // Reservation mode mein guest add nahi karna
        >
          +
        </button>
      </div>
    </div>
  </div>
                      <div className="form-row-inline mb-1">
                        <span className="field-label">Mobile</span>
                        <div className="field-input">
                          <div className="d-flex gap-1">
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <FormikTextInput
                                name="phone1"
                                placeholder="Mobile 1"
                                size="sm"
                                className="w-100 fs-small"
                                readOnly
                              />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <FormikTextInput
                                name="phone2"
                                placeholder="Mobile 2"
                                size="sm"
                                className="w-100 fs-small"
                                readOnly
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="form-row-inline mb-1">
                        <span className="field-label">Email</span>
                        <div className="field-input">
                          <FormikTextInput
                            name="email"
                            placeholder="Email"
                            size="sm"
                            className="w-100 fs-small"
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="form-row-inline mb-1">
                        <span className="field-label">Address</span>
                        <div className="field-input">
                          <FormikTextInput
                            name="address"
                            as="textarea"
                            placeholder="Enter Address"
                            rows={2}
                            className="w-100 fs-small"
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="form-row-inline mb-1">
                        <span className="field-label">Country</span>
                        <div className="field-input">
                          <FormikTextInput
                            name="countryId"
                            placeholder="Country"
                            size="sm"
                            className="w-100 fs-small"
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="form-row-inline mb-1">
                        <span className="field-label">State</span>
                        <div className="field-input">
                          <FormikTextInput
                            name="stateId"
                            placeholder="State"
                            size="sm"
                            className="w-100 fs-small"
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="form-row-inline mb-1">
                        <span className="field-label">City</span>
                        <div className="field-input">
                          <FormikTextInput
                            name="cityId"
                            placeholder="City"
                            size="sm"
                            className="w-100 fs-small"
                            readOnly
                          />
                        </div>
                      </div>

                      {/* Identity Information Section */}
                      <div>
                        <div className="d-flex align-items-center my-2">
                          <div style={{ flex: 1, borderTop: '1px solid #999' }}></div>
                          <span className="px-2 fw-bold fs-small text-nowrap">
                            Identity Information
                          </span>
                          <div style={{ flex: 1, borderTop: '1px solid #999' }}></div>
                        </div>

                        <div className="form-row-inline mb-1">
                          <span className="field-label">ID Type</span>
                          <div className="field-input">
                            <FormSelect
                              name="idType"
                              options={idTypeOptions}
                              size="sm"
                              className="w-100 fs-small"
                              isLoading={loadingDocTypes}
                              onChange={(v) => setFieldValue('idType', v)}
                              placeholder="Select ID Type"
                            />
                          </div>
                        </div>

                        <div className="form-row-inline mb-1">
                          <span className="field-label">ID No</span>
                          <div className="field-input">
                            <FormikTextInput
                              name="idNumber"
                              placeholder="Enter ID Number"
                              size="sm"
                              className="w-100 fs-small"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Other Information Section */}
                      <div>
                        <div className="d-flex align-items-center my-2">
                          <div style={{ flex: 1, borderTop: '1px solid #999' }}></div>
                          <BootstrapForm.Label className="fw-bold mb-0 fs-small px-2 text-nowrap">
                            Other Information
                          </BootstrapForm.Label>
                          <div style={{ flex: 1, borderTop: '1px solid #999' }}></div>
                        </div>

                        <div className="form-row-inline mb-1">
                          <span className="field-label">Company</span>
                          <div className="field-input">
                            <div className="d-flex align-items-center gap-1">
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <Select
                                  options={companyOptions}
                                  isLoading={loadingCompanies}
                                  className="w-100"
                                  styles={selectStyles}
                                  value={
                                    companyOptions.find((o) => o.value === values.companyId) || null
                                  }
                                  onChange={(opt) => {
                                    const val = opt?.value ?? null
                                    handleCompanySelect(val)
                                  }}
                                  onInputChange={(inputValue, { action }) => {
                                    if (action === 'input-change') {
                                      handleCompanySearch(inputValue)
                                    }
                                  }}
                                  onMenuOpen={() => {
                                    if (!companyOptions.length) {
                                      loadAllCompanies()
                                    }
                                  }}
                                  placeholder="Select Company"
                                  isClearable
                                  menuPortalTarget={document.body}
                                  menuPosition="fixed"
                                />
                              </div>
                              <button
                                type="button"
                                className="btn btn-success btn-sm d-flex align-items-center justify-content-center add-icon-btn"
                                onClick={() => {
                                  if (!hotelId) {
                                    toast.error('Hotel ID not found. Please login again.')
                                    return
                                  }
                                  setShowCompanyModal(true)
                                }}>
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="form-row-inline mb-1">
                          <span className="field-label">GST No</span>
                          <div className="field-input">
                            <FormikTextInput
                              name="gst"
                              placeholder="GST TIN"
                              size="sm"
                              className="w-100 fs-small"
                              readOnly
                            />
                          </div>
                        </div>

                        <div className="form-row-inline mb-1">
                          <span className="field-label">Group</span>
                          <div className="field-input">
                            <FormikTextInput
                              name="groupName"
                              placeholder="Group Name"
                              size="sm"
                              className="w-100 fs-small"
                              readOnly
                            />
                          </div>
                        </div>

                        <div className="form-row-inline mb-1">
                          <span className="field-label">Booking Type</span>
                          <div className="field-input">
                            <FormSelect
                              name="bookingType"
                              size="sm"
                              className="w-100 fs-small"
                              options={[
                                { label: 'WALK-IN-GUEST', value: 'WALK-IN-GUEST' },
                                { label: 'ONLINE', value: 'ONLINE' },
                                { label: 'ADVANCE', value: 'ADVANCE' },
                                { label: 'AGENT', value: 'AGENT' },
                                { label: 'GROUP', value: 'GROUP' },
                                { label: 'CORPORATE', value: 'CORPORATE' },
                                { label: 'COMPLIMENTARY', value: 'COMPLIMENTARY' },
                              ]}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Mobile/Tablet only: Message textarea merged into Guest Info tab */}
                      <div className="guest-message-merged">
                        <div
                          className="bordered-section mt-2"
                          style={{ border: '1px solid #adb5bd', overflow: 'hidden' }}>
                          <div className="section-header" style={{ marginBottom: 0 }}>
                            <span className="fw-bold">Message</span>
                          </div>
                          <textarea
                            {...formik.getFieldProps('message')}
                            className="form-control form-control-sm fs-small border-0 instruction-textarea"
                            style={{ resize: 'none', borderRadius: 0, minHeight: '80px' }}
                            rows={3}
                            placeholder="Enter message"
                          />
                        </div>
                      </div>
                    </div>
                  </Col>

                  {/* ===== COLUMN 2: Stay Information ===== */}
                  <Col
                    {...{ [colBreakpoint]: midColSpan }}
                    xs={12}
                    className={`d-flex flex-column tab-section${activeMobileTab === 'stay' ? ' tab-active' : ''}`}>
                    <div className="bordered-section">
                      <div className="section-header">
                        <span className="fw-bold">Stay Information</span>
                      </div>

                      <Row className="g-2 mb-1 align-items-end">
                        <Col style={{ flex: '0.80', minWidth: '80px' }}>
                          <label className="form-label-sm">Room No</label>
                          <Select
                            name="roomNo"
                            options={roomOptions}
                            isLoading={loadingRooms}
                            className="fs-small"
                            styles={selectStyles}
                            isDisabled={editingRowId !== null}
                            value={roomOptions.find((o) => o.value === values.roomNo) || null}
                            onChange={async (opt) => {
                              const roomId = opt?.value ?? null
                              await handleRoomNoChange(roomId as number | null)
                            }}
                            placeholder="Room"
                            isClearable
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                          />
                        </Col>

                        <Col style={{ flex: '1', minWidth: '120px' }}>
                          <label className="form-label-sm">Type</label>
                          <Select
                            name="roomType"
                            options={categoryOptions}
                            isLoading={loadingCategories}
                            className="fs-small"
                            styles={selectStyles}
                            isDisabled={true}
                            value={categoryOptions.find((o) => o.value === values.roomType) || null}
                            onChange={async (opt) => {
                              const catId = opt?.value ?? null
                              setFieldValue('roomType', catId)
                              await handleRoomTypeChange(catId as number | null)
                            }}
                            placeholder="Select Type"
                            isClearable
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                          />
                        </Col>

                        {/* Mobile-only: force Converted Category / Room Charges / Plan onto their own line */}
                        <div className="mobile-stay-row-break" />

                        <Col style={{ flex: '1', minWidth: '120px' }} className="mobile-converted-category-col">
                          <label className="form-label-sm">Converted Category</label>
                          <Select
                            name="convertedCategoryId"
                            options={categoryOptions}
                            isLoading={loadingCategories}
                            className="fs-small"
                            styles={selectStyles}
                            isDisabled={!values.roomNo}
                            value={
                              categoryOptions.find((o) => o.value === values.convertedCategoryId) ||
                              null
                            }
                            onChange={(opt) => {
                              const catId = opt?.value as number | null
                              handleConvertedCategoryChange(catId)
                            }}
                            placeholder="Optional"
                            isClearable
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                          />
                        </Col>

                        <Col style={{ flex: '0.7', minWidth: '80px' }} className="mobile-room-charges-col">
                          <label className="form-label-sm">Room Charges</label>
                          <div className="room-charge-container">
                            <FormikTextInput
                              name="roomCharges"
                              type="number"
                              size="sm"
                              className={`w-100 fs-small ${!roomChargeEditable ? 'room-charge-input' : ''}`}
                              placeholder="Enter Charges"
                              disabled={!roomChargeEditable}
                            />
                            <div className="room-charge-checkbox">
                              <input
                                type="checkbox"
                                checked={roomChargeEditable}
                                onChange={(e) => {
                                  const checked = e.target.checked
                                  setRoomChargeEditable(checked)
                                  // When user UNCHECKS (locks back to auto), immediately re-derive
                                  // the room charge from the current adult count + tariff data.
                                  if (!checked) {
                                    const effectiveCategoryId =
                                      values.convertedCategoryId ?? values.roomType
                                    if (effectiveCategoryId) {
                                      const details = categoryDetailsMap.get(effectiveCategoryId)
                                      const tariffs: Array<{
                                        no_of_pax: number
                                        room_tariff: number
                                      }> = details?.tariffs || []
                                      const adultCount = values.adults || 0
                                      if (tariffs.length > 0 && adultCount > 0) {
                                        const { pax, exPax, tariff } = getTariffForPax(
                                          tariffs,
                                          adultCount,
                                        )
                                        setSelectedRoomTariff(tariff)
                                        setFieldValue('roomCharges', tariff)
                                        setFieldValue('pax', pax)
                                        setFieldValue('exPax', exPax)
                                      }
                                    }
                                  }
                                }}
                                title={
                                  roomChargeEditable
                                    ? 'Lock room charge (auto-calculate from adults)'
                                    : 'Unlock to manually set room charge'
                                }
                              />
                            </div>
                          </div>
                        </Col>

                        <Col style={{ flex: '0.45', minWidth: '55px' }} className="mobile-plan-col">
                          <label className="form-label-sm">Plan</label>
                          <FormSelect
                            name="planName"
                            size="sm"
                            className="w-100 fs-small"
                            options={[
                              { label: 'EP', value: 'EP' },
                              { label: 'CP', value: 'CP' },
                              { label: 'AP', value: 'AP' },
                            ]}
                          />
                        </Col>
                      </Row>

                      <Row className="g-2 mb-1">
                        <Col xs={3}>
                          <label className="form-label-sm">Arrival Date</label>
                          <FormikTextInput
                            name="arrivalDate"
                            type="date"
                            size="sm"
                            className="w-100 fs-small"
                            readOnly
                            value={getTodayLocal()}
                          />
                        </Col>
                        <Col xs={2}>
                          <label className="form-label-sm">Time</label>
                          <FormikTextInput
                            name="arrivalTime"
                            type="time"
                            size="sm"
                            className="w-100 fs-small"
                          />
                        </Col>
                        <Col xs={2}>
                          <label className="form-label-sm">Days</label>
                          <FormikTextInput
                            name="nights"
                            type="number"
                            size="sm"
                            className="w-100 fs-small"
                          />
                        </Col>
                        <Col xs={3}>
                          <label className="form-label-sm">Departure Date</label>
                          <FormikTextInput
                            name="departureDate"
                            type="date"
                            size="sm"
                            className="w-100 fs-small"
                          />
                        </Col>
                        <Col xs={2}>
                          <label className="form-label-sm">Time</label>
                          <FormikTextInput
                            name="departureTime"
                            type="time"
                            size="sm"
                            className="w-100 fs-small"
                          />
                        </Col>
                      </Row>

                      {/* ===== PAX / COUNTER ROW — desktop: single row; mobile: 2-col grid + separate Add button ===== */}
                      {/* Desktop/Laptop/XL/Tablet: all in one row */}
                      <Row className="g-2 mb-1 align-items-end d-none d-md-flex pax-counter-row">
                        <Col>
                          <label className="form-label-sm fw-bold text-primary d-block">
                            👤 Adults
                          </label>
                          <div className="counter-group">
                            <button
                              type="button"
                              className="counter-btn"
                              onClick={() =>
                                setFieldValue('adults', Math.max(0, (values.adults || 0) - 1))
                              }>
                              −
                            </button>
                            <input
                              type="number"
                              className="counter-input"
                              value={values.adults || 0}
                              min={0}
                              onChange={(e) =>
                                setFieldValue('adults', Math.max(0, Number(e.target.value)))
                              }
                            />
                            <button
                              type="button"
                              className="counter-btn"
                              onClick={() => setFieldValue('adults', (values.adults || 0) + 1)}>
                              +
                            </button>
                          </div>
                        </Col>
                        <Col>
                          <label className="form-label-sm d-block text-success">Pax</label>
                          <div className="pax-display">
                            <span>{values.pax || 0}</span>
                          </div>
                        </Col>
                        <Col>
                          <label className="form-label-sm d-block" style={{ color: '#dc6500' }}>
                            Ex_Pax
                          </label>
                          <div className="ex-pax-display">
                            <span>{values.exPax || 0}</span>
                          </div>
                        </Col>
                        <Col>
                          <label className="form-label-sm">Child Paid</label>
                          <FormikTextInput
                            name="childrenPaid"
                            size="sm"
                            type="number"
                            className="w-100 fs-small"
                            min={0}
                          />
                        </Col>
                        <Col>
                          <label className="form-label-sm">C.Unpaid</label>
                          <FormikTextInput
                            name="childrenUnpaid"
                            size="sm"
                            type="number"
                            className="w-100 fs-small"
                            min={0}
                          />
                        </Col>
                        <Col>
                          <label className="form-label-sm">Driver</label>
                          <FormikTextInput
                            name="driver"
                            type="number"
                            size="sm"
                            className="w-100 fs-small"
                            min={0}
                          />
                        </Col>
                        <Col>
                          <Button
                            size="sm"
                            variant="success"
                            onClick={handleAddOrUpdateRow}
                            disabled={!values.guestId}
                            title={!values.guestId ? 'Select a guest name first' : undefined}
                            className="w-100"
                            style={{ height: '28px', padding: '1px', fontSize: '11px' }}>
                            {editingRowId ? 'Update' : 'Add'}
                          </Button>
                        </Col>
                      </Row>

                      {/* Mobile: 2-column grid for pax fields + full-width Add button on new row */}
                      <div className="d-md-none">
                        <div className="mobile-pax-grid mb-1">
                          <div>
                            <label className="form-label-sm fw-bold text-primary d-block">
                              👤 Adults
                            </label>
                            <div className="counter-group">
                              <button
                                type="button"
                                className="counter-btn"
                                onClick={() =>
                                  setFieldValue('adults', Math.max(0, (values.adults || 0) - 1))
                                }>
                                −
                              </button>
                              <input
                                type="number"
                                className="counter-input"
                                value={values.adults || 0}
                                min={0}
                                onChange={(e) =>
                                  setFieldValue('adults', Math.max(0, Number(e.target.value)))
                                }
                              />
                              <button
                                type="button"
                                className="counter-btn"
                                onClick={() => setFieldValue('adults', (values.adults || 0) + 1)}>
                                +
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="form-label-sm d-block text-success">Pax</label>
                            <div className="pax-display">
                              <span>{values.pax || 0}</span>
                            </div>
                          </div>
                          <div>
                            <label className="form-label-sm d-block" style={{ color: '#dc6500' }}>
                              Ex_Pax
                            </label>
                            <div className="ex-pax-display">
                              <span>{values.exPax || 0}</span>
                            </div>
                          </div>
                          <div>
                            <label className="form-label-sm">Child Paid</label>
                            <FormikTextInput
                              name="childrenPaid"
                              size="sm"
                              type="number"
                              className="w-100 fs-small"
                              min={0}
                            />
                          </div>
                          <div>
                            <label className="form-label-sm">C.Unpaid</label>
                            <FormikTextInput
                              name="childrenUnpaid"
                              size="sm"
                              type="number"
                              className="w-100 fs-small"
                              min={0}
                            />
                          </div>
                          <div>
                            <label className="form-label-sm">Driver</label>
                            <FormikTextInput
                              name="driver"
                              type="number"
                              size="sm"
                              className="w-100 fs-small"
                              min={0}
                            />
                          </div>
                        </div>
                        <div className="mobile-pax-add-row">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={handleAddOrUpdateRow}
                            disabled={!values.guestId}
                            title={!values.guestId ? 'Select a guest name first' : undefined}
                            style={{ height: '32px', fontSize: '12px', fontWeight: 600 }}>
                            {editingRowId ? '✔ Update Room' : '+ Add Room'}
                          </Button>
                        </div>
                      </div>

                      {/* ===== SCROLLABLE ROOM TABLE ===== */}
                      <div className="scrollable-table mt-1">
                        <table
                          className="table table-sm-compact mb-0"
                          style={{ borderColor: '#d1d1d1', whiteSpace: 'nowrap' }}>
                          <thead>
                            <tr className="text-center" style={{ backgroundColor: '#d9d9d9' }}>
                              <th>R</th>
                              <th>Guest</th>
                              <th>Guest ID</th>
                              <th>Room N</th>
                              <th>Type</th>
                              <th>Conv. Cat</th>
                              <th>A_Date</th>
                              <th>A_Time</th>
                              <th>D_Date</th>
                              <th>D_Time</th>
                              <th>Adults</th>
                              <th>Pax</th>
                              <th>Ex_Pax</th>
                              <th>Ex_Pax Price</th>
                              <th>Ex_Pax Tax %</th>
                              <th>Ex_Pax Tax</th>
                              <th>Ex_Pax Total</th>
                              <th>Child Paid</th>
                              <th>Child Unpaid</th>
                              <th>Child Price</th>
                              <th>Child Tax %</th>
                              <th>Child Tax</th>
                              <th>Child Total</th>
                              <th>Driver</th>
                              <th>Driver Price</th>
                              <th>Driver Tax %</th>
                              <th>Driver Tax</th>
                              <th>Driver Total</th>
                              <th>Day</th>
                              <th>Room Tariff</th>
                              <th>Dis</th>
                              <th>Dis_Amt</th>
                              <th>Tax%</th>
                              <th>Tax Amt</th>
                              <th>Total</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {roomRows.map((row) => (
                              <tr
                                key={row.id}
                                className="text-center clickable-row"
                                style={{
                                  backgroundColor: selectedRowId === row.id ? '#a6ffd5' : '',
                                }}
                                onClick={() => {
                                  setSelectedRowId(row.id)
                                  handleEditRow(row)
                                }}>
                                <td>●</td>
                                <td>{row.guestName || '-'}</td>
                                <td>{row.guestId || '-'}</td>
                                <td>{row.roomNumber}</td>
                                <td>{row.type}</td>
                                <td>{row.convertedCategoryName || '-'}</td>
                                <td>{row.arrivalDate}</td>
                                <td>{row.arrivalTime}</td>
                                <td>{row.departureDate}</td>
                                <td>{row.departureTime}</td>
                                <td>{safeNumber(row.adults)}</td>
                                <td>{safeNumber(row.pax)}</td>
                                <td>{safeNumber(row.exPax)}</td>
                                <td>{formatCellValue(row.exPaxPrice)}</td>
                                <td>{formatCellValue(row.exPaxTaxPercent)}%</td>
                                <td>{formatCellValue(row.exPaxTax)}</td>
                                <td>{formatCellValue(row.exPaxTotal)}</td>
                                <td>{safeNumber(row.childPaid)}</td>
                                <td>{safeNumber(row.childUnpaid)}</td>
                                <td>{formatCellValue(row.childPrice)}</td>
                                <td>{formatCellValue(row.childTaxPercent)}%</td>
                                <td>{formatCellValue(row.childTax)}</td>
                                <td>{formatCellValue(row.childTotal)}</td>
                                <td>{safeNumber(row.driver)}</td>
                                <td>{formatCellValue(row.driverPrice)}</td>
                                <td>{formatCellValue(row.driverTaxPercent)}%</td>
                                <td>{formatCellValue(row.driverTax)}</td>
                                <td>{formatCellValue(row.driverTotal)}</td>
                                <td>{safeNumber(row.nights)}</td>
                                <td>{formatCellValue(row.rate)}</td>
                                <td>{safeNumber(row.discount)}%</td>
                                <td>{formatCellValue(row.discountAmt)}</td>
                                <td>{formatCellValue(row.taxPercent)}%</td>
                                <td>{formatCellValue(row.taxAmount)}</td>
                                <td>{formatCellValue(row.totalAmount)}</td>
                                <td onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    variant="outline-danger"
                                    className="p-0"
                                    size="sm"
                                    onClick={() => handleDeleteRow(row.id)}
                                  >
                                    <i className="fi fi-rr-trash" style={{ fontSize: '12px' }} />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                            {/* Desktop/Tablet: filler rows to maintain minimum 5-row height */}
                            {Array.from({ length: Math.max(0, 5 - roomRows.length) }).map(
                              (_, index) => (
                                <tr key={`empty-${index}`} className="d-none d-md-table-row" style={{ height: '40px' }}>
                                  <td colSpan={42}></td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                        {/* Mobile only: show empty state when no data */}
                        {roomRows.length === 0 && (
                          <div className="mobile-table-empty d-md-none">
                            No rooms added yet
                          </div>
                        )}
                      </div>

                      {/* ===== RATE INFORMATION - FULLY RESPONSIVE ===== */}
                      <div className="rate-info-section">
                        <div className="d-flex align-items-center my-1">
                          <BootstrapForm.Label className="fw-bold mb-0 fs-small pe-2 text-nowrap">
                            Rate Information
                          </BootstrapForm.Label>
                          <div style={{ flex: 1, borderTop: '1px solid #999' }}></div>
                        </div>

                        {/* Mobile/Tablet: 2 fields per row (label + input | label + input) */}
                        <div className="d-lg-none rate-grid-2col">
                          {/* Row 1: Discount % | Service */}
                          <div className="rate-grid-row">
                            <div className="rate-grid-cell">
                              <span className="rate-label">Discount %</span>
                              <div className="rate-input">
                                <FormikTextInput name="discount" size="sm" type="number" className="w-100 fs-small" />
                              </div>
                            </div>
                            <div className="rate-grid-cell">
                              <span className="rate-label">Service</span>
                              <div className="rate-input">
                                <FormikTextInput name="roomService" size="sm" type="number" className="w-100 fs-small" />
                              </div>
                            </div>
                          </div>
                          {/* Row 2: Taxable Amt | Bill Amt */}
                          <div className="rate-grid-row">
                            <div className="rate-grid-cell">
                              <span className="rate-label">Taxable Amt</span>
                              <div className="rate-input">
                                <FormikTextInput name="taxableAmt" size="sm" type="number" className="w-100 fs-small" />
                              </div>
                            </div>
                            <div className="rate-grid-cell">
                              <span className="rate-label">Bill Amt</span>
                              <div className="rate-input">
                                <FormikTextInput name="billAmount" size="sm" type="number" className="w-100 fs-small fw-bold" />
                              </div>
                            </div>
                          </div>
                          {/* Row 3: SGST Amt | CGST Amt */}
                          <div className="rate-grid-row">
                            <div className="rate-grid-cell">
                              <span className="rate-label">SGST Amt</span>
                              <div className="rate-input">
                                <FormikTextInput name="sgst" type="number" size="sm" className="w-100 fs-small" />
                              </div>
                            </div>
                            <div className="rate-grid-cell">
                              <span className="rate-label">CGST Amt</span>
                              <div className="rate-input">
                                <FormikTextInput name="cgst" type="number" size="sm" className="w-100 fs-small" />
                              </div>
                            </div>
                          </div>
                          {/* Row 4: Round Off | Other Charges */}
                          <div className="rate-grid-row">
                            <div className="rate-grid-cell">
                              <span className="rate-label">Round Off</span>
                              <div className="rate-input">
                                <FormikTextInput name="roundOff" size="sm" type="number" className="w-100 fs-small" />
                              </div>
                            </div>
                            <div className="rate-grid-cell">
                              <span className="rate-label">Other Charges</span>
                              <div className="rate-input">
                                <FormikTextInput name="otherCharges" type="number" size="sm" className="w-100 fs-small" />
                              </div>
                            </div>
                          </div>
                          {/* Row 5: Bill + Other | Received Amt */}
                          <div className="rate-grid-row">
                            <div className="rate-grid-cell">
                              <span className="rate-label text-danger">Bill + Other</span>
                              <div className="rate-input">
                                <FormikTextInput name="billAPlusOtherC" type="number" size="sm" className="w-100 fs-small" />
                              </div>
                            </div>
                            <div className="rate-grid-cell">
                              <span className="rate-label">Received Amt</span>
                              <div className="rate-input">
                                <FormikTextInput name="receivedAmount" size="sm" type="number" className="w-100 fs-small" />
                              </div>
                            </div>
                          </div>
                          {/* Row 6: Credit Transfer | Sett. Disc */}
                          <div className="rate-grid-row">
                            <div className="rate-grid-cell">
                              <span className="rate-label text-danger">Credit Transfer</span>
                              <div className="rate-input">
                                <FormikTextInput name="creditTransfer" size="sm" type="number" className="w-100 fs-small" />
                              </div>
                            </div>
                            <div className="rate-grid-cell">
                              <span className="rate-label">Sett. Disc</span>
                              <div className="rate-input">
                                <FormikTextInput name="settDisc" size="sm" type="number" className="w-100 fs-small" readOnly />
                              </div>
                            </div>
                          </div>
                          {/* Row 7: Pay Method | Balance Amt */}
                          <div className="rate-grid-row">
                            <div className="rate-grid-cell">
                              <span className="rate-label">Pay Method</span>
                              <div className="rate-input">
                                <FormSelect name="paymentMethod" options={paymentMethodOptions} size="sm" className="w-100 fs-small" isLoading={loadingPaymentMethods} onChange={(v) => setFieldValue('paymentMethod', v)} />
                              </div>
                            </div>
                            <div className="rate-grid-cell">
                              <span className="rate-label fw-bold">Balance Amt</span>
                              <div className="rate-input">
                                <FormikTextInput name="balanceAmount" size="sm" type="number" className="w-100 fs-small fw-bold" />
                              </div>
                            </div>
                          </div>
                          {/* Row 8: Total Amt */}
                          <div className="rate-grid-row">
                            <div className="rate-grid-cell">
                              <span className="rate-label fw-bold">Total Amt</span>
                              <div className="rate-input">
                                <FormikTextInput name="totalAmt" size="sm" type="number" className="w-100 fs-small fw-bold" readOnly />
                              </div>
                            </div>
                            <div className="rate-grid-cell" />
                          </div>
                        </div>

                        {/* Desktop/Tablet grid rows (hidden on mobile) */}
                        {/* Row 1: Discount %, Service, Taxable Amt */}
                        <Row className="align-items-center g-1 mb-1 d-none d-lg-flex">
                          <Col md={2} className="fs-small">
                            Discount %
                          </Col>
                          <Col md={2}>
                            <FormikTextInput
                              name="discount"
                              size="sm"
                              type="number"
                              className="w-100 fs-small"
                            />
                          </Col>
                          <Col md={2} className="fs-small">
                            Service
                          </Col>
                          <Col md={2}>
                            <FormikTextInput
                              name="roomService"
                              size="sm"
                              type="number"
                              className="w-100 fs-small"
                            />
                          </Col>
                          <Col md={2} className="fs-small">
                            Taxable Amt
                          </Col>
                          <Col md={2}>
                            <FormikTextInput
                              name="taxableAmt"
                              size="sm"
                              type="number"
                              className="w-100 fs-small"
                            />
                          </Col>
                        </Row>

                        {/* Row 2: SGST Amt, CGST Amt, Round Off */}
                        <Row className="align-items-center g-1 mb-1 d-none d-lg-flex">
                          <Col md={2} className="fs-small">
                            SGST Amt
                          </Col>
                          <Col md={2}>
                            <FormikTextInput
                              name="sgst"
                              type="number"
                              size="sm"
                              className="w-100 fs-small"
                            />
                          </Col>
                          <Col md={2} className="fs-small">
                            CGST Amt
                          </Col>
                          <Col md={2}>
                            <FormikTextInput
                              name="cgst"
                              type="number"
                              size="sm"
                              className="w-100 fs-small"
                            />
                          </Col>
                          <Col md={2} className="fs-small">
                            Round Off
                          </Col>
                          <Col md={2}>
                            <FormikTextInput
                              name="roundOff"
                              size="sm"
                              type="number"
                              className="w-100 fs-small"
                            />
                          </Col>
                        </Row>

                        {/* Row 3: Bill Amt, Other Charges, Bill + Other */}
                        <Row className="align-items-center g-1 mb-1 d-none d-lg-flex">
                          <Col md={2} className="fs-small">
                            Bill Amt
                          </Col>
                          <Col md={2}>
                            <FormikTextInput
                              name="billAmount"
                              size="sm"
                              type="number"
                              className="w-100 fs-small fw-bold"
                            />
                          </Col>
                          <Col md={2} className="fs-small">
                            Other Charges
                          </Col>
                          <Col md={2}>
                            <FormikTextInput
                              name="otherCharges"
                              type="number"
                              size="sm"
                              className="w-100 fs-small"
                            />
                          </Col>
                          <Col md={2} className="fs-small text-danger">
                            Bill + Other
                          </Col>
                          <Col md={2}>
                            <FormikTextInput
                              name="billAPlusOtherC"
                              type="number"
                              size="sm"
                              className="w-100 fs-small"
                            />
                          </Col>
                        </Row>

                        {/* Row 4: Received Amt, Credit Transfer, Sett. Disc */}
                        <Row className="align-items-center g-1 mb-1 d-none d-lg-flex">
                          <Col md={2} className="fs-small">
                            Received Amt
                          </Col>
                          <Col md={2}>
                            <FormikTextInput
                              name="receivedAmount"
                              size="sm"
                              type="number"
                              className="w-100 fs-small"
                            />
                          </Col>
                          <Col md={2} className="fs-small text-danger">
                            Credit Transfer
                          </Col>
                          <Col md={2}>
                            <FormikTextInput
                              name="creditTransfer"
                              size="sm"
                              type="number"
                              className="w-100 fs-small"
                            />
                          </Col>
                          <Col md={2} className="fs-small">
                            Sett. Disc
                          </Col>
                          <Col md={2}>
                            <FormikTextInput
                              name="settDisc"
                              size="sm"
                              type="number"
                              className="w-100 fs-small"
                              readOnly
                            />
                          </Col>
                        </Row>

                        {/* Row 5: Pay Method, Balance Amt, Total Amt */}
                        <Row className="align-items-center g-1 mb-1 d-none d-lg-flex">
                          <Col md={2} className="fs-small">
                            Pay Method
                          </Col>
                          <Col md={2}>
                            <FormSelect
                              name="paymentMethod"
                              options={paymentMethodOptions}
                              size="sm"
                              className="w-100 fs-small"
                              isLoading={loadingPaymentMethods}
                              onChange={(v) => setFieldValue('paymentMethod', v)}
                            />
                          </Col>
                          <Col md={2} className="fs-small fw-bold">
                            Balance Amt
                          </Col>
                          <Col md={2}>
                            <FormikTextInput
                              name="balanceAmount"
                              size="sm"
                              type="number"
                              className="w-100 fs-small fw-bold"
                            />
                          </Col>
                          <Col md={2} className="fs-small fw-bold">
                            Total Amt
                          </Col>
                          <Col md={2}>
                            <FormikTextInput
                              name="totalAmt"
                              size="sm"
                              type="number"
                              className="w-100 fs-small fw-bold"
                              readOnly
                            />
                          </Col>
                        </Row>
                      </div>
                    </div>
                  </Col>

                  {/* ===== COLUMN 3: Travel Agent Information ===== */}
                  <Col
                    {...{ [colBreakpoint]: rightColSpan }}
                    xs={12}
                    className={`d-flex flex-column tab-section${activeMobileTab === 'agent' ? ' tab-active' : ''}`}>
                    <div className="bordered-section">
                      <div className="section-header">
                        <span className="fw-bold">Travel Agent Information</span>
                      </div>

                      <div className="agent-field-row mb-1">
                        <div
                          className="d-flex align-items-center gap-4 fs-small"
                          style={{ width: '100%' }}>
                          <label className="d-flex align-items-center gap-2 mb-0">
                            <input
                              type="checkbox"
                              name="payAtHotelBooking"
                              style={{ cursor: 'pointer' }}
                            />
                            Pay at Hotel Booking
                          </label>
                          <label className="d-flex align-items-center gap-2 mb-0">
                            <input
                              type="checkbox"
                              name="printOnBill"
                              style={{ cursor: 'pointer' }}
                            />
                            Print On Bill
                          </label>
                        </div>
                      </div>

                      <div className="agent-field-row mb-1">
                        <span className="agent-label">Agent Name</span>
                        <div className="agent-input">
                          <Select
                            options={travelAgentOptions}
                            isLoading={loadingTravelAgents}
                            className="fs-small"
                            styles={selectStyles}
                            defaultValue={travelAgentOptions[0]}
                            value={
                              values.travelAgentId
                                ? travelAgentOptions.find(
                                  (o) => o.value === String(values.travelAgentId),
                                ) || null
                                : values.travelAgent === SELF_AGENT_VALUE ||
                                  (!values.travelAgentId && !values.travelAgent)
                                  ? travelAgentOptions[0]
                                  : null
                            }
                            onChange={(opt) => {
                              if (!opt || opt.value === SELF_AGENT_VALUE) {
                                handleAgentSelect(null)
                                setFieldValue('travelAgent', SELF_AGENT_VALUE)
                              } else {
                                handleAgentSelect(Number(opt.value))
                              }
                            }}
                            onInputChange={(inputValue, { action }) => {
                              if (action === 'input-change') {
                                loadTravelAgents(inputValue)
                              }
                            }}
                            placeholder="Select Agent"
                            isClearable
                          />
                        </div>
                      </div>

                      <div className="agent-field-row mb-1">
                        <span className="agent-label">Booking Date</span>
                        <div className="agent-input">
                          <FormikTextInput
                            name="bookingDate"
                            type="date"
                            size="sm"
                            className="w-100 fs-small"
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="agent-field-row  mb-1">
                        <span className="agent-label">Booking ID</span>
                        <div className="agent-input">
                          <FormikTextInput
                            name="bookingId"
                            type="text"
                            size="sm"
                            className="w-100 fs-small"
                          />
                        </div>
                      </div>

                      <div className="agent-field-row  mb-1">
                        <span className="agent-label">Commission</span>
                        <div className="agent-input">
                          <div className="agent-pct-val">
                            <div className="pct-box">
                              <FormikTextInput
                                name="agentAmountPer"
                                type="number"
                                size="sm"
                                className="w-100 fs-small"
                                readOnly
                              />
                            </div>
                            <span className="sep">%</span>
                            <div className="val-box">
                              <FormikTextInput
                                name="agentAmount"
                                type="number"
                                size="sm"
                                className="w-100 fs-small"
                                readOnly
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="agent-field-row  mb-1">
                        <span className="agent-label">CGST</span>
                        <div className="agent-input">
                          <div className="agent-pct-val">
                            <div className="pct-box">
                              <FormikTextInput
                                name="agentCgstPer"
                                type="number"
                                size="sm"
                                className="w-100 fs-small"
                                readOnly
                              />
                            </div>
                            <span className="sep">%</span>
                            <div className="val-box">
                              <FormikTextInput
                                name="agentCgst"
                                type="number"
                                size="sm"
                                className="w-100 fs-small"
                                readOnly
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="agent-field-row  mb-1">
                        <span className="agent-label">SGST</span>
                        <div className="agent-input">
                          <div className="agent-pct-val">
                            <div className="pct-box">
                              <FormikTextInput
                                name="agentSgstPer"
                                type="number"
                                size="sm"
                                className="w-100 fs-small"
                                readOnly
                              />
                            </div>
                            <span className="sep">%</span>
                            <div className="val-box">
                              <FormikTextInput
                                name="agentSgst"
                                type="number"
                                size="sm"
                                className="w-100 fs-small"
                                readOnly
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="agent-field-row  mb-1">
                        <span className="agent-label">IGST</span>
                        <div className="agent-input">
                          <div className="agent-pct-val">
                            <div className="pct-box">
                              <FormikTextInput
                                name="agentIgstPer"
                                type="number"
                                size="sm"
                                className="w-100 fs-small"
                                readOnly
                              />
                            </div>
                            <span className="sep">%</span>
                            <div className="val-box">
                              <FormikTextInput
                                name="agentIgst"
                                type="number"
                                size="sm"
                                className="w-100 fs-small"
                                readOnly
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="agent-field-row  mb-1">
                        <span className="agent-label">CESS</span>
                        <div className="agent-input">
                          <div className="agent-pct-val">
                            <div className="pct-box">
                              <FormikTextInput
                                name="agentCessPer"
                                type="number"
                                size="sm"
                                className="w-100 fs-small"
                                readOnly
                              />
                            </div>
                            <span className="sep">%</span>
                            <div className="val-box">
                              <FormikTextInput
                                name="agentCess"
                                type="number"
                                size="sm"
                                className="w-100 fs-small"
                                readOnly
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="agent-field-row  mb-1">
                        <span className="agent-label">TDS</span>
                        <div className="agent-input">
                          <div className="agent-pct-val">
                            <div className="pct-box">
                              <FormikTextInput
                                name="agentTdsPer"
                                type="number"
                                size="sm"
                                className="w-100 fs-small"
                                readOnly
                              />
                            </div>
                            <span className="sep">%</span>
                            <div className="val-box">
                              <FormikTextInput
                                name="agentTds"
                                type="number"
                                size="sm"
                                className="w-100 fs-small"
                                readOnly
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="agent-field-row  mb-1">
                        <span className="agent-label">TCS</span>
                        <div className="agent-input">
                          <div className="agent-pct-val">
                            <div className="pct-box">
                              <FormikTextInput
                                name="agentTcsPer"
                                type="number"
                                size="sm"
                                className="w-100 fs-small"
                                readOnly
                              />
                            </div>
                            <span className="sep">%</span>
                            <div className="val-box">
                              <FormikTextInput
                                name="agentTcs"
                                type="number"
                                size="sm"
                                className="w-100 fs-small"
                                readOnly
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="agent-field-row  mb-1">
                        <span className="agent-label">Service Fee</span>
                        <div className="agent-input">
                          <FormikTextInput
                            name="agentServiceFee"
                            type="number"
                            size="sm"
                            className="w-100 fs-small"
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="agent-field-row  mb-1">
                        <span className="agent-label fw-bold text-success">Agent Comm.</span>
                        <div className="agent-input">
                          <FormikTextInput
                            name="agentTotal"
                            type="number"
                            size="sm"
                            className="w-100 fs-small fw-bold"
                            readOnly
                          />
                        </div>
                      </div>

                      <div className="agent-field-row  mb-1">
                        <span className="agent-label fw-bold text-success">Pay to Hotel</span>
                        <div className="agent-input">
                          <FormikTextInput
                            name="agentPayToHotel"
                            type="number"
                            size="sm"
                            className="w-100 fs-small fw-bold"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>
                    {/* Mobile/Tablet only: Special Instruction merged into Agent tab */}
                    <div className="mobile-special-merged">
                      <div
                        className="bordered-section mt-2"
                        style={{ border: '1px solid #adb5bd', overflow: 'hidden' }}>
                        <div className="section-header" style={{ marginBottom: 0 }}>
                          <span className="fw-bold">Special Instruction</span>
                        </div>
                        <textarea
                          {...formik.getFieldProps('specialInstruction')}
                          className="form-control form-control-sm fs-small border-0 instruction-textarea"
                          style={{ resize: 'none', borderRadius: 0, minHeight: '80px' }}
                          rows={3}
                          placeholder="Enter instruction"
                        />
                      </div>
                    </div>
                  </Col>
                </Row>

                {/* ===== BOTTOM SECTION: Special Instruction & Message (desktop/laptop/xl only — mobile/tablet use Agent/Guest tabs) ===== */}
                <Row
                  className="g-2 mt-1 tab-section special-tab-section"
                  style={{ flex: 1, minHeight: 0 }}>
                  <Col md={6} className="d-flex flex-column">
                    <div
                      className="bordered-section"
                      style={{ border: '1px solid #adb5bd', overflow: 'hidden' }}>
                      <div className="section-header" style={{ marginBottom: 0 }}>
                        <span className="fw-bold">Special Instruction</span>
                      </div>
                      <textarea
                        {...formik.getFieldProps('specialInstruction')}
                        className="form-control form-control-sm fs-small border-0 flex-fill instruction-textarea"
                        style={{ resize: 'none', borderRadius: 0, minHeight: '100px' }}
                        rows={4}
                        placeholder="Enter instruction"
                      />
                    </div>
                  </Col>
                  <Col md={6} className="d-flex flex-column">
                    <div
                      className="bordered-section"
                      style={{ border: '1px solid #adb5bd', overflow: 'hidden' }}>
                      <div className="section-header" style={{ marginBottom: 0 }}>
                        <span className="fw-bold">Message</span>
                      </div>
                      <textarea
                        {...formik.getFieldProps('message')}
                        className="form-control form-control-sm fs-small border-0 flex-fill instruction-textarea"
                        style={{ resize: 'none', borderRadius: 0, minHeight: '100px' }}
                        rows={4}
                        placeholder="Enter message"
                      />
                    </div>
                  </Col>
                </Row>
              </form>
            </Card.Body>
          </Card>
        </div>
        {/* end checkin-scroll-body */}

        {/* ===== FIXED BOTTOM BAR ===== */}
        <div className="fixed-bottom-bar">
          <div className="d-flex flex-wrap gap-2">

            <Button
              size="sm"
              variant="primary"
              className="fw-semibold btn-icon-only"
              onClick={handleHistoryClick}>
              <i className="fi fi-rr-time-past"></i>
              <span className="btn-label-text ms-1">History</span>
            </Button>
            <Button
              size="sm"
              variant="info"
              className="fw-semibold text-white btn-icon-only"
              onClick={handleShowDocuments}
              disabled={!values.guestId}>
              <i className="fi fi-rr-eye"></i>
              <span className="btn-label-text ms-1">Document</span>
            </Button>
            <Button
              size="sm"
              variant="success"
              className="fw-semibold btn-icon-only"
              onClick={handleOpenDocScan}>
              <i className="fi fi-rr-user"></i>
              <span className="btn-label-text ms-1">Doc</span>
            </Button>
          </div>
          <div className="d-flex gap-2 align-items-center">
            <Button
              variant="success"
              size="sm"
              type="submit"
              form="checkin-form"
              disabled={submitting || isCheckInDisabled()}
              title={getMissingRoomsMessage()}>
              <span className="ms-1">
                {submitting
                  ? 'Processing...'
                  : !areAllRoomsAdded() && roomRows.length > 0
                    ? `Add ${initialSelectedRooms.length - roomRows.length} more room(s)`
                    : 'Check In'}
              </span>
              <span className="btn-label-text" style={{ fontSize: '0.65rem', opacity: 0.8 }}>
                {' '}
                [F9]
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* ===== MODALS ===== */}
      <FormModal
        size="lg"
        show={showGuestModal}
        onHide={() => setShowGuestModal(false)}
        title="Add New Guest"
        onSave={handleGuestSave}
        saving={savingGuest}
        submitLabel="Save Guest"
        Component={GuestForm}
        selectedItem={defaultGuestForm}
      />

      <FormModal
        size="lg"
        show={showCompanyModal}
        onHide={() => setShowCompanyModal(false)}
        title="Add New Company"
        onSave={handleCompanySave}
        saving={savingCompany}
        submitLabel="Save Company"
        Component={CompanyForm}
        selectedItem={{
          ...defaultCompanyForm,
          hotelid: hotelId,
          created_by_id: user?.id,
        }}
      />

      <GuestHistoryModal
        show={showHistoryModal}
        onHide={() => setShowHistoryModal(false)}
        guestId={values.guestId || null}
        guestName={getGuestName()}
      />

      <DocumentScannerModal
        show={showDocScanModal}
        onHide={() => setShowDocScanModal(false)}
        onCapture={handleGuestPhotoCapture}
        uploading={false}
        guestName={getGuestName()}
      />

      <GuestDocumentsModal
        show={showGuestDocsModal}
        onHide={() => setShowGuestDocsModal(false)}
        documents={guestDocuments}
        guestName={getGuestName()}
        guestId={values.guestId}
        onDocumentsChange={() => values.guestId && loadGuestDocuments(values.guestId, false)}
        tempGuestPhoto={tempGuestPhoto}
      />
    </FormikProvider>
  )
}

export default CheckInForm