import React, { useState } from 'react';
import { Button, Card, Form, ListGroup, Row, Col } from 'react-bootstrap';

interface OrderType {
  name: string;
  isAdded: boolean;
}

const initialOrderTypes: OrderType[] = [
  { name: 'Dine-In', isAdded: false },
  { name: 'Takeaway', isAdded: false },
  { name: 'Delivery', isAdded: false },
  { name: 'Online', isAdded: false },
];

const OutletTypeConfiguration: React.FC = () => {
  const [orderTypes, setOrderTypes] = useState<OrderType[]>(initialOrderTypes);
  const [searchAvailableTerm, setSearchAvailableTerm] = useState<string>('');
  const [searchAddedTerm, setSearchAddedTerm] = useState<string>('');
  const [selectedOutlet, setSelectedOutlet] = useState<string>('');

  const handleAddOrderType = (typeName: string) => {
    setOrderTypes(
      orderTypes.map((type) =>
        type.name === typeName ? { ...type, isAdded: true } : type
      )
    );
  };

  const handleRemoveOrderType = (typeName: string) => {
    setOrderTypes(
      orderTypes.map((type) =>
        type.name === typeName ? { ...type, isAdded: false } : type
      )
    );
  };

  const handleSearchAvailable = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchAvailableTerm(e.target.value.toLowerCase());
  };

  const handleSearchAdded = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchAddedTerm(e.target.value.toLowerCase());
  };

  const filteredAvailableOrderTypes = orderTypes.filter(
    (type) =>
      !type.isAdded && type.name.toLowerCase().includes(searchAvailableTerm)
  );

  const filteredAddedOrderTypes = orderTypes.filter(
    (type) =>
      type.isAdded && type.name.toLowerCase().includes(searchAddedTerm)
  );

  const handleSaveChanges = () => {
    alert('Changes saved successfully!');
  };

  return (
    <Card className="m-3">
      <Card.Header>
        <h4 className="mb-0">Order Type Configuration</h4>
      </Card.Header>
      <Card.Body>
        <Row>
          {/* Available Order Types Section */}
          <Col md={4}>
            <h6>Available Order Types:</h6>
            <Form.Control
              type="text"
              placeholder="Search"
              className="mb-3"
              value={searchAvailableTerm}
              onChange={handleSearchAvailable}
            />
            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '4px' }}>
              <ListGroup variant="flush">
                {filteredAvailableOrderTypes.map((type) => (
                  <ListGroup.Item
                    key={type.name}
                    className="d-flex justify-content-between align-items-center"
                  >
                    {type.name}
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={() => handleAddOrderType(type.name)}
                    >
                      <i className="bi bi-arrow-right"></i>
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
          </Col>

          {/* Outlet Name Section */}
          <Col md={4} className="d-flex flex-column align-items-center">
            <div className="w-100">
              <h6>Outlet Name:</h6>
              <Form.Select
                value={selectedOutlet}
                onChange={(e) => setSelectedOutlet(e.target.value)}
                className="mb-3"
              >
                <option>Select Outlet</option>
                <option value="outlet1">Outlet 1</option>
                <option value="outlet2">Outlet 2</option>
              </Form.Select>
            </div>
          </Col>

          {/* Added Order Types Section */}
          <Col md={4}>
            <h6>Added Order Types:</h6>
            <Form.Control
              type="text"
              placeholder="Search"
              className="mb-3"
              value={searchAddedTerm}
              onChange={handleSearchAdded}
            />
            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #dee2e6', borderRadius: '4px' }}>
              <ListGroup variant="flush">
                {filteredAddedOrderTypes.map((type) => (
                  <ListGroup.Item
                    key={type.name}
                    className="d-flex justify-content-between align-items-center"
                  >
                    {type.name}
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleRemoveOrderType(type.name)}
                    >
                      <i className="bi bi-arrow-left"></i>
                    </Button>
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

export default OutletTypeConfiguration;