// EditSettlementPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  Button,
  Table,
  Form,
  Row,
  Col,
  Alert,
} from 'react-bootstrap';
import axios from 'axios';
import { useAuthContext } from '@/common';
import SettlementModal from './SettelmentModel';

interface Settlement {
  SettlementID: number;
  OrderNo: string;
  PaymentType: string;
  Amount: number;
  HotelID: string;
  InsertDate: string;
  isSettled: number;
  outletPaymentModes: PaymentMode[];
  SettlementIDs?: number[];          // when grouped
  PaymentTypes?: string[];           // when grouped
  paymentBreakdown?: Record<string, number>;
}

interface PaymentMode {
  id: number;
  paymenttypeid: number;
  mode_name: string;
}

const EditSettlementPage: React.FC = () => {
  const { user } = useAuthContext();
  const role = user?.role || '';
  const currentUser = user;

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
  const [loading, setLoading] = useState(false);
  const [initialSelectedModes, setInitialSelectedModes] = useState<string[]>([]);
  const [initialPaymentAmounts, setInitialPaymentAmounts] = useState<Record<string, string>>({});
  const [initialIsMixed, setInitialIsMixed] = useState(false);

  // ── Payment Modes ─────────────────────────────────────────────────
  const [outletPaymentModes, setOutletPaymentModes] = useState<any[]>([]);

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
      setInitialIsMixed(true);
      setInitialSelectedModes(modes);
      setInitialPaymentAmounts(Object.fromEntries(modes.map(m => [m, breakdown[m].toString()])));
    } else if (modes.length === 1) {
      setInitialIsMixed(false);
      setInitialSelectedModes([modes[0]]);
      setInitialPaymentAmounts({ [modes[0]]: group.Amount.toString() });
    } else {
      setInitialIsMixed(false);
      setInitialSelectedModes([]);
      setInitialPaymentAmounts({});
    }

    setShowSettlementModal(true);
  };

  const handleUpdateSettlement = async (settlements: any[], tip?: number) => {
    if (!editing) return;

    setLoading(true);
    try {
      // 1. Delete old settlements
      for (const id of editing.SettlementIDs ?? []) {
        await axios.delete(`http://localhost:3001/api/settlements/${id}`, {
          data: { EditedBy: currentUser },
        });
      }

      // 2. Create new settlement records
      for (const settlement of settlements) {
        const amount = settlement.Amount;
        if (amount > 0) {
          await axios.post('http://localhost:3001/api/settlements', {
            OrderNo: editing.OrderNo,
            PaymentType: settlement.PaymentType,
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
    } finally {
      setLoading(false);
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
      <SettlementModal
        show={showSettlementModal}
        onHide={() => setShowSettlementModal(false)}
        onSettle={handleUpdateSettlement}
        grandTotal={grandTotal}
        subtotal={grandTotal}
        loading={loading}
        outletPaymentModes={outletPaymentModes}
        selectedOutletId={selectedOutletId}
        initialSelectedModes={initialSelectedModes}
        initialPaymentAmounts={initialPaymentAmounts}
        initialIsMixed={initialIsMixed}
        initialTip={0}
      />
    </div>
  );
};

export default EditSettlementPage;