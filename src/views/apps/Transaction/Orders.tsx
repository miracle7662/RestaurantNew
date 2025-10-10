import { useState, useEffect, useRef, useCallback } from "react";
import { Button, Form, Modal, Table, Card, Row, Col } from "react-bootstrap";
import OrderDetails from "./OrderDetails";
import { fetchOutletsForDropdown } from "@/utils/commonfunction";
import { useAuthContext } from "@/common";
import { getUnbilledItemsByTable } from "@/common/api/orders";
import { OutletData } from "@/common/api/outlet";
import AddCustomerModal from "./Customers";
import { toast } from "react-hot-toast";
import { createKOT, getSavedKOTs, getTaxesByOutletAndDepartment } from "@/common/api/orders";
import F8PasswordModal from "@/components/F8PasswordModal";
import KotTransfer from "./KotTransfer";

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
  isReverse?: boolean; // Added for reverse quantity items
}

interface ReversedMenuItem extends MenuItem {
  isReversed: true;
  ReversalLogID: number;
  status: 'Reversed';
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

interface PaymentMode {
  id: number;
  paymenttypeid: number;
  mode_name: string;
}

const Order = () => {
  const [selectedTable, setSelectedTable] = useState<string | null>('');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [reverseQtyMode, setReverseQtyMode] = useState<boolean>(false); // New state for Reverse Qty Mode
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
  const [discount, setDiscount] = useState<number>(0);
  const [DiscPer, setDiscPer] = useState<number>(0);
  const [givenBy, setGivenBy] = useState<string>(user?.name || '');
  const [reason, setReason] = useState<string>('');
  const [DiscountType, setDiscountType] = useState<number>(1); // 1 for percentage, 0 for amount
  const [discountInputValue, setDiscountInputValue] = useState<number>(0);
  const [currentKOTNo, setCurrentKOTNo] = useState<number | null>(null);
  const [currentKOTNos, setCurrentKOTNos] = useState<number[]>([]);
  const [currentTxnId, setCurrentTxnId] = useState<number | null>(null);
  const [TxnNo, setTxnNo] = useState<string | null>(null); // New state for displaying Bill No  

  // New state for F8 password modal on billed tables
  const [showF8PasswordModal, setShowF8PasswordModal] = useState<boolean>(false);
  const [f8PasswordError, setF8PasswordError] = useState<string>('');
  const [f8PasswordLoading, setF8PasswordLoading] = useState<boolean>(false);

  // New state for Reverse Qty Mode authentication
  const [reverseQtyConfig, setReverseQtyConfig] = useState<'NoPassword' | 'PasswordRequired'>('PasswordRequired'); // Config for Reverse Qty Mode
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // State to track reverse quantity items for KOT printing
  const [reverseQtyItems, setReverseQtyItems] = useState<MenuItem[]>([]);

  // New state for Focus Mode
  const [focusMode, setFocusMode] = useState<boolean>(false); // Default OFF
  const [triggerFocusInDetails, setTriggerFocusInDetails] = useState<number>(0);

  // New state for floating button group and modals
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [isGroupedView, setIsGroupedView] = useState<boolean>(true); // State for grouped/expanded view
  const [showTaxModal, setShowTaxModal] = useState<boolean>(false);
  const [showNCKOTModal, setShowNCKOTModal] = useState<boolean>(false);
  const [showKotTransfer, setShowKotTransfer] = useState<boolean>(false);

  // KOT Print Settings state


  // Tax modal form state
  const [cgst, setCgst] = useState<string>('');
  const [sgst, setSgst] = useState<string>('');
  const [igst, setIgst] = useState<string>('');
  const [cess, setCess] = useState<string>('');

  // NCKOT modal form state
  const [ncName, setNcName] = useState<string>('');
  const [ncPurpose, setNcPurpose] = useState<string>('');

  // New states for settlement flow
  const [billActionState, setBillActionState] = useState<'initial' | 'printOrSettle'>('initial');
  const [outletPaymentModes, setOutletPaymentModes] = useState<PaymentMode[]>([]);
  const [showSettlementModal, setShowSettlementModal] = useState<boolean>(false);
  const [isMixedPayment, setIsMixedPayment] = useState<boolean>(false);
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
  const [selectedPaymentModes, setSelectedPaymentModes] = useState<string[]>([]);
  const [reversedItems, setReversedItems] = useState<ReversedMenuItem[]>([]);




  const revKotTotal = reverseQtyItems.reduce((sum, item) => sum + item.price * item.qty, 0);

  const totalPaid = Object.values(paymentAmounts).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
  const grandTotal = Math.round((taxCalc.grandTotal - discount - revKotTotal) * 100) / 100;
  const settlementBalance = grandTotal - totalPaid;

  const hasModifications = items.some(item => item.isNew) || reverseQtyItems.length > 0;

  const refreshItemsForTable = useCallback(async (tableIdNum: number) => {
    try {
      // Step 1: Try to fetch the latest billed (but not settled) bill
      const billedBillRes = await fetch(`http://localhost:3001/api/TAxnTrnbill/billed-bill/by-table/${tableIdNum}`);

      if (billedBillRes.ok) {
        const billedBillData = await billedBillRes.json();
        if (billedBillData.success && billedBillData.data) {
          const { details, ...header } = billedBillData.data;
        const fetchedItems: MenuItem[] = details.map((item: any) => ({
          id: item.ItemID,
          txnDetailId: item.TXnDetailID,
          name: item.ItemName || 'Unknown Item',
          price: item.RuntimeRate,
          qty: (Number(item.Qty) || 0) - (Number(item.RevQty) || 0), // Calculate net quantity
          isBilled: item.isBilled, // Use the isBilled flag from the item itself
          revQty: Number(item.RevQty) || 0, // Store revQty
          isNCKOT: item.isNCKOT,
          NCName: '',
          NCPurpose: '',
          isNew: false, // All items are existing
          originalQty: item.Qty,
          kotNo: item.KOTNo, // Use KOTNo from the item detail
        })).filter((item: any) => item.qty > 0);

          setItems(fetchedItems);
          setTxnNo(header.TxnNo); // Set TxnNo from the fetched bill header
          setCurrentTxnId(header.TxnID);
          setCurrentKOTNo(header.KOTNo); // A billed order might have a KOT no.
          setCurrentKOTNos(
            fetchedItems
              .map(item => item.kotNo)
              .filter((v, i, a): v is number => v !== undefined && a.indexOf(v) === i)
              .sort((a, b) => a - b)
          );
          return; // Exit after successfully loading billed items
        }
      }

      // Step 2: If no billed bill found (e.g., 404), fetch unbilled items (existing logic)
      const unbilledItemsRes = await getUnbilledItemsByTable(tableIdNum);
      if (unbilledItemsRes.success && unbilledItemsRes.data && Array.isArray(unbilledItemsRes.data.items)) {
        const fetchedItems: MenuItem[] = unbilledItemsRes.data.items.map((item: any) => ({
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
        setCurrentKOTNo(unbilledItemsRes.data.kotNo);

        // Set reversed items from the new API response field
        const fetchedReversedItems: ReversedMenuItem[] = (unbilledItemsRes.data.reversedItems || []).map((item: any) => ({
          ...item,
          name: item.ItemName || item.itemName || 'Unknown Item',
          id: item.ItemID || item.itemId,
          price: item.RuntimeRate || item.price || 0,
          qty: Math.abs(item.Qty) || 1, // Ensure positive qty for display
          isReversed: true,
          ReversalLogID: item.ReversalLogID,
          status: 'Reversed',
        }));
        setReversedItems(fetchedReversedItems);
        setItems(fetchedItems);

        // Also set TxnNo if it exists on the unbilled transaction
        if (unbilledItemsRes.data.items.length > 0 && unbilledItemsRes.data.items[0].txnId) {
          setTxnNo(unbilledItemsRes.data.items[0].TxnNo || null);
        }

        if (unbilledItemsRes.data.items.length > 0 && unbilledItemsRes.data.items[0].txnId) {
          setCurrentTxnId(unbilledItemsRes.data.items[0].txnId);
        } else {
          setCurrentTxnId(null);
        }

        const kotNumbersForTable = fetchedItems
          .map(item => item.kotNo)
          .filter((v, i, a): v is number => v !== undefined && a.indexOf(v) === i)
          .sort((a, b) => a - b);
        setCurrentKOTNos(kotNumbersForTable);
      } else {
        // No billed or unbilled items found
        setItems([]);
        setReversedItems([]);
        setCurrentKOTNo(null);
        setCurrentKOTNos([]);
        setTxnNo(null);
        setCurrentTxnId(null);
      }
    } catch (error) {
      console.error('Error fetching/refetching items for table:', error);
      setItems([]);
      setReversedItems([]);
      setTxnNo(null);
      setCurrentKOTNo(null);
      setCurrentKOTNos([]);
      setCurrentTxnId(null);
    }
  }, [setItems, setReversedItems, setCurrentKOTNo, setCurrentKOTNos, setCurrentTxnId]);
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
    outlet_name: '',
    email: '',
    website: '',
    show_phone_on_bill: false,
    note: '',
    footer_note: '',
    field1: '',
    field2: '',
    field3: '',
    field4: '',
    fssai_no: '',

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
    setItems(currentItems => {
      const newItems = [...currentItems];
      // Find the specific 'isNew' item instance to increment.
      const existingNewItemIndex = newItems.findIndex(i => i.id === itemId && i.isNew);

      if (existingNewItemIndex > -1) {
        const item = newItems[existingNewItemIndex];
        newItems[existingNewItemIndex] = { ...item, qty: item.qty + 1 };
        return newItems;
      }
      // If no 'isNew' item is found, do nothing. This can happen if the button is clicked on a grouped item
      // that contains only old items, but the button should be disabled in that case.
      return currentItems;
    });
  };

  const handleDecreaseQty = (itemId: number) => {
    setItems(currentItems => {
      const newItems = [...currentItems];
      const existingNewItemIndex = newItems.findIndex(i => i.id === itemId && i.isNew);

      if (existingNewItemIndex > -1) {
        const item = newItems[existingNewItemIndex];
        if (item.qty > 1) {
          newItems[existingNewItemIndex] = { ...item, qty: item.qty - 1 };
          return newItems;
        } else {
          // Remove the item if its quantity is 1
          return newItems.filter((_, index) => index !== existingNewItemIndex);
        }
      }
      return currentItems;
    });
  };

  const handleReverseQty = async (item: MenuItem) => {
    try {
      if (item.isBilled === 1 && !reverseQtyMode) {
        toast.error('Reverse quantity mode must be activated for billed items.');
        return;
      }

      if (!selectedTable || !item.txnDetailId) {
        toast.error('Unable to process reverse quantity - missing table or item details');
        return;
      }

      // Update the item quantity in the frontend state
      setItems(currentItems => {
        const newItems = [...currentItems];
        const itemIndex = newItems.findIndex(i => i.txnDetailId === item.txnDetailId);

        if (itemIndex > -1) {
          const currentItem = newItems[itemIndex];
          if (currentItem.qty > 1) {
            // Decrease quantity by 1
            newItems[itemIndex] = { ...currentItem, qty: currentItem.qty - 1 };
            if (item.isBilled === 1) {
              toast.success(`Reversed 1 qty of "${item.name}"`);
            } else {
              toast.success(`Quantity decreased for "${item.name}" (${currentItem.qty - 1} remaining)`);
            }

            // Add to reverse quantity items for KOT printing
            setReverseQtyItems(prev => {
              const existingIndex = prev.findIndex(i => i.txnDetailId === item.txnDetailId);
              if (existingIndex > -1) {
                // Update existing reverse item
                const updated = [...prev];
                updated[existingIndex] = { ...updated[existingIndex], qty: updated[existingIndex].qty + 1 };
                return updated;
              } else {
                // Add new reverse item
                return [...prev, { ...item, qty: 1, isReverse: true }];
              }
            });
          } else {
            // Remove item if quantity is 1 (will become 0)
            newItems.splice(itemIndex, 1);
            if (item.isBilled === 1) {
              toast.success(`Reversed 1 qty of "${item.name}"`);
            } else {
              toast.success(`"${item.name}" removed from order`);
            }

            // Add to reverse quantity items for KOT printing
            setReverseQtyItems(prev => {
              const existingIndex = prev.findIndex(i => i.txnDetailId === item.txnDetailId);
              if (existingIndex > -1) {
                // Update existing reverse item
                const updated = [...prev];
                updated[existingIndex] = { ...updated[existingIndex], qty: updated[existingIndex].qty + 1 };
                return updated;
              } else {
                // Add new reverse item
                return [...prev, { ...item, qty: 1, isReverse: true }];
              }
            });
          }
        }
        return newItems;
      });

      // Refresh items for billed orders to reflect changes
      if (item.isBilled === 1 && selectedTableId) {
        refreshItemsForTable(selectedTableId);
      }

      // Also update the database (optional - for persistence)
      try {
        const response = await fetch('http://localhost:3001/api/TAxnTrnbill/reverse-quantity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            txnDetailId: item.txnDetailId,
            userId: user?.id, // Add the user ID here
          }),
        });

        if (!response.ok) {
          console.log('Database update failed, but frontend update succeeded');
        }
      } catch (dbError) {
        console.log('Database update failed, but frontend update succeeded');
      }

    } catch (error) {
      console.error('Error processing reverse quantity:', error);
      toast.error('Error processing reverse quantity');
    }
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
      // Fetch outlet settings for Reverse Qty Mode
      const fetchReverseQtySetting = async () => {
        try {
          const res = await fetch(`http://localhost:3001/api/outlets/outlet-settings/${selectedOutletId}`);
          if (res.ok) {
            const settings = await res.json();
            if (settings && settings.ReverseQtyMode !== undefined) {
              setReverseQtyConfig(settings.ReverseQtyMode === 1 ? 'PasswordRequired' : 'NoPassword');
            } else {
              setReverseQtyConfig('PasswordRequired'); // Default to password required
            }
          } else {
            setReverseQtyConfig('PasswordRequired'); // Default to password required
          }
        } catch (error) {
          console.error("Failed to fetch outlet settings for Reverse Qty Mode", error);
          setReverseQtyConfig('PasswordRequired'); // Default to password required
        }
      };
      fetchReverseQtySetting();
    }
  }, [selectedOutletId]);

  useEffect(() => {
    if (selectedOutletId) {
      const fetchPaymentModes = async () => {
        try {
          const res = await fetch(`http://localhost:3001/api/payment-modes/by-outlet/${selectedOutletId}`);
          if (res.ok) {
            const data = await res.json();
            setOutletPaymentModes(data);
          } else {
            setOutletPaymentModes([]);
          }
        } catch (error) {
          console.error("Failed to fetch payment modes", error);
          setOutletPaymentModes([]);
        }
      };
      fetchPaymentModes();
    } else {
      setOutletPaymentModes([]);
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



  const handlePrintBill = async () => {
    if (items.length === 0) {
      toast.error('No items to print a bill for.');
      return;
    }

    if (!currentTxnId) {
      toast.error('Cannot print bill. No transaction ID found. Please save the KOT first.');
      return;
    }

    setLoading(true);
    try {
      // 1. Call the new endpoint to mark the bill as billed
      const printResponse = await fetch(`http://localhost:3001/api/TAxnTrnbill/${currentTxnId}/mark-billed`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      const printResult = await printResponse.json();

      if (!printResult.success) {
        throw new Error(printResult.message || 'Failed to mark bill as printed.');
      }

      toast.success('Bill marked as printed!');

      // Set the TxnNo from the API response to update the UI for printing
      if (printResult.data && printResult.data.TxnNo) {
        setTxnNo(printResult.data.TxnNo);
      }

      // 2. Print the bill preview from the existing data
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const contentToPrint = document.getElementById('bill-preview');
        if (contentToPrint) {
          printWindow.document.write(contentToPrint.innerHTML);
          printWindow.document.close();
          printWindow.focus();
          // Use a small timeout to ensure the TxnNo is rendered before printing
          setTimeout(() => {
            printWindow.print();
          }, 100);
        }
      }


      // 3. Update table status to 'billed' (red, status=2)
      if (selectedTable) {
        setTableItems(prevTables =>
          prevTables.map(table =>
            table.table_name === selectedTable ? { ...table, status: 2 } : table
          )
        );
      }

      // 4. Update items in the UI to reflect their 'billed' state.
      setItems(prevItems => prevItems.map(item => ({ ...item, isNew: false, isBilled: 1 })));
    } catch (error: any) {
      console.error('Error printing bill:', error);
      toast.error(error.message || 'An error occurred while printing the bill.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintAndSaveKOT = async () => {
    try {
      const newItemsToKOT = items.filter(item => item.isNew);
      const reverseItemsToKOT = reverseQtyMode ? reverseQtyItems : [];


      // Check if we have any items to process (new items or reverse items)
      if (newItemsToKOT.length === 0 && reverseItemsToKOT.length === 0) {
        toast.error('No new items or reverse quantity items to save as KOT.');
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

      const newKotItemsPayload = newItemsToKOT.map(i => {
        // Calculate the change in quantity. If it's a new item, originalQty will be undefined.
        const qtyDelta = i.originalQty !== undefined ? i.qty - i.originalQty : i.qty;

        // Only include items where quantity has increased.
        // Decreases are handled by Re-KOT.
        if (qtyDelta <= 0) return null;

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
          NCName: i.isNCKOT ? i.NCName : null,
          NCPurpose: i.isNCKOT ? i.NCPurpose : null,
        };
      }).filter(Boolean) as any[];

      const reverseKotItemsPayload = reverseItemsToKOT.map(i => ({
        ItemID: i.id,
        Qty: -i.qty, // Negative quantity for reversal
        RuntimeRate: i.price,
        TableID: resolvedTableId || undefined,
        DeptID: resolvedDeptId ?? selectedDeptId ?? undefined,
        outletid: resolvedOutletId,
        CGST: 0,
        CGST_AMOUNT: 0,
        SGST: 0,
        SGST_AMOUNT: 0,
        IGST: 0,
        IGST_AMOUNT: 0,
        CESS: 0,
        CESS_AMOUNT: 0,
        HotelID: hotelId,
        isBilled: 0,
        isNCKOT: 0,
        NCName: null,
        NCPurpose: null,
      }));

      const combinedPayload = [...newKotItemsPayload, ...reverseKotItemsPayload];

      if (combinedPayload.length === 0) {
        toast.error('No new or reversed item quantities to save.');
        setLoading(false);
        return;
      }

      // Find the first NCKOT item to get the overall NCName and NCPurpose for the bill header
      const firstNCItem = newKotItemsPayload.find(item => item.isNCKOT);

      const kotPayload = {
        txnId: currentTxnId || 0,
        tableId: resolvedTableId,
        items: combinedPayload,
        outletid: resolvedOutletId,
        userId: userId,
        hotelId: hotelId,

        // Add NCName and NCPurpose to the main payload for the TAxnTrnbill header
        NCName: firstNCItem ? firstNCItem.NCName : null,
        NCPurpose: firstNCItem ? firstNCItem.NCPurpose : null,
        DiscPer: DiscPer,
        Discount: discount,
        DiscountType: DiscountType,
      };

      console.log('Sending payload to createKOT:', JSON.stringify(kotPayload, null, 2));
      const resp = await createKOT(kotPayload);
      if (resp?.success) {
        toast.success('KOT saved successfully!');

        // Update TxnNo and TxnID from the response
        if (resp.data) {
          setTxnNo(resp.data.TxnNo);
          setCurrentTxnId(resp.data.TxnID);
        }

        // Clear items after KOT save to reset the panel
        setItems([]);

        // Clear reverse items after successful save and deactivate Reverse Mode
        if (reverseItemsToKOT.length > 0) {
          setReverseQtyItems([]);
          setReverseQtyMode(false);
          setIsGroupedView(true); // Reset to grouped view after deactivating reverse mode
        }

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

        // Clear KOT number for settlement print
        setCurrentKOTNo(null);
        setCurrentKOTNos([]);

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
          // Clear table, stay on view, focus table input
          setSelectedTable(null);
          setCurrentKOTNo(null);
          setCurrentKOTNos([]);
          setTriggerFocusInDetails(c => c + 1); // Trigger focus in OrderDetails
        } else {
          // Option 2: Focus Mode OFF - Clear items and return to table grid view
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
  const handleF8PasswordSubmit = async (password: string, txnId?: string) => {
    if (!user?.token) {
      toast.error("Authentication token not found. Please log in again.");
      return;
    }

    const finalTxnId = txnId || currentTxnId;
    if (!finalTxnId) {
      setF8PasswordError("Transaction ID is missing. Cannot verify password.");
      return;
    }

    // Ensure only for billed orders
    if (!items.some(item => item.isBilled === 1)) {
      setF8PasswordError("Reverse quantity only available for billed orders.");
      return;
    }

    setF8PasswordLoading(true);
    setF8PasswordError('');
    try {
      const response = await fetch('http://localhost:3001/api/auth/verify-bill-creator-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          password,
          txnId: finalTxnId
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowF8PasswordModal(false);
        // Proceed with F8 action: activate reverse mode, set expanded view, refresh items, initialize reverseQtyItems
        setReverseQtyMode(true);
        setIsGroupedView(false);
        setReverseQtyItems([]); // Initialize empty for reversals
        // Refresh items to get latest net qty from backend
        if (selectedTableId) {
          try {
            await refreshItemsForTable(selectedTableId);
          } catch (refreshError) {
            console.error('Error refreshing items after F8 auth:', refreshError);
            toast.error('Failed to refresh items. Please try again.');
            return;
          }
        }
        toast.success('Reverse Qty Mode activated and expanded view shown.');
      } else {
        setF8PasswordError(data.message || 'Invalid password');
      }
    } catch (error) {
      console.error('F8 password verification error:', error);
      setF8PasswordError('An error occurred. Please try again.');
    } finally {
      setF8PasswordLoading(false);
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
      if (e.key === 'F8') {
        e.preventDefault();

        if (!selectedTable) {
          toast.error("Please select a table first.");
          return;
        }

        const isBilled = items.some(item => item.isBilled === 1);

        if (isBilled) {
          // Billed table: show password modal for admin verification
          setShowF8PasswordModal(true);
          return; // Stop further execution
        }

        // UNBILLED TABLE: Proceed with normal F8 functionality (outlet setting based)
        // Always fetch latest ReverseQtyMode from backend on F8 press for unbilled tables
        const fetchLatestReverseQtySettingForUnbilled = async () => {
          try {
            if (selectedOutletId) {
              const res = await fetch(`http://localhost:3001/api/outlets/outlet-settings/${selectedOutletId}`);
              if (res.ok) {
                const settings = await res.json();
                if (settings && settings.ReverseQtyMode !== undefined) {
                  const currentConfig = settings.ReverseQtyMode === 1 ? 'PasswordRequired' : 'NoPassword';
                  setReverseQtyConfig(currentConfig);

                  // Handle F8 based on latest backend value
                  if (currentConfig === 'PasswordRequired') {
                    setShowAuthModal(true);
                  } else {
                    setReverseQtyMode(prev => {
                      const newMode = !prev;
                      // Clear reverse quantity items when turning off reverse mode
                      if (!newMode) {
                        setReverseQtyItems([]);
                      } else {
                        // When activating reverse mode, also set to expanded view
                        setIsGroupedView(false);
                      }
                      toast.success(`Reverse Qty Mode ${newMode ? 'activated' : 'deactivated'}.`);
                      return newMode;
                    });
                  }
                } else {
                  // Default to password required if setting not found
                  setReverseQtyConfig('PasswordRequired');
                  setShowAuthModal(true);
                }
              } else {
                // Default to password required if API call fails
                setReverseQtyConfig('PasswordRequired');
                setShowAuthModal(true);
              }
            }
          } catch (error) {
            console.error("Failed to fetch latest outlet settings for Reverse Qty Mode", error);
            // Default to password required if error occurs
            setReverseQtyConfig('PasswordRequired');
            setShowAuthModal(true);
          }
        };
        fetchLatestReverseQtySettingForUnbilled();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [departments, selectedOutletId, items, selectedTable]);

  useEffect(() => {
    if (activeTab === 'Dine-in' && !showOrderDetails && tableSearchInputRef.current) {
      tableSearchInputRef.current.focus();
    }
  }, [activeTab, showOrderDetails]);

  useEffect(() => {
    console.log('State update - showOrderDetails:', showOrderDetails, 'selectedTable:', selectedTable);
  }, [showOrderDetails, selectedTable]);

  const handleApplyDiscount = async () => {
    if (!currentTxnId) {
      toast.error("Please save the KOT before applying a discount.");
      return;
    }

    let appliedDiscount = 0;
    let appliedDiscPer = 0;

    if (DiscountType === 1) { // Percentage
      if (discountInputValue < 0.5 || discountInputValue > 100 || isNaN(discountInputValue)) {
        toast.error('Discount percentage must be between 0.5% and 100%');
        return;
      }
      const discountThreshold = 20; // Configurable threshold
      if (discountInputValue > discountThreshold && user?.role_level !== 'superadmin' && user?.role_level !== 'hotel_admin') {
        toast.error('Discount > 20% requires manager approval');
        return;
      }
      appliedDiscPer = discountInputValue;
      appliedDiscount = (taxCalc.subtotal * discountInputValue) / 100;
    } else { // Amount
      if (discountInputValue <= 0 || discountInputValue > taxCalc.subtotal || isNaN(discountInputValue)) {
        toast.error(`Discount amount must be > 0 and <= subtotal (${taxCalc.subtotal.toFixed(2)})`);
        return;
      }
      appliedDiscPer = 0;
      appliedDiscount = discountInputValue;
    }

    setLoading(true);
    try {
      const payload = {
        discount: appliedDiscount,
        discPer: appliedDiscPer,
        discountType: DiscountType,
        tableId: selectedTableId,
        items: items, // Send current items to recalculate on backend
      };

      const response = await fetch(`http://localhost:3001/api/TAxnTrnbill/${currentTxnId}/discount`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to apply discount.');
      }

      toast.success('Discount applied successfully!');
      setShowDiscountModal(false);
       // Reset UI to go back to the table selection screen
      setItems([]);
      setSelectedTable(null);
      setShowOrderDetails(false);
      setCurrentKOTNo(null);
      setCurrentKOTNos([]);
      setTxnNo(null);
      
      if (selectedTableId) {
        refreshItemsForTable(selectedTableId);
      }

    } catch (error: any) {
      toast.error(error.message || 'An error occurred while applying the discount.');
    } finally {
      setLoading(false);
      setReason('');
    }
  };

  const handleDiscountKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setShowDiscountModal(false);
    if (e.key === 'Enter') handleApplyDiscount();
  };

  const handlePaymentAmountChange = (modeName: string, value: string) => {
    setPaymentAmounts(prev => ({ ...prev, [modeName]: value }));
  };

  const handlePaymentModeClick = (mode: PaymentMode) => {
    if (isMixedPayment) {
      // Mixed Payment Logic
      const currentTotalPaid = Object.values(paymentAmounts).reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
      const remaining = Math.max(0, grandTotal - currentTotalPaid);
      setSelectedPaymentModes(prev => {
        const isSelected = prev.includes(mode.mode_name);
        if (isSelected) {
          // Deselect: remove from list and clear amount
          const newAmounts = { ...paymentAmounts };
          delete newAmounts[mode.mode_name];
          setPaymentAmounts(newAmounts);
          return prev.filter(m => m !== mode.mode_name);
        } else {
          // Select: add to list and auto-fill with remaining balance
          setPaymentAmounts(prev => ({ ...prev, [mode.mode_name]: remaining.toFixed(2) }));
          return [...prev, mode.mode_name];
        }
      });
    } else {
      // Single Payment Logic
      setSelectedPaymentModes([mode.mode_name]);
      setPaymentAmounts({ [mode.mode_name]: grandTotal.toFixed(2) });
    }
  };

  const handleSettleAndPrint = async () => {
    if (!currentTxnId) {
      toast.error('Cannot settle bill. No transaction ID found.');
      return;
    }
    if (settlementBalance !== 0 || totalPaid === 0) {
      toast.error('Payment amount does not match the total due.');
      return;
    }

    setLoading(true);
    try {
      // 1. Construct the settlements payload
      const settlementsPayload = selectedPaymentModes.map(modeName => {
        const paymentModeDetails = outletPaymentModes.find(pm => pm.mode_name === modeName);
        return {
          PaymentTypeID: paymentModeDetails?.paymenttypeid,
          PaymentType: modeName,
          Amount: parseFloat(paymentAmounts[modeName]) || 0,
          OrderNo: TxnNo,
          HotelID: user?.hotelid,
          Name: user?.name, // Cashier/User name
        };
      });

      // 2. Call the settlement endpoint
      const response = await fetch(`http://localhost:3001/api/TAxnTrnbill/${currentTxnId}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settlements: settlementsPayload }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to settle bill.');
      }

      toast.success('Settlement successful and bill printed!');

      // 3. Reset UI states for the next order
      setItems([]);
      setSelectedTable(null);
      setShowOrderDetails(false);
      setPaymentAmounts({});
      setSelectedPaymentModes([]);
      setIsMixedPayment(false);
      setShowSettlementModal(false);
      setBillActionState('initial');
      fetchTableManagement(); // Refresh table statuses
      setCurrentKOTNo(null);
      setCurrentKOTNos([]);
      setTxnNo(null);

    } catch (error: any) {
      console.error('Error settling bill:', error);
      toast.error(error.message || 'An error occurred during settlement.');
    } finally {
      setLoading(false);
    }
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

  const handleSaveNCKOT = async () => {
    if (!currentTxnId) {
      toast.error('No active transaction found. Please save a KOT first.');
      return;
    }
    if (!ncName || !ncPurpose) {
      toast.error('NC Name and Purpose are required.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/TAxnTrnbill/${currentTxnId}/apply-nckot`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ NCName: ncName, NCPurpose: ncPurpose }),
      });

      const result = await response.json();
      if (result.success) {
        toast.success('NCKOT applied successfully to all items.');
        // Clear UI similar to Print & Save KOT
        setItems([]);
        setSelectedTable(null);
        setShowOrderDetails(false);
        setShowNCKOTModal(false);
      } else {
        throw new Error(result.message || 'Failed to apply NCKOT.');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while applying NCKOT.');
    } finally {
      setLoading(false);
      setNcName('');
      setNcPurpose('');
    }
  };

  const handleCloseAuthModal = () => {
    setShowAuthModal(false);
    setAuthPassword('');
    setAuthError('');
  };

  const handleAuth = () => {
    // NOTE: This uses a hardcoded password. For production, this should be validated against a user's credentials.
    if (authPassword === 'admin123') {
      setReverseQtyMode(prev => {
        const newMode = !prev;
        // Clear reverse quantity items when turning off reverse mode
        if (!newMode) {
          setReverseQtyItems([]);
        } else {
          // When activating reverse mode, also set to expanded view
          setIsGroupedView(false);
        }
        return newMode;
      });
      handleCloseAuthModal();
    } else {
      setAuthError('Invalid Password');
    }
  };

  if (showKotTransfer) {
    return <KotTransfer onCancel={() => setShowKotTransfer(false)} />;
  }
  return (
    <div className="container-fluid p-0 m-0 fade-in" style={{ height: '100vh' }}>
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
                // If in reverse mode, show reverse quantity items
                if (reverseQtyMode && reverseQtyItems.length > 0) {
                  return (
                    <>
                      <div style={{
                        textAlign: 'center',
                        fontWeight: 'bold',
                        color: '#dc3545',
                        marginBottom: '10px',
                        padding: '5px',
                        backgroundColor: '#f8d7da',
                        border: '1px solid #f5c6cb',
                        borderRadius: '4px'
                      }}>
                        REVERSE QUANTITY ITEMS
                      </div>
                      {reverseQtyItems.map((item, index) => (
                        <div key={`reverse-${item.txnDetailId}-${index}`} style={{
                          display: 'grid',
                          gridTemplateColumns: '30px 1fr 50px 70px 80px',
                          paddingBottom: '4px',
                          marginBottom: '4px',
                          backgroundColor: '#fff3cd',
                          border: '1px solid #ffeaa7',
                          borderRadius: '4px',
                          padding: '8px'
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
                          <div style={{ textAlign: 'center', color: '#dc3545', fontWeight: 'bold' }}>
                            -{item.qty}
                          </div>
                          <div style={{ textAlign: 'right' }}>{item.price.toFixed(2)}</div>
                          {formData.show_item_price && (
                            <div style={{ textAlign: 'right', color: '#dc3545', fontWeight: 'bold' }}>
                              -{(item.price * item.qty).toFixed(2)}
                            </div>
                          )}
                        </div>
                      ))}
                    </>
                  );
                } else {
                  // Normal KOT items
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
                }
              })()}

              <div style={{ borderBottom: '1px dashed #ccc', margin: '10px 0' }}></div>

              {/* Total Section */}
              {(() => {
                if (reverseQtyMode && reverseQtyItems.length > 0) {
                  // Calculate totals for reverse quantity items
                  const totalReverseQty = reverseQtyItems.reduce((sum, item) => sum + item.qty, 0);
                  const totalReverseSubtotal = reverseQtyItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

                  return (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '8px' }}>
                      <div style={{ color: '#dc3545' }}>Total Reverse Items: {totalReverseQty}</div>
                      {formData.show_item_price && <div style={{ color: '#dc3545' }}>-₹ {totalReverseSubtotal.toFixed(2)}</div>}
                    </div>
                  );
                } else {
                  // Normal KOT totals
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
                }
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
        <div style={{
          width: '80mm',
          margin: '0 auto',
          fontFamily: 'Courier New, monospace',
          fontSize: '10pt',
          lineHeight: '1.2',
          padding: '10px',
          color: '#000'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <div style={{ fontWeight: 'bold', fontSize: '12pt', marginBottom: '5px' }}>
              {user?.outlet_name || (formData as any).outlet_name || 'RESTAURANT'}
            </div>
            <div style={{ fontSize: '8pt', marginBottom: '2px' }}>
              {user?.outlet_address || (formData as any).address || '221-524-07-5215007, Kolhapur Road, Kolhapur 416416'}
            </div>
            <div style={{ fontSize: '8pt', marginBottom: '2px' }}>
              Email: {(formData as any).email || ''}
            </div>
            <div style={{ fontSize: '8pt', marginBottom: '2px' }}>
              Website: {(formData as any).website || ''}
            </div>
            {(formData as any).show_phone_on_bill && (
              <div style={{ fontSize: '8pt', marginBottom: '2px' }}>
                Phone: {(formData as any).show_phone_on_bill || ''}
              </div>
            )}

            <div style={{ fontSize: '8pt', marginBottom: '2px' }}>
              FSSAI: {(formData as any).fssai_no || ''}
            </div>
            {(formData as any).show_upi_qr && (formData as any).upi_id && (
              <div style={{ fontSize: '8pt', marginBottom: '2px' }}>
                UPI ID: {(formData as any).upi_id || ''}
              </div>
            )}
            {(formData as any).field1 && (
              <div style={{ fontSize: '8pt', marginBottom: '2px' }}>
                {(formData as any).field1}
              </div>
            )}
            {(formData as any).field2 && (
              <div style={{ fontSize: '8pt', marginBottom: '2px' }}>
                {(formData as any).field2}
              </div>
            )}
            {(formData as any).field3 && (
              <div style={{ fontSize: '8pt', marginBottom: '2px' }}>
                {(formData as any).field3}
              </div>
            )}
            {(formData as any).field4 && (
              <div style={{ fontSize: '8pt', marginBottom: '2px' }}>
                {(formData as any).field4}
              </div>
            )}
          </div>

          <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '5px 0' }} />

          {/* Bill Details Row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: '10px',
            marginBottom: '10px',
            fontSize: '9pt',
            textAlign: 'center'
          }}>
            <div><strong>Date</strong><br />{new Date().toLocaleDateString('en-GB')}</div>
            <div><strong>Bill No.</strong><br />{(formData as any).bill_prefix || ''}{TxnNo || ''}</div>
            <div><strong>Table No.</strong><br />{selectedTable || '4'}</div>
            <div><strong>Time</strong><br />{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '5px 0' }} />

          {/* Items Table */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '20px 2fr 30px 40px 50px',
              gap: '5px',
              fontWeight: 'bold',
              borderBottom: '1px solid #000',
              paddingBottom: '2px',
              marginBottom: '5px',
              fontSize: '9pt'
            }}>
              <div>#</div>
              <div>Description</div>
              <div style={{ textAlign: 'right' }}>Qty</div>
              <div style={{ textAlign: 'right' }}>Rate</div>
              <div style={{ textAlign: 'right' }}>Amount</div>
            </div>
            {Object.values(
              items.reduce((acc: Record<string, MenuItem>, item) => {
                if (!acc[item.name]) {
                  acc[item.name] = { ...item, qty: 0 };
                }
                acc[item.name].qty += item.qty;
                return acc;
              }, {} as Record<string, MenuItem>)
            ).map((item: any, index) => (
              <div key={item.id} style={{
                display: 'grid',
                gridTemplateColumns: '20px 2fr 30px 40px 50px',
                gap: '5px',
                padding: '2px 0',
                fontSize: '9pt'
              }}>
                <div>{index + 1}</div>
                <div>{item.name}</div>
                <div style={{ textAlign: 'right' }}>{item.qty}</div>
                <div style={{ textAlign: 'right' }}>{item.price.toFixed(2)}</div>
                <div style={{ textAlign: 'right' }}>{(item.price * item.qty).toFixed(2)}</div>
              </div>
            ))}
          </div>

          <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '5px 0' }} />

          {/* Totals */}
          <div style={{ textAlign: 'right', fontSize: '9pt', marginBottom: '5px' }}>
            {discount > 0 && (
              <div style={{ marginBottom: '2px' }}>
                Discount: Rs. {discount.toFixed(2)}
              </div>
            )}
            <div style={{ marginBottom: '2px' }}>
              <strong>Taxable Value:</strong> Rs. {(taxCalc.subtotal - discount).toFixed(2)}
            </div>
            {taxCalc.cgstAmt > 0 && (
              <div style={{ marginBottom: '2px' }}>
                CGST @{taxRates.cgst}%: Rs. {taxCalc.cgstAmt.toFixed(2)}
              </div>
            )}
            {taxCalc.sgstAmt > 0 && (
              <div style={{ marginBottom: '2px' }}>
                SGST @{taxRates.sgst}%: Rs. {taxCalc.sgstAmt.toFixed(2)}
              </div>
            )}
            {taxCalc.igstAmt > 0 && (
              <div style={{ marginBottom: '2px' }}>
                IGST @{taxRates.igst}%: Rs. {taxCalc.igstAmt.toFixed(2)}
              </div>
            )}
            {taxCalc.cessAmt > 0 && (
              <div style={{ marginBottom: '2px' }}>
                CESS @{taxRates.cess}%: Rs. {taxCalc.cessAmt.toFixed(2)}
              </div>
            )}
            <div style={{ fontWeight: 'bold', fontSize: '10pt', borderTop: '1px solid #000', paddingTop: '5px' }}>
              &amp; GRAND TOTAL Rs. {(taxCalc.grandTotal - discount).toFixed(2)}
            </div>
          </div>

          {/* Note */}
          {(formData as any).note && (
            <div style={{ textAlign: 'center', fontSize: '8pt', marginTop: '5px' }}>
              {(formData as any).note}
            </div>
          )}

          {/* Footer */}
          <div style={{ textAlign: 'center', fontSize: '8pt', marginTop: '10px' }}>
            {(formData as any).footer_note || 'STAY SAFE, STAY HEALTHY'}
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
                  reverseQtyMode={reverseQtyMode}
                  isBilled={items.some(item => item.isBilled === 1)}
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
              <div className="d-flex justify-content-between align-items-center bg-white border rounded p-2">
                <span className="fw-bold flex-grow-1 text-center">{getKOTLabel()}</span>
                {reverseQtyMode && <span className="badge bg-danger me-2">Reverse Qty Mode: Active</span>}
                <button
                  className="btn btn-sm btn-outline-secondary p-1"
                  style={{ lineHeight: 1 }}
                  onClick={() => setIsGroupedView(prev => !prev)}
                  title={isGroupedView ? "Show Individual Items (Expanded)" : "Group Same Items"}
                >
                  {isGroupedView ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path fillRule="evenodd" d="M5 11.5a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5m0-4a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9a.5.5 0 0 1-.5-.5M2 4.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5M2 8.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5m0 4a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 0 1h-1a.5.5 0 0 1-.5-.5" /></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M1.5 1.5A.5.5 0 0 1 2 .5h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5H2a.5.5 0 0 1-.5-.5v-2zM1 6.5A.5.5 0 0 1 1.5 6h13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5H1.5a.5.5 0 0 1-.5-.5v-2zm0 5A.5.5 0 0 1 1.5 11h13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5H1.5a.5.5 0 0 1-.5-.5v-2z" /></svg>
                  )}
                </button>
              </div>
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
                  const sortedItems: MenuItem[] = [...items].sort((a, b) => {
                    const kotA = a.kotNo ?? Infinity;
                    const kotB = b.kotNo ?? Infinity;
                    if (kotA === kotB) {
                      return (a.txnDetailId ?? Infinity) - (b.txnDetailId ?? Infinity);
                    }
                    return kotA - kotB;
                  });

                  const itemsToDisplay = isGroupedView
                    ? Object.values(
                      sortedItems.reduce((acc, item, index) => { // <-- 'index' is added here
                        const key = item.isNew ? `new-${item.id}-${index}` : `${item.id}-${item.price}`;
                        if (!acc[key]) {
                          acc[key] = { ...item, displayQty: 0, canEdit: false, kotNo: item.kotNo };
                        }
                        acc[key].displayQty += item.qty;
                        if (item.isNew) {
                          acc[key].canEdit = true;
                        }
                        return acc;
                      }, {} as Record<string, MenuItem & { displayQty: number; canEdit: boolean; kotNo?: number }>)
                    )
                    : sortedItems;

                  const kotColorMap = new Map<number, string>();
                  let colorIndex = 0;

                  sortedItems.forEach(item => {
                    if (item.kotNo && !kotColorMap.has(item.kotNo)) {
                      kotColorMap.set(item.kotNo, kotColors[colorIndex % kotColors.length]);
                      colorIndex++;
                    }
                  });

                  return itemsToDisplay.map((item, index) => {
                    const isGroupedItem = 'displayQty' in item;
                    const displayQty = isGroupedItem ? (item as any).displayQty : item.qty;
                    const isEditable = isGroupedItem ? (item as any).canEdit : !!item.isNew;
                    const isReverseClickable = reverseQtyMode && !isEditable && displayQty > 0;

                    let backgroundColor = 'transparent';
                    if (!isGroupedItem) {
                      const originalItem = item as MenuItem;
                      backgroundColor = originalItem.isNew
                        ? '#d4edda' // Light green for new items
                        : originalItem.kotNo
                          ? kotColorMap.get(originalItem.kotNo) ?? 'transparent' // Use a default value if the value is undefined
                          : 'transparent';
                    } else {
                      const groupedItem = item as any;
                      backgroundColor = groupedItem.canEdit
                        ? '#d4edda' // Light green for new items
                        : groupedItem.kotNo
                          ? kotColorMap.get(groupedItem.kotNo) ?? 'transparent'
                          : 'transparent';
                    }

                    return (
                      <div
                        key={isGroupedItem ? `${item.id}-${item.price}-${index}` : (item.txnDetailId ?? `new-${item.id}-${index}`)}
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
                            onClick={() => {
                              if (isEditable) {
                                handleDecreaseQty(item.id);
                              } else if (isReverseClickable) {
                                handleReverseQty(item as MenuItem);
                              }
                            }}
                            disabled={!isEditable && !isReverseClickable}
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
                            value={displayQty}
                            readOnly={isGroupedItem || !isEditable}
                            onChange={(e) => {
                              if (isGroupedItem || !isEditable) return;
                              const newQty = parseInt(e.target.value) || 0;
                              const originalItem = item as MenuItem;
                              if (newQty <= 0) {
                                // remove this specific item
                                setItems(items.filter(i => i !== originalItem));
                              } else {
                                setItems(
                                  items.map((i) =>
                                    i === originalItem ? { ...i, qty: newQty } : i
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
                            disabled={!isEditable}
                          >
                            +
                          </button>
                        </div>
                        <div className="text-center">
                          <div>{(item.price * displayQty).toFixed(2)}</div>
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
              {/* Reversed Items Section - Only in Expanded View */}
              {!isGroupedView && reversedItems.length > 0 && (
                <>
                  <div
                    className="text-center fw-bold p-1"
                    style={{
                      backgroundColor: '#f8d7da',
                      color: '#b71c1c',
                      borderTop: '1px solid #dee2e6',
                      borderBottom: '1px solid #dee2e6',
                    }}
                  >
                    Reversed Items
                  </div>
                  {reversedItems.map((item, index) => (
                      <div
                        key={`reversed-${item.ReversalLogID}-${index}`}
                        className="border-bottom"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr 1fr',
                          padding: '0.25rem',
                          alignItems: 'center',
                          backgroundColor: '#f8d7da', // Light red
                          color: '#721c24', // Darker red
                        }}
                      >
                        <span style={{ textAlign: 'left' }}>{item.name} <span className="badge bg-danger fw-bold">Reversed</span></span>
                        <div className="text-center d-flex justify-content-center align-items-center gap-2">
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ padding: '0 5px', lineHeight: '1' }}
                            disabled={true}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            value={item.qty}
                            readOnly={true}
                            className="border rounded text-center no-spinner"
                            style={{ width: '40px', height: '16px', fontSize: '0.75rem', padding: '0' }}
                            min="0"
                            max="999"
                          />
                          <button
                            className="btn btn-success btn-sm"
                            style={{ padding: '0 5px', lineHeight: '1' }}
                            disabled={true}
                          >
                            +
                          </button>
                        </div>
                        <div className="text-center">
                          <div>-{(item.price * item.qty).toFixed(2)}</div>
                          <div style={{ fontSize: '0.75rem', color: '#6c757d', width: '50px', height: '16px', margin: '0 auto' }}>
                            ({item.price.toFixed(2)})
                          </div>
                        </div>
                      </div>
                  ))}
                </>
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
                        {/* Reverse Qty Mode Button */}
                        <Button
                          variant={reverseQtyMode ? "danger" : "warning"}
                          className="rounded-circle p-0 d-flex justify-content-center align-items-center"
                          style={{ width: '32px', height: '32px' }}
                          onClick={() => {
                            // Always fetch latest ReverseQtyMode from backend on button click
                            const fetchLatestReverseQtySetting = async () => {
                              try {
                                if (selectedOutletId) {
                                  const res = await fetch(`http://localhost:3001/api/outlets/outlet-settings/${selectedOutletId}`);
                                  if (res.ok) {
                                    const settings = await res.json();
                                    if (settings && settings.ReverseQtyMode !== undefined) {
                                      const currentConfig = settings.ReverseQtyMode === 1 ? 'PasswordRequired' : 'NoPassword';
                                      setReverseQtyConfig(currentConfig);

                                      // Handle button click based on latest backend value
                                      if (currentConfig === 'PasswordRequired') {
                                        setShowAuthModal(true);
                                      } else {
                                        setReverseQtyMode(prev => {
                                          const newMode = !prev;
                                          // Clear reverse quantity items when turning off reverse mode
                                          if (!newMode) {
                                            setReverseQtyItems([]);
                                          }
                                          return newMode;
                                        });
                                      }
                                    } else {
                                      // Default to password required if setting not found
                                      setReverseQtyConfig('PasswordRequired');
                                      setShowAuthModal(true);
                                    }
                                  } else {
                                    // Default to password required if API call fails
                                    setReverseQtyConfig('PasswordRequired');
                                    setShowAuthModal(true);
                                  }
                                }
                              } catch (error) {
                                console.error("Failed to fetch latest outlet settings for Reverse Qty Mode", error);
                                // Default to password required if error occurs
                                setReverseQtyConfig('PasswordRequired');
                                setShowAuthModal(true);
                              }
                            };
                            fetchLatestReverseQtySetting();
                            setShowOptions(false);
                          }}
                          title="Reverse Qty Mode"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z" />
                            <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z" />
                          </svg>
                        </Button>

                        {/* KOT Transfer Button */}
                        <Button
                          variant="info"
                          className="rounded-circle p-0 d-flex justify-content-center align-items-center"
                          style={{ width: '32px', height: '32px' }}
                          onClick={() => {
                            setShowOptions(false);
                            setShowKotTransfer(true);
                          }}
                          title="KOT Transfer"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3z"/>
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
                  {discount > 0 && (
                    <div className="d-flex justify-content-between"><span>Discount ({DiscountType === 1 ? `${DiscPer}%` : 'Amt'})</span><span>- {discount.toFixed(2)}</span></div>
                  )}
                  {revKotTotal > 0 && (
                    <div className="d-flex justify-content-between text-danger"><span>RevKOT</span><span>- {revKotTotal.toFixed(2)}</span></div>
                  )}
                  <hr className="my-2" />
                  <div className="d-flex justify-content-between align-items-center bg-success text-white rounded p-1">
                    <span className="fw-bold">Grand Total</span>
                    <div>
                      <span className="fw-bold me-2">{(taxCalc.grandTotal - discount - revKotTotal).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="d-flex justify-content-center gap-2 mt-2">
                  {hasModifications ? (
                    <button
                      className="btn btn-dark rounded"
                      onClick={handlePrintAndSaveKOT}
                      disabled={items.length === 0 || !!invalidTable}
                    >
                      Print & Save KOT
                    </button>
                  ) : billActionState === 'initial' ? (
                    <Button variant="primary" onClick={() => setBillActionState('printOrSettle')} disabled={items.length === 0}>
                      🖨️ Print Bill
                    </Button>
                  ) : (
                    <>
                      <Button variant="primary" onClick={handlePrintBill} disabled={items.length === 0}>
                        🖨️ Print Bill
                      </Button>
                      <Button variant="success" onClick={() => setShowSettlementModal(true)} disabled={items.length === 0}>
                        💳 Settle & Print
                      </Button>
                    </>
                  )}
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

          <Modal show={showDiscountModal} onHide={() => setShowDiscountModal(false)} centered onShow={() => {
            if (DiscountType === 1) {
              setDiscountInputValue(DiscPer);
            } else {
              setDiscountInputValue(discount);
            }
            const discountInput = document.getElementById('discountInput') as HTMLInputElement; if (discountInput) discountInput.focus();
          }}>
            <Modal.Header closeButton><Modal.Title>Apply Discount</Modal.Title></Modal.Header>
            <Modal.Body>
              <div className="mb-3">
                <label className="form-label">Discount Type</label>
                <select className="form-control" value={DiscountType} onChange={(e) => setDiscountType(Number(e.target.value))}>
                  <option value={1}>Percentage</option>
                  <option value={0}>Amount</option>
                </select>
              </div>
              <div className="mb-3">
                <label htmlFor="discountInput" className="form-label">{DiscountType === 1 ? 'Discount Percentage (0.5% - 100%)' : 'Discount Amount'}</label>
                <input
                  type="number"
                  id="discountInput"
                  className="form-control"
                  value={discountInputValue}
                  onChange={(e) => setDiscountInputValue(parseFloat(e.target.value) || 0)}
                  onKeyDown={handleDiscountKeyDown}
                  step={DiscountType === 1 ? "0.5" : "0.01"}
                  min={DiscountType === 1 ? "0.5" : "0"}
                  max={DiscountType === 1 ? "100" : ""}
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

          {/* Settlement Modal */}

          {/* Main Settlement Modal */}
          <Modal
            show={showSettlementModal}
            onHide={() => setShowSettlementModal(false)}
            centered
            size="lg"
          >
            {/* Header */}
            <Modal.Header closeButton className="border-0">
              <Modal.Title className="fw-bold text-dark">Payment Mode</Modal.Title>
            </Modal.Header>

            {/* Body */}
            <Modal.Body className="bg-light">
              {/* Bill Summary */}
              <div className="p-4 mb-4 bg-white rounded shadow-sm text-center">
                <h6 className="text-secondary mb-2">Total Amount Due</h6>
                <div className="fw-bold display-5 text-dark">
                  ₹{grandTotal.toFixed(2)}
                </div>
              </div>

              {/* Mixed Payment Toggle */}
              <div className="d-flex justify-content-end mb-3">
                <Form.Check
                  type="switch"
                  id="mixed-payment-switch"
                  label="Mixed Payment"
                  checked={isMixedPayment}
                  onChange={(e) => {
                    setIsMixedPayment(e.target.checked);
                    setSelectedPaymentModes([]);
                    setPaymentAmounts({});
                  }}
                />
              </div>

              {/* Payment Modes */}
              <Row xs={1} md={2} className="g-3">
                {outletPaymentModes.map((mode) => (
                  <Col key={mode.id}>
                    <Card
                      onClick={() => handlePaymentModeClick(mode)}
                      className={`text-center h-100 shadow-sm border-0 ${selectedPaymentModes.includes(mode.mode_name)
                        ? "border border-primary"
                        : ""
                        }`}
                      style={{
                        cursor: "pointer",
                        transition: "transform 0.2s ease, box-shadow 0.2s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.transform = "translateY(-4px)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.transform = "translateY(0)")
                      }
                    >
                      <Card.Body>
                        <Card.Title className="fw-semibold">
                          {mode.mode_name}
                        </Card.Title>

                        {/* Amount Input */}
                        {selectedPaymentModes.includes(mode.mode_name) && (
                          <Form.Control
                            type="number"
                            placeholder="0.00"
                            value={paymentAmounts[mode.mode_name] || ""}
                            onChange={(e) =>
                              handlePaymentAmountChange(mode.mode_name, e.target.value)
                            }
                            onClick={(e) => e.stopPropagation()}
                            autoFocus={isMixedPayment}
                            readOnly={!isMixedPayment}
                            className="mt-2 text-center"
                          />
                        )}
                      </Card.Body>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* Payment Summary */}
              <div className="mt-4 p-3 bg-white rounded shadow-sm">
                <div className="d-flex justify-content-around fw-bold fs-5">
                  <div>
                    <span>Total Paid: </span>
                    <span className="text-primary">{totalPaid.toFixed(2)}</span>
                  </div>
                  <div>
                    <span>Balance Due: </span>
                    <span
                      className={
                        settlementBalance === 0 ? "text-success" : "text-danger"
                      }
                    >
                      {settlementBalance.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Validation Messages */}
                {settlementBalance !== 0 && (
                  <div className="text-danger mt-2 text-center small">
                    Total paid amount must match the grand total.
                  </div>
                )}
                {settlementBalance === 0 && totalPaid > 0 && (
                  <div className="text-success mt-2 text-center small">
                    ✅ Payment amount matches. Ready to settle.
                  </div>
                )}
              </div>
            </Modal.Body>

            {/* Footer */}
            <Modal.Footer className="border-0 justify-content-between">
              <Button
                variant="outline-secondary"
                onClick={() => setShowSettlementModal(false)}
                className="px-4"
              >
                Back
              </Button>
              <Button
                variant="success"
                onClick={handleSettleAndPrint}
                disabled={settlementBalance !== 0 || totalPaid === 0}
                className="px-4"
              >
                Settle & Print
              </Button>
            </Modal.Footer>
          </Modal>


          {/* F8PasswordModal */}

          <F8PasswordModal
            show={showF8PasswordModal}
            onHide={() => {
              setShowF8PasswordModal(false);
              setF8PasswordError(''); // Clear error on close
            }}
            onSubmit={handleF8PasswordSubmit}
            error={f8PasswordError}
            loading={f8PasswordLoading}
            txnId={currentTxnId?.toString()}
          />

          <Modal show={showAuthModal} onHide={handleCloseAuthModal} centered>
            <Modal.Header closeButton>
              <Modal.Title>Reverse Qty Mode</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="mb-3">
                <label>Password</label>
                <input type="password" className="form-control" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} onKeyPress={(e) => { if (e.key === 'Enter') handleAuth(); }} autoFocus />
              </div>
              {authError && <div className="text-danger">{authError}</div>}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleCloseAuthModal}>Cancel</Button>
              <Button variant="primary" onClick={handleAuth}>Submit</Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default Order;
