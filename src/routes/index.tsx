import React from 'react'
import { Route, RouteProps } from 'react-router-dom'

// PrivateRoute
import PrivateRoute from './PrivateRoute'
//import ItemGroup from '@/components/Apps/ItemGroup/itemGroup'

import Customers from '@/views/apps/Transaction/Customers'
import Settlement from '@/views/apps/Transaction/Settelment'
import Handover from '@/views/apps/Transaction/Handover'
import DayEnd from '../views/apps/Transaction/DayEnd'
const KotTransfer = React.lazy(() => import('../views/apps/Transaction/KotTransfer'))


// DAaily Reports
import Reports from '../views/apps/Transaction/Reports'

// Daily Reports
import DailySalesReport from '../views/apps/Masters/Reports/DailySalesReport'
import DayEndReportPreview from '../views/apps/Masters/Reports/DayEndReportPreview'

 
// Dashboards
const Ecommerce = React.lazy(() => import('./../views/dashboards'))
const Analytics = React.lazy(() => import('./../views/dashboards/Analytics'))
const CRM = React.lazy(() => import('./../views/dashboards/CRM'))

// Apps

const Invoice = React.lazy(() => import('./../views/apps/Invoice'))
// const KotPrint = React.lazy(() => import('./../views/apps/PrintReport/KotPrint'))
const KitchenAllocation = React.lazy(() => import('./../views/apps/PrintReport/KitchenAllocation'))
const Contact = React.lazy(() => import('./../views/apps/Contact'))
const Tableview = React.lazy(() => import('../views/apps/Tableview'))
const Billview = React.lazy(() => import('../views/apps/Billview'))
const Settings = React.lazy(() => import('../views/apps/Settings'))
const OpeningBalancePage = React.lazy(() => import('../views/apps/OpeningBalancePage')) // Updated to use <OpeningBalancePage /> component'@/pages/opening-balance/OpeningBalancePage'



// Update the path below to the correct location and casing of your Orders component file
const Orders = React.lazy(() => import('../views/apps/Transaction/Orders')) // Updated to use <Orders /> compone
const Menu = React.lazy(() => import('../views/apps/Masters/RestaurantMasters/Menu')) // Updated to use <Menu /> component
//const Billing = React.lazy(() => import('./../views/apps/Billing')) // Updated to use <Billing /> component
const Country = React.lazy(() => import('../views/apps/Masters/CommanMasters/Country')) // Updated to use <Country /> component
const States = React.lazy(() => import('../views/apps/Masters/CommanMasters/States')) // Updated to use <States /> component
const City = React.lazy(() => import('../views/apps/Masters/CommanMasters/City')) // Updated to use <City /> component
const MessageMaster = React.lazy(() => import('../views/apps/Masters/CommanMasters/MessageMaster'))
// OutletConfigration
const Market = React.lazy(() => import('../views/apps/Masters/CommanMasters/Market'))
const Brand = React.lazy(() => import('../views/apps/Masters/CommanMasters/Brand'))
const Outlet = React.lazy(() => import('../views/apps/Masters/CommanMasters/Outlet/Outlet'))
const OutletDesignation = React.lazy(() => import('../views/apps/Masters/CommanMasters/OutletDesignation'))
const OutletUser = React.lazy(() => import('../views/apps/Masters/CommanMasters/OutletUser/OutletUser'))
const OutletPaymentMode = React.lazy(() => import('../views/apps/Masters/CommanMasters/OutletPaymentMode'))
// const AddOutlet = React.lazy(() => import('../views/apps/Masters/CommanMasters/Outlet/AddOutlet'))
const KOTPrintSettings = React.lazy(() => import('../views/apps/Masters/CommanMasters/Outlet/KOTPrintSettings'))
const BillPrintSettings = React.lazy(() => import('../views/apps/Masters/CommanMasters/Outlet/BillPrintSettings'))
const HotelTypeMasters = React.lazy(() => import('../views/apps/Masters/CommanMasters/HotelTypeMasters'))
const UserType = React.lazy(() => import('../views/apps/Masters/CommanMasters/UserType'))
const Warehouse = React.lazy(() => import('../views/apps/Masters/CommanMasters/Warehouse'))


// const ManagePosAccessLevel = React.lazy(() => import('../views/OutletConfigration/ManagePosAccessLevel'))
// const Manage = React.lazy(() => import('./../views/OutletConfigration/Manage'))
// const ManageStore = React.lazy(() => import('./../views/OutletConfigration/ManageStore'))
// const ManageMPOSAccessLevel = React.lazy(() => import('../views/OutletConfigration/ManageMPOSAccessLevel'))


const ItemGroup = React.lazy(() => import('../views/apps/Masters/RestaurantMasters/ItemGroup'))
const ItemMainGroup = React.lazy(() => import('../views/apps/Masters/RestaurantMasters/ItemMainGroup'))
const KitchenGroup = React.lazy(() => import('../views/apps/Masters/RestaurantMasters/KitchenGroup'))
const KitchenSubCategories = React.lazy(() => import('../views/apps/Masters/RestaurantMasters/KitchenSubCategories')) // Updated to use <KitchenItem /> component
//const OrderDetails = React.lazy(() => import('../views/apps/OrderDetails'))
//const CustomersDetails = React.lazy(() => import('../views/apps/CustomersDetails'))
const OrderTypeConfiguration = React.lazy(() => import('../views/apps/Masters/RestaurantMasters/OrderTypeConfiguration'))
const KitchenCategories = React.lazy(() => import('../views/apps/Masters/RestaurantMasters/KitchenCategories'))
const OutletMenu = React.lazy(() => import('../views/apps/Masters/RestaurantMasters/OutletMenu'))
const TaxProuductGroup = React.lazy(() => import('../views/apps/Masters/RestaurantMasters/TaxProuductGroup'))
const TableManagement = React.lazy(() => import('../views/apps/Masters/RestaurantMasters/TableManagement'))
const UnitMaster = React.lazy(() => import('../views/apps/Masters/RestaurantMasters/UnitMaster'))
const Resttaxmaster = React.lazy(() => import('../views/apps/Masters/RestaurantMasters/Resttaxmaster'))
const TableDepartment = React.lazy(() => import('../views/apps/Masters/RestaurantMasters/TableDepartment'))
const AccountNature = React.lazy(() => import('../views/apps/Masters/RestaurantMasters/AccountNature'));
const AccountType = React.lazy(() => import('../views/apps/Masters/RestaurantMasters/AccountType'));
const AccountLedger = React.lazy(() => import('../views/apps/Masters/RestaurantMasters/AccountLedger'))










// User Profile
const Overview = React.lazy(() => import('../views/pages/user-profile/Overview'))
const Activity = React.lazy(() => import('../views/pages/user-profile/Activity'))
const Followers = React.lazy(() => import('../views/pages/user-profile/Followers'))
const Contacts = React.lazy(() => import('../views/pages/user-profile/Contacts'))
const Projects = React.lazy(() => import('../views/pages/user-profile/Projects'))
const Gallery = React.lazy(() => import('../views/pages/user-profile/Gallery'))



// Auth {{Minimal}}
const Login = React.lazy(() => import('../views/auth/minimal/Login'))
const Register = React.lazy(() => import('../views/auth/minimal/Register'))
const RegisterSuccess = React.lazy(() => import('../views/auth/minimal/RegisterSuccess'))
const ResetPassword = React.lazy(() => import('../views/auth/minimal/ResetPassword'))
const ForgotPassword = React.lazy(() => import('../views/auth/minimal/ForgotPassword'))
const TwoFactorOTP = React.lazy(() => import('../views/auth/minimal/TwoFactorOTP'))
const LockScreen = React.lazy(() => import('../views/auth/minimal/LockScreen'))

// Auth {{Classic}}
const LoginClassic = React.lazy(() => import('../views/auth/classic/LoginClassic'))
const RegisterClassic = React.lazy(() => import('../views/auth/classic/RegisterClassic'))
const RegisterSuccessClassic = React.lazy(
  () => import('../views/auth/classic/RegisterSuccessClassic'),
)
const ResetPasswordClassic = React.lazy(() => import('../views/auth/classic/ResetPasswordClassic'))
const ForgotPasswordClassic = React.lazy(
  () => import('../views/auth/classic/ForgotPasswordClassic'),
)
const TwoFactorOTPClassic = React.lazy(() => import('../views/auth/classic/TwoFactorOTPClassic'))
const LockScreenClassic = React.lazy(() => import('../views/auth/classic/LockScreenClassic'))

// Auth {{Creative}}
const LoginCreative = React.lazy(() => import('../views/auth/creative/LoginCreative'))
const RegisterCreative = React.lazy(() => import('../views/auth/creative/RegisterCreative'))
const RegisterSuccessCreative = React.lazy(
  () => import('../views/auth/creative/RegisterSuccessCreative'),
)
const ResetPasswordCreative = React.lazy(
  () => import('../views/auth/creative/ResetPasswordCreative'),
)
const ForgotPasswordCreative = React.lazy(
  () => import('../views/auth/creative/ForgotPasswordCreative'),
)
const TwoFactorOTPCreative = React.lazy(() => import('../views/auth/creative/TwoFactorOTPCreative'))
const LockScreenCreative = React.lazy(() => import('../views/auth/creative/LockScreenCreative'))

// Auth {{Corporate}}
const LoginCorporate = React.lazy(() => import('../views/auth/corporate/LoginCorporate'))
const RegisterCorporate = React.lazy(() => import('../views/auth/corporate/RegisterCorporate'))
const RegisterSuccessCorporate = React.lazy(
  () => import('../views/auth/corporate/RegisterSuccessCorporate'),
)
const ResetPasswordCorporate = React.lazy(
  () => import('../views/auth/corporate/ResetPasswordCorporate'),
)
const ForgotPasswordCorporate = React.lazy(
  () => import('../views/auth/corporate/ForgotPasswordCorporate'),
)
const TwoFactorOTPCorporate = React.lazy(
  () => import('../views/auth/corporate/TwoFactorOTPCorporate'),
)
const LockScreenCorporate = React.lazy(() => import('../views/auth/corporate/LockScreenCorporate'))

// Auth {{Modern}}
const LoginModern = React.lazy(() => import('../views/auth/modern/LoginModern'))
const RegisterModern = React.lazy(() => import('../views/auth/modern/RegisterModern'))
const RegisterSuccessModern = React.lazy(() => import('../views/auth/modern/RegisterSuccessModern'))
const ResetPasswordModern = React.lazy(() => import('../views/auth/modern/ResetPasswordModern'))
const ForgotPasswordModern = React.lazy(() => import('../views/auth/modern/ForgotPasswordModern'))
const TwoFactorOTPModern = React.lazy(() => import('../views/auth/modern/TwoFactorOTPModern'))
const LockScreenModern = React.lazy(() => import('../views/auth/modern/LockScreenModern'))



// Email Templates
const EmailTemplateConfirmAccount = React.lazy(
  () => import('../views/etemplates/EmailTemplateConfirmAccount'),
)
const EmailTemplateExpiredCard = React.lazy(
  () => import('../views/etemplates/EmailTemplateExpiredCard'),
)
const EmailTemplateResetPassword = React.lazy(
  () => import('../views/etemplates/EmailTemplateResetPassword'),
)
const EmailTemplateWelcomeMessage = React.lazy(
  () => import('../views/etemplates/EmailTemplateWelcomeMessage'),
)
const EmailTemplateCouponSale = React.lazy(
  () => import('../views/etemplates/EmailTemplateCouponSale'),
)
const EmailTemplateLatestUpdate = React.lazy(
  () => import('../views/etemplates/EmailTemplateLatestUpdate'),
)

export interface RoutesProps {
  path: RouteProps['path']
  name?: string
  element?: RouteProps['element']
  route?: any
  exact?: boolean
  icon?: string
  header?: string
  roles?: string[]
  children?: RoutesProps[]
}

// Dashboards
const dashboardRoutes: RoutesProps = {
  path: '/dashboards',
  name: 'Dashboards',
  header: 'Navigation',
  children: [
    {
      path: '/',
      name: 'Root',
      element: <Ecommerce />,
      route: PrivateRoute,
    },
    {
      path: '/dashboards/analytics',
      name: 'Analytics',
      element: <Analytics />,
      route: PrivateRoute,
    },
    {
      path: '/dashboards/crm',
      name: 'CRM',
      element: <CRM />,
      route: PrivateRoute,
    },
  ],
}

// Apps
const appsRoutes: RoutesProps = {
  path: '/apps',
  name: 'Apps',
  children: [
   
   
    {
      path: '/apps/contact',
      name: 'Contact',
      element: <Contact />,
      route: PrivateRoute,
    },
    {
      path: '/apps/invoice',
      name: 'Invoice',
      element: <Invoice />,
      route: PrivateRoute,
    },

     {
      path: '/apps/OpeningBalancePage',
      name: 'OpeningBalancePage',
      element: <OpeningBalancePage />,
      route: PrivateRoute,
    },
   
    // {
    //   path: '/apps/KotPrint',
    //   name: 'KotPrint',
    //   element: <KotPrint />,
    //   route: PrivateRoute,
    // },
    {
      path: '/apps/KitchenAllocation',
      name: 'KitchenAllocation',
      element: <KitchenAllocation />,
      route: PrivateRoute,
    },
   
    {
      path: '/apps/Orders',
      name: 'Orders',
      element: <Orders />,
      route: PrivateRoute,
    },
    {
      path: '/apps/Settlement',
      name: 'Settlement',
      element: <Settlement />,
      route: PrivateRoute,
    },
    

     {
      path: '/apps/Handover',
      name: ' Handover',
      element: <  Handover />,
      route: PrivateRoute,
    },
     {
      path: '/apps/DayEnd',
      name: ' DayEnd',
      element: <  DayEnd />,
      route: PrivateRoute,
    },
    {
      path: '/apps/Masters/Reports/DayEndReportPreview',
      name: ' DayEndReportPreview',
      element: <  DayEndReportPreview />,
      route: PrivateRoute,
    },

    {
      path: '/apps/KotTransfer',
      name: ' KotTransfer',
      element: <  KotTransfer />,
      route: PrivateRoute,
    },

     {
      path: '/apps/Reports',
      name: ' Reports',
      element: <  Reports/>,
      route: PrivateRoute,
    },

     {
      path: '/apps/Settings',
      name: ' Settings',
      element: <  Settings/>,
      route: PrivateRoute,
    },


   {
          path: '/Reports/DailySalesReport',
          name: 'DailySalesReport',
          element: <DailySalesReport />,
          route: PrivateRoute,
        },


    
    {
      path: '/apps/Menu',
      name: 'Menu',
      element: <Menu />, // Updated to use <Menu /> component
      route: PrivateRoute,
    },

    {
      path: '/apps/Customers',
      name: 'Customers',
      element: <Customers />, // Updated to use <Customers /> component
      route: PrivateRoute,
    },

   

    {
      path: '/apps/OutletMenu',
      name: 'OutletMenu',
      element: <OutletMenu />,
      route: PrivateRoute,
    },
    {
      path: '/apps/TaxProuductGroup',
      name: 'TaxProuductGroup',
      element: <TaxProuductGroup />,
      route: PrivateRoute,
    },
    {
      path: '/apps/Resttaxmaster',
      name: 'Resttaxmaster',
      element: <Resttaxmaster />,
      route: PrivateRoute,
    },
    {
      path: '/apps/ItemGroup',
      name: 'ItemGroup',
      element: <ItemGroup />,
      route: PrivateRoute,
    },
    {
      path: '/apps/ItemMainGroup',
      name: 'ItemMainGroup',
      element: <ItemMainGroup />,
      route: PrivateRoute,
    },

    {
      path: '/apps/KitchenGroup',
      name: 'KitchenGroup',
      element: <KitchenGroup />,
      route: PrivateRoute,
    },

    {
      path: '/apps/TableManagement',
      name: 'TableManagement',
      element: <TableManagement />,
      route: PrivateRoute,
    },

     {
  path: '/apps/TableDepartment',
  name: 'TableDepartment',
  element: <TableDepartment />,
  route: PrivateRoute,
},
    {
      path: '/apps/UnitMaster',
      name: 'UnitMaster',
      element: <UnitMaster />,
      route: PrivateRoute,
    },
    {
      path: '/apps/MessageMaster',
      name: 'MessageMaster',
      element: <MessageMaster />,
      route: PrivateRoute,
    },
    { 
      path: '/apps/Warehouse',
      name: 'Warehouse',
      element: <Warehouse />,
      route: PrivateRoute,
    },

     
    {
      path: '/apps/Tableview',
      name: 'Tableview',
      element: <Tableview />,
      route: PrivateRoute,
    },

    {
      path: '/apps/Billview',
      name: 'Billview',
      element: <Billview />,
      route: PrivateRoute,
    },

   
    // {
    //   path: '/apps/OrderDetails',
    //   name: 'OrderDetails',
    //   element: <OrderDetails/>,
    //   route: PrivateRoute,
    // },


    {
      path: '/apps/KitchenCategories',
      name: 'KitchenCategories',
      element: <KitchenCategories />,
      route: PrivateRoute,
    },

    {
      path: '/apps/KitchenSubCategories',
      name: 'KitchenSubCategories',
      element: <KitchenSubCategories />,
      route: PrivateRoute,
    },

    {
      path: '/masterpages',
      name: 'Masterpages',
      header: 'Navigation',
      children: [
        {
          path: '/masterpages/country',
          name: 'Country',
          element: <Country />,
          route: PrivateRoute,
        },

        {
          path: '/masterpages/states',
          name: 'States',
          element: <States />,
          route: PrivateRoute,
        },
        {
          path: '/masterpages/city',
          name: 'City',
          element: <City />,
          route: PrivateRoute,
        },
        {
          path: '/masterpages/HotelTypeMasters',
          name: 'HotelTypeMasters',
          element: <HotelTypeMasters />,
          route: PrivateRoute,
        },

        {
          path: '/masterpages/UserType',
          name: 'User Type',
          element: <UserType />,
          route: PrivateRoute,
        },

        
      ],
    },

    {
      path: '/accountingMasters',
      name: 'AccountingMasters',
      header: 'Navigation',
      children: [
       
          {
          path: '/accountingMasters/AccountNature',
          name: 'Account Nature',
          element: <AccountNature />,
          route: PrivateRoute,
        },
        {
          path: '/accountingMasters/AccountType',
          name: 'Account Type',
          element: <AccountType />,
          route: PrivateRoute,
        },
        {
          
          path: '/accountingMasters/AccountLedger',
          name: 'Account Ledger',
          element: <AccountLedger />,
          route: PrivateRoute,
        },


      ],
    },

    {
      path: '/OutletConfigration',
      name: 'OutletConfigration',
      header: 'Navigation',
      children: [
        {
          path: '/OutletConfigration/Market',
          name: 'Market',
          element: <Market />,
          route: PrivateRoute,
        },

        {
          path: '/OutletConfigration/Brand',
          name: 'Brand',
          element: <Brand />,
          route: PrivateRoute,
        },
        {
          path: '/OutletConfigration/Outlet',
          name: 'Outlet',
          element: <Outlet />,
          route: PrivateRoute,
        },




        {
          path: '/OutletConfigration/OutletDesignation',
          name: 'OutletDesignation',
          element: <OutletDesignation />,
          route: PrivateRoute,
        },

        {
          path: '/OutletConfigration/OutletUser',
          name: 'OutletUser',
          element: <OutletUser />,
          route: PrivateRoute,
        },
        {
          path: '/OutletConfigration/OutletPaymentMode',
          name: 'OutletPaymentMode',
          element: <OutletPaymentMode />,
          route: PrivateRoute,
        },
        {
          path: '/OutletConfigration/OrderTypeConfiguration',
          name: 'OrderTypeConfiguration',
          element: <OrderTypeConfiguration />,
          route: PrivateRoute,
        },

        // {
        //   path: '/OutletConfigration/AddOutlet',
        //   name: 'AddOutlet',
        //   element: <AddOutlet />,
        //   route: PrivateRoute,
        // },
        {
          path: '/OutletConfigration/KOTPrintSettings',
          name: 'KOTPrintSettings',
          element: <KOTPrintSettings />,
          route: PrivateRoute,
        },

        {
          path: '/OutletConfigration/BillPrintSettings',
          name: 'BillPrintSettings',
          element: <BillPrintSettings />,
          route: PrivateRoute,
        },
        // {
        //   path: '/OutletConfigration/ManagePosAccessLevel',
        //   name: 'ManagePosAccessLevel',
        //   element: <ManagePosAccessLevel />,
        //   route: PrivateRoute,
        // },

        //  {
        //   path: '/OutletConfigration/ManageMPOSAccessLevel',
        //   name: 'ManageMPOSAccessLevel',
        //   element: <ManageMPOSAccessLevel />,
        //   route: PrivateRoute,
        // },
        // {
        //   path: '/OutletConfigration/Manage',
        //   name: 'Manage',
        //   element: <Manage />,
        //   route: PrivateRoute,
        // },

        //  {
        //   path: '/OutletConfigration/ManageStore',
        //   name: 'ManageStore',
        //   element: <ManageStore />,
        //   route: PrivateRoute,
        // },
      ],
    }

  ],
}























//MY WORK PAGES(SHARMIN)


// Components

// Pages
const pagesRoutes = {
  path: '/pages',
  name: 'Pages',
  header: 'Custom',
  children: [
    {
      path: '/pages/user-profile',
      name: 'User Profile',
      children: [
        {
          path: '/user-profile/overview',
          name: 'Overview',
          element: <Overview />,
          route: PrivateRoute,
        },
        {
          path: '/user-profile/activity',
          name: 'Activity',
          element: <Activity />,
          route: PrivateRoute,
        },
        {
          path: '/user-profile/followers',
          name: 'Followers',
          element: <Followers />,
          route: PrivateRoute,
        },
        {
          path: '/user-profile/contacts',
          name: 'Contacts',
          element: <Contacts />,
          route: PrivateRoute,
        },
        {
          path: '/user-profile/projects',
          name: 'Projects',
          element: <Projects />,
          route: PrivateRoute,
        },
        {
          path: '/user-profile/gallery',
          name: 'Gallery',
          element: <Gallery />,
          route: PrivateRoute,
        },
      ],
    },
  
   
  ],
}

// Auth
const authRoutes: RoutesProps[] = [
  {
    path: '/auth',
    name: 'Login',
    header: 'Custom',
    children: [
      {
        path: '/auth/login',
        name: 'Login',
        children: [
          {
            path: '/auth/minimal/login',
            name: 'Login',
            element: <Login />,
            route: Route,
          },
          {
            path: '/auth/classic/login',
            name: 'Login',
            element: <LoginClassic />,
            route: Route,
          },
          {
            path: '/auth/creative/login',
            name: 'Login',
            element: <LoginCreative />,
            route: Route,
          },
          {
            path: '/auth/corporate/login',
            name: 'Login',
            element: <LoginCorporate />,
            route: Route,
          },
          {
            path: '/auth/modern/login',
            name: 'Login',
            element: <LoginModern />,
            route: Route,
          },
        ],
      },
      {
        path: '/auth/register',
        name: 'Register',
        children: [
          {
            path: '/auth/minimal/register',
            name: 'Register',
            element: <Register />,
            route: Route,
          },
          {
            path: '/auth/classic/register',
            name: 'Register',
            element: <RegisterClassic />,
            route: Route,
          },
          {
            path: '/auth/creative/register',
            name: 'Register',
            element: <RegisterCreative />,
            route: Route,
          },
          {
            path: '/auth/corporate/register',
            name: 'Register',
            element: <RegisterCorporate />,
            route: Route,
          },
          {
            path: '/auth/modern/register',
            name: 'Register',
            element: <RegisterModern />,
            route: Route,
          },
        ],
      },
      {
        path: '/auth/register-success',
        name: 'Register Success',
        children: [
          {
            path: '/auth/minimal/register-success',
            name: 'Register Success',
            element: <RegisterSuccess />,
            route: Route,
          },
          {
            path: '/auth/classic/register-success',
            name: 'Register Success',
            element: <RegisterSuccessClassic />,
            route: Route,
          },
          {
            path: '/auth/creative/register-success',
            name: 'Register Success',
            element: <RegisterSuccessCreative />,
            route: Route,
          },
          {
            path: '/auth/corporate/register-success',
            name: 'Register Success',
            element: <RegisterSuccessCorporate />,
            route: Route,
          },
          {
            path: '/auth/modern/register-success',
            name: 'Register Success',
            element: <RegisterSuccessModern />,
            route: Route,
          },
        ],
      },
      {
        path: '/auth/reset-password',
        name: 'Reset Password',
        children: [
          {
            path: '/auth/minimal/reset-password',
            name: 'Reset Password',
            element: <ResetPassword />,
            route: Route,
          },
          {
            path: '/auth/classic/reset-password',
            name: 'Reset Password',
            element: <ResetPasswordClassic />,
            route: Route,
          },
          {
            path: '/auth/creative/reset-password',
            name: 'Reset Password',
            element: <ResetPasswordCreative />,
            route: Route,
          },
          {
            path: '/auth/corporate/reset-password',
            name: 'Reset Password',
            element: <ResetPasswordCorporate />,
            route: Route,
          },
          {
            path: '/auth/modern/reset-password',
            name: 'Reset Password',
            element: <ResetPasswordModern />,
            route: Route,
          },
        ],
      },
      {
        path: '/auth/forgot-password',
        name: 'Forgot Password',
        children: [
          {
            path: '/auth/minimal/forgot-password',
            name: 'Forgot Password',
            element: <ForgotPassword />,
            route: Route,
          },
          {
            path: '/auth/classic/forgot-password',
            name: 'Forgot Password',
            element: <ForgotPasswordClassic />,
            route: Route,
          },
          {
            path: '/auth/creative/forgot-password',
            name: 'Forgot Password',
            element: <ForgotPasswordCreative />,
            route: Route,
          },
          {
            path: '/auth/corporate/forgot-password',
            name: 'Forgot Password',
            element: <ForgotPasswordCorporate />,
            route: Route,
          },
          {
            path: '/auth/modern/forgot-password',
            name: 'Forgot Password',
            element: <ForgotPasswordModern />,
            route: Route,
          },
        ],
      },
      {
        path: '/auth/otp',
        name: 'Two-facafor (OTP)',
        children: [
          {
            path: '/auth/minimal/otp',
            name: 'Two-facafor (OTP)',
            element: <TwoFactorOTP />,
            route: Route,
          },
          {
            path: '/auth/classic/otp',
            name: 'Two-facafor (OTP)',
            element: <TwoFactorOTPClassic />,
            route: Route,
          },
          {
            path: '/auth/creative/otp',
            name: 'Two-facafor (OTP)',
            element: <TwoFactorOTPCreative />,
            route: Route,
          },
          {
            path: '/auth/corporate/otp',
            name: 'Two-facafor (OTP)',
            element: <TwoFactorOTPCorporate />,
            route: Route,
          },
          {
            path: '/auth/modern/otp',
            name: 'Two-facafor (OTP)',
            element: <TwoFactorOTPModern />,
            route: Route,
          },
        ],
      },
      {
        path: '/auth/lock-screen',
        name: 'Lock Screen',
        children: [
          {
            path: '/auth/minimal/lock-screen',
            name: 'Lock Screen',
            element: <LockScreen />,
            route: Route,
          },
          {
            path: '/auth/classic/lock-screen',
            name: 'Lock Screen',
            element: <LockScreenClassic />,
            route: Route,
          },
          {
            path: '/auth/creative/lock-screen',
            name: 'Lock Screen',
            element: <LockScreenCreative />,
            route: Route,
          },
          {
            path: '/auth/corporate/lock-screen',
            name: 'Lock Screen',
            element: <LockScreenCorporate />,
            route: Route,
          },
          {
            path: '/auth/modern/lock-screen',
            name: 'Lock Screen',
            element: <LockScreenModern />,
            route: Route,
          },
        ],
      },
    ],
  },
]

// Error


// Email Templates
const emailRoutes: RoutesProps[] = [
  {
    path: '/email-template/et-welcome-message',
    name: 'Welcome Message',
    element: <EmailTemplateWelcomeMessage />,
    route: Route,
  },
  {
    path: '/email-template/et-confirm-account',
    name: 'Confirm Account',
    element: <EmailTemplateConfirmAccount />,
    route: Route,
  },
  {
    path: '/email-template/et-reset-password',
    name: 'Reset Password',
    element: <EmailTemplateResetPassword />,
    route: Route,
  },
  {
    path: '/email-template/et-expired-card',
    name: 'Expired Card',
    element: <EmailTemplateExpiredCard />,
    route: Route,
  },
  {
    path: '/email-template/et-coupon-sale',
    name: 'Coupon Sale',
    element: <EmailTemplateCouponSale />,
    route: Route,
  },
  {
    path: '/email-template/et-latest-update',
    name: 'Latest Update',
    element: <EmailTemplateLatestUpdate />,
    route: Route,
  },
]

// Docs
const docsRoutes: RoutesProps[] = [
  {
    path: '../docs/support.html',
    name: 'Support',
  },
  {
    path: '../docs/changelog.html',
    name: 'Changelog',
  },
  {
    path: '../docs/documentation.html',
    name: 'Documentation',
  },
]

// flatten the list of all nested routes
const flattenRoutes = (routes: RoutesProps[]) => {
  let flatRoutes: RoutesProps[] = []

  routes = routes || []
  routes.forEach((item: RoutesProps) => {
    flatRoutes.push(item)
    if (typeof item.children !== 'undefined') {
      flatRoutes = [...flatRoutes, ...flattenRoutes(item.children)]
    }
  })
  return flatRoutes
}

// All routes
const authProtectedRoutes = [dashboardRoutes, appsRoutes, pagesRoutes]
const publicRoutes = [...authRoutes, ... emailRoutes, ...docsRoutes]

const authProtectedFlattenRoutes = flattenRoutes([...authProtectedRoutes])
const publicProtectedFlattenRoutes = flattenRoutes([...publicRoutes])
export {
  authProtectedFlattenRoutes,
  authProtectedRoutes,
  publicProtectedFlattenRoutes,
  publicRoutes,
}
