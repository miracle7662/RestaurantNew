export interface MenuItemTypes {
  key: string
  label: string
  isTitle?: boolean
  icon?: string
  url?: string
  parentKey?: string
  target?: string
  children?: MenuItemTypes[]
}

const MENU_ITEMS: MenuItemTypes[] = [
  //Navigation

  // Menu 1

  // Apps

    {
    key: '',
    label: '',
    isTitle: true,
  },


  {
    key: '  Orders',
    label: 'POS',
    url: '/apps/Orders',
    icon: 'fi fi-rr-utensils',
    parentKey: 'apps',
  },

  {
    key: 'Tableview',
    label: 'Orders',
    url: '/apps/Tableview',
    icon: 'fi fi-rr-grid',
    parentKey: 'apps',
  },


  {
    key: 'Settlement',
    label: 'Settlement',
    url: '/apps/Settlement',
    icon: 'fi fi-rr-credit-card',
    parentKey: 'apps',
  },

    {
    key: 'KitchenAllocation',
    label: 'Kitchen Allocation',
    url: '/apps/KitchenAllocation',
    icon: 'fi fi-rr-apps',
    parentKey: 'apps',
  },

  {
    key: 'Handover',
    label: 'Handover',
    url: '/apps/Handover',
    icon: 'fi fi-rr-exchange',
    parentKey: 'apps',
  },

  {
    key: 'DayEnd',
    label: 'DayEnd',
    url: '/apps/DayEnd',
    icon: 'fi fi-rr-clock',
    parentKey: 'apps',
  },

  // {
  //   key: 'KotTransfer',
  //   label: 'KotTransfer',
  //   url: '/apps/KotTransfer',
  //   icon: 'fi fi-rr-refresh',
  //   parentKey: 'apps',
  // },

  {
    key: 'Customers',
    label: 'Customers',
    url: '/apps/Customers',
    icon: 'fi fi-rr-user',
    parentKey: 'apps',
  },
    {
        key: 'Menu',
        label: 'Menu',
        url: '/apps/menu',
        icon: 'fi fi-rr-list',
        parentKey: 'apps',
      },

  // {
  //   key: 'Reports',
  //   label: 'Reports',
  //   url: '/apps/Reports',
  //   icon: 'fi fi-rs-mobile',
  //   parentKey: 'apps',
  // },
  {
    key: 'DailySalesReport',
    label: 'Report',
    url: '/Reports/DailySalesReport',
    icon: 'fi fi-rr-chart-histogram',
    parentKey: 'Reports',
  },

  {
    key: 'Settings',
    label: 'Settings',
    url: '/apps/settings',
    icon: 'fi fi-rr-settings',
    parentKey: 'apps',
  },

   {
    key: 'BackdatedDayend',
    label: 'Dayend Report',
    url: '/apps/BackdatedDayend',
    icon: 'fi fi-rr-settings',
    parentKey: 'apps',
  },

  {
    key: 'Logout',
    label: 'logout',
    url: '/auth/minimal/login',
    icon: 'fi fi-sr-sign-out-alt',
    parentKey: 'apps',
  },

  



  //Menu 2

  // {
  //   key: 'SuperAdmin',
  //   label: 'SuperAdmin',
  //   isTitle: true,
  // },

  

  

  

  // {
  //   key: 'Billview',
  //   label: 'Billview',
  //   url: '/apps/Billview',
  //   icon: 'fi fi-rr-file-invoice-dollar',
  //   parentKey: 'apps',
  // },




  {
    key: 'HotelAdmin',
    label: 'HotelAdmin',
    isTitle: true,
  },

  {
    key: 'Brand',
    label: 'Brand',
    url: '/OutletConfigration/Brand',
    icon: 'fi fi-rr-building ',
    parentKey: 'OutletConfigration',
  },

  {
    key: 'HotelConfigration',
    label: 'Hotel Configration',
    isTitle: false,
    icon: 'fi fi-rr-hotel ',
    children: [
      {
        key: 'Market ',
        label: 'Market',
        url: '/OutletConfigration/Market',
        parentKey: 'OutletConfigration',
      },

      {
        key: 'Outlet',
        label: 'Outlet',
        url: '/OutletConfigration/Outlet',
        parentKey: 'OutletConfigration',
      },

      {
        key: 'OutletMenu',
        label: 'OutletMenu',
        url: '/apps/OutletMenu',
        parentKey: 'apps',
      },

      {
        key: 'OutletDesignation',
        label: 'OutletDesignation',
        url: '/OutletConfigration/OutletDesignation',
        parentKey: 'OutletConfigration',
      },
      {
        key: 'OutletUser',
        label: 'OutletUser',
        url: '/OutletConfigration/OutletUser',
        parentKey: 'OutletConfigration',
      },
      {
        key: 'OutletPaymentMode',
        label: 'OutletPaymentMode',
        url: '/OutletConfigration/OutletPaymentMode',
        parentKey: 'OutletConfigration',
      },
      {
        key: 'OrderTypeConfiguration',
        label: 'OrderTypeConfiguration',
        url: '/OutletConfigration/OrderTypeConfiguration',
        parentKey: 'OutletConfigration',
      },

      {
    key: 'Warehouse',
    label: 'Warehouse',
    url: '/apps/Warehouse',
    parentKey: 'apps',
  },
      // {
      //   key: 'AddOutlet',
      //   label: 'AddOutlet',
      //   url: '/OutletConfigration/AddOutlet',
      //   parentKey: 'OutletConfigration',
      // },

      // {
      //   key: 'Manage',
      //   label: 'Manage',
      //   url: '/OutletConfigration/Manage',
      //   parentKey: 'OutletConfigration',
      // },
      // {
      //   key: 'ManageStore',
      //   label: 'ManageStore',
      //   url: '/OutletConfigration/ManageStore',
      //   parentKey: 'OutletConfigration',
      // },
      //  {
      //   key: 'ManagePosAccessLevel',
      //   label: 'ManagePosAccessLevel',
      //   url: '/OutletConfigration/ManagePosAccessLevel',
      //   parentKey: 'OutletConfigration',
      // },
      //  {
      //   key: 'ManageMPOSAccessLevel',
      //   label: 'ManageMPOSAccessLevel',
      //   url: '/OutletConfigration/ManageMPOSAccessLevel',
      //   parentKey: 'OutletConfigration',
      // },
    ],
  },

  {
    key: 'Masters',
    label: 'Masters ',
    isTitle: false,
    icon: 'fi fi-rr-folder',
    children: [
     

     

      {
        key: 'country ',
        label: 'Country',
        url: '/masterpages/country',
        parentKey: 'masterPages',
      },

      {
        key: 'states',
        label: 'States',
        url: '/masterpages/states',
        parentKey: 'masterPages',
      },

      {
        key: 'city',
        label: 'City',
        url: '/masterpages/city',
        parentKey: 'masterPages',
      },
      {
        key: 'HotelTypeMasters',
        label: 'Hotel Type Masters',
        url: '/masterpages/HotelTypeMasters',
        parentKey: 'masterPages',
      },

      {
        key: 'UserType',
        label: 'User Type ',
        url: '/masterpages/UserType',
        parentKey: 'masterPages',
      },

     
    ],
  },

   {
    key: 'TableManagement',
    label: 'TableManagement',
    isTitle: false,
    icon: 'fi fi-rr-dashboard',
    children: [
     
      {
        key: 'TableDepartment',
        label: 'TableDepartment',
        url: '/apps/TableDepartment',
        parentKey: 'apps',
      },
       {
        key: 'TableManagement',
        label: 'TableManagement',
        url: '/apps/TableManagement',
        parentKey: 'apps',
      },
       {
        key: 'TaxProuductGroup',
        label: 'TaxProuductGroup',
        url: '/apps/TaxProuductGroup',
        parentKey: 'apps',
      },
      {
        key: 'Resttaxmaster',
        label: 'RestTaxMaster',
        url: '/apps/Resttaxmaster',
        parentKey: 'apps',
      },

    ],
  },

    {
    key: 'AccountingMasters',
    label: 'AccountingMasters ',
    isTitle: false,
    icon: 'fi fi-rr-book',
    children: [
     
      {
        key: 'AccountType',
        label: 'Account Type ',
        url: '/accountingMasters/AccountType',
        parentKey: 'masterPages',
      },

      {
        key: 'AccountNature',
        label: 'Account Nature ',
        url: '/accountingMasters/AccountNature',
        parentKey: 'masterPages',
      },
      {
        key: 'AccountLedger',
        label: 'Ledger Account',
        url: '/accountingMasters/AccountLedger',
        parentKey: 'masterPages',
      },
    ],
  },
  

  {
    key: 'MenuMasters',
    label: 'Menu Masters',
    isTitle: false,
    icon: 'fi fi-rr-hamburger',
    children: [
      {
        key: 'Menu',
        label: 'Menu',
        url: '/apps/menu',
        parentKey: 'apps',
      },

      {
        key: 'ItemGroup',
        label: 'ItemGroup',
        url: '/apps/ItemGroup',
        parentKey: 'apps',
      },
      {
        key: 'ItemMainGroup',
        label: 'ItemMainGroup',
        url: '/apps/ItemMainGroup',
        parentKey: 'apps',
      },
      {
        key: 'KitchenCategories',
        label: 'KitchenCategories',
        url: '/apps/KitchenCategories',
        parentKey: 'apps',
      },
      {
        key: 'KitchenSubCategories',
        label: 'KitchenSubCategories',
        url: '/apps/KitchenSubCategories',
        parentKey: 'apps',
      },

      {
        key: 'KitchenGroup',
        label: 'kitchenGroup',
        url: '/apps/kitchenGroup',
        parentKey: 'apps',
      },

      {
        key: 'UnitMaster',
        label: 'UnitMaster',
        url: '/apps/UnitMaster',
        parentKey: 'apps',
      },
      // {
      //   key: 'MessageMaster',
      //   label: 'MessageMaster',
      //   url: '/apps/MessageMaster',
      //   parentKey: 'apps',
      // },
    ],
  },




  
  // {
  //   key: 'OrderDetails',
  //   label: 'OrderDetails',
  //   url: '/apps/orderDetails',
  //   icon: 'fi fi-ss-bars-sort',
  //   parentKey: 'apps',
  // },

  //   {
  //   key: 'BackdatedDayEndReport',
  //   label: 'Backdated DayEnd Report',
  //   url: '/apps/Masters/Reports/BackdatedDayEndReport',
  //   icon: 'fi fi-rr-print',
  //   parentKey: 'apps',
  // },

  //  {
  //   key: 'KotPrint',
  //   label: 'KOT Print',
  //   url: '/apps/KotPrint',
  //   icon: 'fi fi-rr-file-invoice',
  //   parentKey: 'apps',
  // },


   /* ================================================================
                  🏨 HOTEL BOOKING SECTION
================================================================ */




  {
    key: 'master-setting',
    label: 'Master Setting',
    isTitle: false,
    icon: 'fi fi-rr-settings-sliders',
    children: [
      {
        key: 'master-role',
        label: 'Role Master',
        url: '#!',
        parentKey: 'master-setting',
      },
    
     
      {
        key: 'master-zone',
        label: 'Zone Master',
        url: '/master-setting/zone-master',
        parentKey: 'master-setting',
      },
    
     
      {
        key: 'master-tax',
        label: 'Tax Master',
        url: '/master-setting/tax-master',
        parentKey: 'master-setting',
      },
      {
        key: 'master-package',
        label: 'Package Master',
        url: '/master-setting/package-master',
        parentKey: 'master-setting',
      },
       {
        key: 'Nationality-master',
        label: 'Nationality Master',
        url: '/master-setting/Nationality-master',
        parentKey: 'master-setting',
      },
       {
        key: 'feature-master',
        label: 'Feature Master',
        url: '/master-setting/Feature-master',
        parentKey: 'hotel-master',
      },
        {
        key: 'fragment-master',
        label: 'Fragment Master',
        url: '/master-setting/Fragment-master',
        parentKey: 'hotel-master',
      },
        {
        key: 'travel-agent-master',
        label: 'Travel Agent Master',
        url: '/master-setting/Travel-Agent-master',
        parentKey: 'hotel-master',
      },
      
    ],
  },

   {
    key: 'hotel-master',
    label: 'Hotel Master',
    isTitle: false,
    icon: 'fi fi-rr-settings-sliders',
    children: [
      {
        key: 'hotel-master',
        label: 'Floor Master',
        url: '/hotel-master/Floor-master',
        parentKey: 'hotel-master',
      },
       {
        key: 'block-master',
        label: 'Block Master',
        url: '/hotel-master/Block-master',
        parentKey: 'hotel-master',
      },

       {
        key: 'category-master',
        label: 'Category Master',
        url: '/hotel-master/Category-master',
        parentKey: 'hotel-master',
      },
      

      {
        key: 'BillSetting',
        label: 'Bill Setting Master',
        url: '/hotel-master/BillSetting',
        parentKey: 'hotel-master',
      },
     
       {
        key: 'InventoryMaster',
        label: 'InventoryMaster',
        url: '/hotel-master/Inventorymaster',
        parentKey: 'hotel-master',
      },
       {
        key: 'room-master',
        label: 'Room Master',
        url: '/hotel-master/Room-master',
        parentKey: 'hotel-master',
      },
       {
        key: 'company-master',
        label: 'Company Master',
        url: '/hotel-master/Company-master',
        parentKey: 'hotel-master',
      },
        {
        key: 'Guest-master',
        label: 'Guest Master',
        url: '/hotel-master/Guest-master',
        parentKey: 'hotel-master',
      },
         {
        key: 'Complimentary-master',
        label: 'Complimentary Master',
        url: '/hotel-master/Complimentary-master',
        parentKey: 'hotel-master',
      },
          {
        key: 'HotelBookingPanel',
        label: 'HotelBooking Panel',
        url: '/hotel-master/HotelBookingPanel',
        parentKey: 'hotel-master',
      }

      
    ],
  },

  {
    key: 'registration',
    label: 'Registration Hotels/Users',
    isTitle: false,
    icon: 'fi fi-rr-building',
    children: [
      {
        key: 'registration-hotels-users',
        label: 'Registration Hotels/Users',
        url: '/registration/hotels-users',
        parentKey: 'registration',
      },
    ],
  },

    

  // Pages

  // Authentication

  // Error

  // Email Templates
]
export { MENU_ITEMS }


const HORIZONTAL_MENU_ITEMS: MenuItemTypes[] = [
  {
    key: 'dashboard',
    label: 'Dashboards',
    isTitle: true,
    icon: 'fi fi-rr-dashboard',
    children: [
      {
        key: 'ecommerce',
        label: 'eCommerce',
        url: '/',
        parentKey: 'dashboard',
      },
      {
        key: 'analytics',
        label: 'Analytics',
        url: '/dashboards/analytics',
        parentKey: 'dashboard',
      },
      {
        key: 'crm',
        label: 'CRM',
        url: '/dashboards/crm',
        parentKey: 'dashboard',
      },
      // {
      //   key: 'pos',
      //   label: 'POS',
      //   url: '#!',
      //   parentKey: 'dashboards',
      // },
      // {
      //   key: 'nft',
      //   label: 'NFT',
      //   url: '#!',
      //   parentKey: 'dashboards',
      // },
      // {
      //   key: 'project',
      //   label: 'Project',
      //   url: '#!',
      //   parentKey: 'dashboards',
      // },
    ],
  },
]
export { HORIZONTAL_MENU_ITEMS }
