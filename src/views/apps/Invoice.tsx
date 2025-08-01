import React, { useState, useEffect, ChangeEvent } from 'react';
import {
  ExpandedState,
  SortingState,
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  getExpandedRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
} from '@tanstack/react-table';
import { Button, Modal, Form, Row, Col, Card, ToggleButton, Table, Navbar, Offcanvas } from 'react-bootstrap';

// Define the DepartmentRate interface
interface DepartmentRate {
  departmentName: string;
  rate: number;
}

// Define the Person interface (for sidebar data)
interface Person {
  userId: string;
  itemId: string;
  ItemName: string;
  printName: string;
  aliasName: string;
  kitchenCategory: string;
  kitchenSubCategory: string;
  kitchenMainGroup: string;
  itemMainGroup: string;
  itemGroup: string;
  stockUnit: string;
  tax: number;
  runtimeRates: boolean;
  isCommonToAllDepartments: boolean;
  departmentRates: DepartmentRate[];
  lastName: string;
  price: number;
  visits: number;
  sidebarStatus: string;
  cardStatus: string;
  progress: number;
  outlet: string;
  hotelName: string;
  subRows?: Person[];
}

// Define the CardItem interface (for main content cards)
interface CardItem {
  userId: string;
  itemId: string;
  ItemName: string;
  aliasName: string;
  price: number;
  visits: number;
  cardStatus: string;
}

// Define the Category type
type Category =
  | 'All'
  | 'Appetizers'
  | 'MainCourse'
  | 'Desserts'
  | 'Beverages'
  | 'Cocktails'
  | 'Salads'
  | 'Soups'
  | 'Breakfast'
  | 'VeganOptions';

// Sample data for sidebar
const makeData = (count: number): Person[] => {
  const data: Person[] = [
    {
      userId: '0',
      itemId: '000',
      ItemName: 'All',
      printName: 'All',
      aliasName: 'ALL',
      kitchenCategory: '',
      kitchenSubCategory: '',
      kitchenMainGroup: '',
      itemMainGroup: '',
      itemGroup: '',
      stockUnit: '',
      tax: 0,
      runtimeRates: false,
      isCommonToAllDepartments: true,
      departmentRates: [
        { departmentName: 'Front Office', rate: 0 },
        { departmentName: 'Garden', rate: 0 },
        { departmentName: 'Housekeeping', rate: 0 },
      ],
      lastName: '',
      price: 0,
      visits: 0,
      sidebarStatus: '✅ Available',
      cardStatus: '✅ Available',
      progress: 0,
      outlet: '',
      hotelName: '',
      subRows: [],
    },
    {
      userId: '1',
      itemId: '001',
      ItemName: 'Appetizers',
      printName: 'Appetizers',
      aliasName: 'ST',
      kitchenCategory: 'Main Kitchen',
      kitchenSubCategory: 'Hot Prep',
      kitchenMainGroup: 'Food',
      itemMainGroup: 'Main Course',
      itemGroup: 'Veg',
      stockUnit: 'Unit',
      tax: 5,
      runtimeRates: false,
      isCommonToAllDepartments: true,
      departmentRates: [
        { departmentName: 'Front Office', rate: 150 },
        { departmentName: 'Garden', rate: 150 },
        { departmentName: 'Housekeeping', rate: 150 },
      ],
      lastName: '',
      price: 150,
      visits: 10,
      sidebarStatus: '✅ Available',
      cardStatus: '✅ Available',
      progress: 0,
      outlet: 'Outlet A',
      hotelName: 'Hotel X',
      subRows: [],
    },
    {
      userId: '2',
      itemId: '002',
      ItemName: 'MainCourse',
      printName: 'Main Course',
      aliasName: 'PMF',
      kitchenCategory: 'Main Kitchen',
      kitchenSubCategory: 'Hot Prep',
      kitchenMainGroup: 'Food',
      itemMainGroup: 'Main Course',
      itemGroup: 'Veg',
      stockUnit: 'Unit',
      tax: 5,
      runtimeRates: false,
      isCommonToAllDepartments: true,
      departmentRates: [
        { departmentName: 'Front Office', rate: 200 },
        { departmentName: 'Garden', rate: 200 },
        { departmentName: 'Housekeeping', rate: 200 },
      ],
      lastName: '',
      price: 200,
      visits: 5,
      sidebarStatus: '✅ Available',
      cardStatus: '✅ Available',
      progress: 0,
      outlet: 'Outlet A',
      hotelName: 'Hotel X',
      subRows: [],
    },
    {
      userId: '3',
      itemId: '003',
      ItemName: 'Desserts',
      printName: 'Desserts',
      aliasName: 'RT',
      kitchenCategory: 'Main Kitchen',
      kitchenSubCategory: 'Cold Prep',
      kitchenMainGroup: 'Food',
      itemMainGroup: 'Side Dish',
      itemGroup: 'Veg',
      stockUnit: 'Unit',
      tax: 5,
      runtimeRates: false,
      isCommonToAllDepartments: true,
      departmentRates: [
        { departmentName: 'Front Office', rate: 50 },
        { departmentName: 'Garden', rate: 50 },
        { departmentName: 'Housekeeping', rate: 50 },
      ],
      lastName: '',
      price: 50,
      visits: 20,
      sidebarStatus: '✅ Available',
      cardStatus: '✅ Available',
      progress: 0,
      outlet: 'Outlet A',
      hotelName: 'Hotel X',
      subRows: [],
    },
    {
      userId: '4',
      itemId: '004',
      ItemName: 'Beverages',
      printName: 'Beverages',
      aliasName: 'CH',
      kitchenCategory: 'Main Kitchen',
      kitchenSubCategory: 'Hot Prep',
      kitchenMainGroup: 'Food',
      itemMainGroup: 'Bread',
      itemGroup: 'Veg',
      stockUnit: 'Unit',
      tax: 5,
      runtimeRates: false,
      isCommonToAllDepartments: true,
      departmentRates: [
        { departmentName: 'Front Office', rate: 20 },
        { departmentName: 'Garden', rate: 20 },
        { departmentName: 'Housekeeping', rate: 20 },
      ],
      lastName: '',
      price: 20,
      visits: 15,
      sidebarStatus: '✅ Available',
      cardStatus: '✅ Available',
      progress: 0,
      outlet: 'Outlet A',
      hotelName: 'Hotel X',
      subRows: [],
    },
    {
      userId: '5',
      itemId: '005',
      ItemName: 'Cocktails',
      printName: 'Cocktails',
      aliasName: 'DF',
      kitchenCategory: 'Main Kitchen',
      kitchenSubCategory: 'Hot Prep',
      kitchenMainGroup: 'Food',
      itemMainGroup: 'Main Course',
      itemGroup: 'Veg',
      stockUnit: 'Unit',
      tax: 5,
      runtimeRates: false,
      isCommonToAllDepartments: true,
      departmentRates: [
        { departmentName: 'Front Office', rate: 120 },
        { departmentName: 'Garden', rate: 120 },
        { departmentName: 'Housekeeping', rate: 120 },
      ],
      lastName: '',
      price: 120,
      visits: 8,
      sidebarStatus: '✅ Available',
      cardStatus: '✅ Available',
      progress: 0,
      outlet: 'Outlet A',
      hotelName: 'Hotel X',
      subRows: [],
    },
    {
      userId: '6',
      itemId: '006',
      ItemName: 'Salads',
      printName: 'Salads',
      aliasName: 'JR',
      kitchenCategory: 'Main Kitchen',
      kitchenSubCategory: 'Hot Prep',
      kitchenMainGroup: 'Food',
      itemMainGroup: 'Main Course',
      itemGroup: 'Veg',
      stockUnit: 'Unit',
      tax: 5,
      runtimeRates: false,
      isCommonToAllDepartments: true,
      departmentRates: [
        { departmentName: 'Front Office', rate: 100 },
        { departmentName: 'Garden', rate: 100 },
        { departmentName: 'Housekeeping', rate: 100 },
      ],
      lastName: '',
      price: 100,
      visits: 12,
      sidebarStatus: '✅ Available',
      cardStatus: '✅ Available',
      progress: 0,
      outlet: 'Outlet A',
      hotelName: 'Hotel X',
      subRows: [],
    },
    {
      userId: '7',
      itemId: '007',
      ItemName: 'Soups',
      printName: 'Soups',
      aliasName: 'MP',
      kitchenCategory: 'Main Kitchen',
      kitchenSubCategory: 'Cold Prep',
      kitchenMainGroup: 'Food',
      itemMainGroup: 'Appetizer',
      itemGroup: 'Veg',
      stockUnit: 'Unit',
      tax: 5,
      runtimeRates: false,
      isCommonToAllDepartments: true,
      departmentRates: [
        { departmentName: 'Front Office', rate: 40 },
        { departmentName: 'Garden', rate: 40 },
        { departmentName: 'Housekeeping', rate: 40 },
      ],
      lastName: '',
      price: 40,
      visits: 25,
      sidebarStatus: '✅ Available',
      cardStatus: '✅ Available',
      progress: 0,
      outlet: 'Outlet A',
      hotelName: 'Hotel X',
      subRows: [],
    },
    {
      userId: '8',
      itemId: '008',
      ItemName: 'Breakfast',
      printName: 'Breakfast',
      aliasName: 'GJ',
      kitchenCategory: 'Dessert',
      kitchenSubCategory: 'Pastry',
      kitchenMainGroup: 'Sweets',
      itemMainGroup: 'Desserts',
      itemGroup: 'Veg',
      stockUnit: 'Unit',
      tax: 5,
      runtimeRates: false,
      isCommonToAllDepartments: true,
      departmentRates: [
        { departmentName: 'Front Office', rate: 60 },
        { departmentName: 'Garden', rate: 60 },
        { departmentName: 'Housekeeping', rate: 60 },
      ],
      lastName: '',
      price: 60,
      visits: 18,
      sidebarStatus: '✅ Available',
      cardStatus: '✅ Available',
      progress: 0,
      outlet: 'Outlet A',
      hotelName: 'Hotel X',
      subRows: [],
    },
    {
      userId: '9',
      itemId: '009',
      ItemName: 'VeganOptions',
      printName: 'Vegan Options',
      aliasName: 'BN',
      kitchenCategory: 'Main Kitchen',
      kitchenSubCategory: 'Hot Prep',
      kitchenMainGroup: 'Food',
      itemMainGroup: 'Bread',
      itemGroup: 'Veg',
      stockUnit: 'Unit',
      tax: 5,
      runtimeRates: false,
      isCommonToAllDepartments: true,
      departmentRates: [
        { departmentName: 'Front Office', rate: 30 },
        { departmentName: 'Garden', rate: 30 },
        { departmentName: 'Housekeeping', rate: 30 },
      ],
      lastName: '',
      price: 30,
      visits: 22,
      sidebarStatus: '✅ Available',
      cardStatus: '✅ Available',
      progress: 0,
      outlet: 'Outlet A',
      hotelName: 'Hotel X',
      subRows: [],
    },
  ];
  return data.slice(0, count);
};

// Sample card items for main content
const initialCardItems: CardItem[] = [
  { userId: 'c1', itemId: 'c001', ItemName: 'Paneer Tikka', aliasName: 'PT', price: 9.99, visits: 15, cardStatus: '✅ Available' },
  { userId: 'c2', itemId: 'c002', ItemName: 'Chicken Biryani (CB)', aliasName: 'CB', price: 12.99, visits: 20, cardStatus: '✅ Available' },
  { userId: 'c3', itemId: 'c003', ItemName: 'Dal Tadka', aliasName: 'DT', price: 7.99, visits: 10, cardStatus: '✅ Available' },
  { userId: 'c4', itemId: 'c004', ItemName: 'Cold Drink', aliasName: 'CD', price: 1.99, visits: 30, cardStatus: '✅ Available' },
  { userId: 'c5', itemId: 'c005', ItemName: 'Mineral Water', aliasName: 'MW', price: 0.99, visits: 25, cardStatus: '✅ Available' },
];

const Menu: React.FC = () => {
  const [data, setData] = useState<Person[]>(() => makeData(10));
  const [cardItems, setCardItems] = useState<CardItem[]>(initialCardItems); // Make cardItems stateful
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editItem, setEditItem] = useState<Person | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState<Partial<Person>>({
    itemId: '',
    ItemName: '',
    printName: '',
    aliasName: '',
    kitchenCategory: '',
    kitchenSubCategory: '',
    kitchenMainGroup: '',
    itemMainGroup: '',
    itemGroup: '',
    stockUnit: '',
    tax: 0,
    runtimeRates: false,
    isCommonToAllDepartments: false,
    departmentRates: [
      { departmentName: 'Front Office', rate: 380 },
      { departmentName: 'Garden', rate: 380 },
      { departmentName: 'Housekeeping', rate: 380 },
    ],
    lastName: '',
    price: 0,
    visits: 0,
    sidebarStatus: '✅ Available',
    cardStatus: '✅ Available',
    progress: 0,
    outlet: '',
    hotelName: '',
  });
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [showSidebar, setShowSidebar] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');

  // Map card items to categories
  const itemCategories: { [key in Category]: CardItem[] } = {
    All: cardItems,
    Appetizers: cardItems.filter(item => ['Paneer Tikka'].includes(item.ItemName)),
    MainCourse: cardItems.filter(item => ['Chicken Biryani (CB)', 'Dal Tadka'].includes(item.ItemName)),
    Desserts: [],
    Beverages: cardItems.filter(item => ['Cold Drink', 'Mineral Water'].includes(item.ItemName)),
    Cocktails: [],
    Salads: [],
    Soups: [],
    Breakfast: [],
    VeganOptions: cardItems.filter(item => ['Dal Tadka'].includes(item.ItemName)),
  };

  const columns = React.useMemo<ColumnDef<Person>[]>(
    () => [
      {
        accessorKey: 'ItemName',
        header: () => <span>Item Group</span>,
        cell: ({ row, getValue }) => (
          <div style={{ paddingLeft: `${row.depth * 2}rem` }}>
            {getValue<string>()}
          </div>
        ),
        footer: (props) => props.column.id,
        enableSorting: true,
      },
      {
        id: 'toggle',
        header: 'Status',
        cell: ({ row }) => (
          <ToggleButton
            id={`sidebar-toggle-${row.original.userId}`}
            type="checkbox"
            variant="outline-success"
            checked={row.original.sidebarStatus === '✅ Available'}
            value="1"
            onChange={() => {
              const updatedStatus = row.original.sidebarStatus === '✅ Available' ? '❌ Unavailable' : '✅ Available';
              setData((prevData) =>
                prevData.map((d) =>
                  d.userId === row.original.userId ? { ...d, sidebarStatus: updatedStatus } : d
                )
              );
              // Update cardItems status for items in the selected category
              const category = row.original.ItemName.replace(/\s/g, '') as Category;
              if (itemCategories[category]) {
                setCardItems((prevCardItems) =>
                  prevCardItems.map((item) =>
                    itemCategories[category].some((catItem) => catItem.itemId === item.itemId)
                      ? { ...item, cardStatus: updatedStatus }
                      : item
                  )
                );
              }
            }}
            size="sm"
            style={{
              borderRadius: '15px',
              width: '40px',
              height: '20px',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: row.original.sidebarStatus === '✅ Available' ? 'flex-end' : 'flex-start',
              backgroundColor: row.original.sidebarStatus === '✅ Available' ? '#28a745' : '#6c757d',
            }}
          >
            <div
              style={{
                width: '16px',
                height: '16px',
                backgroundColor: 'white',
                borderRadius: '50%',
                margin: '2px',
              }}
            />
          </ToggleButton>
        ),
        footer: (props) => props.column.id,
        enableSorting: false,
      },
    ],
    []
  );

  const defaultDepartmentRates: DepartmentRate[] = [
    { departmentName: 'Front Office', rate: 380 },
    { departmentName: 'Garden', rate: 380 },
    { departmentName: 'Housekeeping', rate: 380 },
  ];

  const taxOptions = [
    { value: 0, label: '0%' },
    { value: 5, label: '5%' },
    { value: 12, label: '12%' },
    { value: 18, label: '18%' },
    { value: 28, label: '28%' },
  ];

  useEffect(() => {
    if (showAddModal || showEditModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showAddModal, showEditModal]);

  const table = useReactTable({
    data,
    columns,
    state: { expanded, globalFilter, sorting },
    onExpandedChange: setExpanded,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getSubRows: (row) => row.subRows,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSortedRowModel: getSortedRowModel(),
    debugTable: true,
  });

  const handleEditItem = (item: Person) => {
    setEditItem({
      ...item,
      departmentRates: item.departmentRates?.length ? item.departmentRates : defaultDepartmentRates,
    });
    setShowEditModal(true);
  };

  const handleUpdateItem = () => {
    if (editItem) {
      setData((prevData) =>
        prevData.map((row) =>
          row.userId === editItem.userId ? { ...row, ...editItem } : row
        )
      );
      // Update cardItems status for items in the selected category
      const category = editItem.ItemName.replace(/\s/g, '') as Category;
      if (itemCategories[category]) {
        setCardItems((prevCardItems) =>
          prevCardItems.map((item) =>
            itemCategories[category].some((catItem) => catItem.itemId === item.itemId)
              ? { ...item, cardStatus: editItem.sidebarStatus }
              : item
          )
        );
      }
    }
    setShowEditModal(false);
    setEditItem(null);
  };

  const handleAddItem = () => {
    const newPerson: Person = {
      userId: `new-${Date.now()}`,
      itemId: newItem.itemId ?? '',
      ItemName: newItem.ItemName ?? '',
      printName: newItem.printName ?? '',
      aliasName: newItem.aliasName ?? '',
      kitchenCategory: newItem.kitchenCategory ?? '',
      kitchenSubCategory: newItem.kitchenSubCategory ?? '',
      kitchenMainGroup: newItem.kitchenMainGroup ?? '',
      itemMainGroup: newItem.itemMainGroup ?? '',
      itemGroup: newItem.itemGroup ?? '',
      stockUnit: newItem.stockUnit ?? '',
      tax: newItem.tax ?? 0,
      runtimeRates: newItem.runtimeRates ?? false,
      isCommonToAllDepartments: newItem.isCommonToAllDepartments ?? false,
      departmentRates: newItem.departmentRates ?? defaultDepartmentRates,
      lastName: newItem.lastName ?? '',
      price: newItem.price ?? 0,
      visits: newItem.visits ?? 0,
      sidebarStatus: newItem.sidebarStatus ?? '✅ Available',
      cardStatus: newItem.cardStatus ?? '✅ Available',
      progress: newItem.progress ?? 0,
      outlet: newItem.outlet ?? '',
      hotelName: newItem.hotelName ?? '',
      subRows: [],
    };
    setData((prevData) => [newPerson, ...prevData]);
    setNewItem({
      itemId: '',
      ItemName: '',
      printName: '',
      aliasName: '',
      kitchenCategory: '',
      kitchenSubCategory: '',
      kitchenMainGroup: '',
      itemMainGroup: '',
      itemGroup: '',
      stockUnit: '',
      tax: 0,
      runtimeRates: false,
      isCommonToAllDepartments: false,
      departmentRates: defaultDepartmentRates,
      lastName: '',
      price: 0,
      visits: 0,
      sidebarStatus: '✅ Available',
      cardStatus: '✅ Available',
      progress: 0,
      outlet: '',
      hotelName: '',
    });
    setShowAddModal(false);
  };

  return (
    <div style={{ backgroundColor: '#f4f6f9', minHeight: '100vh' }}>
      {/* Header Section */}
      <Navbar
        bg="white"
        expand="lg"
        className="shadow-sm border-bottom py-2"
        style={{ position: 'sticky', top: 0, zIndex: 10 }}
      >
        <div className="container-fluid px-3 bg-transparent">
          <div className="d-flex align-items-center">
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => window.history.back()}
              className="me-2"
              style={{
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              ←
            </Button>
            <Navbar.Brand className="d-lg-none">
              <Button
                variant="link"
                onClick={() => setShowSidebar(true)}
                className="p-0"
                style={{ color: '#1a202c' }}
              >
                <i className="bi bi-list" style={{ fontSize: '24px' }}></i>
              </Button>
            </Navbar.Brand>
          </div>
          <h5 className="mb-0 flex-grow-1 text-center text-lg-start">Items Management</h5>
          <Navbar.Toggle aria-controls="navbar-actions" />
          <Navbar.Collapse id="navbar-actions" className="justify-content-end">
            <div className="d-flex flex-column flex-lg-row align-items-center gap-2 mt-2 mt-lg-0">
              <Form.Control
                type="text"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder="Search by Item"
                className="rounded-lg"
                style={{
                  width: '100%',
                  maxWidth: '200px',
                  border: '1px solid #d1d5db',
                  padding: '6px 12px',
                  fontSize: '14px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                }}
              />
              <Form.Control
                type="text"
                placeholder="Search by Code"
                className="rounded-lg"
                style={{
                  width: '100%',
                  maxWidth: '200px',
                  border: '1px solid #d1d5db',
                  padding: '6px 12px',
                  fontSize: '14px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                }}
              />
              <div className="d-flex gap-2 w-100 w-lg-auto">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowAddModal(true)}
                  className="w-100 w-lg-auto"
                  style={{
                    borderRadius: '8px',
                    padding: '6px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  Add Item
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-100 w-lg-auto"
                  style={{
                    borderRadius: '8px',
                    padding: '6px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  Load Menu
                </Button>
              </div>
            </div>
          </Navbar.Collapse>
        </div>
      </Navbar>

      {/* Main Layout */}
      <div className="d-flex flex-column flex-lg-row">
        {/* Sidebar (Offcanvas for mobile) */}
        <Offcanvas
          show={showSidebar}
          onHide={() => setShowSidebar(false)}
          responsive="lg"
          placement="start"
          className="bg-white shadow-sm border-end"
          style={{ width: '200px' }}
        >
          <Offcanvas.Header closeButton className="border-bottom">
            <Offcanvas.Title as="h6" className="fw-bold mb-0">Menu Items</Offcanvas.Title>
          </Offcanvas.Header>
          <Offcanvas.Body className="p-3">
            <Table responsive className="mb-0">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        colSpan={header.colSpan}
                        style={{ fontSize: '12px', color: '#6b7280', padding: '8px 5px' }}
                      >
                        {header.isPlaceholder ? null : (
                          <div>{flexRender(header.column.columnDef.header, header.getContext())}</div>
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    style={{
                      cursor: 'pointer',
                      transition: 'background-color 0.2s',
                    }}
                    onClick={() => {
                      const category = row.original.ItemName.replace(/\s/g, '') as Category;
                      if (itemCategories[category]) {
                        setSelectedCategory(category);
                      }
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} style={{ padding: '8px 5px', fontSize: '13px' }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
          </Offcanvas.Body>
        </Offcanvas>

        {/* Main Content Area */}
        <div className="flex-grow-1 p-3">
          <div
            style={{
              maxHeight: 'calc(100vh - 80px)',
              overflowY: 'auto',
              paddingRight: '10px',
            }}
          >
            <Row xs={1} sm={2} md={3} lg={4} className="g-3">
              {itemCategories[selectedCategory].map((item, index) => (
                <Col key={index}>
                  <Card
                    className="shadow-sm border-0 h-100"
                    style={{
                      borderRadius: '12px',
                      backgroundColor: '#fff',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      minHeight: '120px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                    }}
                  >
                    <Card.Body className="d-flex align-items-center p-2 p-md-3">
                      <div className="me-2 me-md-3">
                        <i
                          className="fi fi-rr-coffee"
                          style={{ fontSize: '18px', color: '#3b82f6' }}
                        ></i>
                      </div>
                      <div className="flex-grow-1">
                        <Card.Title
                          className="mb-1 text-wrap"
                          style={{ fontSize: '14px', fontWeight: '600', color: '#1a202c' }}
                        >
                          {item.ItemName} ({item.aliasName})
                        </Card.Title>
                        <Card.Text style={{ fontSize: '12px', color: '#6b7280' }}>
                          {item.itemId} <br />
                          ₹{item.price} <br />
                          ({item.visits} visits)
                        </Card.Text>
                      </div>
                      <div className="d-flex flex-column align-items-center gap-2">
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => {
                            const personItem = data.find(p => p.ItemName === selectedCategory);
                            if (personItem) {
                              handleEditItem(personItem);
                            }
                          }}
                          title="Edit Item"
                          style={{
                            border: 'none',
                            background: 'transparent',
                            padding: '4px',
                            color: '#6b7280',
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="14"
                            height="14"
                            fill="currentColor"
                            className="bi bi-pencil-square"
                            viewBox="0 0 16 16"
                          >
                            <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
                            <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z" />
                          </svg>
                        </Button>
                        <ToggleButton
                          id={`card-toggle-${item.userId}`}
                          type="checkbox"
                          variant="outline-success"
                          checked={item.cardStatus === '✅ Available'}
                          value="1"
                          onChange={() => {
                            const updatedStatus = item.cardStatus === '✅ Available' ? '❌ Unavailable' : '✅ Available';
                            setCardItems((prevCardItems) =>
                              prevCardItems.map((cardItem) =>
                                cardItem.userId === item.userId ? { ...cardItem, cardStatus: updatedStatus } : cardItem
                              )
                            );
                          }}
                          size="sm"
                          style={{
                            borderRadius: '15px',
                            width: '36px',
                            height: '18px',
                            padding: '0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: item.cardStatus === '✅ Available' ? 'flex-end' : 'flex-start',
                            backgroundColor: item.cardStatus === '✅ Available' ? '#28a745' : '#6c757d',
                          }}
                        >
                          <div
                            style={{
                              width: '14px',
                              height: '14px',
                              backgroundColor: 'white',
                              borderRadius: '50%',
                              margin: '2px',
                            }}
                          />
                        </ToggleButton>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </div>
      </div>

      {/* Edit Item Modal */}
      <Modal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        size="lg"
        centered
        className="shadow-lg"
      >
        <Modal.Header closeButton className="bg-white border-bottom-0 py-1">
          <Modal.Title className="fs-5 fw-semibold text-gray-800">Edit Item</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-white p-3 p-md-3 py-1" style={{ maxHeight: '800px' }}>
          {editItem && (
            <Form>
              <Row className="mb-3">
                <Col xs={12} sm={6} className="mb-3 mb-sm-0">
                  <Form.Group as={Row} className="align-items-center">
                    <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                      Outlet
                    </Form.Label>
                    <Col sm={8}>
                      <Form.Select
                        value={editItem.outlet ?? ''}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setEditItem({ ...editItem, outlet: e.target.value })}
                        className="rounded-lg"
                      >
                        <option value="">Select Outlet</option>
                        <option value="Outlet A">Outlet A</option>
                        <option value="Outlet B">Outlet B</option>
                        <option value="Outlet C">Outlet C</option>
                      </Form.Select>
                    </Col>
                  </Form.Group>
                </Col>
                <Col xs={12} sm={6}>
                  <Form.Group as={Row} className="align-items-center">
                    <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                      Hotel Name
                    </Form.Label>
                    <Col sm={8}>
                      <Form.Select
                        value={editItem.hotelName ?? ''}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setEditItem({ ...editItem, hotelName: e.target.value })}
                        className="rounded-lg"
                      >
                        <option value="">Select Hotel</option>
                        <option value="Hotel X">Hotel X</option>
                        <option value="Hotel Y">Hotel Y</option>
                        <option value="Hotel Z">Hotel Z</option>
                      </Form.Select>
                    </Col>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col xs={12} sm={6}>
                  <Form.Group as={Row} className="align-items-center">
                    <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                      Item No
                    </Form.Label>
                    <Col sm={8}>
                      <Form.Control
                        type="text"
                        value={editItem.itemId ?? ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEditItem({ ...editItem, itemId: e.target.value })}
                        placeholder="Enter item No"
                        className="rounded-lg"
                      />
                    </Col>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col xs={12} sm={6}>
                  <Form.Group as={Row} className="align-items-center">
                    <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                      Item Name
                    </Form.Label>
                    <Col sm={8}>
                      <Form.Control
                        type="text"
                        value={editItem.ItemName}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEditItem({ ...editItem, ItemName: e.target.value })}
                        placeholder="Enter item name"
                        className="rounded-lg"
                      />
                    </Col>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col xs={12} sm={6} className="mb-3 mb-sm-0">
                  <Form.Group as={Row} className="align-items-center">
                    <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                      Print Name
                    </Form.Label>
                    <Col sm={8}>
                      <Form.Control
                        type="text"
                        value={editItem.printName ?? ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEditItem({ ...editItem, printName: e.target.value })}
                        placeholder="Enter print name"
                        className="rounded-lg"
                      />
                    </Col>
                  </Form.Group>
                </Col>
                <Col xs={12} sm={6}>
                  <Form.Group as={Row} className="align-items-center">
                    <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                      Short Name
                    </Form.Label>
                    <Col sm={8}>
                      <Form.Control
                        type="text"
                        value={editItem.aliasName ?? ''}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setEditItem({ ...editItem, aliasName: e.target.value })}
                        placeholder="Enter short name"
                        className="rounded-lg"
                      />
                    </Col>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col xs={12} sm={4} className="mb-3 mb-sm-0">
                  <Form.Group as={Row} className="align-items-center">
                    <Form.Label column sm={6} className="text-sm font-medium text-gray-700">
                      Kitchen Main Group
                    </Form.Label>
                    <Col sm={6}>
                      <Form.Select
                        value={editItem.kitchenMainGroup ?? ''}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setEditItem({ ...editItem, kitchenMainGroup: e.target.value })}
                        className="rounded-lg h-10"
                      >
                        <option value="">Select Kitchen Main Group</option>
                        <option value="Food">Food</option>
                        <option value="Drinks">Drinks</option>
                        <option value="Sweets">Sweets</option>
                      </Form.Select>
                    </Col>
                  </Form.Group>
                </Col>
                <Col xs={12} sm={4} className="mb-3 mb-sm-0">
                  <Form.Group as={Row} className="align-items-center">
                    <Form.Label column sm={6} className="text-sm font-medium text-gray-700">
                      Kitchen Category
                    </Form.Label>
                    <Col sm={6}>
                      <Form.Select
                        value={editItem.kitchenCategory ?? ''}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setEditItem({ ...editItem, kitchenCategory: e.target.value })}
                        className="rounded-lg h-10"
                      >
                        <option value="">Select Kitchen Category</option>
                        <option value="Main Kitchen">Main Kitchen</option>
                        <option value="Bakery">Bakery</option>
                        <option value="Beverage">Beverage</option>
                        <option value="Dessert">Dessert</option>
                      </Form.Select>
                    </Col>
                  </Form.Group>
                </Col>
                <Col xs={12} sm={4}>
                  <Form.Group as={Row} className="align-items-center">
                    <Form.Label column sm={6} className="text-sm font-medium text-gray-700">
                      Kitchen Sub Category
                    </Form.Label>
                    <Col sm={6}>
                      <Form.Select
                        value={editItem.kitchenSubCategory ?? ''}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setEditItem({ ...editItem, kitchenSubCategory: e.target.value })}
                        className="rounded-lg h-10"
                      >
                        <option value="">Select Kitchen Sub Category</option>
                        <option value="Hot Prep">Hot Prep</option>
                        <option value="Cold Prep">Cold Prep</option>
                        <option value="Grill">Grill</option>
                        <option value="Pastry">Pastry</option>
                      </Form.Select>
                    </Col>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col xs={12} sm={6} className="mb-3 mb-sm-0">
                  <Form.Group as={Row} className="align-items-center">
                    <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                      Item Main Group
                    </Form.Label>
                    <Col sm={8}>
                      <Form.Select
                        value={editItem.itemMainGroup ?? ''}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setEditItem({ ...editItem, itemMainGroup: e.target.value })}
                        className="rounded-lg"
                      >
                        <option value="">Select Item Main Group</option>
                        <option value="Appetizers">Appetizers</option>
                        <option value="Main Course">Main Course</option>
                        <option value="Desserts">Desserts</option>
                        <option value="Beverages">Beverages</option>
                      </Form.Select>
                    </Col>
                  </Form.Group>
                </Col>
                <Col xs={12} sm={6}>
                  <Form.Group as={Row} className="align-items-center">
                    <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                      Item Group
                    </Form.Label>
                    <Col sm={8}>
                      <Form.Select
                        value={editItem.itemGroup ?? ''}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setEditItem({ ...editItem, itemGroup: e.target.value })}
                        className=""
                      >
                        <option value="">Select Item Group</option>
                        <option value="Veg">Veg</option>
                        <option value="Non-Veg">Non-Veg</option>
                        <option value="Vegan">Vegan</option>
                      </Form.Select>
                    </Col>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col xs={12} sm={6} className="mb-3 mb-sm-0">
                  <Form.Group as={Row} className="align-items-center">
                    <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                      Stock Unit
                    </Form.Label>
                    <Col sm={8}>
                      <Form.Select
                        value={editItem.stockUnit ?? ''}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setEditItem({ ...editItem, stockUnit: e.target.value })}
                        className="rounded-lg"
                      >
                        <option value="">Select Stock Unit</option>
                        <option value="Piece">Piece</option>
                        <option value="Kg">Kg</option>
                        <option value="Liter">Liter</option>
                        <option value="Unit">Unit</option>
                      </Form.Select>
                    </Col>
                  </Form.Group>
                </Col>
                <Col xs={12} sm={6}>
                  <Form.Group as={Row} className="align-items-center">
                    <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                      Service Unit
                    </Form.Label>
                    <Col sm={8}>
                      <Form.Select
                        value={editItem.stockUnit ?? ''}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setEditItem({ ...editItem, stockUnit: e.target.value })}
                        className="rounded-lg"
                      >
                        <option value="">Select Service Unit</option>
                        <option value="Piece">Piece</option>
                        <option value="Kg">Kg</option>
                        <option value="Liter">Liter</option>
                        <option value="Unit">Unit</option>
                      </Form.Select>
                    </Col>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col xs={12} sm={6}>
                  <Form.Group as={Row} className="align-items-center">
                    <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                      Tax (%)
                    </Form.Label>
                    <Col sm={8}>
                      <Form.Select
                        value={editItem.tax ?? 0}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                          const value = parseFloat(e.target.value);
                          setEditItem({ ...editItem, tax: isNaN(value) ? 0 : value });
                        }}
                        className="rounded-lg"
                      >
                        {taxOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3">
                <Col xs={12} sm={6} className="mb-3 mb-sm-0">
                  <Form.Group as={Row} className="align-items-center">
                    <Form.Label column sm={4}></Form.Label>
                    <Col sm={8}>
                      <label className="d-flex align-items-center gap-2 cursor-pointer">
                        <Form.Check
                          type="checkbox"
                          checked={editItem.runtimeRates ?? false}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setEditItem({ ...editItem, runtimeRates: e.target.checked })}
                          className="mt-0"
                        />
                        <span className="text-sm text-gray-700">Runtime Rates</span>
                      </label>
                    </Col>
                  </Form.Group>
                </Col>
                <Col xs={12} sm={6}>
                  <Form.Group as={Row} className="align-items-center">
                    <Form.Label column sm={4}></Form.Label>
                    <Col sm={8}>
                      <label className="d-flex align-items-center gap-2 cursor-pointer">
                        <Form.Check
                          type="checkbox"
                          checked={editItem.isCommonToAllDepartments ?? false}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setEditItem({ ...editItem, isCommonToAllDepartments: e.target.checked })}
                          className="mt-0"
                        />
                        <span className="text-sm text-muted">Is Common to All Departments</span>
                      </label>
                    </Col>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-0">
                <Col xs={12}>
                  <Form.Group as={Row}>
                    <Form.Label column sm={2} className="text-sm font-medium text-gray-700">
                      Department Rates
                    </Form.Label>
                    <Col sm={10}>
                      <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                        <Table bordered size="sm">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="text-sm font-medium text-gray-700 py-2">Department Name</th>
                              <th className="text-sm font-medium text-gray-700 py-2">Rate</th>
                            </tr>
                          </thead>
                          <tbody>
                            {editItem.departmentRates?.map((dept, index) => (
                              <tr key={index}>
                                <td className="text-sm text-gray-600 py-2">{dept.departmentName}</td>
                                <td>
                                  <Form.Control
                                    type="number"
                                    value={dept.rate}
                                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                      const updatedRates = [...(editItem.departmentRates || [])];
                                      updatedRates[index] = {
                                        ...updatedRates[index],
                                        rate: e.target.value ? parseFloat(e.target.value) : 0,
                                      };
                                      setEditItem({ ...editItem, departmentRates: updatedRates });
                                    }}
                                    placeholder="Enter rate"
                                    className="rounded-lg"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </Table>
                      </div>
                    </Col>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mb-3 align-items-center">
                <Col xs={12} sm={4} className="mb-3 mb-sm-0">
                  <Form.Group as={Row} className="align-items-center">
                    <Form.Label column sm={6} className="text-sm font-medium text-gray-700">
                      Status
                    </Form.Label>
                    <Col sm={6}>
                      <Form.Select
                        value={editItem.sidebarStatus}
                        onChange={(e: ChangeEvent<HTMLSelectElement>) => setEditItem({ ...editItem, sidebarStatus: e.target.value })}
                        className="rounded-lg"
                      >
                        <option value="✅ Available" className="text-green-600">✅ Available</option>
                        <option value="❌ Unavailable" className="text-red-600">❌ Unavailable</option>
                        <option value="⏳ Pending" className="text-yellow-600">⏳ Pending</option>
                      </Form.Select>
                    </Col>
                  </Form.Group>
                </Col>
                <Col xs={12} sm={4} className="mb-3 mb-sm-0"></Col>
                <Col xs={12} sm={4} className="d-flex justify-content-end gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setShowEditModal(false)}
                    style={{
                      borderRadius: '8px',
                      padding: '6px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      backgroundColor: '#e5e7eb',
                      borderColor: '#e5e7eb',
                      color: '#1a202c',
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleUpdateItem}
                    style={{
                      borderRadius: '8px',
                      padding: '6px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      backgroundColor: '#3b82f6',
                      borderColor: '#3b82f6',
                    }}
                  >
                    Update Item
                  </Button>
                </Col>
              </Row>
            </Form>
          )}
        </Modal.Body>
      </Modal>

      {/* Add Item Modal */}
      <Modal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        size="lg"
        centered
        className="shadow-lg"
      >
        <Modal.Header closeButton className="bg-white border-bottom-0 py-1">
          <Modal.Title className="fs-5 fw-semibold text-gray-800">Add Item</Modal.Title>
        </Modal.Header>
        <Modal.Body className="bg-white p-3 p-md-3">
          <Form>
            <Row className="mb-3">
              <Col xs={12} sm={6} className="mb-3 mb-sm-0">
                <Form.Group as={Row} className="align-items-center">
                  <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                    Outlet
                  </Form.Label>
                  <Col sm={8}>
                    <Form.Select
                      value={newItem.outlet}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewItem({ ...newItem, outlet: e.target.value })}
                      className="rounded-lg"
                    >
                      <option value="">Select Outlet</option>
                      <option value="Outlet A">Outlet A</option>
                      <option value="Outlet B">Outlet B</option>
                      <option value="Outlet C">Outlet C</option>
                    </Form.Select>
                  </Col>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Group as={Row} className="align-items-center">
                  <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                    Hotel Name
                  </Form.Label>
                  <Col sm={8}>
                    <Form.Select
                      value={newItem.hotelName}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewItem({ ...newItem, hotelName: e.target.value })}
                      className="rounded-lg"
                    >
                      <option value="">Select Hotel</option>
                      <option value="Hotel X">Hotel X</option>
                      <option value="Hotel Y">Hotel Y</option>
                      <option value="Hotel Z">Hotel Z</option>
                    </Form.Select>
                  </Col>
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col xs={12} sm={6}>
                <Form.Group as={Row} className="align-items-center">
                  <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                    Item No
                  </Form.Label>
                  <Col sm={8}>
                    <Form.Control
                      type="text"
                      value={newItem.itemId}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setNewItem({ ...newItem, itemId: e.target.value })}
                      placeholder="Enter item No"
                      className="rounded-lg"
                    />
                  </Col>
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col xs={12} sm={6}>
                <Form.Group as={Row} className="align-items-center">
                  <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                    Item Name
                  </Form.Label>
                  <Col sm={8}>
                    <Form.Control
                      type="text"
                      value={newItem.ItemName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setNewItem({ ...newItem, ItemName: e.target.value })}
                      placeholder="Enter item name"
                      className="rounded-lg"
                    />
                  </Col>
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col xs={12} sm={6} className="mb-3 mb-sm-0">
                <Form.Group as={Row} className="align-items-center">
                  <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                    Print Name
                  </Form.Label>
                  <Col sm={8}>
                    <Form.Control
                      type="text"
                      value={newItem.printName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setNewItem({ ...newItem, printName: e.target.value })}
                      placeholder="Enter print name"
                      className="rounded-lg"
                    />
                  </Col>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Group as={Row} className="align-items-center">
                  <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                    Short Name
                  </Form.Label>
                  <Col sm={8}>
                    <Form.Control
                      type="text"
                      value={newItem.aliasName}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setNewItem({ ...newItem, aliasName: e.target.value })}
                      placeholder="Enter short name"
                      className="rounded-lg"
                    />
                  </Col>
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col xs={12} sm={4} className="mb-3 mb-sm-0">
                <Form.Group as={Row} className="align-items-center">
                  <Form.Label column sm={6} className="text-sm font-medium text-gray-700">
                    Kitchen Main Group
                  </Form.Label>
                  <Col sm={6}>
                    <Form.Select
                      value={newItem.kitchenMainGroup}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewItem({ ...newItem, kitchenMainGroup: e.target.value })}
                      className="rounded-lg h-10"
                    >
                      <option value="">Select Kitchen Main Group</option>
                      <option value="Food">Food</option>
                      <option value="Drinks">Drinks</option>
                      <option value="Sweets">Sweets</option>
                    </Form.Select>
                  </Col>
                </Form.Group>
              </Col>
              <Col xs={12} sm={4} className="mb-3 mb-sm-0">
                <Form.Group as={Row} className="align-items-center">
                  <Form.Label column sm={6} className="text-sm font-medium text-gray-700">
                    Kitchen Category
                  </Form.Label>
                  <Col sm={6}>
                    <Form.Select
                      value={newItem.kitchenCategory}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewItem({ ...newItem, kitchenCategory: e.target.value })}
                      className="rounded-lg h-10"
                    >
                      <option value="">Select Kitchen Category</option>
                      <option value="Main Kitchen">Main Kitchen</option>
                      <option value="Bakery">Bakery</option>
                      <option value="Beverage">Beverage</option>
                      <option value="Dessert">Dessert</option>
                    </Form.Select>
                  </Col>
                </Form.Group>
              </Col>
              <Col xs={12} sm={4}>
                <Form.Group as={Row} className="align-items-center">
                  <Form.Label column sm={6} className="text-sm font-medium text-gray-700">
                    Kitchen Sub Category
                  </Form.Label>
                  <Col sm={6}>
                    <Form.Select
                      value={newItem.kitchenSubCategory}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewItem({ ...newItem, kitchenSubCategory: e.target.value })}
                      className="rounded-lg h-10"
                    >
                      <option value="">Select Kitchen Sub Category</option>
                      <option value="Hot Prep">Hot Prep</option>
                      <option value="Cold Prep">Cold Prep</option>
                      <option value="Grill">Grill</option>
                      <option value="Pastry">Pastry</option>
                    </Form.Select>
                  </Col>
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col xs={12} sm={6} className="mb-3 mb-sm-0">
                <Form.Group as={Row} className="align-items-center">
                  <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                    Item Main Group
                  </Form.Label>
                  <Col sm={8}>
                    <Form.Select
                      value={newItem.itemMainGroup}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewItem({ ...newItem, itemMainGroup: e.target.value })}
                      className="rounded-lg"
                    >
                      <option value="">Select Item Main Group</option>
                      <option value="Appetizers">Appetizers</option>
                      <option value="Main Course">Main Course</option>
                      <option value="Desserts">Desserts</option>
                      <option value="Beverages">Beverages</option>
                    </Form.Select>
                  </Col>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Group as={Row} className="align-items-center">
                  <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                    Item Group
                  </Form.Label>
                  <Col sm={8}>
                    <Form.Select
                      value={newItem.itemGroup}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewItem({ ...newItem, itemGroup: e.target.value })}
                      className="rounded-lg"
                    >
                      <option value="">Select Item Group</option>
                      <option value="Veg">Veg</option>
                      <option value="Non-Veg">Non-Veg</option>
                      <option value="Vegan">Vegan</option>
                    </Form.Select>
                  </Col>
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col xs={12} sm={6} className="mb-3 mb-sm-0">
                <Form.Group as={Row} className="align-items-center">
                  <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                    Stock Unit
                  </Form.Label>
                  <Col sm={8}>
                    <Form.Select
                      value={newItem.stockUnit}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewItem({ ...newItem, stockUnit: e.target.value })}
                      className="rounded-lg"
                    >
                      <option value="">Select Stock Unit</option>
                      <option value="Piece">Piece</option>
                      <option value="Kg">Kg</option>
                      <option value="Liter">Liter</option>
                      <option value="Unit">Unit</option>
                    </Form.Select>
                  </Col>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Group as={Row} className="align-items-center">
                  <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                    Service Unit
                  </Form.Label>
                  <Col sm={8}>
                    <Form.Select
                      value={newItem.stockUnit}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewItem({ ...newItem, stockUnit: e.target.value })}
                      className="rounded-lg"
                    >
                      <option value="">Select Service Unit</option>
                      <option value="Piece">Piece</option>
                      <option value="Kg">Kg</option>
                      <option value="Liter">Liter</option>
                      <option value="Unit">Unit</option>
                    </Form.Select>
                  </Col>
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col xs={12} sm={6}>
                <Form.Group as={Row} className="align-items-center">
                  <Form.Label column sm={4} className="text-sm font-medium text-gray-700">
                    Tax (%)
                  </Form.Label>
                  <Col sm={8}>
                    <Form.Select
                      value={newItem.tax}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => {
                        const value = parseFloat(e.target.value);
                        setNewItem({ ...newItem, tax: isNaN(value) ? 0 : value });
                      }}
                      className="rounded-lg"
                    >
                      {taxOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col xs={12} sm={6} className="mb-3 mb-sm-0">
                <Form.Group as={Row} className="align-items-center">
                  <Col sm={12}>
                    <label className="d-flex align-items-center gap-2 cursor-pointer">
                      <Form.Check
                        type="checkbox"
                        checked={newItem.runtimeRates}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setNewItem({ ...newItem, runtimeRates: e.target.checked })}
                        className="mt-0"
                      />
                      <span className="text-sm text-gray-700">Runtime Rates</span>
                    </label>
                  </Col>
                </Form.Group>
              </Col>
              <Col xs={12} sm={6}>
                <Form.Group as={Row} className="align-items-center">
                  <Col sm={12}>
                    <label className="d-flex align-items-center gap-2 cursor-pointer">
                      <Form.Check
                        type="checkbox"
                        checked={newItem.isCommonToAllDepartments}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => setNewItem({ ...newItem, isCommonToAllDepartments: e.target.checked })}
                        className="mt-0"
                      />
                      <span className="text-sm text-gray-600">Is Common to All Departments</span>
                    </label>
                  </Col>
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3">
              <Col xs={12}>
                <Form.Group as={Row} className="align-items-center">
                  <Form.Label column sm={2} className="text-sm font-medium text-gray-700">
                    Department Rates
                  </Form.Label>
                  
                  <Col sm={10}>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      <Table bordered size="sm" className="m-0">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="text-sm font-medium text-gray-700 py-2">Department Name</th>
                            <th className="text-sm font-medium text-gray-700 py-2">Rate</th>
                          </tr>
                        </thead>
                        <tbody>
                          {newItem.departmentRates?.map((dept, index) => (
                            <tr key={index}>
                              <td className="text-sm text-gray-600 py-2">{dept.departmentName}</td>
                              <td>
                                <Form.Control
                                  type="number"
                                  value={dept.rate}
                                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                                    const updatedRates = [...(newItem.departmentRates || [])];
                                    updatedRates[index] = {
                                      ...updatedRates[index],
                                      rate: e.target.value ? parseFloat(e.target.value) : 0,
                                    };
                                    setNewItem({ ...newItem, departmentRates: updatedRates });
                                  }}
                                  placeholder="Enter rate"
                                  className="rounded-lg"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </Col>
                </Form.Group>
              </Col>
            </Row>
            <Row className="mb-3 align-items-center">
              <Col xs={12} sm={4} className="mb-3 mb-sm-0">
                <Form.Group as={Row} className="align-items-center">
                  <Form.Label column sm={6} className="text-sm font-medium text-gray-700">
                    Status
                  </Form.Label>
                  <Col sm={6}>
                    <Form.Select
                      value={newItem.sidebarStatus}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewItem({ ...newItem, sidebarStatus: e.target.value, cardStatus: e.target.value })}
                      className="rounded-lg"
                    >
                      <option value="✅ Available" className="text-green-600">✅ Available</option>
                      <option value="❌ Unavailable" className="text-red-600">❌ Unavailable</option>
                      <option value="⏳ Pending" className="text-yellow-600">⏳ Pending</option>
                    </Form.Select>
                  </Col>
                </Form.Group>
              </Col>
              <Col xs={12} sm={4} className="mb-3 mb-sm-0"></Col>
              <Col xs={12} sm={4} className="d-flex justify-content-end gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    borderRadius: '8px',
                    padding: '6px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    backgroundColor: '#e5e7eb',
                    borderColor: '#e5e7eb',
                    color: '#1a202c',
                  }}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleAddItem}
                  style={{
                    borderRadius: '8px',
                    padding: '6px 16px',
                    fontSize: '14px',
                    fontWeight: '500',
                    backgroundColor: '#3b82f6',
                    borderColor: '#3b82f6',
                  }}
                >
                  Save Item
                </Button>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default Menu;