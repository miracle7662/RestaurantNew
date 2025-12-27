// EditSettlementPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  Modal,
  Button,
  Table,
  Form,
  Row,
  Col,
  Alert,
  Card,
} from 'react-bootstrap';
import axios from 'axios';

interface Settlement {
  SettlementID: number;
  OrderNo: string;
  PaymentType: string;
  Amount: number;
  HotelID: string;
  InsertDate: string;
  isSettled: number;
  SettlementIDs?: number[];          // when grouped
  PaymentTypes?: string[];           // when grouped
  paymentBreakdown?: Record<string, number>;
}

interface PaymentMode {
  id: number;
  paymenttypeid: number;
  mode_name: string;
}

interface EditSettlementPageProps {
  role: string;
  currentUser: any; // You can make this more specific later
}

const EditSettlementPage: React.FC<EditSettlementPageProps> = ({ role, currentUser }) => {
  // ── Main States ───────────────────────────────────────────────────
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [filters, setFilters] = useState({
    orderNo: '',
    hotelId: '',
    outletId: '',
    from: '',
    to: '',
    paymentType: '',
  });

  const [currentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOutletId, setSelectedOutletId] = useState<number | null>(
    currentUser?.outletid ? Number(currentUser.outletid) : null
  );

  // ── Edit Modal States ─────────────────────────────────────────────
  const [editing, setEditing] = useState<Settlement | null>(null);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [grandTotal, setGrandTotal] = useState(0);
  const [isMixedPayment, setIsMixedPayment] = useState(false);
  const [selectedPaymentModes, setSelectedPaymentModes] = useState<string[]>([]);
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
  const [totalPaid, setTotalPaid] = useState(0);
  const [settlementBalance, setSettlementBalance] = useState(0);

  // ── Payment Modes ─────────────────────────────────────────────────
  const [outletPaymentModes, setOutletPaymentModes] = useState<PaymentMode[]>([]);

  // ── Notification ──────────────────────────────────────────────────
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'danger';
  }>({
    show: false,
    message: '',
    type: 'success',
  });

  // Fetch all available payment modes once
  useEffect(() => {
    const fetchPaymentModes = async () => {
      try {
        const res = await axios.get('http://localhost:3001/api/payment-modes');
        setOutletPaymentModes(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to load payment modes:', err);
        setOutletPaymentModes([]);
      }
    };
    fetchPaymentModes();
  }, []);

  // Fetch settlements list
  const fetchSettlements = async () => {
    try {
      const params = { ...filters, outletId: selectedOutletId, page: currentPage, limit: 10 };
      const res = await axios.get('http://localhost:3001/api/settlements', { params });

      const data = res.data?.data ?? res.data;
      const settlementsData = Array.isArray(data.settlements) ? data.settlements : data;
      const total = data.total ?? 0;

      setSettlements(settlementsData);
      setTotalPages(Math.ceil(total / 10));
    } catch (err) {
      console.error(err);
      setNotification({ show: true, message: 'Failed to fetch settlements', type: 'danger' });
      setSettlements([]);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, [filters, currentPage, selectedOutletId]);

  useEffect(() => {
    if (filters.outletId) {
      setSelectedOutletId(Number(filters.outletId));
    }
  }, [filters.outletId]);

  // Group settlements by OrderNo
  const groupedSettlements = useMemo(() => {
    const grouped: Record<string, Settlement> = {};

    settlements.forEach((s) => {
      const key = s.OrderNo;
      if (!grouped[key]) {
        grouped[key] = {
          ...s,
          SettlementIDs: [s.SettlementID],
          PaymentTypes: [s.PaymentType],
          paymentBreakdown: { [s.PaymentType]: s.Amount },
        };
      } else {
        grouped[key].SettlementIDs!.push(s.SettlementID);
        grouped[key].PaymentTypes!.push(s.PaymentType);
        grouped[key].Amount += s.Amount;
        grouped[key].paymentBreakdown![s.PaymentType] =
          (grouped[key].paymentBreakdown![s.PaymentType] || 0) + s.Amount;
      }
    });

    return Object.values(grouped);
  }, [settlements]);

  // ── Edit Handlers ─────────────────────────────────────────────────
  const handleEdit = (group: Settlement) => {
    setEditing(group);
    setGrandTotal(group.Amount);

    const breakdown = group.paymentBreakdown || {};
    const modes = Object.keys(breakdown);

    if (modes.length > 1) {
      setIsMixedPayment(true);
      setSelectedPaymentModes(modes);
      setPaymentAmounts(Object.fromEntries(modes.map(m => [m, breakdown[m].toString()])));
    } else if (modes.length === 1) {
      setIsMixedPayment(false);
      setSelectedPaymentModes([modes[0]]);
      setPaymentAmounts({ [modes[0]]: group.Amount.toString() });
    } else {
      setIsMixedPayment(false);
      setSelectedPaymentModes([]);
      setPaymentAmounts({});
    }

    setShowSettlementModal(true);
  };

  const handlePaymentModeClick = (mode: PaymentMode) => {
    const modeName = mode.mode_name;

    if (isMixedPayment) {
      setSelectedPaymentModes((prev) => {
        if (prev.includes(modeName)) {
          const newAmounts = { ...paymentAmounts };
          delete newAmounts[modeName];
          setPaymentAmounts(newAmounts);
          return prev.filter(m => m !== modeName);
        } else {
          const currentPaid = Object.values(paymentAmounts).reduce(
            (sum, v) => sum + (parseFloat(v) || 0), 0
          );
          const remaining = Math.max(0, grandTotal - currentPaid);
          setPaymentAmounts(prev => ({ ...prev, [modeName]: remaining.toFixed(2) }));
          return [...prev, modeName];
        }
      });
    } else {
      // Single payment mode
      setSelectedPaymentModes([modeName]);
      setPaymentAmounts({ [modeName]: grandTotal.toFixed(2) });
    }
  };

  const handlePaymentAmountChange = (modeName: string, value: string) => {
    setPaymentAmounts(prev => ({ ...prev, [modeName]: value }));
  };

  // Calculate totals whenever payment amounts or grand total changes
  useEffect(() => {
    const paid = Object.values(paymentAmounts).reduce(
      (sum, v) => sum + (parseFloat(v) || 0), 0
    );
    setTotalPaid(paid);
    setSettlementBalance(grandTotal - paid);
  }, [paymentAmounts, grandTotal]);

  const handleUpdateSettlement = async () => {
    if (!editing) return;
    if (settlementBalance !== 0) {
      alert('Total paid amount must exactly match the grand total.');
      return;
    }

    if (!window.confirm('This will reverse old settlement records and create new ones. Continue?')) {
      return;
    }

    try {
      // 1. Delete old settlements
      for (const id of editing.SettlementIDs ?? []) {
        await axios.delete(`http://localhost:3001/api/settlements/${id}`, {
          data: { EditedBy: currentUser },
        });
      }

      // 2. Create new settlement records
      for (const [mode, amountStr] of Object.entries(paymentAmounts)) {
        const amount = parseFloat(amountStr);
        if (amount > 0) {
          await axios.post('http://localhost:3001/api/settlements', {
            OrderNo: editing.OrderNo,
            PaymentType: mode,
            Amount: amount,
            HotelID: editing.HotelID,
            EditedBy: currentUser,
          });
        }
      }

      setNotification({ show: true, message: 'Settlement updated successfully', type: 'success' });
      setShowSettlementModal(false);
      setEditing(null);
      fetchSettlements();
    } catch (err: any) {
      setNotification({
        show: true,
        message: err.response?.data?.message || 'Failed to update settlement',
        type: 'danger',
      });
    }
  };

  const handleDeleteSettlement = async (id: number) => {
    if (!window.confirm('Delete this settlement permanently?')) return;

    try {
      await axios.delete(`http://localhost:3001/api/settlements/${id}`, {
        data: { EditedBy: currentUser },
      });
      setNotification({ show: true, message: 'Settlement deleted successfully', type: 'success' });
      fetchSettlements();
    } catch (err: any) {
      setNotification({
        show: true,
        message: err.response?.data?.message || 'Failed to delete settlement',
        type: 'danger',
      });
    }
  };

  // ── UI ────────────────────────────────────────────────────────────
  return (
    <div className="container-fluid p-3" style={{ minHeight: '100vh' }}>
      <h3 className="mb-4">Edit Settlements</h3>

      <Alert
        show={notification.show}
        variant={notification.type}
        dismissible
        onClose={() => setNotification({ ...notification, show: false })}
      >
        {notification.message}
      </Alert>

      {/* Filters */}
      <div className="p-3 bg-light rounded mb-4 shadow-sm">
        <Row className="g-3">
          <Col md={3}>
            <Form.Control
              placeholder="Order No"
              value={filters.orderNo}
              onChange={e => setFilters({ ...filters, orderNo: e.target.value })}
            />
          </Col>
          <Col md={2}>
            <Form.Control
              type="date"
              value={filters.from}
              onChange={e => setFilters({ ...filters, from: e.target.value })}
            />
          </Col>
          <Col md={2}>
            <Form.Control
              type="date"
              value={filters.to}
              onChange={e => setFilters({ ...filters, to: e.target.value })}
            />
          </Col>
          <Col md={3}>
            <Form.Select
              value={filters.paymentType}
              onChange={e => setFilters({ ...filters, paymentType: e.target.value })}
            >
              <option value="">All Payment Types</option>
              <option>Cash</option>
              <option>Card</option>
              <option>UPI</option>
              <option>Wallet</option>
            </Form.Select>
          </Col>
          <Col md={2}>
            <Button variant="primary" onClick={fetchSettlements} className="w-100">
              Search
            </Button>
          </Col>
        </Row>
      </div>

      {/* Main Table */}
      <Table striped bordered hover responsive>
        <thead className="table-light">
          <tr>
            <th>ID(s)</th>
            <th>Order No</th>
            <th>Payment Type(s)</th>
            <th>Hotel ID</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {groupedSettlements.map(group => (
            <tr key={group.SettlementIDs?.join('-')} className={group.isSettled === 0 ? 'table-danger' : ''}>
              <td>{group.SettlementIDs?.join(', ')}</td>
              <td>{group.OrderNo}</td>
              <td>{group.PaymentTypes?.join(', ') || group.PaymentType}</td>
              <td>{group.HotelID}</td>
              <td>₹{group.Amount.toFixed(2)}</td>
              <td>{new Date(group.InsertDate.replace(' ', 'T') + 'Z').toLocaleString()}</td>
              <td>
                <Button size="sm" variant="primary" onClick={() => handleEdit(group)}>
                  Edit
                </Button>{' '}
                {role === 'Admin' && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeleteSettlement(group.SettlementIDs![0])}
                  >
                    Delete
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Edit Settlement Modal */}
      <Modal show={showSettlementModal} onHide={() => setShowSettlementModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Update Settlement – Order {editing?.OrderNo}</Modal.Title>
        </Modal.Header>

        <Modal.Body className="bg-light">
          {/* Total Due */}
          <div className="text-center mb-4 p-3 bg-white rounded shadow-sm">
            <h6 className="text-secondary mb-1">Total Amount Due</h6>
            <div className="display-5 fw-bold text-dark">₹{grandTotal.toFixed(2)}</div>
          </div>

          {/* Mixed Payment Toggle */}
          <div className="d-flex justify-content-end mb-3">
            <Form.Check
              type="switch"
              id="mixed-payment-switch"
              label="Mixed Payment"
              checked={isMixedPayment}
              onChange={e => {
                setIsMixedPayment(e.target.checked);
                if (!e.target.checked) {
                  setSelectedPaymentModes([]);
                  setPaymentAmounts({});
                }
              }}
            />
          </div>

          {/* Payment Modes Grid */}
          <Row xs={1} md={2} className="g-3 mb-4">
            {outletPaymentModes.map(mode => (
              <Col key={mode.id}>
                <Card
                  className={`text-center h-100 shadow-sm cursor-pointer ${
                    selectedPaymentModes.includes(mode.mode_name)
                      ? 'border border-primary bg-primary bg-opacity-10'
                      : ''
                  }`}
                  onClick={() => handlePaymentModeClick(mode)}
                >
                  <Card.Body>
                    <Card.Title className="mb-2">{mode.mode_name}</Card.Title>

                    {selectedPaymentModes.includes(mode.mode_name) && (
                      isMixedPayment ? (
                        <Form.Control
                          type="number"
                          step="0.01"
                          min="0"
                          value={paymentAmounts[mode.mode_name] ?? ''}
                          onChange={e => handlePaymentAmountChange(mode.mode_name, e.target.value)}
                          onClick={e => e.stopPropagation()}
                          className="mt-2 text-center"
                        />
                      ) : (
                        <div className="mt-2 fw-bold text-primary">
                          ₹{parseFloat(paymentAmounts[mode.mode_name] ?? '0').toFixed(2)}
                        </div>
                      )
                    )}
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Summary */}
          <div className="p-3 bg-white rounded shadow-sm">
            <div className="d-flex justify-content-between fw-bold fs-5 mb-2">
              <div>Total Paid: <span className="text-primary">{totalPaid.toFixed(2)}</span></div>
              <div>
                Balance:{' '}
                <span className={settlementBalance === 0 ? 'text-success' : 'text-danger'}>
                  {settlementBalance.toFixed(2)}
                </span>
              </div>
            </div>

            {settlementBalance !== 0 && totalPaid > 0 && (
              <div className="text-danger text-center small mt-2">
                Total paid amount must exactly match the grand total
              </div>
            )}

            {settlementBalance === 0 && totalPaid > 0 && (
              <div className="text-success text-center small mt-2">
                ✓ Amount matches – ready to update
              </div>
            )}
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSettlementModal(false)}>
            Cancel
          </Button>
          <Button
            variant="success"
            onClick={handleUpdateSettlement}
            disabled={settlementBalance !== 0 || totalPaid <= 0}
          >
            Update Settlement
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default EditSettlementPage;