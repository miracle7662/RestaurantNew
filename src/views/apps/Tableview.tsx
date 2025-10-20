import React, { useState, useEffect } from 'react';
import { RefreshCw, Plus } from 'lucide-react';
import { useAuthContext } from '@/common';

// Types
type TableStatus = 'blank' | 'running' | 'printed' | 'paid' | 'running-kot' | 'occupied' | 'available';

interface Table {
  id: number;
  name: string;
  status: TableStatus;
  hasCustomer?: boolean;
  hasView?: boolean;
  outletid?: number;
}

interface TableApiData {
  id: number;
  name: string;
  status: TableStatus;
  hasCustomer?: boolean;
  hasView?: boolean;
}

interface Outlet {
  outletid: number;
  outlet_name: string;
}

// Table Card Component
const TableCard: React.FC<{ table: TableApiData }> = ({ table }) => {
  const getStatusClass = (status: TableStatus): string => {
    switch (status) {
      case 'running': return 'bg-primary text-white';
      case 'printed': return 'bg-success text-white';
      case 'paid': return 'bg-light border';
      case 'running-kot': return 'bg-warning-orange';
      case 'occupied': return 'bg-primary text-white'; // Map 'occupied' to 'running' style
      case 'available': return 'bg-light border'; // Map 'available' to 'blank' style
      default: return 'bg-light border';
    }
  };

  return (
    <div
      className={`card ${getStatusClass(table.status)} text-center p-2 cursor-pointer table-card`}
      style={{ minHeight: '70px', cursor: 'pointer' }}
    >
      <div className="card-body p-1">
        <h6 className="card-title mb-1 fw-bold" style={{ fontSize: '12px' }}>{table.name}</h6>
        {(table.hasCustomer || table.hasView) && (
          <div className="d-flex justify-content-center gap-1 mt-1">
            {table.hasCustomer && (
              <span className="badge rounded-circle bg-white bg-opacity-25 p-1" style={{ width: '20px', height: '20px' }}>
                👤
              </span>
            )}
            {table.hasView && (
              <span className="badge rounded-circle bg-white bg-opacity-25 p-1" style={{ width: '20px', height: '20px' }}>
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
    { label: 'Paid Table', color: '#f0f0f0', border: true },
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
  const [selectedOutletId, setSelectedOutletId] = useState<number | 'all'>('all');
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [allTables, setAllTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableInput, setTableInput] = useState('');
  const { user } = useAuthContext();

  useEffect(() => {
    const fetchTables = async () => {
      try {
        if (!user || !user.hotelid) {
          throw new Error('User not authenticated or hotel ID missing');
        }
        const params = new URLSearchParams({ hotelid: String(user.hotelid) });
        const response = await fetch(`http://localhost:3001/api/tablemanagement/with-outlets?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch tables');
        }
        const data = await response.json();
        const mappedTables: Table[] = data.map((t: any) => ({
          id: t.tableid,
          name: t.table_name,
          status: t.status, // 'occupied', 'available', 'reserved'
          outletid: t.outletid,
          // You might need to add logic for hasCustomer and hasView based on bill status
        }));
        setAllTables(mappedTables);
      } catch (err: any) {
        setError(err.message);
      }
    };

    const fetchOutlets = async () => {
      try {
        if (!user) {
          throw new Error('User not authenticated');
        }
        const params = new URLSearchParams({ role_level: user.role_level, hotelid: String(user.hotelid) });
        const response = await fetch(`http://localhost:3001/api/outlets?${params.toString()}`);

        if (!response.ok) {
          throw new Error('Failed to fetch outlets');
        }
        const data = await response.json();
        setOutlets(data);
      } catch (err: any) {
        setError(err.message);
      }
    };

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchTables(), fetchOutlets()]);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  // Group tables by their outletid
  const tablesByOutlet = allTables.reduce((acc, table) => {
    if (table.outletid) {
      if (!acc[table.outletid]) {
        acc[table.outletid] = [];
      }
      acc[table.outletid].push(table);
    }
    return acc;
  }, {} as Record<number, Table[]>);

  // Filter outlets to show based on dropdown selection
  const displayedOutlets = selectedOutletId === 'all' ? outlets : outlets.filter(o => o.outletid === selectedOutletId);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleTableInputEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const num = parseInt(tableInput);
      if (!isNaN(num) && selectedOutletId !== 'all') {
        const tables = tablesByOutlet[selectedOutletId] || [];
        const table = tables.find(t => t.id === num);
        if (table) {
          // Scroll to section first
          const outlet = outlets.find(o => o.outletid === selectedOutletId);
          const section = document.querySelector(`#outlet-section-${outlet?.outletid}`);
          section?.scrollIntoView({ behavior: 'smooth' });
          // Then to table
          setTimeout(() => {
            const tableId = `table-${table.id}-outlet-${selectedOutletId}`;
            const card = document.getElementById(tableId);
            card?.scrollIntoView({ behavior: 'smooth' });
          }, 500);
        }
      }
      setTableInput('');
    }
  };

  return (
    <div className="d-flex flex-column bg-light" style={{ height: '100vh', minHeight: '100vh' }}>
      <style>{`
        html, body, #root {
          height: 100vh;
          margin: 0;
          padding: 0;
          overflow: hidden;
        }
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
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .full-screen-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1050;
          background: white;
          border-bottom: 1px solid #dee2e6;
        }
        .full-screen-toolbar {
          position: fixed;
          top: 60px;
          left: 0;
          right: 0;
          z-index: 1049;
          background: white;
          border-bottom: 1px solid #dee2e6;
        }
        .full-screen-content {
          position: fixed;
          top: 120px;
          left: 0;
          right: 0;
          bottom: 0;
          overflow-y: auto;
        }
      `}</style>

      {/* Header */}
      <div className="full-screen-header">
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
      <div className="full-screen-toolbar">
        <div className="container-fluid py-3 px-3">
          <div className="row align-items-center">
            <div className="col-auto">
              <div className="d-flex gap-2">
                <input
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Table No"
                  value={tableInput}
                  onChange={e => setTableInput(e.target.value)}
                  onKeyDown={handleTableInputEnter}
                  style={{width: '100px'}}
                />
                <select
                  className="form-select form-select-sm"
                  value={selectedOutletId}
                  onChange={e => setSelectedOutletId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  style={{width: '120px'}}
                >
                  <option value="all">All Outlets</option>
                  {outlets.map(outlet => (
                    <option key={outlet.outletid} value={outlet.outletid}>
                      {outlet.outlet_name}
                    </option>
                  ))}
                </select>
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
      <div className="full-screen-content">
        {loading ? (
          <div className="d-flex justify-content-center align-items-center h-100">Loading...</div>
        ) : error ? (
          <div className="alert alert-danger m-3">{error}</div>
        ) : (
          <div className="p-3">
            {displayedOutlets.map(outlet => {
              const tablesForOutlet = tablesByOutlet[outlet.outletid] || [];
              return (
                <div key={outlet.outletid} id={`outlet-section-${outlet.outletid}`} className="mb-4">
                  <h6 className="fw-semibold mb-3 pb-2 border-bottom">{outlet.outlet_name}</h6>
                  {tablesForOutlet.length > 0 ? (
                    <div className="row row-cols-3 row-cols-sm-5 row-cols-md-7 row-cols-lg-9 row-cols-xl-10 g-2">
                      {tablesForOutlet.map((table) => (
                        <div key={table.id} id={`table-${table.id}-outlet-${outlet.outletid}`} className="col">
                          <TableCard table={table} />
                        </div>
                      ))}
                    </div>
                  ) : (<p className="text-muted">No tables found for this outlet.</p>)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}