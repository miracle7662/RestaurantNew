// EditSettlementPage.tsx
import React, { useEffect, useState, useMemo } from 'react';
import {
  Button,
  Table,
  Form,
  Row,
  Col,
  Alert,
  Pagination,
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

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
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
      const params = { ...filters, outletId: selectedOutletId, page: currentPage, limit: pageSize };
      const res = await axios.get('http://localhost:3001/api/settlements', { params });

      const data = res.data?.data ?? res.data;
      const settlementsData = Array.isArray(data.settlements) ? data.settlements : data;
      const total = data.total ?? 0;

      setSettlements(settlementsData);
      setTotalItems(total);
      setTotalPages(Math.ceil(total / pageSize));
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

const handleUpdateSettlement = async (newSettlements: any[], tip?: number) => {
  if (!editing) return;

  setLoading(true);

  try {
    // Always use replace strategy: delete all for OrderNo and insert new
    await axios.post(
      `http://localhost:3001/api/settlements/replace`,
      {
        OrderNo: editing.OrderNo,
        newSettlements: newSettlements.filter(s => s.Amount > 0),
        HotelID: editing.HotelID,
        EditedBy: currentUser,
      }
    );

    setNotification({
      show: true,
      message: 'Settlement updated successfully',
      type: 'success',
    });

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





  // const handleDeleteSettlement = async (id: number) => {
  //   if (!window.confirm('Delete this settlement permanently?')) return;

  //   try {
  //     await axios.delete(`http://localhost:3001/api/settlements/${id}`, {
  //       data: { EditedBy: currentUser },
  //     });
  //     setNotification({ show: true, message: 'Settlement deleted successfully', type: 'success' });
  //     fetchSettlements();
  //   } catch (err: any) {
  //     setNotification({
  //       show: true,
  //       message: err.response?.data?.message || 'Failed to delete settlement',
  //       type: 'danger',
  //     });
  //   }
  // };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(parseInt(e.target.value));
    setCurrentPage(1); // Reset to first page when page size changes
  };

  // Generate pagination items
  const getPaginationItems = () => {
    const items = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item
          key={i}
          active={i === currentPage}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }
    return items;
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
            <th>Payment Breakdown</th>
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
              <td>
  {Object.entries(group.paymentBreakdown || {}).map(
    ([type, amount]) => (
      <div key={type}>
        {type}: ₹{amount.toFixed(2)}
      </div>
    )
  )}
</td>

              <td>{group.HotelID}</td>
              <td>₹{group.Amount.toFixed(2)}</td>
              <td>{new Date(group.InsertDate.replace(' ', 'T') + 'Z').toLocaleString()}</td>
              <td>
                <Button size="sm" variant="primary" onClick={() => handleEdit(group)}>
                  Edit
                </Button>{' '}
                {/* {role === 'Admin' && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDeleteSettlement(group.SettlementIDs![0])}
                  >
                    Delete
                  </Button>
                )} */}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Pagination */}
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div>
          <Form.Select
            value={pageSize}
            onChange={handlePageSizeChange}
            style={{ width: '100px', display: 'inline-block', marginRight: '10px' }}
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </Form.Select>
          <span className="text-muted">
            Showing {groupedSettlements.length} of {totalItems} entries
          </span>
        </div>
        <Pagination>
          <Pagination.Prev
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          />
          {getPaginationItems()}
          <Pagination.Next
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          />
        </Pagination>
      </div>

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