import React, { useState } from 'react';
import { RefreshCw, Plus } from 'lucide-react';

// Types
type TableStatus = 'blank' | 'running' | 'printed' | 'paid' | 'running-kot';

interface Table {
  id: number;
  name: string;
  status: TableStatus;
  hasCustomer?: boolean;
  hasView?: boolean;
}

// Table data
const acTables: Table[] = [
  { id: 1, name: 'Table 1', status: 'blank' },
  { id: 2, name: 'Table 2', status: 'running', hasCustomer: true },
  { id: 3, name: 'Table 3', status: 'blank' },
  { id: 4, name: 'Table 4', status: 'blank' },
  { id: 5, name: 'Table 5', status: 'running', hasCustomer: true },
  { id: 6, name: 'Table 6', status: 'blank' },
  { id: 7, name: 'Table 7', status: 'blank' },
  { id: 8, name: 'Table 8', status: 'running', hasCustomer: true },
  { id: 9, name: 'Table 9', status: 'paid', hasCustomer: true, hasView: true },
  { id: 10, name: 'Table 10', status: 'blank' },
  { id: 11, name: 'Table 11', status: 'blank' },
  { id: 12, name: 'Table 12', status: 'running', hasCustomer: true },
  { id: 13, name: 'Table 13', status: 'blank' },
  { id: 14, name: 'Table 14', status: 'printed', hasCustomer: true },
  { id: 15, name: 'Table 15', status: 'blank' },
  { id: 16, name: 'Table 16', status: 'blank' },
  { id: 17, name: 'Table 17', status: 'blank' },
  { id: 18, name: 'Table 18', status: 'blank' },
  { id: 19, name: 'Table 19', status: 'paid', hasCustomer: true, hasView: true },
  { id: 20, name: 'Table 20', status: 'blank' },
  { id: 21, name: 'Table 21', status: 'blank' },
  { id: 22, name: 'Table 22', status: 'blank' },
  { id: 23, name: 'Table 23', status: 'blank' },
  { id: 24, name: 'Table 24', status: 'blank' },
  { id: 25, name: 'Table 25', status: 'blank' },
  { id: 26, name: 'Table 26', status: 'printed', hasCustomer: true },
  { id: 27, name: 'Table 27', status: 'running-kot', hasCustomer: true, hasView: true },
  { id: 28, name: 'Table 28', status: 'paid', hasCustomer: true, hasView: true },
];

const nonAcTables: Table[] = [
  { id: 1, name: 'Table 1', status: 'blank' },
  { id: 2, name: 'Table 2', status: 'paid', hasCustomer: true, hasView: true },
  { id: 3, name: 'Table 3', status: 'blank' },
  { id: 4, name: 'Table 4', status: 'blank' },
  { id: 5, name: 'Table 5', status: 'paid', hasCustomer: true, hasView: true },
  { id: 6, name: 'Table 6', status: 'blank' },
  { id: 7, name: 'Table 7', status: 'blank' },
  { id: 8, name: 'Table 8', status: 'paid', hasCustomer: true, hasView: true },
  { id: 9, name: 'Table 9', status: 'blank' },
];

// Table Card Component
const TableCard: React.FC<{ table: Table }> = ({ table }) => {
  const getStatusClass = (status: TableStatus): string => {
    switch (status) {
      case 'running': return 'bg-primary text-white';
      case 'printed': return 'bg-success text-white';
      case 'paid': return 'bg-warning';
      case 'running-kot': return 'bg-warning-orange';
      default: return 'bg-light border';
    }
  };

  return (
    <div 
      className={`card ${getStatusClass(table.status)} text-center p-3 cursor-pointer table-card`}
      style={{ minHeight: '100px', cursor: 'pointer' }}
    >
      <div className="card-body p-2">
        <h6 className="card-title mb-2 fw-bold" style={{ fontSize: '13px' }}>{table.name}</h6>
        {(table.hasCustomer || table.hasView) && (
          <div className="d-flex justify-content-center gap-2 mt-2">
            {table.hasCustomer && (
              <span className="badge rounded-circle bg-white bg-opacity-25 p-1" style={{ width: '24px', height: '24px' }}>
                👤
              </span>
            )}
            {table.hasView && (
              <span className="badge rounded-circle bg-white bg-opacity-25 p-1" style={{ width: '24px', height: '24px' }}>
                👁
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Legend Component
const Legend: React.FC = () => {
  const legendItems = [
    { label: 'Move KOT / Serve', color: '#f0f0f0', border: true },
    { label: 'Blank Table', color: '#f0f0f0', border: true },
    { label: 'Running Table', color: '#0d6efd' },
    { label: 'Printed Table', color: '#198754' },
    { label: 'Paid Table', color: '#ffc107' },
    { label: 'Running KOT Table', color: '#fd7e14' },
  ];

  return (
    <div className="d-flex gap-3 flex-wrap align-items-center">
      {legendItems.map((item, idx) => (
        <div key={idx} className="d-flex align-items-center gap-2">
          <div 
            style={{ 
              width: '16px', 
              height: '16px', 
              backgroundColor: item.color,
              border: item.border ? '1px solid #ddd' : 'none',
              borderRadius: '3px'
            }}
          />
          <small className="text-muted">{item.label}</small>
        </div>
      ))}
    </div>
  );
};

// Main App Component
export default function App() {
  const [selectedLayout, setSelectedLayout] = useState('Default Layout');

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="vh-100 d-flex flex-column bg-light">
      <style>{`
        .table-card {
          transition: all 0.2s ease;
        }
        .table-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .bg-warning-orange {
          background-color: #fd7e14 !important;
        }
        .main-content {
          overflow-y: auto;
          height: calc(100vh - 140px);
        }
        .cursor-pointer {
          cursor: pointer;
        }
      `}</style>

      {/* Header */}
      <div className="bg-white border-bottom">
        <div className="container-fluid py-2 px-3">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 fw-semibold">Table View</h5>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary btn-sm" onClick={handleRefresh}>
                <RefreshCw size={16} />
              </button>
              <button className="btn btn-danger btn-sm">Delivery</button>
              <button className="btn btn-danger btn-sm">Take Away</button>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-bottom">
        <div className="container-fluid py-3 px-3">
          <div className="row align-items-center">
            <div className="col-auto">
              <div className="d-flex gap-2">
                <button className="btn btn-danger btn-sm">
                  <Plus size={16} className="me-1" />
                  Table Reservation
                </button>
                <button className="btn btn-danger btn-sm">
                  <Plus size={16} className="me-1" />
                  Contactless
                </button>
              </div>
            </div>
            
            <div className="col">
              <Legend />
            </div>
            
            <div className="col-auto">
              <div className="d-flex gap-2 align-items-center">
                <small className="text-muted">Floor Plan</small>
                <select 
                  className="form-select form-select-sm" 
                  style={{ width: 'auto' }}
                  value={selectedLayout}
                  onChange={(e) => setSelectedLayout(e.target.value)}
                >
                  <option>Default Layout</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="container-fluid p-3">
          {/* A/C Section */}
          <div className="mb-4">
            <h6 className="fw-semibold mb-3 pb-2 border-bottom">A/C</h6>
            <div className="row row-cols-2 row-cols-sm-4 row-cols-md-6 row-cols-lg-8 row-cols-xl-9 g-3">
              {acTables.map((table) => (
                <div key={table.id} className="col">
                  <TableCard table={table} />
                </div>
              ))}
            </div>
          </div>

          {/* Non A/C Section */}
          <div className="mb-4">
            <h6 className="fw-semibold mb-3 pb-2 border-bottom">Non A/C</h6>
            <div className="row row-cols-2 row-cols-sm-4 row-cols-md-6 row-cols-lg-8 row-cols-xl-9 g-3">
              {nonAcTables.map((table) => (
                <div key={table.id} className="col">
                  <TableCard table={table} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}