import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw } from 'lucide-react';
import { useAuthContext } from '@/common';
import { useNavigate } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';

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
  txnId?: number | null;
  TxnNo?: string | null;
}

interface Department {
  departmentid: number;
  department_name: string;
}

// Table Card Component
const TableCard: React.FC<{ table: Table; onClick: () => void }> = ({ table, onClick }) => {
  const getStatusClass = (status: TableStatus): string => {
    switch (status) {
      case 'running': return 'bg-success';
      case 'printed': return 'bg-danger';
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
  const [showModal, setShowModal] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [focusedButton, setFocusedButton] = useState<'yes' | 'no'>('yes');
  const yesButtonRef = useRef<HTMLButtonElement>(null);
  const noButtonRef = useRef<HTMLButtonElement>(null);
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const tableInputRef = useRef<HTMLInputElement>(null);

  

  useEffect(() => {
    const fetchTables = async () => {
      setLoading(true);
      try {
        if (!user || !user.hotelid) {
          setError('User not authenticated or hotel ID missing');
          setAllTables([]);
          setLoading(false);
          return;
        }
        const res = await fetch('http://localhost:3001/api/tablemanagement', {
          headers: { 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const response = await res.json();
          console.log('Raw tableItems data:', JSON.stringify(response, null, 2));
          const filteredData = response.data.filter((t: any) => t.hotelid === user.hotelid);
          if (response.success && Array.isArray(filteredData)) {
            const formattedData = await Promise.all(
              filteredData.map(async (item: any) => {
                let status = Number(item.status);

                // Fetch bill status for each table from backend
                const res = await fetch(`http://localhost:3001/api/TAxnTrnbill/bill-status/${item.tableid}`);
                const data = await res.json();

                let txnId: number | null = null;
                if (data.success && data.data) {
                  const { isBilled, isSetteled, TxnID } = data.data;
                  txnId = TxnID || null;

                  if (isBilled === 1 && isSetteled !== 1) status = 2; // 🔴 red when billed but not settled
                  if (isSetteled === 1) status = 0; // ⚪ vacant when settled
                }

                let statusString: TableStatus;
                switch (status) {
                  case 0: statusString = 'available'; break;
                  case 1: statusString = 'running'; break;
                  case 2: statusString = 'printed'; break;
                  case 3: statusString = 'paid'; break;
                  case 4: statusString = 'running-kot'; break;
                  default: statusString = 'available'; break;
                }

                return { id: item.tableid, name: item.table_name, status: statusString, outletid: item.outletid, departmentid: item.departmentid, department_name: item.department_name, txnId };
              })
            );

            setAllTables(formattedData);
            setError('');
          } else if (response.success && filteredData.length === 0) {
            setError('No tables found in TableManagement API.');
            setAllTables([]);
          } else {
            setError(response.message || 'Invalid data format received from TableManagement API.');
            setAllTables([]);
          }
        } else {
          setError(`Failed to fetch tables: ${res.status} ${res.statusText}`);
          setAllTables([]);
        }
      } catch (err) {
        console.error('Table fetch error:', err);
        setError('Failed to fetch tables. Please check the API endpoint.');
        setAllTables([]);
      } finally {
        setLoading(false);
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

  // Focus the table input field when the component mounts
  useEffect(() => {
    if (tableInputRef.current) {
      tableInputRef.current.focus();
    }
  }, []);

  // Handle keyboard events for modal
  useEffect(() => {
    if (!showModal || !selectedTable) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        setFocusedButton('yes');
        yesButtonRef.current?.focus();
      } else if (event.key === 'ArrowRight') {
        setFocusedButton('no');
        noButtonRef.current?.focus();
      } else if (event.key === 'Enter') {
        if (focusedButton === 'yes') {
          navigate('/apps/Billview', { state: { tableId: selectedTable.id, tableName: selectedTable.name, outletId: selectedTable.outletid, openSettlement: true, txnId: selectedTable.txnId } });
        } else {
          navigate('/apps/Billview', { state: { tableId: selectedTable.id, tableName: selectedTable.name, outletId: selectedTable.outletid, txnId: selectedTable.txnId } });
        }
        setShowModal(false);
      } else if (event.key === 'n' || event.key === 'N') {
        // No action
        navigate('/apps/Billview', { state: { tableId: selectedTable.id, tableName: selectedTable.name, outletId: selectedTable.outletid, txnId: selectedTable.txnId } });
        setShowModal(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showModal, selectedTable, navigate, focusedButton]);

  // Focus the yes button when modal opens
  useEffect(() => {
    if (showModal && yesButtonRef.current) {
      yesButtonRef.current.focus();
    }
  }, [showModal]);

  // Handle Ctrl + number keys for department selection
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey) {
        const key = event.key;
        if (key === '0') {
          setSelectedDepartmentId('all');
        } else if (key >= '1' && key <= '9') {
          const index = parseInt(key) - 1;
          if (departments[index]) {
            setSelectedDepartmentId(departments[index].departmentid);
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [departments]);

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

  const handleTakeAwayClick = () => {
    navigate('/apps/Billview', { state: { orderType: 'TAKEAWAY', tableId: null, tableName: 'Take Away', outletId: user?.outletid } });
  };

  const handleTableClick = (table: Table) => {
          if (table.status === 'printed') {
            setSelectedTable(table);
            setShowModal(true);
          } else {
            navigate('/apps/Billview', { state: { tableId: table.id, tableName: table.name, outletId: table.outletid } });
          }
  };

  const handleTableInputEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const input = tableInput.trim();
      if (input) {
        const tables = selectedDepartmentId === 'all' ? allTables : tablesByDepartment[selectedDepartmentId] || [];
        const table = tables.find(t => t.name === input);
        if (table) {
          if (table.status === 'printed') {
            setSelectedTable(table);
            setShowModal(true);
          } else {
            navigate('/apps/Billview', { state: { tableId: table.id, tableName: table.name, outletId: table.outletid } });
          }
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
              <button className="btn btn-danger btn-sm" onClick={handleTakeAwayClick}>Take Away</button>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="full-screen-toolbar">
        <div className="container-fluid  ">
          <div className="row align-items-center">
            <div className="col-auto">
              <div className="d-flex gap-2">
                <input
                  ref={tableInputRef}
                  type="number"
                  className="form-control form-control-sm"
                  placeholder="Table"
                  value={tableInput}
                  onChange={e => setTableInput(e.target.value)}
                  onKeyDown={handleTableInputEnter}
                  style={{width: '130px', fontWeight: 'bold',fontSize:'25px',height:'60px'}}
                />
                <select
                  className="form-select form-select-sm"
                  value={selectedDepartmentId}
                  onChange={e => setSelectedDepartmentId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  style={{width: '290px', fontWeight: 'bold',fontSize:'20px'}}
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

        {/* Take Away Section */}
        <div className="mb-4">
          <h6 className="fw-semibold mb-3 pb-2 border-bottom">Take Away</h6>
          <div className="table-grid">
            <div
              className="bg-warning cursor-pointer table-card d-flex align-items-center justify-content-center"
              style={{
                width: '100px',
                height: '70px',
                borderRadius: '6px',
                cursor: 'pointer',
                border: '1px solid #ddd',
                padding: '4px'
              }}
              onClick={() => navigate('/apps/Billview', { state: { orderType: 'TAKEAWAY', tableId: null, tableName: 'Take Away', outletId: user?.outletid } })}
            >
              <span className="text-dark fw-bold" style={{ fontSize: '13px', lineHeight: '1.2' }}>Take Away</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered size="sm">
        <Modal.Header closeButton>
          <Modal.Title>Next Process</Modal.Title>
        </Modal.Header>
        <Modal.Body>
           <p className="mt-2">
    Select <strong>Yes</strong> Do you want to open the bill for settlement.
    <br />
    Select <strong>No</strong> Do you want to Modify the bill.
  </p>
        </Modal.Body>
        <Modal.Footer>

          <Button ref={yesButtonRef} variant="primary" onClick={() => {
            if (selectedTable) {
              navigate('/apps/Billview', { state: { tableId: selectedTable.id, tableName: selectedTable.name, outletId: selectedTable.outletid, openSettlement: true, txnId: selectedTable.txnId } });
            }
            setShowModal(false);
          }}>
            Yes -
          </Button>
           <Button ref={noButtonRef} variant="secondary" onClick={() => {
            if (selectedTable) {
              navigate('/apps/Billview', { state: { tableId: selectedTable.id, tableName: selectedTable.name, outletId: selectedTable.outletid, txnId: selectedTable.txnId } });
            }
            setShowModal(false);
          }}>
            No
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
