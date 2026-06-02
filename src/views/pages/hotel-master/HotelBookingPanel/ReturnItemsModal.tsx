// components/ReturnItemsModal.tsx
import { useState, useEffect } from 'react'
import { Modal, Button, Table, Form, Badge } from 'react-bootstrap'
import StockService from '@/common/hotel/stock'
import toast from 'react-hot-toast'

interface ReturnItemsModalProps {
  show: boolean
  onHide: () => void
  checkinId: number
  roomId: number
  roomNo: string
  guestName: string
  hotelId: number
  userId?: number
  onReturnComplete: (damageCharge: number) => void
}

interface IssuedItem {
  checkin_amenity_id: number
  item_id: number
  item_name: string
  category: string
  quantity: number
  price: number
  is_returnable: number
}

const ReturnItemsModal = ({ 
  show, onHide, checkinId, roomId, roomNo, guestName, hotelId, userId, onReturnComplete 
}: ReturnItemsModalProps) => {
  const [issuedItems, setIssuedItems] = useState<IssuedItem[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [returnValues, setReturnValues] = useState<Map<number, { returned: number; damaged: number; damageCharge: number }>>(new Map())

  useEffect(() => {
    if (show && checkinId && roomId) {
      loadIssuedItems()
    }
  }, [show, checkinId, roomId])

  const loadIssuedItems = async () => {
    if (!hotelId) return
    setLoading(true)
    try {
      const res = await StockService.getRoomIssuedItems({ 
        checkin_id: checkinId, 
        room_id: roomId, 
        hotelid: hotelId 
      })
      if (res.success && res.data) {
        setIssuedItems(res.data)
        const newMap = new Map()
        res.data.forEach((item: any) => {
          newMap.set(item.item_id, { returned: 0, damaged: 0, damageCharge: 0 })
        })
        setReturnValues(newMap)
      }
    } catch (error) {
      console.error('Failed to load issued items:', error)
      toast.error('Failed to load issued items')
    } finally {
      setLoading(false)
    }
  }

  const handleReturnChange = (itemId: number, field: 'returned' | 'damaged', value: number) => {
    const current = returnValues.get(itemId) || { returned: 0, damaged: 0, damageCharge: 0 }
    const item = issuedItems.find(i => i.item_id === itemId)
    const maxQuantity = item?.quantity || 0
    
    let newReturned = current.returned
    let newDamaged = current.damaged
    
    if (field === 'returned') {
      newReturned = Math.min(value, maxQuantity - current.damaged)
    } else {
      newDamaged = Math.min(value, maxQuantity - current.returned)
    }
    
    const damageCharge = newDamaged * (item?.price || 0)
    
    returnValues.set(itemId, { returned: newReturned, damaged: newDamaged, damageCharge })
    setReturnValues(new Map(returnValues))
  }

  const calculateTotalDamageCharge = () => {
    let total = 0
    returnValues.forEach((value) => {
      total += value.damageCharge
    })
    return total
  }

  const handleSubmitReturn = async () => {
    if (!hotelId) return
    setSubmitting(true)
    try {
      const returnItems = issuedItems.map(item => {
        const values = returnValues.get(item.item_id)
        return {
          item_id: item.item_id,
          quantity_returned: values?.returned || 0,
          quantity_damaged: values?.damaged || 0,
          damage_charge: values?.damageCharge || 0
        }
      }).filter(r => r.quantity_returned > 0 || r.quantity_damaged > 0)

      if (returnItems.length === 0) {
        toast.error('No items marked for return')
        setSubmitting(false)
        return
      }

      const response = await StockService.processReturn({
        checkin_id: checkinId,
        room_id: roomId,
        items: returnItems,
        hotelid: hotelId,
        user_id: userId
      })

      if (response.success) {
        const damageCharge = calculateTotalDamageCharge()
        toast.success(`Items returned! Damage charge: ₹${damageCharge.toFixed(2)}`)
        onReturnComplete(damageCharge)
        onHide()
      } else {
        toast.error(response.message || 'Failed to process returns')
      }
    } catch (error: any) {
      console.error('Failed to process returns:', error)
      toast.error(error.message || 'Failed to process returns')
    } finally {
      setSubmitting(false)
    }
  }

  const totalDamageCharge = calculateTotalDamageCharge()
  const returnableItems = issuedItems.filter(i => i.is_returnable === 1)

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title className="fs-6">
          <i className="fi fi-rr-return me-2"></i>
          Return Items - Room {roomNo} ({guestName})
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading ? (
          <div className="text-center py-4">Loading issued items...</div>
        ) : returnableItems.length === 0 ? (
          <div className="text-center py-4 text-muted">
            <i className="fi fi-rr-boxes fs-3"></i>
            <p className="mt-2 mb-0">No returnable items issued to this room.</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <Table size="sm" bordered>
                <thead className="table-light">
                  <tr>
                    <th>Item</th>
                    <th>Issued</th>
                    <th>Returned</th>
                    <th>Damaged</th>
                    <th>Damage Charge</th>
                  </tr>
                </thead>
                <tbody>
                  {returnableItems.map((item) => {
                    const values = returnValues.get(item.item_id)
                    return (
                      <tr key={item.item_id}>
                        <td>
                          {item.item_name}
                          <br />
                          <small className="text-muted">{item.category}</small>
                        </td>
                        <td className="text-center fw-bold">{item.quantity}</td>
                        <td>
                          <Form.Control
                            type="number"
                            size="sm"
                            min="0"
                            max={item.quantity - (values?.damaged || 0)}
                            value={values?.returned || 0}
                            onChange={(e) => handleReturnChange(item.item_id, 'returned', parseInt(e.target.value) || 0)}
                            style={{ width: '80px' }}
                          />
                        </td>
                        <td>
                          <Form.Control
                            type="number"
                            size="sm"
                            min="0"
                            max={item.quantity - (values?.returned || 0)}
                            value={values?.damaged || 0}
                            onChange={(e) => handleReturnChange(item.item_id, 'damaged', parseInt(e.target.value) || 0)}
                            style={{ width: '80px' }}
                          />
                        </td>
                        <td className="text-danger fw-bold">
                          ₹{((values?.damageCharge || 0)).toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="bg-light">
                  <tr>
                    <td colSpan={4} className="text-end fw-bold">Total Damage Charge:</td>
                    <td className="text-danger fw-bold fs-6">₹{totalDamageCharge.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </Table>
            </div>
            <div className="alert alert-warning mt-3 small">
              <i className="fi fi-rr-info me-2"></i>
              <strong>Note:</strong> Damage charges will be added to the guest's final bill.
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" size="sm" onClick={onHide} disabled={submitting}>
          Cancel
        </Button>
        <Button 
          variant="danger" 
          size="sm" 
          onClick={handleSubmitReturn}
          disabled={submitting || returnableItems.length === 0}
        >
          {submitting ? 'Processing...' : 'Confirm Return'}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default ReturnItemsModal