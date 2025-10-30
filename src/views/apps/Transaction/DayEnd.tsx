import  { useState, useEffect } from "react";
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
  DollarSign
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

ChartJS.register(ArcElement, Tooltip, Legend);

interface Order {
  orderNo: string;
  table: string;
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
  ncName: string;
  cgst: number;
  sgst: number;
  grossAmount: number;
  roundOff: number;
  revAmt: number;
  reverseBill: number | string; // Can be 0/1 from DB
  water: number;
  captain: string;
  user: string;
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
}

const DayEnd = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();
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
  const [showOnlyNotDayEnded, setShowOnlyNotDayEnded] = useState(false);


  useEffect(() => {
    const fetchdayendData = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/dayend/data');
        if (!response.ok) {
          throw new Error('Failed to fetch dayend data');
        }
        const data = await response.json();
        if (data.success) {
          console.log("Fetched orders data:", data.data.orders); // Debug log to check revKotNo presence
          console.log("RevKOT numbers in orders:", data.data.orders.map((order: any) => order.revKotNo));
          setOrders(data.data.orders);
        } else {
          throw new Error(data.message || 'Failed to fetch data');
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
    if (user && !passwordVerified) { // Only show modal if user is loaded AND password is not verified
      setShowPasswordModal(true);
    }
  }, [user, passwordVerified]); // Add user to dependency array

  // Computed summary from orders
  const totalOrders = orders.length;
  const totalKOTs = orders.length;
  const totalSales = orders.reduce((sum, order) => sum + order.amount, 0);
  // Correctly calculate total cash, card, and UPI from the detailed breakdown
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
  const totalWater = orders.reduce((sum, order) => sum + (order.water || 0), 0);
  const totalItems = orders.reduce((sum, order) => sum + order.items, 0);
  const totalCash = orders.reduce((sum, order) => sum + (order.cash || 0), 0);
  const totalCredit = orders.reduce((sum, order) => sum + (order.credit || 0), 0);
  const totalCard = orders.reduce((sum, order) => sum + (order.card || 0), 0);
  const totalGpay = orders.reduce((sum, order) => sum + (order.gpay || 0), 0);
  const totalPhonepe = orders.reduce((sum, order) => sum + (order.phonepe || 0), 0);
  const totalQrcode = orders.reduce((sum, order) => sum + (order.qrcode || 0), 0);


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

  const paymentMethods = [
    { type: "Cash", amount: summary.cash, percentage: totalSales > 0 ? ((summary.cash / totalSales) * 100).toFixed(1) : "0" },
    { type: "Card", amount: summary.card, percentage: totalSales > 0 ? ((summary.card / totalSales) * 100).toFixed(1) : "0" },
    { type: "UPI", amount: summary.upi, percentage: totalSales > 0 ? ((summary.upi / totalSales) * 100).toFixed(1) : "0" },

  ];

  const [reason, setReason] = useState('');
  // This is the total cash calculated from the denominations entered in the modal.
  const countedCashTotal = Object.entries(cashDenominations).reduce(
    (sum, [denom, count]) => sum + parseInt(denom) * count,
    0
  );


  const paymentData = {
    labels: paymentMethods.map(pm => pm.type),
    datasets: [{
      label: 'Payment Breakdown',
      data: paymentMethods.map(pm => pm.amount),
      backgroundColor: [
        'rgba(75, 192, 192, 0.2)',  // Cash
        'rgba(255, 99, 132, 0.2)',  // Card
        'rgba(54, 162, 235, 0.2)',  // GPay
        'rgba(153, 102, 255, 0.2)', // PhonePe
        'rgba(255, 159, 64, 0.2)',  // QR Code
        'rgba(255, 206, 86, 0.2)'   // Other UPI
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
      (order.table || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.waiter || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.captain || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.user || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesDayEnd = !showOnlyNotDayEnded || (order.isDayEnd === 0 || order.isDayEnd == null);
    return matchesSearch && matchesStatus && matchesDayEnd;
  });

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
    const response = await fetch('http://localhost:3001/api/dayend/save-dayend', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user?.token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    console.log("Backend response:", data);

    if (response.ok && data.success) {
      toast.success(data.message || "✅ Day-End saved successfully!");
    } else {
      // Backend may return pending table info
      toast.error(data.message || "❌ Day-End failed!");

      if (data.pendingTables?.length) {
        toast(`⚠️ Pending Tables: ${data.pendingTables.join(", ")}`, {
          icon: "🪑",
          duration: 5000,
        });
      }
    }
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


  const handleSaveCashDenomination = () => {
    const payload = {
      denominations: cashDenominations,
      total: countedCashTotal,
      expected: totalCash, // totalCash from sales is the expected amount
      difference: countedCashTotal - totalCash,
      reason: reason,
      DayEndBy: DayEndBy,
   
     
      // In a real app, you'd get the current user's ID
      userId: 1,
    };

    fetch('http://localhost:3001/api/dayend/dayend-cash-denomination', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          alert(`Day-End Cash Denomination saved successfully! Total Counted Cash: ₹${countedCashTotal.toLocaleString()}`);
          handleCloseCashModal();
        } else {
          alert(`Error: ${data.message}`);
        }
      })
      .catch(err => {
        console.error("Error saving cash denomination:", err);
        alert("An error occurred while saving. Please check the console.");
      });
  };

  const handlePasswordVerify = async (password: string): Promise<boolean> => {
    try {
      if (!user?.token) {
        console.error('Authentication token is missing for password verification.');
        // Optionally, display a user-friendly message here, e.g., toast.error('Authentication required. Please log in again.');
        return false;
      }
      const response = await fetch('http://localhost:3001/api/auth/verify-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (data.success) {
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


  const StatusBadge = ({ status }: { status: string }) => {
    const variants = {
      "Settled": "success",
      "Pending": "warning",
      "Cancelled": "danger"
    };

    return <Badge bg={variants[status as keyof typeof variants] || "secondary"}>{status}</Badge>;
  };



 const getFormattedTime = (timeStr: string) => {
  const utcDate = new Date(timeStr);
  // If invalid date, return as-is
  if (isNaN(utcDate.getTime())) return timeStr;
  // Convert to Indian Standard Time
  return utcDate.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const getFormattedDate = (dateStr: string) => {
  const dateObj = new Date(dateStr);

  if (isNaN(dateObj.getTime())) {
    return dateStr; // Return original string if date is invalid
  }

  return dateObj.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};


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
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
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
          padding: 0.25rem 0.5rem;
          font-size: 0.8rem;
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
          table-layout: fixed;
          width: 100%;
          min-width: 2400px;
          border-collapse: separate;
        }
        .table-container th,
        .table-container td {
          word-wrap: break-word;
          overflow-wrap: break-word;
          padding: 0.25rem 0.5rem;
          vertical-align: middle;
          border: 1px solid #dee2e6;
        }
        .table-container tbody td {
          font-size: 0.8rem;
        }
        .table-container .table-row-compact td {
          padding: 0.25rem 0.5rem;
        }
        .table-row-discount, .table-row-discount td {
          background-color: #fff0f1 !important; /* Light pink for discount */
          color: #721c24 !important;
        }
        .table-row-nckot, .table-row-nckot td {
          background-color: #eef0ff !important; /* Light blue for NCKOT */
          color: #2c2e43 !important;
        }
        .table-row-reversed, .table-row-reversed td {
          background-color: #f8d7da !important; /* Light red for reversed bill */
          color: #721c24 !important;
        }
        /* Specific column widths */
        .table-container th:nth-child(1),
        .table-container td:nth-child(1) { width: 10%; } /* Bill No */
        .table-container th:nth-child(2),
        .table-container td:nth-child(2) { width: 6%; } /* Table */
        .table-container th:nth-child(3),
        .table-container td:nth-child(3) { width: 10%; text-align: right; } /* Total Amount */
        .table-container th:nth-child(4),
        .table-container td:nth-child(4) { width: 8%; text-align: right; } /* Discount */
        .table-container th:nth-child(5),
        .table-container td:nth-child(5) { width: 10%; text-align: right; } /* Gross Amount */
        .table-container th:nth-child(6),
        .table-container td:nth-child(6) { width: 7%; text-align: right; } /* CGST */
        .table-container th:nth-child(7),
        .table-container td:nth-child(7) { width: 7%; text-align: right; } /* SGST */
        .table-container th:nth-child(8),
        .table-container td:nth-child(8) { width: 8%; text-align: right; } /* Round off */
        .table-container th:nth-child(9),
        .table-container td:nth-child(9) { width: 8%; text-align: right; } /* Rev Amt */
        .table-container th:nth-child(10),
        .table-container td:nth-child(10) { width: 8%; } /* KOT No */
        .table-container th:nth-child(11),
        .table-container td:nth-child(11) { width: 10%; } /* Reverse KOT No */
        .table-container th:nth-child(12),
        .table-container td:nth-child(12) { width: 9%; } /* Reverse Bill */
        .table-container th:nth-child(13),
        .table-container td:nth-child(13) { width: 7%; text-align: right; } /* Water */
        .table-container th:nth-child(14),
        .table-container td:nth-child(14) { 
          width: 15%; 
          white-space: normal; 
          word-wrap: break-word; 
          overflow-wrap: break-word; 
        } /* Payment Mode */
        .table-container th:nth-child(15),
        .table-container td:nth-child(15) { width: 8%; text-align: right; } /* Cash */
        .table-container th:nth-child(16),
        .table-container td:nth-child(16) { width: 8%; text-align: right; } /* Credit */
        .table-container th:nth-child(17),
        .table-container td:nth-child(17) { width: 8%; text-align: right; } /* Card */
        .table-container th:nth-child(18),
        .table-container td:nth-child(18) { width: 8%; text-align: right; } /* GPay */
        .table-container th:nth-child(19),
        .table-container td:nth-child(19) { width: 8%; text-align: right; } /* PhonePe */
        .table-container th:nth-child(20),
        .table-container td:nth-child(20) { width: 8%; text-align: right; } /* QR Code */
        .table-container th:nth-child(21),
        .table-container td:nth-child(21) { width: 8%; } /* Captain */
        .table-container th:nth-child(22),
        .table-container td:nth-child(22) { width: 7%; } /* User */
        .table-container th:nth-child(23),
        .table-container td:nth-child(23) { width: 7%; text-align: center; } /* Total Items */
        .table-container th:nth-child(24),
        .table-container td:nth-child(24) { width: 8%; } /* Time */
        .table-container th:nth-child(25),
        .table-container td:nth-child(25) { width: 8%; } /* Date */
        .table-container th:nth-child(26),
        .table-container td:nth-child(26) { width: 7%; text-align: center; } /* Status */
        .table-container th:nth-child(27),
        .table-container td:nth-child(27) { width: 7%; text-align: center; } /* Status */
        .table-container th:nth-child(28),
        .table-container td:nth-child(28) { width: 6%; text-align: center; } /* Actions */
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
      `}</style>
      {passwordVerified ? (
        <Container fluid className="p-0 bg-light main-container">
        {/* Header Section - Compact */}
        <Card className="mb-0 shadow-sm border-0">
          <Card.Header className="bg-white border-0 header-compact">
            <Row>
              <Col>
                <h5 className="fw-bold text-primary mb-0">Day End</h5>
              </Col>
            </Row>
          </Card.Header>
        </Card>

        {/* Tabs Navigation - Sticky */}
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
              {/* Summary Tab Content - Compact */}
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

                {/* Payment Breakdown - Compact */}
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
              {/* Orders Tab Content - Compact */}
              <div className="p-0">
                {/* Filters - Compact */}
                <Card className="mb-1 border-0 shadow-sm bg-light">
                  <Card.Body className="filters-section">
                    <Row className="g-2">
                      <Col md={6}>
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
                      <Col md={3}>
                        <div className="d-flex gap-1">
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
                      <Col md={3}>
                        <Form.Check
                          type="checkbox"
                          label="Show only not day-ended"
                          checked={showOnlyNotDayEnded}
                          onChange={(e) => setShowOnlyNotDayEnded(e.target.checked)}
                          
                        />
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Orders Table - Compact with increased height for 15 rows */}
                <Card className="border-0 shadow-sm mb-0">
                  <Card.Body className="p-0">
                    <div className="table-container">
                      <Table hover className="mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Bill No</th>
                            <th>Table</th>
                            <th>Total Amount</th>
                            <th>Discount</th>
                            <th>Gross Amount</th>
                            <th>CGST</th>
                            <th>SGST</th>
                            <th>Round off</th>
                            <th>Rev Amt</th>
                            <th>KOT No</th>
                            <th>Rev KOT No</th>
                            <th>Outlet ID</th>
                            <th>Water</th>
                            <th>Payment Type</th>
                            <th>Cash</th>
                            <th>Reverse Bill</th>
                            <th>Credit</th>
                            <th>Card</th>
                            <th>GPay</th>
                            <th>PhonePe</th>
                            <th>QR Code</th>
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
                            const formattedTime = getFormattedTime(order.time);
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
                                <td className="fw-semibold" style={{ textAlign: 'right' }}>₹{order.amount.toLocaleString()}</td>
                                <td style={{ textAlign: 'right' }}>-₹{order.discount.toLocaleString()}</td>
                                <td style={{ textAlign: 'right' }}>₹{(order.grossAmount || 0).toLocaleString()}</td>
                                <td style={{ textAlign: 'right' }}>₹{order.cgst.toLocaleString()}</td>
                                <td style={{ textAlign: 'right' }}>₹{order.sgst.toLocaleString()}</td>
                                <td style={{ textAlign: 'right' }}>₹{(order.roundOff || 0).toLocaleString()}</td>
                                <td style={{ textAlign: 'right' }}>₹{(order.revAmt || 0).toLocaleString()}</td>
                                <td>
                                  <small className="text-muted">{order.kotNo}</small>
                                </td>
                                <td>
                                  <small className="text-muted">
                                    {order.revKotNo ? order.revKotNo.split(',').map(kot => kot.trim()).join(', ') : ''}
                                  </small>
                                </td>
                                <td>{order.outletid}</td>
                                <td style={{ textAlign: 'right' }}>₹{(order.water || 0).toLocaleString()}</td>
                                <td title={order.paymentType || ''} style={{ whiteSpace: 'normal', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                                  {order.paymentType || ''}
                                </td>
                                <td style={{ textAlign: 'right' }}>₹{(order.cash || 0).toLocaleString()}</td>
                                <td style={{ textAlign: 'right' }}>
                                  {order.reverseBill == 1
                                    ? `₹${(order.revAmt || 0).toLocaleString()}` 
                                    : 'No'}
                                </td>
                                <td style={{ textAlign: 'right' }}>₹{(order.credit || 0).toLocaleString()}</td>
                                <td style={{ textAlign: 'right' }}>₹{(order.card || 0).toLocaleString()}</td>
                                <td style={{ textAlign: 'right' }}>₹{(order.gpay || 0).toLocaleString()}</td>
                                <td style={{ textAlign: 'right' }}>₹{(order.phonepe || 0).toLocaleString()}</td>
                                <td style={{ textAlign: 'right' }}>₹{(order.qrcode || 0).toLocaleString()}</td>
                                <td>{order.captain || order.waiter || ''}</td>
                                <td>{order.user || ''}</td>
                                <td style={{ textAlign: 'center' }}>
                                  <Badge bg="outline-primary" text="primary" className="fs-6">
                                    {order.items}
                                  </Badge>
                                </td>
                                <td>
                                  <small className="text-muted">{formattedTime}</small>
                                </td>
                                <td>
                                  <small className="text-muted">{formattedDate}</small>
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <StatusBadge status={order.status} />
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => handleViewDetails(order)}
                                    className="p-1"
                                  >
                                    <Eye size={12} />
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="table-success">
                            <td></td>
                            <td>Total</td>
                            <td style={{ textAlign: 'right' }}>₹{totalSales.toLocaleString()}</td>
                            <td style={{ textAlign: 'right' }}>-₹{totalDiscount.toLocaleString()}</td>
                            <td style={{ textAlign: 'right' }}>₹{totalGrossAmount.toLocaleString()}</td>
                            <td style={{ textAlign: 'right' }}>₹{totalCGST.toLocaleString()}</td>
                            <td style={{ textAlign: 'right' }}>₹{totalSGST.toLocaleString()}</td>
                            <td style={{ textAlign: 'right' }}>₹{totalRoundOff.toLocaleString()}</td>
                            <td style={{ textAlign: 'right' }}>₹{totalRevAmt.toLocaleString()}</td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td style={{ textAlign: 'right' }}>₹{totalWater.toLocaleString()}</td>
                            <td></td>
                            <td style={{ textAlign: 'right' }}>₹{totalCash.toLocaleString()}</td>
                            <td></td>
                            <td style={{ textAlign: 'right' }}>₹{totalCredit.toLocaleString()}</td>
                            <td style={{ textAlign: 'right' }}>₹{totalCard.toLocaleString()}</td>
                            <td style={{ textAlign: 'right' }}>₹{totalGpay.toLocaleString()}</td>
                            <td style={{ textAlign: 'right' }}>₹{totalPhonepe.toLocaleString()}</td>
                            <td style={{ textAlign: 'right' }}>₹{totalQrcode.toLocaleString()}</td>
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
                    backgroundColor: "#f1f3f5", // light gray shade
                    padding: "12px 16px",       // more inner space (height)
                    minHeight: "70px",          // ensure footer looks taller
                    borderRadius: "8px",
                  }}
                >
                  <div className="d-flex align-items-center flex-wrap gap-3">
                    {/* Day End By */}
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


                    {/* Cash Denomination */}
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

                    {/* Action Buttons */}
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



        {/* Order Details Modal - Compact */}
        <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" className="modal-compact">
          <Modal.Header closeButton className="py-1">
            <Modal.Title className="small">Order Details - {selectedOrder?.orderNo}</Modal.Title>
          </Modal.Header>
          <Modal.Body className="p-1">
            {selectedOrder && (
              <>
                <Row className="g-2 small">
                  <Col md={6}>
                    <strong>Bill No:</strong> {selectedOrder.orderNo}
                  </Col>
                  <Col md={6}>
                    <strong>Outlet ID:</strong> {selectedOrder.outletid}
                  </Col>
                  <Col md={6}>
                    <strong>Table:</strong> {selectedOrder.table}
                  </Col>
                  <Col md={6}>
                    <strong>Total Amount:</strong> ₹{selectedOrder.amount.toLocaleString()}
                  </Col>
                  <Col md={6}>
                    <strong>Discount:</strong> ₹{selectedOrder.discount.toLocaleString()}
                  </Col>
                  <Col md={6}>
                    <strong>Gross Amount:</strong> ₹{(selectedOrder.grossAmount || 0).toLocaleString()}
                  </Col>
                  <Col md={6}>
                    <strong>CGST:</strong> ₹{selectedOrder.cgst.toLocaleString()}
                  </Col>
                  <Col md={6}>
                    <strong>SGST:</strong> ₹{selectedOrder.sgst.toLocaleString()}
                  </Col>
                  <Col md={6}>
                    <strong>Round off:</strong> ₹{(selectedOrder.roundOff || 0).toLocaleString()}
                  </Col>
                  <Col md={6}>
                    <strong>Rev Amt:</strong> ₹{(selectedOrder.revAmt || 0).toLocaleString()}
                  </Col>
                  <Col md={6}>
                    <strong>KOT No:</strong> {selectedOrder.kotNo}
                  </Col>
                  <Col md={6}>
                    <strong>Reverse KOT No:</strong>
                    <div>
                      {selectedOrder?.revKotNo ? selectedOrder.revKotNo.split(',').map(kot => kot.trim()).join(', ') : ''}
                    </div>
                  </Col>
                  <Col md={6}>
                    <strong>Reverse Bill:</strong> {selectedOrder.reverseBill || ''}
                  </Col>
                  <Col md={6}>
                    <strong>Water:</strong> ₹{(selectedOrder.water || 0).toLocaleString()}
                  </Col>
                  <Col md={6}>
                    <strong>Captain:</strong> {selectedOrder.captain || selectedOrder.waiter || ''}
                  </Col>
                  <Col md={6}>
                    <strong>User:</strong> {selectedOrder.user || ''}
                  </Col>
                  <Col md={6}>
                    <strong>Total Items:</strong> {selectedOrder.items}
                  </Col>
                  <Col md={6}>
                    <strong>Time:</strong> {getFormattedTime(selectedOrder.time)}
                  </Col>
                  <Col md={6}>
                    <strong>Date:</strong> {getFormattedDate(selectedOrder.time)}
                  </Col>
                  <Col md={6}>
                    <strong>Payment:</strong> {selectedOrder.type}
                  </Col>
                  <Col md={6}>
                    <strong>Status:</strong> <StatusBadge status={selectedOrder.status} />
                  </Col>
                  <Col md={12}><hr className="my-1" /></Col>
                  <Col md={12}><strong>Payment Breakdown:</strong></Col>
                  <Col md={6}>
                    <strong>Payment Type:</strong> {selectedOrder.paymentType || ''}
                  </Col>
                  <Col md={6}>
                    <strong>Cash:</strong> ₹{(selectedOrder.cash || 0).toLocaleString()}
                  </Col>
                  <Col md={6}>
                    <strong>Credit:</strong> ₹{(selectedOrder.credit || 0).toLocaleString()}
                  </Col>
                  <Col md={6}>
                    <strong>Card:</strong> ₹{(selectedOrder.card || 0).toLocaleString()}
                  </Col>
                  <Col md={6}>
                    <strong>GPay:</strong> ₹{(selectedOrder.gpay || 0).toLocaleString()}
                  </Col>
                  <Col md={6}>
                    <strong>PhonePe:</strong> ₹{(selectedOrder.phonepe || 0).toLocaleString()}
                  </Col>
                  <Col md={6}><strong>QR Code:</strong> ₹{(selectedOrder.qrcode || 0).toLocaleString()}</Col>
                </Row>
                <Col md={12}>
                  <hr className="my-1" />
                  <strong>Order Summary:</strong>
                  <div className="mt-1 p-2 bg-light rounded small">
                    <div className="d-flex justify-content-between">
                      <span>Total Amount:</span>
                      <strong>₹{selectedOrder.amount}</strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span>Number of Items:</span>
                      <span>{selectedOrder.items}</span>
                    </div>
                  </div>
                </Col>
              </>
            )}
          </Modal.Body>
          <Modal.Footer className="p-1">
          </Modal.Footer>
        </Modal>

        {/* Cash Denomination Modal - Small Centered */}
        <Modal
          show={showCashModal}
          onHide={handleCloseCashModal}
          size="sm"
          centered
          backdrop="static"
          className="cash-denom-modal"
        >
          {/* Header */}
          <Modal.Header closeButton className="bg-light py-2 border-bottom">
            <Modal.Title className="fs-6 fw-semibold text-dark">
              💵 Cash Denomination Entry
            </Modal.Title>
          </Modal.Header>

          {/* Body */}
          <Modal.Body style={{ maxHeight: '60vh', overflowY: 'auto', padding: '1rem' }}>
            <div className="cash-denom-list">
              {Object.entries(cashDenominations).map(([denomStr, count]) => {
                const denom = parseInt(denomStr);
                const amount = denom * count;
                return (
                  <div
                    key={denom}
                    className="d-flex justify-content-between align-items-center border rounded p-2 mb-2 bg-white shadow-sm"
                  >
                    <span className="fw-semibold text-primary fs-6">{denom}</span>
                    <Form.Control
                      type="number"
                      size="sm"
                      min={0}
                      value={count}
                      onChange={(e) =>
                        handleCountChange(denom, parseInt(e.target.value) || 0)
                      }
                      className="text-center mx-3"
                      style={{ width: '80px' }}
                    />
                    <span className="fw-semibold text-success">
                      {amount.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </Modal.Body>

          {/* Totals Section */}
          <div className="px-4 pb-2 border-top bg-light">
            <div className="d-flex justify-content-between py-1">
              <span className="fw-bold text-dark">Total Cash:</span>
              <span className="fw-semibold text-success">
                {countedCashTotal.toLocaleString()}
              </span>
            </div>

            <div className="d-flex justify-content-between py-1">
              <span className="fw-bold text-dark">Total CashExpected:</span>
              <span className="fw-semibold text-primary" title="Total cash from all settled orders">
                {totalCash.toLocaleString()}
              </span>
            </div>

            <div className="d-flex justify-content-between py-1 border-top mt-1">
              <span className="fw-bold text-dark">Surplus / Deficit:</span>
              <span
                className={`fw-bold ${countedCashTotal - totalCash >= 0 ? 'text-success' : 'text-danger'
                  }`}
              >
                {(countedCashTotal - totalCash).toLocaleString()}
              </span>
            </div>

            {/* Reason Field */}
            <div className="mt-3">
              <Form.Group controlId="reason">
                <Form.Label className="fw-semibold text-secondary small mb-1">
                  Reason (if Surplus / Deficit)
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Enter reason..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </Form.Group>
            </div>
          </div>

          {/* Footer */}
          <Modal.Footer className="border-0 pt-0">
            <Button
              variant="success"
              size="sm"
              onClick={handleSaveCashDenomination}
              disabled={!reason && countedCashTotal !== totalCash} // reason required if mismatch
            >
              💾 Save
            </Button>
            <Button variant="outline-secondary" size="sm" onClick={handleCloseCashModal}>
              ✖ Close
            </Button>
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
    </div>
  );
};
export default DayEnd;