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
import { useAuthContext } from '@/common';
import SettlementModal from './SettelmentModel';
import OutletPaymentModeService from '@/common/api/outletpaymentmode';
import SettlementService from '@/common/api/settlements';
import PaginationComponent from '@/components/Common/PaginationComponent';

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
        const response = await OutletPaymentModeService.list({ outletid: selectedOutletId?.toString() || ''});
        const data = response;
        if (!Array.isArray(data)) {
          throw new Error('Expected an array of payment modes');
        }
        setOutletPaymentModes(data);
      } catch (err) {
        console.error('Failed to load payment modes:', err);
        setOutletPaymentModes([]);
      }
    };
    fetchPaymentModes();
  }, []);

  // Fetch settlements list - using proper API response format like other pages
  const fetchSettlements = async () => {
    try {
      const params: any = { ...filters };
      if (selectedOutletId !== null) {
        params.outletId = selectedOutletId;
      }
      const res = await SettlementService.list(params);

      // Check for success response - matching other pages API response format
      if (res.success) {
        const data = res.data;
        const settlementsData = Array.isArray(data) ? data : [];
        // Cast to local Settlement interface type
        setSettlements(settlementsData as unknown as Settlement[]);
      } else {
        setNotification({ show: true, message: res.message || 'Failed to fetch settlements', type: 'danger' });
        setSettlements([]);
      }
    } catch (err) {
      console.error(err);
      setNotification({ show: true, message: 'Failed to fetch settlements', type: 'danger' });
      setSettlements([]);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, [filters, selectedOutletId]);

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

  // Paginate grouped settlements
  const paginatedGroupedSettlements = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return groupedSettlements.slice(startIndex, endIndex);
  }, [groupedSettlements, currentPage, pageSize]);

  // Set totalItems based on grouped settlements
  useEffect(() => {
    setTotalItems(paginatedGroupedSettlements.length);
  }, [groupedSettlements]);

  // ── Pagination Handlers ────────────────────────────────────────────
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when page size changes
  };

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
      await SettlementService.replace({
        OrderNo: editing.OrderNo,
        newSettlements: newSettlements.filter(s => s.Amount > 0),
        HotelID: editing.HotelID,
        EditedBy: currentUser,
        InsertDate: user?.currDate,
      });

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
            <Button variant="primary" onClick={() => fetchSettlements()} className="w-100">
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
                    <div key={type} className="small">
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
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      {/* Pagination */}
      <PaginationComponent
        totalItems={totalItems}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />

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
