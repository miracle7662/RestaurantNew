import { useState, useEffect, useRef, useCallback } from "react";
import { Button, Modal, Table } from "react-bootstrap";
import OrderDetails from "./OrderDetails";
import { fetchOutletsForDropdown } from "@/utils/commonfunction";
import { useAuthContext } from "@/common";
import { getUnbilledItemsByTable } from "@/common/api/orders";
import { OutletData } from "@/common/api/outlet";
import AddCustomerModal from "./Customers";
import { toast } from "react-hot-toast";
import { createBill, createKOT, getSavedKOTs, getTaxesByOutletAndDepartment } from "@/common/api/orders";

interface MenuItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  isBilled: number;
  isNCKOT: number;
  NCName: string;
  NCPurpose: string;
  isNew?: boolean; // Added to track new items not yet sent to KOT
  alternativeItem?: string;
  modifier?: string[];
  originalQty?: number; // To track the original quantity from database
  kotNo?: number;
  txnDetailId?: number;
}

interface TableItem {
  tablemanagementid: string;
  table_name: string;
  hotel_name: string;
  outlet_name: string;
  status: number;
  created_by_id: string;
  created_date: string;
  updated_by_id: string;
  updated_date: string;
  outletid: string;
  hotelid: string;
  marketid: string;
  isActive: boolean;
  isCommonToAllDepartments: boolean;
  departmentid?: number;
  tableid?: string;
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
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [taxRates, setTaxRates] = useState<{ cgst: number; sgst: number; igst: number; cess: number }>({ cgst: 0, sgst: 0, igst: 0, cess: 0 });
  const [taxCalc, setTaxCalc] = useState<{ subtotal: number; cgstAmt: number; sgstAmt: number; igstAmt: number; cessAmt: number; grandTotal: number }>({ subtotal: 0, cgstAmt: 0, sgstAmt: 0, igstAmt: 0, cessAmt: 0, grandTotal: 0 });
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [selectedOutletId, setSelectedOutletId] = useState<number | null>(null);
  const [showDiscountModal, setShowDiscountModal] = useState<boolean>(false);
  const [DiscPer, setDiscPer] = useState<number>(0); // Ensure this state is updated
  const [givenBy, setGivenBy] = useState<string>(user?.name || '');
  const [reason, setReason] = useState<string>('');
  const [DiscountType, setDiscountType] = useState<number>(0); // 0 for percentage, 1 for amount
  const [currentKOTNo, setCurrentKOTNo] = useState<number | null>(null);
  const [currentKOTNos, setCurrentKOTNos] = useState<number[]>([]);

  // New state for Focus Mode
  const [focusMode, setFocusMode] = useState<boolean>(false); // Default OFF
  const [triggerFocusInDetails, setTriggerFocusInDetails] = useState<number>(0);

  // New state for floating button group and modals
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [showTaxModal, setShowTaxModal] = useState<boolean>(false);
  const [showNCKOTModal, setShowNCKOTModal] = useState<boolean>(false);

  // KOT Print Settings state


  // Tax modal form state
  const [cgst, setCgst] = useState<string>('');
  const [sgst, setSgst] = useState<string>('');
  const [igst, setIgst] = useState<string>('');
  const [cess, setCess] = useState<string>('');

  // NCKOT modal form state
  const [ncName, setNcName] = useState<string>('');
  const [ncPurpose, setNcPurpose] = useState<string>('');

  const refreshItemsForTable = useCallback((tableIdNum: number) => {
    return getUnbilledItemsByTable(tableIdNum)
      .then(response => {
        if (response.success && response.data && Array.isArray(response.data.items)) {
          const fetchedItems: MenuItem[] = response.data.items.map((item: any) => ({
            id: item.itemId,
            txnDetailId: item.txnDetailId,
            name: item.itemName,
            price: item.price,
            qty: item.netQty,
            isBilled: 0,
            isNCKOT: 0,
            NCName: '',
            NCPurpose: '',
            isNew: false,
            originalQty: item.netQty,
            kotNo: item.kotNo,
          }));
          setCurrentKOTNo(response.data.kotNo);
          setItems(fetchedItems);

          const kotNumbersForTable = fetchedItems
            .map(item => item.kotNo)
            .filter((v, i, a): v is number => v !== undefined && a.indexOf(v) === i)
            .sort((a, b) => a - b);
          setCurrentKOTNos(kotNumbersForTable);
        } else {
          console.warn('Failed to fetch/refetch unbilled items:', response.message);
          setItems([]);
          setCurrentKOTNo(null);
          setCurrentKOTNos([]);
        }
      })
      .catch(error => {
        console.error('Error fetching/refetching unbilled items:', error);
        setItems([]);
        setCurrentKOTNo(null);
        setCurrentKOTNos([]);
      });
  }, [setItems, setCurrentKOTNo, setCurrentKOTNos]);
// KOT Preview formData state
const [formData, setFormData] = useState({
  customer_on_kot_dine_in: false,
  customer_on_kot_pickup: false,
  customer_on_kot_delivery: false,
  customer_on_kot_quick_bill: false,
  customer_kot_display_option: 'NAME_ONLY',
  group_kot_items_by_category: false,
  hide_table_name_quick_bill: false,
  show_new_order_tag: true,
  new_order_tag_label: 'New',
  show_running_order_tag: true,
  running_order_tag_label: 'Running',
  dine_in_kot_no: 'DIN-',
  pickup_kot_no: 'PUP-',
  delivery_kot_no: 'DEL-',
  quick_bill_kot_no: 'QBL-',
  modifier_default_option: false,
  print_kot_both_languages: false,
  show_alternative_item: false,
  show_captain_username: false,
  show_covers_as_guest: false,
  show_item_price: true,
  show_kot_no_quick_bill: false,
  show_kot_note: true,
  show_online_order_otp: false,
  show_order_id_quick_bill: false,
  show_order_id_online_order: false,
  show_order_no_quick_bill_section: false,
  show_order_type_symbol: true,
  show_store_name: true,
  show_terminal_username: false,
  show_username: false,
  show_waiter: true,
  bill_title_dine_in: true,
  bill_title_pickup: true,
  bill_title_delivery: true,
  bill_title_quick_bill: true,
  mask_order_id: false,
  modifier_default_option_bill: false,
  print_bill_both_languages: false,
  show_alt_item_title_bill: false,
  show_alt_name_bill: false,
  show_bill_amount_words: false,
  show_bill_no_bill: true,
  show_bill_number_prefix_bill: true,
  show_bill_print_count: false,
  show_brand_name_bill: true,
  show_captain_bill: false,
  show_covers_bill: true,
  show_custom_qr_codes_bill: false,
  show_customer_gst_bill: false,
  show_customer_bill: true,
  show_customer_paid_amount: true,
  show_date_bill: true,
  show_default_payment: true,
  show_discount_reason_bill: false,
  show_due_amount_bill: true,
  show_ebill_invoice_qrcode: false,
  show_item_hsn_code_bill: false,
  show_item_level_charges_separately: false,
  show_item_note_bill: true,
  show_items_sequence_bill: true,
  show_kot_number_bill: false,
  show_logo_bill: true,
  show_order_id_bill: false,
  show_order_no_bill: true,
  show_order_note_bill: true,
  order_type_dine_in: true,
  order_type_pickup: true,
  order_type_delivery: true,
  order_type_quick_bill: true,
  show_outlet_name_bill: true,
  payment_mode_dine_in: true,
  payment_mode_pickup: true,
  payment_mode_delivery: true,
  payment_mode_quick_bill: true,
  table_name_dine_in: true,
  table_name_pickup: false,
  table_name_delivery: false,
  table_name_quick_bill: false,
  show_tax_charge_bill: true,
  show_username_bill: false,
  show_waiter_bill: true,
  show_zatca_invoice_qr: false,
  show_customer_address_pickup_bill: false,
  show_order_placed_time: true,
  hide_item_quantity_column: false,
  hide_item_rate_column: false,
  hide_item_total_column: false,
  hide_total_without_tax: false,

});

const getTableButtonClass = (table: TableItem, isSelected: boolean) => {
  if (isSelected) return 'btn-success';
  // Use separate status field for coloring: 0=default,1=green,2=red
  switch (table.status) {
    case 1: return 'btn-success'; // KOT saved/occupied (green)
    case 0: return 'btn-outline-success'; // Default background (white/grey)
    case 2: return 'btn-danger'; // red for billed
    default: return 'btn-outline-success';
  }
};

const getTableButtonStyle = (table: TableItem, isSelected: boolean) => {
  let backgroundColor = '';
  let border = '1px solid #ccc';
  switch (table.status) {
    case 0:
      backgroundColor = '#f8f9fa'; // light grey for vacant
      break;
    case 1:
      backgroundColor = '#28a745'; // green for occupied
      break;
    case 2:
      backgroundColor = '#dc3545'; // red for billed
      break;
    default:
      backgroundColor = '#f8f9fa';
  }
  if (isSelected) {
    border = '3px solid #007bff'; // blue border for selected
  }
  return {
    width: '90px',
    height: '80px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor,
    color: table.status === 0 ? 'black' : 'white', // black text for vacant, white for others
    border,
    borderRadius: '5px'
  };
};

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
        console.log('Customer API response:', response);
        if (response.customerid && response.name) {
          setCustomerName(response.name);
        } else if (response.success && response.data && response.data.length > 0) {
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

  const handleMobileKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
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

  const fetchKotPrintSettings = async (outletId: number) => {
    try {
      console.log('Fetching KOT print settings for outlet:', outletId);

      const res = await fetch(`http://localhost:3001/api/outlets/kot-print-settings/${outletId}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        console.log('KOT print settings response:', data);

        if (data) {
          // Update the formData state with the fetched settings
          setFormData(prevFormData => ({
            ...prevFormData,
            show_store_name: data.show_store_name ?? prevFormData.show_store_name,
            dine_in_kot_no: data.dine_in_kot_no ?? prevFormData.dine_in_kot_no,
            show_new_order_tag: data.show_new_order_tag ?? prevFormData.show_new_order_tag,
            new_order_tag_label: data.new_order_tag_label ?? prevFormData.new_order_tag_label,
            show_running_order_tag: data.show_running_order_tag ?? prevFormData.show_running_order_tag,
            running_order_tag_label: data.running_order_tag_label ?? prevFormData.running_order_tag_label,
            show_kot_no_quick_bill: data.show_kot_no_quick_bill ?? prevFormData.show_kot_no_quick_bill,
            hide_table_name_quick_bill: data.hide_table_name_quick_bill ?? prevFormData.hide_table_name_quick_bill,
            show_order_id_quick_bill: data.show_order_id_quick_bill ?? prevFormData.show_order_id_quick_bill,
            show_online_order_otp: data.show_online_order_otp ?? prevFormData.show_online_order_otp,
            show_covers_as_guest: data.show_covers_as_guest ?? prevFormData.show_covers_as_guest,
            show_order_type_symbol: data.show_order_type_symbol ?? prevFormData.show_order_type_symbol,
            show_waiter: data.show_waiter ?? prevFormData.show_waiter,
            show_captain_username: data.show_captain_username ?? prevFormData.show_captain_username,
            show_username: data.show_username ?? prevFormData.show_username,
            show_terminal_username: data.show_terminal_username ?? prevFormData.show_terminal_username,
            customer_on_kot_dine_in: data.customer_on_kot_dine_in ?? prevFormData.customer_on_kot_dine_in,
            customer_on_kot_quick_bill: data.customer_on_kot_quick_bill ?? prevFormData.customer_on_kot_quick_bill,
            customer_kot_display_option: data.customer_kot_display_option ?? prevFormData.customer_kot_display_option,
            show_item_price: data.show_item_price ?? prevFormData.show_item_price,
            modifier_default_option: data.modifier_default_option ?? prevFormData.modifier_default_option,
            show_alternative_item: data.show_alternative_item ?? prevFormData.show_alternative_item,
            show_kot_note: data.show_kot_note ?? prevFormData.show_kot_note,
            print_kot_both_languages: data.print_kot_both_languages ?? prevFormData.print_kot_both_languages,
            group_kot_items_by_category: data.group_kot_items_by_category ?? prevFormData.group_kot_items_by_category,
            pickup_kot_no: data.pickup_kot_no ?? prevFormData.pickup_kot_no,
            delivery_kot_no: data.delivery_kot_no ?? prevFormData.delivery_kot_no,
            quick_bill_kot_no: data.quick_bill_kot_no ?? prevFormData.quick_bill_kot_no,
            customer_on_kot_pickup: data.customer_on_kot_pickup ?? prevFormData.customer_on_kot_pickup,
            customer_on_kot_delivery: data.customer_on_kot_delivery ?? prevFormData.customer_on_kot_delivery,
            show_order_placed_time: data.show_order_placed_time ?? prevFormData.show_order_placed_time,
            hide_item_quantity_column: data.hide_item_quantity_column ?? prevFormData.hide_item_quantity_column,
            hide_item_rate_column: data.hide_item_rate_column ?? prevFormData.hide_item_rate_column,
            hide_item_total_column: data.hide_item_total_column ?? prevFormData.hide_item_total_column,
          }));

          console.log('KOT print settings loaded successfully');
        } else {
          console.warn('No KOT print settings found, using defaults');
        }
      } else if (res.status === 404) {
        console.warn('KOT print settings not found for outlet');
        // Handle 404 gracefully - use existing default settings
      } else {
        console.error('Failed to fetch KOT print settings:', res.status, res.statusText);
      }
    } catch (err) {
      console.error('Error fetching KOT print settings:', err);
      // Handle network errors gracefully - continue with existing defaults
    }
  };

  const fetchBillPreviewSettings = async (outletId: number) => {
    try {
      const res = await fetch(`http://localhost:3001/api/outlets/bill-preview-settings/${outletId}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        if (data) {
          setFormData(prevFormData => ({
            ...prevFormData,
            outlet_name: data.outlet_name ?? (prevFormData as any).outlet_name,
            email: data.email ?? (prevFormData as any).email,
            website: data.website ?? (prevFormData as any).website,
            show_phone_on_bill: data.show_phone_on_bill ?? (prevFormData as any).show_phone_on_bill,
            note: data.note ?? (prevFormData as any).note,
            footer_note: data.footer_note ?? (prevFormData as any).footer_note,
            field1: data.field1 ?? (prevFormData as any).field1,
            field2: data.field2 ?? (prevFormData as any).field2,
            field3: data.field3 ?? (prevFormData as any).field3,
            field4: data.field4 ?? (prevFormData as any).field4,
            fssai_no: data.fssai_no ?? (prevFormData as any).fssai_no,
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching bill preview settings:', err);
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
    // Force reset selectedTable to null first to allow re-selection of the same table
    setSelectedTable(null);
    setItems([]); // Reset items for the new table
    setCurrentKOTNo(null); // Reset KOT number for the new table
    setCurrentKOTNos([]); // Reset multiple KOT numbers for the new table
    setShowOrderDetails(true);
    setInvalidTable('');

    // Delay setting selectedTable to seat to trigger re-render and re-fetch
    setTimeout(() => {
      setSelectedTable(seat);

      // Find the full table object to get its ID, case-insensitively
      const tableList = Array.isArray(filteredTables) && filteredTables.length > 0 ? filteredTables : tableItems;
      const selectedTableObj = tableList.find(
        (t: TableItem) => t && t.table_name && t.table_name.toLowerCase() === seat.toLowerCase()
      );

      if (selectedTableObj) {
        // Use tableid if available, else fallback to tablemanagementid
        const tableIdNum = Number(selectedTableObj.tableid ?? selectedTableObj.tablemanagementid);
        const deptId = Number(selectedTableObj.departmentid) || null;
        const outletId = Number(selectedTableObj.outletid) || (user?.outletid ? Number(user.outletid) : null);

        setSelectedDeptId(deptId);
        setSelectedOutletId(outletId);

        // Refetch items for the selected table
        refreshItemsForTable(tableIdNum);
      } else {
        console.warn('Selected table object not found for seat:', seat);
        setItems([]); // Clear items if table not found
        setCurrentKOTNo(null);
        setCurrentKOTNos([]);
      }
      console.log('After handleTableClick - selectedTable:', seat, 'showOrderDetails:', true);
    }, 0);
  };

  const handleTabClick = (tab: string) => {
    console.log('Tab clicked:', tab);
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
      item.id === itemId ? { ...item, qty: item.qty + 1, isNew: true } : item
    ));
  };

  const handleDecreaseQty = (itemId: number) => {
    const updatedItems = items.map(item =>
      item.id === itemId ? { ...item, qty: item.qty - 1, isNew: true } : item
    );
    setItems(updatedItems.filter(item => item.qty > 0));
  };

  const totalAmount = items
    .reduce((sum, item) => sum + item.price * item.qty, 0)
    .toFixed(2);

  useEffect(() => {
    const selectedDepartment = departments.find(d => d.department_name === activeNavTab) || null;
    if (selectedDepartment) {
      setSelectedDeptId(Number(selectedDepartment.departmentid));
      setSelectedOutletId(Number(selectedDepartment.outletid));
    } else if (activeNavTab === 'ALL') {
      setSelectedDeptId(null);
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

  useEffect(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const cgstAmt = (subtotal * (Number(taxRates.cgst) || 0)) / 100;
    const sgstAmt = (subtotal * (Number(taxRates.sgst) || 0)) / 100;
    const igstAmt = (subtotal * (Number(taxRates.igst) || 0)) / 100;
    const cessAmt = (subtotal * (Number(taxRates.cess) || 0)) / 100;
    const grandTotal = subtotal + cgstAmt + sgstAmt + igstAmt + cessAmt;
    setTaxCalc({ subtotal, cgstAmt, sgstAmt, igstAmt, cessAmt, grandTotal });
  }, [items, taxRates]);

  useEffect(() => {
    if (selectedOutletId) {
      fetchKotPrintSettings(selectedOutletId);
      fetchBillPreviewSettings(selectedOutletId);
    }
  }, [selectedOutletId]);

  const getKOTLabel = () => {
    switch (activeTab) {
      case 'Dine-in': {
        const kotNumbers = currentKOTNos.length > 0 
          ? [...currentKOTNos].sort((a, b) => a - b).join(', ') 
          : currentKOTNo ? currentKOTNo.toString() : '';
        return `KOT ${kotNumbers} ${selectedTable ? ` - Table ${selectedTable}` : ''}`;
      }
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

  const handlePrintBill = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const contentToPrint = document.getElementById('bill-preview');
      if (contentToPrint) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Bill Print</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; width: 300px; }
                .w-50 { width: 100% !important; }
                .mx-auto { margin-left: auto; margin-right: auto; }
                .card { border: 1px solid #ccc; }
                .shadow-sm { box-shadow: 0 .125rem .25rem rgba(0,0,0,.075)!important; }
                .h-100 { height: 100% !important; }
                .card-body { padding: 1rem; }
                .card-title { margin-bottom: .5rem; }
                .h5 { font-size: 1.25rem; }
                .fw-bold { font-weight: 700 !important; }
                .mb-4 { margin-bottom: 1.5rem !important; }
                .text-center { text-align: center !important; }
                .mb-3 { margin-bottom: 1rem !important; }
                .mb-0 { margin-bottom: 0 !important; }
                .d-flex { display: flex !important; }
                .justify-content-between { justify-content: space-between !important; }
                .table { width: 100%; margin-bottom: 1rem; color: #212529; vertical-align: top; border-color: #dee2e6; }
                .table-bordered { border: 1px solid #dee2e6; }
                th, td { padding: .5rem; }
                .text-end { text-align: right !important; }
                .mt-2 { margin-top: .5rem !important; }
              </style>
            </head>
            <body>${contentToPrint.innerHTML}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
      }
    }
  };

  const handlePrintAndSaveKOT = async () => {
    try {
      const newItemsToKOT = items.filter(item => item.isNew);
      if (newItemsToKOT.length === 0) {
        toast ('No new items to save as KOT.');
        setLoading(false);
        return;
      }
      setLoading(true);
      const selectedTableRecord: any = (Array.isArray(filteredTables) ? filteredTables : tableItems)
        .find((t: any) => t && t.table_name && t.table_name === selectedTable)
        || (Array.isArray(tableItems) ? tableItems.find((t: any) => t && t.table_name === selectedTable) : undefined);
      const resolvedTableId = selectedTableRecord ? Number((selectedTableRecord as any).tableid || (selectedTableRecord as any).tablemanagementid) : null;
      const resolvedDeptId = selectedTableRecord ? Number((selectedTableRecord as any).departmentid) || undefined : undefined;
      const resolvedOutletId = selectedTableRecord ? Number((selectedTableRecord as any).outletid) || (user?.outletid ? Number(user.outletid) : null) : null;
      const userId = user?.id || null;
      const hotelId = user?.hotelid || null;

      const kotItemsPayload = newItemsToKOT.map(i => {
        // Calculate the change in quantity. If it's a new item, originalQty will be undefined.
        const qtyDelta = i.originalQty !== undefined ? i.qty - i.originalQty : i.qty;

        // Only include items where quantity has increased.
        // Decreases are handled by Re-KOT.
        if (qtyDelta <= 0) {
          return null;
        }

        const lineSubtotal = Number(i.price) * qtyDelta;
        const cgstPer = Number(taxRates.cgst) || 0;
        const sgstPer = Number(taxRates.sgst) || 0;
        const igstPer = Number(taxRates.igst) || 0;
        const cessPer = Number(taxRates.cess) || 0;
        const cgstAmt = (lineSubtotal * cgstPer) / 100;
        const sgstAmt = (lineSubtotal * sgstPer) / 100;
        const igstAmt = (lineSubtotal * igstPer) / 100;
        const cessAmt = (lineSubtotal * cessPer) / 100; // This tax calculation is for bill, not KOT. KOT only needs item and quantity.
        return {
          ItemID: i.id,
          Qty: qtyDelta,
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
        };
      }).filter(Boolean) as any[];

      if (kotItemsPayload.length === 0) {
        toast.error('No new item quantities to save.');
        setLoading(false);
        return;
      }

      const kotPayload = {
        txnId: 0,
        tableId: resolvedTableId,
        items: kotItemsPayload,
        outletid: resolvedOutletId,
        userId: userId,
        hotelId: hotelId,
      };

      console.log('Sending payload to createKOT:', JSON.stringify(kotPayload, null, 2));
      const resp = await createKOT(kotPayload);
      if (resp?.success) {
        toast.success('KOT saved successfully!');

        // Optimistically update the table status to green (1)
        if (selectedTable) {
          setTableItems(prevTables =>
            prevTables.map(table =>
              table.table_name === selectedTable
                ? { ...table, status: 1 } // 1 for occupied/green
                : table
            )
          );
        }

        // Open print preview with KOT content
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const contentToPrint = document.getElementById('kot-preview');
          if (contentToPrint) {
            printWindow.document.write(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>KOT Print</title>
                  <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .text-center { text-align: center; }
                    .fw-bold { font-weight: bold; }
                    .mb-3 { margin-bottom: 1rem; }
                    .small { font-size: 0.875rem; }
                    .text-muted { color: #6c757d; }
                    .d-block { display: block; }
                    .row { display: flex; flex-wrap: wrap; margin: 0 -15px; }
                    .col-6 { flex: 0 0 50%; max-width: 50%; padding: 0 15px; }
                    .col-1 { flex: 0 0 8.333333%; max-width: 8.333333%; padding: 0 15px; }
                    .col-4 { flex: 0 0 33.333333%; max-width: 33.333333%; padding: 0 15px; }
                    .col-2 { flex: 0 0 16.666667%; max-width: 16.666667%; padding: 0 15px; }
                    .col-3 { flex: 0 0 25%; max-width: 25%; padding: 0 15px; }
                    .text-end { text-align: right; }
                    .pb-1 { padding-bottom: 0.25rem; }
                    .mb-2 { margin-bottom: 0.5rem; }
                    .mb-1 { margin-bottom: 0.25rem; }
                    .border-bottom { border-bottom: 1px solid #dee2e6; }
                    .text-black { color: #000; }
                    @media print { body { margin: 0; } }
                  </style>
                </head>
                <body>
                  ${contentToPrint.innerHTML}
                </body>
              </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            printWindow.print();
          }
        }

        // After printing, decide what to do based on focusMode
        if (focusMode) {
          // Option 1: Focus Mode ON - Clear table, stay on view, focus table input
          setItems([]);
          setSelectedTable(null);
          setCurrentKOTNo(null);
          setCurrentKOTNos([]);
          setTriggerFocusInDetails(c => c + 1); // Trigger focus in OrderDetails
        } else {
          // Option 2: Focus Mode OFF - Clear items and return to table grid view
          setItems([]);
          setSelectedTable(null);
          setShowOrderDetails(false);
          setCurrentKOTNo(null);
          setCurrentKOTNos([]);
        }

        // Refresh saved KOTs list in the background without blocking UI
        getSavedKOTs({ isBilled: 0 })
          .then(listResp => {
            const list = listResp?.data || listResp;
            if (Array.isArray(list)) setSavedKOTs(list);
          })
          .catch(err => {
            console.warn('refresh saved KOTs failed', err);
          });
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

  useEffect(() => {
    if (activeTab === 'Dine-in' && !showOrderDetails && tableSearchInputRef.current) {
      tableSearchInputRef.current.focus();
    }
  }, [activeTab, showOrderDetails]);

  useEffect(() => {
    console.log('State update - showOrderDetails:', showOrderDetails, 'selectedTable:', selectedTable);
  }, [showOrderDetails, selectedTable]);

  const handleApplyDiscount = () => {
    if (DiscPer < 0.5 || DiscPer > 100 || isNaN(DiscPer)) {
      toast.error('Discount percentage must be between 0.5% and 100%');
      return;
    }
    const discountThreshold = 20; // Configurable threshold
    if (DiscPer > discountThreshold && user?.role_level !== 'admin') {
      toast.error('Discount > 20% requires manager approval');
      return;
    }
    const discountAmount = (taxCalc.grandTotal * DiscPer) / 100;
    const newGrandTotal = taxCalc.grandTotal - discountAmount;
    setTaxCalc(prev => ({ ...prev, grandTotal: newGrandTotal }));
    setShowDiscountModal(false);
    toast.success(`Discount ${DiscPer}% applied by ${givenBy}`);
    // Do not reset discountPercent here to persist it
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
    // Apply NCKOT to all items in the order
    setItems(prevItems =>
      prevItems.map(item => ({ ...item, isNCKOT: 1, NCName: ncName, NCPurpose: ncPurpose }))
    );
    setNcName('');
    setNcPurpose('');
    setShowNCKOTModal(false);
  };

  const handlePrintKOT = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const contentToPrint = document.getElementById('kot-preview');
      if (contentToPrint) {
        printWindow.document.write(`
          <!DOCTYPE html>
<html>
  <head>
    <title>KOT Print</title>
    <style>
      @page {
        size: 79mm auto;
        margin: 0;
      }

      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 10px;
        width: 79mm;
        box-sizing: border-box;
      }

      .text-center { text-align: center; }
      .fw-bold { font-weight: bold; }
      .mb-3 { margin-bottom: 1rem; }
      .small { font-size: 0.875rem; }
      .text-muted { color: #6c757d; }
      .d-block { display: block; }
      .row { display: flex; flex-wrap: wrap; margin: 0 -15px; }
      .col-6 { flex: 0 0 50%; max-width: 50%; padding: 0 15px; }
      .col-1 { flex: 0 0 8.333333%; max-width: 8.333333%; padding: 0 15px; }
      .col-4 { flex: 0 0 33.333333%; max-width: 33.333333%; padding: 0 15px; }
      .col-2 { flex: 0 0 16.666667%; max-width: 16.666667%; padding: 0 15px; }
      .col-3 { flex: 0 0 25%; max-width: 25%; padding: 0 15px; }
      .text-end { text-align: right; }
      .pb-1 { padding-bottom: 0.25rem; }
      .mb-2 { margin-bottom: 0.5rem; }
      .mb-1 { margin-bottom: 0.25rem; }
      .border-bottom { border-bottom: 1px solid #dee2e6; }
      .text-black { color: #000; }

      @media print {
        body {
          width: 79mm;
          margin: 0;
        }
      }
    </style>
  </head>
  <body>
    ${contentToPrint.innerHTML}
  </body>
</html>

        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="container-fluid p-0 m-0" style={{ height: '100vh' }}>
      {/* Hidden KOT Preview for Printing */}
      <div id="kot-preview" style={{ display: 'none' }}>
        <div className="col-lg-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-light">
              <h5 className="card-title mb-0 text-center fw-bold">KOT Preview</h5>
            </div>
            <div className="card-body" style={{ fontSize: '0.85rem', overflow: 'hidden' }}>

              {/* Store Name */}
              {formData.show_store_name && (
                <div className="text-center mb-3">
                  <h6 className="fw-bold mb-1">{user?.outlet_name || 'Restaurant Name'}</h6>
                  <div className="small text-muted">{user?.outlet_address || 'Kolhapur Road Kolhapur 416416'}</div>
                  <div className="small text-muted">{user?.outlet_email || 'sangli@gmail.com'}</div>
                </div>
              )}
              {formData.show_store_name && (
                <div style={{ borderBottom: '1px dashed #ccc', margin: '10px 0' }}></div>
              )}

              {/* KOT Header */}
              <div className="text-center mb-3">
                <h6 className="fw-bold">
                  {getKOTLabel() ||
                    formData.dine_in_kot_no ||
                    formData.pickup_kot_no ||
                    formData.delivery_kot_no ||
                    formData.quick_bill_kot_no ||
                    'KITCHEN ORDER TICKET'}
                  {formData.show_new_order_tag && formData.new_order_tag_label && (
                    <span className="ms-2 badge bg-primary">{formData.new_order_tag_label}</span>
                  )}
                  {formData.show_running_order_tag && formData.running_order_tag_label && (
                    <span className="ms-2 badge bg-secondary">{formData.running_order_tag_label}</span>
                  )}
                </h6>
              </div>

              {/* KOT Details */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  {(formData.show_kot_no_quick_bill || !formData.hide_table_name_quick_bill) && (
                    <strong>KOT No:</strong>
                  )}{' '}
                  {currentKOTNo}
                </div>
                <div>
                  {selectedTable && (
                    <>
                      <strong>Table:</strong> {selectedTable}
                    </>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                <div><strong>Time:</strong> {new Date().toLocaleTimeString()}</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <strong>Order Type:</strong> {activeTab}{' '}
                  {formData.show_order_type_symbol ? '🍽️' : ''}
                </div>
                <div>
                  {formData.show_waiter && (
                    <><strong>Waiter:</strong> {user?.name || 'N/A'}</>
                  )}
                  {formData.show_captain_username && (
                    <div><strong>Captain:</strong> Captain</div>
                  )}
                  {formData.show_username && (
                    <div><strong>Username:</strong> User123</div>
                  )}
                  {formData.show_terminal_username && (
                    <div><strong>Terminal:</strong> Term01</div>
                  )}
                </div>
              </div>

              {(formData.customer_on_kot_dine_in ||
                formData.customer_on_kot_quick_bill ||
                formData.customer_on_kot_pickup ||
                formData.customer_on_kot_delivery) &&
                formData.customer_kot_display_option !== 'DISABLED' && (
                  <>
                    <div style={{ borderBottom: '1px dashed #ccc', margin: '10px 0' }}></div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Customer:</strong> {customerName || 'John Doe'}
                      {formData.customer_kot_display_option === 'NAME_AND_MOBILE' && mobileNumber && (
                        <div><small><strong>Mobile:</strong> {mobileNumber}</small></div>
                      )}
                    </div>
                  </>
                )}

              <div style={{ borderBottom: '1px dashed #ccc', margin: '10px 0' }}></div>

              {/* Items Header */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '30px 1fr 50px 70px 80px',
                fontWeight: 'bold',
                borderBottom: '1px solid #dee2e6',
                paddingBottom: '4px',
                marginBottom: '8px'
              }}>
                <div>#</div>
                <div>Item Name</div>
                <div style={{ textAlign: 'center' }}>Qty</div>
                <div style={{ textAlign: 'right' }}>Rate</div>
                {formData.show_item_price && <div style={{ textAlign: 'right' }}>Amount</div>}
              </div>

              {/* Items */}
              {(() => {
                const kotItems = items.filter(item => item.isNew).map(item => {
                  const kotQty = item.originalQty !== undefined ? Math.max(0, item.qty - item.originalQty) : item.qty;
                  return { ...item, kotQty };
                }).filter(item => item.kotQty > 0);
                return kotItems.map((item, index) => (
                  <div key={item.id} style={{
                    display: 'grid',
                    gridTemplateColumns: '30px 1fr 50px 70px 80px',
                    paddingBottom: '4px',
                    marginBottom: '4px'
                  }}>
                    <div>{index + 1}</div>
                    <div>
                      {item.name}
                      {formData.modifier_default_option && item.modifier && (
                        <div><small className="text-muted">{item.modifier}</small></div>
                      )}
                      {formData.show_alternative_item && item.alternativeItem && (
                        <div><small className="text-muted">Alt: {item.alternativeItem}</small></div>
                      )}
                    </div>
                    <div style={{ textAlign: 'center' }}>{item.kotQty}</div>
                    <div style={{ textAlign: 'right' }}>{item.price.toFixed(2)}</div>
                    {formData.show_item_price && (
                      <div style={{ textAlign: 'right' }}>{(item.price * item.kotQty).toFixed(2)}</div>
                    )}
                  </div>
                ));
              })()}

              <div style={{ borderBottom: '1px dashed #ccc', margin: '10px 0' }}></div>

              {/* Total Section */}
              {(() => {
                const kotItemsWithDelta = items.filter(item => item.isNew).map(item => {
                  const kotQty = item.originalQty !== undefined ? Math.max(0, item.qty - item.originalQty) : item.qty;
                  return { ...item, kotQty };
                }).filter(item => item.kotQty > 0);

                const totalKotQty = kotItemsWithDelta.reduce((sum, item) => sum + item.kotQty, 0);
                const totalKotSubtotal = kotItemsWithDelta.reduce((sum, item) => sum + (item.price * item.kotQty), 0);

                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '8px' }}>
                    <div>Total Items: {totalKotQty}</div>
                    {formData.show_item_price && <div>₹ {totalKotSubtotal.toFixed(2)}</div>}
                  </div>
                );
              })()}
              <div style={{ borderBottom: '1px dashed #ccc', margin: '10px 0' }}></div>

              {/* KOT Note */}
              {formData.show_kot_note && (
                <div style={{ fontStyle: 'italic', marginBottom: '8px' }}>
                  <strong>KOT Note:</strong> <em>{formData.show_kot_note}</em>
                </div>
              )}

              {/* Footer */}
              <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.85rem', color: '#6c757d' }}>
                <div>Thank You!</div>
                <div>Please prepare the order</div>
              </div>

              {/* Bilingual Support */}
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

      {/* Bill Preview Section (for printing) */}
      <div id="bill-preview" style={{ display: 'none' }}>
        <div className="w-50 mx-auto">
          <div className="card shadow-sm h-100">
            <div className="card-body">
              <h2 className="card-title h5 fw-bold mb-4 text-center">
                Bill Preview
              </h2>
              <div className="text-center mb-3">
                <p className="fw-bold">{(formData as any).outlet_name || user?.outlet_name || '!!!Hotel Miracle!!!'}</p>
                <p>{user?.outlet_address || 'Kolhapur Road Kolhapur 416416'}</p>
                {(formData as any).show_phone_on_bill && <p>Ph: {(formData as any).show_phone_on_bill}</p>}
                {(formData as any).email && <p>Email: {(formData as any).email}</p>}
                {(formData as any).website && <p>Website: {(formData as any).website}</p>}
              </div>
              <div className="text-center mb-3" style={{ fontSize: '0.9rem' }}>
                <p className="mb-0">Note: {(formData as any).note || document.querySelector<HTMLInputElement>('input[placeholder="KOT Note"]')?.value || ''}</p>
                <p className="mb-0">{new Date().toLocaleString()}</p>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <p>Pay Mode: Cash</p>
                <p>User: {user?.name || 'TMPOS'}</p>
              </div>
              <table className="table table-bordered mb-3">
                <thead>
                  <tr>
                    <th scope="col">Item Name</th>
                    <th scope="col" className="text-end">
                      Quantity
                    </th>
                    <th scope="col" className="text-end">
                      Price
                    </th>
                    <th scope="col" className="text-end">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={item.id}>
                      <td>{index + 1}. {item.name}</td>
                      <td className="text-end">{item.qty}</td>
                      <td className="text-end">{item.price.toFixed(2)}</td>
                      <td className="text-end">{(item.price * item.qty).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="text-end">
                <p>Total Value: Rs. {taxCalc.subtotal.toFixed(2)}</p>
                {(taxCalc.cgstAmt > 0 || taxCalc.sgstAmt > 0 || taxCalc.igstAmt > 0 || taxCalc.cessAmt > 0) && (
                  <p className="mt-2">GST:</p>
                )}
                {taxCalc.cgstAmt > 0 && <p>CGST ({taxRates.cgst}%): Rs. {taxCalc.cgstAmt.toFixed(2)}</p>}
                {taxCalc.sgstAmt > 0 && <p>SGST ({taxRates.sgst}%): Rs. {taxCalc.sgstAmt.toFixed(2)}</p>}
                {taxCalc.igstAmt > 0 && <p>IGST ({taxRates.igst}%): Rs. {taxCalc.igstAmt.toFixed(2)}</p>}
                {taxCalc.cessAmt > 0 && <p>CESS ({taxRates.cess}%): Rs. {taxCalc.cessAmt.toFixed(2)}</p>}
                <p className="mt-2">Total Tax (excl.): Rs. {(taxCalc.cgstAmt + taxCalc.sgstAmt + taxCalc.igstAmt + taxCalc.cessAmt).toFixed(2)}</p>
                {/* Custom fields */}
                {(formData as any).field1 && <p className="mt-2">{(formData as any).field1}</p>}
                {(formData as any).field2 && <p>{(formData as any).field2}</p>}
                {(formData as any).field3 && <p>{(formData as any).field3}</p>}
                {(formData as any).field4 && <p>{(formData as any).field4}</p>}
                {DiscPer > 0 && (
                  <p className="mt-2">Discount ({DiscountType === 0 ? `${DiscPer}%` : `Amt`}): Rs. {
                    (DiscountType === 0 ? (taxCalc.subtotal * DiscPer / 100) : DiscPer).toFixed(2)
                  }</p>
                )}
                <p className="mt-2 fw-bold">Grand Total: Rs. {(taxCalc.grandTotal - (DiscountType === 0 ? (taxCalc.grandTotal * (DiscPer || 0)) / 100 : (DiscPer || 0))).toFixed(2)}</p>
              </div>
              {/* Footer notes */}
              <div className="text-center mt-3">
                {(formData as any).footer_note && <p>{(formData as any).footer_note}</p>}
                {(formData as any).fssai_no && <p>FSSAI No: {(formData as any).fssai_no}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

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
            body {
              width: 79mm;
              margin: 0;
              padding: 0;
            }
            .billing-panel,
            .billing-panel * {
              visibility: visible;
            }
            .billing-panel {
              position: absolute;
              top: 0;
              left: 0;
              width: 79mm !important;
              max-width: 79mm !important;
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
                                  className={`btn ${getTableButtonClass(table, selectedTable === table.table_name)}`}
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
                  setSelectedDeptId={setSelectedDeptId}
                  setSelectedOutletId={setSelectedOutletId}
                  focusMode={focusMode}
                  setFocusMode={setFocusMode}
                  triggerFocus={triggerFocusInDetails}
                   refreshItemsForTable={refreshItemsForTable}
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
                (() => {
                  const kotColors = ['#f0f8ff', '#fafad2', '#e6e6fa', '#f0fff0', '#fff5ee', '#f5f5dc'];
                  const sortedItems = [...items].sort((a, b) => {
                    const kotA = a.kotNo ?? Infinity;
                    const kotB = b.kotNo ?? Infinity;
                    if (kotA === kotB) {
                      return (a.txnDetailId ?? Infinity) - (b.txnDetailId ?? Infinity);
                    }
                    return kotA - kotB;
                  });

                  const kotColorMap = new Map<number, string>();
                  let colorIndex = 0;

                  sortedItems.forEach(item => {
                    if (item.kotNo && !kotColorMap.has(item.kotNo)) {
                      kotColorMap.set(item.kotNo, kotColors[colorIndex % kotColors.length]);
                      colorIndex++;
                    }
                  });

                  return sortedItems.map((item, index) => {
                    const backgroundColor = item.isNew
                      ? '#d4edda' // Light green for new items
                      : item.kotNo
                        ? kotColorMap.get(item.kotNo)
                        : 'transparent';

                    return (
                      <div
                        key={item.txnDetailId ?? `new-${item.id}-${index}`}
                        className="border-bottom"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr 1fr',
                          padding: '0.25rem',
                          alignItems: 'center',
                          backgroundColor: backgroundColor,
                        }}
                      >
                        <span style={{ textAlign: 'left' }}>{item.name}</span>
                        <div className="text-center d-flex justify-content-center align-items-center gap-2">
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ padding: '0 5px', lineHeight: '1' }}
                            onClick={() => handleDecreaseQty(item.id)}
                            disabled={!item.isNew}
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
                            readOnly={!item.isNew}
                            onChange={(e) => {
                              const newQty = parseInt(e.target.value) || 0;
                              if (newQty <= 0) {
                                setItems(items.filter((i) => i.id !== item.id));
                              } else {
                                setItems(
                                  items.map((i) =>
                                    i.id === item.id ? { ...i, qty: newQty, isNew: true } : i
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
                            disabled={!item.isNew}
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
                    );
                  });
                })()
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
                    onKeyPress={handleMobileKeyPress}
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
                    readOnly
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
                <div className="d-flex align-items-center ms-2" style={{ position: 'relative', overflow: 'visible' }}>
                  {/* Hamburger Button */}
                  <Button
                    variant="primary"
                    className="rounded-circle d-flex justify-content-center align-items-center"
                    style={{ width: '36px', height: '36px', padding: '0', zIndex: 1001 }}
                    onClick={() => setShowOptions(true)}
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M3 12H21M3 6H21M3 18H21"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </Button>

                  {showOptions && (
                    <>
                      <div
                        className="d-flex flex-row gap-3"
                        style={{
                          position: 'absolute',
                          top: '-60px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          backgroundColor: '#eef3ff',
                          borderRadius: '30px',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                          padding: '10px 15px',
                          minWidth: '220px', // Increased minimum width
                          zIndex: 1000,
                        }}
                      >
                        {/* Tax Button */}
                        <Button
                          variant="primary"
                          className="rounded-circle p-0 d-flex justify-content-center align-items-center"
                          style={{ width: '32px', height: '32px' }}
                          onClick={() => {
                            setShowOptions(false);
                            handleOpenTaxModal();
                          }}
                          title="Tax"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M8.5 1a.5.5 0 0 0-1 0v1.07a3.001 3.001 0 0 0-2.995 2.824L4.5 5.9v.2a.5.5 0 0 0 1 0v-.2a2 2 0 1 1 2 1.995v2.11a3.001 3.001 0 0 0-2.995 2.824L5.5 12.9v.2a.5.5 0 0 0 1 0v-.2a2 2 0 1 1 2-1.995V2.07z" />
                          </svg>
                        </Button>

                        {/* NCKOT Button */}
                        <Button
                          variant="secondary"
                          className="rounded-circle p-0 d-flex justify-content-center align-items-center"
                          style={{ width: '32px', height: '32px' }}
                          onClick={() => {
                            setShowOptions(false);
                            setShowNCKOTModal(true);
                          }}
                          title="NCKOT"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M5 7.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5z" />
                            <path d="M14 4.5V14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h5.5L14 4.5zm-3-.5a.5.5 0 0 1-.5-.5V1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V4h-3z" />
                          </svg>
                        </Button>

                        {/* Discount Button */}
                        <Button
                          variant="success"
                          className="rounded-circle p-0 d-flex justify-content-center align-items-center"
                          style={{ width: '32px', height: '32px' }}
                          onClick={() => {
                            setShowOptions(false);
                            setShowDiscountModal(true);
                          }}
                          title="Discount"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M13.442 2.558a1.5 1.5 0 1 1-2.121 2.121l-6.35 6.35a1.5 1.5 0 1 1-2.122-2.12l6.35-6.35a1.5 1.5 0 0 1 2.121 0zM5.5 5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm5 6a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
                          </svg>
                        </Button>
                      </div>

                      {/* Overlay to close when clicking outside */}
                      <div
                        style={{
                          position: 'fixed',
                          top: 0,
                          left: 0,
                          width: '100vw',
                          height: '100vh',
                          backgroundColor: 'rgba(0,0,0,0)',
                          zIndex: 999,
                        }}
                        onClick={() => setShowOptions(false)}
                      />
                    </>
                  )}
                </div>

              </div>
              <div className="mt-1">
                <div className="bg-white border rounded p-2">
                  <div className="d-flex justify-content-between"><span>Subtotal</span><span>{taxCalc.subtotal.toFixed(2)}</span></div>
                  {DiscPer > 0 && (
                    <div className="d-flex justify-content-between"><span>Discount ({DiscPer}%)</span><span>{((taxCalc.grandTotal * DiscPer) / 100).toFixed(2)}</span></div>
                  )}
                  <hr className="my-2" />
                  <div className="d-flex justify-content-between align-items-center bg-success text-white rounded p-1">
                    <span className="fw-bold">Grand Total</span>
                    <div>
                      <span className="fw-bold me-2">{(taxCalc.grandTotal - (taxCalc.grandTotal * (DiscPer || 0) / 100)).toFixed(2)}</span>

                    </div>
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
                    onClick={handlePrintBill}
                    disabled={items.length === 0}
                  >
                    Print Bill
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
                      <th>KOT No</th>
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
                        <td>{kot.KOTNo}</td>
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

          <Modal show={showDiscountModal} onHide={() => setShowDiscountModal(false)} centered onShow={() => { const discountInput = document.getElementById('discountInput') as HTMLInputElement; if (discountInput) discountInput.focus(); }}>
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
          <Modal
            show={showNewCustomerForm}
            onHide={handleCloseCustomerModal}
            centered
            size="xl"
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

          <Modal
            show={showTaxModal}
            onHide={() => setShowTaxModal(false)}
            centered
            size="xl"
            backdrop="static"
            keyboard={false}
          >
            <Modal.Header closeButton>
              <Modal.Title>View Tax Rates</Modal.Title>
            </Modal.Header>

            <Modal.Body>
              <div>
                <h6>Tax Summary</h6>
                <div style={{ overflowX: 'auto' }}>
                  <table
                    className="table table-bordered text-center"
                    style={{ minWidth: '800px', width: '100%' }}  // Inline CSS applied here
                  >
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
            <Modal.Header closeButton>
              <Modal.Title>NCKOT</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="mb-3">
                <label>Name</label>
                <input type="text" className="form-control" value={ncName} onChange={(e) => setNcName(e.target.value)} />
              </div>
              <div className="mb-3">
                <label>Purpose</label>
                <input type="text" className="form-control" value={ncPurpose} onChange={(e) => setNcPurpose(e.target.value)} />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowNCKOTModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSaveNCKOT}>Save</Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>

    </div>

  );
};
export default Order;
