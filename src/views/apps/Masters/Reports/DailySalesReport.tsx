import React, { useState, useEffect } from "react";
import { Card, Table, Form, Button, Row, Col, Modal, Dropdown, Tab, Tabs, Badge } from "react-bootstrap";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

const ReportPage = () => {
  // Define a type for report data with an index signature
  type ReportData = {
    [key: string]: any;
  };

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
    { id: 1, billNo: "Bill003", reason: "Customer Cancel", timestamp: new Date().toISOString(), billDate: new Date().toISOString().split('T')[0], kotNo: "KOT001", revKot: false, grossAmount: 1000, discount: 50, amount: 950, cgst: 95, sgst: 95, cess: 0, serviceCharge: 20, totalAmount: 1160, paymentMode: "Cash", customerName: "John Doe", address: "123 Main St", mobile: "1234567890", orderType: "Dine In" },
    // Add more
  ];

  const mockKitchens = ["Main Kitchen", "Tandoor", "Bar"];
  const mockKitchenSales = {
    "Main Kitchen": 15000,
    "Tandoor": 8000,
    "Bar": 5000
  };

  const mockNCKOTs = [
    { id: 1, kotNo: "KOT001", status: "NC", items: ["Item1"], billNo: "Bill001", billDate: new Date().toISOString().split('T')[0], revKot: false, grossAmount: 1000, discount: 50, amount: 950, cgst: 95, sgst: 95, cess: 0, serviceCharge: 20, totalAmount: 1160, paymentMode: "Cash", customerName: "John Doe", address: "123 Main St", mobile: "1234567890", orderType: "Dine In" },
    // Add more
  ];

  const mockAPCPayments = [
    { type: "APC", amount: 2000, details: "Advance Payment", billNo: "Bill001", billDate: new Date().toISOString().split('T')[0], kotNo: "KOT001", revKot: false, grossAmount: 1000, discount: 50, amount: 950, cgst: 95, sgst: 95, cess: 0, serviceCharge: 20, totalAmount: 1160, paymentMode: "Cash", customerName: "John Doe", address: "123 Main St", mobile: "1234567890", orderType: "Dine In" },
    { type: "APP", amount: 1500, details: "Party Payment", billNo: "Bill002", billDate: new Date().toISOString().split('T')[0], kotNo: "KOT002", revKot: false, grossAmount: 800, discount: 40, amount: 760, cgst: 76, sgst: 76, cess: 0, serviceCharge: 15, totalAmount: 927, paymentMode: "Card", customerName: "Jane Doe", address: "456 Oak St", mobile: "0987654321", orderType: "Take Away" }
  ];

  const mockSpecialItems = [
    { name: "Special Dish", qty: 5, sales: 2500, billNo: "Bill001", billDate: new Date().toISOString().split('T')[0], kotNo: "KOT001", revKot: false, grossAmount: 1000, discount: 50, amount: 950, cgst: 95, sgst: 95, cess: 0, serviceCharge: 20, totalAmount: 1160, paymentMode: "Cash", customerName: "John Doe", address: "123 Main St", mobile: "1234567890", orderType: "Dine In" },
    // Add more
  ];

  const mockInterDeptCash = [
    { from: "Kitchen", to: "Front Desk", amount: 1000, type: "Paid", billNo: "Bill001", billDate: new Date().toISOString().split('T')[0], kotNo: "KOT001", revKot: false, grossAmount: 1000, discount: 50, amount: 950, cgst: 95, sgst: 95, cess: 0, serviceCharge: 20, totalAmount: 1160, paymentMode: "Cash", customerName: "John Doe", address: "123 Main St", mobile: "1234567890", orderType: "Dine In" },
    { from: "Front Desk", to: "Bar", amount: 500, type: "Received", billNo: "Bill002", billDate: new Date().toISOString().split('T')[0], kotNo: "KOT002", revKot: false, grossAmount: 800, discount: 40, amount: 760, cgst: 76, sgst: 76, cess: 0, serviceCharge: 15, totalAmount: 927, paymentMode: "Card", customerName: "Jane Doe", address: "456 Oak St", mobile: "0987654321", orderType: "Take Away" }
  ];

  const mockUserShifts = [
    { user: "User1", shift: "Morning", sales: 10000, billNo: "Bill001", billDate: new Date().toISOString().split('T')[0], kotNo: "KOT001", revKot: false, grossAmount: 1000, discount: 50, amount: 950, cgst: 95, sgst: 95, cess: 0, serviceCharge: 20, totalAmount: 1160, paymentMode: "Cash", customerName: "John Doe", address: "123 Main St", mobile: "1234567890", orderType: "Dine In" },
    { user: "User2", shift: "Evening", sales: 12000, billNo: "Bill002", billDate: new Date().toISOString().split('T')[0], kotNo: "KOT002", revKot: false, grossAmount: 800, discount: 40, amount: 760, cgst: 76, sgst: 76, cess: 0, serviceCharge: 15, totalAmount: 927, paymentMode: "Card", customerName: "Jane Doe", address: "456 Oak St", mobile: "0987654321", orderType: "Take Away" }
  ];

  const mockMonthlySales = [
    { month: "Jan", sales: 50000, billNo: "Bill001", billDate: new Date().toISOString().split('T')[0], kotNo: "KOT001", revKot: false, grossAmount: 1000, discount: 50, amount: 950, cgst: 95, sgst: 95, cess: 0, serviceCharge: 20, totalAmount: 1160, paymentMode: "Cash", customerName: "John Doe", address: "123 Main St", mobile: "1234567890", orderType: "Dine In" },
    { month: "Feb", sales: 55000, billNo: "Bill002", billDate: new Date().toISOString().split('T')[0], kotNo: "KOT002", revKot: false, grossAmount: 800, discount: 40, amount: 760, cgst: 76, sgst: 76, cess: 0, serviceCharge: 15, totalAmount: 927, paymentMode: "Card", customerName: "Jane Doe", address: "456 Oak St", mobile: "0987654321", orderType: "Take Away" }
  ];

  const mockPaymentModeSales = [
    { mode: "Cash", sales: 20000, billNo: "Bill001", billDate: new Date().toISOString().split('T')[0], kotNo: "KOT001", revKot: false, grossAmount: 1000, discount: 50, amount: 950, cgst: 95, sgst: 95, cess: 0, serviceCharge: 20, totalAmount: 1160, paymentMode: "Cash", customerName: "John Doe", address: "123 Main St", mobile: "1234567890", orderType: "Dine In" },
    { mode: "Card", sales: 15000, billNo: "Bill002", billDate: new Date().toISOString().split('T')[0], kotNo: "KOT002", revKot: false, grossAmount: 800, discount: 40, amount: 760, cgst: 76, sgst: 76, cess: 0, serviceCharge: 15, totalAmount: 927, paymentMode: "Card", customerName: "Jane Doe", address: "456 Oak St", mobile: "0987654321", orderType: "Take Away" }
  ];

  const mockKitchenAlloc = [
    { kitchen: "Main", allocation: "80%", billNo: "Bill001", billDate: new Date().toISOString().split('T')[0], kotNo: "KOT001", revKot: false, grossAmount: 1000, discount: 50, amount: 950, cgst: 95, sgst: 95, cess: 0, serviceCharge: 20, totalAmount: 1160, paymentMode: "Cash", customerName: "John Doe", address: "123 Main St", mobile: "1234567890", orderType: "Dine In" },
    { kitchen: "Tandoor", allocation: "20%", billNo: "Bill002", billDate: new Date().toISOString().split('T')[0], kotNo: "KOT002", revKot: false, grossAmount: 800, discount: 40, amount: 760, cgst: 76, sgst: 76, cess: 0, serviceCharge: 15, totalAmount: 927, paymentMode: "Card", customerName: "Jane Doe", address: "456 Oak St", mobile: "0987654321", orderType: "Take Away" }
  ];

  const mockDayEnd = { totalSales: 30000, cashInHand: 25000, discrepancies: [], billNo: "Bill001", billDate: new Date().toISOString().split('T')[0], kotNo: "KOT001", revKot: false, grossAmount: 1000, discount: 50, amount: 950, cgst: 95, sgst: 95, cess: 0, serviceCharge: 20, totalAmount: 1160, paymentMode: "Cash", customerName: "John Doe", address: "123 Main St", mobile: "1234567890", orderType: "Dine In" };

  const mockHandover = { handoverTime: new Date().toISOString(), notes: "Smooth handover", billNo: "Bill001", billDate: new Date().toISOString().split('T')[0], kotNo: "KOT001", revKot: false, grossAmount: 1000, discount: 50, amount: 950, cgst: 95, sgst: 95, cess: 0, serviceCharge: 20, totalAmount: 1160, paymentMode: "Cash", customerName: "John Doe", address: "123 Main St", mobile: "1234567890", orderType: "Dine In" };

  const mockBillReprinted = [
    { billNo: "Bill004", reprints: 2, reason: "Customer Request", billDate: new Date().toISOString().split('T')[0], kotNo: "KOT004", revKot: false, grossAmount: 1200, discount: 60, amount: 1140, cgst: 114, sgst: 114, cess: 0, serviceCharge: 25, totalAmount: 1393, paymentMode: "UPI", customerName: "Bob Smith", address: "789 Pine St", mobile: "1122334455", orderType: "Delivery" }
  ];

  const mockKotUsed = [
    { kotNo: "KOT002", usedIn: "Bill005", items: 3, billDate: new Date().toISOString().split('T')[0], revKot: false, grossAmount: 900, discount: 45, amount: 855, cgst: 85.5, sgst: 85.5, cess: 0, serviceCharge: 18, totalAmount: 1044, paymentMode: "Cash", customerName: "Alice Johnson", address: "321 Elm St", mobile: "5566778899", orderType: "Dine In" }
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
      tax: (bill.cgstAmt || 0) + (bill.sgstAmt || 0),
      // Ensure all required fields are present, mock if not
      billDate: bill.date || bill.createdAt || new Date().toISOString().split('T')[0],
      kotNo: bill.kotNo || "N/A",
      revKot: bill.revKot || false,
      grossAmount: bill.grossAmount || bill.subTotal || 0,
      discount: bill.discount || 0,
      amount: bill.amount || (bill.grandTotal - (bill.cgstAmt || 0) - (bill.sgstAmt || 0) - (bill.cess || 0) - (bill.serviceCharge || 0)) || 0,
      cgst: bill.cgstAmt || 0,
      sgst: bill.sgstAmt || 0,
      cess: bill.cess || 0,
      serviceCharge: bill.serviceCharge || 0,
      totalAmount: bill.grandTotal || 0,
      paymentMode: bill.paymentMode || "Cash",
      customerName: bill.customerName || "N/A",
      address: bill.address || "N/A",
      mobile: bill.mobile || "N/A",
      orderType: bill.orderType || "N/A"
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
        const d = new Date(bill.billDate);
        return d.toDateString() === today.toDateString();
      });
    } else if (reportType === "monthly") {
      filtered = filtered.filter((bill) => {
        const d = new Date(bill.billDate);
        return (
          d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
        );
      });
    } else if (reportType === "custom" && customRange.start && customRange.end) {
      const start = new Date(customRange.start);
      const end = new Date(customRange.end);
      filtered = filtered.filter((bill) => {
        const d = new Date(bill.billDate);
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
      summary[mode] = (summary[mode] || 0) + (bill.totalAmount || 0);
    });
    return Object.entries(summary).map(([mode, total]) => ({ mode, total: total as number, billNo: bills[0]?.billNo || "N/A", billDate: bills[0]?.billDate || "", kotNo: bills[0]?.kotNo || "", revKot: bills[0]?.revKot || false, grossAmount: bills[0]?.grossAmount || 0, discount: bills[0]?.discount || 0, amount: bills[0]?.amount || 0, cgst: bills[0]?.cgst || 0, sgst: bills[0]?.sgst || 0, cess: bills[0]?.cess || 0, serviceCharge: bills[0]?.serviceCharge || 0, totalAmount: bills[0]?.totalAmount || 0, paymentMode: mode, customerName: bills[0]?.customerName || "", address: bills[0]?.address || "", mobile: bills[0]?.mobile || "", orderType: bills[0]?.orderType || "" }));
  };

  // New calculations for added reports
  const calculateBillSummary = (bills: any[]) => {
    return bills.map(bill => ({
      ...bill,
      creditDetails: mockCreditDetails[bill.billNo] || { cardNumber: "N/A", bank: "N/A", amount: 0 }
    }));
  };

  const calculateCreditSummary = (bills: any[]) => {
    const credits = bills.filter(b => b.paymentMode === "Credit").reduce((acc, b) => acc + (b.totalAmount || 0), 0);
    return [{ type: "Total Credit", amount: credits, billNo: bills[0]?.billNo || "N/A", billDate: bills[0]?.billDate || "", kotNo: bills[0]?.kotNo || "", revKot: bills[0]?.revKot || false, grossAmount: bills[0]?.grossAmount || 0, discount: bills[0]?.discount || 0, amount: bills[0]?.amount || 0, cgst: bills[0]?.cgst || 0, sgst: bills[0]?.sgst || 0, cess: bills[0]?.cess || 0, serviceCharge: bills[0]?.serviceCharge || 0, totalAmount: bills[0]?.totalAmount || 0, paymentMode: "Credit", customerName: bills[0]?.customerName || "", address: bills[0]?.address || "", mobile: bills[0]?.mobile || "", orderType: bills[0]?.orderType || "" }];
  };

  const calculateDiscountSummary = (bills: any[]) => {
    const totalDiscount = bills.reduce((s, b) => s + (b.discount || 0), 0);
    const avgDiscount = totalDiscount / bills.length || 0;
    return [{ type: "Total Discount", amount: totalDiscount, billNo: bills[0]?.billNo || "N/A", billDate: bills[0]?.billDate || "", kotNo: bills[0]?.kotNo || "", revKot: bills[0]?.revKot || false, grossAmount: bills[0]?.grossAmount || 0, discount: totalDiscount, amount: bills[0]?.amount || 0, cgst: bills[0]?.cgst || 0, sgst: bills[0]?.sgst || 0, cess: bills[0]?.cess || 0, serviceCharge: bills[0]?.serviceCharge || 0, totalAmount: bills[0]?.totalAmount || 0, paymentMode: bills[0]?.paymentMode || "", customerName: bills[0]?.customerName || "", address: bills[0]?.address || "", mobile: bills[0]?.mobile || "", orderType: bills[0]?.orderType || "" }, { type: "Avg Discount", amount: avgDiscount, billNo: bills[0]?.billNo || "N/A", billDate: bills[0]?.billDate || "", kotNo: bills[0]?.kotNo || "", revKot: bills[0]?.revKot || false, grossAmount: bills[0]?.grossAmount || 0, discount: avgDiscount, amount: bills[0]?.amount || 0, cgst: bills[0]?.cgst || 0, sgst: bills[0]?.sgst || 0, cess: bills[0]?.cess || 0, serviceCharge: bills[0]?.serviceCharge || 0, totalAmount: bills[0]?.totalAmount || 0, paymentMode: bills[0]?.paymentMode || "", customerName: bills[0]?.customerName || "", address: bills[0]?.address || "", mobile: bills[0]?.mobile || "", orderType: bills[0]?.orderType || "" }];
  };

  const calculateReverseKOTsBills = () => mockReverseKOTs;

  const calculateKitchenWiseSales = () => {
    // Mock based on kitchens
    return Object.entries(mockKitchenSales).map(([kitchen, sales]) => ({ kitchen, sales, billNo: "N/A", billDate: "", kotNo: "", revKot: false, grossAmount: 0, discount: 0, amount: 0, cgst: 0, sgst: 0, cess: 0, serviceCharge: 0, totalAmount: sales, paymentMode: "", customerName: "", address: "", mobile: "", orderType: "" }));
  };

  const calculateNCKOTDetails = () => mockNCKOTs;

  const calculateAPCAPPSummary = () => mockAPCPayments;

  const calculateSpecialItemsSummary = () => mockSpecialItems;

  const calculateInterDeptCash = () => mockInterDeptCash;

  const calculateDailySalesUserShift = () => mockUserShifts;

  const calculateMonthlySalesSummary = () => mockMonthlySales;

  const calculatePaymentModeSalesSummary = (bills: any[]) => calculatePaymentSummary(bills); // Reuse

  const calculateKitchenAllocation = () => mockKitchenAlloc;

  const calculateDayEndReport = () => ({ ...mockDayEnd, billNo: mockDayEnd.billNo, billDate: mockDayEnd.billDate, kotNo: mockDayEnd.kotNo, revKot: mockDayEnd.revKot, grossAmount: mockDayEnd.grossAmount, discount: mockDayEnd.discount, amount: mockDayEnd.amount, cgst: mockDayEnd.cgst, sgst: mockDayEnd.sgst, cess: mockDayEnd.cess, serviceCharge: mockDayEnd.serviceCharge, totalAmount: mockDayEnd.totalSales, paymentMode: mockDayEnd.paymentMode, customerName: mockDayEnd.customerName, address: mockDayEnd.address, mobile: mockDayEnd.mobile, orderType: mockDayEnd.orderType });

  const calculateHandoverReport = () => ({ ...mockHandover, billNo: mockHandover.billNo, billDate: mockHandover.billDate, kotNo: mockHandover.kotNo, revKot: mockHandover.revKot, grossAmount: mockHandover.grossAmount, discount: mockHandover.discount, amount: mockHandover.amount, cgst: mockHandover.cgst, sgst: mockHandover.sgst, cess: mockHandover.cess, serviceCharge: mockHandover.serviceCharge, totalAmount: mockHandover.totalAmount, paymentMode: mockHandover.paymentMode, customerName: mockHandover.customerName, address: mockHandover.address, mobile: mockHandover.mobile, orderType: mockHandover.orderType });

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
    const commonFields = ["billNo", "billDate", "kotNo", "revKot", "grossAmount", "discount", "amount", "cgst", "sgst", "cess", "serviceCharge", "totalAmount", "paymentMode", "customerName", "address", "mobile", "orderType"];
    if (reportCategory === "billSummary") {
      data = billSummaryData.map((b: ReportData) => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = b[field]);
        row["Card Number"] = b.creditDetails.cardNumber;
        row["Bank"] = b.creditDetails.bank;
        row["Card Amount"] = b.creditDetails.amount;
        return row;
      });
    } else if (reportCategory === "creditSummary") {
      data = creditSummary.map((c: ReportData) => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = c[field]);
        row["Type"] = c.type;
        row["Amount"] = c.amount;
        return row;
      });
    } else if (reportCategory === "discountSummary") {
      data = discountSummary.map((d: ReportData) => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = d[field]);
        row["Type"] = d.type;
        row["Amount"] = d.amount;
        return row;
      });
    } else if (reportCategory === "reverseKOTs") {
      data = reverseKOTsBills.map((r: ReportData) => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = r[field]);
        row["ID"] = r.id;
        row["Reason"] = r.reason;
        row["Timestamp"] = r.timestamp;
        return row;
      });
    } else if (reportCategory === "kitchenWise") {
      data = kitchenWiseSales.map((k: ReportData) => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = k[field]);
        row["Kitchen"] = k.kitchen;
        row["Sales"] = k.sales;
        return row;
      });
    } else if (reportCategory === "ncKOT") {
      data = ncKOTDetails.map((n: ReportData) => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = n[field]);
        row["ID"] = n.id;
        row["Status"] = n.status;
        row["Items"] = n.items.join(", ");
        return row;
      });
    } else if (reportCategory === "apcApp") {
      data = apcAppSummary.map((a: ReportData) => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = a[field]);
        row["Type"] = a.type;
        row["Amount"] = a.amount;
        row["Details"] = a.details;
        return row;
      });
    } else if (reportCategory === "specialItems") {
      data = specialItemsSummary.map((s: ReportData) => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = s[field]);
        row["Name"] = s.name;
        row["Qty"] = s.qty;
        row["Sales"] = s.sales;
        return row;
      });
    } else if (reportCategory === "interDeptCash") {
      data = interDeptCash.map((i: ReportData) => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = i[field]);
        row["From"] = i.from;
        row["To"] = i.to;
        row["Amount"] = i.amount;
        row["Type"] = i.type;
        return row;
      });
    } else if (reportCategory === "dailySalesUserShift") {
      data = dailySalesUserShift.map((d: ReportData) => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = d[field]);
        row["User"] = d.user;
        row["Shift"] = d.shift;
        row["Sales"] = d.sales;
        return row;
      });
    } else if (reportCategory === "monthlySales") {
      data = monthlySalesSummary.map((m: ReportData) => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = m[field]);
        row["Month"] = m.month;
        row["Sales"] = m.sales;
        return row;
      });
    } else if (reportCategory === "paymentModeSales") {
      data = paymentModeSalesSummary.map((p: ReportData) => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = p[field]);
        row["Mode"] = p.mode;
        row["Sales"] = p.total;
        return row;
      });
    } else if (reportCategory === "kitchenAllocation") {
      data = kitchenAllocation.map((k: ReportData) => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = k[field]);
        row["Kitchen"] = k.kitchen;
        row["Allocation"] = k.allocation;
        return row;
      });
    } else if (reportCategory === "dayEnd") {
      const row: any = {};
      commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = (dayEndReport as ReportData)[field]);
      row["Total Sales"] = dayEndReport.totalSales;
      row["Cash In Hand"] = dayEndReport.cashInHand;
      data = [row];
    } else if (reportCategory === "handover") {
      const row: any = {};
      commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = (handoverReport as ReportData)[field]);
      row["Handover Time"] = handoverReport.handoverTime;
      row["Notes"] = handoverReport.notes;
      data = [row];
    } else if (reportCategory === "billReprinted") {
      data = billReprinted.map((b: ReportData) => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = b[field]);
        row["Reprints"] = b.reprints;
        row["Reason"] = b.reason;
        return row;
      });
    } else if (reportCategory === "kotUsedSummary") {
      data = kotUsedSummary.map((k: ReportData) => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = k[field]);
        row["Used In"] = k.usedIn;
        row["Items"] = k.items;
        return row;
      });
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

    const commonHead = ["Bill No", "Bill Date", "KOT No", "Rev KOT", "Gross Amount (₹)", "Discount (₹)", "Amount (₹)", "CGST (₹)", "SGST (₹)", "Cess (₹)", "Service Charge (₹)", "Total Amount (₹)", "Payment Mode", "Customer Name", "Address", "Mobile", "Order Type"];

    if (reportCategory === "billSummary") {
      head = [...commonHead, "Card Number", "Bank", "Card Amount (₹)"];
      body = billSummaryData.slice(0, 10).map((b: ReportData) => [
        b.billNo, 
        b.billDate, 
        b.kotNo, 
        b.revKot ? "Yes" : "No", 
        b.grossAmount.toFixed(2), 
        b.discount.toFixed(2), 
        b.amount.toFixed(2), 
        b.cgst.toFixed(2), 
        b.sgst.toFixed(2), 
        b.cess.toFixed(2), 
        b.serviceCharge.toFixed(2), 
        b.totalAmount.toFixed(2), 
        b.paymentMode, 
        b.customerName, 
        b.address, 
        b.mobile, 
        b.orderType,
        b.creditDetails.cardNumber,
        b.creditDetails.bank,
        b.creditDetails.amount.toFixed(2)
      ]);
    } else if (reportCategory === "creditSummary") {
      head = [...commonHead, "Type", "Amount (₹)"];
      body = creditSummary.map((c: ReportData) => [
        c.billNo, 
        c.billDate, 
        c.kotNo, 
        c.revKot ? "Yes" : "No", 
        c.grossAmount.toFixed(2), 
        c.discount.toFixed(2), 
        c.amount.toFixed(2), 
        c.cgst.toFixed(2), 
        c.sgst.toFixed(2), 
        c.cess.toFixed(2), 
        c.serviceCharge.toFixed(2), 
        c.totalAmount.toFixed(2), 
        c.paymentMode, 
        c.customerName, 
        c.address, 
        c.mobile, 
        c.orderType,
        c.type,
        c.amount.toFixed(2)
      ]);
    } else if (reportCategory === "discountSummary") {
      head = [...commonHead, "Type", "Amount (₹)"];
      body = discountSummary.map((d: ReportData) => [
        d.billNo, 
        d.billDate, 
        d.kotNo, 
        d.revKot ? "Yes" : "No", 
        d.grossAmount.toFixed(2), 
        d.discount.toFixed(2), 
        d.amount.toFixed(2), 
        d.cgst.toFixed(2), 
        d.sgst.toFixed(2), 
        d.cess.toFixed(2), 
        d.serviceCharge.toFixed(2), 
        d.totalAmount.toFixed(2), 
        d.paymentMode, 
        d.customerName, 
        d.address, 
        d.mobile, 
        d.orderType,
        d.type,
        d.amount.toFixed(2)
      ]);
    } else if (reportCategory === "reverseKOTs") {
      head = [...commonHead, "ID", "Reason", "Timestamp"];
      body = reverseKOTsBills.map((r: ReportData) => [
        r.billNo, 
        r.billDate, 
        r.kotNo, 
        r.revKot ? "Yes" : "No", 
        r.grossAmount.toFixed(2), 
        r.discount.toFixed(2), 
        r.amount.toFixed(2), 
        r.cgst.toFixed(2), 
        r.sgst.toFixed(2), 
        r.cess.toFixed(2), 
        r.serviceCharge.toFixed(2), 
        r.totalAmount.toFixed(2), 
        r.paymentMode, 
        r.customerName, 
        r.address, 
        r.mobile, 
        r.orderType,
        r.id,
        r.reason,
        r.timestamp
      ]);
    } else if (reportCategory === "kitchenWise") {
      head = [...commonHead, "Kitchen", "Sales (₹)"];
      body = kitchenWiseSales.map((k: ReportData) => [
        k.billNo, 
        k.billDate, 
        k.kotNo, 
        k.revKot ? "Yes" : "No", 
        k.grossAmount.toFixed(2), 
        k.discount.toFixed(2), 
        k.amount.toFixed(2), 
        k.cgst.toFixed(2), 
        k.sgst.toFixed(2), 
        k.cess.toFixed(2), 
        k.serviceCharge.toFixed(2), 
        k.totalAmount.toFixed(2), 
        k.paymentMode, 
        k.customerName, 
        k.address, 
        k.mobile, 
        k.orderType,
        k.kitchen,
        k.sales.toFixed(2)
      ]);
    } else if (reportCategory === "ncKOT") {
      head = [...commonHead, "ID", "Status", "Items"];
      body = ncKOTDetails.map((n: ReportData) => [
        n.billNo, 
        n.billDate, 
        n.kotNo, 
        n.revKot ? "Yes" : "No", 
        n.grossAmount.toFixed(2), 
        n.discount.toFixed(2), 
        n.amount.toFixed(2), 
        n.cgst.toFixed(2), 
        n.sgst.toFixed(2), 
        n.cess.toFixed(2), 
        n.serviceCharge.toFixed(2), 
        n.totalAmount.toFixed(2), 
        n.paymentMode, 
        n.customerName, 
        n.address, 
        n.mobile, 
        n.orderType,
        n.id,
        n.status,
        n.items.join(", ")
      ]);
    } else if (reportCategory === "apcApp") {
      head = [...commonHead, "Type", "Amount (₹)", "Details"];
      body = apcAppSummary.map((a: ReportData) => [
        a.billNo, 
        a.billDate, 
        a.kotNo, 
        a.revKot ? "Yes" : "No", 
        a.grossAmount.toFixed(2), 
        a.discount.toFixed(2), 
        a.amount.toFixed(2), 
        a.cgst.toFixed(2), 
        a.sgst.toFixed(2), 
        a.cess.toFixed(2), 
        a.serviceCharge.toFixed(2), 
        a.totalAmount.toFixed(2), 
        a.paymentMode, 
        a.customerName, 
        a.address, 
        a.mobile, 
        a.orderType,
        a.type,
        a.amount.toFixed(2),
        a.details
      ]);
    } else if (reportCategory === "specialItems") {
      head = [...commonHead, "Name", "Qty", "Sales (₹)"];
      body = specialItemsSummary.map((s: ReportData) => [
        s.billNo, 
        s.billDate, 
        s.kotNo, 
        s.revKot ? "Yes" : "No", 
        s.grossAmount.toFixed(2), 
        s.discount.toFixed(2), 
        s.amount.toFixed(2), 
        s.cgst.toFixed(2), 
        s.sgst.toFixed(2), 
        s.cess.toFixed(2), 
        s.serviceCharge.toFixed(2), 
        s.totalAmount.toFixed(2), 
        s.paymentMode, 
        s.customerName, 
        s.address, 
        s.mobile, 
        s.orderType,
        s.name,
        s.qty,
        s.sales.toFixed(2)
      ]);
    } else if (reportCategory === "interDeptCash") {
      head = [...commonHead, "From", "To", "Amount (₹)", "Type"];
      body = interDeptCash.map((i: ReportData) => [
        i.billNo, 
        i.billDate, 
        i.kotNo, 
        i.revKot ? "Yes" : "No", 
        i.grossAmount.toFixed(2), 
        i.discount.toFixed(2), 
        i.amount.toFixed(2), 
        i.cgst.toFixed(2), 
        i.sgst.toFixed(2), 
        i.cess.toFixed(2), 
        i.serviceCharge.toFixed(2), 
        i.totalAmount.toFixed(2), 
        i.paymentMode, 
        i.customerName, 
        i.address, 
        i.mobile, 
        i.orderType,
        i.from,
        i.to,
        i.amount.toFixed(2),
        i.type
      ]);
    } else if (reportCategory === "dailySalesUserShift") {
      head = [...commonHead, "User", "Shift", "Sales (₹)"];
      body = dailySalesUserShift.map((d: ReportData) => [
        d.billNo, 
        d.billDate, 
        d.kotNo, 
        d.revKot ? "Yes" : "No", 
        d.grossAmount.toFixed(2), 
        d.discount.toFixed(2), 
        d.amount.toFixed(2), 
        d.cgst.toFixed(2), 
        d.sgst.toFixed(2), 
        d.cess.toFixed(2), 
        d.serviceCharge.toFixed(2), 
        d.totalAmount.toFixed(2), 
        d.paymentMode, 
        d.customerName, 
        d.address, 
        d.mobile, 
        d.orderType,
        d.user,
        d.shift,
        d.sales.toFixed(2)
      ]);
    } else if (reportCategory === "monthlySales") {
      head = [...commonHead, "Month", "Sales (₹)"];
      body = monthlySalesSummary.map((m: ReportData) => [
        m.billNo, 
        m.billDate, 
        m.kotNo, 
        m.revKot ? "Yes" : "No", 
        m.grossAmount.toFixed(2), 
        m.discount.toFixed(2), 
        m.amount.toFixed(2), 
        m.cgst.toFixed(2), 
        m.sgst.toFixed(2), 
        m.cess.toFixed(2), 
        m.serviceCharge.toFixed(2), 
        m.totalAmount.toFixed(2), 
        m.paymentMode, 
        m.customerName, 
        m.address, 
        m.mobile, 
        m.orderType,
        m.month,
        m.sales.toFixed(2)
      ]);
    } else if (reportCategory === "paymentModeSales") {
      head = [...commonHead, "Mode", "Sales (₹)"];
      body = paymentModeSalesSummary.map((p: ReportData) => [
        p.billNo, 
        p.billDate, 
        p.kotNo, 
        p.revKot ? "Yes" : "No", 
        p.grossAmount.toFixed(2), 
        p.discount.toFixed(2), 
        p.amount.toFixed(2), 
        p.cgst.toFixed(2), 
        p.sgst.toFixed(2), 
        p.cess.toFixed(2), 
        p.serviceCharge.toFixed(2), 
        p.totalAmount.toFixed(2), 
        p.paymentMode, 
        p.customerName, 
        p.address, 
        p.mobile, 
        p.orderType,
        p.mode,
        p.total.toFixed(2)
      ]);
    } else if (reportCategory === "kitchenAllocation") {
      head = [...commonHead, "Kitchen", "Allocation"];
      body = kitchenAllocation.map((k: ReportData) => [
        k.billNo, 
        k.billDate, 
        k.kotNo, 
        k.revKot ? "Yes" : "No", 
        k.grossAmount.toFixed(2), 
        k.discount.toFixed(2), 
        k.amount.toFixed(2), 
        k.cgst.toFixed(2), 
        k.sgst.toFixed(2), 
        k.cess.toFixed(2), 
        k.serviceCharge.toFixed(2), 
        k.totalAmount.toFixed(2), 
        k.paymentMode, 
        k.customerName, 
        k.address, 
        k.mobile, 
        k.orderType,
        k.kitchen,
        k.allocation
      ]);
    } else if (reportCategory === "dayEnd") {
      head = [...commonHead, "Metric", "Value (₹)"];
      body = [[
        (dayEndReport as ReportData).billNo, 
        dayEndReport.billDate, 
        dayEndReport.kotNo, 
        dayEndReport.revKot ? "Yes" : "No", 
        dayEndReport.grossAmount.toFixed(2), 
        dayEndReport.discount.toFixed(2), 
        dayEndReport.amount.toFixed(2), 
        dayEndReport.cgst.toFixed(2), 
        dayEndReport.sgst.toFixed(2), 
        dayEndReport.cess.toFixed(2), 
        dayEndReport.serviceCharge.toFixed(2), 
        dayEndReport.totalAmount.toFixed(2), 
        dayEndReport.paymentMode, 
        dayEndReport.customerName, 
        dayEndReport.address, 
        dayEndReport.mobile, 
        dayEndReport.orderType,
        "Total Sales",
        dayEndReport.totalSales.toFixed(2)
      ], [
        (dayEndReport as ReportData).billNo, 
        dayEndReport.billDate, 
        dayEndReport.kotNo, 
        dayEndReport.revKot ? "Yes" : "No", 
        dayEndReport.grossAmount.toFixed(2), 
        dayEndReport.discount.toFixed(2), 
        dayEndReport.amount.toFixed(2), 
        dayEndReport.cgst.toFixed(2), 
        dayEndReport.sgst.toFixed(2), 
        dayEndReport.cess.toFixed(2), 
        dayEndReport.serviceCharge.toFixed(2), 
        dayEndReport.totalAmount.toFixed(2), 
        dayEndReport.paymentMode, 
        dayEndReport.customerName, 
        dayEndReport.address, 
        dayEndReport.mobile, 
        dayEndReport.orderType,
        "Cash In Hand",
        dayEndReport.cashInHand.toFixed(2)
      ]];
    } else if (reportCategory === "handover") {
      head = [...commonHead, "Handover Time", "Notes"];
      body = [[
        (handoverReport as ReportData).billNo, 
        handoverReport.billDate, 
        handoverReport.kotNo, 
        handoverReport.revKot ? "Yes" : "No", 
        handoverReport.grossAmount.toFixed(2), 
        handoverReport.discount.toFixed(2), 
        handoverReport.amount.toFixed(2), 
        handoverReport.cgst.toFixed(2), 
        handoverReport.sgst.toFixed(2), 
        handoverReport.cess.toFixed(2), 
        handoverReport.serviceCharge.toFixed(2), 
        handoverReport.totalAmount.toFixed(2), 
        handoverReport.paymentMode, 
        handoverReport.customerName, 
        handoverReport.address, 
        handoverReport.mobile, 
        handoverReport.orderType,
        handoverReport.handoverTime,
        handoverReport.notes
      ]];
    } else if (reportCategory === "billReprinted") {
      head = [...commonHead, "Reprints", "Reason"];
      body = billReprinted.map((b: ReportData) => [
        b.billNo, 
        b.billDate, 
        b.kotNo, 
        b.revKot ? "Yes" : "No", 
        b.grossAmount.toFixed(2), 
        b.discount.toFixed(2), 
        b.amount.toFixed(2), 
        b.cgst.toFixed(2), 
        b.sgst.toFixed(2), 
        b.cess.toFixed(2), 
        b.serviceCharge.toFixed(2), 
        b.totalAmount.toFixed(2), 
        b.paymentMode, 
        b.customerName, 
        b.address, 
        b.mobile, 
        b.orderType,
        b.reprints,
        b.reason
      ]);
    } else if (reportCategory === "kotUsedSummary") {
      head = [...commonHead, "Used In", "Items"];
      body = kotUsedSummary.map((k: ReportData) => [
        k.billNo || k.usedIn, 
        k.billDate, 
        k.kotNo, 
        k.revKot ? "Yes" : "No", 
        k.grossAmount.toFixed(2), 
        k.discount.toFixed(2), 
        k.amount.toFixed(2), 
        k.cgst.toFixed(2), 
        k.sgst.toFixed(2), 
        k.cess.toFixed(2), 
        k.serviceCharge.toFixed(2), 
        k.totalAmount.toFixed(2), 
        k.paymentMode, 
        k.customerName, 
        k.address, 
        k.mobile, 
        k.orderType,
        k.usedIn,
        k.items
      ]);
    }

    (doc as any).autoTable({
      startY,
      head: [head],
      body,
    });
    
    doc.save(`restaurant-${reportCategory}-report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // New render sections with added fields
  const renderBillSummarySection = () => (
    <Card className="p-2 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#E3F2FD" }}>
        <h5 className="mb-0">📋 Bill Summary with Credit Card Details</h5>
      </Card.Header>
      <Card.Body style={{ overflowY: 'auto', maxHeight: '70vh' }}>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              {["Bill No", "Bill Date", "KOT No", "Rev KOT", "Gross Amount (₹)", "Discount (₹)", "Amount (₹)", "CGST (₹)", "SGST (₹)", "Cess (₹)", "Service Charge (₹)", "Total Amount (₹)", "Payment Mode", "Customer Name", "Address", "Mobile", "Order Type", "Card Number", "Bank", "Card Amount (₹)"].map((h, i) => (
                <th key={i} style={{ position: 'sticky', top: 0, backgroundColor: '#FFF3E0', zIndex: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {billSummaryData.map((b, i) => (
              <tr key={i}>
                <td>{b.billNo}</td>
                <td>{b.billDate}</td>
                <td>{b.kotNo}</td>
                <td>{b.revKot ? "Yes" : "No"}</td>
                <td>{b.grossAmount?.toFixed(2) || 0}</td>
                <td>{b.discount?.toFixed(2) || 0}</td>
                <td>{b.amount?.toFixed(2) || 0}</td>
                <td>{b.cgst?.toFixed(2) || 0}</td>
                <td>{b.sgst?.toFixed(2) || 0}</td>
                <td>{b.cess?.toFixed(2) || 0}</td>
                <td>{b.serviceCharge?.toFixed(2) || 0}</td>
                <td>{b.totalAmount?.toFixed(2) || 0}</td>
                <td>{b.paymentMode}</td>
                <td>{b.customerName}</td>
                <td>{b.address}</td>
                <td>{b.mobile}</td>
                <td>{b.orderType}</td>
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
    <Card className="p-2 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#E8F5E9" }}>
        <h5 className="mb-0">💳 Credit Summary</h5>
      </Card.Header>
      <Card.Body style={{ overflowY: 'auto', maxHeight: '70vh' }}>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              {["Bill No", "Bill Date", "KOT No", "Rev KOT", "Gross Amount (₹)", "Discount (₹)", "Amount (₹)", "CGST (₹)", "SGST (₹)", "Cess (₹)", "Service Charge (₹)", "Total Amount (₹)", "Payment Mode", "Customer Name", "Address", "Mobile", "Order Type", "Type", "Amount (₹)"].map((h, i) => (
                <th key={i} style={{ position: 'sticky', top: 0, backgroundColor: '#FFF3E0', zIndex: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {creditSummary.map((c, i) => (
              <tr key={i}>
                <td>{c.billNo}</td>
                <td>{c.billDate}</td>
                <td>{c.kotNo}</td>
                <td>{c.revKot ? "Yes" : "No"}</td>
                <td>{c.grossAmount.toFixed(2)}</td>
                <td>{c.discount.toFixed(2)}</td>
                <td>{c.amount.toFixed(2)}</td>
                <td>{c.cgst.toFixed(2)}</td>
                <td>{c.sgst.toFixed(2)}</td>
                <td>{c.cess.toFixed(2)}</td>
                <td>{c.serviceCharge.toFixed(2)}</td>
                <td>{c.totalAmount.toFixed(2)}</td>
                <td>{c.paymentMode}</td>
                <td>{c.customerName}</td>
                <td>{c.address}</td>
                <td>{c.mobile}</td>
                <td>{c.orderType}</td>
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
    <Card className="p-2 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#FFF3E0" }}>
        <h5 className="mb-0">💸 Discount Summary</h5>
      </Card.Header>
      <Card.Body style={{ overflowY: 'auto', maxHeight: '70vh' }}>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#E8F5E9" }}>
            <tr>
              {["Bill No", "Bill Date", "KOT No", "Rev KOT", "Gross Amount (₹)", "Discount (₹)", "Amount (₹)", "CGST (₹)", "SGST (₹)", "Cess (₹)", "Service Charge (₹)", "Total Amount (₹)", "Payment Mode", "Customer Name", "Address", "Mobile", "Order Type", "Type", "Amount (₹)"].map((h, i) => (
                <th key={i} style={{ position: 'sticky', top: 0, backgroundColor: '#E8F5E9', zIndex: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {discountSummary.map((d, i) => (
              <tr key={i}>
                <td>{d.billNo}</td>
                <td>{d.billDate}</td>
                <td>{d.kotNo}</td>
                <td>{d.revKot ? "Yes" : "No"}</td>
                <td>{d.grossAmount.toFixed(2)}</td>
                <td>{d.discount.toFixed(2)}</td>
                <td>{d.amount.toFixed(2)}</td>
                <td>{d.cgst.toFixed(2)}</td>
                <td>{d.sgst.toFixed(2)}</td>
                <td>{d.cess.toFixed(2)}</td>
                <td>{d.serviceCharge.toFixed(2)}</td>
                <td>{d.totalAmount.toFixed(2)}</td>
                <td>{d.paymentMode}</td>
                <td>{d.customerName}</td>
                <td>{d.address}</td>
                <td>{d.mobile}</td>
                <td>{d.orderType}</td>
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
    <Card className="p-2 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#E0F7FA" }}>
        <h5 className="mb-0">🔄 Reverse KOTs and Bills</h5>
      </Card.Header>
      <Card.Body style={{ overflowY: 'auto', maxHeight: '70vh' }}>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              {["Bill No", "Bill Date", "KOT No", "Rev KOT", "Gross Amount (₹)", "Discount (₹)", "Amount (₹)", "CGST (₹)", "SGST (₹)", "Cess (₹)", "Service Charge (₹)", "Total Amount (₹)", "Payment Mode", "Customer Name", "Address", "Mobile", "Order Type", "ID", "Reason", "Timestamp"].map((h, i) => (
                <th key={i} style={{ position: 'sticky', top: 0, backgroundColor: '#FFF3E0', zIndex: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {reverseKOTsBills.map((r, i) => (
              <tr key={i}>
                <td>{r.billNo}</td>
                <td>{r.billDate}</td>
                <td>{r.kotNo}</td>
                <td>{r.revKot ? "Yes" : "No"}</td>
                <td>{r.grossAmount.toFixed(2)}</td>
                <td>{r.discount.toFixed(2)}</td>
                <td>{r.amount.toFixed(2)}</td>
                <td>{r.cgst.toFixed(2)}</td>
                <td>{r.sgst.toFixed(2)}</td>
                <td>{r.cess.toFixed(2)}</td>
                <td>{r.serviceCharge.toFixed(2)}</td>
                <td>{r.totalAmount.toFixed(2)}</td>
                <td>{r.paymentMode}</td>
                <td>{r.customerName}</td>
                <td>{r.address}</td>
                <td>{r.mobile}</td>
                <td>{r.orderType}</td>
                <td>{r.id}</td>
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
    <Card className="p-2 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#E8F5E9" }}>
        <h5 className="mb-0">🍳 Kitchen Wise Sales Summary</h5>
      </Card.Header>
      <Card.Body style={{ overflowY: 'auto', maxHeight: '70vh' }}>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              {["Bill No", "Bill Date", "KOT No", "Rev KOT", "Gross Amount (₹)", "Discount (₹)", "Amount (₹)", "CGST (₹)", "SGST (₹)", "Cess (₹)", "Service Charge (₹)", "Total Amount (₹)", "Payment Mode", "Customer Name", "Address", "Mobile", "Order Type", "Kitchen", "Sales (₹)"].map((h, i) => (
                <th key={i} style={{ position: 'sticky', top: 0, backgroundColor: '#FFF3E0', zIndex: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kitchenWiseSales.map((k, i) => (
              <tr key={i}>
                <td>{k.billNo}</td>
                <td>{k.billDate}</td>
                <td>{k.kotNo}</td>
                <td>{k.revKot ? "Yes" : "No"}</td>
                <td>{k.grossAmount.toFixed(2)}</td>
                <td>{k.discount.toFixed(2)}</td>
                <td>{k.amount.toFixed(2)}</td>
                <td>{k.cgst.toFixed(2)}</td>
                <td>{k.sgst.toFixed(2)}</td>
                <td>{k.cess.toFixed(2)}</td>
                <td>{k.serviceCharge.toFixed(2)}</td>
                <td>{k.totalAmount.toFixed(2)}</td>
                <td>{k.paymentMode}</td>
                <td>{k.customerName}</td>
                <td>{k.address}</td>
                <td>{k.mobile}</td>
                <td>{k.orderType}</td>
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
    <Card className="p-2 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#FCE4EC" }}>
        <h5 className="mb-0">📋 NC KOT Details</h5>
      </Card.Header>
      <Card.Body style={{ overflowY: 'auto', maxHeight: '70vh' }}>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              {["Bill No", "Bill Date", "KOT No", "Rev KOT", "Gross Amount (₹)", "Discount (₹)", "Amount (₹)", "CGST (₹)", "SGST (₹)", "Cess (₹)", "Service Charge (₹)", "Total Amount (₹)", "Payment Mode", "Customer Name", "Address", "Mobile", "Order Type", "ID", "Status", "Items"].map((h, i) => (
                <th key={i} style={{ position: 'sticky', top: 0, backgroundColor: '#FFF3E0', zIndex: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ncKOTDetails.map((n, i) => (
              <tr key={i}>
                <td>{n.billNo}</td>
                <td>{n.billDate}</td>
                <td>{n.kotNo}</td>
                <td>{n.revKot ? "Yes" : "No"}</td>
                <td>{n.grossAmount.toFixed(2)}</td>
                <td>{n.discount.toFixed(2)}</td>
                <td>{n.amount.toFixed(2)}</td>
                <td>{n.cgst.toFixed(2)}</td>
                <td>{n.sgst.toFixed(2)}</td>
                <td>{n.cess.toFixed(2)}</td>
                <td>{n.serviceCharge.toFixed(2)}</td>
                <td>{n.totalAmount.toFixed(2)}</td>
                <td>{n.paymentMode}</td>
                <td>{n.customerName}</td>
                <td>{n.address}</td>
                <td>{n.mobile}</td>
                <td>{n.orderType}</td>
                <td>{n.id}</td>
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
    <Card className="p-2 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#E3F2FD" }}>
        <h5 className="mb-0">💰 APC / APP Report</h5>
      </Card.Header>
      <Card.Body style={{ overflowY: 'auto', maxHeight: '70vh' }}>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              {["Bill No", "Bill Date", "KOT No", "Rev KOT", "Gross Amount (₹)", "Discount (₹)", "Amount (₹)", "CGST (₹)", "SGST (₹)", "Cess (₹)", "Service Charge (₹)", "Total Amount (₹)", "Payment Mode", "Customer Name", "Address", "Mobile", "Order Type", "Type", "Amount (₹)", "Details"].map((h, i) => (
                <th key={i} style={{ position: 'sticky', top: 0, backgroundColor: '#FFF3E0', zIndex: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {apcAppSummary.map((a, i) => (
              <tr key={i}>
                <td>{a.billNo}</td>
                <td>{a.billDate}</td>
                <td>{a.kotNo}</td>
                <td>{a.revKot ? "Yes" : "No"}</td>
                <td>{a.grossAmount.toFixed(2)}</td>
                <td>{a.discount.toFixed(2)}</td>
                <td>{a.amount.toFixed(2)}</td>
                <td>{a.cgst.toFixed(2)}</td>
                <td>{a.sgst.toFixed(2)}</td>
                <td>{a.cess.toFixed(2)}</td>
                <td>{a.serviceCharge.toFixed(2)}</td>
                <td>{a.totalAmount.toFixed(2)}</td>
                <td>{a.paymentMode}</td>
                <td>{a.customerName}</td>
                <td>{a.address}</td>
                <td>{a.mobile}</td>
                <td>{a.orderType}</td>
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
    <Card className="p-2 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#E8F5E9" }}>
        <h5 className="mb-0">⭐ Special Items</h5>
      </Card.Header>
      <Card.Body style={{ overflowY: 'auto', maxHeight: '70vh' }}>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              {["Bill No", "Bill Date", "KOT No", "Rev KOT", "Gross Amount (₹)", "Discount (₹)", "Amount (₹)", "CGST (₹)", "SGST (₹)", "Cess (₹)", "Service Charge (₹)", "Total Amount (₹)", "Payment Mode", "Customer Name", "Address", "Mobile", "Order Type", "Name", "Qty", "Sales (₹)"].map((h, i) => (
                <th key={i} style={{ position: 'sticky', top: 0, backgroundColor: '#FFF3E0', zIndex: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {specialItemsSummary.map((s, i) => (
              <tr key={i}>
                <td>{s.billNo}</td>
                <td>{s.billDate}</td>
                <td>{s.kotNo}</td>
                <td>{s.revKot ? "Yes" : "No"}</td>
                <td>{s.grossAmount.toFixed(2)}</td>
                <td>{s.discount.toFixed(2)}</td>
                <td>{s.amount.toFixed(2)}</td>
                <td>{s.cgst.toFixed(2)}</td>
                <td>{s.sgst.toFixed(2)}</td>
                <td>{s.cess.toFixed(2)}</td>
                <td>{s.serviceCharge.toFixed(2)}</td>
                <td>{s.totalAmount.toFixed(2)}</td>
                <td>{s.paymentMode}</td>
                <td>{s.customerName}</td>
                <td>{s.address}</td>
                <td>{s.mobile}</td>
                <td>{s.orderType}</td>
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
    <Card className="p-2 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#FFF3E0" }}>
        <h5 className="mb-0">💸 Cash Paid/Received Between Departments</h5>
      </Card.Header>
      <Card.Body style={{ overflowY: 'auto', maxHeight: '70vh' }}>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#E8F5E9" }}>
            <tr>
              {["Bill No", "Bill Date", "KOT No", "Rev KOT", "Gross Amount (₹)", "Discount (₹)", "Amount (₹)", "CGST (₹)", "SGST (₹)", "Cess (₹)", "Service Charge (₹)", "Total Amount (₹)", "Payment Mode", "Customer Name", "Address", "Mobile", "Order Type", "From", "To", "Amount (₹)", "Type"].map((h, i) => (
                <th key={i} style={{ position: 'sticky', top: 0, backgroundColor: '#E8F5E9', zIndex: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {interDeptCash.map((i, j) => (
              <tr key={j}>
                <td>{i.billNo}</td>
                <td>{i.billDate}</td>
                <td>{i.kotNo}</td>
                <td>{i.revKot ? "Yes" : "No"}</td>
                <td>{i.grossAmount.toFixed(2)}</td>
                <td>{i.discount.toFixed(2)}</td>
                <td>{i.amount.toFixed(2)}</td>
                <td>{i.cgst.toFixed(2)}</td>
                <td>{i.sgst.toFixed(2)}</td>
                <td>{i.cess.toFixed(2)}</td>
                <td>{i.serviceCharge.toFixed(2)}</td>
                <td>{i.totalAmount.toFixed(2)}</td>
                <td>{i.paymentMode}</td>
                <td>{i.customerName}</td>
                <td>{i.address}</td>
                <td>{i.mobile}</td>
                <td>{i.orderType}</td>
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
    <Card className="p-2 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#E0F7FA" }}>
        <h5 className="mb-0">👥 Daily Sales User Shift</h5>
      </Card.Header>
      <Card.Body style={{ overflowY: 'auto', maxHeight: '70vh' }}>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              {["Bill No", "Bill Date", "KOT No", "Rev KOT", "Gross Amount (₹)", "Discount (₹)", "Amount (₹)", "CGST (₹)", "SGST (₹)", "Cess (₹)", "Service Charge (₹)", "Total Amount (₹)", "Payment Mode", "Customer Name", "Address", "Mobile", "Order Type", "User", "Shift", "Sales (₹)"].map((h, i) => (
                <th key={i} style={{ position: 'sticky', top: 0, backgroundColor: '#FFF3E0', zIndex: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dailySalesUserShift.map((d, i) => (
              <tr key={i}>
                <td>{d.billNo}</td>
                <td>{d.billDate}</td>
                <td>{d.kotNo}</td>
                <td>{d.revKot ? "Yes" : "No"}</td>
                <td>{d.grossAmount.toFixed(2)}</td>
                <td>{d.discount.toFixed(2)}</td>
                <td>{d.amount.toFixed(2)}</td>
                <td>{d.cgst.toFixed(2)}</td>
                <td>{d.sgst.toFixed(2)}</td>
                <td>{d.cess.toFixed(2)}</td>
                <td>{d.serviceCharge.toFixed(2)}</td>
                <td>{d.totalAmount.toFixed(2)}</td>
                <td>{d.paymentMode}</td>
                <td>{d.customerName}</td>
                <td>{d.address}</td>
                <td>{d.mobile}</td>
                <td>{d.orderType}</td>
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
    <Card className="p-2 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#E8F5E9" }}>
        <h5 className="mb-0">📅 Monthly Sales</h5>
      </Card.Header>
      <Card.Body style={{ overflowY: 'auto', maxHeight: '70vh' }}>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              {["Bill No", "Bill Date", "KOT No", "Rev KOT", "Gross Amount (₹)", "Discount (₹)", "Amount (₹)", "CGST (₹)", "SGST (₹)", "Cess (₹)", "Service Charge (₹)", "Total Amount (₹)", "Payment Mode", "Customer Name", "Address", "Mobile", "Order Type", "Month", "Sales (₹)"].map((h, i) => (
                <th key={i} style={{ position: 'sticky', top: 0, backgroundColor: '#FFF3E0', zIndex: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {monthlySalesSummary.map((m, i) => (
              <tr key={i}>
                <td>{m.billNo}</td>
                <td>{m.billDate}</td>
                <td>{m.kotNo}</td>
                <td>{m.revKot ? "Yes" : "No"}</td>
                <td>{m.grossAmount.toFixed(2)}</td>
                <td>{m.discount.toFixed(2)}</td>
                <td>{m.amount.toFixed(2)}</td>
                <td>{m.cgst.toFixed(2)}</td>
                <td>{m.sgst.toFixed(2)}</td>
                <td>{m.cess.toFixed(2)}</td>
                <td>{m.serviceCharge.toFixed(2)}</td>
                <td>{m.totalAmount.toFixed(2)}</td>
                <td>{m.paymentMode}</td>
                <td>{m.customerName}</td>
                <td>{m.address}</td>
                <td>{m.mobile}</td>
                <td>{m.orderType}</td>
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
    <Card className="p-2 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#E3F2FD" }}>
        <h5 className="mb-0">💳 Payment Mode Sales</h5>
      </Card.Header>
      <Card.Body style={{ overflowY: 'auto', maxHeight: '70vh' }}>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              {["Bill No", "Bill Date", "KOT No", "Rev KOT", "Gross Amount (₹)", "Discount (₹)", "Amount (₹)", "CGST (₹)", "SGST (₹)", "Cess (₹)", "Service Charge (₹)", "Total Amount (₹)", "Payment Mode", "Customer Name", "Address", "Mobile", "Order Type", "Mode", "Sales (₹)"].map((h, i) => (
                <th key={i} style={{ position: 'sticky', top: 0, backgroundColor: '#FFF3E0', zIndex: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paymentModeSalesSummary.map((p, i) => (
              <tr key={i}>
                <td>{p.billNo}</td>
                <td>{p.billDate}</td>
                <td>{p.kotNo}</td>
                <td>{p.revKot ? "Yes" : "No"}</td>
                <td>{p.grossAmount.toFixed(2)}</td>
                <td>{p.discount.toFixed(2)}</td>
                <td>{p.amount.toFixed(2)}</td>
                <td>{p.cgst.toFixed(2)}</td>
                <td>{p.sgst.toFixed(2)}</td>
                <td>{p.cess.toFixed(2)}</td>
                <td>{p.serviceCharge.toFixed(2)}</td>
                <td>{p.totalAmount.toFixed(2)}</td>
                <td>{p.paymentMode}</td>
                <td>{p.customerName}</td>
                <td>{p.address}</td>
                <td>{p.mobile}</td>
                <td>{p.orderType}</td>
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
    <Card className="p-2 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#FCE4EC" }}>
        <h5 className="mb-0">🍳 Kitchen Allocation</h5>
      </Card.Header>
      <Card.Body style={{ overflowY: 'auto', maxHeight: '70vh' }}>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              {["Bill No", "Bill Date", "KOT No", "Rev KOT", "Gross Amount (₹)", "Discount (₹)", "Amount (₹)", "CGST (₹)", "SGST (₹)", "Cess (₹)", "Service Charge (₹)", "Total Amount (₹)", "Payment Mode", "Customer Name", "Address", "Mobile", "Order Type", "Kitchen", "Allocation"].map((h, i) => (
                <th key={i} style={{ position: 'sticky', top: 0, backgroundColor: '#FFF3E0', zIndex: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kitchenAllocation.map((k, i) => (
              <tr key={i}>
                <td>{k.billNo}</td>
                <td>{k.billDate}</td>
                <td>{k.kotNo}</td>
                <td>{k.revKot ? "Yes" : "No"}</td>
                <td>{k.grossAmount.toFixed(2)}</td>
                <td>{k.discount.toFixed(2)}</td>
                <td>{k.amount.toFixed(2)}</td>
                <td>{k.cgst.toFixed(2)}</td>
                <td>{k.sgst.toFixed(2)}</td>
                <td>{k.cess.toFixed(2)}</td>
                <td>{k.serviceCharge.toFixed(2)}</td>
                <td>{k.totalAmount.toFixed(2)}</td>
                <td>{k.paymentMode}</td>
                <td>{k.customerName}</td>
                <td>{k.address}</td>
                <td>{k.mobile}</td>
                <td>{k.orderType}</td>
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
    <Card className="p-2 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#E8F5E9" }}>
        <h5 className="mb-0">📅 Day End Report</h5>
      </Card.Header>
      <Card.Body style={{ overflowY: 'auto', maxHeight: '70vh' }}>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              {["Bill No", "Bill Date", "KOT No", "Rev KOT", "Gross Amount (₹)", "Discount (₹)", "Amount (₹)", "CGST (₹)", "SGST (₹)", "Cess (₹)", "Service Charge (₹)", "Total Amount (₹)", "Payment Mode", "Customer Name", "Address", "Mobile", "Order Type", "Metric", "Value (₹)"].map((h, i) => (
                <th key={i} style={{ position: 'sticky', top: 0, backgroundColor: '#FFF3E0', zIndex: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{dayEndReport.billNo}</td>
              <td>{dayEndReport.billDate}</td>
              <td>{dayEndReport.kotNo}</td>
              <td>{dayEndReport.revKot ? "Yes" : "No"}</td>
              <td>{dayEndReport.grossAmount.toFixed(2)}</td>
              <td>{dayEndReport.discount.toFixed(2)}</td>
              <td>{dayEndReport.amount.toFixed(2)}</td>
              <td>{dayEndReport.cgst.toFixed(2)}</td>
              <td>{dayEndReport.sgst.toFixed(2)}</td>
              <td>{dayEndReport.cess.toFixed(2)}</td>
              <td>{dayEndReport.serviceCharge.toFixed(2)}</td>
              <td>{dayEndReport.totalAmount.toFixed(2)}</td>
              <td>{dayEndReport.paymentMode}</td>
              <td>{dayEndReport.customerName}</td>
              <td>{dayEndReport.address}</td>
              <td>{dayEndReport.mobile}</td>
              <td>{dayEndReport.orderType}</td>
              <td>Total Sales</td>
              <td>{dayEndReport.totalSales.toFixed(2)}</td>
            </tr>
            <tr>
              <td>{dayEndReport.billNo}</td>
              <td>{dayEndReport.billDate}</td>
              <td>{dayEndReport.kotNo}</td>
              <td>{dayEndReport.revKot ? "Yes" : "No"}</td>
              <td>{dayEndReport.grossAmount.toFixed(2)}</td>
              <td>{dayEndReport.discount.toFixed(2)}</td>
              <td>{dayEndReport.amount.toFixed(2)}</td>
              <td>{dayEndReport.cgst.toFixed(2)}</td>
              <td>{dayEndReport.sgst.toFixed(2)}</td>
              <td>{dayEndReport.cess.toFixed(2)}</td>
              <td>{dayEndReport.serviceCharge.toFixed(2)}</td>
              <td>{dayEndReport.totalAmount.toFixed(2)}</td>
              <td>{dayEndReport.paymentMode}</td>
              <td>{dayEndReport.customerName}</td>
              <td>{dayEndReport.address}</td>
              <td>{dayEndReport.mobile}</td>
              <td>{dayEndReport.orderType}</td>
              <td>Cash In Hand</td>
              <td>{dayEndReport.cashInHand.toFixed(2)}</td>
            </tr>
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );

  const renderHandoverSection = () => (
    <Card className="p-2 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#E0F7FA" }}>
        <h5 className="mb-0">🔄 Handover Report</h5>
      </Card.Header>
      <Card.Body style={{ overflowY: 'auto', maxHeight: '70vh' }}>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              {["Bill No", "Bill Date", "KOT No", "Rev KOT", "Gross Amount (₹)", "Discount (₹)", "Amount (₹)", "CGST (₹)", "SGST (₹)", "Cess (₹)", "Service Charge (₹)", "Total Amount (₹)", "Payment Mode", "Customer Name", "Address", "Mobile", "Order Type", "Handover Time", "Notes"].map((h, i) => (
                <th key={i} style={{ position: 'sticky', top: 0, backgroundColor: '#FFF3E0', zIndex: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{handoverReport.billNo}</td>
              <td>{handoverReport.billDate}</td>
              <td>{handoverReport.kotNo}</td>
              <td>{handoverReport.revKot ? "Yes" : "No"}</td>
              <td>{handoverReport.grossAmount.toFixed(2)}</td>
              <td>{handoverReport.discount.toFixed(2)}</td>
              <td>{handoverReport.amount.toFixed(2)}</td>
              <td>{handoverReport.cgst.toFixed(2)}</td>
              <td>{handoverReport.sgst.toFixed(2)}</td>
              <td>{handoverReport.cess.toFixed(2)}</td>
              <td>{handoverReport.serviceCharge.toFixed(2)}</td>
              <td>{handoverReport.totalAmount.toFixed(2)}</td>
              <td>{handoverReport.paymentMode}</td>
              <td>{handoverReport.customerName}</td>
              <td>{handoverReport.address}</td>
              <td>{handoverReport.mobile}</td>
              <td>{handoverReport.orderType}</td>
              <td>{new Date(handoverReport.handoverTime).toLocaleString()}</td>
              <td>{handoverReport.notes}</td>
            </tr>
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );

  const renderBillReprintedSection = () => (
    <Card className="p-2 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#FFF3E0" }}>
        <h5 className="mb-0">🖨️ Bill Reprinted</h5>
      </Card.Header>
      <Card.Body style={{ overflowY: 'auto', maxHeight: '70vh' }}>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#E8F5E9" }}>
            <tr>
              {["Bill No", "Bill Date", "KOT No", "Rev KOT", "Gross Amount (₹)", "Discount (₹)", "Amount (₹)", "CGST (₹)", "SGST (₹)", "Cess (₹)", "Service Charge (₹)", "Total Amount (₹)", "Payment Mode", "Customer Name", "Address", "Mobile", "Order Type", "Reprints", "Reason"].map((h, i) => (
                <th key={i} style={{ position: 'sticky', top: 0, backgroundColor: '#E8F5E9', zIndex: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {billReprinted.map((b, i) => (
              <tr key={i}>
                <td>{b.billNo}</td>
                <td>{b.billDate}</td>
                <td>{b.kotNo}</td>
                <td>{b.revKot ? "Yes" : "No"}</td>
                <td>{b.grossAmount.toFixed(2)}</td>
                <td>{b.discount.toFixed(2)}</td>
                <td>{b.amount.toFixed(2)}</td>
                <td>{b.cgst.toFixed(2)}</td>
                <td>{b.sgst.toFixed(2)}</td>
                <td>{b.cess.toFixed(2)}</td>
                <td>{b.serviceCharge.toFixed(2)}</td>
                <td>{b.totalAmount.toFixed(2)}</td>
                <td>{b.paymentMode}</td>
                <td>{b.customerName}</td>
                <td>{b.address}</td>
                <td>{b.mobile}</td>
                <td>{b.orderType}</td>
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
    <Card className="p-2 shadow-sm border-0">
      <Card.Header style={{ backgroundColor: "#E3F2FD" }}>
        <h5 className="mb-0">📋 KOT Used Summary</h5>
      </Card.Header>
      <Card.Body style={{ overflowY: 'auto', maxHeight: '70vh' }}>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              {["Bill No", "Bill Date", "KOT No", "Rev KOT", "Gross Amount (₹)", "Discount (₹)", "Amount (₹)", "CGST (₹)", "SGST (₹)", "Cess (₹)", "Service Charge (₹)", "Total Amount (₹)", "Payment Mode", "Customer Name", "Address", "Mobile", "Order Type", "Used In", "Items"].map((h, i) => (
                <th key={i} style={{ position: 'sticky', top: 0, backgroundColor: '#FFF3E0', zIndex: 1 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kotUsedSummary.map((k, i) => (
              <tr key={i}>
                <td>{k.billNo || k.usedIn}</td>
                <td>{k.billDate}</td>
                <td>{k.kotNo}</td>
                <td>{k.revKot ? "Yes" : "No"}</td>
                <td>{k.grossAmount.toFixed(2)}</td>
                <td>{k.discount.toFixed(2)}</td>
                <td>{k.amount.toFixed(2)}</td>
                <td>{k.cgst.toFixed(2)}</td>
                <td>{k.sgst.toFixed(2)}</td>
                <td>{k.cess.toFixed(2)}</td>
                <td>{k.serviceCharge.toFixed(2)}</td>
                <td>{k.totalAmount.toFixed(2)}</td>
                <td>{k.paymentMode}</td>
                <td>{k.customerName}</td>
                <td>{k.address}</td>
                <td>{k.mobile}</td>
                <td>{k.orderType}</td>
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
        <div className="apps-container-inner p-2">
          <h4 className="text-center mb-2 fw-bold text-secondary">
            📊 Restaurant Reporting System
          </h4>

          {/* Optimized Single Row for Filters and Actions */}
          <Row className="mb-2 g-2 align-items-center flex-wrap">
            <Col md={3} xs={12}>
              <Form.Select 
                value={reportCategory} 
                onChange={(e) => setReportCategory(e.target.value)}
                className="form-select-sm"
                size="sm"
              >
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

            <Col md={2} xs={6}>
              <Form.Control
                type="date"
                placeholder="From Date"
                value={customRange.start}
                onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                className="form-control-sm"
                size="sm"
              />
            </Col>

            <Col md={2} xs={6}>
              <Form.Control
                type="date"
                placeholder="To Date"
                value={customRange.end}
                onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                className="form-control-sm"
                size="sm"
              />
            </Col>

            <Col md={2} xs={12} className="d-flex gap-1">
              <Button variant="outline-primary" onClick={handleCustomFilter} size="sm">
                Apply
              </Button>
              <Button variant="outline-secondary" onClick={handleResetFilters} size="sm">
                Reset
              </Button>
            </Col>

            <Col md="auto" className="ms-auto d-flex gap-2">
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