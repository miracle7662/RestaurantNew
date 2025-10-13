import React, { useState, useEffect } from "react";
import { Card, Table, Form, Button } from "react-bootstrap";

const ReportsPage = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [filteredBills, setFilteredBills] = useState<any[]>([]);
  const [reportType, setReportType] = useState("daily");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [totalSales, setTotalSales] = useState(0);

  useEffect(() => {
    const savedQuickBills = JSON.parse(localStorage.getItem("quickBills") || "[]");
    const savedNormalBills = JSON.parse(localStorage.getItem("normalBills") || "[]");
    const allBills = [...savedQuickBills, ...savedNormalBills];
    setBills(allBills);
    filterBills(allBills, reportType);
  }, [reportType]);

  const filterBills = (data: any[], type: string) => {
    const today = new Date();
    let filtered = [];

    if (type === "daily") {
      filtered = data.filter((bill) => {
        const billDate = new Date(bill.date || bill.createdAt);
        return billDate.toDateString() === today.toDateString();
      });
    } else if (type === "monthly") {
      filtered = data.filter((bill) => {
        const billDate = new Date(bill.date || bill.createdAt);
        return (
          billDate.getMonth() === today.getMonth() &&
          billDate.getFullYear() === today.getFullYear()
        );
      });
    } else if (type === "custom") {
      if (customRange.start && customRange.end) {
        const start = new Date(customRange.start);
        const end = new Date(customRange.end);
        filtered = data.filter((bill) => {
          const billDate = new Date(bill.date || bill.createdAt);
          return billDate >= start && billDate <= end;
        });
      }
    }

    setFilteredBills(filtered);
    setTotalSales(filtered.reduce((sum, b) => sum + (b.grandTotal || 0), 0));
  };

  const handleCustomFilter = () => {
    filterBills(bills, "custom");
  };

  return (
    <div className="container mt-4">
      <Card className="p-3 shadow-sm">
        <h4 className="text-center mb-3">📊 Sales Reports</h4>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div className="d-flex align-items-center gap-2">
            <Form.Select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              style={{ width: "180px" }}
            >
              <option value="daily">Daily Report</option>
              <option value="monthly">Monthly Report</option>
              <option value="custom">Custom Range</option>
            </Form.Select>

            {reportType === "custom" && (
              <>
                <Form.Control
                  type="date"
                  value={customRange.start}
                  onChange={(e) =>
                    setCustomRange({ ...customRange, start: e.target.value })
                  }
                />
                <Form.Control
                  type="date"
                  value={customRange.end}
                  onChange={(e) =>
                    setCustomRange({ ...customRange, end: e.target.value })
                  }
                />
                <Button variant="primary" onClick={handleCustomFilter}>
                  Apply
                </Button>
              </>
            )}
          </div>
          <Button variant="outline-secondary" onClick={() => window.print()}>
            Print Report
          </Button>
        </div>

        <Table bordered hover responsive size="sm">
          <thead className="table-primary">
            <tr>
              <th>Bill No.</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Payment Mode</th>
              <th>Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            {filteredBills.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center text-muted py-3">
                  No records found
                </td>
              </tr>
            ) : (
              filteredBills.map((bill) => (
                <tr key={bill.billNo}>
                  <td>{bill.billNo}</td>
                  <td>{new Date(bill.date || bill.createdAt).toLocaleDateString()}</td>
                  <td>{bill.customerName || "N/A"}</td>
                  <td>{bill.paymentMode || "Cash"}</td>
                  <td>{bill.grandTotal?.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </Table>

        <div className="text-end fw-bold fs-5 mt-2">
          Total Sales: ₹{totalSales.toFixed(2)}
        </div>
      </Card>
    </div>
  );
};

export default ReportsPage;
