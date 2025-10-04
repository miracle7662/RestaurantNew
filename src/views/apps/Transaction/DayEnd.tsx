import React, { useState, useEffect } from "react";
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
  Tabs,
  Alert,
  ProgressBar,
  Toast,
  ToastContainer
} from "react-bootstrap";
import { 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Eye, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  BarChart3,
  Users,
  CreditCard,
  Smartphone,
  DollarSign,
  Calendar,
  Wallet,
  Receipt,
  RefreshCw,
  FileText,
  Shield,
  TrendingUp,
  Clock,
  Package,
  Store,
  Zap,
  Bell,
  ChevronRight,
  MoreVertical,
  PieChart,
  BarChart,
  LineChart
} from "lucide-react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title
);

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
  discount: number;
  ncKot: string;
  cgst: number;
  sgst: number;
  igst: number;
  tips: number;
  complimentary: number;
  outlet: string;
  duration: string;
}

interface DayEndSummary {
  totalSales: number;
  cash: number;
  card: number;
  upi: number;
  wallet: number;
  totalTax: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalDiscount: number;
  totalTips: number;
  totalComplimentary: number;
  pendingOrders: number;
  totalOrders: number;
  totalKOTs: number;
  averageOrderValue: number;
  peakHour: string;
  mostActiveTable: string;
  bestWaiter: string;
}

const DayEndPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [outletFilter, setOutletFilter] = useState("all");
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dayEndLoading, setDayEndLoading] = useState(false);
  const [dayEndConfirmed, setDayEndConfirmed] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Enhanced dummy data
  const ordersData: Order[] = [
    { 
      orderNo: "ORD001", 
      table: "T1", 
      amount: 500, 
      type: "Cash", 
      status: "Settled",
      waiter: "John Doe",
      time: "14:30",
      items: 4,
      kotNo: "KOT001",
      discount: 50,
      ncKot: "N/A",
      cgst: 18,
      sgst: 18,
      igst: 0,
      tips: 20,
      complimentary: 0,
      outlet: "Main Dining",
      duration: "45min"
    },
    { 
      orderNo: "ORD002", 
      table: "T3", 
      amount: 750, 
      type: "UPI", 
      status: "Settled",
      waiter: "Jane Smith",
      time: "15:15",
      items: 3,
      kotNo: "KOT002",
      discount: 0,
      ncKot: "N/A",
      cgst: 27,
      sgst: 27,
      igst: 0,
      tips: 30,
      complimentary: 25,
      outlet: "Terrace",
      duration: "30min"
    },
    { 
      orderNo: "ORD003", 
      table: "T2", 
      amount: 1200, 
      type: "Card", 
      status: "Pending",
      waiter: "Mike Johnson",
      time: "16:45",
      items: 5,
      kotNo: "KOT003",
      discount: 100,
      ncKot: "NC001",
      cgst: 36,
      sgst: 36,
      igst: 0,
      tips: 50,
      complimentary: 0,
      outlet: "Main Dining",
      duration: "60min"
    },
    { 
      orderNo: "ORD004", 
      table: "T5", 
      amount: 850, 
      type: "Cash", 
      status: "Settled",
      waiter: "Sarah Wilson",
      time: "17:20",
      items: 2,
      kotNo: "KOT004",
      discount: 25,
      ncKot: "N/A",
      cgst: 30.6,
      sgst: 30.6,
      igst: 0,
      tips: 15,
      complimentary: 10,
      outlet: "Private Room",
      duration: "25min"
    },
    { 
      orderNo: "ORD005", 
      table: "T4", 
      amount: 320, 
      type: "Wallet", 
      status: "Settled",
      waiter: "Raj Kumar",
      time: "18:30",
      items: 1,
      kotNo: "KOT005",
      discount: 10,
      ncKot: "N/A",
      cgst: 14.4,
      sgst: 14.4,
      igst: 0,
      tips: 5,
      complimentary: 15,
      outlet: "Terrace",
      duration: "20min"
    },
  ];

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setOrders(ordersData);
      setLoading(false);
    }, 1500);
  }, []);

  // Enhanced computed summary
  const summary: DayEndSummary = {
    totalSales: orders.reduce((sum, order) => sum + order.amount, 0),
    cash: orders.filter(order => order.type === "Cash").reduce((sum, order) => sum + order.amount, 0),
    card: orders.filter(order => order.type === "Card").reduce((sum, order) => sum + order.amount, 0),
    upi: orders.filter(order => order.type === "UPI").reduce((sum, order) => sum + order.amount, 0),
    wallet: orders.filter(order => order.type === "Wallet").reduce((sum, order) => sum + order.amount, 0),
    cgst: orders.reduce((sum, order) => sum + order.cgst, 0),
    sgst: orders.reduce((sum, order) => sum + order.sgst, 0),
    igst: orders.reduce((sum, order) => sum + order.igst, 0),
    totalTax: orders.reduce((sum, order) => sum + order.cgst + order.sgst + order.igst, 0),
    totalDiscount: orders.reduce((sum, order) => sum + order.discount, 0),
    totalTips: orders.reduce((sum, order) => sum + order.tips, 0),
    totalComplimentary: orders.reduce((sum, order) => sum + order.complimentary, 0),
    pendingOrders: orders.filter(order => order.status === "Pending").length,
    totalOrders: orders.length,
    totalKOTs: orders.length,
    averageOrderValue: orders.length > 0 ? Math.round(orders.reduce((sum, order) => sum + order.amount, 0) / orders.length) : 0,
    peakHour: "18:00-19:00",
    mostActiveTable: "T2",
    bestWaiter: "John Doe"
  };

  // Enhanced chart data
  const paymentMethods = [
    { type: "Cash", amount: summary.cash, color: "#10b981" },
    { type: "Card", amount: summary.card, color: "#3b82f6" },
    { type: "UPI", amount: summary.upi, color: "#f59e0b" },
    { type: "Wallet", amount: summary.wallet, color: "#8b5cf6" },
  ];

  const paymentData = {
    labels: paymentMethods.map(pm => pm.type),
    datasets: [{
      label: 'Payment Breakdown',
      data: paymentMethods.map(pm => pm.amount),
      backgroundColor: paymentMethods.map(pm => pm.color + '20'),
      borderColor: paymentMethods.map(pm => pm.color),
      borderWidth: 2,
    }],
  };

  const hourlySalesData = {
    labels: ['12-13', '13-14', '14-15', '15-16', '16-17', '17-18', '18-19', '19-20'],
    datasets: [{
      label: 'Sales (₹)',
      data: [1200, 1800, 2200, 1900, 2800, 3500, 4200, 3800],
      backgroundColor: '#3b82f6',
      borderColor: '#1d4ed8',
      borderWidth: 2,
      borderRadius: 4,
    }],
  };

  const paymentOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `${context.label}: ₹${context.raw.toLocaleString()} (${((context.raw / summary.totalSales) * 100).toFixed(1)}%)`;
          }
        }
      }
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0,0,0,0.1)',
        }
      },
      x: {
        grid: {
          display: false,
        }
      }
    },
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.table.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.waiter.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.kotNo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status.toLowerCase() === statusFilter.toLowerCase();
    const matchesOutlet = outletFilter === "all" || order.outlet === outletFilter;
    
    return matchesSearch && matchesStatus && matchesOutlet;
  });

  const pendingOrders = orders.filter(order => order.status === "Pending");

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handleSettleOrder = async (orderNo: string) => {
    try {
      // Simulate API call
      setOrders(orders.map(order => 
        order.orderNo === orderNo ? { ...order, status: "Settled" } : order
      ));
      showToastMessage("Order settled successfully!");
    } catch (err) {
      console.error('Failed to settle order:', err);
    }
  };

  const handleConfirmDayEnd = async () => {
    if (pendingOrders.length > 0) {
      showToastMessage("Cannot close day with pending orders!");
      return;
    }

    setDayEndLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      setDayEndConfirmed(true);
      setShowConfirmModal(false);
      showToastMessage("Day end completed successfully! Counters have been reset.");
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to confirm day end');
    } finally {
      setDayEndLoading(false);
    }
  };

  const handleExportReport = (type: 'csv' | 'pdf') => {
    const data = {
      summary,
      orders: filteredOrders,
      generatedAt: new Date().toISOString(),
      generatedBy: "System"
    };

    if (type === 'csv') {
      const csvContent = convertToCSV(data);
      downloadFile(csvContent, `dayend-report-${dateRange.start}.csv`, 'text/csv');
      showToastMessage("CSV report downloaded successfully!");
    } else {
      setShowReportModal(true);
    }
  };

  const convertToCSV = (data: any) => {
    const headers = ['OrderNo', 'Table', 'Waiter', 'Amount', 'Type', 'Status', 'Time'];
    const csvRows = [
      headers.join(','),
      ...data.orders.map((order: Order) => 
        [order.orderNo, order.table, order.waiter, order.amount, order.type, order.status, order.time].join(',')
      )
    ];
    return csvRows.join('\n');
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const variants = {
      "Settled": "success",
      "Pending": "warning",
      "Cancelled": "danger"
    };
    return <Badge bg={variants[status as keyof typeof variants] || "secondary"} className="fs-12">{status}</Badge>;
  };

  const PaymentIcon = ({ type }: { type: string }) => {
    const icons = {
      "Cash": <DollarSign size={14} />,
      "Card": <CreditCard size={14} />,
      "UPI": <Smartphone size={14} />,
      "Wallet": <Wallet size={14} />
    };
    return icons[type as keyof typeof icons] || <DollarSign size={14} />;
  };

  if (loading) {
    return (
      <Container fluid className="p-3 bg-gradient min-vh-100">
        <Card className="mb-3 glass-card border-0">
          <Card.Body className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading day end data...</span>
            </div>
            <p className="mt-3 text-muted">Loading day end data...</p>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container fluid className="p-3 bg-gradient min-vh-100">
      <style>
        {`
          .bg-gradient {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
          }
          .glass-card {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          .metric-card {
            transition: all 0.3s ease;
            border: none;
            border-left: 4px solid transparent;
          }
          .metric-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important;
          }
          .metric-card.success { border-left-color: #10b981; }
          .metric-card.warning { border-left-color: #f59e0b; }
          .metric-card.danger { border-left-color: #ef4444; }
          .metric-card.info { border-left-color: #3b82f6; }
          .fs-12 { font-size: 0.75rem; }
          .fs-14 { font-size: 0.875rem; }
          .chart-container {
            position: relative;
            height: 300px;
            width: 100%;
          }
          .progress-thin {
            height: 6px;
          }
          .nav-tabs .nav-link {
            border: none;
            color: #6c757d;
            font-weight: 500;
          }
          .nav-tabs .nav-link.active {
            background: transparent;
            border-bottom: 3px solid #3b82f6;
            color: #3b82f6;
          }
        `}
      </style>

      {/* Header Section */}
      <Card className="mb-4 glass-card border-0">
        <Card.Body className="py-4">
          <Row className="align-items-center">
            <Col>
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                  <BarChart3 size={32} className="text-primary" />
                </div>
                <div>
                  <h2 className="fw-bold text-dark mb-1">Day End Process</h2>
                  <p className="text-muted mb-0">Complete daily closing procedures and generate reports</p>
                </div>
              </div>
            </Col>
            <Col xs="auto">
              <div className="d-flex gap-2">
                <Button variant="outline-primary" size="sm" className="d-flex align-items-center">
                  <Calendar size={16} className="me-2" />
                  {new Date().toLocaleDateString()}
                </Button>
                <Button variant="outline-primary" size="sm" className="d-flex align-items-center">
                  <Clock size={16} className="me-2" />
                  {new Date().toLocaleTimeString()}
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Alert Banner */}
      {pendingOrders.length > 0 && (
        <Alert variant="warning" className="glass-card border-warning mb-4">
          <div className="d-flex align-items-center">
            <AlertTriangle size={20} className="me-2" />
            <div className="flex-grow-1">
              <strong>Attention Required:</strong> You have {pendingOrders.length} pending orders that need to be settled before closing the day.
            </div>
            <Button 
              variant="warning" 
              size="sm"
              onClick={() => setActiveTab("orders")}
            >
              View Pending Orders
            </Button>
          </div>
        </Alert>
      )}

      {/* Tabs Navigation */}
      <Card className="mb-4 glass-card border-0">
        <Card.Body className="p-0">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => k && setActiveTab(k)}
            className="px-3 pt-3 border-bottom"
          >
            <Tab
              eventKey="summary"
              title={
                <span className="d-flex align-items-center">
                  <BarChart3 size={16} className="me-2" />
                  Dashboard
                  {pendingOrders.length > 0 && (
                    <Badge bg="warning" className="ms-2 fs-12">
                      {pendingOrders.length}
                    </Badge>
                  )}
                </span>
              }
            >
              {/* Summary Tab Content */}
              <div className="p-3">
                {/* Key Metrics Grid */}
                <Row className="g-3 mb-4">
                  {[
                    {
                      title: "Total Sales",
                      value: `₹${summary.totalSales.toLocaleString()}`,
                      icon: <TrendingUp className="text-success" />,
                      subtitle: `₹${summary.averageOrderValue} avg/order`,
                      progress: 100,
                      variant: "success",
                      trend: "+12%"
                    },
                    {
                      title: "Pending Orders",
                      value: summary.pendingOrders,
                      icon: <Clock className="text-warning" />,
                      subtitle: "Need settlement",
                      progress: (summary.pendingOrders / summary.totalOrders) * 100,
                      variant: "warning",
                      trend: `${((summary.pendingOrders / summary.totalOrders) * 100).toFixed(1)}%`
                    },
                    {
                      title: "Total Taxes",
                      value: `₹${summary.totalTax.toLocaleString()}`,
                      icon: <Receipt className="text-info" />,
                      subtitle: `CGST: ₹${summary.cgst.toLocaleString()}`,
                      progress: (summary.totalTax / summary.totalSales) * 100,
                      variant: "info",
                      trend: `${((summary.totalTax / summary.totalSales) * 100).toFixed(1)}%`
                    },
                    {
                      title: "Discounts & Tips",
                      value: `₹${(summary.totalDiscount + summary.totalTips).toLocaleString()}`,
                      icon: <Wallet className="text-primary" />,
                      subtitle: `Tips: ₹${summary.totalTips.toLocaleString()}`,
                      progress: ((summary.totalDiscount + summary.totalTips) / summary.totalSales) * 100,
                      variant: "primary",
                      trend: `${(((summary.totalDiscount + summary.totalTips) / summary.totalSales) * 100).toFixed(1)}%`
                    },
                  ].map((item, idx) => (
                    <Col xl={3} lg={6} md={6} key={idx}>
                      <Card className={`metric-card ${item.variant} h-100 glass-card`}>
                        <Card.Body>
                          <div className="d-flex align-items-start justify-content-between mb-3">
                            <div className="bg-light p-2 rounded">
                              {item.icon}
                            </div>
                            <Badge bg="light" text="dark" className="fs-12">
                              {item.trend}
                            </Badge>
                          </div>
                          <h4 className="fw-bold text-dark mb-1">{item.value}</h4>
                          <p className="text-muted mb-2 fs-14">{item.title}</p>
                          <small className="text-muted">{item.subtitle}</small>
                          <ProgressBar 
                            variant={item.variant} 
                            now={item.progress} 
                            className="progress-thin mt-2"
                          />
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>

                {/* Charts and Additional Metrics */}
                <Row className="g-4">
                  {/* Payment Breakdown */}
                  <Col lg={8}>
                    <Card className="glass-card border-0 h-100">
                      <Card.Header className="bg-transparent border-0 d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 fw-bold">Payment Methods Breakdown</h6>
                        <div className="d-flex gap-2">
                          <Button variant="outline-primary" size="sm" className="fs-12">
                            <PieChart size={14} className="me-1" />
                            Pie
                          </Button>
                          <Button variant="outline-primary" size="sm" className="fs-12">
                            <BarChart size={14} className="me-1" />
                            Bar
                          </Button>
                        </div>
                      </Card.Header>
                      <Card.Body>
                        <div className="chart-container">
                          <Pie data={paymentData} options={paymentOptions} />
                        </div>
                        <Row className="g-2 mt-3">
                          {paymentMethods.map((method, idx) => (
                            <Col md={6} key={idx}>
                              <div className="d-flex align-items-center p-2 border rounded">
                                <div 
                                  className="p-2 rounded me-2"
                                  style={{ 
                                    backgroundColor: method.color + '20',
                                    border: `1px solid ${method.color}`
                                  }}
                                >
                                  <PaymentIcon type={method.type} />
                                </div>
                                <div className="flex-grow-1">
                                  <h6 className="mb-0 fs-14">{method.type}</h6>
                                  <small className="text-muted">
                                    ₹{method.amount.toLocaleString()} • {summary.totalSales > 0 ? ((method.amount / summary.totalSales) * 100).toFixed(1) : 0}%
                                  </small>
                                </div>
                              </div>
                            </Col>
                          ))}
                        </Row>
                      </Card.Body>
                    </Card>
                  </Col>

                  {/* Quick Stats and Performance */}
                  <Col lg={4}>
                    <Row className="g-4">
                      <Col md={6} lg={12}>
                        <Card className="glass-card border-0">
                          <Card.Header className="bg-transparent border-0">
                            <h6 className="mb-0 fw-bold">Performance Metrics</h6>
                          </Card.Header>
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <span className="fs-14">Peak Hour</span>
                              <Badge bg="primary" className="fs-12">{summary.peakHour}</Badge>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <span className="fs-14">Active Tables</span>
                              <Badge bg="success" className="fs-12">{new Set(orders.map(o => o.table)).size}</Badge>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mb-3">
                              <span className="fs-14">Best Waiter</span>
                              <Badge bg="info" className="fs-12">{summary.bestWaiter}</Badge>
                            </div>
                            <div className="d-flex justify-content-between align-items-center">
                              <span className="fs-14">Avg. Order Time</span>
                              <Badge bg="warning" className="fs-12">35min</Badge>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={6} lg={12}>
                        <Card className="glass-card border-0">
                          <Card.Header className="bg-transparent border-0">
                            <h6 className="mb-0 fw-bold">Tax Summary</h6>
                          </Card.Header>
                          <Card.Body>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="fs-14">CGST</span>
                              <Badge bg="outline-secondary" className="fs-12">₹{summary.cgst.toLocaleString()}</Badge>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="fs-14">SGST</span>
                              <Badge bg="outline-secondary" className="fs-12">₹{summary.sgst.toLocaleString()}</Badge>
                            </div>
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <span className="fs-14">IGST</span>
                              <Badge bg="outline-secondary" className="fs-12">₹{summary.igst.toLocaleString()}</Badge>
                            </div>
                            <hr />
                            <div className="d-flex justify-content-between align-items-center">
                              <strong className="fs-14">Total Tax</strong>
                              <strong className="text-primary fs-14">₹{summary.totalTax.toLocaleString()}</strong>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </Col>
                </Row>

                {/* Hourly Sales Chart */}
                <Row className="mt-4">
                  <Col>
                    <Card className="glass-card border-0">
                      <Card.Header className="bg-transparent border-0">
                        <h6 className="mb-0 fw-bold">Hourly Sales Performance</h6>
                      </Card.Header>
                      <Card.Body>
                        <div className="chart-container">
                          <Bar data={hourlySalesData} options={barChartOptions} />
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
                  <Package size={16} className="me-2" />
                  Pending Orders
                  {pendingOrders.length > 0 && (
                    <Badge bg="danger" className="ms-2 fs-12">
                      {pendingOrders.length}
                    </Badge>
                  )}
                </span>
              }
            >
              {/* Orders Tab Content */}
              <div className="p-3">
                {/* Enhanced Filters */}
                <Card className="mb-4 glass-card border-0">
                  <Card.Body>
                    <Row className="g-3 align-items-end">
                      <Col md={3}>
                        <Form.Label className="fw-semibold fs-14">Search Orders</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light">
                            <Search size={16} />
                          </InputGroup.Text>
                          <Form.Control
                            placeholder="Orders, tables, KOTs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="fs-14"
                          />
                        </InputGroup>
                      </Col>
                      <Col md={2}>
                        <Form.Label className="fw-semibold fs-14">Status</Form.Label>
                        <Form.Select 
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="fs-14"
                        >
                          <option value="all">All Status</option>
                          <option value="pending">Pending</option>
                          <option value="settled">Settled</option>
                        </Form.Select>
                      </Col>
                      <Col md={2}>
                        <Form.Label className="fw-semibold fs-14">Outlet</Form.Label>
                        <Form.Select 
                          value={outletFilter}
                          onChange={(e) => setOutletFilter(e.target.value)}
                          className="fs-14"
                        >
                          <option value="all">All Outlets</option>
                          <option value="Main Dining">Main Dining</option>
                          <option value="Terrace">Terrace</option>
                          <option value="Private Room">Private Room</option>
                        </Form.Select>
                      </Col>
                      <Col md={3}>
                        <Form.Label className="fw-semibold fs-14">Date Range</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-light fs-14">
                            <Calendar size={16} />
                          </InputGroup.Text>
                          <Form.Control
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                            className="fs-14"
                          />
                        </InputGroup>
                      </Col>
                      <Col md={2}>
                        <div className="d-flex gap-2">
                          <Button variant="primary" size="sm" className="flex-fill fs-14">
                            <Filter size={14} className="me-1" />
                            Filter
                          </Button>
                          <Button variant="outline-primary" size="sm" className="flex-fill fs-14">
                            <RefreshCw size={14} className="me-1" />
                            Reset
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Enhanced Orders Table */}
                <Card className="glass-card border-0">
                  <Card.Header className="bg-transparent border-0 d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 fw-bold">Pending Orders / KOTs</h6>
                    <div className="d-flex gap-2">
                      <Button variant="outline-primary" size="sm" className="fs-14">
                        <Download size={14} className="me-1" />
                        Export
                      </Button>
                      <Button variant="outline-primary" size="sm" className="fs-14">
                        <Printer size={14} className="me-1" />
                        Print
                      </Button>
                    </div>
                  </Card.Header>
                  <Card.Body className="p-0">
                    <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                      <Table hover className="mb-0">
                        <thead className="table-light">
                          <tr>
                            <th className="fs-14">Order No</th>
                            <th className="fs-14">Table</th>
                            <th className="fs-14">Waiter</th>
                            <th className="fs-14">KOT No</th>
                            <th className="fs-14">Outlet</th>
                            <th className="fs-14">Items</th>
                            <th className="fs-14">Duration</th>
                            <th className="fs-14">Amount</th>
                            <th className="fs-14">Status</th>
                            <th className="fs-14">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOrders
                            .filter(order => order.status === "Pending")
                            .map((order, idx) => (
                              <tr key={idx} className="align-middle">
                                <td>
                                  <div className="d-flex align-items-center">
                                    <div className="bg-warning bg-opacity-10 p-1 rounded me-2">
                                      <Package size={14} className="text-warning" />
                                    </div>
                                    <span className="fw-semibold fs-14">{order.orderNo}</span>
                                  </div>
                                </td>
                                <td>
                                  <Badge bg="light" text="dark" className="fs-12">
                                    {order.table}
                                  </Badge>
                                </td>
                                <td className="fs-14">{order.waiter}</td>
                                <td>
                                  <small className="text-muted fs-12">{order.kotNo}</small>
                                </td>
                                <td>
                                  <Badge bg="outline-secondary" className="fs-12">{order.outlet}</Badge>
                                </td>
                                <td>
                                  <Badge bg="primary" className="fs-12">
                                    {order.items}
                                  </Badge>
                                </td>
                                <td>
                                  <small className="text-muted fs-12">{order.duration}</small>
                                </td>
                                <td className="fw-semibold fs-14">₹{order.amount.toLocaleString()}</td>
                                <td>
                                  <StatusBadge status={order.status} />
                                </td>
                                <td>
                                  <div className="d-flex gap-1">
                                    <Button
                                      variant="success"
                                      size="sm"
                                      onClick={() => handleSettleOrder(order.orderNo)}
                                      className="fs-12"
                                    >
                                      <CheckCircle size={12} className="me-1" />
                                      Settle
                                    </Button>
                                    <Button
                                      variant="outline-primary"
                                      size="sm"
                                      onClick={() => handleViewDetails(order)}
                                      className="fs-12"
                                    >
                                      <Eye size={12} />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          {filteredOrders.filter(order => order.status === "Pending").length === 0 && (
                            <tr>
                              <td colSpan={10} className="text-center py-5 text-muted">
                                <div className="bg-success bg-opacity-10 p-3 rounded-circle d-inline-flex mb-3">
                                  <CheckCircle size={32} className="text-success" />
                                </div>
                                <h6 className="text-success">All Clear!</h6>
                                <p className="mb-0 fs-14">No pending orders found</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>

      {/* Enhanced Day End Actions */}
      <Card className="glass-card border-0">
        <Card.Body className="p-4">
          <Row className="g-4 align-items-center">
            <Col md={6}>
              <div className="d-flex align-items-center">
                <div className="bg-primary bg-opacity-10 p-3 rounded-circle me-3">
                  <Zap size={24} className="text-primary" />
                </div>
                <div>
                  <h5 className="fw-bold mb-1">Ready to Close the Day?</h5>
                  <p className="text-muted mb-0 fs-14">
                    {pendingOrders.length > 0 
                      ? `Complete ${pendingOrders.length} pending orders to proceed`
                      : "All systems are ready for day end process"
                    }
                  </p>
                </div>
              </div>
            </Col>
            <Col md={6}>
              <div className="d-flex gap-3 justify-content-end">
                <Button 
                  variant="outline-primary" 
                  onClick={() => handleExportReport('csv')}
                  className="d-flex align-items-center"
                >
                  <Download size={16} className="me-2" />
                  Export CSV
                </Button>
                <Button 
                  variant="outline-primary" 
                  onClick={() => handleExportReport('pdf')}
                  className="d-flex align-items-center"
                >
                  <FileText size={16} className="me-2" />
                  Generate PDF
                </Button>
                <Button 
                  variant="primary" 
                  onClick={() => setShowConfirmModal(true)}
                  disabled={pendingOrders.length > 0 || dayEndConfirmed}
                  className="d-flex align-items-center px-4"
                >
                  <Shield size={16} className="me-2" />
                  {dayEndConfirmed ? "Day End Completed" : "Confirm Day End"}
                </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Enhanced Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered size="lg">
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="d-flex align-items-center">
            <div className="bg-warning bg-opacity-10 p-2 rounded me-3">
              <Shield size={24} className="text-warning" />
            </div>
            <div>
              <h5 className="fw-bold mb-0">Confirm Day End</h5>
              <small className="text-muted">Finalize daily operations</small>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <div className="text-center mb-4">
            <div className="bg-warning bg-opacity-10 p-4 rounded-circle d-inline-flex mb-3">
              <Shield size={48} className="text-warning" />
            </div>
            <h4 className="fw-bold">Ready to Close Business Day?</h4>
            <p className="text-muted">
              This action will finalize all transactions and reset system counters.
            </p>
          </div>

          <Row className="g-3 mb-4">
            <Col md={6}>
              <div className="border rounded p-3 text-center">
                <Store size={24} className="text-success mb-2" />
                <h6 className="fw-bold">Daily Summary</h6>
                <p className="text-muted fs-14 mb-1">Total Sales: ₹{summary.totalSales.toLocaleString()}</p>
                <p className="text-muted fs-14 mb-0">Orders: {summary.totalOrders}</p>
              </div>
            </Col>
            <Col md={6}>
              <div className="border rounded p-3 text-center">
                <Users size={24} className="text-primary mb-2" />
                <h6 className="fw-bold">Staff Performance</h6>
                <p className="text-muted fs-14 mb-1">Best Waiter: {summary.bestWaiter}</p>
                <p className="text-muted fs-14 mb-0">Active Tables: {new Set(orders.map(o => o.table)).size}</p>
              </div>
            </Col>
          </Row>

          <Alert variant="warning" className="border-warning">
            <div className="d-flex">
              <AlertTriangle size={20} className="me-2 flex-shrink-0" />
              <div>
                <strong>Important Notice</strong>
                <p className="mb-0 fs-14">This action cannot be undone. Make sure all orders are settled and daily reports are generated before proceeding.</p>
              </div>
            </div>
          </Alert>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button variant="outline-secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleConfirmDayEnd}
            disabled={dayEndLoading}
            className="px-4"
          >
            {dayEndLoading ? (
              <>
                <div className="spinner-border spinner-border-sm me-2" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle size={16} className="me-2" />
                Confirm & Close Day
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Order Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg" centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="d-flex align-items-center">
            <div className="bg-primary bg-opacity-10 p-2 rounded me-3">
              <Receipt size={24} className="text-primary" />
            </div>
            <div>
              <h5 className="fw-bold mb-0">Order Details</h5>
              <small className="text-muted">{selectedOrder?.orderNo}</small>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <Row className="g-3">
              <Col md={6}>
                <div className="border rounded p-3">
                  <h6 className="fw-bold mb-3">Basic Info</h6>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Table:</span>
                    <strong>{selectedOrder.table}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Waiter:</span>
                    <strong>{selectedOrder.waiter}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Outlet:</span>
                    <Badge bg="outline-secondary">{selectedOrder.outlet}</Badge>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">Duration:</span>
                    <strong>{selectedOrder.duration}</strong>
                  </div>
                </div>
              </Col>
              <Col md={6}>
                <div className="border rounded p-3">
                  <h6 className="fw-bold mb-3">Payment Info</h6>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Type:</span>
                    <div className="d-flex align-items-center">
                      <PaymentIcon type={selectedOrder.type} />
                      <strong className="ms-2">{selectedOrder.type}</strong>
                    </div>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Status:</span>
                    <StatusBadge status={selectedOrder.status} />
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="text-muted">Time:</span>
                    <strong>{selectedOrder.time}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">KOT No:</span>
                    <strong>{selectedOrder.kotNo}</strong>
                  </div>
                </div>
              </Col>
              <Col md={12}>
                <div className="border rounded p-3">
                  <h6 className="fw-bold mb-3">Financial Breakdown</h6>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Subtotal:</span>
                    <strong>₹{(selectedOrder.amount + selectedOrder.discount - selectedOrder.tips).toLocaleString()}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Discount:</span>
                    <strong className="text-danger">-₹{selectedOrder.discount.toLocaleString()}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>CGST:</span>
                    <strong>₹{selectedOrder.cgst.toLocaleString()}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>SGST:</span>
                    <strong>₹{selectedOrder.sgst.toLocaleString()}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Tips:</span>
                    <strong className="text-success">+₹{selectedOrder.tips.toLocaleString()}</strong>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span>Complimentary:</span>
                    <strong className="text-info">₹{selectedOrder.complimentary.toLocaleString()}</strong>
                  </div>
                  <hr />
                  <div className="d-flex justify-content-between">
                    <strong>Total Amount:</strong>
                    <strong className="text-primary fs-5">₹{selectedOrder.amount.toLocaleString()}</strong>
                  </div>
                </div>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0">
          {selectedOrder?.status === "Pending" && (
            <Button 
              variant="success" 
              onClick={() => {
                handleSettleOrder(selectedOrder.orderNo);
                setShowDetailsModal(false);
              }}
              className="d-flex align-items-center"
            >
              <CheckCircle size={16} className="me-2" />
              Settle Order
            </Button>
          )}
          <Button variant="outline-primary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast Notifications */}
      <ToastContainer position="top-end" className="p-3">
        <Toast 
          show={showToast} 
          onClose={() => setShowToast(false)} 
          delay={3000} 
          autohide
          bg="success"
        >
          <Toast.Header>
            <CheckCircle size={16} className="text-success me-2" />
            <strong className="me-auto">Success</strong>
          </Toast.Header>
          <Toast.Body className="text-white">
            {toastMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Container>
  );
};

export default DayEndPage;