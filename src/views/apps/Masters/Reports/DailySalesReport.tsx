import React, { useState, useEffect } from "react";
import { Card, Table, Form, Button, Row, Col, Modal, Dropdown, Tab, Tabs } from "react-bootstrap";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

const ReportPage = () => {
  const [bills, setBills] = useState<any[]>([]);
  const [filteredBills, setFilteredBills] = useState<any[]>([]);
  const [reportType, setReportType] = useState("daily");
  const [reportCategory, setReportCategory] = useState("billSummary");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [filters, setFilters] = useState({
    orderType: "",
    paymentMode: "",
    outlet: ""
  });
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

  // Mock data for new reports
  const mockCreditDetails = {
    "Bill001": { cardNumber: "****1234", bank: "HDFC", amount: 500 },
    "Bill002": { cardNumber: "****5678", bank: "SBI", amount: 300 },
    // Add more as needed
  };

  const mockReverseKOTs = [
    { id: 1, billNo: "Bill003", reason: "Customer Cancel", timestamp: new Date().toISOString() },
    // Add more
  ];

  const mockKitchens = ["Main Kitchen", "Tandoor", "Bar"];
  const mockKitchenSales = {
    "Main Kitchen": 15000,
    "Tandoor": 8000,
    "Bar": 5000
  };

  const mockNCKOTs = [
    { id: 1, kotNo: "KOT001", status: "NC", items: ["Item1"] },
    // Add more
  ];

  const mockAPCPayments = [
    { type: "APC", amount: 2000, details: "Advance Payment" },
    { type: "APP", amount: 1500, details: "Party Payment" }
  ];

  const mockSpecialItems = [
    { name: "Special Dish", qty: 5, sales: 2500 },
    // Add more
  ];

  const mockInterDeptCash = [
    { from: "Kitchen", to: "Front Desk", amount: 1000, type: "Paid" },
    { from: "Front Desk", to: "Bar", amount: 500, type: "Received" }
  ];

  const mockUserShifts = [
    { user: "User1", shift: "Morning", sales: 10000 },
    { user: "User2", shift: "Evening", sales: 12000 }
  ];

  const mockMonthlySales = [
    { month: "Jan", sales: 50000 },
    { month: "Feb", sales: 55000 }
  ];

  const mockPaymentModeSales = [
    { mode: "Cash", sales: 20000 },
    { mode: "Card", sales: 15000 }
  ];

  const mockKitchenAlloc = [
    { kitchen: "Main", allocation: "80%" },
    { kitchen: "Tandoor", allocation: "20%" }
  ];

  const mockDayEnd = { totalSales: 30000, cashInHand: 25000, discrepancies: [] };

  const mockHandover = { handoverTime: new Date().toISOString(), notes: "Smooth handover" };

  const mockBillReprinted = [
    { billNo: "Bill004", reprints: 2, reason: "Customer Request" }
  ];

  const mockKotUsed = [
    { kotNo: "KOT002", usedIn: "Bill005", items: 3 }
  ];

  useEffect(() => {
    loadBills();
  }, []);

  useEffect(() => {
    filterBills(bills);
  }, [reportType, reportCategory, filters, customRange]);

  const loadBills = () => {
    const quickBills = JSON.parse(localStorage.getItem("quickBills") || "[]");
    const normalBills = JSON.parse(localStorage.getItem("normalBills") || "[]");
    const allBills = [...quickBills, ...normalBills].map(bill => ({
      ...bill,
      itemsCount: bill.items?.reduce((q: number, i: any) => q + i.qty, 0) || 0,
      tax: (bill.cgstAmt || 0) + (bill.sgstAmt || 0)
    }));
    setBills(allBills);
    filterBills(allBills);
  };

  const filterBills = (data: any[]) => {
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
    calculateIngredientUsage(filtered);
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

  // New calculations for added reports
  const calculateBillSummary = (bills: any[]) => {
    return bills.map(bill => ({
      ...bill,
      creditDetails: mockCreditDetails[bill.billNo] || { cardNumber: "N/A", bank: "N/A", amount: 0 }
    }));
  };

  const calculateCreditSummary = (bills: any[]) => {
    const credits = bills.filter(b => b.paymentMode === "Credit").reduce((acc, b) => acc + (b.grandTotal || 0), 0);
    return [{ type: "Total Credit", amount: credits }];
  };

  const calculateDiscountSummary = (bills: any[]) => {
    const totalDiscount = bills.reduce((s, b) => s + (b.discount || 0), 0);
    const avgDiscount = totalDiscount / bills.length || 0;
    return [{ type: "Total Discount", amount: totalDiscount }, { type: "Avg Discount", amount: avgDiscount }];
  };

  const calculateReverseKOTsBills = () => mockReverseKOTs;

  const calculateKitchenWiseSales = () => {
    // Mock based on kitchens
    return Object.entries(mockKitchenSales).map(([kitchen, sales]) => ({ kitchen, sales }));
  };

  const calculateNCKOTDetails = () => mockNCKOTs;

  const calculateAPCAPPSummary = () => mockAPCPayments;

  const calculateSpecialItemsSummary = () => mockSpecialItems;

  const calculateInterDeptCash = () => mockInterDeptCash;

  const calculateDailySalesUserShift = () => mockUserShifts;

  const calculateMonthlySalesSummary = () => mockMonthlySales;

  const calculatePaymentModeSalesSummary = (bills: any[]) => calculatePaymentSummary(bills); // Reuse

  const calculateKitchenAllocation = () => mockKitchenAlloc;

  const calculateDayEndReport = () => mockDayEnd;

  const calculateHandoverReport = () => mockHandover;

  const calculateBillReprinted = () => mockBillReprinted;

  const calculateKotUsedSummary = () => mockKotUsed;

  const billSummaryData = calculateBillSummary(filteredBills);
  const creditSummary = calculateCreditSummary(filteredBills);
  const discountSummary = calculateDiscountSummary(filteredBills);
  const reverseKOTsBills = calculateReverseKOTsBills();
  const kitchenWiseSales = calculateKitchenWiseSales();
  const ncKOTDetails = calculateNCKOTDetails();
  const apcAppSummary = calculateAPCAPPSummary();
  const specialItemsSummary = calculateSpecialItemsSummary();
  const interDeptCash = calculateInterDeptCash();
  const dailySalesUserShift = calculateDailySalesUserShift();
  const monthlySalesSummary = calculateMonthlySalesSummary();
  const paymentModeSalesSummary = calculatePaymentModeSalesSummary(filteredBills);
  const kitchenAllocation = calculateKitchenAllocation();
  const dayEndReport = calculateDayEndReport();
  const handoverReport = calculateHandoverReport();
  const billReprinted = calculateBillReprinted();
  const kotUsedSummary = calculateKotUsedSummary();

  const paymentSummary = calculatePaymentSummary(filteredBills);

  const handleCustomFilter = () => filterBills(bills);

  const handleResetFilters = () => {
    setFilters({ orderType: "", paymentMode: "", outlet: "" });
    setCustomRange({ start: "", end: "" });
    setReportType("daily");
    setReportCategory("billSummary");
  };

  const exportToExcel = () => {
    let data: any[] = [];
    if (reportCategory === "billSummary") {
      data = billSummaryData.map(b => ({ "Bill No": b.billNo, "Grand Total": b.grandTotal, "Card Number": b.creditDetails.cardNumber, "Bank": b.creditDetails.bank, "Card Amount": b.creditDetails.amount }));
    } else if (reportCategory === "creditSummary") {
      data = creditSummary.map(c => ({ "Type": c.type, "Amount": c.amount }));
    } else if (reportCategory === "discountSummary") {
      data = discountSummary.map(d => ({ "Type": d.type, "Amount": d.amount }));
    } else if (reportCategory === "reverseKOTs") {
      data = reverseKOTsBills.map(r => ({ "ID": r.id, "Bill No": r.billNo, "Reason": r.reason, "Timestamp": r.timestamp }));
    } else if (reportCategory === "kitchenWise") {
      data = kitchenWiseSales.map(k => ({ "Kitchen": k.kitchen, "Sales": k.sales }));
    } else if (reportCategory === "ncKOT") {
      data = ncKOTDetails.map(n => ({ "ID": n.id, "KOT No": n.kotNo, "Status": n.status, "Items": n.items.join(", ") }));
    } else if (reportCategory === "apcApp") {
      data = apcAppSummary.map(a => ({ "Type": a.type, "Amount": a.amount, "Details": a.details }));
    } else if (reportCategory === "specialItems") {
      data = specialItemsSummary.map(s => ({ "Name": s.name, "Qty": s.qty, "Sales": s.sales }));
    } else if (reportCategory === "interDeptCash") {
      data = interDeptCash.map(i => ({ "From": i.from, "To": i.to, "Amount": i.amount, "Type": i.type }));
    } else if (reportCategory === "dailySalesUserShift") {
      data = dailySalesUserShift.map(d => ({ "User": d.user, "Shift": d.shift, "Sales": d.sales }));
    } else if (reportCategory === "monthlySales") {
      data = monthlySalesSummary.map(m => ({ "Month": m.month, "Sales": m.sales }));
    } else if (reportCategory === "paymentModeSales") {
      data = paymentModeSalesSummary.map(p => ({ "Mode": p.mode, "Sales": p.total }));
    } else if (reportCategory === "kitchenAllocation") {
      data = kitchenAllocation.map(k => ({ "Kitchen": k.kitchen, "Allocation": k.allocation }));
    } else if (reportCategory === "dayEnd") {
      data = [{ "Total Sales": dayEndReport.totalSales, "Cash In Hand": dayEndReport.cashInHand }];
    } else if (reportCategory === "handover") {
      data = [{ "Handover Time": handoverReport.handoverTime, "Notes": handoverReport.notes }];
    } else if (reportCategory === "billReprinted") {
      data = billReprinted.map(b => ({ "Bill No": b.billNo, "Reprints": b.reprints, "Reason": b.reason }));
    } else if (reportCategory === "kotUsedSummary") {
      data = kotUsedSummary.map(k => ({ "KOT No": k.kotNo, "Used In": k.usedIn, "Items": k.items }));
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
    
    const startY = 35;
    let body: any[][] = [];
    let head: string[] = [];

    if (reportCategory === "billSummary") {
      head = ['Bill No', 'Grand Total (₹)', 'Card Number', 'Bank', 'Card Amount (₹)'];
      body = billSummaryData.slice(0, 20).map(b => [b.billNo, b.grandTotal.toFixed(2), b.creditDetails.cardNumber, b.creditDetails.bank, b.creditDetails.amount.toFixed(2)]);
    } else if (reportCategory === "creditSummary") {
      head = ['Type', 'Amount (₹)'];
      body = creditSummary.map(c => [c.type, c.amount.toFixed(2)]);
    } else if (reportCategory === "discountSummary") {
      head = ['Type', 'Amount (₹)'];
      body = discountSummary.map(d => [d.type, d.amount.toFixed(2)]);
    } else if (reportCategory === "reverseKOTs") {
      head = ['ID', 'Bill No', 'Reason', 'Timestamp'];
      body = reverseKOTsBills.map(r => [r.id, r.billNo, r.reason, r.timestamp]);
    } else if (reportCategory === "kitchenWise") {
      head = ['Kitchen', 'Sales (₹)'];
      body = kitchenWiseSales.map(k => [k.kitchen, k.sales.toFixed(2)]);
    } else if (reportCategory === "ncKOT") {
      head = ['ID', 'KOT No', 'Status', 'Items'];
      body = ncKOTDetails.map(n => [n.id, n.kotNo, n.status, n.items.join(", ")]);
    } else if (reportCategory === "apcApp") {
      head = ['Type', 'Amount (₹)', 'Details'];
      body = apcAppSummary.map(a => [a.type, a.amount.toFixed(2), a.details]);
    } else if (reportCategory === "specialItems") {
      head = ['Name', 'Qty', 'Sales (₹)'];
      body = specialItemsSummary.map(s => [s.name, s.qty, s.sales.toFixed(2)]);
    } else if (reportCategory === "interDeptCash") {
      head = ['From', 'To', 'Amount (₹)', 'Type'];
      body = interDeptCash.map(i => [i.from, i.to, i.amount.toFixed(2), i.type]);
    } else if (reportCategory === "dailySalesUserShift") {
      head = ['User', 'Shift', 'Sales (₹)'];
      body = dailySalesUserShift.map(d => [d.user, d.shift, d.sales.toFixed(2)]);
    } else if (reportCategory === "monthlySales") {
      head = ['Month', 'Sales (₹)'];
      body = monthlySalesSummary.map(m => [m.month, m.sales.toFixed(2)]);
    } else if (reportCategory === "paymentModeSales") {
      head = ['Mode', 'Sales (₹)'];
      body = paymentModeSalesSummary.map(p => [p.mode, p.total.toFixed(2)]);
    } else if (reportCategory === "kitchenAllocation") {
      head = ['Kitchen', 'Allocation'];
      body = kitchenAllocation.map(k => [k.kitchen, k.allocation]);
    } else if (reportCategory === "dayEnd") {
      head = ['Metric', 'Value (₹)'];
      body = Object.entries(dayEndReport).filter(([k]) => k !== 'discrepancies').map(([k, v]) => [k, typeof v === 'number' ? v.toFixed(2) : v]);
    } else if (reportCategory === "handover") {
      head = ['Handover Time', 'Notes'];
      body = [[handoverReport.handoverTime, handoverReport.notes]];
    } else if (reportCategory === "billReprinted") {
      head = ['Bill No', 'Reprints', 'Reason'];
      body = billReprinted.map(b => [b.billNo, b.reprints, b.reason]);
    } else if (reportCategory === "kotUsedSummary") {
      head = ['KOT No', 'Used In', 'Items'];
      body = kotUsedSummary.map(k => [k.kotNo, k.usedIn, k.items]);
    }

    (doc as any).autoTable({
      startY,
      head: [head],
      body,
    });
    
    doc.save(`restaurant-${reportCategory}-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // New render sections
  const renderBillSummarySection = () => (
    <Card className="p-3 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#E3F2FD" }}>
        <h5 className="mb-0">📋 Bill Summary with Credit Card Details</h5>
      </Card.Header>
      <Card.Body>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              <th>Bill No</th>
              <th>Grand Total (₹)</th>
              <th>Card Number</th>
              <th>Bank</th>
              <th>Card Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {billSummaryData.map((b, i) => (
              <tr key={i}>
                <td>{b.billNo}</td>
                <td>{b.grandTotal?.toFixed(2) || 0}</td>
                <td>{b.creditDetails.cardNumber}</td>
                <td>{b.creditDetails.bank}</td>
                <td>{b.creditDetails.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );

  const renderCreditSummarySection = () => (
    <Card className="p-3 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#E8F5E9" }}>
        <h5 className="mb-0">💳 Credit Summary</h5>
      </Card.Header>
      <Card.Body>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              <th>Type</th>
              <th>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {creditSummary.map((c, i) => (
              <tr key={i}>
                <td>{c.type}</td>
                <td>{c.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );

  const renderDiscountSummarySection = () => (
    <Card className="p-3 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#FFF3E0" }}>
        <h5 className="mb-0">💸 Discount Summary</h5>
      </Card.Header>
      <Card.Body>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#E8F5E9" }}>
            <tr>
              <th>Type</th>
              <th>Amount (₹)</th>
            </tr>
          </thead>
          <tbody>
            {discountSummary.map((d, i) => (
              <tr key={i}>
                <td>{d.type}</td>
                <td>{d.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );

  const renderReverseKOTsSection = () => (
    <Card className="p-3 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#E0F7FA" }}>
        <h5 className="mb-0">🔄 Reverse KOTs and Bills</h5>
      </Card.Header>
      <Card.Body>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              <th>ID</th>
              <th>Bill No</th>
              <th>Reason</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {reverseKOTsBills.map((r, i) => (
              <tr key={i}>
                <td>{r.id}</td>
                <td>{r.billNo}</td>
                <td>{r.reason}</td>
                <td>{new Date(r.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );

  const renderKitchenWiseSection = () => (
    <Card className="p-3 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#E8F5E9" }}>
        <h5 className="mb-0">🍳 Kitchen Wise Sales Summary</h5>
      </Card.Header>
      <Card.Body>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              <th>Kitchen</th>
              <th>Sales (₹)</th>
            </tr>
          </thead>
          <tbody>
            {kitchenWiseSales.map((k, i) => (
              <tr key={i}>
                <td>{k.kitchen}</td>
                <td>{k.sales.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );

  const renderNCKOTSection = () => (
    <Card className="p-3 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#FCE4EC" }}>
        <h5 className="mb-0">📋 NC KOT Details</h5>
      </Card.Header>
      <Card.Body>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              <th>ID</th>
              <th>KOT No</th>
              <th>Status</th>
              <th>Items</th>
            </tr>
          </thead>
          <tbody>
            {ncKOTDetails.map((n, i) => (
              <tr key={i}>
                <td>{n.id}</td>
                <td>{n.kotNo}</td>
                <td>{n.status}</td>
                <td>{n.items.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );

  const renderAPCAPPSection = () => (
    <Card className="p-3 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#E3F2FD" }}>
        <h5 className="mb-0">💰 APC / APP Report</h5>
      </Card.Header>
      <Card.Body>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              <th>Type</th>
              <th>Amount (₹)</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {apcAppSummary.map((a, i) => (
              <tr key={i}>
                <td>{a.type}</td>
                <td>{a.amount.toFixed(2)}</td>
                <td>{a.details}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );

  const renderSpecialItemsSection = () => (
    <Card className="p-3 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#E8F5E9" }}>
        <h5 className="mb-0">⭐ Special Items</h5>
      </Card.Header>
      <Card.Body>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              <th>Name</th>
              <th>Qty</th>
              <th>Sales (₹)</th>
            </tr>
          </thead>
          <tbody>
            {specialItemsSummary.map((s, i) => (
              <tr key={i}>
                <td>{s.name}</td>
                <td>{s.qty}</td>
                <td>{s.sales.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );

  const renderInterDeptCashSection = () => (
    <Card className="p-3 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#FFF3E0" }}>
        <h5 className="mb-0">💸 Cash Paid/Received Between Departments</h5>
      </Card.Header>
      <Card.Body>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#E8F5E9" }}>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Amount (₹)</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {interDeptCash.map((i, j) => (
              <tr key={j}>
                <td>{i.from}</td>
                <td>{i.to}</td>
                <td>{i.amount.toFixed(2)}</td>
                <td>{i.type}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );

  const renderDailySalesUserShiftSection = () => (
    <Card className="p-3 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#E0F7FA" }}>
        <h5 className="mb-0">👥 Daily Sales User Shift</h5>
      </Card.Header>
      <Card.Body>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              <th>User</th>
              <th>Shift</th>
              <th>Sales (₹)</th>
            </tr>
          </thead>
          <tbody>
            {dailySalesUserShift.map((d, i) => (
              <tr key={i}>
                <td>{d.user}</td>
                <td>{d.shift}</td>
                <td>{d.sales.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );

  const renderMonthlySalesSection = () => (
    <Card className="p-3 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#E8F5E9" }}>
        <h5 className="mb-0">📅 Monthly Sales</h5>
      </Card.Header>
      <Card.Body>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              <th>Month</th>
              <th>Sales (₹)</th>
            </tr>
          </thead>
          <tbody>
            {monthlySalesSummary.map((m, i) => (
              <tr key={i}>
                <td>{m.month}</td>
                <td>{m.sales.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );

  const renderPaymentModeSalesSection = () => (
    <Card className="p-3 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#E3F2FD" }}>
        <h5 className="mb-0">💳 Payment Mode Sales</h5>
      </Card.Header>
      <Card.Body>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              <th>Mode</th>
              <th>Sales (₹)</th>
            </tr>
          </thead>
          <tbody>
            {paymentModeSalesSummary.map((p, i) => (
              <tr key={i}>
                <td>{p.mode}</td>
                <td>{p.total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );

  const renderKitchenAllocationSection = () => (
    <Card className="p-3 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#FCE4EC" }}>
        <h5 className="mb-0">🍳 Kitchen Allocation</h5>
      </Card.Header>
      <Card.Body>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              <th>Kitchen</th>
              <th>Allocation</th>
            </tr>
          </thead>
          <tbody>
            {kitchenAllocation.map((k, i) => (
              <tr key={i}>
                <td>{k.kitchen}</td>
                <td>{k.allocation}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );

  const renderDayEndSection = () => (
    <Card className="p-3 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#E8F5E9" }}>
        <h5 className="mb-0">📅 Day End Report</h5>
      </Card.Header>
      <Card.Body>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              <th>Metric</th>
              <th>Value (₹)</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Total Sales</td><td>{dayEndReport.totalSales.toFixed(2)}</td></tr>
            <tr><td>Cash In Hand</td><td>{dayEndReport.cashInHand.toFixed(2)}</td></tr>
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );

  const renderHandoverSection = () => (
    <Card className="p-3 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#E0F7FA" }}>
        <h5 className="mb-0">🔄 Handover Report</h5>
      </Card.Header>
      <Card.Body>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              <th>Handover Time</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>{new Date(handoverReport.handoverTime).toLocaleString()}</td><td>{handoverReport.notes}</td></tr>
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );

  const renderBillReprintedSection = () => (
    <Card className="p-3 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#FFF3E0" }}>
        <h5 className="mb-0">🖨️ Bill Reprinted</h5>
      </Card.Header>
      <Card.Body>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#E8F5E9" }}>
            <tr>
              <th>Bill No</th>
              <th>Reprints</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {billReprinted.map((b, i) => (
              <tr key={i}>
                <td>{b.billNo}</td>
                <td>{b.reprints}</td>
                <td>{b.reason}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );

  const renderKotUsedSummarySection = () => (
    <Card className="p-3 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#E3F2FD" }}>
        <h5 className="mb-0">📋 KOT Used Summary</h5>
      </Card.Header>
      <Card.Body>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              <th>KOT No</th>
              <th>Used In</th>
              <th>Items</th>
            </tr>
          </thead>
          <tbody>
            {kotUsedSummary.map((k, i) => (
              <tr key={i}>
                <td>{k.kotNo}</td>
                <td>{k.usedIn}</td>
                <td>{k.items}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );

  const renderReportContent = () => {
    switch (reportCategory) {
      case "billSummary":
        return renderBillSummarySection();
      case "creditSummary":
        return renderCreditSummarySection();
      case "discountSummary":
        return renderDiscountSummarySection();
      case "reverseKOTs":
        return renderReverseKOTsSection();
      case "kitchenWise":
        return renderKitchenWiseSection();
      case "ncKOT":
        return renderNCKOTSection();
      case "apcApp":
        return renderAPCAPPSection();
      case "specialItems":
        return renderSpecialItemsSection();
      case "interDeptCash":
        return renderInterDeptCashSection();
      case "dailySalesUserShift":
        return renderDailySalesUserShiftSection();
      case "monthlySales":
        return renderMonthlySalesSection();
      case "paymentModeSales":
        return renderPaymentModeSalesSection();
      case "kitchenAllocation":
        return renderKitchenAllocationSection();
      case "dayEnd":
        return renderDayEndSection();
      case "handover":
        return renderHandoverSection();
      case "billReprinted":
        return renderBillReprintedSection();
      case "kotUsedSummary":
        return renderKotUsedSummarySection();
      default:
        return renderBillSummarySection();
    }
  };

  return (
    <Card className="apps-card">
      <div className="apps-container">
        <div className="apps-container-inner p-4">
         
            
              <h4 className="text-center mb-4 fw-bold text-secondary">
                📊 Restaurant Reporting System
              </h4>

              {/* Enhanced Filter Section */}
              <Row className="mb-2 g-2">
                

                
                  
              

                <Col md={3}>
                  <Form.Select value={reportCategory} onChange={(e) => setReportCategory(e.target.value)}>
                    <option value="">Select Report Category</option>
                    <option value="billSummary">Bill Summary</option>
                    <option value="creditSummary">Credit Summary</option>
                    <option value="discountSummary">Discount Summary</option>
                    <option value="reverseKOTs">Reverse KOTs and Bills</option>
                    <option value="kitchenWise">Kitchen Wise Sales</option>
                    <option value="ncKOT">NC KOT Details</option>
                    <option value="apcApp">APC / APP Report</option>
                    <option value="specialItems">Special Items</option>
                    <option value="interDeptCash">Cash Paid/Received Between Departments</option>
                    <option value="dailySalesUserShift">Daily Sales User Shift</option>
                    <option value="monthlySales">Monthly Sales</option>
                    <option value="paymentModeSales">Payment Mode Sales</option>
                    <option value="kitchenAllocation">Kitchen Allocation</option>
                    <option value="dayEnd">Day End Report</option>
                    <option value="handover">Handover Report</option>
                    <option value="billReprinted">Bill Reprinted</option>
                    <option value="kotUsedSummary">KOT Used Summary</option>
                  </Form.Select>
                </Col>

                <>
                    <Col md={2}>
                      <Form.Control
                        type="date"
                        placeholder="From Date"
                        value={customRange.start}
                        onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                      />
                    </Col>
                    <Col md={2}>
                      <Form.Control
                        type="date"
                        placeholder="To Date"
                        value={customRange.end}
                        onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                      />
                    </Col>
                  </>

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

           

        
        </div>
      </div>
    </Card>
  );
};

export default ReportPage;