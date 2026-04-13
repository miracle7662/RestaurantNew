import { useState, useEffect, useRef, useCallback } from "react";
import { Button, Modal, Table, Card, Row, Col, Spinner } from "react-bootstrap";
import { fetchOutletsForDropdown, fetchCustomerByMobile } from "@/utils/commonfunction";
import { useAuthContext } from "@/common";
import { OutletData } from "@/common/api/outlet";
import AddCustomerModal from "./Customers";
import { toast } from "react-hot-toast";
import OrderDetails from "./OrderDetails";
import F8PasswordModal from "@/components/F8PasswordModal";
import KotTransfer from "./KotTransfer";
import SettlementModal from "./SettelmentModel";
import { fetchKotPrintSettings, } from '@/services/outletSettings.service';
import { applyKotSettings, } from '@/utils/applyOutletSettings';
import KotPreviewPrint from '../PrintReport/KotPrint';
import BillPreviewPrint from '../PrintReport/BillPrint';
import ReverseKotPrint from '../PrintReport/ReverseKotPrint';
import NCKotPrint from "../PrintReport/NcKotPrint";

import { fetchWaiterUsers, WaiterUser } from '@/services/user.service';
import TableManagementService from '@/common/api/tablemanagement';
import TableDepartmentService from '@/common/api/tabledepartment';
import OrderService from "@/common/api/order";
interface MenuItem {
  id: number;
  name: string;
  price: number;
  qty: number;
  isBilled: number;
  isNCKOT: number;
  NCName: string;
  NCPurpose: string;
  table_name?: string;
  isNew?: boolean; // Added to track new items not yet sent to KOT
  alternativeItem?: string;
  modifier?: string[];
  item_no?: number;
  originalQty?: number; // To track the original quantity from database
  kotNo?: number;
  txnDetailId?: number;
  isReverse?: boolean; // Added for reverse quantity items
  revQty?: number;
  order_tag?: string;
  variantId?: number; // Variant ID for variant items
  variantName?: string; // Variant name for variant items
}
interface ReversedMenuItem extends MenuItem {
  isReversed: true;
  reversalLogId: number;
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
  tableid: number;
  billNo?: string | null;
  billAmount?: number | null;
  billPrintedTime?: string | null;
  billPrintedDate?: Date | null;
}
interface DepartmentItem {
  departmentid: number;
  department_name: string;
  outletid: number;
}
interface PaymentMode {
  id?: number;
  paymenttypeid?: number;
  mode_name?: string;
  payment_mode_name?: string;
}

interface SettlementPayload {
  PaymentTypeID?: number;
  PaymentType: string;
  Amount: number;
  received_amount: number;
  refund_amount: number;
  TipAmount: number;
  OrderNo?: string;
  HotelID?: number;
  Name?: string;
  InsertDate: string;
  // 👇 Add these optional fields
  customerid?: number;
  customerName?: string;
  mobile?: string;
}
interface FormData {
  show_new_order_tag?: boolean;
  new_order_tag_label?: string;
  show_running_order_tag?: boolean;
  running_order_tag_label?: string;
}
const Order = () => {
  const [selectedTable, setSelectedTable] = useState<string | null>('');
  const [prevTable, setPrevTable] = useState<string | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [reverseQtyMode, setReverseQtyMode] = useState<boolean>(false); // New state for Reverse Qty Mode
  const [activeTab, setActiveTab] = useState<string>('Dine-in');
  const [showOrderDetails, setShowOrderDetails] = useState<boolean>(false);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('+91');
  const [showCountryOptions, setShowCountryOptions] = useState<boolean>(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState<boolean>(false);
  const [searchTable,] = useState<string>('');
  const [, setIsTableInvalid] = useState<boolean>(false);
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
  const [sourceTableId, setSourceTableId] = useState<number | null>(null);
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerid, setCustomerId] = useState<number | null>(null);
  const [, setCustomerAddress] = useState<string>('');
  const [taxRates, setTaxRates] = useState<{ cgst: number; sgst: number; igst: number; cess: number }>({ cgst: 0, sgst: 0, igst: 0, cess: 0 });
  const [taxCalc, setTaxCalc] = useState<{ subtotal: number; taxableValue: number; cgstAmt: number; sgstAmt: number; igstAmt: number; cessAmt: number; grandTotal: number }>({ subtotal: 0, taxableValue: 0, cgstAmt: 0, sgstAmt: 0, igstAmt: 0, cessAmt: 0, grandTotal: 0 });
  // 0 = exclusive (default), 1 = inclusive
  const [includeTaxInInvoice, setIncludeTaxInInvoice] = useState<number>(0);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [selectedOutletId, setSelectedOutletId] = useState<number | null>(null);
  const [showDiscountModal, setShowDiscountModal] = useState<boolean>(false);
  const [discount, setDiscount] = useState<number>(0);
  const [DiscPer,] = useState<number>(0);
  const [givenBy, setGivenBy] = useState<string>(user?.name || '');
  const [reason, setReason] = useState<string>('');
  const [persistentTxnId, setPersistentTxnId] = useState<number | null>(null);
  const [persistentTableId, setPersistentTableId] = useState<number>(0);
  const [DiscountType, setDiscountType] = useState<number>(1); // 1 for percentage, 0 for amount
  const [discountInputValue, setDiscountInputValue] = useState<number>(0);
  const [currentKOTNo, setCurrentKOTNo] = useState<number | null>(null);
  const [roundOffEnabled, setRoundOffEnabled] = useState<boolean>(false);
  const [roundOffTo, setRoundOffTo] = useState<number>(1); // Default to 1
  const [roundOffValue, setRoundOffValue] = useState<number>(0); // To store the calculated round-off value
  const [roundOffSettingsLoaded, setRoundOffSettingsLoaded] = useState<boolean>(false); // To track if round off settings are loaded
  const [currentKOTNos, setCurrentKOTNos] = useState<number[]>([]);
  const [currentTxnId, setCurrentTxnId] = useState<number | null>(null);
  const [orderNo, setOrderNo] = useState<string | null>(null); // New state for displaying Bill No
  const [, setBillPrintedTime] = useState<string | null>(null); // New state for Bill Printed Time
  const [, setNetAmount] = useState<number | null>(null); // New state for Net Amount
  const [formData, setFormData] = useState<FormData>({} as FormData);
  // New state for F8 password modal on billed tables
  const [showPrintBoth, setShowPrintBoth] = useState(false);
  const [showF8PasswordModal, setShowF8PasswordModal] = useState<boolean>(false);
  const [f8PasswordError, setF8PasswordError] = useState<string>('');
  const [f8PasswordLoading, setF8PasswordLoading] = useState<boolean>(false);

  const [showSaveReverseButton, setShowSaveReverseButton] = useState(false);
  const [isSaveReverseDisabled, setIsSaveReverseDisabled] = useState(false);
  // New state for F9 password modal for reversing orders

  // New state for F9 password modal
  const [showF9BilledPasswordModal, setShowCtrlF9BilledPasswordModal] = useState<boolean>(false);
  const [f9BilledPasswordError, setF9BilledPasswordError] = useState<string>('');
  const [f9BilledPasswordLoading, setF9BilledPasswordLoading] = useState<boolean>(false);

  // New state for Reverse Qty Mode authentication
  const [, setReverseQtyConfig] = useState<'NoPassword' | 'PasswordRequired'>('PasswordRequired'); // Config for Reverse Qty Mode
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authError, setAuthError] = useState<string>('');

  // State to track reverse quantity items for KOT printing
  const [reverseQtyItems, setReverseQtyItems] = useState<MenuItem[]>([]);
  const [reverseSnapshot, setReverseSnapshot] = useState<MenuItem[]>([]); // 🔥 FIX: Snapshot for print modal
  const [tableNameSnapshot, setTableNameSnapshot] = useState<string>('');

  // NEW: Reverse KOT Print Modal states
  const [showReverseKotPrintModal, setShowReverseKotPrintModal] = useState(false);
  const [reversePrintTrigger, setReversePrintTrigger] = useState(0);
  const [showNCKotPrintModal, setShowNCKotPrintModal] = useState(false);
  const [ncPrintItems, setNcPrintItems] = useState<MenuItem[]>([]);


  // New state for Focus Mode
  const [focusMode, setFocusMode] = useState<boolean>(() => {
    const savedFocusMode = localStorage.getItem('focusMode');
    return savedFocusMode ? JSON.parse(savedFocusMode) : false;
  });
  useEffect(() => {
    localStorage.setItem('focusMode', JSON.stringify(focusMode));
  }, [focusMode]);

  const [triggerFocusInDetails, setTriggerFocusInDetails] = useState<number>(0);

  // New state for floating button group and modals
  const [showOptions, setShowOptions] = useState<boolean>(false);
  const [isGroupedView, setIsGroupedView] = useState<boolean>(true); // State for grouped/expanded view
  const [showTaxModal, setShowTaxModal] = useState<boolean>(false);
  const [showNCKOTModal, setShowNCKOTModal] = useState<boolean>(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferMode, setTransferMode] = useState<"table" | "kot">("table");
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
  const [, setBillActionState] = useState<'initial' | 'printOrSettle'>('initial');
  const [outletPaymentModes, setOutletPaymentModes] = useState<PaymentMode[]>([]);
  const [showSettlementModal, setShowSettlementModal] = useState<boolean>(false);
  const [isMixedPayment, setIsMixedPayment] = useState<boolean>(false);
  const [paymentAmounts, setPaymentAmounts] = useState<Record<string, string>>({});
  const [selectedPaymentModes, setSelectedPaymentModes] = useState<string[]>([]);
  const [reversedItems, setReversedItems] = useState<ReversedMenuItem[]>([]);
  const [tip, setTip] = useState<number>(0);
  const [kotNote, setKotNote] = useState<string>('');
  const [billPrintItems, setBillPrintItems] = useState<MenuItem[]>([]);
 
  const [, setPrintKotNo] = useState<number | null>(null);

  // States for Pending Orders Modal (Pickup/Delivery)
  const [showPendingOrdersView, setShowPendingOrdersView] = useState<boolean>(false);
  const [pendingType, setPendingType] = useState<'pickup' | 'delivery' | null>(null);
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [loadingPending, setLoadingPending] = useState<boolean>(false);
  const [printTrigger, setPrintTrigger] = useState<number>(0);

  // New state for the Bill Preview Modal
  const [showBillPreviewModal, setShowBillPreviewModal] = useState<boolean>(false);
  const [errorPending, setErrorPending] = useState<string | null>(null);

  // New state for the Bill Print Modal
  const [showBillPrintModal, setShowBillPrintModal] = useState<boolean>(false);
  const [printThenSettleFlow, setPrintThenSettleFlow] = useState(false);

  const [printItems, setPrintItems] = useState<MenuItem[]>([]);
  const [showWaiterPaxModal, setShowWaiterPaxModal] = useState<boolean>(false);
  const [waiterUsers, setWaiterUsers] = useState<WaiterUser[]>([]);
  const [selectedWaiter, setSelectedWaiter] = useState<string>('');
  const [pax, setPax] = useState<number>(1);
  const [defaultWaiterId, setDefaultWaiterId] = useState<number | null>(null);
  const [defaultPax, setDefaultPax] = useState<number>(1);

  // Auto-set default waiter/pax when table selected + data ready (Dine-in tables)
  useEffect(() => {
    const isDineIn = activeTab === 'Dine-in';
    const isOtherTab = ['Pickup', 'Delivery', 'Quick Bill'].includes(activeTab);

    const shouldSetWaiter =
      defaultWaiterId &&
      waiterUsers.length > 0 &&
      !selectedWaiter &&
      (
        (isDineIn && selectedTable) ||        // ✅ Dine-in → table click
        (isOtherTab && items.length > 0)      // ✅ Others → item add
      );

    if (shouldSetWaiter) {
      const defaultWaiter = waiterUsers.find(w => w.userId === defaultWaiterId);

      if (defaultWaiter) {
        setSelectedWaiter(defaultWaiter.employee_name || defaultWaiter.username);
        // console.log(`✅ [${activeTab}] Auto-set waiter:`, defaultWaiter.employee_name || defaultWaiter.username);
      }

      setPax(defaultPax);
    }
  }, [
    activeTab,
    selectedTable,
    items,            // 🔥 important
    defaultWaiterId,
    waiterUsers,
    defaultPax,
    selectedWaiter
  ]);


  // Original: Set default when modal opens (manual override)
  useEffect(() => {
    if (showWaiterPaxModal) {
      if (defaultWaiterId) {
        const defaultWaiter = waiterUsers.find(waiter => waiter.userId === defaultWaiterId);
        if (defaultWaiter) {
          setSelectedWaiter(defaultWaiter.employee_name || defaultWaiter.username);
        }
      } else {
        setSelectedWaiter('');
      }
      setPax(defaultPax);
    }
  }, [showWaiterPaxModal, defaultWaiterId, defaultPax, waiterUsers]);
  const [, setIsPrintMode] = useState(false);
  const [showKotPreviewModal, setShowKotPreviewModal] = useState<boolean>(false);
  const [originalTableStatus, setOriginalTableStatus] = useState<number | null>(null);
  // States for Pending Order Form
  const [showBillingPage, setShowBillingPage] = useState<boolean>(false);
  const [quickBillData, setQuickBillData] = useState<any[]>([]);
  const [allBills, setAllBills] = useState<any[]>([]);
  // Pagination state for the "All Bills" table
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // You can make this configurable

  const resetBillingPanel = () => {
    setItems([]);
    setReversedItems([]);
    setReverseQtyItems([]);
    setReverseSnapshot([]); // 🔥 FIX: Clear snapshot

    // NEW: Reset reverse print modal
    setShowReverseKotPrintModal(false);


    setOrderNo(null);
    setBillPrintedTime(null);
    setNetAmount(null);
    setCurrentTxnId(null);
    setPersistentTxnId(null);
    setPersistentTableId(0);

    setCurrentKOTNo(null);
    setCurrentKOTNos([]);

    setDiscount(0);
    setDiscountInputValue(0);
    setDiscountType(1);

    setReverseQtyMode(false);
    setShowSaveReverseButton(false);
    setIsSaveReverseDisabled(false);

    setShowBillPreviewModal(false);
    setShowSettlementModal(false);
    setPrintItems([]);
    // 🔴 TABLE NAME CLEAR
    setSelectedTable(null);
  };

  // Function to apply rounding
  const applyRoundOff = (amount: number, roundTo: number) => {
    if (roundTo <= 0) return { roundedAmount: amount, roundOffValue: 0 };
    const roundedAmount = Math.round(amount / roundTo) * roundTo;
    const roundOffValue = Number((roundedAmount - amount).toFixed(2));
    return { roundedAmount, roundOffValue };
  };

  // Shared calculation function for round-off
  const calculateRoundOff = (grandTotal: number, roundOffTo: number, roundOffEnabled: boolean) => {
    console.log('Calculating round-off...', grandTotal, roundOffTo, roundOffEnabled, calculateRoundOff);
    if (roundOffEnabled) {
      const { roundedAmount, roundOffValue } = applyRoundOff(grandTotal, roundOffTo);
      return { finalGrandTotal: roundedAmount, appliedRoundOff: roundOffValue };
    }
    return { finalGrandTotal: grandTotal, appliedRoundOff: 0 };
  };

  const hasModifications = items.some(item => item.isNew) || reverseQtyItems.length > 0;
  const showKotButton = (selectedTable || ['Pickup', 'Delivery', 'Quick Bill'].includes(activeTab)) && hasModifications;
  const fetchAllBills = async (customFilters = {}) => {
    try {
      const response = await OrderService.getAllBills(customFilters, user);
      if (response.success) {
        setAllBills(response.data);
      }
    } catch (err) {
      // console.error("Error fetching all bills:", err);
    }
  };
  const refreshItemsForTable = useCallback(async (tableIdNum: number) => {
    if (tableIdNum <= 0) return;  // Virtual tables (pickup/delivery/quickbill) don't have backend items
    try {
      // Step 1: Try to fetch the latest billed (but not settled) bill
      const billedBillRes = await OrderService.getBilledBillByTable(tableIdNum);

      if (billedBillRes.success && billedBillRes.data) {
        const billedBillData = billedBillRes.data;
        if (billedBillData.details) {
          // Header properties are at top level (spread from ...bill in backend)
          const header = billedBillData.header || billedBillData;
          const details = billedBillData.details;
          const fetchedItems: MenuItem[] = details.map((item: any) => {
            const originalQty = Number(item.Qty) || 0;
            const revQty = Number(item.RevQty) || 0;
            return {
              id: item.ItemID,
              txnDetailId: item.TXnDetailID,
              item_no: item.item_no,
              name: item.ItemName || 'Unknown Item',
              price: item.RuntimeRate,
              qty: originalQty - revQty,
              isBilled: item.isBilled,
              revQty: revQty,
              isNCKOT: item.isNCKOT,
              NCName: '',
              NCPurpose: '',
              isNew: false,
              originalQty: originalQty,
              kotNo: item.KOTNo,
              variantId: item.VariantID || null,
              variantName: item.VariantName || null,
            };
          });

          setItems(fetchedItems);
          setPersistentTxnId(header.TxnID);
          setPersistentTableId(tableIdNum);
          setOrderNo(header.TxnNo); // Set TxnNo from the fetched bill header
          setCurrentTxnId(header.TxnID);
          setCurrentKOTNo(header.KOTNo || null); // A billed order might have a KOT no.
          setCurrentKOTNos(
            fetchedItems
              .map(item => item.kotNo)
              .filter((v, i, a): v is number => v !== undefined && a.indexOf(v) === i)
              .sort((a, b) => a - b)
          );

          // Set printed bill information
          if (header.BilledDate) {
            const date = new Date(header.BilledDate);
            const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000)); // Convert to IST
            setBillPrintedTime(istDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }));
          }
          setNetAmount(header.Amount || null);

          setBillActionState('printOrSettle');
          // Restore applied discount for billed tables
          if (header.Discount || header.DiscPer) {
            setDiscount(header.Discount || 0);
            setDiscountInputValue(header.DiscountType === 1 ? (header.DiscPer || 0) : (header.Discount ?? 0));
            setDiscountType(header.DiscountType !== undefined ? header.DiscountType : 1);
          } else {
            setDiscount(0);
            setDiscountInputValue(0);
          }
          // ✅ Restore customer details from billed transaction
          setCustomerName(header.CustomerName || '');
          setMobileNumber(header.MobileNo || '');
          if (header.customerid) setCustomerId(header.customerid);
          // ✅ Restore waiter details from billed transaction
          if (header.Steward) {
            setSelectedWaiter(header.Steward);
          }
          // Also fetch and set reversed items for the billed transaction
          const fetchedReversedItems: ReversedMenuItem[] = (billedBillData.reversedItems || []).map((item: any) => ({
            ...item,
            name: item.ItemName || item.itemName || 'Unknown Item',
            id: item.ItemID || item.itemId,
            price: item.RuntimeRate || item.price || 0,
            qty: Math.abs(item.Qty) || 1, // Ensure positive qty for display
            isReversed: true,
            ReversalLogID: item.ReversalLogID,
            status: 'Reversed',
            kotNo: item.KOTNo,
            isBilled: item.isBilled ?? 0,
            isNCKOT: item.isNCKOT ?? 0,
            NCName: item.NCName || '',
            NCPurpose: item.NCPurpose || '',
          }));
          setReversedItems(fetchedReversedItems);

          return; // Exit after successfully loading billed items
        } else {
          setBillActionState('initial'); // Reset if no billed bill is found
        }
      }

      // Step 2: If no billed bill found (e.g., 404), fetch unbilled items (existing logic)
      const unbilledItemsRes = await OrderService.getUnbilledItemsByTable(tableIdNum);

      if (unbilledItemsRes.success && unbilledItemsRes.data && Array.isArray(unbilledItemsRes.data.items)) {
        const fetchedItems: MenuItem[] = unbilledItemsRes.data.items.map((item: any) => {
          return {
            id: item.itemId,
            txnDetailId: item.txnDetailId,
            item_no: item.item_no,
            name: item.itemName,
            price: item.price,
            qty: item.netQty,
            isBilled: 0,
            isNCKOT: 0,
            NCName: '',
            NCPurpose: '',
            isNew: false,
            originalQty: item.qty,
            revQty: item.revQty,
            kotNo: item.kotNo,
            variantId: item.VariantID || null,
            variantName: item.VariantName || null,
          };
        });
        setCurrentKOTNo(unbilledItemsRes.data.kotNo ?? null);
        setPersistentTxnId(unbilledItemsRes.data.items.length > 0 ? unbilledItemsRes.data.items[0].txnId ?? null : null);
        setPersistentTableId(tableIdNum);
        // Set reversed items from the new API response field
        const fetchedReversedItems: ReversedMenuItem[] = (unbilledItemsRes.data.reversedItems || []).map((item: any) => ({
          id: item.ItemID,
          name: item.ItemName,
          price: item.price,
          qty: item.reversedQty,
          kotNo: item.kotNo,
          isReversed: true,
          reversalLogId: item.reversalLogId,
          status: 'Reversed',
          isBilled: item.isBilled ?? 0,
          isNCKOT: item.isNCKOT ?? 0,
          NCName: item.NCName || '',
          NCPurpose: item.NCPurpose || '',
        }));
        setReversedItems(fetchedReversedItems);
        setItems(fetchedItems);

        // Also set TxnNo if it exists on the unbilled transaction
        if (unbilledItemsRes.data.items.length > 0 && unbilledItemsRes.data.items[0].txnId) {
          setOrderNo(unbilledItemsRes.data.items[0].TxnNo || null);
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
        setOrderNo(null);
        setCurrentTxnId(null);
        // Do NOT clear persistent IDs here, as they are needed for reversal
        // setPersistentTxnId(null);
        // setPersistentTableId(null);
      }
      // If unbilled items were fetched, restore discount from the header
      if (unbilledItemsRes.success && unbilledItemsRes.data && unbilledItemsRes.data.header) {
        const { header } = unbilledItemsRes.data;
        if (header.Discount || header.DiscPer) {
          setDiscount(header.Discount || 0);
          setDiscountInputValue(header.DiscountType === 1 ? (header.DiscPer || 0) : (header.Discount || 0));
          setDiscountType(header.DiscountType !== undefined ? header.DiscountType : 1);
        }
        // ✅ Restore customer details from unbilled transaction
        setCustomerName(header.CustomerName || '');
        setMobileNumber(header.MobileNo || '');
        if (header.customerid) setCustomerId(header.customerid);
        // ✅ Restore waiter details from unbilled transaction
        if (header.Steward) {
          setSelectedWaiter(header.Steward);
        }
      } else {
        setItems([]);
        setReversedItems([]);
        setCurrentKOTNo(null);
        setCurrentKOTNos([]);
        setOrderNo(null);
        setCurrentTxnId(null);
        // Do NOT clear persistent IDs here, as they are needed for reversal
        // setPersistentTxnId(null);
        // setPersistentTableId(null);
      }
    } catch (error) {
      // console.error('Error fetching/refetching items for table:', error);
      setItems([]);
      setReversedItems([]);
      setOrderNo(null);
      // Do NOT clear persistent IDs on error if we are in reverse mode
      setCurrentKOTNo(null);
      setCurrentKOTNos([]);
      setCurrentTxnId(null);
      setBillActionState('initial'); // Reset on error
    }
  }, [setItems, setReversedItems, setCurrentKOTNo, setCurrentKOTNos, setCurrentTxnId]);

  const getTableButtonClass = (table: TableItem, isSelected: boolean) => {

    // Use status for coloring: 0=available, 1=occupied/KOT saved, 2=billed/printed, 4=pending
    switch (table.status) {
      case 1: return 'btn-success'; // KOT saved/occupied (green)
      case 0: return 'btn-outline-success'; // Default background (white/grey)
      case 2: return 'btn-danger'; // Billed/Printed (red)
      case 4: return 'table-pending-danger'; // Pending (#de3ef0)
      default: return 'btn-outline-success';
    }
  };
  const fetchTableManagement = async () => {
    setLoading(true);
    try {
      const response = await TableManagementService.list() as any;
      // console.log('Raw tableItems data:', JSON.stringify(response, null, 2));
      if (response.success && Array.isArray(response.data)) {
        let filteredData = response.data.filter((t: any) => t.hotelid === user.hotelid);
        if (user.role_level === 'outlet_user' && user.outletid) {
          filteredData = filteredData.filter((t: any) => t.outletid === Number(user.outletid));
        }
        if (filteredData.length > 0) {
          const formattedData = await Promise.all(
            filteredData.map(async (item: any) => {
              let status = Number(item.status);
              let billNo: string | null = null;
              let billAmount: number | null = null;
              let billPrintedTime: string | null = null;
              let billPrintedDate: Date | null = null;

              // Fetch bill status for each table from backend
              const res = await OrderService.getBillStatus(item.tableid);

              if (res.success && res.data) {
                const { isBilled, isSetteled, TxnNo, Amount, BilledDate } = res.data;

                if (isBilled === 1 && isSetteled !== 1) {
                  status = 2; // 🔴 red when billed but not settled
                  billNo = TxnNo || null;
                  billAmount = Amount || null;
                  if (BilledDate) {
                    const date = new Date(BilledDate);
                    const istDate = new Date(date.getTime() + (5.5 * 60 * 60 * 1000)); // Convert to IST
                    billPrintedTime = istDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                    billPrintedDate = istDate;
                  }
                }
                if (isSetteled === 1) status = 0; // ⚪ vacant when settled

                // Check if printed bill is 10+ minutes old, change to pending (orange)
                if (status === 2 && billPrintedDate) {
                  const now = new Date();
                  const diffMinutes = (now.getTime() - billPrintedDate.getTime()) / (1000 * 60);
                  if (diffMinutes >= 10) {
                    status = 4; // 4 for pending (orange)
                  }
                }
              }

              return { ...item, status, billNo, billAmount, billPrintedTime, billPrintedDate };
            })
          );

          setTableItems(formattedData);
          setFilteredTables(formattedData);
          setErrorMessage('');
        } else {
          setErrorMessage('No tables found in TableManagement API.');
          setTableItems([]);
          setFilteredTables([]);
        }
      } else {
        setErrorMessage('Invalid data format received from TableManagement API.');
        setTableItems([]);
        setFilteredTables([]);
      }
    } catch (err) {
      // console.error('Table fetch error:', err);
      setErrorMessage('Failed to fetch tables. Please check the API endpoint.');
      setTableItems([]);
      setFilteredTables([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mobileNumber.length >= 10) {
      fetchCustomerByMobile(mobileNumber, setCustomerName, setCustomerId, setCustomerAddress);
    } else {
      setCustomerName('');
      setCustomerId(null);
      setCustomerAddress('');
    }
  }, [mobileNumber]);

  const handleMobileKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (mobileNumber.trim()) {
        fetchCustomerByMobile(mobileNumber.trim(), setCustomerName, setCustomerId, setCustomerAddress);
      }
    }
  };

  useEffect(() => {
    const lastItem = items[items.length - 1];
    if (itemListRef.current && items.length > 10 && lastItem?.isNew) {
      itemListRef.current.scrollTo({ top: itemListRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [items]);

  useEffect(() => {
    (async () => {
      try {
        const resp = await OrderService.getSavedKOTs({ isBilled: 0 });
        const list = resp?.data || resp;
        if (Array.isArray(list)) setSavedKOTs(list);
      } catch (err) {
        // console.warn('getSavedKOTs initial load failed');
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

    // 🚨 fail fast
    if (user?.role_level === 'outlet_user' && !user.outletid) {
      toast.error('No outlet assigned to this user.');
      setDepartments([]);
      setLoading(false);
      return;
    }

    try {
      const params: { hotelid: number; outletid?: number } = { hotelid: user.hotelid };
      if (user.role_level === 'outlet_user' && user.outletid) {
        params.outletid = Number(user.outletid);
      }
      const response = await TableDepartmentService.list(params) as any;
      // console.log('Raw departments data:', response);

      if (response.success && Array.isArray(response.data)) {
        const departmentsData = response.data;

        if (departmentsData.length === 0) {
          toast.error('No departments found.');
          setDepartments([]);
          return;
        }

        const formattedDepartments = departmentsData.map((item: any) => ({
          departmentid: item.departmentid,
          department_name: item.department_name,
          outletid: item.outletid,
        }));

        setDepartments(formattedDepartments);
      } else {
        toast.error('Invalid data format received from TableDepartment API.');
        setDepartments([]);
      }
    } catch (err) {
      // console.error('Departments fetch error:', err);
      toast.error('Failed to fetch departments. Please check the API endpoint.');
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  };
  const fetchOutletsData = async () => {
    // console.log('Full user object:', JSON.stringify(user, null, 2));
    if (!user || !user.id) {
      setErrorMessage('User not logged in or user ID missing.');
      setLoading(false);
      // console.log('User data issue:', user);
      return;
    }
    if (user.role_level === 'outlet_user' && (!user.hotelid || !user.outletid)) {
      setErrorMessage('Outlet user missing required hotelid or outletid.');
      setLoading(false);
      // console.log('Outlet user data issue:', user);
      return;
    }
    if (user.role_level !== 'outlet_user' && !user.hotelid) {
      setErrorMessage('User missing required hotelid.');
      setLoading(false);
      // console.log('User data issue:', user);
      return;
    }
    try {
      setLoading(true);
      setErrorMessage('');
      if (user.role_level === 'outlet_user' && user.outletid) {
        // console.log('Outlet user detected, fetching outlets with outletid filter:', user.outletid);
        await fetchOutletsForDropdown(user, setOutlets, setLoading);
      } else {
        // console.log('Fetching all outlets for user:', { userid: user.id, hotelid: user.hotelid, outletid: user.outletid });
        await fetchOutletsForDropdown(user, setOutlets, setLoading);
      }
      // console.log('Outlets fetched:', outlets);
    } catch (error: any) {
      // console.error('Error in fetchOutletsData:', error);
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

  // Set default outlet ID based on logged-in user
  useEffect(() => {
    if (user?.outletid && !selectedOutletId) {
      setSelectedOutletId(Number(user.outletid));
    }
  }, [user, selectedOutletId]);

  useEffect(() => {
    if (!loading && outlets.length === 0 && !errorMessage && user) {
      // console.log('No outlets found:', { loading, outletsLength: outlets.length, errorMessage, user });
    }
  }, [outlets, loading, errorMessage, user]);

  useEffect(() => {
    // console.log('Outlets state changed:', outlets);
    // console.log('Departments state changed:', departments);
    // console.log('TableItems state changed:', tableItems);
  }, [outlets, departments, tableItems]);

  useEffect(() => {
    // console.log('ActiveNavTab:', activeNavTab, 'Outlets:', outlets, 'Departments:', departments, 'TableItems:', tableItems);
    let filtered: TableItem[] = [];
    if (!Array.isArray(tableItems)) {
      // console.error('tableItems is not an array:', tableItems);
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
    // console.log(`Filtered tables for ${activeNavTab}:`, JSON.stringify(filtered, null, 2));
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

  const handleTableClick = async (seat: string) => {
    // console.log('Button clicked for table:', seat);

    // Check if this is a new table (not re-selecting same)
    const isNewTable = prevTable !== seat;

    // Force reset selectedTable to null first to allow re-selection of the same table
    setReverseQtyMode(false); // Turn off reverse mode on table change
    setIsGroupedView(true); // Reset to grouped view on table change
    setSelectedTable(seat); // Set immediately to avoid timing issues
    setShowOrderDetails(true);
    setInvalidTable('');

    // Reset discount values when switching tables
    setDiscount(0);
    setDiscountInputValue(0);
    setDiscountType(1); // Default to percentage

    // Hide and re-enable the Save Reverse button when changing tables
    setShowSaveReverseButton(false);
    setIsSaveReverseDisabled(false);
    setReverseQtyItems([]); // Clear pending reversed items

    // Update prevTable BEFORE processing
    setPrevTable(seat);

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
      setSourceTableId(tableIdNum);
      // console.log("SOURCE TABLE ID:", tableIdNum);

      setSelectedDeptId(deptId);
      setSelectedOutletId(outletId);

      // Capture original table status for order tag logic
      setOriginalTableStatus(selectedTableObj.status);

      // ALWAYS refetch items for the selected table (backend data)
      await refreshItemsForTable(tableIdNum);

      // ✅ FIXED: Clear customer ONLY for NEW tables (post-refresh)
      if (isNewTable) {
        // console.log('🧹 Clearing customer for NEW table:', seat);
        setCustomerName('');
        setMobileNumber('');
        setCustomerId(null);
      }

    } else {
      // console.warn('Selected table object not found for seat:', seat);
      setItems([]); // Clear items if table not found
      setCurrentKOTNo(null);
      setCurrentKOTNos([]);
      // Always clear for invalid table
      setCustomerName('');
      setMobileNumber('');
      setCustomerId(null);
      setOriginalTableStatus(null);
    }
    // console.log('After handleTableClick - selectedTable:', seat, 'showOrderDetails:', true);
  };

  const fetchQuickBillData = async () => {
    try {
      const response = await OrderService.getQuickBills();
      if (response.success) {
        setQuickBillData(response.data);
      } else {
        toast.error(response.message || "Failed to fetch quick bill data");
      }
    } catch (err) {
      // console.error("Failed to fetch quick bill data", err);
      toast.error("An error occurred while fetching quick bills.");
    }
  };

  const handleTabClick = (tab: string) => {
    // console.log('Tab clicked:', tab);
    setActiveTab(tab);
    setActiveNavTab('ALL'); // Reset main nav tab to avoid conflicts
    setShowPendingOrdersView(false); // Reset pending orders view
    setShowBillingPage(false); // Reset billing page view by default

    if (['Pickup', 'Delivery', 'Quick Bill', 'Order/KOT', 'Billing'].includes(tab)) {
      setSelectedTable(null);
      setItems([]);
      setShowOrderDetails(true);
      // Reset all relevant states for a new order
      setCurrentTxnId(null);
      setPersistentTxnId(null);
      setOrderNo(null);
      setSourceTableId(null);

      setCurrentKOTNo(null);
      setCurrentKOTNos([]);
      setDiscount(0);
      setDiscountInputValue(0);
      setDiscountType(1);
      setReverseQtyMode(false);
      setReverseQtyItems([]);
      setShowSaveReverseButton(false);
      setShowPrintBoth(false);

      // ✅ FIX: Clear customer details for new tab/order type
      setCustomerName('');
      setMobileNumber('');
      setCustomerId(null);

      // Ensure outlet ID is set for Pickup, Delivery, Quick Bill
      if (['Pickup', 'Delivery', 'Quick Bill'].includes(tab)) {
        setSourceTableId(tab === 'Quick Bill' ? -1 : 0);  // Virtual table IDs for pickup/delivery/quickbill
        const outletId = Number(user?.outletid);
        setSelectedOutletId(outletId);

        // ✅ FIXED: Use mst_setting departmentid for pickup/delivery/quickbill tax
        const fetchMstSettingDept = async () => {
          try {
            if (outletId) {
              const mstRes = await OrderService.getMstSettingByOutlet(outletId);
              if (mstRes.success && mstRes.data) {
                const mstDeptId = mstRes.data.departmentid || 1; // Fallback to dept 1
                // console.log(`🔥 [${tab}] mst_setting.deptid =`, mstDeptId, 'outletId:', outletId);
                setSelectedDeptId(mstDeptId);
              } else {
                // Fallback to first department
                const defaultDept = departments.find(d => d.outletid === outletId);
                // console.log(`⚠️ [${tab}] mst_setting NOT FOUND, using fallback deptid:`, defaultDept?.departmentid);
                setSelectedDeptId(defaultDept?.departmentid || (departments[0]?.departmentid || null));
              }
            }
          } catch (error) {
            // console.error(`❌ [${tab}] Error fetching mst_setting:`, error);
            // Fallback to first department
            const defaultDept = departments.find(d => d.outletid === outletId);
            setSelectedDeptId(defaultDept?.departmentid || (departments[0]?.departmentid || null));
          }
        };

        fetchMstSettingDept();

        // Force reload outlet settings immediately after setting department
        // This ensures round off settings are loaded before any order is created
        if (outletId) {
          loadOutletSettings(outletId);
          // Also fetch and set round off settings immediately
          const fetchRoundOffSettings = async () => {
            try {
              const settings = await OrderService.getOutletSettings(outletId);
              if (settings && settings.data) {
                setRoundOffEnabled(!!settings.data.bill_round_off);
                setRoundOffTo(settings.data.bill_round_off_to || 1);
                setRoundOffSettingsLoaded(true); // Mark settings as loaded
              }
            } catch (error) {
              // console.error('Error fetching round off settings:', error);
              setRoundOffSettingsLoaded(true); // Mark as loaded even on error to prevent hanging
            }
          };
          fetchRoundOffSettings();
        }
      }

      setShowOrderDetails(true);
      if (tab === 'Billing') {
        setShowBillingPage(true);
        setShowOrderDetails(false); // Don't show order details for billing tab
        fetchAllBills(); // Auto-filters via service
      } else if (tab === 'Quick Bill') {
        // This is for the right-side panel tab. We want to show the order entry form.
        setShowPrintBoth(items.some(item => item.isNew));
        setActiveNavTab('Dine-in'); // Reset nav tab to prevent showing history table
      }
    } else {
      setShowOrderDetails(false);
      if (tab === 'Dine-in') {
        setActiveNavTab('ALL'); // Go back to Dine-in tables view
      }
    }
  };

  useEffect(() => {
    const hasNewItems = items.some(item => item.isNew);
    if (activeTab === 'Quick Bill' && hasNewItems) {
      setShowPrintBoth(true);
    } else {
      setShowPrintBoth(false);

    }
  }, [activeTab, items]);

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

  const handleIncreaseQty = (itemId: number, variantId?: number) => {
    setItems(currentItems => {
      const newItems = [...currentItems];
      // 🔥 FIX: Match by id + variantId + isNew (prevents cross-variant increment)
      const existingNewItemIndex = newItems.findIndex(i => i.id === itemId && i.variantId === variantId && i.isNew);

      if (existingNewItemIndex > -1) {
        const item = newItems[existingNewItemIndex];
        newItems[existingNewItemIndex] = { ...item, qty: item.qty + 1 };
        return newItems;
      }
      return currentItems;
    });
  };

  const handleDecreaseQty = (itemId: number, variantId?: number) => {
    setItems(currentItems => {
      const newItems = [...currentItems];
      // 🔥 FIX: Match by id + variantId + isNew
      const existingNewItemIndex = newItems.findIndex(i => i.id === itemId && i.variantId === variantId && i.isNew);

      if (existingNewItemIndex > -1) {
        const item = newItems[existingNewItemIndex];
        if (item.qty > 1) {
          newItems[existingNewItemIndex] = { ...item, qty: item.qty - 1 };
          return newItems;
        } else {
          // Remove the specific item instance
          return newItems.filter((_, index) => index !== existingNewItemIndex);
        }
      }
      return currentItems;
    });
  };

  const handleReverseQty = async (item: MenuItem) => {
    try {
      // 🔒 Reverse mode required for billed items
      if (item.isBilled === 1 && !reverseQtyMode) {
        toast.error('Reverse quantity mode must be activated for billed items.');
        return;
      }

      // 🔒 Prevent full reverse
      // 🔒 Prevent reversing ALL items for billed orders
      if (item.isBilled === 1) {
        const totalRemainingQty = items.reduce((sum, i) => sum + i.qty, 0);

        // Agar abhi sirf 1 qty bachi hai, to reverse mat allow karo
        if (totalRemainingQty <= 1) {
          toast.error(
            "At least one item must remain on the table. You cannot reverse all items."
          );
          return;
        }
      }

      if (!reverseQtyMode) return;

      // ✅ 1. UPDATE ITEMS (UI STATE)
      setItems(prev =>
        prev.map(i => {
          if (i.txnDetailId !== item.txnDetailId) return i;

          const originalQty = i.originalQty ?? i.qty;
          const currentRev = i.revQty ?? 0;
          const newRev = currentRev + 1;

          if (newRev > originalQty) return i;

          return {
            ...i,
            revQty: newRev,
            qty: originalQty - newRev, // 🔥 UI SYNC FIX
          };
        })
      );

      // ✅ 2. UPDATE reverseQtyItems (SAVE KOT payload)
      setReverseQtyItems(prev => {
        const existing = prev.find(ri => ri.txnDetailId === item.txnDetailId);
        if (existing) {
          return prev.map(ri =>
            ri.txnDetailId === item.txnDetailId ? { ...ri, qty: ri.qty + 1 } : ri
          );
        }
        return [...prev, { ...item, qty: 1, isReverse: true }];
      });
      setShowSaveReverseButton(true);
    } catch (error) {
      // console.error('❌ Error processing reverse quantity:', error);
      toast.error('Error processing reverse quantity');
    }
  };
  useEffect(() => {
    // Don't reset department/outlet for Pickup/Delivery/Quick Bill tabs - they should keep their settings
    if (['Pickup', 'Delivery', 'Quick Bill'].includes(activeTab)) {
      return;
    }

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
  }, [activeNavTab, departments, activeTab]);

  useEffect(() => {
    if (!selectedDeptId) {
      setTaxRates({ cgst: 0, sgst: 0, igst: 0, cess: 0 });
      return;
    }
    (async () => {
      try {
        // console.log(`🔥 TAX FETCH → outletId: ${selectedOutletId}, deptId: ${selectedDeptId}, activeTab: ${activeTab}`);
        const resp = await OrderService.getTaxesByOutletAndDepartment({ outletid: selectedOutletId ?? undefined, departmentid: selectedDeptId });
        // console.log('✅ Tax API response:', resp);
        if (resp?.success && resp?.data?.taxes) {
          const t = resp.data.taxes;
          const newRates = {
            cgst: Number(t.cgst) || 0,
            sgst: Number(t.sgst) || 0,
            igst: Number(t.igst) || 0,
            cess: Number(t.cess) || 0,
          };
          // console.log(`✅ [${activeTab}] APPLYING TAX → CGST:${newRates.cgst}% SGST:${newRates.sgst}% IGST:${newRates.igst}% CESS:${newRates.cess}%`);
          setTaxRates(newRates);
        } else {
          // console.log(`⚠️ [${activeTab}] No tax data found, setting zeros`);
          setTaxRates({ cgst: 0, sgst: 0, igst: 0, cess: 0 });
        }
      } catch (e) {
        // console.error(`❌ [${activeTab}] Tax fetch error:`, e);
        setTaxRates({ cgst: 0, sgst: 0, igst: 0, cess: 0 });
      }
    })();
  }, [selectedDeptId, selectedOutletId, activeTab]);

  useEffect(() => {
    const cgstPer = Number(taxRates.cgst) || 0;
    const sgstPer = Number(taxRates.sgst) || 0;
    const igstPer = Number(taxRates.igst) || 0;
    const cessPer = Number(taxRates.cess) || 0;

    if (reverseQtyMode && reverseQtyItems.length > 0) {
      const { cgst, sgst, igst, cess } = taxRates;

      // ✅ Your 'items' state already reflects the current (active) quantities.
      // So just calculate based on 'items', not reverseQtyItems.
      const activeItems = items.filter(item => item.qty > 0);

      const baseAmount = activeItems.reduce(
        (sum, item) => sum + Number(item.price) * Number(item.qty),
        0
      );

      const cgstAmt = (baseAmount * cgst) / 100;
      const sgstAmt = (baseAmount * sgst) / 100;
      const igstAmt = (baseAmount * igst) / 100;
      const cessAmt = (baseAmount * cess) / 100;

      const grandTotal = baseAmount + cgstAmt + sgstAmt + igstAmt + cessAmt;

      setTaxCalc({
        subtotal: baseAmount,
        taxableValue: baseAmount,
        cgstAmt,
        sgstAmt,
        igstAmt,
        cessAmt,
        grandTotal
      });

      // console.log("✅ Active Items Total (After Reverse):", grandTotal);
      return;
    }
    // Correctly calculate subtotal based on active (non-reversed) items
    const activeItems = items.filter(item => !item.isReverse);
    const lineTotal = activeItems.reduce((sum, item) => sum + item.price * item.qty, 0);


    /* ═══════════════════════════════════════════════════════════════════════════════
   * - Runtime Calculation 
   * ═══════════════════════════════════════════════════════════════════════════════ */

    // Calculate runtime discount based on discountInputValue and DiscountType
    const discountAmount = DiscountType === 1
      ? (lineTotal * discountInputValue) / 100
      : discountInputValue;

    let finalSubtotal: number, taxableValue: number, cgstAmt: number, sgstAmt: number, igstAmt: number, cessAmt: number, grandTotal: number;

    if (includeTaxInInvoice === 1) {
      // Inclusive Tax: Prices include tax.
      const combinedPer = cgstPer + sgstPer + igstPer + cessPer;

      // Step 1: Calculate discount on gross amount (lineTotal) - using runtime discountAmount

      // Step 2: Get discounted gross amount
      const discountedGross = lineTotal - discountAmount;

      // Step 3: Extract pre-tax base from discounted gross amount
      const preTaxBase = combinedPer > 0 ? discountedGross / (1 + combinedPer / 100) : discountedGross;
      taxableValue = preTaxBase > 0 ? preTaxBase : 0; // Ensure non-negative

      // 4. Recalculate taxes on the new taxable value.
      cgstAmt = Number(((taxableValue * cgstPer) / 100).toFixed(2));
      sgstAmt = Number(((taxableValue * sgstPer) / 100).toFixed(2));
      igstAmt = Number(((taxableValue * igstPer) / 100).toFixed(2));
      cessAmt = Number(((taxableValue * cessPer) / 100).toFixed(2));

      // 5. Final bill is the new taxable value plus the new taxes.
      grandTotal = taxableValue + cgstAmt + sgstAmt + igstAmt + cessAmt;
      finalSubtotal = preTaxBase; // Subtotal should reflect the pre-tax base before discount.

    } else {
      // Exclusive Tax: Prices do not include tax.
      // 1. Apply discount to the subtotal (lineTotal) to get the taxable value.
      const currentTaxableValue = lineTotal - discountAmount;
      taxableValue = currentTaxableValue;

      // 2. Add tax on the discounted value.
      cgstAmt = Number(((currentTaxableValue * cgstPer) / 100).toFixed(2));
      sgstAmt = Number(((currentTaxableValue * sgstPer) / 100).toFixed(2));
      igstAmt = Number(((currentTaxableValue * igstPer) / 100).toFixed(2));
      cessAmt = Number(((currentTaxableValue * cessPer) / 100).toFixed(2));

      // 3. Final bill is the taxable value plus all taxes.
      grandTotal = currentTaxableValue + cgstAmt + sgstAmt + igstAmt + cessAmt;
      finalSubtotal = lineTotal; // Subtotal should reflect the base amount before discount.
    }

    // Simple roundoff logic similar to Billview.tsx
    const roundedFinalAmount = Math.round(grandTotal);
    const appliedRoundOff = Number((roundedFinalAmount - grandTotal).toFixed(2));

    setRoundOffValue(appliedRoundOff);

    setTaxCalc({
      subtotal: finalSubtotal, taxableValue, cgstAmt, sgstAmt, igstAmt, cessAmt, grandTotal: roundedFinalAmount
    });

  }, [items, reversedItems, taxRates, includeTaxInInvoice, discount, discountInputValue, DiscountType, roundOffEnabled, roundOffTo, roundOffSettingsLoaded]);

  const loadOutletSettings = async (outletId: number) => {
    try {
      const kotData = await fetchKotPrintSettings(outletId);
      if (kotData) {
        setFormData(prev => applyKotSettings(prev, kotData));
      }
    } catch (err) {
      // console.error('Failed to load outlet settings', err);
    }
  };

  // Fetch outlet settings whenever selectedOutletId, activeTab, or selectedDeptId changes
  // This ensures round-off settings are loaded for all order types (Dine-In, Pickup, Delivery, QuickBill)
  // and when department changes
  useEffect(() => {
    if (selectedOutletId) {
      loadOutletSettings(selectedOutletId);
      // Fetch outlet settings for Reverse Qty Mode
      const fetchReverseQtySetting = async () => {
        try {
          const settings = await OrderService.getOutletSettings(selectedOutletId);
          if (settings) {
            setReverseQtyConfig(settings.data.ReverseQtyMode === 1 ? 'PasswordRequired' : 'NoPassword');
            setRoundOffEnabled(!!settings.data.bill_round_off);
            setRoundOffTo(settings.data.bill_round_off_to || 1);
            setRoundOffSettingsLoaded(true); // Mark round off settings as loaded
            // include_tax_in_invoice may be returned with different casing
            const incFlag =
              settings.data.include_tax_in_invoice ??
              (settings as any).IncludeTaxInInvoice ??
              (settings as any).includeTaxInInvoice ??
              (settings as any).includeTaxInInvoice;
            setIncludeTaxInInvoice(Number(incFlag) === 1 ? 1 : 0);

            // Debug console for tax mode
            // console.log("Include Tax in Invoice:", Number(incFlag) === 1 ? "Inclusive" : "Exclusive");
          } else {
            setReverseQtyConfig('PasswordRequired'); // Default to password required
            setIncludeTaxInInvoice(0);
            setRoundOffSettingsLoaded(true); // Mark as loaded even if settings not found
          }
        } catch (error) {
          // console.error("Failed to fetch outlet settings for Reverse Qty Mode", error);
          setReverseQtyConfig('PasswordRequired'); // Default to password required
          setIncludeTaxInInvoice(0);
          setRoundOffSettingsLoaded(true); // Mark as loaded even on error
        }
      };
      fetchReverseQtySetting();
    }
  }, [selectedOutletId, activeTab, selectedDeptId]);

  useEffect(() => {
    if (selectedOutletId) {
      const fetchPaymentModes = async () => {
        try { // The URL was incorrect, it should be a query parameter
          const res = await OrderService.getPaymentModesByOutlet(selectedOutletId);

          if (res.success) {
            setOutletPaymentModes(res.data);
          } else {
            setOutletPaymentModes([]);
          }
        } catch (error) {
          // console.error("Failed to fetch payment modes", error);
          setOutletPaymentModes([]);
        }
      };
      fetchPaymentModes();

      // Fetch waiter users
      const fetchWaiters = async () => {
        try {
          const waiters = await fetchWaiterUsers(selectedOutletId);
          setWaiterUsers(waiters);
        } catch (error) {
          // console.error('Failed to fetch waiter users:', error);
        }
      };
      fetchWaiters();

      // Fetch outlet settings for default waiter and pax
      const fetchOutletSettings = async () => {
        try {
          const settings = await OrderService.getOutletSettings(selectedOutletId);
          if (settings) {
            setDefaultWaiterId(settings.data.default_waiter_id || null);
            setDefaultPax(settings.data.pax || 1);
          } else {
            setDefaultWaiterId(null);
            setDefaultPax(1);
          }
        } catch (error) {
          // console.error("Failed to fetch outlet settings", error);
          setDefaultWaiterId(null);
          setDefaultPax(1);
        }
      };
      fetchOutletSettings();
    } else {
      setOutletPaymentModes([]);
      setWaiterUsers([]);
      setDefaultWaiterId(null);
      setDefaultPax(1);
    }
  }, [selectedOutletId]);

  const getKOTLabel = () => {
    const kot = currentKOTNo ? currentKOTNo.toString() : "";
    const ord = orderNo ? orderNo.toString() : "";

    switch (activeTab) {

      case 'Dine-in': {
        const kotNumbers = currentKOTNos.length > 0
          ? [...currentKOTNos].sort((a, b) => a - b).join(', ').trim()
          : kot;

        return `KOT ${kotNumbers} ${selectedTable ? ` - Table ${selectedTable}` : ''
          }`;
      }

      case 'Pickup':
        return `Pickup – KOT: ${kot} | Order No: ${ord}`;

      case 'Delivery':
        return `Delivery – KOT: ${kot} | Order No: ${ord}`;

      case 'Quick Bill':
        return `Quick Bill – KOT: ${kot} | Order No: ${ord}`;

      case 'Order/KOT':
        return 'Order/KOT';

      case 'Billing':
        return `Billing – KOT: ${kot} | Order No: ${ord}`;

      default:
        return 'KOT 1';
    }
  };

  const handleBackToTables = () => {
    setActiveTab('Dine-in'); // Switch back to the Dine-in tab
    setShowPendingOrdersView(false);
    setShowOrderDetails(false);
    resetBillingPanel();
    setActiveNavTab('ALL'); // Show all department tables
  };
  const handlePrintBill = async (txnId?: number) => {
    const id = txnId || currentTxnId;

    if (items.length === 0) {
      toast.error('No items to print a bill for.');
      return;
    }

    if (!id) {
      toast.error("No TxnID found");
      return;
    }

    setLoading(true);
    try {
      // 1. Call the new endpoint to mark the bill as billed
      const printResult = await OrderService.markBillAsBilled(id, {
        outletId: selectedOutletId || Number(user?.outletid),
        customerName: customerName || null,
        mobileNo: mobileNumber || null,
        customerid: customerid || null,
      });

      if (!printResult.success) {
        throw new Error(printResult.message || 'Failed to mark bill as printed.');
      }

      toast.success('Bill marked as printed!');

      // Focus Mode logic for Bill print: Navigate back when focusMode OFF
      if (!focusMode && activeTab === 'Dine-in') {
        setShowOrderDetails(false);
        setTimeout(() => {
          if (tableSearchInputRef.current) {
            tableSearchInputRef.current.focus();
            tableSearchInputRef.current.select();
          }
        }, 150);
      }



      // Set the TxnNo from the API response to update the UI for printing
      if (printResult.data && printResult.data.TxnNo) {
        setOrderNo(printResult.data.TxnNo);
      }

      // 2. Open the BillPreviewPrint modal instead of directly printing
      setShowBillPrintModal(true);

      // 3. Update table status after discount and print
      if (selectedTable) {
        const tableToUpdate = tableItems.find(t => t.table_name === selectedTable);
        if (tableToUpdate) {
          //If discount applied, set green (status=1), else red (status=2)
          const newStatus = 2; // Always set to 2 (billed/red) on printing
          await OrderService.updateTableStatus(tableToUpdate.tableid, { status: newStatus });
          // Update UI immediately
          setTableItems(prevTables =>
            prevTables.map(table =>
              table.table_name === selectedTable ? { ...table, status: newStatus } : table
            )
          );
        }
      }
      // 4. Update items in the UI to reflect their 'billed' state
      setItems(prevItems => prevItems.map(item => ({ ...item, isNew: false, isBilled: 1, originalQty: item.qty })));

      // 5. For Dine-in and Quick Bill, keep the order screen visible and reload the latest printed bill data.
      // For Pickup/Delivery, keep the order on screen to proceed to settlement.
      if (activeTab === 'Dine-in' || activeTab === 'Quick Bill') {
        // Reload the latest printed bill data from backend
        // ✅ Clear everything after print
        setBillActionState('printOrSettle'); // Ensure it's ready for settlement
      } else {
        setBillActionState('printOrSettle'); // Ensure it's ready for settlement
      }
      // 6. Refresh the table list to show the new 'billed' status (red color)
      fetchTableManagement();

      // 7. Refresh Quick Bill list if we're in Quick Bill tab
      if (activeTab === 'Quick Bill') {
        fetchQuickBillData();
      }


    } catch (error: any) {
      // console.error('Error printing bill:', error);
      toast.error(error.message || 'An error occurred while printing the bill.');
    } finally {
      setLoading(false);
    }
  };

const handlePrintKotAndBill = async () => {
  try {
    setLoading(true);

    // ✅ STEP 1: Snapshot everything BEFORE async calls
    const currentItems = [...items];
    const currentKotNo = currentKOTNo;

    // ✅ Store snapshot for printing
    setBillPrintItems(currentItems);
   
    setPrintKotNo(currentKotNo);

    // 1️⃣ Save KOT
    const txnId = await handlePrintAndSaveKOT();

    if (!txnId) {
      throw new Error("TxnID not found after KOT save");
    }

    // 2️⃣ Mark bill as billed
    const printResult = await OrderService.markBillAsBilled(txnId, {
      outletId: selectedOutletId || Number(user?.outletid),
      customerName: customerName || null,
      mobileNo: mobileNumber || null,
      customerid: customerid || null,
    });

    if (!printResult.success) {
      throw new Error(printResult.message || "Failed to mark bill as printed.");
    }

    toast.success("Bill marked as printed!");

    // ✅ Set TxnNo (Order No)
    if (printResult.data?.TxnNo) {
      setOrderNo(printResult.data.TxnNo);
    }

    // ✅ STEP 3: Show modal AFTER everything is ready
    setShowBillPrintModal(true);

    toast.success("KOT and Bill printed successfully!");
    setShowPrintBoth(false);

    // ✅ STEP 4: Clear AFTER modal trigger (safe)
    if (activeTab !== "Quick Bill") {
      setItems([]);
      setCurrentTxnId(null);
      setOrderNo(null);
    }
     setTimeout(() => {
      setActiveTab('Dine-in');
      setActiveNavTab('ALL');
      setShowOrderDetails(false);
      
      fetchTableManagement();
      if (tableSearchInputRef.current) {
        tableSearchInputRef.current.focus();
        tableSearchInputRef.current.select();
      }
    }, 150);

  } catch (error: any) {
    toast.error(error.message || "Failed to print KOT and Bill");
  } finally {
    setLoading(false);
  }
};

  const handlePrintAndSaveKOT = async () => {
    try {
      // Ensure customer details are fetched if mobile number is provided but customerid is null
      if (mobileNumber && !customerid) {
        await fetchCustomerByMobile(mobileNumber, setCustomerName, setCustomerId, setCustomerAddress);
      }

      const newItemsToKOT = items.filter(item => item.isNew);
      const reverseItemsToKOT = reverseQtyMode ? reverseQtyItems : [];
      setLoading(true);

      const tableNameForKOT =
        activeTab === 'Pickup'
          ? 'Pickup'
          : activeTab === 'Delivery'
            ? 'Delivery'
            : activeTab === 'Quick Bill'
              ? 'Quick Bill'
              : selectedTable || null;
      setSelectedTable(tableNameForKOT);
      const selectedTableRecord: any = (Array.isArray(filteredTables) ? filteredTables : tableItems)
        .find((t: any) => t && t.table_name && selectedTable && t.table_name.toLowerCase() === selectedTable.toLowerCase())
        || (Array.isArray(tableItems) ? tableItems.find((t: any) => t && t.table_name && selectedTable && t.table_name.toLowerCase() === selectedTable.toLowerCase()) : undefined);

      let resolvedTableId = selectedTableRecord ? Number((selectedTableRecord as any).tableid || (selectedTableRecord as any).tablemanagementid) : null;
      let resolvedDeptId = selectedTableRecord ? Number((selectedTableRecord as any).departmentid) || selectedDeptId : null;
      let resolvedOutletId = selectedTableRecord?.outletid ? Number(selectedTableRecord.outletid) : (selectedOutletId || Number(user?.outletid) || null);

      // For non-dine-in tabs, explicitly set outlet and department.
      if (['Pickup', 'Delivery', 'Quick Bill'].includes(activeTab)) {
        resolvedTableId = null; // No physical table for these orders

        // Try to get outlet from user, then selected outlet, then from the first available department.
        let potentialOutletId = Number(user?.outletid) || selectedOutletId;
        if (!potentialOutletId && departments.length > 0) {
          // Fallback for admins who don't have a user.outletid but have departments loaded.
          // Use the outlet from the first department in the list.
          potentialOutletId = departments[0].outletid;
        }
        resolvedOutletId = potentialOutletId;
        // Ensure selectedOutletId is set for KotPreviewPrint component
        setSelectedOutletId(resolvedOutletId);

        if (resolvedOutletId && departments.length > 0) {
          // Find the first department associated with the resolved outlet.
          // If none, fall back to the very first department available.
          const defaultDept = departments.find(d => d.outletid === resolvedOutletId) ?? departments[0];
          if (defaultDept) { // Check if a department was found
            resolvedDeptId = defaultDept.departmentid;
          }
        }
      }

      const userId = user?.id || null;
      const hotelId = user?.hotelid || null;

      if (!resolvedOutletId) {
        toast.error("Outlet could not be determined. Please select an outlet.");
        setLoading(false);
        return null;
      }

      let currentTaxRates = { ...taxRates };

      // For non-dine-in tabs, ensure tax rates are loaded for the resolved department
      if (['Pickup', 'Delivery', 'Quick Bill'].includes(activeTab) && resolvedOutletId && resolvedDeptId) {
        try {
          const taxResp = await OrderService.getTaxesByOutletAndDepartment({
            outletid: resolvedOutletId,
            departmentid: resolvedDeptId
          });
          if (taxResp?.success && taxResp?.data?.taxes) {
            const t = taxResp.data.taxes;
            currentTaxRates = {
              cgst: Number(t.cgst) || 0,
              sgst: Number(t.sgst) || 0,
              igst: Number(t.igst) || 0,
              cess: Number(t.cess) || 0,
            };
            // Use the fetched rates for this transaction, and also update the state for UI consistency
            setTaxRates(currentTaxRates);
          }
        } catch (taxError) {
          // console.error("Error fetching taxes for non-dine-in KOT:", taxError);
          toast.error("Could not fetch tax rates for the order.");
          // Do not proceed if taxes can't be fetched, as it would lead to incorrect billing.
        }
      }

      const newKotItemsPayload = newItemsToKOT.map(i => {
        // Calculate the change in quantity. If it's a new item, originalQty will be undefined.
        const qtyDelta = i.originalQty !== undefined ? i.qty - i.originalQty : i.qty;

        // Only include items where quantity has increased.
        // Decreases are handled by Re-KOT.
        if (qtyDelta <= 0) return null;

        // Determine order tag for KOT header
        const order_tag = originalTableStatus === 0 ? (formData.new_order_tag_label || 'New') : (formData.running_order_tag_label || 'Running');
        // console.log('orderTag determined:', order_tag, 'originalTableStatus:', originalTableStatus, 'activeTab:', activeTab, 'selectedTable:', selectedTable);

        const lineSubtotal = Number(i.price) * qtyDelta;
        const cgstPer = Number(currentTaxRates.cgst) || 0;
        const sgstPer = Number(currentTaxRates.sgst) || 0;
        const igstPer = Number(currentTaxRates.igst) || 0;
        const cessPer = Number(currentTaxRates.cess) || 0;
        const cgstAmt = (lineSubtotal * cgstPer) / 100;
        const sgstAmt = (lineSubtotal * sgstPer) / 100;
        const igstAmt = (lineSubtotal * igstPer) / 100;
        const cessAmt = (lineSubtotal * cessPer) / 100; // This tax calculation is for bill, not KOT. KOT only needs item and quantity.

        // Calculate item level discount if percentage
        const itemLevelDiscount = DiscountType === 1 ? (lineSubtotal * discountInputValue) / 100 : 0;
        console.log('itemLevelDiscount:', itemLevelDiscount);

        return {
          ItemID: i.id,
          item_no: i.item_no,
          item_name: i.name,
          Qty: qtyDelta,
          RuntimeRate: i.price,
          TableID: resolvedTableId || undefined,
          DeptID: resolvedDeptId,
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
          order_tag: order_tag, // Add order tag to payload
          variantId: i.variantId || null, // Add variant ID
          variantName: i.variantName || null, // Add variant name
        };
      }).filter(Boolean) as any[];

      const reverseKotItemsPayload = reverseItemsToKOT.map(i => ({
        ItemID: i.id,
        item_no: i.item_no,
        item_name: i.name,
        Qty: -i.qty, // Negative quantity for reversal
        RuntimeRate: i.price,
        TableID: resolvedTableId || undefined,
        DeptID: resolvedDeptId,
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

      // Find the first NCKOT item to get the overall NCName and NCPurpose for the bill header
      const firstNCItem = newKotItemsPayload.find(item => item.isNCKOT);

      const activeItemsForDiscount = items.filter(item => !item.isReverse);
      const lineTotalForDiscount = activeItemsForDiscount.reduce((sum, item) => sum + item.price * item.qty, 0);
      const calculatedDiscountAmount = DiscountType === 1 ? (lineTotalForDiscount * discountInputValue) / 100 : discountInputValue;

      const kotPayload = {
        txnId: currentTxnId || 0,
        tableId: resolvedTableId,
        table_name: tableNameForKOT,
        items: combinedPayload,
        outletid: resolvedOutletId,
        userId: userId,
        hotelId: hotelId,
        DeptID: resolvedDeptId, // Add DeptID to header payload

        // Add NCName and NCPurpose to the main payload for the TAxnTrnbill header
        NCName: firstNCItem ? firstNCItem.NCName : null,
        NCPurpose: firstNCItem ? firstNCItem.NCPurpose : null,
        DiscPer: DiscountType === 1 ? discountInputValue : 0,
        Discount: calculatedDiscountAmount,
        DiscountType: DiscountType,
        CustomerName: customerName,
        MobileNo: mobileNumber,
        customerid: customerid,

        Order_Type: activeTab, // Add the active tab as Order_Type
        isPickup: activeTab === 'Pickup' ? 1 : 0,
        isdelivery: activeTab === 'Delivery' ? 1 : 0,
        isHomeDelivery: (activeTab === 'Delivery' || activeTab === 'Quick Bill') ? 1 : 0,
        Steward: selectedWaiter, // Add selected waiter name
        PAX: pax || 1, // Use the PAX value from the input field
        TxnDatetime: user?.currDate, // Pass curr_date from useAuthContext
        curr_date: user?.currDate, // Pass curr_date for KOT number generation based on business date
        KOTUsedDate: user?.currDate,

        // Frontend calculated totals - send to backend
        GrossAmt: Number(taxCalc.subtotal.toFixed(2)),
        TaxableValue: Number(taxCalc.taxableValue.toFixed(2)),
        CGST: Number(taxCalc.cgstAmt.toFixed(2)),
        SGST: Number(taxCalc.sgstAmt.toFixed(2)),
        IGST: Number(taxCalc.igstAmt.toFixed(2)),
        CESS: Number(taxCalc.cessAmt.toFixed(2)),
        RoundOFF: Number(roundOffValue.toFixed(2)),
        Amount: Number(taxCalc.grandTotal.toFixed(2)),
      };

      // console.log('TxnDatetime from useAuthContext:', user?.curr_date);
      // console.log('Sending payload to createKOT:', JSON.stringify(kotPayload, null, 2));
      const resp = await OrderService.createKOT(kotPayload);
      if (resp?.success) {
        // Debugging: Log the entire data response to check field names
       // console.log("KOT SAVE RESPONSE: ", resp.data);

        toast.success('KOT saved successfully!');

        // Focus Mode logic: Navigate back to table list when focusMode OFF
        if (!focusMode && activeTab === 'Dine-in') {
          setShowOrderDetails(false);
          setTimeout(() => {
            if (tableSearchInputRef.current) {
              tableSearchInputRef.current.focus();
              tableSearchInputRef.current.select();
            }
          }, 150);
        }

        // Update TxnNo and TxnID from the response
        if (resp?.data) {
          const { orderNo, TxnID } = resp.data;
          setOrderNo(orderNo ?? null);
          const txnId = TxnID ?? null;
          setCurrentTxnId(txnId);

          // Robustly set KOT number, checking for different possible casings
          const receivedKotNo = resp.data.KOTNo ??
            resp.data.KOTNo ??
            resp.data.KOTNo ??
            resp.data.KOTNo ??
            null;
          setCurrentKOTNo(receivedKotNo);

          // 🔥 THIS IS THE FIX
          setCurrentKOTNos(prev => {
            if (!receivedKotNo) return prev;
            return [...new Set([...(prev || []), receivedKotNo])];
          });

          if (!txnId) {
            throw new Error("TxnID not found after KOT save");
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
          setIsPrintMode(false);
          // 🔥 HARD RESET after KOT save
           if (activeTab !== 'Quick Bill') {
            setItems([]);
          }
          setPrintItems([]);
          setReverseQtyItems([]);
          setReversedItems([]);
          setReverseQtyMode(false);
          setIsGroupedView(true);
          // setCurrentKOTNo(null);
          // setCurrentKOTNos([]);
          // setCurrentTxnId(null);
          // setOrderNo(null);

          // IMPORTANT
          setPersistentTxnId(null);
          setPersistentTableId(0);
          setSourceTableId(null);
          // ✅ Clear customer details after KOT save for Dine-in, Pickup, Delivery
          if (['Dine-in', 'Pickup', 'Delivery'].includes(activeTab)) {
           
            
          }

          // After saving KOT, prepare items for printing and show print modal
          let kotItemsToPrint;
          if (['Pickup', 'Delivery', 'Quick Bill'].includes(activeTab)) {
            // For these tabs, print all items as the order KOT
            kotItemsToPrint = items.map(i => ({
              ...i,
              isNew: true,
              kotNo: currentKOTNo || undefined
            }));
          } else {
            // For Dine-in, print only new items
            kotItemsToPrint = newItemsToKOT.map(i => ({
              ...i,
              isNew: true,
              kotNo: currentKOTNo || undefined
            }));
          }

          // Ensure selectedTable is set for the preview
          if (!selectedTable && selectedTableRecord) {
            setSelectedTable(selectedTableRecord.table_name);
          }

          setPrintItems(kotItemsToPrint);
          setShowKotPreviewModal(true);
          setKotNote(''); // Clear KOT note after printing

          // If it was a quick bill, refresh the quick bill data
          if (activeTab === 'Quick Bill') {
            await fetchQuickBillData();
          }

          // Refresh saved KOTs list in the background without blocking UI
          OrderService.getSavedKOTs({ isBilled: 0 })
            .then(listResp => {
              const list = listResp?.data || listResp;
              if (Array.isArray(list)) setSavedKOTs(list);
            })
            .catch(err => {
              // console.warn('refresh saved KOTs failed', err);
            });

          return txnId; // ✅ RETURN txnId
        } else {
          toast.error(resp?.message || 'Failed to save KOT');
          return null;
        }
      } else {
        throw new Error(resp?.message || 'Failed to save KOT');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Error saving KOT');
      return null;
    } finally {
      setLoading(false);
    }
  };
  const handlePrintAndSettle = async () => {
    if (items.length === 0) {
      toast.error('No items to process.');
      return;
    }
    if (!currentTxnId) {
      toast.error('Cannot proceed. No transaction ID found.');
      return;
    }
    setLoading(true);
    try {
      // 1️⃣ Mark as Billed (Generate TxnNo) using OrderService
      const billedRes = await OrderService.markBillAsBilled(currentTxnId, {
        outletId: selectedOutletId || Number(user?.outletid),
        customerName: customerName || null,
        mobileNo: mobileNumber || null,
        customerid: customerid || null,
      });

      if (!billedRes.success) {
        throw new Error(billedRes.message || 'Failed to mark as billed.');
      }

      // 2️⃣ Set Order / Txn No (VERY IMPORTANT)
      const txnNo = billedRes.data?.TxnNo;
      if (!txnNo) {
        toast.error('TxnNo not generated');
        return;
      }

      setOrderNo(txnNo);

      toast.success('Bill marked as printed!');

      // 3️⃣ Open Bill Print Preview Modal + Set Flow State
      setShowBillPrintModal(true);
      setPrintThenSettleFlow(true);

    } catch (error: any) {
      // console.error('Error in Print & Settle:', error);
      toast.error(error.message || 'An error occurred while printing bill.');
    } finally {
      setLoading(false);
    }
  };
  const handleSaveReverse = async () => {
    if (!persistentTxnId) {
      toast.error('Cannot save reversal. No active transaction found.');
      return;
    }

    // ✅ Disable the button immediately to prevent double-clicks
    setIsSaveReverseDisabled(true);

    try {
      const response = await OrderService.createReverseKOT({
        txnId: persistentTxnId,
        tableId: persistentTableId,
        kotType: 'Reverse',
        isReverseKot: 1,
        reversedItems: reverseQtyItems.map(item => ({
          txnDetailId: item.txnDetailId ?? 0,
          item_no: String(item.item_no ?? ''),
          name: item.name,
          qty: item.qty,
          price: item.price,
          itemId: item.id,
          itemName: item.name
        })),
        userId: user?.id,
        reversalReason: 'Full Reverse from UI', // You can add a specific reason here if needed
        curr_date: user?.currDate,

      });

      if (response.success) {
        toast.success('Reverse KOT processed successfully!');

        // 2️⃣ FIXED: Table status update - FORCE status=0 if all items fully reversed (use txnDetailId matching)
        if (selectedTable) {
          const tableToUpdate = tableItems.find(t => t.table_name === selectedTable);
          if (tableToUpdate) {
            // ✅ FIXED: Precise full reversal check using txnDetailId (more reliable than item_no)
            // Post-backend remaining qty should be reflected in items[] already via refreshItemsForTable
            const totalRemainingQty = items.reduce((sum, item) => sum + item.qty, 0);
            const allReversed = totalRemainingQty <= 0;

            const newStatus = allReversed ? 0 : 1;
            // console.log('🔧 F8 Reversal DEBUG:', {
            //   totalRemainingQty,
            //   allReversed,
            //   newStatus,
            //   tableId: tableToUpdate.tableid,
            //   itemCount: items.length
            // });

            await OrderService.updateTableStatus(tableToUpdate.tableid, { status: newStatus });

            if (allReversed) {
              toast.success('✅ All KOTs reversed! Table status updated to 0 (Vacant)');
            }
          }
        }

        // 3️⃣ FORCE REFRESH table list to sync status change
        await fetchTableManagement();

        // 🔥 FIX: SNAPSHOT before reset
        if (reverseQtyItems.length > 0) {
          setTableNameSnapshot(selectedTable || 'Table');
          setReverseSnapshot([...reverseQtyItems]);
          setShowReverseKotPrintModal(true);
          setReversePrintTrigger(prev => prev + 1);
        }

        // ✅ If the reversal was from Pickup or Delivery, refresh and show that view.
        if (activeTab === 'Pickup' || activeTab === 'Delivery') {
          handlePendingOrderTabClick(activeTab.toLowerCase() as 'pickup' | 'delivery');
        }
        // Reset UI after successful save
        setItems([]);
        setReversedItems([]);
        setSelectedTable(null);
        setShowOrderDetails(false);
        setReverseQtyMode(false);
        setShowSaveReverseButton(false);
        setReverseQtyItems([]);
        setSourceTableId(null);
        setDiscount(0);
        setDiscountInputValue(0);
        setRoundOffValue(0);
        setCurrentKOTNo(null);
        setCurrentKOTNos([]);
        setPersistentTxnId(null);
        setPersistentTableId(0);

        fetchTableManagement();

      } else {
        throw new Error(response.message || 'Failed to process reverse KOT.');
      }

    } catch (error: any) {
      toast.error(error.message || 'Error while saving reversal.');
    } finally {
      setIsSaveReverseDisabled(false);
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
      const response = await OrderService.verifyBillCreatorPassword(password, finalTxnId.toString());

      const data = response.data;

      if (response.success) {
        setShowF8PasswordModal(false);
        // Proceed with F8 action: activate reverse mode, set expanded view, refresh items, initialize reverseQtyItems
        setReverseQtyMode(true);
        setIsGroupedView(false);
        setShowSaveReverseButton(true);
        setIsSaveReverseDisabled(false);
        setReverseQtyItems([]); // Initialize empty for reversals
        // Refresh items to get latest net qty from backend
        if (sourceTableId) {
          try {
            await refreshItemsForTable(sourceTableId);
          } catch (refreshError) {
            // console.error('Error refreshing items after F8 auth:', refreshError);
            toast.error('Failed to refresh items. Please try again.');
            return;
          }
        }
        toast.success('Reverse Qty Mode activated and expanded view shown.');
      } else {
        setF8PasswordError(data.message || 'Invalid password');
      }
    } catch (error) {
      // console.error('F8 password verification error:', error);
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

  const handleLoadQuickBill = async (bill: any) => {
    try {
      setLoading(true);
      // Keep Quick Bill list visible on left
      // setShowOrderDetails(true); // Show order panel ONLY if needed

      // 2. Fetch FULL bill data including header (tax, discount, dept)
      const fullBillRes = await OrderService.getBillById(bill.TxnID);
      if (!fullBillRes.success || !fullBillRes.data) {
        toast.error('Failed to load bill details');
        return;
      }
      const fullBill = fullBillRes.data;
      const header = fullBill.header ?? {};

      // 3. Set active tab
      setActiveTab('Quick Bill');

      // 4. Load FULL order data from header + details
      setCurrentTxnId(fullBill.header.TxnID);
      setPersistentTxnId(fullBill.header.TxnID);
      setOrderNo(fullBill.header.TxnNo);
      setCurrentKOTNo(fullBill.header.KOTNo || null);
      setCurrentKOTNos([fullBill.header.KOTNo || 0].filter(Boolean));

      // ✅ RESTORE CUSTOMER
      setCustomerName(fullBill.header.CustomerName || '');
      setMobileNumber(fullBill.header.MobileNo || '');
      setCustomerId(fullBill.header.customerid || null);

      // ✅ RESTORE OUTLET + DEPT (CRITICAL for TAX)
      setSelectedOutletId(header.outletid ?? null);
      // Dept fallback: header → mst_setting → first dept
      let deptId = fullBill.header.departmentid;
      if (!deptId && selectedOutletId) {
        try {
          const mstRes = await OrderService.getMstSettingByOutlet(selectedOutletId);
          deptId = mstRes.data?.departmentid ?? 0;
        } catch { }
      }
      if (!deptId && departments.length > 0) {
        deptId = departments[0].departmentid;
      }
      setSelectedDeptId(deptId ?? 0);

      // ✅ RESTORE DISCOUNT (CRITICAL for TOTALS)
      if (fullBill.header.Discount || fullBill.header.DiscPer) {
        setDiscountType(fullBill.header.DiscountType ?? 1);
        setDiscountInputValue(fullBill.header.DiscountType === 1 ? (fullBill.header.DiscPer || 0) : (fullBill.header.Discount || 0));
        setDiscount(fullBill.header.Discount || 0);
      }

      // 5. Map FULL items from details (incl. reversed qty)
      const fetchedItems = fullBill.details.map((item: any) => ({
        ...item,
        id: item.ItemID,
        txnDetailId: item.TXnDetailID,
        name: item.ItemName || 'Unknown',
        price: item.RuntimeRate,
        qty: Number(item.Qty) - Number(item.RevQty || 0),
        isNew: false,
        isBilled: item.isBilled ?? 0,
        originalQty: item.Qty,
        kotNo: item.KOTNo,
        variantId: item.VariantID || null,
        variantName: item.VariantName || null
      })).filter(item => item.qty > 0);
      setItems(fetchedItems);

      // ✅ 6. FORCE TAX RECALC (100ms delay for useEffect)
      setTimeout(() => {
        // console.log('🔥 QuickBill loaded → taxCalc:', taxCalc.grandTotal, 'vs list:', bill.GrandTotal);
      }, 100);

      // toast.success('Quick Bill loaded with taxes & discount');
    } catch (error: any) {
      // console.error('Error loading Quick Bill:', error);
      toast.error('Failed to load bill details');
    } finally {
      setLoading(false);
    }
  };

  const handleF9PasswordSubmit = async (password: string) => {
    if (!user?.token) {
      toast.error("Authentication token not found. Please log in again.");
      return;
    }

    setF9BilledPasswordLoading(true);
    setF9BilledPasswordError('');
    try {
      // Verify creator password using OrderService
      const verifyRes = await OrderService.verifyCreatorPassword(password);

      if (verifyRes.success) {
        // Password verified, now call the bill reversal endpoint
        if (!currentTxnId) {
          setF9BilledPasswordError("Transaction ID not found. Cannot reverse bill.");
          return;
        }

        try {
          // Reverse bill using OrderService
          const reverseRes = await OrderService.reverseBill(currentTxnId, { userId: user.id });

          if (reverseRes.success) {
            toast.success('Bill reversed successfully!');
            setShowCtrlF9BilledPasswordModal(false);

            // ✅ Optimistically update the table status in the UI
            const reversedTableName = selectedTable;
            if (reversedTableName) {
              setTableItems(prevTables =>
                prevTables.map(table =>
                  table.table_name === reversedTableName ? { ...table, status: 0 } : table
                )
              );
            }

            // ✅ Clear current UI states
            setItems([]);
            setReversedItems([]);
            setSelectedTable(null);
            setShowOrderDetails(false);
            setCurrentTxnId(null);
            setOrderNo(null);
            setCurrentKOTNo(null);
            setCurrentKOTNos([]);
            setSourceTableId(null);
          } else {
            setF9BilledPasswordError(reverseRes.message || 'Failed to reverse the bill.');
          }
        } catch (reverseError) {
          setF9BilledPasswordError('An error occurred while reversing the bill.');
        }
      } else {
        setF9BilledPasswordError(verifyRes.message || 'Invalid password');
      }
    } catch (error) {
      setF9BilledPasswordError('An error occurred. Please try again.');
    } finally {
      setF9BilledPasswordLoading(false);
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
          // console.log(`Ctrl + ${tabIndex} pressed, activating tab: ${selectedTab}`);
        }
      }
      if (e.key === "F10" && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        handlePrintBill();
        return;
      }
      if (e.key === "F9" && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        // If in Quick Bill tab and showPrintBoth is true, print both KOT and Bill
        if (activeTab === 'Quick Bill' && showPrintBoth) {
          handlePrintKotAndBill();
        } else {
          handlePrintAndSaveKOT();
        }
        return;
      }
      if (e.key === "F11" && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        handlePrintAndSettle();
        return;
      }

      // 🔹 Keyboard event listener for F8 Reverse Mode
      if (e.key === "F8" && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();

        // ✅ If Dine-in tab → Table must be selected
        if (activeTab === "Dine-in" && !selectedTable) {
          toast.error("Please select a table first.");
          return;
        }

        // ✅ If Pickup / Delivery / QuickBill → Order must exist (TxnID required)
        if (
          (activeTab === "Pickup" ||
            activeTab === "Delivery" ||
            activeTab === "Quick Bill") &&
          !persistentTxnId
        ) {
          toast.error("No active order found to reverse!");
          return;
        }

        // Check if there are any items on the table
        if (items.length === 0) {
          toast.error("No items on the table to reverse.");
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
              const res = await OrderService.getOutletSettings(selectedOutletId);
              if (res.success && res.data) {
                const settings = res.data;
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
            //console.error("Failed to fetch latest outlet settings for Reverse Qty Mode", error);
            // Default to password required if error occurs
            setReverseQtyConfig('PasswordRequired');
            setShowAuthModal(true);
          }
        };
        fetchLatestReverseQtySettingForUnbilled();
      }
      if (e.ctrlKey && e.key === 'F9') {
        e.preventDefault();
        if (items.length === 0) {

          toast.error("No items to reverse.");
          return;
        }

        // Check if there are any billed items before proceeding
        const hasBilledItems = items.some(item => item.isBilled === 1);

        if (hasBilledItems) {
          // Only show password modal if there are billed items
          setShowCtrlF9BilledPasswordModal(true);
        } else {
          toast.error("F9 (Bill Reversal) is only available for billed orders.");
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [departments, selectedOutletId, items, selectedTable]);

  useEffect(() => {
    if (printTrigger > 0 && items.length > 0) {
      handlePrintBill();
      // Reset the trigger to prevent re-printing on other item changes
      setPrintTrigger(0);
    }
  }, [printTrigger, items]);


  useEffect(() => {
    if (activeTab === 'Dine-in' && !showOrderDetails && tableSearchInputRef.current) {
      tableSearchInputRef.current.focus();
    }
  }, [activeTab, showOrderDetails]);

  useEffect(() => {
    const updateTableStatuses = () => {
      setTableItems(prevTables =>
        prevTables.map(table => {
          if (table.status === 2 && table.billPrintedDate) { // status 2 is 'printed'
            const now = new Date();
            const diffMinutes = (now.getTime() - new Date(table.billPrintedDate).getTime()) / (1000 * 60);
            if (diffMinutes >= 10) {
              return { ...table, status: 4 }; // 4 for pending
            }
          }
          return table;
        })
      );
    };

    updateTableStatuses(); // Initial check
    const interval = setInterval(updateTableStatuses, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
   // console.log('State update - showOrderDetails:', showOrderDetails, 'selectedTable:', selectedTable);
  }, [showOrderDetails, selectedTable]);

  const handleApplyDiscount = async () => {
    if (!currentTxnId) {
      toast.error("Please save the KOT before applying a discount.");
      return;
    }

    // Calculate lineTotal for discount calculation
    const activeItems = items.filter(item => !item.isReverse);
    const lineTotal = activeItems.reduce((sum, item) => sum + item.price * item.qty, 0);

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
      // Use lineTotal (gross amount) for percentage discount calculation
      appliedDiscount = parseFloat(((lineTotal * discountInputValue) / 100).toFixed(2));

    } else { // Amount
      // Use lineTotal for amount discount validation
      if (discountInputValue <= 0 || discountInputValue > lineTotal || isNaN(discountInputValue)) {
        toast.error(`Discount amount must be > 0 and <= gross total (${lineTotal.toFixed(2)})`);
        return;
      }
      appliedDiscPer = 0;
      appliedDiscount = discountInputValue;
    }

    setLoading(true);
    setDiscount(appliedDiscount); // Ensure the discount state is updated
    try {
      // Apply discount using OrderService
      const result = await OrderService.applyDiscount(currentTxnId, {
        discount: appliedDiscount,
        discPer: appliedDiscPer,
        discountType: DiscountType,
        tableId: sourceTableId || 0,
        items: items.map(item => ({
          txnDetailId: item.txnDetailId,
          ItemID: item.id,
          Name: item.name,
          Qty: item.qty,
          RuntimeRate: item.price,
          Amount: item.qty * item.price,
        })), // Map MenuItem to BillItem for the API
      });

      if (!result.success) {
        throw new Error(result.message || 'Failed to apply discount.');
      }

      toast.success('Discount applied successfully!');
      setShowDiscountModal(false);
      // Instead of clearing the table, just refresh its data to show the discount.
      // If the table was billed, applying a discount should make it 'occupied' (green) again.
      // keep table green
      if (selectedTable) {
        setTableItems(prev =>
          prev.map(t =>
            t.table_name === selectedTable ? { ...t, status: 1 } : t
          )
        );
      }

      // clear order UI
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

  useEffect(() => {
    if (!showSettlementModal) return;
    if (outletPaymentModes.length === 0) return;

    // Check if already selected
    if (selectedPaymentModes.length > 0) return;

    const cashMode = Array.isArray(outletPaymentModes) ? outletPaymentModes.find(     m => m.mode_name?.toLowerCase() === 'cash'    ) : null;

    if (!cashMode) return;

    const payable = (taxCalc.grandTotal + (tip || 0)).toFixed(2);

    setSelectedPaymentModes(['cash']);
    setPaymentAmounts({ cash: payable });
    setIsMixedPayment(false);
  }, [
    showSettlementModal,
    outletPaymentModes,
    taxCalc.grandTotal,
    tip,
  ]);
  const handleSettleAndPrint = async (settlementsData?: any[], tipData?: number) => {
    // 🔍 DEBUG – YAHI ADD KARO
    // console.log({
    //   selectedPaymentModes,
    //   paymentAmounts,
    //   grandTotal: taxCalc.grandTotal,
    //   tip,
    //   settlementsData,
    //   tipData
    // });


    let currentSettlements = [];
    let totalPaid = 0;

    if (settlementsData && settlementsData.length > 0) {
      currentSettlements = settlementsData;
      totalPaid = settlementsData.reduce((acc: number, val: any) => acc + (Number(val.Amount) || 0), 0);
    } else {
      totalPaid = Object.values(paymentAmounts).reduce((acc, val) => acc + (Number(val) || 0), 0);
      currentSettlements = selectedPaymentModes.map(modeName => ({ PaymentType: modeName, Amount: parseFloat(paymentAmounts[modeName]) || 0 }));
    }

    const payableTotal = Number(taxCalc.grandTotal.toFixed(2));
    const difference = Number((payableTotal - totalPaid).toFixed(2));

    if (!currentTxnId) {
      toast.error('Cannot settle bill. No transaction ID found.');
      return;
    }

    if (Math.abs(difference) > 0.05) {
      toast.error(`Payment amount (${totalPaid}) does not match the total due (${payableTotal}).`);
      return;
    }

    setLoading(true);
    try {

      const finalTip = tipData ?? tip ?? 0;

      // 1. Construct the settlements payload and extract totals from settlementsData
      const settlementsPayload = currentSettlements.map((s: any) => {
        const paymentModeDetails = Array.isArray(outletPaymentModes) ? outletPaymentModes.find(pm => pm.mode_name === s.PaymentType) : null;
        // Get received_amount and refund_amount from settlements data
        const receivedAmount = s.received_amount || 0;
        const refundAmount = s.refund_amount || 0;

        const payload: SettlementPayload  = {
          PaymentTypeID: paymentModeDetails?.paymenttypeid,
          PaymentType: s.PaymentType,
          Amount: s.Amount,
          received_amount: receivedAmount,
          refund_amount: refundAmount,
          TipAmount: finalTip,
          OrderNo: orderNo ?? undefined,
          HotelID: user?.hotelid,
          Name: user?.name, // Cashier/User name
          InsertDate: `${user?.currDate} ${new Date().toTimeString().split(' ')[0]}`, // Use curr_date from useAuthContext
        };

        // Add customer data to credit payment settlements
        if (s.PaymentType?.toLowerCase() === 'credit') {
          payload.customerid = s.customerid;
          payload.customerName = s.customerName;
          payload.mobile = s.mobile;
        }

        return payload;
      });

      // Calculate total received and refund from settlements data
      const totalReceived = currentSettlements.reduce((acc: number, s: any) => acc + (Number(s.received_amount) || 0), 0);
      const totalRefund = currentSettlements.reduce((acc: number, s: any) => acc + (Number(s.refund_amount) || 0), 0);

      // 2. Call the settlement endpoint using OrderService
      const result = await OrderService.settleBill(currentTxnId, {
        bill_amount: payableTotal,
        total_received: totalReceived,
        total_refund: totalRefund,
        TipAmount: finalTip,
        settlements: settlementsPayload
      });

      if (!result.success) {
        throw new Error(result.message || 'Failed to settle bill.');
      }



      // Always refresh Quick Bill list after settlement (works regardless of tab)
      if (activeTab === 'Quick Bill' || true) {  // Force refresh
        // console.log('🔄 Calling fetchQuickBillData()...');
        await fetchQuickBillData();
        // console.log('✅ Quick Bill list refreshed');
      }

      toast.success('Settlement successful and bill printed!');

      // Clear customer fields after successful settlement
      setMobileNumber('');
      setCustomerName('');
      setCustomerId(null);

      // Reset discount and round-off fields
      setDiscount(0);
      setDiscountInputValue(0);
      setRoundOffValue(0);

      // 3. Reset UI states for the next order
      setItems([]);
      setReversedItems([]);
      setSelectedTable(null);
      setPaymentAmounts({});
      setSelectedPaymentModes([]);
      setIsMixedPayment(false);
      setTip(0); // Reset tip amount
      setShowSettlementModal(false);
      setBillActionState('initial');


      if (selectedTable) {
        const tableToUpdate = tableItems.find(t => t.table_name === selectedTable);
        if (tableToUpdate) {
          await OrderService.updateTableStatus(tableToUpdate.tableid, { status: 0 });
        }
      }

      // 🔥 FIX: Navigate to ALL tables view after settlement
      setActiveNavTab('ALL');  // Show ALL departments/tables
      setActiveTab('Dine-in');
      await fetchTableManagement();  // Refresh tables
      setTimeout(() => {
        setShowOrderDetails(false);  // Hide order panel after refresh
        setShowPendingOrdersView(false);
      }, 200);  // Small delay for table render

      setCurrentKOTNo(null);
      setCurrentKOTNos([]);
      setOrderNo(null);

    } catch (error: any) {
      // console.error('Error settling bill:', error);
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
      const result = await OrderService.applyNCKOT(currentTxnId, { NCName: ncName, NCPurpose: ncPurpose, userId: user?.id });
      if (result.success) {
        toast.success('NCKOT applied successfully to all items.');

        const ncItems = items.map(i => ({
          ...i,
          isNCKOT: 1,
          NCName: ncName,
          NCPurpose: ncPurpose
        }));

        if (ncItems.length > 0) {
          setNcPrintItems(ncItems);
          setShowNCKotPrintModal(true);
        }

        // ✅ 1️⃣ TABLE KO VACANT KARO (FRONTEND)
        await fetchTableManagement();
        // 🔥 FIX: Clear KOT states consistently after NCKOT
        setCurrentKOTNo(null);
        setCurrentKOTNos([]);
        setCurrentTxnId(null);
        setOrderNo(null);


        // ✅ 2️⃣ UI CLEAR (already correct)
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
          setShowSaveReverseButton(false); // Turn off button when mode is off
          setIsSaveReverseDisabled(true); // Disable button when mode is off
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

  const fetchPendingOrders = async (type: 'pickup' | 'delivery') => {
    setLoadingPending(true);
    setErrorPending(null);
    try {
      const data = await OrderService.getPendingOrders(type);
      if (data.success) {
        setPendingOrders(data.data);
      } else {
        throw new Error(data.message || 'Invalid data format received');
      }
    } catch (error: any) {
      setErrorPending(error.message || 'Could not fetch orders.');
      // Fallback to mock data on error
      setPendingOrders([]); // Clear orders on error
    } finally {
      setLoadingPending(false);
    }
  };
  const handleLoadPendingOrder = async (order: any) => {
    try {
      setLoading(true);
      // 1. Hide the pending orders list and show the main order details panel
      setShowPendingOrdersView(false); // Hide the list view
      setShowOrderDetails(true); // Show the order details panel

      // 2. Fetch FULL bill data including header (tax, discount, dept)
      const fullBillRes = await OrderService.getBillById(order.id);
      if (!fullBillRes.success || !fullBillRes.data) {
        toast.error('Failed to load order details');
        return;
      }
      const fullBill = fullBillRes.data;
      const header = fullBill.header ?? {};     // ✅ FIX 1


      // 3. Set the active tab to match the order type
      const orderType = order.type.charAt(0).toUpperCase() + order.type.slice(1);
      setActiveTab(orderType);
      setActiveNavTab(orderType);

      // 4. Load FULL order data from header + details
      setCurrentTxnId(fullBill.header.TxnID);
      setPersistentTxnId(fullBill.header.TxnID);
      setOrderNo(fullBill.header.TxnNo);
      setCurrentKOTNo(fullBill.header.KOTNo || null);
      setCurrentKOTNos([fullBill.header.KOTNo || 0].filter(Boolean));

      // ✅ RESTORE CUSTOMER
      setCustomerName(fullBill.header.CustomerName || order.customer?.name || '');
      setMobileNumber(fullBill.header.MobileNo || order.customer?.mobile || '');
      setCustomerId(fullBill.header.customerid || order.customerid || null);

      // ✅ RESTORE OUTLET + DEPT (CRITICAL for TAX)
      setSelectedOutletId(header.outletid ?? null);
      // Dept fallback: header → mst_setting → first dept
      let deptId = fullBill.header.departmentid;
      if (!deptId && selectedOutletId) {
        try {
          const mstRes = await OrderService.getMstSettingByOutlet(selectedOutletId);
          deptId = mstRes.data?.departmentid ?? 0;
        } catch { }
      }
      if (!deptId && departments.length > 0) {
        deptId = departments[0].departmentid;
      }
      setSelectedDeptId(deptId ?? 0);
      // ✅ RESTORE DISCOUNT (CRITICAL for TOTALS)
      if (fullBill.header.Discount || fullBill.header.DiscPer) {
        setDiscountType(fullBill.header.DiscountType ?? 1);
        setDiscountInputValue(fullBill.header.DiscountType === 1 ? (fullBill.header.DiscPer || 0) : (fullBill.header.Discount || 0));
        setDiscount(fullBill.header.Discount || 0);
      }

      // 5. Map FULL items from details (incl. reversed qty)
      const fetchedItems = fullBill.details.map((item: any) => ({
        ...item,
        id: item.ItemID,
        txnDetailId: item.TXnDetailID,
        name: item.ItemName || 'Unknown',
        price: item.RuntimeRate,
        qty: Number(item.Qty) - Number(item.RevQty || 0),
        isNew: false,
        isBilled: item.isBilled ?? 0,
        originalQty: item.Qty,
        kotNo: item.KOTNo,
        variantId: item.VariantID || null,
        variantName: item.VariantName || null
      })).filter(item => item.qty > 0);
      setItems(fetchedItems);

      // ✅ 6. FORCE TAX RECALC (100ms delay for useEffect)
      setTimeout(() => {
        // console.log('🔥 Order loaded → taxCalc:', taxCalc.grandTotal, 'vs card:', order.total);
      }, 100);

      // toast.success('Order loaded with taxes & discount');
    } catch (error: any) {
      // console.error('Error loading pending order:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrintPendingOrder = async (order: any) => {
    // 1. Load the full order data into the state, similar to handleLoadPendingOrder
    const orderType = order.type.charAt(0).toUpperCase() + order.type.slice(1);
    setActiveTab(orderType);
    setActiveNavTab(orderType);

    setCurrentTxnId(order.id);
    setPersistentTxnId(order.id);
    setOrderNo(order.TxnNo ?? order.orderNo ?? null);
    setCurrentKOTNo(order.KOTNo ?? order.kotNo ?? null);
    setCurrentKOTNos(order.KOTNo ? [order.KOTNo] : (order.kotNo ? [order.kotNo] : []));
    setCustomerName(order.customer.name);
    setMobileNumber(order.customer.mobile);
    if (order.customerid) setCustomerId(order.customerid);
    else if (order.customerid) setCustomerId(order.customerid);
    setSelectedOutletId(order.outletid);

    // 🔥 NEW: Load dept & taxes for accurate taxCalc (matches handlePendingMakePayment)
    try {
      const mstRes = await OrderService.getMstSettingByOutlet(order.outletid);
      const deptId = mstRes.data?.departmentid || departments.find(d => d.outletid === order.outletid)?.departmentid;
      if (deptId) {
        setSelectedDeptId(deptId);
        // console.log(`✅ Pending print: outlet=${order.outletid}, dept=${deptId}`);
      }
    } catch(e) {
      // console.error('Pending print dept lookup failed:', e);
    }

    const existingItems = order.items.map((item: any) => ({
      ...item,
      id: item.ItemID,
      txnDetailId: item.TXnDetailID,
      isNew: false,
      isBilled: 0, // Mark as unbilled for printing
    }));
    setItems(existingItems);

    // 2. Trigger the print action. The useEffect will handle the rest.
    setPrintTrigger(c => c + 1);

     setPendingOrders(prevOrders => 
    prevOrders.map(o => 
      o.id === order.id 
        ? { ...o, isBilled: 1 }  // Set isBilled = 1 after printing
        : o
    )
  );
  };

  const fetchPaymentModesForOutlet = async (outletId: number) => {
    try {
      const res = await OrderService.getPaymentModesByOutlet(outletId);
      if (res.success) {
        setOutletPaymentModes(res.data);
      } else {
        setOutletPaymentModes([]);
      }
    } catch (error) {
      // console.error("Failed to fetch payment modes", error);
      setOutletPaymentModes([]);
    }
  };

 const handlePendingMakePayment = async (order: any) => {
  // ✅ Now isBilled will be available from API
  if (order.isBilled !== 1) {
    toast.error('Please print the bill first before making payment');
    return;
  }
  
  setCurrentTxnId(order.id);
  setOrderNo(order.kotNo || `Order-${order.id}`);
  setItems(order.items.map((i: any) => ({ ...i, isBilled: 0, isNew: false })));
  setDiscount(0);
  setSelectedOutletId(order.outletid);

  try {
    const mstRes = await OrderService.getMstSettingByOutlet(order.outletid);
    const deptId = mstRes.data?.departmentid || departments.find(d => d.outletid === order.outletid)?.departmentid;
    if (deptId) {
      setSelectedDeptId(deptId);
    }
  } catch (e) {}

  await fetchPaymentModesForOutlet(order.outletid);
  setShowSettlementModal(true);
};
  const handlePendingOrderTabClick = (type: 'pickup' | 'delivery') => {
    setActiveNavTab(type.charAt(0).toUpperCase() + type.slice(1)); // Set the active tab
    setShowOrderDetails(false);
    setPendingType(type);
    setItems([]); // Clear items when viewing the list
    setShowPendingOrdersView(true);
    fetchPendingOrders(type);
  };

  const handlePreviewBill = () => {
    // Open the new modal instead of a new window
    setShowBillPreviewModal(true);
  };

  return (
    <div className="container-fluid p-0 m-0 fade-in" style={{ height: '100vh' }}>
      {/* Hidden KOT Preview for Printing */}
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
              flex-direction: row !important; /* This is correct */
              height: calc(100vh - 60px) !important; /* Adjust for main navbar height if any */
            }
            .billing-panel {
              width: 400px !important; /* This is correct */
              max-width: 400px !important;
              height: calc(100vh - 60px) !important; /* Match parent container height */
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
              /* This will be controlled by flex-grow */
            }
            .billing-panel-inner {
              height: 100% !important; /* Changed from 92vh to 100% */
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
            flex-direction: column; /* This is correct */
            height: 100%; /* This is correct */
          }
          .item-list-container {
            display: flex;
            flex-direction: column;
            overflow-y: auto;
            flex-grow: 1;
            max-height: 450px; /* Set max height for desktop */
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
        .receipt-preview-modal .modal-content {
            width: 320px; /* Approx 80mm */
            margin: 0 auto;
        }
        .receipt-preview-modal .modal-body {
            padding: 0;
        }
        .table-pending-danger {
            background-color: #de3ef0 !important;
            border-color: #de3ef0 !important;
            color: white !important;
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
                      onClick={() => {
                        setShowOrderDetails(false);
                        setShowPendingOrdersView(false);
                        setActiveNavTab('ALL');
                      }}
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
                          onClick={() => {
                            setShowOrderDetails(false);
                            setShowPendingOrdersView(false);
                            setActiveNavTab(department.department_name);
                          }}
                          role="tab"
                          style={{ border: 'none', borderRadius: '5px', padding: '8px 12px', fontSize: '14px', fontWeight: 500, textAlign: 'center' }}
                        >
                          {department.department_name}
                          {user?.role_level === 'outlet_user'}
                        </button>
                      </li>
                    ))
                  )}
                  {['Pickup', 'Quick Bill', 'Delivery'].map((tab, index) => (
                    <li className="nav-item flex-fill" key={index + departments.length}>
                      <button
                        className={`nav-link ${tab === activeNavTab ? 'active bg-primary text-white' : 'text-dark'}`}
                        onClick={() => {
                          if (tab === 'Pickup' || tab === 'Delivery') {
                            handlePendingOrderTabClick(tab.toLowerCase() as 'pickup' | 'delivery');
                          } else if (tab === 'Quick Bill') {
                            // When Quick Bill is clicked from the left navbar
                            fetchQuickBillData(); // Fetch the data
                            setShowOrderDetails(false); // Hide the order entry panel
                            setShowPendingOrdersView(false);
                            setActiveNavTab('Quick Bill'); // Set the tab as active
                          } else { setActiveNavTab(tab) }
                        }}
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
                                        style={{ width: '90px', height: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2px' }}
                                        onClick={() => {
                                          // console.log('Button clicked for table:', table.table_name, 'isActive:', table.isActive);
                                          handleTableClick(table.table_name);
                                        }}
                                      >
                                        <span className="text-dark fw-bold" style={{ fontSize: '15px', lineHeight: '1.1' }}>{table.table_name}</span>
                                        {(table.status === 2 || table.status === 4) && (
                                          <div className="d-flex flex-column align-items-center" style={{ fontSize: '11px', lineHeight: '1', color: 'white' }}>
                                            <span>{table.billNo || 'N/A'}</span>
                                            <span>₹{Math.round(table.billAmount || 0)}</span>

                                            <span>{table.billPrintedTime || 'N/A'}</span>
                                          </div>
                                        )}
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
                                    // console.log('Button clicked for table:', table.table_name, 'isActive:', table.isActive);
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
                              className={`btn ${getTableButtonClass(table, selectedTable === table.table_name)}`}
                              style={{ width: '90px', height: '80px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2px' }}
                              onClick={() => {
                                // console.log('Button clicked for table:', table.table_name, 'isActive:', table.isActive);
                                handleTableClick(table.table_name);
                              }}
                            >
                              <span className="text-dark fw-bold" style={{ fontSize: '13px', lineHeight: '1.1' }}>{table.table_name}</span>
                              {(table.status === 2 || table.status === 4) && (
                                <div className="d-flex flex-column align-items-center" style={{ fontSize: '11px', lineHeight: '1', color: 'white' }}>
                                  <span>{table.billNo || 'N/A'}</span>
                                  <span>₹{Math.round(table.billAmount || 0)}</span>

                                  <span>{table.billPrintedTime || 'N/A'}</span>
                                </div>
                              )}
                            </button>
                          </div>
                        )) : null}
                    </div>
                  ) : (
                    <p className="text-center text-muted mb-0">

                    </p>
                  )}
                </div>
              </div>
            )}
            {showBillingPage &&
              (() => {
                const indexOfLastItem = currentPage * itemsPerPage;
                const indexOfFirstItem = indexOfLastItem - itemsPerPage;
                const currentBills = allBills.slice(indexOfFirstItem, indexOfLastItem);
                const totalPages = Math.ceil(allBills.length / itemsPerPage);

                const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

                const cellStyle: React.CSSProperties = {
                  whiteSpace: 'normal',
                  wordBreak: 'break-word',
                  verticalAlign: 'top',
                };

                return (
                  <div className="d-flex">
                    <div
                      className="rounded shadow-sm p-3 bg-light"
                      style={{
                        width: '100%',
                        minWidth: '350px',
                        maxHeight: 'calc(100vh - 120px)',
                        overflowY: 'auto',
                      }}
                    >
                      <h5 className="mb-3 text-center text-primary fw-semibold">
                        Today's Bills ({allBills.length})
                      </h5>

                      <Table
                        striped
                        bordered
                        hover
                        responsive
                        size="sm"
                        className="mb-0"
                        style={{ tableLayout: 'fixed' }}   // 👈 IMPORTANT
                      >
                        <thead className="table-info sticky-top">
                          <tr>

                            <th style={{ width: '12%', ...cellStyle }}>Bill No</th>
                            <th style={{ width: '14%', ...cellStyle }}>Table Name</th>
                            <th style={{ width: '12%', ...cellStyle }}>Order Type</th>
                            <th style={{ width: '16%', ...cellStyle }}>Customer</th>
                            <th style={{ width: '12%', ...cellStyle }}>Mobile</th>
                            <th style={{ width: '14%', ...cellStyle }}>Payment</th>
                            <th style={{ width: '10%', ...cellStyle }}>Total</th>

                          </tr>
                        </thead>

                        <tbody>
                          {currentBills.length > 0 ? (
                            currentBills.map((bill) => (
                              <tr key={bill.TxnID}>
                                <td style={cellStyle}>{bill.TxnNo}</td>
                                <td style={cellStyle}>{bill.table_name}</td>
                                <td style={cellStyle}>{bill.OrderType}</td>
                                <td style={cellStyle}>{bill.CustomerName}</td>
                                <td style={cellStyle}>{bill.Mobile}</td>
                                <td style={cellStyle}>{bill.PaymentMode}</td>
                                <td style={cellStyle}>{bill.GrandTotal}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={7} className="text-center text-muted">
                                No bills found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                      {totalPages > 1 && (
                        <div className="d-flex justify-content-between align-items-center mt-2">
                          <span className="text-muted small">
                            Page {currentPage} of {totalPages}
                          </span>

                          <div>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => paginate(currentPage - 1)}
                              disabled={currentPage === 1}
                              className="me-2"
                            >
                              Previous
                            </Button>

                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => paginate(currentPage + 1)}
                              disabled={currentPage === totalPages}
                            >
                              Next
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-grow-1 ms-3" />
                  </div>
                );
              })()}
            {activeNavTab === 'Quick Bill' && !showOrderDetails && (
              <div
                className="rounded shadow-sm p-3 mt-0 bg-light"
                style={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}
              >
                <h5 className="mb-3">Quick Bill History</h5>
                <Table striped bordered hover responsive size="sm">
                  <thead className="table-info">
                    <tr>
                      <th>Bill No</th>
                      <th>Customer Name</th>
                      <th>Mobile No</th>
                      <th>Payment Mode</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quickBillData.length > 0 ? (
                      quickBillData.map((bill) => (
                        <tr key={bill.TxnID} onClick={() => handleLoadQuickBill(bill)} style={{ cursor: 'pointer' }}>
                          <td>{bill.TxnNo}</td>
                          <td>{bill.CustomerName || 'N/A'}</td>
                          <td>{bill.MobileNo || 'N/A'}</td>
                          <td>{bill.PaymentMode || 'N/A'}</td>
                          <td>{bill.GrandTotal?.toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center text-muted">No quick bills found.</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            )}
            {showPendingOrdersView && (
              <div
                className="rounded shadow-sm p-3 mt-0 bg-light"
                style={{ maxHeight: 'calc(100vh - 150px)', overflowY: 'auto' }}
              >
                <style>{`
      .order-card {
        border: 2px solid #e3f2fd;
        border-radius: 12px;
        transition: all 0.3s ease-in-out;
        background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }
      .order-card:hover {
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
        border-color: #2196f3;
      }
      .order-card-header {
        background: darkgreen;
        color: white;
        border-bottom: none;
        border-radius: 10px 10px 0 0;
        padding: 12px 15px;
      }
      .order-card-header strong {
        color: #ffffff;
      }
      .order-card-items {
        max-height: 200px;
        overflow-y: auto;
        padding: 10px;
      }
      .order-card-items::-webkit-scrollbar {
        width: 8px;
      }
      .order-card-items::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
      }
      .order-card-items::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 10px;
      }
      .order-card-items::-webkit-scrollbar-thumb:hover {
        background: #555;
      }
      .order-card .btn-danger {
        background: linear-gradient(135deg, #f44336 0%, #d32f2f 100%);
        border: none;
        border-radius: 8px;
        transition: all 0.2s ease;
      }
      .order-card .btn-danger:hover {
        background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
        transform: scale(1.05);
      }
    `}</style>
                <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                  <h4 className="mb-0">Pending {pendingType === 'pickup' ? 'Pickup' : 'Delivery'} Orders</h4>
                  <Button variant="outline-secondary" onClick={handleBackToTables}>
                    Back to Tables
                  </Button>
                </div>
                {loadingPending ? (
                  <div className="d-flex justify-content-center align-items-center h-100">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  </div>
                ) : errorPending ? (
                  <div className="alert alert-danger">{errorPending}</div>
                ) : pendingOrders.length === 0 ? (
                  <div className="text-center p-5">No pending orders found.</div>
                ) : (
                  <Row md={2} lg={3} xl={3} className="g-3">
                    {pendingOrders.map(order => (
                      <Col key={order.id}>
                        <Card
                          className="order-card h-100"
                          onClick={() => handleLoadPendingOrder(order)}
                          style={{ cursor: 'pointer' }}
                        >
                          <Card.Header className="order-card-header d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-center w-100">
                              <span style={{ fontSize: '1.1rem' }}>
                                <strong style={{ color: '#f5e8e8ff' }}>Order:</strong>

                                <span
                                  style={{
                                    backgroundColor: '#efe7e7ff',
                                    color: '#f51c40ff',
                                    padding: '2px 6px',
                                    borderRadius: '6px',
                                    marginLeft: '6px'
                                  }}
                                >
                                  {order.TxnNo || order.orderNo || order.order_no || '—'}
                                </span>
                              </span>

                              <span>
                                <strong>KOT:</strong> {order.KOTNo || order.kotNo || order.kot_no || '—'}
                              </span>
                            </div>
                            <div style={{ fontSize: '20px', marginTop: '5px' }}>
                              <strong style={{ color: '#FFFDE7' }}>{order.customer.name || ''}</strong>
                              <br />
                              <strong style={{ color: '#FFFDE7' }}>{order.customer.mobile || 'N/A'}</strong>
                            </div>
                          </Card.Header>


                          <Card.Body className="d-flex flex-column">
                            <div className="order-card-items mb-3">
                              <ul className="list-unstyled">
                                {order.items.map((item: any, index: number) => (
                                  <li
                                    key={index}
                                    className="border-bottom pb-1 mb-1"
                                    style={{ paddingBottom: "8px" }}
                                  >
                                    <div className="d-flex justify-content-between align-items-center">

                                      {/* Item Name */}
                                      <span style={{ flex: 1 }}>{item.name}</span>

                                      {/* Quantity */}
                                      <span style={{ flex: 0.3, textAlign: "center" }}>
                                        {item.qty}
                                      </span>

                                      {/* TOTAL + ORIGINAL PRICE */}
                                      <div
                                        className="d-flex flex-column text-end"
                                        style={{ flex: 0.6, lineHeight: "16px" }}
                                      >
                                        <span
                                          style={{
                                            fontSize: "16px",
                                            fontWeight: "600",
                                            color: "#4b5563"
                                          }}
                                        >
{Number((item.qty || 0) * (item.price || 0)).toFixed(2)}
                                        </span>

                                        <small
                                          style={{
                                            fontSize: "12px",
                                            color: "#6b7280"
                                          }}
                                        >

                                          ({Number(item.price || 0).toFixed(2)})
                                        </small>
                                      </div>

                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div className="mt-auto">
                              <div className="d-flex justify-content-between fw-bold border-top pt-2">
                                <span>{order.items.reduce((acc: number, item: any) => acc + item.qty, 0)}</span>
                                <span> ₹{(order.Amount || order.GrandTotal || order.amount || order.total || 0).toFixed(2)}</span>

                              </div>
                              <div className="d-flex gap-2 mt-3">
                                <Button
                                  variant="danger"
                                  className="flex-fill"
                                  onClick={(e) => { e.stopPropagation(); handlePendingMakePayment(order); }}
                                >
                                  Make Payment
                                </Button>
                                <Button
                                  variant="outline-primary"
                                  className="flex-fill"
                                  onClick={(e) => { e.stopPropagation(); handlePrintPendingOrder(order); }}
                                >
                                  Print Bill
                                </Button>
                              </div>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                )}
              </div>
            )}

            {showOrderDetails && activeNavTab !== 'Quick Bill' && (
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
                  selectedDeptId={selectedDeptId}
                  focusMode={focusMode}
                  setFocusMode={setFocusMode}
                  triggerFocus={triggerFocusInDetails}
                  refreshItemsForTable={refreshItemsForTable}
                  reverseQtyMode={reverseQtyMode}
                  setReverseQtyMode={setReverseQtyMode}
                  isBilled={items.some(item => item.isBilled === 1)}
                />
              </div>
            )}
          </>
        </div>
        <div className="billing-panel border-start ">
          <div className="p-1 w-100 h-100 d-flex flex-column">
            <div className="billing-panel-header flex-shrink-0">
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
                {(items.some(item => item.isNew) || ['Pickup', 'Delivery', 'Quick Bill'].includes(activeTab)) && (
                  <button
                    className="btn btn-sm btn-outline-primary p-1 me-1"
                    style={{ lineHeight: 1 }}
                    onClick={() => setShowWaiterPaxModal(true)}
                    title="Waiter & PAX"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z" />
                    </svg>
                  </button>
                )}
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
                style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '0.5rem', backgroundColor: 'white' }}
              >
                <span style={{ textAlign: 'left' }}>Item Name</span>
                <span className="text-center">Qty</span>
                <span className="text-center">Amount</span>
              </div>
            </div>
            <div
              ref={itemListRef}
              className="border item-list-container"
              style={{ overflowY: 'auto' }}
            >
              {items.length === 0 ? (
                <p className="text-center text-muted mb-0">No items added</p>
              ) : (
                (() => {
                  const kotColors = ['#f0f8ff', '#fafad2', '#e6e6fa', '#f0fff0', '#fff5ee', '#f5f5dc'];
                  // Sort items: new items first, then by KOT number, then by detail ID
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
                        const key = item.isNew ? `new-${item.id}-${item.variantId || 'no-variant'}-${index}` : `${item.id}-${item.variantId || 'no-variant'}-${item.price}`;
                        if (!acc[key]) {
                          acc[key] = { ...item, displayQty: 0, canEdit: false, kotNo: item.kotNo };
                        }
                        acc[key].displayQty += item.qty;
                        if (item.isNew) {
                          acc[key].canEdit = true;
                        }
                        return acc;
                      }, {} as Record<string, MenuItem & { displayQty: number; canEdit: boolean; kotNo?: number }>)
                    ).filter(item => item.displayQty > 0)
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
                    const isExpanded = !isGroupedView;

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

                    // Add zebra striping for readability if no other color is set
                    if (backgroundColor === 'transparent' && index % 2 !== 0) {
                      backgroundColor = '#f1f3f5'; // A light grey for alternate rows
                    } else if (backgroundColor === 'transparent') {
                      backgroundColor = '#fdfdfd';
                    }

                    return (
                      <div
                        key={isGroupedItem ? `${item.id}-${item.price}-${index}` : (item.txnDetailId ?? `new-${item.id}-${index}`)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '2fr 1fr 1fr',
                          padding: '0.25rem',
                          alignItems: 'center',
                          backgroundColor: backgroundColor,
                          fontSize: '0.9rem',
                          minHeight: '40px',
                          borderBottom: '1px solid #eee',

                        }}
                      >
                        <span className="item-name">
                          {item.name}
                          {item.variantName && (
                            <span className="text-primary ms-1" style={{ fontSize: '0.75rem' }}>
                              ({item.variantName})
                            </span>
                          )}

                          {isExpanded && (item.revQty ?? 0) > 0 && (
                            <span className="text-muted ms-2">
                              (
                              <span className="text-success fw-semibold">
                                {item.originalQty ?? item.qty}
                              </span>
                              {" - "}
                              <span className="text-danger fw-semibold">
                                {item.revQty ?? 0}
                              </span>
                              )
                            </span>
                          )}
                        </span>
                        <div className="text-center d-flex justify-content-center align-items-center gap-2">
                          <button
                            className="btn btn-danger btn-sm"
                            style={{ padding: '0 5px', lineHeight: '1' }}
                            onClick={() => {
                              if (isEditable) {
                                handleDecreaseQty(item.id, item.variantId);
                              } else if (isReverseClickable) {
                                handleReverseQty(item as MenuItem);
                              }
                            }}
                            disabled={(!isEditable && !isReverseClickable)}
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
                                // 🔥 FIX: Filter by id + variantId (identity check unreliable)
                                setItems(items.filter(i => !(i.id === originalItem.id && i.variantId === originalItem.variantId && i.isNew)));
                              } else {
                                setItems(
                                  items.map((i) =>
                                    i.id === originalItem.id && i.variantId === originalItem.variantId && i.isNew
                                      ? { ...i, qty: newQty }
                                      : i
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
                            onClick={() => handleIncreaseQty(item.id, item.variantId)}
                            disabled={!isEditable}
                          >
                            +
                          </button>
                        </div>
                        <div className="text-center">
{Number((item.price || 0) * (displayQty || 0)).toFixed(2)}
                          <div
                            style={{ fontSize: '0.65rem', color: '#6c757d', width: '50px', height: '10px', margin: '0 auto' }}
                          >

                            ({Number(item.price || 0).toFixed(2)})
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>
            <div className="billing-panel-footer flex-shrink-0" style={{ backgroundColor: 'white' }}>
              <div className="d-flex flex-column flex-md-row gap-1 p-1">
                <div className="d-flex gap- position-relative">
                  <div
                    className="border rounded d-flex align-items-center justify-content-center"
                    style={{
                      width: '50px',
                      height: '28px',
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
                    onBlur={(e) => fetchCustomerByMobile(mobileNumber, setCustomerName, setCustomerId, setCustomerAddress)}
                    className="form-control"
                    style={{
                      width: "150px",
                      height: "28px",
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
                    readOnly={activeTab === 'Dine-in'}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="form-control"
                    style={{
                      width: "150px",
                      height: "28px",
                      fontSize: "0.875rem",
                      padding: "0.25rem 0.5rem",

                    }}
                  />
                  <button
                    className="btn btn-outline-primary ms-1"
                    style={{ height: '28px', padding: '0 8px', fontSize: '0.875rem' }}
                    onClick={handleAddCustomerClick}
                    title="Add Customer"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="d-flex flex-column flex-md-row gap-2 p-3 border-top pt-1">
                {(activeTab === 'Delivery' || activeTab === 'Billing') && (
                  <input
                    type="text"
                    placeholder="Customer Address"
                    className="form-control"
                    style={{ width: '150px', height: '28px', fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                  />
                )}

                <input
                  type="text"
                  placeholder="KOT Note"
                  value={kotNote}
                  onChange={(e) => setKotNote(e.target.value)}
                  className="form-control"
                  style={{ width: '150px', height: '28px', fontSize: '0.875rem', padding: '0.25rem 0.5rem' }}
                />

                <div className="d-flex align-items-center ms-auto" style={{ position: 'relative', overflow: 'visible' }}>
                  {/* Floating Action Buttons */}
                  <Button
                    variant="primary"
                    className="rounded-circle d-flex justify-content-center align-items-center"
                    style={{ width: '30px', height: '30px', padding: '0', zIndex: 1005 }}
                    onClick={() => setShowOptions(true)}
                  >
                    <svg
                      width="15"
                      height="15"
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
                  <Button
                    variant="info"
                    className="rounded-circle d-flex justify-content-center align-items-center ms-2"
                    style={{ width: "30px", height: "30px", padding: "0", zIndex: 1005 }}
                    onClick={handlePreviewBill}
                    title="Preview Bill"
                  >
                    <svg
                      width="15"
                      height="15"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 5C7 5 3 8.5 2 12c1 3.5 5 7 10 7s9-3.5 10-7c-1-3.5-5-7-10-7zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6z"
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
                          top: '50%',
                          right: 'calc(100% + 10px)', // Position to the left with a 10px gap
                          transform: 'translateY(-50%)',
                          backgroundColor: '#eef3ff',
                          borderRadius: '30px',
                          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                          padding: '10px 15px',
                          minWidth: '220px', // Increased minimum width
                          zIndex: 1004,
                        }}
                      >
                        {/* Tax Button */}
                        <Button
                          variant="primary"
                          className="rounded-circle p-0 d-flex justify-content-center align-items-center d-none"
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
                          disabled={items.length === 0 || (activeTab === 'Dine-in' && !sourceTableId)}
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
                          disabled={items.length === 0 || (activeTab === 'Dine-in' && !sourceTableId)}
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
                          className="rounded-circle p-0 d-flex justify-content-center align-items-center d-none"
                          style={{ width: '32px', height: '32px' }}
                          onClick={() => {
                            // Always fetch latest ReverseQtyMode from backend on button click
                            const fetchLatestReverseQtySetting = async () => {
                              try {
                                if (selectedOutletId) {
                                  const res = await OrderService.getOutletSettings(selectedOutletId);
                                  if (res.success) {
                                    const settings = res.data;
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
                                // console.error("Failed to fetch latest outlet settings for Reverse Qty Mode", error);
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
                          style={{ width: "32px", height: "32px" }}
                          disabled={!sourceTableId || items.length === 0}
                          onClick={() => {
                            setShowOptions(false);
                            setTransferMode("table");   // ✅ correct
                            setShowTransferModal(true);
                          }}
                          title="Table Transfer"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            fill="currentColor"
                            viewBox="0 0 16 16"
                          >
                            <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3z" />
                          </svg>
                        </Button>

                        <Button
                          variant="warning"
                          className="rounded-circle p-0 d-flex justify-content-center align-items-center"
                          style={{ width: "32px", height: "32px" }}
                          disabled={!sourceTableId || items.length === 0}
                          onClick={() => {
                            setShowOptions(false);
                            setTransferMode("kot");
                            setShowTransferModal(true);
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
                            <path d="M1 2.5A1.5 1.5 0 0 1 2.5 1h3A1.5 1.5 0 0 1 7 2.5v3A1.5 1.5 0 0 1 5.5 7h-3A1.5 1.5 0 0 1 1 5.5v-3zM2.5 2a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 1h3A1.5 1.5 0 0 1 15 2.5v3A1.5 1.5 0 0 1 13.5 7h-3A1.5 1.5 0 0 1 9 5.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zM1 10.5A1.5 1.5 0 0 1 2.5 9h3A1.5 1.5 0 0 1 7 10.5v3A1.5 1.5 0 0 1 5.5 15h-3A1.5 1.5 0 0 1 1 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3zm6.5.5A1.5 1.5 0 0 1 10.5 9h3a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 9 13.5v-3zm1.5-.5a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3z" />
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
            </div>
            <div className="billing-panel-footer mt-auto flex-shrink-0" style={{ backgroundColor: 'white', position: 'sticky', bottom: 0 }}>
              <div className="p-2">
                <div className="bg-white border rounded p-2">
                  {showSaveReverseButton && reverseQtyItems.length > 0 && (
                    <Button
                      variant="danger"
                      className="fw-bold mt-2 w-100" // Changed disabled condition
                      disabled={isSaveReverseDisabled || !persistentTxnId}
                      onClick={handleSaveReverse}
                    >
                      {isSaveReverseDisabled ? "Saving..." : "Save Reverse"}
                    </Button>
                  )}

                  <div className="d-flex justify-content-between">
                    <span>Taxable Value</span>
                    <span>{taxCalc.taxableValue.toFixed(2)}</span>
                  </div>
                  {/* Runtime discount calculation for display */}
                  {discountInputValue > 0 && (
                    <div className="d-flex justify-content-between">
                      <span>Discount ({DiscountType === 1 ? `${discountInputValue}%` : 'Amt'})</span>
                      <span>- {(() => {
                        const activeItems = items.filter(item => !item.isReverse);
                        const lineTotal = activeItems.reduce((sum, item) => sum + item.price * item.qty, 0);
                        return DiscountType === 1
                          ? ((lineTotal * discountInputValue) / 100).toFixed(2)
                          : discountInputValue.toFixed(2);
                      })()}</span>
                    </div>
                  )}

                  {roundOffValue !== 0 && (
                    <div className="d-flex justify-content-between">
                      <span>Round Off ({roundOffTo})</span>
                      <span>{roundOffValue >= 0 ? '+' : ''}{roundOffValue.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="col-12 d-flex align-items-center">
                    {!reverseQtyMode && (
                      <div className="d-flex align-items-center gap-2">
                        {showKotButton ? (
                          // Case 1: There are new items or reverse KOT items. Show only KOT button.
                          activeTab === 'Quick Bill' && showPrintBoth ? (
                            <Button
                              variant="primary"
                              onClick={handlePrintKotAndBill}
                              style={{ display: "flex", alignItems: "center", gap: "5px" }}
                            >
                              <i className="fas fa-print"></i> Print KOT & Bill
                            </Button>
                          ) :
                            <button
                              className="btn btn-dark rounded btn-sm"
                              onClick={handlePrintAndSaveKOT}
                              disabled={reverseQtyMode}
                            >
                              🖨️ KOT (F9)
                            </button>
                        ) : (
                          // Case 2: No new items. Show other buttons based on state.
                          <>
                            {items.length === 0 && (
                              <span className="text-muted small">Add items to proceed</span>
                            )}

                            {/* Unbilled items exist */}
                            {items.length > 0 && items.some(item => item.isBilled === 0) && (
                              <>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => handlePrintBill()}
                                >
                                  🖨️ Bill (F10)
                                </Button>
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={handlePrintAndSettle}
                                >
                                  💳 Print Bill & Settle
                                </Button>
                              </>
                            )}

                            {/* All items are billed */}
                            {items.length > 0 && items.every(item => item.isBilled === 1) && (

                              <>
                                <Button
                                  size="sm"
                                  variant="primary"
                                  onClick={() => handlePrintBill()}
                                >
                                  🖨️ Bill
                                </Button>
                                <Button
                                  size="sm"
                                  variant="success"
                                  onClick={() => setShowSettlementModal(true)}
                                >
                                  💳 Settle
                                </Button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )}
                    <div className="ms-auto">
                      <span
                        className="fw-bold"
                        style={{ fontSize: '22px' }}
                      >
                        ₹{Number(taxCalc.grandTotal || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Modal show={showSavedKOTsModal} onHide={() => setShowSavedKOTsModal(false)} centered size="lg" onShow={async () => {
            try {
              const resp = await OrderService.getSavedKOTs({ isBilled: 0 })
              const list = resp?.data || resp
              if (Array.isArray(list)) setSavedKOTs(list)
            } catch (err) {
              // console.warn('getSavedKOTs modal load failed')
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
          {/* NEW: Reverse KOT Print Modal */}
          <ReverseKotPrint
            show={showReverseKotPrintModal}
            autoPrint={true}
            selectedWaiter={selectedWaiter}
            onHide={() => {
              setShowReverseKotPrintModal(false);
              setReverseSnapshot([]); // 🔥 FIX: Clear snapshot on close
            }}
            items={reverseSnapshot.map(item => ({
              ...item,
              isReverse: true,
              revQty: item.qty
            }))}
            user={user}
            restaurantName={user.hotel_name}
            outletName={user.outlet_name}
            tableName={tableNameSnapshot}
            date={user.currDate}
            reversePrintTrigger={reversePrintTrigger}
          />


          <NCKotPrint
            show={showNCKotPrintModal}
            autoPrint={true}
            selectedWaiter={selectedWaiter}
            items={ncPrintItems}
            tableName={activeTab === 'Dine-in' ? selectedTable ?? 'Table' : activeTab}
            user={user}
            restaurantName={user?.hotel_name}
            outletName={user?.outlet_name}
            date={user?.currDate}
            onHide={() => setShowNCKotPrintModal(false)}
          />

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
                    style={{ minWidth: '800px', width: '100%' }}
                  >
                    <thead>
                      <tr>
                        <th>Subtotal</th>
                        <th>Taxable Value</th>
                        {taxRates.cgst > 0 && <th>CGST ({taxRates.cgst}%)</th>}
                        {taxRates.sgst > 0 && <th>SGST ({taxRates.sgst}%)</th>}
                        {taxRates.igst > 0 && <th>IGST ({taxRates.igst}%)</th>}
                        {taxRates.cess > 0 && <th>CESS ({taxRates.cess}%)</th>}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>{taxCalc.subtotal.toFixed(2)}</td>
                        <td>{taxCalc.taxableValue.toFixed(2)}</td>
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
          {/* Bill Preview Modal */}
          <BillPreviewPrint
            show={showBillPreviewModal}
            onHide={() => setShowBillPreviewModal(false)}
            formData={formData}
            user={user}
            items={items}
            currentKOTNos={currentKOTNos}
            currentKOTNo={currentKOTNo}
            orderNo={orderNo || undefined}
            selectedTable={selectedTable}
            activeTab={activeTab}
            customerName={customerName}
            mobileNumber={mobileNumber}
            currentTxnId={currentTxnId ? currentTxnId.toString() : undefined}
            taxCalc={taxCalc}
            taxRates={taxRates}
            discount={discount}
            roundOffEnabled={roundOffEnabled}
            roundOffValue={roundOffValue}
            selectedPaymentModes={selectedPaymentModes}
            selectedOutletId={selectedOutletId}
            dialogClassName="bill-preview-80mm"
          />
          {/* Custom CSS for 80mm Bill Preview Modal */}
          <style>{`
.bill-preview-80mm .modal-dialog {
  max-width: 320px;
  margin: auto;
}

.bill-preview-80mm .modal-content {
  width: 320px !important;
  max-width: 320px !important;
  margin: 0 auto;
  overflow-x: hidden;
}

.bill-preview-80mm .modal-body {
  padding: 0;
  overflow-x: hidden;
}

/* Hide only footer buttons */
.bill-preview-80mm .modal-footer {
  display: none !important;
}
`}</style>
          {/* Settlement Modal */}
          <SettlementModal
            show={showSettlementModal}
            onHide={() => setShowSettlementModal(false)}
            onSettle={handleSettleAndPrint}
            grandTotal={taxCalc.grandTotal}
            subtotal={taxCalc.subtotal}
            loading={loading}
            outletPaymentModes={outletPaymentModes as any}
            initialSelectedModes={selectedPaymentModes}
            initialPaymentAmounts={paymentAmounts}
            initialIsMixed={isMixedPayment}
            initialTip={tip}
            table_name={selectedTable}
            initialCustomerName={customerName}
            initialMobile={mobileNumber}
            initialCustomerId={customerid}
          />
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
          {/* F9 Billed Password Modal */}
          <F8PasswordModal
            show={showF9BilledPasswordModal}
            onHide={() => {
              setShowCtrlF9BilledPasswordModal(false);
              setF9BilledPasswordError('');
            }}
            onSubmit={handleF9PasswordSubmit}
            error={f9BilledPasswordError}
            loading={f9BilledPasswordLoading}
            title="Admin Password for Reversal"
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

          <Modal
            show={showTransferModal}
            onHide={() => setShowTransferModal(false)}
            size="xl"
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>
                {transferMode === "table" ? "Table Transfer" : "KOT Transfer"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0">
              <KotTransfer
                transferSource={transferMode}       // "table" or "kot"
                sourceTableId={sourceTableId}
                onCancel={() => setShowTransferModal(false)}
                onSuccess={() => {
                  setShowTransferModal(false);

                  if (sourceTableId) {
                    refreshItemsForTable(sourceTableId); // order panel refresh
                  }

                  fetchTableManagement(); // ⭐ TABLE STATUS refresh
                }}
              />
            </Modal.Body>
          </Modal>
          <KotPreviewPrint
            show={showKotPreviewModal}
            selectedWaiter={selectedWaiter}
            onHide={() => setShowKotPreviewModal(false)}
            onClose={() => {
              setShowKotPreviewModal(false);
              // Clear the order state after KOT print
              setItems([]);
              setPrintItems([]);
              setReverseQtyItems([]);
              setReversedItems([]);
              setReverseQtyMode(false);
              setIsGroupedView(true);
              setPersistentTxnId(null);
              setPersistentTableId(0);
              setSourceTableId(null);
              setCurrentKOTNo(null);
              setCurrentKOTNos([]);
              if (activeTab === 'Dine-in') {
                if (focusMode) {
                  // In focus mode, keep order details open and focus the table input
                  setTriggerFocusInDetails(prev => prev + 1);
                  setMobileNumber('');
                  setCustomerName('');
                  setCustomerId(null);
                  // Do not hide order details or clear selected table
                } else {
                  setMobileNumber('');
                  setCustomerName('');
                  setCustomerId(null);
                  setShowOrderDetails(false);
                  setSelectedTable(null);
                }
              } else if (activeTab === 'Pickup' || activeTab === 'Delivery') {
                // Navigate back to table page for Pickup/Delivery
                setActiveTab('Dine-in');
                setActiveNavTab('ALL');
                setShowOrderDetails(false);
                setShowPendingOrdersView(false);
                setMobileNumber('');
                setCustomerName('')

                setCustomerId(null);
                setSelectedTable(null);
              }
            }}
            printItems={printItems}
            items={items}
            currentKOTNo={currentKOTNo}
            kotNo={currentKOTNo !== null ? currentKOTNo : undefined}
            selectedTable={activeTab === 'Dine-in' ? selectedTable : activeTab}
            activeTab={activeTab}
            customerName={customerName}
            mobileNumber={mobileNumber}
            user={user}
            formData={formData}
            reverseQtyMode={reverseQtyMode}
            reverseQtyItems={reverseQtyItems}
            selectedOutletId={selectedOutletId}
            autoPrint={true}
            kotNote={kotNote}
            orderNo={orderNo}
            date={user?.currDate}
            tableStatus={originalTableStatus}
            order_tag={formData.show_new_order_tag ? formData.new_order_tag_label : formData.show_running_order_tag ? formData.running_order_tag_label : ''}
          />
          <BillPreviewPrint
            show={showBillPrintModal}
             autoPrint={true}  // 👈 Direct print (no modal)
            onHide={async () => {
              setShowBillPrintModal(false);
              setBillPrintItems([]); // Clear stored items
              await fetchTableManagement(); // ✅ now valid

              if (printThenSettleFlow) {
                setShowSettlementModal(true);
                setPrintThenSettleFlow(false);
              } else {
                resetBillingPanel(); // ✅ normal print
              }
            }}
            formData={formData}
            user={user}
            items={billPrintItems.length > 0 ? billPrintItems : items} // 👈 Use stored items first
            currentKOTNos={currentKOTNos}
            currentKOTNo={currentKOTNo}
            orderNo={orderNo ?? undefined}
            selectedTable={selectedTable || undefined}
            activeTab={activeTab}
            customerName={customerName}
            mobileNumber={mobileNumber}
            currentTxnId={currentTxnId?.toString()}
            taxCalc={taxCalc}
            taxRates={taxRates}
            discount={discount}
            reason={reason}
            roundOffEnabled={roundOffEnabled}
            roundOffValue={roundOffValue}
            selectedPaymentModes={selectedPaymentModes}
            selectedWaiter={selectedWaiter}
            onPrint={() => {
              setMobileNumber('');
              setCustomerName('');
              setCustomerId(null);
            }}
            onClose={() => setShowBillPrintModal(false)}
            selectedOutletId={selectedOutletId}
            restaurantName={user?.hotel_name}
            outletName={user?.outlet_name}
          />
          {/* Waiter & PAX Modal */}
          <Modal show={showWaiterPaxModal} onHide={() => setShowWaiterPaxModal(false)} centered>
            <Modal.Header closeButton>
              <Modal.Title>Waiter & PAX</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="mb-3">
                <label>Waiter</label>
                <select
                  className="form-control"
                  value={selectedWaiter}
                  onChange={(e) => setSelectedWaiter(e.target.value)}
                >
                  <option value="">Select Waiter</option>
                  {waiterUsers.map((waiter) => (
                    <option key={waiter.userId} value={waiter.employee_name || waiter.username}>
                      {waiter.employee_name || waiter.username}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label>PAX</label>
                <input
                  type="number"
                  className="form-control"
                  value={pax}
                  onChange={(e) => setPax(Number(e.target.value) || 1)}
                  min="1"
                  max="50"
                />
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowWaiterPaxModal(false)}>
                Close
              </Button>
              <Button variant="primary" onClick={() => setShowWaiterPaxModal(false)}>
                Save
              </Button>
            </Modal.Footer>
          </Modal>
        </div>
      </div>
    </div>
  );
};
export default Order;
