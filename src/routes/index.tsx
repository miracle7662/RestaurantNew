import React from 'react'
import { Route, RouteProps } from 'react-router-dom'

// PrivateRoute
import PrivateRoute from './PrivateRoute'
//import ItemGroup from '@/components/Apps/ItemGroup/itemGroup'
import Billing from '@/views/pages/account-settings/Billing'
import Customers from '@/views/apps/Transaction/Customers'
import Settlement from '@/views/apps/Transaction/Settlement'
import Handover from '@/views/apps/Transaction/Handover'
import DayEnd from '../views/apps/Transaction/DayEnd'
const KotTransfer = React.lazy(() => import('../views/apps/Transaction/KotTransfer'))


// DAaily Reports
import Reports from '../views/apps/Transaction/Reports'

// Daily Reports
import DailySalesReport from '../views/apps/Masters/Reports/DailySalesReport'
import DailySalesusershift from '../views/apps/Masters/Reports/DailySalesusershift'
import MonthlySales from '../views/apps/Masters/Reports/MonthlySales'
import PaymentModeSales from '../views/apps/Masters/Reports/PaymentModeSales'
import KitchenAllocation from '../views/apps/Masters/Reports/KitchenAllocation'
import DayEndReport from '../views/apps/Masters/Reports/DayEndReport'
import HandoverReport from '../views/apps/Masters/Reports/HandoverReport'
import BillReprinted from '../views/apps/Masters/Reports/BillReprinted'
import KotUsedSummary from '../views/apps/Masters/Reports/KotUsedSummary'
import BillSummary from '../views/apps/Masters/Reports/BillSummary'
import CreditSummary from '../views/apps/Masters/Reports/CreditSummary'
import DiscountSummary from '../views/apps/Masters/Reports/DiscountSummary'
import ReverseKOTsAndBills from '../views/apps/Masters/Reports/ReverseKOTsAndBills'
import KitchenWiseSalesSummary from '../views/apps/Masters/Reports/KitchenWiseSalesSummary'
import NCKOTDetails from '../views/apps/Masters/Reports/NCKOTDetails'
import APCAPPReport from '../views/apps/Masters/Reports/APCAPPReport'
import SpecialItems from '../views/apps/Masters/Reports/SpecialItems'
import CashPaidReceivedBetweenDepartments from '../views/apps/Masters/Reports/CashPaidReceivedBetweenDepartments'

 
// Dashboards
const Ecommerce = React.lazy(() => import('./../views/dashboards'))
const Analytics = React.lazy(() => import('./../views/dashboards/Analytics'))
const CRM = React.lazy(() => import('./../views/dashboards/CRM'))

// Apps
const Chat = React.lazy(() => import('./../views/apps/Chat'))
const Email = React.lazy(() => import('./../views/apps/Email'))
const Invoice = React.lazy(() => import('./../views/apps/Invoice'))
const Kanban = React.lazy(() => import('./../views/apps/Kanban'))
const Contact = React.lazy(() => import('./../views/apps/Contact'))
const Calendar = React.lazy(() => import('./../views/apps/Calendar'))
const Tableview = React.lazy(() => import('../views/apps/Tableview'))
const Billview = React.lazy(() => import('../views/apps/Billview'))


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
const AddOutlet = React.lazy(() => import('../views/apps/Masters/CommanMasters/Outlet/AddOutlet'))
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








// Base UI
const Accordions = React.lazy(() => import('./../views/uielements/base/Accordions'))
const Avatars = React.lazy(() => import('./../views/uielements/base/Avatars'))
const Buttons = React.lazy(() => import('./../views/uielements/base/Buttons'))
const Cards = React.lazy(() => import('./../views/uielements/base/Cards'))
const Carousels = React.lazy(() => import('./../views/uielements/base/Carousels'))
const Dropdowns = React.lazy(() => import('./../views/uielements/base/Dropdowns'))
const Modals = React.lazy(() => import('./../views/uielements/base/Modals'))
const NavTabs = React.lazy(() => import('./../views/uielements/base/NavTabs'))
const Toasts = React.lazy(() => import('./../views/uielements/base/Toasts'))
const Miscellaneous = React.lazy(() => import('./../views/uielements/base/Miscellaneous'))

// Icons
const Flaticon = React.lazy(() => import('./../views/uielements/icons/Flaticon'))
const Feather = React.lazy(() => import('./../views/uielements/icons/Feather'))
const Bootstrap = React.lazy(() => import('./../views/uielements/icons/Bootstrap'))
const BoxIcons = React.lazy(() => import('./../views/uielements/icons/BoxIcons'))
const FontAwesome = React.lazy(() => import('./../views/uielements/icons/FontAwesome'))
const Lucide = React.lazy(() => import('./../views/uielements/icons/Lucide'))
const Tabler = React.lazy(() => import('./../views/uielements/icons/Tabler'))
const Weather = React.lazy(() => import('./../views/uielements/icons/Weather'))

// Tables
const BootstapTable = React.lazy(() => import('./../views/uielements/tables/BootstapTable'))
const ReactTable = React.lazy(() => import('./../views/uielements/tables/ReactTable'))

// Charts
const ApexCharts = React.lazy(() => import('./../views/uielements/charts/ApexCharts'))
const ChartJs = React.lazy(() => import('./../views/uielements/charts/ChartJs'))
const Recharts = React.lazy(() => import('./../views/uielements/charts/Recharts'))
const Progressbar = React.lazy(() => import('./../views/uielements/charts/Progressbar'))

// Forms
const AdvRadio = React.lazy(() => import('./../views/uielements/forms/AdvRadio'))
const AdvCheckbox = React.lazy(() => import('./../views/uielements/forms/AdvCheckbox'))
const AdvSwitch = React.lazy(() => import('./../views/uielements/forms/AdvSwitch'))
const Elements = React.lazy(() => import('./../views/uielements/forms/Elements'))
const Validation = React.lazy(() => import('./../views/uielements/forms/Validation'))
const InputMask = React.lazy(() => import('./../views/uielements/forms/InputMask'))
const NoUiSlider = React.lazy(() => import('./../views/uielements/forms/NoUiSlider'))

// Editors
const EditorQuill = React.lazy(() => import('./../views/uielements/editors/EditorQuill'))
const EditorTinyMCE = React.lazy(() => import('./../views/uielements/editors/EditorTinyMCE'))

// Pickers
const Flatpickr = React.lazy(() => import('./../views/uielements/pickers/Flatpickr'))
const DaterangePicker = React.lazy(() => import('./../views/uielements/pickers/DaterangePicker'))

// Maps
const VectorMaps = React.lazy(() => import('./../views/uielements/maps/VectorMaps'))

// Extended
const ReactSelect = React.lazy(() => import('./../views/uielements/extended/ReactSelect'))
const SweetAlert2 = React.lazy(() => import('./../views/uielements/extended/SweetAlert2'))
const ReactSlick = React.lazy(() => import('./../views/uielements/extended/ReactSlick'))
const Dropzone = React.lazy(() => import('./../views/uielements/extended/Dropzone'))
const HotToast = React.lazy(() => import('./../views/uielements/extended/HotToast'))
const Toastify = React.lazy(() => import('./../views/uielements/extended/Toastify'))

// User Profile
const Overview = React.lazy(() => import('../views/pages/user-profile/Overview'))
const Activity = React.lazy(() => import('../views/pages/user-profile/Activity'))
const Followers = React.lazy(() => import('../views/pages/user-profile/Followers'))
const Contacts = React.lazy(() => import('../views/pages/user-profile/Contacts'))
const Projects = React.lazy(() => import('../views/pages/user-profile/Projects'))
const Gallery = React.lazy(() => import('../views/pages/user-profile/Gallery'))

// Account Settings
const Account = React.lazy(() => import('../views/pages/account-settings/Account'))
const Security = React.lazy(() => import('../views/pages/account-settings/Security'))
const Notifications = React.lazy(() => import('../views/pages/account-settings/Notifications'))

const Integrations = React.lazy(() => import('../views/pages/account-settings/Integrations'))

// Other Pages
const StarterPage = React.lazy(() => import('../views/pages/other-pages/StarterPage'))
const FAQs = React.lazy(() => import('../views/pages/other-pages/FAQs'))
const Pricing = React.lazy(() => import('../views/pages/other-pages/Pricing'))
const AboutUs = React.lazy(() => import('../views/pages/other-pages/AboutUs'))
const ContactUs = React.lazy(() => import('../views/pages/other-pages/ContactUs'))
const PrivacyPolicy = React.lazy(() => import('../views/pages/other-pages/PrivacyPolicy'))
const TermsServices = React.lazy(() => import('../views/pages/other-pages/TermsServices'))

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

// Error
const NotFound = React.lazy(() => import('../views/error/NotFound'))
const ServerError = React.lazy(() => import('../views/error/ServerError'))
const NotAuthorized = React.lazy(() => import('../views/error/NotAuthorized'))
const CommingSoon = React.lazy(() => import('../views/error/CommingSoon'))
const UnderMaintenance = React.lazy(() => import('../views/error/UnderMaintenance'))

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
      path: '/apps/chat',
      name: 'Chat',
      element: <Chat />,
      route: PrivateRoute,
    },
    {
      path: '/apps/email',
      name: 'Email',
      element: <Email />,
      route: PrivateRoute,
    },
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
      path: '/apps/kanban',
      name: 'Kanban',
      element: <Kanban />,
      route: PrivateRoute,
    },
    {
      path: '/apps/calendar',
      name: 'Calendar',
      element: <Calendar />,
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
      path: '/Reports',
      name: 'Reports',
      header: 'Navigation',
      children: [
        {
          path: '/Reports/DailySalesReport',
          name: 'DailySalesReport',
          element: <DailySalesReport />,
          route: PrivateRoute,
        },
        {
          path: '/Reports/DailySalesusershift',
          name: 'DailySalesusershift',
          element: <DailySalesusershift />,
          route: PrivateRoute,
        },
        {
          path: '/Reports/MonthlySales',
          name: 'MonthlySales',
          element: <MonthlySales />,
          route: PrivateRoute,
        },
        {
          path: '/Reports/PaymentModeSales',
          name: 'PaymentModeSales',
          element: <PaymentModeSales />,
          route: PrivateRoute,
        },
        {
          path: '/Reports/KitchenAllocation',
          name: 'KitchenAllocation',
          element: <KitchenAllocation />,
          route: PrivateRoute,
        },
        {
          path: '/Reports/DayEndReport',
          name: 'DayEndReport',
          element: <DayEndReport />,
          route: PrivateRoute,
        },
        {
          path: '/Reports/HandoverReport',
          name: 'HandoverReport',
          element: <HandoverReport />,
          route: PrivateRoute,
        },
        {
          path: '/Reports/BillReprinted',
          name: 'BillReprinted',
          element: <BillReprinted />,
          route: PrivateRoute,
        },
        {
          path: '/Reports/KotUsedSummary',
          name: 'KotUsedSummary',
          element: <KotUsedSummary />,
          route: PrivateRoute,
        },
        {
          path: '/Reports/BillSummary',
          name: 'BillSummary',
          element: <BillSummary />,
          route: PrivateRoute,
        },
        {
          path: '/Reports/CreditSummary',
          name: 'CreditSummary',
          element: <CreditSummary />,
          route: PrivateRoute,
        },
        {
          path: '/Reports/DiscountSummary',
          name: 'DiscountSummary',
          element: <DiscountSummary />,
          route: PrivateRoute,
        },
        {
          path: '/Reports/ReverseKOTsAndBills',
          name: 'ReverseKOTsAndBills',
          element: <ReverseKOTsAndBills />,
          route: PrivateRoute,
        },
        {
          path: '/Reports/KitchenWiseSalesSummary',
          name: 'KitchenWiseSalesSummary',
          element: <KitchenWiseSalesSummary />,
          route: PrivateRoute,
        },
        {
          path: '/Reports/NCKOTDetails',
          name: 'NCKOTDetails',
          element: <NCKOTDetails />,
          route: PrivateRoute,
        },
        {
          path: '/Reports/APCAPPReport',
          name: 'APCAPPReport',
          element: <APCAPPReport />,
          route: PrivateRoute,
        },
        {
          path: '/Reports/SpecialItems',
          name: 'SpecialItems',
          element: <SpecialItems />,
          route: PrivateRoute,
        },
        {
          path: '/Reports/CashPaidReceivedBetweenDepartments',
          name: 'CashPaidReceivedBetweenDepartments',
          element: <CashPaidReceivedBetweenDepartments />,
          route: PrivateRoute,
        },
      ],
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
      path: '/apps/Billing',
      name: 'Billing',
      element: <Billing />,
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
const componentsRoutes: RoutesProps = {
  path: '/components',
  name: 'Components',
  header: 'UI Elements',
  children: [
    {
      path: '/components/base',
      name: 'Base UI',
      children: [
        {
          path: '/components/base/accordions',
          name: 'Accordions',
          element: <Accordions />,
          route: PrivateRoute,
        },
        {
          path: '/components/base/avatars',
          name: 'Avatars',
          element: <Avatars />,
          route: PrivateRoute,
        },
        {
          path: '/components/base/buttons',
          name: 'Buttons',
          element: <Buttons />,
          route: PrivateRoute,
        },
        {
          path: '/components/base/cards',
          name: 'Cards',
          element: <Cards />,
          route: PrivateRoute,
        },
        {
          path: '/components/base/carousel',
          name: 'Carousels',
          element: <Carousels />,
          route: PrivateRoute,
        },
        {
          path: '/components/base/dropdowns',
          name: 'Dropdowns',
          element: <Dropdowns />,
          route: PrivateRoute,
        },
        {
          path: '/components/base/modals',
          name: 'Modals',
          element: <Modals />,
          route: PrivateRoute,
        },
        {
          path: '/components/base/navtabs',
          name: 'NavTabs',
          element: <NavTabs />,
          route: PrivateRoute,
        },
        {
          path: '/components/base/toasts',
          name: 'Toasts',
          element: <Toasts />,
          route: PrivateRoute,
        },
        {
          path: '/components/base/miscellaneous',
          name: 'Miscellaneous',
          element: <Miscellaneous />,
          route: PrivateRoute,
        },
      ],
    },
    {
      path: '/components/icons',
      name: 'Icons',
      children: [
        {
          path: '/components/icons/flaticon',
          name: 'Flaticon',
          element: <Flaticon />,
          route: PrivateRoute,
        },
        {
          path: '/components/icons/feather',
          name: 'Feather',
          element: <Feather />,
          route: PrivateRoute,
        },
        {
          path: '/components/icons/bootstrap',
          name: 'Bootstrap',
          element: <Bootstrap />,
          route: PrivateRoute,
        },
        {
          path: '/components/icons/boxicons',
          name: 'BoxIcons',
          element: <BoxIcons />,
          route: PrivateRoute,
        },
        {
          path: '/components/icons/fontawesome',
          name: 'FontAwesome',
          element: <FontAwesome />,
          route: PrivateRoute,
        },
        {
          path: '/components/icons/lucide',
          name: 'Lucide',
          element: <Lucide />,
          route: PrivateRoute,
        },
        {
          path: '/components/icons/tabler',
          name: 'Tabler',
          element: <Tabler />,
          route: PrivateRoute,
        },
        {
          path: '/components/icons/weather',
          name: 'Weather',
          element: <Weather />,
          route: PrivateRoute,
        },







      ],
    },
    {
      path: '/components/tables',
      name: 'Tables',
      children: [
        {
          path: '/components/tables/bootstap-table',
          name: 'Bootstap',
          element: <BootstapTable />,
          route: PrivateRoute,
        },
        {
          path: '/components/tables/react-table',
          name: 'ReactTable',
          element: <ReactTable />,
          route: PrivateRoute,
        },
      ],
    },
    {
      path: '/components/charts',
      name: 'Charts',
      children: [
        {
          path: '/components/charts/apexcharts',
          name: 'ApexCharts',
          element: <ApexCharts />,
          route: PrivateRoute,
        },
        {
          path: '/components/charts/chartjs',
          name: 'ChartJS',
          element: <ChartJs />,
          route: PrivateRoute,
        },
        {
          path: '/components/charts/recharts',
          name: 'Recharts',
          element: <Recharts />,
          route: PrivateRoute,
        },
        {
          path: '/components/charts/progressbar',
          name: 'Progressbar',
          element: <Progressbar />,
          route: PrivateRoute,
        },
      ],
    },
    {
      path: '/components/forms',
      name: 'Forms',
      children: [
        {
          path: '/components/forms/adv-radio',
          name: 'Radios',
          element: <AdvRadio />,
          route: PrivateRoute,
        },
        {
          path: '/components/forms/adv-checkbox',
          name: 'Checkboxs',
          element: <AdvCheckbox />,
          route: PrivateRoute,
        },
        {
          path: '/components/forms/adv-switch',
          name: 'Switchs',
          element: <AdvSwitch />,
          route: PrivateRoute,
        },
        {
          path: '/components/forms/elements',
          name: 'Elements',
          element: <Elements />,
          route: PrivateRoute,
        },
        {
          path: '/components/forms/validation',
          name: 'Validation',
          element: <Validation />,
          route: PrivateRoute,
        },
        {
          path: '/components/forms/inputmask',
          name: 'InputMask',
          element: <InputMask />,
          route: PrivateRoute,
        },
        {
          path: '/components/forms/nouislider',
          name: 'noUiSlider',
          element: <NoUiSlider />,
          route: PrivateRoute,
        },
      ],
    },
    {
      path: '/components/editors',
      name: 'Editors',
      children: [
        {
          path: '/components/editors/quill',
          name: 'Quill',
          element: <EditorQuill />,
          route: PrivateRoute,
        },
        {
          path: '/components/editors/tinymce',
          name: 'TinyMCE',
          element: <EditorTinyMCE />,
          route: PrivateRoute,
        },
      ],
    },
    {
      path: '/components/pickers',
      name: 'Pickers',
      children: [
        {
          path: '/components/pickers/flatpickr',
          name: 'Flatpickr',
          element: <Flatpickr />,
          route: PrivateRoute,
        },
        {
          path: '/components/pickers/daterangepicker',
          name: 'Daterange',
          element: <DaterangePicker />,
          route: PrivateRoute,
        },
      ],
    },
    {
      path: '/components/maps',
      name: 'Maps',
      children: [
        {
          path: '/components/maps/vector-maps',
          name: 'Vector Maps',
          element: <VectorMaps />,
          route: PrivateRoute,
        },
      ],
    },
    {
      path: '/components/extended',
      name: 'Extended',
      children: [
        {
          path: '/components/extended/select2',
          name: 'React2',
          element: <ReactSelect />,
          route: PrivateRoute,
        },
        {
          path: '/components/extended/sweetalert2',
          name: 'SweetAlert2',
          element: <SweetAlert2 />,
          route: PrivateRoute,
        },
        {
          path: '/components/extended/react-slick',
          name: 'React Slick',
          element: <ReactSlick />,
          route: PrivateRoute,
        },
        {
          path: '/components/extended/dropzone',
          name: 'Dropzone',
          element: <Dropzone />,
          route: PrivateRoute,
        },
        {
          path: '/components/extended/hottoast',
          name: 'HotToast',
          element: <HotToast />,
          route: PrivateRoute,
        },
        {
          path: '/components/extended/toastify',
          name: 'Toastify',
          element: <Toastify />,
          route: PrivateRoute,
        },
      ],
    },
  ],
}

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
    {
      path: '/pages/account-settings',
      name: 'Account Settings',
      children: [
        {
          path: '/account-settings/account',
          name: 'Account',
          element: <Account />,
          route: PrivateRoute,
        },
        {
          path: '/account-settings/security',
          name: 'Security',
          element: <Security />,
          route: PrivateRoute,
        },
        {
          path: '/account-settings/notifications',
          name: 'Notifications',
          element: <Notifications />,
          route: PrivateRoute,
        },
        {
          path: '/account-settings/billing',
          name: 'Plan & Billing',
          element: <Billing />,
          route: PrivateRoute,
        },
        {
          path: '/account-settings/integrations',
          name: 'Integrations',
          element: <Integrations />,
          route: PrivateRoute,
        },
      ],
    },
    {
      path: '/pages/other-pages',
      name: 'Other Pages',
      children: [
        {
          path: '/other-pages/starter',
          name: 'Starter',
          element: <StarterPage />,
          route: PrivateRoute,
        },
        {
          path: '/other-pages/faqs',
          name: 'FAQs',
          element: <FAQs />,
          route: PrivateRoute,
        },
        {
          path: '/other-pages/pricing',
          name: 'Pricing',
          element: <Pricing />,
          route: PrivateRoute,
        },
        {
          path: '/other-pages/about-us',
          name: 'About Us',
          element: <AboutUs />,
          route: PrivateRoute,
        },
        {
          path: '/other-pages/contact-us',
          name: 'Contact Us',
          element: <ContactUs />,
          route: PrivateRoute,
        },
        {
          path: '/other-pages/privacy-policy',
          name: 'Privacy & Policy',
          element: <PrivacyPolicy />,
          route: PrivateRoute,
        },
        {
          path: '/other-pages/terms-services',
          name: 'Terms of Services',
          element: <TermsServices />,
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
const errorRoutes: RoutesProps[] = [
  {
    path: '*',
    name: 'Not Found',
    element: <NotFound />,
    route: Route,
  },
  {
    path: '/error-pages/server-error',
    name: 'Server Error',
    element: <ServerError />,
    route: Route,
  },
  {
    path: '/error-pages/not-authorized',
    name: 'Not Authorized',
    element: <NotAuthorized />,
    route: Route,
  },
  {
    path: '/access-denied',
    name: 'Access Denied',
    element: <NotAuthorized />,
    route: Route,
  },
  {
    path: '/error-pages/comming-soon',
    name: 'Comming Soon',
    element: <CommingSoon />,
    route: Route,
  },
  {
    path: '/error-pages/under-maintenance',
    name: 'Under Maintenance',
    element: <UnderMaintenance />,
    route: Route,
  },
]

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
const authProtectedRoutes = [dashboardRoutes, appsRoutes, pagesRoutes, componentsRoutes]
const publicRoutes = [...authRoutes, ...errorRoutes, ...emailRoutes, ...docsRoutes]

const authProtectedFlattenRoutes = flattenRoutes([...authProtectedRoutes])
const publicProtectedFlattenRoutes = flattenRoutes([...publicRoutes])
export {
  authProtectedFlattenRoutes,
  authProtectedRoutes,
  publicProtectedFlattenRoutes,
  publicRoutes,
}
