// SettlementModal.tsx
import React, { useState, useEffect } from 'react';
import { fetchCustomerByMobile } from '@/utils/commonfunction';
import Customers from './Customers';

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
  initialCashReceived?: number;  // FIXED: Added for received amount
  table_name?: string | null;
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
  initialCashReceived = 0,  // FIXED: Destructure the prop
  table_name,
  initialMobile,
  initialCustomerName,  
  initialCustomerId,
  selectedOutletId,
}) => {
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  const handleCustomerModalToggle = () => {
    setShowCustomerModal(prev => !prev);
  };



  const [isMixedPayment, setIsMixedPayment] = useState(initialIsMixed);
  const [selectedPaymentModes, setSelectedPaymentModes] = useState<string[]>(initialSelectedModes);
  const [paymentAmounts, setPaymentAmounts] = useState<{ [key: string]: string }>(initialPaymentAmounts);
  const [tip, setTip] = useState<number>(initialTip);
  const [activePaymentIndex, setActivePaymentIndex] = useState(0);

// Credit mode detection
  const hasCreditMode = selectedPaymentModes.some(mode => mode.toLowerCase() === 'credit');

  // Customer states for Credit mode (ONLY visible when hasCreditMode)
  

  const [customerMobile, setCustomerMobile] = useState(initialMobile || '');
  const [customerName, setCustomerName] = useState(initialCustomerName || '');
  const [customerId, setCustomerId] = useState<number | null>(initialCustomerId || null);

  // Reset customer data when Credit deselected or modal closed
  useEffect(() => {
    if (!show) return;
    if (hasCreditMode) {
      setCustomerMobile(initialMobile || '');
      setCustomerName(initialCustomerName || '');
      setCustomerId(initialCustomerId || null);
    }
  }, [show, hasCreditMode, initialMobile, initialCustomerName, initialCustomerId]);

  // Auto-fetch customer when mobile changes (min 10 digits)
  useEffect(() => {
    if (customerMobile.length >= 10) {
      fetchCustomerByMobile(customerMobile, setCustomerName, setCustomerId, () => {});
    } else {
      setCustomerName('');
      setCustomerId(null);
    }
  }, [customerMobile]);

  // Reset customer on modal close
  useEffect(() => {
    if (!show) {
      setCustomerMobile('');
      setCustomerName('');
      setCustomerId(null);
    }
  }, [show]);

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
  const [cashReceived, setCashReceived] = useState<number>(0);

  // FIXED: Initialize cashReceived with prop value when modal opens
  useEffect(() => {
    if (show && initialCashReceived !== undefined) {
      setCashReceived(initialCashReceived);
    }
  }, [show, initialCashReceived]);

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
        }
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
if (!show || !Array.isArray(outletPaymentModes) || outletPaymentModes.length === 0) return;

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

  // Update states when modal opens with initial props and auto-select Cash if needed
  useEffect(() => {
    if (show) {
      setIsMixedPayment(initialIsMixed);
      setSelectedPaymentModes(initialSelectedModes);
      setPaymentAmounts(initialPaymentAmounts);
      setTip(initialTip);

      // Auto-select Cash if no initial payment modes and not mixed
      if (!initialIsMixed && initialSelectedModes.length === 0) {
const cashMode = Array.isArray(outletPaymentModes) ? outletPaymentModes.find(m => m.mode_name?.toLowerCase() === 'cash') : null;
        if (cashMode) {
          setSelectedPaymentModes([cashMode.mode_name]);
          setPaymentAmounts({ [cashMode.mode_name]: grandTotal.toFixed(2) });
        }
      }
    }
  }, [show, initialIsMixed, initialSelectedModes, initialPaymentAmounts, initialTip, outletPaymentModes, grandTotal]);

  const handleSettle = async () => {
    if (loading) return;

    // NEW: Validate Credit requires customer
    const hasCredit = selectedPaymentModes.some(mode => mode.toLowerCase() === 'credit');
    if (hasCredit && !customerId) {
      toast.error('Customer details required for Credit payment');
      return;
    }

  

    // Validate: Received amount must be >= Bill amount (including tip)
    if (cashReceived > 0 && cashReceived < grandTotal) {
      toast.error(`Received amount ₹${cashReceived} is less than bill ₹${grandTotal}`);
      return;
    }

    if (balanceDue > 0) {
      toast.error(`Balance due: ₹${balanceDue.toFixed(2)}`);
      return;
    }

    const settlements = selectedPaymentModes.map(name => {
      const baseSettlement = {
        table_name: table_name || '',
        PaymentType: name,
        Amount: Number(paymentAmounts[name] || 0),
        received_amount: receivedAmount,
        refund_amount: refundAmount,
        TipAmount: tip || 0,
      };

      // Add customer data to Credit payments only
      if (name.toLowerCase() === 'credit' && customerId) {
        return {
          ...baseSettlement,
          customerid: customerId,
          mobile: customerMobile,
          customerName: customerName,
        };
      }

      return baseSettlement;
    });

    try {
      await onSettle(settlements, tip);
    } catch (err) {
      // console.error(err);
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
          {table_name ? `Table ${table_name} | ` : ''}Payment Settlement
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

            {/* NEW: Customer Fields - ONLY when Credit selected (RIGHT SECTION) */}
            {hasCreditMode && (
              <div className="mb-3 p-3 bg-info-subtle rounded border border-info">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h6 className="fw-bold mb-0 text-info">
                    <i className="fas fa-user me-1"></i>Customer Details
                  </h6>
                  <span className="badge bg-danger">Credit Required</span>
                </div>
                
                <Row className="g-2">
                  {/* Mobile with Country Code */}
                  <Col xs={4}>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-white border-info">+91</span>
                      <input
                        type="tel"
                        className={`form-control form-control-sm ${!customerId ? 'border-danger' : 'border-success'}`}
                        placeholder="Mobile (10 digits)"
                        value={customerMobile}
                        onChange={(e) => setCustomerMobile(e.target.value.replace(/\\D/g, ''))}
                        maxLength={10}
                      />
                    </div>
                  </Col>
                  
                  {/* Customer Name (Auto-fetch) */}
                  <Col xs={5}>
                    <input
                      type="text"
                      className={`form-control form-control-sm ${!customerId ? 'border-danger bg-light' : 'border-success bg-success-subtle'}`}
                      placeholder={!customerId ? "Enter mobile to fetch..." : "Customer found ✓"}
                      value={customerName || ''}
                      readOnly
                    />
                  </Col>
                  
                  {/* Add New Customer */}
                  <Col xs={3}>
                    <Button 
                      variant="outline-primary" 
                      size="sm" 
                      className="w-100 h-100"
                      onClick={handleCustomerModalToggle}
                    >
                      <i className="fas fa-plus me-1"></i>Add New
                    </Button>
                  </Col>
                </Row>
                
                {/* Validation Message */}
                {!customerId && customerMobile.length >= 10 && (
                  <div className="mt-1 p-1 bg-danger-subtle rounded small text-danger">
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    Customer not found. Please verify mobile number.
                  </div>
                )}
                
                {customerId && (
                  <div className="mt-1 p-1 bg-success-subtle rounded small text-success">
                    <i className="fas fa-check-circle me-1"></i>
                    Customer verified ✓
                  </div>
                )}
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
      {/* Customer Management Modal */}
      <Modal 
        show={showCustomerModal} 
        onHide={handleCustomerModalToggle} 
        size="xl" 
        centered
        style={{ maxHeight: '90vh' }}
      >
        <Modal.Header closeButton className="bg-light">
          <Modal.Title className="fw-bold">Customer Management</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: 0, height: '70vh', overflowY: 'auto' }}>
          <Customers />
        </Modal.Body>
      </Modal>

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