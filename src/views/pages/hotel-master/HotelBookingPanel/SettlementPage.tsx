import { useState, useEffect } from 'react'
import { Button } from 'react-bootstrap'
import { toast } from 'react-hot-toast'
import TitleHelmet from '@/components/Common/TitleHelmet'
import { useAuthContext } from '@/common/context/useAuthContext'


import CheckoutService, { CheckoutMaster } from '@/common/hotel/checkout'
import CheckoutBillModal from './CheckoutBillModal'
import SettlementModal from './SettelmentModel'
import OutletPaymentModeService from '@/common/api/outletpaymentmode'
import LdgSettlementService from '@/common/hotel/ldgsettlement'
// Import the common fetch function
import { fetchOccupiedRooms } from '@/utils/commonfunction'
import { OccupiedRoomItem } from '@/types/room'

// ─── Types (same as HotelBookingPanel) ─────────────────────────────────────





// ─── Helpers ───────────────────────────────────────────────────────────────

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

const formatAmount = (amt: number): string => {
  const n = Number(amt)
  if (!isFinite(n)) return 'Rs.0.00/-'
  const sign = n < 0 ? '-' : ''
  return `Rs.${sign}${Math.abs(n).toFixed(2)}/-`
}

const getMinutesLeft = (checkoutDatetime: string): number => {
  if (!checkoutDatetime) return 999
  const now = new Date()
  const checkoutTime = new Date(checkoutDatetime)
  const diffMs = checkoutTime.getTime() - now.getTime()
  return Math.floor(diffMs / (1000 * 60))
}

// ─── Main Component ─────────────────────────────────────────────────────────

const SettlementPage = () => {
  const { user } = useAuthContext()
  const hotelId = user?.hotelid

  // Data
  const [occupiedRooms, setOccupiedRooms] = useState<OccupiedRoomItem[]>([])
  const [loadingOccupied, setLoadingOccupied] = useState(false)
  const [errorOccupied, setErrorOccupied] = useState<string | null>(null)
  const [checkoutData, setCheckoutData] = useState<CheckoutMaster[]>([])
  const [loadingCheckout, setLoadingCheckout] = useState(false)
  const [checkoutPaymentMap, setCheckoutPaymentMap] = useState<Map<number, string>>(new Map())
  const [settledRoomNos, setSettledRoomNos] = useState<Set<string>>(new Set())
  const [outletPaymentModes, setOutletPaymentModes] = useState<any[]>([])

  // Bill print modal
  const [showBillModal, setShowBillModal] = useState(false)
  const [billData, setBillData] = useState<{
    combinedSummary: any
    displayRows: any[]
    grandTotal: number
    billNumber: string
    paymentMode: string
  } | null>(null)

  // Settlement payment modal
  const [showSettlementPayModal, setShowSettlementPayModal] = useState(false)
  const [settlementPayLoading, setSettlementPayLoading] = useState(false)
  const [settlementPayData, setSettlementPayData] = useState<{
    guestName: string
    guestid: number
    roomNo: string
    room_id: number
    totalPrice: number
    checkoutId: number
    checkinId?: number
    billNo?: string
    regNo?: string
    orderNo?: string
    txnNo?: string
    mobileNo?: string
  } | null>(null)

  // ─── Fetch hotel info ────────────────────────────────────────────────────
  useEffect(() => {
    if (!hotelId) return

    const fetchPaymentModes = async () => {
      try {
        const outletId = user?.outletid || hotelId
        const res = await OutletPaymentModeService.list({ outletid: outletId })
        if (res.success && res.data) {
          setOutletPaymentModes(res.data)
        }
      } catch {
        // Silently fail - fallback to empty array
      }
    }
    fetchPaymentModes()
  }, [hotelId, user])

  // ─── Initial data load ───────────────────────────────────────────────────
  useEffect(() => {
    if (!hotelId) return
    fetchOccupiedRoomsData()
    fetchCheckoutData()
  }, [hotelId])

  // ─── Fetch occupied rooms using common function ─────────────────────────
  const fetchOccupiedRoomsData = async () => {
    if (!hotelId) return
    
    await fetchOccupiedRooms(
      hotelId,
      getMinutesLeft,
      setOccupiedRooms,
      setLoadingOccupied,
      setErrorOccupied
    )
  }

  // ─── Fetch checkout records ──────────────────────────────────────────────
  const fetchCheckoutData = async () => {
    if (!hotelId) return
    setLoadingCheckout(true)
    try {
      const res = await CheckoutService.list({ hotelid: hotelId })
      const data: CheckoutMaster[] = res.data || []
      const payMap = new Map<number, string>()
      data.forEach((co) => {
        payMap.set(co.checkout_id, `${co.payment_mode || 'Cash'}|${co.ldg_bill_no || '-'}`)
      })
      data.sort((a, b) => {
        const numA = parseInt((a.ldg_bill_no || '').replace(/\D/g, '')) || 0
        const numB = parseInt((b.ldg_bill_no || '').replace(/\D/g, '')) || 0
        return numA - numB
      })
      setCheckoutData(data)
      setCheckoutPaymentMap(new Map(payMap))
      const roomNos = new Set(data.map((co) => co.room_no).filter(Boolean) as string[])
      if (roomNos.size > 0) setSettledRoomNos(roomNos)
    } catch (err) {
      console.error('Failed to fetch checkout data', err)
    } finally {
      setLoadingCheckout(false)
    }
  }

  // ─── Print bill handler ──────────────────────────────────────────────────
  const handlePrint = (co: CheckoutMaster) => {
    const paymentData = checkoutPaymentMap.get(co.checkout_id) || 'Cash|-'
    const payType = paymentData.split('|')[0] || 'Cash'
    const invoiceNo = paymentData.split('|')[1] || '-'
    const totalAmt = Number(co.total_amount) || 0

    const combinedSummary = {
      checkin_id: co.checkin_id || 0,
      guest_id: co.guest_id || 0,
      guest_name: co.guest_name || '-',
      guest_mobile: co.mobile,
      guest_email: co.email,
      guest_address: co.address,
      guest_id_proof: co.id_proof,
      room_numbers: [co.room_no || '-'],
      room_categories: [],
      converted_categories: [],
      room_numbers_str: co.room_no || '-',
      room_categories_str: '',
      converted_categories_str: '',
      total_room_tariff: totalAmt,
      total_ex_pax_charge: 0,
      total_child_paid_amount: 0,
      total_driver_charge: 0,
      total_tax_amount: 0,
      total_amount: totalAmt,
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
      payment_methods: [payType],
      payment_method: payType,
      charges_ids: [],
      selected: true,
      original_checkin_datetime: co.checkin_datetime || co.checkout_datetime || new Date().toISOString(),
      final_checkout_datetime: co.checkout_datetime || co.checkout_date || new Date().toISOString(),
      reg_no: invoiceNo,
      booking_ref: invoiceNo,
      plan_name: '',
      checked_out_rooms: [co.room_no || '-'],
    }

    const today = new Date().toISOString().split('T')[0]
    const displayRow = {
      id: `co-${co.checkout_id}`,
      guest_room_charges_id: co.checkout_id,
      checkin_id: co.checkin_id || 0,
      guest_id: 0, room_id: 0,
      room_number: co.room_no || '-',
      room_category_name: '', converted_category_name: '',
      bill_date: today,
      bill_date_formatted: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '/'),
      checkin_datetime: co.checkin_datetime || co.checkout_datetime || '',
      checkout_datetime: co.checkout_datetime || co.checkout_date || '',
      no_of_days: 1, day_number: 1, original_day_number: 1,
      room_tariff_per_day: totalAmt, total_room_tariff: totalAmt,
      ex_pax_count: 0, ex_pax_price: 0, ex_pax_tax: 0, ex_pax_tax_percent: 0, ex_pax_total: 0,
      child_count: 0, child_unpaid: 0, child_price: 0, child_tax: 0, child_tax_percent: 0, child_total: 0,
      driver_count: 0, driver_price: 0, driver_tax: 0, driver_tax_percent: 0, driver_total: 0,
      cgst_amount: 0, sgst_amount: 0, igst_amount: 0, cess_amount: 0, service_charge_amount: 0,
      adults: 0, pax: 0, ex_pax: 0, child_paid: 0, driver: 0,
      discount_percent: 0, discount_amount: 0, tax_percent: 0, tax_amount: 0,
      total_amount: totalAmt, is_extension: false, isPostCharge: false, selected: true,
      cumulative_total: totalAmt,
      guest_name: co.guest_name || '-',
      payment_method: payType,
      created_at: today,
      has_checkout_datetime: true,
      checkout_time_formatted: co.checkout_datetime || '',
    }

    setBillData({ combinedSummary, displayRows: [displayRow], grandTotal: totalAmt, billNumber: invoiceNo, paymentMode: payType })
    setShowBillModal(true)
  }

  // ─── Settlement pay handler ──────────────────────────────────────────────
  const handleSettle = (co: CheckoutMaster) => {
    const paymentData = checkoutPaymentMap.get(co.checkout_id) || 'Cash|-'
    const payType = paymentData.split('|')[0] || 'Cash'
    setSettlementPayData({
      guestName: co.guest_name || '-',
      guestid: co.guest_id || 0,
      roomNo: co.room_no || '-',
      room_id: typeof co.room_id === 'string'
        ? JSON.parse(co.room_id)
        : co.room_id,
      totalPrice: Number(co.total_amount) || 0,
      checkoutId: co.checkout_id,
      checkinId: co.checkin_id,
      billNo: co.ldg_bill_no,
      regNo: co.reg_no,
    })
    setShowSettlementPayModal(true)
  }

  const hasMeaningfulTime = (dt: string | undefined | null): boolean => {
    if (!dt) return false
    const d = new Date(dt)
    return d.getHours() !== 0 || d.getMinutes() !== 0
  }

  const isLoading = loadingOccupied || loadingCheckout

  // ─── Settled items (still active in occupiedRooms) ───────────────────────
  const settledItems = occupiedRooms.filter((item) => settledRoomNos.has(item.room_no))

  return (
    <>
      <TitleHelmet title="Settlement" />

      {/* ─── Content ──────────────────────────────────────────────────────── */}
      <div className="flex-grow-1 overflow-auto p-3">
        {isLoading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: 300 }}>
            <div className="text-center">
              <div className="spinner-border text-success" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-muted mt-2 small">Loading settlement data...</p>
            </div>
          </div>
        ) : errorOccupied ? (
          <div className="text-center py-5">
            <div className="alert alert-danger">
              <i className="fi fi-rr-exclamation-triangle me-2"></i>
              {errorOccupied}
              <Button 
                variant="outline-danger" 
                size="sm" 
                className="ms-3"
                onClick={fetchOccupiedRoomsData}
              >
                Retry
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* ── Settled rooms pending status change ─────────────────── */}
            {settledItems.length > 0 && (
              <div className="mb-4">
                <div
                  className="d-flex align-items-center justify-content-between mb-2 p-2 rounded"
                  style={{ background: '#fde8e8', border: '1px solid #e6adad' }}
                >
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <span
                      className="fw-bold"
                      style={{ fontSize: '0.78rem', color: '#6e1a1a' }}
                    >
                      <i className="fi fi-rr-check-circle me-1"></i>
                      Settlement Pending — Room Status Change Required
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#555' }}>
                      ({settledItems.length} room{settledItems.length !== 1 ? 's' : ''} checked out — move to Dirty when ready)
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline-secondary"
                    style={{ fontSize: '0.7rem', padding: '2px 8px' }}
                    onClick={() => setSettledRoomNos(new Set())}
                  >
                    Clear
                  </Button>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: '6px',
                  }}
                >
                  {settledItems.map((item) => (
                    <div
                      key={`settled-${item.checkin_id}-${item.room_no}`}
                      style={{
                        border: '2px solid #5ba3c9',
                        borderRadius: 0,
                        overflow: 'hidden',
                        fontSize: '0.72rem',
                        cursor: 'default',
                      }}
                    >
                      <div
                        style={{
                          backgroundColor: '#5ba3c9',
                          color: '#fff',
                          padding: '3px 6px',
                          fontWeight: 600,
                        }}
                      >
                        {item.room_no} {item.guest_name}
                        <span
                          style={{
                            fontSize: '0.55rem',
                            background: '#fff',
                            color: '#1a4f6e',
                            borderRadius: 2,
                            padding: '1px 4px',
                            marginLeft: 4,
                            fontWeight: 700,
                          }}
                        >
                          SETTLEMENT
                        </span>
                      </div>
                      <div
                        style={{
                          backgroundColor: '#e6adad',
                          color: '#1a4f6e',
                          padding: '4px 6px',
                        }}
                      >
                        <div>IN : {formatDateTime(item.checkin_datetime)}</div>
                        <div>OUT : {formatDateTime(item.checkout_datetime)}</div>
                        <div
                          style={{ fontSize: '0.6rem', fontWeight: 600, color: '#0d4f6e', marginTop: 2 }}
                        >
                          ✅ Checked Out — Pending Room Status
                        </div>
                        <div
                          style={{
                            borderTop: '1px dotted #888',
                            paddingTop: 2,
                            marginTop: 2,
                            display: 'flex',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span style={{ color: '#1a4f6e', fontWeight: 600 }}>
                            {formatAmount(item.net_room_amount ?? item.total_charge)}
                          </span>
                          <span style={{ color: '#1a4f6e', fontWeight: 700 }}>
                            {formatAmount(item.total_all_rooms_net ?? item.total_charge)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Checkout records grid ────────────────────────────────── */}
            {checkoutData.length === 0 ? (
              <div className="text-center py-5">
                <i className="fi fi-rr-sign-out-alt text-muted fs-4 mb-3 d-block"></i>
                <p className="text-muted mb-0">No checkout records found.</p>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))',
                  gap: '8px',
                }}
              >
                {checkoutData.map((co) => {
                  const totalAmt = Number(co.total_amount) || 0
                  const matchedOcc = occupiedRooms.find((o) => o.room_no === co.room_no)
                  const bestCheckoutDt = matchedOcc?.checkout_datetime
                    ? matchedOcc.checkout_datetime
                    : hasMeaningfulTime(co.checkout_datetime)
                      ? co.checkout_datetime
                      : co.checkout_date || co.checkout_datetime || ''
                  const checkoutDateDisplay = bestCheckoutDt ? formatDateTime(bestCheckoutDt) : '-'
                  const paymentData = checkoutPaymentMap.get(co.checkout_id) || 'Cash|-'
                  const payType = paymentData.split('|')[0] || 'Cash'
                  const invoiceNo = paymentData.split('|')[1] || '-'
                  const isPartial = co.is_partial_checkout === 1
                  const headerBg = '#198754'

                  return (
                    <div
                      key={co.checkout_id}
                      style={{
                        borderRadius: 4,
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.09)',
                        border: `1.5px solid ${headerBg}30`,
                        background: '#fff',
                        transition: 'box-shadow 0.18s, transform 0.12s',
                        cursor: 'default',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(0,0,0,0.14)'
                        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.09)'
                        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                      }}
                    >
                      {/* Card Header */}
                      <div
                        style={{
                          background: headerBg,
                          padding: '4px 8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 4,
                        }}
                      >
                        <span
                          style={{
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            flex: 1,
                          }}
                        >
                          Bill: {invoiceNo}
                          {isPartial && (
                            <span style={{ fontSize: '0.58rem', marginLeft: 3, opacity: 0.85 }}>
                              (Partial)
                            </span>
                          )}
                        </span>
                        <span
                          style={{
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.72rem',
                            whiteSpace: 'nowrap',
                            flexShrink: 0,
                            borderLeft: '1px solid rgba(255,255,255,0.4)',
                            paddingLeft: 6,
                          }}
                        >
                          Rm: {co.room_no || '-'}
                        </span>
                      </div>

                      {/* Card Body */}
                      <div style={{ padding: '8px 10px 4px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {/* Guest */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span
                            style={{
                              width: 18, height: 18, borderRadius: '50%',
                              background: `${headerBg}18`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}
                          >
                            <i className="fi fi-rr-user" style={{ fontSize: '0.6rem', color: headerBg }}></i>
                          </span>
                          <div
                            style={{
                              fontWeight: 600, fontSize: '0.7rem', color: '#222',
                              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', minWidth: 0,
                            }}
                          >
                            {co.guest_name || '-'}
                          </div>
                        </div>

                        <div style={{ height: 1, background: '#f0f0f0' }} />

                        {/* Checkout date */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <span
                            style={{
                              width: 18, height: 18, borderRadius: '50%', background: '#f3f4f6',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                            }}
                          >
                            <i className="fi fi-rr-sign-out-alt" style={{ fontSize: '0.6rem', color: '#555' }}></i>
                          </span>
                          <div style={{ fontWeight: 500, fontSize: '0.65rem', color: '#333', minWidth: 0 }}>
                            {checkoutDateDisplay}
                          </div>
                        </div>

                        {/* Payment & amount */}
                        <div
                          style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                            borderTop: '1px solid #f0f0f0', paddingTop: 4,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                            <span
                              style={{
                                width: 18, height: 18, borderRadius: '50%', background: '#f3f4f6',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                              }}
                            >
                              <i className="fi fi-rr-credit-card" style={{ fontSize: '0.6rem', color: '#555' }}></i>
                            </span>
                            <div
                              style={{
                                fontWeight: 500, fontSize: '0.68rem', color: '#333',
                                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                              }}
                            >
                              {payType}
                            </div>
                          </div>
                          <span style={{ fontWeight: 700, fontSize: '0.72rem', color: '#198754', letterSpacing: 0.2, flexShrink: 0 }}>
                            {formatAmount(totalAmt)}
                          </span>
                        </div>

                        {/* Action buttons */}
                        <div
                          style={{
                            display: 'flex', gap: 4, marginTop: 2,
                            borderTop: '1px solid #f0f0f0', paddingTop: 4,
                          }}
                        >
                          <button
                            onClick={() => handlePrint(co)}
                            style={{
                              flex: 1, height: 26,
                              border: '1px solid #0d6efd', background: '#fff', color: '#0d6efd',
                              fontWeight: 600, fontSize: '0.65rem', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                              borderRadius: 3, transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#e7f0ff')}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#fff')}
                            title="Print invoice"
                          >
                            <i className="fi fi-rr-print" style={{ fontSize: '0.65rem' }}></i>
                            Print
                          </button>
                          <button
                            onClick={() => handleSettle(co)}
                            style={{
                              flex: 1, height: 26,
                              border: '1px solid #198754', background: '#fff', color: '#198754',
                              fontWeight: 600, fontSize: '0.65rem', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3,
                              borderRadius: 3, transition: 'background 0.15s',
                            }}
                            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#e6f4ed')}
                            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '#fff')}
                            title="Settlement"
                          >
                            <i className="fi fi-rr-money-check" style={{ fontSize: '0.65rem' }}></i>
                            Settle
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ─── Modals ─────────────────────────────────────────────────────────── */}

      {billData && (
        <CheckoutBillModal
          show={showBillModal}
          onHide={() => { setShowBillModal(false); setBillData(null) }}
          checkoutId={0}
          ldgBillNo={billData.billNumber}
          hotelId={hotelId}
          billNumber={billData.billNumber}
          paymentTransactionId={billData.billNumber}
          paymentDate={new Date().toISOString()}
          paymentBank={billData.paymentMode}
          
        />
      )}

      {settlementPayData && (
        <SettlementModal
          show={showSettlementPayModal}
          onHide={() => { setShowSettlementPayModal(false); setSettlementPayData(null) }}
          onSettle={async (settlements) => {
            if (!hotelId || !user?.id || !settlementPayData) return
            setSettlementPayLoading(true)
            try {
              for (const split of settlements) {
                const matchedMode = outletPaymentModes.find(
                  (m) => m.mode_name?.toLowerCase() === split.PaymentType?.toLowerCase(),
                )
                if (!matchedMode) continue
                const payload = {
                  userid: user.id,
                  PaymentTypeID: matchedMode.id,
                  PaymentType: split.PaymentType,
                  Amount: split.Amount,
                  TipAmount: split.TipAmount || 0,
                  HotelID: hotelId,
                  outletid: user.outletid || hotelId,
                  outletname: user.outlet_name || '',
                  guest_id: settlementPayData.guestid,
                  guest_name: settlementPayData.guestName,
                  total_amount: settlementPayData.totalPrice,
                  checkinid: settlementPayData.checkinId || 0,
                  checkout_id: settlementPayData.checkoutId,
                  room_name: settlementPayData.roomNo,
                  room_ids: Array.isArray(settlementPayData.room_id)
                    ? settlementPayData.room_id
                    : [settlementPayData.room_id],
                  bill_no: settlementPayData.billNo,
                  registration_no: settlementPayData.regNo,
                  OrderNo: settlementPayData.orderNo,
                  TxnNo: settlementPayData.txnNo,
                  Receive: split.Amount,
                  isSettled: 1,
                  created_by_id: user.id,
                  updated_by_id: user.id,
                  checkout_date: new Date().toISOString().slice(0, 19).replace('T', ' '),
                }
                await LdgSettlementService.create(payload)
              }
              setSettledRoomNos((prev) => {
                const updated = new Set(prev)
                updated.delete(settlementPayData.roomNo)
                return updated
              })
              toast.success(`Settlement recorded for Room ${settlementPayData.roomNo}`)
              setShowSettlementPayModal(false)
              setSettlementPayData(null)
              await fetchCheckoutData()
              await fetchOccupiedRoomsData()
            } catch (err) {
              console.error(err)
              toast.error('Settlement failed')
            } finally {
              setSettlementPayLoading(false)
            }
          }}
          grandTotal={settlementPayData.totalPrice}
          subtotal={settlementPayData.totalPrice}
          loading={settlementPayLoading}
          outletPaymentModes={outletPaymentModes}
          guestName={settlementPayData.guestName}
          roomNo={settlementPayData.roomNo}
          room_id={settlementPayData.room_id}
          totalPrice={settlementPayData.totalPrice}
          initialCustomerName={settlementPayData.guestName}
          initialMobile={settlementPayData.mobileNo}
          initialCustomerId={settlementPayData.guestid}
          initialSelectedModes={[]}
          initialIsMixed={false}
          initialTip={0}
          initialCashReceived={0}
        />
      )}
    </>
  )
}

export default SettlementPage