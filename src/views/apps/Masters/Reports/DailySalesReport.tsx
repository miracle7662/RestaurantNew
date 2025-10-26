import { useState, useEffect} from "react";
import { Card, Table, Form, Button, Row, Col, Dropdown } from "react-bootstrap";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Alert } from 'react-bootstrap';
import { useAuthContext } from "@/common";
import { fetchOutletsForDropdown } from "@/utils/commonfunction";
import { OutletData } from "@/common/api/outlet";

interface Bill {
  [key: string]: any; // Index signature for dynamic property access in export functions
  orderNo: string;
  billNo: string;
  billDate: string;
  kotNo: string;
  revKotNo?: string;
  revKot: boolean; // This can be derived from reverseBill
  grossAmount: number;
  discount: number;
  amount: number;
  cgst: number;
  sgst: number;
  cess: number;
  roundOff?: number;
  revAmt?: number;
  serviceCharge: number;
  totalAmount: number;
  paymentMode: string;
  customerName: string;
  address: string;
  mobile: string;
  orderType: string;
  waiter?: string;
  captain?: string;
  user?: string;
  itemsCount: number;
  tax: number;
  reverseBill?: number | string;
  date: string;
  ncKot?: string;
  ncName?: string;
  cash?: number;
  credit?: number;
  card?: number;
  gpay?: number;
  phonepe?: number;
  qrcode?: number;
 
  outlet?: string;
  outletid?: number;
  outlet_name?: string;
  table_name?: string;
  department_name?: string;
}

const defaultBill: Bill = {
  billNo: "N/A",
  orderNo: "N/A",
  billDate: "",
  kotNo: "N/A",
  revKot: false,
  grossAmount: 0,
  discount: 0,
  amount: 0,
  cgst: 0,
  sgst: 0,
  cess: 0,
  serviceCharge: 0,
  totalAmount: 0,
  paymentMode: "N/A",
  customerName: "N/A",
  address: "N/A",
  mobile: "N/A",
  orderType: "N/A",
  itemsCount: 0,
  tax: 0,
  date: "",
};

interface PaymentMode {
  id: number;
  mode_name: string;
}

const ReportPage = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
  const [reportType, setReportType] = useState("monthly");
  const [reportCategory, setReportCategory] = useState("billSummary");
  const [customRange, setCustomRange] = useState({ start: "", end: "" });
  const [kitchenAllocationType, setKitchenAllocationType] = useState("allocation");
  const [filters, setFilters] = useState({
    orderType: "",
    paymentMode: "",
    outlet: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);
  const [outlets, setOutlets] = useState<OutletData[]>([]);
  const [dynamicPaymentModes, setDynamicPaymentModes] = useState<PaymentMode[]>([]);
  const { user } = useAuthContext();

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      await fetchOutletsForDropdown(user, setOutlets, setLoading);
      await loadBills();
      setLoading(false);
    };
    if (user) fetchInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    // Filtering is handled client-side, no need to reload data
  }, [customRange.start, customRange.end]);

  useEffect(() => {
    filterBills(bills);
    // Only filter when customRange is valid
    if (customRange.start && customRange.end && new Date(customRange.start) <= new Date(customRange.end)) {
      filterBills(bills);
    } else if (reportType !== 'custom') {
      filterBills(bills);
    }
  }, [reportType, reportCategory, filters, customRange.start, customRange.end, bills]);

  useEffect(() => {
    const fetchPaymentModes = async () => {
      try {
        // The controller is updated to handle an empty outletid, returning all unique modes
        const response = await fetch(`http://localhost:3001/api/payment-modes/by-outlet?outletid=${filters.outlet || ''}`);
        if (response.ok) {
          const data = await response.json();
          setDynamicPaymentModes(data);
        } else {
          console.error("Failed to fetch payment modes");
          setDynamicPaymentModes([]);
        }
      } catch (error) {
        console.error("Error fetching payment modes:", error);
      }
    };
    fetchPaymentModes();
  }, [filters.outlet]);

  const loadBills = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/reports', );
      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }
      const data = await response.json();
      if (data.success) {
        console.log("Fetched bills data:", data.data.orders);
        const orders: any[] = data.data.orders || [];
        const allBills: Bill[] = orders.map((order: any) => ({
          orderNo: order.orderNo,
          billNo: order.orderNo,
          billDate: order.date ? new Date(order.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          kotNo: order.kotNo || "N/A",
          revKotNo: order.revKotNo,
          revKot: order.reverseBill == 1,
          grossAmount: order.grossAmount || order.amount || 0,
          discount: order.discount || 0,
          amount: order.amount || 0,
          cgst: order.cgst || 0,
          sgst: order.sgst || 0,
          roundOff: order.roundOff || 0,
          revAmt: order.revAmt || 0,
          cess: 0,
          serviceCharge: 0,
          totalAmount: order.amount || 0,
          paymentMode: order.paymentMode || "Cash",
          customerName: order.customerName || "N/A", // Assuming customerName might exist
          waiter: order.waiter,
          captain: order.captain,
          user: order.user,
          address: "N/A",
          mobile: "N/A",
          orderType: order.type || "Dine-in",
          itemsCount: order.items,
          tax: (order.cgst || 0) + (order.sgst || 0),
          reverseBill: order.reverseBill,
          date: order.date,
          ncKot: order.ncKot,
          ncName: order.ncName,
          cash: order.cash,
          credit: order.credit,
          card: order.card,
          gpay: order.gpay,
          phonepe: order.phonepe,
          qrcode: order.qrcode,
          outlet_name: order.outlet_name,
          outletid: order.outletid,
          table_name: order.table_name,
          department_name: order.department_name,
        }));
        setBills(allBills);
        filterBills(allBills);
      } else {
        throw new Error(data.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    const updatedRange = { ...customRange, [field]: value };
    setCustomRange(updatedRange);

    if (updatedRange.start && updatedRange.end) {
      const startDate = new Date(updatedRange.start);
      const endDate = new Date(updatedRange.end);

      if (startDate > endDate) {
        setDateError("❌ 'From Date' cannot be greater than 'To Date'");
      } else {
        setDateError(null);
      }
    } else if (dateError) { // Clear error if one of the dates is cleared
      setDateError(null);
    }
  };

  const filterBills = (data: Bill[]) => {
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
      filtered = filtered.filter(bill => bill.paymentMode?.includes(filters.paymentMode));
    }
    if (filters.outlet) {
      filtered = filtered.filter(bill => bill.outletid == Number(filters.outlet));
    }

    setFilteredBills(filtered);
  };

  // Calculate payment summary
  const calculatePaymentSummary = (bills: Bill[]) => {
    const summary: { [key: string]: number } = {};
    bills.forEach(bill => {
      const mode = bill.paymentMode || "Cash";
      summary[mode] = (summary[mode] || 0) + (bill.totalAmount || 0);
    });
    return Object.entries(summary).map(([mode, total]) => ({ ...defaultBill, ...(bills[0] || {}), mode, total: total as number }));
  };

  // Calculations using fetched data
  const calculateBillSummary = (bills: Bill[]) => {
    return bills.map(bill => ({
      ...bill,
      creditDetails: { cardNumber: "N/A", bank: "N/A", amount: bill.card || 0 }
    }));
  };

  const calculateCreditSummary = (bills: Bill[]) => {
    const credits = bills.filter(b => b.paymentMode?.toLowerCase().includes('credit')).reduce((acc, b) => acc + (b.totalAmount || 0), 0);
    return [{ ...defaultBill, ...(bills[0] || {}), type: "Total Credit", amount: credits }];
  };

  const calculateDiscountSummary = (bills: Bill[]) => {
    const totalDiscount = bills.reduce((s, b) => s + (b.discount || 0), 0);
    const avgDiscount = bills.length > 0 ? totalDiscount / bills.length : 0;
    return [{ ...defaultBill, ...(bills[0] || {}), type: "Total Discount", amount: totalDiscount, discount: totalDiscount }, { ...defaultBill, ...(bills[0] || {}), type: "Avg Discount", amount: avgDiscount, discount: avgDiscount }];
  };

  const calculateReverseKOTsBills = () => {
    const reversed = filteredBills.filter(b => b.revKot).map((b) => ({ ...b, id: Math.floor(Math.random() * 1000), reason: "Reversal", timestamp: b.date }));
    return reversed;
  };

  const calculateKitchenWiseSales = () => {
    // Aggregate by captain as kitchen proxy
    const grouped = filteredBills.reduce<{ [key: string]: { kitchen: string; sales: number } & Bill }>((acc, b) => {
      const kitchen = b.captain || "Unknown";
      if (!acc[kitchen]) acc[kitchen] = { kitchen, sales: 0, ...b };
      acc[kitchen].sales += b.amount || 0;
      return acc;
    }, {});
    return Object.values(grouped) as (({ kitchen: string; sales: number } & Bill)[] & { [key: string]: any });
  };

  const calculateNCKOTDetails = () => {
    const ncKots = filteredBills.filter(b => b.ncKot).map((b) => ({ ...b, id: Math.floor(Math.random() * 1000), status: "NC", items: [b.kotNo || "N/A"] }));
    return ncKots;
  };

  const calculateAPCAPPSummary = () => {
    // Use cash/credit as proxy
    const apc = filteredBills.filter(b => (b.cash ?? 0) > 0).map((b) => ({ ...b, type: "APC", amount: b.cash ?? 0, details: "Cash Payment", id: Math.floor(Math.random() * 1000) }));
    return apc;
  };

  const calculateSpecialItemsSummary = () => {
    // High value bills as special
    const special = filteredBills.filter(b => b.amount > (Math.max(...filteredBills.map(f => f.amount || 0)) * 0.5 || 0)).map((b) => ({ ...b, name: "Special Order", qty: b.items || 1, sales: b.amount, id: Math.floor(Math.random() * 1000) }));
    return special;
  };

  const calculateInterDeptCash = () => {
    // Use credit as inter-dept proxy
    const inter = filteredBills.filter(b => (b.credit ?? 0) > 0).map((b) => ({ ...b, from: "Front Desk", to: "Accounts", amount: b.credit, type: "Paid", id: Math.floor(Math.random() * 1000) }));
    return inter;
  };

  const calculateDailySalesUserShift = () => {
    const grouped = filteredBills.reduce<{ [key: string]: { user?: string; shift?: string; sales: number } & Bill }>((acc, b) => {
      const userShift = `${b.user || 'Unknown'}-${b.captain || 'Morning'}`;
      if (!acc[userShift]) acc[userShift] = { ...b, user: b.user, shift: b.captain, sales: 0 };
      acc[userShift].sales += b.amount || 0;
      return acc;
    }, {});
    return Object.values(grouped) as (({ user?: string; shift?: string; sales: number } & Bill)[] & { [key: string]: any });
  };

  const calculateMonthlySalesSummary = () => {
    const monthly = filteredBills.reduce<{ [key: string]: { month: string; sales: number } & Bill }>((acc, b) => {
      const month = new Date(b.billDate).toLocaleString('default', { month: 'short' });
      if (!acc[month]) acc[month] = { ...b, month, sales: 0 };
      acc[month].sales += b.amount || 0;
      return acc;
    }, {});
    return Object.values(monthly) as (({ month: string; sales: number } & Bill)[] & { [key: string]: any });
  };

  const calculatePaymentModeSalesSummary = (bills: Bill[]) => calculatePaymentSummary(bills);

  const calculateKitchenAllocation = () => {
    // Similar to kitchen wise, add allocation percentage
    const totalSales = filteredBills.reduce((sum, b) => sum + (b.amount || 0), 0);
    const grouped = filteredBills.reduce<{ [key: string]: { kitchen: string; allocation: string; sales: number } & Bill }>((acc, b) => {
      const kitchen = b.captain || "Unknown";
      if (!acc[kitchen]) acc[kitchen] = { kitchen, allocation: "0%", sales: 0, ...b };
      acc[kitchen].sales += b.amount || 0;
      return acc;
    }, {});
    Object.values(grouped).forEach(g => {
      g.allocation = totalSales > 0 ? `${((g.sales / totalSales) * 100).toFixed(1)}%` : "0%";
    });
    return Object.values(grouped) as (({ kitchen: string; allocation: string; sales: number } & Bill)[] & { [key: string]: any });
  };

  const calculateDayEndReport = () => ({ 
    totalSales: filteredBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0),
    cashInHand: filteredBills.reduce((sum, b) => sum + (b.cash || 0), 0),
    discrepancies: [],
    ...defaultBill, ...(filteredBills[0] || {})
  });

  const calculateHandoverReport = () => ({ 
    handoverTime: new Date().toISOString(),
    notes: `Handover for ${filteredBills.length} bills`,
    ...defaultBill, ...(filteredBills[0] || {})
  });

  const calculateBillReprinted = () => {
    // Mock reprints not available, return empty or use all as 0
    return filteredBills.map((b) => ({ ...b, reprints: 0, reason: "N/A" }));
  };

  const calculateKotUsedSummary = () => {
    // Use all KOTs
    return filteredBills.map((b) => ({ ...b, usedIn: b.orderNo ?? "N/A", items: b.items || 0 }));
  };

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
      data = billSummaryData.map(b => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = (b as any)[field]);
        row["Card Number"] = b.creditDetails.cardNumber;
        row["Bank"] = b.creditDetails.bank;
        row["Card Amount"] = b.creditDetails.amount;
        return row;
      });

      // Calculate and add total row for Excel
      const totals = billSummaryData.reduce((acc, bill) => {
        acc.grossAmount += bill.grossAmount || 0;
        acc.discount += bill.discount || 0;
        acc.amount += bill.amount || 0;
        acc.cgst += bill.cgst || 0;
        acc.sgst += bill.sgst || 0;
        acc.roundOff += bill.roundOff || 0;
        acc.revAmt += bill.revAmt || 0;
        acc.totalAmount += bill.totalAmount || 0;
        acc.cardAmount += bill.creditDetails?.amount || 0;
        return acc;
      }, { grossAmount: 0, discount: 0, amount: 0, cgst: 0, sgst: 0, roundOff: 0, revAmt: 0, totalAmount: 0, cardAmount: 0 });

      const totalRow: any = {
        'Bill No': 'Total',
        'Bill Date': '',
        'Kot No': '',
        'Rev Kot': '',
        'Gross Amount': totals.grossAmount.toFixed(2),
        'Discount': totals.discount.toFixed(2),
        'Amount': totals.amount.toFixed(2),
        'Cgst': totals.cgst.toFixed(2),
        'Sgst': totals.sgst.toFixed(2),
        'Cess': '',
        'Service Charge': '',
        'Total Amount': totals.totalAmount.toFixed(2),
        'Payment Mode': '',
        'Customer Name': '',
        'Address': '',
        'Mobile': '',
        'Order Type': '',
        'Card Number': '',
        'Bank': '',
        'Card Amount': totals.cardAmount.toFixed(2),
      };
      data.push(totalRow);
    } else if (reportCategory === "creditSummary") {
      data = creditSummary.map((c: { [key: string]: any }) => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = (c as any)[field]);
        row["Type"] = c.type;
        row["Amount"] = c.amount;
        return row;
      });
    } else if (reportCategory === "discountSummary") {
      data = discountSummary.map((d: { [key: string]: any }) => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = (d as any)[field]);
        row["Type"] = d.type;
        row["Amount"] = d.amount;
        return row;
      });
    } else if (reportCategory === "reverseKOTs") {
      data = reverseKOTsBills.map(r => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = (r as any)[field]);
        row["ID"] = r.id;
        row["Reason"] = r.reason;
        row["Timestamp"] = r.timestamp;
        return row;
      });
    } else if (reportCategory === "kitchenWise") {
      data = kitchenWiseSales.map(k => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = (k as any)[field]);
        row["Kitchen"] = k.kitchen;
        row["Sales"] = k.sales;
        return row;
      });
    } else if (reportCategory === "ncKOT") {
      data = ncKOTDetails.map(n => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = (n as any)[field]);
        row["ID"] = n.id;
        row["Status"] = n.status;
        row["Items"] = n.items.join(", ");
        return row;
      });
    } else if (reportCategory === "apcApp") {
      data = apcAppSummary.map(a => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = (a as any)[field]);
        row["Type"] = a.type;
        row["Amount"] = a.amount;
        row["Details"] = a.details;
        return row;
      });
    } else if (reportCategory === "specialItems") {
      data = specialItemsSummary.map(s => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = (s as any)[field]);
        row["Name"] = s.name;
        row["Qty"] = s.qty;
        row["Sales"] = s.sales;
        return row;
      });
    } else if (reportCategory === "interDeptCash") {
      data = interDeptCash.map(i => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = (i as any)[field]);
        row["From"] = i.from;
        row["To"] = i.to;
        row["Amount"] = i.amount;
        row["Type"] = i.type;
        return row;
      });
    } else if (reportCategory === "dailySalesUserShift") {
      data = dailySalesUserShift.map((d: { [key: string]: any }) => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = (d as any)[field]);
        row["User"] = d.user;
        row["Shift"] = d.shift;
        row["Sales"] = d.sales;
        return row;
      });
    } else if (reportCategory === "monthlySales") {
      data = monthlySalesSummary.map((m: { [key: string]: any }) => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = (m as any)[field]);
        row["Month"] = m.month;
        row["Sales"] = m.sales;
        return row;
      });
    } else if (reportCategory === "paymentModeSales") {
      data = paymentModeSalesSummary.map((p: { [key: string]: any }) => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = (p as any)[field]);
        row["Mode"] = p.mode;
        row["Sales"] = p.total;
        return row;
      });
    } else if (reportCategory === "kitchenAllocation") {
      data = kitchenAllocation.map((k: { [key: string]: any }) => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = (k as any)[field]);
        row["Kitchen"] = k.kitchen;
        row["Allocation"] = k.allocation;
        return row;
      });
    } else if (reportCategory === "dayEnd") {
      const row: any = {};
      commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = (dayEndReport as any)[field]);
      row["Total Sales"] = dayEndReport.totalSales;
      row["Cash In Hand"] = dayEndReport.cashInHand;
      data = [row];
    } else if (reportCategory === "handover") {
      const row: any = {};
      commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = (handoverReport as any)[field]);
      row["Handover Time"] = handoverReport.handoverTime;
      row["Notes"] = handoverReport.notes;
      data = [row];
    } else if (reportCategory === "billReprinted") {
      data = billReprinted.map(b => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = (b as any)[field]);
        row["Reprints"] = b.reprints;
        row["Reason"] = b.reason;
        return row;
      });
    } else if (reportCategory === "kotUsedSummary") {
      data = kotUsedSummary.map((k: { [key: string]: any }) => {
        const row: any = {};
        commonFields.forEach(field => row[field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')] = (k as any)[field]);
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
      body = billSummaryData.slice(0, 10).map(b => [
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
      body = creditSummary.map(c => [
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
      body = discountSummary.map(d => [
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
      body = reverseKOTsBills.map(r => [
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
      body = kitchenWiseSales.map(k => [
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
      body = ncKOTDetails.map(n => [
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
      body = apcAppSummary.map(a => [
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
        (a.amount ?? 0).toFixed(2),
        a.details
      ]);
    } else if (reportCategory === "specialItems") {
      head = [...commonHead, "Name", "Qty", "Sales (₹)"];
      body = specialItemsSummary.map(s => [
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
        (s.sales ?? 0).toFixed(2)
      ]);
    } else if (reportCategory === "interDeptCash") {
      head = [...commonHead, "From", "To", "Amount (₹)", "Type"];
      body = interDeptCash.map(i => [
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
        (i.amount ?? 0).toFixed(2),
        i.type
      ]);
    } else if (reportCategory === "dailySalesUserShift") {
      head = [...commonHead, "User", "Shift", "Sales (₹)"];
      body = dailySalesUserShift.map(d => [
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
        (d.sales ?? 0).toFixed(2)
      ]);
    } else if (reportCategory === "monthlySales") {
      head = [...commonHead, "Month", "Sales (₹)"];
      body = monthlySalesSummary.map(m => [
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
        (m.sales ?? 0).toFixed(2)
      ]);
    } else if (reportCategory === "paymentModeSales") {
      head = [...commonHead, "Mode", "Sales (₹)"];
      body = paymentModeSalesSummary.map(p => [
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
        (p.total ?? 0).toFixed(2)
      ]);
    } else if (reportCategory === "kitchenAllocation") {
      head = [...commonHead, "Kitchen", "Allocation"];
      body = kitchenAllocation.map(k => [
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
        k.allocation ?? "0%"
      ]);
    } else if (reportCategory === "dayEnd") {
      head = [...commonHead, "Metric", "Value (₹)"];
      body = [[
        dayEndReport.billNo, 
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
        dayEndReport.billNo, 
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
        handoverReport.billNo, 
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
      body = billReprinted.map(b => [
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
      body = kotUsedSummary.map(k => [
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

  // Render sections remain the same, as they use calculated data
  const renderBillSummarySection = () => {
    const totals = billSummaryData.reduce((acc, bill) => {
      acc.grossAmount += bill.grossAmount || 0;
      acc.discount += bill.discount || 0;
      acc.amount += bill.amount || 0;
      acc.cgst += bill.cgst || 0;
      acc.sgst += bill.sgst || 0;
      acc.roundOff += bill.roundOff || 0;
      acc.revAmt += bill.revAmt || 0;
      acc.totalAmount += bill.totalAmount || 0;
      acc.cardAmount += bill.creditDetails?.amount || 0;
      return acc;
    }, { grossAmount: 0, discount: 0, amount: 0, cgst: 0, sgst: 0, roundOff: 0, revAmt: 0, totalAmount: 0, cardAmount: 0 });

    return (
      <Card className="p-2 shadow-sm border-0">
        <Card.Header style={{ backgroundColor: "#E3F2FD" }}>
          <h5 className="mb-0">📋 Bill Summary with Credit Card Details</h5>
        </Card.Header>
        <Card.Body style={{ overflowY: 'auto', maxHeight: '70vh' }}>
          <Table bordered hover responsive size="sm">
            <thead style={{ backgroundColor: "#FFF3E0" }}>
              <tr>
                {[
                  "Bill No", "Sale Amt (₹)", "Discount (₹)", "Net Amt (₹)", "CGST (₹)", "SGST (₹)", "Round Off", "Gross Total (₹)",
                  ...dynamicPaymentModes.map(pm => `${pm.mode_name} (₹)`),
                  "Customer Name", "Bill Date", "KOT No", "Rev KOT No", "Rev Amt", "Payment Mode", "Waiter", "Captain", "User", "Order Type", "Card Number", "Bank", "Card Amount (₹)", "Outlet Name", "Table Name", "Department Name"
                ].map((h, i) => (
                  <th key={i} style={{ position: 'sticky', top: 0, backgroundColor: '#FFF3E0', zIndex: 1 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {billSummaryData.length > 0 ? billSummaryData.map((b, i) => (
                <tr key={i}>
                  <td>{b.billNo}</td>                                     {/* BillNo */}
                  <td>{b.totalAmount?.toFixed(2) || 0}</td>              {/* Sale Amt */}
                  <td>{b.discount?.toFixed(2) || 0}</td>                  {/* Dist */}
                  <td>{b.amount?.toFixed(2) || 0}</td>                    {/* Net Amt */}
                  <td>{b.cgst?.toFixed(2) || 0}</td>                      {/* CGST */}
                  <td>{b.sgst?.toFixed(2) || 0}</td>                      {/* SGST */}
                  <td>{b.roundOff?.toFixed(2) || 0}</td>                  {/* R.Off */}
                  <td>{b.grossAmount?.toFixed(2) || 0}</td>              {/* GrossTotal */}
                  {dynamicPaymentModes.map(pm => {
                    const modeKey = pm.mode_name.toLowerCase().replace(/[^a-z0-9]/gi, '');
                    let amount = 0;
                    if (modeKey.includes('cash')) amount = b.cash ?? 0;
                    else if (modeKey.includes('card')) amount = b.card ?? 0;
                    else if (modeKey.includes('credit')) amount = b.credit ?? 0;
                    else if (modeKey.includes('gpay')) amount = b.gpay ?? 0;
                    else if (modeKey.includes('phonepe')) amount = b.phonepe ?? 0;
                    else if (modeKey.includes('qr')) amount = b.qrcode ?? 0;
                    else {
                      // Fallback for other modes like Zomato, Swiggy, etc.
                      // This assumes the backend provides a matching key.
                      amount = (b as any)[modeKey] ?? 0;
                    }
                    return <td key={pm.id}>{(amount).toFixed(2)}</td>;
                  })}
                  <td>{b.customerName}</td>                               {/* Customer Name */}
                  {/* Other fields */}
                  <td>{b.billDate}</td>                                   
                  <td>{b.kotNo}</td>                                      
                  <td>{b.revKotNo}</td>                                   
                  <td>{b.revAmt?.toFixed(2) || 0}</td>                     
                  <td>{b.paymentMode}</td>                                
                  <td>{b.waiter}</td>                                     
                  <td>{b.captain}</td>                                    
                  <td>{b.user}</td>                                       
                  <td>{b.orderType}</td>                                  
                  <td>{b.creditDetails?.cardNumber}</td>                  
                  <td>{b.creditDetails?.bank}</td>                        
                  <td>{b.creditDetails?.amount.toFixed(2)}</td>           
                  <td>{b.outlet_name}</td>
                  <td>{b.table_name}</td>
                  <td>{b.department_name}</td>
                </tr>
              )) : <tr><td colSpan={31} className="text-center">No data available</td></tr>}
            </tbody>
            {billSummaryData.length > 0 && (
              <tfoot className="fw-bold">
                <tr>
                  <td>Total</td>
                  <td>{totals.totalAmount.toFixed(2)}</td>
                  <td>{totals.discount.toFixed(2)}</td>
                  <td>{totals.amount.toFixed(2)}</td>
                  <td>{totals.cgst.toFixed(2)}</td>
                  <td>{totals.sgst.toFixed(2)}</td>
                  <td>{totals.roundOff.toFixed(2)}</td>
                  <td>{totals.grossAmount.toFixed(2)}</td>
                  {/* Dynamic colspan for payment modes */}
                  <td colSpan={dynamicPaymentModes.length + 11}></td>
                </tr>
              </tfoot>
            )}
          </Table>
        </Card.Body>
      </Card>
    );
  };

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
            {creditSummary.length > 0 ? creditSummary.map((c, i) => (
              <tr key={i}>
                <td>{c.billNo}</td>
                <td>{c.billDate}</td>
                <td>{c.kotNo}</td>
                <td>{c.revKot ? "Yes" : "No"}</td>
                <td>{(c.grossAmount ?? 0).toFixed(2)}</td>
                <td>{(c.discount ?? 0).toFixed(2)}</td>
                <td>{(c.amount ?? 0).toFixed(2)}</td>
                <td>{(c.cgst ?? 0).toFixed(2)}</td>
                <td>{(c.sgst ?? 0).toFixed(2)}</td>
                <td>{(c.cess ?? 0).toFixed(2)}</td>
                <td>{(c.serviceCharge ?? 0).toFixed(2)}</td>
                <td>{(c.totalAmount ?? 0).toFixed(2)}</td>
                <td>{c.paymentMode}</td>
                <td>{c.customerName}</td>
                <td>{c.address}</td>
                <td>{c.mobile}</td>
                <td>{c.orderType}</td>
                <td>{c.type}</td>
                <td>{(c.amount ?? 0).toFixed(2)}</td>
              </tr>
            )) : <tr><td colSpan={19} className="text-center">No data available</td></tr>}
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
            {discountSummary.length > 0 ? discountSummary.map((d, i) => (
              <tr key={i}>
                <td>{d.billNo}</td>
                <td>{d.billDate}</td>
                <td>{d.kotNo}</td>
                <td>{d.revKot ? "Yes" : "No"}</td>
                <td>{(d.grossAmount ?? 0).toFixed(2)}</td>
                <td>{(d.discount ?? 0).toFixed(2)}</td>
                <td>{(d.amount ?? 0).toFixed(2)}</td>
                <td>{(d.cgst ?? 0).toFixed(2)}</td>
                <td>{(d.sgst ?? 0).toFixed(2)}</td>
                <td>{(d.cess ?? 0).toFixed(2)}</td>
                <td>{(d.serviceCharge ?? 0).toFixed(2)}</td>
                <td>{(d.totalAmount ?? 0).toFixed(2)}</td>
                <td>{d.paymentMode}</td>
                <td>{d.customerName}</td>
                <td>{d.address}</td>
                <td>{d.mobile}</td>
                <td>{d.orderType}</td>
                <td>{d.type}</td>
                <td>{(d.amount ?? 0).toFixed(2)}</td>
              </tr>
            )) : <tr><td colSpan={19} className="text-center">No data available</td></tr>}
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
            {reverseKOTsBills.length > 0 ? reverseKOTsBills.map((r, i) => (
              <tr key={i}>
                <td>{r.billNo}</td>
                <td>{r.billDate}</td>
                <td>{r.kotNo}</td>
                <td>{r.revKot ? "Yes" : "No"}</td>
                <td>{(r.grossAmount ?? 0).toFixed(2)}</td>
                <td>{(r.discount ?? 0).toFixed(2)}</td>
                <td>{(r.amount ?? 0).toFixed(2)}</td>
                <td>{(r.cgst ?? 0).toFixed(2)}</td>
                <td>{(r.sgst ?? 0).toFixed(2)}</td>
                <td>{(r.cess ?? 0).toFixed(2)}</td>
                <td>{(r.serviceCharge ?? 0).toFixed(2)}</td>
                <td>{(r.totalAmount ?? 0).toFixed(2)}</td>
                <td>{r.paymentMode}</td>
                <td>{r.customerName}</td>
                <td>{r.address}</td>
                <td>{r.mobile}</td>
                <td>{r.orderType}</td>
                <td>{r.id}</td>
                <td>{r.reason}</td>
                <td>{new Date(r.timestamp).toLocaleString()}</td>
              </tr>
            )) : <tr><td colSpan={20} className="text-center">No data available</td></tr>}
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
            {kitchenWiseSales.length > 0 ? kitchenWiseSales.map((k, i) => (
              <tr key={i}>
                <td>{k.billNo}</td>
                <td>{k.billDate}</td>
                <td>{k.kotNo}</td>
                <td>{k.revKot ? "Yes" : "No"}</td>
                <td>{(k.grossAmount ?? 0).toFixed(2)}</td>
                <td>{(k.discount ?? 0).toFixed(2)}</td>
                <td>{(k.amount ?? 0).toFixed(2)}</td>
                <td>{(k.cgst ?? 0).toFixed(2)}</td>
                <td>{(k.sgst ?? 0).toFixed(2)}</td>
                <td>{(k.cess ?? 0).toFixed(2)}</td>
                <td>{(k.serviceCharge ?? 0).toFixed(2)}</td>
                <td>{(k.totalAmount ?? 0).toFixed(2)}</td>
                <td>{k.paymentMode}</td>
                <td>{k.customerName}</td>
                <td>{k.address}</td>
                <td>{k.mobile}</td>
                <td>{k.orderType}</td>
                <td>{k.kitchen}</td>
                <td>{(k.sales ?? 0).toFixed(2)}</td>
              </tr>
            )) : <tr><td colSpan={19} className="text-center">No data available</td></tr>}
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
            {ncKOTDetails.length > 0 ? ncKOTDetails.map((n, i) => (
              <tr key={i}>
                <td>{n.billNo}</td>
                <td>{n.billDate}</td>
                <td>{n.kotNo}</td>
                <td>{n.revKot ? "Yes" : "No"}</td>
                <td>{(n.grossAmount ?? 0).toFixed(2)}</td>
                <td>{(n.discount ?? 0).toFixed(2)}</td>
                <td>{(n.amount ?? 0).toFixed(2)}</td>
                <td>{(n.cgst ?? 0).toFixed(2)}</td>
                <td>{(n.sgst ?? 0).toFixed(2)}</td>
                <td>{(n.cess ?? 0).toFixed(2)}</td>
                <td>{(n.serviceCharge ?? 0).toFixed(2)}</td>
                <td>{(n.totalAmount ?? 0).toFixed(2)}</td>
                <td>{n.paymentMode}</td>
                <td>{n.customerName}</td>
                <td>{n.address}</td>
                <td>{n.mobile}</td>
                <td>{n.orderType}</td>
                <td>{n.id}</td>
                <td>{n.status}</td>
                <td>{n.items.join(", ")}</td>
              </tr>
            )) : <tr><td colSpan={20} className="text-center">No data available</td></tr>}
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
            {apcAppSummary.length > 0 ? apcAppSummary.map((a, i) => (
              <tr key={i}>
                <td>{a.billNo}</td>
                <td>{a.billDate}</td>
                <td>{a.kotNo}</td>
                <td>{a.revKot ? "Yes" : "No"}</td>
                <td>{(a.grossAmount ?? 0).toFixed(2)}</td>
                <td>{(a.discount ?? 0).toFixed(2)}</td>
                <td>{(a.amount ?? 0).toFixed(2)}</td>
                <td>{(a.cgst ?? 0).toFixed(2)}</td>
                <td>{(a.sgst ?? 0).toFixed(2)}</td>
                <td>{(a.cess ?? 0).toFixed(2)}</td>
                <td>{(a.serviceCharge ?? 0).toFixed(2)}</td>
                <td>{(a.totalAmount ?? 0).toFixed(2)}</td>
                <td>{a.paymentMode}</td>
                <td>{a.customerName}</td>
                <td>{a.address}</td>
                <td>{a.mobile}</td>
                <td>{a.orderType}</td>
                <td>{a.type}</td>
                <td>{(a.amount ?? 0).toFixed(2)}</td>
                <td>{a.details ?? "N/A"}</td>
              </tr>
            )) : <tr><td colSpan={20} className="text-center">No data available</td></tr>}
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
            {specialItemsSummary.length > 0 ? specialItemsSummary.map((s, i) => (
              <tr key={i}>
                <td>{s.billNo}</td>
                <td>{s.billDate}</td>
                <td>{s.kotNo}</td>
                <td>{s.revKot ? "Yes" : "No"}</td>
                <td>{(s.grossAmount ?? 0).toFixed(2)}</td>
                <td>{(s.discount ?? 0).toFixed(2)}</td>
                <td>{(s.amount ?? 0).toFixed(2)}</td>
                <td>{(s.cgst ?? 0).toFixed(2)}</td>
                <td>{(s.sgst ?? 0).toFixed(2)}</td>
                <td>{(s.cess ?? 0).toFixed(2)}</td>
                <td>{(s.serviceCharge ?? 0).toFixed(2)}</td>
                <td>{(s.totalAmount ?? 0).toFixed(2)}</td>
                <td>{s.paymentMode}</td>
                <td>{s.customerName}</td>
                <td>{s.address}</td>
                <td>{s.mobile}</td>
                <td>{s.orderType}</td>
                <td>{s.name}</td>
                <td>{s.qty}</td>
                <td>{(s.sales ?? 0).toFixed(2)}</td>
              </tr>
            )) : <tr><td colSpan={20} className="text-center">No data available</td></tr>}
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
            {interDeptCash.length > 0 ? interDeptCash.map((i, j) => (
              <tr key={j}>
                <td>{i.billNo}</td>
                <td>{i.billDate}</td>
                <td>{i.kotNo}</td>
                <td>{i.revKot ? "Yes" : "No"}</td>
                <td>{(i.grossAmount ?? 0).toFixed(2)}</td>
                <td>{(i.discount ?? 0).toFixed(2)}</td>
                <td>{(i.amount ?? 0).toFixed(2)}</td>
                <td>{(i.cgst ?? 0).toFixed(2)}</td>
                <td>{(i.sgst ?? 0).toFixed(2)}</td>
                <td>{(i.cess ?? 0).toFixed(2)}</td>
                <td>{(i.serviceCharge ?? 0).toFixed(2)}</td>
                <td>{(i.totalAmount ?? 0).toFixed(2)}</td>
                <td>{i.paymentMode}</td>
                <td>{i.customerName}</td>
                <td>{i.address}</td>
                <td>{i.mobile}</td>
                <td>{i.orderType}</td>
                <td>{i.from}</td>
                <td>{i.to}</td>
                <td>{(i.amount ?? 0).toFixed(2)}</td>
                <td>{i.type}</td>
              </tr>
            )) : <tr><td colSpan={21} className="text-center">No data available</td></tr>}
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
            {dailySalesUserShift.length > 0 ? dailySalesUserShift.map((d, i) => (
              <tr key={i}>
                <td>{d.billNo}</td>
                <td>{d.billDate}</td>
                <td>{d.kotNo}</td>
                <td>{d.revKot ? "Yes" : "No"}</td>
                <td>{(d.grossAmount ?? 0).toFixed(2)}</td>
                <td>{(d.discount ?? 0).toFixed(2)}</td>
                <td>{(d.amount ?? 0).toFixed(2)}</td>
                <td>{(d.cgst ?? 0).toFixed(2)}</td>
                <td>{(d.sgst ?? 0).toFixed(2)}</td>
                <td>{(d.cess ?? 0).toFixed(2)}</td>
                <td>{(d.serviceCharge ?? 0).toFixed(2)}</td>
                <td>{(d.totalAmount ?? 0).toFixed(2)}</td>
                <td>{d.paymentMode}</td>
                <td>{d.customerName}</td>
                <td>{d.address}</td>
                <td>{d.mobile}</td>
                <td>{d.orderType}</td>
                <td>{d.user}</td>
                <td>{d.shift}</td>
                <td>{(d.sales ?? 0).toFixed(2)}</td>
              </tr>
            )) : <tr><td colSpan={20} className="text-center">No data available</td></tr>}
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
            {monthlySalesSummary.length > 0 ? monthlySalesSummary.map((m, i) => (
              <tr key={i}>
                <td>{m.billNo}</td>
                <td>{m.billDate}</td>
                <td>{m.kotNo}</td>
                <td>{m.revKot ? "Yes" : "No"}</td>
                <td>{(m.grossAmount ?? 0).toFixed(2)}</td>
                <td>{(m.discount ?? 0).toFixed(2)}</td>
                <td>{(m.amount ?? 0).toFixed(2)}</td>
                <td>{(m.cgst ?? 0).toFixed(2)}</td>
                <td>{(m.sgst ?? 0).toFixed(2)}</td>
                <td>{(m.cess ?? 0).toFixed(2)}</td>
                <td>{(m.serviceCharge ?? 0).toFixed(2)}</td>
                <td>{(m.totalAmount ?? 0).toFixed(2)}</td>
                <td>{m.paymentMode}</td>
                <td>{m.customerName}</td>
                <td>{m.address}</td>
                <td>{m.mobile}</td>
                <td>{m.orderType}</td>
                <td>{m.month}</td>
                <td>{(m.sales ?? 0).toFixed(2)}</td>
              </tr>
            )) : <tr><td colSpan={19} className="text-center">No data available</td></tr>}
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
            {paymentModeSalesSummary.length > 0 ? paymentModeSalesSummary.map((p, i) => (
              <tr key={i}>
                <td>{p.billNo}</td>
                <td>{p.billDate}</td>
                <td>{p.kotNo}</td>
                <td>{p.revKot ? "Yes" : "No"}</td>
                <td>{(p.grossAmount ?? 0).toFixed(2)}</td>
                <td>{(p.discount ?? 0).toFixed(2)}</td>
                <td>{(p.amount ?? 0).toFixed(2)}</td>
                <td>{(p.cgst ?? 0).toFixed(2)}</td>
                <td>{(p.sgst ?? 0).toFixed(2)}</td>
                <td>{(p.cess ?? 0).toFixed(2)}</td>
                <td>{(p.serviceCharge ?? 0).toFixed(2)}</td>
                <td>{(p.totalAmount ?? 0).toFixed(2)}</td>
                <td>{p.paymentMode}</td>
                <td>{p.customerName}</td>
                <td>{p.address}</td>
                <td>{p.mobile}</td>
                <td>{p.orderType}</td>
                <td>{p.mode}</td>
                <td>{(p.total ?? 0).toFixed(2)}</td>
              </tr>
            )) : <tr><td colSpan={19} className="text-center">No data available</td></tr>}
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
      <Card.Header className="py-2">
        <Row className="align-items-center">
          <Col xs="auto" className="pe-0">
            <Form.Label className="mb-0">Report Type:</Form.Label>
          </Col>
          <Col xs="auto">
            <Form.Select
              size="sm"
              value={kitchenAllocationType}
              onChange={(e) => setKitchenAllocationType(e.target.value)}
            >
              <option value="allocation">Allocation (default)</option>
              <option value="withAmount">With Amount</option>
            </Form.Select>
          </Col>
        </Row>
      </Card.Header>
      <Card.Body style={{ overflowY: 'auto', maxHeight: '70vh' }}>
        <Table bordered hover responsive size="sm">
          <thead style={{ backgroundColor: "#FFF3E0" }}>
            <tr>
              {kitchenAllocationType === 'allocation' ? (
                ["Item No", "Item Name", "Qty"].map((h, i) => (
                  <th key={i} style={{ position: 'sticky', top: 0, backgroundColor: '#FFF3E0', zIndex: 1 }}>{h}</th>
                ))
              ) : (
                ["Item No", "Item Name", "Qty", "Amount"].map((h, i) => (
                  <th key={i} style={{ position: 'sticky', top: 0, backgroundColor: '#FFF3E0', zIndex: 1 }}>{h}</th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {kitchenAllocation.length > 0 ? kitchenAllocation.map((k, i) => (
              <tr key={i}>
                <td>{k.orderNo}</td>
                <td>{k.customerName}</td>
                <td>{k.itemsCount}</td>
                {kitchenAllocationType === 'withAmount' && (
                  <td>{(k.amount ?? 0).toFixed(2)}</td>
                )}
              </tr>
            )) : (
              <tr><td colSpan={kitchenAllocationType === 'allocation' ? 3 : 4} className="text-center">No data available</td></tr>
            )}
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
              <td>{(dayEndReport.grossAmount ?? 0).toFixed(2)}</td>
              <td>{(dayEndReport.discount ?? 0).toFixed(2)}</td>
              <td>{(dayEndReport.amount ?? 0).toFixed(2)}</td>
              <td>{(dayEndReport.cgst ?? 0).toFixed(2)}</td>
              <td>{(dayEndReport.sgst ?? 0).toFixed(2)}</td>
              <td>{(dayEndReport.cess ?? 0).toFixed(2)}</td>
              <td>{(dayEndReport.serviceCharge ?? 0).toFixed(2)}</td>
              <td>{(dayEndReport.totalAmount ?? 0).toFixed(2)}</td>
              <td>{dayEndReport.paymentMode}</td>
              <td>{dayEndReport.customerName}</td>
              <td>{dayEndReport.address}</td>
              <td>{dayEndReport.mobile}</td>
              <td>{dayEndReport.orderType}</td>
              <td>Total Sales</td>
              <td>{(dayEndReport.totalSales ?? 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td>{dayEndReport.billNo}</td>
              <td>{dayEndReport.billDate}</td>
              <td>{dayEndReport.kotNo}</td>
              <td>{dayEndReport.revKot ? "Yes" : "No"}</td>
              <td>{(dayEndReport.grossAmount ?? 0).toFixed(2)}</td>
              <td>{(dayEndReport.discount ?? 0).toFixed(2)}</td>
              <td>{(dayEndReport.amount ?? 0).toFixed(2)}</td>
              <td>{(dayEndReport.cgst ?? 0).toFixed(2)}</td>
              <td>{(dayEndReport.sgst ?? 0).toFixed(2)}</td>
              <td>{(dayEndReport.cess ?? 0).toFixed(2)}</td>
              <td>{(dayEndReport.serviceCharge ?? 0).toFixed(2)}</td>
              <td>{(dayEndReport.totalAmount ?? 0).toFixed(2)}</td>
              <td>{dayEndReport.paymentMode}</td>
              <td>{dayEndReport.customerName}</td>
              <td>{dayEndReport.address}</td>
              <td>{dayEndReport.mobile}</td>
              <td>{dayEndReport.orderType}</td>
              <td>Cash In Hand</td>
              <td>{(dayEndReport.cashInHand ?? 0).toFixed(2)}</td>
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
              <td>{(handoverReport.grossAmount ?? 0).toFixed(2)}</td>
              <td>{(handoverReport.discount ?? 0).toFixed(2)}</td>
              <td>{(handoverReport.amount ?? 0).toFixed(2)}</td>
              <td>{(handoverReport.cgst ?? 0).toFixed(2)}</td>
              <td>{(handoverReport.sgst ?? 0).toFixed(2)}</td>
              <td>{(handoverReport.cess ?? 0).toFixed(2)}</td>
              <td>{(handoverReport.serviceCharge ?? 0).toFixed(2)}</td>
              <td>{(handoverReport.totalAmount ?? 0).toFixed(2)}</td>
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
            {billReprinted.length > 0 ? billReprinted.map((b, i) => (
              <tr key={i}>
                <td>{b.billNo}</td>
                <td>{b.billDate}</td>
                <td>{b.kotNo}</td>
                <td>{b.revKot ? "Yes" : "No"}</td>
                <td>{(b.grossAmount ?? 0).toFixed(2)}</td>
                <td>{(b.discount ?? 0).toFixed(2)}</td>
                <td>{(b.amount ?? 0).toFixed(2)}</td>
                <td>{(b.cgst ?? 0).toFixed(2)}</td>
                <td>{(b.sgst ?? 0).toFixed(2)}</td>
                <td>{(b.cess ?? 0).toFixed(2)}</td>
                <td>{(b.serviceCharge ?? 0).toFixed(2)}</td>
                <td>{(b.totalAmount ?? 0).toFixed(2)}</td>
                <td>{b.paymentMode}</td>
                <td>{b.customerName}</td>
                <td>{b.address}</td>
                <td>{b.mobile}</td>
                <td>{b.orderType}</td>
                <td>{b.reprints}</td>
                <td>{b.reason}</td>
              </tr>
            )) : <tr><td colSpan={19} className="text-center">No data available</td></tr>}
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
            {kotUsedSummary.length > 0 ? kotUsedSummary.map((k, i) => (
              <tr key={i}>
                <td>{k.billNo || k.usedIn}</td>
                <td>{k.billDate}</td>
                <td>{k.kotNo}</td>
                <td>{k.revKot ? "Yes" : "No"}</td>
                <td>{(k.grossAmount ?? 0).toFixed(2)}</td>
                <td>{(k.discount ?? 0).toFixed(2)}</td>
                <td>{(k.amount ?? 0).toFixed(2)}</td>
                <td>{(k.cgst ?? 0).toFixed(2)}</td>
                <td>{(k.sgst ?? 0).toFixed(2)}</td>
                <td>{(k.cess ?? 0).toFixed(2)}</td>
                <td>{(k.serviceCharge ?? 0).toFixed(2)}</td>
                <td>{(k.totalAmount ?? 0).toFixed(2)}</td>
                <td>{k.paymentMode}</td>
                <td>{k.customerName}</td>
                <td>{k.address}</td>
                <td>{k.mobile}</td>
                <td>{k.orderType}</td>
                <td>{k.usedIn}</td>
                <td>{k.items ?? 0}</td>
              </tr>
            )) : <tr><td colSpan={19} className="text-center">No data available</td></tr>}
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

  if (loading) return <div className="text-center p-4"><div>Loading reports...</div></div>;
  if (error) return <div className="text-center p-4 text-danger">{error}</div>;

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

            <Col md={2} xs={12}>
              <Form.Select
                name="outlet"
                value={filters.outlet}
                onChange={(e) => setFilters(prev => ({ ...prev, outlet: e.target.value }))}
                className="form-select-sm"
                size="sm"
              >
                <option value="">All Outlets</option>
                {outlets.map(outlet => (
                  <option key={outlet.outletid} value={outlet.outletid}>{outlet.outlet_name}</option>
                ))}
              </Form.Select>
            </Col>

            {["reverseKOTs", "discountSummary"].includes(reportCategory) && (
              <Col md={2} xs={6}>
                <Form.Select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="form-select-sm"
                  size="sm"
                >
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom</option>
                  {/* If you add a 'weekly' option, ensure the filterBills function handles it. */}
                  {/* <option value="weekly">Weekly</option> */}
                </Form.Select>
              </Col>
            )}


            <Col md={2} xs={6}>
              <Form.Control
                type="date"
                placeholder="From Date"
                value={customRange.start}
                className="form-control-sm"
                onChange={(e) => handleDateChange("start", e.target.value)}
                size="sm"
              />
            </Col>

            <Col md={2} xs={6}>
              <Form.Control
                type="date"
                placeholder="To Date"
                value={customRange.end}
                className="form-control-sm"
                onChange={(e) => handleDateChange("end", e.target.value)}
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

          {dateError && (
            <Row className="mb-2">
              <Col>
                <Alert variant="danger" className="py-1 mb-0 text-center">{dateError}</Alert>
              </Col>
            </Row>
          )}

          {renderReportContent()}
        </div>
      </div>
    </Card>
  );
};

export default ReportPage;