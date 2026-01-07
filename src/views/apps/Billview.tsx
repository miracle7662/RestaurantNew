import React, { useEffect, useState, useRef, KeyboardEvent, useCallback, useMemo } from 'react';
import { Row, Col, Card, Table, Badge, Button, Form, Modal } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/common';
import KotTransfer from './Transaction/KotTransfer';
import CustomerModal from './Transaction/Customers';
import toast, { Toaster } from 'react-hot-toast';
import F8PasswordModal from '../../components/F8PasswordModal';
import ReverseKotModal from './ReverseKotModal';


interface BillItem {
  itemCode: string;
  itemId: number;
  item_no: number;
  itemName: string;
  qty: number;
  rate: number;
  total: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
  mkotNo: string;
  specialInstructions: string;
  itemgroupid: number;
  isBilled?: number;
  txnDetailId?: number;
  isFetched?: boolean;
}

interface MenuItem {
  restitemid: number;
  item_no: string;
  item_name: string;
  short_name: string;
  price: number;
  itemgroupid?: number;
}

interface ItemGroup {
  itemgroupid: number;
  group_name: string;
}

interface DisplayedItem extends BillItem {
  type?: 'header' | 'item';
  groupName?: string;
  isEditable?: boolean;
  originalIndex?: number;
}

const groupExistingItems = (items: BillItem[], cgstRate: number, sgstRate: number, igstRate: number, cessRate: number, includeTaxInInvoice: boolean): BillItem[] => {
  const grouped = items.reduce((acc, item) => {
    const key = item.itemId || item.itemName;
    if (!acc[key]) {
      acc[key] = { ...item };
    } else {
      acc[key].qty += item.qty;
      acc[key].total = acc[key].qty * acc[key].rate;
      if (!includeTaxInInvoice) {
        acc[key].cgst = acc[key].total * (cgstRate / 100);
        acc[key].sgst = acc[key].total * (sgstRate / 100);
        acc[key].igst = acc[key].total * (igstRate / 100);
        acc[key].cess = acc[key].total * (cessRate / 100);
      }
      if (item.mkotNo) {
        const existing = acc[key].mkotNo ? acc[key].mkotNo.split('|') : [];
        if (!existing.includes(item.mkotNo)) {
          existing.push(item.mkotNo);
        }
        acc[key].mkotNo = existing.sort((a, b) => parseInt(a) - parseInt(b)).join('|');
      }
      if (!acc[key].specialInstructions && item.specialInstructions) {
        acc[key].specialInstructions = item.specialInstructions;
      }
    }
    return acc;
  }, {} as Record<string | number, BillItem>);
  return Object.values(grouped);
};

interface Table {
  id: number;
  name: string;
  outletid: number;
}

interface Outlet {
  id: number;
  name: string;
}

interface TableManagement {
  table_name: string;
  tablemanagementid: number;
}

interface FetchedItem {
  id: number;
  txnDetailId: number;
  item_no: string;
  name: string;
  price: number;
  qty: number;
  revQty: number;
  isNCKOT: boolean;
  isNew: boolean;
  originalQty: number;
  kotNo: number;
}

const ModernBill = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [toolbarHeight, setToolbarHeight] = useState(0);

  const [billItems, setBillItems] = useState<BillItem[]>([{ itemCode: '', itemgroupid: 0, itemId: 0, item_no: 0, itemName: '', qty: 1, rate: 0, total: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, mkotNo: '', specialInstructions: '', isFetched: false }]);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const [grossAmount, setGrossAmount] = useState(0);
  const [totalCgst, setTotalCgst] = useState(0);
  const [totalSgst, setTotalSgst] = useState(0);
  const [totalIgst, setTotalIgst] = useState(0);
  const [totalCess, setTotalCess] = useState(0);
  const [roundOff, setRoundOff] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const tableId = location.state?.tableId;
  const tableName = location.state?.tableName;
  const outletIdFromState = location.state?.outletId;
  const txnIdFromState = location.state?.txnId;
  const billNoFromState = location.state?.billNo;
  const { user } = useAuthContext();

  console.log('Table ID:', tableId);
  console.log('Table Name:', tableName);

  const [waiter, setWaiter] = useState('ASD');
  const [pax, setPax] = useState(1);
  const [kotNo, setKotNo] = useState('');
  const [tableNo, setTableNo] = useState(tableName || 'Loading...');
  const [defaultKot, setDefaultKot] = useState<number | null>(null); // last / system KOT
  const [editableKot, setEditableKot] = useState<number | null>(null); // user editable
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txnId, setTxnId] = useState<number | null>(null);
  const [billNo, setBillNo] = useState<number | null>(null);
  const [billData, setBillData] = useState<any>(null);
  const [isBillPrinted, setIsBillPrinted] = useState(false);

  const [discount, setDiscount] = useState(0);
  const [DiscountType, setDiscountType] = useState(1);
  const [discountInputValue, setDiscountInputValue] = useState(0);
  const [roundOffValue, setRoundOffValue] = useState(0);
  const [items, setItems] = useState<any[]>([]);
  const [reversedItems, setReversedItems] = useState<any[]>([]);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [showReverseItemsModal, setShowReverseItemsModal] = useState(false);
  const [itemsToReverse, setItemsToReverse] = useState<{ [key: number]: number }>({});
  const [billActionState, setBillActionState] = useState('initial');
  const [tableItems, setTableItems] = useState([] as TableManagement[]);
  const [currentKOTNo, setCurrentKOTNo] = useState(null);
  const [showPendingOrdersView, setShowPendingOrdersView] = useState(false);
  const [currentKOTNos, setCurrentKOTNos] = useState<number[]>([]);
  const [orderNo, setOrderNo] = useState(billNo);
  const [activeTab, setActiveTab] = useState('Dine-in');

  const [groupBy, setGroupBy] = useState<'none' | 'item' | 'group' | 'kot'>('group');
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Tax rates states
  const [cgstRate, setCgstRate] = useState(2.5);
  const [sgstRate, setSgstRate] = useState(2.5);
  const [igstRate, setIgstRate] = useState(0);
  const [cessRate, setCessRate] = useState(0);
  const [includeTaxInInvoice, setIncludeTaxInInvoice] = useState(false);

  // Compute displayed items based on grouping
  const displayedItems: DisplayedItem[] = useMemo(() => {
    if (groupBy === 'none') {
      const hasBlankRow = billItems.some(
        item => !item.itemName && item.itemId === 0
      );

      const mappedItems = billItems.map(item => ({
        ...item,
        isEditable: item.isBilled !== 1
      }));

      return hasBlankRow
        ? mappedItems
        : mappedItems.concat({
            itemCode: '',
            itemgroupid: 0,
            itemId: 0,
            item_no: 0,
            itemName: '',
            qty: 1,
            rate: 0,
            total: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            cess: 0,
            mkotNo: '',
            specialInstructions: '',
            isEditable: true,
            isFetched: false
          });
    } else {
      let groupKey: (item: BillItem) => string;
      let groupName: (key: string) => string;

      if (groupBy === 'item') {
        groupKey = (item) => item.itemName;
        groupName = (key) => key;
      } else if (groupBy === 'group') {
        groupKey = (item) => item.itemgroupid.toString();
        groupName = (key) => "Group " + key;
      } else if (groupBy === 'kot') {
        groupKey = (item) => item.mkotNo || '';
        groupName = (key) => key ? "KOT " + key : "No KOT";
      }

      const itemsToGroup = billItems.filter(item => item.itemName && item.qty > 0);
      const grouped = itemsToGroup.reduce((acc, item) => {
        const key = groupKey(item);
        if (!acc[key]) {
          acc[key] = {
            itemCode: item.itemCode,
            itemgroupid: item.itemgroupid,
            itemId: item.itemId,
            item_no: item.item_no,
            itemName: groupName(key),
            qty: 0,
            rate: item.rate,
            total: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            cess: 0,
            mkotNo: '',
            specialInstructions: '',
            isEditable: false,
            originalIndex: billItems.findIndex(i => groupKey(i) === key),
            isFetched: true
          };
        }
        acc[key].qty += item.qty;
        acc[key].total = acc[key].qty * acc[key].rate;
        if (!includeTaxInInvoice) {
          acc[key].cgst = acc[key].total * (cgstRate / 100);
          acc[key].sgst = acc[key].total * (sgstRate / 100);
          acc[key].igst = acc[key].total * (igstRate / 100);
          acc[key].cess = acc[key].total * (cessRate / 100);
        }

        // Collect and sort MKotNo
        if (item.mkotNo) {
          const existing = acc[key].mkotNo ? acc[key].mkotNo.split('|') : [];
          if (!existing.includes(item.mkotNo)) {
            existing.push(item.mkotNo);
          }
          acc[key].mkotNo = existing.sort((a, b) => parseInt(a) - parseInt(b)).join('|');
        }

        // Use first specialInstructions
        if (!acc[key].specialInstructions && item.specialInstructions) {
          acc[key].specialInstructions = item.specialInstructions;
        }
        return acc;
      }, {} as Record<string, DisplayedItem>);

      const result = Object.values(grouped);
      // Add blank row for new entries
      result.push({ itemCode: '', itemgroupid: 0, itemId: 0, item_no: 0, itemName: '', qty: 1, rate: 0, total: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, mkotNo: '', specialInstructions: '', isEditable: true, isFetched: false });
      return result;
    }
  }, [billItems, groupBy, cgstRate, sgstRate, igstRate, cessRate, includeTaxInInvoice]);

  // Calculate totals based on displayed items
  useEffect(() => {
    const updatedItems = displayedItems.map(item => {
      const total = item.qty * item.rate;
      let cgst = 0;
      let sgst = 0;
      let igst = 0;
      let cess = 0;
      if (!includeTaxInInvoice) {
        cgst = total * (cgstRate / 100);
        sgst = total * (sgstRate / 100);
        igst = total * (igstRate / 100);
        cess = total * (cessRate / 100);
      }
      return { ...item, total, cgst, sgst, igst, cess };
    });

    const gross = updatedItems.reduce((sum, item) => sum + item.total, 0);
    const cgstTotal = updatedItems.reduce((sum, item) => sum + item.cgst, 0);
    const sgstTotal = updatedItems.reduce((sum, item) => sum + item.sgst, 0);
    const igstTotal = updatedItems.reduce((sum, item) => sum + item.igst, 0);
    const cessTotal = updatedItems.reduce((sum, item) => sum + item.cess, 0);

    const totalBeforeRoundOff = gross + cgstTotal + sgstTotal + igstTotal + cessTotal - discount;
    const roundedFinalAmount = Math.round(totalBeforeRoundOff);
    const ro = roundedFinalAmount - totalBeforeRoundOff;

    setGrossAmount(gross);
    setTotalCgst(cgstTotal);
    setTotalSgst(sgstTotal);
    setTotalIgst(igstTotal);
    setTotalCess(cessTotal);
    setFinalAmount(roundedFinalAmount);
    setRoundOff(ro);
    setTaxCalc({ grandTotal: roundedFinalAmount, subtotal: gross });
  }, [displayedItems, cgstRate, sgstRate, igstRate, cessRate, includeTaxInInvoice, discount]);

  // Fetch bill details
  const fetchBillDetails = async () => {
    if (!txnId) return;
    try {
      const response = await axios.get(`/api/TAxnTrnbill/${txnId}`);
      setBillData(response.data);
      setIsBillPrinted(response.data.isPrinted || false);
    } catch (error) {
      console.error('Error fetching bill details:', error);
    }
  };

  // Load bill details for the current table
  const loadBillDetails = async () => {
    if (tableId) {
      await loadBillForTable(tableId);
    }
  };

  // Modal states
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [showReverseBillModal, setShowReverseBillModal] = useState(false);
  const [showReverseKOTModal, setShowReverseKOTModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showNCKOTModal, setShowNCKOTModal] = useState(false);
  const [showKotTransferModal, setShowKotTransferModal] = useState(false);
  const [transferMode, setTransferMode] = useState<"kot" | "table">("table");
  const [transferSource, setTransferSource] = useState<"kot" | "table">("table");
  const [ncName, setNcName] = useState('');
  const [ncPurpose, setNcPurpose] = useState('');

  // Settlement modal states
  const [isMixedPayment, setIsMixedPayment] = useState(false);
  const [selectedPaymentModes, setSelectedPaymentModes] = useState<string[]>([]);
  const [paymentAmounts, setPaymentAmounts] = useState<{ [key: string]: string }>({});
  const [tip, setTip] = useState<number>(0);
  const [outletPaymentModes, setOutletPaymentModes] = useState<any[]>([]);
  const [taxCalc, setTaxCalc] = useState({ grandTotal: 0, subtotal: 0 });
  const [settlements, setSettlements] = useState([{ PaymentType: 'Cash', Amount: finalAmount }]);

  // Reverse Bill modal data
  const [reversePassword, setReversePassword] = useState('');

  // Reverse KOT modal data
  const [showReverseKot, setShowReverseKot] = useState(false);
  const [revKotNo, setRevKotNo] = useState(21);
  const [reverseQty, setReverseQty] = useState(1);
  const [reverseReason, setReverseReason] = useState('');

  // Transfer modal data
  const [availableTables, setAvailableTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const [customerMobile, setCustomerMobile] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
const [showF8PasswordModal, setShowF8PasswordModal] = useState(false);
  const [f8Error, setF8Error] = useState<string | null>(null);

  const [showF9BilledPasswordModal, setShowF9BilledPasswordModal] = useState(false);
  const [f9BilledPasswordError, setF9BilledPasswordError] = useState('');
  const [f9BilledPasswordLoading, setF9BilledPasswordLoading] = useState(false);

  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountReason, setDiscountReason] = useState('');
  const [givenBy, setGivenBy] = useState('');
  const [reason, setReason] = useState('');
  const [DiscPer, setDiscPer] = useState(0);

  const handleDiscountKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setShowDiscountModal(false);
  };

  const handleF9PasswordSubmit = async (password: string) => {
    if (!(user as any)?.token) {
      toast.error("Authentication token not found. Please log in again.");
      return;
    }

    setF9BilledPasswordLoading(true);
    setF9BilledPasswordError('');
    try {
      const response = await fetch('http://localhost:3001/api/auth/verify-creator-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(user as any).token}`
        },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Password verified, now call the bill reversal endpoint
        if (!txnId) {
          setF9BilledPasswordError("Transaction ID not found. Cannot reverse bill.");
          return;
        }

        try {
          const reverseResponse = await fetch(`http://localhost:3001/api/TAxnTrnbill/${txnId}/reverse`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(user as any).token}`
            },
            body: JSON.stringify({ userId: user.id }) // Pass admin's ID for logging
          });

          const reverseData = await reverseResponse.json();

          if (reverseResponse.ok && reverseData.success) {
            toast.success('Bill reversed successfully!');
            setShowF9BilledPasswordModal(false);

            // ✅ Optimistically update the table status in the UI
            if (tableName) {
              setTableItems(prevTables =>
                prevTables.map(table =>
                  table.table_name === tableName ? { ...table, status: 0 } : table
                )
              );
            }

            // ✅ Clear current UI states
            resetBillState();
            setItems([]);
            setReversedItems([]);
            setSelectedTable(null);
            setShowOrderDetails(false);
            setCurrentKOTNo(null);
            setCurrentKOTNos([]);
            setOrderNo(null);
            
            navigate('/apps/Tableview');
          } else {
            setF9BilledPasswordError(reverseData.message || 'Failed to reverse the bill.');
          }
        } catch (reverseError) {
          setF9BilledPasswordError('An error occurred while reversing the bill.');
        }
      } else {
        setF9BilledPasswordError(data.message || 'Invalid password');
      }
    } catch (error) {
      setF9BilledPasswordError('An error occurred. Please try again.');
    } finally {
      setF9BilledPasswordLoading(false);
    }
  };

  // Outlet selection states
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<number | null>(outletIdFromState || user?.outletid || null);
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);

  // Tax details state
  const [taxDetails, setTaxDetails] = useState<any>(null);


  // Handle customer modal
  const handleCloseCustomerModal = () => setShowCustomerModal(false);

  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);
  const kotInputRef = useRef<HTMLInputElement | null>(null);

  // Load bill for table: try billed first, then unbilled
  const loadBillForTable = async (tableIdNum: number) => {
    setLoading(true);
    setError(null);
    try {
      // STEP 1: try billed bill first
      try {
        const billedBillRes = await axios.get(
          `/api/TAxnTrnbill/billed-bill/by-table/${tableIdNum}`
        );
        if (billedBillRes.status === 200) {
          const billedBillData = billedBillRes.data;
          if (billedBillData.success && billedBillData.data) {
            const { details, ...header } = billedBillData.data;
            const fetchedItems: FetchedItem[] = details
              .map((item: any) => ({
                id: item.ItemID,
                txnDetailId: item.TXnDetailID,
                item_no: item.item_no,
                name: item.ItemName || 'Unknown Item',
                price: item.RuntimeRate,
                qty: (Number(item.Qty) || 0) - (Number(item.RevQty) || 0),
                revQty: Number(item.RevQty) || 0,
                isNCKOT: item.isNCKOT,
                isNew: false,
                originalQty: item.Qty,
                kotNo: item.KOTNo,
              }))
              .filter((item: FetchedItem) => item.qty > 0);

            // Map to billItems
            const mappedItems: BillItem[] = fetchedItems.map((item: any) => {
              const total = item.qty * item.price;
              const cgst = total * (cgstRate / 100);
              const sgst = total * (sgstRate / 100);
              return {
                itemCode: item.item_no.toString(),
                itemgroupid: item.id,
                itemId: item.id,
                item_no: item.item_no,
                itemName: item.name,
                qty: item.qty,
                rate: item.price,
                total,
                cgst,
                sgst,
                igst: 0,
                cess: 0,
                mkotNo: item.kotNo ? item.kotNo.toString() : '',
                specialInstructions: '',
                isBilled: 1,
                txnDetailId: item.txnDetailId,
                isFetched: true
              };
            });
            // // Add blank row
            // mappedItems.push({ itemCode: '', itemgroupid: 0, itemId: 0, item_no: 0, itemName: '', qty: 1, rate: 0, total: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, mkotNo: '', specialInstructions: '' });

            setBillItems(mappedItems);
            setTxnId(header.TxnID);
            setOrderNo(header.TxnNo);
            setWaiter(header.waiter || 'ASD');
            setPax(header.pax || 1);
            setTableNo(header.table_name || tableName);
            setCurrentKOTNos(
              Array.from(new Set(fetchedItems.map((i: FetchedItem) => i.kotNo))).sort((a: number, b: number) => a - b)
            );
            setBillActionState('printOrSettle');
            // restore discount
            if (header.Discount || header.DiscPer) {
              setDiscount(header.Discount || 0);
              setDiscountInputValue(
                header.DiscountType === 1 ? header.DiscPer : header.Discount || 0
              );
              setDiscountType(header.DiscountType ?? 1);
            } else {
              setDiscount(0);
              setDiscountInputValue(0);
            }
            setReversedItems(
              (billedBillData.data.reversedItems || []).map((item: any) => ({
                ...item,
                name: item.ItemName || 'Unknown Item',
                id: item.ItemID,
                price: item.RuntimeRate || 0,
                qty: Math.abs(item.Qty) || 1,
                isReversed: true,
                status: 'Reversed',
                kotNo: item.KOTNo,
              }))
            );
            calculateTotals(mappedItems);
            setLoading(false);
            return;
          }
        }
      } catch (billedErr) {
        console.log('Billed bill not found or error, falling back to unbilled items');
      }
      // STEP 2: fallback to unbilled API
      loadUnbilledItems(tableIdNum);
    } catch (err) {
      console.error('Error loading bill for table:', err);
      setError('Failed to load bill data');
      setLoading(false);
    }
  };

  // Fetch table data when tableId is present
  const loadUnbilledItems = useCallback(async (tableIdNum: number) => {
    if (!tableIdNum || !user || !user.hotelid) return;

    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/TAxnTrnbill/unbilled-items/${tableIdNum}`);
      if (response.status !== 200) {
        throw new Error(`Server responded with status ${response.status}`);
      }
      const data = response.data?.data || response.data;
      if (!data) {
        throw new Error('No data received from server');
      }

      // Map items to BillItem interface
      const mappedItems: BillItem[] = data.items.map((item: any) => {
        return {
          itemCode: (item.item_no || item.item_no || '').toString(),
          itemId: item.itemId || item.ItemID || 0,
          itemgroupid: item.itemgroupid || 0,
          item_no: item.item_no || item.ItemNo || '',
          itemName: item.itemName || item.ItemName || item.item_name || '',
          qty: item.netQty || item.Qty || 0,
          rate: item.price || item.Price || item.Rate || 0,
          total: (item.netQty || item.Qty || 0) * (item.price || item.Price || item.Rate || 0),
          cgst: ((item.netQty || item.Qty || 0) * (item.price || item.Price || item.Rate || 0)) * 0.025,
          sgst: ((item.netQty || item.Qty || 0) * (item.price || item.Price || item.Rate || 0)) * 0.025,
          igst: 0,
          cess: 0,
          mkotNo: item.kotNo ? item.kotNo.toString() : (item.KOTNo ? item.KOTNo.toString() : ''),
          specialInstructions: item.specialInstructions || item.SpecialInst || '',
          isBilled: 0,
          txnDetailId: item.txnDetailId,
          isFetched: true
        };
      });

      // Always add a blank row at the end for new item entry
      mappedItems.push({ itemCode: '', itemgroupid: 0, itemId: 0, item_no: 0, itemName: '', qty: 1, rate: 0, total: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, mkotNo: '', specialInstructions: '', isFetched: false });

      setBillItems(mappedItems);

      // Update header fields from data.header and data.kotNo if available
      console.log('API Response Header:', data.header);
      if (data.header) {
        setTxnId(data.header.TxnID);
        setWaiter(data.header.waiter || 'ASD');
        setPax(data.header.pax || 1);
        if (data.header.table_name) {
          setTableNo(data.header.table_name);
        }
        if (data.header.Discount || data.header.DiscPer) {
          setDiscount(data.header.Discount || 0);
          setDiscountInputValue(
            data.header.DiscountType === 1 ? data.header.DiscPer : data.header.Discount || 0
          );
          setDiscountType(data.header.DiscountType ?? 1);
        } else {
          setDiscount(0);
          setDiscountInputValue(0);
        }
      }
      if (data.kotNo !== null && data.kotNo !== undefined) {
        setKotNo(String(data.kotNo));
      }

      // Calculate totals
      calculateTotals(mappedItems);
    } catch (err: any) {
      if (err.response) {
        setError(`Server responded with status ${err.response.status}: ${err.response.statusText}`);
      } else {
        setError(err.message || 'Failed to fetch table data');
      }
      console.error('Error fetching table data:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch billed items for the table






  // Navigable columns: 0: Item Code, 1: Qty, 2: Item Name, 3: Rate, 4: Special Instructions
  const navigableColumns = [0, 1, 2, 3, 4];

  const handleArrowNavigation = (currentRow: number, currentCol: number, direction: 'up' | 'down' | 'left' | 'right') => {
    const totalRows = isGrouped ? displayedItems.length : billItems.length;
    let newRow = currentRow;
    let newCol = currentCol;

    if (direction === 'right') {
      newCol = (currentCol + 1) % navigableColumns.length;
      if (newCol === 0) newRow = (currentRow + 1) % totalRows;
    } else if (direction === 'left') {
      newCol = currentCol === 0 ? navigableColumns.length - 1 : currentCol - 1;
      if (currentCol === 0) newRow = currentRow === 0 ? totalRows - 1 : currentRow - 1;
    } else if (direction === 'down') {
      newRow = (currentRow + 1) % totalRows;
    } else if (direction === 'up') {
      newRow = currentRow === 0 ? totalRows - 1 : currentRow - 1;
    }

    const targetInput = inputRefs.current[newRow]?.[newCol];
    if (targetInput) {
      targetInput.focus();
      targetInput.select();
    }
  };

  // Mock data for item lookup
  // This is now replaced by the menuItems state fetched from the API

  const calculateTotals = (items: BillItem[]) => {
    const updatedItems = items.map(item => {
      const total = item.qty * item.rate;
      let cgst = 0;
      let sgst = 0;
      let igst = 0;
      let cess = 0;
      if (!includeTaxInInvoice) {
        cgst = total * (cgstRate / 100);
        sgst = total * (sgstRate / 100);
        igst = total * (igstRate / 100);
        cess = total * (cessRate / 100);
      }
      return { ...item, total, cgst, sgst, igst, cess };
    });

    const gross = updatedItems.reduce((sum, item) => sum + item.total, 0);
    const cgstTotal = updatedItems.reduce((sum, item) => sum + item.cgst, 0);
    const sgstTotal = updatedItems.reduce((sum, item) => sum + item.sgst, 0);
    const igstTotal = updatedItems.reduce((sum, item) => sum + item.igst, 0);
    const cessTotal = updatedItems.reduce((sum, item) => sum + item.cess, 0);

    const totalBeforeRoundOff = gross + cgstTotal + sgstTotal + igstTotal + cessTotal;
    const roundedFinalAmount = Math.round(totalBeforeRoundOff);
    const ro = roundedFinalAmount - totalBeforeRoundOff;

    setGrossAmount(gross);
    setTotalCgst(cgstTotal);
    setTotalSgst(sgstTotal);
    setTotalIgst(igstTotal);
    setTotalCess(cessTotal);
    setFinalAmount(roundedFinalAmount);
    setRoundOff(ro);
    setBillItems(updatedItems);
    setTaxCalc({ grandTotal: roundedFinalAmount, subtotal: gross });
  };

  // Fetch outlets
  useEffect(() => {
    const fetchOutlets = async () => {
      try {
        if (!user || !user.hotelid) {
          throw new Error('User not authenticated or hotel ID missing');
        }
        const response = await axios.get(`/api/outlets/by-hotel?hotelid=${user.hotelid}`);
        setOutlets(response.data.data || response.data);
      } catch (error) {
        console.error('Failed to fetch outlets:', error);
      }
    };
    fetchOutlets();
  }, [user]);

  // Fetch payment modes based on selected outlet
  useEffect(() => {
    const fetchPaymentModes = async () => {
      try {
        if (!selectedOutletId) return;
        const response = await axios.get(`/api/payment-modes/by-outlet?outletid=${selectedOutletId}`);
        setOutletPaymentModes(response.data.data || response.data);
      } catch (error) {
        console.error('Failed to fetch payment modes:', error);
      }
    };
    fetchPaymentModes();
  }, [selectedOutletId]);

  // Fetch global KOT number based on selected outlet
  useEffect(() => {
    const fetchGlobalKOT = async () => {
      try {
        if (!selectedOutletId) return;
        const response = await axios.get(`/api/TAxnTrnbill/global-kot-number?outletid=${selectedOutletId}`);
        const nextKOT = response.data.data.nextKOT;
        setDefaultKot(nextKOT);
        setEditableKot(nextKOT);
      } catch (error) {
        console.error('Failed to fetch global KOT number:', error);
      }
    };
    fetchGlobalKOT();
  }, [selectedOutletId]);

  // Fetch tax details based on selected outlet
  useEffect(() => {
    const fetchTaxDetails = async () => {
      if (!selectedOutletId) return;

      try {
        const response = await axios.get(`/api/tax-details?outletid=${selectedOutletId}`);
        setTaxDetails(response.data);
        setCgstRate(response.data.cgst_rate || 2.5);
        setSgstRate(response.data.sgst_rate || 2.5);
        setIgstRate(response.data.igst_rate || 0);
        setCessRate(response.data.cess_rate || 0);
        setIncludeTaxInInvoice(response.data.include_tax_in_invoice || false);
        console.log('Tax details:', response.data);
      } catch (error) {
        console.error('Error fetching tax details:', error);
      }
    };

    fetchTaxDetails();
  }, [selectedOutletId]);

  useEffect(() => {
    if (tableId) {
      loadBillForTable(tableId);
    }
  }, [tableId]);

  // Check for openSettlement flag and open settlement modal
  useEffect(() => {
    if (location.state?.openSettlement) {
      setShowSettlementModal(true);
    }
  }, [location.state]);

  useEffect(() => {
    // 1. Fetch menu items from the API when selectedOutletId is available
    const fetchMenuItems = async () => {
      try {
        if (!user || !user.hotelid || !selectedOutletId) {
          return; // Wait for outlet to be selected
        }
        const response = await axios.get(`/api/menu?outletid=${selectedOutletId}`);
        setMenuItems(response.data.data || response.data);
      } catch (error) {
        console.error('Failed to fetch menu items:', error);
      }
    };
    fetchMenuItems();

    calculateTotals(billItems);

    // Remove padding or margin from layout containers
    const mainContent = document.querySelector('main.main-content') as HTMLElement;
    const innerContent = document.querySelector('.inner-content.apps-content') as HTMLElement;

    if (mainContent) {
      mainContent.style.padding = '0';
      mainContent.style.margin = '0';
    }

    if (innerContent) {
      innerContent.style.padding = '0';
      innerContent.style.margin = '0';
    }

    // Calculate heights dynamically
    const calculateHeights = () => {
      const header = document.querySelector('.full-screen-header') as HTMLElement;
      const toolbar = document.querySelector('.full-screen-toolbar') as HTMLElement;
      if (header) {
        setHeaderHeight(header.offsetHeight);
      }
      if (toolbar) {
        setToolbarHeight(toolbar.offsetHeight);
      }
    };

    calculateHeights();

    // Recalculate on resize
    window.addEventListener('resize', calculateHeights);

    // Add event listener for Escape key
    const handleEscapeKey = (event: Event) => {
      const keyboardEvent = event as unknown as KeyboardEvent;

      if (keyboardEvent.key === 'Escape') {
        navigate('/apps/Tableview');
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      if (mainContent) {
        mainContent.style.padding = '';
        mainContent.style.margin = '';
        mainContent.style.width = '';
      }
      if (innerContent) {
        innerContent.style.padding = '';
        innerContent.style.margin = '';
        innerContent.style.width = '';
      }
      window.removeEventListener('resize', calculateHeights);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [navigate]); // eslint-disable-line react-hooks/exhaustive-deps



  // Focus on the blank row's item code input when the page opens or billItems change
  useEffect(() => {
    if (billItems.length > 0) {
      setTimeout(() => {
        const blankRowItemCodeInput = inputRefs.current[billItems.length - 1]?.[0];
        if (blankRowItemCodeInput) {
          blankRowItemCodeInput.focus();
        }
      }, 100);
    }
  }, [billItems]);

  const handleItemChange = (index: number, field: keyof BillItem, value: string | number) => {
    const item = displayedItems[index];
    if (!item.isEditable) return;
    let dataIndex = index;
    if (isGrouped) {
      dataIndex = billItems.length - 1;
    }
    const updated = [...billItems];
    const currentItem = { ...updated[dataIndex] };

    if (field === 'itemCode') {
      currentItem.itemCode = value as string;
      // 2. When item code is typed, find the item in the fetched menu list
      const found = menuItems.find(i => i.item_no.toString() === value);
      if (found) {
        currentItem.itemName = found.item_name;
        currentItem.rate = found.price;
        currentItem.itemId = found.restitemid;
      } else {
        currentItem.itemName = "";
        currentItem.rate = 0;
        currentItem.itemId = 0;
      }
    } else if (field === 'itemName') {
      currentItem.itemName = value as string;
      // Parse the value to extract item name if it includes code or short name
      const parsedValue = (value as string).includes(' (') ? (value as string).split(' (')[0] : value as string;
      // When item name is selected or typed, find the item by item_name or short_name (case-insensitive) and auto-fill itemCode and rate
      const found = menuItems.find(i =>
        i.item_name.toLowerCase() === parsedValue.toLowerCase() ||
        i.short_name?.toLowerCase() === parsedValue.toLowerCase()
      );
      if (found) {
        currentItem.itemCode = found.item_no.toString();
        currentItem.rate = found.price;
        currentItem.itemId = found.restitemid;
        currentItem.itemName = found.item_name; // Ensure we set the full item name
      } else {
        currentItem.itemCode = "";
        currentItem.rate = 0;
        currentItem.itemId = 0;
      }
    } else {
      (currentItem[field] as any) = value;
    }

    updated[dataIndex] = currentItem;
    calculateTotals(updated);
  };

  const handleKeyPress = (index: number, field: keyof BillItem) => (e: KeyboardEvent<any>) => {
    let dataIndex = index;
    if (isGrouped) {
      if (index === displayedItems.length - 1) {
        dataIndex = billItems.length - 1;
      }
    }

    if (e.key === "Enter") {
      if (field === 'itemCode') {
        // Only move focus to qty if itemCode has been typed
        if (billItems[dataIndex].itemCode.trim() !== '') {
          const qtyRef = inputRefs.current[index]?.[1];
          if (qtyRef) {
            qtyRef.focus();
            qtyRef.select();
          }
        }
        // If itemCode is empty, do nothing - stay in the field
      } else if (field === 'itemName') {
        // Focus and select qty field of the same row
        const qtyRef = inputRefs.current[index]?.[1];
        if (qtyRef) {
          qtyRef.focus();
          qtyRef.select();
        }
      } else if (field === 'qty') {
        // Only add new row if current item has data (itemId > 0 or itemName not empty)
        if (billItems[dataIndex].itemId > 0 || billItems[dataIndex].itemName.trim() !== '') {
          const newBillItems = [...billItems, { itemCode: "", itemgroupid: 0, itemId: 0, item_no: 0, itemName: "", qty: 1, rate: 0, total: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, mkotNo: '', specialInstructions: '', isFetched: false }];
          setBillItems(newBillItems);
          // Focus the new itemCode after state update
          setTimeout(() => {
            const focusIndex = isGrouped ? displayedItems.length : newBillItems.length - 1;
            const newItemCodeRef = inputRefs.current[focusIndex]?.[0];
            if (newItemCodeRef) {
              newItemCodeRef.focus();
            }
          }, 0);
        }
      }
      // No action for rate and specialInstructions
    } else if (e.key === 'Backspace' && field === 'itemName' && (e.target as HTMLInputElement).value.trim() === '' && index < (isGrouped ? displayedItems.length : billItems.length) - 1) {
      // Remove the row if backspace is pressed on empty itemName field and it's not the last row
      if (isGrouped) return;
      const updated = billItems.filter((_, i) => i !== index);
      setBillItems(updated);
      calculateTotals(updated);
      e.preventDefault();
    }
  };

  // Button handlers
  const saveKOT = async (isNoCharge: boolean = false, print: boolean = false, ncName?: string, ncPurpose?: string) => {
    console.log("🚀 saveKOT called");
    console.log("🖨️ Print enabled:", print);
    try {
      if (!user) {
        toast.error('User not authenticated. Cannot save KOT.');
        return;
      }

      // ✅ outletId MUST come from department context
      const outletId = selectedOutletId; // same variable used to load departments

      console.log("🏷️ OutletId (from department context):", outletId);

      if (!outletId) {
        console.error("❌ Outlet ID missing, cannot save KOT");
        toast.error("Outlet not resolved. Please reselect outlet.");
        return;
      }

      if (!tableId) {
        toast.error("Table not selected properly");
        return;
      }

      const validItems = billItems.filter(
        item =>
          item.itemId > 0 &&
          item.qty > 0 &&
          !item.mkotNo
      );
      if (validItems.length === 0) {
        if (print && editableKot) {
          await printKOT(editableKot);
          toast.success('KOT printed successfully');
        } else {
          toast('No new items to save');
        }
        return;
      }

      const payload = {
        outletid: outletId,
        tableId,
        table_name: tableName,
        userId: user.id,
        hotelId: user.hotelid,
        KOTNo: editableKot, // Use editableKot if set, else null for backend to generate
        Order_Type: 'Dine-in',
        ...(txnId ? { txnId } : {}),
        ...(isNoCharge ? { NCName: ncName, NCPurpose: ncPurpose } : {}),
        items: validItems.map(item => ({
          ItemID: item.itemId,
          Qty: item.qty,
          RuntimeRate: item.rate,
          CGST: 2.5,
          SGST: 2.5,
          IGST: 0,
          CESS: 0,
          Discount_Amount: 0,
          isNCKOT: isNoCharge,
          isbilled: print ? 1 : 0,
          DeptID: 1,
          SpecialInst: item.specialInstructions || null
        }))
      };

      console.log("📤 KOT Payload being sent:", payload);

      const response = await axios.post('/api/TAxnTrnbill/kot', payload);

      console.log("📥 RAW KOT API RESPONSE:", response);
      console.log("📥 response.data:", response?.data);
      console.log("📥 response.data.data:", response?.data?.data);

      const kotNo =
        response.data?.data?.KOTNo ??
        response.data?.data?.kotNo ??
        response.data?.KOTNo ??
        response.data?.kotNo ??
        null;

      console.log("🔢 Extracted KOT No:", kotNo);

      // Update txnId from the response
      if (response.data?.data?.TxnID) {
        setTxnId(response.data.data.TxnID);
      }

      toast.success('KOT saved successfully');

      // Set table status to occupied (green)
      try {
        await axios.put(`/api/tablemanagement/${tableId}/status`, { status: 1 });
      } catch (error) {
        console.error('Error updating table status:', error);
      }

      // If print is requested, print
      if (print) {
        console.log("🖨️ Print requested");
      }

      if (print && kotNo) {
        console.log("✅ Printing KOT with number:", kotNo);
        await printKOT(kotNo);
      } else if (print && !kotNo) {
        console.error("❌ Print blocked: KOT No not generated");
      }

      // Navigate to table view page after saving KOT
      navigate('/apps/Tableview');
    } catch (error) {
      console.error('Error saving KOT:', error);
      toast.error('Error saving KOT');
    }
  };

   const handleSaveNCKOT = async () => {
    if (!txnId) {
      toast.error('No active transaction found. Please save a KOT first.');
      return;
    }
    if (!ncName || !ncPurpose) {
      toast.error('NC Name and Purpose are required.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/TAxnTrnbill/${txnId}/apply-nckot`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ NCName: ncName, NCPurpose: ncPurpose }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success('NCKOT applied successfully to all items.');

        // ✅ 1️⃣ TABLE KO VACANT KARO (FRONTEND)
        await fetchTableManagement();

        // ✅ 2️⃣ UI CLEAR (already correct)
        setItems([]);
        setSelectedTable(null);
        setShowOrderDetails(false);
        setShowNCKOTModal(false);
         navigate('/apps/Tableview');
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

  const handleReverseKotSave = async (items: any[]) => {
  const filteredItems = items.filter(
    i => i.reversedQty > 0 || i.cancelQty > 0
  );

  if (filteredItems.length === 0) {
    alert('No items selected for reverse');
    return;
  }

  const payload = {
    revKotNo,
    tableNo,
    waiter,
    pax,
    date: billData,
    items: filteredItems.map(i => ({
      itemId: i.itemId,
      qty: i.reversedQty,
      cancelQty: i.cancelQty,
      rate: i.rate,
      amount: i.amount,
      reason: i.reason,
      mkotNo: i.mkotNo
    }))
  };


  

  await fetch(
    'http://localhost:3001/api/kot/save-reverse-kot',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }
  );

  setShowReverseKot(false);

  // ✅ refresh bill like order.tsx
  loadBillDetails();
};


  const reverseBill = async () => {
    if (!txnId) {
      alert('No bill to reverse');
      return;
    }

    try {
      await axios.post('/api/TAxnTrnbill/reverse', {
        TxnID: txnId,
        OutletID: user.outletid,
        HotelID: user.hotelid,
        UserID: user.id
      });

      toast.success('Bill reversed successfully');

      // ✅ reset UI state
      resetBillState();

      // ✅ go back to table view
      navigate('/apps/Tableview');
    } catch (error) {
      console.error('Reverse bill error:', error);
      toast.error('Failed to reverse bill');
    }
  };

  const reverseKOT = async () => {
    if (!txnId) return;
    try {
      await axios.post('/api/TAxnTrnbill/create-reverse-kot', {
        txnId,
        qty: reverseQty,
        reason: reverseReason
      });
      toast.success('KOT reversed successfully');
      setShowReverseKOTModal(false);
    } catch (error) {
      console.error('Error reversing KOT:', error);
      toast.error('Error reversing KOT');
    }
  };

  const printKOT = async (kotNo: number) => {
    try {
      const response = await axios.get(`/api/kot/print/${kotNo}`);
      toast.success('KOT printed successfully');
      // Handle print data if needed
      console.log('KOT Print Data:', response.data);
    } catch (error) {
      console.error('Error printing KOT:', error);
      toast.error('Error printing KOT');
    }
  };

  const printBill = async () => {
    if (!txnId) return;
    try {
      const response = await axios.put(`/api/TAxnTrnbill/${txnId}/print`);
      toast.success('Bill printed successfully');
      // Handle print data if needed
      console.log('Bill Print Data:', response.data);

      // Set table status to occupied (green)
      try {
        await axios.post(`/api/tablemanagement/${tableId}/status`, { status: 1 });
      } catch (error) {
        console.error('Error updating table status:', error);
      }

      navigate('/apps/Tableview');
    } catch (error) {
      console.error('Error printing bill:', error);
      toast.error('Error printing bill');
    }
  };

  const generateBill = async () => {
    if (!txnId) return;
    try {
      const response = await axios.post('/api/bill/generate', {
        txnId
      });
      setBillNo(response.data.data.BillNo);
      toast.success('Bill generated successfully');
      return response.data.data.BillNo;
    } catch (error) {
      console.error('Error generating bill:', error);
      toast.error('Error generating bill');
      throw error;
    }
  };

  const settleBill = async () => {

    try {
      // First generate the bill
      const billNo = await generateBill();
      if (!billNo) {
        toast.error('Bill generation failed. Cannot proceed with settlement.');
        return;
      }

      // Then settle the bill using the backend settleBill endpoint
      await axios.post(`/api/TAxnTrnbill/${txnId}/settle`, {
        settlements
      });
      toast.success('Bill settled successfully');
      navigate('/apps/Tableview');
    } catch (error) {
      console.error('Error settling bill:', error);
      toast.error('Error settling bill');
    }
  };

  const transferTable = async () => {
    if (!txnId || !selectedTable) return;
    try {
      await axios.post('/api/TAxnTrnbill/kot', {
        txnId,
        tableId: selectedTable.id,
        table_name: selectedTable.name,
        items: []
      });
      toast.success('Table transferred successfully');
      setShowTransferModal(false);
      navigate('/apps/Tableview');
    } catch (error) {
      console.error('Error transferring table:', error);
      toast.error('Error transferring table');
    }
  };
  const resetBillState = () => {
    setBillItems([{ itemCode: '', itemgroupid: 0, item_no: 0, itemId: 0, itemName: '', qty: 1, rate: 0, total: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, mkotNo: '', specialInstructions: '', isFetched: false }]);
    setTxnId(null);
    setWaiter('ASD');
    setPax(1);
    setKotNo('');
    setTableNo('Loading...');
    setDefaultKot(null);
    setEditableKot(null);
    setCustomerMobile('');
    setCustomerName('');
    calculateTotals([{ itemCode: '', itemgroupid: 0, item_no: 0, itemId: 0, itemName: '', qty: 1, rate: 0, total: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, mkotNo: '', specialInstructions: '' }]);
  };

  const fetchTableManagement = async () => {
    try {
      const response = await axios.get(`/api/tables/${tableId}`);
      setTableItems(response.data);
    } catch (error) {
      console.error('Error fetching table management:', error);
    }
  };

  const handleBackToTables = () => {
    navigate('/apps/Tableview');
  };

  const exitWithoutSave = () => {
    navigate('/apps/Tableview');
  };

  // Settlement modal handlers
  const handlePaymentModeClick = (mode: any) => {
    if (isMixedPayment) {
      // For mixed payment, toggle selection
      if (selectedPaymentModes.includes(mode.mode_name)) {
        setSelectedPaymentModes(selectedPaymentModes.filter(m => m !== mode.mode_name));
        const newAmounts = { ...paymentAmounts };
        delete newAmounts[mode.mode_name];
        setPaymentAmounts(newAmounts);
      } else {
        setSelectedPaymentModes([...selectedPaymentModes, mode.mode_name]);
        setPaymentAmounts({ ...paymentAmounts, [mode.mode_name]: '' });
      }
    } else {
      // For single payment, select only this mode and set amount to grand total
      setSelectedPaymentModes([mode.mode_name]);
      setPaymentAmounts({ [mode.mode_name]: taxCalc.grandTotal.toString() });
    }
  };

  const handlePaymentAmountChange = (modeName: string, value: string) => {
    setPaymentAmounts({ ...paymentAmounts, [modeName]: value });
  };

   const handleApplyDiscount = async () => {
      if (!txnId) {
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
        appliedDiscount = (grossAmount * discountInputValue) / 100;
      } else { // Amount
        if (discountInputValue <= 0 || discountInputValue > grossAmount || isNaN(discountInputValue)) {
          toast.error(`Discount amount must be > 0 and <= subtotal (${grossAmount.toFixed(2)})`);
          return;
        }
        appliedDiscPer = 0;
        appliedDiscount = discountInputValue;
      }

      setLoading(true);
      setDiscount(appliedDiscount); // Ensure the discount state is updated
      try {
        const payload = {
          discount: appliedDiscount,
          discPer: appliedDiscPer,
          discountType: DiscountType,
          tableId: tableId,
          items: billItems.filter(item => item.itemId > 0).map(item => ({ ...item, price: item.rate })), // Send current items to recalculate on backend
        };

        const response = await fetch(`http://localhost:3001/api/TAxnTrnbill/${txnId}/discount`, {
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
        // Instead of clearing the table, just refresh its data to show the discount.
        // If the table was billed, applying a discount should make it 'occupied' (green) again.
        const wasBilled = items.some(item => item.isBilled === 1);
        if (wasBilled && selectedTable) {
          const tableToUpdate = tableItems.find(t => t.table_name === selectedTable.name);
          if (tableToUpdate) {
            // Optimistically update UI to green
            setTableItems(prevTables =>
              prevTables.map(table =>
                table.table_name === selectedTable.name ? { ...table, status: 1 } : table
              )
            );
            // The backend now handles setting isBilled=0, so a refresh will show correct state.
            if (selectedTable?.id) {
              await loadBillForTable(selectedTable.id);
            }
          }
        }

        if (tableId) {
          await loadBillForTable(tableId);
        }

      } catch (error: any) {
        toast.error(error.message || 'An error occurred while applying the discount.');
      } finally {
        setLoading(false);
        setReason('');
      }
    };

  const handleSettleAndPrint = async () => {
    // Define these variables before using them
    const totalPaid = Object.values(paymentAmounts).reduce((acc, val) => acc + (parseFloat(val) || 0), 0) + (tip || 0);
    const settlementBalance = taxCalc.grandTotal - totalPaid;

    if (!txnId) {
      alert('Cannot settle bill. No transaction ID found.');
      return;
    }
    if (settlementBalance !== 0 || totalPaid === 0) { // Now this check will work
      alert('Payment amount does not match the total due.');
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
          OrderNo: orderNo,
          HotelID: user?.hotelid,
          Name: user?.name, // Cashier/User name
        };
      });

      // 2. Call the settlement endpoint
      const response = await axios.post(`/api/TAxnTrnbill/${txnId}/settle`, {
        settlements: settlementsPayload
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to settle bill.');
      }

      toast.success('Settlement successful and bill printed!');

      // Clear customer fields after successful settlement
      setCustomerMobile('');
      setCustomerName('');

      // Reset discount and round-off fields
      setDiscount(0);
      setDiscountInputValue(0);
      setRoundOffValue(0);

      // 3. Reset UI states for the next order
      setBillItems([]);
      setReversedItems([]);
      setSelectedTable(null);
      setShowOrderDetails(false);
      setPaymentAmounts({});
      setSelectedPaymentModes([]);
      setIsMixedPayment(false);
      setTip(0); // Reset tip amount
      setShowSettlementModal(false);
      setBillActionState('initial');

      if (selectedTable) {
        const tableToUpdate = tableItems.find(t => t.table_name === selectedTable.name);
        if (tableToUpdate) {
          await axios.post(`/api/tablemanagement/${tableToUpdate.tablemanagementid}/status`, {
            status: 0 // 0 for Vacant
          });
        }
      }
      fetchTableManagement(); // Refresh table statuses
      setCurrentKOTNo(null);
      setShowPendingOrdersView(false); // Hide pending view after successful settlement
      setCurrentKOTNos([]);
      setOrderNo(null);

      // Navigate to tableview page after settling the bill
      navigate('/apps/Tableview');

    } catch (error: any) {
      console.error('Error settling bill:', error);
      toast.error(error.message || 'An error occurred during settlement.');
    } finally {
      setLoading(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: Event) => {
      const keyboardEvent = event as unknown as KeyboardEvent;
      if (keyboardEvent.key === 'F2') {
        keyboardEvent.preventDefault();
        setTransferSource("kot");
        setShowKotTransferModal(true);
      } else if (keyboardEvent.key === 'F3') {
        keyboardEvent.preventDefault();
        setShowDiscountModal(true);
      } else if (keyboardEvent.key === 'F4') {
        keyboardEvent.preventDefault();
        // Focus on special instructions of the first item or current row
        const firstSpecialInstRef = inputRefs.current[0]?.[4];
        if (firstSpecialInstRef) {
          firstSpecialInstRef.focus();
          firstSpecialInstRef.select();
        }
      } else if (keyboardEvent.key === 'F5') {
        keyboardEvent.preventDefault();
        setShowReverseBillModal(true);
      } else if (keyboardEvent.key === 'F6') {
        keyboardEvent.preventDefault();
        resetBillState();
      } else if (keyboardEvent.key === 'F7') {
        keyboardEvent.preventDefault();
        setTransferSource("table");
        setShowKotTransferModal(true);
      } else if (keyboardEvent.key === 'F8') {
        keyboardEvent.preventDefault();
        setShowReverseKot(true);
      } else if (keyboardEvent.key === 'F9') {
        keyboardEvent.preventDefault();
         if (keyboardEvent.ctrlKey) {
          setShowNCKOTModal(true);
        } else {
          saveKOT(false, true);
        }
       
      } else if (keyboardEvent.key === 'F10') {
        keyboardEvent.preventDefault();
        printBill();
      } else if (keyboardEvent.key === 'F11') {
        keyboardEvent.preventDefault();
        setShowSettlementModal(true);
      } else if (keyboardEvent.key === 'g' && keyboardEvent.ctrlKey) {
        keyboardEvent.preventDefault();
        setIsGrouped(!isGrouped);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [txnId, reverseQty, reverseReason, selectedTable, saveKOT, isGrouped]);

  return (
    <React.Fragment>
      <div
        className="d-flex flex-column w-100"
        style={{
          height: '100vh',
          minHeight: '100vh',
          margin: 0,
          padding: 0,
          overflow: 'hidden',
          background: 'white',
        }}
      >
        <style>{`
        html, body, #root {
          height: 100vh;
          margin: 0;
          padding: 0;
          overflow: hidden;
          width: 100vw;
        }

        main.main-content, .inner-content.apps-content {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          background: white !important;
        }

        .container-fluid,
        .row,
        .col,
        .table,
        .card,
        .bill-header,
        .content-wrapper,
        .modern-bill {
          max-width: 100% !important;
          margin-right: 0 !important;
          padding-right: 0 !important;
          box-sizing: border-box;
        }

        body {
          overflow-x: hidden !important;
        }

        .full-screen-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1050;
          background: white;
          border-bottom: 1px solid #ced4da;
        }

        .full-screen-toolbar {
          position: fixed;
          left: 0;
          right: 0;
          z-index: 1049;
          background: white;
          border-bottom: 1px solid #ced4da;
          top: ${headerHeight}px;
          transition: top 0.1s ease;
        }

        .full-screen-content {
          position: fixed;
          left: 0;
          right: 0;
          bottom: 150px;
          overflow-y: auto;
          top: ${headerHeight + toolbarHeight}px;
          transition: top 0.1s ease;
        }

        .bottom-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 150px;
          background: white;
          border-top: 1px solid #ced4da;
          z-index: 1050;
          overflow-y: hidden;
          display: flex;
          flex-direction: column;
        }

        .bill-header { /* This class seems unused, but updating for consistency */
          background: white;
          border-bottom: 1px solid #ced4da;
          flex-shrink: 0;
        }

        .content-wrapper {
          height: 100%;
          overflow: hidden;
        }

        .modern-bill {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          padding: 0;
          margin: 0;
        }

        .modern-table {
          font-size: 1.1rem;
          margin-bottom: 0;
        }

        .modern-table th {
          font-weight: 600;
          position: sticky !important;
          top: 0 !important;
          z-index: 20 !important;
          background-color: #f8f9fa !important;
        }
        .modern-table.table-bordered {
          border: 1px solid #ced4da;
        }

        .modern-table thead tr.table-primary th {
          background-color: #f8f9fa !important;
          color: black !important;
        }

        .modern-table td, .modern-table th {
          padding: 0.25rem;
          vertical-align: middle;
        }
          form-control-sm1 {
          font-size: 1.1rem;
          font-weight: 600;
          fount-style: bold;
        }

        .modern-table.table-bordered td, .modern-table.table-bordered th {
          border: 1px solid #ced4da;
        }

        .modern-table input[type="text"]:focus {
          background: transparent !important;
          box-shadow: none !important;
        }

       .info-card {
  border: 1px solid #252526ff;
  border-radius: 0.5rem;
  transition: all 0.3s ease;

  /* 🔥 Unified card look */
 background:white ;
 color: #080808ff;
}

/* Modern minimal styling */
.info-box {
  background: #ffffff;
  border: 1px solid #e0e0e0 !important;
  border-radius: 6px;
  transition: all 0.2s ease;
}

/* Base styling for all info boxes */
.info-box {
  background: #ffffff;
  border: 1px solid #d1d5db !important;
  border-radius: 8px;
  transition: all 0.2s ease;
  min-height: 90px;
}

.info-box:hover {
  border-color: #6b7280 !important;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* KOT No. special styling */
.info-box .bg-light {
  background-color: #f9fafb !important;
  border: 1px solid #d1d5db !important;
}

/* Input fields styling */
.info-box input {
  border: none;
  outline: none;
  background: transparent;
  color: #333;
  font-weight: 600;
  letter-spacing: 0.5px;
}

.info-box input:focus {
  background: rgba(59, 130, 246, 0.05);
}

.info-box input[type="number"] {
  -moz-appearance: textfield;
}

.info-box input[type="number"]::-webkit-outer-spin-button,
.info-box input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Total Amount box */
.total-box {
  border: none !important;
  box-shadow: none !important;
  min-height: 90px;
}

.total-box .text-white-50 {
  opacity: 0.8;
  letter-spacing: 0.5px;
}

.total-box .text-white {
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* Text styling */
.text-uppercase {
  letter-spacing: 0.5px;
  font-size: 0.75rem;
}

.fw-bold.fs-4 {
  font-size: 1.75rem !important;
  line-height: 1.2;
}

.fw-bold.fs-5 {
  font-size: 1.25rem !important;
  line-height: 1.2;
}

.fw-bold.fs-3 {
  font-size: 1.875rem !important;
  line-height: 1.2;
}

/* Ensure all content is properly centered */
.d-flex.flex-column.justify-content-center {
  min-height: 100%;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .info-box, .total-box {
    margin-bottom: 10px;
    min-height: 80px;
  }
  
  .fw-bold.fs-4 {
    font-size: 1.5rem !important;
  }
  
  .fw-bold.fs-5 {
    font-size: 1.125rem !important;
  }
  
  .fw-bold.fs-3 {
    font-size: 1.5rem !important;
  }
}
/* Datalist arrow styling */
.info-card input::-webkit-calendar-picker-indicator {
  filter: invert(1);
  cursor: pointer;
  opacity: 0.8;
}

/* Autofill fix */
.info-card input:-webkit-autofill,
.info-card input:-webkit-autofill:hover, 
.info-card input:-webkit-autofill:focus, 
.info-card input:-webkit-autofill:active{
    -webkit-box-shadow: 0 0 0 30px linear-gradient(135deg, #2563eb 0%, #1e40af 100%); inset !important;
    -webkit-text-fill-color: white !important;
    transition: background-color 5000s ease-in-out 0s;
}

      

        .total-card {
          background: #28a745; /* Solid green background */
          border: none;
          color: white;
        }

        .footer-card {
          border: 1px solid #ced4da;
          background: #f8f9fa;
        }

       .function-btn {
  border-radius: 20px;              /* thoda zyada rounded, jaise screenshot */
  font-size: 0.99rem;               /* perfect size */
  padding: 6px 22px;                /* vertical thoda zyada, horizontal balanced */
  min-width: 95px;                  /* sab buttons almost same width */
  background: #e3f2fd;
  border: 1.6px solid #2196f3;      /* thodi bold border */
  color: #1976d2;
  font-weight: 800;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1); /* subtle shadow for depth */
}

.function-btn:hover {
  background: #bbdefb;
  transform: translateY(-1px);
}

        .bill-header h2 {
          font-weight: 700;
          letter-spacing: 1px;
        }

        .items-table {
          flex: 1;
          overflow-y: auto;
          height: 100%;
          
        }

        .summary-section .modern-table thead tr {
          background: #e3f2fd;
        }

        .summary-section .modern-table tbody tr {
          background: white;
          fount-size: 70px;
        }

        .summary-section .modern-table td {
          border-top: none;
          border-bottom: 1px solid #ced4da !important;
        }

        .summary-section .modern-table th {
          color: #1976d2;
          border-bottom: 1px solid #ced4da;
        }

        .bottom-content {
          padding: 0.5rem;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

   
        @media (max-width: 768px) {
          .modern-table {
            font-size: 0.8rem;
          }

          .modern-table td, .modern-table th {
            padding: 0.1rem;
          }
             .modern-table tr, .modern-table th {
            padding: 0.1rem;
            height: 10px;
          }
           
          .function-btn {
            font-size: 0.7rem;
            padding: 3px 8px;
            min-width: 70px;
          }

          .bottom-bar {
            height: 180px;
          }

          .full-screen-content {
            bottom: 180px;
          }
        }
      `}</style>

        {/* Header */}
        <div className="full-screen-header">
          <div className="container-fluid  px-2">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <h2 className="text-primary mb-0">BILL</h2>
              <span className="text-muted small">
                Group Item (Ctrl+G)(For Special Instructions - Press F4)
              </span>
            </div>

            {/* Card Layout for Header Information */}
            <Row className="mb-3 g-2 align-items-stretch">
              {/* Table No - Left aligned */}
              <Col md={1}>
                <div className="info-box p-2 h-100 border rounded text-center d-flex flex-column justify-content-center">
                  <div className="text-uppercase text-secondary small mb-1 fw-semibold">Table No</div>
                  <div className="fw-bold fs-4" style={{ color: '#333' }}>{tableNo || '--'}</div>
                </div>
              </Col>

              {/* Waiter - Centered */}
              <Col md={2}>
                <div className="info-box p-2 h-100 border rounded text-center d-flex flex-column justify-content-center">
                  <div className="text-uppercase text-secondary small mb-1 fw-semibold">Waiter</div>
                  <input
                    type="text"
                    value={waiter}
                    onChange={(e) => setWaiter(e.target.value)}
                    className="w-100 border-0 fw-bold fs-5 p-0 bg-transparent text-center"
                    placeholder="Name"
                    list="waiters"
                    style={{ color: '#333' }}
                  />
                </div>
              </Col>

              {/* PAX - Centered */}
              <Col md={1}>
                <div className="info-box p-2 h-100 border rounded text-center d-flex flex-column justify-content-center">
                  <div className="text-uppercase text-secondary small mb-1 fw-semibold">PAX</div>
                  <input
                    type="number"
                    value={pax}
                    onChange={(e) => setPax(Number(e.target.value))}
                    className="w-100 border-0 fw-bold fs-5 p-0 bg-transparent text-center"
                    style={{ color: '#343434ff' }}
                    placeholder="0"
                    min="1"
                  />
                </div>
              </Col>

              {/* KOT No - Editable input */}
              <Col md={2}>
                <div className="info-box p-2 h-100 border rounded text-center d-flex flex-column justify-content-center">
                  <div className="text-uppercase text-secondary small mb-1 fw-semibold">
                    KOT No.
                  </div>

                  <div
                    className="d-flex align-items-center justify-content-center border rounded bg-light mx-auto"
                    style={{ maxWidth: '140px' }}
                  >
                    {/* DEFAULT KOT (LEFT) */}
                    <div
                      className="fw-bold fs-5 px-2 py-1"
                      style={{
                        color: '#333',
                        borderRight: '1px solid #dee2e6',
                        minWidth: '100px'
                      }}
                    >
                      {defaultKot || '--'}
                    </div>

                    {/* EDITABLE KOT (RIGHT) */}
                    <input
                      type="number"
                      value={editableKot || ''}
                      onChange={(e) =>
                        setEditableKot(e.target.value ? Number(e.target.value) : null)
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const firstQtyRef = inputRefs.current[0]?.[1];
                          if (firstQtyRef) {
                            firstQtyRef.focus();
                            firstQtyRef.select();
                          }
                        }
                      }}
                      className="border-0 fw-bold text-center bg-transparent"
                      style={{ width: '100px', color: '#333' }}
                    />
                  </div>
                </div>
              </Col>


              {/* Date - Centered */}
              <Col md={2}>
                <div className="info-box p-2 h-100 border rounded text-center d-flex flex-column justify-content-center">
                  <div className="text-uppercase text-secondary small mb-1 fw-semibold">Date</div>
                  <div className="fw-bold fs-5" style={{ color: '#333' }}>
                    {new Date().toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric'
                    })}
                  </div>
                </div>
              </Col>



              {/* Total Amount - Centered with black background */}
              <Col md={2} className="ms-auto">
                <div className="p-2 h-100 d-flex flex-column justify-content-center text-center
                  bg-success rounded text-white">
                  <div className="text-uppercase text-white-50 small mb-1 fw-semibold">
                    Total Amount
                  </div>
                  <div className="fw-bold fs-3">
                    ₹{finalAmount.toFixed(2)}
                  </div>
                </div>
              </Col>

            </Row>
            {/* Datalist for Waiters */}
            <datalist id="waiters">
              <option value="ASD" />
              <option value="John" />
              <option value="Mary" />
              <option value="David" />
              <option value="Sarah" />
            </datalist>

            {/* Datalist for Item Names */}
            <datalist id="itemNames">
              {menuItems.map(item => (
                <option key={item.restitemid} value={item.short_name ? `${item.item_name} (${item.short_name})` : item.item_name} />
              ))}
            </datalist>

            {/* Datalist for Item Codes */}
            <datalist id="itemNos">
              {menuItems.map(item => (
                <option key={item.restitemid} value={item.item_no.toString()} />
              ))}
            </datalist>
          </div>
        </div>



        {/* Main Content */}
        <div className="full-screen-content px-2" style={{ top: `${headerHeight + toolbarHeight}px` }}>
          <div className="content-wrapper">
            <div className="modern-bill">
              {loading ? (
                <div className="d-flex justify-content-center align-items-center h-100">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : error ? (
                <div className="alert alert-danger m-3">
                  <strong>Error:</strong> {error}
                </div>
              ) : (
                <div className="items-table">
                  <Table responsive bordered className="modern-table">
                    <thead>
                      <tr className="table-primary">
                        <th style={{ width: '80px' }}> Code</th>
                        <th style={{ width: '400px' }}>Item Name</th >
                        <th className="text-center" style={{ width: '100px' }}>Qty</th>
                        <th className="text-end" style={{ width: '100px' }}>Rate</th>
                        <th className="text-end" style={{ width: '150px' }}>Total</th>
                        <th className="text-center">MkotNo/Time</th>
                        <th>Special Instructions</th>
                      </tr>
                    </thead >
                    <tbody>
                      {displayedItems.map((item, index) => (
                        <tr key={index}>
                          <td style={{ width: '80px' }}>
                            <Form.Control
                              ref={(el) => {
                                if (!inputRefs.current[index]) inputRefs.current[index] = [];
                                inputRefs.current[index][0] = el;
                              }}
                              type="text"
                              value={item.itemCode}
                                  readOnly={isGrouped && index !== displayedItems.length - 1}
                              onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)}
                              onKeyDown={(e) => {
                                handleKeyPress(index, 'itemCode')(e);
                                if (e.key.startsWith('Arrow')) {
                                  handleArrowNavigation(index, 0, e.key.slice(5).toLowerCase() as 'up' | 'down' | 'left' | 'right');
                                  e.preventDefault();
                                }
                              }}
                              className="form-control"
                              style={{ width: '100%', border: 'none', fontSize: '16px', background: 'transparent', padding: '0', outline: 'none' }}
                            />
                          </td>
                          <td style={{ width: '400px' }}>
                            <Form.Control
                              ref={(el) => {
                                if (!inputRefs.current[index]) inputRefs.current[index] = [];
                                inputRefs.current[index][2] = el;
                              }}
                              type="text"
                              value={item.itemName}
                              onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                              onKeyDown={(e) => {
                                handleKeyPress(index, 'itemName')(e);
                                if (e.key.startsWith('Arrow')) {
                                  handleArrowNavigation(index, 2, e.key.slice(5).toLowerCase() as 'up' | 'down' | 'left' | 'right');
                                  e.preventDefault();
                                }
                              }}
                              className="form-control-sm1"
                              list="itemNames"
                              style={{ width: '100%', border: 'none', fontSize: '16px', background: 'transparent', padding: '0', outline: 'none' }}
                            />
                          </td>
                          <td className="text-center" style={{ width: '100px' }}>
                            <Form.Control
                              ref={(el) => {
                                if (!inputRefs.current[index]) inputRefs.current[index] = [];
                                inputRefs.current[index][1] = el;
                              }}
                              type="number"
                              value={item.qty}
                              onChange={(e) => handleItemChange(index, 'qty', Number(e.target.value))}
                              onKeyDown={(e) => {
                                handleKeyPress(index, 'qty')(e);
                                if (e.key.startsWith('Arrow')) {
                                  handleArrowNavigation(index, 1, e.key.slice(5).toLowerCase() as 'up' | 'down' | 'left' | 'right');
                                  e.preventDefault();
                                }
                              }}
                              className="form-control-sm1 text-center"
                              style={{ width: '100%', border: 'none', background: 'transparent', fontSize: '16px', padding: '0', outline: 'none' }}
                            />
                          </td>
                          <td className="text-end" style={{ width: '100px' }}>
                            <Form.Control
                              type="number"
                              value={item.rate}
                              onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                              onKeyDown={(e) => {
                                handleKeyPress(index, 'rate')(e);
                                if (e.key.startsWith('Arrow')) {
                                  handleArrowNavigation(index, 3, e.key.slice(5).toLowerCase() as 'up' | 'down' | 'left' | 'right');
                                  e.preventDefault();
                                }
                              }}
                              className="form-control-sm1 text-end"
                              style={{ width: '100%', fontSize: '16px', border: 'none', background: 'transparent', padding: '0', outline: 'none' }}
                            />
                          </td>
                          <td className="text-end" style={{ width: '100px' }}>{item.total.toFixed(2)}</td>
                          <td className="text-center">
                            {item.mkotNo && (
                              <div className="d-flex justify-content-center gap-1 flex-wrap">
                                {item.mkotNo.split('|').map((kot: string, index: number) => (
                                  <Badge bg="secondary" key={index}>
                                    {kot}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </td>

                          <td>
                            <Form.Control
                              type="text"
                              value={item.specialInstructions}
                              onChange={(e) => handleItemChange(index, 'specialInstructions', e.target.value)}
                              onKeyDown={(e) => {
                                handleKeyPress(index, 'specialInstructions')(e);
                                if (e.key.startsWith('Arrow')) {
                                  handleArrowNavigation(index, 4, e.key.slice(5).toLowerCase() as 'up' | 'down' | 'left' | 'right');
                                  e.preventDefault();
                                }
                              }}
                              className="form-control-sm1"
                              
                              style={{ width: '100%', fontSize: '18px', border: 'none', background: 'transparent', padding: '0', outline: 'none' }}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Bar for Summary and Footer */}
          <div className="bottom-bar">
            <div className="bottom-content">
              {/* Summary Section */}
              <div className="summary-section mb-1">
                <Table responsive bordered className="modern-table">
                  <thead>
                    <tr>
                      <th>Discount (F3)</th>
                      <th className="text-end">Gross Amt</th>
                      <th className="text-end">Rev KOT(+)</th>
                      <th className="text-center">Disc(+)</th>
                      <th className="text-end">CGST (+)</th>
                      <th className="text-end">SGST (+)</th>
                      <th className="text-end">IGST (+)</th>
                      <th className="text-end">CESS (+)</th>
                      <th className="text-end">R. Off (+)</th>
                      <th className="text-center">Ser Chg (+)</th>
                      <th className="text-end">Final Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{discount.toFixed(2)}</td>
                      <td className="text-end">{grossAmount.toFixed(2)}</td>
                      <td className="text-end">0.00</td>
                      <td className="text-center">0.00</td>
                      <td className="text-end">{totalCgst.toFixed(2)}</td>
                      <td className="text-end">{totalSgst.toFixed(2)}</td>
                      <td className="text-end">{totalIgst.toFixed(2)}</td>
                      <td className="text-end">{totalCess.toFixed(2)}</td>
                      <td className="text-end">{roundOff.toFixed(2)}</td>
                      <td className="text-center">0</td>
                      <td className="text-end fw-bold text-success">{finalAmount.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </Table>
              </div>

              {/* Footer with Function Keys */}
              <Card className="footer-card">
                <Card.Body className="py-1">
                  <div className="d-flex justify-content-between align-items-center px-2 py-1">
                    <Button onClick={() => { setTransferSource("kot"); setShowKotTransferModal(true); }} variant="outline-primary" size="sm" className="function-btn">KOT Tr (F2)</Button>
                    <Button onClick={() => setShowNCKOTModal(true)} variant="outline-primary" size="sm" className="function-btn">N C KOT (ctrl + F9)</Button>
                    {/* <Button onClick={() => setShowCustomerModal(true)} variant="outline-primary" size="sm" className="function-btn">Customer (F1)</Button> */}
                    <Button onClick={() => setShowReverseBillModal(true)} variant="outline-primary" size="sm" className="function-btn">Rev Bill (F5)</Button>
                    <Button onClick={() => { setTransferSource("table"); setShowKotTransferModal(true); }} variant="outline-primary" size="sm" className="function-btn">TBL Tr (F7)</Button>
                    <Button onClick={resetBillState} variant="outline-primary" size="sm" className="function-btn">New Bill (F6)</Button>
                    <Button onClick={() => setShowReverseKot(true)} variant="outline-primary" size="sm" className="function-btn">Rev KOT (F8)</Button>
                    <Button onClick={() => saveKOT(false, true)} variant="outline-primary" size="sm" className="function-btn">K O T (F9)</Button>
                    <Button onClick={printBill} variant="outline-primary" size="sm" className="function-btn">Print (F10)</Button>
                    <Button onClick={() => setShowSettlementModal(true)} variant="outline-primary" size="sm" className="function-btn">Settle (F11)</Button>
                    <Button onClick={exitWithoutSave} variant="outline-primary" size="sm" className="function-btn">Exit (Esc)</Button>
                  </div>
                </Card.Body>
              </Card>
            </div>
          </div>
        </div>


      </div>

      {/* NC KOT Modal */}
      <Modal show={showNCKOTModal} onHide={() => setShowNCKOTModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>No Charge KOT</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>NC Name</Form.Label>
            <Form.Control
              type="text"
              value={ncName}
              onChange={(e) => setNcName(e.target.value)}
              placeholder="Enter NC Name"
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>NC Purpose</Form.Label>
            <Form.Control
              type="text"
              value={ncPurpose}
              onChange={(e) => setNcPurpose(e.target.value)}
              placeholder="Enter NC Purpose"
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNCKOTModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveNCKOT}>
            Save NC KOT
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

      {/* Settle Modal */}
      <Modal
        show={showSettlementModal}
        onHide={() => setShowSettlementModal(false)}
        centered
        onShow={() => {
          // When the modal is shown, check if it's for single payment
          if (!isMixedPayment) {
            // Find the 'Cash' payment mode
            const cashMode = outletPaymentModes.find(
              (mode) => mode.mode_name.toLowerCase() === 'cash'
            );
            if (cashMode) {
              // Automatically select 'Cash' and set the amount
              handlePaymentModeClick(cashMode);
            }
          }
        }}
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
            <div className="fw-bold display-5 text-dark" id="settlement-grand-total">
              ₹{taxCalc.grandTotal.toFixed(2)}
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

          {/* Tip Input */}
          <div className="mb-3 p-3 bg-white rounded shadow-sm">
            <Form.Label className="fw-semibold text-dark mb-2">Optional Tip</Form.Label>
            <Form.Control
              type="number"
              placeholder="0.00"
              value={tip || ""}
              onChange={(e) => setTip(parseFloat(e.target.value) || 0)}
              className="text-center"
              step="0.01"
            />
          </div>

          {/* Payment Summary */}
          <div className="mt-4 p-3 bg-white rounded shadow-sm">
            <div className="d-flex justify-content-around fw-bold fs-5">
              <div>
                <span>Total Paid: </span>
                <span className="text-primary" id="settlement-total-paid">{(Object.values(paymentAmounts).reduce((acc, val) => acc + (parseFloat(val) || 0), 0) + (tip || 0)).toFixed(2)}</span>
              </div>
              <div>
                <span>Balance Due: </span>
                <span
                  className={
                    (taxCalc.grandTotal - (Object.values(paymentAmounts).reduce((acc, val) => acc + (parseFloat(val) || 0), 0) + (tip || 0))) === 0 ? "text-success" : "text-danger"
                  }
                >
                  {(taxCalc.grandTotal - (Object.values(paymentAmounts).reduce((acc, val) => acc + (parseFloat(val) || 0), 0) + (tip || 0))).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Validation Messages */}
            {(taxCalc.grandTotal - (Object.values(paymentAmounts).reduce((acc, val) => acc + (parseFloat(val) || 0), 0) + (tip || 0))) !== 0 && (
              <div className="text-danger mt-2 text-center small">
                Total paid amount + tip must match the grand total.
              </div>
            )}
            {(taxCalc.grandTotal - (Object.values(paymentAmounts).reduce((acc, val) => acc + (parseFloat(val) || 0), 0) + (tip || 0))) === 0 && (Object.values(paymentAmounts).reduce((acc, val) => acc + (parseFloat(val) || 0), 0) + (tip || 0)) > 0 && (
              <div className="text-success mt-2 text-center small">
                ✅ Payment amount + tip matches. Ready to settle.
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
            disabled={(taxCalc.grandTotal - (Object.values(paymentAmounts).reduce((acc, val) => acc + (parseFloat(val) || 0), 0) + (tip || 0))) !== 0 || (Object.values(paymentAmounts).reduce((acc, val) => acc + (parseFloat(val) || 0), 0) + (tip || 0)) === 0}
            className="px-4"
          >
            Settle & Print
          </Button>
        </Modal.Footer>
      </Modal>

      {/* KOT Transfer Modal */}
      <Modal show={showKotTransferModal} onHide={() => setShowKotTransferModal(false)} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>KOT Transfer</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <KotTransfer transferSource={transferSource} sourceTableId={tableId} onCancel={() => setShowKotTransferModal(false)} />
        </Modal.Body>
      </Modal>

      {/* Reverse Bill Modal */}
      <Modal show={showReverseBillModal} onHide={() => setShowReverseBillModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Reverse Bill</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to reverse this bill? This action cannot be undone.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowReverseBillModal(false)}>
            Cancel
          </Button>
          
          
           <Button variant="danger" onClick={() => {
            const hasBilledItems = billItems.some(item => item.isBilled === 1);

            if (hasBilledItems) {
              setShowReverseBillModal(false);
              setShowF9BilledPasswordModal(true);
            } else {
              toast.error("F9 (Bill Reversal) is only available for billed orders.");
            }
          }}>
            Confirm Reverse Bill
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Customer Modal */}
      <Modal show={showCustomerModal} onHide={handleCloseCustomerModal} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>Customer Management</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: '0px', maxHeight: '780px', overflowY: 'auto' }}>
          <CustomerModal />
        </Modal.Body>
      </Modal>
<F8PasswordModal
        show={showF9BilledPasswordModal}
        onHide={() => {
          setShowF9BilledPasswordModal(false);
          setF9BilledPasswordError('');
        }}
        onSubmit={handleF9PasswordSubmit}
        error={f9BilledPasswordError}
        loading={f9BilledPasswordLoading}
        title="Admin Password for Reversal"
      />

      <ReverseKotModal
        show={showReverseKot}
        revKotNo={revKotNo}
        kotItems={billItems}
        tableNo={tableNo}
        waiter={waiter}
        pax={pax}
        date={new Date().toLocaleDateString('en-GB')}
        onClose={() => setShowReverseKot(false)}
        onSave={handleReverseKotSave}
      />
      
      <Toaster />
    </React.Fragment>
  );
};

export default ModernBill;
