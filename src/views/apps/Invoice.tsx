import { useState, useEffect, useRef } from 'react';
import { Button, Modal, Table } from 'react-bootstrap';

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
  const { user } = useAuthContext();
  const [selectedTable, setSelectedTable] = useState<string | null>('');
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState<string>('Dine-in');
  const [showOrderDetails, setShowOrderDetails] = useState<boolean>(false);
  const [searchTable, setSearchTable] = useState<string>('');
  const [isTableInvalid, setIsTableInvalid] = useState<boolean>(false);
  const itemListRef = useRef<HTMLDivElement>(null);
  const [tableItems, setTableItems] = useState<TableItem[]>([]);
  const [filteredTables, setFilteredTables] = useState<TableItem[]>([]);
  const [savedKOTs, setSavedKOTs] = useState<any[]>([]);
  const [showSavedKOTsModal, setShowSavedKOTsModal] = useState<boolean>(false);
  const [outlets, setOutlets] = useState<OutletData[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [taxRates, setTaxRates] = useState({ cgst: 0, sgst: 0, igst: 0, cess: 0 });
  const [taxCalc, setTaxCalc] = useState({ subtotal: 0, cgstAmt: 0, sgstAmt: 0, igstAmt: 0, cessAmt: 0, grandTotal: 0 });
  const [selectedDeptId, setSelectedDeptId] = useState<number | null>(null);
  const [selectedOutletId, setSelectedOutletId] = useState<number | null>(null);
  const [DiscPer, setDiscPer] = useState<number>(0);
  const [givenBy, setGivenBy] = useState<string>(user?.name || '');
  const [DiscountType, setDiscountType] = useState<number>(0);

  // Floating Button Group State
  const [showOptions, setShowOptions] = useState(false);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [taxValues, setTaxValues] = useState({ cgst: 0, sgst: 0, igst: 0 });
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [ncData, setNcData] = useState({ name: '', purpose: '' });

  // Fetch Data Functions (Simplified for brevity)
  const fetchTableManagement = async () => { /* ... */ };
  const fetchCustomerByMobile = async (mobile: string) => { /* ... */ };
  const fetchDepartments = async () => { /* ... */ };
  const fetchOutletsData = async () => { /* ... */ };

  useEffect(() => {
    const fetchInitialData = async () => {
      await fetchOutletsData();
      await fetchDepartments();
      fetchTableManagement();
    };
    fetchInitialData();
  }, [user?.id, user?.hotelid, user?.outletid, user?.role_level]);

  useEffect(() => {
    if (mobileNumber.length >= 10) fetchCustomerByMobile(mobileNumber);
    else setCustomerName('');
  }, [mobileNumber]);

  // Event Handlers
  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    if (['Pickup', 'Delivery', 'Quick Bill', 'Order/KOT', 'Billing'].includes(tab)) {
      setSelectedTable(null);
      setItems([]);
      setShowOrderDetails(true);
    } else setShowOrderDetails(false);
  };

  const handleIncreaseQty = (itemId: number) => setItems(items.map(item => item.id === itemId ? { ...item, qty: item.qty + 1 } : item));
  const handleDecreaseQty = (itemId: number) => setItems(items.filter(item => item.id !== itemId || item.qty > 1).map(item => item.id === itemId ? { ...item, qty: item.qty - 1 } : item));

  const totalAmount = items.reduce((sum, item) => sum + item.price * item.qty, 0).toFixed(2);

  useEffect(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    const cgstAmt = (subtotal * taxRates.cgst) / 100;
    const sgstAmt = (subtotal * taxRates.sgst) / 100;
    const igstAmt = (subtotal * taxRates.igst) / 100;
    const cessAmt = (subtotal * taxRates.cess) / 100;
    setTaxCalc({ subtotal, cgstAmt, sgstAmt, igstAmt, cessAmt, grandTotal: subtotal + cgstAmt + sgstAmt + igstAmt + cessAmt });
  }, [items, taxRates]);

  const getKOTLabel = () => `KOT 1 ${activeTab === 'Dine-in' && selectedTable ? `- Table ${selectedTable}` : activeTab}`;

  const handlePrintAndSaveKOT = async () => { /* ... */ };
  const handleBackToTables = () => setShowOrderDetails(false);

  // Floating Button Group Handlers
  const toggleOptions = () => setShowOptions(!showOptions);
  const showPanel = (panel: string) => setActivePanel(activePanel === panel ? null : panel);
  const applyTax = () => {
    setTaxRates(prev => ({ ...prev, ...taxValues }));
    setActivePanel(null);
  };
  const applyDiscount = () => {
    setDiscPer(discountValue);
    setActivePanel(null);
  };
  const saveNcKot = () => setActivePanel(null); // Add API call if needed

  return (
    <div className="container-fluid vh-100 d-flex flex-column p-0">
      <div className="flex-grow-1 d-flex">
        {/* {showOrderDetails && (
          // <div className="rounded shadow-sm p-1 mt-0 w-100">
          //   <OrderDetails
          //     tableId={selectedTable}
          //     onChangeTable={handleBackToTables}
          //     items={items}
          //     setItems={setItems}
          //     setSelectedTable={setSelectedTable}
          //     invalidTable={searchTable}
          //     setInvalidTable={setSearchTable}
          //     filteredTables={filteredTables}
          //     setSelectedDeptId={setSelectedDeptId}
          //     setSelectedOutletId={setSelectedOutletId}
          //   />
          // </div>
        )} */}
      </div>
      <div className="billing-panel border-start p-0">
        <div className="rounded shadow-sm p-1 w-100 billing-panel-inner">
          <div>
            <div className="d-flex flex-wrap gap-1 border-bottom pb-0">
              {['Dine-in', 'Pickup', 'Delivery', 'Quick Bill', 'Order/KOT', 'Billing'].map((tab, index) => (
                <button
                  key={index}
                  className={`btn btn-sm flex-fill text-center ${activeTab === tab ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => handleTabClick(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
            <div className="text-center fw-bold bg-white border rounded p-2">{getKOTLabel()}</div>
            <div className="rounded border fw-bold text-black" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '0.5rem' }}>
              <span style={{ textAlign: 'left' }}>Item Name</span>
              <span className="text-center">Qty</span>
              <span className="text-center">Amount</span>
            </div>
          </div>
          <div ref={itemListRef} className="border rounded item-list-container">
            {items.length === 0 ? (
              <p className="text-center text-muted mb-0">No items added</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="border-bottom" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', padding: '0.25rem', alignItems: 'center' }}>
                  <span style={{ textAlign: 'left' }}>{item.name}</span>
                  <div className="text-center d-flex justify-content-center align-items-center gap-2">
                    <button className="btn btn-danger btn-sm" style={{ padding: '0 5px', lineHeight: '1' }} onClick={() => handleDecreaseQty(item.id)}>-</button>
                    <input
                      type="number"
                      value={item.qty}
                      onChange={(e) => {
                        const newQty = parseInt(e.target.value) || 0;
                        setItems(items.map(i => i.id === item.id ? { ...i, qty: newQty } : i).filter(i => i.qty > 0));
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
                    <div style={{ fontSize: '0.75rem', color: '#6c757d', width: '50px', height: '16px', margin: '0 auto' }}>
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
                <div className="border rounded d-flex align-items-center justify-content-center" style={{ width: '50px', height: '30px', fontSize: '0.875rem', cursor: 'pointer' }} onClick={() => {}}>
                  +91
                </div>
                <input
                  type="text"
                  placeholder="Mobile No"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
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
                <button className="btn btn-outline-primary ms-1" style={{ height: '30px', padding: '0 8px', fontSize: '0.875rem' }} onClick={() => {}}>
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
                <div style={{ position: 'relative', maxWidth: '120px', minHeight: '38px' }}>
                  <div className="input-group rounded-search">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Table"
                      value={searchTable}
                      onChange={(e) => setSearchTable(e.target.value)}
                      style={{ maxWidth: '120px', minHeight: '38px', fontSize: '1.2rem', padding: '0.375rem' }}
                    />
                    {isTableInvalid && <div className="text-danger small text-center mt-1">Invalid Table</div>}
                  </div>
                  {/* Floating Action Buttons */}
                  <div className="action-buttons-container" style={{ position: 'absolute', top: '-50px', right: '-180px', zIndex: 1000 }}>
                    <button
                      type="button"
                      className="btn btn-primary rounded-circle action-toggle"
                      onClick={toggleOptions}
                      aria-expanded={showOptions}
                      aria-controls="action-menu"
                      style={{ width: '42px', height: '42px', fontSize: '1.1rem', padding: 0 }}
                    >
                      ⋮
                    </button>
                    {showOptions && (
                      <div id="action-menu" className="action-menu" role="toolbar" aria-label="Additional actions">
                        <button
                          type="button"
                          className="btn btn-outline-primary action-btn"
                          onClick={() => showPanel('tax')}
                          aria-controls="tax-panel"
                          aria-expanded={activePanel === 'tax'}
                        >
                          Tax
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-primary action-btn"
                          onClick={() => showPanel('discount')}
                          aria-controls="discount-panel"
                          aria-expanded={activePanel === 'discount'}
                        >
                          Discount
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-primary action-btn"
                          onClick={() => showPanel('ncKot')}
                          aria-controls="ncKot-panel"
                          aria-expanded={activePanel === 'ncKot'}
                        >
                          NCKOT
                        </button>
                      </div>
                    )}
                    {/* Action Panels */}
                    {activePanel === 'tax' && (
                      <div id="tax-panel" className="action-panel" role="region" aria-labelledby="tax-label">
                        <h6 id="tax-label" className="panel-title">Tax Settings</h6>
                        <div className="form-group">
                          <label htmlFor="cgst">CGST (%)</label>
                          <input
                            id="cgst"
                            type="number"
                            className="form-control"
                            value={taxValues.cgst}
                            onChange={(e) => setTaxValues({ ...taxValues, cgst: Number(e.target.value) || 0 })}
                            step="0.1"
                            min="0"
                            max="100"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="sgst">SGST (%)</label>
                          <input
                            id="sgst"
                            type="number"
                            className="form-control"
                            value={taxValues.sgst}
                            onChange={(e) => setTaxValues({ ...taxValues, sgst: Number(e.target.value) || 0 })}
                            step="0.1"
                            min="0"
                            max="100"
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="igst">IGST (%)</label>
                          <input
                            id="igst"
                            type="number"
                            className="form-control"
                            value={taxValues.igst}
                            onChange={(e) => setTaxValues({ ...taxValues, igst: Number(e.target.value) || 0 })}
                            step="0.1"
                            min="0"
                            max="100"
                          />
                        </div>
                        <button className="btn btn-primary btn-sm mt-2" onClick={applyTax}>Apply</button>
                      </div>
                    )}
                    {activePanel === 'discount' && (
                      <div id="discount-panel" className="action-panel" role="region" aria-labelledby="discount-label">
                        <h6 id="discount-label" className="panel-title">Discount Settings</h6>
                        <div className="form-group">
                          <label htmlFor="discount-type">Type</label>
                          <select
                            id="discount-type"
                            className="form-control"
                            value={DiscountType}
                            onChange={(e) => setDiscountType(Number(e.target.value))}
                          >
                            <option value={0}>Percentage</option>
                            <option value={1}>Amount</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label htmlFor="discount-value">Value</label>
                          <input
                            id="discount-value"
                            type="number"
                            className="form-control"
                            value={discountValue}
                            onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
                            step={DiscountType === 0 ? "0.5" : "1"}
                            min={DiscountType === 0 ? "0.5" : "0"}
                            max={DiscountType === 0 ? "100" : ""}
                          />
                        </div>
                        <button className="btn btn-primary btn-sm mt-2" onClick={applyDiscount}>Apply</button>
                      </div>
                    )}
                    {activePanel === 'ncKot' && (
                      <div id="ncKot-panel" className="action-panel" role="region" aria-labelledby="ncKot-label">
                        <h6 id="ncKot-label" className="panel-title">NCKOT Settings</h6>
                        <div className="form-group">
                          <label htmlFor="nc-name">Name</label>
                          <input
                            id="nc-name"
                            type="text"
                            className="form-control"
                            value={ncData.name}
                            onChange={(e) => setNcData({ ...ncData, name: e.target.value })}
                          />
                        </div>
                        <div className="form-group">
                          <label htmlFor="nc-purpose">Purpose</label>
                          <input
                            id="nc-purpose"
                            type="text"
                            className="form-control"
                            value={ncData.purpose}
                            onChange={(e) => setNcData({ ...ncData, purpose: e.target.value })}
                          />
                        </div>
                        <button className="btn btn-primary btn-sm mt-2" onClick={saveNcKot}>Save</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="mt-1">
              <div className="bg-white border rounded p-2">
                <div className="d-flex justify-content-between"><span>Subtotal</span><span>{taxCalc.subtotal.toFixed(2)}</span></div>
                {taxRates.cgst > 0 && <div className="d-flex justify-content-between"><span>CGST ({taxRates.cgst}%)</span><span>{taxCalc.cgstAmt.toFixed(2)}</span></div>}
                {taxRates.sgst > 0 && <div className="d-flex justify-content-between"><span>SGST ({taxRates.sgst}%)</span><span>{taxCalc.sgstAmt.toFixed(2)}</span></div>}
                {taxRates.igst > 0 && <div className="d-flex justify-content-between"><span>IGST ({taxRates.igst}%)</span><span>{taxCalc.igstAmt.toFixed(2)}</span></div>}
                {taxRates.cess > 0 && <div className="d-flex justify-content-between"><span>CESS ({taxRates.cess}%)</span><span>{taxCalc.cessAmt.toFixed(2)}</span></div>}
                {DiscPer > 0 && <div className="d-flex justify-content-between"><span>Discount ({DiscPer}%)</span><span>{((taxCalc.grandTotal * DiscPer) / 100).toFixed(2)}</span></div>}
                <hr className="my-2" />
                <div className="d-flex justify-content-between align-items-center bg-success text-white rounded p-1">
                  <span className="fw-bold">Grand Total</span>
                  <div>
                    <span className="fw-bold me-2">{(taxCalc.grandTotal - (taxCalc.grandTotal * DiscPer / 100)).toFixed(2)}</span>
                    <Button variant="outline-light" size="sm" onClick={() => {}}>Apply Discount</Button>
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-center gap-2 mt-2">
                <button className="btn btn-dark rounded" onClick={handlePrintAndSaveKOT} disabled={items.length === 0 || isTableInvalid}>
                  Print & Save KOT
                </button>
                <button className="btn btn-info rounded" onClick={() => setShowSavedKOTsModal(true)}>
                  View Saved KOTs
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Order;

