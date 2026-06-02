// CheckInForm.tsx (MySQL Compatible Version - With Inventory Auto-Assign Integration)
// UPDATED: Guest history now uses checkout tables only
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
import CountryService from '@/common/hotel/countries'
import StateService from '@/common/hotel/states'
import CityService from '@/common/hotel/cities'
import CompanyService from '@/common/hotel/company'
import GuestService from '@/common/hotel/guest'
import RoomService from '@/common/hotel/room'
import RoomCategoryService from '@/common/hotel/roomCategoryService'
import taxApi from '@/common/hotel/taxes'
import FragmentService from '@/common/hotel/fragments'
import DocumentTypeService from '@/common/hotel/documentType'
import CheckInService from '@/common/hotel/checkIn'

import DetailService from '@/common/hotel/detail'
import GuestFolioService from '@/common/hotel/guestFolio'
import GuestRoomChargesService from '@/common/hotel/guestRoomCharges'
import PaymentMethodService from '@/common/hotel/paymentMethod'
import travelAgentApi from '@/common/hotel/travelagent'
import AgentRoomCheckinService from '@/common/hotel/agentRoomCheckin'
import StockService from '@/common/hotel/stock'
import { useAuthContext } from '@/common/context/useAuthContext'

import type { CheckInPayload } from '@/common/hotel/checkIn'
import type { DetailPayload } from '@/common/hotel/detail'
import type { GuestFolioPayload } from '@/common/hotel/guestFolio'
import type { AgentRoomCheckinPayload } from '@/common/hotel/agentRoomCheckin'

import GuestForm from '../Guest/GuestForm'
import CompanyForm from '../Company/CompanyForm'

import GuestHistoryModal from './GuestHistoryModal'
import DocumentScannerModal from './DocumentScannerModal'
import GuestDocumentsModal from './GuestDocumentsModal'

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
}

interface GuestDocument {
  document_id: number
  document_type: string
  document_no: string
  front_side: string | null
  back_side: string | null
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

  const state = location.state as {
    rooms?: Array<{ roomId: number; roomNumber: string; roomCategoryName: string }>
    hotelId?: number
  } | null

  const hotelId = state?.hotelId || loggedInUser?.hotel_id

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
  const [countries, setCountries] = useState<Array<{ id: number; name: string }>>([])
  const [states, setStates] = useState<Array<{ id: number; name: string }>>([])
  const [cities, setCities] = useState<Array<{ id: number; name: string }>>([])
  const [companies, setCompanies] = useState<Array<{ company_id: number; company_name: string }>>(
    [],
  )

  const [categoryStandardPaxMap, setCategoryStandardPaxMap] = useState<Map<number, number>>(
    new Map(),
  )
  const [selectedRoomCategoryPax, setSelectedRoomCategoryPax] = useState(0)
  const [selectedCategoryName, setSelectedCategoryName] = useState('')
  const [selectedRoomTariff, setSelectedRoomTariff] = useState(0)
  const [documentTypes, setDocumentTypes] = useState<Array<{ id: string; name: string }>>([])
  const [loadingDocTypes, setLoadingDocTypes] = useState(false)
  const [guests, setGuests] = useState<Array<{ guest_id: number; name: string; mobile: string }>>(
    [],
  )
  const [fragments, setFragments] = useState<Array<{ fragment_id: number; name: string }>>([])
  const [loadingCountries, setLoadingCountries] = useState(false)
  const [loadingStates, setLoadingStates] = useState(false)
  const [loadingCities, setLoadingCities] = useState(false)
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
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [pendingGuestLoad, setPendingGuestLoad] = useState<number | null>(null)

  // ==================== INVENTORY AUTO-ASSIGN FUNCTION ====================
  const autoAssignAmenities = async (checkinId: number, roomId: number, guestCount: number) => {
    if (!hotelId) return
    try {
      const response = await StockService.autoAssign({ 
        checkin_id: checkinId, 
        room_id: roomId, 
        guest_count: guestCount,
        hotelid: hotelId 
      })
      if (response.success && response.data?.assignedItems?.length > 0) {
        console.log(`Auto-assigned amenities to room ${roomId}:`, response.data.assignedItems)
        return response.data.assignedItems
      }
    } catch (error) {
      console.error(`Failed to auto-assign amenities for room ${roomId}:`, error)
    }
    return []
  }
  // ==================== END INVENTORY FUNCTION ====================

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

  // Prepare Agent Room Checkin Payload Helper Function
  const prepareAgentRoomCheckinPayload = (
    checkinId: number, 
    regNoValue: string, 
    guestId: number, 
    roomRow: RoomRow,
    values: CheckInFormData,
    totalAmount: number,
    totalRoomCharges: number,
    totalExtraCharges: number
  ): AgentRoomCheckinPayload => {
    const agentId = values.travelAgentId
    const selectedAgent = travelAgents.find(a => a.agent_id === agentId)

    const safeRegNo = regNoValue || values.regNo || regNo || ''

    const rawCommissionType = selectedAgent?.commission_type
    const safeCommissionType: 'PERCENTAGE' | 'FIXED' =
      rawCommissionType === 'FIXED' ? 'FIXED' : 'PERCENTAGE'
    
    return {
      checkin_id: checkinId,
      reg_no: safeRegNo,
      hotelid: hotelId!,
      guest_id: guestId,
      agent_id: agentId || null,
      agent_name: selectedAgent?.agent_name || values.travelAgent || null,
      agent_code: selectedAgent?.agent_code || null,
      commission_type: safeCommissionType,
      commission_value: selectedAgent?.commission_value || values.agentAmountPer || null,
      commission_amount: values.agentAmount || null,
      agent_cgst_percent: values.agentCgstPer || null,
      agent_cgst_amount: values.agentCgst || null,
      agent_sgst_percent: values.agentSgstPer || null,
      agent_sgst_amount: values.agentSgst || null,
      agent_igst_percent: values.agentIgstPer || null,
      agent_igst_amount: values.agentIgst || null,
      agent_cess_percent: values.agentCessPer || null,
      agent_cess_amount: values.agentCess || null,
      agent_tds_percent: values.agentTdsPer || null,
      agent_tds_amount: values.agentTds || null,
      agent_tcs_percent: values.agentTcsPer || null,
      agent_tcs_amount: values.agentTcs || null,
      agent_service_fee: values.agentServiceFee || null,
      agent_total_commission: values.agentTotal || null,
      agent_pay_to_hotel: values.agentPayToHotel || null,
      room_id: roomRow.roomId,
      room_number: roomRow.roomNumber,
      room_category_id: roomRow.roomCategoryId || null,
      converted_category_id: roomRow.convertedCategoryId || null,
      total_room_charges: totalRoomCharges,
      total_extra_charges: totalExtraCharges,
      grand_total_amount: totalAmount,
      payment_method: values.paymentMethod || null,
      plan_name: values.planName || 'EP',
      booking_id: values.bookingId || null,
      booking_date: values.bookingDate || null,
      status: 'active',
      is_billed: 0,
      is_dayend: 0,
      created_by_id: user?.id
    }
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
          PaymentMethodService.list({ status: 1 }),
        ])

        let countriesData = Array.isArray(countriesRes) ? countriesRes : countriesRes?.data || []
        setCountries(
          countriesData
            .map((c: any) => ({ id: c.id || c.countryid, name: String(c.name || c.country_name) }))
            .filter((c: any) => c.id && c.name),
        )

        let statesData = Array.isArray(statesRes) ? statesRes : statesRes?.data || []
        setStates(
          statesData
            .map((s: any) => ({ id: s.id || s.stateid, name: String(s.name || s.state_name) }))
            .filter((s: any) => s.id && s.name),
        )

        let citiesData = Array.isArray(citiesRes) ? citiesRes : citiesRes?.data || []
        setCities(
          citiesData
            .map((c: any) => ({ id: c.id || c.cityid, name: String(c.name || c.city_name) }))
            .filter((c: any) => c.id && c.name),
        )

        let companiesData = Array.isArray(companiesRes) ? companiesRes : companiesRes?.data || []
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

        let categoriesData = Array.isArray(categoriesRes)
          ? categoriesRes
          : categoriesRes?.data || []
        setRoomCategories(
          categoriesData.map((c: any) => ({
            room_category_id: Number(c.room_category_id || c.id),
            category_name: String(c.category_name || c.name),
            pax: c.max_limit || c.pax || 0,
          })),
        )

        let taxData = Array.isArray(taxRes) ? taxRes : taxRes?.data || []
        setTaxList(taxData)

        let fragmentsData = Array.isArray(fragmentsRes) ? fragmentsRes : fragmentsRes?.data || []
        setFragments(
          fragmentsData
            .map((f: any) => ({
              fragment_id: f.fragment_id || f.id,
              name: String(f.name),
            }))
            .filter((f: any) => f.fragment_id && f.name),
        )

        let paymentMethodsData = Array.isArray(paymentMethodsRes)
          ? paymentMethodsRes
          : paymentMethodsRes?.data || []
        const mappedPaymentMethods = paymentMethodsData.map((pm: any) => ({
          id: pm.id,
          name: pm.payment_method_name || pm.name,
          payment_method_name: pm.payment_method_name || pm.name,
        }))
        setPaymentMethods(mappedPaymentMethods)
        const cashMethod = mappedPaymentMethods.find(
          (pm: any) => pm.payment_method_name?.toLowerCase() === 'cash'
        )
        if (cashMethod) {
          formik.setFieldValue('paymentMethod', cashMethod.payment_method_name)
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

  // Sentinel value for the "Self" option
  const SELF_AGENT_VALUE = '__SELF__'

  // Build agent options: "Self" first, then all travel agents from API
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
    () => paymentMethods.map((pm) => ({ label: pm.name, value: pm.payment_method_name })),
    [paymentMethods],
  )

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
        formik.setFieldValue('phone1', guest.mobile ? String(guest.mobile) : '')
        formik.setFieldValue('phone2', guest.phone ? String(guest.phone) : '')
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

  const handleGuestPhotoCapture = async (imageDataUrl: string) => {
    if (!values.guestId) {
      toast.error('No guest selected')
      return
    }
    setUploadingDoc(true)
    try {
      const blob = await fetch(imageDataUrl).then(res => res.blob())
      const file = new File([blob], `guest_photo_${Date.now()}.jpg`, { type: 'image/jpeg' })
      
      const existingPhotoDoc = guestDocuments.find((doc) => doc.document_type === 'Guest Photo')
      
      if (existingPhotoDoc) {
        await GuestService.updateDocument(values.guestId, existingPhotoDoc.document_id, {
          document_type: 'Guest Photo',
          document_no: new Date().toISOString().slice(0, 19).replace(/:/g, '-'),
          front_side: file,
          back_side: null,
        })
        console.log('Guest photo updated successfully')
      } else {
        await GuestService.createDocument(values.guestId, {
          document_type: 'Guest Photo',
          document_no: new Date().toISOString().slice(0, 19).replace(/:/g, '-'),
          front_side: file,
          back_side: null,
        })
        console.log('Guest photo created successfully')
      }
      
      toast.success('Guest photo uploaded successfully')
      setShowDocScanModal(false)
      
      setTimeout(async () => {
        await loadGuestDocuments(values.guestId!, true)
      }, 500)
    } catch (error) {
      console.error('Failed to upload guest photo:', error)
      toast.error('Photo upload failed')
    } finally {
      setUploadingDoc(false)
    }
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
    setSavingCompany(true)
    try {
      const payload = {
        ...companyData,
        mst_hotelid: hotelId,
        created_by_id: user?.id,
      }

      const response = await CompanyService.create(payload)
      const newCompany: any = response.data || response
      const newCompanyId = newCompany.company_id || newCompany.id

      toast.success('Company saved successfully')
      setShowCompanyModal(false)

      await loadAllCompanies()
      if (newCompanyId) {
        formik.setFieldValue('companyId', newCompanyId)
        if (newCompany.gst_no) {
          formik.setFieldValue('gst', String(newCompany.gst_no))
        }
      }
    } catch (error) {
      console.error('Failed to save company:', error)
      toast.error('Failed to save company')
    } finally {
      setSavingCompany(false)
    }
  }

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
            let convertedTariff = tariffs.length > 0 ? Number(tariffs[0].room_tariff) || 0 : 0
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
            let originalTariff = tariffs.length > 0 ? Number(tariffs[0].room_tariff) || 0 : 0
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
        let tariff = tariffs.length > 0 ? Number(tariffs[0].room_tariff) || 0 : 0
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
      const perNightPrice = mode.charges * count
      let taxPercent = 0
      if (mode.is_tax_applicable && mode.tax_type) {
        taxPercent = taxMapLocal.get(Number(mode.tax_type)) || 0
      }
      const perNightTax = (perNightPrice * taxPercent) / 100
      const perNightTotal = perNightPrice + perNightTax

      return {
        price: round2(perNightPrice),
        tax: round2(perNightTax),
        taxPercent,
        total: round2(perNightTotal),
      }
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

// UPDATED: Guest history now handled by GuestHistoryModal directly (checkout tables only)
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

  const formik = useFormik<CheckInFormData>({
    enableReinitialize: true,
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
      arrivalTime: '12:00',
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
  if (roomRows.length === 0) {
    toast.error('Please add at least one room')
    return
  }

  setSubmitting(true)

  try {
    const groups = new Map<number, RoomRow[]>()
    roomRows.forEach((row) => {
      const gid = row.guestId
      if (gid === null || gid === undefined) return
      if (!groups.has(gid)) groups.set(gid, [])
      groups.get(gid)!.push(row)
    })

    for (const [guestId, rows] of groups.entries()) {
      const firstRow = rows[0]
      const guestName = firstRow.guestName
      const totalNights = firstRow.nights

      // Build datetime strings as 'YYYY-MM-DD HH:MM:SS' — MySQL-compatible, timezone-safe.
      // Avoid new Date('YYYY-MM-DD') which parses as UTC and shifts dates in non-UTC timezones.
      const checkinDateTime = `${firstRow.arrivalDate} ${firstRow.arrivalTime}:00`
      const checkoutDateTime = `${firstRow.departureDate} ${firstRow.departureTime}:00`

      const primaryCategoryId =
        roomCategories.find((c) => c.category_name === firstRow.type)?.room_category_id ??
        undefined

      const firstRoomDeptInfo = roomDepartmentMap.get(firstRow.roomId)
      const departmentId = firstRoomDeptInfo?.department_id ?? undefined
      const departmentName = firstRoomDeptInfo?.department_name || ''

      const companyName =
        values.companyId === 'WALK-N-GUESTI' || !values.companyId
          ? 'WALK-IN-GUEST'
          : companies.find((c) => c.company_id === values.companyId)?.company_name ||
            'WALK-IN-GUEST'

      const totalAdults = rows.reduce((sum, row) => sum + (row.adults || 0), 0)
      const totalPax = rows.reduce((sum, row) => sum + (row.pax || 0), 0)
      const totalExPax = rows.reduce((sum, row) => sum + (row.exPax || 0), 0)
      const totalChildPaid = rows.reduce((sum, row) => sum + (row.childPaid || 0), 0)
      const totalChildUnpaid = rows.reduce((sum, row) => sum + (row.childUnpaid || 0), 0)
      const totalDriver = rows.reduce((sum, row) => sum + (row.driver || 0), 0)
      
      const totalPaxCharges = rows.reduce((sum, row) => sum + (row.rate * row.nights), 0)
      const totalExPaxCharge = rows.reduce((sum, row) => sum + ((row.exPaxPrice || 0) * row.nights), 0)
      const totalDriverCharge = rows.reduce((sum, row) => sum + ((row.driverPrice || 0) * row.nights), 0)
      const totalChildPaidCharge = rows.reduce((sum, row) => sum + ((row.childPrice || 0) * row.nights), 0)

      const convertedCategoryValue = firstRow.convertedCategoryName || ''

      let totalAmountAllNights = 0
      rows.forEach((row) => {
        totalAmountAllNights += safeNumber(row.totalAmount)
      })

      let firstDayTotalAmount = 0
      rows.forEach((row) => {
        firstDayTotalAmount += safeNumber(row.totalAmount) / totalNights
      })

      const checkinPayload: CheckInPayload = {
        guest_id: guestId,
        guest_name: guestName,
        address: values.address,
        mobile: values.phone1,
        company_name: companyName,
        emailed: values.email,
        booking: values.bookingType,
        plan_name: values.planName,
        reg_no: values.regNo,
        special_instruction: values.specialInstruction,
        message: values.message,
        checkin_datetime: checkinDateTime,
        checkout_datetime: checkoutDateTime,
        room_no: firstRow.roomNumber,
        category_id: primaryCategoryId,
        converted_category: convertedCategoryValue,
        adults: totalAdults,
        pax: totalPax,
        pax_charges: totalPaxCharges,
        ex_pax: totalExPax,
        ex_pax_charge: totalExPaxCharge,
        child_paid: totalChildPaid,
        child_unpaid: totalChildUnpaid,
        child_charge: totalChildPaidCharge,
        driver: totalDriver.toString(),
        driver_charge: totalDriverCharge,
        hotelid: hotelId,
        id_type: values.idType || '',
        id_number: values.idNumber || '',
        department_id: departmentId,
        department_name: departmentName,
        status: 'active',
        created_by_id: user?.id,
        room_ids: rows.map((row) => row.roomId),
        total_nights: totalNights,
        total_amount: totalAmountAllNights,
      }

      const checkinRes = await CheckInService.create(checkinPayload)
      const checkinId = checkinRes.data.checkin_id
      const finalRegNo = checkinRes.data.reg_no || values.regNo || regNo || ''
      
      if (!finalRegNo) {
        console.warn('reg_no could not be determined — agent room checkin record may fail validation')
      }
      
      // Build datetime strings directly from date parts — avoids UTC timezone shift.
      // new Date('YYYY-MM-DD') parses as UTC midnight, so in IST (UTC+5:30) it would shift
      // the date back by one day. Using Date(year, month-1, day) uses LOCAL time instead.
      const addDaysToDateStr = (dateStr: string, days: number): string => {
        const [year, month, day] = dateStr.split('-').map(Number)
        const d = new Date(year, month - 1, day + days)
        return [
          d.getFullYear(),
          String(d.getMonth() + 1).padStart(2, '0'),
          String(d.getDate()).padStart(2, '0'),
        ].join('-')
      }

      // MySQL-compatible format: 'YYYY-MM-DD HH:MM:SS' (no 'T', no timezone suffix)
      const firstDayCheckinDateTime = `${firstRow.arrivalDate} ${firstRow.arrivalTime}:00`
      const firstDayCheckoutDate = addDaysToDateStr(firstRow.arrivalDate, 1)
      const firstDayCheckoutDateTime = `${firstDayCheckoutDate} ${firstRow.departureTime}:00`

      const allDetailPayloads: DetailPayload[] = []
      const allChargePayloads: any[] = []
      
      let totalRoomChargesForAgent = 0
      let totalExtraChargesForAgent = 0

      for (const row of rows) {
        const categoryId = roomCategories.find((c) => c.category_name === row.type)?.room_category_id ?? undefined

        const dailyDiscountedTariff = row.rate - ((row.rate * (row.discount || 0)) / 100)
        const dailyCgstAmount = (dailyDiscountedTariff * (row.cgstPercent || 0)) / 100
        const dailySgstAmount = (dailyDiscountedTariff * (row.sgstPercent || 0)) / 100
        const dailyIgstAmount = (dailyDiscountedTariff * (row.igstPercent || 0)) / 100
        const dailyCessAmount = (dailyDiscountedTariff * (row.cessPercent || 0)) / 100
        const dailyTotalTax = dailyCgstAmount + dailySgstAmount + dailyIgstAmount + dailyCessAmount

        const dailyExPaxTotal = row.exPaxTotal || 0
        const dailyChildTotal = row.childTotal || 0
        const dailyDriverTotal = row.driverTotal || 0
        const dailyExPaxCharge = row.exPaxPrice || 0
        const dailyChildCharge = row.childPrice || 0
        const dailyDriverCharge = row.driverPrice || 0
        const dailyExPaxTax = row.exPaxTax || 0
        const dailyChildTax = row.childTax || 0
        const dailyDriverTax = row.driverTax || 0

        totalRoomChargesForAgent += row.rate * row.nights
        totalExtraChargesForAgent += (dailyExPaxTotal + dailyChildTotal + dailyDriverTotal) * row.nights

        const detailPayload: DetailPayload = {
          hotelid: hotelId,
          checkin_id: checkinId,
          room_id: row.roomId,
          room_number: row.roomNumber,
          room_category_id: categoryId,
          room_category_name: row.type,
          converted_category_id: row.convertedCategoryId ?? undefined,
          converted_category_name: row.convertedCategoryName || '',
          checkin_datetime: firstDayCheckinDateTime,
          checkout_datetime: firstDayCheckoutDateTime,
          no_of_days: 1,
          adults: row.adults,
          pax: row.pax,
          ex_pax: row.exPax,
          child_unpaid: row.childUnpaid,
          driver: row.driver,
          room_tariff: row.rate,
          ex_pax_charge: dailyExPaxCharge,
          child_paid_amount: dailyChildCharge,
          driver_charge: dailyDriverCharge,
          discount_percent: row.discount,
          discount_amount: (row.rate * (row.discount || 0)) / 100,
          cgst_percent: row.cgstPercent || 0,
          cgst_amount: dailyCgstAmount,
          sgst_percent: row.sgstPercent || 0,
          sgst_amount: dailySgstAmount,
          igst_percent: row.igstPercent || 0,
          igst_amount: dailyIgstAmount,
          cess_percent: row.cessPercent || 0,
          cess_amount: dailyCessAmount,
          service_charge: 0,
          service_charge_amount: 0,
          parent_detail_id: undefined,
          is_checkout: 0,
          merged: 0,
          tax: dailyTotalTax,
        }
        allDetailPayloads.push(detailPayload)

        const perDayTotalAmount = (row.totalAmount || 0) / totalNights

        const chargesPayload = {
          guest_id: guestId,
          room_id: row.roomId,
          category_id: categoryId,
          checkin_id: checkinId,
          pax_count: row.pax,
          pax_price: row.rate,
          pax_tax: dailyTotalTax,
          ex_pax_count: row.exPax,
          ex_pax_price: dailyExPaxCharge,
          ex_pax_tax: dailyExPaxTax,
          ex_pax_tax_percent: row.exPaxTaxPercent,
          ex_pax_total: dailyExPaxTotal,
          child_count: row.childPaid,
          child_price: dailyChildCharge,
          child_tax: dailyChildTax,
          child_tax_percent: row.childTaxPercent,
          child_total: dailyChildTotal,
          driver_count: row.driver,
          driver_price: dailyDriverCharge,
          driver_tax: dailyDriverTax,
          driver_tax_percent: row.driverTaxPercent,
          driver_total: dailyDriverTotal,
          total_amount: perDayTotalAmount,
          checkin_datetime: firstDayCheckinDateTime,
          checkout_datetime: firstDayCheckoutDateTime,
        }
        allChargePayloads.push(chargesPayload)
      }

      // Capture detail IDs so folio entries can reference the first detail record
      let firstDetailId: number | null = null

      if (allDetailPayloads.length > 0) {
        console.log(`Creating ${allDetailPayloads.length} detail record(s) for FIRST DAY only`)
        const detailResult = await DetailService.createBulk({ details: allDetailPayloads })
        console.log('Detail records created successfully:', detailResult)

        // Extract the first inserted detail_id from whatever shape the API returns.
        // Possible shapes:
        // 1) { success, data: [ { detail_id, ... } ] }
        // 2) { data: [ { detail_id } ] }
        // 3) { data: { detail_id } } or { insertedDetails: [...] }
        const extractedFirstDetailId = (() => {
          const d: any = detailResult as any

          const candidates: any[] = []

          if (Array.isArray(d?.data)) candidates.push(...d.data)
          if (Array.isArray(d?.insertedDetails)) candidates.push(...d.insertedDetails)
          if (Array.isArray(d?.details)) candidates.push(...d.details)

          if (candidates.length > 0) {
            const first = candidates[0]
            return first?.detail_id ?? first?.detailId ?? null
          }

          // If data is an object instead of array
          if (d?.data && typeof d.data === 'object') {
            return d.data?.detail_id ?? d.data?.detailId ?? null
          }

          return null
        })()

        firstDetailId = extractedFirstDetailId ?? null
        console.log('✅ firstDetailId used for folio:', firstDetailId)

        if (!firstDetailId) {
          console.warn(
            '⚠️ Could not determine firstDetailId from createBulk response. Folio will be inserted with detail_id = null. '
            + 'Check backend DetailService.createBulk response shape.',
            detailResult,
          )
        }
      }


      if (allChargePayloads.length > 0) {
        console.log(`Creating ${allChargePayloads.length} charge record(s) for FIRST DAY only`)
        await GuestRoomChargesService.createBulk({ charges: allChargePayloads })
      }

      // Helper: MySQL-compatible datetime string for NOW
      const nowMysql = (): string => {
        const n = new Date()
        return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')} ${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}:${String(n.getSeconds()).padStart(2, '0')}`
      }

      const folioPayload: GuestFolioPayload = {
        checkin_id: checkinId,
        hotel_id: hotelId,
        detail_id: firstDetailId,          // ✅ now correctly set from bulk insert result
        transaction_type: 'Room Charges',
        transaction_datetime: nowMysql(),
        description: `Room charges for Day 1 of ${totalNights} night(s) from ${firstRow.arrivalDate} to ${firstRow.departureDate}`,
        debit_amount: firstDayTotalAmount,
        credit_amount: 0,
        reference_number: `CHK-${checkinId}`,
        payment_method: values.paymentMethod || 'Cash',
      }
      await GuestFolioService.create(folioPayload)

      if (values.receivedAmount && Number(values.receivedAmount) > 0) {
        const paymentFolioPayload: GuestFolioPayload = {
          checkin_id: checkinId,
          hotel_id: hotelId,
          detail_id: firstDetailId,        // ✅ now correctly set from bulk insert result
          transaction_type: 'Payment',
          transaction_datetime: nowMysql(),
          description: 'Payment received',
          debit_amount: 0,
          credit_amount: Number(values.receivedAmount),
          reference_number: '',
          payment_method: values.paymentMethod || 'Cash',
        }
        await GuestFolioService.create(paymentFolioPayload)
      }

      const isTravelAgentSelected = values.travelAgentId && values.travelAgentId > 0
      
      if (isTravelAgentSelected) {
        console.log('Travel agent selected, creating agent_room_checkin record...')
        
        for (const row of rows) {
          const roomTotalAmount = rows.reduce((sum, r) => sum + safeNumber(r.totalAmount), 0)
          
          const agentPayload = prepareAgentRoomCheckinPayload(
            checkinId,
            finalRegNo,
            guestId,
            row,
            values,
            roomTotalAmount,
            totalRoomChargesForAgent,
            totalExtraChargesForAgent
          )
          
          console.log('Agent Room Checkin Payload:', agentPayload)
          
          try {
            const agentResult = await AgentRoomCheckinService.create(agentPayload)
            console.log(`Agent room checkin created for room ${row.roomNumber}:`, agentResult)
          } catch (agentError) {
            console.error('Failed to create agent room checkin record:', agentError)
            toast.error(`Warning: Agent record for room ${row.roomNumber} could not be saved`)
          }
        }
      } else {
        console.log('No travel agent selected, skipping agent_room_checkin record creation')
      }

      const totalGuestCount = totalAdults + totalChildPaid + totalChildUnpaid
      
      for (const row of rows) {
        try {
          const assignedItems = await autoAssignAmenities(checkinId, row.roomId, totalGuestCount)
          if (assignedItems && assignedItems.length > 0) {
            console.log(`✅ Auto-assigned amenities to room ${row.roomNumber}:`, assignedItems)
          }
        } catch (err) {
          console.error(`Failed to auto-assign amenities for room ${row.roomNumber}:`, err)
        }
      }
    }

    toast.success(`Checked in ${roomRows.length} room(s) for ${roomRows[0]?.nights || 1} day(s) successfully`)
    navigate(-1)
  } catch (error: any) {
    console.error('Check-in submission failed:', error)
    toast.error(error.response?.data?.message || 'Check-in failed')
  } finally {
    setSubmitting(false)
  }
},
  })

  const { handleSubmit, setFieldValue, values } = formik

  useEffect(() => {
    const { arrivalDate, arrivalTime, nights } = values
    if (arrivalDate && nights && nights > 0) {
      const arrival = new Date(arrivalDate)
      const departure = new Date(arrival)
      departure.setDate(departure.getDate() + Number(nights))
      const departureDateStr = departure.toISOString().split('T')[0]
      if (values.departureDate !== departureDateStr) {
        setFieldValue('departureDate', departureDateStr)
      }
    }
    if (arrivalTime) {
      if (values.departureTime !== arrivalTime) {
        setFieldValue('departureTime', arrivalTime)
      }
    }
  }, [values.arrivalDate, values.arrivalTime, values.nights, setFieldValue])

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
      const baseAmount      = safeNumber(row.rate) * safeNumber(row.nights)
      const discountAmt     = safeNumber(row.discountAmt)
      const afterDiscount   = round2(baseAmount - discountAmt)

      totalRate      += afterDiscount
      totalTax       += safeNumber(row.taxAmount)
      totalExtra     += (safeNumber(row.exPaxTotal) * safeNumber(row.nights)) + 
                        (safeNumber(row.childTotal) * safeNumber(row.nights)) + 
                        (safeNumber(row.driverTotal) * safeNumber(row.nights))
      totalBaseExtra += (safeNumber(row.exPaxPrice) * safeNumber(row.nights)) + 
                        (safeNumber(row.childPrice) * safeNumber(row.nights)) + 
                        (safeNumber(row.driverPrice) * safeNumber(row.nights))

      totalSGST += safeNumber(row.sgstAmount)
      totalCGST += safeNumber(row.cgstAmount)

      const extraTax    = (safeNumber(row.exPaxTax) * safeNumber(row.nights)) + 
                          (safeNumber(row.childTax) * safeNumber(row.nights)) + 
                          (safeNumber(row.driverTax) * safeNumber(row.nights))
      const halfExtraTax = extraTax / 2
      totalSGST += halfExtraTax
      totalCGST += halfExtraTax

      totalAmt += safeNumber(row.totalAmount)
    })

    const billAmount      = round2(totalRate + totalTax)
    const otherCharges    = round2(totalExtra)
    const billAPlusOtherC = round2(billAmount + otherCharges)
    const taxableAmt      = round2(totalRate + totalBaseExtra)

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

  const countryOptions: Option[] = countries.map((c) => ({
    label: String(c.name),
    value: c.id,
  }))
  const stateOptions: Option[] = states.map((s) => ({ label: String(s.name), value: s.id }))
  const cityOptions: Option[] = cities.map((c) => ({ label: String(c.name), value: c.id }))
  const idTypeOptions: Option[] = documentTypes.map((dt) => ({
    label: dt.name,
    value: dt.id,
  }))
  const categoryOptions: Option[] = roomCategories.map((c) => ({
    label: String(c.category_name),
    value: c.room_category_id,
  }))

  const roomOptions = useMemo(() => {
    let options = initialSelectedRooms
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

  const handleAddOrUpdateRow = () => {
    if (!values.guestId) {
      toast.error('Please select a guest first')
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
    const cgstPercent  = safeNumber(taxDetails?.hotel_cgst)
    const sgstPercent  = safeNumber(taxDetails?.hotel_sgst)
    const igstPercent  = safeNumber(taxDetails?.hotel_igst)
    const cessPercent  = safeNumber(taxDetails?.hotel_cess)

    const rate         = safeNumber(values.roomCharges) || safeNumber(selectedRoomTariff)
    const nights       = safeNumber(values.nights) || 1
    const baseAmount   = round2(rate * nights)

    const discountPercent = safeNumber(values.discount)
    const discountAmt     = round2((baseAmount * discountPercent) / 100)
    const afterDiscount   = round2(baseAmount - discountAmt)

    const taxPercent = cgstPercent + sgstPercent + igstPercent + cessPercent
    const taxAmount  = round2((afterDiscount * taxPercent) / 100)

    const cgstAmount = round2((afterDiscount * cgstPercent) / 100)
    const sgstAmount = round2((afterDiscount * sgstPercent) / 100)

    const extraDaily = computeExtraCharges(
      effectiveCategoryId,
      {
        exPax:     safeNumber(values.exPax),
        childPaid: safeNumber(values.childrenPaid),
        driver:    safeNumber(values.driver),
      },
      nights,
    )

    const extraChargesTotal = round2(
      (extraDaily.exPaxTotal * nights) + (extraDaily.childTotal * nights) + (extraDaily.driverTotal * nights),
    )

    const totalAmount = round2(afterDiscount + taxAmount + extraChargesTotal)

    const guestName = [values.firstName, values.lastName].filter(Boolean).join(' ').trim() || values.firstName || ''

    const rowFields = {
      guestId:               values.guestId!,
      guestName,
      roomCategoryId:        selectedCategoryId,
      type:                  selectedCategoryName,
      convertedCategoryId:   convertedCategoryId || null,
      convertedCategoryName: convertedCategory?.category_name || '',
      driver:                safeNumber(values.driver),
      childUnpaid:           safeNumber(values.childrenUnpaid),
      childPaid:             safeNumber(values.childrenPaid),
      arrivalDate:           values.arrivalDate,
      arrivalTime:           values.arrivalTime,
      departureDate:         values.departureDate,
      departureTime:         values.departureTime,
      nights,
      rate,
      discount:              discountPercent,
      discountAmt,
      taxPercent,
      taxAmount,
      pax:                   safeNumber(values.pax),
      exPax:                 safeNumber(values.exPax),
      adults:                safeNumber(values.adults),
      taxTypeId:             taxTypeId ? Number(taxTypeId) : undefined,
      cgstPercent,
      sgstPercent,
      igstPercent,
      cessPercent,
      exPaxPrice:            extraDaily.exPaxPrice,
      exPaxTax:              extraDaily.exPaxTax,
      exPaxTaxPercent:       extraDaily.exPaxTaxPercent,
      exPaxTotal:            extraDaily.exPaxTotal,
      childPrice:            extraDaily.childPrice,
      childTax:              extraDaily.childTax,
      childTaxPercent:       extraDaily.childTaxPercent,
      childTotal:            extraDaily.childTotal,
      driverPrice:           extraDaily.driverPrice,
      driverTax:             extraDaily.driverTax,
      driverTaxPercent:      extraDaily.driverTaxPercent,
      driverTotal:           extraDaily.driverTotal,
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
        id:         `${selectedRoomId}-${Date.now()}`,
        roomId:     selectedRoomId,
        roomNumber: selectedRoom.roomNumber,
        ...rowFields,
      }
      setRoomRows([...roomRows, newRow])
      setSelectedRowId(null)
      setRoomChargeEditable(false)
      toast.success('Room added')
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

  return (
    <FormikProvider value={formik}>
      <style>{`
        .fs-small { font-size: 0.7rem; }
        .table-sm-compact th, .table-sm-compact td {
          padding: 0.1rem 0.1rem;
          font-size: 0.65rem;
          white-space: nowrap;
        }
        .bg-danger-custom { background-color: #009de0 !important; }
        input.form-control-sm, select.form-select-sm{
          height: 28px !important;
          min-height: 28px !important;
          padding: 0 6px !important;
          font-size: 0.7rem !important;
        }
        .react-select__control {
          min-height: 24px !important;
          font-size: 0.7rem !important;
        }
        .react-select__valueContainer { padding: 0 4px !important; }
        .react-select__indicators { height: 24px !important; }
        input, select, textarea, .form-control, .form-select {
          font-size: 0.7rem !important;
        }
        .rate-field-group {
          min-width: 85px;
          padding: 0 0.15rem;
        }
        .rate-field-group .form-label {
          font-size: 0.65rem;
          margin-bottom: 0;
          white-space: nowrap;
        }
        .card-body.p-2 { padding: 0.5rem !important; }
        .row.g-1 > [class*="col-"] {
          padding-top: 0;
          padding-bottom: 0;
        }
        .mb-1 { margin-bottom: 0.2rem !important; }
        .mt-1 { margin-top: 0.2rem !important; }
        .border rounded { border-width: 1px; }
        input.form-control-sm, select.form-select-sm {
          height: calc(1.4em + 0.2rem + 2px);
          padding: 0.1rem 0.2rem;
        }
        .scrollable-table {
          height: 128px;
          overflow-x: auto;
          overflow-y: auto;
          border: 1px solid #dee2e6;
        }
        .scrollable-table table {
          margin-bottom: 0;
          min-width: 1700px;
        }
        .scrollable-table::-webkit-scrollbar {
          height: 4px;
          width: 5px;
        }
        .scrollable-table::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .scrollable-table::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 3px;
        }
        .scrollable-table::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        .input-24 {
          height: 24px !important;
          min-height: 24px !important;
          padding: 2px 4px !important;
          font-size: 12px !important;
          padding-bottom: 2px !important;
        }
        .input-24.form-control { height: 24px !important; }
        .row-compact { margin-bottom: 7px !important; }
        .table-sm-compact th, .table-sm-compact td {
          padding: 2px 6px !important;
          font-size: 11px !important;
          vertical-align: middle;
        }
        .table-sm-compact tbody tr { height: 24px; }
        .input-compact {
          height: 24px !important;
          padding: 2px 6px !important;
          font-size: 12px !important;
        }
        .row-compact { margin-bottom: 4px !important; }
        .clickable-row { cursor: pointer; }
        .clickable-row:hover { background-color: #f5f5f5; }
        .summary-row {
          background-color: #f8f9fa;
          border-top: 2px solid #dee2e6;
          font-weight: 500;
          padding: 4px 8px;
          font-size: 0.75rem;
        }
        .room-charge-container {
          position: relative;
          width: 100%;
        }
        .room-charge-checkbox {
          position: absolute;
          right: 5px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 10;
          display: flex;
          align-items: center;
          background: white;
          padding-left: 5px;
          border-left: 1px solid #ced4da;
          height: 20px;
        }
        .room-charge-checkbox input {
          width: 16px;
          height: 16px;
          cursor: pointer;
          margin: 0;
        }
        .room-charge-checkbox input:focus {
          outline: none;
          box-shadow: none;
        }
        .room-charge-input {
          padding-right: 30px !important;
        }
        .reservation-detail-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.75rem;
        }
        .reservation-detail-table th,
        .reservation-detail-table td {
          border: 1px solid #dee2e6;
          padding: 0.5rem;
          text-align: left;
        }
        .reservation-detail-table th {
          background-color: #95efff;
          font-weight: 600;
        }
        body.dark-mode .reservation-detail-table th {
          background-color: #2c2c2c;
          color: #eee;
        }
        body.dark-mode .reservation-detail-table td {
          border-color: #444;
        }
      `}</style>

      <div className="vh-100 d-flex flex-column overflow-hidden">
        <div className="d-flex align-items-center">
          <span className="d-flex align-items-center me-3">
            <span className="fw-semibold fs-medium me-1">Reg No:</span>
            <span className="badge bg-info fs-small">{regNo}</span>
          </span>
          <span className="d-flex align-items-center">
            <h6 className="mb-0 fw-semibold fs-medium me-1">Selected Rooms:</h6>
            {initialSelectedRooms.length > 0 && (
              <span className="badge bg-primary fs-small">
                {initialSelectedRooms.map((r) => r.roomNumber).join(', ')}
              </span>
            )}
          </span>
        </div>

        <Card className="flex-grow-1 border-0">
          <Card.Body className="p-2 overflow-y-auto overflow-x-hidden">
            <form id="checkin-form" onSubmit={handleSubmit}>
              <Row className="g-2 mb-2">
                <Col md={4}>
                  <div className="border p-1 bg-light">
                    <div className="bg-danger-custom text-white d-flex align-items-center justify-content-between px-2 py-1 mb-1">
                      <span className="fs-small fw-bold"> Guest Information</span>
                    </div>
                    <Row className="align-items-center g-1 mb-1">
                      <Col md="auto" className="fs-small" style={{ width: '89px' }}>
                        Name
                      </Col>
                      <Col md="auto" style={{ width: '60px' }}>
                        <FormikTextInput
                          name="title"
                          placeholder="Title"
                          size="sm"
                          className="w-100 fs-small"
                        />
                      </Col>
                      <Col md="auto" style={{ width: '225px' }}>
                        <Select
                          options={guestOptions}
                          isLoading={loadingGuests}
                          className="w-100 fs-small"
                          styles={selectStyles}
                          value={guestOptions.find((o) => o.value === values.guestId) || null}
                          onChange={(opt) => {
                            if (opt?.value) {
                              const guestId = Number(opt.value)
                              setFieldValue('guestId', guestId)
                              loadGuestDetails(guestId)
                            } else {
                              setFieldValue('guestId', null)
                              setFieldValue('fragment_id', null)
                              setFieldValue('title', 'MR')
                              setFieldValue('firstName', '')
                              setFieldValue('lastName', '')
                              setFieldValue('phone1', '')
                              setFieldValue('phone2', '')
                              setFieldValue('email', '')
                              setFieldValue('address', '')
                              setFieldValue('countryId', null)
                              setFieldValue('stateId', null)
                              setFieldValue('cityId', null)
                              setFieldValue('idType', '')
                              setFieldValue('idNumber', '')
                              setFieldValue('otherInfo', '')
                              setFieldValue('companyId', null)
                              setFieldValue('gst', '')
                              setGuestDocuments([])
                            }
                          }}
                          onInputChange={(inputValue, { action }) => {
                            if (action === 'input-change') {
                              handleGuestSearch(inputValue)
                            }
                          }}
                          onMenuOpen={() => {
                            if (!guestOptions.length) {
                              loadAllGuests()
                            }
                          }}
                          placeholder="Search Guest Name"
                          isClearable
                        />
                      </Col>
                      <Col md={1}>
                        <button
                          type="button"
                          className="btn btn-success btn-sm w-100 p-0"
                          style={{ height: '29px' }}
                          onClick={() => setShowGuestModal(true)}>
                          +
                        </button>
                      </Col>
                    </Row>

                    <Row className="align-items-center g-1 mb-1">
                      <Col md="auto" className="fs-small" style={{ width: '89px' }}>
                        Mobile
                      </Col>
                      <Col md="auto" style={{ width: '159px' }}>
                        <FormikTextInput
                          name="phone1"
                          placeholder="Mobile 1"
                          size="sm"
                          className="w-100 fs-small"
                          readOnly
                        />
                      </Col>
                      <Col md="auto" style={{ width: '159px' }}>
                        <FormikTextInput
                          name="phone2"
                          placeholder="Mobile 2"
                          size="sm"
                          className="w-100 fs-small"
                          readOnly
                        />
                      </Col>
                    </Row>

                    <Row className="align-items-center g-1 mb-1">
                      <Col md="auto" className="fs-small" style={{ width: '89px' }}>
                        Email
                      </Col>
                      <Col md="auto" style={{ width: '318px' }}>
                        <FormikTextInput
                          name="email"
                          placeholder="Email"
                          size="sm"
                          className="w-100 fs-small"
                          readOnly
                        />
                      </Col>
                    </Row>

                    <Row className="align-items-center g-1 mb-1">
                      <Col md="auto" className="fs-small" style={{ width: '89px' }}>
                        Address
                      </Col>
                      <Col md="auto" style={{ width: '318px' }}>
                        <FormikTextInput
                          name="address"
                          as="textarea"
                          placeholder="Enter Address"
                          rows={2}
                          className="w-100 fs-small"
                          readOnly
                        />
                      </Col>
                    </Row>

                    <Row className="align-items-center g-1 mb-1">
                      <Col md="auto" className="fs-small" style={{ width: '89px' }}>
                        Country
                      </Col>
                      <Col md="auto" style={{ width: '318px' }}>
                        <FormSelect
                          name="countryId"
                          options={countryOptions}
                          size="sm"
                          className="w-100 fs-small"
                          isLoading={loadingCountries}
                          onChange={(v) => setFieldValue('countryId', v)}
                          placeholder="Select Country"
                          disabled
                        />
                      </Col>
                    </Row>

                    <Row className="align-items-center g-1 mb-1">
                      <Col md="auto" className="fs-small" style={{ width: '89px' }}>
                        State
                      </Col>
                      <Col md="auto" style={{ width: '318px' }}>
                        <FormSelect
                          name="stateId"
                          options={stateOptions}
                          size="sm"
                          className="w-100 fs-small"
                          isLoading={loadingStates}
                          onChange={(v) => setFieldValue('stateId', v)}
                          placeholder="Select State"
                          disabled
                        />
                      </Col>
                    </Row>

                    <Row className="align-items-center g-1 mb-1">
                      <Col md="auto" className="fs-small" style={{ width: '89px' }}>
                        City
                      </Col>
                      <Col md="auto" style={{ width: '318px' }}>
                        <FormSelect
                          name="cityId"
                          options={cityOptions}
                          size="sm"
                          className="w-100 fs-small"
                          isLoading={loadingCities}
                          onChange={(v) => setFieldValue('cityId', v)}
                          placeholder="Select City"
                          disabled
                        />
                      </Col>
                    </Row>

                    <div>
                      <div className="d-flex align-items-center my-2">
                        <div style={{ flex: 1, borderTop: '1px solid #999' }}></div>
                        <span
                          style={{
                            padding: '0 8px',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            whiteSpace: 'nowrap',
                          }}>
                          Identity Information
                        </span>
                        <div style={{ flex: 1, borderTop: '1px solid #999' }}></div>
                      </div>

                      <Row className="align-items-center g-1 mb-1">
                        <Col md="auto" className="fs-small" style={{ width: '89px' }}>
                          ID Type
                        </Col>
                        <Col md="auto" style={{ width: '318px' }}>
                          <FormSelect
                            name="idType"
                            options={idTypeOptions}
                            size="sm"
                            className="w-100 fs-small"
                            isLoading={loadingDocTypes}
                            onChange={(v) => setFieldValue('idType', v)}
                            placeholder="Select ID Type"
                            disabled
                          />
                        </Col>
                      </Row>
                      <Row className="align-items-center g-1 mb-0">
                        <Col md="auto" className="fs-small" style={{ width: '89px' }}>
                          ID No
                        </Col>
                        <Col md="auto" style={{ width: '318px' }}>
                          <FormikTextInput
                            name="idNumber"
                            placeholder="Enter ID Number"
                            size="sm"
                            className="w-100 fs-small"
                            readOnly
                          />
                        </Col>
                      </Row>
                    </div>

                    <div>
                      <div className="d-flex align-items-center my-2">
                        <div style={{ flex: 1, borderTop: '1px solid #999' }}></div>
                        <BootstrapForm.Label
                          className="fw-bold mb-0 fs-small"
                          style={{ padding: '0 8px', whiteSpace: 'nowrap' }}>
                          Other Information
                        </BootstrapForm.Label>
                        <div style={{ flex: 1, borderTop: '1px solid #999' }}></div>
                      </div>

                      <Row className="align-items-center row-compact">
                        <Col md="auto" className="fs-small" style={{ width: '89px' }}>
                          Agent Name
                        </Col>
                        <Col md="auto" style={{ width: '337px' }}>
                          <Select
                            options={travelAgentOptions}
                            isLoading={loadingTravelAgents}
                            className="fs-small"
                            styles={selectStyles}
                            defaultValue={travelAgentOptions[0]}
                            value={
                              values.travelAgentId
                                ? travelAgentOptions.find((o) => o.value === String(values.travelAgentId)) || null
                                : values.travelAgent === SELF_AGENT_VALUE || (!values.travelAgentId && !values.travelAgent)
                                  ? travelAgentOptions[0]
                                  : null
                            }
                            onChange={(opt) => {
                              if (!opt || opt.value === SELF_AGENT_VALUE) {
                                // Self selected — clear agent fields
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
                        </Col>
                      </Row>

                      <Row className="align-items-center g-1 mb-1">
                        <Col md="auto" className="fs-small" style={{ width: '89px' }}>
                          Company
                        </Col>
                        <Col md="auto" style={{ width: '284px' }}>
                          <Select
                            options={companyOptions}
                            isLoading={loadingCompanies}
                            className="w-100"
                            styles={selectStyles}
                            value={companyOptions.find((o) => o.value === values.companyId) || null}
                            onChange={(opt) => setFieldValue('companyId', opt?.value ?? null)}
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
                          />
                        </Col>
                        <Col md={1}>
                          <button
                            type="button"
                            className="btn btn-success btn-sm w-100 p-0"
                            style={{ height: '29px' }}
                            onClick={() => setShowCompanyModal(true)}>
                            +
                          </button>
                        </Col>
                      </Row>
                      <Row className="align-items-center g-1 mb-1">
                        <Col md="auto" className="fs-small" style={{ width: '89px' }}>
                          GST No
                        </Col>
                        <Col md="auto" style={{ width: '318px' }}>
                          <FormikTextInput
                            name="gst"
                            placeholder="GST TIN"
                            size="sm"
                            className="w-100 fs-small"
                            readOnly
                          />
                        </Col>
                      </Row>
                      <Row className="align-items-center g-1 mb-1">
                        <Col md="auto" className="fs-small" style={{ width: '89px' }}>
                          Group
                        </Col>
                        <Col md="auto" style={{ width: '318px' }}>
                          <FormikTextInput
                            name="groupName"
                            placeholder="Group Name"
                            size="sm"
                            className="w-100 fs-small"
                            readOnly
                          />
                        </Col>
                      </Row>
                      <Row className="align-items-center g-1 mb-2">
                        <Col md="auto" className="fs-small" style={{ width: '89px' }}>
                          Booking Type
                        </Col>
                        <Col md="auto" style={{ width: '318px' }}>
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
                        </Col>
                      </Row>
                    </div>
                  </div>
                </Col>

                <Col md={8}>
                  <Row className="g-2 ">
                    <Col md={8}>
                      <div className="border rounded p-1 bg-light">
                        <div className="bg-danger-custom text-white d-flex align-items-center justify-content-between px-2 py-1 mb-1">
                          <span className="fs-small fw-bold">Stay Information</span>
                        </div>

                        <Row className="g-2 mb-1">
                          <Col md={1} style={{ minWidth: '100px' }}>
                            <label className="fs-small mb-1">Room No</label>
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
                            />
                          </Col>

                          <Col md={1} style={{ minWidth: '140px' }}>
                            <label className="fs-small mb-1">
                              Type
                              {values.roomNo && selectedCategoryName && (
                                <span
                                  className="ms-1 badge"
                                  style={{
                                    backgroundColor: '#009de0',
                                    color: '#fff',
                                    fontSize: '0.6rem',
                                    padding: '1px 5px',
                                    borderRadius: '8px',
                                    verticalAlign: 'middle',
                                  }}>
                                  {selectedCategoryName}
                                </span>
                              )}
                            </label>
                            <Select
                              name="roomType"
                              options={categoryOptions}
                              isLoading={loadingCategories}
                              className="fs-small"
                              styles={selectStyles}
                              isDisabled={true}
                              value={
                                categoryOptions.find((o) => o.value === values.roomType) || null
                              }
                              onChange={async (opt) => {
                                const catId = opt?.value ?? null
                                setFieldValue('roomType', catId)
                                await handleRoomTypeChange(catId as number | null)
                              }}
                              placeholder="Select Type"
                              isClearable
                            />
                          </Col>

                          <Col md={1} style={{ minWidth: '140px' }}>
                            <label className="fs-small mb-1">Converted Category</label>
                            <Select
                              name="convertedCategoryId"
                              options={categoryOptions}
                              isLoading={loadingCategories}
                              className="fs-small"
                              styles={selectStyles}
                              isDisabled={!values.roomNo}
                              value={
                                categoryOptions.find(
                                  (o) => o.value === values.convertedCategoryId,
                                ) || null
                              }
                              onChange={(opt) => {
                                const catId = opt?.value as number | null
                                handleConvertedCategoryChange(catId)
                              }}
                              placeholder="Optional"
                              isClearable
                            />
                          </Col>

                          <Col md={1} style={{ minWidth: '110px' }}>
                            <label className="fs-small mb-1">Room Charges</label>
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
                                  onChange={(e) => setRoomChargeEditable(e.target.checked)}
                                  title={
                                    roomChargeEditable
                                      ? 'Lock room charge'
                                      : 'Unlock to edit room charge'
                                  }
                                />
                              </div>
                            </div>
                          </Col>

                          <Col md={1} style={{ minWidth: '65px' }}>
                            <label className="fs-small mb-1">Plan</label>
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
                          <Col md={3}>
                            <label className="fs-small mb-1">Arrival Date</label>
                            <FormikTextInput
                              name="arrivalDate"
                              type="date"
                              size="sm"
                              className="w-100 fs-small"
                            />
                          </Col>
                          <Col md={2}>
                            <label className="fs-small mb-1">Time</label>
                            <FormikTextInput
                              name="arrivalTime"
                              type="time"
                              size="sm"
                              className="w-100 fs-small"
                            />
                          </Col>
                          <Col md={2}>
                            <label className="fs-small mb-1">Days</label>
                            <FormikTextInput
                              name="nights"
                              type="number"
                              size="sm"
                              className="w-100 fs-small"
                            />
                          </Col>
                          <Col md={3}>
                            <label className="fs-small mb-1">Departure Date</label>
                            <FormikTextInput
                              name="departureDate"
                              type="date"
                              size="sm"
                              className="w-100 fs-small"
                            />
                          </Col>
                          <Col md={2}>
                            <label className="fs-small mb-1">Time</label>
                            <FormikTextInput
                              name="departureTime"
                              type="time"
                              size="sm"
                              className="w-100 fs-small"
                            />
                          </Col>
                        </Row>

                        <Row className="g-2 mb-1 align-items-end">
                          <Col md="auto" style={{ width: '110px' }}>
                            <label className="fs-small mb-1 fw-bold text-primary d-block">
                              👤 Adults
                            </label>
                            <div
                              className="d-flex align-items-center border border-primary rounded overflow-hidden"
                              style={{ height: '28px' }}>
                              <button
                                type="button"
                                onClick={() =>
                                  setFieldValue('adults', Math.max(0, (values.adults || 0) - 1))
                                }
                                style={{
                                  width: '26px',
                                  height: '28px',
                                  border: 'none',
                                  background: '#e7f3ff',
                                  color: '#0d6efd',
                                  fontWeight: 'bold',
                                  fontSize: '16px',
                                  cursor: 'pointer',
                                  lineHeight: 1,
                                  flexShrink: 0,
                                }}>
                                −
                              </button>
                              <input
                                type="number"
                                value={values.adults || 0}
                                min={0}
                                onChange={(e) =>
                                  setFieldValue('adults', Math.max(0, Number(e.target.value)))
                                }
                                style={{
                                  width: '45px',
                                  height: '28px',
                                  border: 'none',
                                  textAlign: 'center',
                                  fontWeight: 'bold',
                                  fontSize: '13px',
                                  background: '#f8f9fa',
                                  outline: 'none',
                                  MozAppearance: 'textfield',
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => setFieldValue('adults', (values.adults || 0) + 1)}
                                style={{
                                  width: '26px',
                                  height: '28px',
                                  border: 'none',
                                  background: '#e7f3ff',
                                  color: '#0d6efd',
                                  fontWeight: 'bold',
                                  fontSize: '16px',
                                  cursor: 'pointer',
                                  lineHeight: 1,
                                  flexShrink: 0,
                                }}>
                                +
                              </button>
                            </div>
                          </Col>

                          <Col md="auto" style={{ width: '70px' }}>
                            <label className="fs-small mb-1 d-block" style={{ color: '#198754' }}>
                              Pax
                              {selectedRoomCategoryPax > 0 && (
                                <span
                                  className="ms-1"
                                  style={{ fontSize: '0.55rem', color: '#888' }}>
                                  (auto)
                                </span>
                              )}
                            </label>
                            <div
                              className="d-flex align-items-center justify-content-center border rounded"
                              style={{
                                height: '28px',
                                background: '#f0fff4',
                                borderColor: '#198754 !important',
                                border: '1px solid #198754',
                                borderRadius: '4px',
                              }}>
                              <span
                                style={{
                                  fontWeight: 'bold',
                                  fontSize: '14px',
                                  color: '#198754',
                                  minWidth: '25px',
                                  textAlign: 'center',
                                }}>
                                {values.pax || 0}
                              </span>
                            </div>
                          </Col>

                          <Col md="auto" style={{ width: '70px' }}>
                            <label className="fs-small mb-1 d-block" style={{ color: '#dc6500' }}>
                              Ex_Pax
                            </label>
                            <div
                              className="d-flex align-items-center justify-content-center border rounded"
                              style={{
                                height: '28px',
                                background: (values.exPax || 0) > 0 ? '#fff3e0' : '#f8f9fa',
                                border: `1px solid ${(values.exPax || 0) > 0 ? '#fd7e14' : '#ced4da'}`,
                                borderRadius: '4px',
                              }}>
                              <span
                                style={{
                                  fontWeight: 'bold',
                                  fontSize: '14px',
                                  color: (values.exPax || 0) > 0 ? '#dc6500' : '#aaa',
                                  minWidth: '25px',
                                  textAlign: 'center',
                                }}>
                                {values.exPax || 0}
                              </span>
                            </div>
                          </Col>

                          <Col md="auto" style={{ width: '65px' }}>
                            <label className="fs-small mb-1">Child Paid</label>
                            <FormikTextInput
                              name="childrenPaid"
                              size="sm"
                              type="number"
                              className="w-100 fs-small"
                              min={0}
                            />
                          </Col>
                          <Col md="auto" style={{ width: '65px' }}>
                            <label className="fs-small mb-1">C.Unpaid</label>
                            <FormikTextInput
                              name="childrenUnpaid"
                              size="sm"
                              type="number"
                              className="w-100 fs-small"
                              min={0}
                            />
                          </Col>
                          <Col md="auto" style={{ width: '60px' }}>
                            <label className="fs-small mb-1">Driver</label>
                            <FormikTextInput
                              name="driver"
                              type="number"
                              size="sm"
                              className="w-100 fs-small"
                              min={0}
                            />
                          </Col>
                          <Col
                            md={1}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-end',
                            }}>
                            <Button
                              size="sm"
                              variant="success"
                              onClick={handleAddOrUpdateRow}
                              style={{
                                width: '120%',
                                height: '27px',
                                padding: '1px',
                                fontSize: '10px',
                              }}>
                              {editingRowId ? 'Update' : 'Add'}
                            </Button>
                          </Col>
                        </Row>

                        <div className="scrollable-table mt-1">
                          <table
                            className="table table-bordered table-sm-compact mb-0"
                            style={{
                              borderColor: '#d1d1d1',
                              minWidth: '1700px',
                              whiteSpace: 'nowrap',
                            }}>
                            <thead className="bg-light">
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
                                  className="text-center clickable-row cursor-pointer"
                                  style={{
                                    backgroundColor: selectedRowId === row.id ? '#a6ffd5' : '',
                                    color: selectedRowId === row.id ? 'white' : '',
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
                                      size="sm"
                                      className="p-1 px-1"
                                      onClick={() => handleDeleteRow(row.id)}
                                      style={{ lineHeight: 1 }}>
                                      <i className="fi fi-rr-trash"></i>
                                    </Button>
                                   </td>
                                 </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div
                          className="position-relative h-100"
                          style={{ minHeight: '120px', paddingBottom: '220px' }}>
                          <div
                            className="border rounded p-2 bg-light position-absolute w-100"
                            style={{ bottom: 0, left: 0 }}>
                            <div className="d-flex align-items-center my-2">
                              <BootstrapForm.Label
                                className="fw-bold mb-0 fs-small"
                                style={{ paddingRight: '8px', whiteSpace: 'nowrap' }}>
                                Rate Information
                              </BootstrapForm.Label>
                              <div
                                style={{
                                  flex: 1,
                                  borderTop: '1px solid #999',
                                }}></div>
                            </div>

                            <Row className="align-items-center g-1 mb-1">
                              <Col md="auto" className="fs-small" style={{ width: '85px' }}>
                                Discount %
                              </Col>
                              <Col md="auto" style={{ width: '90px' }}>
                                <FormikTextInput
                                  name="discount"
                                  size="sm"
                                  type="number"
                                  className="w-100 fs-small"
                                />
                              </Col>
                              <Col md="auto" className="fs-small" style={{ width: '85px' }}>
                                Service
                              </Col>
                              <Col md="auto" style={{ width: '90px' }}>
                                <FormikTextInput
                                  name="roomService"
                                  size="sm"
                                  type="number"
                                  className="w-100 fs-small"
                                />
                              </Col>
                              <Col md="auto" className="fs-small" style={{ width: '85px' }}>
                                Taxable Amt
                              </Col>
                              <Col md="auto" style={{ width: '90px' }}>
                                <FormikTextInput
                                  name="taxableAmt"
                                  size="sm"
                                  type="number"
                                  className="w-100 fs-small"
                                />
                              </Col>
                            </Row>

                            <Row className="align-items-center g-1 mb-1">
                              <Col md="auto" className="fs-small" style={{ width: '85px' }}>
                                SGST Amt
                              </Col>
                              <Col md="auto" style={{ width: '90px' }}>
                                <FormikTextInput
                                  name="sgst"
                                  type="number"
                                  size="sm"
                                  className="w-100 fs-small"
                                />
                              </Col>
                              <Col md="auto" className="fs-small" style={{ width: '85px' }}>
                                CGST Amt
                              </Col>
                              <Col md="auto" style={{ width: '90px' }}>
                                <FormikTextInput
                                  name="cgst"
                                  type="number"
                                  size="sm"
                                  className="w-100 fs-small"
                                />
                              </Col>
                              <Col md="auto" className="fs-small" style={{ width: '85px' }}>
                                Round Off
                              </Col>
                              <Col md="auto" style={{ width: '90px' }}>
                                <FormikTextInput
                                  name="roundOff"
                                  size="sm"
                                  type="number"
                                  className="w-100 fs-small"
                                />
                              </Col>
                            </Row>

                            <Row className="align-items-center g-1 mb-1">
                              <Col md="auto" className="fs-small" style={{ width: '85px' }}>
                                Bill Amt
                              </Col>
                              <Col md="auto" style={{ width: '90px' }}>
                                <FormikTextInput
                                  name="billAmount"
                                  size="sm"
                                  type="number"
                                  className="w-100 fs-small fw-bold"
                                />
                              </Col>
                              <Col md="auto" className="fs-small" style={{ width: '85px' }}>
                                Other Charges
                              </Col>
                              <Col md="auto" style={{ width: '90px' }}>
                                <FormikTextInput
                                  name="otherCharges"
                                  type="number"
                                  size="sm"
                                  className="w-100 fs-small"
                                />
                              </Col>
                              <Col
                                md="auto"
                                className="fs-small text-danger"
                                style={{ width: '85px' }}>
                                Bill A + Other C
                              </Col>
                              <Col md="auto" style={{ width: '90px' }}>
                                <FormikTextInput
                                  name="billAPlusOtherC"
                                  type="number"
                                  size="sm"
                                  className="w-100 fs-small"
                                />
                              </Col>
                            </Row>

                            <Row className="align-items-center g-1 mb-1">
                              <Col md="auto" className="fs-small" style={{ width: '85px' }}>
                                Received Amt
                              </Col>
                              <Col md="auto" style={{ width: '90px' }}>
                                <FormikTextInput
                                  name="receivedAmount"
                                  size="sm"
                                  type="number"
                                  className="w-100 fs-small"
                                />
                              </Col>
                              <Col
                                md="auto"
                                className="fs-small text-danger"
                                style={{ width: '85px' }}>
                                Credit Transfer
                              </Col>
                              <Col md="auto" style={{ width: '90px' }}>
                                <FormikTextInput
                                  name="creditTransfer"
                                  size="sm"
                                  type="number"
                                  className="w-100 fs-small"
                                />
                              </Col>
                              <Col md="auto" className="fs-small" style={{ width: '85px' }}>
                                Sett. Disc
                              </Col>
                              <Col md="auto" style={{ width: '90px' }}>
                                <FormikTextInput
                                  name="settDisc"
                                  size="sm"
                                  type="number"
                                  className="w-100 fs-small"
                                  readOnly
                                />
                              </Col>
                            </Row>

                            <Row className="align-items-center g-2 mb-2">
                              <Col md="auto" className="fs-small" style={{ width: '85px' }}>
                                Pay Method
                              </Col>
                              <Col md="auto" style={{ width: '94px' }}>
                                <FormSelect
                                  name="paymentMethod"
                                  options={paymentMethodOptions}
                                  size="sm"
                                  className="w-100 fs-small"
                                  isLoading={loadingPaymentMethods}
                                  onChange={(v) => setFieldValue('paymentMethod', v)}
                                />
                              </Col>

                              <Col md="auto" className="fs-small fw-bold" style={{ width: '81px' }}>
                                Balance Amt
                              </Col>
                              <Col md="auto" style={{ width: '94px' }}>
                                <FormikTextInput
                                  name="balanceAmount"
                                  size="sm"
                                  type="number"
                                  className="w-100 fs-small fw-bold"
                                />
                              </Col>

                              <Col md="auto" className="fs-small fw-bold" style={{ width: '81px' }}>
                                Total Amt
                              </Col>
                              <Col md="auto" style={{ width: '94px' }}>
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
                      </div>
                    </Col>

                    <Col md={4}>
                      <div className="border rounded p-1 bg-light">
                        <div className="bg-danger-custom text-white d-flex align-items-center justify-content-between px-2 py-1 mb-1">
                          <span className="fs-small fw-bold">Travel Agent Information</span>
                        </div>
                        <Row className="align-items-center mb-1">
                          <Col md={12}>
                            <div className="d-flex align-items-center gap-4 fs-small">
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
                          </Col>
                        </Row>

                        <Row className="align-items-center row-compact pt-1">
                          <Col md={4} className="fs-small">
                            Booking ID
                          </Col>
                          <Col md={8}>
                            <FormikTextInput
                              name="bookingId"
                              type="number"
                              size="sm"
                              className="w-100 fs-small input-24"
                            />
                          </Col>
                        </Row>
                        <Row className="align-items-center row-compact pt-1">
                          <Col md={4} className="fs-small">
                            Booking Date
                          </Col>
                          <Col md={8}>
                            <FormikTextInput
                              name="bookingDate"
                              type="date"
                              size="sm"
                              className="w-100 fs-small input-24"
                            />
                          </Col>
                        </Row>
                        <Row className="align-items-center row-compact pt-1">
                          <Col md={4} className="fs-small">
                            Commission
                          </Col>
                          <Col md={8}>
                            <Row className="align-items-center g-1">
                              <Col md={5}>
                                <FormikTextInput
                                  name="agentAmountPer"
                                  type="number"
                                  size="sm"
                                  className="w-100 fs-small input-24"
                                  readOnly
                                />
                              </Col>
                              <Col md={1} className="text-center fs-small fw-bold">
                                %
                              </Col>
                              <Col md={6}>
                                <FormikTextInput
                                  name="agentAmount"
                                  type="number"
                                  size="sm"
                                  className="w-100 fs-small input-24"
                                  readOnly
                                />
                              </Col>
                            </Row>
                          </Col>
                        </Row>
                        <Row className="align-items-center row-compact pt-1">
                          <Col md={4} className="fs-small">
                            CGST
                          </Col>
                          <Col md={8}>
                            <Row className="align-items-center g-1">
                              <Col md={5}>
                                <FormikTextInput
                                  name="agentCgstPer"
                                  type="number"
                                  size="sm"
                                  className="w-100 fs-small input-24"
                                  readOnly
                                />
                              </Col>
                              <Col md={1} className="text-center fs-small fw-bold">
                                %
                              </Col>
                              <Col md={6}>
                                <FormikTextInput
                                  name="agentCgst"
                                  type="number"
                                  size="sm"
                                  className="w-100 fs-small input-24"
                                  readOnly
                                />
                              </Col>
                            </Row>
                          </Col>
                        </Row>
                        <Row className="align-items-center row-compact pt-1">
                          <Col md={4} className="fs-small">
                            SGST
                          </Col>
                          <Col md={8}>
                            <Row className="align-items-center g-1">
                              <Col md={5}>
                                <FormikTextInput
                                  name="agentSgstPer"
                                  type="number"
                                  size="sm"
                                  className="w-100 fs-small input-24"
                                  readOnly
                                />
                              </Col>
                              <Col md={1} className="text-center fs-small fw-bold">
                                %
                              </Col>
                              <Col md={6}>
                                <FormikTextInput
                                  name="agentSgst"
                                  type="number"
                                  size="sm"
                                  className="w-100 fs-small input-24"
                                  readOnly
                                />
                              </Col>
                            </Row>
                          </Col>
                        </Row>
                        <Row className="align-items-center row-compact pt-1">
                          <Col md={4} className="fs-small">
                            IGST
                          </Col>
                          <Col md={8}>
                            <Row className="align-items-center g-1">
                              <Col md={5}>
                                <FormikTextInput
                                  name="agentIgstPer"
                                  type="number"
                                  size="sm"
                                  className="w-100 fs-small input-24"
                                  readOnly
                                />
                              </Col>
                              <Col md={1} className="text-center fs-small fw-bold">
                                %
                              </Col>
                              <Col md={6}>
                                <FormikTextInput
                                  name="agentIgst"
                                  type="number"
                                  size="sm"
                                  className="w-100 fs-small input-24"
                                  readOnly
                                />
                              </Col>
                            </Row>
                          </Col>
                        </Row>
                        <Row className="align-items-center row-compact pt-1">
                          <Col md={4} className="fs-small">
                            CESS
                          </Col>
                          <Col md={8}>
                            <Row className="align-items-center g-1">
                              <Col md={5}>
                                <FormikTextInput
                                  name="agentCessPer"
                                  type="number"
                                  size="sm"
                                  className="w-100 fs-small input-24"
                                  readOnly
                                />
                              </Col>
                              <Col md={1} className="text-center fs-small fw-bold">
                                %
                              </Col>
                              <Col md={6}>
                                <FormikTextInput
                                  name="agentCess"
                                  type="number"
                                  size="sm"
                                  className="w-100 fs-small input-24"
                                  readOnly
                                />
                              </Col>
                            </Row>
                          </Col>
                        </Row>
                        <Row className="align-items-center row-compact pt-1">
                          <Col md={4} className="fs-small">
                            TDS
                          </Col>
                          <Col md={8}>
                            <Row className="align-items-center g-1">
                              <Col md={5}>
                                <FormikTextInput
                                  name="agentTdsPer"
                                  type="number"
                                  size="sm"
                                  className="w-100 fs-small input-24"
                                  readOnly
                                />
                              </Col>
                              <Col md={1} className="text-center fs-small fw-bold">
                                %
                              </Col>
                              <Col md={6}>
                                <FormikTextInput
                                  name="agentTds"
                                  type="number"
                                  size="sm"
                                  className="w-100 fs-small input-24"
                                  readOnly
                                />
                              </Col>
                            </Row>
                          </Col>
                        </Row>
                        <Row className="align-items-center row-compact pt-1">
                          <Col md={4} className="fs-small">
                            TCS
                          </Col>
                          <Col md={8}>
                            <Row className="align-items-center g-1">
                              <Col md={5}>
                                <FormikTextInput
                                  name="agentTcsPer"
                                  type="number"
                                  size="sm"
                                  className="w-100 fs-small input-24"
                                  readOnly
                                />
                              </Col>
                              <Col md={1} className="text-center fs-small fw-bold">
                                %
                              </Col>
                              <Col md={6}>
                                <FormikTextInput
                                  name="agentTcs"
                                  type="number"
                                  size="sm"
                                  className="w-100 fs-small input-24"
                                  readOnly
                                />
                              </Col>
                            </Row>
                          </Col>
                        </Row>
                        <Row className="align-items-center row-compact pt-1">
                          <Col md={6} className="fs-small">
                            Service Fee
                          </Col>
                          <Col md={6}>
                            <FormikTextInput
                              name="agentServiceFee"
                              type="number"
                              size="sm"
                              className="w-100 fs-small input-24"
                              readOnly
                            />
                          </Col>
                        </Row>
                        <Row className="align-items-center row-compact pt-1">
                          <Col md={6} className="fs-small fw-bold text-success">
                            Agent Commission
                          </Col>
                          <Col md={6}>
                            <FormikTextInput
                              name="agentTotal"
                              type="number"
                              size="sm"
                              className="w-100 fs-small fw-bold input-24"
                              readOnly
                            />
                          </Col>
                        </Row>
                        <Row className="align-items-center row-compact pt-1">
                          <Col md={6} className="fs-small fw-bold text-success">
                            Pay to Hotel
                          </Col>
                          <Col md={6}>
                            <FormikTextInput
                              name="agentPayToHotel"
                              type="number"
                              size="sm"
                              className="w-100 fs-small fw-bold input-24"
                              readOnly
                            />
                          </Col>
                        </Row>
                        <Row className="g-1 mb-2 mt-1">
                          <Col md={6}>
                            <label className="fs-small fw-semi-bold">Special Instruction</label>
                            <textarea
                              {...formik.getFieldProps('specialInstruction')}
                              className="form-control form-control-sm fs-small"
                              rows={4}
                              placeholder="Enter instruction"
                            />
                          </Col>
                          <Col md={6}>
                            <label className="fs-small fw-semi-bold">Message</label>
                            <textarea
                              {...formik.getFieldProps('message')}
                              className="form-control form-control-sm fs-small"
                              rows={4}
                              placeholder="Enter message"
                            />
                          </Col>
                        </Row>
                      </div>
                    </Col>
                  </Row>
                </Col>
              </Row>
            </form>
          </Card.Body>
        </Card>

        <div
          className="fixed-bottom bg-white border-top"
          style={{ padding: '5px 10px', zIndex: 1000 }}>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline-dark"
                className="fw-semibold px-3 same-btn"
                onClick={handleHistoryClick}>
                <i className="fi fi-rr-time-past me-1"></i>
                History
              </Button>

              <Button
                size="sm"
                variant="outline-dark"
                className="fw-semibold px-3 same-btn"
                onClick={handleShowDocuments}
                disabled={!values.guestId}>
                <i className="fi fi-rr-eye me-1"></i>
                Document
              </Button>

              <Button
                size="sm"
                variant="outline-dark"
                className="fw-semibold px-3 same-btn"
                onClick={handleOpenDocScan}>
                <i className="fi fi-rr-user me-1"></i>
                Doc
              </Button>
            </div>

            <div className="d-flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
                Cancel
              </Button>

              <Button
                variant="primary"
                size="sm"
                type="submit"
                form="checkin-form"
                disabled={submitting}>
                {submitting ? 'Processing...' : 'Check In (F9)'}
              </Button>
            </div>
          </div>
        </div>
      </div>

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
          mst_hotelid: hotelId,
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
        uploading={uploadingDoc}
        guestName={getGuestName()}
      />

      <GuestDocumentsModal
        show={showGuestDocsModal}
        onHide={() => setShowGuestDocsModal(false)}
        documents={guestDocuments}
        guestName={getGuestName()}
      />
    </FormikProvider>
  )
}

export default CheckInForm