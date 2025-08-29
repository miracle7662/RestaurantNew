import React, { useState, useEffect } from 'react';
import { Button, Card, Form, ListGroup, Row, Col } from 'react-bootstrap';
import axios from 'axios';

interface PaymentMode {
  id?: number;
  outletid: number;
  mode_name: string;
  is_active: number;
}

interface Outlet {
  outletid: number;
  outlet_name: string;
}

const PaymentModes: React.FC = () => {
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<string>('');
  const [selectedModesLeft, setSelectedModesLeft] = useState<string[]>([]);
  const [selectedModesRight, setSelectedModesRight] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchTermRight, setSearchTermRight] = useState<string>('');

  // Fetch outlets and payment modes on component mount or outlet change
  useEffect(() => {
    fetchOutlets();
  }, []);

  useEffect(() => {
    if (selectedOutlet) {
      fetchPaymentModes();
    } else {
      setPaymentModes([]); // Clear payment modes if no outlet is selected
    }
  }, [selectedOutlet]);

  // Fetch all outlets for dropdown
  const fetchOutlets = async () => {
    try {
      const response = await axios.get('/api/payment-modes/dropdown/outlets');
      setOutlets(response.data);
    } catch (error) {
      console.error('Error fetching outlets:', error);
      alert('Failed to fetch outlets');
    }
  };

  // Fetch payment modes for the selected outlet
  const fetchPaymentModes = async () => {
    try {
      const response = await axios.get('/api/payment-modes', {
        params: { outletid: selectedOutlet },
      });
      setPaymentModes(response.data.map((mode: PaymentMode) => ({
        ...mode,
        is_active: mode.is_active ?? 1,
      })));
    } catch (error) {
      console.error('Error fetching payment modes:', error);
      alert('Failed to fetch payment modes');
    }
  };

  // Create a new payment mode
  const handleAddPaymentMode = async (modeName: string) => {
    if (!selectedOutlet) {
      alert('Please select an outlet');
      return;
    }
    try {
      const response = await axios.post('/api/payment-modes', {
        outletid: parseInt(selectedOutlet),
        mode_name: modeName,
        is_active: 1,
      });
      setPaymentModes((prev) => [...prev, response.data]);
    } catch (error) {
      console.error('Error adding payment mode:', error);
      alert('Failed to add payment mode');
    }
  };

  // Delete a payment mode
  const handleRemovePaymentMode = async (modeId: number) => {
    try {
      await axios.delete(`/api/payment-modes/${modeId}`);
      setPaymentModes((prev) => prev.filter((mode) => mode.id !== modeId));
      setSelectedModesRight((prev) => prev.filter((id) => id !== modeId.toString()));
    } catch (error) {
      console.error('Error deleting payment mode:', error);
      alert('Failed to delete payment mode');
    }
  };

  // Handle selection on the left side (simulated available modes)
  const handleSelectPaymentModeLeft = (modeName: string) => {
    setSelectedModesLeft((prev) =>
      prev.includes(modeName)
        ? prev.filter((name) => name !== modeName)
        : [...prev, modeName]
    );
  };

  // Handle selection on the right side (Added Payment Modes)
  const handleSelectPaymentModeRight = (modeId: string) => {
    setSelectedModesRight((prev) =>
      prev.includes(modeId)
        ? prev.filter((id) => id !== modeId)
        : [...prev, modeId]
    );
  };

  // Move selected payment modes from left to right
  const handleSingleTransferToRight = () => {
    if (!selectedOutlet) {
      alert('Please select an outlet');
      return;
    }
    selectedModesLeft.forEach((modeName) => handleAddPaymentMode(modeName));
    setSelectedModesLeft([]);
  };

  // Move selected payment modes from right to left
  const handleSingleTransferToLeft = () => {
    selectedModesRight.forEach((modeId) => handleRemovePaymentMode(parseInt(modeId)));
    setSelectedModesRight([]);
  };

  // Move all available payment modes to the right (simulated)
  const handleMultiTransferToRight = async () => {
    if (!selectedOutlet) {
      alert('Please select an outlet');
      return;
    }
    const availableModes = [
      'Paytm', 'GooglePay', 'Freecharge', 'Card', 'Zomato', 'Swiggy', 'UberEats', 'BhimPay',
    ].filter((mode) => !paymentModes.some((pm) => pm.mode_name === mode));
    for (const mode of availableModes) {
      await handleAddPaymentMode(mode);
    }
  };

  // Remove all added payment modes
  const handleMultiTransferToLeft = async () => {
    const addedModes = paymentModes.filter((mode) => mode.id);
    for (const mode of addedModes) {
      await handleRemovePaymentMode(mode.id!);
    }
  };

  // Handle search for left and right sides
  const handleSearchLeft = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const handleSearchRight = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTermRight(e.target.value.toLowerCase());
  };

  // Save changes (placeholder)
  const handleSaveChanges = () => {
    alert('Changes saved successfully!');
  };

  // Filter for available (left side) payment modes (simulated)
  const filteredPaymentModesLeft = [
    'Paytm', 'GooglePay', 'Freecharge', 'Card', 'Zomato', 'Swiggy', 'UberEats', 'BhimPay',
  ]
    .filter((mode) => !paymentModes.some((pm) => pm.mode_name === mode))
    .filter((mode) => mode.toLowerCase().includes(searchTerm));

  // Filter for added (right side) payment modes
  const filteredPaymentModesRight = paymentModes.filter(
    (mode) => mode.id && mode.mode_name.toLowerCase().includes(searchTermRight)
  );

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
                    key={mode}
                    className="d-flex justify-content-between align-items-center"
                    onClick={() => handleSelectPaymentModeLeft(mode)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: selectedModesLeft.includes(mode) ? '#007bff' : 'transparent',
                      color: selectedModesLeft.includes(mode) ? '#fff' : 'inherit',
                    }}
                  >
                    {mode}
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
                <option value="">Select Outlet</option>
                {outlets.map((outlet) => (
                  <option key={outlet.outletid} value={outlet.outletid}>
                    {outlet.outlet_name}
                  </option>
                ))}
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
                    key={mode.id}
                    className="d-flex justify-content-between align-items-center"
                    onClick={() => handleSelectPaymentModeRight(mode.id!.toString())}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: selectedModesRight.includes(mode.id!.toString()) ? '#007bff' : 'transparent',
                      color: selectedModesRight.includes(mode.id!.toString()) ? '#fff' : 'inherit',
                    }}
                  >
                    {mode.mode_name}
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