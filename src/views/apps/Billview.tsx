import React from 'react';
import { Container, Row, Col, Card, Table, Badge, Button } from 'react-bootstrap';

const ModernBill = () => {
  return (
    <Container className="py-4">
      <div className="modern-bill p-4 shadow-lg rounded">
        {/* Header Section */}
        <div className="bill-header mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="text-primary mb-0">BILL</h2>
            <span className="text-muted">Group Item (Ctrl+G)(For Special Instructions - Press F4)</span>
          </div>
          
          {/* Card Layout for Header Information */}
          <Row className="g-3 mb-3">
            <Col md={3}>
              <Card className="h-100 text-center info-card">
                <Card.Body className="py-2">
                  <Card.Title className="small text-muted mb-1">Waiter</Card.Title>
                  <Card.Text className="fw-bold mb-0">ASD</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={2}>
              <Card className="h-100 text-center info-card">
                <Card.Body className="py-2">
                  <Card.Title className="small text-muted mb-1">PAX</Card.Title>
                  <Card.Text className="fw-bold mb-0">1</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={2}>
              <Card className="h-100 text-center info-card">
                <Card.Body className="py-2">
                  <Card.Title className="small text-muted mb-1">KOT No</Card.Title>
                  <Card.Text className="fw-bold mb-0">26</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="h-100 text-center info-card">
                <Card.Body className="py-2">
                  <Card.Title className="small text-muted mb-1">Date</Card.Title>
                  <Card.Text className="fw-bold mb-0">19-10-10</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={2}>
              <Card className="h-100 text-center total-card">
                <Card.Body className="py-2">
                  <Card.Title className="small text-white mb-1">Total</Card.Title>
                  <Card.Text className="fw-bold text-white mb-0">₹70.00</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Items Table */}
        <div className="items-table mb-4">
          <Table responsive bordered className="modern-table">
            <thead className="table-primary">
              <tr>
                <th>No</th>
                <th>Item Name</th>
                <th className="text-center">Qty</th>
                <th className="text-end">Rate</th>
                <th className="text-end">Total</th>
                <th className="text-center">MkotNo/Time</th>
                <th>Special Instructions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>123</td>
                <td>Alu Palak</td>
                <td className="text-center">1</td>
                <td className="text-end">48</td>
                <td className="text-end">48.00</td>
                <td className="text-center">
                  <Badge bg="secondary">21/06:27 A</Badge>
                </td>
                <td></td>
              </tr>
              <tr>
                <td>33</td>
                <td>Tomato Uttappa</td>
                <td className="text-center">1</td>
                <td className="text-end">23</td>
                <td className="text-end">23.00</td>
                <td className="text-center">
                  <Badge bg="secondary">21/06:27 A</Badge>
                </td>
                <td></td>
              </tr>
            </tbody>
          </Table>
        </div>

        {/* Summary Section */}
        <div className="summary-section">
          <Table responsive bordered className="modern-table">
            <thead className="table-secondary">
              <tr>
                <th>Discount (#3)</th>
                <th className="text-end">Gross Amt</th>
                <th className="text-end">Rev KOT(+)</th>
                <th className="text-center">Disc(+)</th>
                <th className="text-end">CGST (+)</th>
                <th className="text-end">SGST (+)</th>
                <th className="text-end">R. Off (+)</th>
                <th className="text-center">Ser Chg (+)</th>
                <th className="text-end">Final Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>N C KDT</td>
                <td className="text-end">71.00</td>
                <td className="text-end">0.00</td>
                <td className="text-center">0</td>
                <td className="text-end">0.00</td>
                <td className="text-end">0.00</td>
                <td className="text-end">-1.00</td>
                <td className="text-center">O</td>
                <td className="text-end fw-bold text-success">70.00</td>
              </tr>
            </tbody>
          </Table>
        </div>

        {/* Footer with Function Keys */}
        <Card className="mt-4 footer-card">
          <Card.Body className="py-2">
            <div className="d-flex flex-wrap justify-content-center gap-2">
              <Button variant="outline-primary" size="sm" className="function-btn">KOT Tr (F2)</Button>
              <Button variant="outline-primary" size="sm" className="function-btn">Rev Bill (F5)</Button>
              <Button variant="outline-primary" size="sm" className="function-btn">TBL Tr (F7)</Button>
              <Button variant="outline-primary" size="sm" className="function-btn">New Bill (F6)</Button>
              <Button variant="outline-primary" size="sm" className="function-btn">Rev KOT (F8)</Button>
              <Button variant="outline-primary" size="sm" className="function-btn">K O T (F9)</Button>
              <Button variant="outline-primary" size="sm" className="function-btn">Print (F10)</Button>
              <Button variant="outline-primary" size="sm" className="function-btn">Settle (F11)</Button>
              <Button variant="outline-primary" size="sm" className="function-btn">Exit (Esc)</Button>
            </div>
          </Card.Body>
        </Card>
      </div>

      <style >{`
        .modern-bill {
          background: white;
          border: 1px solid #e0e0e0;
        }
        
        .modern-table {
          font-size: 0.9rem;
        }
        
        .modern-table th {
          font-weight: 600;
          border-bottom: 2px solid #dee2e6;
        }
        
        .modern-table td, .modern-table th {
          padding: 0.75rem;
          vertical-align: middle;
        }
        
        .info-card {
          border: 1px solid #dee2e6;
          transition: all 0.3s ease;
        }
        
        .info-card:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }
        
        .total-card {
          background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
          border: none;
          color: white;
        }
        
        .footer-card {
          border: 1px solid #dee2e6;
          background: #f8f9fa;
        }
        
        .function-btn {
          border-radius: 15px;
          font-size: 0.75rem;
          padding: 4px 12px;
          min-width: 80px;
        }
        
        .bill-header h2 {
          font-weight: 700;
          letter-spacing: 1px;
        }
        
        @media (max-width: 768px) {
          .modern-table {
            font-size: 0.8rem;
          }
          
          .modern-table td, .modern-table th {
            padding: 0.5rem;
          }
          
          .function-btn {
            font-size: 0.7rem;
            padding: 3px 8px;
            min-width: 70px;
          }
        }
      `}</style>
    </Container>
  );
};

export default ModernBill;