import React, { useState } from 'react';
import { Button, Card, Form, ListGroup, Row, Col } from 'react-bootstrap';

interface PaymentMode {
  name: string;
  isAdded: boolean;
}

const initialPaymentModes: PaymentMode[] = [
  { name: 'Paytm', isAdded: false },
  { name: 'GooglePay', isAdded: false },
  { name: 'Freecharge', isAdded: false },
  { name: 'Card', isAdded: false },
  { name: 'Zomato', isAdded: false },
  { name: 'Swiggy', isAdded: false },
  { name: 'UberEats', isAdded: false },
  { name: 'BhimPay', isAdded: false },
];

const PaymentModes: React.FC = () => {
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>(initialPaymentModes);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedOutlet, setSelectedOutlet] = useState<string>('');
  const [selectedModesLeft, setSelectedModesLeft] = useState<string[]>([]); // For left side
  const [selectedModesRight, setSelectedModesRight] = useState<string[]>([]); // For right side
  const [searchTermRight, setSearchTermRight] = useState<string>(''); // Search for right side

  // Handle selection on the left side (Available Payment Modes)
  const handleSelectPaymentModeLeft = (modeName: string): void => {
    setSelectedModesLeft((prev) => {
      const newSelectedModes = prev.includes(modeName)
        ? prev.filter((name) => name !== modeName)
        : [...prev, modeName];
      console.log('Selected Modes (Left):', newSelectedModes);
      return newSelectedModes;
    });
  };

  // Handle selection on the right side (Added Payment Modes)
  const handleSelectPaymentModeRight = (modeName: string): void => {
    setSelectedModesRight((prev) => {
      const newSelectedModes = prev.includes(modeName)
        ? prev.filter((name) => name !== modeName)
        : [...prev, modeName];
      console.log('Selected Modes (Right):', newSelectedModes);
      return newSelectedModes;
    });
  };

  // Add a single payment mode to the right side
  const handleAddPaymentMode = (modeName: string): void => {
    setPaymentModes((prev) => {
      const updatedModes = prev.map((mode) =>
        mode.name === modeName ? { ...mode, isAdded: true } : mode
      );
      console.log('Updated Payment Modes after adding:', updatedModes);
      return updatedModes;
    });
  };

  // Remove a single payment mode from the right side
  const handleRemovePaymentMode = (modeName: string): void => {
    setPaymentModes((prev) => {
      const updatedModes = prev.map((mode) =>
        mode.name === modeName ? { ...mode, isAdded: false } : mode
      );
      console.log('Updated Payment Modes after removing:', updatedModes);
      return updatedModes;
    });
  };

  const handleSearchLeft = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleSearchRight = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTermRight(e.target.value.toLowerCase());
  };

  // Move selected payment modes from left to right
  const handleSingleTransferToRight = (): void => {
    if (selectedModesLeft.length > 0) {
      console.log('Moving selected modes to right:', selectedModesLeft);
      selectedModesLeft.forEach((modeName) => handleAddPaymentMode(modeName));
      setSelectedModesLeft([]);
    } else {
      console.log('No modes selected on the left to transfer');
    }
  };

  // Move selected payment modes from right to left
  const handleSingleTransferToLeft = (): void => {
    if (selectedModesRight.length > 0) {
      console.log('Moving selected modes to left:', selectedModesRight);
      selectedModesRight.forEach((modeName) => handleRemovePaymentMode(modeName));
      setSelectedModesRight([]);
    } else {
      console.log('No modes selected on the right to transfer');
    }
  };

  // Move all unselected payment modes to the right side
  const handleMultiTransferToRight = (): void => {
    setPaymentModes((prev) =>
      prev.map((mode) =>
        !mode.isAdded ? { ...mode, isAdded: true } : mode
      )
    );
    setSelectedModesLeft([]);
  };

  // Remove all added payment modes back to the left side
  const handleMultiTransferToLeft = (): void => {
    setPaymentModes((prev) =>
      prev.map((mode) =>
        mode.isAdded ? { ...mode, isAdded: false } : mode
      )
    );
    setSelectedModesRight([]);
  };

  // Filter for available (left side) payment modes
  const filteredPaymentModesLeft = paymentModes.filter(
    (mode) =>
      !mode.isAdded && mode.name.toLowerCase().includes(searchTerm)
  );

  // Filter for added (right side) payment modes
  const filteredPaymentModesRight = paymentModes.filter(
    (mode) =>
      mode.isAdded && mode.name.toLowerCase().includes(searchTermRight)
  );

  const handleSaveChanges = (): void => {
    alert('Changes saved successfully!');
  };

  return (
    <Card className="m-0">
      <Card.Header>
        <h4 className="mb-0">Payment Modes</h4>
      </Card.Header>
      <Card.Body>
        <Row>
          <Col md={4}>
            <h6>Available Payment Modes:</h6>
            <Form.Control
              style={{ borderColor: '#ccc' }}
              type="text"
              placeholder="Search"
              className="mb-3"
              value={searchTerm}
              onChange={handleSearchLeft}
            />
            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '4px' }}>
              <ListGroup variant="flush">
                {filteredPaymentModesLeft.map((mode) => (
                  <ListGroup.Item
                    key={mode.name}
                    className="d-flex justify-content-between align-items-center"
                    onClick={() => handleSelectPaymentModeLeft(mode.name)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: selectedModesLeft.includes(mode.name) ? '#007bff' : 'transparent',
                      color: selectedModesLeft.includes(mode.name) ? '#fff' : 'inherit',
                    }}
                  >
                    {mode.name}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          </Col>

          <Col md={4} className="d-flex flex-column align-items-center">
            <div className="w-100">
              <h6>Outlet Name: <span className="text-danger"> *</span></h6>
              <Form.Select
                style={{ borderColor: '#ccc' }}
                value={selectedOutlet}
                onChange={(e) => setSelectedOutlet(e.target.value)}
                className="mb-3"
              >
                <option>Select Outlet</option>
                <option value="outlet1">Outlet 1</option>
                <option value="outlet2">Outlet 2</option>
              </Form.Select>
              <div
                className="d-flex flex-column align-items-center w-100 mb-3"
                style={{
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  padding: '10px',
                }}
              >
                <Button
                  variant="light"
                  className="w-100 mb-1 d-flex justify-content-center align-items-center"
                  style={{
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    height: '38px',
                  }}
                  onClick={handleMultiTransferToRight}
                >
                  <span>{'\u003E\u003E'}</span>
                </Button>
                <Button
                  variant="light"
                  className="w-100 mb-1 d-flex justify-content-center align-items-center"
                  style={{
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    height: '38px',
                  }}
                  onClick={handleSingleTransferToRight}
                  disabled={selectedModesLeft.length === 0}
                >
                  <span>{'\u003E'}</span>
                </Button>
                <Button
                  variant="light"
                  className="w-100 mb-1 d-flex justify-content-center align-items-center"
                  style={{
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    height: '38px',
                  }}
                  onClick={handleSingleTransferToLeft}
                  disabled={selectedModesRight.length === 0}
                >
                  <span>{'\u003C'}</span>
                </Button>
                <Button
                  variant="light"
                  className="w-100 d-flex justify-content-center align-items-center"
                  style={{
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    height: '38px',
                  }}
                  onClick={handleMultiTransferToLeft}
                >
                  <span>{'\u003C\u003C'}</span>
                </Button>
              </div>
            </div>
          </Col>

          <Col md={4}>
            <h6>Added Payment Modes:</h6>
            <Form.Control
              style={{ borderColor: '#ccc' }}
              type="text"
              placeholder="Search"
              className="mb-3"
              value={searchTermRight}
              onChange={handleSearchRight}
            />
            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '4px' }}>
              <ListGroup variant="flush">
                {filteredPaymentModesRight.map((mode) => (
                  <ListGroup.Item
                    key={mode.name}
                    className="d-flex justify-content-between align-items-center"
                    onClick={() => handleSelectPaymentModeRight(mode.name)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: selectedModesRight.includes(mode.name) ? '#007bff' : 'transparent',
                      color: selectedModesRight.includes(mode.name) ? '#fff' : 'inherit',
                    }}
                  >
                    {mode.name}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          </Col>
        </Row>
      </Card.Body>
      <Card.Footer className="text-end">
        <Button variant="success" onClick={handleSaveChanges}>
          Save Changes
        </Button>
      </Card.Footer>
    </Card>
  );
};

export default PaymentModes;