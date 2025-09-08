import { useState, useEffect, useRef } from 'react';
import { Button, Modal, Table } from 'react-bootstrap';
import OrderDetails from './OrderDetails';
import { fetchOutletsForDropdown } from '@/utils/commonfunction';
import { useAuthContext } from '@/common';
import { OutletData } from '@/common/api/outlet';
import AddCustomerModal from './Customers';
import { toast } from 'react-hot-toast';
import { createBill, getSavedKOTs, getTaxesByOutletAndDepartment } from '@/common/api/orders';

interface MenuItem {
  id: number;
  name: string;
  price: number;
  qty: number;
}

//

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
  departmentid?: number;
}

interface DepartmentItem {
  departmentid: number;
  department_name: string;
  outletid: number;
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
  const itemListRef = useRef<HTMLDivElement>(null);
  const [describe, setDescribe] = useState<string>('');
  const [invalidTable, setInvalidTable] = useState<string>('');
  const [activeNavTab, setActiveNavTab] = useState<string>('ALL');
  const [tableItems, setTableItems] = useState<TableItem[]>([]);
  const [filteredTables, setFilteredTables] = useState<TableItem[]>([]);
  const [savedKOTs, setSavedKOTs] = useState<any[]>([]);
  const [showSavedKOTsModal, setShowSavedKOTsModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { user } = useAuthContext();
  const [outlets, setOutlets] = useState<OutletData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [tableSearchInput, setTableSearchInput] = useState<string>('');
  const tableSearchInputRef = useRef<HTMLInputElement>(null);
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [taxRates, setTaxRates] = useState<{ cgst: number; sgst: number; igst: number; cess: number }>({ cgst: 0, sgst: 0, igst: 0, cess: 0 });
  const [taxCalc, setTaxCalc] = useState<{ subtotal: number; cgstAmt: number; sgstAmt: number; igstAmt: number; cessAmt: number; grandTotal: number }>({ subtotal: 0, cgstAmt: 0, sgstAmt: 0, igstAmt: 0, cessAmt: 0, grandTotal: 0 });
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [selectedOutletId, setSelectedOutletId] = useState<number | null>(null);
  // const [billId, setBillId] = useState<number | null>(null);
  // const [currentOrderNo, setCurrentOrderNo] = useState<string | null>(null);


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
            status: Number(item.status),
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


  const fetchCustomerByMobile = async (mobile: string) => {

    try {
      const res = await fetch(`http://localhost:3001/api/customer/by-mobile?mobile=${mobile}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const response = await res.json();
        console.log('Customer API response:', response); // Debug log

        // Handle the response based on your API structure
        if (response.customerid && response.name) {
          // Direct response format (based on your backend code)
          setCustomerName(response.name);
        } else if (response.success && response.data && response.data.length > 0) {
          // Wrapped response format
          const customer = response.data[0];
          setCustomerName(customer.name);
        } else {
          setCustomerName('');
          console.log('Customer not found');
        }
      } else if (res.status === 404) {
        setCustomerName('');
        console.log('Customer not found (404)');
      } else {
        console.error('Failed to fetch customer:', res.status, res.statusText);
        setCustomerName('');
      }
    } catch (err) {
      console.error('Customer fetch error:', err);
      setCustomerName('');
    }
  };

  useEffect(() => {
    if (mobileNumber.length >= 10) {
      fetchCustomerByMobile(mobileNumber);
    } else {
      setCustomerName('');
    }
  }, [mobileNumber]);

  // Add this handler function in your Order component
  const handleMobileKeyPress = (e: React.KeyboardEvent) => {

    if (e.key === 'Enter') {
      e.preventDefault(); // Prevent form submission
      if (mobileNumber.trim()) {
        fetchCustomerByMobile(mobileNumber.trim());
      }
    }
  };


  useEffect(() => {
    if (itemListRef.current) {
      itemListRef.current.scrollTop = itemListRef.current.scrollHeight;
    }
  }, [items]);

  useEffect(() => {
    // Initial load of saved KOTs from backend (isBilled = 0)
    (async () => {
      try {
        const resp = await getSavedKOTs({ isBilled: 0 });
        const list = resp?.data || resp;
        if (Array.isArray(list)) setSavedKOTs(list);
      } catch (err) {
        console.warn('getSavedKOTs initial load failed');
      }
    })();
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const updatedKOTs = JSON.parse(localStorage.getItem('kots') || '[]');
      setSavedKOTs(updatedKOTs);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/table-department', {
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          let formattedDepartments = data.data.map((item: any) => ({
            departmentid: item.departmentid,
            department_name: item.department_name,
            outletid: item.outletid,
          }));
          if (user && user.role_level === 'outlet_user' && user.outletid) {
            formattedDepartments = formattedDepartments.filter((d: DepartmentItem) => d.outletid === Number(user.outletid));
          }
          setDepartments(formattedDepartments);
        } else {
          toast.error(data.message || 'Failed to fetch departments');
        }
      } else {
        toast.error('Failed to fetch departments');
      }
    } catch (err) {
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    const fetchData = async () => {
      await fetchOutletsData();
      await fetchDepartments();
      fetchTableManagement();
    };
    fetchData();
  }, [user?.id, user?.hotelid, user?.outletid, user?.role_level]);

  useEffect(() => {
    if (!loading && outlets.length === 0 && !errorMessage && user) {
      console.log('No outlets found:', { loading, outletsLength: outlets.length, errorMessage, user });
    }
  }, [outlets, loading, errorMessage, user]);

  useEffect(() => {
    console.log('Outlets state changed:', outlets);
    console.log('Departments state changed:', departments);
    console.log('TableItems state changed:', tableItems);
  }, [outlets, departments, tableItems]);

  useEffect(() => {
    console.log('ActiveNavTab:', activeNavTab, 'Outlets:', outlets, 'Departments:', departments, 'TableItems:', tableItems);
    let filtered: TableItem[] = [];
    if (!Array.isArray(tableItems)) {
      console.error('tableItems is not an array:', tableItems);
      setFilteredTables([]);
      return;
    }
    if (activeNavTab === 'ALL') {
      filtered = tableItems;
    } else {
      const selectedDepartment = departments.find(d => d.department_name === activeNavTab);
      if (selectedDepartment) {
        filtered = tableItems.filter(table =>
          Number(table.departmentid) === selectedDepartment.departmentid || table.isCommonToAllDepartments
        );
      } else {
        switch (activeNavTab) {
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
    }
    setFilteredTables(filtered);
    console.log(`Filtered tables for ${activeNavTab}:`, JSON.stringify(filtered, null, 2));
  }, [activeNavTab, outlets, departments, tableItems]);

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
    try {
      const selectedTableRecord: any = (Array.isArray(filteredTables) ? filteredTables : tableItems)
        .find((t: any) => t && t.table_name && t.table_name === seat)
        || (Array.isArray(tableItems) ? tableItems.find((t: any) => t && t.table_name === seat) : undefined);
      if (selectedTableRecord) {
        const deptId = Number((selectedTableRecord as any).departmentid) || null;
        const outletId = Number((selectedTableRecord as any).outletid) || null;
        if (deptId) setSelectedDeptId(deptId);
        if (outletId) setSelectedOutletId(outletId);
      }
    } catch (e) {
      // no-op
    }
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

  const handleCloseCustomerModal = () => {
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

  // Track department selection from tab changes
  useEffect(() => {
    const selectedDepartment = departments.find(d => d.department_name === activeNavTab) || null;
    if (selectedDepartment) {
      setSelectedDeptId(Number(selectedDepartment.departmentid));
      setSelectedOutletId(Number(selectedDepartment.outletid));
    } else if (activeNavTab === 'ALL') {
      // keep previous selection if a table later sets department
    } else {
      setSelectedDeptId(null);
      setSelectedOutletId(null);
    }
  }, [activeNavTab, departments]);

  // Fetch taxes whenever a concrete department selection is known (from tab or table)
  useEffect(() => {
    if (!selectedDeptId) {
      setTaxRates({ cgst: 0, sgst: 0, igst: 0, cess: 0 });
      return;
    }
    (async () => {
      try {
        console.log('Fetching taxes for:', { selectedDeptId, selectedOutletId });
        const resp = await getTaxesByOutletAndDepartment({ outletid: selectedOutletId ?? undefined, departmentid: selectedDeptId });
        console.log('Tax API response:', resp);
        if (resp?.success && resp?.data?.taxes) {
          const t = resp.data.taxes;
          const newRates = {
            cgst: Number(t.cgst) || 0,
            sgst: Number(t.sgst) || 0,
            igst: Number(t.igst) || 0,
            cess: Number(t.cess) || 0,
          };
          console.log('Setting tax rates:', newRates);
          setTaxRates(newRates);
        } else {
          console.log('No tax data found, setting zeros');
          setTaxRates({ cgst: 0, sgst: 0, igst: 0, cess: 0 });
        }
      } catch (e) {
        console.error('Tax fetch error:', e);
        setTaxRates({ cgst: 0, sgst: 0, igst: 0, cess: 0 });
      }
    })();
  }, [selectedDeptId, selectedOutletId]);

  // Recalculate taxes whenever items or tax rates change
  useEffect(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    // Calculate all taxes independently - no if/else logic
    const cgstAmt = (subtotal * (Number(taxRates.cgst) || 0)) / 100;
    const sgstAmt = (subtotal * (Number(taxRates.sgst) || 0)) / 100;
    const igstAmt = (subtotal * (Number(taxRates.igst) || 0)) / 100;
    const cessAmt = (subtotal * (Number(taxRates.cess) || 0)) / 100;
    const grandTotal = subtotal + cgstAmt + sgstAmt + igstAmt + cessAmt;
    setTaxCalc({ subtotal, cgstAmt, sgstAmt, igstAmt, cessAmt, grandTotal });
  }, [items, taxRates]);

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

  const handlePrintAndSaveKOT = async () => {
    try {
      if (items.length === 0) return;
      setLoading(true);
      const orderNo = `${selectedTable || 'TB'}-${Date.now()}`;
      // setCurrentOrderNo(orderNo);
      // Derive TableID from selected table record
      const selectedTableRecord: any = (Array.isArray(filteredTables) ? filteredTables : tableItems)
        .find((t: any) => t && t.table_name && t.table_name === selectedTable)
        || (Array.isArray(tableItems) ? tableItems.find((t: any) => t && t.table_name === selectedTable) : undefined)
      const resolvedTableId = selectedTableRecord ? Number((selectedTableRecord as any).tableid || (selectedTableRecord as any).tablemanagementid) : null
      const resolvedDeptId = selectedTableRecord ? Number((selectedTableRecord as any).departmentid) || undefined : undefined

      const details = items.map(i => {
        const lineSubtotal = Number(i.price) * Number(i.qty);
        // Calculate all taxes independently - no if/else logic
        const cgstPer = Number(taxRates.cgst) || 0;
        const sgstPer = Number(taxRates.sgst) || 0;
        const igstPer = Number(taxRates.igst) || 0;
        const cessPer = Number(taxRates.cess) || 0;
        const cgstAmt = (lineSubtotal * cgstPer) / 100;
        const sgstAmt = (lineSubtotal * sgstPer) / 100;
        const igstAmt = (lineSubtotal * igstPer) / 100;
        const cessAmt = (lineSubtotal * cessPer) / 100;
        return {
          ItemID: i.id,
          Qty: i.qty,
          RuntimeRate: i.price,
          TableID: resolvedTableId || undefined,
          DeptID: resolvedDeptId ?? selectedDeptId ?? undefined,
          CGST: cgstPer,
          CGST_AMOUNT: Number(cgstAmt.toFixed(2)),
          SGST: sgstPer,
          SGST_AMOUNT: Number(sgstAmt.toFixed(2)),
          IGST: igstPer,
          IGST_AMOUNT: Number(igstAmt.toFixed(2)),
          CESS: cessPer,
          CESS_AMOUNT: Number(cessAmt.toFixed(2))
        };
      });
      const payload: any = {
        TableID: resolvedTableId,
        orderNo,
        CustomerName: customerName || null,
        MobileNo: mobileNumber || null,
        details,
        GrossAmt: Number(taxCalc.subtotal.toFixed(2)),
        CGST: Number(taxCalc.cgstAmt.toFixed(2)) || 0,
        SGST: Number(taxCalc.sgstAmt.toFixed(2)) || 0,
        IGST: Number(taxCalc.igstAmt.toFixed(2)) || 0,
        CESS: Number(taxCalc.cessAmt.toFixed(2)) || 0,
        Amount: Number(taxCalc.grandTotal.toFixed(2))
      };
      const resp = await createBill(payload);
      if (resp?.success) {
        // setBillId(resp.data?.TxnID || null);
        toast.success('KOT saved');
        window.print();
        // refresh saved KOTs list
        try {
          const listResp = await getSavedKOTs({ isBilled: 0 });
          const list = listResp?.data || listResp;
          if (Array.isArray(list)) setSavedKOTs(list);
        } catch (err) {
          console.warn('refresh saved KOTs failed');
        }
      } else {
        toast.error(resp?.message || 'Failed to save KOT');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Error saving KOT');
    } finally {
      setLoading(false);
    }
  };

  const handleTableSearchInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const inputTable = tableSearchInput.trim();
      if (inputTable) {
        const isValidTable = filteredTables.some(table =>
          table && table.table_name && table.table_name.toLowerCase() === inputTable.toLowerCase()
        );
        if (isValidTable) {
          handleTableClick(inputTable);
          setTableSearchInput('');
        } else {
          toast.error('Invalid table name. Please select a valid table.');
        }
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        const tabIndex = parseInt(e.key);
        const allTabs = ['ALL', ...departments.map(d => d.department_name), 'Pickup', 'Quick Bill', 'Delivery'];
        if (tabIndex < allTabs.length) {
          const selectedTab = allTabs[tabIndex];
          setActiveNavTab(selectedTab);
          console.log(`Ctrl + ${tabIndex} pressed, activating tab: ${selectedTab}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [departments]);

  // New useEffect for setting focus on table search input
  useEffect(() => {
    if (activeTab === 'Dine-in' && !showOrderDetails && tableSearchInputRef.current) {
      tableSearchInputRef.current.focus();
    }
  }, [activeTab, showOrderDetails]);

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
              ;
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
      <div className="container-fluid p-0 m-0" style={{ height: '100vh' }}>
        {errorMessage && (
          <div className="alert alert-danger text-center" role="alert">
            {errorMessage}
          </div>
        )}
        <div className="main-container d-flex flex-column flex-md-row ">
          <div className="table-container flex-grow-1 me-md-3 ">
            <>
              {activeTab === 'Dine-in' && !showOrderDetails && (
                <div>
                  <ul
                    className="nav nav-tabs rounded shadow-sm mb-3"
                    role="tablist"
                    style={{ padding: '5px', display: 'flex', gap: '5px', alignItems: 'center' }}
                  >
                    <li className="nav-item">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Enter Table "
                        value={tableSearchInput}
                        onChange={(e) => setTableSearchInput(e.target.value)}
                        onKeyPress={handleTableSearchInput}
                        ref={tableSearchInputRef}
                        style={{ width: '100px', height: '50px', fontSize: '0.875rem', padding: '0.25rem 0.5rem', backgroundColor: '#ffffe0' }}
                      />
                    </li>
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
                        <span>Loading departments...</span>
                      </li>
                    ) : departments.length === 0 ? (
                      <li className="nav-item flex-fill">
                        <span style={{ color: 'red' }}>
                          {user?.role_level === 'outlet_user'
                            ? 'No assigned departments found for outlet user.'
                            : 'Failed to load departments or no departments available'}
                        </span>
                      </li>
                    ) : (
                      departments.map((department, index) => (
                        <li className="nav-item flex-fill" key={index}>
                          <button
                            className={`nav-link ${activeNavTab === department.department_name ? 'active bg-primary text-white' : 'text-dark'}`}
                            onClick={() => setActiveNavTab(department.department_name)}
                            role="tab"
                            style={{ border: 'none', borderRadius: '5px', padding: '8px 12px', fontSize: '14px', fontWeight: 500, textAlign: 'center' }}
                          >
                            {department.department_name}
                            {user?.role_level === 'outlet_user' && ' (Assigned)'}
                          </button>
                        </li>
                      ))
                    )}
                    {['Pickup', 'Quick Bill', 'Delivery'].map((tab, index) => (
                      <li className="nav-item flex-fill" key={index + departments.length}>
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
                    className="d-flex flex-column justify-content-start align-items-start rounded shadow-sm p-3 mt-3"
                  >
                    {loading ? (
                      <p className="text-center text-muted mb-0">Loading tables...</p>
                    ) : activeNavTab === 'ALL' ? (
                      <>
                        {departments.map((department, index) => {
                          const assignedTables = tableItems.filter(table =>
                            table && table.departmentid && Number(table.departmentid) === department.departmentid
                          );
                          return (
                            <div key={index}>
                              <p style={{ color: 'green', fontWeight: 'bold', margin: '10px 0 5px' }}>
                                {department.department_name}
                              </p>
                              <div className="d-flex flex-wrap gap-1">
                                {assignedTables.length > 0 ? (
                                  assignedTables.map((table, tableIndex) => (
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
                                  ))
                                ) : (
                                  <p className="text-center text-muted mb-0">
                                    No tables assigned to {department.department_name}.
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {departments.length === 0 && (
                          <p className="text-center text-muted mb-0">
                            No departments available. Please check department data.
                          </p>
                        )}
                      </>
                    ) : activeNavTab === 'abcd' || activeNavTab === 'qwert' ? (
                      <div>
                        <p style={{ color: 'green', fontWeight: 'bold', margin: '10px 0 5px' }}>Department {activeNavTab}</p>
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
                    filteredTables={filteredTables}
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
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                      onKeyPress={handleMobileKeyPress} // Add this line
                      onBlur={(e) => fetchCustomerByMobile(mobileNumber)}
                      className="form-control"
                      style={{
                        width: "150px",
                        height: "30px",
                        fontSize: "0.875rem",
                        padding: "0.25rem 0.5rem",
                      }}
                    />
                  </div>
                  <div className="d-flex align-items-center">
                    <input
                      type="text"
                      placeholder="Customer Name"
                      value={customerName}
                      readOnly // ✅ auto-fill, not editable
                      className="form-control"
                      style={{
                        width: "150px",
                        height: "30px",
                        fontSize: "0.875rem",
                        padding: "0.25rem 0.5rem",
                      }}
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
                  <div className="bg-white border rounded p-2">
                    <div className="d-flex justify-content-between"><span>Subtotal</span><span>{taxCalc.subtotal.toFixed(2)}</span></div>
                    {taxRates.cgst > 0 && (
                      <div className="d-flex justify-content-between"><span>CGST ({taxRates.cgst}%)</span><span>{taxCalc.cgstAmt.toFixed(2)}</span></div>
                    )}
                    {taxRates.sgst > 0 && (
                      <div className="d-flex justify-content-between"><span>SGST ({taxRates.sgst}%)</span><span>{taxCalc.sgstAmt.toFixed(2)}</span></div>
                    )}
                    {taxRates.igst > 0 && (
                      <div className="d-flex justify-content-between"><span>IGST ({taxRates.igst}%)</span><span>{taxCalc.igstAmt.toFixed(2)}</span></div>
                    )}
                    {taxRates.cess > 0 && (
                      <div className="d-flex justify-content-between"><span>CESS ({taxRates.cess}%)</span><span>{taxCalc.cessAmt.toFixed(2)}</span></div>
                    )}
                    <hr className="my-2" />
                    <div className="d-flex justify-content-between align-items-center bg-success text-white rounded p-1">
                      <span className="fw-bold">Grand Total</span>
                      <span className="fw-bold">{taxCalc.grandTotal.toFixed(2)}</span>
                    </div>
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

            <Modal show={showSavedKOTsModal} onHide={() => setShowSavedKOTsModal(false)} centered size="lg" onShow={async () => {
              try {
                const resp = await getSavedKOTs({ isBilled: 0 })
                const list = resp?.data || resp
                if (Array.isArray(list)) setSavedKOTs(list)
              } catch (err) {
                console.warn('getSavedKOTs modal load failed')
              }
            }}>
              <Modal.Header closeButton>
                <Modal.Title>Saved KOTs</Modal.Title>
              </Modal.Header>
              <Modal.Body style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {(!savedKOTs || savedKOTs.length === 0) ? (
                  <p className="text-center text-muted">No KOTs saved yet.</p>
                ) : (
                  <Table bordered hover>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>TxnID</th>
                        <th>TableID</th>
                        <th>Amount</th>
                        <th>OrderNo</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {savedKOTs.map((kot: any, index: number) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{kot.TxnID}</td>
                          <td>{kot.TableID ?? ''}</td>
                          <td>{kot.Amount}</td>
                          <td>{kot.orderNo || ''}</td>
                          <td>{kot.TxnDatetime}</td>
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

            <Modal
              show={showNewCustomerForm}
              onHide={handleCloseCustomerModal}
              centered
              size="lg"
              backdrop="static"
              keyboard={false}
            >
              <Modal.Header closeButton style={{ padding: '0.5rem', margin: 0 }} >
              </Modal.Header>
              <Modal.Body style={{ padding: '0px', maxHeight: '780px', overflowY: 'auto' }}>
                <AddCustomerModal />
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={handleCloseCustomerModal}>
                  Close
                </Button>
              </Modal.Footer>
            </Modal>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Order;