// Transaction/SettlementModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, Row, Col, Card, Form, Button, Badge } from 'react-bootstrap';
import axios from 'axios';
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

  selectedOutletId?: number;
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
  selectedOutletId,
  initialSelectedModes = [],
  initialPaymentAmounts = {},
  initialIsMixed = false,
  initialTip = 0
}) => {
  const [isMixedPayment, setIsMixedPayment] = useState(initialIsMixed);
  const [selectedPaymentModes, setSelectedPaymentModes] = useState<string[]>(initialSelectedModes);
  const [paymentAmounts, setPaymentAmounts] = useState<{ [key: string]: string }>(initialPaymentAmounts);
  const [tip, setTip] = useState<number>(initialTip);
  const [activePaymentIndex, setActivePaymentIndex] = useState(0);

  // Calculate totals
  const totalReceived = Object.values(paymentAmounts).reduce(
    (acc, val) => acc + (parseFloat(val) || 0),
    0
  ) + (tip || 0);

  const refundAmount =
    totalReceived > grandTotal
      ? totalReceived - grandTotal
      : 0;

  const balanceAmount =
    totalReceived < grandTotal
      ? grandTotal - totalReceived
      : 0;

  // Calculate remaining amount excluding one specific mode
  const calculateRemainingExcluding = (excludeModeName?: string): number => {
    if (!isMixedPayment) return grandTotal;

    const totalPaidByOthers = selectedPaymentModes
      .filter(name => name !== excludeModeName)
      .reduce((sum, name) => sum + (Number(paymentAmounts[name]) || 0), 0);

    const remaining = grandTotal - totalPaidByOthers;
    return Math.max(0, remaining);
  };

  // Handle focus on payment input → auto-fill remaining if field is empty/zero
  const handlePaymentInputFocus = (focusedModeName: string) => {
    if (!isMixedPayment) return;

    const currentValue = Number(paymentAmounts[focusedModeName] ?? 0);

    // Don't overwrite if user already entered something meaningful
    if (currentValue > 0) return;

    const remaining = calculateRemainingExcluding(focusedModeName);

    if (remaining > 0) {
      setPaymentAmounts(prev => ({
        ...prev,
        [focusedModeName]: remaining.toFixed(2)
      }));
    }
  };

  const handlePaymentAmountChange = (modeName: string, value: string) => {
    const stringValue = value === '' ? '0' : value;
    setPaymentAmounts(prev => ({
      ...prev,
      [modeName]: stringValue
    }));
  };

  // Remove a payment mode
  const removePaymentMode = (modeName: string) => {
    setSelectedPaymentModes((prev) => prev.filter((m) => m !== modeName));
    setPaymentAmounts((prev) => {
      const updated = { ...prev };
      delete updated[modeName];
      return updated;
    });
  };

  const handlePaymentModeClick = (mode: PaymentMode) => {
    const modeName = mode.mode_name;
    const wasSelected = selectedPaymentModes.includes(modeName);

    if (wasSelected) {
      // Remove from selected if already selected
      removePaymentMode(modeName);
    } else {
      // Add to selected
      setSelectedPaymentModes(prev => [...prev, modeName]);
      
      // Auto-fill amount for single payment or remaining amount for mixed
      if (!isMixedPayment) {
        setPaymentAmounts({ [modeName]: grandTotal.toFixed(2) });
      } else {
        const remaining = calculateRemainingExcluding(modeName);
        if (remaining > 0) {
          setPaymentAmounts(prev => ({
            ...prev,
            [modeName]: remaining.toFixed(2)
          }));
        }
      }
    }
  };

  // Keyboard navigation for payment modes
  useEffect(() => {
    if (!show) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!outletPaymentModes.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActivePaymentIndex((prev) => {
          const newIndex = prev < outletPaymentModes.length - 1 ? prev + 1 : 0;
          const selectedMode = outletPaymentModes[newIndex];
          if (selectedMode) {
            handlePaymentModeClick(selectedMode);
          }
          return newIndex;
        });
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActivePaymentIndex((prev) => {
          const newIndex = prev > 0 ? prev - 1 : outletPaymentModes.length - 1;
          const selectedMode = outletPaymentModes[newIndex];
          if (selectedMode) {
            handlePaymentModeClick(selectedMode);
          }
          return newIndex;
        });
      }

      if (e.key === "Enter" && outletPaymentModes[activePaymentIndex]) {
        e.preventDefault();
        handlePaymentModeClick(outletPaymentModes[activePaymentIndex]);
      }

      if (e.key === "Escape") {
        onHide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [show, outletPaymentModes, activePaymentIndex, handlePaymentModeClick, onHide]);

  // Initialize with cash payment on show if not mixed
  useEffect(() => {
    if (show && !isMixedPayment && selectedPaymentModes.length === 0) {
      const cashMode = outletPaymentModes.find(m => m.mode_name.toLowerCase() === "cash");
      if (cashMode) {
        handlePaymentModeClick(cashMode);
      }
    }
  }, [show, isMixedPayment, outletPaymentModes, handlePaymentModeClick]);

  // Reset state when modal closes
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

    if (balanceAmount > 0) {
      toast.error(`Balance due: ₹${balanceAmount.toFixed(2)}. Please complete payment.`);
      return;
    }

    try {
      const settlements = selectedPaymentModes.map(modeName => ({
        PaymentType: modeName,
        Amount: Number(paymentAmounts[modeName] || 0)
      }));

      await onSettle(settlements, tip);
    } catch (error) {
      console.error('Settlement error:', error);
      toast.error('Failed to process settlement. Please try again.');
    }
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      centered
      size="lg"
      dialogClassName="settlement-modal"
      backdrop="static"
    >
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold text-dark fs-4 w-100 text-center">
          Payment Settlement
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-0">
        <Row className="g-0 h-100">
          {/* LEFT - Payment Modes Selection */}
          <Col md={4} className="bg-white border-end">
            {/* Mixed Payment Toggle */}
            <div className={`p-2 border-bottom bg-light ${isMixedPayment ? 'bg-light' : ''}`}>
              <div className="d-flex align-items-center gap-3">
                <Form.Check
                  type="switch"
                  id="mixed-payment-switch"
                  checked={isMixedPayment}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setIsMixedPayment(checked);
                    setSelectedPaymentModes([]);
                    setPaymentAmounts({});

                    if (checked) {
                      const cashMode = outletPaymentModes.find(m => m.mode_name.toLowerCase() === "cash");
                      if (cashMode) {
                        handlePaymentModeClick(cashMode);
                      }
                    }
                  }}
                />
                <div>
                  <strong>Mixed Payment</strong>
                  <div className="small text-muted">
                    Allow multiple payment methods
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 h-100 d-flex flex-column">
              <h6 className="fw-bold text-secondary mb-3 small text-uppercase">
                Available Payment Methods
              </h6>
              
              <div className="flex-grow-1 overflow-auto">
                <div className="d-flex flex-column gap-2">
                  {outletPaymentModes && outletPaymentModes.length > 0 ? outletPaymentModes.map((mode, index) => {
                    const isSelected = selectedPaymentModes.includes(mode.mode_name);
                    const isActive = index === activePaymentIndex;

                    return (
                      <div
                        key={mode.id}
                        onClick={() => {
                          setActivePaymentIndex(index);
                          handlePaymentModeClick(mode);
                        }}
                        className={`
                          d-flex align-items-center justify-content-between
                          p-3 rounded border transition-all cursor-pointer
                          ${isSelected
                            ? 'border-danger bg-danger-subtle text-danger fw-bold shadow-sm'
                            : isActive
                              ? 'border-info bg-info-subtle shadow'
                              : 'border-light hover:border-primary hover:bg-primary-subtle'}
                        `}
                        style={{
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          minHeight: '50px'
                        }}
                      >
                        <div>
                          <div className="fw-bold">{mode.mode_name}</div>
                          {isSelected && (
                            <small className="text-success">Selected</small>
                          )}
                        </div>
                        {isActive && (
                          <div className="d-flex flex-column align-items-end">
                            <span className="badge bg-dark text-white rounded-pill px-2 py-1 small mb-1">
                              ←↑↓ Enter
                            </span>
                            <small className="text-muted">Select</small>
                          </div>
                        )}
                      </div>
                    );
                  }) : (
                    <div className="text-center text-muted py-4">
                      <i className="fas fa-spinner fa-spin fa-2x mb-3"></i>
                      <div>Loading payment methods...</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Keyboard Instructions */}
              {outletPaymentModes.length > 0 && (
                <div className="mt-3 pt-2 border-top small text-muted">
                  <div className="d-flex justify-content-between">
                    <span>↑↓: Navigate</span>
                    <span>Enter: Select</span>
                  </div>
                  <div className="d-flex justify-content-between mt-1">
                    <span>Esc: Cancel</span>
                    <span>Tab: Next field</span>
                  </div>
                </div>
              )}
            </div>
          </Col>

          {/* RIGHT - Payment Details & Summary */}
          <Col md={8} className="bg-light-subtle p-4">
            {/* Amount Due Display */}
            <div className="text-center mb-4 pb-3 border-bottom">
              <div className="text-muted small mb-1">Total Amount Due</div>
              <div className="display-4 fw-bold text-dark mb-1">
                ₹{(grandTotal || 0).toFixed(2)}
              </div>
              <div className="text-muted small">
                Subtotal: ₹{(subtotal || 0).toFixed(2)}
              </div>
            </div>

            {/* Payment Details Cards */}
            {selectedPaymentModes.length === 0 ? (
              <div className="text-center text-muted py-5">
                <div className="mb-3">
                  <i className="fas fa-hand-point-right fa-2x text-muted mb-3"></i>
                </div>
                <h6>Select payment method(s) to continue</h6>
                <small className="text-muted">
                  Click on any payment method or use arrow keys
                </small>
              </div>
            ) : (
              <div className="mb-4">
                {selectedPaymentModes.map((modeName, index) => (
                  <Card key={modeName} className="mb-3 shadow-sm border">
                    <Card.Body className="p-4">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                          <h6 className="fw-bold text-dark m-0">{modeName}</h6>
                          <small className="text-muted">
                            Payment #{index + 1}
                          </small>
                        </div>
                        {selectedPaymentModes.length > 1 && (
                          <Button
                            variant="link"
                            size="sm"
                            className="text-danger p-0 fw-normal"
                            onClick={() => removePaymentMode(modeName)}
                          >
                            <i className="fas fa-times me-1"></i>Remove
                          </Button>
                        )}
                      </div>

                      <Form.Group className="mb-2">
                        <Form.Label className="small fw-medium text-muted">
                          Amount to Pay
                          {isMixedPayment && 
                           index === selectedPaymentModes.length - 1 && (
                            <Badge bg="info" className="ms-2">
                              Auto-filled
                            </Badge>
                          )}
                        </Form.Label>
                        <Form.Control
                          type="number"
                          value={paymentAmounts[modeName] ?? ''}
                          onChange={e => handlePaymentAmountChange(modeName, e.target.value)}
                          onFocus={() => handlePaymentInputFocus(modeName)}
                          readOnly={!isMixedPayment && selectedPaymentModes.length === 1}
                          className={`
                            fs-5 fw-bold text-end
                            ${isMixedPayment && 
                              index === selectedPaymentModes.length - 1
                              ? 'border-info bg-info-subtle' 
                              : ''}
                          `}
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                        />
                      </Form.Group>

                      {isMixedPayment && selectedPaymentModes.length > 1 && (
                        <small className="text-muted">
                          Remaining for this method: ₹{calculateRemainingExcluding(modeName).toFixed(2)}
                        </small>
                      )}
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}

            {/* Tip Section */}
            <Card className="mb-4 shadow-sm border">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-dark m-0">Optional Tip/Gratuity</h6>
                  <small className="text-muted">Added to total</small>
                </div>
                <Form.Group>
                  <Form.Control
                    type="number"
                    placeholder="0.00"
                    value={tip || ''}
                    onChange={e => setTip(Number(e.target.value) || 0)}
                    className="fs-5 fw-bold text-end"
                    step="0.01"
                    min="0"
                  />
                </Form.Group>
                <small className="text-muted mt-1 d-block">
                  Tip will be added to the total amount
                </small>
              </Card.Body>
            </Card>

            {/* Payment Summary */}
            <Card className="shadow-sm border-0">
              <Card.Body className="p-4">
                <h6 className="fw-bold text-dark mb-3 text-center">Payment Summary</h6>
                <Row className="g-3 text-center">
                  <Col md={6}>
                    <div className="border-end">
                      <div className="text-muted small mb-1">Total Received</div>
                      <div className={`fs-4 fw-bold ${
                        totalReceived >= grandTotal ? 'text-success' : 'text-warning'
                      }`}>
                        ₹{totalReceived.toFixed(2)}
                      </div>
                    </div>
                  </Col>
                  <Col md={6}>
                    {balanceAmount > 0 ? (
                      <>
                        <div className="text-muted small mb-1">Balance Due</div>
                        <div className="fs-4 fw-bold text-danger">
                          ₹{balanceAmount.toFixed(2)}
                        </div>
                      </>
                    ) : refundAmount > 0 ? (
                      <>
                        <div className="text-muted small mb-1">Change/Refund</div>
                        <div className="fs-4 fw-bold text-success">
                          ₹{refundAmount.toFixed(2)}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-muted small mb-1">Status</div>
                        <div className="fs-4 fw-bold text-success">
                          <i className="fas fa-check-circle text-success me-2"></i>
                          Complete
                        </div>
                      </>
                    )}
                  </Col>
                </Row>

                {balanceAmount > 0 && (
                  <div className="alert alert-warning mt-3 small">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Please complete the payment of ₹{balanceAmount.toFixed(2)} to proceed.
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Modal.Body>

      <Modal.Footer className="border-0 pt-4 px-4 pb-4 bg-light">
        <Button 
          variant="outline-secondary" 
          onClick={onHide} 
          className="px-4 py-2"
          disabled={loading}
        >
          <i className="fas fa-arrow-left me-2"></i>Back
        </Button>
        <Button
          variant="success"
          onClick={handleSettle}
          disabled={loading || totalReceived < grandTotal || selectedPaymentModes.length === 0}
          size="lg"
          className="px-5 fw-bold"
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
              Processing...
            </>
          ) : (
            <>
              <i className="fas fa-credit-card me-2"></i>
              Settle & Print
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SettlementModal;