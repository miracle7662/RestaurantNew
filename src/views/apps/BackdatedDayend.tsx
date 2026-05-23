import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Form,
  Button,
  Badge,
  Modal,
  InputGroup,
  Tab,
  Tabs
} from "react-bootstrap";
import {
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  DollarSign,
  Calendar,
  FileText,
  CreditCard,
  Tag,
  RefreshCw,
  BarChart
} from "lucide-react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { useAuthContext } from '@/common/context/useAuthContext';
import { useNavigate } from 'react-router-dom';
import HandoverPasswordModal from "../../components/HandoverPasswordModal";
import DayendService from '@/common/api/dayend';
import OrderService from '@/common/api/order.ts';
import OutletPaymentModeService, { PaymentModeData } from '@/common/api/outletpaymentmode.ts';

ChartJS.register(ArcElement, Tooltip, Legend);

interface Order {
  orderNo: string;
  table: number;
  waiter: string;
  amount: number;
  type: string;
  status: string;
  time: string;
  items: number;
  kotNo: string;
  revKotNo: string;
  discount: number;
  ncKot: string;
  ncName?: string;
  ncPurpose?: string;
  cgst: number;
  sgst: number;
  grossAmount: number;
  roundOff: number;
  revAmt?: number;
  reverseBill: number | string;
  water?: number;
  captain?: string;
  user?: string;
  date: string;
  paymentType?: string;
  cash?: number;
  credit?: number;
  card?: number;
  gpay?: number;
  phonepe?: number;
  qrcode?: number;
  isDayEnd?: number;
  dayEndEmpID?: number;
  outletid?: number;
  tip?: number;
  settlementAmount?: number;
  billedDate?: string;
  taxableValue?: number;
}

const DayEnd = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  const todayStr = `${yyyy}-${mm}-${dd}`;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState("summary");

  const [DayEndBy, ] = useState(user?.username || "");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashDenominations, setCashDenominations] = useState({
    2000: 0,
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    2: 0,
    1: 0,
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordVerified, setPasswordVerified] = useState(false);
  const [showOnlyNotDayEnded, ] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportDate, setReportDate] = useState(todayStr);
  const [selectedReports, setSelectedReports] = useState({
    billDetails: true,
    creditSummary: true,
    paymentSummary: true,
    discountSummary: true,
    reverseKOTSummary: true,
    reverseBillSummary: true,
    ncKOTSummary: true,
  });

  const [selectedDate, setSelectedDate] = useState(todayStr);
  const isBackDated = selectedDate !== todayStr;
  const [paymentModes, setPaymentModes] = useState<PaymentModeData[]>([]);
  const [reason, setReason] = useState('');

  useEffect(() => {
    const fetchPaymentModes = async () => {
      if (!user?.outletid) return;
      try {
        const response = await OutletPaymentModeService.list({ outletid: user.outletid });
        if (response.success && response.data) {
          setPaymentModes(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch payment modes:', error);
      }
    };
    fetchPaymentModes();
  }, [user?.outletid]);

  useEffect(() => {
    const fetchdayendData = async () => {
      try {
        const response = await DayendService.getBackDayendData({
          date: selectedDate,
        });
        if (!response.success) {
          throw new Error('Network response was not ok');
        }

        if (response.success) {
          console.log("Fetched orders data:", response.data.orders);
          setOrders(response.data.orders);
        } else {
          throw new Error(response.message || 'Failed to fetch data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchdayendData();
  }, [selectedDate]);

  useEffect(() => {
    if (user && !passwordVerified) {
      setShowPasswordModal(true);
    }
  }, [user, passwordVerified]);

  const getPaymentAmount = (order: any, modeName: string): number => {
    const normalizedMode = modeName.trim().toLowerCase();
    const paymentKey = Object.keys(order.payments || {}).find(
      key => key.trim().toLowerCase() === normalizedMode
    );
    if (paymentKey) {
      return Number(order.payments[paymentKey]) || 0;
    }
    return 0;
  };

  const totalOrders = orders.length;
  const totalKOTs = orders.length;
  const totalSales = orders.reduce((sum, order) => sum + order.amount, 0);
  const cash = orders.reduce((sum, order) => sum + (order.cash || 0), 0);
  const card = orders.reduce((sum, order) => sum + (order.card || 0), 0);
  const upi = orders.reduce((sum, order) =>
    sum + (order.gpay || 0) + (order.phonepe || 0) + (order.qrcode || 0), 0
  );
  const pending = orders.filter(order => order.status === "Pending").length;
  const completed = orders.filter(order => order.status === "Settled").length;
  const cancelled = orders.filter(order => order.status === "Cancelled").length;
  const averageOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;
  const totalDiscount = orders.reduce((sum, order) => sum + order.discount, 0);
  const totalCGST = orders.reduce((sum, order) => sum + order.cgst, 0);
  const totalSGST = orders.reduce((sum, order) => sum + order.sgst, 0);
  const totalGrossAmount = orders.reduce((sum, order) => sum + (order.grossAmount || 0), 0);
  const totalRoundOff = orders.reduce((sum, order) => sum + (order.roundOff || 0), 0);
  const totalRevAmt = orders.reduce((sum, order) => sum + (order.revAmt || 0), 0);
  const totalItems = orders.reduce((sum, order) => sum + order.items, 0);
  const totalCash = orders.reduce((sum, order) => sum + (order.cash || 0), 0);
  const totalTip = orders.reduce((sum, order) => sum + (order.tip || 0), 0);
  const totalSettlement = orders.reduce((sum, order) => sum + (order.settlementAmount || 0), 0);
  const totalTaxableValue = orders.reduce((sum, order) => sum + (order.taxableValue || 0), 0);

  const summary = {
    totalOrders,
    totalKOTs,
    totalSales,
    cash,
    card,
    upi,
    pending,
    completed,
    cancelled,
    averageOrderValue,
  };

  const dynamicPaymentMethods = paymentModes.map(mode => {
    const amount = orders.reduce((sum, order) => sum + getPaymentAmount(order, mode.mode_name), 0);
    return {
      type: mode.mode_name,
      amount,
      percentage: totalSales > 0 ? ((amount / totalSales) * 100).toFixed(1) : "0"
    };
  });

  const paymentData = {
    labels: dynamicPaymentMethods.map(pm => pm.type),
    datasets: [{
      label: 'Payment Breakdown',
      data: dynamicPaymentMethods.map(pm => pm.amount),
      backgroundColor: [
        'rgba(75, 192, 192, 0.2)',
        'rgba(255, 99, 132, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 159, 64, 0.2)',
        'rgba(255, 206, 86, 0.2)'
      ],
      borderColor: [
        'rgba(75, 192, 192, 1)',
        'rgba(255, 99, 132, 1)',
        'rgba(54, 162, 235, 1)',
        'rgba(153, 102, 255, 1)',
        'rgba(255, 159, 64, 1)',
        'rgba(255, 206, 86, 1)'
      ],
      borderWidth: 1,
    }],
  };

  const paymentOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = (order.orderNo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.table.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.waiter || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.captain || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.user || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesDayEnd = !showOnlyNotDayEnded || (order.isDayEnd === 0 || order.isDayEnd == null);
    return matchesSearch && matchesStatus && matchesDayEnd;
  });

  const paymentModeTotals = paymentModes.reduce((acc, mode) => {
    acc[mode.mode_name] = filteredOrders.reduce(
      (sum, order) => sum + getPaymentAmount(order, mode.mode_name),
      0
    );
    return acc;
  }, {} as Record<string, number>);

  const visiblePaymentModes = paymentModes.filter(
    (mode) => (paymentModeTotals[mode.mode_name] || 0) > 0
  );

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleOpenReportModal = () => {
    setShowReportModal(true);
  };

const exportOrdersToExcel = () => {
  try {
    // Helper to format date as DD/MM/YYYY
   

    const exportRows = filteredOrders.map((order) => {
      // Fixed columns in the exact order of your sample file (up to Payment Type)
      const row: Record<string, any> = {
        "Bill No": order.orderNo,
        "Total Amt (₹)": order.amount || 0,
        "Tip Amount (₹)": order.tip || 0,
        "Discount (₹)": order.discount || 0,
        "Taxable Value (₹)": order.taxableValue || 0,
        "CGST (₹)": order.cgst || 0,
        "SGST (₹)": order.sgst || 0,
        "Round off (₹)": order.roundOff || 0,
        "Gross Amount (₹)": order.grossAmount || 0,
        "Settlement Amt (₹)": order.settlementAmount || 0,
        //"Table": order.table,
        
        // "Rev Amt (₹)": order.revAmt || 0,
        // "KOT No": order.kotNo || "",
        // "Rev KOT No": order.revKotNo ? order.revKotNo.split(',').map(k => k.trim()).join(', ') : "",
        // "NC Name": order.ncName || "",
        // "NC Purpose": order.ncPurpose || "",
        // "isNCKOT": order.ncKot ? "Yes" : "No",
        // "Outlet ID": order.outletid || "",
        // "Waiter/Captain": order.captain || order.waiter || "",
        // "Reverse Bill": order.reverseBill == 1 ? "Yes" : "No",
        // "User": order.user || "",
        // "Total Items": order.items || 0,
        // "Time": getFormattedTimeFromDateTime(order.billedDate || order.time),
        // "Status": order.status,
        "Payment Type": order.paymentType || "",
      };

      // YOUR ORIGINAL DYNAMIC PAYMENT MODES LOOP (unchanged)
      visiblePaymentModes.forEach((mode) => {
        row[`${mode.mode_name}`] = getPaymentAmount(order, mode.mode_name) || 0;
      });

      return row;
    });

    // Add Total Footer Row
    if (exportRows.length > 0) {
      const totalFooterRow: Record<string, any> = {};
      // Get all column keys from the first row
      const allColumns = Object.keys(exportRows[0]);
      allColumns.forEach(col => {
        if (col === "Date" || col === "Bill No" || col === "KOT No" || col === "Rev KOT No" ||
            col === "NC Name" || col === "NC Purpose" || col === "Outlet ID" ||
            col === "Waiter/Captain" || col === "User" || col === "Time" || col === "Status" ||
            col === "Payment Type" || col === "Table" || col === "Reverse Bill" || col === "isNCKOT") {
          totalFooterRow[col] = "";
        } else if (col === "Bill No") {
          totalFooterRow[col] = "Total";
        } else {
          const sum = exportRows.reduce((acc, row) => acc + (Number(row[col]) || 0), 0);
          totalFooterRow[col] = sum;
        }
      });
      exportRows.push(totalFooterRow);
    }

    // Prepare data for Excel with header rows
    const sheetData: any[][] = [];
    
    // Row 1 - Hotel name on left and Date on right within the same merged cell
   // Row 1 - Hotel name on left and Date on right within the same merged cell
// Row 1 - Hotel name on left and Date on right within the same merged cell
   const hotelName = `${(user?.hotel?.hotel_name || user?.hotel_name || 'Hotel Name').toUpperCase()} - DAILY SALES SUMMARY`;    // Format the selected date (from date picker) as DD/MM/YYYY
    const selectedDateObj = new Date(selectedDate);
    const formattedSelectedDate = selectedDateObj.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    
    // Create header text with hotel name on left and date on right with spaces in between
    const headerText = `${hotelName.toUpperCase()}${' '.repeat(20)}Date - ${formattedSelectedDate}`;
    sheetData.push([headerText]);
    
    // Add the actual data rows with column headers
    if (exportRows.length > 0) {
      // Get column headers from first row
      const columnHeaders = Object.keys(exportRows[0]);
      
      // Add column headers as a row
      sheetData.push(columnHeaders);
      
      // Add data rows
      exportRows.forEach(row => {
        const rowData: any[] = [];
        columnHeaders.forEach(header => {
          rowData.push(row[header]);
        });
        sheetData.push(rowData);
      });
    }
    
    // Create worksheet from the array data
    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    
    // Style the worksheet
    if (exportRows.length > 0) {
      const numberOfColumns = Object.keys(exportRows[0]).length;
      
      // Set column widths
      const colWidths = Array(numberOfColumns).fill({ wch: 15 });
      worksheet['!cols'] = colWidths;
      
      // Merge cells for the header row (row 1 in sheetData, which is index 0 in worksheet)
      if (numberOfColumns > 0) {
        worksheet['!merges'] = [
          { s: { r: 0, c: 0 }, e: { r: 0, c: numberOfColumns - 1 } } // Merge row 1 (index 0)
        ];
      }
    }
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Backdated Orders");

    const fileDate = selectedDate || todayStr;
    XLSX.writeFile(workbook, `backdated-orders-${fileDate}.xlsx`);
    toast.success("Export successful!");
  } catch (e) {
    console.error("Export failed:", e);
    toast.error("Export to Excel failed");
  }
};
  const handleClose = () => {
    if (window.confirm("Are you sure you want to close?")) {
      window.history.back();
    }
  };

  const handleOpenCashModal = () => {
    setShowCashModal(true);
  };

  const handleCloseCashModal = () => {
    setShowCashModal(false);
  };

  const handleCountChange = (denom: number, value: number) => {
    setCashDenominations(prev => ({ ...prev, [denom]: value }));
  };

  const handleSaveCashDenomination = async () => {
    const countedCashTotal = Object.entries(cashDenominations).reduce(
      (sum, [denom, count]) => sum + parseInt(denom) * count,
      0
    );
    
    const payload = {
      denominations: cashDenominations,
      total: countedCashTotal,
      expected: totalCash,
      difference: countedCashTotal - totalCash,
      reason,
      DayEndBy,
      userId: user?.id,
    };

    try {
      setLoading(true);
      const response = await DayendService.saveDayEndCashDenomination(payload);
      if (!response || !response.success) {
        throw new Error(response?.message || "Failed to save cash denomination");
      }
      alert(
        `Day-End Cash Denomination saved successfully! Total Counted Cash: ₹${countedCashTotal.toLocaleString()}`
      );
      handleCloseCashModal();
    } catch (err) {
      console.error("Error saving cash denomination:", err);
      alert("An error occurred while saving. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordVerify = async (password: string): Promise<boolean> => {
    try {
      if (!user?.token) {
        console.error('Authentication token is missing for password verification.');
        return false;
      }
      const response = await OrderService.verifyCreatorPassword(password);
      if (response.success) {
        setPasswordVerified(true);
        setShowPasswordModal(false);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  };

  const handleGenerateReports = async () => {
  try {
    const selectedReportKeys = Object.keys(selectedReports).filter(
      key => selectedReports[key as keyof typeof selectedReports]
    );

    if (selectedReportKeys.length === 0) {
      toast.error("Please select at least one report to generate.");
      return;
    }

    if (!user) {
      toast.error("User information is not available. Please log in again.");
      return;
    }

    setLoading(true);
    
    const payload = {
      DayEndEmpID: user.id,
      businessDate: reportDate,
      selectedReports: selectedReportKeys,
    };

    const response = await DayendService.generateReportHTML(payload);

    if (response.success && response.data) {
      // Store report data in sessionStorage for the preview page
      // (Preview page reads dayEndReportData/dayEndReportDate)
      sessionStorage.setItem("dayEndReportData", JSON.stringify(response.data || {}));
      sessionStorage.setItem("dayEndReportDate", reportDate);
      
      // Close modal and navigate to preview

      setShowReportModal(false);
      navigate("/apps/Masters/Reports/DayEndReportPreview");
      toast.success('Report ready for preview!');
    } else {
      toast.error(response.message || "Failed to generate reports.");
    }
  } catch (error) {
    console.error('Error generating reports:', error);
    toast.error("An error occurred while generating reports.");
  } finally {
    setLoading(false);
  }
};

  const StatusBadge = ({ status }: { status: string }) => {
    const variants = {
      "Settled": "success",
      "Pending": "warning",
      "Cancelled": "danger"
    };
    return <Badge bg={variants[status as keyof typeof variants] || "secondary"}>{status}</Badge>;
  };

  const getFormattedTimeFromDateTime = (dateTimeStr?: string) => {
    if (!dateTimeStr) return "";

    // MySQL might send dateTime already as 'YYYY-MM-DD HH:mm:ss'
    // new Date(...) can interpret it inconsistently depending on browser.
    // Extract time part directly when possible.
    const asStr = String(dateTimeStr);
    const timeMatch = asStr.match(/\b(\d{1,2}:\d{2}:\d{2})\b/);
    if (timeMatch?.[1]) return timeMatch[1];

    const d = new Date(asStr);
    if (isNaN(d.getTime())) return asStr;

    return d.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };


  const getFormattedDate = (dateStr: string) => {
    const dateObj = new Date(dateStr);
    if (isNaN(dateObj.getTime())) {
      return dateStr;
    }
    return dateObj.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const countedCashTotal = Object.entries(cashDenominations).reduce(
    (sum, [denom, count]) => sum + parseInt(denom) * count,
    0
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <>
      <style>{`
        .main-container {
          height: 100vh;
          overflow: hidden;
        }
        .tabs-header {
          position: sticky;
          top: 0;
          z-index: 100;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .table-container {
          position: relative;
          height: calc(100vh - 350px);
          overflow-y: auto;
          overflow-x: auto;
        }
        .table-container thead th {
          position: sticky;
          top: 0;
          z-index: 10;
          background-color: #f8f9fa;
          border-bottom: 1px solid #dee2e6;
          padding: 0.4rem 0.75rem;
          font-size: 0.85rem;
          white-space: nowrap;
        }
        .table-container tfoot td {
          position: sticky;
          bottom: 0;
          z-index: 5;
          background-color: #d4edda !important;
          border-top: 2px solid #28a745;
          font-weight: bold;
          color: #155724 !important;
          padding: 0.4rem 0.75rem;
          font-size: 0.9rem;
          white-space: nowrap;
        }
        .table-container .table-success {
          background-color: #d4edda !important;
        }
        .table-container .table-success td {
          background-color: #d4edda !important;
          color: #155724 !important;
        }
        .table-container table {
          margin-bottom: 0;
          table-layout: auto;
          width: 100%;
          min-width: max-content;
          border-collapse: separate;
        }
        .table-container th,
        .table-container td {
          word-wrap: break-word;
          overflow-wrap: break-word;
          padding: 0.4rem 0.75rem;
          vertical-align: middle;
          border: 1px solid #dee2e6;
        }
        .table-container tbody td {
          font-size: 0.9rem;
        }
        .table-container .table-row-compact td {
          padding: 0.18rem 0.5rem;
          line-height: 1.15;
        }
        .table-container .table-row-compact td small {
          line-height: 1.1;
        }
        .table-row-discount, .table-row-discount td {
          background-color: #fff0f1 !important;
          color: #721c24 !important;
        }
        .table-row-nckot, .table-row-nckot td {
          background-color: #eef0ff !important;
          color: #2c2e43 !important;
        }
        .table-row-reversed, .table-row-reversed td {
          background-color: #f8d7da !important;
          color: #721c24 !important;
        }
        .summary-cards {
          margin-bottom: 1rem;
        }
        .payment-section {
          margin-top: 1rem;
        }
        .filters-section {
          margin-top: 0.5rem;
          padding: 0.5rem;
        }
        .action-section {
          position: sticky;
          bottom: 0;
          z-index: 50;
          background: white;
          border-top: 1px solid #dee2e6;
          padding: 0.5rem;
        }
        .card-body-compact {
          padding: 1.5rem;
        }
        .header-compact {
          padding: 1rem;
        }
        .metric-card {
          margin-bottom: 1rem;
        }
        .chart-container {
          height: 250px;
          position: relative;
        }
        .stats-container {
          padding: 1rem;
        }
        .table-row-compact td {
          padding: 0.25rem 0.5rem;
          vertical-align: middle;
        }
        .modal-compact .modal-body {
          padding: 0.5rem;
        }
        .handover-form {
          border: 1px solid #dee2e6;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 0.375rem;
        }
        .handover-form-row {
          display: flex;
          gap: 1rem;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .handover-form-label {
          font-weight: bold;
          min-width: 100px;
        }
        .handover-form-input {
          flex: 1;
          min-width: 150px;
        }
        .cash-denom-list {
          max-height: 200px;
          overflow-y: auto;
          font-size: 0.85rem;
        }
        .cash-denom-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0;
          border-bottom: 1px solid #dee2e6;
        }
        .cash-denom-denom {
          width: 60px;
          font-weight: bold;
        }
        .cash-denom-count {
          flex: 1;
        }
        .cash-denom-amount {
          width: 80px;
          text-align: right;
          font-weight: 500;
        }
        .cash-total {
          font-weight: bold;
          color: #28a745;
          border-top: 2px solid #28a745;
          padding-top: 0.5rem;
          margin-top: 0.5rem;
        }
        .report-checkbox {
          margin-bottom: 0.5rem;
        }
        .report-icon {
          margin-right: 0.5rem;
          color: #6c757d;
        }
      `}</style>
      
      {passwordVerified ? (
        <Container fluid className="p-0 bg-light main-container">
          {/* Header Section */}
          <Card className="mb-0 shadow-sm border-0">
            <Card.Header className="bg-white border-0 header-compact">
              <Row className="align-items-center">
                <Col>
                  <h5 className="fw-bold text-primary mb-0">
                    Day End
                    {isBackDated && (
                      <Badge bg="info" className="ms-2" style={{ fontSize: '0.7rem', verticalAlign: 'middle' }}>
                        Back-dated
                      </Badge>
                    )}
                  </h5>
                </Col>
                <Col xs="auto" className="d-flex align-items-center gap-2">
                  <Calendar size={16} className="text-muted" />
                  <span className="text-muted small fw-semibold">Business Date:</span>
                  <Form.Control
                    type="date"
                    size="sm"
                    value={selectedDate}
                    max={todayStr}
                    style={{ width: '160px' }}
                    onChange={(e) => {
                      setSelectedDate(e.target.value);
                      setReportDate(e.target.value);
                    }}
                  />
                </Col>
              </Row>
            </Card.Header>
          </Card>

          {/* Tabs Navigation */}
          <div className="tabs-header">
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => k && setActiveTab(k)}
              className="mb-0"
            >
              <Tab
                eventKey="summary"
                title={
                  <span className="d-flex align-items-center">
                    <BarChart3 size={14} className="me-1" />
                    Summary
                  </span>
                }
              >
                <div className="p-1">
                  <Row className="summary-cards">
                    {[
                      {
                        title: "Total Orders",
                        value: summary.totalOrders,
                        icon: <CheckCircle className="text-primary" size={24} />,
                        subtitle: `${summary.completed} completed`
                      },
                      {
                        title: "Total KOTs",
                        value: summary.totalKOTs,
                        icon: <Printer className="text-success" size={24} />,
                        subtitle: "Kitchen orders"
                      },
                      {
                        title: "Total Sales",
                        value: `₹${summary.totalSales.toLocaleString()}`,
                        icon: <DollarSign className="text-warning" size={24} />,
                        subtitle: `Avg: ₹${summary.averageOrderValue}`
                      },
                      {
                        title: "Pending",
                        value: summary.pending,
                        icon: <AlertTriangle className="text-danger" size={24} />,
                        subtitle: "Need attention"
                      },
                      {
                        title: "Total Discount",
                        value: `₹${Math.abs(totalDiscount).toLocaleString()}`,
                        icon: <AlertTriangle className="text-info" size={24} />,
                        subtitle: "Savings applied"
                      },
                      {
                        title: "Total Tax",
                        value: `₹${(totalCGST + totalSGST).toLocaleString()}`,
                        icon: <DollarSign className="text-success" size={24} />,
                        subtitle: "GST collected"
                      },
                      {
                        title: "Total Items",
                        value: totalItems,
                        icon: <CheckCircle className="text-primary" size={24} />,
                        subtitle: "Items served"
                      },
                      {
                        title: "Total Tables",
                        value: new Set(orders.map(o => o.table)).size,
                        icon: <Printer className="text-warning" size={24} />,
                        subtitle: "Tables used"
                      },
                    ].map((item, idx) => (
                      <Col xl={3} lg={6} md={12} className="metric-card" key={idx}>
                        <Card className="h-100 border-0 shadow-sm">
                          <Card.Body className="card-body-compact d-flex align-items-center">
                            <div className="flex-shrink-0 me-3">
                              <div className="p-3 rounded-circle bg-light">
                                {item.icon}
                              </div>
                            </div>
                            <div className="flex-grow-1">
                              <div className="text-muted mb-1">{item.title}</div>
                              <h4 className="fw-bold text-dark mb-0">{item.value}</h4>
                              <p className="text-muted mb-0 small">{item.subtitle}</p>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                  <Row className="payment-section">
                    <Col md={8}>
                      <Card className="h-100 border-0 shadow-sm">
                        <Card.Header className="bg-white border-0 header-compact">
                          <h6 className="mb-0 fw-bold">Payment Details</h6>
                        </Card.Header>
                        <Card.Body className="p-2">
                          <div className="chart-container">
                            <Pie data={paymentData} options={paymentOptions} />
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                    <Col md={4}>
                      <Card className="h-100 border-0 shadow-sm">
                        <Card.Header className="bg-white border-0 header-compact">
                          <h6 className="mb-0 fw-bold">Quick Stats</h6>
                        </Card.Header>
                        <Card.Body className="stats-container">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span>Settled Orders</span>
                            <Badge bg="success" className="fs-5">{summary.completed}</Badge>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span>Pending Orders</span>
                            <Badge bg="warning" className="fs-5">{summary.pending}</Badge>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <span>Cancelled Orders</span>
                            <Badge bg="danger" className="fs-5">{summary.cancelled}</Badge>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
                </div>
              </Tab>
              
              <Tab
                eventKey="orders"
                title={
                  <span className="d-flex align-items-center">
                    <Eye size={14} className="me-1" />
                    Orders Detail
                  </span>
                }
              >
                <div className="p-0">
                  {/* Filters */}
                  <Card className="mb-1 border-0 shadow-sm bg-light">
                    <Card.Body className="filters-section">
                      <Row className="g-2 align-items-center">
                        <Col md={3}>
                          <InputGroup size="sm">
                            <InputGroup.Text>
                              <Search size={14} />
                            </InputGroup.Text>
                            <Form.Control
                              placeholder="Search orders, tables, waiters..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              size="sm"
                            />
                          </InputGroup>
                        </Col>
                        <Col md={3}>
                          <Form.Select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            size="sm"
                          >
                            <option value="all">All Status</option>
                            <option value="settled">Settled</option>
                            <option value="pending">Pending</option>
                          </Form.Select>
                        </Col>
                        <Col md={3} className="ms-auto">
                          <div className="d-flex gap-1 justify-content-end">
                            <Button variant="outline-primary" size="sm">
                              <Filter size={14} className="me-1" />
                              Filter
                            </Button>
                            <Button variant="outline-secondary" size="sm" onClick={exportOrdersToExcel}>
                              <Download size={14} className="me-1" />
                              Export
                            </Button>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>

                  {/* Orders Table */}
                  <Card className="border-0 shadow-sm mb-0">
                    <Card.Body className="p-0">
                      <div className="table-container">
                        <Table hover className="mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Bill No</th>
                              <th>Table</th>
                              <th>Settel Amt</th>
                              <th>Gross Amount</th>
                              <th>Discount</th>
                              <th>Total Amt</th>
                              <th>Tip Amount</th>
                              <th>TaxableValue</th>
                              <th>CGST</th>
                              <th>SGST</th>
                              <th>Round off</th>
                              <th>Payment Type</th>
                              {visiblePaymentModes.map(mode => (
                                <th key={mode.id}>{mode.mode_name}</th>
                              ))}
                              <th>Rev Amt</th>
                              <th>KOT No</th>
                              <th>Rev KOT No</th>
                              <th>NC Name</th>
                              <th>NC Purpose</th>
                              <th>isNCKOT</th>
                              <th>Outlet ID</th>
                              <th>Waiter</th>
                              <th>Reverse Bill</th>
                              <th>Captain</th>
                              <th>User</th>
                              <th>Total Items</th>
                              <th>Time</th>
                              <th>Date</th>
                              <th>Status</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredOrders.map((order, idx) => {
                               const formattedTime = getFormattedTimeFromDateTime(order.billedDate || order.time);
                              const formattedDate = getFormattedDate(order.date);
                              const rowClasses = ['table-row-compact'];
                              if (order.discount > 0) {
                                rowClasses.push('table-row-discount');
                              }
                              if (order.ncKot) {
                                rowClasses.push('table-row-nckot');
                              }
                              if (order.reverseBill == 1) {
                                rowClasses.push('table-row-reversed');
                              }
                              return (
                                <tr key={idx} className={rowClasses.join(' ')}>
                                  <td className="fw-semibold">{order.orderNo}</td>
                                  <td>
                                    <Badge bg="light" text="dark" className="fs-6">
                                      {order.table}
                                    </Badge>
                                  </td>
                                  <td style={{ textAlign: 'right' }}>₹{(order.settlementAmount || 0).toLocaleString()}</td>
                                  <td className="fw-semibold" style={{ textAlign: 'right' }}>₹{(order.grossAmount || 0).toLocaleString()}</td>
                                  <td style={{ textAlign: 'right' }}>-₹{order.discount.toLocaleString()}</td>
                                  <td style={{ textAlign: 'right' }}>₹{order.amount.toLocaleString()}</td>
                                  <td style={{ textAlign: 'right' }}>₹{(order.tip || 0).toLocaleString()}</td>
                                  <td style={{ textAlign: 'right' }}>₹{(order.taxableValue || 0).toLocaleString()}</td>
                                  <td style={{ textAlign: 'right' }}>₹{order.cgst.toLocaleString()}</td>
                                  <td style={{ textAlign: 'right' }}>₹{order.sgst.toLocaleString()}</td>
                                  <td style={{ textAlign: 'right' }}>₹{(order.roundOff || 0).toLocaleString()}</td>
                                  <td title={order.paymentType || ''} style={{ whiteSpace: 'normal', wordWrap: 'break-word', overflowWrap: 'break-word' }}>{order.paymentType || ''}</td>
                                  {visiblePaymentModes.map(mode => (
                                    <td key={mode.id} style={{ textAlign: 'right' }}>
                                      ₹{getPaymentAmount(order, mode.mode_name).toLocaleString()}
                                    </td>
                                  ))}
                                  <td style={{ textAlign: 'right' }}>₹{(order.revAmt || 0).toLocaleString()}</td>
                                  <td><small className="text-muted">{order.kotNo}</small></td>
                                  <td><small className="text-muted">{order.revKotNo ? order.revKotNo.split(',').map(kot => kot.trim()).join(', ') : ''}</small></td>
                                  <td>{order.ncName || ''}</td>
                                  <td title={order.ncPurpose || ''} style={{ whiteSpace: 'normal' }}>{order.ncPurpose || ''}</td>
                                  <td style={{ textAlign: 'center' }}><Badge bg={order.ncKot ? "primary" : "secondary"} className="fs-6">{order.ncKot ? 'Yes' : 'No'}</Badge></td>
                                  <td>{order.outletid}</td>
                                  <td>{order.captain || order.waiter || ''}</td>
                                  <td style={{ textAlign: 'right' }}>{order.reverseBill == 1 ? `₹${(order.revAmt || 0).toLocaleString()}` : 'No'}</td>
                                  <td>{order.captain || order.waiter || ''}</td>
                                  <td>{order.user || ''}</td>
                                  <td style={{ textAlign: 'center' }}><Badge bg="outline-primary" text="primary" className="fs-6">{order.items}</Badge></td>
                                  <td><small className="text-muted">{formattedTime}</small></td>
                                  <td><small className="text-muted">{formattedDate}</small></td>
                                  <td style={{ textAlign: 'center' }}><StatusBadge status={order.status} /></td>
                                  <td style={{ textAlign: 'center' }}>
                                    <Button variant="outline-primary" size="sm" onClick={() => handleViewDetails(order)} className="p-1">
                                      <Eye size={12} />
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="table-success">
                              <td>Total</td>
                              <td></td>
                              <td style={{ textAlign: 'right' }}>₹{totalSettlement.toLocaleString()}</td>
                              <td style={{ textAlign: 'right' }}>₹{totalGrossAmount.toLocaleString()}</td>
                              <td style={{ textAlign: 'right' }}>-₹{totalDiscount.toLocaleString()}</td>
                              <td style={{ textAlign: 'right' }}>₹{totalSales.toLocaleString()}</td>
                              <td style={{ textAlign: 'right' }}>₹{totalTip.toLocaleString()}</td>
                              <td style={{ textAlign: 'right' }}>₹{totalTaxableValue.toLocaleString()}</td>
                              <td style={{ textAlign: 'right' }}>₹{totalCGST.toLocaleString()}</td>
                              <td style={{ textAlign: 'right' }}>₹{totalSGST.toLocaleString()}</td>
                              <td style={{ textAlign: 'right' }}>₹{totalRoundOff.toLocaleString()}</td>
                              <td></td>
                              {visiblePaymentModes.map(mode => (
                                <td key={mode.id} style={{ textAlign: 'right' }}>
                                  ₹{(paymentModeTotals[mode.mode_name] || 0).toLocaleString()}
                                </td>
                              ))}
                              <td style={{ textAlign: 'right' }}>₹{totalRevAmt.toLocaleString()}</td>
                              <td></td>
                              <td></td>
                              <td></td>
                              <td></td>
                              <td style={{ textAlign: 'center' }}>{orders.filter(o => o.ncKot).length}</td>
                              <td></td>
                              <td></td>
                              <td></td>
                              <td></td>
                              <td></td>
                              <td style={{ textAlign: 'center' }}>{totalItems}</td>
                              <td></td>
                              <td></td>
                              <td></td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </Table>
                      </div>
                    </Card.Body>
                  </Card>

                  <Card
                    className="shadow-sm border-0 mt-4"
                    style={{
                      backgroundColor: "#f1f3f5",
                      padding: "12px 16px",
                      minHeight: "70px",
                      borderRadius: "8px",
                    }}
                  >
                    <div className="d-flex align-items-center flex-wrap gap-3">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-semibold text-secondary small">Day End By:</span>
                        <Form.Control
                          type="text"
                          placeholder="Enter name"
                          value={DayEndBy}
                          readOnly
                          size="sm"
                          style={{ width: "140px" }}
                        />
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={handleOpenCashModal}
                          style={{ minWidth: "150px" }}
                        >
                          Cash Denomination
                        </Button>
                      </div>
                      <div className="ms-auto d-flex align-items-center gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleOpenReportModal}
                        >
                          <Printer size={14} className="me-1" />
                          Report
                        </Button>
                        <Button variant="secondary" size="sm" onClick={handleClose}>
                          Close
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              </Tab>
            </Tabs>
          </div>

          {/* Order Details Modal */}
          <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" className="modal-compact">
            <Modal.Header closeButton className="py-1">
              <Modal.Title className="small">Order Details - {selectedOrder?.orderNo}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-1">
              {selectedOrder && (
                <>
                  <Row className="g-2 small">
                    <Col md={6}><strong>Bill No:</strong> {selectedOrder.orderNo}</Col>
                    <Col md={6}><strong>Outlet ID:</strong> {selectedOrder.outletid}</Col>
                    <Col md={6}><strong>Table:</strong> {selectedOrder.table}</Col>
                    <Col md={6}><strong>Total Amount:</strong> ₹{selectedOrder.amount.toLocaleString()}</Col>
                    <Col md={6}><strong>Discount:</strong> ₹{selectedOrder.discount.toLocaleString()}</Col>
                    <Col md={6}><strong>Gross Amount:</strong> ₹{(selectedOrder.grossAmount || 0).toLocaleString()}</Col>
                    <Col md={6}><strong>Tip Amount:</strong> ₹{(selectedOrder.tip || 0).toLocaleString()}</Col>
                    <Col md={6}><strong>Settlement Amount:</strong> ₹{(selectedOrder.settlementAmount || 0).toLocaleString()}</Col>
                    <Col md={6}><strong>CGST:</strong> ₹{selectedOrder.cgst.toLocaleString()}</Col>
                    <Col md={6}><strong>SGST:</strong> ₹{selectedOrder.sgst.toLocaleString()}</Col>
                    <Col md={6}><strong>Round off:</strong> ₹{(selectedOrder.roundOff || 0).toLocaleString()}</Col>
                    <Col md={6}><strong>Rev Amt:</strong> ₹{(selectedOrder.revAmt || 0).toLocaleString()}</Col>
                    <Col md={6}><strong>KOT No:</strong> {selectedOrder.kotNo}</Col>
                    <Col md={6}><strong>Reverse KOT No:</strong> <div>{selectedOrder?.revKotNo ? selectedOrder.revKotNo.split(',').map(kot => kot.trim()).join(', ') : ''}</div></Col>
                    <Col md={6}><strong>Reverse Bill:</strong> {selectedOrder.reverseBill || ''}</Col>
                    <Col md={6}><strong>Water:</strong> ₹{(selectedOrder.water || 0).toLocaleString()}</Col>
                    <Col md={6}><strong>Captain:</strong> {selectedOrder.captain || selectedOrder.waiter || ''}</Col>
                    <Col md={6}><strong>User:</strong> {selectedOrder.user || ''}</Col>
                    <Col md={6}><strong>Total Items:</strong> {selectedOrder.items}</Col>
                  <Col md={6}><strong>Time:</strong> {getFormattedTimeFromDateTime(selectedOrder.billedDate)}</Col>
                    <Col md={6}><strong>Date:</strong> {getFormattedDate(selectedOrder.time)}</Col>
                    <Col md={6}><strong>Payment:</strong> {selectedOrder.type}</Col>
                    <Col md={6}><strong>Status:</strong> <StatusBadge status={selectedOrder.status} /></Col>
                    <Col md={12}><hr className="my-1" /></Col>
                    <Col md={12}><strong>Payment Breakdown:</strong></Col>
                    <Col md={6}><strong>Payment Type:</strong> {selectedOrder.paymentType || ''}</Col>
                    {paymentModes.map(mode => (
                      <Col md={6} key={mode.id}><strong>{mode.mode_name}:</strong> ₹{getPaymentAmount(selectedOrder, mode.mode_name).toLocaleString()}</Col>
                    ))}
                  </Row>
                  <Col md={12}>
                    <hr className="my-1" />
                    <strong>Order Summary:</strong>
                    <div className="mt-1 p-2 bg-light rounded small">
                      <div className="d-flex justify-content-between"><span>Total Amount:</span><strong>₹{selectedOrder.amount}</strong></div>
                      <div className="d-flex justify-content-between"><span>Number of Items:</span><span>{selectedOrder.items}</span></div>
                    </div>
                  </Col>
                </>
              )}
            </Modal.Body>
            <Modal.Footer className="p-1"></Modal.Footer>
          </Modal>

          {/* Cash Denomination Modal */}
          <Modal
            show={showCashModal}
            onHide={handleCloseCashModal}
            size="sm"
            centered
            backdrop="static"
            className="cash-denom-modal"
          >
            <Modal.Header closeButton className="bg-light py-2 border-bottom">
              <Modal.Title className="fs-6 fw-semibold text-dark">💵 Cash Denomination Entry</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto', padding: '1rem' }}>
              <div className="cash-denom-list">
                {Object.entries(cashDenominations).map(([denomStr, count]) => {
                  const denom = parseInt(denomStr);
                  const amount = denom * (count as number);
                  return (
                    <div key={denom} className="d-flex justify-content-between align-items-center border rounded p-2 mb-2 bg-white shadow-sm">
                      <span className="fw-semibold text-primary fs-6">₹{denom}</span>
                      <Form.Control
                        type="number"
                        size="sm"
                        min={0}
                        value={count}
                        onChange={(e) => handleCountChange(denom, parseInt(e.target.value) || 0)}
                        className="text-center mx-3"
                        style={{ width: '80px' }}
                      />
                      <span className="fw-semibold text-success">₹{amount.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            </Modal.Body>
            <div className="px-4 pb-2 border-top bg-light">
              <div className="d-flex justify-content-between py-1"><span className="fw-bold text-dark">Total Cash:</span><span className="fw-semibold text-success">₹{countedCashTotal.toLocaleString()}</span></div>
              <div className="d-flex justify-content-between py-1"><span className="fw-bold text-dark">Total Cash Expected:</span><span className="fw-semibold text-primary" title="Total cash from all settled orders">₹{totalCash.toLocaleString()}</span></div>
              <div className="d-flex justify-content-between py-1 border-top mt-1"><span className="fw-bold text-dark">Surplus / Deficit:</span><span className={`fw-bold ${countedCashTotal - totalCash >= 0 ? 'text-success' : 'text-danger'}`}>₹{(countedCashTotal - totalCash).toLocaleString()}</span></div>
              <div className="mt-3">
                <Form.Group controlId="reason">
                  <Form.Label className="fw-semibold text-secondary small mb-1">Reason (if Surplus / Deficit)</Form.Label>
                  <Form.Control as="textarea" rows={2} placeholder="Enter reason..." value={reason} onChange={(e) => setReason(e.target.value)} />
                </Form.Group>
              </div>
            </div>
            <Modal.Footer className="border-0 pt-0">
              <Button variant="success" size="sm" onClick={handleSaveCashDenomination} disabled={!reason && countedCashTotal !== totalCash}>💾 Save</Button>
              <Button variant="outline-secondary" size="sm" onClick={handleCloseCashModal}>✖ Close</Button>
            </Modal.Footer>
          </Modal>

          {/* Report Selection Modal */}
          <Modal show={showReportModal} onHide={() => setShowReportModal(false)} centered size="sm">
            <Modal.Header closeButton className="border-0 pb-0">
              <Modal.Title className="fw-bold text-primary">Select Reports</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-3">
              <div className="mb-3">
                <InputGroup>
                  <InputGroup.Text><Calendar size={16} /></InputGroup.Text>
                  <Form.Control type="date" value={reportDate} onChange={(e) => setReportDate(e.target.value)} />
                </InputGroup>
              </div>
              <div>
                <div className="fw-semibold mb-2">Choose Reports</div>
                <Form.Check type="checkbox" className="report-checkbox" label={<><FileText size={16} className="report-icon" /> Bill Details</>} checked={selectedReports.billDetails} onChange={(e) => setSelectedReports(prev => ({ ...prev, billDetails: e.target.checked }))} />
                <Form.Check type="checkbox" className="report-checkbox" label={<><CreditCard size={16} className="report-icon" /> Credit Summary</>} checked={selectedReports.creditSummary} onChange={(e) => setSelectedReports(prev => ({ ...prev, creditSummary: e.target.checked }))} />
                <Form.Check type="checkbox" className="report-checkbox" label={<><DollarSign size={16} className="report-icon" /> Payment Summary</>} checked={selectedReports.paymentSummary} onChange={(e) => setSelectedReports(prev => ({ ...prev, paymentSummary: e.target.checked }))} />
                <Form.Check type="checkbox" className="report-checkbox" label={<><Tag size={16} className="report-icon" /> Discount Summary</>} checked={selectedReports.discountSummary} onChange={(e) => setSelectedReports(prev => ({ ...prev, discountSummary: e.target.checked }))} />
                <Form.Check type="checkbox" className="report-checkbox" label={<><RefreshCw size={16} className="report-icon" /> Reverse KOTs Summary</>} checked={selectedReports.reverseKOTSummary} onChange={(e) => setSelectedReports(prev => ({ ...prev, reverseKOTSummary: e.target.checked }))} />
                <Form.Check type="checkbox" className="report-checkbox" label={<><RefreshCw size={16} className="report-icon" /> Reverse Bill Summary</>} checked={selectedReports.reverseBillSummary} onChange={(e) => setSelectedReports(prev => ({ ...prev, reverseBillSummary: e.target.checked }))} />
                <Form.Check type="checkbox" className="report-checkbox" label={<><BarChart size={16} className="report-icon" /> NC KOT Sales Summary</>} checked={selectedReports.ncKOTSummary} onChange={(e) => setSelectedReports(prev => ({ ...prev, ncKOTSummary: e.target.checked }))} />
              </div>
            </Modal.Body>
            <Modal.Footer className="border-0 pt-0">
              <Button variant="secondary" onClick={() => setShowReportModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleGenerateReports}>Generate Reports</Button>
            </Modal.Footer>
          </Modal>
        </Container>
      ) : (
        <HandoverPasswordModal
          show={showPasswordModal}
          onVerify={handlePasswordVerify}
          onSuccess={() => setShowPasswordModal(false)}
          onCancel={() => navigate('/apps/Orders')}
        />
      )}
    </>
  );
};

export default DayEnd;