import React, { useEffect, useState, useCallback } from 'react';
import {
  Button,
  Table,
  Form,
  Row,
  Col,
  Alert,
  Spinner
  // Badge,
} from 'react-bootstrap';
import { useAuthContext } from '@/common';
import LdgSettlementService, { LdgSettlement } from '@/common/hotel/ldgsettlement';
import PaginationComponent from '@/components/Common/PaginationComponent';
import CheckoutBillModal from '@/views/pages/hotel-master/HotelBookingPanel/CheckoutBillModal';
import F8PasswordModal from '@/components/F8PasswordModal';
import SettlementModal from './SettelmentModel';
import OutletPaymentModeService from '@/common/api/outletpaymentmode';

// ==================== INTERFACES ====================

// PaymentMode interface matching SettlementModal expectations
interface PaymentMode {
  id: number;
  paymenttypeid: number;
  mode_name: string;
  outletid: number;  // Required, not optional
  sequence?: number;
}

// Helper function
const toNumber = (value: any, defaultValue: number = 0): number => {
  if (value === null || value === undefined) return defaultValue;
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

// ==================== COMPONENT ====================

const EditSettlementPage: React.FC = () => {
  const { user } = useAuthContext();
  const currDate = user?.currDate || '';

  // ── State ────────────────────────────────────────────────────────
  const [settlements, setSettlements] = useState<LdgSettlement[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filters
  const [filters, setFilters] = useState({
    hotelId: user?.hotel_id || '',
    outletId: user?.outletid || '',
    guestName: '',
    roomNo: '',
    ldgBillNo: '',
    fromDate: currDate,
    toDate: currDate,
    paymentType: '',
    isSettled: '1'
  });

  // ── Notification ─────────────────────────────────────────────────
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'danger';
  }>({
    show: false,
    message: '',
    type: 'success'
  });

  // ── Bill Modal ──────────────────────────────────────────────────
  const [showBillModal, setShowBillModal] = useState(false);
  const [selectedCheckoutId, setSelectedCheckoutId] = useState<number | null>(null);
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null); // 🔥 FIX: needed so CheckoutBillModal can load print settings

  // ── Edit Settlement Modal ──────────────────────────────────────
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [editingSettlement, setEditingSettlement] = useState<LdgSettlement | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [outletPaymentModes, setOutletPaymentModes] = useState<PaymentMode[]>([]);
  const [initialSelectedModes, setInitialSelectedModes] = useState<string[]>([]);
  const [initialPaymentAmounts, setInitialPaymentAmounts] = useState<Record<string, string>>({});
  const [initialIsMixed, setInitialIsMixed] = useState(false);
  const [initialTip, setInitialTip] = useState(0);
  const [initialCashReceived, setInitialCashReceived] = useState(0);

  // ── F8 Password Modal ──────────────────────────────────────────
  const [showF8Modal, setShowF8Modal] = useState(false);
  // 🔥 FIX: pendingPrintData now also carries hotelId so it survives the F8 flow
  const [pendingPrintData, setPendingPrintData] = useState<{
    checkoutId: number;
    hotelId?: number | null;
  } | null>(null);
  const [f8Error, setF8Error] = useState('');
  const [f8Loading, setF8Loading] = useState(false);

  // ── Helper: Check if date is backdated ────────────────────────
  const isBackdated = useCallback((billDate: string | null | undefined): boolean => {
    if (!billDate || !currDate) return false;
    
    const billDay = new Date(billDate);
    const currDay = new Date(currDate);
    
    const billOnly = new Date(
      billDay.getFullYear(),
      billDay.getMonth(),
      billDay.getDate()
    ).getTime();
    const currOnly = new Date(
      currDay.getFullYear(),
      currDay.getMonth(),
      currDay.getDate()
    ).getTime();
    
    return billOnly < currOnly;
  }, [currDate]);

  // ── Fetch Payment Modes ────────────────────────────────────────
  useEffect(() => {
    const fetchPaymentModes = async () => {
      const outletId = filters.outletId || user?.outletid;
      if (!outletId) {
        setOutletPaymentModes([]);
        return;
      }

      try {
        const response = await OutletPaymentModeService.list({
          outletid: outletId.toString()
        });
        let data = response.data || [];
        data = data.sort((a: any, b: any) => {
          if (a.sequence && b.sequence) return a.sequence - b.sequence;
          return (a.id || 0) - (b.id || 0);
        });
        // Map to ensure outletid is always a number (not undefined)
        const mappedData: PaymentMode[] = data.map((item: any) => ({
          id: item.id || 0,
          paymenttypeid: item.paymenttypeid || 0,
          mode_name: item.mode_name || '',
          outletid: Number(outletId),  // Ensure outletid is always a number
          sequence: item.sequence || 0
        }));
        setOutletPaymentModes(mappedData);
      } catch (err) {
        setOutletPaymentModes([]);
      }
    };
    fetchPaymentModes();
  }, [filters.outletId, user?.outletid]);

  // ── Fetch Settlements ──────────────────────────────────────────
  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {
        ...filters,
        hotelId: filters.hotelId || user?.hotel_id,
        outletId: filters.outletId || user?.outletid,
        limit: pageSize,
        offset: (currentPage - 1) * pageSize
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });

      const response = await LdgSettlementService.list(params);
      
      if (response.success) {
        setSettlements(response.data || []);
        // Use the total from response or calculate from data length
        const total = (response as any).pagination?.total || response.data?.length || 0;
        setTotalItems(total);
      } else {
        setNotification({
          show: true,
          message: response.message || 'Failed to fetch settlements',
          type: 'danger'
        });
        setSettlements([]);
      }
    } catch (err: any) {
      setNotification({
        show: true,
        message: err?.message || 'Failed to fetch settlements',
        type: 'danger'
      });
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  }, [filters, user?.hotel_id, user?.outletid, currentPage, pageSize]);

  // Sync date filters with business date
  useEffect(() => {
    if (currDate) {
      setFilters(prev => ({
        ...prev,
        fromDate: currDate,
        toDate: currDate,
        hotelId: user?.hotel_id || '',
        outletId: user?.outletid || ''
      }));
    }
  }, [currDate, user?.hotel_id, user?.outletid]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  // ── Pagination ──────────────────────────────────────────────────
  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  // ── Handle Print Bill ──────────────────────────────────────────
 const handlePrintBill = (group: LdgSettlement) => {
  const checkoutId = group.checkout_id;
  // 🔥 FIX: resolve hotelId from the settlement row (fallback to filters/user)
  // so CheckoutBillModal can fetch its print settings correctly.
  const hotelId = group.hotelid || Number(filters.hotelId) || user?.hotel_id || null;

  console.log("🖨️ Print Bill Clicked");
  console.log("📌 Settlement Row:", group);
  console.log("📌 Checkout ID:", checkoutId);
  console.log("📌 Hotel ID:", hotelId);
  console.log("📌 Bill No:", group.ldg_bill_no);
  console.log("📌 Checkin ID:", group.checkinid);
  console.log("📌 Checkout Date:", group.checkout_date);
  console.log("📌 Is Backdated:", isBackdated(group.checkout_date || group.InsertDate));

  // Check if backdated
  if (isBackdated(group.checkout_date || group.InsertDate)) {
    console.log("🔐 Opening F8 Password Modal");
    setPendingPrintData({ checkoutId, hotelId }); // 🔥 FIX: carry hotelId through F8 flow
    setF8Error('');
    setShowF8Modal(true);
  } else {
    console.log("📄 Opening CheckoutBillModal with checkoutId:", checkoutId, "hotelId:", hotelId);
    openBillModal(checkoutId, hotelId);
  }
};

  // 🔥 FIX: accept checkoutId AND hotelId
  const openBillModal = (checkoutId: number, hotelId?: number | null) => {
    setSelectedCheckoutId(checkoutId);
    setSelectedHotelId(hotelId ?? null); // 🔥 FIX
    setShowBillModal(true);
  };

  const handleF8PasswordSubmit = async (password: string) => {
    if (!pendingPrintData) return;

    setF8Loading(true);
    setF8Error('');

    try {
      // Verify password (replace with actual API call if needed)
      // For demo, just proceed
      openBillModal(pendingPrintData.checkoutId, pendingPrintData.hotelId); // 🔥 FIX: pass hotelId along
      setShowF8Modal(false);
      setPendingPrintData(null);
    } catch (error: any) {
      setF8Error(error?.message || 'Invalid password. Please try again.');
    } finally {
      setF8Loading(false);
    }
  };

  // ── Handle Edit Settlement ──────────────────────────────────────
  const handleEdit = (group: LdgSettlement) => {
    setEditingSettlement(group);
    
    const breakdown = group.paymentBreakdown || {};
    const modes = Object.keys(breakdown);
    
    if (modes.length > 1) {
      setInitialIsMixed(true);
      setInitialSelectedModes(modes);
      setInitialPaymentAmounts(
        Object.fromEntries(modes.map(m => [m, breakdown[m].toString()]))
      );
    } else if (modes.length === 1) {
      setInitialIsMixed(false);
      setInitialSelectedModes([modes[0]]);
      setInitialPaymentAmounts({ [modes[0]]: group.Amount.toString() });
    } else {
      setInitialIsMixed(false);
      setInitialSelectedModes([]);
      setInitialPaymentAmounts({});
    }
    
    setInitialTip(toNumber(group.TipAmount));
    setInitialCashReceived(toNumber(group.Receive));
    
    setShowSettlementModal(true);
  };

  const handleUpdateSettlement = async (newSettlements: any[], tip?: number) => {
    if (!editingSettlement) return;

    setEditLoading(true);

    try {
      await LdgSettlementService.replace({
        checkoutId: editingSettlement.checkout_id,
        checkinId: editingSettlement.checkinid,
        newSettlements: newSettlements.filter(s => s.Amount > 0),
        HotelID: editingSettlement.hotelid,
        outletId: editingSettlement.outletid,
        updated_by_id: user?.id ? Number(user.id) : null,
        checkout_date: editingSettlement.checkout_date,
        ldg_bill_no: editingSettlement.ldg_bill_no || editingSettlement.bill_no
      });

      setNotification({
        show: true,
        message: 'Settlement updated successfully',
        type: 'success'
      });

      setShowSettlementModal(false);
      setEditingSettlement(null);
      fetchSettlements();
    } catch (err: any) {
      setNotification({
        show: true,
        message: err.response?.data?.message || 'Failed to update settlement',
        type: 'danger'
      });
    } finally {
      setEditLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────

  return (
    <>
      <div className="container-fluid p-3" style={{ minHeight: '100vh' }}>
        <h3 className="mb-4">🏨 LDG Settlements</h3>

        {/* Notification */}
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
            <Col md={2}>
              <Form.Control
                type="text"
                placeholder="Guest Name"
                value={filters.guestName}
                onChange={e => setFilters({ ...filters, guestName: e.target.value })}
              />
            </Col>
            <Col md={2}>
              <Form.Control
                type="text"
                placeholder="Room No"
                value={filters.roomNo}
                onChange={e => setFilters({ ...filters, roomNo: e.target.value })}
              />
            </Col>
            <Col md={2}>
              <Form.Control
                type="text"
                placeholder="Bill No"
                value={filters.ldgBillNo}
                onChange={e => setFilters({ ...filters, ldgBillNo: e.target.value })}
              />
            </Col>
            <Col md={2}>
              <Form.Control
                type="date"
                value={filters.fromDate}
                onChange={e => setFilters({ ...filters, fromDate: e.target.value })}
              />
            </Col>
            <Col md={2}>
              <Form.Control
                type="date"
                value={filters.toDate}
                onChange={e => setFilters({ ...filters, toDate: e.target.value })}
              />
            </Col>
            <Col md={2}>
              <Form.Select
                value={filters.paymentType}
                onChange={e => setFilters({ ...filters, paymentType: e.target.value })}
              >
                <option value="">All Payments</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
                <option value="Wallet">Wallet</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Button variant="primary" onClick={fetchSettlements} className="w-100">
                <i className="fi fi-rr-search me-1"></i> Search
              </Button>
            </Col>
          </Row>
        </div>

        {/* Table */}
        <div className="table-responsive" style={{ fontSize: '12px' }}>
          <Table striped bordered hover responsive size="sm">
            <thead className="table-light">
              <tr style={{ fontSize: '12px' }}>
                <th style={{ width: '3%' }}>ID</th>
                <th style={{ width: '6%' }}>Date</th>
                <th style={{ width: '7%' }}>Bill No</th>
                <th style={{ width: '8%' }}>Guest</th>
                <th style={{ width: '6%' }}>Room(s)</th>
                <th style={{ width: '4%' }}>Nights</th>
                <th style={{ width: '8%' }}>Payment</th>
                <th style={{ width: '6%' }}>Total Amt</th>
                <th style={{ width: '6%' }}>Settled</th>
                <th style={{ width: '6%' }}>Receive</th>
                <th style={{ width: '6%' }}>Refund</th>
                <th style={{ width: '4%' }}>Tip</th>
                <th style={{ width: '8%' }}>Actions</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '12px' }}>
              {loading ? (
                <tr>
                  <td colSpan={13} className="text-center py-4">
                    <Spinner animation="border" variant="primary" size="sm" className="me-2" />
                    Loading settlements...
                  </td>
                </tr>
              ) : settlements.length === 0 ? (
                <tr>
                  <td colSpan={13} className="text-center py-4 text-muted">
                    No settlements found
                  </td>
                </tr>
              ) : (
                settlements.map((group, index) => {
                  const isBackdatedBill = isBackdated(
                    group.checkout_date || group.InsertDate
                  );
                  const totalAmount = toNumber(group.total_amount);
                  const settledAmount = toNumber(group.Amount);
                  const tipAmount = toNumber(group.TipAmount);
                  const receiveAmount = toNumber(group.Receive);
                  const refundAmount = toNumber(group.Refund);
                  const roomDisplay = group.rooms?.join(', ') || group.display_room || 'N/A';

                  return (
                    <tr key={group.SettlementIDs?.join('-') || index}>
                      <td style={{ fontSize: '11px' }}>
                        {group.SettlementIDs?.join(', ') || group.SettlementID}
                      </td>
                      <td style={{ fontSize: '11px' }}>
                        {group.InsertDate
                          ? new Date(group.InsertDate).toLocaleDateString('en-GB')
                          : '-'}
                      </td>
                      <td>
                        <strong style={{ fontSize: '12px' }}>
                          {group.display_bill_no || group.ldg_bill_no || group.bill_no || '-'}
                        </strong>
                        {group.reg_no && (
                          <>
                            <br />
                            <small style={{ fontSize: '10px' }} className="text-muted">
                              Reg: {group.reg_no}
                            </small>
                          </>
                        )}
                      </td>
                      <td>
                        <strong style={{ fontSize: '12px' }}>
                          {group.guest_name || 'Guest'}
                        </strong>
                        {group.mobile && (
                          <>
                            <br />
                            <small style={{ fontSize: '10px' }} className="text-muted">
                              {group.mobile}
                            </small>
                          </>
                        )}
                      </td>
                      <td style={{ fontSize: '11px' }}>{roomDisplay}</td>
                      <td className="text-center" style={{ fontSize: '11px' }}>
                        {group.total_nights || 1}
                      </td>
                      <td>
                        {Object.entries(group.paymentBreakdown || {}).map(
                          ([type, amount]) => (
                            <div key={type} style={{ fontSize: '11px' }}>
                              {type}: ₹{toNumber(amount).toFixed(2)}
                            </div>
                          )
                        )}
                      </td>
                      <td className="fw-bold" style={{ fontSize: '12px', backgroundColor: '#f8f9fa' }}>
                        ₹{totalAmount.toFixed(2)}
                      </td>
                      <td className="fw-bold" style={{ fontSize: '12px' }}>
                        ₹{settledAmount.toFixed(2)}
                      </td>
                      <td className="fw-bold" style={{ fontSize: '12px' }}>
                        ₹{receiveAmount.toFixed(2)}
                      </td>
                      <td className="fw-bold" style={{ fontSize: '12px', color: '#d9534f' }}>
                        ₹{refundAmount.toFixed(2)}
                      </td>
                      <td className="text-success" style={{ fontSize: '11px' }}>
                        {tipAmount > 0 ? `₹${tipAmount.toFixed(2)}` : '-'}
                      </td>
                      <td>
                        <div className="d-flex gap-1 flex-wrap">
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleEdit(group)}
                            disabled={isBackdatedBill}
                            title={isBackdatedBill ? 'Cannot edit backdated bills' : 'Edit'}
                            className="px-2 py-1"
                            style={{ fontSize: '11px' }}
                          >
                            <i className="fi fi-rr-edit"></i>
                          </Button>
                          <Button
                            size="sm"
                            variant="dark"
                            onClick={() => handlePrintBill(group)}
                            title="Print Bill"
                            className="px-2 py-1"
                            style={{ fontSize: '11px' }}
                          >
                            <i className="fi fi-rr-print"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </Table>
        </div>

        {/* Pagination */}
        <PaginationComponent
          totalItems={totalItems}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      </div>

      {/* Edit Settlement Modal */}
      <SettlementModal
        show={showSettlementModal}
        onHide={() => {
          setShowSettlementModal(false);
          setEditingSettlement(null);
        }}
        onSettle={handleUpdateSettlement}
        grandTotal={toNumber(editingSettlement?.total_amount || 0)}
        subtotal={toNumber(editingSettlement?.total_amount || 0)}
        loading={editLoading}
        outletPaymentModes={outletPaymentModes}
        selectedOutletId={editingSettlement?.outletid || Number(filters.outletId) || null}
        initialSelectedModes={initialSelectedModes}
        initialPaymentAmounts={initialPaymentAmounts}
        initialIsMixed={initialIsMixed}
        initialTip={initialTip}
        initialCashReceived={initialCashReceived}
        table_name={editingSettlement?.room_name || null}
        initialCustomerName={editingSettlement?.guest_name || ''}
        initialMobile={editingSettlement?.mobile || ''}
        initialCustomerId={editingSettlement?.guest_id || null}
      />

      {/* F8 Password Modal */}
      <F8PasswordModal
        show={showF8Modal}
        onHide={() => {
          setShowF8Modal(false);
          setPendingPrintData(null);
          setF8Error('');
        }}
        onSubmit={handleF8PasswordSubmit}
        error={f8Error}
        loading={f8Loading}
        txnId={pendingPrintData?.checkoutId?.toString()} // we can pass checkoutId as transaction id
        title="F8 Action - Password Required"
        description="This bill has been backdated. Please enter your password to proceed with printing."
      />

      {/* Checkout Bill Modal – 🔥 FIX: hotelId is now passed so print settings (header/guest/booking sections) load correctly */}
      {selectedCheckoutId && (
        <CheckoutBillModal
          show={showBillModal}
          onHide={() => {
            setShowBillModal(false);
            setSelectedCheckoutId(null);
            setSelectedHotelId(null); // 🔥 FIX
          }}
          checkoutId={selectedCheckoutId}
          hotelId={selectedHotelId ?? undefined} // 🔥 FIX: this was missing and caused printSettings to stay null
        />
      )}
    </>
  );
};

export default EditSettlementPage;