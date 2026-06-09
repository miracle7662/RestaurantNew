import { useState, useEffect } from "react";
import toast from "react-hot-toast";

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
import HandoverPasswordModal from "../../../components/HandoverPasswordModal.tsx";
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
  taxableValue?: number;
  billedDate?: string;
}


// Mapping from payment mode name to the field in Order object
// const PAYMENT_FIELD_MAP: Record<string, keyof Order> = {
//   'Cash': 'cash',
//   'Card': 'card',
//   'GPay': 'gpay',
//   'PhonePe': 'phonepe',
//   'QR Code': 'qrcode',
//   'Credit': 'credit'
// };

const DayEnd = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
 
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState("summary");
  
  const [DayEndBy, ] = useState(user?.username || "");
  const [orders, setOrders] = useState<Order[]>([]);
  const [, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
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
  const [reportDate, setReportDate] = useState(`${yyyy}-${mm}-${dd}`);
  const [selectedReports, setSelectedReports] = useState({
    billDetails: true,
    creditSummary: true,
    paymentSummary: true,
    discountSummary: true,
    reverseKOTSummary: true,
    reverseBillSummary: true,
    ncKOTSummary: true,
  });

  // Payment modes state (using PaymentModeData from service)
  const [paymentModes, setPaymentModes] = useState<PaymentModeData[]>([]);

  // Fetch payment modes for the outlet
  useEffect(() => {
    const fetchPaymentModes = async () => {
      if (!user?.outletid) return;
      try {
        const response = await OutletPaymentModeService.list({ outletid: user.outletid.toString() });
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
        console.log('DayEnd getDayendData => using user.currDate:', (user as any)?.currDate, 'reportDate:', reportDate);
        const response = await DayendService.getDayendData({
          outletid: user?.outletid ? Number(user.outletid) : undefined,
          hotelid: user?.hotelid ? Number(user.hotelid) : undefined,
          // If user context has business curr_date, it should match backend businessDate
          date: (user as any)?.currDate || reportDate || undefined,
        });
        if (!response.success) {
          throw new Error('Network response was not ok');
        }
        
        if (response.success) {
          console.log("Fetched orders data:", response.data.orders);
          console.log("RevKOT numbers in orders:", response.data.orders.map((order: any) => order.revKotNo));
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
  }, []);

  useEffect(() => {
    if (user && !passwordVerified) {
      setShowPasswordModal(true);
    }
  }, [user, passwordVerified]);

  // Helper to get payment amount for a given order and payment mode
const getPaymentAmount = (order: any, modeName: string): number => {

  console.log("================================");

  const normalizedMode = modeName.trim().toLowerCase();

  const paymentKey = Object.keys(order.payments || {}).find(
    key => key.trim().toLowerCase() === normalizedMode
  );

  console.log("Mode Name:", modeName);
  console.log("Matched Key:", paymentKey);
  console.log("Payments Object:", order.payments);

  if (paymentKey) {
    console.log("Final Amount:", order.payments[paymentKey]);
    return Number(order.payments[paymentKey]) || 0;
  }

  console.log("No payment key matched");

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
  //const totalWater = orders.reduce((sum, order) => sum + (order.water || 0), 0);
  const totalItems = orders.reduce((sum, order) => sum + order.items, 0);
  const totalCash = orders.reduce((sum, order) => sum + (order.cash || 0), 0);
  // const totalCredit = orders.reduce((sum, order) => sum + (order.credit || 0), 0);
  // const totalCard = orders.reduce((sum, order) => sum + (order.card || 0), 0);
  // const totalGpay = orders.reduce((sum, order) => sum + (order.gpay || 0), 0);
  // const totalPhonepe = orders.reduce((sum, order) => sum + (order.phonepe || 0), 0);
  // const totalQrcode = orders.reduce((sum, order) => sum + (order.qrcode || 0), 0);
  const totalTip = orders.reduce((sum, order) => sum + (order.tip || 0), 0);
  const totalTaxableValue = orders.reduce((sum, order) => sum + (order.taxableValue || 0), 0);


  const totalSettlement = orders.reduce((sum, order) => sum + (order.settlementAmount || 0), 0);


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

  // Dynamic payment methods for pie chart based on fetched payment modes
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
     order.table.toString().toLowerCase()
  .includes(searchTerm.toLowerCase()) ||
      (order.waiter || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.captain || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.user || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesDayEnd = !showOnlyNotDayEnded || (order.isDayEnd === 0 || order.isDayEnd == null);
    return matchesSearch && matchesStatus && matchesDayEnd;
  });

  // Compute totals for each payment mode based on filteredOrders
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

  const handleSaveDayEnd = async () => {
    if (orders.length === 0) {
      toast.error("No orders to process for Day-End.");
      return;
    }

    const payload = {
      dayend_total_amt: totalSales,
      outlet_id: orders[0]?.outletid || user?.outletid,
      hotel_id: user?.hotelid,
      created_by_id: user?.id,
    };

    console.log("Frontend sending payload:", payload);

    try {
      const response = await DayendService.saveDayEnd(payload);
      console.log("Backend response:", response);
      if (response.success) {
        toast.success(response.message || "✅ Day-End saved successfully!");
        setOrders([]);
        if (response.data?.dayend_date) {
          setReportDate(response.data.dayend_date);
        }
        setShowReportModal(true);
        return;
      }
      if (response.data?.pendingTables?.length) {
        const tableNames = response.data.pendingTables
          .map((t: any) => (typeof t === "string" ? t : t.name || t.id))
          .join(", ");
        toast.error(
          `🪑 ${response.message || "Pending Tables"}: ${tableNames}`,
          { duration: 8000 }
        );
        return;
      }
      toast.error(response.message || "❌ Day-End failed!");
    } catch (error) {
      console.error("Error saving day-end:", error);
      toast.error("⚠️ An error occurred while saving Day-End. Please try again.");
    }
  };

  const handleClose = () => {
    if (window.confirm("Are you sure you want to close without saving?")) {
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
      if (!response || !response.success ) {
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
      const response = await OrderService.verifyDayendHandoverPassword(password);
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

// DayEnd.tsx में handleGenerateReports फंक्शन को ठीक करें

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
    
    const payload = {
      DayEndEmpID: user.id,
      businessDate: reportDate,
      selectedReports: selectedReportKeys,
    };
    
    console.log('🔍 Report payload:', payload);
    const response = await DayendService.generateReportHTML(payload);
    console.log('📄 API Response:', response);
    
    if (response.success) {
      // ✅ FIX: Store the data object (not HTML)
      if (response.data) {
        console.log('💾 Storing report data:', response.data);
        sessionStorage.setItem('dayEndReportData', JSON.stringify(response.data));
        sessionStorage.setItem('dayEndReportDate', reportDate);
        
        // ✅ Verify storage
       const saved = sessionStorage.getItem('dayEndReportData');

const reportData = saved
  ? JSON.parse(saved)
  : {};

console.log('Loaded Report Data:', reportData);
        console.log('✅ Verified saved data length:', saved?.length);
        
        toast.success('✅ Report generated! Opening preview...');
        navigate('/apps/Masters/Reports/DayEndReportPreview');
      } else {
        console.error('❌ No data in response:', response);
        toast.error('No report data received from server');
      }
    } else {
      toast.error(response.message || "Failed to generate reports.");
    }
  } catch (error) {
    console.error('Error generating reports:', error);
    toast.error("An error occurred while generating reports.");
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



  const [reason, setReason] = useState('');
  const countedCashTotal = Object.entries(cashDenominations).reduce(
    (sum, [denom, count]) => sum + parseInt(denom) * count,
    0
  );

  return (
    <div>
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
            <Row>
              <Col>
                <h5 className="fw-bold text-primary mb-0">Day End</h5>
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
                          <Button variant="outline-secondary" size="sm">
                            <Download size={14} className="me-1" />
                            Export
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
                {/* Orders Table - dynamic payment columns */}
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
                  {/* Dynamic payment mode columns */}
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
                                {/* Dynamic payment amount cells */}
                                {visiblePaymentModes.map(mode => (
                                  <td key={mode.id} style={{ textAlign: 'right' }}>
                                    ₹{getPaymentAmount(order, mode.mode_name).toLocaleString()}
                                  </td>
                                ))}
                                   <td style={{ textAlign: 'right' }}>₹{(order.revAmt || 0).toLocaleString()}</td>
                                <td><small className="text-muted">{order.kotNo}</small></td>
                                <td><small className="text-muted">{order.revKotNo ? order.revKotNo.split(',').map(kot => kot.trim()).join(', ') : ''}</small></td>
                                <td>{order.ncName || ''}</td>
                                <td title={order.ncPurpose || ''} style={{whiteSpace:'normal'}}>{order.ncPurpose || ''}</td>
                                <td style={{textAlign:'center'}}><Badge bg={order.ncKot ? "primary" : "secondary"} className="fs-6">{order.ncKot ? 'Yes' : 'No'}</Badge></td>
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
                            {/* Dynamic payment totals */}
                            {visiblePaymentModes.map(mode => (
                              <td key={mode.id} style={{ textAlign: 'right' }}>
                                ₹{(paymentModeTotals[mode.mode_name] || 0).toLocaleString()}
                              </td>
                            ))}

                            
                             <td style={{ textAlign: 'right' }}>₹{totalRevAmt.toLocaleString()}</td>
                            <td></td><td></td><td></td><td></td>
                            <td style={{ textAlign: 'center' }}>{orders.filter(o => o.ncKot).length}</td>
                            <td></td>
                            <td></td>
                            {/* <td style={{ textAlign: 'right' }}>₹{totalWater.toLocaleString()}</td> */}
                            {/* <td></td> */}
                            <td></td>
                            <td></td>
                            <td></td>
                            <td style={{ textAlign: 'center' }}>{totalItems}</td>
                            <td></td><td></td><td></td><td></td>
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
                      <Button variant="success" size="sm" onClick={handleSaveDayEnd}>
                        DayEnd
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

        {/* Order Details Modal - dynamic payment breakdown */}
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
                  {/* Dynamic payment breakdown in modal */}
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

        {/* Cash Denomination Modal - unchanged */}
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
                const amount = denom * count;
                return (
                  <div key={denom} className="d-flex justify-content-between align-items-center border rounded p-2 mb-2 bg-white shadow-sm">
                    <span className="fw-semibold text-primary fs-6">{denom}</span>
                    <Form.Control
                      type="number"
                      size="sm"
                      min={0}
                      value={count}
                      onChange={(e) => handleCountChange(denom, parseInt(e.target.value) || 0)}
                      className="text-center mx-3"
                      style={{ width: '80px' }}
                    />
                    <span className="fw-semibold text-success">{amount.toLocaleString()}</span>
                  </div>
                );
              })}
            </div>
          </Modal.Body>
          <div className="px-4 pb-2 border-top bg-light">
            <div className="d-flex justify-content-between py-1"><span className="fw-bold text-dark">Total Cash:</span><span className="fw-semibold text-success">{countedCashTotal.toLocaleString()}</span></div>
            <div className="d-flex justify-content-between py-1"><span className="fw-bold text-dark">Total Cash Expected:</span><span className="fw-semibold text-primary" title="Total cash from all settled orders">{totalCash.toLocaleString()}</span></div>
            <div className="d-flex justify-content-between py-1 border-top mt-1"><span className="fw-bold text-dark">Surplus / Deficit:</span><span className={`fw-bold ${countedCashTotal - totalCash >= 0 ? 'text-success' : 'text-danger'}`}>{(countedCashTotal - totalCash).toLocaleString()}</span></div>
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

        {/* Report Selection Modal - unchanged */}
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
          // onCancel={() => navigate('/apps/Orders')}
          onCancel={() => navigate('/')}
        />
      )}
    </div>
  );
};
export default DayEnd;