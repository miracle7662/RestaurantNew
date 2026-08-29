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
import HandoverService from '@/common/api/handover';
import OrderService from '@/common/api/order';
import RoomService from '@/common/hotel/room';
import { SettlementService } from '@/common/api';

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
  status:
    | 'completed'
    | 'pending'
    | 'cancelled'
    | 'preparing'
    | 'delivered';
  time: string;
  table?: number;
}

interface ReviewItem {
  name: string;
  rating: number;
  comment: string;
  time: string;
}

interface HandoverSummary {
  totalOrders: number;
  totalKOTs: number;
  totalSales: number;
  completed: number;
  reverseKOT?: number;
}

interface LiveRoomCategory {
  room_category_id: number;
  category_name: string;
  total_rooms: number;
  occupied_rooms: number;
  reserved_rooms: number;
  available_rooms: number;
  available_rooms_raw?: number; // ✅ optional
  blocked_rooms: number;
  next_available_from: string | null;
}

interface LiveRoomAvailabilityResponse {
  success: boolean;
  generated_at: string;
  summary: {
    total_rooms: number;
    occupied_rooms: number;
    reserved_rooms: number;
    available_rooms: number;
    blocked_rooms: number;
  };
  categories: LiveRoomCategory[];
}

// =====================================================
// STAT CARD
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
        e.currentTarget.style.boxShadow =
          '0 10px 25px rgba(0,0,0,0.07)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow =
          '0 4px 18px rgba(0,0,0,0.04)';
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
              {isPositive ? (
                <FaArrowUp size={10} />
              ) : (
                <FaArrowDown size={10} />
              )}

              {Math.abs(change)}% from yesterday
            </small>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

// =====================================================
// STATUS BADGE
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

  const { bg, text, icon } =
    map[status] || map.pending;

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
// MAIN DASHBOARD
// =====================================================

const RestaurantDashboard: React.FC = () => {
  const { user } = useAuthContext();

  // ===================================================
  // MODULE
  // ===================================================

  const [activeModule, setActiveModule] =
    useState<DashboardModule>('restaurant');

  // ===================================================
  // COMMON STATE
  // ===================================================

  const [searchTerm, setSearchTerm] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [stats, setStats] =
    useState<StatCardProps[]>([]);

  const [recentItems, setRecentItems] =
    useState<DashboardItem[]>([]);

  const [reviews, setReviews] =
    useState<ReviewItem[]>([]);

  const [revenueData, setRevenueData] =
    useState<
      { day: string; revenue: number }[]
    >([]);

  const [categoryData, setCategoryData] =
    useState<
      {
        name: string;
        value: number;
        color: string;
      }[]
    >([]);

  const [paymentData, setPaymentData] =
    useState<
      {
        name: string;
        value: number;
        color: string;
      }[]
    >([]);

  // ===================================================
  // LODGING STATE
  // ===================================================

  const [lodgingRooms, setLodgingRooms] =
    useState<LiveRoomCategory[]>([]);

  // ===================================================
  // COLORS
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
  // HELPERS
  // ===================================================

  const calculateChange = (
    current: number,
    previous: number
  ): number => {
    if (!previous || previous === 0) {
      return 0;
    }

    return Number(
      (
        ((current - previous) /
          previous) *
        100
      ).toFixed(1)
    );
  };

  const formatCurrency = (
    amount: number
  ): string => {
    return `₹${Number(
      amount || 0
    ).toLocaleString('en-IN')}`;
  };

  const formatTimeAgo = (
    datetime: string
  ): string => {
    if (!datetime) {
      return 'Just now';
    }

    const date = new Date(datetime);
    const now = new Date();

    const diffMs =
      now.getTime() -
      date.getTime();

    const diffMins =
      Math.floor(
        diffMs / 60000
      );

    if (diffMins < 1) {
      return 'Just now';
    }

    if (diffMins < 60) {
      return `${diffMins} min ago`;
    }

    if (diffMins < 1440) {
      return `${Math.floor(
        diffMins / 60
      )} hours ago`;
    }

    return `${Math.floor(
      diffMins / 1440
    )} days ago`;
  };

  const formatNextAvailable = (
    datetime: string | null
  ): string => {
    if (!datetime) {
      return 'Now';
    }

    const date = new Date(datetime);

    if (isNaN(date.getTime())) {
      return 'Available later';
    }

    return date.toLocaleString(
      'en-IN',
      {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  };

  // ===================================================
  // RESTAURANT STATUS
  // ===================================================

  const mapRestaurantStatus = (
    bill: any
  ): DashboardItem['status'] => {
    if (
      Number(bill.isCancelled) === 1
    ) {
      return 'cancelled';
    }

    if (
      Number(bill.isBilled) === 1 ||
      Number(bill.isSetteled) === 1
    ) {
      return 'completed';
    }

    return 'pending';
  };

  // ===================================================
  // DEFAULT DATA
  // ===================================================

  const getDefaultRevenueData = () => {
    return [
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
    ].map((day) => ({
      day,
      revenue: 0,
    }));
  };

  const getDefaultCategoryData = () => {
    return [
      {
        name: 'Main Course',
        value: 42,
        color: chartColors[0],
      },
      {
        name: 'Starters',
        value: 23,
        color: chartColors[1],
      },
      {
        name: 'Beverages',
        value: 15,
        color: chartColors[2],
      },
      {
        name: 'Desserts',
        value: 12,
        color: chartColors[3],
      },
      {
        name: 'Others',
        value: 8,
        color: chartColors[4],
      },
    ];
  };

  const getDefaultPaymentData = () => {
    return [
      {
        name: 'Card',
        value: 48,
        color: chartColors[0],
      },
      {
        name: 'UPI',
        value: 28,
        color: chartColors[2],
      },
      {
        name: 'Cash',
        value: 18,
        color: chartColors[4],
      },
      {
        name: 'Wallet',
        value: 6,
        color: chartColors[3],
      },
    ];
  };

  // ===================================================
  // REVENUE PROCESSING
  // ===================================================

  const processRevenueData = (
    data: any[]
  ) => {
    if (
      !Array.isArray(data) ||
      data.length === 0
    ) {
      return [];
    }

    const days = [
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
    ];

    const dayMap: Record<
      string,
      number
    > = {};

    data.forEach((item: any) => {
      const rawDate =
        item.created_at ||
        item.InsertDate ||
        item.date ||
        item.TxnDatetime;

      if (!rawDate) {
        return;
      }

      const date =
        new Date(rawDate);

      if (isNaN(date.getTime())) {
        return;
      }

      const day =
        days[
          date.getDay() === 0
            ? 6
            : date.getDay() - 1
        ];

      const amount = Number(
        item.Amount ||
          item.amount ||
          item.total ||
          item.amount_paid ||
          0
      );

      dayMap[day] =
        (dayMap[day] || 0) +
        amount;
    });

    return days.map(
      (day) => ({
        day,
        revenue:
          dayMap[day] || 0,
      })
    );
  };

  // ===================================================
  // CATEGORY PROCESSING
  // ===================================================

  const processCategoryData = (
    data: any[]
  ) => {
    if (
      !Array.isArray(data) ||
      data.length === 0
    ) {
      return [];
    }

    const categoryMap: Record<
      string,
      number
    > = {};

    data.forEach(
      (item: any) => {
        const category =
          item.Order_Type ||
          item.room_type ||
          item.RoomType ||
          item.category ||
          item.table_name ||
          'Other';

        categoryMap[category] =
          (categoryMap[category] ||
            0) + 1;
      }
    );

    const total =
      Object.values(
        categoryMap
      ).reduce(
        (a, b) => a + b,
        0
      );

    if (!total) {
      return [];
    }

    return Object.entries(
      categoryMap
    )
      .sort(
        ([, a], [, b]) =>
          b - a
      )
      .slice(0, 5)
      .map(
        (
          [name, value],
          index
        ) => ({
          name:
            name || 'Other',
          value: Math.round(
            (value / total) *
              100
          ),
          color:
            chartColors[
              index %
                chartColors.length
            ],
        })
      );
  };

  // ===================================================
  // PAYMENT PROCESSING
  // ===================================================

  const processPaymentData = (
    data: any[]
  ) => {
    if (
      !Array.isArray(data) ||
      data.length === 0
    ) {
      return [];
    }

    const paymentMap: Record<
      string,
      number
    > = {};

    data.forEach(
      (item: any) => {
        const type =
          item.PaymentType ||
          item.payment_type ||
          item.method ||
          item.payment_method ||
          item.type ||
          'Other';

        let cleanType =
          String(type).trim();

        const lowerType =
          cleanType.toLowerCase();

        if (
          lowerType.includes('card')
        ) {
          cleanType = 'Card';
        } else if (
          lowerType.includes('upi')
        ) {
          cleanType = 'UPI';
        } else if (
          lowerType.includes('cash')
        ) {
          cleanType = 'Cash';
        } else if (
          lowerType.includes('wallet')
        ) {
          cleanType = 'Wallet';
        } else if (
          lowerType.includes('zomato')
        ) {
          cleanType = 'Zomato';
        } else if (
          lowerType.includes('room') ||
          lowerType.includes('credit')
        ) {
          cleanType = 'Room Credit';
        } else if (
          lowerType.includes('paytm')
        ) {
          cleanType = 'Paytm';
        } else if (
          lowerType.includes('google') ||
          lowerType.includes('gpay')
        ) {
          cleanType = 'Google Pay';
        }

        const amount = Number(
          item.Amount ||
            item.amount ||
            item.total ||
            item.amount_paid ||
            0
        );

        paymentMap[cleanType] =
          (paymentMap[cleanType] || 0) +
          amount;
      }
    );

    const total =
      Object.values(
        paymentMap
      ).reduce(
        (a, b) => a + b,
        0
      );

    return Object.entries(
      paymentMap
    )
      .sort(
        ([, a], [, b]) =>
          b - a
      )
      .map(
        (
          [name, value],
          index
        ) => ({
          name,
          value:
            total > 0
              ? Math.round(
                  (value / total) *
                    100
                )
              : 0,
          color:
            chartColors[
              index %
                chartColors.length
            ],
        })
      );
  };

  // ===================================================
  // RESTAURANT DATA
  // ===================================================

  const fetchRestaurantData =
    async () => {
      const currDate =
        user?.currDate;

      const outletId =
        Number(
          user?.outletid
        );

      const hotelId =
        Number(
          user?.hotelid
        );

      console.log(
        '🍽️ Fetch Restaurant Dashboard'
      );

      // =================================================
      // HANDOVER
      // =================================================

      try {
        const response =
          await HandoverService.getHandoverData(
            {
              curr_date:
                currDate,
            }
          );

        if (
          response?.success &&
          response?.data?.summary
        ) {
          const summary: HandoverSummary =
            response.data.summary;

          const yesterdaySales =
            summary.totalSales * 0.9;

          const yesterdayOrders =
            summary.totalOrders * 0.92;

          const yesterdayKOTs =
            summary.totalKOTs * 0.95;

          const yesterdayReverseKOT =
            (summary.reverseKOT || 0) *
            0.9;

          setStats([
            {
              icon: <FaDollarSign size={22} />,
              title: "Today's Revenue",
              value: formatCurrency(
                summary.totalSales || 0
              ),
              change: calculateChange(
                summary.totalSales || 0,
                yesterdaySales
              ),
              iconBg: 'primary',
            },
            {
              icon: <FaClipboardList size={22} />,
              title: 'Total Orders',
              value:
                summary.totalOrders?.toString() ||
                '0',
              change: calculateChange(
                summary.totalOrders || 0,
                yesterdayOrders
              ),
              iconBg: 'success',
            },
            {
              icon: <FaUsers size={22} />,
              title: 'Total KOTs',
              value:
                summary.totalKOTs?.toString() ||
                '0',
              change: calculateChange(
                summary.totalKOTs || 0,
                yesterdayKOTs
              ),
              iconBg: 'info',
            },
            {
              icon: <FaChartLine size={22} />,
              title: 'Reverse KOT',
              value:
                summary.reverseKOT?.toString() ||
                '0',
              change: calculateChange(
                summary.reverseKOT || 0,
                yesterdayReverseKOT
              ),
              iconBg: 'warning',
            },
          ]);
        }
      } catch (err) {
        console.error(
          '❌ Restaurant handover error:',
          err
        );
      }

      // =================================================
      // RECENT ORDERS
      // =================================================

      try {
        console.log(
          '📦 Fetching Recent Orders...',
          {
            currDate,
            outletId,
            hotelId,
          }
        );

        const response =
          await OrderService.getAllBills(
            {
              curr_date: currDate,
            },
            user
          );

        console.log(
          '📦 Orders API Response:',
          response
        );

        if (
          response?.success &&
          Array.isArray(
            response.data
          )
        ) {
          const orders =
            response.data;

          console.log(
            '📦 Total Orders:',
            orders.length
          );

          // -------------------------------------------------
          // CANCELLED ORDERS REMOVE
          // -------------------------------------------------

          const validOrders =
            orders.filter(
              (bill: any) =>
                Number(
                  bill.isCancelled
                ) !== 1
            );

          // -------------------------------------------------
          // LATEST ORDERS
          // -------------------------------------------------

          const recentOrders =
            [...validOrders]
              .sort(
                (
                  a: any,
                  b: any
                ) => {
                  const dateA =
                    new Date(
                      a.TxnDatetime ||
                        a.created_at ||
                        0
                    ).getTime();

                  const dateB =
                    new Date(
                      b.TxnDatetime ||
                        b.created_at ||
                        0
                    ).getTime();

                  return (
                    dateB -
                    dateA
                  );
                }
              )
              .slice(0, 10);

          // -------------------------------------------------
          // TRANSFORM ORDERS
          // -------------------------------------------------

          const transformedOrders: DashboardItem[] =
            recentOrders.map(
              (
                bill: any
              ) => ({
                id: Number(
                  bill.TxnID ||
                    bill.id ||
                    0
                ),

                customer:
                  bill.CustomerName ||
                  bill.customer_name ||
                  'Guest',

                items:
                  bill.table_name ||
                  bill.TableName ||
                  bill.table ||
                  'Takeaway',

                total: Number(
                  bill.Amount ||
                    bill.amount ||
                    bill.TotalAmount ||
                    bill.total ||
                    0
                ),

                status:
                  mapRestaurantStatus(
                    bill
                  ),

                time:
                  formatTimeAgo(
                    bill.TxnDatetime ||
                      bill.created_at
                  ),

                table:
                  Number(
                    bill.TableID ||
                      bill.table_id ||
                      0
                  ),
              })
            );

          console.log(
            '✅ Recent Orders:',
            transformedOrders
          );

          setRecentItems(
            transformedOrders
          );

          // -------------------------------------------------
          // CATEGORY
          // -------------------------------------------------

          const categories =
            processCategoryData(
              orders
            );

          setCategoryData(
            categories.length
              ? categories
              : getDefaultCategoryData()
          );
        } else {
          console.warn(
            '⚠️ No orders found'
          );

          setRecentItems([]);

          setCategoryData(
            getDefaultCategoryData()
          );
        }
      } catch (err) {
        console.error(
          '❌ Restaurant orders error:',
          err
        );

        setRecentItems([]);

        setCategoryData(
          getDefaultCategoryData()
        );
      }

      // =================================================
      // SETTLEMENT
      // =================================================

      try {
        const response =
          await SettlementService.list(
            {
              outletid:
                outletId,
              hotelid:
                hotelId,
              q: currDate,
            }
          );

        if (
          response?.success &&
          Array.isArray(
            response.data
          )
        ) {
          const revenue =
            processRevenueData(
              response.data
            );

          const payments =
            processPaymentData(
              response.data
            );

          setRevenueData(
            revenue.length
              ? revenue
              : getDefaultRevenueData()
          );

          setPaymentData(
            payments.length
              ? payments
              : getDefaultPaymentData()
          );
        } else {
          setRevenueData(
            getDefaultRevenueData()
          );

          setPaymentData(
            getDefaultPaymentData()
          );
        }
      } catch (err) {
        console.error(
          '❌ Restaurant settlement error:',
          err
        );

        setRevenueData(
          getDefaultRevenueData()
        );

        setPaymentData(
          getDefaultPaymentData()
        );
      }
    };

  // ===================================================
  // LODGING DATA
  // ===================================================

  const fetchLodgingData =
    async () => {
      const hotelId =
        Number(
          user?.hotelid
        );

      if (!hotelId) {
        throw new Error(
          'Hotel ID is missing'
        );
      }

      console.log(
        '🏨 Fetch Lodging Dashboard',
        hotelId
      );

      try {
        const response =
          await RoomService.getLiveRoomAvailability(
            hotelId
          );

        console.log(
          '📦 Live Room Availability:',
          response
        );

        const summary =
          response?.summary;

        const categories =
          Array.isArray(
            response?.categories
          )
            ? response.categories
            : [];

        // IMPORTANT
        // Lodging table ke liye state set karo
        setLodgingRooms(
          categories
        );

        // =================================================
        // STATS
        // =================================================

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
            title: 'Total Rooms',
            value: Number(
              summary?.total_rooms || 0
            ),
            change: 0,
            iconBg: 'success',
          },
          {
            icon: <FaBed size={22} />,
            title: 'Occupied Rooms',
            value: Number(
              summary?.occupied_rooms || 0
            ),
            change: 0,
            iconBg: 'info',
          },
          {
            icon: <FaHotel size={22} />,
            title: 'Available Rooms',
            value: Number(
              summary?.available_rooms || 0
            ),
            change: 0,
            iconBg: 'warning',
          },
        ]);

        // =================================================
        // ROOM CATEGORY
        // =================================================

        const totalRooms =
          Number(
            summary?.total_rooms || 0
          );

        const roomCategoryData =
          categories
            .map(
              (
                room,
                index
              ) => ({
                name:
                  room.category_name ||
                  'Other',

                value:
                  totalRooms > 0
                    ? Math.round(
                        (Number(
                          room.total_rooms ||
                            0
                        ) /
                          totalRooms) *
                          100
                      )
                    : 0,

                color:
                  chartColors[
                    index %
                      chartColors.length
                  ],
              })
            )
            .filter(
              item =>
                item.value > 0
            );

        setCategoryData(
          roomCategoryData
        );

        // =================================================
        // ROOM STATUS
        // =================================================

        const roomStatusRaw =
          [
            {
              name: 'Available',
              count: Number(
                summary?.available_rooms ||
                  0
              ),
              color: '#10b981',
            },
            {
              name: 'Occupied',
              count: Number(
                summary?.occupied_rooms ||
                  0
              ),
              color: '#4f46e5',
            },
            {
              name: 'Reserved',
              count: Number(
                summary?.reserved_rooms ||
                  0
              ),
              color: '#f59e0b',
            },
            {
              name: 'Blocked',
              count: Number(
                summary?.blocked_rooms ||
                  0
              ),
              color: '#e11d48',
            },
          ].filter(
            item =>
              item.count > 0
          );

        const statusTotal =
          roomStatusRaw.reduce(
            (
              sum,
              item
            ) =>
              sum +
              item.count,
            0
          );

        const roomStatusData =
          statusTotal > 0
            ? roomStatusRaw.map(
                item => ({
                  name:
                    item.name,
                  value:
                    Math.round(
                      (item.count /
                        statusTotal) *
                        100
                    ),
                  color:
                    item.color,
                })
              )
            : [];

        setPaymentData(
          roomStatusData
        );

        // =================================================
        // LODGING REVENUE
        // =================================================

        setRevenueData(
          getDefaultRevenueData()
        );

        console.log(
          '📊 Lodging Summary:',
          summary
        );

        console.log(
          '🏨 Room Categories:',
          categories
        );
      } catch (err) {
        console.error(
          '❌ Lodging API error:',
          err
        );

        setLodgingRooms([]);
        throw err;
      }
    };

  // ===================================================
  // FETCH DASHBOARD
  // ===================================================

  useEffect(() => {
    const fetchDashboardData =
      async () => {
        setLoading(true);
        setError(null);

        // Clear old module data
        setRecentItems([]);
        setLodgingRooms([]);
        setSearchTerm('');

        try {
          if (
            activeModule ===
            'restaurant'
          ) {
            await fetchRestaurantData();

            setReviews([
              {
                name: 'John Doe',
                rating: 5,
                comment:
                  'Amazing food and service! Will definitely come back.',
                time: '2 hours ago',
              },
              {
                name: 'Jane Smith',
                rating: 4,
                comment:
                  'Great atmosphere, food was delicious.',
                time: '4 hours ago',
              },
              {
                name: 'Bob Johnson',
                rating: 3,
                comment:
                  'Good experience but service was a bit slow.',
                time: '6 hours ago',
              },
            ]);
          } else {
            await fetchLodgingData();

            setReviews([]);
          }
        } catch (err) {
          console.error(
            '❌ Dashboard fetch error:',
            err
          );

          setError(
            'Failed to load dashboard data. Please refresh.'
          );
        } finally {
          setLoading(false);
        }
      };

    if (user?.currDate) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [
    activeModule,
    user?.currDate,
    user?.outletid,
    user?.hotelid,
  ]);

  // ===================================================
  // FILTER RESTAURANT ORDERS
  // ===================================================

  const filteredItems =
    recentItems.filter(
      item => {
        const search =
          searchTerm
            .toLowerCase()
            .trim();

        if (!search) {
          return true;
        }

        return (
          item.customer
            .toLowerCase()
            .includes(search) ||
          item.items
            .toLowerCase()
            .includes(search) ||
          item.id
            .toString()
            .includes(search)
        );
      }
    );

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#f1f5f9',
        }}
      >
        <Container
          fluid
          className="px-3 px-md-4 py-4"
        >
          <div
            className="d-flex justify-content-center align-items-center"
            style={{
              minHeight: '400px',
            }}
          >
            <div className="text-center">
              <Spinner
                animation="border"
                variant="primary"
                style={{
                  width: '3rem',
                  height: '3rem',
                }}
              />

              <p className="mt-3 text-muted">
                Loading dashboard data...
              </p>
            </div>
          </div>
        </Container>
      </div>
    );
  }

  // ===================================================
  // ERROR
  // ===================================================

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#f1f5f9',
        }}
      >
        <Container
          fluid
          className="px-3 px-md-4 py-4"
        >
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center py-5">
              <div
                className="text-danger mb-3"
                style={{
                  fontSize: '3rem',
                }}
              >
                ⚠️
              </div>

              <h5 className="text-danger">
                {error}
              </h5>

              <Button
                variant="primary"
                className="mt-3"
                onClick={() =>
                  window.location.reload()
                }
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
  // CHART FLAGS
  // ===================================================

  const hasRevenueData =
    revenueData.some(
      d => d.revenue > 0
    );

  const hasCategoryData =
    categoryData.some(
      c => c.value > 0
    );

  const hasPaymentData =
    paymentData.some(
      p => p.value > 0
    );

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f1f5f9',
      }}
    >
      <Container
        fluid
        className="px-3 px-md-4 py-4"
      >
        {/* =================================================
            TITLE
        ================================================= */}

        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
          <div>
            <h3
              className="fw-bold mb-1"
              style={{
                letterSpacing: '-0.5px',
              }}
            >
              Dashboard Overview
            </h3>

            <p className="text-muted mb-0 small">
              Welcome back! Here's what's happening today.

              {user?.outletid && (
                <span className="ms-2">
                  • Outlet #{user.outletid}
                </span>
              )}
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            {/* MODULE SWITCHER */}

            <ButtonGroup size="sm">
              <Button
                variant={
                  activeModule ===
                  'restaurant'
                    ? 'primary'
                    : 'outline-primary'
                }
                onClick={() =>
                  setActiveModule(
                    'restaurant'
                  )
                }
                style={{
                  fontSize: '0.75rem',
                }}
              >
                Restaurant
              </Button>

              <Button
                variant={
                  activeModule ===
                  'lodging'
                    ? 'primary'
                    : 'outline-primary'
                }
                onClick={() =>
                  setActiveModule(
                    'lodging'
                  )
                }
                style={{
                  fontSize: '0.75rem',
                }}
              >
                Lodging
              </Button>
            </ButtonGroup>

            {/* SEARCH */}

            <div
              className="position-relative"
              style={{
                width: '260px',
              }}
            >
              <FaSearch
                className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
                style={{
                  fontSize: '13px',
                }}
              />

              <Form.Control
                type="text"
                placeholder={
                  activeModule ===
                  'restaurant'
                    ? 'Search orders...'
                    : 'Search rooms...'
                }
                className="ps-5 rounded-pill border-0"
                style={{
                  background: '#fff',
                  padding:
                    '0.55rem 1rem',
                  fontSize:
                    '0.875rem',
                  boxShadow:
                    '0 2px 8px rgba(0,0,0,0.04)',
                }}
                value={searchTerm}
                onChange={e =>
                  setSearchTerm(
                    e.target.value
                  )
                }
              />
            </div>
          </div>
        </div>

        {/* =================================================
            STAT CARDS
        ================================================= */}

        <Row className="g-3 mb-4">
          {stats.map(
            (
              stat,
              idx
            ) => (
              <Col
                key={idx}
                xs={12}
                sm={6}
                lg={3}
              >
                <StatCard
                  {...stat}
                />
              </Col>
            )
          )}
        </Row>

        {/* =================================================
            ROW 1
        ================================================= */}

        <Row className="g-3 mb-4">

          {/* PAYMENT / ROOM STATUS */}

          <Col
            xl={5}
            lg={12}
          >
            <Card
              className="border-0 h-100"
              style={{
                borderRadius: '16px',
                boxShadow:
                  '0 4px 18px rgba(0,0,0,0.04)',
              }}
            >
              <Card.Body className="p-3 p-md-4">

                <h6 className="fw-bold mb-1">
                  {activeModule ===
                  'restaurant'
                    ? 'Payment Methods'
                    : 'Room Status'}
                </h6>

                <small className="text-muted d-block mb-2">
                  {activeModule ===
                  'restaurant'
                    ? 'How customers are paying'
                    : 'Current room availability'}
                </small>

                {hasPaymentData ? (
                  <ResponsiveContainer
                    width="100%"
                    height={160}
                  >
                    <BarChart
                      layout="vertical"
                      data={
                        paymentData
                      }
                      margin={{
                        top: 2,
                        right: 30,
                        left: 5,
                        bottom: 2,
                      }}
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
                        tick={{
                          fontSize: 9,
                          fill: '#64748b',
                        }}
                        domain={[
                          0,
                          'dataMax + 10',
                        ]}
                        tickFormatter={value =>
                          `${value}%`
                        }
                      />

                      <YAxis
                        dataKey="name"
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 10,
                          fill: '#475569',
                          fontWeight: 500,
                        }}
                        width={80}
                      />

                      <Tooltip
                        formatter={(
                          value: number
                        ) => [
                          `${value}%`,
                          'Share',
                        ]}
                      />

                      <Bar
                        dataKey="value"
                        radius={[
                          0,
                          3,
                          3,
                          0,
                        ]}
                        barSize={18}
                      >
                        {paymentData.map(
                          (
                            entry,
                            index
                          ) => (
                            <Cell
                              key={`pay-${index}`}
                              fill={
                                entry.color
                              }
                            />
                          )
                        )}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted py-3">
                    No data available
                  </div>
                )}

              </Card.Body>
            </Card>
          </Col>

          {/* REVENUE */}

          <Col
            xl={4}
            lg={6}
          >
            <Card
              className="border-0 h-100"
              style={{
                borderRadius: '16px',
                boxShadow:
                  '0 4px 18px rgba(0,0,0,0.04)',
              }}
            >
              <Card.Body className="p-3 p-md-4">

                <div className="d-flex justify-content-between align-items-center mb-3">

                  <div>
                    <h6 className="fw-bold mb-0">
                      Revenue Overview
                    </h6>

                    <small className="text-muted">
                      Last 7 days
                    </small>
                  </div>

                  <ButtonGroup size="sm">
                    <Button
                      variant="outline-primary"
                      className="rounded-start-pill px-2"
                      style={{
                        fontSize:
                          '0.75rem',
                      }}
                    >
                      Week
                    </Button>

                    <Button
                      variant="primary"
                      className="rounded-end-pill px-2"
                      style={{
                        fontSize:
                          '0.75rem',
                      }}
                    >
                      Month
                    </Button>
                  </ButtonGroup>

                </div>

                {hasRevenueData ? (
                  <ResponsiveContainer
                    width="100%"
                    height={220}
                  >
                    <BarChart
                      data={
                        revenueData
                      }
                      margin={{
                        top: 5,
                        right: 5,
                        left: -15,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#e2e8f0"
                      />

                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                      />

                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={v =>
                          `₹${v / 1000}k`
                        }
                      />

                      <Tooltip
                        formatter={(
                          value: number
                        ) => [
                          formatCurrency(
                            value
                          ),
                          'Revenue',
                        ]}
                      />

                      <Bar
                        dataKey="revenue"
                        fill="#4f46e5"
                        radius={[
                          6,
                          6,
                          0,
                          0,
                        ]}
                        barSize={22}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted py-4">
                    {activeModule ===
                    'lodging'
                      ? 'Revenue API not connected yet'
                      : 'No revenue data available'}
                  </div>
                )}

              </Card.Body>
            </Card>
          </Col>

          {/* CATEGORY */}

          <Col
            xl={3}
            lg={6}
          >
            <Card
              className="border-0 h-100"
              style={{
                borderRadius: '16px',
                boxShadow:
                  '0 4px 18px rgba(0,0,0,0.04)',
              }}
            >
              <Card.Body className="p-3 p-md-4">

                <h6 className="fw-bold mb-1">
                  {activeModule ===
                  'restaurant'
                    ? 'Sales by Category'
                    : 'Rooms by Category'}
                </h6>

                <small className="text-muted d-block mb-2">
                  {activeModule ===
                  'restaurant'
                    ? 'Order distribution'
                    : 'Room distribution'}
                </small>

                {hasCategoryData ? (
                  <ResponsiveContainer
                    width="100%"
                    height={210}
                  >
                    <PieChart>

                      <Pie
                        data={
                          categoryData
                        }
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map(
                          (
                            entry,
                            index
                          ) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={
                                entry.color
                              }
                            />
                          )
                        )}
                      </Pie>

                      <Tooltip
                        formatter={(
                          value: number
                        ) => [
                          `${value}%`,
                          'Share',
                        ]}
                      />

                      <Legend
                        verticalAlign="bottom"
                        height={30}
                      />

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
            ROW 2
        ================================================= */}

        <Row className="g-3 mb-4">

          {/* =================================================
              RECENT ORDERS / ROOM AVAILABILITY
          ================================================= */}

          <Col
            xl={7}
            lg={6}
          >
            <Card
              className="border-0 h-100"
              style={{
                borderRadius: '16px',
                boxShadow:
                  '0 4px 18px rgba(0,0,0,0.04)',
              }}
            >
              <Card.Body className="p-3 p-md-4">

                <div className="d-flex justify-content-between align-items-center mb-3">

                  <div>
                    <h6 className="fw-bold mb-0">
                      {activeModule ===
                      'restaurant'
                        ? 'Recent Orders'
                        : 'Room Availability'}
                    </h6>

                    <small className="text-muted">
                      {activeModule ===
                      'restaurant'
                        ? `Latest ${filteredItems.length} transactions`
                        : 'Live room category status'}
                    </small>
                  </div>

                  <Button
                    variant="link"
                    className="p-0 text-decoration-none"
                    style={{
                      color: '#4f46e5',
                      fontSize:
                        '0.8rem',
                    }}
                  >
                    View All
                  </Button>

                </div>

                <div
                  className="table-responsive"
                  style={{
                    maxHeight: '300px',
                    overflowY: 'auto',
                  }}
                >

                  {/* =================================================
                      LODGING TABLE
                  ================================================= */}

                  {activeModule ===
                  'lodging' ? (

                    lodgingRooms.length >
                    0 ? (

                      <Table
                        hover
                        className="align-middle mb-0"
                        style={{
                          fontSize:
                            '0.82rem',
                        }}
                      >
                        <thead
                          style={{
                            background:
                              '#f8fafc',
                            position:
                              'sticky',
                            top: 0,
                            zIndex: 1,
                          }}
                        >
                          <tr>
                            <th>
                              Room Category
                            </th>

                            <th>
                              Total
                            </th>

                            <th>
                              Available
                            </th>

                            <th>
                              Occupied
                            </th>

                            <th>
                              Reserved
                            </th>
                          </tr>
                        </thead>

                        <tbody>
                          {lodgingRooms
                            .filter(
                              room =>
                                room.category_name
                                  .toLowerCase()
                                  .includes(
                                    searchTerm.toLowerCase()
                                  )
                            )
                            .map(
                              room => (
                                <tr
                                  key={
                                    room.room_category_id
                                  }
                                >
                                  <td className="fw-semibold">
                                    {
                                      room.category_name
                                    }
                                  </td>

                                  <td>
                                    {
                                      room.total_rooms
                                    }
                                  </td>

                                  <td>
                                    <Badge
                                      bg="success"
                                      className="rounded-pill"
                                    >
                                      {
                                        room.available_rooms
                                      }
                                    </Badge>
                                  </td>

                                  <td>
                                    <Badge
                                      bg="primary"
                                      className="rounded-pill"
                                    >
                                      {
                                        room.occupied_rooms
                                      }
                                    </Badge>
                                  </td>

                                  <td>
                                    <Badge
                                      bg="warning"
                                      text="dark"
                                      className="rounded-pill"
                                    >
                                      {
                                        room.reserved_rooms
                                      }
                                    </Badge>
                                  </td>
                                </tr>
                              )
                            )}
                        </tbody>
                      </Table>

                    ) : (
                      <div className="text-center text-muted py-4">
                        No room data found
                      </div>
                    )

                  ) : (

                    /* =================================================
                       RESTAURANT RECENT ORDERS TABLE
                    ================================================= */

                    filteredItems.length >
                    0 ? (

                      <Table
                        hover
                        className="align-middle mb-0"
                        style={{
                          fontSize:
                            '0.82rem',
                        }}
                      >

                        <thead
                          style={{
                            background:
                              '#f8fafc',
                            position:
                              'sticky',
                            top: 0,
                            zIndex: 1,
                          }}
                        >
                          <tr>

                            <th>
                              Order
                            </th>

                            <th>
                              Customer
                            </th>

                            <th>
                              Table
                            </th>

                            <th>
                              Total
                            </th>

                            <th>
                              Status
                            </th>

                            <th>
                              Time
                            </th>

                          </tr>
                        </thead>

                        <tbody>

                          {filteredItems.map(
                            item => (
                              <tr
                                key={
                                  item.id
                                }
                              >

                                <td className="fw-semibold">
                                  #
                                  {
                                    item.id
                                  }
                                </td>

                                <td>
                                  {
                                    item.customer
                                  }
                                </td>

                                <td>
                                  {
                                    item.items
                                  }
                                </td>

                                <td
                                  className="fw-bold"
                                  style={{
                                    color:
                                      '#4f46e5',
                                  }}
                                >
                                  ₹
                                  {item.total.toLocaleString(
                                    'en-IN'
                                  )}
                                </td>

                                <td>
                                  <StatusBadge
                                    status={
                                      item.status
                                    }
                                  />
                                </td>

                                <td>
                                  <small className="text-muted">
                                    {
                                      item.time
                                    }
                                  </small>
                                </td>

                              </tr>
                            )
                          )}

                        </tbody>

                      </Table>

                    ) : (

                      <div className="text-center text-muted py-4">

                        <FaClipboardList
                          size={30}
                          className="mb-2"
                        />

                        <div>
                          No recent orders found
                        </div>

                      </div>

                    )

                  )}

                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* =================================================
              RIGHT CARD
          ================================================= */}

          <Col
            xl={5}
            lg={12}
          >
            <Card
              className="border-0 h-100"
              style={{
                borderRadius: '16px',
                boxShadow:
                  '0 4px 18px rgba(0,0,0,0.04)',
              }}
            >
              <Card.Body className="p-3 p-md-4">

                {activeModule ===
                'restaurant' ? (

                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">

                      <h6 className="fw-bold mb-0">
                        Recent Reviews
                      </h6>

                      {reviews.length >
                        0 && (
                        <Badge
                          bg="light"
                          text="dark"
                        >
                          {(
                            reviews.reduce(
                              (
                                acc,
                                r
                              ) =>
                                acc +
                                r.rating,
                              0
                            ) /
                            reviews.length
                          ).toFixed(
                            1
                          )}{' '}
                          ★
                        </Badge>
                      )}

                    </div>

                    {reviews.map(
                      (
                        review,
                        idx
                      ) => (
                        <div
                          key={idx}
                          className="pb-3 mb-2"
                          style={{
                            borderBottom:
                              idx !==
                              reviews.length -
                                1
                                ? '1px solid #f1f5f9'
                                : 'none',
                          }}
                        >

                          <div className="d-flex justify-content-between">

                            <div>
                              <div className="fw-semibold">
                                {
                                  review.name
                                }
                              </div>

                              <div className="text-warning">
                                {'★'.repeat(
                                  review.rating
                                )}
                              </div>
                            </div>

                            <small className="text-muted">
                              {
                                review.time
                              }
                            </small>

                          </div>

                          <p
                            className="mb-0 mt-1 text-muted"
                            style={{
                              fontSize:
                                '0.8rem',
                            }}
                          >
                            {
                              review.comment
                            }
                          </p>

                        </div>
                      )
                    )}
                  </>

                ) : (

                  <>
                    <div className="d-flex justify-content-between align-items-center mb-3">

                      <div>
                        <h6 className="fw-bold mb-0">
                          Live Room Summary
                        </h6>

                        <small className="text-muted">
                          Current hotel occupancy
                        </small>
                      </div>

                      <FaHotel
                        size={22}
                        className="text-primary"
                      />

                    </div>

                    <Row className="g-2">

                      <Col xs={6}>
                        <div
                          className="p-3 rounded-3"
                          style={{
                            background:
                              '#eff6ff',
                          }}
                        >
                          <small className="text-muted d-block">
                            Total
                          </small>

                          <h4 className="fw-bold mb-0">
                            {lodgingRooms.reduce(
                              (
                                sum,
                                room
                              ) =>
                                sum +
                                Number(
                                  room.total_rooms ||
                                    0
                                ),
                              0
                            )}
                          </h4>
                        </div>
                      </Col>

                      <Col xs={6}>
                        <div
                          className="p-3 rounded-3"
                          style={{
                            background:
                              '#ecfdf5',
                          }}
                        >
                          <small className="text-muted d-block">
                            Available
                          </small>

                          <h4 className="fw-bold text-success mb-0">
                            {lodgingRooms.reduce(
                              (
                                sum,
                                room
                              ) =>
                                sum +
                                Number(
                                  room.available_rooms ||
                                    0
                                ),
                              0
                            )}
                          </h4>
                        </div>
                      </Col>

                      <Col xs={6}>
                        <div
                          className="p-3 rounded-3"
                          style={{
                            background:
                              '#eef2ff',
                          }}
                        >
                          <small className="text-muted d-block">
                            Occupied
                          </small>

                          <h4 className="fw-bold text-primary mb-0">
                            {lodgingRooms.reduce(
                              (
                                sum,
                                room
                              ) =>
                                sum +
                                Number(
                                  room.occupied_rooms ||
                                    0
                                ),
                              0
                            )}
                          </h4>
                        </div>
                      </Col>

                      <Col xs={6}>
                        <div
                          className="p-3 rounded-3"
                          style={{
                            background:
                              '#fffbeb',
                          }}
                        >
                          <small className="text-muted d-block">
                            Reserved
                          </small>

                          <h4 className="fw-bold text-warning mb-0">
                            {lodgingRooms.reduce(
                              (
                                sum,
                                room
                              ) =>
                                sum +
                                Number(
                                  room.reserved_rooms ||
                                    0
                                ),
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
