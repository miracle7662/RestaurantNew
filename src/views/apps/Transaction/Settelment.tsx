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
import BillPreviewPrint from '@/views/apps/PrintReport/BillPrint'; // Import the BillPreviewPrint component
import { Spinner } from 'react-bootstrap';

interface Settlement {
  TaxNo?: string;
  SettlementID: number;
  OrderNo: string;
  table_name?: string;
  PaymentType: string;
  Amount: number;
  TipAmount?: number;
  Receive?: number;
  Refund?: number;
  CustomerName?: string;
  MobileNo?: string;
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

// Add this interface for bill items if needed
interface BillItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  isBilled: number;
  isNCKOT: number;
  NCName: string;
  NCPurpose: string;
  table_name?: string;
  isNew?: boolean;
  alternativeItem?: string;
  modifier?: string[];
  item_no?: number;
  originalQty?: number;
  kotNo?: number;
  txnDetailId?: number;
  isReverse?: boolean;
  revQty?: number;
  hsn?: string;
  note?: string;
  variantId?: number;
  variantName?: string;
}

const EditSettlementPage: React.FC = () => {
const { user } = useAuthContext();
  const currentUser = user;
  const currDate = user?.currDate || '';

  // ── Main States ───────────────────────────────────────────────────
  const [settlements, setSettlements] = useState<Settlement[]>([]);
const [filters, setFilters] = useState({
    orderNo: '',
    hotelId: '',
    outletId: '',
    from: currDate,
    to: currDate,
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
  // FIXED: Track initial tip and cash received for editing
  const [initialTip, setInitialTip] = useState(0);
  const [initialCashReceived, setInitialCashReceived] = useState(0);

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

  // ── Bill Preview Print States ────────────────────────────────────
  const [showBillPreview, setShowBillPreview] = useState(false);
  const [selectedBillData, setSelectedBillData] = useState<any>(null);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [billLoading, setBillLoading] = useState(false);

  // Fetch all available payment modes - only when selectedOutletId is valid
  useEffect(() => {
    const fetchPaymentModes = async () => {
      // Only fetch if we have a valid outlet ID
      if (!selectedOutletId || selectedOutletId === null) {
        setOutletPaymentModes([]);
        return;
      }
      
      try {
        const response = await OutletPaymentModeService.list({ outletid: selectedOutletId.toString() });
        // Handle ApiResponse format - response.data contains the array
        const data = response.data;
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
  }, [selectedOutletId]);

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

  // Sync date filters with business date
  useEffect(() => {
    if (currDate) {
      setFilters(prev => ({
        ...prev,
        from: currDate,
        to: currDate,
      }));
    }
  }, [currDate]);

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

    // FIXED: Pass actual tip and received amounts from fetched data
    setInitialTip(group.TipAmount || 0);
    setInitialCashReceived(group.Receive || 0);

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
        TipAmount: tip || 0,
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

  // ── Print Bill Handlers ───────────────────────────────────────────
  const handlePrintDuplicateBill = async (group: Settlement) => {
    setBillLoading(true);
    setSelectedBillData(group);
    
    try {
      // Fetch the order items for this OrderNo
      // You'll need to implement this API call based on your backend
      const orderDetails = await fetchOrderDetails(group.OrderNo);
      
      // Prepare bill items from the order details
      const items: BillItem[] = orderDetails.items || [];
      setBillItems(items);
      
      setShowBillPreview(true);
    } catch (error) {
      console.error('Failed to fetch bill details:', error);
      setNotification({
        show: true,
        message: 'Failed to fetch bill details for printing',
        type: 'danger',
      });
    } finally {
      setBillLoading(false);
    }
  };

  // Helper function to fetch order details
  const fetchOrderDetails = async (orderNo: string) => {
    // Replace this with your actual API call to fetch order items
    try {
      // Example API call - you need to implement this based on your backend
      // const response = await OrderService.getOrderDetails(orderNo);
      // return response.data;
      
      // For now, return dummy data structure
      return {
        items: [],
        customerName: selectedBillData?.CustomerName,
        mobileNumber: selectedBillData?.MobileNo,
        tableName: selectedBillData?.table_name,
      };
    } catch (error) {
      throw error;
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
            <th>Tax No / Order No</th>
            <th>Table</th>
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
              <td>
                <strong>{group.TaxNo || group.OrderNo}</strong>
                <br/>
                <small className="text-muted">{group.TaxNo ? group.OrderNo : ''}</small>
              </td>
              <td>{group.table_name || 'N/A'}</td>
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
              <td>
                {group.InsertDate
                  ? new Date(group.InsertDate).toLocaleString('en-IN')
                  : '-'}
              </td>
              <td>
                <div className="d-flex gap-2">
                  <Button 
                    size="sm" 
                    variant="primary" 
                    onClick={() => handleEdit(group)}
                  >
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="info" 
                    onClick={() => handlePrintDuplicateBill(group)}
                    disabled={billLoading}
                  >
                    {billLoading && selectedBillData?.OrderNo === group.OrderNo ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-1" />
                        Loading...
                      </>
                    ) : (
                      'Print Bill'
                    )}
                  </Button>
                </div>
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
        initialTip={initialTip}
        initialCashReceived={initialCashReceived}
        table_name={editing?.table_name || null}
      />

      {/* Bill Preview Print Modal */}
      {showBillPreview && selectedBillData && (
        <BillPreviewPrint
          show={showBillPreview}
          onHide={() => {
            setShowBillPreview(false);
            setSelectedBillData(null);
            setBillItems([]);
          }}
          formData={user?.outletSettings || {}}
          user={user}
          items={billItems}
          selectedWaiter={user?.name}
          currentKOTNos={[]}
          currentKOTNo={null}
          orderNo={selectedBillData.OrderNo}
          selectedTable={selectedBillData.table_name}
          activeTab="Dine-in" // or determine from order type
          customerName={selectedBillData.CustomerName}
          mobileNumber={selectedBillData.MobileNo}
          currentTxnId={selectedBillData.OrderNo}
          taxCalc={{
            subtotal: selectedBillData.Amount || 0,
            cgstAmt: 0,
            sgstAmt: 0,
            igstAmt: 0,
            grandTotal: selectedBillData.Amount || 0,
          }}
          taxRates={{ cgst: 0, sgst: 0, igst: 0 }}
          discount={0}
          selectedPaymentModes={selectedBillData.PaymentTypes || []}
          selectedOutletId={selectedOutletId}
          restaurantName={user?.hotel_name}
          outletName={user?.outlet_name}
          billDate={selectedBillData.InsertDate}
        />
      )}
    </div>
  );
};

export default EditSettlementPage;