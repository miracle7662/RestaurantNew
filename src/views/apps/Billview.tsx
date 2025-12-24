import React, { useEffect, useState, useRef, KeyboardEvent } from 'react';
import { Row, Col, Card, Table, Badge, Button, Form, Modal, Alert } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/common';

interface BillItem {
  itemNo: string;
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
}

const ModernBill = () => {
  const [headerHeight, setHeaderHeight] = useState(0);
  const [toolbarHeight, setToolbarHeight] = useState(0);

  const [billItems, setBillItems] = useState<BillItem[]>([{ itemNo: '', itemName: '', qty: 1, rate: 0, total: 0, cgst: 0, sgst: 0, igst: 0, mkotNo: '', specialInstructions: '' }]);

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
  const { user } = useAuthContext();

  console.log('Table ID:', tableId);
  console.log('Table Name:', tableName);

  const [waiter, setWaiter] = useState('ASD');
  const [pax, setPax] = useState(1);
  const [kotNo, setKotNo] = useState('26');
  const [tableNo, setTableNo] = useState(tableName || 'Loading...');
  const [defaultKot, setDefaultKot] = useState(34); // last / system KOT
  const [editableKot, setEditableKot] = useState(34); // user editable
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txnId, setTxnId] = useState<number | null>(null);

  // Modal states
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [showReverseBillModal, setShowReverseBillModal] = useState(false);
  const [showReverseKOTModal, setShowReverseKOTModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  // Settle modal data
  const [settlements, setSettlements] = useState([{ PaymentTypeID: 1, PaymentType: 'Cash', Amount: 0, OrderNo: 0, HotelID: user?.hotelid || 1, Name: 'Cash' }]);

  // Reverse Bill modal data
  const [reversePassword, setReversePassword] = useState('');

  // Reverse KOT modal data
  const [reverseQty, setReverseQty] = useState(1);
  const [reverseReason, setReverseReason] = useState('');

  // Transfer modal data
  const [availableTables, setAvailableTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);


  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);

  // Mock data for item lookup
  // This is now replaced by the menuItems state fetched from the API

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
  useEffect(() => {
    const fetchTableData = async () => {
      if (!tableId || !user || !user.hotelid) return;

      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`/api/TAxnTrnbill/unbilled-items/${tableId}`);
        if (response.status !== 200) {
          throw new Error(`Server responded with status ${response.status}`);
        }
        const data = response.data?.data || response.data;
        if (!data) {
          throw new Error('No data received from server');
        }

        // Map items to BillItem interface
        const mappedItems: BillItem[] = data.items.map((item: any) => ({
          itemNo: item.itemId.toString(),
          itemName: item.itemName,
          qty: item.netQty,
          rate: item.price,
          total: item.netQty * item.price,
          cgst: (item.netQty * item.price) * 0.025,
          sgst: (item.netQty * item.price) * 0.025,
          igst: 0,
          mkotNo: item.kotNo.toString(),
          specialInstructions: ''
        }));

        // If no items, keep empty row
        if (mappedItems.length === 0) {
          mappedItems.push({ itemNo: '', itemName: '', qty: 1, rate: 0, total: 0, cgst: 0, sgst: 0, igst: 0, mkotNo: '', specialInstructions: '' });
        }

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
        setKotNo(data.kotNo || '26');
        setDefaultKot(data.kotNo || 34);
        setEditableKot(data.kotNo || 34);

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
    };

    fetchTableData();
  }, [tableId, user]);

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
  };

  const handleItemChange = (index: number, field: keyof BillItem, value: string | number) => {
    const updated = [...billItems];
    const currentItem = { ...updated[index] };

    if (field === 'itemNo') {
      currentItem.itemNo = value as string;
      // 2. When item code is typed, find the item in the fetched menu list
      const found = menuItems.find(i => i.item_no.toString() === value);
      if (found) {
        currentItem.itemName = found.item_name;
        currentItem.rate = found.price;
      } else {
        currentItem.itemName = "";
        currentItem.rate = 0;
      }
    } else if (field === 'itemName') {
      // Parse the value to extract item name if it includes code
      const parsedValue = (value as string).includes(' (') ? (value as string).split(' (')[0] : value as string;
      // When item name is selected or typed, find the item by short_name and auto-fill itemNo and rate (case-insensitive)
      const found = menuItems.find(i => i.short_name.toLowerCase() === parsedValue.toLowerCase());
      if (found) {
        currentItem.itemName = found.item_name; // Always show the full item name
        currentItem.itemNo = found.item_no.toString();
        currentItem.rate = found.price;
      } else {
        currentItem.itemName = parsedValue; // Keep what was typed if no match
        currentItem.itemNo = "";
        currentItem.rate = 0;
      }
    } else {
      (currentItem[field] as any) = value;
    }

    updated[index] = currentItem;
    calculateTotals(updated);
  };

  const handleKeyPress = (index: number, field: keyof BillItem) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (field === 'itemNo') {
        // Focus itemName field of the same row
        const itemNameRef = inputRefs.current[index]?.[2];
        if (itemNameRef) {
          itemNameRef.focus();
        }
      } else if (field === 'itemName') {
        // Focus and select qty field of the same row
        const qtyRef = inputRefs.current[index]?.[1];
        if (qtyRef) {
          qtyRef.focus();
          qtyRef.select();
        }
      } else if (field === 'qty') {
        // Add new row and focus itemNo of the new row
        const newBillItems = [...billItems, { itemNo: "", itemName: "", qty: 1, rate: 0, total: 0, cgst: 0, sgst: 0, igst: 0, mkotNo: '', specialInstructions: '' }];
        setBillItems(newBillItems);
        // Focus the new itemNo after state update
        setTimeout(() => {
          const newItemNoRef = inputRefs.current[newBillItems.length - 1]?.[0];
          if (newItemNoRef) {
            newItemNoRef.focus();
          }
        }, 0);
      }
      // No action for rate and specialInstructions
    }
  };

  // Button handlers
  const saveKOT = async (isNoCharge: boolean = false, print: boolean = false) => {
    try {
      const validItems = billItems.filter(item => item.itemNo && item.itemName && item.qty > 0);
      if (validItems.length === 0) {
        alert('No valid items to save');
        return;
      }

      const payload = {
        outletid: user.outletid || user.hotelid, // Assuming outletid is available or same as hotelid
        tableId: tableId,
        table_name: tableName,
        userId: user.id,
        hotelId: user.hotelid,
        NCName: isNoCharge ? 'NC' : null,
        NCPurpose: isNoCharge ? 'No Charge' : null,
        DiscPer: 0,
        Discount: 0,
        DiscountType: 0,
        CustomerName: '',
        MobileNo: '',
        Order_Type: 'Dine-in',
        txnId: txnId || undefined, // For existing bills
        items: validItems.map(item => ({
          ItemID: parseInt(item.itemNo),
          Qty: item.qty,
          RuntimeRate: item.rate,
          CGST: item.total > 0 ? (item.cgst / item.total) * 100 : 0,
          SGST: item.total > 0 ? (item.sgst / item.total) * 100 : 0,
          IGST: 0,
          CESS: 0,
          Discount_Amount: 0,
          isNCKOT: isNoCharge,
          DeptID: 1, // Default department ID
          SpecialInst: item.specialInstructions || null
        }))
      };

      const response = await axios.post('/api/TAxnTrnbill/kot', payload);
      alert('KOT saved successfully');

      // If print is requested, call print after save
      if (print) {
        await printBill();
      }
    } catch (error) {
      console.error('Error saving KOT:', error);
      alert('Error saving KOT');
    }
  };

  const reverseBill = async () => {
    if (!txnId) return;
    try {
      await axios.post(`/api/TAxnTrnbill/${txnId}/reverse`);
      alert('Bill reversed successfully');
      navigate('/apps/Tableview');
    } catch (error) {
      console.error('Error reversing bill:', error);
      alert('Error reversing bill');
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

  const printBill = async () => {
    if (!txnId) return;
    try {
      await axios.put(`/api/TAxnTrnbill/${txnId}/print`);
      alert('Bill printed successfully');
    } catch (error) {
      console.error('Error printing bill:', error);
      alert('Error printing bill');
    }
  };

  const settleBill = async () => {
    if (!txnId) return;
    try {
      await axios.post(`/api/TAxnTrnbill/${txnId}/settle`, {
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
    setBillItems([{ itemNo: '', itemName: '', qty: 1, rate: 0, total: 0, cgst: 0, sgst: 0, igst: 0, mkotNo: '', specialInstructions: '' }]);
    setTxnId(null);
    setWaiter('ASD');
    setPax(1);
    setKotNo('26');
    setTableNo('Loading...');
    setDefaultKot(34);
    setEditableKot(34);
    calculateTotals([{ itemNo: '', itemName: '', qty: 1, rate: 0, total: 0, cgst: 0, sgst: 0, igst: 0, mkotNo: '', specialInstructions: '' }]);
  };

  const exitWithoutSave = () => {
    navigate('/apps/Tableview');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      if (keyboardEvent.key === 'F2') {
        keyboardEvent.preventDefault();
        saveKOT(false, false);
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
        setShowSettleModal(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [txnId, reverseQty, reverseReason, settlements, selectedTable]);

  return (
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
          overflow-y: auto;
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

       .info-card {
  border: 1px solid #252526ff;
  border-radius: 0.5rem;
  transition: all 0.3s ease;

  /* 🔥 Unified card look */
 background: ;
 color: #080808ff;
}

.info-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

/* Label text */
.info-card .text-muted {
  color: rgba(17, 17, 17, 0.8) !important;
  font-weight: 700;
}

/* Value text */
.info-card .fw-bold {
  color: #111010ff !important;
}

/* Inputs */
.info-card .form-control {
  background: transparent;
  border: none;
  color: #ffffff;
  font-weight: 700;
}

.info-card .form-control:focus {
  box-shadow: none;
  background: transparent;
  color: #ffffff;
}

/* Placeholder */
.info-card .form-control::placeholder {
  color: rgba(255,255,255,0.6);
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
          <Row className="g-2 mb-2">
            <Col md={1}>
              <Card className="text-center info-card h-100 border-0 shadow-sm">
                <Card.Body className="d-flex flex-column justify-content-center py-2 px-2">
                  <div className="text-muted text-uppercase fw-bold small mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Table No</div>
                  <div className="fw-bold text-dark fs-5 text-truncate" title={tableNo}>{tableNo}</div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={2}>
              <Card className="text-center info-card h-100 border-0 shadow-sm">
                <Card.Body className="d-flex flex-column justify-content-center py-2 px-2">
                  <div className="text-muted text-uppercase fw-bold small mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Waiter</div>
                  <Form.Control
                    type="text"
                    value={waiter}
                    onChange={(e) => setWaiter(e.target.value)}
                    className="form-control-sm text-center fw-bold fs-5 p-0 bg-transparent shadow-none text-white"
                    list="waiters"
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col md={1}>
              <Card className="text-center info-card h-100 border-0 shadow-sm">
                <Card.Body className="d-flex flex-column justify-content-center py-2 px-2">
                  <div className="text-muted text-uppercase fw-bold small mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>PAX</div>
                  <Form.Control
                    type="number"
                    value={pax}
                    onChange={(e) => setPax(Number(e.target.value))}
                    className="form-control-sm text-center fw-bold fs-5 p-0 bg-transparent shadow-none"
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col md={2}>
              <Card className="info-card h-100 border-0 shadow-sm" >
                <Card.Body className="d-flex flex-column justify-content-center py-2 px-2 text-center">
                  <div className="text-muted text-uppercase fw-bold small mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>KOT No.</div>
                  <div className="d-flex align-items-center justify-content-center mx-auto" style={{ height: '34px', maxWidth: '160px' }}>
                    <div className="px-3 border-end fw-bold text-white-50 h-100 d-flex align-items-center" style={{ borderColor: 'rgba(255,255,255,0.3)' }}>
                      {defaultKot}
                    </div>
                    <Form.Control
                      type="text"
                      value={editableKot.toString()}
                      onChange={(e) => setEditableKot(Number(e.target.value))}
                      className="text-center fw-bold text-white border-0 shadow-none h-100 m-0 bg-transparent"
                      style={{ width: '80px' }}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={2}>
              <Card className="text-center info-card h-100 border-0 shadow-sm">
                <Card.Body className="d-flex flex-column justify-content-center py-2 px-2">
                  <div className="text-muted text-uppercase fw-bold small mb-1" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Date</div>
                  <div className="fw-bold text-dark fs-5">
                    {new Date().toLocaleDateString()}
                  </div>

                </Card.Body>
              </Card>
            </Col>
            <Col md={2} className="ms-auto">
              <Card className="text-center total-card h-100 border-0 shadow-sm">
                <Card.Body className="d-flex flex-column justify-content-center py-2 px-3">
                  <div className="text-white-50 text-uppercase fw-bold small mb-0" style={{ fontSize: '0.7rem', letterSpacing: '0.5px' }}>Total Amount</div>
                  <div className="fw-bold text-white fs-4">
                    ₹{finalAmount.toFixed(2)}
                  </div>
                </Card.Body>
              </Card>
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
              <option key={item.restitemid} value={item.item_name} />
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
      <div className="full-screen-content" style={{ top: `${headerHeight + toolbarHeight}px` }}>
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
                      <th style={{ width: '80px' }}>No</th>
                      <th style={{ width: '400px' }}>Item Name</th>
                      <th className="text-center">Qty</th>
                      <th className="text-end" style={{ width: '200px' }}>Rate</th>
                      <th className="text-end">Total</th>
                      <th className="text-center">MkotNo/Time</th>
                      <th>Special Instructions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {billItems.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <Form.Control
                            ref={(el) => {
                              if (!inputRefs.current[index]) inputRefs.current[index] = [];
                              inputRefs.current[index][0] = el;
                            }}
                            type="text"
                            value={item.itemNo}
                            onChange={(e) => handleItemChange(index, 'itemNo', e.target.value)}
                            onKeyDown={handleKeyPress(index, 'itemNo')}
                            className="form-control-sm"
                            style={{ width: '100%', border: 'none', background: 'transparent', padding: '0', outline: 'none' }}
                          />
                        </td>
                        <td>
                          <Form.Control
                            ref={(el) => {
                              if (!inputRefs.current[index]) inputRefs.current[index] = [];
                              inputRefs.current[index][2] = el;
                            }}
                            type="text"
                            value={item.itemName}
                            onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                            onKeyDown={handleKeyPress(index, 'itemName')}
                            className="form-control-sm"
                            list="itemNames"
                            style={{ width: '100%', border: 'none', background: 'transparent', padding: '0', outline: 'none' }}
                          />
                        </td>
                        <td className="text-center">
                          <Form.Control
                            ref={(el) => {
                              if (!inputRefs.current[index]) inputRefs.current[index] = [];
                              inputRefs.current[index][1] = el;
                            }}
                            type="number"
                            value={item.qty}
                            onChange={(e) => handleItemChange(index, 'qty', Number(e.target.value))}
                            onKeyDown={handleKeyPress(index, 'qty')}
                            className="form-control-sm text-center"
                            style={{ width: '100%', border: 'none', background: 'transparent', padding: '0', outline: 'none' }}
                          />
                        </td>
                        <td className="text-end">
                          <Form.Control
                            type="number"
                            value={item.rate}
                            onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                            onKeyDown={handleKeyPress(index, 'rate')}
                            className="form-control-sm text-end"
                            style={{ width: '100%', border: 'none', background: 'transparent', padding: '0', outline: 'none' }}
                          />
                        </td>
                        <td className="text-end">{item.total.toFixed(2)}</td>
                        <td className="text-center">
                          {item.mkotNo && <Badge bg="secondary">{item.mkotNo}</Badge>}
                        </td>
                        <td>
                          <Form.Control
                            type="text"
                            value={item.specialInstructions}
                            onChange={(e) => handleItemChange(index, 'specialInstructions', e.target.value)}
                            onKeyDown={handleKeyPress(index, 'specialInstructions')}
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
                  <Button onClick={() => saveKOT(false, false)} variant="outline-primary" size="sm" className="function-btn">KOT Tr (F2)</Button>
                  <Button onClick={() => saveKOT(true, false)} variant="outline-primary" size="sm" className="function-btn">N C KOT (ctrl + F9)</Button>
                  <Button onClick={() => setShowReverseBillModal(true)} variant="outline-primary" size="sm" className="function-btn">Rev Bill (F5)</Button>
                  <Button onClick={() => setShowTransferModal(true)} variant="outline-primary" size="sm" className="function-btn">TBL Tr (F7)</Button>
                  <Button onClick={resetBillState} variant="outline-primary" size="sm" className="function-btn">New Bill (F6)</Button>
                  <Button onClick={() => setShowReverseKOTModal(true)} variant="outline-primary" size="sm" className="function-btn">Rev KOT (F8)</Button>
                  <Button onClick={() => saveKOT(false, true)} variant="outline-primary" size="sm" className="function-btn">K O T (F9)</Button>
                  <Button onClick={printBill} variant="outline-primary" size="sm" className="function-btn">Print (F10)</Button>
                  <Button onClick={() => setShowSettleModal(true)} variant="outline-primary" size="sm" className="function-btn">Settle (F11)</Button>
                  <Button onClick={exitWithoutSave} variant="outline-primary" size="sm" className="function-btn">Exit (Esc)</Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>


    </div>
  );
};

export default ModernBill;