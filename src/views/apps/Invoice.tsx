import React from 'react';
import { Container, Table, Badge } from 'react-bootstrap';

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
          
          <div className="info-row p-3 bg-light rounded">
            <div className="d-flex justify-content-between">
              <div>
                <strong>Waiter:</strong> ASD
              </div>
              <div>
                <strong>PAX:</strong> 1
              </div>
              <div>
                <strong>KOT No:</strong> 26
              </div>
              <div>
                <strong>Date:</strong> 19-10-10
              </div>
            </div>
          </div>
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
      </div>

      <style jsx>{`
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
        
        .info-row {
          border-left: 4px solid #0d6efd;
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
        }
      `}</style>
    </Container>
  );
};

export default ModernBill;