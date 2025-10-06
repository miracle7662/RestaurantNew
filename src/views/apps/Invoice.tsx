// src/App.js
import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';


// Mock data
const initialData = {
  tables: [
    {
      id: 'C4',
      outlet: 'Classic Veg',
      status: 'OCCUPIED',
      kotNumber: 24,
      pax: 4,
      date: '19/Oct/2010',
      items: [
        { id: 1, name: 'Masala Uttapra', quantity: 1, price: 60, media: 'C4', isFixed: false },
        { id: 2, name: 'Rose Lassi', quantity: 1, price: 40, media: 'C4', isFixed: false },
        { id: 3, name: 'Cheese Chilly Toast', quantity: 1, price: 30, media: 'C4', isFixed: true }
      ]
    },
    {
      id: 'C1',
      outlet: 'Classic Veg',
      status: 'VACANT',
      kotNumber: 21,
      pax: 2,
      date: '19/Oct/2010',
      items: [
        { id: 4, name: 'Tomato Uttapra', quantity: 1, price: 50, media: 'C1', isFixed: false },
        { id: 5, name: 'Alu Palak', quantity: 1, price: 21, media: 'C1', isFixed: false }
      ]
    },
    {
      id: 'C2',
      outlet: 'Classic Veg',
      status: 'OCCUPIED',
      kotNumber: 25,
      pax: 3,
      date: '19/Oct/2010',
      items: [
        { id: 6, name: 'Paneer Butter Masala', quantity: 1, price: 180, media: 'C2', isFixed: false },
        { id: 7, name: 'Butter Naan', quantity: 2, price: 30, media: 'C2', isFixed: false }
      ]
    }
  ]
};

function App() {
  const [tables, setTables] = useState(initialData.tables);
  const [selectedTable, setSelectedTable] = useState(initialData.tables[0]);
  const [proposedTable, setProposedTable] = useState(initialData.tables[1]);
  const [transferMode, setTransferMode] = useState('TABLE'); // 'TABLE' or 'KOT'
  const [selectedItems, setSelectedItems] = useState([]);
  const [includeFixedItems, setIncludeFixedItems] = useState(false);

  // Calculate totals
  const calculateTotal = (items) => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const sourceTotal = calculateTotal(selectedTable.items);
  const targetTotal = calculateTotal(proposedTable.items);
  const transferTotal = calculateTotal(selectedItems);
  
  const financials = {
    sourceTotal: sourceTotal - transferTotal,
    targetTotal: targetTotal + transferTotal,
    variance: transferTotal,
    changeAmount: transferTotal
  };

  // Handle item selection
  const handleItemSelect = (item) => {
    if (selectedItems.some(selected => selected.id === item.id)) {
      setSelectedItems(selectedItems.filter(selected => selected.id !== item.id));
    } else {
      if (!item.isFixed || includeFixedItems) {
        setSelectedItems([...selectedItems, item]);
      }
    }
  };

  // Handle transfer
  const handleTransfer = () => {
    if (selectedItems.length === 0) return;

    const updatedTables = tables.map(table => {
      if (table.id === selectedTable.id) {
        // Remove items from source table
        return {
          ...table,
          items: table.items.filter(item => 
            !selectedItems.some(selected => selected.id === item.id)
          )
        };
      }
      if (table.id === proposedTable.id) {
        // Add items to target table
        return {
          ...table,
          items: [...table.items, ...selectedItems.map(item => ({
            ...item,
            media: table.id,
            kotNumber: table.kotNumber
          }))]
        };
      }
      return table;
    });

    setTables(updatedTables);
    setSelectedItems([]);
    
    // Update selected and proposed tables
    setSelectedTable(updatedTables.find(t => t.id === selectedTable.id));
    setProposedTable(updatedTables.find(t => t.id === proposedTable.id));
  };

  // Select all items
  const handleSelectAll = () => {
    const itemsToSelect = includeFixedItems 
      ? selectedTable.items 
      : selectedTable.items.filter(item => !item.isFixed);
    
    setSelectedItems(itemsToSelect);
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedItems([]);
  };

  // Function keys
  const functionKeys = [
    { key: 'F2', label: 'KOT Tr', action: () => setTransferMode('KOT') },
    { key: 'F5', label: 'Rev Bill', action: () => console.log('Reverse Bill') },
    { key: 'F7', label: 'TBL Tr', action: () => setTransferMode('TABLE') },
    { key: 'F6', label: 'New Bill', action: () => console.log('New Bill') },
    { key: 'F8', label: 'Rev KOT', action: () => console.log('Reverse KOT') },
    { key: 'F9', label: 'Save', action: handleTransfer },
    { key: 'F10', label: 'Print', action: () => console.log('Print') },
    { key: 'F11', label: 'Settle', action: () => console.log('Settle') },
    { key: 'Esc', label: 'Exit', action: () => console.log('Exit') },
  ];

  return (
    <div className="App bg-light min-vh-100">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container-fluid">
          <div className="row align-items-center py-3">
            <div className="col">
              <h1 className="h3 mb-0 text-primary fw-bold">
                Table Transfer / KOT Transfer
              </h1>
              <p className="text-muted mb-0">Restaurant Management System</p>
            </div>
            <div className="col-auto">
              <div className="btn-group" role="group">
                <button 
                  className={`btn ${transferMode === 'TABLE' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setTransferMode('TABLE')}
                >
                  Table Transfer
                </button>
                <button 
                  className={`btn ${transferMode === 'KOT' ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setTransferMode('KOT')}
                >
                  KOT Transfer
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container-fluid py-4">
        <div className="row g-4">
          {/* Selected Table Section */}
          <div className="col-lg-6">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-primary text-white">
                <h5 className="card-title mb-0">
                  Selected Table ({transferMode === 'TABLE' ? 'All KOTs' : 'Selected KOT Only'})
                </h5>
              </div>
              <div className="card-body">
                {/* Table Information */}
                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label small text-muted fw-bold">Table</label>
                      <select 
                        className="form-select"
                        value={selectedTable.id}
                        onChange={(e) => setSelectedTable(tables.find(t => t.id === e.target.value))}
                      >
                        {tables.map(table => (
                          <option key={table.id} value={table.id}>
                            {table.id} - {table.outlet}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small text-muted fw-bold">Outlet</label>
                      <p className="fw-semibold mb-0">{selectedTable.outlet}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="row">
                      <div className="col-4">
                        <label className="form-label small text-muted fw-bold">KOT</label>
                        <p className="fw-semibold mb-0">{selectedTable.kotNumber}</p>
                      </div>
                      <div className="col-4">
                        <label className="form-label small text-muted fw-bold">Pax</label>
                        <p className="fw-semibold mb-0">{selectedTable.pax}</p>
                      </div>
                      <div className="col-4">
                        <label className="form-label small text-muted fw-bold">Date</label>
                        <p className="fw-semibold mb-0">{selectedTable.date}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="table-responsive mb-4">
                  <table className="table table-sm table-hover">
                    <thead className="table-dark">
                      <tr>
                        <th>Media</th>
                        <th>KOT No.</th>
                        <th>Item</th>
                        <th className="text-center">Qty</th>
                        <th className="text-center">Select</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTable.items.map(item => (
                        <tr 
                          key={item.id} 
                          className={item.isFixed ? 'table-warning' : ''}
                        >
                          <td className="fw-semibold">{item.media}</td>
                          <td>{selectedTable.kotNumber}</td>
                          <td>
                            {item.name}
                            {item.isFixed && (
                              <span className="badge bg-warning text-dark ms-2">Fixed</span>
                            )}
                          </td>
                          <td className="text-center">{item.quantity}</td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              checked={selectedItems.some(selected => selected.id === item.id)}
                              onChange={() => handleItemSelect(item)}
                              disabled={item.isFixed && !includeFixedItems}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Selection Actions */}
                <div className="row align-items-center mb-4">
                  <div className="col-md-8">
                    <div className="d-flex gap-2 flex-wrap">
                      <button 
                        className="btn btn-outline-secondary btn-sm"
                        onClick={handleSelectAll}
                      >
                        Select All
                      </button>
                      <button 
                        className="btn btn-outline-secondary btn-sm"
                        onClick={handleClearSelection}
                      >
                        Clear Selection
                      </button>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={includeFixedItems}
                          onChange={(e) => setIncludeFixedItems(e.target.checked)}
                          id="includeFixed"
                        />
                        <label className="form-check-label small" htmlFor="includeFixed">
                          Include Fixed Items
                        </label>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 text-end">
                    <span className="badge bg-info">
                      Selected: {selectedItems.length} items
                    </span>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="card bg-light">
                  <div className="card-body py-3">
                    <h6 className="card-title mb-3">Financial Summary</h6>
                    <div className="row text-center">
                      <div className="col-4">
                        <div className="small text-muted">Total Amount</div>
                        <div className="h6 mb-0 fw-bold text-primary">
                          ₹{financials.sourceTotal.toFixed(2)}
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="small text-muted">Variance</div>
                        <div className="h6 mb-0 fw-bold text-warning">
                          ₹{financials.variance.toFixed(2)}
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="small text-muted">Change Amount</div>
                        <div className="h6 mb-0 fw-bold text-success">
                          ₹{financials.changeAmount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Proposed Table Section */}
          <div className="col-lg-6">
            <div className="card shadow-sm h-100">
              <div className="card-header bg-success text-white">
                <h5 className="card-title mb-0">TRANSFER {transferMode}</h5>
              </div>
              <div className="card-body">
                {/* Proposed Table Information */}
                <div className="row mb-4">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label small text-muted fw-bold">Outlet</label>
                      <p className="fw-semibold mb-0">{proposedTable.outlet}</p>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small text-muted fw-bold">Table</label>
                      <select 
                        className="form-select"
                        value={proposedTable.id}
                        onChange={(e) => setProposedTable(tables.find(t => t.id === e.target.value))}
                      >
                        {tables.map(table => (
                          <option key={table.id} value={table.id}>
                            {table.id} - {table.outlet} ({table.status})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="row">
                      <div className="col-6">
                        <label className="form-label small text-muted fw-bold">Date</label>
                        <p className="fw-semibold mb-0">{proposedTable.date}</p>
                      </div>
                      <div className="col-6">
                        <label className="form-label small text-muted fw-bold">Pax</label>
                        <p className="fw-semibold mb-0">{proposedTable.pax}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span className={`badge ${proposedTable.status === 'OCCUPIED' ? 'bg-danger' : 'bg-success'} fs-6`}>
                        {proposedTable.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Target Items Table */}
                <div className="table-responsive mb-4">
                  <table className="table table-sm table-hover">
                    <thead className="table-dark">
                      <tr>
                        <th>Media</th>
                        <th>KOT No.</th>
                        <th>Item</th>
                        <th className="text-center">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposedTable.items.map(item => (
                        <tr key={item.id}>
                          <td className="fw-semibold">{item.media}</td>
                          <td>{proposedTable.kotNumber}</td>
                          <td>{item.name}</td>
                          <td className="text-center">{item.quantity}</td>
                        </tr>
                      ))}
                      {/* Items to be transferred */}
                      {selectedItems.map(item => (
                        <tr key={`transfer-${item.id}`} className="table-success">
                          <td className="fw-semibold">{proposedTable.id}</td>
                          <td>{proposedTable.kotNumber}</td>
                          <td>
                            {item.name} 
                            <span className="badge bg-success ms-2">→ Transferring</span>
                          </td>
                          <td className="text-center">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Transfer Actions */}
                <div className="d-grid mb-4">
                  <button 
                    className={`btn btn-success btn-lg ${selectedItems.length === 0 ? 'disabled' : ''}`}
                    onClick={handleTransfer}
                    disabled={selectedItems.length === 0}
                  >
                    <i className="bi bi-arrow-right-circle me-2"></i>
                    Transfer Selected Items ({selectedItems.length})
                  </button>
                </div>

                {/* After Transfer Financial Summary */}
                <div className="card bg-light">
                  <div className="card-body py-3">
                    <h6 className="card-title mb-3">After Transfer</h6>
                    <div className="row text-center">
                      <div className="col-4">
                        <div className="small text-muted">Total Amount</div>
                        <div className="h6 mb-0 fw-bold text-primary">
                          ₹{financials.targetTotal.toFixed(2)}
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="small text-muted">Variance</div>
                        <div className="h6 mb-0 fw-bold text-warning">
                          ₹{financials.variance.toFixed(2)}
                        </div>
                      </div>
                      <div className="col-4">
                        <div className="small text-muted">Change Amount</div>
                        <div className={`h6 mb-0 fw-bold ${financials.changeAmount > 0 ? 'text-success' : 'text-danger'}`}>
                          ₹{financials.changeAmount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Function Keys Panel */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  {functionKeys.map((fnKey) => (
                    <button
                      key={fnKey.key}
                      onClick={fnKey.action}
                      className="btn btn-outline-primary position-relative"
                      style={{ minWidth: '80px' }}
                    >
                      <div className="small text-muted">{fnKey.key}</div>
                      <div className="fw-semibold">{fnKey.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;