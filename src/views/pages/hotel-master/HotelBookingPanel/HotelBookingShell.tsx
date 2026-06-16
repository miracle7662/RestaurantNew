import { ReactNode } from 'react'
import { Button } from 'react-bootstrap'

interface HotelBookingShellProps {
  children: ReactNode
  // Navigation / Actions
  onCheckInClick?: () => void
  onCheckOutClick?: () => void
  onReservationClick?: () => void
  onArrivalsClick?: () => void
  onSettlementClick?: () => void
  onAtGlanceClick?: () => void
  onSettingsClick?: () => void
  onBackClick?: () => void
  onReportClick?: () => void
  onCashInClick?: () => void
  onCashOutClick?: () => void
  onMisReportClick?: () => void
  onReservationSummaryClick?: () => void
  onSummaryClick?: () => void
  
  // Toggle / State
  showReservSection?: boolean
  showCheckoutAlertTable?: boolean
  activeHousekeepingTab?: boolean
  
  // Stats
  stats?: {
    total: number
    available: number
    occupied: number
    cleaning: number
    reserved: number
    maintenance: number
    reservation: number
  }
  todayReservationCount?: number
  
  // View mode
  viewMode?: 'floor' | 'category'
  onViewModeToggle?: () => void
  
  // Filters
  statusFilter?: 'all' | 'available' | 'occupied' | 'cleaning' | 'reserved' | 'maintenance' | 'reservation' | 'Bill'
  onStatusFilterClick?: (filter: 'all' | 'available' | 'occupied' | 'cleaning' | 'reserved' | 'maintenance' | 'reservation' | 'Bill') => void
  onHousekeepingToggle?: () => void
  
  // Selection
  selectedRoomIds?: number[]
  onBlockSelectedClick?: () => void
  onFreeRoomsClick?: () => void
  
  // Check-in
  checkInDisabled?: boolean
  
  // Optional: Custom footer buttons
  footerButtons?: ReactNode
}

export default function HotelBookingShell(props: HotelBookingShellProps) {
  const {
    children,
    // Navigation
    onCheckInClick,
    onCheckOutClick,
    onReservationClick,
    onArrivalsClick,
    onSettlementClick,
    onAtGlanceClick,
    onSettingsClick,
    onBackClick,
    onReportClick,
    onCashInClick,
    onCashOutClick,
    onMisReportClick,
    onReservationSummaryClick,
    onSummaryClick,
    // Toggle states
    showReservSection = false,
    showCheckoutAlertTable = false,
    activeHousekeepingTab = false,
    // Stats
    stats = { total: 0, available: 0, occupied: 0, cleaning: 0, reserved: 0, maintenance: 0, reservation: 0 },
    todayReservationCount = 0,
    // View mode
    viewMode = 'floor',
    onViewModeToggle,
    // Filters
    statusFilter = 'all',
    onStatusFilterClick,
    onHousekeepingToggle,
    // Selection
    selectedRoomIds = [],
    onBlockSelectedClick,
    onFreeRoomsClick,
    // Check-in
    checkInDisabled = false,
    // Footer
    footerButtons,
  } = props

  return (
    <div className="d-flex flex-column vh-100">
      {/* ===== HEADER ===== */}
      <div className="flex-shrink-0 p-2 pb-0 bg-white">
        <div className="border-bottom pb-2 mb-2">
          {/* Top row — status filters + actions */}
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
            {/* Left side - Status filters */}
            <div className="d-flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={statusFilter === 'all' ? 'dark' : 'outline-dark'}
                className="fw-semibold px-3 same-btn"
                onClick={() => onStatusFilterClick?.('all')}
              >
                <i className="fi fi-rr-apps me-1"></i>All [{stats.total}]
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'available' ? 'success' : 'outline-success'}
                className="fw-semibold px-3 same-btn"
                onClick={() => onStatusFilterClick?.('available')}
              >
                <i className="fi fi-rr-bed-empty me-1"></i>Vacant [{stats.available}]
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'occupied' ? 'primary' : 'outline-primary'}
                className="fw-semibold px-3 same-btn"
                onClick={() => onStatusFilterClick?.('occupied')}
              >
                <i className="fi fi-rr-user me-1"></i>Occupied [{stats.occupied}]
              </Button>
              <Button
                size="sm"
                variant={activeHousekeepingTab ? 'warning' : 'outline-warning'}
                className="fw-semibold px-3 same-btn"
                onClick={onHousekeepingToggle}
              >
                <i className="fi fi-rr-lock me-1"></i>Block [{stats.cleaning + stats.reserved + stats.maintenance}]
              </Button>
              <Button
                size="sm"
                variant={showReservSection ? 'secondary' : 'outline-secondary'}
                className="fw-semibold px-3 same-btn"
                onClick={onReservationClick}
              >
                <i className="fi fi-rr-calendar me-1"></i>Reservation [{stats.reservation}]
              </Button>
              <Button
                size="sm"
                variant="outline-info"
                className="fw-semibold px-3 same-btn text-nowrap"
                onClick={onArrivalsClick}
              >
                <i className="fi fi-rr-plane-arrival me-1"></i>Arrivals
              </Button>
              <Button
                size="sm"
                variant="outline-success"
                className="fw-semibold px-3 same-btn"
                onClick={onSettlementClick}
              >
                <i className="fi fi-rr-money-check me-1"></i>Settlement
              </Button>
              <Button
                size="sm"
                variant="outline-secondary"
                className="fw-semibold px-3 same-btn"
                onClick={onReservationClick}
              >
                Reservation Form
              </Button>
            </div>

            {/* Right side - Utility actions */}
            <div className="d-flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline-primary"
                className="fw-semibold text-nowrap px-3"
                onClick={onAtGlanceClick}
              >
                At Glance
              </Button>
              <Button
                size="sm"
                variant="outline-success"
                className="d-flex align-items-center justify-content-center same-btn"
                onClick={onSettingsClick}
                title="Settings"
              >
                <i className="fi fi-rr-settings"></i>
              </Button>
              <Button
                size="sm"
                variant="outline-danger"
                className="d-flex align-items-center justify-content-center same-btn"
                onClick={onBackClick}
                title="Close"
              >
                <i className="fi fi-rr-cross"></i>
              </Button>
            </div>
          </div>

          {/* Second row — view controls */}
          <div className="d-flex gap-2 flex-wrap align-items-center">
            <Button
              size="sm"
              variant={viewMode === 'floor' ? 'danger' : 'primary'}
              className="same-btn d-flex align-items-center justify-content-center"
              title={viewMode === 'floor' ? 'Switch to Category View' : 'Switch to Floor View'}
              onClick={onViewModeToggle}
            >
              <i className={viewMode === 'floor' ? 'fi fi-rr-building' : 'fi fi-rr-apps'}></i>
            </Button>
            <Button
              size="sm"
              variant="outline-success"
              className="fw-semibold px-3 same-btn"
              onClick={onCheckInClick}
              disabled={checkInDisabled}
            >
              <i className="fi fi-rr-check me-1"></i>Check In F9
            </Button>
            {selectedRoomIds.length > 0 && (
              <Button
                size="sm"
                variant="outline-warning"
                className="fw-semibold px-3 same-btn"
                onClick={onBlockSelectedClick}
                title="Apply Dirty / Block / Maintenance to all selected rooms"
              >
                <i className="fi fi-rr-lock me-1"></i>Block ({selectedRoomIds.length})
              </Button>
            )}
            <Button
              size="sm"
              variant="outline-danger"
              className="fw-semibold px-4"
              onClick={onFreeRoomsClick}
            >
              Free Rooms
            </Button>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT AREA ===== */}
      <div className="flex-grow-1 overflow-auto bg-white">{children}</div>

      {/* ===== FOOTER ===== */}
      <div className="flex-shrink-0 bg-white border-top p-2">
        <div className="d-flex flex-wrap gap-2 align-items-center">
          <Button size="sm" variant="danger" className="fw-semibold px-4" onClick={onSummaryClick}>
            Summary
          </Button>
          <Button size="sm" variant="secondary" className="fw-semibold px-4" onClick={onReportClick}>
            <i className="fi fi-rr-chart-line me-1"></i>Report
          </Button>
          <Button size="sm" variant="danger" className="fw-semibold px-4" onClick={onCashInClick}>
            Cash In
          </Button>
          <Button size="sm" variant="danger" className="fw-semibold px-4" onClick={onCashOutClick}>
            Cash Out
          </Button>
          <Button size="sm" variant="danger" className="fw-semibold px-4" onClick={onMisReportClick}>
            MIS Report
          </Button>
          <Button
            size="sm"
            variant="success"
            className="fw-semibold px-4"
            onClick={onCheckOutClick}
          >
            {showCheckoutAlertTable ? 'Back to Rooms' : 'Today Check Out'}
          </Button>
          <Button
            size="sm"
            variant="primary"
            className="fw-semibold px-4 position-relative"
            onClick={onReservationSummaryClick}
          >
            Reservation Summary
            {todayReservationCount > 0 && (
              <span
                className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                style={{ fontSize: '0.65rem', minWidth: '1.4rem' }}
              >
                {todayReservationCount}
                <span className="visually-hidden">today's reservations</span>
              </span>
            )}
          </Button>
          {footerButtons}
        </div>
      </div>
    </div>
  )
}