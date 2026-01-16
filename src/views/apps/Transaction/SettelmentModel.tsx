// SettlementModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, Row, Col, Form, Button, Card } from 'react-bootstrap';
import { useAuthContext } from '@/common';
import toast from 'react-hot-toast';

interface PaymentMode {
  id: number;
  mode_name: string;
  outletid: number;
}

interface SettlementModalProps {
  show: boolean;
  onHide: () => void;
  onSettle: (settlements: any[], tip?: number) => Promise<void>;
  grandTotal: number;
  subtotal: number;
  loading: boolean;
  outletPaymentModes: PaymentMode[];
  selectedOutletId?: number | null;
  initialSelectedModes?: string[];
  initialPaymentAmounts?: { [key: string]: string };
  initialIsMixed?: boolean;
  initialTip?: number;
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
}) => {
  const { user } = useAuthContext();

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
  }, [isMixedPayment, grandTotal]);

  const totalReceived = Object.values(paymentAmounts).reduce((sum, v) => sum + (Number(v) || 0), 0) + (tip || 0);
  const balance = grandTotal - totalReceived;
  const balanceDue = balance > 0 ? balance : 0;
  const changeToReturn = -balance > 0 ? -balance : 0;
  const [cashReceived, setCashReceived] = useState<number>(0);

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
        }
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!show || !outletPaymentModes.length) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActivePaymentIndex(prev => {
          const next = (prev + 1) % outletPaymentModes.length;
          togglePaymentMode(outletPaymentModes[next]);
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActivePaymentIndex(prev => {
          const next = (prev - 1 + outletPaymentModes.length) % outletPaymentModes.length;
          togglePaymentMode(outletPaymentModes[next]);
          return next;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (outletPaymentModes[activePaymentIndex]) {
          togglePaymentMode(outletPaymentModes[activePaymentIndex]);
        }
      } else if (e.key === 'Escape') {
        onHide();
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [show, outletPaymentModes, activePaymentIndex, isMixedPayment, grandTotal, onHide]);

  // Auto-select Cash when modal opens (single mode only)
  useEffect(() => {
    if (!show || isMixedPayment || selectedPaymentModes.length > 0) return;
    const cashMode = outletPaymentModes.find(m => m.mode_name.toLowerCase() === 'cash');
    if (cashMode) togglePaymentMode(cashMode);
  }, [show, isMixedPayment, outletPaymentModes]);

  // Reset form when modal closes
  useEffect(() => {
    if (!show) {
      setIsMixedPayment(false);
      setSelectedPaymentModes([]);
      setPaymentAmounts({});
      setTip(0);
      setActivePaymentIndex(0);
    }
  }, [show]);

  const handleSettle = async () => {
    if (loading) return;
    if (balanceDue > 0) {
      toast.error(`Balance due: ₹${balanceDue.toFixed(2)}`);
      return;
    }

    const settlements = selectedPaymentModes.map(name => ({
      PaymentType: name,
      Amount: Number(paymentAmounts[name] || 0),
    }));

    try {
      await onSettle(settlements, tip);
    } catch (err) {
      console.error(err);
      toast.error('Settlement failed');
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
      backdrop="static"
    >
      <Modal.Header closeButton className="pb-2 pt-3 border-0">
        <Modal.Title className="fw-bold fs-4 w-100 text-center">
          Payment Settlement
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

            <div className="p-3">
              <h6 className="fw-bold text-uppercase small mb-3 text-secondary">
                Payment Methods
              </h6>

              <div style={{ overflowY: 'auto' }}>
                {outletPaymentModes.map((mode, index) => {
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
                        p-3 mb-2 rounded border cursor-pointer transition-all
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
                })}
              </div>
            </div>
          </Col>

          {/* RIGHT – Summary & Payment Inputs */}
          <Col md={8} className="p-2 bg-light d-flex flex-column">
            {/* Due Amount */}
            <div className="text-center mb-4">
              
             <div className="fs-2 fw-bold text-success  rounded text-center ">₹{grandTotal.toFixed(2)}</div>
            </div>

            {/* Selected Payment Inputs */}
            {/* Selected Payment Inputs – compact version */}
            {selectedPaymentModes.length === 0 ? (
              <div className="text-center text-muted py-3">
                Select payment method(s) to continue
              </div>
            ) : (
              <div className="mb-3">  {/* adjusted bottom margin for new layout */}
                {selectedPaymentModes.map(modeName => (
                  <div
                    key={modeName}
                    className={`
                      mb-2 p-2 rounded border bg-danger-subtle border-danger
                      d-flex align-items-center gap-2
                      ${isMixedPayment ? '' : 'border-success bg-success-subtle'}
                    `}
                    style={{ minHeight: '52px' }}  // ← controls overall row height
                  >
                    {/* Mode Name */}
                    <strong 
                      className={`flex-grow-1 ${isMixedPayment ? 'text-danger' : 'text-success'}`}
                      style={{ fontSize: '1rem' }}  // slightly smaller than before
                    >
                      {modeName}
                    </strong>

                    {/* Amount input + Remove button */}
                    <div className="d-flex align-items-center gap-2" style={{ minWidth: '200px' }}>
                      <Form.Control
                        size="sm"                    // ← makes input noticeably shorter
                        type="number"
                        value={paymentAmounts[modeName] ?? ''}
                        onChange={e => handleAmountChange(modeName, e.target.value)}
                        onFocus={() => handleAmountFocus(modeName)}
                        className="text-end fw-bold py-1"  // reduced vertical padding
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

            {/* Footer-like Summary Card – now inside right column */}
            <div className="mt-auto">  {/* Pushes it to the bottom of the right column */}
              <Card
                className="shadow-sm border-0"
                style={{
                  backgroundColor: '#f8f9fa',
                  maxWidth: '100%',  // Full width in right column
                }}
              >
                <Card.Body className="py-3 px-4">
                  <Row className="g-3 align-items-center">
                    {/* TIP */}
                    <Col xs={4}>
                      <div className="d-flex align-items-center justify-content-between gap-2">
                        <Form.Label className="small fw-medium text-muted mb-0 flex-shrink-0">
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
                          style={{ width: '80px' }}  // Compact width to match screenshot
                        />
                      </div>
                    </Col>

                    {/* RECEIVED */}
                    <Col xs={4}>
                      <div className="d-flex align-items-center justify-content-between gap-2">
                        <Form.Label className="small fw-medium text-success mb-0 flex-shrink-0">
                          Received
                        </Form.Label>
                        <Form.Control
                          size="sm"
                          type="number"
                          value={cashReceived ?? ''}
                          onChange={e => setCashReceived(Number(e.target.value) || 0)}
                          className={`text-center fw-bold border ${
                            cashReceived >= (grandTotal + (tip || 0))
                              ? 'border-success text-success'
                              : 'border-warning text-warning'
                          }`}
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          style={{ width: '80px' }}  // Compact width to match screenshot
                        />
                      </div>
                    </Col>

                    {/* BALANCE / CHANGE */}
                    <Col xs={4}>
                      <div className="d-flex align-items-center justify-content-between gap-2">
                        <Form.Label className="small fw-medium text-muted mb-0 flex-shrink-0">
                          {cashReceived - (grandTotal + (tip || 0)) > 0 ? 'Change' : 'Balance'}
                        </Form.Label>
                        <div
                          className={`form-control text-center fw-bold border-0 py-1 px-2 small ${
                            cashReceived - (grandTotal + (tip || 0)) > 0
                              ? 'text-success bg-success-subtle border-success'
                              : cashReceived - (grandTotal + (tip || 0)) < 0
                              ? 'text-danger bg-danger-subtle border-danger'
                              : 'text-success bg-success-subtle border-success'
                          }`}
                          style={{ width: '80px' }}  // Compact width to match screenshot
                        >
                          {cashReceived - (grandTotal + (tip || 0)) > 0
                            ? `₹${(cashReceived - (grandTotal + (tip || 0))).toFixed(2)}`
                            : cashReceived - (grandTotal + (tip || 0)) < 0
                            ? `₹${Math.abs(cashReceived - (grandTotal + (tip || 0))).toFixed(2)}`
                            : '✓ Done'}
                        </div>
                      </div>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </div>
          </Col>
        </Row>
      </Modal.Body>

      {/* Simplified Footer – now only buttons, since summary is in right column */}
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
            'Settle & Print'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SettlementModal;