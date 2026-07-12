// SettlementModal.tsx (FIXED VERSION)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Modal, Row, Col, Form, Button, Card } from 'react-bootstrap';
import toast from 'react-hot-toast';

interface PaymentMode {
  id: number;
  mode_name: string;
  outletid: number;
}

interface Settlement {
  table_name?: string;
  PaymentType: string;
  Amount: number;
  received_amount: number;
  refund_amount: number;
  TipAmount: number;
  customerid?: number | null;
  mobile?: string;
  customerName?: string;
}

interface SettlementModalProps {
  show: boolean;
  initialCustomerName?: string;
  initialMobile?: string;
  initialCustomerId?: number | null;

  onHide: () => void;
  onSettle: (settlements: Settlement[], tip?: number) => Promise<void>;
  grandTotal: number;
  subtotal: number;
  loading: boolean;
  outletPaymentModes: PaymentMode[];
  selectedOutletId?: number | null;
  initialSelectedModes?: string[];
  initialPaymentAmounts?: { [key: string]: string };
  initialIsMixed?: boolean;
  initialTip?: number;
  initialCashReceived?: number;
  table_name?: string | null;
  // Hotel room booking specific
  guestName?: string;
  checked_out_rooms?: string;
  room_id?: number;
  totalPrice?: number;
}

const SettlementModal: React.FC<SettlementModalProps> = ({
  show,
  onHide,
  onSettle,
  grandTotal = 0,
  subtotal = 0,
  loading,
  outletPaymentModes = [],
  initialSelectedModes = [],
  initialPaymentAmounts = {},
  initialIsMixed = false,
  initialTip = 0,
  initialCashReceived = 0,
  table_name,
  initialMobile,
  initialCustomerName,
  initialCustomerId,
  selectedOutletId,
  guestName,
  checked_out_rooms,
  room_id,
  totalPrice,
}) => {
  const [isMixedPayment, setIsMixedPayment] = useState(initialIsMixed);
  const [selectedPaymentModes, setSelectedPaymentModes] = useState<string[]>(initialSelectedModes);
  const [paymentAmounts, setPaymentAmounts] = useState<{ [key: string]: string }>(initialPaymentAmounts);
  const [tip, setTip] = useState<number>(initialTip);
  const [activePaymentIndex, setActivePaymentIndex] = useState(0);

  // Single mode → keep only first payment method
  useEffect(() => {
    if (!isMixedPayment && selectedPaymentModes.length > 1) {
      const first = selectedPaymentModes[0];
      setSelectedPaymentModes([first]);
      setPaymentAmounts({ [first]: grandTotal.toFixed(2) });
    }
  }, [isMixedPayment, grandTotal, selectedPaymentModes]);

  const totalReceived = Object.values(paymentAmounts).reduce((sum, v) => sum + (Number(v) || 0), 0) + (tip || 0);
  const balance = grandTotal - totalReceived;
  const balanceDue = balance > 0 ? balance : 0;
  const [cashReceived, setCashReceived] = useState<number>(0);

  // NOTE: cashReceived initialization guarded via didInitForShowRef below.
  // (Keeping this block removed prevents duplicate setState loops.)

  // Calculate settlement amounts
  const receivedAmount = cashReceived || 0;
  const billAmount = grandTotal + (tip || 0);
  const refundAmount = receivedAmount > billAmount ? receivedAmount - billAmount : 0;

  const getRemainingExcluding = (excludeMode?: string) => {
    if (!isMixedPayment) return grandTotal;
    const paidByOthers = selectedPaymentModes
      .filter(m => m !== excludeMode)
      .reduce((sum, m) => sum + (Number(paymentAmounts[m]) || 0), 0);
    return Math.max(0, grandTotal - paidByOthers);
  };

  const handleAmountFocus = (mode: string) => {
    if (!isMixedPayment) return;
    if (Number(paymentAmounts[mode] || 0) > 0) return;

    const remaining = getRemainingExcluding(mode);
    if (remaining > 0) {
      setPaymentAmounts(prev => ({ ...prev, [mode]: remaining.toFixed(2) }));
    }
  };

  const handleAmountChange = (mode: string, value: string) => {
    setPaymentAmounts(prev => ({ ...prev, [mode]: value }));
  };

  const removePaymentMode = (modeName: string) => {
    setSelectedPaymentModes(prev => prev.filter(m => m !== modeName));
    setPaymentAmounts(prev => {
      const next = { ...prev };
      delete next[modeName];
      return next;
    });
  };

  const togglePaymentMode = (mode: PaymentMode) => {
    const name = mode.mode_name;
    const isAlreadySelected = selectedPaymentModes.includes(name);

    if (!isMixedPayment) {
      // Single payment mode
      if (isAlreadySelected) {
        setSelectedPaymentModes([]);
        setPaymentAmounts({});
      } else {
        setSelectedPaymentModes([name]);
        setPaymentAmounts({ [name]: grandTotal.toFixed(2) });
      }
    } else {
      // Mixed payment mode
      if (isAlreadySelected) {
        removePaymentMode(name);
      } else {
        setSelectedPaymentModes(prev => [...prev, name]);
        const remaining = getRemainingExcluding(name);
        if (remaining > 0) {
          setPaymentAmounts(prev => ({ ...prev, [name]: remaining.toFixed(2) }));
        } else {
          setPaymentAmounts(prev => ({ ...prev, [name]: '0' }));
        }
      }
    }
  };

  // ========== FIXED KEYBOARD NAVIGATION ==========
  // Using refs to prevent stale closure issues
  const grandTotalRef = useRef(grandTotal);
  const isMixedPaymentRef = useRef(isMixedPayment);
  const selectedPaymentModesRef = useRef(selectedPaymentModes);
  const paymentAmountsRef = useRef(paymentAmounts);

  // Keep refs in sync with state (for UI-driven changes)
  useEffect(() => { grandTotalRef.current = grandTotal; }, [grandTotal]);
  useEffect(() => { isMixedPaymentRef.current = isMixedPayment; }, [isMixedPayment]);
  useEffect(() => { selectedPaymentModesRef.current = selectedPaymentModes; }, [selectedPaymentModes]);
  useEffect(() => { paymentAmountsRef.current = paymentAmounts; }, [paymentAmounts]);

  // ✅ FIXED: handleSettle reads from refs so it always has fresh values
const handleSettle = useCallback(async () => {
    // Ensure cashReceived is initialized for this open cycle before settling
    // (guards against any parent prop oscillation during the first render).
    if (show && initialCashReceived !== undefined) {
      setCashReceived((prev) => (prev === initialCashReceived ? prev : initialCashReceived));
    }

    if (loading) return

    const currentModes = selectedPaymentModesRef.current
    const currentAmounts = paymentAmountsRef.current

    if (balanceDue > 0) {
      toast.error(`Balance due: ₹${balanceDue.toFixed(2)}`)
      return
    }

// Backend (ldgSettlementController) requires additional fields.
    // We map what we can and rely on the parent to provide the rest.
    // NOTE: window.__hotel_* globals are NOT a reliable contract; this is
    // a temporary compile-time placeholder. Replace with proper props wiring
    // in HotelBookingPanel when available.
    const settlements = currentModes.map((name) => {
      const mode = outletPaymentModes.find((m) => m.mode_name === name)

      return {
        table_name: table_name || 'room',

        // Required by backend
        PaymentTypeID: mode?.id,
        PaymentType: name,
        Amount: Number(currentAmounts[name] || 0),

        userid: (window as any)?.__hotel_userid,
        HotelID: (window as any)?.__hotel_hotelid,
        outletid: mode?.outletid,

        checkinid: (window as any)?.__hotel_checkinid,
        
        // FIX: use modal prop first; fallback to window global for backward compatibility.
        room_id: room_id ?? (window as any)?.__hotel_roomid,

        // Ensure backend gets room reference (ldgsettlement.room_name)
        room_name: checked_out_rooms ?? '',

        // Existing fields already used by backend insertData
        received_amount: cashReceived || 0,
        refund_amount: refundAmount,
        TipAmount: tip || 0,
        total_amount: grandTotal,
      }
    })

    try {
      await onSettle(settlements as any, tip)
    } catch (err) {
      toast.error('Settlement failed')
    }
  }, [
    loading,
    cashReceived,
    grandTotal,
    balanceDue,
    tip,
    table_name,
    refundAmount,
    onSettle,
    outletPaymentModes
  ]);

  // ✅ FIXED: Arrow keys update refs immediately (sync) + state (async)
  // This ensures Enter press right after arrow always settles the correct mode
  useEffect(() => {
    if (!show || !Array.isArray(outletPaymentModes) || outletPaymentModes.length === 0) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setActivePaymentIndex(prev => {
          const next = e.key === 'ArrowDown'
            ? (prev + 1) % outletPaymentModes.length
            : (prev - 1 + outletPaymentModes.length) % outletPaymentModes.length;

          const modeName = outletPaymentModes[next].mode_name;

          const currentGrandTotal = grandTotalRef.current;
          const currentIsMixed = isMixedPaymentRef.current;
          const currentSelectedModes = [...selectedPaymentModesRef.current];
          const currentAmounts = { ...paymentAmountsRef.current };

          if (!currentIsMixed) {
            // Single mode — replace selection
            const newModes = [modeName];
            const newAmounts = { [modeName]: currentGrandTotal.toFixed(2) };

            // ✅ Update refs immediately so Enter press reads correct value
            selectedPaymentModesRef.current = newModes;
            paymentAmountsRef.current = newAmounts;

            setSelectedPaymentModes(newModes);
            setPaymentAmounts(newAmounts);
          } else {
            // Mixed mode — toggle selection
            const isAlreadySelected = currentSelectedModes.includes(modeName);

            if (isAlreadySelected) {
              const newModes = currentSelectedModes.filter(m => m !== modeName);
              const newAmounts = { ...currentAmounts };
              delete newAmounts[modeName];

              // ✅ Update refs immediately
              selectedPaymentModesRef.current = newModes;
              paymentAmountsRef.current = newAmounts;

              setSelectedPaymentModes(newModes);
              setPaymentAmounts(newAmounts);
            } else {
              const paidByOthers = currentSelectedModes.reduce(
                (sum, m) => sum + (Number(currentAmounts[m]) || 0), 0
              );
              const remaining = Math.max(0, currentGrandTotal - paidByOthers);
              const newModes = [...currentSelectedModes, modeName];
              const newAmounts = remaining > 0
                ? { ...currentAmounts, [modeName]: remaining.toFixed(2) }
                : { ...currentAmounts, [modeName]: '0' };

              // ✅ Update refs immediately
              selectedPaymentModesRef.current = newModes;
              paymentAmountsRef.current = newAmounts;

              setSelectedPaymentModes(newModes);
              setPaymentAmounts(newAmounts);
            }
          }

          return next;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSettle();
      } else if (e.key === 'Escape') {
        onHide();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [show, outletPaymentModes, onHide, handleSettle]);

  // Reset form when modal closes
  useEffect(() => {
    if (!show) {
      setIsMixedPayment(false);
      setSelectedPaymentModes([]);
      setPaymentAmounts({});
      setTip(0);
      setCashReceived(0);
      setActivePaymentIndex(0);
    }
  }, [show]);

  const didInitForShowRef = useRef(false);

  // Update states when modal opens with initial props and auto-select Cash if needed
  // Run only once per open to avoid repeated setState loops.
  useEffect(() => {
    if (!show) {
      didInitForShowRef.current = false;
      return;
    }
    if (didInitForShowRef.current) return;
    didInitForShowRef.current = true;

    setIsMixedPayment(initialIsMixed);
    setSelectedPaymentModes(initialSelectedModes);
    setTip(initialTip);

    // ✅ FIX: Initialize payment amounts properly - don't use zero values
    if (initialSelectedModes.length > 0 && grandTotal > 0) {
      const newAmounts: { [key: string]: string } = {};

      // Check if initialPaymentAmounts has valid amounts
      const hasValidAmounts = initialSelectedModes.every(mode => {
        const amount = parseFloat(initialPaymentAmounts[mode] || '0');
        return amount > 0;
      });

      if (hasValidAmounts && Object.keys(initialPaymentAmounts).length > 0) {
        setPaymentAmounts(initialPaymentAmounts);
      } else {
        // Initialize with grand total
        if (!initialIsMixed && initialSelectedModes.length === 1) {
          newAmounts[initialSelectedModes[0]] = grandTotal.toFixed(2);
        } else if (initialIsMixed && initialSelectedModes.length > 0) {
          newAmounts[initialSelectedModes[0]] = grandTotal.toFixed(2);
          for (let i = 1; i < initialSelectedModes.length; i++) {
            newAmounts[initialSelectedModes[i]] = '0';
          }
        }
        setPaymentAmounts(newAmounts);
      }
    } else if (!initialIsMixed && initialSelectedModes.length === 0) {
      const cashMode = Array.isArray(outletPaymentModes)
        ? outletPaymentModes.find(m => m.mode_name?.toLowerCase() === 'cash')
        : null;
      if (cashMode && grandTotal > 0) {
        setSelectedPaymentModes([cashMode.mode_name]);
        setPaymentAmounts({ [cashMode.mode_name]: grandTotal.toFixed(2) });
      }
    } else {
      setPaymentAmounts(initialPaymentAmounts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
      backdrop="static"
    >
      <Modal.Header closeButton className="pb-2 pt-3 border-0" style={{ background: '#1a2744' }}>
        <Modal.Title className="fw-bold fs-5 w-100 text-white">
          Payment Settlement
          {(guestName || checked_out_rooms) && (
            <div style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.9, marginTop: 2 }}>
              {guestName && <span className="me-3">👤 {guestName}</span>}
              {checked_out_rooms && <span className="me-3">🚪 Room {checked_out_rooms}</span>}
              {(totalPrice !== undefined ? totalPrice : grandTotal) > 0 && (
                <span>💰 ₹{(totalPrice !== undefined ? totalPrice : grandTotal).toFixed(2)}</span>
              )}
            </div>
          )}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-0">
        <Row className="g-0 h-100">
          {/* LEFT – Payment Methods */}
          <Col md={4} className="bg-white border-end">
            <div className="p-3 border-bottom bg-light">
              <div className="d-flex align-items-center gap-3">
                <Form.Check
                  type="switch"
                  id="mixed-switch"
                  checked={isMixedPayment}
                  onChange={e => setIsMixedPayment(e.target.checked)}
                />
                <div>
                  <strong>Mixed Payment</strong>
                  <div className="small text-muted">Use multiple methods</div>
                </div>
              </div>
            </div>

            <div className="p-2">
              <h6 className="fw-bold text-uppercase small mb-3 text-secondary">
                Payment Methods
              </h6>

              <div style={{ overflowY: 'auto' }}>
                {Array.isArray(outletPaymentModes) && outletPaymentModes.length > 0 ? (
                  outletPaymentModes.map((mode, index) => {
                    const isSelected = selectedPaymentModes.includes(mode.mode_name);
                    const isActive = index === activePaymentIndex;

                    return (
                      <div
                        key={mode.id}
                        onClick={() => {
                          setActivePaymentIndex(index);
                          togglePaymentMode(mode);
                        }}
                        className={`
                          p-2 mb-2 rounded border cursor-pointer transition-all
                          ${isSelected
                            ? 'bg-success text-white'
                            : isActive
                              ? 'bg-primary-subtle border-primary'
                              : 'border hover-bg-light'}
                        `}
                      >
                        {mode.mode_name}
                      </div>
                    );
                  })
                ) : (
                  <div className="p-3 text-center text-muted">
                    No payment modes available for this outlet
                    {process.env.NODE_ENV === 'development' && (
                      <div className="mt-2 p-2 bg-warning text-dark small">
                        <strong>DEBUG:</strong> outletPaymentModes = {JSON.stringify(outletPaymentModes)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Col>

          {/* RIGHT – Summary & Payment Inputs */}
          <Col md={8} className="p-2 bg-light d-flex flex-column">
            {/* Due Amount */}
            <div className="text-center mb-4">
              <div className="fs-2 fw-bold text-success rounded text-center ">₹{grandTotal.toFixed(2)}</div>
            </div>

            {/* Selected Payment Inputs */}
            {selectedPaymentModes.length === 0 ? (
              <div className="text-center text-muted py-3">
                Select payment method(s) to continue
              </div>
            ) : (
              <div className="mb-3">
                {selectedPaymentModes.map(modeName => (
                  <div
                    key={modeName}
                    className={`
                      mb-2 p-2 rounded border bg-danger-subtle border-danger
                      d-flex align-items-center gap-2
                      ${isMixedPayment ? '' : 'border-success bg-success-subtle'}
                    `}
                    style={{ minHeight: '52px' }}
                  >
                    <strong
                      className={`flex-grow-1 ${isMixedPayment ? 'text-danger' : 'text-success'}`}
                      style={{ fontSize: '1rem' }}
                    >
                      {modeName}
                    </strong>

                    <div className="d-flex align-items-center gap-2" style={{ minWidth: '200px' }}>
                      <Form.Control
                        size="sm"
                        type="number"
                        value={paymentAmounts[modeName] ?? ''}
                        onChange={e => handleAmountChange(modeName, e.target.value)}
                        onFocus={() => handleAmountFocus(modeName)}
                        className="text-end fw-bold py-1"
                        style={{ width: '130px' }}
                        step="0.01"
                        min="0"
                      />

                      {isMixedPayment && selectedPaymentModes.length > 1 && (
                        <Button
                          variant="link"
                          size="sm"
                          className="text-danger p-0"
                          onClick={() => removePaymentMode(modeName)}
                          style={{ fontSize: '0.85rem' }}
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {balanceDue > 0 && (
              <div className="alert alert-warning small py-2 mb-3">
                Please complete ₹{balanceDue.toFixed(2)}
              </div>
            )}

            {/* Footer Summary Card */}
            <div className="mt-auto">
              <Card
                className="shadow-sm border-0"
                style={{
                  backgroundColor: '#f8f9fa',
                  maxWidth: '100%',
                }}
              >
                <Card.Body className="py-3 px-4">
                  <Row className="g-3">
                    <Col xs={4}>
                      <Form.Label className="small fw-medium text-muted mb-1">
                        Tip
                      </Form.Label>
                      <Form.Control
                        size="sm"
                        type="number"
                        value={tip || ''}
                        onChange={e => setTip(Number(e.target.value) || 0)}
                        className="text-center fw-bold"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                      />
                    </Col>

                    <Col xs={4}>
                      <Form.Label className="small fw-medium text-success mb-1">
                        Received
                      </Form.Label>
                      <Form.Control
                        size="sm"
                        type="number"
                        value={cashReceived ?? ''}
                        onChange={e => setCashReceived(Number(e.target.value) || 0)}
                        className={`text-center fw-bold ${cashReceived >= (grandTotal + (tip || 0))
                            ? 'border-success text-success'
                            : 'border-warning text-warning'
                          }`}
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                      />
                    </Col>

                    <Col xs={4}>
                      <Form.Label className="small fw-medium text-muted mb-1">
                        {cashReceived - (grandTotal + (tip || 0)) > 0 ? 'Change' : 'Balance'}
                      </Form.Label>
                      <div
                        className={`form-control text-center fw-bold py-1 px-2 ${cashReceived - (grandTotal + (tip || 0)) > 0
                            ? 'text-success bg-success-subtle border-success'
                            : cashReceived - (grandTotal + (tip || 0)) < 0
                              ? 'text-danger bg-danger-subtle border-danger'
                              : 'text-success bg-success-subtle border-success'
                          }`}
                        style={{ height: '31px' }}
                      >
                        {cashReceived - (grandTotal + (tip || 0)) > 0
                          ? `₹${(cashReceived - (grandTotal + (tip || 0))).toFixed(2)}`
                          : cashReceived - (grandTotal + (tip || 0)) < 0
                            ? `₹${Math.abs(cashReceived - (grandTotal + (tip || 0))).toFixed(2)}`
                            : '✓ Done'}
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Modal.Body>

      <Modal.Footer className="border-0 pt-3 pb-4 px-4 d-flex gap-3 justify-content-end">
        <Button
          variant="outline-secondary"
          onClick={onHide}
          disabled={loading}
          style={{ minWidth: '120px' }}
        >
          Back
        </Button>
        <Button
          variant="success"
          size="lg"
          onClick={handleSettle}
          disabled={loading || balanceDue > 0 || selectedPaymentModes.length === 0}
          style={{ minWidth: '180px' }}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              Processing...
            </>
          ) : (
            'Settle'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SettlementModal;