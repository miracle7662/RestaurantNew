import { useEffect, useState, useRef, KeyboardEvent } from 'react';
import { Row, Col, Card, Table, Badge, Button, Form } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

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

  console.log('Table ID:', tableId);

  const [waiter, setWaiter] = useState('ASD');
  const [pax, setPax] = useState(1);
  const [kotNo, setKotNo] = useState('26');
  const [tableNo, setTableNo] = useState(tableId || '1');
  const [defaultKot, setDefaultKot] = useState(34); // last / system KOT
  const [editableKot, setEditableKot] = useState(34); // user editable


  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);

  // Mock data for item lookup
  // This is now replaced by the menuItems state fetched from the API

  useEffect(() => {
    // 1. Fetch menu items from the API when the component mounts
    const fetchMenuItems = async () => {
      try {
        const response = await axios.get('/api/menu'); // Assuming your API endpoint is /api/menu
        setMenuItems(response.data);
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
      // When item name is selected or typed, find the item and auto-fill itemNo and rate (case-insensitive)
      const found = menuItems.find(i => i.item_name.toLowerCase() === parsedValue.toLowerCase() || i.short_name.toLowerCase() === parsedValue.toLowerCase());
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
          border: 1px solid  #dbdbe7ff;
          border-radius: 0.5rem;
          transition: all 0.3s ease;
          background: #e3f2fd; /* Soft light background */
        }

        .info-card:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transform: translateY(-2px);
        }

        .info-card .form-control {
          background-color: #e3f2fd ;
          border: none;
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
          <Row className="g-1 mb-1">
            <Col md={1}>
              <Card className=" text-center info-card">
                <Card.Body className="py-2 px-2 text-center">
                  <Card.Title className="text-muted mb-0 fw-bold" style={{ fontSize: '0.75rem' }}>Table No</Card.Title>
                  <Card.Text className="fw-bold mb-0 fs-5 text-dark">{tableNo}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={2}>
              <Card className=" text-center info-card">
                <Card.Body className="py-2 px-2 text-center">
                  <Card.Title className="text-muted mb-0 fw-bold" style={{ fontSize: '0.75rem' }}>Waiter</Card.Title>
                  <Form.Control
                    type="text"
                    value={waiter}
                    onChange={(e) => setWaiter(e.target.value)}
                    className="form-control-xs text-center fw-bold "
                    list="waiters"
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col md={1}>
              <Card className=" text-center info-card">
                <Card.Body className="py-2 px-2 text-center">
                  <Card.Title className="text-muted mb-0 fw-bold" style={{ fontSize: '0.75rem' }}>PAX</Card.Title>
                  <Form.Control
                    type="number"
                    value={pax}
                    onChange={(e) => setPax(Number(e.target.value))}
                    className="form-control-xs text-center fw-bold"
                  />
                </Card.Body>
              </Card>
            </Col>
            <Col md={2}>
              <Card className=" info-card">
                <Card.Body className="py-2 px-2 text-center">

                  <div className="small fw-bold text-muted mb-1">KOT No.</div>

                  <div className="d-flex border rounded bg-light overflow-hidden" style={{ height: 30 }}>

                    {/* LEFT – Default (50%, NOT editable) */}
                    <div className="w-50 d-flex align-items-center justify-content-center fw-bold text-dark border-end">
                      {defaultKot}
                    </div>

                    {/* RIGHT – Editable (50%) */}
                    <Form.Control
                      type="text"
                      value={editableKot.toString()}
                      onChange={(e) => setEditableKot(Number(e.target.value))}
                      className="w-50 text-center fw-bold text-primary border-0 rounded-0 bg-transparent shadow-none"
                    />

                  </div>

                </Card.Body>
              </Card>

            </Col>
            <Col md={2} className="ms-auto">
  <Card className=" text-center total-card">
    <Card.Body className="py-1">
      <Card.Title className="py-2 px-2 text-center">
        Total
      </Card.Title>
      <Card.Text className="fw-bold text-white mb-0 fs-5">
        ₹{finalAmount.toFixed(2)}
      </Card.Text>
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
              <>
                <option key={`${item.restitemid}-full`} value={`${item.item_name} (${item.item_no})`} />
                <option key={`${item.restitemid}-short`} value={`${item.short_name} (${item.item_no})`} />
              </>
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
            {/* Items Table */}
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

                        />
                      </td>
                      <td>
                        <Form.Control
                          type="text"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(index, 'itemName', e.target.value)}
                          onKeyDown={handleKeyPress(index, 'itemName')}
                          className="form-control-sm"
                          list="itemNames"
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
                          style={{ width: '60px', margin: 'auto' }}
                        />
                      </td>
                      <td className="text-end">
                        <Form.Control
                          type="number"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', Number(e.target.value))}
                          onKeyDown={handleKeyPress(index, 'rate')}
                          className="form-control-sm text-end"
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
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>
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
                <Button variant="outline-primary" size="sm" className="function-btn">KOT Tr (F2)</Button>
                <Button variant="outline-primary" size="sm" className="function-btn">N C KOT (ctrl + F9)</Button>
                <Button variant="outline-primary" size="sm" className="function-btn">Rev Bill (F5)</Button>
                <Button variant="outline-primary" size="sm" className="function-btn">TBL Tr (F7)</Button>
                <Button variant="outline-primary" size="sm" className="function-btn">New Bill (F6)</Button>
                <Button variant="outline-primary" size="sm" className="function-btn">Rev KOT (F8)</Button>
                <Button variant="outline-primary" size="sm" className="function-btn">K O T (F9)</Button>
                <Button variant="outline-primary" size="sm" className="function-btn">Print (F10)</Button>
                <Button variant="outline-primary" size="sm" className="function-btn">Settle (F11)</Button>
                <Button variant="outline-primary" size="sm" className="function-btn">Exit (Esc)</Button>
              </div>
            </Card.Body>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ModernBill;