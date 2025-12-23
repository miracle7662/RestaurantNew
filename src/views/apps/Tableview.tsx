import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAuthContext } from '@/common';
import { useNavigate } from 'react-router-dom';

// Types
type TableStatus = 'blank' | 'running' | 'printed' | 'paid' | 'running-kot' | 'occupied' | 'available' | 'reserved';

interface Table {
  id: number;
  name: string;
  status: TableStatus;
  hasCustomer?: boolean;
  hasView?: boolean;
  outletid?: number;
  departmentid?: number;
  department_name?: string;
}

interface Department {
  departmentid: number;
  department_name: string;
}

// Table Card Component
const TableCard: React.FC<{ table: Table; onClick: () => void }> = ({ table, onClick }) => {
  const getStatusClass = (status: TableStatus): string => {
    switch (status) {
      case 'running': return 'bg-primary';
      case 'printed': return 'bg-success';
      case 'paid': return 'bg-white';
      case 'running-kot': return 'bg-warning-orange';
      case 'occupied': return 'bg-primary'; // Map 'occupied' to 'running' style
      case 'available': return 'bg-white'; // Map 'available' to 'blank' style
      case 'reserved': return 'bg-warning'; // Add handling for 'reserved' if needed
      default: return 'bg-white';
    }
  };

  return (
    <div
      className={`${getStatusClass(table.status)} cursor-pointer table-card d-flex align-items-center justify-content-center`}
      style={{
        width: '100px',
        height: '70px',
        borderRadius: '6px',
        cursor: 'pointer',
        border: '1px solid #ddd',
        padding: '4px'
      }}
      onClick={onClick}
    >
      <span className="text-dark fw-bold" style={{ fontSize: '13px', lineHeight: '1.2' }}>{table.name}</span>
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
    { label: 'Reserved Table', color: '#ffc107' },
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
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<number | 'all'>('all');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allTables, setAllTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tableInput, setTableInput] = useState('');
  const { user } = useAuthContext();
  const navigate = useNavigate();

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
          departmentid: t.departmentid,
          department_name: t.department_name,
          // You might need to add logic for hasCustomer and hasView based on bill status
        }));
        setAllTables(mappedTables);
      } catch (err: any) {
        setError(err.message);
      }
    };

    const fetchDepartments = async () => {
      try {
        if (!user) {
          throw new Error('User not authenticated');
        }
        const response = await fetch(`http://localhost:3001/api/table-department`);

        if (!response.ok) {
          throw new Error('Failed to fetch departments');
        }
        const data = await response.json();
        setDepartments(data.data || data);
      } catch (err: any) {
        setError(err.message);
      }
    };

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      await Promise.all([fetchTables(), fetchDepartments()]);
      setLoading(false);
    };

    fetchData();

    // Add event listener for Escape key
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        navigate('/');
      }
    };

    document.addEventListener('keydown', handleEscapeKey);

    // Cleanup event listener on unmount
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [user, navigate]);

  // Group tables by their departmentid
  const tablesByDepartment = allTables.reduce((acc, table) => {
    if (table.departmentid) {
      if (!acc[table.departmentid]) {
        acc[table.departmentid] = [];
      }
      acc[table.departmentid].push(table);
    }
    return acc;
  }, {} as Record<number, Table[]>);

  // Filter departments to show based on dropdown selection
  const displayedDepartments = selectedDepartmentId === 'all' ? departments : departments.filter(d => d.departmentid === selectedDepartmentId);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleTableClick = (table: Table) => {
    navigate('/apps/Billview', { state: { tableId: table.id, tableName: table.name } });
  };

  const handleTableInputEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const num = parseInt(tableInput);
      if (!isNaN(num) && selectedDepartmentId !== 'all') {
        const tables = tablesByDepartment[selectedDepartmentId] || [];
        const table = tables.find(t => t.id === num);
        if (table) {
          // Scroll to section first
          const department = departments.find(d => d.departmentid === selectedDepartmentId);
          const section = document.querySelector(`#department-section-${department?.departmentid}`);
          section?.scrollIntoView({ behavior: 'smooth' });
          // Then to table
          setTimeout(() => {
            const tableId = `table-${table.id}-department-${selectedDepartmentId}`;
            const card = document.getElementById(tableId);
            card?.scrollIntoView({ behavior: 'smooth' });
          }, 500);
        }
      }
      setTableInput('');
    }
  };

  return (
    <div className="d-flex flex-column" style={{ height: '100vh', minHeight: '100vh' }}>
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
        .table-grid .col {
          padding: 4px !important;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .table-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, 100px);
          gap: 10px;
          margin-bottom: 20px;
          justify-content: start;
        }
          .full-screen-toolbar input[placeholder="Table No"] {
          height: 40px;
          border: 2px solid #007bff;
          background-color: #e7f3ff;
          box-shadow: 0 0 5px rgba(0, 123, 255, 0.5);
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
                  style={{width: '90px', fontWeight: 'bold',fontSize:'16px'}}
                />
                <select
                  className="form-select form-select-sm"
                  value={selectedDepartmentId}
                  onChange={e => setSelectedDepartmentId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  style={{width: '120px'}}
                >
                  <option value="all">All Departments</option>
                  {departments.map(department => (
                    <option key={department.departmentid} value={department.departmentid}>
                      {department.department_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="col d-flex justify-content-end">
              <Legend />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="full-screen-content ">
        {loading ? (
          <div className="d-flex justify-content-center align-items-center h-100">Loading...</div>
        ) : error ? (
          <div className="alert alert-danger m-3">{error}</div>
        ) : (
          <div className="p-3">
            {displayedDepartments.map(department => {
              const tablesForDepartment = (tablesByDepartment[department.departmentid] || []).sort((a, b) => parseInt(a.name) - parseInt(b.name));
              return (
                <div key={department.departmentid} id={`department-section-${department.departmentid}`} className="mb-4">
                  <h6 className="fw-semibold mb-3 pb-2 border-bottom">{department.department_name}</h6>
                  {tablesForDepartment.length > 0 ? (
                    <div className="table-grid">
                      {tablesForDepartment.map((table) => (
                        <div key={table.id} id={`table-${table.id}-department-${department.departmentid}`} className="table-card-wrapper">
                          <TableCard table={table} onClick={() => handleTableClick(table)} />
                        </div>
                      ))}
                    </div>
                  ) : (<p className="text-muted">No tables found for this department.</p>)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}