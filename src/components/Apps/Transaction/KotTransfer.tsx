import React, { useState } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Form, Tabs, Tab, Dropdown } from 'react-bootstrap';

const TransferPage = () => {
  const [key, setKey] = useState('tableTransfer');
  const [selectedItems, setSelectedItems] = useState([]);

  // Mock data for Table Transfer
  const tableTransferData = {
    selected: {
      outlet: "Classic Veg",
      table: "C4",
      kot: "24",
      pax: "1",
      date: "19/Oct/",
      items: [
        { id: 1, media: "C4", kot: "24", name: "Masala Uttappa", quantity: 1, selected: false },
        { id: 2, media: "C4", kot: "24", name: "Rose Lassi", quantity: 1, selected: false },
        { id: 3, media: "C4", kot: "24", name: "Cheese Chilly Toast", quantity: 1, selected: false }
      ],
      totalAmount: 130.00,
      variance: 0.00,
      changeAmount: 0.00
    },
    proposed: {
      outlet: "Classic Veg",
      table: "C1",
      date: "19/Oct/",
      pax: "",
      status: "OCCUPIED",
      items: [
        { media: "C1", kot: "21", name: "Tomato Uttappa", quantity: 1 },
        { media: "C1", kot: "21", name: "Alu Palak", quantity: 1 }
      ],
      totalAmount: 71.00,
      variance: -59.00,
      changeAmount: 59.00
    }
  };

  // Mock data for KOT Transfer - similar but adjusted
  const kotTransferData = {
    selected: {
      outlet: "Classic Veg",
      table: "C4",
      kot: "24",
      pax: "1",
      date: "19/Oct/",
      items: [
        { id: 1, media: "C4", kot: "24", name: "Masala Uttappa", quantity: 1, selected: false },
        { id: 2, media: "C4", kot: "24", name: "Rose Lassi", quantity: 1, selected: false },
        { id: 3, media: "C4", kot: "24", name: "Cheese Chilly Toast", quantity: 1, selected: false }
      ],
      totalAmount: 0.00,
      variance: 130.00,
      changeAmount: 130.00
    },
    proposed: {
      outlet: "Classic Veg",
      table: "C1",
      date: "19/Oct/",
      pax: "1",
      status: "OCCUPIED",
      items: [
        { media: "C1", kot: "21", name: "Tomato Uttappa", quantity: 1 },
        { media: "C1", kot: "21", name: "Alu Palak", quantity: 1 }
      ],
      totalAmount: 71.00,
      variance: 130.00,
      changeAmount: -130.00
    }
  };

  const currentData = key === 'tableTransfer' ? tableTransferData : kotTransferData;
  const selectedData = currentData.selected;
  const proposedData = currentData.proposed;

  const handleItemSelection = (itemId) => {
    const updatedItems = selectedData.items.map(item => 
      item.id === itemId ? { ...item, selected: !item.selected } : item
    );
    const newSelectedItems = updatedItems.filter(item => item.selected);
    setSelectedItems(newSelectedItems);
  };

  const handleTransfer = () => {
    alert(`Transferring ${selectedItems.length} items to table ${proposedData.table}`);
    setSelectedItems([]);
  };

  return (
    <Container fluid className="p-4 bg-light min-vh-100">
      <Row className="mb-3">
        <Col>
          <div className="d-flex justify-content-between align-items-center bg-primary text-white p-3 rounded">
            <h1 className="mb-0 fw-bold">TRANSFER TABLE</h1>
            <Tabs
              activeKey={key}
              onSelect={(k) => setKey(k)}
              className="mb-0"
              justify
            >
              <Tab eventKey="tableTransfer" title="Table Transfer" />
              <Tab eventKey="kotTransfer" title="KOT Transfer" />
            </Tabs>
          </div>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Selected Table Section */}
        <Col md={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-light py-3 border-bottom">
              <h6 className="mb-0 fw-bold text-primary">Selected Table</h6>
            </Card.Header>
            <Card.Body className="p-3">
              <Form.Group className="mb-2">
                <Form.Label className="fw-bold small">Table:</Form.Label>
                <Form.Control size="sm" value={selectedData.table} readOnly />
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="fw-bold small">Outlet:</Form.Label>
                <Dropdown size="sm">
                  <Dropdown.Toggle variant="outline-secondary" id="selected-outlet">
                    {selectedData.outlet}
                  </Dropdown.Toggle>
                </Dropdown>
              </Form.Group>
              <Row className="mb-3">
                <Col>
                  <Form.Group>
                    <Form.Label className="fw-bold small">KOT:</Form.Label>
                    <Form.Control size="sm" value={selectedData.kot} readOnly />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Label className="fw-bold small">Pax:</Form.Label>
                    <Form.Control size="sm" value={selectedData.pax} readOnly />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Label className="fw-bold small">Date:</Form.Label>
                    <Form.Control size="sm" value={selectedData.date} readOnly />
                  </Form.Group>
                </Col>
              </Row>

              <Table size="sm" responsive className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th width="5%">Select</th>
                    <th width="15%">Media</th>
                    <th width="15%">KOT No.</th>
                    <th>Item</th>
                    <th width="10%">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedData.items.map(item => (
                    <tr key={item.id} className={item.selected ? 'table-active' : ''}>
                      <td>
                        <Form.Check 
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => handleItemSelection(item.id)}
                        />
                      </td>
                      <td><Badge bg="secondary">{item.media}</Badge></td>
                      <td><Badge bg="secondary">{item.kot}</Badge></td>
                      <td className="fw-semibold">{item.name}</td>
                      <td><Badge bg="light" text="dark">{item.quantity}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <Row className="mt-3 text-center">
                <Col><div className="fw-bold">Total Amount<br />₹{selectedData.totalAmount.toFixed(2)}</div></Col>
                <Col><div className="fw-bold">Variance<br />₹{selectedData.variance.toFixed(2)}</div></Col>
                <Col><div className="fw-bold">Change Amount<br />₹{selectedData.changeAmount.toFixed(2)}</div></Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* Proposed Table Section */}
        <Col md={6}>
          <Card className="h-100 border-0 shadow-sm">
            <Card.Header className="bg-light py-3 border-bottom">
              <h6 className="mb-0 fw-bold text-warning">Proposed Table</h6>
            </Card.Header>
            <Card.Body className="p-3">
              <Form.Group className="mb-2">
                <Form.Label className="fw-bold small">Outlet:</Form.Label>
                <Dropdown size="sm">
                  <Dropdown.Toggle variant="outline-secondary" id="proposed-outlet">
                    {proposedData.outlet}
                  </Dropdown.Toggle>
                </Dropdown>
              </Form.Group>
              <Form.Group className="mb-2">
                <Form.Label className="fw-bold small">Table:</Form.Label>
                <Form.Control size="sm" value={proposedData.table} readOnly />
              </Form.Group>
              <Row className="mb-3">
                <Col>
                  <Form.Group>
                    <Form.Label className="fw-bold small">Date:</Form.Label>
                    <Form.Control size="sm" value={proposedData.date} readOnly />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Label className="fw-bold small">Pax:</Form.Label>
                    <Form.Control size="sm" value={proposedData.pax || '-'} readOnly />
                  </Form.Group>
                </Col>
              </Row>
              <div className="d-flex align-items-center mb-3">
                <Badge bg="dark" className="me-2">{proposedData.status}</Badge>
              </div>

              <Table size="sm" responsive className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th width="15%">Media</th>
                    <th width="15%">KOT No.</th>
                    <th>Item</th>
                    <th width="10%">Qty</th>
                  </tr>
                </thead>
                <tbody>
                  {proposedData.items.map((item, index) => (
                    <tr key={index}>
                      <td><Badge bg="secondary">{item.media}</Badge></td>
                      <td><Badge bg="secondary">{item.kot}</Badge></td>
                      <td className="fw-semibold">{item.name}</td>
                      <td><Badge bg="light" text="dark">{item.quantity}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <Row className="mt-3 text-center">
                <Col><div className="fw-bold">Total Amount<br />₹{proposedData.totalAmount.toFixed(2)}</div></Col>
                <Col><div className="fw-bold">Variance<br />₹{proposedData.variance.toFixed(2)}</div></Col>
                <Col><div className="fw-bold">Change Amount<br />₹{proposedData.changeAmount.toFixed(2)}</div></Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col className="text-center">
          <Button 
            variant="primary" 
            size="lg" 
            className="px-4 py-2 fw-bold"
            onClick={handleTransfer}
            disabled={selectedItems.length === 0}
          >
            → Transfer Selected Items
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default TransferPage;