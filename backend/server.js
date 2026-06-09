const path = require('path');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const port = 3001;

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const db = require('./config/db.js');
const { authenticateToken } = require('./middleware/auth');
const marketsroutes = require('./routes/marketsroutes');
const countryRoutes = require('./routes/countryRoutes');
const stateRoutes = require('./routes/stateRoutes');
const cityRoutes = require('./routes/cityRoutes');
const unitmasterRoutes = require('./routes/unitmasterroutes');
const DesignationRoutes = require('./routes/DesignationRoutes');

const hoteltypeRoutes = require('./routes/hoteltypeRoutes');
const UserTypeRoutes = require('./routes/UserTypeRoutes');
const KitchenCategoryRoutes = require('./routes/KitchenCategoryRoutes');
const KitchenMainGroupRoutes = require('./routes/KitchenMainGroupRoutes');
const KitchenSubCategoryRoutes = require('./routes/KitchenSubCategoryRoutes');
const HotelMastersRoutes = require('./routes/HotelMastersRoutes');
const ItemMainGroupRoutes = require('./routes/ItemMainGroupRoutes');
const ItemGroupRoutes = require('./routes/ItemGroupRoutes');
const menuRoutes = require("./routes/mstrestmenuRoutes");
const outletRoutes = require('./routes/outletRoutes');
const outletUserRoutes = require('./routes/outletUserRoutes');
const timezoneRoutes = require('./routes/timezoneRoutes');
const timeRoutes = require('./routes/timeRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const authController = require('./controllers/authController');
const os = require('os');
const TableManagementRoutes = require('./routes/TableManagementRoutes');
const CustomerRoutes = require('./routes/CustomerRoutes');
const taxGroupRoutes = require('./routes/msttaxgroupRoutes');
const restTaxMasterRoutes = require('./routes/restTaxMasterRoutes');
const ordersRoutes = require('./routes/ordersRoutes');

const handoverRoutes = require('./routes/handoverRoutes.js');
const DayendRoutes = require('./routes/DayendRoutes');
const paymentModesRoutes = require('./routes/paymentModesRoutes');
const msttableDepartmentRoutes = require('./routes/msttableDepartmentRoutes');
const paymentmethodRoutes = require('./routes/paymentmethodRoutes');
const TAxnTrnbillRoutes = require('./routes/TAxnTrnbillRoutes');
const settlementRoutes = require('./routes/settlementRoutes');
const WarehouseRoutes= require('./routes/WarehouseRoutes');
const ReportRoutes = require('./routes/ReportRoutes');

const settingsRoutes = require("./routes/settingsRoutes");
const AccountLedgerRoutes = require('./routes/AccountLedgerRoutes');
const AccountNatureRoutes = require('./routes/AccountNatureRoutes');
const AccountTypeRoutes = require('./routes/AccountTypeRoutes');

const KitchenAllocationRoutes = require('./routes/KitchenAllocationRoutes');
const outletMenuRoutes = require('./routes/outletMenuRoutes');

// billing transfer routes
const billingTransferRoutes = require('./routes/billingTransferRoutes');
const userPermissionsRoutes = require('./routes/userPermissionsRoutes');

/* ───────── Hotel Booking Routes Import (MODULAR) ───────── */


const subscriptionPlanRoutes = require('./modules/hotelbooking/routes/subscriptionPlanRoutes');
const taxRoutes = require('./modules/hotelbooking/routes/taxRoutes');
const zoneRoutes = require('./modules/hotelbooking/routes/zoneRoutes');
const blockRoutes = require('./modules/hotelbooking/routes/blockRoutes');
const floorRoutes = require('./modules/hotelbooking/routes/floorRoutes');
const featureRoutes = require('./modules/hotelbooking/routes/featureRoutes');
const fragmentRoutes = require('./modules/hotelbooking/routes/fragmentRoutes');
const nationalityRoutes = require('./modules/hotelbooking/routes/nationalityRoutes');
const roomCategoryRoutes = require('./modules/hotelbooking/routes/room-categoryRoutes.js');
const roomRoutes = require('./modules/hotelbooking/routes/roomRoutes');
const companyRoutes = require('./modules/hotelbooking/routes/companyRoutes');
const guestRoutes = require('./modules/hotelbooking/routes/guestRoutes');
const departmentRoutes = require('./modules/hotelbooking/routes/departmentRoutes');
const guestTypeRoutes = require('./modules/hotelbooking/routes/guestTypeRoutes');
const purposeRoutes = require('./modules/hotelbooking/routes/purposeRoutes');
const hotelSettingsRoutes = require('./modules/hotelbooking/routes/hotelSettingsRoutes');
const arrivedRoutes = require('./modules/hotelbooking/routes/arrivedRoutes');
const departureRoutes = require('./modules/hotelbooking/routes/departureRoutes');
const documentTypeRoutes = require('./modules/hotelbooking/routes/documentTypeRoutes');
const checkInRoutes = require('./modules/hotelbooking/routes/checkInRoutes');
const detailRoutes = require('./modules/hotelbooking/routes/detailRoutes');
const guestFolioRoutes = require('./modules/hotelbooking/routes/guestFolioRoutes');
const guestRoomChargesRoutes = require('./modules/hotelbooking/routes/guestRoomChargesRoutes');
const paymentMethodRoutes = require('./modules/hotelbooking/routes/paymentMethodRoutes');
const reservationRoomsRoutes = require('./modules/hotelbooking/routes/reservationRoomsRoutes');
const bookedByContactsRoutes = require('./modules/hotelbooking/routes/bookedByContactsRoutes');
const reservationBookedByRoutes = require('./modules/hotelbooking/routes/reservationBookedByRoutes');
const reservationRoutes = require('./modules/hotelbooking/routes/reservationRoutes');
const travelAgentRoutes = require('./modules/hotelbooking/routes/travelAgentRoutes');
const agentRoomCheckinRoutes = require('./modules/hotelbooking/routes/agentRoomCheckinRoutes');
const checkoutRoutes = require('./modules/hotelbooking/routes/checkoutRoutes');
const checkoutDetailRoutes = require('./modules/hotelbooking/routes/checkoutDetailRoutes');
const checkoutFolioRoutes = require('./modules/hotelbooking/routes/checkoutFolioRoutes');
const checkoutRoomChargesRoutes = require('./modules/hotelbooking/routes/checkoutRoomChargesRoutes');
const checkoutPaymentRoutes = require('./modules/hotelbooking/routes/checkoutPaymentRoutes');
const billPrintSettingRoutes = require('./modules/hotelbooking/routes/billPrintSettingRoutes');
const roomStatusLogRoutes = require('./modules/hotelbooking/routes/roomStatusLogRoutes');
const subDepartmentRoutes = require('./modules/hotelbooking/routes/subDepartmentRoutes');
const postChargesRoutes = require('./modules/hotelbooking/routes/postChargesRoutes');
const advanceTransactionRoutes = require('./modules/hotelbooking/routes/advanceTransactionRoutes');
const stockRoutes = require('./modules/hotelbooking/routes/stockRoutes');
const guestHistoryRoutes = require('./modules/hotelbooking/routes/guestHistoryRoutes');
const roomStatusRoutes = require('./modules/hotelbooking/routes/roomStatusRoutes');

// ✅ Correct order of middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ✅ Then register your routes
app.use('/api/countries', countryRoutes);
app.use('/api/states', stateRoutes);

app.use('/api/cities', cityRoutes);
app.use('/api/unitmaster', unitmasterRoutes);
app.use('/api/markets', marketsroutes);
app.use('/api/Designation', DesignationRoutes);

app.use('/api/hoteltype', hoteltypeRoutes);
app.use('/api/UserType', UserTypeRoutes);
app.use('/api/KitchenCategory', KitchenCategoryRoutes);
app.use('/api/KitchenMainGroup', KitchenMainGroupRoutes);
app.use('/api/KitchenSubCategory', KitchenSubCategoryRoutes)
app.use('/api/HotelMasters', HotelMastersRoutes);
app.use('/api/ItemMainGroup', ItemMainGroupRoutes);
app.use('/api/ItemGroup', ItemGroupRoutes);
app.use("/api/menu", menuRoutes);
app.use('/api/outlets', outletRoutes);
app.use('/api/outlet-users', outletUserRoutes);
app.use('/api/timezones', timezoneRoutes);
app.use('/api/times', timeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/tablemanagement', TableManagementRoutes);
app.use('/api/customer', CustomerRoutes);
app.use('/api/taxgroup', taxGroupRoutes);
app.use('/api/resttaxmaster', restTaxMasterRoutes);
app.use('/api/orders', ordersRoutes);

app.use('/api/handover', handoverRoutes);
app.use('/api/dayend', DayendRoutes);
app.use('/api/payment-modes', paymentModesRoutes);
app.use('/api/table-department', msttableDepartmentRoutes);
app.use('/api/payment', paymentmethodRoutes);
app.use('/api/TAxnTrnbill', TAxnTrnbillRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/warehouse', WarehouseRoutes);
app.use('/api/reports', ReportRoutes);
app.use('/api/kitchen-allocation', KitchenAllocationRoutes);
app.use("/api/settings", settingsRoutes);

app.use('/api/account-ledger', authenticateToken, AccountLedgerRoutes);
app.use('/api/accountnature', authenticateToken, AccountNatureRoutes);
app.use('/api/accounttype', authenticateToken, AccountTypeRoutes);

app.use('/api/outletmenu', outletMenuRoutes);
app.use('/api/user-permissions', userPermissionsRoutes);

// Register billing transfer routes
app.use('/api/billing-transfer', billingTransferRoutes);

app.use('/api/setup', require('./routes/create-superadmin-mysql'));

/* ───────── Hotel Booking Routes Registration ───────── */
app.use('/api/zones', zoneRoutes);
app.use('/api/fragments', fragmentRoutes);
app.use('/api/features', featureRoutes);
app.use('/api/hotel-tax', taxRoutes);
app.use('/api/subscription-plans', subscriptionPlanRoutes);
app.use('/api/nationalities', nationalityRoutes);
app.use('/api/floors', floorRoutes);
app.use('/api/blocks', blockRoutes);
app.use('/api/room-categories', roomCategoryRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/guests', guestRoutes);
app.use('/api/guest-types', guestTypeRoutes);
app.use('/api/purposes', purposeRoutes);
app.use('/api/arrived', arrivedRoutes);
app.use('/api/departure', departureRoutes);
app.use('/api/hotel-settings', hotelSettingsRoutes);
app.use('/api/document-types', documentTypeRoutes);
app.use('/api/checkins', checkInRoutes);
app.use('/api/details', detailRoutes);
app.use('/api/guest-folios', guestFolioRoutes);
app.use('/api/guest-room-charges', guestRoomChargesRoutes);
app.use('/api/payment-methods', paymentMethodRoutes);
app.use('/api/reservation-rooms', reservationRoomsRoutes);
app.use('/api/booked-by-contacts', bookedByContactsRoutes);
app.use('/api/reservation-booked-by', reservationBookedByRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/travel-agents', travelAgentRoutes);
app.use('/api/agent-room-checkins', agentRoomCheckinRoutes);
app.use('/api/checkouts', checkoutRoutes);
app.use('/api/checkout-details', checkoutDetailRoutes);
app.use('/api/checkout-folios', checkoutFolioRoutes);
app.use('/api/checkout-room-charges', checkoutRoomChargesRoutes);
app.use('/api/checkout-payments', checkoutPaymentRoutes);
app.use('/api/bill-print-settings', billPrintSettingRoutes);
app.use('/api/room-status-logs', roomStatusLogRoutes);
app.use('/api/sub-departments', subDepartmentRoutes);
app.use('/api/post-charges', postChargesRoutes);
app.use('/api/advance-transactions', advanceTransactionRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/guest-history', guestHistoryRoutes);
app.use('/api/room-status', roomStatusRoutes);


app.get("/get-server-ip", (req, res) => {
  const interfaces = os.networkInterfaces();
  let ipAddress = "127.0.0.1";

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        ipAddress = iface.address;
        break;
      }
    }
  }

  res.json({ ip: ipAddress });
});


const BASE_UPLOAD_DIR = path.join(path.dirname(process.execPath), 'uploads');

  app.use('/uploads', express.static(BASE_UPLOAD_DIR));

// ✅ Add a health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running', cors: 'enabled' });
});



// ✅ Export app and startServer function

function startServer(customPort) {
  const port = parseInt(customPort || process.env.PORT || '3001');
  const startTime = new Date().toISOString();
  
  console.log(`🚀 Starting POS Server on PORT ${port}`);
  
  app.set('io', io);  // For controllers
  
  io.on('connection', (socket) => {
    console.log('🔌 Client connected:', socket.id);
    
    socket.on('join_outlet', (outletId) => {
      socket.join(`outlet_${outletId}`);
      console.log(`👥 Client ${socket.id} joined outlet_${outletId}`);
    });
    
    socket.on('disconnect', () => {
      console.log('🔌 Client disconnected:', socket.id);
    });
  });

  httpServer.listen(port, '0.0.0.0', () => {
    const os = require('os');
    const interfaces = os.networkInterfaces();
    const addresses = [];
    
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          addresses.push(iface.address);
        }
      }
    }
    console.log(`✅ Backend ready at ${startTime}`);
    console.log(`Server running at http://0.0.0.0:${port}`);
    console.log(`🌐 Network IPs: ${addresses.join(', ')}`);
    console.log(`📱 Access from network: http://${addresses[0] || 'YOUR-IP'}:${port}`);
  });

}

module.exports = { startServer };