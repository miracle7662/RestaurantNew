import React, { useState, useEffect } from 'react';
import { Button, Card, Form, ListGroup, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import { fetchOutletsForDropdown } from '@/utils/commonfunction';
import { OutletData } from '@/common/api/outlet';
import { useAuthContext } from '@/common';
import { toast } from 'react-hot-toast';

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
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedOutlet, setSelectedOutlet] = useState<string>(
    localStorage.getItem('lastSelectedOutlet') || ''
  );
  const [selectedModesLeft, setSelectedModesLeft] = useState<string[]>([]);
  const [selectedModesRight, setSelectedModesRight] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchTermRight, setSearchTermRight] = useState<string>('');
  const { user } = useAuthContext();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [availablePaymentModes, setAvailablePaymentModes] = useState<string[]>([]);

  // Fetch outlets and payment modes on component mount
  useEffect(() => {
    fetchOutletsForDropdown(user, setOutlets, setLoading);
    fetchAvailablePaymentModes();
    if (selectedOutlet) {
      fetchPaymentModes();
    }
  }, []); // Runs once on mount

  // Fetch payment modes when selectedOutlet changes
  useEffect(() => {
    if (selectedOutlet) {
      fetchPaymentModes();
      localStorage.setItem('lastSelectedOutlet', selectedOutlet); // Save last selected outlet
    } else {
      setPaymentModes([]);
      localStorage.removeItem('lastSelectedOutlet');
    }
  }, [selectedOutlet]);

  // Fetch available payment modes
  const fetchAvailablePaymentModes = async () => {
    try {
      const response = await axios.get('/api/payment');
      const modes = response.data.map((mode: any) => mode.method_name);
      setAvailablePaymentModes(modes);
    } catch (error) {
      console.error('Error fetching available payment modes:', error);
      toast.error('Failed to fetch available payment modes');
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
      toast.error('Failed to fetch payment modes');
    }
  };

  // Add a new payment mode
  const handleAddPaymentMode = async (modeName: string) => {
    if (!selectedOutlet) {
      toast.error('Please select an outlet');
      return;
    }
    try {
      const response = await axios.post('/api/payment-modes', {
        outletid: parseInt(selectedOutlet),
        mode_name: modeName,
        is_active: 1,
      });
      setPaymentModes((prev) => [...prev, response.data]);
      setSelectedModesLeft((prev) => prev.filter((name) => name !== modeName));
      await fetchPaymentModes();
    } catch (error) {
      console.error('Error adding payment mode:', error);
      toast.error('Failed to add payment mode');
    }
  };

  // Remove a payment mode
  const handleRemovePaymentMode = async (modeId: number | string) => {
    const id = typeof modeId === 'string' ? parseInt(modeId) : modeId;
    if (!id || isNaN(id)) {
      toast.error('Invalid payment mode ID');
      return;
    }
    try {
      await axios.delete(`/api/payment-modes/${id}`);
      setPaymentModes((prev) => prev.filter((mode) => mode.id !== id));
      setSelectedModesRight((prev) => prev.filter((mid) => mid !== modeId.toString()));
      await fetchPaymentModes();
    } catch (error) {
      console.error('Error deleting payment mode:', error);
      toast.error('Failed to delete payment mode');
    }
  };

  // Handle selection on the left side (available modes)
  const handleSelectPaymentModeLeft = (modeName: string) => {
    setSelectedModesLeft((prev) =>
      prev.includes(modeName) ? prev.filter((name) => name !== modeName) : [...prev, modeName]
    );
  };

  // Handle selection on the right side (added modes)
  const handleSelectPaymentModeRight = (modeId: string | number) => {
    const idStr = modeId.toString();
    setSelectedModesRight((prev) =>
      prev.includes(idStr) ? prev.filter((id) => id !== idStr) : [...prev, idStr]
    );
  };

  // Move selected payment modes from left to right
  const handleSingleTransferToRight = async () => {
    if (!selectedOutlet) {
      toast.error('Please select an outlet');
      return;
    }
    for (const modeName of selectedModesLeft) {
      await handleAddPaymentMode(modeName);
    }
    setSelectedModesLeft([]);
  };

  // Move selected payment modes from right to left
  const handleSingleTransferToLeft = async () => {
    for (const modeId of selectedModesRight) {
      await handleRemovePaymentMode(modeId);
    }
    setSelectedModesRight([]);
  };

  // Move all available payment modes to the right
  const handleMultiTransferToRight = async () => {
    if (!selectedOutlet) {
      toast.error('Please select an outlet');
      return;
    }
    const availableModes = availablePaymentModes.filter((mode) =>
      !paymentModes.some((pm) => pm.mode_name === mode)
    );
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

  // Save changes and reload data
  const handleSaveChanges = async () => {
    // Add any additional save logic if needed (e.g., sending updated data to backend)
    toast.success('Changes saved successfully!');
    if (selectedOutlet) {
      await fetchPaymentModes(); // Refresh current outlet data
      localStorage.setItem('lastSelectedOutlet', selectedOutlet); // Ensure last outlet is saved
    }
  };

  // Filter for available (left side) payment modes
  const filteredPaymentModesLeft = availablePaymentModes
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
                style={{ border: '1px solid #dee2e6', borderRadius: '4px', padding: '10px' }}
              >
                <Button
                  variant="light"
                  className="w-100 mb-1 d-flex justify-content-center align-items-center"
                  style={{ border: '1px solid #dee2e6', borderRadius: '4px', height: '38px' }}
                  onClick={handleMultiTransferToRight}
                >
                  <span>{'\u003E\u003E'}</span>
                </Button>
                <Button
                  variant="light"
                  className="w-100 mb-1 d-flex justify-content-center align-items-center"
                  style={{ border: '1px solid #dee2e6', borderRadius: '4px', height: '38px' }}
                  onClick={handleSingleTransferToRight}
                  disabled={selectedModesLeft.length === 0}
                >
                  <span>{'\u003E'}</span>
                </Button>
                <Button
                  variant="light"
                  className="w-100 mb-1 d-flex justify-content-center align-items-center"
                  style={{ border: '1px solid #dee2e6', borderRadius: '4px', height: '38px' }}
                  onClick={handleSingleTransferToLeft}
                  disabled={selectedModesRight.length === 0}
                >
                  <span>{'\u003C'}</span>
                </Button>
                <Button
                  variant="light"
                  className="w-100 d-flex justify-content-center align-items-center"
                  style={{ border: '1px solid #dee2e6', borderRadius: '4px', height: '38px' }}
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
                    key={mode.id || mode.mode_name}
                    className="d-flex justify-content-between align-items-center"
                    onClick={() => handleSelectPaymentModeRight(mode.id || mode.mode_name)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: selectedModesRight.includes((mode.id || mode.mode_name).toString()) ? '#007bff' : 'transparent',
                      color: selectedModesRight.includes((mode.id || mode.mode_name).toString()) ? '#fff' : 'inherit',
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