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
    key: 'apps',
    label: 'WebApps',
    isTitle: true,
  },
  {
    key: '  Orders',
    label: 'POS Orders',
    url: '/apps/orders',
    icon: 'fi fi-rr-shopping-cart',
    parentKey: 'apps',
  },

  {
    key: 'Settlement',
    label: 'Settlement',
    url: '/apps/Settlement',
    icon: 'fi fi-rs-sack-dollar',
    parentKey: 'apps',
  },

  {
    key: 'Handover',
    label: 'Handover',
    url: '/apps/Handover',
    icon: 'fi fi-rr-hand-holding-seeding',
    parentKey: 'apps',
  },

  {
    key: 'DayEnd',
    label: 'DayEnd',
    url: '/apps/DayEnd',
    icon: 'fi fi-rr-apps-add',
    parentKey: 'apps',
  },

  {
    key: 'KotTransfer',
    label: 'KotTransfer',
    url: '/apps/KotTransfer',
    icon: 'fi fi-rr-square-terminal',
    parentKey: 'apps',
  },

  {
    key: 'Customers',
    label: 'Customers',
    url: '/apps/Customers',
    icon: 'fi fi-rs-user-headset',
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
    icon: 'fi fi-rr-file-chart-line',
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
    key: 'Logout',
    label: 'logout',
    url: '/apps/logout',
    icon: 'fi fi-sr-sign-out-alt',
    parentKey: 'apps',
  },

  //Menu 2

  {
    key: 'SuperAdmin',
    label: 'SuperAdmin',
    isTitle: true,
  },

  {
    key: 'Brand',
    label: 'Brand',
    url: '/OutletConfigration/Brand',
    icon: 'fi fi-rr-dashboard ',
    parentKey: 'OutletConfigration',
  },

  {
    key: 'Warehouse',
    label: 'Warehouse',
    url: '/apps/Warehouse',
    icon: 'fi fi-sr-sign-out-alt',
    parentKey: 'apps',
  },

  {
    key: 'Tableview',
    label: 'Tableview',
    url: '/apps/Tableview',
    icon: 'fi fi-sr-sign-out-alt',
    parentKey: 'apps',
  },

  {
    key: 'Billview',
    label: 'Billview',
    url: '/apps/Billview',
    icon: 'fi fi-sr-sign-out-alt',
    parentKey: 'apps',
  },

  {
    key: 'HotelAdmin',
    label: 'HotelAdmin',
    isTitle: true,
  },

  {
    key: 'HotelConfigration',
    label: 'Hotel Configration',
    isTitle: false,
    icon: 'fi fi-rr-dashboard ',
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
    icon: 'fi fi-rr-dashboard',
    children: [
      {
        key: 'TaxProuductGroup',
        label: 'TaxProuductGroup',
        url: '/apps/TaxProuductGroup',
        parentKey: 'apps',
      },
      {
        key: 'Resttaxmaster',
        label: 'Resttaxmaster',
        url: '/apps/Resttaxmaster',
        parentKey: 'apps',
      },
      {
        key: 'TableManagement',
        label: 'TableManagement',
        url: '/apps/TableManagement',
        parentKey: 'apps',
      },

      {
        key: 'TableDepartment',
        label: 'TableDepartment',
        url: '/apps/TableDepartment',
        parentKey: 'apps',
      },

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

      {
        key: 'AccountType',
        label: 'Account Type ',
        url: '/masterpages/AccountType',
        parentKey: 'masterPages',
      },

      {
        key: 'AccountNature',
        label: 'Account Nature ',
        url: '/masterpages/AccountNature',
        parentKey: 'masterPages',
      },
      {
        key: 'AccountLedger',
        label: 'Ledger Account',
        url: '/masterpages/AccountLedger',
        parentKey: 'masterPages',
      },
    ],
  },

  {
    key: 'MenuMasters',
    label: 'Menu Masters',
    isTitle: false,
    icon: 'fi fi-rr-dashboard',
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
      {
        key: 'MessageMaster',
        label: 'MessageMaster',
        url: '/apps/MessageMaster',
        parentKey: 'apps',
      },
    ],
  },

  {
    key: 'printsettings',
    label: 'Print Settings',
    isTitle: false,
    icon: 'fi fi-rr-dashboard ',
    children: [
      // {
      //   key: 'KOTPrintSettings',
      //   label: 'KOTPrintSettings',
      //   url: '/OutletConfigration/KOTPrintSettings',
      //   parentKey: 'OutletConfigration',
      // },
      // {
      //   key: 'BillPrintSettings',
      //   label: 'BillPrintSettings',
      //   url: '/OutletConfigration/BillPrintSettings',
      //   parentKey: 'OutletConfigration',
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

  {
    key: 'invoice',
    label: 'Invoice',
    url: '/apps/invoice',
    icon: 'fi fi-rr-file-invoice',
    parentKey: 'apps',
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
