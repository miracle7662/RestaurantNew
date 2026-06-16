// RoomStatusModal.tsx - Updated with dynamic colors from hotel settings
import { useState, useEffect } from 'react'
import { Modal, Form } from 'react-bootstrap'
import { toast } from 'react-hot-toast'
import RoomService from '@/common/hotel/room'
import ReservationService from '@/common/hotel/reservation'
import GuestService from '@/common/hotel/guest'
import RoomStatusLogService from '@/common/hotel/roomStatusLog'
import { useAuthContext } from '@/common/context/useAuthContext'
import hotelSettingsApi, { HotelUiSettings } from '@/common/hotel/hotelSettings'

interface RoomStatusModalProps {
  show: boolean
  onHide: () => void
  room: {
    id: number
    number: string
    category: string
    floor: string
    status: 'available' | 'occupied' | 'cleaning' |  'Bill' | 'reserved' | 'maintenance' | 'reservation'
  } | null
  rooms?: {
    id: number
    number: string
    category: string
    floor: string
    status: 'available' | 'occupied' | 'cleaning' |  'Bill' | 'reserved' | 'maintenance' | 'reservation'
  }[]
  hotelId: number
  userId?: number
  onSuccess?: () => void
}

interface ReservationOption {
  reservation_id: number
  guest_name: string
  room_no: string
  arrival_date: string
  departure_date: string
  booking_ref: string
  guest_id: number
  phone1: string
  email: string
}

interface GuestOption {
  guest_id: number
  name: string
  mobile: string
  email: string
}

interface ReservationPayload {
  guest_id: number
  reservation_name: string
  phone1: string
  email: string
  room_no: string
  arrival_date: string
  departure_date: string
  nights: number
  status: string
  hotelid: number
  created_by_id?: number
}

interface ReservationUpdatePayload {
  room_no?: string
  status?: string
  updated_by_id?: number
}

// Define the exact type expected by the API
interface ApiRoomStatusLogPayload {
  room_id: number
  room_no: string
  previous_status: string
  new_status: string
  status_type: 'reservation' | 'dirty' | 'block' | 'maint'
  blocked_by?: string
  in_house_guest_name?: string
  reason?: string
  expected_hours?: number
  reservation_guest_id?: number
  reservation_datetime?: string
  hotelid: number
  created_by_id?: number
}

// Default colors (fallback if settings not loaded)
const DEFAULT_STATUS_BG = {
  dirty: '#FFF4CC',
  block: '#D9F1FF',
  maint: '#FFE0E0',
  reservation: '#D9F1FF',
}

const DEFAULT_STATUS_TEXT = {
  dirty: '#D4A017',
  block: '#0284C7',
  maint: '#DC2626',
  reservation: '#0284C7',
}

const DEFAULT_STATUS_BORDER = {
  dirty: '#FACC15',
  block: '#38BDF8',
  maint: '#F87171',
  reservation: '#38BDF8',
}

const RoomStatusModal = ({
  show,
  onHide,
  room,
  rooms,
  hotelId,
  userId,
  onSuccess,
}: RoomStatusModalProps) => {
  const { user } = useAuthContext()
  const isMultiRoom = !!(rooms && rooms.length > 0)
  const effectiveRooms = isMultiRoom ? rooms! : (room ? [room] : [])
  
  const [statusType, setStatusType] = useState<'dirty' | 'block' | 'maint' | 'reservation'>('dirty')
  const [roomNo, setRoomNo] = useState('')
  const [dateTime, setDateTime] = useState('')
  const [reservationId, setReservationId] = useState('')
  const [selectedGuestId, setSelectedGuestId] = useState<string>('')
  const [resvDateTime, setResvDateTime] = useState('')
  const [blockedBy, setBlockedBy] = useState('')
  const [reason, setReason] = useState('')
  const [expectedHours, setExpectedHours] = useState('1')
  const [inHouseGuestName, setInHouseGuestName] = useState('')
  const [reservations, setReservations] = useState<ReservationOption[]>([])
  const [guests, setGuests] = useState<GuestOption[]>([])
  const [loadingReservations, setLoadingReservations] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uiSettings, setUiSettings] = useState<HotelUiSettings | null>(null)

  // Fetch UI settings for dynamic colors
  useEffect(() => {
    if (show && hotelId) {
      const fetchSettings = async () => {
        try {
          const res = await hotelSettingsApi.get(hotelId)
          if (res.success && res.data) {
            setUiSettings(res.data)
          }
        } catch (err) {
          console.error('Failed to load UI settings', err)
        }
      }
      fetchSettings()
    }
  }, [show, hotelId])

  const getCurrentDateTime = () => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  useEffect(() => {
    if (show && effectiveRooms.length > 0) {
      setRoomNo(isMultiRoom ? effectiveRooms.map(r => r.number).join(', ') : effectiveRooms[0].number)
      setDateTime(getCurrentDateTime())
      setResvDateTime(getCurrentDateTime())
      setStatusType('dirty')
      setReservationId('')
      setSelectedGuestId('')
      setBlockedBy(user?.full_name || '')
      setReason('')
      setExpectedHours('1')
      setInHouseGuestName('')

      if (hotelId) {
        fetchReservations()
        fetchGuests()
      }
    }
  }, [show, room, rooms, hotelId, user])

  const fetchReservations = async () => {
    setLoadingReservations(true)
    try {
      const response = await ReservationService.list({ hotelid: hotelId })
      const reservationsData = response.data || []

      const today = new Date().toISOString().split('T')[0]
      const upcomingReservations = reservationsData
        .filter((res: any) => {
          const arrivalDate = res.arrival_date ? res.arrival_date.split('T')[0] : ''
          return arrivalDate >= today && res.status !== 'checked_in'
        })
        .map((res: any) => ({
          reservation_id: res.reservation_id,
          guest_name: res.reservation_name || res.guest_name,
          room_no: res.room_no || '',
          arrival_date: res.arrival_date,
          departure_date: res.departure_date,
          booking_ref: res.reservation_no,
          guest_id: res.guest_id,
          phone1: res.phone1,
          email: res.email,
        }))

      setReservations(upcomingReservations)
    } catch (error) {
      console.error('Failed to fetch reservations:', error)
    } finally {
      setLoadingReservations(false)
    }
  }

  const fetchGuests = async () => {
    try {
      const response = await GuestService.list({ hotelid: hotelId })
      const guestsData = response?.data || []
      setGuests(
        guestsData.map((g: any) => ({
          guest_id: g.guest_id || g.id,
          name: g.name,
          mobile: g.mobile,
          email: g.email,
        })),
      )
    } catch (error) {
      console.error('Failed to fetch guests:', error)
    }
  }

  const handleSave = async () => {
    if (effectiveRooms.length === 0) {
      toast.error('Room information missing')
      return
    }

    if (statusType === 'reservation' && !selectedGuestId && !reservationId) {
      toast.error('Please select a guest or existing reservation')
      return
    }

    setSaving(true)
    try {
      let newStatus: 'available' | 'occupied' | 'cleaning' |   'Bill' |'reserved' | 'maintenance' | 'reservation' = 'available'
      let successMessage = ''

      switch (statusType) {
        case 'dirty':
          newStatus = 'cleaning'
          successMessage = isMultiRoom
            ? `${effectiveRooms.length} rooms marked as Dirty for cleaning`
            : `Room ${effectiveRooms[0].number} marked as Dirty for cleaning`
          break
        case 'block':
          newStatus = 'reserved'
          successMessage = isMultiRoom
            ? `${effectiveRooms.length} rooms have been Blocked`
            : `Room ${effectiveRooms[0].number} has been Blocked`
          break
        case 'maint':
          newStatus = 'maintenance'
          successMessage = isMultiRoom
            ? `${effectiveRooms.length} rooms marked for Maintenance`
            : `Room ${effectiveRooms[0].number} marked for Maintenance`
          break
        case 'reservation':
          newStatus = 'reservation'
          successMessage = isMultiRoom
            ? `Reservation assigned to ${effectiveRooms.length} rooms`
            : `Reservation assigned to Room ${effectiveRooms[0].number}`
          break
      }

      for (const targetRoom of effectiveRooms) {
        const oldStatus = targetRoom.status
        const currentRoom = await RoomService.get(targetRoom.id)
        const roomData = currentRoom.data || currentRoom

        // Update room status
        await RoomService.update(targetRoom.id, {
          ...roomData,
          room_status: newStatus,
          updated_by_id: userId,
        })

        let reservationGuestId: number | undefined = undefined
        let reservationDateTime: string | undefined = undefined

        // Handle reservation logic
        if (statusType === 'reservation') {
          if (reservationId) {
            // Update existing reservation
            const updatePayload: ReservationUpdatePayload = {
              room_no: targetRoom.number,
              status: 'assigned',
              updated_by_id: userId,
            }
            await ReservationService.update(Number(reservationId), updatePayload)
            const selectedReservation = reservations.find(
              (r) => r.reservation_id === Number(reservationId),
            )
            reservationGuestId = selectedReservation?.guest_id || undefined
            reservationDateTime = resvDateTime || new Date().toISOString()
          } else if (selectedGuestId) {
            // Create new reservation
            const selectedGuest = guests.find((g) => g.guest_id === Number(selectedGuestId))
            const today = new Date().toISOString().split('T')[0]
            const departureDate = new Date(Date.now() + 86400000).toISOString().split('T')[0]

            const reservationPayload: ReservationPayload = {
              guest_id: Number(selectedGuestId),
              reservation_name: selectedGuest?.name || '',
              phone1: selectedGuest?.mobile || '',
              email: selectedGuest?.email || '',
              room_no: targetRoom.number,
              arrival_date: resvDateTime ? resvDateTime.split('T')[0] : today,
              departure_date: departureDate,
              nights: 1,
              status: 'reserved',
              hotelid: hotelId,
              created_by_id: userId,
            }
            await ReservationService.create(reservationPayload)
            reservationGuestId = Number(selectedGuestId)
            reservationDateTime = resvDateTime || getCurrentDateTime()
            if (!isMultiRoom) {
              successMessage = `New reservation created for ${selectedGuest?.name} in Room ${targetRoom.number}`
            }
          }
        }

        // Prepare status log payload with the correct literal type
        const statusLogPayload: ApiRoomStatusLogPayload = {
          room_id: targetRoom.id,
          room_no: targetRoom.number,
          previous_status: oldStatus,
          new_status: newStatus,
          status_type: statusType, // This is now correctly typed as one of the literals
          blocked_by: statusType === 'block' || statusType === 'maint' ? blockedBy : undefined,
          in_house_guest_name: statusType === 'block' ? inHouseGuestName : undefined,
          reason: reason || undefined,
          expected_hours: statusType !== 'reservation' ? parseFloat(expectedHours) : 1,
          reservation_guest_id: reservationGuestId,
          reservation_datetime: reservationDateTime,
          hotelid: hotelId,
          created_by_id: userId,
        }
        
        // Use the correct API function - ensure the payload matches the expected type
        await RoomStatusLogService.create(statusLogPayload)
      }

      toast.success(successMessage)
      if (onSuccess) onSuccess()
      
      setTimeout(() => {
        onHide()
        setStatusType('dirty')
        setReservationId('')
        setSelectedGuestId('')
        setResvDateTime('')
        setBlockedBy('')
        setReason('')
        setExpectedHours('1')
        setInHouseGuestName('')
      }, 1500)
    } catch (error) {
      console.error('Failed to update room status:', error)
      toast.error('Failed to update room status')
    } finally {
      setSaving(false)
    }
  }

  const formatDateTimeDisplay = (dateTimeStr: string) => {
    if (!dateTimeStr) return ''
    const date = new Date(dateTimeStr)
    return date.toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Get dynamic colors from settings or use defaults
  const getStatusThemeColors = (type: 'dirty' | 'block' | 'maint' | 'reservation') => {
    if (uiSettings) {
      switch (type) {
        case 'dirty':
          return {
            bg: uiSettings.color_cleaning,
            text: uiSettings.text_color_cleaning,
            border: uiSettings.border_color_cleaning,
          }
        case 'block':
          return {
            bg: uiSettings.color_reserved,
            text: uiSettings.text_color_reserved,
            border: uiSettings.border_color_reserved,
          }
        case 'maint':
          return {
            bg: uiSettings.color_maintenance,
            text: uiSettings.text_color_maintenance,
            border: uiSettings.border_color_maintenance,
          }
        case 'reservation':
          return {
            bg: uiSettings.color_reservation,
            text: uiSettings.text_color_reservation,
            border: uiSettings.border_color_reservation,
          }
      }
    }
    return {
      bg: DEFAULT_STATUS_BG[type],
      text: DEFAULT_STATUS_TEXT[type],
      border: DEFAULT_STATUS_BORDER[type],
    }
  }

  // Theme configuration using dynamic colors
  const getTheme = () => {
    const colors = getStatusThemeColors(statusType)
    const darkerBg = (color: string) => {
      // Simple darkening function
      if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16)
        const g = parseInt(color.slice(3, 5), 16)
        const b = parseInt(color.slice(5, 7), 16)
        return `#${Math.max(0, r - 30).toString(16).padStart(2, '0')}${Math.max(0, g - 30).toString(16).padStart(2, '0')}${Math.max(0, b - 30).toString(16).padStart(2, '0')}`
      }
      return color
    }
    
    return {
      primary: colors.bg,
      primaryDark: darkerBg(colors.bg),
      primaryLight: `${colors.bg}20`,
      accent: colors.border,
      headerBg: `linear-gradient(135deg, ${colors.bg} 0%, ${darkerBg(colors.bg)} 100%)`,
      cardBorder: colors.border,
      summaryBg: `${colors.bg}10`,
      summaryBorder: colors.border,
      inputFocus: `${colors.border}30`,
      badgeBg: colors.bg,
      label: statusType === 'dirty' ? 'DIRTY ROOM' : statusType === 'block' ? 'BLOCK ROOM' : statusType === 'maint' ? 'MAINTENANCE' : 'NEW RESERVATION',
      textColor: colors.text,
    }
  }

  const theme = getTheme()
  const headerTextColor = theme.textColor

  const statusButtons: { key: typeof statusType; label: string }[] = [
    { key: 'dirty', label: 'Dirty' },
    { key: 'block', label: 'Block' },
    { key: 'maint', label: 'Maintenance' },
    { key: 'reservation', label: 'Reservation' },
  ]

  const reservationOptions = reservations.map((r) => ({
    label: `${r.booking_ref} - ${r.guest_name} (${r.room_no || 'No room'})`,
    value: r.reservation_id.toString(),
  }))

  return (
    <>
      <style>{`
        .room-status-modal .modal-dialog { max-width: 500px; }
        .room-status-modal .modal-content {
          border: none;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0,0,0,0.22);
        }
        .room-status-modal .modal-header .btn-close { filter: brightness(0) invert(1); opacity: 0.9; }
        .rsm-type-btn-group { display: flex; gap: 6px; flex-wrap: wrap; }
        .rsm-type-btn {
          font-size: 0.7rem;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: 6px;
          border: 1.5px solid;
          cursor: pointer;
          transition: all 0.18s;
          background: transparent;
        }
        .rsm-type-btn.dirty-off { border-color: ${getStatusThemeColors('dirty').border}; color: ${getStatusThemeColors('dirty').text}; background: transparent; }
        .rsm-type-btn.dirty-off:hover { background: ${getStatusThemeColors('dirty').bg}40; }
        .rsm-type-btn.dirty-on { background: ${getStatusThemeColors('dirty').bg}; border-color: ${getStatusThemeColors('dirty').border}; color: ${getStatusThemeColors('dirty').text}; box-shadow: 0 2px 6px ${getStatusThemeColors('dirty').border}60; }
        
        .rsm-type-btn.block-off { border-color: ${getStatusThemeColors('block').border}; color: ${getStatusThemeColors('block').text}; background: transparent; }
        .rsm-type-btn.block-off:hover { background: ${getStatusThemeColors('block').bg}40; }
        .rsm-type-btn.block-on { background: ${getStatusThemeColors('block').bg}; border-color: ${getStatusThemeColors('block').border}; color: ${getStatusThemeColors('block').text}; box-shadow: 0 2px 6px ${getStatusThemeColors('block').border}60; }
        
        .rsm-type-btn.maint-off { border-color: ${getStatusThemeColors('maint').border}; color: ${getStatusThemeColors('maint').text}; background: transparent; }
        .rsm-type-btn.maint-off:hover { background: ${getStatusThemeColors('maint').bg}40; }
        .rsm-type-btn.maint-on { background: ${getStatusThemeColors('maint').bg}; border-color: ${getStatusThemeColors('maint').border}; color: ${getStatusThemeColors('maint').text}; box-shadow: 0 2px 6px ${getStatusThemeColors('maint').border}60; }
        
        .rsm-type-btn.reservation-off { border-color: ${getStatusThemeColors('reservation').border}; color: ${getStatusThemeColors('reservation').text}; background: transparent; }
        .rsm-type-btn.reservation-off:hover { background: ${getStatusThemeColors('reservation').bg}40; }
        .rsm-type-btn.reservation-on { background: ${getStatusThemeColors('reservation').bg}; border-color: ${getStatusThemeColors('reservation').border}; color: ${getStatusThemeColors('reservation').text}; box-shadow: 0 2px 6px ${getStatusThemeColors('reservation').border}60; }

        .rsm-input { background: #f8fafd !important; border: 1px solid #d4dae8 !important; font-size: 0.78rem; border-radius: 6px; }
        .rsm-label { font-size: 0.7rem; font-weight: 600; color: #3a4460; margin-bottom: 2px; display: block; }
        .rsm-field-row { margin-bottom: 0; }
        .rsm-two-col-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem 0.75rem; margin-bottom: 0.6rem; }
        .rsm-full-col { grid-column: 1 / -1; }
        .rsm-summary-badge { display: inline-block; padding: 2px 10px; border-radius: 20px; font-size: 0.68rem; font-weight: 700; }
        .rsm-btn-cancel { background: #6c757d; color: #fff; font-size: 0.75rem; font-weight: 500; padding: 5px 16px; border-radius: 6px; border: none; }
        .rsm-small-input { width: 100px; }
      `}</style>

      <Modal show={show} onHide={onHide} centered backdrop="static" className="room-status-modal">
        <Modal.Header
          closeButton
          className="py-2"
          style={{ background: theme.headerBg, borderBottom: 'none', padding: '0.55rem 1rem' }}>
          <Modal.Title
            className="d-flex align-items-center gap-2"
            style={{ color: headerTextColor, fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.06em' }}>
            {theme.label}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body
          className="pb-2"
          style={{ background: theme.primaryLight, padding: '0.85rem 1rem 0.5rem' }}>
          <div
            className="p-3"
            style={{ border: `1.5px solid ${theme.cardBorder}`, borderRadius: 7, background: '#fff' }}>
            
            <div
              className="rsm-field-row rsm-full-col"
              style={{ marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <label className="rsm-label" style={{ marginBottom: 0, whiteSpace: 'nowrap' }}>
                Select Action
              </label>
              <div className="rsm-type-btn-group" style={{ display: 'flex', gap: '8px' }}>
                {statusButtons.map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    className={`rsm-type-btn ${key}-${statusType === key ? 'on' : 'off'}`}
                    onClick={() => setStatusType(key)}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rsm-two-col-grid">
              <div className="rsm-field-row">
                <label className="rsm-label">
                  {isMultiRoom ? `Room Numbers (${effectiveRooms.length} selected)` : 'Room Number'}
                </label>
                {isMultiRoom ? (
                  <div
                    className="rsm-input"
                    style={{
                      padding: '4px 8px',
                      background: '#e9ecef',
                      border: '1px solid #d4dae8',
                      borderRadius: 6,
                      fontSize: '0.78rem',
                      maxHeight: 60,
                      overflowY: 'auto',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 4,
                    }}>
                    {effectiveRooms.map((r) => (
                      <span
                        key={r.id}
                        style={{
                          display: 'inline-block',
                          padding: '1px 7px',
                          borderRadius: 4,
                          background: theme.primary,
                          color: headerTextColor,
                          fontSize: '0.72rem',
                          fontWeight: 600,
                        }}>
                        {r.number}
                      </span>
                    ))}
                  </div>
                ) : (
                  <Form.Control
                    type="text"
                    size="sm"
                    value={roomNo}
                    onChange={(e) => setRoomNo(e.target.value)}
                    readOnly
                    className="rsm-input"
                    style={{ background: '#e9ecef' }}
                  />
                )}
              </div>

              <div className="rsm-field-row">
                <label className="rsm-label">Date & Time</label>
                <Form.Control
                  type="datetime-local"
                  size="sm"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)}
                  className="rsm-input"
                  style={{ borderColor: theme.accent }}
                />
              </div>

              {statusType === 'block' && (
                <div className="rsm-field-row">
                  <label className="rsm-label">Blocked By</label>
                  <Form.Control
                    type="text"
                    size="sm"
                    value={blockedBy}
                    onChange={(e) => setBlockedBy(e.target.value)}
                    placeholder="Enter name"
                    className="rsm-input"
                  />
                </div>
              )}

              {statusType === 'maint' && (
                <div className="rsm-field-row">
                  <label className="rsm-label">Marked By</label>
                  <Form.Control
                    type="text"
                    size="sm"
                    value={blockedBy}
                    onChange={(e) => setBlockedBy(e.target.value)}
                    placeholder="Enter name"
                    className="rsm-input"
                  />
                </div>
              )}

              {statusType === 'reservation' && (
                <>
                  <div className="rsm-field-row">
                    <label className="rsm-label">Select Existing Reservation</label>
                    <Form.Select
                      size="sm"
                      value={reservationId}
                      onChange={(e) => {
                        setReservationId(e.target.value)
                        setSelectedGuestId('')
                      }}
                      className="rsm-input"
                      disabled={loadingReservations}>
                      <option value="">-- Select Reservation --</option>
                      {reservationOptions.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </Form.Select>
                  </div>
                  <div className="rsm-field-row">
                    <label className="rsm-label">Reservation Date/Time</label>
                    <Form.Control
                      type="datetime-local"
                      size="sm"
                      value={resvDateTime}
                      onChange={(e) => setResvDateTime(e.target.value)}
                      className="rsm-input"
                    />
                  </div>
                </>
              )}

              {statusType !== 'reservation' && (
                <div className="rsm-field-row">
                  <label className="rsm-label">Expected Duration (Hours)</label>
                  <div className="d-flex align-items-center gap-2">
                    <Form.Control
                      type="number"
                      size="sm"
                      value={expectedHours}
                      onChange={(e) => setExpectedHours(e.target.value)}
                      min="0.5"
                      step="0.5"
                      className="rsm-input rsm-small-input"
                    />
                    <span className="small" style={{ color: headerTextColor, fontWeight: 600 }}>
                      hrs
                    </span>
                  </div>
                </div>
              )}

              <div className="rsm-field-row rsm-full-col">
                <label className="rsm-label">
                  Reason / Notes
                  {statusType === 'dirty' && ' (Cleaning notes)'}
                  {statusType === 'block' && ' (Reason for blocking)'}
                  {statusType === 'maint' && ' (Maintenance issue)'}
                  {statusType === 'reservation' && ' (Reservation notes)'}
                </label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  size="sm"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    statusType === 'dirty'
                      ? 'Enter cleaning notes...'
                      : statusType === 'block'
                        ? 'Reason for blocking this room...'
                        : statusType === 'maint'
                          ? 'Describe maintenance issue...'
                          : 'Additional notes for reservation...'
                  }
                  className="rsm-input"
                />
              </div>
            </div>

            <div
              style={{
                background: theme.summaryBg,
                border: `1px solid ${theme.summaryBorder}`,
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: '0.71rem',
                marginTop: '0.5rem',
              }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  color: headerTextColor,
                  marginBottom: 6,
                  textTransform: 'uppercase',
                }}>
                Summary
              </div>

              <div className="d-flex justify-content-between align-items-center mb-1">
                <span style={{ color: '#555' }}>{isMultiRoom ? 'Rooms' : 'Room'}</span>
                <span className="fw-bold" style={{ color: headerTextColor }}>
                  {isMultiRoom
                    ? `${effectiveRooms.length} rooms selected`
                    : effectiveRooms[0]?.number || roomNo}
                </span>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-1">
                <span style={{ color: '#555' }}>Current Status</span>
                <span
                  className="rsm-summary-badge"
                  style={{ background: '#6c757d', color: '#fff' }}>
                  {isMultiRoom
                    ? 'Multiple'
                    : (effectiveRooms[0]?.status?.charAt(0).toUpperCase() +
                        (effectiveRooms[0]?.status?.slice(1) || '')) || 'Unknown'}
                </span>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-1">
                <span style={{ color: '#555' }}>New Status</span>
                <span
                  className="rsm-summary-badge"
                  style={{ background: theme.badgeBg, color: headerTextColor, border: `1px solid ${theme.accent}` }}>
                  {statusType === 'dirty'
                    ? 'Dirty (Cleaning)'
                    : statusType === 'block'
                      ? 'Blocked'
                      : statusType === 'maint'
                        ? 'Maintenance'
                        : 'Reserved'}
                </span>
              </div>

              {statusType === 'reservation' && selectedGuestId && (
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span style={{ color: '#555' }}>Guest</span>
                  <span style={{ color: '#333' }}>
                    {guests.find((g) => g.guest_id === Number(selectedGuestId))?.name || '-'}
                  </span>
                </div>
              )}

              {(statusType === 'block' || statusType === 'maint') && blockedBy && (
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span style={{ color: '#555' }}>
                    {statusType === 'block' ? 'Blocked By' : 'Marked By'}
                  </span>
                  <span style={{ color: '#333' }}>{blockedBy}</span>
                </div>
              )}

              <div className="d-flex justify-content-between align-items-center mb-1">
                <span style={{ color: '#555' }}>Date / Time</span>
                <span style={{ color: '#333' }}>{formatDateTimeDisplay(dateTime)}</span>
              </div>

              {reason && (
                <div className="d-flex justify-content-between align-items-start mt-1">
                  <span style={{ color: '#555', flexShrink: 0 }}>Notes</span>
                  <span
                    className="ms-2"
                    style={{ color: '#333', wordBreak: 'break-word', textAlign: 'right' }}>
                    {reason}
                  </span>
                </div>
              )}
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer
          className="py-2 gap-2"
          style={{ background: theme.primaryLight, borderTop: `1.5px solid ${theme.cardBorder}`, padding: '0.45rem 1rem' }}>
          <button
            type="button"
            className="btn rsm-btn-cancel"
            onClick={() => {
              onHide()
              setStatusType('dirty')
              setReservationId('')
              setSelectedGuestId('')
              setResvDateTime('')
              setBlockedBy('')
              setReason('')
              setExpectedHours('1')
              setInHouseGuestName('')
            }}>
            Cancel
          </button>
          <button
            type="button"
            className="btn"
            onClick={handleSave}
            disabled={saving}
            style={{
              background: theme.accent,
              borderColor: theme.accent,
              color: '#fff',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '5px 20px',
              borderRadius: 6,
              transition: 'all 0.2s',
            }}>
            {saving ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  style={{ width: 12, height: 12 }}></span>
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
          <button
            type="button"
            className="btn"
            onClick={onHide}
            style={{
              background: '#fff',
              border: `1.5px solid ${theme.accent}`,
              color: headerTextColor,
              fontSize: '0.75rem',
              fontWeight: 500,
              padding: '5px 16px',
              borderRadius: 6,
            }}>
            Exit
          </button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default RoomStatusModal