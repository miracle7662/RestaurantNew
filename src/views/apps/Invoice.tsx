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
  isBilled: number;
  isNCKOT: number;
  NCName: string;
  NCPurpose: string;
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
  departmentid?: number;
  outletid?: number;
}

interface DepartmentItem {
  departmentid: number;
  department_name: string;
  outletid: number;
}

const Order = () => {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
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
  const [showDiscountModal, setShowDiscountModal] = useState<boolean>(false);
  const [DiscPer, setDiscPer] = useState<number>(0);
  const [givenBy, setGivenBy] = useState<string>(user?.name || '');
  const [reason, setReason] = useState<string>('');
  const [DiscountType, setDiscountType] = useState<number>(0);
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [showTaxModal, setShowTaxModal] = useState<boolean>(false);
  const [showNCKOTModal, setShowNCKOTModal] = useState<boolean>(false);
  const [cgst, setCgst] = useState<string>('');
  const [sgst, setSgst] = useState<string>('');
  const [igst, setIgst] = useState<string>('');
  const [cess, setCess] = useState<string>('');
  const [ncName, setNcName] = useState<string>('');
  const [ncPurpose, setNcPurpose] = useState<string>('');
  const [showKOTPreview, setShowKOTPreview] = useState<boolean>(false); // Toggle KOT preview visibility
  const [formData, setFormData] = useState({
    show_store_name: true,
    show_kot_no_quick_bill: true,
    hide_table_name_quick_bill: false,
    show_order_id_quick_bill: true,
    show_online_order_otp: true,
    show_covers_as_guest: true,
    show_order_type_symbol: true,
    show_waiter: true,
    show_captain_username: true,
    show_username: true,
    show_terminal_username: true,
    customer_on_kot_dine_in: true,
    customer_on_kot_quick_bill: true,
    customer_kot_display_option: 'NAME_AND_MOBILE',
    show_item_price: true,
    modifier_default_option: true,
    show_alternative_item: true,
    show_kot_note: true,
    print_kot_both_languages: true,
    dine_in_kot_no: 'KITCHEN ORDER TICKET',
    show_new_order_tag: true,
    new_order_tag_label: 'New',
    show_running_order_tag: true,
    running_order_tag_label: 'Running',
  });

  // Fetch table management data
  const fetchTableManagement = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/tablemanagement', { headers: { 'Content-Type': 'application/json' } });
      if (res.ok) {
        const response = await res.json();
        if (response.success && Array.isArray(response.data)) {
          const formattedData = response.data.map((item: any) => ({ ...item, status: Number(item.status) }));
          setTableItems(formattedData);
          setFilteredTables(formattedData);
          setErrorMessage('');
        } else {
          setErrorMessage(response.message || 'No tables found.');
          setTableItems([]);
          setFilteredTables([]);
        }
      } else {
        setErrorMessage(`Failed to fetch tables: ${res.statusText}`);
        setTableItems([]);
        setFilteredTables([]);
      }
    } catch (err) {
      setErrorMessage('Failed to fetch tables.');
      setTableItems([]);
      setFilteredTables([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch customer by mobile
  const fetchCustomerByMobile = async (mobile: string) => {
    try {
      const res = await fetch(`http://localhost:3001/api/customer/by-mobile?mobile=${mobile}`, { headers: { 'Content-Type': 'application/json' } });
      if (res.ok) {
        const response = await res.json();
        if (response.customerid && response.name) setCustomerName(response.name);
        else setCustomerName('');
      } else {
        setCustomerName('');
      }
    } catch (err) {
      setCustomerName('');
    }
  };

  // Fetch departments
  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/table-department', { headers: { 'Content-Type': 'application/json' } });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          let formattedDepartments = data.data.map((item: any) => ({
            departmentid: item.departmentid,
            department_name: item.department_name,
            outletid: item.outletid,
          }));
          if (user?.role_level === 'outlet_user' && user.outletid) {
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

  // Fetch outlets data
  const fetchOutletsData = async () => {
    if (!user || !user.id) {
      setErrorMessage('User not logged in.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setErrorMessage('');
      await fetchOutletsForDropdown(user, setOutlets, setLoading);
    } catch (error: any) {
      setErrorMessage('Failed to fetch outlets.');
      setOutlets([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch outlet settings
  const fetchOutletSettings = async () => {
    try {
      const res = await fetch(`http://localhost:3001/api/outlet-settings/${user?.outletid}`, { headers: { 'Content-Type': 'application/json' } });
      if (res.ok) {
        const response = await res.json();
        setFormData(response.data || formData);
      }
    } catch (err) {
      console.error('Failed to fetch outlet settings:', err);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchOutletsData();
      await fetchDepartments();
      await fetchTableManagement();
      await fetchOutletSettings();
    };
    fetchData();
  }, [user?.id, user?.hotelid, user?.outletid, user?.role_level]);

  useEffect(() => {
    if (mobileNumber.length >= 10) fetchCustomerByMobile(mobileNumber);
    else setCustomerName('');
  }, [mobileNumber]);

  useEffect(() => {
    if (itemListRef.current) itemListRef.current.scrollTop = itemListRef.current.scrollHeight;
  }, [items]);

  useEffect(() => {
    (async () => {
      try {
        const resp = await getSavedKOTs({ isBilled: 0 });
        const list = resp?.data || resp;
        if (Array.isArray(list)) setSavedKOTs(list);
      } catch (err) {
        console.warn('getSavedKOTs failed');
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

  useEffect(() => {
    let filtered: TableItem[] = [];
    if (!Array.isArray(tableItems)) {
      setFilteredTables([]);
      return;
    }
    if (activeNavTab === 'ALL') filtered = tableItems;
    else {
      const selectedDepartment = departments.find(d => d.department_name === activeNavTab);
      if (selectedDepartment) {
        filtered = tableItems.filter(table =>
          Number(table.departmentid) === selectedDepartment.departmentid || table.isCommonToAllDepartments
        );
      } else filtered = [];
    }
    setFilteredTables(filtered);
  }, [activeNavTab, tableItems, departments]);

  useEffect(() => {
    if (searchTable) {
      const isValidTable = filteredTables.some(table =>
        table?.table_name?.toLowerCase() === searchTable.toLowerCase()
      );
      setIsTableInvalid(!isValidTable);
      setInvalidTable(!isValidTable ? searchTable : '');
    } else {
      setIsTableInvalid(false);
      setInvalidTable('');
    }
  }, [searchTable, filteredTables]);

  useEffect(() => {
    const selectedDepartment = departments.find(d => d.department_name === activeNavTab) || null;
    if (selectedDepartment) {
      setSelectedDeptId(Number(selectedDepartment.departmentid));
      setSelectedOutletId(Number(selectedDepartment.outletid));
    } else {
      setSelectedDeptId(null);
      setSelectedOutletId(null);
    }
  }, [activeNavTab, departments]);

  useEffect(() => {
    if (!selectedDeptId) {
      setTaxRates({ cgst: 0, sgst: 0, igst: 0, cess: 0 });
      return;
    }
    (async () => {
      try {
        const resp = await getTaxesByOutletAndDepartment({ outletid: selectedOutletId ?? undefined, departmentid: selectedDeptId });
        if (resp?.success && resp?.data?.taxes) {
          setTaxRates({
            cgst: Number(resp.data.taxes.cgst) || 0,
            sgst: Number(resp.data.taxes.sgst) || 0,
            igst: Number(resp.data.taxes.igst) || 0,
            cess: Number(resp.data.taxes.cess) || 0,
          });
        } else {
          setTaxRates({ cgst: 0, sgst: 0, igst: 0, cess: 0 });
        }
      } catch (e) {
        setTaxRates({ cgst: 0, sgst: 0, igst: 0, cess: 0 });
      }
    })();
  }, [selectedDeptId, selectedOutletId]);

  useEffect(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const cgstAmt = (subtotal * taxRates.cgst) / 100;
    const sgstAmt = (subtotal * taxRates.sgst) / 100;
    const igstAmt = (subtotal * taxRates.igst) / 100;
    const cessAmt = (subtotal * taxRates.cess) / 100;
    const grandTotal = subtotal + cgstAmt + sgstAmt + igstAmt + cessAmt;
    setTaxCalc({ subtotal, cgstAmt, sgstAmt, igstAmt, cessAmt, grandTotal });
  }, [items, taxRates]);

  const handleTableClick = (seat: string) => {
    setSelectedTable(seat);
    setItems([]);
    setShowOrderDetails(true);
    setInvalidTable('');
    const selectedTableRecord = filteredTables.find(t => t?.table_name === seat) || tableItems.find(t => t?.table_name === seat);
    if (selectedTableRecord) {
      setSelectedDeptId(Number(selectedTableRecord.departmentid) || null);
      setSelectedOutletId(Number(selectedTableRecord.outletid) || null);
    }
  };

  const handleTabClick = (tab: string) => {
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

  const handleCountryCodeClick = () => setShowCountryOptions(!showCountryOptions);
  const handleCountryCodeSelect = (code: string) => {
    setSelectedCountryCode(code);
    setShowCountryOptions(false);
  };

  const handleAddCustomerClick = () => setShowNewCustomerForm(true);
  const handleCloseCustomerModal = () => setShowNewCustomerForm(false);

  const handleIncreaseQty = (itemId: number) => setItems(items.map(item => (item.id === itemId ? { ...item, qty: item.qty + 1 } : item)));
  const handleDecreaseQty = (itemId: number) => {
    const updatedItems = items.map(item => (item.id === itemId ? { ...item, qty: item.qty - 1 } : item));
    setItems(updatedItems.filter(item => item.qty > 0));
  };

  const handleTableSearchInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const inputTable = tableSearchInput.trim();
      if (inputTable) {
        const isValidTable = filteredTables.some(table => table?.table_name?.toLowerCase() === inputTable.toLowerCase());
        if (isValidTable) {
          handleTableClick(inputTable);
          setTableSearchInput('');
        } else {
          toast.error('Invalid table name.');
        }
      }
    }
  };

  const handleMobileKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (mobileNumber.trim()) fetchCustomerByMobile(mobileNumber.trim());
    }
  };

  const getKOTLabel = () => {
    switch (activeTab) {
      case 'Dine-in': return `KOT 1${selectedTable ? ` - Table ${selectedTable}` : ''}`;
      case 'Pickup': return 'Pickup Order';
      case 'Delivery': return 'Delivery Order';
      case 'Quick Bill': return 'Quick Bill';
      case 'Order/KOT': return 'Order/KOT';
      case 'Billing': return 'Billing';
      default: return 'KOT 1';
    }
  };

  const handleBackToTables = () => setShowOrderDetails(false);

  const handlePrintKOT = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow && document.getElementById('kot-preview')) {
      printWindow.document.head.innerHTML = `
        ${document.head.innerHTML}
        <style>
          @media print { body { margin: 0; padding: 20px; } #kot-preview { position: static; width: 100%; height: auto; margin: 0; padding: 0; } .card { border: none; box-shadow: none; } .card-header { background: none; border-bottom: 1px solid #ccc; } .card-body { padding: 10px; } .no-print, .btn { display: none !important; } }
        </style>
      `;
      printWindow.document.body.appendChild(document.getElementById('kot-preview')!.cloneNode(true));
      printWindow.print();
    } else {
      toast.error('Failed to open print window.');
    }
  };

  const handlePrintAndSaveKOT = async () => {
    if (items.length === 0) return;
    setLoading(true);
    try {
      const orderNo = `${selectedTable || 'TB'}-${Date.now()}`;
      const selectedTableRecord = filteredTables.find(t => t?.table_name === selectedTable) || tableItems.find(t => t?.table_name === selectedTable);
      const resolvedTableId = selectedTableRecord ? Number(selectedTableRecord.tablemanagementid) : null;
      const resolvedDeptId = selectedTableRecord ? Number(selectedTableRecord.departmentid) || undefined : undefined;
      const resolvedOutletId = selectedTableRecord ? Number(selectedTableRecord.outletid) || (user?.outletid ? Number(user.outletid) : null) : null;
      const userId = user?.id || null;
      const hotelId = user?.hotelid || null;

      const details = items.map(i => {
        const lineSubtotal = Number(i.price) * Number(i.qty);
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
          outletid: resolvedOutletId,
          CGST: cgstPer,
          CGST_AMOUNT: Number(cgstAmt.toFixed(2)),
          SGST: sgstPer,
          SGST_AMOUNT: Number(sgstAmt.toFixed(2)),
          IGST: igstPer,
          IGST_AMOUNT: Number(igstAmt.toFixed(2)),
          CESS: cessPer,
          CESS_AMOUNT: Number(cessAmt.toFixed(2)),
          HotelID: hotelId,
          isBilled: i.isBilled || 0,
          isNCKOT: i.isNCKOT || 0,
          NCName: i.NCName || '',
          NCPurpose: i.NCPurpose || '',
        };
      });
      const discountAmount = DiscountType === 0 ? (taxCalc.grandTotal * (DiscPer > 0 ? DiscPer : 0)) / 100 : (DiscPer > 0 ? DiscPer : 0);
      const netAmount = taxCalc.grandTotal - discountAmount;

      const payload = {
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
        Amount: Number(netAmount.toFixed(2)),
        DiscPer: DiscountType === 0 ? (DiscPer > 0 ? Number(DiscPer.toFixed(2)) : 0) : 0,
        Discount: DiscountType === 1 ? (DiscPer > 0 ? Number(DiscPer.toFixed(2)) : 0) : 0,
        DiscountType,
        GivenBy: givenBy,
        Reason: reason || null,
        outletid: resolvedOutletId,
        UserId: userId,
        HotelID: hotelId,
      };
      const resp = await createBill(payload);
      if (resp?.success) {
        toast.success('KOT saved');
        handlePrintKOT();
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

  const handleApplyDiscount = () => {
    if (DiscPer < 0.5 || DiscPer > 100 || isNaN(DiscPer)) {
      toast.error('Discount percentage must be between 0.5% and 100%');
      return;
    }
    if (DiscPer > 20 && user?.role_level !== 'admin') {
      toast.error('Discount > 20% requires manager approval');
      return;
    }
    const discountAmount = (taxCalc.grandTotal * DiscPer) / 100;
    const newGrandTotal = taxCalc.grandTotal - discountAmount;
    setTaxCalc(prev => ({ ...prev, grandTotal: newGrandTotal }));
    setShowDiscountModal(false);
    toast.success(`Discount ${DiscPer}% applied by ${givenBy}`);
    setReason('');
  };

  const handleDiscountKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setShowDiscountModal(false);
    if (e.key === 'Enter') handleApplyDiscount();
  };

  const handleOpenTaxModal = () => {
    setCgst(taxRates.cgst.toString());
    setSgst(taxRates.sgst.toString());
    setIgst(taxRates.igst.toString());
    setCess(taxRates.cess.toString());
    setShowTaxModal(true);
  };

  const handleSaveTax = () => {
    setTaxRates({
      cgst: parseFloat(cgst) || 0,
      sgst: parseFloat(sgst) || 0,
      igst: parseFloat(igst) || 0,
      cess: parseFloat(cess) || 0,
    });
    setShowTaxModal(false);
  };

  const handleSaveNCKOT = () => {
    setItems(prevItems =>
      prevItems.map(item => ({ ...item, isNCKOT: 1, NCName: ncName, NCPurpose: ncPurpose }))
    );
    setNcName('');
    setNcPurpose('');
    setShowNCKOTModal(false);
  };

  return (
    <div className="container-fluid p-0 m-0" style={{ height: '100vh' }}>
      {errorMessage && <div className="alert alert-danger text-center">{errorMessage}</div>}
      <style>
        {`
          @media (max-width: 767px) {
            .main-container { flex-direction: column; height: auto; min-height: 100vh; }
            .table-container { width: 100%; }
            .billing-panel { position: static; width: 100%; max-width: 100%; height: auto; margin-top: 1rem; margin-left: 0; padding: 0.5rem; }
            .billing-panel .bg-white.border.rounded { font-size: 0.75rem; }
            .billing-panel .btn { font-size: 0.75rem; padding: 0.25rem 0.5rem; }
            .billing-panel input { font-size: 0.75rem; height: 25px; }
            .modal-table-container { font-size: 0.75rem; }
            .modal-table-container th, .modal-table-container td { padding: 0.5rem; }
            .form-row { grid-template-columns: 1fr; gap: 0.5rem; }
            .item-list-container { max-height: 200px; }
            .billing-panel-inner { height: auto; min-height: 100%; }
            .billing-panel-bottom { position: sticky; bottom: 0; background: #f8f9fa; padding-bottom: 0.5rem; }
            .kot-preview-container { width: 100%; margin-top: 1rem; }
          }
          @media (min-width: 768px) {
            .main-container { flex-direction: row; height: 100vh; }
            .billing-panel { width: 400px; max-width: 400px; height: 92vh; margin-left: auto; position: sticky; top: 0; z-index: 1003; }
            .form-row { grid-template-columns: repeat(2, 1fr); gap: 1rem; }
            .item-list-container { max-height: calc(92vh - 300px); }
            .billing-panel-inner { height: 92vh; }
            .billing-panel-bottom { position: sticky; bottom: 0; padding-bottom: 0.5rem; }
            .kot-preview-container { width: 400px; margin-left: 1rem; }
          }
          @media (min-width: 992px) { .form-row { grid-template-columns: repeat(4, 1fr); } }
          .billing-panel-inner { display: flex; flex-direction: column; }
          .item-list-container { display: flex; flex-direction: column; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #888 #f1f1f1; flex-grow: 1; }
          .item-list-container::-webkit-scrollbar { width: 8px; }
          .item-list-container::-webkit-scrollbar-thumb { background: #888; border-radius: 4px; }
          .item-list-container::-webkit-scrollbar-thumb:hover { background: #555; }
          @media print {
            body * { visibility: hidden; }
            #kot-preview, #kot-preview * { visibility: visible; }
            #kot-preview { position: absolute; top: 0; left: 0; width: 100%; max-width: 100%; height: auto; margin: 0; padding: 0.5rem; }
            .card { border: none; box-shadow: none; }
            .card-header { background: none; border-bottom: 1px solid #ccc; }
            .card-body { padding: 10px; }
            .no-print, .btn { display: none; }
            .billing-panel, .billing-panel * { visibility: hidden; }
          }
          .no-spinner::-webkit-inner-spin-button, .no-spinner::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
          .no-spinner { -moz-appearance: textfield; appearance: none; }
          .kot-preview-container { display: ${showKOTPreview ? 'block' : 'none'}; }
        `}
      </style>
      <div className="main-container d-flex flex-column flex-md-row">
        <div className="table-container flex-grow-1 me-md-3">
          {activeTab === 'Dine-in' && !showOrderDetails && (
            <div>
              <ul className="nav nav-tabs rounded shadow-sm mb-3" style={{ padding: '5px', display: 'flex', gap: '5px', alignItems: 'center' }}>
                <li className="nav-item">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Enter Table"
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
                    style={{ border: 'none', borderRadius: '5px', padding: '8px 12px', fontSize: '14px', fontWeight: 500, textAlign: 'center' }}
                  >
                    ALL
                  </button>
                </li>
                {loading ? (
                  <li className="nav-item flex-fill"><span>Loading departments...</span></li>
                ) : departments.length === 0 ? (
                  <li className="nav-item flex-fill">
                    <span style={{ color: 'red' }}>{user?.role_level === 'outlet_user' ? 'No assigned departments.' : 'Failed to load departments.'}</span>
                  </li>
                ) : (
                  departments.map((department, index) => (
                    <li className="nav-item flex-fill" key={index}>
                      <button
                        className={`nav-link ${activeNavTab === department.department_name ? 'active bg-primary text-white' : 'text-dark'}`}
                        onClick={() => setActiveNavTab(department.department_name)}
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
                      style={{ border: 'none', borderRadius: '5px', padding: '8px 12px', fontSize: '14px', fontWeight: 500, textAlign: 'center' }}
                    >
                      {tab}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="d-flex flex-column justify-content-start align-items-start rounded shadow-sm p-3 mt-3">
                {loading ? (
                  <p className="text-center text-muted mb-0">Loading tables...</p>
                ) : activeNavTab === 'ALL' ? (
                  <>
                    {departments.map((department, index) => {
                      const assignedTables = tableItems.filter(table => Number(table.departmentid) === department.departmentid);
                      return (
                        <div key={index}>
                          <p style={{ color: 'green', fontWeight: 'bold', margin: '10px 0 5px' }}>{department.department_name}</p>
                          <div className="d-flex flex-wrap gap-1">
                            {assignedTables.length > 0 ? (
                              assignedTables.map((table, tableIndex) => (
                                table.table_name && (
                                  <div key={tableIndex} className="p-1">
                                    <button
                                      className={`btn ${selectedTable === table.table_name ? 'btn-success' : 'btn-outline-success'}`}
                                      style={{ width: '90px', height: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                                      onClick={() => handleTableClick(table.table_name)}
                                    >
                                      {table.table_name}
                                    </button>
                                  </div>
                                )
                              ))
                            ) : (
                              <p className="text-center text-muted mb-0">No tables assigned to {department.department_name}.</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {departments.length === 0 && <p className="text-center text-muted mb-0">No departments available.</p>}
                  </>
                ) : filteredTables.length > 0 ? (
                  <div className="d-flex flex-wrap gap-1">
                    {filteredTables.map((table, index) => (
                      table.table_name && (
                        <div key={index} className="p-1">
                          <button
                            className={`btn ${selectedTable === table.table_name ? 'btn-success' : 'btn-outline-success'}`}
                            style={{ width: '90px', height: '80px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                            onClick={() => handleTableClick(table.table_name)}
                          >
                            {table.table_name}
                          </button>
                        </div>
                      )
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted mb-0">No tables available for {activeNavTab}.</p>
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
                setSelectedDeptId={setSelectedDeptId}
                setSelectedOutletId={setSelectedOutletId}
              />
            </div>
          )}
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
              <div className="rounded border fw-bold text-black" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '0.5rem' }}>
                <span style={{ textAlign: 'left' }}>Item Name</span>
                <span className="text-center">Qty</span>
                <span className="text-center">Amount</span>
              </div>
            </div>
            <div className="border rounded item-list-container" ref={itemListRef}>
              {items.length === 0 ? (
                <p className="text-center text-muted mb-0">No items added</p>
              ) : (
                items.map((item, index) => (
                  <div key={item.id} className="border-bottom" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '0.25rem', alignItems: 'center' }}>
                    <span style={{ textAlign: 'left' }}>{item.name}</span>
                    <div className="text-center d-flex justify-content-center align-items-center gap-2">
                      <button className="btn btn-danger btn-sm" style={{ padding: '0 5px', lineHeight: '1' }} onClick={() => handleDecreaseQty(item.id)}>−</button>
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => {
                          const newQty = parseInt(e.target.value) || 0;
                          if (newQty <= 0) setItems(items.filter(i => i.id !== item.id));
                          else setItems(items.map(i => (i.id === item.id ? { ...i, qty: newQty } : i)));
                        }}
                        className="border rounded text-center no-spinner"
                        style={{ width: '40px', height: '16px', fontSize: '0.75rem', padding: '0' }}
                        min="0"
                        max="999"
                      />
                      <button className="btn btn-success btn-sm" style={{ padding: '0 5px', lineHeight: '1' }} onClick={() => handleIncreaseQty(item.id)}>+</button>
                    </div>
                    <div className="text-center">
                      <div>{(item.price * item.qty).toFixed(2)}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6c757d', width: '50px', height: '16px', margin: '0 auto' }}>({item.price.toFixed(2)})</div>
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
                    style={{ width: '50px', height: '30px', fontSize: '0.875rem', cursor: 'pointer' }}
                    onClick={handleCountryCodeClick}
                  >
                    {selectedCountryCode}
                    {showCountryOptions && (
                      <div className="position-absolute border rounded shadow-sm" style={{ top: '100%', left: 0, width: '50px', zIndex: 1004 }}>
                        {['+91', '+1', '+44'].map(code => (
                          <div key={code} className="text-center p-1" style={{ cursor: 'pointer' }} onClick={() => handleCountryCodeSelect(code)}>{code}</div>
                        ))}
                      </div>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Mobile No"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    onKeyPress={handleMobileKeyPress}
                    onBlur={() => fetchCustomerByMobile(mobileNumber)}
                    className="form-control"
                    style={{ width: '150px', height: '30px', fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                  />
                </div>
                <div className="d-flex align-items-center">
                  <input
                    type="text"
                    placeholder="Customer Name"
                    value={customerName}
                    readOnly
                    className="form-control"
                    style={{ width: '150px', height: '30px', fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                  />
                  <button className="btn btn-outline-primary ms-1" style={{ height: '30px', padding: '0 8px', fontSize: '0.875rem' }} onClick={handleAddCustomerClick} title="Add Customer">+</button>
                </div>
              </div>
              <div className="d-flex flex-column flex-md-row gap-2 mt-2">
                {(activeTab === 'Delivery' || activeTab === 'Billing') && (
                  <input type="text" placeholder="Customer Address" className="form-control" style={{ width: '150px', height: '30px', fontSize: '0.875rem', padding: '0.25rem 0.5rem' }} />
                )}
                <input type="text" placeholder="KOT Note" className="form-control" style={{ width: '150px', height: '30px', fontSize: '0.875rem', padding: '0.25rem 0.5rem' }} />
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
                    {isTableInvalid && <div className="text-danger small text-center mt-1">Invalid Table</div>}
                  </div>
                )}
                <div className="d-flex align-items-center ms-2" style={{ position: 'relative', overflow: 'visible' }}>
                  <Button
                    variant="primary"
                    className="rounded-circle d-flex justify-content-center align-items-center"
                    style={{ width: '36px', height: '36px', padding: '0', zIndex: 1001 }}
                    onClick={() => setShowOptions(true)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Button>
                  {showOptions && (
                    <>
                      <div className="d-flex flex-row gap-3" style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#eef3ff', borderRadius: '30px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', padding: '10px 15px', minWidth: '220px', zIndex: 1000 }}>
                        <Button variant="primary" className="rounded-circle p-0 d-flex justify-content-center align-items-center" style={{ width: '32px', height: '32px' }} onClick={() => { setShowOptions(false); handleOpenTaxModal(); }} title="Tax">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M8.5 1a.5.5 0 0 0-1 0v1.07a3.001 3.001 0 0 0-2.995 2.824L4.5 5.9v.2a.5.5 0 0 0 1 0v-.2a2 2 0 1 1 2 1.995v2.11a3.001 3.001 0 0 0-2.995 2.824L5.5 12.9v.2a.5.5 0 0 0 1 0v-.2a2 2 0 1 1 2-1.995V2.07z" />
                          </svg>
                        </Button>
                        <Button variant="secondary" className="rounded-circle p-0 d-flex justify-content-center align-items-center" style={{ width: '32px', height: '32px' }} onClick={() => { setShowOptions(false); setShowNCKOTModal(true); }} title="NCKOT">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5z" />
                            <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3-.5a.5.5 0 0 1-.5-.5V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4h-3z" />
                          </svg>
                        </Button>
                        <Button variant="success" className="rounded-circle p-0 d-flex justify-content-center align-items-center" style={{ width: '32px', height: '32px' }} onClick={() => { setShowOptions(false); setShowDiscountModal(true); }} title="Discount">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M13.442 2.558a1.5 1.5 0 1 1-2.121 2.121l-6.35 6.35a1.5 1.5 0 1 1-2.122-2.12l6.35-6.35a1.5 1.5 0 0 1 2.121 0zM5.5 5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm5 6a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
                          </svg>
                        </Button>
                      </div>
                      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0)', zIndex: 999 }} onClick={() => setShowOptions(false)} />
                    </>
                  )}
                </div>
              </div>
              <div className="mt-1">
                <div className="bg-white border rounded p-2">
                  <div className="d-flex justify-content-between"><span>Subtotal</span><span>{taxCalc.subtotal.toFixed(2)}</span></div>
                  {DiscPer > 0 && <div className="d-flex justify-content-between"><span>Discount ({DiscPer}%)</span><span>{((taxCalc.grandTotal * DiscPer) / 100).toFixed(2)}</span></div>}
                  <hr className="my-2" />
                  <div className="d-flex justify-content-between align-items-center bg-success text-white rounded p-1">
                    <span className="fw-bold">Grand Total</span>
                    <div><span className="fw-bold me-2">{(taxCalc.grandTotal - (taxCalc.grandTotal * (DiscPer || 0) / 100)).toFixed(2)}</span></div>
                  </div>
                </div>
                <div className="d-flex justify-content-center gap-2 mt-2">
                  <button className="btn btn-dark rounded" onClick={handlePrintAndSaveKOT} disabled={items.length === 0 || !!invalidTable}>Print & Save KOT</button>
                  <button className="btn btn-info rounded" onClick={() => setShowKOTPreview(!showKOTPreview)}>Toggle KOT Preview</button>
                  <button className="btn btn-info rounded" onClick={() => setShowSavedKOTsModal(true)}>View Saved KOTs</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="kot-preview-container">
          <div className="card shadow-sm h-100" id="kot-preview">
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0 text-center fw-bold">KOT Preview</h5>
              <Button variant="light" className="btn-icon btn-sm no-print" onClick={handlePrintKOT} title="Print KOT">
                <i className="fi fi-rr-print"></i>
              </Button>
            </div>
            <div className="card-body" style={{ fontSize: '0.85rem', overflow: 'hidden' }}>
              {formData.show_store_name && (
                <div className="text-center mb-3">
                  <h6 className="fw-bold mb-1">{user?.outlet_name || 'Restaurant Name'}</h6>
                  <div className="small text-muted">{user?.outlet_address || 'Kolhapur Road Kolhapur 416416'}</div>
                  <div className="small text-muted">{user?.outlet_email || 'sangli@gmail.com'}</div>
                </div>
              )}
              {formData.show_store_name && <div style={{ borderBottom: '1px dashed #ccc', margin: '10px 0' }}></div>}
              <div className="text-center mb-3">
                <h6 className="fw-bold">
                  {formData.dine_in_kot_no || getKOTLabel()}
                  {formData.show_new_order_tag && formData.new_order_tag_label && <span className="ms-2 badge bg-primary">{formData.new_order_tag_label}</span>}
                  {formData.show_running_order_tag && formData.running_order_tag_label && <span className="ms-2 badge bg-secondary">{formData.running_order_tag_label}</span>}
                </h6>
              </div>
              <div className="row mb-2">
                <div className="col-6">
                  {(formData.show_kot_no_quick_bill || !formData.hide_table_name_quick_bill) && (
                    <small><strong>KOT No:</strong> {`KOT${selectedTable || '001'}`}</small>
                  )}
                  {formData.show_order_id_quick_bill && (
                    <small className="d-block"><strong>Order ID:</strong> {`ORD${Date.now()}`}</small>
                  )}
                  {formData.show_online_order_otp && (
                    <small className="d-block"><strong>OTP:</strong> {Math.floor(1000 + Math.random() * 9000)}</small>
                  )}
                </div>
                <div className="col-6 text-end">
                  {!formData.hide_table_name_quick_bill && (
                    <small><strong>Table:</strong> {selectedTable || 'T-05'}</small>
                  )}
                  {formData.show_covers_as_guest && (
                    <small className="d-block"><strong>Guests:</strong> {items.length > 0 ? items.reduce((sum, item) => sum + item.qty, 0) : 4}</small>
                  )}
                </div>
              </div>
              <div className="row mb-2">
                <div className="col-6">
                  <small><strong>Date:</strong> {new Date().toLocaleDateString()}</small>
                </div>
                <div className="col-6 text-end">
                  <small><strong>Time:</strong> {new Date().toLocaleTimeString()}</small>
                </div>
              </div>
              <div className="row mb-2">
                <div className="col-6">
                  <small><strong>Order Type:</strong> {activeTab} {formData.show_order_type_symbol && <span>(🍽️)</span>}</small>
                </div>
                <div className="col-6 text-end">
                  {formData.show_waiter && <small><strong>Waiter:</strong> {user?.name || 'John'}</small>}
                  {formData.show_captain_username && <small className="d-block"><strong>Captain:</strong> {user?.captain || 'CaptainJane'}</small>}
                  {formData.show_username && <small className="d-block"><strong>Username:</strong> {user?.username || 'User123'}</small>}
                  {formData.show_terminal_username && <small className="d-block"><strong>Terminal:</strong> {user?.terminal || 'Term01'}</small>}
                </div>
              </div>
              {(formData.customer_on_kot_dine_in || formData.customer_on_kot_quick_bill) && formData.customer_kot_display_option !== 'DISABLED' && (
                <>
                  <div style={{ borderBottom: '1px dashed #ccc', margin: '10px 0' }}></div>
                  <div className="mb-2">
                    <small><strong>Customer:</strong> {customerName || 'John Doe'}</small>
                    {formData.customer_kot_display_option === 'NAME_AND_MOBILE' && (
                      <small className="d-block"><strong>Mobile:</strong> {mobileNumber || '+91 9876543210'}</small>
                    )}
                  </div>
                </>
              )}
              <div style={{ borderBottom: '1px dashed #ccc', margin: '10px 0' }}></div>
              <div className="row fw-bold small pb-1 mb-2" style={{ borderBottom: '1px solid #dee2e6' }}>
                <div className="col-1">#</div>
                <div className="col-4">Item Name</div>
                <div className="col-2 text-center">Qty</div>
                <div className="col-2 text-end">Rate</div>
                {formData.show_item_price && <div className="col-3 text-end">Amount</div>}
              </div>
              {items.map((item, index) => (
                <div className="row small mb-1" key={item.id}>
                  <div className="col-1">{index + 1}</div>
                  <div className="col-4">
                    {item.name}
                    {formData.modifier_default_option && item.NCName && <small className="d-block text-muted">{item.NCName}</small>}
                    {formData.show_alternative_item && item.NCPurpose && <small className="d-block text-muted">{item.NCPurpose}</small>}
                  </div>
                  <div className="col-2 text-center">{item.qty}</div>
                  <div className="col-2 text-end">{item.price.toFixed(2)}</div>
                  {formData.show_item_price && <div className="col-3 text-end">{(item.price * item.qty).toFixed(2)}</div>}
                </div>
              ))}
              <div style={{ borderBottom: '1px dashed #ccc', margin: '10px 0' }}></div>
              <div className="row fw-bold mb-2">
                <div className="col-8 text-end"><small>Total Items: {items.reduce((sum, item) => sum + item.qty, 0)}</small></div>
                {formData.show_item_price && <div className="col-4 text-end"><small>₹ {taxCalc.subtotal.toFixed(2)}</small></div>}
              </div>
              {formData.show_kot_note && (
                <>
                  <div style={{ borderBottom: '1px dashed #ccc', margin: '10px 0' }}></div>
                  <div className="mb-2">
                    <small><strong>KOT Note:</strong></small>
                    <br />
                    <small className="text-muted fst-italic">Extra spicy, no onions</small>
                  </div>
                </>
              )}
              <div style={{ borderBottom: '1px dashed #ccc', margin: '10px 0' }}></div>
              <div className="text-center mt-3">
                <small className="text-muted">Thank You!</small>
                <br />
                <small className="text-muted">Please prepare the order</small>
              </div>
              {formData.print_kot_both_languages && (
                <>
                  <div style={{ borderBottom: '1px dashed #ccc', margin: '10px 0' }}></div>
                  <div className="text-center">
                    <small className="fw-bold">रसोई आदेश टिकट</small>
                    <br />
                    {items.map((item, index) => <small key={index} className="d-block">{item.name}: {item.qty}</small>)}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <Modal show={showSavedKOTsModal} onHide={() => setShowSavedKOTsModal(false)} centered size="lg" onShow={async () => {
        try {
          const resp = await getSavedKOTs({ isBilled: 0 });
          const list = resp?.data || resp;
          if (Array.isArray(list)) setSavedKOTs(list);
        } catch (err) {
          console.warn('getSavedKOTs modal load failed');
        }
      }}>
        <Modal.Header closeButton><Modal.Title>Saved KOTs</Modal.Title></Modal.Header>
        <Modal.Body style={{ maxHeight: '500px', overflowY: 'auto' }}>
          {!savedKOTs || savedKOTs.length === 0 ? (
            <p className="text-center text-muted">No KOTs saved yet.</p>
          ) : (
            <Table bordered hover>
              <thead><tr><th>#</th><th>TxnID</th><th>TableID</th><th>Amount</th><th>OrderNo</th><th>Date</th></tr></thead>
              <tbody>{savedKOTs.map((kot: any, index: number) => (
                <tr key={index}>
                  <td>{index + 1}</td><td>{kot.TxnID}</td><td>{kot.TableID ?? ''}</td><td>{kot.Amount}</td><td>{kot.orderNo || ''}</td><td>{kot.TxnDatetime}</td>
                </tr>
              ))}</tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer><Button variant="secondary" onClick={() => setShowSavedKOTsModal(false)}>Close</Button></Modal.Footer>
      </Modal>
      <Modal show={showDiscountModal} onHide={() => setShowDiscountModal(false)} centered onShow={() => {
        const discountInput = document.getElementById('discountInput') as HTMLInputElement;
        if (discountInput) discountInput.focus();
      }}>
        <Modal.Header closeButton><Modal.Title>Apply Discount</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label className="form-label">Discount Type</label>
            <select className="form-control" value={DiscountType} onChange={(e) => setDiscountType(Number(e.target.value))}>
              <option value={0}>Percentage (0.5% - 100%)</option>
              <option value={1}>Amount</option>
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="discountInput" className="form-label">{DiscountType === 0 ? 'Discount Percentage (0.5% - 100%)' : 'Discount Amount'}</label>
            <input
              type="number"
              id="discountInput"
              className="form-control"
              value={DiscPer}
              onChange={(e) => setDiscPer(parseFloat(e.target.value) || 0)}
              onKeyDown={handleDiscountKeyDown}
              step={DiscountType === 0 ? "0.5" : "0.01"}
              min={DiscountType === 0 ? "0.5" : "0"}
              max={DiscountType === 0 ? "100" : ""}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="givenBy" className="form-label">Given By</label>
            <input type="text" id="givenBy" className="form-control" value={givenBy} readOnly={user?.role_level !== 'admin'} onChange={(e) => setGivenBy(e.target.value)} />
          </div>
          <div className="mb-3">
            <label htmlFor="reason" className="form-label">Reason (Optional)</label>
            <textarea id="reason" className="form-control" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDiscountModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleApplyDiscount}>Apply</Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showTaxModal} onHide={() => setShowTaxModal(false)} centered size="xl" backdrop="static" keyboard={false}>
  <Modal.Header closeButton><Modal.Title>View Tax Rates</Modal.Title></Modal.Header>
  <Modal.Body>
    <div>
      <h6>Tax Summary</h6>
      <div style={{ overflowX: 'auto' }}>
        <table className="table table-bordered text-center" style={{ minWidth: '800px', width: '100%' }}>
          <thead>
            <tr>
              <th>Subtotal</th>
              {taxRates.cgst > 0 && <th>CGST ({taxRates.cgst}%)</th>}
              {taxRates.sgst > 0 && <th>SGST ({taxRates.sgst}%)</th>}
              {taxRates.igst > 0 && <th>IGST ({taxRates.igst}%)</th>}
              {taxRates.cess > 0 && <th>CESS ({taxRates.cess}%)</th>}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{taxCalc.subtotal.toFixed(2)}</td>
              {taxRates.cgst > 0 && <td>{taxCalc.cgstAmt.toFixed(2)}</td>}
              {taxRates.sgst > 0 && <td>{taxCalc.sgstAmt.toFixed(2)}</td>}
              {taxRates.igst > 0 && <td>{taxCalc.igstAmt.toFixed(2)}</td>}
              {taxRates.cess > 0 && <td>{taxCalc.cessAmt.toFixed(2)}</td>}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowTaxModal(false)}>Cancel</Button>
    <Button variant="primary" onClick={handleSaveTax}>Save</Button>
  </Modal.Footer>
</Modal>
      <Modal show={showNCKOTModal} onHide={() => setShowNCKOTModal(false)} centered>
        <Modal.Header closeButton><Modal.Title>NCKOT</Modal.Title></Modal.Header>
        <Modal.Body>
          <div className="mb-3"><label>Name</label><input type="text" className="form-control" value={ncName} onChange={(e) => setNcName(e.target.value)} /></div>
          <div className="mb-3"><label>Purpose</label><input type="text" className="form-control" value={ncPurpose} onChange={(e) => setNcPurpose(e.target.value)} /></div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNCKOTModal(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSaveNCKOT}>Save</Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Order;