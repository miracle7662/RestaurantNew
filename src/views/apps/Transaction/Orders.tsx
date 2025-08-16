
import { useState, useEffect, useRef } from 'react';
import { Button, Modal, Form, Table } from 'react-bootstrap';
import OrderDetails from './OrderDetails';
import { fetchOutletsForDropdown } from '@/utils/commonfunction';
import { useAuthContext } from '@/common';
import { OutletData } from '@/common/api/outlet';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}

interface Customer {
  srNo: number;
  name: string;
  countryCode: string;
  mobile: string;
  mail: string;
  city: string;
  address1: string;
  address2: string;
}

interface KOT {
  table: string;
  items: MenuItem[];
  total: number;
  timestamp: string;
}

interface TableItem {
  tablemanagementid: string;
  table_name: string;
  hotel_name: string;
  outlet_name: string;
  status: string;
  created_by_id: string;
  created_date: string;
  updated_by_id: string;
  updated_date: string;
  hotelid: string;
  marketid: string;
  isActive: boolean;
  isCommonToAllDepartments: boolean;
}

const Order = () => {
  const [selectedTable, setSelectedTable] = useState<string | null>('');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('Dine-in');
  const [showOrderDetails, setShowOrderDetails] = useState<boolean>(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('+91');
  const [showCountryOptions, setShowCountryOptions] = useState<boolean>(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState<boolean>(false);
  const [searchTable, setSearchTable] = useState<string>('');
  const [isTableInvalid, setIsTableInvalid] = useState<boolean>(false);

  const [customers, setCustomers] = useState<Customer[]>([
    { srNo: 1, name: 'xyz', countryCode: '91', mobile: '123', mail: '', city: '', address1: '', address2: '' },
    { srNo: 2, name: 'abc', countryCode: '91', mobile: '12312', mail: '', city: '', address1: '', address2: '' },
    { srNo: 3, name: 'efg', countryCode: '91', mobile: '1234', mail: '', city: '', address1: '', address2: '' },
    { srNo: 4, name: 'jkl', countryCode: '91', mobile: '2.3', mail: '', city: '', address1: '', address2: '' },
    { srNo: 5, name: '211', countryCode: '91', mobile: '213', mail: '', city: 'kop', address1: '', address2: '' },
    { srNo: 6, name: 'ss', countryCode: '91', mobile: '252', mail: '', city: 'kop', address1: '', address2: '' },
    { srNo: 7, name: 'DD', countryCode: '91', mobile: '3236', mail: '', city: '', address1: '', address2: '' },
    { srNo: 8, name: 'zyx', countryCode: '91', mobile: '41', mail: '', city: '', address1: '', address2: '' },
  ]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>(customers);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    countryCode: '+91',
    mobile: '',
    mail: '',
    birthday: '',
    city: '',
    state: '',
    pincode: '',
    gstNo: '',
    fssai: '',
    panNo: '',
    aadharNo: '',
    anniversary: '',
    createWallet: false,
  });

  const [invalidTable, setInvalidTable] = useState<string>('');
  const [activeNavTab, setActiveNavTab] = useState<string>('ALL');
  const [tableItems, setTableItems] = useState<TableItem[]>([]);
  const [filteredTables, setFilteredTables] = useState<TableItem[]>([]);
  const [savedKOTs, setSavedKOTs] = useState<KOT[]>([]);
  const [showSavedKOTsModal, setShowSavedKOTsModal] = useState<boolean>(false);
  const [outlets, setOutlets] = useState<OutletData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { user } = useAuthContext();
  const itemListRef = useRef<HTMLDivElement>(null);
  const [describe, setDescribe] = useState<string>('');

  // Fetch tables from the TableManagement API
const fetchTableManagement = async () => {
  setLoading(true);
  try {
    const res = await fetch('http://localhost:3001/api/tablemanagement', {
      headers: { 'Content-Type': 'application/json' },
    });
    if (res.ok) {
      const response = await res.json();
      console.log('Raw tableItems data:', JSON.stringify(response, null, 2));
      if (response.success && Array.isArray(response.data)) {
        const formattedData = response.data.map((item: any) => ({
          ...item,
          status: Number(item.status), // Convert status to number
        }));
        setTableItems(formattedData);
        setFilteredTables(formattedData);
        setErrorMessage('');
      } else if (response.success && response.data.length === 0) {
        setErrorMessage('No tables found in TableManagement API.');
        setTableItems([]);
        setFilteredTables([]);
      } else {
        setErrorMessage(response.message || 'Invalid data format received from TableManagement API.');
        setTableItems([]);
        setFilteredTables([]);
      }
    } else {
      setErrorMessage(`Failed to fetch tables: ${res.status} ${res.statusText}`);
      setTableItems([]);
      setFilteredTables([]);
    }
  } catch (err) {
    console.error('Table fetch error:', err);
    setErrorMessage('Failed to fetch tables. Please check the API endpoint.');
    setTableItems([]);
    setFilteredTables([]);
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    setFilteredCustomers(customers);
  }, [customers]);

  useEffect(() => {
    if (itemListRef.current) {
      itemListRef.current.scrollTop = itemListRef.current.scrollHeight;
    }
  }, [items]);

  useEffect(() => {
    const loadedKOTs = JSON.parse(localStorage.getItem('kots') || '[]');
    setSavedKOTs(loadedKOTs);
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const updatedKOTs = JSON.parse(localStorage.getItem('kots') || '[]');
      setSavedKOTs(updatedKOTs);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const fetchOutletsData = async () => {
      console.log('Full user object:', JSON.stringify(user, null, 2));
      
      if (!user || !user.id) {
        setErrorMessage('User not logged in or user ID missing.');
        setLoading(false);
        console.log('User data issue:', user);
        return;
      }

      if (user.role_level === 'outlet_user' && (!user.hotelid || !user.outletid)) {
        setErrorMessage('Outlet user missing required hotelid or outletid.');
        setLoading(false);
        console.log('Outlet user data issue:', user);
        return;
      }

      if (user.role_level !== 'outlet_user' && !user.hotelid) {
        setErrorMessage('User missing required hotelid.');
        setLoading(false);
        console.log('User data issue:', user);
        return;
      }

      try {
        setLoading(true);
        setErrorMessage('');
        
        if (user.role_level === 'outlet_user' && user.outletid) {
          console.log('Outlet user detected, fetching outlets with outletid filter:', user.outletid);
          await fetchOutletsForDropdown(user, setOutlets, setLoading);
        } else {
          console.log('Fetching all outlets for user:', { userid: user.id, hotelid: user.hotelid, outletid: user.outletid });
          await fetchOutletsForDropdown(user, setOutlets, setLoading);
        }
        
        console.log('Outlets fetched:', outlets);
      } catch (error: any) {
        console.error('Error in fetchOutletsData:', error);
        setErrorMessage(
          error.response?.status === 404
            ? 'Outlets API endpoint not found. Please check backend configuration.'
            : 'Failed to fetch outlets. Please try again later.'
        );
        setOutlets([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOutletsData();
    fetchTableManagement();
  }, [user?.id, user?.hotelid, user?.outletid, user?.role_level]);

  useEffect(() => {
    if (!loading && outlets.length === 0 && !errorMessage && user) {
      console.log('No outlets found:', { loading, outletsLength: outlets.length, errorMessage, user });
    }
  }, [outlets, loading, errorMessage, user]);

  useEffect(() => {
    console.log('Outlets state changed:', outlets);
    console.log('TableItems state changed:', tableItems);
  }, [outlets, tableItems]);

useEffect(() => {
  console.log('ActiveNavTab:', activeNavTab, 'Outlets:', outlets, 'TableItems:', tableItems);
  const selectedOutlet = outlets.find(outlet => outlet.outlet_name === activeNavTab);
  let filtered: TableItem[] = [];

  // Ensure tableItems is an array
  if (!Array.isArray(tableItems)) {
    console.error('tableItems is not an array:', tableItems);
    setFilteredTables([]);
    return;
  }

  if (selectedOutlet) {
    filtered = tableItems.filter(table => 
      table && table.outlet_name && 
      (table.outlet_name === activeNavTab || table.isCommonToAllDepartments)
    );
  } else {
    switch (activeNavTab) {
      case 'ALL':
        filtered = tableItems;
        break;
      case 'FamilyDine in':
        filtered = tableItems.filter(table => 
          table && table.table_name && 
          (table.table_name.startsWith('F') || table.isCommonToAllDepartments)
        );
        break;
      case 'Restaurant':
        filtered = tableItems.filter(table => 
          table && table.table_name && 
          (table.table_name.startsWith('R') || table.isCommonToAllDepartments)
        );
        break;
      case 'Rooms':
        filtered = tableItems.filter(table => 
          table && table.table_name && 
          (/^\d+$/.test(table.table_name) || table.isCommonToAllDepartments)
        );
        break;
      case 'Pickup':
      case 'Quick Bill':
      case 'Delivery':
        filtered = [];
        break;
      default:
        filtered = tableItems;
        break;
    }
  }
  
  setFilteredTables(filtered);
  console.log(`Filtered tables for ${activeNavTab}:`, JSON.stringify(filtered, null, 2));
}, [activeNavTab, outlets, tableItems]);
  // Validate searchTable input
  useEffect(() => {
    if (searchTable) {
      const isValidTable = filteredTables.some(table => 
        table && table.table_name && table.table_name.toLowerCase() === searchTable.toLowerCase()
      );
      setIsTableInvalid(!isValidTable);
      setInvalidTable(!isValidTable ? searchTable : '');
    } else {
      setIsTableInvalid(false);
      setInvalidTable('');
    }
  }, [searchTable, filteredTables]);

  const handleTableClick = (seat: string) => {
    console.log('Button clicked for table:', seat);
    setSelectedTable(seat);
    setItems([]);
    setShowOrderDetails(true);
    setInvalidTable('');
    console.log('After handleTableClick - selectedTable:', seat, 'showOrderDetails:', true);
  };

  const handleTabClick = (tab: string) => {
    console.log('Tab clicked:', tab);
    setDescribe(`Tab clicked: ${tab}`);
    setActiveTab(tab);
    if (['Pickup', 'Delivery', 'Quick Bill', 'Order/KOT', 'Billing'].includes(tab)) {
      setSelectedTable(null);
      setItems([]);
      setShowOrderDetails(true);
    } else {
      setShowOrderDetails(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(term)
    );
    setFilteredCustomers(filtered);
  };

  const handleCountryCodeClick = () => {
    setShowCountryOptions(!showCountryOptions);
  };

  const handleCountryCodeSelect = (code: string) => {
    setSelectedCountryCode(code);
    setShowCountryOptions(false);
  };

  const handleAddCustomerClick = () => {
    setShowNewCustomerForm(true);
  };

  const handleAddCustomerSubmit = () => {
    const newCustomerEntry: Customer = {
      srNo: customers.length + 1,
      name: newCustomer.name,
      countryCode: newCustomer.countryCode.replace('+', ''),
      mobile: newCustomer.mobile,
      mail: newCustomer.mail || '',
      city: newCustomer.city || '',
      address1: '',
      address2: '',
    };
    setCustomers([...customers, newCustomerEntry]);
    setNewCustomer({
      name: '',
      countryCode: '+91',
      mobile: '',
      mail: '',
      birthday: '',
      city: '',
      state: '',
      pincode: '',
      gstNo: '',
      fssai: '',
      panNo: '',
      aadharNo: '',
      anniversary: '',
      createWallet: false,
    });
    setSearchTerm('');
    setShowNewCustomerForm(false);
  };

  const handleIncreaseQty = (itemId: number) => {
    setItems(items.map(item =>
      item.id === itemId ? { ...item, qty: item.qty + 1 } : item
    ));
  };

  const handleDecreaseQty = (itemId: number) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, qty: item.qty - 1 } : item
    );
    setItems(updatedItems.filter(item => item.qty > 0));
  };

  const totalAmount = items
    .reduce((sum, item) => sum + item.price * item.qty, 0)
    .toFixed(2);

  const getKOTLabel = () => {
    switch (activeTab) {
      case 'Dine-in':
        return `KOT 1 ${selectedTable ? ` - Table ${selectedTable}` : ''}`;
      case 'Pickup':
        return 'Pickup Order';
      case 'Delivery':
        return 'Delivery Order';
      case 'Quick Bill':
        return 'Quick Bill';
      case 'Order/KOT':
        return 'Order/KOT';
      case 'Billing':
        return 'Billing';
      default:
        return 'KOT 1';
    }
  };

  const handleBackToTables = () => {
    setShowOrderDetails(false);
  };

  const handlePrintAndSaveKOT = () => {
    const kotData = {
      table: selectedTable || 'N/A',
      items: items,
      total: parseFloat(totalAmount),
      timestamp: new Date().toLocaleString(),
    };

    const savedKOTs = JSON.parse(localStorage.getItem('kots') || '[]');
    savedKOTs.push(kotData);
    localStorage.setItem('kots', JSON.stringify(savedKOTs));

    console.log('Saved KOT:', kotData);
    window.print();
    setItems([]);

    setSavedKOTs(savedKOTs);
  };

  useEffect(() => {
    console.log('State update - showOrderDetails:', showOrderDetails, 'selectedTable:', selectedTable);
  }, [showOrderDetails, selectedTable]);

  return (
    <div className="container-fluid p-0 m-0" style={{ height: '100vh' }}>
      {errorMessage && (
        <div className="alert alert-danger text-center" role="alert">
          {errorMessage}
        </div>
      )}
      <style>
        {`
          @media (max-width: 767px) {
            .main-container {
              flex-direction: column !important;
              height: auto !important;
              min-height: 100vh;
            }
            .table-container {
              width: 100%;
              overflow-x: auto;
            }
            .billing-panel {
              position: static !important;
              width: 100% !important;
              max-width: 100% !important;
              height: auto !important;
              margin-top: 1rem;
              margin-left: 0 !important;
              padding: 0.5rem;
            }
            .billing-panel .bg-white.border.rounded {
              font-size: 0.75rem;
            }
            .billing-panel .btn {
              font-size: 0.75rem !important;
              padding: 0.25rem 0.5rem !important;
            }
            .billing-panel input {
              font-size: 0.75rem !important;
              height: 25px !important;
            }
            .modal-table-container {
              font-size: 0.75rem;
            }
            .modal-table-container th,
            .modal-table-container td {
              padding: 0.5rem;
            }
            .form-row {
              display: grid;
              grid-template-columns: 1fr !important;
              gap: 0.5rem;
            }
            .item-list-container {
              max-height: 200px !important;
            }
            .billing-panel-inner {
              height: auto !important;
              min-height: 100%;
            }
            .billing-panel-bottom {
              position: sticky;
              bottom: 0;
              background: #f8f9fa;
              padding-bottom: 0.5rem;
            }
          }
          @media (min-width: 768px) {
            .main-container {
              flex-direction: row !important;
              height: 100vh !important;
            }
            .billing-panel {
              width: 400px !important;
              max-width: 400px !important;
              height: 92vh !important;
              margin-left: auto;
              position: sticky;
              top: 0;
              z-index: 1003;
            }
            .form-row {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 1rem;
            }
            .item-list-container {
              max-height: calc(92vh - 300px) !important;
            }
            .billing-panel-inner {
              height: 92vh !important;
            }
            .billing-panel-bottom {
              position: sticky;
              bottom: 0;
              padding-bottom: 0.5rem;
            }
          }
          @media (min-width: 992px) {
            .form-row {
              grid-template-columns: repeat(4, 1fr) !important;
            }
          }
          .billing-panel-inner {
            display: flex;
            flex-direction: column;
          }
          .item-list-container {
            display: flex;
            flex-direction: column;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: #888 #f1f1f1;
            flex-grow: 1;
          }
          .item-list-container::-webkit-scrollbar {
            width: 8px;
          }
          .item-list-container::-webkit-scrollbar-track {
          }
          .item-list-container::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 4px;
          }
          .item-list-container::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
          @media print {
            body * {
              visibility: hidden;
            }
            .billing-panel,
            .billing-panel * {
              visibility: visible;
            }
            .billing-panel {
              position: absolute;
              top: 0;
              left: 0;
              width: 100% !important;
              max-width: 100% !important;
              height: auto !important;
              margin: 0 !important;
              padding: 0.5rem;
            }
            .billing-panel-inner,
            .billing-panel-bottom {
              position: static !important;
              height: auto !important;
            }
            .billing-panel .btn,
            .billing-panel .position-absolute {
              display: none !important;
            }
            .billing-panel input {
              border: none !important;
              background: transparent !important;
              padding: 0.25rem !important;
              font-size: 0.875rem !important;
              height: auto !important;
              -webkit-appearance: none;
              -moz-appearance: none;
              appearance: none;
            }
            .item-list-container {
              max-height: none !important;
              overflow: visible !important;
            }
            .item-list-container::-webkit-scrollbar {
              display: none;
            }
          }
        `}
      </style>
      <div className="main-container d-flex flex-column flex-md-row gap-3">
        <div className="table-container flex-grow-1 me-md-3">
          <>
            {activeTab === 'Dine-in' && !showOrderDetails && (
              <div>
                <ul
                  className="nav nav-tabs rounded shadow-sm mb-3"
                  role="tablist"
                  style={{ padding: '5px', display: 'flex', gap: '5px' }}
                >
                  <li className="nav-item flex-fill">
                    <button
                      className={`nav-link ${activeNavTab === 'ALL' ? 'active bg-primary text-white' : 'text-dark'}`}
                      onClick={() => setActiveNavTab('ALL')}
                      role="tab"
                      style={{ border: 'none', borderRadius: '5px', padding: '8px 12px', fontSize: '14px', fontWeight: 500, textAlign: 'center' }}
                    >
                      ALL
                    </button>
                  </li>
                  {loading ? (
                    <li className="nav-item flex-fill">
                      <span>Loading outlets...</span>
                    </li>
                  ) : outlets.length === 0 ? (
                    <li className="nav-item flex-fill">
                      <span style={{ color: 'red' }}>
                        {user?.role_level === 'outlet_user'
                          ? 'No assigned outlet found for outlet user.'
                          : 'Failed to load outlets or no outlets available'}
                      </span>
                    </li>
                  ) : (
                    outlets.map((outlet, index) => (
                      <li className="nav-item flex-fill" key={index}>
                        <button
                          className={`nav-link ${activeNavTab === outlet.outlet_name ? 'active bg-primary text-white' : 'text-dark'}`}
                          onClick={() => setActiveNavTab(outlet.outlet_name)}
                          role="tab"
                          style={{ border: 'none', borderRadius: '5px', padding: '8px 12px', fontSize: '14px', fontWeight: 500, textAlign: 'center' }}
                        >
                          {outlet.outlet_name} ({outlet.outletid})
                          {user?.role_level === 'outlet_user' && ' (Assigned)'}
                        </button>
                      </li>
                    ))
                  )}
                  {['Pickup', 'Quick Bill', 'Delivery'].map((tab, index) => (
                    <li className="nav-item flex-fill" key={index + outlets.length}>
                      <button
                        className={`nav-link ${tab === activeNavTab ? 'active bg-primary text-white' : 'text-dark'}`}
                        onClick={() => setActiveNavTab(tab)}
                        role="tab"
                        style={{ border: 'none', borderRadius: '5px', padding: '8px 12px', fontSize: '14px', fontWeight: 500, textAlign: 'center' }}
                      >
                        {tab}
                      </button>
                    </li>
                  ))}
                </ul>
                <div
                  className="d-flex flex-column justify-content-start align-items-start rounded shadow-sm p-1 mt-3"
                >
                  {loading ? (
                    <p className="text-center text-muted mb-0">Loading tables...</p>
                  ) : activeNavTab === 'ALL' ? (
                    <>
                      {outlets.map((outlet, index) => (
                        <div key={index}>
                          <p style={{ color: 'green', fontWeight: 'bold', margin: '10px 0 5px' }}>
                            Outlet {outlet.outlet_name}
                          </p>
                          <div className="d-flex flex-wrap gap-1">
                      {Array.isArray(tableItems) ? tableItems
                        .filter(table => 
                          table && table.outlet_name && 
                          table.outlet_name.toLowerCase() === outlet.outlet_name.toLowerCase()
                        )
                        .map((table, tableIndex) => (
                          table.table_name ? (
                            <div key={tableIndex} className="p-1">
                              <button
                                className={`btn ${selectedTable === table.table_name ? 'btn-success' : 'btn-outline-success'}`}
                                style={{ width: '90px', height: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                onClick={() => {
                                  console.log('Button clicked for table:', table.table_name, 'isActive:', table.isActive);
                                  handleTableClick(table.table_name);
                                }}
                              >
                                {table.table_name} {table.isActive ? '' : ''}
                              </button>
                            </div>
                          ) : null
                        )) : null}
                      {Array.isArray(tableItems) && tableItems.filter(table => 
                        table && table.outlet_name && 
                        table.outlet_name.toLowerCase() === outlet.outlet_name.toLowerCase()
                      ).length === 0 && (
                        <p className="text-center text-muted mb-0">
                          No tables available for {outlet.outlet_name}.
                        </p>
                      )}
                          </div>
                        </div>
                      ))}
                      {outlets.length === 0 && (
                        <p className="text-center text-muted mb-0">
                          No outlets available. Please check outlet data.
                        </p>
                      )}
                    </>
                  ) : activeNavTab === 'abcd' || activeNavTab === 'qwert' ? (
                    <div>
                      <p style={{ color: 'green', fontWeight: 'bold', margin: '10px 0 5px' }}>Outlet {activeNavTab}</p>
                      <div className="d-flex flex-wrap gap-1">
                      {Array.isArray(filteredTables) ? filteredTables
                        .filter(table => 
                          table && table.outlet_name && 
                          table.outlet_name.toLowerCase() === activeNavTab.toLowerCase()
                        )
                        .map((table, index) => (
                          table.table_name ? (
                            <div key={index} className="p-1">
                              <button
                                className={`btn ${selectedTable === table.table_name ? 'btn-success' : 'btn-outline-success'}`}
                                style={{ width: '90px', height: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                onClick={() => {
                                  console.log('Button clicked for table:', table.table_name, 'isActive:', table.isActive);
                                  handleTableClick(table.table_name);
                                }}
                              >
                                {table.table_name} {table.isActive ? '' : ''}
                              </button>
                            </div>
                          ) : null
                        )) : null}
                      {Array.isArray(filteredTables) && filteredTables.filter(table => 
                        table && table.outlet_name && 
                        table.outlet_name.toLowerCase() === activeNavTab.toLowerCase()
                      ).length === 0 && (
                        <p className="text-center text-muted mb-0">
                          No tables available for {activeNavTab}. Please check TableManagement data.
                        </p>
                      )}
                      </div>
                    </div>
                  ) : filteredTables.length > 0 ? (
                    <div className="d-flex flex-wrap gap-1">
                    {Array.isArray(filteredTables) ? filteredTables
                      .filter(table => table && table.table_name)
                      .map((table, index) => (
                        <div key={index} className="p-1">
                          <button
                            className={`btn ${selectedTable === table.table_name ? 'btn-success' : 'btn-outline-success'}`}
                            style={{ width: '90px', height: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                            onClick={() => {
                              console.log('Button clicked for table:', table.table_name, 'isActive:', table.isActive);
                              handleTableClick(table.table_name);
                            }}
                          >
                            {table.table_name} {table.isActive ? '' : ''}
                          </button>
                        </div>
                      )) : null}
                    </div>
                  ) : (
                    <p className="text-center text-muted mb-0">
                      No tables available for {activeNavTab}. Please check TableManagement data.
                    </p>
                  )}
                </div>
              </div>
            )}
            {showOrderDetails && (
              <div className="rounded shadow-sm p-1 mt-0">
                <OrderDetails
                  tableId={selectedTable}
                  onChangeTable={handleBackToTables}
                  items={items}
                  setItems={setItems}
                  setSelectedTable={setSelectedTable}
                  invalidTable={invalidTable}
                  setInvalidTable={setInvalidTable}
                />
              </div>
            )}
          </>
        </div>
        <div className="billing-panel border-start p-0">
          <div className="rounded shadow-sm p-1 w-100 billing-panel-inner">
            <div>
              <div className="d-flex flex-wrap gap-1 border-bottom pb-0">
                <div className="d-flex flex-wrap gap-1 flex-grow-1">
                  {['Dine-in', 'Pickup', 'Delivery', 'Quick Bill', 'Order/KOT', 'Billing'].map((tab, index) => (
                    <button
                      key={index}
                      className={`btn btn-sm flex-fill text-center ${tab === activeTab ? 'btn-primary' : 'btn-outline-secondary'}`}
                      style={{ fontSize: 'x-small' }}
                      onClick={() => handleTabClick(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-center fw-bold bg-white border rounded p-2">{getKOTLabel()}</div>
              <div
                className="rounded border fw-bold text-black"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr',
                  padding: '0.5rem',
                }}
              >
                <span style={{ textAlign: 'left' }}>Item Name</span>
                <span className="text-center">Qty</span>
                <span className="text-center">Amount</span>
              </div>
            </div>
            <div
              className="border rounded item-list-container"
              ref={itemListRef}
            >
              {items.length === 0 ? (
                <p className="text-center text-muted mb-0">No items added</p>
              ) : (
                items.map((item, index) => (
                  <div
                    key={item.id}
                    className="border-bottom"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr',
                      padding: '0.25rem',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ textAlign: 'left' }}>{item.name}</span>
                    <div className="text-center d-flex justify-content-center align-items-center gap-2">
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ padding: '0 5px', lineHeight: '1' }}
                        onClick={() => handleDecreaseQty(item.id)}
                      >
                        −
                      </button>
                      <style>
                        {`
                          .no-spinner::-webkit-inner-spin-button,
                          .no-spinner::-webkit-outer-spin-button {
                            -webkit-appearance: none;
                            margin: 0;
                          }
                          .no-spinner {
                            -moz-appearance: textfield;
                            appearance: none;
                          }
                        `}
                      </style>
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => {
                          const newQty = parseInt(e.target.value) || 0;
                          if (newQty <= 0) {
                            setItems(items.filter((i) => i.id !== item.id));
                          } else {
                            setItems(
                              items.map((i) =>
                                i.id === item.id ? { ...i, qty: newQty } : i
                              )
                            );
                          }
                        }}
                        className="border rounded text-center no-spinner"
                        style={{ width: '40px', height: '16px', fontSize: '0.75rem', padding: '0' }}
                        min="0"
                        max="999"
                      />
                      <button
                        className="btn btn-success btn-sm"
                        style={{ padding: '0 5px', lineHeight: '1' }}
                        onClick={() => handleIncreaseQty(item.id)}
                      >
                        +
                      </button>
                    </div>
                    <div className="text-center">
                      <div>{(item.price * item.qty).toFixed(2)}</div>
                      <div
                        style={{ fontSize: '0.75rem', color: '#6c757d', width: '50px', height: '16px', margin: '0 auto' }}
                      >
                        ({item.price.toFixed(2)})
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="billing-panel-bottom">
              <div className="d-flex flex-column flex-md-row gap-2 mt-2">
                <div className="d-flex gap-1 position-relative">
                  <div
                    className="border rounded d-flex align-items-center justify-content-center"
                    style={{
                      width: '50px',
                      height: '30px',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                    onClick={handleCountryCodeClick}
                  >
                    {selectedCountryCode}
                    {showCountryOptions && (
                      <div
                        className="position-absolute border rounded shadow-sm"
                        style={{
                          top: '100%',
                          left: 0,
                          width: '50px',
                          zIndex: 1004,
                        }}
                      >
                        {['+91', '+1', '+44'].map((code) => (
                          <div
                            key={code}
                            className="text-center p-1"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleCountryCodeSelect(code)}
                            onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f8f9fa')}
                          >
                            {code}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Mobile No"
                    className="form-control"
                    style={{ width: '150px', height: '30px', fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                  />
                </div>
                <div className="d-flex align-items-center">
                  <input
                    type="text"
                    placeholder="Customer Name"
                    className="form-control"
                    style={{ width: '150px', height: '30px', fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                  />
                  <button
                    className="btn btn-outline-primary ms-1"
                    style={{ height: '30px', padding: '0 8px', fontSize: '0.875rem' }}
                    onClick={handleAddCustomerClick}
                    title="Add Customer"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="d-flex flex-column flex-md-row gap-2 mt-2">
                {(activeTab === 'Delivery' || activeTab === 'Billing') && (
                  <input
                    type="text"
                    placeholder="Customer Address"
                    className="form-control"
                    style={{ width: '150px', height: '30px', fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                  />
                )}
                <input
                  type="text"
                  placeholder="KOT Note"
                  className="form-control"
                  style={{ width: '150px', height: '30px', fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                />
                {activeTab === 'Dine-in' && (
                  <div style={{ maxWidth: '100px', minHeight: '38px' }}>
                    <div className="input-group rounded-search">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Table"
                        value={searchTable}
                        onChange={(e) => setSearchTable(e.target.value)}
                        style={{ maxWidth: '100px', minHeight: '38px', fontSize: '1.2rem' }}
                      />
                    </div>
                    {isTableInvalid && (
                      <div className="text-danger small text-center mt-1">
                        Invalid Table
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="mt-1">
                <div
                  className="d-flex justify-content-between align-items-center bg-success text-white rounded"
                  style={{ padding: '0.25rem 0.75rem' }}
                >
                  <span className="fw-bold">TOTAL:</span>
                  <span className="fw-bold">{totalAmount}</span>
                </div>
                <div className="d-flex justify-content-center gap-2 mt-2">
                  <button
                    className="btn btn-dark rounded"
                    onClick={handlePrintAndSaveKOT}
                    disabled={items.length === 0 || !!invalidTable}
                  >
                    Print & Save KOT
                  </button>
                  <button
                    className="btn btn-info rounded"
                    onClick={() => setShowSavedKOTsModal(true)}
                  >
                    View Saved KOTs
                  </button>
                </div>
              </div>
            </div>
          </div>

          <Modal show={showNewCustomerForm} onHide={() => setShowNewCustomerForm(false)} centered size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Add New Customer</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '590px' }}>
              <Form>
                <div className="form-row grid gap-3">
                  <Form.Group controlId="name">
                    <Form.Label>Name *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter name"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group controlId="countryCode">
                    <Form.Label>Country Code</Form.Label>
                    <Form.Select
                      value={newCustomer.countryCode}
                      onChange={(e) => setNewCustomer({ ...newCustomer, countryCode: e.target.value })}
                    >
                      <option value="+91">India +91</option>
                      <option value="+1">USA +1</option>
                      <option value="+44">UK +44</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group controlId="mobile">
                    <Form.Label>Mobile *</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter mobile number"
                      value={newCustomer.mobile}
                      onChange={(e) => setNewCustomer({ ...newCustomer, mobile: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group controlId="email">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Enter email"
                      value={newCustomer.mail}
                      onChange={(e) => setNewCustomer({ ...newCustomer, mail: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group controlId="birthday">
                    <Form.Label>Birthday</Form.Label>
                    <Form.Control
                      type="date"
                      value={newCustomer.birthday}
                      onChange={(e) => setNewCustomer({ ...newCustomer, birthday: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group controlId="city">
                    <Form.Label>City</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter city"
                      value={newCustomer.city}
                      onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group controlId="state">
                    <Form.Label>State</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter state"
                      value={newCustomer.state}
                      onChange={(e) => setNewCustomer({ ...newCustomer, state: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group controlId="pincode">
                    <Form.Label>Pincode</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter pincode"
                      value={newCustomer.pincode}
                      onChange={(e) => setNewCustomer({ ...newCustomer, pincode: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group controlId="gstNo">
                    <Form.Label>GST No.</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter GST number"
                      value={newCustomer.gstNo}
                      onChange={(e) => setNewCustomer({ ...newCustomer, gstNo: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group controlId="fssai">
                    <Form.Label>FSSAI</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter FSSAI"
                      value={newCustomer.fssai}
                      onChange={(e) => setNewCustomer({ ...newCustomer, fssai: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group controlId="panNo">
                    <Form.Label>PAN No.</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter PAN number"
                      value={newCustomer.panNo}
                      onChange={(e) => setNewCustomer({ ...newCustomer, panNo: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group controlId="aadharNo">
                    <Form.Label>Aadhar No.</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Enter Aadhar number"
                      value={newCustomer.aadharNo}
                      onChange={(e) => setNewCustomer({ ...newCustomer, aadharNo: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group controlId="anniversary">
                    <Form.Label>Anniversary</Form.Label>
                    <Form.Control
                      type="date"
                      value={newCustomer.anniversary}
                      onChange={(e) => setNewCustomer({ ...newCustomer, anniversary: e.target.value })}
                    />
                  </Form.Group>
                  <Form.Group controlId="createWallet">
                    <Form.Label>Create Wallet</Form.Label>
                    <Form.Check
                      type="checkbox"
                      label="Create wallet"
                      checked={newCustomer.createWallet}
                      onChange={(e) => setNewCustomer({ ...newCustomer, createWallet: e.target.checked })}
                    />
                  </Form.Group>
                </div>
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <Button variant="success" onClick={handleAddCustomerSubmit}>
                    Add
                  </Button>
                  <input
                    type="text"
                    placeholder="Search..."
                    className="form-control"
                    style={{ width: '200px' }}
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>
              </Form>

              <div className="modal-table-container" style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '20px' }}>
                <div className="table-responsive">
                  <Table bordered hover>
                    <thead>
                      <tr>
                        <th>Sr No</th>
                        <th>C NAME</th>
                        <th>COUNTRY CODE</th>
                        <th>MOBILE</th>
                        <th>MAIL</th>
                        <th>CITY</th>
                        <th>ADDRESS 1</th>
                        <th>ADDRESS 2</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCustomers.map((customer) => (
                        <tr key={customer.srNo}>
                          <td>{customer.srNo}</td>
                          <td>{customer.name}</td>
                          <td>{customer.countryCode}</td>
                          <td>{customer.mobile}</td>
                          <td>{customer.mail}</td>
                          <td>{customer.city}</td>
                          <td>{customer.address1}</td>
                          <td>{customer.address2}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowNewCustomerForm(false)}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>

          <Modal show={showSavedKOTsModal} onHide={() => setShowSavedKOTsModal(false)} centered size="lg">
            <Modal.Header closeButton>
              <Modal.Title>Saved KOTs</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ maxHeight: '500px', overflowY: 'auto' }}>
              {savedKOTs.length === 0 ? (
                <p className="text-center text-muted">No KOTs saved yet.</p>
              ) : (
                <Table bordered hover>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Table</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedKOTs.map((kot, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{kot.table}</td>
                        <td>
                          {kot.items.map((item, idx) => (
                            <div key={idx}>
                              {item.name} (Qty: {item.qty}, Price: ${item.price.toFixed(2)})
                            </div>
                          ))}
                        </td>
                        <td>${kot.total.toFixed(2)}</td>
                        <td>{kot.timestamp}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowSavedKOTsModal(false)}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
       </div>
    );
};

export default Order;
