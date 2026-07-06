// ReceiptAgainstBillsModal.tsx
import { useState, useEffect } from 'react'
import { Modal, Button, Form, Card } from 'react-bootstrap'
import { toast } from 'react-hot-toast'

interface ReceiptAgainstBillsModalProps {
  show: boolean
  onHide: () => void
  roomNo: string
  guestName: string
  checkinId: number
  detailId?: number
  hotelId: number
  userId?: number
  onSuccess?: () => void
}

interface PostedBill {
  id: string
  billDate: string
  roomNo: string
  billNo: string
  description: string
  amount: number
  discount: number
  total: number
  isSelected: boolean
  paidAmount?: number
}

const ReceiptAgainstBillsModal = ({
  show,
  onHide,
  roomNo,
  guestName,
  checkinId,
  detailId,
  hotelId,
  userId,
  onSuccess,
}: ReceiptAgainstBillsModalProps) => {
  const [postType, setPostType] = useState<'receipt' | 'payment'>('receipt')
  const [receiptNo, setReceiptNo] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16))
  const [amount, setAmount] = useState('')
  const [mode, setMode] = useState('Cash')
  const [department, setDepartment] = useState('')
  const [mainGroup, setMainGroup] = useState('Advance Recd')
  const [subGroup, setSubGroup] = useState('Advance')
  const [particulars, setParticulars] = useState('')
  const [postedBills, setPostedBills] = useState<PostedBill[]>([])
  const [saving, setSaving] = useState(false)

  const [departments, setDepartments] = useState<Array<{ department_id: number; department_name: string }>>([])
  const [loadingDepartments, setLoadingDepartments] = useState(false)

  const paymentModes = ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Cheque', 'Credit']
  const mainGroups = ['Advance Recd', 'Guest Account', 'Tax', 'Service Charge']


  const subGroups: Record<string, string[]> = {
    'Advance Recd': ['Advance', 'Security Deposit'],
    'Guest Account': ['Room Rent', 'Food', 'Beverage', 'Laundry', 'Other'],
    Tax: ['GST', 'Service Tax'],
    'Service Charge': ['Service Charge'],
  }

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  useEffect(() => {
    if (show && !receiptNo) {
      const newReceiptNo = `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      setReceiptNo(newReceiptNo)
    }
  }, [show])

  useEffect(() => {
    if (!show) return

    setLoadingDepartments(true)
    setDepartments([])
    setDepartment('')

    // Load Department master data
    // (department table mapped by backend)
    // Reuses same API approach as PostChargesModal.
     
    import('@/common/hotel').then(({ departmentApi }) => {
      return departmentApi.list({ hotelid: hotelId })
    })
      .then((res) => {
        const payload = res as any
        const list = Array.isArray(payload) ? payload : payload?.data
        setDepartments(list ?? [])

        // Set default department to first available for the dropdown.
        const firstName = (list ?? []).find((d: any) => d?.department_name)?.department_name
        setDepartment(firstName ?? '')
      })

      .catch((err) => {
        console.error('Failed to load Department data:', err)
        toast.error('Failed to load Department data')
      })
      .finally(() => setLoadingDepartments(false))
  }, [show, hotelId])

  useEffect(() => {
    if (show && checkinId) {
      // Mock data - replace with API call
      const mockBills: PostedBill[] = [

        {
          id: generateId(),
          billDate: new Date().toISOString().slice(0, 10),
          roomNo,
          billNo: `BILL-${Date.now()}-001`,
          description: 'Food charges - Restaurant',
          amount: 500,
          discount: 0,
          total: 500,
          isSelected: false,
        },
        {
          id: generateId(),
          billDate: new Date().toISOString().slice(0, 10),
          roomNo,
          billNo: `BILL-${Date.now()}-002`,
          description: 'Laundry services',
          amount: 300,
          discount: 0,
          total: 300,
          isSelected: false,
        },
        {
          id: generateId(),
          billDate: new Date().toISOString().slice(0, 10),
          roomNo,
          billNo: `BILL-${Date.now()}-003`,
          description: 'Mini Bar charges',
          amount: 200,
          discount: 0,
          total: 200,
          isSelected: false,
        },
      ]
      setPostedBills(mockBills)
    }
  }, [show, checkinId, roomNo])

  const toggleBillSelection = (billId: string) => {
    setPostedBills((prev) =>
      prev.map((bill) => {
        if (bill.id === billId) {
          const newSelected = !bill.isSelected
          return {
            ...bill,
            isSelected: newSelected,
            paidAmount: newSelected ? bill.total : undefined,
          }
        }
        return bill
      }),
    )
  }

  const updatePaidAmount = (billId: string, paidAmount: number) => {
    setPostedBills((prev) =>
      prev.map((bill) => {
        if (bill.id === billId && bill.isSelected) {
          const validAmount = Math.min(Math.max(0, paidAmount), bill.total)
          return { ...bill, paidAmount: validAmount }
        }
        return bill
      }),
    )
  }

  const getTotalSelectedAmount = () => {
    return postedBills
      .filter((bill) => bill.isSelected)
      .reduce((sum, bill) => sum + (bill.paidAmount || bill.total), 0)
  }

  const getTotalBillsAmount = () => {
    return postedBills.reduce((sum, bill) => sum + bill.total, 0)
  }

  const getBalanceAmount = () => {
    return getTotalBillsAmount() - getTotalSelectedAmount()
  }

  const handleSave = async () => {
    const selectedBillsList = postedBills.filter((bill) => bill.isSelected)

    if (selectedBillsList.length === 0) {
      toast.error('Please select at least one bill to pay')
      return
    }

    const totalSelected = getTotalSelectedAmount()
    const enteredAmount = parseFloat(amount)

    if (!enteredAmount || enteredAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (Math.abs(enteredAmount - totalSelected) > 0.01) {
      toast.error(`Amount mismatch. Total selected bills: ₹${totalSelected.toFixed(2)}`)
      return
    }

    setSaving(true)
    try {
      console.log('Saving receipt:', {
        postType,
        receiptNo,
        date,
        amount: enteredAmount,
        mode,
        department,
        mainGroup,
        subGroup,
        particulars,
        checkinId,
        detailId,
        hotelId,
        selectedBills: selectedBillsList,
        userId,
      })

      toast.success(`Receipt posted successfully for ₹${enteredAmount.toFixed(2)}`)

      if (onSuccess) onSuccess()

      setTimeout(() => {
        onHide()
        setReceiptNo('')
        setAmount('')
        setMode('Cash')
        setDepartment('')
        setMainGroup('Advance Recd')
        setSubGroup('Advance')
        setParticulars('')
        setPostedBills([])
      }, 1500)

    } catch (error) {
      console.error('Failed to save receipt:', error)
      toast.error('Failed to save receipt')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
      backdrop="static"
      className="receipt-modal">
      <Modal.Header closeButton className="py-2">
        <Modal.Title className="fs-6">RECEIPT AGAINST POSTED BILLS</Modal.Title>
      </Modal.Header>

      <Modal.Body className="pb-2">
        <Card>
          <Card.Body className="p-3">
            {/* Post Type Toggle Buttons - Row 1 - Same as PostChargesModal */}
            <div className="row align-items-center g-2 mb-3">
              <div className="col-md-2">
                <Form.Label className="fw-semibold small mb-0">Post Type :</Form.Label>
              </div>

              <div className="col-md-5">
                <Button
                  variant={postType === 'receipt' ? 'danger' : 'outline-danger'}
                  className="w-100 rounded-0 fw-semibold"
                  size="sm"
                  onClick={() => setPostType('receipt')}>
                  Receipt ( + )
                </Button>
              </div>

              <div className="col-md-5">
                <Button
                  variant={postType === 'payment' ? 'secondary' : 'outline-secondary'}
                  className="w-100 rounded-0 fw-semibold"
                  size="sm"
                  onClick={() => setPostType('payment')}>
                  Payment ( - )
                </Button>
              </div>
            </div>

            {/* Form Fields - Row 1 */}
            <div className="row align-items-center g-4 mb-2">
              <div className="col-md-2">
                <Form.Label className="fw-small mb-0 small">Department :</Form.Label>
              </div>
              <div className="col-md-4">
                <Form.Select
                  size="sm"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="bg-light">
                  {loadingDepartments ? (
                    <option value="">Loading...</option>
                  ) : (
                    departments.map((d) => (
                      <option key={d.department_id} value={d.department_name}>
                        {d.department_name}
                      </option>
                    ))
                  )}

                </Form.Select>
              </div>
            </div>

            <div className="row align-items-center g-4 mb-2">
              <div className="col-md-2">
                <Form.Label className="fw-small mb-0 small">Main Group :</Form.Label>
              </div>
              <div className="col-md-4">
                <Form.Select
                  size="sm"
                  value={mainGroup}
                  onChange={(e) => {
                    setMainGroup(e.target.value)
                    setSubGroup(subGroups[e.target.value]?.[0] || '')
                  }}
                  className="bg-light">
                  {mainGroups.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </Form.Select>
              </div>
              <div className="col-md-2">
                <Form.Label className="fw-small mb-0 small">Sub Group :</Form.Label>
              </div>
              <div className="col-md-4">
                <Form.Select
                  size="sm"
                  value={subGroup}
                  onChange={(e) => setSubGroup(e.target.value)}
                  className="bg-light">
                  {(subGroups[mainGroup] || ['Advance']).map((sg) => (
                    <option key={sg} value={sg}>
                      {sg}
                    </option>
                  ))}
                </Form.Select>
              </div>
            </div>

            {/* Form Fields - Row 2 */}
            {/* ================= DOC NO / DATE TIME =================*/}
            <div className="row align-items-center g-3 mb-2">
              <div className="col-md-2">
                <Form.Label className="small mb-0">
                  Doc No :
                </Form.Label>
              </div>

              <div className="col-md-4">
                <Form.Control
                  type="text"
                  size="sm"
                  placeholder="Enter Doc No"
                  className="bg-light"
                />
              </div>

              <div className="col-md-2">
                <Form.Label className="small mb-0">
                  Date & Time :
                </Form.Label>
              </div>

              <div className="col-md-4">
                <Form.Control
                  type="datetime-local"
                  size="sm"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="bg-light"
                />
              </div>
            </div>

            {/* ================= AMOUNT ================= */}
            <div className="row align-items-center g-3 mb-2">
              <div className="col-md-2">
                <Form.Label className="small mb-0">
                  Amount :
                </Form.Label>
              </div>

              <div className="col-md-4">
                <Form.Control
                  type="number"
                  size="sm"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="bg-light text-start"
                />
              </div>

              <div className="col-md-2">
                <Form.Label className="small mb-0">
                  {/* Empty for spacing */}
                </Form.Label>
              </div>

              <div className="col-md-4">
                {/* Empty for spacing */}
              </div>
            </div>

            {/* ================= MODE / DEPT ================= */}
            <div className="row align-items-center g-3 mb-2">
              <div className="col-md-2">
                <Form.Label className="small mb-0">
                  Mode :
                </Form.Label>
              </div>

              <div className="col-md-4">
                <Form.Select
                  size="sm"
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="bg-light">
                  {paymentModes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </Form.Select>
              </div>

              <div className="col-md-2">
                <Form.Label className="small mb-0">
                  Dept. :
                </Form.Label>
              </div>

              <div className="col-md-4">
                <Form.Select
                  size="sm"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="bg-light">
                  {loadingDepartments ? (
                    <option value="">Loading...</option>
                  ) : (
                    departments.map((d) => (
                      <option key={d.department_id} value={d.department_name}>
                        {d.department_name}
                      </option>
                    ))
                  )}
                </Form.Select>
              </div>
            </div>

            {/* ================= PARTICULARS ================= */}
            <div className="row align-items-start g-3 mb-3">
              <div className="col-md-2">
                <Form.Label className="small mb-0">
                  Particulars :
                </Form.Label>
              </div>

              <div className="col-md-10">
                <Form.Control
                  as="textarea"
                  rows={2}
                  size="sm"
                  value={particulars}
                  onChange={(e) => setParticulars(e.target.value)}
                  placeholder="Enter particulars"
                  className="bg-light"
                />
              </div>
            </div>
            {/* Posted Bills Section */}
            <div className="mb-3">
              <Form.Label className="fw-semibold small mb-2">Posted Bills :</Form.Label>
              <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table className="table table-sm table-bordered mb-0 small">
                  <thead className="table-light position-sticky top-0">
                    <tr>
                      <th style={{ width: '5%' }} className="py-1">
                        Select
                      </th>
                      <th style={{ width: '10%' }} className="py-1">
                        Bill Date
                      </th>
                      <th style={{ width: '8%' }} className="py-1">
                        Room No
                      </th>
                      <th style={{ width: '12%' }} className="py-1">
                        Bill No
                      </th>
                      <th style={{ width: '25%' }} className="py-1">
                        Description
                      </th>
                      <th style={{ width: '10%' }} className="py-1 text-end">
                        Amount
                      </th>
                      <th style={{ width: '15%' }} className="py-1 text-end">
                        Paid Amount
                      </th>
                      <th style={{ width: '10%' }} className="py-1 text-end">
                        Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {postedBills.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center text-muted py-4">
                          No bills found
                        </td>
                      </tr>
                    ) : (
                      postedBills.map((bill) => (
                        <tr key={bill.id}>
                          <td className="text-center">
                            <Form.Check
                              type="checkbox"
                              checked={bill.isSelected}
                              onChange={() => toggleBillSelection(bill.id)}
                            />
                          </td>
                          <td className="py-1">{bill.billDate}</td>
                          <td className="py-1">{bill.roomNo}</td>
                          <td className="py-1 small">{bill.billNo}</td>
                          <td className="py-1">{bill.description}</td>
                          <td className="py-1 text-end">₹{bill.total.toFixed(2)}</td>
                          <td className="py-1 text-end">
                            {bill.isSelected ? (
                              <Form.Control
                                type="number"
                                size="sm"
                                value={bill.paidAmount || bill.total}
                                onChange={(e) =>
                                  updatePaidAmount(bill.id, parseFloat(e.target.value) || 0)
                                }
                                step="0.01"
                                min="0"
                                max={bill.total}
                                style={{ width: '100px', display: 'inline-block' }}
                                className="text-end bg-light"
                              />
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="py-1 text-end fw-semibold">
                            ₹
                            {(
                              bill.total - (bill.isSelected ? bill.paidAmount || bill.total : 0)
                            ).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="table-light">
                    <tr>
                      <td colSpan={5} className="text-end fw-bold py-1">
                        Total:
                      </td>
                      <td className="text-end fw-bold py-1">₹{getTotalBillsAmount().toFixed(2)}</td>
                      <td className="text-end fw-bold py-1">
                        ₹{getTotalSelectedAmount().toFixed(2)}
                      </td>
                      <td className="text-end fw-bold py-1">₹{getBalanceAmount().toFixed(2)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

          </Card.Body>
        </Card>
      </Modal.Body>

      {/* Modal Footer */}
      <Modal.Footer className="py-1">
        {/* Save Button */}
        <Button
          variant="success"
          size="sm"
          onClick={handleSave}
          disabled={saving || postedBills.filter((b) => b.isSelected).length === 0}
          className="px-4">
          {saving ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Saving...
            </>
          ) : (
            'Save'
          )}
        </Button>

        {/* Cancel Button */}
        <Button
          variant="warning"
          size="sm"
          onClick={() => {
            setPostedBills([])
          }}
          className="px-4">
          Cancel
        </Button>

        {/* Exit Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            onHide()
            setPostedBills([])
          }}
          className="px-4">
          Exit
        </Button>
      </Modal.Footer>

      <style>{`
        .receipt-modal .modal-dialog {
          max-width: 750px;
        }
        .receipt-modal .modal-header {
          background: #1787ff;
          border-bottom: none;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
        }
        .receipt-modal .modal-header .modal-title {
          color: white;
          font-size: 0.775rem;
          font-weight: 650;
        }
        .receipt-modal .modal-header .btn-close {
          filter: brightness(0) invert(1);
        }
        .receipt-modal .modal-footer {
          border-top: 1px solid #dee2e6;
          background-color: #f8f9fa;
        }
        .receipt-modal .table th,
        .receipt-modal .table td {
          vertical-align: middle;
          font-size: 0.75rem;
          padding: 0.25rem 0.5rem;
        }
        .receipt-modal .table thead th {
          background-color: #f8f9fa;
          font-weight: 600;
        }
        .receipt-modal .bg-light {
          background-color: #f0f0f0 !important;
        }
        .receipt-modal .form-control.bg-light,
        .receipt-modal .form-select.bg-light {
          background-color: #f5f5f5 !important;
          border-color: #e0e0e0;
        }
        .receipt-modal .form-control.bg-light:focus,
        .receipt-modal .form-select.bg-light:focus {
          background-color: #f5f5f5 !important;
          box-shadow: none;
        }
        .receipt-modal input[type="number"] {
          text-align: right;
        }
      `}</style>
    </Modal>
  )
}

export default ReceiptAgainstBillsModal