import React, { useState, useEffect } from "react";
import { Card, Table, Form, Button, Row, Col } from "react-bootstrap";

const ReportPage = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [filteredBills, setFilteredBills] = useState<any[]>([]);
  const [reportType, setReportType] = useState("daily");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [stats, setStats] = useState({
    totalBills: 0,
    totalSales: 0,
    totalDiscount: 0,
    totalTax: 0,
    totalQty: 0,
  });

  useEffect(() => {
    const quickBills = JSON.parse(localStorage.getItem("quickBills") || "[]");
    const normalBills = JSON.parse(localStorage.getItem("normalBills") || "[]");
    const allBills = [...quickBills, ...normalBills];
    setBills(allBills);
    filterBills(allBills);
  }, [reportType]);

  const filterBills = (data: any[]) => {
    const today = new Date();
    let filtered = [];

    if (reportType === "daily") {
      filtered = data.filter((bill) => {
        const d = new Date(bill.date || bill.createdAt);
        return d.toDateString() === today.toDateString();
      });
    } else if (reportType === "monthly") {
      filtered = data.filter((bill) => {
        const d = new Date(bill.date || bill.createdAt);
        return (
          d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
        );
      });
    } else if (reportType === "custom") {
      if (customRange.start && customRange.end) {
        const start = new Date(customRange.start);
        const end = new Date(customRange.end);
        filtered = data.filter((bill) => {
          const d = new Date(bill.date || bill.createdAt);
          return d >= start && d <= end;
        });
      }
    }

    setFilteredBills(filtered);
    calculateStats(filtered);
  };

  const calculateStats = (bills: any[]) => {
    const totalBills = bills.length;
    const totalSales = bills.reduce((s, b) => s + (b.grandTotal || 0), 0);
    const totalDiscount = bills.reduce((s, b) => s + (b.discount || 0), 0);
    const totalTax = bills.reduce(
      (s, b) => s + (b.taxAmount || b.cgstAmt || 0) + (b.sgstAmt || 0),
      0
    );
    const totalQty = bills.reduce(
      (s, b) => s + (b.items?.reduce((q: number, i: any) => q + i.qty, 0) || 0),
      0
    );
    setStats({ totalBills, totalSales, totalDiscount, totalTax, totalQty });
  };

  const handleCustomFilter = () => filterBills(bills);

  return (
    <div className="container mt-4">
      <Card className="p-3 shadow-sm border-0">
        <h4 className="text-center mb-4 fw-bold text-secondary">
          📊 Restaurant Sales Report
        </h4>

        {/* ======= Filter Section ======= */}
        <Row className="mb-3">
          <Col md={3}>
            <Form.Select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="daily">Daily Report</option>
              <option value="monthly">Monthly Report</option>
              <option value="custom">Custom Date Range</option>
            </Form.Select>
          </Col>

          {reportType === "custom" && (
            <>
              <Col md={3}>
                <Form.Control
                  type="date"
                  value={customRange.start}
                  onChange={(e) =>
                    setCustomRange({ ...customRange, start: e.target.value })
                  }
                />
              </Col>
              <Col md={3}>
                <Form.Control
                  type="date"
                  value={customRange.end}
                  onChange={(e) =>
                    setCustomRange({ ...customRange, end: e.target.value })
                  }
                />
              </Col>
              <Col md={2}>
                <Button variant="outline-secondary" onClick={handleCustomFilter}>
                  Apply
                </Button>
              </Col>
            </>
          )}
          <Col md="auto" className="text-end">
            <Button variant="outline-primary" onClick={() => window.print()}>
              🖨️ Print
            </Button>
          </Col>
        </Row>

        {/* ======= Soft-Colored Summary Cards ======= */}
        <Row className="text-center mb-4">
          <Col>
            <Card
              className="p-3 shadow-sm rounded-4 border-0"
              style={{ backgroundColor: "#E3F2FD", color: "#0D47A1" }}
            >
              <h6>Total Bills</h6>
              <h4>{stats.totalBills}</h4>
            </Card>
          </Col>

          <Col>
            <Card
              className="p-3 shadow-sm rounded-4 border-0"
              style={{ backgroundColor: "#E8F5E9", color: "#1B5E20" }}
            >
              <h6>Total Sales</h6>
              <h4>₹{stats.totalSales.toFixed(2)}</h4>
            </Card>
          </Col>

          <Col>
            <Card
              className="p-3 shadow-sm rounded-4 border-0"
              style={{ backgroundColor: "#FFF3E0", color: "#E65100" }}
            >
              <h6>Total Discount</h6>
              <h4>₹{stats.totalDiscount.toFixed(2)}</h4>
            </Card>
          </Col>

          <Col>
            <Card
              className="p-3 shadow-sm rounded-4 border-0"
              style={{ backgroundColor: "#E0F7FA", color: "#006064" }}
            >
              <h6>Total Tax</h6>
              <h4>₹{stats.totalTax.toFixed(2)}</h4>
            </Card>
          </Col>

          <Col>
            <Card
              className="p-3 shadow-sm rounded-4 border-0"
              style={{ backgroundColor: "#FCE4EC", color: "#AD1457" }}
            >
              <h6>Total Qty Sold</h6>
              <h4>{stats.totalQty}</h4>
            </Card>
          </Col>
        </Row>

        {/* ======= Report Table ======= */}
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#E3F2FD" }}>
            <tr className="text-secondary">
              <th>Bill No</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Mobile</th>
              <th>Type</th>
              <th>Payment Mode</th>
              <th>Total Qty</th>
              <th>Subtotal (₹)</th>
              <th>Discount (₹)</th>
              <th>Tax (₹)</th>
              <th>Grand Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {filteredBills.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center text-muted py-3">
                  No records found
                </td>
              </tr>
            ) : (
              filteredBills.map((b, i) => (
                <tr key={i}>
                  <td>{b.billNo}</td>
                  <td>{new Date(b.date || b.createdAt).toLocaleDateString()}</td>
                  <td>{b.customerName || "N/A"}</td>
                  <td>{b.customerMobile || "N/A"}</td>
                  <td>{b.orderType || "Dine-in"}</td>
                  <td>{b.paymentMode || "Cash"}</td>
                  <td>{b.items?.reduce((q: number, i: any) => q + i.qty, 0) || 0}</td>
                  <td>{(b.subtotal || 0).toFixed(2)}</td>
                  <td>{(b.discount || 0).toFixed(2)}</td>
                  <td>
                    {((b.cgstAmt || 0) + (b.sgstAmt || 0)).toFixed(2)}
                  </td>
                  <td>{(b.grandTotal || 0).toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>

        {/* ======= Total Footer ======= */}
        <div className="text-end fw-bold fs-5 mt-2 text-secondary">
          Total Sales: ₹{stats.totalSales.toFixed(2)}
        </div>
      </Card>
    </div>
  );
};

export default ReportPage;
