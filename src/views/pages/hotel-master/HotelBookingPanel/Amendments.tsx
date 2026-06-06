import { useEffect, useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Row, Col, Button, Card, Form } from 'react-bootstrap'
import { toast } from 'react-hot-toast'
import { useAuthContext } from '@/common/context/useAuthContext'
import { useFormik, FormikProvider } from 'formik'

// Custom form components
import FormikTextInput from '@/components/Common/FormikTextInput'

// API Services
import CheckInService, { CheckIn } from '@/common/hotel/checkIn'
import DetailService, { Detail } from '@/common/hotel/detail'
import GuestService from '@/common/hotel/guest'
import CompanyService from '@/common/hotel/company'
import CountryService from '@/common/api/countries'
import GuestRoomChargesService from '@/common/hotel/guestRoomCharges'
import RoomCategoryService from '@/common/hotel/roomCategoryService'
import PaymentMethodService from '@/common/hotel/paymentMethod'
import GuestFolioService from '@/common/hotel/guestFolio'
import taxApi from '@/common/hotel/taxes'
import RoomService from '@/common/hotel/room'
import PostChargesService from '@/common/hotel/postCharges'
import AdvanceTransactionService from '@/common/hotel/advanceTransaction'
import DocumentTypeService from '@/common/hotel/documentType'

// Components for modals
import GuestForm from '../Guest/GuestForm'
import FormModal from '@/components/Common/models/FormModal'

// Types
interface OccupiedRoom {
  roomNo: string
  checkin: CheckIn
  detail: Detail
  guest?: any
  company?: any
  charges?: any
}

interface AmendmentFormValues {
  checkin_id: string
  reg_no: string
  roomNo: string
  category: string
  guest_name: string
  company_name: string
  nationality: string
  no_of_days: number
  pax: number
  exPax: number
  child_paid: number
  driver: number
  checkin_datetime: string
  checkout_datetime: string
  previous_date: string
  next_date: string
}

// ================== Helper: Update room charge folio entry ==================
const updateRoomChargeFolio = async (
  checkinId: number,
  detailId: number,
  newTotalAmount: number,
  hotelId: number,
) => {
  try {
    const folioRes = await GuestFolioService.list({ checkin_id: checkinId })
    const folioEntries = folioRes.data || []

    const roomChargeEntry = folioEntries.find(
      (entry: any) => entry.detail_id === detailId && entry.transaction_type === 'Room Charge',
    )

    if (roomChargeEntry) {
      await GuestFolioService.update(roomChargeEntry.folio_id, {
        debit_amount: newTotalAmount,
        description: `Room charge updated (total: ${newTotalAmount})`,
      })
    } else {
      await GuestFolioService.create({
        checkin_id: checkinId,
        hotelid: hotelId,
        detail_id: detailId,
        transaction_type: 'Room Charge',
        transaction_datetime: new Date().toISOString(),
        description: 'Room charge',
        debit_amount: newTotalAmount,
        credit_amount: 0,
        payment_method: '',
      })
    }
  } catch (error) {
    console.error('Failed to update room charge folio:', error)
    throw error
  }
}

const Amendments = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuthContext()
  const hotelId = user?.hotelid

  const [occupiedRooms, setOccupiedRooms] = useState<OccupiedRoom[]>([])
  const [selectedRoom, setSelectedRoom] = useState<OccupiedRoom | null>(null)
  const [allRoomsDetails, setAllRoomsDetails] = useState<Detail[]>([])
  const [loading, setLoading] = useState(false)
  const [countries, setCountries] = useState<Array<{ id: number; name: string }>>([])
  const [activeAction, setActiveAction] = useState<string | null>(null)
  const [roomCategories, setRoomCategories] = useState<
    Array<{ room_category_id: number; category_name: string }>
  >([])

  const [vacantRooms, setVacantRooms] = useState<Array<{ room_id: number; room_no: string }>>([])

  // ==================== BILLING SUMMARY STATE ====================
  const [_postChargesTotal, setPostChargesTotal] = useState<number>(0)
  const [_allowancesTotal, setAllowancesTotal] = useState<number>(0)
  const [_advanceTotal, setAdvanceTotal] = useState<number>(0)

  const formik = useFormik<AmendmentFormValues>({
    enableReinitialize: true,
    initialValues: {
      checkin_id: '',
      reg_no: '',
      roomNo: '',
      category: '',
      guest_name: '',
      company_name: '',
      nationality: '',
      no_of_days: 1,
      pax: 0,
      exPax: 0,
      child_paid: 0,
      driver: 0,
      checkin_datetime: '',
      checkout_datetime: '',
      previous_date: '',
      next_date: '',
    },
    onSubmit: () => {},
  })

  const { setValues } = formik

  useEffect(() => {
    if (selectedRoom) {
      setValues({
        checkin_id: selectedRoom.checkin.checkin_id?.toString() || '',
        reg_no: (selectedRoom.checkin as any).reg_no || '',
        roomNo: selectedRoom.roomNo,
        category:
          selectedRoom.detail.converted_category_name ||
          selectedRoom.detail.room_category_name ||
          '',
        guest_name: selectedRoom.checkin.guest_name || '',
        company_name: selectedRoom.company?.company_name || selectedRoom.checkin.company_name || '',
        nationality: selectedRoom.guest ? getCountryName(selectedRoom.guest.country_id) : '',
        no_of_days: selectedRoom.detail.no_of_days || 1,
        pax: selectedRoom.detail.pax || 0,
        exPax: selectedRoom.detail.ex_pax || 0,
        child_paid: selectedRoom.checkin.child_paid || 0,
        driver: selectedRoom.detail.driver || 0,
        checkin_datetime: formatDateTime(selectedRoom.detail.checkin_datetime),
        checkout_datetime: formatDateTime(selectedRoom.detail.checkout_datetime),
        previous_date: '',
        next_date: '',
      })
    }
  }, [selectedRoom, setValues])

  // ✅ FIXED: Use hotelid instead of mst_hotelid
  useEffect(() => {
    if (!hotelId) return

    const fetchOccupiedRooms = async () => {
      setLoading(true)
      try {
        const checkinsRes = await CheckInService.list({ hotelid: hotelId })
        const checkins: CheckIn[] = checkinsRes.data || []

        const detailsRes = await DetailService.list({ hotelid: hotelId })
        const allDetails: Detail[] = detailsRes.data || []

        const checkinMap = new Map<number, CheckIn>()
        checkins.forEach((c) => checkinMap.set(c.checkin_id, c))

        const activeDetails = allDetails.filter(
          (d) => checkinMap.has(d.checkin_id) && d.is_checkout === 0,
        )

        const rooms: OccupiedRoom[] = activeDetails.map((detail) => ({
          roomNo: detail.room_number || '',
          checkin: checkinMap.get(detail.checkin_id)!,
          detail,
        }))

        setOccupiedRooms(rooms)
        setAllRoomsDetails(activeDetails)
      } catch (error) {
        console.error('Failed to load occupied rooms:', error)
        toast.error('Could not load room data')
      } finally {
        setLoading(false)
      }
    }

    fetchOccupiedRooms()
  }, [hotelId])

  useEffect(() => {
    if (!hotelId) return
    const fetchVacantRooms = async () => {
      try {
        const res = await RoomService.list({ hotelid: hotelId })
        const rooms = res.data || []
        const vacant = rooms
          .filter((room: any) => room.room_status === 'available')
          .map((room: any) => ({
            room_id: room.room_id,
            // API may return room_no or room_number — handle both
            room_no: String(room.room_no ?? room.room_number ?? ''),
          }))
          .filter((r: any) => r.room_no !== '')
        setVacantRooms(vacant)
      } catch (error) {
        console.error('Failed to fetch vacant rooms:', error)
      }
    }
    fetchVacantRooms()
  }, [hotelId])

  useEffect(() => {
    const state = location.state as { occupiedItem?: any } | null
    if (state?.occupiedItem && occupiedRooms.length > 0) {
      const roomNo = state.occupiedItem.room_no
      const room = occupiedRooms.find((r) => r.roomNo === roomNo)
      if (room) {
        loadSingleRoomData(room)
      }
    }
  }, [location.state, occupiedRooms])

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await CountryService.list()
        const countriesData = Array.isArray(res) ? res : res?.data || []
        setCountries(
          countriesData
            .map((c: any) => ({ id: c.id || c.countryid, name: String(c.name || c.country_name) }))
            .filter((c: any) => c.id && c.name),
        )
      } catch (error) {
        console.error('Failed to load countries:', error)
      }
    }
    fetchCountries()
  }, [])

  useEffect(() => {
    const fetchCategories = async () => {
      if (!hotelId) return
      try {
        const res = await RoomCategoryService.list({ hotelid: hotelId })
        const data = Array.isArray(res) ? res : res?.data || []
        setRoomCategories(
          data.map((c: any) => ({
            room_category_id: c.room_category_id || c.id,
            category_name: String(c.category_name || c.name),
          })),
        )
      } catch (error) {
        console.error('Failed to load room categories:', error)
      }
    }
    fetchCategories()
  }, [hotelId])

  useEffect(() => {
    const keyActionMap: Record<string, string> = {
      F2: 'Change In Pax',
      F3: 'Change In Guest Info',
      F4: 'Stay Amendments',
      F5: 'Change Room Cat.',
      F6: 'Transfer Room',
      F7: 'Merge Room',
      F8: 'Change In Pay Mode',
      F9: 'Swap Room',
      F10: 'Apply Discount',
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // If an action panel is open, close it first; otherwise go back
        if (activeAction) {
          e.preventDefault()
          setActiveAction(null)
        } else {
          e.preventDefault()
          navigate(-1)
        }
        return
      }

      // F2–F10: open corresponding action panel
      if (e.key in keyActionMap) {
        e.preventDefault()
        const action = keyActionMap[e.key]
        if (!selectedRoom) {
          toast.error('Please select a room first')
          return
        }
        // If same action is already open, pressing the key again closes it
        if (activeAction === action) {
          setActiveAction(null)
        } else {
          setActiveAction(action)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeAction, navigate, selectedRoom])

  const fetchBillingSummary = async (checkinId: number, roomId?: number) => {
    try {
      // Fetch post charges (CHARGE type) for this checkin
      const postChargesRes = await PostChargesService.list({ checkin_id: checkinId } as any)
      const allPostCharges: any[] = postChargesRes.data || []
      const chargesForRoom = roomId
        ? allPostCharges.filter(
            (c: any) =>
              (!c.room_id || Number(c.room_id) === Number(roomId)) &&
              (c.transaction_type === 'CHARGE' || !c.transaction_type),
          )
        : allPostCharges.filter((c: any) => c.transaction_type === 'CHARGE' || !c.transaction_type)
      const allowancesForRoom = roomId
        ? allPostCharges.filter(
            (c: any) =>
              (!c.room_id || Number(c.room_id) === Number(roomId)) &&
              c.transaction_type === 'ALLOWANCE',
          )
        : allPostCharges.filter((c: any) => c.transaction_type === 'ALLOWANCE')

      const pct = chargesForRoom.reduce(
        (sum: number, c: any) => sum + Number(c.total_amount ?? c.amount ?? 0),
        0,
      )
      const alt = allowancesForRoom.reduce(
        (sum: number, c: any) => sum + Number(c.total_amount ?? c.amount ?? 0),
        0,
      )
      setPostChargesTotal(pct)
      setAllowancesTotal(alt)
    } catch {
      setPostChargesTotal(0)
      setAllowancesTotal(0)
    }

    try {
      // Fetch advance transactions (credit) for this checkin
      const advanceRes = await AdvanceTransactionService.list({ checkin_id: checkinId } as any)
      const advances: any[] = advanceRes.data || []
      const adv = advances.reduce(
        (sum: number, a: any) => sum + Number(a.amount ?? a.advance_amount ?? 0),
        0,
      )
      setAdvanceTotal(adv)
    } catch {
      setAdvanceTotal(0)
    }
  }

  const loadSingleRoomData = async (room: OccupiedRoom) => {
    setLoading(true)
    try {
      const freshDetailRes = await DetailService.get(room.detail.detail_id)
      const freshDetail: Detail = freshDetailRes.data || freshDetailRes

      const guestId = room.checkin.guest_id
      const guestRes = await GuestService.get(guestId)
      const guest = guestRes.data || guestRes

      let company = null
      const companyId = (room.checkin as any).company_id
      if (companyId) {
        const companyRes = await CompanyService.get(companyId)
        company = companyRes.data || companyRes
      }

      const checkinRes = await CheckInService.get(freshDetail.checkin_id)
      const checkin = checkinRes.data || checkinRes

      let charges = null
      try {
        const chargesRes = await GuestRoomChargesService.list({
          checkin_id: freshDetail.checkin_id,
        } as any)
        // FIX: Filter by room_id so each room gets its OWN charges, not the first
        // row of the checkin (which may belong to a different room in a multi-room booking).
        const allChargeRows: any[] = chargesRes.data || []
        const roomChargeRows = allChargeRows.filter(
          (c: any) => Number(c.room_id) === Number(freshDetail.room_id),
        )
        // Use the latest charge row for this specific room (sort descending by id or datetime)
        if (roomChargeRows.length > 0) {
          roomChargeRows.sort((a: any, b: any) => {
            const dateA = new Date(a.checkin_datetime || 0).getTime()
            const dateB = new Date(b.checkin_datetime || 0).getTime()
            return dateB - dateA
          })
          charges = roomChargeRows[0]
        } else {
          charges = null
        }
      } catch {
        charges = null
      }

      const detailWithCharges = { ...freshDetail, charges }

      const roomWithCharges: OccupiedRoom = {
        roomNo: freshDetail.room_number || '',
        checkin,
        detail: freshDetail,
        guest,
        company,
        charges,
      }

      setSelectedRoom(roomWithCharges)
      setAllRoomsDetails([detailWithCharges])
      setActiveAction(null)

      // Fetch post charges, allowances, and advances for billing summary
      fetchBillingSummary(freshDetail.checkin_id, freshDetail.room_id)
    } catch (error) {
      console.error('Failed to load guest/company details:', error)
      toast.error('Could not load guest information')
    } finally {
      setLoading(false)
    }
  }

  const refreshOccupiedRooms = async () => {
    if (!hotelId) return
    try {
      const checkinsRes = await CheckInService.list({ hotelid: hotelId })
      const checkins: CheckIn[] = checkinsRes.data || []

      const detailsRes = await DetailService.list({ hotelid: hotelId })
      const allDetails: Detail[] = detailsRes.data || []

      const checkinMap = new Map<number, CheckIn>()
      checkins.forEach((c) => checkinMap.set(c.checkin_id, c))

      const activeDetails = allDetails.filter(
        (d) => checkinMap.has(d.checkin_id) && d.is_checkout === 0,
      )

      const rooms: OccupiedRoom[] = activeDetails.map((detail) => ({
        roomNo: detail.room_number || '',
        checkin: checkinMap.get(detail.checkin_id)!,
        detail,
      }))

      setOccupiedRooms(rooms)
      setAllRoomsDetails(activeDetails)

      if (selectedRoom) {
        const updatedSelected = rooms.find(
          (r) => r.detail.detail_id === selectedRoom.detail.detail_id,
        )
        if (updatedSelected) {
          await loadSingleRoomData(updatedSelected)
        } else {
          setSelectedRoom(null)
          setPostChargesTotal(0)
          setAllowancesTotal(0)
          setAdvanceTotal(0)
        }
      }
    } catch (error) {
      console.error('Failed to refresh occupied rooms:', error)
      toast.error('Could not refresh room data')
    }
  }

  const formatDateTime = (isoString?: string): string => {
    if (!isoString) return '-'
    try {
      const d = new Date(isoString)
      if (isNaN(d.getTime())) return '-'
      const day = d.getDate().toString().padStart(2, '0')
      const month = d.toLocaleString('default', { month: 'short' }).replace('.', '')
      const year = d.getFullYear()
      const hours = d.getHours().toString().padStart(2, '0')
      const minutes = d.getMinutes().toString().padStart(2, '0')
      return `${day}-${month}-${year} ${hours}:${minutes}`
    } catch {
      return '-'
    }
  }

  const getCountryName = (countryId?: number | null) => {
    if (!countryId) return '-'
    const country = countries.find((c) => c.id === countryId)
    return country?.name || '-'
  }

  const handleAction = (action: string) => {
    if (!selectedRoom) {
      toast.error('Please select a room first')
      return
    }
    setActiveAction(action)
  }

  const handleCloseAction = () => {
    setActiveAction(null)
  }

  const roomNumbersList = useMemo(() => {
    return allRoomsDetails
      .map((d) => d.room_number)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
      .join(', ')
  }, [allRoomsDetails])

  const refreshSelectedRoom = () => {
    if (selectedRoom) {
      loadSingleRoomData(selectedRoom)
    }
  }

  return (
    <FormikProvider value={formik}>
      <style>{`
        .fs-small { font-size: 0.9rem; }
        .fs-medium { font-size: 0.8rem; }
        .bg-danger-custom { background-color: #009de0 !important; }
        .input-24 {
          height: 24px !important;
          min-height: 24px !important;
          padding: 2px 4px !important;
          font-size: 12px !important;
        }
        .table-sm-compact th, .table-sm-compact td {
          padding: 0.2rem 0.3rem;
          font-size: 0.9rem;
          white-space: nowrap;
          border: 1px solid #dee2e6 !important;
        }
        .border-box {
          border: 1px solid #dee2e6;
          border-radius: 4px;
          padding: 0.5rem;
        }
        .action-btn {
          width: 100%;
          height: 34px;
          margin-bottom: 4px;
          font-size: 0.9rem;
          padding: 0.2rem 0.5rem;
          text-align: left;
        }
        .bg-white {
          background-color: #ffffff !important;
        }
        .button-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 0.5rem;
        }
        .section-legend {
          background-color: #dbdbdb;
          color: #000000;
          padding: 2px 12px;
          font-size: 15px;
          font-weight: 600;
          border-radius: 3px;
          margin-bottom: 8px;
          width: 100%;
        }
        .label-top {
          font-size: 0.85rem;
          margin-bottom: 2px;
          display: block;
        }
        .form-control-sm, .form-select-sm {
          font-size: 0.7rem !important;
        }
        .light-gray-border {
          border: 1px solid #d3d3d3 !important;
          border-radius: 0.25rem;
          padding: 0.5rem;
        }
        .full-height-col {
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        .right-col-container {
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .buttons-section {
          flex: 0 0 auto;
        }
        .extra-section {
          flex: 1 1 auto;
          margin-top: 1rem;
          overflow-y: auto;
        }
        input, select, textarea, .form-control, .form-select {
          font-size: 0.8rem !important;
        }
        input.form-control-sm, select.form-select-sm {
          height: 28px !important;
          min-height: 28px !important;
          padding: 0 6px !important;
        }
        .scrollable-table {
          max-height: 200px;
          overflow-y: auto;
        }
        .row-compact {
          margin-bottom: 4px;
        }
        .pax-header {
          background-color: #f0f0f0;
          font-weight: 600;
          padding: 4px 8px;
          border-bottom: 2px solid #ccc;
        }
        .pax-value {
          font-size: 1rem;
          font-weight: 600;
        }
        .pax-max {
          color: #666;
        }
      
        .table-sm td,
        .table-sm th {
          padding: 3px !important;
        }
        .pax-table th,
        .pax-table td {
          border: 1px solid #000 !important;
        }
        .table-light-header th {
          background-color: #f8f9fa;
        }
        .table-xs {
          font-size: 0.85rem;
        }
        .table-xs td, .table-xs th {
          padding: 2px 4px;
        }
        .guest-info-delete {
          font-weight: bold;
          color: #dbdbdb;
        }
        .guest-info-company {
          font-weight: bold;
        }
        .clock-icon {
          font-size: 4rem;
          line-height: 1;
        }
        .custom-table {
          font-size: 12px;
        }
        .custom-table th,
        .custom-table td {
          padding: 2px 4px !important;
          white-space: nowrap;
        }
        .custom-table thead th {
          text-align: center !important;
          vertical-align: middle !important;
        }
        .custom-table th {
          line-height: 1.1;
        }
        .custom-table th,
        .custom-table td {
          min-width: 70px;
        }
        .action-box {
          background: #fff;
          border: 1px solid #dee2e6;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          padding: 1rem;
          margin: 0 auto;
          width: 100%;
          max-width: 1400px;
          position: relative;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .action-box-header {
          background-color: #dbdbdb !important;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.2rem 0.5rem;
          margin: -1rem -1rem 0rem -1rem;
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
        }
        .action-box-header,
        .action-box-header * {
          color: #000000 !important;
        }
        .action-box-title {
          font-size: 1rem;
          font-weight: 600;
          margin: 0;
        }
        .action-box-close {
          color: white;
          background: none;
          border: none;
          font-size: 1.5rem;
          line-height: 1;
          cursor: pointer;
        }
        .action-box-close:hover {
          color: #f8f9fa;
        }
        .action-table-container {
          flex: 1;
          overflow-y: auto;
          margin-bottom: 1rem;
          border: 1px solid #dee2e6;
          border-radius: 4px;
        }
        .action-table {
          width: 100%;
          margin-bottom: 0;
          font-size: 0.9rem;
        }
        .action-table thead th {
          position: sticky;
          top: 0;
          background-color: #f8f9fa;
          z-index: 1;
          border-bottom: 2px solid #dee2e6;
          padding: 0.3rem 0.5rem;
          white-space: nowrap;
        }
        .action-table tbody td {
          padding: 0.3rem 0.5rem;
          white-space: nowrap;
        }
        .action-footer {
          background: white;
          border-top: 1px solid #dee2e6;
          padding: 0.5rem;
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }
        .action-box-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .horizontal-fields {
          display: flex;
          gap: 1rem;
          align-items: flex-end;
          flex-wrap: wrap;
        }
        .horizontal-fields > div {
          flex: 1;
          min-width: 150px;
        }
        .highlight-cell {
          background-color: #fff3cd !important;
        }
      `}</style>

      <div className="vh-100 d-flex flex-column overflow-hidden">
        <div className="border-bottom py-1 px-3 d-flex align-items-center " style={{backgroundColor:'#3d5eac'}}>
          <span className="fw-bold fs-small me-2 text-white" style={{ minWidth: '60px' }}>
            SELECT ROOM NO:
          </span>
          <div style={{ width: '100px' }}>
            <Form.Control
              type="text"
              size="sm"
              className="fs-small"
              value={roomNumbersList}
              readOnly
              disabled={loading}
              placeholder="No room selected"
            />
          </div>
        </div>

        <div className="flex-grow-1 overflow-auto p-2">
          <Row className="g-3 h-100">
            <Col md={9} className="full-height-col px-2">
              <div className="right-col-container ">
                <Card className="buttons-section bg-light">
                  <Card.Body className="p-2">
                    <div className="button-grid">
                      <Button
                        variant={activeAction === 'Change In Pax' ? 'success' : 'dark'}
                        size="sm"
                        className="action-btn"
                        onClick={() => handleAction('Change In Pax')}>
                        Change In Pax (F2)
                      </Button>
                      <Button
                        variant={activeAction === 'Change In Guest Info' ? 'success' : 'dark'}
                        size="sm"
                        className="action-btn"
                        onClick={() => handleAction('Change In Guest Info')}>
                        Change In Guest Info (F3)
                      </Button>
                      <Button
                        variant={activeAction === 'Stay Amendments' ? 'success' : 'dark'}
                        size="sm"
                        className="action-btn"
                        onClick={() => handleAction('Stay Amendments')}>
                        Stay Amendments (F4)
                      </Button>
                      <Button
                        variant={activeAction === 'Change Room Cat.' ? 'success' : 'dark'}
                        size="sm"
                        className="action-btn"
                        onClick={() => handleAction('Change Room Cat.')}>
                        Change Room Cat. (F5)
                      </Button>
                      <Button
                        variant={activeAction === 'Transfer Room' ? 'success' : 'dark'}
                        size="sm"
                        className="action-btn"
                        onClick={() => handleAction('Transfer Room')}>
                        Transfer Room (F6)
                      </Button>
                      <Button
                        variant={activeAction === 'Merge Room' ? 'success' : 'dark'}
                        size="sm"
                        className="action-btn"
                        onClick={() => handleAction('Merge Room')}>
                        Merge Room (F7)
                      </Button>
                      <Button
                        variant={activeAction === 'Change In Pay Mode' ? 'success' : 'dark'}
                        size="sm"
                        className="action-btn"
                        onClick={() => handleAction('Change In Pay Mode')}>
                        Change In Pay Mode (F8)
                      </Button>
                      <Button
                        variant={activeAction === 'Swap Room' ? 'success' : 'dark'}
                        size="sm"
                        className="action-btn"
                        onClick={() => handleAction('Swap Room')}>
                        Swap Room (F9)
                      </Button>
                      <Button
                        variant={activeAction === 'Apply Discount' ? 'success' : 'dark'}
                        size="sm"
                        className="action-btn"
                        onClick={() => handleAction('Apply Discount')}>
                        Apply Discount (F10)
                      </Button>
                    </div>
                  </Card.Body>
                </Card>

                <Card className="extra-section bg-light">
                  <Card.Body className="p-2 d-flex justify-content-center align-items-start">
                    {activeAction === 'Change In Pax' && selectedRoom ? (
                      <PaxChangeComponent
                        selectedRoom={selectedRoom}
                        allRoomsDetails={allRoomsDetails}
                        onClose={handleCloseAction}
                        onRefresh={refreshSelectedRoom}
                      />
                    ) : activeAction === 'Change In Guest Info' && selectedRoom ? (
                      <ChangeGuestInfoComponent
                        selectedRoom={selectedRoom}
                        allRoomsDetails={allRoomsDetails}
                        onClose={handleCloseAction}
                        onRefresh={refreshSelectedRoom}
                      />
                    ) : activeAction === 'Stay Amendments' && selectedRoom ? (
                      <StayAmendmentsComponent
                        selectedRoom={selectedRoom}
                        onClose={handleCloseAction}
                        onRefresh={refreshSelectedRoom}
                      />
                    ) : activeAction === 'Change Room Cat.' && selectedRoom ? (
                      <ChangeRoomCategoryComponent
                        selectedRoom={selectedRoom}
                        roomCategories={roomCategories}
                        allRoomsDetails={allRoomsDetails}
                        onClose={handleCloseAction}
                        onRefresh={refreshSelectedRoom}
                      />
                    ) : activeAction === 'Transfer Room' && selectedRoom ? (
                      <TransferRoomComponent
                        selectedRoom={selectedRoom}
                        allRoomsDetails={allRoomsDetails}
                        vacantRooms={vacantRooms}
                        onClose={handleCloseAction}
                        onRefresh={refreshOccupiedRooms}
                      />
                    ) : activeAction === 'Merge Room' && selectedRoom ? (
                      <MergeRoomComponent
                        selectedRoom={selectedRoom}
                        allRoomsDetails={allRoomsDetails}
                        occupiedRooms={occupiedRooms}
                        onClose={handleCloseAction}
                      />
                    ) : activeAction === 'Change In Pay Mode' && selectedRoom ? (
                      <ChangePayModeComponent
                        selectedRoom={selectedRoom}
                        allRoomsDetails={allRoomsDetails}
                        onClose={handleCloseAction}
                        onRefresh={refreshSelectedRoom}
                      />
                    ) : activeAction === 'Swap Room' && selectedRoom ? (
                      <SwapRoomComponent
                        selectedRoom={selectedRoom}
                        occupiedRooms={occupiedRooms}
                        onClose={handleCloseAction}
                        onRefresh={refreshOccupiedRooms}
                      />
                    ) : activeAction === 'Apply Discount' && selectedRoom ? (
                      <ApplyDiscountComponent
                        selectedRoom={selectedRoom}
                        allRoomsDetails={allRoomsDetails}
                        onClose={handleCloseAction}
                        onRefresh={refreshSelectedRoom}
                      />
                    ) : (
                      <>
                        <h6 className="fs-small fw-bold mb-2">Additional Information</h6>
                        <p className="fs-small text-muted">
                          {activeAction
                            ? `Content for ${activeAction} will appear here.`
                            : 'Select an action from the buttons above.'}
                        </p>
                      </>
                    )}
                  </Card.Body>
                </Card>
              </div>
            </Col>

            <Col md={3} className="full-height-col px-2">
              {selectedRoom ? (
                <>
                  <fieldset className="light-gray-border mb-2">
                    <legend className="section-legend">Details</legend>
                    <Row className="g-2 mb-1">
                      <Col md="auto" style={{ width: '145px' }}>
                        <Form.Label className="label-top">CheckIn ID</Form.Label>
                        <FormikTextInput
                          name="checkin_id"
                          size="sm"
                          readOnly
                          className="fs-small w-100"
                        />
                      </Col>
                      <Col md="auto" style={{ width: '145px' }}>
                        <Form.Label className="label-top">Reg No</Form.Label>
                        <FormikTextInput
                          name="reg_no"
                          size="sm"
                          readOnly
                          className="fs-small w-100"
                        />
                      </Col>
                    </Row>
                    <Row className="g-2 mb-1">
                      <Col md="auto" style={{ width: '145px' }}>
                        <Form.Label className="label-top">Room No</Form.Label>
                        <Form.Control
                          type="text"
                          size="sm"
                          readOnly
                          className="fs-small w-100"
                          value={roomNumbersList}
                        />
                      </Col>
                      <Col md="auto" style={{ width: '145px' }}>
                        <Form.Label className="label-top">Category</Form.Label>
                        <FormikTextInput
                          name="category"
                          size="sm"
                          readOnly
                          className="fs-small w-100"
                        />
                      </Col>
                    </Row>
                    <Row className="g-2 mb-1">
                      <Col md="auto" style={{ width: '145px' }}>
                        <Form.Label className="label-top">Guest Name</Form.Label>
                        <FormikTextInput
                          name="guest_name"
                          size="sm"
                          readOnly
                          className="fs-small w-100"
                        />
                      </Col>
                      <Col md="auto" style={{ width: '145px' }}>
                        <Form.Label className="label-top">Company</Form.Label>
                        <FormikTextInput
                          name="company_name"
                          size="sm"
                          readOnly
                          className="fs-small w-100"
                        />
                      </Col>
                    </Row>
                  </fieldset>

                  <fieldset className="light-gray-border mb-2">
                    <legend className="section-legend">Stay Details</legend>
                    <Row className="g-2 mb-1">
                      <Col md="auto" style={{ width: '145px' }}>
                        <Form.Label className="label-top">Nationality</Form.Label>
                        <FormikTextInput
                          name="nationality"
                          size="sm"
                          readOnly
                          className="fs-small w-100"
                        />
                      </Col>
                      <Col md="auto" style={{ width: '145px' }}>
                        <Form.Label className="label-top">No Of Days</Form.Label>
                        <FormikTextInput
                          name="no_of_days"
                          size="sm"
                          readOnly
                          className="fs-small w-100"
                        />
                      </Col>
                    </Row>
                    <Row className="g-2 mb-1">
                      <Col md="auto" style={{ width: '145px' }}>
                        <Form.Label className="label-top">Pax</Form.Label>
                        <FormikTextInput name="pax" size="sm" readOnly className="fs-small w-100" />
                      </Col>
                      <Col md="auto" style={{ width: '145px' }}>
                        <Form.Label className="label-top">ExPax</Form.Label>
                        <FormikTextInput
                          name="exPax"
                          size="sm"
                          readOnly
                          className="fs-small w-100"
                        />
                      </Col>
                      <Col md="auto" style={{ width: '145px' }}>
                        <Form.Label className="label-top">Child Paid</Form.Label>
                        <FormikTextInput
                          name="child_paid"
                          size="sm"
                          readOnly
                          className="fs-small w-100"
                        />
                      </Col>
                      <Col md="auto" style={{ width: '145px' }}>
                        <Form.Label className="label-top">Driver</Form.Label>
                        <FormikTextInput
                          name="driver"
                          size="sm"
                          readOnly
                          className="fs-small w-100"
                        />
                      </Col>
                    </Row>
                    <Row className="g-2 mb-1">
                      <Col md="auto" style={{ width: '145px' }}>
                        <Form.Label className="label-top">Check-In Date</Form.Label>
                        <FormikTextInput
                          name="checkin_datetime"
                          size="sm"
                          readOnly
                          className="fs-small w-100"
                        />
                      </Col>
                      <Col md="auto" style={{ width: '145px' }}>
                        <Form.Label className="label-top">Check-Out Date</Form.Label>
                        <FormikTextInput
                          name="checkout_datetime"
                          size="sm"
                          readOnly
                          className="fs-small w-100"
                        />
                      </Col>
                    </Row>
                    <Row className="g-2 mb-4">
                      <Col md="auto" style={{ width: '145px' }}>
                        <Form.Label className="label-top">Previous Date</Form.Label>
                        <FormikTextInput
                          name="previous_date"
                          size="sm"
                          type="date"
                          className="fs-small input-24 w-100"
                        />
                      </Col>
                      <Col md="auto" style={{ width: '145px' }}>
                        <Form.Label className="label-top">Next Date</Form.Label>
                        <FormikTextInput
                          name="next_date"
                          size="sm"
                          type="date"
                          className="fs-small input-24 w-100"
                        />
                      </Col>
                    </Row>
                  </fieldset>
                </>
              ) : (
                <div className="text-center text-muted py-5">Select a room to view details</div>
              )}
            </Col>
          </Row>
        </div>

        <div className="border-top py-1 px-3 d-flex justify-content-between align-items-center "style={{backgroundColor:'#3d5eac'}}>
          <div className="d-flex align-items-center gap-3 text-white fw-bold fs-small"></div>
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
            Exit
          </Button>
        </div>
      </div>
    </FormikProvider>
  )
}

// ================== Helper functions ==================
const buildRoomDataRowFromDetail = (detail: Detail, checkin: CheckIn, charges?: any) => {
  const safeNum = (val: any): number => Number(val || 0)

  const nights = safeNum(detail.no_of_days) || 1
  const rate = safeNum(detail.room_tariff)
  const discountPercent = safeNum(detail.discount_percent)
  const discountAmt = (rate * nights * discountPercent) / 100

  const exPaxCount = safeNum(detail.ex_pax)
  const exPaxTaxPercent = safeNum(charges?.ex_pax_tax_percent)
  let exPaxPrice: number
  let exPaxTax: number
  let exPaxTotal: number
  if (charges && charges.ex_pax_price != null) {
    exPaxPrice = safeNum(charges.ex_pax_price)
    exPaxTax = safeNum(charges.ex_pax_tax)
    exPaxTotal = safeNum(charges.ex_pax_total)
  } else {
    exPaxPrice = exPaxCount > 0 ? safeNum(detail.ex_pax_charge) : 0
    exPaxTax = (exPaxPrice * exPaxTaxPercent) / 100
    exPaxTotal = exPaxPrice + exPaxTax
  }

  const childCount = safeNum(checkin.child_paid)
  const childTaxPercent = safeNum(charges?.child_tax_percent)
  let childPrice: number
  let childTax: number
  let childTotal: number
  if (charges && charges.child_price != null) {
    childPrice = safeNum(charges.child_price)
    childTax = safeNum(charges.child_tax)
    childTotal = safeNum(charges.child_total)
  } else {
    childPrice = childCount > 0 ? safeNum(detail.child_paid_amount) : 0
    childTax = (childPrice * childTaxPercent) / 100
    childTotal = childPrice + childTax
  }

  const driverCount = safeNum(detail.driver)
  const driverTaxPercent = safeNum(charges?.driver_tax_percent)
  let driverPrice: number
  let driverTax: number
  let driverTotal: number
  if (charges && charges.driver_price != null) {
    driverPrice = safeNum(charges.driver_price)
    driverTax = safeNum(charges.driver_tax)
    driverTotal = safeNum(charges.driver_total)
  } else {
    driverPrice = driverCount > 0 ? safeNum(detail.driver_charge) : 0
    driverTax = (driverPrice * driverTaxPercent) / 100
    driverTotal = driverPrice + driverTax
  }

  const taxPercent =
    safeNum(detail.cgst_percent) +
    safeNum(detail.sgst_percent) +
    safeNum(detail.igst_percent) +
    safeNum(detail.cess_percent)
  const baseRoomAmount = rate * nights - discountAmt
  const taxAmount = (baseRoomAmount * taxPercent) / 100

  const totalAmount = baseRoomAmount + taxAmount + exPaxTotal + childTotal + driverTotal

  return {
    date: formatDateShort(detail.checkin_datetime),
    room: detail.room_number,
    guestName: checkin.guest_name,
    guestId: checkin.guest_id,
    roomNo: detail.room_number,
    type: detail.room_category_name,
    convCat: detail.converted_category_name || '-',
    aDate: formatDateShort(detail.checkin_datetime),
    aTime: formatTime(detail.checkin_datetime),
    dDate: formatDateShort(detail.checkout_datetime),
    dTime: formatTime(detail.checkout_datetime),
    adults: detail.adults || 0,
    pax: detail.pax || 0,
    exPax: exPaxCount,
    exPaxPrice: exPaxPrice.toFixed(2),
    exPaxTaxPercent: exPaxTaxPercent.toFixed(2),
    exPaxTax: exPaxTax.toFixed(2),
    exPaxTotal: exPaxTotal.toFixed(2),
    childPaid: childCount,
    childUnpaid: checkin.child_unpaid || 0,
    childPrice: childPrice.toFixed(2),
    childTaxPercent: childTaxPercent.toFixed(2),
    childTax: childTax.toFixed(2),
    childTotal: childTotal.toFixed(2),
    driver: driverCount,
    driverPrice: driverPrice.toFixed(2),
    driverTaxPercent: driverTaxPercent.toFixed(2),
    driverTax: driverTax.toFixed(2),
    driverTotal: driverTotal.toFixed(2),
    nights: nights,
    rate: rate.toFixed(2),
    discountPercent: discountPercent,
    discountAmt: discountAmt.toFixed(2),
    taxPercent: taxPercent.toFixed(2),
    taxAmount: taxAmount.toFixed(2),
    totalAmount: totalAmount.toFixed(2),
  }
}

const formatDateShort = (iso?: string) => {
  if (!iso) return '-'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '-'
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear().toString().slice(-2)
  return `${day}-${month}-${year}`
}

const formatTime = (iso?: string) => {
  if (!iso) return '-'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '-'
  return d.toTimeString().slice(0, 5)
}

// ================== Action Box Wrapper ==================
interface ActionBoxProps {
  title: string
  onClose: () => void
  children: React.ReactNode
  className?: string
}

const ActionBox = ({ title, onClose, children, className = '' }: ActionBoxProps) => {
  return (
    <div className={`action-box ${className}`}>
      <div className="action-box-header">
        <h5 className="action-box-title">{title}</h5>
        <button type="button" className="action-box-close" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>
      <div className="action-box-content">{children}</div>
    </div>
  )
}

// ================== Pax Change Component ==================
interface PaxChangeProps {
  selectedRoom: OccupiedRoom
  allRoomsDetails: Detail[]
  onClose: () => void
  onRefresh: () => void
}

const PaxChangeComponent = ({
  selectedRoom,
  allRoomsDetails,
  onClose,
  onRefresh,
}: PaxChangeProps) => {
  const originalPax = selectedRoom.detail.pax || 0
  const originalExPax = selectedRoom.detail.ex_pax || 0
  const originalChildPaid = selectedRoom.checkin.child_paid || 0
  const originalDriver = selectedRoom.detail.driver || 0

  const [tempPax, setTempPax] = useState(originalPax)
  const [tempExPax, setTempExPax] = useState(originalExPax)
  const [tempChildPaid, setTempChildPaid] = useState(originalChildPaid)
  const [tempDriver, setTempDriver] = useState(originalDriver)
  const [previewActive, setPreviewActive] = useState(false)
  const [modeCharges, setModeCharges] = useState<any[]>([])
  const [taxMap, setTaxMap] = useState<Map<number, number>>(new Map())
  const [loadingUpdate, setLoadingUpdate] = useState(false)

  useEffect(() => {
    setTempPax(originalPax)
    setTempExPax(originalExPax)
    setTempChildPaid(originalChildPaid)
    setTempDriver(originalDriver)
    setPreviewActive(false)
  }, [originalPax, originalExPax, originalChildPaid, originalDriver])

  useEffect(() => {
    const fetchData = async () => {
      const effectiveCategoryId =
        selectedRoom.detail.converted_category_id || selectedRoom.detail.room_category_id
      if (!effectiveCategoryId) return
      try {
        const catRes = await RoomCategoryService.get(effectiveCategoryId)
        const catData = catRes.data || catRes
        setModeCharges(catData.mode_charges || [])

        const taxRes = await taxApi.list()
        const taxData = Array.isArray(taxRes) ? taxRes : taxRes?.data || []
        const map = new Map<number, number>()
        taxData.forEach((tax: any) => {
          const percent = tax.hotel_tax_value ?? tax.hotel_cgst + tax.hotel_sgst
          map.set(tax.hotel_taxid, percent)
        })
        setTaxMap(map)
      } catch (error) {
        console.error('Failed to load category details', error)
        toast.error('Could not load extra charges configuration')
      }
    }
    fetchData()
  }, [selectedRoom])

  const nights = selectedRoom.detail.no_of_days || 1

  const computeModeCharges = (modeName: string, count: number) => {
    const mode = modeCharges.find((m: any) => m.mode_name === modeName)
    if (!mode || count <= 0) {
      return { price: 0, tax: 0, taxPercent: 0, total: 0 }
    }
    const perNightPrice = mode.charges * count
    let taxPercent = 0
    if (mode.is_tax_applicable && mode.tax_type) {
      taxPercent = taxMap.get(Number(mode.tax_type)) || 0
    }
    const perNightTax = (perNightPrice * taxPercent) / 100
    const perNightTotal = perNightPrice + perNightTax
    return {
      price: perNightPrice * nights,
      tax: perNightTax * nights,
      taxPercent,
      total: perNightTotal * nights,
    }
  }

  const exPaxCalc = computeModeCharges('EXTRA_PAX', tempExPax)
  const childCalc = computeModeCharges('CHILD', tempChildPaid)
  const driverCalc = computeModeCharges('DRIVER', tempDriver)

  const updatedRow = useMemo(() => {
    const updatedDetail = {
      ...selectedRoom.detail,
      pax: tempPax,
      ex_pax: tempExPax,
      driver: tempDriver,
    }
    const updatedCheckin = { ...selectedRoom.checkin, child_paid: tempChildPaid }
    const charges = {
      ex_pax_price: exPaxCalc.price,
      ex_pax_tax: exPaxCalc.tax,
      ex_pax_tax_percent: exPaxCalc.taxPercent,
      ex_pax_total: exPaxCalc.total,
      child_price: childCalc.price,
      child_tax: childCalc.tax,
      child_tax_percent: childCalc.taxPercent,
      child_total: childCalc.total,
      driver_price: driverCalc.price,
      driver_tax: driverCalc.tax,
      driver_tax_percent: driverCalc.taxPercent,
      driver_total: driverCalc.total,
    }
    return buildRoomDataRowFromDetail(updatedDetail, updatedCheckin, charges)
  }, [
    selectedRoom,
    tempPax,
    tempExPax,
    tempChildPaid,
    tempDriver,
    exPaxCalc,
    childCalc,
    driverCalc,
    nights,
  ])

  const originalExPaxCalc = useMemo(
    () => computeModeCharges('EXTRA_PAX', originalExPax),
    [modeCharges, taxMap, originalExPax, nights],
  )
  const originalChildCalc = useMemo(
    () => computeModeCharges('CHILD', originalChildPaid),
    [modeCharges, taxMap, originalChildPaid, nights],
  )
  const originalDriverCalc = useMemo(
    () => computeModeCharges('DRIVER', originalDriver),
    [modeCharges, taxMap, originalDriver, nights],
  )

  const originalRow = useMemo(() => {
    const liveCharges =
      modeCharges.length > 0
        ? {
            ex_pax_price: originalExPaxCalc.price,
            ex_pax_tax: originalExPaxCalc.tax,
            ex_pax_tax_percent: originalExPaxCalc.taxPercent,
            ex_pax_total: originalExPaxCalc.total,
            child_price: originalChildCalc.price,
            child_tax: originalChildCalc.tax,
            child_tax_percent: originalChildCalc.taxPercent,
            child_total: originalChildCalc.total,
            driver_price: originalDriverCalc.price,
            driver_tax: originalDriverCalc.tax,
            driver_tax_percent: originalDriverCalc.taxPercent,
            driver_total: originalDriverCalc.total,
          }
        : selectedRoom.charges
    return buildRoomDataRowFromDetail(selectedRoom.detail, selectedRoom.checkin, liveCharges)
  }, [selectedRoom, modeCharges, taxMap, originalExPaxCalc, originalChildCalc, originalDriverCalc])

  const handleIncrement = (field: 'pax' | 'exPax' | 'child' | 'driver') => {
    switch (field) {
      case 'pax':
        setTempPax((p) => p + 1)
        break
      case 'exPax':
        setTempExPax((e) => e + 1)
        break
      case 'child':
        setTempChildPaid((c) => c + 1)
        break
      case 'driver':
        setTempDriver((d) => d + 1)
        break
    }
    setPreviewActive(false)
  }

  const handleDecrement = (field: 'pax' | 'exPax' | 'child' | 'driver') => {
    switch (field) {
      case 'pax':
        if (tempPax > 0) setTempPax((p) => p - 1)
        break
      case 'exPax':
        if (tempExPax > 0) setTempExPax((e) => e - 1)
        break
      case 'child':
        if (tempChildPaid > 0) setTempChildPaid((c) => c - 1)
        break
      case 'driver':
        if (tempDriver > 0) setTempDriver((d) => d - 1)
        break
    }
    setPreviewActive(false)
  }

  const handleTest = () => {
    setPreviewActive(true)
    toast.success('Preview updated')
  }

  const handleUpdate = async () => {
    setLoadingUpdate(true)
    try {
      const detailPayload = {
        pax: tempPax,
        ex_pax: tempExPax,
        driver: tempDriver,
        ex_pax_charge: exPaxCalc.total,
        driver_charge: driverCalc.total,
        child_paid_amount: childCalc.total,
      }
      await DetailService.update(selectedRoom.detail.detail_id, detailPayload)

      const checkinPayload = { child_paid: tempChildPaid }
      await CheckInService.update(selectedRoom.checkin.checkin_id, checkinPayload)

      const newTotal = parseFloat(updatedRow.totalAmount)

      const chargesPayload = {
        guest_id: selectedRoom.checkin.guest_id,
        room_id: selectedRoom.detail.room_id,
        ex_pax_count: tempExPax,
        ex_pax_price: exPaxCalc.price,
        ex_pax_tax: exPaxCalc.tax,
        ex_pax_tax_percent: exPaxCalc.taxPercent,
        ex_pax_total: exPaxCalc.total,
        child_count: tempChildPaid,
        child_price: childCalc.price,
        child_tax: childCalc.tax,
        child_tax_percent: childCalc.taxPercent,
        child_total: childCalc.total,
        driver_count: tempDriver,
        driver_price: driverCalc.price,
        driver_tax: driverCalc.tax,
        driver_tax_percent: driverCalc.taxPercent,
        driver_total: driverCalc.total,
        total_amount: newTotal,
      }

      const paxChargesId = selectedRoom.charges?.guest_room_charges_id || selectedRoom.charges?.id
      if (paxChargesId) {
        await GuestRoomChargesService.update(paxChargesId, chargesPayload)
      } else {
        const newChargesPayload = {
          checkin_id: selectedRoom.checkin.checkin_id,
          ...chargesPayload,
        }
        await GuestRoomChargesService.create(newChargesPayload)
      }

      await updateRoomChargeFolio(
        selectedRoom.checkin.checkin_id,
        selectedRoom.detail.detail_id,
        newTotal,
        selectedRoom.checkin.hotelid,
      )

      toast.success('Pax information updated successfully')
      onRefresh()
    } catch (error) {
      console.error('Update failed', error)
      toast.error('Failed to update pax information')
    } finally {
      setLoadingUpdate(false)
    }
  }

  const allHeaders = [
    { key: '#', label: '#' },
    { key: 'date', label: 'Date' },
    { key: 'guest', label: 'Guest' },
    { key: 'guestId', label: 'Guest ID' },
    { key: 'roomNo', label: 'Room N' },
    { key: 'type', label: 'Type' },
    { key: 'convCat', label: 'Conv. Cat' },
    { key: 'aDate', label: 'A_Date' },
    { key: 'aTime', label: 'A_Time' },
    { key: 'dDate', label: 'D_Date' },
    { key: 'dTime', label: 'D_Time' },
    { key: 'adults', label: 'Adults' },
    { key: 'pax', label: 'Pax' },
    { key: 'exPax', label: 'Ex_Pax' },
    { key: 'exPaxPrice', label: 'Ex_Pax Price' },
    { key: 'exPaxTaxPercent', label: 'Ex_Pax Tax %' },
    { key: 'exPaxTax', label: 'Ex_Pax Tax' },
    { key: 'exPaxTotal', label: 'Ex_Pax Total' },
    { key: 'childPaid', label: 'Child Paid' },
    { key: 'childUnpaid', label: 'Child Unpaid' },
    { key: 'childPrice', label: 'Child Price' },
    { key: 'childTaxPercent', label: 'Child Tax %' },
    { key: 'childTax', label: 'Child Tax' },
    { key: 'childTotal', label: 'Child Total' },
    { key: 'driver', label: 'Driver' },
    { key: 'driverPrice', label: 'Driver Price' },
    { key: 'driverTaxPercent', label: 'Driver Tax %' },
    { key: 'driverTax', label: 'Driver Tax' },
    { key: 'driverTotal', label: 'Driver Total' },
    { key: 'nights', label: 'Day' },
    { key: 'rate', label: 'Rate' },
    { key: 'discountPercent', label: 'Dis' },
    { key: 'discountAmt', label: 'Dis Amt' },
    { key: 'taxPercent', label: 'Tax %' },
    { key: 'taxAmount', label: 'Tax Amt' },
    { key: 'totalAmount', label: 'Total' },
  ]

  const isChanged = (field: 'exPax' | 'child' | 'driver') => {
    if (!previewActive) return false
    switch (field) {
      case 'exPax':
        return tempExPax !== originalExPax
      case 'child':
        return tempChildPaid !== originalChildPaid
      case 'driver':
        return tempDriver !== originalDriver
      default:
        return false
    }
  }

  const currentRow = previewActive ? updatedRow : originalRow

  return (
    <ActionBox title="Change In Pax" onClose={onClose}>
      <div className="border p-2 mb-2">
        <Row className="g-2">
          <Col md={3} className="border-end pe-2">
            <div className="d-flex align-items-center mb-1">
              <div style={{ width: '120px' }} className="fs-small">
                Pax/ExPax
              </div>
              <Button size="sm" variant="light" onClick={() => handleDecrement('exPax')}>
                -
              </Button>
              <input
                className="form-control form-control-sm"
                style={{ width: '50px' }}
                type="number"
                value={tempExPax}
                readOnly
              />
              <Button size="sm" variant="light" onClick={() => handleIncrement('exPax')}>
                +
              </Button>
            </div>
            <div className="d-flex align-items-center mb-1">
              <div style={{ width: '120px' }} className="fs-small">
                Child
              </div>
              <Button size="sm" variant="light" onClick={() => handleDecrement('child')}>
                -
              </Button>
              <input
                className="form-control form-control-sm"
                style={{ width: '50px' }}
                type="number"
                value={tempChildPaid}
                readOnly
              />
              <Button size="sm" variant="light" onClick={() => handleIncrement('child')}>
                +
              </Button>
            </div>
            <div className="d-flex align-items-center">
              <div style={{ width: '120px' }} className="fs-small">
                Driver
              </div>
              <Button size="sm" variant="light" onClick={() => handleDecrement('driver')}>
                -
              </Button>
              <input
                className="form-control form-control-sm"
                style={{ width: '50px' }}
                type="number"
                value={tempDriver}
                readOnly
              />
              <Button size="sm" variant="light" onClick={() => handleIncrement('driver')}>
                +
              </Button>
            </div>
          </Col>
          <Col md={6}>
            <table className="table table-bordered table-sm text-center mb-0 table-xs">
              <thead>
                <tr>
                  <th></th>
                  <th>Pax</th>
                  <th>ExPax</th>
                  <th>Child</th>
                  <th>Driver</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="text-start fw-bold">Max Limit For</td>
                  <td>{tempPax}</td>
                  <td>{tempExPax}</td>
                  <td>{tempChildPaid}</td>
                  <td>{tempDriver}</td>
                </tr>
                <tr>
                  <td className="text-start fw-bold">Current Occupied</td>
                  <td>{tempPax}</td>
                  <td>{tempExPax}</td>
                  <td>{tempChildPaid}</td>
                  <td>{tempDriver}</td>
                </tr>
              </tbody>
            </table>
          </Col>
        </Row>
      </div>

      <div className="action-table-container">
        <table className="action-table table table-bordered text-center align-middle">
          <thead className="table-light">
            <tr>
              {allHeaders.map((header) => (
                <th key={header.key}>{header.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentRow ? (
              <tr>
                <td>1</td>
                <td>{currentRow.date}</td>
                <td>{currentRow.guestName}</td>
                <td>{currentRow.guestId}</td>
                <td>{currentRow.roomNo}</td>
                <td>{currentRow.type}</td>
                <td>{currentRow.convCat}</td>
                <td>{currentRow.aDate}</td>
                <td>{currentRow.aTime}</td>
                <td>{currentRow.dDate}</td>
                <td>{currentRow.dTime}</td>
                <td>{currentRow.adults}</td>
                <td>{currentRow.pax}</td>
                <td className={isChanged('exPax') ? 'highlight-cell' : ''}>{currentRow.exPax}</td>
                <td>{currentRow.exPaxPrice}</td>
                <td>{currentRow.exPaxTaxPercent}%</td>
                <td>{currentRow.exPaxTax}</td>
                <td>{currentRow.exPaxTotal}</td>
                <td className={isChanged('child') ? 'highlight-cell' : ''}>
                  {currentRow.childPaid}
                </td>
                <td>{currentRow.childUnpaid}</td>
                <td>{currentRow.childPrice}</td>
                <td>{currentRow.childTaxPercent}%</td>
                <td>{currentRow.childTax}</td>
                <td>{currentRow.childTotal}</td>
                <td className={isChanged('driver') ? 'highlight-cell' : ''}>{currentRow.driver}</td>
                <td>{currentRow.driverPrice}</td>
                <td>{currentRow.driverTaxPercent}%</td>
                <td>{currentRow.driverTax}</td>
                <td>{currentRow.driverTotal}</td>
                <td>{currentRow.nights}</td>
                <td>{currentRow.rate}</td>
                <td>{currentRow.discountPercent}%</td>
                <td>{currentRow.discountAmt}</td>
                <td>{currentRow.taxPercent}%</td>
                <td>{currentRow.taxAmount}</td>
                <td>{currentRow.totalAmount}</td>
              </tr>
            ) : (
              <tr>
                <td colSpan={allHeaders.length} className="text-muted">
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="action-footer">
        <Button size="sm" variant="info" onClick={handleTest}>
          Test
        </Button>
        <Button size="sm" variant="success" onClick={handleUpdate} disabled={loadingUpdate}>
          {loadingUpdate ? 'Updating...' : 'Update'}
        </Button>
        <Button size="sm" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </ActionBox>
  )
}

// ================== Stay Amendments Component ==================
// ================== Stay Amendments Component (UPDATED - Day-wise storage) ==================
// ==================== StayAmendmentsComponent (FIXED) ====================
// KEY FIXES:
// 1. Per-room child count is fetched from guest_room_charges filtered by room_id
//    (not from selectedRoom.checkin.child_paid which is the whole-booking total).
// 2. Extra-charge rates (child, ex_pax, driver) are taken from detail fields
//    (child_paid_amount, ex_pax_charge, driver_charge) — same source HotelBookingPanel uses —
//    instead of re-fetching from category mode_charges which can differ.
// 3. computeStayModeCharge replaced by computeExtraCharge using per-person rate × count.
// 4. stayModeCharges / taxApi calls kept ONLY as fallback when detail fields are 0.
// 5. originalRow childPaid column is patched with resolvedChildCount (per-room) after
//    guest_room_charges are loaded — so the table never shows the booking-total child count.

interface StayAmendmentsProps {
  selectedRoom: OccupiedRoom
  onClose: () => void
  onRefresh: () => void
}

const StayAmendmentsComponent = ({ selectedRoom, onClose, onRefresh }: StayAmendmentsProps) => {
  const { user } = useAuthContext()
  const hotelId = user?.hotelid

  const [showDaysInput, setShowDaysInput] = useState(false)
  const [mode, setMode] = useState<'extend' | 'reduce'>('extend')
  const [days, setDays] = useState(1)
  const [loading, setLoading] = useState(false)
  const [previewActive, setPreviewActive] = useState(false)

  // Fallback category mode_charges (used only when detail fields are missing/zero)
  const [stayModeCharges, setStayModeCharges] = useState<any[]>([])
  const [stayTaxMap, setStayTaxMap] = useState<Map<number, number>>(new Map())

  // FIX: per-room child count resolved from guest_room_charges for this specific room
  const [perRoomChildCount, setPerRoomChildCount] = useState<number | null>(null)

  // Fetch category mode charges as fallback + per-room child count from guest_room_charges
  useEffect(() => {
    const fetchData = async () => {
      const detail = selectedRoom.detail
      const checkin = selectedRoom.checkin

      // ── 1. Fetch per-room child count from guest_room_charges ──────────────
      // selectedRoom.checkin.child_paid is the BOOKING-TOTAL child count.
      // guest_room_charges rows are per-room, so filtering by room_id gives the
      // correct per-room child count.
      try {
        const chargesRes = await GuestRoomChargesService.list({ checkin_id: checkin.checkin_id })
        const allCharges: any[] = chargesRes.data || []
        const roomCharges = allCharges
          .filter((c: any) => Number(c.room_id) === Number(detail.room_id))
          .sort(
            (a: any, b: any) =>
              new Date(b.checkin_datetime || 0).getTime() -
              new Date(a.checkin_datetime || 0).getTime(),
          )
        if (roomCharges.length > 0) {
          // Latest charge row has the correct per-room child_count
          setPerRoomChildCount(Number(roomCharges[0].child_count) || 0)
        } else {
          // No charge row yet → fall back to checkin.child_paid (might be booking total, best effort)
          setPerRoomChildCount(Number(checkin.child_paid) || 0)
        }
      } catch (err) {
        console.error('Failed to fetch guest_room_charges for child count', err)
        setPerRoomChildCount(Number(checkin.child_paid) || 0)
      }

      // ── 2. Fetch category mode_charges as fallback rates ───────────────────
      const effectiveCategoryId = detail.converted_category_id || detail.room_category_id
      if (!effectiveCategoryId) return
      try {
        const catRes = await RoomCategoryService.get(effectiveCategoryId)
        const catData = catRes.data || catRes
        setStayModeCharges(catData.mode_charges || [])

        const taxRes = await taxApi.list()
        const taxData = Array.isArray(taxRes) ? taxRes : taxRes?.data || []
        const map = new Map<number, number>()
        taxData.forEach((tax: any) => {
          const percent = tax.hotel_tax_value ?? tax.hotel_cgst + tax.hotel_sgst
          map.set(tax.hotel_taxid, percent)
        })
        setStayTaxMap(map)
      } catch (error) {
        console.error('Failed to load stay mode charges', error)
      }
    }
    fetchData()
  }, [selectedRoom])

  // ── Resolved per-room counts ───────────────────────────────────────────────
  // Use perRoomChildCount (from guest_room_charges) once loaded; while loading show checkin value.
  const resolvedChildCount =
    perRoomChildCount !== null ? perRoomChildCount : Number(selectedRoom.checkin.child_paid) || 0

  // ── Per-person rates from detail (same source as HotelBookingPanel) ────────
  // These are the actual rates stored at checkin time, always correct for this room.
  const detail = selectedRoom.detail
  const checkin = selectedRoom.checkin

  const exPaxCountOnDetail = Number(detail.ex_pax) || 0
  const driverCountOnDetail = Number(detail.driver) || 0

  // Per-person rates stored on detail:
  //   ex_pax_charge   = total ex_pax base charge (for exPaxCountOnDetail persons)
  //   child_paid_amount = total child base charge (for resolvedChildCount persons)
  //   driver_charge   = total driver base charge (for driverCountOnDetail persons)
  // Divide by count to get per-person rate; fall back to category mode_charges if zero.
  const getExPaxRatePerPerson = (): number => {
    const fromDetail = Number(detail.ex_pax_charge) || 0
    if (fromDetail > 0 && exPaxCountOnDetail > 0) return fromDetail / exPaxCountOnDetail
    // Fallback: category mode_charges
    const modeEntry = stayModeCharges.find((m: any) => m.mode_name === 'EXTRA_PAX')
    return modeEntry ? Number(modeEntry.charges) || 0 : 0
  }

  const getChildRatePerPerson = (): number => {
    const fromDetail = Number(detail.child_paid_amount) || 0
    if (fromDetail > 0 && resolvedChildCount > 0) return fromDetail / resolvedChildCount
    // Fallback: category mode_charges
    const modeEntry = stayModeCharges.find((m: any) => m.mode_name === 'CHILD')
    return modeEntry ? Number(modeEntry.charges) || 0 : 0
  }

  const getDriverRatePerPerson = (): number => {
    const fromDetail = Number(detail.driver_charge) || 0
    if (fromDetail > 0 && driverCountOnDetail > 0) return fromDetail / driverCountOnDetail
    // Fallback: category mode_charges
    const modeEntry = stayModeCharges.find((m: any) => m.mode_name === 'DRIVER')
    return modeEntry ? Number(modeEntry.charges) || 0 : 0
  }

  // Tax percent: use detail's own cgst+sgst/igst (consistent with original checkin)
  const getTaxPercent = (): number => {
    const igst = Number(detail.igst_percent) || 0
    if (igst > 0) return igst
    return (Number(detail.cgst_percent) || 0) + (Number(detail.sgst_percent) || 0)
  }

  // ── computeExtraCharge: unified helper replacing computeStayModeCharge ─────
  // Uses per-person rate × count × nights and applies the detail's own tax percent.
  const computeExtraCharge = (
    ratePerPerson: number,
    count: number,
    nights: number,
  ): {
    price: number
    tax: number
    taxPercent: number
    total: number
    perNightPrice: number
    perNightTax: number
    perNightTotal: number
  } => {
    if (count <= 0 || ratePerPerson <= 0) {
      return {
        price: 0,
        tax: 0,
        taxPercent: 0,
        total: 0,
        perNightPrice: 0,
        perNightTax: 0,
        perNightTotal: 0,
      }
    }
    const taxPct = getTaxPercent()
    const perNightPrice = ratePerPerson * count
    const perNightTax = (perNightPrice * taxPct) / 100
    const perNightTotal = perNightPrice + perNightTax
    return {
      price: perNightPrice * nights,
      tax: perNightTax * nights,
      taxPercent: taxPct,
      total: perNightTotal * nights,
      perNightPrice,
      perNightTax,
      perNightTotal,
    }
  }

  const currentNights = detail.no_of_days || 1
  const currentCheckinDate = detail.checkin_datetime
  const currentCheckoutDate = detail.checkout_datetime

  const getPreviewData = () => {
    if (!currentCheckinDate) return null
    const checkinDate = new Date(currentCheckinDate)
    const checkoutDate = new Date(currentCheckoutDate)
    const newCheckoutDate = new Date(checkoutDate)
    if (mode === 'extend') {
      newCheckoutDate.setDate(newCheckoutDate.getDate() + days)
    } else {
      newCheckoutDate.setDate(newCheckoutDate.getDate() - days)
      if (newCheckoutDate <= checkinDate) return null
    }
    const newNights = Math.max(
      1,
      Math.ceil((newCheckoutDate.getTime() - checkinDate.getTime()) / (1000 * 3600 * 24)),
    )
    return {
      newCheckoutDate,
      newNights,
      newCheckoutDateTime: newCheckoutDate.toISOString(),
    }
  }

  const originalRow = useMemo(() => {
    // buildRoomDataRowFromDetail reads checkin.child_paid which is the BOOKING-TOTAL
    // (e.g. 2 for a 2-room booking). We must override childPaid + child price fields
    // with the per-room values AFTER resolvedChildCount is available.
    const raw = buildRoomDataRowFromDetail(
      selectedRoom.detail,
      selectedRoom.checkin,
      selectedRoom.charges,
    )

    // Once perRoomChildCount is resolved, patch the row so the table shows correct values.
    // While still loading (perRoomChildCount === null) the raw row is shown as-is.
    if (perRoomChildCount === null) return raw

    const childCount = resolvedChildCount // per-room count (correct)
    const childCalc = computeExtraCharge(getChildRatePerPerson(), childCount, currentNights)

    return {
      ...raw,
      // Override child count column with per-room value
      childPaid: childCount,
      // Override child price/tax/total columns with per-room calculation
      childPrice: childCalc.price.toFixed(2),
      childTax: childCalc.tax.toFixed(2),
      childTaxPercent: childCalc.taxPercent,
      childTotal: childCalc.total.toFixed(2),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom, perRoomChildCount, stayModeCharges, stayTaxMap])

  const previewRow = useMemo(() => {
    if (!previewActive) return null
    const preview = getPreviewData()
    if (!preview) return null

    const updatedDetail = {
      ...detail,
      no_of_days: preview.newNights,
      checkout_datetime: preview.newCheckoutDateTime,
    }

    // FIX: use resolvedChildCount (per-room) instead of checkin.child_paid (booking total)
    const childCount = resolvedChildCount
    const exPaxCount = exPaxCountOnDetail
    const driverCount = driverCountOnDetail

    const exPaxCalc = computeExtraCharge(getExPaxRatePerPerson(), exPaxCount, preview.newNights)
    const childCalc = computeExtraCharge(getChildRatePerPerson(), childCount, preview.newNights)
    const driverCalc = computeExtraCharge(getDriverRatePerPerson(), driverCount, preview.newNights)

    const scaledCharges = {
      ...selectedRoom.charges,
      ex_pax_price: exPaxCalc.price,
      ex_pax_tax: exPaxCalc.tax,
      ex_pax_tax_percent: exPaxCalc.taxPercent,
      ex_pax_total: exPaxCalc.total,
      child_price: childCalc.price,
      child_tax: childCalc.tax,
      child_tax_percent: childCalc.taxPercent,
      child_total: childCalc.total,
      driver_price: driverCalc.price,
      driver_tax: driverCalc.tax,
      driver_tax_percent: driverCalc.taxPercent,
      driver_total: driverCalc.total,
    }
    return buildRoomDataRowFromDetail(updatedDetail, checkin, scaledCharges)
  }, [selectedRoom, previewActive, mode, days, resolvedChildCount, stayModeCharges, stayTaxMap])

  // Helper: Format local datetime string for API
  const formatLocalDateTimeString = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    const seconds = String(date.getSeconds()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`
  }

  // Helper: Create day-wise extension records
  const createDayWiseExtensionRecords = async (
    item: OccupiedRoom,
    extensionDays: number,
    exPaxCount: number,
    childCount: number, // FIX: caller must pass resolvedChildCount (per-room)
    driverCount: number,
    startDate: Date,
    userHotelId: number,
    userId: number | undefined,
  ) => {
    const detailData = item.detail
    const checkinData = item.checkin
    const roomTariff = detailData.room_tariff || 0
    const discountPercent = detailData.discount_percent || 0
    const serviceCharge = detailData.service_charge || 0
    const cgstPercent = detailData.cgst_percent || 0
    const sgstPercent = detailData.sgst_percent || 0
    const igstPercent = detailData.igst_percent || 0
    const cessPercent = detailData.cess_percent || 0

    const newDetailIds: number[] = []
    let totalExtensionAmount = 0

    const originalCheckinDatetime = detailData.checkin_datetime
      ? new Date(detailData.checkin_datetime)
      : startDate

    // Mark current detail as merged/inactive
    if (detailData.detail_id) {
      await DetailService.update(detailData.detail_id, { is_checkout: 1, merged: 1 })
    }

    for (let dayIndex = 0; dayIndex < extensionDays; dayIndex++) {
      const dayCheckinDate = new Date(startDate)
      dayCheckinDate.setDate(startDate.getDate() + dayIndex)
      const dayCheckoutDate = new Date(startDate)
      dayCheckoutDate.setDate(startDate.getDate() + dayIndex + 1)

      // Room charge for this day
      const discountAmount = (roomTariff * discountPercent) / 100
      const roomPriceAfterDiscount = roomTariff - discountAmount

      let roomCgstAmount = 0,
        roomSgstAmount = 0,
        roomIgstAmount = 0
      if (igstPercent > 0) {
        roomIgstAmount = (roomPriceAfterDiscount * igstPercent) / 100
      } else {
        roomCgstAmount = (roomPriceAfterDiscount * cgstPercent) / 100
        roomSgstAmount = (roomPriceAfterDiscount * sgstPercent) / 100
      }
      const roomCessAmount = (roomPriceAfterDiscount * cessPercent) / 100
      const roomServiceChargeAmount = (roomPriceAfterDiscount * serviceCharge) / 100
      const roomTaxAmount =
        roomIgstAmount + roomCgstAmount + roomSgstAmount + roomCessAmount + roomServiceChargeAmount
      const roomTotal = roomPriceAfterDiscount + roomTaxAmount

      // FIX: use per-person rates from detail (not category mode_charges)
      // computeExtraCharge(perPersonRate, count, nights=1)
      const exPaxCalc = computeExtraCharge(getExPaxRatePerPerson(), exPaxCount, 1)
      const childCalc = computeExtraCharge(getChildRatePerPerson(), childCount, 1)
      const driverCalc = computeExtraCharge(getDriverRatePerPerson(), driverCount, 1)

      const dayTotal = roomTotal + exPaxCalc.total + childCalc.total + driverCalc.total
      totalExtensionAmount += dayTotal

      const detailPayload = {
        checkin_id: checkinData.checkin_id,
        hotelid: userHotelId,
        room_id: detailData.room_id,
        room_number: detailData.room_number,
        room_category_id: detailData.room_category_id,
        room_category_name: detailData.room_category_name,
        converted_category_id: detailData.converted_category_id,
        converted_category_name: detailData.converted_category_name,
        checkin_datetime: formatLocalDateTimeString(originalCheckinDatetime),
        checkout_datetime: formatLocalDateTimeString(dayCheckoutDate),
        no_of_days: 1,
        adults: detailData.adults,
        pax: detailData.pax,
        ex_pax: exPaxCount,
        // FIX: store per-room child count (childCount is already per-room)
        child_unpaid: childCount,
        driver: driverCount,
        room_tariff: roomTariff,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        // FIX: store per-person rate × count (the total base charge for this day, not per-person rate)
        ex_pax_charge: exPaxCalc.perNightPrice,
        child_paid_amount: childCalc.perNightPrice,
        driver_charge: driverCalc.perNightPrice,
        cgst_percent: cgstPercent,
        cgst_amount: roomCgstAmount,
        sgst_percent: sgstPercent,
        sgst_amount: roomSgstAmount,
        igst_percent: igstPercent,
        igst_amount: roomIgstAmount,
        cess_percent: cessPercent,
        cess_amount: roomCessAmount,
        service_charge: serviceCharge,
        service_charge_amount: roomServiceChargeAmount,
        parent_detail_id: detailData.detail_id,
        is_checkout: 0,
        merged: 0,
        tax: roomTaxAmount,
        created_by_id: userId,
      }

      const detailRes = await DetailService.create(detailPayload)
      const newDetailId = detailRes.data?.detail_id
      if (!newDetailId) throw new Error(`Failed to create extension detail for day ${dayIndex + 1}`)
      newDetailIds.push(newDetailId)

      // guest_room_charges row for this day
      const chargePayload = {
        guest_id: Number(checkinData.guest_id) || 0,
        room_id: Number(detailData.room_id) || 0,
        category_id: detailData.room_category_id ? Number(detailData.room_category_id) : null,
        checkin_id: Number(checkinData.checkin_id) || 0,
        detail_id: newDetailId,
        pax_count: detailData.pax || 1,
        pax_price: roomTariff,
        pax_tax: roomTaxAmount,
        ex_pax_count: exPaxCount,
        ex_pax_price: exPaxCalc.perNightPrice,
        ex_pax_total: exPaxCalc.total,
        ex_pax_tax: exPaxCalc.perNightTax,
        ex_pax_tax_percent: exPaxCalc.taxPercent,
        // FIX: child_count stores the per-room count (resolvedChildCount passed as childCount)
        child_count: childCount,
        child_price: childCalc.perNightPrice,
        child_total: childCalc.total,
        child_tax: childCalc.perNightTax,
        child_tax_percent: childCalc.taxPercent,
        driver_count: driverCount,
        driver_price: driverCalc.perNightPrice,
        driver_total: driverCalc.total,
        driver_tax: driverCalc.perNightTax,
        driver_tax_percent: driverCalc.taxPercent,
        total_amount: dayTotal,
        checkin_datetime: formatLocalDateTimeString(dayCheckinDate),
        checkout_datetime: formatLocalDateTimeString(dayCheckoutDate),
      }
      await GuestRoomChargesService.create(chargePayload)

      // Folio entry for this day
      const description = `Day extension day ${dayIndex + 1}/${extensionDays} Room ${detailData.room_number}`
      await GuestFolioService.create({
        checkin_id: checkinData.checkin_id,
        hotelid: userHotelId,
        detail_id: newDetailId,
        transaction_type: 'Room Charge',
        transaction_datetime: formatLocalDateTimeString(new Date()),
        description,
        debit_amount: dayTotal,
        credit_amount: 0,
        reference_number: `EXT-${checkinData.checkin_id}-${detailData.room_id}-${Date.now()}-${dayIndex}`,
        payment_method: (item.checkin as any).payment_method || 'Cash',
      } as any)
    }

    return { totalExtensionAmount, newDetailIds }
  }

  const handleExtendClick = () => {
    setMode('extend')
    setShowDaysInput(true)
    setPreviewActive(false)
  }

  const handleReduceClick = () => {
    setMode('reduce')
    setShowDaysInput(true)
    setPreviewActive(false)
  }

  const handleTest = () => {
    if (days <= 0) {
      toast.error('Please enter a valid number of days')
      return
    }
    const preview = getPreviewData()
    if (!preview) {
      toast.error('Invalid date calculation. Cannot reduce below checkin date.')
      return
    }
    setPreviewActive(true)
    toast.success('Preview updated')
  }

  const handleUpdate = async () => {
    if (days <= 0) {
      toast.error('Please enter a valid number of days')
      return
    }

    const preview = getPreviewData()
    if (!preview) {
      toast.error('Invalid date calculation. Cannot reduce below checkin date.')
      return
    }

    if (!hotelId) {
      toast.error('Hotel ID not found')
      return
    }

    setLoading(true)
    try {
      const newCheckoutDateTime = preview.newCheckoutDateTime

      if (mode === 'extend') {
        const extensionDays = days
        const currentCheckoutDateObj = new Date(detail.checkout_datetime)

        // FIX: pass resolvedChildCount (per-room) — NOT checkin.child_paid (booking total)
        const exPaxCount = exPaxCountOnDetail
        const childCount = resolvedChildCount
        const driverCount = driverCountOnDetail

        const { totalExtensionAmount } = await createDayWiseExtensionRecords(
          selectedRoom,
          extensionDays,
          exPaxCount,
          childCount,
          driverCount,
          currentCheckoutDateObj,
          hotelId,
          user?.id,
        )

        const currentCheckin = await CheckInService.get(checkin.checkin_id)
        const currentTotal = currentCheckin.data?.total_amount || 0

        await CheckInService.update(checkin.checkin_id, {
          total_amount: currentTotal + totalExtensionAmount,
          checkout_datetime: newCheckoutDateTime,
        })

        toast.success(
          `Stay extended by ${extensionDays} day(s). Additional charge: ${formatAmount(totalExtensionAmount)}`,
        )
      } else if (mode === 'reduce') {
        const reductionDays = days

        const allDetailsRes = await DetailService.list({ checkin_id: checkin.checkin_id })
        const allDetails = (allDetailsRes.data || [])
          .filter((d: Detail) => d.is_checkout === 0 && d.parent_detail_id !== null)
          .sort(
            (a: Detail, b: Detail) =>
              new Date(a.checkout_datetime).getTime() - new Date(b.checkout_datetime).getTime(),
          )

        const extensionRecords = allDetails.filter(
          (d: Detail) => d.parent_detail_id === detail.detail_id,
        )

        if (extensionRecords.length < reductionDays) {
          toast.error(
            `Cannot reduce by ${reductionDays} days. Only ${extensionRecords.length} extension day(s) exist.`,
          )
          setLoading(false)
          return
        }

        const recordsToDelete = extensionRecords.slice(-reductionDays)
        let deletedTotalAmount = 0

        for (const record of recordsToDelete.reverse()) {
          const chargesRes = await GuestRoomChargesService.list({ checkin_id: checkin.checkin_id })
          const charges = (chargesRes.data || []).find((c: any) => c.detail_id === record.detail_id)
          if (charges && charges.guest_room_charges_id) {
            deletedTotalAmount += charges.total_amount || 0
            await GuestRoomChargesService.remove(charges.guest_room_charges_id)
          }

          const folioRes = await GuestFolioService.list({ checkin_id: checkin.checkin_id })
          const folio = (folioRes.data || []).find((f: any) => f.detail_id === record.detail_id)
          if (folio && folio.folio_id) {
            await GuestFolioService.remove(folio.folio_id)
          }

          await DetailService.remove(record.detail_id)
        }

        const currentCheckin = await CheckInService.get(checkin.checkin_id)
        const currentTotal = currentCheckin.data?.total_amount || 0

        await CheckInService.update(checkin.checkin_id, {
          total_amount: Math.max(0, currentTotal - deletedTotalAmount),
          checkout_datetime: newCheckoutDateTime,
        })

        if (extensionRecords.length === reductionDays) {
          await DetailService.update(detail.detail_id, { is_checkout: 0, merged: 0 })
        }

        toast.success(
          `Stay reduced by ${reductionDays} day(s). Refund amount: ${formatAmount(deletedTotalAmount)}`,
        )
      }

      onRefresh()
      onClose()
    } catch (error) {
      console.error('Failed to update stay:', error)
      toast.error((error as Error).message || 'Could not update stay')
    } finally {
      setLoading(false)
    }
  }

  const formatAmount = (amt: number): string => {
    const sign = amt < 0 ? '-' : ''
    return `Rs.${sign}${Math.abs(amt).toFixed(2)}/-`
  }

  const allHeaders = [
    { key: '#', label: '#' },
    { key: 'date', label: 'Date' },
    { key: 'guest', label: 'Guest' },
    { key: 'guestId', label: 'Guest ID' },
    { key: 'roomNo', label: 'Room N' },
    { key: 'type', label: 'Type' },
    { key: 'convCat', label: 'Conv. Cat' },
    { key: 'nights', label: 'Day' },
    { key: 'aDate', label: 'A_Date' },
    { key: 'aTime', label: 'A_Time' },
    { key: 'dDate', label: 'D_Date' },
    { key: 'dTime', label: 'D_Time' },
    { key: 'adults', label: 'Adults' },
    { key: 'pax', label: 'Pax' },
    { key: 'exPax', label: 'Ex_Pax' },
    { key: 'exPaxPrice', label: 'Ex_Pax Price' },
    { key: 'exPaxTaxPercent', label: 'Ex_Pax Tax %' },
    { key: 'exPaxTax', label: 'Ex_Pax Tax' },
    { key: 'exPaxTotal', label: 'Ex_Pax Total' },
    { key: 'childPaid', label: 'Child Paid' },
    { key: 'childUnpaid', label: 'Child Unpaid' },
    { key: 'childPrice', label: 'Child Price' },
    { key: 'childTaxPercent', label: 'Child Tax %' },
    { key: 'childTax', label: 'Child Tax' },
    { key: 'childTotal', label: 'Child Total' },
    { key: 'driver', label: 'Driver' },
    { key: 'driverPrice', label: 'Driver Price' },
    { key: 'driverTaxPercent', label: 'Driver Tax %' },
    { key: 'driverTax', label: 'Driver Tax' },
    { key: 'driverTotal', label: 'Driver Total' },
    { key: 'rate', label: 'Rate' },
    { key: 'discountPercent', label: 'Dis' },
    { key: 'discountAmt', label: 'Dis Amt' },
    { key: 'taxPercent', label: 'Tax %' },
    { key: 'taxAmount', label: 'Tax Amt' },
    { key: 'totalAmount', label: 'Total' },
  ]

  const isChanged = (field: keyof ReturnType<typeof buildRoomDataRowFromDetail>) => {
    if (!previewActive || !previewRow) return false
    return originalRow[field] !== previewRow[field]
  }

  const currentRow = previewActive ? previewRow : originalRow

  return (
    <ActionBox title="Stay Extension / Reduction" onClose={onClose} className="action-box-stay">
      <div className="d-flex flex-column align-items-center">
        <div className="text-center mb-1">
          <div style={{ fontSize: '50px' }}>🕒</div>
          <div className="mt-1">
            <strong>For Room :</strong> {selectedRoom.roomNo}
          </div>
          <div className="mt-1">
            <strong>Current Stay :</strong> {currentNights} Days
          </div>
        </div>

        <div className="d-flex justify-content-center gap-3 mb-1">
          <Button
            variant={mode === 'extend' && showDaysInput ? 'primary' : 'outline-primary'}
            size="sm"
            onClick={handleExtendClick}>
            Extend
          </Button>
          <Button
            variant={mode === 'reduce' && showDaysInput ? 'danger' : 'outline-danger'}
            size="sm"
            onClick={handleReduceClick}>
            Reduce
          </Button>
        </div>

        {showDaysInput && (
          <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
            <span className="fw-bold">Days:</span>
            <Form.Control
              type="number"
              size="sm"
              value={days}
              onChange={(e) => {
                setDays(Number(e.target.value))
                setPreviewActive(false)
              }}
              style={{ width: '80px' }}
              min={1}
            />
          </div>
        )}

        {!showDaysInput && (
          <div className="text-muted small mt-1">
            Click Extend or Reduce to change stay duration
          </div>
        )}

        {mode === 'extend' && showDaysInput && (
          <div className="text-info small mt-1">
            <i className="fi fi-rr-info me-1"></i>
            Each extended day will be stored as a separate record in the database
          </div>
        )}
      </div>

      <div className="action-table-container mt-1">
        <table className="action-table table table-bordered text-center align-middle">
          <thead className="table-light">
            <tr>
              {allHeaders.map((header) => (
                <th key={header.key}>{header.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentRow ? (
              <tr>
                <td>1</td>
                <td>{currentRow.date}</td>
                <td>{currentRow.guestName}</td>
                <td>{currentRow.guestId}</td>
                <td>{currentRow.roomNo}</td>
                <td>{currentRow.type}</td>
                <td>{currentRow.convCat}</td>
                <td className={isChanged('nights') ? 'highlight-cell' : ''}>{currentRow.nights}</td>
                <td>{currentRow.aDate}</td>
                <td>{currentRow.aTime}</td>
                <td className={isChanged('dDate') ? 'highlight-cell' : ''}>{currentRow.dDate}</td>
                <td className={isChanged('dTime') ? 'highlight-cell' : ''}>{currentRow.dTime}</td>
                <td>{currentRow.adults}</td>
                <td>{currentRow.pax}</td>
                <td>{currentRow.exPax}</td>
                <td>{currentRow.exPaxPrice}</td>
                <td>{currentRow.exPaxTaxPercent}%</td>
                <td>{currentRow.exPaxTax}</td>
                <td>{currentRow.exPaxTotal}</td>
                <td>{currentRow.childPaid}</td>
                <td>{currentRow.childUnpaid}</td>
                <td>{currentRow.childPrice}</td>
                <td>{currentRow.childTaxPercent}%</td>
                <td>{currentRow.childTax}</td>
                <td>{currentRow.childTotal}</td>
                <td>{currentRow.driver}</td>
                <td>{currentRow.driverPrice}</td>
                <td>{currentRow.driverTaxPercent}%</td>
                <td>{currentRow.driverTax}</td>
                <td>{currentRow.driverTotal}</td>
                <td className={isChanged('rate') ? 'highlight-cell' : ''}>{currentRow.rate}</td>
                <td className={isChanged('discountPercent') ? 'highlight-cell' : ''}>
                  {currentRow.discountPercent}%
                </td>
                <td className={isChanged('discountAmt') ? 'highlight-cell' : ''}>
                  {currentRow.discountAmt}
                </td>
                <td className={isChanged('taxPercent') ? 'highlight-cell' : ''}>
                  {currentRow.taxPercent}%
                </td>
                <td className={isChanged('taxAmount') ? 'highlight-cell' : ''}>
                  {currentRow.taxAmount}
                </td>
                <td className={isChanged('totalAmount') ? 'highlight-cell' : ''}>
                  {currentRow.totalAmount}
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan={allHeaders.length} className="text-muted">
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="action-footer">
        {showDaysInput && (
          <Button size="sm" variant="info" onClick={handleTest} disabled={loading}>
            Test
          </Button>
        )}
        <Button size="sm" variant="success" onClick={handleUpdate} disabled={loading}>
          {loading ? 'Applying...' : 'Update'}
        </Button>
        <Button size="sm" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </ActionBox>
  )
}
// ================== Change Room Category Component ==================
// ================== Change Room Category Component ==================
interface ChangeRoomCategoryProps {
  selectedRoom: OccupiedRoom
  roomCategories: Array<{ room_category_id: number; category_name: string }>
  allRoomsDetails: Detail[]
  onClose: () => void
  onRefresh: () => void
}

// Helper: fetch tax percentages from tax_type ID (same as CheckInForm)
const fetchTaxPercentages = async (
  taxTypeId: number | null | undefined,
): Promise<{
  cgst: number
  sgst: number
  igst: number
  cess: number
  total: number
}> => {
  if (!taxTypeId) {
    return { cgst: 0, sgst: 0, igst: 0, cess: 0, total: 0 }
  }
  try {
    const res = await taxApi.list()
    const taxes = res.data || []
    const tax = taxes.find((t: any) => t.hotel_taxid === taxTypeId)
    if (!tax) return { cgst: 0, sgst: 0, igst: 0, cess: 0, total: 0 }

    // IGST takes precedence over CGST+SGST
    if (tax.hotel_igst && tax.hotel_igst > 0) {
      const igst = Number(tax.hotel_igst) || 0
      return { cgst: 0, sgst: 0, igst, cess: 0, total: igst }
    } else {
      const cgst = Number(tax.hotel_cgst) || 0
      const sgst = Number(tax.hotel_sgst) || 0
      const cess = Number(tax.hotel_cess) || 0
      return { cgst, sgst, igst: 0, cess, total: cgst + sgst + cess }
    }
  } catch (error) {
    console.error('Failed to fetch tax details:', error)
    return { cgst: 0, sgst: 0, igst: 0, cess: 0, total: 0 }
  }
}

// Helper: compute one day's room charges including taxes (same as CheckInForm)
const computeDayTaxes = (
  roomTariff: number,
  discountPercent: number,
  tax: { cgst: number; sgst: number; igst: number; cess: number; total: number },
) => {
  const discountAmount = (roomTariff * discountPercent) / 100
  const afterDiscount = roomTariff - discountAmount

  let cgstAmount = 0,
    sgstAmount = 0,
    igstAmount = 0,
    cessAmount = 0
  if (tax.igst > 0) {
    igstAmount = (afterDiscount * tax.igst) / 100
  } else {
    cgstAmount = (afterDiscount * tax.cgst) / 100
    sgstAmount = (afterDiscount * tax.sgst) / 100
  }
  cessAmount = (afterDiscount * tax.cess) / 100

  const taxAmount = igstAmount + cgstAmount + sgstAmount + cessAmount
  const totalAfterTax = afterDiscount + taxAmount

  return {
    discountAmount,
    cgstPercent: tax.cgst,
    cgstAmount,
    sgstPercent: tax.sgst,
    sgstAmount,
    igstPercent: tax.igst,
    igstAmount,
    cessPercent: tax.cess,
    cessAmount,
    taxPercent: tax.total,
    taxAmount,
    afterDiscount,
    totalAfterTax,
  }
}

// Helper: compute extra charges (ex-pax, child, driver) using new category's mode_charges
const computeExtraChargesForCategory = (
  modeCharges: any[],
  taxMap: Map<number, number>,
  exPaxCount: number,
  childCount: number,
  driverCount: number,
  nights: number,
) => {
  const extraPaxMode = modeCharges.find((m: any) => m.mode_name === 'EXTRA_PAX')
  const childMode = modeCharges.find((m: any) => m.mode_name === 'CHILD')
  const driverMode = modeCharges.find((m: any) => m.mode_name === 'DRIVER')

  const compute = (mode: any, count: number) => {
    if (!mode || count <= 0) return { price: 0, tax: 0, taxPercent: 0, total: 0, perNightPrice: 0 }

    // Get per night charges from mode
    const perNightPrice = mode.charges * count

    let taxPercent = 0
    if (mode.is_tax_applicable && mode.tax_type) {
      taxPercent = taxMap.get(Number(mode.tax_type)) || 0
    }

    const perNightTax = (perNightPrice * taxPercent) / 100
    const perNightTotal = perNightPrice + perNightTax

    // Multiply by number of nights for total
    const totalPrice = perNightPrice * nights
    const totalTax = perNightTax * nights
    const totalAmount = perNightTotal * nights

    return {
      price: totalPrice,
      tax: totalTax,
      taxPercent,
      total: totalAmount,
      perNightPrice, // Added for per night breakdown
      perNightTax,
      perNightTotal,
    }
  }

  return {
    exPax: compute(extraPaxMode, exPaxCount),
    child: compute(childMode, childCount),
    driver: compute(driverMode, driverCount),
  }
}

const ChangeRoomCategoryComponent = ({
  selectedRoom,
  roomCategories,
  allRoomsDetails,
  onClose,
  onRefresh,
}: ChangeRoomCategoryProps) => {
  const originalCategory =
    selectedRoom.detail.converted_category_name || selectedRoom.detail.room_category_name || ''
  const originalTariff = selectedRoom.detail.room_tariff || 0

  // Filter out the previous category from the new category dropdown
  const filteredCategories = useMemo(() => {
    return roomCategories.filter((c) => c.category_name !== originalCategory)
  }, [roomCategories, originalCategory])

  const [tempNewCategory, setTempNewCategory] = useState(originalCategory)
  const [previewActive, setPreviewActive] = useState(false)
  const [loading, setLoading] = useState(false)

  const [newCategoryId, setNewCategoryId] = useState<number | null>(null)
  const [newTariff, setNewTariff] = useState<number | null>(null)
  const [newModeCharges, setNewModeCharges] = useState<any[]>([])
  const [newTax, setNewTax] = useState<{
    cgst: number
    sgst: number
    igst: number
    cess: number
    total: number
  } | null>(null)
  const [taxMap, setTaxMap] = useState<Map<number, number>>(new Map())
  const [futureRecords, setFutureRecords] = useState<{ details: Detail[]; charges: any[] }>({
    details: [],
    charges: [],
  })
  const [fetchingFutureRecords, setFetchingFutureRecords] = useState(false)

  // Reset state when original category changes
  useEffect(() => {
    setTempNewCategory(originalCategory)
    setPreviewActive(false)
    setNewCategoryId(null)
    setNewTariff(null)
    setNewModeCharges([])
    setNewTax(null)
  }, [originalCategory])

  // Automatically select a valid (different) category when filtered list changes
  useEffect(() => {
    if (tempNewCategory === originalCategory && filteredCategories.length > 0) {
      // If currently selected category is the original (which is now excluded), pick the first available
      setTempNewCategory(filteredCategories[0].category_name)
    }
  }, [filteredCategories, originalCategory, tempNewCategory])

  // Fetch category details and future records when a new category (different from original) is selected
  useEffect(() => {
    if (!tempNewCategory || tempNewCategory === originalCategory || !selectedRoom) {
      return
    }

    const fetchData = async () => {
      setFetchingFutureRecords(true)
      try {
        const catObj = roomCategories.find((c) => c.category_name === tempNewCategory)
        if (!catObj) return
        setNewCategoryId(catObj.room_category_id)

        // 1. Fetch full category details (tariffs, mode_charges)
        const catRes = await RoomCategoryService.get(catObj.room_category_id)
        const fullCat = catRes.data || catRes
        const modeCharges = fullCat.mode_charges || []
        setNewModeCharges(modeCharges)

        // Debug: Log driver charges from mode
        const driverMode = modeCharges.find((m: any) => m.mode_name === 'DRIVER')
        console.log('Driver Mode Charges:', driverMode)

        // 2. Get tariff based on room's pax count (fallback to first tariff)
        const paxCount = selectedRoom.detail.pax || 1
        const tariffObj = (fullCat.tariffs || []).find((t: any) => t.no_of_pax === paxCount)
        const tariff = tariffObj ? tariffObj.room_tariff : fullCat.tariffs?.[0]?.room_tariff || 0
        setNewTariff(tariff)

        // 3. Get tax type ID from the tariff
        let taxTypeId = tariffObj?.tax_type
        if (!taxTypeId && fullCat.tariffs?.length) {
          taxTypeId = fullCat.tariffs[0].tax_type
        }
        // 4. Fetch tax percentages
        const taxPercentages = await fetchTaxPercentages(Number(taxTypeId) || null)
        setNewTax(taxPercentages)

        // 5. Build tax map for extra charges (from all taxes)
        const taxRes = await taxApi.list()
        const allTaxes = taxRes.data || []
        const map = new Map<number, number>()
        allTaxes.forEach((t: any) => {
          // Calculate total tax percentage
          let totalTax = 0
          if (t.hotel_igst && t.hotel_igst > 0) {
            totalTax = Number(t.hotel_igst)
          } else {
            totalTax =
              (Number(t.hotel_cgst) || 0) +
              (Number(t.hotel_sgst) || 0) +
              (Number(t.hotel_cess) || 0)
          }
          map.set(t.hotel_taxid, totalTax)
        })
        setTaxMap(map)

        // 6. Fetch future records (today and future) for this room
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const detailsRes = await DetailService.list({ checkin_id: selectedRoom.checkin.checkin_id })
        const allDetails = detailsRes.data || []
        const futureDetails = allDetails.filter((d: Detail) => {
          const detailCheckinDate = new Date(d.checkin_datetime)
          detailCheckinDate.setHours(0, 0, 0, 0)
          return (
            detailCheckinDate >= today &&
            d.is_checkout === 0 &&
            d.room_id === selectedRoom.detail.room_id
          )
        })

        const chargesRes = await GuestRoomChargesService.list({
          checkin_id: selectedRoom.checkin.checkin_id,
        })
        const allCharges = chargesRes.data || []
        const futureCharges = allCharges.filter((c: any) => {
          if (!c.checkin_datetime) return false
          const chargeCheckinDate = new Date(c.checkin_datetime)
          chargeCheckinDate.setHours(0, 0, 0, 0)
          return chargeCheckinDate >= today && c.room_id === selectedRoom.detail.room_id
        })

        setFutureRecords({ details: futureDetails, charges: futureCharges })
      } catch (error) {
        console.error('Failed to fetch category data:', error)
        toast.error('Could not load category details')
      } finally {
        setFetchingFutureRecords(false)
      }
    }

    fetchData()
  }, [tempNewCategory, originalCategory, roomCategories, selectedRoom])

  // Build preview row
  const previewRow = useMemo(() => {
    if (!previewActive || !newTariff || !newTax) return null

    const nights = selectedRoom.detail.no_of_days || 1
    const discountPercent = selectedRoom.detail.discount_percent || 0

    const roomCalc = computeDayTaxes(newTariff, discountPercent, newTax)

    const exPaxCount = selectedRoom.detail.ex_pax || 0
    const childCount = selectedRoom.checkin.child_paid || 0
    const driverCount = selectedRoom.detail.driver || 0

    console.log('Driver Count:', driverCount, 'Nights:', nights)

    const extras = computeExtraChargesForCategory(
      newModeCharges,
      taxMap,
      exPaxCount,
      childCount,
      driverCount,
      nights,
    )

    console.log('Driver Extra Charges:', extras.driver)

    const updatedDetail = {
      ...selectedRoom.detail,
      converted_category_name: tempNewCategory,
      room_tariff: newTariff,
      cgst_percent: roomCalc.cgstPercent,
      cgst_amount: roomCalc.cgstAmount,
      sgst_percent: roomCalc.sgstPercent,
      sgst_amount: roomCalc.sgstAmount,
      igst_percent: roomCalc.igstPercent,
      igst_amount: roomCalc.igstAmount,
      cess_percent: roomCalc.cessPercent,
      cess_amount: roomCalc.cessAmount,
      tax: roomCalc.taxAmount,
      discount_amount: roomCalc.discountAmount,
    }

    const charges = {
      ex_pax_price: extras.exPax.price,
      ex_pax_tax: extras.exPax.tax,
      ex_pax_tax_percent: extras.exPax.taxPercent,
      ex_pax_total: extras.exPax.total,
      child_price: extras.child.price,
      child_tax: extras.child.tax,
      child_tax_percent: extras.child.taxPercent,
      child_total: extras.child.total,
      driver_price: extras.driver.price,
      driver_tax: extras.driver.tax,
      driver_tax_percent: extras.driver.taxPercent,
      driver_total: extras.driver.total,
    }

    return buildRoomDataRowFromDetail(updatedDetail, selectedRoom.checkin, charges)
  }, [selectedRoom, tempNewCategory, previewActive, newTariff, newTax, newModeCharges, taxMap])

  const originalRow = buildRoomDataRowFromDetail(
    selectedRoom.detail,
    selectedRoom.checkin,
    selectedRoom.charges,
  )

  const handleTest = () => {
    if (!tempNewCategory || tempNewCategory === originalCategory) {
      toast.error('Please select a different category')
      return
    }
    if (!newTariff) {
      toast.error('Tariff not loaded for this category')
      return
    }
    if (!newTax) {
      toast.error('Tax configuration not loaded')
      return
    }

    // Verify driver mode exists in new category
    const driverMode = newModeCharges.find((m: any) => m.mode_name === 'DRIVER')
    if (selectedRoom.detail.driver > 0 && !driverMode) {
      toast.error(
        'New category does not have driver charges configured. Driver charges will be set to 0.',
      )
    }

    setPreviewActive(true)
    toast.success(`Preview ready – Tax: ${newTax.total}%`)
  }

  const handleUpdate = async () => {
    if (originalCategory === tempNewCategory) {
      toast.error('No change in category')
      return
    }
    if (!newCategoryId || !newTariff || !newTax) {
      toast.error('Category data not fully loaded')
      return
    }

    setLoading(true)
    try {
      const discountPercent = selectedRoom.detail.discount_percent || 0
      const nights = selectedRoom.detail.no_of_days || 1

      const roomCalc = computeDayTaxes(newTariff, discountPercent, newTax)

      const exPaxCount = selectedRoom.detail.ex_pax || 0
      const childCount = selectedRoom.checkin.child_paid || 0
      const driverCount = selectedRoom.detail.driver || 0
      const currentExtras = computeExtraChargesForCategory(
        newModeCharges,
        taxMap,
        exPaxCount,
        childCount,
        driverCount,
        nights,
      )

      // ---- 1. Update all future detail records for this room ----
      for (const detail of futureRecords.details) {
        const detailNights = detail.no_of_days || 1
        const detailDiscount = detail.discount_percent || 0
        const detailRoomCalc = computeDayTaxes(newTariff, detailDiscount, newTax)

        const detailExtras = computeExtraChargesForCategory(
          newModeCharges,
          taxMap,
          detail.ex_pax || 0,
          detail.child_paid_amount > 0 ? 1 : 0,
          detail.driver || 0,
          detailNights,
        )

        // Calculate per night driver charge
        const perNightDriverCharge =
          detail.driver && detail.driver > 0 && detailExtras.driver.price > 0
            ? detailExtras.driver.price / detailNights
            : 0

        await DetailService.update(detail.detail_id, {
          converted_category_id: newCategoryId,
          converted_category_name: tempNewCategory,
          room_tariff: newTariff,
          cgst_percent: detailRoomCalc.cgstPercent,
          cgst_amount: detailRoomCalc.cgstAmount,
          sgst_percent: detailRoomCalc.sgstPercent,
          sgst_amount: detailRoomCalc.sgstAmount,
          igst_percent: detailRoomCalc.igstPercent,
          igst_amount: detailRoomCalc.igstAmount,
          cess_percent: detailRoomCalc.cessPercent,
          cess_amount: detailRoomCalc.cessAmount,
          tax: detailRoomCalc.taxAmount,
          discount_amount: detailRoomCalc.discountAmount,
          ex_pax_charge: detailExtras.exPax.price > 0 ? detailExtras.exPax.price / detailNights : 0,
          driver_charge: perNightDriverCharge,
          child_paid_amount:
            detailExtras.child.price > 0 ? detailExtras.child.price / detailNights : 0,
        })
      }

      // ---- 2. Update all future guest_room_charges for this room ----
      for (const charge of futureRecords.charges) {
        const chargeId = charge.guest_room_charges_id
        const chargeNights = 1

        const chargeExtras = computeExtraChargesForCategory(
          newModeCharges,
          taxMap,
          charge.ex_pax_count || 0,
          charge.child_count || 0,
          charge.driver_count || 0,
          chargeNights,
        )

        const chargeRoomCalc = computeDayTaxes(newTariff, charge.pax_tax_percent || 0, newTax)

        await GuestRoomChargesService.update(chargeId, {
          guest_id: selectedRoom.checkin.guest_id,
          room_id: selectedRoom.detail.room_id,
          checkin_id: selectedRoom.checkin.checkin_id,
          category_id: newCategoryId,
          pax_price: newTariff,
          pax_tax: chargeRoomCalc.taxAmount,
          ex_pax_price: chargeExtras.exPax.price,
          ex_pax_tax: chargeExtras.exPax.tax,
          ex_pax_tax_percent: chargeExtras.exPax.taxPercent,
          ex_pax_total: chargeExtras.exPax.total,
          child_price: chargeExtras.child.price,
          child_tax: chargeExtras.child.tax,
          child_tax_percent: chargeExtras.child.taxPercent,
          child_total: chargeExtras.child.total,
          driver_price: chargeExtras.driver.price,
          driver_tax: chargeExtras.driver.tax,
          driver_tax_percent: chargeExtras.driver.taxPercent,
          driver_total: chargeExtras.driver.total,
          total_amount:
            chargeRoomCalc.totalAfterTax +
            chargeExtras.exPax.total +
            chargeExtras.child.total +
            chargeExtras.driver.total,
        })
      }

      // ---- 3. Update current detail (only if its checkout date is today or future) ----
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const currentDetailDate = new Date(selectedRoom.detail.checkout_datetime)
      currentDetailDate.setHours(0, 0, 0, 0)

      if (currentDetailDate >= today) {
        // Calculate per night driver charge for current detail
        const perNightDriverCharge =
          driverCount > 0 && currentExtras.driver.price > 0
            ? currentExtras.driver.price / nights
            : 0

        await DetailService.update(selectedRoom.detail.detail_id, {
          converted_category_id: newCategoryId,
          converted_category_name: tempNewCategory,
          room_tariff: newTariff,
          cgst_percent: roomCalc.cgstPercent,
          cgst_amount: roomCalc.cgstAmount,
          sgst_percent: roomCalc.sgstPercent,
          sgst_amount: roomCalc.sgstAmount,
          igst_percent: roomCalc.igstPercent,
          igst_amount: roomCalc.igstAmount,
          cess_percent: roomCalc.cessPercent,
          cess_amount: roomCalc.cessAmount,
          tax: roomCalc.taxAmount,
          discount_amount: roomCalc.discountAmount,
          ex_pax_charge: currentExtras.exPax.price > 0 ? currentExtras.exPax.price / nights : 0,
          driver_charge: perNightDriverCharge,
          child_paid_amount: currentExtras.child.price > 0 ? currentExtras.child.price / nights : 0,
        })
      }

      // ---- 4. Update current guest_room_charges if exists and is future ----
      if (selectedRoom.charges) {
        const chargeDate = selectedRoom.charges.checkout_datetime
          ? new Date(selectedRoom.charges.checkout_datetime)
          : new Date()
        chargeDate.setHours(0, 0, 0, 0)

        if (chargeDate >= today) {
          const chargesId = selectedRoom.charges.guest_room_charges_id || selectedRoom.charges.id
          if (chargesId) {
            await GuestRoomChargesService.update(chargesId, {
              guest_id: selectedRoom.checkin.guest_id,
              room_id: selectedRoom.detail.room_id,
              checkin_id: selectedRoom.checkin.checkin_id,
              category_id: newCategoryId,
              pax_price: newTariff,
              pax_tax: roomCalc.taxAmount,
              ex_pax_price: currentExtras.exPax.price,
              ex_pax_tax: currentExtras.exPax.tax,
              ex_pax_tax_percent: currentExtras.exPax.taxPercent,
              ex_pax_total: currentExtras.exPax.total,
              child_price: currentExtras.child.price,
              child_tax: currentExtras.child.tax,
              child_tax_percent: currentExtras.child.taxPercent,
              child_total: currentExtras.child.total,
              driver_price: currentExtras.driver.price,
              driver_tax: currentExtras.driver.tax,
              driver_tax_percent: currentExtras.driver.taxPercent,
              driver_total: currentExtras.driver.total,
              total_amount:
                roomCalc.totalAfterTax +
                currentExtras.exPax.total +
                currentExtras.child.total +
                currentExtras.driver.total,
            })
          }
        }
      }

      // ---- 5. Update folio entry for the current day ----
      const updatedDetailForFolio = {
        ...selectedRoom.detail,
        converted_category_name: tempNewCategory,
        room_tariff: newTariff,
        cgst_percent: roomCalc.cgstPercent,
        sgst_percent: roomCalc.sgstPercent,
        igst_percent: roomCalc.igstPercent,
        cess_percent: roomCalc.cessPercent,
        tax: roomCalc.taxAmount,
        discount_amount: roomCalc.discountAmount,
      }
      const updatedRow = buildRoomDataRowFromDetail(updatedDetailForFolio, selectedRoom.checkin, {
        ex_pax_total: currentExtras.exPax.total,
        child_total: currentExtras.child.total,
        driver_total: currentExtras.driver.total,
      })

      await updateRoomChargeFolio(
        selectedRoom.checkin.checkin_id,
        selectedRoom.detail.detail_id,
        parseFloat(updatedRow.totalAmount),
        selectedRoom.checkin.hotelid,
      )

      // ---- 6. Update checkin_master converted_category ----
      await CheckInService.update(selectedRoom.checkin.checkin_id, {
        converted_category: tempNewCategory,
      })

      toast.success(`Category changed to ${tempNewCategory} with tax ${newTax.total}%`)
      onRefresh()
      onClose()
    } catch (error) {
      console.error('Category change failed:', error)
      toast.error('Could not update category')
    } finally {
      setLoading(false)
    }
  }

  const currentRow = previewActive ? previewRow : originalRow
  const isCategoryChanged = previewActive && tempNewCategory !== originalCategory
  const isRateChanged = previewActive && newTariff !== null && newTariff !== originalTariff



  const allHeaders: Array<{ key: string; label: string }> = [
    { key: '#', label: '#' },
    { key: 'date', label: 'Date' },
    { key: 'guest', label: 'Guest' },
    { key: 'guestId', label: 'Guest ID' },
    { key: 'roomNo', label: 'Room N' },
    { key: 'type', label: 'Type' },
    { key: 'convCat', label: 'Conv. Cat' },
    { key: 'aDate', label: 'A_Date' },
    { key: 'aTime', label: 'A_Time' },
    { key: 'dDate', label: 'D_Date' },
    { key: 'dTime', label: 'D_Time' },
    { key: 'adults', label: 'Adults' },
    { key: 'pax', label: 'Pax' },
    { key: 'exPax', label: 'Ex_Pax' },
    { key: 'exPaxPrice', label: 'Ex_Pax Price' },
    { key: 'exPaxTaxPercent', label: 'Ex_Pax Tax %' },
    { key: 'exPaxTax', label: 'Ex_Pax Tax' },
    { key: 'exPaxTotal', label: 'Ex_Pax Total' },
    { key: 'childPaid', label: 'Child Paid' },
    { key: 'childUnpaid', label: 'Child Unpaid' },
    { key: 'childPrice', label: 'Child Price' },
    { key: 'childTaxPercent', label: 'Child Tax %' },
    { key: 'childTax', label: 'Child Tax' },
    { key: 'childTotal', label: 'Child Total' },
    { key: 'driver', label: 'Driver' },
    { key: 'driverPrice', label: 'Driver Price' },
    { key: 'driverTaxPercent', label: 'Driver Tax %' },
    { key: 'driverTax', label: 'Driver Tax' },
    { key: 'driverTotal', label: 'Driver Total' },
    { key: 'nights', label: 'Day' },
    { key: 'rate', label: 'Rate' },
    { key: 'discountPercent', label: 'Dis' },
    { key: 'discountAmt', label: 'Dis Amt' },
    { key: 'taxPercent', label: 'Tax %' },
    { key: 'taxAmount', label: 'Tax Amt' },
    { key: 'totalAmount', label: 'Total' },
  ]

  return (
    <ActionBox title="Change Room Category" onClose={onClose}>
      <div className="border p-2 mb-2">
        <Row className="align-items-center">
          <Col md={2} className="fw-bold">
            Previous Category
          </Col>
          <Col md={3}>
            <Form.Select size="sm" value={originalCategory} className="fs-small" disabled>
              {roomCategories.map((c) => (
                <option key={c.room_category_id} value={c.category_name}>
                  {c.category_name}
                </option>
              ))}
            </Form.Select>
          </Col>
          <Col md={2} className="fw-bold">
            New Category
          </Col>
          <Col md={3}>
            <Form.Select
              size="sm"
              value={tempNewCategory}
              onChange={(e) => setTempNewCategory(e.target.value)}
              className="fs-small"
              disabled={loading || filteredCategories.length === 0}>
              {filteredCategories.map((c) => (
                <option key={c.room_category_id} value={c.category_name}>
                  {c.category_name}
                </option>
              ))}
            </Form.Select>
          </Col>
        </Row>

        {filteredCategories.length === 0 && (
          <div className="mt-2 text-danger small">
            <i className="fi fi-rr-exclamation me-1"></i>
            No other room categories available to change.
          </div>
        )}
      </div>

      <div className="action-table-container">
        <table className="action-table table table-bordered text-center align-middle">
          <thead className="table-light">
            <tr>
              {allHeaders.map((h) => (
                <th key={h.key}>{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentRow ? (
              <tr>
                <td>1</td>
                <td>{currentRow.date}</td>
                <td>{currentRow.guestName}</td>
                <td>{currentRow.guestId}</td>
                <td>{currentRow.roomNo}</td>
                <td>{currentRow.type}</td>
                <td className={isCategoryChanged ? 'highlight-cell' : ''}>{currentRow.convCat}</td>
                <td>{currentRow.aDate}</td>
                <td>{currentRow.aTime}</td>
                <td>{currentRow.dDate}</td>
                <td>{currentRow.dTime}</td>
                <td>{currentRow.adults}</td>
                <td>{currentRow.pax}</td>
                <td>{currentRow.exPax}</td>
                <td>{currentRow.exPaxPrice}</td>
                <td>{currentRow.exPaxTaxPercent}%</td>
                <td>{currentRow.exPaxTax}</td>
                <td>{currentRow.exPaxTotal}</td>
                <td>{currentRow.childPaid}</td>
                <td>{currentRow.childUnpaid}</td>
                <td>{currentRow.childPrice}</td>
                <td>{currentRow.childTaxPercent}%</td>
                <td>{currentRow.childTax}</td>
                <td>{currentRow.childTotal}</td>
                <td>{currentRow.driver}</td>
                <td>{currentRow.driverPrice}</td>
                <td>{currentRow.driverTaxPercent}%</td>
                <td>{currentRow.driverTax}</td>
                <td>{currentRow.driverTotal}</td>
                <td>{currentRow.nights}</td>
                <td className={isRateChanged ? 'highlight-cell' : ''}>{currentRow.rate}</td>
                <td>{currentRow.discountPercent}%</td>
                <td>{currentRow.discountAmt}</td>
                <td className={isCategoryChanged ? 'highlight-cell' : ''}>
                  {currentRow.taxPercent}%
                </td>
                <td className={isCategoryChanged ? 'highlight-cell' : ''}>
                  {currentRow.taxAmount}
                </td>
                <td className={isRateChanged ? 'highlight-cell' : ''}>{currentRow.totalAmount}</td>
              </tr>
            ) : (
              <tr>
                <td colSpan={allHeaders.length} className="text-muted">
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="action-footer">
        <Button
          size="sm"
          variant="info"
          onClick={handleTest}
          disabled={
            loading ||
            fetchingFutureRecords ||
            !newTariff ||
            !newTax ||
            tempNewCategory === originalCategory
          }>
          {fetchingFutureRecords ? 'Loading...' : 'Test'}
        </Button>
        <Button size="sm" variant="success" onClick={handleUpdate} disabled={loading}>
          {loading ? 'Updating...' : 'Update'}
        </Button>
        <Button size="sm" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </ActionBox>
  )
}

// ================== Change Guest Info Component (FIXED) ==================
interface ChangeGuestInfoProps {
  selectedRoom: OccupiedRoom
  allRoomsDetails: Detail[]
  onClose: () => void
  onRefresh: () => void
}

const ChangeGuestInfoComponent = ({
  selectedRoom,
  allRoomsDetails,
  onClose,
  onRefresh,
}: ChangeGuestInfoProps) => {
  const { user } = useAuthContext()
  const hotelId = user?.hotelid

  const [deleteChecked, setDeleteChecked] = useState(false)
  const [guestName, setGuestName] = useState(selectedRoom.checkin.guest_name || '')
  const [companyName, setCompanyName] = useState(
    selectedRoom.company?.company_name || selectedRoom.checkin.company_name || '',
  )
  const [primaryChecked, setPrimaryChecked] = useState(true)
  const [loadingUpdate, setLoadingUpdate] = useState(false)
  const [previewActive, setPreviewActive] = useState(false)
  const [showGuestModal, setShowGuestModal] = useState(false)
  const [savingGuest, setSavingGuest] = useState(false)
  const [editingGuest, setEditingGuest] = useState<any>(null)

  useEffect(() => {
    setGuestName(selectedRoom.checkin.guest_name || '')
    setCompanyName(selectedRoom.company?.company_name || selectedRoom.checkin.company_name || '')
    setPreviewActive(false)
  }, [selectedRoom])

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
    birthday: '',
    anniversary: '',
    gender: 'Male',
    nationality_id: null,
    guest_type: 'REGULAR',
    credit_allowed: 0,
    company_id: null,
    hotelid: hotelId,
    created_by_id: user?.id,
  }

  const handleEditGuest = async () => {
    let guest = selectedRoom.guest
    // If guest data is not yet loaded, fetch it now
    if (!guest && selectedRoom.checkin.guest_id) {
      try {
        const res = await GuestService.get(selectedRoom.checkin.guest_id)
        guest = res?.data ?? res
        if (!guest || !guest.guest_id) {
          toast.error('Failed to load guest data')
          return
        }
      } catch (err) {
        console.error('Failed to fetch guest:', err)
        toast.error('Could not load guest data')
        return
      }
    }
    
    if (!guest) {
      toast.error('Guest data not available')
      return
    }

    // Fetch guest documents + document types (to map name → id for FormSelect)
    let documents: any[] = []
    try {
      const [docsRes, docTypesRes] = await Promise.all([
        GuestService.listDocuments(guest.guest_id),
        DocumentTypeService.list({ status: 1 }),
      ])
      const rawDocs: any[] = docsRes?.data ?? []
      const docTypes: any[] = docTypesRes?.data ?? []

      // Build a name→id map so stored name values resolve to numeric-string IDs
      // The DB stores document_type as the type name (e.g. "PASSPORT"),
      // but FormSelect options use value: String(dt.id) (e.g. "1").
      const nameToId = new Map<string, string>()
      const idToId = new Map<string, string>()
      docTypes.forEach((dt: any) => {
        nameToId.set(String(dt.document_type_name ?? '').toUpperCase(), String(dt.id))
        idToId.set(String(dt.id), String(dt.id))
      })

      const resolveDocType = (val: string): string => {
        if (!val) return ''
        // Already an ID
        if (idToId.has(val)) return val
        // It's a name — look up its ID
        return nameToId.get(val.toUpperCase()) ?? val
      }

      documents = rawDocs.map((d: any) => ({
        document_id: d.document_id,
        document_type: resolveDocType(String(d.document_type ?? '')),
        document_number: d.document_no ?? '',
        front_side: d.front_side_url ?? d.front_side ?? '',
        back_side: d.back_side_url ?? d.back_side ?? '',
        front_side_url: d.front_side_url ?? null,
        back_side_url: d.back_side_url ?? null,
      }))
    } catch (err) {
      console.error('Failed to fetch guest documents:', err)
    }
    
    // Transform guest data to match GuestForm expected format
    setEditingGuest({
      guest_id: guest.guest_id,
      fragment_id: guest.fragment_id,
      name: guest.name || '',
      organisation: guest.organisation || '',
      address: guest.address || '',
      city_id: guest.city_id,
      state_id: guest.state_id,
      country_id: guest.country_id,
      occupation: guest.occupation || '',
      post_held: guest.post_held || '',
      phone: guest.phone || '',
      mobile: guest.mobile || '',
      email: guest.email || '',
      website: guest.website || '',
      purpose: guest.purpose || '',
      arrived_from: guest.arrived_from || '',
      departure_to: guest.departure_to || '',
      birthday: guest.birthday || '',
      anniversary: guest.anniversary || '',
      gender: guest.gender || 'Male',
      nationality_id: guest.nationality_id,
      guest_type: guest.guest_type || 'REGULAR',
      credit_allowed: guest.credit_allowed || 0,
      company_id: guest.company_id,
      discount_percent: guest.discount_percent || 0,
      hotelid: hotelId,
      status: guest.status ?? 1,
      documents: documents.length > 0 ? documents : [{ document_type: '', document_number: '', front_side: '', back_side: '' }],
    })
    setShowGuestModal(true)
  }

  const handleGuestSave = async (guestData: any) => {
    setSavingGuest(true)
    try {
      let savedGuest: any
      const guestId = editingGuest?.guest_id

      // Prepare payload - ensure required fields are present
      const payload: any = {
        name: guestData.name?.trim(),
        mobile: guestData.mobile?.trim(),
        phone: guestData.phone?.trim() || '',
        email: guestData.email?.trim() || '',
        address: guestData.address?.trim() || '',
        organisation: guestData.organisation?.trim() || '',
        occupation: guestData.occupation?.trim() || '',
        post_held: guestData.post_held?.trim() || '',
        website: guestData.website?.trim() || '',
        purpose: guestData.purpose?.trim() || '',
        arrived_from: guestData.arrived_from?.trim() || '',
        departure_to: guestData.departure_to?.trim() || '',
        birthday: guestData.birthday || null,
        anniversary: guestData.anniversary || null,
        gender: guestData.gender || 'Male',
        guest_type: guestData.guest_type || 'REGULAR',
        credit_allowed: guestData.credit_allowed ? 1 : 0,
        discount_percent: guestData.discount_percent || 0,
        status: 1,
        hotelid: hotelId,
      }

      // Add fragment_id if exists
      if (guestData.fragment_id) {
        payload.fragment_id = guestData.fragment_id
      }
      
      // Add location IDs if they exist
      if (guestData.country_id) payload.country_id = guestData.country_id
      if (guestData.state_id) payload.state_id = guestData.state_id
      if (guestData.city_id) payload.city_id = guestData.city_id
      if (guestData.nationality_id) payload.nationality_id = guestData.nationality_id
      if (guestData.company_id) payload.company_id = guestData.company_id

      if (guestId) {
        // UPDATE existing guest
        payload.updated_by_id = user?.id
        const response = await GuestService.update(guestId, payload)
        
        if (!response?.success) {
          toast.error(response?.message || 'Guest update failed')
          return
        }
        savedGuest = response.data
        toast.success('Guest updated successfully')
      } else {
        // CREATE new guest
        payload.created_by_id = user?.id
        const response = await GuestService.create(payload)
        
        if (!response?.success) {
          toast.error(response?.message || 'Guest creation failed')
          return
        }
        savedGuest = response.data
        toast.success('Guest created successfully')
      }

      if (!savedGuest || !savedGuest.guest_id) {
        toast.error('No data returned from server — please refresh and try again')
        return
      }

      // Update CheckIn_Master with new guest info
      if (selectedRoom?.checkin?.checkin_id) {
        const checkinId = selectedRoom.checkin.checkin_id
        const checkinPayload: any = {
          guest_name: savedGuest.name ?? guestData.name ?? '',
          address: savedGuest.address ?? guestData.address ?? '',
          mobile: savedGuest.mobile ?? guestData.mobile ?? '',
          emailed: savedGuest.email ?? guestData.email ?? '',
          company_name: savedGuest.company_name ?? guestData.company_name ?? selectedRoom.checkin.company_name ?? '',
        }
        
        // If new guest was created, link it to the checkin
        if (!guestId) {
          checkinPayload.guest_id = savedGuest.guest_id
        }
        
        await CheckInService.update(checkinId, checkinPayload)
      }

      // Save/update guest documents
      const savedGuestId = savedGuest.guest_id
      const submittedDocs: any[] = guestData.documents ?? []
      for (const doc of submittedDocs) {
        if (!doc.document_type && !doc.document_number) continue
        const docPayload: any = {
          document_type: doc.document_type,
          document_no: doc.document_number,
          front_side: doc._temp_front instanceof File ? doc._temp_front : undefined,
          back_side: doc._temp_back instanceof File ? doc._temp_back : undefined,
        }
        try {
          if (doc.document_id) {
            await GuestService.updateDocument(savedGuestId, doc.document_id, docPayload)
          } else {
            await GuestService.createDocument(savedGuestId, docPayload)
          }
        } catch (docErr) {
          console.error('Failed to save document:', docErr)
        }
      }

      // Update the local state with the new guest name
      setGuestName(savedGuest.name ?? guestData.name ?? guestName)
      
      onRefresh()
      setShowGuestModal(false)
      setEditingGuest(null)
    } catch (error: any) {
      console.error('Failed to save guest:', error)
      const msg = error?.response?.data?.message ?? error?.message ?? 'Failed to save guest. Please try again.'
      toast.error(msg)
    } finally {
      setSavingGuest(false)
    }
  }

  const handleUpdate = async () => {
    if (!guestName.trim()) {
      toast.error('Guest name cannot be empty')
      return
    }
    setLoadingUpdate(true)
    try {
      await CheckInService.update(selectedRoom.checkin.checkin_id, {
        guest_name: guestName.trim(),
        company_name: companyName.trim(),
      })
      toast.success('Guest information updated')
      onRefresh()
    } catch (error) {
      console.error('Failed to update guest info:', error)
      toast.error('Could not update guest information')
    } finally {
      setLoadingUpdate(false)
    }
  }

  const handleTest = () => {
    setPreviewActive(true)
    toast.success('Preview updated')
  }

  const sortedDetails = [...allRoomsDetails].sort((a, b) =>
    a.room_number.localeCompare(b.room_number, undefined, { numeric: true }),
  )

  const originalRows = sortedDetails.map((detail) =>
    buildRoomDataRowFromDetail(detail, selectedRoom.checkin, (detail as any).charges),
  )

  const previewRows = sortedDetails.map((detail) => {
    const updatedCheckin = {
      ...selectedRoom.checkin,
      guest_name: guestName,
      company_name: companyName,
    }
    return buildRoomDataRowFromDetail(detail, updatedCheckin, (detail as any).charges)
  })

  const rows = previewActive ? previewRows : originalRows

  const allHeaders = [
    { key: '#', label: '#' },
    { key: 'date', label: 'Date' },
    { key: 'guest', label: 'Guest' },
    { key: 'guestId', label: 'Guest ID' },
    { key: 'roomNo', label: 'Room N' },
    { key: 'type', label: 'Type' },
    { key: 'convCat', label: 'Conv. Cat' },
    { key: 'aDate', label: 'A_Date' },
    { key: 'aTime', label: 'A_Time' },
    { key: 'dDate', label: 'D_Date' },
    { key: 'dTime', label: 'D_Time' },
    { key: 'adults', label: 'Adults' },
    { key: 'pax', label: 'Pax' },
    { key: 'exPax', label: 'Ex_Pax' },
    { key: 'exPaxPrice', label: 'Ex_Pax Price' },
    { key: 'exPaxTaxPercent', label: 'Ex_Pax Tax %' },
    { key: 'exPaxTax', label: 'Ex_Pax Tax' },
    { key: 'exPaxTotal', label: 'Ex_Pax Total' },
    { key: 'childPaid', label: 'Child Paid' },
    { key: 'childUnpaid', label: 'Child Unpaid' },
    { key: 'childPrice', label: 'Child Price' },
    { key: 'childTaxPercent', label: 'Child Tax %' },
    { key: 'childTax', label: 'Child Tax' },
    { key: 'childTotal', label: 'Child Total' },
    { key: 'driver', label: 'Driver' },
    { key: 'driverPrice', label: 'Driver Price' },
    { key: 'driverTaxPercent', label: 'Driver Tax %' },
    { key: 'driverTax', label: 'Driver Tax' },
    { key: 'driverTotal', label: 'Driver Total' },
    { key: 'nights', label: 'Day' },
    { key: 'rate', label: 'Rate' },
    { key: 'discountPercent', label: 'Dis' },
    { key: 'discountAmt', label: 'Dis Amt' },
    { key: 'taxPercent', label: 'Tax %' },
    { key: 'taxAmount', label: 'Tax Amt' },
    { key: 'totalAmount', label: 'Total' },
  ]

  const isGuestChanged = previewActive && guestName !== (selectedRoom.checkin.guest_name || '')

  return (
    <ActionBox title="Change In Guest Information" onClose={onClose}>
      <div className="border p-2 mb-2">
        <div style={{ maxWidth: '500px' }}>
          <table className="table table-bordered table-sm text-center align-middle mb-0 small-table">
            <thead className="table-light">
              <tr>
                <th style={{ width: '60px' }}>Del</th>
                <th style={{ width: '150px', textAlign: 'start' }}>Guest</th>
                <th style={{ width: '150px', textAlign: 'start' }}>Company</th>
                <th style={{ width: '70px' }}>Pri</th>
                <th style={{ width: '50px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <Form.Check
                    type="checkbox"
                    checked={deleteChecked}
                    onChange={(e) => setDeleteChecked(e.target.checked)}
                  />
                </td>
                <td>
                  <Form.Control
                    type="text"
                    size="sm"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="input-small"
                  />
                </td>
                <td>
                  <Form.Control
                    type="text"
                    size="sm"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="input-small"
                  />
                </td>
                <td>
                  <Form.Check
                    type="checkbox"
                    checked={primaryChecked}
                    onChange={(e) => setPrimaryChecked(e.target.checked)}
                  />
                </td>
                <td>
                  <Button variant="outline-success" size="sm" onClick={handleEditGuest}>
                    <i className="fi fi-rr-edit" />
                  </Button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="action-table-container">
        <table className="action-table table table-bordered text-center align-middle">
          <thead className="table-light">
            <tr>
              {allHeaders.map((header) => (
                <th key={header.key}>{header.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={allHeaders.length} className="text-center text-muted">
                  No Data Available
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{row.date}</td>
                  <td className={isGuestChanged ? 'highlight-cell' : ''}>{row.guestName}</td>
                  <td>{row.guestId}</td>
                  <td>{row.roomNo}</td>
                  <td>{row.type}</td>
                  <td>{row.convCat}</td>
                  <td>{row.aDate}</td>
                  <td>{row.aTime}</td>
                  <td>{row.dDate}</td>
                  <td>{row.dTime}</td>
                  <td>{row.adults}</td>
                  <td>{row.pax}</td>
                  <td>{row.exPax}</td>
                  <td>{row.exPaxPrice}</td>
                  <td>{row.exPaxTaxPercent}%</td>
                  <td>{row.exPaxTax}</td>
                  <td>{row.exPaxTotal}</td>
                  <td>{row.childPaid}</td>
                  <td>{row.childUnpaid}</td>
                  <td>{row.childPrice}</td>
                  <td>{row.childTaxPercent}%</td>
                  <td>{row.childTax}</td>
                  <td>{row.childTotal}</td>
                  <td>{row.driver}</td>
                  <td>{row.driverPrice}</td>
                  <td>{row.driverTaxPercent}%</td>
                  <td>{row.driverTax}</td>
                  <td>{row.driverTotal}</td>
                  <td>{row.nights}</td>
                  <td>{row.rate}</td>
                  <td>{row.discountPercent}%</td>
                  <td>{row.discountAmt}</td>
                  <td>{row.taxPercent}%</td>
                  <td>{row.taxAmount}</td>
                  <td>{row.totalAmount}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="action-footer">
        <Button size="sm" variant="info" onClick={handleTest}>
          Test
        </Button>
        <Button size="sm" variant="success" onClick={handleUpdate} disabled={loadingUpdate}>
          {loadingUpdate ? 'Updating...' : 'Update'}
        </Button>
        <Button size="sm" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>

      <FormModal
        size="lg"
        show={showGuestModal}
        onHide={() => setShowGuestModal(false)}
        title={editingGuest ? 'Edit Guest' : 'Add New Guest'}
        onSave={handleGuestSave}
        saving={savingGuest}
        submitLabel={editingGuest ? 'Update Guest' : 'Save Guest'}
        Component={GuestForm}
        selectedItem={editingGuest || defaultGuestForm}
      />
    </ActionBox>
  )
}

// ================== Transfer Room Component (FIXED - No database query in frontend) ==================
interface TransferRoomProps {
  selectedRoom: OccupiedRoom
  allRoomsDetails: Detail[]
  vacantRooms: Array<{ room_id: number; room_no: string }>
  onClose: () => void
  onRefresh: () => void
}

const TransferRoomComponent = ({
  selectedRoom,
  allRoomsDetails,
  vacantRooms,
  onClose,
  onRefresh,
}: TransferRoomProps) => {
  const { user } = useAuthContext()
  const hotelId = user?.hotelid

  const [targetRoomNo, setTargetRoomNo] = useState<string>('')
  const [loadingUpdate, setLoadingUpdate] = useState(false)
  const [showTestPreview, setShowTestPreview] = useState(false)
  const [modeCharges, setModeCharges] = useState<any[]>([])
  const [taxMap, setTaxMap] = useState<Map<number, number>>(new Map())

  // Store records for each day
  const [dayRecords, setDayRecords] = useState<{
    details: Detail[]
    charges: any[]
  }>({ details: [], charges: [] })

  // Fetch all details and charges for this checkin and organize by day
  useEffect(() => {
    const fetchAllRecords = async () => {
      if (!selectedRoom) return

      try {
        // Fetch all details for this checkin
        const detailsRes = await DetailService.list({ checkin_id: selectedRoom.checkin.checkin_id })
        const allDetails: Detail[] = detailsRes.data || []

        // Fetch all charges for this checkin
        const chargesRes = await GuestRoomChargesService.list({
          checkin_id: selectedRoom.checkin.checkin_id,
        })
        const allCharges: any[] = chargesRes.data || []

        // Filter records for this specific room and sort by checkin_datetime
        const roomDetails = allDetails
          .filter((d: Detail) => d.room_id === selectedRoom.detail.room_id)
          .sort(
            (a, b) =>
              new Date(a.checkin_datetime).getTime() - new Date(b.checkin_datetime).getTime(),
          )

        const roomCharges = allCharges
          .filter((c: any) => c.room_id === selectedRoom.detail.room_id)
          .sort(
            (a, b) =>
              new Date(a.checkin_datetime).getTime() - new Date(b.checkin_datetime).getTime(),
          )

        setDayRecords({ details: roomDetails, charges: roomCharges })
      } catch (err) {
        console.error('Failed to fetch day records:', err)
      }
    }

    fetchAllRecords()
  }, [selectedRoom])

  // Fetch category data for tax calculations
  useEffect(() => {
    const fetchCategoryData = async () => {
      const categoryId =
        selectedRoom.detail.converted_category_id || selectedRoom.detail.room_category_id
      if (!categoryId) return
      try {
        const [catRes, taxRes] = await Promise.all([
          RoomCategoryService.get(categoryId),
          taxApi.list(),
        ])
        const catData = catRes.data || catRes
        setModeCharges(catData.mode_charges || [])

        const taxData: any[] = Array.isArray(taxRes) ? taxRes : taxRes?.data || []
        const map = new Map<number, number>()
        taxData.forEach((tax: any) => {
          const percent = tax.hotel_tax_value ?? tax.hotel_cgst + tax.hotel_sgst
          map.set(tax.hotel_taxid, percent)
        })
        setTaxMap(map)
      } catch (err) {
        console.error('TransferRoom: failed to load category data', err)
      }
    }
    fetchCategoryData()
  }, [selectedRoom])

  const computeMode = (modeName: string, count: number, chargeNights: number = 1) => {
    const mode = modeCharges.find((m: any) => m.mode_name === modeName)
    if (!mode || count <= 0) return { price: 0, tax: 0, taxPercent: 0, total: 0 }
    const perNightPrice = mode.charges * count
    let taxPercent = 0
    if (mode.is_tax_applicable && mode.tax_type) {
      taxPercent = taxMap.get(Number(mode.tax_type)) || 0
    }
    const perNightTax = (perNightPrice * taxPercent) / 100
    return {
      price: perNightPrice * chargeNights,
      tax: perNightTax * chargeNights,
      taxPercent,
      total: (perNightPrice + perNightTax) * chargeNights,
    }
  }

  const buildChargesWithTax = (room: OccupiedRoom, chargeNights: number = 1) => {
    const exPaxCount = room.detail.ex_pax || 0
    const childCount = room.checkin.child_paid || 0
    const driverCount = room.detail.driver || 0

    const exPaxCalc = computeMode('EXTRA_PAX', exPaxCount, chargeNights)
    const childCalc = computeMode('CHILD', childCount, chargeNights)
    const driverCalc = computeMode('DRIVER', driverCount, chargeNights)

    if (modeCharges.length === 0) {
      return room.charges
    }
    return {
      ex_pax_price: room.charges?.ex_pax_price ?? exPaxCalc.price,
      ex_pax_tax_percent: exPaxCalc.taxPercent,
      ex_pax_tax: exPaxCalc.tax,
      ex_pax_total: room.charges?.ex_pax_total ?? exPaxCalc.total,
      child_price: room.charges?.child_price ?? childCalc.price,
      child_tax_percent: childCalc.taxPercent,
      child_tax: childCalc.tax,
      child_total: room.charges?.child_total ?? childCalc.total,
      driver_price: room.charges?.driver_price ?? driverCalc.price,
      driver_tax_percent: driverCalc.taxPercent,
      driver_tax: driverCalc.tax,
      driver_total: room.charges?.driver_total ?? driverCalc.total,
    }
  }

  const selectedRow = useMemo(
    () =>
      buildRoomDataRowFromDetail(
        selectedRoom.detail,
        selectedRoom.checkin,
        buildChargesWithTax(selectedRoom, 1),
      ),
    [selectedRoom, modeCharges, taxMap],
  )

  const targetRoom = useMemo(() => {
    if (!targetRoomNo) return null
    return vacantRooms.find((r) => String(r.room_no) === String(targetRoomNo)) || null
  }, [targetRoomNo, vacantRooms])

  const previewRow = useMemo(() => {
    if (!targetRoom) return null
    return { ...selectedRow, roomNo: targetRoom.room_no }
  }, [targetRoom, selectedRow])

  const vacantPreviewRow = useMemo(() => {
    if (!targetRoomNo) return null

    const resolvedRoomNo = targetRoom ? targetRoom.room_no : targetRoomNo

    const safeNum = (v: any) => Number(v || 0)
    const roomNights = safeNum(selectedRoom.detail.no_of_days) || 1
    const roomRate = safeNum(selectedRoom.detail.room_tariff)
    const roomDisPct = safeNum(selectedRoom.detail.discount_percent)
    const roomDisAmt = (roomRate * roomNights * roomDisPct) / 100
    const roomTaxPct =
      safeNum(selectedRoom.detail.cgst_percent) +
      safeNum(selectedRoom.detail.sgst_percent) +
      safeNum(selectedRoom.detail.igst_percent) +
      safeNum(selectedRoom.detail.cess_percent)
    const roomBaseAmt = roomRate * roomNights - roomDisAmt
    const roomTaxAmt = (roomBaseAmt * roomTaxPct) / 100

    const exPaxTotalNum = safeNum(selectedRow.exPaxTotal)
    const childTotalNum = safeNum(selectedRow.childTotal)
    const driverTotalNum = safeNum(selectedRow.driverTotal)
    const roomTotal = roomBaseAmt + roomTaxAmt + exPaxTotalNum + childTotalNum + driverTotalNum

    return {
      ...selectedRow,
      roomNo: resolvedRoomNo,
      guestName: selectedRow.guestName,
      guestId: selectedRow.guestId,
      pax: selectedRow.pax,
      exPax: selectedRow.exPax,
      childPaid: selectedRow.childPaid,
      childUnpaid: selectedRow.childUnpaid,
      driver: selectedRow.driver,
      exPaxPrice: selectedRow.exPaxPrice,
      exPaxTaxPercent: selectedRow.exPaxTaxPercent,
      exPaxTax: selectedRow.exPaxTax,
      exPaxTotal: selectedRow.exPaxTotal,
      childPrice: selectedRow.childPrice,
      childTaxPercent: selectedRow.childTaxPercent,
      childTax: selectedRow.childTax,
      childTotal: selectedRow.childTotal,
      driverPrice: selectedRow.driverPrice,
      driverTaxPercent: selectedRow.driverTaxPercent,
      driverTax: selectedRow.driverTax,
      driverTotal: selectedRow.driverTotal,
      nights: roomNights,
      rate: roomRate.toFixed(2),
      discountPercent: roomDisPct,
      discountAmt: roomDisAmt.toFixed(2),
      taxPercent: roomTaxPct.toFixed(2),
      taxAmount: roomTaxAmt.toFixed(2),
      totalAmount: roomTotal.toFixed(2),
    }
  }, [targetRoomNo, targetRoom, selectedRow, selectedRoom])

  const handleTest = () => {
    if (!targetRoom) {
      toast.error('Please select a target room')
      return
    }
    setShowTestPreview(true)
    toast.success('Preview ready')
  }

  // Helper function to check if a date is today or future
  const isTodayOrFuture = (dateStr: string): boolean => {
    const date = new Date(dateStr)
    date.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return date >= today
  }

  const handleUpdate = async () => {
    if (!targetRoom) {
      toast.error('Please select a target room')
      return
    }

    setLoadingUpdate(true)
    try {
      const oldRoomId = selectedRoom.detail.room_id
      const newRoomId = targetRoom.room_id
      const updatedById = selectedRoom.checkin.created_by_id

      // Separate records into past and future based on checkout date
      const futureDetails: Detail[] = []
      const pastDetails: Detail[] = []
      const futureCharges: any[] = []
      const pastCharges: any[] = []

      // Separate details
      for (const detail of dayRecords.details) {
        if (isTodayOrFuture(detail.checkout_datetime)) {
          futureDetails.push(detail)
        } else {
          pastDetails.push(detail)
        }
      }

      // Separate charges
      for (const charge of dayRecords.charges) {
        const chargeDate = charge.checkout_datetime || charge.checkin_datetime
        if (chargeDate && isTodayOrFuture(chargeDate)) {
          futureCharges.push(charge)
        } else {
          pastCharges.push(charge)
        }
      }

      console.log('=== Transfer Room Debug ===')
      console.log('Total details:', dayRecords.details.length)
      console.log('Future details to update:', futureDetails.length)
      console.log('Past details (unchanged):', pastDetails.length)
      console.log('Total charges:', dayRecords.charges.length)
      console.log('Future charges to update:', futureCharges.length)
      console.log('Past charges (unchanged):', pastCharges.length)

      // 1. Update all FUTURE details (today and future days)
      for (const detail of futureDetails) {
        await DetailService.update(detail.detail_id, {
          room_number: targetRoom.room_no,
          room_id: newRoomId,
        })
        console.log(`Updated detail ${detail.detail_id} to room ${targetRoom.room_no}`)
      }

      // 2. Update checkin master room_no (this is just for display)
      await CheckInService.update(selectedRoom.checkin.checkin_id, {
        room_no: targetRoom.room_no,
      })

      // 3. Update FUTURE guest_room_charges ONLY (today and future)
      //    IMPORTANT: DO NOT update past charges!
      for (const charge of futureCharges) {
        await GuestRoomChargesService.update(charge.guest_room_charges_id, {
          room_id: newRoomId,
        } as any)
        console.log(`Updated charge ${charge.guest_room_charges_id} to room_id ${newRoomId}`)
      }

      // 4. Check if there are any other active details in the old room
      //    Fetch all details for this hotel to check other checkins in the same room
      try {
        const allDetailsRes = await DetailService.list({ hotelid: hotelId })
        const allHotelDetails: Detail[] = allDetailsRes.data || []

        const otherActiveInOldRoom = allHotelDetails.filter(
          (d: Detail) =>
            d.room_id === oldRoomId &&
            d.is_checkout === 0 &&
            d.detail_id !== selectedRoom.detail.detail_id,
        )

        const hasOtherActive = otherActiveInOldRoom.length > 0

        // Only mark old room as available if no other active checkins
        if (!hasOtherActive) {
          const oldRoomRes = await RoomService.get(oldRoomId)
          const oldRoom = oldRoomRes.data
          await RoomService.update(oldRoomId, {
            ...oldRoom,
            room_status: 'available',
            updated_by_id: updatedById,
          })
          console.log(`Marked old room ${oldRoomId} as available`)
        } else {
          console.log(`Old room ${oldRoomId} still has other active checkins, keeping as occupied`)
        }
      } catch (err) {
        console.warn('Could not check other active rooms:', err)
        // Non-fatal error, continue with transfer
      }

      // 5. Mark new room as occupied
      const newRoomRes = await RoomService.get(newRoomId)
      const newRoom = newRoomRes.data
      await RoomService.update(newRoomId, {
        ...newRoom,
        room_status: 'occupied',
        updated_by_id: updatedById,
      })

      // 6. Transfer all active advance transactions from old room to new room
      //    This ensures any advance added to room 101 automatically shows under room 102 after transfer.
      let advanceTransferred = 0
      try {
        const advTransferRes = await AdvanceTransactionService.transferToRoom({
          checkin_id: selectedRoom.checkin.checkin_id,
          old_room_id: oldRoomId,
          new_room_id: newRoomId,
          new_room_no: targetRoom.room_no,
        })
        advanceTransferred = advTransferRes?.data?.transferred ?? 0
        if (advanceTransferred > 0) {
          console.log(
            `Transferred ${advanceTransferred} advance transaction(s) to room ${targetRoom.room_no}`,
          )
        }
      } catch (advErr) {
        // Non-fatal: log but don't block the transfer
        console.warn('Could not transfer advance transactions (non-fatal):', advErr)
      }

      // 7. Transfer all post charges (CHARGE + ALLOWANCE) from old room to new room
      //    This ensures any post charge/allowance added to room 101 automatically shows under room 102 after transfer.
      let postChargesTransferred = 0
      try {
        const pcTransferRes = await PostChargesService.transferToRoom({
          checkin_id: selectedRoom.checkin.checkin_id,
          old_room_id: oldRoomId,
          new_room_id: newRoomId,
        })
        postChargesTransferred = pcTransferRes?.data?.transferred ?? 0
        if (postChargesTransferred > 0) {
          console.log(
            `Transferred ${postChargesTransferred} post charge(s) to room ${targetRoom.room_no}`,
          )
        }
      } catch (pcErr) {
        // Non-fatal: log but don't block the transfer
        console.warn('Could not transfer post charges (non-fatal):', pcErr)
      }

      toast.success(
        `Room transferred from ${selectedRoom.roomNo} to ${targetRoom.room_no}\n` +
          `${futureDetails.length} future day(s) updated, ${pastDetails.length} past day(s) unchanged.` +
          (advanceTransferred > 0
            ? `\n${advanceTransferred} advance transaction(s) moved to new room.`
            : '') +
          (postChargesTransferred > 0
            ? `\n${postChargesTransferred} post charge(s) moved to new room.`
            : ''),
      )
      setTargetRoomNo('')
      setShowTestPreview(false)
      onRefresh()
    } catch (error) {
      console.error('Transfer failed:', error)
      toast.error('Failed to transfer room: ' + (error as Error).message)
    } finally {
      setLoadingUpdate(false)
    }
  }

  const allHeaders = [
    { key: '#', label: '#' },
    { key: 'date', label: 'Date' },
    { key: 'guest', label: 'Guest' },
    { key: 'guestId', label: 'Guest ID' },
    { key: 'roomNo', label: 'Room N' },
    { key: 'type', label: 'Type' },
    { key: 'convCat', label: 'Conv. Cat' },
    { key: 'aDate', label: 'A_Date' },
    { key: 'aTime', label: 'A_Time' },
    { key: 'dDate', label: 'D_Date' },
    { key: 'dTime', label: 'D_Time' },
    { key: 'adults', label: 'Adults' },
    { key: 'pax', label: 'Pax' },
    { key: 'exPax', label: 'Ex_Pax' },
    { key: 'exPaxPrice', label: 'Ex_Pax Price' },
    { key: 'exPaxTaxPercent', label: 'Ex_Pax Tax %' },
    { key: 'exPaxTax', label: 'Ex_Pax Tax' },
    { key: 'exPaxTotal', label: 'Ex_Pax Total' },
    { key: 'childPaid', label: 'Child Paid' },
    { key: 'childUnpaid', label: 'Child Unpaid' },
    { key: 'childPrice', label: 'Child Price' },
    { key: 'childTaxPercent', label: 'Child Tax %' },
    { key: 'childTax', label: 'Child Tax' },
    { key: 'childTotal', label: 'Child Total' },
    { key: 'driver', label: 'Driver' },
    { key: 'driverPrice', label: 'Driver Price' },
    { key: 'driverTaxPercent', label: 'Driver Tax %' },
    { key: 'driverTax', label: 'Driver Tax' },
    { key: 'driverTotal', label: 'Driver Total' },
    { key: 'nights', label: 'Day' },
    { key: 'rate', label: 'Rate' },
    { key: 'discountPercent', label: 'Dis' },
    { key: 'discountAmt', label: 'Dis Amt' },
    { key: 'taxPercent', label: 'Tax %' },
    { key: 'taxAmount', label: 'Tax Amt' },
    { key: 'totalAmount', label: 'Total' },
  ]

  const renderFullRow = (row: any, idx: number) => (
    <tr key={idx}>
      <td>{idx + 1}</td>
      <td>{row.date}</td>
      <td>{row.guestName}</td>
      <td>{row.guestId}</td>
      <td className={showTestPreview ? 'highlight-cell' : ''}>{row.roomNo}</td>
      <td>{row.type}</td>
      <td>{row.convCat}</td>
      <td>{row.aDate}</td>
      <td>{row.aTime}</td>
      <td>{row.dDate}</td>
      <td>{row.dTime}</td>
      <td>{row.adults}</td>
      <td>{row.pax}</td>
      <td>{row.exPax}</td>
      <td>{row.exPaxPrice}</td>
      <td>{row.exPaxTaxPercent}%</td>
      <td>{row.exPaxTax}</td>
      <td>{row.exPaxTotal}</td>
      <td>{row.childPaid}</td>
      <td>{row.childUnpaid}</td>
      <td>{row.childPrice}</td>
      <td>{row.childTaxPercent}%</td>
      <td>{row.childTax}</td>
      <td>{row.childTotal}</td>
      <td>{row.driver}</td>
      <td>{row.driverPrice}</td>
      <td>{row.driverTaxPercent}%</td>
      <td>{row.driverTax}</td>
      <td>{row.driverTotal}</td>
      <td>{row.nights}</td>
      <td>{row.rate}</td>
      <td>{row.discountPercent}%</td>
      <td>{row.discountAmt}</td>
      <td>{row.taxPercent}%</td>
      <td>{row.taxAmount}</td>
      <td>{row.totalAmount}</td>
    </tr>
  )





  return (
    <ActionBox title="Transfer Room" onClose={onClose}>
      <Row className="mb-3">
        <Col md={4}>
          <div className="d-flex align-items-center gap-2 pt-2">
            <Form.Label className="mb-0 fs-small fw-bold" style={{ minWidth: '130px' }}>
              Current Room No
            </Form.Label>
            <Form.Control
              type="text"
              size="sm"
              value={selectedRoom.roomNo}
              readOnly
              className="fs-small bg-light"
              style={{ width: '150px' }}
            />
          </div>
        </Col>

        <Col md={4}>
          <div className="d-flex align-items-center gap-2 pt-2">
            <Form.Label className="mb-0 fs-small fw-bold" style={{ minWidth: '130px' }}>
              Transfer Room No
            </Form.Label>
            <Form.Select
              size="sm"
              value={targetRoomNo}
              onChange={(e) => {
                setTargetRoomNo(e.target.value)
                setShowTestPreview(false)
              }}
              className="fs-small"              
              disabled={loadingUpdate}
              style={{ width: '200px' }}>
              <option value="">Select a vacant room</option>
              {vacantRooms.map((room) => (
                <option key={room.room_id} value={room.room_no}>
                  {room.room_no}
                </option>
              ))}
            </Form.Select>
          </div>
          {vacantRooms.length === 0 && (
            <div className="text-danger small mt-1">No vacant rooms available</div>
          )}
        </Col>
      </Row>
      <div className="action-table-container mb-2">
        <div className="small fw-bold mb-1">
          {showTestPreview ? 'Transfer Preview (After Transfer)' : 'Current Room Details'}
        </div>
        <table className="action-table table table-bordered text-center align-middle">
          <thead className="table-light">
            <tr>
              {allHeaders.map((header) => (
                <th key={header.key}>{header.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {showTestPreview && previewRow
              ? renderFullRow(previewRow, 0)
              : renderFullRow(selectedRow, 0)}
          </tbody>
        </table>
      </div>

      <div className="action-table-container">
        <div className="small fw-bold mb-1">Selected Vacant Room Preview</div>
        <table className="action-table table table-bordered text-center align-middle">
          <thead className="table-light">
            <tr>
              {allHeaders.map((header) => (
                <th key={header.key}>{header.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vacantPreviewRow ? (
              renderFullRow(vacantPreviewRow, 0)
            ) : (
              <tr>
                <td colSpan={allHeaders.length} className="text-center text-muted">
                  Select a room above to preview
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="action-footer">
        <Button
          size="sm"
          variant="info"
          onClick={handleTest}
          disabled={!targetRoom || loadingUpdate}>
          Test
        </Button>
        <Button
          size="sm"
          variant="success"
          onClick={handleUpdate}
          disabled={!targetRoom || loadingUpdate}>
          {loadingUpdate ? 'Transferring...' : 'Update'}
        </Button>
        <Button size="sm" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </ActionBox>
  )
}

interface MergeRoomProps {
  selectedRoom: OccupiedRoom
  allRoomsDetails: Detail[]
  occupiedRooms: OccupiedRoom[]
  onClose: () => void
}

const MergeRoomComponent = ({
  selectedRoom,
  allRoomsDetails,
  occupiedRooms,
  onClose,
}: MergeRoomProps) => {
  const [mode, setMode] = useState<'merge' | 'demerge'>('merge')
  const [selectedDetailIds, setSelectedDetailIds] = useState<number[]>([])

  const otherRooms = occupiedRooms.filter(
    (r) => r.checkin.checkin_id !== selectedRoom.checkin.checkin_id,
  )

  const handleCheckboxChange = (detailId: number, checked: boolean) => {
    if (checked) {
      setSelectedDetailIds((prev) => [...prev, detailId])
    } else {
      setSelectedDetailIds((prev) => prev.filter((id) => id !== detailId))
    }
  }

  const handleUpdate = () => {
    if (selectedDetailIds.length === 0) {
      toast.error('Please select at least one room')
      return
    }
    toast.success(`${mode === 'merge' ? 'Merge' : 'De‑Merge'} selected rooms (demo)`)
  }

  return (
    <ActionBox title="Merge / De-Merge Room" onClose={onClose}>
      <div className="border rounded mb-3 bg-light">
        <table className="table table-sm table-bordered mb-0 align-middle text-center fs-small">
          <thead className="table-light">
            <tr>
              <th>CheckIn ID</th>
              <th>Room</th>
              <th>Guest Name</th>
              <th>Company Name</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{selectedRoom.checkin.checkin_id}</td>
              <td>{selectedRoom.roomNo}</td>
              <td>
                <div className="d-flex align-items-start justify-content-center gap-2">
                  <Form.Check type="checkbox" />
                  {selectedRoom.checkin.guest_name || '-'}
                </div>
              </td>
              <td>
                <div className="d-flex align-items-start justify-content-center gap-2">
                  <Form.Check type="checkbox" />
                  {selectedRoom.company?.company_name || selectedRoom.checkin.company_name || '-'}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="d-flex justify-content-center gap-2 mb-3">
        <Button
          style={{ width: '200px' }}
          variant={mode === 'merge' ? 'primary' : 'outline-primary'}
          size="sm"
          onClick={() => setMode('merge')}>
          MERGE ROOM
        </Button>
        <Button
          style={{ width: '200px' }}
          variant={mode === 'demerge' ? 'success' : 'outline-success'}
          size="sm"
          onClick={() => setMode('demerge')}>
          DE-MERGE ROOM
        </Button>
      </div>

      <div
        className="mb-2 border"
        style={{
          maxHeight: '150px',
          overflowY: 'auto',
          overflowX: 'hidden',
        }}>
        <table className="table table-sm table-bordered text-center align-middle mb-0 fs-small">
          <thead className="table-light sticky-top">
            <tr>
              <th>CheckIn ID</th>
              <th>Room</th>
              <th>Guest Name</th>
              <th>Company Name</th>
              <th>Select</th>
            </tr>
          </thead>
          <tbody>
            {otherRooms.map((room) => (
              <tr key={room.detail.detail_id}>
                <td>{room.checkin.checkin_id}</td>
                <td>{room.roomNo}</td>
                <td>{room.checkin.guest_name || '-'}</td>
                <td>{room.checkin.company_name || '-'}</td>
                <td>
                  <Form.Check
                    type="checkbox"
                    checked={selectedDetailIds.includes(room.detail.detail_id)}
                    onChange={(e) => handleCheckboxChange(room.detail.detail_id, e.target.checked)}
                  />
                </td>
              </tr>
            ))}
            {otherRooms.length === 0 && (
              <tr>
                <td colSpan={5} className="text-muted">
                  No other occupied rooms found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="action-footer">
        <Button size="sm" variant="success" onClick={handleUpdate}>
          Update
        </Button>
        <Button size="sm" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </ActionBox>
  )
}

// ================== ChangePayModeComponent ==================
// ================== ChangePayModeComponent ==================
interface ChangePayModeProps {
  selectedRoom: OccupiedRoom
  allRoomsDetails: Detail[]
  onClose: () => void
  onRefresh: () => void
}

const ChangePayModeComponent = ({
  selectedRoom,
  allRoomsDetails,
  onClose,
  onRefresh,
}: ChangePayModeProps) => {
  const [paymentMethods, setPaymentMethods] = useState<
    Array<{ id: number; name: string; payment_method_name: string }>
  >([])
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<string>('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [previewActive, setPreviewActive] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const pmRes = await PaymentMethodService.list({ status: 1 })
        const pmData = Array.isArray(pmRes) ? pmRes : pmRes?.data || []
        const mapped = pmData.map((pm: any) => ({
          id: pm.id || pm.payment_method_id,
          name: pm.name || pm.payment_method_name,
          payment_method_name: pm.payment_method_name || pm.name,
        }))

        // Step 1: Try payment_method from the prop (already-loaded checkin)
        let resolvedMethod = (selectedRoom.checkin as any).payment_method || ''

        // Step 2: If not found on prop, fetch a fresh checkin record
        if (!resolvedMethod) {
          try {
            const freshCheckin = await CheckInService.get(selectedRoom.checkin.checkin_id)
            resolvedMethod = ((freshCheckin.data || freshCheckin) as any)?.payment_method || ''
          } catch {
            resolvedMethod = ''
          }
        }

        // Step 3: If still empty, read payment_method from guest_folio_master via GET API
        if (!resolvedMethod) {
          try {
            const folioRes = await GuestFolioService.list({
              checkin_id: selectedRoom.checkin.checkin_id,
            })
            const folioEntries: any[] = folioRes.data || []
            const roomCharge = folioEntries.find(
              (e) => e.transaction_type === 'Room Charge' && e.payment_method,
            )
            const anyEntry = folioEntries.find((e) => e.payment_method)
            const folioMethod = (roomCharge || anyEntry)?.payment_method || ''
            resolvedMethod = folioMethod
          } catch {
            resolvedMethod = ''
          }
        }

        if (resolvedMethod) {
          setCurrentPaymentMethod(resolvedMethod)
          setSelectedPaymentMethod('')
        } else {
          setCurrentPaymentMethod('Not set')
          setSelectedPaymentMethod('')
        }

        setPaymentMethods(mapped)
      } catch (error) {
        console.error('Failed to load payment data:', error)
        toast.error('Could not load payment methods')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedRoom.checkin.checkin_id])

  const handleTest = () => {
    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method')
      return
    }
    setPreviewActive(true)
    toast.success('Preview updated')
  }

  // Filter out the current payment method from dropdown options
  const filteredPaymentMethods = paymentMethods.filter(
    (pm) => (pm.payment_method_name || pm.name) !== currentPaymentMethod,
  )

  const paymentMethodOptions = filteredPaymentMethods.map((pm) => ({
    label: pm.payment_method_name || pm.name,
    value: pm.payment_method_name || pm.name,
  }))

  const sortedDetails = [...allRoomsDetails].sort((a, b) =>
    a.room_number.localeCompare(b.room_number, undefined, { numeric: true }),
  )
  const rows = sortedDetails.map((detail) =>
    buildRoomDataRowFromDetail(detail, selectedRoom.checkin, (detail as any).charges),
  )

  const handleUpdate = async () => {
    if (!selectedPaymentMethod) {
      toast.error('Please select a payment method')
      return
    }
    setLoading(true)
    try {
      // 1. Update payment_method on checkin_master (primary source)
      await CheckInService.update(selectedRoom.checkin.checkin_id, {
        payment_method: selectedPaymentMethod,
      } as any)

      // 2. Update all existing folio entries' payment_method for consistency
      try {
        const folioRes = await GuestFolioService.list({
          checkin_id: selectedRoom.checkin.checkin_id,
        })
        const folioEntries: any[] = folioRes.data || []

        // Update every existing folio entry's payment_method column
        await Promise.all(
          folioEntries.map((entry: any) =>
            GuestFolioService.update(entry.folio_id, {
              payment_method: selectedPaymentMethod,
            }),
          ),
        )

        // Upsert a dedicated 'Payment Mode' record
        const payModeEntry = folioEntries.find(
          (e: any) => e.transaction_type === 'Payment Mode Change',
        )
        if (payModeEntry) {
          await GuestFolioService.update(payModeEntry.folio_id, {
            payment_method: selectedPaymentMethod,
            description: `Payment mode changed from ${currentPaymentMethod} to ${selectedPaymentMethod}`,
            transaction_datetime: new Date().toISOString(),
          })
        } else {
          await GuestFolioService.create({
            checkin_id: selectedRoom.checkin.checkin_id,
            hotelid: (selectedRoom.checkin as any).hotelid,
            detail_id: selectedRoom.detail.detail_id,
            transaction_type: 'Payment Mode Change',
            transaction_datetime: new Date().toISOString(),
            description: `Payment mode changed from ${currentPaymentMethod} to ${selectedPaymentMethod}`,
            debit_amount: 0,
            credit_amount: 0,
            payment_method: selectedPaymentMethod,
          })
        }
      } catch (folioError) {
        console.warn('Could not sync folio payment_method entries:', folioError)
      }

      setCurrentPaymentMethod(selectedPaymentMethod)
      toast.success(
        `Payment method changed from ${currentPaymentMethod} to ${selectedPaymentMethod}`,
      )
      onRefresh()
      onClose() // Close the modal after successful update
    } catch (error) {
      console.error('Failed to update payment method:', error)
      toast.error('Could not update payment method')
    } finally {
      setLoading(false)
    }
  }

  const allHeaders = [
    { key: '#', label: '#' },
    { key: 'date', label: 'Date' },
    { key: 'guest', label: 'Guest' },
    { key: 'guestId', label: 'Guest ID' },
    { key: 'roomNo', label: 'Room N' },
    { key: 'type', label: 'Type' },
    { key: 'convCat', label: 'Conv. Cat' },
    { key: 'aDate', label: 'A_Date' },
    { key: 'aTime', label: 'A_Time' },
    { key: 'dDate', label: 'D_Date' },
    { key: 'dTime', label: 'D_Time' },
    { key: 'adults', label: 'Adults' },
    { key: 'pax', label: 'Pax' },
    { key: 'exPax', label: 'Ex_Pax' },
    { key: 'exPaxPrice', label: 'Ex_Pax Price' },
    { key: 'exPaxTaxPercent', label: 'Ex_Pax Tax %' },
    { key: 'exPaxTax', label: 'Ex_Pax Tax' },
    { key: 'exPaxTotal', label: 'Ex_Pax Total' },
    { key: 'childPaid', label: 'Child Paid' },
    { key: 'childUnpaid', label: 'Child Unpaid' },
    { key: 'childPrice', label: 'Child Price' },
    { key: 'childTaxPercent', label: 'Child Tax %' },
    { key: 'childTax', label: 'Child Tax' },
    { key: 'childTotal', label: 'Child Total' },
    { key: 'driver', label: 'Driver' },
    { key: 'driverPrice', label: 'Driver Price' },
    { key: 'driverTaxPercent', label: 'Driver Tax %' },
    { key: 'driverTax', label: 'Driver Tax' },
    { key: 'driverTotal', label: 'Driver Total' },
    { key: 'nights', label: 'Day' },
    { key: 'rate', label: 'Rate' },
    { key: 'discountPercent', label: 'Dis' },
    { key: 'discountAmt', label: 'Dis Amt' },
    { key: 'taxPercent', label: 'Tax %' },
    { key: 'taxAmount', label: 'Tax Amt' },
    { key: 'totalAmount', label: 'Total' },
    { key: 'payMode', label: 'Pay Mode' },
  ]

  return (
    <ActionBox title="Change In Payment Mode" onClose={onClose} className="mb-2">
      <div className="mb-3 d-flex gap-3 pt-2">
        <div className="d-flex align-items-center flex-fill me-3">
          <label className="fs-small mb-0 me-2 fw-bold" style={{ minWidth: '150px' }}>
            Current Mode Of Payment
          </label>
          <Form.Control
            type="text"
            size="sm"
            value={currentPaymentMethod}
            readOnly
            className="fs-small bg-light"
            style={{ maxWidth: '180px' }}
          />
        </div>

        <div className="d-flex align-items-center flex-fill">
          <label className="fs-small mb-0 me-2 fw-bold" style={{ minWidth: '150px' }}>
            Select Mode Of Payment
          </label>
          <Form.Select
            size="sm"
            value={selectedPaymentMethod}
            onChange={(e) => {
              setSelectedPaymentMethod(e.target.value)
              setPreviewActive(false) // Reset preview when selection changes
            }}
            className="fs-small"
            disabled={loading || paymentMethodOptions.length === 0}
            style={{ maxWidth: '180px' }}>
            <option value="">Select</option>
            {paymentMethodOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Form.Select>
        </div>
      </div>

      {paymentMethodOptions.length === 0 && currentPaymentMethod !== 'Not set' && (
        <div className="alert alert-info mb-3 py-1 px-2 fs-small">
          <i className="bi bi-info-circle me-1"></i>
          No other payment methods available. Current method is "{currentPaymentMethod}".
        </div>
      )}

      <div className="action-table-container">
        <table className="action-table table table-bordered text-center align-middle">
          <thead className="table-light">
            <tr>
              {allHeaders.map((header) => (
                <th key={header.key}>{header.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={allHeaders.length} className="text-center text-muted">
                  No Data Available
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{row.date}</td>
                  <td>{row.guestName}</td>
                  <td>{row.guestId}</td>
                  <td>{row.roomNo}</td>
                  <td>{row.type}</td>
                  <td>{row.convCat}</td>
                  <td>{row.aDate}</td>
                  <td>{row.aTime}</td>
                  <td>{row.dDate}</td>
                  <td>{row.dTime}</td>
                  <td>{row.adults}</td>
                  <td>{row.pax}</td>
                  <td>{row.exPax}</td>
                  <td>{row.exPaxPrice}</td>
                  <td>{row.exPaxTaxPercent}%</td>
                  <td>{row.exPaxTax}</td>
                  <td>{row.exPaxTotal}</td>
                  <td>{row.childPaid}</td>
                  <td>{row.childUnpaid}</td>
                  <td>{row.childPrice}</td>
                  <td>{row.childTaxPercent}%</td>
                  <td>{row.childTax}</td>
                  <td>{row.childTotal}</td>
                  <td>{row.driver}</td>
                  <td>{row.driverPrice}</td>
                  <td>{row.driverTaxPercent}%</td>
                  <td>{row.driverTax}</td>
                  <td>{row.driverTotal}</td>
                  <td>{row.nights}</td>
                  <td>{row.rate}</td>
                  <td>{row.discountPercent}%</td>
                  <td>{row.discountAmt}</td>
                  <td>{row.taxPercent}%</td>
                  <td>{row.taxAmount}</td>
                  <td>{row.totalAmount}</td>
                  <td className={previewActive ? 'highlight-cell' : ''}>
                    {previewActive ? selectedPaymentMethod || '-' : currentPaymentMethod || '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="action-footer d-flex justify-content-end gap-2 mt-3">
        <Button
          size="sm"
          variant="info"
          onClick={handleTest}
          disabled={loading || !selectedPaymentMethod}>
          Test
        </Button>
        <Button
          size="sm"
          variant="success"
          onClick={handleUpdate}
          disabled={loading || !selectedPaymentMethod}>
          {loading ? 'Updating...' : 'Update'}
        </Button>
        <Button size="sm" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>
    </ActionBox>
  )
}
// ================== Swap Room Component (FIXED - advance & post charges follow GUEST) ==================
interface SwapRoomProps {
  selectedRoom: OccupiedRoom
  occupiedRooms: OccupiedRoom[]
  onClose: () => void
  onRefresh: () => Promise<void>
}

const SwapRoomComponent = ({ selectedRoom, occupiedRooms, onClose, onRefresh }: SwapRoomProps) => {
  const otherRooms = occupiedRooms.filter(
    (r) => r.checkin.checkin_id !== selectedRoom.checkin.checkin_id,
  )

  const [targetRoomNo, setTargetRoomNo] = useState<string>('')
  const [targetRoom, setTargetRoom] = useState<OccupiedRoom | null>(null)
  const [loadingUpdate, setLoadingUpdate] = useState(false)
  const [showSwapPreview, setShowSwapPreview] = useState(false)
  const [advanceTransferStatus, setAdvanceTransferStatus] = useState<{
    a: number
    b: number
  } | null>(null)
  const [postChargesCounts, setPostChargesCounts] = useState<{ a: number; b: number } | null>(null)

  // mode_charges + taxMap for the SELECTED (current) room
  const [selectedModeCharges, setSelectedModeCharges] = useState<any[]>([])
  const [selectedTaxMap, setSelectedTaxMap] = useState<Map<number, number>>(new Map())

  // mode_charges + taxMap for the TARGET room
  const [targetModeCharges, setTargetModeCharges] = useState<any[]>([])
  const [targetTaxMap, setTargetTaxMap] = useState<Map<number, number>>(new Map())

  /** Fetch mode_charges + hotel tax map for a given room-category ID */
  const fetchCategoryData = async (categoryId: number) => {
    const [catRes, taxRes] = await Promise.all([RoomCategoryService.get(categoryId), taxApi.list()])
    const catData = catRes.data || catRes
    const modeCharges: any[] = catData.mode_charges || []

    const taxData: any[] = Array.isArray(taxRes) ? taxRes : taxRes?.data || []
    const map = new Map<number, number>()
    taxData.forEach((tax: any) => {
      const percent = tax.hotel_tax_value ?? tax.hotel_cgst + tax.hotel_sgst
      map.set(tax.hotel_taxid, percent)
    })
    return { modeCharges, taxMap: map }
  }

  // Load category data for the selected room on mount
  useEffect(() => {
    const categoryId =
      selectedRoom.detail.converted_category_id || selectedRoom.detail.room_category_id
    if (!categoryId) return
    fetchCategoryData(categoryId)
      .then(({ modeCharges, taxMap }) => {
        setSelectedModeCharges(modeCharges)
        setSelectedTaxMap(taxMap)
      })
      .catch((err) => console.error('SwapRoom: failed to load selected room category', err))
  }, [selectedRoom])

  // Load category data for the target room whenever it changes
  useEffect(() => {
    if (!targetRoomNo) {
      setTargetRoom(null)
      setShowSwapPreview(false)
      setAdvanceTransferStatus(null)
      setPostChargesCounts(null)
      setTargetModeCharges([])
      setTargetTaxMap(new Map())
      return
    }
    const found = otherRooms.find((r) => r.roomNo === targetRoomNo)
    if (!found) {
      setTargetRoom(null)
      return
    }
    setTargetRoom(found)
    setShowSwapPreview(false)
    setAdvanceTransferStatus(null)
    setPostChargesCounts(null)

    const categoryId = found.detail.converted_category_id || found.detail.room_category_id
    if (!categoryId) return
    fetchCategoryData(categoryId)
      .then(({ modeCharges, taxMap }) => {
        setTargetModeCharges(modeCharges)
        setTargetTaxMap(taxMap)
      })
      .catch((err) => console.error('SwapRoom: failed to load target room category', err))
  }, [targetRoomNo])

  // Fetch advance and post charge counts for selected rooms (for display)
  const fetchAdvanceCounts = async () => {
    if (!targetRoom) return { a: 0, b: 0 }
    try {
      const [advA, advB] = await Promise.all([
        AdvanceTransactionService.list({
          checkin_id: selectedRoom.checkin.checkin_id,
          room_id: selectedRoom.detail.room_id,
        }),
        AdvanceTransactionService.list({
          checkin_id: targetRoom.checkin.checkin_id,
          room_id: targetRoom.detail.room_id,
        }),
      ])
      const activeA = (advA.data || []).filter((t) => t.status === 'active').length
      const activeB = (advB.data || []).filter((t) => t.status === 'active').length
      return { a: activeA, b: activeB }
    } catch {
      return { a: 0, b: 0 }
    }
  }

  const fetchPostChargesCounts = async () => {
    if (!targetRoom) return { a: 0, b: 0 }
    try {
      const [pcA, pcB] = await Promise.all([
        PostChargesService.list({
          checkin_id: selectedRoom.checkin.checkin_id,
          room_id: selectedRoom.detail.room_id,
        }),
        PostChargesService.list({
          checkin_id: targetRoom.checkin.checkin_id,
          room_id: targetRoom.detail.room_id,
        }),
      ])
      const countA = (pcA.data || []).length
      const countB = (pcB.data || []).length
      return { a: countA, b: countB }
    } catch {
      return { a: 0, b: 0 }
    }
  }

  /** Build charges with correct tax% from mode_charges for any OccupiedRoom */
  const buildChargesWithTax = (
    room: OccupiedRoom,
    modeCharges: any[],
    taxMap: Map<number, number>,
  ) => {
    const nights = room.detail.no_of_days || 1
    const exPaxCount = room.detail.ex_pax || 0
    const childCount = room.checkin.child_paid || 0
    const driverCount = room.detail.driver || 0

    const computeMode = (modeName: string, count: number) => {
      const mode = modeCharges.find((m: any) => m.mode_name === modeName)
      if (!mode || count <= 0) return { price: 0, tax: 0, taxPercent: 0, total: 0 }
      const perNightPrice = mode.charges * count
      let taxPercent = 0
      if (mode.is_tax_applicable && mode.tax_type) {
        taxPercent = taxMap.get(Number(mode.tax_type)) || 0
      }
      const perNightTax = (perNightPrice * taxPercent) / 100
      return {
        price: perNightPrice * nights,
        tax: perNightTax * nights,
        taxPercent,
        total: (perNightPrice + perNightTax) * nights,
      }
    }

    const exPaxCalc = computeMode('EXTRA_PAX', exPaxCount)
    const childCalc = computeMode('CHILD', childCount)
    const driverCalc = computeMode('DRIVER', driverCount)

    if (modeCharges.length === 0) return room.charges

    return {
      ex_pax_price: room.charges?.ex_pax_price ?? exPaxCalc.price,
      ex_pax_tax_percent: exPaxCalc.taxPercent,
      ex_pax_tax: exPaxCalc.tax,
      ex_pax_total: room.charges?.ex_pax_total ?? exPaxCalc.total,
      child_price: room.charges?.child_price ?? childCalc.price,
      child_tax_percent: childCalc.taxPercent,
      child_tax: childCalc.tax,
      child_total: room.charges?.child_total ?? childCalc.total,
      driver_price: room.charges?.driver_price ?? driverCalc.price,
      driver_tax_percent: driverCalc.taxPercent,
      driver_tax: driverCalc.tax,
      driver_total: room.charges?.driver_total ?? driverCalc.total,
    }
  }

  const selectedRow = useMemo(
    () =>
      buildRoomDataRowFromDetail(
        selectedRoom.detail,
        selectedRoom.checkin,
        buildChargesWithTax(selectedRoom, selectedModeCharges, selectedTaxMap),
      ),
    [selectedRoom, selectedModeCharges, selectedTaxMap],
  )

  const targetRow = useMemo(() => {
    if (!targetRoom) return null
    return buildRoomDataRowFromDetail(
      targetRoom.detail,
      targetRoom.checkin,
      buildChargesWithTax(targetRoom, targetModeCharges, targetTaxMap),
    )
  }, [targetRoom, targetModeCharges, targetTaxMap])

  const performSwap = async () => {
    if (!targetRoom) {
      toast.error('Please select a target room')
      return
    }

    // Guard: both rooms must have a valid room_id
    const selRoomId = selectedRoom.detail.room_id
    const tgtRoomId = targetRoom.detail.room_id
    if (!selRoomId || !tgtRoomId) {
      toast.error(
        'Cannot swap: one or both rooms are missing a room_id. Please refresh and try again.',
      )
      return
    }

    setLoadingUpdate(true)
    try {
      // ── 1. Swap CheckIn room_no ──────────────────────────────────────────────
      await Promise.all([
        CheckInService.update(selectedRoom.checkin.checkin_id, {
          room_no: targetRoom.roomNo,
        }),
        CheckInService.update(targetRoom.checkin.checkin_id, {
          room_no: selectedRoom.roomNo,
        }),
      ])

      // ── 2. Swap Detail room_id / room_number ─────────────────────────────────
      await Promise.all([
        DetailService.update(selectedRoom.detail.detail_id, {
          room_id: tgtRoomId,
          room_number: targetRoom.roomNo,
        }),
        DetailService.update(targetRoom.detail.detail_id, {
          room_id: selRoomId,
          room_number: selectedRoom.roomNo,
        }),
      ])

      // ── 3. Swap GuestRoomCharges room_id ─────────────────────────────────────
      // Filter by BOTH checkin_id AND room_id so that multi-room bookings only
      // update the charge rows belonging to the specific room being swapped.
      const [charges1, charges2] = await Promise.all([
        GuestRoomChargesService.list({ checkin_id: selectedRoom.checkin.checkin_id }),
        GuestRoomChargesService.list({ checkin_id: targetRoom.checkin.checkin_id }),
      ])

      // Filter to only the rows that belong to each respective room
      const chargesArray1 = (charges1.data || []).filter(
        (c: any) => Number(c.room_id) === Number(selRoomId),
      )
      const chargesArray2 = (charges2.data || []).filter(
        (c: any) => Number(c.room_id) === Number(tgtRoomId),
      )

      // Guest A's charges: keep checkin_id/guest_id, update room_id to their NEW room (B)
      const updatePromises1 = chargesArray1.map((charge: any) =>
        GuestRoomChargesService.update(charge.guest_room_charges_id, {
          room_id: tgtRoomId,
          guest_id: selectedRoom.checkin.guest_id,
          checkin_id: selectedRoom.checkin.checkin_id,
        }),
      )
      // Guest B's charges: keep checkin_id/guest_id, update room_id to their NEW room (A)
      const updatePromises2 = chargesArray2.map((charge: any) =>
        GuestRoomChargesService.update(charge.guest_room_charges_id, {
          room_id: selRoomId,
          guest_id: targetRoom.checkin.guest_id,
          checkin_id: targetRoom.checkin.checkin_id,
        }),
      )
      await Promise.all([...updatePromises1, ...updatePromises2])

      // ── 4. Swap Advance Transactions ─────────────────────────────────────────
      // The backend swapBetweenRooms API correctly keeps each guest's checkin_id
      // unchanged and only updates the room_id/room_no on their advance records
      // to reflect their new physical room. This ensures advances follow the GUEST.
      console.log('Calling swapBetweenRooms with payload:', {
        room_a_checkin_id: selectedRoom.checkin.checkin_id,
        room_a_room_id: selRoomId,
        room_a_room_no: selectedRoom.roomNo,
        room_b_checkin_id: targetRoom.checkin.checkin_id,
        room_b_room_id: tgtRoomId,
        room_b_room_no: targetRoom.roomNo,
      })

      const advRes = await AdvanceTransactionService.swapBetweenRooms({
        room_a_checkin_id: selectedRoom.checkin.checkin_id,
        room_a_room_id: selRoomId,
        room_a_room_no: selectedRoom.roomNo,
        room_b_checkin_id: targetRoom.checkin.checkin_id,
        room_b_room_id: tgtRoomId,
        room_b_room_no: targetRoom.roomNo,
      })

      console.log('Advance swap result:', advRes)

      const swappedA = advRes?.data?.swapped_a || 0
      const swappedB = advRes?.data?.swapped_b || 0

      // ── 5. Swap Post Charges (CHARGE + ALLOWANCE) between rooms ─────────────
      // Post charges follow the GUEST to their new room, same as advances.
      let pcSwappedA = 0
      let pcSwappedB = 0
      try {
        const pcSwapRes = await PostChargesService.swapBetweenRooms({
          room_a_checkin_id: selectedRoom.checkin.checkin_id,
          room_a_room_id: selRoomId,
          room_b_checkin_id: targetRoom.checkin.checkin_id,
          room_b_room_id: tgtRoomId,
        })
        pcSwappedA = pcSwapRes?.data?.swapped_a || 0
        pcSwappedB = pcSwapRes?.data?.swapped_b || 0
        if (pcSwappedA > 0 || pcSwappedB > 0) {
          console.log(
            `Swapped post charges: ${pcSwappedA} from ${selectedRoom.roomNo}, ${pcSwappedB} from ${targetRoom.roomNo}`,
          )
        }
      } catch (pcErr) {
        // Non-fatal: log but don't block the swap
        console.warn('Could not swap post charges (non-fatal):', pcErr)
      }

      let advanceMessage = ''
      if (swappedA > 0 || swappedB > 0) {
        advanceMessage = ` ${swappedA} advance(s) moved from ${selectedRoom.roomNo} to ${targetRoom.roomNo}, ${swappedB} advance(s) moved from ${targetRoom.roomNo} to ${selectedRoom.roomNo}`
      } else {
        advanceMessage = ' No advances found to swap'
      }

      let postChargesMessage = ''
      if (pcSwappedA > 0 || pcSwappedB > 0) {
        postChargesMessage = ` ${pcSwappedA} post charge(s) moved from ${selectedRoom.roomNo}, ${pcSwappedB} from ${targetRoom.roomNo}`
      }

      toast.success(
        `Successfully swapped rooms ${selectedRoom.roomNo} ↔ ${targetRoom.roomNo}.${advanceMessage}${postChargesMessage ? '\n' + postChargesMessage : ''}`,
      )
      setTargetRoomNo('')
      setShowSwapPreview(false)
      setAdvanceTransferStatus({ a: swappedA, b: swappedB })
      setPostChargesCounts({ a: pcSwappedA, b: pcSwappedB })
      await onRefresh()
    } catch (error) {
      console.error('Swap failed:', error)
      toast.error('Failed to swap rooms. Please check the console for details.')
    } finally {
      setLoadingUpdate(false)
    }
  }

  const handleTest = async () => {
    if (!targetRoom) {
      toast.error('Please select a target room')
      return
    }
    const [counts, pcCounts] = await Promise.all([fetchAdvanceCounts(), fetchPostChargesCounts()])
    setAdvanceTransferStatus(counts)
    setPostChargesCounts(pcCounts)
    setShowSwapPreview(true)
    toast.success(
      `Swap preview ready. Room A: ${counts.a} advance(s), ${pcCounts.a} post charge(s) | Room B: ${counts.b} advance(s), ${pcCounts.b} post charge(s)`,
    )
  }

  const handleUpdate = () => performSwap()

  const allHeaders = [
    { key: '#', label: '#' },
    { key: 'date', label: 'Date' },
    { key: 'guest', label: 'Guest' },
    { key: 'guestId', label: 'Guest ID' },
    { key: 'roomNo', label: 'Room N' },
    { key: 'type', label: 'Type' },
    { key: 'convCat', label: 'Conv. Cat' },
    { key: 'aDate', label: 'A_Date' },
    { key: 'aTime', label: 'A_Time' },
    { key: 'dDate', label: 'D_Date' },
    { key: 'dTime', label: 'D_Time' },
    { key: 'adults', label: 'Adults' },
    { key: 'pax', label: 'Pax' },
    { key: 'exPax', label: 'Ex_Pax' },
    { key: 'exPaxPrice', label: 'Ex_Pax Price' },
    { key: 'exPaxTaxPercent', label: 'Ex_Pax Tax %' },
    { key: 'exPaxTax', label: 'Ex_Pax Tax' },
    { key: 'exPaxTotal', label: 'Ex_Pax Total' },
    { key: 'childPaid', label: 'Child Paid' },
    { key: 'childUnpaid', label: 'Child Unpaid' },
    { key: 'childPrice', label: 'Child Price' },
    { key: 'childTaxPercent', label: 'Child Tax %' },
    { key: 'childTax', label: 'Child Tax' },
    { key: 'childTotal', label: 'Child Total' },
    { key: 'driver', label: 'Driver' },
    { key: 'driverPrice', label: 'Driver Price' },
    { key: 'driverTaxPercent', label: 'Driver Tax %' },
    { key: 'driverTax', label: 'Driver Tax' },
    { key: 'driverTotal', label: 'Driver Total' },
    { key: 'nights', label: 'Day' },
    { key: 'rate', label: 'Rate' },
    { key: 'discountPercent', label: 'Dis' },
    { key: 'discountAmt', label: 'Dis Amt' },
    { key: 'taxPercent', label: 'Tax %' },
    { key: 'taxAmount', label: 'Tax Amt' },
    { key: 'totalAmount', label: 'Total' },
  ]

  const renderFullRow = (row: any, idx: number, showAdvanceInfo?: boolean) => (
    <tr key={idx}>
      <td>{idx + 1}</td>
      <td>{row.date}</td>
      <td>{row.guestName}</td>
      <td>{row.guestId}</td>
      <td className={showSwapPreview ? 'highlight-cell' : ''}>
        {row.roomNo}
        {showAdvanceInfo && advanceTransferStatus && advanceTransferStatus.a > 0 && idx === 0 && (
          <span className="badge bg-info ms-1" style={{ fontSize: '0.6rem' }}>
            {advanceTransferStatus.a} adv
          </span>
        )}
        {showAdvanceInfo && advanceTransferStatus && advanceTransferStatus.b > 0 && idx === 1 && (
          <span className="badge bg-info ms-1" style={{ fontSize: '0.6rem' }}>
            {advanceTransferStatus.b} adv
          </span>
        )}
        {showAdvanceInfo && postChargesCounts && postChargesCounts.a > 0 && idx === 0 && (
          <span className="badge bg-warning ms-1" style={{ fontSize: '0.6rem' }}>
            {postChargesCounts.a} pc
          </span>
        )}
        {showAdvanceInfo && postChargesCounts && postChargesCounts.b > 0 && idx === 1 && (
          <span className="badge bg-warning ms-1" style={{ fontSize: '0.6rem' }}>
            {postChargesCounts.b} pc
          </span>
        )}
      </td>
      <td>{row.type}</td>
      <td>{row.convCat}</td>
      <td>{row.aDate}</td>
      <td>{row.aTime}</td>
      <td>{row.dDate}</td>
      <td>{row.dTime}</td>
      <td>{row.adults}</td>
      <td>{row.pax}</td>
      <td>{row.exPax}</td>
      <td>{row.exPaxPrice}</td>
      <td>{row.exPaxTaxPercent}%</td>
      <td>{row.exPaxTax}</td>
      <td>{row.exPaxTotal}</td>
      <td>{row.childPaid}</td>
      <td>{row.childUnpaid}</td>
      <td>{row.childPrice}</td>
      <td>{row.childTaxPercent}%</td>
      <td>{row.childTax}</td>
      <td>{row.childTotal}</td>
      <td>{row.driver}</td>
      <td>{row.driverPrice}</td>
      <td>{row.driverTaxPercent}%</td>
      <td>{row.driverTax}</td>
      <td>{row.driverTotal}</td>
      <td>{row.nights}</td>
      <td>{row.rate}</td>
      <td>{row.discountPercent}%</td>
      <td>{row.discountAmt}</td>
      <td>{row.taxPercent}%</td>
      <td>{row.taxAmount}</td>
      <td>{row.totalAmount}</td>
    </tr>
  )

  return (
    <ActionBox title="Swap Rooms" onClose={onClose}>
      {/* Swap Preview Section */}
      <div className="action-table-container mb-3">
        <div className="small fw-bold mb-1">
          {showSwapPreview ? 'Swap Preview (After Swap)' : 'Current Room Details'}
          {advanceTransferStatus &&
            (advanceTransferStatus.a > 0 || advanceTransferStatus.b > 0) && (
              <span className="ms-2 text-info">
                (Advances: A: {advanceTransferStatus.a}, B: {advanceTransferStatus.b}
                {postChargesCounts && (postChargesCounts.a > 0 || postChargesCounts.b > 0)
                  ? ` | Post Charges: A: ${postChargesCounts.a}, B: ${postChargesCounts.b}`
                  : ''}
                )
              </span>
            )}
        </div>
        <table className="action-table table table-bordered text-center align-middle">
          <thead className="table-light">
            <tr>
              {allHeaders.map((header) => (
                <th key={header.key}>{header.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {showSwapPreview && targetRow ? (
              <>
                {/* After swap: Room A becomes Room B's data */}
                {renderFullRow({ ...targetRow, roomNo: targetRoom?.roomNo }, 0, true)}
                {/* After swap: Room B becomes Room A's data */}
                {renderFullRow({ ...selectedRow, roomNo: selectedRoom.roomNo }, 1, true)}
              </>
            ) : (
              renderFullRow(selectedRow, 0, false)
            )}
          </tbody>
        </table>
      </div>

      {/* Room Selection */}
      <div className="d-flex align-items-center justify-content-center gap-3 mb-3">
        <span className="fw-bold">Swap To Room No</span>
        <Form.Select
          size="sm"
          style={{ width: '250px' }}
          value={targetRoomNo}
          onChange={(e) => setTargetRoomNo(e.target.value)}
          className="fs-small"
          disabled={loadingUpdate}>
          <option value="">Select a room to swap with</option>
          {otherRooms.map((r) => (
            <option key={r.detail.detail_id} value={r.roomNo}>
              {r.roomNo} - {r.checkin.guest_name}
            </option>
          ))}
        </Form.Select>
      </div>

      {/* Target Room Details */}
      <div className="action-table-container mb-3">
        <div className="small fw-bold mb-1">Target Room Details (Before Swap)</div>
        <table className="action-table table table-bordered text-center align-middle">
          <thead className="table-light">
            <tr>
              {allHeaders.map((header) => (
                <th key={header.key}>{header.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {targetRow ? (
              renderFullRow(targetRow, 0, false)
            ) : (
              <tr>
                <td colSpan={allHeaders.length} className="text-center text-muted">
                  {otherRooms.length === 0 ? 'No other rooms available' : 'Select a room above'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="action-footer">
        <Button
          size="sm"
          variant="info"
          onClick={handleTest}
          disabled={!targetRoom || loadingUpdate}>
          Test
        </Button>
        <Button size="sm" variant="success" onClick={handleUpdate} disabled={loadingUpdate}>
          {loadingUpdate ? 'Swapping...' : 'Swap Rooms'}
        </Button>
        <Button size="sm" variant="secondary" onClick={onClose} disabled={loadingUpdate}>
          Close
        </Button>
      </div>
    </ActionBox>
  )
}


// ================== Apply Discount Component ==================
interface ApplyDiscountProps {
  selectedRoom: OccupiedRoom
  allRoomsDetails: Detail[]
  onClose: () => void
  onRefresh: () => void
}

const ApplyDiscountComponent = ({
  selectedRoom,
  allRoomsDetails,
  onClose,
  onRefresh,
}: ApplyDiscountProps) => {
  const originalDiscount = selectedRoom.detail.discount_percent || 0
  const [tempDiscountPercent, setTempDiscountPercent] = useState(originalDiscount)
  const [previewActive, setPreviewActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const [folioPreviewData, setFolioPreviewData] = useState<any[]>([])

  useEffect(() => {
    setTempDiscountPercent(originalDiscount)
    setPreviewActive(false)
  }, [originalDiscount])

  const previewRow = useMemo(() => {
    const updatedDetail = { ...selectedRoom.detail, discount_percent: tempDiscountPercent }
    return buildRoomDataRowFromDetail(updatedDetail, selectedRoom.checkin, selectedRoom.charges)
  }, [selectedRoom, tempDiscountPercent])

  const originalRow = buildRoomDataRowFromDetail(
    selectedRoom.detail,
    selectedRoom.checkin,
    selectedRoom.charges,
  )

  const handleTest = () => {
    setPreviewActive(true)
    toast.success('Preview updated')
  }

  const handleUpdate = async () => {
    setLoading(true)
    try {
      const detail = selectedRoom.detail
      const nights = detail.no_of_days || 1
      const rate = detail.room_tariff || 0
      const discountAmount = (rate * nights * tempDiscountPercent) / 100

      await DetailService.update(detail.detail_id, {
        discount_percent: tempDiscountPercent,
      })

      const chargesId = selectedRoom.charges?.guest_room_charges_id || selectedRoom.charges?.id
      if (chargesId) {
        const updatedDetail = {
          ...detail,
          discount_percent: tempDiscountPercent,
        }
        const updatedRow = buildRoomDataRowFromDetail(
          updatedDetail,
          selectedRoom.checkin,
          selectedRoom.charges,
        )
        const newTotalAmount = parseFloat(updatedRow.totalAmount)
        await GuestRoomChargesService.update(chargesId, {
          total_amount: newTotalAmount,
          guest_id: selectedRoom.checkin.guest_id,
          room_id: detail.room_id,
          checkin_id: selectedRoom.checkin.checkin_id,
        })
      } else {
        const updatedDetail = {
          ...detail,
          discount_percent: tempDiscountPercent,
        }
        const updatedRow = buildRoomDataRowFromDetail(updatedDetail, selectedRoom.checkin, null)
        const newTotalAmount = parseFloat(updatedRow.totalAmount)
        await GuestRoomChargesService.create({
          guest_id: selectedRoom.checkin.guest_id,
          room_id: detail.room_id,
          checkin_id: selectedRoom.checkin.checkin_id,
          total_amount: newTotalAmount,
        })
      }

      const folioRes = await GuestFolioService.list({ checkin_id: selectedRoom.checkin.checkin_id })
      const folioEntries = folioRes.data || []
      const existingDiscountEntry = folioEntries.find(
        (entry) => entry.transaction_type === 'Discount' && entry.detail_id === detail.detail_id,
      )

      if (tempDiscountPercent === 0) {
        if (existingDiscountEntry) {
          await GuestFolioService.remove(existingDiscountEntry.folio_id)
        }
      } else {
        const discountDescription = `Discount ${tempDiscountPercent}% applied`
        if (existingDiscountEntry) {
          await GuestFolioService.update(existingDiscountEntry.folio_id, {
            credit_amount: discountAmount,
            description: discountDescription,
          })
        } else {
          await GuestFolioService.create({
            checkin_id: selectedRoom.checkin.checkin_id,
            hotelid: selectedRoom.checkin.hotelid,
            detail_id: detail.detail_id,
            transaction_type: 'Discount',
            transaction_datetime: new Date().toISOString(),
            description: discountDescription,
            credit_amount: discountAmount,
            payment_method: '',
          })
        }
      }

      toast.success(`Discount applied: ${tempDiscountPercent}%`)

      try {
        const folioRes = await GuestFolioService.list({
          checkin_id: selectedRoom.checkin.checkin_id,
        })
        const recentFolios = folioRes.data || []
        const discountFolios = recentFolios.filter(
          (f: any) =>
            f.transaction_type === 'Discount' && f.detail_id === selectedRoom.detail.detail_id,
        )
        setFolioPreviewData(discountFolios)
        setShowConfirmationDialog(true)
      } catch (folioError) {
        console.warn('Could not fetch folio for preview:', folioError)
      }

      onRefresh()
    } catch (error) {
      console.error('Failed to apply discount:', error)
      toast.error('Could not apply discount')
    } finally {
      setLoading(false)
    }
  }

  const currentRow = previewActive ? previewRow : originalRow

  const allHeaders = [
    { key: '#', label: '#' },
    { key: 'date', label: 'Date' },
    { key: 'guest', label: 'Guest' },
    { key: 'guestId', label: 'Guest ID' },
    { key: 'roomNo', label: 'Room N' },
    { key: 'type', label: 'Type' },
    { key: 'convCat', label: 'Conv. Cat' },
    { key: 'aDate', label: 'A_Date' },
    { key: 'aTime', label: 'A_Time' },
    { key: 'dDate', label: 'D_Date' },
    { key: 'dTime', label: 'D_Time' },
    { key: 'adults', label: 'Adults' },
    { key: 'pax', label: 'Pax' },
    { key: 'exPax', label: 'Ex_Pax' },
    { key: 'exPaxPrice', label: 'Ex_Pax Price' },
    { key: 'exPaxTaxPercent', label: 'Ex_Pax Tax %' },
    { key: 'exPaxTax', label: 'Ex_Pax Tax' },
    { key: 'exPaxTotal', label: 'Ex_Pax Total' },
    { key: 'childPaid', label: 'Child Paid' },
    { key: 'childUnpaid', label: 'Child Unpaid' },
    { key: 'childPrice', label: 'Child Price' },
    { key: 'childTaxPercent', label: 'Child Tax %' },
    { key: 'childTax', label: 'Child Tax' },
    { key: 'childTotal', label: 'Child Total' },
    { key: 'driver', label: 'Driver' },
    { key: 'driverPrice', label: 'Driver Price' },
    { key: 'driverTaxPercent', label: 'Driver Tax %' },
    { key: 'driverTax', label: 'Driver Tax' },
    { key: 'driverTotal', label: 'Driver Total' },
    { key: 'nights', label: 'Day' },
    { key: 'rate', label: 'Rate' },
    { key: 'discountPercent', label: 'Dis' },
    { key: 'discountAmt', label: 'Dis Amt' },
    { key: 'taxPercent', label: 'Tax %' },
    { key: 'taxAmount', label: 'Tax Amt' },
    { key: 'totalAmount', label: 'Total' },
  ]

  return (
    <ActionBox title="Apply Discount" onClose={onClose}>
      <div className="border p-2 mb-2">
        <div className="d-flex align-items-center gap-4">
          <div className="d-flex align-items-center">
            <Form.Label className="fs-small mb-0 me-2 fw-bold" style={{ minWidth: '130px' }}>
              Current Discount (%)
            </Form.Label>
            <Form.Control
              type="text"
              size="sm"
              value={originalDiscount}
              readOnly
              className="bg-light"
              style={{ width: '100px' }}
            />
          </div>

          <div className="d-flex align-items-center">
            <Form.Label className="fs-small mb-0 me-2 fw-bold" style={{ minWidth: '120px' }}>
              New Discount (%)
            </Form.Label>
            <Form.Control
              type="number"
              size="sm"
              value={tempDiscountPercent}
              onChange={(e) => setTempDiscountPercent(Number(e.target.value))}
              min={0}
              max={100}
              step={1}
              style={{ width: '100px' }}
            />
          </div>
        </div>
      </div>

      <div className="action-table-container">
        <table className="action-table table table-bordered text-center align-middle">
          <thead className="table-light">
            <tr>
              {allHeaders.map((header) => (
                <th key={header.key}>{header.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentRow ? (
              <tr>
                <td>1</td>
                <td>{currentRow.date}</td>
                <td>{currentRow.guestName}</td>
                <td>{currentRow.guestId}</td>
                <td>{currentRow.roomNo}</td>
                <td>{currentRow.type}</td>
                <td>{currentRow.convCat}</td>
                <td>{currentRow.aDate}</td>
                <td>{currentRow.aTime}</td>
                <td>{currentRow.dDate}</td>
                <td>{currentRow.dTime}</td>
                <td>{currentRow.adults}</td>
                <td>{currentRow.pax}</td>
                <td>{currentRow.exPax}</td>
                <td>{currentRow.exPaxPrice}</td>
                <td>{currentRow.exPaxTaxPercent}%</td>
                <td>{currentRow.exPaxTax}</td>
                <td>{currentRow.exPaxTotal}</td>
                <td>{currentRow.childPaid}</td>
                <td>{currentRow.childUnpaid}</td>
                <td>{currentRow.childPrice}</td>
                <td>{currentRow.childTaxPercent}%</td>
                <td>{currentRow.childTax}</td>
                <td>{currentRow.childTotal}</td>
                <td>{currentRow.driver}</td>
                <td>{currentRow.driverPrice}</td>
                <td>{currentRow.driverTaxPercent}%</td>
                <td>{currentRow.driverTax}</td>
                <td>{currentRow.driverTotal}</td>
                <td>{currentRow.nights}</td>
                <td>{currentRow.rate}</td>
                <td
                  className={
                    previewActive && tempDiscountPercent !== originalDiscount
                      ? 'highlight-cell'
                      : ''
                  }>
                  {currentRow.discountPercent}%
                </td>
                <td>{currentRow.discountAmt}</td>
                <td>{currentRow.taxPercent}%</td>
                <td>{currentRow.taxAmount}</td>
                <td>{currentRow.totalAmount}</td>
              </tr>
            ) : (
              <tr>
                <td colSpan={allHeaders.length} className="text-muted">
                  No data
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="action-footer">
        <Button size="sm" variant="info" onClick={handleTest}>
          Test
        </Button>
        <Button size="sm" variant="success" onClick={handleUpdate} disabled={loading}>
          {loading ? 'Applying...' : 'Apply'}
        </Button>
        <Button size="sm" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>

      {showConfirmationDialog && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}>
          <div
            className="bg-white p-4 rounded shadow-lg"
            style={{ maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0 fw-bold">✅ Folio Updated Successfully</h6>
              <button className="btn-close" onClick={() => setShowConfirmationDialog(false)} />
            </div>
            <div className="mb-3">
              <strong>Room:</strong> {selectedRoom.roomNo} |<strong> Discount:</strong>{' '}
              {tempDiscountPercent}% |<strong> Amount:</strong> ₹{previewRow?.discountAmt || 0}
            </div>
            <h6 className="text-success mb-2">Guest Folio Master Entry:</h6>
            {folioPreviewData.length > 0 ? (
              folioPreviewData.map((folio, idx) => (
                <div key={idx} className="border p-2 mb-2 rounded bg-light">
                  <div>
                    <strong>ID:</strong> {folio.folio_id}
                  </div>
                  <div>
                    <strong>Type:</strong> {folio.transaction_type}
                  </div>
                  <div>
                    <strong>Date:</strong> {new Date(folio.transaction_datetime).toLocaleString()}
                  </div>
                  <div className="fw-bold fs-small">
                    💳 Credit: ₹{folio.credit_amount || 0} | 💰 Debit: ₹{folio.debit_amount || 0}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-muted">Folio entry created (refresh to view)</div>
            )}
            <div className="mt-3 pt-2 border-top">
              <Button
                size="sm"
                variant="success"
                className="me-2"
                onClick={() => setShowConfirmationDialog(false)}>
                OK
              </Button>
            </div>
          </div>
        </div>
      )}
    </ActionBox>
  )
}

export default Amendments