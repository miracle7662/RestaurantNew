const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

const db = require('./config/db.js');
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
const messagemasterRoutes = require('./routes/messagemasterRoutes');
const menuRoutes = require("./routes/mstrestmenuRoutes");
const outletRoutes = require('./routes/outletRoutes');
const outletUserRoutes = require('./routes/outletUserRoutes');
const timezoneRoutes = require('./routes/timezoneRoutes');
const timeRoutes = require('./routes/timeRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const authController = require('./controllers/authController');
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




// ✅ Correct order of middleware
app.use(cors());
app.use(express.json());

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
app.use('/api/messagemaster', messagemasterRoutes);
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


app.use('/api/handover', handoverRoutes); // Register handover routes
app.use('/api/dayend', DayendRoutes);
app.use('/api/payment-modes', paymentModesRoutes); // Register payment modes routes
app.use('/api/table-department', msttableDepartmentRoutes); // Register table department routes
app.use('/api/payment', paymentmethodRoutes);
app.use('/api/TAxnTrnbill', TAxnTrnbillRoutes);
app.use('/api/settlements', settlementRoutes);
app.use('/api/warehouse', WarehouseRoutes); // Register warehouse routes
app.use('/api/reports', ReportRoutes); // Register report routes

// ✅ Add a health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running', cors: 'enabled' });
});



// ✅ Start server


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
