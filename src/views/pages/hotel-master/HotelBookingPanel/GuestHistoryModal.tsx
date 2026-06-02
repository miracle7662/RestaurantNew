// components/CheckIn/GuestHistoryModal.tsx
// FULL UPDATED CODE

import  { useEffect, useState } from 'react'
import { Modal, Spinner, Badge, Button } from 'react-bootstrap'
import { useAuthContext } from '@/common/context/useAuthContext'
import GuestHistoryService, {
  GuestHistoryCheckout,
} from '@/common/hotel/guestHistory'
import toast from 'react-hot-toast'

interface GuestHistoryModalProps {
  show: boolean
  onHide: () => void
  guestId: number | null
  guestName?: string
}

const formatDateTime = (iso: string): string => {
  if (!iso) return '-'

  const d = new Date(iso)

  const day = d.getDate().toString().padStart(2, '0')
  const month = d.toLocaleString('default', { month: 'short' })
  const year = d.getFullYear()

  const hh = d.getHours().toString().padStart(2, '0')
  const mm = d.getMinutes().toString().padStart(2, '0')

  return `${day}-${month}-${year} ${hh}:${mm}`
}

const formatDate = (iso: string): string => {
  if (!iso) return '-'

  const d = new Date(iso)

  const day = d.getDate().toString().padStart(2, '0')
  const month = d.toLocaleString('default', { month: 'short' })
  const year = d.getFullYear()

  return `${day}-${month}-${year}`
}

const formatAmt = (amt: number | null | undefined): string => {
  if (amt === null || amt === undefined) return '₹0.00'
  return `₹${Number(amt).toFixed(2)}`
}

const GuestHistoryModal = ({
  show,
  onHide,
  guestId,
  guestName,
}: GuestHistoryModalProps) => {

  const { user } = useAuthContext()

  const hotelId = user?.hotelid || user?.hotelid

  const [loading, setLoading] = useState(false)

  const [historyData, setHistoryData] = useState<GuestHistoryCheckout[]>([])

  useEffect(() => {

    if (show && guestId && hotelId) {
      fetchGuestHistory()
    }

  }, [show, guestId, hotelId])

  const fetchGuestHistory = async () => {

    if (!guestId || !hotelId) return

    setLoading(true)

    try {

      const response = await GuestHistoryService.getGuestHistory(
        guestId,
        hotelId
      )

      if (response.success && response.data) {

        setHistoryData(response.data)

      } else {

        setHistoryData([])

      }

    } catch (error) {

      console.error('Guest History Error:', error)

      toast.error('Failed to load guest history')

      setHistoryData([])

    } finally {

      setLoading(false)

    }
  }

  if (!guestId) return null

  return (

    <Modal
      show={show}
      onHide={onHide}
      centered
      size="xl"
    >

      <Modal.Header closeButton>

        <Modal.Title className="fs-4 fw-bold">

          Guest History

          {guestName && (
            <span className="text-primary ms-2">
              - {guestName}
            </span>
          )}

        </Modal.Title>

      </Modal.Header>

      <Modal.Body>

        {loading ? (

          <div className="text-center py-5">

            <Spinner animation="border" variant="primary" />

            <div className="mt-2 text-muted">
              Loading Guest History...
            </div>

          </div>

        ) : historyData.length === 0 ? (

          <div className="text-center py-5 text-muted">

            No Guest History Found

          </div>

        ) : (

          <div className="table-responsive">

            <table
              className="table table-bordered table-hover table-sm align-middle"
              style={{
                fontSize: '12px',
                whiteSpace: 'nowrap',
              }}
            >

              <thead className="table-light">

                <tr>

                  <th>Sr No</th>

                  <th>Guest Name</th>

                  <th>Room No</th>

                  <th>Arrival</th>

                  <th>Departure</th>

                  <th>Pax</th>

                  <th>Ex Pax</th>

                  <th>Child</th>

                  <th>Driver</th>

                  <th>Discount</th>

                  <th>Total Amount</th>

                  <th>Checkout Date</th>

                  <th>Status</th>

                </tr>

              </thead>

              <tbody>

                {historyData.map((item, index) => (

                  <tr key={item.checkout_id}>

                    {/* SR NO */}
                    <td className="fw-bold text-center">
                      {index + 1}
                    </td>

                    {/* GUEST NAME */}
                    <td>
                      {item.guest_name || '-'}
                    </td>

                    {/* ROOM NO */}
                    <td className="fw-bold">
                      {item.room_no || '-'}
                    </td>

                    {/* ARRIVAL */}
                    <td>
                      {formatDateTime(item.checkin_datetime)}
                    </td>

                    {/* DEPARTURE */}
                    <td>
                      {formatDateTime(item.checkout_datetime)}
                    </td>

                    {/* PAX */}
                    <td className="text-center">
                      {item.pax || 0}
                    </td>

                    {/* EX PAX */}
                    <td className="text-center">
                      {item.ex_pax || 0}
                    </td>

                    {/* CHILD COUNT */}
                    <td className="text-center">
                      {item.child || item.child_count || 0}
                    </td>

                    {/* DRIVER */}
                    <td className="text-center">
                      {item.driver || 0}
                    </td>

                    {/* DISCOUNT */}
                    <td className="text-danger fw-bold text-center">
                      ₹{Number(
                        item.discount_amount ||
                        item.discount ||
                        0
                      ).toFixed(2)}
                    </td>

                    {/* TOTAL AMOUNT */}
                    <td className="fw-bold text-success">
                      {formatAmt(item.total_amount)}
                    </td>

                    {/* CHECKOUT DATE */}
                    <td>
                      {formatDate(item.checkout_date)}
                    </td>

                    {/* STATUS */}
                    <td>

                      <Badge bg="success">

                        {item.status || 'checked_out'}

                      </Badge>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </Modal.Body>

      <Modal.Footer>

        <Button
          variant="secondary"
          size="sm"
          onClick={onHide}
        >
          Close
        </Button>

      </Modal.Footer>

    </Modal>
  )
}

export default GuestHistoryModal