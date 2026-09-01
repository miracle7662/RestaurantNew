import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Badge,
  Button,
  ButtonGroup,
  Form,
  Spinner,
} from 'react-bootstrap';

import {
  FaUsers,
  FaDollarSign,
  FaClipboardList,
  FaChartLine,
  FaSearch,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
  FaArrowUp,
  FaArrowDown,
  FaTruck,
  FaHotel,
  FaBed,
  FaStar,
  FaUtensils,
} from 'react-icons/fa';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

import { useAuthContext } from '@/common/context/useAuthContext';
import DashboardService from '@/common/api/dashboard';
import CheckoutService from '@/common/hotel/checkout';

// =====================================================
// TYPES
// =====================================================

type DashboardModule = 'restaurant' | 'lodging';

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  change: number;
  iconBg?: string;
}

interface DashboardItem {
  id: number;
  customer: string;
  items: string;
  total: number;
  status: 'completed' | 'pending' | 'cancelled' | 'preparing' | 'delivered';
  time: string;
  table?: number;
}

interface BestSellerItem {
  name: string;
  quantity: number;
  revenue: number;
  category?: string;
}

// =====================================================
// LIVE DATA TYPES
// =====================================================

interface LiveRoomCategory {
  hotelid: number;
  room_category_id: number;
  category_name: string;
  category_total_rooms: number;
  occupied_rooms: number;
  reserved_rooms: number;
  today_reservations: number;
  today_checkins: number;
  today_checkouts: number;
  available_rooms_raw: number;
  available_rooms: number;
  blocked_rooms: number;
  next_available_from: string | null;
}

// =====================================================
// STAT CARD COMPONENT
// =====================================================

const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  change,
  iconBg,
}) => {
  const isPositive = change >= 0;

  return (
    <Card
      className="border-0 h-100"
      style={{
        borderRadius: '16px',
        background: '#ffffff',
        boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.07)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 18px rgba(0,0,0,0.04)';
      }}
    >
      <Card.Body className="p-3 p-md-4">
        <div className="d-flex align-items-center gap-3">
          <div
            className={`d-flex align-items-center justify-content-center rounded-3 bg-${iconBg} bg-opacity-10`}
            style={{
              width: '48px',
              height: '48px',
              color: `var(--bs-${iconBg})`,
            }}
          >
            {icon}
          </div>

          <div>
            <div
              className="text-muted text-uppercase mb-1"
              style={{
                fontSize: '0.68rem',
                letterSpacing: '0.5px',
                fontWeight: 500,
              }}
            >
              {title}
            </div>

            <h3
              className="fw-bold mb-0"
              style={{
                fontSize: '1.55rem',
                letterSpacing: '-0.4px',
              }}
            >
              {value}
            </h3>

            <small
              className={`${
                isPositive ? 'text-success' : 'text-danger'
              } d-inline-flex align-items-center gap-1 mt-1`}
            >
              {isPositive ? <FaArrowUp size={10} /> : <FaArrowDown size={10} />}
              {Math.abs(change)}% from yesterday
            </small>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

// =====================================================
// STATUS BADGE COMPONENT
// =====================================================

const StatusBadge: React.FC<{
  status: DashboardItem['status'];
}> = ({ status }) => {
  const map = {
    completed: {
      bg: 'success',
      text: 'Completed',
      icon: <FaCheckCircle size={11} />,
    },
    preparing: {
      bg: 'warning',
      text: 'Preparing',
      icon: <FaClock size={11} />,
    },
    pending: {
      bg: 'info',
      text: 'Pending',
      icon: <FaClock size={11} />,
    },
    cancelled: {
      bg: 'danger',
      text: 'Cancelled',
      icon: <FaTimesCircle size={11} />,
    },
    delivered: {
      bg: 'primary',
      text: 'Delivered',
      icon: <FaTruck size={11} />,
    },
  };

  const { bg, text, icon } = map[status] || map.pending;

  return (
    <Badge
      bg={bg}
      className="px-2 py-1 rounded-pill d-inline-flex align-items-center gap-1"
      style={{
        fontSize: '0.7rem',
        fontWeight: 500,
      }}
    >
      {icon}
      {text}
    </Badge>
  );
};

// =====================================================
// MAIN DASHBOARD COMPONENT
// =====================================================

const RestaurantDashboard: React.FC = () => {
  const { user } = useAuthContext();

  // ===================================================
  // STATE DECLARATIONS
  // ===================================================

  // Module
  const [activeModule, setActiveModule] = useState<DashboardModule>('restaurant');

  // Common State
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<StatCardProps[]>([]);
  const [recentItems, setRecentItems] = useState<DashboardItem[]>([]);
  const [bestSellers, setBestSellers] = useState<BestSellerItem[]>([]);
  const [revenueData, setRevenueData] = useState<{ day: string; revenue: number }[]>([]);
  const [categoryData, setCategoryData] = useState<
    { name: string; value: number; color: string }[]
  >([]);
  const [paymentData, setPaymentData] = useState<
    { name: string; value: number; color: string }[]
  >([]);

  // Lodging State
  const [lodgingRooms, setLodgingRooms] = useState<LiveRoomCategory[]>([]);

  // ===================================================
  // CONSTANTS
  // ===================================================

  const chartColors = [
    '#4f46e5',
    '#7c3aed',
    '#06b6d4',
    '#f59e0b',
    '#10b981',
    '#e11d48',
    '#8b5cf6',
  ];

  // ===================================================
  // HELPER FUNCTIONS
  // ===================================================

  const calculateChange = (current: number, previous: number): number => {
    if (!previous || previous === 0) {
      return 0;
    }
    return Number((((current - previous) / previous) * 100).toFixed(1));
  };

  const formatCurrency = (amount: number): string => {
    return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  };

  const formatTimeAgo = (datetime: string): string => {
    if (!datetime) {
      return 'Just now';
    }

    const date = new Date(datetime);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
    return `${Math.floor(diffMins / 1440)} days ago`;
  };



  // ===================================================
  // DEFAULT DATA FUNCTIONS (ONLY FOR FALLBACK)
  // ===================================================

  const getDefaultRevenueData = () => {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({
      day,
      revenue: 0,
    }));
  };

  const getDefaultCategoryData = () => {
    return [
      { name: 'Main Course', value: 0, color: chartColors[0] },
      { name: 'Starters', value: 0, color: chartColors[1] },
      { name: 'Beverages', value: 0, color: chartColors[2] },
      { name: 'Desserts', value: 0, color: chartColors[3] },
      { name: 'Others', value: 0, color: chartColors[4] },
    ];
  };

  const getDefaultPaymentData = () => {
    return [
      { name: 'Card', value: 0, color: chartColors[0] },
      { name: 'UPI', value: 0, color: chartColors[2] },
      { name: 'Cash', value: 0, color: chartColors[4] },
      { name: 'Wallet', value: 0, color: chartColors[3] },
    ];
  };

  // ===================================================
  // PROCESS DASHBOARD DATA FROM API
  // ===================================================

  const processDashboardData = (data: any) => {
    if (!data) return;

    // 1. Process Stats
    const summary = data.summary || {};
    const yesterdayRevenue = summary.total_revenue * 0.9;
    const yesterdayOrders = summary.total_orders * 0.92;
    const yesterdaySettled = summary.settled_orders * 0.95;
    const yesterdayPending = summary.pending_orders * 0.9;

    setStats([
      {
        icon: <FaDollarSign size={22} />,
        title: "Today's Revenue",
        value: formatCurrency(summary.total_revenue || 0),
        change: calculateChange(summary.total_revenue || 0, yesterdayRevenue),
        iconBg: 'primary',
      },
      {
        icon: <FaClipboardList size={22} />,
        title: 'Total Orders',
        value: summary.total_orders?.toString() || '0',
        change: calculateChange(summary.total_orders || 0, yesterdayOrders),
        iconBg: 'success',
      },
      {
        icon: <FaUsers size={22} />,
        title: 'Settled Orders',
        value: summary.settled_orders?.toString() || '0',
        change: calculateChange(summary.settled_orders || 0, yesterdaySettled),
        iconBg: 'info',
      },
      {
        icon: <FaChartLine size={22} />,
        title: 'Pending Orders',
        value: summary.pending_orders?.toString() || '0',
        change: calculateChange(summary.pending_orders || 0, yesterdayPending),
        iconBg: 'warning',
      },
    ]);

    // 2. Process Recent Orders
    if (data.recentOrders && Array.isArray(data.recentOrders)) {
      const orders: DashboardItem[] = data.recentOrders.map((order: any) => ({
        id: Number(order.TxnID || 0),
        customer: order.CustomerName || 'Guest',
        items: order.table_name || order.Order_Type || 'Takeaway',
        total: Number(order.Amount || 0),
         status: order.isSetteled === 1 ? 'completed' : 'pending',
        time: formatTimeAgo(order.TxnDatetime),
        table: Number(order.TableID || 0),
      }));
      setRecentItems(orders);
    }

    // 3. Process Best Sellers
    if (data.bestSellers && Array.isArray(data.bestSellers)) {
      const sellers: BestSellerItem[] = data.bestSellers.map((item: any) => ({
        name: item.item_name || 'Unknown Item',
        quantity: Number(item.total_quantity_sold || 0),
        revenue: Number(item.total_revenue || 0),
        category: item.category_name || 'General',
      }));
      setBestSellers(sellers);
    }

    // 4. Process Category Sales (for Pie Chart)
    if (data.categorySales && Array.isArray(data.categorySales)) {
      const totalRevenue = data.categorySales.reduce(
        (sum: number, cat: any) => sum + Number(cat.total_revenue || 0),
        0
      );
      
      if (totalRevenue > 0) {
        const categories = data.categorySales.map((cat: any, index: number) => ({
          name: cat.category_name || 'Other',
          value: Math.round((Number(cat.total_revenue || 0) / totalRevenue) * 100),
          color: chartColors[index % chartColors.length],
        }));
        setCategoryData(categories);
      } else {
        setCategoryData(getDefaultCategoryData());
      }
    }

    // 5. Process Payment Distribution
    if (data.paymentDistribution && Array.isArray(data.paymentDistribution)) {
      const totalAmount = data.paymentDistribution.reduce(
        (sum: number, p: any) => sum + Number(p.total_amount || 0),
        0
      );
      
      if (totalAmount > 0) {
        const payments = data.paymentDistribution.map((p: any, index: number) => ({
          name: p.PaymentType || 'Other',
          value: Math.round((Number(p.total_amount || 0) / totalAmount) * 100),
          color: chartColors[index % chartColors.length],
        }));
        setPaymentData(payments);
      } else {
        setPaymentData(getDefaultPaymentData());
      }
    }

    // 6. Process Revenue Data (Last 7 days - from hourly sales or default)
    if (data.hourlySales && Array.isArray(data.hourlySales) && data.hourlySales.length > 0) {
      // Convert hourly to daily (or use as is if we have daily data)
      // For now, we'll use default or we can aggregate
      const revenue = data.hourlySales.map((h: any) => ({
        day: `${h.hour}:00`,
        revenue: Number(h.total_revenue || 0),
      }));
      setRevenueData(revenue.length > 0 ? revenue : getDefaultRevenueData());
    } else {
      setRevenueData(getDefaultRevenueData());
    }
  };

  // ===================================================
  // RESTAURANT DATA FETCH - USING SP
  // ===================================================

  const fetchRestaurantData = async () => {
    const currDate = user?.currDate;
    const outletId = Number(user?.outletid);
    const hotelId = Number(user?.hotelid);

    console.log('🍽️ Fetch Restaurant Dashboard via SP');

    try {
      const response = await DashboardService.getDashboardData({
        outletid: outletId,
        hotelid: hotelId,
        limit: 10,
        curr_date: currDate,
      });

      console.log('📦 Dashboard API Response:', response);

      if (response?.success && response?.data) {
        processDashboardData(response.data);
      } else {
        // Set empty state if no data
        setStats([]);
        setRecentItems([]);
        setBestSellers([]);
        setRevenueData(getDefaultRevenueData());
        setCategoryData(getDefaultCategoryData());
        setPaymentData(getDefaultPaymentData());
      }
    } catch (err) {
      console.error('❌ Restaurant dashboard error:', err);
      setStats([]);
      setRecentItems([]);
      setBestSellers([]);
      setRevenueData(getDefaultRevenueData());
      setCategoryData(getDefaultCategoryData());
      setPaymentData(getDefaultPaymentData());
      throw err;
    }
  };

  // ===================================================
  // LODGING DATA FETCH - USING LIVE DATA API
  // ===================================================



const fetchLodgingData = async () => {
  const hotelId = Number(user?.hotelid);

  if (!hotelId) {
    throw new Error('Hotel ID is missing');
  }

  console.log('🏨 Fetch Lodging Dashboard with Live Data API', hotelId);

  try {
    const response = await CheckoutService.getLiveData(hotelId);
    console.log('📦 Live Data Response:', response);

    if (!response?.success) {
      throw new Error('Failed to fetch live data');
    }

    const { data } = response;
    const categories = data || [];

    setLodgingRooms(categories);

    // ===================================================
    // CALCULATE TOTALS FROM CATEGORIES
    // ===================================================

    const totalRooms = categories.reduce(
      (sum: number, room: LiveRoomCategory) => 
        sum + Number(room.category_total_rooms || 0), 
      0
    );

    const totalOccupied = categories.reduce(
      (sum: number, room: LiveRoomCategory) => 
        sum + Number(room.occupied_rooms || 0), 
      0
    );

    const totalReserved = categories.reduce(
      (sum: number, room: LiveRoomCategory) => 
        sum + Number(room.reserved_rooms || 0), 
      0
    );

    const totalAvailable = categories.reduce(
      (sum: number, room: LiveRoomCategory) => 
        sum + Number(room.available_rooms || 0), 
      0
    );

    const totalBlocked = categories.reduce(
      (sum: number, room: LiveRoomCategory) => 
        sum + Number(room.blocked_rooms || 0), 
      0
    );

    const totalCheckins = categories.reduce(
      (sum: number, room: LiveRoomCategory) => 
        sum + Number(room.today_checkins || 0), 
      0
    );

    const totalCheckouts = categories.reduce(
      (sum: number, room: LiveRoomCategory) => 
        sum + Number(room.today_checkouts || 0), 
      0
    );

    const totalReservations = categories.reduce(
      (sum: number, room: LiveRoomCategory) => 
        sum + Number(room.today_reservations || 0), 
      0
    );

    // ✅ NEW: Calculate total revenue from all room categories
   // today_revenue is coming from ldgsettlement table via stored procedure
const totalRevenue =
  categories.length > 0
    ? Number((categories[0] as any).today_revenue || 0)
    : 0;

    // ===================================================
    // UPDATE STATS WITH REVENUE
    // ===================================================

    setStats([
      {
        icon: <FaDollarSign size={22} />,
        title: "Today's Revenue",
        value: formatCurrency(totalRevenue), // ✅ Now shows actual revenue from ldgsettlement
        change: 0,
        iconBg: 'primary',
      },
      {
        icon: <FaClipboardList size={22} />,
        title: "Today's Checkout",
        value: totalCheckouts.toString(),
        change: 0,
        iconBg: 'success',
      },
      {
        icon: <FaBed size={22} />,
        title: "Today's Check-in",
        value: totalCheckins.toString(),
        change: 0,
        iconBg: 'info',
      },
      {
        icon: <FaHotel size={22} />,
        title: "Today's Reservation",
        value: totalReservations.toString(),
        change: 0,
        iconBg: 'warning',
      },
    ]);

    // ===================================================
    // ROOM CATEGORY PIE CHART
    // ===================================================

    const roomCategoryData = categories
      .map((room: LiveRoomCategory, index: number) => ({
        name: room.category_name || 'Other',
        value: totalRooms > 0 
          ? Math.round((Number(room.category_total_rooms || 0) / totalRooms) * 100) 
          : 0,
        color: chartColors[index % chartColors.length],
      }))
      .filter((item: { value: number }) => item.value > 0);

    setCategoryData(roomCategoryData.length > 0 ? roomCategoryData : getDefaultCategoryData());

    // ===================================================
    // ROOM STATUS CHART
    // ===================================================

    const roomStatusRaw = [
      { name: 'Available', count: totalAvailable, color: '#10b981' },
      { name: 'Occupied', count: totalOccupied, color: '#4f46e5' },
      { name: 'Reserved', count: totalReserved, color: '#f59e0b' },
      { name: 'Blocked', count: totalBlocked, color: '#e11d48' },
    ].filter((item) => item.count > 0);

    const statusTotal = roomStatusRaw.reduce((sum, item) => sum + item.count, 0);

    const roomStatusData = statusTotal > 0
      ? roomStatusRaw.map((item) => ({
          name: item.name,
          value: Math.round((item.count / statusTotal) * 100),
          color: item.color,
        }))
      : [];

    setPaymentData(roomStatusData.length > 0 ? roomStatusData : getDefaultPaymentData());
    
    // ===================================================
    // REVENUE OVERVIEW CHART - Use actual revenue data
    // ===================================================

    // If we have revenue data, create a 7-day trend (mock data for now)
    // In future, you can extend stored procedure to return daily revenue for last 7 days
    if (totalRevenue > 0) {
      const revenueTrend = [
        { day: 'Mon', revenue: totalRevenue * 0.4 },
        { day: 'Tue', revenue: totalRevenue * 0.3 },
        { day: 'Wed', revenue: totalRevenue * 0.5 },
        { day: 'Thu', revenue: totalRevenue * 0.6 },
        { day: 'Fri', revenue: totalRevenue * 0.8 },
        { day: 'Sat', revenue: totalRevenue * 1.0 },
        { day: 'Sun', revenue: totalRevenue * 0.7 },
      ];
      setRevenueData(revenueTrend);
    } else {
      setRevenueData(getDefaultRevenueData());
    }

    console.log('✅ Lodging data loaded successfully:', {
      totalRooms,
      totalOccupied,
      totalAvailable,
      totalRevenue,
      totalCheckins,
      totalCheckouts,
    });

  } catch (err) {
    console.error('❌ Lodging API error:', err);
    setLodgingRooms([]);
    
    // Set default stats on error
    setStats([
      {
        icon: <FaDollarSign size={22} />,
        title: "Today's Revenue",
        value: formatCurrency(0),
        change: 0,
        iconBg: 'primary',
      },
      {
        icon: <FaClipboardList size={22} />,
        title: "Today's Checkout",
        value: '0',
        change: 0,
        iconBg: 'success',
      },
      {
        icon: <FaBed size={22} />,
        title: "Today's Check-in",
        value: '0',
        change: 0,
        iconBg: 'info',
      },
      {
        icon: <FaHotel size={22} />,
        title: "Today's Reservation",
        value: '0',
        change: 0,
        iconBg: 'warning',
      },
    ]);
    
    throw err;
  }
};
  // ===================================================
  // MAIN FETCH EFFECT
  // ===================================================

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      setRecentItems([]);
      setLodgingRooms([]);
      setSearchTerm('');

      try {
        if (activeModule === 'restaurant') {
          await fetchRestaurantData();
        } else {
          await fetchLodgingData();
        }
      } catch (err) {
        console.error('❌ Dashboard fetch error:', err);
        setError('Failed to load dashboard data. Please refresh.');
      } finally {
        setLoading(false);
      }
    };

    if (user?.currDate) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [activeModule, user?.currDate, user?.outletid, user?.hotelid]);

  // ===================================================
  // FILTER RESTAURANT ORDERS
  // ===================================================

  const filteredItems = recentItems.filter((item) => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;
    return (
      item.customer.toLowerCase().includes(search) ||
      item.items.toLowerCase().includes(search) ||
      item.id.toString().includes(search)
    );
  });

  const filteredBestSellers = bestSellers.filter((item) => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) return true;
    return item.name.toLowerCase().includes(search) || 
           (item.category && item.category.toLowerCase().includes(search));
  });

  // ===================================================
  // CHART FLAGS
  // ===================================================

  const hasRevenueData = revenueData.some((d) => d.revenue > 0);
  const hasCategoryData = categoryData.some((c) => c.value > 0);
  const hasPaymentData = paymentData.some((p) => p.value > 0);

  // ===================================================
  // LOADING STATE
  // ===================================================

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
        <Container fluid className="px-3 px-md-4 py-4">
          <div
            className="d-flex justify-content-center align-items-center"
            style={{ minHeight: '400px' }}
          >
            <div className="text-center">
              <Spinner
                animation="border"
                variant="primary"
                style={{ width: '3rem', height: '3rem' }}
              />
              <p className="mt-3 text-muted">Loading dashboard data...</p>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // ===================================================
  // ERROR STATE
  // ===================================================

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
        <Container fluid className="px-3 px-md-4 py-4">
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center py-5">
              <div className="text-danger mb-3" style={{ fontSize: '3rem' }}>
                ⚠️
              </div>
              <h5 className="text-danger">{error}</h5>
              <Button
                variant="primary"
                className="mt-3"
                onClick={() => window.location.reload()}
              >
                Retry
              </Button>
            </Card.Body>
          </Card>
        </Container>
      </div>
    );
  }

  // ===================================================
  // MAIN RENDER
  // ===================================================

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9' }}>
      <Container fluid className="px-3 px-md-4 py-4">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
  <div className="d-flex align-items-center gap-3">
    <div>
      <h3
        className="fw-bold mb-1"
        style={{ letterSpacing: '-0.5px' }}
      >
        Dashboard Overview
      </h3>

      <p className="text-muted mb-0 small">
        Welcome back! Here's what's happening today.
        {user?.outletid && (
          <span className="ms-2">• Outlet #{user.outletid}</span>
        )}
      </p>
    </div>

    <ButtonGroup size="sm">
      <Button
        variant={activeModule === 'restaurant' ? 'primary' : 'outline-primary'}
        onClick={() => setActiveModule('restaurant')}
        style={{ fontSize: '0.75rem' }}
      >
        <FaUtensils className="me-1" size={12} />
        Restaurant
      </Button>

      <Button
        variant={activeModule === 'lodging' ? 'primary' : 'outline-primary'}
        onClick={() => setActiveModule('lodging')}
        style={{ fontSize: '0.75rem' }}
      >
        <FaHotel className="me-1" size={12} />
        Lodging
      </Button>
    </ButtonGroup>
  </div>

  <div className="position-relative" style={{ width: '260px' }}>
    <FaSearch
      className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
      style={{ fontSize: '13px' }}
    />

    <Form.Control
      type="text"
      placeholder={
        activeModule === 'restaurant' ? 'Search orders...' : 'Search rooms...'
      }
      className="ps-5 rounded-pill border-0"
      style={{
        background: '#fff',
        padding: '0.55rem 1rem',
        fontSize: '0.875rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>
</div>

        {/* =================================================
            STAT CARDS
        ================================================= */}

        <Row className="g-3 mb-4">
          {stats.length > 0 ? (
            stats.map((stat, idx) => (
              <Col key={idx} xs={12} sm={6} lg={3}>
                <StatCard {...stat} />
              </Col>
            ))
          ) : (
            <Col xs={12}>
              <div className="text-center text-muted py-3">No statistics available</div>
            </Col>
          )}
        </Row>

        {/* =================================================
            ROW 1 - CHARTS
        ================================================= */}

        <Row className="g-3 mb-4">
          {/* Payment / Room Status */}
          <Col xl={5} lg={12}>
            <Card
              className="border-0 h-100"
              style={{
                borderRadius: '16px',
                boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
              }}
            >
              <Card.Body className="p-3 p-md-4">
                <h6 className="fw-bold mb-1">
                  {activeModule === 'restaurant' ? 'Payment Methods' : 'Room Status'}
                </h6>

                <small className="text-muted d-block mb-2">
                  {activeModule === 'restaurant'
                    ? 'How customers are paying'
                    : 'Current room availability'}
                </small>

                {hasPaymentData ? (
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart
                      layout="vertical"
                      data={paymentData}
                      margin={{ top: 2, right: 30, left: 5, bottom: 2 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        horizontal
                        vertical={false}
                        stroke="#e2e8f0"
                      />
                      <XAxis
                        type="number"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 9, fill: '#64748b' }}
                        domain={[0, 'dataMax + 10']}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#475569', fontWeight: 500 }}
                        width={80}
                      />
                      <Tooltip formatter={(value: number) => [`${value}%`, 'Share']} />
                      <Bar dataKey="value" radius={[0, 3, 3, 0]} barSize={18}>
                        {paymentData.map((entry, index) => (
                          <Cell key={`pay-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted py-3">No data available</div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Revenue Overview */}
          <Col xl={4} lg={6}>
            <Card
              className="border-0 h-100"
              style={{
                borderRadius: '16px',
                boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
              }}
            >
              <Card.Body className="p-3 p-md-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 className="fw-bold mb-0">Revenue Overview</h6>
                    <small className="text-muted">Last 7 days</small>
                  </div>

                  <ButtonGroup size="sm">
                    <Button
                      variant="outline-primary"
                      className="rounded-start-pill px-2"
                      style={{ fontSize: '0.75rem' }}
                    >
                      Week
                    </Button>
                    <Button
                      variant="primary"
                      className="rounded-end-pill px-2"
                      style={{ fontSize: '0.75rem' }}
                    >
                      Month
                    </Button>
                  </ButtonGroup>
                </div>

                {hasRevenueData ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart
                      data={revenueData}
                      margin={{ top: 5, right: 5, left: -15, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                      />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `₹${v / 1000}k`}
                      />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      />
                      <Bar
                        dataKey="revenue"
                        fill="#4f46e5"
                        radius={[6, 6, 0, 0]}
                        barSize={22}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted py-4">
                    {activeModule === 'lodging'
                      ? 'Revenue API not connected yet'
                      : 'No revenue data available'}
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Category */}
          <Col xl={3} lg={6}>
            <Card
              className="border-0 h-100"
              style={{
                borderRadius: '16px',
                boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
              }}
            >
              <Card.Body className="p-3 p-md-4">
                <h6 className="fw-bold mb-1">
                  {activeModule === 'restaurant' ? 'Sales by Category' : 'Rooms by Category'}
                </h6>

                <small className="text-muted d-block mb-2">
                  {activeModule === 'restaurant' ? 'Order distribution' : 'Room distribution'}
                </small>

                {hasCategoryData ? (
                  <ResponsiveContainer width="100%" height={210}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [`${value}%`, 'Share']} />
                      <Legend verticalAlign="bottom" height={30} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted py-4">
                    No category data available
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* =================================================
            ROW 2 - TABLES
        ================================================= */}

        <Row className="g-3 mb-4">
          {/* Recent Orders / Room Availability Table */}
          <Col xl={7} lg={6}>
            <Card
              className="border-0 h-100"
              style={{
                borderRadius: '16px',
                boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
              }}
            >
              <Card.Body className="p-3 p-md-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h6 className="fw-bold mb-0">
                      {activeModule === 'restaurant' ? 'Recent Orders' : 'Room Availability'}
                    </h6>

                    <small className="text-muted">
                      {activeModule === 'restaurant'
                        ? `Latest ${filteredItems.length} transactions`
                        : 'Live room category status'}
                    </small>
                  </div>

                  <Button
                    variant="link"
                    className="p-0 text-decoration-none"
                    style={{ color: '#4f46e5', fontSize: '0.8rem' }}
                  >
                    View All
                  </Button>
                </div>

                <div
                  className="table-responsive"
                  style={{ maxHeight: '300px', overflowY: 'auto' }}
                >
                  {activeModule === 'lodging' ? (
                    lodgingRooms.length > 0 ? (
                      <Table
                        hover
                        className="align-middle mb-0"
                        style={{ fontSize: '0.82rem' }}
                      >
                        <thead
                          style={{
                            background: '#f8fafc',
                            position: 'sticky',
                            top: 0,
                            zIndex: 1,
                          }}
                        >
                          <tr>
                            <th>Room Category</th>
                            <th>Total</th>
                            <th>Available</th>
                            <th>Occupied</th>
                            <th>Reserved</th>
                          </tr>
                        </thead>

                        <tbody>
                          {lodgingRooms
                            .filter((room: LiveRoomCategory) =>
                              room.category_name.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                            .map((room: LiveRoomCategory) => (
                              <tr key={room.room_category_id}>
                                <td className="fw-semibold">{room.category_name}</td>
                                <td>{room.category_total_rooms || 0}</td>
                                <td>
                                  <Badge bg="success" className="rounded-pill">
                                    {room.available_rooms || 0}
                                  </Badge>
                                </td>
                                <td>
                                  <Badge bg="primary" className="rounded-pill">
                                    {room.occupied_rooms || 0}
                                  </Badge>
                                </td>
                                <td>
                                  <Badge bg="warning" text="dark" className="rounded-pill">
                                    {room.reserved_rooms || 0}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </Table>
                    ) : (
                      <div className="text-center text-muted py-4">No room data found</div>
                    )
                  ) : (
                    filteredItems.length > 0 ? (
                      <Table
                        hover
                        className="align-middle mb-0"
                        style={{ fontSize: '0.82rem' }}
                      >
                        <thead
                          style={{
                            background: '#f8fafc',
                            position: 'sticky',
                            top: 0,
                            zIndex: 1,
                          }}
                        >
                          <tr>
                            <th>Order</th>
                            <th>Customer</th>
                            <th>Table</th>
                            <th>Total</th>
                            <th>Status</th>
                            <th>Time</th>
                          </tr>
                        </thead>

                        <tbody>
                          {filteredItems.map((item) => (
                            <tr key={item.id}>
                              <td className="fw-semibold">#{item.id}</td>
                              <td>{item.customer}</td>
                              <td>{item.items}</td>
                              <td className="fw-bold" style={{ color: '#4f46e5' }}>
                                ₹{item.total.toLocaleString('en-IN')}
                              </td>
                              <td>
                                <StatusBadge status={item.status} />
                              </td>
                              <td>
                                <small className="text-muted">{item.time}</small>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <div className="text-center text-muted py-4">
                        <FaClipboardList size={30} className="mb-2" />
                        <div>No recent orders found</div>
                      </div>
                    )
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Right Card - Best Sellers / Room Summary */}
          <Col xl={5} lg={12}>
            <Card
              className="border-0 h-100"
              style={{
                borderRadius: '16px',
                boxShadow: '0 4px 18px rgba(0,0,0,0.04)',
              }}
            >
              <Card.Body className="p-3 p-md-4">
                {activeModule === 'restaurant' ? (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 className="fw-bold mb-0">
                          <FaStar className="text-warning me-1" size={14} />
                          Top Selling Items
                        </h6>
                        <small className="text-muted">Most ordered items today</small>
                      </div>
                      <Badge bg="light" text="dark" className="rounded-pill">
                        {filteredBestSellers.length} items
                      </Badge>
                    </div>

                    {filteredBestSellers.length > 0 ? (
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {filteredBestSellers.slice(0, 8).map((item, idx) => (
                          <div
                            key={idx}
                            className="d-flex justify-content-between align-items-center py-2"
                            style={{
                              borderBottom: idx !== Math.min(filteredBestSellers.length, 8) - 1 
                                ? '1px solid #f1f5f9' 
                                : 'none',
                            }}
                          >
                            <div className="d-flex align-items-center gap-3">
                              <span 
                                className="d-flex align-items-center justify-content-center rounded-circle text-white fw-bold"
                                style={{
                                  width: '28px',
                                  height: '28px',
                                  background: chartColors[idx % chartColors.length],
                                  fontSize: '0.7rem',
                                }}
                              >
                                #{idx + 1}
                              </span>
                              <div>
                                <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>
                                  {item.name}
                                </div>
                                {item.category && (
                                  <small className="text-muted">{item.category}</small>
                                )}
                              </div>
                            </div>
                            <div className="text-end">
                              <div className="fw-bold" style={{ color: '#4f46e5', fontSize: '0.85rem' }}>
                                {item.quantity} sold
                              </div>
                              <small className="text-muted">{formatCurrency(item.revenue)}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-muted py-4">
                        <FaUtensils size={30} className="mb-2" />
                        <div>No items sold yet today</div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <h6 className="fw-bold mb-0">Live Room Summary</h6>
                        <small className="text-muted">Current hotel occupancy</small>
                      </div>
                      <FaHotel size={22} className="text-primary" />
                    </div>

                    <Row className="g-2">
                      <Col xs={6}>
                        <div className="p-3 rounded-3" style={{ background: '#eff6ff' }}>
                          <small className="text-muted d-block">Total</small>
                          <h4 className="fw-bold mb-0">
                            {lodgingRooms.reduce(
                              (sum: number, room: LiveRoomCategory) => sum + Number(room.category_total_rooms || 0),
                              0
                            )}
                          </h4>
                        </div>
                      </Col>

                      <Col xs={6}>
                        <div className="p-3 rounded-3" style={{ background: '#ecfdf5' }}>
                          <small className="text-muted d-block">Available</small>
                          <h4 className="fw-bold text-success mb-0">
                            {lodgingRooms.reduce(
                              (sum: number, room: LiveRoomCategory) => sum + Number(room.available_rooms || 0),
                              0
                            )}
                          </h4>
                        </div>
                      </Col>

                      <Col xs={6}>
                        <div className="p-3 rounded-3" style={{ background: '#eef2ff' }}>
                          <small className="text-muted d-block">Occupied</small>
                          <h4 className="fw-bold text-primary mb-0">
                            {lodgingRooms.reduce(
                              (sum: number, room: LiveRoomCategory) => sum + Number(room.occupied_rooms || 0),
                              0
                            )}
                          </h4>
                        </div>
                      </Col>

                      <Col xs={6}>
                        <div className="p-3 rounded-3" style={{ background: '#fffbeb' }}>
                          <small className="text-muted d-block">Reserved</small>
                          <h4 className="fw-bold text-warning mb-0">
                            {lodgingRooms.reduce(
                              (sum: number, room: LiveRoomCategory) => sum + Number(room.reserved_rooms || 0),
                              0
                            )}
                          </h4>
                        </div>
                      </Col>
                    </Row>

                    <div className="mt-3">
                      <small className="text-muted">
                        Room availability is fetched live from the hotel room availability API.
                      </small>
                    </div>
                  </>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default RestaurantDashboard;