import React, { useEffect, useState, useRef, KeyboardEvent, useCallback } from 'react';
import { Row, Col, Card, Table, Badge, Button, Form, Modal, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/common';
import KotTransfer from './Transaction/KotTransfer';
import CustomerModal from './Transaction/Customers';

interface BillItem {
  itemCode: string;
  itemId: number;
  itemName: string;
  qty: number;
  rate: number;
  total: number;
  cgst: number;
  sgst: number;
  igst: number;
  mkotNo: string;
  specialInstructions: string;
}

interface MenuItem {
  restitemid: number;
  item_no: string;
  item_name: string;
  short_name: string;
  price: number;
}

interface Table {
  id: number;
  name: string;
  outletid: number;
}

interface Outlet {
  id: number;
  name: string;
}

const ModernBill = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [toolbarHeight, setToolbarHeight] = useState(0);

  const [billItems, setBillItems] = useState<BillItem[]>([{ itemCode: '', itemId: 0, itemName: '', qty: 1, rate: 0, total: 0, cgst: 0, sgst: 0, igst: 0, mkotNo: '', specialInstructions: '' }]);

  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  const [grossAmount, setGrossAmount] = useState(0);
  const [totalCgst, setTotalCgst] = useState(0);
  const [totalSgst, setTotalSgst] = useState(0);
  const [roundOff, setRoundOff] = useState(0);
  const [finalAmount, setFinalAmount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();
  const tableId = location.state?.tableId;
  const tableName = location.state?.tableName;
  const outletIdFromState = location.state?.outletId;
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

  // Modal states
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [showReverseBillModal, setShowReverseBillModal] = useState(false);
  const [showReverseKOTModal, setShowReverseKOTModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showNCKOTModal, setShowNCKOTModal] = useState(false);
  const [showKotTransferModal, setShowKotTransferModal] = useState(false);
  const [ncName, setNcName] = useState('');
  const [ncPurpose, setNcPurpose] = useState('');

  // Settlement modal states
  const [isMixedPayment, setIsMixedPayment] = useState(false);
  const [selectedPaymentModes, setSelectedPaymentModes] = useState<string[]>([]);
  const [paymentAmounts, setPaymentAmounts] = useState<{ [key: string]: string }>({});
  const [tip, setTip] = useState<number>(0);
  const [outletPaymentModes, setOutletPaymentModes] = useState<any[]>([]);
  const [taxCalc, setTaxCalc] = useState({ grandTotal: 0 });
  const [settlements, setSettlements] = useState([{ PaymentType: 'Cash', Amount: finalAmount }]);

  // Reverse Bill modal data
  const [reversePassword, setReversePassword] = useState('');

  // Reverse KOT modal data
  const [reverseQty, setReverseQty] = useState(1);
  const [reverseReason, setReverseReason] = useState('');

  // Transfer modal data
  const [availableTables, setAvailableTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const [customerMobile, setCustomerMobile] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Outlet selection states
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState<number | null>(outletIdFromState || user?.outletid || null);

  // Search functionality states

  // Handle customer modal
  const handleCloseCustomerModal = () => setShowCustomerModal(false);

  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);
  const kotInputRef = useRef<HTMLInputElement | null>(null);

  // Navigable columns: 0: Item Code, 1: Qty, 2: Item Name, 3: Rate, 4: Special Instructions
  const navigableColumns = [0, 1, 2, 3, 4];

  const handleArrowNavigation = (currentRow: number, currentCol: number, direction: 'up' | 'down' | 'left' | 'right') => {
    let newRow = currentRow;
    let newCol = currentCol;

    if (direction === 'right') {
      newCol = (currentCol + 1) % navigableColumns.length;
      if (newCol === 0) newRow = (currentRow + 1) % billItems.length;
    } else if (direction === 'left') {
      newCol = currentCol === 0 ? navigableColumns.length - 1 : currentCol - 1;
      if (currentCol === 0) newRow = currentRow === 0 ? billItems.length - 1 : currentRow - 1;
    } else if (direction === 'down') {
      newRow = (currentRow + 1) % billItems.length;
    } else if (direction === 'up') {
      newRow = currentRow === 0 ? billItems.length - 1 : currentRow - 1;
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
      const cgst = total * 0.025; // 2.5% CGST
      const sgst = total * 0.025; // 2.5% SGST
      return { ...item, total, cgst, sgst, igst: 0 };
    });

    const gross = updatedItems.reduce((sum, item) => sum + item.total, 0);
    const cgstTotal = updatedItems.reduce((sum, item) => sum + item.cgst, 0);
    const sgstTotal = updatedItems.reduce((sum, item) => sum + item.sgst, 0);

    const totalBeforeRoundOff = gross + cgstTotal + sgstTotal;
    const roundedFinalAmount = Math.round(totalBeforeRoundOff);
    const ro = roundedFinalAmount - totalBeforeRoundOff;

    setGrossAmount(gross);
    setTotalCgst(cgstTotal);
    setTotalSgst(sgstTotal);
  setFinalAmount(roundedFinalAmount);
  setRoundOff(ro);
  setBillItems(updatedItems);
  setTaxCalc({ grandTotal: roundedFinalAmount });
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

  useEffect(() => {
    // 1. Fetch menu items from the API when the component mounts
    const fetchMenuItems = async () => {
      try {
        if (!user || !user.hotelid) {
          throw new Error('User not authenticated or hotel ID missing');
        }
        const response = await axios.get('/api/menu'); // Assuming your API endpoint is /api/menu
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

  // Fetch table data when tableId is present
  const fetchTableData = useCallback(async () => {
      if (!tableId || !user || !user.hotelid) return;

      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/TAxnTrnbill/billed-bill/by-table/${tableId}`);
        if (!response || response.status !== 200) {
          throw new Error(`Server responded with status ${response?.status || 'unknown'}`);
        }
        const data = response.data?.data || response.data;
        if (!data) {
          throw new Error('No data received from server');
        }

        // Ensure details is always an array
        const details = Array.isArray(data.details) ? data.details : [];

        // Map items to BillItem interface
        const mappedItems: BillItem[] = details.map((item: any) => {
          return {
            itemCode: (item.itemId || item.ItemID || '').toString(),
            itemId: item.itemId || item.ItemID || 0,
            itemName: item.itemName || item.ItemName || item.item_name || '',
            qty: item.netQty || item.Qty || 0,
            rate: item.price || item.Price || item.Rate || 0,
            total: (item.netQty || item.Qty || 0) * (item.price || item.Price || item.Rate || 0),
            cgst: ((item.netQty || item.Qty || 0) * (item.price || item.Price || item.Rate || 0)) * 0.025,
            sgst: ((item.netQty || item.Qty || 0) * (item.price || item.Price || item.Rate || 0)) * 0.025,
            igst: 0,
            mkotNo: item.kotNo ? item.kotNo.toString() : (item.KOTNo ? item.KOTNo.toString() : ''),
            specialInstructions: item.specialInstructions || item.SpecialInst || ''
          };
        });

        // Always add a blank row at the end for new item entry
        mappedItems.push({ itemCode: '', itemId: 0, itemName: '', qty: 1, rate: 0, total: 0, cgst: 0, sgst: 0, igst: 0, mkotNo: '', specialInstructions: '' });

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
        }
        if (data.kotNo !== null && data.kotNo !== undefined) {
          setKotNo(String(data.kotNo));
           setDefaultKot(Number(data.kotNo)); // Removed to prevent showing 1
          setEditableKot(Number(data.kotNo)); // Removed to allow manual typing
        }

        // Calculate totals
        calculateTotals(mappedItems);
      } catch (err: any) {
        setBillItems([]);
        if (err.response) {
          setError(`Server responded with status ${err.response.status}: ${err.response.statusText}`);
        } else {
          setError(err.message || 'Failed to fetch table data');
        }
        console.error('Error fetching table data:', err);
      } finally {
        setLoading(false);
      }
    }, [tableId, user]);

  useEffect(() => {
    fetchTableData();
  }, [fetchTableData]);

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
    const updated = [...billItems];
    const currentItem = { ...updated[index] };

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

    updated[index] = currentItem;
    calculateTotals(updated);
  };

  const handleKeyPress = (index: number, field: keyof BillItem) => (e: KeyboardEvent<any>) => {
    if (e.key === "Enter") {
      if (field === 'itemCode') {
        // Only move focus to qty if itemCode has been typed
        if (billItems[index].itemCode.trim() !== '') {
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
        if (billItems[index].itemId > 0 || billItems[index].itemName.trim() !== '') {
          const newBillItems = [...billItems, { itemCode: "", itemId: 0, itemName: "", qty: 1, rate: 0, total: 0, cgst: 0, sgst: 0, igst: 0, mkotNo: '', specialInstructions: '' }];
          setBillItems(newBillItems);
          // Focus the new itemCode after state update
          setTimeout(() => {
            const newItemCodeRef = inputRefs.current[newBillItems.length - 1]?.[0];
            if (newItemCodeRef) {
              newItemCodeRef.focus();
            }
          }, 0);
        }
      }
      // No action for rate and specialInstructions
    } else if (e.key === 'Backspace' && field === 'itemName' && (e.target as HTMLInputElement).value.trim() === '' && index < billItems.length - 1) {
      // Remove the row if backspace is pressed on empty itemName field and it's not the last row
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
        alert('User not authenticated. Cannot save KOT.');
        return;
      }

      // ✅ outletId MUST come from department context
      const outletId = selectedOutletId; // same variable used to load departments

      console.log("🏷️ OutletId (from department context):", outletId);

      if (!outletId) {
        console.error("❌ Outlet ID missing, cannot save KOT");
        alert("Outlet not resolved. Please reselect outlet.");
        return;
      }

      if (!tableId) {
        alert("Table not selected properly");
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
          alert('KOT printed successfully');
        } else {
          alert('No new items to save');
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

      alert('KOT saved successfully');

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
      alert('Error saving KOT');
    }
  };

  const handleSaveNCKOT = () => {
    saveKOT(true, false, ncName, ncPurpose);
    setShowNCKOTModal(false);
    setNcName('');
    setNcPurpose('');
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

      alert('Bill reversed successfully');

      // ✅ reset UI state
      resetBillState();

      // ✅ go back to table view
      navigate('/apps/Tableview');
    } catch (error) {
      console.error('Reverse bill error:', error);
      alert('Failed to reverse bill');
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
      alert('KOT reversed successfully');
      setShowReverseKOTModal(false);
    } catch (error) {
      console.error('Error reversing KOT:', error);
      alert('Error reversing KOT');
    }
  };

  const printKOT = async (kotNo: number) => {
    try {
      const response = await axios.get(`/api/kot/print/${kotNo}`);
      alert('KOT printed successfully');
      // Handle print data if needed
      console.log('KOT Print Data:', response.data);
    } catch (error) {
      console.error('Error printing KOT:', error);
      alert('Error printing KOT');
    }
  };

  const printBill = async () => {
    if (!txnId) return;
    try {
      const response = await axios.put(`/api/TAxnTrnbill/${txnId}/print`);
      alert('Bill printed successfully');
      // Handle print data if needed
      console.log('Bill Print Data:', response.data);
    } catch (error) {
      console.error('Error printing bill:', error);
      alert('Error printing bill');
    }
  };

  const generateBill = async () => {
    if (!txnId) return;
    try {
      const response = await axios.post('/api/bill/generate', {
        txnId
      });
      setBillNo(response.data.data.BillNo);
      alert('Bill generated successfully');
      return response.data.data.BillNo;
    } catch (error) {
      console.error('Error generating bill:', error);
      alert('Error generating bill');
      throw error;
    }
  };

  const settleBill = async () => {
    if (!txnId) return;
    try {
      // First generate the bill
      const billNo = await generateBill();

      // Then settle the bill
      await axios.post('/api/bill/settle', {
        billNo,
        settlements
      });
      alert('Bill settled successfully');
      navigate('/apps/Tableview');
    } catch (error) {
      console.error('Error settling bill:', error);
      alert('Error settling bill');
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
      alert('Table transferred successfully');
      setShowTransferModal(false);
      navigate('/apps/Tableview');
    } catch (error) {
      console.error('Error transferring table:', error);
      alert('Error transferring table');
    }
  };
  const resetBillState = () => {
    setBillItems([{ itemCode: '', itemId: 0, itemName: '', qty: 1, rate: 0, total: 0, cgst: 0, sgst: 0, igst: 0, mkotNo: '', specialInstructions: '' }]);
    setTxnId(null);
    setWaiter('ASD');
    setPax(1);
    setKotNo('');
    setTableNo('Loading...');
    setDefaultKot(null);
    setEditableKot(null);
    setCustomerMobile('');
    setCustomerName('');
    calculateTotals([{ itemCode: '', itemId: 0, itemName: '', qty: 1, rate: 0, total: 0, cgst: 0, sgst: 0, igst: 0, mkotNo: '', specialInstructions: '' }]);
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

  const handleSettleAndPrint = async () => {
    // Prepare settlements data
    const settlementsData = selectedPaymentModes.map(mode => ({
      PaymentType: mode,
      Amount: parseFloat(paymentAmounts[mode] || '0')
    }));

    // Include tip if any
    if (tip > 0) {
      settlementsData.push({
        PaymentType: 'Tip',
        Amount: tip
      });
    }

    setSettlements(settlementsData);

    // Call the existing settleBill function
    await settleBill();
    setShowSettlementModal(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: Event) => {
      const keyboardEvent = event as unknown as KeyboardEvent;
      if (keyboardEvent.key === 'F2') {
        keyboardEvent.preventDefault();
        setShowKotTransferModal(true);
      } else if (keyboardEvent.key === 'F5') {
        keyboardEvent.preventDefault();
        setShowReverseBillModal(true);
      } else if (keyboardEvent.key === 'F6') {
        keyboardEvent.preventDefault();
        resetBillState();
      } else if (keyboardEvent.key === 'F7') {
        keyboardEvent.preventDefault();
        setShowTransferModal(true);
      } else if (keyboardEvent.key === 'F8') {
        keyboardEvent.preventDefault();
        setShowReverseKOTModal(true);
      } else if (keyboardEvent.key === 'F9') {
        if (keyboardEvent.ctrlKey) {
          keyboardEvent.preventDefault();
          saveKOT(true, false);
        } else {
          keyboardEvent.preventDefault();
          saveKOT(false, true);
        }
      } else if (keyboardEvent.key === 'F10') {
        keyboardEvent.preventDefault();
        printBill();
      } else if (keyboardEvent.key === 'F11') {
        keyboardEvent.preventDefault();
        setShowSettlementModal(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [txnId, reverseQty, reverseReason, selectedTable]);

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
          font-size: 0.9rem;
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
          padding: 0.5rem;
          vertical-align: middle;          
        }

        .modern-table.table-bordered td, .modern-table.table-bordered th {
          border: 1px solid #ced4da;
        }

        .modern-table input[type="text"]:focus {
          background: transparent !important;
          box-shadow: none !important;

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
            padding: 0.4rem;
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
  
  {/* KOT No - Split display like image */}
  <Col md={2}>
    <div className="info-box p-2 h-100 border rounded text-center d-flex flex-column justify-content-center">
      <div className="text-uppercase text-secondary small mb-1 fw-semibold">KOT No.</div>
      <div className="d-flex align-items-center justify-content-center border rounded bg-light mx-auto" style={{ maxWidth: '140px' }}>
        <div className="fw-bold fs-5 px-2 py-1" style={{ color: '#333', borderRight: '1px solid #dee2e6', minWidth: '60px' }}>
          {defaultKot || '--'}
        </div>
        <input
          type="text"
          value={editableKot || ''}
          onChange={(e) => setEditableKot(e.target.value ? Number(e.target.value) : null)}
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
          style={{ width: '60px', color: '#333' }}
          placeholder=""
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
                      <th style={{ width: '80px' }}>Item Code</th>
                      <th style={{ width: '400px' }}>Item Name</th >
                      <th className="text-center" style={{ width: '100px' }}>Qty</th>
                      <th className="text-end" style={{ width: '100px' }}>Rate</th>
                      <th className="text-end" style={{ width: '150px' }}>Total</th>
                      <th className="text-center">MkotNo/Time</th>
                      <th>Special Instructions</th>
                    </tr>
                  </thead >
                  <tbody>
                    {billItems.map((item, index) => (
                      <tr key={index}>
                        <td style={{ width: '80px' }}>
                          <Form.Control
                            ref={(el) => {
                              if (!inputRefs.current[index]) inputRefs.current[index] = [];
                              inputRefs.current[index][0] = el;
                            }}
                            type="text"
                            value={item.itemCode}
                            onChange={(e) => handleItemChange(index, 'itemCode', e.target.value)}
                            onKeyDown={(e) => {
                              handleKeyPress(index, 'itemCode')(e);
                              if (e.key.startsWith('Arrow')) {
                                handleArrowNavigation(index, 0, e.key.slice(5).toLowerCase() as 'up' | 'down' | 'left' | 'right');
                                e.preventDefault();
                              }
                            }}
                            className="form-control-sm"
                            style={{ width: '100%', border: 'none', background: 'transparent', padding: '0', outline: 'none' }}
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
                            className="form-control-sm"
                            list="itemNames"
                            style={{ width: '100%', border: 'none', background: 'transparent', padding: '0', outline: 'none' }}
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
                            className="form-control-sm text-center"
                            style={{ width: '100%', border: 'none', background: 'transparent', padding: '0', outline: 'none' }}
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
                            className="form-control-sm text-end"
                            style={{ width: '100%', border: 'none', background: 'transparent', padding: '0', outline: 'none' }}
                          />
                        </td>
                        <td className="text-end" style={{ width: '100px' }}>{item.total.toFixed(2)}</td>
                        <td className="text-center">
                          {item.mkotNo && <Badge bg="secondary">{item.mkotNo}</Badge>}
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
                            className="form-control-sm"
                            style={{ width: '100%', border: 'none', background: 'transparent', padding: '0', outline: 'none' }}
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
                    <th>Discount (#3)</th>
                    <th className="text-end">Gross Amt</th>
                    <th className="text-end">Rev KOT(+)</th>
                    <th className="text-center">Disc(+)</th>
                    <th className="text-end">CGST (+)</th>
                    <th className="text-end">SGST (+)</th>
                    <th className="text-end">R. Off (+)</th>
                    <th className="text-center">Ser Chg (+)</th>
                    <th className="text-end">Final Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>0.00</td>
                    <td className="text-end">{grossAmount.toFixed(2)}</td>
                    <td className="text-end">0.00</td>
                    <td className="text-center">0.00</td>
                    <td className="text-end">{totalCgst.toFixed(2)}</td>
                    <td className="text-end">{totalSgst.toFixed(2)}</td>
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
                  <Button onClick={() => setShowKotTransferModal(true)} variant="outline-primary" size="sm" className="function-btn">KOT Tr (F2)</Button>
                  <Button onClick={() => setShowNCKOTModal(true)} variant="outline-primary" size="sm" className="function-btn">N C KOT (ctrl + F9)</Button>
                  <Button onClick={() => setShowReverseBillModal(true)} variant="outline-primary" size="sm" className="function-btn">Rev Bill (F5)</Button>
                  <Button onClick={() => setShowKotTransferModal(true)} variant="outline-primary" size="sm" className="function-btn">TBL Tr (F7)</Button>
                  <Button onClick={resetBillState} variant="outline-primary" size="sm" className="function-btn">New Bill (F6)</Button>
                  <Button onClick={() => setShowReverseKOTModal(true)} variant="outline-primary" size="sm" className="function-btn">Rev KOT (F8)</Button>
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
        <KotTransfer onCancel={() => setShowKotTransferModal(false)} />
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
        <Button variant="danger" onClick={reverseBill}>
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

    </React.Fragment>
  );
};

export default ModernBill;
