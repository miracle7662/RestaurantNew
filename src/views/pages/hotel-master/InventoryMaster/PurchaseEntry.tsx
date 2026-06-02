// pages/InventoryManagement/PurchaseEntry.tsx

import { useState, useEffect } from 'react'
import { Card, Button, Table, Form, Row, Col, Modal, Badge } from 'react-bootstrap'
import Select from 'react-select'
import toast from 'react-hot-toast'
import Swal from 'sweetalert2'

import StockService, { StockItem, PurchaseItem } from '@/common/hotel/stock'

import { useAuthContext } from '@/common/context/useAuthContext'

interface PurchaseEntryProps {
  onPurchaseComplete?: () => void
}

const PurchaseEntry = ({ onPurchaseComplete }: PurchaseEntryProps) => {
  const { user } = useAuthContext()

  const hotelId = user?.hotelid
  const userId = user?.id

  const [items, setItems] = useState<StockItem[]>([])
  const [purchases, setPurchases] = useState<any[]>([])

  const [vendorName, setVendorName] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')

  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])

  const [selectedItems, setSelectedItems] = useState<PurchaseItem[]>([])

  const [currentItem, setCurrentItem] = useState<{
    item_id: number
    quantity: number
    price: number
    gst_percent: number
  } | null>(null)

  const [showItemModal, setShowItemModal] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (hotelId) {
      loadStockItems()
      loadPurchaseHistory()
    }
  }, [hotelId])

  const loadStockItems = async () => {
    try {
      const res = await StockService.getItems({
        hotelid: hotelId,
      })

      if (res?.success && Array.isArray(res.data)) {
        const uniqueItems = res.data.filter(
          (item: any, index: number, self: any[]) =>
            index === self.findIndex((i: any) => i.item_id === item.item_id),
        )

        setItems(uniqueItems)
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to load stock items')
    }
  }

  const loadPurchaseHistory = async () => {
    try {
      const res = await StockService.getPurchases({
        hotelid: hotelId,
      })

      if (res?.success && Array.isArray(res.data)) {
        setPurchases(res.data)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const itemOptions = items.map((item) => ({
    label: `${item.item_name} (${item.category})`,
    value: item.item_id,
    item,
  }))

  const handleAddItem = () => {
    if (!currentItem?.item_id) {
      toast.error('Please select item')
      return
    }

    if (!currentItem.quantity || currentItem.quantity <= 0) {
      toast.error('Enter valid quantity')
      return
    }

    const gstAmount =
      ((Number(currentItem.price) || 0) *
        (Number(currentItem.quantity) || 0) *
        (Number(currentItem.gst_percent) || 0)) /
      100

    const newItem: PurchaseItem = {
      item_id: Number(currentItem.item_id),
      quantity: Number(currentItem.quantity),
      price: Number(currentItem.price),
      gst_percent: Number(currentItem.gst_percent || 0),
      gst_amount: Number(gstAmount || 0),
    }

    const existingIndex = selectedItems.findIndex((i) => i.item_id === newItem.item_id)

    if (existingIndex >= 0) {
      const updated = [...selectedItems]

      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: Number(updated[existingIndex].quantity) + Number(newItem.quantity),

        gst_amount:
          Number(updated[existingIndex].gst_amount || 0) + Number(newItem.gst_amount || 0),
      }

      setSelectedItems(updated)
    } else {
      setSelectedItems((prev) => [...prev, newItem])
    }

    setCurrentItem(null)
    setShowItemModal(false)

    toast.success('Item added')
  }

  const handleRemoveItem = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index))
  }

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => {
      const itemTotal =
        Number(item.price || 0) * Number(item.quantity || 0) + Number(item.gst_amount || 0)

      return sum + itemTotal
    }, 0)
  }

  const handleSubmitPurchase = async () => {
    if (!hotelId) {
      toast.error('Hotel ID not found')
      return
    }

    if (!vendorName.trim()) {
      toast.error('Please enter vendor name')
      return
    }

    if (selectedItems.length === 0) {
      toast.error('Please add item')
      return
    }

    const cleanedItems = selectedItems.map((item) => ({
      item_id: Number(item.item_id),
      quantity: Number(item.quantity),
      price: Number(item.price),
      gst_percent: Number(item.gst_percent || 0),
      gst_amount: Number(item.gst_amount || 0),

      total_amount: Number(item.quantity) * Number(item.price) + Number(item.gst_amount || 0),
    }))

    const grandTotal = cleanedItems.reduce((sum, item) => sum + Number(item.total_amount), 0)

    const result = await Swal.fire({
      title: 'Confirm Purchase',
      text: `Total Amount ₹${grandTotal.toFixed(2)}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes Save',
    })

    if (!result.isConfirmed) return

    setSubmitting(true)

    try {
      const payload = {
        vendor_name: vendorName.trim(),
        invoice_number: invoiceNumber?.trim() || '',
        purchase_date: purchaseDate,

        total_amount: grandTotal,

        hotelid: Number(hotelId),
        user_id: Number(userId),

        items: cleanedItems,
      }

      console.log('PURCHASE PAYLOAD => ', payload)

      const response = await StockService.createPurchase(payload)

      if (response?.success) {
        toast.success('Purchase saved successfully')

        setVendorName('')
        setInvoiceNumber('')
        setSelectedItems([])

        setPurchaseDate(new Date().toISOString().split('T')[0])

        loadPurchaseHistory()

        if (onPurchaseComplete) {
          onPurchaseComplete()
        }
      } else {
        toast.error(response?.message || 'Failed to save purchase')
      }
    } catch (error: any) {
      console.error(error)

      toast.error(error?.response?.data?.message || error?.message || 'Failed to save purchase')
    } finally {
      setSubmitting(false)
    }
  }

  const totalAmount = calculateTotal()

  return (
    <>
      <Row className="g-3">
        <Col md={7}>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">
                  <i className="fi fi-rr-shopping-cart me-2"></i>
                  Purchase Entry
                </h5>

                <Badge bg="danger">Total ₹{totalAmount.toFixed(2)}</Badge>
              </div>

              <Row className="g-2 mb-3">
                <Col md={5}>
                  <Form.Label className="fw-bold small">Vendor Name *</Form.Label>

                  <Form.Control
                    size="sm"
                    type="text"
                    value={vendorName}
                    placeholder="Enter vendor name"
                    onChange={(e) => setVendorName(e.target.value)}
                  />
                </Col>

                <Col md={4}>
                  <Form.Label className="fw-bold small">Invoice No</Form.Label>

                  <Form.Control
                    size="sm"
                    type="text"
                    value={invoiceNumber}
                    placeholder="Invoice number"
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </Col>

                <Col md={3}>
                  <Form.Label className="fw-bold small">Purchase Date</Form.Label>

                  <Form.Control
                    size="sm"
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                  />
                </Col>
              </Row>

              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="fw-bold">Purchase Items</span>

                <Button variant="success" size="sm" onClick={() => setShowItemModal(true)}>
                  <i className="fi fi-rr-plus me-1"></i>
                  Add Item
                </Button>
              </div>

              <div className="table-responsive">
                <Table hover size="sm">
                  <thead className="table-light">
                    <tr>
                      <th>Item</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>GST%</th>
                      <th>GST Amt</th>
                      <th>Total</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>
                    {selectedItems.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center text-muted py-3">
                          No items added
                        </td>
                      </tr>
                    ) : (
                      selectedItems.map((item, idx) => {
                        const itemInfo = items.find((i) => i.item_id === item.item_id)

                        const total =
                          Number(item.quantity || 0) * Number(item.price || 0) +
                          Number(item.gst_amount || 0)

                        return (
                          <tr key={idx}>
                            <td>{itemInfo?.item_name || '-'}</td>

                            <td>{Number(item.quantity)}</td>

                            <td>₹{Number(item.price || 0).toFixed(2)}</td>

                            <td>{Number(item.gst_percent || 0)}%</td>

                            <td>₹{Number(item.gst_amount || 0).toFixed(2)}</td>

                            <td className="fw-bold">₹{total.toFixed(2)}</td>

                            <td>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => handleRemoveItem(idx)}>
                                <i className="fi fi-rr-trash"></i>
                              </Button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>

                  <tfoot>
                    <tr>
                      <td colSpan={5} className="text-end fw-bold">
                        Grand Total
                      </td>

                      <td colSpan={2} className="fw-bold text-danger">
                        ₹{totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </Table>
              </div>

              <div className="d-flex justify-content-end gap-2 mt-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setVendorName('')
                    setInvoiceNumber('')
                    setSelectedItems([])
                  }}>
                  Clear
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  disabled={submitting || selectedItems.length === 0}
                  onClick={handleSubmitPurchase}>
                  {submitting ? 'Saving...' : 'Record Purchase'}
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* RIGHT SIDE - RECENT PURCHASES */}

        <Col md={5}>
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0">
                  <i className="fi fi-rr-time-past me-2"></i>
                  Recent Purchases
                </h6>

                <Button variant="link" size="sm" onClick={() => setShowHistory(!showHistory)}>
                  {showHistory ? 'Hide' : 'View'}
                </Button>
              </div>

              {showHistory ? (
                <div
                  className="table-responsive"
                  style={{
                    maxHeight: '450px',
                    overflowY: 'auto',
                  }}>
                  <Table hover bordered size="sm" className="align-middle mb-0">
                    <thead
                      className="table-light"
                      style={{
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                      }}>
                      <tr>
                        <th style={{ minWidth: '90px' }}>Date</th>

                        <th style={{ minWidth: '130px' }}>Vendor</th>

                        <th style={{ minWidth: '220px' }}>Items</th>

                        <th className="text-center">Qty</th>

                        <th className="text-end">Amount</th>
                      </tr>
                    </thead>

                    <tbody>
                      {purchases.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center text-muted py-4">
                            No purchase history found
                          </td>
                        </tr>
                      ) : (
                        purchases.map((purchase) => {
                          const purchaseItems = Array.isArray(purchase.items) ? purchase.items : []

                          const totalQty = purchaseItems.reduce(
                            (sum: number, item: any) => sum + Number(item.quantity || 0),
                            0,
                          )

                          return (
                            <tr key={purchase.purchase_id}>
                              <td>{new Date(purchase.purchase_date).toLocaleDateString()}</td>

                              <td className="fw-semibold">{purchase.vendor_name || '-'}</td>

                              <td>
                                {purchaseItems.length > 0 ? (
                                  <div className="d-flex flex-wrap gap-1">
                                    {purchaseItems.map((item: any, idx: number) => (
                                      <Badge
                                        key={idx}
                                        bg="info"
                                        className="fw-normal"
                                        title={`${item.item_name} × ${item.quantity}`}>
                                        {item.item_name} × {item.quantity}
                                      </Badge>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted small">No Items</span>
                                )}
                              </td>

                              <td className="text-center fw-bold">{totalQty}</td>

                              <td className="text-end fw-bold text-danger">
                                ₹{Number(purchase.total_amount || 0).toFixed(2)}
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  <i className="fi fi-rr-time-past fs-3"></i>

                  <p className="small mt-2 mb-0">Click View to show purchase history</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal centered show={showItemModal} onHide={() => setShowItemModal(false)}>
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title className="fs-6">Add Item</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold small">Select Item</Form.Label>

            <Select
              options={itemOptions}
              placeholder="Search item..."
              isClearable
              onChange={(option: any) => {
                if (option) {
                  setCurrentItem({
                    item_id: Number(option.value),
                    quantity: 1,
                    price: Number(option.item.price || 0),
                    gst_percent: Number(option.item.gst_percent || 0),
                  })
                }
              }}
            />
          </Form.Group>

          {currentItem && (
            <>
              <Row className="g-2">
                <Col md={6}>
                  <Form.Label className="fw-bold small">Quantity</Form.Label>

                  <Form.Control
                    type="number"
                    size="sm"
                    min={1}
                    value={currentItem.quantity}
                    onChange={(e) =>
                      setCurrentItem({
                        ...currentItem,
                        quantity: Number(e.target.value) || 1,
                      })
                    }
                  />
                </Col>

                <Col md={6}>
                  <Form.Label className="fw-bold small">Price</Form.Label>

                  <Form.Control
                    type="number"
                    size="sm"
                    step="0.01"
                    value={currentItem.price}
                    onChange={(e) =>
                      setCurrentItem({
                        ...currentItem,
                        price: Number(e.target.value) || 0,
                      })
                    }
                  />
                </Col>
              </Row>

              <Row className="g-2 mt-2">
                <Col md={6}>
                  <Form.Label className="fw-bold small">GST %</Form.Label>

                  <Form.Control
                    type="number"
                    size="sm"
                    step="0.01"
                    value={currentItem.gst_percent}
                    onChange={(e) =>
                      setCurrentItem({
                        ...currentItem,
                        gst_percent: Number(e.target.value) || 0,
                      })
                    }
                  />
                </Col>

                <Col md={6}>
                  <Form.Label className="fw-bold small">Subtotal</Form.Label>

                  <Form.Control
                    readOnly
                    size="sm"
                    value={`₹${(Number(currentItem.quantity) * Number(currentItem.price)).toFixed(
                      2,
                    )}`}
                  />
                </Col>
              </Row>
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" size="sm" onClick={() => setShowItemModal(false)}>
            Cancel
          </Button>

          <Button
            variant="danger"
            size="sm"
            disabled={!currentItem?.item_id}
            onClick={handleAddItem}>
            Add Item
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default PurchaseEntry
