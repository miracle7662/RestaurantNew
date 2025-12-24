import React, { useEffect, useState } from "react";
import { Card, Row, Col, Button, Form, Modal } from "react-bootstrap";

/* ================= Types ================= */

interface PaymentMode {
  id: string | number;
  mode_name: string;
}

interface TaxCalc {
  grandTotal: number;
}

interface SettlementModalProps {
  show: boolean;
  onHide: () => void;
  taxCalc?: TaxCalc | null;
  outletPaymentModes: PaymentMode[];
  handleSettleAndPrint: (data: {
    payments: Record<string, string>;
    tip: number;
  }) => void;
}

/* ================= Component ================= */

const SettlementModal: React.FC<SettlementModalProps> = ({
  show,
  onHide,
  taxCalc,
  outletPaymentModes,
  handleSettleAndPrint,
}) => {
  const [isMixedPayment, setIsMixedPayment] = useState(false);
  const [selectedPaymentModes, setSelectedPaymentModes] = useState<string[]>([]);
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>(
    {}
  );
  const [tip, setTip] = useState(0);

  const grandTotal = taxCalc?.grandTotal ?? 0;

  /* ========== Auto-select CASH on open ========== */
  useEffect(() => {
    if (!show || isMixedPayment || !outletPaymentModes.length || !taxCalc) return;

    const cashMode = outletPaymentModes.find(
      (m) => m.mode_name.toLowerCase() === "cash"
    );

    if (cashMode) {
      setSelectedPaymentModes([cashMode.mode_name]);
      setPaymentAmounts({
        [cashMode.mode_name]: grandTotal.toFixed(2),
      });
    }
  }, [show, isMixedPayment, outletPaymentModes, taxCalc, grandTotal]);

  /* ========== Handlers ========== */

  const handlePaymentModeClick = (mode: PaymentMode) => {
    const modeName = mode.mode_name;

    // SINGLE PAYMENT
    if (!isMixedPayment) {
      setSelectedPaymentModes([modeName]);
      setPaymentAmounts({
        [modeName]: grandTotal.toFixed(2),
      });
      return;
    }

    // MIXED PAYMENT
    if (selectedPaymentModes.includes(modeName)) {
      setSelectedPaymentModes((prev) => prev.filter((m) => m !== modeName));
      setPaymentAmounts((prev) => {
        const copy = { ...prev };
        delete copy[modeName];
        return copy;
      });
    } else {
      setSelectedPaymentModes((prev) => [...prev, modeName]);
      setPaymentAmounts((prev) => ({ ...prev, [modeName]: "" }));
    }
  };

  const handlePaymentAmountChange = (mode: string, value: string) => {
    setPaymentAmounts((prev) => ({ ...prev, [mode]: value }));
  };

  /* ========== Calculations ========== */

  const paidAmount =
    Object.values(paymentAmounts).reduce(
      (sum, val) => sum + (parseFloat(val) || 0),
      0
    ) + (tip || 0);

  const balance = grandTotal - paidAmount;
  const isReadyToSettle = balance === 0 && paidAmount > 0;

  /* ================= UI ================= */

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      centered
      backdrop="static"
    >
      {/* Header */}
      <Modal.Header closeButton>
        <Modal.Title className="fw-bold">Payment Mode</Modal.Title>
      </Modal.Header>

      {/* Body */}
      <Modal.Body className="bg-light">
        {/* Bill Summary */}
        <div className="p-4 mb-4 bg-white rounded shadow-sm text-center">
          <h6 className="text-secondary mb-2">Total Amount Due</h6>
          <div className="fw-bold display-5 text-dark">
            ₹{grandTotal.toFixed(2)}
          </div>
        </div>

        {/* Mixed Toggle */}
        <div className="d-flex justify-content-end mb-3">
          <Form.Check
            type="switch"
            label="Mixed Payment"
            checked={isMixedPayment}
            onChange={(e) => {
              setIsMixedPayment(e.target.checked);
              setSelectedPaymentModes([]);
              setPaymentAmounts({});
            }}
          />
        </div>

        {/* Payment Modes */}
        <Row xs={1} md={2} lg={3} className="g-3 mb-4">
          {outletPaymentModes.map((mode) => {
            const isSelected = selectedPaymentModes.includes(mode.mode_name);

            return (
              <Col key={mode.id}>
                <Card
                  onClick={() => handlePaymentModeClick(mode)}
                  className={`text-center h-100 shadow-sm border ${
                    isSelected ? "border-primary border-3" : ""
                  }`}
                  style={{ cursor: "pointer" }}
                >
                  <Card.Body>
                    <Card.Title className="fw-semibold">
                      {mode.mode_name}
                    </Card.Title>

                    {isSelected && (
                      <Form.Control
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={paymentAmounts[mode.mode_name] ?? ""}
                        onChange={(e) =>
                          handlePaymentAmountChange(
                            mode.mode_name,
                            e.target.value
                          )
                        }
                        onClick={(e) => e.stopPropagation()}
                        readOnly={!isMixedPayment}
                        className="mt-2 text-center fw-bold"
                      />
                    )}
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>

        {/* Tip */}
        <div className="my-3 p-3 bg-white rounded shadow-sm text-center">
          <Form.Label className="fw-semibold">Optional Tip</Form.Label>
          <Form.Control
            type="number"
            step="0.01"
            min="0"
            value={tip || ""}
            onChange={(e) => setTip(Number(e.target.value) || 0)}
            className="text-center mx-auto"
            style={{ maxWidth: 180 }}
          />
        </div>

        {/* Summary */}
        <div className="p-3 bg-white rounded shadow-sm">
          <div className="d-flex justify-content-between fw-bold fs-5">
            <div>
              Total Paid:
              <span className="text-primary ms-2">
                ₹{paidAmount.toFixed(2)}
              </span>
            </div>
            <div>
              Balance:
              <span
                className={`ms-2 ${
                  balance === 0
                    ? "text-success"
                    : balance > 0
                    ? "text-danger"
                    : "text-warning"
                }`}
              >
                ₹{balance.toFixed(2)}
              </span>
            </div>
          </div>

          {balance !== 0 && (
            <div className="text-danger text-center small mt-2">
              Total paid + tip must exactly match the amount due
            </div>
          )}

          {isReadyToSettle && (
            <div className="text-success text-center small mt-2 fw-semibold">
              ✓ Ready to settle & print
            </div>
          )}
        </div>
      </Modal.Body>

      {/* Footer */}
      <Modal.Footer className="justify-content-between">
        <Button variant="outline-secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button
          variant="success"
          disabled={!isReadyToSettle}
          onClick={() =>
            handleSettleAndPrint({
              payments: paymentAmounts,
              tip,
            })
          }
        >
          Settle & Print
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SettlementModal;
