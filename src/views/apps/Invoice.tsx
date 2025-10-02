import React, { useState } from "react";
import { Modal, Button, Card, Row, Col, Form } from "react-bootstrap";

interface Props {
  showSettlementModal: boolean;
  setShowSettlementModal: (show: boolean) => void;
  grandTotal: number;
}

const PaymentModal: React.FC<Props> = ({
  showSettlementModal,
  setShowSettlementModal,
  grandTotal,
}) => {
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);

  const [cardDetails, setCardDetails] = useState({
    name: "",
    number: "",
    expiry: "",
    cvv: "",
  });
  const [upiTxnId, setUpiTxnId] = useState("");

  const totalPaid = grandTotal;
  const balanceDue = grandTotal - totalPaid;

  const handlePaymentClick = (mode: string) => {
    setSelectedPayment(mode);
    if (mode === "Card") setShowCardModal(true);
    if (mode === "Paytm" || mode === "Google Pay") setShowUpiModal(true);
  };

  const handleConfirmCard = () => {
    console.log("Card Payment Confirmed", cardDetails);
    setShowCardModal(false);
  };

  const handleConfirmUpi = () => {
    console.log("UPI Payment Confirmed", upiTxnId);
    setShowUpiModal(false);
  };

  return (
    <>
      {/* Main Settlement Modal */}
      <Modal
        show={showSettlementModal}
        onHide={() => setShowSettlementModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Payment Method</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {/* Payment Mode Options */}
          <h6 className="mb-3">Select Payment Method</h6>
          <Row xs={2} md={2} className="g-3">
            {["Cash", "Card", "Paytm", "Google Pay"].map((mode) => (
              <Col key={mode}>
                <Card
                  className={`p-3 text-center ${
                    selectedPayment === mode ? "border-primary border-2" : ""
                  }`}
                  style={{ cursor: "pointer" }}
                  onClick={() => handlePaymentClick(mode)}
                >
                  <Card.Body>
                    <Card.Title>{mode}</Card.Title>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Payment Summary */}
          <div className="mt-4 p-3 bg-light rounded shadow-sm">
            <div className="d-flex justify-content-between fw-bold fs-5">
              <span>Total Paid:</span>
              <span className="text-primary">₹{totalPaid.toFixed(2)}</span>
            </div>
            <div className="d-flex justify-content-between fw-bold fs-5">
              <span>Balance Due:</span>
              <span className="text-success">₹{balanceDue.toFixed(2)}</span>
            </div>
            <div className="text-success mt-2 small">
              ✓ Ready to settle payment
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowSettlementModal(false)}
          >
            Back
          </Button>
          <Button variant="success">Settle & Print</Button>
        </Modal.Footer>
      </Modal>

      {/* Card Payment Modal */}
      <Modal show={showCardModal} onHide={() => setShowCardModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Card Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Cardholder Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="John Doe"
                value={cardDetails.name}
                onChange={(e) =>
                  setCardDetails({ ...cardDetails, name: e.target.value })
                }
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Card Number</Form.Label>
              <Form.Control
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardDetails.number}
                onChange={(e) =>
                  setCardDetails({ ...cardDetails, number: e.target.value })
                }
              />
            </Form.Group>
            <div className="d-flex gap-2">
              <Form.Group className="mb-3 flex-fill">
                <Form.Label>Expiry (MM/YY)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="12/25"
                  value={cardDetails.expiry}
                  onChange={(e) =>
                    setCardDetails({ ...cardDetails, expiry: e.target.value })
                  }
                />
              </Form.Group>
              <Form.Group className="mb-3 flex-fill">
                <Form.Label>CVV</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="123"
                  value={cardDetails.cvv}
                  onChange={(e) =>
                    setCardDetails({ ...cardDetails, cvv: e.target.value })
                  }
                />
              </Form.Group>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary">Swipe/Insert</Button>
          <Button variant="success" onClick={handleConfirmCard}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>

      {/* UPI Payment Modal */}
      <Modal show={showUpiModal} onHide={() => setShowUpiModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>UPI Payment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-2">Scan QR code and enter Transaction ID</div>
          <Form.Control
            type="text"
            placeholder="Transaction ID"
            value={upiTxnId}
            onChange={(e) => setUpiTxnId(e.target.value)}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="success" onClick={handleConfirmUpi}>
            Confirm Payment
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default PaymentModal;
