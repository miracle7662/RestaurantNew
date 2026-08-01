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
import taxApi from '@/common/hotel/taxes'
import RoomService, { ChangeRoomCategoryPayload } from '@/common/hotel/room';
import PostChargesService from '@/common/hotel/postCharges'
import AdvanceTransactionService from '@/common/hotel/advanceTransaction'
import RoomTransferService from '@/common/hotel/roomTransferService';


// Components for modals
import GuestForm from '../Guest/GuestForm'
import FormModal from '@/components/Common/models/FormModal'


import DiscountService from '@/common/hotel/discount'


// Types
interface OccupiedRoom {
  roomNo: string
  checkin: CheckIn
  detail: Detail
  guest?: any
  company?: any
  charges?: any
  outletid?: number
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
          .filter((room: any) => {
            const s = String(room.room_status ?? '').toLowerCase().trim()
            const statusId = String(room.room_status_id ?? '').trim()

            // Accept multiple possible backend values
            return (
              s === 'available' ||
              s === 'vacant' ||
              s === 'free' ||
              s === '0' ||
              statusId === '0' ||
              statusId === '1'
            )
          })
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

// ================== Pax Change Component (FIXED - Using proper API services) ==================
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
  const { user } = useAuthContext()
  const hotelId = user?.hotel_id
  console.log('PaxChangeComponent - selectedRoom:', hotelId)

  const originalPax = selectedRoom.detail.pax || 0
  const originalExPax = selectedRoom.detail.ex_pax || 0
  const originalChildPaid = selectedRoom.checkin.child_paid || 0
  const originalDriver = selectedRoom.detail.driver || 0

  // Combined total guests (Pax + ExPax)
  const [tempTotalGuests, setTempTotalGuests] = useState(originalPax + originalExPax)
  const [tempPax, setTempPax] = useState(originalPax)
  const [tempExPax, setTempExPax] = useState(originalExPax)
  const [tempChildPaid, setTempChildPaid] = useState(originalChildPaid)
  const [tempDriver, setTempDriver] = useState(originalDriver)
  const [previewActive, setPreviewActive] = useState(false)
  const [modeCharges, setModeCharges] = useState<any[]>([])
  const [taxMap, setTaxMap] = useState<Map<number, number>>(new Map())
  const [loadingUpdate, setLoadingUpdate] = useState(false)
  
  // Category pax limits
  const [categoryMaxPax, setCategoryMaxPax] = useState<number | null>(null)
  const [categoryMaxLimit, setCategoryMaxLimit] = useState<number | null>(null)
  const [tariffSlabs, setTariffSlabs] = useState<Array<{ no_of_pax: number; room_tariff: number }>>([])

  useEffect(() => {
    setTempPax(originalPax)
    setTempExPax(originalExPax)
    setTempTotalGuests(originalPax + originalExPax)
    setTempChildPaid(originalChildPaid)
    setTempDriver(originalDriver)
    setPreviewActive(false)
  }, [originalPax, originalExPax, originalChildPaid, originalDriver])

  // Fetch category details
  useEffect(() => {
    const fetchCategoryData = async () => {
      const effectiveCategoryId =
        selectedRoom.detail.converted_category_id || selectedRoom.detail.room_category_id
      if (!effectiveCategoryId) return
      
      try {
        const catRes = await RoomCategoryService.get(effectiveCategoryId)
        const catData = catRes.data || catRes
        
        const tariffs = catData.tariffs || []
        setTariffSlabs(tariffs)
        
        const paxValues = tariffs
          .map((t: any) => Number(t.no_of_pax))
          .filter((v: number) => v > 0)
        setCategoryMaxPax(paxValues.length ? Math.max(...paxValues) : null)
        
        setCategoryMaxLimit(catData.max_limit != null ? Number(catData.max_limit) : null)
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
    fetchCategoryData()
  }, [selectedRoom])

  const nights = selectedRoom.detail.no_of_days || 1

  const computeModeCharges = (modeName: string, count: number) => {
    const mode = modeCharges.find((m: any) => m.mode_name === modeName)
    if (!mode || count <= 0) {
      return { price: 0, tax: 0, taxPercent: 0, total: 0, perNightPrice: 0 }
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
      perNightPrice,
    }
  }

  // ============================================================
  // COMBINED PAX/EXPAX CONTROL WITH CATEGORY LIMIT LOGIC
  // ============================================================
  
  // Calculate distribution: Pax gets filled up to max, rest goes to ExPax
  const calculateDistribution = (totalGuests: number): { pax: number; exPax: number } => {
    const effectiveMaxPax = categoryMaxPax || categoryMaxLimit || 999
    
    if (totalGuests <= effectiveMaxPax) {
      return { pax: totalGuests, exPax: 0 }
    } else {
      return { pax: effectiveMaxPax, exPax: totalGuests - effectiveMaxPax }
    }
  }

  // Handle total guests increment
  const handleTotalGuestsIncrement = () => {
    const newTotal = tempTotalGuests + 1
    setTempTotalGuests(newTotal)
    
    const distribution = calculateDistribution(newTotal)
    setTempPax(distribution.pax)
    setTempExPax(distribution.exPax)
    setPreviewActive(false)
  }

  // Handle total guests decrement
  const handleTotalGuestsDecrement = () => {
    if (tempTotalGuests > 1) {
      const newTotal = tempTotalGuests - 1
      setTempTotalGuests(newTotal)
      
      const distribution = calculateDistribution(newTotal)
      setTempPax(distribution.pax)
      setTempExPax(distribution.exPax)
      setPreviewActive(false)
    }
  }

  // ============================================================
  // INCREMENT/DECREMENT HANDLERS FOR ALL FIELDS
  // ============================================================
  
  const handleIncrement = (field: 'totalGuests' | 'child' | 'driver') => {
    switch (field) {
      case 'totalGuests':
        handleTotalGuestsIncrement()
        break
      case 'child':
        setTempChildPaid((c: number) => c + 1)
        break
      case 'driver':
        setTempDriver((d: number) => d + 1)
        break
    }
    setPreviewActive(false)
  }

  const handleDecrement = (field: 'totalGuests' | 'child' | 'driver') => {
    switch (field) {
      case 'totalGuests':
        handleTotalGuestsDecrement()
        break
      case 'child':
        if (tempChildPaid > 0) setTempChildPaid((c: number) => c - 1)
        break
      case 'driver':
        if (tempDriver > 0) setTempDriver((d: number) => d - 1)
        break
    }
    setPreviewActive(false)
  }

  // ============================================================
  // HELPER: Get tariff for a given Pax count from tariffSlabs
  // ============================================================
  const getTariffForPax = (paxCount: number): number => {
    if (!tariffSlabs.length) {
      return selectedRoom.detail.room_tariff || 0
    }
    // Find exact match
    const slab = tariffSlabs.find((t) => Number(t.no_of_pax) === paxCount)
    if (slab) {
      return Number(slab.room_tariff)
    }
    // Fallback: highest available tariff
    const sorted = [...tariffSlabs].sort((a, b) => Number(a.no_of_pax) - Number(b.no_of_pax))
    const maxSlab = sorted[sorted.length - 1]
    if (maxSlab && paxCount > Number(maxSlab.no_of_pax)) {
      return Number(maxSlab.room_tariff)
    }
    // Keep original
    return selectedRoom.detail.room_tariff || 0
  }

  const exPaxCalc = computeModeCharges('EXTRA_PAX', tempExPax)
  const childCalc = computeModeCharges('CHILD', tempChildPaid)
  const driverCalc = computeModeCharges('DRIVER', tempDriver)

  const updatedRow = useMemo(() => {
    const newRoomTariff = getTariffForPax(tempPax)
    const updatedDetail = {
      ...selectedRoom.detail,
      pax: tempPax,
      ex_pax: tempExPax,
      driver: tempDriver,
      room_tariff: newRoomTariff,   // ✅ updated tariff
    }
    const updatedCheckin = { 
      ...selectedRoom.checkin, 
      child_paid: tempChildPaid,
      ex_pax: tempExPax,
      ex_pax_charge: exPaxCalc.price,
      child_charge: childCalc.price,
      driver: tempDriver,
      driver_charge: driverCalc.price,
    }
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
    tariffSlabs,   // ✅ now depends on tariffSlabs
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

  const handleTest = () => {
    setPreviewActive(true)
    toast.success('Preview updated')
  }

  const handleUpdate = async () => {
    setLoadingUpdate(true)
    try {
      await CheckInService.updatePaxDetails({
        checkin_id: selectedRoom.checkin.checkin_id,
        detail_id: selectedRoom.detail.detail_id,
        pax: tempPax,
        ex_pax: tempExPax,
        child_paid: tempChildPaid,
        driver: tempDriver,
        user_id: user?.id || 1,
      })

      toast.success(`Pax information updated successfully!
        Pax: ${tempPax} | ExPax: ${tempExPax} | Child: ${tempChildPaid} | Driver: ${tempDriver}`)
      
      onRefresh()
      onClose()
    } catch (error) {
      console.error('Update failed', error)
      toast.error('Failed to update pax information')
    } finally {
      setLoadingUpdate(false)
    }
  }

  // Calculate max limit display values
  const getMaxLimitDisplay = () => {
    if (tariffSlabs.length > 0) {
      const paxValues = tariffSlabs
        .map(t => Number(t.no_of_pax))
        .filter(v => v > 0)
      const maxPax = paxValues.length ? Math.max(...paxValues) : null
      
      let exPaxLimit = 'NA'
      if (maxPax !== null && categoryMaxLimit !== null) {
        exPaxLimit = String(Math.max(categoryMaxLimit - maxPax, 0))
      }
      
      return {
        paxLimit: maxPax !== null ? String(maxPax) : 'NA',
        exPaxLimit: exPaxLimit
      }
    }
    
    return {
      paxLimit: categoryMaxPax !== null ? String(categoryMaxPax) : 'NA',
      exPaxLimit: categoryMaxLimit !== null && categoryMaxPax !== null
        ? String(Math.max(categoryMaxLimit - categoryMaxPax, 0))
        : 'NA'
    }
  }

  const limits = getMaxLimitDisplay()

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

  const isChanged = (field: 'pax' | 'exPax' | 'child' | 'driver') => {
    if (!previewActive) return false
    switch (field) {
      case 'pax':
        return tempPax !== originalPax
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
            {/* Combined Pax/ExPax control */}
            <div className="d-flex align-items-center mb-1">
              <div style={{ width: '120px' }} className="fs-small">
                Pax/ExPax
              </div>
              <Button size="sm" variant="light" onClick={() => handleDecrement('totalGuests')}>
                -
              </Button>
              <input
                className="form-control form-control-sm"
                style={{ width: '50px' }}
                type="number"
                value={tempTotalGuests}
                readOnly
              />
              <Button size="sm" variant="light" onClick={() => handleIncrement('totalGuests')}>
                +
              </Button>
            </div>
            
            {/* Child - separate control */}
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
            
            {/* Driver - separate control */}
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
                  <td>{limits.paxLimit}</td>
                  <td>{limits.exPaxLimit}</td>
                  <td>NA</td>
                  <td>NA</td>
                </tr>
                <tr>
                  <td className="text-start fw-bold">Current Occupied</td>
                  <td>{originalPax}</td>
                  <td>{originalExPax}</td>
                  <td>{originalChildPaid}</td>
                  <td>{originalDriver}</td>
                </tr>
                <tr>
                  <td className="text-start fw-bold">Current Value</td>
                  <td>{tempPax}</td>
                  <td>{tempExPax}</td>
                  <td>{tempChildPaid}</td>
                  <td>{tempDriver}</td>
                </tr>
              </tbody>
            </table>
          </Col>
        </Row>
        <div className="text-muted small mt-2">
          <i className="bi bi-info-circle me-1"></i>
          Updates will be saved to: detail_master, checkin_master, guest_room_charges, and folio.
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
                <td className={isChanged('pax') ? 'highlight-cell' : ''}>{currentRow.pax}</td>
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
// 1. Per-room child count is fetched from checkin_guest_room_charges filtered by room_id
//    (not from selectedRoom.checkin.child_paid which is the whole-booking total).
// 2. Extra-charge rates (child, ex_pax, driver) are taken from detail fields
//    (child_paid_amount, ex_pax_charge, driver_charge) — same source HotelBookingPanel uses —
//    instead of re-fetching from category mode_charges which can differ.
// 3. computeStayModeCharge replaced by computeExtraCharge using per-person rate × count.
// 4. stayModeCharges / taxApi calls kept ONLY as fallback when detail fields are 0.
// 5. originalRow childPaid column is patched with resolvedChildCount (per-room) after
//    checkin_guest_room_charges are loaded — so the table never shows the booking-total child count.

interface StayAmendmentsProps {
  selectedRoom: any // OccupiedRoom type
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

  // Per-room child count resolved from getCheckinFullDetails (SP row for this specific room)
  const [perRoomChildCount, setPerRoomChildCount] = useState<number | null>(null)
  // Extension day-records for this room's detail — resolved from the SAME fetch, used by reduce validation
  const [extensionRows, setExtensionRows] = useState<any[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  const detail = selectedRoom.detail
  const checkin = selectedRoom.checkin

  // ── ONLY GET CALL IN THE WHOLE COMPONENT ─────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true)
      try {
        const fullDetailsRes = await RoomService.getCheckinFullDetails(hotelId, checkin.checkin_id)
        const allRows: any[] = fullDetailsRes.data?.details || []

        // Per-room child count: latest ROOM_CHARGE row for this room_id
        const roomRows = allRows
          .filter(
            (r: any) =>
              r.source_type === 'ROOM_CHARGE' && Number(r.room_id) === Number(detail.room_id),
          )
          .sort(
            (a: any, b: any) =>
              new Date(b.detail_checkin_datetime || b.charge_checkin_datetime || 0).getTime() -
              new Date(a.detail_checkin_datetime || a.charge_checkin_datetime || 0).getTime(),
          )

        setPerRoomChildCount(
          roomRows.length > 0
            ? Number(roomRows[0].child_count) || 0
            : Number(checkin.child_paid) || 0,
        )

        // Extension day-records belonging to this room's parent detail (for reduce-mode validation)
        const extRows = allRows.filter(
          (r: any) =>
            r.source_type === 'ROOM_CHARGE' && r.parent_detail_id === detail.detail_id,
        )
        setExtensionRows(extRows)
      } catch (err) {
        console.error('Failed to fetch checkin full details', err)
        setPerRoomChildCount(Number(checkin.child_paid) || 0)
        setExtensionRows([])
      } finally {
        setDataLoading(false)
      }
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom])

  // ── Resolved per-room counts ──────────────────────────────────────────────
  const resolvedChildCount =
    perRoomChildCount !== null ? perRoomChildCount : Number(checkin.child_paid) || 0

  const exPaxCountOnDetail = Number(detail.ex_pax) || 0
  const driverCountOnDetail = Number(detail.driver) || 0

  // ── Per-person rates from detail only ─────────────────────────────────────
  // (category mode_charges / tax-master fallback removed — those GET calls are gone)
  const getExPaxRatePerPerson = (): number => {
    const fromDetail = Number(detail.ex_pax_charge) || 0
    return fromDetail > 0 && exPaxCountOnDetail > 0 ? fromDetail / exPaxCountOnDetail : 0
  }

  const getChildRatePerPerson = (): number => {
    const fromDetail = Number(detail.child_paid_amount) || 0
    return fromDetail > 0 && resolvedChildCount > 0 ? fromDetail / resolvedChildCount : 0
  }

  const getDriverRatePerPerson = (): number => {
    const fromDetail = Number(detail.driver_charge) || 0
    return fromDetail > 0 && driverCountOnDetail > 0 ? fromDetail / driverCountOnDetail : 0
  }

  const getTaxPercent = (): number => {
    const igst = Number(detail.igst_percent) || 0
    if (igst > 0) return igst
    return (Number(detail.cgst_percent) || 0) + (Number(detail.sgst_percent) || 0)
  }

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
    const raw = buildRoomDataRowFromDetail(
      selectedRoom.detail,
      selectedRoom.checkin,
      selectedRoom.charges,
    )

    if (perRoomChildCount === null) return raw

    const childCount = resolvedChildCount
    const childCalc = computeExtraCharge(getChildRatePerPerson(), childCount, currentNights)

    return {
      ...raw,
      childPaid: childCount,
      childPrice: childCalc.price.toFixed(2),
      childTax: childCalc.tax.toFixed(2),
      childTaxPercent: childCalc.taxPercent,
      childTotal: childCalc.total.toFixed(2),
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom, perRoomChildCount])

  const previewRow = useMemo(() => {
    if (!previewActive) return null
    const preview = getPreviewData()
    if (!preview) return null

    const updatedDetail = {
      ...detail,
      no_of_days: preview.newNights,
      checkout_datetime: preview.newCheckoutDateTime,
    }

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoom, previewActive, mode, days, resolvedChildCount])

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
    if (mode === 'reduce' && extensionRows.length < days) {
      toast.error(`Cannot reduce by ${days} days. Only ${extensionRows.length} extension day(s) exist.`)
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
      if (mode === 'extend') {
        // ── ONLY ACTION CALL for extend ─────────────────────────────────
        // CheckInService.extendDay payload is strictly { roomId, extensionDays }
        const res = await CheckInService.extendDay(checkin.checkin_id, {
          roomId: detail.room_id,
          extensionDays: days,
        })
        const out = res.data // ExtendDayResponse: { checkin_id, new_checkout_datetime, new_total_amount, new_total_nights, checkin }
        const oldTotal = Number(checkin.total_amount) || 0
        const additionalAmount = Math.max(0, (Number(out?.new_total_amount) || 0) - oldTotal)
        toast.success(
          `Stay extended by ${days} day(s). Additional charge: ${formatAmount(additionalAmount)}`,
        )
      } else {
        // ⚠️ TEMPORARY: no dedicated reduce endpoint exists in CheckInService yet.
        // This only adjusts checkin_master totals via updatePartial — it does NOT
        // delete the underlying extension detail/charge/folio rows for the reduced days.
        // Replace with CheckInService.reduceDay(...) once that endpoint + SP exist.
        if (extensionRows.length < days) {
          toast.error(`Cannot reduce by ${days} days. Only ${extensionRows.length} extension day(s) exist.`)
          setLoading(false)
          return
        }

        // Best-effort refund estimate from the day-rows already fetched in useEffect
        const rowsToDrop = extensionRows.slice(-days)
        const refundAmount = rowsToDrop.reduce(
          (sum: number, r: any) => sum + (Number(r.total_amount) || 0),
          0,
        )
        const oldTotal = Number(checkin.total_amount) || 0
        const newTotal = Math.max(0, oldTotal - refundAmount)

        await CheckInService.updatePartial(checkin.checkin_id, {
          total_amount: newTotal,
          checkout_datetime: preview.newCheckoutDateTime,
          total_nights: Math.max(1, (Number(checkin.total_nights) || currentNights) - days),
        })

        toast.success(
          `Stay reduced by ${days} day(s). Refund amount: ${formatAmount(refundAmount)}`,
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

        {mode === 'reduce' && showDaysInput && (
          <div className="text-muted small mt-1">
            {extensionRows.length} extension day(s) available to reduce
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
            {dataLoading ? (
              <tr>
                <td colSpan={allHeaders.length} className="text-muted">
                  Loading...
                </td>
              </tr>
            ) : currentRow ? (
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

        // 1. Fetch full category details (tariffs, mode_charges) for the NEW category.
        //    KEPT: getCheckinFullDetails cannot provide this — it only reflects the
        //    guest's current stay, not an arbitrary target category.
        const catRes = await RoomCategoryService.get(catObj.room_category_id)
        const fullCat = catRes.data || catRes
        const modeCharges = fullCat.mode_charges || []
        setNewModeCharges(modeCharges)

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
        // 4. Fetch tax percentages for the NEW category's tax_type.
        //    KEPT: same reason as above — this is tax master data, not stay data.
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

        // 6. Fetch future records (today and future) for this room via the combined
        //    stored-procedure-backed endpoint. This is where DetailService.list and
        //    GuestRoomChargesService.list were replaced — both are subsumed by
        //    getCheckinFullDetails, so they are intentionally NOT called here.
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const fullDetailsRes = await RoomService.getCheckinFullDetails(
          selectedRoom.checkin.hotelid,
          selectedRoom.checkin.checkin_id,
          String(selectedRoom.detail.room_id),
        )
        const allRows = fullDetailsRes.data?.details || []

        // Sirf isi room ke rows
        const roomRows = allRows.filter((r) => r.detail_room_id === selectedRoom.detail.room_id)

        // "Detail" jaisi rows (checkin_detail table wale records)
        const futureDetails = roomRows
          .filter((r) => r.detail_id !== null && r.detail_checkin_datetime)
          .filter((r) => {
            const d = new Date(r.detail_checkin_datetime as string)
            d.setHours(0, 0, 0, 0)
            return d >= today
          })
          .map((r) => {
            const checkinD = new Date(r.detail_checkin_datetime as string)
            const checkoutD = new Date((r.detail_checkout_datetime as string) || r.detail_checkin_datetime as string)
            const nights = Math.max(
              1,
              Math.ceil((checkoutD.getTime() - checkinD.getTime()) / (1000 * 60 * 60 * 24)),
            )
            return {
              detail_id: r.detail_id,
              room_id: r.detail_room_id,
              checkin_datetime: r.detail_checkin_datetime,
              checkout_datetime: r.detail_checkout_datetime,
              no_of_days: nights, // ⚠️ API mein direct field nahi tha, date-diff se calculate kiya
              discount_percent: r.discount_percent || 0,
              ex_pax: r.detail_ex_pax || 0,
              driver: r.detail_driver || 0,
              child_paid_amount: r.detail_child_paid_amount || 0,
            } as unknown as Detail
          })

        // "Charges" jaisi rows (guest_room_charges table wale records)
        const futureCharges = roomRows
          .filter((r) => r.guest_room_charges_id !== null && r.charge_checkin_datetime)
          .filter((r) => {
            const d = new Date(r.charge_checkin_datetime as string)
            d.setHours(0, 0, 0, 0)
            return d >= today
          })
          .map((r) => ({
            guest_room_charges_id: r.guest_room_charges_id,
            room_id: r.detail_room_id,
            checkin_datetime: r.charge_checkin_datetime,
            checkout_datetime: r.charge_checkout_datetime,
            ex_pax_count: r.ex_pax_count || 0,
            child_count: r.child_count || 0,
            driver_count: r.driver_count || 0,
            pax_tax_percent: 0, // ⚠️ ye field naye API response mein directly nahi hai
          }))

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

    const extras = computeExtraChargesForCategory(
      newModeCharges,
      taxMap,
      exPaxCount,
      childCount,
      driverCount,
      nights,
    )

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

    // ========================================================================
  // UPDATED handleUpdate – single API call
  // ========================================================================
  const handleUpdate = async () => {
    if (originalCategory === tempNewCategory) {
      toast.error('No change in category');
      return;
    }
    if (!newCategoryId || !newTariff || !newTax) {
      toast.error('Category data not fully loaded');
      return;
    }

    setLoading(true);
    try {
      const discountPercent = selectedRoom.detail.discount_percent || 0;
      const nights = selectedRoom.detail.no_of_days || 1;

      // ---- Current room calculations ----
      const roomCalc = computeDayTaxes(newTariff, discountPercent, newTax);

      const exPaxCount = selectedRoom.detail.ex_pax || 0;
      const childCount = selectedRoom.checkin.child_paid || 0;
      const driverCount = selectedRoom.detail.driver || 0;
      const currentExtras = computeExtraChargesForCategory(
        newModeCharges,
        taxMap,
        exPaxCount,
        childCount,
        driverCount,
        nights,
      );

      // ---- 1. Build currentDetail ----
      const perNightExPaxCharge = currentExtras.exPax.price > 0 ? currentExtras.exPax.price / nights : 0;
      const perNightDriverCharge = driverCount > 0 && currentExtras.driver.price > 0
        ? currentExtras.driver.price / nights
        : 0;
      const perNightChildPaid = currentExtras.child.price > 0 ? currentExtras.child.price / nights : 0;

      const currentDetail = {
        detailId: selectedRoom.detail.detail_id,
        convertedCategoryId: newCategoryId,
        convertedCategoryName: tempNewCategory,
        roomTariff: newTariff,
        cgstPercent: roomCalc.cgstPercent,
        cgstAmount: roomCalc.cgstAmount,
        sgstPercent: roomCalc.sgstPercent,
        sgstAmount: roomCalc.sgstAmount,
        igstPercent: roomCalc.igstPercent,
        igstAmount: roomCalc.igstAmount,
        cessPercent: roomCalc.cessPercent,
        cessAmount: roomCalc.cessAmount,
        tax: roomCalc.taxAmount,
        discountAmount: roomCalc.discountAmount,
        exPaxCharge: perNightExPaxCharge,
        driverCharge: perNightDriverCharge,
        childPaidAmount: perNightChildPaid,
      };

      // ---- 2. Build currentCharges (if exists and is future) ----
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let currentCharges = null;

      if (selectedRoom.charges) {
        const chargeDate = selectedRoom.charges.checkout_datetime
          ? new Date(selectedRoom.charges.checkout_datetime)
          : new Date();
        chargeDate.setHours(0, 0, 0, 0);

        if (chargeDate >= today) {
          const chargesId = selectedRoom.charges.guest_room_charges_id || selectedRoom.charges.id;
          if (chargesId) {
            currentCharges = {
              chargesId,
              guestId: selectedRoom.checkin.guest_id,
              roomId: selectedRoom.detail.room_id,
              detailCheckinDatetime: selectedRoom.detail.detail_checkin_datetime,
              detailCheckoutDatetime: selectedRoom.detail.detail_checkout_datetime,
              categoryId: newCategoryId,
              paxPrice: newTariff,
              paxTax: roomCalc.taxAmount,
              exPaxPrice: currentExtras.exPax.price,
              exPaxTax: currentExtras.exPax.tax,
              exPaxTaxPercent: currentExtras.exPax.taxPercent,
              exPaxTotal: currentExtras.exPax.total,
              childPrice: currentExtras.child.price,
              childTax: currentExtras.child.tax,
              childTaxPercent: currentExtras.child.taxPercent,
              childTotal: currentExtras.child.total,
              driverPrice: currentExtras.driver.price,
              driverTax: currentExtras.driver.tax,
              driverTaxPercent: currentExtras.driver.taxPercent,
              driverTotal: currentExtras.driver.total,
              totalAmount:
                roomCalc.totalAfterTax +
                currentExtras.exPax.total +
                currentExtras.child.total +
                currentExtras.driver.total,
            };
          }
        }
      }

      // ---- 3. Build futureDetails array ----
      const futureDetails = futureRecords.details.map((detail) => {
        const detailNights = detail.no_of_days || 1;
        const detailDiscount = detail.discount_percent || 0;
        const detailRoomCalc = computeDayTaxes(newTariff, detailDiscount, newTax);

        const detailExtras = computeExtraChargesForCategory(
          newModeCharges,
          taxMap,
          detail.ex_pax || 0,
          detail.child_paid_amount > 0 ? 1 : 0,
          detail.driver || 0,
          detailNights,
        );

        const perNightExPax = detailExtras.exPax.price > 0 ? detailExtras.exPax.price / detailNights : 0;
        const perNightDriver = detail.driver && detail.driver > 0 && detailExtras.driver.price > 0
          ? detailExtras.driver.price / detailNights
          : 0;
        const perNightChild = detailExtras.child.price > 0 ? detailExtras.child.price / detailNights : 0;

        return {
          detailId: detail.detail_id,
          convertedCategoryId: newCategoryId,
          convertedCategoryName: tempNewCategory,
          roomTariff: newTariff,
          cgstPercent: detailRoomCalc.cgstPercent,
          cgstAmount: detailRoomCalc.cgstAmount,
          sgstPercent: detailRoomCalc.sgstPercent,
          sgstAmount: detailRoomCalc.sgstAmount,
          igstPercent: detailRoomCalc.igstPercent,
          igstAmount: detailRoomCalc.igstAmount,
          cessPercent: detailRoomCalc.cessPercent,
          cessAmount: detailRoomCalc.cessAmount,
          tax: detailRoomCalc.taxAmount,
          discountAmount: detailRoomCalc.discountAmount,
          exPaxCharge: perNightExPax,
          driverCharge: perNightDriver,
          childPaidAmount: perNightChild,
        };
      });

      // ---- 4. Build futureCharges array ----
      const futureCharges = futureRecords.charges.map((charge) => {
        const chargeNights = 1;
        const chargeExtras = computeExtraChargesForCategory(
          newModeCharges,
          taxMap,
          charge.ex_pax_count || 0,
          charge.child_count || 0,
          charge.driver_count || 0,
          chargeNights,
        );
        const chargeRoomCalc = computeDayTaxes(newTariff, charge.pax_tax_percent || 0, newTax);

        return {
          chargesId: charge.guest_room_charges_id,
          guestId: selectedRoom.checkin.guest_id,
          roomId: selectedRoom.detail.room_id,
          detailCheckinDatetime: selectedRoom.detail.detail_checkin_datetime,
          detailCheckoutDatetime: selectedRoom.detail.detail_checkout_datetime,
          categoryId: newCategoryId,
          paxPrice: newTariff,
          paxTax: chargeRoomCalc.taxAmount,
          exPaxPrice: chargeExtras.exPax.price,
          exPaxTax: chargeExtras.exPax.tax,
          exPaxTaxPercent: chargeExtras.exPax.taxPercent,
          exPaxTotal: chargeExtras.exPax.total,
          childPrice: chargeExtras.child.price,
          childTax: chargeExtras.child.tax,
          childTaxPercent: chargeExtras.child.taxPercent,
          childTotal: chargeExtras.child.total,
          driverPrice: chargeExtras.driver.price,
          driverTax: chargeExtras.driver.tax,
          driverTaxPercent: chargeExtras.driver.taxPercent,
          driverTotal: chargeExtras.driver.total,
          totalAmount:
            chargeRoomCalc.totalAfterTax +
            chargeExtras.exPax.total +
            chargeExtras.child.total +
            chargeExtras.driver.total,
        };
      });

      // ---- 5. Compute folio total ----
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
      };
      const updatedRow = buildRoomDataRowFromDetail(updatedDetailForFolio, selectedRoom.checkin, {
        ex_pax_total: currentExtras.exPax.total,
        child_total: currentExtras.child.total,
        driver_total: currentExtras.driver.total,
      });
      const folioTotalAmount = parseFloat(updatedRow.totalAmount);

      // ---- 6. Build final payload ----
      const payload: ChangeRoomCategoryPayload = {
        checkinId: selectedRoom.checkin.checkin_id,
        convertedCategory: tempNewCategory,
        folioTotalAmount,
        currentDetail,
        currentCharges,
        futureDetails,
        futureCharges,
      };

      // ---- 7. SINGLE API CALL ----
      const response = await RoomService.changeRoomCategory(payload);

      if (response.success) {
        toast.success(`Category changed to ${tempNewCategory} with tax ${newTax.total}%`);
        onRefresh();
        onClose();
      } else {
        toast.error(response.message || 'Failed to change category');
      }
    } catch (error: any) {
      console.error('Category change failed:', error);
      toast.error(error.message || 'Could not update category');
    } finally {
      setLoading(false);
    }
  };

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
 const [guestName, setGuestName] = useState(
  selectedRoom.guest?.name || ''
)

const [companyName, setCompanyName] = useState(
  selectedRoom.detail?.company_name ||
  selectedRoom.company?.company_name ||
  selectedRoom.guest?.organisation ||
  ''
)
  const [primaryChecked, setPrimaryChecked] = useState(true)
  const [loadingUpdate, setLoadingUpdate] = useState(false)
  const [previewActive, setPreviewActive] = useState(false)
  const [showGuestModal, setShowGuestModal] = useState(false)
  const [savingGuest, setSavingGuest] = useState(false)
  const [editingGuest, setEditingGuest] = useState<any>(null)

 useEffect(() => {
  setGuestName(selectedRoom.guest?.name || '')

    setCompanyName(selectedRoom.detail?.company_name || '')

  console.log("selectedRoom =>", selectedRoom);

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
    
  const guestId = selectedRoom.guest?.guest_id ?? selectedRoom.checkin.guest_id
  if (!guestId) {
    toast.error('Guest data not available')
    return
  }

  try {
    const res = await GuestService.getFullGuest(guestId)
    if (!res?.success || !res.data) {
      toast.error(res?.message || 'Failed to load guest data')
      return
    }

    const { guest, documents: rawDocs = [], document_types: docTypes = [] } = res.data

    if (!guest || !guest.guest_id) {
      toast.error('Failed to load guest data')
      return
    }

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
      if (idToId.has(val)) return val
      return nameToId.get(val.toUpperCase()) ?? val
    }

    const documents = rawDocs.map((d: any) => ({
      document_id: d.document_id,
      document_type: resolveDocType(String(d.document_type ?? '')),
      document_number: d.document_no ?? '',
      front_side: d.front_side_url ?? d.front_side ?? '',
      back_side: d.back_side_url ?? d.back_side ?? '',
      front_side_url: d.front_side_url ?? null,
      back_side_url: d.back_side_url ?? null,
    }))

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
  } catch (err) {
    console.error('Failed to fetch guest:', err)
    toast.error('Could not load guest data')
  }
}

const handleGuestSave = async (guestData: any) => {
  setSavingGuest(true)
  try {
    const checkinId = selectedRoom?.checkin?.checkin_id
    if (!checkinId) {
      toast.error('Check-in not found')
      return
    }

    const guestPayload = {
      guest_id: editingGuest?.guest_id ?? undefined,
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
      ...(guestData.fragment_id ? { fragment_id: guestData.fragment_id } : {}),
      ...(guestData.country_id ? { country_id: guestData.country_id } : {}),
      ...(guestData.state_id ? { state_id: guestData.state_id } : {}),
      ...(guestData.city_id ? { city_id: guestData.city_id } : {}),
      ...(guestData.nationality_id ? { nationality_id: guestData.nationality_id } : {}),
      ...(guestData.company_id ? { company_id: guestData.company_id } : {}),
    }

    const documentsPayload = (guestData.documents ?? [])
      .filter((doc: any) => doc.document_type || doc.document_number)
      .map((doc: any) => ({
        document_id: doc.document_id,
        document_type: doc.document_type,
        document_number: doc.document_number,
        front_side: doc._temp_front instanceof File ? doc._temp_front : undefined,
        back_side: doc._temp_back instanceof File ? doc._temp_back : undefined,
      }))

      console.log("UpdateGuestInfo Payload:", {
  checkin_id: selectedRoom?.checkin?.checkin_id,
  guest_id: editingGuest?.guest_id,
  
  documents: guestData.documents,
  updated_by_id: user?.id,
});

    const response = await GuestService.updateGuestInfo({
      checkin_id: checkinId,
      guest_id: editingGuest?.guest_id ?? null,
      guest: guestPayload,
      documents: documentsPayload,
      updated_by_id: user?.id,
    })

    if (!response?.success) {
      toast.error(response?.message || 'Failed to save guest')
      return
    }

    toast.success(editingGuest?.guest_id ? 'Guest updated successfully' : 'Guest created successfully')

    // Update local state with the new guest name
    setGuestName(guestData.name ?? guestName)

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
    toast.error('Guest name cannot be empty');
    return;
  }

  setLoadingUpdate(true);
  try {
    const checkinId = selectedRoom.checkin.checkin_id;
    const existingGuestId = selectedRoom.checkin.guest_id;

    // Build minimal guest payload with only name/company
    const guestPayload = {
      name: guestName.trim(),
      organisation: companyName.trim(),
      // Keep other fields as empty/default; the procedure will preserve existing data
      mobile: selectedRoom.checkin.mobile || '',
    };

    const response = await GuestService.updateGuestInfo({
      checkin_id: checkinId,
      guest_id: existingGuestId || null,
      guest: guestPayload,
      documents: [], // No documents for quick update
      updated_by_id: user?.id,
    });

    if (response.success) {
      toast.success('Guest information updated');
      onRefresh(); // Parent re‑fetches data → table updates
    } else {
      toast.error(response.message || 'Update failed');
    }
  } catch (error: any) {
    console.error('Failed to update guest info:', error);
    toast.error(error?.response?.data?.message || error?.message || 'Could not update guest information');
  } finally {
    setLoadingUpdate(false);
  }
};

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
// ================== Transfer Room Component (UPDATED - Single API) ==================
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

  // ================================================================
  // UPDATED: Single API call for room transfer
  // ================================================================
  const handleUpdate = async () => {
    if (!targetRoom) {
      toast.error('Please select a target room')
      return
    }

    if (!hotelId) {
      toast.error('Hotel ID not found')
      return
    }

    setLoadingUpdate(true)

    try {
      // Import the service
     

      const response = await RoomTransferService.transferRoom({
        hotelid: hotelId,
        checkin_id: selectedRoom.checkin.checkin_id,
        old_room_no: selectedRoom.roomNo,
        old_room_id: selectedRoom.detail.room_id,
        new_room_no: targetRoom.room_no,
        new_room_id: targetRoom.room_id,
        updated_by_id: user?.id,
      })

      if (!response.success) {
        throw new Error(response.message || 'Transfer failed')
      }

      toast.success(response.message)

      setTargetRoomNo('')
      setShowTestPreview(false)
      
      // Refresh the room list and selected room data
      await onRefresh()
      onClose()
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
      <Form.Label
        className="mb-0 fw-bold"
        style={{
          minWidth: '150px',
          fontSize: '16px'
        }}
      >
        Current Room No
      </Form.Label>

      <Form.Control
  type="text"
  value={selectedRoom.roomNo}
  readOnly
  className="bg-light"
  style={{
    width: '150px',
    fontSize: '16px',
    height: '38px'
    
  }}
/>
    </div>
  </Col>

  <Col md={4}>
    <div className="d-flex align-items-center gap-2 pt-2">
      <Form.Label
        className="mb-0 fw-bold"
        style={{
          minWidth: '160px',
          fontSize: '16px'
        }}
      >
        Transfer Room No
      </Form.Label>

      <Form.Select
  value={targetRoomNo}
  onChange={(e) => {
    setTargetRoomNo(e.target.value)
    setShowTestPreview(false)
  }}
  disabled={loadingUpdate}
  style={{
    width: '220px',
    fontSize: '16px',
    height: '38px'
  }}
>
        <option value="">Select a vacant room</option>

        {vacantRooms.map((room) => (
          <option key={room.room_id} value={room.room_no}>
            {room.room_no}
          </option>
        ))}
      </Form.Select>
    </div>

    {vacantRooms.length === 0 && (
      <div
        className="text-danger mt-1"
        style={{ fontSize: '14px' }}
      >
        No vacant rooms available
      </div>
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









/// ================== Apply Discount Component ==================
// Types
interface ApplyDiscountProps {
  selectedRoom: OccupiedRoom
  allRoomsDetails: Detail[]
  onClose: () => void
  onRefresh: () => void
}

interface AffectedDay {
  detail_id?: number
  room_number?: string
  checkin_datetime?: string
  checkout_datetime?: string
  no_of_days?: number
  room_tariff?: number
  discount_percent?: number
  discount_amount?: number
  total_amount?: number
  debit_amount?: number
  credit_amount?: number
  base_amount?: number
  per_day_discount?: number
  isCurrentDay?: boolean
  
  // Tax fields
  tax_percent?: number
  taxAmount?: string
  cgst_percent?: number
  sgst_percent?: number
  igst_percent?: number
  cess_percent?: number
  cgst_amount?: number
  sgst_amount?: number
  igst_amount?: number
  cess_amount?: number
  service_charge?: number
  service_charge_amount?: number
  
  // Extra charges
  ex_pax_price?: number
  ex_pax_tax_percent?: number
  ex_pax_tax?: number
  ex_pax_total?: number
  child_price?: number
  child_tax_percent?: number
  child_tax?: number
  child_total?: number
  driver_price?: number
  driver_tax_percent?: number
  driver_tax?: number
  driver_total?: number
  
  // Room charges fields
  pax_count?: number
  pax_price?: number
  pax_tax?: number
  ex_pax_count?: number
  child_count?: number
  driver_count?: number
  
  // Guest info
  guest_name?: string
  guest_id?: number
  room_category_name?: string
  converted_category_name?: string
  adults?: number
  pax?: number
  ex_pax?: number
  child_paid_amount?: number
  child_unpaid?: number
  driver?: number
  room_id?: number
}

const ApplyDiscountComponent = ({
  selectedRoom,
  allRoomsDetails,
  onClose,
  onRefresh,
}: ApplyDiscountProps) => {
  // ========================================
  // STATE
  // ========================================
  const originalDiscount = selectedRoom.detail.discount_percent || 0
  const [tempDiscountPercent, setTempDiscountPercent] = useState(originalDiscount)
  const [previewActive, setPreviewActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false)
  const [backdatedApply, setBackdatedApply] = useState(false)
  const [, setDiscountDetails] = useState<any[]>([])
  const [affectedDays, setAffectedDays] = useState<AffectedDay[]>([])
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0)

  // ========================================
  // EFFECTS
  // ========================================
  useEffect(() => {
    setTempDiscountPercent(originalDiscount)
    setPreviewActive(false)
    setBackdatedApply(false)
    setDiscountDetails([])
    setAffectedDays([])
    setSelectedDayIndex(0)
  }, [originalDiscount])

  useEffect(() => {
    fetchAffectedDays()
  }, [selectedRoom.detail.room_id, selectedRoom.checkin.checkin_id, selectedRoom.checkin.hotelid])

  // ========================================
  // ✅ HELPER: Safe number conversion
  // ========================================
  const safeNumber = (value: any, defaultValue: number = 0): number => {
    if (value === null || value === undefined) return defaultValue
    const num = Number(value)
    return isNaN(num) ? defaultValue : num
  }

  // ========================================
  // ✅ HELPER: Safe toFixed
  // ========================================
  const safeToFixed = (value: any, decimals: number = 2): string => {
    const num = safeNumber(value)
    return num.toFixed(decimals)
  }

  // ========================================
  // ✅ HELPER: Calculate totals safely
  // ========================================
  const calculateTotalDiscount = (items: AffectedDay[]): number => {
    return items.reduce((sum, item) => {
      return sum + safeNumber(item.discount_amount)
    }, 0)
  }

  const calculateTotalAmount = (items: AffectedDay[]): number => {
    return items.reduce((sum, item) => {
      return sum + safeNumber(item.total_amount || item.debit_amount || 0)
    }, 0)
  }

  // ========================================
  // ✅ FETCH ALL DAYS USING RoomService.getCheckinFullDetails
  // ========================================
const fetchAffectedDays = async () => {
  try {
    const response = await RoomService.getCheckinFullDetails(
      selectedRoom.checkin.hotelid,
      selectedRoom.checkin.checkin_id
    )

    if (response.success) {
      const allDetails = response.data?.details || []
      
      // ✅ FILTER: Sirf 'Room Charges' aur 'Room Extension' wali rows
     // Case-insensitive filter
const filteredDetails = allDetails.filter((d: any) => {
  const transType = (d.transaction_type || '').toLowerCase()
  return transType === 'room charges' || 
         transType === 'room extension'
})
      
      // ✅ Agar filter empty hai toh saari rows show karein (for testing)
      // const finalDetails = filteredDetails.length > 0 ? filteredDetails : allDetails
      
      // ✅ Ab current room ke details filter karo
      const roomDetails = filteredDetails.filter(
        (d: any) => d.room_id === selectedRoom.detail.room_id
      )
      
      console.log('Filtered room details:', roomDetails.length)
      
      // Agar roomDetails empty hai toh error show karein
      if (roomDetails.length === 0) {
        toast.error('No check-in or extension days found for this room')
        setAffectedDays([])
        return
      }
      
      const formattedDetails = roomDetails.map((d: any) => ({
        detail_id: d.detail_id,
        room_id: d.room_id,
        room_number: d.room_number || '',
        checkin_datetime: d.detail_checkin_datetime || d.checkin_datetime || null,
        checkout_datetime: d.detail_checkout_datetime || d.checkout_datetime || null,
        no_of_days: safeNumber(d.no_of_days, 1),
        room_tariff: safeNumber(d.room_tariff),
        discount_percent: safeNumber(d.discount_percent),
        discount_amount: safeNumber(d.discount_amount),
        total_amount: safeNumber(d.total_amount || d.debit_amount || 0),
        debit_amount: safeNumber(d.debit_amount),
        credit_amount: safeNumber(d.credit_amount),
        base_amount: safeNumber(d.base_amount) || safeNumber(d.room_tariff) * safeNumber(d.no_of_days),
        per_day_discount: safeNumber(d.per_day_discount),
        
        // Guest info
        guest_name: d.guest_name || d.name || '',
        guest_id: d.guest_id,
        room_category_name: d.room_category_name || '',
        converted_category_name: d.converted_category_name || '',
        adults: safeNumber(d.adults),
        pax: safeNumber(d.pax),
        ex_pax: safeNumber(d.ex_pax),
        child_paid_amount: safeNumber(d.child_paid_amount),
        child_unpaid: safeNumber(d.child_unpaid),
        driver: safeNumber(d.driver),
        
        // Tax fields
        tax_percent: safeNumber(d.tax_percent || d.tax),
        taxAmount: safeToFixed(
          safeNumber(d.cgst_amount || 0) + 
          safeNumber(d.sgst_amount || 0) + 
          safeNumber(d.igst_amount || 0) + 
          safeNumber(d.cess_amount || 0) + 
          safeNumber(d.service_charge_amount || 0)
        ),
        cgst_percent: safeNumber(d.cgst_percent),
        sgst_percent: safeNumber(d.sgst_percent),
        igst_percent: safeNumber(d.igst_percent),
        cess_percent: safeNumber(d.cess_percent),
        cgst_amount: safeNumber(d.cgst_amount),
        sgst_amount: safeNumber(d.sgst_amount),
        igst_amount: safeNumber(d.igst_amount),
        cess_amount: safeNumber(d.cess_amount),
        service_charge: safeNumber(d.service_charge),
        service_charge_amount: safeNumber(d.service_charge_amount),
        
        // Room charges
        ex_pax_price: safeNumber(d.ex_pax_price),
        ex_pax_tax_percent: safeNumber(d.ex_pax_tax_percent),
        ex_pax_tax: safeNumber(d.ex_pax_tax),
        ex_pax_total: safeNumber(d.ex_pax_total),
        child_price: safeNumber(d.child_price),
        child_tax_percent: safeNumber(d.child_tax_percent),
        child_tax: safeNumber(d.child_tax),
        child_total: safeNumber(d.child_total),
        driver_price: safeNumber(d.driver_price),
        driver_tax_percent: safeNumber(d.driver_tax_percent),
        driver_tax: safeNumber(d.driver_tax),
        driver_total: safeNumber(d.driver_total),
        
        // Additional charges fields
        pax_count: safeNumber(d.pax_count),
        pax_price: safeNumber(d.pax_price),
        pax_tax: safeNumber(d.pax_tax),
        ex_pax_count: safeNumber(d.ex_pax_count),
        child_count: safeNumber(d.child_count),
        driver_count: safeNumber(d.driver_count),
        
        // Store original transaction type for display
        transaction_type: d.transaction_type,
        description: d.description || d.charge_description || '',
        
        isCurrentDay: false
      }))
      
      setAffectedDays(formattedDetails)
      
      const currentIndex = findCurrentDayIndex(formattedDetails)
      setSelectedDayIndex(currentIndex)
      
      const discountEntries = formattedDetails.filter((d: any) => d.discount_percent > 0)
      setDiscountDetails(discountEntries)
    } else {
      toast.error(response.message || 'Failed to fetch room details')
    }
  } catch (error) {
    console.error('Failed to fetch affected days:', error)
    toast.error('Failed to load room details')
  }
}

  // ========================================
  // ✅ FIND CURRENT DAY INDEX
  // ========================================
  const findCurrentDayIndex = (days: AffectedDay[] = affectedDays): number => {
    if (days.length === 0) return 0
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (let i = 0; i < days.length; i++) {
      const day = days[i]
      if (day.checkin_datetime) {
        const checkinDate = new Date(day.checkin_datetime)
        checkinDate.setHours(0, 0, 0, 0)
        if (checkinDate.getTime() === today.getTime()) {
          return i
        }
      }
    }
    
    return 0
  }

  // ========================================
  // ✅ CHECK IF DAY IS CURRENT
  // ========================================
  const isCurrentDay = (checkinDatetime?: string): boolean => {
    if (!checkinDatetime) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const checkinDate = new Date(checkinDatetime)
    checkinDate.setHours(0, 0, 0, 0)
    return checkinDate.getTime() === today.getTime()
  }

  // ========================================
  // ✅ BUILD ROW FOR A SPECIFIC DAY
  // ========================================
  const buildRowForDay = (day: AffectedDay, index: number, isPreview: boolean = false) => {
    const detail = selectedRoom.detail
    
    const nights = safeNumber(day.no_of_days) || safeNumber(detail.no_of_days) || 1
    const rate = safeNumber(day.room_tariff) || safeNumber(detail.room_tariff) || 0
    const discountPercent = isPreview ? safeNumber(tempDiscountPercent) : safeNumber(day.discount_percent || 0)
    const discountAmount = (rate * nights * discountPercent) / 100
    
    // Get tax from day data
    const taxPercent = safeNumber(day.tax_percent) || 0
    const taxAmount = safeNumber(day.taxAmount) || 0
    
    const currentDay = isCurrentDay(day.checkin_datetime)
    const totalAmount = isPreview 
      ? (rate * nights - discountAmount) + taxAmount
      : safeNumber(day.total_amount || day.debit_amount || 0)
    
    return {
      index: index + 1,
      date: day.checkin_datetime ? new Date(day.checkin_datetime).toLocaleDateString() : '-',
      guestName: day.guest_name || selectedRoom.checkin.guest_name || '-',
      guestId: day.guest_id || selectedRoom.checkin.guest_id || '-',
      roomNo: day.room_number || selectedRoom.roomNo || '-',
      type: day.room_category_name || detail.room_category_name || '-',
      convCat: day.converted_category_name || detail.converted_category_name || '-',
      aDate: day.checkin_datetime ? new Date(day.checkin_datetime).toLocaleDateString() : '-',
      aTime: day.checkin_datetime ? new Date(day.checkin_datetime).toLocaleTimeString().slice(0, 5) : '-',
      dDate: day.checkout_datetime ? new Date(day.checkout_datetime).toLocaleDateString() : '-',
      dTime: day.checkout_datetime ? new Date(day.checkout_datetime).toLocaleTimeString().slice(0, 5) : '-',
      adults: safeNumber(day.adults) || safeNumber(detail.adults),
      pax: safeNumber(day.pax) || safeNumber(detail.pax),
      exPax: safeNumber(day.ex_pax) || safeNumber(detail.ex_pax),
      exPaxPrice: safeToFixed(safeNumber(day.ex_pax_price) || 0),
      exPaxTaxPercent: safeNumber(day.ex_pax_tax_percent) || 0,
      exPaxTax: safeToFixed(safeNumber(day.ex_pax_tax) || 0),
      exPaxTotal: safeToFixed(safeNumber(day.ex_pax_total) || 0),
      childPaid: safeNumber(day.child_paid_amount) || safeNumber(selectedRoom.checkin.child_paid) || 0,
      childUnpaid: safeNumber(day.child_unpaid) || safeNumber(selectedRoom.checkin.child_unpaid) || 0,
      childPrice: safeToFixed(safeNumber(day.child_price) || 0),
      childTaxPercent: safeNumber(day.child_tax_percent) || 0,
      childTax: safeToFixed(safeNumber(day.child_tax) || 0),
      childTotal: safeToFixed(safeNumber(day.child_total) || 0),
      driver: safeNumber(day.driver) || safeNumber(detail.driver),
      driverPrice: safeToFixed(safeNumber(day.driver_price) || 0),
      driverTaxPercent: safeNumber(day.driver_tax_percent) || 0,
      driverTax: safeToFixed(safeNumber(day.driver_tax) || 0),
      driverTotal: safeToFixed(safeNumber(day.driver_total) || 0),
      nights: nights,
      rate: safeToFixed(rate, 2),
      discountPercent: discountPercent,
      discountAmt: safeToFixed(discountAmount, 2),
      taxPercent: taxPercent,
      taxAmount: safeToFixed(taxAmount, 2),
      totalAmount: safeToFixed(totalAmount, 2),
      isSelected: index === selectedDayIndex,
      isCurrentDay: currentDay,
      isPreview: isPreview && (backdatedApply ? true : index === selectedDayIndex),
      detail_id: day.detail_id,
      room_id: day.room_id
    }
  }

  // ========================================
  // HANDLERS
  // ========================================
  const handleTest = () => {
    setPreviewActive(true)
    
    if (backdatedApply) {
      toast.success('Preview updated - All days will be affected')
    } else {
      const currentIndex = findCurrentDayIndex()
      toast.success(`Preview updated - Day ${currentIndex + 1} (Current Day) only`)
    }
  }

  const handleUpdate = async () => {
    if (tempDiscountPercent < 0 || tempDiscountPercent > 100) {
      toast.error('Discount must be between 0 and 100')
      return
    }

    setLoading(true)
    
    try {
      let targetDetailId;
      
      if (backdatedApply) {
        const firstDay = affectedDays[0]
        targetDetailId = firstDay?.detail_id || selectedRoom.detail.detail_id
      } else {
        const currentIndex = findCurrentDayIndex()
        const currentDay = affectedDays[currentIndex]
        targetDetailId = currentDay?.detail_id || selectedRoom.detail.detail_id
      }

      const response = await DiscountService.apply({
        detail_id: targetDetailId,
        checkin_id: selectedRoom.checkin.checkin_id,
        hotelid: selectedRoom.checkin.hotelid,
        discount_percent: tempDiscountPercent,
        backdated_apply: backdatedApply,
        user_id: selectedRoom.checkin.created_by_id || 1
      })

      if (!response.success) {
        toast.error(response.message || 'Failed to apply discount')
        setLoading(false)
        return
      }

      const dayLabel = backdatedApply ? 'All days' : `Day ${findCurrentDayIndex() + 1} (Current)`
      toast.success(`Discount ${tempDiscountPercent}% applied to ${dayLabel}`)

      await fetchAffectedDays()
      setPreviewActive(false)
      setShowConfirmationDialog(true)
      onRefresh()

    } catch (error: any) {
      console.error('Failed to apply discount:', error)
      toast.error(error.message || 'Could not apply discount')
    } finally {
      setLoading(false)
    }
  }

  // ========================================
  // RENDER HELPERS
  // ========================================
  const totalDiscount = calculateTotalDiscount(affectedDays)
  const totalAmount = calculateTotalAmount(affectedDays)
  const currentDayIndex = findCurrentDayIndex()

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

  // ========================================
  // RENDER
  // ========================================
  return (
    <ActionBox title="Apply Discount" onClose={onClose}>
      {/* Controls */}
      <div className="border p-2 mb-2">
        <div className="d-flex align-items-center gap-4 flex-wrap">
          <div className="d-flex align-items-center">
            <Form.Label className="mb-0 me-2 fw-bold" style={{ minWidth: "130px" }}>
              Current Discount (%)
            </Form.Label>
            <Form.Control
              type="text"
              size="sm"
              value={originalDiscount}
              readOnly
              className="bg-light"
              style={{ width: "100px" }}
            />
          </div>

          <div className="d-flex align-items-center">
            <Form.Label className="mb-0 me-2 fw-bold" style={{ minWidth: "120px" }}>
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
              style={{ width: "100px" }}
            />
          </div>

          {affectedDays.length > 1 && (
            <div className="d-flex align-items-center">
              <Form.Label className="mb-0 me-2 fw-bold" style={{ minWidth: "60px" }}>
                Day:
              </Form.Label>
              <Form.Select
                size="sm"
                value={selectedDayIndex}
                onChange={(e) => {
                  setSelectedDayIndex(Number(e.target.value))
                  setPreviewActive(false)
                }}
                style={{ width: "80px" }}
                disabled={backdatedApply}
              >
                {affectedDays.map((day, idx) => {
                  const current = isCurrentDay(day.checkin_datetime)
                  return (
                    <option key={idx} value={idx}>
                      {idx + 1}{current ? ' (Today)' : ''}
                    </option>
                  )
                })}
              </Form.Select>
            </div>
          )}

          <div className="d-flex align-items-center">
            <Form.Check
              id="backdatedApply"
              type="checkbox"
              checked={backdatedApply}
              onChange={(e) => {
                setBackdatedApply(e.target.checked)
                setPreviewActive(false)
                setDiscountDetails([])
                if (!e.target.checked) {
                  const currentIndex = findCurrentDayIndex()
                  setSelectedDayIndex(currentIndex)
                }
              }}
              className="mb-0"
            />
            <Form.Label
              htmlFor="backdatedApply"
              className="mb-0 ms-2 fw-bold"
              style={{ cursor: "pointer" }}
            >
              Backdated Apply
            </Form.Label>
          </div>

          {backdatedApply && (
            <span className="badge bg-info text-white">
              🔄 All days will be affected
            </span>
          )}
          {!backdatedApply && affectedDays.length > 0 && (
            <span className="badge bg-success text-white">
              📅 Current Day (Day {currentDayIndex + 1}) only
            </span>
          )}
        </div>

        {affectedDays.length > 0 && (
          <div className="mt-2 p-2 bg-light rounded border">
            <div className="d-flex align-items-center gap-3 flex-wrap">
              <span className="fw-bold text-primary">📋 Total Days:</span>
              <span>{affectedDays.length} day(s)</span>
              <span className="text-muted">|</span>
              <span className="text-success">
                Total Discount: ₹{safeToFixed(totalDiscount)}
              </span>
              <span className="text-muted">|</span>
              <span className="text-primary">
                Total Amount: ₹{safeToFixed(totalAmount)}
              </span>
              {!backdatedApply && (
                <>
                  <span className="text-muted">|</span>
                  <span className="text-warning">
                    ⚡ Applying to Current Day only
                  </span>
                </>
              )}
              {backdatedApply && (
                <>
                  <span className="text-muted">|</span>
                  <span className="text-success">
                    ⚡ Applying to ALL {affectedDays.length} days
                  </span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Table */}
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
            {affectedDays.length > 0 ? (
              affectedDays.map((day, idx) => {
                const currentDay = isCurrentDay(day.checkin_datetime)
                const isPreview = previewActive && (backdatedApply ? true : currentDay)
                const row = buildRowForDay(day, idx, isPreview)
                const isSelected = idx === selectedDayIndex
                
                const rowClassName = currentDay && !backdatedApply ? 'table-success' : 
                                    isSelected ? 'table-primary' : ''
                
                return (
                  <tr 
                    key={idx}
                    className={rowClassName}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (!previewActive && !backdatedApply) {
                        setSelectedDayIndex(idx)
                      }
                    }}
                  >
                    <td>{row.index}</td>
                    <td>{row.date}{currentDay && ' 📍'}</td>
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
                    <td
                      className={
                        isPreview && tempDiscountPercent !== originalDiscount
                          ? 'highlight-cell'
                          : currentDay && previewActive && !backdatedApply
                          ? 'highlight-cell'
                          : ''
                      }>
                      {isPreview ? tempDiscountPercent : row.discountPercent}%
                    </td>
                    <td>{row.discountAmt}</td>
                    <td>{row.taxPercent}%</td>
                    <td>{row.taxAmount}</td>
                    <td className={isPreview ? 'highlight-cell fw-bold' : ''}>
                      {row.totalAmount}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={allHeaders.length} className="text-muted">
                  No data available
                </td>
              </tr>
            )}
          </tbody>
          {affectedDays.length > 1 && (
            <tfoot className="table-secondary">
              <tr>
                <td colSpan={31} className="text-end fw-bold">Total:</td>
                <td className="fw-bold">-</td>
                <td className="fw-bold text-success">₹{safeToFixed(totalDiscount)}</td>
                <td className="fw-bold">-</td>
                <td className="fw-bold">-</td>
                <td className="fw-bold">₹{safeToFixed(totalAmount)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Footer Buttons */}
      <div className="action-footer">
        <Button size="sm" variant="info" onClick={handleTest} disabled={affectedDays.length === 0}>
          Test
        </Button>
        
        <Button size="sm" variant="success" onClick={handleUpdate} disabled={loading || affectedDays.length === 0}>
          {loading ? 'Applying...' : 'Apply'}
        </Button>
        
        <Button size="sm" variant="secondary" onClick={onClose}>
          Close
        </Button>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmationDialog && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999 }}
        >
          <div
            className="bg-white p-4 rounded shadow-lg"
            style={{ maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}
          >
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0 fw-bold">✅ Discount Applied Successfully</h6>
              <button className="btn-close" onClick={() => setShowConfirmationDialog(false)} />
            </div>

            <div className="mb-3">
              <div className="row">
                <div className="col-6">
                  <strong>Room:</strong> {selectedRoom.roomNo}
                </div>
                <div className="col-6">
                  <strong>Discount:</strong> {tempDiscountPercent}%
                </div>
              </div>
              <div className="row mt-1">
                <div className="col-6">
                  <strong>Mode:</strong> {backdatedApply ? '🔄 Backdated (All Days)' : `📅 Current Day`}
                </div>
                <div className="col-6">
                  <strong>Total Days:</strong> {affectedDays.length}
                </div>
              </div>
              <div className="row mt-1">
                <div className="col-12">
                  <strong>Total Discount:</strong> ₹{safeToFixed(totalDiscount)}
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-top">
              <Button
                size="sm"
                variant="success"
                className="me-2"
                onClick={() => {
                  setShowConfirmationDialog(false)
                  onRefresh()
                }}
              >
                OK
              </Button>
              <Button size="sm" variant="outline-secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </ActionBox>
  )
}

export default Amendments