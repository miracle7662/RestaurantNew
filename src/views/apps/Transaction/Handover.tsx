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
  Tabs
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
  DollarSign
} from "lucide-react";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

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
}

const HandoverPage = () => {
  const [remarks, setRemarks] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState("summary");
  const [handoverTo, setHandoverTo] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHandoverData = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/handover/data');
        if (!response.ok) {
          throw new Error('Failed to fetch handover data');
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

    fetchHandoverData();
  }, []);

  // Computed summary from orders
  const totalOrders = orders.length;
  const totalKOTs = orders.length;
  const totalSales = orders.reduce((sum, order) => sum + order.amount, 0);
  const cash = orders.filter(order => order.type === "Cash").reduce((sum, order) => sum + order.amount, 0);
  const card = orders.filter(order => order.type === "Card").reduce((sum, order) => sum + order.amount, 0);
  const upi = orders.filter(order => order.type === "UPI").reduce((sum, order) => sum + order.amount, 0);
  const pending = orders.filter(order => order.status === "Pending").length;
  const completed = orders.filter(order => order.status === "Settled").length;
  const cancelled = orders.filter(order => order.status === "Cancelled").length;
  const averageOrderValue = totalOrders > 0 ? Math.round(totalSales / totalOrders) : 0;
  const totalDiscount = orders.reduce((sum, order) => sum + order.discount, 0);
  const totalCGST = orders.reduce((sum, order) => sum + order.cgst, 0);
  const totalSGST = orders.reduce((sum, order) => sum + order.sgst, 0);

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

  const paymentData = {
    labels: paymentMethods.map(pm => pm.type),
    datasets: [{
      label: 'Payment Breakdown',
      data: paymentMethods.map(pm => pm.amount),
      backgroundColor: [
        'rgba(75, 192, 192, 0.2)', // Cash
        'rgba(255, 99, 132, 0.2)', // Card
        'rgba(255, 206, 86, 0.2)'  // UPI
      ],
      borderColor: [
        'rgba(75, 192, 192, 1)',
        'rgba(255, 99, 132, 1)',
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
    const matchesSearch = order.orderNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.table.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.waiter.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setShowDetailsModal(true);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleSaveHandover = () => {
    if (!handoverTo) {
      alert("Please select who you are handing over to.");
      return;
    }
    alert(`Handover saved successfully! Handed over to ${handoverTo}`);
  };

  const handleClose = () => {
    if (window.confirm("Are you sure you want to close without saving?")) {
      window.history.back();
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

  const PaymentIcon = ({ type }: { type: string }) => {
    const icons = {
      "Cash": <DollarSign size={16} />,
      "Card": <CreditCard size={16} />,
      "UPI": <Smartphone size={16} />
    };
    return icons[type as keyof typeof icons] || <DollarSign size={16} />;
  };

  if (loading) {
    return (
      <Container fluid className="p-3 bg-light" style={{ height: '100vh' }}>
        <Card className="mb-3 shadow-sm border-0">
          <Card.Body className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading handover data...</span>
            </div>
            <p className="mt-3">Loading handover data...</p>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  if (error) {
    return (
      <Container fluid className="p-3 bg-light" style={{ height: '100vh' }}>
        <Card className="mb-3 shadow-sm border-0">
          <Card.Body className="text-center py-5">
            <AlertTriangle size={48} className="text-danger mb-3" />
            <h5 className="text-danger">Error Loading Data</h5>
            <p className="text-muted">{error}</p>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container fluid className="p-3 bg-light" style={{ height: '100vh' }}>
      {/* Header Section */}


      {/* Tabs Navigation */}
      <Card className="mb-3 shadow-sm border-0">
        <Card.Header className="bg-white border-0 p-3">
          <Row>
            <Col>
              <h4 className="fw-bold text-primary mb-0">Shift Handover</h4>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body className="py-3">
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => k && setActiveTab(k)}
            className="mb-0"
          >
            <Tab
              eventKey="summary"
              title={
                <span className="d-flex align-items-center">
                  <BarChart3 size={16} className="me-2" />
                  Summary
                </span>
              }
            >
              {/* Summary Tab Content */}
              <Row className="mt-3">
                {/* Key Metrics */}
                {[
                  {
                    title: "Total Orders",
                    value: summary.totalOrders,
                    icon: <CheckCircle className="text-primary" />,
                    subtitle: `${summary.completed} completed`
                  },
                  {
                    title: "Total KOTs",
                    value: summary.totalKOTs,
                    icon: <Printer className="text-success" />,
                    subtitle: "Kitchen orders"
                  },
                  {
                    title: "Total Sales",
                    value: `₹${summary.totalSales.toLocaleString()}`,
                    icon: <DollarSign className="text-warning" />,
                    subtitle: `Avg: ₹${summary.averageOrderValue}`
                  },
                  {
                    title: "Pending",
                    value: summary.pending,
                    icon: <AlertTriangle className="text-danger" />,
                    subtitle: "Need attention"
                  },
                ].map((item, idx) => (
                  <Col xl={3} lg={6} md={6} className="mb-3" key={idx}>
                    <Card className="h-100 border-0 shadow-sm">
                      <Card.Body className="d-flex align-items-center">
                        <div className="flex-shrink-0 me-3">
                          <div className="p-3 rounded-circle bg-light">
                            {item.icon}
                          </div>
                        </div>
                        <div className="flex-grow-1">
                          <h6 className="card-title text-muted mb-1">{item.title}</h6>
                          <h4 className="fw-bold text-dark mb-1">{item.value}</h4>
                          <small className="text-muted">{item.subtitle}</small>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Payment Breakdown */}
              <Row className="mt-2">
                <Col md={8}>
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Header className="bg-white border-0">
                      <h6 className="mb-0 fw-bold">Payment Details</h6>
                    </Card.Header>
                    <Card.Body className="p-3" style={{ height: '220px' }}>
                      <div style={{ position: 'relative', height: '100%', width: '100%' }}>
                        <Pie data={paymentData} options={paymentOptions} />
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={4}>
                  <Card className="h-100 border-0 shadow-sm" style={{ maxHeight: '290px' }}>
                    <Card.Header className="bg-white border-0">
                      <h6 className="mb-0 fw-bold">Quick Stats</h6>
                    </Card.Header>
                    <Card.Body>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Settled Orders</span>
                        <Badge bg="success">{summary.completed}</Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Pending Orders</span>
                        <Badge bg="warning">{summary.pending}</Badge>
                      </div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span>Cancelled Orders</span>
                        <Badge bg="danger">{summary.cancelled}</Badge>
                      </div>
                      <hr />
                      <div className="d-flex justify-content-between align-items-center">
                        <strong>Total Tables</strong>
                        <strong>{new Set(orders.map(o => o.table)).size}</strong>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>

            <Tab
              eventKey="orders"
              title={
                <span className="d-flex align-items-center">
                  <Eye size={16} className="me-2" />
                  Orders Detail
                </span>
              }
            >
              {/* Orders Tab Content */}
              <div className="mt-4">
                {/* Filters */}
                <Card className="mb-3 border-0 shadow-sm bg-light ">
                  <Card.Body>
                    <Row className="g-3">
                      <Col md={6}>
                        <InputGroup>
                          <InputGroup.Text>
                            <Search size={16} />
                          </InputGroup.Text>
                          <Form.Control
                            placeholder="Search orders, tables, waiters..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </InputGroup>
                      </Col>
                      <Col md={3}>
                        <Form.Select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                        >
                          <option value="all">All Status</option>
                          <option value="settled">Settled</option>
                          <option value="pending">Pending</option>
                        </Form.Select>
                      </Col>
                      <Col md={3}>
                        <div className="d-flex gap-2">
                          <Button variant="outline-primary" size="sm">
                            <Filter size={16} className="me-1" />
                            Filter
                          </Button>
                          <Button variant="outline-secondary" size="sm">
                            <Download size={16} className="me-1" />
                            Export
                          </Button>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>

                {/* Orders Table */}
                <Card className="border-0 shadow-sm">
                  <Card.Body className="p-0">
                    <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <Table hover className="mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Order No</th>
                            <th>Table</th>
                            <th>Waiter</th>
                            <th>KOT No</th>
                            <th>RevKOT No</th>
                            <th>Items</th>
                            <th>Time</th>
                            <th>Amount</th>
                            <th>Discount</th>

                            <th>NCKOT</th>
                            <th>NC Name</th>
                            <th>CGST</th>
                            <th>SGST</th>
                            <th>UPI</th>
                            <th>Cash</th>
                            <th>Card</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredOrders.map((order, idx) => (
                            <tr key={idx}>
                              <td className="fw-semibold">{order.orderNo}</td>
                              <td>
                                <Badge bg="light" text="dark">
                                  {order.table}
                                </Badge>
                              </td>
                              <td>{order.waiter}</td>
                            <td>
                              <small className="text-muted">{order.kotNo}</small>
                            </td>
                            <td>
                              <small className="text-muted">
                                {order.revKotNo ? order.revKotNo.split(',').map(kot => kot.trim()).join(', ') : ''}
                              </small>
                            </td>
                            <td>
                              <Badge bg="outline-primary" text="primary">
                                {order.items}
                              </Badge>
                            </td>
                            <td>
                            <small className="text-muted">
                              {(() => {
                                // Parse as UTC and convert to local time string
                                const utcDate = new Date(order.time + 'Z');
                                return isNaN(utcDate.getTime()) ? order.time : utcDate.toLocaleTimeString();
                              })()}
                            </small>
                            </td>
                            <td className="fw-semibold">₹{order.amount.toLocaleString()}</td>
                            <td>-₹{order.discount.toLocaleString()}</td>
                            <td>{order.ncKot}</td>
                            <td>{order.ncName}</td>
                            <td>₹{order.cgst.toLocaleString()}</td>
                            <td>₹{order.sgst.toLocaleString()}</td>
                            <td>{order.type === "UPI" ? `₹${order.amount.toLocaleString()}` : '-'}</td>
                            <td>{order.type === "Cash" ? `₹${order.amount.toLocaleString()}` : '-'}</td>
                            <td>{order.type === "Card" ? `₹${order.amount.toLocaleString()}` : '-'}</td>
                            <td>
                              <StatusBadge status={order.status} />
                            </td>
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleViewDetails(order)}
                              >
                                <Eye size={14} />
                              </Button>
                            </td>
                            </tr>
                          ))}
                          <tr className="table-success fw-bold">
                            <td>Total</td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td></td>
                            <td>₹{totalSales.toLocaleString()}</td>
                            <td>-₹{totalDiscount.toLocaleString()}</td>
                            <td>N/A</td>
                            <td>N/A</td>
                            <td>N/A</td>
                            <td>₹{totalCGST.toLocaleString()}</td>
                            <td>₹{totalSGST.toLocaleString()}</td>
                            <td>₹{upi.toLocaleString()}</td>
                            <td>₹{cash.toLocaleString()}</td>
                            <td>₹{card.toLocaleString()}</td>
                            <td></td>
                            <td></td>
                          </tr>
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


      {/* Action Buttons */}
      <Card className="border-0 shadow-sm">
        <Card.Body className="py-2">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <Row className="g-2">
                <Col md={5}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Handover By</Form.Label>
                    <InputGroup>
                      <InputGroup.Text className="bg-light">
                        <Users size={16} />
                      </InputGroup.Text>
                      <Form.Control type="text" value="Cashier A" disabled />
                    </InputGroup>
                  </Form.Group>
                </Col>
                <Col md={5}>
                  <Form.Group>
                    <Form.Label className="fw-semibold">Handover To</Form.Label>
                    <Form.Select
                      value={handoverTo}
                      onChange={(e) => setHandoverTo(e.target.value)}
                      className="fw-semibold"
                    >
                      <option value="">Select User</option>
                      <option value="Cashier B">Cashier B</option>
                      <option value="Cashier C">Cashier C</option>
                      <option value="Manager">Manager</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
            </div>
            <div>
              <Button
                variant="primary"
                onClick={handleSaveHandover}
                className="px-4"
                disabled={!handoverTo}
              >
                <CheckCircle size={16} className="me-1" />
                Complete Handover
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Order Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Order Details - {selectedOrder?.orderNo}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <Row className="g-3">
              <Col md={6}>
                <strong>Table:</strong> {selectedOrder.table}
              </Col>
              <Col md={6}>
                <strong>Waiter:</strong> {selectedOrder.waiter}
              </Col>
              <Col md={6}>
                <strong>KOT No:</strong> {selectedOrder.kotNo}
              </Col>
              <Col md={6}>
                <strong>NCKOT:</strong> {selectedOrder.ncKot}
              </Col>
              <Col md={6}>
                <strong>NC Name:</strong> {selectedOrder.ncName}
              </Col>
              <Col md={6}>
                <strong>RevKOT No:</strong>
                <div>
                  {selectedOrder?.revKotNo ? selectedOrder.revKotNo.split(',').map(kot => kot.trim()).join(', ') : ''}
                </div>
              </Col>
              <Col md={6}>
                <strong>Time:</strong> {(() => {
                  const utcDate = new Date((selectedOrder?.time || '') + 'Z');
                  return isNaN(utcDate.getTime()) ? selectedOrder?.time : utcDate.toLocaleTimeString();
                })()}
              </Col>
              <Col md={6}>
                <strong>Payment:</strong> {selectedOrder.type}
              </Col>
              <Col md={6}>
                <strong>Status:</strong> <StatusBadge status={selectedOrder.status} />
              </Col>
              <Col md={6}>
                <strong>Discount:</strong> ₹{selectedOrder.discount.toLocaleString()}
              </Col>
              <Col md={6}>
                <strong>CGST:</strong> ₹{selectedOrder.cgst.toLocaleString()}
              </Col>
              <Col md={6}>
                <strong>SGST:</strong> ₹{selectedOrder.sgst.toLocaleString()}
              </Col>
              <Col md={12}>
                <hr />
                <strong>Order Summary:</strong>
                <div className="mt-2 p-3 bg-light rounded">
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
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default HandoverPage;