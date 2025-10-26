import  { useState, useEffect, useMemo, useCallback } from "react";
import { Card, Table, Form, Button, Row, Col, Modal, Dropdown } from "react-bootstrap";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

const ReportPage = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [filteredBills, setFilteredBills] = useState<any[]>([]);
  const [reportType, setReportType] = useState("daily");
  const [reportCategory, setReportCategory] = useState("sales");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [filters, setFilters] = useState({
    orderType: "",
    paymentMode: "",
    outlet: ""
  });
  const [stats, setStats] = useState({
    totalBills: 0,
    totalSales: 0,
    totalDiscount: 0,
    totalTax: 0,
    totalQty: 0,
  });
  const [visibleColumns, setVisibleColumns] = useState({
    billNo: true,
    date: true,
    customerName: true,
    mobile: true,
    orderType: true,
    paymentMode: true,
    waiter: true,
    subtotal: true,
    discount: true,
    tax: true,
    grandTotal: true,
    itemsCount: true
  });
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [ingredientUsage, setIngredientUsage] = useState<any[]>([]);

  // Mock recipes data
  const recipes = {
    "Paneer Butter Masala": { "Paneer": 0.25, "Butter": 0.05, "Tomato": 0.1, "Cream": 0.02, "Spices": 0.01 },
    "Naan": { "Flour": 0.1, "Oil": 0.01, "Yeast": 0.005, "Yogurt": 0.02 },
    "Biryani": { "Rice": 0.2, "Chicken": 0.15, "Spices": 0.02, "Onion": 0.05, "Oil": 0.01 },
    "Butter Chicken": { "Chicken": 0.2, "Butter": 0.03, "Cream": 0.03, "Tomato": 0.08, "Spices": 0.01 },
    "Dal Makhani": { "Lentils": 0.15, "Butter": 0.02, "Cream": 0.01, "Tomato": 0.05, "Spices": 0.005 }
  };

  const ingredientCosts = {
    "Paneer": 200, "Butter": 50, "Tomato": 40, "Cream": 80, "Spices": 300,
    "Flour": 30, "Oil": 120, "Yeast": 100, "Yogurt": 60, "Rice": 50,
    "Chicken": 150, "Onion": 20, "Lentils": 80
  };

  // Mock inventory opening stock and purchases for the period
  const mockInventory = {
    "Paneer": { opening: 10, purchase: 20, unit: "kg" },
    "Butter": { opening: 5, purchase: 10, unit: "kg" },
    "Tomato": { opening: 15, purchase: 25, unit: "kg" },
    "Cream": { opening: 3, purchase: 5, unit: "L" },
    "Spices": { opening: 2, purchase: 3, unit: "kg" },
    "Flour": { opening: 20, purchase: 30, unit: "kg" },
    "Oil": { opening: 10, purchase: 15, unit: "L" },
    "Yeast": { opening: 1, purchase: 2, unit: "kg" },
    "Yogurt": { opening: 8, purchase: 12, unit: "L" },
    "Rice": { opening: 25, purchase: 35, unit: "kg" },
    "Chicken": { opening: 12, purchase: 18, unit: "kg" },
    "Onion": { opening: 10, purchase: 15, unit: "kg" },
    "Lentils": { opening: 15, purchase: 20, unit: "kg" }
  };

  useEffect(() => {
    loadBills();
  }, []);

  useEffect(() => {
    filterBills(bills);
  }, [reportType, reportCategory, filters, customRange]);

  const loadBills = useCallback(() => {
    const quickBills = JSON.parse(localStorage.getItem("quickBills") || "[]");
    const normalBills = JSON.parse(localStorage.getItem("normalBills") || "[]");
    const allBills = [...quickBills, ...normalBills].map(bill => ({
      ...bill,
      itemsCount: bill.items?.reduce((q: number, i: any) => q + i.qty, 0) || 0,
      tax: (bill.cgstAmt || 0) + (bill.sgstAmt || 0)
    }));
    setBills(allBills);
    filterBills(allBills);
  }, []);

  const filterBills = useCallback((data: any[]) => {
    const today = new Date();
    let filtered = data;

    // Date filtering
    if (reportType === "daily") {
      filtered = filtered.filter((bill) => {
        const d = new Date(bill.date || bill.createdAt);
        return d.toDateString() === today.toDateString();
      });
    } else if (reportType === "monthly") {
      filtered = filtered.filter((bill) => {
        const d = new Date(bill.date || bill.createdAt);
        return (
          d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
        );
      });
    } else if (reportType === "custom" && customRange.start && customRange.end) {
      const start = new Date(customRange.start);
      const end = new Date(customRange.end);
      filtered = filtered.filter((bill) => {
        const d = new Date(bill.date || bill.createdAt);
        return d >= start && d <= end;
      });
    }

    // Additional filters
    if (filters.orderType) {
      filtered = filtered.filter(bill => bill.orderType === filters.orderType);
    }
    if (filters.paymentMode) {
      filtered = filtered.filter(bill => bill.paymentMode === filters.paymentMode);
    }
    if (filters.outlet) {
      filtered = filtered.filter(bill => bill.outlet === filters.outlet);
    }

    setFilteredBills(filtered);
    calculateStats(filtered);
    calculateIngredientUsage(filtered);
  }, [reportType, reportCategory, filters, customRange]);

  const calculateStats = (bills: any[]) => {
    const totalBills = bills.length;
    const totalSales = bills.reduce((s, b) => s + (b.grandTotal || 0), 0);
    const totalDiscount = bills.reduce((s, b) => s + (b.discount || 0), 0);
    const totalTax = bills.reduce((s, b) => s + (b.tax || 0), 0);
    const totalQty = bills.reduce((s, b) => s + (b.itemsCount || 0), 0);
    setStats({ totalBills, totalSales, totalDiscount, totalTax, totalQty });
  };

  const calculateIngredientUsage = (bills: any[]) => {
    const usage: any = {};

    bills.forEach(bill => {
      bill.items?.forEach((item: any) => {
        const recipe = recipes[item.name as keyof typeof recipes];
        if (recipe) {
          Object.entries(recipe).forEach(([ingredient, quantityPerItem]) => {
            if (!usage[ingredient]) {
              usage[ingredient] = {
                ingredient,
                unit: "kg",
                quantityUsed: 0,
                cost: 0
              };
            }
            const quantity = item.qty * quantityPerItem;
            usage[ingredient].quantityUsed += quantity;
            usage[ingredient].cost += quantity * ingredientCosts[ingredient as keyof typeof ingredientCosts];
          });
        }
      });
    });

    // Extend with inventory data for balance calculation
    const extendedUsage = Object.values(usage).map((u: any) => {
      const inv = mockInventory[u.ingredient as keyof typeof mockInventory];
      if (inv) {
        const totalAvailable = inv.opening + inv.purchase;
        const balance = totalAvailable - u.quantityUsed;
        const wastage = Math.max(0, balance < 0 ? -balance : 0); // Simple wastage assumption if negative
        return { ...u, opening: inv.opening, purchase: inv.purchase, balance: Math.max(0, balance), wastage: 0.5 }; // Mock wastage
      }
      return u;
    });

    setIngredientUsage(extendedUsage);
  };

  // Calculate payment summary
  const calculatePaymentSummary = (bills: any[]) => {
    const summary: any = {};
    bills.forEach(bill => {
      const mode = bill.paymentMode || "Cash";
      summary[mode] = (summary[mode] || 0) + (bill.grandTotal || 0);
    });
    return Object.entries(summary).map(([mode, total]) => ({ mode, total: total as number }));
  };

  // Calculate staff summary
  const calculateStaffSummary = (bills: any[]) => {
    const summary: any = {};
    bills.forEach(bill => {
      const staff = bill.waiter || "Unknown";
      if (!summary[staff]) {
        summary[staff] = { bills: 0, sales: 0, tips: 0 }; // Mock tips
      }
      summary[staff].bills += 1;
      summary[staff].sales += (bill.grandTotal || 0);
      summary[staff].tips += Math.floor(Math.random() * 50) + 10; // Mock tips
    });
    return Object.entries(summary).map(([name, data]: any) => ({
      name,
      bills: data.bills,
      sales: data.sales,
      avgBill: data.bills > 0 ? data.sales / data.bills : 0,
      tips: data.tips
    }));
  };

  const paymentSummary = useMemo(() => calculatePaymentSummary(filteredBills), [filteredBills]);
  const staffSummary = useMemo(() => calculateStaffSummary(filteredBills), [filteredBills]);

  const handleCustomFilter = () => filterBills(bills);

  const handleResetFilters = () => {
    setFilters({ orderType: "", paymentMode: "", outlet: "" });
    setCustomRange({ start: "", end: "" });
    setReportType("daily");
    setReportCategory("sales");
  };

  const exportToExcel = () => {
    let data: any[] = [];
    if (reportCategory === "sales") {
      data = filteredBills.map(bill => ({
        "Bill No": bill.billNo,
        "Date": new Date(bill.date || bill.createdAt).toLocaleDateString(),
        "Customer": bill.customerName || "N/A",
        "Mobile": bill.customerMobile || "N/A",
        "Order Type": bill.orderType || "Dine-in",
        "Payment Mode": bill.paymentMode || "Cash",
        "Subtotal": bill.subtotal || 0,
        "Discount": bill.discount || 0,
        "Tax": bill.tax || 0,
        "Grand Total": bill.grandTotal || 0,
        "Items Count": bill.itemsCount || 0
      }));
    } else if (reportCategory === "payment") {
      data = paymentSummary.map(p => ({ "Payment Mode": p.mode, "Total": p.total }));
    } else if (reportCategory === "staff") {
      data = staffSummary.map(s => ({ "Staff Name": s.name, "Bills Handled": s.bills, "Total Sales": s.sales, "Avg Bill": s.avgBill, "Tips": s.tips }));
    } else if (reportCategory === "kitchen" || reportCategory === "inventory") {
      data = ingredientUsage.map(i => ({ "Ingredient": i.ingredient, "Unit": i.unit, "Quantity Used": i.quantityUsed, "Cost": i.cost, ...(reportCategory === "inventory" && { "Opening": i.opening, "Purchase": i.purchase, "Balance": i.balance, "Wastage": i.wastage }) }));
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${reportCategory} Report`);
    XLSX.writeFile(workbook, `restaurant-${reportCategory}-report-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const title = `${reportCategory.charAt(0).toUpperCase() + reportCategory.slice(1)} Report`;
    
    // Title
    doc.setFontSize(16);
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);
    
    let startY = 35;
    let body: any[][] = [];
    let head: string[] = [];

    if (reportCategory === "sales") {
      doc.text(`Total Bills: ${stats.totalBills}`, 14, startY);
      startY += 7;
      doc.text(`Total Sales: ₹${stats.totalSales.toFixed(2)}`, 14, startY);
      startY += 7;
      head = ['Bill No', 'Date', 'Customer', 'Order Type', 'Grand Total'];
      body = filteredBills.slice(0, 20).map(bill => [ // Limit rows for PDF
        bill.billNo,
        new Date(bill.date || bill.createdAt).toLocaleDateString(),
        bill.customerName || "N/A",
        bill.orderType || "Dine-in",
        `₹${(bill.grandTotal || 0).toFixed(2)}`
      ]);
    } else if (reportCategory === "payment") {
      head = ['Payment Mode', 'Total (₹)'];
      body = paymentSummary.map(p => [p.mode, `₹${p.total.toFixed(2)}`]);
    } else if (reportCategory === "staff") {
      head = ['Staff Name', 'Bills', 'Total Sales (₹)', 'Avg Bill (₹)', 'Tips (₹)'];
      body = staffSummary.map(s => [s.name, s.bills, s.sales.toFixed(2), s.avgBill.toFixed(2), s.tips]);
    } else if (reportCategory === "kitchen" || reportCategory === "inventory") {
      head = reportCategory === "kitchen" ? ['Ingredient', 'Unit', 'Quantity Used', 'Cost (₹)'] : ['Ingredient', 'Unit', 'Opening', 'Purchase', 'Used', 'Balance', 'Wastage', 'Cost (₹)'];
      body = ingredientUsage.map(i => {
        const row = [i.ingredient, i.unit, i.quantityUsed.toFixed(3), i.cost.toFixed(2)];
        if (reportCategory === "inventory") {
          row.splice(2, 0, i.opening, i.purchase);
          row.splice(6, 0, i.balance, i.wastage);
        }
        return row.map(r => typeof r === 'number' ? r.toFixed(2) : r);
      });
    }

    (doc as any).autoTable({
      startY,
      head: [head],
      body,
    });
    
    doc.save(`restaurant-${reportCategory}-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const toggleColumn = (column: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [column]: !prev[column as keyof typeof visibleColumns]
    }));
  };

  const ColumnSelectorModal = () => (
    <Modal show={showColumnModal} onHide={() => setShowColumnModal(false)}>
      <Modal.Header closeButton>
        <Modal.Title>Select Columns to Display (Sales Report)</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          {Object.entries(visibleColumns).map(([key, value]) => (
            <Col md={6} key={key}>
              <Form.Check
                type="checkbox"
                label={key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                checked={value}
                onChange={() => toggleColumn(key)}
                className="mb-2"
              />
            </Col>
          ))}
        </Row>
      </Modal.Body>
    </Modal>
  );

  const renderSalesSection = () => (
    <>
      {/* Summary Cards */}
      <Row className="text-center mb-4">
        <Col>
          <Card className="p-3 shadow-sm rounded-4 border-0" style={{ backgroundColor: "#E3F2FD", color: "#0D47A1" }}>
            <h6>🧾 Total Bills</h6>
            <h4>{stats.totalBills}</h4>
          </Card>
        </Col>
        <Col>
          <Card className="p-3 shadow-sm rounded-4 border-0" style={{ backgroundColor: "#E8F5E9", color: "#1B5E20" }}>
            <h6>💰 Total Sales</h6>
            <h4>₹{stats.totalSales.toFixed(2)}</h4>
          </Card>
        </Col>
        <Col>
          <Card className="p-3 shadow-sm rounded-4 border-0" style={{ backgroundColor: "#FFF3E0", color: "#E65100" }}>
            <h6>💸 Total Discount</h6>
            <h4>₹{stats.totalDiscount.toFixed(2)}</h4>
          </Card>
        </Col>
        <Col>
          <Card className="p-3 shadow-sm rounded-4 border-0" style={{ backgroundColor: "#E0F7FA", color: "#006064" }}>
            <h6>💷 Total Tax</h6>
            <h4>₹{stats.totalTax.toFixed(2)}</h4>
          </Card>
        </Col>
        <Col>
          <Card className="p-3 shadow-sm rounded-4 border-0" style={{ backgroundColor: "#FCE4EC", color: "#AD1457" }}>
            <h6>🍽️ Total Qty Sold</h6>
            <h4>{stats.totalQty}</h4>
          </Card>
        </Col>
      </Row>

      {/* Sales Table */}
      <Table bordered hover responsive size="sm">
        <thead style={{ backgroundColor: "#E3F2FD" }}>
          <tr className="text-secondary">
            {visibleColumns.billNo && <th>Bill No</th>}
            {visibleColumns.date && <th>Date</th>}
            {visibleColumns.customerName && <th>Customer</th>}
            {visibleColumns.mobile && <th>Mobile</th>}
            {visibleColumns.orderType && <th>Type</th>}
            {visibleColumns.paymentMode && <th>Payment Mode</th>}
            {visibleColumns.waiter && <th>Waiter</th>}
            {visibleColumns.subtotal && <th>Subtotal (₹)</th>}
            {visibleColumns.discount && <th>Discount (₹)</th>}
            {visibleColumns.tax && <th>Tax (₹)</th>}
            {visibleColumns.grandTotal && <th>Grand Total (₹)</th>}
            {visibleColumns.itemsCount && <th>Items Count</th>}
          </tr>
        </thead>
        <tbody>
          {filteredBills.length === 0 ? (
            <tr>
              <td colSpan={Object.values(visibleColumns).filter(Boolean).length} className="text-center text-muted py-3">
                No records found
              </td>
            </tr>
          ) : (
            filteredBills.map((b, i) => (
              <tr key={i}>
                {visibleColumns.billNo && <td>{b.billNo}</td>}
                {visibleColumns.date && <td>{new Date(b.date || b.createdAt).toLocaleDateString()}</td>}
                {visibleColumns.customerName && <td>{b.customerName || "N/A"}</td>}
                {visibleColumns.mobile && <td>{b.customerMobile || "N/A"}</td>}
                {visibleColumns.orderType && <td>{b.orderType || "Dine-in"}</td>}
                {visibleColumns.paymentMode && <td>{b.paymentMode || "Cash"}</td>}
                {visibleColumns.waiter && <td>{b.waiter || "N/A"}</td>}
                {visibleColumns.subtotal && <td>{(b.subtotal || 0).toFixed(2)}</td>}
                {visibleColumns.discount && <td>{(b.discount || 0).toFixed(2)}</td>}
                {visibleColumns.tax && <td>{(b.tax || 0).toFixed(2)}</td>}
                {visibleColumns.grandTotal && <td>{(b.grandTotal || 0).toFixed(2)}</td>}
                {visibleColumns.itemsCount && <td>{b.itemsCount || 0}</td>}
              </tr>
            ))
          )}
        </tbody>
      </Table>
    </>
  );

  const renderPaymentSection = () => (
    <Card className="p-3 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#E8F5E9" }}>
        <h5 className="mb-0">💳 Payment and Collection Summary</h5>
      </Card.Header>
      <Card.Body>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              <th>Payment Mode</th>
              <th>Total Amount (₹)</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            {paymentSummary.map((p, i) => {
              const percentage = ((p.total / stats.totalSales) * 100).toFixed(1);
              return (
                <tr key={i}>
                  <td>{p.mode}</td>
                  <td>{p.total.toFixed(2)}</td>
                  <td>{percentage}%</td>
                </tr>
              );
            })}
            <tr className="fw-bold">
              <td>Total</td>
              <td>{stats.totalSales.toFixed(2)}</td>
              <td>100%</td>
            </tr>
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );

  const renderStaffSection = () => (
    <Card className="p-3 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#E0F7FA" }}>
        <h5 className="mb-0">🧑‍💼 Staff / Waiter Performance Report</h5>
      </Card.Header>
      <Card.Body>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              <th>Staff Name</th>
              <th>Bills Handled</th>
              <th>Total Sales (₹)</th>
              <th>Avg Bill (₹)</th>
              <th>Tips (₹)</th>
            </tr>
          </thead>
          <tbody>
            {staffSummary.map((s, i) => (
              <tr key={i}>
                <td>{s.name}</td>
                <td>{s.bills}</td>
                <td>{s.sales.toFixed(2)}</td>
                <td>{s.avgBill.toFixed(2)}</td>
                <td>{s.tips.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );

  const renderKitchenSection = () => (
    <Card className="mt-4 border-0 shadow-sm">
      <Card.Header style={{ backgroundColor: "#E8F5E9" }}>
        <h5 className="mb-0">🍳 Kitchen Ingredient Usage Report</h5>
      </Card.Header>
      <Card.Body>
        <Table bordered hover responsive size="sm">
          <thead>
            <tr>
              <th>Ingredient</th>
              <th>Unit</th>
              <th>Quantity Used</th>
              <th>Cost (₹)</th>
            </tr>
          </thead>
          <tbody>
            {ingredientUsage.map((ingredient, index) => (
              <tr key={index}>
                <td>{ingredient.ingredient}</td>
                <td>{ingredient.unit}</td>
                <td>{ingredient.quantityUsed.toFixed(3)}</td>
                <td>{ingredient.cost.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );

  const renderInventorySection = () => (
    <Card className="mt-4 border-0 shadow-sm">
      <Card.Header style={{ backgroundColor: "#FCE4EC" }}>
        <h5 className="mb-0">🧱 Inventory & Purchase Report</h5>
      </Card.Header>
      <Card.Body>
        <Table bordered hover responsive size="sm">
          <thead>
            <tr>
              <th>Item</th>
              <th>Unit</th>
              <th>Opening Stock</th>
              <th>Purchase</th>
              <th>Used</th>
              <th>Wastage</th>
              <th>Closing Stock</th>
              <th>Cost (₹)</th>
            </tr>
          </thead>
          <tbody>
            {ingredientUsage.map((ingredient, index) => (
              <tr key={index}>
                <td>{ingredient.ingredient}</td>
                <td>{ingredient.unit}</td>
                <td>{ingredient.opening?.toFixed(2) || 0}</td>
                <td>{ingredient.purchase?.toFixed(2) || 0}</td>
                <td>{ingredient.quantityUsed.toFixed(3)}</td>
                <td>{ingredient.wastage?.toFixed(3) || 0}</td>
                <td>{ingredient.balance?.toFixed(3) || 0}</td>
                <td>{ingredient.cost.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );

  const renderReportContent = () => {
    switch (reportCategory) {
      case "sales":
        return renderSalesSection();
      case "payment":
        return renderPaymentSection();
      case "staff":
        return renderStaffSection();
      case "kitchen":
        return renderKitchenSection();
      case "inventory":
        return renderInventorySection();
      default:
        return renderSalesSection();
    }
  };

  return (
    <Card className="apps-card">
      <div className="apps-container">
        <div className="apps-container-inner">
          <div className="container mt-2">
            
              <h4 className="text-center mb-4 fw-bold text-secondary">
                📊 Restaurant Reporting System
              </h4>

              {/* Enhanced Filter Section */}
              <Row className="mb-2 g-2">
                <Col md={2}>
                  <Form.Select value={reportType} onChange={(e) => setReportType(e.target.value)}>
                    <option value="daily">Daily Report</option>
                    <option value="monthly">Monthly Report</option>
                    <option value="custom">Custom Date Range</option>
                  </Form.Select>
                </Col>

                {reportType === "custom" && (
                  <>
                    <Col md={2}>
                      <Form.Control
                        type="date"
                        value={customRange.start}
                        onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                      />
                    </Col>
                    <Col md={2}>
                      <Form.Control
                        type="date"
                        value={customRange.end}
                        onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                      />
                    </Col>
                  </>
                )}

                <Col md={2}>
                  <Form.Select value={reportCategory} onChange={(e) => setReportCategory(e.target.value)}>
                    <option value="sales">Sales Report</option>
                    <option value="payment">Payment Report</option>
                    <option value="staff">Staff Report</option>
                    <option value="kitchen">Kitchen Usage</option>
                    <option value="inventory">Inventory Report</option>
                  </Form.Select>
                </Col>

                <Col md={1}>
                  <Form.Select value={filters.orderType} onChange={(e) => setFilters({...filters, orderType: e.target.value})}>
                    <option value="">All Order Types</option>
                    <option value="dine-in">Dine-in</option>
                    <option value="takeaway">Takeaway</option>
                    <option value="delivery">Delivery</option>
                  </Form.Select>
                </Col>

                <Col md={1}>
                  <Form.Select value={filters.paymentMode} onChange={(e) => setFilters({...filters, paymentMode: e.target.value})}>
                    <option value="">All Payment Modes</option>
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="online">Online</option>
                  </Form.Select>
                </Col>

                <Col md={1}>
                  <Form.Select value={filters.outlet} onChange={(e) => setFilters({...filters, outlet: e.target.value})}>
                    <option value="">All Outlets</option>
                    <option value="main">Main Outlet</option>
                    <option value="branch-1">Branch 1</option>
                    <option value="branch-2">Branch 2</option>
                  </Form.Select>
                </Col>

                <Col md={1} className="d-flex gap-1">
                  <Button variant="outline-primary" onClick={handleCustomFilter} size="sm">
                    Apply
                  </Button>
                  <Button variant="outline-secondary" onClick={handleResetFilters} size="sm">
                    Reset
                  </Button>
                </Col>
              </Row>

              {/* Action Buttons */}
              <Row className="mb-3">
                <Col className="d-flex gap-2 justify-content-end">
                  {reportCategory === "sales" && (
                    <Button variant="outline-info" onClick={() => setShowColumnModal(true)} size="sm">
                      ⚙️ Columns
                    </Button>
                  )}
                  <Dropdown>
                    <Dropdown.Toggle variant="outline-success" size="sm">
                      📤 Export
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item onClick={exportToExcel}>Export to Excel</Dropdown.Item>
                      <Dropdown.Item onClick={exportToPDF}>Export to PDF</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                  <Button variant="outline-primary" onClick={() => window.print()} size="sm">
                    🖨️ Print
                  </Button>
                </Col>
              </Row>

              {renderReportContent()}

           

            <ColumnSelectorModal />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default ReportPage;